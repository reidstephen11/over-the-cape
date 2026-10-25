# Nissan Patrol Y60 (GQ) long-wheelbase wagon, 1987–97

Game id: `patrol`.

**What to match.** The Australian GQ is the Y60, built from 1987 to 1997. The game is the long-wheelbase wagon: 2.97 m wheelbase, coil springs, the 4.2 L TD42 diesel, five-speed, and the usual Cape touring kit (steel bull bar with a winch and two driving lamps, a snorkel, a roof rack, 31×10.5R15 tyres). The photographs are stock wagons, so they show the body without that kit. Match the body first, then the kit.

Series 1 (the 1988 and 1989 cars here) and the GQ II facelift (1992, 1994, 1997) both have rectangular headlamps. The facelift changes the grille and the lamp units. It does not switch them to round lamps.

## Dimensions

From the Y60 infobox on [Nissan Patrol](<https://en.wikipedia.org/wiki/Nissan_Patrol#Fourth_generation_(Y60;_1987)>), long-wheelbase wagon.

|           | Published, long-wheelbase wagon                       | In the current model                                                                                                |
| --------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Wheelbase | 2,970 mm                                              | 2.97 m                                                                                                              |
| Length    | 4,810 mm                                              | about 4.72 m for the skin (`F` −2.27 to `TAIL` 2.45 in `src/render/patrolBody.ts`); the bull bar is further forward |
| Width     | 1,930 mm                                              | 1.74 m (`SIDE` 0.87)                                                                                                |
| Height    | 1,820 mm low roof, 1,995 mm high roof                 | about 1.80 m to the roof (y = 1.29, ground 0.51 m below the origin), before the rack                                |
| Track     | the game uses 1.555 m                                 | 1.555 m                                                                                                             |
| Tyres     | the game's touring size is 31×10.5R15 (787 mm across) | radius 0.394 m                                                                                                      |

**Check these first.** `patrolBody.ts` draws a round 7-inch lamp in a square surround and calls that panel series 1. Every front view in this folder shows rectangular lamps. That is the largest identifying miss. The body is also about 190 mm narrower than the wagon's 1,930 mm, which will show immediately against `side-right-1989.jpg` and `side-1992.jpg`. Wheelbase and roof height are close.

## Gaps

No straight-on front, no straight-on rear, no top view, no interior, no free blueprint. No stock photo shows the bull bar, snorkel and 31-inch tyres together; those are the game's additions, and they should still sit on this body.

## Photographs

Keep this list with the files. CC BY and CC BY-SA require credit to the author, which is this table. Several of these were released into the public domain by the photographer.

| File                     | Angle                     | What it shows                                                                               | Source page                                                                                                  | Author       | Licence                                                           | Pixels    |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------ | ----------------------------------------------------------------- | --------- |
| `front-34-1988.jpg`      | front three-quarter       | 1988 GQ (Y60) DX wagon, series 1, front three-quarter. Rectangular headlamps.               | [Commons](<https://commons.wikimedia.org/wiki/File:1988_Nissan_Patrol_(GQ)_DX_wagon_(2012-08-07)_01.jpg>)    | FotoSleuth   | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)          | 3096×1808 |
| `rear-34-1988.jpg`       | rear three-quarter        | 1988 GQ DX wagon, rear three-quarter.                                                       | [Commons](<https://commons.wikimedia.org/wiki/File:1988_Nissan_Patrol_(GQ)_DX_wagon_(2012-08-07)_02.jpg>)    | FotoSleuth   | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0)          | 2448×2078 |
| `front-34-left-1989.jpg` | front three-quarter, left | 1989 GQ ST wagon, series 1, front three-quarter from the left. Photographed in Victoria.    | [Commons](<https://commons.wikimedia.org/wiki/File:1989_Nissan_Patrol_(GQ)_ST_wagon_(2015-06-15)_01.jpg>)    | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 4272×2856 |
| `side-right-1989.jpg`    | side, right               | 1989 GQ ST wagon, right-hand profile.                                                       | [Commons](<https://commons.wikimedia.org/wiki/File:1989_Nissan_Patrol_(GQ)_ST_wagon_(2015-06-15)_02.jpg>)    | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 4272×2856 |
| `side-1992.jpg`          | side                      | 1992 GQ II ST wagon in profile. Facelift grille and lamps; the lamps are still rectangular. | [Commons](<https://commons.wikimedia.org/wiki/File:1992_Nissan_Patrol_(GQ_II)_ST_wagon_(2010-09-23).jpg>)    | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 3812×1810 |
| `front-34-1994.jpg`      | front three-quarter       | 1994 GQ II RX wagon, front three-quarter.                                                   | [Commons](<https://commons.wikimedia.org/wiki/File:1994_Nissan_Patrol_(GQ_II)_RX_wagon_(2015-07-03)_01.jpg>) | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 4272×2856 |
| `rear-34-left-1994.jpg`  | rear three-quarter, left  | 1994 GQ II RX wagon, rear three-quarter from the left. Spare on the rear door.              | [Commons](<https://commons.wikimedia.org/wiki/File:1994_Nissan_Patrol_(GQ_II)_RX_wagon_(2015-07-03)_02.jpg>) | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 4272×2856 |
| `front-34-1997.jpg`      | front three-quarter       | 1997 GQ II RX wagon, front three-quarter. Late in the Y60 run.                              | [Commons](<https://commons.wikimedia.org/wiki/File:1995-1997_Nissan_Patrol_(GQ_II)_RX_wagon_01.jpg>)         | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 2564×1704 |
| `rear-34-1997.jpg`       | rear three-quarter        | 1997 GQ II RX wagon, rear three-quarter.                                                    | [Commons](<https://commons.wikimedia.org/wiki/File:1995-1997_Nissan_Patrol_(GQ_II)_RX_wagon_02.jpg>)         | OSX          | Public domain (released by the photographer on Wikimedia Commons) | 2720×1712 |
| `front-34-4.2.jpg`       | front three-quarter       | Y60 4.2 litre diesel (SGL-D), the TD42 family, front three-quarter.                         | [Commons](https://commons.wikimedia.org/wiki/File:Nissan_Patrol_Y60_4.2_SGL-D_Passion_Red_01.jpg)            | Ethan Llamas | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)    | 4206×2804 |
| `rear-34-4.2.jpg`        | rear three-quarter        | Same 4.2 litre diesel Y60, rear three-quarter.                                              | [Commons](https://commons.wikimedia.org/wiki/File:Nissan_Patrol_Y60_4.2_SGL-D_Passion_Red_02.jpg)            | Ethan Llamas | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0)    | 3240×2160 |
