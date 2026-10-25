import type { SurpriseSetDef } from '../../sim/world/surprisePlan';

/**
 * The CREB's surprises (src/sim/world/surprisePlan.ts): a dead tree coming down across the
 * track, and rocks coming off a cutting's bank after the rain. Each run gets two tree falls
 * and one rockfall, on different stretches, at spots its seed picks. Stretches are metres
 * along each track from its south end.
 */
export const crebSurprises: SurpriseSetDef = {
  sites: [
    // Dead trees: in the timber at the top of the paddocks, through the rainforest on the
    // range (north of the ridge's deep bog and pinch), and along the Bloomfield Track.
    { id: 'paddocks', kind: 'treefall', track: 'paddock-road', from: 850, to: 1250 },
    { id: 'ridge-north', kind: 'treefall', track: 'creb-ridge', from: 340, to: 690 },
    { id: 'roaring-meg', kind: 'treefall', track: 'roaring-meg-climb', from: 50, to: 300 },
    { id: 'range-top', kind: 'treefall', track: 'range-top', from: 30, to: 340 },
    { id: 'bloomfield-south', kind: 'treefall', track: 'bloomfield-track', from: 100, to: 700 },
    { id: 'bloomfield-north', kind: 'treefall', track: 'bloomfield-track', from: 1300, to: 2200 },
    // Rocks off the clay cuttings on the range and the concrete descent (the planner keeps
    // them off the steep pinches).
    { id: 'ridge-cutting', kind: 'rockfall', track: 'creb-ridge', from: 30, to: 690 },
    { id: 'meg-cutting', kind: 'rockfall', track: 'roaring-meg-climb', from: 50, to: 300 },
    { id: 'range-top-cutting', kind: 'rockfall', track: 'range-top', from: 30, to: 340 },
    { id: 'concrete-cutting', kind: 'rockfall', track: 'concrete-descent', from: 20, to: 365 },
  ],
  treefalls: 2,
  rockfalls: 1,
};
