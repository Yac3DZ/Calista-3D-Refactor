//Skylux Calista
function createPL(v3d = window.v3d) {
    var LIST_NONE = '<none>';

    var _pGlob = {};

    _pGlob.objCache = {};
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
    var _pPhysics = {};

    _pPhysics.tickCallbacks = [];
    _pPhysics.syncList = [];
    _pPhysics.consList = [];

    _pPhysics.collisionData = [];

    _pPhysics.collisionInfo = {
        objectA: '',
        objectB: '',
        distance: 0,
        positionOnA: [0, 0, 0],
        positionOnB: [0, 0, 0],
        normalOnB: [0, 0, 0]
    };

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

    var conservatoryDepth;
    var conservatoryDepthOld;
    var conservatoryWidth;
    var conservatoryWidthOld;
    var gutterHeight;
    var totalHeight;
    var totalHeightOld;
    var triangleRearHeight;
    var designStyle;
    var climacrownEnabled;
    var colorOutside;
    var glassIncluded;
    var glassIncludedClimaglide;

    var conservatoryWidthMM;
    var conservatoryDepthMM;
    var totalHeightMM;
    let isMotorTextVis = false;

    let environmentLoaded = false;



    var sceneIsInitialized = false;
    var cameraZAngle = 0;
    var cameraZAngleOld = 0;
    var isTweeningColors = [];
    var isTweeningAnimations = [];//0->4 Vertical screens left;5->9 Vertical screens right;10->14 Vertical screens front;15->19 Vertical screens rear; 20->24 Climaglide left;25->29 Climaglide right; 30->34 Climaglide front; 35->39 Climaglide back;
    var isPrevTweening = false;
    var isHovered = false;
    var frameRequested = [false, false];//0->renderFrame;1->dragmove;
    var oldPR = -1;
    var oldPRCounter = 0;
    var isPrevHovered = false;
    var measurementsEnabled = false;
    var measurementsStepEnabled = false;
    var environmentEnabled = false;
    var overlayImageEnabled = false;
    var houseType;
    var additionalWallsSpecs = [];
    var hoverTimer = 0;

    var oldFocusData = -1;
    var selectedRoofRafterIndex = -1;
    var selectedRoofPanelIndex = -1;

    var isFreestanding = true;
    var horizontalRoofDivisionObjectCache = [];//rafter,ledSpotProfile,ledStrip,noLedStrip
    var horizontalScreenTopSideSupportCache = [["Horizontal screen zipper top depth supports.0", "Horizontal screen non zipper top depth supports.0"]];
    var horizontalScreenBottomSideSupportCache = ["Horizontal screen bottom depth supports.0"];
    var roofFillingCache = [];
    var horizontalVerandaPostSupportCache = [["Post bracket.0", "Post foundation.0"]];
    let postSupportType = [-1, -1, -1, -1];
    let horizontalScreenEnabled = []; //[top zipper, top non zipper,bottom]
    let horizontalScreenColors = [];

    var climaglideOpeningDirection = ['left', 'left', 'left', 'left']
    var climaglideSegments = [];

    var singleClickObjList = [];

    let roofSpecs;

    var oldOutsideColor = [-1, -1, -1];
    var oldVerticalScreenOpening = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var oldHorizontalScreenOpening = [0, 0, 0];

    var isWallConfigurator = false;
    var isClimaglideConfigurator = false;
    var isHorizontalScreenConfigurator = false;
    var isVerticalScreenConfigurator = false;
    var isCalistaConfigurator = false;
    let verticalScreenStandalone = false;

    class sideSpecs {
        constructor(side) {
            this.side = side;
            this.optionsL1 = [];
            this.optionsL2 = [];
            this.optionsFL = [];
            this.optionXposSE = [];
            this.optionYposSE = [];
            this.climaglidePanelAmount = [];
            this.glassColor = [];
            this.climaglideOpeningDirection = [];
            this.climaglideBottomRailCache = [];
            this.climaglideTopRailCache = [];
            this.climaglideTopMainRailCache = [];
            this.climaglidePanelCache = [];
            this.climaglideManipulatorCache = [];
            this.climaglideIsOpen = [false, false, false, false, false];
            this.climaglideAnimationSetUp = [false, false, false, false, false];
            this.verticalScreenCache = [];
            this.verticalScreenColors = [];
            this.ledStripCache = [];
            this.wallCache = [];
            this.wallFillingCache = [];
            this.wallFillingMaterial = [];
            this.wallDividers = [];
            this.totalWallDividers = [];
            this.integratedWallBottomProfileCache = [];
            this.integratedWallTopProfileCache = [];
            this.integratedWallVerticalProfileCache = [];
            this.integratedWallWoodEndProfileCache = [];
            this.integratedWallGlassCache = [];
            this.integratedWallSandwichPanelCache = [];
            this.integratedWallDoorwayPostCache = [];
            this.integratedWallWoodCache = [];
            this.integratedWallWoodShortCache = [];
            this.integratedWallWoodFrameCache = [];
            this.wallSpecs = [];
            this.optionSpacing = [];
            this.optionCenterPos = [];
            this.poleAmount = 0;
            this.poleXpos = [];
            this.poleYpos = [];
            //0-9->ClimaluxHorizon;10-19->Climacrown;20-29->ClimaxCold;30-39->ClimaxPanorama;40-49->Climalux;50-59->ClimaluxOverhang;
            this.extraPostCache = [];
        }
        getGlassColor(colors) {
            for (let i = 0; colors[i] !== undefined; i++) {
                this.glassColor[i] = colors[i];
                if (this.glassColor[i] == undefined || this.glassColor[i] == null || this.glassColor[i] == "")
                    this.glassColor[i] = 'glass_Clear';
            }
        }
        isClimaglideEnabled(pos) {
            for (let i = 0; this.optionsL2[i] != undefined; i++)
                if (this.optionsL2[i] == "optionsClimaglide" && (pos == -1 || pos == i))
                    return true;
            return false;
        }
        getClimaglideOpeningDirection(direction) {
            for (let i = 0; direction[i] !== undefined; i++) {
                this.climaglideOpeningDirection[i] = direction[i];
                if (this.climaglideOpeningDirection[i] != 'middle' && this.climaglideOpeningDirection[i] != 'left' && this.climaglideOpeningDirection[i] != 'right')
                    this.climaglideOpeningDirection[i] = 'left';
            }
        }
        getClimaglidePanelAmount(amount) {
            for (let i = 0; amount[i] !== undefined; i++) {
                this.climaglidePanelAmount[i] = parseInt(amount[i], 10);
                if (isNaN(this.climaglidePanelAmount[i]))
                    this.climaglidePanelAmount[i] = 4;
                if (this.climaglideOpeningDirection[i] == 'middle' && this.climaglidePanelAmount[i] % 2 != 0)
                    this.climaglideOpeningDirection[i] = 'left'
            }
        }
        isIntegratedLEDStripEnabled() {
            return this.optionsL3[0];
        }
        getVerticalScreenColors(color1, color2, color3) {
            for (let i = 0; color1[i] !== undefined; i++)
                this.verticalScreenColors[i] = [color1[i], color2[i], color3[i]];
        }
        isVerticalScreenEnabled(pos) {
            for (let i = 0; this.optionsL1[i] != undefined; i++)
                if (this.optionsL1[i] == "optionsScreens" && (pos == -1 || pos == i))
                    return true;
            return false;
        }
        isIntegratedVerticalScreenEnabled() {
            if (this.optionsL1[0] == "optionsScreens")
                return true;
            return false;
        }
        isPartitionWallEnabled(pos) {
            for (let i = 0; this.optionsL1[i] != undefined; i++)
                if (this.optionsL1[i] == "optionsWallPartitions" && (pos == -1 || pos == i))
                    return 1;
            for (let i = 0; this.optionsL2[i] != undefined; i++)
                if (this.optionsL2[i] == "optionsWallPartitions" && (pos == -1 || pos == i))
                    return 2;
            return 0;
        }
        calculateOptionXposSE() {
            for (let i = 0; this.optionSpacing[i] !== undefined; i++)
                this.optionXposSE[i] = [this.optionCenterPos[i] + this.optionSpacing[i] / 2, this.optionCenterPos[i] - this.optionSpacing[i] / 2];
        }
        calculateOptionYposSE() {
            for (let i = 0; this.optionSpacing[i] !== undefined; i++)
                this.optionYposSE[i] = [this.optionCenterPos[i] - this.optionSpacing[i] / 2, this.optionCenterPos[i] + this.optionSpacing[i] / 2];
        }
        calculateOptionCenterPos(poleSizeX, poleSizeY, poleInWay) {
            if (this.side == 'Left' || this.side == "Right") {
                for (let i = 0; this.poleAmount >= i; i++) {
                    if (this.poleAmount == 0) {
                        this.optionCenterPos[i] = (conservatoryDepth) / 2;
                        if (!poleInWay)
                            this.optionCenterPos[i] = (conservatoryDepth - poleSizeY) / 2;
                    }
                    else
                        this.optionCenterPos[i] = poleSizeX + ((this.optionSpacing[0] + poleSizeX) * i) + (this.optionSpacing[0] / 2);
                }
            }
            else {
                for (let i = 0; this.poleAmount >= i; i++) {
                    if (this.poleAmount == 0)
                        this.optionCenterPos[i] = 0;
                    else
                        this.optionCenterPos[i] = -(-conservatoryWidth / 2 + poleSizeX + ((this.optionSpacing[0] + poleSizeX) * i) + (this.optionSpacing[0] / 2));
                }
            }
        }
        calculateOptionSpacing(poleSizeX, poleSizeY, poleInWay) {
            if (this.side == 'Left' || this.side == "Right") {
                this.calculatePoleYpos();
                for (let i = 0; this.poleAmount >= i; i++) {
                    if (this.poleAmount == 0) {
                        this.optionSpacing[i] = (conservatoryDepth) - 2 * poleSizeX;
                        if (!poleInWay)
                            this.optionSpacing[i] = conservatoryDepth - poleSizeY;
                    }
                    else
                        this.optionSpacing[i] = (conservatoryDepth - (2 + this.poleAmount) * poleSizeX) / (this.poleAmount + 1);
                }
            }
            else {
                this.calculatePoleXpos();
                for (let i = 0; this.poleAmount >= i; i++) {
                    if (this.poleAmount == 0)
                        this.optionSpacing[i] = conservatoryWidth - 2 * poleSizeX;
                    else
                        this.optionSpacing[i] = (conservatoryWidth - (2 + this.poleAmount) * poleSizeX) / (this.poleAmount + 1);
                }
            }
        }
        calculatePoleXpos(poleSize) {
            this.calculateOptionXposSE();
            for (let i = 0; this.poleAmount > i; i++)
                this.poleXpos[i] = -(-(conservatoryWidth - poleSize) / 2 + ((conservatoryWidth - poleSize) / (this.poleAmount + 1)) * (i + 1));
        }
        calculatePoleYpos(poleSizeX) {
            this.calculateOptionYposSE();
            for (let i = 0; this.poleAmount > i; i++)
                this.poleYpos[i] = poleSizeX / 2 + ((conservatoryDepth - (poleSizeX)) / (this.poleAmount + 1) * (i + 1));
        }
    }

    const leftSpecs = new sideSpecs("Left");
    const rightSpecs = new sideSpecs("Right");
    const frontSpecs = new sideSpecs("Front");
    const rearSpecs = new sideSpecs("Rear");
    const standaloneSpecs = new sideSpecs("standalone");

    PL.init = function (appInstance, scope, snapshot) {
        setCameraOptions(environmentEnabled);

        this.procedures["handleButtons"] = handleButtons;
        this.procedures["handleEvents"] = handleEvents;
        this.procedures["handleFocus"] = handleFocus;
        this.procedures["handleValue"] = handleValue;

        function setCameraOptions(enabled) {
            appInstance.controls.panInertia = 0.1;
            appInstance.controls.rotateInertia = 0.1;

            appInstance.controls.minPolarAngle = 0;
            appInstance.controls.maxPolarAngle = 5;
        }

        function handleButtons(data) {
            switch (data.type) {
                case 'RELOAD_3D':
                    takeSnapshot();
                    break;
                case 'FULL_SCREEN':
                    appInstance._resizeCb();
                    break;
                case 'DOWNLOAD_IMAGE':
                    generateScreenshot();
                    break;
                case 'SHOW_MEASUREMENTS':
                    measurementsEnabled = !(data.active); //data.active is the state before change, so it is always opposite
                    enableMeasurements();
                    //cameraPosition();
                    break;
                case 'SHOW_ENVIRONMENT':
                    environmentEnabled = !(data.active); //data.active is the state before change, so it is always opposite
                    enableEnvironment(environmentEnabled);
                    enableMeasurements();
                    break;
                case 'SHOW_ANIMATION':
                    overlayImageEnabled = !(data.active) && !disableOverlayImage;
                    //   overlayImage();
                    break;
            }
        }

        /*    function runAllAnimations(state) {
                for (let i = 0; i < 5; i++) {
                    if (leftSpecs.isVerticalScreenEnabled(i) && !!oldVerticalScreenOpening[i] == state)
                        animateVerticalScreens(i);
                    if (rightSpecs.isVerticalScreenEnabled(i) && !!oldVerticalScreenOpening[i + 5] == state)
                        animateVerticalScreens(i + 5);
                    if (frontSpecs.isVerticalScreenEnabled(i) && !!oldVerticalScreenOpening[i + 10] == state)
                        animateVerticalScreens(i + 10);
                    if (rearSpecs.isVerticalScreenEnabled(i) && !!oldVerticalScreenOpening[i + 15] == state)
                        animateVerticalScreens(i + 15);
    
                    if (leftSpecs.isClimaglideEnabled(i) && leftSpecs.climaglideIsOpen[i] == state)
                        animateClimaglide(i + 20);
                    if (rightSpecs.isClimaglideEnabled(i) && rightSpecs.climaglideIsOpen[i] == state)
                        animateClimaglide(i + 25);
                    if (frontSpecs.isClimaglideEnabled(i) && frontSpecs.climaglideIsOpen[i] == state)
                        animateClimaglide(i + 30);
                    if (rearSpecs.isClimaglideEnabled(i) && rearSpecs.climaglideIsOpen[i] == state)
                        animateClimaglide(i + 35);
                }
            }*/

        function handleEvents(data) {
            /*      if (data.step.id == "8b1a6b70b988483bab26f81b286911e4") {
                      measurementsStepEnabled = true;
                      enableMeasurements();
                  } else {
                      measurementsStepEnabled = false;
                      enableMeasurements();
                  }*/
            switch (data.step.id) {
                case '0b6319e5cf034ee3b60df7fc13b27412':
                    tweenCameraToSide("left");
                    break;
                case '49d117e0f820471da9864895f81fca81':
                    tweenCameraToSide("right");
                    break;
                case 'eff99be6146d44e4ac4efba7dc0c0646':
                    tweenCameraToSide("front");
                    break;
                case 'bb7c1e530ea2474692f4dd5affec1ff6':
                    tweenCameraToSide("rear");
                    break;
            }
            updateMotorRotation();

        }

        function handleValue(data) {
            if (data == undefined)
                return;

            // change measurements color value change on width, depth or height
            setMaterialValue("Measurements_Width", "Value", 0);
            setMaterialValue("Measurements_Depth", "Value", 0);
            setMaterialValue("Measurements_Height", "Value", 0);
            if (data.uniqueLabel == 'width_field') {
                setMaterialValue("Measurements_Width", "Value", 1);
                renderFrame();
            }
            else if (data.uniqueLabel == 'depth_field') {
                setMaterialValue("Measurements_Depth", "Value", 1);
                renderFrame();
            }
            else if (data.uniqueLabel == 'height_field') {
                setMaterialValue("Measurements_Height", "Value", 1);
                renderFrame();
            };
        }

        function handleFocus(data) {
            if (data !== undefined)
                if (!data && oldFocusData != -1) {
                    selectedRoofPanelIndex = -1;
                    selectedRoofRafterIndex = -1;
                    //     enableRoofFillings();
                    //      enableRoofWidthDivisions();
                    oldFocusData = -1;
                }
                else if (data) {
                    if (data.uniqueLabel == 'left')
                        tweenCameraToSide("left");
                    else if (data.uniqueLabel == 'opti_2')
                        tweenCameraToSide("right");
                    else if (data.uniqueLabel == 'opti_1')
                        tweenCameraToSide("front");
                    else if (data.uniqueLabel == 'opti_3')
                        tweenCameraToSide("rear");
                    else if (data.uniqueLabel == 'roof')
                        tweenCameraToSide("top");

                    if (data.uniqueLabel == "dimensions_step" || data.uniqueLabel == "width_field" || data.uniqueLabel == "depth_field" || data.uniqueLabel == "height_field") {
                        measurementsStepEnabled = true;
                        enableMeasurements();
                    }
                    else {
                        measurementsStepEnabled = false;
                        enableMeasurements();
                    }

                    openGroup(false, -1, data.uniqueLabel);

                    // change measurements color if focus on width, depth or height field
                    setMaterialValue("Measurements_Width", "Value", 0);
                    setMaterialValue("Measurements_Depth", "Value", 0);
                    setMaterialValue("Measurements_Height", "Value", 0);
                    if (data.uniqueLabel == 'width_field') {
                        setMaterialValue("Measurements_Width", "Value", 1);
                    }
                    else if (data.uniqueLabel == 'depth_field') {
                        setMaterialValue("Measurements_Depth", "Value", 1);
                    }
                    else if (data.uniqueLabel == 'height_field') {
                        setMaterialValue("Measurements_Height", "Value", 1);
                    };
                }
            if (data !== undefined)
                console.log(data);

            enableScene();

        }

        function enableEnvironment(enabled) {
            enabled = enabled && !overlayImageEnabled;

            loadEnvironment();
            renderFrame();
            setCameraOptions(enabled);

            //classic style
            setObjTransform("House_classic", 'position', '', 0, '', false);
            if (isFreestanding) {
                setObjTransform("House_classic", 'position', '', -3, '', false);
                setMorphFactor('Ground_classic', 'Deck', 0.3);
            }
            if (additionalWallsSpecs[0])
                setObjTransform("House_classic", 'position', conservatoryWidth / 2 - 3.33, '', '', false);
            else
                setObjTransform("House_classic", 'position', conservatoryWidth / 2 - 2.83, '', '', false);

            setMorphFactor('Ground_classic', 'Distance', (conservatoryDepth + 2) / 10);

            //modern style
            setObjTransform("House_modern", 'position', '', 0, 0, false);
            setObjTransform("Ground_modern", 'position', '', 0, 0, false);

            setMorphFactor('House_modern', 'Driveway', 0);
            setMorphFactor('Ground_modern', 'Distance front', (conservatoryDepth + 1.5) / 10);
            setMorphFactor('Furniture_modern_pool_rear', 'Distance front', (conservatoryDepth + 2) / 10);
            setMorphFactor('Ground_modern', 'Distance rear', 0);
            setMorphFactor('Ground_modern', 'Extra environment depth', 0);

            if (houseType == "modern")
                changeVis("House_modern_roof", enabled);

            if (conservatoryDepth > 7)
                setMorphFactor('Ground_modern', 'Extra environment depth', (conservatoryDepth - 7) / 10);

            if (isFreestanding) {
                setObjTransform("House_modern", 'position', '', -3, 0, false);
                setObjTransform("Ground_modern", 'position', '', '', 0, false);

                setMorphFactor('Ground_modern', 'Deck', 0.3);

                setObjTransform("House_modern", 'position', '', -10.5, 0, false);
                setObjTransform("Ground_modern", 'position', '', -10.5, 0, false);

                setMorphFactor('Ground_modern', 'Distance front', 0.3);
                setMorphFactor('Ground_modern', 'Distance rear', (conservatoryDepth - 0.5) / 10);

                changeVis("Furniture_modern_pool_front", enabled);
            }

            let classicObj = ["Ground_classic", "House roof_classic", "House_classic", "Sun_classic"];
            let modernObj = ["Ground_modern", "House_modern_facade", "House_modern", "Sun_modern"];
            let allObj = classicObj.concat(modernObj);

            for (let i = 0; allObj[i] != undefined; i++)
                changeVis(allObj, false);

            if (houseType == "modern")
                for (let i = 0; modernObj[i] != undefined; i++)
                    changeVis(modernObj, enabled);
            if (houseType == "classic")
                for (let i = 0; classicObj[i] != undefined; i++)
                    changeVis(classicObj, enabled);

            additionalWalls(enabled);
            houseWindowAdaptation();
            modernHouseFurniture(enabled);

            changeVis("Sun_!env", !enabled);

            function loadEnvironment() {
                if (environmentLoaded || !environmentEnabled)
                    return;

                registerSetTimeout(0, function () {
                    appendScene(scope["_3dFiles"][0], "Scene", false, false, function () {
                        environmentLoaded = true;
                        clearScene();
                        enableScene();
                    }, function () { }, function () { });
                });
            }

        }

        function sendConfiguratorParams(funcName) {
            var jsFunc = appInstance.ExternalInterface[funcName];
            if (typeof jsFunc == "function")
                return jsFunc;
            else
                return function () { };
        }

        function openGroup(fromWithin3D, index, label) {
            if (fromWithin3D) {
                /*   if (!select)
                       if (label == "filling_group~" && selectedRoofPanelIndex != index)
                           return;
                       else if (label == "rafter_group~" && selectedRoofRafterIndex != index)
                           return;*/


                selectedRoofPanelIndex = -1;
                selectedRoofRafterIndex = -1;

                if (label == "filling_group~")
                    selectedRoofPanelIndex = index;
                if (label == "rafter_group~")
                    selectedRoofRafterIndex = index;

                sendConfiguratorParams('focus')({
                    uniqueLabel: label + index,
                });
            }
            else {
                if (label.includes("filling_group")) {
                    selectedRoofPanelIndex = -1;
                    selectedRoofRafterIndex = -1;
                    index = parseInt(label.slice(14));
                    selectedRoofPanelIndex = index;
                }
                if (label.includes("rafter_group")) {
                    selectedRoofRafterIndex = -1;
                    selectedRoofPanelIndex = -1;
                    index = parseInt(label.slice(13));
                    selectedRoofRafterIndex = index;
                }
                oldFocusData = label;
            }
            enableScene();
        }

        function modernHouseFurniture(enabled) {
            changeVis("Furniture_modern_veranda_23", false);
            changeVis("Furniture_modern_veranda_32", false);
            changeVis("Furniture_modern_pots", false);
            changeVis("Furniture_modern_umbrella", false);

            if (conservatoryWidth > 4.2) {
                if (conservatoryDepth > 2.3)
                    changeVis("Furniture_modern_veranda_23", enabled);
                if (conservatoryDepth > 3.2)
                    changeVis("Furniture_modern_veranda_32", enabled);
            }
            if (conservatoryWidth < 9.2)
                changeVis("Furniture_modern_umbrella", enabled);
            if (conservatoryWidth < 10.8)
                changeVis("Furniture_modern_pots", enabled);
        }

        function houseWindowAdaptation() {
            setMorphFactor("House_modern_facade", 'Center width', 0.1);
            setMorphFactor("House_modern_facade", 'Left width', 0);
            setMorphFactor("House_modern_facade", 'Left distance', 0);
            setMorphFactor("House_modern_facade", 'Right width', 0);
            setMorphFactor("House_modern_facade", 'Right distance', 0);

            setMorphFactor("House_modern", 'Window height', 0);

            if (conservatoryWidth < 5.5) {
                setMorphFactor("House_modern_facade", 'Center width', (conservatoryWidth - 1.5) / 20);
                setMorphFactor("House_modern_facade", 'Left width', 0.1);
                setMorphFactor("House_modern_facade", 'Left distance', 0.15);
                setMorphFactor("House_modern_facade", 'Right width', 0.08);
                setMorphFactor("House_modern_facade", 'Right distance', 0.1);
            }
            else if (conservatoryWidth < 7.4) {
                setMorphFactor("House_modern_facade", 'Center width', (5 - 1.5) / 20);
                setMorphFactor("House_modern_facade", 'Left width', 0.05);
                setMorphFactor("House_modern_facade", 'Left distance', 0.05);
                setMorphFactor("House_modern_facade", 'Right width', 0.05);
                setMorphFactor("House_modern_facade", 'Right distance', 0.05);
            }
            else if (conservatoryWidth < 8.5) {
                setMorphFactor("House_modern_facade", 'Center width', (5 - 1.5) / 20);
                setMorphFactor("House_modern_facade", 'Left width', 0.07);
                setMorphFactor("House_modern_facade", 'Left distance', 0.07);
                setMorphFactor("House_modern_facade", 'Right width', 0.02);
                setMorphFactor("House_modern_facade", 'Right distance', 0.02);
            }
            else if (conservatoryWidth < 9.3) {
                setMorphFactor("House_modern_facade", 'Center width', (5 - 1.5) / 20);
                setMorphFactor("House_modern_facade", 'Left width', 0.03);
                setMorphFactor("House_modern_facade", 'Left distance', 0.03);
            }
            else {
                setMorphFactor("House_modern_facade", 'Center width', (5 - 1.5) / 20);
                setMorphFactor("House_modern_facade", 'Left width', 0.03);
                setMorphFactor("House_modern_facade", 'Left distance', 0.3);
                setMorphFactor("House_modern_facade", 'Right width', 0.03);
                setMorphFactor("House_modern_facade", 'Right distance', 0.2);
            }

            if (triangleRearHeight + gutterHeight >= 3.3 && triangleRearHeight + gutterHeight <= 4.8)
                setMorphFactor("House_modern", 'Window height', (triangleRearHeight + gutterHeight - 3.3) / 2);
            else if (triangleRearHeight + gutterHeight > 4.8)
                setMorphFactor("House_modern", 'Window height', 0.8);
        }

        function additionalWalls(enabled) {
            if (disableAdditionaWalls)
                return;

            let noFrontWallAdaptation = 0;
            if (!additionalWallsSpecs[2])
                noFrontWallAdaptation = 0.5;

            setObjTransform("Left Wall_classic", 'position', conservatoryWidth / 2, 1.4, '', false);
            setObjTransform("Right Wall_classic", 'position', -conservatoryWidth / 2, 0, '', false);
            setObjTransform("Front Wall", 'position', 0, conservatoryDepth, '', false);
            setObjTransform("Right Wall Transparent", 'position', -conservatoryWidth / 2, 0, '', false);
            setObjTransform("Front Wall Transparent", 'position', 0, conservatoryDepth, '', false);

            setObjTransform("Right Wall_modern", 'position', -conservatoryWidth / 2, 0, '', false);
            setObjTransform("Left Wall_modern", 'position', conservatoryWidth / 2, 0, '', false);

            setMorphFactor("Left Wall_classic", 'Depth', ((conservatoryDepth - 1 - 0.4 - 1) / 99));
            setMorphFactor("Right Wall_classic", 'Depth', ((conservatoryDepth - 1) / 99));
            setMorphFactor("Left Wall Transparent", 'Depth', ((conservatoryDepth - 1 - 0.4 - 1 + noFrontWallAdaptation) / 99));
            setMorphFactor("Right Wall Transparent", 'Depth', ((conservatoryDepth - 1 + noFrontWallAdaptation) / 99));

            setMorphFactor("Left Wall_modern", 'Depth', ((conservatoryDepth - 1 + noFrontWallAdaptation) / 99));
            setMorphFactor("Right Wall_modern", 'Depth', ((conservatoryDepth - 1 + noFrontWallAdaptation) / 99));

            setMorphFactor("Left Wall_classic", 'Height', (2.05 / 99));
            setMorphFactor("Right Wall_classic", 'Height', (2.05 / 99));
            setMorphFactor("Left Wall Transparent", 'Height', (2.05 / 99));
            setMorphFactor("Right Wall Transparent", 'Height', (2.05 / 99));

            setMorphFactor("Left Wall_modern", 'Height', (2.05 / 99));
            setMorphFactor("Right Wall_modern", 'Height', (2.05 / 99));

            setMorphFactor("Front Wall", 'Height', (2.05 / 99));

            setMorphFactor("Left Wall_classic", 'Zero height', 0);
            setMorphFactor("Right Wall_classic", 'Zero height', 0);
            setMorphFactor("Left Wall Transparent", 'Zero height', 0);
            setMorphFactor("Right Wall Transparent", 'Zero height', 0);

            setMorphFactor("Left Wall_modern", 'Zero height', 0);
            setMorphFactor("Right Wall_modern", 'Zero height', 0);

            setMorphFactor("Front Wall", 'Zero height', 0);
            setMorphFactor("Rear Wall", 'Zero height', 0);

            changeVis("Left Wall_classic", false);
            changeVis("Right Wall_classic", false);
            changeVis("Left Wall Transparent", false);
            changeVis("Right Wall Transparent", false);

            changeVis("Left Wall_modern", false);
            changeVis("Right Wall_modern", false);

            changeVis("Front Wall", false);
            changeVis("Rear Wall", false);

            if (!enabled) {
                setObjTransform("Left Wall Transparent", 'position', conservatoryWidth / 2, 0, '', false);
                setMorphFactor("Left Wall Transparent", 'Depth', ((conservatoryDepth - 1 + noFrontWallAdaptation) / 99));

                setMorphFactor("Left Wall Transparent", 'Height', ((triangleRearHeight + gutterHeight - 1 + 0.5) / 99));
                setMorphFactor("Right Wall Transparent", 'Height', ((triangleRearHeight + gutterHeight - 1 + 0.5) / 99));
                setMorphFactor("Front Wall", 'Height', ((triangleRearHeight + gutterHeight - 1 + 0.5) / 99));
                setMorphFactor("Rear Wall", 'Height', ((triangleRearHeight + gutterHeight - 1 + 0.5) / 99));

                setMorphFactor("Front Wall", 'Width', ((conservatoryWidth - 1 + 0.4) / 99));
                setMorphFactor("Rear Wall", 'Width', ((conservatoryWidth - 1 + 0.4) / 99));

                setMorphFactor("Left Wall Transparent", 'Zero height', 1);
                setMorphFactor("Right Wall Transparent", 'Zero height', 1);
                setMorphFactor("Front Wall", 'Zero height', 1);
                setMorphFactor("Rear Wall", 'Zero height', 1);
            }

            if (additionalWallsSpecs[0] && enabled && houseType == "classic")
                changeVis("Left Wall_classic", true);
            else if (additionalWallsSpecs[0] && enabled && houseType == "modern")
                changeVis("Left Wall_modern", true);
            else if (additionalWallsSpecs[0] && !enabled)
                changeVis("Left Wall Transparent", true);
            if (additionalWallsSpecs[1] && enabled && houseType == "classic")
                changeVis("Right Wall_classic", true);
            else if (additionalWallsSpecs[1] && enabled && houseType == "modern")
                changeVis("Right Wall_modern", true);
            else if (additionalWallsSpecs[1] && !enabled)
                changeVis("Right Wall Transparent", true);
            if (additionalWallsSpecs[2])
                changeVis("Front Wall", true);
            if (additionalWallsSpecs[3] && !enabled)
                changeVis("Rear Wall", true);

            if (conservatoryWidth > 7.8 && additionalWallsSpecs[0] && houseType == "classic") {
                setMorphFactor("House_extra_wall_classic", 'Length', ((conservatoryWidth - 8.5) / 99));
                changeVis("House_extra_wall_classic", enabled);
            }
            else if (conservatoryWidth > 7.3 && !additionalWallsSpecs[0] && houseType == "classic") {
                setMorphFactor("House_extra_wall_classic", 'Length', ((conservatoryWidth - 8) / 99));
                changeVis("House_extra_wall_classic", enabled);
            }
        }

        function getPoleSize(axis) {
            if (designStyle == "Horizontal") {
                if (axis == "x")
                    return 0.15;
                if (axis == "y")
                    return 0.15;
            }
            return 0;
        }

        function renderFrame() {
            frameRequested[0] = true;
            registerSetTimeout(animationRenderStopDelay, function () {
                frameRequested[0] = false;
            });
        }

        function isTextElementFlipped(angle) {
            if (((angle <= 180 && (cameraZAngle > angle && cameraZAngle < angle + 180)) || (angle > 180 && (cameraZAngle > angle || cameraZAngle < 180 - (360 - angle)))))
                return true;
            return false;
        }

        function getHScreenHight() {
            if (horizontalScreenEnabled[0]) {
                return {
                    'front': totalHeight + 0.07,
                    'back': totalHeight + 0.145,
                }
            }
            else if (horizontalScreenEnabled[1]) {
                return {
                    'front': totalHeight + 0.138,
                    'back': totalHeight + 0.138,
                }
            }
            else {
                return {
                    'front': totalHeight - 0.075,
                    'back': totalHeight - 0.16,
                }
            }

        }

        function enableMeasurements(justFlip) {

            if ((measurementsEnabled || measurementsStepEnabled) && !overlayImageEnabled) {
                changeVis("widthMeasurement", true && !environmentEnabled);
                changeVis("widthMeasurementText", isTextElementFlipped(270) && !environmentEnabled);
                changeVis("widthMeasurementTextFlipped", !isTextElementFlipped(270) && !environmentEnabled);

                changeVis("depthMeasurement", true && !environmentEnabled);
                changeVis("depthMeasurementText", isTextElementFlipped(180) && !environmentEnabled);
                changeVis("depthMeasurementTextFlipped", !isTextElementFlipped(180) && !environmentEnabled);

                changeVis("highestPointMeasurement", true);
                changeVis("highestPointMeasurementText", !isTextElementFlipped(90));
                changeVis("highestPointMeasurementTextFlipped", isTextElementFlipped(90));

                changeVis("depthMeasurementTop", true && environmentEnabled);
                changeVis("depthMeasurementTopText", isTextElementFlipped(180) && environmentEnabled);
                changeVis("depthMeasurementTopTextFlipped", !isTextElementFlipped(180) && environmentEnabled);

                changeVis("widthMeasurementTop", true && environmentEnabled);
                changeVis("widthMeasurementTopText", isTextElementFlipped(270) && environmentEnabled);
                changeVis("widthMeasurementTopTextFlipped", !isTextElementFlipped(270) && environmentEnabled);

                changeVis("WalkThroughHeightMeasurement", true);
                changeVis("WalkThroughHeightMeasurementText", isTextElementFlipped(180) /*&& environmentEnabled */);
                changeVis("WalkThroughHeightMeasurementTextFlipped", !isTextElementFlipped(180) /*  && environmentEnabled */);

                if (horizontalScreenEnabled[0] || horizontalScreenEnabled[1] || horizontalScreenEnabled[2]) {
                    changeVis("HorizontalScreenHeightMeasurement", true /* && environmentEnabled */);
                    changeVis("HorizontalScreenHeightMeasurementText", isTextElementFlipped(270) /*&& environmentEnabled */);
                    changeVis("HorizontalScreenHeightMeasurementTextFlipped", !isTextElementFlipped(270) /*  && environmentEnabled */);

                    changeVis("HorizontalScreenFrontMeasurement", true /* && environmentEnabled */);
                    changeVis("HorizontalScreenFrontMeasurementText", isTextElementFlipped(180) /*&& environmentEnabled */);
                    changeVis("HorizontalScreenFrontMeasurementTextFlipped", !isTextElementFlipped(180) /*  && environmentEnabled */);
                }
            }
            else {
                changeVis("widthMeasurement", false);
                changeVis("widthMeasurementText", false);
                changeVis("widthMeasurementTextFlipped", false);

                changeVis("depthMeasurement", false);
                changeVis("depthMeasurementText", false);
                changeVis("depthMeasurementTextFlipped", false);

                changeVis("highestPointMeasurement", false);
                changeVis("highestPointMeasurementText", false);
                changeVis("highestPointMeasurementTextFlipped", false);

                changeVis("depthMeasurementTop", false);
                changeVis("depthMeasurementTopText", false);
                changeVis("depthMeasurementTopTextFlipped", false);

                changeVis("widthMeasurementTop", false);
                changeVis("widthMeasurementTopText", false);
                changeVis("widthMeasurementTopTextFlipped", false);

                changeVis("HorizontalScreenHeightMeasurement", false);
                changeVis("HorizontalScreenHeightMeasurementText", false);
                changeVis("HorizontalScreenHeightMeasurementTextFlipped", false);

                changeVis("HorizontalScreenFrontMeasurement", false);
                changeVis("HorizontalScreenFrontMeasurementText", false);
                changeVis("HorizontalScreenFrontMeasurementTextFlipped", false);

                changeVis("WalkThroughHeightMeasurement", false);
                changeVis("WalkThroughHeightMeasurementText", false);
                changeVis("WalkThroughHeightMeasurementTextFlipped", false);
            }
            renderFrame();

            if (justFlip)
                return;

            setMorphFactor('widthMeasurement', 'Width', ((conservatoryWidth - 1) / 99));
            setObjTransform('widthMeasurement', 'position', '', conservatoryDepth, '', false);
            setObjTransform('widthMeasurementText', 'position', '', '', -0.15, false);
            setObjTransform('widthMeasurementTextFlipped', 'position', '', '', -0.15, false);

            setMorphFactor('depthMeasurement', 'Depth', ((conservatoryDepth - 1) / 99));
            setObjTransform('depthMeasurement', 'position', (conservatoryWidth) / 2, 0, '', false);
            setObjTransform('depthMeasurementText', 'position', (conservatoryWidth) / 2, (conservatoryDepth) / 2, -0.15, false);
            setObjTransform('depthMeasurementTextFlipped', 'position', (conservatoryWidth) / 2, (conservatoryDepth) / 2, -0.15, false);

            setMorphFactor('highestPointMeasurement', 'Height', ((totalHeight - 1) / 99));
            setObjTransform('highestPointMeasurement', 'position', (conservatoryWidth) / 2, conservatoryDepth, '', false);
            setObjTransform('highestPointMeasurementText', 'position', (conservatoryWidth) / 2 + 0.25 + 0.32, conservatoryDepth, totalHeight / 2, false);
            setObjTransform('highestPointMeasurementTextFlipped', 'position', (conservatoryWidth) / 2 + 0.25 + 0.32, conservatoryDepth, totalHeight / 2, false);

            updateTextObj("widthMeasurementText", conservatoryWidthMM + "mm");
            updateTextObj("widthMeasurementTextFlipped", conservatoryWidthMM + "mm");
            updateTextObj("depthMeasurementText", conservatoryDepthMM + "mm");
            updateTextObj("depthMeasurementTextFlipped", conservatoryDepthMM + "mm");
            updateTextObj("highestPointMeasurementText", totalHeightMM + "mm");
            updateTextObj("highestPointMeasurementTextFlipped", totalHeightMM + "mm");

            setMorphFactor('widthMeasurementTop', 'Width', ((conservatoryWidth - 1) / 99));
            setObjTransform('widthMeasurementTop', 'position', '', conservatoryDepth, totalHeight, false);
            setObjTransform('widthMeasurementTopText', 'position', '', conservatoryDepth, totalHeight + 0.35, false);
            setObjTransform('widthMeasurementTopTextFlipped', 'position', '', conservatoryDepth, totalHeight + 0.35, false);

            setMorphFactor('depthMeasurementTop', 'Depth', ((conservatoryDepth - 1) / 99));
            setObjTransform('depthMeasurementTop', 'position', (conservatoryWidth) / 2, 0, totalHeight, false);
            setObjTransform('depthMeasurementTopText', 'position', (conservatoryWidth) / 2, conservatoryDepth / 2, totalHeight + 0.35, false);
            setObjTransform('depthMeasurementTopTextFlipped', 'position', (conservatoryWidth) / 2, conservatoryDepth / 2, totalHeight + 0.35, false);

            updateTextObj("widthMeasurementTopText", conservatoryWidthMM + "mm");
            updateTextObj("widthMeasurementTopTextFlipped", conservatoryWidthMM + "mm");
            updateTextObj("depthMeasurementTopText", conservatoryDepthMM + "mm");
            updateTextObj("depthMeasurementTopTextFlipped", conservatoryDepthMM + "mm");

            // Horizontal screen height Back and Front meeasurements
            //Back
            setMorphFactor('HorizontalScreenHeightMeasurement', 'Height', (getHScreenHight().back - 1) / 99);
            setObjTransform('HorizontalScreenHeightMeasurement', 'position', conservatoryWidth / 2, '', '', false);
            setObjTransform('HorizontalScreenHeightMeasurementText', 'position', '', '', totalHeight / 2, false);
            setObjTransform('HorizontalScreenHeightMeasurementTextFlipped', 'position', '', '', (totalHeight + 0.15) / 2, false);
            updateTextObj("HorizontalScreenHeightMeasurementText", getHScreenHight().back * 1000 + "mm");
            updateTextObj("HorizontalScreenHeightMeasurementTextFlipped", getHScreenHight().back * 1000 + "mm");

            //Front
            setMorphFactor('HorizontalScreenFrontMeasurement', 'Height', (getHScreenHight().front - 1) / 99);
            setObjTransform('HorizontalScreenFrontMeasurement', 'position', conservatoryWidth / 2, conservatoryDepth, '', false);
            setObjTransform('HorizontalScreenFrontMeasurementText', 'position', '', '', (getHScreenHight().front) / 2, false);
            setObjTransform('HorizontalScreenFrontMeasurementTextFlipped', 'position', '', '', (getHScreenHight().front) / 2, false);
            updateTextObj("HorizontalScreenFrontMeasurementText", getHScreenHight().front * 1000 + "mm");
            updateTextObj("HorizontalScreenFrontMeasurementTextFlipped", getHScreenHight().front * 1000 + "mm");

            //Walk Through Height
            setMorphFactor('WalkThroughHeightMeasurement', 'Height', (totalHeight - 0.26 - 1) / 99);
            setObjTransform('WalkThroughHeightMeasurement', 'position', -conservatoryWidth / 2 + 0.15, conservatoryDepth, '', false);
            setObjTransform('WalkThroughHeightMeasurementText', 'position', '', '', (totalHeight) / 2, false);
            setObjTransform('WalkThroughHeightMeasurementTextFlipped', 'position', '', '', (totalHeight) / 2, false);
            updateTextObj("WalkThroughHeightMeasurementText", totalHeightMM - (0.26 * 1000) + "mm");
            updateTextObj("WalkThroughHeightMeasurementTextFlipped", totalHeightMM - (0.26 * 1000) + "mm");

        }

        function generateScreenshot() {
            downloadFile(appInstance.renderer.domElement.toDataURL('image/png'), scope['_3d_screenshotName'] + '.png');
        }

        function downloadFile(contents, filename) {
            if (!filename)
                return;

            if (contents instanceof Promise) {
                contents.then(function (response) {
                    doDownload(response, filename);
                }, function (error) { });
            } else {
                doDownload(contents, filename);
            }

            function doDownload(contents, filename) {
                if (typeof contents !== 'string') {
                    contents = toJSONDataUri(contents);
                } else if (!checkDataUri(contents) && !checkBlobUri(contents)) {
                    contents = toTextDataUri(contents);
                }
                var link = document.createElement('a');
                link.href = contents;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
            }
        }

        function toTextDataUri(obj) {
            if (typeof obj !== 'string')
                obj = JSON.stringify(obj);
            return 'data:text/plain;base64,' + base64EncodeUnicode(obj);
        }

        function checkBlobUri(obj) {
            return (typeof obj === 'string' && obj.indexOf('blob:') == 0);
        }

        function checkDataUri(obj) {
            return (typeof obj === 'string' && obj.indexOf('data:') == 0);
        }

        function toJSONDataUri(obj) {
            if (typeof obj !== 'string')
                obj = JSON.stringify(obj);
            return 'data:application/json;base64,' + base64EncodeUnicode(obj);
        }

        function notIgnoredObj(obj) {
            return (obj.type !== "AmbientLight" && obj.name !== ""
                && !(obj.isMesh && obj.isMaterialGeneratedMesh));
        }

        function getObjectByName(objName) {
            var objFound;
            var runTime = _pGlob !== undefined;
            objFound = runTime ? _pGlob.objCache[objName] : null;

            if (objFound && objFound.name === objName)
                return objFound;
            appInstance.scene.traverse(function (obj) {
                if (!objFound && notIgnoredObj(obj) && (obj.name == objName)) {
                    objFound = obj;
                    if (runTime) {
                        _pGlob.objCache[objName] = objFound;
                    }
                }
            });
            return objFound;
        }

        function registerOnDrag(objSelector, xRay, mouseButtons, cbStart, cbMove, cbDrop, blockId) {
            var cb = function (cbParam) {
                if (appInstance.controls) {
                    appInstance.controls.enabled = false;
                }
                if (!(blockId in _pGlob.objDragOverInfoByBlock)) {
                    _pGlob.objDragOverInfoByBlock[blockId] = initDragOverInfo();
                }
                var info = _pGlob.objDragOverInfoByBlock[blockId];

                if (info.isDowned) {
                    return;
                }
                var touchId = eventTouchIdGetFirst(cbParam.downEvent);
                var coords = eventGetOffsetCoords(cbParam.downEvent, touchId,
                    _pGlob.vec2Tmp);

                info.downX = info.prevX = info.currX = coords.x;
                info.downY = info.prevY = info.currY = coords.y;
                info.touchId = touchId;
                info.isDowned = true;
                info.isMoved = false;
                info.draggedObjName = cbParam.draggedObjName;

                cbStart(cbParam.downEvent);

                var elem = appInstance.container;

                var moveCb = function (e) {
                    if (!eventTouchIdChangedFilter(e, info.touchId)) {
                        return;
                    }
                    var coords = eventGetOffsetCoords(e, info.touchId, _pGlob.vec2Tmp);
                    info.prevX = info.currX;
                    info.prevY = info.currY;
                    info.currX = coords.x;
                    info.currY = coords.y;
                    cbMove(e);
                    info.isMoved = true;
                }
                var upCb = function (e) {
                    if (!eventTouchIdChangedFilter(e, info.touchId)) {
                        return;
                    }
                    var coords = eventGetOffsetCoords(e, info.touchId, _pGlob.vec2Tmp);
                    info.currX = coords.x;
                    info.currY = coords.y;
                    info.prevX = info.currX;
                    info.prevY = info.currY;
                    cbDrop(e);
                    info.isDowned = false;

                    elem.removeEventListener('mousemove', moveCb);
                    elem.removeEventListener('touchmove', moveCb);
                    elem.removeEventListener('mouseup', upCb);
                    elem.removeEventListener('touchend', upCb);
                    if (appInstance.controls) {
                        appInstance.controls.enabled = true;
                    }
                }
                elem.addEventListener('mousemove', moveCb);
                elem.addEventListener('touchmove', moveCb);
                elem.addEventListener('mouseup', upCb);
                elem.addEventListener('touchend', upCb);
            }

            var objNames = retrieveObjectNames(objSelector);
            for (var i = 0; i < objNames.length; i++) {
                var objName = objNames[i];
                _pGlob.objDragOverInfoGlobal.push({
                    objName: objName,
                    callback: cb,
                    xRay: xRay,
                    mouseButtons: mouseButtons
                });
            }
        }

        function eventTouchIdGetFirst(e) {
            if (e instanceof MouseEvent) {
                return -1;
            } else if (window.TouchEvent && e instanceof TouchEvent) {
                if (e.type == "touchstart" || e.type == "touchend" || e.type == "touchmove") {
                    return e.changedTouches[0].identifier;
                } else {
                    return e.touches[0].identifier;
                }
            }
            return -1;
        }

        function initDragOverInfo() {
            return {
                draggedObjName: '',
                downX: 0, downY: 0,
                prevX: 0, prevY: 0,
                currX: 0, currY: 0,
                isDowned: false,
                isMoved: false,
                touchId: -1
            };
        }

        function eventGetOffsetCoords(e, touchId, dest) {
            if (e instanceof MouseEvent) {
                dest.set(e.offsetX, e.offsetY);
            } else if (window.TouchEvent && e instanceof TouchEvent) {
                var rect = e.target.getBoundingClientRect();
                var touches = e.touches;
                if (e.type == "touchstart" || e.type == "touchend" || e.type == "touchmove") {
                    touches = e.changedTouches;
                }
                var touch = touches[0];
                for (var i = 0; i < touches.length; i++) {
                    if (touches[i].identifier == touchId) {
                        touch = touches[i];
                        break;
                    }
                }
                dest.set(touch.clientX - rect.left, touch.clientY - rect.top);
            }
            return dest;
        }

        function eventTouchIdChangedFilter(e, touchId) {
            if (window.TouchEvent && e instanceof TouchEvent) {
                if (e.type == "touchstart" || e.type == "touchend" || e.type == "touchmove") {
                    var isChanged = false;
                    for (var i = 0; i < e.changedTouches.length; i++) {
                        if (e.changedTouches[i].identifier == touchId) {
                            isChanged = true;
                            break;
                        }
                    }
                    return isChanged;
                }
            }
            return true;
        }

        function dragScale(objSelector, mode, blockId, parentDragOverBlockId) {
            var camera = appInstance.getCamera(true);
            if (!camera)
                return;

            if (!_pGlob.objDragOverInfoByBlock)
                return;

            var objNames = retrieveObjectNames(objSelector);

            var info = _pGlob.objDragOverInfoByBlock[parentDragOverBlockId];
            if (!info) return;

            if (!(blockId in _pGlob.dragScaleOrigins)) {
                _pGlob.dragScaleOrigins[blockId] = [];
            }
            var scaleOrigins = _pGlob.dragScaleOrigins[blockId];
            var lenDiff = objNames.length - scaleOrigins.length;
            for (var i = 0; i < lenDiff; i++) {
                scaleOrigins.push(new v3d.Vector3());
            }

            var coordSystem = getCoordSystem();
            for (var i = 0; i < objNames.length; i++) {
                var obj = getObjectByName(objNames[i]);
                if (!obj) {
                    continue;
                }
                var scaleOrigin = scaleOrigins[i];
                if (!info.isMoved) {
                    scaleOrigin.copy(obj.scale);
                }
                if (mode == "X" || mode == "Y" || mode == "Z") {
                    if (coordSystem == 'Z_UP_RIGHT')
                        var coord = mode == "X" ? "x" : (mode == "Y" ? "z" : "y");
                    else
                        var coord = mode == "X" ? "x" : (mode == "Y" ? "y" : "z");
                    var objPos = obj.getWorldPosition(_pGlob.vec3Tmp);
                    objPos.project(camera);

                    var objX = (objPos.x + 1) / 2 * appInstance.getWidth();
                    var objY = (-objPos.y + 1) / 2 * appInstance.getHeight();

                    var vecFrom = _pGlob.vec2Tmp.set(info.downX - objX, objY - info.downY);
                    var vecTo = _pGlob.vec2Tmp2.set(info.currX - objX, objY - info.currY);

                    obj.scale[coord] = Math.max(scaleOrigin[coord]
                        * vecTo.dot(vecFrom) / vecFrom.lengthSq(), _pGlob.MIN_DRAG_SCALE);
                    obj.updateMatrixWorld(true);
                }
            }
        }

        function initializeDragActions() {
            registerOnDrag('movementManipulator', false, [2], function () { frameRequested[1] = true; }, function () {
                dragMove('rotationManipulator', 'XY', '2', '1');
            }, function () { frameRequested[1] = false }, '1');
            registerOnDrag('rotationManipulator', false, [2], function () { frameRequested[1] = true; }, function () {
                dragRotate('rotationManipulator', 'Z', true, '2', '1');
            }, function () { frameRequested[1] = false }, '1');

            registerOnDrag('orientationPicker_X', false, [2], function () { frameRequested[1] = true; }, function () {
                dragMove('orientationPicker_X', 'Z', '2', '1');
            }, function () { frameRequested[1] = false; planeAction() }, '1');
            registerOnDrag('orientationPicker_Y', false, [2], function () { frameRequested[1] = true; }, function () {
                dragMove('orientationPicker_Y', 'Z', '2', '1');
            }, function () { frameRequested[1] = false; planeAction() }, '1');
            registerOnDrag('orientationPicker_topZ', false, [2], function () { frameRequested[1] = true; }, function () {
                dragMove('orientationPicker_topZ', 'Z', '2', '1');
            }, function () { frameRequested[1] = false; planeAction() }, '1');
            registerOnDrag('orientationPicker_lowZ', false, [2], function () { frameRequested[1] = true; }, function () {
                dragMove('gizmoManipulator', 'XY', '2', '1');
            }, function () { frameRequested[1] = false; planeAction() }, '1');
        }

        function planeAction() {
            setObjTransform("orientationPicker_lowZ", 'rotation', getObjTransform("orientationPicker_Y", 'rotation', 'x'), getObjTransform("orientationPicker_X", 'rotation', 'z'), '', false);
            setObjTransform("grid", 'rotation', getObjTransform("orientationPicker_Y", 'rotation', 'x'), getObjTransform("orientationPicker_X", 'rotation', 'z'), '', false);
            setObjTransform("rotationManipulator", 'rotation', getObjTransform("orientationPicker_Y", 'rotation', 'x'), getObjTransform("orientationPicker_X", 'rotation', 'z'), '', false);
        }

        function dragMove(objSelector, mode, blockId, parentDragOverBlockId) {
            var camera = appInstance.getCamera();
            if (!camera)
                return;

            if (!_pGlob.objDragOverInfoByBlock)
                return;

            var objNames = retrieveObjectNames(objSelector);

            var info = _pGlob.objDragOverInfoByBlock[parentDragOverBlockId];
            if (!info) return;

            var draggedObj = getObjectByName(info.draggedObjName);
            if (!draggedObj) return;

            if (!(blockId in _pGlob.dragMoveOrigins)) {
                _pGlob.dragMoveOrigins[blockId] = [];
            }
            var posOrigins = _pGlob.dragMoveOrigins[blockId];
            var lenDiff = objNames.length - posOrigins.length;
            for (var i = 0; i < lenDiff; i++) {
                posOrigins.push(new v3d.Vector3());
            }

            for (var i = 0; i < objNames.length; i++) {
                var obj = getObjectByName(objNames[i]);
                if (!obj) {
                    continue;
                }
                var posOrigin = posOrigins[i];

                if (!info.isMoved) {
                    posOrigin.copy(obj.position);
                }
                var coordSystem = getCoordSystem();

                if (mode == "X" || mode == "Y" || mode == "Z") {
                    if (coordSystem == 'Z_UP_RIGHT') {
                        var axis = mode == "X" ? _pGlob.AXIS_X : (mode == "Y" ? _pGlob.AXIS_Z : _pGlob.AXIS_Y);
                        var coord = mode == "X" ? "x" : (mode == "Y" ? "z" : "y");
                    } else {
                        var axis = mode == "X" ? _pGlob.AXIS_X : (mode == "Y" ? _pGlob.AXIS_Y : _pGlob.AXIS_Z);
                        var coord = mode == "X" ? "x" : (mode == "Y" ? "y" : "z");
                    }
                    var planeNor = camera.getWorldDirection(_pGlob.vec3Tmp);
                    planeNor.cross(axis).cross(axis);
                    var plane = _pGlob.planeTmp.setFromNormalAndCoplanarPoint(planeNor, draggedObj.position);

                    var p0 = intersectPlaneCSS(plane, info.downX, info.downY, _pGlob.vec3Tmp);
                    var p1 = intersectPlaneCSS(plane, info.currX, info.currY, _pGlob.vec3Tmp2);
                    if (p0 && p1) {
                        obj.position[coord] = posOrigin[coord] + p1[coord] - p0[coord];
                    }
                } else if (mode == "XY" || mode == "XZ" || mode == "YZ") {
                    if (coordSystem == 'Z_UP_RIGHT') {
                        var normal = mode == "XY" ? _pGlob.AXIS_Y : (mode == "XZ" ? _pGlob.AXIS_Z : _pGlob.AXIS_X);
                        var coord0 = mode == "XY" ? "x" : (mode == "XZ" ? "x" : "y");
                        var coord1 = mode == "XY" ? "z" : (mode == "XZ" ? "y" : "z");
                    } else {
                        var normal = mode == "XY" ? _pGlob.AXIS_Z : (mode == "XZ" ? _pGlob.AXIS_Y : _pGlob.AXIS_X);
                        var coord0 = mode == "XY" ? "x" : (mode == "XZ" ? "x" : "y");
                        var coord1 = mode == "XY" ? "y" : (mode == "XZ" ? "z" : "z");
                    }

                    var plane = _pGlob.planeTmp.setFromNormalAndCoplanarPoint(normal, draggedObj.position);

                    var p0 = intersectPlaneCSS(plane, info.downX, info.downY, _pGlob.vec3Tmp);
                    var p1 = intersectPlaneCSS(plane, info.currX, info.currY, _pGlob.vec3Tmp2);
                    if (p0 && p1) {
                        obj.position[coord0] = posOrigin[coord0] + p1[coord0] - p0[coord0];
                        obj.position[coord1] = posOrigin[coord1] + p1[coord1] - p0[coord1];
                    }
                } else if (mode == "XYZ") {
                    var planeNor = camera.getWorldDirection(_pGlob.vec3Tmp);
                    var plane = _pGlob.planeTmp.setFromNormalAndCoplanarPoint(planeNor, draggedObj.position);

                    var p0 = intersectPlaneCSS(plane, info.downX, info.downY, _pGlob.vec3Tmp);
                    var p1 = intersectPlaneCSS(plane, info.currX, info.currY, _pGlob.vec3Tmp2);
                    if (p0 && p1) {
                        obj.position.addVectors(posOrigin, p1).sub(p0);
                    }
                }
                obj.updateMatrixWorld(true);
            }
        }

        function dragRotate(objSelector, mode, isParentSpace, blockId, parentDragOverBlockId) {
            var camera = appInstance.getCamera(true);
            if (!camera)
                return;

            if (!_pGlob.objDragOverInfoByBlock)
                return;

            var objNames = retrieveObjectNames(objSelector);

            var info = _pGlob.objDragOverInfoByBlock[parentDragOverBlockId];
            if (!info) return;

            var coordSystem = getCoordSystem();

            for (var i = 0; i < objNames.length; i++) {
                var obj = getObjectByName(objNames[i]);
                if (!obj) {
                    continue;
                }
                if (mode == "X" || mode == "Y" || mode == "Z") {
                    var objPos = obj.getWorldPosition(_pGlob.vec3Tmp);
                    objPos.project(camera);

                    var objX = (objPos.x + 1) / 2 * appInstance.getWidth();
                    var objY = (-objPos.y + 1) / 2 * appInstance.getHeight();
                    var vecFrom = _pGlob.vec2Tmp.set(info.prevX - objX, objY - info.prevY);
                    var vecTo = _pGlob.vec2Tmp2.set(info.currX - objX, objY - info.currY);

                    if (coordSystem == 'Z_UP_RIGHT')
                        var axis = _pGlob.vec3Tmp.copy(mode == "X" ? _pGlob.AXIS_X
                            : (mode == "Y" ? _pGlob.AXIS_Z : _pGlob.AXIS_Y));
                    else
                        var axis = _pGlob.vec3Tmp.copy(mode == "X" ? _pGlob.AXIS_X
                            : (mode == "Y" ? _pGlob.AXIS_Y : _pGlob.AXIS_Z));

                    var quat = _pGlob.quatTmp.setFromAxisAngle(axis, vecTo.angle() - vecFrom.angle());
                    var objToCalcSpace = isParentSpace && obj.parent ? obj.parent : obj;
                    axis.applyQuaternion(objToCalcSpace.getWorldQuaternion(_pGlob.quatTmp2));

                    var viewVec = camera.getWorldDirection(_pGlob.vec3Tmp2);
                    if (viewVec.dot(axis) > 0) {
                        quat.conjugate();
                    }
                    if (isParentSpace) {
                        obj.quaternion.premultiply(quat);
                    } else {
                        obj.quaternion.multiply(quat);
                    }
                    obj.updateMatrixWorld(true);
                }
            }
        }

        function intersectPlaneCSS(plane, cssX, cssY, dest) {
            var coords = _pGlob.vec2Tmp;
            var rc = _pGlob.raycasterTmp;
            coords.x = (cssX / appInstance.getWidth()) * 2 - 1;
            coords.y = - (cssY / appInstance.getHeight()) * 2 + 1;
            rc.setFromCamera(coords, appInstance.getCamera(true));
            return rc.ray.intersectPlane(plane, dest);
        }

        function getCoordSystem() {
            var scene = appInstance.scene;

            if (scene && "v3d" in scene.userData && "coordSystem" in scene.userData.v3d) {
                return scene.userData.v3d.coordSystem;
            } else {
                return 'Z_UP_RIGHT';
            }
        }

        var _Group = function () { this._tweens = {}, this._tweensAddedDuringUpdate = {} }; _Group.prototype = {
            getAll: function () { return Object.keys(this._tweens).map(function (t) { return this._tweens[t] }.bind(this)) }, removeAll: function () { this._tweens = {} }, add: function (t) { this._tweens[t.getId()] = t, this._tweensAddedDuringUpdate[t.getId()] = t }, remove: function (t) { delete this._tweens[t.getId()], delete this._tweensAddedDuringUpdate[t.getId()] }, update: function (t, n) {
                var e = Object.keys(this._tweens);
                if (0 === e.length) return !1; for (t = void 0 !== t ? t : TWEEN.now(); 0 < e.length;) { this._tweensAddedDuringUpdate = {}; for (var i = 0; i < e.length; i++) { var r = this._tweens[e[i]]; r && !1 === r.update(t) && (r._isPlaying = !1, n || delete this._tweens[e[i]]) } e = Object.keys(this._tweensAddedDuringUpdate) } return !0
            }
        }; var TWEEN = new _Group; TWEEN.Group = _Group, TWEEN._nextId = 0, TWEEN.nextId = function () { return TWEEN._nextId++ }, "undefined" == typeof window && "undefined" != typeof process && process.hrtime ? TWEEN.now = function () {
            var t = process.hrtime();
            return 1e3 * t[0] + t[1] / 1e6
        } : "undefined" != typeof window && void 0 !== window.performance && void 0 !== window.performance.now ? TWEEN.now = window.performance.now.bind(window.performance) : void 0 !== Date.now ? TWEEN.now = Date.now : TWEEN.now = function () { return (new Date).getTime() }, TWEEN.Tween = function (t, n) {
            this._object = t, this._valuesStart = {}, this._valuesEnd = {}, this._valuesStartRepeat = {}, this._duration = 1e3, this._repeat = 0, this._repeatDelayTime = void 0, this._yoyo = !1, this._isPlaying = !1, this._reversed = !1, this._delayTime = 0,
                this._startTime = null, this._easingFunction = TWEEN.Easing.Linear.None, this._interpolationFunction = TWEEN.Interpolation.Linear, this._chainedTweens = [], this._onStartCallback = null, this._onStartCallbackFired = !1, this._onUpdateCallback = null, this._onCompleteCallback = null, this._onStopCallback = null, this._group = n || TWEEN, this._id = TWEEN.nextId()
        }, TWEEN.Tween.prototype = {
            getId: function () { return this._id }, isPlaying: function () { return this._isPlaying }, to: function (t, n) { return this._valuesEnd = t, void 0 !== n && (this._duration = n), this }, start: function (t) {
                for (var n in this._group.add(this), this._isPlaying = !0, this._onStartCallbackFired = !1, this._startTime = void 0 !== t ? "string" == typeof t ? TWEEN.now() + parseFloat(t) : t : TWEEN.now(), this._startTime += this._delayTime, this._valuesEnd) {
                    if (this._valuesEnd[n] instanceof Array) {
                        if (0 === this._valuesEnd[n].length) continue;
                        this._valuesEnd[n] = [this._object[n]].concat(this._valuesEnd[n])
                    } void 0 !== this._object[n] && (this._valuesStart[n] = this._object[n], this._valuesStart[n] instanceof Array == !1 && (this._valuesStart[n] *= 1), this._valuesStartRepeat[n] = this._valuesStart[n] || 0)
                } return this
            }, stop: function () { return this._isPlaying && (this._group.remove(this), this._isPlaying = !1, null !== this._onStopCallback && this._onStopCallback(this._object), this.stopChainedTweens()), this }, end: function () { return this.update(this._startTime + this._duration), this }, stopChainedTweens: function () {
                for (var t = 0, n = this._chainedTweens.length; t < n;
                    t++)this._chainedTweens[t].stop()
            }, group: function (t) { return this._group = t, this }, delay: function (t) { return this._delayTime = t, this }, repeat: function (t) { return this._repeat = t, this }, repeatDelay: function (t) { return this._repeatDelayTime = t, this }, yoyo: function (t) { return this._yoyo = t, this }, easing: function (t) { return this._easingFunction = t, this }, interpolation: function (t) { return this._interpolationFunction = t, this }, chain: function () { return this._chainedTweens = arguments, this }, onStart: function (t) { return this._onStartCallback = t, this }, onUpdate: function (t) { return this._onUpdateCallback = t, this }, onComplete: function (t) { return this._onCompleteCallback = t, this }, onStop: function (t) { return this._onStopCallback = t, this }, update: function (t) {
                var n, e, i; if (t < this._startTime) return !0;
                for (n in !1 === this._onStartCallbackFired && (null !== this._onStartCallback && this._onStartCallback(this._object), this._onStartCallbackFired = !0), e = (t - this._startTime) / this._duration, e = 0 === this._duration || 1 < e ? 1 : e, i = this._easingFunction(e), this._valuesEnd) if (void 0 !== this._valuesStart[n]) { var r = this._valuesStart[n] || 0, a = this._valuesEnd[n]; a instanceof Array ? this._object[n] = this._interpolationFunction(a, i) : ("string" == typeof a && (a = "+" === a.charAt(0) || "-" === a.charAt(0) ? r + parseFloat(a) : parseFloat(a)), "number" == typeof a && (this._object[n] = r + (a - r) * i)) } if (null !== this._onUpdateCallback && this._onUpdateCallback(this._object), 1 !== e) return !0;
                if (0 < this._repeat) { for (n in isFinite(this._repeat) && this._repeat--, this._valuesStartRepeat) { if ("string" == typeof this._valuesEnd[n] && (this._valuesStartRepeat[n] = this._valuesStartRepeat[n] + parseFloat(this._valuesEnd[n])), this._yoyo) { var s = this._valuesStartRepeat[n]; this._valuesStartRepeat[n] = this._valuesEnd[n], this._valuesEnd[n] = s } this._valuesStart[n] = this._valuesStartRepeat[n] } return this._yoyo && (this._reversed = !this._reversed), void 0 !== this._repeatDelayTime ? this._startTime = t + this._repeatDelayTime : this._startTime = t + this._delayTime, !0 } null !== this._onCompleteCallback && this._onCompleteCallback(this._object); for (var o = 0, u = this._chainedTweens.length; o < u; o++)this._chainedTweens[o].start(this._startTime + this._duration);
                return !1
            }
        }, TWEEN.Easing = {
            Linear: { None: function (t) { return t } }, Quadratic: { In: function (t) { return t * t }, Out: function (t) { return t * (2 - t) }, InOut: function (t) { return (t *= 2) < 1 ? .5 * t * t : -.5 * (--t * (t - 2) - 1) } }, Cubic: { In: function (t) { return t * t * t }, Out: function (t) { return --t * t * t + 1 }, InOut: function (t) { return (t *= 2) < 1 ? .5 * t * t * t : .5 * ((t -= 2) * t * t + 2) } }, Quartic: { In: function (t) { return t * t * t * t }, Out: function (t) { return 1 - --t * t * t * t }, InOut: function (t) { return (t *= 2) < 1 ? .5 * t * t * t * t : -.5 * ((t -= 2) * t * t * t - 2) } }, Quintic: { In: function (t) { return t * t * t * t * t }, Out: function (t) { return --t * t * t * t * t + 1 }, InOut: function (t) { return (t *= 2) < 1 ? .5 * t * t * t * t * t : .5 * ((t -= 2) * t * t * t * t + 2) } }, Sinusoidal: { In: function (t) { return 1 - Math.cos(t * Math.PI / 2) }, Out: function (t) { return Math.sin(t * Math.PI / 2) }, InOut: function (t) { return .5 * (1 - Math.cos(Math.PI * t)) } }, Exponential: {
                In: function (t) { return 0 === t ? 0 : Math.pow(1024, t - 1) }, Out: function (t) { return 1 === t ? 1 : 1 - Math.pow(2, -10 * t) },
                InOut: function (t) { return 0 === t ? 0 : 1 === t ? 1 : (t *= 2) < 1 ? .5 * Math.pow(1024, t - 1) : .5 * (2 - Math.pow(2, -10 * (t - 1))) }
            }, Circular: { In: function (t) { return 1 - Math.sqrt(1 - t * t) }, Out: function (t) { return Math.sqrt(1 - --t * t) }, InOut: function (t) { return (t *= 2) < 1 ? -.5 * (Math.sqrt(1 - t * t) - 1) : .5 * (Math.sqrt(1 - (t -= 2) * t) + 1) } }, Elastic: { In: function (t) { return 0 === t ? 0 : 1 === t ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin(5 * (t - 1.1) * Math.PI) }, Out: function (t) { return 0 === t ? 0 : 1 === t ? 1 : Math.pow(2, -10 * t) * Math.sin(5 * (t - .1) * Math.PI) + 1 }, InOut: function (t) { return 0 === t ? 0 : 1 === t ? 1 : (t *= 2) < 1 ? -.5 * Math.pow(2, 10 * (t - 1)) * Math.sin(5 * (t - 1.1) * Math.PI) : .5 * Math.pow(2, -10 * (t - 1)) * Math.sin(5 * (t - 1.1) * Math.PI) + 1 } }, Back: {
                In: function (t) { return t * t * (2.70158 * t - 1.70158) }, Out: function (t) { return --t * t * (2.70158 * t + 1.70158) + 1 }, InOut: function (t) {
                    var n = 2.5949095;
                    return (t *= 2) < 1 ? t * t * ((n + 1) * t - n) * .5 : .5 * ((t -= 2) * t * ((n + 1) * t + n) + 2)
                }
            }, Bounce: { In: function (t) { return 1 - TWEEN.Easing.Bounce.Out(1 - t) }, Out: function (t) { return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375 }, InOut: function (t) { return t < .5 ? .5 * TWEEN.Easing.Bounce.In(2 * t) : .5 * TWEEN.Easing.Bounce.Out(2 * t - 1) + .5 } }
        }, TWEEN.Interpolation = {
            Linear: function (t, n) { var e = t.length - 1, i = e * n, r = Math.floor(i), a = TWEEN.Interpolation.Utils.Linear; return n < 0 ? a(t[0], t[1], i) : 1 < n ? a(t[e], t[e - 1], e - i) : a(t[r], t[e < r + 1 ? e : r + 1], i - r) }, Bezier: function (t, n) { for (var e = 0, i = t.length - 1, r = Math.pow, a = TWEEN.Interpolation.Utils.Bernstein, s = 0; s <= i; s++)e += r(1 - n, i - s) * r(n, s) * t[s] * a(i, s); return e }, CatmullRom: function (t, n) {
                var e = t.length - 1, i = e * n, r = Math.floor(i), a = TWEEN.Interpolation.Utils.CatmullRom;
                return t[0] === t[e] ? (n < 0 && (r = Math.floor(i = e * (1 + n))), a(t[(r - 1 + e) % e], t[r], t[(r + 1) % e], t[(r + 2) % e], i - r)) : n < 0 ? t[0] - (a(t[0], t[0], t[1], t[1], -i) - t[0]) : 1 < n ? t[e] - (a(t[e], t[e], t[e - 1], t[e - 1], i - e) - t[e]) : a(t[r ? r - 1 : 0], t[r], t[e < r + 1 ? e : r + 1], t[e < r + 2 ? e : r + 2], i - r)
            }, Utils: { Linear: function (t, n, e) { return (n - t) * e + t }, Bernstein: function (t, n) { var e = TWEEN.Interpolation.Utils.Factorial; return e(t) / e(n) / e(t - n) }, Factorial: function () { var i = [1]; return function (t) { var n = 1; if (i[t]) return i[t]; for (var e = t; 1 < e; e--)n *= e; return i[t] = n } }(), CatmullRom: function (t, n, e, i, r) { var a = .5 * (e - t), s = .5 * (i - n), o = r * r; return (2 * n - 2 * e + a + s) * (r * o) + (-3 * n + 3 * e - 2 * a - s) * o + a * r + n } }
        }, function (t) { "function" == typeof define && define.amd ? define([], function () { return TWEEN }) : "undefined" != typeof module && "object" == typeof exports ? module.exports = TWEEN : void 0 !== t && (t.TWEEN = TWEEN) }(this);

        function tweenUpdateCb() {
            TWEEN.update();
        }
        appInstance.renderCallbacks.push(tweenUpdateCb);
        if (v3d.PL.editorRenderCallbacks)
            v3d.PL.editorRenderCallbacks.push([appInstance, tweenUpdateCb]);

        _pGlob.animateParamUpdate = 0;

        function animateParam(from, to, duration, easing, easing2, repeat, yoyo, on_update, when_finished) {
            var mode = easing == "Linear" ?
                TWEEN.Easing.Linear.None : TWEEN.Easing[easing][easing2];

            var tweenObject = (typeof from != "number");

            if (!tweenObject) {
                from = [from];
                to = [to];
            }

            var tween = new TWEEN.Tween(from)
                .to(to, duration * 1000)
                .easing(mode)
                .repeat(repeat)
                .yoyo(yoyo)
                .onUpdate(function (object) {
                    if (tweenObject)
                        _pGlob.animateParamUpdate = object;
                    else
                        _pGlob.animateParamUpdate = object[0];
                    on_update();
                })
                .onComplete(function (object) {
                    when_finished();
                })
                .start();
        }

        function whenMoved(objNames, delta, period, cb_start, cb_move, cb_stop) {
            objNames = retrieveObjectNames(objNames);
            if (!objNames)
                return;

            function savePreviousCoords(objName, obj, prevIsMoving, frameCounter) {
                if (_pGlob.objMovementInfos[objName]) {
                    var info = _pGlob.objMovementInfos[objName];

                    info.prevPosX = obj.position.x;
                    info.prevPosY = obj.position.y;
                    info.prevPosZ = obj.position.z;
                    info.prevRotX = obj.rotation.x;
                    info.prevRotY = obj.rotation.y;
                    info.prevRotZ = obj.rotation.z;
                    info.prevScaX = obj.scale.x;
                    info.prevScaY = obj.scale.y;
                    info.prevScaZ = obj.scale.z;
                    info.prevIsMoving = prevIsMoving;
                    info.frameCounter = frameCounter;
                } else {
                    var info = {
                        prevPosX: obj.position.x,
                        prevPosY: obj.position.y,
                        prevPosZ: obj.position.z,
                        prevRotX: obj.rotation.x,
                        prevRotY: obj.rotation.y,
                        prevRotZ: obj.rotation.z,
                        prevScaX: obj.scale.x,
                        prevScaY: obj.scale.y,
                        prevScaZ: obj.scale.z,
                        prevIsMoving: prevIsMoving,
                        frameCounter: frameCounter
                    };
                    _pGlob.objMovementInfos[objName] = info;
                }
                return info;
            }

            function checkMoving(objName, obj) {
                var info = _pGlob.objMovementInfos[objName] ||
                    savePreviousCoords(objName, obj, false, -1);

                info.frameCounter = info.frameCounter + 1;

                if ((info.frameCounter % period) != 0)
                    return;

                //if ((info.frameCounter % 10) == 0)
                cameraZAngle = parseInt(appInstance.controls.getAzimuthalAngle() * 180 / 3.14 + 180);
                //cameraZAngle = parseInt(appInstance.controls.getAzimuthalAngle() * 180 / Math.PI + 180, 10);

                var isMoving =
                    Math.abs(obj.position.x - info.prevPosX) > delta ||
                    Math.abs(obj.position.y - info.prevPosY) > delta ||
                    Math.abs(obj.position.z - info.prevPosZ) > delta ||
                    Math.abs(obj.rotation.x - info.prevRotX) > delta ||
                    Math.abs(obj.rotation.y - info.prevRotY) > delta ||
                    Math.abs(obj.rotation.z - info.prevRotZ) > delta ||
                    Math.abs(obj.scale.x - info.prevScaX) > delta ||
                    Math.abs(obj.scale.y - info.prevScaY) > delta ||
                    Math.abs(obj.scale.z - info.prevScaZ) > delta;

                if (!info.prevIsMoving && (isMoving || checkRenderState())) {
                    setScreenScale(0);
                    cb_start();
                    isPrevTweening = checkRenderState();
                    savePreviousCoords(objName, obj, true, info.frameCounter);
                } else if (info.prevIsMoving && (isMoving || checkRenderState())) {
                    cb_move();
                    isPrevTweening = checkRenderState();
                    savePreviousCoords(objName, obj, true, info.frameCounter);

                    if (cameraZAngle != cameraZAngleOld) {
                        enableMeasurements(true);

                        updateMotorRotation();
                        cameraZAngleOld = cameraZAngle;
                    }
                } else if ((info.prevIsMoving || isPrevTweening) && !isMoving && !checkRenderState()) {
                    cb_stop();
                    isPrevTweening = checkRenderState();
                    savePreviousCoords(objName, obj, false, info.frameCounter);
                } else {
                    setScreenScale(1);
                    isPrevTweening = checkRenderState();
                    savePreviousCoords(objName, obj, false, info.frameCounter);
                }
            }

            function checkRenderState() {
                return isTweeningAnimations.some(function (state) { return state; }) || isTweeningColors.some(function (state) { return state; }) || isHovered || continousRender || frameRequested[0] || frameRequested[1];
            }

            function addToRender(objName) {
                var obj = getObjectByName(objName);
                if (!obj)
                    return;

                appInstance.renderCallbacks.push(function () { checkMoving(objName, obj); });
            }

            for (var i = 0; i < objNames.length; i++) {
                var objName = objNames[i];
                if (!objName)
                    continue;
                addToRender(objName);
            }
        }

        function getAllObjectNames() {
            var objNameList = [];
            appInstance.scene.traverse(function (obj) {
                if (notIgnoredObj(obj))
                    objNameList.push(obj.name)
            });
            return objNameList;
        }

        function getObjectNamesByGroupName(targetGroupName) {
            var objNameList = [];
            appInstance.scene.traverse(function (obj) {
                if (notIgnoredObj(obj)) {
                    var groupNames = obj.groupNames;
                    if (!groupNames)
                        return;
                    for (var i = 0; i < groupNames.length; i++) {
                        var groupName = groupNames[i];
                        if (groupName == targetGroupName) {
                            objNameList.push(obj.name);
                        }
                    }
                }
            });
            return objNameList;
        }

        function retrieveObjectNames(objNames) {
            var acc = [];
            retrieveObjectNamesAcc(objNames, acc);
            return acc;
        }

        function retrieveObjectNamesAcc(currObjNames, acc) {
            if (typeof currObjNames == "string") {
                acc.push(currObjNames);
            } else if (Array.isArray(currObjNames) && currObjNames[0] == "GROUP") {
                var newObj = getObjectNamesByGroupName(currObjNames[1]);
                for (var i = 0; i < newObj.length; i++)
                    acc.push(newObj[i]);
            } else if (Array.isArray(currObjNames) && currObjNames[0] == "ALL_OBJECTS") {
                var newObj = getAllObjectNames();
                for (var i = 0; i < newObj.length; i++)
                    acc.push(newObj[i]);
            } else if (Array.isArray(currObjNames)) {
                for (var i = 0; i < currObjNames.length; i++)
                    retrieveObjectNamesAcc(currObjNames[i], acc);
            }
        }

        function setMorphFactor(objName, targetName, factor) {
            if (objName && targetName) {
                var obj = getObjectByName(objName);
                if (obj) {
                    obj.resolveMultiMaterial().forEach(function (objR) {
                        if (objR.morphTargetDictionary && targetName in objR.morphTargetDictionary) {
                            var idx = objR.morphTargetDictionary[targetName];
                            objR.morphTargetInfluences[idx] = Number(factor);
                        }
                    });
                }
            }
        }

        function getObjTransform(objName, mode, coord) {
            if (!objName)
                return;
            var obj = getObjectByName(objName);
            if (!obj)
                return;
            if (mode === "rotation")
                return swizzleValueSign(coord, obj[mode][coord] * 180 / Math.PI);
            else
                return swizzleValueSign(coord, obj[mode][coord]);
        }

        function swizzleValueSign(newAxis, value) {
            newAxis = newAxis.toLowerCase();

            if (newAxis === 'z') {
                if (typeof value == 'number')
                    return -value
                else if (typeof value == 'string' && value !== '' && value !== "''" && value !== '""')
                    return String(-Number(value));
                else
                    return value;
            } else
                return value;
        }

        function swizzleVec3(vec) {
            var dest = [];
            dest[0] = vec[0];
            dest[1] = vec[2];
            dest[2] = swizzleValueSign('z', vec[1])
            return dest;
        }

        function setObjTransform(objNames, mode, x, y, z, offset) {
            objNames = retrieveObjectNames(objNames);
            if (!objNames) return;

            function setObjProp(obj, prop, val) {
                if (typeof val != "number")
                    return;
                if (mode === "rotation")
                    val = val * Math.PI / 180;
                if (!offset) {
                    obj[mode][prop] = val;
                } else {
                    if (mode !== "scale")
                        obj[mode][prop] += val;
                    else
                        obj[mode][prop] *= val;
                }
            }
            var inVec = swizzleVec3([x, y, z]);
            x = inVec[0];
            y = inVec[1];
            z = inVec[2];

            for (var i = 0; i < objNames.length; i++) {
                var objName = objNames[i];
                if (!objName) continue;

                var obj = getObjectByName(objName);
                if (!obj) continue;

                setObjProp(obj, "x", x);
                setObjProp(obj, "y", y);
                setObjProp(obj, "z", z);

                obj.updateMatrixWorld(true);
            }
        }

        function findUniqueObjectName(name, warning) {
            function objNameUsed(name) {
                return Boolean(getObjectByName(name));
            }
            while (objNameUsed(name)) {
                var r = name.match(/^(.*?)(\d+)$/);
                if (!r) {
                    name += "2";
                } else {
                    name = r[1] + (parseInt(r[2], 10) + 1);
                }
            }
            if (r[2] > warning)
                console.log("Object clone count over warning for " + name + " value:" + warning);
            return name;
        }

        /* function cloneObject(objName, warning) {
            if (!objName)
                return;
            var obj = getObjectByName(objName);
            if (!obj)
                return;
            var newObj = obj.clone();
            newObj.name = findUniqueObjectName(obj.name, warning);
            appInstance.scene.add(newObj);
            return newObj.name;
        } */

        function generateUniqueName(name, isUniqueCb, warning) {
            let uniqueName = name;

            if (isUniqueCb !== undefined) {
                while (!isUniqueCb(uniqueName)) {
                    const r = uniqueName.match(/^(.*?)(\d+)$/);

                    if (!r)
                        uniqueName += '2';
                    else
                        uniqueName = r[1] + (Number.parseInt(r[2], 10) + 1);

                    if (r[2] > warning)
                        console.log("Object clone count over warning for " + name + " value:" + warning + "(Current clone amount:" + r[2] + ")");
                }
            }
            return uniqueName;
        }

        function generateUniqueObjectName(name, warning) {
            return generateUniqueName(name, name => !Boolean(getObjectByName(name)), warning);
        }


        function cloneObject(objName, warning, cloneMaterials, preserveGroups) {
            if (!objName)
                return;
            const obj = getObjectByName(objName);
            if (!obj)
                return;

            const objNew = obj.clone();
            objNew.name = generateUniqueObjectName(obj.name, warning);

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
            return objNew.name;
        }

        function appendScene(url, sceneName, loadCameras, loadLights, loadCb, progCb, errorCb) {
            _pGlob.percentage = 0;
            appInstance.appendScene(url, function (loadedScene) {
                loadedScene.name = sceneName;
                _pGlob.percentage = 100;
                loadCb();
            }, function (percentage) {
                _pGlob.percentage = percentage;
                progCb();
            }, errorCb, loadCameras, loadLights);
        }

        function updateTextObj(objSelector, text) {
            var objNames = retrieveObjectNames(objSelector);

            for (var i = 0; i < objNames.length; i++) {
                var objName = objNames[i];
                if (!objName) continue;
                var obj = getObjectByName(objName);
                if (!obj || !obj.geometry || !obj.geometry.cloneWithText)
                    continue;
                obj.geometry = obj.geometry.cloneWithText(String(text));
            }
        }

        function tweenCamera(posObjName, targetObjName, duration, doSlot) {
            let posObj;
            if (!targetObjName)
                return;
            if (posObjName)
                posObj = getObjectByName(posObjName);
            else
                posObj = appInstance.camera;
            var targetObj = getObjectByName(targetObjName);
            if (!posObj || !targetObj)
                return;

            var wPos = posObj.getWorldPosition(_pGlob.vec3Tmp);
            var wTarget = targetObj.getWorldPosition(_pGlob.vec3Tmp2);

            if (appInstance.controls && appInstance.controls.tween) {
                if (!appInstance.controls.inTween)
                    appInstance.controls.tween(wPos, wTarget, duration, doSlot);
            } else {
                if (appInstance.camera.parent)
                    appInstance.camera.parent.worldToLocal(wPos);
                appInstance.camera.position.copy(wPos);
                appInstance.camera.lookAt(wTarget);
                doSlot();
            }
        }

        function zoomCamera(objSelector, duration, doSlot) {
            duration = Math.max(0, duration);
            const objNames = retrieveObjectNames(objSelector);

            const zoomObjects = [];
            objNames.forEach(function (name) {
                const obj = getObjectByName(name);
                if (obj)
                    zoomObjects.push(obj);
            });

            // No fit target in the scene -> skip framing, but never block the caller.
            if (!zoomObjects.length) {
                if (doSlot) doSlot();
                return;
            }

            const camera = appInstance.getCamera();
            const zoom = [camera.zoom];
            const pos = _pGlob.vec3Tmp, target = _pGlob.vec3Tmp2;
            v3d.CameraUtils.calcCameraZoomToObjectsParams(camera, zoomObjects, pos, target, zoom);

            if (appInstance.controls && appInstance.controls.tween) {
                if (!appInstance.controls.inTween) {
                    if (camera.isOrthographicCamera)
                        appInstance.controls.tweenZoomTo(target, zoom[0], duration, doSlot);
                    else
                        appInstance.controls.tween(pos, target, duration, doSlot);
                } else if (doSlot) {
                    doSlot();
                }
            } else {
                if (camera.parent)
                    camera.parent.worldToLocal(pos);
                camera.position.copy(pos);
                camera.lookAt(target);
                camera.zoom = zoom[0];
                camera.updateProjectionMatrix();
                if (doSlot) doSlot();
            }
        }

        function initObjectPicking(callback, eventType, mouseDownUseTouchStart, mouseButtons) {
            var elem = appInstance.renderer.domElement;
            elem.addEventListener(eventType, pickListener);
            if (eventType == 'mousedown') {
                var touchEventName = mouseDownUseTouchStart ? 'touchstart' : 'touchend';
                elem.addEventListener(touchEventName, pickListener);
            } else if (eventType == 'dblclick') {
                var prevTapTime = 0;
                function doubleTapCallback(event) {
                    var now = new Date().getTime();
                    var timesince = now - prevTapTime;

                    if (timesince < 600 && timesince > 0) {
                        pickListener(event);
                        prevTapTime = 0;
                        return;
                    }
                    prevTapTime = new Date().getTime();
                }
                var touchEventName = mouseDownUseTouchStart ? 'touchstart' : 'touchend';
                elem.addEventListener(touchEventName, doubleTapCallback);
            }
            var raycaster = new v3d.Raycaster();
            function pickListener(event) {
                event.preventDefault();
                var xNorm = 0, yNorm = 0;
                if (event instanceof MouseEvent) {
                    if (mouseButtons && mouseButtons.indexOf(event.button) == -1)
                        return;
                    xNorm = event.offsetX / elem.clientWidth;
                    yNorm = event.offsetY / elem.clientHeight;
                } else if (event instanceof TouchEvent) {
                    var rect = elem.getBoundingClientRect();
                    xNorm = (event.changedTouches[0].clientX - rect.left) / rect.width;
                    yNorm = (event.changedTouches[0].clientY - rect.top) / rect.height;
                }
                _pGlob.screenCoords.x = xNorm * 2 - 1;
                _pGlob.screenCoords.y = -yNorm * 2 + 1;
                raycaster.setFromCamera(_pGlob.screenCoords, appInstance.camera);
                var objList = [];
                appInstance.scene.traverse(function (obj) { objList.push(obj); });
                var intersects = raycaster.intersectObjects(objList);
                callback(intersects, event);
            }
        }

        function registerSetTimeout(timeout, callback) {
            window.setTimeout(callback, 1000 * timeout);
        }

        function objectsIncludeObj(objNames, testedObjName) {
            if (!testedObjName) return false;
            for (var i = 0; i < objNames.length; i++) {
                if (testedObjName == objNames[i]) {
                    return true;
                } else {
                    var obj = getObjectByName(objNames[i]);
                    if (obj && obj.type == "Group") {
                        for (var j = 0; j < obj.children.length; j++) {
                            if (testedObjName == obj.children[j].name) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }

        function getPickedObjectName(obj) {
            if (obj.isMesh && obj.isMaterialGeneratedMesh && obj.parent) {
                return obj.parent.name;
            } else {
                return obj.name;
            }
        }

        /* function registerOnClick(objNames, xRay, doubleClick, mouseButtons, cbDo, cbIfMissedDo) {
            objNames = retrieveObjectNames(objNames) || [];
            var objNamesFiltered = objNames.filter(function (name) {
                return name;
            });
            _pGlob.objClickInfo.push({
                objNames: objNamesFiltered,
                callbacks: [cbDo, cbIfMissedDo]
            });
            initObjectPicking(function (intersects, event) {
                var isPicked = false;
                var maxIntersects = xRay ? intersects.length : Math.min(1, intersects.length);
                for (var i = 0; i < maxIntersects; i++) {
                    var obj = intersects[i].object;
                    var objName = getPickedObjectName(obj);
                    if (objectsIncludeObj(objNamesFiltered, objName)) {
                        _pGlob.pickedObject = objName;
                        isPicked = true;
                        cbDo(event);
                    }
                }
                if (!isPicked) {
                    _pGlob.pickedObject = '';
                    cbIfMissedDo(event);
                }
            }, doubleClick ? 'dblclick' : 'mousedown', false, mouseButtons);
        } */

        function registerOnClick(objSelector, xRay, doubleClick, mouseButtons, cbDo, cbIfMissedDo) {
            _pGlob.objClickInfo = _pGlob.objClickInfo || [];
            _pGlob.objClickInfo.push({
                objSelector: objSelector,
                xRay: xRay,
                doubleClick: doubleClick,
                mouseButtons: mouseButtons,
                callbacks: [cbDo, cbIfMissedDo]
            });
        }

        if (!sceneIsInitialized) {
            // We create a helper to process the clicks globally
            function processClicks(intersects, event, clickType) {
                _pGlob.objClickInfo.forEach(function (info) {
                    // Only process if the click type matches (e.g., 'dblclick' vs 'mousedown')
                    var isDoubleClick = (clickType === 'dblclick');
                    if (!!info.doubleClick !== isDoubleClick) return;

                    var maxIntersects = info.xRay ? intersects.length : Math.min(1, intersects.length);
                    for (var i = 0; i < maxIntersects; i++) {
                        var obj = intersects[i].object;
                        var objName = getPickedObjectName(obj);
                        var objNames = retrieveObjectNames(info.objSelector);

                        if (objectsIncludeObj(objNames, objName)) {
                            _pGlob.pickedObject = objName;
                            info.callbacks[0](event);
                        }
                    }
                });
            }

            // Initialize once for mouse down
            initObjectPicking(function (intersects, event) {
                processClicks(intersects, event, 'mousedown');
            }, 'mousedown', false, [2/* , 1, 2 */]); // Adjust buttons as needed

            // Initialize once for double click
            initObjectPicking(function (intersects, event) {
                processClicks(intersects, event, 'dblclick');
            }, 'dblclick', false, [2]);
        }

        function getObjectMaterial(objSelector, matIndex, useID) {
            const objNames = retrieveObjectNames(objSelector);
            for (let i = 0; i < objNames.length; i++) {
                const objName = objNames[i]
                if (!objName)
                    continue;
                let obj = getObjectByName(objName);
                if (!obj)
                    continue;
                const objsM = obj.resolveMultiMaterial();
                if (Number.isInteger(matIndex)) {
                    if (matIndex >= 1 && matIndex <= objsM.length) {
                        obj = objsM[matIndex - 1];
                    } else {
                        console.error('get object material: invalid material index ' + matIndex);
                        continue;
                    }
                } else {
                    obj = objsM[0];
                }
                if (obj.material) {
                    // COMPAT: <4.9.0, old engine, new puzzles, see getMaterialByName()
                    if (useID && v3d.MathUtils.checkUUID)
                        return obj.material.uuid;
                    else
                        return obj.material.name;
                } else {
                    console.error('get object material: invalid object ' + obj.name);
                }
            }
            return '';
        }

        function setMaterialValue(matName, valName, value) {
            var colors = matGetValues(matName);
            if (colors.indexOf(valName) < 0) return;
            var mats = v3d.SceneUtils.getMaterialsByName(appInstance, matName);
            for (var i = 0; i < mats.length; i++) {
                var mat = mats[i];
                if (mat.isMeshNodeMaterial) {
                    var valIdx = mat.nodeValueMap[valName];
                    mat.nodeValue[valIdx] = value;
                } else
                    mat[valName] = value;
                if (mat === appInstance.worldMaterial)
                    appInstance.updateEnvironment(mat);
            }
        }

        function matGetValues(matName) {
            var mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
            if (!mat) return [];
            if (mat.isMeshNodeMaterial)
                return Object.keys(mat.nodeValueMap);
            else if (mat.isMeshStandardMaterial)
                return ['metalness', 'roughness', 'bumpScale', 'emissiveIntensity', 'envMapIntensity'];
            else
                return []
        }

        function matGetColors(matName) {
            var mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
            if (!mat)
                return [];
            if (mat.isMeshNodeMaterial)
                return Object.keys(mat.nodeRGBMap);
            else if (mat.isMeshStandardMaterial)
                return ['color', 'emissive'];
            else
                return [];
        }

        function setMaterialColor(matName, colName, r, g, b, cssCode) {
            var colors = matGetColors(matName);
            if (colors.indexOf(colName) < 0)
                return;
            if (cssCode) {
                var color = new v3d.Color(cssCode);
                r = color.r;
                g = color.g;
                b = color.b;
            }
            var mats = v3d.SceneUtils.getMaterialsByName(appInstance, matName);
            for (var i = 0; i < mats.length; i++) {
                var mat = mats[i];
                if (mat.isMeshNodeMaterial) {
                    var rgbIdx = mat.nodeRGBMap[colName];
                    mat.nodeRGB[rgbIdx].x = r;
                    mat.nodeRGB[rgbIdx].y = g;
                    mat.nodeRGB[rgbIdx].z = b;
                } else {
                    mat[colName].r = r;
                    mat[colName].g = g;
                    mat[colName].b = b;
                }
                mat.needsUpdate = true;
                if (appInstance.scene !== null) {
                    if (mat === appInstance.scene.worldMaterial) {
                        appInstance.updateEnvironment(mat);
                    }
                }
            }
        }

        function downloadFile(contents, filename) {
            if (!filename)
                return;
            if (contents instanceof Promise) {
                contents.then(function (response) {
                    doDownload(response, filename);
                }, function (error) { });
            } else {
                doDownload(contents, filename);
            }
            function doDownload(contents, filename) {
                var link = document.createElement('a');
                link.href = contents;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
            }
        }

        function assignMat(objNames, matName) {
            objNames = retrieveObjectNames(objNames);
            if (!objNames || !matName)
                return;
            var mat = v3d.SceneUtils.getMaterialByName(appInstance, matName);
            if (!mat)
                return;
            for (let i = 0; i < objNames.length; i++) {
                var objName = objNames[i];
                if (!objName)
                    continue;
                var obj = getObjectByName(objName);
                if (obj)
                    obj.material = mat;
            }
        }

        function getJSFunction(funcName) {
            var jsFunc = appInstance.ExternalInterface[funcName];
            if (typeof jsFunc == "function")
                return jsFunc;
            else
                return function () { };
        }

        function changeVis(objNames, bool) {
            objNames = retrieveObjectNames(objNames);
            if (!objNames)
                return;
            for (var i = 0; i < objNames.length; i++) {
                var objName = objNames[i]
                if (!objName)
                    continue;
                var obj = getObjectByName(objName);
                if (!obj)
                    continue;
                obj.visible = bool;
            }
        }

        /* function cloneObject(objName, warning) {
            if (!objName)
                return;
            var obj = getObjectByName(objName);
            if (!obj)
                return;
            var newObj = obj.clone();
            newObj.name = findUniqueObjectName(obj.name, warning);
            appInstance.scene.add(newObj);
            return newObj.name;
        } */

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

            obj.updateMatrixWorld(true);
        }

        function setScreenScale(notMoving) {
            if (oldPR == pixelRatioSet[notMoving]) {
                oldPRCounter++;

                if (oldPRCounter > 5)
                    return;
            }
            else
                oldPRCounter = 0;

            if (!appInstance.useHiDPIRenderPass)
                appInstance.renderer.setPixelRatio(pixelRatioSet[notMoving]);
            if (appInstance.postprocessing)
                appInstance.postprocessing.composer.setPixelRatio(pixelRatioSet[notMoving]);
            appInstance.onResize();

            oldPR = pixelRatioSet[notMoving];
        }

        function tweenMaterialHexColor(oldColor, oldColorName, matName, hexColor, tweenTime) {
            isTweeningColors[0] = true;

            if (oldColor == undefined)
                oldColor = [0, 0, 0];

            let color = (new v3d.Color(parseInt('0x' + hexColor)))
            let newColor = [color.r, color.g, color.b];

            animateParam(oldColor, newColor, tweenTime, 'Linear', 'InOut', 0, false,
                function () {
                    setMaterialColor(matName, 'RGB', (_pGlob.animateParamUpdate || 0)[0], (_pGlob.animateParamUpdate || 0)[1], (_pGlob.animateParamUpdate || 0)[2], '');
                }, function () {
                    registerSetTimeout(animationRenderStopDelay, function () {
                        isTweeningColors[0] = false;
                        updateColorVars(oldColorName, color.r, color.g, color.b);
                    });
                });
        }

        function updateColorVars(type, r, g, b) {
            switch (type) {
                case "oldOutsideColor":
                    oldOutsideColor = [r, g, b];
                    break;
            }
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
                        cameraDirection.copy(coordsTransform(cameraDirection, getCoordSystem(), 'Y_UP_RIGHT'));
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
                    if (orthoZoom != null) {
                        if (duration > 0) animateParam(camera.zoom, orthoZoom, duration, 'Quadratic', 'InOut', 0, false,
                            function () { camera.zoom = _pGlob.animateParamUpdate; camera.updateProjectionMatrix(); }, function () { });
                        else setOrthoZoom();
                    }
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

        function cameraPosition(onFinish) {
            // Camera spot for whichever perspective the snapshot needs.
            let camPosX, camPosY, camPosZ;
            let scaleX, scaleY, scaleZ;
            if (ssrPerspective == "perspective") {
                camPosX = conservatoryWidth + (conservatoryWidth + conservatoryDepth + totalHeight) / 10 + 5;
                camPosY = conservatoryWidth + (conservatoryWidth + conservatoryDepth + totalHeight) / 10 + 8;
                camPosZ = totalHeight + (conservatoryWidth + conservatoryDepth + totalHeight) / 10 + 2;
            } else if (ssrPerspective == "side") {
                camPosX = -(conservatoryWidth + 8);
                camPosY = conservatoryDepth / 2;
                camPosZ = totalHeight / 2;
            } else if (ssrPerspective == "front") {
                camPosX = 0;
                camPosY = conservatoryDepth + 8;
                camPosZ = totalHeight / 2;
            } else if (ssrPerspective == "top") {
                camPosX = 0;
                camPosY = conservatoryDepth / 2;
                camPosZ = totalHeight + 16;
            } else { // default + "main"    
                camPosX = conservatoryWidth + (conservatoryWidth + conservatoryDepth + totalHeight) / 10 + 2;
                camPosY = conservatoryWidth + (conservatoryWidth + conservatoryDepth + totalHeight) / 10 + 8;
                camPosZ = totalHeight + (conservatoryWidth + conservatoryDepth + totalHeight) / 10 + 2;
            }

            setObjTransform("Camerapos", "position", camPosX, camPosY, camPosZ, false);

            if (isHorizontalScreenConfigurator)
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, totalHeight, false);
            else
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, totalHeight / 2, false);

            // Wrap ScaleCube around the building so zoomCamera frames it to a consistent size.

            // check if it is a calista config or ODHS or ODVS and set the camera position accordingly!
            if (isHorizontalScreenConfigurator) {
                setObjTransform("ScaleCube", "position", 0, conservatoryDepth / 2, totalHeight - 0.2 / 2, false);
                setObjTransform("ScaleCube", "scale", conservatoryWidth, conservatoryDepth, 0.2, false);
            }
            else if (isVerticalScreenConfigurator) {
                setObjTransform('ScaleCube', 'position', 0, 0.4, 0, false);
                setObjTransform('ScaleCube', 'scale', verticalScreenStandalone.width / 1000, 0.15, verticalScreenStandalone.height / 1000, false);
            }
            else {
                setObjTransform("ScaleCube", "position", 0, conservatoryDepth / 2, 0, false);
                setObjTransform("ScaleCube", "scale", conservatoryWidth, conservatoryDepth, totalHeight, false);
            }

            // Move the camera into place; SSR snaps instantly, live tweens.
            // On finish: zoom-to-fit (fire-and-forget, never gates the snapshot), then hand off.
            tweenCamera("Camerapos", "Cameratarget", isSSR ? 0 : 1, function () {
                if (!isSSR) enableMeasurements(true);
                zoomCamera("ScaleCube", isSSR ? 0 : 0.5);
                renderFrame();
                if (onFinish) onFinish();
            });
        }

        function clearScene() {
            let objList = getAllObjectNames();

            for (let i = 0; objList[i] != undefined; i++)
                if (objList[i] != "Scene") {
                    changeVis(objList[i], false);
                }
        }

        function enablePartitionWalls() {
            let woodThickness = 0.135; let woodFrameSectionWidth = 0.675;

            if (leftSpecs.isPartitionWallEnabled(-1)) {
                let totalLength = 0; let woodCounter = 0; let glassCounter = 0; let verticalProfileCounter = 0; let sandwichPanelCounter = 0; let doorwayPostCounter = 0; let woodEndProfileCounter = 0; let lengthCache = 0; let woodFrameCounter = 0; let fullWood = false;
                let poleAdaptation = getPoleSize("y"); let depthAdaptation = -0.026; let heightAdaptation = 0.26; let doorwayPostL2Adaptation = 0;

                if (leftSpecs.isPartitionWallEnabled(-1) == 2) {
                    depthAdaptation = -0.08;
                    heightAdaptation = 0.29;
                    doorwayPostL2Adaptation = 0.04;
                }

                for (let i = 0; i < leftSpecs.wallSpecs.length; i++) {
                    if (leftSpecs.wallSpecs[0].fillType == "fillTypeWood" && leftSpecs.wallSpecs.length == 1)
                        fullWood = true;

                    if (leftSpecs.wallSpecs[i].fillType == "fillTypeWood") {
                        let framePosition = totalLength;
                        for (let x = 0; x < ((leftSpecs.wallSpecs[i].width / 1000) / woodFrameSectionWidth); x++) {
                            if (!getObjectByName(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter]))
                                leftSpecs.integratedWallWoodFrameCache[woodFrameCounter] = cloneObject("Integrated wall_wood_frame.0", 1000);

                            setObjTransform(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", conservatoryWidth / 2 + depthAdaptation, framePosition + poleAdaptation + woodFrameSectionWidth / 2, '', false);

                            setMorphFactor(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            setMorphFactor(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', (((woodFrameSectionWidth) - 1) / 99));

                            if ((leftSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x) < woodFrameSectionWidth) {
                                setObjTransform(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", '', framePosition + poleAdaptation + ((leftSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) / 2, '', false);
                                setMorphFactor(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', ((((leftSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) - 1) / 99));
                            }
                            changeVis(leftSpecs.integratedWallWoodFrameCache[woodFrameCounter], true);
                            woodFrameCounter++; framePosition += woodFrameSectionWidth;
                        }

                        //      while ((totalLength + (woodThickness * (+!fullWood) / 2)) < leftSpecs.wallSpecs[i].width / 1000 + lengthCache) {
                        while ((totalLength + (woodThickness * (leftSpecs.wallSpecs[i].width % 135 == 0) / 2)) < leftSpecs.wallSpecs[i].width / 1000 + lengthCache) {
                            if (leftSpecs.integratedWallWoodCache.length <= woodCounter)
                                leftSpecs.integratedWallWoodCache[woodCounter] = [cloneObject("Integrated wall_wood_exterior.0", 1000), cloneObject("Integrated wall_wood_interior.0", 1000)];
                            if (!leftSpecs.integratedWallWoodShortCache.length)
                                leftSpecs.integratedWallWoodShortCache = [[cloneObject("Integrated wall_wood_exterior_short5.0", 5), cloneObject("Integrated wall_wood_interior_short5.0", 5)], [cloneObject("Integrated wall_wood_exterior_short15.0", 5), cloneObject("Integrated wall_wood_interior_short15.0", 5)], [cloneObject("Integrated wall_wood_exterior_short25.0", 5), cloneObject("Integrated wall_wood_interior_short25.0", 5)], [cloneObject("Integrated wall_wood_exterior_short35.0", 5), cloneObject("Integrated wall_wood_interior_short35.0", 5)], [cloneObject("Integrated wall_wood_exterior_short45.0", 5), cloneObject("Integrated wall_wood_interior_short45.0", 5)], [cloneObject("Integrated wall_wood_exterior_short55.0", 5), cloneObject("Integrated wall_wood_interior_short55.0", 5)], [cloneObject("Integrated wall_wood_exterior_short65.0", 5), cloneObject("Integrated wall_wood_interior_short65.0", 5)], [cloneObject("Integrated wall_wood_exterior_short75.0", 5), cloneObject("Integrated wall_wood_interior_short75.0", 5)], [cloneObject("Integrated wall_wood_exterior_short85.0", 5), cloneObject("Integrated wall_wood_interior_short85.0", 5)], [cloneObject("Integrated wall_wood_exterior_short95.0", 5), cloneObject("Integrated wall_wood_interior_short95.0", 5)], [cloneObject("Integrated wall_wood_exterior_short105.0", 5), cloneObject("Integrated wall_wood_interior_short105.0", 5)], [cloneObject("Integrated wall_wood_exterior_short115.0", 5), cloneObject("Integrated wall_wood_interior_short115.0", 5)], [cloneObject("Integrated wall_wood_exterior_short125.0", 5), cloneObject("Integrated wall_wood_interior_short125.0", 5)]];

                            for (let x = 0; x <= 1; x++) {
                                for (let y = 0; y < leftSpecs.integratedWallWoodShortCache.length; y++) {
                                    setObjTransform(leftSpecs.integratedWallWoodCache[woodCounter][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation + woodThickness / 2, '', false);
                                    setObjTransform(leftSpecs.integratedWallWoodShortCache[y][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation + woodThickness / 2, '', false);

                                    setObjTransform(leftSpecs.integratedWallWoodCache[woodCounter][x], "rotation", '', '', 0, false);
                                    setObjTransform(leftSpecs.integratedWallWoodShortCache[y][x], "rotation", '', '', 0, false);

                                    setMorphFactor(leftSpecs.integratedWallWoodCache[woodCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                    setMorphFactor(leftSpecs.integratedWallWoodShortCache[y][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                }
                            }

                            //     if (totalLength + woodThickness > leftSpecs.wallSpecs[i].width / 1000 && fullWood) {
                            if ((totalLength + woodThickness > leftSpecs.wallSpecs[i].width / 1000 + lengthCache) && leftSpecs.wallSpecs[i].width % 135 != 0) {
                                let index = parseInt(((leftSpecs.wallSpecs[i].width / 1000) % woodThickness) * 100);
                                if (index > 12)
                                    index = 12;
                                if (index < 0)
                                    index = 0;

                                changeVis(leftSpecs.integratedWallWoodShortCache[index][0], leftSpecs.wallSpecs[i].fill == "woodworkOutside" || leftSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(leftSpecs.integratedWallWoodShortCache[index][1], leftSpecs.wallSpecs[i].fill == "woodworkInside" || leftSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += (leftSpecs.wallSpecs[i].width / 1000) % woodThickness;
                                break;
                            }
                            else {
                                changeVis(leftSpecs.integratedWallWoodCache[woodCounter][0], leftSpecs.wallSpecs[i].fill == "woodworkOutside" || leftSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(leftSpecs.integratedWallWoodCache[woodCounter][1], leftSpecs.wallSpecs[i].fill == "woodworkInside" || leftSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += woodThickness; woodCounter++;
                            }
                        }

                        if (!getObjectByName(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter])) {
                            leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                            leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                        }
                        setObjTransform(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "position", conservatoryWidth / 2 + depthAdaptation, lengthCache + poleAdaptation, '', false);
                        lengthCache = totalLength;
                        setObjTransform(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "position", conservatoryWidth / 2 + depthAdaptation, lengthCache + poleAdaptation, '', false);

                        setMorphFactor(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        setMorphFactor(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        if (i == 0)
                            changeVis(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);
                        else if (leftSpecs.wallSpecs[i - 1].fillType != "fillTypeWood")
                            changeVis(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);

                        if (leftSpecs.wallSpecs[i + 1]) {
                            if (leftSpecs.wallSpecs[i + 1].fillType != "fillTypeWood")
                                changeVis(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);
                        }
                        else
                            changeVis(leftSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);

                        woodEndProfileCounter += 2;
                    }

                    if ((leftSpecs.wallSpecs[i].fillType == "fillTypeGlass" || leftSpecs.wallSpecs[i].fillType == "fillTypeSheet") && ((i > 0))) {
                        if (!getObjectByName(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation, '', false);
                            setMorphFactor(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }

                        if (leftSpecs.wallSpecs[i - 1].fillType != "fillTypeGlass" && leftSpecs.wallSpecs[i - 1].fillType != "fillTypeSheet")
                            changeVis(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);
                        else
                            changeVis(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);

                        verticalProfileCounter++;
                    }

                    if ((leftSpecs.wallSpecs[i].fillType == "fillTypeGlass" || leftSpecs.wallSpecs[i].fillType == "fillTypeSheet") && i == 0 && leftSpecs.isPartitionWallEnabled(-1) == 2) {
                        if (!getObjectByName(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation, '', false);
                            setMorphFactor(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);

                        verticalProfileCounter++;
                    }

                    if (leftSpecs.wallSpecs[i].fillType == "fillTypeGlass") {
                        if (!getObjectByName(leftSpecs.integratedWallGlassCache[glassCounter]))
                            leftSpecs.integratedWallGlassCache[glassCounter] = cloneObject("Integrated wall_glass.0", 1000, true, true);

                        setObjTransform(leftSpecs.integratedWallGlassCache[glassCounter], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + (leftSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                        setObjTransform(leftSpecs.integratedWallGlassCache[glassCounter], "rotation", '', '', 0, false);

                        setMorphFactor(leftSpecs.integratedWallGlassCache[glassCounter], 'Length', ((leftSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(leftSpecs.integratedWallGlassCache[glassCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(leftSpecs.integratedWallGlassCache[glassCounter], true);

                        if (leftSpecs.wallSpecs[i].glassColor == 'none') {
                            setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                            setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                        }
                        else {
                            if (leftSpecs.wallSpecs[i].glassColor.code == 'glass_Clear') {
                                setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0);
                            }
                            else if (leftSpecs.wallSpecs[i].glassColor.code == 'glass_Opal') {
                                setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.8);
                            }
                            else {
                                setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                                setMaterialValue(getObjectMaterial(leftSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                            }
                        }

                        totalLength += leftSpecs.wallSpecs[i].width / 1000; glassCounter++; lengthCache = totalLength;


                    }
                    if (leftSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter]))
                            leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter] = [cloneObject("Integrated wall_sandwich panelAA.0", 1000), cloneObject("Integrated wall_sandwich panelWW.0", 1000), cloneObject("Integrated wall_sandwich panelRW.0", 1000)];

                        for (let y = 0; y < leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter].length; y++) {
                            setObjTransform(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + (leftSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                            setObjTransform(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "rotation", '', '', 0, false);

                            setMorphFactor(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Length', ((leftSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                            setMorphFactor(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        if (leftSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichWhite")
                            changeVis(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][1], true);
                        else if (leftSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichTile")
                            changeVis(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][2], true);
                        else
                            changeVis(leftSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][0], true);

                        totalLength += leftSpecs.wallSpecs[i].width / 1000; sandwichPanelCounter++; lengthCache = totalLength;
                    }
                    if (leftSpecs.wallSpecs[i].fillType == "fillTypeNone") {
                        if (!getObjectByName(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter])) {
                            leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter] = cloneObject("Integrated wall_doorway post.0", 1000);
                            leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1] = cloneObject("Integrated wall_doorway post.0", 1000);
                        }
                        setObjTransform(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation + 0.01, '', false);
                        setObjTransform(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "rotation", '', '', 0, false);

                        setMorphFactor(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        setObjTransform(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + leftSpecs.wallSpecs[i].width / 1000 + poleAdaptation - 0.01, '', false);
                        setObjTransform(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "rotation", '', '', 0, false);

                        setMorphFactor(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        changeVis(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], i != 0);
                        changeVis(leftSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], leftSpecs.wallSpecs[i + 1]);

                        totalLength += leftSpecs.wallSpecs[i].width / 1000; doorwayPostCounter += 2; lengthCache = totalLength;
                    }
                    if (leftSpecs.wallSpecs[i].fillType == "fillTypeGlass" || leftSpecs.wallSpecs[i].fillType == "fillTypeWood" || leftSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(leftSpecs.integratedWallBottomProfileCache[i]))
                            leftSpecs.integratedWallBottomProfileCache[i] = cloneObject("Integrated wall_bottom profile.0", 1000);

                        setObjTransform(leftSpecs.integratedWallBottomProfileCache[i], "position", conservatoryWidth / 2 + depthAdaptation, totalLength - (leftSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                        setObjTransform(leftSpecs.integratedWallBottomProfileCache[i], "rotation", '', '', 0, false);

                        setMorphFactor(leftSpecs.integratedWallBottomProfileCache[i], 'Length', ((leftSpecs.wallSpecs[i].width / 1000 - 1) / 100));

                        changeVis(leftSpecs.integratedWallBottomProfileCache[i], true);

                        if (!getObjectByName(leftSpecs.integratedWallTopProfileCache[i]))
                            leftSpecs.integratedWallTopProfileCache[i] = cloneObject("Integrated wall_top profile.0", 1000);

                        setObjTransform(leftSpecs.integratedWallTopProfileCache[i], "position", conservatoryWidth / 2 + depthAdaptation, totalLength - (leftSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                        setObjTransform(leftSpecs.integratedWallTopProfileCache[i], "rotation", '', '', 0, false);

                        setMorphFactor(leftSpecs.integratedWallTopProfileCache[i], 'Length', ((leftSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(leftSpecs.integratedWallTopProfileCache[i], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(leftSpecs.integratedWallTopProfileCache[i], true);
                    }

                    if (leftSpecs.wallSpecs[i + 1] && (leftSpecs.wallSpecs[i].fillType == "fillTypeGlass" || leftSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (leftSpecs.wallSpecs[i + 1].fillType == "fillTypeGlass" || leftSpecs.wallSpecs[i + 1].fillType == "fillTypeSheet") {
                            if (!getObjectByName(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation, '', false);
                                setMorphFactor(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);
                            verticalProfileCounter++;
                        }
                        if (leftSpecs.wallSpecs[i + 1].fillType == "fillTypeWood" || leftSpecs.wallSpecs[i + 1].fillType == "fillTypeNone") {
                            if (!getObjectByName(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation, '', false);
                                setMorphFactor(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                            verticalProfileCounter++;
                        }
                    }
                    if (!leftSpecs.wallSpecs[i + 1] && leftSpecs.isPartitionWallEnabled(-1) == 2 && (leftSpecs.wallSpecs[i].fillType == "fillTypeGlass" || leftSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (!getObjectByName(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", conservatoryWidth / 2 + depthAdaptation, totalLength + poleAdaptation, '', false);
                            setMorphFactor(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }

                        changeVis(leftSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                        verticalProfileCounter++;
                    }
                }
            }

            if (rightSpecs.isPartitionWallEnabled(-1)) {
                let totalLength = 0; let woodCounter = 0; let glassCounter = 0; let verticalProfileCounter = 0; let sandwichPanelCounter = 0; let doorwayPostCounter = 0; let woodEndProfileCounter = 0; let lengthCache = 0; let woodFrameCounter = 0; let fullWood = false;
                let poleAdaptation = getPoleSize("y"); let depthAdaptation = -0.026; let heightAdaptation = 0.26; let doorwayPostL2Adaptation = 0;

                if (rightSpecs.isPartitionWallEnabled(-1) == 2) {
                    depthAdaptation = -0.08;
                    heightAdaptation = 0.29;
                    doorwayPostL2Adaptation = 0.04;
                }

                for (let i = 0; i < rightSpecs.wallSpecs.length; i++) {
                    if (rightSpecs.wallSpecs[0].fillType == "fillTypeWood" && rightSpecs.wallSpecs.length == 1)
                        fullWood = true;

                    if (rightSpecs.wallSpecs[i].fillType == "fillTypeWood") {
                        let framePosition = totalLength;
                        for (let x = 0; x < ((rightSpecs.wallSpecs[i].width / 1000) / woodFrameSectionWidth); x++) {
                            if (!getObjectByName(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter]))
                                rightSpecs.integratedWallWoodFrameCache[woodFrameCounter] = cloneObject("Integrated wall_wood_frame.0", 1000);

                            setObjTransform(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", -(conservatoryWidth / 2 + depthAdaptation), framePosition + poleAdaptation + woodFrameSectionWidth / 2, '', false);
                            setObjTransform(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], "rotation", '', '', 180, false);

                            setMorphFactor(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            setMorphFactor(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', (((woodFrameSectionWidth) - 1) / 99));

                            if ((rightSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x) < woodFrameSectionWidth) {
                                setObjTransform(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", '', framePosition + poleAdaptation + ((rightSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) / 2, '', false);
                                setMorphFactor(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', ((((rightSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) - 1) / 99));
                            }
                            changeVis(rightSpecs.integratedWallWoodFrameCache[woodFrameCounter], true);
                            woodFrameCounter++; framePosition += woodFrameSectionWidth;
                        }

                        while ((totalLength + (woodThickness * (rightSpecs.wallSpecs[i].width % 135 == 0) / 2)) < rightSpecs.wallSpecs[i].width / 1000 + lengthCache) {
                            if (rightSpecs.integratedWallWoodCache.length <= woodCounter)
                                rightSpecs.integratedWallWoodCache[woodCounter] = [cloneObject("Integrated wall_wood_exterior.0", 1000), cloneObject("Integrated wall_wood_interior.0", 1000)];
                            if (!rightSpecs.integratedWallWoodShortCache.length)
                                rightSpecs.integratedWallWoodShortCache = [[cloneObject("Integrated wall_wood_exterior_short5.0", 5), cloneObject("Integrated wall_wood_interior_short5.0", 5)], [cloneObject("Integrated wall_wood_exterior_short15.0", 5), cloneObject("Integrated wall_wood_interior_short15.0", 5)], [cloneObject("Integrated wall_wood_exterior_short25.0", 5), cloneObject("Integrated wall_wood_interior_short25.0", 5)], [cloneObject("Integrated wall_wood_exterior_short35.0", 5), cloneObject("Integrated wall_wood_interior_short35.0", 5)], [cloneObject("Integrated wall_wood_exterior_short45.0", 5), cloneObject("Integrated wall_wood_interior_short45.0", 5)], [cloneObject("Integrated wall_wood_exterior_short55.0", 5), cloneObject("Integrated wall_wood_interior_short55.0", 5)], [cloneObject("Integrated wall_wood_exterior_short65.0", 5), cloneObject("Integrated wall_wood_interior_short65.0", 5)], [cloneObject("Integrated wall_wood_exterior_short75.0", 5), cloneObject("Integrated wall_wood_interior_short75.0", 5)], [cloneObject("Integrated wall_wood_exterior_short85.0", 5), cloneObject("Integrated wall_wood_interior_short85.0", 5)], [cloneObject("Integrated wall_wood_exterior_short95.0", 5), cloneObject("Integrated wall_wood_interior_short95.0", 5)], [cloneObject("Integrated wall_wood_exterior_short105.0", 5), cloneObject("Integrated wall_wood_interior_short105.0", 5)], [cloneObject("Integrated wall_wood_exterior_short115.0", 5), cloneObject("Integrated wall_wood_interior_short115.0", 5)], [cloneObject("Integrated wall_wood_exterior_short125.0", 5), cloneObject("Integrated wall_wood_interior_short125.0", 5)]];

                            for (let x = 0; x <= 1; x++) {
                                for (let y = 0; y < rightSpecs.integratedWallWoodShortCache.length; y++) {
                                    setObjTransform(rightSpecs.integratedWallWoodCache[woodCounter][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation + woodThickness / 2, '', false);
                                    setObjTransform(rightSpecs.integratedWallWoodShortCache[y][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation + woodThickness / 2, '', false);

                                    setObjTransform(rightSpecs.integratedWallWoodCache[woodCounter][x], "scale", -1, '', '', false);
                                    setObjTransform(rightSpecs.integratedWallWoodShortCache[y][x], "scale", -1, '', '', false);

                                    setMorphFactor(rightSpecs.integratedWallWoodCache[woodCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                    setMorphFactor(rightSpecs.integratedWallWoodShortCache[y][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                }
                            }

                            if ((totalLength + woodThickness > rightSpecs.wallSpecs[i].width / 1000 + lengthCache) && rightSpecs.wallSpecs[i].width % 135 != 0) {
                                let index = parseInt(((rightSpecs.wallSpecs[i].width / 1000) % woodThickness) * 100);
                                if (index > 12)
                                    index = 12;
                                if (index < 0)
                                    index = 0;

                                changeVis(rightSpecs.integratedWallWoodShortCache[index][0], rightSpecs.wallSpecs[i].fill == "woodworkOutside" || rightSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(rightSpecs.integratedWallWoodShortCache[index][1], rightSpecs.wallSpecs[i].fill == "woodworkInside" || rightSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += (rightSpecs.wallSpecs[i].width / 1000) % woodThickness;
                                break;
                            }
                            else {
                                changeVis(rightSpecs.integratedWallWoodCache[woodCounter][0], rightSpecs.wallSpecs[i].fill == "woodworkOutside" || rightSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(rightSpecs.integratedWallWoodCache[woodCounter][1], rightSpecs.wallSpecs[i].fill == "woodworkInside" || rightSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += woodThickness; woodCounter++;
                            }
                        }

                        if (!getObjectByName(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter])) {
                            rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                            rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                        }
                        setObjTransform(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "position", -(conservatoryWidth / 2 + depthAdaptation), lengthCache + poleAdaptation, '', false);
                        setObjTransform(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "rotation", '', '', 180, false);
                        lengthCache = totalLength;
                        setObjTransform(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "position", -(conservatoryWidth / 2 + depthAdaptation), lengthCache + poleAdaptation, '', false);
                        setObjTransform(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "rotation", '', '', 180, false);

                        setMorphFactor(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        setMorphFactor(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        if (i == 0)
                            changeVis(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);
                        else if (rightSpecs.wallSpecs[i - 1].fillType != "fillTypeWood")
                            changeVis(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);

                        if (rightSpecs.wallSpecs[i + 1]) {
                            if (rightSpecs.wallSpecs[i + 1].fillType != "fillTypeWood")
                                changeVis(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);
                        }
                        else
                            changeVis(rightSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);

                        woodEndProfileCounter += 2;
                    }

                    if ((rightSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rightSpecs.wallSpecs[i].fillType == "fillTypeSheet") && ((i > 0))) {
                        if (!getObjectByName(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation, '', false);
                            setMorphFactor(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }

                        if (rightSpecs.wallSpecs[i - 1].fillType != "fillTypeGlass" && rightSpecs.wallSpecs[i - 1].fillType != "fillTypeSheet")
                            changeVis(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);
                        else
                            changeVis(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);

                        verticalProfileCounter++;
                    }

                    if ((rightSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rightSpecs.wallSpecs[i].fillType == "fillTypeSheet") && i == 0 && rightSpecs.isPartitionWallEnabled(-1) == 2) {
                        if (!getObjectByName(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation, '', false);
                            setMorphFactor(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);

                        verticalProfileCounter++;
                    }

                    if (rightSpecs.wallSpecs[i].fillType == "fillTypeGlass") {
                        if (!getObjectByName(rightSpecs.integratedWallGlassCache[glassCounter]))
                            rightSpecs.integratedWallGlassCache[glassCounter] = cloneObject("Integrated wall_glass.0", 1000, true, true);

                        setObjTransform(rightSpecs.integratedWallGlassCache[glassCounter], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + (rightSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                        setObjTransform(rightSpecs.integratedWallGlassCache[glassCounter], "rotation", '', '', 180, false);

                        setMorphFactor(rightSpecs.integratedWallGlassCache[glassCounter], 'Length', ((rightSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(rightSpecs.integratedWallGlassCache[glassCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(rightSpecs.integratedWallGlassCache[glassCounter], true);

                        if (rightSpecs.wallSpecs[i].glassColor == 'none') {
                            setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                            setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                        }
                        else {
                            if (rightSpecs.wallSpecs[i].glassColor.code == 'glass_Clear') {
                                setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0);
                            }
                            else if (rightSpecs.wallSpecs[i].glassColor.code == 'glass_Opal') {
                                setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.8);
                            }
                            else {
                                setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                                setMaterialValue(getObjectMaterial(rightSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                            }
                        }

                        totalLength += rightSpecs.wallSpecs[i].width / 1000; glassCounter++; lengthCache = totalLength;
                    }
                    if (rightSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter]))
                            rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter] = [cloneObject("Integrated wall_sandwich panelAA.0", 1000), cloneObject("Integrated wall_sandwich panelWW.0", 1000), cloneObject("Integrated wall_sandwich panelRW.0", 1000)];

                        for (let y = 0; y < rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter].length; y++) {
                            setObjTransform(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + (rightSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                            setObjTransform(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "rotation", '', '', 180, false);

                            setMorphFactor(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Length', ((rightSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                            setMorphFactor(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        if (rightSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichWhite")
                            changeVis(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][1], true);
                        else if (rightSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichTile")
                            changeVis(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][2], true);
                        else
                            changeVis(rightSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][0], true);

                        totalLength += rightSpecs.wallSpecs[i].width / 1000; sandwichPanelCounter++; lengthCache = totalLength;
                    }
                    if (rightSpecs.wallSpecs[i].fillType == "fillTypeNone") {
                        if (!getObjectByName(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter])) {
                            rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter] = cloneObject("Integrated wall_doorway post.0", 1000);
                            rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1] = cloneObject("Integrated wall_doorway post.0", 1000);
                        }
                        setObjTransform(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation + 0.01, '', false);
                        setObjTransform(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "rotation", '', '', 180, false);

                        setMorphFactor(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        setObjTransform(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + rightSpecs.wallSpecs[i].width / 1000 + poleAdaptation - 0.01, '', false);
                        setObjTransform(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "rotation", '', '', 180, false);

                        setMorphFactor(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        changeVis(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], i != 0);
                        changeVis(rightSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], rightSpecs.wallSpecs[i + 1]);

                        totalLength += rightSpecs.wallSpecs[i].width / 1000; doorwayPostCounter += 2; lengthCache = totalLength;
                    }
                    if (rightSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rightSpecs.wallSpecs[i].fillType == "fillTypeWood" || rightSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(rightSpecs.integratedWallBottomProfileCache[i]))
                            rightSpecs.integratedWallBottomProfileCache[i] = cloneObject("Integrated wall_bottom profile.0", 1000);

                        setObjTransform(rightSpecs.integratedWallBottomProfileCache[i], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength - (rightSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                        setObjTransform(rightSpecs.integratedWallBottomProfileCache[i], "rotation", '', '', 180, false);

                        setMorphFactor(rightSpecs.integratedWallBottomProfileCache[i], 'Length', ((rightSpecs.wallSpecs[i].width / 1000 - 1) / 100));

                        changeVis(rightSpecs.integratedWallBottomProfileCache[i], true);

                        if (!getObjectByName(rightSpecs.integratedWallTopProfileCache[i]))
                            rightSpecs.integratedWallTopProfileCache[i] = cloneObject("Integrated wall_top profile.0", 1000);

                        setObjTransform(rightSpecs.integratedWallTopProfileCache[i], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength - (rightSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, '', false);
                        setObjTransform(rightSpecs.integratedWallTopProfileCache[i], "rotation", '', '', 180, false);

                        setMorphFactor(rightSpecs.integratedWallTopProfileCache[i], 'Length', ((rightSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(rightSpecs.integratedWallTopProfileCache[i], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(rightSpecs.integratedWallTopProfileCache[i], true);
                    }

                    if (rightSpecs.wallSpecs[i + 1] && (rightSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rightSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (rightSpecs.wallSpecs[i + 1].fillType == "fillTypeGlass" || rightSpecs.wallSpecs[i + 1].fillType == "fillTypeSheet") {
                            if (!getObjectByName(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation, '', false);
                                setMorphFactor(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);
                            verticalProfileCounter++;
                        }
                        if (rightSpecs.wallSpecs[i + 1].fillType == "fillTypeWood" || rightSpecs.wallSpecs[i + 1].fillType == "fillTypeNone") {
                            if (!getObjectByName(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation, '', false);
                                setMorphFactor(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                            verticalProfileCounter++;
                        }
                    }
                    if (!rightSpecs.wallSpecs[i + 1] && rightSpecs.isPartitionWallEnabled(-1) == 2 && (rightSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rightSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (!getObjectByName(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2 + depthAdaptation), totalLength + poleAdaptation, '', false);
                            setMorphFactor(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(rightSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                        verticalProfileCounter++;
                    }
                }
            }

            if (frontSpecs.isPartitionWallEnabled(-1)) {
                let totalLength = 0; let woodCounter = 0; let glassCounter = 0; let verticalProfileCounter = 0; let sandwichPanelCounter = 0; let doorwayPostCounter = 0; let woodEndProfileCounter = 0; let lengthCache = 0; let woodFrameCounter = 0; let fullWood = false;
                let poleAdaptation = getPoleSize("y"); let depthAdaptation = -0.026; let heightAdaptation = 0.26; let doorwayPostL2Adaptation = 0;

                if (frontSpecs.isPartitionWallEnabled(-1) == 2) {
                    depthAdaptation = -0.08;
                    heightAdaptation = 0.29;
                    doorwayPostL2Adaptation = 0.04;
                }

                for (let i = 0; i < frontSpecs.wallSpecs.length; i++) {
                    if (frontSpecs.wallSpecs[0].fillType == "fillTypeWood" && frontSpecs.wallSpecs.length == 1)
                        fullWood = true;
                    if (frontSpecs.wallSpecs[i].fillType == "fillTypeWood") {
                        let framePosition = totalLength;
                        for (let x = 0; x < ((frontSpecs.wallSpecs[i].width / 1000) / woodFrameSectionWidth); x++) {
                            if (!getObjectByName(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter]))
                                frontSpecs.integratedWallWoodFrameCache[woodFrameCounter] = cloneObject("Integrated wall_wood_frame.0", 1000);

                            setObjTransform(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", (conservatoryWidth / 2) - framePosition - poleAdaptation - woodFrameSectionWidth / 2, conservatoryDepth + depthAdaptation, '', false);
                            setObjTransform(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], "rotation", '', '', 90, false);

                            setMorphFactor(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            setMorphFactor(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', (((woodFrameSectionWidth) - 1) / 99));

                            if ((frontSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x) < woodFrameSectionWidth) {
                                setObjTransform(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", (conservatoryWidth / 2) - framePosition - poleAdaptation + (-(frontSpecs.wallSpecs[i].width / 1000) + (woodFrameSectionWidth * x)) / 2, '', '', false);
                                setMorphFactor(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', ((((frontSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) - 1) / 99));
                            }
                            changeVis(frontSpecs.integratedWallWoodFrameCache[woodFrameCounter], true);
                            woodFrameCounter++; framePosition += woodFrameSectionWidth;
                        }

                        while ((totalLength + (woodThickness * (frontSpecs.wallSpecs[i].width % 135 == 0) / 2)) < frontSpecs.wallSpecs[i].width / 1000 + lengthCache) {
                            if (frontSpecs.integratedWallWoodCache.length <= woodCounter)
                                frontSpecs.integratedWallWoodCache[woodCounter] = [cloneObject("Integrated wall_wood_exterior_90.0", 1000), cloneObject("Integrated wall_wood_interior_90.0", 1000)];
                            if (!frontSpecs.integratedWallWoodShortCache.length)
                                frontSpecs.integratedWallWoodShortCache = [[cloneObject("Integrated wall_wood_exterior_short5_90.0", 5), cloneObject("Integrated wall_wood_interior_short5_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short15_90.0", 5), cloneObject("Integrated wall_wood_interior_short15_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short25_90.0", 5), cloneObject("Integrated wall_wood_interior_short25_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short35_90.0", 5), cloneObject("Integrated wall_wood_interior_short35_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short45_90.0", 5), cloneObject("Integrated wall_wood_interior_short45_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short55_90.0", 5), cloneObject("Integrated wall_wood_interior_short55_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short65_90.0", 5), cloneObject("Integrated wall_wood_interior_short65_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short75_90.0", 5), cloneObject("Integrated wall_wood_interior_short75_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short85_90.0", 5), cloneObject("Integrated wall_wood_interior_short85_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short95_90.0", 5), cloneObject("Integrated wall_wood_interior_short95_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short105_90.0", 5), cloneObject("Integrated wall_wood_interior_short105_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short115_90.0", 5), cloneObject("Integrated wall_wood_interior_short115_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short125_90.0", 5), cloneObject("Integrated wall_wood_interior_short125_90.0", 5)]];

                            for (let x = 0; x <= 1; x++) {
                                for (let y = 0; y < frontSpecs.integratedWallWoodShortCache.length; y++) {
                                    setObjTransform(frontSpecs.integratedWallWoodCache[woodCounter][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation - woodThickness / 2, conservatoryDepth + depthAdaptation, '', false);
                                    setObjTransform(frontSpecs.integratedWallWoodShortCache[y][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation - woodThickness / 2, conservatoryDepth + depthAdaptation, '', false);

                                    setObjTransform(frontSpecs.integratedWallWoodCache[woodCounter][x], "rotation", '', '', 90, false);
                                    setObjTransform(frontSpecs.integratedWallWoodShortCache[y][x], "rotation", '', '', 90, false);

                                    setMorphFactor(frontSpecs.integratedWallWoodCache[woodCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                    setMorphFactor(frontSpecs.integratedWallWoodShortCache[y][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                }
                            }

                            if ((totalLength + woodThickness > frontSpecs.wallSpecs[i].width / 1000 + lengthCache) && frontSpecs.wallSpecs[i].width % 135 != 0) {
                                let index = parseInt(((frontSpecs.wallSpecs[i].width / 1000) % woodThickness) * 100);
                                if (index > 12)
                                    index = 12;
                                if (index < 0)
                                    index = 0;

                                changeVis(frontSpecs.integratedWallWoodShortCache[index][0], frontSpecs.wallSpecs[i].fill == "woodworkOutside" || frontSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(frontSpecs.integratedWallWoodShortCache[index][1], frontSpecs.wallSpecs[i].fill == "woodworkInside" || frontSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += (frontSpecs.wallSpecs[i].width / 1000) % woodThickness;
                                break;
                            }
                            else {
                                changeVis(frontSpecs.integratedWallWoodCache[woodCounter][0], frontSpecs.wallSpecs[i].fill == "woodworkOutside" || frontSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(frontSpecs.integratedWallWoodCache[woodCounter][1], frontSpecs.wallSpecs[i].fill == "woodworkInside" || frontSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += woodThickness; woodCounter++;
                            }
                        }

                        if (!getObjectByName(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter])) {
                            frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                            frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                        }
                        setObjTransform(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "position", (conservatoryWidth / 2) - lengthCache - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "rotation", '', '', 90, false);
                        lengthCache = totalLength;
                        setObjTransform(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "position", (conservatoryWidth / 2) - lengthCache - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "rotation", '', '', 90, false);

                        setMorphFactor(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        setMorphFactor(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        if (i == 0)
                            changeVis(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);
                        else if (frontSpecs.wallSpecs[i - 1].fillType != "fillTypeWood")
                            changeVis(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);

                        if (frontSpecs.wallSpecs[i + 1]) {
                            if (frontSpecs.wallSpecs[i + 1].fillType != "fillTypeWood")
                                changeVis(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);
                        }
                        else
                            changeVis(frontSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);

                        woodEndProfileCounter += 2;
                    }

                    if ((frontSpecs.wallSpecs[i].fillType == "fillTypeGlass" || frontSpecs.wallSpecs[i].fillType == "fillTypeSheet") && ((i > 0))) {
                        if (!getObjectByName(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                            setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', 90, false);
                            setMorphFactor(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }

                        if (frontSpecs.wallSpecs[i - 1].fillType != "fillTypeGlass" && frontSpecs.wallSpecs[i - 1].fillType != "fillTypeSheet")
                            changeVis(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);
                        else
                            changeVis(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);

                        verticalProfileCounter++;
                    }

                    if ((frontSpecs.wallSpecs[i].fillType == "fillTypeGlass" || frontSpecs.wallSpecs[i].fillType == "fillTypeSheet") && i == 0 && frontSpecs.isPartitionWallEnabled(-1) == 2) {
                        if (!getObjectByName(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                            setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', 90, false);
                            setMorphFactor(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);

                        verticalProfileCounter++;
                    }

                    if (frontSpecs.wallSpecs[i].fillType == "fillTypeGlass") {
                        if (!getObjectByName(frontSpecs.integratedWallGlassCache[glassCounter]))
                            frontSpecs.integratedWallGlassCache[glassCounter] = cloneObject("Integrated wall_glass.0", 1000, true, true);

                        setObjTransform(frontSpecs.integratedWallGlassCache[glassCounter], "position", (conservatoryWidth / 2) - totalLength - (frontSpecs.wallSpecs[i].width / 1000 / 2) - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallGlassCache[glassCounter], "rotation", '', '', 90, false);

                        setMorphFactor(frontSpecs.integratedWallGlassCache[glassCounter], 'Length', ((frontSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(frontSpecs.integratedWallGlassCache[glassCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(frontSpecs.integratedWallGlassCache[glassCounter], true);

                        if (frontSpecs.wallSpecs[i].glassColor == 'none') {
                            setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                            setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                        }
                        else {
                            if (frontSpecs.wallSpecs[i].glassColor.code == 'glass_Clear') {
                                setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0);
                            }
                            else if (frontSpecs.wallSpecs[i].glassColor.code == 'glass_Opal') {
                                setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.8);
                            }
                            else {
                                setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                                setMaterialValue(getObjectMaterial(frontSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                            }
                        }

                        totalLength += frontSpecs.wallSpecs[i].width / 1000; glassCounter++; lengthCache = totalLength;
                    }
                    if (frontSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter]))
                            frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter] = [cloneObject("Integrated wall_sandwich panelAA.0", 1000), cloneObject("Integrated wall_sandwich panelWW.0", 1000), cloneObject("Integrated wall_sandwich panelRW.0", 1000)];

                        for (let y = 0; y < frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter].length; y++) {
                            setObjTransform(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "position", (conservatoryWidth / 2) - totalLength - (frontSpecs.wallSpecs[i].width / 1000 / 2) - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                            setObjTransform(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "rotation", '', '', 90, false);

                            setMorphFactor(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Length', ((frontSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                            setMorphFactor(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        if (frontSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichWhite")
                            changeVis(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][1], true);
                        else if (frontSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichTile")
                            changeVis(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][2], true);
                        else
                            changeVis(frontSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][0], true);

                        totalLength += frontSpecs.wallSpecs[i].width / 1000; sandwichPanelCounter++; lengthCache = totalLength;
                    }
                    if (frontSpecs.wallSpecs[i].fillType == "fillTypeNone") {
                        if (!getObjectByName(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter])) {
                            frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter] = cloneObject("Integrated wall_doorway post.0", 1000);
                            frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1] = cloneObject("Integrated wall_doorway post.0", 1000);
                        }
                        setObjTransform(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation - 0.01, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "rotation", '', '', 90, false);

                        setMorphFactor(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        setObjTransform(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "position", (conservatoryWidth / 2) - totalLength - frontSpecs.wallSpecs[i].width / 1000 - poleAdaptation + 0.01, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "rotation", '', '', 90, false);

                        setMorphFactor(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        changeVis(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], i != 0);
                        changeVis(frontSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], frontSpecs.wallSpecs[i + 1]);

                        totalLength += frontSpecs.wallSpecs[i].width / 1000; doorwayPostCounter += 2; lengthCache = totalLength;
                    }
                    if (frontSpecs.wallSpecs[i].fillType == "fillTypeGlass" || frontSpecs.wallSpecs[i].fillType == "fillTypeWood" || frontSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(frontSpecs.integratedWallBottomProfileCache[i]))
                            frontSpecs.integratedWallBottomProfileCache[i] = cloneObject("Integrated wall_bottom profile.0", 1000);

                        setObjTransform(frontSpecs.integratedWallBottomProfileCache[i], "position", (conservatoryWidth / 2) - totalLength + (frontSpecs.wallSpecs[i].width / 1000 / 2) - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallBottomProfileCache[i], "rotation", '', '', 90, false);

                        setMorphFactor(frontSpecs.integratedWallBottomProfileCache[i], 'Length', ((frontSpecs.wallSpecs[i].width / 1000 - 1) / 100));

                        changeVis(frontSpecs.integratedWallBottomProfileCache[i], true);

                        if (!getObjectByName(frontSpecs.integratedWallTopProfileCache[i]))
                            frontSpecs.integratedWallTopProfileCache[i] = cloneObject("Integrated wall_top profile.0", 1000);

                        setObjTransform(frontSpecs.integratedWallTopProfileCache[i], "position", (conservatoryWidth / 2) - totalLength + (frontSpecs.wallSpecs[i].width / 1000 / 2) - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                        setObjTransform(frontSpecs.integratedWallTopProfileCache[i], "rotation", '', '', 90, false);

                        setMorphFactor(frontSpecs.integratedWallTopProfileCache[i], 'Length', ((frontSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(frontSpecs.integratedWallTopProfileCache[i], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(frontSpecs.integratedWallTopProfileCache[i], true);
                    }

                    if (frontSpecs.wallSpecs[i + 1] && (frontSpecs.wallSpecs[i].fillType == "fillTypeGlass" || frontSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (frontSpecs.wallSpecs[i + 1].fillType == "fillTypeGlass" || frontSpecs.wallSpecs[i + 1].fillType == "fillTypeSheet") {
                            if (!getObjectByName(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                                setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', 90, false);
                                setMorphFactor(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);
                            verticalProfileCounter++;
                        }
                        if (frontSpecs.wallSpecs[i + 1].fillType == "fillTypeWood" || frontSpecs.wallSpecs[i + 1].fillType == "fillTypeNone") {
                            if (!getObjectByName(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                                setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', 90, false);
                                setMorphFactor(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                            verticalProfileCounter++;
                        }
                    }
                    if (!frontSpecs.wallSpecs[i + 1] && frontSpecs.isPartitionWallEnabled(-1) == 2 && (frontSpecs.wallSpecs[i].fillType == "fillTypeGlass" || frontSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (!getObjectByName(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", (conservatoryWidth / 2) - totalLength - poleAdaptation, conservatoryDepth + depthAdaptation, '', false);
                            setObjTransform(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', 90, false);
                            setMorphFactor(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(frontSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                        verticalProfileCounter++;
                    }
                }
            }

            if (rearSpecs.isPartitionWallEnabled(-1)) {
                let totalLength = 0; let woodCounter = 0; let glassCounter = 0; let verticalProfileCounter = 0; let sandwichPanelCounter = 0; let doorwayPostCounter = 0; let woodEndProfileCounter = 0; let lengthCache = 0; let woodFrameCounter = 0; let fullWood = false;
                let poleAdaptation = getPoleSize("y"); let depthAdaptation = -0.026; let heightAdaptation = 0.26; let doorwayPostL2Adaptation = 0;

                if (rearSpecs.isPartitionWallEnabled(-1) == 2) {
                    depthAdaptation = -0.08;
                    heightAdaptation = 0.29;
                    doorwayPostL2Adaptation = 0.04;
                }

                for (let i = 0; i < rearSpecs.wallSpecs.length; i++) {
                    if (rearSpecs.wallSpecs[0].fillType == "fillTypeWood" && rearSpecs.wallSpecs.length == 1)
                        fullWood = true;

                    if (rearSpecs.wallSpecs[i].fillType == "fillTypeWood") {
                        let framePosition = totalLength;
                        for (let x = 0; x < ((rearSpecs.wallSpecs[i].width / 1000) / woodFrameSectionWidth); x++) {
                            if (!getObjectByName(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter]))
                                rearSpecs.integratedWallWoodFrameCache[woodFrameCounter] = cloneObject("Integrated wall_wood_frame.0", 1000);

                            setObjTransform(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", -(conservatoryWidth / 2) + framePosition + poleAdaptation + woodFrameSectionWidth / 2, -depthAdaptation, '', false);
                            setObjTransform(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], "rotation", '', '', -90, false);

                            setMorphFactor(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            setMorphFactor(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', (((woodFrameSectionWidth) - 1) / 99));

                            if ((rearSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x) < woodFrameSectionWidth) {
                                setObjTransform(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", -(conservatoryWidth / 2) + framePosition + poleAdaptation + ((rearSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) / 2, '', '', false);
                                setMorphFactor(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', ((((rearSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) - 1) / 99));
                            }
                            changeVis(rearSpecs.integratedWallWoodFrameCache[woodFrameCounter], true);
                            woodFrameCounter++; framePosition += woodFrameSectionWidth;
                        }

                        while ((totalLength + (woodThickness * (rearSpecs.wallSpecs[i].width % 135 == 0) / 2)) < rearSpecs.wallSpecs[i].width / 1000 + lengthCache) {
                            if (rearSpecs.integratedWallWoodCache.length <= woodCounter)
                                rearSpecs.integratedWallWoodCache[woodCounter] = [cloneObject("Integrated wall_wood_exterior_90.0", 1000), cloneObject("Integrated wall_wood_interior_90.0", 1000)];
                            if (!rearSpecs.integratedWallWoodShortCache.length)
                                rearSpecs.integratedWallWoodShortCache = [[cloneObject("Integrated wall_wood_exterior_short5_90.0", 5), cloneObject("Integrated wall_wood_interior_short5_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short15_90.0", 5), cloneObject("Integrated wall_wood_interior_short15_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short25_90.0", 5), cloneObject("Integrated wall_wood_interior_short25_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short35_90.0", 5), cloneObject("Integrated wall_wood_interior_short35_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short45_90.0", 5), cloneObject("Integrated wall_wood_interior_short45_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short55_90.0", 5), cloneObject("Integrated wall_wood_interior_short55_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short65_90.0", 5), cloneObject("Integrated wall_wood_interior_short65_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short75_90.0", 5), cloneObject("Integrated wall_wood_interior_short75_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short85_90.0", 5), cloneObject("Integrated wall_wood_interior_short85_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short95_90.0", 5), cloneObject("Integrated wall_wood_interior_short95_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short105_90.0", 5), cloneObject("Integrated wall_wood_interior_short105_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short115_90.0", 5), cloneObject("Integrated wall_wood_interior_short115_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short125_90.0", 5), cloneObject("Integrated wall_wood_interior_short125_90.0", 5)]];

                            for (let x = 0; x <= 1; x++) {
                                for (let y = 0; y < rearSpecs.integratedWallWoodShortCache.length; y++) {
                                    setObjTransform(rearSpecs.integratedWallWoodCache[woodCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation + woodThickness / 2, -depthAdaptation, '', false);
                                    setObjTransform(rearSpecs.integratedWallWoodShortCache[y][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation + woodThickness / 2, -depthAdaptation, '', false);

                                    setObjTransform(rearSpecs.integratedWallWoodCache[woodCounter][x], "rotation", '', '', -90, false);
                                    setObjTransform(rearSpecs.integratedWallWoodShortCache[y][x], "rotation", '', '', -90, false);

                                    setMorphFactor(rearSpecs.integratedWallWoodCache[woodCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                    setMorphFactor(rearSpecs.integratedWallWoodShortCache[y][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                }
                            }

                            if ((totalLength + woodThickness > rearSpecs.wallSpecs[i].width / 1000 + lengthCache) && rearSpecs.wallSpecs[i].width % 135 != 0) {
                                let index = parseInt(((rearSpecs.wallSpecs[i].width / 1000) % woodThickness) * 100);
                                if (index > 12)
                                    index = 12;
                                if (index < 0)
                                    index = 0;

                                changeVis(rearSpecs.integratedWallWoodShortCache[index][0], rearSpecs.wallSpecs[i].fill == "woodworkOutside" || rearSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(rearSpecs.integratedWallWoodShortCache[index][1], rearSpecs.wallSpecs[i].fill == "woodworkInside" || rearSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += (rearSpecs.wallSpecs[i].width / 1000) % woodThickness;
                                break;
                            }
                            else {
                                changeVis(rearSpecs.integratedWallWoodCache[woodCounter][0], rearSpecs.wallSpecs[i].fill == "woodworkOutside" || rearSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(rearSpecs.integratedWallWoodCache[woodCounter][1], rearSpecs.wallSpecs[i].fill == "woodworkInside" || rearSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += woodThickness; woodCounter++;
                            }
                        }

                        if (!getObjectByName(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter])) {
                            rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                            rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                        }
                        setObjTransform(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "position", -(conservatoryWidth / 2) + lengthCache + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "rotation", '', '', -90, false);
                        lengthCache = totalLength;
                        setObjTransform(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "position", -(conservatoryWidth / 2) + lengthCache + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "rotation", '', '', -90, false);

                        setMorphFactor(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        setMorphFactor(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        if (i == 0)
                            changeVis(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);
                        else if (rearSpecs.wallSpecs[i - 1].fillType != "fillTypeWood")
                            changeVis(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);

                        if (rearSpecs.wallSpecs[i + 1]) {
                            if (rearSpecs.wallSpecs[i + 1].fillType != "fillTypeWood")
                                changeVis(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);
                        }
                        else
                            changeVis(rearSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);

                        woodEndProfileCounter += 2;
                    }

                    if ((rearSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rearSpecs.wallSpecs[i].fillType == "fillTypeSheet") && ((i > 0))) {
                        if (!getObjectByName(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                            setMorphFactor(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }

                        if (rearSpecs.wallSpecs[i - 1].fillType != "fillTypeGlass" && rearSpecs.wallSpecs[i - 1].fillType != "fillTypeSheet")
                            changeVis(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);
                        else
                            changeVis(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);

                        verticalProfileCounter++;
                    }

                    if ((rearSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rearSpecs.wallSpecs[i].fillType == "fillTypeSheet") && i == 0 && rearSpecs.isPartitionWallEnabled(-1) == 2) {
                        if (!getObjectByName(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                            setMorphFactor(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);

                        verticalProfileCounter++;
                    }

                    if (rearSpecs.wallSpecs[i].fillType == "fillTypeGlass") {
                        if (!getObjectByName(rearSpecs.integratedWallGlassCache[glassCounter]))
                            rearSpecs.integratedWallGlassCache[glassCounter] = cloneObject("Integrated wall_glass.0", 1000, true, true);

                        setObjTransform(rearSpecs.integratedWallGlassCache[glassCounter], "position", -(conservatoryWidth / 2) + totalLength + (rearSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallGlassCache[glassCounter], "rotation", '', '', -90, false);

                        setMorphFactor(rearSpecs.integratedWallGlassCache[glassCounter], 'Length', ((rearSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(rearSpecs.integratedWallGlassCache[glassCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(rearSpecs.integratedWallGlassCache[glassCounter], true);

                        if (rearSpecs.wallSpecs[i].glassColor == 'none') {
                            setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                            setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                        }
                        else {
                            if (rearSpecs.wallSpecs[i].glassColor.code == 'glass_Clear') {
                                setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0);
                            }
                            else if (rearSpecs.wallSpecs[i].glassColor.code == 'glass_Opal') {
                                setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.8);
                            }
                            else {
                                setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.5);
                                setMaterialValue(getObjectMaterial(rearSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.25);
                            }
                        }

                        totalLength += rearSpecs.wallSpecs[i].width / 1000; glassCounter++; lengthCache = totalLength;
                    }
                    if (rearSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter]))
                            rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter] = [cloneObject("Integrated wall_sandwich panelAA.0", 1000), cloneObject("Integrated wall_sandwich panelWW.0", 1000), cloneObject("Integrated wall_sandwich panelRW.0", 1000)];

                        for (let y = 0; y < rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter].length; y++) {
                            setObjTransform(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "position", -(conservatoryWidth / 2) + totalLength + (rearSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "rotation", '', '', -90, false);

                            setMorphFactor(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Length', ((rearSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                            setMorphFactor(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        if (rearSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichWhite")
                            changeVis(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][1], true);
                        else if (rearSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichTile")
                            changeVis(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][2], true);
                        else
                            changeVis(rearSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][0], true);

                        totalLength += rearSpecs.wallSpecs[i].width / 1000; sandwichPanelCounter++; lengthCache = totalLength;
                    }
                    if (rearSpecs.wallSpecs[i].fillType == "fillTypeNone") {
                        if (!getObjectByName(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter])) {
                            rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter] = cloneObject("Integrated wall_doorway post.0", 1000);
                            rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1] = cloneObject("Integrated wall_doorway post.0", 1000);
                        }
                        setObjTransform(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation + 0.01, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "rotation", '', '', 90, false);

                        setMorphFactor(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        setObjTransform(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "position", -(conservatoryWidth / 2) + totalLength + rearSpecs.wallSpecs[i].width / 1000 + poleAdaptation - 0.01, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "rotation", '', '', 90, false);

                        setMorphFactor(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        changeVis(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], i != 0);
                        changeVis(rearSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], rearSpecs.wallSpecs[i + 1]);

                        totalLength += rearSpecs.wallSpecs[i].width / 1000; doorwayPostCounter += 2; lengthCache = totalLength;
                    }
                    if (rearSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rearSpecs.wallSpecs[i].fillType == "fillTypeWood" || rearSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(rearSpecs.integratedWallBottomProfileCache[i]))
                            rearSpecs.integratedWallBottomProfileCache[i] = cloneObject("Integrated wall_bottom profile.0", 1000);

                        setObjTransform(rearSpecs.integratedWallBottomProfileCache[i], "position", -(conservatoryWidth / 2) + totalLength - (rearSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallBottomProfileCache[i], "rotation", '', '', -90, false);

                        setMorphFactor(rearSpecs.integratedWallBottomProfileCache[i], 'Length', ((rearSpecs.wallSpecs[i].width / 1000 - 1) / 100));

                        changeVis(rearSpecs.integratedWallBottomProfileCache[i], true);

                        if (!getObjectByName(rearSpecs.integratedWallTopProfileCache[i]))
                            rearSpecs.integratedWallTopProfileCache[i] = cloneObject("Integrated wall_top profile.0", 1000);

                        setObjTransform(rearSpecs.integratedWallTopProfileCache[i], "position", -(conservatoryWidth / 2) + totalLength - (rearSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(rearSpecs.integratedWallTopProfileCache[i], "rotation", '', '', -90, false);

                        setMorphFactor(rearSpecs.integratedWallTopProfileCache[i], 'Length', ((rearSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(rearSpecs.integratedWallTopProfileCache[i], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(rearSpecs.integratedWallTopProfileCache[i], true);
                    }

                    if (rearSpecs.wallSpecs[i + 1] && (rearSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rearSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (rearSpecs.wallSpecs[i + 1].fillType == "fillTypeGlass" || rearSpecs.wallSpecs[i + 1].fillType == "fillTypeSheet") {
                            if (!getObjectByName(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                                setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                                setMorphFactor(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);
                            verticalProfileCounter++;
                        }
                        if (rearSpecs.wallSpecs[i + 1].fillType == "fillTypeWood" || rearSpecs.wallSpecs[i + 1].fillType == "fillTypeNone") {
                            if (!getObjectByName(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                                setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                                setMorphFactor(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                            verticalProfileCounter++;
                        }
                    }
                    if (!rearSpecs.wallSpecs[i + 1] && rearSpecs.isPartitionWallEnabled(-1) == 2 && (rearSpecs.wallSpecs[i].fillType == "fillTypeGlass" || rearSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (!getObjectByName(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                            setMorphFactor(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(rearSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                        verticalProfileCounter++;
                    }
                }
            }

            if (standaloneSpecs.isPartitionWallEnabled(-1)) {
                let totalLength = 0; let woodCounter = 0; let glassCounter = 0; let verticalProfileCounter = 0; let sandwichPanelCounter = 0; let doorwayPostCounter = 0; let woodEndProfileCounter = 0; let lengthCache = 0; let woodFrameCounter = 0; let fullWood = false;
                let poleAdaptation = 0; let depthAdaptation = -0.026; let heightAdaptation = 0.26; let doorwayPostL2Adaptation = 0;

                /* if (totalHeightOld < totalHeight || conservatoryWidthOld < conservatoryWidth)
                    cameraPosition(); */

                if (standaloneSpecs.isPartitionWallEnabled(-1) == 2) {
                    depthAdaptation = -0.08;
                    heightAdaptation = 0.29;
                    doorwayPostL2Adaptation = 0.04;
                }

                for (let i = 0; i < standaloneSpecs.wallSpecs.length; i++) {
                    if (standaloneSpecs.wallSpecs[0].fillType == "fillTypeWood" && standaloneSpecs.wallSpecs.length == 1)
                        fullWood = true;

                    if (standaloneSpecs.wallSpecs[i].fillType == "fillTypeWood") {
                        let framePosition = totalLength;
                        for (let x = 0; x < ((standaloneSpecs.wallSpecs[i].width / 1000) / woodFrameSectionWidth); x++) {
                            if (!getObjectByName(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter]))
                                standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter] = cloneObject("Integrated wall_wood_frame.0", 1000);

                            setObjTransform(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", -(conservatoryWidth / 2) + framePosition + poleAdaptation + woodFrameSectionWidth / 2, -depthAdaptation, '', false);
                            setObjTransform(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], "rotation", '', '', -90, false);

                            setMorphFactor(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            setMorphFactor(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', (((woodFrameSectionWidth) - 1) / 99));

                            if ((standaloneSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x) < woodFrameSectionWidth) {
                                setObjTransform(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], "position", -(conservatoryWidth / 2) + framePosition + poleAdaptation + ((standaloneSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) / 2, '', '', false);
                                setMorphFactor(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], 'Width', ((((standaloneSpecs.wallSpecs[i].width / 1000) - (woodFrameSectionWidth * x)) - 1) / 99));
                            }
                            changeVis(standaloneSpecs.integratedWallWoodFrameCache[woodFrameCounter], true);
                            woodFrameCounter++; framePosition += woodFrameSectionWidth;
                        }

                        while ((totalLength + (woodThickness * (standaloneSpecs.wallSpecs[i].width % 135 == 0) / 2)) < standaloneSpecs.wallSpecs[i].width / 1000 + lengthCache) {
                            if (standaloneSpecs.integratedWallWoodCache.length <= woodCounter)
                                standaloneSpecs.integratedWallWoodCache[woodCounter] = [cloneObject("Integrated wall_wood_exterior_90.0", 1000), cloneObject("Integrated wall_wood_interior_90.0", 1000)];
                            if (!standaloneSpecs.integratedWallWoodShortCache.length)
                                standaloneSpecs.integratedWallWoodShortCache = [[cloneObject("Integrated wall_wood_exterior_short5_90.0", 5), cloneObject("Integrated wall_wood_interior_short5_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short15_90.0", 5), cloneObject("Integrated wall_wood_interior_short15_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short25_90.0", 5), cloneObject("Integrated wall_wood_interior_short25_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short35_90.0", 5), cloneObject("Integrated wall_wood_interior_short35_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short45_90.0", 5), cloneObject("Integrated wall_wood_interior_short45_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short55_90.0", 5), cloneObject("Integrated wall_wood_interior_short55_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short65_90.0", 5), cloneObject("Integrated wall_wood_interior_short65_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short75_90.0", 5), cloneObject("Integrated wall_wood_interior_short75_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short85_90.0", 5), cloneObject("Integrated wall_wood_interior_short85_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short95_90.0", 5), cloneObject("Integrated wall_wood_interior_short95_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short105_90.0", 5), cloneObject("Integrated wall_wood_interior_short105_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short115_90.0", 5), cloneObject("Integrated wall_wood_interior_short115_90.0", 5)], [cloneObject("Integrated wall_wood_exterior_short125_90.0", 5), cloneObject("Integrated wall_wood_interior_short125_90.0", 5)]];

                            for (let x = 0; x <= 1; x++) {
                                for (let y = 0; y < standaloneSpecs.integratedWallWoodShortCache.length; y++) {
                                    setObjTransform(standaloneSpecs.integratedWallWoodCache[woodCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation + woodThickness / 2, -depthAdaptation, '', false);
                                    setObjTransform(standaloneSpecs.integratedWallWoodShortCache[y][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation + woodThickness / 2, -depthAdaptation, '', false);

                                    setObjTransform(standaloneSpecs.integratedWallWoodCache[woodCounter][x], "rotation", '', '', -90, false);
                                    setObjTransform(standaloneSpecs.integratedWallWoodShortCache[y][x], "rotation", '', '', -90, false);

                                    setMorphFactor(standaloneSpecs.integratedWallWoodCache[woodCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                    setMorphFactor(standaloneSpecs.integratedWallWoodShortCache[y][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                                }
                            }

                            if ((totalLength + woodThickness > standaloneSpecs.wallSpecs[i].width / 1000 + lengthCache) && standaloneSpecs.wallSpecs[i].width % 135 != 0) {
                                let index = parseInt(((standaloneSpecs.wallSpecs[i].width / 1000) % woodThickness) * 100);
                                if (index > 12)
                                    index = 12;
                                if (index < 0)
                                    index = 0;

                                changeVis(standaloneSpecs.integratedWallWoodShortCache[index][0], standaloneSpecs.wallSpecs[i].fill == "woodworkOutside" || standaloneSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(standaloneSpecs.integratedWallWoodShortCache[index][1], standaloneSpecs.wallSpecs[i].fill == "woodworkInside" || standaloneSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += (standaloneSpecs.wallSpecs[i].width / 1000) % woodThickness
                                break;
                            }
                            else {
                                changeVis(standaloneSpecs.integratedWallWoodCache[woodCounter][0], standaloneSpecs.wallSpecs[i].fill == "woodworkOutside" || standaloneSpecs.wallSpecs[i].fill == "woodworkBoth");
                                changeVis(standaloneSpecs.integratedWallWoodCache[woodCounter][1], standaloneSpecs.wallSpecs[i].fill == "woodworkInside" || standaloneSpecs.wallSpecs[i].fill == "woodworkBoth");

                                totalLength += woodThickness; woodCounter++;
                            }
                        }

                        if (!getObjectByName(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter])) {
                            standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                            standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1] = cloneObject("Integrated wall_wood_end_profile.0", 1000);
                        }
                        setObjTransform(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "position", -(conservatoryWidth / 2) + lengthCache + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], "rotation", '', '', -90, false);
                        lengthCache = totalLength;
                        setObjTransform(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "position", -(conservatoryWidth / 2) + lengthCache + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], "rotation", '', '', -90, false);

                        setMorphFactor(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        setMorphFactor(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        if (i == 0)
                            changeVis(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);
                        else if (standaloneSpecs.wallSpecs[i - 1].fillType != "fillTypeWood")
                            changeVis(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter], true);

                        if (standaloneSpecs.wallSpecs[i + 1]) {
                            if (standaloneSpecs.wallSpecs[i + 1].fillType != "fillTypeWood")
                                changeVis(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);
                        }
                        else
                            changeVis(standaloneSpecs.integratedWallWoodEndProfileCache[woodEndProfileCounter + 1], true);

                        woodEndProfileCounter += 2;
                    }

                    if ((standaloneSpecs.wallSpecs[i].fillType == "fillTypeGlass" || standaloneSpecs.wallSpecs[i].fillType == "fillTypeSheet") && ((i > 0))) {
                        if (!getObjectByName(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                            setMorphFactor(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }

                        if (standaloneSpecs.wallSpecs[i - 1].fillType != "fillTypeGlass" && standaloneSpecs.wallSpecs[i - 1].fillType != "fillTypeSheet")
                            changeVis(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);
                        else
                            changeVis(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);

                        verticalProfileCounter++;
                    }

                    if ((standaloneSpecs.wallSpecs[i].fillType == "fillTypeGlass" || standaloneSpecs.wallSpecs[i].fillType == "fillTypeSheet") && i == 0 && standaloneSpecs.isPartitionWallEnabled(-1) == 2) {
                        if (!getObjectByName(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                            setMorphFactor(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][0], true);

                        verticalProfileCounter++;
                    }

                    if (standaloneSpecs.wallSpecs[i].fillType == "fillTypeGlass") {
                        if (!getObjectByName(standaloneSpecs.integratedWallGlassCache[glassCounter]))
                            standaloneSpecs.integratedWallGlassCache[glassCounter] = cloneObject("Integrated wall_glass.0", 1000, true, true);

                        setObjTransform(standaloneSpecs.integratedWallGlassCache[glassCounter], "position", -(conservatoryWidth / 2) + totalLength + (standaloneSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallGlassCache[glassCounter], "rotation", '', '', -90, false);

                        setMorphFactor(standaloneSpecs.integratedWallGlassCache[glassCounter], 'Length', ((standaloneSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(standaloneSpecs.integratedWallGlassCache[glassCounter], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(standaloneSpecs.integratedWallGlassCache[glassCounter], true);

                        if (standaloneSpecs.wallSpecs[i].glassColor == 'none') {
                            setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.78);
                            setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.2);
                        }

                        else {
                            if (standaloneSpecs.wallSpecs[i].glassColor.code == 'glass_Clear') {
                                setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0);

                            }
                            else if (standaloneSpecs.wallSpecs[i].glassColor.code == 'glass_Opal') {
                                setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0);
                                setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.6);

                            }
                            else {
                                setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'NoGlass', 0.78);
                                setMaterialValue(getObjectMaterial(standaloneSpecs.integratedWallGlassCache[glassCounter], 1, true), 'Tint', 0.2);
                            }
                        }

                        totalLength += standaloneSpecs.wallSpecs[i].width / 1000; glassCounter++; lengthCache = totalLength;

                        ////////// Glass color
                        /* setMaterialValue('FixedWallGlass', 'NoGlass', 0);
                        setMaterialValue('FixedWallGlass', 'Tint', 0.2); */

                    }
                    if (standaloneSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter]))
                            standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter] = [cloneObject("Integrated wall_sandwich panelAA.0", 1000), cloneObject("Integrated wall_sandwich panelWW.0", 1000), cloneObject("Integrated wall_sandwich panelRW.0", 1000)];

                        for (let y = 0; y < standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter].length; y++) {
                            setObjTransform(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "position", -(conservatoryWidth / 2) + totalLength + (standaloneSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], "rotation", '', '', -90, false);

                            setMorphFactor(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Length', ((standaloneSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                            setMorphFactor(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][y], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        if (standaloneSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichWhite")
                            changeVis(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][1], true);
                        else if (standaloneSpecs.wallSpecs[i].fill == "sheetTypePlasticChoicePlasticSandwichTile")
                            changeVis(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][2], true);
                        else
                            changeVis(standaloneSpecs.integratedWallSandwichPanelCache[sandwichPanelCounter][0], true);

                        totalLength += standaloneSpecs.wallSpecs[i].width / 1000; sandwichPanelCounter++; lengthCache = totalLength;
                    }
                    if (standaloneSpecs.wallSpecs[i].fillType == "fillTypeNone") {
                        if (!getObjectByName(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter])) {
                            standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter] = cloneObject("Integrated wall_doorway post.0", 1000);
                            standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1] = cloneObject("Integrated wall_doorway post.0", 1000);
                        }
                        setObjTransform(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation + 0.01, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], "rotation", '', '', 90, false);

                        setMorphFactor(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        setObjTransform(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "position", -(conservatoryWidth / 2) + totalLength + standaloneSpecs.wallSpecs[i].width / 1000 + poleAdaptation - 0.01, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], "rotation", '', '', 90, false);

                        setMorphFactor(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], 'Height', (((totalHeight - heightAdaptation + doorwayPostL2Adaptation) - 1) / 99));

                        changeVis(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter], i != 0);
                        changeVis(standaloneSpecs.integratedWallDoorwayPostCache[doorwayPostCounter + 1], standaloneSpecs.wallSpecs[i + 1]);

                        totalLength += standaloneSpecs.wallSpecs[i].width / 1000; doorwayPostCounter += 2; lengthCache = totalLength;
                    }
                    if (standaloneSpecs.wallSpecs[i].fillType == "fillTypeGlass" || standaloneSpecs.wallSpecs[i].fillType == "fillTypeWood" || standaloneSpecs.wallSpecs[i].fillType == "fillTypeSheet") {
                        if (!getObjectByName(standaloneSpecs.integratedWallBottomProfileCache[i]))
                            standaloneSpecs.integratedWallBottomProfileCache[i] = cloneObject("Integrated wall_bottom profile.0", 1000);


                        setObjTransform(standaloneSpecs.integratedWallBottomProfileCache[i], "position", -(conservatoryWidth / 2) + totalLength - (standaloneSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallBottomProfileCache[i], "rotation", '', '', -90, false);

                        setMorphFactor(standaloneSpecs.integratedWallBottomProfileCache[i], 'Length', ((standaloneSpecs.wallSpecs[i].width / 1000 - 1) / 100));

                        changeVis(standaloneSpecs.integratedWallBottomProfileCache[i], true);

                        if (!getObjectByName(standaloneSpecs.integratedWallTopProfileCache[i]))
                            standaloneSpecs.integratedWallTopProfileCache[i] = cloneObject("Integrated wall_top profile.0", 1000);

                        setObjTransform(standaloneSpecs.integratedWallTopProfileCache[i], "position", -(conservatoryWidth / 2) + totalLength - (standaloneSpecs.wallSpecs[i].width / 1000 / 2) + poleAdaptation, -depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.integratedWallTopProfileCache[i], "rotation", '', '', -90, false);

                        setMorphFactor(standaloneSpecs.integratedWallTopProfileCache[i], 'Length', ((standaloneSpecs.wallSpecs[i].width / 1000 - 1) / 100));
                        setMorphFactor(standaloneSpecs.integratedWallTopProfileCache[i], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));

                        changeVis(standaloneSpecs.integratedWallTopProfileCache[i], true);
                    }

                    if (standaloneSpecs.wallSpecs[i + 1] && (standaloneSpecs.wallSpecs[i].fillType == "fillTypeGlass" || standaloneSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (standaloneSpecs.wallSpecs[i + 1].fillType == "fillTypeGlass" || standaloneSpecs.wallSpecs[i + 1].fillType == "fillTypeSheet") {
                            if (!getObjectByName(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                                setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                                setMorphFactor(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][1], true);
                            verticalProfileCounter++;
                        }
                        if (standaloneSpecs.wallSpecs[i + 1].fillType == "fillTypeWood" || standaloneSpecs.wallSpecs[i + 1].fillType == "fillTypeNone") {
                            if (!getObjectByName(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                                standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                            for (let x = 0; x <= 2; x++) {
                                setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                                setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                                setMorphFactor(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                            }
                            changeVis(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                            verticalProfileCounter++;
                        }
                    }
                    if (!standaloneSpecs.wallSpecs[i + 1] && standaloneSpecs.isPartitionWallEnabled(-1) == 2 && (standaloneSpecs.wallSpecs[i].fillType == "fillTypeGlass" || standaloneSpecs.wallSpecs[i].fillType == "fillTypeSheet")) {
                        if (!getObjectByName(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter]))
                            standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter] = [cloneObject("Integrated wall_panel_start_profile.0", 1000), cloneObject("Integrated wall_panel_mid_profile.0", 1000), cloneObject("Integrated wall_panel_end_profile.0", 1000)];

                        for (let x = 0; x <= 2; x++) {
                            setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "position", -(conservatoryWidth / 2) + totalLength + poleAdaptation, -depthAdaptation, '', false);
                            setObjTransform(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], "rotation", '', '', -90, false);
                            setMorphFactor(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][x], 'Height', (((totalHeight - heightAdaptation) - 1) / 99));
                        }
                        changeVis(standaloneSpecs.integratedWallVerticalProfileCache[verticalProfileCounter][2], true);
                        verticalProfileCounter++;
                    }
                }
            }
        }

        function enableIntegratedVerticalScreen() {
            if (!isHorizontalRoof)
                return;

            setMorphFactor("Horizontal_Gutter_Left_Vertical sunblind", 'Height', (totalHeight - 0.26) / 100);
            setMorphFactor("Horizontal_Gutter_Right_Vertical sunblind", 'Height', (totalHeight - 0.26) / 100);
            setMorphFactor("Horizontal_Gutter_Front_Vertical sunblind", 'Height', (totalHeight - 0.26) / 100);
            setMorphFactor("Horizontal_Gutter_Rear_Vertical sunblind", 'Height', (totalHeight - 0.26) / 100);

            verticalScreenColors();

            for (let i = 20; i <= 39; i++)
                setVerticalScreenOpening(oldVerticalScreenOpening[i], i);
        }

        function verticalScreenColors() {
            /* if (frontSpecs.isVerticalScreenEnabled(1) || frontSpecs.isIntegratedVerticalScreenEnabled(1)) {
                let color1 = new v3d.Color(parseInt("0x" + frontSpecs.verticalScreenColors[0][0])); let color2 = new v3d.Color(parseInt("0x" + frontSpecs.verticalScreenColors[0][1])); let color3 = new v3d.Color(parseInt("0x" + frontSpecs.verticalScreenColors[0][2]));

                if (!color2)
                    color2 = color1;
                if (!color3)
                    color3 = color1;

                console.log(color1.r, color1.g, color1.b);

                setMaterialColor('ScreenFabricFront.000', 'Color 1', color1.r, color1.g, color1.b, '');
                setMaterialColor('ScreenFabricFront.000', 'Color 2', color2.r, color2.g, color2.b, '');
                setMaterialColor('ScreenFabricFront.000', 'Color 3', color3.r, color3.g, color3.b, '');

                setMaterialColor('ScreenFabricFront_round', 'Color 1', color1.r, color1.g, color1.b, '');
                setMaterialColor('ScreenFabricFront_round', 'Color 2', color2.r, color2.g, color2.b, '');
                setMaterialColor('ScreenFabricFront_round', 'Color 3', color3.r, color3.g, color3.b, '');
            } */
            for (let i = 0; leftSpecs.poleAmount >= i; i++) {
                if (leftSpecs.isVerticalScreenEnabled(i) || leftSpecs.isIntegratedVerticalScreenEnabled(i)) {
                    let color1 = new v3d.Color(parseInt("0x" + leftSpecs.verticalScreenColors[i][0])); let color2 = new v3d.Color(parseInt("0x" + leftSpecs.verticalScreenColors[i][1])); let color3 = new v3d.Color(parseInt("0x" + leftSpecs.verticalScreenColors[i][2]));

                    if (!color2)
                        color2 = color1;
                    if (!color3)
                        color3 = color1;

                    setMaterialColor('ScreenFabricLeft.00' + i, 'Color 1', color1.r, color1.g, color1.b, '');
                    setMaterialColor('ScreenFabricLeft.00' + i, 'Color 2', color2.r, color2.g, color2.b, '');
                    setMaterialColor('ScreenFabricLeft.00' + i, 'Color 3', color3.r, color3.g, color3.b, '');
                }
            }
            for (let i = 0; rightSpecs.poleAmount >= i; i++) {
                if (rightSpecs.isVerticalScreenEnabled(i) || rightSpecs.isIntegratedVerticalScreenEnabled(i)) {
                    let color1 = new v3d.Color(parseInt("0x" + rightSpecs.verticalScreenColors[i][0])); let color2 = new v3d.Color(parseInt("0x" + rightSpecs.verticalScreenColors[i][1])); let color3 = new v3d.Color(parseInt("0x" + rightSpecs.verticalScreenColors[i][2]));

                    if (!color2)
                        color2 = color1;
                    if (!color3)
                        color3 = color1;

                    setMaterialColor('ScreenFabricRight.00' + i, 'Color 1', color1.r, color1.g, color1.b, '');
                    setMaterialColor('ScreenFabricRight.00' + i, 'Color 2', color2.r, color2.g, color2.b, '');
                    setMaterialColor('ScreenFabricRight.00' + i, 'Color 3', color3.r, color3.g, color3.b, '');
                }
            }
            for (let i = 0; frontSpecs.poleAmount >= i; i++) {
                if (frontSpecs.isVerticalScreenEnabled(i) || frontSpecs.isIntegratedVerticalScreenEnabled(i)) {
                    let color1 = new v3d.Color(parseInt("0x" + frontSpecs.verticalScreenColors[i][0])); let color2 = new v3d.Color(parseInt("0x" + frontSpecs.verticalScreenColors[i][1])); let color3 = new v3d.Color(parseInt("0x" + frontSpecs.verticalScreenColors[i][2]));

                    if (!color2)
                        color2 = color1;
                    if (!color3)
                        color3 = color1;

                    setMaterialColor('ScreenFabricFront.00' + i, 'Color 1', color1.r, color1.g, color1.b, '');
                    setMaterialColor('ScreenFabricFront.00' + i, 'Color 2', color2.r, color2.g, color2.b, '');
                    setMaterialColor('ScreenFabricFront.00' + i, 'Color 3', color3.r, color3.g, color3.b, '');
                }
            }
            for (let i = 0; rearSpecs.poleAmount >= i; i++) {
                if (rearSpecs.isVerticalScreenEnabled(i) || rearSpecs.isIntegratedVerticalScreenEnabled(i)) {
                    let color1 = new v3d.Color(parseInt("0x" + rearSpecs.verticalScreenColors[i][0])); let color2 = new v3d.Color(parseInt("0x" + rearSpecs.verticalScreenColors[i][1])); let color3 = new v3d.Color(parseInt("0x" + rearSpecs.verticalScreenColors[i][2]));

                    if (!color2)
                        color2 = color1;
                    if (!color3)
                        color3 = color1;

                    setMaterialColor('ScreenFabricRear.00' + i, 'Color 1', color1.r, color1.g, color1.b, '');
                    setMaterialColor('ScreenFabricRear.00' + i, 'Color 2', color2.r, color2.g, color2.b, '');
                    setMaterialColor('ScreenFabricRear.00' + i, 'Color 3', color3.r, color3.g, color3.b, '');
                }
            }
        }

        function setVerticalScreenOpening(percentage, side) {
            let climacrownAdjustment = 0;
            if (climacrownEnabled)
                climacrownAdjustment = 0.08;

            let verticalScreenHeight = [gutterHeight - 0.34 + climacrownAdjustment, gutterHeight - 0.2, gutterHeight + triangleRearHeight - 0.2];//front,sides,back
            if (isHorizontalRoof)
                verticalScreenHeight = [totalHeight - 0.445, totalHeight - 0.445, totalHeight - 0.445];

            if (percentage > 100)
                percentage = 100;
            else if (percentage < 0)
                percentage = 0;

            if (side <= 9)
                setMorphFactor(singleClickObjList[side], 'Opening', (((verticalScreenHeight[0] / 99)) / 100) * percentage);
            else if (side <= 14)
                setMorphFactor(singleClickObjList[side], 'Opening', (((verticalScreenHeight[1] / 99)) / 100) * percentage);
            else if (side <= 19)
                setMorphFactor(singleClickObjList[side], 'Opening', (((verticalScreenHeight[2] / 99)) / 100) * percentage);
            else if (side <= 39)
                setMorphFactor(singleClickObjList[side], 'Opening', ((((totalHeight - 0.32) / 99)) / 100) * percentage);
        }

        function setHorizontalScreenOpening(percentage, side) {
            if (percentage > 100)
                percentage = 100;
            else if (percentage < 0)
                percentage = 0;

            if (side == 0)
                setMorphFactor("Horizontal screen zipper top.0", 'Opening', ((((conservatoryDepth - 0.25) / 99)) / 100) * percentage);
            if (side == 1)
                setMorphFactor("Horizontal screen non zipper top.0", 'Opening', ((((conservatoryDepth - 0.25) / 99)) / 100) * percentage);
            else
                setMorphFactor("Horizontal screen bottom.0", 'Opening', ((((conservatoryDepth - 0.25 - getPoleSize("y") * 2) / 99)) / 100) * percentage);
        }

        function calculatePolePos() {
            leftSpecs.calculatePoleYpos(getPoleSize('x'), getPoleSize('y'));
            rightSpecs.calculatePoleYpos(getPoleSize('x'), getPoleSize('y'));
            frontSpecs.calculatePoleXpos(getPoleSize('x'));
            rearSpecs.calculatePoleXpos(getPoleSize('x'));
        }

        function enableHorizontalVerandaPostSupports() {
            for (let i = 0; i <= 3; i++)
                if (i > horizontalVerandaPostSupportCache.length - 1)
                    horizontalVerandaPostSupportCache[i] = [cloneObject("Post bracket.0", 12), cloneObject("Post foundation.0", 12)];

            for (let i = 0; i <= 1; i++) {
                setObjTransform(horizontalVerandaPostSupportCache[0][i], "position", conservatoryWidth / 2, conservatoryDepth, -0.1 * (postSupportType[0] == "bracket_under"), false);
                setObjTransform(horizontalVerandaPostSupportCache[1][i], "position", -conservatoryWidth / 2, conservatoryDepth, -0.1 * (postSupportType[1] == "bracket_under"), false);
                setObjTransform(horizontalVerandaPostSupportCache[2][i], "position", conservatoryWidth / 2, 0, -0.1 * (postSupportType[2] == "bracket_under"), false);
                setObjTransform(horizontalVerandaPostSupportCache[3][i], "position", -conservatoryWidth / 2, 0, -0.1 * (postSupportType[3] == "bracket_under"), false);

                setObjTransform(horizontalVerandaPostSupportCache[0][i], "rotation", '', '', 180, false);
                setObjTransform(horizontalVerandaPostSupportCache[1][i], "rotation", '', '', -90, false);
                setObjTransform(horizontalVerandaPostSupportCache[2][i], "rotation", '', '', 90, false);
                setObjTransform(horizontalVerandaPostSupportCache[3][i], "rotation", '', '', 0, false);
            }

            if (postSupportType[0] == "bracket" || postSupportType[0] == "bracket_under")//left front
                changeVis(horizontalVerandaPostSupportCache[0][0], true);
            else if (postSupportType[0] == "foundation")
                changeVis(horizontalVerandaPostSupportCache[0][1], true);

            if (postSupportType[1] == "bracket" || postSupportType[1] == "bracket_under")//right front
                changeVis(horizontalVerandaPostSupportCache[1][0], true);
            else if (postSupportType[1] == "foundation")
                changeVis(horizontalVerandaPostSupportCache[1][1], true);

            if (postSupportType[2] == "bracket" || postSupportType[2] == "bracket_under")//left back
                changeVis(horizontalVerandaPostSupportCache[2][0], true);
            else if (postSupportType[2] == "foundation")
                changeVis(horizontalVerandaPostSupportCache[2][1], true);

            if (postSupportType[3] == "bracket" || postSupportType[3] == "bracket_under")//right back
                changeVis(horizontalVerandaPostSupportCache[3][0], true);
            else if (postSupportType[3] == "foundation")
                changeVis(horizontalVerandaPostSupportCache[3][1], true);
        }

        function enableHorizontalVerandaPostAccessories() {
            let objList = ["Horizontal_Corner_Post_Front_Left_Front_Integrated screen rail", "Horizontal_Corner_Post_Front_Left_Front_Integrated wall rail", "Horizontal_Corner_Post_Front_Left_Front_Rail plug", "Horizontal_Corner_Post_Front_Left_Left_Integrated screen rail", "Horizontal_Corner_Post_Front_Left_Left_Integrated wall rail", "Horizontal_Corner_Post_Front_Left_Left_Rail plug", "Horizontal_Corner_Post_Front_Right_Front_Integrated screen rail", "Horizontal_Corner_Post_Front_Right_Front_Integrated wall rail", "Horizontal_Corner_Post_Front_Right_Front_Rail plug", "Horizontal_Corner_Post_Front_Right_Right_Integrated screen rail", "Horizontal_Corner_Post_Front_Right_Right_Integrated wall rail", "Horizontal_Corner_Post_Front_Right_Right_Rail plug", "Horizontal_Corner_Post_Rear_Left_Left_Integrated wall rail", "Horizontal_Corner_Post_Rear_Left_Left_Integrated screen rail", "Horizontal_Corner_Post_Rear_Left_Left_Rail plug", "Horizontal_Corner_Post_Rear_Left_Rear_Integrated screen rail", "Horizontal_Corner_Post_Rear_Left_Rear_Integrated wall rail", "Horizontal_Corner_Post_Rear_Left_Rear_Rail plug", "Horizontal_Corner_Post_Rear_Right_Rear_Integrated screen rail", "Horizontal_Corner_Post_Rear_Right_Rear_Integrated wall rail", "Horizontal_Corner_Post_Rear_Right_Rear_Rail plug", "Horizontal_Corner_Post_Rear_Right_Right_Integrated screen rail", "Horizontal_Corner_Post_Rear_Right_Right_Integrated wall rail", "Horizontal_Corner_Post_Rear_Right_Right_Rail plug"]

            for (let i = 0; objList[i] != undefined; i++)
                setMorphFactor(objList[i], 'Height', (((totalHeight) - 1) / 99));

            if (leftSpecs.isIntegratedVerticalScreenEnabled(-1)) {
                changeVis("Horizontal_Corner_Post_Front_Left_Left_Integrated screen rail", true);
                changeVis("Horizontal_Corner_Post_Rear_Left_Left_Integrated screen rail", true);
            }
            else if (leftSpecs.isPartitionWallEnabled(-1) == 1) {
                changeVis("Horizontal_Corner_Post_Front_Left_Left_Integrated wall rail", true);
                changeVis("Horizontal_Corner_Post_Rear_Left_Left_Integrated wall rail", true);
            }
            else {
                changeVis("Horizontal_Corner_Post_Front_Left_Left_Rail plug", true);
                changeVis("Horizontal_Corner_Post_Rear_Left_Left_Rail plug", true);
            }

            if (rightSpecs.isIntegratedVerticalScreenEnabled(-1)) {
                changeVis("Horizontal_Corner_Post_Front_Right_Right_Integrated screen rail", true);
                changeVis("Horizontal_Corner_Post_Rear_Right_Right_Integrated screen rail", true);
            }
            else if (rightSpecs.isPartitionWallEnabled(-1) == 1) {
                changeVis("Horizontal_Corner_Post_Front_Right_Right_Integrated wall rail", true);
                changeVis("Horizontal_Corner_Post_Rear_Right_Right_Integrated wall rail", true);
            }
            else {
                changeVis("Horizontal_Corner_Post_Front_Right_Right_Rail plug", true);
                changeVis("Horizontal_Corner_Post_Rear_Right_Right_Rail plug", true);
            }

            if (frontSpecs.isIntegratedVerticalScreenEnabled(-1)) {
                changeVis("Horizontal_Corner_Post_Front_Left_Front_Integrated screen rail", true);
                changeVis("Horizontal_Corner_Post_Front_Right_Front_Integrated screen rail", true);
            }
            else if (frontSpecs.isPartitionWallEnabled(-1) == 1) {
                changeVis("Horizontal_Corner_Post_Front_Left_Front_Integrated wall rail", true);
                changeVis("Horizontal_Corner_Post_Front_Right_Front_Integrated wall rail", true);
            }
            else {
                changeVis("Horizontal_Corner_Post_Front_Left_Front_Rail plug", true);
                changeVis("Horizontal_Corner_Post_Front_Right_Front_Rail plug", true);
            }

            if (rearSpecs.isIntegratedVerticalScreenEnabled(-1)) {
                changeVis("Horizontal_Corner_Post_Rear_Right_Rear_Integrated screen rail", true);
                changeVis("Horizontal_Corner_Post_Rear_Left_Rear_Integrated screen rail", true);
            }
            else if (rearSpecs.isPartitionWallEnabled(-1) == 1) {
                changeVis("Horizontal_Corner_Post_Rear_Left_Rear_Integrated wall rail", true);
                changeVis("Horizontal_Corner_Post_Rear_Right_Rear_Integrated wall rail", true);
            }
            else {
                changeVis("Horizontal_Corner_Post_Rear_Left_Rear_Rail plug", true);
                changeVis("Horizontal_Corner_Post_Rear_Right_Rear_Rail plug", true);
            }
        }

        function enableHorizontalVerandaCrownbeamAccessories() {
            let objList = ["Horizontal_Gutter_Front_LED strip integrated", "Horizontal_Gutter_Front_LED strip integrated plug", "Horizontal_Gutter_Front_Rail plug", "Horizontal_Gutter_Front_Integrated wall", "Horizontal_Gutter_Front_Vertical sunblind", "Horizontal_Gutter_Left_Integrated wall", "Horizontal_Gutter_Left_LED strip integrated", "Horizontal_Gutter_Left_LED strip integrated plug", "Horizontal_Gutter_Left_Rail plug", "Horizontal_Gutter_Left_Vertical sunblind", "Horizontal_Gutter_Rear_Integrated wall", "Horizontal_Gutter_Rear_LED strip integrated", "Horizontal_Gutter_Rear_LED strip integrated plug", "Horizontal_Gutter_Rear_Rail plug", "Horizontal_Gutter_Rear_Vertical sunblind", "Horizontal_Gutter_Right_Integrated wall", "Horizontal_Gutter_Right_LED strip integrated", "Horizontal_Gutter_Right_LED strip integrated plug", "Horizontal_Gutter_Right_Rail plug", "Horizontal_Gutter_Right_Vertical sunblind"];

            for (let i = 0; objList[i] != undefined; i++) {
                if (objList[i].indexOf('Left') != -1 || objList[i].indexOf('Right') != -1)
                    setMorphFactor(objList[i], 'Width', (((conservatoryDepth - 2 * getPoleSize('x')) - 1) / 100));
                else
                    setMorphFactor(objList[i], 'Width', (((conservatoryWidth - 2 * getPoleSize('x')) - 1) / 100));
            }

            if (leftSpecs.isIntegratedLEDStripEnabled(-1))
                changeVis("Horizontal_Gutter_Left_LED strip integrated", true);
            else
                changeVis("Horizontal_Gutter_Left_LED strip integrated plug", true);

            if (rightSpecs.isIntegratedLEDStripEnabled(-1))
                changeVis("Horizontal_Gutter_Right_LED strip integrated", true);
            else
                changeVis("Horizontal_Gutter_Right_LED strip integrated plug", true);

            if (frontSpecs.isIntegratedLEDStripEnabled(-1))
                changeVis("Horizontal_Gutter_Front_LED strip integrated", true);
            else
                changeVis("Horizontal_Gutter_Front_LED strip integrated plug", true);

            if (rearSpecs.isIntegratedLEDStripEnabled(-1))
                changeVis("Horizontal_Gutter_Rear_LED strip integrated", true);
            else
                changeVis("Horizontal_Gutter_Rear_LED strip integrated plug", true);

            if (leftSpecs.isIntegratedVerticalScreenEnabled(-1))
                changeVis("Horizontal_Gutter_Left_Vertical sunblind", true);
            else
                changeVis("Horizontal_Gutter_Left_Rail plug", true);

            if (rightSpecs.isIntegratedVerticalScreenEnabled(-1))
                changeVis("Horizontal_Gutter_Right_Vertical sunblind", true);
            else
                changeVis("Horizontal_Gutter_Right_Rail plug", true);

            if (frontSpecs.isIntegratedVerticalScreenEnabled(-1))
                changeVis("Horizontal_Gutter_Front_Vertical sunblind", true);
            else
                changeVis("Horizontal_Gutter_Front_Rail plug", true);

            if (rearSpecs.isIntegratedVerticalScreenEnabled(-1))
                changeVis("Horizontal_Gutter_Rear_Vertical sunblind", true);
            else
                changeVis("Horizontal_Gutter_Rear_Rail plug", true);

            //LED strips available just for front/back, needs sides added in config logic
        }

        function enableCalistaStructure() {
            //left,right,front,rear
            if (!isHorizontalRoof)
                return;

            //Posts
            setObjTransform("Horizontal_Corner_Post_Front_Left", "position", conservatoryWidth / 2, conservatoryDepth, 0, false);
            setObjTransform("Horizontal_Corner_Post_Front_Right", "position", -conservatoryWidth / 2, conservatoryDepth, 0, false);
            setObjTransform("Horizontal_Corner_Post_Rear_Left", "position", conservatoryWidth / 2, 0, 0, false);
            setObjTransform("Horizontal_Corner_Post_Rear_Right", "position", -conservatoryWidth / 2, 0, 0, false);

            setMorphFactor("Horizontal_Corner_Post_Front_Left", 'Height', (((totalHeight) - 1) / 99));
            setMorphFactor("Horizontal_Corner_Post_Front_Right", 'Height', (((totalHeight) - 1) / 99));
            setMorphFactor("Horizontal_Corner_Post_Rear_Left", 'Height', (((totalHeight) - 1) / 99));
            setMorphFactor("Horizontal_Corner_Post_Rear_Right", 'Height', (((totalHeight) - 1) / 99));

            changeVis("Horizontal_Corner_Post_Front_Left", true);
            changeVis("Horizontal_Corner_Post_Front_Right", true);
            changeVis("Horizontal_Corner_Post_Rear_Left", true);
            changeVis("Horizontal_Corner_Post_Rear_Right", true);

            enableHorizontalVerandaPostAccessories();
            enableHorizontalVerandaPostSupports();

            //Crownbeams
            setObjTransform("Horizontal_Gutter_Left", "position", conservatoryWidth / 2, conservatoryDepth / 2, totalHeight, false);
            setObjTransform("Horizontal_Gutter_Right", "position", -conservatoryWidth / 2, conservatoryDepth / 2, totalHeight, false);
            setObjTransform("Horizontal_Gutter_Front", "position", '', conservatoryDepth, totalHeight, false);
            setObjTransform("Horizontal_Gutter_Rear", "position", '', 0, totalHeight, false);

            setMorphFactor("Horizontal_Gutter_Left", 'Width', (((conservatoryDepth - 2 * getPoleSize('x')) - 1) / 100));
            setMorphFactor("Horizontal_Gutter_Right", 'Width', (((conservatoryDepth - 2 * getPoleSize('x')) - 1) / 100));
            setMorphFactor("Horizontal_Gutter_Front", 'Width', (((conservatoryWidth - 2 * getPoleSize('x')) - 1) / 100));
            setMorphFactor("Horizontal_Gutter_Rear", 'Width', (((conservatoryWidth - 2 * getPoleSize('x')) - 1) / 100));

            changeVis("Horizontal_Gutter_Left", true);
            changeVis("Horizontal_Gutter_Right", true);
            changeVis("Horizontal_Gutter_Front", true);
            changeVis("Horizontal_Gutter_Rear", true);

            enableHorizontalVerandaCrownbeamAccessories();
            calculatePolePos();
        }

        function enableRoof() {
            enableRoofWidthDivisions();
            enableRoofFillings();
        }

        function enableRoofWidthDivisions() {
            let position = conservatoryWidth / 2 - 0.11 - 0.04;
            if (roofSpecs == null)
                return;
            for (let i = 0; roofSpecs[0].rafter.length > i; i++) {
                let selection = 0;
                if (selectedRoofRafterIndex == i)
                    selection = 1;

                position = position - roofSpecs[0].rafter[i].axisDistance / 1000;
                //[rafter,ledSpotProfile,ledStrip,noLedStrip]
                if (horizontalRoofDivisionObjectCache.length <= i) {
                    horizontalRoofDivisionObjectCache[i] = [[cloneObject("Rafter 190x140 base.0", 20), cloneObject("Led spot profile.0", 20), cloneObject("Led strip.0", 20), cloneObject("No Led strip.0", 20), [cloneObject("Horizontal_Ledspot.0", 150)]], [cloneObject("Rafter 190x140 base_Selected.0", 20), cloneObject("Led spot profile_Selected.0", 20), cloneObject("Led strip_Selected.0", 20), cloneObject("No Led strip_Selected.0", 20), [cloneObject("Horizontal_Ledspot_Selected.0", 150)]]];

                    for (let x = 0; x < horizontalRoofDivisionObjectCache[i].length; x++)
                        for (let y = 0; y < horizontalRoofDivisionObjectCache[i][0].length - 1; y++)
                            makeParent(horizontalRoofDivisionObjectCache[i][x][y], 'globalManipulator');

                    registerOnClick(horizontalRoofDivisionObjectCache[i][0][0], false, false, [2], function () {
                        openGroup(true, i, "rafter_group~");
                    }, function () {
                        if (selectedRoofRafterIndex == i)
                            openGroup(true, -1, "rafter_group~");
                    });
                    registerOnClick(horizontalRoofDivisionObjectCache[i][1][0], false, false, [2], function () {
                        openGroup(true, i, "rafter_group~");
                    }, function () {
                        if (selectedRoofRafterIndex == i)
                            openGroup(true, -1, "rafter_group~");
                    });
                }

                for (let j = 0; j < 4; j++) {
                    setObjTransform(horizontalRoofDivisionObjectCache[i][0][j], 'position', position, conservatoryDepth / 2, totalHeight, false);
                    setMorphFactor(horizontalRoofDivisionObjectCache[i][0][j], 'Width', (((conservatoryDepth - 2 * getPoleSize('x')) - 1) / 100));

                    setObjTransform(horizontalRoofDivisionObjectCache[i][1][j], 'position', position, conservatoryDepth / 2, totalHeight, false);
                    setMorphFactor(horizontalRoofDivisionObjectCache[i][1][j], 'Width', (((conservatoryDepth - 2 * getPoleSize('x')) - 1) / 100));

                    changeVis(horizontalRoofDivisionObjectCache[i][0][j], false);
                    changeVis(horizontalRoofDivisionObjectCache[i][1][j], false);
                }
                changeVis(horizontalRoofDivisionObjectCache[i][selection][0], true);

                if (roofSpecs[0].rafter[i].ledStrip)
                    changeVis(horizontalRoofDivisionObjectCache[i][selection][2], true);
                else if (roofSpecs[0].rafter[i].ledSpot.length) {
                    let depthPos = 0;

                    setObjTransform(horizontalRoofDivisionObjectCache[i][selection][1], 'position', position, conservatoryDepth / 2, totalHeight, false);
                    changeVis(horizontalRoofDivisionObjectCache[i][selection][1], true);

                    for (let j = 0; j < roofSpecs[0].rafter[i].ledSpot.length; j++) {
                        if (horizontalRoofDivisionObjectCache[i][selection][4].length <= j) {
                            horizontalRoofDivisionObjectCache[i][0][4][j] = cloneObject("Horizontal_Ledspot.0", 150);
                            horizontalRoofDivisionObjectCache[i][1][4][j] = cloneObject("Horizontal_Ledspot_Selected.0", 150);
                        }
                        depthPos = depthPos + roofSpecs[0].rafter[i].ledSpot[j] / 1000;

                        setObjTransform(horizontalRoofDivisionObjectCache[i][selection][4][j], 'position', position, depthPos, totalHeight, false);
                        changeVis(horizontalRoofDivisionObjectCache[i][selection][4][j], true);
                    }
                }
                else
                    changeVis(horizontalRoofDivisionObjectCache[i][selection][3], true);
            }
        }

        function deselectGroupedRoofObjects(label, i, x) {
            if (selectedRoofPanelIndex == i)
                if ((roofSpecs[0].roof[i].type == "hr_sheetTypeGlass10mm" || roofSpecs[0].roof[i].type == "hr_sheetTypeGlass8mm") && x == 0)
                    openGroup(true, -1, label);
                else if ((roofSpecs[0].roof[i].type == "hr_sheetTypePlasticChoicePlasticSandwich16mmAntracietStructure") && x == 1)
                    openGroup(true, -1, label);
                else if ((roofSpecs[0].roof[i].type == "hr_sheetTypePlasticChoicePlasticSandwich16mmWhiteWhite") && x == 2)
                    openGroup(true, -1, label);
        }

        function enableRoofFillings() {
            if (roofSpecs == null)
                return;

            let position = conservatoryWidth / 2 - 0.11 - (roofSpecs[0].roof[0].width / 2 + 80) / 1000;
            for (let i = 0; roofSpecs[0].roof.length > i; i++) {
                if (roofFillingCache.length <= i) {
                    roofFillingCache[i] = [cloneObject("Horizontal_Roof_Glass_Front.0", 20, true, true), cloneObject("Horizontal_Roof_Sandwich_Panel_Anthracite_Front.0", 20), cloneObject("Horizontal_Roof_Sandwich_Panel_White_Front.0", 20), cloneObject("Horizontal_Roof_Selected_Front.0", 20)];

                    for (let x = 0; x < roofFillingCache[i].length; x++) {
                        registerOnClick(roofFillingCache[i][x], false, false, [2], function () {
                            openGroup(true, i, "filling_group~");
                        }, function () {
                            deselectGroupedRoofObjects("filling_group~", i, x);
                        });
                    }
                }
                for (let j = 0; j < roofFillingCache[i].length; j++) {
                    setObjTransform(roofFillingCache[i][j], "position", position, conservatoryDepth / 2, totalHeight, false);

                    setMorphFactor(roofFillingCache[i][j], 'Depth', (((conservatoryDepth - 2 * getPoleSize('x')) - 1) / 100));
                    setMorphFactor(roofFillingCache[i][j], 'Width', (((roofSpecs[0].roof[i].width / 1000) - 1) / 100));

                    changeVis(roofFillingCache[i][j], false);
                }

                if (roofSpecs[0].roof[i].type == "hr_sheetTypeGlass10mm" || roofSpecs[0].roof[i].type == "hr_sheetTypeGlass8mm")
                    changeVis(roofFillingCache[i][0], true);
                else if (roofSpecs[0].roof[i].type == "hr_sheetTypePlasticChoicePlasticSandwich16mmAntracietStructure")
                    changeVis(roofFillingCache[i][1], true);
                else if (roofSpecs[0].roof[i].type == "hr_sheetTypePlasticChoicePlasticSandwich16mmWhiteWhite")
                    changeVis(roofFillingCache[i][2], true);

                if (selectedRoofPanelIndex == i)
                    changeVis(roofFillingCache[i][3], true);

                if (i < roofSpecs[0].roof.length - 1)
                    position = position - (roofSpecs[0].roof[i].width / 2 + roofSpecs[0].roof[i + 1].width / 2 + 80) / 1000;

                if (roofSpecs[0].roof[i].type == "hr_sheetTypeGlass10mm" || roofSpecs[0].roof[i].type == "hr_sheetTypeGlass8mm") {
                    if (glassIncluded)
                        if (roofSpecs[0].roof[i].glassColor == 'glass_Clear') {
                            setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'NoGlass', 0);
                            setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'Tint', 0);
                        }
                        else if (roofSpecs[0].roof[i].glassColor == 'glass_Opal') {
                            setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'NoGlass', 0);
                            setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'Tint', 0.6);
                        }
                        else {
                            setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'NoGlass', 0.78);
                            setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'Tint', 0.2);
                        }
                    else {
                        setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'NoGlass', 0.78);
                        setMaterialValue(getObjectMaterial(roofFillingCache[i][0], 1, true), 'Tint', 0.2);
                    }
                }
            }
        }

        function getClimaglidePanelPos(i, side, pos) {
            if (side == 0)
                return leftSpecs.optionYposSE[pos][0] + ((leftSpecs.optionSpacing[pos])) / leftSpecs.climaglidePanelAmount[pos] / 2 + (((leftSpecs.optionSpacing[pos])) / leftSpecs.climaglidePanelAmount[pos] * i);
            else if (side == 1)
                return rightSpecs.optionYposSE[pos][0] + ((rightSpecs.optionSpacing[pos])) / rightSpecs.climaglidePanelAmount[pos] / 2 + (((rightSpecs.optionSpacing[pos])) / rightSpecs.climaglidePanelAmount[pos] * i);
            else if (side == 2)
                return frontSpecs.optionXposSE[pos][0] - ((frontSpecs.optionSpacing[pos]) / frontSpecs.climaglidePanelAmount[pos] / 2) - ((frontSpecs.optionSpacing[pos]) / frontSpecs.climaglidePanelAmount[pos] * i);
            else if (side == 3)
                return rearSpecs.optionXposSE[pos][0] - ((rearSpecs.optionSpacing[pos]) / rearSpecs.climaglidePanelAmount[pos] / 2) - ((rearSpecs.optionSpacing[pos]) / rearSpecs.climaglidePanelAmount[pos] * i);
            else if (side == 4)
                return standaloneSpecs.optionXposSE[pos][0] - ((standaloneSpecs.optionSpacing[pos]) / standaloneSpecs.climaglidePanelAmount[pos] / 2) - ((standaloneSpecs.optionSpacing[pos]) / standaloneSpecs.climaglidePanelAmount[pos] * i);

            return 0;
        }

        function climaglideHandles(pos, openingDirection, i, depthAdaptation) {
            if (pos == 0) {
                let pos1 = (i + 1) * 2 - 2;
                let pos2 = (i + 1) * 2 - 2 + 1;

                if (!getObjectByName(leftSpecs.climaglideManipulatorCache[pos1])) {
                    leftSpecs.climaglideManipulatorCache[pos1] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(leftSpecs.climaglideManipulatorCache[pos1], 'globalManipulator');
                }
                if (!getObjectByName(leftSpecs.climaglideManipulatorCache[pos2])) {
                    leftSpecs.climaglideManipulatorCache[pos2] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(leftSpecs.climaglideManipulatorCache[pos2], 'globalManipulator');
                }

                setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'rotation', '', '', -90, false);
                setObjTransform(leftSpecs.climaglideManipulatorCache[pos2], 'rotation', '', '', -90, false);

                if (openingDirection == 'right') {
                    if (!leftSpecs.climaglideIsOpen[i])
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', conservatoryWidth / 2 - 0.01 - ((leftSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (leftSpecs.optionYposSE[i][0] + climaglideManipulatorDistanceFromEdge), '', false);
                    else
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', conservatoryWidth / 2 - 0.01 - ((leftSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (leftSpecs.optionYposSE[i][1] - (leftSpecs.optionSpacing[i] / leftSpecs.climaglidePanelAmount[i]) + climaglideManipulatorDistanceFromEdge), '', false);

                    changeVis(leftSpecs.climaglideManipulatorCache[pos1], true);
                }
                else if (openingDirection == 'middle') {
                    if (!leftSpecs.climaglideIsOpen[i]) {
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (leftSpecs.optionCenterPos[i] - climaglideManipulatorDistanceFromEdge), '', false);
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos2], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (leftSpecs.optionCenterPos[i] + climaglideManipulatorDistanceFromEdge), '', false);
                    }
                    else {
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (leftSpecs.optionYposSE[i][1] - (leftSpecs.optionSpacing[i] / leftSpecs.climaglidePanelAmount[i]) + climaglideManipulatorDistanceFromEdge), '', false);
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos2], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (leftSpecs.optionYposSE[i][0] + (leftSpecs.optionSpacing[i] / leftSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), '', false);
                    }

                    changeVis(leftSpecs.climaglideManipulatorCache[pos1], true);
                    changeVis(leftSpecs.climaglideManipulatorCache[pos2], true);
                }
                else {
                    if (!leftSpecs.climaglideIsOpen[i])
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', conservatoryWidth / 2 - 0.01 - ((leftSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (leftSpecs.optionYposSE[i][1] - climaglideManipulatorDistanceFromEdge), '', false);
                    else
                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', conservatoryWidth / 2 - 0.01 - ((leftSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (leftSpecs.optionYposSE[i][0] + (leftSpecs.optionSpacing[i] / leftSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), '', false);

                    changeVis(leftSpecs.climaglideManipulatorCache[pos1], true);
                }
            }
            else if (pos == 1) {
                let pos1 = (i + 1) * 2 - 2;
                let pos2 = (i + 1) * 2 - 2 + 1;

                if (!getObjectByName(rightSpecs.climaglideManipulatorCache[pos1])) {
                    rightSpecs.climaglideManipulatorCache[pos1] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(rightSpecs.climaglideManipulatorCache[pos1], 'globalManipulator');
                }
                if (!getObjectByName(rightSpecs.climaglideManipulatorCache[pos2])) {
                    rightSpecs.climaglideManipulatorCache[pos2] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(rightSpecs.climaglideManipulatorCache[pos2], 'globalManipulator');
                }
                setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'rotation', '', '', -90, false);
                setObjTransform(rightSpecs.climaglideManipulatorCache[pos2], 'rotation', '', '', -90, false);

                if (openingDirection == 'left') {
                    if (!rightSpecs.climaglideIsOpen[i])
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', -conservatoryWidth / 2 + 0.01 + ((rightSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (rightSpecs.optionYposSE[i][0] + climaglideManipulatorDistanceFromEdge), '', false);
                    else
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', -conservatoryWidth / 2 + 0.01 + ((rightSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (rightSpecs.optionYposSE[i][1] - (rightSpecs.optionSpacing[i] / rightSpecs.climaglidePanelAmount[i]) + climaglideManipulatorDistanceFromEdge), '', false);

                    changeVis(rightSpecs.climaglideManipulatorCache[pos1], true);
                }
                else if (openingDirection == 'middle') {
                    if (!rightSpecs.climaglideIsOpen[i]) {
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (rightSpecs.optionCenterPos[i] - climaglideManipulatorDistanceFromEdge), '', false);
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos2], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (rightSpecs.optionCenterPos[i] + climaglideManipulatorDistanceFromEdge), '', false);
                    }
                    else {
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (rightSpecs.optionYposSE[i][1] - (rightSpecs.optionSpacing[i] / rightSpecs.climaglidePanelAmount[i]) + climaglideManipulatorDistanceFromEdge), '', false);
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos2], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation, (rightSpecs.optionYposSE[i][0] + (rightSpecs.optionSpacing[i] / rightSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), '', false);
                    }
                    changeVis(rightSpecs.climaglideManipulatorCache[pos1], true);
                    changeVis(rightSpecs.climaglideManipulatorCache[pos2], true);
                }
                else {
                    if (!rightSpecs.climaglideIsOpen[i])
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', -conservatoryWidth / 2 + 0.01 + ((rightSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (rightSpecs.optionYposSE[i][1] - climaglideManipulatorDistanceFromEdge), '', false);
                    else
                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', -conservatoryWidth / 2 + 0.01 + ((rightSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, (rightSpecs.optionYposSE[i][0] + (rightSpecs.optionSpacing[i] / rightSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), '', false);

                    changeVis(rightSpecs.climaglideManipulatorCache[pos1], true);
                }
            }
            else if (pos == 2) {
                let pos1 = (i + 1) * 2 - 2;
                let pos2 = (i + 1) * 2 - 2 + 1;

                if (!getObjectByName(frontSpecs.climaglideManipulatorCache[pos1])) {
                    frontSpecs.climaglideManipulatorCache[pos1] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(frontSpecs.climaglideManipulatorCache[pos1], 'globalManipulator');
                }
                if (!getObjectByName(frontSpecs.climaglideManipulatorCache[pos2])) {
                    frontSpecs.climaglideManipulatorCache[pos2] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(frontSpecs.climaglideManipulatorCache[pos2], 'globalManipulator');
                }

                setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'rotation', '', '', 0, false);
                setObjTransform(frontSpecs.climaglideManipulatorCache[pos2], 'rotation', '', '', 0, false);

                if (openingDirection == 'right') {
                    if (!frontSpecs.climaglideIsOpen[i])
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', (frontSpecs.optionXposSE[i][0] - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - (frontSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);
                    else
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', (frontSpecs.optionXposSE[i][1] + (frontSpecs.optionSpacing[i] / frontSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - (frontSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);

                    changeVis(frontSpecs.climaglideManipulatorCache[pos1], true);
                }
                else if (openingDirection == 'middle') {
                    if (!frontSpecs.climaglideIsOpen[i]) {
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', (frontSpecs.optionCenterPos[i] - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos2], 'position', (frontSpecs.optionCenterPos[i] + climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                    }
                    else {
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', (getClimaglidePanelPos(0, 2, i) + getClimaglidePanelPos(1, 2, i)) / 2 + climaglideManipulatorDistanceFromEdge, conservatoryDepth - getPoleSize("y") + 0.11 - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos2], 'position', (frontSpecs.optionXposSE[i][1] + (frontSpecs.optionSpacing[i] / frontSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                    }
                    changeVis(frontSpecs.climaglideManipulatorCache[pos1], true);
                    changeVis(frontSpecs.climaglideManipulatorCache[pos2], true);
                }
                else {
                    if (!frontSpecs.climaglideIsOpen[i])
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', (frontSpecs.optionXposSE[i][1] + climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - (frontSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);
                    else
                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', (getClimaglidePanelPos(0, 2, i) + getClimaglidePanelPos(1, 2, i)) / 2 + climaglideManipulatorDistanceFromEdge, conservatoryDepth - getPoleSize("y") + 0.11 - (frontSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);

                    changeVis(frontSpecs.climaglideManipulatorCache[pos1], true);
                }
            }
            else if (pos == 3) {
                let pos1 = (i + 1) * 2 - 2;
                let pos2 = (i + 1) * 2 - 2 + 1;

                if (!getObjectByName(rearSpecs.climaglideManipulatorCache[pos1])) {
                    rearSpecs.climaglideManipulatorCache[pos1] = cloneObject("Climaglide_Manipulator.000", 6);
                    makeParent(rearSpecs.climaglideManipulatorCache[pos1], 'globalManipulator');
                }
                if (!getObjectByName(rearSpecs.climaglideManipulatorCache[pos2])) {
                    rearSpecs.climaglideManipulatorCache[pos2] = cloneObject("Climaglide_Manipulator.000", 6);
                    makeParent(rearSpecs.climaglideManipulatorCache[pos2], 'globalManipulator');
                }

                if (openingDirection == 'left') {
                    if (!rearSpecs.climaglideIsOpen[i])
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', (rearSpecs.optionXposSE[i][0] - climaglideManipulatorDistanceFromEdge), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, '', false);
                    else
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', (rearSpecs.optionXposSE[i][1] + (rearSpecs.optionSpacing[i] / rearSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, '', false);

                    changeVis(rearSpecs.climaglideManipulatorCache[pos1], true);
                }
                else if (openingDirection == 'middle') {
                    if (!rearSpecs.climaglideIsOpen[i]) {
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', (rearSpecs.optionCenterPos[i] - climaglideManipulatorDistanceFromEdge), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos2], 'position', (rearSpecs.optionCenterPos[i] + climaglideManipulatorDistanceFromEdge), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                    }
                    else {
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', (getClimaglidePanelPos(0, 3, i) + getClimaglidePanelPos(1, 3, i)) / 2 + climaglideManipulatorDistanceFromEdge, getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos2], 'position', (rearSpecs.optionXposSE[i][1] + (rearSpecs.optionSpacing[i] / rearSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                    }

                    changeVis(rearSpecs.climaglideManipulatorCache[pos1], true);
                    changeVis(rearSpecs.climaglideManipulatorCache[pos2], true);
                }
                else {
                    if (!rearSpecs.climaglideIsOpen[i])
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', (rearSpecs.optionXposSE[i][1] + climaglideManipulatorDistanceFromEdge), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, '', false);
                    else
                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', (getClimaglidePanelPos(0, 3, i) + getClimaglidePanelPos(1, 3, i)) / 2 + climaglideManipulatorDistanceFromEdge, getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation, '', false);

                    changeVis(rearSpecs.climaglideManipulatorCache[pos1], true);
                }
            }
            else if (pos == 4) {
                let pos1 = (i + 1) * 2 - 2;
                let pos2 = (i + 1) * 2 - 2 + 1;

                if (!getObjectByName(standaloneSpecs.climaglideManipulatorCache[pos1])) {
                    standaloneSpecs.climaglideManipulatorCache[pos1] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(standaloneSpecs.climaglideManipulatorCache[pos1], 'globalManipulator');
                }
                if (!getObjectByName(standaloneSpecs.climaglideManipulatorCache[pos2])) {
                    standaloneSpecs.climaglideManipulatorCache[pos2] = cloneObject("Climaglide_Manipulator.000", 12);
                    makeParent(standaloneSpecs.climaglideManipulatorCache[pos2], 'globalManipulator');
                }

                setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'rotation', '', '', 0, false);
                setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos2], 'rotation', '', '', 0, false);

                if (openingDirection == 'right') {
                    if (!standaloneSpecs.climaglideIsOpen[i])
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'position', (standaloneSpecs.optionXposSE[i][0] - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - (standaloneSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);
                    else
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'position', (standaloneSpecs.optionXposSE[i][1] + (standaloneSpecs.optionSpacing[i] / standaloneSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - (standaloneSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);

                    changeVis(standaloneSpecs.climaglideManipulatorCache[pos1], true);
                }
                else if (openingDirection == 'middle') {
                    if (!standaloneSpecs.climaglideIsOpen[i]) {
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'position', (standaloneSpecs.optionCenterPos[i] - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos2], 'position', (standaloneSpecs.optionCenterPos[i] + climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                    }
                    else {
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'position', (getClimaglidePanelPos(0, 2, i) + getClimaglidePanelPos(1, 2, i)) / 2 + climaglideManipulatorDistanceFromEdge, conservatoryDepth - getPoleSize("y") + 0.11 - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos2], 'position', (standaloneSpecs.optionXposSE[i][1] + (standaloneSpecs.optionSpacing[i] / standaloneSpecs.climaglidePanelAmount[i]) - climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation, '', false);
                    }
                    changeVis(standaloneSpecs.climaglideManipulatorCache[pos1], true);
                    changeVis(standaloneSpecs.climaglideManipulatorCache[pos2], true);
                }
                else {
                    if (!standaloneSpecs.climaglideIsOpen[i])
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'position', (standaloneSpecs.optionXposSE[i][1] + climaglideManipulatorDistanceFromEdge), conservatoryDepth - getPoleSize("y") + 0.11 - (standaloneSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);
                    else
                        setObjTransform(standaloneSpecs.climaglideManipulatorCache[pos1], 'position', (getClimaglidePanelPos(0, 2, i) + getClimaglidePanelPos(1, 2, i)) / 2 + climaglideManipulatorDistanceFromEdge, conservatoryDepth - getPoleSize("y") + 0.11 - (standaloneSpecs.climaglidePanelAmount[i] - 1) * 0.02 - depthAdaptation, '', false);

                    changeVis(standaloneSpecs.climaglideManipulatorCache[pos1], true);
                }
            }
        }

        function getTextFromTree(tree, side) {
            if (!tree)
                return 'Text missing!';
            for (let i = 0; i < tree.length; i++) {
                if (side == 'back') {
                    if (tree[i].uniqueLabel == 'opti_3')
                        return tree[i].name;
                }
                else if (side == 'left') {
                    if (tree[i].uniqueLabel == 'left')
                        return tree[i].name;
                }
                else if (side == 'right') {
                    if (tree[i].uniqueLabel == 'opti_2')
                        return tree[i].name;
                }
                else if (side == 'front') {
                    if (tree[i].uniqueLabel == 'opti_1')
                        return tree[i].name;
                }
            }
            console.log(tree)
        }

        function enableInfoText() {

            if (!scope['_3d_optionsLeft'] || !scope['_3d_optionsRight'] || !scope['_3d_optionsMiddle'] || !scope['_3d_optionsBack'])
                return;

            let offset = 0.6;

            let leftSpecsL1 = (scope['_3d_optionsLeft']) ? JSON.parse(scope['_3d_optionsLeft']).level_1 : {};
            let rightSpecsL1 = (scope['_3d_optionsRight']) ? JSON.parse(scope['_3d_optionsRight']).level_1 : {};
            let frontSpecsL1 = (scope['_3d_optionsMiddle']) ? JSON.parse(scope['_3d_optionsMiddle']).level_1 : {};
            let backSpecsL1 = (scope['_3d_optionsBack']) ? JSON.parse(scope['_3d_optionsBack']).level_1 : {};

            //let sideTranslations = (scope["_3d_side_translations"]) ? JSON.parse(scope["_3d_side_translations"]) : {};

            setObjTransform('Text_Back', 'position', '', -offset, '', false);
            setObjTransform('Text_Front', 'position', '', conservatoryDepth + offset, '', false);
            setObjTransform('Text_Right', 'position', -conservatoryWidth / 2 - offset, conservatoryDepth / 2, '', false);
            setObjTransform('Text_Left', 'position', conservatoryWidth / 2 + offset, conservatoryDepth / 2, '', false);

            changeVis('Text_Back', true);
            changeVis('Text_Front', true);
            changeVis('Text_Right', true);
            changeVis('Text_Left', true);

            updateTextObj('Text_Back', getTextFromTree(tree, 'back')/* sideTranslations.back */);
            updateTextObj('Text_Front', getTextFromTree(tree, 'front')/* sideTranslations.front */);
            updateTextObj('Text_Right', getTextFromTree(tree, 'right')/* sideTranslations.right */);
            updateTextObj('Text_Left', getTextFromTree(tree, 'left')/* sideTranslations.left */);

            //Roof screen motor indication
            if (horizontalScreenEnabled.includes(true)) {
                changeVis('motorPosCircle_RoofScreen', true);
                changeVis('MotorImageRoof', true);
                setObjTransform('motorPosCircle_RoofScreen', 'position', (roofScreenSide == 'L') ? conservatoryWidth / 2 : -conservatoryWidth / 2, 0.05, totalHeight + 0.15, false);
            }

            //Side screen motor indication
            if (leftSpecsL1.option == 'optionsScreens') {
                changeVis('motorPosCircle_left', true);
                changeVis('MotorImageLeft', true);
                setObjTransform('motorPosCircle_left', 'position', conservatoryWidth / 2 + 0.003, (leftSpecsL1.screen.motor == 'left') ? 0.15 : conservatoryDepth - 0.15, totalHeight - 0.04, false);
            }
            if (rightSpecsL1.option == 'optionsScreens') {
                changeVis('motorPosCircle_right', true);
                changeVis('MotorImageRight', true);
                setObjTransform('motorPosCircle_right', 'position', -conservatoryWidth / 2 - 0.003, (rightSpecsL1.screen.motor == 'left') ? conservatoryDepth - 0.15 : 0.15, totalHeight - 0.04, false);
            }
            if (frontSpecsL1.option == 'optionsScreens') {
                changeVis('motorPosCircle_front', true);
                changeVis('MotorImageFront', true);
                setObjTransform('motorPosCircle_front', 'position', (frontSpecsL1.screen.motor == 'right') ? -conservatoryWidth / 2 + 0.15 : conservatoryWidth / 2 - 0.15, conservatoryDepth + 0.003, totalHeight - 0.04, false);
            }
            if (backSpecsL1.option == 'optionsScreens') {
                changeVis('motorPosCircle_back', true);
                changeVis('MotorImageBack', true);
                setObjTransform('motorPosCircle_back', 'position', (backSpecsL1.screen.motor == 'right') ? conservatoryWidth / 2 - 0.15 : -conservatoryWidth / 2 + 0.15, -0.003, totalHeight - 0.04, false);
            }

            updateMotorRotation();
        }

        function updateMotorRotation() {
            setObjTransform('motorPosCircle_RoofScreen', 'rotation', '', '', cameraZAngle - 90, false);
            setObjTransform('motorPosCircle_left', 'rotation', '', '', cameraZAngle - 90, false);
            setObjTransform('motorPosCircle_right', 'rotation', '', '', cameraZAngle - 90, false);
            setObjTransform('motorPosCircle_front', 'rotation', '', '', cameraZAngle - 90, false);
            setObjTransform('motorPosCircle_back', 'rotation', '', '', cameraZAngle - 90, false);
        }

        function enableClimaglide(openingDirection) {
            for (let i = 0; i <= 4; i++)
                if (openingDirection[i] != 'middle' && openingDirection[i] != 'left' && openingDirection[i] != 'right')
                    openingDirection[i] = 'left';

            if (!leftSpecs.isClimaglideEnabled(-1) && !rightSpecs.isClimaglideEnabled(-1) && !frontSpecs.isClimaglideEnabled(-1) && !rearSpecs.isClimaglideEnabled(-1) && !standaloneSpecs.isClimaglideEnabled(-1))
                return;

            let depthAdaptation = [0.048, -0.048, 0.018, -0.015];

            let overhang = climaglidePanelOverhang;
            let climacrownHeightAdaptation = 0;
            if (climacrownEnabled)
                climacrownHeightAdaptation = 0.08;

            let heightAdaptation = [-0.14 + climacrownHeightAdaptation, -0.14 + climacrownHeightAdaptation, 0, 0];
            let climaglideHeight = [totalHeight - 0.25, totalHeight - 0.25, totalHeight - 0.25, totalHeight - 0.25];

            //front->main
            let totalCounter = 0;
            for (let i = 0; frontSpecs.poleAmount >= i; i++) {
                for (let counter = 0; frontSpecs.climaglidePanelAmount[i] > counter && frontSpecs.isClimaglideEnabled(i); counter++) {
                    if (!getObjectByName(frontSpecs.climaglideBottomRailCache[totalCounter])) {
                        frontSpecs.climaglideBottomRailCache[totalCounter] = cloneObject("Climaglide_Rails_Bottom.000", 45);
                        makeParent(frontSpecs.climaglideBottomRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(frontSpecs.climaglideTopRailCache[totalCounter])) {
                        frontSpecs.climaglideTopRailCache[totalCounter] = cloneObject("Climaglide_Rails_Top.000", 45);
                        makeParent(frontSpecs.climaglideTopRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(frontSpecs.climaglideTopMainRailCache[i])) {
                        frontSpecs.climaglideTopMainRailCache[i] = cloneObject("Climaglide_Rails_Top_Main.000", 5);
                        makeParent(frontSpecs.climaglideTopMainRailCache[i], 'globalManipulator');
                    }
                    for (let x = 0; x < 10; x++) {
                        if (!getObjectByName(frontSpecs.climaglidePanelCache[x + i * 10])) {
                            frontSpecs.climaglidePanelCache[x + i * 10] = cloneObject("Climaglide_Panel.000", 90, true, true);
                            makeParent(frontSpecs.climaglidePanelCache[x + i * 10], 'globalManipulator');
                        }

                    }
                    setObjTransform(frontSpecs.climaglideBottomRailCache[totalCounter], 'position', frontSpecs.optionCenterPos[i], conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], '', false);
                    setMorphFactor(frontSpecs.climaglideBottomRailCache[totalCounter], 'Width', ((frontSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(frontSpecs.climaglideTopRailCache[totalCounter], 'position', frontSpecs.optionCenterPos[i], conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], climaglideHeight[2], false);
                    setMorphFactor(frontSpecs.climaglideTopRailCache[totalCounter], 'Width', ((frontSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(frontSpecs.climaglideTopMainRailCache[i], 'position', frontSpecs.optionCenterPos[i], conservatoryDepth - getPoleSize("y") + 0.11 - depthAdaptation[2], climaglideHeight[2], false);
                    setObjTransform(frontSpecs.climaglideTopMainRailCache[i], 'rotation', '', '', 180, false);

                    setMorphFactor(frontSpecs.climaglideTopMainRailCache[i], 'Width', ((frontSpecs.optionSpacing[i] - 1) / 99));
                    if (frontSpecs.climaglideOpeningDirection[i] == 'middle')
                        setMorphFactor(frontSpecs.climaglideTopMainRailCache[i], 'panelAmount', (frontSpecs.climaglidePanelAmount[i] / 2) - 1);
                    else
                        setMorphFactor(frontSpecs.climaglideTopMainRailCache[i], 'panelAmount', frontSpecs.climaglidePanelAmount[i] - 1);

                    setMorphFactor(frontSpecs.climaglidePanelCache[counter + i * 10], 'Width', ((((frontSpecs.optionSpacing[i]) / frontSpecs.climaglidePanelAmount[i]) - 0.1 + (overhang)) / 100));
                    setMorphFactor(frontSpecs.climaglidePanelCache[counter + i * 10], 'Height', (((climaglideHeight[2]) - 1) / 99));

                    if (frontSpecs.climaglideOpeningDirection[i] == "right") {
                        if (!frontSpecs.climaglideIsOpen[i])
                            setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 - (frontSpecs.climaglidePanelAmount[i] - 1) * 0.02 + (counter * 0.02) - depthAdaptation[2], '', false);
                        else
                            setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(frontSpecs.climaglidePanelAmount[i] - 1, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 - (frontSpecs.climaglidePanelAmount[i] - 1) * 0.02 + (counter * 0.02) - depthAdaptation[2], '', false);
                    }
                    else if (frontSpecs.climaglideOpeningDirection[i] == "middle") {
                        if (!frontSpecs.climaglideIsOpen[i]) {
                            if (frontSpecs.climaglidePanelAmount[i] / (counter + 1) > 2)
                                setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 + ((frontSpecs.climaglidePanelAmount[i] / 2 - counter - 1) * 0.02) - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                            else if (frontSpecs.climaglidePanelAmount[i] / (counter + 1) == 2 || frontSpecs.climaglidePanelAmount[i] / counter == 2)
                                setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                            else
                                setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 + (-(frontSpecs.climaglidePanelAmount[i] / 2 - counter) * 0.02) - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                        }
                        else {
                            if (frontSpecs.climaglidePanelAmount[i] / (counter + 1) >= 2)
                                setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(0, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 + ((frontSpecs.climaglidePanelAmount[i] / 2 - counter - 1) * 0.02) - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                            else
                                setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(frontSpecs.climaglidePanelAmount[i] - 1, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 + (-(frontSpecs.climaglidePanelAmount[i] / 2 - counter) * 0.02) - ((frontSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                        }
                    }
                    else {
                        if (!frontSpecs.climaglideIsOpen[i])
                            setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], '', false);
                        else
                            setObjTransform(frontSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(0, 2, i), conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], '', false);
                    }

                    if (!(frontSpecs.climaglideOpeningDirection[i] == 'middle' && frontSpecs.climaglidePanelAmount[i] / (counter + 1) < 2)) {
                        changeVis(frontSpecs.climaglideBottomRailCache[totalCounter], true);
                        changeVis(frontSpecs.climaglideTopRailCache[totalCounter], true);
                    }
                    changeVis(frontSpecs.climaglideTopMainRailCache[i], true);
                    changeVis(frontSpecs.climaglidePanelCache[counter + i * 10], true);

                    if (frontSpecs.glassColor[i] == 'glass_Clear') {
                        setMaterialValue(getObjectMaterial(frontSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(frontSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0);
                    }
                    else if (frontSpecs.glassColor[i] == 'glass_Opal') {
                        setMaterialValue(getObjectMaterial(frontSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(frontSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.8);
                    }
                    else {
                        setMaterialValue(getObjectMaterial(frontSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                        setMaterialValue(getObjectMaterial(frontSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                    }

                    climaglideHandles(2, frontSpecs.climaglideOpeningDirection[i], i, depthAdaptation[2])

                    if (!frontSpecs.climaglideAnimationSetUp[i]) {
                        onClickActionClimaglide(i + 30);
                        frontSpecs.climaglideAnimationSetUp[i] = true;
                    }
                    totalCounter++;
                }

            }

            //left
            totalCounter = 0;
            for (let i = 0; leftSpecs.poleAmount >= i; i++) {
                for (let counter = 0; leftSpecs.climaglidePanelAmount[i] > counter && leftSpecs.isClimaglideEnabled(i); counter++) {
                    if (!getObjectByName(leftSpecs.climaglideBottomRailCache[totalCounter])) {
                        leftSpecs.climaglideBottomRailCache[totalCounter] = cloneObject("Climaglide_Rails_Bottom.000", 45);
                        makeParent(leftSpecs.climaglideBottomRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(leftSpecs.climaglideTopRailCache[totalCounter])) {
                        leftSpecs.climaglideTopRailCache[totalCounter] = cloneObject("Climaglide_Rails_Top.000", 45);
                        makeParent(leftSpecs.climaglideTopRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(leftSpecs.climaglideTopMainRailCache[i])) {
                        leftSpecs.climaglideTopMainRailCache[i] = cloneObject("Climaglide_Rails_Top_Main.000", 5);
                        makeParent(leftSpecs.climaglideTopMainRailCache[i], 'globalManipulator');
                    }
                    for (let x = 0; x < 10; x++) {
                        if (!getObjectByName(leftSpecs.climaglidePanelCache[x + i * 10])) {
                            leftSpecs.climaglidePanelCache[x + i * 10] = cloneObject("Climaglide_Panel.000", 90, true, true);
                            makeParent(leftSpecs.climaglidePanelCache[x + i * 10], 'globalManipulator');
                        }
                    }
                    setObjTransform(leftSpecs.climaglideBottomRailCache[totalCounter], 'position', conservatoryWidth / 2 - 0.01 - (counter * 0.02) - depthAdaptation[0], leftSpecs.optionCenterPos[i], '', false);
                    setObjTransform(leftSpecs.climaglideBottomRailCache[totalCounter], 'rotation', '', '', 90, false);
                    setMorphFactor(leftSpecs.climaglideBottomRailCache[totalCounter], 'Width', ((leftSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(leftSpecs.climaglideTopRailCache[totalCounter], 'position', conservatoryWidth / 2 - 0.01 - (counter * 0.02) - depthAdaptation[0], leftSpecs.optionCenterPos[i], climaglideHeight[0], false);
                    setObjTransform(leftSpecs.climaglideTopRailCache[totalCounter], 'rotation', '', '', 90, false);
                    setMorphFactor(leftSpecs.climaglideTopRailCache[totalCounter], 'Width', ((leftSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(leftSpecs.climaglideTopMainRailCache[i], 'position', conservatoryWidth / 2 - 0.01 - depthAdaptation[0], leftSpecs.optionCenterPos[i], climaglideHeight[0], false);
                    setObjTransform(leftSpecs.climaglideTopMainRailCache[i], 'rotation', '', '', 90, false);
                    setMorphFactor(leftSpecs.climaglideTopMainRailCache[i], 'Width', ((leftSpecs.optionSpacing[i] - 1) / 99));

                    if (leftSpecs.climaglideOpeningDirection[i] == 'middle')
                        setMorphFactor(leftSpecs.climaglideTopMainRailCache[i], 'panelAmount', (leftSpecs.climaglidePanelAmount[i] / 2) - 1);
                    else
                        setMorphFactor(leftSpecs.climaglideTopMainRailCache[i], 'panelAmount', leftSpecs.climaglidePanelAmount[i] - 1);

                    setMorphFactor(leftSpecs.climaglidePanelCache[counter + i * 10], 'Width', ((((leftSpecs.optionSpacing[i]) / leftSpecs.climaglidePanelAmount[i]) - 0.1 + (overhang)) / 100));
                    setMorphFactor(leftSpecs.climaglidePanelCache[counter + i * 10], 'Height', (((climaglideHeight[0]) - 1) / 99));
                    setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'rotation', '', '', -90, false);

                    if (leftSpecs.climaglideOpeningDirection[i] == "right") {
                        if (!leftSpecs.climaglideIsOpen[i])
                            setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 + (counter * 0.02) - ((leftSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation[0], getClimaglidePanelPos(counter, 0, i), '', false);
                        else
                            setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 + (counter * 0.02) - ((leftSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation[0], getClimaglidePanelPos(leftSpecs.climaglidePanelAmount[i] - 1, 0, i), '', false);
                    }
                    else if (leftSpecs.climaglideOpeningDirection[i] == "middle") {
                        if (!leftSpecs.climaglideIsOpen[i]) {
                            if (leftSpecs.climaglidePanelAmount[i] / (counter + 1) > 2)
                                setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (counter * 0.02) - depthAdaptation[0], getClimaglidePanelPos(counter, 0, i), '', false);
                            else if (leftSpecs.climaglidePanelAmount[i] / (counter + 1) == 2 || leftSpecs.climaglidePanelAmount[i] / counter == 2)
                                setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation[0], getClimaglidePanelPos(counter, 0, i), '', false);
                            else
                                setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) - 1 - counter) * 0.02) - depthAdaptation[0], getClimaglidePanelPos(counter, 0, i), '', false);
                        }
                        else {
                            if (leftSpecs.climaglidePanelAmount[i] / (counter + 1) >= 2)
                                setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (counter * 0.02) - depthAdaptation[0], getClimaglidePanelPos(0, 0, i), '', false);
                            else
                                setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (((leftSpecs.climaglidePanelAmount[i]) - 1 - counter) * 0.02) - depthAdaptation[0], getClimaglidePanelPos(leftSpecs.climaglidePanelAmount[i] - 1, 0, i), '', false);
                        }
                    }
                    else {
                        if (!leftSpecs.climaglideIsOpen[i])
                            setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (counter * 0.02) - depthAdaptation[0], getClimaglidePanelPos(counter, 0, i), '', false);
                        else
                            setObjTransform(leftSpecs.climaglidePanelCache[counter + i * 10], 'position', conservatoryWidth / 2 - 0.01 - (counter * 0.02) - depthAdaptation[0], getClimaglidePanelPos(0, 0, i), '', false);
                    }
                    if (!(leftSpecs.climaglideOpeningDirection[i] == 'middle' && leftSpecs.climaglidePanelAmount[i] / (counter + 1) < 2)) {
                        changeVis(leftSpecs.climaglideBottomRailCache[totalCounter], true);
                        changeVis(leftSpecs.climaglideTopRailCache[totalCounter], true);
                    }
                    changeVis(leftSpecs.climaglideTopMainRailCache[i], true);
                    changeVis(leftSpecs.climaglidePanelCache[counter + i * 10], true);


                    if (glassIncluded == false) {
                        setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                        setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                    }
                    else {
                        if (leftSpecs.glassColor[i] == 'glass_Clear') {
                            setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                            setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0);
                        }
                        else if (leftSpecs.glassColor[i] == 'glass_Opal') {
                            setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                            setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.8);
                        }
                        else {
                            setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                            setMaterialValue(getObjectMaterial(leftSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                        }
                    }

                    climaglideHandles(0, leftSpecs.climaglideOpeningDirection[i], i, depthAdaptation[0])

                    if (!leftSpecs.climaglideAnimationSetUp[i]) {
                        onClickActionClimaglide(i + 20);
                        leftSpecs.climaglideAnimationSetUp[i] = true;
                    }
                    totalCounter++;
                }
            }

            //right
            totalCounter = 0;
            for (let i = 0; rightSpecs.poleAmount >= i; i++) {
                for (let counter = 0; rightSpecs.climaglidePanelAmount[i] > counter && rightSpecs.isClimaglideEnabled(i); counter++) {
                    if (!getObjectByName(rightSpecs.climaglideBottomRailCache[totalCounter])) {
                        rightSpecs.climaglideBottomRailCache[totalCounter] = cloneObject("Climaglide_Rails_Bottom.000", 45);
                        makeParent(rightSpecs.climaglideBottomRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(rightSpecs.climaglideTopRailCache[totalCounter])) {
                        rightSpecs.climaglideTopRailCache[totalCounter] = cloneObject("Climaglide_Rails_Top.000", 45);
                        makeParent(rightSpecs.climaglideTopRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(rightSpecs.climaglideTopMainRailCache[i])) {
                        rightSpecs.climaglideTopMainRailCache[i] = cloneObject("Climaglide_Rails_Top_Main.000", 5);
                        makeParent(rightSpecs.climaglideTopMainRailCache[i], 'globalManipulator');
                    }
                    for (let x = 0; x < 10; x++) {
                        if (!getObjectByName(rightSpecs.climaglidePanelCache[x + i * 10])) {
                            rightSpecs.climaglidePanelCache[x + i * 10] = cloneObject("Climaglide_Panel.000", 90, true, true);
                            makeParent(rightSpecs.climaglidePanelCache[x + i * 10], 'globalManipulator');
                        }
                    }
                    setObjTransform(rightSpecs.climaglideBottomRailCache[totalCounter], 'position', -conservatoryWidth / 2 + 0.01 + (counter * 0.02) - depthAdaptation[1], rightSpecs.optionCenterPos[i], '', false);
                    setObjTransform(rightSpecs.climaglideBottomRailCache[totalCounter], 'rotation', '', '', -90, false);
                    setMorphFactor(rightSpecs.climaglideBottomRailCache[totalCounter], 'Width', ((rightSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(rightSpecs.climaglideTopRailCache[totalCounter], 'position', -conservatoryWidth / 2 + 0.01 + (counter * 0.02) - depthAdaptation[1], rightSpecs.optionCenterPos[i], climaglideHeight[1], false);
                    setObjTransform(rightSpecs.climaglideTopRailCache[totalCounter], 'rotation', '', '', -90, false);
                    setMorphFactor(rightSpecs.climaglideTopRailCache[totalCounter], 'Width', ((rightSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(rightSpecs.climaglideTopMainRailCache[i], 'position', -conservatoryWidth / 2 + 0.01 - depthAdaptation[1], rightSpecs.optionCenterPos[i], climaglideHeight[1], false);
                    setObjTransform(rightSpecs.climaglideTopMainRailCache[i], 'rotation', '', '', -90, false);
                    setMorphFactor(rightSpecs.climaglideTopMainRailCache[i], 'Width', ((rightSpecs.optionSpacing[i] - 1) / 99));

                    if (rightSpecs.climaglideOpeningDirection[i] == 'middle')
                        setMorphFactor(rightSpecs.climaglideTopMainRailCache[i], 'panelAmount', (rightSpecs.climaglidePanelAmount[i] / 2) - 1);
                    else
                        setMorphFactor(rightSpecs.climaglideTopMainRailCache[i], 'panelAmount', rightSpecs.climaglidePanelAmount[i] - 1);

                    setMorphFactor(rightSpecs.climaglidePanelCache[counter + i * 10], 'Width', ((((rightSpecs.optionSpacing[i]) / rightSpecs.climaglidePanelAmount[i]) - 0.1 + (overhang)) / 100));
                    setMorphFactor(rightSpecs.climaglidePanelCache[counter + i * 10], 'Height', (((climaglideHeight[1]) - 1) / 99));
                    setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'rotation', '', '', -90, false);

                    if (rightSpecs.climaglideOpeningDirection[i] == "left") {
                        if (!rightSpecs.climaglideIsOpen[i])
                            setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 - counter * 0.02 + ((rightSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation[1], getClimaglidePanelPos(counter, 1, i), '', false);
                        else
                            setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 - counter * 0.02 + ((rightSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation[1], getClimaglidePanelPos(rightSpecs.climaglidePanelAmount[i] - 1, 1, i), '', false);
                    }
                    else if (rightSpecs.climaglideOpeningDirection[i] == "middle") {
                        if (!rightSpecs.climaglideIsOpen[i]) {
                            if (rightSpecs.climaglidePanelAmount[i] / (counter + 1) > 2)
                                setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (counter * 0.02) - depthAdaptation[1], getClimaglidePanelPos(counter, 1, i), '', false);
                            else if (rightSpecs.climaglidePanelAmount[i] / (counter + 1) == 2 || rightSpecs.climaglidePanelAmount[i] / counter == 2)
                                setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) / 2 - 1) * 0.02) - depthAdaptation[1], getClimaglidePanelPos(counter, 1, i), '', false);
                            else
                                setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) - 1 - counter) * 0.02) - depthAdaptation[1], getClimaglidePanelPos(counter, 1, i), '', false);
                        }
                        else {
                            if (rightSpecs.climaglidePanelAmount[i] / (counter + 1) >= 2)
                                setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (counter * 0.02) - depthAdaptation[1], getClimaglidePanelPos(0, 1, i), '', false);
                            else
                                setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (((rightSpecs.climaglidePanelAmount[i]) - 1 - counter) * 0.02) - depthAdaptation[1], getClimaglidePanelPos(rightSpecs.climaglidePanelAmount[i] - 1, 1, i), '', false);
                        }
                    }
                    else {
                        if (!rightSpecs.climaglideIsOpen[i])
                            setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (counter * 0.02) - depthAdaptation[1], getClimaglidePanelPos(counter, 1, i), '', false);
                        else
                            setObjTransform(rightSpecs.climaglidePanelCache[counter + i * 10], 'position', -conservatoryWidth / 2 + 0.01 + (counter * 0.02) - depthAdaptation[1], getClimaglidePanelPos(0, 1, i), '', false);
                    }
                    if (!(rightSpecs.climaglideOpeningDirection[i] == 'middle' && rightSpecs.climaglidePanelAmount[i] / (counter + 1) < 2)) {
                        changeVis(rightSpecs.climaglideBottomRailCache[totalCounter], true);
                        changeVis(rightSpecs.climaglideTopRailCache[totalCounter], true);
                    }
                    changeVis(rightSpecs.climaglideTopMainRailCache[i], true);
                    changeVis(rightSpecs.climaglidePanelCache[counter + i * 10], true);

                    if (rightSpecs.glassColor[i] == 'glass_Clear') {
                        setMaterialValue(getObjectMaterial(rightSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(rightSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0);
                    }
                    else if (rightSpecs.glassColor[i] == 'glass_Opal') {
                        setMaterialValue(getObjectMaterial(rightSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(rightSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.8);
                    }
                    else {
                        setMaterialValue(getObjectMaterial(rightSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                        setMaterialValue(getObjectMaterial(rightSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                    }

                    climaglideHandles(1, rightSpecs.climaglideOpeningDirection[i], i, depthAdaptation[1])

                    if (!rightSpecs.climaglideAnimationSetUp[i]) {
                        onClickActionClimaglide(i + 25);
                        rightSpecs.climaglideAnimationSetUp[i] = true;
                    }
                    totalCounter++;
                }
            }

            //rear
            totalCounter = 0;
            for (let i = 0; rearSpecs.poleAmount >= i; i++) {
                for (let counter = 0; rearSpecs.climaglidePanelAmount[i] > counter && rearSpecs.isClimaglideEnabled(i); counter++) {
                    if (!getObjectByName(rearSpecs.climaglideBottomRailCache[totalCounter])) {
                        rearSpecs.climaglideBottomRailCache[totalCounter] = cloneObject("Climaglide_Rails_Bottom.000", 45);
                        makeParent(rearSpecs.climaglideBottomRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(rearSpecs.climaglideTopRailCache[totalCounter])) {
                        rearSpecs.climaglideTopRailCache[totalCounter] = cloneObject("Climaglide_Rails_Top.000", 45);
                        makeParent(rearSpecs.climaglideTopRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(rearSpecs.climaglideTopMainRailCache[i])) {
                        rearSpecs.climaglideTopMainRailCache[i] = cloneObject("Climaglide_Rails_Top_Main.000", 5);
                        makeParent(rearSpecs.climaglideTopMainRailCache[i], 'globalManipulator');
                    }
                    for (let x = 0; x < 10; x++) {
                        if (!getObjectByName(rearSpecs.climaglidePanelCache[x + i * 10])) {
                            rearSpecs.climaglidePanelCache[x + i * 10] = cloneObject("Climaglide_Panel.000", 90, true, true);
                            makeParent(rearSpecs.climaglidePanelCache[x + i * 10], 'globalManipulator');
                        }
                    }
                    setObjTransform(rearSpecs.climaglideBottomRailCache[totalCounter], 'position', rearSpecs.optionCenterPos[i], getPoleSize("y") - 0.105 + (counter * 0.02) - depthAdaptation[3], '', false);
                    setMorphFactor(rearSpecs.climaglideBottomRailCache[totalCounter], 'Width', ((rearSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(rearSpecs.climaglideTopRailCache[totalCounter], 'position', rearSpecs.optionCenterPos[i], getPoleSize("y") - 0.105 + (counter * 0.02) - depthAdaptation[3], climaglideHeight[3], false);
                    setMorphFactor(rearSpecs.climaglideTopRailCache[totalCounter], 'Width', ((rearSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(rearSpecs.climaglideTopMainRailCache[i], 'position', rearSpecs.optionCenterPos[i], getPoleSize("y") - 0.105 - depthAdaptation[3], climaglideHeight[3], false);
                    setObjTransform(rearSpecs.climaglideTopMainRailCache[i], 'rotation', '', '', 0, false);

                    setMorphFactor(rearSpecs.climaglideTopMainRailCache[i], 'Width', ((rearSpecs.optionSpacing[i] - 1) / 99));
                    if (rearSpecs.climaglideOpeningDirection[i] == 'middle')
                        setMorphFactor(rearSpecs.climaglideTopMainRailCache[i], 'panelAmount', (rearSpecs.climaglidePanelAmount[i] / 2) - 1);
                    else
                        setMorphFactor(rearSpecs.climaglideTopMainRailCache[i], 'panelAmount', rearSpecs.climaglidePanelAmount[i] - 1);

                    setMorphFactor(rearSpecs.climaglidePanelCache[counter + i * 10], 'Width', ((((rearSpecs.optionSpacing[i]) / rearSpecs.climaglidePanelAmount[i]) - 0.1 + (overhang)) / 100));
                    setMorphFactor(rearSpecs.climaglidePanelCache[counter + i * 10], 'Height', (((climaglideHeight[3]) - 1) / 99));

                    if (rearSpecs.climaglideOpeningDirection[i] == "left") {
                        if (!rearSpecs.climaglideIsOpen[i])
                            setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 3, i), getPoleSize("y") - 0.105 - (counter * 0.02) + ((rearSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation[3], '', false);
                        else
                            setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(rearSpecs.climaglidePanelAmount[i] - 1, 3, i), getPoleSize("y") - 0.105 - (counter * 0.02) + ((rearSpecs.climaglidePanelAmount[i] - 1) * 0.02) - depthAdaptation[3], '', false);
                    }
                    else if (rearSpecs.climaglideOpeningDirection[i] == "middle") {
                        if (!rearSpecs.climaglideIsOpen[i]) {
                            if (rearSpecs.climaglidePanelAmount[i] / (counter + 1) > 2)
                                setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 3, i), getPoleSize("y") - 0.105 + (counter * 0.02) - depthAdaptation[3], '', false);
                            else if (rearSpecs.climaglidePanelAmount[i] / (counter + 1) == 2 || rearSpecs.climaglidePanelAmount[i] / counter == 2)
                                setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 3, i), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[3], '', false);
                            else
                                setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 3, i), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] - 1 - counter) * 0.02) - depthAdaptation[3], '', false);
                        }
                        else {
                            if (rearSpecs.climaglidePanelAmount[i] / (counter + 1) >= 2)
                                setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(0, 3, i), getPoleSize("y") - 0.105 + (counter * 0.02) - depthAdaptation[3], '', false);
                            else
                                setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(rearSpecs.climaglidePanelAmount[i] - 1, 3, i), getPoleSize("y") - 0.105 + ((rearSpecs.climaglidePanelAmount[i] - 1 - counter) * 0.02) - depthAdaptation[3], '', false);
                        }
                    }
                    else {
                        if (!rearSpecs.climaglideIsOpen[i])
                            setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 3, i), getPoleSize("y") - 0.105 + (counter * 0.02) - depthAdaptation[3], '', false);
                        else
                            setObjTransform(rearSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(0, 3, i), getPoleSize("y") - 0.105 + (counter * 0.02) - depthAdaptation[3], '', false);
                    }

                    if (!(rearSpecs.climaglideOpeningDirection[i] == 'middle' && rearSpecs.climaglidePanelAmount[i] / (counter + 1) < 2)) {
                        changeVis(rearSpecs.climaglideBottomRailCache[totalCounter], true);
                        changeVis(rearSpecs.climaglideTopRailCache[totalCounter], true);
                    }
                    changeVis(rearSpecs.climaglideTopMainRailCache[i], true);
                    changeVis(rearSpecs.climaglidePanelCache[counter + i * 10], true);

                    if (rearSpecs.glassColor[i] == 'glass_Clear') {
                        setMaterialValue(getObjectMaterial(rearSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(rearSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0);
                    }
                    else if (rearSpecs.glassColor[i] == 'glass_Opal') {
                        setMaterialValue(getObjectMaterial(rearSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                        setMaterialValue(getObjectMaterial(rearSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.8);
                    }
                    else {
                        setMaterialValue(getObjectMaterial(rearSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                        setMaterialValue(getObjectMaterial(rearSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                    }

                    climaglideHandles(3, rearSpecs.climaglideOpeningDirection[i], i, depthAdaptation[3])

                    if (!rearSpecs.climaglideAnimationSetUp[i]) {
                        onClickActionClimaglide(i + 35);
                        rearSpecs.climaglideAnimationSetUp[i] = true;
                    }
                    totalCounter++;
                }
            }

            //standalone
            totalCounter = 0;
            for (let i = 0; standaloneSpecs.poleAmount >= i; i++) {
                for (let counter = 0; standaloneSpecs.climaglidePanelAmount[i] > counter && standaloneSpecs.isClimaglideEnabled(i); counter++) {
                    if (!getObjectByName(standaloneSpecs.climaglideBottomRailCache[totalCounter])) {
                        standaloneSpecs.climaglideBottomRailCache[totalCounter] = cloneObject("Climaglide_Rails_Bottom.000", 45);
                        makeParent(standaloneSpecs.climaglideBottomRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(standaloneSpecs.climaglideTopRailCache[totalCounter])) {
                        standaloneSpecs.climaglideTopRailCache[totalCounter] = cloneObject("Climaglide_Rails_Top.000", 45);
                        makeParent(standaloneSpecs.climaglideTopRailCache[totalCounter], 'globalManipulator');
                    }
                    if (!getObjectByName(standaloneSpecs.climaglideTopMainRailCache[i])) {
                        standaloneSpecs.climaglideTopMainRailCache[i] = cloneObject("Climaglide_Rails_Top_Main.000", 5);
                        makeParent(standaloneSpecs.climaglideTopMainRailCache[i], 'globalManipulator');
                    }
                    for (let x = 0; x < 10; x++) {
                        if (!getObjectByName(standaloneSpecs.climaglidePanelCache[x + i * 10])) {
                            standaloneSpecs.climaglidePanelCache[x + i * 10] = cloneObject("Climaglide_Panel.000", 90, true, true);
                            makeParent(standaloneSpecs.climaglidePanelCache[x + i * 10], 'globalManipulator');
                        }
                    }
                    setObjTransform(standaloneSpecs.climaglideBottomRailCache[totalCounter], 'position', standaloneSpecs.optionCenterPos[i], conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], '', false);
                    setMorphFactor(standaloneSpecs.climaglideBottomRailCache[totalCounter], 'Width', ((standaloneSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(standaloneSpecs.climaglideTopRailCache[totalCounter], 'position', standaloneSpecs.optionCenterPos[i], conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], climaglideHeight[2], false);
                    setMorphFactor(standaloneSpecs.climaglideTopRailCache[totalCounter], 'Width', ((standaloneSpecs.optionSpacing[i] - 1) / 99));

                    setObjTransform(standaloneSpecs.climaglideTopMainRailCache[i], 'position', standaloneSpecs.optionCenterPos[i], conservatoryDepth - getPoleSize("y") + 0.11 - depthAdaptation[2], climaglideHeight[2], false);
                    setObjTransform(standaloneSpecs.climaglideTopMainRailCache[i], 'rotation', '', '', 180, false);

                    setMorphFactor(standaloneSpecs.climaglideTopMainRailCache[i], 'Width', ((standaloneSpecs.optionSpacing[i] - 1) / 99));
                    if (standaloneSpecs.climaglideOpeningDirection[i] == 'middle')
                        setMorphFactor(standaloneSpecs.climaglideTopMainRailCache[i], 'panelAmount', (standaloneSpecs.climaglidePanelAmount[i] / 2) - 1);
                    else
                        setMorphFactor(standaloneSpecs.climaglideTopMainRailCache[i], 'panelAmount', standaloneSpecs.climaglidePanelAmount[i] - 1);

                    setMorphFactor(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'Width', ((((standaloneSpecs.optionSpacing[i]) / standaloneSpecs.climaglidePanelAmount[i]) - 0.1 + (overhang)) / 100));
                    setMorphFactor(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'Height', (((climaglideHeight[2]) - 1 - 0.01) / 99));

                    if (standaloneSpecs.climaglideOpeningDirection[i] == "right") {
                        if (!standaloneSpecs.climaglideIsOpen[i])
                            setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 - (standaloneSpecs.climaglidePanelAmount[i] - 1) * 0.02 + (counter * 0.02) - depthAdaptation[2], '', false);
                        else
                            setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(standaloneSpecs.climaglidePanelAmount[i] - 1, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 - (standaloneSpecs.climaglidePanelAmount[i] - 1) * 0.02 + (counter * 0.02) - depthAdaptation[2], '', false);
                    }
                    else if (standaloneSpecs.climaglideOpeningDirection[i] == "middle") {
                        if (!standaloneSpecs.climaglideIsOpen[i]) {
                            if (standaloneSpecs.climaglidePanelAmount[i] / (counter + 1) > 2)
                                setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 + ((standaloneSpecs.climaglidePanelAmount[i] / 2 - counter - 1) * 0.02) - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                            else if (standaloneSpecs.climaglidePanelAmount[i] / (counter + 1) == 2 || standaloneSpecs.climaglidePanelAmount[i] / counter == 2)
                                setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                            else
                                setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 + (-(standaloneSpecs.climaglidePanelAmount[i] / 2 - counter) * 0.02) - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                        }
                        else {
                            if (standaloneSpecs.climaglidePanelAmount[i] / (counter + 1) >= 2)
                                setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(0, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 + ((standaloneSpecs.climaglidePanelAmount[i] / 2 - counter - 1) * 0.02) - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                            else
                                setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(standaloneSpecs.climaglidePanelAmount[i] - 1, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 + (-(standaloneSpecs.climaglidePanelAmount[i] / 2 - counter) * 0.02) - ((standaloneSpecs.climaglidePanelAmount[i] / 2 - 1) * 0.02) - depthAdaptation[2], '', false);
                        }
                    }
                    else {
                        if (!standaloneSpecs.climaglideIsOpen[i])
                            setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(counter, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], '', false);
                        else
                            setObjTransform(standaloneSpecs.climaglidePanelCache[counter + i * 10], 'position', getClimaglidePanelPos(0, 4, i), conservatoryDepth - getPoleSize("y") + 0.11 - (counter * 0.02) - depthAdaptation[2], '', false);
                    }

                    if (!(standaloneSpecs.climaglideOpeningDirection[i] == 'middle' && standaloneSpecs.climaglidePanelAmount[i] / (counter + 1) < 2)) {
                        changeVis(standaloneSpecs.climaglideBottomRailCache[totalCounter], true);
                        changeVis(standaloneSpecs.climaglideTopRailCache[totalCounter], true);

                    }
                    changeVis(standaloneSpecs.climaglideTopMainRailCache[i], true);
                    changeVis(standaloneSpecs.climaglidePanelCache[counter + i * 10], true);

                    // glass type for climaglide
                    if (glassIncludedClimaglide == 'none') {
                        setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                        setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                        console.log("no glass", standaloneSpecs.climaglidePanelCache[counter + i * 10]);
                    }
                    else {
                        if (glassIncludedClimaglide == 'glass_Clear') {
                            console.log("clear glass");
                            setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                            setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0);
                        }
                        else if (glassIncludedClimaglide == 'glass_Opal') {
                            console.log("opal glass");
                            setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0);
                            setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.8);
                        }
                        else {
                            console.log("tinted glass");
                            setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'NoGlass', 0.5);
                            setMaterialValue(getObjectMaterial(standaloneSpecs.climaglidePanelCache[counter + i * 10], 2, true), 'Tint', 0.25);
                        }
                    }

                    climaglideHandles(4, standaloneSpecs.climaglideOpeningDirection[i], i, depthAdaptation[2])
                    /*  
                                        if (!standaloneSpecs.climaglideAnimationSetUp[i]) {
                                            onClickActionClimaglide(i + 30);
                                            standaloneSpecs.climaglideAnimationSetUp[i] = true;
                                        }*/
                    totalCounter++;
                }
            }
        }

        function frameColors() {
            let outside = colorOutside.substring(1);
            tweenMaterialHexColor(oldOutsideColor, "oldOutsideColor", "Powdercoat", outside, colorTweenTime);
        }

        function animateVerticalScreens(side) {
            if (!enableAnimation || isTweeningAnimations[side])
                return;

            isTweeningAnimations[side] = true;
            let newOpening;
            if (oldVerticalScreenOpening[side] != 0)
                newOpening = 0;
            else
                newOpening = 100;

            animateParam(oldVerticalScreenOpening[side], newOpening, animationTweenTime, 'Linear', 'InOut', 0, false,
                function () {
                    setVerticalScreenOpening(_pGlob.animateParamUpdate, side);
                }, function () {
                    registerSetTimeout(animationRenderStopDelay, function () {
                        oldVerticalScreenOpening[side] = newOpening;
                        isTweeningAnimations[side] = false;
                    });
                });
        }

        function onClickActionVerticalScreen() {
            if (!enableAnimation)
                return;

            singleClickObjList = [/* 'Vertical_Sunblind_Left.000', 'Vertical_Sunblind_Left.001', 'Vertical_Sunblind_Left.002', 'Vertical_Sunblind_Left.003', 'Vertical_Sunblind_Left.004', 'Vertical_Sunblind_Right.000', 'Vertical_Sunblind_Right.001', 'Vertical_Sunblind_Right.002', 'Vertical_Sunblind_Right.003', 'Vertical_Sunblind_Right.004', 'Vertical_Sunblind_Front.000', 'Vertical_Sunblind_Front.001', 'Vertical_Sunblind_Front.002', 'Vertical_Sunblind_Front.003', 'Vertical_Sunblind_Front.004', 'Vertical_Sunblind_Rear.000', 'Vertical_Sunblind_Rear.001', 'Vertical_Sunblind_Rear.002', 'Vertical_Sunblind_Rear.003', 'Vertical_Sunblind_Rear.004', 'Horizontal_Gutter_Left_Vertical sunblind', */ 'Horizontal_Gutter_Left_Vertical sunblind', '', '', '', '', 'Horizontal_Gutter_Right_Vertical sunblind', '', '', '', '', 'Horizontal_Gutter_Front_Vertical sunblind', '', '', '', '', 'Horizontal_Gutter_Rear_Vertical sunblind', '', '', '', '', 'Horizontal_Gutter_Front_Vertical sunblind_standalone'];

            for (let i = 0; singleClickObjList[i] != undefined; i++) {

                registerOnClick(singleClickObjList[i], false, false, [2], function () {
                    animateVerticalScreens(i);
                }, function () { });
            }
        }

        function animateHorizontalScreens(side) {
            if (!enableAnimation || isTweeningAnimations[side])
                return;

            isTweeningAnimations[side] = true;
            let newOpening;
            if (oldHorizontalScreenOpening[side] != 0)
                newOpening = 0;
            else
                newOpening = 100;

            animateParam(oldHorizontalScreenOpening[side], newOpening, animationTweenTime, 'Linear', 'InOut', 0, false,
                function () {
                    setHorizontalScreenOpening(_pGlob.animateParamUpdate, side);
                }, function () {
                    registerSetTimeout(animationRenderStopDelay, function () {
                        oldHorizontalScreenOpening[side] = newOpening;
                        isTweeningAnimations[side] = false;
                    });
                });
        }

        function onClickActionHorizontalScreen() {
            if (!enableAnimation)
                return;

            let singleClickObjList = ['Horizontal screen zipper top.0', 'Horizontal screen non zipper top.0', 'Horizontal screen bottom.0',];

            for (let i = 0; singleClickObjList[i] != undefined; i++) {
                registerOnClick(singleClickObjList[i], false, false, [2], function () {
                    animateHorizontalScreens(i);
                }, function () { });
            }
        }

        function onClickActionClimaglide(pos) {
            if (pos <= 24) {
                for (let i = 0; i < 10; i++) {
                    registerOnClick(leftSpecs.climaglidePanelCache[i + ((pos - 20) * 10)], false, false, [2], function () {
                        animateClimaglide(pos);
                    }, function () { });
                }
            }
            else if (pos <= 29) {
                for (let i = 0; i < 10; i++) {
                    registerOnClick(rightSpecs.climaglidePanelCache[i + ((pos - 25) * 10)], false, false, [2], function () {
                        animateClimaglide(pos);
                    }, function () { });
                }
            }
            else if (pos <= 34) {
                for (let i = 0; i < 10; i++) {
                    registerOnClick(frontSpecs.climaglidePanelCache[i + ((pos - 30) * 10)], false, false, [2], function () {
                        animateClimaglide(pos);
                    }, function () { });
                }
            }
            else if (pos <= 39) {
                for (let i = 0; i < 10; i++) {
                    registerOnClick(rearSpecs.climaglidePanelCache[i + ((pos - 35) * 10)], false, false, [2], function () {
                        animateClimaglide(pos);
                    }, function () { });
                }
            }
        }

        function animateClimaglide(side) {
            if (isTweeningAnimations[side])
                return;

            let oldPos = []; let newPos = []; let climaglideAnimDelay;
            isTweeningAnimations[side] = true;

            //left
            if (side <= 24) {
                let pos = side - 20;
                let pos1; let pos2;

                if (leftSpecs.climaglideOpeningDirection[pos] == "left") {
                    for (let i = 0; leftSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        oldPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                        if (leftSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 0, pos);
                        else
                            newPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[pos * 10], 'position', 'z');//y->z

                        registerSetTimeout((animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * (leftSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == leftSpecs.climaglidePanelAmount[pos] - 1)
                                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', '', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(0, pos), '', false);
                                    setObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                }, function () {
                                    if (i == leftSpecs.climaglidePanelAmount[pos] - 1) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            leftSpecs.climaglideIsOpen[pos] = !leftSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
                else if (leftSpecs.climaglideOpeningDirection[pos] == "middle") {
                    for (let i = 0; leftSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        if (leftSpecs.climaglidePanelAmount[pos] / 2 > i) {
                            oldPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                            if (leftSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 0, pos);
                            else
                                newPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[pos * 10], 'position', 'z');//y->z

                            registerSetTimeout((animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * (leftSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == leftSpecs.climaglidePanelAmount[pos] / 2 - 1)
                                            setObjTransform(leftSpecs.climaglideManipulatorCache[pos2], 'position', '', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(0, pos), '', false);
                                        setObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                    }, function () {
                                        if (i == leftSpecs.climaglidePanelAmount[pos] - 1) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                leftSpecs.climaglideIsOpen[pos] = !leftSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                        else {
                            oldPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                            if (leftSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 0, pos);
                            else
                                newPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[leftSpecs.climaglidePanelAmount[pos] - 1 + 10 * pos], 'position', 'z');//y->z

                            registerSetTimeout((animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == leftSpecs.climaglidePanelAmount[pos] / 2)
                                            setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', '', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(0, pos), '', false);
                                        setObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                    }, function () {
                                        if (i == leftSpecs.climaglidePanelAmount[pos] / 2) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                leftSpecs.climaglideIsOpen[pos] = !leftSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                    }
                }
                else {
                    for (let i = 0; leftSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        oldPos[i] = getObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                        if (leftSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 0, pos);
                        else
                            newPos[i] = getClimaglidePanelPos(leftSpecs.climaglidePanelAmount[pos] - 1, 0, pos);

                        registerSetTimeout((animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (leftSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == 0)
                                        setObjTransform(leftSpecs.climaglideManipulatorCache[pos1], 'position', '', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(0, pos), '', false);
                                    setObjTransform(leftSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                }, function () {
                                    if (i == 0) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            leftSpecs.climaglideIsOpen[pos] = !leftSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
            }

            //right
            else if (side <= 29) {
                let pos = side - 25;
                let pos1; let pos2;

                if (rightSpecs.climaglideOpeningDirection[pos] == "right") {
                    for (let i = 0; rightSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        oldPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                        if (rightSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 1, pos);
                        else
                            newPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[pos * 10], 'position', 'z');//y->z

                        registerSetTimeout((animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * (rightSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == rightSpecs.climaglidePanelAmount[pos] - 1)
                                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', '', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(1, pos), '', false);
                                    setObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                }, function () {
                                    if (i == rightSpecs.climaglidePanelAmount[pos] - 1) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            rightSpecs.climaglideIsOpen[pos] = !rightSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
                else if (rightSpecs.climaglideOpeningDirection[pos] == "middle") {
                    for (let i = 0; rightSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        if (rightSpecs.climaglidePanelAmount[pos] / 2 > i) {
                            oldPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                            if (rightSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 1, pos);
                            else
                                newPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[pos * 10], 'position', 'z');//y->z

                            registerSetTimeout((animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * (rightSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == rightSpecs.climaglidePanelAmount[pos] / 2 - 1)
                                            setObjTransform(rightSpecs.climaglideManipulatorCache[pos2], 'position', '', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(1, pos), '', false);
                                        setObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                    }, function () {
                                        if (i == rightSpecs.climaglidePanelAmount[pos] - 1) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                rightSpecs.climaglideIsOpen[pos] = !rightSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                        else {
                            oldPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                            if (rightSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 1, pos);
                            else
                                newPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[rightSpecs.climaglidePanelAmount[pos] - 1 + 10 * pos], 'position', 'z');//y->z

                            registerSetTimeout((animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == rightSpecs.climaglidePanelAmount[pos] / 2)
                                            setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', '', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(1, pos), '', false);
                                        setObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                    }, function () {
                                        if (i == rightSpecs.climaglidePanelAmount[pos] / 2) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                rightSpecs.climaglideIsOpen[pos] = !rightSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                    }
                }
                else {
                    for (let i = 0; rightSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        oldPos[i] = getObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', 'z');//y->z

                        if (rightSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 1, pos);
                        else
                            newPos[i] = getClimaglidePanelPos(rightSpecs.climaglidePanelAmount[pos] - 1, 1, pos);

                        registerSetTimeout((animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rightSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == 0)
                                        setObjTransform(rightSpecs.climaglideManipulatorCache[pos1], 'position', '', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(1, pos), '', false);
                                    setObjTransform(rightSpecs.climaglidePanelCache[i + pos * 10], 'position', '', _pGlob.animateParamUpdate, '', false);
                                }, function () {
                                    if (i == 0) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            rightSpecs.climaglideIsOpen[pos] = !rightSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
            }

            //front
            else if (side <= 34) {
                let pos = side - 30;
                let pos1; let pos2;

                if (frontSpecs.climaglideOpeningDirection[pos] == "left") {
                    for (let i = 0; frontSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        oldPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                        if (frontSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 2, pos);
                        else
                            newPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[pos * 10], 'position', 'x');

                        registerSetTimeout((animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * (frontSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == frontSpecs.climaglidePanelAmount[pos] - 1)
                                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(2, pos), '', '', false);
                                    setObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                }, function () {
                                    if (i == frontSpecs.climaglidePanelAmount[pos] - 1) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            frontSpecs.climaglideIsOpen[pos] = !frontSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
                else if (frontSpecs.climaglideOpeningDirection[pos] == "middle") {
                    for (let i = 0; frontSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        if (frontSpecs.climaglidePanelAmount[pos] / 2 > i) {
                            oldPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                            if (frontSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 2, pos);
                            else
                                newPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[pos * 10], 'position', 'x');

                            registerSetTimeout((animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * (frontSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == frontSpecs.climaglidePanelAmount[pos] / 2 - 1)
                                            setObjTransform(frontSpecs.climaglideManipulatorCache[pos2], 'position', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(2, pos), '', '', false);
                                        setObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                    }, function () {
                                        if (i == frontSpecs.climaglidePanelAmount[pos] - 1) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                frontSpecs.climaglideIsOpen[pos] = !frontSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                        else {
                            oldPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                            if (frontSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 2, pos);
                            else
                                newPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[frontSpecs.climaglidePanelAmount[pos] - 1 + 10 * pos], 'position', 'x');

                            registerSetTimeout((animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == frontSpecs.climaglidePanelAmount[pos] / 2)
                                            setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(2, pos), '', '', false);
                                        setObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                    }, function () {
                                        if (i == frontSpecs.climaglidePanelAmount[pos] / 2) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                frontSpecs.climaglideIsOpen[pos] = !frontSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                    }
                }
                else {
                    for (let i = 0; frontSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        oldPos[i] = getObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                        if (frontSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 2, pos);
                        else
                            newPos[i] = getClimaglidePanelPos(frontSpecs.climaglidePanelAmount[pos] - 1, 2, pos);

                        registerSetTimeout((animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (frontSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == 0)
                                        setObjTransform(frontSpecs.climaglideManipulatorCache[pos1], 'position', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(2, pos), '', '', false);
                                    setObjTransform(frontSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                }, function () {
                                    if (i == 0) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            frontSpecs.climaglideIsOpen[pos] = !frontSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
            }

            //rear
            else if (side <= 39) {
                let pos = side - 35;
                let pos1; let pos2;

                if (rearSpecs.climaglideOpeningDirection[pos] == "right") {
                    for (let i = 0; rearSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        oldPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                        if (rearSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 3, pos);
                        else
                            newPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[pos * 10], 'position', 'x');

                        registerSetTimeout((animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * (rearSpecs.climaglidePanelAmount[pos] - 1 - i)) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * (rearSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == rearSpecs.climaglidePanelAmount[pos] - 1)
                                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(3, pos), '', '', false);
                                    setObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                }, function () {
                                    if (i == rearSpecs.climaglidePanelAmount[pos] - 1) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            rearSpecs.climaglideIsOpen[pos] = !rearSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
                else if (rearSpecs.climaglideOpeningDirection[pos] == "middle") {
                    for (let i = 0; rearSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        pos2 = (pos + 1) * 2 - 2 + 1;
                        if (rearSpecs.climaglidePanelAmount[pos] / 2 > i) {
                            oldPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                            if (rearSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 3, pos);

                            else
                                newPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[pos * 10], 'position', 'x');

                            registerSetTimeout((animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * (rearSpecs.climaglidePanelAmount[pos] - 1 - i)) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * (rearSpecs.climaglidePanelAmount[pos] - 1 - i), 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == rearSpecs.climaglidePanelAmount[pos] / 2 - 1)
                                            setObjTransform(rearSpecs.climaglideManipulatorCache[pos2], 'position', _pGlob.animateParamUpdate - getClimaglideManipulatorPos(3, pos), '', '', false);
                                        setObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                    }, function () {
                                        if (i == rearSpecs.climaglidePanelAmount[pos] / 2) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                rearSpecs.climaglideIsOpen[pos] = !rearSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                        else {
                            oldPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                            if (rearSpecs.climaglideIsOpen[pos])
                                newPos[i] = getClimaglidePanelPos(i, 3, pos);

                            else
                                newPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[rearSpecs.climaglidePanelAmount[pos] - 1 + 10 * pos], 'position', 'x');

                            registerSetTimeout((animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                                animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                    function () {
                                        if (i == rearSpecs.climaglidePanelAmount[pos] / 2)
                                            setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(3, pos), '', '', false);
                                        setObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                    }, function () {
                                        if (i == rearSpecs.climaglidePanelAmount[pos] / 2) {
                                            registerSetTimeout(animationRenderStopDelay, function () {
                                                isTweeningAnimations[side] = false;
                                                rearSpecs.climaglideIsOpen[pos] = !rearSpecs.climaglideIsOpen[pos];
                                            });
                                        }
                                    });
                            });
                        }
                    }
                }
                else {
                    for (let i = 0; rearSpecs.climaglidePanelAmount[pos] > i; i++) {
                        pos1 = (pos + 1) * 2 - 2;
                        oldPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', 'x');

                        if (rearSpecs.climaglideIsOpen[pos])
                            newPos[i] = getClimaglidePanelPos(i, 3, pos);

                        else
                            newPos[i] = getObjTransform(rearSpecs.climaglidePanelCache[rearSpecs.climaglidePanelAmount[pos] - 1 + 10 * pos], 'position', 'x');

                        registerSetTimeout((animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * i) + climaglideAnimDelay, function () {
                            animateParam(oldPos[i], newPos[i], animationTweenTime - animationTweenTime / (rearSpecs.climaglidePanelAmount[pos] - 1) * i, 'Linear', 'InOut', 0, false,
                                function () {
                                    if (i == 0)
                                        setObjTransform(rearSpecs.climaglideManipulatorCache[pos1], 'position', _pGlob.animateParamUpdate + getClimaglideManipulatorPos(3, pos), '', '', false);
                                    setObjTransform(rearSpecs.climaglidePanelCache[i + pos * 10], 'position', _pGlob.animateParamUpdate, '', '', false);
                                }, function () {
                                    if (i == 0) {
                                        registerSetTimeout(animationRenderStopDelay, function () {
                                            isTweeningAnimations[side] = false;
                                            rearSpecs.climaglideIsOpen[pos] = !rearSpecs.climaglideIsOpen[pos];
                                        });
                                    }
                                });
                        });
                    }
                }
            }
        }

        function getClimaglideManipulatorPos(side, pos) {
            if (side == 0)
                return (getClimaglidePanelPos(0, 0, pos) - getClimaglidePanelPos(1, 0, pos)) / 2 + climaglideManipulatorDistanceFromEdge;
            else if (side == 1)
                return (getClimaglidePanelPos(0, 1, pos) - getClimaglidePanelPos(1, 1, pos)) / 2 + climaglideManipulatorDistanceFromEdge;
            else if (side == 2)
                return (getClimaglidePanelPos(0, 2, pos) - getClimaglidePanelPos(1, 2, pos)) / 2 - climaglideManipulatorDistanceFromEdge;
            else if (side == 3)
                return (getClimaglidePanelPos(0, 3, pos) - getClimaglidePanelPos(1, 3, pos)) / 2 - climaglideManipulatorDistanceFromEdge;
            return 0;
        }

        function enableHorizontalScreen(horizontalScreenEnabled, horizontalScreenColors) {

            if (!horizontalScreenEnabled[0] && !horizontalScreenEnabled[1] && !horizontalScreenEnabled[2])
                return;

            setObjTransform("Horizontal screen zipper top.0", 'position', 0, conservatoryDepth / 2, totalHeight, false);
            setMorphFactor("Horizontal screen zipper top.0", 'Depth', (conservatoryDepth - 1) / 100);
            setMorphFactor("Horizontal screen zipper top.0", 'Width', (conservatoryWidth - 1) / 100);

            setObjTransform("Horizontal screen non zipper top.0", 'position', 0, conservatoryDepth / 2, totalHeight, false);
            setMorphFactor("Horizontal screen non zipper top.0", 'Depth', (conservatoryDepth - 1) / 100);
            setMorphFactor("Horizontal screen non zipper top.0", 'Width', (conservatoryWidth - 1) / 100);

            let sideSupportAmount = parseInt(conservatoryDepth - 0.001) + 2;
            if (horizontalScreenEnabled[1])
                sideSupportAmount = parseInt((conservatoryDepth - 0.001) / 1.5) + 2;
            for (let i = 0; i < sideSupportAmount; i++) {
                if (horizontalScreenTopSideSupportCache.length <= i)
                    horizontalScreenTopSideSupportCache[i] = [cloneObject(horizontalScreenTopSideSupportCache[0][0], 50), cloneObject(horizontalScreenTopSideSupportCache[0][1], 50)];

                setObjTransform(horizontalScreenTopSideSupportCache[i][0], 'position', 0, 0.2 + ((conservatoryDepth - 0.4) / (sideSupportAmount - 1) * i), totalHeight, false);
                setMorphFactor(horizontalScreenTopSideSupportCache[i][0], 'Width', (conservatoryWidth - 1) / 100);

                setObjTransform(horizontalScreenTopSideSupportCache[i][1], 'position', 0, 0.2 + ((conservatoryDepth - 0.4) / (sideSupportAmount - 1) * i), totalHeight, false);
                setMorphFactor(horizontalScreenTopSideSupportCache[i][1], 'Width', (conservatoryWidth - 1) / 100);

                changeVis(horizontalScreenTopSideSupportCache[i][0], horizontalScreenEnabled[0]);
                changeVis(horizontalScreenTopSideSupportCache[i][1], horizontalScreenEnabled[1]);
            }

            setObjTransform("Horizontal screen bottom.0", 'position', 0, conservatoryDepth / 2, totalHeight, false);
            setMorphFactor("Horizontal screen bottom.0", 'Depth', (conservatoryDepth - 1 - 2 * getPoleSize('y')) / 100);
            setMorphFactor("Horizontal screen bottom.0", 'Width', (conservatoryWidth - 1 - 2 * getPoleSize('x')) / 100);

            sideSupportAmount = parseInt((conservatoryDepth - 2 * getPoleSize('y')) - 0.001) + 2;
            for (let i = 1; i < sideSupportAmount; i++) {
                if (!getObjectByName(horizontalScreenBottomSideSupportCache[i]))
                    horizontalScreenBottomSideSupportCache[i] = cloneObject(horizontalScreenBottomSideSupportCache[0], 50);

                setObjTransform(horizontalScreenBottomSideSupportCache[i], 'position', 0, 0.2 + getPoleSize('x') + ((conservatoryDepth - 2 * getPoleSize('x') - 0.4) / (sideSupportAmount - 1) * i), totalHeight, false);
                setMorphFactor(horizontalScreenBottomSideSupportCache[i], 'Width', (conservatoryWidth - 1 - getPoleSize('x') * 2) / 100);

                changeVis(horizontalScreenBottomSideSupportCache[i], horizontalScreenEnabled[2]);
            }
            setHorizontalScreenColors(horizontalScreenColors);
            setHorizontalScreenOpening(oldHorizontalScreenOpening[0], 0);
            setHorizontalScreenOpening(oldHorizontalScreenOpening[1], 1);

            changeVis("Horizontal screen zipper top.0", horizontalScreenEnabled[0]);
            changeVis("Horizontal screen non zipper top.0", horizontalScreenEnabled[1]);
            changeVis("Horizontal screen bottom.0", horizontalScreenEnabled[2]);



            function setHorizontalScreenColors(horizontalScreenColors) {
                let color1 = new v3d.Color(parseInt("0x" + horizontalScreenColors[0])); let color2 = new v3d.Color(parseInt("0x" + horizontalScreenColors[1])); let color3 = new v3d.Color(parseInt("0x" + horizontalScreenColors[2]));

                if (!color2)
                    color2 = color1;
                if (!color3)
                    color3 = color1;

                setMaterialColor('ScreenFabricHorizontal', 'Color 1', color1.r, color1.g, color1.b, '');
                setMaterialColor('ScreenFabricHorizontal', 'Color 2', color2.r, color2.g, color2.b, '');
                setMaterialColor('ScreenFabricHorizontal', 'Color 3', color3.r, color3.g, color3.b, '');

                let color = new v3d.Color(parseInt("0x" + (colorOutside.slice(1))));
                setMaterialColor("Powdercoat", "RGB", color.r, color.g, color.b, '');
            }


        }

        function overlayImage() {
            if (!overlayImageEnabled)
                return;

            renderFrame();
            changeVis("orientationPicker_X", true)
            changeVis("orientationPicker_Y", true)
            changeVis("orientationPicker_topZ", true)
            changeVis("orientationPicker_lowZ", true)
            changeVis("grid", true);

            enableMoveRotManipulator();

            changeVis("overlayImagePlane", overlayImageEnabled);
        }

        function enableMoveRotManipulator() {
            if (overlayImageEnabled) {
                makeParent('globalManipulator', '');
                makeParent('movementManipulator', '');

                makeParent('movementManipulator', 'globalManipulator');
                makeParent('rotationManipulator', 'globalManipulator');

                setObjTransform("rotationManipulator", "position", '', conservatoryDepth / 2, 0.05, false);
                setObjTransform("movementManipulator", "position", '', conservatoryDepth / 2, 0.05, false);

                makeParent('movementManipulator', '');
                makeParent('rotationManipulator', '');

                makeParent('globalManipulator', 'rotationManipulator');
                makeParent('movementManipulator', 'rotationManipulator');
            }
            else {
                makeParent('globalManipulator', '');
                makeParent('movementManipulator', '');

                makeParent('movementManipulator', 'globalManipulator');
                makeParent('rotationManipulator', 'globalManipulator');

                setObjTransform("globalManipulator", "position", 0, 0, 0, false);
                setObjTransform("globalManipulator", "rotation", 0, 0, 0, false);
            }
            changeVis("rotationManipulator", overlayImageEnabled);
            changeVis("movementManipulator", overlayImageEnabled);
        }

        function takeSnapshot() {
            // Single snapshot entry point: position the camera for the active
            cameraPosition(function () {
                registerSetTimeout(0.25, function () {
                    renderFrame();
                    snapshot(appInstance.renderer.domElement.toDataURL("image/png"), 0);
                });
            });
        }

        function tweenCameraToSide(side) {
            let distanceFromSide = 8;

            if ((side == "left" || side == "right" || side == "front" || side == "front") && environmentEnabled)
                return;
            if (side == "left") {
                setObjTransform("Camerapos", "position", conservatoryWidth + distanceFromSide, conservatoryDepth / 2, gutterHeight, false);
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, gutterHeight / 2, false);
            }
            if (side == "right") {
                setObjTransform("Camerapos", "position", -(conservatoryWidth + distanceFromSide), conservatoryDepth / 2, gutterHeight, false);
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, gutterHeight / 2, false);
            }
            if (side == "front") {
                setObjTransform("Camerapos", "position", 0, conservatoryDepth + distanceFromSide, gutterHeight, false);
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, gutterHeight / 2, false);
            }
            if (side == "rear") {
                setObjTransform("Camerapos", "position", 0, -(conservatoryDepth + distanceFromSide), gutterHeight, false);
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, gutterHeight / 2, false);
            }
            if (side == "led") {
                setObjTransform("Camerapos", "position", conservatoryWidth, conservatoryDepth / 2, gutterHeight / 2, false);
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, gutterHeight, false);
            }
            if (side == "top") {
                setObjTransform("Camerapos", "position", 0, conservatoryDepth / 2 + 4, 12, false);
                setObjTransform("Cameratarget", "position", 0, conservatoryDepth / 2, gutterHeight, false);
            }
            tweenCamera("Camerapos", "Cameratarget", animationTweenTime / 1.5);
        }

        function getSideSpecs(specs, selection) {
            if (!specs)
                return 0;

            if (selection == 'optionsL1') {
                if (JSON.parse(specs).level_1.option != "optionsNone")
                    return [JSON.parse(specs).level_1.option, null, null, null, null];
                if (JSON.parse(specs).level_1.screen)
                    return ["optionIntegratedScreen", null, null, null, null];
                if (JSON.parse(specs).level_1.wall)
                    return ["optionsWallPartitions", null, null, null, null];
                return ["optionsNone", null, null, null, null];
            }
            if (selection == 'optionsL2') {
                if (JSON.parse(specs).level_2.option != "optionsNone")
                    return [JSON.parse(specs).level_2.option, null, null, null, null];
                if (JSON.parse(specs).level_1.wall)
                    return ["optionWall", null, null, null, null];
                return ["optionsNone", null, null, null, null];
            }

            if (selection == "wallSpecs") {
                if (JSON.parse(specs).level_1.wall)
                    return JSON.parse(specs).level_1.wall.partitions;
                else if (JSON.parse(specs).level_2.wall)
                    return JSON.parse(specs).level_2.wall.partitions;
                return [];
            }
            if (selection == "climaglidePanelAmount") {
                if (!JSON.parse(specs).level_2.climaglide || !(JSON.parse(specs).level_2.climaglide.partitions[0].climaglidePanelAmount))
                    return [0, 0, 0, 0, 0];
                return [parseInt((JSON.parse(specs).level_2.climaglide.partitions[0].climaglidePanelAmount).substring(21), 10), 0, 0, 0, 0];
            }
            if (selection == "climaglidePanelOpeningDirection") {
                if (!JSON.parse(specs).level_2.climaglide || !(JSON.parse(specs).level_2.climaglide.partitions[0].climaglideOpeningDirection))
                    return [null, null, null, null, null];
                return [(JSON.parse(specs).level_2.climaglide.partitions[0].climaglideOpeningDirection).substring(33).toLowerCase(), null, null, null, null];
            }
            if (selection == 'ledStripInCrown') {
                if (JSON.parse(specs).level_3.option == "optionsLedStripCrown")
                    return true;
                return false;
            }
            if (selection == 'screenInCrown') {
                if (JSON.parse(specs).level_1.screen)
                    return true;
                return false;
            }
            if (selection == "screenHexColor1") {
                if (!JSON.parse(specs).level_1.screen)
                    return ["FFFFFF", null, null, null, null];
                return [JSON.parse(specs).level_1.screen.hexArr[0], null, null, null, null];
            }
            if (selection == "screenHexColor2") {
                if (!JSON.parse(specs).level_1.screen)
                    return ["FFFFFF", null, null, null, null];
                return [JSON.parse(specs).level_1.screen.hexArr[1], null, null, null, null];
            }
            if (selection == "screenHexColor3") {
                if (!JSON.parse(specs).level_1.screen)
                    return ["FFFFFF", null, null, null, null];
                return [JSON.parse(specs).level_1.screen.hexArr[2], null, null, null, null];
            }
            if (selection == "glassColor") {
                if (!JSON.parse(specs).level_2.climaglide || !(JSON.parse(specs).level_2.climaglide.partitions[0].glassColor))
                    return ['glass_Clear', null, null, null, null];
                return [JSON.parse(specs).level_2.climaglide.partitions[0].glassColor, null, null, null, null];
            }
        }

        function enableScene() {
            clearScene();
            wallConfigurator();
            climaglideConfigurator();
            calistaConfigurator();
            horizontalScreenConfigurator();
            enableVerticalScreenStandalone();

            updateMotorRotation();
            //console.log(scope["_tree"])
        }

        function climaglideConfigurator() {
            if (!isClimaglideConfigurator)
                return;

            standaloneSpecs.calculatePoleXpos(getPoleSize('x'));

            enableClimaglide(climaglideOpeningDirection);
            frameColors();
            renderFrame();
        }

        function horizontalScreenConfigurator() {
            if (!isHorizontalScreenConfigurator)
                return;
            enableHorizontalScreen(horizontalScreenEnabled, horizontalScreenColors);
            renderFrame();
        }

        function enableVerticalScreenStandalone() {
            if (!isVerticalScreenConfigurator || !verticalScreenStandalone)
                return;

            changeVis("Horizontal_Gutter_Front_Vertical sunblind_standalone", true);
            setMorphFactor("Horizontal_Gutter_Front_Vertical sunblind_standalone", 'Width', (verticalScreenStandalone.width / 1000 - 1) / 100);      // 
            if (verticalScreenStandalone.motor == 'left')
                setMorphFactor("Horizontal_Gutter_Front_Vertical sunblind_standalone", 'Correction', (verticalScreenStandalone.width / 1000 - 1) / 100); // should be the same value as the width above ^
            else
                setMorphFactor("Horizontal_Gutter_Front_Vertical sunblind_standalone", 'Correction', 0); // should be the same value as the width above ^

            setMorphFactor("Horizontal_Gutter_Front_Vertical sunblind_standalone", 'Height', (verticalScreenStandalone.height / 1000 - 0.275) / 100);
            setObjTransform("Horizontal_Gutter_Front_Vertical sunblind_standalone", 'position', 0, 0.5, verticalScreenStandalone.height / 1000, false);
            setMorphFactor("Horizontal_Gutter_Front_Vertical sunblind_standalone", "MotorSide", (verticalScreenStandalone.motor == 'left') ? 1 : 0);

            renderFrame();

            let color1 = new v3d.Color(parseInt("0x" + verticalScreenStandalone.hexArr[0]));
            let color2 = new v3d.Color(parseInt("0x" + verticalScreenStandalone.hexArr[1]));
            let color3 = new v3d.Color(parseInt("0x" + verticalScreenStandalone.hexArr[2]));
            setMaterialColor('ScreenFabricFront_round', 'Color 1', color1.r, color1.g, color1.b, '');
            setMaterialColor('ScreenFabricFront_round', 'Color 2', color2.r, color2.g, color2.b, '');
            setMaterialColor('ScreenFabricFront_round', 'Color 3', color3.r, color3.g, color3.b, '');

            setMaterialColor('ScreenFabricStandalone', 'Color 1', color1.r, color1.g, color1.b, '');
            setMaterialColor('ScreenFabricStandalone', 'Color 2', color2.r, color2.g, color2.b, '');
            setMaterialColor('ScreenFabricStandalone', 'Color 3', color3.r, color3.g, color3.b, '');

            setMaterialValue("ScreenFabricFront_round", "Scale", verticalScreenStandalone.width / 1000);


            let color = new v3d.Color(parseInt("0x" + (colorOutside.slice(1))));
            setMaterialColor("Powdercoat", "RGB", color.r, color.g, color.b, '');

        }

        function wallConfigurator() {
            if (!isWallConfigurator)
                return;

            enablePartitionWalls();
            renderFrame();
        }

        function calistaConfigurator() {
            if (isWallConfigurator || isClimaglideConfigurator || isHorizontalScreenConfigurator || isVerticalScreenConfigurator)
                return;

            console.log("/////////// calista is working/////");
            enableRoof();
            enableCalistaStructure();
            enableIntegratedVerticalScreen();
            enablePartitionWalls();
            enableClimaglide(climaglideOpeningDirection);
            frameColors();
            enableHorizontalScreen(horizontalScreenEnabled, horizontalScreenColors);
            enableMeasurements();
            enableEnvironment(environmentEnabled);
            enableInfoText();
        }
        function resetMeasurementColor() {
            setMaterialValue("Measurements_Width", "Value", 0);
            setMaterialValue("Measurements_Depth", "Value", 0);
            setMaterialValue("Measurements_Height", "Value", 0);
        }

        /// tree
        let tree = scope['_tree'];

        //Environment control
        let enableAnimation = true;
        let animationTweenTime = 1.5;
        let animationRenderStopDelay = 1;
        let colorTweenTime = 0.3;
        let continousRender = false;
        let disableAdditionaWalls = false;
        let pixelRatioSet = [1.6, 1.6];
        let disableOverlayImage = false;

        if (scope['_3d_optionsRoof'] && scope['_3d_optionsRoof'] != "undefined")
            isCalistaConfigurator = true;

        overlayImageEnabled;
        houseType = "modern";
        if (scope['_3d_fixedWall_out'])
            isWallConfigurator = true;

        isClimaglideConfigurator = false;
        if (scope['_3d_climaglide'])
            isClimaglideConfigurator = true;

        isHorizontalScreenConfigurator = false;
        if ((scope['_3d_screen_H_location'] == "horizontalScreenPositionAboveRoof" || scope['_3d_screen_H_location'] == "horizontalScreenPositionUnderRoof") && !isCalistaConfigurator)
            isHorizontalScreenConfigurator = true;

        isVerticalScreenConfigurator = false;
        if (scope['_3d_screen_V'] && !isCalistaConfigurator) {
            isVerticalScreenConfigurator = true;
            verticalScreenStandalone = JSON.parse(scope['_3d_screen_V']);
        }

        //Construction type
        isFreestanding = false;
        if (scope['_3d_conservatoryStructure'] == "constructionTypeFreeStanding")
            isFreestanding = true;

        designStyle = "Horizontal";
        let isHorizontalRoof = true;

        conservatoryWidth = scope['_3d_conservatoryWidthBmm'] / 1000;
        conservatoryDepth = scope['_3d_conservatoryDepthDToPostmm'] / 1000;
        gutterHeight = scope['_3d_conservatoryHeightUnderGutter'] / 1000;
        totalHeight = Math.round(gutterHeight * 100 + 26) / 100;//0.26->height of horizontal gutter; rounding used to avoid floating point error

        //Keep vars in MM to avoid floating point precision error
        conservatoryWidthMM = scope['_3d_conservatoryWidthBmm'];
        conservatoryDepthMM = scope['_3d_conservatoryDepthDToPostmm'];
        totalHeightMM = scope['_3d_conservatoryHeightUnderGutter'] + 260;

        leftSpecs.poleAmount = scope['_3d_polesLeftAmount'];
        rightSpecs.poleAmount = scope['_3d_polesRightAmount'];
        frontSpecs.poleAmount = scope['_3d_polesFrontAmount'];
        rearSpecs.poleAmount = scope['_3d_polesBackAmount'];

        // roof screen motor side
        let roofScreenSide = scope['_3d_screen_H_motor'];

        //Options
        horizontalScreenEnabled = [scope['_3d_screen_H_location'] == "horizontalScreenPositionAboveRoof" && scope['_3d_screen_H_type'] == "screenType_Zip", scope['_3d_screen_H_location'] == "horizontalScreenPositionAboveRoof" && scope['_3d_screen_H_type'] == "screenType_NonZip", scope['_3d_screen_H_location'] == "horizontalScreenPositionUnderRoof"]; //[top,bottom]

        if (scope['_3d_screen_H_canvas'])
            horizontalScreenColors = JSON.parse(scope['_3d_screen_H_canvas']);



        let climaglideEnabled = [false, false, [false, false, false, false, false], [false, false, false, false, false]];
        let climaglidePanelOverhang = 0.03;
        let climaglideManipulatorDistanceFromEdge = 0.1;
        climaglideOpeningDirection = [scope['_3d_optionsLeftOpeningDirection'], scope['_3d_optionsRightOpeningDirection'], scope['_3d_optionsMiddleOpeningDirection'], scope['_3d_optionsBackOpeningDirection']];

        if (parseInt(scope['_3d_optionsLeftPanelAmount'], 10))
            climaglideSegments[0] = parseInt(scope['_3d_optionsLeftPanelAmount'], 10);
        if (parseInt(scope['_3d_optionsRightPanelAmount'], 10))
            climaglideSegments[1] = parseInt(scope['_3d_optionsRightPanelAmount'], 10);
        if (parseInt(scope['_3d_optionsMiddlePanelAmount'], 10))
            climaglideSegments[2] = parseInt(scope['_3d_optionsMiddlePanelAmount'], 10);
        if (parseInt(scope['_3d_optionsBackPanelAmount'], 10))
            climaglideSegments[3] = parseInt(scope['_3d_optionsBackPanelAmount'], 10);

        leftSpecs.optionsL1 = getSideSpecs(scope['_3d_optionsLeft'], 'optionsL1');
        leftSpecs.optionsL2 = getSideSpecs(scope['_3d_optionsLeft'], 'optionsL2');
        leftSpecs.optionsL3 = [getSideSpecs(scope['_3d_optionsLeft'], 'ledStripInCrown'), getSideSpecs(scope['_3d_optionsLeft'], 'screenInCrown')];
        leftSpecs.wallSpecs = getSideSpecs(scope['_3d_optionsLeft'], "wallSpecs");
        leftSpecs.getVerticalScreenColors(getSideSpecs(scope['_3d_optionsLeft'], 'screenHexColor1'), getSideSpecs(scope['_3d_optionsLeft'], 'screenHexColor2'), getSideSpecs(scope['_3d_optionsLeft'], 'screenHexColor3'));
        leftSpecs.calculateOptionSpacing(getPoleSize('x'), getPoleSize('y'), isHorizontalRoof);
        leftSpecs.calculateOptionCenterPos(getPoleSize('x'), getPoleSize('y'), isHorizontalRoof);
        leftSpecs.getClimaglideOpeningDirection(getSideSpecs(scope['_3d_optionsLeft'], 'climaglidePanelOpeningDirection'));
        leftSpecs.getClimaglidePanelAmount(getSideSpecs(scope['_3d_optionsLeft'], 'climaglidePanelAmount'));
        leftSpecs.getGlassColor(getSideSpecs(scope['_3d_optionsLeft'], 'glassColor'));

        rightSpecs.optionsL1 = getSideSpecs(scope['_3d_optionsRight'], 'optionsL1');
        rightSpecs.optionsL2 = getSideSpecs(scope['_3d_optionsRight'], 'optionsL2');
        rightSpecs.optionsL3 = [getSideSpecs(scope['_3d_optionsRight'], 'ledStripInCrown'), getSideSpecs(scope['_3d_optionsRight'], 'screenInCrown')];
        rightSpecs.wallSpecs = getSideSpecs(scope['_3d_optionsRight'], "wallSpecs");
        rightSpecs.getVerticalScreenColors(getSideSpecs(scope['_3d_optionsRight'], 'screenHexColor1'), getSideSpecs(scope['_3d_optionsRight'], 'screenHexColor2'), getSideSpecs(scope['_3d_optionsRight'], 'screenHexColor3'));
        rightSpecs.calculateOptionSpacing(getPoleSize('x'), getPoleSize('y'), isHorizontalRoof);
        rightSpecs.calculateOptionCenterPos(getPoleSize('x'), getPoleSize('y'), isHorizontalRoof);
        rightSpecs.getClimaglideOpeningDirection(getSideSpecs(scope['_3d_optionsRight'], 'climaglidePanelOpeningDirection'));
        rightSpecs.getClimaglidePanelAmount(getSideSpecs(scope['_3d_optionsRight'], 'climaglidePanelAmount'));
        rightSpecs.getGlassColor(getSideSpecs(scope['_3d_optionsRight'], 'glassColor'));

        frontSpecs.optionsL1 = getSideSpecs(scope['_3d_optionsMiddle'], 'optionsL1');
        frontSpecs.optionsL2 = getSideSpecs(scope['_3d_optionsMiddle'], 'optionsL2');
        frontSpecs.optionsL3 = [getSideSpecs(scope['_3d_optionsMiddle'], 'ledStripInCrown'), getSideSpecs(scope['_3d_optionsMiddle'], 'screenInCrown')];
        frontSpecs.wallSpecs = getSideSpecs(scope['_3d_optionsMiddle'], "wallSpecs");
        frontSpecs.getVerticalScreenColors(getSideSpecs(scope['_3d_optionsMiddle'], 'screenHexColor1'), getSideSpecs(scope['_3d_optionsMiddle'], 'screenHexColor2'), getSideSpecs(scope['_3d_optionsMiddle'], 'screenHexColor3'));
        frontSpecs.calculateOptionSpacing(getPoleSize('x'), getPoleSize('y'));
        frontSpecs.calculateOptionCenterPos(getPoleSize('x'), getPoleSize('y'));
        frontSpecs.getClimaglideOpeningDirection(getSideSpecs(scope['_3d_optionsMiddle'], 'climaglidePanelOpeningDirection'));
        frontSpecs.getClimaglidePanelAmount(getSideSpecs(scope['_3d_optionsMiddle'], 'climaglidePanelAmount'));
        frontSpecs.getGlassColor(getSideSpecs(scope['_3d_optionsMiddle'], 'glassColor'));

        rearSpecs.optionsL1 = getSideSpecs(scope['_3d_optionsBack'], 'optionsL1');
        rearSpecs.optionsL2 = getSideSpecs(scope['_3d_optionsBack'], 'optionsL2');
        rearSpecs.optionsL3 = [getSideSpecs(scope['_3d_optionsBack'], 'ledStripInCrown'), getSideSpecs(scope['_3d_optionsBack'], 'screenInCrown')];
        rearSpecs.wallSpecs = getSideSpecs(scope['_3d_optionsBack'], "wallSpecs");
        rearSpecs.getVerticalScreenColors(getSideSpecs(scope['_3d_optionsBack'], 'screenHexColor1'), getSideSpecs(scope['_3d_optionsBack'], 'screenHexColor2'), getSideSpecs(scope['_3d_optionsBack'], 'screenHexColor3'));
        rearSpecs.calculateOptionSpacing(getPoleSize('x'), getPoleSize('y'));
        rearSpecs.calculateOptionCenterPos(getPoleSize('x'), getPoleSize('y'));
        rearSpecs.getClimaglideOpeningDirection(getSideSpecs(scope['_3d_optionsBack'], 'climaglidePanelOpeningDirection'));
        rearSpecs.getClimaglidePanelAmount(getSideSpecs(scope['_3d_optionsBack'], 'climaglidePanelAmount'));
        rearSpecs.getGlassColor(getSideSpecs(scope['_3d_optionsBack'], 'glassColor'));

        //Colors
        colorOutside = "#5293133";
        if (scope['_3d_colourOutside'] != "000000")
            colorOutside = "#" + scope['_3d_colourOutside'];

        if (isWallConfigurator) {
            conservatoryWidth = JSON.parse(scope['_3d_fixedWall_out']).width / 1000;
            conservatoryDepth = 1;
            gutterHeight = JSON.parse(scope['_3d_fixedWall_out']).height / 1000;

            totalHeight = Math.round(gutterHeight * 100 + 26) / 100;


            ///////// Glass
            //glassIncluded = JSON.parse(scope['_3d_fixedWall_out']).glassIncluded;

            console.log("glassIncluded SIDES: " + glassIncluded);

            standaloneSpecs.optionsL1 = ['optionsWallPartitions', null, null, null, null];
            standaloneSpecs.wallSpecs = JSON.parse(scope['_3d_fixedWall_out']).partitions;
            standaloneSpecs.calculateOptionSpacing(getPoleSize('x'), getPoleSize('y'));
            standaloneSpecs.calculateOptionCenterPos(getPoleSize('x'), getPoleSize('y'));
        }

        if (isClimaglideConfigurator) {
            let specs = (JSON.parse(scope['_3d_climaglide'])).partitions[0];
            console.log(specs)

            glassIncludedClimaglide = specs.glassColor;

            conservatoryWidth = specs.width / 1000;
            conservatoryDepth = 1;
            gutterHeight = specs.height / 1000;

            colorOutside = "#" + specs.color;

            totalHeight = Math.round(gutterHeight * 100 + 26) / 100;

            standaloneSpecs.optionsL2 = ['optionsClimaglide', null, null, null, null];

            standaloneSpecs.getClimaglideOpeningDirection([specs.climaglideOpeningDirection.substring(33).toLowerCase()]);
            standaloneSpecs.getClimaglidePanelAmount([specs.climaglidePanelAmount.substring(21)]);
            standaloneSpecs.calculateOptionSpacing(getPoleSize('x'), getPoleSize('y'));
            standaloneSpecs.calculateOptionCenterPos(getPoleSize('x'), getPoleSize('y'));
        }

        if (scope['_3d_base_options'])
            postSupportType = [JSON.parse(scope['_3d_base_options'])[0]["left front"], JSON.parse(scope['_3d_base_options'])[0]["right front"], JSON.parse(scope['_3d_base_options'])[0]["left back"], JSON.parse(scope['_3d_base_options'])[0]["right back"]];

        if (scope['_3d_optionsRoof'])
            roofSpecs = JSON.parse(scope['_3d_optionsRoof']);

        //console.log(JSON.stringify(scope))

        //Environment
        additionalWallsSpecs = [false, false, false, false];
        if (scope['_3d_walls'] == "additionOneWallOneSideLeft" || scope['_3d_walls'] == "additionOneWallTwoSide" || scope['_3d_walls'] == "additionFourWalls")
            additionalWallsSpecs[0] = true;
        if (scope['_3d_walls'] == "additionOneWallOneSideRight" || scope['_3d_walls'] == "additionOneWallTwoSide" || scope['_3d_walls'] == "additionFourWalls")
            additionalWallsSpecs[1] = true;
        if (scope['_3d_walls'] == "additionFourWalls" || scope['_3d_walls'] == "additionFrontBack")
            additionalWallsSpecs[2] = true;
        if (scope['_3d_walls'] == "additionOneWall" || scope['_3d_walls'] == "additionOneWallOneSideLeft" || scope['_3d_walls'] == "additionOneWallTwoSide" || scope['_3d_walls'] == "additionFourWalls" || scope['_3d_walls'] == "additionOneWallOneSideRight" || scope['_3d_walls'] == "additionBack" || scope['_3d_walls'] == "additionFrontBack")
            additionalWallsSpecs[3] = true;

        glassIncluded = scope['_3d_glassIncluded'];

        let ssrPerspective = scope['_perspective'];
        let isSSR = scope['_ssrEnvironment'];

        enableScene();
        resetMeasurementColor();
        updateMotorRotation();
        takeSnapshot();
        //   overlayImage();

        if (!sceneIsInitialized) {

            changeVis( "Spot", true);
            for (let i = 0; i <= 100; i++) {
                setTimeout(() => {
                    getJSFunction('getLoadPercentageFrom3D')(i);
                }, i);
            }
            whenMoved("Camera", 0.001, 5, function () {
                appInstance.enableRendering();
            }, function () { }, function () {
                appInstance.disableRendering(0);
            });
            onClickActionVerticalScreen();
            onClickActionHorizontalScreen();
            //cameraPosition();
            initializeDragActions();

            initObjectPicking(function (intersects, downEvent) {
                _pGlob.objDragOverInfoGlobal.forEach(function (el) {
                    if (downEvent instanceof MouseEvent)
                        if (el.mouseButtons.indexOf(downEvent.button) == -1)
                            return;

                    var maxIntersects = el.xRay ? intersects.length : Math.min(1, intersects.length);

                    for (var i = 0; i < maxIntersects; i++) {
                        var obj = intersects[i].object;
                        var objName = getPickedObjectName(obj);

                        if (objectsIncludeObj([el.objName], objName)) {
                            el.callback({ downEvent: downEvent, draggedObjName: objName });
                        }
                    }
                });
            }, 'mousedown', true);
            sceneIsInitialized = true;
        }
        else
            getJSFunction('getLoadPercentageFrom3D')(100);
    }
}
export { createPL };
