// Tests for the pure scene-geometry helpers of skyluxHRoof.js (no Verge3D needed).
//     node --test        (from the JS folder)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSceneParameters, mm, sideAnchorRotationZ, sideLocalToWorld, DEV_SCOPES } from '../skyluxHRoof.js';

const round = point => point.map(value => Math.round(value * 1000) / 1000 || 0); // || 0 folds -0 into 0

test('mm converts contract millimetres to scene metres', () => {
    assert.equal(mm(1500), 1.5);
    assert.equal(mm(0), 0);
});

test('side anchor rotation is 90 - rotation', () => {
    assert.equal(sideAnchorRotationZ(0), 90);      // left runs +Y
    assert.equal(sideAnchorRotationZ(90), 0);      // rear runs +X
    assert.equal(sideAnchorRotationZ(180), -90);   // right runs -Y
    assert.equal(sideAnchorRotationZ(270), -180);  // front runs -X
});

test('local +X runs along each side and local +Y points into the structure', () => {
    const at = (rotation, x, y) => round(sideLocalToWorld({ xPos: 0, yPos: 0, rotation }, x, y));
    assert.deepEqual(at(0, 1, 0), [0, 1]);     // left: along +Y
    assert.deepEqual(at(0, 0, 1), [-1, 0]);    //       inward -X (left side is at +X)
    assert.deepEqual(at(270, 1, 0), [-1, 0]);  // front: along -X
    assert.deepEqual(at(270, 0, 1), [0, -1]);  //        inward -Y (front side is at Y = depth)
    assert.deepEqual(at(90, 1, 0), [1, 0]);    // rear: along +X
    assert.deepEqual(at(90, 0, 1), [0, 1]);    //       inward +Y
    assert.deepEqual(at(180, 1, 0), [0, -1]);  // right: along -Y
    assert.deepEqual(at(180, 0, 1), [1, 0]);   //        inward +X
});

for (const [name, scope] of Object.entries(DEV_SCOPES)) {
    test(`${name}: the four sides form a closed loop around the section footprint`, () => {
        const params = parseSceneParameters(scope);
        const section = params.structureSections[0];
        const halfWidth = section.width / 2;
        const corners = [[halfWidth, 0], [-halfWidth, 0], [halfWidth, section.depth], [-halfWidth, section.depth]]
            .map(corner => corner.join(','));
        const starts = params.sideOpenings.map(side => round([side.sideSpecs.xPos, side.sideSpecs.yPos]).join(','));
        params.sideOpenings.forEach(side => {
            const start = round([side.sideSpecs.xPos, side.sideSpecs.yPos]).join(',');
            const end = round(sideLocalToWorld(side.sideSpecs, side.sideSpecs.length, 0)).join(',');
            assert.ok(corners.includes(start), `${side.side} starts on a footprint corner (${start})`);
            assert.ok(starts.includes(end), `${side.side} ends where another side starts (${end})`);
        });
    });

    test(`${name}: every pole sits inside the footprint with its outer face on the side line`, () => {
        const params = parseSceneParameters(scope);
        const section = params.structureSections[0];
        params.sideOpenings.forEach(side => side.poles.forEach(pole => {
            const [x, y] = sideLocalToWorld(side.sideSpecs, pole.position, pole.depth / 2);
            assert.ok(Math.abs(x) <= section.width / 2 && y >= 0 && y <= section.depth,
                `${side.side} pole ${pole.index} at ${x},${y}`);
            // the outer face (local Y = 0) is on the side line: one footprint edge
            const [faceX, faceY] = round(sideLocalToWorld(side.sideSpecs, pole.position, 0));
            const onEdge = Math.abs(Math.abs(faceX) - section.width / 2) < 1e-6 || faceY === 0 || faceY === section.depth;
            assert.ok(onEdge, `${side.side} pole ${pole.index} outer face on the footprint edge`);
        }));
    });
}
