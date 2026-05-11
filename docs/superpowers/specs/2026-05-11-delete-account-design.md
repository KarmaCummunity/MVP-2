> ⚠️ **Frozen historical plan** — written under the pre-2026-05-11 SSOT scheme. References to `PROJECT_STATUS.md` / `HISTORY.md` in the body below are obsolete; see [`CLAUDE.md`](../../../CLAUDE.md) for the current convention.

# P2.2 — Delete Account (V1 פרגמטי) Design Spec

> תאריך: 2026-05-11 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש (אחרי revision לפי council review) · FR refs: FR-SETTINGS-012 (יישום חלקי — V1 פרגמטי), FR-AUTH-016 (לא מיושם — נדחה ל-V1.1)

## 1 — בעיה ומטרה

כפתור "מחק חשבון" קיים בהגדרות אבל ה-`onPress` שלו ב-`apps/mobile/app/settings.tsx:169` הוא stub ריק. בנוסף, הסכמה הנוכחית של `chats.participant_a/b` עם `on delete cascade` הייתה גורמת להעלמת השיחה גם בצד הנגדי — לא קביל לפלטפורמה חברתית.

המטרה: לאפשר למשתמש למחוק את חשבונו לחלוטין ומיידית, באישור חזק עם הקלדת מילת אישור, באופן שמותיר אצל הצד הנגדי בשיחה את ההיסטוריה (עם תווית "משתמש שנמחק"), משחרר את האימייל / זהות הגוגל להרשמה מחדש כמשתמש חדש, ומונע ממשתמש מושעה/חסום לעקוף מודרציה דרך המחיקה.

## 2 — החלטות (מתוך ה-brainstorming + council review)

| # | שאלה | החלטה |
|---|------|-------|
| Q1 | היקף לעומת FR-SETTINGS-012 המלא | **V1 פרגמטי.** מיישמים מחיקה אמיתית מיידית + שימור שיחות + ניקוי מלא של דאטה אישית + רישום audit + חסימת מושעים. **לא** מיישמים: טבלת `DeletedIdentifier` עם cooldown של 30 ימים, cron של פרגייה רכה→קשה, אימייל אישור, מסך תמיכה. נדחים ל-V1.1. |
| Q2 | מה קורה לזיהוי הגרסה הישנה | **שחרור מיידי.** מחיקת `auth.users` מסירה את הקישור לאימייל / זהות הגוגל. המשתמש יכול מיד להירשם מחדש; הרשמה כזו יוצרת `auth.users` חדש ו-`public.users` חדש (טריגר `handle_new_user` הקיים, ראו §3.3.0 לאימות). |
| Q3 | שיחות בצד הנגדי | **נשמרות.** משנים את ה-FK של `chats.participant_a/b` מ-`on delete cascade` ל-`on delete set null`. הצד הנגדי ממשיך לראות את השיחה וההודעות; שם → "משתמש שנמחק" + אווטר ברירת מחדל. |
| Q4 | UX של האישור | **חלון אזהרה אחד חזק + הקלדת מילת אישור.** מודאל עם כותרת אדומה, פירוט מה ימחק, אזהרה שהפעולה לא הפיכה, שדה הקלדה ("הקלד 'מחק' כדי לאשר"), ושני כפתורים: "ביטול" ו-"מחק את החשבון לצמיתות". כפתור המחיקה מנוטרל עד שהטקסט בשדה תואם בדיוק ל-"מחק". |
| Q5 | משתמש מושעה / חסום | **חסום מחיקה.** אם `account_status in ('suspended_for_false_reports','suspended_admin','banned')` — ה-RPC זורק `forbidden`; ה-UI מציג "לא ניתן למחוק חשבון מושעה. פנה לבירור דרך הדיווח". מונע עקיפת מודרציה. |
| Q6 | מצב כישלון `auth.admin.deleteUser` | **מודאל לא-נסגר עם copy מחמיר.** המודאל הופך לא-dismissible (אי-אפשר tap-outside, אי-אפשר back), copy מסביר שהמחיקה לא הושלמה ושסגירת האפליקציה תגרור חשבון לא תקין, ויש רק כפתור "נסה שוב". מטופל ב-§5.4. |
| Q7 | מסך אחרי מחיקה מוצלחת | **Overlay קצר.** לפני ניווט למסך התחברות, מוצג overlay מלא 1.5 שניות: "חשבונך נמחק. תודה שהיית חלק מקארמה." סוגר את הלולאה רגשית. |

## 3 — ארכיטקטורה

### 3.0 — אימותים נדרשים לפני קוד (pre-implementation checks)

חובה לאמת ולתעד בתחתית המפרט / ב-PROJECT_STATUS לפני שמתחילים:

1. **טריגר `handle_new_user`** קיים על `auth.users` INSERT, ב-`0001_init_users.sql:175` (נצפה במהלך הסקירה). מאמתים שהוא רץ נכון בהרשמה ידנית של משתמש דמו אחרי מחיקה.
2. **אין consumer של `audit_events.action`** שמבצע exhaustive switch על הערכים הקיימים (למשל בדאשבורד אדמין). חיפוש מהיר ב-`apps/mobile/**` וב-`packages/**` כדי לוודא.
3. **interceptor של `401`** בקליינט סופאבייס — אם לא קיים, V1 מקבל זאת (המשתמש יבחין בשגיאה הבאה ויחזור למסך התחברות).

### 3.1 שכבת Domain (`packages/domain`) — אפס שינויים

הסוגים הקיימים מספיקים. אין צורך ב-entity חדש.

### 3.2 שכבת Application (`packages/application`)

**Use case חדש** (לפי קונבנציות הריפו — feature-folder, `Promise<T>` + throw, לא `Result<>`):

- מיקום: **`packages/application/src/auth/DeleteAccountUseCase.ts`** (לצד `SignOut.ts`, `SignUpWithEmail.ts`)
- תלות יחידה: `IUserRepository`
- חתימה: `execute(): Promise<void>` — בלי פרמטר `userId` (הזהות נשלפת מ-JWT בצד השרת)
- בכישלון: זורק `DeleteAccountError` חדש מתוך `packages/application/src/auth/errors.ts` (מירור של `packages/application/src/donations/errors.ts`)
- קודי שגיאה ב-`DeleteAccountError`:
  - `UNAUTHENTICATED` — אין סשן פעיל
  - `SUSPENDED` — חשבון מושעה/חסום, RPC דחה
  - `AUTH_DELETE_FAILED` — DB נוקה אבל `auth.users` שרד (המצב המסוכן ב-§5.4)
  - `NETWORK` — תקלת רשת
  - `SERVER_ERROR` — שגיאה כללית מהשרת

**שינוי בפורט `IUserRepository`:**

הפעולה `delete(userId)` הקיימת ב-`packages/application/src/ports/IUserRepository.ts:22` היא generic ולא משקפת את הזרימה (כל הזהות מה-JWT, אין userId argument). מוסיפים שיטה חדשה ייעודית:

```ts
deleteAccountViaEdgeFunction(): Promise<void>
```

ה-`delete(userId)` הקיים נשאר ב-port אבל מסומן כ-`/** @deprecated — see deleteAccountViaEdgeFunction */` ב-V1 (משאיר את האפשרות לפעולה אדמיניסטרטיבית עתידית של מחיקת משתמש אחר). מקביל לדפוס `IPostRepository.delete` ↔ `adminRemove`.

### 3.3 שכבת Infrastructure (`packages/infrastructure-supabase` + `supabase/`)

**3.3.1 מיגרציה — `supabase/migrations/00XX_chats_participant_set_null.sql`**

> מספר ה-migration יוקצה בזמן ה-PR (לרענן לפי `git pull` של main; הריפו ב-0027 כרגע אבל יכול להתקדם). המפרט מתייחס לה כ-"מיגרציה 1".

מטרה: לאפשר לשיחה לשרוד אחרי מחיקת אחד המשתתפים, **ולתקן את כל מדיניות ה-RLS שתשבר כשהמשתתף הופך NULL**.

שינויים בסכמה:
1. `alter table public.chats alter column participant_a drop not null;`
2. `alter table public.chats alter column participant_b drop not null;`
3. הסרת ה-FK הקיים על שתי העמודות, ויצירתו מחדש עם `on delete set null`.
4. הוספת `check (participant_a is not null or participant_b is not null)` — מונע שיחות-יתום של שני משתמשים שנמחקו.
5. **עדכון `chats_canonical_order`** הקיים (`0004:25`): כיום `check (participant_a < participant_b)`. אחרי NULL → ה-`<` מחזיר NULL → CHECK עובר (כי CHECK נכשל רק על FALSE מפורש). זה לא שובר עכשיו, אבל ה-constraint מאבד משמעות עבור שיחות מאונונמיזציה. שני אפשרויות:
   - **א)** לעדכן ל-`check (participant_a is null or participant_b is null or participant_a < participant_b)` — שומר על canonical pair רק לשיחות "חיות"
   - **ב)** להסיר את ה-constraint לחלוטין
   - **בחירה ל-V1: (א)** — שומר על האכיפה לזוגות פעילים.

שכתוב פונקציות RLS-עזר ל-NULL-safe:

6. **`is_chat_visible_to(p_chat, p_viewer)`** — הפונקציה המרכזית, מוגדרת ב-`0004:106` ו-refreshed ב-`0005:32`. כיום היא משתמשת ב-`p_viewer not in (p_chat.participant_a, p_chat.participant_b)`. שכתוב NULL-safe:

```sql
create or replace function public.is_chat_visible_to(p_chat public.chats, p_viewer uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when p_viewer is null then false
    when p_viewer is distinct from p_chat.participant_a
     and p_viewer is distinct from p_chat.participant_b then false
    when p_chat.removed_at is not null then false
    when public.has_blocked(
      p_viewer,
      case
        when p_viewer = p_chat.participant_a then p_chat.participant_b
        else p_chat.participant_a
      end
    ) then false
    else true
  end;
$$;
```

(שינוי קריטי: `not in` → `is distinct from` × 2 — `is distinct from` הוא NULL-safe.)

7. **`messages_insert_user`** ב-`0004:284` משתמש ב-`auth.uid() in (c.participant_a, c.participant_b)`. שכתוב: `auth.uid() = c.participant_a or auth.uid() = c.participant_b`. ההבדל: `=` החזרה NULL כשהפרמטר NULL → ה-`or` יכול עדיין להחזיר TRUE אם הצד השני תואם. ההתנהגות נכונה: הצד הנותר עדיין יכול לכתוב; צד NULL כבר לא יכול (אין JWT שלו).
8. **`messages_update_status_recipient`** ב-`0004:301` — בדיקה דומה. שכתוב אנלוגי.
9. **`chats_insert_self`** ב-`0004:255` — שכתוב אנלוגי.
10. **`users_select_chat_counterpart`** ב-`0012` — לוודא ולשכתב אם דרוש (בדיקה בזמן יישום).
11. **`rpc_chat_unread_total`** ב-`0011:33` — לוודא ולשכתב אם דרוש.

**הערה על `chats_select_visible`** (`0004:247`): משתמש ב-`is_chat_visible_to(chats.*, auth.uid())`. אחרי שינוי 6 → אוטומטית NULL-safe. אין צורך לגעת במדיניות עצמה.

**הערה על `messages_select_visible`** (`0004:265`): גם הוא מסתמך על `is_chat_visible_to`. אוטומטית מתוקן.

**אימות בזמן יישום:** לרוץ `grep -rn "participant_a\|participant_b" supabase/migrations/` ולוודא שכל policy / function / trigger שמשתמש בהן או מטופל בשינוי 6 דרך `is_chat_visible_to`, או מתוקן ישירות (שינויים 7-11).

**3.3.2 מיגרציה — `supabase/migrations/00XX_delete_account_rpc.sql`**

מיגרציה 2. שתי משימות:

**(א) הרחבת CHECK של `audit_events.action`:**

הוספת `'delete_account'` לרשימה. ה-CHECK הקיים ב-`0005:172` הוא inline ובלי שם מפורש → צריך `pg_constraint` lookup או `alter ... drop constraint <auto-name>`. הדפוס: `select conname from pg_constraint where conrelid='public.audit_events'::regclass and contype='c'` בזמן היישום, ואז `alter table ... drop constraint <name>; alter table ... add constraint audit_events_action_check check (action in (..., 'delete_account'))`.

> שיקלנו שימוש חוזר ב-`'manual_remove_target'` (כפי שעשו ב-`0020`) במקום action חדש — נדחה. סמנטית `manual_remove_target` הוא אדמין-על-משתמש; פה זה משתמש-על-עצמו, ראוי לערך נפרד.

**(ב) ה-RPC המרכזי:**

```sql
create or replace function public.delete_account_data()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id   uuid;
  v_status    text;
  v_avatar    text;
  v_paths     text[];
  v_audit_id  uuid;
  v_posts     int;
  v_chats_a   int;
  v_chats_d   int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  -- Status gate (Q5) — block suspended / banned.
  select account_status, avatar_url into v_status, v_avatar
    from public.users where user_id = v_user_id;
  if not found then
    -- Idempotency: already deleted. Return empty.
    return jsonb_build_object('media_paths', '[]'::jsonb, 'avatar_path', null, 'counts', jsonb_build_object('posts',0,'chats_anonymized',0,'chats_dropped',0));
  end if;
  if v_status in ('suspended_for_false_reports','suspended_admin','banned') then
    raise exception 'suspended' using errcode = 'P0001';
  end if;

  -- 1. Collect media paths BEFORE the cascade clears them.
  select coalesce(array_agg(path), '{}') into v_paths
    from public.media_assets
    where post_id in (select post_id from public.posts where owner_id = v_user_id);

  -- 2. Audit row. actor_id will be nulled by FK cascade at step 6;
  --    snapshot the user_id into metadata BEFORE the cascade.
  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
    values (v_user_id, 'delete_account', 'user', v_user_id,
            jsonb_build_object('actor_id_snapshot', v_user_id::text))
    returning event_id into v_audit_id;

  -- 3. Per-user-data cleanup (explicit, before users delete).
  delete from public.devices where user_id = v_user_id;
  delete from public.follow_edges    where follower_id  = v_user_id or followed_id = v_user_id;
  delete from public.follow_requests where requester_id = v_user_id or target_id   = v_user_id;
  delete from public.blocks          where blocker_id   = v_user_id or blocked_id  = v_user_id;
  delete from public.reports         where reporter_id  = v_user_id or target_id   = v_user_id;
  delete from public.donation_links  where submitted_by = v_user_id;
  -- donation_links.hidden_by has no on-delete clause → null it explicitly
  update public.donation_links set hidden_by = null where hidden_by = v_user_id;
  delete from public.auth_identities where user_id = v_user_id;

  -- 4. Posts (cascades to recipients, media_assets — paths already captured).
  select count(*) into v_posts from public.posts where owner_id = v_user_id;
  delete from public.posts where owner_id = v_user_id;

  -- 5. Chats — drop orphans first (where other side is already NULL),
  --    then null-out remaining participation.
  select count(*) into v_chats_d from public.chats
    where (participant_a = v_user_id and participant_b is null)
       or (participant_b = v_user_id and participant_a is null);
  delete from public.chats
    where (participant_a = v_user_id and participant_b is null)
       or (participant_b = v_user_id and participant_a is null);

  update public.chats set participant_a = null where participant_a = v_user_id;
  update public.chats set participant_b = null where participant_b = v_user_id;
  get diagnostics v_chats_a = row_count;

  -- 6. Delete the public.users row. FK cascade will fire on auth.users next
  --    (the Edge Function calls auth.admin.deleteUser after this RPC returns).
  delete from public.users where user_id = v_user_id;

  -- 7. Finalize audit metadata.
  update public.audit_events
    set metadata = jsonb_build_object(
      'actor_id_snapshot', v_user_id::text,
      'posts_deleted',     v_posts,
      'chats_anonymized',  v_chats_a,
      'chats_dropped',     v_chats_d
    )
    where event_id = v_audit_id;

  -- 8. Return paths for storage cleanup (caller is service-role).
  return jsonb_build_object(
    'media_paths',  to_jsonb(v_paths),
    'avatar_path',  v_avatar,
    'counts', jsonb_build_object('posts', v_posts, 'chats_anonymized', v_chats_a, 'chats_dropped', v_chats_d)
  );
end;
$$;

revoke execute on function public.delete_account_data() from public;
grant  execute on function public.delete_account_data() to authenticated;
```

**הבהרות מפתח:**

- **אין פרמטר** ב-RPC. הזהות נשלפת רק מ-`auth.uid()`. שטח התקיפה נסגר.
- **`revoke ... from public; grant ... to authenticated;`** — חוסם anon מלקרוא. בלי זה, ברירת המחדל של Postgres נותנת `execute to public`.
- **null-check על `auth.uid()`** — defense-in-depth מעבר ל-grant.
- **חסימת מושעים/חסומים** מתבצעת ב-RPC עצמו (לא רק ב-Edge Function), כדי שגם קריאה ישירה ל-RPC לא תעקוף.
- **snapshot של `actor_id`** ב-metadata — שורת האודיט תאבד את ה-`actor_id` הרגיל בשל ה-FK cascade `set null` שיופעל בשלב 6; ה-snapshot שומר על המידע.
- **`donation_links.hidden_by`** מטופל מפורשות (null-out) — אחרת `auth.admin.deleteUser` היה נשבר בעמודה הזו.
- **אידמפוטנטיות**: כשהמשתמש כבר לא קיים ב-`public.users` (retry אחרי כישלון auth-delete), הפונקציה מחזירה early עם מבנה תקין-ריק. ה-Edge Function ימשיך לשלב הבא.

**3.3.3 Edge Function — `supabase/functions/delete-account/index.ts`**

מתזמן את כל התהליך. דורש דפוס תואם ל-`supabase/functions/validate-donation-link/index.ts` (קיים כ-canonical reference):

1. **CORS + OPTIONS preflight** — בלוק קיים שיועתק.
2. **אימות אמיתי של ה-JWT** — `userClient.auth.getUser()` שמאמת את הטוקן בצד השרת. **לא** פיענוח claims לבד.
3. **בדיקת `account_status` נוספת ב-FE** (לפני קריאה ל-RPC) — מאפשרת שגיאה מהירה ו-clear; ה-RPC בכל מקרה יחסום, אבל זה מציל round-trip.
4. **קריאה ל-`adminClient.rpc('delete_account_data')`** — בלי פרמטרים.
5. **מחיקת קבצי storage**:
   - bucket: **`post-images`** (לא `media`! זו טעות במפרט הקודם — bucket האמיתי לפי `0002:288`)
   - paths: כל הנתיבים שחזרו ב-`media_paths`
   - **בנוסף**: ניקוי אווטר — אם `avatar_path` חזר ולא ריק, `storage.from('avatars').remove([avatar_path])`
   - שגיאות storage **לא** מפילות את התהליך (לוג בלבד); ה-DB כבר נקי.
6. **`adminClient.auth.admin.deleteUser(userId)`**.
   - הצלחה → `200 { ok: true, counts }`
   - כישלון → `500 { ok: false, error: 'auth_delete_failed', counts }` — הקליינט יתרגם ל-`AUTH_DELETE_FAILED` (§5.4)
7. **מיפוי שגיאות RPC**:
   - `unauthenticated` → `401 { error: 'unauthenticated' }`
   - `suspended` → `403 { error: 'suspended' }`
   - אחר → `500 { error: 'db_failed' }`

**מגבלת שורות:** סביר שהפונקציה תעבור 200 שורות (בעיקר בגלל CORS + error mapping). חובה לפצל ל-`cors.ts` ו-`auth.ts` באותה תיקייה (הדפוס של `validate-donation-link`).

**3.3.4 יישום ב-`SupabaseUserRepository`**

מיקום: `packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` (`delete()` הקיים שורות 165-167 מסומן `NOT_IMPL('delete', 'P2.2')` — נשאר כפי שהוא; נוספת שיטה חדשה).

```ts
async deleteAccountViaEdgeFunction(): Promise<void> {
  const { data, error } = await this.client.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    // map by status / error.context.status / data.error
    if (error.context?.status === 401) throw new DeleteAccountError('UNAUTHENTICATED');
    if (error.context?.status === 403) throw new DeleteAccountError('SUSPENDED');
    if (data?.error === 'auth_delete_failed') throw new DeleteAccountError('AUTH_DELETE_FAILED');
    throw new DeleteAccountError(/network detection/ 'SERVER_ERROR');
  }
  if (data?.ok !== true) throw new DeleteAccountError('SERVER_ERROR');
}
```

מיפוי שגיאות מדויק נקבע ביישום (בהתאם להתנהגות אמיתית של `functions.invoke`); המבנה הכללי הוא: status code → קוד שגיאה דומיין.

### 3.4 שכבת UI (`apps/mobile`)

**3.4.1 רכיב חדש — `apps/mobile/src/components/DeleteAccountConfirmModal.tsx`**

> מיקום: flat ב-`components/` לצד `GuestJoinModal.tsx`, `ReportChatModal.tsx`, `ReopenConfirmModal.tsx` (אין subfolder `settings/` קיים, ולא יוצרים חדש בעבור קומפוננטה יחידה).
>
> סטיילים: `.styles.ts` נפרד בקובץ אחותי (תואם הדפוס של `AddDonationLinkModal`).
>
> כל הטקסטים ב-`i18n/he.ts` תחת `settings.deleteAccountModal.*` — לא inline.

**Props:**
- `visible: boolean`
- `onCancel: () => void`
- `onConfirm: () => Promise<void>`
- `accountStatus: AccountStatus` — להחלטה אם להציג מסך-חסום במקום הזרימה הרגילה

**מצבים פנימיים:**
- `idle` — שדה הקלדה ריק; כפתור המחיקה מנוטרל
- `ready` — הטקסט בשדה תואם בדיוק "מחק"; כפתור המחיקה פעיל
- `submitting` — שני הכפתורים מנוטרלים, הראשי spinner, **מודאל לא-dismissible** (אי-אפשר tap-outside)
- `error_recoverable` — באנר אדום: "המחיקה נכשלה — נסה שוב"; חוזר ל-`ready`; **dismissible**
- `error_critical` (auth_delete_failed) — באנר אדום מודגש: "המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. **חובה ללחוץ 'נסה שוב' עכשיו** — אם תסגור את האפליקציה ייווצר חשבון לא תקין." **מודאל לא-dismissible** (חוסם tap-outside, hardware back, ו-X). רק כפתור "נסה שוב".
- `blocked_suspended` — מסך-חסום מוחלף ב-content ראשי: "לא ניתן למחוק חשבון מושעה. פנה לבירור דרך מסך הדיווחים." רק כפתור "סגור". מוצג כש-`accountStatus` או כשהשרת מחזיר 403.

**תוכן הזרימה הרגילה (idle / ready):**
- **כותרת** (אדום בולט): "מחיקת חשבון לצמיתות"
- **גוף — מה ימחק** (bullets):
  - "כל הפוסטים שלך יימחקו (כולל תמונות)"
  - "כל העוקבים והנעקבים יוסרו"
  - "כל החסימות והדיווחים שהגשת יימחקו"
  - "קישורי תרומה שהגדרת יימחקו"
  - "כל המכשירים המחוברים שלך ינותקו"
- **שורה דגושה (chat retention)**:
  > "שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק 'משתמש שנמחק'."
- **אזהרה תחתונה**:
  > "הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית."
- **שדה הקלדה**: label "הקלד 'מחק' כדי לאשר", placeholder אפור "מחק", input RTL right-aligned. הכפתור הראשי מנוטרל עד שהטקסט המדויק (אחרי trim) שווה "מחק".
- **כפתורים בתחתית** (סדר RTL: ראשי-בימין):
  - "מחק את החשבון לצמיתות" (אדום, ראשי, ימין) — מנוטרל ב-idle
  - "ביטול" (משני אפור, שמאל) — תמיד פעיל פרט ל-`submitting` ו-`error_critical`

**3.4.2 חיווט ב-`apps/mobile/app/settings.tsx`**

שורה 169 (כיום `onPress={() => {}}`): מחליפים ב-handler שפותח את ה-modal. ה-state של ה-modal מנוהל בקומפוננטה האב או ב-store נתיב.

`onConfirm` מבצע:
1. קריאה ל-`deleteAccountUseCase.execute()` (DI דרך hook קיים)
2. **הצלחה (ללא throw):**
   - `setSuccessOverlayVisible(true)` — overlay מלא עם "חשבונך נמחק. תודה שהיית חלק מקארמה."
   - timer 1500ms → `auth.signOut()` → `router.replace('/(auth)/sign-in')` (או הנתיב המקביל). הניווט עם `replace` כדי שאי-אפשר לחזור אחורה למסך מחוק.
3. **`DeleteAccountError`:**
   - `UNAUTHENTICATED` → `auth.signOut()` + ניווט (סשן פג, פעולה רגילה)
   - `SUSPENDED` → modal state → `blocked_suspended`
   - `AUTH_DELETE_FAILED` → modal state → `error_critical`
   - `NETWORK` / `SERVER_ERROR` → modal state → `error_recoverable`

**3.4.3 רינדור "משתמש שנמחק" בשיחות**

התשתית הקיימת ב-`SupabaseChatRepository.getCounterpart` (שורות 175-183 ב-`packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`) כבר מטפלת ב"משתמש לא נמצא → 'משתמש שנמחק'", וגם `getMyChats.ts` נופל-בחזרה דרך אותו ה-helper.

**שינויים נדרשים:**

1. **`rowMappers.ts:13`** — `[r.participant_a, r.participant_b] as [string, string]` משקר ל-TypeScript אחרי שינוי הסכמה. לעדכן ל-`[string | null, string | null]` ולעבור על כל ה-downstream consumers (`getMyChats.ts:52,73`, `SupabaseChatRepository.ts:166-168`) ולאמת שאין `null.something()`. הקוד הקיים רק עושה `===` השוואות — בטוח ב-runtime.
2. **Realtime UPDATE על `chats`** — כש-participant הופך NULL, מתפרסם אירוע UPDATE. RLS המעודכן (3.3.1 שינוי 6) יוודא שהצד הנותר מקבל אותו. ה-FE handler ב-`apps/mobile/src/store/` או `apps/mobile/src/services/realtime/` (בדיקה ביישום) חייב להתמודד עם NULL participant — לטעון את הצד הנותר ולעדכן את הכרטיס.
3. **`useChatInit.ts` ב-`apps/mobile/src/components/`** — כבר עובד עם `isDeleted` (שורות 18, 39). מאמתים שהשרשרת תקפה כש-`participantIds` מכילה NULL.

### 3.5 שכבת i18n

**קובץ:** `apps/mobile/src/i18n/he.ts`

**מפתחות חדשים נדרשים** (תחת `settings.deleteAccountModal.*`):

```
title:                 'מחיקת חשבון לצמיתות'
bullets.posts:         'כל הפוסטים שלך יימחקו (כולל תמונות)'
bullets.follows:       'כל העוקבים והנעקבים יוסרו'
bullets.moderation:    'כל החסימות והדיווחים שהגשת יימחקו'
bullets.donations:     'קישורי תרומה שהגדרת יימחקו'
bullets.devices:       'כל המכשירים המחוברים שלך ינותקו'
chatsRetention:        'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "משתמש שנמחק".'
warning:               'הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית.'
confirmInputLabel:     'הקלד "מחק" כדי לאשר'
confirmInputPlaceholder: 'מחק'
buttons.cancel:        'ביטול'
buttons.delete:        'מחק את החשבון לצמיתות'
buttons.retry:         'נסה שוב'
buttons.close:         'סגור'
errors.recoverable:    'המחיקה נכשלה — נסה שוב'
errors.critical:       'המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. חובה ללחוץ "נסה שוב" עכשיו — אם תסגור את האפליקציה ייווצר חשבון לא תקין.'
blocked.title:         'לא ניתן למחוק חשבון מושעה'
blocked.body:          'פנה לבירור דרך מסך הדיווחים.'
success.title:         'חשבונך נמחק'
success.subtitle:      'תודה שהיית חלק מקארמה.'
```

## 4 — מיפוי דרישות (FR-SETTINGS-012)

| AC | תיאור מקורי | מצב ב-V1 |
|----|--------------|----------|
| AC1 | אישור דו-שלבי + הקלדת שם תצוגה | **כמעט מלא.** חלון אזהרה אחד + הקלדת מילת אישור "מחק" (לא שם תצוגה — מילה קבועה, פשוטה יותר ל-RTL מובייל). מספק את כוונת הדרישה. |
| AC2.a | מחיקה קשה של פוסטים | ✅ ממומש (§3.3.2 שלב 4) |
| AC2.b | שימור צ׳אטים אצל הצד הנגדי | ✅ ממומש (§3.3.1 + §3.3.2 שלב 5) |
| AC2.c | מחיקה רכה + אנונימיזציה של `User` | **שונה ל-V1.** מחיקה קשה של `public.users` + `auth.users`. שימור הצד הנגדי מושג דרך FK `set null`. |
| AC2.d | `DeletedIdentifier` cooldown 30 ימים | ❌ נדחה ל-V1.1 |
| AC2.e | מחיקת `FollowEdge`, `FollowRequest` | ✅ ממומש (§3.3.2 שלב 3) |
| AC2.f | unregister push tokens | ✅ ממומש דרך מחיקת `devices` (§3.3.2 שלב 3) |
| AC3 | פרגייה קשה אחרי 30 ימים | ❌ לא רלוונטי — V1 מבצע מחיקה קשה מיידית |
| AC4 | אימייל אישור | ❌ נדחה ל-V1.1 |
| AC5 | רישום audit | ✅ ממומש (§3.3.2 שלב 2 + 7) |
| **חדש** | **חסימת מחיקה למשתמש מושעה** | ✅ ממומש (Q5, §3.3.2). FR-SETTINGS-012 לא מציין זאת מפורשות; ה-AC הזה תוסף כ-AC חדש בעדכון SRS. |

**עדכון נדרש ל-SRS** (`docs/SSOT/SRS/02_functional_requirements/11_settings.md`):

הוספת הערה תחת FR-SETTINGS-012:

> **גרסת V1 (P1.x / P2.2 portion):** מיושם כמחיקה קשה מיידית עם שימור צ׳אטים בצד הנגדי (FK set null) + אישור דו-שלבי קטן (חלון + הקלדת "מחק") + חסימת משתמשים מושעים/חסומים. AC2.c (soft-delete), AC2.d (cooldown), AC3 (purge cron), AC4 (אימייל) — נדחים ל-V1.1.

## 5 — מקרי קצה וטיפול בשגיאות

**5.1 שגיאת רשת לפני הקריאה.** Modal state → `error_recoverable`; המשתמש נשאר מחובר; אין שינוי בדאטה.

**5.2 RPC נכשל (`db_failed`).** הטרנזקציה נשברת, שום שורה לא נמחקה. Modal → `error_recoverable`; ניסיון חוזר יעבוד.

**5.3 storage נכשל בחלקו או בשלמותו.** DB כבר נקי. הקבצים שלא נמחקו הופכים ל-orphan. **החלטה ל-V1:** מקבלים את הסיכון, מתעדים ל-log של ה-Edge Function. ב-V1.1 → cron של ניקוי orphans. **חשוב:** ה-bucket `post-images` הוא public-read ל-anon (`0002:314`), אז orphans = דליפת פרטיות. עד שה-cron של V1.1 קיים, יש לתעד את הסיכון כ-TD פעיל.

**5.4 `auth.admin.deleteUser` נכשל.** DB ו-storage כבר נקיים, אבל `auth.users` שורד. סשן המשתמש עדיין תקף; אם הוא יסגור את האפליקציה ויתחבר מחדש, טריגר `handle_new_user` יזהה שאין `public.users` ויצור אותו — חשבון ריק עם אותו `auth.users.id`. כדי למנוע:
- Modal state → `error_critical`, **לא-dismissible**, copy מחמיר (ראו §3.4.1).
- אסור `signOut`, אסור ניווט. חובה להישאר במודאל.
- כפתור יחיד "נסה שוב" → קריאה חוזרת ל-UseCase. ה-RPC עכשיו ירוץ ב-early-return path (אין יותר `public.users`), storage cleanup ירוץ ריק, `auth.admin.deleteUser` ינסה שוב.
- אם הכישלון מתמיד אחרי 3-4 ניסיונות → באג אמיתי, צריך התערבות אדמין. בעל המוצר יראה את זה ב-audit_events (יש שורה ללא counts מאוחר). מקובל ל-V1.

**5.5 משתמש מחובר במספר מכשירים.** מחיקת `auth.users` מבטלת את כל הסשנים בצד השרת. מכשירים אחרים יקבלו `401` בקריאה הבאה. אם interceptor של `401` קיים → ניווט אוטומטי למסך התחברות; אם לא → המשתמש יבחין בשגיאה הבאה. אימות בזמן יישום (§3.0).

**5.6 משתמש מנסה למחוק את עצמו פעמיים בו-זמנית.** הקריאה השנייה: ה-RPC יחזיר early-return (אין `public.users`), Edge Function ימשיך ל-`auth.admin.deleteUser` שיחזיר שגיאה כי המשתמש כבר נמחק. טיפול: § 5.4 path. נדיר; לא יוצר corruption.

**5.7 הרשמה מחדש עם אותו אימייל / גוגל.** אחרי מחיקה מוצלחת — `auth.users` ריק → אימייל / Google identity פנויים. הרשמה רגילה יוצרת `auth.users` חדש; הטריגר `handle_new_user` יוצר `public.users` חדש; משתמש חדש לחלוטין, ללא היסטוריה. **אימות חובה ב-§7.2** — בדיקת אינטגרציה תכלול re-signup מיד אחרי מחיקה.

**5.8 שיחה שבה שני הצדדים נמחקו ברצף.** מטופל ב-§3.3.2 שלב 5 — `delete from chats` ל-orphans לפני ה-`update`. ה-CHECK constraint (`§3.3.1` שינוי 4) מבטיח שלא נשארות שורות שכאלה.

**5.9 משתמש מושעה/חסום מנסה למחוק.** ה-RPC זורק `suspended` (errcode P0001); Edge Function ממפה ל-`403`; Repository זורק `DeleteAccountError('SUSPENDED')`; Modal state → `blocked_suspended` עם copy ייעודי. אין שום שינוי בדאטה.

**5.10 שיחות שכבר `removed_at != null`** (שיחות שצד אחד "הסיר" עם soft-removal). הספק עדיין מטפל בהן דרך `is_chat_visible_to` (שורה 42 ב-update). בהליך המחיקה, ה-RPC לא מבדיל בין שיחות פעילות ל-`removed_at` — הוא פשוט עושה null/delete. השיחות הללו יישארו עם `removed_at` ועם participant ריק; ירואה רק אם רק לאחר ה-deletion יעלה צורך — בפועל לא יוצג לאף אחד, מקובל.

## 6 — מחוץ להיקף (V1.1+)

1. **`DeletedIdentifier` cooldown table** (FR-AUTH-016) — חסימת הרשמה חוזרת באותו אימייל / טלפון למשך 30 ימים.
2. **אימייל אישור מחיקה** (FR-NOTIF-012) — תלוי בתשתית הדואר.
3. **חלון התחרטות / שחזור (recovery window)** — soft-delete + purge cron.
4. **Cron ניקוי קבצים מיותמים ב-storage** — מטפל ב-§5.3 (חשוב כי `post-images` הוא public).
5. **מסך תמיכה** — להחליף את "פנה לבירור דרך מסך הדיווחים" כשתהיה תשתית.
6. **Anchor לחוק הגנת הפרטיות / GDPR** — שורת copy במודאל ("בהתאם לחוק הגנת הפרטיות, יש לך זכות..."). לא חוסם V1, רואים בפידבק.

## 7 — בדיקות

**7.1 unit — `DeleteAccountUseCase`**
- הצלחה: רפו מחזיר → use case לא זורק.
- הרפו זורק `DeleteAccountError('NETWORK')` → use case מעביר את הזריקה.
- כל קודי השגיאה: `UNAUTHENTICATED`, `SUSPENDED`, `AUTH_DELETE_FAILED`, `NETWORK`, `SERVER_ERROR`.

**7.2 integration — Edge Function מול סופאבייס מקומי**
- seed: משתמש active עם 2 פוסטים (כולל media), אווטר, 3 follows, 2 שיחות, 1 חסימה, 1 דיווח שהוא הגיש, 1 קישור תרומה, 1 מכשיר רשום.
- קריאה ל-Edge Function עם JWT.
- אימות תוצאה:
  - שורת `users` נעלמה.
  - פוסטים, `recipients`, `media_assets` נעלמו.
  - `follow_edges`, `follow_requests`, `blocks`, `reports`, `donation_links`, `devices`, `auth_identities` נעלמו.
  - `chats` עדיין קיימות עם `participant = null` בצד שלו.
  - הודעות עדיין קיימות עם `sender_id = null`.
  - שורת `audit_events` חדשה עם `action = 'delete_account'`, `metadata.actor_id_snapshot = <user_id>`, `metadata.posts_deleted = 2`.
  - קבצים בbucket `post-images` נעלמו.
  - אווטר בbucket `avatars` נעלם.
  - `auth.users` נעלם.
- **שלב המשך באותו טסט:** הרשמה מחדש דרך הזרימה האמיתית של הקליינט (`signUp` או OAuth flow), לא insert ישיר. אימות שנוצרים `auth.users` חדש ו-`public.users` חדש (טריגר `handle_new_user`), ושהמסך הראשי נטען בלי שגיאות.

**7.3 integration — RLS NULL-safe**
- seed: שיחה בין user_A ו-user_B, שניהם active.
- מחיקה של user_A.
- אימות מצד user_B (עם JWT שלו):
  - `select from chats` מחזיר את השיחה.
  - `select from messages` מחזיר את ההודעות.
  - יכולת לשלוח הודעה חדשה? **לא צריכה לעבוד** (הצד השני NULL, אין צורך תרגיל; ייתכן ש-`messages_insert_user` יחסום או יאפשר — ההחלטה ביישום, אבל יש לתעד את ההתנהגות).

**7.4 integration — orphan chat cleanup**
- seed: שיחה בין user_A ו-user_B, user_B נמחק ראשון, אחר כך user_A נמחק.
- אימות: השיחה נעלמה (לא נשארה כ-orphan עם שני NULLs).

**7.5 integration — anon-call rejection**
- קריאה ל-RPC `delete_account_data()` עם anon client (בלי JWT).
- אימות: שגיאה `42501 unauthenticated`. שום שינוי ב-DB.

**7.6 integration — suspended block**
- seed: משתמש עם `account_status = 'suspended_admin'`.
- קריאה ל-Edge Function עם JWT שלו.
- אימות: `403 { error: 'suspended' }`. שום שינוי ב-DB.

**7.7 ידני — זרימת UI מלאה**
- כניסה כמשתמש דמו → settings → "מחק חשבון" → מודאל נפתח.
- אימות שדה ההקלדה: ריק → כפתור מנוטרל. הקלדת "מחק" אות-אות → ברגע ההתאמה הכפתור פעיל.
- לחיצה על "ביטול" → מודאל נסגר, אין שינוי.
- לחיצה על "מחק לצמיתות" → spinner → success overlay 1.5 שניות → מסך התחברות.
- חזרה למסך התחברות, הרשמה עם אותו אימייל גוגל → חשבון חדש נוצר.
- מצד החבר: מסך השיחה מציג "משתמש שנמחק" + אווטר ברירת מחדל; ההודעות הישנות נשמרו.
- חזרה למשתמש הראשי → סימולציה של `auth_delete_failed` → אימות שהמודאל לא-dismissible, ה-copy המחמיר מוצג, ולחיצה על "נסה שוב" מסיימת בהצלחה.

## 8 — חוב טכני, פריטים פתוחים, ועדכוני SSOT

**8.1 עדכוני SSOT חובה ב-PR:**

- **`docs/SSOT/PROJECT_STATUS.md`** (`.cursor/rules/project-status-tracking.mdc` מחייב):
  - הוספת רשומה ב-§3 Sprint Board:
    - ID: `P1.x — Delete Account V1` (מיקום ה-x יוחלט בזמן הקצאה)
    - Owner: `agent יחיד`
    - FR refs: FR-SETTINGS-012 (חלקי)
    - Status: `🟡 In progress` בתחילה
- **`docs/SSOT/SRS/02_functional_requirements/11_settings.md`** — הוספת הערת V1 ל-FR-SETTINGS-012 (ראו §4 לעיל).
- **`docs/SSOT/TECH_DEBT.md`** — הוספת רשומה חדשה לחוב פעיל:
  - `TD-50..99` (BE) — "Delete Account: orphan storage cleanup (FR-AUTH-016, FR-NOTIF-012, soft-delete window). חובה עד V1.1 כי `post-images` bucket הוא public ול-orphans → דליפת פרטיות."

**8.2 פריטים לאימות בתחילת ה-Plan (לא תלויים בכתיבת קוד):**

1. טריגר `handle_new_user` קיים ופעיל על `auth.users` INSERT.
2. אין consumer של `audit_events.action` שמבצע exhaustive switch ויישבר מהערך החדש.
3. Interceptor של `401` בקליינט סופאבייס — קיים? אם לא, מתועד כ-TD נפרד או מתווסף בזרימה זו.
4. כל ה-RLS policies על `chats` ו-`messages` שמשתמשות ב-`participant_a/b` או ב-`is_chat_visible_to` ממופות במלואן (grep מקיף).
5. שמות ה-buckets בסטוראג׳ (`post-images`, `avatars`, ועוד אם רלוונטי) מאומתים מול ה-config / ה-migrations.

**8.3 פריטים פתוחים שעלולים להפוך ל-TD:**

- אם מתגלה ש-RLS המעודכן לא מטפל נכון ב-`participant = null` באף אחת מהמדיניות (למשל בשל זרימה שלא ראינו) — פתיחת TD חדש (BE).
- אם הצד הנותר בשיחה לא מקבל את ה-realtime UPDATE כשהצד השני הופך NULL — פתיחת TD (FE/BE).

---

**סטטוס סופי:** המפרט עבר revision לפי 4 דוחות של ה-council (אבטחה, DB/RLS, UX, ארכיטקטורה). כל הממצאים הקריטיים טופלו. ההחלטות הפרודקטיביות אושרו על ידי בעל המוצר (Q1: חסימת מושעים. Q2: copy חדש. Q3: error_critical lock. Q4: success overlay. Q5: typing confirmation).
