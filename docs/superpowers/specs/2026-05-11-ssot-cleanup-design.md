# SSOT Cleanup — Design Doc

| Field          | Value                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| **Date**       | 2026-05-11                                                             |
| **Author**     | agent + PM (brainstorming session)                                     |
| **Status**     | Draft — awaiting PM review                                             |
| **Scope**      | Documentation / process — no application code touched                  |
| **PR**         | Single atomic PR: `chore(docs): unify SSOT — consolidate rules into CLAUDE.md + scrub dead refs` |

---

## 1. הבעיה

קבצי מקור-אמת בפרויקט עברו רה-ארגון בעבר. כתוצאה:

- ארבעה קבצי `.md` מצוטטים כ"קבצי הכניסה" לסוכנים, אבל **אינם קיימים** בעץ הפעיל:
  - `docs/SSOT/PROJECT_STATUS.md` (תוכן כבר עבר ל-`BACKLOG.md`)
  - `docs/SSOT/HISTORY.md` (מעולם לא נוצר)
  - `docs/SSOT/CODE_QUALITY.md` (מעולם לא נוצר; פתוח כ-TD-4 כבר חודשיים)
  - `docs/SSOT/SRS.md` (קיים רק ב-`archive/SRS.md`)
- 17 הפניות לקבצים האלה מפוזרות ב-13 קבצים פעילים — סוכנים מקבלים הוראות לעדכן קובץ שלא קיים.
- ארבעה קבצי-כניסה (`CLAUDE.md` + 3 קבצים ב-`.cursor/rules/`) חופפים זה לזה: ה-verification gate מופיע פעמיים, מבנה ה-SSOT מופיע פעמיים, כללי גיט מפוזרים בין שניים. סוכן חדש לא יודע איזה קובץ סמכותי.
- אין מנגנון שמונע הוספת הפניה מתה חדשה ב-PR עתידי.

## 2. מטרה

1. **מקור אמת אחד.** `CLAUDE.md` יהיה הקובץ היחיד שמרכז את כל הכללים המחייבים (ארכיטקטורה, ספק-גייט, סטטוס-עדכון, גיט-וורקפלו).
2. **כל ההפניות בקבצים הפעילים מצביעות על קבצים שקיימים.** אחרי הניקוי, `git grep` של שמות-קבצים-מתים בקבצים פעילים מחזיר 0 תוצאות.
3. **אכיפה ב-CI.** סקריפט שנקרא מ-`pnpm lint:arch` בודק את אותה הפניה ונכשל אם נמצאות שאריות — מונע regression עתידי.
4. **מפת ריפו גלויה.** סוכן חדש שקורא את `CLAUDE.md` רואה טבלה אחת עם כל התיקיות והקבצים הפעילים — ולא ממציא "PROJECT_STATUS.md" חדש כי הוא לא מוצא איפה לתעד דבר.

## 3. תכולה (in scope)

- 13 קבצים פעילים מתעדכנים (ראו §6).
- 3 תכניות-עבודה היסטוריות תחת `docs/superpowers/plans/` ו-`specs/` מקבלות header של `> ⚠️ Frozen historical plan` (ללא שינוי תוכן).
- קובץ חדש `AGENTS.md` ב-root — pointer של 3 שורות ל-`CLAUDE.md`, לכלי-סוכן (Codex, Copilot CLI) שמחפשים את הקונבנציה הזו.
- סקריפט חדש `app/scripts/check-ssot-links.mjs` שנקרא מ-`pnpm lint:arch`.
- סגירת TD-4 ו-TD-43 ב-`TECH_DEBT.md` (התוכן שלהם נפתר ע"י הניקוי הזה).

## 4. מחוץ לתכולה (out of scope)

- `docs/SSOT/archive/` — לא נוגעים. הוא ארכיון מוצהר; הפניות פנימיות שם אינן מהוות מקור-אמת פעיל.
- `docs/SSOT/BACKLOG.md` — כבר נקי. לא נוגעים.
- שאר 11 קבצי `docs/SSOT/spec/*.md` (מלבד 01, 02, 12) — אין בהם הפניות מתות.
- `docs/SSOT/OPERATOR_RUNBOOK.md` — רק שורת ה-header משתנה. שאר הקובץ נשאר כמו שהוא.
- שינוי משמעות של AC כלשהו ב-spec files. רק טקסט תיאורי לצד הפניה מתה משתנה.

## 5. גישה (Y — קונסולידציה מאוזנת)

מתוך 3 גישות שנשקלו (X = שמירה זהירה, Y = קונסולידציה מאוזנת, Z = שכתוב מלא), נבחרה **Y**:

- מאמצת את ה-content של 3 קבצי `.cursor/rules/*` אל תוך `CLAUDE.md`, מאחדת סקציות שחוזרות על עצמן.
- זורקת תכנים מתים: סקצית "Draft/POC mode" שלא בשימוש, הפניות ל-`CODE_QUALITY.md` שלא קיים, "two sources of truth" שכבר לא נכון.
- תוצאה: `CLAUDE.md` של ~200 שורות (מ-~70 כיום), 12 סקציות עם hierarchy ברור.

X נדחתה כי משמרת את הכפילות שהיא ה-root cause. Z נדחתה כי הסיכון של "החמצנו כלל קיים" גבוה בלי תועלת משמעותית מעבר ל-Y.

## 6. מצאי השינויים (17 הפניות מתות)

### 6.1 קבצי כללים (`.cursor/rules/`)

| # | קובץ | מה משתנה |
|---|------|-----------|
| 1 | `.cursor/rules/srs-architecture.mdc` | מצטמצם ל-pointer-stub של 5 שורות. תוכן הארכיטקטורה (גבולות שכבות, file caps, error handling, propose-and-proceed) עובר ל-`CLAUDE.md` §5. |
| 2 | `.cursor/rules/git-workflow.mdc` | מצטמצם ל-pointer-stub. תוכן הגיט-וורקפלו עובר ל-`CLAUDE.md` §6 + §7. |
| 3 | `.cursor/rules/project-status-tracking.mdc` | מצטמצם ל-pointer-stub. ה-SSOT-update-workflow עובר ל-`CLAUDE.md` §4. |

מבנה ה-pointer-stub האחיד:

```markdown
---
description: Pointer — all process rules live in CLAUDE.md
alwaysApply: true
---

# Pointer

The single source of truth for all agent rules in this repo is **`CLAUDE.md`** at the repo root.
Read it before doing any work. This file exists only so Cursor's `alwaysApply: true` mechanism
still resolves to the canonical rule set.
```

ה-stubs נשמרים (ולא נמחקים לגמרי) כי Cursor טוען אותם אוטומטית עם `alwaysApply: true`; pointer הוא הדרך הנקיה לוודא ש-Cursor יקרא את CLAUDE.md בכל סשן.

### 6.2 קובץ חדש — `AGENTS.md` ב-root

```markdown
# AGENTS.md

This repository follows the `CLAUDE.md` convention for agent rules.
All process, architecture, and workflow rules live in [`CLAUDE.md`](./CLAUDE.md).
Read it first.
```

### 6.3 PR template

| # | קובץ | מה משתנה |
|---|------|-----------|
| 4 | `.github/PULL_REQUEST_TEMPLATE.md` | סקציה "PROJECT_STATUS.md updated" מוחלפת בסקצית "SSOT updated" עם 3 checkbox: `[ ] BACKLOG.md status flipped`, `[ ] spec/{domain}.md status updated (if all ACs done)`, `[ ] TECH_DEBT.md — closed resolved TDs / added new ones`. ההפניה ל-`docs/SSOT/SRS/02_functional_requirements/<file>.md` בשורה 11 מוחלפת ב-`docs/SSOT/spec/<file>.md`. |

### 6.4 קבצי SSOT פעילים

| # | קובץ | מה משתנה |
|---|------|-----------|
| 5 | `docs/SSOT/OPERATOR_RUNBOOK.md:3` | "Verification steps extracted from PROJECT_STATUS.md §4" → "Migration verification steps for each numbered migration." |
| 6 | `docs/SSOT/TECH_DEBT.md:9` | "Live execution state lives in [`PROJECT_STATUS.md`]... Historical feature log lives in [`HISTORY.md`]..." → "Live execution state lives in [`BACKLOG.md`](./BACKLOG.md). Per-feature status lives in [`spec/*.md`](./spec/)." |
| 7 | `docs/SSOT/TECH_DEBT.md:92` (TD-4) | מועבר לסקצית Resolved: "Closed 2026-05-11 — content folded into `CLAUDE.md`; `CODE_QUALITY.md` will not be authored as a separate file." |
| 8 | `docs/SSOT/TECH_DEBT.md:98` (TD-43) | מועבר ל-Resolved: "Closed 2026-05-11 — `SRS.md` no longer active; spec is canonical in `docs/SSOT/spec/*.md` with per-file status headers." |
| 9 | `docs/SSOT/TECH_DEBT.md:138` | "also link it from the §4 entry in [`HISTORY.md`]..." → "also link it from the relevant `spec/{domain}.md` if the TD blocks a specific AC." |
| 10 | `docs/SSOT/DECISIONS.md:3` | "[← back to SRS index](../../SRS.md)" → "[← back to CLAUDE.md](../../CLAUDE.md)". |
| 11 | `docs/SSOT/DECISIONS.md:31,33,64,73,75` (D-1 + D-3 internal refs to `CODE_QUALITY.md`) | תוסף הערה אחת בראש D-1 ואחת בראש D-3 (סה"כ 2 הערות, לא לכל ההחלטות): *"Note (2026-05-11): `CODE_QUALITY.md` was never authored; its content lives in `CLAUDE.md` §5–§8."* ההפניות בגוף נשמרות לתיעוד היסטורי. |
| 12 | `docs/SSOT/DECISIONS.md:352` (EXEC-9) | "P1.4 ... נמחק מ-`PROJECT_STATUS.md §2`" → "P1.4 ... נמחק מ-`BACKLOG.md`". |
| 13 | `docs/SSOT/DECISIONS.md:380` (EXEC-9 Affected docs) | "`PROJECT_STATUS.md §2` (P1.4 removed; FR-MOD-010 moves to P1.3)" → "`BACKLOG.md` (P1.4 removed; FR-MOD-010 moves to P1.3)". |
| 14 | `docs/SSOT/spec/01_auth_and_onboarding.md:89` | "until the `Profile` table exists (`PROJECT_STATUS.md` P0.2)" → "until `FR-PROFILE-007` ships (see `spec/02_profile_and_privacy.md`)". המשך המשפט נשאר כמו שהוא. |
| 15 | `docs/SSOT/spec/02_profile_and_privacy.md:48` | "until `Profile` and follow/post tables exist (see `PROJECT_STATUS.md` P0.2)" → "until `FR-FOLLOW-*` and `FR-POST-*` ship (see `spec/03_following.md` + `spec/04_posts.md`)". |
| 16 | `docs/SSOT/spec/12_super_admin.md:157` | "an explicit confirmation procedure documented in `CODE_QUALITY.md`" → "an explicit confirmation procedure (typing a free-text confirmation string per `CLAUDE.md` §7 hard-prohibitions)". |

### 6.5 תכניות-עבודה היסטוריות

| # | קובץ | מה משתנה |
|---|------|-----------|
| 17 | `docs/superpowers/specs/2026-05-11-delete-account-design.md`<br>`docs/superpowers/plans/2026-05-11-delete-account.md`<br>`docs/superpowers/plans/2026-05-11-edit-post.md` | תוסף שורה אחת בראש כל אחד: `> ⚠️ Frozen historical plan — written under the pre-2026-05-11 SSOT scheme. Any reference to `PROJECT_STATUS.md` / `HISTORY.md` in the body below is obsolete; see [CLAUDE.md](../../../CLAUDE.md) for the current convention.` ההפניות בגוף אינן משתנות (זה תיעוד היסטורי של תכניות שכבר בוצעו). |

## 7. מבנה ה-`CLAUDE.md` החדש

12 סקציות, ~200 שורות:

| # | כותרת | תוכן עיקרי | מקור |
|---|-------|-------------|------|
| 1 | Bootstrap — Required reading | רשימת 4 קבצי SSOT שחובה לקרוא | קיים |
| 2 | Spec Validation Gate | זרימת ה"בקשה סותרת אפיון?" עם פלט בעברית | קיים |
| 3 | Verification gate | "Mapped to spec: [FR-ID]. Refactor logged: [Yes/No/NA]" — סקציה אחת | קיים פעמיים — מאחד |
| 4 | SSOT update workflow | "Before / While working / Before done" — מתי מעדכנים מה, ומה לא דורש עדכון | `project-status-tracking.mdc` |
| 5 | Clean Architecture invariants | גבולות שכבות, file-size cap (≤200 LOC), error handling, propose-and-proceed | `srs-architecture.mdc` |
| 6 | Git & PR workflow | Pre-flight, change classes, branch naming, conventional commits, pre-push gates, PR sequence | `git-workflow.mdc` |
| 7 | Hard prohibitions | Never force-push to main, never commit secrets, never merge red CI | `git-workflow.mdc` §9 |
| 8 | Documentation language | עברית ל-UI/PM-flow, אנגלית לקוד ולקומיטים — בלי הזכרת `CODE_QUALITY.md` | `srs-architecture.mdc` |
| 9 | Parallel-agents protocol | BE/FE lanes, branch naming convention, shared-contract scope | קיים |
| 10 | How to pick the next task | BACKLOG → ⏳ → 🟡 → ✅ | קיים |
| 11 | Tech stack & commands | monorepo, pnpm, expo, supabase, מצומצם | קיים |
| 12 | Repo structure map | טבלה: איזה קובץ אחראי על מה | חדש — קריטי למניעת regression |

### §12 — Repo structure map (תוכן מלא)

```markdown
## Repo structure map

| Concern                  | File / directory                       |
| ------------------------ | -------------------------------------- |
| Priority queue           | `docs/SSOT/BACKLOG.md`                 |
| Feature specs (FR-*)     | `docs/SSOT/spec/{domain}.md`           |
| Tech debt register       | `docs/SSOT/TECH_DEBT.md`               |
| Architectural decisions  | `docs/SSOT/DECISIONS.md`               |
| Migration verification   | `docs/SSOT/OPERATOR_RUNBOOK.md`        |
| **Process rules**        | **`CLAUDE.md`** (this file)            |
| Implementation plans     | `docs/superpowers/plans/`              |
| Design specs             | `docs/superpowers/specs/`              |
| Historical archive       | `docs/SSOT/archive/`                   |

If you can't find where to document something, it doesn't have a home yet — ask the PM
before inventing a new file. Do not create new top-level docs without explicit approval.
```

## 8. מנגנון אימות

### 8.1 שכבה 1 — verification grep (בסוף ה-PR)

```bash
git grep -nE '(PROJECT_STATUS|HISTORY\.md|CODE_QUALITY|SRS/02_functional_requirements|PRD_MVP_CORE_SSOT|docs/SSOT/SRS\.md)' \
  -- ':!docs/SSOT/archive/' ':!.claude/worktrees/' ':!docs/superpowers/'
```

קריטריון מעבר: **0 שורות תוצאה**.

### 8.2 שכבה 2 — CI script (קבוע)

קובץ חדש: `app/scripts/check-ssot-links.mjs`

```javascript
#!/usr/bin/env node
import { execSync } from 'node:child_process';

const DEAD_REFS = [
  'PROJECT_STATUS',
  'HISTORY\\.md',
  'CODE_QUALITY',
  'SRS/02_functional_requirements',
  'PRD_MVP_CORE_SSOT',
  'docs/SSOT/SRS\\.md',
];

const EXCLUDE = [
  ':!docs/SSOT/archive/',
  ':!.claude/worktrees/',
  ':!docs/superpowers/',
  ':!app/scripts/check-ssot-links.mjs',  // self-exclude
];

const pattern = `(${DEAD_REFS.join('|')})`;
try {
  const out = execSync(
    `git grep -nE '${pattern}' -- ${EXCLUDE.join(' ')}`,
    { encoding: 'utf8' }
  );
  if (out.trim()) {
    console.error('❌ Dead doc references found:\n' + out);
    console.error('\nFix: replace with a reference to a live file, or move to docs/SSOT/archive/.');
    process.exit(1);
  }
} catch (e) {
  if (e.status === 1) {
    console.log('✅ No dead SSOT references');
    process.exit(0);
  }
  throw e;
}
```

ה-script יקרא מתוך `app/scripts/check-architecture.mjs` הקיים (או יוסף כשורה נפרדת ב-`pnpm lint:arch`). הקריאה הזו כבר רצה ב-CI דרך `pnpm lint`.

## 9. תוכנית PR

PR יחיד אטומי. שם מוצע:
`chore(docs): unify SSOT — consolidate rules into CLAUDE.md + scrub dead refs`

סדר הקומיטים בתוך ה-PR (אופציונלי, ייתכן commit יחיד):

1. `docs(claude): rewrite CLAUDE.md as the single rules hub` — הקובץ החדש של 200 שורות.
2. `docs(cursor): shrink .cursor/rules/* to pointer stubs` — 3 קבצים.
3. `docs(agents): add AGENTS.md root pointer` — קובץ חדש.
4. `docs(pr-template): replace PROJECT_STATUS section with SSOT-updated checklist`.
5. `docs(ssot): scrub dead refs in active docs` — TECH_DEBT, DECISIONS, OPERATOR_RUNBOOK, 3 spec files.
6. `docs(superpowers): mark historical plans as frozen` — 3 קבצים, header בלבד.
7. `chore(scripts): add check-ssot-links.mjs to lint:arch` — הסקריפט החדש.
8. `docs(td): close TD-4 + TD-43` — עדכון TECH_DEBT.

או commit יחיד אם ה-PM מעדיף — לא עקרוני.

## 10. קריטריוני הצלחה

- [ ] `git grep` של 6 ה-patterns על קבצים פעילים מחזיר 0 שורות.
- [ ] `pnpm lint:arch` כולל את הבדיקה החדשה ועובר ירוק.
- [ ] קריאת `CLAUDE.md` לבדה מספיקה לסוכן חדש כדי לדעת:
  - איפה קוראים ספק
  - מתי מעדכנים BACKLOG / spec / TECH_DEBT
  - מה הם גבולות הארכיטקטורה
  - איך פותחים PR
  - איפה כל סוג של תיעוד גר
- [ ] `.cursor/rules/*` עדיין נטענים ע"י Cursor (alwaysApply: true) ומפנים מיד ל-CLAUDE.md.
- [ ] `AGENTS.md` קיים ומפנה ל-CLAUDE.md.
- [ ] PR template לא מזכיר את `PROJECT_STATUS.md`.
- [ ] DECISIONS.md שומר על ההיסטוריה של D-1/D-3 (לא מוחק) אבל מוסיף הערת-קישור אחת.
- [ ] התכניות ההיסטוריות תחת `docs/superpowers/` מסומנות כ-frozen אבל לא נמחקות.

## 11. סיכונים

| סיכון | מה הוא | הפחתה |
|-------|--------|--------|
| איבוד כלל בעת הקונסולידציה | בעת העברת תוכן מ-`.cursor/rules/*` ל-`CLAUDE.md` עלולים להחמיץ הוראה | מעבר checklist על כל סקציה ב-3 קבצי המקור; pointer stubs נשארים זמינים ב-PR review |
| Cursor מפסיק לכפות את הכללים | אם ה-stub שגוי, Cursor לא יטען אותם | ה-stubs נשמרים עם `alwaysApply: true` ומפנים בגלוי לקובץ; פורמט תואם לדוגמת הקובץ הקיים |
| Script שגוי שכושל ב-CI שלא לצורך | regex רחב מדי תופס שמות תקפים | רשימת ה-patterns מצומצמת ל-6 מחרוזות ספציפיות; טסט ידני לפני ההוספה ל-lint |
| מישהו ירצה לחזור לקבצים הישנים | "אבל היה לי PROJECT_STATUS.md..." | התיעוד ההיסטורי נשמר תחת `docs/SSOT/archive/` ו-`docs/superpowers/`; שום מידע לא נמחק |

## 12. שאלות פתוחות

אין. כל ההחלטות סוכמו עם ה-PM בתהליך ה-brainstorming.
