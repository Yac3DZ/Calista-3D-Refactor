//Skylux Calista — refactor
// Flow: scope → getParameters() → sceneParameters → StructureSection (roof) + SideOpening (one per side).
// The configurator calls PL.init again on every change; caches that must survive live outside PL.init.

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

    PL.init = function (appInstance, scope, snapshot) {
        this.procedures["handleButtons"] = handleButtons;
        this.procedures["handleEvents"] = handleEvents;
        this.procedures["handleFocus"] = handleFocus;
        this.procedures["handleValue"] = handleValue;

        // For the Node tests and the browser console (v3d.PL.debug); nothing in the configurator uses it.
        PL.debug = { getCachedClone, hideCachedClones, getObjectByName, getObjTransform };

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
        //#endregion

        //#region Clones
        // The clone at cache[index], made the first time it is needed: a clone of templateName, parented to
        // parentName (an anchor), at the anchor's origin with the template's own rotation and scale. Shown.
        // warning (optional): passed to cloneObject.
        function getCachedClone(cache, index, templateName, parentName, warning) {
            if (!getObjectByName(cache[index])) {
                const name = cloneObject(templateName, warning);
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

        // Hide the clones of a cache from index `from` on (left over from a bigger configuration).
        function hideCachedClones(cache, from) {
            for (let i = from; i < cache.length; i++)
                changeVis(cache[i], false);
        }
        //#endregion

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
            }
        }

        function handleEvents(data) {
        }

        function handleFocus(data) {
        }

        function handleValue(data) {
        }
        //#endregion

        //#region Snapshot + screenshot
        // The configurator waits for this image after every change.
        function takeSnapshot() {
            registerSetTimeout(0.25, function () {
                snapshot(appInstance.renderer.domElement.toDataURL("image/png"), 0);
            });
        }

        function generateScreenshot() {
            const link = document.createElement('a');
            link.href = appInstance.renderer.domElement.toDataURL('image/png');
            link.download = (scope['_3d_screenshotName'] || 'Your_Skylux_Configuration') + '.png';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => document.body.removeChild(link), 100);
        }
        //#endregion

        //#region Scene
        function enableScene() {
            clearScene();
            changeVis("Gizmo", true);   // marks the scene origin
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

export { createPL, mm };
