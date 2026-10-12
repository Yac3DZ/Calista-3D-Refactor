//Skylux Calista (h roof) - input data SCHEMA / prototype (full configurator payload the 3D receives)
//every field possible is populated once as an example, but this set does not necessarily give a valid configuration
//all dimensions are in MM, all colors come as a 6-digit HEX (# + 6 digits)
//keys AND string values are camelCase.

//=== WHAT THE 3D DOES AND DOES NOT DO ===================================================================
//the configurator carries the calculations - placement, scaling, spacing, positions. the 3D receives the
//specs, executes, and computes only what is strictly a visualization concern.
//  - the 3D derives NO spacing. pole positions, bay spans and every dimension arrive in the payload.
//  - the 3D reads NO depth for the options within the side openings' part: meaning that options like the
//    Climaglide read an atlas as to what its Y position inside the section is (closer to the outside or
//    the inside); it is up to the configurator though to state what the X position is (position within
//    the poles)
//  - there must be a convention as to what options' Y positions are, and the mounting allowed for each
//  - illegal option combinations are the configurator's to exclude. the 3D draws what it is told, it does
//    not decide legality
//
//Calista as defined today is a single-module structure, but the structure sections come as arrays of
//objects because this is consistent with Climafast (refactor proposal which is frozen at this time) and prepares for a possible change in the future
//where multiple modules would be allowed (the cost is zero now, but would mean schema and logic changes
//in the future if multi-module becomes possible)

//=== DATUMS =============================================================================================
//  scene origin                 the bounding box of the sections' back edges sit centered on the X axis and at Y = 0 (so there is no -Y section position); Y+ faces forward (Origin zero point, direction of positive coordinates.png) this is in line with typical 3D conventions
//  section xPos/yPos            handle point of reference is bounding-box CENTER of structure (Section position placement handled by center of bounding box.png)
//  side xPos/yPos               the side's START point
//  side direction               the side's local X = 0 coordinate is at the left side looking at it perpendicularly from the outside, so all sides are populated left->right (Orientation zero point and filling direction.png)
//  side rotation                absolute degrees: front 270, rear 90, left 0, right 180; orientation comes from rotation alone             
//  pole position, bay position  LOCAL X along that side, as are partition and window positions; pole Y is the 3D's - the pole's outer face sits on the side line (Origin point and filling direction for a side.png)
//  rafter / filling             ABSOLUTE from the section edge, left->right viewed from the front (local +X->-X)

//=== OPTION LAYERS ======================================================================================
//each option in a bay sits on one layer. the configurator names that layer in the option's mounting
//field, and the 3D looks up the matching Y position in its atlas.
//  builtIn (integrated)         can hold verticalSunblind, fixedWall
//  surface (non-integrated)     can hold climaglide, verticalSunblind, fixedWall
//  crown                        holds ledStrip
//an option that is null, or missing from the bay, is not drawn.
//adding a layer later means one more mounting value plus one atlas entry.

//=== SCHEMA =============================================================================================
//
// scope
// │
// ├─ _3d_screenshotName          string   - screenshot PNG filename
// ├─ _3d_conservatoryStructure   string   - freeStanding | wallAdjacent
// ├─ _3d_widthTotal              int mm   - overall width
// ├─ _3d_depthTotal              int mm   - overall depth
// ├─ _3d_walls                   object   - house wall present, per side: { front, right, rear, left } bool
// ├─ _3d_colorOutside            hex      - outside frame color
// │
// ├─ _3d_StructureSections[]   one entry today, N supported by construction
// │    └─ section
// │         ├─ width, depth           int mm   - rectangular footprint
// │         ├─ xPos, yPos             int mm   - bounding-box CENTER
// │         ├─ heightUnderGutter      int mm   - crown underside
// │         ├─ sectionName            string   - identity - declared, not consumed today
// │         ├─ adjacentSections       { left, right } string|null - topology - declared, not consumed today
// │         └─ roofOptions
// │              ├─ horizontalScreen            object | null - one per roof section
// │              │    ├─ type             zipper | nonZipper | bottomZipper
// │              │    ├─ screenColor      [3 hex]
// │              │    └─ motorSide        left | right
// │              │
// │              ├─ roofFillings[]              one per filling, in order
// │              │    ├─ position         int mm - ABSOLUTE - section edge to filling center
// │              │    ├─ width            int mm
// │              │    └─ type             plasticSunBlocking | plasticOpal | plastic | sandwichPanelWhite | sandwichPanelAnthracite | sandwichPanelTile | glassClear | glassOpal
// │              │
// │              └─ rafters[]                   one per rafter, in order
// │                   ├─ position         int mm - ABSOLUTE - section edge to rafter center
// │                   ├─ ledSpot          object | null
// │                   │    ├─ positions   [int mm] - ABSOLUTE per spot - rear edge to spot center
// │                   │    └─ color       hex
// │                   └─ ledStrip         hex | null - strip color
// │
// └─ _3d_SideOpenings[]        one entry per side, carries poles and options
//      └─ sideOpening
//           ├─ sideSpecs
//           │    ├─ xPos, yPos        int mm   - side START point: the outer corner of the start pole, on the corner of the section footprint (Section handle point and running direction.png)
//           │    ├─ rotation          int deg  - absolute - front 270 - rear 90 - left 0 - right 180
//           │    ├─ length            int mm   - side extent
//           │    ├─ height            int mm   - up to the crown underside
//           │    ├─ poleAmount        int      - poles on this side
//           │    └─ sections          [string] - section names spanned - declared, not consumed today
//           │
//           ├─ poles[]                          every pole on this side; corner poles are needed on only one of adjacent sides (e.g. front and rear sides can host 2 side poles each->left and right sides have none, or intermediate poles)
//           │    ├─ type              corner | intermediate | wallAdjacent
//           │    ├─ position          int mm   - local X - pole CENTER
//           │    ├─ width, depth      int mm   - per pole; differs by type
//           │    ├─ length            int mm   - pole height
//           │    ├─ support           bracket | bracketUnder | foundation | null
//           │    └─ index             int      - pole index, from 0
//           │
//           └─ bays[]                           one per bay, per gap between two consecutive poles
//                ├─ generalSpecs
//                │    ├─ position         int mm - local X - bay CENTER
//                │    ├─ length           int mm - clear span between the two poles
//                │    └─ height           int mm - up to the crown underside
//                │
//                ├─ climaglide            object | null
//                │    ├─ mounting         surface
//                │    ├─ panelAmount      int
//                │    ├─ openingDirection left | right | middle
//                │    ├─ handle           bool
//                │    ├─ sideProfile      bool
//                │    ├─ foundationProfile bool
//                │    ├─ draftProfile     alu | pvc | null
//                │    └─ glass            glassClear | glassOpal
//                │
//                ├─ verticalSunblind      object | null
//                │    ├─ mounting         builtIn | surface
//                │    ├─ type             axiom100 | axiom130 | element
//                │    ├─ screenColor      [3 hex]
//                │    ├─ solar            bool
//                │    └─ window           object | null
//                │         ├─ type        partialWidth | fullWidth
//                │         ├─ position    int mm - local X - window CENTER
//                │         ├─ width       int mm
//                │         ├─ height      int mm
//                │         └─ groundHeight int mm - ground to the window's lowest edge
//                │
//                ├─ fixedWall             object | null
//                │    ├─ mounting         builtIn | surface
//                │    └─ partitions[]
//                │         ├─ position    int mm - local X - partition CENTER
//                │         ├─ width       int mm
//                │         ├─ height      int mm
//                │         └─ fillType    none | woodInside | woodOutside | woodBothSides  | sandwichPanelAnthracite | sandwichPanelWhite | glassClear | glassOpal
//                │
//                └─ ledStrip              object | null
//                     ├─ mounting         builtIn - seats into the crown
//                     └─ color            hex
//
//

const _3d_calistaScopePrototype = {
    "_3d_screenshotName": "Your_Skylux_Configuration",   //filename for the screenshot PNG the UI button requests. any string; default "Your_Skylux_Configuration"
    "_3d_conservatoryStructure": "freeStanding", //"freeStanding" | "wallAdjacent". default "wallAdjacent"
    "_3d_widthTotal": 6000,                          //overall width across all sections. required
    "_3d_depthTotal": 4000,                          //overall depth across all sections. required
    "_3d_walls": { "front": false, "right": false, "rear": false, "left": true },   //house wall present, per side. default all false
    "_3d_colorOutside": "#293133",                     //outside frame color, default "#293133"

    //=== _3d_StructureSections: the roof + crown. For now one entry for Calista. ===
    "_3d_StructureSections": [
        {
            "width": 6000,          //section footprint width. required
            "depth": 4000,          //section footprint depth. required
            "xPos": 0,             //X of the bounding-box CENTER. default 0
            "yPos": 2000,          //Y of the bounding-box CENTER. default 0
            "heightUnderGutter": 2500, //ground to the crown underside. required
            "sectionName": "Section_1",          //internal identity. any string, may be empty. declared, not consumed by the 3D today
            "adjacentSections": { "left": null, "right": null },    //neighbor names, null where there is none. both null for a single Calista. declared, not consumed today

            "roofOptions": {//one horizontal screen per roof section. its width IS the section width, so there is no widths array.
                "horizontalScreen": {
                    "type": "nonZipper",    //"zipper" | "nonZipper" | "bottomZipper". default "nonZipper"
                    "screenColor": ["#FFFFFF", "#CCCCCC", "#333333"], //fabrics may come as a combination of up to 3 colors. default any hex combo
                    "motorSide": "left",         //"left" | "right". default "left"
                },

                "roofFillings": [//one entry per roof filling, in order across the width. the array length IS the filling count.
                    {
                        "position": 250,     //ABSOLUTE - section edge to this filling's CENTER. required
                        "width": 500,     //filling width. required
                        "type": "glassClear", //"plasticSunBlocking" | "plasticOpal" | "plastic" | "sandwichPanelWhite" | "sandwichPanelAnthracite" | "sandwichPanelTile" | "glassClear" | "glassOpal"
                    },
                    { "position": 750, "width": 500, "type": "sandwichPanelAnthracite" },
                    { "position": 1500, "width": 1000, "type": "sandwichPanelWhite" },
                ],
                "rafters": [//one entry per rafter, in order across the width. the array length IS the rafter count.
                    {
                        "position": 500,                //ABSOLUTE - section edge to this rafter's CENTER. required
                        "ledSpot": {                   //null when this rafter carries no spots. default null
                            "positions": [1000, 2000, 3000], //ABSOLUTE per spot - rear edge to each spot's CENTER. required
                            "color": "#FFD1A3",          //emission color for this rafter's spots. default "#FFD1A3"
                        },
                        "ledStrip": null,               //emission color of the full-length strip along this rafter; null for no strip. default null
                    },
                    { "position": 1000, "ledSpot": null, "ledStrip": "#FFD1A3" },
                ],
            },
        },
    ],

    //=== _3d_SideOpenings: one entry per side, carries poles and bays. ===
    "_3d_SideOpenings": [
        {
            "sideSpecs": {
                "xPos": 3000,   //X of the side's START point: the start pole's outer corner, on the section footprint's corner. default 0
                "yPos": 4000,   //Y of the side's START point: the start pole's outer corner, on the section footprint's corner. default 0
                "rotation": 270,    //absolute degrees: front 270, rear 90, left 0, right 180. default 0
                "length": 6000,   //side extent. required
                "height": 2500,   //ground to the crown underside. required
                "poleAmount": 3,   //poles on this side (including edge poles for the sides that carry them)
                "sections": ["Section_1"],   //section names this side spans. declared, not consumed today. default []
            },
            //every pole on this side, in order along local X.
            //each corner pole sits on one side - e.g. front and rear carry all four corners, and left and right run between them.
            //positions and dimensions come from the payload; the 3D sets each pole's Y with its outer face on the side line.
            "poles": [
                {
                    "type": "corner",   //"corner" | "intermediate" | "wallAdjacent". picks the mesh; dimensions differ per type. required
                    "position": 75,         //LOCAL X to the pole's CENTER. required
                    "width": 150,        //required
                    "depth": 150,        //required
                    "length": 2500,       //pole height, ground to crown underside. required
                    "support": "bracket",  //"bracket" | "bracketUnder" | "foundation" | null. footing for THIS pole. default null
                    "index": 0,           //pole index, from 0
                },
                { "type": "intermediate", "position": 3000, "width": 100, "depth": 150, "length": 2500, "support": "foundation", "index": 1 },
                { "type": "corner", "position": 5925, "width": 150, "depth": 150, "length": 2500, "support": "bracket", "index": 2 },
            ],
            "bays": [//one entry per bay - the gap between two consecutive poles
                {
                    "generalSpecs": {
                        "position": 1550,   //LOCAL X to the bay's CENTER. required
                        "length": 2800,   //clear span between the two poles. required
                        "height": 2500,   //up to the crown underside. required
                    },
                    "climaglide": {
                        "mounting": "surface",  //"surface". default "surface"
                        "panelAmount": 5,          //sliding panels in this bay. default 4
                        "openingDirection": "left",     //"left" | "right" | "middle". default "left"
                        "handle": true,       //handle visibility. default false
                        "sideProfile": false,      //side profile visibility. default false
                        "foundationProfile": false,      //foundation profile visibility. default false
                        "draftProfile": "alu",      //"alu" | "pvc" | null - draft profile visibility and material. default null
                        "glass": "glassClear",    //"glassClear" | "glassOpal". default "glassClear"
                    },
                    "verticalSunblind": {
                        "mounting": "builtIn",  //"builtIn" | "surface". default "builtIn"
                        "type": "axiom100", //"axiom100" | "axiom130" | "element". default "axiom100"
                        "screenColor": ["#4D504D", "#4D504D", "#4D504D"], //fabrics may come as a combination of up to 3 colors. default any hex combo
                        "solar": false,      //solar panel visibility. default false
                        "window": {          //null for no window. default null
                            "type": "partialWidth",   //"partialWidth" | "fullWidth". required
                            "position": 1550,         //LOCAL X to the window's CENTER. required
                            "width": 1000,            //required
                            "height": 1000,           //required
                            "groundHeight": 500,      //ground to the window's lowest edge. required
                        },
                    },
                    "fixedWall": {
                        "mounting": "builtIn",   //"builtIn" | "surface". default "builtIn"
                        "partitions": [//one entry per partition across the bay, in order. the array length IS the partition count.
                            {
                                "position": 650,           //LOCAL X to the partition's CENTER. required
                                "width": 1000,             //required
                                "height": 2500,             //required
                                "fillType": "woodBothSides",  //"none" | "woodInside" | "woodOutside" | "woodBothSides" | "sandwichPanelAnthracite" | "sandwichPanelWhite" | "glassClear" | "glassOpal". default "none"
                            },
                            { "position": 1575, "width": 850, "height": 2500, "fillType": "glassOpal" },
                        ],
                    },
                    "ledStrip": {
                        "mounting": "builtIn",  //"builtIn" - seats into the crown. default "builtIn"
                        "color": "#FFD1A3",  //emission color. default "#FFD1A3"
                    },
                },
                //second bay, between the intermediate pole and the end corner pole: nothing mounted
                { "generalSpecs": { "position": 4450, "length": 2800, "height": 2500 }, "climaglide": null, "verticalSunblind": null, "fixedWall": null, "ledStrip": null },
            ],
        },
    ],
};

//=== ROOF SHEET TYPE LEGEND =============================================================================
//  plasticSunBlocking       
//  plasticOpal              
//  plastic                  
//  sandwichPanelWhite       
//  sandwichPanelAnthracite 
//  sandwichPanelTile
//  glassClear
//  glassOpal


//=== 3D-SIDE ATLAS ======================================================================================
//the Y position of every option is a strictly 3D value, so the 3D holds it in its own atlas, keyed by
//(option, mounting). the configurator sends the mounting name, and the atlas turns it into a Y position.
//the atlas values are internal to the 3D. a new option, or a new mounting for an existing one, adds one
//atlas entry.
//
//  calistaAtlas
//  ├─ layerDepth
//  │    ├─ climaglide        { surface }
//  │    ├─ verticalSunblind  { surface, builtIn }
//  │    ├─ fixedWall         { surface, builtIn }
//  │    └─ ledStrip          { builtIn }
//  ├─ crown       { profileHeight }

