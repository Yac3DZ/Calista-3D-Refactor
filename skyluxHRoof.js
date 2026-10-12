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
//   1 · SCENE GEOMETRY         pure helpers: mm → m, side rotation, side-local → world
//   2 · createPL               Verge3D puzzle globals + state that SURVIVES PL.init re-runs
//   3 · VERGE3D 4.13 HELPERS   #region — puzzle library, newest API only; grown milestone by milestone
//   4 · FOUNDATIONS            handles, ObjectPool, SceneComponent base class, render gate
//   5 · OUTPUT + HANDLERS      snapshot, screenshot, handleButtons / handleEvents / handleFocus / handleValue
//   6 · ORCHESTRATION          enableScene → getParameters → enableScene3D
//   7 · ENTRY                  PL.init
//   8 · INGESTION              #region — pure functions, no Verge3D: scope → sceneParameters (validated,
//                              defaulted). Called from getParameters() in section 6.
//   DEV_SCOPES                 #region — bundled example scopes
//
// CONVENTIONS
//   - sceneParameters keeps the contract's units: millimetres and degrees. Conversion to metres happens once,
//     with mm(), where an object is placed — never scattered through the builders.
//   - The configurator calls PL.init again on every change. Helpers, classes and instance caches are declared
//     once in createPL; PL.init only passes the current app + scope and runs a build.
//   - Coordinates (from the contract datums): the back edge of the structure sits centred on X at Y = 0,
//     Y+ faces forward (front side at Y = depth), +X points to the LEFT side. Each side runs left → right as
//     seen from outside, starting at its first pole's outer corner. A side's handle gets Z rotation
//     90 − rotation, so on every side local +X runs along the side and local +Y points into the structure.
//   - Every object belongs to an instance: it is a clone from that instance's ObjectPool, parented to the
//     instance's handle, and positioned in the handle's local frame.
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


//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 1 · SCENE GEOMETRY — pure helpers, no Verge3D
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// The contract is in millimetres, the scene in metres. Convert with mm() at the point an object is placed.
function mm(value) {
    return value / 1000;
}

// sideSpecs.rotation is a compass-style heading: the side runs along (sin r, cos r) in world X/Y
// (left 0 → +Y, rear 90 → +X, right 180 → −Y, front 270 → −X). Verge3D/Blender rotate counter-clockwise
// from +X, so a side's handle gets Z rotation 90 − r. With it every side shares ONE local frame:
// local +X runs along the side (left → right seen from outside), local +Y points INTO the structure.
// That single frame is what removes every `if (side == 'Left')` branch.
function sideHandleRotationZ(rotation) {
    return 90 - rotation;
}

// World X/Y (mm) of a point given in a side's local frame (mm). Mirrors what the handle transform does;
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

    // A handle is a plain empty that carries an instance's transform; every object of the instance is
    // parented to it. The GLB has no empty template to clone, and an empty has no geometry or material, so
    // creating one directly is equivalent to cloning one.
    function createEmpty(baseName) {
        const empty = new v3d.Object3D();
        empty.name = generateUniqueObjectName(baseName);
        appInstance.scene.add(empty);
        _pGlob.objCache.set(empty.name, empty);
        return empty.name;
    }

    /**
     * Clones of one template, parented to one handle, reused across rebuilds.
     * Per build: reset() → next() for every object needed → hideUnused(). Clones are created only when a
     * build needs more than any build before it, so a configuration change never re-clones.
     */
    class ObjectPool {
        constructor(templateName, parentName) {
            this.templateName = templateName;
            this.parentName = parentName;
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
                name = cloneObject(this.templateName, false, false);
                if (!name) {
                    warnOnce('template object "' + this.templateName + '" is not in the scene');
                    return null;
                }
                makeParent(name, this.parentName);
                this.resetLocalTransform(name);
                this.names[this.used] = name;
            }
            this.used++;
            changeVis(name, true);
            return name;
        }

        hideUnused() {
            for (let i = this.used; i < this.names.length; i++)
                changeVis(this.names[i], false);
        }

        // makeParent keeps the clone's WORLD transform, so under a rotated handle its local rotation would
        // compensate the handle's. Reset it: position at the handle's origin, the template's own rotation and
        // scale. Builders then only set what differs (position, and rotation where a template isn't authored
        // in the side's local frame).
        resetLocalTransform(name) {
            setObjTransform(name, false, 'position', [0, 0, 0], false);
            setObjTransform(name, false, 'rotation', getObjTransform(this.templateName, true, 'rotation', 'xyz'), false);
            setObjTransform(name, false, 'scale', getObjTransform(this.templateName, true, 'scale', 'xyz'), false);
        }
    }

    /**
     * Base of StructureSection and SideOpening: one handle + the object pools hanging off it.
     * A subclass's enable(spec) calls beginBuild(), places its objects through pool(...).next(), then
     * endBuild(). hide() hides the whole instance through its handle (leftovers when the contract shrinks).
     */
    class SceneComponent {
        constructor(handleBaseName) {
            this.handle = createEmpty(handleBaseName);
            this.pools = new Map();
        }

        // `key` lets one template feed several independent pools (e.g. the same mesh in two roles).
        pool(templateName, key = templateName) {
            let pool = this.pools.get(key);
            if (!pool) {
                pool = new ObjectPool(templateName, this.handle);
                this.pools.set(key, pool);
            }
            return pool;
        }

        beginBuild() {
            changeVis(this.handle, true);
            this.pools.forEach(pool => pool.reset());
        }

        endBuild() {
            this.pools.forEach(pool => pool.hideUnused());
        }

        // Position in mm (contract units), rotation in degrees around Z.
        placeHandle(xMm, yMm, zMm, rotationZ) {
            setObjTransform(this.handle, false, 'position', [mm(xMm), mm(yMm), mm(zMm)], false);
            setObjTransform(this.handle, false, 'rotation', [0, 0, rotationZ], false);
        }

        hide() {
            changeVis(this.handle, false);
        }
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


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 5 · RENDERING OUTPUT + CONFIGURATOR HANDLERS
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
            case 'RELOAD_3D':           // camera framing [M9]
            case 'SHOW_MEASUREMENTS':   // measurement module [M9]
            case 'SHOW_ENVIRONMENT':    // environment from its own GLB [M10]
            case 'SHOW_ANIMATION':
                break;
        }
    }

    // Step changes: camera framing per opening replaces the hard-coded step ids. [M9]
    function handleEvents(data) {
    }

    // Field focus: measurement highlighting + camera framing. [M9]
    function handleFocus(data) {
    }

    function handleValue(data) {
    }


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 6 · ORCHESTRATION
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
            // structureSectionCache[index] ??= new StructureSection();     [M5]
            // structureSectionCache[index].enable(spec, index);
        });
        sceneParameters.sideOpenings.forEach((spec, index) => {
            // sideOpeningCache[index] ??= new SideOpening();               [M6]
            // sideOpeningCache[index].enable(spec, index);
        });
        hideLeftovers(structureSectionCache, sceneParameters.structureSections.length);
        hideLeftovers(sideOpeningCache, sceneParameters.sideOpenings.length);
    }

    // Hide every object of the GLB; each instance shows only the objects it uses. Handles are re-shown by
    // their instance's beginBuild().
    function clearScene() {
        const objList = getAllObjectNames();
        for (let i = 0; i < objList.length; i++)
            if (objList[i] != "Scene")
                changeVis(objList[i], false);
    }


    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    // 7 · ENTRY — PL.init runs on load and again on every configurator change
    //══════════════════════════════════════════════════════════════════════════════════════════════════════
    PL.init = function (app, scope, snapshot) {
        // A new app (scene reloaded) invalidates every cached clone and handle: start from scratch.
        if (app !== appInstance) {
            appInstance = app;
            _pGlob.objCache.clear();
            structureSectionCache.length = 0;
            sideOpeningCache.length = 0;
            renderGate.enabled = true;
            installRenderGate();
        }

        this.procedures["handleButtons"] = handleButtons;
        this.procedures["handleEvents"] = handleEvents;
        this.procedures["handleFocus"] = handleFocus;
        this.procedures["handleValue"] = handleValue;

        // Inspection handle for the browser console and the Node smoke tests, e.g.
        // v3d.PL.debug.sceneParameters(). Nothing in the configurator relies on it.
        PL.debug = {
            sceneParameters: () => sceneParameters,
            structureSectionCache: structureSectionCache,
            sideOpeningCache: sideOpeningCache,
            SceneComponent: SceneComponent,
            hideLeftovers: hideLeftovers,
            renderFrame: renderFrame,
            getObjectByName: getObjectByName,
            setObjTransform: setObjTransform,
            getObjTransform: getObjTransform,
        };

        setCameraOptions();
        enableScene(scope);
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


//#region 8 · INGESTION
//══════════════════════════════════════════════════════════════════════════════════════════════════════════
// 8 · INGESTION — the only place scope[] is read
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
    return { scope: Object.assign({}, base, DEV_SCOPES[devScopeName]), devScope: devScopeName };
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

export { createPL, parseSceneParameters, resolveScope, mm, sideHandleRotationZ, sideLocalToWorld, DEV_SCOPES };
