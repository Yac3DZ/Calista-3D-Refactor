//Skylux Calista — data-driven refactor
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// FLOW
//   scope[] → getParameters() → sceneParameters (one object, the ONLY configurator data the 3D uses)
//           → one StructureSection per _3d_StructureSections[] entry + one SideOpening per _3d_SideOpenings[] entry
//             execute the specs. The configurator does every product calculation (positions, spans, counts);
//             the 3D only does what is strictly a visualization concern.
//
// FILE LAYOUT (top to bottom; the //#region blocks fold in VS Code)
//   0 · DEV SCOPE SWITCH       fallback test data while the live configurator doesn't send the contract yet
//   1 · SCENE GEOMETRY         pure helpers: mm → m, side rotation, side-local → world, atlas, morphs
//   2 · createPL               Verge3D puzzle globals + state that SURVIVES PL.init re-runs
//   3 · VERGE3D 4.13 HELPERS   #region — puzzle library, newest API only; grown milestone by milestone
//   4 · FOUNDATIONS            anchors, ObjectPool, SceneComponent base class, per-object materials,
//                              object clicks (one picking listener), render gate
//   5 · STRUCTURE SECTION      #region — class StructureSection: crown beams + roof (rafters, LEDs, fillings,
//                              horizontal screen) + roof selection, one per _3d_StructureSections[] entry
//   6 · CAMERA                 fitCameraToObjects (zoom-fit), cameraPosition, look at the origin while empty
//   7 · OUTPUT + HANDLERS      snapshot, screenshot, handleButtons / handleEvents / handleFocus / handleValue
//   8 · ORCHESTRATION          enableScene → getParameters → enableScene3D, frame colour, lighting
//   9 · ENTRY                  PL.init
//  10 · INGESTION              #region — pure functions, no Verge3D: scope → sceneParameters (validated,
//                              defaulted). Called from getParameters() in section 8.
//   DEV_SCOPES                 #region — bundled example scopes
//
// CONVENTIONS
//   - sceneParameters keeps the contract's units: millimetres and degrees. Conversion to metres happens once,
//     with mm(), where an object is placed — never scattered through the builders.
//   - The configurator calls PL.init again on every change. Helpers, classes and instance caches are declared
//     once in createPL; PL.init only passes the current app + scope and runs a build.
//   - Coordinates (from the contract datums): the back edge of the structure sits centred on X at Y = 0,
//     Y+ faces forward (front side at Y = depth), +X points to the LEFT side. Each side runs left → right as
//     seen from outside, starting at its first pole's outer corner. A side's anchor gets Z rotation
//     90 − rotation, so on every side local +X runs along the side and local +Y points into the structure.
//   - Every object belongs to an instance: it is a clone from that instance's ObjectPool, parented to the
//     instance's anchor, and positioned in the anchor's local frame.
//   - Legacy logic (standalone wall / Climaglide / screen configurators) stays in skyluxHRoof_legacy.js for now.
//══════════════════════════════════════════════════════════════════════════════════════════════════════════


//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 0 · DEV SCOPE SWITCH
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// The live configurator does not send the new contract keys (_3d_StructureSections / _3d_SideOpenings) yet.
// Until it does, a scope without them falls back to one of the bundled example scopes (DEV_SCOPES, bottom of
// the file) so every milestone can be tested on the server. The server's own keys (_3dFiles, _perspective, …)
// are kept. Set to null to switch the fallback off; remove it together with DEV_SCOPES once the configurator
// sends the contract.
const DEV_SCOPE = 'freestanding'; // null | 'freestanding' | 'wallRear' | 'wallRearRight'

// Dev only: recolour every LED of the bundled DEV scope with these colours, in turn, to check the LED
// material's "LED color" input. null keeps the example's own colours.
const DEV_LED_COLORS = ['#FF3B30', '#34C759', '#0A84FF', '#FFD60A'];

// Dev only: log every click in the 3D view (what was hit, and whether it is clickable). false to silence.
const DEV_LOG_CLICKS = true;


//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · SCENE GEOMETRY — pure helpers, no Verge3D
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// The contract is in millimetres, the scene in metres. Convert with mm() at the point an object is placed.
function mm(value) {
    return value / 1000;
}

// sideSpecs.rotation is a compass-style heading: the side runs along (sin r, cos r) in world X/Y
// (left 0 → +Y, rear 90 → +X, right 180 → −Y, front 270 → −X). Verge3D/Blender rotate counter-clockwise
// from +X, so a side's anchor gets Z rotation 90 − r. With it every side shares ONE local frame:
// local +X runs along the side (left → right seen from outside), local +Y points INTO the structure.
// That single frame is what removes every `if (side == 'Left')` branch.
function sideAnchorRotationZ(rotation) {
    return 90 - rotation;
}

// World X/Y (mm) of a point given in a side's local frame (mm). Mirrors what the anchor transform does;
// used for checks and for anything placed in world space (measurements, camera framing).
function sideLocalToWorld(sideSpecs, localX, localY) {
    const r = sideSpecs.rotation * Math.PI / 180;
    const alongX = Math.sin(r), alongY = Math.cos(r);
    const inwardX = -Math.cos(r), inwardY = Math.sin(r);
    return [
        sideSpecs.xPos + localX * alongX + localY * inwardX,
        sideSpecs.yPos + localX * alongY + localY * inwardY,
    ];
}

// 3D-only dimensions (mm) the contract leaves to the 3D, the "calistaAtlas" of the input schema.
const CALISTA_ATLAS = {
    crown: {
        profileHeight: 260,     // crown beam height: the roof sits on top of the crown, heightUnderGutter + this
        cornerInset: 150,       // corner pole width: crown beams, rafters and fillings span between the poles
    },
    // layerDepth — Y depth per (option, mounting) — comes with the bay options. [M7]
};

// Most meshes in the GLB are modelled 1 m long with a morph target that adds 100 m at factor 1, so a length
// of L mm needs factor (L / 1000 − 1) / 100.
function lengthMorph(lengthMm) {
    return (mm(lengthMm) - 1) / 100;
}


//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 2 · createPL — Verge3D puzzle globals + state that survives PL.init re-runs
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// Everything below is declared ONCE per createPL. PL.init only hands over the current appInstance and scope
// and runs a build, so helpers, classes and instance caches are never re-declared between changes.
function createPL(v3d = window.v3d) {
    var LIST_NONE = '<none>';

    var _pGlob = {};

    _pGlob.objCache = new Map();
    _pGlob.fadeAnnotations = true;
    _pGlob.objClickInfo = [];
    _pGlob.pickedObject = '';
    _pGlob.objHoverInfo = [];
    _pGlob.hoveredObject = '';
    _pGlob.objMovementInfos = {};
    _pGlob.objDragOverCallbacks = [];
    _pGlob.objDragOverInfoByBlock = {};
    _pGlob.objDragOverInfoGlobal = [];
    _pGlob.dragMoveOrigins = {};
    _pGlob.dragScaleOrigins = {};
    _pGlob.mediaElements = {};
    _pGlob.loadedFiles = {};
    _pGlob.loadedFile = '';
    _pGlob.promiseValue = '';
    _pGlob.animMixerCallbacks = [];
    _pGlob.arHitPoint = new v3d.Vector3(0, 0, 0);
    _pGlob.states = [];
    _pGlob.percentage = 0;
    _pGlob.animateParamUpdate = null;
    _pGlob.openedFile = '';
    _pGlob.xrSessionAcquired = false;
    _pGlob.xrSessionCallbacks = [];
    _pGlob.screenCoords = new v3d.Vector2();
    _pGlob.gamepadIndex = 0;

    _pGlob.AXIS_X = new v3d.Vector3(1, 0, 0);
    _pGlob.AXIS_Y = new v3d.Vector3(0, 1, 0);
    _pGlob.AXIS_Z = new v3d.Vector3(0, 0, 1);
    _pGlob.MIN_DRAG_SCALE = 10e-4;
    _pGlob.SET_OBJ_ROT_EPS = 1e-8;

    _pGlob.vec2Tmp = new v3d.Vector2();
    _pGlob.vec2Tmp2 = new v3d.Vector2();
    _pGlob.vec3Tmp = new v3d.Vector3();
    _pGlob.vec3Tmp2 = new v3d.Vector3();
    _pGlob.vec3Tmp3 = new v3d.Vector3();
    _pGlob.vec3Tmp4 = new v3d.Vector3();
    _pGlob.eulerTmp = new v3d.Euler();
    _pGlob.eulerTmp2 = new v3d.Euler();
    _pGlob.quatTmp = new v3d.Quaternion();
    _pGlob.quatTmp2 = new v3d.Quaternion();
    _pGlob.colorTmp = new v3d.Color();
    _pGlob.mat4Tmp = new v3d.Matrix4();
    _pGlob.planeTmp = new v3d.Plane();
    _pGlob.raycasterTmp = new v3d.Raycaster();
    _pGlob.intervals = {};
    _pGlob.eventListeners = [];

    var PL = v3d.PL = v3d.PL || {};

    v3d.puzzles = PL;
    PL.procedures = PL.procedures || {};

    PL.execInitPuzzles = function (options) {
        var appInstance = null;
        var app = null;

        var _initGlob = {};
        _initGlob.percentage = 0;
        _initGlob.output = {
            initOptions: {
                fadeAnnotations: true,
                useBkgTransp: true,
                preserveDrawBuf: true,
                useCompAssets: true,
                useGlb: true,
                useFullscreen: true,
                useCustomPreloader: false,
                preloaderStartCb: function () { },
                preloaderProgressCb: function () { },
                preloaderEndCb: function () { },
            }
        }
        _initGlob.container = options !== undefined && 'container' in options
            ? options.container : "";

        return _initGlob.output;
    }

    // ── persistent state ─────────────────────────────────────────────────────────────────────────────────
    let appInstance = null;            // set by every PL.init; the helpers below read it
    let sceneParameters = createEmptySceneParameters();
    let sceneIsInitialized = false;

    // One instance per contract entry, cached by index and REUSED across rebuilds (grown on demand). [M5, M6]
    const structureSectionCache = [];
    const sideOpeningCache = [];


    //#region 3 · VERGE3D 4.13 HELPERS
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 3 · VERGE3D 4.13 HELPERS — the puzzle library's own code, newest API only (taken from Verge3D 4.13's
    //     puzzles.min.js, PzLib. prefix dropped). More are added as the milestones need them.
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    function getObjectByName(objName) {
        let objFound = null;
        const isID = v3d.MathUtils.checkUUID ? v3d.MathUtils.checkUUID(objName) : false;
        const pGlobAvailable = _pGlob !== undefined;

        if (pGlobAvailable)
            objFound = _pGlob.objCache.get(objName);

        if (objFound && (isID ? objFound.uuid === objName : objFound.name === objName))
            return objFound;

        function findValidByName(obj, objName) {
            if ((isID ? obj.uuid === objName : obj.name === objName) && isObjectWorthProcessing(obj))
                return obj;
            for (let i = 0; i < obj.children.length; i++) {
                const child = obj.children[i];
                const object = findValidByName(child, objName);
                if (object !== null)
                    return object;
            }
            return null;
        }
        if (appInstance.scene) {
            objFound = findValidByName(appInstance.scene, objName);
            if (objFound && pGlobAvailable)
                _pGlob.objCache.set(objName, objFound);
        }
        return objFound;
    }

    function isObjectWorthProcessing(obj) {
        return obj.name !== '' &&
            !(obj.isMesh && obj.isMaterialGeneratedMesh) &&
            !obj.isAuxClippingMesh;
    }

    function getSceneCoordSystem() {
        const scene = appInstance.scene;
        if (scene && 'coordSystem' in scene.userData) {
            return scene.userData.coordSystem;
        }
        return 'Y_UP_RIGHT';
    }

    function getObjectNamesByGroupName(groupName) {
        const objNameList = [];
        appInstance.scene.traverse(obj => {
            if (isObjectWorthProcessing(obj)) {
                const objGroupNames = obj.groupNames;
                if (!objGroupNames)
                    return;
                for (let i = 0; i < objGroupNames.length; i++) {
                    const objGroupName = objGroupNames[i];
                    if (objGroupName === groupName)
                        objNameList.push(obj.name);
                }
            }
        });
        return objNameList;
    }

    function getAllObjectNames() {
        const objNameList = [];
        appInstance.scene.traverse(obj => {
            if (isObjectWorthProcessing(obj))
                objNameList.push(obj.name);
        });
        return objNameList;
    }

    function retrieveObjectNamesAccum(currObjNames, namesAccum) {
        if (typeof currObjNames === 'string') {
            namesAccum.push(currObjNames);
        } else if (Array.isArray(currObjNames) && currObjNames[0] === 'GROUP') {
            const newObjNames = getObjectNamesByGroupName(currObjNames[1]);
            for (let i = 0; i < newObjNames.length; i++) {
                namesAccum.push(newObjNames[i]);
            }
        } else if (Array.isArray(currObjNames) && currObjNames[0] === 'ALL_OBJECTS') {
            const newObjNames = getAllObjectNames();
            for (let i = 0; i < newObjNames.length; i++)
                namesAccum.push(newObjNames[i]);
        } else if (Array.isArray(currObjNames)) {
            for (let i = 0; i < currObjNames.length; i++)
                retrieveObjectNamesAccum(currObjNames[i], namesAccum);
        }
    }

    function retrieveObjectNames(objNames) {
        const accum = [];
        retrieveObjectNamesAccum(objNames, accum);
        return accum.filter(name => name !== '');
    }

    function generateUniqueName(name, isUniqueCb) {
        let uniqueName = name;

        if (isUniqueCb !== undefined) {
            while (!isUniqueCb(uniqueName)) {
                const r = uniqueName.match(/^(.*?)(\d+)$/);
                if (!r) {
                    uniqueName += '2';
                } else {
                    uniqueName = r[1] + (Number.parseInt(r[2], 10) + 1);
                }
            }
        }

        return uniqueName;
    }

    function generateUniqueObjectName(name) {
        return generateUniqueName(name, name => !Boolean(getObjectByName(name)));
    }

    function cloneObject(objName, cloneMaterials, preserveGroups) {
        if (!objName)
            return;
        const obj = getObjectByName(objName);
        if (!obj)
            return;

        const objNew = obj.clone(); // recursive
        objNew.name = generateUniqueObjectName(obj.name);

        // assign unique names for multi-material object meshes
        const objsM = objNew.resolveMultiMaterial();
        if (objNew != objsM[0])
            for (let i = 0; i < objsM.length; i++)
                objsM[i].name = objNew.name + 'MatMesh' + i;

        if (cloneMaterials) {
            objNew.traverse(o => {
                if (o.material) {
                    o.material = o.material.clone();
                }
            });
        }

        if (preserveGroups) {
            const oldGroups = [];
            obj.traverse(o => {
                oldGroups.push(o.groupNames);
            });

            let i = 0;
            objNew.traverse(o => {
                o.groupNames.push(...oldGroups[i]);
                i++;
            });
        }

        appInstance.scene.add(objNew);

        // fix free light targets by appending them alongside the lights
        // TODO: find a way to handle old targets which was cloned but no longer needed
        objNew.traverse(o => {
            if (o.isFreeLight)
                o.parent.add(o.target);
        });

        // add object to cache now to increase performance
        _pGlob.objCache.set(objNew.name, objNew);

        return objNew.name;
    }

    function changeVis(objSelector, bool) {
        var objNames = retrieveObjectNames(objSelector);

        for (var i = 0; i < objNames.length; i++) {
            var objName = objNames[i]
            if (!objName)
                continue;
            var obj = getObjectByName(objName);
            if (!obj)
                continue;
            obj.visible = bool;
            obj.resolveMultiMaterial().forEach(function (objR) {
                objR.visible = bool;
            });
        }
    }

    function makeParent(objName, targetObjName) {
        if (!objName)
            return;
        var obj = getObjectByName(objName);
        if (!obj)
            return;
        if (targetObjName && targetObjName !== LIST_NONE) {
            var targetObj = getObjectByName(targetObjName);
            if (!targetObj)
                return;
        } else {
            obj.traverseAncestors(function (ancObj) {
                if (ancObj.type == "Scene")
                    targetObj = ancObj;
            });
        }
        var matOffset = new v3d.Matrix4();
        matOffset.copy(targetObj.matrixWorld).invert();
        matOffset.multiply(obj.matrixWorld);
        matOffset.decompose(obj.position, obj.quaternion, obj.scale);
        targetObj.add(obj);

        obj.updateWorldMatrix(false, true);
    }

    function setMorphFactor(objSelector, targetName, factor) {
        if (!targetName)
            return;

        const objNames = retrieveObjectNames(objSelector);

        for (let i = 0; i < objNames.length; i++) {
            const objName = objNames[i]
            if (!objName)
                continue;
            let obj = getObjectByName(objName);
            if (!obj)
                continue;

            obj.resolveMultiMaterial().forEach(function (objR) {
                if (objR.morphTargetDictionary && targetName in objR.morphTargetDictionary) {
                    const idx = objR.morphTargetDictionary[targetName];
                    objR.morphTargetInfluences[idx] = Number(factor);
                }
            });

            obj.resolveMultiMaterial().forEach(function (objR) {
                objR.getAuxClippingMeshes().forEach(function (objC) {
                    if (objC.morphTargetDictionary && targetName in objC.morphTargetDictionary) {
                        const idx = objC.morphTargetDictionary[targetName];
                        objC.morphTargetInfluences[idx] = Number(factor);
                    }
                });
            });
        }
    }

    function setObjTransform(objSelector, isWorldSpace, mode, vector, offset) {
        const x = vector[0];
        const y = vector[1];
        const z = vector[2];

        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            console.error('set transform puzzle: Invalid transform');
            return;
        }

        const objNames = retrieveObjectNames(objSelector);
        function setObjProp(obj, prop, val) {
            if (!offset) {
                obj[mode][prop] = val;
            } else {
                if (mode != "scale")
                    obj[mode][prop] += val;
                else
                    obj[mode][prop] *= val;
            }
        }

        const inputsUsed = _pGlob.vec3Tmp.set(Number(x !== ''), Number(y !== ''), Number(z !== ''));
        const coords = _pGlob.vec3Tmp2.set(x || 0, y || 0, z || 0);

        if (mode === 'rotation')
            coords.multiplyScalar(v3d.MathUtils.DEG2RAD);

        const coordSystem = getSceneCoordSystem();

        transformCoordsSpace(inputsUsed, coordSystem, 'Y_UP_RIGHT', true);
        transformCoordsSpace(coords, coordSystem, 'Y_UP_RIGHT', mode === 'scale');

        for (let i = 0; i < objNames.length; i++) {
            const objName = objNames[i];
            if (!objName) continue;

            const obj = getObjectByName(objName);
            if (!obj) continue;

            if (isWorldSpace && obj.parent) {
                obj.matrixWorld.decomposeE(obj.position, obj.rotation, obj.scale);

                if (inputsUsed.x) setObjProp(obj, "x", coords.x);
                if (inputsUsed.y) setObjProp(obj, "y", coords.y);
                if (inputsUsed.z) setObjProp(obj, "z", coords.z);

                obj.matrixWorld.composeE(obj.position, obj.rotation, obj.scale);
                obj.matrix.multiplyMatrices(_pGlob.mat4Tmp.copy(obj.parent.matrixWorld).invert(), obj.matrixWorld);
                obj.matrix.decompose(obj.position, obj.quaternion, obj.scale);

            } else if (mode === 'rotation' && coordSystem == 'Z_UP_RIGHT') {
                const euler = transformEulerV3dToBlenderShortest(obj.rotation,
                    _pGlob.eulerTmp);
                transformCoordsSpace(euler, coordSystem, 'Y_UP_RIGHT');

                if (inputsUsed.x) euler.x = offset ? euler.x + coords.x : coords.x;
                if (inputsUsed.y) euler.y = offset ? euler.y + coords.y : coords.y;
                if (inputsUsed.z) euler.z = offset ? euler.z + coords.z : coords.z;

                euler.order = "YZX";
                euler.reorder(obj.rotation.order);
                obj.rotation.copy(euler);

            } else if (mode === 'rotation' && coordSystem == 'Y_UP_RIGHT') {
                const rotUI = RotationInterface.initObject(obj);
                const euler = rotUI.getUserRotation(_pGlob.eulerTmp);

                if (inputsUsed.x) euler.x = offset ? euler.x + coords.x : coords.x;
                if (inputsUsed.y) euler.y = offset ? euler.y + coords.y : coords.y;
                if (inputsUsed.z) euler.z = offset ? euler.z + coords.z : coords.z;

                rotUI.setUserRotation(euler);
                rotUI.getActualRotation(obj.rotation);
            } else {
                if (inputsUsed.x) setObjProp(obj, "x", coords.x);
                if (inputsUsed.y) setObjProp(obj, "y", coords.y);
                if (inputsUsed.z) setObjProp(obj, "z", coords.z);
            }
            obj.updateWorldMatrix(false, true);
        }
    }

    function getObjTransform(objName, isWorldSpace, mode, coord) {
        if (!objName)
            return;
        var obj = getObjectByName(objName);
        if (!obj)
            return;

        var coordSystem = getSceneCoordSystem();
        var transformVal;

        if (isWorldSpace && obj.parent) {
            if (mode === 'position') {
                transformVal = transformCoordsSpace(
                    obj.getWorldPosition(_pGlob.vec3Tmp), 'Y_UP_RIGHT',
                    coordSystem, mode === 'scale');
            } else if (mode === 'rotation') {
                transformVal = transformCoordsSpace(
                    obj.getWorldEuler(_pGlob.eulerTmp, 'XYZ'), 'Y_UP_RIGHT',
                    coordSystem, mode === 'scale');
            } else if (mode === 'scale') {
                transformVal = transformCoordsSpace(
                    obj.getWorldScale(_pGlob.vec3Tmp), 'Y_UP_RIGHT',
                    coordSystem, mode === 'scale');
            }

        } else if (mode === 'rotation' && coordSystem == 'Z_UP_RIGHT') {
            transformVal = transformEulerV3dToBlenderShortest(obj.rotation,
                _pGlob.eulerTmp);

        } else if (mode === 'rotation' && coordSystem == 'Y_UP_RIGHT') {
            var rotUI = RotationInterface.initObject(obj);
            transformVal = rotUI.getUserRotation(_pGlob.eulerTmp);

        } else {
            transformVal = transformCoordsSpace(obj[mode].clone(),
                'Y_UP_RIGHT', coordSystem, mode === 'scale');
        }
        if (mode === 'rotation') {
            transformVal.x = v3d.MathUtils.radToDeg(transformVal.x);
            transformVal.y = v3d.MathUtils.radToDeg(transformVal.y);
            transformVal.z = v3d.MathUtils.radToDeg(transformVal.z);
        }
        if (coord == 'xyz')
            return transformVal.toArray().slice(0, 3);
        else
            return transformVal[coord];
    }

    function transformCoordsSpace(coords, spaceFrom, spaceTo, noSignChange = false) {
        if (spaceFrom === spaceTo) {
            return coords;
        }

        const y = coords.y;
        const z = coords.z;

        if (spaceFrom === 'Z_UP_RIGHT' && spaceTo === 'Y_UP_RIGHT') {
            coords.y = z;
            coords.z = noSignChange ? y : -y;
        } else if (spaceFrom === 'Y_UP_RIGHT' && spaceTo === 'Z_UP_RIGHT') {
            coords.y = noSignChange ? z : -z;
            coords.z = y;
        } else
            console.error('transformCoordsSpace: Unsupported coordinate space');
        return coords;
    }

    const transformEulerV3dToBlenderShortest = function () {
        const eulerTmp = new v3d.Euler();
        const eulerTmp2 = new v3d.Euler();
        const vec3Tmp = new v3d.Vector3();

        return function (euler, dest) {
            const eulerBlender = eulerTmp.copy(euler).reorder('YZX');
            const eulerBlenderAlt = eulerTmp2.copy(eulerBlender).makeAlternative();

            const len = vec3Tmp.setFromEuler(eulerBlender).lengthSq();
            const lenAlt = vec3Tmp.setFromEuler(eulerBlenderAlt).lengthSq();

            dest.copy(len < lenAlt ? eulerBlender : eulerBlenderAlt);
            return transformCoordsSpace(dest, 'Y_UP_RIGHT', 'Z_UP_RIGHT');
        }
    }();

    function RotationInterface() {
        this._userRotation = new v3d.Euler(0, 0, 0, 'ZYX');
        this._actualRotation = new v3d.Euler();
    }

    Object.assign(RotationInterface, {
        initObject: function (obj) {
            if (obj.userData.puzzles === undefined) {
                obj.userData.puzzles = {}
            }
            if (obj.userData.puzzles.rotationInterface === undefined) {
                obj.userData.puzzles.rotationInterface = new RotationInterface();
            }

            const rotUI = obj.userData.puzzles.rotationInterface;
            rotUI.updateFromObject(obj);
            return rotUI;
        },
    });

    Object.assign(RotationInterface.prototype, {
        updateFromObject: function (obj) {
            const SYNC_ROT_EPS = 1e-8;

            if (!this._actualRotation.equalsEps(obj.rotation, SYNC_ROT_EPS)) {
                this._actualRotation.copy(obj.rotation);
                this._updateUserRotFromActualRot();
            }
        },
        getActualRotation: function (euler) {
            return euler.copy(this._actualRotation);
        },
        setUserRotation: function (euler) {
            this._userRotation.set(euler.x, euler.y, euler.z);
            this._updateActualRotFromUserRot();
        },
        getUserRotation: function (euler) {
            return euler.copy(this._userRotation);
        },
        _updateUserRotFromActualRot: function () {
            const order = this._userRotation.order;
            this._userRotation.copy(this._actualRotation).reorder(order);
        },
        _updateActualRotFromUserRot: function () {
            const order = this._actualRotation.order;
            this._actualRotation.copy(this._userRotation).reorder(order);
        },
    });

    function registerSetTimeout(timeout, callback) {
        window.setTimeout(callback, 1000 * timeout);
    }

    function getJSFunction(funcName) {
        var jsFunc = appInstance.ExternalInterface[funcName];
        if (typeof jsFunc == "function")
            return jsFunc;
        else
            return function () { };
    }

    function getMaterialEditableColors(matName) {
        const mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
        if (!mat) {
            return [];
        }

        if (mat.isMeshNodeMaterial) {
            return Object.keys(mat.nodeRGBMap);
        } else if (mat.isMeshStandardMaterial) {
            return ['color', 'emissive'];
        } else if (mat.isMeshLineMaterial) {
            return ['color'];
        } else {
            return [];
        }
    }

    function getMaterialEditableValues(matName) {
        const mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
        if (!mat) {
            return [];
        }

        if (mat.isMeshNodeMaterial) {
            return Object.keys(mat.nodeValueMap);
        } else if (mat.isMeshStandardMaterial) {
            return ['metalness', 'roughness', 'opacity', 'emissiveIntensity', 'bumpScale', 'envMapIntensity'];
        } else {
            return [];
        }
    }

    function setMaterialColor(matSelector, colName, r, g, b, cssCode) {
        const matNames = Array.isArray(matSelector) ? matSelector : [matSelector];

        matNames.forEach(function(matName) {
            const colors = getMaterialEditableColors(matName);
            if (colors.indexOf(colName) < 0)
                return;

            if (cssCode) {
                const color = new v3d.Color(cssCode);
                r = color.r;
                g = color.g;
                b = color.b;
            }

            const mats = v3d.SceneUtils.getMaterialsByName(appInstance, matName);

            for (let i = 0; i < mats.length; i++) {
                const mat = mats[i];

                if (mat.isMeshNodeMaterial) {
                    const rgbIdx = mat.nodeRGBMap[colName];
                    mat.nodeRGB[rgbIdx].x = r;
                    mat.nodeRGB[rgbIdx].y = g;
                    mat.nodeRGB[rgbIdx].z = b;
                } else {
                    mat[colName].r = r;
                    mat[colName].g = g;
                    mat[colName].b = b;
                }

                // COMPAT: <4.9.0
                if (v3d.engineVersionCmp('4.9.0', v3d.REVISION) < 0)
                    mat.needsUpdate = true;

                if (appInstance.scene !== null) {
                    if (mat === appInstance.scene.worldMaterial) {
                        appInstance.updateEnvironment(mat);
                    }
                }
            }
        });
    }

    function setMaterialValue(matSelector, valName, value) {
        const matNames = Array.isArray(matSelector) ? matSelector : [matSelector];

        matNames.forEach(function(matName) {
            const values = getMaterialEditableValues(matName);
            if (values.indexOf(valName) < 0)
                return;

            const mats = v3d.SceneUtils.getMaterialsByName(appInstance, matName);
            for (let i = 0; i < mats.length; i++) {
                const mat = mats[i];

                if (mat.isMeshNodeMaterial) {
                    const valIdx = mat.nodeValueMap[valName];
                    mat.nodeValue[valIdx] = Number(value);
                } else
                    mat[valName] = Number(value);

                if (appInstance.scene !== null) {
                    if (mat === appInstance.scene.worldMaterial) {
                        appInstance.updateEnvironment(mat);
                    }
                }
            }
        });
    }

    function setLightParam(type, objSelector, param) {

        if (type === 'SHADOW_MAP_FILTERING') {
            const rendererShadowMap = appInstance.renderer.shadowMap;
            if (rendererShadowMap) {
                let shadowMapFilteringTypeBefore = rendererShadowMap.type;

                switch (param) {
                    case 'BASIC':
                        rendererShadowMap.type = v3d.BasicShadowMap;
                        break;
                    case 'BILINEAR':
                        rendererShadowMap.type = v3d.BilinearShadowMap;
                        break;
                    case 'PCF':
                    // COMPAT: deprecated, PCF == v3d.PCFShadowMapPoissonDisk since 4.7
                    case 'PCFBILINEAR':
                    case 'PCFPOISSON':
                        // TODO: PCF == v3d.PCFShadow since 4.8
                        rendererShadowMap.type = v3d.PCFShadowMapPoissonDisk;
                        break;
                    case 'ESM':
                        rendererShadowMap.type = v3d.ESMShadowMap;
                        break;
                    default:
                        console.error('set light param puzzle: Incompatible shadow map filtering type.')
                        return;
                        break;
                }

                if (shadowMapFilteringTypeBefore != rendererShadowMap.type) {

                    let deleteShadowMapFromObj = function(object) {
                        if (!object.shadow) return;

                        if (object.shadow.isDirectionalLightShadowCSM) {
                            object.shadow.updateMaps();

                        } else if (object.shadow) {
                            object.shadow.dispose();
                            // COMPAT: < 4.10
                            if (object.shadow.removeMaps) {
                                object.shadow.removeMaps();
                            } else {
                                object.shadow.map = null;
                                object.shadow._additionalMap2D = null;
                                object.shadow._additionalMapCube = null;
                            }
                        }
                    }

                    // need to update shadow.map for ESM filtering
                    let needToUpdateShadowMaps = shadowMapFilteringTypeBefore == v3d.ESMShadowMap ||
                            rendererShadowMap.type == v3d.ESMShadowMap;
                    const compiled = {};
                    appInstance.scene.traverse(function(object) {

                        const material = object.material;
                        if (material && object.receiveShadow) {

                            if (Array.isArray(material)) {
                                for (let i = 0; i < material.length; i++) {
                                    const material2 = material[i];

                                    if (material2.uuid in compiled === false) {
                                        material2.needsUpdate = true;
                                        compiled[material2.uuid] = true;
                                    }

                                }

                            } else if (material.uuid in compiled === false) {
                                material.needsUpdate = true;
                                compiled[material.uuid] = true;

                            }
                        }

                        if (needToUpdateShadowMaps)
                            deleteShadowMapFromObj(object);
                    });

                    // COMPAT: <4.13
                    if (rendererShadowMap.updateDepthMaterials)
                        rendererShadowMap.updateDepthMaterials();
                }

            }
            return;
        }

        const objNames = retrieveObjectNames(objSelector);

        objNames.forEach(function(objName) {
            if (!objName)
                return;

            const obj = getObjectByName(objName);
            if (!obj || !obj.isLight)
                return;

            switch (type) {
            case 'COLOR_VECTOR':
                obj.color.r = param[0];
                obj.color.g = param[1];
                obj.color.b = param[2];
                break;
            case 'COLOR_CSS_HEX':
            case 'COLOR_CSS_RGB':
                const color = _pGlob.colorTmp.set(param);
                obj.color.r = color.r;
                obj.color.g = color.g;
                obj.color.b = color.b;
                break;
            case 'INTENSITY':
                if (obj.userData.usePowerUnits)
                    obj.power = param;
                else
                    obj.intensity = param;
                break;
            case 'USE_SHADOW':
                if (obj.isAmbientLight) {
                    console.error('set light param puzzle: Incompatible light source');
                    return;
                }
                if (typeof(param) === "boolean")
                    obj.castShadow = param;

                break;
            case 'SHADOW_MAP_SIZE':
                if (obj.isAmbientLight) {
                    console.error('set light param puzzle: Incompatible light source');
                    return;
                }

                if (!obj.shadow) return;

                if (obj.shadow.isDirectionalLightShadowCSM) {
                    obj.shadow.mapSize.set(param, param);
                    obj.shadow.updateMapSize();

                } else if (obj.shadow) {
                    obj.shadow.mapSize.set(param, param);
                    obj.shadow.dispose();
                    // COMPAT: < 4.10
                    if (obj.shadow.removeMaps) {
                        obj.shadow.removeMaps();
                    } else {
                        obj.shadow.map = null;
                        obj.shadow._additionalMap2D = null;
                        obj.shadow._additionalMapCube = null;
                    }
                }

                break;
            }

        });

    }

    function areListenersSame(target0, type0, listener0, optionsOrUseCapture0,
            target1, type1, listener1, optionsOrUseCapture1) {
        const capture0 = Boolean(optionsOrUseCapture0 instanceof Object
                ? optionsOrUseCapture0.capture : optionsOrUseCapture0);
        const capture1 = Boolean(optionsOrUseCapture1 instanceof Object
                ? optionsOrUseCapture1.capture : optionsOrUseCapture1);
        return target0 === target1 && type0 === type1 && listener0 === listener1
                && capture0 === capture1;
    }

    function bindListener(target, type, listener, optionsOrUseCapture) {
        const alreadyExists = _pGlob.eventListeners.some(elem => {
            return areListenersSame(elem.target, elem.type, elem.listener,
                    elem.optionsOrUseCapture, target, type, listener,
                    optionsOrUseCapture);
        });

        if (!alreadyExists) {
            target.addEventListener(type, listener, optionsOrUseCapture);
            _pGlob.eventListeners.push({ target, type, listener,
                    optionsOrUseCapture });
        }
    }

    function unbindListener(target, type, listener, optionsOrUseCapture) {
        const index = _pGlob.eventListeners.findIndex(elem => {
            return areListenersSame(elem.target, elem.type, elem.listener,
                elem.optionsOrUseCapture, target, type, listener,
                optionsOrUseCapture);
        });

        if (index !== -1) {
            target.removeEventListener(type, listener, optionsOrUseCapture);
            _pGlob.eventListeners.splice(index, 1);
        }
    }

    function initObjectPicking(callback, eventType, mouseDownUseTouchStart=false,
            allowedMouseButtons=null) {

        // css renderer prevents interacting with canvas, in that case we assign events on container
        const elem = appInstance.cssRenderer ? appInstance.container : appInstance.renderer.domElement;
        bindListener(elem, eventType, pickListener);

        if (eventType === 'mousedown') {

            const touchEventName = mouseDownUseTouchStart ? 'touchstart' : 'touchend';
            bindListener(elem, touchEventName, pickListener);

        } else if (eventType === 'dblclick') {

            let prevTapTime = 0;

            function doubleTapCallback(event) {
                const now = new Date().getTime();
                const timesince = now - prevTapTime;

                if (timesince < 600 && timesince > 0) {
                    pickListener(event);
                    prevTapTime = 0;
                    return;
                }

                prevTapTime = new Date().getTime();
            }

            const touchEventName = mouseDownUseTouchStart ? 'touchstart' : 'touchend';
            bindListener(elem, touchEventName, doubleTapCallback);
        }

        const raycaster = new v3d.Raycaster();

        function pickListener(event) {

            // to handle unload in loadScene puzzle
            if (!appInstance.getCamera()) {
                return;
            }

            event.preventDefault();

            let xNorm = 0;
            let yNorm = 0;
            if (event instanceof MouseEvent) {
                if (allowedMouseButtons !== null && allowedMouseButtons.indexOf(event.button) === -1) {
                    return;
                }
                xNorm = event.offsetX / elem.clientWidth;
                yNorm = event.offsetY / elem.clientHeight;
            } else if (event instanceof TouchEvent) {
                const rect = elem.getBoundingClientRect();
                xNorm = (event.changedTouches[0].clientX - rect.left) / rect.width;
                yNorm = (event.changedTouches[0].clientY - rect.top) / rect.height;
            }

            _pGlob.screenCoords.x = xNorm * 2 - 1;
            _pGlob.screenCoords.y = -yNorm * 2 + 1;
            raycaster.setFromCamera(_pGlob.screenCoords, appInstance.getCamera(true));

            const objList = [];
            appInstance.scene.traverse(obj => objList.push(obj));

            const intersects = raycaster.intersectObjects(objList, false);
            callback(intersects, event);
        }
    }
    //#endregion


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 4 · FOUNDATIONS — building blocks every structure section / side opening uses
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    const warnedOnce = new Set();
    function warnOnce(message) {
        if (warnedOnce.has(message))
            return;
        warnedOnce.add(message);
        console.warn('[Calista 3D] ' + message);
    }

    // An anchor is an empty that carries an instance's transform; every object of the instance is parented to
    // it. It sits at the contract's "handle point": a structure section's bounding-box centre, a side opening's
    // start point. (Called "anchor" in code so it can't be confused with the Climaglide door handle flag.)
    // Anchors are clones of this empty in the GLB. Blender: Plain Axes at the origin, rotation 0, scale 1,
    // no parent, no children.
    const ANCHOR_TEMPLATE = 'empty.0';

    // Null when empty.0 is missing from the GLB (warned once): the instance's objects then stay unparented at
    // the scene origin — misplaced, but the configurator keeps working.
    function createAnchor() {
        const name = cloneObject(ANCHOR_TEMPLATE, false, false);
        if (!name) {
            warnOnce('anchor template "' + ANCHOR_TEMPLATE + '" is not in the GLB; objects cannot be placed');
            return null;
        }
        // placeAnchor() sets position and rotation on every build; scale is reset in case the template's isn't 1.
        setObjTransform(name, false, 'scale', [1, 1, 1], false);
        return name;
    }

    /**
     * Clones of one template, parented to one anchor, reused across rebuilds.
     * Per build: reset() → next() for every object needed → hideUnused(). Clones are created only when a
     * build needs more than any build before it, so a configuration change never re-clones.
     */
    class ObjectPool {
        // options.cloneMaterials: each clone gets its own copy of the template's materials, so per-object
        // material values (setObjectMaterialValue) don't spread to every clone.
        constructor(templateName, parentName, options = {}) {
            this.templateName = templateName;
            this.parentName = parentName;
            this.cloneMaterials = Boolean(options.cloneMaterials);
            this.onCreate = options.onCreate || null;   // called once per new clone, e.g. to make it clickable
            this.names = [];
            this.used = 0;
        }

        reset() {
            this.used = 0;
        }

        // Name of the next clone, shown. Null when the template is missing from the scene (warned once),
        // so builders skip the object instead of breaking.
        next() {
            let name = this.names[this.used];
            if (!name || !getObjectByName(name)) {
                name = cloneObject(this.templateName, this.cloneMaterials, false);
                if (!name) {
                    warnOnce('template object "' + this.templateName + '" is not in the scene');
                    return null;
                }
                makeParent(name, this.parentName);
                this.renameChildren(name);
                this.resetLocalTransform(name);
                this.names[this.used] = name;
                if (this.onCreate)
                    this.onCreate(name);
            }
            this.used++;
            changeVis(name, true);
            return name;
        }

        hideUnused() {
            for (let i = this.used; i < this.names.length; i++)
                changeVis(this.names[i], false);
        }

        // A clone's children keep their template names, which then exist twice in the scene (template + clone).
        // Prefix them with the clone's name so each stays addressable: childObjectName(clone, templateChildName).
        renameChildren(name) {
            getObjectByName(name).traverse(child => {
                if (child.name === name || !isObjectWorthProcessing(child))
                    return;
                child.name = childObjectName(name, child.name);
                _pGlob.objCache.set(child.name, child);
            });
        }

        // makeParent keeps the clone's WORLD transform, so under a rotated anchor its local rotation would
        // compensate the anchor's. Reset it: position at the anchor's origin, the template's own rotation and
        // scale. Builders then only set what differs (position, and rotation where a template isn't authored
        // in the side's local frame).
        // The template's rotation is read in LOCAL space: getObjTransform's world-space rotation uses a
        // different Euler order than setObjTransform's local one, which turns templates rotated around more
        // than one axis (e.g. "Led strip.0") 120° off. Templates sit at the top level or under an
        // untransformed holder (globalManipulator), where local and world rotation are the same.
        resetLocalTransform(name) {
            setObjTransform(name, false, 'position', [0, 0, 0], false);
            setObjTransform(name, false, 'rotation', getObjTransform(this.templateName, false, 'rotation', 'xyz'), false);
            setObjTransform(name, false, 'scale', getObjTransform(this.templateName, true, 'scale', 'xyz'), false);
        }
    }

    /**
     * Base of StructureSection and SideOpening: one anchor + the object pools hanging off it.
     * A subclass's enable(spec) calls beginBuild(), places its objects through pool(...).next(), then
     * endBuild(). hide() hides the whole instance through its anchor (leftovers when the contract shrinks).
     */
    class SceneComponent {
        constructor() {
            this.anchor = createAnchor();
            this.pools = new Map();
            this.isVisible = false;
        }

        // options.key lets one template feed several independent pools (e.g. the same mesh in two roles);
        // options.cloneMaterials / options.onCreate, see ObjectPool. Options count on the pool's first use.
        pool(templateName, options = {}) {
            const key = options.key ?? templateName;
            let pool = this.pools.get(key);
            if (!pool) {
                pool = new ObjectPool(templateName, this.anchor, options);
                this.pools.set(key, pool);
            }
            return pool;
        }

        beginBuild() {
            this.isVisible = true;
            changeVis(this.anchor, true);
            this.pools.forEach(pool => pool.reset());
        }

        endBuild() {
            this.pools.forEach(pool => pool.hideUnused());
        }

        // Position in mm (contract units), rotation in degrees around Z.
        placeAnchor(xMm, yMm, zMm, rotationZ) {
            setObjTransform(this.anchor, false, 'position', [mm(xMm), mm(yMm), mm(zMm)], false);
            setObjTransform(this.anchor, false, 'rotation', [0, 0, rotationZ], false);
        }

        // Hides every clone one by one: in Verge3D hiding the anchor would NOT hide the objects under it.
        hide() {
            this.isVisible = false;
            changeVis(this.anchor, false);
            this.pools.forEach(pool => {
                pool.reset();
                pool.hideUnused();
            });
        }
    }

    // Name of a child of a pooled clone, e.g. childObjectName('Horizontal_Gutter_Front.1',
    // 'Horizontal_Gutter_Front_Rail plug') → 'Horizontal_Gutter_Front.1 > Horizontal_Gutter_Front_Rail plug'.
    function childObjectName(cloneName, templateChildName) {
        return cloneName + ' > ' + templateChildName;
    }

    // setMaterialValue for ONE object's own materials: setMaterialValue works by material name, which all
    // copies of a material share. Use it on clones made with cloneMaterials.
    function setObjectMaterialValue(objName, valName, value) {
        const obj = getObjectByName(objName);
        if (!obj)
            return;
        obj.resolveMultiMaterial().forEach(objR => {
            const mat = objR.material;
            if (!mat)
                return;
            if (mat.isMeshNodeMaterial) {
                if (valName in mat.nodeValueMap)
                    mat.nodeValue[mat.nodeValueMap[valName]] = Number(value);
            } else if (valName in mat) {
                mat[valName] = Number(value);
            }
        });
    }

    // setMaterialColor for ONE object's own materials (see setObjectMaterialValue). Returns false when none of
    // the object's materials has an RGB input called colName.
    function setObjectMaterialColor(objName, colName, cssColor) {
        const obj = getObjectByName(objName);
        if (!obj)
            return false;
        const color = new v3d.Color(cssColor);
        let found = false;
        obj.resolveMultiMaterial().forEach(objR => {
            const mat = objR.material;
            if (!mat)
                return;
            if (mat.isMeshNodeMaterial && colName in mat.nodeRGBMap) {
                const rgb = mat.nodeRGB[mat.nodeRGBMap[colName]];
                rgb.x = color.r;
                rgb.y = color.g;
                rgb.z = color.b;
                found = true;
            } else if (mat[colName] && mat[colName].isColor) {
                mat[colName].copy(color);
                found = true;
            }
        });
        return found;
    }

    // ── object clicks ────────────────────────────────────────────────────────────────────────────────────
    // ONE picking listener for the whole configurator: Verge3D's registerOnClick adds a full-scene raycast
    // per registered object, which adds up with dozens of clones. Objects register a handler by name; a click
    // runs the handler of the nearest shown object hit, or every "missed" handler when that object (or
    // nothing) isn't clickable.
    // Selecting is a plain left click / tap, picked on the browser's "click" event. The left button also
    // orbits the camera, so a click whose pointer moved more than CLICK_MAX_MOVE px since it went down is a
    // drag and selects nothing.
    const CLICK_MAX_MOVE = 6;
    const pointerDownAt = { x: 0, y: 0, known: false };
    const clickHandlers = new Map();
    const missedClickHandlers = new Set();

    function onObjectClick(objName, handler) {
        clickHandlers.set(objName, handler);
    }

    function onMissedClick(handler) {
        missedClickHandlers.add(handler);
    }

    // Verge3D's visibility rule (its renderer and raycaster): an object is drawn when its OWN visible flag is
    // set — a hidden parent does NOT hide its children, except a multi-material object's sub-meshes, which
    // follow their object. (The plain three.js rule, where hidden parents hide everything below them, does
    // not apply.)
    function isShownInScene(obj) {
        if (!obj.visible)
            return false;
        if (obj.isMesh && obj.isMaterialGeneratedMesh && obj.parent)
            return obj.parent.visible;
        return true;
    }

    function isDrag(event) {
        if (!pointerDownAt.known || !event || typeof event.clientX !== 'number')
            return false;
        return Math.hypot(event.clientX - pointerDownAt.x, event.clientY - pointerDownAt.y) > CLICK_MAX_MOVE;
    }

    function handleObjectPick(intersects, event) {
        if (isDrag(event))
            return;
        let shownHit = null;
        for (const hit of intersects)
            if (isShownInScene(hit.object)) {
                shownHit = hit.object;
                break;
            }
        // the hit may be a part of the clickable object (a multi-material mesh, a child)
        let clicked = null;
        for (let obj = shownHit; obj && !clicked; obj = obj.parent)
            if (clickHandlers.has(obj.name))
                clicked = obj.name;
        if (DEV_LOG_CLICKS)
            logClick(intersects, event, shownHit, clicked);
        if (clicked)
            clickHandlers.get(clicked)(event);
        else
            missedClickHandlers.forEach(handler => handler(event));
    }

    // Dev only (DEV_LOG_CLICKS): what the click hit, plus everything needed to see why it hit nothing — the
    // click position on the canvas, the camera, and a second raycast after refreshing every world matrix.
    function logClick(intersects, event, shownHit, clicked) {
        console.info('[Calista 3D] click on', shownHit ? shownHit.name : '(nothing)', clicked ? '→ ' + clicked : '→ not clickable');
        if (shownHit)
            return;
        const elem = appInstance.cssRenderer ? appInstance.container : appInstance.renderer.domElement;
        const camera = appInstance.getCamera(true);
        const matrixPosition = camera ? new v3d.Vector3().setFromMatrixPosition(camera.matrixWorld) : null;
        const round = v => v.toArray().map(n => Math.round(n * 1000) / 1000);
        const describe = hits => hits.slice(0, 5).map(hit => hit.object.name + (isShownInScene(hit.object) ? '' : ' (hidden)'));

        const raycaster = new v3d.Raycaster();
        raycaster.setFromCamera(_pGlob.screenCoords, camera);
        const objects = [];
        appInstance.scene.updateMatrixWorld(true);
        if (camera)
            camera.updateMatrixWorld(true);
        appInstance.scene.traverse(obj => objects.push(obj));
        const refreshed = new v3d.Raycaster();
        refreshed.setFromCamera(_pGlob.screenCoords, camera);
        const refreshedHits = refreshed.intersectObjects(objects, false);

        console.info('[Calista 3D] click details', {
            target: event && event.target ? (event.target.tagName + (event.target.id ? '#' + event.target.id : '')) : '?',
            listenerElement: elem.tagName + (elem.id ? '#' + elem.id : ''),
            offset: event ? [event.offsetX, event.offsetY] : null,
            canvasSize: [elem.clientWidth, elem.clientHeight],
            screenCoords: [_pGlob.screenCoords.x, _pGlob.screenCoords.y],
            camera: camera ? camera.name + (camera.isPerspectiveCamera ? ' (perspective, aspect ' + camera.aspect.toFixed(3) + ')' : '') : 'none',
            cameraPosition: camera ? round(camera.position) : null,
            cameraMatrixPosition: matrixPosition ? round(matrixPosition) : null,
            rayDirection: round(raycaster.ray.direction),
            hits: intersects.length + ' ' + JSON.stringify(describe(intersects)),
            hitsAfterMatrixRefresh: refreshedHits.length + ' ' + JSON.stringify(describe(refreshedHits)),
        });
    }

    function installObjectPicking() {
        const elem = appInstance.cssRenderer ? appInstance.container : appInstance.renderer.domElement;
        bindListener(elem, 'pointerdown', function (event) {
            pointerDownAt.x = event.clientX;
            pointerDownAt.y = event.clientY;
            pointerDownAt.known = true;
        });
        initObjectPicking(handleObjectPick, 'click');
    }

    // Instances beyond the current contract length are hidden, not destroyed: they are reused when the
    // configuration grows again.
    function hideLeftovers(cache, usedCount) {
        for (let i = usedCount; i < cache.length; i++)
            if (cache[i])
                cache[i].hide();
    }

    // ── render gate ──────────────────────────────────────────────────────────────────────────────────────
    // Render only while something changes: the camera moves, or renderFrame() asked for time (a build, a
    // tween). Verge3D keeps running controls and renderCallbacks while rendering is paused, so camera input
    // always wakes it up. The camera's position/rotation are compared, not its matrixWorld: matrixWorld is
    // only refreshed by a render, so it would stay frozen while paused.
    const renderGate = { until: 0, enabled: true, position: null, quaternion: null };

    // Single render point: every build and animation calls this. `seconds` keeps rendering that long.
    function renderFrame(seconds = 0.5) {
        renderGate.until = Math.max(renderGate.until, performance.now() + seconds * 1000);
        setRendering(true);
    }

    function setRendering(enabled) {
        if (enabled === renderGate.enabled)
            return;
        renderGate.enabled = enabled;
        if (enabled)
            appInstance.enableRendering();
        else
            appInstance.disableRendering(0);
    }

    function installRenderGate() {
        renderGate.position = new v3d.Vector3();
        renderGate.quaternion = new v3d.Quaternion();
        appInstance.renderCallbacks.push(function () {
            const camera = appInstance.getCamera();
            let moved = false;
            if (camera) {
                moved = !camera.position.equals(renderGate.position) || !camera.quaternion.equals(renderGate.quaternion);
                renderGate.position.copy(camera.position);
                renderGate.quaternion.copy(camera.quaternion);
            }
            setRendering(moved || performance.now() < renderGate.until);
        });
    }


    //#region 5 · STRUCTURE SECTION
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 5 · STRUCTURE SECTION — one per _3d_StructureSections[] entry: the crown and the roof [Logic #3]
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // The section's anchor sits at the footprint centre (xPos, yPos) with no rotation, so local X/Y run like
    // world X/Y: +X towards the LEFT side, +Y towards the front. Roof positions in the contract are measured
    // from the section's +X edge ("left → right viewed from the front"), so local X = width / 2 − position.
    const ROOF_TEMPLATES = {
        crownBeams: {
            front: 'Horizontal_Gutter_Front',
            rear: 'Horizontal_Gutter_Rear',
            left: 'Horizontal_Gutter_Left',
            right: 'Horizontal_Gutter_Right',
        },
        // Accessories hanging under each crown beam (children in the GLB, prefixed with the beam's name).
        // The bays decide which are shown [M7]; until then the closed "plug" versions are.
        crownAccessories: ['LED strip integrated', 'LED strip integrated plug', 'Rail plug', 'Integrated wall', 'Vertical sunblind'],
        crownAccessoriesDefault: ['LED strip integrated plug', 'Rail plug'],
        // Rafter parts, normal and as shown while the rafter is selected.
        rafter: { normal: 'Rafter 190x140 base.0', selected: 'Rafter 190x140 base_Selected.0' },
        rafterProfiles: {
            ledStrip: { normal: 'Led strip.0', selected: 'Led strip_Selected.0' },
            ledSpot: { normal: 'Led spot profile.0', selected: 'Led spot profile_Selected.0' },
            none: { normal: 'No Led strip.0', selected: 'No Led strip_Selected.0' },
        },
        ledSpot: { normal: 'Horizontal_Ledspot.0', selected: 'Horizontal_Ledspot_Selected.0' },
        // Every contract filling type → its mesh. sandwichPanelTile has no mesh of its own yet and uses the
        // anthracite panel; the plastic types share one mesh until they get their own looks.
        fillings: {
            glassClear: 'Horizontal_Roof_Glass_Front.0',
            glassOpal: 'Horizontal_Roof_Glass_Front.0',
            plastic: 'Horizontal_Roof_Plastic_Front.0',
            plasticOpal: 'Horizontal_Roof_Plastic_Front.0',
            plasticSunBlocking: 'Horizontal_Roof_Plastic_Front.0',
            sandwichPanelWhite: 'Horizontal_Roof_Sandwich_Panel_White_Front.0',
            sandwichPanelAnthracite: 'Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0',
            sandwichPanelTile: 'Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0',
        },
        // Highlight laid over the selected filling.
        fillingSelected: 'Horizontal_Roof_Selected_Front.0',
        // Glass look per filling type, as values of the glass material's NoGlass / Tint nodes.
        glassLook: {
            glassClear: { NoGlass: 0, Tint: 0 },
            glassOpal: { NoGlass: 0, Tint: 0.6 },
        },
        horizontalScreens: {
            zipper: { screen: 'Horizontal screen zipper top.0', supports: 'Horizontal screen zipper top depth supports.0' },
            nonZipper: { screen: 'Horizontal screen non zipper top.0', supports: 'Horizontal screen non zipper top depth supports.0' },
            bottomZipper: { screen: 'Horizontal screen bottom.0', supports: 'Horizontal screen bottom depth supports.0' },
        },
    };

    // RGB input of the LED material (Light_emit) that takes each strip's / spot's colour. Blender: an RGB node
    // with this name, plugged into the Emission colour. Until it exists LEDs keep their Blender colour.
    const LED_COLOR_INPUT = 'LED color';

    // Labels the configurator uses for the roof groups: "filling_group~2" opens the third filling's group;
    // index −1 closes the group (same protocol as the legacy file).
    const ROOF_GROUP_LABELS = { filling: 'filling_group~', rafter: 'rafter_group~' };

    class StructureSection extends SceneComponent {
        constructor() {
            super();
            this.selection = null;          // { type: 'filling' | 'rafter', index } or null
            this.clickTargets = new Map();  // clone name → { type, index }, rebuilt on every build
            onMissedClick(() => this.onMissedClick());
        }

        enable(spec) {
            this.spec = spec;
            // Top of the crown: the roof, rafters and screen all sit at this height.
            this.crownTop = spec.heightUnderGutter + CALISTA_ATLAS.crown.profileHeight;
            // Spans between the corner poles, along the width and along the depth.
            this.innerWidth = spec.width - 2 * CALISTA_ATLAS.crown.cornerInset;
            this.innerDepth = spec.depth - 2 * CALISTA_ATLAS.crown.cornerInset;
            this.ledStripCount = 0;
            this.ledSpotCount = 0;
            this.ledColor = null;           // first LED colour, for the roof light
            this.clickTargets.clear();

            this.beginBuild();
            this.placeAnchor(spec.xPos, spec.yPos, 0, 0);
            this.enableCrown();
            this.enableRoof(spec.roofOptions);
            this.endBuild();
        }

        // Position in mm, in this section's local frame.
        place(name, x, y, z) {
            setObjTransform(name, false, 'position', [mm(x), mm(y), mm(z)], false);
        }

        // ── crown: the four beams on top of the poles, one continuous ring around the section ─────────────
        enableCrown() {
            const { width, depth } = this.spec;
            const beams = [
                { side: 'front', x: 0, y: depth / 2, span: this.innerWidth },
                { side: 'rear', x: 0, y: -depth / 2, span: this.innerWidth },
                { side: 'left', x: width / 2, y: 0, span: this.innerDepth },
                { side: 'right', x: -width / 2, y: 0, span: this.innerDepth },
            ];
            // Side name → crown beam clone, for the bay options that hang accessories on it. [M7]
            this.crownBeams = {};
            beams.forEach(beam => {
                const template = ROOF_TEMPLATES.crownBeams[beam.side];
                const name = this.pool(template).next();
                if (!name)
                    return;
                this.place(name, beam.x, beam.y, this.crownTop);
                setMorphFactor(name, 'Width', lengthMorph(beam.span));
                ROOF_TEMPLATES.crownAccessories.forEach(accessory => {
                    const child = childObjectName(name, template + '_' + accessory);
                    setMorphFactor(child, 'Width', lengthMorph(beam.span));
                    changeVis(child, ROOF_TEMPLATES.crownAccessoriesDefault.includes(accessory));
                });
                this.crownBeams[beam.side] = name;
            });
        }

        // ── roof ───────────────────────────────────────────────────────────────────────────────────────────
        enableRoof(roofOptions) {
            this.enableRafters(roofOptions.rafters);
            this.enableRoofFillings(roofOptions.roofFillings);
            this.enableHorizontalScreen(roofOptions.horizontalScreen);
        }

        // One rafter per entry, spanning the depth between the front and rear beams. The profile under it shows
        // its lighting: a LED strip, a spot profile with its spots, or none. A strip wins over spots (one
        // profile per rafter). A selected rafter is built from the "_Selected" meshes instead.
        enableRafters(rafters) {
            const { width, depth } = this.spec;
            rafters.forEach((rafter, index) => {
                const x = width / 2 - rafter.position;
                const profile = rafter.ledStrip ? 'ledStrip' : (rafter.ledSpot ? 'ledSpot' : 'none');
                const look = this.isSelected('rafter', index) ? 'selected' : 'normal';
                const target = { type: 'rafter', index: index };

                const parts = [ROOF_TEMPLATES.rafter[look], ROOF_TEMPLATES.rafterProfiles[profile][look]];
                parts.forEach(template => {
                    // the LED strip profile carries the strip's colour, so each needs its own material
                    const name = this.clickable(template, target, { cloneMaterials: template === ROOF_TEMPLATES.rafterProfiles.ledStrip.normal });
                    if (!name)
                        return;
                    this.place(name, x, 0, this.crownTop);
                    setMorphFactor(name, 'Width', lengthMorph(this.innerDepth));
                    if (profile === 'ledStrip' && look === 'normal' && template === parts[1])
                        this.setLedColor(name, rafter.ledStrip);
                });

                if (profile === 'ledStrip')
                    this.ledStripCount++;
                if (profile === 'ledSpot')
                    rafter.ledSpot.positions.forEach(position => {
                        const spot = this.clickable(ROOF_TEMPLATES.ledSpot[look], target, { cloneMaterials: look === 'normal' });
                        if (!spot)
                            return;
                        // spot positions are measured from the rear edge (local Y = −depth / 2)
                        this.place(spot, x, position - depth / 2, this.crownTop);
                        if (look === 'normal')
                            this.setLedColor(spot, rafter.ledSpot.color);
                        this.ledSpotCount++;
                    });
            });
        }

        // One filling per entry, between the rafters. Glass fillings get their own material copy so clear and
        // opal panels can sit side by side. The selected filling gets the highlight laid over it.
        enableRoofFillings(fillings) {
            const { width } = this.spec;
            fillings.forEach((filling, index) => {
                const template = ROOF_TEMPLATES.fillings[filling.type];
                const glassLook = ROOF_TEMPLATES.glassLook[filling.type];
                const target = { type: 'filling', index: index };
                const layers = [this.clickable(template, target, { cloneMaterials: Boolean(glassLook) })];
                if (this.isSelected('filling', index))
                    layers.push(this.clickable(ROOF_TEMPLATES.fillingSelected, target));

                layers.forEach(name => {
                    if (!name)
                        return;
                    this.place(name, width / 2 - filling.position, 0, this.crownTop);
                    setMorphFactor(name, 'Depth', lengthMorph(this.innerDepth));
                    setMorphFactor(name, 'Width', lengthMorph(filling.width));
                });
                if (glassLook && layers[0])
                    Object.keys(glassLook).forEach(valueName => setObjectMaterialValue(layers[0], valueName, glassLook[valueName]));
            });
        }

        // One horizontal screen over the whole section ("its width IS the section width"), plus its depth
        // supports spread evenly between the front and rear beams. Closed (Opening 0) until the screen
        // animation is added. [M8]
        enableHorizontalScreen(screen) {
            if (!screen)
                return;
            const { width, depth } = this.spec;
            const templates = ROOF_TEMPLATES.horizontalScreens[screen.type];

            const name = this.pool(templates.screen).next();
            if (name) {
                this.place(name, 0, 0, this.crownTop);
                setMorphFactor(name, 'Width', lengthMorph(width));
                setMorphFactor(name, 'Depth', lengthMorph(depth));
                setMorphFactor(name, 'Opening', 0);
            }

            // About one support per metre of depth, plus the two end ones, kept 200 mm clear of the beams.
            const supportCount = Math.round(mm(depth) - 0.001) + 2;
            const firstSupport = CALISTA_ATLAS.crown.cornerInset + 200;
            const supportSpacing = (this.innerDepth - 400) / (supportCount - 1);
            for (let i = 0; i < supportCount; i++) {
                const support = this.pool(templates.supports).next();
                if (!support)
                    break;
                this.place(support, 0, firstSupport + supportSpacing * i - depth / 2, this.crownTop);
                setMorphFactor(support, 'Width', lengthMorph(width));
            }

            ['Color 1', 'Color 2', 'Color 3'].forEach((colorName, i) =>
                setMaterialColor('ScreenFabricHorizontal', colorName, 0, 0, 0, screen.screenColor[i]));
        }

        setLedColor(name, color) {
            this.ledColor ??= color;
            if (!setObjectMaterialColor(name, LED_COLOR_INPUT, color))
                warnOnce('the LED material has no RGB input "' + LED_COLOR_INPUT + '" yet, LEDs keep their Blender colour '
                    + '(Blender: add an RGB node named "' + LED_COLOR_INPUT + '" to the Emission colour of Light_emit)');
        }

        // Light the section's LEDs give off, for the roof light. [scene lighting, section 8]
        get ledBrightness() {
            return this.ledStripCount * 2.5 + this.ledSpotCount * 0.5;
        }

        get hasLeds() {
            return this.ledStripCount + this.ledSpotCount > 0;
        }

        // ── selection: a roof filling or rafter, picked in 3D or focused in the configurator ──────────────
        // A pooled clone that can be clicked. Its click target (which filling / rafter it shows) is set on
        // every build, since clones move between entries when the configuration changes.
        clickable(template, target, options = {}) {
            const name = this.pool(template, Object.assign({}, options, {
                onCreate: clone => onObjectClick(clone, () => this.onRoofClick(clone)),
            })).next();
            if (name)
                this.clickTargets.set(name, target);
            return name;
        }

        isSelected(type, index) {
            return Boolean(this.selection) && this.selection.type === type && this.selection.index === index;
        }

        // Select (or, with null, deselect) and rebuild this section to show it. Nothing is sent to the
        // configurator here: select() is also how the configurator's own focus reaches the 3D.
        select(selection) {
            const same = selection === this.selection
                || (selection && this.selection && selection.type === this.selection.type && selection.index === this.selection.index);
            if (same)
                return;
            this.selection = selection;
            if (this.spec && this.isVisible) {
                this.enable(this.spec);
                renderFrame();
            }
        }

        // Clicked in 3D: select it and open its group in the configurator.
        onRoofClick(name) {
            const target = this.clickTargets.get(name);
            if (!target)
                return;
            this.select(target);
            getJSFunction('focus')({ uniqueLabel: ROOF_GROUP_LABELS[target.type] + target.index });
        }

        // A click that hit no clickable object closes the selected group.
        onMissedClick() {
            if (!this.selection)
                return;
            const type = this.selection.type;
            this.select(null);
            getJSFunction('focus')({ uniqueLabel: ROOF_GROUP_LABELS[type] + '-1' });
        }
    }
    //#endregion


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 6 · CAMERA — framing through fitCameraToObjects (zoom-fit on the objects' bounds), never through
    //     hand-placed camera positions. Per-opening framing on step changes comes with the handlers. [Logic #9]
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // The camera looks along Camerapos → Cameratarget (two empties in the GLB) when it frames the build.
    const CAMERA_DIRECTION = { cameraPos: 'Camerapos', cameraTarget: 'Cameratarget' };
    // What the camera looks at while nothing is built: the scene origin, where the Gizmo sits (Blender X/Y/Z).
    const SCENE_ORIGIN = [0, 0, 0];

    /**
     * Frame the given objects: the camera moves along `direction` until they fill the view.
     *   targets    object name, object, or a list of them
     *   direction  [x, y, z] (scene coordinates) or { cameraPos, cameraTarget } (object names); default: current view
     *   options    { margin = 1, duration = 0 (s), onDone }
     * Ported from brustor.js (identical to the legacy Calista version); only the coordinate helpers use their
     * Verge3D 4.13 names (getSceneCoordSystem / transformCoordsSpace), and an orthographic zoom is set directly
     * instead of tweened (Calista's camera is perspective).
     */
    function fitCameraToObjects(targets, direction, options = {}) {
        if (options === null || typeof options !== "object") {
            if (options !== undefined) console.warn("[fitCameraToObjects] 'options' must be an object, got:", options, "— using defaults");
            options = {};
        }
        let { margin = 1, duration = 0, onDone = function () { } } = options;
        if (typeof margin !== "number" || !isFinite(margin) || margin <= 0) { console.warn("[fitCameraToObjects] 'margin' must be a positive number, got:", options.margin, "— using 1"); margin = 1; }
        if (typeof duration !== "number" || !isFinite(duration) || duration < 0) { console.warn("[fitCameraToObjects] 'duration' must be a number ≥ 0, got:", options.duration, "— using 0"); duration = 0; }
        if (typeof onDone !== "function") { console.warn("[fitCameraToObjects] 'onDone' must be a function, got:", options.onDone, "— ignoring (no action)"); onDone = function () { }; }

        if (targets == null) { console.warn("[fitCameraToObjects] 'targets' is missing — nothing to frame"); return; }
        const objects = [];
        (Array.isArray(targets) ? targets : [targets]).forEach(function (entry) {
            if (entry == null) { console.warn("[fitCameraToObjects] skipping a null/undefined target entry"); return; }
            const obj = (typeof entry === "string") ? getObjectByName(entry) : entry;
            if (!obj) { console.warn("[fitCameraToObjects] target not found / invalid:", entry); return; }
            objects.push(obj);
        });
        if (!objects.length) { console.warn("[fitCameraToObjects] nothing to frame — no valid objects resolved from 'targets'"); return; }

        const camera = appInstance.getCamera();
        if (!camera) { console.warn("[fitCameraToObjects] no active camera — appInstance.getCamera() returned nothing"); return; }

        const fitPos = new v3d.Vector3(), center = new v3d.Vector3(), fitZoom = [camera.zoom];
        v3d.CameraUtils.calcCameraZoomToObjectsParams(camera, objects, fitPos, center, fitZoom);
        const fitDistance = fitPos.distanceTo(center) * margin;

        const cameraDirection = new v3d.Vector3();
        if (direction != null) {
            if (direction.cameraPos != null || direction.cameraTarget != null) {
                if (direction.cameraPos == null || direction.cameraTarget == null) {
                    console.warn("[fitCameraToObjects] direction needs BOTH cameraPos and cameraTarget; got:", direction, "— using current view");
                } else {
                    const posObj = (typeof direction.cameraPos === "string") ? getObjectByName(direction.cameraPos) : direction.cameraPos;
                    const targetObj = (typeof direction.cameraTarget === "string") ? getObjectByName(direction.cameraTarget) : direction.cameraTarget;
                    if (!posObj) console.warn("[fitCameraToObjects] direction.cameraPos not found:", direction.cameraPos);
                    if (!targetObj) console.warn("[fitCameraToObjects] direction.cameraTarget not found:", direction.cameraTarget);
                    if (posObj && targetObj) {
                        cameraDirection.copy(posObj.getWorldPosition(new v3d.Vector3())).sub(targetObj.getWorldPosition(new v3d.Vector3()));
                        if (cameraDirection.lengthSq() === 0) console.warn("[fitCameraToObjects] cameraPos and cameraTarget share a position — no direction; using current view");
                    }
                }
            } else {
                const vec = Array.isArray(direction) ? direction : (direction.vector ?? direction);
                const x = vec?.[0] ?? vec?.x, y = vec?.[1] ?? vec?.y, z = vec?.[2] ?? vec?.z;
                if (![x, y, z].every(component => typeof component === "number" && isFinite(component))) {
                    console.warn("[fitCameraToObjects] direction must be [x,y,z] / { vector } / Vector3 (3 finite numbers) or { cameraPos, cameraTarget }; got:", direction, "— using current view");
                } else {
                    cameraDirection.set(x, y, z);
                    cameraDirection.copy(transformCoordsSpace(cameraDirection, getSceneCoordSystem(), 'Y_UP_RIGHT'));
                }
            }
        }
        if (cameraDirection.lengthSq() === 0) cameraDirection.copy(fitPos).sub(center);
        cameraDirection.normalize();

        const cameraPos = center.clone().add(cameraDirection.multiplyScalar(fitDistance));
        const orthoZoom = camera.isOrthographicCamera ? fitZoom[0] / margin : null;
        const setOrthoZoom = function () { camera.zoom = orthoZoom; camera.updateProjectionMatrix(); };

        if (appInstance.controls && appInstance.controls.tween) {
            if (!appInstance.controls.inTween) {
                if (orthoZoom != null) setOrthoZoom();
                appInstance.controls.tween(cameraPos, center, Math.max(0, duration), onDone);
            }
        } else {
            if (orthoZoom != null) setOrthoZoom();
            if (camera.parent) camera.parent.worldToLocal(cameraPos);
            camera.position.copy(cameraPos);
            camera.lookAt(center);
            onDone();
        }
    }

    // Turn the camera towards a point (scene coordinates, metres) without moving it.
    function cameraLookAt(point, options = {}) {
        const { duration = 0, onDone = function () { } } = options;
        const camera = appInstance.getCamera();
        if (!camera)
            return;
        const target = transformCoordsSpace(new v3d.Vector3().fromArray(point), getSceneCoordSystem(), 'Y_UP_RIGHT');
        const position = camera.getWorldPosition(new v3d.Vector3());

        if (appInstance.controls && appInstance.controls.tween) {
            if (!appInstance.controls.inTween)
                appInstance.controls.tween(position, target, Math.max(0, duration), onDone);
        } else {
            camera.lookAt(target);
            onDone();
        }
    }

    // Every object the current build shows: the in-use clones of every visible instance.
    function getFramingTargets() {
        const names = [];
        [structureSectionCache, sideOpeningCache].forEach(cache => cache.forEach(component => {
            if (!component || !component.isVisible)
                return;
            component.pools.forEach(pool => names.push(...pool.names.slice(0, pool.used)));
        }));
        return names.filter(Boolean);
    }

    /**
     * The single entry point for positioning the camera (same name as in brustor.js and the legacy file).
     * Frames the whole build; while nothing is built, looks at the scene origin instead.
     *   options    { duration = 0 (s), margin = 1, onDone } — passed on to fitCameraToObjects / cameraLookAt.
     *              New options (SSR perspectives, per-opening framing, …) are added here as named fields,
     *              so existing calls keep working.
     */
    function cameraPosition(options = {}) {
        renderFrame((options.duration ?? 0) + 0.5);
        const targets = getFramingTargets();
        if (targets.length)
            fitCameraToObjects(targets, CAMERA_DIRECTION, options);
        else
            cameraLookAt(SCENE_ORIGIN, options);
    }


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 7 · RENDERING OUTPUT + CONFIGURATOR HANDLERS
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // The configurator waits for this snapshot after every build (quote PDF / SSR).
    function takeSnapshot(snapshot) {
        renderFrame(1);
        registerSetTimeout(0.25, function () {
            snapshot(appInstance.renderer.domElement.toDataURL("image/png"), 0);
        });
    }

    function generateScreenshot() {
        const link = document.createElement('a');
        link.href = appInstance.renderer.domElement.toDataURL('image/png');
        link.download = sceneParameters.general.screenshotName + '.png';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
    }

    function setCameraOptions() {
        appInstance.controls.panInertia = 0.1;
        appInstance.controls.rotateInertia = 0.1;

        appInstance.controls.minPolarAngle = 0;
        appInstance.controls.maxPolarAngle = 5;
    }

    // A value change re-runs PL.init with the new scope, so the handlers never rebuild the scene themselves.
    function handleButtons(data) {
        switch (data.type) {
            case 'FULL_SCREEN':
                appInstance._resizeCb();
                break;
            case 'DOWNLOAD_IMAGE':
                generateScreenshot();
                break;
            case 'RELOAD_3D':
                cameraPosition({ duration: 1 });
                break;
            case 'SHOW_MEASUREMENTS':   // measurement module [M9]
            case 'SHOW_ENVIRONMENT':    // environment from its own GLB [M10]
            case 'SHOW_ANIMATION':
                break;
        }
    }

    // Step changes: camera framing per opening replaces the hard-coded step ids. [M9]
    function handleEvents(data) {
    }

    // Field focus. A roof group label ("filling_group~2", "rafter_group~0") selects that filling / rafter in
    // 3D; leaving the field (no data) clears it, as in the legacy file. The labels don't name a section, so
    // they go to the first one (Calista has one). Measurement highlighting + camera framing follow. [M9]
    function handleFocus(data) {
        const section = structureSectionCache[0];
        if (!section)
            return;
        if (!data) {
            section.select(null);
            return;
        }
        const label = String(data.uniqueLabel || '');
        for (const [type, prefix] of Object.entries(ROOF_GROUP_LABELS)) {
            if (!label.startsWith(prefix))
                continue;
            const index = parseInt(label.slice(prefix.length), 10);
            section.select(Number.isInteger(index) && index >= 0 ? { type: type, index: index } : null);
            return;
        }
    }

    function handleValue(data) {
    }


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 8 · ORCHESTRATION
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // The single ingestion point: nothing below this function reads scope[] directly.
    function getParameters(scope) {
        const resolved = resolveScope(scope, DEV_SCOPE);
        sceneParameters = parseSceneParameters(resolved.scope);
        sceneParameters.devScope = resolved.devScope;
        logSceneParameters();
    }

    function logSceneParameters() {
        if (sceneParameters.devScope)
            console.warn('[Calista 3D] the scope has no _3d_StructureSections / _3d_SideOpenings, using the bundled DEV scope "' + sceneParameters.devScope + '"');
        console.info('[Calista 3D] sceneParameters', sceneParameters);
        if (sceneParameters.issues.length) {
            console.warn('[Calista 3D] ' + sceneParameters.issues.length + ' scope issue(s):');
            console.table(sceneParameters.issues);
        }
    }

    function enableScene(scope) {
        clearScene();
        getParameters(scope);
        enableScene3D();
        changeVis("Gizmo", true);
        renderFrame();
    }

    function enableScene3D() {
        sceneParameters.structureSections.forEach((spec, index) => {
            structureSectionCache[index] ??= new StructureSection();
            structureSectionCache[index].enable(spec);
        });
        sceneParameters.sideOpenings.forEach((spec, index) => {
            // sideOpeningCache[index] ??= new SideOpening();               [M6]
            // sideOpeningCache[index].enable(spec, index);
        });
        hideLeftovers(structureSectionCache, sceneParameters.structureSections.length);
        hideLeftovers(sideOpeningCache, sceneParameters.sideOpenings.length);

        enableFrameColor();
        enableLighting();
    }

    // The outside frame colour: every profile shares the Powdercoat material.
    function enableFrameColor() {
        if (sceneParameters.general)
            setMaterialColor('Powdercoat', 'RGB', 0, 0, 0, sceneParameters.general.colorOutside);
    }

    // LEDs in the roof dim the sun and light the Spot under the roof (a light in the GLB, centred under the
    // first section's roof). clearScene hides lights too, so they are shown here on every build.
    function enableLighting() {
        const sections = structureSectionCache.slice(0, sceneParameters.structureSections.length);
        const hasLeds = sections.some(section => section.hasLeds);
        const brightness = sections.reduce((sum, section) => sum + section.ledBrightness, 0);

        changeVis('Sun_modern', true);
        setLightParam('INTENSITY', 'Sun_modern', hasLeds ? 0 : 4);

        const section = sections[0];
        changeVis('Spot', hasLeds && Boolean(section));
        if (section) {
            setObjTransform('Spot', false, 'position', [mm(section.spec.xPos), mm(section.spec.yPos), mm(section.crownTop) - 0.2], false);
            setLightParam('INTENSITY', 'Spot', hasLeds ? 6 + brightness : 0);
            if (section.ledColor)
                setLightParam('COLOR_CSS_HEX', 'Spot', section.ledColor);
        }
    }

    // Hide every object of the GLB; each instance shows only the objects it uses. Anchors are re-shown by
    // their instance's beginBuild().
    // The scene root itself is skipped by identity, not by name: the GLB's scene is called "glid", not "Scene".
    function clearScene() {
        const objList = getAllObjectNames();
        for (let i = 0; i < objList.length; i++)
            if (getObjectByName(objList[i]) !== appInstance.scene)
                changeVis(objList[i], false);
    }


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 9 · ENTRY — PL.init runs on load and again on every configurator change
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    PL.init = function (app, scope, snapshot) {
        // A new app (scene reloaded) invalidates every cached clone and anchor: start from scratch.
        if (app !== appInstance) {
            appInstance = app;
            _pGlob.objCache.clear();
            structureSectionCache.length = 0;
            sideOpeningCache.length = 0;
            renderGate.enabled = true;
            installRenderGate();
            clickHandlers.clear();
            missedClickHandlers.clear();
            pointerDownAt.known = false;
            installObjectPicking();
        }

        this.procedures["handleButtons"] = handleButtons;
        this.procedures["handleEvents"] = handleEvents;
        this.procedures["handleFocus"] = handleFocus;
        this.procedures["handleValue"] = handleValue;

        // Inspection hook for the browser console and the Node smoke tests, e.g.
        // v3d.PL.debug.sceneParameters(). Nothing in the configurator relies on it.
        PL.debug = {
            sceneParameters: () => sceneParameters,
            structureSectionCache: structureSectionCache,
            sideOpeningCache: sideOpeningCache,
            SceneComponent: SceneComponent,
            hideLeftovers: hideLeftovers,
            renderFrame: renderFrame,
            cameraPosition: cameraPosition,
            handleObjectPick: handleObjectPick,
            fitCameraToObjects: fitCameraToObjects,
            getObjectByName: getObjectByName,
            setObjTransform: setObjTransform,
            getObjTransform: getObjTransform,
        };

        setCameraOptions();
        enableScene(scope);
        // Frame on the first load only: later changes keep the user's view. RELOAD_3D reframes on demand.
        if (!sceneIsInitialized)
            cameraPosition();
        takeSnapshot(snapshot);

        if (!sceneIsInitialized) {
            // the configurator's loader bar
            for (let i = 0; i <= 100; i++) {
                setTimeout(() => {
                    getJSFunction('getLoadPercentageFrom3D')(i);
                }, i);
            }
            sceneIsInitialized = true;
        }
        else
            getJSFunction('getLoadPercentageFrom3D')(100);
    }
}


//#region 10 · INGESTION
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 10 · INGESTION — the only place scope[] is read
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// Every field is read guarded (validate → default), so one malformed value can never abort the build.
// Problems are collected in sceneParameters.issues and logged once, instead of throwing.
// Values may arrive as real objects or as JSON strings; both are accepted.

const CALISTA_ENUMS = {
    conservatoryStructure: ['freeStanding', 'wallAdjacent'],
    horizontalScreenType: ['zipper', 'nonZipper', 'bottomZipper'],
    motorSide: ['left', 'right'],
    roofFillingType: ['plasticSunBlocking', 'plasticOpal', 'plastic', 'sandwichPanelWhite', 'sandwichPanelAnthracite', 'sandwichPanelTile', 'glassClear', 'glassOpal'],
    poleType: ['corner', 'intermediate', 'wallAdjacent'],
    poleSupport: ['bracket', 'bracketUnder', 'foundation'],
    openingDirection: ['left', 'right', 'middle'],
    draftProfile: ['alu', 'pvc'],
    glass: ['glassClear', 'glassOpal'],
    sunblindType: ['axiom100', 'axiom130', 'element'],
    windowType: ['partialWidth', 'fullWidth'],
    fillType: ['none', 'woodInside', 'woodOutside', 'woodBothSides', 'sandwichPanelAnthracite', 'sandwichPanelWhite', 'glassClear', 'glassOpal'],
};

// Layers each option may be mounted on. The first entry is the default. The Y depth of every
// (option, mounting) pair is a 3D-only value and lives in the atlas (added with the option builders, M7).
const CALISTA_MOUNTINGS = {
    climaglide: ['surface'],
    verticalSunblind: ['builtIn', 'surface'],
    fixedWall: ['builtIn', 'surface'],
    ledStrip: ['builtIn'],
};

// sideSpecs.rotation is absolute and only these four values exist today.
const SIDE_BY_ROTATION = { 0: 'left', 90: 'rear', 180: 'right', 270: 'front' };
const SIDE_NAMES = ['front', 'right', 'rear', 'left'];

// Fallbacks for values that are missing or malformed. Dimensions are only used to keep the scene drawable;
// a scope that needs them is reported in sceneParameters.issues.
const CALISTA_DEFAULTS = {
    screenshotName: 'Your_Skylux_Configuration',
    conservatoryStructure: 'wallAdjacent',
    colorOutside: '#293133',
    width: 3000,
    depth: 3000,
    height: 2500,
    cornerPoleWidth: 150,
    intermediatePoleWidth: 100,
    poleDepth: 150,
    ledColor: '#FFD1A3',
    screenColor: '#4D504D',
    climaglidePanelAmount: 4,
};

/**
 * Small typed readers that never throw. Each takes the raw value and a path used in issue messages
 * (e.g. "_3d_SideOpenings[2].poles[0].position").
 */
function createReader(issues) {
    function report(path, message) {
        issues.push({ path: path, message: message });
    }

    function isMissing(value) {
        return value === undefined || value === null || value === '';
    }

    function fromJson(value, path) {
        if (typeof value !== 'string')
            return value;
        try {
            return JSON.parse(value);
        } catch (error) {
            report(path, 'is not valid JSON');
            return undefined;
        }
    }

    function toNumber(value) {
        if (typeof value === 'number')
            return value;
        if (typeof value === 'string' && value.trim() !== '')
            return Number(value.trim());
        return NaN;
    }

    return {
        report: report,

        // Integer (mm, deg, counts). Numeric strings are accepted. Returns `fallback` when missing or invalid;
        // `required` only decides whether a missing value is reported.
        int(value, path, fallback, options = {}) {
            const min = options.min ?? -Infinity;
            if (isMissing(value)) {
                if (options.required)
                    report(path, 'is missing, using ' + fallback);
                return fallback;
            }
            const number = toNumber(value);
            if (!Number.isFinite(number)) {
                report(path, JSON.stringify(value) + ' is not a number, using ' + fallback);
                return fallback;
            }
            if (number < min) {
                report(path, number + ' is below ' + min + ', using ' + fallback);
                return fallback;
            }
            return Math.round(number);
        },

        bool(value, path, fallback) {
            if (isMissing(value))
                return fallback;
            if (value === true || value === 'true' || value === 1)
                return true;
            if (value === false || value === 'false' || value === 0)
                return false;
            report(path, JSON.stringify(value) + ' is not a boolean, using ' + fallback);
            return fallback;
        },

        str(value, path, fallback) {
            if (value === undefined || value === null)
                return fallback;
            if (typeof value === 'string')
                return value;
            if (typeof value === 'number')
                return String(value);
            report(path, JSON.stringify(value) + ' is not a string, using ' + JSON.stringify(fallback));
            return fallback;
        },

        // One of `allowed` (case-insensitive match, returned in its canonical spelling). Missing → fallback,
        // which is null for nullable fields.
        enumOf(value, path, allowed, fallback) {
            if (isMissing(value))
                return fallback;
            if (allowed.includes(value))
                return value;
            if (typeof value === 'string') {
                const match = allowed.find(item => item.toLowerCase() === value.toLowerCase());
                if (match)
                    return match;
            }
            report(path, JSON.stringify(value) + ' is not one of ' + allowed.join('|') + ', using ' + JSON.stringify(fallback));
            return fallback;
        },

        // Colour as "#RRGGBB" (uppercase). Accepts "RRGGBB", "#RGB" and "RGB".
        hex(value, path, fallback) {
            if (isMissing(value))
                return fallback;
            if (typeof value === 'string') {
                let digits = value.trim().replace(/^#/, '');
                if (/^[0-9a-fA-F]{3}$/.test(digits))
                    digits = digits.split('').map(c => c + c).join('');
                if (/^[0-9a-fA-F]{6}$/.test(digits))
                    return '#' + digits.toUpperCase();
            }
            report(path, JSON.stringify(value) + ' is not a hex colour, using ' + fallback);
            return fallback;
        },

        // Fabric colours: "up to 3" in the contract, always returned as exactly `count` entries
        // (shorter lists repeat their last colour).
        hexList(value, path, fallback, count = 3) {
            const raw = fromJson(value, path);
            const list = [];
            if (Array.isArray(raw)) {
                raw.forEach((item, i) => {
                    const color = this.hex(item, path + '[' + i + ']', null);
                    if (color)
                        list.push(color);
                });
            } else if (!isMissing(raw)) {
                report(path, 'is not a list of colours');
            }
            if (list.length === 0)
                list.push(fallback);
            while (list.length < count)
                list.push(list[list.length - 1]);
            return list.slice(0, count);
        },

        // Array (or JSON string of one). Missing → []. Anything else is reported and ignored.
        array(value, path) {
            const raw = fromJson(value, path);
            if (raw === undefined || raw === null)
                return [];
            if (Array.isArray(raw))
                return raw;
            report(path, 'is not a list, ignored');
            return [];
        },

        // Plain object (or JSON string of one). Missing → null. Anything else is reported and treated as null.
        object(value, path) {
            const raw = fromJson(value, path);
            if (raw === undefined || raw === null)
                return null;
            if (typeof raw === 'object' && !Array.isArray(raw))
                return raw;
            report(path, 'is not an object, ignored');
            return null;
        },
    };
}

// ── general ──────────────────────────────────────────────────────────────────────────────────────────────
function parseGeneral(scope, read) {
    const structure = read.enumOf(scope._3d_conservatoryStructure, '_3d_conservatoryStructure',
        CALISTA_ENUMS.conservatoryStructure, CALISTA_DEFAULTS.conservatoryStructure);

    const wallsRaw = read.object(scope._3d_walls, '_3d_walls') || {};
    const walls = {};
    SIDE_NAMES.forEach(side => {
        walls[side] = read.bool(wallsRaw[side], '_3d_walls.' + side, false);
    });

    return {
        screenshotName: read.str(scope._3d_screenshotName, '_3d_screenshotName', CALISTA_DEFAULTS.screenshotName) || CALISTA_DEFAULTS.screenshotName,
        conservatoryStructure: structure,
        isFreeStanding: structure === 'freeStanding',
        widthTotal: read.int(scope._3d_widthTotal, '_3d_widthTotal', CALISTA_DEFAULTS.width, { required: true, min: 1 }),
        depthTotal: read.int(scope._3d_depthTotal, '_3d_depthTotal', CALISTA_DEFAULTS.depth, { required: true, min: 1 }),
        walls: walls,
        colorOutside: read.hex(scope._3d_colorOutside, '_3d_colorOutside', CALISTA_DEFAULTS.colorOutside),
    };
}

// ── structure sections (roof + crown) ────────────────────────────────────────────────────────────────────
function parseStructureSections(scope, general, read) {
    const list = read.array(scope._3d_StructureSections, '_3d_StructureSections');
    const sections = [];
    list.forEach((raw, i) => {
        const path = '_3d_StructureSections[' + i + ']';
        const section = read.object(raw, path);
        if (section)
            sections.push(parseStructureSection(section, path, sections.length, general, read));
    });

    // Calista always has a roof: without a section there would be nothing to hang the sides on, so one is
    // synthesised from the overall dimensions (a single rectangle, back edge at Y = 0).
    if (sections.length === 0) {
        read.report('_3d_StructureSections', 'has no valid section, using one section of ' + general.widthTotal + ' x ' + general.depthTotal);
        sections.push(parseStructureSection({}, '_3d_StructureSections[fallback]', 0, general, read));
    }
    return sections;
}

function parseStructureSection(section, path, index, general, read) {
    const width = read.int(section.width, path + '.width', general.widthTotal, { required: true, min: 1 });
    const depth = read.int(section.depth, path + '.depth', general.depthTotal, { required: true, min: 1 });
    const adjacent = read.object(section.adjacentSections, path + '.adjacentSections') || {};
    return {
        index: index,
        sectionName: read.str(section.sectionName, path + '.sectionName', ''),
        width: width,
        depth: depth,
        xPos: read.int(section.xPos, path + '.xPos', 0),
        // The contract's default is 0, but xPos/yPos is the bounding-box CENTRE and the back edge sits at
        // Y = 0, so a missing yPos is depth / 2 for a single section.
        yPos: read.int(section.yPos, path + '.yPos', Math.round(depth / 2)),
        heightUnderGutter: read.int(section.heightUnderGutter, path + '.heightUnderGutter', CALISTA_DEFAULTS.height, { required: true, min: 1 }),
        adjacentSections: {
            left: read.str(adjacent.left, path + '.adjacentSections.left', null),
            right: read.str(adjacent.right, path + '.adjacentSections.right', null),
        },
        roofOptions: parseRoofOptions(section.roofOptions, path + '.roofOptions', read),
    };
}

function parseRoofOptions(value, path, read) {
    const roofOptions = read.object(value, path) || {};
    return {
        horizontalScreen: parseHorizontalScreen(roofOptions.horizontalScreen, path + '.horizontalScreen', read),
        roofFillings: parseList(roofOptions.roofFillings, path + '.roofFillings', read, parseRoofFilling),
        rafters: parseList(roofOptions.rafters, path + '.rafters', read, parseRafter),
    };
}

function parseHorizontalScreen(value, path, read) {
    const screen = read.object(value, path);
    if (!screen)
        return null;
    return {
        type: read.enumOf(screen.type, path + '.type', CALISTA_ENUMS.horizontalScreenType, 'nonZipper'),
        screenColor: read.hexList(screen.screenColor, path + '.screenColor', CALISTA_DEFAULTS.screenColor),
        motorSide: read.enumOf(screen.motorSide, path + '.motorSide', CALISTA_ENUMS.motorSide, 'left'),
    };
}

function parseRoofFilling(filling, path, read) {
    const position = read.int(filling.position, path + '.position', null, { required: true });
    const width = read.int(filling.width, path + '.width', null, { required: true, min: 1 });
    if (position === null || width === null)
        return skip(read, path);
    return {
        position: position,
        width: width,
        type: read.enumOf(filling.type, path + '.type', CALISTA_ENUMS.roofFillingType, 'glassClear'),
    };
}

function parseRafter(rafter, path, read) {
    const position = read.int(rafter.position, path + '.position', null, { required: true });
    if (position === null)
        return skip(read, path);

    let ledSpot = null;
    const spot = read.object(rafter.ledSpot, path + '.ledSpot');
    if (spot) {
        const positions = read.array(spot.positions, path + '.ledSpot.positions')
            .map((p, i) => read.int(p, path + '.ledSpot.positions[' + i + ']', null))
            .filter(p => p !== null);
        if (positions.length)
            ledSpot = { positions: positions, color: read.hex(spot.color, path + '.ledSpot.color', CALISTA_DEFAULTS.ledColor) };
    }

    // On a rafter the strip is a bare hex (null = no strip). An object { color } is accepted too, since
    // that is the shape the bay's ledStrip uses.
    let ledStrip = rafter.ledStrip;
    if (ledStrip && typeof ledStrip === 'object')
        ledStrip = ledStrip.color;
    return {
        position: position,
        ledSpot: ledSpot,
        ledStrip: read.hex(ledStrip, path + '.ledStrip', null),
    };
}

// ── side openings ────────────────────────────────────────────────────────────────────────────────────────
function parseSideOpenings(scope, general, sections, read) {
    const list = read.array(scope._3d_SideOpenings, '_3d_SideOpenings');
    const sides = [];
    list.forEach((raw, i) => {
        const path = '_3d_SideOpenings[' + i + ']';
        const sideOpening = read.object(raw, path);
        if (sideOpening)
            sides.push(parseSideOpening(sideOpening, path, sides.length, general, sections, read));
    });
    return sides;
}

function parseSideOpening(sideOpening, path, index, general, sections, read) {
    const specsPath = path + '.sideSpecs';
    const specs = read.object(sideOpening.sideSpecs, specsPath) || {};

    const rotationRaw = read.int(specs.rotation, specsPath + '.rotation', 0);
    const rotation = ((rotationRaw % 360) + 360) % 360;
    const side = SIDE_BY_ROTATION[rotation] || null;
    if (!side)
        read.report(specsPath + '.rotation', rotation + ' is not one of 0|90|180|270; the side is drawn but has no side name (walls, camera)');

    // Front/rear run along the width, left/right along the depth.
    const runsAlongWidth = side === 'front' || side === 'rear';
    const length = read.int(specs.length, specsPath + '.length', runsAlongWidth ? general.widthTotal : general.depthTotal, { required: true, min: 1 });
    const height = read.int(specs.height, specsPath + '.height', sections[0].heightUnderGutter, { required: true, min: 1 });

    const poles = parseList(sideOpening.poles, path + '.poles', read, (pole, polePath, read) => parsePole(pole, polePath, read, length, height));
    poles.forEach((pole, i) => pole.index ??= i);

    // poleAmount is derived from poles[]; a mismatch is only reported.
    const poleAmount = read.int(specs.poleAmount, specsPath + '.poleAmount', poles.length);
    if (poleAmount !== poles.length)
        read.report(specsPath + '.poleAmount', poleAmount + ' does not match ' + poles.length + ' poles; poles[] is used');

    return {
        index: index,
        side: side,
        isWall: side ? general.walls[side] : false,
        sideSpecs: {
            xPos: read.int(specs.xPos, specsPath + '.xPos', 0),
            yPos: read.int(specs.yPos, specsPath + '.yPos', 0),
            rotation: rotation,
            length: length,
            height: height,
            poleAmount: poles.length,
            sections: read.array(specs.sections, specsPath + '.sections').filter(name => typeof name === 'string'),
        },
        poles: poles,
        // Bays are taken as sent: a corner pole belongs to one side only, so a side's bays can span gaps
        // between poles of the neighbouring sides. They can't be derived from this side's poles.
        bays: parseList(sideOpening.bays, path + '.bays', read, (bay, bayPath, read) => parseBay(bay, bayPath, read, height)),
    };
}

function parsePole(pole, path, read, sideLength, sideHeight) {
    const position = read.int(pole.position, path + '.position', null, { required: true });
    if (position === null)
        return skip(read, path);
    if (position < 0 || position > sideLength)
        read.report(path + '.position', position + ' is outside the side (0..' + sideLength + ')');

    const type = read.enumOf(pole.type, path + '.type', CALISTA_ENUMS.poleType, null);
    if (!type)
        read.report(path + '.type', 'is missing, using "intermediate"');
    const resolvedType = type || 'intermediate';
    const defaultWidth = resolvedType === 'intermediate' ? CALISTA_DEFAULTS.intermediatePoleWidth : CALISTA_DEFAULTS.cornerPoleWidth;

    return {
        index: read.int(pole.index, path + '.index', null),
        type: resolvedType,
        position: position,
        width: read.int(pole.width, path + '.width', defaultWidth, { required: true, min: 1 }),
        depth: read.int(pole.depth, path + '.depth', CALISTA_DEFAULTS.poleDepth, { required: true, min: 1 }),
        length: read.int(pole.length, path + '.length', sideHeight, { required: true, min: 1 }),
        support: read.enumOf(pole.support, path + '.support', CALISTA_ENUMS.poleSupport, null),
    };
}

// ── bays and their options ───────────────────────────────────────────────────────────────────────────────
function parseBay(bay, path, read, sideHeight) {
    const specsPath = path + '.generalSpecs';
    const specs = read.object(bay.generalSpecs, specsPath) || {};
    const position = read.int(specs.position, specsPath + '.position', null, { required: true });
    const length = read.int(specs.length, specsPath + '.length', null, { required: true, min: 1 });
    if (position === null || length === null)
        return skip(read, path);
    const generalSpecs = {
        position: position,
        length: length,
        height: read.int(specs.height, specsPath + '.height', sideHeight, { required: true, min: 1 }),
    };

    // A null or missing option is simply not drawn.
    return {
        generalSpecs: generalSpecs,
        climaglide: parseOption(bay.climaglide, path + '.climaglide', read, parseClimaglide),
        verticalSunblind: parseOption(bay.verticalSunblind, path + '.verticalSunblind', read, (o, p, r) => parseVerticalSunblind(o, p, r, generalSpecs)),
        fixedWall: parseOption(bay.fixedWall, path + '.fixedWall', read, (o, p, r) => parseFixedWall(o, p, r, generalSpecs)),
        ledStrip: parseBayLedStrip(bay.ledStrip, path + '.ledStrip', read),
    };
}

function parseClimaglide(option, path, read) {
    return {
        mounting: readMounting(option, path, read, 'climaglide'),
        panelAmount: read.int(option.panelAmount, path + '.panelAmount', CALISTA_DEFAULTS.climaglidePanelAmount, { min: 1 }),
        openingDirection: read.enumOf(option.openingDirection, path + '.openingDirection', CALISTA_ENUMS.openingDirection, 'left'),
        handle: read.bool(option.handle, path + '.handle', false),
        sideProfile: read.bool(option.sideProfile, path + '.sideProfile', false),
        foundationProfile: read.bool(option.foundationProfile, path + '.foundationProfile', false),
        draftProfile: read.enumOf(option.draftProfile, path + '.draftProfile', CALISTA_ENUMS.draftProfile, null),
        glass: read.enumOf(option.glass, path + '.glass', CALISTA_ENUMS.glass, 'glassClear'),
    };
}

function parseVerticalSunblind(option, path, read, bay) {
    let window = null;
    const windowPath = path + '.window';
    const windowRaw = read.object(option.window, windowPath);
    if (windowRaw) {
        const width = read.int(windowRaw.width, windowPath + '.width', null, { required: true, min: 1 });
        const height = read.int(windowRaw.height, windowPath + '.height', null, { required: true, min: 1 });
        if (width === null || height === null) {
            read.report(windowPath, 'is incomplete, drawn without a window');
        } else {
            window = {
                type: read.enumOf(windowRaw.type, windowPath + '.type', CALISTA_ENUMS.windowType, 'partialWidth'),
                position: read.int(windowRaw.position, windowPath + '.position', bay.position, { required: true }),
                width: width,
                height: height,
                groundHeight: read.int(windowRaw.groundHeight, windowPath + '.groundHeight', 0, { required: true, min: 0 }),
            };
        }
    }
    return {
        mounting: readMounting(option, path, read, 'verticalSunblind'),
        type: read.enumOf(option.type, path + '.type', CALISTA_ENUMS.sunblindType, 'axiom100'),
        screenColor: read.hexList(option.screenColor, path + '.screenColor', CALISTA_DEFAULTS.screenColor),
        solar: read.bool(option.solar, path + '.solar', false),
        window: window,
    };
}

function parseFixedWall(option, path, read, bay) {
    return {
        mounting: readMounting(option, path, read, 'fixedWall'),
        partitions: parseList(option.partitions, path + '.partitions', read, (partition, partitionPath, read) => {
            const position = read.int(partition.position, partitionPath + '.position', null, { required: true });
            const width = read.int(partition.width, partitionPath + '.width', null, { required: true, min: 1 });
            if (position === null || width === null)
                return skip(read, partitionPath);
            return {
                position: position,
                width: width,
                height: read.int(partition.height, partitionPath + '.height', bay.height, { required: true, min: 1 }),
                fillType: read.enumOf(partition.fillType, partitionPath + '.fillType', CALISTA_ENUMS.fillType, 'none'),
            };
        }),
    };
}

// On a bay the strip is an object { mounting, color }. A bare hex (the rafter's shape) is accepted too.
function parseBayLedStrip(value, path, read) {
    if (typeof value === 'string' && !value.trim().startsWith('{'))
        return { mounting: CALISTA_MOUNTINGS.ledStrip[0], color: read.hex(value, path, CALISTA_DEFAULTS.ledColor) };
    return parseOption(value, path, read, (option, optionPath, read) => ({
        mounting: readMounting(option, optionPath, read, 'ledStrip'),
        color: read.hex(option.color, optionPath + '.color', CALISTA_DEFAULTS.ledColor),
    }));
}

// ── shared parse helpers ─────────────────────────────────────────────────────────────────────────────────
function readMounting(option, path, read, optionName) {
    const allowed = CALISTA_MOUNTINGS[optionName];
    return read.enumOf(option.mounting, path + '.mounting', allowed, allowed[0]);
}

function parseOption(value, path, read, parse) {
    const option = read.object(value, path);
    return option ? parse(option, path, read) : null;
}

// Parses every entry of a list; entries that are not objects, or that parse to null, are dropped.
function parseList(value, path, read, parse) {
    const result = [];
    read.array(value, path).forEach((raw, i) => {
        const itemPath = path + '[' + i + ']';
        const item = read.object(raw, itemPath);
        const parsed = item ? parse(item, itemPath, read) : null;
        if (parsed)
            result.push(parsed);
    });
    return result;
}

function skip(read, path) {
    read.report(path, 'is missing a required value and is not drawn');
    return null;
}

function parseRender(scope, read) {
    return {
        files: read.array(scope._3dFiles, '_3dFiles').filter(file => typeof file === 'string'),
        perspective: read.str(scope._perspective, '_perspective', null),
        ssrEnvironment: read.bool(scope._ssrEnvironment, '_ssrEnvironment', false),
    };
}

// Cross-field checks: nothing is changed, contradictions are only reported.
function checkConsistency(params, read) {
    const wallSides = SIDE_NAMES.filter(side => params.general.walls[side]);
    if (params.general.isFreeStanding && wallSides.length)
        read.report('_3d_walls', 'freeStanding structure has house walls on ' + wallSides.join(', ') + '; the walls are drawn');
    if (!params.general.isFreeStanding && !wallSides.length)
        read.report('_3d_walls', 'wallAdjacent structure has no house wall on any side');

    const seen = {};
    params.sideOpenings.forEach(sideOpening => {
        if (!sideOpening.side)
            return;
        if (seen[sideOpening.side])
            read.report('_3d_SideOpenings[' + sideOpening.index + ']', 'is a second "' + sideOpening.side + '" side');
        seen[sideOpening.side] = true;
    });
}

function createEmptySceneParameters() {
    return { general: null, structureSections: [], sideOpenings: [], render: { files: [], perspective: null, ssrEnvironment: false }, issues: [] };
}

/**
 * Parse the raw configurator scope into ONE sceneParameters object. Pure: no Verge3D, no globals, never
 * throws. Everything the 3D draws comes from the returned object.
 */
function parseSceneParameters(scope) {
    const issues = [];
    const read = createReader(issues);
    try {
        if (scope === null || scope === undefined || typeof scope !== 'object') {
            if (scope !== null && scope !== undefined)
                read.report('scope', 'is not an object');
            scope = {};
        }
        const general = parseGeneral(scope, read);
        const structureSections = parseStructureSections(scope, general, read);
        const params = {
            general: general,
            structureSections: structureSections,
            sideOpenings: parseSideOpenings(scope, general, structureSections, read),
            render: parseRender(scope, read),
            issues: issues,
        };
        checkConsistency(params, read);
        return params;
    } catch (error) {
        // Last resort: a bug in the readers above must still not take the configurator down.
        read.report('scope', 'could not be read: ' + error.message);
        const params = createEmptySceneParameters();
        params.issues = issues;
        return params;
    }
}

/**
 * Picks the scope to parse. A scope that carries the contract is used as-is. One that doesn't falls back to
 * DEV_SCOPES[devScopeName] (when set), keeping the scope's own non-contract keys such as _3dFiles.
 */
function resolveScope(scope, devScopeName) {
    const base = scope && typeof scope === 'object' ? scope : {};
    const hasContract = base._3d_StructureSections !== undefined || base._3d_SideOpenings !== undefined;
    if (hasContract || !devScopeName)
        return { scope: base, devScope: null };
    if (!DEV_SCOPES[devScopeName]) {
        console.warn('[Calista 3D] DEV_SCOPE "' + devScopeName + '" does not exist; use one of ' + Object.keys(DEV_SCOPES).join(', '));
        return { scope: base, devScope: null };
    }
    const devScope = JSON.parse(JSON.stringify(DEV_SCOPES[devScopeName]));   // a copy: DEV_SCOPES stays as is
    if (DEV_LED_COLORS)
        recolorLeds(devScope, DEV_LED_COLORS);
    return { scope: Object.assign({}, base, devScope), devScope: devScopeName };
}

// Gives every LED of a raw scope the next colour of `colors` (dev testing, see DEV_LED_COLORS).
function recolorLeds(scope, colors) {
    let next = 0;
    const color = () => colors[next++ % colors.length];
    (scope._3d_StructureSections || []).forEach(section => {
        const rafters = (section && section.roofOptions && section.roofOptions.rafters) || [];
        rafters.forEach(rafter => {
            if (rafter.ledStrip)
                rafter.ledStrip = color();
            if (rafter.ledSpot)
                rafter.ledSpot.color = color();
        });
    });
    (scope._3d_SideOpenings || []).forEach(side => ((side && side.bays) || []).forEach(bay => {
        if (bay && bay.ledStrip)
            bay.ledStrip.color = color();
    }));
}
//#endregion


//#region DEV_SCOPES
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// DEV_SCOPES — bundled example scopes for the DEV_SCOPE switch (section 0)
// Generated from examples_source_files/input_example_*_h_roof.js; the Node tests check they still match.
// Do not edit by hand. Remove together with DEV_SCOPE once the configurator sends the contract.
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
const DEV_SCOPES = {
    freestanding: {
        "_3d_screenshotName": "Calista_freestanding",
        "_3d_conservatoryStructure": "freeStanding",
        "_3d_widthTotal": 6000,
        "_3d_depthTotal": 4000,
        "_3d_walls": {"front":false,"right":false,"rear":false,"left":false},
        "_3d_colorOutside": "#293133",
        "_3d_StructureSections": [
            {
                "width": 6000,
                "depth": 4000,
                "xPos": 0,
                "yPos": 2000,
                "heightUnderGutter": 2500,
                "sectionName": "Section_1",
                "adjacentSections": {"left":null,"right":null},
                "roofOptions": {
                    "horizontalScreen": {"type":"zipper","screenColor":["#D9D4C7","#D9D4C7","#D9D4C7"],"motorSide":"right"},
                    "roofFillings": [
                        {"position":500,"width":1000,"type":"glassClear"},
                        {"position":1500,"width":1000,"type":"glassClear"},
                        {"position":2500,"width":1000,"type":"glassOpal"},
                        {"position":3500,"width":1000,"type":"glassOpal"},
                        {"position":4500,"width":1000,"type":"glassClear"},
                        {"position":5500,"width":1000,"type":"glassClear"}
                    ],
                    "rafters": [
                        {
                            "position": 1000,
                            "ledSpot": {"positions":[1000,2000,3000],"color":"#FFD1A3"},
                            "ledStrip": null
                        },
                        {"position":2000,"ledSpot":null,"ledStrip":null},
                        {"position":3000,"ledSpot":null,"ledStrip":"#FFFFFF"},
                        {"position":4000,"ledSpot":null,"ledStrip":null},
                        {
                            "position": 5000,
                            "ledSpot": {"positions":[1000,2000,3000],"color":"#FFD1A3"},
                            "ledStrip": null
                        }
                    ]
                }
            }
        ],
        "_3d_SideOpenings": [
            {
                "sideSpecs": {
                    "xPos": 3000,
                    "yPos": 4000,
                    "rotation": 270,
                    "length": 6000,
                    "height": 2500,
                    "poleAmount": 3,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 3000,
                        "width": 100,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 1
                    },
                    {
                        "type": "corner",
                        "position": 5925,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 2
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": {"position":1550,"length":2800,"height":2500},
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 4,
                            "openingDirection": "middle",
                            "handle": true,
                            "sideProfile": true,
                            "foundationProfile": true,
                            "draftProfile": "alu",
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom100",
                            "screenColor": ["#7A7A7A","#7A7A7A","#7A7A7A"],
                            "solar": false,
                            "window": null
                        },
                        "fixedWall": null,
                        "ledStrip": {"mounting":"builtIn","color":"#FFD1A3"}
                    },
                    {
                        "generalSpecs": {"position":4450,"length":2800,"height":2500},
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 3,
                            "openingDirection": "right",
                            "handle": true,
                            "sideProfile": false,
                            "foundationProfile": true,
                            "draftProfile": "alu",
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom100",
                            "screenColor": ["#7A7A7A","#7A7A7A","#7A7A7A"],
                            "solar": false,
                            "window": null
                        },
                        "fixedWall": null,
                        "ledStrip": {"mounting":"builtIn","color":"#FFD1A3"}
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -3000,
                    "yPos": 0,
                    "rotation": 90,
                    "length": 6000,
                    "height": 2500,
                    "poleAmount": 3,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 3000,
                        "width": 100,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 1
                    },
                    {
                        "type": "corner",
                        "position": 5925,
                        "width": 150,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 2
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": {"position":1550,"length":2800,"height":2500},
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                {"position":850,"width":1400,"height":2500,"fillType":"glassClear"},
                                {"position":2250,"width":1400,"height":2500,"fillType":"glassClear"}
                            ]
                        },
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": {"position":4450,"length":2800,"height":2500},
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [{"position":4450,"width":2800,"height":2500,"fillType":"glassOpal"}]
                        },
                        "ledStrip": null
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": 3000,
                    "yPos": 0,
                    "rotation": 0,
                    "length": 4000,
                    "height": 2500,
                    "poleAmount": 1,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "intermediate",
                        "position": 2000,
                        "width": 100,
                        "depth": 150,
                        "length": 2500,
                        "support": "foundation",
                        "index": 0
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": {"position":1050,"length":1800,"height":2500},
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#4D504D","#4D504D","#4D504D"],
                            "solar": true,
                            "window": {
                                "type": "partialWidth",
                                "position": 1050,
                                "width": 800,
                                "height": 800,
                                "groundHeight": 900
                            }
                        },
                        "fixedWall": null,
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": {"position":2950,"length":1800,"height":2500},
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#4D504D","#4D504D","#4D504D"],
                            "solar": true,
                            "window": {"type":"fullWidth","position":2950,"width":1800,"height":600,"groundHeight":1000}
                        },
                        "fixedWall": null,
                        "ledStrip": null
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -3000,
                    "yPos": 4000,
                    "rotation": 180,
                    "length": 4000,
                    "height": 2500,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": {"position":2000,"length":3700,"height":2500},
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 6,
                            "openingDirection": "middle",
                            "handle": true,
                            "sideProfile": false,
                            "foundationProfile": true,
                            "draftProfile": "pvc",
                            "glass": "glassOpal"
                        },
                        "verticalSunblind": null,
                        "fixedWall": null,
                        "ledStrip": null
                    }
                ]
            }
        ]
    },
    wallRear: {
        "_3d_screenshotName": "Calista_wall_rear",
        "_3d_conservatoryStructure": "wallAdjacent",
        "_3d_widthTotal": 5000,
        "_3d_depthTotal": 3500,
        "_3d_walls": {"front":false,"right":false,"rear":true,"left":false},
        "_3d_colorOutside": "#F1F0EA",
        "_3d_StructureSections": [
            {
                "width": 5000,
                "depth": 3500,
                "xPos": 0,
                "yPos": 1750,
                "heightUnderGutter": 2400,
                "sectionName": "Section_1",
                "adjacentSections": {"left":null,"right":null},
                "roofOptions": {
                    "horizontalScreen": {"type":"bottomZipper","screenColor":["#8C8C8C","#8C8C8C","#5A5A5A"],"motorSide":"left"},
                    "roofFillings": [
                        {"position":500,"width":1000,"type":"plastic"},
                        {"position":1500,"width":1000,"type":"plasticOpal"},
                        {"position":2500,"width":1000,"type":"plasticSunBlocking"},
                        {"position":3500,"width":1000,"type":"plasticOpal"},
                        {"position":4500,"width":1000,"type":"plastic"}
                    ],
                    "rafters": [
                        {
                            "position": 1000,
                            "ledSpot": {"positions":[875,1750,2625],"color":"#FFFFFF"},
                            "ledStrip": null
                        },
                        {
                            "position": 2000,
                            "ledSpot": {"positions":[875,1750,2625],"color":"#FFFFFF"},
                            "ledStrip": null
                        },
                        {
                            "position": 3000,
                            "ledSpot": {"positions":[875,1750,2625],"color":"#FFFFFF"},
                            "ledStrip": null
                        },
                        {
                            "position": 4000,
                            "ledSpot": {"positions":[875,1750,2625],"color":"#FFFFFF"},
                            "ledStrip": null
                        }
                    ]
                }
            }
        ],
        "_3d_SideOpenings": [
            {
                "sideSpecs": {
                    "xPos": 2500,
                    "yPos": 3500,
                    "rotation": 270,
                    "length": 5000,
                    "height": 2400,
                    "poleAmount": 3,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "bracketUnder",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 2500,
                        "width": 100,
                        "depth": 150,
                        "length": 2400,
                        "support": "bracketUnder",
                        "index": 1
                    },
                    {
                        "type": "corner",
                        "position": 4925,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "bracketUnder",
                        "index": 2
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": {"position":1300,"length":2300,"height":2400},
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 3,
                            "openingDirection": "left",
                            "handle": true,
                            "sideProfile": true,
                            "foundationProfile": false,
                            "draftProfile": null,
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "element",
                            "screenColor": ["#3C3C3C","#3C3C3C","#3C3C3C"],
                            "solar": true,
                            "window": {
                                "type": "partialWidth",
                                "position": 1300,
                                "width": 1000,
                                "height": 700,
                                "groundHeight": 800
                            }
                        },
                        "fixedWall": null,
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": {"position":3700,"length":2300,"height":2400},
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "surface",
                            "partitions": [
                                {"position":3125,"width":1150,"height":2400,"fillType":"woodOutside"},
                                {"position":4275,"width":1150,"height":2400,"fillType":"sandwichPanelWhite"}
                            ]
                        },
                        "ledStrip": null
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2500,
                    "yPos": 0,
                    "rotation": 90,
                    "length": 5000,
                    "height": 2400,
                    "poleAmount": 2,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "wallAdjacent",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "foundation",
                        "index": 0
                    },
                    {
                        "type": "wallAdjacent",
                        "position": 4925,
                        "width": 150,
                        "depth": 150,
                        "length": 2400,
                        "support": "foundation",
                        "index": 1
                    }
                ],
                "bays": []
            },
            {
                "sideSpecs": {
                    "xPos": 2500,
                    "yPos": 0,
                    "rotation": 0,
                    "length": 3500,
                    "height": 2400,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": {"position":1750,"length":3200,"height":2400},
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                {"position":925,"width":1550,"height":2400,"fillType":"glassClear"},
                                {"position":2525,"width":1650,"height":2400,"fillType":"woodInside"}
                            ]
                        },
                        "ledStrip": {"mounting":"builtIn","color":"#FFFFFF"}
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2500,
                    "yPos": 3500,
                    "rotation": 180,
                    "length": 3500,
                    "height": 2400,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": {"position":1750,"length":3200,"height":2400},
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 4,
                            "openingDirection": "right",
                            "handle": true,
                            "sideProfile": false,
                            "foundationProfile": true,
                            "draftProfile": "alu",
                            "glass": "glassOpal"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#8C8C8C","#8C8C8C","#5A5A5A"],
                            "solar": false,
                            "window": {"type":"fullWidth","position":1750,"width":3200,"height":800,"groundHeight":1200}
                        },
                        "fixedWall": null,
                        "ledStrip": {"mounting":"builtIn","color":"#FFFFFF"}
                    }
                ]
            }
        ]
    },
    wallRearRight: {
        "_3d_screenshotName": "Calista_wall_rear_right",
        "_3d_conservatoryStructure": "wallAdjacent",
        "_3d_widthTotal": 4500,
        "_3d_depthTotal": 3000,
        "_3d_walls": {"front":false,"right":true,"rear":true,"left":false},
        "_3d_colorOutside": "#1E1E1E",
        "_3d_StructureSections": [
            {
                "width": 4500,
                "depth": 3000,
                "xPos": 0,
                "yPos": 1500,
                "heightUnderGutter": 2600,
                "sectionName": "Section_1",
                "adjacentSections": {"left":null,"right":null},
                "roofOptions": {
                    "horizontalScreen": null,
                    "roofFillings": [
                        {"position":375,"width":750,"type":"sandwichPanelAnthracite"},
                        {"position":1125,"width":750,"type":"sandwichPanelWhite"},
                        {"position":1875,"width":750,"type":"sandwichPanelTile"},
                        {"position":2625,"width":750,"type":"sandwichPanelTile"},
                        {"position":3375,"width":750,"type":"sandwichPanelWhite"},
                        {"position":4125,"width":750,"type":"sandwichPanelAnthracite"}
                    ],
                    "rafters": [
                        {"position":750,"ledSpot":null,"ledStrip":"#FFD1A3"},
                        {"position":1500,"ledSpot":null,"ledStrip":null},
                        {"position":2250,"ledSpot":null,"ledStrip":"#FFD1A3"},
                        {"position":3000,"ledSpot":null,"ledStrip":null},
                        {"position":3750,"ledSpot":null,"ledStrip":"#FFD1A3"}
                    ]
                }
            }
        ],
        "_3d_SideOpenings": [
            {
                "sideSpecs": {
                    "xPos": 2250,
                    "yPos": 3000,
                    "rotation": 270,
                    "length": 4500,
                    "height": 2600,
                    "poleAmount": 2,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "corner",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 0
                    },
                    {
                        "type": "intermediate",
                        "position": 2250,
                        "width": 100,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 1
                    }
                ],
                "bays": [
                    {
                        "generalSpecs": {"position":1175,"length":2050,"height":2600},
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                {
                                    "position": 500,
                                    "width": 700,
                                    "height": 2600,
                                    "fillType": "sandwichPanelAnthracite"
                                },
                                {"position":1175,"width":650,"height":2600,"fillType":"woodBothSides"},
                                {"position":1850,"width":700,"height":2600,"fillType":"none"}
                            ]
                        },
                        "ledStrip": {"mounting":"builtIn","color":"#FFD1A3"}
                    },
                    {
                        "generalSpecs": {"position":3325,"length":2050,"height":2600},
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "surface",
                            "type": "axiom130",
                            "screenColor": ["#E5E1D8","#C9C3B6","#E5E1D8"],
                            "solar": false,
                            "window": {"type":"fullWidth","position":3325,"width":2050,"height":700,"groundHeight":1100}
                        },
                        "fixedWall": null,
                        "ledStrip": {"mounting":"builtIn","color":"#FFD1A3"}
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2250,
                    "yPos": 0,
                    "rotation": 90,
                    "length": 4500,
                    "height": 2600,
                    "poleAmount": 1,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "wallAdjacent",
                        "position": 4425,
                        "width": 150,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 0
                    }
                ],
                "bays": []
            },
            {
                "sideSpecs": {
                    "xPos": 2250,
                    "yPos": 0,
                    "rotation": 0,
                    "length": 3000,
                    "height": 2600,
                    "poleAmount": 0,
                    "sections": ["Section_1"]
                },
                "poles": [],
                "bays": [
                    {
                        "generalSpecs": {"position":1500,"length":2700,"height":2600},
                        "climaglide": {
                            "mounting": "surface",
                            "panelAmount": 6,
                            "openingDirection": "middle",
                            "handle": false,
                            "sideProfile": true,
                            "foundationProfile": true,
                            "draftProfile": "pvc",
                            "glass": "glassClear"
                        },
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom100",
                            "screenColor": ["#4D504D","#4D504D","#4D504D"],
                            "solar": true,
                            "window": {
                                "type": "partialWidth",
                                "position": 1500,
                                "width": 1200,
                                "height": 900,
                                "groundHeight": 700
                            }
                        },
                        "fixedWall": null,
                        "ledStrip": {"mounting":"builtIn","color":"#FFD1A3"}
                    }
                ]
            },
            {
                "sideSpecs": {
                    "xPos": -2250,
                    "yPos": 3000,
                    "rotation": 180,
                    "length": 3000,
                    "height": 2600,
                    "poleAmount": 1,
                    "sections": ["Section_1"]
                },
                "poles": [
                    {
                        "type": "wallAdjacent",
                        "position": 75,
                        "width": 150,
                        "depth": 150,
                        "length": 2600,
                        "support": "bracket",
                        "index": 0
                    }
                ],
                "bays": []
            }
        ]
    }
};
//#endregion

export { createPL, parseSceneParameters, resolveScope, DEV_LED_COLORS, mm, lengthMorph, CALISTA_ATLAS, sideAnchorRotationZ, sideLocalToWorld, DEV_SCOPES };
