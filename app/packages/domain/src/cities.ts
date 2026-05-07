// ─────────────────────────────────────────────
// Reference data: Israeli cities.
// MUST stay in sync with `supabase/migrations/0001_init_users.sql` §1
// (insert into public.cities …). If you add a city, update both files.
// ─────────────────────────────────────────────

import type { City } from './entities';

export const IL_CITIES: readonly City[] = [
  { cityId: 'tel-aviv',    nameHe: 'תל אביב',    nameEn: 'Tel Aviv' },
  { cityId: 'jerusalem',   nameHe: 'ירושלים',     nameEn: 'Jerusalem' },
  { cityId: 'haifa',       nameHe: 'חיפה',        nameEn: 'Haifa' },
  { cityId: 'rishon',      nameHe: 'ראשון לציון', nameEn: 'Rishon LeZion' },
  { cityId: 'petah-tikva', nameHe: 'פתח תקווה',   nameEn: 'Petah Tikva' },
  { cityId: 'ashdod',      nameHe: 'אשדוד',       nameEn: 'Ashdod' },
  { cityId: 'netanya',     nameHe: 'נתניה',       nameEn: 'Netanya' },
  { cityId: 'beer-sheva',  nameHe: 'באר שבע',     nameEn: 'Beer Sheva' },
  { cityId: 'bnei-brak',   nameHe: 'בני ברק',     nameEn: 'Bnei Brak' },
  { cityId: 'holon',       nameHe: 'חולון',       nameEn: 'Holon' },
  { cityId: 'ramat-gan',   nameHe: 'רמת גן',      nameEn: 'Ramat Gan' },
  { cityId: 'ashkelon',    nameHe: 'אשקלון',      nameEn: 'Ashkelon' },
  { cityId: 'rehovot',     nameHe: 'רחובות',      nameEn: 'Rehovot' },
  { cityId: 'bat-yam',     nameHe: 'בת ים',       nameEn: 'Bat Yam' },
  { cityId: 'herzliya',    nameHe: 'הרצליה',      nameEn: 'Herzliya' },
  { cityId: 'kfar-saba',   nameHe: 'כפר סבא',     nameEn: 'Kfar Saba' },
  { cityId: 'hadera',      nameHe: 'חדרה',        nameEn: 'Hadera' },
  { cityId: 'modiin',      nameHe: 'מודיעין',     nameEn: "Modi'in" },
  { cityId: 'nazareth',    nameHe: 'נצרת',        nameEn: 'Nazareth' },
  { cityId: 'raanana',     nameHe: 'רעננה',       nameEn: "Ra'anana" },
];

export function findCityById(cityId: string): City | undefined {
  return IL_CITIES.find((c) => c.cityId === cityId);
}
