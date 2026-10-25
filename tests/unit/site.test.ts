import { describe, expect, it } from 'vitest';
import { isLaunchReady, site } from '../../src/config/site';

describe('isLaunchReady', () => {
  it('is false while placeholders remain', () => {
    expect(isLaunchReady(site)).toBe(false);
  });
  it('is true when email is set and linkedin is null', () => {
    expect(isLaunchReady({ ...site, email: 'a@b.no', linkedin: null })).toBe(true);
  });
});
