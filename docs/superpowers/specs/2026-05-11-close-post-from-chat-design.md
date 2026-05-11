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

### 3.2 שכבת Application (`packages/application`) — ללא use cases חדשים

- `GetPostByIdUseCase` הקיים מספיק לטעינת הפוסט המעוגן. הקריאה ב-UI: `getPostByIdUseCase().execute({ postId: anchorPostId, viewerId })`.
- `MarkAsDeliveredUseCase` — ללא שינוי בחתימה ובלוגיקה. ההזרקה של הודעות-המערכת קורית ברמת הדאטה בייס ב-trigger (§3.3), כך שה-use case לא נטען עם תלות חדשה.

### 3.3 שכבת Infrastructure (`packages/infrastructure-supabase`)

**הקיים בסכמה:**
- `messages.kind text check (kind in ('user','system'))` — כבר קיים מאז `0004_init_chat_messaging.sql`.
- `messages.system_payload jsonb` — כבר קיים. אילוץ: system message חייב לכלול `system_payload`.
- RLS חוסם הכנסת `kind='system'` ע"י משתמשי קצה (`messages_insert_user` policy מתנה `kind = 'user'`). לכן ההזרקה חייבת לקרות מתוך `SECURITY DEFINER` function.
- דפוס קיים: `reports_emit_admin_system_message` ב-`0013_reports_emit_admin_message.sql` — `SECURITY DEFINER` trigger function שמזריקה `kind='system', sender_id=null, status='delivered', delivered_at=now()`.

**מיגרציה חדשה:** `0021_post_closure_emit_system_messages.sql`

- פונקציית trigger: `posts_emit_closure_system_messages()` — `SECURITY DEFINER`, מופעלת `AFTER UPDATE OF status ON posts`.
- היא רצה רק עבור two transitions: `old.status='open' AND new.status='closed_delivered'`, או `old.status='open' AND new.status='deleted_no_recipient'`. כל מעבר אחר (כולל `removed_admin`, `expired`, או reopen) — `RETURN NEW;` בלי פעולה.
- במסלול `closed_delivered`: שולפת את `recipient_user_id` מטבלת `recipients` (שכבר הוכנסה ע"י ה-RPC לפני שינוי הסטטוס). לכל chat עם `anchor_post_id = NEW.post_id`: אם המשתתף שאינו ה-owner שווה ל-`recipient_user_id` → טקסט "הפוסט סומן כנמסר ✓ · תודה!"; אחרת → טקסט "הפוסט נמסר למשתמש אחר".
- במסלול `deleted_no_recipient`: לכל chat עם `anchor_post_id = NEW.post_id` → טקסט "המפרסם סגר את הפוסט — הפריט לא נמסר".
- `system_payload jsonb` כולל: `{kind: 'post_closed', post_id, status, recipient_user_id}` (recipient_user_id רק במסלול delivered, ורק עבור הצ'אט של הנמען עצמו — שאר ה-payloads מקבלים `recipient_user_id: null` כדי לא להדליף זהות).

**יתרונות הגישה ב-trigger:**
- אטומיות מלאה — קורית באותה טרנזקציה כמו ה-UPDATE.
- מקור-בלתי-תלוי — תקף גם כש-FE עושה plain UPDATE (`deleted_no_recipient`), גם כש-FE קורא ל-RPC (`closed_delivered`), וגם בכל מקור עתידי שיעדכן את הסטטוס.
- אפס שינויים ב-RPCs הקיימים (`close_post_with_recipient`, וכו').

**אדפטר:** אין שינוי ב-`SupabaseChatRepository`. אין שינוי ב-`SupabasePostRepository`.

### 3.4 שכבת UI (`packages/ui` + `apps/mobile`)

**רכיב חדש:** `apps/mobile/src/components/chat/AnchoredPostCard.tsx`

- ממוקם כ-sticky מתחת לכותרת הצ'אט הקיימת, מעל ה-`FlatList` של ההודעות.
- מקבל: `anchorPostId: string | null`, `viewerId: string`.
- שולף את הפוסט דרך `useAnchoredPost(anchorPostId)` (hook חדש שנשען על `GetAnchoredPostUseCase`).
- מציג רק אם `post && post.status === 'open'`. בכל מקרה אחר — `null` (הכרטיס נעלם לחלוטין).
- תוכן: תווית סוג הפוסט (תגית בסגנון הקיים), כותרת/שורה ראשונה חתוכה, ואזור פעולה ימני:
  - **בעלים** (`post.ownerId === viewerId`): כפתור ראשי "סמן כנמסר ✓" → מפעיל `startClosure(post.postId, ownerId, post.type, { preselectedRecipientId: counterpartId })`.
  - **צד שני**: כל הכרטיס לחיץ ופותח את `/post/[id]`.

**Reactivity ללא hook נפרד:** `AnchoredPostCard` משתמש ב-`useQuery({ queryKey: ['post', anchorPostId, viewerId] })` (אותו key שב-`app/post/[id].tsx`). כשנכנסת system message חדשה מסוג `post_closed` ל-thread של הצ'אט (זוהה דרך `useChatStore`), הרכיב קורא ל-`queryClient.invalidateQueries` על אותו key — והכרטיס נעלם מיד. אין צורך ב-realtime subscription נפרד לטבלת `posts`, כי ה-trigger כבר מבטיח שהסגירה מלווה תמיד ב-system message שה-chat realtime ממילא מספק.

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

### 3.5 הודעות-מערכת ב-UI — ללא רכיב חדש

`MessageBubble.tsx` הקיים (שורות 16-25) כבר מטפל ב-`m.kind === 'system'` ומציג כדור-מידע ממורכז עם אייקון `information-circle-outline`. ההודעות שלנו ייכנסו לאותו pill. אין שינוי ברנדרר.

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

**Vitest (Application):** ללא טסטים חדשים. `MarkAsDeliveredUseCase.test.ts` ממשיך לכסות את חוזה ה-use case. `GetPostByIdUseCase.test.ts` הקיים מכסה את טעינת הפוסט.

**Mobile app:** אין תשתית בדיקות אוטומטית (typecheck בלבד). אימות ידני דרך ה-preview (ראו Plan, Task 7).

**Database (Supabase):** אין תשתית pgTAP בפרויקט. אימות ידני דרך SQL editor (ראו Plan, Task 1 Step 5):

- שני צ'אטים אחים מעוגנים לפוסט; קריאה ל-`close_post_with_recipient` עם recipient=A → צ'אט A מקבל "הפוסט סומן כנמסר ✓ · תודה!", צ'אט B מקבל "הפוסט נמסר למשתמש אחר".
- Plain UPDATE ל-`deleted_no_recipient` → שני הצ'אטים מקבלים "המפרסם סגר את הפוסט — הפריט לא נמסר".
- Reopen / removed_admin / expired → אין הודעות חדשות.

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

- **קליטה (לא הנחה):** `messages.kind` ו-`messages.system_payload jsonb` כבר קיימים בסכמה (`0004_init_chat_messaging.sql`). לכן אין מיגרציה לסכמת העמודות.
- **סיכון:** Realtime subscriptions לעדכוני post status יכולים להתפספס במקרי קצה (איבוד חיבור). **מיטיגציה:** `useAnchoredPost` עושה גם re-fetch on focus + on app foreground.
- **סיכון:** Fan-out להזרקת system messages לפוסט עם הרבה צ'אטים אחים (>50) יכול להאט את הסגירה. **מיטיגציה:** ב-MVP זה לא צפוי. אם יקרה — להעביר ל-async (NOTIFY/LISTEN או edge function).
- **הנחה:** התרגום של "הפוסט נמסר למשתמש אחר" שומר על פרטיות הנמען (לא חושף שם). הסכמנו על זה במפורש.

## 9 — מה לא בסקופ

- התראות push על אירוע "הפוסט נמסר" (TD-115 / FR-NOTIF נפרד).
- אפשרות לצד השני "לבקש סגירה" מהבעלים (לא בתכנון; דחוי).
- קישור הפוך — מסך הפוסט מציג כמה צ'אטים פעילים יש (לא בסקופ פיציר; אולי בעתיד דרך FR-POST-STATS).
- שינוי טקסט ה-`auto-message` של FR-CHAT-005 — נשאר כפי שהוא.
