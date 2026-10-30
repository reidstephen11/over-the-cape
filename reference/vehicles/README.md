# Vehicle reference photographs

These folders are the pictures and the published dimensions to build a vehicle body against. The game still draws every vehicle in code (`src/render/*Body.ts` and the files it shares). Nothing under `reference/` is loaded when the game runs, and these photographs are not textures.

Each modelled vehicle has a folder. `SOURCES.md` in that folder names the real vehicle, lists every file with its angle, Wikimedia Commons page, author and licence, and puts the published dimensions next to the measurements of the current model. Read that file before opening the pictures. Several pictures are a related body (a two-wheel-drive Hilux, a County wagon on a Perentie chassis, a 75 Series ambulance, a 2024 wagon beside the 79 ute). `SOURCES.md` says what to copy and what to leave.

## Which folder is which

| Game id    | In the game                | Real vehicle                                                                                                     | Folder                                                      |
| ---------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `shortie`  | Short-wheelbase 4WD        | Toyota Land Cruiser 40 Series hardtop, FJ40, 1970s, 4.2 L 2F                                                     | `landcruiser-fj40/`                                         |
| `camel`    | Camel Trophy Land Rover 90 | 1986 Camel Trophy Land Rover Ninety County, LHD, 2.5 L diesel (since v0.80)                                      | `camel-trophy/` (no photos; see `land-rover-110-perentie/`) |
| `hilux`    | Hilux single cab           | Toyota Hilux 4WD, 1979–83, long bed, single cab, styleside tub, 2.0 L 18R                                        | `hilux-1979-83/`                                            |
| `perentie` | Land Rover 110 Perentie    | Australian Army Land Rover 110, 4x4 General Service soft top (Project Perentie, JRA Moorebank)                   | `land-rover-110-perentie/`                                  |
| `unimog`   | Unimog UL1700L             | Australian Army Mercedes-Benz Unimog U 1700 L/38, type 435.113, 3,850 mm wheelbase                               | `unimog-ul1700l/`                                           |
| `troopy`   | Troop Carrier              | Toyota Land Cruiser 75 Series Troop Carrier, HZJ75, 1990–99, 4.2 L 1HZ                                           | `landcruiser-hzj75-troopy/`                                 |
| `patrol`   | GQ Patrol                  | Nissan Patrol Y60 (GQ) long-wheelbase wagon, 1987–97, 4.2 L TD42                                                 | `nissan-gq-patrol/`                                         |
| `lc79`     | LC79 V8                    | Toyota Land Cruiser 79 single cab with the 2024 front clip, then the game's lift, 37 inch tyres, tray and canopy | `landcruiser-79-2024/`                                      |
| `sooty80`  | 80 Series — Sooty MkII     | Toyota Land Cruiser 80 Series wide-body wagon, 1990–97, split tailgate, built up like Shaun Whale's Sooty MkII   | `landcruiser-80-sooty/`                                     |
| `hj60`     | 60 Series wagon            | Toyota Land Cruiser HJ60 standard-roof wagon, Australian 1985–86 Standard, 4.0 L 2H diesel, barn doors           | `landcruiser-60/`                                           |

The trailers (`src/data/trailers.ts`, drawn in `src/render/trailerView.ts`) have folders too. The studio shows one with `?trailer=no5` (or `box6x4`), on its own or hitched behind `vehicle`; `npx vite-node scripts/studio-shots.ts /tmp/shots trailer:no5` photographs it.

| Game id  | In the game        | Real trailer                                                        | Folder                                                    |
| -------- | ------------------ | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `box6x4` | 6×4 box trailer    | A galvanised 6 × 4 ft single-axle box trailer with a ball coupling  | `box-trailer-6x4/`                                        |
| `no5`    | Army No. 5 trailer | Australian Army Trailer, Cargo, ½ tonne, No. 5, with a lunette ring | `army-no5-trailer/` (figures only: no photograph to keep) |

Not modelled yet, so there is no folder. Collect photographs the same way before building one:

- A Suzuki Sierra, and a 1950s vehicle, were offered for later episodes and not chosen. Do not start either until the owner picks it.

Since v1.09 the `sooty80` body is rebuilt from the photographs in `landcruiser-80-sooty/`. Its `SOURCES.md` also gives the studio camera that matches `side-left.jpg`, so the model's outline can be laid over the photo again after any change.

The `hj60` (v1.10) was built from `landcruiser-60/` in the same way. Its `SOURCES.md` gives the camera that matches `side-left-j60-mod-roof-tent.jpg`.

## Before changing a body

1. Read that vehicle's `SOURCES.md`, including the gaps and the "check these first" lines. The current model already disagrees with the photographs in specific places. Those lines are the list.
2. Open the photographs. At least the front, a side, the rear and both three-quarter views, where the folder has them. Look at the silhouette, the lamps, the grille and the wheel openings before any badge or bolt.
3. Open the body file. The frame is the game's: 1 unit is 1 metre, +x is to the right, +y is up, −z is forward. The origin is at mid-wheelbase and 0.12 m above the parked hubs, so the ground is one wheel radius below the hubs. `SOURCES.md` already converts the model's constants into metres on that frame.
4. Measure the model the same way the table does: wheelbase from the axle spacing, width from the half-width constant, length from the nose skin to the tail, height from the roof down to the ground. A bull bar, a rack or a snorkel sits outside those skin figures. Say so when you quote a length.

## While changing it

Get the proportions and the features that identify the vehicle right before adding smaller parts. SPEC.md §5a asks for accurate shapes, not a photo-real model: flat panels, the game's shared materials and no textures. Maker's names and badges on grilles are allowed since v0.34 (the owner's choice); like the number plates and the Camel Trophy lettering, they are drawn in code, never copied from artwork.

A complete 40 Series (body, four wheels, spare, cabin, equipment and running gear) is about 62,000 triangles (docs/DECISIONS.md, the detailed 40 Series note). Keep a rebuilt body near that. Add a panel when it changes the silhouette or makes the vehicle recognisable. Leave a bolt off when it does neither.

Parts added for the game stay: bull bars, winches, snorkels, roof racks, the second spare, the LC79's lift and canopy. Match the factory body underneath them. `SOURCES.md` says which of those a stock photograph will not show.

## After changing it, compare again

The check is the studio page, which draws one vehicle on flat ground with no map. With `npm run dev` running, open:

`http://localhost:5173/scripts/studio/?vehicle=hilux`

(use the game id). Drag is not wired on that page. The camera is `window.studio.view(x, y, z, lookX, lookY, lookZ, fov)` in the vehicle frame. To photograph the set of views the project already uses:

```bash
npx vite-node scripts/studio-shots.ts /tmp/shots hilux
```

That needs the dev server. It writes `front.png`, `side.png`, `rear.png`, `front-left.png`, `rear-right.png`, `top.png`, a wheel close-up and the cockpit view. `scripts/vehicle-shots.ts` does the same kind of pass inside a loaded game, which is the wrong tool for judging a body.

Put each render beside the photograph of that angle. The studio camera is perspective, at 45°. For a proportion check, move it well back and narrow the field of view so the view is nearly orthographic, then compare with the side, front or rear photograph (and, for the Perentie, with `drawing-variants.png`):

```js
studio.view(0, 1.0, -40, 0, 0.9, 0, 8); // front
studio.view(-40, 1.0, 0, 0, 0.9, 0, 8); // left side
studio.view(0, 40, 0.01, 0, 0, 0, 8); // top
```

Do this before the change and after it. A change that looks fine in a three-quarter hero shot can still be 200 mm too narrow, which a side-by-side with the photograph shows immediately.

## Record what you compared

In the version's section of `docs/DECISIONS.md`, name the photographs you compared, which dimension moved, and what still disagrees. When a measurement in the model changes, update the "in the current model" column of that vehicle's `SOURCES.md` so the next pass is not comparing against a stale number.

## Adding photographs

Only commit a picture whose licence allows it to be redistributed in a public repository: CC BY, CC BY-SA, CC0, or public domain. Wikimedia Commons is the place to start. Record the Commons page, the author and the licence in `SOURCES.md`. CC BY and CC BY-SA require that credit, so the table stays with the file.

Download the file Commons serves as the original (`imageinfo` `url`), not a thumbnail. Check the file's pixel size. A small scan is acceptable when it is the original and `SOURCES.md` says so. A thumbnail of a larger file is not.

Confirm the caption is the generation, body and year range in the table above. Leave out a later facelift, a different wheelbase and a different body style, or put the file in only when `SOURCES.md` says exactly which part of it is usable.

If the only picture of an angle forbids redistribution, do not commit it. Add the page URL under Gaps.

Do not crop these files into the game as textures, and do not edit them. A changed copy of a CC BY-SA photograph would itself have to stay under that licence.
