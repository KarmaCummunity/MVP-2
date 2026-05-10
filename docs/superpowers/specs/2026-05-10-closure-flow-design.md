# P0.6 — Closure Flow Design Spec

> תאריך: 2026-05-10 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש · FR refs: FR-CLOSURE-001..005, 008, 009

## 1 — בעיה ומטרה

`closed_delivered` הוא ה-North Star Metric של ה-MVP. בלי זרימת סגירה אמיתית, המוצר מודד "פוסטים שנפתחו" ולא "אנשים שנעזרו". כל התשתית (סכמת הדאטה בייס, טריגרי סטטיסטיקה, RLS) כבר במקום מ-P0.2 — חסרה זרימת המשתמש שהופכת פוסט פתוח למסומן כנמסר ומאפשרת לבעלים לפתוח מחדש.

המטרה: לאפשר לבעלים לסגור פוסט בשני מסלולים (עם מקבל / בלי מקבל), בתהליך 3-שלבי שמכבד את הציפיות של המשתמש (סגירה רק אחרי מסירה פיזית), ולפתוח מחדש אם טעה. מונה הסטטיסטיקה האישית (`items_given_count` של הבעלים, `items_received_count` של המקבל) חייב לזוז בעקבות הפעולה — וזה כבר עובד אוטומטית דרך טריגרים קיימים.

## 2 — החלטות (מתוך ה-brainstorming)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | היקף ה-PR | FR-CLOSURE-001..005 + 008 + 009 (אימות). דוחים 006 (התראה), 007 (ביטול עצמי), 010 (דגל חשד). |
| Q2 | מבנה זרימת השלבים | Hybrid — Step 1+2 ב-מגירה אחת עם מעבר פנימי (כי הם תלויים זה בזה); Step 3 (הסבר חינוכי) מגירה נפרדת, חד-פעמית. |
| Q3 | אטומיות מעברי סטטוס | Hybrid — RPC לפעולות רב-טבלאיות (`close_post_with_recipient`, `reopen_post_marked`); UPDATE רגיל לחד-טבלאיות. |
| Q4 | פוסטים `deleted_no_recipient` שעברו 7 ימים | בונים את תזמון הניקוי האמיתי (FR-CLOSURE-008) — הם נעלמים מהדאטה בייס + מאחסון התמונות, לא רק מוסתרים באפליקציה. |

## 3 — ארכיטקטורה

### 3.1 שכבת Domain (`packages/domain`) — אפס שינויים

הכל קיים: `PostStatus` כולל `closed_delivered` ו-`deleted_no_recipient`; `User.closureExplainerDismissed`, `User.itemsGivenCount`, `User.itemsReceivedCount`; `Post.reopenCount`, `Post.deleteAfter`.

### 3.2 שכבת Application (`packages/application`)

**Use cases חדשים:**

| קובץ | תפקיד | מקור FR |
|------|-------|---------|
| `posts/MarkAsDeliveredUseCase.ts` | קלט: `postId`, `recipientUserId \| null`. בודק owner + status=open, קורא ל-`postRepo.close()`. | 003 AC5/AC6 |
| `posts/ReopenPostUseCase.ts` | קלט: `postId`. בודק owner + status ∈ {closed_delivered, deleted_no_recipient}. עבור deleted_no_recipient: בודק שלא עבר ה-grace. קורא ל-`postRepo.reopen()`. | 005 |
| `posts/GetClosureCandidatesUseCase.ts` | קלט: `postId`. מחזיר `User[]` ממוין לפי הודעה אחרונה — שותפי הצ'אט שהיו על הפוסט. | 003 AC1/AC2 |
| `auth/DismissClosureExplainerUseCase.ts` | מסמן `users.closure_explainer_dismissed = true`. | 004 AC3 |

**הוספות לממשקים (ports):**

```ts
// IPostRepository
getClosureCandidates(postId: string): Promise<ClosureCandidate[]>;
// (close + reopen כבר מוצהרים)

// IUserRepository
dismissClosureExplainer(userId: string): Promise<void>;
```

**שגיאות חדשות (PostError codes):**

```
ClosureNotOwner           // המבצע אינו בעלים
ClosureWrongStatus         // הפוסט כבר סגור / נמחק
ClosureRecipientNotInChat  // המקבל הנבחר לא היה בצ'אט על הפוסט
ReopenWindowExpired        // deleted_no_recipient שעבר ה-7 ימים
```

### 3.3 שכבת Infrastructure

**מיגרציה חדשה:** `0015_closure_rpcs.sql`

```sql
-- close_post_with_recipient: אטומי. בודק owner + status=open + recipient בצ'אט עוגן.
create or replace function public.close_post_with_recipient(
  p_post_id uuid, p_recipient_user_id uuid
) returns public.posts language plpgsql security invoker as $$
declare v_post public.posts;
begin
  -- guard: owner + open + recipient is a chat partner on this post
  -- mutate: insert recipients row → update posts.status='closed_delivered'
  -- triggers cascade: items_received +1 (recipients trigger), items_given +1 (posts trigger)
  -- raises P0001 with codes mapped to PostError on client side
end;
$$;

-- reopen_post_marked: אטומי. closed_delivered → open + מוחק recipients row.
create or replace function public.reopen_post_marked(p_post_id uuid)
returns public.posts ...

-- close_post_unmarked: UPDATE רגיל ב-client (לא RPC), set status='deleted_no_recipient', delete_after=now()+7d.
-- reopen של deleted_no_recipient בתוך grace: UPDATE רגיל, status='open', delete_after=null.
```

**מיגרציה נוספת:** `0016_closure_cleanup_cron.sql` — FR-CLOSURE-008.

```sql
-- 1. ודא extension pg_cron מופעל בפרויקט (אישור one-time בלוח Supabase).
-- 2. פונקציה: closure_cleanup_expired() — מוחקת פוסטים deleted_no_recipient
--    שעברו delete_after; cascade על recipients/media_assets רץ אוטומטית מ-FK.
-- 3. cron יומי ב-04:00 UTC.
-- 4. ניקוי תמונות באחסון: trigger AFTER DELETE on posts קורא ל-Edge Function
--    שמוחקת את ה-blobs ב-Storage. (חלופה: storage.objects RLS + DELETE רקורסיבי.)
-- 5. metric: closure_cleanup_deleted_total — לוג ב-pg + טבלת metrics_daily.
```

> ⚠️ הפעלת `pg_cron` ב-Supabase דורשת קליק במסך הניהול. צעד תפעולי, לא דאטה בייס במיגרציה. אעדכן את `OPERATOR_RUNBOOK.md`.

**שינויים בריפו'זיטוריז:**

- `SupabasePostRepository`:
  - `close(postId, recipientId)` — מסתעף בין ה-RPC ל-UPDATE לפי קיום המקבל.
  - `reopen(postId)` — מסתעף בין `reopen_post_marked` RPC ל-UPDATE לפי הסטטוס הנוכחי.
  - `getClosureCandidates(postId)` — `SELECT DISTINCT user FROM chats c JOIN messages m ON m.chat_id = c.chat_id WHERE c.anchor_post_id = $1 ORDER BY MAX(m.created_at) DESC`.
- `SupabaseUserRepository`:
  - `dismissClosureExplainer(userId)` — UPDATE column.

### 3.4 שכבת UI (`apps/mobile`)

**רכיבים חדשים:**

```
src/components/closure/
  ClosureSheet.tsx              — Step 1+2 hybrid (~150 LOC)
  ClosureExplainerSheet.tsx     — Step 3 חד-פעמי (~70 LOC)
  ReopenConfirmModal.tsx        — אישור פתיחה מחדש (~60 LOC)
  RecipientPickerRow.tsx        — שורה ברשימה (~50 LOC)
  OwnerActionsBar.tsx           — כפתורי בעלים על PostDetail (~60 LOC) — extraction מ-`post/[id].tsx`
src/store/closureStore.ts       — Zustand: composition root של ה-use cases (~80 LOC)
```

**שינויי קבצים קיימים:**

- `apps/mobile/app/post/[id].tsx`: extraction של כפתורי הבעלים ל-`<OwnerActionsBar>` + הוספת לוגיקת התצוגה (Mark/Reopen/none) ושליחה ל-store.
- `apps/mobile/app/(tabs)/profile.tsx` או `apps/mobile/src/components/profile/MyPostsList`: לשונית "סגורים" עם פוסטים `closed_delivered`+`deleted_no_recipient`. אם לשונית כזו לא קיימת — מוסיף.

**Composition root:** `apps/mobile/src/composition/posts.ts` (אם קיים) או חדש — חיבור use cases ל-repositories.

## 4 — חוויית משתמש (User Experience)

### 4.1 כפתורי הבעלים על PostDetail

| מצב פוסט | כפתור ראשי | כפתור משני |
|----------|------------|------------|
| `open` | "סמן כנמסר ✓" | "ערוך" / "מחק" (קיים) |
| `closed_delivered` | "📤 פתח מחדש" | — |
| `deleted_no_recipient` בתוך grace (delete_after > now) | "📤 פתח מחדש" | — |
| `deleted_no_recipient` אחרי grace | (לא רלוונטי — נמחק בתזמון) | — |
| לא-בעלים | אין כפתורי closure | — |

### 4.2 Step 1 — אישור מסירה (מגירה תחתונה)

```
🤝  האם הפריט באמת נמסר?

חשוב לסמן רק אחרי המסירה הפיזית — לא אחרי
תיאום בצ'אט. אם הפריט עדיין לא הגיע ליד מקבל,
אל תסמן.

[ביטול]                          [כן, נמסר ✓]
```

טלמטריה: על "כן, נמסר" שולחים `closure_step1_completed`.

### 4.3 Step 2 — בחירת מקבל (אותה מגירה, מעבר פנימי)

**מצב יש שותפי צ'אט:**

```
🎁  למי מסרת את הפריט?

בחר את האדם שקיבל מתוך מי שהיה איתך בצ'אט על
הפוסט הזה. אם המקבל לא היה בצ'אט — אפשר לסגור
בלי לסמן.

┌────────────────────────────────────────┐
│ ◯  דנה לוי                  תל-אביב    │
│ ◯  יוסי כהן                 גבעתיים    │
│ ◯  שרה אברהם               ראשל"צ      │
└────────────────────────────────────────┘
(ממוין: ההודעה האחרונה ראשונה)

[סגור בלי לסמן]              [סמן וסגור ✓]
                             (disabled עד בחירה)
```

**מצב empty (אין שותפי צ'אט):**

```
🎁  אין למי לסמן

עדיין לא היה צ'אט על הפוסט הזה. אפשר לסגור
בלי לסמן מקבל; הפוסט יישמר 7 ימים למקרה
שטעית, ואז יימחק אוטומטית.

[ביטול]                       [סגור בלי לסמן]
```

### 4.4 Step 3 — הסבר חד-פעמי (מגירה נפרדת)

מוצג רק אם `user.closureExplainerDismissed === false`. אחרי "הבנתי" עם תיבת הסימון מסומנת — הדגל בדאטה בייס מתעדכן ושוב לא יוצג.

```
✨  תודה שתרמת!

כך זה עובד:
• פוסטים שסומנו עם מקבל — נשמרים לתמיד
  ומופיעים בסטטיסטיקה שלך ושל המקבל.
• פוסטים שנסגרו בלי לסמן — נשמרים 7 ימים
  למקרה של טעות, ואז נמחקים אוטומטית.
• בכל מקרה — "פריטים שתרמתי" שלך עולה ב-1.

☐ אל תציג שוב

                                  [הבנתי]
```

### 4.5 פתיחה מחדש — אישור

**מ-`closed_delivered`:**

```
📤  לפתוח את הפוסט מחדש?

הפוסט יחזור להיות פעיל בפיד.
• הסימון של מי שקיבל יוסר.
• "פריטים שקיבלתי" שלו יקטן ב-1 (בלי התראה).
• "פריטים שתרמתי" שלך יקטן ב-1.

[ביטול]                          [פתח מחדש]
```

**מ-`deleted_no_recipient` בתוך grace:**

```
📤  לפתוח את הפוסט מחדש?

הפוסט יחזור להיות פעיל בפיד והוא לא יימחק.

[ביטול]                          [פתח מחדש]
```

### 4.6 לשונית "סגורים" ב-"הפוסטים שלי"

- מציגה `closed_delivered` ו-`deleted_no_recipient` (תוך grace בלבד — לאחר ה-cron הם כבר נמחקו).
- כל פוסט מציג תג סטטוס: "סומן כנמסר" / "נסגר ללא סימון — יימחק עוד X ימים".
- כפתור "📤 פתח מחדש" זמין על כל פוסט בלשונית.

## 5 — תרחישי קצה

| תרחיש | התנהגות |
|-------|---------|
| המקבל הנבחר חסום על-ידי הבעלים | RLS על recipients מאפשר insert (אין block check ברמת ה-FK), אבל ב-use case נסנן candidates שהם blocked. |
| המקבל מחק את החשבון | recipients.recipient_user_id `on delete cascade` → השורה תיעלם, items_given לא יושפע. ב-Step 2 הוא לא יופיע ב-candidates. |
| הבעלים מחק את החשבון בזמן closure | posts.owner_id `on delete cascade` → הפוסט נמחק, ה-flow נעצר. |
| race: שני clients מסמנים את הפוסט במקביל | ה-RPC עוטף ב-transaction; השני יקבל ConcurrencyError כי old.status != 'open'. |
| race: סגירה ופתיחה במקביל (FR-CLOSURE-007 future) | RPC serialization מבטיח אחד יזכה. במצב הנוכחי לא רלוונטי. |
| Reopen של deleted_no_recipient שעבר ה-grace בדיוק עכשיו | use case בודק `delete_after > now()`; אם פג — שגיאה ReopenWindowExpired (UI: "הפוסט כבר נמחק"). |
| pg_cron מחק פוסט בזמן שמשתמש פתח את הפוסט | feed query לא ימצא את הפוסט; PostDetail יראה 404. ה-app חייב לטפל ב-404. |
| מחיקת תמונות באחסון נכשלת | הפוסט נמחק מהדאטה בייס, התמונות נשארות יתומות. metric `closure_cleanup_orphaned_blobs_total`. TD חדש ל-reconciliation. |
| 5+ reopens של אותו פוסט | `posts.reopen_count` מתעדכן ב-RPC. דגל חשד (FR-CLOSURE-010) דחוי — לא יוצג למשתמש. |

## 6 — בדיקות

### 6.1 בדיקות יחידה (vitest, ללא דאטה בייס אמיתי)

קובץ אחד לכל use case, ב-`packages/application/src/posts/__tests__/`:

- `MarkAsDeliveredUseCase.test.ts`: עם מקבל / בלי / לא בעלים / status שגוי / מקבל לא בצ'אט.
- `ReopenPostUseCase.test.ts`: closed_delivered / deleted_no_recipient בתוך grace / מחוץ ל-grace / לא בעלים.
- `GetClosureCandidatesUseCase.test.ts`: יש שותפים / אין שותפים / מסונן blocked / סדר לפי recency.
- `DismissClosureExplainerUseCase.test.ts`: עדכון הדגל / כבר dismissed.

יעד: ~25 בדיקות חדשות שעוברות. סה"כ אחרי ה-PR: ~104 vitest.

### 6.2 אימות טריגרי סטטיסטיקה (FR-CLOSURE-009)

בדיקת אינטגרציה אחת ב-`supabase/__tests__/` (אם יש תיקייה כזו) או manual SQL run:
- צור פוסט פתוח → סגור עם מקבל → ודא items_given_count++ ו-items_received_count++.
- פתח מחדש → ודא items_given_count-- ו-items_received_count--.

### 6.3 אימות UI ידני (Web preview, ללא דילוג)

לפי מסמך הזיכרון: typecheck/lint לא תופסים בעיות RTL ו-layout. חובה:

- טען את `/post/[id]` של פוסט פתוח של המשתמש → לחץ "סמן כנמסר".
- מעבר Step 1 → Step 2 חלק.
- בחירת מקבל → "סמן וסגור" → רואים את Step 3.
- "אל תציג שוב" + "הבנתי" → אין יותר Step 3 בסגירה הבאה.
- חזור ל-PostDetail → רואים "📤 פתח מחדש".
- פתיחה מחדש → חזרה ל-status=open.
- ב-profile: items_given_count עלה ב-1 ואז ירד ב-1.

### 6.4 בדיקת ה-cron (FR-CLOSURE-008)

לא ב-CI. אימות חד-פעמי דרך `psql`: insert פוסט deleted_no_recipient עם delete_after=now()-1day → הפעל ידנית את `closure_cleanup_expired()` → ודא שנמחק + תמונות נמחקו.

## 7 — היקף ההגשה ותפעול

### 7.1 ענפים והגשה

- ענף יחיד: `feat/FR-CLOSURE-001-closure-flow`
- PR אחד מאוחד (לפי git-workflow.mdc — squash merge, auto-merge on green CI)
- מבנה commits מומלץ:
  1. `feat(contract): add IPostRepository.getClosureCandidates + IUserRepository.dismissClosureExplainer`
  2. `feat(closure): use cases + tests (FR-CLOSURE-001..005)`
  3. `feat(supabase): closure RPCs + repo impl (0015)`
  4. `feat(closure): cron cleanup job (0016, FR-CLOSURE-008)`
  5. `feat(mobile): closure sheets + reopen modal + CTAs`
  6. `docs: PROJECT_STATUS + HISTORY + TECH_DEBT updates`

### 7.2 עדכוני SSOT

- `PROJECT_STATUS.md`: P0.5 → 🟢 Done (תיקון מצב מיושן); P0.6 → 🟡 In progress → 🟢 Done; Last Updated.
- `HISTORY.md`: רשומה חדשה בראש הקובץ.
- `TECH_DEBT.md`: TDs חדשים — TD-119 (FR-CLOSURE-006 התראה), TD-120 (FR-CLOSURE-007 ביטול עצמי), TD-121 (FR-CLOSURE-010 דגל חשד), TD-122 (closure_cleanup_orphaned_blobs reconciliation).
- `OPERATOR_RUNBOOK.md`: סעיף הפעלת `pg_cron` בלוח Supabase.

### 7.3 דחויים — TDs חדשים

| TD | פירוט | יעד |
|----|-------|-----|
| TD-119 | FR-CLOSURE-006 — התראה Critical למקבל על סימון. תלוי ב-FR-NOTIF (P1.5). | P1.5 |
| TD-120 | FR-CLOSURE-007 — המקבל מבטל את הסימון של עצמו. | P2.x |
| TD-121 | FR-CLOSURE-010 — דגל חשד אחרי 5+ reopens. תלוי ב-FR-MOD-008. | P1.3 |
| TD-122 | closure_cleanup_orphaned_blobs — סנכרון תמונות שנשארו אחרי כשל מחיקה. | תחזוקה |

### 7.4 התקדמות

מותנה רק באישור הספק הזה ובאישור pg_cron בלוח Supabase (5-קליק).

---

## נספח — סיכום למוצר (TL;DR למנהל מוצר)

**מה המשתמש יקבל:**

1. כפתור "סמן כנמסר" על כל פוסט שלו שעדיין פעיל.
2. תהליך 3 שלבים פשוט: אישור שזה באמת נמסר → בחירת המקבל מתוך הצ'אטים → הסבר חד-פעמי.
3. אופציה "סגור בלי לסמן" כשאין מקבל מתאים — הפוסט יישמר 7 ימים ויימחק אוטומטית.
4. כפתור "פתח מחדש" שמתקן טעויות, כולל ביטול הסימון אם היה.
5. סטטיסטיקת "פריטים שתרמתי" / "פריטים שקיבלתי" מתעדכנת אוטומטית בכל פעולה.

**מה המשתמש לא יקבל בגרסה הזו (במודע):**

- 🔔 התראת push למקבל על הסימון (P1.5).
- ↩️ ביטול הסימון על-ידי המקבל עצמו (P2.x).
- 🚩 דגל אזהרה למנהלים על פוסטים שנפתחו 5+ פעמים (P1.3).

**מה ה-North Star Metric ירוויח:** ספירה אמיתית של "פריטים שנמסרו" — הפעם הראשונה שהמספר באמת ייווצר.
