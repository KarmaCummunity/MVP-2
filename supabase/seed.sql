-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data — applied after migrations on local dev (`supabase db reset`).
-- Mapped to: FR-PROFILE-007 (city dropdown), FR-AUTH-010 (onboarding city pick).
-- For the live project, apply these inserts manually via the SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Israeli cities (starter set) ───────────────────────────────────────────
insert into public.cities (city_id, name_he, name_en) values
  ('tel-aviv',     'תל אביב',          'Tel Aviv'),
  ('jerusalem',    'ירושלים',           'Jerusalem'),
  ('haifa',        'חיפה',              'Haifa'),
  ('rishon',       'ראשון לציון',       'Rishon LeZion'),
  ('petah-tikva',  'פתח תקווה',         'Petah Tikva'),
  ('ashdod',       'אשדוד',             'Ashdod'),
  ('netanya',      'נתניה',             'Netanya'),
  ('beer-sheva',   'באר שבע',           'Beer Sheva'),
  ('bnei-brak',    'בני ברק',           'Bnei Brak'),
  ('holon',        'חולון',             'Holon'),
  ('ramat-gan',    'רמת גן',            'Ramat Gan'),
  ('ashkelon',     'אשקלון',            'Ashkelon'),
  ('rehovot',      'רחובות',            'Rehovot'),
  ('bat-yam',      'בת ים',             'Bat Yam'),
  ('herzliya',     'הרצליה',            'Herzliya'),
  ('kfar-saba',    'כפר סבא',           'Kfar Saba'),
  ('hadera',       'חדרה',              'Hadera'),
  ('modiin',       'מודיעין',           'Modi''in'),
  ('nazareth',     'נצרת',              'Nazareth'),
  ('raanana',      'רעננה',             'Ra''anana')
on conflict (city_id) do nothing;
