# 1986 Camel Trophy Land Rover Ninety

Game id: `camel`. Body: `src/render/camelBody.ts`. Tuning: `src/data/camel.ts`.

Since v0.80 this is the vehicle the 1986 event actually ran: a left-hand-drive Land Rover Ninety County station wagon with the 2.5 L naturally aspirated diesel, in Sandglow yellow. Before v0.80 the game drew the 40 Series in Camel Trophy dress; the owner chose the real vehicle (October 2026). The body came from Codex's model study (`docs/vehicle-review/camel-v1` on branch `codex/vehicle-model-review`).

## Dimensions (1 unit = 1 m)

- Wheelbase 2.36 m (92.9 in), track 1.486 m, width across the arch flares about 1.78 m.
- Tyres 7.50R16 cross-country, about 0.81 m across, on five-stud steel rims.
- Rear fuel tank 54.5 L (12 imperial gallons).
- Gearbox LT77 five-speed with the LT230 transfer box; 3.54 axles.

Measured in v2.18 on sheet B of `../land-rover-110-perentie/drawing-variants.png` (a Land Rover 90 hardtop from the side and the rear), at 310 pixels a metre from its 2.36 m wheelbase. Heights are above the origin, which is 0.12 m above the parked hubs; the ground is 0.525 m below it.

|                                              | On the drawing                                            | In the current model                                                     |
| -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Wing front ahead of the front axle           | 0.50 m                                                    | 0.505 m (it was 0.625 m)                                                 |
| Tail behind the rear axle                    | 0.64 m to the body's rear face, 0.67 m to the rear door's | 0.64 m to the corner panels (it was 0.58 m)                              |
| Body skin, wing front to tail                | 3.50 m                                                    | 3.505 m (it was 3.565 m); the bull bar and the door spare are outside it |
| Windscreen foot behind the front axle        | 0.67 m                                                    | 0.65 m                                                                   |
| Back of the front door behind the front axle | 1.59 m                                                    | 1.61 m                                                                   |
| Width below the waist                        | about 1.68 m                                              | 1.67 m (`SIDE` 0.835)                                                    |
| Width of the cab above the waist             | about 1.53 m                                              | 1.53 m (`UP` 0.765; it was 1.67 m)                                       |
| Sill                                         | 0.13 m                                                    | 0.12 m (it was 0.07 m)                                                   |
| Waist                                        | 0.78 m                                                    | 0.78 m                                                                   |
| Top of the doors and windscreen              | 1.36 m                                                    | 1.36 m (it was 1.42 m)                                                   |
| Roof                                         | 1.54 m                                                    | 1.53 m                                                                   |
| Windscreen's lean                            | 18 degrees                                                | 18 degrees (it was 7)                                                    |
| Top of the wheel openings                    | about 0.45 m                                              | 0.46 m, flat-topped (they were half circles to 0.46 m)                   |

In `src/render/camelBody.ts` the body is drawn in its own frame and moved 0.12 m back (`BODY_SHIFT`), so a z in that file is 0.12 m ahead of the vehicle frame.

## Sources

- Camel Trophy Club, Australia 1986: https://www.cameltrophyvehicles.com/history/australia-1986
- David Hatherill / Camel Trophy Owners Club, Ninety 2.5 N/A equipment account (mirror): https://www.cameltrophyportugal.com/mirrors/www.cameltrophy.es/cameltrophy_LandRover90_110.html
- Rimmer Bros, early 90/110 dimensions and applications: https://rimmerbros.com/images/PDFs/Defender.pdf
- Land Rover technical specifications (later classic 90, cross-checks the wheelbase): https://topix.landrover.jlrext.com/topix/service/archive/65727/technical%20specifications.pdf

The equipment account gives the LHD County wagons, the front cage and B hoop, the gutter-mounted basket rack with upright jerry cans and side sand ladders, four roof work lamps and two A-post swivel lamps, the raised left-side intake, the bonnet and rear-door spares, the winch, and the blue-and-yellow event plaques. The plaques, `CT-86` plates and the camel are drawn in code; no logo artwork is copied.

## Why there are no photographs in this folder

Wikimedia Commons did not have a freely reusable set of the 1986 Ninetys. The free Camel Trophy photographs that exist are later events and other vehicles (a Range Rover in Kraków, CC0; the 1990 Tanzania Discoverys, CC BY-SA 3.0), so none were committed. For the body shape of a Ninety, compare with the Perentie's 110 photographs in `../land-rover-110-perentie/` (same front, doors and windscreen) and the dimensions above.

## What to compare

Studio shot: `scripts/studio/?vehicle=camel`. The snorkel head is the intake, about 2 m off the ground (`src/data/camel.ts`).

## v1.62 inspection

v1.62 visual review: the rear corner skins behind the lamp stacks now continue from the sill to the waist (y 0.07–0.78), closing the previously missing band above the lower panels. Body dimensions and both spare mounts are unchanged. The lack of a period Ninety photo set above still applies.

## v2.18 comparison

Compared with sheet B of the drawing and with `side-right-county-1990.jpg`, `front-34-county.jpg` and `soft-top-british-110.jpg` in the Perentie's folder. The body moved 0.12 m back on its wheels, the cab above the waist is 1.53 m wide, the wheel openings are flat-topped, the windscreen leans 18 degrees and the roof is 0.17 m deep with chamfered sides. The equipment follows the account above: the raised intake enters the front of the left wing and climbs the left windscreen pillar; the Warn 8274 stands upright on the bumper inside the bull bar, behind its hawse fairlead. Still unchecked for want of a photograph of a 1986 car: the cage's shape, the rack's height and length, where the plaques sit, and the wing-top tool. The account's Ninety section does not mention sand ladders; the game's recovery boards are drawn as them.
