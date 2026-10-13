// Smoke tests of the Verge3D side of skyluxHRoof.js against the REAL Verge3D 4.13 engine, with a stand-in
// app and scene (no browser, no GLB). Skipped when the engine is not found.
//     node --test        (from the JS folder)
// Engine path: V3D_PATH, or the default Verge3D for Blender install.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { createPL, sideAnchorRotationZ, sideLocalToWorld, parseSceneParameters, mm, DEV_SCOPES } from '../skyluxHRoof.js';

const ENGINE = process.env.V3D_PATH || 'C:/Program Files/Verge3D_for_Blender/build/v3d.js';
let v3d = null;
if (existsSync(ENGINE)) {
    // v3d.js is UMD; copied to .cjs so Node loads it as CommonJS whatever the install folder declares.
    const copy = join(mkdtempSync(join(tmpdir(), 'v3d-')), 'v3d.cjs');
    copyFileSync(ENGINE, copy);
    v3d = createRequire(import.meta.url)(copy);
    globalThis.window = globalThis;
}
const skip = v3d ? false : 'Verge3D engine not found (set V3D_PATH)';

const quiet = fn => {
    const saved = { info: console.info, warn: console.warn, table: console.table };
    const warnings = [];
    console.info = () => { };
    console.table = () => { };
    console.warn = message => warnings.push(String(message));
    try {
        fn();
    } finally {
        Object.assign(console, saved);
    }
    return warnings;
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-6, `${label}: ${actual} vs ${expected}`);

// A Blender-exported scene (Z-up) with one hidden template under a holder, like the real GLB, plus the
// top-level anchor template empty.0 (left out with { anchorTemplate: false }).
function makeApp({ anchorTemplate = true } = {}) {
    const scene = new v3d.Scene();
    scene.name = 'Scene';
    scene.userData.coordSystem = 'Z_UP_RIGHT';
    if (anchorTemplate) {
        const empty = new v3d.Object3D();
        empty.name = 'empty.0';
        scene.add(empty);
    }
    const holder = new v3d.Object3D();
    holder.name = 'globalManipulator';
    holder.visible = false;
    scene.add(holder);
    const template = new v3d.Mesh(new v3d.BoxGeometry(0.15, 2.5, 0.15), new v3d.MeshBasicMaterial());
    template.name = 'PoleTemplate';
    holder.add(template);
    // camera + direction empties as in the GLB (three.js Y-up coordinates)
    const camera = new v3d.PerspectiveCamera();
    camera.name = 'Camera';
    camera.position.set(0, 10, -15);
    scene.add(camera);
    for (const [name, position] of [['Camerapos', [0, 10, -15]], ['Cameratarget', [-1.4, 10, 0]]]) {
        const empty = new v3d.Object3D();
        empty.name = name;
        empty.position.fromArray(position);
        scene.add(empty);
    }
    scene.updateMatrixWorld(true);

    const calls = { enable: 0, disable: 0, snapshots: 0, load: [] };
    const app = {
        scene,
        controls: {},
        renderCallbacks: [],
        renderer: { domElement: { toDataURL: () => 'data:image/png;base64,' } },
        ExternalInterface: { getLoadPercentageFrom3D: p => calls.load.push(p) },
        getCamera: () => camera,
        enableRendering() { calls.enable++; },
        disableRendering() { calls.disable++; },
        _resizeCb() { },
    };
    return { app, scene, template, camera, calls };
}

function init(env, scope = {}) {
    return quiet(() => v3d.PL.init(env.app, scope, () => env.calls.snapshots++));
}

test('PL.init hides the GLB, registers the handlers, sends the snapshot and completes the loader', { skip }, async () => {
    createPL(v3d);
    const env = makeApp();
    const warnings = init(env);
    assert.equal(env.template.visible, false);
    for (const name of ['handleButtons', 'handleEvents', 'handleFocus', 'handleValue'])
        assert.equal(typeof v3d.PL.procedures[name], 'function', name);
    assert.ok(warnings.some(w => w.includes('DEV scope')));
    assert.equal(v3d.PL.debug.sceneParameters().sideOpenings.length, 4);
    quiet(() => {
        v3d.PL.procedures.handleButtons({ type: 'FULL_SCREEN' });
        v3d.PL.procedures.handleEvents({ step: { id: 'x' } });
        v3d.PL.procedures.handleFocus(null);
        v3d.PL.procedures.handleValue(undefined);
    });
    await wait(400);
    assert.equal(env.calls.snapshots, 1);
    assert.equal(Math.max(...env.calls.load), 100);
});

for (const [name, scope] of Object.entries(DEV_SCOPES)) {
    test(`${name}: poles cloned through SceneComponent land where sideLocalToWorld says`, { skip }, () => {
        createPL(v3d);
        const env = makeApp();
        init(env);
        const { SceneComponent, getObjTransform, setObjTransform } = v3d.PL.debug;
        const params = parseSceneParameters(scope);
        quiet(() => params.sideOpenings.forEach(side => {
            const component = new SceneComponent();
            component.beginBuild();
            component.placeAnchor(side.sideSpecs.xPos, side.sideSpecs.yPos, 0, sideAnchorRotationZ(side.sideSpecs.rotation));
            side.poles.forEach(pole => {
                const poleName = component.pool('PoleTemplate').next();
                setObjTransform(poleName, false, 'position', [mm(pole.position), mm(pole.depth / 2), 0], false);
                const world = getObjTransform(poleName, true, 'position', 'xyz');
                const expected = sideLocalToWorld(side.sideSpecs, pole.position, pole.depth / 2).map(mm);
                close(world[0], expected[0], `${side.side} pole ${pole.index} x`);
                close(world[1], expected[1], `${side.side} pole ${pole.index} y`);
                close(world[2], 0, `${side.side} pole ${pole.index} z`);
                // orientation: the pole's local +X must run along the side. Compared as a direction, since
                // Euler angles have several equivalent spellings (Z 180 == X 180 + Y 180).
                const obj = v3d.PL.debug.getObjectByName(poleName);
                obj.updateWorldMatrix(true, false);
                const axis = new v3d.Vector3(1, 0, 0).transformDirection(obj.matrixWorld);
                const along = sideLocalToWorld({ xPos: 0, yPos: 0, rotation: side.sideSpecs.rotation }, 1, 0);
                close(axis.x, along[0], `${side.side} pole local X → world X`);   // three.js (x, y, z) = Blender (x, z, -y)
                close(-axis.z, along[1], `${side.side} pole local X → world Y`);
                close(axis.y, 0, `${side.side} pole local X stays horizontal`);
                assert.equal(v3d.PL.debug.getObjectByName(poleName).visible, true);
            });
            component.endBuild();
        }));
    });
}

test('ObjectPool reuses clones across rebuilds and hides the ones a smaller build no longer needs', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const { SceneComponent, getObjectByName } = v3d.PL.debug;
    const component = new SceneComponent();
    const build = count => {
        component.beginBuild();
        const names = [];
        for (let i = 0; i < count; i++)
            names.push(component.pool('PoleTemplate').next());
        component.endBuild();
        return names;
    };
    const first = build(3);
    const objectCount = env.scene.children.length;
    const second = build(1);
    assert.equal(env.scene.children.length, objectCount, 'no new clones on a smaller build');
    assert.equal(second[0], first[0], 'same clone reused');
    assert.equal(getObjectByName(first[0]).visible, true);
    assert.equal(getObjectByName(first[1]).visible, false);
    assert.equal(getObjectByName(first[2]).visible, false);
    const third = build(4);
    assert.deepEqual(third.slice(0, 3), first, 'existing clones come back before new ones are made');
    assert.equal(new Set(third).size, 4);
});

test('a missing template is skipped with one warning instead of throwing', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const component = new v3d.PL.debug.SceneComponent();
    let results = [];
    const warnings = quiet(() => {
        results = [component.pool('DoesNotExist').next(), component.pool('DoesNotExist').next()];
    });
    assert.deepEqual(results, [null, null]);
    assert.equal(warnings.filter(w => w.includes('DoesNotExist')).length, 1);
});

test('hideLeftovers hides instances beyond the contract length through their anchor', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const { SceneComponent, hideLeftovers, getObjectByName } = v3d.PL.debug;
    const cache = [new SceneComponent(), new SceneComponent()];
    cache.forEach(component => component.beginBuild());
    hideLeftovers(cache, 1);
    assert.equal(getObjectByName(cache[0].anchor).visible, true);
    assert.equal(getObjectByName(cache[1].anchor).visible, false);
});

test('render gate: renders after a build, pauses when idle, wakes up when the camera moves', { skip }, async () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    assert.equal(env.app.renderCallbacks.length, 1, 'one gate per app');
    const tick = () => env.app.renderCallbacks.forEach(cb => cb(0.016, 0));
    tick();
    assert.equal(env.calls.disable, 0, 'still rendering right after the build');
    await wait(1100); // takeSnapshot keeps rendering for 1 s
    tick();
    tick();
    assert.equal(env.calls.disable, 1, 'paused once idle');
    env.camera.position.x += 1;
    tick();
    assert.equal(env.calls.enable, 1, 'woken up by camera movement');
    tick();
    tick();
    assert.equal(env.calls.disable, 2, 'paused again when the camera stops');
});

test('a new app resets the caches and installs its own render gate', { skip }, () => {
    createPL(v3d);
    const first = makeApp();
    init(first);
    v3d.PL.debug.sideOpeningCache.push('stale');
    const second = makeApp();
    init(second);
    assert.equal(v3d.PL.debug.sideOpeningCache.length, 0);
    assert.equal(second.app.renderCallbacks.length, 1);
    init(second);
    assert.equal(second.app.renderCallbacks.length, 1, 're-running PL.init on the same app adds no second gate');
});

test('anchors are clones of empty.0 from the GLB', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    let anchors = [];
    const warnings = quiet(() => {
        anchors = [new v3d.PL.debug.SceneComponent().anchor, new v3d.PL.debug.SceneComponent().anchor];
    });
    assert.deepEqual(warnings, []);
    anchors.forEach(anchor => assert.match(anchor, /^empty\.\d+$/));
    assert.notEqual(anchors[0], anchors[1]);
    assert.equal(v3d.PL.debug.getObjectByName(anchors[0]).parent, env.scene, 'top level, not under a holder');
});

test('without empty.0 in the GLB: one warning, no crash, objects still built (unparented)', { skip }, () => {
    createPL(v3d);
    const env = makeApp({ anchorTemplate: false });
    const initWarnings = init(env);   // PL.init already builds the roof section, so the warning fires here
    let names = [];
    const warnings = initWarnings.concat(quiet(() => {
        for (let i = 0; i < 2; i++) {
            const component = new v3d.PL.debug.SceneComponent();
            assert.equal(component.anchor, null);
            component.beginBuild();
            component.placeAnchor(1000, 2000, 0, 90);
            names.push(component.pool('PoleTemplate').next());
            component.endBuild();
            component.hide();
        }
    }));
    assert.equal(warnings.filter(w => w.includes('empty.0')).length, 1);
    names.forEach(name => assert.equal(v3d.PL.debug.getObjectByName(name).parent, env.scene));
});

// ── camera ───────────────────────────────────────────────────────────────────────────────────────────────
const lookDirection = camera => {
    camera.updateMatrixWorld(true);
    return camera.getWorldDirection(new v3d.Vector3());
};
const directionTo = (camera, point) => point.clone().sub(camera.getWorldPosition(new v3d.Vector3())).normalize();
const assertLooksAt = (camera, point, label) => {
    const angle = lookDirection(camera).angleTo(directionTo(camera, point));
    assert.ok(angle < 1e-4, `${label}: off by ${angle} rad`);
};

test('camera: the first load looks at the scene origin while nothing is built', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    const before = env.camera.position.clone();
    init(env);
    assertLooksAt(env.camera, new v3d.Vector3(0, 0, 0), 'looks at the origin');
    assert.ok(env.camera.position.equals(before), 'the camera does not move, it only turns');
});

test('camera: a configurator change keeps the user view', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    env.camera.lookAt(5, 5, 5);
    const quaternion = env.camera.quaternion.clone();
    init(env);
    assert.ok(env.camera.quaternion.equals(quaternion));
});

test('camera: RELOAD_3D zoom-fits what is built, along Camerapos → Cameratarget', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const { SceneComponent, sideOpeningCache, setObjTransform, getObjectByName } = v3d.PL.debug;
    const component = new SceneComponent();
    quiet(() => {
        component.beginBuild();
        component.placeAnchor(2000, 1000, 0, 0);
        const pole = component.pool('PoleTemplate').next();
        setObjTransform(pole, false, 'position', [0, 0, 1.25], false);
        component.endBuild();
    });
    sideOpeningCache.push(component);
    quiet(() => v3d.PL.procedures.handleButtons({ type: 'RELOAD_3D' }));

    const pole = getObjectByName(component.pools.get('PoleTemplate').names[0]);
    const center = new v3d.Box3().setFromObject(pole).getCenter(new v3d.Vector3());
    assertLooksAt(env.camera, center, 'looks at the built object');
    const expected = new v3d.Vector3(-1.4, 10, 0).sub(new v3d.Vector3(0, 10, -15)).normalize();  // Camerapos → Cameratarget
    assert.ok(lookDirection(env.camera).angleTo(expected) < 1e-4, 'looks along Camerapos → Cameratarget');
    assert.ok(env.camera.position.distanceTo(center) > 0.5, 'backs off to fit the object');
});

test('camera: with orbit controls, framing goes through controls.tween', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    const tweens = [];
    env.app.controls = { inTween: false, tween: (position, target, duration, onDone) => tweens.push({ position, target, duration, onDone }) };
    init(env);
    assert.equal(tweens.length, 1);
    assert.ok(tweens[0].target.equals(new v3d.Vector3(0, 0, 0)), 'tweens the orbit target to the origin');
    assert.ok(tweens[0].position.equals(env.camera.position), 'keeps the camera where it is');
    quiet(() => v3d.PL.procedures.handleButtons({ type: 'RELOAD_3D' }));
    assert.equal(tweens.length, 2);
    assert.equal(tweens[1].duration, 1);
});

// ── M5 · structure section (roof) ────────────────────────────────────────────────────────────────────────
const CROWN_BEAMS = { front: 'Horizontal_Gutter_Front', rear: 'Horizontal_Gutter_Rear', left: 'Horizontal_Gutter_Left', right: 'Horizontal_Gutter_Right' };
const CROWN_ACCESSORIES = ['LED strip integrated', 'LED strip integrated plug', 'Rail plug', 'Integrated wall', 'Vertical sunblind'];
const ROOF_MESHES = ['Rafter 190x140 base.0', 'Led strip.0', 'Led spot profile.0', 'No Led strip.0', 'Horizontal_Ledspot.0',
    'Horizontal_Roof_Glass_Front.0', 'Horizontal_Roof_Plastic_Front.0', 'Horizontal_Roof_Sandwich_Panel_White_Front.0',
    'Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0',
    'Horizontal screen zipper top.0', 'Horizontal screen non zipper top.0', 'Horizontal screen bottom.0',
    'Horizontal screen zipper top depth supports.0', 'Horizontal screen non zipper top depth supports.0', 'Horizontal screen bottom depth supports.0'];
const SCREEN_TEMPLATES = { zipper: 'Horizontal screen zipper top.0', nonZipper: 'Horizontal screen non zipper top.0', bottomZipper: 'Horizontal screen bottom.0' };

// The stand-in scene plus every roof template, the crown beams with their accessory children, the lights and the Gizmo.
function makeRoofApp() {
    const env = makeApp();
    const holder = env.scene.getObjectByName('globalManipulator');
    const mesh = name => {
        const object = new v3d.Mesh(new v3d.BoxGeometry(0.1, 0.1, 0.1), new v3d.MeshBasicMaterial());
        object.name = name;
        return object;
    };
    Object.values(CROWN_BEAMS).forEach(beamName => {
        const beam = mesh(beamName);
        CROWN_ACCESSORIES.forEach(accessory => beam.add(mesh(beamName + '_' + accessory)));
        holder.add(beam);
    });
    ROOF_MESHES.forEach(name => holder.add(mesh(name)));
    env.scene.add(mesh('Gizmo'));
    const sun = new v3d.DirectionalLight();
    sun.name = 'Sun_modern';
    const spot = new v3d.SpotLight();
    spot.name = 'Spot';
    env.scene.add(sun, spot);
    env.scene.updateMatrixWorld(true);
    return env;
}

const used = (section, template) => {
    const pool = section.pools.get(template);
    return pool ? pool.names.slice(0, pool.used) : [];
};
const worldPosition = name => v3d.PL.debug.getObjTransform(name, true, 'position', 'xyz');
const visible = name => {
    for (let object = v3d.PL.debug.getObjectByName(name); object; object = object.parent)
        if (!object.visible)
            return false;
    return true;
};
const closeTo = (actual, expected, label) => {
    assert.equal(actual.length, expected.length, label);
    actual.forEach((value, i) => close(value, expected[i], `${label} [${i}]`));
};

for (const [name, scope] of Object.entries(DEV_SCOPES)) {
    test(`M5 ${name}: the roof is built where the contract says`, { skip }, () => {
        createPL(v3d);
        const env = makeRoofApp();
        const warnings = init(env, scope);
        assert.deepEqual(warnings, [], 'no warnings (no missing templates)');

        const spec = parseSceneParameters(scope).structureSections[0];
        const section = v3d.PL.debug.structureSectionCache[0];
        const top = mm(spec.heightUnderGutter + 260);
        const cx = mm(spec.xPos), cy = mm(spec.yPos);
        const xOf = position => cx + mm(spec.width / 2 - position);

        // crown: four beams on the footprint edges at the crown top; the closed plugs shown by default
        const beamAt = {
            front: [cx, cy + mm(spec.depth / 2)], rear: [cx, cy - mm(spec.depth / 2)],
            left: [cx + mm(spec.width / 2), cy], right: [cx - mm(spec.width / 2), cy],
        };
        for (const [side, template] of Object.entries(CROWN_BEAMS)) {
            const [beam] = used(section, template);
            assert.ok(visible(beam), `${side} beam visible`);
            closeTo(worldPosition(beam), [...beamAt[side], top], `${side} beam`);
            assert.equal(section.crownBeams[side], beam);
            for (const accessory of CROWN_ACCESSORIES) {
                const child = beam + ' > ' + template + '_' + accessory;
                assert.ok(v3d.PL.debug.getObjectByName(child), `${child} is addressable`);
                assert.equal(visible(child), accessory === 'LED strip integrated plug' || accessory === 'Rail plug', `${child} visibility`);
            }
        }

        // rafters: one per entry at width/2 − position, each with exactly one profile under it
        const rafters = spec.roofOptions.rafters;
        const bases = used(section, 'Rafter 190x140 base.0');
        assert.equal(bases.length, rafters.length);
        rafters.forEach((rafter, i) => closeTo(worldPosition(bases[i]), [xOf(rafter.position), cy, top], `rafter ${i}`));
        const profiles = ['Led strip.0', 'Led spot profile.0', 'No Led strip.0'].reduce((sum, t) => sum + used(section, t).length, 0);
        assert.equal(profiles, rafters.length, 'one profile per rafter');

        // LED spots: positions measured from the rear edge
        const spotsExpected = rafters.filter(r => !r.ledStrip && r.ledSpot)
            .flatMap(r => r.ledSpot.positions.map(p => [xOf(r.position), cy - mm(spec.depth / 2) + mm(p), top]));
        const spots = used(section, 'Horizontal_Ledspot.0');
        assert.equal(spots.length, spotsExpected.length);
        spots.forEach((spot, i) => closeTo(worldPosition(spot), spotsExpected[i], `spot ${i}`));

        // fillings: one per entry; glass ones each with their own material copy
        const fillings = spec.roofOptions.roofFillings;
        const fillingClones = ['Horizontal_Roof_Glass_Front.0', 'Horizontal_Roof_Plastic_Front.0',
            'Horizontal_Roof_Sandwich_Panel_White_Front.0', 'Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0']
            .flatMap(t => used(section, t));
        assert.equal(fillingClones.length, fillings.length);
        const glassMaterials = used(section, 'Horizontal_Roof_Glass_Front.0').map(n => v3d.PL.debug.getObjectByName(n).material);
        assert.equal(new Set(glassMaterials).size, glassMaterials.length, 'every glass filling has its own material');

        // horizontal screen: the contract's type, centred, with supports spread over the depth
        const screen = spec.roofOptions.horizontalScreen;
        for (const [type, template] of Object.entries(SCREEN_TEMPLATES))
            assert.equal(used(section, template).length, screen && screen.type === type ? 1 : 0, `${type} screen`);
        if (screen) {
            closeTo(worldPosition(used(section, SCREEN_TEMPLATES[screen.type])[0]), [cx, cy, top], 'screen');
            const supports = used(section, SCREEN_TEMPLATES[screen.type].replace('.0', ' depth supports.0'));
            assert.equal(supports.length, Math.round(mm(spec.depth) - 0.001) + 2);
            closeTo(worldPosition(supports[0]), [cx, cy - mm(spec.depth / 2) + 0.35, top], 'first support');
            closeTo(worldPosition(supports[supports.length - 1]), [cx, cy + mm(spec.depth / 2) - 0.35, top], 'last support');
        }

        // scene: Gizmo shown, Spot on when the roof has LEDs, sun dimmed
        const hasLeds = rafters.some(r => r.ledStrip || r.ledSpot);
        assert.ok(visible('Gizmo'), 'Gizmo visible');
        assert.equal(visible('Spot'), hasLeds, 'Spot');
        assert.equal(v3d.PL.debug.getObjectByName('Sun_modern').intensity, hasLeds ? 0 : 4, 'sun');
    });
}

test('M5: switching configurations reuses the clones and hides what is no longer needed', { skip }, () => {
    createPL(v3d);
    const env = makeRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const firstBeam = used(section, 'Horizontal_Gutter_Front')[0];
    const objectCount = env.scene.children.length;

    init(env, DEV_SCOPES.wallRearRight);   // other roof, no horizontal screen
    assert.equal(v3d.PL.debug.structureSectionCache[0], section, 'same instance');
    assert.equal(used(section, 'Horizontal_Gutter_Front')[0], firstBeam, 'same beam clone');
    const zipper = section.pools.get('Horizontal screen zipper top.0').names[0];
    assert.equal(visible(zipper), false, 'the previous configuration\'s screen is hidden');

    init(env, DEV_SCOPES.freestanding);
    assert.equal(visible(zipper), true, 'and shown again');
    assert.equal(env.scene.children.length, objectCount, 'no new clones when going back');
});
