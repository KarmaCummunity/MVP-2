// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../services/userComposition', () => ({
  getUserRepo: () => ({ findById: async () => ({ preferredLanguage: 'ru' }) }),
}));
vi.mock('../../store/authStore', () => ({
  useAuthStore: (sel: (s: { session: { userId: string } | null }) => unknown) =>
    sel({ session: { userId: 'u1' } }),
}));
vi.mock('../../i18n/deviceLanguage', () => ({
  resolveReaderLanguage: (p: string | null) => p ?? 'he',
}));

import { useReaderLanguage } from '../useReaderLanguage';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: new QueryClient() }, children);

describe('useReaderLanguage', () => {
  it('falls back to he before the user record loads', () => {
    const { result } = renderHook(() => useReaderLanguage(), { wrapper });
    expect(result.current).toBe('he');
  });
});
