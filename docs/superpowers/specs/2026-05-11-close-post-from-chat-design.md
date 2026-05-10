# P1.2 — Close Post From Chat Design Spec

> תאריך: 2026-05-11 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש · FR refs: FR-CHAT-014 (new), FR-CHAT-015 (new), FR-CHAT-004 (extension), FR-CLOSURE-001 (extension)

## 1 — בעיה ומטרה

הקישור בין פוסט לשיחה כבר נשמר בדאטה (`Chat.anchorPostId` נקבע אוטומטית כש-`contactPoster` פותח שיחה דרך "💬 שלח הודעה למפרסם"), וגם המנגנון "first-anchor-wins" כבר עובד — כך שלכל זוג משתמשים יש בדיוק שיחה אחת מעוגנת לפוסט הראשון שהפעיל אותה. אבל ה-UI של הצ'אט לא חושף את הקישור הזה: אין אינדיקציה לפוסט המעוגן, ואין שום פעולה עליו מתוך הצ'אט. בעלי פוסט שמתכתבים עם מתעניין נאלצים לחזור למסך הפוסט כדי לסמן "נמסר", וזה חיכוך משמעותי בנקודה הקריטית ביותר במשפך — סגירת הפוסט (המדד המרכזי של ה-MVP).

המטרה: לחשוף את הפוסט המעוגן ככרטיס דביק בכותרת השיחה, ולאפשר לבעלים לסגור את הפוסט ישירות מתוך הצ'אט בלחיצה אחת (שתפתח את חלון הסגירה הקיים עם מילוי-מראש של הצד השני בתור הנמען). כך מקצרים את המסלול מ"שיחה הסתיימה" ל"פוסט סגור" משלושה מסכים לאישור אחד.

## 2 — החלטות (מתוך ה-brainstorming)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | מי רואה את הכרטיס? | **שני הצדדים** רואים כרטיס פוסט בכותרת הצ'אט. פעולת סגירה זמינה רק לבעלים; הצד השני רואה הכרטיס כקישור לפוסט. |
| Q2 | זרימת הסגירה מהצ'אט | **חלון הסגירה הקיים** (`startClosure`) נפתח עם "נמסר" מסומן מראש ושדה הנמען ממולא בצד השני של הצ'אט; הבעלים יכול לשנות לפני אישור. |
| Q3 | מתי הכרטיס נעלם | **בכל מצב שאינו `open`** (`closed_delivered`, `deleted_no_recipient`, `removed_admin`, `expired`, או anchor חסר). אין "כרטיס נסגר" — פשוט נעלם. |
| Q4 | הודעות מערכת אחרי סגירה | **כן, בכל הצ'אטים המעוגנים.** בצ'אט ששימש לסגירה: "הפוסט סומן כנמסר ✓ · תודה!". בצ'אטים אחיים: "הפוסט נמסר למשתמש אחר". במסלול "לא נמסר": "המפרסם סגר את הפוסט — הפריט לא נמסר". |
| Q5 | תקפות מקור הסגירה | הזרקת הודעות-המערכת ועדכון הכרטיס תקפים **גם** כשהסגירה מבוצעת ממסך הפוסט עצמו (לא רק מהצ'אט). מקור-בלתי-תלוי באירוע "פוסט נסגר". |

## 3 — ארכיטקטורה

### 3.1 שכבת Domain (`packages/domain`) — אפס שינויים

הכל קיים: `Chat.anchorPostId`, `PostStatus`, `Message` (כולל אפשרות להודעות-מערכת אם תוסף `kind`/`system` — ראו 3.2).

### 3.2 שכבת Application (`packages/application`)

**Use case חדש:**

| קובץ | תפקיד | מקור FR |
|------|-------|---------|
| `chat/GetAnchoredPostUseCase.ts` | קלט: `anchorPostId \| null`. החזרה: `Post \| null`. משמש את `useAnchoredPost` ב-UI. | FR-CHAT-014 AC1 |

**`MarkAsDeliveredUseCase` — ללא שינוי בחתימה.** הוא ממשיך לקרוא ל-`postRepo.close(postId, recipientUserId)`. ההזרקה של הודעות-המערכת קורית בתוך ה-RPC ברמת הדאטה בייס (ראו §3.3), כך שה-use case לא נטען עם תלות חדשה ב-`IChatRepository`. אטומיות מובטחת כי הזרקת ההודעות מתבצעת באותה טרנזקציה כמו ה-close.

### 3.3 שכבת Infrastructure (`packages/infrastructure-supabase`)

**מיגרציה חדשה:** `0017_post_closed_system_messages.sql`

- שדה `kind` ל-`messages` (אם לא קיים): `enum {'user', 'system'}`, ברירת מחדל `'user'`. RLS: system messages נראים לכל המשתתפים של הצ'אט (כמו הודעות רגילות) אבל בלוק כתיבה/עריכה למשתמשי קצה (רק `service_role` או RPC חתום יוצרים אותן).
- פונקציית helper פנימית: `inject_system_messages_for_post_close(p_post_id uuid, p_recipient_user_id uuid)` — מאתרת את כל הצ'אטים עם `anchor_post_id = p_post_id`, ומזריקה לכל אחד `messages` row עם `kind = 'system'` ו-body מתאים (טקסט שונה לצ'אט של הנמען לעומת "אחי", או טקסט אחיד למסלול "לא נמסר" שבו `p_recipient_user_id IS NULL`).
- ה-helper נקרא **בתוך** ה-RPCs הקיימים `close_post_with_recipient` *וגם* `close_post_without_recipient` (או הווריאנט המקביל המטפל ב-`recipient = null`). אטומיות: אם הזרקת ההודעות נכשלת, הסגירה מתבטלת.
- אם בקוד הקיים קיימת רק RPC אחת עם פרמטר `recipient nullable`, ה-helper נקרא תמיד בסוף אותו blok.

**אדפטר:** אין שינוי ב-`SupabaseChatRepository` — ה-fan-out הוא ברמת ה-DB.

### 3.4 שכבת UI (`packages/ui` + `apps/mobile`)

**רכיב חדש:** `apps/mobile/src/components/chat/AnchoredPostCard.tsx`

- ממוקם כ-sticky מתחת לכותרת הצ'אט הקיימת, מעל ה-`FlatList` של ההודעות.
- מקבל: `anchorPostId: string | null`, `viewerId: string`.
- שולף את הפוסט דרך `useAnchoredPost(anchorPostId)` (hook חדש שנשען על `GetAnchoredPostUseCase`).
- מציג רק אם `post && post.status === 'open'`. בכל מקרה אחר — `null` (הכרטיס נעלם לחלוטין).
- תוכן: תווית סוג הפוסט (תגית בסגנון הקיים), כותרת/שורה ראשונה חתוכה, ואזור פעולה ימני:
  - **בעלים** (`post.ownerId === viewerId`): כפתור ראשי "סמן כנמסר ✓" → מפעיל `startClosure(post.postId, ownerId, post.type, { preselectedRecipientId: counterpartId })`.
  - **צד שני**: כל הכרטיס לחיץ ופותח את `/post/[id]`.

**Hook חדש:** `apps/mobile/src/hooks/useAnchoredPost.ts`

- realtime subscribe לעדכוני `posts` שמסוננים לפי `id = anchorPostId` (משתמש בקיים `useSupabaseRealtime` או דומה).
- כך הכרטיס נעלם מיד גם בצ'אטים האחיים כשהבעלים סוגר ממקום אחר.

**הרחבת `OwnerActionsBar` / `startClosure`:**

- `startClosure(postId, ownerId, postType, options?: { preselectedRecipientId?: string })`.
- בתוך החלון הקיים: אם `preselectedRecipientId` נשלח, ה-`recipientPicker` נטען עם בחירה מוקדמת ב-`option B` ("נמסר"), והנמען מסומן מראש. הבעלים יכול לשנות ל-`option A` ("לא נמסר") או לבחור נמען אחר מהרשימה.

**שילוב במסך הצ'אט:**

`apps/mobile/app/chat/[id].tsx` — ה-`useChatInit` כבר טוען את ה-`Chat`. מוסיפים מתחת לכותרת:

```tsx
<AnchoredPostCard
  anchorPostId={chat.anchorPostId}
  viewerId={authUser.id}
/>
```

ה-`AnchoredPostCard` הוא היחיד שאחראי על display logic (כולל החזרת `null`); ה-screen לא צריך לדעת על סטטוס הפוסט.

**הסרת `useAnchorMissing`:** ה-hook הקיים שמציג באנר "הפוסט המעוגן אינו זמין עוד" (FR-CHAT-004 edge case) מוחלף בלוגיקה החדשה — כש-anchor חסר, פשוט אין כרטיס. ה-banner מוסר. *תיעוד:* יש לעדכן את ה-AC ב-`07_chat.md` (ראו §5).

### 3.5 הודעות-מערכת ב-UI

**רכיב חדש:** `apps/mobile/src/components/chat/SystemMessageBubble.tsx`

- מוצג כשורה ממורכזת, רקע אפור בהיר, טקסט קטן יותר. ללא avatar, ללא timestamp בולט.
- מופעל כש-`message.kind === 'system'`.
- הטיפול ברינדור ב-`MessageList` הקיים: בודק `kind` ומחזיר `SystemMessageBubble` במקום `MessageBubble` הרגיל.

## 4 — מיפוי דרישות

### FR חדש: FR-CHAT-014 — Anchored-post card in chat

**Description.** A persistent card showing the anchored post is displayed at the top of an anchored chat for both participants.

**Acceptance Criteria.**
- AC1. כשל-`Chat` יש `anchor_post_id`, וה-`Post` קיים ובסטטוס `open`: מוצג כרטיס דביק מתחת לכותרת הצ'אט עם תווית סוג, כותרת, ופעולה מימין.
- AC2. בעלי הפוסט רואים כפתור "סמן כנמסר ✓" באזור הפעולה. הצד השני רואה כל הכרטיס כלחיץ ופותח את מסך הפוסט.
- AC3. כש-`post.status !== 'open'` (כולל `closed_delivered`, `deleted_no_recipient`, `removed_admin`, `expired`): הכרטיס לא מוצג כלל.
- AC4. כש-`anchor_post_id` הוא `null`: הכרטיס לא מוצג.
- AC5. שינויי סטטוס בפוסט (sync או realtime) משתקפים בכרטיס מיידית — אם הפוסט נסגר ממקום אחר בזמן שהצ'אט פתוח, הכרטיס נעלם בלי רענון ידני.

### FR חדש: FR-CHAT-015 — Close post from chat

**Description.** The post owner can mark a post as delivered directly from the anchored chat, with the chat counterpart pre-filled as the recipient.

**Acceptance Criteria.**
- AC1. לחיצה על "סמן כנמסר ✓" בכרטיס פותחת את חלון הסגירה הקיים (`startClosure`) עם "נמסר" מסומן מראש ושדה הנמען ממולא ב-`counterpartId`.
- AC2. הבעלים יכול לשנות את הנמען או לעבור למסלול "לא נמסר" לפני האישור הסופי.
- AC3. אחרי אישור: הפוסט עובר ל-`closed_delivered` (או `deleted_no_recipient`), הכרטיס נעלם בכל הצ'אטים המעוגנים, והודעת מערכת מוזרקת (ראו AC4-AC6).
- AC4. **בצ'אט ששימש לסגירה, מסלול "נמסר":** הזרקת system message — "הפוסט סומן כנמסר ✓ · תודה!".
- AC5. **בצ'אטים אחיים (מעוגנים לאותו פוסט), מסלול "נמסר":** הזרקת system message — "הפוסט נמסר למשתמש אחר".
- AC6. **בכל הצ'אטים המעוגנים, מסלול "לא נמסר":** הזרקת system message — "המפרסם סגר את הפוסט — הפריט לא נמסר".
- AC7. הזרקת ההודעות תקפה גם כאשר הבעלים סוגר את הפוסט ממסך הפוסט עצמו (לא רק דרך הצ'אט) — אותה לוגיקת fan-out, אותה הודעה (פרט לכך שאין "צ'אט ששימש לסגירה" → כל הצ'אטים מקבלים את הטקסט ה"אחי").

### הרחבת FR-CHAT-004 — Conversation context anchoring

- **Edge Case שעודכן:** "The anchored post is later deleted/closed: the anchored-post card is hidden. Existing messages (including system messages from the closure event) remain."
- ה-banner הישן ("The original post is no longer available") מוסר.

### הרחבת FR-CLOSURE-001 — Mark as delivered

- **חדש AC:** "On successful close (regardless of trigger location — post detail or chat), the system fans out to every `Chat` with `anchor_post_id = postId` and injects a system message describing the outcome (see FR-CHAT-015 AC4-AC6)."

## 5 — קבצי SSOT לעדכון

| קובץ | שינוי |
|------|-------|
| `docs/SSOT/SRS/02_functional_requirements/07_chat.md` | הוספת FR-CHAT-014, FR-CHAT-015. עדכון FR-CHAT-004 edge case. |
| `docs/SSOT/SRS/02_functional_requirements/05_closure_and_reopen.md` | הוספת AC ל-FR-CLOSURE-001 (fan-out). |
| `docs/SSOT/PROJECT_STATUS.md` | הוספת שורת sprint board: `P1.2 — Close post from chat` (Owner: agent יחיד, Status: 🟡 In progress). |
| `docs/SSOT/HISTORY.md` | לאחר merge — לוג קצר. |

## 6 — בדיקות

**Vitest (Application — `packages/application/__tests__`):**

- `GetAnchoredPostUseCase`: input `null` → output `null`; input `postId` תקין → output `Post`; pass-through ל-`postRepo.getById`.
- `MarkAsDeliveredUseCase`: ללא שינוי בטסטים הקיימים (אין התנהגות חדשה ברמת ה-application).

**Vitest (UI — מטריקס החלטות של `AnchoredPostCard`):**

- מטריקס `(post.status, viewer === owner) → rendered output`. 10 תאים (5 סטטוסים × 2 viewers). 8 מחזירים `null`. 1 מחזיר card עם close button (owner + open). 1 מחזיר card לחיץ ללא close button (non-owner + open).
- Edge: `anchorPostId === null` → `null`.
- Edge: `post === null` (לא נטען / נמחק לחלוטין) → `null`.

**Integration (Supabase — `packages/infrastructure-supabase/__tests__`):**

- ה-RPC `close_post_with_recipient` עם 2 צ'אטים אחים מעוגנים לפוסט: אחרי קריאה עם `recipient = userA`, צ'אט A מקבל system message "הפוסט סומן כנמסר ✓ · תודה!", וצ'אט B מקבל "הפוסט נמסר למשתמש אחר".
- ה-RPC במסלול "לא נמסר" (recipient = null): שני הצ'אטים מקבלים "המפרסם סגר את הפוסט — הפריט לא נמסר".
- אטומיות: אם הזרקת ההודעות נכשלת (סימולציה), `posts.status` לא משתנה.
- RLS: משתמש שאינו משתתף בצ'אט לא רואה את ה-system messages; משתתפים רואים אותן ב-`SELECT` רגיל.

**UI (manual + preview):**

- פותחים שיחה מפוסט פעיל → רואים כרטיס עם close button (לבעלים) או clickable card (לצד השני).
- סוגרים את הפוסט דרך הצ'אט → הכרטיס נעלם, הודעת מערכת מופיעה.
- סוגרים את הפוסט ממסך הפוסט → גם הכרטיס בצ'אט נעלם בזמן אמת (realtime).
- פותחים צ'אט שעוגן לפוסט שכבר נסגר → אין כרטיס, אבל יש את ה-system message ההיסטורית.

## 7 — Tech debt שייסגרו / שייפתחו

**ייסגרו:** אין (פיציר חדש).

**ייפתחו (אם רלוונטי):**

- *פוטנציאלי TD חדש:* הודעת מערכת לא מתורגמת ל-i18n אם נגדיר אותה כ-string קבוע ב-RPC. אם נשים אותה בעברית קשיחה בעת ההזרקה, יש debt עתידי לוקליזציה. **החלטה:** טקסטים בעברית קשיחה ב-MVP, TD חדש (`TD-148: System messages need i18n`) לעתיד.

## 8 — סיכונים והנחות

- **הנחה:** ל-`messages` table יש שדה `kind` או יוסף כעת. אם השדה לא קיים, המיגרציה תוסיף אותו + default `'user'` לרשומות קיימות.
- **סיכון:** Realtime subscriptions לעדכוני post status יכולים להתפספס במקרי קצה (איבוד חיבור). **מיטיגציה:** `useAnchoredPost` עושה גם re-fetch on focus + on app foreground.
- **סיכון:** Fan-out להזרקת system messages לפוסט עם הרבה צ'אטים אחים (>50) יכול להאט את ה-`close` RPC. **מיטיגציה:** ב-MVP זה לא צפוי. אם יקרה — להעביר ל-async edge function.
- **הנחה:** התרגום של "הפוסט נמסר למשתמש אחר" שומר על פרטיות הנמען (לא חושף שם). הסכמנו על זה במפורש.

## 9 — מה לא בסקופ

- התראות push על אירוע "הפוסט נמסר" (TD-115 / FR-NOTIF נפרד).
- אפשרות לצד השני "לבקש סגירה" מהבעלים (לא בתכנון; דחוי).
- קישור הפוך — מסך הפוסט מציג כמה צ'אטים פעילים יש (לא בסקופ פיציר; אולי בעתיד דרך FR-POST-STATS).
- שינוי טקסט ה-`auto-message` של FR-CHAT-005 — נשאר כפי שהוא.
