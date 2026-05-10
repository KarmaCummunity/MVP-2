# P1.1 — Following + Other-User Profile Design Spec

> תאריך: 2026-05-10 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש · FR refs: FR-FOLLOW-001..009, 011, 012 · FR-PROFILE-002, 003, 004, 005, 006, 009, 010, 013

## 1 — בעיה ומטרה

הסכמה של follow_edges + follow_requests + blocks + RLS + טריגרים כבר קיימת מ-P0.2 (מיגרציה 0003). מה שחסר זה כל מה שמעל ה-DB: אין `IFollowRepository` (המתודות מוצהרות על `IUserRepository` אבל זרוקות `not_implemented`), אין use cases, אין UI, ומסך הפרופיל של יוזר אחר (`/user/[handle]`) הוא placeholder מינימלי שמציג רק אווטר + שלח־הודעה + חסום (TD-40 חלקי, TD-14 פתוח).

המטרה: לבנות את כל מנגנון העוקבים מקצה־לקצה ולהפוך את הפרופיל של יוזר אחר לדף שווה־ערך (כמעט) לפרופיל האישי — עוקבים, נעקבים, פוסטים פתוחים, פוסטים סגורים, וכפתור Follow עם מכונת מצבים מלאה.

## 2 — החלטות (מתוך ה-brainstorming)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | פוסטים סגורים בפרופיל של יוזר אחר | מציגים אחד-לאחד כמו בפרופיל אישי (כולל שם המקבל), כשהפרופיל פתוח או שאני עוקב מאושר. עדכון ל-FR-PROFILE-002 AC2 + FR-PROFILE-004 AC4. |
| Q2 | היקף מנגנון העוקבים | מנגנון מלא — FR-FOLLOW-001..009 + 011 + 012, כולל בקשות לפרופיל פרטי + cooldown + הסרת עוקב. |
| Q3 | מתג פרטיות בהגדרות | נכלל בסקופ — FR-PROFILE-005 + 006. בלעדיו "מנגנון מלא" אינו בר־בדיקה (אף יוזר לא יכול להיות פרטי בלי המתג). |
| Q4 | התראות לאירועי follow | דחויות ל-P1.5 (Push). לא רושמים שורות התראה ב-DB עכשיו. נרשם TD חדש. |
| Q5 | תג מספר "בקשות עוקבים (N)" בהגדרות | בסקופ — לא דורש תשתית התראות, רק שאילתת ספירה. ממילא ב-FR-FOLLOW-007 AC5. |
| Q6 | ארכיטקטורה — מסך אחד או שניים | שניים. סאב־רכיבים משותפים תחת `apps/mobile/src/components/profile/`. הפרופיל האישי עובר ריפקטור לשימוש בהם בלי שינוי חזותי. |

## 3 — סקופ

### 3.1 In

- **DB:** ללא שינויים. הסכמה קיימת ועובדת.
- **Domain:** ללא שינויים. כל הטיפוסים קיימים (`FollowEdge`, `FollowRequest`, `User.followersCount`, `User.followingCount`, `User.privacyMode`).
- **Application:** מימוש 12 use cases חדשים ב-`packages/application/src/follow/` (כולל `UpdatePrivacyModeUseCase`).
- **Infrastructure:** מימוש כל מתודות ה-follow ב-`SupabaseUserRepository` (להחליף את ה-NOT_IMPL stubs); הוספת `setPrivacyMode` ל-`IUserRepository` + מימוש; מיפוי שגיאות Postgres לקודי `FollowError`.
- **UI:** ריבילד `/user/[handle]/index.tsx`; שני מסכי רשימה חדשים (`followers.tsx`, `following.tsx`); מסך `/settings/privacy.tsx` חדש; מסך `/settings/follow-requests.tsx` חדש; חמישה סאב־רכיבים משותפים (`ProfileHeader`, `ProfileStatsRow`, `ProfileTabs`, `ProfilePostsGrid`, `FollowButton`); ריפקטור `(tabs)/profile.tsx` לשימוש בהם.
- **SRS deltas:** FR-PROFILE-002 AC2 + FR-PROFILE-004 AC4 (פוסטים סגורים מוצגים).
- **TECH_DEBT:** סוגרים TD-14 (other-user counters render 0). פותחים TD חדש לדחיית התראות ל-P1.5.

### 3.2 Out

- Push notifications (FR-NOTIF-006/007/008) — דחויות ל-P1.5.
- מסך התראות in-app — לא קיים, לא נבנה כאן.
- פיצול `IFollowRepository` כפורט נפרד — נשאר על `IUserRepository` כי הוא כבר מוצהר שם, פיצול מאוחר יהיה refactor שטוח (TD נוסף אם נראה צורך אחרי המימוש).
- Edit Profile (FR-PROFILE-007) — קיים כבר, לא ניגעים.
- Share Profile deep-link (FR-PROFILE-008) — לא בסקופ.

## 4 — ארכיטקטורה

### 4.1 שכבת Domain (`packages/domain`) — אפס שינויים

הכל קיים: `FollowEdge`, `FollowRequest { status, cooldownUntil }`, `FollowRequestStatus`, `PrivacyMode`, `User.privacyMode`, `User.privacyChangedAt`, `User.followersCount`, `User.followingCount`. לא נדרש שינוי טיפוסים.

`FOLLOW_REQUEST_COOLDOWN_DAYS = 14` כבר ב-`invariants.ts`.

### 4.2 שכבת Application (`packages/application`)

**Use cases חדשים** תחת `packages/application/src/follow/`:

| קובץ | קלט | פלט | מקור FR |
|------|------|-----|---------|
| `FollowUserUseCase.ts` | `viewerId, targetUserId` | `FollowEdge` | FR-FOLLOW-001 |
| `UnfollowUserUseCase.ts` | `viewerId, targetUserId` | `void` | FR-FOLLOW-002 |
| `SendFollowRequestUseCase.ts` | `requesterId, targetId` | `FollowRequest` | FR-FOLLOW-003 |
| `CancelFollowRequestUseCase.ts` | `requesterId, targetId` | `void` | FR-FOLLOW-004 |
| `AcceptFollowRequestUseCase.ts` | `targetId, requesterId` | `void` | FR-FOLLOW-005 |
| `RejectFollowRequestUseCase.ts` | `targetId, requesterId` | `void` | FR-FOLLOW-006 |
| `RemoveFollowerUseCase.ts` | `ownerId, followerId` | `void` | FR-FOLLOW-009 |
| `ListFollowersUseCase.ts` | `userId, limit, cursor?` | `{ users: User[]; nextCursor: string \| null }` | FR-PROFILE-009/010 |
| `ListFollowingUseCase.ts` | `userId, limit, cursor?` | `{ users: User[]; nextCursor: string \| null }` | FR-PROFILE-009/010 |
| `ListPendingFollowRequestsUseCase.ts` | `targetId, limit, cursor?` | `{ requests: FollowRequestWithUser[]; nextCursor: string \| null }` | FR-FOLLOW-007 |
| `GetFollowStateUseCase.ts` | `viewerId, targetUserId` | `FollowState` (enum) | FR-FOLLOW-011 |
| `UpdatePrivacyModeUseCase.ts` | `userId, mode` | `User` | FR-PROFILE-005, 006 |

**טיפוסים נוספים בשכבת Application:**

```ts
// packages/application/src/follow/types.ts
export type FollowState =
  | 'self'                          // מסתכל על עצמי — אין כפתור
  | 'not_following_public'          // "+ עקוב"
  | 'following'                     // "עוקב ✓" (גם אחרי אישור בקשה)
  | 'not_following_private_no_request' // "+ שלח בקשה"
  | 'request_pending'               // "בקשה נשלחה ⏳"
  | 'cooldown_after_reject'         // "+ שלח בקשה" disabled עם tooltip
  | 'blocked';                      // כפתור מוסתר

export interface FollowRequestWithUser {
  request: FollowRequest;
  requester: User;  // joined on requester_id
}
```

**הוספות לפורט `IUserRepository`:**

```ts
setPrivacyMode(userId: string, mode: PrivacyMode): Promise<User>;
// findByHandle(handle, viewerId?) — חתימה קיימת. הוספת פרמטר אופציונלי לחישוב follow_state בצד שרת לא חיונית; חישוב נעשה ב-GetFollowStateUseCase.
```

המתודות הקיימות (`follow`, `unfollow`, `isFollowing`, `getFollowers`, `getFollowing`, `sendFollowRequest`, `acceptFollowRequest`, `rejectFollowRequest`, `cancelFollowRequest`, `getPendingFollowRequests`) — מוצהרות, מומשו `not_implemented`. עוברות מימוש כאן.

**שגיאות חדשות (`FollowError` codes):**

```
SelfFollow                  // לא ניתן לעקוב אחרי עצמי
BlockedRelationship         // צד אחד חסם את השני (בלי לחשוף כיוון)
AlreadyFollowing            // קצה כבר קיים — idempotent על client (לא משגרים שגיאה ל-UI)
CooldownActive              // 14 ימי cooldown אחרי דחייה
PendingRequestExists        // יש כבר בקשה ממתינה (idempotent — נחשב הצלחה ב-UI)
UserNotFound                // היעד לא קיים / השעה / נמחק
PrivacyModeNoChange         // מתג למצב הנוכחי — no-op
```

מיפוי `errcode` של Postgres → `FollowError`:
- `check_violation` עם message `self_follow_forbidden` → `SelfFollow`
- `check_violation` עם message `blocked_relationship` → `BlockedRelationship`
- `check_violation` עם message `already_following` → `AlreadyFollowing`
- `check_violation` עם message `follow_request_cooldown_active` → `CooldownActive` (פריסה של `cooldown_until` מתוך ה-detail)
- `unique_violation` על `follow_requests_one_pending_per_pair_idx` → `PendingRequestExists`

### 4.3 שכבת Infrastructure (`packages/infrastructure-supabase`)

**ללא מיגרציה חדשה.** כל הסכמה + טריגרים + RLS + פונקציות עזר (`is_following`, `is_blocked`, `is_post_visible_to`) קיימים.

**שינויים ב-`SupabaseUserRepository.ts`:**

החלפת כל ה-`NOT_IMPL` של מתודות follow ל-`P1.1` במימוש אמיתי. אם הקובץ עובר את 200 שורות (עכשיו 211), אחלץ את הכל ל-`packages/infrastructure-supabase/src/users/follow/` (קובץ פר־מתודה מורכבת או קובץ מצרפי + ייבוא ל-Repository), בדומה לפיצול `searchUsers.ts`. החלטת חיתוך תיעשה תוך כדי המימוש.

**`getFollowState(viewerId, targetUserId)`:**
שאילתה אחת שמחזירה את כל המידע החיוני בקריאה אחת:

```ts
// פסאודו-קוד; המימוש משתמש ב-RPC או ב-3 קריאות מקבילות
const [{ data: target }, { data: edge }, { data: pendingReq }, { data: cooldownReq }] = await Promise.all([
  client.from('users').select('user_id, privacy_mode, account_status').eq('user_id', targetUserId).maybeSingle(),
  client.from('follow_edges').select('*').eq('follower_id', viewer).eq('followed_id', target).maybeSingle(),
  client.from('follow_requests').select('*').eq('requester_id', viewer).eq('target_id', target).eq('status', 'pending').maybeSingle(),
  client.from('follow_requests').select('cooldown_until').eq('requester_id', viewer).eq('target_id', target).eq('status', 'rejected').gt('cooldown_until', 'now()').order('cooldown_until', { ascending: false }).limit(1).maybeSingle(),
]);
```

מחזיר `FollowState` + (אופציונלי) `cooldownUntil` כשרלוונטי. אם הבדיקה מוכיחה שזה איטי — נחליף ב-RPC `get_follow_state(p_viewer, p_target)` (ב-TD נפרד), אבל סביר שלא נצטרך — יש אינדקסים על שני הצדדים.

**מיפוי שגיאות:** קובץ `mapFollowError.ts` תחת `packages/infrastructure-supabase/src/users/follow/`, בדומה ל-`mapPostError.ts` הקיים. כל מתודה שמדברת עם DB עוטפת את ה-error בקריאה למפה.

### 4.4 שכבת UI (`apps/mobile`)

#### 4.4.1 סאב־רכיבים משותפים — `apps/mobile/src/components/profile/`

| קובץ | תפקיד |
|------|-------|
| `ProfileHeader.tsx` | אווטר + שם + 🔒 (אם privacy=Private) + ביו. props: `user, showLock, size`. ≤80 LOC. |
| `ProfileStatsRow.tsx` | שלושה מונים קליקביליים (עוקבים / נעקבים / פוסטים). props: `followers, following, posts, onPressFollowers?, onPressFollowing?, locked`. כשנעול — לא קליקבילי + העתק "פרטי". ≤60 LOC. |
| `ProfileTabs.tsx` | טאבים פתוחים/סגורים (כמו עכשיו ב-(tabs)/profile.tsx). props: `active, onChange`. ≤50 LOC. |
| `ProfilePostsGrid.tsx` | גריד פוסטים + EmptyState. props: `posts, isLoading, ownerIsMe, emptyVariant`. ≤80 LOC. |
| `FollowButton.tsx` | מכונת מצבים 5־מצבית (ראה §5). props: `state, cooldownUntil?, onPress`. ≤120 LOC. |
| `LockedPanel.tsx` | פאנל "פרופיל פרטי" עם כפתור "שלח בקשה". ≤60 LOC. |

#### 4.4.2 מסכים

| נתיב | תיאור | LOC צפוי |
|------|-------|---------|
| `(tabs)/profile.tsx` (ריפקטור) | ניצול הסאב־רכיבים. אין שינוי חזותי. | ~120 (מ-204) |
| `user/[handle]/index.tsx` (ריבילד) | פרופיל יוזר אחר. שלושה מצבים: ציבורי / פרטי-מאושר / פרטי-לא-מאושר. | ≤180 |
| `user/[handle]/followers.tsx` (חדש) | רשימת עוקבים — חיפוש + שורות + ⋮ "הסר עוקב" אם הפרופיל שלי. | ≤150 |
| `user/[handle]/following.tsx` (חדש) | רשימת נעקבים — חיפוש + שורות. | ≤150 |
| `user/[handle]/_layout.tsx` (חדש) | Stack כדי לאפשר ילדים. | ~30 |
| `settings/privacy.tsx` (חדש) | מתג Public ↔ Private + מודאלים + שורת "בקשות עוקבים (N)". | ≤180 |
| `settings/follow-requests.tsx` (חדש) | רשימת `pending` + Approve/Reject inline. | ≤150 |

הקיים `user/[handle].tsx` יוסר; התוכן עובר ל-`user/[handle]/index.tsx`. מאשרים שזה גם המקום שאליו `chat-header` ו-Post Detail יופנו (כבר משתמשים בנתיב הזה — שינוי שקוף).

#### 4.4.3 הגדרות — Entry point למסך פרטיות

מסך הגדרות הראשי (`/settings`) — לא קיים פיזית כרגע (רק `report-issue.tsx`). חלק מהמשימה: יצירת `/settings/index.tsx` כדי שהמתג ייגיש מתפריט. כן, הוא יוסיף מסך הגדרות כללי סטנדרטי עם כניסה ל"פרטיות". נשאר מינימלי (≤80 LOC) — שאר ההגדרות (FR-SETTINGS-001..007) ישלימו ב-P2.1.

## 5 — מכונת מצבים של כפתור Follow (FR-FOLLOW-011)

| מצב | תווית | enabled | פעולה ב-tap | מקור |
|-----|-------|---------|-------------|------|
| `self` | (לא רנדור) | — | — | — |
| `not_following_public` | + עקוב | ✅ | `FollowUserUseCase` | FR-FOLLOW-001 |
| `following` | עוקב ✓ | ✅ | מודאל אישור → `UnfollowUserUseCase` | FR-FOLLOW-002 |
| `not_following_private_no_request` | + שלח בקשה | ✅ | `SendFollowRequestUseCase` | FR-FOLLOW-003 |
| `request_pending` | בקשה נשלחה ⏳ | ✅ | מודאל "בטל בקשה?" → `CancelFollowRequestUseCase` | FR-FOLLOW-004 |
| `cooldown_after_reject` | + שלח בקשה | ❌ | tooltip: "ניתן לשלוח שוב בעוד N ימים" | FR-FOLLOW-006 AC3 |
| `blocked` | (מוסתר) | — | — | FR-MOD-009 |

עדכון אופטימי על `not_following_public` → `following` ו-`not_following_private_no_request` → `request_pending`; rollback ב-error.

## 6 — נתיבים (expo-router)

```
app/
├── (tabs)/
│   ├── profile.tsx              [ריפקטור]
│   └── ...
├── user/
│   └── [handle]/
│       ├── _layout.tsx           [חדש]
│       ├── index.tsx             [ריבילד; הקיים user/[handle].tsx נמחק]
│       ├── followers.tsx         [חדש]
│       └── following.tsx         [חדש]
└── settings/
    ├── index.tsx                 [חדש — מתפריט הגדרות מינימלי]
    ├── privacy.tsx               [חדש]
    ├── follow-requests.tsx       [חדש]
    └── report-issue.tsx          [קיים]
```

נקודות כניסה ל-`/user/[handle]`:
- כותרת צ'אט (כבר מקושרת)
- Post Detail — שם הבעלים (כבר מקושר)
- Recipient picker (closure flow) — כבר מקושר
- כל שורה ברשימת Followers / Following (חדש)
- כל שורה ברשימת Follow Requests (חדש)
- חיפוש עתידי (P1.2)

## 7 — טיפול בשגיאות + נראות + העתקים

| מצב | קוד שגיאה | התנהגות UI |
|-----|-----------|------------|
| הצלחה | — | עדכון אופטימי + רענון query |
| `SelfFollow` | — | UI לא צריך להגיע לכאן (state=`self`); הגנה בלבד. log + silent. |
| `BlockedRelationship` | — | מסתיר את כפתור Follow (state=`blocked`). אם איכשהו נשלח — toast גנרי "פעולה לא זמינה". בלי לחשוף כיוון. |
| `AlreadyFollowing` | — | idempotent. עדכון query. בלי toast. |
| `CooldownActive` | — | tooltip "ניתן לשלוח שוב בעוד N ימים" מתחת לכפתור. הכפתור disabled. |
| `PendingRequestExists` | — | idempotent. סטייט עובר ל-`request_pending`. בלי toast. |
| `UserNotFound` | — | מסך 404 — "המשתמש לא נמצא". |
| network/אחר | — | toast גנרי "שגיאה. נסו שוב." + retry. |

מודאל "הסר עוקב" (FR-FOLLOW-009 AC2) — העתק:
> "להסיר את [שם] מהעוקבים שלך? הם לא יראו יותר פוסטים שיועדו לעוקבים בלבד, ולא יקבלו על כך הודעה. אם הפרופיל שלך פתוח הם יוכלו לעקוב מחדש מיד; אם הוא פרטי — יצטרכו לשלוח בקשה."

מודאל "בטל בקשה" — קצר:
> "לבטל את בקשת המעקב? תוכלי לשלוח בקשה חדשה בכל עת."

מודאל מעבר Public → Private — עפ"י FR-PROFILE-005 AC2.
מודאל מעבר Private → Public — עפ"י FR-PROFILE-006 AC1.

## 8 — עדכוני SRS

**FR-PROFILE-002 AC2** — מוחלף:
> ~~The "Closed Posts" tab is **never** shown for other users (privacy decision, PRD §3.2.2).~~
> The "Closed Posts" tab is shown for other users when their profile is `Public` (or when `Private` and the viewer is an approved follower). The tab includes recipient identity in the closed-post copy ("נמסר ל-X"), per the same rules as on My Profile (`FR-PROFILE-001`). Posts at `Only-me` visibility are never visible to non-owners.

**FR-PROFILE-004 AC4** — מוחלף:
> ~~The "Closed Posts" tab is still hidden (privacy decision applies regardless of follow state).~~
> The "Closed Posts" tab is included; behaves as in `FR-PROFILE-002` AC2.

**Decision log entry חדש** ב-`SRS/appendices/C_decisions_log.md` ובמראה ב-`PROJECT_STATUS.md` §4:

| ID | Decision | Origin | Date |
|----|----------|--------|------|
| EXEC-7 | פוסטים סגורים מוצגים בפרופיל של יוזר אחר (ציבורי או פרטי-עוקב-מאושר), כולל זהות המקבל. החלטה זו מהפכה את ההחלטה הקודמת ב-PRD §3.2.2; המודל הסוציאלי הוא "ראה איזה תרומות עזרת ולמי". פוסטים `Only-me` ממשיכים להיות מוסתרים. | P1.1 brainstorming | 2026-05-10 |

## 9 — עדכוני TECH_DEBT

**סוגרים:**
- TD-14 — "other-user counters render 0" — נסגר. הפרופיל מציג מונים אמיתיים מ-`User`.
- TD-40 (חלקי) — "user/[handle] placeholder" — נסגר.

**פותחים:**
- TD-124 — "Push notifications for follow events deferred. P1.5 wiring צריך להפיק `follow_started` (FR-FOLLOW-001 AC3), `follow_request_received` (FR-FOLLOW-003 AC2 + FR-FOLLOW-007), `follow_approved` (FR-FOLLOW-005 AC3). ה-DB עצמו רק יוצר/מאשר/דוחה רשומות — חסר רק שיגור push. אומדן: פיצ'ר משנה ב-P1.5."

## 10 — Testing strategy

**Vitest unit tests** (תחת `packages/application/src/follow/__tests__/`):

- כל use case — happy path + 1-3 edge cases. בעיקר מודלים את ה-port כ-mock וודאים שה-orchestration נכון.
- `GetFollowStateUseCase` — בדיקה לכל אחד מ-7 המצבים.
- `UpdatePrivacyModeUseCase` — בדיקה שה-no-op (מתג למצב הנוכחי) לא קורא ל-DB.

**אין E2E ב-MVP.** בדיקה ידנית עם super-admin test account לפי המסלולים:
1. Public follow / unfollow / remove follower.
2. הפיכה ל-Private דרך המתג. בקשה מאיש שני (super-admin), אישור, דחייה. cooldown.
3. רענון רשימות אחרי כל פעולה.
4. בלוק → ראיית כפתור follow נעלם בשני הצדדים.

יעד: 109 vitest passing → ~125+ אחרי המשימה.

## 11 — סדר עבודה (לתוך ה-implementation plan)

המתן ל-implementation plan שייכתב בנפרד דרך `superpowers:writing-plans`. הסדר הצפוי בגדול:

1. שכבת Application — 12 use cases + טיפוסים + טסטים. בלי תלות ב-UI.
2. שכבת Infrastructure — מימוש מתודות follow + `setPrivacyMode` + `mapFollowError`. typecheck ירוק.
3. סאב־רכיבי UI משותפים. ריפקטור `(tabs)/profile.tsx` לשימוש בהם — בדיקה שהחזות זהה.
4. ריבילד `user/[handle]/index.tsx` כפרופיל מלא.
5. רשימות `followers.tsx` + `following.tsx`.
6. `settings/index.tsx` + `settings/privacy.tsx` + `settings/follow-requests.tsx`.
7. עדכוני SRS + PROJECT_STATUS + TECH_DEBT.
8. ידנית: ארבעת המסלולים מ-§10. צילומי מסך.

PR אחד, branch אחד: `feat/FR-FOLLOW-001-following-and-other-profile`. (אין lane FE/BE — agent יחיד.)
