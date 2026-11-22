# Toyota Land Cruiser 40 Series ute (HJ47 cab-chassis) — farm-truck draft

Game id: `ute40`. Body: `src/render/ute40Body.ts` (the cab back, roof, tray, bull bar and gear) over the 40 Series cab drawn by `src/render/vehicleBody.ts`; colours in `ute40Paint.ts`. Tuning: `src/data/ute40.ts`.

**What this is.** The owner asked for "a copy of the current shorty with a tray like this, and a longer wheelbase": the game's short-wheelbase 40 (`shortie`) turned into a long-wheelbase single-cab ute with a steel farm tray, built up like Shaun Whale's barn-find HJ47 farm truck that 4WD 24/7 took to Cape York. The real 45/47-series cab is the FJ40's front half (the same guards, bonnet, grille, screen and doors) with a back panel just behind the doors, on a longer chassis; the game's ute is built the same way. **No photograph is committed for it**: the cab is the 40's, already matched to the photographs in `../landcruiser-fj40/`, and the farm-truck look comes from two pictures the owner sent of the real truck (a front three-quarter on a red dirt road and a side view from a 4WD 24/7 thumbnail), which are not under a licence that lets them be redistributed here, as with the Sooty MkII (`../landcruiser-80-sooty/SOURCES.md`). Commons has photographs of stock Australian HJ47 utes (OSX's 1981 and 1982 utes, and a 1983 FJ45/HJ47 series) that a later pass could download to check the cab-back and tray proportions; this container could not download originals from Wikimedia (HTTP 429), so none were committed.

## Dimensions

|                 | Published / seen                                                                                       | In the current model                                                                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wheelbase       | 2,950 mm, the J40's "super long" wheelbase of the FJ45 (II) and HJ47 ([English Wikipedia, J40](<https://en.wikipedia.org/wiki/Toyota_Land_Cruiser_(J40)>)) | 2.95 m (`HALF_BASE` 1.475 in `src/data/ute40.ts`)                                                                                                                                                                      |
| Width           | 1,665 mm (the 40's body, `../landcruiser-fj40/SOURCES.md`)                                              | 1.665 m over the guard lips (the 40's `HW`); the tray is 1.80 m wide (`TRAY_HW` 0.9), wider than the cab as in the owner's pictures                                                                                   |
| Height          | 2,000 mm for the 40 hardtop; the ute's cab roof is the same pressing at the front                       | 2.06 m to the cab roof on the game's lift and tyres (the 40's `ROOF` 1.56 over a ground 0.5 m below the origin); 2.16 m to the headboard's top rail, 2.3 m to the snorkel head and the beacon                          |
| Length          | not published for the HJ47 here; FJ45 long pickups are about 5.2 m over the bumpers                     | 5.2 m, bull-bar face (−2.33) to the tow ball (2.9); the tray runs from 0.40 to 2.80 (2.4 m long), 1.33 m of it behind the rear axle                                                                                    |
| Track           | 1,400 mm (the 40's figure)                                                                              | the 40's: drawn on 1.40 m, physics on 1.45 m (`drawnWheels` as the 40)                                                                                                                                                 |
| Tyres           | the 40's 7.50-16                                                                                        | the 40's 0.76 m wheels, 0.21 m wide as drawn, on the 40's split rims painted a rusty tan as in the pictures                                                                                                           |
| Mass            | not published for this build                                                                            | 1,900 kg with the tray, bar, winch, two spares and the load under the tarp (the 40 is 1,600 kg)                                                                                                                        |
| Engine, gearbox | the owner asked for a copy of the 40                                                                    | the 40's 4.2 L petrol six, three-speed automatic, transfer, tank and fuel map, unchanged (`...vehicleTuning`); a real HJ47 had the 2H diesel and a four-speed                                                           |

**Measured in the model.** The cab is the 40's cab moved 0.325 m forward with the front axle (`UTE_CAB_SHIFT`), so its heights and its front overhang are the 40's. The cab back (`CAB_BACK`) is 0.12 m behind the door shut, with 80 mm rounded corners and a 1.0 × 0.35 m rear window. The tray deck is 0.90 m off the ground (`DECK` 0.40), with 0.26 m drop sides and tailgate, a tube headboard to 2.16 m, a gap of 0.1 m between the cab back and the headboard. The bull bar's pan face is 0.325 m ahead of the grille as on the 40 (`winchMount`).

**What is estimated.** The cab-back position and the rear window, the tray's size and deck height, the headboard, the jack and the beacon positions, the snorkel's run, the bull bar's hoops and the spotlight spacing are all read off the owner's two pictures by eye, not measured. The rust on the bonnet is a flat colour with four darker and lighter patches; the game has no textures. The number plate is made up.

## Gaps

No committed photograph of any 45/47 ute. No published length, height or kerb mass for the HJ47 cab-chassis was found that could be cited; the published figures above are the J40 wheelbase and the 40's own body figures. The owner's pictures show the right side and the front; the back of the tray, the tailgate and the under-tray spare are guesses from how such trays are built.

## v1.62 inspection

v1.62 visual review: both recovery boards moved 0.10 m forward, centred lengthways on the left of the deck (z 0.50–2.70), so their ends clear the headboard and tailgate. Tray and cab dimensions and both spare mounts are unchanged. The tray remains an estimate from the owner's pictures, not a new factory match.

## v1.65 articulation clearance

Tray crossmembers within the rear tyres’ fore/aft envelope now stop at a 1.0 m width between the chassis runners; the surrounding deck and perimeter rails retain their dimensions. The members stay at the same height and stations, facing across the car. This removes their intersection with a raised tyre without shortening suspension travel. Cab, tray outline and both spare mounts are unchanged. This is a fit correction to the estimated farm tray, not a newly verified factory detail.

## v2.12 comparison

The 28 audit pictures were compared with the FJ40 photographs (`../landcruiser-fj40/side.jpg`, `front-34-hardtop.jpg`, `rear-34-left.jpg`, `side-1977.jpg`), since the cab is the 40's. The list is in `docs/AUDIT-2026-11.md`.

- **Snorkel.** Its box sits on the left cowl side over the louvres, 0.85 m out (z −0.49 to −0.36, y 0.59 to 0.83, in the 40's frame); the tube climbs beside the windscreen frame, leaning back with it, to a ram head facing forward at the roof's front corner (y 1.585), held by two clamps strapped to the frame. Until v2.12 it left the guard over the tyre.
- **Door glass.** From 0.93 m (`DOOR_WIN_LOW`, the 40's `WIN_LOW` less 6 cm) to 1.38 m above the origin: 0.19 m above the belt crease. The rear window keeps the 40's height.
- **Winch.** Inside the pan, with its control box on the pan's top; the plate is on the pan's face at x −0.41.
- **Underneath.** The exhaust runs inside the right rail at x 0.3, climbs to y 0.12 over the rear axle and ends under the rear bar; the fuel tank (z 0.38 to 0.92) and the muffler sit between the crossmembers at 0.3 and 1.0.

**Photographs to add.** Commons has six photographs of stock Australian utes that this container could not download (every request for a file, a scaled copy or the API answered HTTP 429): `1982 Toyota Landcruiser HJ47 utility (5636692973).jpg`, `1981 Toyota Land Cruiser (HJ47) utility (2015-06-03).jpg` and four `1983 Toyota Land Cruiser (FJ45 or HJ47) utility (…).jpg` (18881517462, 18886773465, 18698983468, 18266116703). They would check the cab back, the rear window and the tray's proportions.
