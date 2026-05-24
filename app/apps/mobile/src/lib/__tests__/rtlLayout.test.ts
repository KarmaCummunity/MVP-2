import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  crossAxisAlignStart,
  isLayoutRtl,
  layoutDirectionStyle,
  selfAlignStart,
  textAlignStart,
} from '../rtlLayout';

describe('rtlLayout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports flex-start alignment tokens', () => {
    expect(crossAxisAlignStart).toBe('flex-start');
    expect(selfAlignStart).toBe('flex-start');
  });

  it('textAlignStart follows document dir on web', () => {
    vi.stubGlobal('document', {
      documentElement: { getAttribute: () => 'rtl' },
    });
    expect(textAlignStart()).toBe('right');

    vi.stubGlobal('document', {
      documentElement: { getAttribute: () => 'ltr' },
    });
    expect(textAlignStart()).toBe('left');
  });

  it('layoutDirectionStyle follows document dir on web', () => {
    vi.stubGlobal('document', {
      documentElement: { getAttribute: () => 'ltr' },
    });
    expect(isLayoutRtl()).toBe(false);
    expect(layoutDirectionStyle()).toEqual({ direction: 'ltr' });
  });
});
