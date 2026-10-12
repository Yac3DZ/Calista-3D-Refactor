//Example input scope for Skylux Calista (h roof) - WALL-ADJACENT, house wall at the rear.
//Full per-field contract: see prototype_input_example_h_roof.js.
//
//=== One section, 5000 x 3500, crown underside at 2400. Plastic roof with an under-roof screen (bottomZipper).
//    the rear is the house wall: it carries the two wall-adjacent poles and no bays. front carries both
//    front corners; left and right run between them with no pole of their own.
//
//                         REAR - house wall
//            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
//            ◆                                                 ◆
//    LEFT    ┃                                                 ┃    RIGHT
//    fixed   ┃                                                 ┃    climaglide + sunblind
//    wall    ┃                                                 ┃    with full-width window
//            ┃                                                 ┃
//            ■━━━━━━━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━━━━━■
//               FRONT - climaglide + integrated sunblind | surface fixed wall
//
//            ■ corner pole 150 x 150   ○ intermediate pole 100 x 150   ◆ wall-adjacent pole 150 x 150
//

export const _3d_calistaScope = {
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
                    { "position": 4500, "width": 1000, "type": "plastic" },
                ],

                "rafters": [
                    { "position": 1000, "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" }, "ledStrip": null },
                    { "position": 2000, "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" }, "ledStrip": null },
                    { "position": 3000, "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" }, "ledStrip": null },
                    { "position": 4000, "ledSpot": { "positions": [875, 1750, 2625], "color": "#FFFFFF" }, "ledStrip": null },
                ],
            },
        },
    ],

    "_3d_SideOpenings": [
        //front - carries the two front corners
        {
            "sideSpecs": { "xPos": 2500, "yPos": 3500, "rotation": 270, "length": 5000, "height": 2400, "poleAmount": 3, "sections": ["Section_1"] },
            "poles": [
                { "type": "corner", "position": 75, "width": 150, "depth": 150, "length": 2400, "support": "bracketUnder", "index": 0 },
                { "type": "intermediate", "position": 2500, "width": 100, "depth": 150, "length": 2400, "support": "bracketUnder", "index": 1 },
                { "type": "corner", "position": 4925, "width": 150, "depth": 150, "length": 2400, "support": "bracketUnder", "index": 2 },
            ],
            "bays": [
                {
                    "generalSpecs": { "position": 1300, "length": 2300, "height": 2400 },
                    "climaglide": { "mounting": "surface", "panelAmount": 3, "openingDirection": "left", "handle": true, "sideProfile": true, "foundationProfile": false, "draftProfile": null, "glass": "glassClear" },
                    "verticalSunblind": {
                        "mounting": "builtIn", "type": "element", "screenColor": ["#3C3C3C", "#3C3C3C", "#3C3C3C"], "solar": true,
                        "window": { "type": "partialWidth", "position": 1300, "width": 1000, "height": 700, "groundHeight": 800 },
                    },
                    "fixedWall": null,
                    "ledStrip": null,
                },
                {
                    "generalSpecs": { "position": 3700, "length": 2300, "height": 2400 },
                    "climaglide": null,
                    "verticalSunblind": null,
                    "fixedWall": {
                        "mounting": "surface",
                        "partitions": [
                            { "position": 3125, "width": 1150, "height": 2400, "fillType": "woodOutside" },
                            { "position": 4275, "width": 1150, "height": 2400, "fillType": "sandwichPanelWhite" },
                        ],
                    },
                    "ledStrip": null,
                },
            ],
        },

        //rear - the house wall, carries both wall-adjacent poles
        {
            "sideSpecs": { "xPos": -2500, "yPos": 0, "rotation": 90, "length": 5000, "height": 2400, "poleAmount": 2, "sections": ["Section_1"] },
            "poles": [
                { "type": "wallAdjacent", "position": 75, "width": 150, "depth": 150, "length": 2400, "support": "foundation", "index": 0 },
                { "type": "wallAdjacent", "position": 4925, "width": 150, "depth": 150, "length": 2400, "support": "foundation", "index": 1 },
            ],
            "bays": [],
        },

        //left - runs between the rear's wall-adjacent pole and the front's corner pole
        {
            "sideSpecs": { "xPos": 2500, "yPos": 0, "rotation": 0, "length": 3500, "height": 2400, "poleAmount": 0, "sections": ["Section_1"] },
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
                            { "position": 2525, "width": 1650, "height": 2400, "fillType": "woodInside" },
                        ],
                    },
                    "ledStrip": { "mounting": "builtIn", "color": "#FFFFFF" },
                },
            ],
        },

        //right - runs between the front's corner pole and the rear's wall-adjacent pole
        {
            "sideSpecs": { "xPos": -2500, "yPos": 3500, "rotation": 180, "length": 3500, "height": 2400, "poleAmount": 0, "sections": ["Section_1"] },
            "poles": [],
            "bays": [
                {
                    "generalSpecs": { "position": 1750, "length": 3200, "height": 2400 },
                    "climaglide": { "mounting": "surface", "panelAmount": 4, "openingDirection": "right", "handle": true, "sideProfile": false, "foundationProfile": true, "draftProfile": "alu", "glass": "glassOpal" },
                    "verticalSunblind": {
                        "mounting": "builtIn", "type": "axiom130", "screenColor": ["#8C8C8C", "#8C8C8C", "#5A5A5A"], "solar": false,
                        "window": { "type": "fullWidth", "position": 1750, "width": 3200, "height": 800, "groundHeight": 1200 },
                    },
                    "fixedWall": null,
                    "ledStrip": { "mounting": "builtIn", "color": "#FFFFFF" },
                },
            ],
        },
    ],
};
