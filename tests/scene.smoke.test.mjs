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
    scene.name = 'glid';   // the real GLB's scene name (not "Scene")
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
        renderer: {
            domElement: {
                listeners: [],
                toDataURL: () => 'data:image/png;base64,',
                addEventListener(type, listener) { this.listeners.push({ type, listener }); },
                removeEventListener(type, listener) { this.listeners = this.listeners.filter(l => l.listener !== listener); },
            },
        },
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
    // rotations as authored in the GLB: these two profiles are turned around two axes
    for (const name of ['Led strip.0', 'No Led strip.0'])
        holder.getObjectByName(name).quaternion.set(0.5, 0.5, 0.5, 0.5);
    holder.getObjectByName('Led spot profile.0').quaternion.set(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
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
// Verge3D's rule: an object is drawn when its OWN flag is set (hidden parents don't hide children), except
// multi-material sub-meshes, which follow their object.
const visible = name => {
    const object = v3d.PL.debug.getObjectByName(name);
    if (!object || !object.visible)
        return false;
    return !(object.isMesh && object.isMaterialGeneratedMesh && object.parent) || object.parent.visible;
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
        // the only expected warning: the stand-in LED material has no "LED color" input (like today's GLB)
        assert.deepEqual(warnings.filter(w => !w.includes('LED color')), [], 'no other warnings (no missing templates)');

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

test('M5: every roof clone faces exactly like its template (incl. templates rotated around two axes)', { skip }, () => {
    createPL(v3d);
    const env = makeRoofApp();
    init(env, DEV_SCOPES.freestanding);   // has LED strips, spot profiles and plain rafters
    const section = v3d.PL.debug.structureSectionCache[0];
    const { getObjectByName } = v3d.PL.debug;
    let checked = 0;
    section.pools.forEach(pool => pool.names.slice(0, pool.used).forEach(name => {
        const clone = getObjectByName(name), template = getObjectByName(pool.templateName);
        const angle = clone.getWorldQuaternion(new v3d.Quaternion()).angleTo(template.getWorldQuaternion(new v3d.Quaternion()));
        assert.ok(angle < 1e-6, `${name} is turned ${(angle * 180 / Math.PI).toFixed(1)}° off ${pool.templateName}`);
        checked++;
    }));
    assert.ok(used(section, 'Led strip.0').length > 0 && used(section, 'No Led strip.0').length > 0, 'both two-axis profiles are built');
    assert.ok(checked > 20);
});

// ── M5b · roof selection, LED colours ────────────────────────────────────────────────────────────────────
const SELECTED_MESHES = ['Rafter 190x140 base_Selected.0', 'Led strip_Selected.0', 'Led spot profile_Selected.0',
    'No Led strip_Selected.0', 'Horizontal_Ledspot_Selected.0', 'Horizontal_Roof_Selected_Front.0'];

// The roof scene plus the "_Selected" meshes, and a configurator that records its focus calls.
function makeSelectableRoofApp() {
    const env = makeRoofApp();
    const holder = env.scene.getObjectByName('globalManipulator');
    SELECTED_MESHES.forEach(name => {
        const object = new v3d.Mesh(new v3d.BoxGeometry(0.1, 0.1, 0.1), new v3d.MeshBasicMaterial());
        object.name = name;
        holder.add(object);
    });
    env.scene.updateMatrixWorld(true);
    env.focus = [];
    env.app.ExternalInterface.focus = data => env.focus.push(data.uniqueLabel);
    return env;
}

const pick = name => quiet(() => v3d.PL.debug.handleObjectPick(name ? [{ object: v3d.PL.debug.getObjectByName(name) }] : [], {}));
const shownClones = (section, template) => used(section, template).filter(visible);

test('M5b: clicking a filling selects it, highlights it and opens its group in the configurator', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const spec = parseSceneParameters(DEV_SCOPES.freestanding).structureSections[0];

    const glass = used(section, 'Horizontal_Roof_Glass_Front.0');
    const target = glass[glass.length - 1];
    const index = spec.roofOptions.roofFillings.length - 1;   // the freestanding roof ends in glass
    pick(target);
    assert.deepEqual(section.selection, { type: 'filling', index });
    assert.deepEqual(env.focus, ['filling_group~' + index]);
    const [highlight] = shownClones(section, 'Horizontal_Roof_Selected_Front.0');
    assert.ok(highlight, 'highlight shown');
    closeTo(worldPosition(highlight), worldPosition(target), 'highlight lies over the filling');
    assert.equal(shownClones(section, 'Horizontal_Roof_Selected_Front.0').length, 1);
});

test('M5b: clicking any part of a rafter builds that rafter from the "_Selected" meshes', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const rafters = parseSceneParameters(DEV_SCOPES.freestanding).structureSections[0].roofOptions.rafters;
    const index = rafters.findIndex(r => r.ledSpot && !r.ledStrip);

    // click one of its spots
    const spot = used(section, 'Horizontal_Ledspot.0')[0];
    pick(spot);
    assert.deepEqual(section.selection, { type: 'rafter', index });
    assert.deepEqual(env.focus, ['rafter_group~' + index]);
    assert.equal(shownClones(section, 'Rafter 190x140 base_Selected.0').length, 1);
    assert.equal(shownClones(section, 'Led spot profile_Selected.0').length, 1);
    assert.equal(shownClones(section, 'Horizontal_Ledspot_Selected.0').length, rafters[index].ledSpot.positions.length);
    assert.equal(shownClones(section, 'Rafter 190x140 base.0').length, rafters.length - 1, 'the others stay normal');
});

test('M5b: a click that misses closes the group; hidden clones are never picked', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    pick(used(section, 'Rafter 190x140 base.0')[0]);
    env.focus.length = 0;

    pick(null);
    assert.equal(section.selection, null);
    assert.deepEqual(env.focus, ['rafter_group~-1']);
    assert.equal(shownClones(section, 'Rafter 190x140 base_Selected.0').length, 0);

    // a hidden clone in front: skipped, the shown filling behind it is picked
    const hidden = section.pools.get('Rafter 190x140 base_Selected.0').names[0];
    assert.equal(visible(hidden), false);
    const filling = used(section, 'Horizontal_Roof_Glass_Front.0')[0];
    quiet(() => v3d.PL.debug.handleObjectPick([{ object: v3d.PL.debug.getObjectByName(hidden) }, { object: v3d.PL.debug.getObjectByName(filling) }], {}));
    assert.equal(section.selection.type, 'filling');

    // a shown object that isn't clickable (a crown beam) in front: the click misses
    pick(section.crownBeams.front);
    assert.equal(section.selection, null);
});

test('M5b: the configurator focus selects in 3D without echoing back; leaving the field clears it', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const focusIn = data => quiet(() => v3d.PL.procedures.handleFocus(data));

    focusIn({ uniqueLabel: 'rafter_group~2' });
    assert.deepEqual(section.selection, { type: 'rafter', index: 2 });
    assert.equal(shownClones(section, 'Rafter 190x140 base_Selected.0').length, 1);
    focusIn({ uniqueLabel: 'filling_group~0' });
    assert.deepEqual(section.selection, { type: 'filling', index: 0 });
    focusIn({ uniqueLabel: 'width_field' });          // another field: the selection stays (legacy behaviour)
    assert.deepEqual(section.selection, { type: 'filling', index: 0 });
    focusIn({ uniqueLabel: 'filling_group~-1' });
    assert.equal(section.selection, null);
    focusIn({ uniqueLabel: 'rafter_group~1' });
    focusIn(null);
    assert.equal(section.selection, null);
    assert.deepEqual(env.focus, [], 'the 3D never echoes a focus the configurator sent');
});

test('M5b: a selection survives a configuration change; picking is installed once per app', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const listeners = env.app.renderer.domElement.listeners.length;
    const section = v3d.PL.debug.structureSectionCache[0];
    quiet(() => v3d.PL.procedures.handleFocus({ uniqueLabel: 'rafter_group~1' }));
    init(env, DEV_SCOPES.freestanding);
    assert.deepEqual(section.selection, { type: 'rafter', index: 1 });
    assert.equal(shownClones(section, 'Rafter 190x140 base_Selected.0').length, 1);
    assert.equal(env.app.renderer.domElement.listeners.length, listeners, 'no extra listeners on rebuild');
    assert.ok(listeners >= 2, 'mouse + touch listeners');
});

test('M5b: LED colours go to each strip / spot material and the roof light; one warning while the GLB has no input', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    const warnings = init(env, DEV_SCOPES.freestanding);
    assert.equal(warnings.filter(w => w.includes('LED color')).length, 1, 'stand-in materials have no "LED color" input');
    const section = v3d.PL.debug.structureSectionCache[0];
    const rafters = parseSceneParameters(DEV_SCOPES.freestanding).structureSections[0].roofOptions.rafters;

    // two rafters with a strip: each strip needs its own material for its own colour
    const twoStrips = JSON.parse(JSON.stringify(DEV_SCOPES.freestanding));
    twoStrips._3d_StructureSections[0].roofOptions.rafters.slice(0, 2).forEach((r, i) => { r.ledSpot = null; r.ledStrip = ['#FF0000', '#00FF00'][i]; });
    init(env, twoStrips);
    const strips = used(section, 'Led strip.0').map(n => v3d.PL.debug.getObjectByName(n).material);
    assert.ok(strips.length >= 2);
    assert.equal(new Set(strips).size, strips.length, 'each LED strip has its own material');
    init(env, DEV_SCOPES.freestanding);
    const firstColor = rafters.map(r => r.ledStrip || (r.ledSpot && r.ledSpot.color)).find(Boolean);
    const spot = v3d.PL.debug.getObjectByName('Spot');
    assert.equal(spot.color.getHex(), new v3d.Color(firstColor).getHex(), 'roof light takes the first LED colour');
});

// ── clicks: left click / tap on the "click" event, drags ignored ─────────────────────────────────────────
// Node has no DOM events: a minimal MouseEvent is enough for Verge3D's picking listener.
globalThis.MouseEvent ??= class MouseEvent {
    constructor(type, init = {}) {
        Object.assign(this, { button: 0 }, init);
        this.type = type;
    }
    preventDefault() { }
};
const listenersOf = (env, type) => env.app.renderer.domElement.listeners.filter(l => l.type === type).map(l => l.listener);

test('clicks: picking listens to "click" (not mousedown) plus "pointerdown" for drag detection', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    assert.equal(listenersOf(env, 'click').length, 1);
    assert.equal(listenersOf(env, 'pointerdown').length, 1);
    assert.equal(listenersOf(env, 'mousedown').length, 0, 'a press alone selects nothing (it may start an orbit)');
});

test('clicks: a click whose pointer moved is a drag and selects nothing; a still one selects', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const filling = v3d.PL.debug.getObjectByName(used(section, 'Horizontal_Roof_Glass_Front.0')[0]);
    const [pointerDown] = listenersOf(env, 'pointerdown');

    pointerDown({ clientX: 100, clientY: 100 });
    quiet(() => v3d.PL.debug.handleObjectPick([{ object: filling }], { clientX: 140, clientY: 100 }));
    assert.equal(section.selection, null, 'dragged 40 px: orbit, not a selection');

    pointerDown({ clientX: 100, clientY: 100 });
    quiet(() => v3d.PL.debug.handleObjectPick([{ object: filling }], { clientX: 103, clientY: 101 }));
    assert.equal(section.selection.type, 'filling', 'moved 3 px: a click');
});

test('clicks: a DOM click event goes canvas → raycast → picker (logged while DEV_LOG_CLICKS is on)', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    Object.assign(env.app.renderer.domElement, { clientWidth: 800, clientHeight: 600 });
    init(env, DEV_SCOPES.freestanding);
    const logged = [];
    const savedInfo = console.info;
    console.info = (...parts) => logged.push(parts.join(' '));
    try {
        const [onClick] = listenersOf(env, 'click');
        onClick(new MouseEvent('click', { offsetX: 400, offsetY: 300, clientX: 400, clientY: 300 }));
    } finally {
        console.info = savedInfo;
    }
    assert.equal(logged.filter(line => line.startsWith('[Calista 3D] click on')).length, 1, logged.join('\n'));
});

// ── Verge3D visibility (regression: clicks hit "nothing" on the real GLB) ────────────────────────────────
test('visibility: clearScene leaves the scene root visible, whatever its name ("glid" in the GLB)', { skip }, () => {
    createPL(v3d);
    const env = makeRoofApp();
    init(env, DEV_SCOPES.freestanding);
    assert.equal(env.scene.name, 'glid');
    assert.equal(env.scene.visible, true);
});

test('visibility: a click on a multi-material sub-mesh selects its object, even under a hidden parent', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const rafterName = used(section, 'Rafter 190x140 base.0')[2];
    const rafter = v3d.PL.debug.getObjectByName(rafterName);
    // what Verge3D makes of a multi-material object: sub-meshes named "<object>MatMesh<i>"
    const subMesh = new v3d.Mesh(new v3d.BoxGeometry(0.1, 0.1, 0.1), new v3d.MeshBasicMaterial());
    subMesh.name = rafterName + 'MatMesh0';
    subMesh.isMaterialGeneratedMesh = true;
    rafter.add(subMesh);
    // in Verge3D a hidden parent does not hide what is under it: the click must still count
    v3d.PL.debug.getObjectByName(section.anchor).visible = false;
    env.scene.visible = false;
    quiet(() => v3d.PL.debug.handleObjectPick([{ object: subMesh }], {}));
    assert.deepEqual(section.selection, { type: 'rafter', index: 2 });
    env.scene.visible = true;
});

test('visibility: a sub-mesh of a hidden object is not clickable (it is not drawn either)', { skip }, () => {
    createPL(v3d);
    const env = makeSelectableRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const rafter = v3d.PL.debug.getObjectByName(used(section, 'Rafter 190x140 base.0')[0]);
    const subMesh = new v3d.Mesh(new v3d.BoxGeometry(0.1, 0.1, 0.1), new v3d.MeshBasicMaterial());
    subMesh.isMaterialGeneratedMesh = true;
    rafter.add(subMesh);
    rafter.visible = false;
    quiet(() => v3d.PL.debug.handleObjectPick([{ object: subMesh }], {}));
    assert.equal(section.selection, null);
});

test('visibility: hide() hides every clone of the instance, not only its anchor', { skip }, () => {
    createPL(v3d);
    const env = makeRoofApp();
    init(env, DEV_SCOPES.freestanding);
    const section = v3d.PL.debug.structureSectionCache[0];
    const clones = [];
    section.pools.forEach(pool => clones.push(...pool.names.slice(0, pool.used)));
    assert.ok(clones.length > 20 && clones.every(visible));
    section.hide();
    assert.deepEqual(clones.filter(visible), [], 'nothing of the section is drawn any more');
});
