# FJ40 Blender build — LOG (step 1: body shell)

Run on the Grok Bot box, 11 Nov 2026 (Brisbane), headless Blender 5.3.0, Cycles CPU (8 threads), no cloud agent.
Rebuild + render everything: `blender --background --factory-startup --python fj40_body.py -- --render --tag itN --samples 64`
(~5 s to build/export, ~45 s for six 1050×700 renders at 64 samples). Composites: reference photo left, render right.

Reference views used: front 3/4 = `front-34-right-1982.jpg`, side/rear 3/4 = `rear-34-left.jpg` (near-true right side),
front = `front-white.jpg`, rear 3/4 = `front-34-hardtop.jpg` (despite its name it is a rear 3/4 of the beige 1980 hardtop).
Plus ortho side/front renders (no photo) for checking measurements.

Wheels and headlamp discs in the renders are **render-only placeholders** (not exported) so the body reads at the right
ride height. Cost: no LLM-agent token spend on this run (done by Grok Bot directly), so the $25 budget is untouched.

## it1 — block-out

- Lofted/booleaned solids: crowned bonnet, front panel with lamp/grille recesses, side-profile wings with arch + flare tail,
  cowl sides with louvres, slab-sided tub with rear arch, door/barn-door shut lines and swage line, greenhouse shell
  (tumblehome, rounded rear corners) with window cut-outs, recessed glass, white domed roof.
- Wheelbase 2.285, width 1.666 over the guard lips, tub 1.55, roof 1.95 above ground, ground 0.50 below origin.
- Bug found: cylinder helpers applied the ground offset twice (wheels/arches/lamps 0.5 m low) → fixed (it1b).
- Differences vs photos: bonnet far too low under the beltline, wings read as flat trays, windows sharp-cornered, roof thin,
  over-bright lighting, cameras too far away / rear camera mirrored.

## it2 — proportions

- Bonnet raised (1.28 m at the cowl → 1.19 m at the nose), cowl reshaped to meet it; belt 1.35; front panel narrower and
  taller; headlamps moved to ±0.335 m; thicker white roof with a visor lip over the windscreen; rounded window corners.
- Cameras re-aimed (closer, ~28–30 mm).

## it3 — wings, arches, windows

- Arches raised and enlarged (front r 0.48 / rear r 0.49, centres 0.45 m above ground); rounded front-top corner on the wings,
  bigger rolled bevel; windows taller (1.40–1.815 m); black rubber seals around every opening (trim_window_rubber).

## it4 — front end

- Headlamps up to 0.975 m so the bonnet lip sits just above them, grille and vent recesses moved up, front panel 0.71–1.13 m,
  black lower valance added behind where the bumper will go; wing front face shortened.

## it5 — camera match + final renders (64 samples)

- Cameras re-aimed to match each photo more closely. Model unchanged from it4.

## it6 — running board + camera fix

- Running-board step under each door (the front flare tail now runs into it).
- Found three of the four cameras were on the wrong side of the car (photo shows the opposite side). The body is
  symmetric so geometry was unaffected, but composites are now the same orientation as each photo; framing re-tuned.

### What still differs from the photos (end of step 1)

- Greenhouse reads slightly tall relative to the tub in the side view; real windows are a touch bigger and the beltline
  a little higher — worth re-measuring off `rear-34-left.jpg` once wheels/tyres are real (stock vs the photo car's lift).
- No bumpers, grille bars/surround, indicators, lamps, mirrors, handles, hinges, badges, wipers, spare, tail lamps,
  chassis/running gear — all later steps, but their absence makes the front and rear look bare and the body look "tall".
- Front wing is still a slightly boxy tray: the real wing top is narrower and rolls more into the flare, and the flare tail
  should run into a running-board step under the door.
- Bonnet side panels and cowl transition are simplified (real car: bonnet side flows into the cowl with a crease).
- Rear arch on the real car is a flatter, wider opening; ours is a circle.
- Windscreen frame is not a separate fold-down frame; no drip rail on the roof sides yet.
- Door shut lines are only on the tub; no door-top/A-pillar seams; no door hinges.
- Interior is empty (dark); see-through windows show the background.
- trim_window_rubber is 6.2k tris — could be simplified.

Triangles (body step): 28,980 total. Materials: paint (recolourable), paint_roof, glass, interior, trim_black. No textures.

---

# Step 2 — panel fixes + front end (11 Nov 2026, 3:05–3:15 PM Brisbane)

Same script workflow, Blender 5.3.0, Cycles CPU. Renders tagged `s2a`, `s2b`, final `s2`. Best composites in `best-step2/`.

## s2a — panel fixes + front details

- **Front wings:** now the intersection of the side profile and a cross-section with a narrow flat top (x 0.50–0.67)
  that rolls on a 0.16 m radius into the flare (outer face 0.833). Replaces the boxy tray with a uniform bevel.
- **Rear arch:** superellipse opening (half-width 0.56, half-height 0.50, n 2.7), flatter and wider than the old
  r 0.49 circle; the lip follows the same shape.
- **Bonnet-to-cowl:** the cowl front edge is a raked quadratic curve from the wing top up to the windscreen base,
  with a 22 mm bevel, replacing the sharp vertical step.
- **Front end (new):** `trim_grille_surround` (white, holes for lamps and grille), `trim_grille_bars` (4 horizontal
  chrome bars + 2 uprights), `trim_badge` (black plate + raised TOYOTA lettering as text geometry),
  `trim_bezel_head_l/r` (chrome rings), `lamp_head_l/r` (domed lens + chrome reflector), `lamp_indicator_fl/fr`
  (amber) on `trim_indicator_housing`, `trim_bumper_front` (pressed-steel channel with swept ends) on
  `trim_bumper_brackets`. Render-only headlamp discs removed.
- **Seals slimmed:** seal and glass lofts use one exact linear span (the tumblehome is linear) and 3-segment corners:
  `trim_window_rubber` 6,184 → 3,328 tris, glass panels about 40% lighter.
- **Problems seen:** the bonnet was a solid whose front face hid most of the grille surround, and the lenses read as
  empty rings (transmissive lens over a chrome reflector that mirrored the red recess).

## s2b — fixes

- The bonnet is now a lid: full-depth sides back to the cowl, but only a thin lip (bottom 1.10 m) over the front panel.
  The surround, lamps and grille are fully visible.
- Lens material is opaque, coated and slightly metallic, so it reads like a sealed beam.

## s2 — final

- Bumper raised to 0.525–0.675 m and narrowed to 1.68 m overall (first pass was 1.73 m, wider than the body).
  Bezel bevel segments reduced. Front 3/4 camera re-centred.

GLB: 31,352 tris, 30 objects, 10 materials, no textures. 1.68 × 3.75 m (bumper to tail skin; rear bumperettes still
to come), roof 1.95 m above the ground.

### What still differs from the photos (end of step 2)

- The grille is generic horizontal bars. The 1982 photo car has a black mesh panel with large TOYOTA letters, older
  cars a different bar pattern. The badge plate is small next to the photo's.
- Indicators are flat rectangles. The photos show deeper amber pods on chrome bases, set slightly higher on the wing front.
- The front bumper is a plain channel: no bolt heads, no over-riders, no number plate, no lower apron.
- The bonnet has no centre ridge, louvres or hold-down catches. The wing roll is uniform along its length
  (the real wing softens toward the front).
- The rear arch has the right shape now, but its lip is thinner than the real swaged edge.
- Still to come: mirrors, door handles and hinges, wipers, windscreen frame and hinges, roof drip rail, rear
  bumperettes, tail lamps, spare on the left rear door, wheels and tyres, chassis, interior.
- The cabin is still slightly tall relative to the tub in the side view (carried over from step 1).

---

# Step 3 — wheels, tyres, spare; ride-height and cabin check (11 Nov 2026, from 3:16 PM Brisbane)

Renders tagged `s3a` (wheels only) and `s3` (final). Best composites in `best-step3/`.

## Wheels and spare

- `wheel_fl/fr/rl/rr`, each one object with its origin at the hub. 7.50-16 sizing from the research pack: tyre radius
  0.392 m (about 0.78 m overall), 0.21 m wide, on the published 1.40 m track. Hubs 0.392 m above the ground, so
  the hub sits at z = -0.108 with the ground at -0.50.
- **Tyre:** revolved profile with a rounded shoulder, a bulged sidewall and the bead. Lower-detail tread: 24 blocks,
  each two rings (48 rings), with two circumferential grooves. The shoulder lugs alternate 11 mm in depth, offset
  left to right, and the upper sidewall steps with them. Sharp edges at 30 degrees so the lugs read crisply.
- **Rim:** white-painted steel (`wheel_white`), 16 in, flange and dished disc, chrome centre cap and 6 chrome lug nuts
  on the 139.7 mm PCD (like the white-wheeled photo cars).
- **Spare:** `spare` (same wheel) on the **left** rear barn door, face to the rear, centre 0.375 m left of the centreline and
  1.06 m above the ground, on a black `trim_spare_carrier` (door plate + hub boss).
- 4,096 tris per wheel (tyre 2,688). Render-only stand-ins removed; only the ground plane is not exported.

## Ride height and cabin check

I measured `rear-34-left.jpg` (a near-true side view) in the rear-wheel column. Two independent scales agree within
about 5%: the white rim diameter, and the body's roof-to-sill span against the model's 1.38 m. That gives about
2.8 mm/px, and the photo's tyre comes out at about 0.77–0.80 m, so the car is close to stock height. Measured from the hub:

|                           | photo                      | model before         | verdict                   |
| ------------------------- | -------------------------- | -------------------- | ------------------------- |
| body lower edge above hub | 0.19 m                     | 0.18 m               | ride height OK            |
| roof top above ground     | ~1.97 m                    | 1.95 m               | OK                        |
| window bottom             | ~1.39 m                    | 1.40 m               | OK                        |
| window top                | ~1.76 m                    | 1.815 m              | **windows 5 cm too tall** |
| white roof cap starts     | ~1.82 m (0.13–0.15 m deep) | 1.85 m (0.11 m deep) | **cap too thin**          |
| rear arch top             | ~0.89 m                    | 0.95 m               | **arch 6 cm too high**    |

Verdict: the ride height is right. The "cabin too tall" look was a body issue: tall windows plus a thin white cap.
**Fixes:** window tops 1.815 → 1.765 m (windscreen 1.80 → 1.765 m), white cap starts at 1.82 m with its height scaled
so the roof top stays at 1.95 m, and the rear arch centre 0.45 → 0.40 m (top now 0.90 m).
The front arch was not re-measured: the front wheel is too foreshortened in this photo.

GLB: 51,896 tris, 38 objects, 12 materials, no textures. 1.68 × 4.01 m (front bumper to spare) × 1.95 m (ground to roof).

### What still differs from the photos (end of step 3)

- The tread is a generic block pattern. Most photo cars wear modern all-terrains, which have deeper, more broken
  tread and raised sidewall lettering. A period 7.50-16 would be a narrower rib/lug.
- The photo car's chrome hubcap is a large dome covering the lugs. Ours is a small centre cap with exposed lugs
  (like the beige car). No wheel vent holes or rim weld detail.
- The spare has no cover, no carrier hinge arm and no number-plate bracket under it. The carrier is a simple plate.
- The front arch height was not re-checked against a true side view.
- Carried over: grille is generic bars, flat indicators, plain bumper channel, no bonnet ridge or catches. Still no
  mirrors, handles, hinges, wipers, windscreen frame, drip rail, rear bumperettes, tail lamps, chassis or interior.

---

# Step 4 — rear end, side hardware, windscreen frame (11 Nov 2026, 3:27–3:35 PM Brisbane)

Renders `s4a`, final `s4`. Best composites in `best-step4/`.

- **Front arch re-check (`side-1977.jpg`):** scaled off the 15 in rim and cross-checked against the wing-to-bonnet step
  (0.18 m in both the photo and the model). The flare band from the wing top down to the arch opening is about 0.17 m in
  the photo but only 0.06 m in the model. The arch centre was lowered 0.45 → 0.38 m (top now 0.86 m, a 0.13 m band,
  8 cm above the tyre).
- **Rear:** `trim_bumper_rear_l/r` (bumperettes wrapping the corners), `lamp_tail_l/r` (red) over `lamp_indicator_rl/rr`
  (amber) in `trim_tail_lamp_housing`, `trim_reflector_l/r` on the bumperettes, `trim_hinges_rear` (two per barn door,
  on the outer edges), `trim_handle_rear` (right door, beside the seam).
- **Sides:** `trim_hinges_door` (exposed hinges at each front door's leading edge), `trim_handle_door_l/r`,
  `trim_mirror_l/r` (arm + rear-facing head), `trim_drip_rail` (white, under the roof cap along both sides).
- **Windscreen:** `trim_windscreen_frame` (body colour, uses `paint` so it recolours, proud of the cabin front following
  its rake, with a visible shut line) and `trim_wiper_l/r` parked at the base.
- **Camera:** the rear 3/4 camera now matches `rear-34-left.jpg` (left rear, spare face-on to the camera).
- 55,720 tris.

### Still differs (end of step 4)

- Mirrors are generic rectangles on a straight arm. The photo mirror arm is shorter and mounted lower on the door.
- No number plates or plate lamps. The tail lamps are flat lenses.
- The windscreen frame has no hinge or clamp detail. The wipers are simple bars.

## Step 5 — chassis, interior, final (2026-11-11, Brisbane time)

- Hollowed the tub (cabin_void cutter, 4 cm walls, floor at 0.70 m) so the cabin shows through the glass.
- chassis_frame (static): ladder rails, 4 crossmembers, engine/sump/gearbox mass, fuel tank, front/rear prop shafts, exhaust + muffler (material chassis_black).
- chassis_axle_f/r (tube + offset diff) and chassis_spring_fl/fr/rl/rr (4-leaf packs). The game leaves these out; VehicleSuspension draws the moving ones.
- interior_seats (front buckets, rear side benches, dash, tunnel), interior_steering (right-hand drive wheel and column), interior_levers. The game uses its own code cockpit instead, so the dials and head camera still line up.
- Polish: the grille mesh and separate hubcap pieces were judged not worth it (grille bars and the hubcap/lug detail from steps 2–3 read fine at game distance).
- LOD: not needed. 59,676 tris is under the 60k–150k ceiling, so a single LOD.
- Final renders: tag `final`, 64 samples → best-final/fj40-final-{front34,side_rear34,front,rear34,ortho}.png.
- GLB: 59,676 tris, 1.48 MB, 15 materials, no textures; 1.68 m body width (2.03 m over the mirrors) × 4.005 m × 1.95 m.
