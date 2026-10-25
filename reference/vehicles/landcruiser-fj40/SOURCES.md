# Toyota Land Cruiser 40 Series, short wheelbase (FJ40)

Game ids: `shortie`, and the body of `camel` (the Camel Trophy car is this body in another dress; see `../camel-trophy/SOURCES.md`).

**What to match.** A 1970s FJ40 hardtop. The J40 was built from 1960 to 1984. The short wheelbase is 2,285 mm. The game's engine is the 4.2 L petrol six, Toyota's 2F, which belongs to the later part of that run. Photos here run from 1970 to 1982 and are the same hardtop: round headlamps in square bezels, a slatted grille, a flat bonnet, a near-upright windscreen, and a hardtop with curved rear corner windows. They are mostly left-hand-drive cars. The shape is the same; the game is right-hand drive.

## Dimensions

|                  | Published  | In the current model                                            |
| ---------------- | ---------- | --------------------------------------------------------------- |
| Wheelbase        | 2,285 mm   | 2.30 m (`AXLE` in `src/render/vehicleBody.ts`)                  |
| Length           | 3,840.5 mm | about 4.10 m, bumper to bumper                                  |
| Width            | 1,666.2 mm | 1.665 m (`HW`)                                                  |
| Height, hardtop  | 2,000 mm   | about 2.14 m (roof at y = 1.64, ground 0.50 m below the origin) |
| Height, soft top | 1,950.7 mm | the game is the hardtop                                         |

Sources: wheelbase also in the English Wikipedia infobox for the [J40](<https://en.wikipedia.org/wiki/Toyota_Land_Cruiser_(J40)>). Length, width and height are the 40 Series infobox on the Japanese Wikipedia, [トヨタ・ランドクルーザー](https://ja.wikipedia.org/wiki/%E3%83%88%E3%83%A8%E3%82%BF%E3%83%BB%E3%83%A9%E3%83%B3%E3%83%89%E3%82%AF%E3%83%AB%E3%83%BC%E3%82%B6%E3%83%BC), which cites Toyota's 1984 Vehicle Identification Manual (catalog 97913-84) for the model family. The model measures are read off `src/render/vehicleBody.ts` and `src/data/vehicle.ts` (origin 0.12 m above the parked hubs, so the ground sits one wheel radius, 0.38 m, below that).

**Check these first.** The width matches. The wheelbase is 15 mm over 2,285 mm, too small to chase before the length and the height. The bumper-to-bumper length is about 260 mm longer than 3,840.5 mm, and the hardtop is about 140 mm taller than 2,000 mm. The lamps and the grille are the right kind for this generation.

## Gaps

No top view under a free licence. No separate wheel, tyre or grille close-up beyond what the three-quarter views show. No factory blueprint with dimensions; the figures above are the published overall sizes.

## Photographs

Keep this list with the files. CC BY and CC BY-SA require credit to the author, which is this table.

| File                     | Angle                     | What it shows                                                                                                                       | Source page                                                                                                     | Author                            | Licence                                                        | Pixels    |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | --------- |
| `front.jpg`              | front                     | Straight front of a 1970 FJ40. Early in the 1970s run; round lamps in square bezels and a slatted grille, the face the game copies. | [Commons](<https://commons.wikimedia.org/wiki/File:1970_toyota_land_cruiser_fj40_(observe).jpg>)                | Rjluna2                           | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 3072×2304 |
| `rear.jpg`               | rear                      | Straight rear of the same 1970 FJ40.                                                                                                | [Commons](<https://commons.wikimedia.org/wiki/File:1970_toyota_land_cruiser_fj40_(reverse).jpg>)                | Rjluna2                           | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 3072×2304 |
| `side.jpg`               | side                      | Side profile of a 1978 FJ40 with the 4.2 L six, the engine the game uses.                                                           | [Commons](https://commons.wikimedia.org/wiki/File:1978_Toyota_Land_Cruiser_FJ40_4.2.jpg)                        | Vauxford                          | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 4490×3416 |
| `side-1977.jpg`          | side                      | A 1977 FJ40 profile, for the hardtop silhouette and the wheel openings.                                                             | [Commons](<https://commons.wikimedia.org/wiki/File:1977_Toyota_FJ40_(36350153406).jpg>)                         | Greg Gjerdingen from Willmar, USA | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 6000×4000 |
| `front-34.jpg`           | front three-quarter       | 1976 FJ40, front three-quarter.                                                                                                     | [Commons](https://commons.wikimedia.org/wiki/File:1976_Toyota_Land_Cruiser_FJ40.jpg)                            | Ed Wessel Lied                    | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0)       | 3482×2785 |
| `front-34-left-1979.jpg` | front three-quarter, left | 1979 FJ40 hardtop, front three-quarter from the left.                                                                               | [Commons](https://commons.wikimedia.org/wiki/File:1979_Toyota_Land_Cruiser_FJ40_Las_Vegas_Fall_2024.jpg)        | TaurusEmerald                     | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 3452×2913 |
| `front-34-hardtop.jpg`   | front three-quarter       | 1980 FJ40 hardtop. Same body, just after the 1970s.                                                                                 | [Commons](<https://commons.wikimedia.org/wiki/File:1980_Toyota_Land_Cruiser_(FJ40)_hardtop_(25439621823).jpg>)  | Jeremy from Sydney, Australia     | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 4752×3168 |
| `rear-34-hardtop.jpg`    | rear three-quarter        | 1980 FJ40 hardtop, rear three-quarter, with the curved rear corner windows.                                                         | [Commons](<https://commons.wikimedia.org/wiki/File:1980_Toyota_Land_Cruiser_(FJ40)_hardtop_(25975777271).jpg>)  | Jeremy from Sydney, Australia     | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 4752×3168 |
| `rear-34-left.jpg`       | rear three-quarter, left  | 1982 FJ40 hardtop, rear three-quarter from the left. Gulf-spec car; same hardtop shape.                                             | [Commons](https://commons.wikimedia.org/wiki/File:1982_Toyota_Land_Cruiser_FJ40_in_Freeborn_Red,_rear_left.jpg) | Mr.choppers                       | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 5269×3571 |
| `interior.jpg`           | interior                  | An FJ40 cabin. Use for the general layout. Confirm the dash is a 40 Series before copying small details.                            | [Commons](<https://commons.wikimedia.org/wiki/File:Toyota_Land_Cruiser_interior_(5109324444).jpg>)              | dave_7 from Lethbridge, Canada    | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 3664×2748 |
