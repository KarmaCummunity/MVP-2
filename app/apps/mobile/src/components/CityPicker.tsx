/**
 * CityPicker — public.cities-backed modal per FR-AUTH-010 AC2.
 *
 * Implementation delegates to SearchablePicker so City and Street pickers
 * stay identical in look and behavior. All filtering / free-text logic is
 * unit tested via searchablePickerLogic.test.ts.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { City } from '@kc/domain';
import { SearchablePicker } from './SearchablePicker/SearchablePicker';
import { listCities } from '../services/userComposition';

interface Props {
  readonly value: { id: string; name: string } | null;
  readonly onChange: (selection: { id: string; name: string }) => void;
  readonly disabled?: boolean;
}

// Module-scope helpers — referentially stable so the SearchablePicker doesn't
// invalidate its memoized filter list on every render.
const matchCity = (c: City, q: string): boolean =>
  c.nameHe.includes(q) || c.nameEn.toLowerCase().includes(q.toLowerCase());
const renderCity = (c: City) => ({ id: c.cityId, name: c.nameHe });

export function CityPicker({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: listCities,
    staleTime: 1000 * 60 * 60, // 1h — cities rarely change.
  });

  return (
    <SearchablePicker<City>
      title={t('profile.cityPickerTitle')}
      placeholder={t('profile.cityPickerSearchPlaceholder')}
      value={value}
      items={data ?? null}
      isLoading={isLoading}
      error={error}
      disabled={disabled}
      onSelect={onChange}
      matchItem={matchCity}
      renderRow={renderCity}
      emptyText={t('profile.cityPickerEmpty')}
      errorText={t('profile.cityPickerError')}
    />
  );
}
