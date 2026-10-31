import { describe, expect, it } from 'vitest';
import { qualityFor, qualityPresets } from '../src/data/quality';

describe('qualityFor', () => {
  it('draws a phone saved on High at Medium', () => {
    expect(qualityFor('high', true)).toBe(qualityPresets.medium);
  });

  it('leaves the other settings and computers unchanged', () => {
    expect(qualityFor('high', false)).toBe(qualityPresets.high);
    expect(qualityFor('medium', true)).toBe(qualityPresets.medium);
    expect(qualityFor('low', true)).toBe(qualityPresets.low);
  });
});
