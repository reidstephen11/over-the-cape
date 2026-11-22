# Toyota Land Cruiser HZJ75 Troop Carrier, 1990–99

Game id: `troopy`.

**What to match.** The 75 Series Troop Carrier with the 4.2 L 1HZ diesel, built 1990–99: long high steel body, round headlamps in square surrounds, slatted grille, indicators wrapped onto the front corners, a sliding window and a fixed window in each side, barn doors at the back, leaf springs both ends, 7.50R16 tyres. The game paints it white and adds a bull bar, a winch and a full-length roof rack.

This is not the 78 Series that replaced it, and not the 2007 front. Those have a different face. They were left out of this folder on purpose.

The two ambulance pictures are a 1992 NSW ambulance on the troop-carrier shell. Use them for the 75's face and the barn-door rear. The extra side glazing and the ambulance markings are the fit-out, not the civilian wagon.

## Dimensions

Wheelbases, lengths, widths and heights are the J70 infobox on [Toyota Land Cruiser (J70)](<https://en.wikipedia.org/wiki/Toyota_Land_Cruiser_(J70)>). The 2,980 mm wheelbase is the troop carrier's. The infobox gives two overall lengths (4,995 mm and 5,245 mm) and two heights (1,955 mm and 2,070 mm) for the family, and a width of 1,790–1,870 mm citing Toyota Australia's October 2025 70 Series specification table. The troop carrier is the shorter, taller of those bodies. The 4,995 mm is over the bumpers; measured on `side.jpg` (the hubs are 800 px apart for the 2,980 mm wheelbase), the skin runs 0.62 m ahead of the front axle and 1.18 m behind the rear, 4.78 m in all.

|           | Published                                               | In the current model                                                                                                                                                                                                                                          |
| --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wheelbase | 2,980 mm                                                | 2.98 m                                                                                                                                                                                                                                                        |
| Length    | 4,995 mm over the bumpers; 4.78 m of skin on `side.jpg` | 4.69 m of skin (`F` −2.11 to `TAIL` 2.58 in `src/render/troopyBody.ts`): the nose is 0.62 m ahead of the front axle (since v2.08) and the tail 1.09 m behind the rear, 2 cm short of `side.jpg` (below); the bumpers are outside that |
| Width     | 1,790–1,870 mm                                          | 1.79 m (`SIDE` 0.895, v1.22); 1.83 m over the front guards' flares (v2.11; the black lips they replaced were as wide)                                                                                                                                         |
| Height    | 2,070 mm is the taller of the two                       | about 2.06 m (roof y = 1.54, ground 0.52 m below the origin)                                                                                                                                                                                                  |
| Track     | the game uses 1.42 m front and 1.40 m rear              | those figures                                                                                                                                                                                                                                                 |
| Tyres     | the game uses 7.50R16                                   | radius 0.40 m                                                                                                                                                                                                                                                 |

**Check these first.** The round lamps and the square, high body are the right generation. Since v2.08 the nose is where `side.jpg` puts it; the tail is 2 cm short, which was left (moving `TAIL` means moving the tow point, the collision boxes, the rack and the barn doors with it). The wheel openings have the 75's flat top with short rounded corners since v1.22 (`side.jpg`, `front-34-b.jpg`, `detail.jpg`, `rear-34-ambulance.jpg`): a flat run of about 0.4 m, the sides opening out to the sill; since v2.11 they are pressed into the body and painted, 1.5 cm lower. Compare a studio side view with `side.jpg` and a front view with `front-34.jpg`.

## Gaps

No straight-on front or rear of a civilian troop carrier, no second side, no top view, no free blueprint. The ambulance covers a front three-quarter and a rear three-quarter of the same shell.

## Photographs

Keep this list with the files. CC BY and CC BY-SA require credit to the author, which is this table.

| File                     | Angle               | What it shows                                                                                                                            | Source page                                                                                                                    | Author                             | Licence                                                  | Pixels    |
| ------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------- | --------- |
| `front-34.jpg`           | front three-quarter | HZJ75LV Troop Carrier, front three-quarter. Round lamps, slatted grille, indicators on the corners.                                      | [Commons](https://commons.wikimedia.org/wiki/File:TOYOTA_Land_Cruiser_HZJ75-01.jpg)                                            | Berndw                             | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 1600×950  |
| `side.jpg`               | side                | HZJ75 Troop Carrier in profile. High roof, sliding side window, long body.                                                               | [Commons](https://commons.wikimedia.org/wiki/File:TOYOTA_Land_Cruiser_HZJ75-02.jpg)                                            | Berndw at English Wikipedia        | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 1600×750  |
| `front-34-b.jpg`         | front three-quarter | Another view of an HZJ75 Troop Carrier.                                                                                                  | [Commons](https://commons.wikimedia.org/wiki/File:TOYOTA_Land_Cruiser_HZJ75-03.jpg)                                            | Berndw at English Wikipedia        | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 1600×1200 |
| `detail.jpg`             | detail              | Closer view of an HZJ75.                                                                                                                 | [Commons](https://commons.wikimedia.org/wiki/File:TOYOTA_Land_Cruiser_HZJ75-01-01.jpg)                                         | Berndw~enwiki at English Wikipedia | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) | 1600×1200 |
| `front-34-ambulance.jpg` | front three-quarter | 1992 Australian 75 Series Troop Carrier ambulance. The shell is the troop carrier; the extra windows and markings are the ambulance fit. | [Commons](<https://commons.wikimedia.org/wiki/File:1992_Toyota_LandCruiser_75_series_Troopcarrier_ambulance_(5350134409).jpg>) | sv1ambo                            | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | 3160×2078 |
| `rear-34-ambulance.jpg`  | rear, straight on   | Same 1992 ambulance from directly behind with both barn doors open (not the three-quarter its name says).                                                      | [Commons](<https://commons.wikimedia.org/wiki/File:1992_Toyota_LandCruiser_75_series_Troopcarrier_ambulance_(5350128655).jpg>) | sv1ambo                            | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) | 3026×2308 |

## v2.08 comparison

Heights and stations were measured on `side.jpg` (the car's left side; it is left-hand drive) from the line through its two hubs, and set 1 cm higher for the game's springs. (v2.08's notes say 238 px a metre; the hubs, at (329.5, 570) and (1137.5, 583.5), are 808 px apart, 271 px a metre, which is the scale its heights agree with.) In the model's frame (origin 0.12 m above the hubs):

|                              | On `side.jpg`                  | Model before     | Model since v2.08  |
| ---------------------------- | ------------------------------ | ---------------- | ------------------ |
| Nose skin                    | 0.62 m ahead of the axle       | 0.71 m           | 0.62 m (`F` −2.11) |
| Bonnet top at the nose       | 0.60 m                         | 0.745 m          | 0.61 m             |
| Cowl (foot of the screen)    | 0.78 m, 0.70 m behind the axle | 0.84 m, 0.51 m   | 0.79 m, 0.70 m     |
| Windscreen header            | 1.30 m, 1.09 m behind the axle | 1.48 m, 0.69 m   | 1.31 m, 1.09 m     |
| Roof                         | 1.55 m                         | 1.54 m           | 1.54 m             |
| Door                         | 0.64 to 1.75 m behind the axle | 0.54 to 1.57 m   | 0.64 to 1.75 m     |
| Door glass                   | 0.79 to 1.29 m                 | 0.885 to 1.455 m | 0.805 to 1.25 m    |
| Side windows behind the door | 0.96 to 1.42 m                 | 0.885 to 1.455 m | 0.97 to 1.43 m     |
| Tail skin                    | 1.11 m behind the rear axle    | 1.09 m           | 1.09 m (unchanged) |

The tail measures 2 cm short here, not the 9 cm the table above gives; it was left alone. `rear-34-ambulance.jpg` is a straight-on rear view with the doors open; the table now says so.

**Still disagreed after v2.08**, and done in v2.11: the grille, the wheel openings, the rear quarter, the tail lamps, the stripes, mud flaps and steps.

## v2.11 comparison

Measured on `side.jpg` the same way (271 px a metre from the hub line, 1 cm higher for the springs), by laying the photograph over a studio side view taken from 40 m with an 8 degree lens; positions on the right side from `front-34-b.jpg`, scaled from the vent.

|                                     | On the photographs                                             | Model before                          | Model since v2.11                                     |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| Wheel opening's top                 | 0.41 to 0.43 m, painted edge                                   | 0.435 m, black lip to 0.495 m         | 0.42 m (`ARCH.y`), painted                            |
| Front guard's flare                 | top crease 0.53 m, from under the indicator back to the door   | none (a black lip round the opening)  | 0.53 m (`FLARE.top`), 18 mm proud                     |
| Rear opening's edge                 | a narrow raised lip                                            | black lip, 6 cm wide                  | painted lip 3.5 cm wide, 1 cm proud                   |
| Grille                              | one dark panel with both lamps; three horizontal bars          | vertical slats, separate lamp squares | one panel, three bars                                 |
| Tail lamp                           | 0.21 to 0.57 m on each rear corner: red, clear, amber          | small, low on the rear face           | 0.21 to 0.57 m, standing 4 cm out behind the corner   |
| Vent                                | z 2.07 to 2.33, 0.575 to 0.665 m, both sides                   | none                                  | the same                                              |
| Fuel flaps                          | right side only, 0.19 × 0.15 m, behind the door and the wheel  | a round cap behind each rear wheel    | z 0.43 and 2.0, 0.37 to 0.52 m                        |
| Stripe                              | grey and gold bands 0.67 to 0.785 m, LAND CRUISER at z 1.75–2.33 | none                                | the same, from the door's front edge                  |
| Door handle                         | 0.62 m, chrome                                                 | 0.66 m, black                         | 0.625 m, chrome                                       |
| Rear bar's ends                     | wrap forward along the sides to z 2.34                         | square ends                           | the same                                              |

**Still disagrees.** The stripe runs on along the front guard on both photographed cars; the model's guard rounds over at the shoulder where the stripe would lie, so it starts at the door. The front flare stands 18 mm proud of the door at the shut line, where the real one meets the door's plane: the model's upper guard is not set in above the crease. TOYOTA is in letters, as on the 1992 Australian ambulance; the Peruvian car has the oval badge. The tail is 2 cm short. No photograph shows which rear door carries the spare.
