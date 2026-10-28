# Vehicle fuel

Tank capacity describes the real vehicle. Starting fuel describes the episode's load. Consumption is estimated from engine work in real litres per second, then accelerated once by the episode's `fuelScale`. Neither the starting fill nor the episode multiplier changes the tank's capacity or the engine's power.

## Tank capacities and sources

Checked on 27 October 2026. These are the configurations represented in the game; other years, markets and aftermarket tanks can differ.

| Vehicle                    | Capacity        | Source and configuration                                                                                                                                                                                                                                                                                                 |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Short-wheelbase 4WD        | 62 L            | Toyota's [1976 FJ40/FJ55 owner's manual](https://fliphtml5.com/qfaxu/dudw/1976_FSM_FJ40_FJ55_Factory_Service_Manual_%289709A%29/), short-wheelbase 2F petrol hardtop.                                                                                                                                                    |
| Camel Trophy Land Rover 90 | 54.5 L          | The Ninety's 12-gallon rear tank, from Rimmer Bros' [early 90/110 data](https://rimmerbros.com/images/PDFs/Defender.pdf). Since v0.80 the Camel is the 1986 event's 2.5 L diesel Ninety, not the FJ40 in Camel dress.                                                                                                    |
| Perentie 110               | 65 L            | Australian Army [EMEI Vehicle G 100, Issue 3](https://www.remlr.com/documents/EMEI/G100%20-%20GS%20Data.pdf), page 4, fuel capacity of the 4x4 General Service vehicle. This takes precedence over guides listing 68 L and the game's former generic 79 L.                                                               |
| Hilux                      | 61 L            | Toyota's [1979 Hilux 4WD launch specifications](https://mag.toyota.co.uk/in-focus-1979-toyota-hilux-4wd/), 2.0 L 18R petrol RN46. The former 65 L figure belongs to other Hilux generations.                                                                                                                             |
| Unimog UL1700L             | 160 L           | Australian Army [Unimog user handbook, NSN 7610-66-156-2407](https://afmsafety.com.au/wp-content/uploads/2018/03/UHB-Unimog-Cargo.pdf), section 1 chapter 1 page 3. Some civilian or modified trucks differ.                                                                                                             |
| HZJ75 Troop Carrier        | 180 L (90 + 90) | The Long Ranger's [TW21SS fitting instructions](https://www.equip-raid.fr/ressources/references/fichiers/TW21SS.pdf), page 1, identify the 75/78 Troop Carrier configuration with factory twin 90 L tanks. The game represents that configuration, rather than applying a later model's specification to every HZJ75.    |
| GQ Patrol TD42 wagon       | 95 L            | Nissan's [Y60/GQ service manual](https://www.technirevue.com/revue_technique/revue-technique-nissan-patrol-gq.pdf), General Information, recommended fuel and capacity. No GU-style auxiliary tank is assumed.                                                                                                           |
| LC79 V8 single cab         | 130 L           | Toyota's [70 Series specifications](https://www.toyota.com.au/landcruiser-70/range) and its [2023 VDJ79 listing](https://www.illawarratoyota.com.au/cars/used-grey-2023-toyota-landcruiser-uw08660). This is the factory capacity, despite the old code calling it a long-range tank.                                    |
| 80 Series — Sooty MkII     | 145 L (95 + 50) | [Brown Davis’ 80 Series application](https://www.browndavis.com.au/toyota-landcruiser-80-series-168-litre-45-gallon-long-range-fuel-tanks/) identifies the Australian factory 95 L main and 50 L sub-tank configuration. The game uses that capacity, without assuming an unverified aftermarket tank on the real Sooty. |

The Troop Carrier still starts with 60 L extra, for 110 L total in the current episodes. Its 90 L sub-tank does not have to start full. All starts and restored camp checkpoints are limited to the selected vehicle's capacity; changing to a larger vehicle never adds fuel. Jerry cans remain separate 20 L containers and need room for a whole can.

## Consumption model

The old calculation charged fuel for the engine friction and automatic clutch/converter losses used to tune the driving controls. Several engines idled on 3–5 L/h. The Unimog also had an efficiency of 0.46 chosen to make an earlier mission finish.

The calculation now adds an idle allowance to fuel for positive engine work: combustion power less simulated friction and the coupling's idle loss. A hard pull burns fuel even at zero road speed. A stopped engine burns none. Petrol and diesel retain different fuel energy and efficiency; the old petrol six uses a lower efficiency than the Hilux. These are simulation estimates, not measured engine maps or certified consumption figures. The tuned LC79, big tyres, loaded vehicles and rough ground cannot be represented accurately by a single factory combined-cycle number.

Run `npx vite-node scripts/fuel-check.ts` for repeatable checks on dry, level dirt, before episode scaling. The speed controller settles slightly below its target. At v0.44:

| Vehicle                     | Measured idle (L/h) | Level dirt (L/100 km) | Average speed (km/h) |
| --------------------------- | ------------------- | --------------------- | -------------------- |
| Short-wheelbase             | 1.40                | 16.7                  | 56.4                 |
| Perentie                    | 0.80                | 11.3                  | 56.3                 |
| Hilux                       | 1.16                | 12.8                  | 55.9                 |
| Unimog                      | 1.80                | 22.8                  | 36.8                 |
| Troop Carrier               | 1.10                | 14.8                  | 56.3                 |
| Patrol                      | 1.36                | 13.8                  | 56.3                 |
| Modified LC79               | 1.31                | 16.4                  | 57.7                 |
| Camel Land Rover 90 (v0.80) | about 0.6           | about 8.9             | 50–60                |

For comparison, the Army's Unimog handbook gives approximately 25 L/100 km, without specifying this test's conditions. A [Perentie owner's measured trip report](https://www.4x4australia.com.au/reviews/1988-land-rover-perentie-defender-110-long-term-review) records 11.7 L/100 km on one trip and 14.0 on another. Those are reference points, not exact targets for every surface or speed. The idle allowances are engineering estimates for the engine sizes, not factory specifications.

Episode multipliers remain 6 (CREB), 13 (Old Coach Road) and 18 (Lakefield), applied to the entire real-time burn including idle. They represent shortened travel, independently of the clock multiplier. With the episode storm, the CREB autopilot uses 30.4 L in the short-wheelbase 4WD and 39.8 L in the Unimog, arriving at 3:47 pm and 3:55 pm respectively. Both finish on the 50 L in the tank. The jerry can is for a recovery.
