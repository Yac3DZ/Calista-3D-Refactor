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
import { createPL, sideHandleRotationZ, sideLocalToWorld, parseSceneParameters, mm, DEV_SCOPES } from '../skyluxHRoof.js';

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

// A Blender-exported scene (Z-up) with one hidden template under a holder, like the real GLB.
function makeApp() {
    const scene = new v3d.Scene();
    scene.name = 'Scene';
    scene.userData.coordSystem = 'Z_UP_RIGHT';
    const holder = new v3d.Object3D();
    holder.name = 'globalManipulator';
    holder.visible = false;
    scene.add(holder);
    const template = new v3d.Mesh(new v3d.BoxGeometry(0.15, 2.5, 0.15), new v3d.MeshBasicMaterial());
    template.name = 'PoleTemplate';
    holder.add(template);
    const camera = new v3d.PerspectiveCamera();
    camera.name = 'Camera';
    scene.add(camera);
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
            const component = new SceneComponent('SideOpening.0');
            component.beginBuild();
            component.placeHandle(side.sideSpecs.xPos, side.sideSpecs.yPos, 0, sideHandleRotationZ(side.sideSpecs.rotation));
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
    const component = new SceneComponent('SideOpening.0');
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
    const component = new v3d.PL.debug.SceneComponent('SideOpening.0');
    let results = [];
    const warnings = quiet(() => {
        results = [component.pool('DoesNotExist').next(), component.pool('DoesNotExist').next()];
    });
    assert.deepEqual(results, [null, null]);
    assert.equal(warnings.filter(w => w.includes('DoesNotExist')).length, 1);
});

test('hideLeftovers hides instances beyond the contract length through their handle', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const { SceneComponent, hideLeftovers, getObjectByName } = v3d.PL.debug;
    const cache = [new SceneComponent('SideOpening.0'), new SceneComponent('SideOpening.0')];
    cache.forEach(component => component.beginBuild());
    hideLeftovers(cache, 1);
    assert.equal(getObjectByName(cache[0].handle).visible, true);
    assert.equal(getObjectByName(cache[1].handle).visible, false);
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
