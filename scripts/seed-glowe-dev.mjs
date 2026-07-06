#!/usr/bin/env node
// Seeds the Supabase DEV project with realistic GloWe content (FR-GLOWE-*).
//
// DEV ONLY. The script refuses to run against the production project ref.
// Everything is idempotent: users are keyed by email, content rows carry
// deterministic ids and upsert on conflict, chats are find-or-created per
// participant pair. Re-running refreshes the dataset without duplicating it.
//
// Required env:
//   SUPABASE_URL               — https://roeefqpdbftlndzsvhfj.supabase.co (dev)
//   SUPABASE_SERVICE_ROLE_KEY  — dev service role (bypasses RLS; never commit)
// Optional env:
//   GLOWE_SEED_PASSWORD        — password for the seeded personas (dev-only
//                                fixture credential; defaults below so local
//                                Playwright runs can sign in as personas).
//
// Usage: node scripts/seed-glowe-dev.mjs

const PROD_REF = 'slxijdfvinbjmrsfgbzx';
const url = (process.env.SUPABASE_URL ?? 'https://roeefqpdbftlndzsvhfj.supabase.co').replace(/\/$/, '');
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
// `||` (not `??`): in CI an unset GLOWE_SEED_PASSWORD secret arrives as an
// EMPTY env var, which must still fall back to the dev fixture password.
const password = process.env.GLOWE_SEED_PASSWORD || 'GloweSeed!2026';

if (!service) {
  console.error('::error::Set SUPABASE_SERVICE_ROLE_KEY (dev service role).');
  process.exit(1);
}
if (url.includes(PROD_REF)) {
  console.error('::error::Refusing to seed the PRODUCTION project. Dev only.');
  process.exit(1);
}

const headers = {
  apikey: service,
  Authorization: `Bearer ${service}`,
  'Content-Type': 'application/json',
};

async function rest(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 400)}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function upsert(table, rows, onConflict) {
  const conflict = onConflict ? `?on_conflict=${onConflict}` : '';
  return rest(`${table}${conflict}`, {
    method: 'POST',
    body: rows,
    prefer: 'resolution=merge-duplicates,return=minimal',
  });
}

// ── Personas ─────────────────────────────────────────────────────────────────
// Mixed-language dataset, mostly Hebrew (PM decision 2026-07-04): realistic
// Israeli nonprofits and volunteers, plus a couple of English personas so the
// HE/EN translation path renders real content in both directions.
const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
const daysAhead = (n) => new Date(Date.now() + n * 24 * 3600 * 1000).toISOString();

const ORGS = [
  {
    key: 'levpatuach', email: 'glowe-org-levpatuach@seed.karma-community-kc.com',
    name: 'לב פתוח', orgName: 'לב פתוח',
    field: 'Food Security', country: 'Israel', location: 'תל אביב-יפו',
    website: 'https://www.levpatuach.org.il', reg: '580345678', size: '11-50',
    about: 'עמותת לב פתוח פועלת משנת 2014 לחלוקת סלי מזון למשפחות במצוקה באזור גוש דן. אנחנו מפעילים מערך של 120 מתנדבים קבועים, מרכז לוגיסטי ביפו ושיתופי פעולה עם רשתות מזון.',
    contactName: 'רונית אלמוג', contactPhone: '03-6091234', approval: 'approved',
  },
  {
    key: 'yarokbalev', email: 'glowe-org-yarokbalev@seed.karma-community-kc.com',
    name: 'ירוק בלב', orgName: 'ירוק בלב',
    field: 'Climate', country: 'Israel', location: 'חיפה',
    website: 'https://www.yarokbalev.org.il', reg: '580456789', size: '2-10',
    about: 'ארגון סביבתי קהילתי הפועל בצפון: ניקיונות חופים, גינות קהילתיות, סדנאות קומפוסט וחינוך סביבתי בבתי ספר. הוקם על ידי תושבי חיפה אחרי אסון השמן בחופים.',
    contactName: 'נדב שגיא', contactPhone: '04-8523471', approval: 'approved',
  },
  {
    key: 'code4good', email: 'glowe-org-code4good@seed.karma-community-kc.com',
    name: 'קוד למען הקהילה', orgName: 'קוד למען הקהילה',
    field: 'Tech for Good', country: 'Israel', location: 'ירושלים',
    website: 'https://www.code4community.org.il', reg: '580567890', size: '2-10',
    about: 'קהילת מתנדבי הייטק שבונה מערכות תוכנה לעמותות ללא עלות: אתרים, מערכות ניהול מתנדבים ואוטומציות. מאז 2019 השלמנו 43 פרויקטים עבור 31 עמותות.',
    contactName: 'עדי ברנשטיין', contactPhone: '02-5671938', approval: 'approved',
  },
  {
    key: 'gsharim', email: 'glowe-org-gsharim@seed.karma-community-kc.com',
    name: 'גשרים לחינוך', orgName: 'גשרים לחינוך',
    field: 'Education', country: 'Israel', location: 'באר שבע',
    website: 'https://www.gsharim.org.il', reg: '580678901', size: '11-50',
    about: 'תוכנית חונכות אישית לילדים ונוער בנגב: כל חניך מקבל חונך בוגר לליווי שבועי בלימודים ובחיים. פועלים ב-12 בתי ספר בבאר שבע, רהט ודימונה.',
    contactName: 'שירה דהן', contactPhone: '08-6237745', approval: 'approved',
  },
  {
    key: 'yadtomehet', email: 'glowe-org-yadtomehet@seed.karma-community-kc.com',
    name: 'יד תומכת', orgName: 'יד תומכת',
    field: 'Health', country: 'Israel', location: 'רמת גן',
    website: 'https://www.yadtomehet.org.il', reg: '580789012', size: '2-10',
    about: 'עמותה חדשה לליווי קשישים בודדים: ביקורי בית שבועיים, הסעות לקופות חולים וקו חם. הוקמה השנה על ידי צוות עובדות סוציאליות.',
    contactName: 'מרים וקנין', contactPhone: '03-7519826', approval: 'pending',
  },
  {
    key: 'globalimpact', email: 'glowe-org-globalimpact@seed.karma-community-kc.com',
    name: 'Global Impact Now', orgName: 'Global Impact Now',
    field: 'Community Building', country: 'United States', location: 'Remote',
    website: 'https://globalimpactnow.example.com', reg: '', size: '2-10',
    about: 'We connect global volunteers with local impact projects. Remote-first team coordinating cross-border volunteering programs.',
    contactName: 'James Porter', contactPhone: '+1-415-555-0132', approval: 'rejected',
    reviewNote: 'Registration details could not be verified. Please resubmit with a registration number.',
  },
];

const PEOPLE = [
  { key: 'naama', email: 'glowe-user-naama@seed.karma-community-kc.com', name: 'נעמה לוי', location: 'ירושלים', about: 'מורה לחינוך מיוחד, 15 שנות ניסיון. מתנדבת קבועה בתוכניות חונכות ומחפשת דרכים לתרום גם בחופשים.', skills: ['הוראה', 'חונכות', 'חינוך מיוחד'] },
  { key: 'avi', email: 'glowe-user-avi@seed.karma-community-kc.com', name: 'אבי כהן', location: 'אשדוד', about: 'נהג משאית עם רישיון עד 15 טון. שמח לעזור בהובלות לעמותות בסופי שבוע.', skills: ['הובלות', 'לוגיסטיקה'] },
  { key: 'michal', email: 'glowe-user-michal@seed.karma-community-kc.com', name: 'מיכל רוזן', location: 'תל אביב-יפו', about: 'מעצבת גרפית עצמאית. מעצבת בהתנדבות פוסטרים, לוגואים וחומרי גיוס לעמותות קטנות.', skills: ['עיצוב גרפי', 'מיתוג', 'רשתות חברתיות'] },
  { key: 'yossi', email: 'glowe-user-yossi@seed.karma-community-kc.com', name: 'יוסי מזרחי', location: 'חיפה', about: 'סטודנט להנדסת תוכנה בטכניון. מחפש פרויקט התנדבותי בתחום הקוד.', skills: ['JavaScript', 'Python'] },
  { key: 'ruth', email: 'glowe-user-ruth@seed.karma-community-kc.com', name: 'רות אברמוב', location: 'נתניה', about: 'גמלאית, לשעבר אחראית משק במלון. פנויה בבקרים ואוהבת לבשל בכמויות.', skills: ['בישול', 'ארגון אירועים'] },
  { key: 'daniel', email: 'glowe-user-daniel@seed.karma-community-kc.com', name: 'דניאל שטרן', location: 'הרצליה', about: 'מפתח תוכנה בכיר. מוביל צוות מתנדבים בפרויקט מערכת ניהול לעמותת חינוך.', skills: ['React', 'Node.js', 'ארכיטקטורה'] },
  { key: 'tamar', email: 'glowe-user-tamar@seed.karma-community-kc.com', name: 'תמר גולן', location: 'רחובות', about: 'אחות במרכז רפואי. מתנדבת בקו חם לבריאות הנפש פעמיים בשבוע.', skills: ['סיעוד', 'הקשבה', 'עזרה ראשונה'] },
  { key: 'omer', email: 'glowe-user-omer@seed.karma-community-kc.com', name: 'עומר פרץ', location: 'אשקלון', about: 'חשמלאי מוסמך. מתקן בהתנדבות מכשירי חשמל למשפחות שידן אינה משגת.', skills: ['חשמל', 'תיקונים'] },
  { key: 'hila', email: 'glowe-user-hila@seed.karma-community-kc.com', name: 'הילה ברק', location: 'רעננה', about: 'יועצת ארגונית. מלווה עמותות בתהליכי אסטרטגיה וגיוס משאבים pro-bono.', skills: ['אסטרטגיה', 'גיוס משאבים', 'הנחיית סדנאות'] },
  { key: 'elia', email: 'glowe-user-elia@seed.karma-community-kc.com', name: 'אליה נחום', location: 'ירושלים', about: 'צלם אירועים. מתעד בהתנדבות אירועי קהילה ומעביר סדנאות צילום לנוער.', skills: ['צילום', 'עריכת וידאו'] },
  { key: 'sarah', email: 'glowe-user-sarah@seed.karma-community-kc.com', name: 'Sarah Mitchell', location: 'Tel Aviv', about: 'Volunteer coordinator, new to Israel. Fluent in English and French, learning Hebrew. Looking to help NGOs with international outreach.', skills: ['Coordination', 'English', 'French'] },
  { key: 'david', email: 'glowe-user-david@seed.karma-community-kc.com', name: 'David Chen', location: 'Jerusalem', about: 'Freelance translator (EN/HE/ZH). Happy to translate documents and websites for nonprofits.', skills: ['Translation', 'Localization'] },
];

// ── 1. Ensure auth users ─────────────────────────────────────────────────────
async function adminFindUserByEmail(email) {
  const res = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=200`, { headers });
  if (!res.ok) throw new Error(`admin list users -> ${res.status}`);
  const body = await res.json();
  const list = body.users ?? body;
  return (list || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase()) ?? null;
}

async function ensureUser(persona) {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: persona.email,
      password,
      email_confirm: true,
      user_metadata: { name: persona.name, full_name: persona.name },
    }),
  });
  if (res.ok) {
    const body = await res.json();
    return body.id ?? body.user?.id;
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 422 && /already|exists/i.test(JSON.stringify(body))) {
    const existing = await adminFindUserByEmail(persona.email);
    if (existing) {
      // Re-align the password on every run so an earlier run with a different
      // (or empty) password cannot lock the persona out.
      await fetch(`${url}/auth/v1/admin/users/${existing.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password, email_confirm: true }),
      });
      return existing.id;
    }
  }
  throw new Error(`create user ${persona.email} -> ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
}

const ids = {};
for (const persona of [...ORGS, ...PEOPLE]) {
  ids[persona.key] = await ensureUser(persona);
  console.log(`user ${persona.key} = ${ids[persona.key]}`);
}

// ── 2. Activate KC user rows (email personas default to pending_verification) ─
for (const persona of [...ORGS, ...PEOPLE]) {
  await rest(`users?user_id=eq.${ids[persona.key]}`, {
    method: 'PATCH',
    body: { account_status: 'active', display_name: persona.name },
    prefer: 'return=minimal',
  });
}

// ── 3. GloWe profiles ────────────────────────────────────────────────────────
const orgProfiles = ORGS.map((o) => ({
  id: ids[o.key],
  display_name: o.name,
  email: o.email,
  profile_type: 'Organization',
  account_type: 'organization',
  onboarding_complete: true,
  approval_status: o.approval,
  country: o.country,
  location: o.location,
  about: o.about,
  focus: o.field,
  org_name: o.orgName,
  org_website: o.website,
  org_registration_number: o.reg,
  org_country: o.country,
  org_field: o.field,
  org_description: o.about,
  org_contact_name: o.contactName,
  org_contact_email: o.email,
  org_contact_phone: o.contactPhone,
  org_size: o.size,
  org_submitted_at: daysAgo(21),
  org_reviewed_at: o.approval === 'pending' ? null : daysAgo(14),
  org_review_note: o.reviewNote ?? null,
  profile_status: 'Approved',
}));
const peopleProfiles = PEOPLE.map((p) => ({
  id: ids[p.key],
  display_name: p.name,
  email: p.email,
  profile_type: 'Individual',
  account_type: 'individual',
  onboarding_complete: true,
  approval_status: 'not_required',
  country: p.key === 'sarah' || p.key === 'david' ? 'Israel' : 'Israel',
  location: p.location,
  about: p.about,
  skills: p.skills,
  profile_status: 'Approved',
}));
// PostgREST bulk upserts require every row in a batch to carry the SAME key
// set (PGRST102) — orgs and individuals have different columns, so they go in
// two batches.
await upsert('glowe_profiles', orgProfiles, 'id');
await upsert('glowe_profiles', peopleProfiles, 'id');
console.log(`profiles upserted: ${orgProfiles.length + peopleProfiles.length}`);

// ── 4. Opportunities (incl. events) ──────────────────────────────────────────
const OPPS = [
  { id: 'seed-opp-food-baskets', key: 'levpatuach', title: 'מתנדבים לאריזת סלי מזון', field: 'Food Security', commitment: 'Flexible', location: 'יפו', duration: '3 שעות בשבוע', description: 'אריזת סלי מזון במרכז הלוגיסטי שלנו בימי שלישי וחמישי בערב. עבודה בצוות, אווירה משפחתית, מתאים גם למשפחות עם ילדים מגיל 10.', skills: ['עבודת צוות'], created: 12 },
  { id: 'seed-opp-food-delivery', key: 'levpatuach', title: 'נהגים לחלוקת סלים למשפחות', field: 'Food Security', commitment: 'Flexible', location: 'גוש דן', duration: 'שעתיים בשבוע', description: 'חלוקת סלי מזון לבתי משפחות בגוש דן ברכב פרטי. מסלול קבוע של 6-8 כתובות, פעם בשבוע ביום שישי בבוקר.', skills: ['רכב פרטי', 'אמינות'], created: 10 },
  { id: 'seed-opp-mentoring', key: 'gsharim', title: 'חונכים אישיים לילדי הנגב', field: 'Education', commitment: 'Part-time', location: 'באר שבע', duration: 'שעתיים בשבוע, שנה מלאה', description: 'ליווי אישי של חניך אחד לאורך שנת לימודים: עזרה בשיעורי בית, משחק ושיחה. הכשרה מלאה וליווי מקצועי לאורך הדרך. נדרשת התחייבות לשנה.', skills: ['סבלנות', 'עברית שוטפת'], created: 20 },
  { id: 'seed-opp-code-mentor', key: 'code4good', title: 'מנטורים למתכנתים מתחילים מהפריפריה', field: 'Tech for Good', commitment: 'Project-based', location: 'מרחוק', duration: 'שעה בשבוע', description: 'ליווי אישי אונליין של סטודנטים ובוגרי הסבות מהפריפריה בצעדיהם הראשונים בתעשייה: קוד ריוויו, הכנה לראיונות ובניית תיק עבודות.', skills: ['ניסיון בפיתוח', 'JavaScript', 'Python'], created: 8 },
  { id: 'seed-opp-ngo-website', key: 'code4good', title: 'מפתחי ווב לאתר עמותה', field: 'Tech for Good', commitment: 'Project-based', location: 'מרחוק', duration: 'פרויקט של חודשיים', description: 'בניית אתר תדמית + טופס תרומות לעמותה קטנה בתחום בעלי החיים. צוות של 3 מתנדבים, פגישת סטטוס שבועית בזום.', skills: ['React', 'CSS'], created: 5 },
  { id: 'seed-opp-translation', key: 'gsharim', title: 'English translators for parent guides', field: 'Education', commitment: 'Project-based', location: 'Remote', duration: '10 hours total', description: 'Translate our Hebrew parent-guidance booklets into English for immigrant families. Six short booklets, flexible schedule, editorial support provided.', skills: ['Translation', 'English', 'Hebrew'], created: 4 },
  { id: 'seed-opp-elderly-rides', key: 'levpatuach', title: 'ליווי קשישים לקניות שבועיות', field: 'Community', commitment: 'Flexible', location: 'תל אביב-יפו', duration: 'שעתיים בשבוע', description: 'ליווי קשיש קבוע לקניות בסופר השכונתי אחת לשבוע. יותר משליחות — זו חברות. אפשר לבחור שכונה קרובה לבית.', skills: ['סבלנות', 'חום אנושי'], created: 3 },
  // Events (start_at set): a beach cleanup and an online hackathon kickoff.
  { id: 'seed-event-beach-cleanup', key: 'yarokbalev', title: 'ניקיון חוף דדו הגדול', field: 'Climate', commitment: 'Event', location: 'חוף דדו, חיפה', duration: 'בוקר אחד', description: 'ניקיון החוף המרכזי של חיפה לקראת הקיץ. כפפות ושקיות מסופקות, מסתיימים בארוחת בוקר קהילתית על הדשא. מתאים לכל הגילאים.', skills: [], start: 14, end: 14.2, eventType: 'physical', regMode: 'open', capacity: 150, created: 9 },
  { id: 'seed-event-hackathon', key: 'code4good', title: 'האקתון קוד למען הקהילה 2026', field: 'Tech for Good', commitment: 'Event', location: 'Online', duration: 'סוף שבוע', description: 'סוף שבוע של בניית פתרונות טכנולוגיים לחמש עמותות נבחרות. צוותים של 4-6, מנטורים מהתעשייה, דמו ביום ראשון בערב. ההשתתפות מרחוק.', skills: ['פיתוח', 'עיצוב', 'ניהול מוצר'], start: 30, end: 32, eventType: 'digital', regMode: 'gated', capacity: 80, created: 7 },
  { id: 'seed-event-compost', key: 'yarokbalev', title: 'סדנת קומפוסט קהילתית', field: 'Climate', commitment: 'Event', location: 'הגינה הקהילתית, רמות רמז חיפה', duration: 'שעתיים', description: 'סדנה מעשית להקמת קומפוסטר ביתי: תיאוריה קצרה, הרכבה משותפת וטיפים לתחזוקה. כל משתתף חוזר הביתה עם תוכנית עבודה.', skills: [], start: 7, end: 7.1, eventType: 'physical', regMode: 'open', capacity: 25, created: 6 },
];
await upsert('glowe_opportunities', OPPS.map((o) => ({
  id: o.id,
  user_id: ids[o.key],
  title: o.title,
  organization: ORGS.find((x) => x.key === o.key)?.orgName ?? 'GloWe',
  field: o.field,
  commitment: o.commitment,
  location: o.location,
  duration: o.duration,
  description: o.description,
  skills: o.skills,
  requirements: [],
  responsibilities: [],
  featured: ['seed-opp-mentoring', 'seed-event-beach-cleanup'].includes(o.id),
  created_at: daysAgo(o.created),
  // Event columns are always present so every row in the batch carries the
  // same key set (PGRST102); plain opportunities keep them null.
  start_at: o.start ? daysAhead(o.start) : null,
  end_at: o.end ? daysAhead(o.end) : null,
  event_type: o.eventType ?? null,
  registration_mode: o.regMode ?? 'gated',
  capacity: o.capacity ?? null,
})), 'id');
console.log(`opportunities upserted: ${OPPS.length}`);

// ── 5. Posts: wishes, offers, community ──────────────────────────────────────
const POSTS = [
  // Wishes (needs board)
  { id: 'seed-wish-fridge', key: 'levpatuach', type: 'wish', wishType: 'Equipment / Space', area: 'Food Security', title: 'דרוש מקרר תעשייתי למרכז החלוקה', text: 'המקרר התעשייתי שלנו התקלקל סופית והתיקון יקר מערכו. נשמח לתרומה של מקרר תעשייתי יד שנייה במצב עבודה, או לסיוע במימון חדש. יש לנו הובלה.', created: 6 },
  { id: 'seed-wish-holiday-volunteers', key: 'levpatuach', type: 'wish', wishType: 'Volunteers Needed', area: 'Food Security', title: 'מתנדבים לחלוקת סלי חג', text: 'לקראת החג אנחנו מכפילים את מספר הסלים ל-600 משפחות. דרושים 40 מתנדבים לאריזה ביום רביעי שלפני החג ו-25 נהגים לחלוקה ביום חמישי.', created: 2 },
  { id: 'seed-wish-lecture', key: 'gsharim', type: 'wish', wishType: 'Looking for Mentors', area: 'Education', title: 'מרצה בהתנדבות: ביטחון ברשת לנוער', text: 'מחפשים מרצה שיעביר לחניכי התוכנית הרצאה על התנהלות בטוחה ברשתות חברתיות. קהל של 60 בני נוער בבאר שבע, אמצע נובמבר.', created: 5 },
  { id: 'seed-wish-garden-partners', key: 'yarokbalev', type: 'wish', wishType: 'Partnership Opportunity', area: 'Community Building', title: 'שותפים להקמת גינה קהילתית בהדר', text: 'קיבלנו מהעירייה שטח של דונם בשכונת הדר. מחפשים ארגון שותף עם ניסיון בהפעלת גינות קהילתיות, וכן תרומות של אדניות וכלי גינון.', created: 9 },
  { id: 'seed-wish-website-help', key: 'yadtomehet', type: 'wish', wishType: 'Call for Help', area: 'Tech for Good', title: 'עזרה בהקמת אתר לעמותה חדשה', text: 'אנחנו עמותה חדשה לליווי קשישים ואין לנו עדיין אתר. מחפשים מתנדב/ת שיקים לנו אתר פשוט עם טופס יצירת קשר ומידע על השירותים.', created: 4 },
  { id: 'seed-wish-sports-gear', key: 'gsharim', type: 'wish', wishType: 'Resource Request', area: 'Education', title: 'ציוד ספורט לנוער בסיכון', text: 'פותחים חוג כדורסל לחניכים ברהט. דרושים: 15 כדורי כדורסל, מחסומי אימון ו-20 סטים של אפודות. גם ציוד משומש במצב טוב יתקבל בשמחה.', created: 8 },
  { id: 'seed-wish-hotline', key: 'yadtomehet', type: 'wish', wishType: 'Volunteers Needed', area: 'Health', title: 'מתנדבים לקו חם לקשישים בודדים', text: 'הקו החם שלנו פועל בין 16:00 ל-20:00. דרושים מתנדבים למשמרת שבועית קבועה של שעתיים — שיחה חמה עם קשישים שמחכים לה כל השבוע. הכשרה מסופקת.', created: 3 },
  { id: 'seed-wish-english-mentors', key: 'gsharim', type: 'wish', wishType: 'Looking for Mentors', area: 'Education', title: 'Looking for English-speaking mentors', text: 'Several of our mentees are children of English-speaking immigrant families in Beer Sheva. We are looking for English-speaking mentors for weekly one-on-one sessions.', created: 7 },
  { id: 'seed-wish-winter-clothes', key: 'levpatuach', type: 'wish', wishType: 'Resource Request', area: 'Community Building', title: 'בגדים חמים לחורף למשפחות', text: 'אוספים מעילים, סוודרים ושמיכות במצב טוב לקראת החורף. נקודות איסוף ביפו ובחולון, או איסוף מהבית בתיאום מראש לתרומות גדולות.', created: 1 },
  // Volunteer offers (FR-GLOWE-016, post_type='offer')
  { id: 'seed-offer-design', key: 'michal', type: 'offer', area: 'Community Building', title: 'מעצבת גרפית מציעה עזרה בעיצוב', text: 'מעצבת עצמאית עם 8 שנות ניסיון. אשמח לעצב בהתנדבות פוסטר, לוגו או קמפיין גיוס לעמותה קטנה. עד שני פרויקטים בחודש.', created: 5 },
  { id: 'seed-offer-driver', key: 'avi', type: 'offer', area: 'Food Security', title: 'נהג עם משאית מציע הובלות לעמותות', text: 'יש לי משאית 12 טון ורישיון מתאים. פנוי בימי שישי בבוקר להובלות של ציוד, ריהוט או מזון עבור עמותות באזור הדרום והמרכז.', created: 11 },
  // Community posts
  { id: 'seed-post-success-story', key: 'gsharim', type: 'community', category: 'Success Story', title: 'איך 40 חונכים שינו שנה שלמה לילדי רהט', text: 'לפני שנה יצאנו לדרך עם קבוצת החונכים הראשונה ברהט. היום, בסוף שנת הפעילות, 87% מהחניכים שיפרו את הציונים בקריאה — אבל הנתון שאנחנו הכי גאים בו: כל ה-40 נרשמו לשנה נוספת. תודה ענקית לכל החונכים והשותפים.', tags: ['חינוך', 'חונכות', 'נגב'], created: 6 },
  { id: 'seed-post-recruiting-guide', key: 'hila', type: 'community', category: 'Professional Guide', title: 'מדריך קצר: איך לגייס מתנדבים שנשארים', text: 'אחרי עשרות תהליכי ליווי, אלו חמשת העקרונות שעובדים: 1) תפקיד מוגדר עם גבולות זמן ברורים. 2) חניכה אישית בחודש הראשון. 3) וואטסאפ קבוצתי חי אבל לא מציף. 4) הוקרה פומבית אחת לרבעון. 5) שיחת משוב אחרי חצי שנה. מוזמנים לשאול בתגובות.', tags: ['גיוס מתנדבים', 'ניהול'], created: 4 },
  { id: 'seed-post-field-update', key: 'levpatuach', type: 'community', category: 'Knowledge Share', title: 'עדכון מהשטח: 520 סלים חולקו החודש', text: 'חודש שיא במרכז החלוקה שלנו: 520 סלי מזון, 38 מתנדבים חדשים ושיתוף פעולה חדש עם רשת שיווק שתורמת עודפי ירקות מדי שבוע. הביקוש ממשיך לעלות — אם אתם מכירים משפחה שזקוקה לסיוע, הפנו אותה אלינו.', tags: ['ביטחון תזונתי'], created: 2 },
  { id: 'seed-post-webinar', key: 'code4good', type: 'community', category: 'Event / Webinar', title: 'וובינר: בינה מלאכותית לעמותות — ממה להתחיל', text: 'ביום שלישי הבא ב-20:00 נארח וובינר חינמי על שימושים מעשיים ב-AI לעמותות: כתיבת בקשות מימון, סיכום פגישות ואוטומציה של דוחות. הקישור יישלח לנרשמים.', tags: ['AI', 'טכנולוגיה'], created: 3 },
  { id: 'seed-post-sustainability', key: 'yarokbalev', type: 'community', category: 'Knowledge Share', title: 'מה למדנו משנה של גינות קהילתיות', text: 'שלוש תובנות משלוש גינות שהקמנו השנה: הצלחה תלויה בגרעין של 5 מתנדבים קבועים לפחות; השקיה אוטומטית שווה כל שקל; ואירוע פתיחה שכונתי מביא פי שלושה מתנדבים מכל קמפיין פייסבוק.', tags: ['קיימות', 'קהילה'], created: 8 },
  { id: 'seed-post-question', key: 'tamar', type: 'community', category: 'Community Discussion', title: 'איך אתם שומרים על מתנדבים מקווים חמים משחיקה?', text: 'אני מתנדבת בקו חם כשנתיים ומרגישה שהעומס הרגשי מצטבר. אשמח לשמוע מארגונים אחרים: אילו מנגנוני תמיכה יש אצלכם למתנדבים? הדרכות? שיחות פריקה?', tags: ['בריאות נפשית', 'מתנדבים'], created: 1 },
  { id: 'seed-post-volunteer-culture', key: 'sarah', type: 'community', category: 'Community Discussion', title: 'What surprised me about volunteering culture in Israel', text: 'Coming from the UK, three things amazed me: how fast organizations respond to offers of help, how informal the onboarding is, and how much happens through WhatsApp groups. Curious how others experienced this — what should newcomers know?', tags: ['community', 'volunteering'], created: 5 },
  { id: 'seed-post-photo-tips', key: 'elia', type: 'community', category: 'Professional Guide', title: 'חמישה טיפים לצילום אירועי התנדבות', text: 'תיעוד טוב שווה זהב לגיוס משאבים. הטיפים שלי: צלמו ידיים עובדות ולא רק חיוכים למצלמה; תפסו רגעים בין אנשים; בקשו אישור צילום מראש; צלמו לפני-אחרי; ותנו לעמותה גם תמונות אנכיות לסטוריז.', tags: ['צילום', 'שיווק'], created: 10 },
];
await upsert('glowe_posts', POSTS.map((p) => ({
  id: p.id,
  user_id: ids[p.key],
  author_name: [...ORGS, ...PEOPLE].find((x) => x.key === p.key)?.name ?? 'GloWe',
  title: p.title,
  text: p.text,
  category: p.category ?? (p.type === 'wish' ? 'wish' : p.type),
  tags: p.tags ?? [],
  post_type: p.type,
  wish_type: p.wishType ?? null,
  impact_area: p.area ?? null,
  status: 'open',
  created_at: daysAgo(p.created),
})), 'id');
console.log(`posts upserted: ${POSTS.length}`);

// ── 6. Comments on community posts ───────────────────────────────────────────
const COMMENTS = [
  { id: '5eedc001-0000-4000-8000-000000000001', post: 'seed-post-recruiting-guide', key: 'levpatuach', text: 'מדריך מעולה! את סעיף 2 אימצנו אחרי שאיבדנו עשרה מתנדבים בחודש הראשון. מאז ההתמדה קפצה.' },
  { id: '5eedc002-0000-4000-8000-000000000002', post: 'seed-post-recruiting-guide', key: 'naama', text: 'מסכימה עם כל מילה. הייתי מוסיפה: לשאול את המתנדב מה *הוא* רוצה לקבל מההתנדבות, לא רק מה הארגון צריך.' },
  { id: '5eedc003-0000-4000-8000-000000000003', post: 'seed-post-question', key: 'yadtomehet', text: 'אצלנו כל מתנדבת קו חם מקבלת שיחת פריקה חודשית עם עובדת סוציאלית. זה חובה, לא רשות — וזה משנה הכול.' },
  { id: '5eedc004-0000-4000-8000-000000000004', post: 'seed-post-question', key: 'hila', text: 'ממליצה גם על הפסקת התנדבות יזומה של חודש אחרי שנה — מי שחוזר, חוזר חזק יותר.' },
  { id: '5eedc005-0000-4000-8000-000000000005', post: 'seed-post-success-story', key: 'michal', text: 'מרגש! אם תרצו פוסטר מסכם לשנת הפעילות — אשמח לעצב בהתנדבות.' },
  { id: '5eedc006-0000-4000-8000-000000000006', post: 'seed-post-volunteer-culture', key: 'david', text: 'Same experience here! The WhatsApp part is real — join the groups early, that is where everything actually happens.' },
  { id: '5eedc007-0000-4000-8000-000000000007', post: 'seed-post-webinar', key: 'yossi', text: 'נשמע מעולה, נרשמתי. יהיה גם ווידאו למי שמפספס?' },
  { id: '5eedc008-0000-4000-8000-000000000008', post: 'seed-post-field-update', key: 'ruth', text: 'כל הכבוד! אני מגיעה לאריזות כל שלישי — מוזמנים להצטרף, האווירה נהדרת.' },
];
await upsert('glowe_comments', COMMENTS.map((c) => ({
  id: c.id,
  post_id: c.post,
  user_id: ids[c.key],
  author_name: [...ORGS, ...PEOPLE].find((x) => x.key === c.key)?.name ?? 'GloWe',
  text: c.text,
  created_at: daysAgo(1),
})), 'id');

// ── 7. Forum threads + replies ───────────────────────────────────────────────
const THREADS = [
  { id: 'seed-thread-homework', group: 'education', key: 'naama', title: 'רעיונות לפעילות חונכות בחופש הגדול', body: 'החניכים שלי משתעממים מדפי עבודה. אילו פעילויות קיץ עבדו לכם בחונכות אישית? מחפשת רעיונות שמשלבים למידה בלי שזה ירגיש כמו בית ספר.', created: 6 },
  { id: 'seed-thread-materials', group: 'education', key: 'gsharim', title: 'חומרי לימוד פתוחים בעברית — אוסף משותף', body: 'פותחים כאן שרשור לאיסוף חומרי לימוד חינמיים בעברית: אתרים, ערכות ומצגות. נעדכן את הרשימה בהודעה הראשונה. תרמו קישורים!', created: 12 },
  { id: 'seed-thread-beach', group: 'environment', key: 'yarokbalev', title: 'תיאום ניקיונות חופים לקיץ 2026', body: 'בואו נתאם לוח ניקיונות משותף לכל הארגונים הסביבתיים בצפון כדי לא להתנגש בתאריכים ולחלוק ציוד. מי בפנים?', created: 9 },
  { id: 'seed-thread-compost', group: 'environment', key: 'omer', title: 'קומפוסטר שכונתי — שאלות של מתחיל', body: 'השכונה שלנו קיבלה אישור להציב קומפוסטר קהילתי. ממה מתחילים? כמה תחזוקה זה באמת דורש? אשמח לשמוע מניסיון.', created: 4 },
  { id: 'seed-thread-hotline-support', group: 'health', key: 'tamar', title: 'תמיכה רגשית למתנדבי קווים חמים', body: 'ממשיכה כאן את הדיון מהפיד: בואו נאסוף פרקטיקות לתמיכה במתנדבים שנמצאים בקו הראשון של מצוקה רגשית.', created: 3 },
  { id: 'seed-thread-rights-workshop', group: 'rights', key: 'hila', title: 'סדנת זכויות דיירים — מחפשים מנחים', body: 'מארגנים סדרת סדנאות על זכויות דיירים בדיור הציבורי. מחפשים עורכי דין או יועצים שיתנדבו להנחות מפגש אחד.', created: 7 },
];
await upsert('glowe_forum_threads', THREADS.map((t) => ({
  id: t.id, group_id: t.group, user_id: ids[t.key], title: t.title, body: t.body, created_at: daysAgo(t.created),
})), 'id');

const REPLIES = [
  { id: 'seed-reply-01', thread: 'seed-thread-homework', key: 'gsharim', body: 'אצלנו עבד מצוין "פרויקט קיץ" — החניך בוחר נושא שמעניין אותו וחוקר אותו עם החונך לאורך החופש, ובסוף מציג למשפחה.' },
  { id: 'seed-reply-02', thread: 'seed-thread-homework', key: 'ruth', body: 'בישול משותף! מתכון הוא גם קריאה, גם מתמטיקה וגם כיף. עובד עם כל גיל.' },
  { id: 'seed-reply-03', thread: 'seed-thread-beach', key: 'sarah', body: 'Happy to help coordinate an English-speakers group for one of the cleanups — many newcomers are looking for exactly this.' },
  { id: 'seed-reply-04', thread: 'seed-thread-beach', key: 'elia', body: 'אשמח לתעד את הניקיונות בצילום. תמונות לפני-אחרי עושות פלאים לגיוס מתנדבים לפעם הבאה.' },
  { id: 'seed-reply-05', thread: 'seed-thread-compost', key: 'yarokbalev', body: 'מניסיון של שלוש גינות: ההשקעה הגדולה היא בחודש הראשון. אחרי שיש שגרת הפיכה שבועית, זה רבע שעה בשבוע. מוזמן לסדנה שלנו בעוד שבוע!' },
  { id: 'seed-reply-06', thread: 'seed-thread-hotline-support', key: 'yadtomehet', body: 'שיתפנו בשרשור המקורי — שיחת פריקה חודשית חובה. מוסיפה כאן: גם קבוצת ווטסאפ סגורה רק למתנדבי הקו, בלי מנהלים, עוזרת מאוד.' },
  { id: 'seed-reply-07', thread: 'seed-thread-materials', key: 'naama', body: 'מוסיפה את מאגר החומרים של מטח — פתוח וחינמי לשימוש לא מסחרי.' },
];
await upsert('glowe_forum_replies', REPLIES.map((r, i) => ({
  id: r.id, thread_id: r.thread, user_id: ids[r.key], body: r.body, created_at: daysAgo(2 - i * 0.1),
})), 'id');
console.log(`forum: ${THREADS.length} threads, ${REPLIES.length} replies`);

// ── 8. Applications (volunteer + event RSVPs) ────────────────────────────────
const APPLICATIONS = [
  { id: '5eeda001-0000-4000-8000-000000000001', key: 'yossi', opp: 'seed-opp-code-mentor', availability: 'ערבים אחרי 19:00', skills: 'JavaScript, Python, לומד React', motivation: 'רוצה לצבור ניסיון אמיתי ולעזור למי שמתחיל כמוני לפני שנתיים.', status: 'Pending' },
  { id: '5eeda002-0000-4000-8000-000000000002', key: 'ruth', opp: 'seed-opp-food-baskets', availability: 'בקרים, ימים א-ה', skills: 'ניסיון בארגון מטבחים גדולים', motivation: 'רוצה לתת מהזמן הפנוי שלי למשהו עם משמעות.', status: 'Accepted' },
  { id: '5eeda003-0000-4000-8000-000000000003', key: 'naama', opp: 'seed-opp-mentoring', availability: 'אחר הצהריים', skills: 'מורה לחינוך מיוחד', motivation: 'חונכות היא הלב של העבודה שלי — אשמח ללוות חניך גם מחוץ לכיתה.', status: 'Accepted' },
  { id: '5eeda004-0000-4000-8000-000000000004', key: 'david', opp: 'seed-opp-translation', availability: 'Flexible, ~5h/week', skills: 'Professional EN/HE translator', motivation: 'This is exactly what I do professionally — happy to donate the hours.', status: 'Pending' },
  { id: '5eeda005-0000-4000-8000-000000000005', key: 'michal', opp: 'seed-event-hackathon', availability: '', skills: 'עיצוב UX/UI', motivation: 'רוצה להצטרף כמעצבת לאחד הצוותים.', status: 'Pending' },
  { id: '5eeda006-0000-4000-8000-000000000006', key: 'omer', opp: 'seed-event-beach-cleanup', availability: '', skills: '', motivation: 'מגיע עם שני הילדים!', status: 'Accepted' },
];
await upsert('glowe_applications', APPLICATIONS.map((a) => ({
  id: a.id, user_id: ids[a.key], opportunity_id: a.opp,
  availability: a.availability, skills: a.skills, motivation: a.motivation,
  status: a.status, created_at: daysAgo(2),
})), 'id');

// ── 9. Offers on wishes ──────────────────────────────────────────────────────
const WISH_OFFERS = [
  { id: '5eedb001-0000-4000-8000-000000000001', key: 'daniel', post: 'seed-wish-website-help', text: 'Offering: בניית אתר\n\nאני מפתח בכיר ואשמח להקים לכם אתר פשוט על תשתית חינמית, כולל טופס יצירת קשר. אפשר להתחיל השבוע.', availability: 'ערבים וסופ"ש' },
  { id: '5eedb002-0000-4000-8000-000000000002', key: 'avi', post: 'seed-wish-fridge', text: 'Offering: הובלה\n\nאם תמצאו מקרר תרומה — ההובלה עליי, כולל צוות פריקה.', availability: 'ימי שישי' },
  { id: '5eedb003-0000-4000-8000-000000000003', key: 'naama', post: 'seed-wish-english-mentors', text: 'Offering: חונכות באנגלית\n\nאני מורה ודוברת אנגלית שוטפת. אשמח לחנוך חניך אחד במפגש שבועי מקוון.', availability: 'ימי שלישי אחה"צ' },
  { id: '5eedb004-0000-4000-8000-000000000004', key: 'tamar', post: 'seed-wish-hotline', text: 'Offering: משמרת שבועית\n\nאחות במקצועי עם ניסיון בקו חם. יכולה לקחת משמרת קבועה ביום רביעי.', availability: 'רביעי 16:00-18:00' },
];
await upsert('glowe_offers', WISH_OFFERS.map((o) => ({
  id: o.id, user_id: ids[o.key], post_id: o.post,
  offer_text: o.text, availability: o.availability, contact_preference: 'In-app message',
  created_at: daysAgo(1),
})), 'id');

// ── 10. Saved items ──────────────────────────────────────────────────────────
const SAVED = [
  { key: 'michal', type: 'wish', item: 'seed-wish-lecture', title: 'מרצה בהתנדבות: ביטחון ברשת לנוער' },
  { key: 'michal', type: 'opportunity', item: 'seed-event-hackathon', title: 'האקתון קוד למען הקהילה 2026' },
  { key: 'yossi', type: 'opportunity', item: 'seed-opp-code-mentor', title: 'מנטורים למתכנתים מתחילים מהפריפריה' },
  { key: 'sarah', type: 'wish', item: 'seed-wish-english-mentors', title: 'Looking for English-speaking mentors' },
  { key: 'ruth', type: 'profile', item: 'levpatuach', profileOf: 'levpatuach', title: 'לב פתוח' },
];
await upsert('glowe_saved_items', SAVED.map((s) => ({
  user_id: ids[s.key],
  item_type: s.type,
  item_id: s.profileOf ? ids[s.profileOf] : s.item,
  title: s.title,
  meta: '',
  href: '',
})), 'user_id,item_type,item_id');

// ── 11. Moderation reports (FR-GLOWE-015) ────────────────────────────────────
// One open report for the admin queue + one already dismissed.
await upsert('glowe_reports', [
  {
    id: '5eedd001-0000-4000-8000-000000000001',
    reporter_id: ids.tamar,
    target_type: 'post', target_id: 'seed-post-photo-tips',
    reason: 'other', note: 'נראה לי שהפוסט הזה שייך יותר לפורום מאשר לפיד — לשיקולכם.',
    status: 'open', reviewed_at: null,
  },
  {
    id: '5eedd002-0000-4000-8000-000000000002',
    reporter_id: ids.omer,
    target_type: 'post', target_id: 'seed-post-webinar',
    reason: 'spam', note: '',
    status: 'dismissed', reviewed_at: daysAgo(1),
  },
], 'id');

// ── 12. Direct chats + messages (KC shared backend, FR-GLOWE-016 AC6) ────────
async function ensureChat(keyA, keyB) {
  const [a, b] = ids[keyA] < ids[keyB] ? [ids[keyA], ids[keyB]] : [ids[keyB], ids[keyA]];
  const existing = await rest(`chats?participant_a=eq.${a}&participant_b=eq.${b}&is_support_thread=eq.false&select=chat_id`);
  if (existing && existing.length) return existing[0].chat_id;
  const created = await rest('chats', {
    method: 'POST',
    body: { participant_a: a, participant_b: b },
    prefer: 'return=representation',
  });
  return created[0].chat_id;
}

const CHATS = [
  {
    a: 'michal', b: 'levpatuach', messages: [
      ['michal', 'היי! ראיתי את הפוסט על סלי החג. אני מעצבת גרפית — רוצים פוסטר לגיוס המתנדבים?'],
      ['levpatuach', 'מיכל, זה יהיה מדהים! אנחנו צריכים משהו לפייסבוק ולקבוצות הוואטסאפ עד יום ראשון.'],
      ['michal', 'סגור. שלחו לי את הלוגו ואת פרטי האירוע ואחזור אליכם עם סקיצה עד מחר בערב.'],
    ],
  },
  {
    a: 'avi', b: 'yarokbalev', messages: [
      ['avi', 'שלום, יש לי משאית 12 טון. צריכים עזרה בהובלת ציוד לניקיון החוף?'],
      ['yarokbalev', 'אבי אתה מלאך! יש לנו 40 ערכות ניקיון במחסן בקריות שצריכות להגיע לחוף דדו בבוקר האירוע.'],
    ],
  },
  {
    a: 'naama', b: 'gsharim', messages: [
      ['naama', 'Re: מחפשים חונכים אישיים\n\nשלום, אני מורה לחינוך מיוחד מירושלים ואשמח להצטרף לתוכנית.'],
      ['gsharim', 'נעמה, איזה כיף! עם הרקע שלך נשמח לשבץ אותך עם חניך שצריך ליווי מותאם. מתי נוח לשיחת היכרות?'],
      ['naama', 'ימי שלישי או חמישי אחרי 16:00. מחכה לשמוע מכם!'],
    ],
  },
  {
    a: 'daniel', b: 'yadtomehet', messages: [
      ['daniel', 'Re: עזרה בהקמת אתר לעמותה\n\nשלחתי לכם הצעה דרך הבאר — בואו נקבע שיחה קצרה להגדיר מה צריך.'],
    ],
  },
  {
    a: 'sarah', b: 'david', messages: [
      ['sarah', 'Hi David! Saw your translation offer — we might need EN subtitles for a fundraising video. Interested?'],
      ['david', 'Sounds fun. Send me the video length and deadline and I will confirm.'],
    ],
  },
];

for (const chat of CHATS) {
  const chatId = await ensureChat(chat.a, chat.b);
  const existing = await rest(`messages?chat_id=eq.${chatId}&select=message_id&limit=1`);
  if (existing && existing.length) continue; // already seeded
  let minutes = chat.messages.length * 30;
  for (const [senderKey, body] of chat.messages) {
    await rest('messages', {
      method: 'POST',
      body: {
        chat_id: chatId,
        sender_id: ids[senderKey],
        kind: 'user',
        status: 'pending',
        body,
        created_at: new Date(Date.now() - minutes * 60 * 1000).toISOString(),
      },
      prefer: 'return=minimal',
    });
    minutes -= 30;
  }
  console.log(`chat ${chat.a} ↔ ${chat.b}: ${chat.messages.length} messages`);
}

// ── 13. Reset the review-flow fixture ────────────────────────────────────────
// יד תומכת stays 'pending' so the admin approval flow always has a live case
// (E2E may approve it; the next seed run resets it).
await rest(`glowe_profiles?id=eq.${ids.yadtomehet}`, {
  method: 'PATCH',
  body: { approval_status: 'pending', org_reviewed_at: null, org_reviewed_by: null, org_review_note: null },
  prefer: 'return=minimal',
});

console.log('✓ GloWe dev seed complete.');
console.log(`  Personas sign in with the seed password (GLOWE_SEED_PASSWORD${process.env.GLOWE_SEED_PASSWORD ? ' from env' : ' default'}).`);
