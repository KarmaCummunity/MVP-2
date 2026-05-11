# P1.2.x — מחזור חיים של עיגון פוסט לצ'אט (Anchor Lifecycle)

> תאריך: 2026-05-11 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש · FR refs: FR-CHAT-014 (extension), FR-CHAT-015 (extension), FR-CLOSURE-001 (extension)

## 1 — בעיה ומטרה

המנגנון הקיים (P1.9, commit `c7d9b0b`) מציג כרטיס פוסט מעוגן בראש הצ'אט וכפתור סגירה מתוכו (FR-CHAT-014/015). הוא עובד **רק** עבור צ'אטים שזה עתה נוצרו: ב-`SupabaseChatRepository.findOrCreateChat`, ה-`anchor_post_id` נכתב בעת INSERT אבל **לא מתעדכן** כשהפונקציה משתמשת מחדש בצ'אט קיים בין אותם שני משתמשים.

תוצאה: ברגע שצ'אט בין שני משתמשים קיים, כל לחיצה עתידית על "💬 שלח הודעה למפרסם" מפוסט אחר תוביל לאותו צ'אט עם `anchor_post_id` ישן (או שמצביע לפוסט שכבר נסגר) — והכרטיס לא מופיע, גם כשמשתמש זה עתה נכנס דרך פוסט פתוח. הסימפטום שדווח: "נכנסתי לצ'אט מפוסט חדש, נראה כמו שיחה רגילה, אין כרטיס בראש".

המטרה: הצ'אט "ידבק" תמיד לפוסט שממנו המשתמש נכנס בפעם האחרונה, וייכבה לאחר סגירת פוסט כדי לאפשר עיגון נקי בכניסה הבאה.

## 2 — החלטות (מתוך ה-brainstorming)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | מה קורה כשמשתמש נכנס לצ'אט קיים מפוסט חדש? | **עיגון מחדש** ל-`anchor_post_id` של הפוסט הנוכחי. הכרטיס תמיד משקף את הפוסט האחרון שממנו נכנסו. |
| Q2 | האם לנקות `anchor_post_id` כשהפוסט נסגר? | **כן.** מיד אחרי שליחת ה-system messages, ה-anchor של כל הצ'אטים שעוגנו לפוסט הזה מנוקה ל-null. |
| Q3 | האם להוסיף ריבוי-עיגונים (carousel של כמה פוסטים)? | **לא.** דחוי — מורכבות UX/סכמה. כרטיס יחיד מספיק ל-MVP. |
| Q4 | האם להוסיף system message "החלפנו לדבר על פוסט Y" בעת re-anchor? | **לא.** הכרטיס הוויזואלי עצמו הוא הסימן. הוספת הודעת מערכת תזהם את ה-history. |
| Q5 | מה קורה אם הצד השני מעגן מחדש בזמן שאני בתוך הצ'אט? | **מנוי realtime על שורת ה-chat** מרענן את ה-Chat object → הכרטיס מתחלף ללא רענון ידני. |

## 3 — ארכיטקטורה

### 3.1 שכבת Domain (`packages/domain`) — אפס שינויים

`Chat.anchorPostId: string | null` קיים. אין שינוי בחוזה.

### 3.2 שכבת Application (`packages/application`) — אפס שינויים

`OpenOrCreateChatUseCase.execute({ viewerId, otherUserId, anchorPostId? })` כבר מעביר את `anchorPostId` לפורט. החוזה של `IChatRepository.findOrCreateChat(a, b, anchorPostId?)` נשאר זהה — ההתנהגות מאחורי האדפטר היא שמשתנה.

`MarkAsDeliveredUseCase` ללא שינוי — ניקוי ה-anchor קורה ב-trigger ברמת הדאטה בייס.

### 3.3 שכבת Infrastructure (`packages/infrastructure-supabase`)

#### 3.3.1 מיגרציה חדשה — `0026_chat_anchor_lifecycle.sql`

מטרה: ניקוי `chats.anchor_post_id` כשהפוסט המעוגן נסגר.

מאחר ש-`0021_post_closure_emit_system_messages.sql` כבר מגדיר `posts_emit_closure_system_messages()` כ-`AFTER UPDATE OF status` trigger, יש שתי אופציות. הבחירה: **שינוי הפונקציה הקיימת** (ולא יצירת trigger חדש מקביל) כדי לשמור על אטומיות וטרנזקציה אחת לכל ההשפעות של סגירת פוסט.

המיגרציה תעשה:
```sql
-- 0026_chat_anchor_lifecycle.sql
create or replace function public.posts_emit_closure_system_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- ... כל הקוד הקיים מ-0021 ...
begin
  -- (1) השליחה הקיימת של system messages לכל הצ'אטים המעוגנים — בלי שינוי.
  -- ...

  -- (2) חדש: ניקוי anchor_post_id בכל הצ'אטים שעוגנו לפוסט הסגור.
  if (old.status = 'open' and new.status in ('closed_delivered', 'deleted_no_recipient')) then
    update public.chats
       set anchor_post_id = null
     where anchor_post_id = new.post_id;
  end if;

  return new;
end;
$$;
```

חשוב: הניקוי קורה **אחרי** שליחת ה-system messages, כך שה-SELECT של "כל הצ'אטים המעוגנים" עדיין מוצא אותם.

המיגרציה לא נוגעת ב-RLS — קיימת כבר policy שמאפשרת UPDATE על `chats` רק למשתתפים, אבל מאחר וזה `SECURITY DEFINER` הוא רץ עם הרשאות root.

#### 3.3.2 תיקון `SupabaseChatRepository.findOrCreateChat`

**קובץ:** `packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`

הלוגיקה הנוכחית (שורות ~43–50):
```typescript
const existing = await this.client
  .from('chats')
  .select('*')
  .eq('participant_a', a)
  .eq('participant_b', b)
  .maybeSingle();
if (existing.error) throw mapChatError(existing.error);
if (existing.data) return rowToChat(existing.data);  // BUG: לא מעדכן anchor
```

החלפה ל:
```typescript
const existing = await this.client
  .from('chats')
  .select('*')
  .eq('participant_a', a)
  .eq('participant_b', b)
  .maybeSingle();
if (existing.error) throw mapChatError(existing.error);

if (existing.data) {
  const needsReanchor =
    anchorPostId !== undefined &&
    anchorPostId !== null &&
    existing.data.anchor_post_id !== anchorPostId;

  if (!needsReanchor) return rowToChat(existing.data);

  const updated = await this.client
    .from('chats')
    .update({ anchor_post_id: anchorPostId })
    .eq('chat_id', existing.data.chat_id)
    .select('*')
    .single();
  if (updated.error) throw mapChatError(updated.error);
  return rowToChat(updated.data);
}

// המסלול הקיים של INSERT — ללא שינוי
```

מאפיינים:
- **כניסה ללא anchor** (למשל מ-inbox) → לא נוגע ב-anchor הקיים.
- **כניסה עם anchor זהה** → אין UPDATE מיותר (חיסכון בכתיבה ובאירועי realtime).
- **כניסה עם anchor שונה** → UPDATE יחיד ומחזיר את השורה המעודכנת.

#### 3.3.3 פיקסצ'ר ב-`fakeSupabase` (אם קיים)

אם הסביבת-טסט המקומית משתמשת ב-mock של supabase (`packages/infrastructure-supabase/src/test/`), יש לוודא שהוא תומך ב-UPDATE על `chats` כדי שיתפסו טסטי האדפטר.

### 3.4 שכבת UI (`apps/mobile`)

#### 3.4.1 מנוי realtime על שורת ה-chat

**קובץ:** `apps/mobile/src/hooks/useChatInit.ts` (או היכן ש-Chat נטען וקיים כ-state).

מצב נוכחי: הקריאה ל-`chatRepo.findById(chatId)` קורית פעם אחת בעת mount. אם הצד השני מעגן מחדש (UPDATE על `chats`) — המסך הזה לא יראה את השינוי עד reload.

תוספת:
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`chat-${chatId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'chats',
      filter: `chat_id=eq.${chatId}`,
    }, (payload) => {
      // refetch chat row
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] });
    })
    .subscribe();
  return () => { channel.unsubscribe(); };
}, [chatId]);
```

(התחביר הסופי מותאם לדפוס ה-realtime הקיים בפרויקט — ראו `apps/mobile/src/components/chat/AnchoredPostCard.tsx` L44–59 כדפוס סובסקריפשן ל-messages.)

#### 3.4.2 `contactPoster` ו-`AnchoredPostCard` — ללא שינוי

קריאה קיימת ב-`apps/mobile/src/lib/contactPoster.ts` כבר מעבירה `anchorPostId: post.postId` נכון. גם ה-`AnchoredPostCard` כבר מתנהג נכון: כשה-Chat object שמתקבל יכלול את ה-`anchorPostId` המעודכן, הכרטיס יופיע.

## 4 — תוכנית מימוש

מיושם כענף יחיד `fix/P1.2.x-chat-anchor-lifecycle` עם PR יחיד. נקלט אחרי שלב 5.

### שלב 1 — מיגרציה (DB)
- כתיבת `supabase/migrations/0026_chat_anchor_lifecycle.sql` (`CREATE OR REPLACE FUNCTION`).
- בדיקה ידנית ב-Supabase Studio: יצירת פוסט + 2 צ'אטים מעוגנים + סגירה → אימות ש-`anchor_post_id` נכבה בשני הצ'אטים.

### שלב 2 — אדפטר
- עדכון `findOrCreateChat` ב-`SupabaseChatRepository.ts`.
- טסט יחידה (אם יש fakeSupabase): scenario re-anchor, scenario anchor זהה, scenario no anchor.

### שלב 3 — UI realtime
- הוספת subscription ב-`useChatInit.ts` (או הקובץ המקביל בקודבייס).
- אימות ידני: שני taps על אותו צ'אט משני מכשירים, anchor משתנה ב-A, B רואה את הכרטיס מתחלף.

### שלב 4 — בדיקות אינטגרציה
- E2E ידני בדפדפן (`pnpm --filter @kc/mobile web`):
  1. משתמש A פותח פוסט P1 של B → "שלח הודעה" → צ'אט נפתח עם כרטיס P1.
  2. A חוזר ל-feed, פותח פוסט P2 של B → "שלח הודעה" → אותו צ'אט נפתח, כרטיס מציג P2 (לא P1).
  3. B (הבעלים של P2) לוחץ "סמן כנמסר" בכרטיס → סגירת P2 → הכרטיס נעלם, system message מופיע.
  4. A פותח פוסט P3 של B → "שלח הודעה" → אותו צ'אט, כרטיס מציג P3 (לא P1 ולא P2).

### שלב 5 — תיעוד
- עדכון `docs/SSOT/SRS/02_functional_requirements/FR-CHAT-014.md` — הוספת AC חדש: "כניסה לצ'אט מפוסט עם anchor שונה מעדכנת את ה-anchor של הצ'אט לפוסט הנוכחי".
- עדכון `docs/SSOT/SRS/02_functional_requirements/FR-CLOSURE-001.md` — הוספת AC: "בסגירת פוסט, `anchor_post_id` של כל הצ'אטים המעוגנים אליו מנוקה ל-null".
- עדכון `docs/SSOT/PROJECT_STATUS.md` §3 — שורה חדשה ל-P1.2.x.
- עדכון `docs/SSOT/TECH_DEBT.md` — סגירת ה-TD הרלוונטי (ב-0017 יש הערה על העיגון; עכשיו זה נפתר).

## 5 — בדיקות

### 5.1 טסטים אוטומטיים
- **טסט use case** ב-`packages/application/src/__tests__/`: `OpenOrCreateChatUseCase.execute({anchorPostId})` קורא ל-`repo.findOrCreateChat(_, _, anchorPostId)` עם הערך הנכון.
- **טסט אדפטר** ב-`packages/infrastructure-supabase/src/test/`: שלושה מסלולים (insert חדש, reuse עם re-anchor, reuse בלי שינוי anchor).
- **טסט מיגרציה** ב-`supabase/tests/`: סקריפט pgTAP שמוודא ש-`anchor_post_id` מנוקה אחרי `UPDATE posts SET status='closed_delivered'`.

### 5.2 אימות ידני (UI)
- חובה לאמת את 4 התרחישים בסעיף 4 שלב 4 לפני סימון "done", לפי הזיכרון "ודא UI לפני סגירה".
- כלי: `pnpm --filter @kc/mobile web` + Chrome MCP/Playwright.

## 6 — סיכונים והקלות

| סיכון | הקלה |
|------|------|
| ה-trigger ב-`0022` נכשל באמצע טרנזקציה → השליחה של ה-system messages מתגלגלת אחורה. | פלאן B: יצירת trigger נפרד (`AFTER` שני) במקום `OR REPLACE`. אבל מומלץ להתחיל עם `OR REPLACE` ופלאן B רק אם בעיה ממשית עולה. |
| Race condition: שני משתמשים לוחצים בו-זמנית "שלח הודעה" מפוסטים שונים → UPDATE מתחרים על אותה שורת chat. | Postgres serializable level לא נדרש — `last write wins` סביר. ה-realtime subscription מבטיח ששני המסכים יראו את הערך הסופי. |
| Loop של realtime → invalidate → fetch → state update → realtime → ... | ה-subscription מאזין רק ל-UPDATE על `chats`, וה-fetch לא מבצע UPDATE. אין לולאה. |
| משתמש בלי visibility לפוסט (followers_only) רואה הודעת מערכת שמתייחסת לפוסט שאינו זמין לו. | `AnchoredPostCard` מטפל — אם `getPostByIdUseCase` מחזיר null, הכרטיס מוסתר. ה-system message נשאר textual ולא חושף פרטים רגישים. |

## 7 — לא בסקופ

- ❌ ריבוי-עיגונים (אופציה ג שדחתה ה-PM).
- ❌ system message "החלפנו לדבר על פוסט Y" בעת re-anchor (אופציה ב' שדחתה ה-PM).
- ❌ TD-119 (notification לנמען) — דחוי ל-P1.5.
- ❌ TD-120 (un-mark UI לנמען) — דחוי ל-P1.5.
- ❌ TD-148 (i18n של system message bodies) — דחוי.
- ❌ שינוי בחוזה הפורט `IChatRepository` — לא נדרש; ההתנהגות משתנה רק באדפטר.

## 8 — מיפוי FR ←→ קוד

| FR / AC | מקום במימוש |
|---------|-------------|
| FR-CHAT-014 AC1 (כרטיס מופיע כש-anchor set ופוסט פתוח) | `AnchoredPostCard.tsx` קיים; ה-fix מבטיח ש-anchor יהיה set נכון. |
| FR-CHAT-014 AC חדש (re-anchor בכניסה מפוסט אחר) | `SupabaseChatRepository.findOrCreateChat` §3.3.2. |
| FR-CHAT-015 AC7 (fan-out independence) | קיים ב-0021; ה-extension ב-0026 משלים את לאחר-הסגירה. |
| FR-CLOSURE-001 AC חדש (ניקוי anchor בסגירה) | מיגרציה `0026_chat_anchor_lifecycle.sql` §3.3.1. |
