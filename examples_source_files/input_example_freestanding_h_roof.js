//Example input scope for Skylux Calista (h roof) - FREE-STANDING, four open sides.
//Full per-field contract: see prototype_input_example_h_roof.js.
//
//=== One section, 6000 x 4000, crown underside at 2500. Glass roof with an above-roof zipper screen.
//    front and rear carry all four corner poles; left runs between them on one intermediate pole,
//    right spans corner to corner with no pole of its own.
//
//                              REAR - fixed walls, built in
//            ■━━━━━━━━━━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━━━━━━━━■
//            ┃                                                       ┃
//    LEFT    ┃                                                       ┃    RIGHT
//    sunblinds  ○                                                    ┃    one 3700 bay,
//    + windows ┃                                                     ┃    6-panel climaglide
//            ┃                                                       ┃
//            ■━━━━━━━━━━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━━━━━━━━■
//                FRONT - climaglide + built-in sunblind + crown LED, both bays
//
//            ■ corner pole 150 x 150      ○ intermediate pole 100 x 150
//

export const _3d_calistaScope = {
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
                    { "position": 5500, "width": 1000, "type": "glassClear" },
                ],

                "rafters": [
                    { "position": 1000, "ledSpot": { "positions": [1000, 2000, 3000], "color": "#FFD1A3" }, "ledStrip": null },
                    { "position": 2000, "ledSpot": null, "ledStrip": null },
                    { "position": 3000, "ledSpot": null, "ledStrip": "#FFFFFF" },
                    { "position": 4000, "ledSpot": null, "ledStrip": null },
                    { "position": 5000, "ledSpot": { "positions": [1000, 2000, 3000], "color": "#FFD1A3" }, "ledStrip": null },
                ],
            },
        },
    ],

    "_3d_SideOpenings": [
        //front - carries the two front corners
        {
            "sideSpecs": { "xPos": 3000, "yPos": 4000, "rotation": 270, "length": 6000, "height": 2500, "poleAmount": 3, "sections": ["Section_1"] },
            "poles": [
                { "type": "corner", "position": 75, "width": 150, "depth": 150, "length": 2500, "support": "foundation", "index": 0 },
                { "type": "intermediate", "position": 3000, "width": 100, "depth": 150, "length": 2500, "support": "foundation", "index": 1 },
                { "type": "corner", "position": 5925, "width": 150, "depth": 150, "length": 2500, "support": "foundation", "index": 2 },
            ],
            "bays": [
                {
                    "generalSpecs": { "position": 1550, "length": 2800, "height": 2500 },
                    "climaglide": { "mounting": "surface", "panelAmount": 4, "openingDirection": "middle", "handle": true, "sideProfile": true, "foundationProfile": true, "draftProfile": "alu", "glass": "glassClear" },
                    "verticalSunblind": { "mounting": "builtIn", "type": "axiom100", "screenColor": ["#7A7A7A", "#7A7A7A", "#7A7A7A"], "solar": false, "window": null },
                    "fixedWall": null,
                    "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" },
                },
                {
                    "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 },
                    "climaglide": { "mounting": "surface", "panelAmount": 3, "openingDirection": "right", "handle": true, "sideProfile": false, "foundationProfile": true, "draftProfile": "alu", "glass": "glassClear" },
                    "verticalSunblind": { "mounting": "builtIn", "type": "axiom100", "screenColor": ["#7A7A7A", "#7A7A7A", "#7A7A7A"], "solar": false, "window": null },
                    "fixedWall": null,
                    "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" },
                },
            ],
        },

        //rear - carries the two rear corners
        {
            "sideSpecs": { "xPos": -3000, "yPos": 0, "rotation": 90, "length": 6000, "height": 2500, "poleAmount": 3, "sections": ["Section_1"] },
            "poles": [
                { "type": "corner", "position": 75, "width": 150, "depth": 150, "length": 2500, "support": "foundation", "index": 0 },
                { "type": "intermediate", "position": 3000, "width": 100, "depth": 150, "length": 2500, "support": "foundation", "index": 1 },
                { "type": "corner", "position": 5925, "width": 150, "depth": 150, "length": 2500, "support": "foundation", "index": 2 },
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
                            { "position": 2250, "width": 1400, "height": 2500, "fillType": "glassClear" },
                        ],
                    },
                    "ledStrip": null,
                },
                {
                    "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 },
                    "climaglide": null,
                    "verticalSunblind": null,
                    "fixedWall": {
                        "mounting": "builtIn",
                        "partitions": [
                            { "position": 4450, "width": 2800, "height": 2500, "fillType": "glassOpal" },
                        ],
                    },
                    "ledStrip": null,
                },
            ],
        },

        //left - runs between the rear and front corner poles, one intermediate pole
        {
            "sideSpecs": { "xPos": 3000, "yPos": 0, "rotation": 0, "length": 4000, "height": 2500, "poleAmount": 1, "sections": ["Section_1"] },
            "poles": [
                { "type": "intermediate", "position": 2000, "width": 100, "depth": 150, "length": 2500, "support": "foundation", "index": 0 },
            ],
            "bays": [
                {
                    "generalSpecs": { "position": 1050, "length": 1800, "height": 2500 },
                    "climaglide": null,
                    "verticalSunblind": {
                        "mounting": "builtIn", "type": "axiom130", "screenColor": ["#4D504D", "#4D504D", "#4D504D"], "solar": true,
                        "window": { "type": "partialWidth", "position": 1050, "width": 800, "height": 800, "groundHeight": 900 },
                    },
                    "fixedWall": null,
                    "ledStrip": null,
                },
                {
                    "generalSpecs": { "position": 2950, "length": 1800, "height": 2500 },
                    "climaglide": null,
                    "verticalSunblind": {
                        "mounting": "builtIn", "type": "axiom130", "screenColor": ["#4D504D", "#4D504D", "#4D504D"], "solar": true,
                        "window": { "type": "fullWidth", "position": 2950, "width": 1800, "height": 600, "groundHeight": 1000 },
                    },
                    "fixedWall": null,
                    "ledStrip": null,
                },
            ],
        },

        //right - runs between the front and rear corner poles, no pole of its own
        {
            "sideSpecs": { "xPos": -3000, "yPos": 4000, "rotation": 180, "length": 4000, "height": 2500, "poleAmount": 0, "sections": ["Section_1"] },
            "poles": [],
            "bays": [
                {
                    "generalSpecs": { "position": 2000, "length": 3700, "height": 2500 },
                    "climaglide": { "mounting": "surface", "panelAmount": 6, "openingDirection": "middle", "handle": true, "sideProfile": false, "foundationProfile": true, "draftProfile": "pvc", "glass": "glassOpal" },
                    "verticalSunblind": null,
                    "fixedWall": null,
                    "ledStrip": null,
                },
            ],
        },
    ],
};
