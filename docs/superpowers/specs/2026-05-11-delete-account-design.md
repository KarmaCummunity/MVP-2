# P2.2 — Delete Account (V1 פרגמטי) Design Spec

> תאריך: 2026-05-11 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש · FR refs: FR-SETTINGS-012 (יישום חלקי — V1 פרגמטי), FR-AUTH-016 (לא מיושם — נדחה ל-V1.1)

## 1 — בעיה ומטרה

כפתור "מחק חשבון" קיים בהגדרות מאז המסך הראשון אבל ה-`onPress` שלו ב-`apps/mobile/app/settings.tsx:169` הוא stub ריק — לא קורה כלום. משתמש שמבקש למחוק את עצמו תקוע. בנוסף, גם אם היינו מחברים אותו לטריגר נאיבי, הסכמה הנוכחית של `chats.participant_a/b` עם `on delete cascade` הייתה גורמת להעלמת השיחה גם בצד הנגדי — לא קביל.

המטרה: לאפשר למשתמש למחוק את חשבונו לחלוטין ומיידית, באישור חזק, באופן שמותיר אצל הצד הנגדי בשיחה את ההיסטוריה (עם תווית "משתמש שנמחק") ובו-בזמן משחרר את האימייל / זהות הגוגל כך שאפשר להירשם מחדש כמשתמש חדש.

## 2 — החלטות (מתוך ה-brainstorming)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | היקף לעומת FR-SETTINGS-012 המלא | **V1 פרגמטי.** מיישמים מחיקה אמיתית מיידית + שימור שיחות + ניקוי מלא של דאטה אישית + רישום audit. **לא** מיישמים: טבלת `DeletedIdentifier` עם cooldown של 30 ימים, cron של פרגייה רכה→קשה, ואימייל אישור. השלושה נדחים לגרסת polish (V1.1, P2.2 polish phase). |
| Q2 | מה קורה לזיהוי הגרסה הישנה | **שחרור מיידי.** מחיקת `auth.users` מסירה את הקישור לאימייל / זהות הגוגל. המשתמש יכול מיד להירשם מחדש; הרשמה כזו יוצרת `auth.users` חדש ו-`public.users` חדש (טריגר קיים) — חשבון לכל דבר ועניין, ללא גישה לדאטה הישנה. |
| Q3 | שיחות בצד הנגדי | **נשמרות.** משנים את ה-FK של `chats.participant_a/b` מ-`on delete cascade` ל-`on delete set null` ומאפשרים `NULL`. הצד הנגדי ממשיך לראות את השיחה וההודעות; שם המשתמש שנמחק → "משתמש שנמחק" + אווטר ברירת מחדל. |
| Q4 | UX של האישור | **חלון אזהרה אחד חזק** — מודאל מקומי עם כותרת אדומה, פירוט מה ימחק, אזהרה שהפעולה לא הפיכה, ושני כפתורים: "ביטול" (משני) ו-"מחק את החשבון לצמיתות" (אדום). אין הקלדת שם, אין שני שלבים. |

## 3 — ארכיטקטורה

### 3.1 שכבת Domain (`packages/domain`) — אפס שינויים

הסוגים הקיימים מספיקים. אין צורך ב-entity חדש כי המחיקה היא פעולה, לא שינוי מודל.

### 3.2 שכבת Application (`packages/application`)

**`IUserRepository.delete(userId)` (קיים, שורה 22).** משמש כפורט הציבורי. הפונקציה מוגדרת אבל ללא יישום פעיל — נוסף יישום ב-infrastructure (§3.3.3).

**Use case חדש:** `DeleteAccountUseCase`
- מיקום: `packages/application/src/use-cases/DeleteAccountUseCase.ts`
- תלות יחידה: `IUserRepository`
- חתימה: `execute(input: { userId: UserId }): Promise<Result<void, DeleteAccountError>>`
- שגיאות אפשריות:
  - `UNAUTHENTICATED` — אין סשן פעיל
  - `NETWORK` — תקלת רשת
  - `SERVER_ERROR` — שגיאה כללית מהשרת
- אחריות: לקרוא ל-`userRepository.delete(userId)` ולמפות שגיאות. **לא** מבצע `signOut` או ניווט — זה אחריות ה-UI.

### 3.3 שכבת Infrastructure (`packages/infrastructure-supabase` + `supabase/`)

**3.3.1 מיגרציה — `supabase/migrations/0028_chats_participant_set_null.sql`**

מטרה: לאפשר לשיחה לשרוד אחרי מחיקת אחד המשתתפים.

שינויים:
- `alter table public.chats alter column participant_a drop not null;`
- `alter table public.chats alter column participant_b drop not null;`
- הסרת ה-FK הקיים על שתי העמודות, ויצירתו מחדש עם `on delete set null`.
- הוספת constraint חדש: `check (participant_a is not null or participant_b is not null)` — לפחות אחד חי, כדי שלא ייצברו שיחות "יתום" של שני משתמשים שנמחקו.
- כשהצד הנותר מוחק את עצמו: ה-RPC (§3.3.3) יזהה שהשיחה נשארה ללא אף משתתף ויעשה לה `delete` מפורש לפני שיגיע ל-`set null` השני.
- עדכון RLS — מדיניות `chats_select` הקיימת בודקת `auth.uid() in (participant_a, participant_b)`. ההתנהגות נשמרת: משתמש פעיל רואה שיחות שבהן הוא המשתתף; משתתפים `NULL` לא ייכללו. אין צורך בשינוי המדיניות, אבל יש לאמת זאת בזמן היישום ולכלול בדיקה ב-PR.

**3.3.2 מיגרציה — `supabase/migrations/0029_delete_account_rpc.sql`**

מוסיפה את ערך ה-action `delete_account` ל-CHECK של `audit_events.action`, ויוצרת את ה-RPC המרכזי.

**שינוי CHECK של `audit_events.action`:**
- מוסיף `'delete_account'` לרשימה הקיימת (`block_user`, `report_target`, ...).
- `target_type` המתאים: `'user'`; `target_id` = ה-userId שנמחק; `actor_id` = אותו userId; `metadata` = `{ posts_deleted: int, chats_anonymized: int, chats_dropped: int }`.

**RPC: `public.delete_account_data(target_user_id uuid) returns jsonb`**
- מוגדר `SECURITY DEFINER`, רץ ב-`search_path = public, pg_temp`.
- בדיקת הרשאות בתחילת הפונקציה: `if target_user_id <> auth.uid() then raise exception 'forbidden'; end if;` — אסור למחוק חשבון של מישהו אחר. מספק defense-in-depth מעבר ל-Edge Function.
- כל הפעולות בתוך טרנזקציה אחת (אטומית מטבעה ב-PL/pgSQL function).

סדר הפעולות בתוך הפונקציה:

1. **איסוף media paths.** שאילתה מצטברת על `media_assets` עם `post_id in (select post_id from posts where owner_id = target_user_id)` → מאוחסן ב-array של נתיבים לקובץ ב-storage. (החזרת הנתיבים הללו ל-Edge Function כדי שינקה את ה-bucket.)
2. **רישום audit.** `insert into audit_events (actor_id, action, target_type, target_id, metadata)` עם המידע הראשוני (כמות פוסטים, וכו׳ — נחושב במהלך ההמשך). אם הטרנזקציה תיכשל אחר כך — האודיט נופל יחד איתה (זה מה שאנחנו רוצים).
3. **מחיקה של דאטה תלוית-משתמש (לפני מחיקת `users`):**
   - `delete from devices where user_id = target_user_id;` (push tokens משוחררים)
   - `delete from follow_edges where follower_id = target_user_id or followed_id = target_user_id;`
   - `delete from follow_requests where requester_id = target_user_id or target_id = target_user_id;`
   - `delete from blocks where blocker_id = target_user_id or blocked_id = target_user_id;`
   - `delete from reports where reporter_id = target_user_id or target_id = target_user_id;`
   - `delete from donation_links where user_id = target_user_id;`
   - `delete from auth_identities where user_id = target_user_id;`
4. **מחיקת פוסטים.** `delete from posts where owner_id = target_user_id;` — cascade ידאג ל-`recipients` ול-`media_assets` (שכבר שלפנו את הנתיבים שלהם בשלב 1).
5. **טיפול בשיחות — "drop empty" + "anonymize":**
   - `delete from chats where (participant_a = target_user_id and participant_b is null) or (participant_b = target_user_id and participant_a is null);` — שיחות שבהן הצד השני כבר נמחק → מוחקים לחלוטין (אין יותר אף מתבונן).
   - `update chats set participant_a = null where participant_a = target_user_id;`
   - `update chats set participant_b = null where participant_b = target_user_id;`
   - הודעות (`messages.sender_id`) כבר מוגדר `on delete set null` בסכמה הקיימת — אין צורך בפעולה מפורשת לאחר מחיקת `users`.
6. **מחיקת `public.users`.** `delete from users where user_id = target_user_id;`
7. **עדכון metadata באודיט.** `update audit_events set metadata = jsonb_build_object(...) where event_id = <ה-id ששמרנו בשלב 2>;` — מוסיפים את הספירות הסופיות (`posts_deleted`, `chats_anonymized`, `chats_dropped`).
8. **החזרה.** הפונקציה מחזירה `jsonb` עם `{ media_paths: text[], counts: { posts: int, chats_anonymized: int, chats_dropped: int } }` עבור ה-Edge Function.

**הערה על אידמפוטנטיות.** אם הפונקציה נקראת פעמיים: בקריאה השנייה, `target_user_id` כבר לא קיים ב-`public.users` → `auth.uid()` עדיין יכול להחזיר את הערך הישן (כי ה-JWT עוד תקף), והפונקציה תרוץ עם ספירות 0 בכל הטבלאות, תכניס audit שני (כמעט ריק), ותחזיר רשימת media ריקה. זה תוצאה תקינה. אם רוצים לדכא את ה-audit הכפול — אפשר להוסיף `if not exists (select 1 from users where user_id = target_user_id) then return jsonb_build_object(...empty...); end if;` בראש הפונקציה. **החלטה ל-V1: כן** — מדלגים מוקדם, כי הקריאה השנייה היא תמיד תוצאה של retry, ואין שום ערך באודיט עליה.

**3.3.3 Edge Function — `supabase/functions/delete-account/index.ts`**

מתזמן את כל התהליך. נדרש בגלל שמחיקת `auth.users` ומחיקת קבצי storage שתיהן דורשות `service_role`, ואי-אפשר להריץ אותן מתוך RPC רגיל.

זרימה:

1. **אימות.** קוראים את ה-JWT מ-`Authorization` header. אם חסר/לא תקף → `401`. שולפים `user_id` מתוך ה-claims.
2. **קריאה ל-RPC.** עם `service_role` client: `rpc('delete_account_data', { target_user_id: userId })`. הפונקציה כולה מסתיימת או נכשלת אטומית.
   - אם נכשלת → `500` עם `{ error: 'db_failed' }`, לא ממשיכים.
   - אם הצליחה → מקבלים `{ media_paths, counts }`.
3. **מחיקת קבצי storage.** עוברים על `media_paths` ומבצעים `supabase.storage.from('media').remove([...paths])`. שגיאות storage **לא** עוצרות את התהליך (לוג בלבד) — DB כבר נקי, ועדיף לסיים את מחיקת ה-auth מאשר להשאיר את המשתמש במצב "חשבון חצי-מחוק".
4. **מחיקת `auth.users`.** `supabase.auth.admin.deleteUser(userId)`.
   - אם נכשל → `500` עם `{ error: 'auth_delete_failed', counts }`. הקליינט יציג שגיאה, המשתמש יוכל לנסות שוב; הניסיון הבא יראה DB ריק וירוץ רק על שלב 4.
   - אם הצליח → `200` עם `{ ok: true, counts }`.

**3.3.4 יישום `SupabaseUserRepository.delete()`**

מיקום: `packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`.

- קורא ל-Edge Function `delete-account` דרך `supabase.functions.invoke('delete-account', { method: 'POST' })`.
- ממפה תשובה ל-`Result<void, Error>` של הדומיין: `200 → Ok`; `401 → UNAUTHENTICATED`; שגיאת רשת → `NETWORK`; כל שאר → `SERVER_ERROR`.
- אין payload נדרש בגוף הבקשה — ה-Edge Function מסיק את ה-userId מ-JWT.

### 3.4 שכבת UI (`apps/mobile` + `packages/ui`)

**3.4.1 רכיב חדש — `apps/mobile/src/components/settings/DeleteAccountConfirmModal.tsx`**

מודאל מקומי (לא bottom sheet). פרופס:
- `visible: boolean`
- `onCancel: () => void`
- `onConfirm: () => Promise<void>` — אסינכרוני; מחזיר promise כדי לאפשר loading state

תוכן:
- **כותרת** באדום בולט: "מחיקת חשבון לצמיתות"
- **גוף ההסבר** — רשימה עם bullets:
  - "כל הפוסטים שלך יימחקו (כולל תמונות)"
  - "כל העוקבים, הנעקבים והחסימות יוסרו"
  - "כל המכשירים המחוברים שלך ינותקו"
- **שורה דגושה**: "שיחות שניהלת יישמרו אצל הצד השני בלי הפרטים שלך — יוצגו תחת השם 'משתמש שנמחק'."
- **אזהרה תחתונה** (אפור כהה): "הפעולה אינה הפיכה. תוכל להירשם מחדש עם אותו אימייל וליצור חשבון חדש לחלוטין."
- **שני כפתורים** בתחתית:
  - "ביטול" (משני, אפור)
  - "מחק את החשבון לצמיתות" (אדום, ראשי)

**מצבים פנימיים:**
- `idle` — כפתורים פעילים, אין loading
- `submitting` — שני הכפתורים מנוטרלים, הכפתור הראשי מציג spinner, אי-אפשר לסגור את המודאל בלחיצה מחוץ אליו
- `error` — באנר אדום מעל הכפתורים עם הודעת השגיאה ("המחיקה נכשלה — נסה שוב"). חזרה ל-`idle`, הכפתורים חוזרים לפעילים.

**3.4.2 חיווט ב-`apps/mobile/app/settings.tsx`**

שורה 169 — החלפת `onPress={() => {}}` ב-`onPress={() => setDeleteModalVisible(true)}`. הוספה של ה-`DeleteAccountConfirmModal` בתחתית ה-tree עם הפרופס המתאימים. ה-`onConfirm`:

1. קריאה ל-`deleteAccountUseCase.execute({ userId: authUser.id })`
2. אם `Ok`:
   - `auth.signOut()`
   - `router.replace('/(auth)/sign-in')` (או הנתיב המקביל למסך התחברות, באמצעות `replace` כדי לוודא שאי-אפשר לחזור אחורה)
3. אם `Err`:
   - הגדרת ה-state ל-`error` עם ההודעה המתאימה
   - לא מבצע signOut, לא מנווט

**3.4.3 רינדור "משתמש שנמחק" בשיחות — תשתית קיימת**

הקוד הקיים כבר מטפל בתרחיש "משתמש לא נמצא". שני הנתיבים העיקריים נופלים-בחזרה לתווית "משתמש שנמחק" כשמשתתף לא קיים ב-`public.users`:

- `SupabaseChatRepository.getCounterpart` (שורות 175-183 ב-`packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`) — `maybeSingle` מחזיר `data === null` → מחזיר אובייקט עם `displayName: 'משתמש שנמחק'`, `avatarUrl: null`, `isDeleted: true`.
- `getMyChats.ts` — בונה את העדכון בצד השני באמצעות `participantIds`. אחרי שינוי ה-FK ל-`set null` (§3.3.1), אחת ההזרקות הופכת ל-`null`, וההפניה לעמודה הזו ב-`users` תחזיר 0 שורות → fallback קיים מטפל.
- שני המסכים שמשתמשים בנתונים הללו (`apps/mobile/app/chat/index.tsx`, `apps/mobile/app/chat/[id].tsx:54`) כבר מקבלים את ה-flag `isDeleted` ומציגים אותו נכון.

**מה כן צריך לאמת בזמן היישום:**
- `rowMappers.ts:13` כיום עושה `[r.participant_a, r.participant_b] as [string, string]` — ה-`as` מטעה את TypeScript אבל לא נשבר ב-runtime כי downstream רק עושה השוואה עם `===`. יש לעדכן את הטיפוס ל-`[string | null, string | null]` ולאמת שאין צרכן שעושה method-call על הערך (`.toLowerCase()` וכד׳). אם יש — להוסיף guard.
- מדיניות RLS הקיימת על `chats` (`auth.uid() in (participant_a, participant_b)`) — לוודא ידנית שהיא ממשיכה להחזיר שיחות עבור הצד הנותר אחרי ש-NULL מגיע לעמודה השנייה.

**אין צורך ב-helper UI חדש.** התשתית עוטפת את הלוגיקה בשכבת הנתונים.

## 4 — מיפוי דרישות

**FR-SETTINGS-012 (Delete account) — מצב יישום ב-V1:**

| AC | תיאור מקורי | מצב ב-V1 |
|----|--------------|----------|
| AC1 | אישור דו-שלבי + הקלדת שם | **שונה ל-V1.** חלון אזהרה אחד חזק (Q4 ב-§2). |
| AC2.a | מחיקה קשה של פוסטים | ✅ ממומש (§3.3.2 שלב 4) |
| AC2.b | שימור צ׳אטים אצל הצד הנגדי | ✅ ממומש (§3.3.1 + §3.3.2 שלב 5) |
| AC2.c | מחיקה רכה + אנונימיזציה של `User` | **שונה ל-V1.** מחיקה קשה של `public.users` + `auth.users`. שימור הצד הנגדי בשיחה מושג דרך FK `set null`, לא דרך תווית "deleted" ב-`users`. |
| AC2.d | `DeletedIdentifier` cooldown 30 ימים | ❌ נדחה ל-V1.1 (Q1 ב-§2) |
| AC2.e | מחיקת `FollowEdge`, `FollowRequest` | ✅ ממומש (§3.3.2 שלב 3) |
| AC2.f | unregister push tokens | ✅ ממומש דרך מחיקת `devices` (§3.3.2 שלב 3) |
| AC3 | פרגייה קשה אחרי 30 ימים | ❌ לא רלוונטי — V1 מבצע מחיקה קשה מיידית |
| AC4 | אימייל אישור | ❌ נדחה ל-V1.1 (Q1 ב-§2) |
| AC5 | רישום audit | ✅ ממומש (§3.3.2 שלב 2 + 7) |

**FR-AUTH-016 (Deleted-account cooldown) — לא מיושם.** נדחה ל-V1.1. ב-V1, האימייל / גוגל משוחררים מיד.

**עדכון נדרש ל-SRS:** יש להוסיף ל-`docs/SSOT/SRS/02_functional_requirements/11_settings.md` סעיף הערה תחת FR-SETTINGS-012:

> **גרסת V1 (P1.x):** מיושם כמחיקה קשה מיידית עם שימור צ׳אטים בצד הנגדי (FK set null). AC1 (אישור דו-שלבי), AC2.c (soft-delete), AC2.d (cooldown), AC3 (purge cron), AC4 (אימייל) — נדחים ל-V1.1 (P2.2 polish).

## 5 — מקרי קצה וטיפול בשגיאות

**5.1 שגיאת רשת לפני הקריאה.** UI מציג שגיאה במודאל; המשתמש נשאר מחובר; אין שינוי בדאטה.

**5.2 RPC נכשל (`db_failed`).** הטרנזקציה נשברת, שום שורה לא נמחקה. UI מציג שגיאה; ניסיון חוזר יעבוד.

**5.3 storage נכשל בחלקו או בשלמותו.** DB כבר נקי. הקבצים שלא נמחקו הופכים ל-orphan. **החלטה ל-V1:** מקבלים את הסיכון, מתעדים ל-log של ה-Edge Function. ב-V1.1 נשקול cron של ניקוי orphans.

**5.4 `auth.admin.deleteUser` נכשל.** DB ו-storage כבר נקיים, אבל `auth.users` שורד. הסשן הקיים של המשתמש עדיין תקף בצד השרת. הבעיה: אם המשתמש מתחבר מחדש (או רענון אוטומטי של טוקן), טריגר `handle_new_user` יזהה שאין שורת `public.users` ויצור אותה מחדש — נוצר חשבון "ריק" עם אותו `auth.users.id`. כדי למנוע את זה ב-V1:

- ה-Edge Function מחזיר `500` עם `{ error: 'auth_delete_failed' }`.
- ה-UI מציג שגיאה במודאל: "המחיקה כמעט הושלמה — נסה שוב כדי לסיים."
- **לא** מבצע `signOut` ו**לא** מנווט (אחרת המשתמש יחבר ויקבל פרופיל-יתום).
- ניסיון חוזר ירוץ את הזרימה מחדש: ה-RPC ייצא מוקדם (early return — `public.users` כבר לא קיים), storage ייצא ריק, ושלב 4 ינסה שוב.
- אם הכישלון מתמיד אחרי 2-3 ניסיונות → תקלה אמיתית; באג שצריך לחקור. ל-V1 אין מסך תמיכה אז ההצעה היחידה היא "נסה שוב מאוחר יותר". אדמין יכול להשלים ידנית דרך Supabase dashboard.

**5.5 משתמש מחובר במספר מכשירים.** מחיקת `auth.users` מבטלת את כל הסשנים בצד השרת. מכשירים אחרים יקבלו `401` בקריאה הבאה ויעופפו אוטומטית למסך התחברות (יש interceptor של 401 ב-supabase client; יש לאמת בזמן היישום).

**5.6 משתמש מנסה למחוק את עצמו פעמיים בו-זמנית.** הקריאה השנייה תיתקל במצב שבו `users.user_id` כבר לא קיים → ה-early-return ב-RPC (§3.3.2 הערה על אידמפוטנטיות) מחזיר תשובה ריקה; ה-Edge Function ממשיך ל-`auth.admin.deleteUser`, שיחזיר שגיאה כי המשתמש כבר נמחק → טיפול כמו 5.4. נדיר בפועל (לחיצה כפולה במהירות) ולא יוצר corruption.

**5.7 הרשמה מחדש עם אותו אימייל / גוגל.** אחרי מחיקה מוצלחת — `auth.users` ריק → אימייל / Google identity פנויים. הרשמה רגילה יוצרת `auth.users` חדש; הטריגר הקיים יוצר `public.users` חדש; משתמש חדש לחלוטין, ללא היסטוריה.

**5.8 שיחה שבה שני הצדדים נמחקו ברצף.** מטופל ב-§3.3.2 שלב 5 — `delete from chats` ל-orphans לפני ה-`update`.

## 6 — מחוץ להיקף (V1.1+)

הפריטים הבאים לא בגרסה הזו, נשארים פתוחים ב-PROJECT_STATUS תחת P2.2:

1. **`DeletedIdentifier` cooldown table** (FR-AUTH-016) — חסימת הרשמה חוזרת באותו אימייל / טלפון למשך 30 ימים.
2. **אימייל אישור מחיקה** (FR-NOTIF-012) — תלוי בתשתית הדואר שלא קיימת עדיין.
3. **חלון התחרטות / שחזור (recovery window)** — אם נחליט שכן ב-V1.1, יידרש שינוי לארכיטקטורת soft-delete + purge cron.
4. **Cron ניקוי קבצים מיותמים ב-storage** — מטפל בפריט 5.3.
5. **אישור דו-שלבי עם הקלדת שם** — אם נרצה fricion חזק יותר בעתיד.

## 7 — בדיקות

**7.1 unit — `DeleteAccountUseCase`**
- הצלחה: רפו מחזיר Ok → use case מחזיר Ok
- שגיאת רשת מהרפו → use case מחזיר `Err(NETWORK)`
- שגיאה לא מאומתת → `Err(UNAUTHENTICATED)`
- שגיאת שרת אחרת → `Err(SERVER_ERROR)`

**7.2 integration — Edge Function מול סופאבייס מקומי**
- seed: משתמש עם 2 פוסטים (כולל media), 3 follows, 2 שיחות עם משתתפים אחרים, 1 חסימה, 1 מכשיר רשום
- קריאה ל-Edge Function עם JWT של המשתמש
- אימות: שורת `users` נעלמה; פוסטים נעלמו; `recipients`/`media_assets` נעלמו; `follows`/`blocks`/`devices`/`auth_identities` נעלמו; `chats` עדיין קיימות עם `participant = null` בצד שלו; הודעות עדיין קיימות עם `sender_id = null` בהודעות שלו; שורת audit_events חדשה נוצרה עם `action = 'delete_account'`
- שלב נוסף: הרשמה מחדש עם אותו אימייל מצליחה, יוצרת `auth.users` ו-`public.users` חדשים

**7.3 integration — orphan chat cleanup**
- seed: שיחה בין user_A ו-user_B, user_B נמחק ראשון (ב-DB ישירות, מדמה כישלון), user_A מוחק את עצמו
- אימות: שלב 5 ב-RPC מזהה את השיחה כ-orphan ומוחק אותה

**7.4 ידני — זרימת UI מלאה**
- כניסה כמשתמש דמו → settings → "מחק חשבון" → מודאל נפתח עם הטקסטים הנכונים
- לחיצה על "ביטול" → מודאל נסגר, אין שינוי
- לחיצה על "מחק לצמיתות" → spinner → ניווט למסך התחברות
- חזרה למסך התחברות, הרשמה עם אותו אימייל גוגל → חשבון חדש נוצר, אין דאטה ישנה
- בדיקה מצד החבר: מסך השיחה מציג "משתמש שנמחק" + אווטר ברירת מחדל; ההודעות הישנות נשמרו

## 8 — חוב טכני ופריטים פתוחים

**TD חדש (אם נדרש):** אם בזמן היישום מתגלה שמדיניות RLS על `chats` לא מטפלת נכון ב-`participant = null` (לדוגמה, השיחות לא מופיעות יותר אצל הצד הנותר), יש לפתוח TD-XXX (FE/BE לפי הצד) ולתקן בו-בזמן. אסור להתקדם בלי שזה מאומת.

**אימות בזמן Plan:**
- ה-trigger `handle_new_user` (או דומה) שיוצר `public.users` אוטומטית מ-`auth.users` — קיים? פעיל? אם לא, יידרש שלב 5 בתוך ה-Edge Function או יישום נפרד.
- interceptor של `401` בצד הקליינט שיעיף משתמש למסך התחברות — קיים? אם לא, V1 מקבל את זה (המשתמש יבחין בשגיאה הבאה).

**עדכון `PROJECT_STATUS.md`:** הוספת רשומה חדשה בלוח §3 לפי `.cursor/rules/project-status-tracking.mdc`:
- ID: `P1.x — Delete Account V1` (יוקצה בזמן ה-Plan)
- Owner: `agent יחיד`
- Status: `🟡 In progress` בתחילת הביצוע
- FR: FR-SETTINGS-012 (חלקי)

**עדכון `TECH_DEBT.md`:** הוספת רשומה ל-V1.1 — "Delete Account: ליישם cooldown / purge cron / אימייל אישור / orphan storage cleanup (FR-AUTH-016, FR-NOTIF-012)".
