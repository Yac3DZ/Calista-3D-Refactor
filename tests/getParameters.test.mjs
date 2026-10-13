// Tests for the scope ingestion of skyluxHRoof.js (parseSceneParameters / resolveScope).
// No Verge3D needed. Run from the JS folder:
//     node --test        (from the JS folder)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSceneParameters, resolveScope, DEV_SCOPES, DEV_LED_COLORS } from '../skyluxHRoof.js';
import { _3d_calistaScope as freestanding } from '../examples_source_files/input_example_freestanding_h_roof.js';
import { _3d_calistaScope as wallRear } from '../examples_source_files/input_example_wall_rear_h_roof.js';
import { _3d_calistaScope as wallRearRight } from '../examples_source_files/input_example_wall_rear_right_h_roof.js';

const examples = { freestanding, wallRear, wallRearRight };

// The prototype file declares a plain const (no export), so it is evaluated instead of imported.
function loadPrototype() {
    const text = readFileSync(new URL('../examples_source_files/prototype_input_example_h_roof.js', import.meta.url), 'utf8');
    return new Function(text + '\nreturn _3d_calistaScopePrototype;')();
}

const clone = value => JSON.parse(JSON.stringify(value));
const issuePaths = params => params.issues.map(issue => issue.path);

// ── the example scopes ───────────────────────────────────────────────────────────────────────────────────
for (const [name, scope] of Object.entries(examples)) {
    test(`${name}: parses without issues`, () => {
        const params = parseSceneParameters(scope);
        assert.deepEqual(params.issues, []);
    });

    test(`${name}: keeps every section, side, pole and bay`, () => {
        const params = parseSceneParameters(scope);
        assert.equal(params.structureSections.length, scope._3d_StructureSections.length);
        assert.equal(params.sideOpenings.length, scope._3d_SideOpenings.length);
        scope._3d_SideOpenings.forEach((raw, i) => {
            const side = params.sideOpenings[i];
            assert.equal(side.poles.length, raw.poles.length, `side ${i} poles`);
            assert.equal(side.bays.length, raw.bays.length, `side ${i} bays`);
            assert.equal(side.sideSpecs.poleAmount, raw.sideSpecs.poleAmount, `side ${i} poleAmount`);
        });
        const roof = params.structureSections[0].roofOptions;
        const rawRoof = scope._3d_StructureSections[0].roofOptions;
        assert.equal(roof.roofFillings.length, rawRoof.roofFillings.length);
        assert.equal(roof.rafters.length, rawRoof.rafters.length);
    });

    test(`${name}: side names come from rotation and wall sides from _3d_walls`, () => {
        const params = parseSceneParameters(scope);
        const byRotation = { 0: 'left', 90: 'rear', 180: 'right', 270: 'front' };
        params.sideOpenings.forEach((side, i) => {
            assert.equal(side.side, byRotation[scope._3d_SideOpenings[i].sideSpecs.rotation]);
            assert.equal(side.isWall, scope._3d_walls[side.side]);
        });
    });

    test(`${name}: values pass through unchanged`, () => {
        const params = parseSceneParameters(scope);
        assert.equal(params.general.widthTotal, scope._3d_widthTotal);
        assert.equal(params.general.colorOutside, scope._3d_colorOutside);
        assert.equal(params.general.isFreeStanding, scope._3d_conservatoryStructure === 'freeStanding');
        const rawPole = scope._3d_SideOpenings[0].poles[0];
        const pole = params.sideOpenings[0].poles[0];
        for (const key of ['type', 'position', 'width', 'depth', 'length', 'support', 'index'])
            assert.equal(pole[key], rawPole[key], `pole.${key}`);
    });
}

test('wallRear: the wall side keeps its own wallAdjacent poles and has no bays', () => {
    const rear = parseSceneParameters(wallRear).sideOpenings.find(side => side.side === 'rear');
    assert.equal(rear.isWall, true);
    assert.equal(rear.bays.length, 0);
    assert.ok(rear.poles.every(pole => pole.type === 'wallAdjacent'));
});

test('prototype: parses, and only reports the freeStanding + wall contradiction it contains', () => {
    const params = parseSceneParameters(loadPrototype());
    assert.deepEqual(issuePaths(params), ['_3d_walls']);
    const bay = params.sideOpenings[0].bays[0];
    assert.equal(bay.climaglide.panelAmount, 5);
    assert.equal(bay.verticalSunblind.window.type, 'partialWidth');
    assert.equal(bay.fixedWall.partitions.length, 2);
    assert.deepEqual(bay.ledStrip, { mounting: 'builtIn', color: '#FFD1A3' });
    assert.equal(params.sideOpenings[0].bays[1].climaglide, null);
});

// ── malformed input: never throws, degrades gracefully ──────────────────────────────────────────────────
test('missing or non-object scope gives a drawable default with one fallback section', () => {
    for (const scope of [null, undefined, {}, 42, 'nonsense']) {
        const params = parseSceneParameters(scope);
        assert.equal(params.structureSections.length, 1);
        assert.equal(params.structureSections[0].width, 3000);
        assert.equal(params.structureSections[0].yPos, 1500);
        assert.deepEqual(params.sideOpenings, []);
        assert.ok(params.issues.length > 0);
    }
});

test('numeric strings, JSON strings and loose spellings are accepted', () => {
    const scope = clone(freestanding);
    scope._3d_widthTotal = '6000';
    scope._3d_colorOutside = '293133';
    scope._3d_conservatoryStructure = 'FREESTANDING';
    scope._3d_StructureSections = JSON.stringify(scope._3d_StructureSections);
    scope._3d_SideOpenings[0].poles[0].position = '75';
    scope._3d_SideOpenings[0].bays[0].climaglide.handle = 'true';
    const params = parseSceneParameters(scope);
    assert.deepEqual(params.issues, []);
    assert.equal(params.general.widthTotal, 6000);
    assert.equal(params.general.colorOutside, '#293133');
    assert.equal(params.general.isFreeStanding, true);
    assert.equal(params.structureSections[0].width, 6000);
    assert.equal(params.sideOpenings[0].poles[0].position, 75);
    assert.equal(params.sideOpenings[0].bays[0].climaglide.handle, true);
});

test('invalid values fall back to defaults and are reported with their path', () => {
    const scope = clone(freestanding);
    const bay = scope._3d_SideOpenings[0].bays[0];
    scope._3d_colorOutside = 'dark grey';
    bay.climaglide.openingDirection = 'sideways';
    bay.climaglide.panelAmount = 'many';
    scope._3d_SideOpenings[0].poles[1].support = 'glue';
    const params = parseSceneParameters(scope);
    const parsedBay = params.sideOpenings[0].bays[0];
    assert.equal(params.general.colorOutside, '#293133');
    assert.equal(parsedBay.climaglide.openingDirection, 'left');
    assert.equal(parsedBay.climaglide.panelAmount, 4);
    assert.equal(params.sideOpenings[0].poles[1].support, null);
    assert.deepEqual(issuePaths(params).sort(), [
        '_3d_SideOpenings[0].bays[0].climaglide.openingDirection',
        '_3d_SideOpenings[0].bays[0].climaglide.panelAmount',
        '_3d_SideOpenings[0].poles[1].support',
        '_3d_colorOutside',
    ]);
});

test('zero or negative dimensions fall back and are reported', () => {
    const scope = clone(freestanding);
    scope._3d_StructureSections[0].width = 0;
    scope._3d_SideOpenings[0].sideSpecs.length = -500;
    const params = parseSceneParameters(scope);
    assert.equal(params.structureSections[0].width, freestanding._3d_widthTotal);
    assert.equal(params.sideOpenings[0].sideSpecs.length, freestanding._3d_widthTotal);
    assert.deepEqual(issuePaths(params).sort(), ['_3d_SideOpenings[0].sideSpecs.length', '_3d_StructureSections[0].width']);
});

test('entries missing a required position are dropped, the rest is kept', () => {
    const scope = clone(freestanding);
    delete scope._3d_SideOpenings[0].poles[1].position;
    scope._3d_SideOpenings[0].bays.push({ generalSpecs: { length: 1000 } });
    scope._3d_StructureSections[0].roofOptions.rafters.push({ ledSpot: null });
    scope._3d_SideOpenings.push(null, 'garbage');
    const params = parseSceneParameters(scope);
    assert.equal(params.sideOpenings[0].poles.length, freestanding._3d_SideOpenings[0].poles.length - 1);
    assert.equal(params.sideOpenings[0].bays.length, freestanding._3d_SideOpenings[0].bays.length);
    assert.equal(params.structureSections[0].roofOptions.rafters.length, freestanding._3d_StructureSections[0].roofOptions.rafters.length);
    assert.equal(params.sideOpenings.length, freestanding._3d_SideOpenings.length);
    assert.ok(params.issues.length >= 4);
});

test('a missing option is not drawn; wrong option types are ignored', () => {
    const scope = clone(freestanding);
    const bay = scope._3d_SideOpenings[0].bays[0];
    delete bay.climaglide;
    bay.verticalSunblind = 'yes please';
    const params = parseSceneParameters(scope);
    assert.equal(params.sideOpenings[0].bays[0].climaglide, null);
    assert.equal(params.sideOpenings[0].bays[0].verticalSunblind, null);
    assert.deepEqual(issuePaths(params), ['_3d_SideOpenings[0].bays[0].verticalSunblind']);
});

test('ledStrip: a bare hex on a bay and an object on a rafter are both accepted', () => {
    const scope = clone(freestanding);
    scope._3d_SideOpenings[0].bays[0].ledStrip = '#ffffff';
    scope._3d_StructureSections[0].roofOptions.rafters[0].ledStrip = { color: '#ff0000' };
    const params = parseSceneParameters(scope);
    assert.deepEqual(params.sideOpenings[0].bays[0].ledStrip, { mounting: 'builtIn', color: '#FFFFFF' });
    assert.equal(params.structureSections[0].roofOptions.rafters[0].ledStrip, '#FF0000');
    assert.deepEqual(params.issues, []);
});

test('screenColor is always three colours', () => {
    const scope = clone(freestanding);
    scope._3d_StructureSections[0].roofOptions.horizontalScreen.screenColor = ['#111111'];
    const params = parseSceneParameters(scope);
    assert.deepEqual(params.structureSections[0].roofOptions.horizontalScreen.screenColor, ['#111111', '#111111', '#111111']);
});

test('rotation is normalised; an unknown rotation keeps the side but reports it', () => {
    const scope = clone(freestanding);
    scope._3d_SideOpenings[0].sideSpecs.rotation = -90;
    scope._3d_SideOpenings[1].sideSpecs.rotation = 45;
    const params = parseSceneParameters(scope);
    assert.equal(params.sideOpenings[0].sideSpecs.rotation, 270);
    assert.equal(params.sideOpenings[0].side, 'front');
    assert.equal(params.sideOpenings[1].side, null);
    assert.equal(params.sideOpenings[1].isWall, false);
    assert.ok(issuePaths(params).includes('_3d_SideOpenings[1].sideSpecs.rotation'));
});

test('poleAmount follows poles[]; a mismatch is reported', () => {
    const scope = clone(freestanding);
    scope._3d_SideOpenings[0].sideSpecs.poleAmount = 9;
    const params = parseSceneParameters(scope);
    assert.equal(params.sideOpenings[0].sideSpecs.poleAmount, freestanding._3d_SideOpenings[0].poles.length);
    assert.deepEqual(issuePaths(params), ['_3d_SideOpenings[0].sideSpecs.poleAmount']);
});

// ── dev scope fallback ───────────────────────────────────────────────────────────────────────────────────
test('resolveScope: a scope without the contract falls back to the dev scope, keeping its own keys', () => {
    const resolved = resolveScope({ _3dFiles: ['scene.glb'], _3d_widthTotal: 1 }, 'wallRear');
    assert.equal(resolved.devScope, 'wallRear');
    assert.deepEqual(resolved.scope._3dFiles, ['scene.glb']);
    assert.equal(resolved.scope._3d_widthTotal, wallRear._3d_widthTotal);
});

test('resolveScope: a scope with the contract is used as-is', () => {
    const resolved = resolveScope(freestanding, 'wallRear');
    assert.equal(resolved.devScope, null);
    assert.equal(resolved.scope, freestanding);
});

test('resolveScope: no dev scope name, or a null scope, never throws', () => {
    assert.deepEqual(resolveScope(null, null), { scope: {}, devScope: null });
    assert.equal(resolveScope(null, 'freestanding').devScope, 'freestanding');
});

test('DEV_SCOPES match the example files', () => {
    assert.deepEqual(Object.keys(DEV_SCOPES).sort(), Object.keys(examples).sort());
    for (const [name, scope] of Object.entries(examples))
        assert.deepEqual(DEV_SCOPES[name], scope, name);
});

test('resolveScope: with DEV_LED_COLORS set, the LEDs of the dev scope are recoloured and DEV_SCOPES stays untouched', { skip: !DEV_LED_COLORS && 'DEV_LED_COLORS is off' }, () => {
    const before = JSON.stringify(DEV_SCOPES.freestanding);
    const resolved = resolveScope({}, 'freestanding');
    const colors = resolved.scope._3d_StructureSections[0].roofOptions.rafters
        .flatMap(r => [r.ledStrip, r.ledSpot && r.ledSpot.color]).filter(Boolean);
    assert.ok(colors.length > 0);
    colors.forEach(color => assert.ok(DEV_LED_COLORS.includes(color), color));
    assert.equal(JSON.stringify(DEV_SCOPES.freestanding), before);
    assert.deepEqual(parseSceneParameters(resolved.scope).issues, []);
});
