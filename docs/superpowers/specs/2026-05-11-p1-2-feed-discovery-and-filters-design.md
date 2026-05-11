# P1.2 — Feed Discovery & Filters Design Spec

> תאריך: 2026-05-11 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש · FR refs: FR-FEED-004 (rework), FR-FEED-005 (extend), FR-FEED-006 (Haversine), FR-FEED-008 (extend), FR-FEED-009, FR-FEED-010, FR-FEED-014 (extend), FR-FEED-015 (rework), FR-FEED-016 (supersede), FR-FEED-018 (new), FR-FEED-019 (new). Deprecations: FR-FEED-003, FR-FEED-007, FR-FEED-013.

## 1 — בעיה ומטרה

הסכמה של פוסטים, follow-edges, blocks ו-RLS עובדים מקצה לקצה מאז P0.4. ה-`IPostRepository.getFeed` כבר תומך ב-shape פילטרים מלא, ה-`filterStore` מוגדר ב-Zustand, וה-view `community_stats` יושב במיגרציה 0006. אבל ה-Home Feed הראשי (`/(tabs)/index.tsx`) שולח `filter: {}` ולא צורך אף אחד מהמנגנונים הללו — אין סינון, אין מיון, אין realtime, אין refresh ידני, אין empty state חם, אין מונה קהילה, אין first-post nudge. TD-26 מתאר את הפער הזה כ-🔴.

המטרה: להפוך את ה-Home Feed למסך גילוי שלם — אייקון פילטר/מיון ב-TopBar שפותח גיליון משותף עם הלשונית האוניברסלית, מיון Haversine לפי כתובת, סינון רב-ממדי, realtime freshness, refresh affordances, empty state עם CTAs, ומונה קהילה חי במקומות שמשמעותיים. נכיל גם first-post nudge עם רמות-dismiss מדורגות, ונסגור את TD-26, TD-102, TD-133 בדרך.

## 2 — החלטות (מתוך ה-brainstorming)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | פער בין הלשונית האוניברסלית הקיימת לבין FR-FEED-003/016 המקוריים | הלשונית נשארת כפי שהיא. ה-SRS מתעדכן לתאר את מה שעובד בפועל. הפיד הראשי לא יקבל שורת חיפוש — רק אייקון פילטר ב-TopBar שפותח Bottom-Sheet. |
| Q2 | מנגנון בחירת מיון בפיד | אייקון `options-outline` ב-TopBar (שמאל), מוצג רק במסך הפיד, פותח Bottom-Sheet עם 3 אפשרויות מיון + סינון מלא. תג ספירה אדום על האייקון אם יש פילטרים פעילים. |
| Q3 | תכולת ה-Bottom-Sheet | סוג / קטגוריות (מולטי) / מצב מוצר / עיר+רדיוס / סטטוס 3-מצבי / מיון 3-אפשרויות. **כמה שיותר אפשרויות**. |
| Q4 | משמעות המיון "לפי מיקום" | מרחק Haversine בין כתובות. כל הפוסטים מסודרים מהקרוב לרחוק. **לא** בקבצוצים לפי עיר ו**לא** עם באנרים-מפרידים. |
| Q5 | הצורך ב-Cold-start fallback (FR-FEED-007 המקורי) | מבוטל. המיון לפי מיקום ממילא מטפל בעיר דלילה — הפוסטים הקרובים-יותר ממשיכים אחרי הקרובים-ביותר. |
| Q6 | First-post nudge — UX של dismiss | שלוש פעולות במקום שתיים: "שתף מוצר" (CTA) / "תזכיר לי אחר כך" (סשן) / "אל תציג לי שוב" (קבוע, DB flag). |
| Q7 | מיקום שבב "פילטרים פעילים" | מוסר מהפיד. ספירת הפילטרים נראית רק כתג אדום על אייקון ה-TopBar. תוכן הפילטרים גלוי בתוך הגיליון עצמו. |
| Q8 | שיתוף ה-Filter Sheet עם הלשונית האוניברסלית | רכיב משותף `<PostFilterSheet>` ב-`@kc/ui`. הלשונית מחליפה את `SearchFilterSheet` בו. סוגר TD-133 דרך פיצול הקבצים. |

## 3 — סקופ

### 3.1 In

- **DB:** מיגרציה חדשה ל-`cities_geo` (lookup table + seed פעם אחת מנתוני הלמ"ס), מיגרציה חדשה ל-`users.first_post_nudge_dismissed`, מיגרציה חדשה ל-RPC `feed_with_distance`.
- **Domain:** הרחבת `FeedFilter` (`sortOrder`, `locationFilter`, `statusFilter`, `proximitySortCity`). הוספת `User.firstPostNudgeDismissed`.
- **Application:** הרחבת `PostFeedFilter` בפורט. פורטים חדשים: `IFeedRealtime`, `IStatsRepository`. שני use cases חדשים: `GetActivePostsCountUseCase`, `DismissFirstPostNudgeUseCase`. עדכון `GetFeedUseCase` ל-shape החדש (עם validation).
- **Infrastructure:** `SupabaseFeedRealtime` חדש, `SupabaseStatsRepository` חדש, עדכון `SupabasePostRepository.getFeed` לקרוא ל-RPC, פיצול `SupabaseSearchRepository`.
- **UI (`@kc/ui`):** רכיב משותף `<PostFilterSheet>` מבוזר ל-4 קבצים תחת `packages/ui/src/PostFilterSheet/`.
- **Mobile app:** רכיבי mobile חדשים — `NewPostsBanner`, `FirstPostNudge`, `FeedCommunityCounter`. עדכון `TopBar` ל-`rightSlot`. חיווט מלא ב-`(tabs)/index.tsx`. עדכון `(guest)/feed.tsx` למונה החי. עדכון `(tabs)/search.tsx` ל-Bottom-Sheet המשותף. הרחבת `filterStore`. הוספת `feedSessionStore` (non-persisted).
- **SRS deltas:** עדכון מקיף של [`06_feed_and_search.md`](../../SSOT/SRS/02_functional_requirements/06_feed_and_search.md) — ראה סקציה 6.
- **TECH_DEBT:** סגירת TD-26 (הפער המרכזי), TD-102 (guest counter קשיח), TD-133 (search files LOC). פתיחת TDs חדשים אם נחשף חוב בזמן עבודה.

### 3.2 Out

- **Apple/Phone OTP signin** — דחויים ל-P3.2/P3.3.
- **Push notifications** — דחויות ל-P1.5.
- **Algorithmic personalization** — לא בסקופ MVP בכלל (`R-MVP-Profile-7`).
- **חיפוש חופשי בפיד הראשי** — מוסר לפי החלטת Q1.
- **Geocoding ברמת רחוב-בית** — נשאר ברמת city-centroid; שדרוג ל-Google Geocoding/Mapbox דחוי ל-P2.x עם TD חדש.
- **Edge-cached endpoint** ל-community counter (FR-FEED-014 AC3) — קריאה ישירה ל-view דרך Supabase מספיק ב-MVP; edge caching דחוי. TD חדש.
- **Cross-tab realtime** (חזרה ללשונית הראשית מלשונית אחרת תוך כדי הופעת פוסטים) — subscription רק במסך הפיד הפעיל.

## 4 — ארכיטקטורה

### 4.1 שכבת Domain (`packages/domain`)

**הרחבה של types קיימים:**

```ts
// packages/domain/src/feed.ts (חדש)
export type FeedSortOrder = 'newest' | 'oldest' | 'distance';

export type FeedStatusFilter = 'open' | 'closed' | 'all';

export interface LocationFilter {
  centerCity: string;     // canonical city name
  radiusKm: number;       // 5 | 10 | 25 | 50 | 100 | null=unlimited
}

export interface FeedFilter {
  type: PostType | null;
  categories: Category[];               // empty = all
  itemConditions: ItemCondition[];      // empty = all; ignored unless type==='Give'
  locationFilter: LocationFilter | null;
  statusFilter: FeedStatusFilter;
  sortOrder: FeedSortOrder;
  proximitySortCity: string | null;     // null = use viewer's city
}
```

**הרחבה של `User`:**

```ts
// packages/domain/src/user.ts (PATCH)
export interface User {
  // ... existing fields
  firstPostNudgeDismissed: boolean;
}
```

`User.postsCreatedTotal` כבר קיים מ-P0.4 (טריגר ב-DB מעדכן אותו).

**חישובים pure שיועברו ל-Domain:**

```ts
// packages/domain/src/geo.ts (חדש, ~40 שורות)
export interface CityGeo { name: string; lat: number; lon: number; }

/** Haversine km; pure, deterministic. */
export function distanceKm(a: CityGeo, b: CityGeo): number;
```

ה-domain לא יכול את הטבלה `cities_geo`. החישוב נטו על נתונים שניתנים אליו. הטעינה היא של ה-infrastructure.

### 4.2 שכבת Application (`packages/application`)

**Use cases חדשים** תחת `packages/application/src/feed/`:

| קובץ | קלט | פלט | מקור FR |
|------|------|-----|---------|
| `GetActivePostsCountUseCase.ts` | — | `number` | FR-FEED-014 |
| `DismissFirstPostNudgeUseCase.ts` | `userId, permanent: boolean` | `void` (אם `permanent=true` → DB, אחרת in-memory store) | FR-FEED-015 |

ה-`GetFeedUseCase` הקיים נשאר עם אותו interface ציבורי, אבל ה-`PostFeedFilter` שהוא מקבל משתנה ל-shape החדש (משופר וטופוסי).

**פורטים חדשים:**

```ts
// packages/application/src/ports/IFeedRealtime.ts (חדש, ~30 שורות)
export interface FeedRealtimeCallbacks {
  onNewPublicPost: () => void;
  onError?: (err: Error) => void;
}

export interface IFeedRealtime {
  /** Subscribe to INSERTs of Public+open posts. Returns unsubscribe fn. */
  subscribeToPublicInserts(cb: FeedRealtimeCallbacks): () => void;
}
```

```ts
// packages/application/src/ports/IStatsRepository.ts (חדש, ~15 שורות)
export interface IStatsRepository {
  /** Reads from community_stats view. */
  getActivePublicPostsCount(): Promise<number>;
}
```

**עדכון `IPostRepository`:**

```ts
// packages/application/src/ports/IPostRepository.ts (PATCH)
export interface PostFeedFilter {
  type?: PostType;
  categories?: Category[];          // (was `category: Category` singular)
  itemConditions?: ItemCondition[]; // NEW
  locationFilter?: LocationFilter;  // NEW (replaces `city`)
  statusFilter?: FeedStatusFilter;  // NEW (replaces `includeClosed`)
  sortOrder?: FeedSortOrder;        // (was `sortBy: 'newest'|'city'`)
  proximitySortCity?: string;       // NEW — explicit center for distance sort
}
```

זה contract change — מסומן כ-`(contract)` בהודעת ה-commit.

`PostWithOwner` מקבל שדה חדש אופציונלי: `distanceKm: number | null` (ימולא רק כש-`sortOrder === 'distance'`).

### 4.3 שכבת Infrastructure (`packages/infrastructure-supabase`)

**`SupabasePostRepository.getFeed` — refactor:**

עובר מ-SELECT בנוי-יד ל-קריאת RPC `feed_with_distance(viewer_id, filter_json, limit, cursor)`. ה-RPC מטפל ב:
- visibility predicate (כמו היום — קריאה ל-`get_visible_posts`).
- distance computation via JOIN על `cities_geo`.
- סינון מצבים: `WHERE status = ANY(...)` בהתאם ל-statusFilter.
- סינון רדיוס: `WHERE haversine(...) <= radius_km` כשהפילטר מופעל.
- מיון: `ORDER BY created_at DESC | created_at ASC | distance_km ASC, created_at DESC`.
- pagination cursor — keep-set מבוסס `(distance, created_at, id)` ב-distance mode.

**מבנה הפונקציה (פירוט מלא ב-`supabase/migrations/0023_feed_distance_rpc.sql`):**

```sql
create or replace function public.feed_with_distance(
  viewer_id uuid,
  filter_json jsonb,
  page_limit int default 20,
  cursor_token text default null
)
returns table (
  post_id uuid,
  -- ... full PostWithOwner columns
  distance_km float
)
language plpgsql security invoker stable;
```

**`SupabaseFeedRealtime` חדש** — מנייה מ-`SupabaseChatRealtime`:

```ts
// packages/infrastructure-supabase/src/feed/SupabaseFeedRealtime.ts (חדש, ~80 שורות)
class SupabaseFeedRealtime implements IFeedRealtime {
  subscribeToPublicInserts(cb): () => void {
    const channel = this.client
      .channel('posts:public-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: 'visibility=eq.Public',
      }, () => cb.onNewPublicPost())
      .subscribe(/* error handling */);
    return () => void channel.unsubscribe();
  }
}
```

**`SupabaseStatsRepository` חדש** (≤50 שורות) — `select active_public_posts_count from community_stats limit 1`.

**`SupabaseSearchRepository.ts` (418 שורות) — פיצול:**
- `SupabaseSearchRepository.ts` (orchestration, ≤200) — נשאר הכניסה.
- `searchPosts.ts` (≤120) — query לפוסטים.
- `searchLinks.ts` (≤120) — query ללינקים.
- `searchUsers.ts` כבר קיים בנפרד.
- הסרת ה-entry מ-`check-architecture.mjs`.

### 4.4 שכבת UI (`packages/ui`)

**רכיב חדש משותף** תחת `packages/ui/src/PostFilterSheet/`:

| קובץ | אחריות | הערכה |
|------|--------|--------|
| `index.ts` | re-export | 5 |
| `PostFilterSheet.tsx` | Bottom-sheet wrapper, header, apply/clear actions | ≤180 |
| `SortSection.tsx` | radio של 3 אפשרויות מיון + CityPicker מותנה ל-distance | ≤120 |
| `FiltersSection.tsx` | type, categories (multi-chips), itemConditions (multi-chips, conditional on type), statusFilter (3-tab) | ≤180 |
| `LocationFilterSection.tsx` | CityPicker + radius slider | ≤120 |

ה-state inputs/outputs דרך props (controlled). ה-mobile יחבר אותו ל-`filterStore` או ל-`searchStore` בהתאם להקשר.

ה-`TopBar` הקיים ב-`@kc/ui` מקבל prop חדש:

```ts
// packages/ui/src/TopBar.tsx (PATCH)
interface TopBarProps {
  rightSlot?: React.ReactNode;
}
```

### 4.5 שכבת Mobile (`apps/mobile`)

**רכיבים חדשים** תחת `apps/mobile/src/components/`:

| קובץ | אחריות | LOC | מקור FR |
|------|--------|-----|---------|
| `NewPostsBanner.tsx` | פס sticky עם "↑ N פוסטים חדשים" + לחיצה refetch | ≤60 | FR-FEED-009 |
| `FirstPostNudge.tsx` | כרטיס דחיף עם 3 פעולות | ≤90 | FR-FEED-015 |
| `FeedCommunityCounter.tsx` | hook + שורת טקסט "{N} פוסטים בקהילה" | ≤40 | FR-FEED-014 |
| `FeedFilterIcon.tsx` | wrapper עם תג אדום של ספירת פילטרים | ≤50 | FR-FEED-004 |
| `WebRefreshButton.tsx` | אייקון רענון רק על Web + R-shortcut handler | ≤60 | FR-FEED-010 |

**Stores:**

- `filterStore.ts` — שדרוג לצורה החדשה:
  ```ts
  interface FilterState {
    type: PostType | null;
    categories: Category[];
    itemConditions: ItemCondition[];
    locationFilter: LocationFilter | null;
    statusFilter: FeedStatusFilter;
    sortOrder: FeedSortOrder;
    proximitySortCity: string | null;
    activeCount: () => number;
    clearAll: () => void;
    /* setters... */
  }
  ```
  עדיין persisted דרך AsyncStorage עם partialize. `activeCount` סופר רק שדות שלא ברירת-מחדל.

- `feedSessionStore.ts` חדש (non-persisted):
  ```ts
  interface FeedSessionState {
    newPostsCount: number;
    firstPostNudgeDismissedThisSession: boolean;
    incrementNewPosts: () => void;
    resetNewPosts: () => void;
    dismissNudgeForSession: () => void;
  }
  ```

**מסכים שעוברים שינוי:**

- `apps/mobile/app/(tabs)/index.tsx` (~ עכשיו 82 שורות, יגיע ל-~150):
  - הזרקת `<FeedFilterIcon>` ו-`<WebRefreshButton>` ל-`TopBar.rightSlot`.
  - חיווט `filterStore` → קריאת `useQuery` עם הפילטר.
  - subscription ל-`IFeedRealtime` ב-`useEffect` מותנה ב-AppState.
  - הופעה מותנית של `<FirstPostNudge>` (מעל הרשימה), `<NewPostsBanner>` (sticky על הרשימה), warm empty state.
  - RefreshControl ב-FlatList של `PostFeedList`.
  - R-key shortcut handler (web only).

- `apps/mobile/app/(tabs)/search.tsx` — מחליף `SearchFilterSheet` ב-`<PostFilterSheet>`. ה-state ל-state-משותף עם הפיד (type/categories/itemConditions/locationFilter/statusFilter/sortOrder/proximitySortCity) **לא** משותף בין הלשונית והפיד — לכל אחד שלו (כי משתמש בקשרים שונים). אבל ה-vocabulary של הצורה אחיד. ה-`searchStore` שומר את השדות שלו (resultType, donationCategory, minFollowers) בנפרד.

- `apps/mobile/app/(guest)/feed.tsx` — מסיר את הטקסט הקשיח "50+ פוסטים פעילים", קורא `useActivePostsCount()` ומחבר את המספר.

## 5 — שינויים במודל הנתונים (DB)

### 5.1 `cities_geo` — טבלת lookup חדשה

```sql
-- supabase/migrations/0021_cities_geo.sql
create table public.cities_geo (
  name text primary key,
  lat double precision not null check (lat between 29.0 and 34.0),
  lon double precision not null check (lon between 34.0 and 36.5),
  created_at timestamptz not null default now()
);

-- Seed from CBS open dataset of Israeli settlements (~1,250 rows).
-- Loaded as inline INSERT statements (not COPY) because Supabase managed
-- environment doesn't expose a filesystem path for COPY FROM on migration
-- run. Generated once from the CBS TSV, committed to the migration file.
insert into public.cities_geo (name, lat, lon) values
  ('תל אביב-יפו',     32.0853, 34.7818),
  ('ירושלים',         31.7683, 35.2137),
  ('חיפה',            32.7940, 34.9896),
  -- ... ~1,250 rows total
  ;

-- Spatial index for fast radius queries
create index cities_geo_latlon_idx on public.cities_geo using btree (lat, lon);

-- RLS: read-only for all authenticated + anon (reference data)
alter table public.cities_geo enable row level security;
create policy "cities_geo_read_all" on public.cities_geo for select using (true);
```

ה-seed קובץ TSV נטען חד-פעמית. אם נצטרך לעדכן (חוסר ערים, ערים חדשות), נוסיף migration נפרד או UPSERT.

**מקור הנתונים**: [Central Bureau of Statistics — Israel Settlements 2024](https://www.cbs.gov.il/he/publications/Pages/2024/SETTLEMENTS.aspx). חופשי לשימוש, מכיל lat/lon לכל יישוב. אטעין את הקובץ כ-TSV נקי.

### 5.2 `users.first_post_nudge_dismissed`

```sql
-- supabase/migrations/0022_first_post_nudge.sql
alter table public.users
  add column first_post_nudge_dismissed boolean not null default false;
```

ברירת מחדל false כדי שיוזרים קיימים יראו את הכרטיס אם הם עוד לא יצרו פוסט.

### 5.3 RPC `feed_with_distance`

המבנה המלא יושב במיגרציה 0023. עקרונות:
- מקבל `viewer_id uuid` + `filter_json jsonb` + `page_limit int` + `cursor_token text`.
- מבצע JOIN ל-`cities_geo` על `posts.city = cities_geo.name`.
- מחשב `haversine_km` ב-Pure SQL (ביטוי פשוט).
- מסנן: `status`, `type`, `categories`, `item_conditions`, `locationFilter.center+radius`.
- מבצע visibility check עם הפונקציה הקיימת `is_post_visible_to(viewer, post)`.
- מסדר לפי `sortOrder`.
- מחזיר `next_cursor` מבוסס keyset של 3 עמודות (distance, created_at, id) ב-distance mode, וכרגיל אחרת.

## 6 — שינויי SRS

מתייחס לעדכון [`06_feed_and_search.md`](../../SSOT/SRS/02_functional_requirements/06_feed_and_search.md):

| FR | פעולה | מהות השינוי |
|----|------|------------|
| FR-FEED-001 | ללא שינוי | composition reverse-chronological נשאר. |
| FR-FEED-002 | ללא שינוי | feed card composition נשאר. |
| FR-FEED-003 | **DEPRECATED** | שורת חיפוש מוסרת מהפיד הראשי. החיפוש החופשי על פוסטים בלשונית האוניברסלית (FR-FEED-016 החדש). |
| FR-FEED-004 | **REWORK** | ACs משופצים: סוג / קטגוריות (מולטי) / מצב מוצר / location filter (עיר+רדיוס) / statusFilter (3-מצבי) / sortOrder (3-אפשרויות). פותח מאייקון ב-TopBar. |
| FR-FEED-005 | **EXTEND** | שדות persisted מתעדכנים בהתאם ל-shape החדש. |
| FR-FEED-006 | **REWORK** | מיון Haversine מ-city centroids; AC2 ההיסטורי ("no geocoding") מתבטל בהסבר. |
| FR-FEED-007 | **DEPRECATED** | Cold-start fallback בוטל. מיון לפי מרחק מטפל בעיר דלילה. |
| FR-FEED-008 | **EXTEND** | CTAs דינמיים; שורת מונה קהילה משולבת. |
| FR-FEED-009 | ללא שינוי | Realtime freshness, "↑ N new posts" banner. מאחנים את המימוש. |
| FR-FEED-010 | ללא שינוי | Pull-to-refresh + Web button + R shortcut. מאחנים. |
| FR-FEED-011 | ללא שינוי | חיפושים פנימיים מבודדים. |
| FR-FEED-012 | ללא שינוי | guest preview. |
| FR-FEED-013 | **DEPRECATED** | שבב פילטרים פעילים מוסר; ספירה מוצגת רק כתג על אייקון ה-TopBar. |
| FR-FEED-014 | **EXTEND** | מונה נצרך גם ב-warm empty state. AC3 (edge-cached endpoint) דחוי ל-P2.x (TD חדש). |
| FR-FEED-015 | **REWORK** | 3 פעולות במקום 2: שתף / תזכיר אחר כך (session) / אל תציג שוב (קבוע). |
| FR-FEED-016 | **SUPERSEDE** | מ-"placeholder" ל-תיאור מלא של Universal Search tab שעובד בפועל. שינוי כותרת. |
| FR-FEED-018 | **NEW** | `<PostFilterSheet>` משותף בין הפיד ולשונית האוניברסלית. |
| FR-FEED-019 | **NEW** | טבלת `cities_geo` כמקור אמת לחישובי מרחק. |

### 6.1 Decision log entry חדש

```markdown
| EXEC-8 | Distance-aware feed: עבר ל-Haversine מ-city centroids במקום string-equality בערים, באמצעות `cities_geo` lookup table חד-פעמי מנתוני הלמ"ס. מבטל את האיסור המקורי על geocoding ב-FR-FEED-006 AC2. בנוסף, מאחד את חוויית הפילטר בין הפיד הראשי ולשונית החיפוש האוניברסלי דרך `<PostFilterSheet>` משותף ב-`@kc/ui`. | P1.2 design | 2026-05-11 |
```

## 7 — סדר עבודה (commits)

PR יחיד, branch: `feat/P1.2-feed-discovery-and-filters`.

### Commit 1 — Contract + Migrations + Domain
**Scope:** `(contract)` per parallel-agents protocol — חתימת פורט משתנה.
- `supabase/migrations/0021_cities_geo.sql` + `supabase/seed_data/cities_geo.tsv`.
- `supabase/migrations/0022_first_post_nudge.sql`.
- `supabase/migrations/0023_feed_distance_rpc.sql`.
- `packages/domain/src/feed.ts` (new types).
- `packages/domain/src/user.ts` (extend User).
- `packages/domain/src/geo.ts` (Haversine pure).
- `packages/application/src/ports/IPostRepository.ts` (extend PostFeedFilter, add distanceKm).
- `packages/application/src/ports/IFeedRealtime.ts` (new).
- `packages/application/src/ports/IStatsRepository.ts` (new).
- `packages/application/src/feed/GetActivePostsCountUseCase.ts` (new).
- `packages/application/src/feed/DismissFirstPostNudgeUseCase.ts` (new).
- Update `GetFeedUseCase.ts` to validate new shape (no behavior change).
- Vitest:
  - `GetActivePostsCountUseCase.test.ts`
  - `DismissFirstPostNudgeUseCase.test.ts`
  - `GetFeedUseCase.test.ts` (update + new cases for shape).
  - `domain/__tests__/geo.test.ts` (Haversine correctness).

**Verification:** `pnpm typecheck`, `pnpm test`, `pnpm lint:arch` — all green.

### Commit 2 — Infrastructure adapters
- `packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — `getFeed` עובר לקרוא ל-RPC.
- `packages/infrastructure-supabase/src/feed/SupabaseFeedRealtime.ts` (new).
- `packages/infrastructure-supabase/src/stats/SupabaseStatsRepository.ts` (new).
- `packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` — `update` מטפל ב-`first_post_nudge_dismissed`.
- Vitest עם supabase-mock-client לבדיקות smoke של ה-RPC payload + parsing.

**Verification:** הריצה המקומית של supabase (`pnpm supabase:reset`) מצליחה.

### Commit 3 — UI shared component + Mobile feed wiring
- `packages/ui/src/PostFilterSheet/{index.ts,PostFilterSheet.tsx,SortSection.tsx,FiltersSection.tsx,LocationFilterSection.tsx}`.
- `packages/ui/src/TopBar.tsx` — `rightSlot` prop.
- `apps/mobile/src/store/filterStore.ts` — shape חדש.
- `apps/mobile/src/store/feedSessionStore.ts` (new).
- `apps/mobile/src/components/{NewPostsBanner,FirstPostNudge,FeedCommunityCounter,FeedFilterIcon,WebRefreshButton}.tsx`.
- `apps/mobile/src/services/postsComposition.ts` — register `IFeedRealtime` + `IStatsRepository` + הוספת use cases חדשים ל-container.
- `apps/mobile/app/(tabs)/index.tsx` — חיווט מלא.
- `apps/mobile/app/(guest)/feed.tsx` — wiring למונה החי (סוגר TD-102).

**Verification:** `pnpm typecheck`, `pnpm --filter @kc/mobile web` — ידני: פתיחת הפיד, גיליון נפתח, כל אופציות המיון/הסינון עובדות, refresh ידני עובד, banner first-post נראה.

### Commit 4 — Search tab adoption + cleanup + docs
- `apps/mobile/app/(tabs)/search.tsx` — switch ל-`<PostFilterSheet>` (state חצי-משותף עם `searchStore` בלבד לשדות הייחודיים).
- `apps/mobile/src/components/SearchFilterSheet.tsx` — מחיקה.
- `packages/infrastructure-supabase/src/search/{SupabaseSearchRepository.ts,searchPosts.ts,searchLinks.ts}` — פיצול.
- `apps/mobile/scripts/check-architecture.mjs` (או `app/scripts/...`) — הסרת ה-allow-list של SearchFilterSheet/SearchResultCard/SupabaseSearchRepository.
- **תיעוד:**
  - עדכון `docs/SSOT/SRS/02_functional_requirements/06_feed_and_search.md` (סעיף-סעיף לפי טבלת §6).
  - עדכון `docs/SSOT/PROJECT_STATUS.md` — P1.2 ל-🟢, snapshot, sprint board.
  - עדכון `docs/SSOT/TECH_DEBT.md` — סגירת TD-26, TD-102, TD-133.
  - עדכון `docs/SSOT/HISTORY.md` — ערך חדש בראש.
  - עדכון `docs/SSOT/SRS/appendices/C_decisions_log.md` — EXEC-8.

**Verification:** כל הסקטים ב-`pnpm typecheck`, `pnpm test`, `pnpm lint:arch` ירוקים. `pnpm --filter @kc/mobile web` נפתח, מסך הפיד **וגם** לשונית החיפוש האוניברסלי עובדים עם הגיליון המשותף.

## 8 — סיכונים פתוחים

| סיכון | חומרה | מיטיגציה |
|--------|------|---------|
| נתוני `cities_geo` לא כוללים יישוב נדיר (`Post.city`-string שלא מופיע בטבלה) | בינוני | RPC משאיר את הפוסט ב-feed עם `distance_km = NULL`; כשמיון לפי מרחק, NULLs בסוף. בדיקה: ספירת mismatches בטבלת `posts` אחרי הטעינה; אם >0.5%, להוסיף קובץ delta. |
| RPC `feed_with_distance` איטי במונה הגדל | בינוני | אינדקס על `posts(city, created_at desc)` + index על `cities_geo(name)`. בדיקה: explain ב-1000 פוסטים. אם איטי, להוסיף materialized view או lateral join חכם. |
| ערוץ realtime `posts:public-feed` מגדיל unbounded subscriptions | נמוך | unsubscribe ב-AppState change (כמו chat); subscription יחיד per session. |
| `<PostFilterSheet>` משותף עם 2 צרכנים — risk של coupling לא מכוון | נמוך | ה-component מקבל state דרך props (controlled); כל צרכן שומר את ה-state שלו. |
| הסרת FR-FEED-007 עלולה להפתיע יוזרים בעיר דלילה | נמוך | המיון "לפי מיקום" מסביר את עצמו (פוסטים רחוקים-יותר מופיעים בהמשך). אם אחרי השקה מתלוננים, אפשר להחזיר באנר עם TD חדש. |

## 9 — בדיקות

### 9.1 Vitest (יחידה)

- `GetFeedUseCase.test.ts` — מוסיפים cases: ביטוי כל ה-sortOrders, locationFilter עם radius, statusFilter 3-מצבי.
- `GetActivePostsCountUseCase.test.ts` — happy path + zero count.
- `DismissFirstPostNudgeUseCase.test.ts` — permanent → קריאה ל-`IUserRepository.update`; session → no-op בפורט (handled in UI layer).
- `geo.test.ts` — Haversine נקודות ידועות (תל אביב↔ירושלים ~54km, חיפה↔אילת ~370km).

יעד: 148 vitest נוכחיים → ≥160 אחרי P1.2.

### 9.2 Manual UI verification (Preview MCP)

לפני סיום ה-commit האחרון, אפעיל את ה-dev server ואבדוק:
1. Home Feed עם פילטרים שונים — כל קומבינציה ב-Bottom-Sheet.
2. החלפת מיון "החדש ביותר" / "הישן ביותר" / "לפי מיקום" עובדת.
3. Filter מיקום עם רדיוס שונה — מספרי תוצאות הגיוניים.
4. First-post nudge מופיע ליוזר ללא פוסטים, ומסתיר/נעלם בכל שלוש האפשרויות.
5. Empty state עם פילטר שלא תואם — שני ה-CTAs עובדים.
6. Realtime — הקצאת פוסט חדש מחלון שני → באנר "↑ N" מופיע, לחיצה refetches.
7. Web refresh button + R shortcut על Web.
8. Guest feed מציג את המספר החי במקום הקשיח.
9. Filter Sheet בלשונית האוניברסלית עובד עם אותה צורה.

## 10 — Verification gate

תוצאת ה-spec מוכנה לאישור:

```
Mapped to SRS: FR-FEED-004, 005, 006 (Haversine), 008, 009, 010, 014, 015, 018 (new), 019 (new). Deprecated: FR-FEED-003, 007, 013. Superseded: FR-FEED-016.
Refactor logged: Yes (TD-26 closes, TD-102 closes, TD-133 closes).
```
