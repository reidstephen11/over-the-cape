# Mercedes-Benz Unimog UL1700L (435 series), Australian Army

Game id: `unimog`.

**What to match.** The Australian Army's Mercedes-Benz Unimog cargo truck, the long-wheelbase UL1700L. On the 435 type list that is the U 1700 L/38, type 435.113, wheelbase 3,850 mm, built 1975–1993. Steel cab, round headlamps low beside a black slotted grille, flat mudguards clear of the wheels, portal axles, 12.5R20 tyres, and a dropside tray under a canvas tilt. The game's tray is empty on purpose.

Do not proportion it from a U 1300 L. That truck shares the cab and has a 3,250 mm wheelbase.

## Dimensions

From the [Unimog 435](https://en.wikipedia.org/wiki/Unimog_435) infobox, the type table, and the technical-specification table. The 3,850 mm figure is type 435.113, and Mercedes-Benz's public archive entry for that type is linked from the Wikipedia reference.

|                  | Published                                                                 | In the current model                                                                 |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Wheelbase        | 3,850 mm for the U 1700 L/38 (the range across the 435 is 3,250–3,850 mm) | 3.85 m                                                                               |
| Length           | 5,500–6,100 mm across the series                                          | about 6.39 m (`NOSE` −2.94 to the tray's back at 3.45 in `src/render/unimogBody.ts`) |
| Width            | 2,300 mm                                                                  | 2.30 m across the tray (`TRAY.side` 1.15); the cab is 2.20 m                         |
| Height           | 2,875 mm                                                                  | tilt top about 2.94 m; cab roof about 2.66 m before the canvas cap the model adds    |
| Ground clearance | 440 mm                                                                    | about 0.6 m under the chassis rails, as DECISIONS v0.11 measured it                  |
| Track            | the game uses about 1.86 m                                                | 1.86 m                                                                               |
| Tyres            | the game uses 12.5R20, and calls them 1.12 m across                       | radius 0.56 m                                                                        |

**Check these first.** The cab in `front-34.jpg` and `side.jpg` is steel. The model puts a canvas roof on the cab (`unimogBody.ts`). The canvas tilt belongs over the tray, and the model has that too. The axles are drawn like the other vehicles' axles, not as portal axles (DECISIONS v0.11), while `side.jpg` shows the portal drop. The model's overall length is past the 6,100 mm end of the published range; check it against `side.jpg`.

## Gaps

No straight-on front, no straight-on rear, no top view, no second side. `detail-steering.jpg` is a dark shot of the wheel. No free dimensioned blueprint beyond the Wikipedia tables.

## Photographs

Keep this list with the files. CC BY and CC BY-SA require credit to the author, which is this table.

| File                           | Angle                    | What it shows                                                                                                                                    | Source page                                                                                                                                                                                       | Author                                                    | Licence                                                        | Pixels    |
| ------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | --------- |
| `front-34.jpg`                 | front three-quarter      | Australian Army Unimog at ADFA, the UL1700L cargo truck. Steel cab, canvas tilt over the tray, round lamps low beside the grille.                | [Commons](https://commons.wikimedia.org/wiki/File:Australian_Army_Unimog_truck_with_digital_camouflage.JPG)                                                                                       | Nick-D                                                    | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 4000×3000 |
| `side.jpg`                     | side                     | Same truck, side profile. Portal axles and the long tray are visible.                                                                            | [Commons](https://commons.wikimedia.org/wiki/File:Australian_Army_Unimog_truck_with_digital_camouflage_side_view.JPG)                                                                             | Nick-D                                                    | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 4000×3000 |
| `rear-34.jpg`                  | rear three-quarter       | Australian Army cargo Unimog, rear three-quarter, being loaded aboard USS Boxer in 2005.                                                         | [Commons](<https://commons.wikimedia.org/wiki/File:US_Navy_050531-N-3455P-004_An_Royal_Australian_Army_cargo_truck_is_prepared_for_loading_aboard_amphibious_assault_ship_USS_Boxer_(LHD_4).jpg>) | U.S. Navy photo by Photographer's Mate Airman Paul Polach | Public domain (work of the U.S. federal government)            | 1971×1131 |
| `three-quarter-museum.jpg`     | three-quarter            | Unimog that served with the SASR, at the Army Museum of Western Australia.                                                                       | [Commons](https://commons.wikimedia.org/wiki/File:Unimog_truck_at_the_Army_Museum_of_WA_June_2018.jpg)                                                                                            | Nick-D                                                    | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) | 4048×3036 |
| `three-quarter-u1700-1983.jpg` | three-quarter            | A 1983 Unimog 1700. Same 435 cab family. The tray may not be the Australian dropside body; use the ADFA photos for the Army truck's proportions. | [Commons](https://commons.wikimedia.org/wiki/File:Unimog_1700.jpg)                                                                                                                                | Joost J. Bakker from IJmuiden                             | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)       | 4984×3738 |
| `detail-steering.jpg`          | interior, steering wheel | Unimog 435 steering wheel. The photograph is dark.                                                                                               | [Commons](https://commons.wikimedia.org/wiki/File:Unimog_435_Lenkrad.jpg)                                                                                                                         | Jojhnjoy                                                  | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) | 3264×2448 |
