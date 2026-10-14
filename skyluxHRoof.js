//Skylux Calista — refactor
// Flow: scope → getParameters() → sceneParameters → StructureSection (roof) + SideOpening (one per side).
// The configurator calls PL.init again on every change; caches that must survive live outside PL.init.

// Dev: while the live configurator doesn't send _3d_StructureSections / _3d_SideOpenings yet, use one of the
// bundled example scopes (DEV_SCOPES, bottom of the file). null to switch off.
const DEV_SCOPE = 'freestanding'; // null | 'freestanding' | 'wallRear' | 'wallRearRight'

// Convert from mm to m
function mm(value) {
    return value / 1000;
}

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

    // Kept between PL.init calls (every configurator change).
    let sceneIsInitialized = false;
    let sceneParameters = {};
    const structureSectionCache = [];   // one StructureSection per _3d_StructureSections[] entry, reused

    PL.init = function (appInstance, scope, snapshot) {
        this.procedures["handleButtons"] = handleButtons;
        this.procedures["handleEvents"] = handleEvents;
        this.procedures["handleFocus"] = handleFocus;
        this.procedures["handleValue"] = handleValue;

        // For the Node tests and the browser console (v3d.PL.debug); nothing in the configurator uses it.
        PL.debug = { getCachedClone, hideCachedClones, getObjectByName, getObjTransform, sceneParameters: () => sceneParameters, structureSectionCache };

        //#region Verge3D 4.13 helpers
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

        function getSceneCoordSystem() {
            const scene = appInstance.scene;
            if (scene && 'coordSystem' in scene.userData) {
                return scene.userData.coordSystem;
            }
            return 'Y_UP_RIGHT';
        }

        // warning (optional, as in the legacy file): log when the clone number goes over it.
        function generateUniqueName(name, isUniqueCb, warning) {
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

            const number = uniqueName.match(/(\d+)$/);
            if (warning !== undefined && number && Number(number[1]) > warning)
                console.log("Object clone count over warning for " + name + " value:" + warning + "(Current clone amount:" + number[1] + ")");

            return uniqueName;
        }

        function generateUniqueObjectName(name, warning) {
            return generateUniqueName(name, name => !Boolean(getObjectByName(name)), warning);
        }

        // warning (optional): see generateUniqueName
        function cloneObject(objName, warning, cloneMaterials, preserveGroups) {
            if (!objName)
                return;
            const obj = getObjectByName(objName);
            if (!obj)
                return;

            const objNew = obj.clone(); // recursive
            objNew.name = generateUniqueObjectName(obj.name, warning);

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
        //#endregion

        //#region Clones -----------------------------------------------------
        // The clone at cache[index], made the first time it is needed: a clone of templateName, parented to
        // parentName (an anchor), at the anchor's origin with the template's own rotation and scale. Shown.
        // warning, cloneMaterials (optional): passed to cloneObject. cloneMaterials gives the clone its own material
        // copy, e.g. so each LED can have its own colour.
        function getCachedClone(cache, index, templateName, parentName, warning, cloneMaterials) {
            if (!getObjectByName(cache[index])) {
                const name = cloneObject(templateName, warning, cloneMaterials);
                if (!name) {
                    console.warn('[Calista 3D] template object "' + templateName + '" is not in the scene');
                    return null;
                }
                makeParent(name, parentName);
                // The clone's children keep the template's names, so they would exist twice: prefix them.
                getObjectByName(name).traverse(child => {
                    if (child.name !== name && isObjectWorthProcessing(child)) {
                        child.name = name + ' > ' + child.name;
                        _pGlob.objCache.set(child.name, child);
                    }
                });
                // makeParent keeps the world transform; reset it to the anchor's origin instead. The template's
                // rotation is read in LOCAL space: read in world space, templates turned around two axes come
                // out 120° off (e.g. "Led strip.0").
                setObjTransform(name, false, 'position', [0, 0, 0], false);
                setObjTransform(name, false, 'rotation', getObjTransform(templateName, false, 'rotation', 'xyz'), false);
                setObjTransform(name, false, 'scale', getObjTransform(templateName, true, 'scale', 'xyz'), false);
                cache[index] = name;
            }
            changeVis(cache[index], true);
            return cache[index];
        }

        // Colour of ONE LED clone (made with cloneMaterials) through the "LED color" RGB input of its material.
        function setLedColor(objName, color) {
            const obj = getObjectByName(objName);
            if (!obj || !color)
                return;
            const rgb = new v3d.Color(color);
            obj.resolveMultiMaterial().forEach(objR => {
                const mat = objR.material;
                if (mat && mat.isMeshNodeMaterial && 'LED color' in mat.nodeRGBMap) {
                    const input = mat.nodeRGB[mat.nodeRGBMap['LED color']];
                    input.x = rgb.r;
                    input.y = rgb.g;
                    input.z = rgb.b;
                }
            });
        }

        // A value input of ONE clone's own material (made with cloneMaterials), e.g. the glass "Tint".
        function setObjectMaterialValue(objName, valueName, value) {
            const obj = getObjectByName(objName);
            if (!obj)
                return;
            obj.resolveMultiMaterial().forEach(objR => {
                const mat = objR.material;
                if (mat && mat.isMeshNodeMaterial && valueName in mat.nodeValueMap)
                    mat.nodeValue[mat.nodeValueMap[valueName]] = value;
            });
        }

        // Hide the clones of a cache from index `from` on (left over from a bigger configuration).
        function hideCachedClones(cache, from) {
            for (let i = from; i < cache.length; i++)
                changeVis(cache[i], false);
        }
        //#endregion ---------------------------------------------------------------

        //#region Parameters ---------------------
        // The only place scope[] is read. Everything the 3D builds comes from sceneParameters.
        // Lists and objects may arrive as real values or as JSON strings; anything missing or broken falls
        // back to a default, so a bad value never stops the build.
        function getParameters() {
            // Dev: the live configurator doesn't send the new contract yet → use a bundled example.
            if (DEV_SCOPE && scope['_3d_StructureSections'] === undefined && scope['_3d_SideOpenings'] === undefined) {
                console.warn('[Calista 3D] no _3d_StructureSections / _3d_SideOpenings in the scope, using DEV scope "' + DEV_SCOPE + '"');
                scope = Object.assign({}, scope, DEV_SCOPES[DEV_SCOPE]);
            }
            sceneParameters = {
                screenshotName: scope['_3d_screenshotName'] || 'Your_Skylux_Configuration',
                isFreeStanding: scope['_3d_conservatoryStructure'] === 'freeStanding',
                widthTotal: num(scope['_3d_widthTotal'], 3000),
                depthTotal: num(scope['_3d_depthTotal'], 3000),
                walls: Object.assign({ front: false, right: false, rear: false, left: false }, toObject(scope['_3d_walls'])),
                colorOutside: scope['_3d_colorOutside'] || '#293133',
                perspective: scope['_perspective'] || 'main',    // camera view for the snapshot / SSR
            };
            // after the general values: sections and sides fall back on them
            sceneParameters.structureSections = toArray(scope['_3d_StructureSections']).map(getSectionParameters);
            sceneParameters.sideOpenings = toArray(scope['_3d_SideOpenings']).map(getSideOpeningParameters);
            console.info('[Calista 3D] sceneParameters', sceneParameters);
        }
        function getSectionParameters(section) {
            const roofOptions = toObject(section.roofOptions);
            const depth = num(section.depth, sceneParameters.depthTotal);
            return {
                width: num(section.width, sceneParameters.widthTotal),
                depth: depth,
                xPos: num(section.xPos, 0),
                yPos: num(section.yPos, depth / 2),     // centre of the footprint, back edge at Y = 0
                heightUnderGutter: num(section.heightUnderGutter, 2500),
                horizontalScreen: toObject(roofOptions.horizontalScreen, null),
                roofFillings: toArray(roofOptions.roofFillings),
                rafters: toArray(roofOptions.rafters),
            };
        }
        function getSideOpeningParameters(sideOpening) {
            const sideSpecs = toObject(sideOpening.sideSpecs);
            const rotation = num(sideSpecs.rotation, 0);
            const side = { 0: 'left', 90: 'rear', 180: 'right', 270: 'front' }[rotation] || null;
            return {
                side: side,                                         // name from the rotation (walls, camera)
                isWall: side ? sceneParameters.walls[side] : false, // a house wall stands on this side
                xPos: num(sideSpecs.xPos, 0),                       // start point of the side
                yPos: num(sideSpecs.yPos, 0),
                rotation: rotation,                                 // front 270 · rear 90 · left 0 · right 180
                length: num(sideSpecs.length, 0),
                height: num(sideSpecs.height, 2500),
                poles: toArray(sideOpening.poles),
                bays: toArray(sideOpening.bays),
            };
        }
        // A list, also from a JSON string; anything else gives []. Entries that aren't objects are dropped.
        function toArray(value) {
            if (typeof value === 'string')
                try { value = JSON.parse(value); } catch (e) { return []; }
            return Array.isArray(value) ? value.filter(item => item && typeof item === 'object') : [];
        }
        // An object, also from a JSON string; anything else gives `fallback` ({} unless given).
        function toObject(value, fallback = {}) {
            if (typeof value === 'string')
                try { value = JSON.parse(value); } catch (e) { return fallback; }
            return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
        }
        // A number, also from a numeric string; anything else gives `fallback`.
        function num(value, fallback) {
            const number = Number(value);
            return value !== null && value !== '' && Number.isFinite(number) ? number : fallback;
        }
        //#endregion-------------

        //#region Configurator handlers
        function setCameraOptions() {
            appInstance.controls.panInertia = 0.1;
            appInstance.controls.rotateInertia = 0.1;

            appInstance.controls.minPolarAngle = 0;
            appInstance.controls.maxPolarAngle = 5;
        }

        function handleButtons(data) {
            switch (data.type) {
                case 'FULL_SCREEN':
                    appInstance._resizeCb();
                    break;
                case 'DOWNLOAD_IMAGE':
                    generateScreenshot();
                    break;
                case 'RELOAD_3D':
                    cameraPosition();
                    break;
            }
        }

        function handleEvents(data) {
        }

        function handleFocus(data) {
        }

        function handleValue(data) {
        }
        //#endregion

        //#region Camera ---------------------------------------------------------------------
        // Frame the structure: ScaleCube (a 1 m cube in the GLB, origin at its bottom) is wrapped around it,
        // Camerapos / Cameratarget give the viewing direction, fitCameraToObjects zooms until it fits.
        // The direction depends on the perspective the configurator asks for (_perspective, e.g. for the SSR).
        function cameraPosition(onFinish) {
            const section = sceneParameters.structureSections[0];
            const width = mm(sceneParameters.widthTotal);
            const depth = mm(sceneParameters.depthTotal);
            const totalHeight = section ? mm(section.heightUnderGutter) + 0.26 : 2.76;   // + crown beam height
            const size = (width + depth + totalHeight) / 10;
            let camPosX, camPosY, camPosZ;

            if (sceneParameters.perspective == "perspective") {
                camPosX = width + size + 5;
                camPosY = width + size + 8;
                camPosZ = totalHeight + size + 2;
            } else if (sceneParameters.perspective == "side") {
                camPosX = -(width + 8);
                camPosY = depth / 2;
                camPosZ = totalHeight / 2;
            } else if (sceneParameters.perspective == "front") {
                camPosX = 0;
                camPosY = depth + 8;
                camPosZ = totalHeight / 2;
            } else if (sceneParameters.perspective == "top") {
                camPosX = 0;
                camPosY = depth / 2;
                camPosZ = totalHeight + 16;
            } else { // default + "main"
                camPosX = width + size + 2;
                camPosY = width + size + 8;
                camPosZ = totalHeight + size + 2;
            }

            setObjTransform("Camerapos", false, "position", [camPosX, camPosY, camPosZ], false);
            setObjTransform("Cameratarget", false, "position", [0, depth / 2, totalHeight / 2], false);
            setObjTransform("ScaleCube", false, "position", [0, depth / 2, 0], false);
            setObjTransform("ScaleCube", false, "scale", [width, depth, totalHeight], false);

            // onFinish must always run: the snapshot waits for it.
            if (!getObjectByName("ScaleCube")) {
                console.warn('[Calista 3D] "ScaleCube" is not in the scene, the camera is not framed');
                if (onFinish) onFinish();
                return;
            }
            // fitCameraToObjects skips while the camera is still moving: frame again once that tween is over.
            if (appInstance.controls && appInstance.controls.inTween) {
                registerSetTimeout(1, function () { cameraPosition(onFinish); });
                return;
            }

            const animTime = (sceneIsInitialized) ? 1 : 0;
            fitCameraToObjects("ScaleCube", { cameraPos: "Camerapos", cameraTarget: "Cameratarget" }, { duration: animTime, onDone: function () { if (onFinish) onFinish(); } });
        }

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
        //#endregion ---------------------------------------------------------------

        //#region Snapshot + screenshot
        // The configurator waits for this image after every change: frame the structure, then grab the frame
        // 250 ms after the camera settles.
        function takeSnapshot() {
            cameraPosition(function () {
                registerSetTimeout(0.25, function () {
                    snapshot(appInstance.renderer.domElement.toDataURL("image/png"), 0);
                });
            });
        }

        function generateScreenshot() {
            const link = document.createElement('a');
            link.href = appInstance.renderer.domElement.toDataURL('image/png');
            link.download = sceneParameters.screenshotName + '.png';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => document.body.removeChild(link), 100);
        }
        //#endregion

        //#region StructureSection ---------------------------------------------------------------
        // One per _3d_StructureSections[] entry: the crown (gutter beams) and the roof.
        // Its anchor (a clone of empty.0) sits at the section centre; everything it builds is parented to it,
        // so positions below are local: x across the width, y across the depth, from the section centre.
        class StructureSection {
            constructor() {
                this.anchor = cloneObject("empty.0");
                if (!this.anchor)
                    console.warn('[Calista 3D] "empty.0" is not in the scene, the section cannot be placed');
                this.crownBeamCache = [];   // [front, rear, left, right]
                this.rafterCache = [];      // per rafter: the rafter itself…
                this.ledStripCache = [];    // …and one of these three profiles under it
                this.ledSpotProfileCache = [];
                this.noLedStripCache = [];
                this.ledSpotCache = [];     // all LED spots of the section, rafter after rafter
                this.glassCache = [];       // per roof filling, one of these four
                this.plasticCache = [];
                this.sandwichWhiteCache = [];
                this.sandwichAnthraciteCache = [];
            }

            enable(section) {
                this.width = mm(section.width);
                this.depth = mm(section.depth);
                this.totalHeight = mm(section.heightUnderGutter) + 0.26;   // + crown beam height: top of the crown

                this.xPos = mm(section.xPos);
                this.yPos = mm(section.yPos);

                setObjTransform(this.anchor, false, "position", [this.xPos, this.yPos, 0], false);
                this.enableCrown();
                this.enableRafters(section.rafters);
                this.enableRoofFillings(section.roofFillings);
            }

            // One rafter per entry, spanning the depth between the front and rear beams. Under it one profile
            // shows its lighting: a LED strip, a spot profile with its spots, or none (a strip wins over spots).
            // A rafter's position is measured from the section's left edge (+X), so x = width / 2 - position.
            enableRafters(rafters) {
                const depthMorph = ((this.depth - 2 * 0.15) - 1) / 100;
                this.ledStripCount = 0;     // for the roof light
                this.ledSpotCount = 0;

                for (let i = 0; i < rafters.length; i++) {
                    const x = this.width / 2 - mm(num(rafters[i].position, 0));
                    const profile = rafters[i].ledStrip ? "ledStrip" : (rafters[i].ledSpot ? "ledSpot" : "none");
                    const profiles = [
                        { type: "ledStrip", cache: this.ledStripCache, template: "Led strip.0", cloneMaterials: true },
                        { type: "ledSpot", cache: this.ledSpotProfileCache, template: "Led spot profile.0" },
                        { type: "none", cache: this.noLedStripCache, template: "No Led strip.0" },
                    ];

                    const rafter = getCachedClone(this.rafterCache, i, "Rafter 190x140 base.0", this.anchor);
                    setObjTransform(rafter, false, "position", [x, 0, this.totalHeight], false);
                    setMorphFactor(rafter, 'Width', depthMorph);

                    for (const p of profiles) {
                        if (p.type != profile) {
                            changeVis(p.cache[i], false);   // this rafter may have had another profile before
                            continue;
                        }
                        const name = getCachedClone(p.cache, i, p.template, this.anchor, undefined, p.cloneMaterials);
                        setObjTransform(name, false, "position", [x, 0, this.totalHeight], false);
                        setMorphFactor(name, 'Width', depthMorph);
                    }

                    if (profile == "ledStrip") {
                        setLedColor(this.ledStripCache[i], rafters[i].ledStrip);
                        this.ledStripCount++;
                    }

                    // LED spots: positions measured from the rear edge (y = -depth / 2)
                    if (profile == "ledSpot") {
                        const positions = Array.isArray(rafters[i].ledSpot.positions) ? rafters[i].ledSpot.positions : [];
                        for (const position of positions) {
                            const spot = getCachedClone(this.ledSpotCache, this.ledSpotCount, "Horizontal_Ledspot.0", this.anchor, undefined, true);
                            setObjTransform(spot, false, "position", [x, -this.depth / 2 + mm(num(position, 0)), this.totalHeight], false);
                            setLedColor(spot, rafters[i].ledSpot.color);
                            this.ledSpotCount++;
                        }
                    }
                }

                hideCachedClones(this.rafterCache, rafters.length);
                hideCachedClones(this.ledStripCache, rafters.length);
                hideCachedClones(this.ledSpotProfileCache, rafters.length);
                hideCachedClones(this.noLedStripCache, rafters.length);
                hideCachedClones(this.ledSpotCache, this.ledSpotCount);
            }

            // One panel per roof filling, between the rafters. A filling's position is its centre, measured from the
            // section's left edge like the rafters. Glass panels get their own material copy, so clear and opal
            // panels can sit side by side. sandwichPanelTile has no mesh yet and uses the anthracite panel.
            enableRoofFillings(fillings) {
                const depthMorph = ((this.depth - 2 * 0.15) - 1) / 100;
                const meshes = [
                    { types: ["glassClear", "glassOpal"], cache: this.glassCache, template: "Horizontal_Roof_Glass_Front.0", cloneMaterials: true },
                    { types: ["plastic", "plasticOpal", "plasticSunBlocking"], cache: this.plasticCache, template: "Horizontal_Roof_Plastic_Front.0" },
                    { types: ["sandwichPanelWhite"], cache: this.sandwichWhiteCache, template: "Horizontal_Roof_Sandwich_Panel_White_Front.0" },
                    { types: ["sandwichPanelAnthracite", "sandwichPanelTile"], cache: this.sandwichAnthraciteCache, template: "Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0" },
                ];

                for (let i = 0; i < fillings.length; i++) {
                    const x = this.width / 2 - mm(num(fillings[i].position, 0));
                    const widthMorph = (mm(num(fillings[i].width, 1000)) - 1) / 100;

                    for (const m of meshes) {
                        if (!m.types.includes(fillings[i].type)) {
                            changeVis(m.cache[i], false);   // this filling may have had another type before
                            continue;
                        }
                        const panel = getCachedClone(m.cache, i, m.template, this.anchor, undefined, m.cloneMaterials);
                        setObjTransform(panel, false, "position", [x, 0, this.totalHeight], false);
                        setMorphFactor(panel, 'Depth', depthMorph);
                        setMorphFactor(panel, 'Width', widthMorph);
                    }

                    // glass look: clear or opal
                    if (fillings[i].type == "glassClear") {
                        setObjectMaterialValue(this.glassCache[i], 'NoGlass', 0);
                        setObjectMaterialValue(this.glassCache[i], 'Tint', 0);
                    } else if (fillings[i].type == "glassOpal") {
                        setObjectMaterialValue(this.glassCache[i], 'NoGlass', 0);
                        setObjectMaterialValue(this.glassCache[i], 'Tint', 0.6);
                    }
                }

                for (const m of meshes)
                    hideCachedClones(m.cache, fillings.length);
            }

            // The four gutter beams on top of the poles. They span between the corner poles (0.15 m each).
            enableCrown() {
                const beams = [
                    { template: "Horizontal_Gutter_Front", position: [0, this.depth / 2, this.totalHeight], length: this.width },
                    { template: "Horizontal_Gutter_Rear", position: [0, -this.depth / 2, this.totalHeight], length: this.width },
                    { template: "Horizontal_Gutter_Left", position: [this.width / 2, 0, this.totalHeight], length: this.depth },
                    { template: "Horizontal_Gutter_Right", position: [-this.width / 2, 0, this.totalHeight], length: this.depth },
                ];
                // Accessories hanging under each beam; the bays decide which ones show later, for now the plugs do.
                const accessories = ["LED strip integrated", "LED strip integrated plug", "Rail plug", "Integrated wall", "Vertical sunblind"];
                const shownAccessories = ["LED strip integrated plug", "Rail plug"];

                for (let i = 0; i < beams.length; i++) {
                    const beam = getCachedClone(this.crownBeamCache, i, beams[i].template, this.anchor);
                    if (!beam)
                        continue;
                    const widthMorph = ((beams[i].length - 2 * 0.15) - 1) / 100;
                    setObjTransform(beam, false, "position", beams[i].position, false);
                    setMorphFactor(beam, 'Width', widthMorph);

                    for (const accessory of accessories) {
                        const child = beam + ' > ' + beams[i].template + '_' + accessory;
                        setMorphFactor(child, 'Width', widthMorph);
                        changeVis(child, shownAccessories.includes(accessory));
                    }
                }
            }
        }
        //#endregion ---------------------------------------------------------------

        //#region Scene
        function enableScene() {
            clearScene();
            changeVis("Gizmo", true);        // marks the scene origin
            changeVis("Sun_modern", true);   // clearScene hides the lights too

            const sections = sceneParameters.structureSections;
            for (let i = 0; i < sections.length; i++) {
                if (!structureSectionCache[i])
                    structureSectionCache[i] = new StructureSection();
                structureSectionCache[i].enable(sections[i]);
            }
            enableLighting();
        }

        // LEDs in the roof turn on the Spot light under it and dim the sun (as legacy changeWorldLightForLED).
        function enableLighting() {
            const section = sceneParameters.structureSections.length ? structureSectionCache[0] : null;
            const strips = section ? section.ledStripCount : 0;
            const spots = section ? section.ledSpotCount : 0;
            const anyLed = strips + spots > 0;

            if (section)
                setObjTransform("Spot", false, "position", [section.xPos, section.yPos, section.totalHeight - 0.2], false);
            lightIntensity("Spot", anyLed ? 6 + strips * 2.5 + spots * 0.5 : 0);
            changeVis("Spot", anyLed);
            lightIntensity("Sun_modern", anyLed ? 0 : 4);
        }
        function lightIntensity(lightName, intensity) {
            var areaLight = getObjectByName(lightName);
            if (!areaLight) {
                console.warn('light intensity: object not found:=>', lightName);
                return;
            }
            areaLight.intensity = intensity;
        }

        // Hide every object. The scene root is skipped by identity: in the GLB it is called "glid", not "Scene".
        // (In Verge3D a hidden parent does NOT hide its children, so every object is hidden one by one.)
        function clearScene() {
            const objList = getAllObjectNames();
            for (let i = 0; i < objList.length; i++)
                if (getObjectByName(objList[i]) !== appInstance.scene)
                    changeVis(objList[i], false);
        }
        //#endregion

        //#region Entry
        setCameraOptions();
        getParameters();
        enableScene();
        takeSnapshot();

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
        //#endregion
    }
}

//#region DEV_SCOPES
// Bundled example scopes for DEV_SCOPE, copied from examples_source_files/input_example_*_h_roof.js
// (the tests check they still match). Remove together with DEV_SCOPE once the configurator sends the contract.
const DEV_SCOPES = {
    freestanding: {
        "_3d_screenshotName": "Calista_freestanding",
        "_3d_conservatoryStructure": "freeStanding",
        "_3d_widthTotal": 6000,
        "_3d_depthTotal": 4000,
        "_3d_walls": { "front": false, "right": false, "rear": false, "left": false },
        "_3d_colorOutside": "#293133",
        "_3d_StructureSections": [
            {
                "width": 6000,
                "depth": 4000,
                "xPos": 0,
                "yPos": 2000,
                "heightUnderGutter": 2500,
                "sectionName": "Section_1",
                "adjacentSections": { "left": null, "right": null },
                "roofOptions": {
                    "horizontalScreen": { "type": "zipper", "screenColor": ["#D9D4C7", "#D9D4C7", "#D9D4C7"], "motorSide": "right" },
                    "roofFillings": [
                        { "position": 500, "width": 1000, "type": "glassClear" },
                        { "position": 1500, "width": 1000, "type": "glassClear" },
                        { "position": 2500, "width": 1000, "type": "glassOpal" },
                        { "position": 3500, "width": 1000, "type": "glassOpal" },
                        { "position": 4500, "width": 1000, "type": "glassClear" },
                        { "position": 5500, "width": 1000, "type": "glassClear" }
                    ],
                    "rafters": [
                        {
                            "position": 1000,
                            "ledSpot": { "positions": [1000, 2000, 3000], "color": "#FFD1A3" },
                            "ledStrip": null
                        },
                        { "position": 2000, "ledSpot": null, "ledStrip": null },
                        { "position": 3000, "ledSpot": null, "ledStrip": "#c0159b" },
                        { "position": 4000, "ledSpot": null, "ledStrip": null },
                        {
                            "position": 5000,
                            "ledSpot": { "positions": [1000, 2000, 3000], "color": "#FFD1A3" },
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
                        "generalSpecs": { "position": 1550, "length": 2800, "height": 2500 },
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
                            "screenColor": ["#7A7A7A", "#7A7A7A", "#7A7A7A"],
                            "solar": false,
                            "window": null
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    },
                    {
                        "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 },
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
                            "screenColor": ["#7A7A7A", "#7A7A7A", "#7A7A7A"],
                            "solar": false,
                            "window": null
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
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
                        "generalSpecs": { "position": 1550, "length": 2800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                { "position": 850, "width": 1400, "height": 2500, "fillType": "glassClear" },
                                { "position": 2250, "width": 1400, "height": 2500, "fillType": "glassClear" }
                            ]
                        },
                        "ledStrip": null
                    },
                    {
                        "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [{ "position": 4450, "width": 2800, "height": 2500, "fillType": "glassOpal" }]
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
                        "generalSpecs": { "position": 1050, "length": 1800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#4D504D", "#4D504D", "#4D504D"],
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
                        "generalSpecs": { "position": 2950, "length": 1800, "height": 2500 },
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "builtIn",
                            "type": "axiom130",
                            "screenColor": ["#4D504D", "#4D504D", "#4D504D"],
                            "solar": true,
                            "window": { "type": "fullWidth", "position": 2950, "width": 1800, "height": 600, "groundHeight": 1000 }
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
                        "generalSpecs": { "position": 2000, "length": 3700, "height": 2500 },
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
        "_3d_walls": { "front": false, "right": false, "rear": true, "left": false },
        "_3d_colorOutside": "#F1F0EA",
        "_3d_StructureSections": [
            {
                "width": 5000,
                "depth": 3500,
                "xPos": 0,
                "yPos": 1750,
                "heightUnderGutter": 2400,
                "sectionName": "Section_1",
                "adjacentSections": { "left": null, "right": null },
                "roofOptions": {
                    "horizontalScreen": { "type": "bottomZipper", "screenColor": ["#8C8C8C", "#8C8C8C", "#5A5A5A"], "motorSide": "left" },
                    "roofFillings": [
                        { "position": 500, "width": 1000, "type": "plastic" },
                        { "position": 1500, "width": 1000, "type": "plasticOpal" },
                        { "position": 2500, "width": 1000, "type": "plasticSunBlocking" },
                        { "position": 3500, "width": 1000, "type": "plasticOpal" },
                        { "position": 4500, "width": 1000, "type": "plastic" }
                    ],
                    "rafters": [
                        {
                            "position": 1000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        },
                        {
                            "position": 2000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        },
                        {
                            "position": 3000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
                            "ledStrip": null
                        },
                        {
                            "position": 4000,
                            "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" },
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
                        "generalSpecs": { "position": 1300, "length": 2300, "height": 2400 },
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
                            "screenColor": ["#3C3C3C", "#3C3C3C", "#3C3C3C"],
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
                        "generalSpecs": { "position": 3700, "length": 2300, "height": 2400 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "surface",
                            "partitions": [
                                { "position": 3125, "width": 1150, "height": 2400, "fillType": "woodOutside" },
                                { "position": 4275, "width": 1150, "height": 2400, "fillType": "sandwichPanelWhite" }
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
                        "generalSpecs": { "position": 1750, "length": 3200, "height": 2400 },
                        "climaglide": null,
                        "verticalSunblind": null,
                        "fixedWall": {
                            "mounting": "builtIn",
                            "partitions": [
                                { "position": 925, "width": 1550, "height": 2400, "fillType": "glassClear" },
                                { "position": 2525, "width": 1650, "height": 2400, "fillType": "woodInside" }
                            ]
                        },
                        "ledStrip": { "mounting": "builtIn", "color": "#FFFFFF" }
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
                        "generalSpecs": { "position": 1750, "length": 3200, "height": 2400 },
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
                            "screenColor": ["#8C8C8C", "#8C8C8C", "#5A5A5A"],
                            "solar": false,
                            "window": { "type": "fullWidth", "position": 1750, "width": 3200, "height": 800, "groundHeight": 1200 }
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFFFFF" }
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
        "_3d_walls": { "front": false, "right": true, "rear": true, "left": false },
        "_3d_colorOutside": "#1E1E1E",
        "_3d_StructureSections": [
            {
                "width": 4500,
                "depth": 3000,
                "xPos": 0,
                "yPos": 1500,
                "heightUnderGutter": 2600,
                "sectionName": "Section_1",
                "adjacentSections": { "left": null, "right": null },
                "roofOptions": {
                    "horizontalScreen": null,
                    "roofFillings": [
                        { "position": 375, "width": 750, "type": "sandwichPanelAnthracite" },
                        { "position": 1125, "width": 750, "type": "sandwichPanelWhite" },
                        { "position": 1875, "width": 750, "type": "sandwichPanelTile" },
                        { "position": 2625, "width": 750, "type": "sandwichPanelTile" },
                        { "position": 3375, "width": 750, "type": "sandwichPanelWhite" },
                        { "position": 4125, "width": 750, "type": "sandwichPanelAnthracite" }
                    ],
                    "rafters": [
                        { "position": 750, "ledSpot": null, "ledStrip": "#FFD1A3" },
                        { "position": 1500, "ledSpot": null, "ledStrip": null },
                        { "position": 2250, "ledSpot": null, "ledStrip": "#FFD1A3" },
                        { "position": 3000, "ledSpot": null, "ledStrip": null },
                        { "position": 3750, "ledSpot": null, "ledStrip": "#FFD1A3" }
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
                        "generalSpecs": { "position": 1175, "length": 2050, "height": 2600 },
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
                                { "position": 1175, "width": 650, "height": 2600, "fillType": "woodBothSides" },
                                { "position": 1850, "width": 700, "height": 2600, "fillType": "none" }
                            ]
                        },
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
                    },
                    {
                        "generalSpecs": { "position": 3325, "length": 2050, "height": 2600 },
                        "climaglide": null,
                        "verticalSunblind": {
                            "mounting": "surface",
                            "type": "axiom130",
                            "screenColor": ["#E5E1D8", "#C9C3B6", "#E5E1D8"],
                            "solar": false,
                            "window": { "type": "fullWidth", "position": 3325, "width": 2050, "height": 700, "groundHeight": 1100 }
                        },
                        "fixedWall": null,
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
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
                        "generalSpecs": { "position": 1500, "length": 2700, "height": 2600 },
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
                            "screenColor": ["#4D504D", "#4D504D", "#4D504D"],
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
                        "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" }
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

export { createPL, mm, DEV_SCOPES };
