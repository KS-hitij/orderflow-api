import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlCache } from '../src/lib/cache';

describe('TtlCache', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a value before it expires', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('a', 'one');
    vi.advanceTimersByTime(999);
    expect(cache.get('a')).toBe('one');
  });

  it('drops a value after the TTL', () => {
    const cache = new TtlCache<string>(1000);
    cache.set('a', 'one');
    vi.advanceTimersByTime(1000);
    expect(cache.get('a')).toBeUndefined();
  });
});
