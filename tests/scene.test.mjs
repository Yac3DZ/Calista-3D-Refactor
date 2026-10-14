// Smoke tests: runs skyluxHRoof.js on the real Verge3D 4.13 engine with a stand-in scene (no browser).
// Run from the JS folder:  node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { createPL } from '../skyluxHRoof.js';

// The engine from the Verge3D install (copied to .cjs so Node can load it). Tests are skipped without it.
const ENGINE = 'C:/Program Files/Verge3D_for_Blender/build/v3d.js';
let v3d = null;
if (existsSync(ENGINE)) {
    const copy = join(mkdtempSync(join(tmpdir(), 'v3d-')), 'v3d.cjs');
    copyFileSync(ENGINE, copy);
    v3d = createRequire(import.meta.url)(copy);
    globalThis.window = globalThis;
}
const skip = v3d ? false : 'Verge3D engine not found';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// A stand-in for the GLB: scene "glid", a hidden holder with a template, the Gizmo, a camera.
function makeApp() {
    const scene = new v3d.Scene();
    scene.name = 'glid';
    scene.userData.coordSystem = 'Z_UP_RIGHT';
    const holder = new v3d.Object3D();
    holder.name = 'globalManipulator';
    scene.add(holder);
    const template = new v3d.Mesh(new v3d.BoxGeometry(), new v3d.MeshBasicMaterial());
    template.name = 'Rafter 190x140 base.0';
    holder.add(template);
    const gizmo = new v3d.Mesh(new v3d.BoxGeometry(), new v3d.MeshBasicMaterial());
    gizmo.name = 'Gizmo';
    scene.add(gizmo);
    const camera = new v3d.PerspectiveCamera();
    camera.name = 'Camera';
    scene.add(camera);

    const calls = { snapshots: 0, load: [] };
    const app = {
        scene,
        controls: {},
        renderer: { domElement: { toDataURL: () => 'data:image/png;base64,' } },
        ExternalInterface: { getLoadPercentageFrom3D: p => calls.load.push(p) },
        getCamera: () => camera,
        _resizeCb() { },
    };
    return { app, scene, template, gizmo, calls };
}

function init(env, scope = {}) {
    v3d.PL.init(env.app, scope, () => env.calls.snapshots++);
}

test('step 1: PL.init hides the GLB except the scene root and the Gizmo', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    assert.equal(env.template.visible, false);
    assert.equal(env.scene.visible, true, 'scene root ("glid") stays visible');
    assert.equal(env.gizmo.visible, true);
});

test('step 1: handlers are registered, the snapshot is sent and the loader reaches 100', { skip }, async () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    for (const name of ['handleButtons', 'handleEvents', 'handleFocus', 'handleValue'])
        assert.equal(typeof v3d.PL.procedures[name], 'function', name);
    await wait(400);
    assert.equal(env.calls.snapshots, 1);
    assert.equal(Math.max(...env.calls.load), 100);
});

test('step 1: a second PL.init (a configurator change) runs again without errors', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    init(env);
    assert.equal(env.gizmo.visible, true);
    assert.equal(env.calls.load.at(-1), 100);
});

// ── step 1b: getCachedClone / hideCachedClones ───────────────────────────────────────────────────────────
// A rotated anchor, and a template turned around two axes with a child (like the crown beams' accessories).
function addCloneFixtures(env) {
    const anchor = new v3d.Object3D();
    anchor.name = 'TestAnchor';
    anchor.position.set(2, 0, -1);
    anchor.rotation.set(0, Math.PI / 2, 0);
    env.scene.add(anchor);
    const template = new v3d.Mesh(new v3d.BoxGeometry(), new v3d.MeshBasicMaterial());
    template.name = 'Led strip.0';
    template.quaternion.set(0.5, 0.5, 0.5, 0.5);
    const child = new v3d.Mesh(new v3d.BoxGeometry(), new v3d.MeshBasicMaterial());
    child.name = 'Led strip_plug';
    template.add(child);
    env.scene.getObjectByName('globalManipulator').add(template);
    env.scene.updateMatrixWorld(true);
    return { anchor, template };
}

test('step 1b: getCachedClone parents the clone to the anchor, at its origin, facing like the template', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const { anchor, template } = addCloneFixtures(env);
    const { getCachedClone, getObjectByName } = v3d.PL.debug;
    const cache = [];
    const name = getCachedClone(cache, 0, 'Led strip.0', 'TestAnchor');
    const clone = getObjectByName(name);

    assert.equal(clone.parent, anchor);
    assert.ok(clone.position.length() < 1e-9, 'at the anchor origin');
    assert.equal(clone.visible, true);
    // local orientation = the template's own (so it turns with the anchor)
    assert.ok(clone.quaternion.angleTo(template.quaternion) < 1e-6, 'two-axis rotation kept exactly');
    assert.ok(getObjectByName(name + ' > Led strip_plug'), 'child renamed with the clone name');
});

test('step 1b: the cached clone is reused; hideCachedClones hides the leftovers', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    addCloneFixtures(env);
    const { getCachedClone, hideCachedClones, getObjectByName } = v3d.PL.debug;
    const cache = [];
    const first = [0, 1, 2].map(i => getCachedClone(cache, i, 'Led strip.0', 'TestAnchor'));
    const objectCount = env.scene.getObjectByName('TestAnchor').children.length;

    assert.equal(getCachedClone(cache, 0, 'Led strip.0', 'TestAnchor'), first[0], 'same clone again');
    hideCachedClones(cache, 1);
    assert.deepEqual(first.map(n => getObjectByName(n).visible), [true, false, false]);
    assert.equal(env.scene.getObjectByName('TestAnchor').children.length, objectCount, 'no new clones');
    assert.equal(getCachedClone(cache, 0, 'Missing.0', 'TestAnchor'), first[0], 'an existing entry is kept');
});

test('step 1b: a missing template gives null (and a warning) instead of an error', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    const saved = console.warn;
    const warnings = [];
    console.warn = message => warnings.push(message);
    try {
        assert.equal(v3d.PL.debug.getCachedClone([], 0, 'Missing.0', 'globalManipulator'), null);
    } finally {
        console.warn = saved;
    }
    assert.equal(warnings.length, 1);
});

test('step 1b: the warning option logs once per clone whose number goes over it (template names with or without a number)', { skip }, () => {
    createPL(v3d);
    const env = makeApp();
    init(env);
    addCloneFixtures(env);
    const noNumber = new v3d.Mesh(new v3d.BoxGeometry(), new v3d.MeshBasicMaterial());
    noNumber.name = 'Horizontal_Gutter_Front';   // no number at the end: the legacy version threw here
    env.scene.add(noNumber);
    const saved = console.log;
    const logged = [];
    console.log = message => logged.push(String(message));
    try {
        const cache = [];
        [0, 1, 2].forEach(i => v3d.PL.debug.getCachedClone(cache, i, 'Led strip.0', 'TestAnchor', 1));   // .1 .2 .3
        assert.equal(logged.length, 2, 'clones .2 and .3 are over 1');
        v3d.PL.debug.getCachedClone([], 0, 'Horizontal_Gutter_Front', 'TestAnchor', 5);
    } finally {
        console.log = saved;
    }
    assert.equal(logged.length, 2, 'Horizontal_Gutter_Front2 is under 5: nothing logged, and no error');
});
