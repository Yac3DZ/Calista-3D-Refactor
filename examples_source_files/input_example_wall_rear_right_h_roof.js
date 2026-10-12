//Example input scope for Skylux Calista (h roof) - WALL-ADJACENT, house walls at the rear and the right.
//Full per-field contract: see prototype_input_example_h_roof.js.
//
//=== One section, 4500 x 3000, crown underside at 2600. Sandwich-panel roof, no horizontal screen.
//    the rear and the right are house walls: each carries one wall-adjacent pole and no bays. front carries
//    the front-left corner and runs to the right wall's pole; left runs from the rear wall's pole to that corner.
//
//                         REAR - house wall
//            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
//            ◆                                                 ▓
//    LEFT    ┃                                                 ▓    RIGHT
//    climaglide                                                ▓    house wall
//    + sunblind ┃                                              ▓
//            ┃                                                 ▓
//            ■━━━━━━━━━━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━━━━━━━━━━◆
//               FRONT - built-in fixed wall | surface sunblind, crown LED on both bays
//
//            ■ corner pole 150 x 150   ○ intermediate pole 100 x 150   ◆ wall-adjacent pole 150 x 150
//

export const _3d_calistaScope = {
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
                    { "position": 4125, "width": 750, "type": "sandwichPanelAnthracite" },
                ],

                "rafters": [
                    { "position": 750, "ledSpot": null, "ledStrip": "#FFD1A3" },
                    { "position": 1500, "ledSpot": null, "ledStrip": null },
                    { "position": 2250, "ledSpot": null, "ledStrip": "#FFD1A3" },
                    { "position": 3000, "ledSpot": null, "ledStrip": null },
                    { "position": 3750, "ledSpot": null, "ledStrip": "#FFD1A3" },
                ],
            },
        },
    ],

    "_3d_SideOpenings": [
        //front - carries the front-left corner, ends on the right wall's wall-adjacent pole
        {
            "sideSpecs": { "xPos": 2250, "yPos": 3000, "rotation": 270, "length": 4500, "height": 2600, "poleAmount": 2, "sections": ["Section_1"] },
            "poles": [
                { "type": "corner", "position": 75, "width": 150, "depth": 150, "length": 2600, "support": "bracket", "index": 0 },
                { "type": "intermediate", "position": 2250, "width": 100, "depth": 150, "length": 2600, "support": "bracket", "index": 1 },
            ],
            "bays": [
                {
                    "generalSpecs": { "position": 1175, "length": 2050, "height": 2600 },
                    "climaglide": null,
                    "verticalSunblind": null,
                    "fixedWall": {
                        "mounting": "builtIn",
                        "partitions": [
                            { "position": 500, "width": 700, "height": 2600, "fillType": "sandwichPanelAnthracite" },
                            { "position": 1175, "width": 650, "height": 2600, "fillType": "woodBothSides" },
                            { "position": 1850, "width": 700, "height": 2600, "fillType": "none" },
                        ],
                    },
                    "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" },
                },
                {
                    "generalSpecs": { "position": 3325, "length": 2050, "height": 2600 },
                    "climaglide": null,
                    "verticalSunblind": {
                        "mounting": "surface", "type": "axiom130", "screenColor": ["#E5E1D8", "#C9C3B6", "#E5E1D8"], "solar": false,
                        "window": { "type": "fullWidth", "position": 3325, "width": 2050, "height": 700, "groundHeight": 1100 },
                    },
                    "fixedWall": null,
                    "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" },
                },
            ],
        },

        //rear - the house wall, carries the rear-left wall-adjacent pole
        {
            "sideSpecs": { "xPos": -2250, "yPos": 0, "rotation": 90, "length": 4500, "height": 2600, "poleAmount": 1, "sections": ["Section_1"] },
            "poles": [
                { "type": "wallAdjacent", "position": 4425, "width": 150, "depth": 150, "length": 2600, "support": "bracket", "index": 0 },
            ],
            "bays": [],
        },

        //left - runs between the rear's wall-adjacent pole and the front's corner pole
        {
            "sideSpecs": { "xPos": 2250, "yPos": 0, "rotation": 0, "length": 3000, "height": 2600, "poleAmount": 0, "sections": ["Section_1"] },
            "poles": [],
            "bays": [
                {
                    "generalSpecs": { "position": 1500, "length": 2700, "height": 2600 },
                    "climaglide": { "mounting": "surface", "panelAmount": 6, "openingDirection": "middle", "handle": false, "sideProfile": true, "foundationProfile": true, "draftProfile": "pvc", "glass": "glassClear" },
                    "verticalSunblind": {
                        "mounting": "builtIn", "type": "axiom100", "screenColor": ["#4D504D", "#4D504D", "#4D504D"], "solar": true,
                        "window": { "type": "partialWidth", "position": 1500, "width": 1200, "height": 900, "groundHeight": 700 },
                    },
                    "fixedWall": null,
                    "ledStrip": { "mounting": "builtIn", "color": "#FFD1A3" },
                },
            ],
        },

        //right - the house wall, carries the front-right wall-adjacent pole
        {
            "sideSpecs": { "xPos": -2250, "yPos": 3000, "rotation": 180, "length": 3000, "height": 2600, "poleAmount": 1, "sections": ["Section_1"] },
            "poles": [
                { "type": "wallAdjacent", "position": 75, "width": 150, "depth": 150, "length": 2600, "support": "bracket", "index": 0 },
            ],
            "bays": [],
        },
    ],
};
