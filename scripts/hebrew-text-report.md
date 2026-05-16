# Hebrew text scan

Generated: 2026-05-16T10:16:14.784Z

Root: `/Users/navesarussi/Desktop/MVP-2`

Files with at least one line containing Hebrew: **175**


## `app/apps/mobile/app/_layout.tsx`

**L21**

```
  document.title = 'KC - קהילת קארמה';
```

**L169**

```
                    <Stack.Screen name="edit-profile" options={{ ...detailStackScreenOptions, headerTitle: 'עריכת פרופיל' }} />
```

**L170**

```
                    <Stack.Screen name="post/[id]" options={{ ...detailStackScreenOptions, headerTitle: 'פרטי פוסט' }} />
```

---

## `app/apps/mobile/app/(auth)/index.tsx`

**L54**

```
            : 'שגיאת רשת. נסה שוב.';
```

**L74**

```
          <Text style={styles.appName}>קהילת קארמה</Text>
```

**L75**

```
          <Text style={styles.tagline}>תן. קבל. חבר קהילה.</Text>
```

**L81**

```
            { emoji: '🎁', text: 'פרסם חפצים שאינך צריך' },
```

**L82**

```
            { emoji: '🔍', text: 'מצא מה שאתה מחפש' },
```

**L83**

```
            { emoji: '💬', text: 'תאם מסירה ישירות' },
```

**L96**

```
              label="המשך עם Apple"
```

**L105**

```
            label="המשך עם Google"
```

**L121**

```
            <Text style={styles.guestBtnText}>הצץ בפיד (ללא כניסה)</Text>
```

**L126**

```
          בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות.
```

**L129**

```
      <NotifyModal visible={googleError !== null} title="כניסה עם Google נכשלה" message={googleError ?? ''} onDismiss={() => setGoogleError(null)} />
```

---

## `app/apps/mobile/app/(auth)/sign-in.tsx`

**L36**

```
      setNotify({ title: 'שגיאה', message: 'יש למלא דוא"ל וסיסמה' });
```

**L51**

```
        : 'שגיאת רשת. נסה שוב.';
```

**L52**

```
      setNotify({ title: 'כניסה נכשלה', message });
```

**L66**

```
            <Text style={styles.backText}>← חזרה</Text>
```

**L74**

```
          <Text style={styles.title}>כניסה לחשבון</Text>
```

**L85**

```
              <Text style={styles.label}>דוא"ל</Text>
```

**L90**

```
                placeholder='הכנס דוא"ל'
```

**L100**

```
              <Text style={styles.label}>סיסמה</Text>
```

**L105**

```
                placeholder="הכנס סיסמה"
```

**L114**

```
              <Text style={styles.forgotText}>שכחתי סיסמה</Text>
```

**L125**

```
                <Text style={styles.submitBtnText}>כניסה</Text>
```

**L136**

```
              <Text style={styles.switchModeText}>אין לי חשבון עדיין — הרשמה</Text>
```

---

## `app/apps/mobile/app/(auth)/sign-up.tsx`

**L29**

```
      setNotify({ title: 'שגיאה', message: 'יש למלא כל השדות' });
```

**L50**

```
        : 'שגיאת רשת. נסה שוב.';
```

**L51**

```
      setNotify({ title: 'הרשמה נכשלה', message });
```

**L62**

```
            <Text style={styles.backText}>← חזרה</Text>
```

**L70**

```
          <Text style={styles.title}>הרשמה</Text>
```

**L71**

```
          <Text style={styles.subtitle}>הצטרף לקהילה — חינם לגמרי</Text>
```

**L82**

```
              <Text style={styles.label}>דוא"ל</Text>
```

**L87**

```
                placeholder='הכנס דוא"ל'
```

**L96**

```
              <Text style={styles.label}>סיסמה (לפחות 8 תווים, עם אות וספרה)</Text>
```

**L101**

```
                placeholder="בחר סיסמה"
```

**L117**

```
                <Text style={styles.submitBtnText}>הרשמה</Text>
```

**L125**

```
                בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.
```

**L133**

```
                <Text style={styles.switchModeText}>יש לי כבר חשבון — כניסה</Text>
```

---

## `app/apps/mobile/app/(onboarding)/about-intro.tsx`

**L64**

```
          <Text style={styles.hint}>רוצים לקרוא עוד על החזון, איך זה עובד ויצירת קשר? אחרי ההרשמה תמצאו את כל הפרטים תחת ״הגדרות״ ← ״אודות״.</Text>
```

---

## `app/apps/mobile/app/(onboarding)/basic-info.tsx`

**L53**

```
              <Text style={styles.title}>פרטים בסיסיים</Text>
```

**L62**

```
                <Text style={styles.label}>שם מלא</Text>
```

**L67**

```
                  placeholder="לדוגמה: רינה כהן"
```

**L99**

```
              accessibilityLabel="המשך"
```

**L105**

```
                  <Text style={styles.ctaText}>המשך</Text>
```

---

## `app/apps/mobile/app/(onboarding)/photo.tsx`

**L53**

```
            accessibilityLabel={hasAvatar ? 'החלפת תמונת פרופיל' : 'הוספת תמונת פרופיל'}
```

**L57**

```
                name={session?.displayName ?? 'משתמש'}
```

**L74**

```
          <Text style={styles.title}>תמונת פרופיל</Text>
```

**L78**

```
          <Text style={styles.subtitle}>פנים מוכרות עוזרות לבנות אמון בקהילה.</Text>
```

**L93**

```
              {hasAvatar ? 'החלף תמונה' : 'בחר תמונה'}
```

**L111**

```
                  {hasAvatar ? 'המשך עם התמונה' : 'המשך ללא תמונה'}
```

**L120**

```
          <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בפרופיל.</Text>
```

---

## `app/apps/mobile/app/(onboarding)/tour.tsx`

**L15**

```
    title: 'תן ובקש',
```

**L16**

```
    body: 'פרסם פריטים שאתה רוצה לתת או בקש דברים שאתה צריך, תמיד אפשר גם לחפש — הכל בקהילה.',
```

**L20**

```
    title: 'תאמו בצ׳אט',
```

**L21**

```
    body: 'פותחים שיחה במהירות ישר דרך הפוסט, מתאמים איסוף בקלות, ומחזקים את הקהילה!',
```

**L25**

```
    title: 'סמן כנמסר',
```

**L26**

```
    body: 'אחרי שהפריט עבר ידיים — סמן את הפוסט כסגור. ככה כולנו רואים את הקהילה זזה.',
```

**L55**

```
          accessibilityLabel={isLast ? 'בואו נתחיל' : 'הבא'}
```

**L57**

```
          <Text style={styles.ctaText}>{isLast ? 'בואו נתחיל' : 'הבא'}</Text>
```

---

## `app/apps/mobile/app/(tabs)/create.tsx`

**L84**

```
      setNotify({ title: 'שגיאה', message: 'יש להתחבר מחדש לפני פרסום פוסט.' });
```

**L100**

```
        const msg = ok.length === 0 ? 'נסה שוב.' : `${ok.length}/${r.length} הועלו — נסה שוב את היתר.`;
```

**L101**

```
        setNotify({ title: 'העלאת התמונה נכשלה', message: msg });
```

**L166**

```
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
```

**L167**

```
      useFeedSessionStore.getState().showEphemeralToast(`פרסום נכשל: ${message}`, 'error');
```

**L199**

```
        <Text style={styles.headerTitle}>פוסט חדש</Text>
```

**L209**

```
            <Text style={styles.publishBtnText}>פרסם</Text>
```

**L221**

```
              🔍 לבקש חפץ
```

**L229**

```
              🎁 לתת חפץ
```

**L244**

```
          <Text style={styles.sectionLabel}>כותרת <Text style={styles.required}>*</Text></Text>
```

**L249**

```
            placeholder="מה אתה נותן/מבקש?"
```

**L258**

```
          <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
```

**L265**

```
              placeholder="רחוב"
```

**L273**

```
              placeholder="מס׳"
```

**L282**

```
          <Text style={styles.sectionLabel}>קטגוריה</Text>
```

**L300**

```
            <Text style={styles.sectionLabel}>מצב החפץ</Text>
```

**L319**

```
          <Text style={styles.sectionLabel}>תיאור (אופציונלי)</Text>
```

**L324**

```
            placeholder="פרטים נוספים על החפץ..."
```

**L340**

```
            <Text style={styles.sectionLabel}>דחיפות (אופציונלי)</Text>
```

**L345**

```
              placeholder="לדוגמה: צריך עד שישי"
```

**L364**

```
            <Text style={styles.publishBtnText}>פרסם</Text>
```

---

## `app/apps/mobile/app/(tabs)/donations/_layout.tsx`

**L20**

```
      <Stack.Screen name="money" options={{ ...detailHeader, headerTitle: 'תרומה כספית' }} />
```

**L21**

```
      <Stack.Screen name="time" options={{ ...detailHeader, headerTitle: 'תרומת זמן' }} />
```

---

## `app/apps/mobile/app/(tabs)/donations/time.tsx`

**L25**

```
const VOLUNTEER_PREFIX = 'התנדבות בארגון: ';
```

---

## `app/apps/mobile/app/(tabs)/profile/closed.tsx`

**L1**

```
// My Profile — "פוסטים סגורים" tab (closed posts). Sibling route: ./index.tsx.
```

---

## `app/apps/mobile/app/(tabs)/profile/index.tsx`

**L1**

```
// My Profile — "פוסטים פתוחים" tab (open posts). Sibling route: ./closed.tsx.
```

---

## `app/apps/mobile/app/(tabs)/profile/removed.tsx`

**L1**

```
// My Profile — "הוסרו" tab (posts removed by admin). Sibling route: ./index.tsx, ./closed.tsx.
```

**L36**

```
            פוסטים אלה הוסרו על ידי מנהל הקהילה. הם גלויים רק לך.
```

---

## `app/apps/mobile/app/auth/callback.tsx`

**L36**

```
      setError('קישור החזרה לא תקין: לא נמצא קוד אימות.');
```

**L65**

```
          : 'שגיאה בהשלמת ההתחברות. נסה שוב.';
```

**L77**

```
        <Text style={styles.title}>ההתחברות לא הושלמה</Text>
```

**L80**

```
          <Text style={styles.btnText}>חזרה למסך הכניסה</Text>
```

**L89**

```
      <Text style={styles.body}>משלים התחברות…</Text>
```

---

## `app/apps/mobile/app/auth/verify.tsx`

**L25**

```
      setError('קישור האימות אינו תקין.');
```

**L46**

```
          : 'הקישור פג תוקף או כבר מומש. נסה להתחבר.';
```

**L58**

```
        <Text style={styles.title}>האימות לא הצליח</Text>
```

**L61**

```
          <Text style={styles.btnText}>חזרה למסך הכניסה</Text>
```

**L69**

```
      <Text style={styles.body}>מאמת…</Text>
```

---

## `app/apps/mobile/app/chat/[id].tsx`

**L63**

```
    const title = counterpart.isDeleted ? 'משתמש שנמחק' : counterpart.displayName;
```

**L77**

```
        <TouchableOpacity onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel="פעולות">
```

**L110**

```
          ? 'לא ניתן להסיר את שיחת התמיכה.'
```

**L111**

```
          : 'לא הצלחנו להסיר את השיחה. נסה שוב.';
```

**L112**

```
      setNotify({ title: 'שגיאה', message: msg });
```

**L157**

```
              placeholder="כתוב הודעה..."
```

---

## `app/apps/mobile/app/chat/index.tsx`

**L59**

```
        <Text style={styles.title}>שיחות</Text>
```

**L68**

```
          placeholder="חפש לפי שם..."
```

**L100**

```
            title="אין שיחות עדיין"
```

**L101**

```
            subtitle="פנה למפרסמים ישירות מתוך הפוסטים."
```

**L122**

```
                ? 'לא ניתן להסיר את שיחת התמיכה.'
```

**L123**

```
                : 'לא הצלחנו להסיר את השיחה. נסה שוב.';
```

**L130**

```
      <NotifyModal visible={hideErrorMsg !== null} title="שגיאה" message={hideErrorMsg ?? ''} onDismiss={() => setHideErrorMsg(null)} />
```

---

## `app/apps/mobile/app/edit-post/[id].tsx`

**L102**

```
      setNotify({ title: 'שגיאה', message: 'יש להתחבר מחדש לפני שמירת פוסט.' });
```

**L116**

```
      setNotify({ title: 'העלאת התמונה נכשלה', message: err instanceof Error ? err.message : 'נסה שוב.' });
```

**L157**

```
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
```

**L158**

```
      setNotify({ title: 'שמירה נכשלה', message });
```

**L173**

```
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסט</Text>
```

**L175**

```
          <Text style={styles.retryText}>נסה שוב</Text>
```

**L183**

```
        <EmptyState icon="search-outline" title="הפוסט לא נמצא" subtitle="ייתכן שהוא נסגר או שאין לך הרשאה לצפייה." />
```

**L195**

```
          title="אין הרשאה"
```

**L196**

```
          subtitle="רק בעל הפוסט או מנהל על יכולים לערוך אותו."
```

**L207**

```
          title="לא ניתן לערוך"
```

**L208**

```
          subtitle={post.status === 'expired' ? 'הפוסט פג תוקף. פרסם אותו מחדש כדי לערוך.' : 'הפוסט הוסר על ידי מנהל ולא ניתן לעריכה.'}
```

**L237**

```
  const DOWNGRADE_SUB = 'לא ניתן להוריד פרטיות לאחר פרסום';
```

**L239**

```
    { v: 'Public', label: '🌍 כולם', openSub: 'הפוסט יוצג בפיד הראשי לכל המשתמשים' },
```

**L240**

```
    { v: 'FollowersOnly', label: '👥 עוקבים בלבד', openSub: 'הפוסט יוצג רק לעוקבים שלך' },
```

**L241**

```
    { v: 'OnlyMe', label: '🔒 רק אני', openSub: 'הפוסט נשמר באופן פרטי' },
```

**L250**

```
        <Text style={styles.headerTitle}>עריכת פוסט</Text>
```

**L260**

```
            <Text style={styles.saveBtnText}>שמור</Text>
```

**L268**

```
          <Text style={styles.typeBadgeText}>{isGive ? '🎁 לתת חפץ' : '🔍 לבקש חפץ'}</Text>
```

**L269**

```
          <Text style={styles.typeBadgeSub}>לא ניתן לשנות את סוג הפוסט לאחר פרסום</Text>
```

**L282**

```
          <Text style={styles.sectionLabel}>כותרת <Text style={styles.required}>*</Text></Text>
```

**L287**

```
            placeholder="מה אתה נותן/מבקש?"
```

**L296**

```
          <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
```

**L303**

```
              placeholder="רחוב"
```

**L311**

```
              placeholder="מס׳"
```

**L319**

```
          <Text style={styles.sectionLabel}>תיאור (אופציונלי)</Text>
```

**L324**

```
            placeholder="פרטים נוספים על החפץ..."
```

**L334**

```
          <Text style={styles.sectionLabel}>קטגוריה</Text>
```

**L352**

```
            <Text style={styles.sectionLabel}>מצב החפץ</Text>
```

**L377**

```
            <Text style={styles.sectionLabel}>דחיפות (אופציונלי)</Text>
```

**L382**

```
              placeholder="לדוגמה: צריך עד שישי"
```

**L392**

```
          <Text style={styles.sectionLabel}>מי יראה את הפוסט</Text>
```

---

## `app/apps/mobile/app/edit-profile.tsx`

**L73**

```
        setNotify({ title: 'טעינה נכשלה', message: err instanceof Error ? err.message : 'שגיאה לא ידועה' });
```

**L97**

```
    isDirty: isDirty && !saving, title: 'יש שינויים שלא נשמרו',
```

**L98**

```
    message: 'אם תצא עכשיו השינויים יאבדו. לצאת בכל זאת?',
```

**L99**

```
    discardLabel: 'צא בלי לשמור', cancelLabel: 'ביטול',
```

**L105**

```
      setNotify({ title: 'שם לא תקין', message: 'נא להזין שם בין 1 ל־50 תווים.' });
```

**L109**

```
      setNotify({ title: 'עיר חסרה', message: 'נא לבחור עיר.' });
```

**L115**

```
      setNotify({ title: 'כתובת לא מלאה', message: 'נא למלא גם מספר בית, או למחוק את שם הרחוב.' });
```

**L119**

```
      setNotify({ title: 'כתובת לא מלאה', message: 'נא למלא שם רחוב, או למחוק את מספר הבית.' });
```

**L157**

```
      const code = err instanceof Error ? err.message : 'שגיאה לא ידועה';
```

**L158**

```
      setNotify({ title: 'שמירה נכשלה', message: mapEditProfileSaveError(code) });
```

**L180**

```
            <Text style={styles.label}>שם מלא</Text>
```

**L182**

```
              maxLength={50} textAlign="right" editable={!saving} placeholder="לדוגמה: רינה כהן" />
```

**L195**

```
            <Text style={styles.label}>ביוגרפיה (אופציונלי)</Text>
```

**L198**

```
              placeholder="קצת עליך — בלי קישורים" />
```

**L202**

```
            {saving ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.saveText}>שמור</Text>}
```

---

## `app/apps/mobile/app/post/[id].tsx`

**L46**

```
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסט</Text>
```

**L48**

```
          <Text style={styles.retryText}>נסה שוב</Text>
```

**L59**

```
          title="הפוסט לא נמצא"
```

**L60**

```
          subtitle="ייתכן שהוא נסגר או שאין לך הרשאה לצפייה."
```

**L72**

```
      return `${post.address.cityName}, רחוב ${post.address.street}`;
```

**L86**

```
            <Text style={styles.typeTagText}>{isGive ? 'לתת' : 'לבקש'}</Text>
```

**L100**

```
              <Text style={styles.conditionLabel}>מצב: </Text>
```

**L106**

```
              <Text style={styles.conditionLabel}>⚡ דחיפות: </Text>
```

**L158**

```
            accessibilityLabel="שלח הודעה למפרסם"
```

**L160**

```
            <Text style={styles.messageBtnText}>💬 שלח הודעה למפרסם</Text>
```

---

## `app/apps/mobile/app/settings/follow-requests.tsx`

**L71**

```
        options={{ ...detailStackScreenOptions, headerTitle: 'בקשות עוקבים' }}
```

**L77**

```
          {'אין בקשות ממתינות.\nבקשות חדשות יופיעו כאן.'}
```

**L107**

```
                  <Text style={styles.btnApproveText}>אשר</Text>
```

**L113**

```
                  <Text style={styles.btnRejectText}>דחה</Text>
```

**L122**

```
        title="שגיאה"
```

**L123**

```
        message="הפעולה נכשלה. נסו שוב."
```

---

## `app/apps/mobile/app/settings/privacy.tsx`

**L76**

```
            <Text style={styles.label}>פרופיל פרטי</Text>
```

**L77**

```
            <Text style={styles.hint}>רק עוקבים מאושרים יראו את הפוסטים והעוקבים שלך.</Text>
```

**L89**

```
              {`בקשות עוקבים${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
```

**L97**

```
        title={pendingTarget === 'Private' ? 'להפוך את הפרופיל לפרטי?' : 'להפוך את הפרופיל לציבורי?'}
```

**L99**

```
          ? 'בקשות עקיבה חדשות ידרשו אישור. עוקבים קיימים יישארו (אפשר להסיר אותם ידנית). פוסטים פתוחים יישארו פתוחים. תוכלי לפרסם פוסטים חדשים לעוקבים בלבד.'
```

**L100**

```
          : 'כל הבקשות הממתינות יאושרו אוטומטית. פוסטים שפורסמו לעוקבים בלבד יישארו גלויים לכל עוקב חדש מעכשיו.'}
```

**L101**

```
        confirmLabel={pendingTarget === 'Private' ? 'הפוך לפרטי' : 'הפוך לציבורי'}
```

---

## `app/apps/mobile/app/settings/report-issue.tsx`

**L37**

```
        setNotify({ title: 'שגיאה', message: t.errorAdminNotFound });
```

**L39**

```
        setNotify({ title: 'שגיאה', message: t.errorGeneric });
```

---

## `app/apps/mobile/app/user/[handle]/followers.tsx`

**L69**

```
      <Stack.Screen options={{ headerTitle: 'עוקבים' }} />
```

**L74**

```
          placeholder="חיפוש לפי שם"
```

**L83**

```
        <Text style={styles.empty}>אין תוצאות</Text>
```

**L106**

```
        title="להסיר עוקב?"
```

**L108**

```
          ? `${pendingRemove.displayName} לא יראה יותר פוסטים שיועדו לעוקבים בלבד, ולא יקבל על כך הודעה. אם הפרופיל שלך פתוח הם יוכלו לעקוב מחדש מיד; אם הוא פרטי — יצטרכו לשלוח בקשה.`
```

**L110**

```
        confirmLabel="הסר"
```

---

## `app/apps/mobile/app/user/[handle]/following.tsx`

**L45**

```
      <Stack.Screen options={{ headerTitle: 'נעקבים' }} />
```

**L50**

```
          placeholder="חיפוש לפי שם"
```

**L59**

```
        <Text style={styles.empty}>אין תוצאות</Text>
```

---

## `app/apps/mobile/app/user/[handle]/index.tsx`

**L99**

```
      <Stack.Screen options={{ headerTitle: 'פרופיל' }} />
```

**L100**

```
      <View style={styles.notFound}><Text style={styles.notFoundText}>משתמש לא נמצא</Text></View>
```

**L150**

```
                <Text style={styles.msgBtnText}>שלח הודעה</Text>
```

---

## `app/apps/mobile/ios/app/Info.plist`

**L55**

```
    <string>נדרש לצלם תמונות לפוסטים</string>
```

**L61**

```
    <string>נדרש לבחור תמונות לפוסטים</string>
```

---

## `app/apps/mobile/src/components/chat/ChatNotFoundView.tsx`

**L19**

```
        title="השיחה לא זמינה"
```

**L20**

```
        subtitle="ייתכן שהשיחה נמחקה או שאין לך גישה אליה."
```

**L23**

```
            <Text style={styles.cta}>חזרה</Text>
```

---

## `app/apps/mobile/src/i18n/locales/he/donations.ts`

**L5**

```
  tabLabel: 'תרומות',
```

**L6**

```
  hubTitle: 'תרומות של:',
```

**L7**

```
  items: { title: 'חפצים', subtitle: 'תרומה ובקשת חפצים' },
```

**L8**

```
  time: { title: 'זמן', subtitle: 'התנדבות וזמן פנוי' },
```

**L9**

```
  money: { title: 'כסף', subtitle: 'תרומה כספית' },
```

**L13**

```
      title: 'אוכל',
```

**L14**

```
      subtitle: 'עמותות חלוקת מזון',
```

**L16**

```
        'קטגוריית האוכל תיפתח בהמשך.\nועד אז מזמינים אתכם ללתרום לקהילה עצמה, ולעזור לנו לגדול ולהתפתח.\nבינתיים אפשר למצוא עמותות למזון, לחיסכון במזון ולחלוקה — בקישורים למטה.',
```

**L19**

```
      title: 'דיור',
```

**L20**

```
      subtitle: 'דיור ושיכון',
```

**L22**

```
        'קטגוריית הדיור תיפתח בהמשך.\nועד אז מזמינים אתכם ללתרום לקהילה עצמה, ולעזור לנו לגדול ולהתפתח.\nאם בא לכם לתמוך בארגוני דיור, שיקום ושיכון — עברו על הקישורים למטה.',
```

**L25**

```
      title: 'תחבורה',
```

**L26**

```
      subtitle: 'הסעות וליווי',
```

**L28**

```
        'קטגוריית התחבורה תיפתח בהמשך.\nועד אז מזמינים אתכם ללתרום לקהילה עצמה, ולעזור לנו לגדול ולהתפתח.\nלהסעות, ליווי וניידות לאנשים שזקוקים לזה — בחרו מהקישורים למטה.',
```

**L31**

```
      title: 'ידע',
```

**L32**

```
      subtitle: 'שיעורים, חניכה והכשרה',
```

**L34**

```
        'קטגוריית הידע תיפתח בהמשך.\nועד אז מזמינים אתכם לתרום מהמקצוע שלכם לקהילה, ולעזור לנו להתפתח.\nלשיעורים, חניכה והכשרה במקומות שמתאימים לכם — היכנסו לאחד הקישורים למטה.',
```

**L37**

```
      title: 'חיות',
```

**L38**

```
      subtitle: 'הצלת חיות וטיפול בהן',
```

**L40**

```
        'קטגוריית החיות תיפתח בהמשך.\nועד אז מזמינים אתכם ללתרום לקהילה עצמה, ולעזור לנו לגדול ולהתפתח.\nאם בא לכם לתמוך בהצלת בעלי חיים ובטיפול בהם — עברו על הקישורים למטה.',
```

**L43**

```
      title: 'רפואה',
```

**L44**

```
      subtitle: 'תמיכה רפואית וציוד',
```

**L46**

```
        'קטגוריית הרפואה תיפתח בהמשך.\nועד אז מזמינים אתכם ללתרום לקהילה עצמה, ולעזור לנו לגדול ולהתפתח.\nלעמותות של ציוד רפואי, טיפול ותמיכה, ותרומת דם ואברים — היכנסו לאחד הקישורים למטה.',
```

**L50**

```
    title: 'תרומה כספית',
```

**L52**

```
      'קטגוריית הכסף תפתח בהמשך. \nועד אז מזמינים אתכם ללתרום לקהילה עצמה, ולעזור לנו לגדול ולהתפתח.\nאבל אם בא לכם לתרום לעמותה קיימת ולקבל החזרי מס, תכנסו לאחד הקישורים פה למטה.',
```

**L53**

```
    openLink: 'פתח את jgive.com',
```

**L54**

```
    linkErrorTitle: 'לא הצלחנו לפתוח את הקישור',
```

**L55**

```
    linkErrorBody: 'נסו דפדפן אחר או הקלידו את הכתובת ידנית.',
```

**L58**

```
    title: 'תרומת זמן',
```

**L60**

```
      'קטגוריית תרומת הזמן תפתח בקרוב.\nועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳, או בכל אחד מהקישורים פה למטה.',
```

**L61**

```
    openLink: 'פתח את לב אחד',
```

**L62**

```
    composerHeading: 'ניתן גם להתנדב ישירות בארגון שלנו, ולעזור לקהילה הזאת להפתח! \nהשאירו הודעה ונחזור אליכם.',
```

**L63**

```
    composerPlaceholder: 'הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות...',
```

**L64**

```
    sendButton: 'שלח הודעה',
```

**L65**

```
    sendError: 'לא נשלח. נסו שוב.',
```

**L66**

```
    sendRetry: 'נסה שוב',
```

**L70**

```
    sectionTitle: 'עמותות וקישורים',
```

**L71**

```
    addButtonA11y: 'הוספת קישור',
```

**L73**

```
      title: 'עוד לא הוספו קישורים',
```

**L74**

```
      body: 'הכי קל להתחיל — הוסיפו את הקישור הראשון.',
```

**L75**

```
      cta: 'הוספת קישור ראשון',
```

**L77**

```
    loading: 'טוען...',
```

**L78**

```
    loadError: 'לא הצלחנו לטעון את הקישורים. נסו שוב.',
```

**L79**

```
    retry: 'נסה שוב',
```

**L81**

```
      open: 'פתח',
```

**L82**

```
      report: 'דווח על קישור',
```

**L83**

```
      edit: 'ערוך',
```

**L84**

```
      remove: 'מחק',
```

**L86**

```
    reportSent: 'תודה, הדיווח התקבל.',
```

**L87**

```
    confirmRemoveTitle: 'מחיקת קישור',
```

**L88**

```
    confirmRemoveBody: 'הקישור יוסתר מהרשימה. להמשיך?',
```

**L89**

```
    confirmRemoveOk: 'מחק',
```

**L90**

```
    confirmRemoveCancel: 'ביטול',
```

**L93**

```
    title: 'הוספת קישור חדש',
```

**L94**

```
    editTitle: 'עריכת קישור',
```

**L95**

```
    urlLabel: 'קישור (URL)',
```

**L97**

```
    nameLabel: 'שם תצוגה',
```

**L98**

```
    namePlaceholder: 'שם העמותה / הקבוצה',
```

**L99**

```
    descriptionLabel: 'תיאור (אופציונלי)',
```

**L100**

```
    descriptionPlaceholder: 'מה אפשר למצוא בקישור הזה?',
```

**L101**

```
    cancel: 'ביטול',
```

**L102**

```
    submit: 'הוסף',
```

**L103**

```
    save: 'שמור',
```

**L104**

```
    submitting: 'מאמת קישור...',
```

**L105**

```
    helperText: 'הקישור יבדק שיהיה תקין לפני ההוספה.',
```

**L106**

```
    editHelperText: 'השינויים יבדקו מול השרת לפני השמירה.',
```

**L108**

```
      invalid_url: 'הקישור לא תקין. ודאו שהוא מתחיל ב-http או https.',
```

**L109**

```
      invalid_input: 'נא לוודא שכל השדות מולאו כראוי.',
```

**L110**

```
      unreachable: 'הקישור לא נפתח. ייתכן שהוא לא פעיל.',
```

**L111**

```
      rate_limited: 'הוספתם הרבה קישורים בזמן קצר. נסו שוב בעוד שעה.',
```

**L112**

```
      unauthorized: 'יש להתחבר כדי להוסיף קישור.',
```

**L113**

```
      forbidden: 'אין הרשאה לערוך את הקישור הזה.',
```

**L114**

```
      network: 'בעיית רשת. נסו שוב.',
```

**L115**

```
      unknown: 'שגיאה לא צפויה. נסו שוב.',
```

**L121**

```
  tabLabel: 'חיפוש',
```

**L122**

```
  title: 'חיפוש',
```

**L123**

```
  placeholder: 'חפש אנשים, פוסטים, קישורים...',
```

**L126**

```
  all: 'הכל',
```

**L127**

```
  posts: 'פוסטים',
```

**L128**

```
  people: 'אנשים',
```

**L129**

```
  links: 'קישורים',
```

**L132**

```
  sortBy: 'מיין לפי',
```

**L133**

```
  sortRelevance: 'רלוונטיות',
```

**L134**

```
  sortNewest: 'חדש ביותר',
```

**L135**

```
  sortFollowers: 'עוקבים',
```

**L138**

```
  filters: 'סינון',
```

**L139**

```
  filterCity: 'עיר',
```

**L140**

```
  filterPostType: 'סוג פוסט',
```

**L141**

```
  filterCategory: 'קטגוריה',
```

**L142**

```
  filterDonationCategory: 'קטגוריית תרומה',
```

**L143**

```
  filterMinFollowers: 'מינימום עוקבים',
```

**L144**

```
  clearFilters: 'נקה סינון',
```

**L145**

```
  applyFilters: 'החל סינון',
```

**L148**

```
  sectionPeople: 'אנשים',
```

**L149**

```
  sectionPosts: 'פוסטים',
```

**L150**

```
  sectionLinks: 'קישורים',
```

**L151**

```
  showAll: 'הצג הכל',
```

**L154**

```
  followers: '{{count}} עוקבים',
```

**L155**

```
  givenItems: '{{count}} פריטים נתנו',
```

**L156**

```
  inCategory: 'בקטגוריית {{category}}',
```

**L159**

```
  noResults: 'לא נמצאו תוצאות',
```

**L160**

```
  noResultsDesc: 'נסו מילות חיפוש אחרות או שנו את הסינון.',
```

**L161**

```
  recentSearches: 'חיפושים אחרונים',
```

**L162**

```
  clearRecent: 'נקה היסטוריה',
```

**L163**

```
  startSearching: 'התחילו לחפש',
```

**L164**

```
  startSearchingDesc: 'חפשו אנשים, פוסטים וקישורים בכל הקהילה.',
```

**L165**

```
  minChars: 'הקלידו לפחות 2 תווים',
```

**L166**

```
  loading: 'מחפש...',
```

**L167**

```
  nationalLinks: 'מציג קישורים ארציים',
```

**L168**

```
  give: 'נתינה',
```

**L169**

```
  request: 'בקשה',
```

**L170**

```
  giveBadge: '🎁 נתינה',
```

**L171**

```
  requestBadge: '🔍 בקשה',
```

**L175**

```
    Furniture: 'רהיטים',
```

**L176**

```
    Clothing: 'בגדים',
```

**L177**

```
    Books: 'ספרים',
```

**L178**

```
    Toys: 'משחקים',
```

**L179**

```
    BabyGear: 'ציוד תינוקות',
```

**L180**

```
    Kitchen: 'מטבח',
```

**L181**

```
    Sports: 'ספורט',
```

**L182**

```
    Electronics: 'חשמל',
```

**L183**

```
    Tools: 'כלי עבודה',
```

**L184**

```
    Other: 'אחר',
```

**L189**

```
    time: 'זמן',
```

**L190**

```
    money: 'כסף',
```

**L191**

```
    food: 'אוכל',
```

**L192**

```
    housing: 'דיור',
```

**L193**

```
    transport: 'תחבורה',
```

**L194**

```
    knowledge: 'ידע',
```

**L195**

```
    animals: 'חיות',
```

**L196**

```
    medical: 'רפואה',
```

---

## `app/apps/mobile/src/i18n/locales/he/index.ts`

**L3**

```
// Mapped to: R-MVP-Core-4 (עברית בלבד ב-MVP)
```

**L26**

```
  appName: 'KC - קהילת קארמה',
```

**L30**

```
    welcome: 'ברוכים הבאים',
```

**L31**

```
    tagline: 'תן. קבל. חבר קהילה.',
```

**L32**

```
    continueWithGoogle: 'המשך עם Google',
```

**L33**

```
    continueWithApple: 'המשך עם Apple',
```

**L34**

```
    continueWithPhone: 'המשך עם מספר טלפון',
```

**L35**

```
    continueWithEmail: 'המשך עם דוא"ל',
```

**L36**

```
    orDivider: 'או',
```

**L37**

```
    guestPreview: 'הצץ בפיד',
```

**L38**

```
    guestPreviewBackA11y: 'חזרה למסך הנחיתה',
```

**L39**

```
    signIn: 'כניסה',
```

**L40**

```
    signUp: 'הרשמה',
```

**L41**

```
    email: 'דוא"ל',
```

**L42**

```
    password: 'סיסמה',
```

**L43**

```
    forgotPassword: 'שכחתי סיסמה',
```

**L44**

```
    noAccount: 'אין לי חשבון עדיין',
```

**L45**

```
    hasAccount: 'יש לי כבר חשבון',
```

**L46**

```
    phone: 'מספר טלפון',
```

**L47**

```
    otpCode: 'קוד אימות',
```

**L48**

```
    otpSent: 'שלחנו קוד SMS ל-{{phone}}',
```

**L49**

```
    verify: 'אמת',
```

**L50**

```
    resendOtp: 'שלח שוב',
```

**L51**

```
    bySigningUp: 'בהרשמה אתה מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.',
```

**L52**

```
    verifyTitle: 'בדוק את האימייל שלך',
```

**L53**

```
    verifyBodyBefore: 'שלחנו לינק לאימות אל ',
```

**L54**

```
    verifyBodyAfter: '. לחץ עליו כדי להמשיך.',
```

**L55**

```
    openMail: 'פתח אימייל',
```

**L56**

```
    resendWithCountdown: 'שלח שוב ({{count}})',
```

**L57**

```
    resendOk: 'נשלח. בדוק את תיבת הדואר.',
```

**L58**

```
    networkError: 'שגיאת רשת. נסה שוב.',
```

**L59**

```
    changeEmail: 'שנה אימייל',
```

**L64**

```
    aboutIntroTitle: 'ברוכים הבאים לקארמה',
```

**L66**

```
      'מחברים בין מי שרוצה לתת, למי שצריך לקבל. פשוט, חברי, וחינמי לחלוטין.',
```

**L67**

```
    aboutIntroCta: 'מתחילים',
```

**L68**

```
    pillarFree: 'חינמי לחלוטין',
```

**L69**

```
    pillarNoAds: 'בלי פרסומות',
```

**L70**

```
    pillarNonProfit: 'ללא רווחים',
```

**L71**

```
    stepBasic: 'פרטים בסיסיים',
```

**L73**

```
      ' וודא את השם ומלא את הכתובת שלך — כדי שנוכל להתאים פוסטים אליך. אפשר להשלים גם בהמשך.',
```

**L74**

```
    displayName: 'שם מלא',
```

**L75**

```
    city: 'עיר מגורים',
```

**L76**

```
    stepPhoto: 'תמונת פרופיל',
```

**L77**

```
    uploadPhoto: 'העלה תמונה',
```

**L78**

```
    skip: 'דלג',
```

**L79**

```
    continue: 'המשך',
```

**L80**

```
    stepWelcome: 'ברוכים הבאים לקהילה!',
```

**L81**

```
    welcomeDesc: 'כאן תוכל לתת ולקבל חפצים בחינם מוחלט — ללא כסף, ללא חליפין.',
```

**L82**

```
    howItWorks: 'איך זה עובד?',
```

**L83**

```
    step1Title: 'פרסם מה יש לך לתת',
```

**L84**

```
    step1Desc: 'תמונה + כמה מילים — וזהו.',
```

**L85**

```
    step2Title: 'בקש מה שאתה צריך',
```

**L86**

```
    step2Desc: 'פרסם בקשה ומישהו מהקהילה יענה.',
```

**L87**

```
    step3Title: 'תאם מסירה',
```

**L88**

```
    step3Desc: 'שוחח ישירות עם הנותן/מקבל.',
```

**L89**

```
    letsGo: 'יאללה, מתחילים!',
```

**L90**

```
    stepProgress: 'שלב {{step}} מתוך 4',
```

**L91**

```
    noActiveSession: 'אין סשן פעיל. נסה להתחבר שוב.',
```

**L92**

```
    fillNameAndCity: 'יש למלא שם ועיר',
```

**L93**

```
    saveFailed: 'שמירה נכשלה',
```

**L94**

```
    uploadFailed: 'העלאת התמונה נכשלה',
```

**L95**

```
    uploadFailedBody: 'אפשר לדלג ולהוסיף תמונה מאוחר יותר.',
```

**L96**

```
    removeFailed: 'הסרת התמונה נכשלה',
```

**L97**

```
    softGateTitle: 'נשלים פרטים בסיסיים',
```

**L98**

```
    fullNamePlaceholder: 'לדוגמה: רינה כהן',
```

**L99**

```
    unknownError: 'שגיאה לא ידועה',
```

**L100**

```
    saveAndContinue: 'שמור והמשך',
```

**L137**

```
    title: 'תנאי שימוש ומדיניות פרטיות',
```

**L138**

```
    lastUpdated: 'עודכן לאחרונה: מאי 2026',
```

**L139**

```
    termsTitle: 'תנאי שימוש',
```

**L140**

```
    termsText: 'ברוכים הבאים לקהילת קארמה. השימוש באפליקציה מהווה הסכמה לתנאים אלו. האפליקציה נועדה למסירה וקבלת חפצים בחינם בלבד. חל איסור מוחלט על סחר, מכירה, או דרישת תמורה כלשהי. המשתמש אחראי בלעדית על טיב החפצים שהוא מוסר. אין לפרסם תוכן פוגעני, שקרי או מפר זכויות יוצרים. הנהלת האפליקציה שומרת לעצמה את הזכות להסיר תכנים או לחסום משתמשים שיפרו כללים אלו.',
```

**L141**

```
    privacyTitle: 'מדיניות פרטיות',
```

**L142**

```
    privacyText: 'פרטיותכם חשובה לנו. אנו אוספים מידע בסיסי כגון שם, עיר ומיקום למטרת הצגת הפוסטים בקהילה בלבד. איננו משתפים מידע זה עם צדדים שלישיים ללא הסכמתכם. הכתובת המלאה תוצג אך ורק בהתאם להגדרת הפרטיות שתבחרו בכל פוסט. האפליקציה משתמשת בשירותי התחברות מאובטחים (Google/Apple) ואינה שומרת סיסמאות שרת. ניתן לבקש מחיקת חשבון וכלל הנתונים דרך הגדרות האפליקציה.',
```

**L167**

```
    loading: 'טוען...',
```

**L168**

```
    error: 'אירעה שגיאה',
```

**L169**

```
    retry: 'נסה שוב',
```

**L170**

```
    cancel: 'ביטול',
```

**L171**

```
    confirm: 'אישור',
```

**L172**

```
    save: 'שמור',
```

**L173**

```
    delete: 'מחק',
```

**L174**

```
    yes: 'כן',
```

**L175**

```
    no: 'לא',
```

**L176**

```
    back: 'חזרה',
```

**L177**

```
    close: 'סגור',
```

**L178**

```
    gotIt: 'הבנתי',
```

**L179**

```
    now: 'עכשיו',
```

**L180**

```
    today: 'היום',
```

**L181**

```
    yesterday: 'אתמול',
```

**L182**

```
    minutesAgo: 'לפני {{count}} דקות',
```

**L183**

```
    hoursAgo: 'לפני {{count}} שעות',
```

**L184**

```
    daysAgo: 'לפני {{count}} ימים',
```

**L185**

```
    unknownError: 'שגיאה לא ידועה',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/aboutContentCopyA.ts`

**L3**

```
  title: 'אודות קהילת קארמה',
```

**L4**

```
  tagline: 'הקיבוץ הקפיטליסטי. רשת של נתינה, בלי תמורה.',
```

**L7**

```
  heroEyebrow: 'קיבוץ דיגיטלי בעולם קפיטליסטי',
```

**L8**

```
  heroTitle: 'נתינה היא לא מותרות',
```

**L10**

```
    'קארמה מחברת בין מי שיש לו מה לתת לבין מי שצריך — בכבוד, בפרטיות, ובלי תמורה כספית בין משתמשים.',
```

**L12**

```
  footerVersion: 'גרסה 0.1.0',
```

**L13**

```
  footerRights: '© 2026 כל הזכויות שמורות לקהילת קארמה',
```

**L16**

```
  numbersTitle: 'הקהילה במספרים',
```

**L17**

```
  numbersLead: 'אנחנו מודדים הצלחה בקשרים אנושיים — לא בעסקאות.',
```

**L19**

```
    'המספרים האלה מספרים סיפור פשוט: בכל יום עוד אנשים בוחרים לתת ולקבל בלי שום מחיר. כשמצטרפים אלינו, נהיים חלק מהסיפור.',
```

**L22**

```
  visionTitle: 'החזון המלא',
```

**L24**

```
    'אנחנו בונים את שכבת הנתינה האזרחית של העשור הבא — מקום שבו מסירת חפץ, זמן או ידע היא טבעית, בטוחה ומכובדת. החזון שלנו הוא להפוך את "מישהו פה בטוח יעזור לי" לחוויה שגרתית — בלי בושה, בלי התמקחות, ובלי להפוך נדיבות לעסקה.',
```

**L27**

```
  problemsTitle: 'אילו בעיות אנחנו פותרים',
```

**L29**

```
    '🔄 עודף צריכה ופריטים שמבזבזים מקום במקום לשרת אחרים.\n\n' +
```

**L30**

```
    '🤐 הבושה לבקש עזרה — שמשאירה אנשים לבד מול הצורך.\n\n' +
```

**L31**

```
    '🔍 פערי מידע — מי שיש לו לא תמיד יודע למי זה באמת ישנה את היום.\n\n' +
```

**L32**

```
    '💰 פלטפורמות ״חינם״ שנסחפות לכיוון סחר, פרסום אגרסיבי או מודלים לא שקופים.\n\n' +
```

**L33**

```
    'קארמה מארגנת את הכול סביב אמון, מיקום ופרטיות — ולא סביב כסף.',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/aboutContentCopyB.ts`

**L4**

```
  featuresTitle: 'מה יש באפליקציה',
```

**L6**

```
    '✨ היום (MVP):\n' +
```

**L7**

```
    'פרסום מסירות ובקשות, גילוי לפי מיקום ומסננים, צ׳אט ישיר, פרופיל פרטי עם בקשות מעקב, דיווחים, וסטטיסטיקות אישיות וקהילתיות.\n\n' +
```

**L8**

```
    '🚀 בהמשך הדרך:\n' +
```

**L9**

```
    'גילוי חכם ומדויק יותר, פיקוח קהילתי שקוף, שותפויות עם עמותות, שיפורי נגישות, ותכנים שמלמדים לתת ולקבל בצורה בריאה.',
```

**L12**

```
  missionTitle: 'מי אנחנו',
```

**L14**

```
    'השם ״קארמה״ מזכיר מעגליות: מה שיוצא מהקהילה — חוזר אליה כטוב. אנחנו מאמינים שטכנולוגיה טובה מחזקת סולידריות מקומית, מצמצמת בזבוז, ומייצרת תחושת בית.',
```

**L17**

```
  howItWorksTitle: 'איך זה עובד',
```

**L19**

```
    '1. מפרסמים פוסט: מה יש לכם לתת, או מה אתם מחפשים.\n\n' +
```

**L20**

```
    '2. מקבלים תגובות בצ׳אט פנימי, מתאמים מקום ושעה למסירה.\n\n' +
```

**L21**

```
    '3. מסמנים שהמסירה הסתיימה — וזהו. בלי תשלומים, בלי עמלות, בלי מתווכים.',
```

**L24**

```
  audienceTitle: 'למי זה מתאים',
```

**L26**

```
    'משפחות שמצמצמות חפצים, סטודנטים שעוברים דירה, עולים חדשים שמתחילים מחדש, קשישים שזקוקים לעזרה, קהילות שכונתיות, ארגונים שרוצים להגיע לשטח — וכל מי שמעדיף לתת ולקבל דרך קהילה ולא דרך זירת מכירות.',
```

**L29**

```
  valuesTitle: 'הערכים שלנו',
```

**L31**

```
    'כבוד מלא לנותן ולמקבל.\n\n' +
```

**L32**

```
    'שקיפות ואחריות.\n\n' +
```

**L33**

```
    'פרטיות כברירת מחדל.\n\n' +
```

**L34**

```
    'הבטיחות תמיד קודמת לצמיחה.\n\n' +
```

**L35**

```
    'הקהילה קודמת לכל אלגוריתם.',
```

**L39**

```
    { icon: 'heart-outline', label: 'כבוד הדדי' },
```

**L40**

```
    { icon: 'eye-outline', label: 'שקיפות ואחריות' },
```

**L41**

```
    { icon: 'lock-closed-outline', label: 'פרטיות כברירת מחדל' },
```

**L42**

```
    { icon: 'shield-checkmark-outline', label: 'בטיחות לפני צמיחה' },
```

**L43**

```
    { icon: 'people-outline', label: 'קהילה לפני אלגוריתם' },
```

**L44**

```
    { icon: 'leaf-outline', label: 'נתינה ללא תמורה' },
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/aboutContentCopyC.ts`

**L4**

```
  roadmapTitle: 'מפת הדרכים — שלבים אל החזון',
```

**L5**

```
  roadmapPhase1Title: 'שלב א׳ — ליבה יציבה (MVP)',
```

**L7**

```
    'זהות, פוסטים, צ׳אט, פרטיות, דיווחים, סטטיסטיקות בסיסיות וחוויית שימוש נקייה — כדי שהקהילה תוכל לגדול על בסיס אמון.',
```

**L8**

```
  roadmapPhase2Title: 'שלב ב׳ — עומק קהילתי',
```

**L10**

```
    'שיפורי גילוי, בטיחות, פיקוח שקוף, חוויית onboarding טובה יותר, וכלים שמחברים בין קארמה לארגונים ולשכונות.',
```

**L11**

```
  roadmapPhase3Title: 'שלב ג׳ — השפעה רחבה',
```

**L13**

```
    'שותפויות עם עמותות, אירועים קהילתיים, חינוך לנתינה אחראית, ומודלים שמאפשרים למובילי קהילה לנהל מרחבים בריאים.',
```

**L14**

```
  roadmapPhase4Title: 'שלב ד׳ — טווח ארוך',
```

**L16**

```
    'הרחבות שמשרתות את החזון בלי למכור את המשתמשים: נתינת זמן ומומחיות, חיבור למעגלים רחבים, וכלים שמודדים את הטוב שממשיך להיווצר בשטח.',
```

**L22**

```
      label: 'שלב א׳',
```

**L24**

```
      status: 'עכשיו',
```

**L25**

```
      title: 'ליבה יציבה (MVP)',
```

**L26**

```
      body: 'זהות, פוסטים, צ׳אט, פרטיות, דיווחים, וסטטיסטיקות בסיסיות — בסיס שמאפשר לקהילה לגדול על אמון.',
```

**L29**

```
      label: 'שלב ב׳',
```

**L31**

```
      status: 'בקרוב',
```

**L32**

```
      title: 'עומק קהילתי',
```

**L33**

```
      body: 'גילוי טוב יותר, פיקוח שקוף, onboarding משופר, וגשרים לעמותות ולשכונות.',
```

**L36**

```
      label: 'שלב ג׳',
```

**L38**

```
      status: 'בעתיד',
```

**L39**

```
      title: 'השפעה רחבה',
```

**L40**

```
      body: 'שותפויות, אירועים, חינוך לנתינה אחראית, וכלים למובילי קהילה.',
```

**L43**

```
      label: 'שלב ד׳',
```

**L45**

```
      status: 'טווח ארוך',
```

**L46**

```
      title: 'מעבר לחפצים',
```

**L47**

```
      body: 'נתינת זמן ומומחיות, חיבור למעגלים רחבים, ומדידה של הטוב שנוצר בשטח.',
```

**L52**

```
  goalsTitle: 'המטרות שלנו',
```

**L54**

```
    '🎯 להפוך את המסירה והבקשה לעניין שגרתי ובטוח.\n\n' +
```

**L55**

```
    '♻️ לצמצם בזבוז ולחזק כלכלה מעגלית מקומית.\n\n' +
```

**L56**

```
    '🤝 לבנות אמון דרך מוצר אמיתי — לא דרך הבטחות ריקות.\n\n' +
```

**L57**

```
    '💡 להישאר נאמנים למודל ללא תמורה כספית בין משתמשים.',
```

**L60**

```
  contributionsTitle: 'סוגי תרומה — היום ובעתיד',
```

**L62**

```
    'בהמשך הדרך נרחיב את סוגי הנתינה: נתינת זמן (התנדבות ממוקדת) שתישקל בזהירות מול עומס המקבלים, נתינת מומחיות (ליווי, הדרכה, סיוע טכני), חיבור לארגונים מאומתים, וקמפיינים קהילתיים לאיסוף ציוד לפי צורך אמיתי.\n\n' +
```

**L63**

```
    'כל אלה ייכנסו רק כשהבטיחות והפרטיות יהיו מוכנות. אנחנו לא ממהרים לפיצ׳ר על חשבון אמון.',
```

**L66**

```
  contributionsAvailableBadge: 'זמין',
```

**L67**

```
  contributionsComingSoonBadge: 'בקרוב',
```

**L71**

```
    { icon: 'gift-outline', label: 'חפצים וציוד', available: true },
```

**L72**

```
    { icon: 'nutrition-outline', label: 'מזון ומוצרי בסיס', available: true },
```

**L73**

```
    { icon: 'book-outline', label: 'ידע והדרכה', available: true },
```

**L74**

```
    { icon: 'hand-right-outline', label: 'התנדבות ועזרה', available: true },
```

**L75**

```
    { icon: 'time-outline', label: 'נתינת זמן ומומחיות', available: false },
```

**L76**

```
    { icon: 'business-outline', label: 'חיבור לעמותות', available: false },
```

**L77**

```
    { icon: 'megaphone-outline', label: 'קמפיינים קהילתיים', available: false },
```

**L78**

```
    { icon: 'medkit-outline', label: 'סיוע ייעודי', available: false },
```

**L82**

```
  teamTitle: 'הצוות',
```

**L83**

```
  teamLeadTitle: 'נוח סרוסי — מייסד הפרויקט',
```

**L84**

```
  teamLeadName: 'נוח סרוסי',
```

**L85**

```
  teamLeadRole: 'מייסד הפרויקט',
```

**L86**

```
  teamLeadInitials: 'נ"ס',
```

**L88**

```
    'מתכנת לשעבר בצבא. בסוף השירות הבנתי שהדרך שלי להפוך טוב לנגיש יותר היא דרך טכנולוגיה — חיבור פשוט ובטוח בין מי שרוצה לתת למי שצריך לקבל. אני מאמין בכוח של קהילה לשנות מציאות, ואשמח שתצטרפו אלי למסע. כרגע הליבה נבנית סביבי ומסביב לקהילה המוקדמת — פתוחים בשמחה לשותפים, מתנדבים ויועצים בכל תחום.',
```

**L91**

```
  contactTitle: 'יצירת קשר',
```

**L93**

```
    'רעיון, שיתוף פעולה או דיווח על באג — נשמח לשמוע. אפשר לפתוח פנייה דרך ״דיווח על בעיה״ בהגדרות, או לכתוב אלינו ל-karmacommunity2.0@gmail.com.',
```

**L94**

```
  contactCta: 'פנייה לתמיכה באפליקציה',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/aboutContentNavFaq.ts`

**L3**

```
  menuTitle: 'תפריט',
```

**L4**

```
  menuFab: 'תפריט מקטעים',
```

**L5**

```
  sectionNavHint: 'בחרו מקטע כדי לגלול אליו',
```

**L7**

```
  navNumbers: 'במספרים',
```

**L8**

```
  navVision: 'החזון',
```

**L9**

```
  navProblems: 'הבעיות',
```

**L10**

```
  navFeatures: 'מה יש',
```

**L11**

```
  navMission: 'מי אנחנו',
```

**L12**

```
  navHow: 'איך זה עובד',
```

**L13**

```
  navAudience: 'למי זה מתאים',
```

**L14**

```
  navValues: 'ערכים',
```

**L15**

```
  navRoadmap: 'מפת דרכים',
```

**L16**

```
  navGoals: 'מטרות',
```

**L17**

```
  navContributions: 'סוגי תרומה',
```

**L18**

```
  navTeam: 'הצוות',
```

**L19**

```
  navInstagram: 'אינסטגרם',
```

**L20**

```
  navFaq: 'שאלות נפוצות',
```

**L21**

```
  navContact: 'יצירת קשר',
```

**L24**

```
  faq1Q: 'האם השירות חינמי לחלוטין?',
```

**L26**

```
    'כן. אין סחר בין משתמשים, אין תיווך, אין עמלות ואין פרסומות באפליקציה. המערכת רק מחברת — וההסכמות נשארות ביניכם.',
```

**L27**

```
  faq2Q: 'מה ההבדל בין ה-MVP לחזון המלא?',
```

**L29**

```
    'ב-MVP מתמקדים בליבה: פרסום, גילוי, צ׳אט וסגירת מסירה. בהמשך מרחיבים כלים קהילתיים, שקיפות, שותפויות וסוגי תרומה נוספים — תמיד ללא תמורה כספית בין משתמשים.',
```

**L30**

```
  faq3Q: 'איך מגנים על הבטיחות והפרטיות?',
```

**L32**

```
    'יש מצבי פרטיות לפרופיל ולפוסטים, מערכת דיווחים, ניהול קהילה וכללי שימוש ברורים. אנחנו ממשיכים לחזק את שכבות האמון והשקיפות ככל שהקהילה גדלה.',
```

**L33**

```
  faq4Q: 'האם אפשר לתרום כסף דרך האפליקציה?',
```

**L35**

```
    'יש מסלולי תרומה חיצוניים שמובילים לארגונים מאומתים. תרומות כספיות ישירות בין משתמשים אינן חלק מהחזון — אנחנו שומרים על מרחב נקי מתמורה אישית.',
```

**L36**

```
  faq5Q: 'איך אפשר להשפיע על מפת הדרכים?',
```

**L38**

```
    'בכיף — דרך ״דיווח על בעיה״ באפליקציה, במייל או באינסטגרם. אנחנו בונים יחד עם הקהילה ובוחנים כל הצעה דרך עדשת בטיחות, פשטות וערכים.',
```

**L43**

```
      q: 'האם השירות חינמי לחלוטין?',
```

**L44**

```
      a: 'כן. אין סחר בין משתמשים, אין תיווך, אין עמלות ואין פרסומות באפליקציה. המערכת רק מחברת — וההסכמות נשארות ביניכם.',
```

**L47**

```
      q: 'מה ההבדל בין ה-MVP לחזון המלא?',
```

**L48**

```
      a: 'ב-MVP מתמקדים בליבה: פרסום, גילוי, צ׳אט וסגירת מסירה. בהמשך מרחיבים כלים קהילתיים, שקיפות, שותפויות וסוגי תרומה נוספים — תמיד ללא תמורה כספית בין משתמשים.',
```

**L51**

```
      q: 'איך מגנים על הבטיחות והפרטיות?',
```

**L52**

```
      a: 'יש מצבי פרטיות לפרופיל ולפוסטים, מערכת דיווחים, ניהול קהילה וכללי שימוש ברורים. אנחנו ממשיכים לחזק את שכבות האמון והשקיפות ככל שהקהילה גדלה.',
```

**L55**

```
      q: 'האם אפשר לתרום כסף דרך האפליקציה?',
```

**L56**

```
      a: 'יש מסלולי תרומה חיצוניים שמובילים לארגונים מאומתים. תרומות כספיות ישירות בין משתמשים אינן חלק מהחזון — אנחנו שומרים על מרחב נקי מתמורה אישית.',
```

**L59**

```
      q: 'איך אפשר להשפיע על מפת הדרכים?',
```

**L60**

```
      a: 'בכיף — דרך ״דיווח על בעיה״ באפליקציה, במייל או באינסטגרם. אנחנו בונים יחד עם הקהילה ובוחנים כל הצעה דרך עדשת בטיחות, פשטות וערכים.',
```

**L63**

```
      q: 'איך אפשר לתרום לפרויקט עצמו?',
```

**L64**

```
      a: 'הקוד פתוח. אפשר לתרום ב-GitHub, להפיץ את הפרויקט בקרב חברים, או פשוט להשתמש ולהיות חלק מהקהילה הראשונית.',
```

**L68**

```
  instagramTitle: 'עקבו אחרינו באינסטגרם',
```

**L69**

```
  instagramCaption: 'עדכונים, סיפורי קהילה וקול מהשטח — @karma_community_',
```

**L70**

```
  instagramOpen: 'פתיחה באינסטגרם',
```

**L71**

```
  instagramEmbedNote: 'אם התצוגה המוטמעת לא נטענה, פתחו דרך הכפתור.',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/chat.ts`

**L3**

```
  title: 'שיחות',
```

**L4**

```
  noChats: 'אין שיחות עדיין',
```

**L5**

```
  noChatsDesc: 'פנה למפרסמים ישירות מתוך הפוסטים.',
```

**L6**

```
  inputPlaceholder: 'כתוב הודעה...',
```

**L7**

```
  send: 'שלח',
```

**L8**

```
  read: 'נקרא',
```

**L9**

```
  defaultFirstMessage: 'היי! ראיתי את הפוסט שלך על {{title}}. מעוניין/ת לדעת עוד.',
```

**L10**

```
  report: 'דווח על שיחה',
```

**L11**

```
  menuDeleteFromInbox: 'הסר מהאינבוקס שלי',
```

**L12**

```
  hideFromInboxTitle: 'להסיר את השיחה מהאינבוקס?',
```

**L14**

```
    'השיחה תיעלם רק אצלך. אצל הצד השני נשארת ההיסטוריה. הודעה חדשה באותו שרשור עלולה להחזיר אותה לרשימה.',
```

**L15**

```
  hideFromInboxCancel: 'ביטול',
```

**L16**

```
  hideFromInboxConfirm: 'הסר',
```

**L17**

```
  menuReport: 'דווח על השיחה',
```

**L18**

```
  minutesAgoShort: "לפני {{count}} דק'",
```

**L21**

```
  hideChatA11y: 'הסר שיחה מהאינבוקס',
```

**L24**

```
  anchoredOpenA11y: 'פתח את הפוסט',
```

**L25**

```
  anchoredTypeGive: 'נותן',
```

**L26**

```
  anchoredTypeRequest: 'מבקש',
```

**L29**

```
  reportChatTitle: 'דיווח על השיחה',
```

**L30**

```
  reportChatNotePlaceholder: 'תיאור (אופציונלי, עד 500 תווים)',
```

**L31**

```
  reportChatDuplicateBody: 'דיווחת על השיחה הזו ב-24 השעות האחרונות.',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/closure.ts`

**L6**

```
  markGiveCta: 'סמן כנמסר ✓',
```

**L7**

```
  markRequestCta: 'סמן שקיבלתי ✓',
```

**L8**

```
  reopenCta: '📤 פתח מחדש',
```

**L9**

```
  reopenA11y: 'פתח מחדש',
```

**L12**

```
  step1GiveTitle: '🤝  האם הפריט באמת נמסר?',
```

**L13**

```
  step1RequestTitle: '🤝  האם באמת קיבלת את הפריט?',
```

**L15**

```
    'חשוב לסמן רק אחרי המסירה הפיזית — לא אחרי תיאום בצ\'אט. אם הפריט עדיין לא הגיע ליד מקבל, אל תסמן.',
```

**L17**

```
    'חשוב לסמן רק אחרי שהפריט הגיע אליך — לא אחרי תיאום בצ\'אט. אם עדיין לא קיבלת את הפריט, אל תסמן.',
```

**L18**

```
  step1GiveCta: 'כן, נמסר ✓',
```

**L19**

```
  step1RequestCta: 'כן, קיבלתי ✓',
```

**L22**

```
  step2GiveTitle: '🎁  למי מסרת את הפריט?',
```

**L23**

```
  step2RequestTitle: '🎁  ממי קיבלת את הפריט?',
```

**L24**

```
  step2CloseWithoutMarking: 'סגור בלי לסמן',
```

**L25**

```
  step2MarkAndClose: 'סמן וסגור ✓',
```

**L26**

```
  step2NoSearchResults: 'לא נמצא משתמש בשם כזה.',
```

**L29**

```
  pickModeChats: 'מצ\'אטים שלי',
```

**L30**

```
  pickModeSearch: 'חיפוש כללי',
```

**L31**

```
  searchPlaceholder: 'חפש לפי שם או handle',
```

**L33**

```
    'עדיין לא היה איתך צ\'אט עם אף אחד. עבור ל"חיפוש כללי" כדי לבחור מהרשימה הכללית, או לחץ "סגור בלי לסמן".',
```

**L36**

```
  explainerGiveTitle: '✨  תודה שתרמת!',
```

**L37**

```
  explainerRequestTitle: '✨  תודה שעדכנת!',
```

**L38**

```
  explainerLead: 'כך זה עובד:',
```

**L40**

```
    '• פוסטים שסומנו עם מקבל — נשמרים לתמיד ומופיעים בסטטיסטיקה שלך ושל המקבל.',
```

**L42**

```
    '• פוסטים שסומנו עם נותן — נשמרים לתמיד ומופיעים בסטטיסטיקה שלך ושל הנותן.',
```

**L44**

```
    '• פוסטים שנסגרו בלי לסמן — נשמרים 7 ימים למקרה של טעות, ואז נמחקים אוטומטית.',
```

**L45**

```
  explainerGiveCounterBullet: '• בכל מקרה — "פריטים שתרמתי" שלך עולה ב-1.',
```

**L46**

```
  explainerRequestCounterBullet: '• בכל מקרה — "פריטים שקיבלתי" שלך עולה ב-1.',
```

**L47**

```
  explainerDontShowAgain: 'אל תציג שוב',
```

**L50**

```
  errorTitle: '⚠️  משהו לא עבד',
```

**L51**

```
  errorDefault: 'לא הצלחנו להתחיל את תהליך הסגירה. נסה שוב עוד רגע.',
```

**L54**

```
  reopenTitle: '📤  לפתוח את הפוסט מחדש?',
```

**L55**

```
  reopenBodyClosedDelivered: 'הפוסט יחזור להיות פעיל בפיד.',
```

**L56**

```
  reopenBodyDeletedNoRecipient: 'הפוסט יחזור להיות פעיל בפיד והוא לא יימחק.',
```

**L57**

```
  reopenBulletMarkedRemoved: '• הסימון של {{markedSide}} יוסר.',
```

**L58**

```
  reopenBulletMarkedCounter: '• "{{counter}}" שלו יקטן ב-1 (בלי התראה).',
```

**L59**

```
  reopenBulletOwnerCounter: '• "{{counter}}" שלך יקטן ב-1.',
```

**L60**

```
  reopenConfirmCta: 'פתח מחדש',
```

**L61**

```
  markedSideGive: 'מי שקיבל',
```

**L62**

```
  markedSideRequest: 'מי שמסר לך',
```

**L63**

```
  counterDonated: 'פריטים שתרמתי',
```

**L64**

```
  counterReceived: 'פריטים שקיבלתי',
```

**L67**

```
  calloutGiveLabel: 'נמסר ל',
```

**L68**

```
  calloutRequestLabel: 'ניתן על-ידי',
```

**L69**

```
  calloutGiveSublabel: 'הפריט נמסר',
```

**L70**

```
  calloutRequestSublabel: 'הבקשה נענתה',
```

**L73**

```
  unmarkSelfCta: 'הסר סימון שלי',
```

**L74**

```
  unmarkConfirmTitle: 'הסרת סימון',
```

**L76**

```
    'לא תקבל קרדיט על פריט זה, ובעל הפוסט יקבל הודעה. הפוסט יישמר 7 ימים לפני מחיקה.',
```

**L77**

```
  unmarkConfirmCta: 'הסר',
```

**L78**

```
  unmarkErrorBody: 'לא הצלחנו להסיר את הסימון. נסה שוב.',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/errors.ts`

**L7**

```
    authentication_failed: 'לא הצלחנו להתחבר עם הפרטים האלו. בדקו את הדוא"ל והסיסמה ונסו שוב.',
```

**L8**

```
    invalid_credentials: 'דוא"ל או סיסמה שגויים.',
```

**L9**

```
    email_already_in_use: 'הדוא"ל הזה כבר רשום. נסה להתחבר או לאפס סיסמה.',
```

**L10**

```
    weak_password: 'הסיסמה חלשה מדי. צריך לפחות 8 תווים, אות וספרה.',
```

**L11**

```
    invalid_email: 'הדוא"ל אינו תקין.',
```

**L12**

```
    email_not_verified: 'יש לאשר את הדוא"ל לפני הכניסה. בדוק את תיבת הדואר.',
```

**L13**

```
    session_expired: 'פג תוקף הסשן. יש להתחבר מחדש.',
```

**L14**

```
    rate_limited: 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.',
```

**L15**

```
    cooldown_active: 'החשבון בתקופת המתנה לאחר מחיקה.',
```

**L16**

```
    network: 'שגיאת רשת. בדוק את החיבור לאינטרנט.',
```

**L17**

```
    unknown: 'אירעה שגיאה. נסה שוב.',
```

**L20**

```
    title_required: 'יש להזין כותרת לפוסט.',
```

**L21**

```
    title_too_long: 'הכותרת ארוכה מ-80 תווים.',
```

**L22**

```
    description_too_long: 'התיאור ארוך מ-500 תווים.',
```

**L23**

```
    address_required: 'יש להזין עיר, רחוב ומספר בית.',
```

**L24**

```
    address_invalid: 'הכתובת שהוזנה אינה תקינה.',
```

**L25**

```
    street_number_invalid: 'מספר הבית לא תקין. השתמש בספרות בלבד (אפשר להוסיף אות אחת בסוף, למשל 12, 12B או 12א).',
```

**L26**

```
    city_not_found: 'העיר שנבחרה לא נמצאה ברשימה. אנא בחר עיר מהרשימה.',
```

**L27**

```
    image_required_for_give: 'פוסטים מסוג "לתת" חייבים לפחות תמונה אחת.',
```

**L28**

```
    too_many_media_assets: 'מותר עד {{max}} תמונות לפוסט.',
```

**L29**

```
    condition_required_for_give: 'יש לבחור מצב לחפץ שניתן.',
```

**L30**

```
    urgency_only_for_request: 'דחיפות זמינה רק לפוסט "לבקש".',
```

**L31**

```
    condition_only_for_give: 'מצב חפץ זמין רק לפוסט "לתת".',
```

**L32**

```
    visibility_downgrade_forbidden: 'לא ניתן להוריד את רמת הפרטיות לאחר פרסום.',
```

**L33**

```
    invalid_post_type: 'סוג הפוסט לא תקין.',
```

**L34**

```
    invalid_visibility: 'בחירת הפרטיות לא תקינה.',
```

**L35**

```
    invalid_category: 'הקטגוריה לא תקינה.',
```

**L36**

```
    invalid_location_display_level: 'רמת תצוגת המיקום לא תקינה.',
```

**L37**

```
    forbidden: 'אין לך הרשאה לפעולה זו. נסה להתחבר מחדש.',
```

**L38**

```
    closure_not_owner: 'רק בעל הפוסט יכול לסמן או לפתוח אותו מחדש.',
```

**L39**

```
    closure_wrong_status: 'הפוסט במצב שאינו מאפשר את הפעולה הזו.',
```

**L40**

```
    closure_recipient_not_in_chat: 'אי אפשר לסמן את עצמך, ולא משתמש שלא קיים.',
```

**L41**

```
    reopen_window_expired: 'הזמן לפתוח את הפוסט מחדש כבר עבר — הוא נמחק לתמיד.',
```

**L42**

```
    post_not_open: 'לא ניתן לערוך פוסט שאינו פתוח.',
```

**L44**

```
      'לא ניתן למחוק: יש מקבל רשום לפוסט, או שהפוסט במצב שאינו מאפשר מחיקה. אפשר למחוק פוסט פתוח או סגור בלי רשומת מקבל.',
```

**L45**

```
    unknown: 'אירעה שגיאה. נסה שוב.',
```

**L48**

```
    invalid_display_name: 'שם לא תקין (1–50 תווים).',
```

**L49**

```
    biography_too_long: 'הביוגרפיה ארוכה מדי (≤200 תווים).',
```

**L50**

```
    biography_url_forbidden: 'הביוגרפיה לא יכולה להכיל קישור.',
```

**L51**

```
    invalid_city: 'עיר לא תקינה.',
```

**L52**

```
    incomplete_profile_address: 'נא למלא רחוב ומספר בית, או להשאיר את שניהם ריקים.',
```

**L53**

```
    invalid_profile_street: 'שם רחוב לא תקין (1–80 תווים).',
```

**L54**

```
    invalid_profile_street_number: 'מספר בית לא תקין (ספרות, אות אחת בסוף אופציונלי).',
```

**L57**

```
    galleryDeniedTitle: 'גישה לגלריה נדחתה',
```

**L58**

```
    galleryDeniedBodyAvatar: 'כדי לבחור תמונה מהגלריה יש לאפשר גישה בהגדרות → קהילת קארמה → תמונות.',
```

**L59**

```
    galleryDeniedBodyPost: 'כדי לבחור תמונות יש לאפשר גישה בהגדרות → קהילת קארמה → תמונות.',
```

**L60**

```
    cameraDeniedTitle: 'גישה למצלמה נדחתה',
```

**L61**

```
    cameraDeniedBodyAvatar: 'כדי לצלם תמונה יש לאפשר גישה בהגדרות → קהילת קארמה → מצלמה.',
```

**L62**

```
    openSettings: 'פתח הגדרות',
```

**L65**

```
    userUnavailableTitle: 'משתמש לא זמין',
```

**L66**

```
    userUnavailableMessage: 'המשתמש כבר לא קיים במערכת.',
```

**L69**

```
    fieldTitle: 'הכותרת',
```

**L70**

```
    fieldCity: 'העיר',
```

**L71**

```
    fieldStreet: 'הרחוב',
```

**L72**

```
    fieldStreetNumber: 'מספר הבית',
```

**L73**

```
    fieldPhoto: 'לפחות תמונה אחת',
```

**L74**

```
    missingOne: 'נא למלא את {{field}} לפני פרסום',
```

**L75**

```
    missingMany: 'נא למלא את השדות הבאים לפני פרסום: {{fields}}',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/feed.ts`

**L6**

```
  title: 'פיד ראשי',
```

**L7**

```
  filters: 'סננים',
```

**L8**

```
  clearFilters: 'נקה סינון',
```

**L9**

```
  activeFilters: '{{count}} סננים פעילים',
```

**L10**

```
  giveType: '🎁 לתת',
```

**L11**

```
  requestType: '🔍 לבקש',
```

**L12**

```
  allTypes: 'הכל',
```

**L13**

```
  searchPlaceholder: 'חפש לפי מוצר, קטגוריה...',
```

**L14**

```
  noResults: 'לא נמצאו פוסטים',
```

**L15**

```
  noResultsDesc: 'נסה לשנות את הסינון או חפש בכל הערים.',
```

**L16**

```
  loadMore: 'טעון עוד',
```

**L17**

```
  guestBanner: 'הצטרף לקהילה כדי לראות את כל הפוסטים הפעילים באזור שלך',
```

**L18**

```
  guestBannerWithCount: 'הצטרף לקהילה כדי לראות עוד {{count}} פוסטים פעילים באזור שלך',
```

**L19**

```
  joinNow: 'הצטרף עכשיו',
```

**L20**

```
  firstPostNudge: 'פרסם את הפוסט הראשון שלך! 🎁',
```

**L21**

```
  closedTag: '🔒 נמסר',
```

**L22**

```
  followersTag: '👥 לעוקבים בלבד',
```

**L23**

```
  refreshSuccess: 'הפיד עודכן',
```

**L24**

```
  refreshFailed: 'הרענון נכשל — נסה שוב',
```

**L25**

```
  refreshA11y: 'רענן את הפיד (R)',
```

**L26**

```
  filterA11y: 'סינון ומיון פוסטים',
```

**L27**

```
  filterA11yHint: 'פותח חלון לסינון ולמיון של הפיד',
```

**L28**

```
  newPostsOne: 'פוסט חדש 1 — הקש לרענון',
```

**L29**

```
  newPostsMany: '{{count}} פוסטים חדשים — הקש לרענון',
```

**L30**

```
  nudgeTitle: 'יש לך מוצר לתת? או משהו לבקש?',
```

**L31**

```
  nudgeBody: 'שתף את הפוסט הראשון שלך עכשיו.',
```

**L32**

```
  nudgeShare: 'שתף מוצר',
```

**L33**

```
  nudgeRemindMe: 'תזכיר לי אחר כך',
```

**L34**

```
  nudgeDontShow: 'אל תציג לי שוב',
```

**L35**

```
  empty: 'אין עדיין פוסטים בקהילה',
```

**L36**

```
  emptyDesc: 'תהיה הראשון לשתף משהו.',
```

**L37**

```
  emptyFiltered: 'אין פוסטים שתואמים לפילטרים שלך',
```

**L38**

```
  emptyFilteredDesc: 'נסה לנקות את הפילטרים או להיות הראשון לשתף.',
```

**L39**

```
  activeInCommunityWithCount: '{{count}} פוסטים פעילים בקהילה כרגע',
```

**L40**

```
  sharePost: 'שתף פוסט',
```

**L41**

```
  giveTypeShort: 'לתת',
```

**L42**

```
  requestTypeShort: 'לבקש',
```

**L43**

```
  giverBadge: '📤 נתתי',
```

**L44**

```
  receiverBadge: '📥 קיבלתי',
```

**L45**

```
  loadErrorTitle: 'שגיאה בטעינת הפוסטים',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/filters.ts`

**L5**

```
  header: 'סינון ומיון',
```

**L6**

```
  clearAll: 'נקה הכל',
```

**L7**

```
  apply: 'החל',
```

**L10**

```
  sectionType: 'סוג פוסט',
```

**L11**

```
  sectionCategory: 'קטגוריה',
```

**L12**

```
  sectionCondition: 'מצב המוצר',
```

**L13**

```
  sectionStatus: 'סטטוס פוסט',
```

**L14**

```
  sectionSource: 'מקור הפוסטים',
```

**L15**

```
  sectionSort: 'מיון',
```

**L16**

```
  sectionLocation: 'מיקום',
```

**L18**

```
  all: 'הכל',
```

**L21**

```
  typeGive: '🎁 נתינה',
```

**L22**

```
  typeRequest: '🔍 בקשה',
```

**L25**

```
  conditionNew: 'חדש',
```

**L26**

```
  conditionLikeNew: 'כמו חדש',
```

**L27**

```
  conditionGood: 'טוב',
```

**L28**

```
  conditionFair: 'סביר',
```

**L29**

```
  conditionDamaged: 'שבור/תקול',
```

**L32**

```
  statusOpenOnly: 'רק פתוחים',
```

**L33**

```
  statusClosedOnly: 'רק סגורים',
```

**L36**

```
  followersOnly: '👥 רק ממי שאני עוקב',
```

**L39**

```
  sortNewest: '🆕 חדש קודם',
```

**L40**

```
  sortOldest: '🕓 ישן קודם',
```

**L41**

```
  sortDistance: '📍 לפי מיקום',
```

**L42**

```
  sortDistanceCenterHint: 'מרכז המיון (ברירת מחדל: העיר שלך)',
```

**L45**

```
  allCities: 'כל הערים',
```

**L46**

```
  radius: 'טווח',
```

**L47**

```
  radiusKm: '{{km}} ק"מ',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/moderation.ts`

**L5**

```
      title: 'דווח על משתמש',
```

**L6**

```
      reasonLabel: 'סיבת הדיווח',
```

**L7**

```
      noteLabel: 'הערה (אופציונלי, עד 500 תווים)',
```

**L8**

```
      submit: 'שלח דיווח',
```

**L9**

```
      successToast: '✅ הדיווח התקבל. הצוות שלנו יבדוק.',
```

**L10**

```
      duplicateError: 'כבר דיווחת על משתמש זה ב-24 השעות האחרונות.',
```

**L14**

```
    spam: 'ספאם',
```

**L15**

```
    offensive: 'תוכן פוגעני',
```

**L16**

```
    misleading: 'מטעה',
```

**L17**

```
    illegal: 'בלתי-חוקי',
```

**L18**

```
    other: 'אחר',
```

**L21**

```
    title: 'חסימת משתמש',
```

**L22**

```
    reasonLabel: 'סיבת החסימה',
```

**L24**

```
      spam: 'ספאם',
```

**L25**

```
      harassment: 'הטרדה',
```

**L26**

```
      policy_violation: 'הפרת מדיניות',
```

**L27**

```
      other: 'אחר',
```

**L29**

```
    noteLabel: 'הערות נוספות',
```

**L30**

```
    submit: 'חסום',
```

**L31**

```
    confirmCopy: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
```

**L32**

```
    successToast: 'המשתמש נחסם.',
```

**L36**

```
      title: 'דיווח התקבל',
```

**L37**

```
      body: 'דיווח על {target_type} · {reason} · {count}/3',
```

**L40**

```
      title: 'הוסר אוטומטית',
```

**L41**

```
      body: '{target_type} הוסר לאחר 3 דיווחים',
```

**L44**

```
      body: '✅ טופל ע״י אדמין · {action} · {time}',
```

**L47**

```
      body: 'הפוסט שלך הוסר אוטומטית בעקבות דיווחים חוזרים. אם זו טעות, ניתן לערער דרך כתובת התמיכה.',
```

**L50**

```
      title: 'דיווח על קישור תרומה',
```

**L51**

```
      a11yOpen: 'פתח קישור: {name}',
```

**L54**

```
      open: 'פתח',
```

**L55**

```
      postLabel: 'פוסט',
```

**L56**

```
      profileLabel: 'פרופיל',
```

**L57**

```
      hasImage: '📷 כולל תמונה',
```

**L58**

```
      reporterNoteLabel: 'הערת מדווח:',
```

**L59**

```
      evidenceLabel: 'צילום מצב מרגע הדיווח',
```

**L60**

```
      chatNote: 'דיווח על שיחה — מוצג הצד השני',
```

**L61**

```
      a11yOpenPost: 'פתח פוסט מאת {who}',
```

**L62**

```
      a11yOpenProfile: 'פתח פרופיל של {who}',
```

**L66**

```
    restore: '↩ שחזר',
```

**L67**

```
    dismiss: '🗑 דחה דיווח',
```

**L68**

```
    confirm: '✓ אשר הסרה',
```

**L69**

```
    ban: '🚫 חסום משתמש',
```

**L70**

```
    removePost: '🗑 הסר פוסט',
```

**L71**

```
    deleteMessage: '🗑 מחק הודעה',
```

**L72**

```
    cancel: 'ביטול',
```

**L73**

```
    proceed: 'המשך',
```

**L75**

```
      restore: 'פעולה זו תסמן את הדיווחים על המטרה כשגויים, מה שעלול לגרור סנקציה לרֶפּוֹרְטֵרים. להמשיך?',
```

**L76**

```
      dismiss: 'סמן דיווח זה כשגוי. אין השפעה על דיווחים אחרים. להמשיך?',
```

**L77**

```
      confirm: 'אשר את ההסרה האוטומטית כהפרה ודאית. להמשיך?',
```

**L78**

```
      ban: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
```

**L79**

```
      removePost: 'הסר פוסט זה כאדמין. להמשיך?',
```

**L80**

```
      deleteMessage: 'מחק הודעה זו לצמיתות. להמשיך?',
```

**L83**

```
      restore: 'המטרה שוחזרה.',
```

**L84**

```
      dismiss: 'הדיווח נדחה.',
```

**L85**

```
      confirm: 'הדיווח אושר.',
```

**L86**

```
      ban: 'המשתמש נחסם.',
```

**L87**

```
      removePost: 'הפוסט הוסר.',
```

**L88**

```
      deleteMessage: 'ההודעה נמחקה.',
```

**L91**

```
      forbidden: 'אין לך הרשאה לפעולה זו.',
```

**L92**

```
      invalidRestoreState: 'לא ניתן לשחזר את המטרה במצבה הנוכחי.',
```

**L93**

```
      networkError: 'תקלה ברשת. נסה שוב.',
```

**L97**

```
    title: 'פנייה לתמיכה',
```

**L98**

```
    issueRef: 'מזהה פנייה:',
```

**L99**

```
    categoryLabel: 'קטגוריה:',
```

**L104**

```
  title: 'אאודיט',
```

**L105**

```
  searchPlaceholder: 'חפש משתמש לפי שם...',
```

**L106**

```
  noResults: 'אין תוצאות.',
```

**L107**

```
  loading: 'טוען...',
```

**L108**

```
  metadataLabel: 'מטא-דאטה',
```

**L110**

```
    block_user: 'חסימה',
```

**L111**

```
    unblock_user: 'ביטול חסימה',
```

**L112**

```
    report_target: 'דיווח',
```

**L113**

```
    auto_remove_target: 'הסרה אוטומטית',
```

**L114**

```
    manual_remove_target: 'הסרה ידנית',
```

**L115**

```
    restore_target: 'שחזור',
```

**L116**

```
    suspend_user: 'השעיה',
```

**L117**

```
    unsuspend_user: 'החזרה לפעילות',
```

**L118**

```
    ban_user: 'חסימה לצמיתות',
```

**L119**

```
    false_report_sanction_applied: 'סנקציה על דיווחי שווא',
```

**L120**

```
    dismiss_report: 'דחיית דיווח',
```

**L121**

```
    confirm_report: 'אישור דיווח',
```

**L122**

```
    delete_message: 'מחיקת הודעה',
```

**L128**

```
    subject: 'פנייה ממשתמש/ת — חשבון מוגבל (קהילת קארמה)',
```

**L130**

```
      'שלום צוות קארמה,\n\n' +
```

**L131**

```
      'אני פונה בנוגע למצב החשבון שלי באפליקציה.\n\n' +
```

**L132**

```
      'תיאור קצר:\n\n' +
```

**L134**

```
      '(מלא/י כאן)\n',
```

**L137**

```
    title: 'החשבון נחסם לצמיתות',
```

**L138**

```
    body: 'החשבון שלך נחסם בעקבות הפרת מדיניות הקהילה.',
```

**L139**

```
    cta: 'יצירת קשר',
```

**L142**

```
    title: 'החשבון הושעה',
```

**L143**

```
    body: 'המוֹדֶרציָה השעתה את החשבון שלך עד לבירור.',
```

**L144**

```
    cta: 'ערעור',
```

**L147**

```
    title: 'החשבון מושעה זמנית',
```

**L148**

```
    body: 'החשבון שלך מושעה עד {until} עקב 5 דיווחים שגויים ב-30 הימים האחרונים.',
```

**L149**

```
    cta: 'ערעור מוקדם',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/notifications.ts`

**L3**

```
  settingsTitle: 'התראות',
```

**L4**

```
  criticalLabel: 'קריטיות',
```

**L5**

```
  criticalCaption: "הודעות צ'אט, סימון כמקבל, התראות מערכת, פוסט שעומד לפוג, הסרת תוכן",
```

**L6**

```
  socialLabel: 'חברתיות',
```

**L7**

```
  socialCaption: 'עוקבים חדשים, בקשות מעקב, בקשות מאושרות',
```

**L8**

```
  deviceStatusSection: 'סטטוס המכשיר',
```

**L9**

```
  permissionGranted: 'הרשאת התראות מופעלת',
```

**L10**

```
  permissionDenied: 'הרשאה חסומה בהגדרות המכשיר',
```

**L11**

```
  tokenRegistered: 'המכשיר רשום',
```

**L12**

```
  tokenNotRegistered: 'המכשיר טרם נרשם',
```

**L13**

```
  openOsSettings: 'פתח הגדרות',
```

**L15**

```
  enablePushTitle: 'להישאר בקשר?',
```

**L16**

```
  enablePushBodyFromChat: 'נשלח לך התראה כשמישהו עונה לך — גם כשהאפליקציה סגורה.',
```

**L17**

```
  enablePushBodyFromPost: 'נשלח לך התראה כשמישהו פנה בנוגע לפוסט שלך — גם כשהאפליקציה סגורה.',
```

**L18**

```
  enablePushAccept: 'כן, להפעיל',
```

**L19**

```
  enablePushDecline: 'אולי בפעם אחרת',
```

**L24**

```
  chatBodyCoalesced: '{{count}} הודעות חדשות',
```

**L25**

```
  supportTitle: 'תמיכת קהילת קארמה',
```

**L26**

```
  systemTitle: 'הודעת מערכת',
```

**L28**

```
  postExpiringTitle: 'הפוסט שלך יפוג בעוד 7 ימים',
```

**L31**

```
  markRecipientBody: 'סימן אותך כמקבל של {{postTitle}}',
```

**L33**

```
  unmarkRecipientBody: 'הסיר את הסימון מ-{{postTitle}}',
```

**L34**

```
  autoRemovedTitle: 'הפוסט שלך הוסר',
```

**L35**

```
  autoRemovedBody: 'הסיבה: דווח על-ידי מספר משתמשים. למידע נוסף — לחץ.',
```

**L37**

```
  followRequestBody: 'מבקש לעקוב אחריך',
```

**L39**

```
  followStartedBody: 'התחיל לעקוב אחריך',
```

**L40**

```
  followStartedCoalesced: '{{count}} עוקבים חדשים',
```

**L42**

```
  followApprovedBody: 'אישר את בקשת המעקב שלך',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/post.ts`

**L3**

```
  give: 'לתת חפץ',
```

**L4**

```
  request: 'לבקש חפץ',
```

**L5**

```
  title: 'כותרת',
```

**L6**

```
  titlePlaceholder: 'מה אתה נותן/מבקש?',
```

**L7**

```
  description: 'תיאור (אופציונלי)',
```

**L8**

```
  descPlaceholder: 'פרטים נוספים על החפץ...',
```

**L9**

```
  category: 'קטגוריה',
```

**L10**

```
  condition: 'מצב החפץ',
```

**L11**

```
  urgency: 'דחיפות (אופציונלי)',
```

**L12**

```
  urgencyPlaceholder: 'לדוגמה: צריך עד שישי',
```

**L13**

```
  photos: 'תמונות',
```

**L14**

```
  addPhoto: 'הוסף תמונה',
```

**L15**

```
  removePhoto: 'הסר תמונה',
```

**L16**

```
  sendMessageA11y: 'שלח הודעה למפרסם',
```

**L17**

```
  address: 'כתובת',
```

**L18**

```
  cityLabel: 'עיר',
```

**L19**

```
  streetLabel: 'רחוב',
```

**L20**

```
  streetNumberLabel: 'מספר',
```

**L21**

```
  locationDisplay: 'מה להציג בפיד',
```

**L22**

```
  cityOnly: 'עיר בלבד',
```

**L23**

```
  cityAndStreet: 'עיר + רחוב',
```

**L24**

```
  fullAddress: 'כתובת מלאה',
```

**L25**

```
  visibility: 'מי יראה את הפוסט',
```

**L26**

```
  visibilityPublic: '🌍 כולם',
```

**L27**

```
  visibilityFollowers: '👥 רק עוקבים שלי',
```

**L28**

```
  visibilityOnlyMe: '🔒 רק אני',
```

**L29**

```
  publish: 'פרסם',
```

**L30**

```
  draft: 'שמור טיוטה',
```

**L31**

```
  publishSuccess: 'הפוסט שלך פורסם!',
```

**L32**

```
  draftRestored: 'יש לך טיוטה שלא פורסמה',
```

**L33**

```
  continueDraft: 'המשך לערוך',
```

**L34**

```
  discardDraft: 'התחל מחדש',
```

**L35**

```
  sendMessage: '💬 שלח הודעה למפרסם',
```

**L36**

```
  followAuthor: 'עקוב אחרי המפרסם',
```

**L37**

```
  report: 'דווח',
```

**L38**

```
  markDelivered: 'סמן כ-נמסר',
```

**L39**

```
  edit: 'ערוך',
```

**L40**

```
  delete: 'מחק',
```

**L41**

```
  reopen: '📤 פתח מחדש',
```

**L42**

```
  conditionNew: 'חדש',
```

**L43**

```
  conditionLikeNew: 'כמו חדש',
```

**L44**

```
  conditionGood: 'טוב',
```

**L45**

```
  conditionFair: 'בינוני',
```

**L46**

```
  photoRequired: 'תמונה נדרשת עבור פוסט "לתת"',
```

**L47**

```
  maxPhotos: 'מקסימום {{max}} תמונות',
```

**L48**

```
  maxPosts: 'הגעת למקסימום 20 פוסטים פעילים',
```

**L49**

```
  imageZoom: 'הגדל תמונה',
```

**L50**

```
  imageZoomNth: 'הגדל תמונה {{index}} מתוך {{total}}',
```

**L51**

```
  imageViewerClose: 'סגור תצוגת תמונה',
```

**L54**

```
  menuA11y: 'תפריט פעולות',
```

**L55**

```
  menuEdit: 'ערוך פוסט',
```

**L56**

```
  menuDelete: 'מחק את הפוסט',
```

**L57**

```
  menuAdminRemove: 'הסר כאדמין',
```

**L58**

```
  deleteConfirmTitle: '🗑️ למחוק את הפוסט?',
```

**L60**

```
    'הפוסט יימחק לצמיתות. שיחות שנפתחו סביבו יישארו ברשימת הצ\'אטים שלך, עם הערה שהפוסט המקורי לא זמין יותר.\n\nניתן למחוק פוסט פתוח, או פוסט סגור בלי שורת מקבל במערכת (למשל נסגר בלי סימון, או מקבל שנמחק מהמערכת). אם יש מקבל רשום — לא ניתן למחיקה מכאן; אפשר לפתוח מחדש לפי הצורך.',
```

**L61**

```
  adminRemoveTitle: '🛡️ להסיר את הפוסט?',
```

**L63**

```
    'הפוסט "{{title}}" יוסתר מהפיד ויסומן כמוסר על ידי מנהל. ניתן יהיה לשחזר אותו בעתיד דרך יומן האודיט.',
```

**L64**

```
  adminRemoveCta: 'הסר',
```

**L67**

```
  reportTitle: 'דיווח על הפוסט',
```

**L68**

```
  reportReasonSpam: 'ספאם',
```

**L69**

```
  reportReasonOffensive: 'תוכן פוגעני',
```

**L70**

```
  reportReasonMisleading: 'מטעה',
```

**L71**

```
  reportReasonIllegal: 'בלתי חוקי',
```

**L72**

```
  reportReasonOther: 'אחר',
```

**L73**

```
  reportNotePlaceholder: 'הערה (אופציונלי)',
```

**L74**

```
  reportSubmit: 'שלח דיווח',
```

**L75**

```
  reportSubmitting: 'שולח...',
```

**L76**

```
  reportSuccessTitle: 'הדיווח נשלח',
```

**L77**

```
  reportSuccessBody: 'תודה, נבחן את הדיווח.',
```

**L78**

```
  reportDuplicateTitle: 'כבר דיווחת',
```

**L79**

```
  reportDuplicateBody: 'דיווחת על הפוסט הזה ב-24 השעות האחרונות.',
```

**L80**

```
  reportErrorBody: 'נסה שוב מאוחר יותר.',
```

**L83**

```
  locationDisplayLabel: 'תצוגת הכתובת',
```

**L84**

```
  locationDisplayCityAndStreet: 'עיר ורחוב',
```

**L85**

```
  locationDisplayHintCityOnly: 'אנונימיות מרבית',
```

**L86**

```
  locationDisplayHintCityAndStreet: 'מומלץ',
```

**L87**

```
  locationDisplayHintFullAddress: 'כולל מספר בית',
```

**L90**

```
  photosRequiredSuffix: '* (חובה עבור "לתת")',
```

**L91**

```
  photosHint: 'בחר עד {{max}} תמונות מהגלריה.',
```

**L94**

```
  visibilityPublicSub: 'הפוסט יוצג בפיד הראשי לכל המשתמשים',
```

**L95**

```
  visibilityOnlyMeSub: 'הפוסט נשמר באופן פרטי; אפשר לפתוח לציבור בעריכה',
```

**L96**

```
  deleteError: 'המחיקה נכשלה, נסה שוב.',
```

**L97**

```
  deleteSuccess: 'הפוסט נמחק.',
```

**L98**

```
  adminRemoveError: 'ההסרה נכשלה, נסה שוב.',
```

**L99**

```
  adminRemoveSuccess: 'הפוסט הוסר.',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/profile.ts`

**L4**

```
  myProfile: 'הפרופיל שלי',
```

**L5**

```
  editProfile: 'ערוך פרופיל',
```

**L6**

```
  shareProfile: 'שתף פרופיל',
```

**L7**

```
  followers: 'עוקבים',
```

**L8**

```
  following: 'נעקבים',
```

**L9**

```
  activePosts: 'פוסטים פעילים',
```

**L10**

```
  closedPosts: 'פוסטים שנמסרו',
```

**L11**

```
  follow: 'עקוב',
```

**L12**

```
  following_btn: 'מעקב פעיל ✓',
```

**L13**

```
  requestSent: 'בקשה נשלחה ⏳',
```

**L14**

```
  sendMessage: 'שלח הודעה',
```

**L15**

```
  privateProfile: '🔒 הפרופיל פרטי. שלח בקשת עקיבה כדי לראות פוסטים.',
```

**L18**

```
  followCta: '+ עקוב',
```

**L19**

```
  followingActive: 'עוקב ✓',
```

**L20**

```
  followRequestCta: '+ שלח בקשה',
```

**L21**

```
  unfollowConfirmTitle: 'להפסיק לעקוב?',
```

**L22**

```
  unfollowConfirmCta: 'הפסק לעקוב',
```

**L23**

```
  cancelRequestTitle: 'לבטל את בקשת המעקב?',
```

**L24**

```
  cancelRequestBody: 'תוכלי לשלוח בקשה חדשה בכל עת.',
```

**L25**

```
  cancelRequestCta: 'בטל בקשה',
```

**L26**

```
  cooldownRetryDays: 'ניתן לשלוח שוב בעוד {{days}} ימים',
```

**L27**

```
  followUnavailable: 'המשתמש לא זמין למעקב כרגע',
```

**L30**

```
  privateProfileA11y: 'פרופיל פרטי',
```

**L31**

```
  headerTitle: 'פרופיל',
```

**L32**

```
  fallbackName: 'משתמש',
```

**L33**

```
  userNotFound: 'משתמש לא נמצא',
```

**L36**

```
  tabOpen: 'פוסטים פתוחים',
```

**L37**

```
  tabClosed: 'פוסטים סגורים',
```

**L38**

```
  tabRemoved: 'הוסרו',
```

**L41**

```
  statsPostsLabel: 'פוסטים',
```

**L44**

```
  emptyOpenTitle: 'אין פוסטים פתוחים',
```

**L45**

```
  emptyClosedTitle: 'אין פוסטים סגורים',
```

**L46**

```
  emptyClosedTitleSelf: 'אין פוסטים סגורים עדיין',
```

**L47**

```
  emptySelfOpenSubtitle: 'פרסם את הפוסט הראשון שלך!',
```

**L48**

```
  emptySelfClosedSubtitle: 'פוסטים שסגרת או שקיבלת יופיעו כאן.',
```

**L49**

```
  emptySelfClosedSubtitleLegacy: 'פוסטים שסגרת כ-נמסר יופיעו כאן.',
```

**L50**

```
  emptyOtherOpenSubtitle: 'משתמש זה עוד לא פרסם פוסטים.',
```

**L51**

```
  emptyOtherClosedSubtitle: 'משתמש זה עוד לא סגר ולא קיבל פוסט.',
```

**L52**

```
  emptyOtherClosedSubtitleLegacy: 'משתמש זה עוד לא סיים מסירה.',
```

**L53**

```
  followCooldownTitle: 'לא ניתן לשלוח כרגע',
```

**L54**

```
  followCooldownDays: 'ניתן לשלוח שוב בעוד {{count}} ימים.',
```

**L55**

```
  followErrorTitle: 'שגיאה',
```

**L56**

```
  followErrorMessage: 'הפעולה נכשלה. נסו שוב.',
```

**L59**

```
  avatarChangeA11y: 'החלפת תמונת פרופיל',
```

**L60**

```
  avatarAddA11y: 'הוספת תמונת פרופיל',
```

**L61**

```
  avatarChangeHint: 'החלף תמונה',
```

**L62**

```
  avatarAddHint: 'הוסף תמונה',
```

**L63**

```
  avatarUploadFailedTitle: 'העלאת התמונה נכשלה',
```

**L64**

```
  avatarUploadRetry: 'נסה שוב.',
```

**L67**

```
  photoSourceTitle: 'תמונת פרופיל',
```

**L68**

```
  photoSourceCameraOption: '📷  צלם תמונה',
```

**L69**

```
  photoSourceCameraA11y: 'צילום במצלמה',
```

**L70**

```
  photoSourceGalleryOption: '🖼️  בחר מהגלריה',
```

**L71**

```
  photoSourceGalleryA11y: 'בחירה מהגלריה',
```

**L72**

```
  photoSourceRemoveOption: '🗑️  הסר תמונה',
```

**L73**

```
  photoSourceRemoveA11y: 'הסרת התמונה הנוכחית',
```

**L76**

```
  cityPickerTitle: 'בחר עיר',
```

**L77**

```
  cityPickerSearchPlaceholder: '...חיפוש עיר',
```

**L78**

```
  cityPickerError: 'שגיאה בטעינת רשימת הערים. נסה שוב.',
```

**L79**

```
  cityPickerEmpty: 'לא נמצאו ערים תואמות.',
```

**L80**

```
  cityPickerCloseA11y: 'סגור',
```

**L83**

```
  addressLabel: 'כתובת',
```

**L84**

```
  streetNumberShort: 'מס׳',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/settings.ts`

**L3**

```
  title: 'הגדרות',
```

**L4**

```
  account: 'חשבון',
```

**L5**

```
  accountDetails: 'פרטי חשבון',
```

**L6**

```
  notifications: 'התראות',
```

**L7**

```
  notificationsOn: 'התראות מופעלות',
```

**L8**

```
  privacy: 'פרטיות',
```

**L9**

```
  statsSection: 'סטטיסטיקות',
```

**L10**

```
  stats: 'סטטיסטיקות',
```

**L11**

```
  support: 'תמיכה',
```

**L12**

```
  legal: 'משפטי',
```

**L13**

```
  termsAndPrivacy: 'תנאי שימוש ומדיניות פרטיות',
```

**L14**

```
  about: 'אודות',
```

**L15**

```
  logout: 'התנתקות',
```

**L16**

```
  loggingOut: 'מתנתק...',
```

**L17**

```
  deleteAccount: 'מחק חשבון',
```

**L19**

```
    title: 'מחיקת חשבון לצמיתות',
```

**L21**

```
      posts: 'כל הפוסטים שלך יימחקו (כולל תמונות)',
```

**L22**

```
      follows: 'כל העוקבים והנעקבים יוסרו',
```

**L23**

```
      moderation: 'כל החסימות והדיווחים שהגשת יימחקו',
```

**L24**

```
      donations: 'קישורי תרומה שהגדרת יימחקו',
```

**L25**

```
      devices: 'כל המכשירים המחוברים שלך ינותקו',
```

**L28**

```
      'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "משתמש שנמחק".',
```

**L30**

```
      'הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית.',
```

**L31**

```
    confirmInputLabel: 'הקלד "מחק" כדי לאשר',
```

**L32**

```
    confirmInputPlaceholder: 'מחק',
```

**L33**

```
    confirmKeyword: 'מחק',
```

**L35**

```
      cancel: 'ביטול',
```

**L36**

```
      delete: 'מחק את החשבון לצמיתות',
```

**L37**

```
      retry: 'נסה שוב',
```

**L38**

```
      close: 'סגור',
```

**L41**

```
      recoverable: 'המחיקה נכשלה — נסה שוב',
```

**L43**

```
        'המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. חובה ללחוץ "נסה שוב" עכשיו — אם תסגור את האפליקציה ייווצר חשבון לא תקין.',
```

**L46**

```
      title: 'לא ניתן למחוק חשבון מושעה',
```

**L47**

```
      body: 'פנה לבירור דרך מסך הדיווחים.',
```

**L50**

```
      title: 'חשבונך נמחק',
```

**L51**

```
      subtitle: 'תודה שהיית חלק מקארמה.',
```

**L54**

```
  privateProfileToggle: '🔒 פרופיל פרטי',
```

**L55**

```
  followRequests: 'בקשות עקיבה',
```

**L56**

```
  reportIssue: 'דווח על בעיה',
```

**L58**

```
    title: 'דווח על בעיה',
```

**L59**

```
    copy: 'תאר את הבעיה ואנחנו נחזור אליך בהקדם.',
```

**L60**

```
    categoryLabel: 'קטגוריה (אופציונלי)',
```

**L62**

```
      Bug: 'באג / תקלה',
```

**L63**

```
      Account: 'חשבון',
```

**L64**

```
      Suggestion: 'הצעה',
```

**L65**

```
      Other: 'אחר',
```

**L67**

```
    descriptionLabel: 'תיאור (חובה)',
```

**L68**

```
    descriptionPlaceholder: 'תאר את הבעיה... (לפחות 10 תווים)',
```

**L69**

```
    descriptionMinLength: 'התיאור חייב להכיל לפחות 10 תווים',
```

**L70**

```
    submitBtn: 'שלח ופתח שיחה',
```

**L71**

```
    submitting: 'שולח...',
```

**L72**

```
    errorGeneric: 'אירעה שגיאה. נסה שוב.',
```

**L73**

```
    errorAdminNotFound: 'שירות התמיכה לא זמין. נסה שוב מאוחר יותר.',
```

**L75**

```
  devTools: 'כלי פיתוח',
```

**L76**

```
  resetOnboarding: 'איפוס אונבורדינג (דיבוג)',
```

**L77**

```
  resetting: 'מאפס...',
```

**L78**

```
  simulateHardRefresh: 'סימולציית רענון מלא (דיבוג)',
```

**L79**

```
  simulatingHardRefresh: 'מרענן...',
```

**L80**

```
  version: 'KC - קהילת קארמה',
```

**L81**

```
  resetOnboardingFailed: 'האיפוס נכשל: {{msg}}',
```

**L82**

```
  resetOnboardingConfirmMsg: 'הפעולה תחזיר את מצב האונבורדינג להתחלה ותפתח את אשף ההרשמה מחדש. הפרופיל לא יימחק.\n\nלהמשיך?',
```

**L83**

```
  resetOnboardingConfirmTitle: 'איפוס אונבורדינג',
```

**L84**

```
  resetOnboardingBtn: 'איפוס',
```

**L85**

```
  signOutFailed: 'ההתנתקות נכשלה. נסה שוב.',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/tabs.ts`

**L6**

```
  home: 'בית',
```

**L7**

```
  profile: 'פרופיל',
```

**L8**

```
  newPost: 'פוסט חדש',
```

---

## `app/apps/mobile/src/i18n/locales/he/modules/ui.ts`

**L7**

```
  title: 'משהו השתבש',
```

**L8**

```
  body: 'אפשר לנסות שוב או לרענן את האפליקציה.',
```

**L11**

```
export const devBannerHe = 'סביבת פיתוח · DEV — לא הפרודקשן';
```

**L14**

```
  more: 'אפשרויות נוספות',
```

**L15**

```
  default: 'אפשרויות',
```

---

## `app/apps/mobile/src/i18n/locales/he/stats.ts`

**L5**

```
  title: 'הקהילה במספרים',
```

**L6**

```
  subtitle: 'מונים אישיים, פעילות אחרונה, ומצב הקהילה',
```

**L7**

```
  given: 'חפצים שמסרתי',
```

**L8**

```
  received: 'חפצים שקיבלתי',
```

**L9**

```
  activePosts: 'פוסטים פעילים',
```

**L10**

```
  communityTitle: 'בקהילה עכשיו',
```

**L11**

```
  communityUsers: 'משתמשים רשומים',
```

**L12**

```
  communityPosts: 'פוסטים פתוחים (ציבורי)',
```

**L13**

```
  communityDelivered: 'מסירות שהושלמו',
```

**L14**

```
  communityHint: 'המספרים מתעדכנים אוטומטית כל דקה.',
```

**L15**

```
  recentActivity: 'מה קורה אצלי',
```

**L16**

```
  activityEmpty: 'עדיין אין פעילות להצגה. פרסום או סגירה של פוסט יופיעו כאן.',
```

**L17**

```
  activitySomeone: 'משתמש/ת',
```

**L19**

```
    post_created: 'יצרת את הפוסט ״{{title}}״',
```

**L20**

```
    post_closed_delivered: 'סימנת מסירה של ״{{title}}״',
```

**L21**

```
    post_closed_no_recipient: 'סגרת את ״{{title}}״ בלי לסמן מקבל/ת',
```

**L22**

```
    post_reopened: 'פתחת מחדש את ״{{title}}״',
```

**L23**

```
    marked_as_recipient: '{{owner}} סימנו אותך כמקבל/ת של ״{{title}}״',
```

**L24**

```
    unmarked_as_recipient: 'הסרת את סימון המקבל/ת מ״{{title}}״',
```

**L25**

```
    post_expired: 'הפוסט ״{{title}}״ פג תוקף',
```

**L26**

```
    post_removed_admin: 'הפוסט ״{{title}}״ הוסר על ידי הצוות',
```

---

## `app/packages/application/src/auth/__tests__/CompleteBasicInfoUseCase.test.ts`

**L14**

```
        cityName: 'תל אביב - יפו',
```

**L25**

```
      displayName: '  נווה  ',
```

**L27**

```
      cityName: 'חיפה',
```

**L31**

```
      displayName: 'נווה',
```

**L33**

```
      cityName: 'חיפה',
```

**L45**

```
      useCase.execute({ userId, displayName: '   ', cityId: '4000', cityName: 'חיפה' }),
```

**L57**

```
        cityName: 'חיפה',
```

**L66**

```
      useCase.execute({ userId, displayName: 'נווה', cityId: '', cityName: 'חיפה' }),
```

**L70**

```
      useCase.execute({ userId, displayName: 'נווה', cityId: '4000', cityName: '   ' }),
```

**L80**

```
      displayName: 'נווה',
```

**L82**

```
      cityName: 'חיפה',
```

**L83**

```
      profileStreet: '  הרצל ',
```

**L88**

```
      displayName: 'נווה',
```

**L90**

```
      cityName: 'חיפה',
```

**L91**

```
      profileStreet: 'הרצל',
```

**L103**

```
        displayName: 'נווה',
```

**L105**

```
        cityName: 'חיפה',
```

**L106**

```
        profileStreet: 'הרצל',
```

**L118**

```
      displayName: 'נווה',
```

**L120**

```
      cityName: 'חיפה',
```

**L121**

```
      profileStreet: 'הרצל',
```

**L122**

```
      profileStreetNumber: '12א',
```

**L125**

```
    expect(repo.rows.get(userId)?.profileStreetNumber).toBe('12א');
```

**L134**

```
        displayName: 'נווה',
```

**L136**

```
        cityName: 'חיפה',
```

**L137**

```
        profileStreet: 'הרצל',
```

**L148**

```
        cityName: 'תל אביב - יפו',
```

**L155**

```
      useCase.execute({ userId, displayName: 'נווה', cityId: '4000', cityName: 'חיפה' }),
```

**L167**

```
        cityName: 'תל אביב - יפו',
```

**L173**

```
    await useCase.execute({ userId, displayName: 'נווה', cityId: '4000', cityName: 'חיפה' });
```

---

## `app/packages/application/src/auth/__tests__/CompleteOnboardingUseCase.test.ts`

**L12**

```
        displayName: 'נווה',
```

**L14**

```
        cityName: 'חיפה',
```

**L28**

```
        displayName: 'נווה',
```

**L30**

```
        cityName: 'חיפה',
```

**L44**

```
        displayName: 'נווה',
```

**L46**

```
        cityName: 'חיפה',
```

---

## `app/packages/application/src/auth/__tests__/DismissClosureExplainerUseCase.test.ts`

**L11**

```
        cityName: 'תל אביב',
```

**L27**

```
        cityName: 'תל אביב',
```

---

## `app/packages/application/src/auth/__tests__/SetAvatarUseCase.test.ts`

**L8**

```
    displayName: 'נווה',
```

**L10**

```
    cityName: 'חיפה',
```

---

## `app/packages/application/src/auth/__tests__/UpdateProfileUseCase.test.ts`

**L9**

```
      displayName: 'נוה',
```

**L11**

```
      cityName: 'תל אביב',
```

**L23**

```
      displayName: 'נוה ע',
```

**L25**

```
      cityName: 'חיפה',
```

**L26**

```
      biography: 'אוהב לתת',
```

**L30**

```
    expect(row?.displayName).toBe('נוה ע');
```

**L32**

```
    expect(row?.biography).toBe('אוהב לתת');
```

**L64**

```
    await expect(uc.execute({ userId: 'u-1', cityName: 'חיפה' })).rejects.toThrow('city_pair_required');
```

**L88**

```
    expect(repo.rows.get('u-1')?.displayName).toBe('נוה'); // unchanged
```

**L96**

```
      profileAddress: { street: 'רוטשילד', streetNumber: '22' },
```

**L98**

```
    expect(repo.rows.get('u-1')?.profileStreet).toBe('רוטשילד');
```

**L100**

```
    expect(repo.rows.get('u-1')?.displayName).toBe('נוה');
```

**L107**

```
      profileStreet: 'רחוב',
```

**L119**

```
      uc.execute({ userId: 'u-1', profileAddress: { street: 'רחוב', streetNumber: null } }),
```

**L126**

```
      uc.execute({ userId: 'u-1', profileAddress: { street: 'רחוב', streetNumber: 'abc' } }),
```

**L133**

```
    await uc.execute({ userId: 'u-1', profileAddress: { street: 'הרצל', streetNumber: '12א' } });
```

**L134**

```
    expect(repo.rows.get('u-1')?.profileStreetNumber).toBe('12א');
```

**L156**

```
      displayName: 'נוה ע',
```

**L158**

```
      cityName: 'חיפה',
```

**L159**

```
      biography: 'אוהב לתת',
```

**L161**

```
      profileAddress: { street: 'רוטשילד', streetNumber: '5א' },
```

**L171**

```
      displayName: 'נוה ע',
```

**L173**

```
      cityName: 'חיפה',
```

**L174**

```
      biography: 'אוהב לתת',
```

**L176**

```
      profileStreet: 'רוטשילד',
```

**L177**

```
      profileStreetNumber: '5א',
```

---

## `app/packages/application/src/chat/__tests__/BuildAutoMessageUseCase.test.ts`

**L8**

```
    expect(uc.execute({ postTitle: 'ספה תלת מושבית' })).toBe(
```

**L9**

```
      'היי! ראיתי את הפוסט שלך על ספה תלת מושבית. אשמח לדעת עוד.',
```

**L14**

```
    expect(uc.execute({ postTitle: '  כיסא משרדי  ' })).toBe(
```

**L15**

```
      'היי! ראיתי את הפוסט שלך על כיסא משרדי. אשמח לדעת עוד.',
```

---

## `app/packages/application/src/chat/BuildAutoMessageUseCase.ts`

**L9**

```
    return `היי! ראיתי את הפוסט שלך על ${title}. אשמח לדעת עוד.`;
```

---

## `app/packages/application/src/feed/__tests__/GetFeedUseCase.test.ts`

**L17**

```
        locationFilter: { centerCity: 'tel-aviv', centerCityName: 'תל אביב', radiusKm: 25 },
```

**L34**

```
        locationFilter: { centerCity: 'tel-aviv', centerCityName: 'תל אביב', radiusKm: 25 },
```

**L98**

```
      filter: { locationFilter: { centerCity: 'tel-aviv', centerCityName: 'תל אביב', radiusKm: 0 } },
```

**L105**

```
      filter: { locationFilter: { centerCity: 'tel-aviv', centerCityName: 'תל אביב', radiusKm: -5 } },
```

---

## `app/packages/application/src/feed/__tests__/selectGuestPreviewPosts.test.ts`

**L17**

```
  address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'a', streetNumber: '1' },
```

---

## `app/packages/application/src/follow/__tests__/followFakeUserRepository.ts`

**L156**

```
    cityName: 'תל אביב',
```

---

## `app/packages/application/src/moderation/__tests__/ReportUserUseCase.test.ts`

**L15**

```
      note: 'נראה ספאם',
```

**L24**

```
      note: 'נראה ספאם',
```

---

## `app/packages/application/src/notifications/__tests__/coalesce.test.ts`

**L6**

```
    const result = coalesceChat({ priorCount: 0, senderName: 'Avi', messagePreview: 'שלום' });
```

**L10**

```
      bodyArgs: { senderName: 'Avi', messagePreview: 'שלום' },
```

---

## `app/packages/application/src/ports/IPostRepository.ts`

**L51**

```
   *   - Give    → "נמסר ל-{recipientUser.displayName}"
```

**L52**

```
   *   - Request → "ניתן על-ידי {recipientUser.displayName}"
```

---

## `app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts`

**L10**

```
  title: 'ספה',
```

**L13**

```
  address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'אלנבי', streetNumber: '10' },
```

**L24**

```
    repo.createResult = { ...makePostWithOwner(), title: 'ספה' };
```

**L27**

```
    const out = await uc.execute(baseInput({ title: '   ספה   ' }));
```

**L30**

```
    expect(repo.lastCreateArgs?.title).toBe('ספה');
```

**L94**

```
      uc.execute(baseInput({ urgency: 'דחוף' })),
```

**L108**

```
        urgency: 'עד שישי',
```

**L113**

```
    expect(repo.lastCreateArgs?.urgency).toBe('עד שישי');
```

**L130**

```
        baseInput({ address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'אלנבי', streetNumber: '12א' } }),
```

**L133**

```
    expect(repo.lastCreateArgs?.address.streetNumber).toBe('12א');
```

**L141**

```
        baseInput({ address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'אלנבי', streetNumber: '12/3' } }),
```

**L152**

```
        baseInput({ address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'אלנבי', streetNumber: '12B' } }),
```

---

## `app/packages/application/src/posts/__tests__/fakePostRepository.ts`

**L163**

```
    address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'Allenby', streetNumber: '10' },
```

**L182**

```
    fullName: 'דנה לוי',
```

**L184**

```
    cityName: 'תל אביב',
```

---

## `app/packages/application/src/posts/__tests__/GetClosureCandidatesUseCase.test.ts`

**L9**

```
      makeClosureCandidate({ userId: 'u_a', fullName: 'דנה' }),
```

**L10**

```
      makeClosureCandidate({ userId: 'u_b', fullName: 'יוסי' }),
```

---

## `app/packages/application/src/posts/__tests__/SearchUsersForClosureUseCase.test.ts`

**L9**

```
    displayName: 'דנה לוי',
```

**L11**

```
    cityName: 'תל אביב',
```

**L37**

```
        return [mkUser({ userId: 'u_a', displayName: 'דנה' })];
```

**L42**

```
    const results = await uc.execute({ query: 'דנה', ownerId: 'u_owner', limit: 10 });
```

**L44**

```
    expect(captured).toEqual({ query: 'דנה', opts: { excludeUserId: 'u_owner', limit: 10 } });
```

**L46**

```
      { userId: 'u_a', fullName: 'דנה', avatarUrl: null, cityName: 'תל אביב', lastMessageAt: '' },
```

---

## `app/packages/application/src/posts/__tests__/UpdatePostUseCase.test.ts`

**L9**

```
    repo.updateResult = { ...makePostWithOwner({ postId: 'p_1', title: 'חדש' }) };
```

**L15**

```
      patch: { title: '  חדש  ' },
```

**L18**

```
    expect(out.post.title).toBe('חדש');
```

**L19**

```
    expect(repo.lastUpdateArgs?.patch.title).toBe('חדש');
```

**L118**

```
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { title: 'שינוי' } }),
```

**L128**

```
      uc.execute({ postId: 'p_1', viewerId: 'u_1', patch: { title: 'שינוי' } }),
```

---

## `app/packages/application/src/reports/__tests__/ReportChatUseCase.test.ts`

**L14**

```
      note: 'מטריד באופן עקבי',
```

**L23**

```
      note: 'מטריד באופן עקבי',
```

---

## `app/packages/application/src/reports/__tests__/ReportPostUseCase.test.ts`

**L14**

```
      note: 'נראה ספאם',
```

**L23**

```
      note: 'נראה ספאם',
```

---

## `app/packages/domain/src/entities.ts`

**L100**

```
   * counterpart side). Display layer renders null participants as "משתמש שנמחק".
```

---

## `app/packages/domain/src/value-objects.ts`

**L54**

```
  New: 'חדש',
```

**L55**

```
  LikeNew: 'כמו חדש',
```

**L56**

```
  Good: 'טוב',
```

**L57**

```
  Fair: 'בינוני',
```

**L58**

```
  Damaged: 'שבור/תקול',
```

**L75**

```
  Furniture: 'רהיטים',
```

**L76**

```
  Clothing: 'בגדים',
```

**L77**

```
  Books: 'ספרים',
```

**L78**

```
  Toys: 'משחקים',
```

**L79**

```
  BabyGear: 'ציוד תינוקות',
```

**L80**

```
  Kitchen: 'מטבח',
```

**L81**

```
  Sports: 'ספורט',
```

**L82**

```
  Electronics: 'חשמל',
```

**L83**

```
  Tools: 'כלי עבודה',
```

**L84**

```
  Other: 'אחר',
```

**L132**

```
  readonly cityName: string; // display name, e.g. "תל אביב"
```

**L149**

```
export const STREET_NUMBER_PATTERN = /^[0-9]+[A-Za-zא-ת]?$/;
```

---

## `app/packages/infrastructure-supabase/src/chat/__tests__/rowMappers.test.ts`

**L70**

```
      body: 'שלום',
```

**L83**

```
      body: 'שלום',
```

---

## `app/packages/infrastructure-supabase/src/chat/getMyChats.ts`

**L122**

```
              displayName: 'משתמש שנמחק',
```

---

## `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`

**L163**

```
        displayName: 'משתמש שנמחק',
```

**L178**

```
        displayName: 'משתמש שנמחק',
```

---

## `app/packages/infrastructure-supabase/src/cities/__tests__/SupabaseCityRepository.test.ts`

**L58**

```
          { city_id: 'IL-001', name_he: 'תל אביב', name_en: 'Tel Aviv' },
```

**L59**

```
          { city_id: 'IL-002', name_he: 'ירושלים', name_en: 'Jerusalem' },
```

**L67**

```
        { cityId: 'IL-001', nameHe: 'תל אביב', nameEn: 'Tel Aviv' },
```

**L68**

```
        { cityId: 'IL-002', nameHe: 'ירושלים', nameEn: 'Jerusalem' },
```

**L77**

```
          { city_id: 'IL-002', name_he: 'באר שבע', name_en: 'Beer Sheva' },
```

**L78**

```
          { city_id: 'IL-001', name_he: 'אילת', name_en: 'Eilat' },
```

---

## `app/packages/infrastructure-supabase/src/posts/__tests__/mapPostRow.test.ts`

**L50**

```
    const out = mapPostRow(makeRow({ city_ref: { name_he: 'תל אביב' } }));
```

**L51**

```
    expect(out.address.cityName).toBe('תל אביב');
```

**L117**

```
        display_name: 'אבי',
```

**L128**

```
    expect(out.ownerName).toBe('אבי');
```

**L136**

```
  it('falls back to "משתמש שנמחק" placeholder when owner is null (orphan FK)', () => {
```

**L138**

```
    expect(out.ownerName).toBe('משתמש שנמחק');
```

**L153**

```
            display_name: 'דנה',
```

**L163**

```
      displayName: 'דנה',
```

---

## `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts`

**L103**

```
  // a null owner. Surface "משתמש שנמחק" placeholder rather than throwing —
```

**L110**

```
      ownerName: 'משתמש שנמחק',
```

**L130**

```
// "נמסר ל-X" / "ניתן על-ידי X" with a profile link without a second round-trip.
```

---

## `app/packages/infrastructure-supabase/src/search/__tests__/searchMappers.test.ts`

**L80**

```
      categoryLabelHe: 'אוכל',
```

**L90**

```
      ['time', 'זמן'],
```

**L91**

```
      ['money', 'כסף'],
```

**L92**

```
      ['food', 'אוכל'],
```

**L93**

```
      ['housing', 'דיור'],
```

**L94**

```
      ['transport', 'תחבורה'],
```

**L95**

```
      ['knowledge', 'ידע'],
```

**L96**

```
      ['animals', 'חיות'],
```

**L97**

```
      ['medical', 'רפואה'],
```

---

## `app/packages/infrastructure-supabase/src/search/__tests__/searchUtils.test.ts`

**L11**

```
    expect(escapeIlike('שלום')).toBe('שלום');
```

**L63**

```
      ['זמן', 'time'],
```

**L64**

```
      ['כסף', 'money'],
```

**L65**

```
      ['אוכל', 'food'],
```

**L66**

```
      ['דיור', 'housing'],
```

**L67**

```
      ['תחבורה', 'transport'],
```

**L68**

```
      ['ידע', 'knowledge'],
```

**L69**

```
      ['חיות', 'animals'],
```

**L70**

```
      ['רפואה', 'medical'],
```

**L77**

```
    expect(findMatchingCategorySlug('אני מחפש אוכל לארוחת ערב')).toBe('food');
```

**L78**

```
    expect(findMatchingCategorySlug('צריך תחבורה מחר')).toBe('transport');
```

**L83**

```
    // זמן, כסף, אוכל, דיור, תחבורה, ידע, חיות, רפואה — Object.entries iterates
```

**L84**

```
    // string keys in insertion order, so זמן wins over אוכל when both appear.
```

**L85**

```
    expect(findMatchingCategorySlug('זמן ואוכל')).toBe('time');
```

**L88**

```
    expect(findMatchingCategorySlug('אוכל ודיור')).toBe('food');
```

**L92**

```
    // 'זמ' is a substring of 'זמן' but does NOT contain the full label.
```

**L95**

```
    expect(findMatchingCategorySlug('זמ')).toBeNull();
```

**L96**

```
    expect(findMatchingCategorySlug('ידע ידע ידעי')).toBe('knowledge');
```

---

## `app/packages/infrastructure-supabase/src/search/searchConstants.ts`

**L3**

```
  'זמן': 'time', 'כסף': 'money', 'אוכל': 'food', 'דיור': 'housing',
```

**L4**

```
  'תחבורה': 'transport', 'ידע': 'knowledge', 'חיות': 'animals', 'רפואה': 'medical',
```

**L7**

```
  time: 'זמן', money: 'כסף', food: 'אוכל', housing: 'דיור',
```

**L8**

```
  transport: 'תחבורה', knowledge: 'ידע', animals: 'חיות', medical: 'רפואה',
```

---

## `CLAUDE.md`

**L38**

```
   > ⚠️ הבקשה שלך סותרת את האפיון:
```

**L39**

```
   > - אפיון: [quote from spec]
```

**L40**

```
   > - בקשה: [what you asked]
```

**L41**

```
   > האם לעדכן את האפיון? (כן/לא)
```

**L44**

```
4. **If new feature (not in spec)** → report: "הפיצ'ר הזה לא מופיע באפיון. להוסיף?"
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/00_Index.md`

**L5**

```
**גרסה:** 1.3 (MVP)
```

**L6**

```
**תאריך עדכון אחרון:** מאי 2026
```

**L7**

```
**בעלים:** מנהל מוצר
```

**L8**

```
**סטטוס:** SSOT ל-MVP – הגרסה הראשונה לשוק
```

**L12**

```
## 📝 לוג שינויים
```

**L14**

```
| גרסה  | תאריך       | שינוי                                                                                                         |
```

**L16**

```
| 1.0   | מאי 2026    | יצירה ראשונית של מסמכי PRD ל-MVP מתוך PRD_HE_V2.                                                              |
```

**L17**

```
| 1.1   | מאי 2026    | החלטות לכל 12 השאלות הפתוחות + הוספת Q-13 (סטטוס ביניים). שינויים מרכזיים: Google SSO, רב-פלטפורמיות (iOS+Android+Web), כתובת חובה, מנגנון סגירה רב-שלבי, פתיחה מחדש, רמת חשיפת פוסט (פומבי/עוקבים), שמירת חיפוש אחרון, מערכת דיווחים אוטומטית. |
```

**L18**

```
| 1.2   | מאי 2026    | **תיקון סתירת פרטיות פרופיל ↔ פוסטים לעוקבים בלבד.** הוספת **מצב פרטיות פרופיל** (פומבי ברירת מחדל / פרטי אופציונלי, עם אישור עקיבה) + הרחבת רמות חשיפת פוסט ל-**3 רמות** (🌍 פומבי / 👥 רק עוקבים שלי – זמין רק בפרופיל פרטי / 🔒 רק אני). הוספת בקשות עקיבה, הסרת עוקב, מסך 5.4 בקשות עקיבה, וקטגוריית "פרטיות" בהגדרות. כללים חדשים: R-MVP-Profile-9, 10; R-MVP-Privacy-11, 12, 13; R-MVP-Items-14. עדכון R-MVP-Items-12, R-MVP-Privacy-9. זרימות חדשות: 12 (שינוי מצב פרטיות), 13 (ניהול בקשות), 14 (הסרת עוקב). |
```

**L19**

```
| 1.3   | מאי 2026    | **PRD MVP Contradictions Audit – פתרון מקיף של 33 בעיות.** P0: יישור מודל אורח (Guest 3-post preview) על פני Personas/Navigation/Splash; הסרת לייקים מ-KPI #4 (חוץ מ-MVP); כתובת מלאה כשדה חובה; הסרת "תגובה" מהמודרציה. P1: סטטיסטיקות 3 כרטיסים; הגדרת North Star בדיוק (`closed_delivered` בלבד); הבהרת Admin (אין UI ייעודי, Extensions מותני-הרשאה); השעיית משתמש לאחר 3 דיווחים; חלון Reopen של `deleted_no_recipient` = 7 ימים; ספירת מסכים = 27; סדר אישורי פרסום אחיד. P2: Apple SSO בכל הטבלאות; הפרדת איסוף/הצגה/שמירה של כתובת; הגדרת `expired` lifecycle; זיהוי פוסט בתשלום = Community-driven; תעדוף מדיניות הסרה; שינוי סיסמה רק למשתמשי מייל; Settings nav map שלם; כפילות 6.6 → 6.7+6.8. כללים חדשים: R-MVP-Items-15. עדכונים: R-MVP-Items-1, 4, 5, 6, 10, 13; R-MVP-Privacy-1, 5, 9, 10, 13. |
```

**L23**

```
## א. מה זה המסמך הזה?
```

**L25**

```
מסמך זה מאגד את **דרישות המוצר לגרסה הראשונה (MVP)** של Karma Community שתצא לשוק. הוא **תת-סט ממוקד** של החזון המלא המתועד ב-[`../PRD_HE_V2/`](../PRD_HE_V2/00_Index.md), עם מטרה אחת ברורה:
```

**L27**

```
> **לבחון Product-Market-Fit סביב הצעת ערך אחת, חדה וברורה: "רשת חברתית בסיסית למסירה וקבלה של חפצים מכל הסוגים בחינם".**
```

**L29**

```
ה-MVP **אינו** ניסיון לממש את כל החזון בקטן. הוא מימוש **מלא ואיכותי** של פלח אחד מהחזון – עולם החפצים – עם תשתית חברתית בסיסית שתאפשר הרחבה עתידית.
```

**L33**

```
## ב. עקרונות מנחים ל-MVP
```

**L35**

```
1. **פיצ'ר ב-MVP = פיצ'ר חיוני לאימות PMF.** כל פיצ'ר שאינו תורם ישירות להוכחת התזה (אנשים מוסרים ומקבלים חפצים בפלטפורמה) – יידחה לגרסה עתידית.
```

**L36**

```
2. **תשתית קלינית ארכיטקטונית.** המבנה צריך לאפשר הרחבה עתידית לעולמות תרומה נוספים ([`../PRD_HE_V2/donation_worlds/`](../PRD_HE_V2/donation_worlds/00_Index.md)) וכן **לשאר הפיצ'רים שיתווספו בהמשך** ללא שכתוב יסודי.
```

**L37**

```
3. **חוויה חלקה ומהירה.** במקום מנגנונים מורכבים – פשטות. במקום אנונימיות מרובת רמות עם מוקדנים – **2 מצבי פרופיל** (🌍 פומבי / 🔒 פרטי) **ו-3 רמות חשיפת פוסט** (🌍 פומבי / 👥 רק עוקבים שלי / 🔒 רק אני). במקום בחירת מקבל פורמלית – צ'אט פתוח.
```

**L38**

```
4. **בטיחות מינימלית הכרחית.** דיווח ספאם, חסימת משתמש, חובת תמונה. בלי וי כחול, בלי מוקדנים, בלי אימות ת"ז.
```

**L39**

```
5. **מודד אחד בלב המוצר:** כמה חפצים נמסרים בפועל בפלטפורמה.
```

**L43**

```
## ג. תוכן עניינים
```

**L45**

```
| #   | מסמך                                                          | תיאור                                                  |
```

**L47**

```
| 1   | [`01_Vision_Goals.md`](./01_Vision_Goals.md)                  | חזון ה-MVP, אסטרטגיית PMF, KPIs                        |
```

**L48**

```
| 2   | [`02_Personas_Roles.md`](./02_Personas_Roles.md)              | פרסונות ותפקידים ב-MVP                                 |
```

**L49**

```
| 3   | [`03_Core_Features.md`](./03_Core_Features.md)                | פיצ'רי הליבה: אימות, פרופיל, חפצים, צ'אט, הגדרות, סטטס |
```

**L50**

```
| 4   | [`04_User_Flows.md`](./04_User_Flows.md)                      | זרימות משתמש מרכזיות                                   |
```

**L51**

```
| 5   | [`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md)        | מיפוי מלא של כל המסכים ב-MVP                           |
```

**L52**

```
| 6   | [`06_Navigation_Structure.md`](./06_Navigation_Structure.md)  | מבנה הניווט (עליון + תחתון)                            |
```

**L53**

```
| 7   | [`07_Business_Rules.md`](./07_Business_Rules.md)              | כללים עסקיים וגבולות בטיחות                            |
```

**L54**

```
| 8   | [`08_Out_of_Scope_and_Future.md`](./08_Out_of_Scope_and_Future.md) | מה **לא** בתוך ה-MVP – ומדוע                            |
```

**L58**

```
## ד. יחס ל-PRD החזון המלא
```

**L60**

```
| היבט              | PRD (חזון מלא)                 | PRD_MVP (גרסה ראשונה)                       |
```

**L62**

```
| עולמות תרומה      | 13 עולמות                             | **1 עולם בלבד: חפצים**                      |
```

**L63**

```
| תפקידים (משתמש קצה)   | 10 תפקידים (מתנדב, מוקדן, אדמין וכו') | **2: אורח, חבר קהילה** (יישור P3 #30 – לא כולל סופר אדמין שאינו תפקיד משתמש קצה אלא תפקיד תפעולי, ראה 02 §2.2) |
```

**L64**

```
| אנונימיות         | 3 רמות + שידוכים מוקדנים              | 2 מצבי פרופיל (פומבי / פרטי) + 3 רמות חשיפת פוסט (פומבי / עוקבים / רק אני). אין מוקדנים. |
```

**L65**

```
| עמותות וארגונים   | מערך CRM/ERP מלא                      | אין – משתמשים פרטיים בלבד                   |
```

**L66**

```
| אימות זהות        | וי כחול + העלאת ת"ז                   | טלפון / דוא"ל / Google; **Apple ב-iOS** (יישור P2 #16) |
```

**L67**

```
| צ'אט              | 9 סוגי שיחות                          | **1 סוג: שיחה פרטית בין שני משתמשים**       |
```

**L68**

```
| אתגרים, AI, Bookmarks | קיים                              | **לא קיים**                                 |
```

**L70**

```
> **למה זה חשוב:** ה-MVP נבחן בעיקר על **קצב מסירת חפצים מוצלחת**. כל פיצ'ר אחר מוסיף עומס מוצרי וטכני שיכול לטשטש את האות הזה.
```

**L74**

```
## ה. כללי תחזוקה
```

**L76**

```
* כל שינוי במסמך MVP חייב להיות מסומן בלוג שינויים בראש הקובץ הרלוונטי.
```

**L77**

```
* פיצ'ר שעבר את ה-MVP ועובר לגרסה עתידית – יועבר ל-`PRD_HE_V2` עם הקישור הנדרש.
```

**L78**

```
* פיצ'ר חדש שלא היה ב-V2 ועולה במהלך ה-MVP – יעבור תהליך בחינה ויקבל החלטה: להיכנס ל-MVP, להידחות, או להיכנס לחזון העתידי.
```

**L79**

```
* **שפת המסמך:** עברית (RTL), בהמשך לקונבנציית `PRD_HE_V2`.
```

**L83**

```
*מעבר לפרק הראשון: [1. חזון, ייעוד ומטרות עסקיות](./01_Vision_Goals.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/01_Vision_Goals.md`

**L3**

```
## 🎯 1. חזון, ייעוד ומטרות (MVP)
```

**L5**

```
### 1.1 הצעת ערך אחת ויחידה
```

**L7**

```
> **"רשת חברתית בסיסית למסירה וקבלה של חפצים מכל הסוגים בחינם."**
```

**L9**

```
זו ה-**One-Liner** של הגרסה הראשונה. היא **גזורה ישירות** מהחזון הרחב ([`../PRD_HE_V2/01_Vision_Goals.md`](../PRD_HE_V2/01_Vision_Goals.md)) – אבל מצמצמת את היריעה למה שהכי קל להסביר, להבין ולמדוד:
```

**L11**

```
* משתמש שיש לו חפץ שאינו זקוק לו → מפרסם אותו → אדם אחר מקבל אותו → סגירת הפוסט.
```

**L12**

```
* משתמש שזקוק לחפץ → מפרסם בקשה → משתמש אחר מתאים מציע אותו → מסירה.
```

**L13**

```
* כל זה **בחינם** – אין כסף, אין רווח, אין תשלום. רק נתינה וקבלה.
```

**L15**

```
### 1.2 למה דווקא חפצים, ולמה דווקא MVP?
```

**L17**

```
עולם החפצים הוא **בסיס "תן וקח" האינטואיטיבי ביותר** של הפלטפורמה (ראה [`../PRD_HE_V2/donation_worlds/02_Items.md`](../PRD_HE_V2/donation_worlds/02_Items.md)). הוא נבחר כעולם הראשון מסיבות אסטרטגיות:
```

**L19**

```
1. **שוק קיים ומוכח:** קבוצות "תן וקח" בפייסבוק, יד 2, אתרי תרומות. הביקוש קיים – השאלה האם נצליח לבנות מוצר טוב יותר.
```

**L20**

```
2. **חיכוך נמוך:** אין רגישות מוסרית/בריאותית כמו ברפואה או בכסף. אין דרישות רגולטוריות כמו בדיור.
```

**L21**

```
3. **ערך מיידי וברור:** המשתמש מקבל ספה / ספר / בגדים – מוחשי, מדיד, מספק.
```

**L22**

```
4. **לולאת רטנציה טבעית:** כל בית יכול להפיק עשרות חפצים לאורך שנים – זה לא מוצר חד-פעמי.
```

**L23**

```
5. **מהווה תשתית לכל העולמות:** המודל של "פוסט עם דואליות לתת/לקבל" שיוקם כאן יהווה את הבסיס לכל 12 העולמות הנוספים.
```

**L25**

```
### 1.3 מה אנחנו **לא** מנסים להוכיח ב-MVP
```

**L27**

```
* ❌ שעמותות יצטרפו לפלטפורמה.
```

**L28**

```
* ❌ שמתנדבים יצטרפו לפלטפורמה.
```

**L29**

```
* ❌ שמשתמשים יתרמו כסף, מזון, דם.
```

**L30**

```
* ❌ שמשתמשים ישתתפו באתגרים.
```

**L31**

```
* ❌ שמוקדנים יוכלו לטפל בבקשות רגישות.
```

**L32**

```
* ❌ שמשתמשים יבנו קורסים דיגיטליים.
```

**L34**

```
> כל אלה הם פיצ'רים מאומתים בחזון – אבל לא ב-PMF הראשוני. אנחנו בודקים תזה אחת בכל פעם.
```

**L36**

```
### 1.4 מה אנחנו **כן** מנסים להוכיח ב-MVP (תזות PMF)
```

**L38**

```
| #   | תזה                                                                              | איך בודקים?                                                  |
```

**L40**

```
| T1  | אנשים מוכנים לפרסם חפצים שאינם זקוקים להם דרך אפליקציה ייעודית (ולא Facebook).   | יחס יצירת פוסטים לכל משתמש פעיל                              |
```

**L41**

```
| T2  | אנשים מוצאים חפצים שהם מחפשים בפלטפורמה.                                          | יחס המרה: פרסום בקשה → מסירה מוצלחת                          |
```

**L42**

```
| T3  | המעבר מפיד → צ'אט פרטי → מסירה הוא חוויה חלקה.                                    | אחוז הפוסטים שנסגרים כ"נמסר" מתוך כלל הפוסטים                |
```

**L43**

```
| T4  | מנגנון העוקבים מייצר ערך חברתי (מעבר לעסקה).                                      | מספר עוקבים ממוצע למשתמש פעיל; שיעור הצ'אטים בין משתמשים מחוברים |
```

**L44**

```
| T5  | המשתמשים חוזרים שוב ושוב לפלטפורמה.                                               | רטנציה W1, W4, W12                                           |
```

**L48**

```
## 1.5 מטרות עסקיות מרכזיות ל-MVP (KPIs)
```

**L50**

```
### 1.5.1 KPI ראשי (North Star Metric)
```

**L52**

```
> **מספר חפצים שנמסרו בהצלחה בחודש = מספר פוסטים שעברו לסטטוס `closed_delivered` (סגירה עם סימון מקבל).**
```

**L54**

```
זה המדד היחיד שצריך לעלות. כל מדד אחר משרת אותו.
```

**L56**

```
> **הבהרה (יישור עם 03 ו-07):** סגירה ללא סימון מקבל (`deleted_no_recipient`) **אינה** נספרת ב-North Star, גם אם היא מעדכנת את הסטטיסטיקה האישית של "חפצים שמסרתי" (3.6 ו-R-MVP-Items-4). הסיבה: ללא תיוג מקבל, אין לנו אישור דו-צדדי שהמסירה התרחשה בפועל. עדכון "חפצים שמסרתי" משמש להמרצה אישית של הבעל בלבד.
```

**L58**

```
### 1.5.2 KPIs תומכים
```

**L60**

```
| #   | מטרה                                | מדד                                                       | יעד מינימום (3 חודשים) |
```

**L62**

```
| 1   | רכישת משתמשים                       | משתמשים רשומים                                            | 1,000                  |
```

**L63**

```
| 2   | אקטיבציה                            | אחוז משתמשים שיצרו פוסט לפחות אחד תוך 7 ימים מהרשמה        | ≥ 25%                  |
```

**L64**

```
| 3   | יחס המרה של פוסט לנתינה             | אחוז פוסטים שנסגרו כ"נמסר"                                 | ≥ 35%                  |
```

**L65**

```
| 4   | זמן ממוצע מפרסום לסגירה (`closed_delivered`) | ממוצע ימים בין יצירת פוסט להעברתו לסטטוס `closed_delivered` | ≤ 7 ימים               |
```

**L66**

```
| 5   | רטנציה שבועית (W1)                  | חזרה לאפליקציה תוך שבוע מההרשמה                            | ≥ 30%                  |
```

**L67**

```
| 6   | רטנציה חודשית (W4)                  | חזרה לאפליקציה תוך חודש                                   | ≥ 15%                  |
```

**L68**

```
| 7   | פוסטים פעילים בו-זמנית              | spread זמני של פוסטים פתוחים                              | ≥ 200                  |
```

**L69**

```
| 8   | NPS                                 | סקר שביעות רצון                                            | ≥ +20                  |
```

**L70**

```
| 9   | דיווחים על תוכן בעייתי              | אחוז מכלל הפוסטים                                         | < 2%                   |
```

**L72**

```
### 1.5.3 מה הופך MVP למוצלח?
```

**L74**

```
ה-MVP יוגדר כ-**הצליח** אם, בתום 3 חודשים מהשקה:
```

**L76**

```
1. ✅ לפחות **300 חפצים נמסרו** בפועל – פוסטים שעברו לסטטוס `closed_delivered` (כלומר נסגרו עם סימון מקבל). **לא** כולל סגירות ללא סימון מקבל (`deleted_no_recipient`).
```

**L77**

```
2. ✅ **רטנציה W4 ≥ 15%** – כלומר 15% מהמשתמשים החדשים חוזרים אחרי חודש.
```

**L78**

```
3. ✅ **NPS ≥ +20** מסקר משתמשים פעילים.
```

**L79**

```
4. ✅ **לפחות 30%** מהפוסטים מקבלים **אינטראקציית צ'אט אחת לפחות** (פתיחת שיחה ושליחת הודעה אחת לפחות בין משתמש זר לבעל הפוסט). **הערה:** לייקים ותגובות אינם ב-MVP (ראה [`08_Out_of_Scope_and_Future.md#8.2.4`](./08_Out_of_Scope_and_Future.md)), ולכן המדד הוא צ'אט בלבד.
```

**L80**

```
5. ✅ **ללא תקלות בטיחות מהותיות** (התראת חירום, הונאה מוכחת, פגיעה במשתמש).
```

**L82**

```
אם תזות אלה אומתו – המוצר עובר לשלב הבא: הוספת עולם המזון (3.5.6 בחזון) או הרחבת תכונות חברתיות בעולם החפצים או תחבורה שיתופית.
```

**L84**

```
אם תזות אלה **לא** אומתו – נחזור לאיטרציה: ראיונות משתמשים, התאמה של ה-Onboarding, חידוד של הפיד, וכדומה.
```

**L88**

```
## 1.6 ערכי ליבה של ה-MVP
```

**L90**

```
* **פשטות לפני שלמות.** מה ש"חסר" ב-MVP זה לא חסרון – זה החלטה.
```

**L91**

```
* **חינם תמיד.** אסור שיהיה כסף שעובר בין משתמשים. נקודה.
```

**L92**

```
* **בטיחות מינימלית.** **תמונת חפץ חובה בפוסט מסוג 🎁 לתת** (R-MVP-Items-1; אופציונלית ב-🔍 לבקש), דיווח ספאם, חסימה. **תמונת פרופיל אופציונלית** (R-MVP-Profile-1). די להתחלה.
```

**L93**

```
* **חוויה ניידת קודם.** האפליקציה היא Mobile-First. ניידים זה איפה שתהיה הפעילות.
```

**L94**

```
* **קהילה מעל פיצ'רים.** עוקבים, פרופילים בולטים, היסטוריית עשייה – אלה ה-glue שיהפוך את האפליקציה ל"רשת חברתית" ולא רק "לוח מודעות".
```

**L98**

```
## 1.7 קהל יעד ראשוני (Beachhead)
```

**L100**

```
* **גיאוגרפיה:** ישראל (עברית RTL בלבד ב-MVP).
```

**L101**

```
* **גיל:** 25-50 (שיא הפעילות בקבוצות "תן וקח" בפייסבוק).
```

**L102**

```
* **פסיכוגרפיה:** מודעות סביבתית, אורח חיים מינימליסטי, חברתיות, שאיפה לתת ולעזור.
```

**L103**

```
* **טריגרים לשימוש:** מעבר דירה, סיום הריון/לידה, ילד שגדל, ניקיון אביב, מציאת חפץ ספציפי לפרויקט.
```

**L107**

```
*הפרק הבא: [2. קהלי יעד, תפקידים והרשאות](./02_Personas_Roles.md)*
```

**L108**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/02_Personas_Roles.md`

**L3**

```
## 👥 2. פרסונות ותפקידים (MVP)
```

**L5**

```
### 2.1 היררכיית התפקידים – פשוטה לחלוטין
```

**L7**

```
ב-MVP יש רק **2 תפקידים אמיתיים**, והבדל אחד תפעולי בין מנהלי המערכת והמשתמשים. כל המבנה ההיררכי הרחב של [`../PRD_HE_V2/02_Personas_Roles.md`](../PRD_HE_V2/02_Personas_Roles.md) (מתנדב, מוקדן, מנהל ארגון, מנהל מתנדבים, סופר אדמין רקורסיבי) **נדחה לגרסה עתידית**.
```

**L10**

```
⚙️ מנהל מערכת (Admin) ← פעולות תפעוליות בלבד (תמיכה, חסימת משתמש בעייתי)
```

**L11**

```
 └── 👤 חבר קהילה (User) ← המשתמש הרשום הסטנדרטי – פעולה מלאה באפליקציה
```

**L12**

```
 └── 👤 אורח (Guest) ← צפייה מוגבלת לפני הרשמה
```

**L15**

```
> **הערה (יישור P1 #9):** **אין UI אדמין ייעודי ב-MVP.** הסופר אדמין משתמש באפליקציה כמשתמש רגיל, אך מתחבר עם החשבון `karmacommunity2.0@gmail.com`. מתוך אותו UI סטנדרטי (Inbox / פרופיל / פוסט) הוא:
```

**L17**

```
> 1. **מקבל הודעות מערכת אוטומטיות** ב-Inbox שלו עם לינקים לפריטים מדווחים (ראה 6.6 במסמך 5).
```

**L18**

```
> 2. **פועל באמצעות כפתורים מותנים בזהות החשבון** – למשל "↩️ שחזר פריט" בתוך הודעת המערכת, או "השעה משתמש סופית" שמופיעה בתפריט (⋮) של פרופיל המשתמש **רק כאשר המשתמש המחובר הוא הסופר אדמין** (Server-side authorization לפי `role=super_admin`).
```

**L19**

```
> 3. **משתמש בכלים פנימיים מחוץ לאפליקציה** (Postgres CLI / סקריפטים / דשבורד פנימי בסיסי) רק עבור פעולות נדירות שאינן ניתנות לבצע מתוך ה-UI הסטנדרטי (למשל שאילתות BI אד-הוק).
```

**L21**

```
> **המשמעות:** ה"כוחות המוסתרים" של האדמין הם הרחבות מותנות-הרשאות של ה-UI הקיים, **לא** מסכים נפרדים. גבול ה-MVP: כל מסך נפרד ייעודי לאדמין נדחה ל-V2 ([`08_Out_of_Scope_and_Future.md`](./08_Out_of_Scope_and_Future.md), Admin UI).
```

**L25**

```
### 2.2 פירוט תפקידים
```

**L27**

```
#### 👤 אורח (Guest)
```

**L28**

```
* **תיאור:** אדם שהוריד את האפליקציה, פתח אותה, אך טרם נרשם.
```

**L29**

```
* **יכולות:**
```

**L30**

```
    * צפייה במסך הנחיתה (Splash + הצגת הצעת הערך).
```

**L31**

```
    * **צפייה ב-Guest Preview Feed** – 3 הפוסטים העדכניים בלבד, ב**מצב קריאה בלבד** (ראה [`03_Core_Features.md#3.3.1.4`](./03_Core_Features.md) ו-[`05_Screen_UI_Mapping.md#1.7`](./05_Screen_UI_Mapping.md)).
```

**L32**

```
* **חוסם פעולה:** כל ניסיון אינטראקציה (לחיצה על פוסט / משתמש / סנן / "+" / שליחת הודעה / סגירה / עקיבה / דיווח) מציג Overlay הצטרפות שמוביל למסך Auth (1.2). **אין** ניווט אוטומטי חזרה ל-Splash – האורח מוחזר ל-Auth (יישור עם זרימה 1.1 ב-04).
```

**L33**

```
* **כפתור פעולה ראשי:** "הצטרף לקהילה" / "התחבר".
```

**L35**

```
#### 👤 חבר קהילה (User)
```

**L36**

```
* **תיאור:** המשתמש הסטנדרטי הרשום ב-MVP. **בניגוד לחזון – אין מצב "מאומת" / "וי כחול" ב-MVP.** כל משתמש רשום הוא אותו דבר.
```

**L37**

```
* **כל היכולות הבאות זמינות:**
```

**L38**

```
    * יצירת פוסט (חפץ למסירה / בקשת חפץ).
```

**L39**

```
    * עריכה ומחיקת פוסט שיצר.
```

**L40**

```
    * סגירת פוסט (סימון "נמסר") – הפוסט עובר לסטטוס "סגור".
```

**L41**

```
    * שליחת הודעת צ'אט פרטית למשתמש אחר.
```

**L42**

```
    * **בחירת מצב פרטיות לפרופיל**: 🌍 פומבי (ברירת מחדל) – עקיבה ללא אישור / 🔒 פרטי – עקיבה דורשת אישור. ראה [`03_Core_Features.md#3.2.3`](./03_Core_Features.md).
```

**L43**

```
    * עקיבה אחרי משתמש (Follow) – מיידית בפרופיל פומבי, **דורשת אישור** בפרופיל פרטי.
```

**L44**

```
    * **אישור / דחיית בקשות עקיבה** (כשהפרופיל שלי פרטי).
```

**L45**

```
    * **הסרת עוקב** קיים מתוך רשימת העוקבים שלי.
```

**L46**

```
    * **בחירת רמת חשיפה** לכל פוסט מתוך 3 רמות: 🌍 פומבי / 👥 רק עוקבים שלי (זמין רק בפרופיל פרטי) / 🔒 רק אני (פרטי).
```

**L47**

```
    * צפייה בפרופיל של משתמש אחר (תוכן פוסטים בפרופיל פרטי – רק לעוקבים מאושרים).
```

**L48**

```
    * דיווח על פוסט / משתמש בעייתי.
```

**L49**

```
    * חסימת משתמש (לא יראה את הפוסטים והודעות שלו).
```

**L50**

```
    * עריכת פרופיל אישי.
```

**L51**

```
    * סטטיסטיקות: **אישיות** (מסך פנימי בסיסי) **וגם מדדי קהילה מצומצמים** (מספר משתמשים רשומים, פוסטים פעילים וכו' — בלי עומס; תחושת “מה קורה באפליקציה”, לא דשבורד ניתוח מלא).
```

**L52**

```
    * הגדרות בסיסיות (התנתקות, מחיקת חשבון, התראות on/off, מעבר לסטטיסטיקות, **פרטיות** – מצב פרופיל + בקשות עקיבה + חסומים, **דיווח בעיה** שפותח שיחת צ'אט 1:1 עם חשבון הסופר אדמין).
```

**L54**

```
#### ⚙️ מנהל מערכת (Super Admin) – ללא UI ייעודי
```

**L55**

```
* **תיאור:** משתמש פנימי יחיד בצוות תפעול / מוצר. **אין לו מסך / מסלול ניווט ייעודי ב-MVP**, אבל יש לו חשבון מיוחד באפליקציה ופעולות מותנות-הרשאה ב-UI הקיים.
```

**L56**

```
* **חשבון רשמי:** `karmacommunity2.0@gmail.com` (זוהה ב-Server לפי `role=super_admin`).
```

**L57**

```
* **כיצד מקבל מידע (Inbox רגיל, 4.1+4.2):**
```

**L58**

```
    * **כל דיווח שמתקבל באפליקציה** (על פוסט / משתמש / שיחה) נשלח אוטומטית כ**הודעת מערכת לצ'אט הסופר אדמין**.
```

**L59**

```
    * **דיווח בעיה מהגדרות:** נפתחת (או מתעדכנת) **שיחה 1:1** בין המשתמש המדווח לבין חשבון הסופר אדמין; אצל האדמין מופיעה שיחה עם אותו משתמש, עם **הודעת מערכת** שמסכמת את תוכן הדיווח (והמשתמש מועבר למסך השיחה כדי להמשיך לתקשר בטקסט).
```

**L60**

```
    * **כל הסרה אוטומטית בעקבות 3 דיווחים** מפיקה גם הודעה לסופר אדמין (כולל לינק לפוסט/משתמש/שיחה שהוסרו).
```

**L61**

```
* **יכולות (Extensions ל-UI הקיים, מותנות-זהות חשבון):**
```

**L62**

```
    * **שחזור פוסט/משתמש/שיחה שהוסרו אוטומטית** – כפתור "↩️ שחזר" בתוך הודעת המערכת בצ'אט.
```

**L63**

```
    * **חסימת משתמש סופית (Ban)** – פריט נוסף בתפריט (⋮) של פרופיל משתמש 3.3, **גלוי רק כאשר המשתמש המחובר הוא הסופר אדמין**.
```

**L64**

```
    * **הסרת פוסט/שיחה ידנית** – פריט נוסף בתפריט (⋮) של פרטי פוסט 2.3 או של שיחה 4.2, **גלוי רק לסופר אדמין**.
```

**L65**

```
    * שליפת נתונים סטטיסטיים גלובליים – דרך כלים פנימיים מחוץ לאפליקציה (DB / סקריפטים).
```

**L66**

```
* **המשתמש הסופי לא נחשף לתפקיד הזה.** המסכים הציבוריים זהים לחלוטין; ה-extensions מוסתרים ב-Frontend וב-Server לפי `role`.
```

**L67**

```
* **רק חשבון אחד** של סופר אדמין ב-MVP. בגרסאות עתידיות נוסיף מספר אדמינים והיררכיה (V2).
```

**L71**

```
### 2.3 מטריצת הרשאות – מינימליסטית
```

**L73**

```
| פעולה                                    | אורח | חבר קהילה                                    |
```

**L75**

```
| צפייה במסך נחיתה                          | ✅    | ✅                                            |
```

**L76**

```
| צפייה בפיד מלא                            | ❌    | ✅                                            |
```

**L77**

```
| **Guest Preview** (3 פוסטים, קריאה בלבד) | ✅    | – (לא רלוונטי)                                |
```

**L78**

```
| כל אינטראקציה בפיד (לחיצה / סנן / "+" / שליחת הודעה / עקיבה / דיווח) | ❌ (Overlay → Auth) | ✅ |
```

**L79**

```
| יצירת פוסט (3 רמות חשיפה)                 | ❌    | ✅ ("רק עוקבים שלי" זמין רק בפרופיל פרטי)     |
```

**L80**

```
| שליחת הודעת צ'אט                          | ❌    | ✅ (גם לבעלי פרופיל פרטי שאינם עוקבים)         |
```

**L81**

```
| עקיבה אחרי משתמש                          | ❌    | ✅ (מיידי בפומבי / בקשת אישור בפרטי)          |
```

**L82**

```
| אישור/דחיית בקשת עקיבה                    | ❌    | ✅ (רק כשהפרופיל שלי פרטי)                    |
```

**L83**

```
| הסרת עוקב קיים                            | ❌    | ✅                                            |
```

**L84**

```
| **שינוי מצב פרטיות פרופיל** (פומבי/פרטי)  | ❌    | ✅                                            |
```

**L85**

```
| דיווח על תוכן                             | ❌    | ✅                                            |
```

**L86**

```
| דיווח בעיה מהגדרות (צ'אט לאדמין)          | ❌    | ✅                                            |
```

**L87**

```
| חסימת משתמש                               | ❌    | ✅                                            |
```

**L88**

```
| עריכת פרופיל                              | ❌    | ✅                                            |
```

**L89**

```
| צפייה בסטטיסטיקות                         | ❌    | ✅ (אישיות + מדדי קהילה בסיסיים)              |
```

**L93**

```
### 2.4 הרשאות בתוך פוסט – בעלות וזרים
```

**L95**

```
מודל בעלות פשוט (לא צריך להוסיף מורכבות):
```

**L97**

```
* **בעל הפוסט** הוא היחיד שיכול:
```

**L98**

```
    * לערוך את הפוסט.
```

**L99**

```
    * למחוק את הפוסט.
```

**L100**

```
    * **לסמן "נמסר"** (סגירת הפוסט).
```

**L101**

```
* **משתמש אחר (זר)** יכול:
```

**L102**

```
    * לצפות בפוסט – **בכפוף לרמת חשיפת הפוסט ולמצב פרטיות הפרופיל של הבעל** (פומבי לכולם / רק עוקבים מאושרים / רק אני = רק לבעל).
```

**L103**

```
    * לשלוח הודעת צ'אט פרטית לבעל הפוסט.
```

**L104**

```
    * לדווח על הפוסט.
```

**L105**

```
    * להוסיף לעוקבים את בעל הפוסט – **מיידי בפומבי, בקשה הדורשת אישור בפרטי**.
```

**L107**

```
**אין מודל "אישור מקבל" פורמלי ב-MVP.** המסירה היא בין שני אנשים בצ'אט – הם מתאמים מתי איפה ואיך, ובעל הפוסט מסמן "נמסר" כשהעניין הסתיים. ראה [`07_Business_Rules.md`](./07_Business_Rules.md) ל-R-MVP-Items-3.
```

**L111**

```
### 2.5 מה **אין** ב-MVP מהיררכיית V2
```

**L113**

```
| תפקיד ב-V2          | סטטוס ב-MVP        | למה?                                    |
```

**L115**

```
| מתנדב (Volunteer)   | ❌ לא קיים          | אין ארגונים → אין שיוך → אין מתנדב       |
```

**L116**

```
| מתנדב בארגון        | ❌ לא קיים          | אין מבנה ארגוני                         |
```

**L117**

```
| עובד עמותה          | ❌ לא קיים          | אין עמותות                              |
```

**L118**

```
| מוקדן (Operator)    | ❌ לא קיים          | אין מנגנון אנונימיות → אין צורך במוקד   |
```

**L119**

```
| מנהל מוקדנים        | ❌ לא קיים          | תלוי במוקדן                             |
```

**L120**

```
| מנהל מתנדבים        | ❌ לא קיים          | תלוי במתנדבים                           |
```

**L121**

```
| מנהל ארגון (Org Admin) | ❌ לא קיים       | אין ארגונים                             |
```

**L122**

```
| Super Admin (UI ייעודי) | ❌ אין מסך נפרד | פעולות אדמין הן Extensions מותני-הרשאה ב-UI הקיים + כלים פנימיים מחוץ לאפליקציה |
```

**L123**

```
| משתמש מאומת + וי כחול | ❌ לא קיים          | מורכבות גבוהה (סריקת ת"ז) – לא חיוני ל-PMF |
```

**L125**

```
> **המשמעות הארכיטקטונית:** למרות שאין תפקידים אלה ב-UI, **מודל הנתונים ב-DB צריך לאפשר אותם בעתיד** ללא רה-אינדוקס מהותי. כלומר: שדה `role` ב-User צריך להיות enum מורחב, לא boolean.
```

**L129**

```
*הפרק הבא: [3. פיצ'רים ותהליכי ליבה](./03_Core_Features.md)*
```

**L130**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/03_Core_Features.md`

**L3**

```
## 📱 3. פיצ'רים ותהליכי ליבה (MVP)
```

**L5**

```
ה-MVP בנוי מ-**6 בלוקים פונקציונליים** בלבד:
```

**L7**

```
1. [אימות והרשמה](#31-אימות-והרשמה)
```

**L8**

```
2. [פרופיל אישי + עוקבים](#32-פרופיל-אישי--עוקבים)
```

**L9**

```
3. [מנגנון החפצים (הליבה)](#33-מנגנון-החפצים-הליבה)
```

**L10**

```
4. [צ'אט בסיסי](#34-צאט-בסיסי)
```

**L11**

```
5. [הגדרות בסיסיות](#35-הגדרות-בסיסיות)
```

**L12**

```
6. [סטטיסטיקות אישיות ומדדי קהילה בסיסיים](#36-סטטיסטיקות-אישיות)
```

**L16**

```
### 3.1 אימות והרשמה
```

**L18**

```
#### 3.1.1 אפשרויות התחברות
```

**L20**

```
ב-MVP מטרת האימות היא **חיכוך מינימלי** עם תחושת בטיחות סבירה. **שלוש שיטות ליבה** (Google / טלפון / מייל); **ב-iOS** מוצגת גם **כניסה עם Apple (Sign in with Apple)** לצד Google — חובה לפי App Store Guidelines כשקיים SSO צד שלישי. על המשתמש לבחור שיטה אחת:
```

**L22**

```
| שיטה                          | תהליך                                                                            | יתרון / הערה                                       |
```

**L24**

```
| **כניסה עם Google (SSO)**     | לחיצה אחת על "המשך עם Google" → אישור הרשאות → התחברות מיידית.                   | המהיר ביותר עבור משתמשי אנדרואיד / ווב / iOS.      |
```

**L25**

```
| **כניסה עם Apple (SSO)**      | לחיצה על "המשך עם Apple" → אישור Face ID / Touch ID או Apple ID → התחברות.       | **זמין ב-iOS בלבד** (חובה לצד Google בחנות).       |
```

**L26**

```
| **כניסה עם מספר טלפון (OTP)** | המשתמש מזין מספר → מקבל קוד OTP ב-SMS → מאמת.                                    | מתאים לכולם, ידידותי לישראל.                       |
```

**L27**

```
| **כניסה עם דוא"ל וסיסמה**     | המשתמש מזין מייל + סיסמה → אימות מייל בקישור → התחברות.                          | למי שמעדיף סיסמה.                                  |
```

**L29**

```
* **אין כניסה כאורח** מלאה – אבל מסך הנחיתה (1.1) חושף **CTA "צפה כאורח"** שמוביל ל-Guest Preview Feed (1.7) עם **3 פוסטים** במצב קריאה בלבד, עד שמופיע Overlay הצטרפות שמוביל ל-Auth (1.2). ראה 3.3.1.4.
```

**L30**

```
* **אין וי כחול ב-MVP.** כל משתמש שעבר אחת משיטות האימות המותרות בפלטפורמה הוא משתמש מלא, לכל דבר ועניין. ההבדלות בין משתמשים מוצעות לגרסה עתידית.
```

**L32**

```
#### 3.1.2 תהליך Onboarding ראשוני
```

**L34**

```
**3 מסכים בלבד**, כל אחד עם כפתור "דלג":
```

**L36**

```
1. **מסך 1 – פרטים בסיסיים:** שם מלא + עיר מגורים (תפריט נפתח של ערים בישראל).
```

**L37**

```
2. **מסך 2 – תמונת פרופיל:** העלאה אופציונלית. (אם דולגים → צללית ברירת מחדל עם אות ראשונה של השם).
```

**L38**

```
3. **מסך 3 – ברוכים הבאים:** הסבר קצר על איך זה עובד (3 שקופיות), ואז → פיד ראשי.
```

**L40**

```
**אין:**
```

**L41**

```
* ❌ העלאת ת"ז (אין וי כחול).
```

**L42**

```
* ❌ בחירת תחומי עניין (אין אלגוריתם פיד מורכב ב-MVP).
```

**L43**

```
* ❌ הסכמת תקנון מורכבת (אישור פעם אחת בהרשמה מספיק).
```

**L45**

```
#### 3.1.3 איפוס סיסמה
```

**L47**

```
* **שכחתי סיסמה (Email):** מייל עם קישור איפוס – זרימה סטנדרטית.
```

**L48**

```
* **OTP:** אין צורך – כל הכניסה היא OTP מלכתחילה.
```

**L49**

```
* **Google SSO / Apple SSO:** האימות נמצא אצל הספק – אין סיסמה לאיפוס באפליקציה.
```

**L51**

```
#### 3.1.3a הצגת "שינוי סיסמה" בהגדרות לפי שיטת הרשמה (יישור עם 5.1, P2 #28)
```

**L53**

```
* **משתמש שנרשם עם מייל + סיסמה:** שורת "שינוי סיסמה" בהגדרות → חשבון מוצגת ופעילה.
```

**L54**

```
* **משתמש שנרשם עם Google / Apple / OTP טלפון:** שורת "שינוי סיסמה" **לא מוצגת כלל** (לא Disabled, לא מוסבר). הסיבה: אין סיסמה במערכת לשנות. אם המשתמש מחפש "החלפת שיטת התחברות" – זה נדחה ל-V1.5+ (3.1.4).
```

**L56**

```
#### 3.1.4 חיבור כמה שיטות לאותו חשבון
```

**L57**

```
* **לא נתמך ב-MVP.** משתמש שנרשם עם Google או Apple אינו יכול להתחבר אחר כך עם דוא"ל באותו חשבון. שיטה אחת לחשבון = פשטות.
```

**L58**

```
* בעתיד (V1.5+) – נוסיף "חיבור חשבונות" בהגדרות.
```

**L62**

```
### 3.2 פרופיל אישי + עוקבים
```

**L64**

```
#### 3.2.1 מסך הפרופיל שלי
```

**L66**

```
**רכיבים** (ראה גם [`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md) – מסך 3.1 My Profile):
```

**L68**

```
* תמונת פרופיל + שם מלא + עיר.
```

**L69**

```
* ביוגרפיה קצרה (אופציונלית, עד 200 תווים).
```

**L70**

```
* **3 מספרים בולטים:**
```

**L71**

```
    * מספר עוקבים (`Followers`).
```

**L72**

```
    * מספר נעקבים (`Following`).
```

**L73**

```
    * **מספר פוסטים פעילים** – ספירת כל הפוסטים הפתוחים שלי, **כולל פוסט בקשה ופוסט הצעה** (שני הסוגים נספרים יחד באותו מונה).
```

**L74**

```
* **לשונית פוסטים פעילים** – כל הפוסטים שלי שעדיין פתוחים.
```

**L75**

```
* **לשונית פוסטים סגורים** – כל הפוסטים שסומנו "נמסר".
```

**L76**

```
* **כפתור "ערוך פרופיל"** – פותח מסך עריכה.
```

**L77**

```
* **כפתור "שתף פרופיל"** – יוצר קישור deep-link.
```

**L79**

```
#### 3.2.2 מסך פרופיל של משתמש אחר
```

**L81**

```
זהה לפרופיל אישי, אך:
```

**L83**

```
* במקום "ערוך פרופיל" → כפתור **"עקוב / מעקב פעיל / בקשה נשלחה ⏳"** – סטטוס דינמי לפי מצב פרטיות הפרופיל וסטטוס הבקשה (ראה 3.2.4).
```

**L84**

```
* כפתור נוסף **"שלח הודעה"** (פותח/ממשיך צ'אט פרטי) – זמין גם בפרופיל פרטי לזרים.
```

**L85**

```
* תפריט נקודות (⋮) עם: "דווח", "חסום משתמש".
```

**L86**

```
* **בפרופיל פומבי:** מוצגת לשונית "פוסטים פעילים" בלבד (ללא היסטוריה סגורה של אדם אחר – שיקול פרטיות).
```

**L87**

```
* **בפרופיל פרטי שאני לא עוקב מאושר אחריו:** במקום הלשוניות מוצגת מסגרת אחת: "🔒 *הפרופיל פרטי. שלח בקשת עקיבה כדי לראות פוסטים, עוקבים ונעקבים.*" המספרים (עוקבים / נעקבים / פוסטים פעילים *ציבוריים*) נשארים גלויים.
```

**L88**

```
* **בפרופיל פרטי שאני עוקב מאושר אחריו:** רואים את לשונית "פוסטים פעילים" כרגיל; פוסטים "רק עוקבים שלי" של הבעל נכללים. פוסטים "רק אני" של הבעל **אינם** מוצגים גם לעוקב מאושר.
```

**L90**

```
#### 3.2.3 מצב פרטיות הפרופיל (Profile Privacy Mode)
```

**L92**

```
לכל משתמש שני מצבי פרטיות לפרופיל. המצב נבחר ב**הגדרות → פרטיות** (ראה 3.5) וניתן לשנות בכל עת.
```

**L94**

```
| מצב                          | התנהגות עקיבה                                       | מי רואה את הפוסטים שלי?                  | ברירת מחדל |
```

**L96**

```
| 🌍 **פרופיל פומבי**          | מעקב מיידי, ללא אישור (Twitter-like).                | כל משתמש רשום (לפי רמת חשיפת הפוסט).     | ✅ כן       |
```

**L97**

```
| 🔒 **פרופיל פרטי**           | מעקב **דורש אישור** של בעל הפרופיל (Instagram-like). | רק עוקבים מאושרים (לפי רמת חשיפת הפוסט). | ❌          |
```

**L99**

```
##### מה רואים זרים על פרופיל פרטי?
```

**L100**

```
* **גלוי תמיד** (Discoverability minimal): תמונה, שם, עיר, ביוגרפיה, **מספרי** עוקבים/נעקבים/פוסטים פעילים. כך שמישהו אחר יכול לזהות את המשתמש ולהחליט אם להגיש בקשת עקיבה.
```

**L101**

```
* **מוסתר עד אישור:** רשימת הפוסטים הפעילים, רשימת הפוסטים הסגורים, רשימת העוקבים, רשימת הנעקבים. במקומם תוצג הודעה: "🔒 הפרופיל פרטי. שלח בקשת עקיבה כדי לראות את הפוסטים."
```

**L102**

```
* **שליחת הודעה (DM)** מותרת גם לזרים – מצב הפרטיות של הפרופיל משפיע **רק על עקיבה ועל גישה לפוסטים**, לא על צ'אט.
```

**L104**

```
##### החלפת מצב פרטיות
```

**L105**

```
* **פומבי → פרטי:** העוקבים הקיימים **נשארים** עוקבים (לא נדרש אישור חוזר). עקיבות חדשות יידרשו לאישור. תוצג תזכורת: "*X עוקבים קיימים יישארו. אם תרצה להסיר חלקם, פתח את רשימת העוקבים.*"
```

**L106**

```
* **פרטי → פומבי:** **כל בקשות העקיבה הממתינות מאושרות אוטומטית** (לא נשארים מבקשים תלויים). תוצג תזכורת: "*פוסטים שלך במצב 'רק עוקבים' יהיו גלויים לכל עוקב חדש (כעת ללא אישור). אם תרצה להגביל, מחק או שנה את הפוסטים לפני המעבר.*"
```

**L107**

```
* **שינוי המצב אינו משנה רטרואקטיבית** את רמת החשיפה של פוסטים שכבר פורסמו (ראה גם R-MVP-Privacy-9).
```

**L109**

```
##### הבהרת ההפרדה: מצב פרטיות פרופיל ↔ רמת חשיפת פוסט (יישור P2 #27)
```

**L110**

```
שני מנגנונים נפרדים שאינם מחליפים זה את זה:
```

**L112**

```
| היבט                                        | מצב פרטיות פרופיל (3.2.3)                  | רמת חשיפת פוסט (3.2.4 ו') |
```

**L114**

```
| על מי משפיע?                                | **משתמש** (אני)                            | **פוסט בודד**              |
```

**L115**

```
| מה נקבע?                                    | מי יכול לעקוב + מי רואה רשימות פוסטים פרטיים | מי רואה את הפוסט הספציפי   |
```

**L116**

```
| **השפעה רטרואקטיבית של שינוי על פוסטים קיימים?** | ❌ **לא** – פוסטים שכבר פורסמו לא משנים את רמת חשיפתם בעקבות שינוי מצב הפרופיל. | ✅ **רק להעלאה** – ניתן להעלות חשיפה של פוסט קיים (R-MVP-Privacy-9), אסור להוריד. |
```

**L117**

```
| נראות בפיד הציבורי                          | פרופיל פרטי = רשימות פוסטים נסתרות לזרים   | "🔒 רק אני" לא בפיד; "👥 עוקבים" רק לעוקבים מאושרים |
```

**L119**

```
> **דוגמה (יישור משפטי):** משתמש עם פרופיל פומבי שפרסם פוסט "פומבי" → ועובר לפרופיל פרטי → **הפוסט נשאר פומבי וגלוי לכל**, כי הוא פורסם בכוונה לציבור. **הורדת חשיפה אחרי פרסום אסורה** (R-MVP-Privacy-9). הפתרון היחיד אם המשתמש מתחרט: **מחיקת הפוסט ויצירתו מחדש** ברמת חשיפה נמוכה יותר.
```

**L121**

```
#### 3.2.4 מנגנון עקיבה (Follow)
```

**L123**

```
##### א. עקיבה אחרי פרופיל פומבי
```

**L124**

```
* לחיצה על "**עקוב**" → מעקב מיידי, ללא אישור.
```

**L125**

```
* הכפתור הופך ל"מעקב פעיל ✓".
```

**L126**

```
* בעל הפרופיל מקבל התראה: "*[שם] התחיל לעקוב אחריך.*"
```

**L128**

```
##### ב. עקיבה אחרי פרופיל פרטי
```

**L129**

```
* לחיצה על "**עקוב**" → "**שלח בקשת עקיבה**".
```

**L130**

```
* הכפתור הופך ל"בקשה נשלחה ⏳" עד החלטת בעל הפרופיל.
```

**L131**

```
* בעל הפרופיל מקבל התראה: "*[שם] רוצה לעקוב אחריך.*" עם פעולות מהירות "אשר" / "דחה".
```

**L132**

```
* כל הבקשות הממתינות נגישות גם דרך **הגדרות → פרטיות → בקשות עקיבה**.
```

**L133**

```
* פעולות:
```

**L134**

```
    * **אישור:** המבקש הופך לעוקב מאושר; מקבל התראה: "*[שם] אישר את בקשתך.*"
```

**L135**

```
    * **דחייה:** הבקשה נמחקת בשקט; המבקש לא מקבל התראה (מדיניות פרטיות, למניעת הטרדה ולחץ חברתי). הוא יכול לשלוח בקשה חדשה לאחר **14 יום** (Cooldown).
```

**L136**

```
* **ביטול בקשה ע"י המבקש:** המבקש יכול לבטל בקשה ממתינה דרך מסך הפרופיל של היעד (כפתור "בטל בקשה").
```

**L138**

```
##### ג. הסרת עוקב
```

**L139**

```
* בעל הפרופיל יכול להסיר עוקב קיים בכל עת מתוך **מסך עוקבים → "⋮" ליד שורת העוקב → "הסר עוקב"**.
```

**L140**

```
* האדם המוסר **לא מקבל התראה**, אך לא יראה יותר פוסטים "עוקבים בלבד" של הבעל.
```

**L141**

```
* הוא יכול לעקוב מחדש: מיידית אם הפרופיל פומבי, או דרך בקשת עקיבה אם הפרופיל פרטי.
```

**L143**

```
##### ד. רשימות עוקבים/נעקבים – נראות
```

**L144**

```
* **בפרופיל שלי:** תמיד גלויות לי (גם אם פרטי).
```

**L145**

```
* **בפרופיל אחר פומבי:** גלויות לכל משתמש רשום.
```

**L146**

```
* **בפרופיל אחר פרטי:** גלויות רק לעוקבים מאושרים. לזרים מוצג רק המספר.
```

**L148**

```
##### ה. השפעת העקיבה על המוצר
```

**L150**

```
* **מחוץ ל-MVP:** בוסט קל בפיד לפוסטים של נעקבים, תג "👥 ממשתמש שאתה עוקב", ופילטר סינון "רק ממשתמשים שאני עוקב" במודל הסינון – **לא** נכללים ב-MVP (אפשר ל-V2).
```

**L151**

```
* **בתוך ה-MVP:** העקיבה רלוונטית ל**מצב חשיפת הפוסט** (פומבי מול רק עוקבים של המפרסם), למסכי עוקבים/נעקבים ולכפתורי עקיבה בפרופיל ובפרטי פוסט.
```

**L153**

```
##### ו. רמת חשיפה של פוסט – 3 רמות
```

**L155**

```
**בעל פוסט בוחר את רמת החשיפה** מתוך 3 רמות. הזמינות תלויה במצב פרטיות הפרופיל:
```

**L157**

```
| רמת חשיפה                  | מי רואה?                                                     | זמין בפרופיל פומבי? | זמין בפרופיל פרטי? | ברירת מחדל |
```

**L159**

```
| 🌍 **פומבי**               | כל משתמש רשום באפליקציה.                                     | ✅                  | ✅                 | ✅ (פומבי)  |
```

**L160**

```
| 👥 **רק עוקבים שלי**       | רק עוקבים מאושרים של המפרסם.                                  | ❌ (Disabled)       | ✅                 | ❌          |
```

**L161**

```
| 🔒 **רק אני (פרטי)**       | רק המפרסם. לא נראה לאף אחד אחר. נשמר בפרופיל בתג מיוחד.       | ✅                  | ✅                 | ❌          |
```

**L163**

```
* הבחירה נעשית בעת יצירת הפוסט (ראה 3.3.3).
```

**L164**

```
* **למה "רק עוקבים שלי" מותנה במצב פרופיל פרטי?** במצב פומבי כל אחד יכול לעקוב מיד ללא אישור – ולכן פוסט "רק עוקבים" אינו מספק שום הגנה אמיתית. בפרופיל פרטי הבעל מאשר ידנית כל עוקב, ולכן הקבוצה משמעותית.
```

**L165**

```
* **רמת "רק אני" שימושית** למשל: שמירה זמנית של פוסט מהפיד מבלי למחוק (כדי לא לאבד תמונות/טקסט), או הכנת פוסט בשלבים. **לא תחליף לטיוטה** (טיוטה היא לפני פרסום; "רק אני" היא אחרי פרסום).
```

**L166**

```
* **אחרי פרסום, ניתן רק להעלות חשיפה**, לא להוריד. עיקרון פרטיות: מי שכבר ראה לא ייעלם לו. המעברים המותרים:
```

**L167**

```
    * רק אני → רק עוקבים (אם הפרופיל פרטי) → פומבי
```

**L168**

```
    * רק אני → פומבי
```

**L169**

```
    * רק עוקבים → פומבי
```

**L170**

```
    * **אסור:** פומבי → כל דבר אחר. עוקבים → רק אני.
```

**L171**

```
* **תגיות בפיד / בפרופיל:**
```

**L172**

```
    * פוסט "עוקבים בלבד" → תג "👥 לעוקבים בלבד" (גלוי לבעל ולעוקבים).
```

**L173**

```
    * פוסט "רק אני" → תג "🔒 פרטי – רק אני" (גלוי רק לבעל בלשונית הפוסטים שלו, לא נראה בפיד הראשי כלל ולא במונה הציבורי).
```

**L174**

```
* **חישוב מונה "פוסטים פעילים":** פוסטים "רק אני" **נספרים** במונה הפנימי של הבעל אבל **לא** במונה הציבורי – כדי לא לחשוף לזרים שיש למשתמש "פוסטים נסתרים". המונה מפוצל לפנימי (לי) וציבורי (לאחרים).
```

**L176**

```
#### 3.2.5 עריכת פרופיל
```

**L178**

```
* שינוי תמונה.
```

**L179**

```
* שינוי שם.
```

**L180**

```
* שינוי עיר.
```

**L181**

```
* שינוי ביוגרפיה.
```

**L182**

```
* **לא ניתן** לשנות מספר טלפון / מייל ב-MVP – יחייב התקשרות לתמיכה. (פשטות).
```

**L183**

```
* **שינוי מצב פרטיות (פומבי/פרטי)** נמצא ב-**הגדרות → פרטיות** ולא במסך עריכת פרופיל (כדי להפריד "מטא-נתונים" מ"הגדרות חשבון"). ראה 3.5.
```

**L187**

```
### 3.3 מנגנון החפצים (הליבה)
```

**L189**

```
זהו ה-**עיקר של ה-MVP**. כל פיצ'ר אחר משרת אותו.
```

**L191**

```
#### 3.3.1 הפיד הראשי (Home)
```

**L193**

```
##### 3.3.1.1 כללי
```

**L194**

```
* **מציג:** **כל** הפוסטים הפומביים, בסדר **כרונולוגי הפוך** (החדשים למעלה). **אין** עדיפות מיון לפי עקיבה ב-MVP.
```

**L195**

```
* **ב-MVP אין אלגוריתם פיד מורכב מותאם אישית** – פשטות וסדר כרונולוגי אחיד.
```

**L196**

```
* **לא מציג פוסטים סגורים כברירת מחדל.** המשתמש יכול להפעיל סינון "כולל סגורים" כדי לדפדף בהיסטוריית מסירות הקהילה (ראה 3.3.2).
```

**L198**

```
##### 3.3.1.2 מה כל פוסט בפיד מציג
```

**L200**

```
> **פריסה:** הפיד מציג **2 פוסטים בשורה** (Grid Layout). כל כרטיס הוא גרסה קומפקטית עם תמונה/אייקון בחלק העליון, תג סוג, כותרת, שם מפרסם ומיקום.
```

**L202**

```
| רכיב                          | תמיד? | הערות                                                        |
```

**L204**

```
| תמונה ראשית / אייקון קטגוריה  | ✅     | אם אין תמונה (במצב "לבקש") → אייקון ברירת מחדל לקטגוריה       |
```

**L205**

```
| תג מצב 🎁 לתת / 🔍 לבקש        | ✅     | בולט וויזואלי                                                 |
```

**L206**

```
| כותרת קצרה                    | ✅     | עד 80 תווים                                                   |
```

**L207**

```
| תיאור קצוץ                    | ✅     | 2 שורות + "המשך לקרוא"                                       |
```

**L208**

```
| שם המפרסם + תמונה             | ✅     |                                                              |
```

**L209**

```
| **עיר + רחוב** (לא מספר)      | ✅     | ברירת מחדל. לחיצה → פרטי פוסט עם מיקום מלא לפי בחירת בעל הפוסט |
```

**L210**

```
| תג "👥 לעוקבים בלבד"          | רק אם רלוונטי | לפוסטים שלי אני רואה את התג גם בפיד שלי                |
```

**L211**

```
| תג "🔒 סגור – נמסר"            | רק אם רלוונטי | רק אם פילטר "כולל סגורים" פעיל                                |
```

**L212**

```
| זמן פרסום                     | ✅     | "כעת", "לפני 5 דקות", "אתמול" וכו'                            |
```

**L213**

```
| אייקון מהיר 💬 שלח הודעה       | ✅     | רק לפוסט של אדם אחר                                           |
```

**L215**

```
##### 3.3.1.3 שמירת חיפוש וסינון אחרון
```

**L216**

```
* **כל סינון/חיפוש שהמשתמש מפעיל נשמר אוטומטית.** בכניסה הבאה לאפליקציה (גם אחרי סגירה מלאה) – הפיד מציג את הסינון האחרון.
```

**L217**

```
* בראש הפיד מוצג **חיווי** "X סננים פעילים" + "נקה הכל" אם יש סנן פעיל.
```

**L218**

```
* רק כשהמשתמש לוחץ "נקה הכל" או משנה את הסינונים – מתעדכן הפיד.
```

**L220**

```
##### 3.3.1.4 חוויית אורח (Guest Preview)
```

**L221**

```
* אורח שלא נרשם רואה את **3 הפוסטים העדכניים ביותר** בפיד (Guest Preview Feed, מסך 1.7).
```

**L222**

```
* מתחת לפוסט השלישי → **Overlay מעודן** (לא חוסם את 3 הפוסטים אלא נמצא תחתם): "הצטרף לקהילה כדי לראות עוד 50+ פוסטים פעילים באזור שלך".
```

**L223**

```
* **כפתור ההצטרפות מוביל למסך Auth (1.2)** – לא ל-Splash (יישור P2 #18 עם זרימה 1.1 ב-04 ועם 6.6.1 ב-06).
```

**L224**

```
* אורח **אינו יכול** ללחוץ על פוסט / לפתוח פרופיל / לשלוח הודעה / לסנן / לעקוב / לדווח / להשתמש ב-"+". כל ניסיון אינטראקציה כזה מציג Overlay זהה ומוביל ל-Auth (1.2).
```

**L226**

```
#### 3.3.2 חיפוש, סינון ומיון
```

**L228**

```
**שורת חיפוש חופשי** בראש הפיד – מחפשת בכותרת, תיאור, קטגוריה ושם המשתמש.
```

**L230**

```
**כפתור "סננים"** פותח מודל עם האפשרויות:
```

**L232**

```
| סוג סינון              | אפשרויות                                                                            |
```

**L234**

```
| **סוג פוסט**           | הכל / רק נותנים / רק מבקשים                                                          |
```

**L235**

```
| **קטגוריה**            | רהיטים, בגדים, ספרים, משחקים, ציוד תינוקות, מטבח, ספורט, חשמל, כלי עבודה, אחר        |
```

**L236**

```
| **מצב חפץ** (לנותנים)  | חדש / כמו חדש / טוב / בינוני                                                         |
```

**L237**

```
| **עיר**                | תפריט נפתח / "כל הערים"                                                              |
```

**L238**

```
| **כולל פוסטים סגורים** | Toggle (ברירת מחדל: כבוי). כשמופעל – פוסטים שנמסרו מוצגים בפיד עם תג "🔒 נמסר".      |
```

**L239**

```
| **מיון**               | החדש ביותר / קרוב אליי גיאוגרפית (לפי עיר רשומה)                                      |
```

**L241**

```
* כל הסננים מצטברים (כל הסינונים פעילים יחד).
```

**L242**

```
* כפתור "נקה סינון" מאפס.
```

**L243**

```
* **כל הסננים נשמרים אוטומטית** עד שהמשתמש משנה אותם או לוחץ "נקה הכל" (ראה 3.3.1.3).
```

**L245**

```
> **הערה:** "קרוב גיאוגרפית" ב-MVP מבוסס **על שם העיר בלבד** (לא על geocoding מדויק).
```

**L247**

```
#### 3.3.3 יצירת פוסט (Plus Button)
```

**L249**

```
הכפתור **"+"** בניווט התחתון פותח מסך **יצירת פוסט**. **טופס אחיד** עם **טוגל** בראש המסך:
```

**L251**

```
> **🎁 לתת חפץ ←→ 🔍 לבקש חפץ**
```

**L253**

```
הטוגל מחליף בין שני המצבים. רוב השדות זהים, אך תמונה ושדות מסוימים שונים בכל מצב.
```

**L255**

```
##### א. שדות חובה
```

**L257**

```
| מצב         | שדות חובה                                                                                                    |
```

**L259**

```
| 🎁 **לתת**  | כותרת (עד 80 תווים) + **תמונת חפץ אחת לפחות** + **כתובת מלאה** (עיר + רחוב + מספר)                            |
```

**L260**

```
| 🔍 **לבקש** | כותרת (עד 80 תווים) + **כתובת מלאה** (עיר + רחוב + מספר)                                                      |
```

**L262**

```
> **הבהרה (יישור P0 #5 ו-P2 #22 בנושא איסוף ↔ הצגה):** **כתובת מלאה נאספת בכל פוסט**, אבל **רמת ההצגה שלה לציבור נבחרת ע"י המפרסם** (Radio נפרד, ראה ב'). איסוף הכתובת המלאה נדרש למקרים בהם המפרסם בוחר להציג כתובת מלאה (לתיאום אישוף), ולמקרים בהם הוא משנה את הבחירה אחר כך. **אין איסוף או שמירת קואורדינטות GPS** ב-MVP (R-MVP-Safety-4).
```

**L264**

```
##### ב. שדות רשות (לשני המצבים)
```

**L265**

```
* **תיאור** (עד 500 תווים – יכול לכלול גיל הפריט, סיבה, מצב).
```

**L266**

```
* **קטגוריה** (תפריט נפתח – 10 קטגוריות; ברירת מחדל: "אחר"; ראה רשימה ב-3.3.2).
```

**L267**

```
* **רמת חשיפת המיקום בפיד / פוסט פתוח לציבור** (Radio):
```

**L268**

```
    * 🏙️ **עיר בלבד** – הציבור רואה רק את העיר.
```

**L269**

```
    * 🗺️ **עיר + רחוב** *(ברירת מחדל)* – הציבור רואה עיר + שם רחוב, ללא מספר.
```

**L270**

```
    * 📍 **כתובת מלאה** – הציבור רואה את הכל (עיר, רחוב, מספר).
```

**L271**

```
* **רמת חשיפת הפוסט** (Radio – 3 רמות; ראה 3.2.4 ו'):
```

**L272**

```
    * 🌍 **פומבי** *(ברירת מחדל)* – כל משתמש רשום רואה.
```

**L273**

```
    * 👥 **רק עוקבים שלי** – רק עוקבים מאושרים רואים. **זמין רק אם הפרופיל פרטי**; בפרופיל פומבי האפשרות מוצגת מנוטרלת (Disabled) עם הסבר קצר: "*זמין כשפרופיל פרטי. לכניסה: הגדרות → פרטיות.*"
```

**L274**

```
    * 🔒 **רק אני (פרטי)** – נשמר רק אצלי, לא נראה בפיד ולא לאף משתמש אחר. שימושי להסתרה זמנית של פוסט מבלי למחוק את התוכן.
```

**L276**

```
##### ג. שדות רשות נוספים – מצב "🎁 לתת"
```

**L277**

```
* **תמונות נוספות** – עד 5 תמונות סה"כ (תמונה ראשונה היא שדה חובה; ראה א').
```

**L278**

```
* **מצב החפץ** (Radio: חדש / כמו חדש / טוב / בינוני).
```

**L280**

```
##### ד. שדות רשות נוספים – מצב "🔍 לבקש"
```

**L281**

```
* **תמונה** (אופציונלי, עד 5). אם לא מועלית תמונה, הפיד יציג **אייקון ברירת מחדל לפי קטגוריה** (אייקון של מקרר, ספה, ספר וכו').
```

**L282**

```
* **דחיפות** (טקסט חופשי קצר). למשל: "צריך עד שישי".
```

**L284**

```
##### ה. סדר הזרימה לאחר לחיצה על "פרסם" (יישור P1 #12)
```

**L286**

```
> **State machine מאוחד** עבור הפיד והפלואו (4):
```

**L288**

```
1. **אם רמת חשיפה = "🌍 פומבי":** אין דיאלוג ביניים. הפוסט נוצר → התראת אישור: "✅ הפוסט שלך פורסם!" → חזרה לפיד.
```

**L289**

```
2. **אם רמת חשיפה = "👥 רק עוקבים שלי":** מוצג **דיאלוג ביניים לפני יצירה**: *"הפוסט יוצג רק ל-X עוקבים מאושרים שלך. רוצה לפרסם לכולם?"* כפתורים: **"עוקבים בלבד"** (ראשי) / **"פרסם לכולם"** (משני, מעלה את החשיפה לפומבי). אחרי בחירה → יצירה → התראת אישור.
```

**L290**

```
3. **אם רמת חשיפה = "🔒 רק אני (פרטי)":** מוצג **דיאלוג ביניים לפני יצירה**: *"הפוסט יישמר רק בלשונית הפוסטים שלך. אף משתמש אחר לא יראה אותו. ניתן לעדכן רמת חשיפה אחר כך (רק להעלאה)."* כפתורים: **"שמור פרטי"** (ראשי) / **"ביטול"** (משני). אחרי "שמור פרטי" → יצירה → התראת אישור: "✅ הפוסט נשמר אצלך פרטית".
```

**L292**

```
> **סטנדרטיזציה של תוויות (יישור P3 #33):** הכפתור הראשי בדיאלוג של "👥 רק עוקבים שלי" הוא **"עוקבים בלבד"** (לא "פרסם רק לעוקבים"). בשאר המסמכים (04, 05) ייעשה שימוש באותה תווית.
```

**L294**

```
##### ו. שמירת טיוטה אוטומטית
```

**L295**

```
* אם המשתמש סוגר את האפליקציה / יוצא מהמסך לפני פרסום → הטופס נשמר **לוקאלית** במכשיר.
```

**L296**

```
* בכניסה הבאה למסך יצירת פוסט → תזכורת: "יש לך טיוטה שלא פורסמה. להמשיך לערוך / להתחיל מחדש?"
```

**L297**

```
* הטיוטה נמחקת אחרי פרסום מוצלח / מחיקה ידנית.
```

**L299**

```
#### 3.3.4 פרטי פוסט (Post Detail)
```

**L301**

```
לחיצה על פוסט בפיד פותחת **מסך פרטי פוסט**:
```

**L303**

```
* כל התמונות בגלריה (Carousel) – או אייקון קטגוריה גדול אם זו בקשה ללא תמונה.
```

**L304**

```
* פרטים מלאים: כותרת, תיאור, קטגוריה, מצב חפץ (אם לתת), דחיפות (אם לבקש).
```

**L305**

```
* **מיקום מוצג לפי בחירת המפרסם** (3.3.3 ה-Radio "רמת חשיפת המיקום"). **המיקום המלא מוצג בפרטי פוסט גם אם בפיד מוצג רק חלק** – זאת על מנת לאפשר תיאום (אם המפרסם בחר זאת).
```

**L306**

```
* תגיות: "🌍 פומבי" / "👥 לעוקבים בלבד" / "🔒 פרטי – רק אני" (האחרון רק לבעל הפוסט).
```

**L307**

```
* כפתור **"💬 שלח הודעה למפרסם"** – פותח צ'אט פרטי עם הודעה אוטומטית: "היי! ראיתי את הפוסט שלך על [כותרת]. מעוניין/ת לדעת עוד."
```

**L308**

```
* כפתור **"עקוב אחרי המפרסם" / "שלח בקשת עקיבה"** – לפי מצב פרטיות הפרופיל של המפרסם (אם לא עוקב כבר).
```

**L309**

```
* תפריט נקודות (⋮): "דווח", "חסום משתמש".
```

**L311**

```
#### 3.3.5 ניהול פוסטים שלי
```

**L313**

```
##### עיצוב כרטיס הפוסט – מינימלי
```

**L315**

```
פוסטים בפרופיל מוצגים ב**רשת של 3 פוסטים בשורה**. כל כרטיס מציג **תמונה/אייקון ריבועי + תג סוג overlay + כותרת קצוצה**. כל שאר הפעולות נגישות דרך **תפריט ⋮ (שלוש נקודות) בפינה העליונה** של הכרטיס. אין כפתורי פעולה גלויים על הכרטיס עצמו.
```

**L317**

```
##### לשונית "פוסטים פעילים"
```

**L319**

```
* הלשונית כוללת את כל הפוסטים שלי הפתוחים – פומבי, רק עוקבים, ופרטי (רק אני). פוסטים פרטיים מסומנים בתג "🔒 פרטי – רק אני" וגלויים רק לי.
```

**L320**

```
* לחיצה על ⋮ בפינת הכרטיס פותחת תפריט עם הפעולות הבאות:
```

**L321**

```
    * **"סמן כ-נמסר"** – פותח את זרימת הסגירה (3.3.6).
```

**L322**

```
    * **"ערוך"** – חזרה לטופס יצירת פוסט (כולל אפשרות שינוי רמת חשיפה – **רק העלאה**: רק אני → רק עוקבים → פומבי. ראה 3.2.4 ו').
```

**L323**

```
    * **"מחק"** – מחיקה מוחלטת (עם אישור).
```

**L325**

```
##### לשונית "פוסטים סגורים" (פוסטים שנמסרו)
```

**L327**

```
* כל כרטיס מציג תמונה/אייקון + כותרת + תג סטטוס: 🔒 נמסר ל-[שם מקבל אם סומן] / 🔒 נמסר (ללא סימון מקבל) – אבל **פוסטים בלי סימון מקבל נמחקים לחלוטין** (ראה 3.3.6).
```

**L328**

```
* לחיצה על ⋮ בפינת הכרטיס פותחת תפריט עם:
```

**L329**

```
    * **"📤 פתח מחדש"** – משחזר את הפוסט לסטטוס פעיל. שימושי במקרה שהמקבל לא הגיע לאסוף בסופו של דבר.
```

**L330**

```
* **אין** אפשרות "מחק" בפוסט סגור (היסטוריה נשמרת).
```

**L332**

```
#### 3.3.6 סגירת פוסט – המנגנון המלא
```

**L334**

```
> **חשוב:** הפוסט נסגר רק **אחרי שהחפץ נמסר בפועל**, לא לאחר תיאום או "שידוך". שידוכים שלא הסתיימו במסירה אינם סוגרים את הפוסט.
```

**L336**

```
##### א. תהליך הסגירה
```

**L338**

```
לחיצה על "סמן כ-נמסר" פותחת **דיאלוג רב-שלבי**:
```

**L340**

```
**שלב 1 – אישור עיקרי:**
```

**L341**

```
> *"האם החפץ נמסר בפועל? סגירת הפוסט תוציא אותו מהפיד."*
```

**L342**

```
* כפתורים: "כן, נמסר" | "ביטול".
```

**L343**

```
* אם המקבל לא בא בסוף – אל תסגור. ברגע שתסגור – הפוסט נמחק/יסומן כסגור.
```

**L345**

```
**שלב 2 – בחירת מקבל (אופציונלי):**
```

**L346**

```
> *"האם תרצה לסמן מי קיבל את החפץ? זה יעזור לחישוב הסטטיסטיקות שלכם ויאפשר לאדם שקיבל לראות את התרומה בפרופיל שלו."*
```

**L347**

```
* רשימה של **כל המשתמשים שיצרו שיחה איתי** על הפוסט (Picker עם תמונה + שם).
```

**L348**

```
* אופציה: **"לא לסמן אף אחד"**.
```

**L349**

```
* כפתורי פעולה: "סמן וסגור" | "סגור ללא סימון".
```

**L351**

```
**שלב 3 – הסבר על מה שיקרה (חד-פעמי):**
```

**L352**

```
* **אם נסגר עם סימון מקבל:**
```

**L353**

```
    * הפוסט עובר לסטטוס `closed_delivered`.
```

**L354**

```
    * הפוסט **נשמר** בלשונית "פוסטים סגורים" של הבעל ושל המקבל.
```

**L355**

```
    * הסטטיסטיקות מתעדכנות לשני הצדדים.
```

**L356**

```
    * המקבל מקבל התראה: "[שם הבעל] סימן אותך כמקבל של [כותרת הפוסט]. תודה שאתה משתמש בקהילה!"
```

**L357**

```
* **אם נסגר ללא סימון מקבל:**
```

**L358**

```
    * הפוסט **נמחק לחלוטין** מהמערכת אחרי 7 ימים.
```

**L359**

```
    * הסיבה: בלי תיוג מקבל, אין ערך לשמור אותו (אין רטרוספקטיבה ולא ספירה אמיתית).
```

**L360**

```
    * הסטטיסטיקה של "חפצים שמסרתי" כן מתעדכנת אצל הבעל.
```

**L362**

```
**שלב 4 – הצגה חד-פעמית של הסבר על המנגנון** (עם אופציה "אל תציג שוב"):
```

**L363**

```
> *"💡 איך עובד מנגנון הסגירה אצלנו: פוסט שתסמן את המקבל שלו יישמר תמיד; פוסט שלא תסמן בו מקבל יימחק אחרי 7 ימים. בכל מקרה, הסטטיסטיקה האישית שלך מתעדכנת."*
```

**L364**

```
* Toggle "אל תציג לי שוב את ההסבר הזה". הפעלה תוודא שלא יוצג בעתיד.
```

**L366**

```
##### ב. פתיחה מחדש של פוסט (Reopen)
```

**L368**

```
* **חלונות זמן (יישור P1 #14):**
```

**L369**

```
    * `closed_delivered` → ניתן ל-Reopen **ללא הגבלת זמן**.
```

**L370**

```
    * `deleted_no_recipient` → ניתן ל-Reopen **רק במהלך 7 הימים שמאז הסגירה**. אחרי 7 ימים הפוסט נמחק לצמיתות וצריך ליצור פוסט חדש.
```

**L371**

```
    * `expired` → ניתן ל-Reopen **ללא הגבלת זמן**, מאריך פעילות ב-300 ימים (P2 #24).
```

**L372**

```
    * `removed_admin` → **לא ניתן** ל-Reopen ע"י המשתמש; רק הסופר אדמין יכול לשחזר.
```

**L373**

```
* לחיצה על "📤 פתח מחדש" → אישור: "*האם לפתוח מחדש את הפוסט? הוא יחזור לפיד.*"
```

**L374**

```
* לאחר אישור:
```

**L375**

```
    * סטטוס הפוסט חוזר ל-`open`.
```

**L376**

```
    * הוא חוזר לפיד הראשי.
```

**L377**

```
    * אם הוא נסגר עם סימון מקבל – המקבל מקבל התראה: "[שם הבעל] פתח מחדש את הפוסט. הסימון שלך הוסר."
```

**L378**

```
    * הסטטיסטיקות מתעדכנות בהתאם (החיסור החזרה).
```

**L379**

```
* **אין הגבלת מספר פתיחות מחדש** ב-MVP, אך אם פוסט נפתח-נסגר 5+ פעמים → הוא מסומן כ-Suspect ועובר לבדיקת אדמין.
```

**L381**

```
##### ג. החלטה: למה לא סטטוס "Reserved" ב-MVP?
```

**L383**

```
> **המנגנון של פתיחה מחדש פותר את אותה בעיה בעלות מוצרית נמוכה יותר.**
```

**L385**

```
##### ד. סיכום סטטוסים של פוסט
```

**L387**

```
| סטטוס                    | תיאור                                                                            | מופיע בפיד?               | ניתן Reopen? | ניתן Edit? | ניתן Delete? | חלון זמן                  |
```

**L389**

```
| `open`                   | פוסט פעיל                                                                         | ✅                         | – (לא רלוונטי) | ✅          | ✅            | עד 300 ימים                |
```

**L390**

```
| `closed_delivered`       | פוסט שנסגר עם סימון מקבל                                                          | רק עם פילטר "כולל סגורים" | ✅ ללא הגבלת זמן | ❌          | ❌ (היסטוריה נשמרת) | לצמיתות                   |
```

**L391**

```
| `deleted_no_recipient`   | פוסט שנסגר ללא סימון מקבל                                                         | ❌                         | ✅ **רק במהלך 7 ימים מהסגירה** (יישור P1 #14) | ❌ | ✅ (מחיקה מיידית סופית) | 7 ימים → מחיקה לצמיתות |
```

**L392**

```
| `expired`                | פוסט שעבר 300 ימים בלי פעילות (ראה [`R-MVP-Items-5`](./07_Business_Rules.md))     | ❌                         | ✅ (חוזר ל-`open` עם 300 ימים חדשים) | ✅ (כדי לרענן ולחזור) | ✅ (מחיקה ידנית) | נשמר בלשונית "פוסטים סגורים" של הבעל לצמיתות עד מחיקה ידנית |
```

**L393**

```
| `removed_admin`          | פוסט שהוסר על-ידי 3 דיווחים אוטומטיים או החלטת אדמין                              | ❌                         | ❌ (רק שחזור ע"י סופר אדמין) | ❌ | ❌            | עד שחזור / לצמיתות         |
```

**L395**

```
> **חלון Reopen של `deleted_no_recipient` (פתרון P1 #14):** "**בכל עת**" שהוזכר בעבר התייחס לחלון של 7 ימים בלבד – אחרי 7 ימים הפוסט נמחק לצמיתות מה-DB. **אם המשתמש רוצה Reopen אחרי 7 ימים – יצירת פוסט חדש בלבד**.
```

**L397**

```
> **`expired` (פתרון P2 #24):** פוסט שפג תוקפו נשמר בלשונית "פוסטים סגורים" של הבעל עם תג "⏰ פג תוקף". הבעל יכול לבצע: **(1) Reopen** – הפוסט חוזר ל-`open` ומונה ימי הפעילות מתחיל מחדש (300 ימים נוספים). **(2) Edit + Reopen** – לעדכן ולחדש. **(3) Delete** – מחיקה ידנית סופית. הסטטוס `expired` **לא** מופיע בפילטר "כולל סגורים" של הפיד (זה רק עבור `closed_delivered`).
```

**L401**

```
### 3.4 צ'אט בסיסי
```

**L403**

```
#### 3.4.1 סוגי שיחות
```

**L404**

```
**רק סוג אחד:** שיחה פרטית 1-על-1 בין שני משתמשים רשומים.
```

**L406**

```
#### 3.4.2 רשימת שיחות (Inbox)
```

**L408**

```
* רשימת כל השיחות הפעילות, ממוינת לפי הודעה אחרונה (החדשה למעלה).
```

**L409**

```
* כל פריט מציג: תמונה + שם של השני, הודעה אחרונה (preview), זמן, חיווי "לא נקרא".
```

**L410**

```
* חיפוש משתמש שיחה לפי שם.
```

**L412**

```
#### 3.4.3 מסך שיחה
```

**L414**

```
* בועות הודעות (משלי בצד אחד, של השני בצד שני).
```

**L415**

```
* תיבת הקלדה + כפתור שליחה.
```

**L416**

```
* **רק טקסט ב-MVP.** אין שליחת תמונות / קולי / וידאו / מיקום.
```

**L417**

```
* חיווי "נקרא" (✓✓).
```

**L418**

```
* כפתור התקשרות / וידאו: **לא ב-MVP**.
```

**L419**

```
* תפריט (⋮): "צפייה בפרופיל", "חסום משתמש", "דווח על השיחה" (יישור עם 5.2 §4.2).
```

**L421**

```
#### 3.4.4 פתיחת שיחה
```

**L422**

```
שיחה נפתחת מ-3 מקומות:
```

**L424**

```
1. כפתור **"שלח הודעה"** במסך פרטי פוסט.
```

**L425**

```
2. כפתור **"שלח הודעה"** במסך פרופיל משתמש אחר.
```

**L426**

```
3. **"דווח על בעיה"** במסך הגדרות → נפתחת שיחה **1:1 עם חשבון הסופר אדמין** (`karmacommunity2.0@gmail.com`): אם אין עדיין שיחה בין המשתמשים – נוצרת שיחה חדשה; אם כבר קיימת – **אותה שיחה** מתעדכנת (הודעת מערכת + מעבר למסך השיחה).
```

**L428**

```
> **אין יצירת שיחה אקראית** ממסך מנותק (כמו "צ'אט חדש" חופשי). הצ'אט נצמד להקשר (**פוסט / פרופיל / תמיכה מההגדרות** בלבד).
```

**L430**

```
#### 3.4.5 הודעה אוטומטית להקשר
```

**L432**

```
כשפותחים שיחה דרך פוסט – ההודעה הראשונה מוקלדת אוטומטית כברירת מחדל:
```

**L434**

```
> "היי! ראיתי את הפוסט שלך על *[כותרת הפוסט]*. מעוניין/ת לדעת עוד."
```

**L436**

```
המשתמש יכול לערוך אותה לפני שליחה. זה מקצר זמן ומורכבות.
```

**L440**

```
### 3.5 הגדרות בסיסיות
```

**L442**

```
מסך הגדרות עם הסעיפים הבאים:
```

**L444**

```
| סעיף                | תוכן                                                            |
```

**L446**

```
| **חשבון**           | שורת "פרטי חשבון" שמובילה למסך עריכת פרופיל (שם, עיר, ביוגרפיה) |
```

**L447**

```
| **התראות**          | טוגל יחיד: התראות מופעלות / כבויות (כל הסוגים יחד)               |
```

**L448**

```
| **פרטיות**          | (1) **מצב פרופיל** – Toggle "🔒 פרופיל פרטי" (ברירת מחדל: כבוי = פומבי). שינוי מציג מודל אישור עם הסברים (ראה 3.2.3 "החלפת מצב פרטיות"). (2) **בקשות עקיבה** – נגיש רק כשהפרופיל פרטי. רשימת בקשות ממתינות + פעולות "אשר" / "דחה". (3) **רשימת משתמשים חסומים** – עם אפשרות לבטל חסימה. |
```

**L449**

```
| **סטטיסטיקות**      | שורת "סטטיסטיקות" המובילה למסך סטטיסטיקות אישיות (ראה 3.6) |
```

**L450**

```
| **תמיכה**           | (1) **דווח על בעיה** – מודל קצר → שיחת צ'אט 1:1 עם הסופר אדמין. (2) **תנאי שימוש ומדיניות פרטיות** – מסך מאוחד. (3) **אודות** – מסך ייעודי המסביר על החזון של קהילת קארמה. |
```

**L451**

```
| **התנתקות**         | כפתור פשוט – מחזיר למסך נחיתה                                    |
```

**L452**

```
| **מחיקת חשבון**     | כפתור עם אישור כפול. מוחק את כל הנתונים האישיים של המשתמש.        |
```

**L454**

```
> **אין** ב-MVP: שפה (עברית בלבד), נגישות (רק ברירת מחדל), עיצוב מותאם אישית.
```

**L458**

```
### 3.6 סטטיסטיקות אישיות
```

**L460**

```
מסך פנימי **בסיסי** הנגיש דרך הגדרות → "סטטיסטיקות שלי" (וגם דרך מסך הפרופיל אופציונלית).
```

**L462**

```
**רכיבים:**
```

**L464**

```
* **3 כרטיסים גדולים** (יישור P1 #7 עם 04 ו-05):
```

**L465**

```
    1. 🎁 **חפצים שמסרתי** – מספר פוסטים שלי במצב "לתת" שנסגרו (גם עם סימון מקבל וגם בלי).
```

**L466**

```
    2. 🔍 **חפצים שקיבלתי** – מספר פעמים שמשתמשים אחרים סימנו אותי כמקבל בפוסט שלהם. **מדויק לחלוטין** – לא הערכה. אם אדם לא סימן מקבל, החפץ פשוט לא ייחשב לאף אחד.
```

**L467**

```
    3. 📊 **פוסטים פעילים** – מספר הפוסטים שלי שעדיין פתוחים (המונה הפנימי, כולל "🔒 רק אני").
```

**L469**

```
> **למה אין כרטיס "עוקבים" כאן?** מספר העוקבים מוצג כבר במסך הפרופיל (3.1) כאחד מ-3 המספרים הבולטים. הוספתו כאן הייתה כפילות. מסך הסטטיסטיקות מתמקד ב-North Star ובשרשרת המסירה, לא ב-vanity metrics.
```

**L471**

```
* **שורת זמן (Timeline) קומפקטית:** רשימה כרונולוגית פשוטה של הפעילות (פוסטים שיצרתי, פוסטים שסגרתי, פוסטים שסומנתי בהם כמקבל).
```

**L473**

```
* **מדדי קהילה (סקירה קצרה, באותו מסך):** מספרים כלליים של האפליקציה — למשל **משתמשים רשומים**, **פוסטים פעילים בקהילה**, ועוד מדד אחד–שניים ברורים (למשל פוסטים שנסגרו בסה״כ). **בלי** להפוך את המסך לדשבורד ניתוח: תחושת “מה קורה אצל כולם”, לא תחרות או עומס.
```

**L475**

```
* **אין ב-MVP:** גרפים אינטראקטיביים, מפות חום, השוואות, פילוח לפי קטגוריה, דשבורד קהילתי עשיר. הכל זה נדחה ל-V2.
```

**L477**

```
> **הערה חינוכית:** עידוד עדין של היוזרים לסמן מקבל בעת סגירה (3.3.6) הוא חיוני כדי שהמדד "חפצים שקיבלתי" יהיה משמעותי. נשקול הצגת רמז קל בדיאלוג הסגירה: "סימון מקבל יזכה אותו בנקודה בסטטיסטיקה האישית שלו".
```

**L481**

```
## 3.7 סיכום: מה ב-MVP, מה לא
```

**L483**

```
| יכולת                          | סטטוס ב-MVP    | מקור בחזון V2                                          |
```

**L485**

```
| הרשמה (Google / טלפון / מייל; **Apple ב-iOS**)  | ✅              | [`PRD_HE_V2/03#3.1`](../PRD_HE_V2/03_Core_Features.md) |
```

**L486**

```
| Onboarding 3-שלבי              | ✅              | מקוצר מ-V2                                              |
```

**L487**

```
| פרופיל אישי                    | ✅ בסיסי         | [`PRD_HE_V2/03#3.1.3`](../PRD_HE_V2/03_Core_Features.md) |
```

**L488**

```
| **מצב פרטיות פרופיל (פומבי/פרטי)** | ✅ חדש ל-MVP    | חדש ל-MVP (פתרון לסתירה בין "ללא הגנת פרטיות" ל-"פוסט לעוקבים בלבד") |
```

**L489**

```
| עוקבים – פומבי: חד-כיווני / פרטי: עם אישור | ✅          | הרחבה לחזון V2 (אישור עוקב נכנס ל-MVP) |
```

**L490**

```
| פיד פוסטים                     | ✅              | [`PRD_HE_V2/03#3.2.1`](../PRD_HE_V2/03_Core_Features.md) |
```

**L491**

```
| חיפוש + סינון + מיון           | ✅              | [`PRD_HE_V2/03#3.2.2`](../PRD_HE_V2/03_Core_Features.md) |
```

**L492**

```
| יצירת פוסט (טוגל לתת/לבקש)     | ✅              | [`PRD_HE_V2/03#3.5.5`](../PRD_HE_V2/03_Core_Features.md) |
```

**L493**

```
| רמת חשיפת פוסט – 3 רמות (פומבי / עוקבים / רק אני) | ✅      | הרחבה: רמה שלישית "רק אני" + תלות בפרופיל פרטי |
```

**L494**

```
| בוסט עוקבים בפיד + סינון "רק עוקבים" | ❌              | נדחה ל-V2 – לא ב-MVP                                     |
```

**L495**

```
| סגירת פוסט עם/בלי סימון מקבל   | ✅              | חדש ל-MVP                                               |
```

**L496**

```
| פתיחה מחדש של פוסט              | ✅              | חדש ל-MVP                                               |
```

**L497**

```
| שמירת חיפוש/סינון אחרון         | ✅              | חדש ל-MVP                                               |
```

**L498**

```
| צ'אט פרטי 1-על-1 (טקסט)         | ✅              | [`PRD_HE_V2/03#3.6`](../PRD_HE_V2/03_Core_Features.md)  |
```

**L499**

```
| הגדרות בסיסיות                 | ✅              | [`PRD_HE_V2/03#3.12`](../PRD_HE_V2/03_Core_Features.md) |
```

**L500**

```
| סטטיסטיקות אישיות + מדדי קהילה בסיסיים | ✅ מצומצם        | [`PRD_HE_V2/03#3.8`](../PRD_HE_V2/03_Core_Features.md)  |
```

**L501**

```
| דיווח על תוכן                  | ✅ פשוט         | [`PRD_HE_V2/03#3.10`](../PRD_HE_V2/03_Core_Features.md) |
```

**L502**

```
| חסימת משתמש                    | ✅              | חדש                                                    |
```

**L503**

```
| התראות Push                    | ✅ בסיסי         | [`PRD_HE_V2/03#3.10`](../PRD_HE_V2/03_Core_Features.md) |
```

**L504**

```
| כל 12 העולמות הנוספים          | ❌              | נדחה ל-V2                                               |
```

**L505**

```
| מוקדנים, מערך שידוכים          | ❌              | נדחה                                                   |
```

**L506**

```
| אנונימיות אמיתית (3 רמות + מוקדנים) | ❌         | נדחה. ב-MVP יש מצב פרטיות פרופיל + 3 רמות חשיפת פוסט – ראה 3.2.3, 3.2.4 ו'. |
```

**L507**

```
| עמותות, מתנדבים, ארגונים       | ❌              | נדחה                                                   |
```

**L508**

```
| אתגרים, AI, Bookmarks, UI Custom | ❌            | נדחה                                                   |
```

**L509**

```
| אימות ת"ז (וי כחול)            | ❌              | נדחה                                                   |
```

**L510**

```
| צ'אט תמונות/קול/וידאו/מיקום    | ❌              | נדחה                                                   |
```

**L514**

```
*הפרק הבא: [4. זרימות משתמש](./04_User_Flows.md)*
```

**L515**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/04_User_Flows.md`

**L3**

```
## 🗺️ 4. זרימות משתמש (MVP User Flows)
```

**L5**

```
### מבנה הפרק
```

**L6**

```
פרק זה מכסה את כלל הזרימות המרכזיות של ה-MVP. כל זרימה מקושרת למסך הרלוונטי ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L8**

```
| #     | זרימה                                                          |
```

**L10**

```
| 1     | [הרשמה ראשונית (Onboarding)](#זרימה-1-הרשמה-ראשונית-onboarding) |
```

**L11**

```
| 2     | [התחברות חוזרת (Returning User)](#זרימה-2-התחברות-חוזרת)        |
```

**L12**

```
| 3     | [גלישה בפיד וחיפוש](#זרימה-3-גלישה-בפיד-וחיפוש)                  |
```

**L13**

```
| 4     | [יצירת פוסט – לתת חפץ](#זרימה-4-יצירת-פוסט--לתת-חפץ)             |
```

**L14**

```
| 5     | [יצירת פוסט – לבקש חפץ](#זרימה-5-יצירת-פוסט--לבקש-חפץ)           |
```

**L15**

```
| 6     | [שליחת הודעה מהירה למפרסם](#זרימה-6-שליחת-הודעה-מהירה-למפרסם)    |
```

**L16**

```
| 7     | [סגירת פוסט (סימון נמסר)](#זרימה-7-סגירת-פוסט-סימון-נמסר)        |
```

**L17**

```
| 8     | [עקיבה אחרי משתמש](#זרימה-8-עקיבה-אחרי-משתמש)                    |
```

**L18**

```
| 9     | [דיווח / חסימת משתמש](#זרימה-9-דיווח--חסימת-משתמש)               |
```

**L19**

```
| 10    | [שינוי רמת חשיפה של פוסט](#זרימה-10-שינוי-רמת-חשיפה-של-פוסט-קיים) |
```

**L20**

```
| 11    | [גישה למסך סטטיסטיקות](#זרימה-11-גישה-למסך-סטטיסטיקות)          |
```

**L21**

```
| 12    | [שינוי מצב פרטיות פרופיל](#זרימה-12-שינוי-מצב-פרטיות-פרופיל)     |
```

**L22**

```
| 13    | [ניהול בקשות עקיבה (פרופיל פרטי)](#זרימה-13-ניהול-בקשות-עקיבה-פרופיל-פרטי) |
```

**L23**

```
| 14    | [הסרת עוקב קיים](#זרימה-14-הסרת-עוקב-קיים)                       |
```

**L27**

```
### זרימה 1: הרשמה ראשונית (Onboarding)
```

**L28**

```
**תיאור:** משתמש חדש פותח את האפליקציה בפעם הראשונה.
```

**L30**

```
* **מסך 1 – נחיתה (1.1 Splash):** "ברוכים הבאים ל-Karma Community" + הצעת ערך אחת חדה. **3 כפתורים** (יישור P0 #3 עם 05): "הרשמה" / "התחברות" / "צפה כאורח".
```

**L31**

```
* **מסך 2 – Auth (1.2):** בחירת שיטה: **Google / טלפון / מייל**; ב-**iOS** גם **Apple**. אם בחרו Google או Apple → לחיצה אחת מאשרת. אם בחרו טלפון → OTP. אם בחרו מייל → סיסמה + אימות מייל.
```

**L32**

```
* **מסך 3 – פרטים בסיסיים (1.4 Basic Info):** שם מלא + עיר. (אם נכנסו דרך Google או Apple – שם נטען אוטומטית כשזמין, ניתן לעריכה). כפתור "המשך". ("דלג" → ראה הערה למטה).
```

**L33**

```
* **מסך 4 – תמונת פרופיל (1.5 Profile Photo):** העלאה אופציונלית. (אם נכנסו דרך Google או Apple – תמונת פרופיל נטענת אוטומטית כשזמינה). ("דלג" → צללית).
```

**L34**

```
* **מסך 5 – ברוכים הבאים (1.6 Tour):** 3 שקופיות אינטראקטיביות:
```

**L35**

```
    1. "פרסם חפץ למסירה בלחיצה אחת"
```

**L36**

```
    2. "מצא חפץ שאתה מחפש – חינם"
```

**L37**

```
    3. "תקבל הודעה כשמישהו מתעניין"
```

**L38**

```
    כפתור "התחל" → פיד ראשי (2.1).
```

**L40**

```
> **נקודת חסימה למשתמש שדילג על שם/עיר (יישור P2 #17 עם R-MVP-Profile-1):**
```

**L41**

```
> 1. דילוג על מסך 1.4 הוא **מותר** ב-Onboarding כדי לשמור על חוויה חלקה.
```

**L42**

```
> 2. אבל **כל ניסיון לבצע פעולה הדורשת פרופיל פעיל** (יצירת פוסט "+", שליחת הודעת צ'אט ראשונה, עקיבה אחר משתמש, דיווח, סגירת פוסט) **חוסם את הפעולה ומציג מודל**: *"כדי לבצע פעולה זו עליך להשלים את הפרופיל. שם ועיר חובה."* → כפתור "השלם עכשיו" → 3.2 Edit Profile.
```

**L43**

```
> 3. **צפייה בפיד, חיפוש, סינון, ופתיחת פרטי פוסט** **אינם** דורשים שם/עיר ופועלים גם עם פרופיל לא מלא.
```

**L44**

```
> 4. תמונת פרופיל **לעולם לא חוסמת** פעולה (אופציונלית לתמיד, R-MVP-Profile-1).
```

**L46**

```
#### זרימה 1.1: צפייה כאורח (Guest Preview)
```

**L47**

```
* **מסך 1 – נחיתה (1.1):** לחיצה על "צפה כאורח".
```

**L48**

```
* **מסך 2 – פיד מוגבל (1.7 Guest Preview Feed):** האורח רואה את **3 הפוסטים העדכניים ביותר** במצב **קריאה בלבד**, כל אחד מהם עם פרטים בסיסיים.
```

**L49**

```
* **מסך 3 – Overlay:** מתחת לפוסט השלישי – Banner מעודן עם הצעת ערך + כפתור "הצטרף לקהילה" → **מעבר ל-Auth (1.2)** (יישור P2 #18).
```

**L50**

```
* **כל ניסיון אינטראקציה** (לחיצה על פוסט / על משתמש / על כפתור פלוס / סינון / חיפוש / שליחת הודעה / עקיבה / דיווח) → אותו Overlay → Auth (1.2).
```

**L54**

```
### זרימה 2: התחברות חוזרת
```

**L55**

```
**תיאור:** משתמש קיים פותח שוב את האפליקציה.
```

**L57**

```
* **מקרה רגיל:** Token תקף → ישר לפיד.
```

**L58**

```
* **מקרה Token פג תוקף:** מסך Auth → OTP / מייל → פיד.
```

**L62**

```
### זרימה 3: גלישה בפיד וחיפוש
```

**L63**

```
**תיאור:** משתמש מחפש חפץ ספציפי או גולש בכיף.
```

**L65**

```
* **מסך 1 – פיד ראשי:** רואה רשימה כרונולוגית של פוסטים. כל פוסט עם תג ברור "🎁 לתת" / "🔍 לבקש".
```

**L66**

```
* **מסך 2 – חיפוש חופשי:** מקליד "אופניים" בשורת החיפוש. הפיד מתעדכן בזמן אמת.
```

**L67**

```
* **מסך 3 – סינון מתקדם:** לחיצה על אייקון "סננים" → מודל. בחירה: סוג=נותן, קטגוריה=ספורט, עיר=תל אביב. סגירת המודל.
```

**L68**

```
* **מסך 4 – חזרה לאפליקציה אחרי יומיים:** הפיד מציג עדיין את **אותו סינון** ("2 סננים פעילים | אופניים | …"). כפתור "נקה הכל" אם רוצים פיד מלא.
```

**L69**

```
* **מסך 5 – לחיצה על פוסט:** מסך פרטי פוסט עם כל המידע, כולל כתובת מלאה (לפי בחירת המפרסם).
```

**L73**

```
### זרימה 4: יצירת פוסט – לתת חפץ
```

**L74**

```
**תיאור:** משתמש רוצה למסור ספה.
```

**L76**

```
* **מסך 1 – לחיצה על "+" בניווט תחתון:** פותח טופס יצירת פוסט.
```

**L77**

```
* **מסך 2 – טוגל בראש המסך:** ברירת מחדל "🎁 לתת" (מתאים).
```

**L78**

```
* **מסך 3 – העלאת תמונה (חובה במצב "לתת"):** מצלמה / גלריה. עד 5 תמונות.
```

**L79**

```
* **מסך 4 – שדות:**
```

**L80**

```
    * כותרת: "ספה תלת מושבית בז'"
```

**L81**

```
    * תיאור: "מצב טוב, רק שריטה אחת בגב..."
```

**L82**

```
    * קטגוריה: רהיטים
```

**L83**

```
    * **כתובת מלאה (חובה):** עיר=רמת גן, רחוב=הרצל, מספר=23
```

**L84**

```
    * **רמת חשיפת מיקום:** *ברירת מחדל* "🗺️ עיר + רחוב" (הציבור יראה "רמת גן | הרצל" – ללא מספר). אפשר לשנות ל-"🏙️ עיר בלבד" / "📍 כתובת מלאה".
```

**L85**

```
    * **רמת חשיפת פוסט:** *ברירת מחדל* "🌍 פומבי". אופציות: "👥 רק עוקבים שלי" (מנוטרל אם הפרופיל פומבי – טולטיפ "*זמין כשפרופיל פרטי. לכניסה: הגדרות → פרטיות.*") | "🔒 רק אני (פרטי)".
```

**L86**

```
    * מצב חפץ: טוב
```

**L87**

```
* **מסך 5 – לחיצה על "פרסם" (יישור P1 #12 עם 03 ה'):**
```

**L88**

```
    * **אם רמת חשיפה = 🌍 פומבי:** ישירות → "✅ הפוסט שלך פורסם!" + מעבר חזרה לפיד עם הפוסט בראש.
```

**L89**

```
    * **אם רמת חשיפה = 👥 רק עוקבים שלי:** קודם מוצג **דיאלוג ביניים**: *"הפוסט יוצג רק ל-X עוקבים מאושרים שלך. רוצה לפרסם לכולם?"* כפתורים: "עוקבים בלבד" (ראשי) / "פרסם לכולם" (משני). אחרי בחירה → "✅ הפוסט שלך פורסם!".
```

**L90**

```
    * **אם רמת חשיפה = 🔒 רק אני:** קודם מוצג **דיאלוג ביניים**: *"הפוסט יישמר רק בלשונית הפוסטים שלך. אף משתמש אחר לא יראה אותו. ניתן לעדכן רמת חשיפה אחר כך (רק להעלאה)."* כפתורים: "שמור פרטי" (ראשי) / "ביטול". אחרי "שמור פרטי" → "✅ הפוסט נשמר אצלך פרטית".
```

**L92**

```
#### זרימה 4א: יציאה מהמסך באמצע = שמירת טיוטה
```

**L93**

```
* המשתמש לחץ "חזרה" באמצע מילוי הטופס.
```

**L94**

```
* **שמירה אוטומטית של הטופס** במצב נוכחי. לא מוצגת הודעה.
```

**L95**

```
* בכניסה הבאה למסך יצירת פוסט: "💾 *יש לך טיוטה שלא פורסמה. להמשיך לערוך?*" כפתורים: "המשך" / "התחל מחדש".
```

**L99**

```
### זרימה 5: יצירת פוסט – לבקש חפץ
```

**L100**

```
**תיאור:** סטודנט מחפש מקרר.
```

**L102**

```
* **מסך 1 – לחיצה על "+":** טופס יצירת פוסט.
```

**L103**

```
* **מסך 2 – טוגל לראש המסך → "🔍 לבקש":** הטופס מתחלף. מצב חפץ נעלם, מופיע שדה "דחיפות".
```

**L104**

```
* **מסך 3 – העלאת תמונה (אופציונלי):** המשתמש מדלג. ✅ אם הוא היה מעלה תמונה אילוסטרטיבית, היא הייתה מוצגת. כעת – **אייקון קטגוריה ברירת מחדל** של "❄️ מקרר" יוצג בפיד.
```

**L105**

```
* **מסך 4 – שדות:**
```

**L106**

```
    * כותרת: "מחפש מקרר במצב טוב לסטודנט"
```

**L107**

```
    * תיאור: "עברתי דירה ואין לי מקרר..."
```

**L108**

```
    * קטגוריה: חשמל
```

**L109**

```
    * **כתובת מלאה (חובה):** עיר=ירושלים, רחוב=ז'בוטינסקי, מספר=44
```

**L110**

```
    * **רמת חשיפת מיקום:** ברירת מחדל "עיר + רחוב".
```

**L111**

```
    * **רמת חשיפת פוסט:** ברירת מחדל "פומבי".
```

**L112**

```
    * דחיפות: "צריך עד סוף החודש"
```

**L113**

```
* **מסך 5 – לחיצה על "פרסם":** "✅ הבקשה שלך פורסמה!"
```

**L117**

```
### זרימה 6: שליחת הודעה מהירה למפרסם
```

**L118**

```
**תיאור:** משתמש ראה ספה שמעניינת אותו ורוצה ליצור קשר.
```

**L120**

```
* **מסך 1 – פיד / חיפוש:** לחיצה על הפוסט → מסך פרטי פוסט.
```

**L121**

```
* **מסך 2 – פרטי פוסט:** לחיצה על כפתור "**שלח הודעה למפרסם**".
```

**L122**

```
* **מסך 3 – צ'אט נפתח:** הודעה אוטומטית מוקלדת: "היי! ראיתי את הפוסט שלך על *ספה תלת מושבית בז'*. מעוניין/ת לדעת עוד."
```

**L123**

```
* **מסך 4 – המשתמש עורך / מאשר ושולח:** ההודעה נשלחת. ההמתנה מתחילה.
```

**L124**

```
* **מסך 5 (Push):** המפרסם מקבל התראה: "יש לך הודעה חדשה ממיכל שמש".
```

**L125**

```
* **מסך 6 – הצדדים מתאמים:** טקסט חופשי, מתאמים זמן ומקום.
```

**L129**

```
### זרימה 7: סגירת פוסט (סימון נמסר) – המנגנון המלא
```

**L130**

```
**תיאור:** המסירה הצליחה, בעל הפוסט סוגר אותו. המנגנון מאפשר סימון מקבל **אופציונלי**, ויש מנגנון "פתח מחדש" אם משהו השתבש.
```

**L132**

```
> **קריטי:** הפוסט נסגר רק אחרי שהחפץ **נמסר בפועל**, לא אחרי תיאום או "שידוך".
```

**L134**

```
#### חלק א: זרימה רגילה
```

**L135**

```
* **מסך 1 – פרופיל שלי → לשונית "פוסטים פעילים":** רשימת הפוסטים הפתוחים.
```

**L136**

```
* **מסך 2 – לחיצה על פוסט → לחיצה על "סמן כ-נמסר".**
```

**L137**

```
* **מסך 3 – דיאלוג שלב 1 (אישור):** "*האם החפץ נמסר בפועל? סגירת הפוסט תוציא אותו מהפיד.*"
```

**L138**

```
    * כפתורים: "כן, נמסר" | "ביטול".
```

**L139**

```
    * אם המקבל לא בא בסוף → אל תסגור. אפשרות לפתוח מחדש קיימת אחר כך.
```

**L140**

```
* **מסך 4 – דיאלוג שלב 2 (סימון מקבל אופציונלי):**
```

**L141**

```
    > "*האם תרצה לסמן מי קיבל את החפץ? זה יעדכן את הסטטיסטיקה שלכם – שלך ושל המקבל.*"
```

**L142**

```
    * רשימה (Picker) של כל המשתמשים שיצרו איתי שיחה על הפוסט.
```

**L143**

```
    * כפתורים: "סמן וסגור" | "סגור ללא סימון".
```

**L144**

```
* **מסך 5 – אם נסגר עם סימון מקבל:**
```

**L145**

```
    * סטטוס הפוסט = `closed_delivered`.
```

**L146**

```
    * הפוסט נשמר בלשונית "פוסטים סגורים" שלי **ושל המקבל**.
```

**L147**

```
    * הסטטיסטיקה: +1 ל"חפצים שמסרתי" (אצלי), +1 ל"חפצים שקיבלתי" (אצל המקבל).
```

**L148**

```
    * המקבל מקבל Push: "*[שם הבעל] סימן אותך כמקבל של [כותרת]. תודה שאתה משתמש בקהילה!*"
```

**L149**

```
* **מסך 5א – אם נסגר ללא סימון מקבל:**
```

**L150**

```
    * סטטוס הפוסט = `deleted_no_recipient` (יימחק תוך 7 ימים).
```

**L151**

```
    * רק הסטטיסטיקה של "חפצים שמסרתי" מתעדכנת אצלי.
```

**L152**

```
* **מסך 6 – דיאלוג חינוכי חד-פעמי:**
```

**L153**

```
    > "*💡 איך עובד מנגנון הסגירה: פוסט עם סימון מקבל יישמר תמיד. פוסט בלי סימון יימחק אחרי 7 ימים. בכל מקרה, הסטטיסטיקה האישית שלך מתעדכנת.*"
```

**L154**

```
    * Toggle "אל תציג לי שוב את ההסבר הזה" (משויך לפרופיל).
```

**L155**

```
* **מסך 7 – הודעת אישור:** "🎉 כל הכבוד! חפץ נוסף קיבל חיים שניים."
```

**L157**

```
#### חלק ב: פתיחה מחדש (Reopen)
```

**L158**

```
**תיאור:** משתמש סגר פוסט אבל המקבל לא הגיע / נטש בסופו של דבר.
```

**L160**

```
* **מסך 1 – פרופיל שלי → לשונית "פוסטים סגורים":** רשימת הפוסטים שסומנו "נמסר".
```

**L161**

```
* **מסך 2 – לחיצה על פוסט סגור → כפתור "📤 פתח מחדש".**
```

**L162**

```
* **מסך 3 – דיאלוג אישור:** "*האם לפתוח מחדש את הפוסט? הוא יחזור לפיד.*"
```

**L163**

```
* **מסך 4 – אחרי אישור:**
```

**L164**

```
    * סטטוס הפוסט חוזר ל-`open`.
```

**L165**

```
    * חוזר לפיד הראשי.
```

**L166**

```
    * אם נסגר עם סימון מקבל – המקבל מקבל Push: "*[שם הבעל] פתח מחדש את הפוסט. הסימון שלך כמקבל הוסר.*"
```

**L167**

```
    * הסטטיסטיקות מתעדכנות בהתאם.
```

**L171**

```
### זרימה 8: עקיבה אחרי משתמש
```

**L172**

```
**תיאור:** ראיתי משתמש שמסר הרבה דברים מעניינים, אני רוצה לעקוב.
```

**L174**

```
#### חלק א: עקיבה אחרי פרופיל פומבי
```

**L175**

```
* **מסך 1 – פיד / פוסט:** לחיצה על שם המשתמש → מסך פרופיל שלו (כל הפוסטים גלויים).
```

**L176**

```
* **מסך 2 – פרופיל אחר:** כפתור "**עקוב**" בולט.
```

**L177**

```
* **מסך 3 – לחיצה:** הכפתור הופך ל"**מעקב פעיל ✓**". מספר העוקבים שלו עולה ב-1. בעל הפרופיל מקבל Push: "*[שם] התחיל לעקוב אחריך.*"
```

**L178**

```
* **לאחר מכן:** במסך הפרופיל שלי → לשונית "נעקבים" → המשתמש מופיע.
```

**L180**

```
#### חלק ב: עקיבה אחרי פרופיל פרטי
```

**L181**

```
* **מסך 1 – פיד / פוסט:** לחיצה על שם המשתמש → מסך פרופיל שלו.
```

**L182**

```
* **מסך 2 – פרופיל פרטי שאני לא עוקב מאושר:** מוצגים רק תמונה, שם, עיר, ביוגרפיה ומספרים. במקום לשונית פוסטים – מסגרת "🔒 *הפרופיל פרטי. שלח בקשת עקיבה כדי לראות פוסטים.*" כפתור "**שלח בקשת עקיבה**".
```

**L183**

```
* **מסך 3 – לחיצה על "שלח בקשת עקיבה":** הכפתור הופך ל"בקשה נשלחה ⏳ (ביטול)". בעל הפרופיל מקבל Push: "*[שם] רוצה לעקוב אחריך.*" עם פעולות מהירות "אשר" / "דחה".
```

**L184**

```
* **מסך 4 – המתנה:**
```

**L185**

```
    * **אם הבעל אישר:** המבקש מקבל Push: "*[שם הבעל] אישר את בקשתך.*" הכפתור הופך ל"מעקב פעיל ✓". כעת רואים את הפוסטים.
```

**L186**

```
    * **אם הבעל דחה:** הבקשה נמחקת בשקט. **המבקש לא מקבל התראה** (מדיניות פרטיות). אפשר לשלוח בקשה חדשה רק לאחר 14 יום (Cooldown).
```

**L187**

```
    * **אם המבקש ביטל:** הכפתור חוזר ל"שלח בקשת עקיבה". אין Cooldown במקרה ביטול עצמי.
```

**L189**

```
> **ב-MVP אין השפעה על מיון הפיד** – המעקב נכון לעצמו ועל גישה לפוסטים "רק עוקבים שלי", ולא משנה את סדר הפיד.
```

**L193**

```
### זרימה 9: דיווח / חסימת משתמש
```

**L194**

```
**תיאור:** ראיתי פוסט בעייתי או קיבלתי הודעה לא ראויה.
```

**L196**

```
> **הבהרת ישות הדיווח (יישור P0 #6):** ב-MVP **אין תגובות לפוסטים** (Comments מחוץ לסקופ – ראה [`08#8.2.4`](./08_Out_of_Scope_and_Future.md)). היישויות שניתן לדווח עליהן הן: **פוסט**, **משתמש (פרופיל)**, **שיחת צ'אט שלמה** (לא הודעה בודדת בתוכה). כל אזכור היסטורי של "תגובה" במסמך זה מתייחס ל**שיחת צ'אט**.
```

**L198**

```
#### א. דיווח על פוסט / משתמש / שיחה
```

**L199**

```
* **מסך 1 – פוסט / פרופיל / שיחה:** תפריט נקודות (⋮) → "**דווח**".
```

**L200**

```
* **מסך 2 – מודל דיווח (6.1):** רשימה: "ספאם / תוכן פוגעני / מטעה / לא חוקי / אחר". בחירת סיבה + טקסט אופציונלי.
```

**L201**

```
* **מסך 3 – אישור:** "✅ הדיווח התקבל. הצוות שלנו יבחן את הפוסט בהקדם." הפוסט/משתמש/שיחה מוסתרים עבור המדווח.
```

**L203**

```
##### תהליך פנימי בעקבות דיווח (אוטומטי)
```

**L204**

```
1. **הדיווח נשלח כהודעה לצ'אט הסופר אדמין** (`karmacommunity2.0@gmail.com`) – הודעה מערכתית עם לינק לפוסט/משתמש/שיחה + סיבה + שם המדווח.
```

**L205**

```
2. **אם זה הדיווח השלישי על אותו פריט – פעולת ברירת מחדל לפי סוג הפריט (יישור P1 #10):**
```

**L206**

```
    * **פוסט:** סטטוס משתנה ל-`removed_admin`. הבעל מקבל התראה: *"הפוסט שלך הוסר זמנית בעקבות דיווחים. הצוות יבחן זאת."*
```

**L207**

```
    * **שיחה:** השיחה מסומנת `hidden_admin` (מוסתרת לשני הצדדים). אם 3 הדיווחים על השיחה הם נגד אותו צד → השעיה זמנית של אותו צד (כמו במשתמש למטה).
```

**L208**

```
    * **משתמש (פרופיל):** **השעיה זמנית של 7 ימים** (`status=suspended_temp`). המשתמש מתחבר אבל רואה מסך נעילה: *"חשבונך הושעה זמנית בעקבות דיווחים. ניתן לפנות לתמיכה דרך הגדרות → דווח על בעיה. החשבון יוחזר ב-[תאריך]."* **דיווח רביעי על אותו משתמש בתוך 30 יום ← השעיה סופית** (`suspended_perma`) עד החלטת אדמין.
```

**L209**

```
    * **בכל המקרים** – הסופר אדמין מקבל הודעת מערכת: *"הוסר/הושעה אוטומטית בעקבות 3 דיווחים. [פרטים]. רוצה לבטל?"* + כפתור "↩️ שחזר".
```

**L210**

```
3. **5 דיווחי שווא בתוך 30 יום ע"י אותו משתמש (יישור P2 #23 עם R-MVP-Privacy-10):** ראה הגדרה מדויקת ב-[`07_Business_Rules.md#R-MVP-Privacy-10`](./07_Business_Rules.md). תקציר:
```

**L211**

```
    * **"דיווח שווא"** = דיווח שהסופר אדמין סגר עם תווית "דיווח שווא" אחרי בדיקה (לא דיווח שעדיין בהמתנה).
```

**L212**

```
    * **"5 ברצף"** = 5 דיווחי שווא רצופים **ללא דיווח אחד שאומת** ביניהם, **בתוך חלון 30 יום**.
```

**L213**

```
    * **המדידה היא גלובלית למדווח** (לא לפי יעד), כי הבעיה היא ניצול לרעה כללי של מערכת הדיווחים.
```

**L214**

```
    * **תוצאה:** השעיה זמנית של 7 ימים על חשבון המדווח. דיווחים שלו ממשיכים להישלח לאדמין (לצורך מעקב), אבל **לא** נספרים בכלל "3 דיווחים = הסרה" (R-MVP-Privacy-5) למשך תקופת ההשעיה.
```

**L216**

```
#### ב. דיווח בעיה כללית מהגדרות (תמיכה)
```

**L217**

```
* **מסך 1 – הגדרות:** "**דווח על בעיה**" (או ניסוח דומה).
```

**L218**

```
* **מסך 2 – מודל:** תיאור הבעיה (חובה מינימלית); אופציונלי – קטגוריה (למשל באג / חשבון / הצעה).
```

**L219**

```
* **מסך 3 – מעבר לצ'אט:** נפתחת **שיחה 1:1** עם חשבון הסופר אדמין; אצל האדמין מגיעה **הודעת מערכת** עם תוכן הדיווח וזיהוי המדווח, והשיחה מופיעה ברשימת השיחות שלו עם אותו משתמש (שיחה חדשה אם זו הפנייה הראשונה ביניהם).
```

**L220**

```
* **מסך 4 – שיחה:** המשתמש והאדמין יכולים להמשיך בטקסט כמו בכל צ'אט רגיל.
```

**L222**

```
#### ג. חסימת משתמש
```

**L223**

```
* **מסך 1 – פרופיל / שיחה:** תפריט (⋮) → "**חסום משתמש**".
```

**L224**

```
* **מסך 2 – אישור:** "האם לחסום את [שם]? לא תראה את הפוסטים שלו ולא תקבל ממנו הודעות."
```

**L225**

```
* **מסך 3 – אישור:** המשתמש החסום נעלם מהפיד / שיחות. ניתן לשחרר חסימה דרך הגדרות.
```

**L227**

```
#### ד. הסופר אדמין מטפל
```

**L228**

```
* הסופר אדמין נכנס לאפליקציה עם החשבון `karmacommunity2.0@gmail.com` (זוהה בשרת לפי `role=super_admin`).
```

**L229**

```
* פותח את הצ'אט שלו (4.1 Inbox) – מקבל את כל ההודעות המערכתיות על דיווחי תוכן, ואת **שיחות התמיכה** עם משתמשים שדיווחו בעיה מההגדרות.
```

**L230**

```
* בדיווחי תוכן: לחיצה על לינק → צפייה בפוסט/משתמש המדווח → החלטה דרך כפתורים מותני-הרשאה ב-UI הסטנדרטי (ראה 6.6 ב-05): "↩️ שחזר" / "השאר מוסר" / "השעה משתמש סופית" (מתפריט ⋮ של פרופיל).
```

**L231**

```
* בדיווח בעיה מהגדרות: מענה ישיר בצ'אט 1:1 עם המדווח (טקסט בלבד, כמו צ'אט רגיל).
```

**L232**

```
* **תיוג דיווחים כ"שווא"** (יישור P2 #23): הסופר אדמין מסמן דיווח כ"שווא" דרך כפתור נוסף בהודעת המערכת ("🚫 דיווח שווא"), אחרי שבדק שהפריט תקין. פעולה זו מזרימה לספירה ב-R-MVP-Privacy-10.
```

**L236**

```
### זרימה 10: שינוי רמת חשיפה של פוסט קיים
```

**L237**

```
**תיאור:** משתמש רוצה לעדכן רמת חשיפה של פוסט שכבר פורסם. **כלל הברזל:** רק העלאה, לא הורדה (R-MVP-Privacy-9).
```

**L239**

```
| מצב נוכחי         | אפשרויות מעבר חוקיות                                     |
```

**L241**

```
| 🔒 רק אני          | רק עוקבים (אם הפרופיל פרטי) / פומבי                       |
```

**L242**

```
| 👥 רק עוקבים שלי   | פומבי                                                    |
```

**L243**

```
| 🌍 פומבי           | אין מעבר (פומבי הוא הרמה הגבוהה ביותר)                    |
```

**L245**

```
#### זרימה לדוגמה: רק עוקבים → פומבי
```

**L246**

```
* **מסך 1 – פרופיל שלי → פוסטים פעילים → לחיצה על "ערוך":**
```

**L247**

```
* **מסך 2 – טופס עריכה:** רוב השדות זמינים לעריכה.
```

**L248**

```
* **מסך 3 – שדה "רמת חשיפה":** מציג כעת "👥 רק עוקבים שלי". האפשרויות הזמינות: "🌍 פומבי". האפשרות "🔒 רק אני" **מנוטרלת** עם טולטיפ "*הורדת חשיפה אסורה אחרי פרסום.*"
```

**L249**

```
* **מסך 4 – שמירה:** הפוסט עכשיו פומבי. **לא ניתן** לחזור ל"רק עוקבים" / "רק אני".
```

**L250**

```
* **מסך 5 – הודעת אישור:** "✅ הפוסט מעודכן. כעת כל המשתמשים יראו אותו."
```

**L252**

```
#### זרימה לדוגמה: רק אני → רק עוקבים שלי (פרופיל פרטי בלבד)
```

**L253**

```
* **מסך 1–2:** כנ"ל.
```

**L254**

```
* **מסך 3 – שדה "רמת חשיפה":** מציג "🔒 רק אני". האפשרויות: "👥 רק עוקבים שלי" (זמין רק אם הפרופיל פרטי) | "🌍 פומבי".
```

**L255**

```
* **מסך 4 – שמירה:** הפוסט מתחיל להופיע אצל העוקבים המאושרים בפיד שלהם.
```

**L256**

```
* **מסך 5 – הודעת אישור:** "✅ הפוסט מופיע כעת לעוקבים המאושרים שלך."
```

**L260**

```
### זרימה 11: גישה למסך סטטיסטיקות
```

**L261**

```
**תיאור:** המשתמש רוצה לראות את התרומה שלו.
```

**L263**

```
* **מסך 1 – פרופיל שלי (3.1) / הגדרות (5.1):** לחיצה על "**סטטיסטיקות שלי**".
```

**L264**

```
* **מסך 2 – מסך סטטיסטיקות (5.2):**
```

**L265**

```
    * **3 כרטיסים בלבד** (יישור P1 #7 עם 03 ו-05): 🎁 חפצים שמסרתי, 🔍 חפצים שקיבלתי, 📊 פוסטים פעילים. **אין כרטיס "עוקבים"** – הוא מוצג בפרופיל (3.1).
```

**L266**

```
    * בלוק קצר של **מדדי קהילה** (מספר משתמשים, פוסטים פעילים בקהילה וכו' — ראה 3.6).
```

**L267**

```
    * רשימה כרונולוגית של פעילות.
```

**L268**

```
* **מסך 3 – חזרה:** כפתור חזרה → הגדרות / פרופיל.
```

**L272**

```
### זרימה 12: שינוי מצב פרטיות פרופיל
```

**L273**

```
**תיאור:** משתמש מחליט לשנות את הפרופיל שלו ממצב פומבי לפרטי (או להפך).
```

**L275**

```
#### חלק א: פומבי → פרטי
```

**L276**

```
* **מסך 1 – הגדרות → פרטיות:** Toggle "🔒 פרופיל פרטי" כבוי. לחיצה להפעלה.
```

**L277**

```
* **מסך 2 – מודל אישור:**
```

**L278**

```
    > "*להפוך את הפרופיל שלך לפרטי?*
```

**L279**

```
    > • עוקבים חדשים יצטרכו לקבל את אישורך.
```

**L280**

```
    > • X העוקבים הקיימים יישארו (אפשר להסיר ידנית מהרשימה).
```

**L281**

```
    > • פוסטים פומביים שלך יישארו פומביים.
```

**L282**

```
    > • כעת תוכל לסמן פוסטים חדשים כ"רק עוקבים שלי"."
```

**L283**

```
    * כפתורים: "כן, להפוך לפרטי" / "ביטול".
```

**L284**

```
* **מסך 3 – אישור:** "✅ הפרופיל שלך עכשיו פרטי. ניתן לחזור לפומבי בכל עת."
```

**L285**

```
* **מסך 4 – הגדרות → פרטיות:** מופיע שדה חדש "**בקשות עקיבה (0)**".
```

**L287**

```
#### חלק ב: פרטי → פומבי
```

**L288**

```
* **מסך 1 – הגדרות → פרטיות:** Toggle "🔒 פרופיל פרטי" מופעל. לחיצה לכיבוי.
```

**L289**

```
* **מסך 2 – מודל אישור:**
```

**L290**

```
    > "*להפוך את הפרופיל שלך לפומבי?*
```

**L291**

```
    > • כל אחד יוכל לעקוב אחריך ללא אישור.
```

**L292**

```
    > • Y בקשות עקיבה ממתינות יאושרו אוטומטית.
```

**L293**

```
    > • פוסטים שלך במצב "רק עוקבים שלי" יהיו גלויים לכל עוקב חדש.
```

**L294**

```
    > **אם תרצה להגביל פוסטים מסוימים**, מחק או שנה אותם לפני המעבר."
```

**L295**

```
    * כפתורים: "כן, להפוך לפומבי" / "ביטול".
```

**L296**

```
* **מסך 3 – אישור:** "✅ הפרופיל שלך עכשיו פומבי. כל הבקשות הממתינות אושרו והמבקשים קיבלו התראה."
```

**L297**

```
* **בקשות ממתינות:** מאושרות אוטומטית. כל מבקש מקבל Push: "*[שם הבעל] עכשיו פומבי – אתה עוקב אחריו.*"
```

**L301**

```
### זרימה 13: ניהול בקשות עקיבה (פרופיל פרטי)
```

**L302**

```
**תיאור:** הבעל של פרופיל פרטי מקבל בקשת עקיבה ומחליט לאשר/לדחות.
```

**L304**

```
#### א. דרך התראה
```

**L305**

```
* **מסך 1 – Push:** "*[שם המבקש] רוצה לעקוב אחריך.*" עם 3 פעולות מהירות: "👁️ צפה" / "✓ אשר" / "✗ דחה".
```

**L306**

```
* **לחיצה על "אשר" ב-Push:** המבקש הופך לעוקב מאושר; מקבל Push חוזר. אין צורך לפתוח את האפליקציה.
```

**L307**

```
* **לחיצה על "דחה" ב-Push:** הבקשה נמחקת. המבקש לא מקבל התראה.
```

**L308**

```
* **לחיצה על "צפה":** מעבר למסך פרופיל המבקש ([`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md) – מסך 3.3 User Profile) כדי לראות פרטים לפני החלטה.
```

**L310**

```
#### ב. דרך הגדרות
```

**L311**

```
* **מסך 1 – הגדרות → פרטיות → בקשות עקיבה:** רשימה של כל הבקשות הממתינות. כל שורה: תמונה + שם + עיר + זמן הבקשה + 2 כפתורים: "✓ אשר" / "✗ דחה".
```

**L312**

```
* **מסך 2 – לחיצה על השם:** מעבר לפרופיל המבקש ([`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md) – מסך 3.3 User Profile) כדי לראות פרטים לפני החלטה. כפתורי "אשר/דחה" מופיעים גם בראש הפרופיל.
```

**L313**

```
* **מסך 3 – לאחר פעולה:** השורה נעלמת מהרשימה. הספירה מתעדכנת (`בקשות עקיבה (X)`).
```

**L315**

```
> **חשוב:** הבעל אינו חייב להגיב. בקשות לא מטופלות **נשארות ברשימה ללא הגבלת זמן** עד שהמבקש מבטל אותן או הבעל מאשר/דוחה.
```

**L319**

```
### זרימה 14: הסרת עוקב קיים
```

**L320**

```
**תיאור:** הבעל של פרופיל מחליט להסיר אדם שעוקב אחריו.
```

**L322**

```
* **מסך 1 – פרופיל שלי → לשונית "עוקבים":** רשימת העוקבים שלי.
```

**L323**

```
* **מסך 2 – לחיצה על "⋮" ליד שורת עוקב:** תפריט קצר עם הפעולה "הסר עוקב".
```

**L324**

```
* **מסך 3 – אישור:** "*להסיר את [שם] מהעוקבים שלך?*
```

**L325**

```
    > • הוא לא יראה יותר פוסטים שלך מסומנים 'רק עוקבים שלי'.
```

**L326**

```
    > • הוא **לא יקבל התראה**.
```

**L327**

```
    > • הוא יוכל לעקוב מחדש: מיידית אם הפרופיל שלך פומבי, או דרך בקשת עקיבה אם פרטי."
```

**L328**

```
    * כפתורים: "הסר" / "ביטול".
```

**L329**

```
* **מסך 4 – אישור:** "✅ [שם] הוסר מהעוקבים שלך."
```

**L333**

```
## סיכום: זרימות שלא קיימות ב-MVP
```

**L335**

```
> זרימות אלה קיימות ב-V2 אבל **אינן ב-MVP**.
```

**L337**

```
| זרימה ב-V2                                  | סטטוס ב-MVP | הסבר                                      |
```

**L339**

```
| F1‑F5 (תרומה כספית, קמפיינים, קרן)         | ❌          | אין עולם הכסף                            |
```

**L340**

```
| F6‑F7 (פרסום מזון, בקשת מזון)              | ❌          | אין עולם המזון                           |
```

**L341**

```
| F8‑F10 (תרומת דם, אדי, חירום)              | ❌          | אין עולם הרפואה                          |
```

**L342**

```
| F11‑F12 (אירוח דיור)                        | ❌          | אין עולם הדיור                           |
```

**L343**

```
| זרימה 3 (פוסט אנונימי + מוקדן)              | ❌          | אין מוקדנים ב-MVP                         |
```

**L344**

```
| זרימה 5+שינוע (חיבור לעולם נסיעות)          | ❌          | אין עולם נסיעות. **המסירה היא עצמית.**    |
```

**L345**

```
| זרימות 8-9 (אתגרים)                         | ❌          | אין אתגרים                               |
```

**L346**

```
| זרימה 10 (גילוי אנשים)                      | ⚠️ חלקית     | יש פרופיל ועקיבה, אין מסך גילוי ייעודי     |
```

**L347**

```
| זרימות 11-13 (תרומה כספית, התנדבות, ארגון) | ❌          | אין עמותות                                |
```

**L348**

```
| זרימה 14 (תרומת ידע / קורס)                 | ❌          | אין עולם הידע                            |
```

**L349**

```
| זרימה 18 (עוזר AI)                          | ❌          | אין AI ב-MVP                              |
```

**L350**

```
| זרימה 19 (התאמת עיצוב)                      | ❌          | אין עיצוב מותאם אישי                      |
```

**L354**

```
*הפרק הבא: [5. מיפוי מסכים](./05_Screen_UI_Mapping.md)*
```

**L355**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/05_Screen_UI_Mapping.md`

**L3**

```
## 📱 5. מיפוי מסכים (MVP)
```

**L5**

```
### 5.1 רשימת מסכים מלאה
```

**L7**

```
ה-MVP מורכב מ-**31 מסכים ומודלים** (עודכן ב-D-16, 2026-05-09: התווספו 4 מסכים חדשים — 2.5/2.6/2.7/2.8). כל מסך נדרש להוכחת PMF. הספירה כוללת 7 מסכי Auth, 8 מסכי ליבה+תרומות+חיפוש, 4 מסכי פרופיל, 2 מסכי צ'אט, 4 מסכי הגדרות, ו-6 מודלים/מסכים מיוחדים.
```

**L9**

```
#### קבוצה 1: כניסה והרשמה (Auth)
```

**L10**

```
* 1.1 מסך נחיתה (Splash / Welcome)
```

**L11**

```
* 1.2 מסך התחברות / הרשמה (Auth – Google / Apple (iOS) / טלפון / מייל)
```

**L12**

```
* 1.3 מסך הזנת קוד OTP (OTP Code)
```

**L13**

```
* 1.4 מסך פרטים בסיסיים – שם + עיר (Basic Info)
```

**L14**

```
* 1.5 מסך תמונת פרופיל (Profile Photo Setup)
```

**L15**

```
* 1.6 מסך ברוכים הבאים (Welcome Tour)
```

**L16**

```
* 1.7 פיד אורח (Guest Preview Feed)
```

**L18**

```
#### קבוצה 2: ניווט וליבת המוצר
```

**L19**

```
* 2.1 מסך פיד ראשי / בית (Home / Feed)
```

**L20**

```
* 2.2 מודל סנן ומיון (Filter & Sort Modal)
```

**L21**

```
* 2.3 מסך פרטי פוסט (Post Detail)
```

**L22**

```
* 2.4 מסך יצירת/עריכת פוסט (Create / Edit Post)
```

**L23**

```
* 2.5 מסך חיפוש (Search — placeholder; D-16)
```

**L24**

```
* 2.6 מסך מרכז התרומות (Donations Hub; D-16)
```

**L25**

```
* 2.7 מסך תרומה כספית (Donations · Money — coming soon + jgive link; D-16)
```

**L26**

```
* 2.8 מסך תרומת זמן (Donations · Time — coming soon + we-me link + volunteer composer; D-16)
```

**L28**

```
#### קבוצה 3: פרופיל ועוקבים
```

**L29**

```
* 3.1 מסך הפרופיל שלי (My Profile)
```

**L30**

```
* 3.2 מסך עריכת פרופיל (Edit Profile)
```

**L31**

```
* 3.3 מסך פרופיל משתמש אחר (User Profile)
```

**L32**

```
* 3.4 מסך עוקבים / נעקבים (Followers / Following)
```

**L34**

```
#### קבוצה 4: צ'אט
```

**L35**

```
* 4.1 מסך רשימת שיחות (Chat List / Inbox)
```

**L36**

```
* 4.2 מסך שיחה (Chat Detail)
```

**L38**

```
#### קבוצה 5: הגדרות וסטטיסטיקות
```

**L39**

```
* 5.1 מסך הגדרות (Settings)
```

**L40**

```
* 5.2 מסך סטטיסטיקות (אישי + מדדי קהילה בסיסיים)
```

**L41**

```
* 5.3 מסך משתמשים חסומים (Blocked Users)
```

**L42**

```
* 5.4 מסך בקשות עקיבה (Follow Requests) – **רק כשהפרופיל פרטי**
```

**L44**

```
#### קבוצה 6: בטיחות ומיני-מודלים
```

**L45**

```
* 6.1 מודל דיווח על תוכן (Report Modal)
```

**L46**

```
* 6.1b מודל דיווח בעיה מהגדרות (Report Issue / Support Modal)
```

**L47**

```
* 6.2 מודל אישור פעולה (Confirm Action Modal) – משמש למחיקה / חסימה
```

**L48**

```
* 6.3 מסך 404 / מסך שגיאה (Error State)
```

**L49**

```
* 6.4 מודלים מיוחדים לסגירת פוסט (Closure Flow)
```

**L50**

```
* 6.5 מודל פתיחה מחדש (Reopen Modal)
```

**L51**

```
* 6.6 ממשק סופר אדמין (חבוי בצ'אט)
```

**L53**

```
> **בסך הכל: 31 מסכים/מודלים** (יישור 5.1 לעיל; עודכן ב-D-16). לעומת ~100 מסכים ב-V2 → צמצום של ~69%. זה הוא המהות של MVP.
```

**L57**

```
### 5.2 פירוט מסכים
```

**L59**

```
#### קבוצה 1: כניסה והרשמה
```

**L61**

```
##### 1.1 מסך נחיתה (Splash / Welcome)
```

**L62**

```
* **תיאור:** המסך הראשון שכל משתמש רואה. רק לפני התחברות.
```

**L63**

```
* **רכיבים:**
```

**L64**

```
    * לוגו Karma Community.
```

**L65**

```
    * משפט הצעת ערך: *"מסירת וקבלת חפצים בחינם, מאדם לאדם."*
```

**L66**

```
    * תמונת רקע מזמינה.
```

**L67**

```
    * **3 כפתורים** (יישור P0 #3 עם זרימה 1 ב-04 ועם 3.1.1 ב-03):
```

**L68**

```
        * **"הרשמה"** (ראשי) → 1.2 (מצב הרשמה).
```

**L69**

```
        * **"התחברות"** (משני) → 1.2 (מצב כניסה).
```

**L70**

```
        * **"צפה כאורח"** (Tertiary, link-style) → 1.7 (Guest Preview Feed).
```

**L71**

```
* **פעולות:** ראה לעיל.
```

**L73**

```
##### 1.2 מסך התחברות / הרשמה (Auth)
```

**L74**

```
* **תיאור:** מסך אחד עם **שלוש שיטות ליבה** (Google / טלפון / מייל); ב-**iOS** גם **כניסה עם Apple** לצד Google.
```

**L75**

```
* **רכיבים:**
```

**L76**

```
    * **כפתור "המשך עם Google"** (גדול ובולט, עם לוגו Google).
```

**L77**

```
    * **כפתור "המשך עם Apple"** — מוצג **ב-iOS בלבד**, לצד Google (דרישת App Store כשמוצג SSO צד שלישי).
```

**L78**

```
    * מפריד "או"
```

**L79**

```
    * Tab "טלפון": שדה מספר טלפון + קידומת ישראל (+972). כפתור "שלח קוד".
```

**L80**

```
    * Tab "מייל": שדה מייל + סיסמה. בהרשמה – שדה אימות סיסמה. בכניסה – קישור "שכחתי סיסמה".
```

**L81**

```
    * קישור התנייה "מסכים לתנאי השימוש" (חובה לאשר בהרשמה).
```

**L83**

```
##### 1.3 מסך הזנת קוד OTP
```

**L84**

```
* **תיאור:** רק לאחר Auth בטלפון.
```

**L85**

```
* **רכיבים:** 6 שדות תווים (auto-focus), טיימר 60 שניות + כפתור "שלח קוד שוב". כפתור "אישור".
```

**L87**

```
##### 1.4 מסך פרטים בסיסיים (Basic Info)
```

**L88**

```
* **תיאור:** שלב 1 ב-Onboarding. **רק להרשמה ראשונה.**
```

**L89**

```
* **רכיבים:**
```

**L90**

```
    * שדה "שם מלא" (חובה).
```

**L91**

```
    * תפריט נפתח "עיר מגורים" (חובה, רשימת ערים בישראל).
```

**L92**

```
    * כפתורים: "המשך" (ראשי) | "דלג" (משני, מוצגת התראה לכך).
```

**L94**

```
##### 1.5 מסך תמונת פרופיל (Profile Photo Setup)
```

**L95**

```
* **תיאור:** שלב 2 ב-Onboarding. אופציונלי.
```

**L96**

```
* **רכיבים:**
```

**L97**

```
    * עיגול גדול עם צללית ברירת מחדל / תמונה שהועלתה.
```

**L98**

```
    * 2 כפתורים: "צלם תמונה" | "בחר מהגלריה".
```

**L99**

```
    * כפתור "המשך" / "דלג".
```

**L101**

```
##### 1.6 מסך ברוכים הבאים (Welcome Tour)
```

**L102**

```
* **תיאור:** שלב 3 ב-Onboarding. 3 שקופיות אינטראקטיביות.
```

**L103**

```
* **רכיבים:**
```

**L104**

```
    * שקופית 1: איור + "פרסם חפץ למסירה בלחיצה אחת"
```

**L105**

```
    * שקופית 2: איור + "מצא חפץ שאתה מחפש – חינם"
```

**L106**

```
    * שקופית 3: איור + "תקבל הודעה כשמישהו מתעניין"
```

**L107**

```
    * נקודות ניווט בתחתית.
```

**L108**

```
    * כפתור "התחל" → 2.1 (פיד).
```

**L110**

```
##### 1.7 פיד אורח (Guest Preview Feed)
```

**L111**

```
* **תיאור:** אורח רואה גרסה מקוצרת של פיד 2.1 – **3 פוסטים בלבד**, מצב **קריאה בלבד**.
```

**L112**

```
* **רכיבים:**
```

**L113**

```
    * 3 פוסטים בתצוגת קלף סטנדרטית (כמו 2.1) – ללא יכולת לחיצה אינטראקטיבית.
```

**L114**

```
    * **Overlay בולט** מתחת לפוסט השלישי: "🔓 הצטרף לקהילה כדי לראות עוד 50+ פוסטים פעילים באזור שלך".
```

**L115**

```
    * **כפתור "הצטרף לקהילה"** בולט בתוך ה-Overlay → **מעבר ל-1.2 Auth** (יישור P2 #18 עם 03 ו-04).
```

**L116**

```
    * **כפתור משני "חזרה למסך הנחיתה"** → 1.1 (אופציונלי, למקרה שאורח מתחרט).
```

**L117**

```
* **התנהגות אינטראקציה:** כל לחיצה על פוסט / שם משתמש / "+" / סנן / חיפוש / שליחת הודעה / עקיבה / דיווח **מציגה את אותו Overlay** ומובילה ל-1.2 Auth.
```

**L121**

```
#### קבוצה 2: ניווט וליבת המוצר
```

**L123**

```
##### 2.1 מסך פיד ראשי / בית (Home / Feed) ⭐
```

**L124**

```
* **תיאור:** המסך המרכזי של ה-MVP. **המסך שהמשתמש רואה רוב הזמן.**
```

**L125**

```
* **רכיבים:**
```

**L126**

```
    * **בר עליון:** אייקון צ'אט (עם badge חיווי הודעות) | אייקון הגדרות.
```

**L127**

```
    * **שורת חיפוש חופשי** (קבועה בראש).
```

**L128**

```
    * **כפתור "סננים"** (פותח מודל 2.2). מציג חיווי "X מסננים פעילים | חיפוש פעיל". **ערכי הסינון נשמרים בין סשנים.**
```

**L129**

```
    * **כפתור "נקה הכל"** מופיע ליד כפתור הסננים אם יש סינון פעיל.
```

**L130**

```
    * **רשימת פוסטים** (גלילה אינסופית, **תצוגת רשת: 2 פוסטים בשורה**):
```

**L131**

```
        * תמונה ראשית **או** אייקון קטגוריה ברירת מחדל (בבקשה ללא תמונה).
```

**L132**

```
        * תג בולט: 🎁 לתת / 🔍 לבקש.
```

**L133**

```
        * **תגיות נוספות (אם רלוונטי):** 👥 לעוקבים בלבד | 🔒 נמסר.
```

**L134**

```
        * **פוסטים "🔒 רק אני" אינם מופיעים בפיד הראשי כלל** (גם לא בפיד של בעל הפוסט). הם נראים אך ורק בלשונית "פוסטים פעילים" של פרופיל הבעל (ראה 3.1).
```

**L135**

```
        * כותרת + תיאור קצוץ ל-2 שורות.
```

**L136**

```
        * שם המפרסם + **מיקום (לפי בחירת המפרסם – עיר / עיר+רחוב / כתובת מלאה)** + זמן.
```

**L137**

```
        * אייקון מהיר: "💬 שלח הודעה".
```

**L138**

```
    * **בר תחתון:** 🏠 בית (פעיל) | ➕ פלוס | 👤 פרופיל.
```

**L139**

```
* **פעולות:**
```

**L140**

```
    * לחיצה על פוסט → 2.3 (פרטי פוסט).
```

**L141**

```
    * לחיצה על "+" → 2.4 (יצירת פוסט).
```

**L142**

```
    * לחיצה על תמונת המפרסם → 3.3 (פרופיל אחר).
```

**L143**

```
* **מצב אורח (Guest):** מציג רק 3 פוסטים, ואז Overlay עם כפתור הצטרפות (ראה 1.7).
```

**L145**

```
##### 2.2 מודל סנן ומיון (Filter & Sort Modal)
```

**L146**

```
* **תיאור:** Bottom sheet שעולה מהתחתית. הסטטוס שלו נשמר בין סשנים (לא איפוס בכל פתיחה).
```

**L147**

```
* **רכיבים (מלמעלה למטה):**
```

**L148**

```
    * **סוג פוסט** – Toggle group: הכל | רק נותנים | רק מבקשים.
```

**L149**

```
    * **קטגוריה** – Chips ניתנים לבחירה מרובה.
```

**L150**

```
    * **מצב חפץ** – Chips (רק אם בחרו "נותנים").
```

**L151**

```
    * **עיר** – תפריט נפתח.
```

**L152**

```
    * **🆕 כולל פוסטים סגורים** – Toggle (ברירת מחדל: כבוי). אם מופעל – פוסטים שנמסרו מוצגים עם תג "🔒 נמסר", **ללא יכולת אינטראקציה**.
```

**L153**

```
    * **מיון** – Radio: החדש ביותר / קרוב גיאוגרפית.
```

**L154**

```
    * כפתורים: "החל" (ראשי) | "נקה הכל" (משני).
```

**L156**

```
##### 2.3 מסך פרטי פוסט (Post Detail)
```

**L157**

```
* **תיאור:** כל המידע על הפוסט.
```

**L158**

```
* **רכיבים:**
```

**L159**

```
    * **גלריית תמונות** (Carousel) – swipe. אם זה בקשה ללא תמונה – אייקון קטגוריה גדול.
```

**L160**

```
    * תג בולט 🎁 / 🔍.
```

**L161**

```
    * תגיות נוספות: 👥 לעוקבים בלבד | 🔒 פרטי – רק אני (רק לבעל) | 🔒 נמסר (אם רלוונטי).
```

**L162**

```
    * כותרת + קטגוריה.
```

**L163**

```
    * שם מפרסם + תמונה + עיר (לחיצה → 3.3 פרופיל).
```

**L164**

```
    * תיאור מלא.
```

**L165**

```
    * שדות ספציפיים (מצב חפץ / דחיפות).
```

**L166**

```
    * **כתובת:** מוצגת לפי בחירת המפרסם – עיר בלבד / עיר+רחוב / כתובת מלאה.
```

**L167**

```
    * זמן פרסום.
```

**L168**

```
    * **כפתור "💬 שלח הודעה למפרסם"** (CTA ראשי, בולט) – זמין גם אם המפרסם בעל פרופיל פרטי.
```

**L169**

```
    * **כפתור עקיבה** (משני) – טקסט דינמי לפי מצב פרטיות הפרופיל וסטטוס הבקשה: "+ עקוב" / "+ שלח בקשת עקיבה" / "בקשה נשלחה ⏳" / "מעקב פעיל ✓".
```

**L170**

```
    * תפריט (⋮): "דווח" | "חסום משתמש".
```

**L171**

```
* **אם זה הפוסט שלי (פעיל):** במקום הכפתורים – "ערוך" | "סמן כ-נמסר" | "מחק". פוסט במצב 🔒 רק אני מציג גם תג ברור "🔒 פרטי – רק אני (לא נראה בפיד)".
```

**L172**

```
* **אם זה הפוסט שלי (סגור = closed_delivered):** "📤 פתח מחדש" | תצוגה של "סומן כמקבל: [שם]" אם רלוונטי.
```

**L173**

```
* **אם זה פוסט סגור של אחר** (במצב סינון "כולל סגורים"): תצוגה בלבד, ללא יכולת אינטראקציה. תג ברור "🔒 נמסר ב-[תאריך]".
```

**L174**

```
* **אם זה פוסט "👥 רק עוקבים שלי" של אחר ואני לא עוקב מאושר:** הפוסט אינו אמור להגיע לפה (Server-side filter), אבל אם בכל זאת – מצב שגיאה: "🔒 *הפוסט אינו זמין. ייתכן שהוא הוסר או שהוא מוגבל לעוקבים בלבד.*"
```

**L176**

```
##### 2.4 מסך יצירת/עריכת פוסט (Create / Edit Post) ⭐
```

**L177**

```
* **תיאור:** טופס יחיד עם **טוגל** מצב.
```

**L178**

```
* **רכיבים (מלמעלה למטה):**
```

**L179**

```
    * **טוגל מצב גלובלי:** 🎁 לתת ←→ 🔍 לבקש (בולט בראש המסך).
```

**L180**

```
    * **העלאת תמונות** (אזור גדול עם "+" – עד 5). **חובה במצב "לתת"; אופציונלי במצב "לבקש"**. אם לא הועלתה תמונה במצב "לבקש" – הצגה: "* בפיד יוצג אייקון קטגוריה ברירת מחדל*".
```

**L181**

```
    * שדה כותרת.
```

**L182**

```
    * שדה תיאור (Textarea).
```

**L183**

```
    * תפריט קטגוריה.
```

**L184**

```
    * **🆕 שדה כתובת מלאה** (חובה): תפריט עיר + שדה רחוב + שדה מספר.
```

**L185**

```
    * **🆕 רמת חשיפת מיקום** – Radio:
```

**L186**

```
        * 🏙️ עיר בלבד.
```

**L187**

```
        * 🗺️ עיר + רחוב *(ברירת מחדל)*.
```

**L188**

```
        * 📍 כתובת מלאה.
```

**L189**

```
    * **🆕 רמת חשיפת פוסט** – Radio (3 רמות):
```

**L190**

```
        * 🌍 **פומבי** *(ברירת מחדל)*.
```

**L191**

```
        * 👥 **רק עוקבים שלי** – **מנוטרל (Disabled) כשהפרופיל פומבי**, עם טולטיפ "*זמין כשפרופיל פרטי. הגדרות → פרטיות.*" + לינק קצר "פתח הגדרות".
```

**L192**

```
        * 🔒 **רק אני (פרטי)** – זמין תמיד.
```

**L193**

```
    * **בעריכת פוסט קיים:** האפשרויות מוגבלות לפי כלל "רק העלאת חשיפה" (R-MVP-Privacy-9). אפשרויות שאסורות מוצגות מנוטרלות עם טולטיפ "*הורדת חשיפה אסורה אחרי פרסום.*"
```

**L194**

```
    * (אם "לתת") שדה מצב חפץ.
```

**L195**

```
    * (אם "לבקש") שדה דחיפות (חופשי).
```

**L196**

```
    * **כפתור "פרסם"** ראשי, בולט.
```

**L197**

```
    * **שמירת טיוטה אוטומטית:** כל שינוי נשמר לוקאלית. בכניסה הבאה למסך (אם לא פורסם) – "*יש לך טיוטה. להמשיך?*"
```

**L199**

```
##### 2.5 מסך חיפוש (Search) — placeholder ⭐
```

**L200**

```
* **תיאור:** מסך שמשמש placeholder ללשונית 🔍 בבר התחתון. ב-MVP אין שדה חיפוש אקטיבי במסך הזה — החיפוש בפוסטים זמין דרך הפיד הראשי (`FR-FEED-003`). המנוע האוניברסלי (אנשים + חפצים + קטגוריות עתידיות) דחוי ל-P2.
```

**L201**

```
* **רכיבים (מלמעלה למטה):**
```

**L202**

```
    * אייקון 🔍 גדול במרכז.
```

**L203**

```
    * כותרת: *"חיפוש אוניברסלי בקרוב"*.
```

**L204**

```
    * טקסט גוף: *"בנתיים, חיפוש פוסטים זמין ישירות בפיד הראשי."*
```

**L205**

```
    * כפתור משני: *"עבור לפיד הראשי"* → 2.1.
```

**L206**

```
* **פעולות:** לחיצה על הכפתור → 2.1 (Home Feed).
```

**L207**

```
* **קשור:** `FR-FEED-016`, D-16.
```

**L209**

```
##### 2.6 מסך מרכז התרומות (Donations Hub) ⭐
```

**L210**

```
* **תיאור:** המסך הראשי של לשונית 💝 בבר התחתון. מציג 3 אריחים — חפצים, זמן, כסף — לבחירת מודאליות התרומה.
```

**L211**

```
* **רכיבים (מלמעלה למטה):**
```

**L212**

```
    * כותרת: 💝 תרומות.
```

**L213**

```
    * **אריח 1 — 🎁 חפצים** — תיאור: *"תרומה ובקשת חפצים"*. לחיצה → 2.1 (Home Feed, ללא סינון מקדים).
```

**L214**

```
    * **אריח 2 — ⏰ זמן** — תיאור: *"התנדבות וזמן פנוי"*. לחיצה → 2.8.
```

**L215**

```
    * **אריח 3 — 💰 כסף** — תיאור: *"תרומה כספית"*. לחיצה → 2.7.
```

**L216**

```
    * אריחים אנכיים, gap 16px, container max-width 480px.
```

**L217**

```
* **התנהגות אורח:** המסך auth-required ב-MVP-core (ראה `FR-DONATE-005`). מראה אורח ל-Donations יוערך ב-TD-113.
```

**L218**

```
* **קשור:** `FR-DONATE-001`, `FR-DONATE-005`, D-16.
```

**L220**

```
##### 2.7 מסך תרומה כספית (Donations · Money)
```

**L221**

```
* **תיאור:** מסך coming-soon לקטגוריית הכסף עם קישור חיצוני לפלטפורמה השותפה `jgive`.
```

**L222**

```
* **רכיבים (מלמעלה למטה):**
```

**L223**

```
    * כותרת + כפתור חזרה (←).
```

**L224**

```
    * טקסט גוף verbatim:
```

**L225**

```
      *"קטגוריית הכסף תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולתרום / לחפש תורמים דרך עמותת jgive."*
```

**L226**

```
    * כפתור ראשי: *"פתח את jgive.com ↗"* → דפדפן חיצוני (`Linking.openURL('https://jgive.com')`).
```

**L227**

```
* **התנהגות אורח:** auth-required ב-MVP-core (ראה `FR-DONATE-005`).
```

**L228**

```
* **קשור:** `FR-DONATE-003`, `FR-DONATE-005`, D-16.
```

**L230**

```
##### 2.8 מסך תרומת זמן (Donations · Time)
```

**L231**

```
* **תיאור:** מסך coming-soon לקטגוריית הזמן עם קישור חיצוני ל-`Lev Echad / we-me` ותיבת הודעה לאדמין להתנדבות בארגון.
```

**L232**

```
* **רכיבים (מלמעלה למטה):**
```

**L233**

```
    * כותרת + כפתור חזרה (←).
```

**L234**

```
    * טקסט גוף verbatim:
```

**L235**

```
      *"קטגוריית הזמן תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳."*
```

**L236**

```
    * כפתור ראשי: *"פתח את לב אחד ↗"* → דפדפן חיצוני (`Linking.openURL('https://www.we-me.app/')`).
```

**L237**

```
    * **מפריד.**
```

**L238**

```
    * טקסט משני verbatim:
```

**L239**

```
      *"ניתן גם להתנדב ישירות בארגון שלנו, במקצוע שלך. השאירו הודעה ונחזור אליכם."*
```

**L240**

```
    * **תיבת הודעה (`<TextInput multiline />`):** placeholder: *"הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות..."*. מקסימום 2,000 תווים.
```

**L241**

```
    * כפתור ראשי: *"שלח הודעה"*. לחיצה (משתמש מאומת + טקסט לא ריק) →
```

**L242**

```
        * שמירה לוקאלית של ההודעה ב-`AsyncStorage` (`volunteer_intent_log`, מקסימום 50 רשומות).
```

**L243**

```
        * הצגת alert: *"תודה! ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ'אט."*
```

**L244**

```
        * ניקוי תיבת הטקסט.
```

**L245**

```
        * **TD-114:** כש-P0.5 chat ייכנס, יוחלף ב-call ל-`sendVolunteerMessageToAdmin` use-case שיפתח/יחדש shared support thread עם prefix *"התנדבות בארגון: "* וינווט ל-4.2 Chat Detail.
```

**L246**

```
* **התנהגות אורח:** auth-required ב-MVP-core (ראה `FR-DONATE-005`).
```

**L247**

```
* **קשור:** `FR-DONATE-004`, `FR-DONATE-005`, `FR-CHAT-007`, `FR-CHAT-008` (extended), D-16.
```

**L251**

```
#### קבוצה 3: פרופיל ועוקבים
```

**L253**

```
##### 3.1 מסך הפרופיל שלי (My Profile)
```

**L254**

```
* **תיאור:** הפרופיל של המשתמש המחובר.
```

**L255**

```
* **רכיבים:**
```

**L256**

```
    * **כותרת:** תמונה גדולה במרכז + שם + עיר + ביוגרפיה.
```

**L257**

```
    * **חיווי מצב פרטיות:** אייקון קטן ליד השם – 🔒 אם הפרופיל פרטי, ללא אייקון אם פומבי. טאפ → קיצור ל-5.1 → פרטיות.
```

**L258**

```
    * **3 מספרים בולטים בשורה:**
```

**L259**

```
        * `[N] עוקבים`  →  לחיצה → 3.4 (לשונית עוקבים)
```

**L260**

```
        * `[N] נעקבים`  →  לחיצה → 3.4 (לשונית נעקבים)
```

**L261**

```
        * `[N] פוסטים פעילים` – **המונה הפנימי** (כולל פוסט בקשה, פוסט הצעה, ופוסטים "🔒 רק אני"). שני הסוגים נספרים יחד באותו מונה.
```

**L262**

```
    * **כפתור "ערוך פרופיל"** | **"שתף פרופיל"**.
```

**L263**

```
    * **לשוניות (Tabs):**
```

**L264**

```
        * "פוסטים פעילים" – **רשת עם 3 פוסטים בשורה** של הפוסטים הפתוחים שלי. כולל פוסטים פומביים, "👥 רק עוקבים שלי", ו-"🔒 רק אני" (כולם עם תגיות חזותיות מתאימות).
```

**L265**

```
        * "פוסטים סגורים" – **רשת עם 3 פוסטים בשורה** של פוסטים שסומנו "נמסר".
```

**L266**

```
* **פעולות:** כל פוסט → 2.3 (פרטי פוסט במצב "שלי").
```

**L268**

```
##### 3.2 מסך עריכת פרופיל (Edit Profile)
```

**L269**

```
* **תיאור:** עדכון פרטי פרופיל.
```

**L270**

```
* **רכיבים:**
```

**L271**

```
    * שינוי תמונה.
```

**L272**

```
    * שינוי שם.
```

**L273**

```
    * שינוי עיר (תפריט).
```

**L274**

```
    * שינוי ביוגרפיה.
```

**L275**

```
    * כפתור "שמור".
```

**L277**

```
##### 3.3 מסך פרופיל משתמש אחר (User Profile)
```

**L278**

```
* **תיאור:** אותו מבנה כ-3.1 אבל ממבט חיצוני.
```

**L279**

```
* **רכיבים זהים** ל-3.1, עם הבדלים:
```

**L280**

```
    * **חיווי מצב פרטיות** של המשתמש (🔒 אם פרטי).
```

**L281**

```
    * במקום "ערוך פרופיל" → כפתור עקיבה דינמי:
```

**L282**

```
        * **פרופיל פומבי, אני לא עוקב:** "+ עקוב".
```

**L283**

```
        * **פרופיל פומבי, אני עוקב:** "מעקב פעיל ✓" (טאפ → ביטול עקיבה עם אישור).
```

**L284**

```
        * **פרופיל פרטי, לא עוקב, אין בקשה:** "+ שלח בקשת עקיבה".
```

**L285**

```
        * **פרופיל פרטי, בקשה ממתינה:** "בקשה נשלחה ⏳" (טאפ → "בטל בקשה").
```

**L286**

```
        * **פרופיל פרטי, אני עוקב מאושר:** "מעקב פעיל ✓".
```

**L287**

```
    * נוסף: "💬 שלח הודעה" – זמין תמיד (גם בפרופיל פרטי לזרים).
```

**L288**

```
    * תפריט (⋮): "דווח" | "חסום משתמש".
```

**L289**

```
* **תצוגות לשוניות לפי מצב הפרופיל:**
```

**L290**

```
    * **פרופיל פומבי** או **פרטי + אני עוקב מאושר:** מוצגת לשונית **"פוסטים פעילים"** בלבד – **רשת עם 3 פוסטים בשורה** (היסטוריית פוסטים סגורים של זרים אינה גלויה ב-MVP – שיקול פרטיות). **פוסטים "🔒 רק אני" של הבעל אינם מוצגים** גם לעוקב מאושר.
```

**L291**

```
    * **פרופיל פרטי + אני לא עוקב מאושר:** במקום הלשוניות מוצגת מסגרת אחת:
```

**L292**

```
        > "🔒 *הפרופיל פרטי. שלח בקשת עקיבה כדי לראות פוסטים, עוקבים ונעקבים.*"
```

**L293**

```
    * המספרים (עוקבים / נעקבים / פוסטים פעילים *ציבוריים*) נשארים גלויים תמיד כדי לאפשר זיהוי.
```

**L295**

```
##### 3.4 מסך עוקבים / נעקבים
```

**L296**

```
* **תיאור:** רשימה פשוטה.
```

**L297**

```
* **רכיבים:**
```

**L298**

```
    * 2 לשוניות: "עוקבים" | "נעקבים".
```

**L299**

```
    * רשימה: תמונה + שם + עיר + כפתור עקיבה דינמי (לפי מצב הפרופיל של היעד).
```

**L300**

```
    * חיפוש לפי שם.
```

**L301**

```
* **רק בפרופיל שלי:** כל שורת עוקב כוללת תפריט "⋮" עם הפעולה **"הסר עוקב"** (דורש אישור במודל 6.2).
```

**L302**

```
* **נראות רשימות בפרופיל אחר:** ראה כללי 3.3 – לזרים בפרופיל פרטי מוצג רק המספר, לא הרשימה.
```

**L306**

```
#### קבוצה 4: צ'אט
```

**L308**

```
##### 4.1 מסך רשימת שיחות (Chat List / Inbox)
```

**L309**

```
* **תיאור:** כל השיחות שלי, ממוינות לפי הודעה אחרונה.
```

**L310**

```
* **רכיבים:**
```

**L311**

```
    * **בר עליון:** "שיחות" + אייקון חיפוש.
```

**L312**

```
    * שורת חיפוש שיחה (לפי שם).
```

**L313**

```
    * רשימת שיחות:
```

**L314**

```
        * תמונה + שם.
```

**L315**

```
        * Preview של הודעה אחרונה (1 שורה).
```

**L316**

```
        * זמן (`כעת` / `15:43` / `אתמול` / `5/6`).
```

**L317**

```
        * חיווי "לא נקרא" (נקודה כחולה / ספרה).
```

**L318**

```
* **פעולות:** לחיצה על שיחה → 4.2.
```

**L320**

```
##### 4.2 מסך שיחה (Chat Detail) ⭐
```

**L321**

```
* **תיאור:** שיחה 1-על-1.
```

**L322**

```
* **רכיבים:**
```

**L323**

```
    * **כותרת:** חזרה (←) | תמונה + שם של השני | תפריט (⋮).
```

**L324**

```
    * אזור הודעות (גלילה).
```

**L325**

```
    * בועות הודעות (אני vs השני).
```

**L326**

```
    * חותמת זמן + חיווי "✓✓ נקרא".
```

**L327**

```
    * **תיבת הקלדה** + כפתור שליחה (מטוס).
```

**L328**

```
    * **אין** כפתורי תמונה / קול / מצלמה / מיקום ב-MVP.
```

**L329**

```
    * תפריט (⋮): "צפייה בפרופיל", "חסום משתמש", "דווח על השיחה".
```

**L330**

```
* **אם השיחה נפתחה דרך פוסט:** הודעה ראשונה אוטומטית מוקלדת בתיבה מראש.
```

**L334**

```
#### קבוצה 5: הגדרות וסטטיסטיקות
```

**L336**

```
##### 5.1 מסך הגדרות (Settings) ⭐
```

**L337**

```
* **תיאור:** מסך אחד פשוט. רשימה של כרטיסים.
```

**L338**

```
* **רכיבים:**
```

**L339**

```
    * **חשבון:** שורת "פרטי חשבון" המפנה לעריכת הפרופיל (שם, עיר, ביוגרפיה).
```

**L340**

```
    * **התראות:** Toggle יחיד "התראות מופעלות".
```

**L341**

```
    * **🔒 פרטיות:** קטגוריה עם 3 פריטים:
```

**L342**

```
        * **מצב פרופיל** – Toggle "פרופיל פרטי" (ברירת מחדל: כבוי = פומבי). שינוי פותח מודל אישור עם הסברי השלכות (ראה זרימה 12 ב-04). באישור הפעלה (פרטי): פעיל מיידית; באישור כיבוי (פומבי): כל בקשות העקיבה הממתינות מאושרות אוטומטית.
```

**L343**

```
        * **בקשות עקיבה (X)** – שורה זו מופיעה **רק כשהפרופיל פרטי**. ה-X הוא מספר בקשות ממתינות. טאפ → 5.4.
```

**L344**

```
        * **משתמשים חסומים** → 5.3.
```

**L345**

```
    * **📊 סטטיסטיקות:** שורת מעבר למסך סטטיסטיקות אישיות (ראה 5.2).
```

**L346**

```
    * **תמיכה:**
```

**L347**

```
        * **דווח על בעיה:** פותח מודל (שורת נושא או קטגוריה אופציונלית + תיאור) → לאחר שליחה: מעבר ל-**4.2 שיחה** עם חשבון הסופר אדמין.
```

**L348**

```
        * **תנאי שימוש ומדיניות פרטיות:** מסך משולב עם המידע המשפטי הרלוונטי.
```

**L349**

```
        * **אודות:** מסך המסביר על החזון של קהילת קארמה (בסגנון הדף המקורי).
```

**L350**

```
    * **התנתקות**.
```

**L351**

```
    * **מחיקת חשבון** (כפתור אדום, אישור כפול).
```

**L353**

```
##### 5.2 מסך סטטיסטיקות (אישי + קהילה בסיסית)
```

**L354**

```
* **תיאור:** **בסיסי**, כפי שביקש המשתמש — פעילות אישית **וגם** מבט קהילתי מצומצם (לא דשבורד כבד).
```

**L355**

```
* **רכיבים:**
```

**L356**

```
    * **כותרת:** "הפעילות שלך"
```

**L357**

```
    * **3 כרטיסים גדולים בשורה:**
```

**L358**

```
        * 🎁 חפצים שמסרתי: `[N]`
```

**L359**

```
        * 🔍 חפצים שקיבלתי: `[N]`
```

**L360**

```
        * 📊 פוסטים פעילים: `[N]`
```

**L361**

```
    * **מדדי קהילה (קומפקטי):** למשל כרטיס אחד או שורת KPIs — משתמשים רשומים, פוסטים פעילים בקהילה, ומדד נוסף אופציונלי (למשל פוסטים שנסגרו בסה״כ). ללא גרפים וללא פילוחים.
```

**L362**

```
    * **טיימליין פעילות:** רשימה כרונולוגית של פעולות (פוסט נוצר, פוסט נסגר). מקסימום 30 רשומות אחרונות.
```

**L363**

```
    * **אין** ב-MVP: גרפים, מפות, פילוח לפי קטגוריה, השוואה, אנליטיקת קהילה מורכבת.
```

**L365**

```
##### 5.3 מסך משתמשים חסומים (Blocked Users)
```

**L366**

```
* **תיאור:** רשימת חסימות + ביטול.
```

**L367**

```
* **רכיבים:** רשימה: תמונה + שם + כפתור "בטל חסימה".
```

**L369**

```
##### 5.4 מסך בקשות עקיבה (Follow Requests)
```

**L370**

```
* **תיאור:** רשימת בקשות עקיבה ממתינות. **נגיש רק כשהפרופיל שלי פרטי.** אם הפרופיל הופך לפומבי באמצע הסשן – המסך נסגר אוטומטית כי כל הבקשות מאושרות.
```

**L371**

```
* **רכיבים:**
```

**L372**

```
    * **בר עליון:** "בקשות עקיבה" + ספירה (X) + כפתור חזרה.
```

**L373**

```
    * **רשימה ריקה:** מצב Empty ידידותי – "*אין בקשות חדשות. בקשות חדשות יופיעו כאן עם התראה.*"
```

**L374**

```
    * **רשימה לא ריקה:** כל שורה כוללת:
```

**L375**

```
        * תמונה + שם + עיר.
```

**L376**

```
        * זמן יחסי של הבקשה ("לפני 2 שעות", "אתמול").
```

**L377**

```
        * 2 כפתורים בולטים: "✓ אשר" (ראשי) | "✗ דחה" (משני).
```

**L378**

```
        * טאפ על השם / התמונה → מעבר למסך 3.3 User Profile של המבקש, שם אפשר גם כן לאשר/לדחות בכפתורים בראש המסך.
```

**L379**

```
* **לאחר פעולה (אשר/דחה):** השורה מתפוגגת מהרשימה, הספירה מתעדכנת. אישור: Push למבקש; דחייה: בשקט (R-MVP-Privacy-12).
```

**L383**

```
#### קבוצה 6: בטיחות ומיני-מודלים
```

**L385**

```
##### 6.1 מודל דיווח על תוכן (Report Modal)
```

**L386**

```
* **תיאור:** Bottom sheet קטן.
```

**L387**

```
* **רכיבים:**
```

**L388**

```
    * רשימת סיבות (Radio): ספאם / תוכן פוגעני / מטעה / לא חוקי / אחר.
```

**L389**

```
    * שדה הערות חופשי (אופציונלי).
```

**L390**

```
    * כפתורים: "שלח דיווח" | "ביטול".
```

**L392**

```
##### 6.1b מודל דיווח בעיה מהגדרות (Report Issue / Support)
```

**L393**

```
* **תיאור:** Bottom sheet או מודל קצר, נפתח מ-5.1.
```

**L394**

```
* **רכיבים:**
```

**L395**

```
    * שדה תיאור הבעיה (חובה מינימלית).
```

**L396**

```
    * אופציונלי: בחירת קטגוריה (באג / חשבון / הצעה / אחר).
```

**L397**

```
    * כפתורים: "שלח ופתח צ'אט" (ראשי) | "ביטול".
```

**L398**

```
* **לאחר שליחה:** מעבר ל-4.2 עם חשבון הסופר אדמין; הודעת מערכת נשלחת לאדמין (ראה 6.6).
```

**L400**

```
##### 6.2 מודל אישור פעולה (Confirm Action Modal)
```

**L401**

```
* **תיאור:** מודל גנרי לפעולות הרסניות.
```

**L402**

```
* **שימושים:** "מחק פוסט", "חסום משתמש", "מחק חשבון".
```

**L403**

```
* **רכיבים:** כותרת ("האם אתה בטוח?") + תיאור הפעולה + כפתורים: "אישור" (ראשי) | "ביטול" (משני).
```

**L405**

```
##### 6.4 מודלים מיוחדים לסגירת פוסט
```

**L406**

```
**(זרימת רב-שלבים – ראה [`04_User_Flows.md#זרימה-7`](./04_User_Flows.md))**
```

**L408**

```
###### 6.4.1 שלב 1: אישור עיקרי
```

**L409**

```
* כותרת: "האם החפץ נמסר בפועל?"
```

**L410**

```
* תיאור: "סגירת הפוסט תוציא אותו מהפיד. אם המקבל לא בא בסוף – אל תסגור עכשיו, תוכל לפתוח מחדש בכל עת."
```

**L411**

```
* כפתורים: "כן, נמסר" | "ביטול".
```

**L413**

```
###### 6.4.2 שלב 2: בחירת מקבל (Picker)
```

**L414**

```
* כותרת: "מי קיבל את החפץ?"
```

**L415**

```
* תיאור: "סימון מקבל יזכה אותו בנקודה בסטטיסטיקה האישית."
```

**L416**

```
* רשימת משתמשים שיצרו שיחה איתי על הפוסט – Picker עם תמונה + שם.
```

**L417**

```
* כפתורים: "סמן וסגור" (ראשי) | "סגור ללא סימון" (משני).
```

**L419**

```
###### 6.4.3 שלב 3: הסבר חינוכי חד-פעמי
```

**L420**

```
* רק בפעם הראשונה (או עד שהמשתמש סימן "אל תציג שוב").
```

**L421**

```
* תיאור: "💡 איך עובד מנגנון הסגירה: פוסט עם סימון מקבל יישמר תמיד. פוסט בלי סימון יימחק אחרי 7 ימים. בכל מקרה, הסטטיסטיקה האישית שלך מתעדכנת."
```

**L422**

```
* Toggle: "אל תציג לי שוב את ההסבר הזה".
```

**L423**

```
* כפתור: "הבנתי".
```

**L425**

```
###### 6.4.4 הודעת אישור סופית
```

**L426**

```
* **אם נסגר עם סימון:** "🎉 הפוסט נסגר. תודה ש[שם המקבל] קיבל ממך!"
```

**L427**

```
* **אם נסגר ללא סימון:** "✅ הפוסט נסגר. הוא יימחק תוך 7 ימים."
```

**L429**

```
##### 6.5 מודל פתיחה מחדש (Reopen Modal)
```

**L430**

```
* כותרת: "לפתוח מחדש את הפוסט?"
```

**L431**

```
* תיאור: "הפוסט יחזור לפיד הראשי. סטטיסטיקות יתעדכנו בהתאם."
```

**L432**

```
    * אם נסגר עם סימון מקבל: "המקבל המסומן יקבל הודעה שהסימון בוטל."
```

**L433**

```
* כפתורים: "פתח מחדש" (ראשי) | "ביטול" (משני).
```

**L435**

```
##### 6.6 ממשק סופר אדמין (חבוי בתוך צ'אט)
```

**L436**

```
* **תיאור:** הסופר אדמין רואה הודעות מערכת בתוך הצ'אט הרגיל שלו (4.1, 4.2). אין מסך נפרד.
```

**L437**

```
* **תוכן הודעת מערכת:**
```

**L438**

```
    * **דיווח על תוכן:** "🚨 דיווח חדש על [פוסט / משתמש / שיחה] [לינק]" + סיבה / מדווח / זמן (יישור P0 #6 – ב-MVP אין "תגובה" כי אין Comments).
```

**L439**

```
    * **דיווח בעיה מהגדרות:** "💬 דיווח בעיה מהגדרות" – מזהה מדווח, תוכן הטקסט (וקטגוריה אם נבחרה), זמן; מקושר לשיחה 1:1 עם אותו משתמש.
```

**L440**

```
    * (אחרי 3 דיווחים על אותו פריט תוכן): "הפריט הוסר אוטומטית. רוצה לבטל?" + כפתור "↩️ שחזר".
```

**L441**

```
* **רק חשבון** עם כתובת `karmacommunity2.0@gmail.com` רואה הודעות מערכת אלו.
```

**L443**

```
##### 6.3 מסך שגיאה (Error / Empty State)
```

**L444**

```
* **תיאור:** מסך גנרי כשאין תוכן או יש שגיאת רשת.
```

**L445**

```
* **רכיבים:** איור + הודעה + כפתור "נסה שוב" / "חזרה".
```

**L449**

```
### 5.3 מטריצת מסכים → פיצ'רים → זרימות (Traceability)
```

**L451**

```
> יישור P3 #32: כל מסך מקושר גם לפיצ'ר ב-03 וגם לזרימה רלוונטית ב-04 (אם קיימת).
```

**L453**

```
| מסך              | פיצ'ר ב-[`03_Core_Features.md`](./03_Core_Features.md) | זרימה ב-[`04_User_Flows.md`](./04_User_Flows.md) |
```

**L455**

```
| 1.1              | 3.1.1 אפשרויות התחברות                                  | זרימה 1, זרימה 1.1                               |
```

**L456**

```
| 1.2              | 3.1.1                                                  | זרימה 1, 1.1, 2                                  |
```

**L457**

```
| 1.3              | 3.1.1 (OTP)                                            | זרימה 1, 2                                       |
```

**L458**

```
| 1.4              | 3.1.2 Onboarding                                        | זרימה 1                                          |
```

**L459**

```
| 1.5              | 3.1.2                                                  | זרימה 1                                          |
```

**L460**

```
| 1.6              | 3.1.2                                                  | זרימה 1                                          |
```

**L461**

```
| **1.7**          | **3.3.1.4 Guest Preview**                              | **זרימה 1.1**                                    |
```

**L462**

```
| 2.1              | 3.3.1 פיד ראשי                                         | זרימה 3                                          |
```

**L463**

```
| 2.2              | 3.3.2 חיפוש, סינון ומיון                               | זרימה 3                                          |
```

**L464**

```
| 2.3              | 3.3.4 פרטי פוסט                                        | זרימות 3, 6                                      |
```

**L465**

```
| 2.4              | 3.3.3 יצירת פוסט                                       | זרימות 4, 5, 10                                  |
```

**L466**

```
| **2.5**          | **D-16 / `FR-FEED-016` (Search placeholder)**          | (אין זרימה ייעודית — CTA לפיד)                  |
```

**L467**

```
| **2.6**          | **D-16 / `FR-DONATE-001..002` (Donations Hub)**        | (אין זרימה ייעודית — ניווט בלבד)                |
```

**L468**

```
| **2.7**          | **D-16 / `FR-DONATE-003` (Money sub-screen)**          | (אין זרימה ייעודית — קישור חיצוני)              |
```

**L469**

```
| **2.8**          | **D-16 / `FR-DONATE-004` + `FR-CHAT-007` (Time + volunteer composer)** | זרימה 9 (ב) — שיחה עם סופר אדמין            |
```

**L470**

```
| 3.1              | 3.2.1 פרופיל אישי                                      | זרימות 7, 14                                     |
```

**L471**

```
| 3.2              | 3.2.5 עריכת פרופיל                                     | (תחזוקה)                                         |
```

**L472**

```
| 3.3              | 3.2.2 פרופיל אחר + 3.2.3 מצב פרטיות                    | זרימה 8, 13                                      |
```

**L473**

```
| 3.4              | 3.2.4 עוקבים (כולל הסרת עוקב)                          | זרימה 14                                         |
```

**L474**

```
| 4.1              | 3.4.2 רשימת שיחות                                      | זרימה 6, 9                                       |
```

**L475**

```
| 4.2              | 3.4.3 מסך שיחה                                          | זרימה 6, 9                                       |
```

**L476**

```
| 5.1              | 3.5 הגדרות (כולל קטגוריית פרטיות)                       | זרימה 9 (ב), 11, 12                              |
```

**L477**

```
| 5.2              | 3.6 סטטיסטיקות                                          | זרימה 11                                         |
```

**L478**

```
| 5.3              | 3.5 (חסימות מתוך הגדרות)                               | זרימה 9 (ג)                                      |
```

**L479**

```
| **5.4**          | **3.2.4 (בקשות עקיבה לפרופיל פרטי)**                    | זרימה 13                                         |
```

**L480**

```
| 6.1              | מודרציה (חוצה)                                         | זרימה 9 (א)                                      |
```

**L481**

```
| 6.1b             | תמיכה (3.5)                                            | זרימה 9 (ב)                                      |
```

**L482**

```
| 6.2              | אישור פעולה (חוצה)                                     | זרימות 4א, 9 (ג), 14, 12                         |
```

**L483**

```
| 6.3              | מצב שגיאה (חוצה)                                       | (כל הזרימות)                                     |
```

**L484**

```
| 6.4              | 3.3.6 סגירת פוסט                                       | זרימה 7 חלק א                                   |
```

**L485**

```
| 6.5              | 3.3.6 ב Reopen                                          | זרימה 7 חלק ב                                   |
```

**L486**

```
| 6.6              | 2.2 סופר אדמין (אין UI ייעודי)                          | זרימה 9 (ד)                                      |
```

**L490**

```
*הפרק הבא: [6. ניווט ומבנה האפליקציה](./06_Navigation_Structure.md)*
```

**L491**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/06_Navigation_Structure.md`

**L3**

```
## 📐 6. ניווט ומבנה האפליקציה (MVP)
```

**L5**

```
הניווט ב-MVP **מצומצם בכוונה** ל-2 ברים בלבד: עליון ותחתון. ההחלטה מבוססת על דרישת המשתמש המפורשת ועל הגיון UX:
```

**L7**

```
* **בר תחתון = ניווט בסיסי** (היכן אני באפליקציה).
```

**L8**

```
* **בר עליון = פעולות מהירות** (צ'אט והגדרות).
```

**L12**

```
### 6.1 בר ניווט תחתון (Bottom Tab Bar)
```

**L14**

```
> **5 לשוניות** (עודכן ב-D-16, 2026-05-09: שתי הלשוניות הנוספות הן 🔍 חיפוש ו-💝 תרומות).
```

**L16**

```
| מיקום (RTL) | אייקון | שם               | מסך ברירת מחדל                                    | תיאור                                 |
```

**L18**

```
| 1 (ימין)    | 👤     | פרופיל           | [3.1 My Profile](./05_Screen_UI_Mapping.md)       | הפרופיל של המשתמש המחובר              |
```

**L19**

```
| 2           | 🔍     | חיפוש            | [2.5 Search](./05_Screen_UI_Mapping.md)           | מסך חיפוש (placeholder ל-MVP, מנוע אוניברסלי בעתיד) |
```

**L20**

```
| 3 (מרכז)    | ➕      | פלוס (פוסט חדש)  | [2.4 Create Post](./05_Screen_UI_Mapping.md)      | יצירת פוסט (טוגל לתת/לבקש)            |
```

**L21**

```
| 4           | 💝     | תרומות           | [2.6 Donations Hub](./05_Screen_UI_Mapping.md)    | מרכז התרומות — חפצים / זמן / כסף      |
```

**L22**

```
| 5 (שמאל)    | 🏠     | בית              | [2.1 Home Feed](./05_Screen_UI_Mapping.md)        | הפיד הראשי                            |
```

**L24**

```
> **הערה לסדר:** בעברית RTL, הסדר הוויזואלי מימין לשמאל הוא: **פרופיל ← חיפוש ← פלוס ← תרומות ← בית**. בקובצי קוד פרונטנד, הניווט ייושם כך שייראה זהה למשתמש בעברית (יישור RTL).
```

**L26**

```
#### 6.1.1 התנהגות הלשוניות
```

**L27**

```
* **בית (🏠)** – ברירת המחדל לאחר התחברות. מציג את הפיד.
```

**L28**

```
* **תרומות (💝)** – פותח את מסך מרכז התרומות (2.6) עם 3 אריחים: חפצים / זמן / כסף.
```

**L29**

```
* **פלוס (➕)** – הכפתור המרכזי, **בולט במיוחד** ויזואלית (גודל גדול יותר, צבע מודגש). פותח את מסך יצירת הפוסט.
```

**L30**

```
* **חיפוש (🔍)** – פותח את מסך החיפוש (2.5). ב-MVP זהו placeholder עם CTA לפיד; המנוע האוניברסלי יושק ב-P2.
```

**L31**

```
* **פרופיל (👤)** – מציג את הפרופיל של המשתמש המחובר.
```

**L33**

```
#### 6.1.2 חיווי הלשונית הפעילה
```

**L34**

```
* האייקון של הלשונית הפעילה צבוע במלא; האחרים בקווי מתאר.
```

**L35**

```
* **ללא תוויות טקסט מתחת לאייקונים** של 4 הלשוניות הצדדיות — האייקון לבדו מספק חיווי. הכפתור המרכזי "+" נשאר מעגל בולט (אין לו תווית ממילא).
```

**L36**

```
* כשהטאב המרכזי "+" פעיל, הסימן "+" נצבע לבן על רקע כתום מלא — לעולם לא נעלם.
```

**L38**

```
#### 6.1.3 התאמה למסכים קטנים
```

**L39**

```
* ב-5 לשוניות יש פחות נשימה בין אייקונים מאשר ב-3. כל לשונית עדיין שומרת על מטרת מגע ≥44×44.
```

**L40**

```
* TD-111 (FE) — אם נראה בעיות tap-error בטלפונים <320px, נשקול הקטנת ה-padding האופקי.
```

**L44**

```
### 6.2 בר ניווט עליון (Top Bar)
```

**L46**

```
> **2 אייקונים בלבד** – בהתאמה לדרישת המשתמש.
```

**L48**

```
| מיקום | אייקון | שם       | פותח                                                   | חיווי                              |
```

**L50**

```
| ימין  | 💬     | צ'אטים   | [4.1 Chat List](./05_Screen_UI_Mapping.md)            | Badge עם מספר הודעות לא נקראות     |
```

**L51**

```
| שמאל  | ⚙️     | הגדרות   | [5.1 Settings](./05_Screen_UI_Mapping.md)             | אין                                |
```

**L53**

```
#### 6.2.1 התנהגות הבר העליון
```

**L54**

```
* הבר העליון **קבוע** בכל המסכים הראשיים (בית, פרופיל, צ'אט, הגדרות).
```

**L55**

```
* **לא קיים** במסכי גלילה פנימיים שיש בהם כפתור "חזרה" (כמו פרטי פוסט, יצירת פוסט, פרופיל אחר). שם הבר מוחלף בכותרת מסך + כפתור חזרה.
```

**L59**

```
### 6.3 דיאגרמת ניווט – מפת המסכים
```

**L66**

```
│            תוכן המסך הפעיל (Home / Donations / ...)          │
```

**L73**

```
מפת ניווט פנימי:
```

**L100**

```
                                       │                   ├──→ [Follow Requests (5.4)] (רק כשפרטי)
```

**L102**

```
                                       ├──→ [📩 דווח על בעיה] ──→ [Chat with Super Admin]
```

**L103**

```
                                       ├──→ [⚖️ משפטי]
```

**L108**

```
> **יישור P2 #19:** מפת הניווט מכסה את **כל** הפריטים שמופיעים ב-5.1 Settings, כולל קטגוריית פרטיות, בקשות עקיבה (5.4), ודווח על בעיה.
```

**L112**

```
### 6.4 מה **אין** בניווט ב-MVP
```

**L114**

```
> השוואה ל-[`../PRD_HE_V2/06_Navigation_Structure.md`](../PRD_HE_V2/06_Navigation_Structure.md).
```

**L115**

```
> **עודכן ב-D-16 (2026-05-09):** לשוניות "💝 תרומות" ו-"🔍 חיפוש" *הוחזרו* ל-MVP (ראה §6.1). מה שעדיין אין:
```

**L117**

```
| רכיב ב-V2                               | סטטוס ב-MVP    | הסבר                                          |
```

**L119**

```
| לשונית "💝 תרומות" (עולמות תרומה)        | ✅ (חלקי)       | קיימת, אך זמן/כסף הם coming-soon עם קישורי שותפים חיצוניים (ראה 2.6, 2.7, 2.8) |
```

**L120**

```
| לשונית "🔍 חיפוש" נפרדת + AI             | ✅ (placeholder) | קיימת כ-tab; המנוע האוניברסלי דחוי ל-P2. החיפוש בפיד נשאר זמין (`FR-FEED-003`) |
```

**L121**

```
| מנוע חיפוש אוניברסלי (אנשים + חפצים + קטגוריות) | ❌ (P2)         | מסך 2.5 הוא placeholder; המנוע יושק בסוף ה-MVP |
```

**L122**

```
| תרומה כספית native + תרומת זמן native     | ❌              | ב-MVP אנו מפנים לשותפים חיצוניים בלבד (`jgive`, `we-me`) |
```

**L123**

```
| אייקון התראות (🔔) בבר עליון              | ❌              | התראות Push בלבד, אין מסך התראות מרוכז         |
```

**L124**

```
| אייקון אודות (ℹ️) בבר עליון               | ❌              | "אודות" נמצא בתוך הגדרות                       |
```

**L125**

```
| תפריט Admin                             | ❌              | אין UI אדמין ב-MVP                            |
```

**L126**

```
| תפריט CRM / Org Dashboard               | ❌              | אין ארגונים                                    |
```

**L130**

```
### 6.5 התאמה ל-RTL (עברית)
```

**L132**

```
* **כל האפליקציה ב-RTL** ב-MVP.
```

**L133**

```
* כפתור "חזרה" בכותרות מסכים פנימיים: חץ ימני (←).
```

**L134**

```
* גלילה אופקית של תמונות בפוסט: swipe ימינה=הבא.
```

**L135**

```
* הבר התחתון: סדר ויזואלי (מימין לשמאל) – פרופיל, פלוס, בית.
```

**L136**

```
* הבר העליון: סדר ויזואלי (מימין לשמאל) – צ'אט, (כותרת אם יש), הגדרות.
```

**L140**

```
### 6.7 תמיכה רב-פלטפורמית (Cross-Platform Strategy)
```

**L142**

```
> **תיקון P2 #20:** סעיף זה היה מסומן בעבר כ-6.6 וגרם לכפילות עם "מצבי ניווט מיוחדים". מספור עודכן ל-6.7 כדי לאפשר עיגונים יציבים.
```

**L144**

```
ה-MVP חייב לתמוך בכל הפלטפורמות העיקריות מהיום הראשון. המערכת תיבנה כך שהיא **רספונסיבית** ומותאמת לכל סוגי המסכים.
```

**L146**

```
#### 6.7.1 פלטפורמות נתמכות
```

**L147**

```
| פלטפורמה   | סטטוס MVP | הערות                                                              |
```

**L149**

```
| **iOS**    | ✅         | iPhone (גדלי מסך 4.7" עד 6.9") + iPad (אופציונלי, רספונסיבי)        |
```

**L150**

```
| **Android**| ✅         | טלפונים (כל הגדלים) + טאבלטים (רספונסיבי)                          |
```

**L151**

```
| **Web**    | ✅         | רספונסיבי – דסקטופ / לפטופ / טאבלט / מובייל ווב                     |
```

**L153**

```
#### 6.7.2 גדלי מסך נתמכים (Breakpoints)
```

**L154**

```
| Breakpoint    | טווח רוחב     | התאמת UI                                                         |
```

**L156**

```
| Mobile Small  | < 375px       | טלפונים קטנים – פוסטים בעמודה אחת, פונטים מוקטנים                 |
```

**L157**

```
| Mobile        | 375px–767px   | טלפונים סטנדרטיים – ברירת מחדל לעיצוב                            |
```

**L158**

```
| Tablet        | 768px–1024px  | טאבלטים – פוסטים ב-2 עמודות, ברים גדולים יותר                     |
```

**L159**

```
| Desktop       | 1025px–1440px | אינטרנט בדסקטופ – פוסטים ב-3 עמודות, סייד-בר אופציונלי             |
```

**L160**

```
| Desktop Large | > 1440px      | מסכים גדולים – פוסטים ב-4 עמודות, רוחב מקסימום container 1280px   |
```

**L162**

```
#### 6.7.3 התאמות ספציפיות לכל פלטפורמה
```

**L165**

```
* **בר ניווט תחתון** קבוע (Bottom Tabs).
```

**L166**

```
* **בר ניווט עליון** קבוע (Top Bar עם 2 אייקונים).
```

**L167**

```
* **כפתורים גדולים** מותאמי מגע (≥ 44x44 px).
```

**L168**

```
* **גלילה אינסופית** בפיד.
```

**L169**

```
* **אנימציות מעבר** בין מסכים.
```

**L172**

```
* **שמירה על הניווט המובייל** (Bottom + Top Bar) במצב דיוקן.
```

**L173**

```
* בנוף (landscape): אופציה ל-**Side Navigation** במקום Bottom Bar.
```

**L174**

```
* פוסטים ב-2 עמודות.
```

**L177**

```
* **ניווט שונה:** הבר התחתון מוחלף ב-**Sidebar שמאלי** (RTL: ימני) עם 3 הלשוניות + 2 פריטי הבר העליון.
```

**L178**

```
* **רוחב Container מקסימלי:** 1280px במרכז המסך, רקע מסביב.
```

**L179**

```
* **תמיכת מקלדת:** קיצורי דרך (`/` לחיפוש, `c` לצ'אט, `+` לפוסט חדש).
```

**L180**

```
* **Hover states** ויזואליים על אלמנטים אינטראקטיביים.
```

**L181**

```
* **פוסטים ב-3 עמודות** ב-1024px+, **ב-4 עמודות** ב-1440px+.
```

**L182**

```
* **לא מציג כפתור "Camera" ביצירת פוסט** – רק "העלאה מהמחשב".
```

**L183**

```
* **Push Notifications:** דרך Web Push API (כל המודרניים תומכים).
```

**L185**

```
#### 6.7.4 קונבנציות צד-כתיבה ארכיטקטוניות (לפיתוח)
```

**L186**

```
* **Codebase יחיד** (React Native + React Native Web, או דומה) שמייצר 3 בילדים: iOS, Android, Web.
```

**L187**

```
* **Component-Based Design**: כל רכיב מקבל props של גודל ופלטפורמה ומתאים את עצמו.
```

**L188**

```
* **Native APIs בתנאי**: שימוש ב-`Platform.OS` כשנדרש (לדוגמה: SSO Apple רק ב-iOS).
```

**L189**

```
* **Storage:** לוקאלי לפי הפלטפורמה: AsyncStorage במובייל, localStorage בווב, SecureStore לטוקנים.
```

**L190**

```
* **Deep Links:** תמיכה גם ב-iOS Universal Links / Android App Links / Web URLs.
```

**L192**

```
#### 6.7.5 פלטפורמות שלא נתמכות ב-MVP
```

**L193**

```
* ❌ Smart TV (Apple TV, Android TV) – לא רלוונטי.
```

**L194**

```
* ❌ Apple Watch / Wear OS – לא רלוונטי לפעולה ראשית.
```

**L195**

```
* ❌ Windows / macOS Native Apps – ה-Web מספיק.
```

**L196**

```
* ❌ דפדפנים ישנים (IE 11, ש-Firefox פחות מגרסה 100, וכו'). מינימום: Chrome 100+, Safari 14+, Firefox 100+, Edge 100+.
```

**L200**

```
### 6.8 מצבי ניווט מיוחדים
```

**L202**

```
> **תיקון P2 #20:** סעיף זה היה מסומן בעבר כ-6.6 וגרם לכפילות עם "Cross-Platform Strategy". המספור עודכן ל-6.8.
```

**L204**

```
#### 6.8.1 משתמש לא מאומת (יישור P0 #2)
```

**L205**

```
* **מסלול ברירת מחדל:** רואה רק [1.1 Splash](./05_Screen_UI_Mapping.md). כל ניסיון לגישה למסך אחר (Deep Link, רענון URL) → הפניה ל-1.2 Auth.
```

**L206**

```
* **מסלול אורח** (אחרי לחיצה על "צפה כאורח" ב-1.1): מותר לראות **את 1.7 Guest Preview Feed בלבד**, במצב קריאה בלבד. כל ניסיון אינטראקציה (לחיצה על פוסט / משתמש / סנן / "+" / שליחת הודעה / עקיבה / דיווח) **מציג Overlay ומעביר ל-1.2 Auth** (יישור עם 03 §3.3.1.4 ועם זרימה 1.1 ב-04).
```

**L207**

```
* **שני המסלולים** הם המסלולים המותרים היחידים למשתמש לא מאומת. אין גישה לשום מסך אחר ב-MVP.
```

**L209**

```
#### 6.8.2 משתמש בשלבי Onboarding
```

**L210**

```
* רואה רק את מסכי 1.4‑1.6 בסדר רציף.
```

**L211**

```
* **אין** בר תחתון או עליון בשלב זה (full-screen).
```

**L212**

```
* בסיום (Welcome Tour) → מעבר ל-2.1 Home + הצגת הברים.
```

**L214**

```
#### 6.8.3 משתמש שדילג על שם/עיר ב-Onboarding (יישור P2 #17)
```

**L215**

```
* **גישה לפיד וחיפוש** מותרת מלאה.
```

**L216**

```
* **כל פעולה הדורשת פרופיל פעיל** (יצירת פוסט, שליחת הודעה ראשונה, עקיבה, דיווח, סגירת פוסט) → חוסמת ופותחת מודל "השלם פרופיל" → 3.2 Edit Profile (ראה זרימה 1 ב-04).
```

**L218**

```
#### 6.8.4 חזרה מ-Background
```

**L219**

```
* המשתמש חוזר למצב האחרון שבו היה.
```

**L220**

```
* **חריג:** אם עברו >24 שעות – חזרה ל-2.1 Home.
```

**L224**

```
*הפרק הבא: [7. כללים עסקיים](./07_Business_Rules.md)*
```

**L225**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/07_Business_Rules.md`

**L3**

```
## 📋 7. כללים עסקיים (MVP)
```

**L5**

```
> מסמך זה מאחד את הכללים העסקיים החיוניים ל-MVP בלבד. כל כלל הוא **מקודד**: `R-MVP-{תחום}-{מספר}`. החזון הרחב כולל כללים מורכבים יותר ([`../PRD_HE_V2/07_Business_Rules.md`](../PRD_HE_V2/07_Business_Rules.md)) שאינם רלוונטיים ל-MVP.
```

**L9**

```
### 7.1 כללי ליבה כלליים
```

**L11**

```
| מזהה             | כלל                                                                                              |
```

**L13**

```
| **R-MVP-Core-1** | **חינם תמיד.** אסור שיועבר כסף, חליפין, או "השתתפות בהוצאות" בין משתמשים. הפרה = הסרת פוסט וחסימת חשבון. |
```

**L14**

```
| **R-MVP-Core-2** | **משתמש חייב להיות רשום** כדי לבצע כל פעולה. אורח רואה רק 3 פוסטים, ואז Overlay הצטרפות.            |
```

**L15**

```
| **R-MVP-Core-3** | **אין דרישת גיל מינימום ב-MVP.** אין אימות גיל ואין הצהרת גיל בהרשמה.                            |
```

**L16**

```
| **R-MVP-Core-4** | **שפה: עברית בלבד.** האפליקציה רצה ב-RTL. אנגלית תיתמך בגרסה עתידית. ארכיטקטורת i18n מההתחלה.       |
```

**L17**

```
| **R-MVP-Core-5** | **גיאוגרפיה: ישראל בלבד.** רשימת הערים מוגבלת לערים בישראל.                                       |
```

**L18**

```
| **R-MVP-Core-6** | משתמש יכול להחזיק **חשבון אחד בלבד** (לפי טלפון / מייל / Google ID). אין חשבונות כפולים.            |
```

**L19**

```
| **R-MVP-Core-7** | **רב-פלטפורמיות חובה:** iOS + Android + Web. עיצוב רספונסיבי לכל גודל מסך (מובייל קטן עד דסקטופ גדול). ראה [`06_Navigation_Structure.md#6.7`](./06_Navigation_Structure.md) (תוקן P2 #20: מספור הסעיף עודכן מ-6.6 ל-6.7). |
```

**L20**

```
| **R-MVP-Core-8** | **שלוש שיטות אימות ליבה:** Google SSO / טלפון OTP / מייל + סיסמה. **ב-iOS:** חובה גם **Sign in with Apple** לצד Google SSO (App Store Guidelines). אין שילוב חשבונות ב-MVP. |
```

**L21**

```
| **R-MVP-Core-9** | **אין וי כחול / אימות זהות מורחב.** כל משתמש שאימת לפי אחת משיטות האימות המותרות בפלטפורמה = משתמש מלא.                       |
```

**L25**

```
### 7.2 כללי פוסטים ופרסום
```

**L27**

```
| מזהה               | כלל                                                                                                       |
```

**L29**

```
| **R-MVP-Items-1**  | **תמונת חפץ: חובה ב"לתת"; אופציונלית ב"לבקש"** (יישור P1 #11). תמונת **פרופיל** היא אופציונלית תמיד (R-MVP-Profile-1). במצב "לבקש" ללא תמונה – הפיד מציג אייקון קטגוריה ברירת מחדל. |
```

**L30**

```
| **R-MVP-Items-2**  | **קטגוריה חובה.** הפוסט חייב להיות משויך לאחת מ-10 הקטגוריות. **ברירת המחדל: "אחר".**                      |
```

**L31**

```
|                    | רהיטים / בגדים / ספרים / משחקים / ציוד תינוקות / מטבח / ספורט / חשמל / כלי עבודה / **אחר (ברירת מחדל)**    |
```

**L32**

```
| **R-MVP-Items-3**  | **בעל הפוסט הוא היחיד** שיכול לערוך, למחוק, או לסמן "נמסר".                                                |
```

**L33**

```
| **R-MVP-Items-4**  | **סגירת פוסט (נמסר):** הפוסט נסגר רק אחרי שהחפץ **נמסר בפועל** (לא אחרי תיאום או "שידוך"). שני מסלולי סגירה: |
```

**L34**

```
|                    | * **עם סימון מקבל** → סטטוס `closed_delivered`, נשמר תמיד אצל הבעל ואצל המקבל. **נספר ב-North Star** (KPI 1.5.1). |
```

**L35**

```
|                    | * **ללא סימון מקבל** → סטטוס `deleted_no_recipient`, נמחק לחלוטין תוך 7 ימים. **לא נספר ב-North Star**, אך **כן** מעדכן את "חפצים שמסרתי" של הבעל (R-MVP-Items-15). |
```

**L36**

```
| **R-MVP-Items-5**  | **משך פוסט פעיל ברירת מחדל: 300 ימים.** לאחר מכן הפוסט עובר אוטומטית לסטטוס `expired`. המשתמש מקבל התראה 7 ימים לפני. **מחזור חיי `expired` (P2 #24):** נשמר בלשונית "פוסטים סגורים" של הבעל; ניתן ל-Reopen (חוזר ל-`open` עם 300 ימים חדשים), Edit+Reopen, או Delete ידני. **לא** מופיע בפילטר "כולל סגורים" של הפיד. |
```

**L37**

```
| **R-MVP-Items-6**  | **פתיחה מחדש של פוסט (Reopen) – חלונות זמן (יישור P1 #14):** |
```

**L38**

```
|                    | * `closed_delivered` → ללא הגבלת זמן. |
```

**L39**

```
|                    | * `deleted_no_recipient` → **רק במהלך 7 ימים מהסגירה**. אחרי 7 ימים הפוסט נמחק לצמיתות. |
```

**L40**

```
|                    | * `expired` → ללא הגבלת זמן. |
```

**L41**

```
|                    | * `removed_admin` → לא ניתן ע"י המשתמש; רק שחזור ע"י סופר אדמין. |
```

**L42**

```
|                    | אם נסגר עם סימון מקבל – המקבל מקבל התראה שהסימון בוטל. הסטטיסטיקות מתעדכנות בהתאם. |
```

**L43**

```
| **R-MVP-Items-7**  | **5+ פתיחות מחדש לפוסט אחד = Suspect**. הפוסט עולה לבדיקת אדמין.                                            |
```

**L44**

```
| **R-MVP-Items-8**  | **מקסימום פוסטים פעילים בו-זמנית: 20 לכל משתמש.** למניעת ספאם.                                              |
```

**L45**

```
| **R-MVP-Items-9**  | **אסור פרסום פריטים מסוכנים:** כלי נשק, חומרים מסוכנים, סמים, פריטים לא חוקיים, חיות חיות.                  |
```

**L46**

```
| **R-MVP-Items-10** | **אסור פרסום פריטים שהם בפועל למכירה.** **מנגנון זיהוי ב-MVP (יישור P2 #25):** הזיהוי הוא **תלוי-קהילה** (Community-driven), **לא** אוטומטי או מבוסס-מילון. כל משתמש שמזהה פוסט כזה רשאי לדווח עליו (סיבה: "מטעה" / "לא חוקי" / "אחר" + טקסט חופשי). מ-3 דיווחים = הסרה אוטומטית (R-MVP-Privacy-5). זיהוי מבוסס-NLP/AI/regex של מחיר נדחה ל-V2. |
```

**L47**

```
| **R-MVP-Items-11** | **כל פוסט מציג חובה:** תג ברור 🎁 לתת / 🔍 לבקש. אסור פוסט בלי טוגל מפורש.                                    |
```

**L48**

```
| **R-MVP-Items-12** | **רמת חשיפת פוסט – 3 רמות:** 🌍 פומבי (ברירת מחדל) / 👥 רק עוקבים שלי / 🔒 רק אני (פרטי). **רמת "רק עוקבים שלי" זמינה אך ורק כאשר הפרופיל פרטי** (R-MVP-Profile-9). רמת "רק אני" זמינה תמיד. **לאחר פרסום ניתן רק להעלות חשיפה** (ראה R-MVP-Privacy-9), לא להוריד. |
```

**L49**

```
| **R-MVP-Items-13** | **כתובת מלאה חובה למילוי בכל פוסט** (עיר + רחוב + מספר), בשני מצבי הפוסט – לתת ולבקש (יישור P0 #5 עם 03 §3.3.3 א'). **רמת חשיפת המיקום בפיד נבחרת ע"י המפרסם** – ראה R-MVP-Privacy-1. **אין איסוף או שמירת קואורדינטות GPS** (R-MVP-Safety-4). |
```

**L50**

```
| **R-MVP-Items-14** | **פוסט "🔒 רק אני" (פרטי):** **נספר** במכסת R-MVP-Items-8 (20 פוסטים פעילים), כי הוא תופס משאב במערכת. **לא** מופיע בפיד הראשי. **לא** נכלל במונה הפוסטים הפעילים *הציבורי* של הפרופיל (כדי לא לחשוף לזרים שיש "פוסטים נסתרים"). **כן** נכלל במונה הפנימי של הבעל ומופיע בלשונית "פוסטים פעילים" שלו עם תג "🔒 פרטי – רק אני". |
```

**L51**

```
| **R-MVP-Items-15** | **קשר בין סטטוסי סגירה ל-KPIs (יישור P1 #8):** |
```

**L52**

```
|                    | * **North Star** (1.5.1) = `count(closed_delivered)`. **לא** כולל `deleted_no_recipient`. |
```

**L53**

```
|                    | * **כרטיס "חפצים שמסרתי"** (3.6) = `count(closed_delivered) + count(deleted_no_recipient)` של הבעל. |
```

**L54**

```
|                    | * **כרטיס "חפצים שקיבלתי"** (3.6) = `count(closed_delivered)` שבהם המשתמש סומן כמקבל. |
```

**L55**

```
|                    | * הפער מנוצל בכוונה: סטטיסטיקה אישית של הבעל מתגמלת גם סגירות ללא סימון, אבל KPI עסקי דורש אישור דו-צדדי. |
```

**L59**

```
### 7.3 כללי בטיחות ופרטיות
```

**L61**

```
| מזהה                 | כלל                                                                                                                            |
```

**L63**

```
| **R-MVP-Privacy-1**  | **הפרדת איסוף ↔ הצגה ↔ שמירה (יישור P2 #22):** |
```

**L64**

```
|                      | * **איסוף:** כתובת מלאה (עיר + רחוב + מספר) **חובה למילוי בכל פוסט**, גם "לתת" וגם "לבקש". |
```

**L65**

```
|                      | * **הצגה לציבור:** רמה נבחרת ע"י המפרסם – עיר בלבד / עיר + רחוב (ברירת מחדל) / כתובת מלאה. ניתן לשנות אחרי פרסום. |
```

**L66**

```
|                      | * **שמירה ב-DB:** הכתובת המלאה נשמרת תמיד (כדי לאפשר שינוי הצגה לאחר פרסום). |
```

**L67**

```
|                      | * **GPS / קואורדינטות:** **לא נאספות, לא נשמרות, לא משמשות למיון** (R-MVP-Safety-4). מיון "קרוב גיאוגרפית" מבוסס על שם העיר בלבד. |
```

**L68**

```
|                      | * **רטנציה:** הכתובת נמחקת יחד עם הפוסט בכל מסלול מחיקה, ויחד עם המשתמש במחיקת חשבון (R-MVP-Privacy-6). |
```

**L69**

```
| **R-MVP-Privacy-2**  | **אין גילוי טלפון / מייל בפיד או בפרופיל הציבורי.** התקשרות מתבצעת רק בצ'אט הפנימי.                                              |
```

**L70**

```
| **R-MVP-Privacy-3**  | **חסימת משתמש** = המשתמש החסום לא רואה את הפוסטים שלי, ולא יכול לשלוח לי הודעות. הוא **לא יודע** שהוא חסום.                       |
```

**L71**

```
| **R-MVP-Privacy-4**  | **דיווח על תוכן** – זמין מכל פוסט / פרופיל / שיחה. כל דיווח נשלח כהודעת מערכת לחשבון הסופר אדמין (`karmacommunity2.0@gmail.com`). |
```

**L72**

```
| **R-MVP-Privacy-4a** | **דיווח בעיה כללית מהגדרות** – זמין ממסך הגדרות. יוצר/מעדכן שיחת צ'אט **1:1** בין המדווח לבין הסופר אדמין; נשלחת **הודעת מערכת** לאדמין עם פרטי הדיווח; **אין** ספירה לכלל "3 דיווחים = הסרה" (אין יעד תוכן מקושר). |
```

**L73**

```
| **R-MVP-Privacy-5**  | **3 דיווחים על אותו פריט = פעולה אוטומטית** (יישור P0 #6 ו-P1 #10). **ב-MVP יש 3 ישויות לדיווח** (אין "תגובה" כי אין Comments – ראה [`08#8.2.4`](./08_Out_of_Scope_and_Future.md)): |
```

**L74**

```
|                      | * **פוסט** → סטטוס `removed_admin`. הבעל מקבל התראה. |
```

**L75**

```
|                      | * **משתמש (פרופיל)** → השעיה זמנית 7 ימים (`suspended_temp`). דיווח רביעי בתוך 30 יום ← השעיה סופית (`suspended_perma`). |
```

**L76**

```
|                      | * **שיחת צ'אט שלמה** → `hidden_admin`; אם 3 הדיווחים נגד אותו צד ← השעיה זמנית של אותו צד. |
```

**L77**

```
|                      | בכל המקרים – הסופר אדמין מקבל הודעה ויכול לשחזר אם מצא תקין. |
```

**L78**

```
| **R-MVP-Privacy-6**  | **מחיקת חשבון** = מחיקת כל הפוסטים שלי, השיחות (מצדי), והפרופיל. אסור לשחזר.                                                    |
```

**L79**

```
| **R-MVP-Privacy-7**  | **אסור איסוף מידע מעבר לנדרש לפעולת המוצר.** הסכמת המשתמש לתנאי שימוש מקצרת ושקופה.                                              |
```

**L80**

```
| **R-MVP-Privacy-8**  | **שמירת סינון אחרון:** סינון/חיפוש שהמשתמש הפעיל נשמר מקומית (לוקאלית) ובסשן הבא נטען אוטומטית. ניתן לאיפוס דרך "נקה הכל".         |
```

**L81**

```
| **R-MVP-Privacy-9**  | **שינוי רמת חשיפת פוסט** לאחר פרסום: **רק להעלאה**. מעברים מותרים: 🔒 רק אני → 👥 רק עוקבים (אם הפרופיל פרטי) → 🌍 פומבי, או 🔒 רק אני → 🌍 פומבי, או 👥 רק עוקבים → 🌍 פומבי. **אסור** להוריד חשיפה (פומבי → כל דבר; עוקבים → רק אני). |
```

**L82**

```
| **R-MVP-Privacy-10** | **5 דיווחי שווא ע"י אותו משתמש בתוך 30 יום** → השעיה זמנית של 7 ימים על חשבון המדווח (יישור P2 #23). הגדרות מדויקות: |
```

**L83**

```
|                      | * **"דיווח שווא"** = דיווח שהסופר אדמין סגר עם תווית "🚫 דיווח שווא" אחרי בדיקה. |
```

**L84**

```
|                      | * **"5 ברצף"** = 5 דיווחי שווא **רצופים** ללא דיווח אחד שאומת ביניהם, **בתוך חלון נע של 30 יום**. |
```

**L85**

```
|                      | * **המדידה גלובלית למדווח** (לא לפי יעד), כי הבעיה היא ניצול לרעה כללי של מערכת הדיווחים. |
```

**L86**

```
|                      | * **בתקופת ההשעיה** דיווחים של המושעה לא נספרים בכלל R-MVP-Privacy-5 (אבל נשלחים לאדמין למעקב). |
```

**L87**

```
| **R-MVP-Privacy-11** | **פרופיל פרטי (R-MVP-Profile-9):** לזרים מוצגים אך ורק שדות הזיהוי (תמונה, שם, עיר, ביוגרפיה) ו**מספרי** עוקבים/נעקבים/פוסטים פעילים *ציבוריים*. רשימת הפוסטים, רשימת העוקבים ורשימת הנעקבים – **חסומות עד אישור עקיבה**. שליחת DM זמינה גם לזרים. |
```

**L88**

```
| **R-MVP-Privacy-12** | **דחיית בקשת עקיבה היא בשקט** – המבקש **לא מקבל התראה** על דחייה (מדיניות נגד הטרדה / לחץ חברתי). **Cooldown לבקשה חוזרת:** 14 יום לאחר דחייה. ביטול עצמי ע"י המבקש – ללא Cooldown. |
```

**L89**

```
| **R-MVP-Privacy-13** | **שינוי מצב פרטיות פרופיל ↔ חשיפת פוסטים – הפרדה מלאה (יישור P2 #27):** |
```

**L90**

```
|                      | * **שינוי מצב פרטיות פרופיל (פומבי ↔ פרטי) אינו משנה רטרואקטיבית את רמות החשיפה של פוסטים שכבר פורסמו** – פוסט פומבי שפורסם לפני שהפרופיל הפך לפרטי **נשאר פומבי**. |
```

**L91**

```
|                      | * **חשיפת פוסט בודד** ניתנת לשינוי אחרי פרסום **רק כלפי מעלה** (R-MVP-Privacy-9). הורדה אסורה. |
```

**L92**

```
|                      | * אם משתמש מתחרט על פוסט שפורסם בחשיפה רחבה – הפתרון היחיד הוא **מחיקת הפוסט ויצירתו מחדש** ברמה הרצויה. |
```

**L93**

```
|                      | * **מעבר פרטי → פומבי** מאשר אוטומטית את כל בקשות העקיבה הממתינות ומפיק התראה למבקשים. |
```

**L94**

```
|                      | * **מעבר פומבי → פרטי** משאיר את העוקבים הקיימים ללא שינוי; ניתן להסיר ידנית דרך רשימת העוקבים. |
```

**L98**

```
### 7.4 כללי צ'אט
```

**L100**

```
| מזהה             | כלל                                                                                                                |
```

**L102**

```
| **R-MVP-Chat-1** | **שיחות 1-על-1 בלבד.** אין צ'אט קבוצתי ב-MVP.                                                                       |
```

**L103**

```
| **R-MVP-Chat-2** | **רק טקסט ב-MVP.** אין שליחת תמונות, וידאו, קול, מיקום, או קבצים.                                                    |
```

**L104**

```
| **R-MVP-Chat-3** | **אין יצירת שיחה אקראית.** שיחה נפתחת רק מ-(א) פרטי פוסט, (ב) פרופיל משתמש אחר, או (ג) **דיווח בעיה** במסך הגדרות (שיחת תמיכה 1:1 עם הסופר אדמין). |
```

**L105**

```
| **R-MVP-Chat-4** | **מסר ראשון אוטומטי בפתיחה דרך פוסט:** *"היי! ראיתי את הפוסט שלך על [כותרת]. מעוניין/ת לדעת עוד."* ניתן לעריכה.      |
```

**L106**

```
| **R-MVP-Chat-5** | **חיווי "נקרא" (Read Receipt) פעיל לכולם.** אין אופציה לכבות.                                                         |
```

**L107**

```
| **R-MVP-Chat-6** | **אסור פרסום מוצרים/שירותים בצ'אט עם תשלום.** הצעת תשלום בצ'אט = דיווח אוטומטי.                                       |
```

**L111**

```
### 7.5 כללי פרופיל ועוקבים
```

**L113**

```
| מזהה                | כלל                                                                                                                          |
```

**L115**

```
| **R-MVP-Profile-1**  | **שם ועיר חובה** בפרופיל פעיל. תמונה אופציונלית.                                                                              |
```

**L116**

```
| **R-MVP-Profile-2**  | **עקיבה חד-כיוונית.** **בפרופיל פומבי** – מיידית ללא אישור. **בפרופיל פרטי** – דורשת אישור של בעל הפרופיל (R-MVP-Profile-10). |
```

**L117**

```
| **R-MVP-Profile-3**  | **אסור לעקוב אחרי משתמש חסום.**                                                                                               |
```

**L118**

```
| **R-MVP-Profile-4**  | **אין הגבלה על מספר עוקבים / נעקבים.**                                                                                        |
```

**L119**

```
| **R-MVP-Profile-5**  | **שם משתמש – ללא ייחודיות נדרשת.** ייתכנו כמה משתמשים עם אותו שם (טלפון/מייל/Google ID הוא המזהה הייחודי).                       |
```

**L120**

```
| **R-MVP-Profile-6**  | **ביוגרפיה: עד 200 תווים.** אסור קישורים חיצוניים בביוגרפיה (למניעת ספאם).                                                     |
```

**L121**

```
| **R-MVP-Profile-7**  | **פיד ועקיבה ב-MVP:** הפיד הראשי **כרונולוגי בלבד** — **אין** בוסט מיון לפי עקיבה ו**אין** תג "👥 ממשתמש שאתה עוקב" בכרטיס פוסט. |
```

**L122**

```
| **R-MVP-Profile-8**  | **פילטר "רק ממשתמשים שאני עוקב"** — **לא** ב-MVP; ניתן ל-V2.                                                                  |
```

**L123**

```
| **R-MVP-Profile-9**  | **מצב פרטיות פרופיל:** כל משתמש בוחר 🌍 פומבי (ברירת מחדל) או 🔒 פרטי. בחירה ב**הגדרות → פרטיות**, ניתן לשנות בכל עת. ההשלכות מפורטות ב-R-MVP-Privacy-11, R-MVP-Privacy-12, R-MVP-Privacy-13 (יישור P3 #31). **חיבור ל-R-MVP-Items-12:** רמת חשיפה "👥 רק עוקבים שלי" זמינה אך ורק כאשר הפרופיל פרטי. |
```

**L124**

```
| **R-MVP-Profile-10** | **מנגנון בקשת עקיבה (פרופיל פרטי):** המבקש שולח בקשה → בעל הפרופיל מאשר/דוחה דרך התראה או דרך 5.4. **בקשה ממתינה אינה מעניקה גישה** לפוסטים. אישור הופך אותו לעוקב מאושר; דחייה בשקט (R-MVP-Privacy-12). הבעל יכול גם **להסיר עוקב קיים** בכל עת מתוך רשימת העוקבים (ללא התראה למוסר). |
```

**L128**

```
### 7.6 כללי בטיחות מערכת
```

**L130**

```
| מזהה               | כלל                                                                                              |
```

**L132**

```
| **R-MVP-Safety-1** | **התראת חירום בצ'אט: לא ב-MVP.** במקרה דחוף, המשתמש יכול לפנות לתמיכה דרך **דיווח בעיה** בהגדרות (צ'אט עם הסופר אדמין) או מייל תמיכה אם קיים. |
```

**L133**

```
| **R-MVP-Safety-2** | **המוצר אינו אחראי על הפגישה הפיזית בין משתמשים.** הסכמה לתנאי שימוש מבהירה זאת.                    |
```

**L134**

```
| **R-MVP-Safety-3** | **לוגינג של פעולות רגישות** (מחיקה, חסימה, דיווח) למטרות חקירה במקרה של תלונה.                     |
```

**L135**

```
| **R-MVP-Safety-4** | **אין שמירה של מיקום משתמש** ב-MVP – רק עיר רשומה. אין GPS.                                       |
```

**L139**

```
### 7.7 הכרזות אסורות + תעדוף מדיניות הסרה (יישור P2 #26)
```

**L141**

```
> **מנגנון אחיד ב-MVP – אין הסרה מיידית אוטומטית.** כל הסרה ב-MVP מתבצעת באחד משני נתיבים, **לפי סדר עדיפות**:
```

**L143**

```
> 1. **נתיב אדמין ידני** (Override קודם) – הסופר אדמין יכול בכל עת להסיר פריט / להשעות משתמש דרך כפתורים מותני-הרשאה (ראה 02 §2.2). פעולה זו מיידית.
```

**L144**

```
> 2. **נתיב 3 דיווחים אוטומטי** (R-MVP-Privacy-5) – פריטים שהגיעו ל-3 דיווחים מאומתים מוסרים אוטומטית; הסופר אדמין יכול לשחזר.
```

**L146**

```
> **אין** מנגנון "הסרה מיידית" אוטומטית מבוסס-Keyword/AI ב-MVP. נדחה ל-V2.
```

**L148**

```
**הכרזות אסורות (Categories שמצפות לפעולת אדמין מהירה גם לפני 3 דיווחים):**
```

**L150**

```
* **תוכן המסית, מדיר, גזעני, או פוגעני** – אדמין מתבקש להסיר ידנית בעדיפות גבוהה ולחסום מפרסם.
```

**L151**

```
* **הצעת מוצר במחיר / חליפין** (R-MVP-Items-10) – אדמין מתבקש להסיר ידנית.
```

**L152**

```
* **שיתוף פרטי משתמש שאינם פומביים** ללא הסכמה – אדמין מתבקש להסיר ידנית + חסימה.
```

**L153**

```
* **פרסומות מסחריות / קישורים שיווקיים** בפוסטים – אדמין מתבקש להסיר ידנית.
```

**L154**

```
* **תוכן פורנוגרפי / מיני מפורש** – אדמין מתבקש להסיר ידנית + חסימה + דיווח לרשויות.
```

**L156**

```
> **המשמעות הפרקטית:** כל המקרים מגיעים דרך אותו זרם דיווחים → Inbox של הסופר אדמין → החלטת אדמין. ההבדל הוא **עדיפות הטיפול** (קטגוריה מסוכנת = טיפול מיידי), **לא** מנגנון טכני נפרד.
```

**L160**

```
### 7.8 השוואה ל-V2 – מה הוסר
```

**L162**

```
| כלל ב-V2                                                  | סטטוס ב-MVP | למה                                       |
```

**L164**

```
| R-Money-* (כל כללי הכסף)                                  | ❌           | אין עולם הכסף                             |
```

**L165**

```
| R-Food-* (תאריך תפוגה, אלרגנים)                           | ❌           | אין עולם המזון                            |
```

**L166**

```
| R-Med-* (וי כחול לרפואה, אדי, חירום)                      | ❌           | אין עולם הרפואה                           |
```

**L167**

```
| R-Housing-* (קוד התנהגות, וי כחול לדיור, כפתור חירום)     | ❌           | אין עולם הדיור                            |
```

**L168**

```
| R-Rides-* (השתתפות בהוצאות, רישיון)                       | ❌           | אין עולם הנסיעות                          |
```

**L169**

```
| R-Knowledge-* (אישור מנהלת)                               | ❌           | אין עולם הידע                             |
```

**L170**

```
| R-Time-* (שיוך לארגון)                                    | ❌           | אין עולם הזמן/התנדבות                     |
```

**L171**

```
| R-Animals-* / R-Env-* / R-Match-*                         | ❌           | עולמות שלא קיימים ב-MVP                   |
```

**L172**

```
| ועדת אימות וי כחול                                        | ❌           | אין וי כחול ב-MVP                         |
```

**L173**

```
| Audit Trail מלא                                            | ⚠️ חלקי     | רק לפעולות בעייתיות (חסימה, דיווח, מחיקה) |
```

**L174**

```
| 3 רמות אנונימיות                                           | ❌           | 3 רמות חשיפת פוסט (פומבי / עוקבים / רק אני) + 2 מצבי פרופיל (פומבי / פרטי). אין מוקדנים. |
```

**L175**

```
| גישור מוקדנים                                             | ❌           | אין מוקדנים                               |
```

**L179**

```
### 7.9 תקנון משתמש מקוצר ל-MVP
```

**L181**

```
המשתמש מאשר בעת ההרשמה:
```

**L183**

```
> 1. אני מתחייב לפרסם תוכן אמיתי ומדויק.
```

**L184**

```
> 2. אסור לי להציע או לבקש תשלום בפלטפורמה.
```

**L185**

```
> 3. אני מסכים לתנאי השימוש של הפלטפורמה.
```

**L186**

```
> 4. הפלטפורמה אינה אחראית על העסקאות שאעשה דרכה. אני אחראי על הבטיחות של עצמי.
```

**L187**

```
> 5. אני מסכים לכך שהמייל/טלפון שלי יישמר במאגר הפלטפורמה (לא ייחשף בפומבי).
```

**L188**

```
> 6. תוכן בעייתי שיתפרסם על ידי – יוסר מיידית, וייתכן וחשבוני יושעה.
```

**L192**

```
*הפרק הבא: [8. מה לא בתוך ה-MVP](./08_Out_of_Scope_and_Future.md)*
```

**L193**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/PRD_MVP_CORE_SSOT/08_Out_of_Scope_and_Future.md`

**L3**

```
## 🚫 8. מה **לא** ב-MVP – ומה הצפי לעתיד
```

**L5**

```
מסמך זה הוא מצפן: הוא מבהיר מה **באופן מודע** הושאר מחוץ לגרסה הראשונה ומה הצפי להוסיף בהמשך. **המטרה: למנוע scope creep.**
```

**L9**

```
### 8.1 חוקי המסך הקסום (Scope Discipline)
```

**L11**

```
לפני שמוסיפים פיצ'ר ל-MVP, הוא חייב לעבור **3 בדיקות**:
```

**L13**

```
1. **שאלת ה-PMF:** האם הפיצ'ר חיוני להוכיח את התזה ש"אנשים מוסרים ומקבלים חפצים בפלטפורמה"? אם לא → לא ל-MVP.
```

**L14**

```
2. **שאלת היחס:** האם הוצאת המאמץ עליו תורמת יותר מהוצאת אותו מאמץ על שיפור הליבה? אם לא → לא ל-MVP.
```

**L15**

```
3. **שאלת הסיכון:** האם בלעדיו תהיה תקלת בטיחות או חוויה שבירה לחלוטין? אם לא → לא ל-MVP.
```

**L17**

```
> **כלל אצבע:** רוב הפיצ'רים בחזון יתחילו את חייהם בגרסה V2+ (אחרי MVP מוצלח). אם MVP לא מוכיח PMF, אין טעם להוסיף פיצ'רים.
```

**L21**

```
### 8.2 פיצ'רים שיצאו מה-MVP – לפי מקור
```

**L23**

```
#### 8.2.1 מתוך עולמות התרומה (12 מ-13 הוסרו)
```

**L25**

```
| עולם                   | סטטוס MVP | תזמון משוער | רציונל לדחייה                                                        |
```

**L27**

```
| 💰 כסף                 | ❌         | V3+         | מורכבות רגולטורית גבוהה (PCI-DSS, סעיף 46), דורש שותפויות עם עמותות. |
```

**L28**

```
| 🍎 מזון                | ❌         | V2          | המעבר הטבעי הבא – אילוצי תאריך תפוגה דומים מבחינה לוגית לחפצים.       |
```

**L29**

```
| ⚕️ רפואה               | ❌         | V4+         | דרושה אינטגרציה עם מד"א, אדי, גופים רפואיים. רגולציה כבדה.            |
```

**L30**

```
| 🏠 דיור                | ❌         | V3+         | דורש וי כחול דו-צדדי, קוד התנהגות, כפתור חירום, ביקורות. מורכב.      |
```

**L31**

```
| 🚗 נסיעות              | ❌         | V2          | טוב כעולם הבא ביחד עם או אחרי מזון – משמש כתשתית לוגיסטית.            |
```

**L32**

```
| 📚 ידע                 | ❌         | V3+         | עולם איכותי אך פחות תכוף; אינו מהווה שימוש יומיומי.                   |
```

**L33**

```
| 🕒 זמן / התנדבות       | ❌         | V3+         | דורש מערך עמותות פעיל.                                                |
```

**L34**

```
| 🐾 בעלי חיים           | ❌         | V4+         | מצריך שיתופי פעולה עם עמותות אימוץ ופנסיון.                          |
```

**L35**

```
| 🌱 סביבה               | ❌         | V3+         | נישתי, פחות תכוף.                                                     |
```

**L36**

```
| 🎨 יצירה               | ❌         | V4+         | תוכן עזר, לא ליבה.                                                    |
```

**L37**

```
| 💞 שידוכים רומנטיים    | ❌         | V5+         | רגישות גבוהה, דורש מערך מתנדבים שדכנים.                                |
```

**L38**

```
| 🎨 עיצוב האפליקציה     | ❌         | V5+         | פיצ'ר ייחודי וניסויי – לא ראשוני.                                     |
```

**L40**

```
#### 8.2.2 פיצ'רים תפעוליים שהוסרו
```

**L42**

```
| פיצ'ר                                | סטטוס MVP | תזמון משוער | רציונל                                                       |
```

**L44**

```
| מערך שידוכים מוקדנים                | ❌         | V3+         | נדרש רק כשיש בקשות אנונימיות רגישות.                          |
```

**L45**

```
| 3 רמות אנונימיות (1/2/3)             | ❌         | V2          | ב-V2 כשנכנסים בקשות רגישות יותר.                              |
```

**L46**

```
| אימות זהות + וי כחול                 | ❌         | V2          | מוסיף חיכוך אדיר ל-Onboarding. נכניס כשנדרש לבטיחות מוגברת.  |
```

**L47**

```
| עמותות וארגונים                      | ❌         | V3+         | עולם אקוסיסטם נפרד. צריך אסטרטגיית גיוס נפרדת.                |
```

**L48**

```
| מתנדבים, מנהלי מתנדבים               | ❌         | V3+         | תלוי בארגונים.                                               |
```

**L49**

```
| Admin UI (לוח בקרה לתפעול)          | ❌         | V2          | פעולות תפעול ב-MVP נעשות ע"י DB ישיר/CLI.                    |
```

**L50**

```
| CRM, ERP, טבלאות דינמיות             | ❌         | V4+         | תלוי בארגונים.                                               |
```

**L51**

```
| אינטגרציות חיצוניות (Monday, Jira)  | ❌         | V4+         | תלוי בארגונים.                                               |
```

**L52**

```
| אתגרים אישיים / קבוצתיים              | ❌         | V2          | אחרי שיש מסה קריטית של משתמשים.                              |
```

**L53**

```
| Habit Tracker / רצפים                 | ❌         | V2          | תלוי באתגרים.                                                |
```

**L54**

```
| Bookmarks / מועדפים                   | ❌         | V2          | nice-to-have, לא חיוני ל-PMF.                                |
```

**L55**

```
| מסך התראות מרוכז                    | ❌         | V2          | רק Push ב-MVP.                                                |
```

**L56**

```
| חיפוש קולי                           | ❌         | V3+         | nice-to-have.                                                |
```

**L57**

```
| עוזר AI (צ'אט-בוט)                   | ❌         | V3+         | מורכב, לא חיוני ל-PMF הראשוני.                                |
```

**L58**

```
| התאמת UI אישית                       | ❌         | V4+         | פיצ'ר ייחודי שלא תורם ל-PMF.                                  |
```

**L59**

```
| מסך גילוי אנשים (Discover)           | ❌         | V2          | תלוי ברמת פעילות בפלטפורמה.                                   |
```

**L60**

```
| היסטוריית פעילות מורחבת               | ❌         | V2          | רק טיימליין מצומצם ב-MVP.                                     |
```

**L62**

```
#### 8.2.3 פיצ'רים בצ'אט שהוסרו
```

**L64**

```
| פיצ'ר                          | סטטוס MVP | תזמון |
```

**L66**

```
| שליחת תמונות                   | ❌         | V2    |
```

**L67**

```
| שליחת קולי                     | ❌         | V2    |
```

**L68**

```
| שליחת וידאו                    | ❌         | V3    |
```

**L69**

```
| שליחת מיקום                    | ❌         | V2    |
```

**L70**

```
| תגובות (Reactions) על הודעות   | ❌         | V2    |
```

**L71**

```
| שיתוף פוסט                     | ❌         | V2    |
```

**L72**

```
| שיחות קבוצתיות                 | ❌         | V3    |
```

**L73**

```
| צ'אט תמיכה מלא (תורים, בוט, SLA) | ❌      | V2    | ב-MVP קיים רק **דיווח בעיה מהגדרות** → צ'אט 1:1 עם הסופר אדמין. |
```

**L75**

```
#### 8.2.4 פיצ'רים בפיד שהוסרו
```

**L77**

```
| פיצ'ר                        | סטטוס MVP | תזמון |
```

**L79**

```
| אלגוריתם פיד מבוסס תחומי עניין | ❌         | V2    |
```

**L80**

```
| טוגל "חברים בלבד / כולם"      | ❌         | V2    |
```

**L81**

```
| הסתרת פוסטים עם מסננים קבועים | ❌         | V2    |
```

**L82**

```
| לייקים על פוסטים              | ❌         | V2    |
```

**L83**

```
| תגובות על פוסטים              | ❌         | V2    |
```

**L84**

```
| שיתוף פוסט (Share)            | ❌         | V2    |
```

**L85**

```
| חיפוש מתקדם עם מפת חום        | ❌         | V3    |
```

**L87**

```
#### 8.2.5 פיצ'רים בסטטיסטיקות שהוסרו
```

**L89**

```
| פיצ'ר                              | סטטוס MVP | תזמון |
```

**L91**

```
| גרפים אינטראקטיביים                 | ❌         | V2    |
```

**L92**

```
| מפות חום גיאוגרפיות                 | ❌         | V3    |
```

**L93**

```
| פילוח לפי קטגוריה                  | ❌         | V2    |
```

**L94**

```
| השוואת תקופות                       | ❌         | V2    |
```

**L95**

```
| דשבורד קהילתי עשיר (פילוחים, השוואות, אנליטיקה מעבר למספרים גולמיים) | ❌         | V2    |
```

**L96**

```
| יצוא PDF / Excel                   | ❌         | V3    |
```

**L100**

```
### 8.3 Roadmap משוער – מה אחרי MVP מוצלח
```

**L102**

```
> **תנאי מוקדם:** ה-MVP עבר את ה-KPIs המוגדרים ב-[`01_Vision_Goals.md#1.5.3`](./01_Vision_Goals.md).
```

**L104**

```
#### V1.5 (Quick Wins, 1-2 חודשים אחרי השקה)
```

**L105**

```
* תמונות בצ'אט (לתיאום מסירה).
```

**L106**

```
* לייקים על פוסטים.
```

**L107**

```
* התראות מתקדמות יותר (לפי סוג).
```

**L108**

```
* מסך גילוי אנשים בסיסי.
```

**L109**

```
* שיפורים ב-Onboarding בהתאם ללמידות מ-MVP.
```

**L111**

```
#### V2 (Expand Functionality, 3-6 חודשים)
```

**L112**

```
* **עולם המזון** – הרחבה הטבעית הראשונה.
```

**L113**

```
* **עולם הנסיעות** – לתמיכה במסירת חפצים גדולים.
```

**L114**

```
* אתגרים בסיסיים.
```

**L116**

```
* טוגל "חברים בלבד / כולם" בפיד.
```

**L117**

```
* אלגוריתם פיד מותאם אישית.
```

**L118**

```
* גרסה אנגלית (EN-US) + הרחבה למשתמשים בחו"ל.
```

**L120**

```
#### V3 (Ecosystem, 6-12 חודשים)
```

**L121**

```
* **עמותות וארגונים** – Onboarding ארגון, פרופיל עמותה ציבורי.
```

**L122**

```
* **מתנדבים** – שיוך לארגון, דיווחי שעות.
```

**L123**

```
* **עולם הזמן** – התנדבות וסיוע אנושי.
```

**L124**

```
* **עולם הידע** – קורסים, שיעורים פרטיים.
```

**L125**

```
* מערך מוקדנים בסיסי.
```

**L126**

```
* אנונימיות 3 רמות.
```

**L128**

```
#### V4+ (Maturity, 12+ חודשים)
```

**L129**

```
* **עולם הכסף** – תרומות לעמותות.
```

**L130**

```
* **עולם הרפואה** – אינטגרציה עם מד"א.
```

**L131**

```
* **עולם הדיור** – אירוח שביליסטים, חסרי בית.
```

**L132**

```
* **CRM/ERP** מלא לעמותות.
```

**L133**

```
* התאמת עיצוב אישית.
```

**L134**

```
* עוזר AI.
```

**L138**

```
### 8.4 פיצ'רים שעלו מה-MVP ולא היו בחזון
```

**L140**

```
(אם כאלה יעלו – לתעד כאן ב-`PRD_HE_V2` עתידי.)
```

**L142**

```
* **מצב פרטיות פרופיל (פומבי / פרטי) + בקשות עקיבה** – פתרון לסתירה שזוהתה בבדיקת PRD: לא ייתכן ש"פוסט לעוקבים בלבד" יישא משמעות אם כל אחד יכול להפוך לעוקב מיידית בפרופיל פומבי. הוחלט לאמץ מודל היברידי בנוסח Instagram – פרופיל פומבי כברירת מחדל (זרימת PMF נשארת מהירה) + פרופיל פרטי כאופציה אמיתית. ראה [`03_Core_Features.md#3.2.3`](./03_Core_Features.md), [`07_Business_Rules.md`](./07_Business_Rules.md) (R-MVP-Profile-9, R-MVP-Profile-10, R-MVP-Privacy-11, R-MVP-Privacy-12, R-MVP-Privacy-13; יישור P3 #31).
```

**L143**

```
* **רמת חשיפת פוסט "🔒 רק אני (פרטי)"** – רמה שלישית מעבר ל-2 שתוכננו במקור, מאפשרת להסתיר זמנית פוסט מבלי למחוק. ראה [`03_Core_Features.md#3.2.4`](./03_Core_Features.md) ו'.
```

**L144**

```
* **הסרת עוקב קיים** – נדרש כדי שמעבר פומבי → פרטי יהיה משמעותי (אחרת עוקבים שנאספו במצב פומבי "תקועים" בלי דרך לסנן). ראה R-MVP-Profile-10.
```

**L148**

```
*חזרה ל[אינדקס](./00_Index.md)*
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/02_profile_and_privacy.md`

**L43**

```
   - **Active Posts** (Hebrew label: *"פוסטים פתוחים"*): lists all `open` posts authored by the user, including those at visibility `Public`, `Followers only`, and `Only me`. Each card carries a visual badge showing its visibility.
```

**L44**

```
   - **Closed Posts** (Hebrew label: *"פוסטים סגורים"*): lists posts in `closed_delivered` status only (PRD §3.3.5). The Hebrew label is intentionally generic (סגורים) rather than delivery-specific (שנמסרו) so it remains accurate if the tab is later extended to other terminal states; in MVP only `closed_delivered` is shown.
```

**L65**

```
- AC2. The "Closed Posts" tab **is** shown for other users when the profile is `Public` (or `Private` and the viewer is an approved follower). Recipient identity ("נמסר ל-X") is included per the same rules as on My Profile (`FR-PROFILE-001`). Posts at `Only-me` visibility remain non-visible to non-owners. *(Reverses the prior privacy decision; see EXEC-7 in the decision log, 2026-05-11.)*
```

**L201**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ד), `05_Screen_UI_Mapping.md` §3.4.
```

**L220**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ד).
```

**L272**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו), §3.2.1.
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/03_following.md`

**L32**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section א), `04_User_Flows.md` Flow 8.A.
```

**L74**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 8.B.
```

**L97**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב, "ביטול בקשה").
```

**L114**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 13.A.
```

**L134**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 13.A.
```

**L195**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ג), `04_User_Flows.md` Flow 14.
```

**L247**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו).
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/04_posts.md`

**L49**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section א).
```

**L68**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ב).
```

**L93**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-sections ג, ד).
```

**L129**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ה), `04_User_Flows.md` Flow 4.
```

**L147**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ו), `04_User_Flows.md` Flow 4.A.
```

**L189**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו).
```

**L251**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
```

**L276**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/05_closure_and_reopen.md`

**L23**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א), `04_User_Flows.md` Flow 7.
```

**L81**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א, Step 4), `05_Screen_UI_Mapping.md` §6.4.3.
```

**L98**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ב), `04_User_Flows.md` Flow 7 (חלק ב).
```

**L128**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א).
```

**L173**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א, Step 3).
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/06_feed_and_search.md`

**L213**

```
   - *Filters active*: "אין פוסטים שתואמים לפילטרים שלך — נסה לנקות את
```

**L214**

```
     הפילטרים או להיות הראשון לשתף."
```

**L215**

```
   - *No filters*: "אין עדיין פוסטים בקהילה — תהיה הראשון לשתף משהו."
```

**L217**

```
   - "נקה פילטרים" rendered only when at least one filter is active
```

**L219**

```
   - "שתף פוסט" always rendered; opens `/post/create` (`FR-POST-001`).
```

**L221**

```
   (`FR-FEED-014`) as "{N} פוסטים פעילים בקהילה כרגע" when N > 0 — a soft
```

**L318**

```
A live "{N} פוסטים פעילים בקהילה" counter that surfaces in three places:
```

**L400**

```
- AC2. Copy: *"יש לך מוצר לתת? או משהו לבקש? שתף את הפוסט הראשון שלך עכשיו."*
```

**L402**

```
   - **Primary CTA — "שתף מוצר"**: navigates to `/post/create`. Creating a
```

**L405**

```
   - **Secondary — "תזכיר לי אחר כך"**: sets the in-memory
```

**L408**

```
   - **Tertiary link — "אל תציג לי שוב"**: invokes
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/07_chat.md`

**L284**

```
- AC2. The owner sees a "סמן כנמסר ✓" / "סמן שקיבלתי ✓" CTA in the action area (label flips by `post.type`, matching `OwnerActionsBar`). The counterpart sees the whole card as a tap-to-open-post surface routing to `/post/[id]`.
```

**L288**

```
- AC6. (P1.2.x) Re-anchor on entry from a different post: when a user opens an existing chat through "💬 שלח הודעה למפרסם" from a post `Y` whose ID differs from the chat's current `anchor_post_id`, `chats.anchor_post_id` is updated to `Y` and the card reflects `Y` on the next render. When the call carries no anchor (inbox/profile flow), the existing `anchor_post_id` is left unchanged. When the anchored post is closed, `chats.anchor_post_id` is cleared by the closure trigger (see FR-CLOSURE-001 AC-NEW) so the next entry from a different post re-anchors cleanly. Realtime propagates the new row to both participants — the card swaps without a screen reload.
```

**L305**

```
- AC2. The owner can confirm with one tap ("סמן וסגור ✓"), pick a different recipient from the candidates list, or take the no-recipient branch via "סגור בלי לסמן" — same UI as the post-screen entry point.
```

**L307**

```
- AC4. In the chat used for the close, delivered path: system message body is "הפוסט סומן כנמסר ✓ · תודה!".
```

**L308**

```
- AC5. In sibling chats (anchored to the same post), delivered path: system message body is "הפוסט נמסר למשתמש אחר".
```

**L309**

```
- AC6. In all anchored chats, no-recipient path: system message body is "המפרסם סגר את הפוסט — הפריט לא נמסר".
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/09_notifications.md`

**L95**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
```

**L113**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 13.
```

**L130**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section א).
```

**L146**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב).
```

**L160**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א), Decisions `D-5`.
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/10_statistics.md`

**L102**

```
- PRD: `03_Core_Features.md` §3.6 ("מדדי קהילה").
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/11_settings.md`

**L228**

```
V1 ships as **immediate hard-deletion** rather than soft-delete + cooldown. The user's `auth.users` row is removed so the email / Google identity is freed for re-signup as a **new** account. Chats are retained on the counterpart side via `chats.participant_a/b` → `on delete set null` (migration 0028), with the deleted side rendered as "משתמש שנמחק". A typed confirmation step ("מחק") satisfies the spirit of AC1 without forcing display-name entry on RTL mobile.
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/12_super_admin.md`

**L26**

```
- PRD: `02_Personas_Roles.md` §2.2, `04_User_Flows.md` Flow 9 (תהליך פנימי).
```

---

## `docs/SSOT/archive/SRS/02_functional_requirements/13_donations.md`

**L32**

```
- AC1. Tile order (visual top-to-bottom in RTL): **🎁 חפצים** → **⏰ זמן** → **💰 כסף**.
```

**L35**

```
- AC4. The Hub screen is reachable from the bottom-tab `💝 תרומות` icon and from any screen that has a global TabBar.
```

**L51**

```
- AC1. Tap on the **🎁 חפצים** tile pushes `/(tabs)` (Home Feed).
```

**L69**

```
- AC1. Body copy (Hebrew, verbatim): *"קטגוריית הכסף תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולתרום / לחפש תורמים דרך עמותת jgive."*
```

**L70**

```
- AC2. A primary button labeled *"פתח את jgive.com ↗"* invokes `Linking.openURL('https://jgive.com')`.
```

**L72**

```
- AC4. If `Linking.canOpenURL` returns false, an inline error is shown: *"לא הצלחנו לפתוח את הקישור. נסו דפדפן אחר."*
```

**L90**

```
- AC1. Body copy (Hebrew, verbatim): *"קטגוריית הזמן תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳."*
```

**L91**

```
- AC2. A primary button labeled *"פתח את לב אחד ↗"* invokes `Linking.openURL('https://www.we-me.app/')`.
```

**L92**

```
- AC3. Below a section divider, secondary copy: *"ניתן גם להתנדב ישירות בארגון שלנו, במקצוע שלך. השאירו הודעה ונחזור אליכם."*
```

**L93**

```
- AC4. A multiline `<TextInput>` placeholder: *"הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות..."*; max length 2,000 characters (consistent with `FR-CHAT-002 AC5`).
```

**L94**

```
- AC5. A primary button labeled *"שלח הודעה"*:
```

**L96**

```
   - On press (authed user, non-empty text): the message is appended to a local `volunteer_intent_log` in `AsyncStorage` (FIFO, capped to 50 entries). An alert is shown: *"תודה! ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ'אט."* The textbox is cleared.
```

**L98**

```
- AC6. **TD-114 (FE) — post P0.5 wiring.** When P0.5 chat ships, replace the local-only behavior with a `sendVolunteerMessageToAdmin` use-case that resolves the Super Admin (canonical email `karmacommunity2.0@gmail.com`), opens-or-creates the support thread (`is_support_thread=true`), sends the message body **prefixed** with *"התנדבות בארגון: "*, and navigates to `/chat/[adminChatId]`. Pending entries from `volunteer_intent_log` are flushed to the thread on first migration (oldest first).
```

**L101**

```
- AC7. The first message body is the user's text **prefixed** with the literal string *"התנדבות בארגון: "*. The prefix is contractual and is not localized in MVP.
```

**L102**

```
- AC8. Network failure: the textbox content is preserved and an inline retry control is shown: *"לא נשלח. נסו שוב."*
```

**L138**

```
- AC1. Tile order (visual top-to-bottom in RTL): existing **חפצים → זמן → כסף** group, then divider, then new group **אוכל → דיור → תחבורה → ידע → חיות → רפואה**.
```

**L152**

```
- AC2. Header row shows the section title (*"עמותות וקישורים"*) and a small *"+"* icon button (32×32, primary color) on the leading RTL edge.
```

**L154**

```
- AC4. Empty state shows a friendly message + centered *"הוספת קישור ראשון"* CTA that opens the add-link modal.
```

**L155**

```
- AC5. Loading state shows an `ActivityIndicator`; transient load failure shows an inline error + *"נסה שוב"* retry button.
```

**L167**

```
- AC2. The *"הוסף"* primary action is disabled until URL matches `^https?://` and display name length is in range.
```

**L173**

```
- AC4. UI feedback during submit: button shows a spinner with the label *"מאמת קישור..."*; on success the modal closes and the new row is prepended to the list; on failure an inline localized error message is shown keyed off the returned `code` (`invalid_url`, `unreachable`, `rate_limited`, `unauthorized`, `network`, `unknown`).
```

**L181**

```
Each row's overflow (`…`) menu opens an action sheet with: *"פתח"*, *"דווח על קישור"*, and (only for the submitter) *"מחק"*.
```

**L184**

```
- AC1. *"פתח"* → `Linking.openURL(url)`.
```

**L185**

```
- AC2. *"דווח על קישור"* → reuses the existing get-or-create support thread (`FR-CHAT-007`) and sends a system-style message: `דיווח על קישור (donation_link:<id>) — <url>`. A success alert is shown.
```

**L186**

```
- AC3. *"מחק"* is shown only when `donation_links.submitted_by = auth.uid()`. On confirm, soft-hides the row by setting `hidden_at = now(), hidden_by = auth.uid()`. The row is removed from the local list immediately.
```

---

## `docs/SSOT/archive/SRS/06_cross_cutting/03_i18n_rtl.md`

**L103**

```
"feed.unread_messages": "{count, plural, =0 {אין הודעות חדשות} one {הודעה חדשה אחת} two {שתי הודעות חדשות} other {# הודעות חדשות}}"
```

---

## `docs/SSOT/archive/SRS/appendices/A_traceability_matrix.md`

**L130**

```
| FR-POST-009 | 3.2.4-ו | R-MVP-Privacy-9, R-MVP-Items-12 | — |
```

**L131**

```
| FR-CLOSURE-005 | 3.3.6-ב | R-MVP-Items-6 | D-6 |
```

**L132**

```
| FR-FOLLOW-006 | 3.2.4-ב | R-MVP-Privacy-12 | — |
```

---

## `docs/SSOT/archive/SRS/appendices/C_decisions_log.md`

**L267**

```
**Decision.** Add dedicated `💝 תרומות` (Donations) and `🔍 חיפוש` (Search) tabs to the bottom bar (5 tabs total), reversing the prior PRD §6.4 exclusion of both from MVP.
```

**L287**

```
- Search tab is a placeholder until P2 lands — risk of user confusion mitigated by explicit copy ("בקרוב") and a CTA back to the feed.
```

**L296**

```
## EXEC-7 — פוסטים סגורים מוצגים בפרופיל יוזר אחר (הפוך PRD §3.2.2)
```

**L299**

```
פוסטים סגורים (`closed_delivered`) מוצגים בפרופיל של יוזר אחר כאשר הפרופיל הוא `Public` או `Private` עם עוקב מאושר. זהות המקבל ("נמסר ל-X") מוצגת בהתאם לאותם הכללים כמו בפרופיל האישי (`FR-PROFILE-001`). פוסטים `Only-me` ממשיכים להיות מוסתרים מגולשים שאינם הבעלים. מהפכת את החלטת ה-PRD §3.2.2 שטמנה את הסגורים מהזרים.
```

**L302**

```
המודל הסוציאלי הוא "ראה איזה תרומות עזרת ולמי". הסתרת פוסטים סגורים מהפרופיל החיצוני מחלישה את ה-social proof ואת ה-North Star metric (items_given/received). הצגתם מחזקת את הנרטיב של הקהילה ומגדילה מוטיבציה לתת.
```

**L306**

```
- *המשך עם ההחלטה המקורית.* מפחית שקיפות ומחליש את ה-social-proof שהוא עמוד השדרה של המוצר.
```

**L307**

```
- *הצגה רק לעוקבים מאושרים (Private בלבד).* תת-אופטימלי — ב-Public profiles שום דבר לא מונע את ההצגה.
```

**L310**

```
מקבלי פריטים רואים שתרומתם גלויה לציבור ב-Public profiles. זה עקבי עם כוונת המוצר; בעלים יכולים לשנות ל-`Private` אם הם מעדיפים.
```

**L330**

```
- *Keep `FR-FEED-006` as string-equality + recency.* The user explicitly rejected city-bucket-then-banner UX during brainstorming ("באנרים באמצע הפוסטים זה גרוע"). Continuous distance ordering replaces the city-bucket + cold-start-fallback combination entirely (so `FR-FEED-007` is deprecated rather than patched).
```

**L344**

```
## EXEC-9 — חסימה / ביטול חסימה יוצאים מהיקף ה-MVP
```

**L350**

```
הסרת היכולת "חסום / ביטול חסימה" מהיקף ה-MVP. `FR-MOD-003`, `FR-MOD-004` ו-`FR-MOD-009` מסומנים `DEPRECATED — post-MVP` עד שיוחזרו פורמלית. נגזרות מיידיות:
```

**L352**

```
1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`PROJECT_STATUS.md §2`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
```

**L354**

```
   - `FR-MOD-007 AC2` כבר לא מחייב כפתור "חסום" בתפריט הפרופיל.
```

**L355**

```
   - `FR-MOD-012 AC1` יורד את `block_user` / `unblock_user` מרשימת ה-`AuditEvent` הנדרשים.
```

**L356**

```
   - `FR-POST-014 AC4` כבר לא דורש הצגת "חסום משתמש" בתפריט ה-⋮ של הפוסט.
```

**L357**

```
   - `FR-POST-018 AC3` (אייקון "פנה למפרסם") כבר לא מתנה את הופעתו ב-block state.
```

**L358**

```
   - `FR-FEED-006` predicate (sec §3): סינון bilateral block נמחק מהדרישה הפעילה (האדפטר כבר לא מקצה את ה-RPC).
```

**L359**

```
   - `FR-SETTINGS-005` (Privacy → Blocked users entry) מסומן deferred post-MVP.
```

**L360**

```
   - `INV-M1` ב-`03_domain_model.md` (Block ↔ Follow exclusivity) מסומן deferred.
```

**L361**

```
   - `D-11` ("Unblock restores visibility of older content") superseded ע"י החלטה זו.
```

**L362**

```
3. **Code surface (חתוך).** מחקנו את `packages/application/src/block/*`, `IBlockRepository`, ה-`Block` domain entity, את `SupabaseBlockRepository`, את ה-i18n strings (`he.posts.block`, `he.chat.block`, `he.settings.blockedUsers`), את ה-wiring ב-`apps/mobile/src/lib/container.ts`, ואת השלב `'blocked'` במכונת המצב של `FollowState`.
```

**L363**

```
4. **DB surface (משאירים).** מיגרציות `0003_init_following_blocking.sql`, `0004_init_chat_messaging.sql` (ביטוי ה-RLS `has_blocked()` ב-chat visibility), ו-`0005_init_moderation.sql` (audit trail עבור `block_user` / `unblock_user`) נשארות כפי שהן — כבר רצו בפרודקשן ויצירת מיגרציית דרופ נושאת סיכון. הטבלאות והפונקציות יישארו לא-מאוכלסות (אין UI שכותב אליהן); `is_blocked()` ו-`has_blocked()` ימשיכו להחזיר `false` בכל קריאה. שחזור פוסט-MVP יהיה straightforward — להחזיר את ה-code surface מעל אותה סכמה.
```

**L366**

```
ה-MVP צריך להתמקד ברצפת בטיחות אחת (P1.3 — דיווחים + auto-removal + סנקציות) ולא בשתי שכבות מקבילות. חסימה היא משוכפלת חלקית עם block-via-report (auto-removal ב-3 דיווחים מסיר את המשתמש מהקהילה), והעלות-תועלת לא מצדיקה אותה ב-MVP. Reporting מספק את הגנת הסף; חסימה כשירות פר-משתמש נשמרת לפוסט-MVP אם תידרש בפועל.
```

**L370**

```
- *להשאיר את הסכמה והקוד אך להסתיר את ה-UI.* יוצר חוב — קוד deprecated שעוד פעם יצריך תחזוקה. נקייה יותר למחוק.
```

**L371**

```
- *להסיר את הסכמה גם.* מיגרציה חדשה ל-`DROP TABLE blocks CASCADE` חושפת אותנו ל-data-loss בפרודקשן ולמיגרציה הופכית בעתיד. השארה היא ההחלטה הזולה.
```

**L372**

```
- *להשהות את ההחלטה עד אחרי P1.3.* יוצר אי-ודאות בbacklog; ה-PM ביקש החלטה כעת.
```

**L376**

```
- שורות `audit_events.action ∈ {block_user, unblock_user}` ימשיכו להופיע ב-`06_audit_trail.md` כ"רשומות מותרות אך לא-מופקות ב-MVP". בעת שחזור — אין צורך בעדכון סכמה.
```

**L377**

```
- `NFR-PRIV-009` (block opacity) deferred — אין surface שמייצר את ה-signal הזה ב-MVP.
```

---

## `docs/SSOT/BACKLOG.md`

**L30**

```
| P1.3.2 | Chat mark-read covers system messages (FR-CHAT-011 AC4) — migrations `0054` + `0055` (`delivered_at` back-fill + defensive RPC) deployed to prod + dev; pull-to-refresh on inbox + dev-tools "סימולציית רענון מלא" | agent-be + agent-fe | ✅ Done | `spec/07_chat.md` |
```

---

## `docs/SSOT/DECISIONS.md`

**L271**

```
**Decision.** Add dedicated `💝 תרומות` (Donations) and `🔍 חיפוש` (Search) tabs to the bottom bar (5 tabs total), reversing the prior PRD §6.4 exclusion of both from MVP.
```

**L291**

```
- Search tab is a placeholder until P2 lands — risk of user confusion mitigated by explicit copy ("בקרוב") and a CTA back to the feed.
```

**L300**

```
## EXEC-7 — פוסטים סגורים מוצגים בפרופיל יוזר אחר (הפוך PRD §3.2.2)
```

**L303**

```
פוסטים סגורים (`closed_delivered`) מוצגים בפרופיל של יוזר אחר כאשר הפרופיל הוא `Public` או `Private` עם עוקב מאושר. זהות המקבל ("נמסר ל-X") מוצגת בהתאם לאותם הכללים כמו בפרופיל האישי (`FR-PROFILE-001`). פוסטים `Only-me` ממשיכים להיות מוסתרים מגולשים שאינם הבעלים. מהפכת את החלטת ה-PRD §3.2.2 שטמנה את הסגורים מהזרים.
```

**L306**

```
המודל הסוציאלי הוא "ראה איזה תרומות עזרת ולמי". הסתרת פוסטים סגורים מהפרופיל החיצוני מחלישה את ה-social proof ואת ה-North Star metric (items_given/received). הצגתם מחזקת את הנרטיב של הקהילה ומגדילה מוטיבציה לתת.
```

**L310**

```
- *המשך עם ההחלטה המקורית.* מפחית שקיפות ומחליש את ה-social-proof שהוא עמוד השדרה של המוצר.
```

**L311**

```
- *הצגה רק לעוקבים מאושרים (Private בלבד).* תת-אופטימלי — ב-Public profiles שום דבר לא מונע את ההצגה.
```

**L314**

```
מקבלי פריטים רואים שתרומתם גלויה לציבור ב-Public profiles. זה עקבי עם כוונת המוצר; בעלים יכולים לשנות ל-`Private` אם הם מעדיפים.
```

**L334**

```
- *Keep `FR-FEED-006` as string-equality + recency.* The user explicitly rejected city-bucket-then-banner UX during brainstorming ("באנרים באמצע הפוסטים זה גרוע"). Continuous distance ordering replaces the city-bucket + cold-start-fallback combination entirely (so `FR-FEED-007` is deprecated rather than patched).
```

**L348**

```
## EXEC-9 — חסימה / ביטול חסימה יוצאים מהיקף ה-MVP
```

**L354**

```
הסרת היכולת "חסום / ביטול חסימה" מהיקף ה-MVP. `FR-MOD-003`, `FR-MOD-004` ו-`FR-MOD-009` מסומנים `DEPRECATED — post-MVP` עד שיוחזרו פורמלית. נגזרות מיידיות:
```

**L356**

```
1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`BACKLOG.md`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
```

**L358**

```
   - `FR-MOD-007 AC2` כבר לא מחייב כפתור "חסום" בתפריט הפרופיל.
```

**L359**

```
   - `FR-MOD-012 AC1` יורד את `block_user` / `unblock_user` מרשימת ה-`AuditEvent` הנדרשים.
```

**L360**

```
   - `FR-POST-014 AC4` כבר לא דורש הצגת "חסום משתמש" בתפריט ה-⋮ של הפוסט.
```

**L361**

```
   - `FR-POST-018 AC3` (אייקון "פנה למפרסם") כבר לא מתנה את הופעתו ב-block state.
```

**L362**

```
   - `FR-FEED-006` predicate (sec §3): סינון bilateral block נמחק מהדרישה הפעילה (האדפטר כבר לא מקצה את ה-RPC).
```

**L363**

```
   - `FR-SETTINGS-005` (Privacy → Blocked users entry) מסומן deferred post-MVP.
```

**L364**

```
   - `INV-M1` ב-`03_domain_model.md` (Block ↔ Follow exclusivity) מסומן deferred.
```

**L365**

```
   - `D-11` ("Unblock restores visibility of older content") superseded ע"י החלטה זו.
```

**L366**

```
3. **Code surface (חתוך).** מחקנו את `packages/application/src/block/*`, `IBlockRepository`, ה-`Block` domain entity, את `SupabaseBlockRepository`, את ה-i18n strings (`he.posts.block`, `he.chat.block`, `he.settings.blockedUsers`), את ה-wiring ב-`apps/mobile/src/lib/container.ts`, ואת השלב `'blocked'` במכונת המצב של `FollowState`.
```

**L367**

```
4. **DB surface (משאירים).** מיגרציות `0003_init_following_blocking.sql`, `0004_init_chat_messaging.sql` (ביטוי ה-RLS `has_blocked()` ב-chat visibility), ו-`0005_init_moderation.sql` (audit trail עבור `block_user` / `unblock_user`) נשארות כפי שהן — כבר רצו בפרודקשן ויצירת מיגרציית דרופ נושאת סיכון. הטבלאות והפונקציות יישארו לא-מאוכלסות (אין UI שכותב אליהן); `is_blocked()` ו-`has_blocked()` ימשיכו להחזיר `false` בכל קריאה. שחזור פוסט-MVP יהיה straightforward — להחזיר את ה-code surface מעל אותה סכמה.
```

**L370**

```
ה-MVP צריך להתמקד ברצפת בטיחות אחת (P1.3 — דיווחים + auto-removal + סנקציות) ולא בשתי שכבות מקבילות. חסימה היא משוכפלת חלקית עם block-via-report (auto-removal ב-3 דיווחים מסיר את המשתמש מהקהילה), והעלות-תועלת לא מצדיקה אותה ב-MVP. Reporting מספק את הגנת הסף; חסימה כשירות פר-משתמש נשמרת לפוסט-MVP אם תידרש בפועל.
```

**L374**

```
- *להשאיר את הסכמה והקוד אך להסתיר את ה-UI.* יוצר חוב — קוד deprecated שעוד פעם יצריך תחזוקה. נקייה יותר למחוק.
```

**L375**

```
- *להסיר את הסכמה גם.* מיגרציה חדשה ל-`DROP TABLE blocks CASCADE` חושפת אותנו ל-data-loss בפרודקשן ולמיגרציה הופכית בעתיד. השארה היא ההחלטה הזולה.
```

**L376**

```
- *להשהות את ההחלטה עד אחרי P1.3.* יוצר אי-ודאות בbacklog; ה-PM ביקש החלטה כעת.
```

**L380**

```
- שורות `audit_events.action ∈ {block_user, unblock_user}` ימשיכו להופיע ב-`06_audit_trail.md` כ"רשומות מותרות אך לא-מופקות ב-MVP". בעת שחזור — אין צורך בעדכון סכמה.
```

**L381**

```
- `NFR-PRIV-009` (block opacity) deferred — אין surface שמייצר את ה-signal הזה ב-MVP.
```

**L410**

```
Closed-delivered posts appear in the "פוסטים סגורים" tab of both the publisher's and the respondent's profile. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — no automatic upgrade on close. Each card shows an economic-role badge (📤 נתתי / 📥 קיבלתי) derived from `(post.type, identity-role)`.
```

**L476**

```
1. `Public`-visibility posts authored by a Private user appeared in feed/search with the publisher rendered as "משתמש שנמחק", because `posts` RLS doesn't check author privacy but the join to the `users` row was filtered by `users_select_public` (which requires `privacy_mode = 'Public'`).
```

**L498**

```
- **Sign-in failure** (wrong password OR unknown email) → single `authentication_failed` code → Hebrew message: `"לא הצלחנו להתחבר עם הפרטים האלו. בדקו את הדוא"ל והסיסמה ונסו שוב."`
```

---

## `docs/SSOT/OPERATOR_RUNBOOK.md`

**L157**

```
-- New auth user created via trigger must have city = '5000', city_name = 'תל אביב - יפו'
```

**L229**

```
- PostDetail → "סמן כנמסר ✓" → Step 1 confirm → Step 2 picker → "סמן וסגור ✓" → Step 3 explainer → done.
```

**L230**

```
- Profile → "פריטים שתרמתי" should be +1.
```

**L231**

```
- Reopen the same post via "📤 פתח מחדש" → counter -1.
```

---

## `docs/SSOT/spec/01_auth_and_onboarding.md`

**L157**

```
- AC2. Supabase Auth creates the account with `email_confirmed_at = null`. The user **cannot sign in** until they click the verification link in the email — `signInWithPassword` returns `email_not_confirmed`. The sign-up screen transitions in place to a verification-pending state with three actions: "פתח אימייל" (launches the default mail client on native; routes to a known webmail provider on web based on the email domain), "שלח שוב" (resends the verification email; disabled for 60 seconds after each click), and "שנה אימייל" (returns to the form with the previously typed email/password preserved). The same verification-pending state is rendered on the sign-in screen when the user attempts to sign in with an unconfirmed email.
```

---

## `docs/SSOT/spec/02_profile_and_privacy.md`

**L45**

```
   - **Active Posts** (Hebrew label: *"פוסטים פתוחים"*): unchanged — lists all `open` posts authored by the user including `Public`, `Followers only`, and `Only me`. Each card carries a visual badge showing its visibility.
```

**L46**

```
   - **Closed Posts** (Hebrew label: *"פוסטים סגורים"*): lists posts where the user is **either the publisher or the respondent**. The publisher side covers status `closed_delivered` and (for the user's own view) `deleted_no_recipient` within the 7-day grace window so they can still reopen — FR-CLOSURE-005 AC4, FR-CLOSURE-008. The respondent side covers only `closed_delivered`. Ordered by `closed_at` desc. Each card shows an economic-role badge derived from `(post.type, identity-role)`: 📤 נתתי when the profile owner is the giver, 📥 קיבלתי when the profile owner is the receiver. (Revised 2026-05-13 per D-19.)
```

**L203**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ד), `05_Screen_UI_Mapping.md` §3.4.
```

**L222**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ד).
```

**L273**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו), §3.2.1.
```

---

## `docs/SSOT/spec/03_following.md`

**L34**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section א), `04_User_Flows.md` Flow 8.A.
```

**L76**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 8.B.
```

**L99**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב, "ביטול בקשה").
```

**L116**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 13.A.
```

**L136**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 13.A.
```

**L197**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ג), `04_User_Flows.md` Flow 14.
```

**L249**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו).
```

---

## `docs/SSOT/spec/04_posts.md`

**L51**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section א).
```

**L70**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ב).
```

**L95**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-sections ג, ד).
```

**L98**

```
- AC1. For `Give`: up to 5 images total (the first being required), and an `item_condition ∈ { New, LikeNew, Good, Fair, Damaged }` (UI: שבור/תקול for `Damaged`).
```

**L131**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ה), `04_User_Flows.md` Flow 4.
```

**L149**

```
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ו), `04_User_Flows.md` Flow 4.A.
```

**L192**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו).
```

**L258**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
```

**L283**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
```

**L360**

```
- AC1. A user picked as the respondent of a `closed_delivered` post sees the post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the respondent's profile, subject to the post's original `visibility` setting (Public / Followers-only / Only-me). The "Remove my recipient mark" CTA remains exclusive to the respondent themselves. (Revised 2026-05-13 per D-19 — reverses the respondent-privacy carve-out previously in D-7.)
```

**L364**

```
- AC5. When a third party opens the post via the respondent's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). The `RecipientCallout` already adapts to post type — "נמסר ל-X" for `Give` posts, "ניתן על-ידי X" for `Request` posts — and is the canonical surfaced banner.
```

**L398**

```
- AC3. `street_number` accepts digits and an optional single-letter suffix. The suffix may be a Latin letter (`12A`, `12B`) or a Hebrew letter (`12א`, `15ב`) to support Israeli street numbering conventions. Punctuation and multi-character suffixes are rejected.
```

---

## `docs/SSOT/spec/05_closure_and_reopen.md`

**L25**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א), `04_User_Flows.md` Flow 7.
```

**L83**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א, Step 4), `05_Screen_UI_Mapping.md` §6.4.3.
```

**L100**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ב), `04_User_Flows.md` Flow 7 (חלק ב).
```

**L130**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א).
```

**L175**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א, Step 3).
```

---

## `docs/SSOT/spec/06_feed_and_search.md`

**L215**

```
   - *Filters active*: "אין פוסטים שתואמים לפילטרים שלך — נסה לנקות את
```

**L216**

```
     הפילטרים או להיות הראשון לשתף."
```

**L217**

```
   - *No filters*: "אין עדיין פוסטים בקהילה — תהיה הראשון לשתף משהו."
```

**L219**

```
   - "נקה פילטרים" rendered only when at least one filter is active
```

**L221**

```
   - "שתף פוסט" always rendered; opens `/post/create` (`FR-POST-001`).
```

**L223**

```
   (`FR-FEED-014`) as "{N} פוסטים פעילים בקהילה כרגע" when N > 0 — a soft
```

**L320**

```
A live "{N} פוסטים פעילים בקהילה" counter that surfaces in three places:
```

**L402**

```
- AC2. Copy: *"יש לך מוצר לתת? או משהו לבקש? שתף את הפוסט הראשון שלך עכשיו."*
```

**L404**

```
   - **Primary CTA — "שתף מוצר"**: navigates to `/post/create`. Creating a
```

**L407**

```
   - **Secondary — "תזכיר לי אחר כך"**: sets the in-memory
```

**L410**

```
   - **Tertiary link — "אל תציג לי שוב"**: invokes
```

---

## `docs/SSOT/spec/07_chat.md`

**L291**

```
- AC2. The owner sees a "סמן כנמסר ✓" / "סמן שקיבלתי ✓" CTA in the action area (label flips by `post.type`, matching `OwnerActionsBar`). The counterpart sees the whole card as a tap-to-open-post surface routing to `/post/[id]`.
```

**L295**

```
- AC6. (P1.2.x) Re-anchor on entry from a different post: when a user opens an existing chat through "💬 שלח הודעה למפרסם" from a post `Y` whose ID differs from the chat's current `anchor_post_id`, `chats.anchor_post_id` is updated to `Y` and the card reflects `Y` on the next render. When the call carries no anchor (inbox/profile flow), the existing `anchor_post_id` is left unchanged. When the anchored post is closed, `chats.anchor_post_id` is cleared by the closure trigger (see FR-CLOSURE-001 AC-NEW) so the next entry from a different post re-anchors cleanly. Realtime propagates the new row to both participants — the card swaps without a screen reload.
```

**L312**

```
- AC2. The owner can confirm with one tap ("סמן וסגור ✓"), pick a different recipient from the candidates list, or take the no-recipient branch via "סגור בלי לסמן" — same UI as the post-screen entry point.
```

**L314**

```
- AC4. In the chat used for the close, delivered path: system message body is "הפוסט סומן כנמסר ✓ · תודה!".
```

**L315**

```
- AC5. In sibling chats (anchored to the same post), delivered path: system message body is "הפוסט נמסר למשתמש אחר".
```

**L316**

```
- AC6. In all anchored chats, no-recipient path: system message body is "המפרסם סגר את הפוסט — הפריט לא נמסר".
```

---

## `docs/SSOT/spec/09_notifications.md`

**L97**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
```

**L115**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב), `04_User_Flows.md` Flow 13.
```

**L132**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section א).
```

**L148**

```
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ב).
```

**L162**

```
- PRD: `03_Core_Features.md` §3.3.6 (sub-section א), Decisions `D-5`.
```

---

## `docs/SSOT/spec/10_statistics.md`

**L104**

```
- PRD: `03_Core_Features.md` §3.6 ("מדדי קהילה").
```

---

## `docs/SSOT/spec/12_super_admin.md`

**L28**

```
- PRD: `02_Personas_Roles.md` §2.2, `04_User_Flows.md` Flow 9 (תהליך פנימי).
```

---

## `docs/SSOT/spec/13_donations.md`

**L5**

```
> **Behavior update (2026-05-12)** — Donation link **remove** is a hard **`DELETE`** on `donation_links` (authorized by RLS policy `donation_links_delete_own_or_admin`); the app no longer sets `hidden_at` / `hidden_by` on remove. **Edit** must always invoke `validate-donation-link` with body field **`link_id`** set to the UUID of the row being edited so the Edge Function performs an **UPDATE**, never a second INSERT. One-time DB cleanup: migration `0050_donation_links_purge_soft_deleted.sql` deletes rows that were previously soft-hidden (`hidden_at IS NOT NULL`). עברית: מחיקה = מחיקת שורה מהטבלה; עריכה = עדכון אותה שורה ב־UUID שנבחר, לא יצירת קישור חדש.
```

**L34**

```
- AC1. Tile order (visual top-to-bottom in RTL): **🎁 חפצים** → **⏰ זמן** → **💰 כסף**.
```

**L37**

```
- AC4. The Hub screen is reachable from the bottom-tab `💝 תרומות` icon and from any screen that has a global TabBar.
```

**L53**

```
- AC1. Tap on the **🎁 חפצים** tile pushes `/(tabs)` (Home Feed).
```

**L71**

```
- AC1. Body copy (Hebrew, verbatim): *"קטגוריית הכסף תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולתרום / לחפש תורמים דרך עמותת jgive."*
```

**L72**

```
- AC2. A primary button labeled *"פתח את jgive.com ↗"* invokes `Linking.openURL('https://jgive.com')`.
```

**L74**

```
- AC4. If `Linking.canOpenURL` returns false, an inline error is shown: *"לא הצלחנו לפתוח את הקישור. נסו דפדפן אחר."*
```

**L94**

```
- AC1. Body copy (Hebrew, verbatim): *"קטגוריית הזמן תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳."*
```

**L95**

```
- AC2. A primary button labeled *"פתח את לב אחד ↗"* invokes `Linking.openURL('https://www.we-me.app/')`.
```

**L96**

```
- AC3. Below a section divider, secondary copy: *"ניתן גם להתנדב ישירות בארגון שלנו, במקצוע שלך. השאירו הודעה ונחזור אליכם."*
```

**L97**

```
- AC4. A multiline `<TextInput>` placeholder: *"הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות..."*; max length 2,000 characters (consistent with `FR-CHAT-002 AC5`).
```

**L98**

```
- AC5. A primary button labeled *"שלח הודעה"*:
```

**L100**

```
   - On press (authed user, non-empty text): the message is appended to a local `volunteer_intent_log` in `AsyncStorage` (FIFO, capped to 50 entries). An alert is shown: *"תודה! ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ'אט."* The textbox is cleared.
```

**L102**

```
- AC6. ✅ **TD-114 closed (2026-05-16).** Composer uses `GetSupportThreadUseCase` + `SendMessageUseCase` with body prefixed `"התנדבות בארגון: "`; navigates to `/chat/[chatId]` on success. AsyncStorage local log removed.
```

**L105**

```
- AC7. The first message body is the user's text **prefixed** with the literal string *"התנדבות בארגון: "*. The prefix is contractual and is not localized in MVP.
```

**L106**

```
- AC8. Network failure: the textbox content is preserved and an inline retry control is shown: *"לא נשלח. נסו שוב."*
```

**L142**

```
- AC1. Tile order (visual top-to-bottom in RTL): existing **חפצים → זמן → כסף** group, then divider, then new group **אוכל → דיור → תחבורה → ידע → חיות → רפואה**.
```

**L156**

```
- AC2. Header row shows the section title (*"עמותות וקישורים"*) and a small *"+"* icon button (32×32, primary color) on the leading RTL edge.
```

**L158**

```
- AC4. Empty state shows a friendly message + centered *"הוספת קישור ראשון"* CTA that opens the add-link modal.
```

**L159**

```
- AC5. Loading state shows an `ActivityIndicator`; transient load failure shows an inline error + *"נסה שוב"* retry button.
```

**L172**

```
- AC2. The *"הוסף"* / *"שמור"* primary action is disabled until URL matches `^https?://` and display name length is in range.
```

**L180**

```
- AC4. UI feedback during submit: button shows a spinner with the label *"מאמת קישור..."*; on success the modal closes and the list reflects the change; on failure an inline localized error message is shown keyed off the returned `code` (`invalid_url`, `unreachable`, `rate_limited`, `unauthorized`, `forbidden`, `network`, `unknown`).
```

**L188**

```
Each row's overflow (`…`) menu opens an action sheet with: *"פתח"*, *"דווח על קישור"*, *"ערוך"* (submitter **or** super-admin), and *"מחק"* (submitter **or** super-admin).
```

**L190**

```
**Persistence.** *"מחק"* removes the row from Postgres via **`DELETE`** (see AC4–AC5). The authenticated app uses the Supabase client `delete` on `donation_links.id`; the Edge Function is **not** involved in remove. *"ערוך"* continues to use the Edge Function update path per `FR-DONATE-008`.
```

**L193**

```
- AC1. *"פתח"* → `Linking.openURL(url)`.
```

**L194**

```
- AC2. *"דווח על קישור"* → reuses the existing get-or-create support thread (`FR-CHAT-007`) and sends a system-style message: `דיווח על קישור (donation_link:<id>) — <url>`. A success alert is shown.
```

**L195**

```
- AC3. *"ערוך"* is shown when `donation_links.submitted_by = auth.uid()` **or** the session user is super-admin (`users.is_super_admin = true`). It opens the same modal as add with fields prefilled; saving calls the Edge Function update path (`link_id`) per `FR-DONATE-008 AC3b` and the client contract `FR-DONATE-008 AC3c`. On success the row updates in the list in place (no duplicate row).
```

**L196**

```
- AC4. *"מחק"* is shown when `donation_links.submitted_by = auth.uid()` **or** the session user is super-admin (`users.is_super_admin = true`). On confirm, **permanently deletes** the row (`DELETE`); the row is removed from the local list immediately. Legacy soft-hidden rows (`hidden_at IS NOT NULL`) are purged by migration `0050_donation_links_purge_soft_deleted.sql` so the table stays aligned with the UI.
```

---

## `docs/SSOT/TECH_DEBT.md`

**L49**

```
| TD-148 | 🟠 | **System messages from the closure trigger are hardcoded Hebrew.** `supabase/migrations/0031_post_closure_emit_system_messages.sql` inserts `'הפוסט סומן כנמסר ✓ · תודה!'`, `'הפוסט נמסר למשתמש אחר'`, and `'המפרסם סגר את הפוסט — הפריט לא נמסר'` directly. Acceptable while the app is Hebrew-only. When i18n infra lands for system messages, move strings to a translation table (or to an Edge Function that resolves the recipient's locale) and emit a structured `system_payload` only — the UI then renders the localized body. | When i18n infra lands |
```

---

## `docs/superpowers/plans/2026-05-11-delete-account.md`

**L7**

```
**Goal:** Wire the existing "Delete account" button in settings to a real, immediate, full-cleanup deletion flow that frees the user's email/Google identity for re-signup, retains chats on the counterpart side as "משתמש שנמחק", and blocks suspended/banned users from evading moderation.
```

**L19**

```
- AC1 satisfied via warning modal + typed confirmation ("מחק").
```

**L155**

```
V1 ships as **immediate hard-deletion** rather than soft-delete + cooldown. The user's `auth.users` row is removed so the email / Google identity is freed for re-signup as a **new** account. Chats are retained on the counterpart side via `chats.participant_a/b` → `on delete set null` (migration 00YY), with the deleted side rendered as "משתמש שנמחק". A typed confirmation step ("מחק") satisfies the spirit of AC1 without forcing display-name entry on RTL mobile.
```

**L1167**

```
You should see an existing `settings:` block. The current `deleteAccount: 'מחק חשבון'` key sits inside it (line ~174).
```

**L1175**

```
  title: 'מחיקת חשבון לצמיתות',
```

**L1177**

```
    posts:      'כל הפוסטים שלך יימחקו (כולל תמונות)',
```

**L1178**

```
    follows:    'כל העוקבים והנעקבים יוסרו',
```

**L1179**

```
    moderation: 'כל החסימות והדיווחים שהגשת יימחקו',
```

**L1180**

```
    donations:  'קישורי תרומה שהגדרת יימחקו',
```

**L1181**

```
    devices:    'כל המכשירים המחוברים שלך ינותקו',
```

**L1184**

```
    'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "משתמש שנמחק".',
```

**L1186**

```
    'הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית.',
```

**L1187**

```
  confirmInputLabel: 'הקלד "מחק" כדי לאשר',
```

**L1188**

```
  confirmInputPlaceholder: 'מחק',
```

**L1189**

```
  confirmKeyword: 'מחק',
```

**L1191**

```
    cancel: 'ביטול',
```

**L1192**

```
    delete: 'מחק את החשבון לצמיתות',
```

**L1193**

```
    retry:  'נסה שוב',
```

**L1194**

```
    close:  'סגור',
```

**L1197**

```
    recoverable: 'המחיקה נכשלה — נסה שוב',
```

**L1199**

```
      'המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. חובה ללחוץ "נסה שוב" עכשיו — אם תסגור את האפליקציה ייווצר חשבון לא תקין.',
```

**L1202**

```
    title: 'לא ניתן למחוק חשבון מושעה',
```

**L1203**

```
    body:  'פנה לבירור דרך מסך הדיווחים.',
```

**L1206**

```
    title:    'חשבונך נמחק',
```

**L1207**

```
    subtitle: 'תודה שהיית חלק מקארמה.',
```

**L1639**

```
(non-dismissible), blocked_suspended. Typed confirmation ("מחק")
```

**L1709**

```
1.5s fullscreen 'תודה שהיית חלק מקארמה' before redirect to sign-in.
```

**L1927**

```
// otherId is now string | null. The downstream getCounterpart handles null by returning "משתמש שנמחק".
```

**L1951**

```
returning the "משתמש שנמחק" placeholder.
```

**L1975**

```
- Any code that resolves the counterpart should re-fall-back to "משתמש שנמחק" (the cached profile resolver should return null → display falls back).
```

**L2019**

```
Look for the "מחק חשבון" row.
```

**L2025**

```
Click "מחק חשבון" via `preview_click`. Snapshot — expect the modal with title "מחיקת חשבון לצמיתות", bullets, retention note, warning, input field, and two buttons. The delete button should be visually muted (disabled).
```

**L2029**

```
`preview_fill` the input with "מ". Snapshot. Delete button remains disabled.
```

**L2033**

```
`preview_fill` the input with "מחק". Snapshot. Delete button is now active red.
```

**L2037**

```
Click "ביטול". Snapshot — modal gone, settings screen as before.
```

**L2047**

```
Open the modal, type "מחק", click "מחק את החשבון לצמיתות". Watch the spinner, then the success overlay (1.5s), then the sign-in screen.
```

**L2068**

```
Sign in as the other-user account (the one the deletee was following / chatting with). Open the chat → verify it still shows messages with "משתמש שנמחק" placeholder + default avatar.
```

**L2074**

```
Use SQL to flip a disposable user's `account_status` to `suspended_admin`. Sign in as them, open settings → delete modal. Expected: blocked state UI ("לא ניתן למחוק חשבון מושעה").
```

**L2078**

```
Simulate a 500 from the Edge Function (one option: drop the SUPABASE_SERVICE_ROLE_KEY env var locally). Trigger delete. Expected: red banner "המחיקה נכשלה — נסה שוב"; modal still dismissible. Restore the env, retry succeeds.
```

**L2086**

```
- Only "נסה שוב" button is shown.
```

**L2120**

```
| P1.x — Delete Account V1 | agent יחיד | FR-SETTINGS-012 (חלקי) | 🟢 Done |
```

**L2193**

```
Wires the existing "מחק חשבון" button to a real deletion flow per FR-SETTINGS-012 V1:
```

**L2199**

```
- **UI:** Modal with five states, typed-confirm ("מחק"), non-dismissible critical-error lock, blocked-suspended copy, 1.5s success overlay before sign-in.
```

**L2207**

```
- [ ] Active user with posts/follows/chats: full cleanup, chat preserved on counterpart side as "משתמש שנמחק".
```

---

## `docs/superpowers/plans/2026-05-11-edit-post.md`

**L7**

```
**Goal:** Add "ערוך פוסט" to the owner ⋮ menu on post detail, navigating to a pre-filled edit screen that saves via `UpdatePostUseCase`.
```

**L9**

```
**Architecture:** The `UpdatePostUseCase` + `getUpdatePostUseCase()` factory already exist and are fully tested. This feature is pure UI work: (1) add "ערוך" to `PostMenuSheet` owner section, (2) wire the navigation in `PostMenuButton`, (3) create `app/edit-post/[id].tsx` that pre-fills from the loaded post and calls the use case on save.
```

**L32**

```
## Task 1 — Add "ערוך" item to PostMenuSheet
```

**L37**

```
The current owner section shows only "מחק". Add "ערוך" before it, visible only when `post.status === 'open'` (closed/expired posts can't be edited per FR-POST-008). Wire it to a new `onEdit` prop.
```

**L62**

```
- [ ] **Step 3: Add the "ערוך" menu item in the owner branch**
```

**L72**

```
        label="ערוך פוסט"
```

**L78**

```
      label="מחק את הפוסט"
```

**L98**

```
git commit -m "feat(post): add ערוך item to owner PostMenuSheet (FR-POST-015 AC1)"
```

**L262**

```
      const message = isPostError(err) ? mapPostErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
```

**L265**

```
        window.alert(`שמירה נכשלה: ${message}`);
```

**L268**

```
        alert(`שמירה נכשלה: ${message}`);
```

**L284**

```
        <Text style={styles.errorTitle}>שגיאה בטעינת הפוסט</Text>
```

**L286**

```
          <Text style={styles.retryText}>נסה שוב</Text>
```

**L294**

```
        <EmptyState icon="search-outline" title="הפוסט לא נמצא" subtitle="ייתכן שהוא נסגר או שאין לך הרשאה לצפייה." />
```

**L303**

```
        <EmptyState icon="lock-closed-outline" title="אין הרשאה" subtitle="רק בעל הפוסט יכול לערוך אותו." />
```

**L332**

```
        <Text style={styles.headerTitle}>עריכת פוסט</Text>
```

**L342**

```
            <Text style={styles.saveBtnText}>שמור</Text>
```

**L350**

```
          <Text style={styles.typeBadgeText}>{isGive ? '🎁 לתת חפץ' : '🔍 לבקש חפץ'}</Text>
```

**L351**

```
          <Text style={styles.typeBadgeSub}>לא ניתן לשנות את סוג הפוסט לאחר פרסום</Text>
```

**L357**

```
            <Text style={styles.sectionLabel}>תמונות</Text>
```

**L367**

```
            <Text style={styles.imagesNote}>לא ניתן לערוך תמונות בגרסה זו</Text>
```

**L372**

```
          <Text style={styles.sectionLabel}>כותרת <Text style={styles.required}>*</Text></Text>
```

**L377**

```
            placeholder="מה אתה נותן/מבקש?"
```

**L386**

```
          <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
```

**L393**

```
              placeholder="רחוב"
```

**L401**

```
              placeholder="מס׳"
```

**L409**

```
          <Text style={styles.sectionLabel}>תיאור (אופציונלי)</Text>
```

**L414**

```
            placeholder="פרטים נוספים על החפץ..."
```

**L430**

```
          <Text style={styles.sectionLabel}>קטגוריה</Text>
```

**L448**

```
            <Text style={styles.sectionLabel}>מצב החפץ</Text>
```

**L451**

```
                const labels: Record<ItemCondition, string> = { New: 'חדש', LikeNew: 'כמו חדש', Good: 'טוב', Fair: 'בינוני' };
```

**L468**

```
            <Text style={styles.sectionLabel}>דחיפות (אופציונלי)</Text>
```

**L473**

```
              placeholder="לדוגמה: צריך עד שישי"
```

**L483**

```
          <Text style={styles.sectionLabel}>מי יראה את הפוסט</Text>
```

**L485**

```
            { v: 'Public' as PostVisibility, label: '🌍 כולם', sub: 'הפוסט יוצג בפיד הראשי לכל המשתמשים' },
```

**L486**

```
            { v: 'OnlyMe' as PostVisibility, label: '🔒 רק אני', sub: onlyMeDisabled ? 'לא ניתן להוריד פרטיות לאחר פרסום' : 'הפוסט נשמר באופן פרטי' },
```

**L617**

```
| TD-130 | "Edit" item missing from owner ⋮ menu. | Closed 2026-05-11 — `app/edit-post/[id].tsx` created; "ערוך" added to PostMenuSheet owner section (FR-POST-015 AC1, FR-POST-008). |
```

**L623**

```
> Edit post: "ערוך פוסט" in owner ⋮ menu navigates to `edit-post/[id]`; pre-filled form saves via `UpdatePostUseCase` (FR-POST-008, FR-POST-015 AC1).
```

**L639**

```
- FR-POST-008 AC1 (editable fields) ✅ title, description, category, address, locationDisplayLevel, itemCondition, urgency, visibility all covered. Images NOT editable (UpdatePostInput has no mediaAssets field — existing gap, noted in form with "לא ניתן לערוך תמונות בגרסה זו").
```

---

## `docs/superpowers/plans/2026-05-11-ssot-cleanup.md`

**L203**

```
   > ⚠️ הבקשה שלך סותרת את האפיון:
```

**L204**

```
   > - אפיון: [quote from spec]
```

**L205**

```
   > - בקשה: [what you asked]
```

**L206**

```
   > האם לעדכן את האפיון? (כן/לא)
```

**L209**

```
4. **If new feature (not in spec)** → report: "הפיצ'ר הזה לא מופיע באפיון. להוסיף?"
```

**L757**

```
1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`PROJECT_STATUS.md §2`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
```

**L762**

```
1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`BACKLOG.md`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
```

---

## `docs/superpowers/plans/2026-05-12-moderation-admin-actions.md`

**L1197**

```
      note: 'התנהגות לא הולמת',
```

**L1204**

```
      note: 'התנהגות לא הולמת',
```

**L1876**

```
      title: 'דווח על משתמש',
```

**L1877**

```
      reasonLabel: 'סיבת הדיווח',
```

**L1878**

```
      noteLabel: 'הערה (אופציונלי, עד 500 תווים)',
```

**L1879**

```
      submit: 'שלח דיווח',
```

**L1880**

```
      successToast: '✅ הדיווח התקבל. הצוות שלנו יבדוק.',
```

**L1881**

```
      duplicateError: 'כבר דיווחת על משתמש זה ב-24 השעות האחרונות.',
```

**L1885**

```
    spam: 'ספאם',
```

**L1886**

```
    offensive: 'תוכן פוגעני',
```

**L1887**

```
    misleading: 'מטעה',
```

**L1888**

```
    illegal: 'בלתי-חוקי',
```

**L1889**

```
    other: 'אחר',
```

**L1892**

```
    title: 'חסימת משתמש',
```

**L1893**

```
    reasonLabel: 'סיבת החסימה',
```

**L1895**

```
      spam: 'ספאם',
```

**L1896**

```
      harassment: 'הטרדה',
```

**L1897**

```
      policy_violation: 'הפרת מדיניות',
```

**L1898**

```
      other: 'אחר',
```

**L1900**

```
    noteLabel: 'הערות נוספות',
```

**L1901**

```
    submit: 'חסום',
```

**L1902**

```
    confirmCopy: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
```

**L1903**

```
    successToast: 'המשתמש נחסם.',
```

**L1906**

```
    reportReceived: { title: 'דיווח התקבל', body: 'דיווח על {target_type} · {reason} · {count}/3' },
```

**L1907**

```
    autoRemoved:    { title: 'הוסר אוטומטית', body: '{target_type} הוסר לאחר 3 דיווחים' },
```

**L1908**

```
    modActionTaken: { body: '✅ טופל ע״י אדמין · {action} · {time}' },
```

**L1910**

```
      body: 'הפוסט שלך הוסר אוטומטית בעקבות דיווחים חוזרים. אם זו טעות, ניתן לערער דרך כתובת התמיכה.',
```

**L1914**

```
    restore: '↩ שחזר',
```

**L1915**

```
    dismiss: '🗑 דחה דיווח',
```

**L1916**

```
    confirm: '✓ אשר הסרה',
```

**L1917**

```
    ban: '🚫 חסום משתמש',
```

**L1918**

```
    removePost: '🗑 הסר פוסט',
```

**L1919**

```
    deleteMessage: '🗑 מחק הוֹדָעָה',
```

**L1921**

```
      restore: 'פעולה זו תסמן את הדיווחים על המטרה כשגויים, מה שעלול לגרור סנקציה לרֶפּוֹרְטֵרים. להמשיך?',
```

**L1922**

```
      dismiss: 'סמן דיווח זה כשגוי. אין השפעה על דיווחים אחרים. להמשיך?',
```

**L1923**

```
      confirm: 'אשר את ההסרה האוטומטית כהפרה ודאית. להמשיך?',
```

**L1924**

```
      ban: 'פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?',
```

**L1925**

```
      removePost: 'הסר פוסט זה כאדמין. להמשיך?',
```

**L1926**

```
      deleteMessage: 'מחק הוֹדָעָה זו לצמיתות. להמשיך?',
```

**L1929**

```
      restore: 'המטרה שוחזרה.',
```

**L1930**

```
      dismiss: 'הדיווח נדחה.',
```

**L1931**

```
      confirm: 'הדיווח אושר.',
```

**L1932**

```
      ban: 'המשתמש נחסם.',
```

**L1933**

```
      removePost: 'הפוסט הוסר.',
```

**L1934**

```
      deleteMessage: 'ההוֹדָעָה נמחקה.',
```

**L1937**

```
      forbidden: 'אין לך הרשאה לפעולה זו.',
```

**L1938**

```
      invalidRestoreState: 'לא ניתן לשחזר את המטרה במצבה הנוכחי.',
```

**L1939**

```
      networkError: 'תקלה ברשת. נסה שוב.',
```

**L1944**

```
  title: 'אאודיט',
```

**L1945**

```
  searchPlaceholder: 'חפש משתמש לפי שם...',
```

**L1946**

```
  noResults: 'אין תוצאות.',
```

**L1947**

```
  loading: 'טוען...',
```

**L1948**

```
  metadataLabel: 'מטא-דאטה',
```

**L1951**

```
    block_user: 'חסימה',
```

**L1952**

```
    unblock_user: 'ביטול חסימה',
```

**L1953**

```
    report_target: 'דיווח',
```

**L1954**

```
    auto_remove_target: 'הסרה אוטומטית',
```

**L1955**

```
    manual_remove_target: 'הסרה ידנית',
```

**L1956**

```
    restore_target: 'שחזור',
```

**L1957**

```
    suspend_user: 'השעיה',
```

**L1958**

```
    unsuspend_user: 'החזרה לפעילות',
```

**L1959**

```
    ban_user: 'חסימה לצמיתות',
```

**L1960**

```
    false_report_sanction_applied: 'סנקציה על דיווחי שווא',
```

**L1961**

```
    dismiss_report: 'דחיית דיווח',
```

**L1962**

```
    confirm_report: 'אישור דיווח',
```

**L1963**

```
    delete_message: 'מחיקת הוֹדָעָה',
```

**L1968**

```
    title: 'החשבון נחסם לצמיתות',
```

**L1969**

```
    body: 'החשבון שלך נחסם בעקבות הפרת מדיניות הקהילה.',
```

**L1970**

```
    cta: 'יצירת קשר',
```

**L1973**

```
    title: 'החשבון הושעה',
```

**L1974**

```
    body: 'המוֹדֶרציָה השעתה את החשבון שלך עד לבירור.',
```

**L1975**

```
    cta: 'ערעור',
```

**L1978**

```
    title: 'החשבון מושעה זמנית',
```

**L1979**

```
    body: 'החשבון שלך מושעה עד {until} עקב 5 דיווחים שגויים ב-30 הימים האחרונים.',
```

**L1980**

```
    cta: 'ערעור מוקדם',
```

**L2059**

```
      { text: 'ביטול', style: 'cancel' },
```

**L2061**

```
        text: 'המשך',
```

**L2348**

```
          <Pressable onPress={onClose}><Text style={{ marginTop: 8 }}>ביטול</Text></Pressable>
```

**L2358**

```
In `app/profile/[id].tsx`, surface a `🚫 חסום משתמש` entry in the `⋮` menu only when `useIsSuperAdmin() === true && targetUserId !== currentUserId`.
```

**L2375**

```
In the user-message bubble rendering, when `useIsSuperAdmin() === true && msg.kind !== 'system'`, surface a long-press or overflow item "🗑 מחק כאדמין":
```

**L2698**

```
  btns?.find((b: any) => b.text === 'המשך')?.onPress?.();
```

**L2708**

```
    fireEvent.press(getByText('הטרדה'));
```

**L2709**

```
    fireEvent.press(getByText('חסום'));
```

**L2735**

```
    expect(queryByText('↩ שחזר')).toBeNull();
```

**L2743**

```
    expect(queryByText('↩ שחזר')).not.toBeNull();
```

**L2751**

```
    expect(queryByText('↩ שחזר')).toBeNull();
```

**L2773**

```
    expect(getByText('החשבון נחסם לצמיתות')).toBeTruthy();
```

**L2779**

```
    expect(getByText('החשבון מושעה זמנית')).toBeTruthy();
```

**L2831**

```
Sign out, sign in as super admin → open chat with the reporter → expect a `report_received` system bubble with `🗑 דחה דיווח` button visible.
```

**L2835**

```
Have 3 distinct test accounts each report the same post → as super admin, expect an `auto_removed` bubble with `↩ שחזר` button. Tap it → confirmation modal → post returns to feed; bubble dims.
```

**L2851**

```
As super admin, open Settings → "אאודיט" → search a user → expect rows to load.
```

---

## `docs/superpowers/plans/2026-05-12-report-target-deeplink.md`

**L787**

```
      title: 'דיווח התקבל',
```

**L788**

```
      body: 'דיווח על {target_type} · {reason} · {count}/3',
```

**L791**

```
      title: 'הוסר אוטומטית',
```

**L792**

```
      body: '{target_type} הוסר לאחר 3 דיווחים',
```

**L795**

```
      body: '✅ טופל ע״י אדמין · {action} · {time}',
```

**L798**

```
      body: 'הפוסט שלך הוסר אוטומטית בעקבות דיווחים חוזרים. אם זו טעות, ניתן לערער דרך כתובת התמיכה.',
```

**L801**

```
      open: 'פתח',
```

**L802**

```
      postLabel: 'פוסט',
```

**L803**

```
      profileLabel: 'פרופיל',
```

**L804**

```
      hasImage: '📷 כולל תמונה',
```

**L805**

```
      reporterNoteLabel: 'הערת מדווח:',
```

**L806**

```
      evidenceLabel: 'צילום מצב מרגע הדיווח',
```

**L807**

```
      chatNote: 'דיווח על שיחה — מוצג הצד השני',
```

**L808**

```
      a11yOpenPost: 'פתח פוסט מאת ‎@{handle}',
```

**L809**

```
      a11yOpenProfile: 'פתח פרופיל של ‎@{handle}',
```

**L1394**

```
- Title "דיווח התקבל" present.
```

**L1396**

```
- Chat-report bubble shows "דיווח על שיחה — מוצג הצד השני" note above the preview, and the preview is the OTHER party (not the reporter).
```

**L1398**

```
- "פטור" / "אשר הפרה" buttons still work and do not trigger navigation.
```

**L1399**

```
- Evidence label "צילום מצב מרגע הדיווח" present.
```

**L1403**

```
Have three different test users report the same post in sequence. Confirm in the third reporter's support thread (admin's view) that a "הוסר אוטומטית" bubble appears with the rich preview + tap-to-open.
```

**L1519**

```
and the reported content. Previously, admins saw `דיווח חדש: Spam · יעד: post`
```

---

## `docs/superpowers/plans/2026-05-13-closed-posts-on-both-profiles.md`

**L5**

```
**Goal:** Surface `closed_delivered` posts on **both** the publisher's profile and the respondent's profile, with an economic-role badge (📤 נתתי / 📥 קיבלתי) derived from `(post.type, identity-role)`. Visibility to third parties follows the post's original `visibility` setting.
```

**L804**

```
   * When set, an economic-role badge ("📤 נתתי" / "📥 קיבלתי") renders on
```

**L806**

```
   *   publisher + Give    → giver  → 📤 נתתי
```

**L807**

```
   *   publisher + Request → receiver → 📥 קיבלתי
```

**L808**

```
   *   respondent + Give   → receiver → 📥 קיבלתי
```

**L809**

```
   *   respondent + Request→ giver   → 📤 נתתי
```

**L844**

```
              {economicRole === 'giver' ? '📤 נתתי' : '📥 קיבלתי'}
```

**L901**

```
// Grid + loader + empty state for the "פוסטים סגורים" tab.
```

**L926**

```
    title: 'אין פוסטים סגורים עדיין',
```

**L927**

```
    subtitle: 'פוסטים שסגרת או שקיבלת יופיעו כאן.',
```

**L931**

```
    title: 'אין פוסטים סגורים',
```

**L932**

```
    subtitle: 'משתמש זה עוד לא סגר ולא קיבל פוסט.',
```

**L1180**

```
- For `postType === 'Give'`, the banner reads "X מסר ל-Y" (or equivalent phrasing).
```

**L1181**

```
- For `postType === 'Request'`, the banner reads "Y מסר ל-X" / "X קיבל מ-Y" (or equivalent).
```

**L1191**

```
  ? `${publisherName} מסר ל-${respondentName}`
```

**L1192**

```
  : `${publisherName} קיבל מ-${respondentName}`;
```

**L1234**

```
- Tap "פוסטים סגורים".
```

**L1235**

```
- Confirm at least one card with 📤 נתתי badge (if the admin has published a closed post) and at least one with 📥 קיבלתי (if the admin has been picked as respondent).
```

**L1236**

```
- Tap a 📥 קיבלתי card: confirm the "Remove my recipient mark" CTA appears (FR-POST-017).
```

**L1237**

```
- Tap a 📤 נתתי card: confirm the "Reopen" CTA appears (FR-POST-016).
```

**L1244**

```
- Tap "פוסטים סגורים".
```

**L1285**

```
   - **Active Posts** (Hebrew label: *"פוסטים פתוחים"*): unchanged — lists all `open` posts authored by the user including `Public`, `Followers only`, and `Only me`. Each card carries a visual badge showing its visibility.
```

**L1286**

```
   - **Closed Posts** (Hebrew label: *"פוסטים סגורים"*): lists posts where the user is **either the publisher or the respondent**. The publisher side covers status `closed_delivered` and (for the user's own view) `deleted_no_recipient` within the 7-day grace window so they can still reopen — FR-CLOSURE-005 AC4, FR-CLOSURE-008. The respondent side covers only `closed_delivered`. Ordered by `closed_at` desc. Each card shows an economic-role badge derived from `(post.type, identity-role)`: 📤 נתתי when the profile owner is the giver, 📥 קיבלתי when the profile owner is the receiver. (Revised 2026-05-13 per D-19.)
```

**L1302**

```
- AC1. A user picked as the respondent of a `closed_delivered` post sees the post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the respondent's profile, subject to the post's original `visibility` setting (Public / Followers-only / Only-me). The "Remove my recipient mark" CTA remains exclusive to the respondent themselves. (Revised 2026-05-13 per D-19 — reverses the respondent-privacy carve-out previously in D-7.)
```

**L1308**

```
- AC5. When a third party opens the post via the respondent's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). Banner reflects the transaction: *"[publisher] מסר ל-[respondent] בתאריך D"* for `Give` posts, *"[publisher] קיבל מ-[respondent] בתאריך D"* for `Request` posts.
```

**L1318**

```
Closed-delivered posts appear in the "פוסטים סגורים" tab of both the publisher's and the respondent's profile. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — no automatic upgrade on close. Each card shows an economic-role badge (📤 נתתי / 📥 קיבלתי) derived from `(post.type, identity-role)`.
```

---

## `docs/superpowers/plans/2026-05-13-push-notifications.md`

**L453**

```
    const result = coalesceChat({ priorCount: 0, senderName: 'Avi', messagePreview: 'שלום' });
```

**L457**

```
      bodyArgs: { senderName: 'Avi', messagePreview: 'שלום' },
```

**L1050**

```
  "notifications.chatBodyCoalesced": "{{count}} הודעות חדשות",
```

**L1051**

```
  "notifications.supportTitle": "תמיכת קהילת קארמה",
```

**L1052**

```
  "notifications.systemTitle": "הודעת מערכת",
```

**L1054**

```
  "notifications.postExpiringTitle": "הפוסט שלך יפוג בעוד 7 ימים",
```

**L1057**

```
  "notifications.markRecipientBody": "סימן אותך כמקבל של {{postTitle}}",
```

**L1059**

```
  "notifications.unmarkRecipientBody": "הסיר את הסימון מ-{{postTitle}}",
```

**L1060**

```
  "notifications.autoRemovedTitle": "הפוסט שלך הוסר",
```

**L1061**

```
  "notifications.autoRemovedBody": "הסיבה: דווח על-ידי מספר משתמשים. למידע נוסף — לחץ.",
```

**L1063**

```
  "notifications.followRequestBody": "מבקש לעקוב אחריך",
```

**L1065**

```
  "notifications.followStartedBody": "התחיל לעקוב אחריך",
```

**L1066**

```
  "notifications.followStartedCoalesced": "{{count}} עוקבים חדשים",
```

**L1068**

```
  "notifications.followApprovedBody": "אישר את בקשת המעקב שלך"
```

**L1735**

```
  settingsTitle: 'התראות',
```

**L1736**

```
  criticalLabel: 'קריטיות',
```

**L1737**

```
  criticalCaption: "הודעות צ'אט, סימון כמקבל, התראות מערכת, פוסט שעומד לפוג, הסרת תוכן",
```

**L1738**

```
  socialLabel: 'חברתיות',
```

**L1739**

```
  socialCaption: 'עוקבים חדשים, בקשות מעקב, בקשות מאושרות',
```

**L1740**

```
  deviceStatusSection: 'סטטוס המכשיר',
```

**L1741**

```
  permissionGranted: 'הרשאת התראות מופעלת',
```

**L1742**

```
  permissionDenied: 'הרשאה חסומה בהגדרות המכשיר',
```

**L1743**

```
  tokenRegistered: 'המכשיר רשום',
```

**L1744**

```
  tokenNotRegistered: 'המכשיר טרם נרשם',
```

**L1745**

```
  openOsSettings: 'פתח הגדרות',
```

**L1747**

```
  enablePushTitle: 'להישאר בקשר?',
```

**L1748**

```
  enablePushBodyFromChat: 'נשלח לך התראה כשמישהו עונה לך — גם כשהאפליקציה סגורה.',
```

**L1749**

```
  enablePushBodyFromPost: 'נשלח לך התראה כשמישהו פנה בנוגע לפוסט שלך — גם כשהאפליקציה סגורה.',
```

**L1750**

```
  enablePushAccept: 'כן, להפעיל',
```

**L1751**

```
  enablePushDecline: 'אולי בפעם אחרת',
```

**L1756**

```
  chatBodyCoalesced: '{{count}} הודעות חדשות',
```

**L1757**

```
  supportTitle: 'תמיכת קהילת קארמה',
```

**L1758**

```
  systemTitle: 'הודעת מערכת',
```

**L1760**

```
  postExpiringTitle: 'הפוסט שלך יפוג בעוד 7 ימים',
```

**L1763**

```
  markRecipientBody: 'סימן אותך כמקבל של {{postTitle}}',
```

**L1765**

```
  unmarkRecipientBody: 'הסיר את הסימון מ-{{postTitle}}',
```

**L1766**

```
  autoRemovedTitle: 'הפוסט שלך הוסר',
```

**L1767**

```
  autoRemovedBody: 'הסיבה: דווח על-ידי מספר משתמשים. למידע נוסף — לחץ.',
```

**L1769**

```
  followRequestBody: 'מבקש לעקוב אחריך',
```

**L1771**

```
  followStartedBody: 'התחיל לעקוב אחריך',
```

**L1772**

```
  followStartedCoalesced: '{{count}} עוקבים חדשים',
```

**L1774**

```
  followApprovedBody: 'אישר את בקשת המעקב שלך',
```

**L2277**

```
### Task 24: Settings → התראות screen
```

**L2379**

```
In `app/apps/mobile/app/settings.tsx`, find the "התראות" row (currently a no-op alert per TD-107). Replace its `onPress` with:
```

**L2395**

```
git commit -m "feat(notif)(mobile): add Settings → התראות screen with optimistic toggle
```

**L2486**

```
- FR-SETTINGS-005 — Settings → התראות screen
```

---

## `docs/superpowers/plans/2026-05-14-mvp-email-verification-gate.md`

**L979**

```
      const message = isAuthError(err) ? mapAuthErrorToHebrew(err.code) : 'שגיאת רשת. נסה שוב.';
```

**L989**

```
      <Text style={styles.title}>בדוק את האימייל שלך</Text>
```

**L991**

```
        שלחנו לינק לאימות אל <Text style={styles.bodyBold}>{email}</Text>. לחץ עליו כדי להמשיך.
```

**L995**

```
        <Text style={styles.primaryBtnText}>פתח אימייל</Text>
```

**L1007**

```
            {cooldown > 0 ? `שלח שוב (${cooldown})` : 'שלח שוב'}
```

**L1012**

```
      {resendOk ? <Text style={styles.helperOk}>נשלח. בדוק את תיבת הדואר.</Text> : null}
```

**L1016**

```
        <Text style={styles.tertiaryBtnText}>שנה אימייל</Text>
```

**L1098**

```
**Replace the `handleSignUp` body** (lines 22-50, current `Alert.alert('כמעט שם', ...)`-based flow):
```

**L1103**

```
    Alert.alert('שגיאה', 'יש למלא כל השדות');
```

**L1124**

```
      : 'שגיאת רשת. נסה שוב.';
```

**L1125**

```
    Alert.alert('הרשמה נכשלה', message);
```

**L1154**

```
    <Text style={styles.legal}>בהרשמה אתה מסכים…</Text>
```

**L1197**

```
    Alert.alert('שגיאה', 'יש למלא דוא"ל וסיסמה');
```

**L1211**

```
      : 'שגיאת רשת. נסה שוב.';
```

**L1212**

```
    Alert.alert('כניסה נכשלה', message);
```

**L1270**

```
      setError('קישור האימות אינו תקין.');
```

**L1291**

```
          : 'הקישור פג תוקף או כבר מומש. נסה להתחבר.';
```

**L1303**

```
        <Text style={styles.title}>האימות לא הצליח</Text>
```

**L1306**

```
          <Text style={styles.btnText}>חזרה למסך הכניסה</Text>
```

**L1314**

```
      <Text style={styles.body}>מאמת…</Text>
```

**L1487**

```
Locate the `router.replace({ pathname: '/account-blocked', params: { reason: result.reason ?? 'banned', ... } })` call. Verify that `/account-blocked` either handles `reason === 'pending_verification'` with a sensible Hebrew message ("יש לאמת את האימייל לפני שניתן להיכנס") or — preferably — redirect to `/(auth)/sign-in` directly when `result.reason === 'pending_verification'` (since the sign-in screen will re-show the verify-pending panel on next attempt).
```

**L1534**

```
> AC2. Supabase Auth creates the account with `email_confirmed_at = null`. The user **cannot sign in** until they click the verification link in the email — `signInWithPassword` returns `email_not_confirmed`. The sign-up screen transitions in place to a verification-pending state with three actions: "פתח אימייל" (launches the default mail client on native; routes to a known webmail provider on web based on the email domain), "שלח שוב" (resends the verification email; disabled for 60 seconds after each click), and "שנה אימייל" (returns to the form with the previously typed email/password preserved). The same verification-pending state is rendered on the sign-in screen when the user attempts to sign in with an unconfirmed email.
```

**L1621**

```
2. Click "שלח שוב" — verify the countdown starts at 60.
```

**L1622**

```
3. Click "פתח אימייל" — verify Gmail (or appropriate webmail) opens in a new tab.
```

---

## `docs/superpowers/plans/2026-05-14-onboarding-smart-animations.md`

**L533**

```
          accessibilityLabel="דלג"
```

**L536**

```
          <Text style={[styles.skip, skipDisabled && styles.muted]}>דלג</Text>
```

**L539**

```
          שלב {step} מתוך 4
```

**L545**

```
          accessibilityLabel="חזרה"
```

**L758**

```
  <Text style={styles.title}>פרטים בסיסיים</Text>
```

**L765**

```
  <Text style={styles.label}>שם מלא</Text>
```

**L770**

```
    placeholder="לדוגמה: רינה כהן"
```

**L803**

```
  accessibilityLabel="המשך"
```

**L808**

```
    <Text style={styles.ctaText}>המשך</Text>
```

**L876**

```
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
```

**L877**

```
      Alert.alert('העלאת התמונה נכשלה', `אפשר לדלג ולהוסיף תמונה מאוחר יותר.\n${msg}`);
```

**L890**

```
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
```

**L891**

```
      Alert.alert('הסרת התמונה נכשלה', msg);
```

**L907**

```
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
```

**L908**

```
      Alert.alert('שמירה נכשלה', msg);
```

**L974**

```
          <Text style={styles.title}>תמונת פרופיל</Text>
```

**L977**

```
          <Text style={styles.subtitle}>אפשר להוסיף עכשיו או בהמשך</Text>
```

**L985**

```
            accessibilityLabel={flow.hasAvatar ? 'החלפת תמונת פרופיל' : 'הוספת תמונת פרופיל'}
```

**L988**

```
              name={flow.session?.displayName ?? 'משתמש'}
```

**L1006**

```
            <Text style={styles.changeBtnText}>{flow.hasAvatar ? 'החלף תמונה' : 'בחר תמונה'}</Text>
```

**L1022**

```
                {flow.hasAvatar ? 'המשך עם התמונה הנוכחית' : 'המשך ללא תמונה'}
```

**L1028**

```
          <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בהגדרות.</Text>
```

**L1301**

```
    title: 'תן ובקש',
```

**L1302**

```
    body: 'פרסם פריטים שאתה רוצה לתת או בקש דברים שאתה צריך, תמיד אפשר גם לחפש — הכל בקהילה.',
```

**L1306**

```
    title: 'תאמו בצ׳אט',
```

**L1307**

```
    body: 'פותחים שיחה במהירות ישר דרך הפוסט, מתאמים איסוף בקלות, ומחזקים את הקהילה!',
```

**L1311**

```
    title: 'סמן כנמסר',
```

**L1312**

```
    body: 'אחרי שהפריט עבר ידיים — סמן את הפוסט כסגור. ככה כולנו רואים את הקהילה זזה.',
```

**L1338**

```
          <Text style={styles.ctaText}>{isLast ? 'בואו נתחיל' : 'הבא'}</Text>
```

**L1451**

```
- [ ] Tapping "המשך" pushes `basic-info` with a 280ms slide-from-right (iOS) / fade (Android).
```

**L1455**

```
- [ ] On `tour`: emoji spring-bounces, dots animate width (8→24px), swipe-left advances slide, swipe-right goes back, "בואו נתחיל" navigates to `(tabs)`.
```

---

## `docs/superpowers/specs/2026-05-11-delete-account-design.md`

**L3**

```
# P2.2 — Delete Account (V1 פרגמטי) Design Spec
```

**L5**

```
> תאריך: 2026-05-11 · אחראי: agent יחיד (single-branch single-PR) · סטטוס: ממתין לאישור משתמש (אחרי revision לפי council review) · FR refs: FR-SETTINGS-012 (יישום חלקי — V1 פרגמטי), FR-AUTH-016 (לא מיושם — נדחה ל-V1.1)
```

**L7**

```
## 1 — בעיה ומטרה
```

**L9**

```
כפתור "מחק חשבון" קיים בהגדרות אבל ה-`onPress` שלו ב-`apps/mobile/app/settings.tsx:169` הוא stub ריק. בנוסף, הסכמה הנוכחית של `chats.participant_a/b` עם `on delete cascade` הייתה גורמת להעלמת השיחה גם בצד הנגדי — לא קביל לפלטפורמה חברתית.
```

**L11**

```
המטרה: לאפשר למשתמש למחוק את חשבונו לחלוטין ומיידית, באישור חזק עם הקלדת מילת אישור, באופן שמותיר אצל הצד הנגדי בשיחה את ההיסטוריה (עם תווית "משתמש שנמחק"), משחרר את האימייל / זהות הגוגל להרשמה מחדש כמשתמש חדש, ומונע ממשתמש מושעה/חסום לעקוף מודרציה דרך המחיקה.
```

**L13**

```
## 2 — החלטות (מתוך ה-brainstorming + council review)
```

**L15**

```
| # | שאלה | החלטה |
```

**L17**

```
| Q1 | היקף לעומת FR-SETTINGS-012 המלא | **V1 פרגמטי.** מיישמים מחיקה אמיתית מיידית + שימור שיחות + ניקוי מלא של דאטה אישית + רישום audit + חסימת מושעים. **לא** מיישמים: טבלת `DeletedIdentifier` עם cooldown של 30 ימים, cron של פרגייה רכה→קשה, אימייל אישור, מסך תמיכה. נדחים ל-V1.1. |
```

**L18**

```
| Q2 | מה קורה לזיהוי הגרסה הישנה | **שחרור מיידי.** מחיקת `auth.users` מסירה את הקישור לאימייל / זהות הגוגל. המשתמש יכול מיד להירשם מחדש; הרשמה כזו יוצרת `auth.users` חדש ו-`public.users` חדש (טריגר `handle_new_user` הקיים, ראו §3.3.0 לאימות). |
```

**L19**

```
| Q3 | שיחות בצד הנגדי | **נשמרות.** משנים את ה-FK של `chats.participant_a/b` מ-`on delete cascade` ל-`on delete set null`. הצד הנגדי ממשיך לראות את השיחה וההודעות; שם → "משתמש שנמחק" + אווטר ברירת מחדל. |
```

**L20**

```
| Q4 | UX של האישור | **חלון אזהרה אחד חזק + הקלדת מילת אישור.** מודאל עם כותרת אדומה, פירוט מה ימחק, אזהרה שהפעולה לא הפיכה, שדה הקלדה ("הקלד 'מחק' כדי לאשר"), ושני כפתורים: "ביטול" ו-"מחק את החשבון לצמיתות". כפתור המחיקה מנוטרל עד שהטקסט בשדה תואם בדיוק ל-"מחק". |
```

**L21**

```
| Q5 | משתמש מושעה / חסום | **חסום מחיקה.** אם `account_status in ('suspended_for_false_reports','suspended_admin','banned')` — ה-RPC זורק `forbidden`; ה-UI מציג "לא ניתן למחוק חשבון מושעה. פנה לבירור דרך הדיווח". מונע עקיפת מודרציה. |
```

**L22**

```
| Q6 | מצב כישלון `auth.admin.deleteUser` | **מודאל לא-נסגר עם copy מחמיר.** המודאל הופך לא-dismissible (אי-אפשר tap-outside, אי-אפשר back), copy מסביר שהמחיקה לא הושלמה ושסגירת האפליקציה תגרור חשבון לא תקין, ויש רק כפתור "נסה שוב". מטופל ב-§5.4. |
```

**L23**

```
| Q7 | מסך אחרי מחיקה מוצלחת | **Overlay קצר.** לפני ניווט למסך התחברות, מוצג overlay מלא 1.5 שניות: "חשבונך נמחק. תודה שהיית חלק מקארמה." סוגר את הלולאה רגשית. |
```

**L25**

```
## 3 — ארכיטקטורה
```

**L27**

```
### 3.0 — אימותים נדרשים לפני קוד (pre-implementation checks)
```

**L29**

```
חובה לאמת ולתעד בתחתית המפרט / ב-PROJECT_STATUS לפני שמתחילים:
```

**L31**

```
1. **טריגר `handle_new_user`** קיים על `auth.users` INSERT, ב-`0001_init_users.sql:175` (נצפה במהלך הסקירה). מאמתים שהוא רץ נכון בהרשמה ידנית של משתמש דמו אחרי מחיקה.
```

**L32**

```
2. **אין consumer של `audit_events.action`** שמבצע exhaustive switch על הערכים הקיימים (למשל בדאשבורד אדמין). חיפוש מהיר ב-`apps/mobile/**` וב-`packages/**` כדי לוודא.
```

**L33**

```
3. **interceptor של `401`** בקליינט סופאבייס — אם לא קיים, V1 מקבל זאת (המשתמש יבחין בשגיאה הבאה ויחזור למסך התחברות).
```

**L35**

```
### 3.1 שכבת Domain (`packages/domain`) — אפס שינויים
```

**L37**

```
הסוגים הקיימים מספיקים. אין צורך ב-entity חדש.
```

**L39**

```
### 3.2 שכבת Application (`packages/application`)
```

**L41**

```
**Use case חדש** (לפי קונבנציות הריפו — feature-folder, `Promise<T>` + throw, לא `Result<>`):
```

**L43**

```
- מיקום: **`packages/application/src/auth/DeleteAccountUseCase.ts`** (לצד `SignOut.ts`, `SignUpWithEmail.ts`)
```

**L44**

```
- תלות יחידה: `IUserRepository`
```

**L45**

```
- חתימה: `execute(): Promise<void>` — בלי פרמטר `userId` (הזהות נשלפת מ-JWT בצד השרת)
```

**L46**

```
- בכישלון: זורק `DeleteAccountError` חדש מתוך `packages/application/src/auth/errors.ts` (מירור של `packages/application/src/donations/errors.ts`)
```

**L47**

```
- קודי שגיאה ב-`DeleteAccountError`:
```

**L48**

```
  - `UNAUTHENTICATED` — אין סשן פעיל
```

**L49**

```
  - `SUSPENDED` — חשבון מושעה/חסום, RPC דחה
```

**L50**

```
  - `AUTH_DELETE_FAILED` — DB נוקה אבל `auth.users` שרד (המצב המסוכן ב-§5.4)
```

**L51**

```
  - `NETWORK` — תקלת רשת
```

**L52**

```
  - `SERVER_ERROR` — שגיאה כללית מהשרת
```

**L54**

```
**שינוי בפורט `IUserRepository`:**
```

**L56**

```
הפעולה `delete(userId)` הקיימת ב-`packages/application/src/ports/IUserRepository.ts:22` היא generic ולא משקפת את הזרימה (כל הזהות מה-JWT, אין userId argument). מוסיפים שיטה חדשה ייעודית:
```

**L62**

```
ה-`delete(userId)` הקיים נשאר ב-port אבל מסומן כ-`/** @deprecated — see deleteAccountViaEdgeFunction */` ב-V1 (משאיר את האפשרות לפעולה אדמיניסטרטיבית עתידית של מחיקת משתמש אחר). מקביל לדפוס `IPostRepository.delete` ↔ `adminRemove`.
```

**L64**

```
### 3.3 שכבת Infrastructure (`packages/infrastructure-supabase` + `supabase/`)
```

**L66**

```
**3.3.1 מיגרציה — `supabase/migrations/00XX_chats_participant_set_null.sql`**
```

**L68**

```
> מספר ה-migration יוקצה בזמן ה-PR (לרענן לפי `git pull` של main; הריפו ב-0027 כרגע אבל יכול להתקדם). המפרט מתייחס לה כ-"מיגרציה 1".
```

**L70**

```
מטרה: לאפשר לשיחה לשרוד אחרי מחיקת אחד המשתתפים, **ולתקן את כל מדיניות ה-RLS שתשבר כשהמשתתף הופך NULL**.
```

**L72**

```
שינויים בסכמה:
```

**L75**

```
3. הסרת ה-FK הקיים על שתי העמודות, ויצירתו מחדש עם `on delete set null`.
```

**L76**

```
4. הוספת `check (participant_a is not null or participant_b is not null)` — מונע שיחות-יתום של שני משתמשים שנמחקו.
```

**L77**

```
5. **עדכון `chats_canonical_order`** הקיים (`0004:25`): כיום `check (participant_a < participant_b)`. אחרי NULL → ה-`<` מחזיר NULL → CHECK עובר (כי CHECK נכשל רק על FALSE מפורש). זה לא שובר עכשיו, אבל ה-constraint מאבד משמעות עבור שיחות מאונונמיזציה. שני אפשרויות:
```

**L78**

```
   - **א)** לעדכן ל-`check (participant_a is null or participant_b is null or participant_a < participant_b)` — שומר על canonical pair רק לשיחות "חיות"
```

**L79**

```
   - **ב)** להסיר את ה-constraint לחלוטין
```

**L80**

```
   - **בחירה ל-V1: (א)** — שומר על האכיפה לזוגות פעילים.
```

**L82**

```
שכתוב פונקציות RLS-עזר ל-NULL-safe:
```

**L84**

```
6. **`is_chat_visible_to(p_chat, p_viewer)`** — הפונקציה המרכזית, מוגדרת ב-`0004:106` ו-refreshed ב-`0005:32`. כיום היא משתמשת ב-`p_viewer not in (p_chat.participant_a, p_chat.participant_b)`. שכתוב NULL-safe:
```

**L106**

```
(שינוי קריטי: `not in` → `is distinct from` × 2 — `is distinct from` הוא NULL-safe.)
```

**L108**

```
7. **`messages_insert_user`** ב-`0004:284` משתמש ב-`auth.uid() in (c.participant_a, c.participant_b)`. שכתוב: `auth.uid() = c.participant_a or auth.uid() = c.participant_b`. ההבדל: `=` החזרה NULL כשהפרמטר NULL → ה-`or` יכול עדיין להחזיר TRUE אם הצד השני תואם. ההתנהגות נכונה: הצד הנותר עדיין יכול לכתוב; צד NULL כבר לא יכול (אין JWT שלו).
```

**L109**

```
8. **`messages_update_status_recipient`** ב-`0004:301` — בדיקה דומה. שכתוב אנלוגי.
```

**L110**

```
9. **`chats_insert_self`** ב-`0004:255` — שכתוב אנלוגי.
```

**L111**

```
10. **`users_select_chat_counterpart`** ב-`0012` — לוודא ולשכתב אם דרוש (בדיקה בזמן יישום).
```

**L112**

```
11. **`rpc_chat_unread_total`** ב-`0011:33` — לוודא ולשכתב אם דרוש.
```

**L114**

```
**הערה על `chats_select_visible`** (`0004:247`): משתמש ב-`is_chat_visible_to(chats.*, auth.uid())`. אחרי שינוי 6 → אוטומטית NULL-safe. אין צורך לגעת במדיניות עצמה.
```

**L116**

```
**הערה על `messages_select_visible`** (`0004:265`): גם הוא מסתמך על `is_chat_visible_to`. אוטומטית מתוקן.
```

**L118**

```
**אימות בזמן יישום:** לרוץ `grep -rn "participant_a\|participant_b" supabase/migrations/` ולוודא שכל policy / function / trigger שמשתמש בהן או מטופל בשינוי 6 דרך `is_chat_visible_to`, או מתוקן ישירות (שינויים 7-11).
```

**L120**

```
**3.3.2 מיגרציה — `supabase/migrations/00XX_delete_account_rpc.sql`**
```

**L122**

```
מיגרציה 2. שתי משימות:
```

**L124**

```
**(א) הרחבת CHECK של `audit_events.action`:**
```

**L126**

```
הוספת `'delete_account'` לרשימה. ה-CHECK הקיים ב-`0005:172` הוא inline ובלי שם מפורש → צריך `pg_constraint` lookup או `alter ... drop constraint <auto-name>`. הדפוס: `select conname from pg_constraint where conrelid='public.audit_events'::regclass and contype='c'` בזמן היישום, ואז `alter table ... drop constraint <name>; alter table ... add constraint audit_events_action_check check (action in (..., 'delete_account'))`.
```

**L128**

```
> שיקלנו שימוש חוזר ב-`'manual_remove_target'` (כפי שעשו ב-`0020`) במקום action חדש — נדחה. סמנטית `manual_remove_target` הוא אדמין-על-משתמש; פה זה משתמש-על-עצמו, ראוי לערך נפרד.
```

**L130**

```
**(ב) ה-RPC המרכזי:**
```

**L232**

```
**הבהרות מפתח:**
```

**L234**

```
- **אין פרמטר** ב-RPC. הזהות נשלפת רק מ-`auth.uid()`. שטח התקיפה נסגר.
```

**L235**

```
- **`revoke ... from public; grant ... to authenticated;`** — חוסם anon מלקרוא. בלי זה, ברירת המחדל של Postgres נותנת `execute to public`.
```

**L236**

```
- **null-check על `auth.uid()`** — defense-in-depth מעבר ל-grant.
```

**L237**

```
- **חסימת מושעים/חסומים** מתבצעת ב-RPC עצמו (לא רק ב-Edge Function), כדי שגם קריאה ישירה ל-RPC לא תעקוף.
```

**L238**

```
- **snapshot של `actor_id`** ב-metadata — שורת האודיט תאבד את ה-`actor_id` הרגיל בשל ה-FK cascade `set null` שיופעל בשלב 6; ה-snapshot שומר על המידע.
```

**L239**

```
- **`donation_links.hidden_by`** מטופל מפורשות (null-out) — אחרת `auth.admin.deleteUser` היה נשבר בעמודה הזו.
```

**L240**

```
- **אידמפוטנטיות**: כשהמשתמש כבר לא קיים ב-`public.users` (retry אחרי כישלון auth-delete), הפונקציה מחזירה early עם מבנה תקין-ריק. ה-Edge Function ימשיך לשלב הבא.
```

**L244**

```
מתזמן את כל התהליך. דורש דפוס תואם ל-`supabase/functions/validate-donation-link/index.ts` (קיים כ-canonical reference):
```

**L246**

```
1. **CORS + OPTIONS preflight** — בלוק קיים שיועתק.
```

**L247**

```
2. **אימות אמיתי של ה-JWT** — `userClient.auth.getUser()` שמאמת את הטוקן בצד השרת. **לא** פיענוח claims לבד.
```

**L248**

```
3. **בדיקת `account_status` נוספת ב-FE** (לפני קריאה ל-RPC) — מאפשרת שגיאה מהירה ו-clear; ה-RPC בכל מקרה יחסום, אבל זה מציל round-trip.
```

**L249**

```
4. **קריאה ל-`adminClient.rpc('delete_account_data')`** — בלי פרמטרים.
```

**L250**

```
5. **מחיקת קבצי storage**:
```

**L251**

```
   - bucket: **`post-images`** (לא `media`! זו טעות במפרט הקודם — bucket האמיתי לפי `0002:288`)
```

**L252**

```
   - paths: כל הנתיבים שחזרו ב-`media_paths`
```

**L253**

```
   - **בנוסף**: ניקוי אווטר — אם `avatar_path` חזר ולא ריק, `storage.from('avatars').remove([avatar_path])`
```

**L254**

```
   - שגיאות storage **לא** מפילות את התהליך (לוג בלבד); ה-DB כבר נקי.
```

**L256**

```
   - הצלחה → `200 { ok: true, counts }`
```

**L257**

```
   - כישלון → `500 { ok: false, error: 'auth_delete_failed', counts }` — הקליינט יתרגם ל-`AUTH_DELETE_FAILED` (§5.4)
```

**L258**

```
7. **מיפוי שגיאות RPC**:
```

**L261**

```
   - אחר → `500 { error: 'db_failed' }`
```

**L263**

```
**מגבלת שורות:** סביר שהפונקציה תעבור 200 שורות (בעיקר בגלל CORS + error mapping). חובה לפצל ל-`cors.ts` ו-`auth.ts` באותה תיקייה (הדפוס של `validate-donation-link`).
```

**L265**

```
**3.3.4 יישום ב-`SupabaseUserRepository`**
```

**L267**

```
מיקום: `packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` (`delete()` הקיים שורות 165-167 מסומן `NOT_IMPL('delete', 'P2.2')` — נשאר כפי שהוא; נוספת שיטה חדשה).
```

**L283**

```
מיפוי שגיאות מדויק נקבע ביישום (בהתאם להתנהגות אמיתית של `functions.invoke`); המבנה הכללי הוא: status code → קוד שגיאה דומיין.
```

**L285**

```
### 3.4 שכבת UI (`apps/mobile`)
```

**L287**

```
**3.4.1 רכיב חדש — `apps/mobile/src/components/DeleteAccountConfirmModal.tsx`**
```

**L289**

```
> מיקום: flat ב-`components/` לצד `GuestJoinModal.tsx`, `ReportChatModal.tsx`, `ReopenConfirmModal.tsx` (אין subfolder `settings/` קיים, ולא יוצרים חדש בעבור קומפוננטה יחידה).
```

**L291**

```
> סטיילים: `.styles.ts` נפרד בקובץ אחותי (תואם הדפוס של `AddDonationLinkModal`).
```

**L293**

```
> כל הטקסטים ב-`i18n/he.ts` תחת `settings.deleteAccountModal.*` — לא inline.
```

**L299**

```
- `accountStatus: AccountStatus` — להחלטה אם להציג מסך-חסום במקום הזרימה הרגילה
```

**L301**

```
**מצבים פנימיים:**
```

**L302**

```
- `idle` — שדה הקלדה ריק; כפתור המחיקה מנוטרל
```

**L303**

```
- `ready` — הטקסט בשדה תואם בדיוק "מחק"; כפתור המחיקה פעיל
```

**L304**

```
- `submitting` — שני הכפתורים מנוטרלים, הראשי spinner, **מודאל לא-dismissible** (אי-אפשר tap-outside)
```

**L305**

```
- `error_recoverable` — באנר אדום: "המחיקה נכשלה — נסה שוב"; חוזר ל-`ready`; **dismissible**
```

**L306**

```
- `error_critical` (auth_delete_failed) — באנר אדום מודגש: "המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. **חובה ללחוץ 'נסה שוב' עכשיו** — אם תסגור את האפליקציה ייווצר חשבון לא תקין." **מודאל לא-dismissible** (חוסם tap-outside, hardware back, ו-X). רק כפתור "נסה שוב".
```

**L307**

```
- `blocked_suspended` — מסך-חסום מוחלף ב-content ראשי: "לא ניתן למחוק חשבון מושעה. פנה לבירור דרך מסך הדיווחים." רק כפתור "סגור". מוצג כש-`accountStatus` או כשהשרת מחזיר 403.
```

**L309**

```
**תוכן הזרימה הרגילה (idle / ready):**
```

**L310**

```
- **כותרת** (אדום בולט): "מחיקת חשבון לצמיתות"
```

**L311**

```
- **גוף — מה ימחק** (bullets):
```

**L312**

```
  - "כל הפוסטים שלך יימחקו (כולל תמונות)"
```

**L313**

```
  - "כל העוקבים והנעקבים יוסרו"
```

**L314**

```
  - "כל החסימות והדיווחים שהגשת יימחקו"
```

**L315**

```
  - "קישורי תרומה שהגדרת יימחקו"
```

**L316**

```
  - "כל המכשירים המחוברים שלך ינותקו"
```

**L317**

```
- **שורה דגושה (chat retention)**:
```

**L318**

```
  > "שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק 'משתמש שנמחק'."
```

**L319**

```
- **אזהרה תחתונה**:
```

**L320**

```
  > "הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית."
```

**L321**

```
- **שדה הקלדה**: label "הקלד 'מחק' כדי לאשר", placeholder אפור "מחק", input RTL right-aligned. הכפתור הראשי מנוטרל עד שהטקסט המדויק (אחרי trim) שווה "מחק".
```

**L322**

```
- **כפתורים בתחתית** (סדר RTL: ראשי-בימין):
```

**L323**

```
  - "מחק את החשבון לצמיתות" (אדום, ראשי, ימין) — מנוטרל ב-idle
```

**L324**

```
  - "ביטול" (משני אפור, שמאל) — תמיד פעיל פרט ל-`submitting` ו-`error_critical`
```

**L326**

```
**3.4.2 חיווט ב-`apps/mobile/app/settings.tsx`**
```

**L328**

```
שורה 169 (כיום `onPress={() => {}}`): מחליפים ב-handler שפותח את ה-modal. ה-state של ה-modal מנוהל בקומפוננטה האב או ב-store נתיב.
```

**L330**

```
`onConfirm` מבצע:
```

**L331**

```
1. קריאה ל-`deleteAccountUseCase.execute()` (DI דרך hook קיים)
```

**L332**

```
2. **הצלחה (ללא throw):**
```

**L333**

```
   - `setSuccessOverlayVisible(true)` — overlay מלא עם "חשבונך נמחק. תודה שהיית חלק מקארמה."
```

**L334**

```
   - timer 1500ms → `auth.signOut()` → `router.replace('/(auth)/sign-in')` (או הנתיב המקביל). הניווט עם `replace` כדי שאי-אפשר לחזור אחורה למסך מחוק.
```

**L336**

```
   - `UNAUTHENTICATED` → `auth.signOut()` + ניווט (סשן פג, פעולה רגילה)
```

**L341**

```
**3.4.3 רינדור "משתמש שנמחק" בשיחות**
```

**L343**

```
התשתית הקיימת ב-`SupabaseChatRepository.getCounterpart` (שורות 175-183 ב-`packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`) כבר מטפלת ב"משתמש לא נמצא → 'משתמש שנמחק'", וגם `getMyChats.ts` נופל-בחזרה דרך אותו ה-helper.
```

**L345**

```
**שינויים נדרשים:**
```

**L347**

```
1. **`rowMappers.ts:13`** — `[r.participant_a, r.participant_b] as [string, string]` משקר ל-TypeScript אחרי שינוי הסכמה. לעדכן ל-`[string | null, string | null]` ולעבור על כל ה-downstream consumers (`getMyChats.ts:52,73`, `SupabaseChatRepository.ts:166-168`) ולאמת שאין `null.something()`. הקוד הקיים רק עושה `===` השוואות — בטוח ב-runtime.
```

**L348**

```
2. **Realtime UPDATE על `chats`** — כש-participant הופך NULL, מתפרסם אירוע UPDATE. RLS המעודכן (3.3.1 שינוי 6) יוודא שהצד הנותר מקבל אותו. ה-FE handler ב-`apps/mobile/src/store/` או `apps/mobile/src/services/realtime/` (בדיקה ביישום) חייב להתמודד עם NULL participant — לטעון את הצד הנותר ולעדכן את הכרטיס.
```

**L349**

```
3. **`useChatInit.ts` ב-`apps/mobile/src/components/`** — כבר עובד עם `isDeleted` (שורות 18, 39). מאמתים שהשרשרת תקפה כש-`participantIds` מכילה NULL.
```

**L351**

```
### 3.5 שכבת i18n
```

**L353**

```
**קובץ:** `apps/mobile/src/i18n/he.ts`
```

**L355**

```
**מפתחות חדשים נדרשים** (תחת `settings.deleteAccountModal.*`):
```

**L358**

```
title:                 'מחיקת חשבון לצמיתות'
```

**L359**

```
bullets.posts:         'כל הפוסטים שלך יימחקו (כולל תמונות)'
```

**L360**

```
bullets.follows:       'כל העוקבים והנעקבים יוסרו'
```

**L361**

```
bullets.moderation:    'כל החסימות והדיווחים שהגשת יימחקו'
```

**L362**

```
bullets.donations:     'קישורי תרומה שהגדרת יימחקו'
```

**L363**

```
bullets.devices:       'כל המכשירים המחוברים שלך ינותקו'
```

**L364**

```
chatsRetention:        'שיחות שניהלת יישארו אצל האנשים שדיברת איתם. הם יראו את ההודעות שכתבת, אבל לא את שמך, התמונה או הפרופיל — רק "משתמש שנמחק".'
```

**L365**

```
warning:               'הפעולה אינה הפיכה. הפוסטים, ההיסטוריה והקשרים שלך לא ניתנים לשחזור. אין חלון ביטול — המחיקה מיידית.'
```

**L366**

```
confirmInputLabel:     'הקלד "מחק" כדי לאשר'
```

**L367**

```
confirmInputPlaceholder: 'מחק'
```

**L368**

```
buttons.cancel:        'ביטול'
```

**L369**

```
buttons.delete:        'מחק את החשבון לצמיתות'
```

**L370**

```
buttons.retry:         'נסה שוב'
```

**L371**

```
buttons.close:         'סגור'
```

**L372**

```
errors.recoverable:    'המחיקה נכשלה — נסה שוב'
```

**L373**

```
errors.critical:       'המחיקה לא הושלמה. הפוסטים והעוקבים שלך כבר נמחקו, אבל סגירת החשבון לא הסתיימה. חובה ללחוץ "נסה שוב" עכשיו — אם תסגור את האפליקציה ייווצר חשבון לא תקין.'
```

**L374**

```
blocked.title:         'לא ניתן למחוק חשבון מושעה'
```

**L375**

```
blocked.body:          'פנה לבירור דרך מסך הדיווחים.'
```

**L376**

```
success.title:         'חשבונך נמחק'
```

**L377**

```
success.subtitle:      'תודה שהיית חלק מקארמה.'
```

**L380**

```
## 4 — מיפוי דרישות (FR-SETTINGS-012)
```

**L382**

```
| AC | תיאור מקורי | מצב ב-V1 |
```

**L384**

```
| AC1 | אישור דו-שלבי + הקלדת שם תצוגה | **כמעט מלא.** חלון אזהרה אחד + הקלדת מילת אישור "מחק" (לא שם תצוגה — מילה קבועה, פשוטה יותר ל-RTL מובייל). מספק את כוונת הדרישה. |
```

**L385**

```
| AC2.a | מחיקה קשה של פוסטים | ✅ ממומש (§3.3.2 שלב 4) |
```

**L386**

```
| AC2.b | שימור צ׳אטים אצל הצד הנגדי | ✅ ממומש (§3.3.1 + §3.3.2 שלב 5) |
```

**L387**

```
| AC2.c | מחיקה רכה + אנונימיזציה של `User` | **שונה ל-V1.** מחיקה קשה של `public.users` + `auth.users`. שימור הצד הנגדי מושג דרך FK `set null`. |
```

**L388**

```
| AC2.d | `DeletedIdentifier` cooldown 30 ימים | ❌ נדחה ל-V1.1 |
```

**L389**

```
| AC2.e | מחיקת `FollowEdge`, `FollowRequest` | ✅ ממומש (§3.3.2 שלב 3) |
```

**L390**

```
| AC2.f | unregister push tokens | ✅ ממומש דרך מחיקת `devices` (§3.3.2 שלב 3) |
```

**L391**

```
| AC3 | פרגייה קשה אחרי 30 ימים | ❌ לא רלוונטי — V1 מבצע מחיקה קשה מיידית |
```

**L392**

```
| AC4 | אימייל אישור | ❌ נדחה ל-V1.1 |
```

**L393**

```
| AC5 | רישום audit | ✅ ממומש (§3.3.2 שלב 2 + 7) |
```

**L394**

```
| **חדש** | **חסימת מחיקה למשתמש מושעה** | ✅ ממומש (Q5, §3.3.2). FR-SETTINGS-012 לא מציין זאת מפורשות; ה-AC הזה תוסף כ-AC חדש בעדכון SRS. |
```

**L396**

```
**עדכון נדרש ל-SRS** (`docs/SSOT/SRS/02_functional_requirements/11_settings.md`):
```

**L398**

```
הוספת הערה תחת FR-SETTINGS-012:
```

**L400**

```
> **גרסת V1 (P1.x / P2.2 portion):** מיושם כמחיקה קשה מיידית עם שימור צ׳אטים בצד הנגדי (FK set null) + אישור דו-שלבי קטן (חלון + הקלדת "מחק") + חסימת משתמשים מושעים/חסומים. AC2.c (soft-delete), AC2.d (cooldown), AC3 (purge cron), AC4 (אימייל) — נדחים ל-V1.1.
```

**L402**

```
## 5 — מקרי קצה וטיפול בשגיאות
```

**L404**

```
**5.1 שגיאת רשת לפני הקריאה.** Modal state → `error_recoverable`; המשתמש נשאר מחובר; אין שינוי בדאטה.
```

**L406**

```
**5.2 RPC נכשל (`db_failed`).** הטרנזקציה נשברת, שום שורה לא נמחקה. Modal → `error_recoverable`; ניסיון חוזר יעבוד.
```

**L408**

```
**5.3 storage נכשל בחלקו או בשלמותו.** DB כבר נקי. הקבצים שלא נמחקו הופכים ל-orphan. **החלטה ל-V1:** מקבלים את הסיכון, מתעדים ל-log של ה-Edge Function. ב-V1.1 → cron של ניקוי orphans. **חשוב:** ה-bucket `post-images` הוא public-read ל-anon (`0002:314`), אז orphans = דליפת פרטיות. עד שה-cron של V1.1 קיים, יש לתעד את הסיכון כ-TD פעיל.
```

**L410**

```
**5.4 `auth.admin.deleteUser` נכשל.** DB ו-storage כבר נקיים, אבל `auth.users` שורד. סשן המשתמש עדיין תקף; אם הוא יסגור את האפליקציה ויתחבר מחדש, טריגר `handle_new_user` יזהה שאין `public.users` ויצור אותו — חשבון ריק עם אותו `auth.users.id`. כדי למנוע:
```

**L411**

```
- Modal state → `error_critical`, **לא-dismissible**, copy מחמיר (ראו §3.4.1).
```

**L412**

```
- אסור `signOut`, אסור ניווט. חובה להישאר במודאל.
```

**L413**

```
- כפתור יחיד "נסה שוב" → קריאה חוזרת ל-UseCase. ה-RPC עכשיו ירוץ ב-early-return path (אין יותר `public.users`), storage cleanup ירוץ ריק, `auth.admin.deleteUser` ינסה שוב.
```

**L414**

```
- אם הכישלון מתמיד אחרי 3-4 ניסיונות → באג אמיתי, צריך התערבות אדמין. בעל המוצר יראה את זה ב-audit_events (יש שורה ללא counts מאוחר). מקובל ל-V1.
```

**L416**

```
**5.5 משתמש מחובר במספר מכשירים.** מחיקת `auth.users` מבטלת את כל הסשנים בצד השרת. מכשירים אחרים יקבלו `401` בקריאה הבאה. אם interceptor של `401` קיים → ניווט אוטומטי למסך התחברות; אם לא → המשתמש יבחין בשגיאה הבאה. אימות בזמן יישום (§3.0).
```

**L418**

```
**5.6 משתמש מנסה למחוק את עצמו פעמיים בו-זמנית.** הקריאה השנייה: ה-RPC יחזיר early-return (אין `public.users`), Edge Function ימשיך ל-`auth.admin.deleteUser` שיחזיר שגיאה כי המשתמש כבר נמחק. טיפול: § 5.4 path. נדיר; לא יוצר corruption.
```

**L420**

```
**5.7 הרשמה מחדש עם אותו אימייל / גוגל.** אחרי מחיקה מוצלחת — `auth.users` ריק → אימייל / Google identity פנויים. הרשמה רגילה יוצרת `auth.users` חדש; הטריגר `handle_new_user` יוצר `public.users` חדש; משתמש חדש לחלוטין, ללא היסטוריה. **אימות חובה ב-§7.2** — בדיקת אינטגרציה תכלול re-signup מיד אחרי מחיקה.
```

**L422**

```
**5.8 שיחה שבה שני הצדדים נמחקו ברצף.** מטופל ב-§3.3.2 שלב 5 — `delete from chats` ל-orphans לפני ה-`update`. ה-CHECK constraint (`§3.3.1` שינוי 4) מבטיח שלא נשארות שורות שכאלה.
```

**L424**

```
**5.9 משתמש מושעה/חסום מנסה למחוק.** ה-RPC זורק `suspended` (errcode P0001); Edge Function ממפה ל-`403`; Repository זורק `DeleteAccountError('SUSPENDED')`; Modal state → `blocked_suspended` עם copy ייעודי. אין שום שינוי בדאטה.
```

**L426**

```
**5.10 שיחות שכבר `removed_at != null`** (שיחות שצד אחד "הסיר" עם soft-removal). הספק עדיין מטפל בהן דרך `is_chat_visible_to` (שורה 42 ב-update). בהליך המחיקה, ה-RPC לא מבדיל בין שיחות פעילות ל-`removed_at` — הוא פשוט עושה null/delete. השיחות הללו יישארו עם `removed_at` ועם participant ריק; ירואה רק אם רק לאחר ה-deletion יעלה צורך — בפועל לא יוצג לאף אחד, מקובל.
```

**L428**

```
## 6 — מחוץ להיקף (V1.1+)
```

**L430**

```
1. **`DeletedIdentifier` cooldown table** (FR-AUTH-016) — חסימת הרשמה חוזרת באותו אימייל / טלפון למשך 30 ימים.
```

**L431**

```
2. **אימייל אישור מחיקה** (FR-NOTIF-012) — תלוי בתשתית הדואר.
```

**L432**

```
3. **חלון התחרטות / שחזור (recovery window)** — soft-delete + purge cron.
```

**L433**

```
4. **Cron ניקוי קבצים מיותמים ב-storage** — מטפל ב-§5.3 (חשוב כי `post-images` הוא public).
```

**L434**

```
5. **מסך תמיכה** — להחליף את "פנה לבירור דרך מסך הדיווחים" כשתהיה תשתית.
```

**L435**

```
6. **Anchor לחוק הגנת הפרטיות / GDPR** — שורת copy במודאל ("בהתאם לחוק הגנת הפרטיות, יש לך זכות..."). לא חוסם V1, רואים בפידבק.
```

**L437**

```
## 7 — בדיקות
```

**L440**

```
- הצלחה: רפו מחזיר → use case לא זורק.
```

**L441**

```
- הרפו זורק `DeleteAccountError('NETWORK')` → use case מעביר את הזריקה.
```

**L442**

```
- כל קודי השגיאה: `UNAUTHENTICATED`, `SUSPENDED`, `AUTH_DELETE_FAILED`, `NETWORK`, `SERVER_ERROR`.
```

**L444**

```
**7.2 integration — Edge Function מול סופאבייס מקומי**
```

**L445**

```
- seed: משתמש active עם 2 פוסטים (כולל media), אווטר, 3 follows, 2 שיחות, 1 חסימה, 1 דיווח שהוא הגיש, 1 קישור תרומה, 1 מכשיר רשום.
```

**L446**

```
- קריאה ל-Edge Function עם JWT.
```

**L447**

```
- אימות תוצאה:
```

**L448**

```
  - שורת `users` נעלמה.
```

**L449**

```
  - פוסטים, `recipients`, `media_assets` נעלמו.
```

**L450**

```
  - `follow_edges`, `follow_requests`, `blocks`, `reports`, `donation_links`, `devices`, `auth_identities` נעלמו.
```

**L451**

```
  - `chats` עדיין קיימות עם `participant = null` בצד שלו.
```

**L452**

```
  - הודעות עדיין קיימות עם `sender_id = null`.
```

**L453**

```
  - שורת `audit_events` חדשה עם `action = 'delete_account'`, `metadata.actor_id_snapshot = <user_id>`, `metadata.posts_deleted = 2`.
```

**L454**

```
  - קבצים בbucket `post-images` נעלמו.
```

**L455**

```
  - אווטר בbucket `avatars` נעלם.
```

**L456**

```
  - `auth.users` נעלם.
```

**L457**

```
- **שלב המשך באותו טסט:** הרשמה מחדש דרך הזרימה האמיתית של הקליינט (`signUp` או OAuth flow), לא insert ישיר. אימות שנוצרים `auth.users` חדש ו-`public.users` חדש (טריגר `handle_new_user`), ושהמסך הראשי נטען בלי שגיאות.
```

**L460**

```
- seed: שיחה בין user_A ו-user_B, שניהם active.
```

**L461**

```
- מחיקה של user_A.
```

**L462**

```
- אימות מצד user_B (עם JWT שלו):
```

**L463**

```
  - `select from chats` מחזיר את השיחה.
```

**L464**

```
  - `select from messages` מחזיר את ההודעות.
```

**L465**

```
  - יכולת לשלוח הודעה חדשה? **לא צריכה לעבוד** (הצד השני NULL, אין צורך תרגיל; ייתכן ש-`messages_insert_user` יחסום או יאפשר — ההחלטה ביישום, אבל יש לתעד את ההתנהגות).
```

**L468**

```
- seed: שיחה בין user_A ו-user_B, user_B נמחק ראשון, אחר כך user_A נמחק.
```

**L469**

```
- אימות: השיחה נעלמה (לא נשארה כ-orphan עם שני NULLs).
```

**L472**

```
- קריאה ל-RPC `delete_account_data()` עם anon client (בלי JWT).
```

**L473**

```
- אימות: שגיאה `42501 unauthenticated`. שום שינוי ב-DB.
```

**L476**

```
- seed: משתמש עם `account_status = 'suspended_admin'`.
```

**L477**

```
- קריאה ל-Edge Function עם JWT שלו.
```

**L478**

```
- אימות: `403 { error: 'suspended' }`. שום שינוי ב-DB.
```

**L480**

```
**7.7 ידני — זרימת UI מלאה**
```

**L481**

```
- כניסה כמשתמש דמו → settings → "מחק חשבון" → מודאל נפתח.
```

**L482**

```
- אימות שדה ההקלדה: ריק → כפתור מנוטרל. הקלדת "מחק" אות-אות → ברגע ההתאמה הכפתור פעיל.
```

**L483**

```
- לחיצה על "ביטול" → מודאל נסגר, אין שינוי.
```

**L484**

```
- לחיצה על "מחק לצמיתות" → spinner → success overlay 1.5 שניות → מסך התחברות.
```

**L485**

```
- חזרה למסך התחברות, הרשמה עם אותו אימייל גוגל → חשבון חדש נוצר.
```

**L486**

```
- מצד החבר: מסך השיחה מציג "משתמש שנמחק" + אווטר ברירת מחדל; ההודעות הישנות נשמרו.
```

**L487**

```
- חזרה למשתמש הראשי → סימולציה של `auth_delete_failed` → אימות שהמודאל לא-dismissible, ה-copy המחמיר מוצג, ולחיצה על "נסה שוב" מסיימת בהצלחה.
```

**L489**

```
## 8 — חוב טכני, פריטים פתוחים, ועדכוני SSOT
```

**L491**

```
**8.1 עדכוני SSOT חובה ב-PR:**
```

**L493**

```
- **`docs/SSOT/PROJECT_STATUS.md`** (`.cursor/rules/project-status-tracking.mdc` מחייב):
```

**L494**

```
  - הוספת רשומה ב-§3 Sprint Board:
```

**L495**

```
    - ID: `P1.x — Delete Account V1` (מיקום ה-x יוחלט בזמן הקצאה)
```

**L496**

```
    - Owner: `agent יחיד`
```

**L497**

```
    - FR refs: FR-SETTINGS-012 (חלקי)
```

**L498**

```
    - Status: `🟡 In progress` בתחילה
```

**L499**

```
- **`docs/SSOT/SRS/02_functional_requirements/11_settings.md`** — הוספת הערת V1 ל-FR-SETTINGS-012 (ראו §4 לעיל).
```

**L500**

```
- **`docs/SSOT/TECH_DEBT.md`** — הוספת רשומה חדשה לחוב פעיל:
```

**L501**

```
  - `TD-50..99` (BE) — "Delete Account: orphan storage cleanup (FR-AUTH-016, FR-NOTIF-012, soft-delete window). חובה עד V1.1 כי `post-images` bucket הוא public ול-orphans → דליפת פרטיות."
```

**L503**

```
**8.2 פריטים לאימות בתחילת ה-Plan (לא תלויים בכתיבת קוד):**
```

**L505**

```
1. טריגר `handle_new_user` קיים ופעיל על `auth.users` INSERT.
```

**L506**

```
2. אין consumer של `audit_events.action` שמבצע exhaustive switch ויישבר מהערך החדש.
```

**L507**

```
3. Interceptor של `401` בקליינט סופאבייס — קיים? אם לא, מתועד כ-TD נפרד או מתווסף בזרימה זו.
```

**L508**

```
4. כל ה-RLS policies על `chats` ו-`messages` שמשתמשות ב-`participant_a/b` או ב-`is_chat_visible_to` ממופות במלואן (grep מקיף).
```

**L509**

```
5. שמות ה-buckets בסטוראג׳ (`post-images`, `avatars`, ועוד אם רלוונטי) מאומתים מול ה-config / ה-migrations.
```

**L511**

```
**8.3 פריטים פתוחים שעלולים להפוך ל-TD:**
```

**L513**

```
- אם מתגלה ש-RLS המעודכן לא מטפל נכון ב-`participant = null` באף אחת מהמדיניות (למשל בשל זרימה שלא ראינו) — פתיחת TD חדש (BE).
```

**L514**

```
- אם הצד הנותר בשיחה לא מקבל את ה-realtime UPDATE כשהצד השני הופך NULL — פתיחת TD (FE/BE).
```

**L518**

```
**סטטוס סופי:** המפרט עבר revision לפי 4 דוחות של ה-council (אבטחה, DB/RLS, UX, ארכיטקטורה). כל הממצאים הקריטיים טופלו. ההחלטות הפרודקטיביות אושרו על ידי בעל המוצר (Q1: חסימת מושעים. Q2: copy חדש. Q3: error_critical lock. Q4: success overlay. Q5: typing confirmation).
```

---

## `docs/superpowers/specs/2026-05-11-ssot-cleanup-design.md`

**L13**

```
## 1. הבעיה
```

**L15**

```
קבצי מקור-אמת בפרויקט עברו רה-ארגון בעבר. כתוצאה:
```

**L17**

```
- ארבעה קבצי `.md` מצוטטים כ"קבצי הכניסה" לסוכנים, אבל **אינם קיימים** בעץ הפעיל:
```

**L18**

```
  - `docs/SSOT/PROJECT_STATUS.md` (תוכן כבר עבר ל-`BACKLOG.md`)
```

**L19**

```
  - `docs/SSOT/HISTORY.md` (מעולם לא נוצר)
```

**L20**

```
  - `docs/SSOT/CODE_QUALITY.md` (מעולם לא נוצר; פתוח כ-TD-4 כבר חודשיים)
```

**L21**

```
  - `docs/SSOT/SRS.md` (קיים רק ב-`archive/SRS.md`)
```

**L22**

```
- 17 הפניות לקבצים האלה מפוזרות ב-13 קבצים פעילים — סוכנים מקבלים הוראות לעדכן קובץ שלא קיים.
```

**L23**

```
- ארבעה קבצי-כניסה (`CLAUDE.md` + 3 קבצים ב-`.cursor/rules/`) חופפים זה לזה: ה-verification gate מופיע פעמיים, מבנה ה-SSOT מופיע פעמיים, כללי גיט מפוזרים בין שניים. סוכן חדש לא יודע איזה קובץ סמכותי.
```

**L24**

```
- אין מנגנון שמונע הוספת הפניה מתה חדשה ב-PR עתידי.
```

**L26**

```
## 2. מטרה
```

**L28**

```
1. **מקור אמת אחד.** `CLAUDE.md` יהיה הקובץ היחיד שמרכז את כל הכללים המחייבים (ארכיטקטורה, ספק-גייט, סטטוס-עדכון, גיט-וורקפלו).
```

**L29**

```
2. **כל ההפניות בקבצים הפעילים מצביעות על קבצים שקיימים.** אחרי הניקוי, `git grep` של שמות-קבצים-מתים בקבצים פעילים מחזיר 0 תוצאות.
```

**L30**

```
3. **אכיפה ב-CI.** סקריפט שנקרא מ-`pnpm lint:arch` בודק את אותה הפניה ונכשל אם נמצאות שאריות — מונע regression עתידי.
```

**L31**

```
4. **מפת ריפו גלויה.** סוכן חדש שקורא את `CLAUDE.md` רואה טבלה אחת עם כל התיקיות והקבצים הפעילים — ולא ממציא "PROJECT_STATUS.md" חדש כי הוא לא מוצא איפה לתעד דבר.
```

**L33**

```
## 3. תכולה (in scope)
```

**L35**

```
- 13 קבצים פעילים מתעדכנים (ראו §6).
```

**L36**

```
- 3 תכניות-עבודה היסטוריות תחת `docs/superpowers/plans/` ו-`specs/` מקבלות header של `> ⚠️ Frozen historical plan` (ללא שינוי תוכן).
```

**L37**

```
- קובץ חדש `AGENTS.md` ב-root — pointer של 3 שורות ל-`CLAUDE.md`, לכלי-סוכן (Codex, Copilot CLI) שמחפשים את הקונבנציה הזו.
```

**L38**

```
- סקריפט חדש `app/scripts/check-ssot-links.mjs` שנקרא מ-`pnpm lint:arch`.
```

**L39**

```
- סגירת TD-4 ו-TD-43 ב-`TECH_DEBT.md` (התוכן שלהם נפתר ע"י הניקוי הזה).
```

**L41**

```
## 4. מחוץ לתכולה (out of scope)
```

**L43**

```
- `docs/SSOT/archive/` — לא נוגעים. הוא ארכיון מוצהר; הפניות פנימיות שם אינן מהוות מקור-אמת פעיל.
```

**L44**

```
- `docs/SSOT/BACKLOG.md` — כבר נקי. לא נוגעים.
```

**L45**

```
- שאר 11 קבצי `docs/SSOT/spec/*.md` (מלבד 01, 02, 12) — אין בהם הפניות מתות.
```

**L46**

```
- `docs/SSOT/OPERATOR_RUNBOOK.md` — רק שורת ה-header משתנה. שאר הקובץ נשאר כמו שהוא.
```

**L47**

```
- שינוי משמעות של AC כלשהו ב-spec files. רק טקסט תיאורי לצד הפניה מתה משתנה.
```

**L49**

```
## 5. גישה (Y — קונסולידציה מאוזנת)
```

**L51**

```
מתוך 3 גישות שנשקלו (X = שמירה זהירה, Y = קונסולידציה מאוזנת, Z = שכתוב מלא), נבחרה **Y**:
```

**L53**

```
- מאמצת את ה-content של 3 קבצי `.cursor/rules/*` אל תוך `CLAUDE.md`, מאחדת סקציות שחוזרות על עצמן.
```

**L54**

```
- זורקת תכנים מתים: סקצית "Draft/POC mode" שלא בשימוש, הפניות ל-`CODE_QUALITY.md` שלא קיים, "two sources of truth" שכבר לא נכון.
```

**L55**

```
- תוצאה: `CLAUDE.md` של ~200 שורות (מ-~70 כיום), 12 סקציות עם hierarchy ברור.
```

**L57**

```
X נדחתה כי משמרת את הכפילות שהיא ה-root cause. Z נדחתה כי הסיכון של "החמצנו כלל קיים" גבוה בלי תועלת משמעותית מעבר ל-Y.
```

**L59**

```
## 6. מצאי השינויים (17 הפניות מתות)
```

**L61**

```
### 6.1 קבצי כללים (`.cursor/rules/`)
```

**L63**

```
| # | קובץ | מה משתנה |
```

**L65**

```
| 1 | `.cursor/rules/srs-architecture.mdc` | מצטמצם ל-pointer-stub של 5 שורות. תוכן הארכיטקטורה (גבולות שכבות, file caps, error handling, propose-and-proceed) עובר ל-`CLAUDE.md` §5. |
```

**L66**

```
| 2 | `.cursor/rules/git-workflow.mdc` | מצטמצם ל-pointer-stub. תוכן הגיט-וורקפלו עובר ל-`CLAUDE.md` §6 + §7. |
```

**L67**

```
| 3 | `.cursor/rules/project-status-tracking.mdc` | מצטמצם ל-pointer-stub. ה-SSOT-update-workflow עובר ל-`CLAUDE.md` §4. |
```

**L69**

```
מבנה ה-pointer-stub האחיד:
```

**L84**

```
ה-stubs נשמרים (ולא נמחקים לגמרי) כי Cursor טוען אותם אוטומטית עם `alwaysApply: true`; pointer הוא הדרך הנקיה לוודא ש-Cursor יקרא את CLAUDE.md בכל סשן.
```

**L86**

```
### 6.2 קובץ חדש — `AGENTS.md` ב-root
```

**L98**

```
| # | קובץ | מה משתנה |
```

**L100**

```
| 4 | `.github/PULL_REQUEST_TEMPLATE.md` | סקציה "PROJECT_STATUS.md updated" מוחלפת בסקצית "SSOT updated" עם 3 checkbox: `[ ] BACKLOG.md status flipped`, `[ ] spec/{domain}.md status updated (if all ACs done)`, `[ ] TECH_DEBT.md — closed resolved TDs / added new ones`. ההפניה ל-`docs/SSOT/SRS/02_functional_requirements/<file>.md` בשורה 11 מוחלפת ב-`docs/SSOT/spec/<file>.md`. |
```

**L102**

```
### 6.4 קבצי SSOT פעילים
```

**L104**

```
| # | קובץ | מה משתנה |
```

**L108**

```
| 7 | `docs/SSOT/TECH_DEBT.md:92` (TD-4) | מועבר לסקצית Resolved: "Closed 2026-05-11 — content folded into `CLAUDE.md`; `CODE_QUALITY.md` will not be authored as a separate file." |
```

**L109**

```
| 8 | `docs/SSOT/TECH_DEBT.md:98` (TD-43) | מועבר ל-Resolved: "Closed 2026-05-11 — `SRS.md` no longer active; spec is canonical in `docs/SSOT/spec/*.md` with per-file status headers." |
```

**L112**

```
| 11 | `docs/SSOT/DECISIONS.md:31,33,64,73,75` (D-1 + D-3 internal refs to `CODE_QUALITY.md`) | תוסף הערה אחת בראש D-1 ואחת בראש D-3 (סה"כ 2 הערות, לא לכל ההחלטות): *"Note (2026-05-11): `CODE_QUALITY.md` was never authored; its content lives in `CLAUDE.md` §5–§8."* ההפניות בגוף נשמרות לתיעוד היסטורי. |
```

**L113**

```
| 12 | `docs/SSOT/DECISIONS.md:352` (EXEC-9) | "P1.4 ... נמחק מ-`PROJECT_STATUS.md §2`" → "P1.4 ... נמחק מ-`BACKLOG.md`". |
```

**L115**

```
| 14 | `docs/SSOT/spec/01_auth_and_onboarding.md:89` | "until the `Profile` table exists (`PROJECT_STATUS.md` P0.2)" → "until `FR-PROFILE-007` ships (see `spec/02_profile_and_privacy.md`)". המשך המשפט נשאר כמו שהוא. |
```

**L119**

```
### 6.5 תכניות-עבודה היסטוריות
```

**L121**

```
| # | קובץ | מה משתנה |
```

**L123**

```
| 17 | `docs/superpowers/specs/2026-05-11-delete-account-design.md`<br>`docs/superpowers/plans/2026-05-11-delete-account.md`<br>`docs/superpowers/plans/2026-05-11-edit-post.md` | תוסף שורה אחת בראש כל אחד: `> ⚠️ Frozen historical plan — written under the pre-2026-05-11 SSOT scheme. Any reference to `PROJECT_STATUS.md` / `HISTORY.md` in the body below is obsolete; see [CLAUDE.md](../../../CLAUDE.md) for the current convention.` ההפניות בגוף אינן משתנות (זה תיעוד היסטורי של תכניות שכבר בוצעו). |
```

**L125**

```
## 7. מבנה ה-`CLAUDE.md` החדש
```

**L127**

```
12 סקציות, ~200 שורות:
```

**L129**

```
| # | כותרת | תוכן עיקרי | מקור |
```

**L131**

```
| 1 | Bootstrap — Required reading | רשימת 4 קבצי SSOT שחובה לקרוא | קיים |
```

**L132**

```
| 2 | Spec Validation Gate | זרימת ה"בקשה סותרת אפיון?" עם פלט בעברית | קיים |
```

**L133**

```
| 3 | Verification gate | "Mapped to spec: [FR-ID]. Refactor logged: [Yes/No/NA]" — סקציה אחת | קיים פעמיים — מאחד |
```

**L134**

```
| 4 | SSOT update workflow | "Before / While working / Before done" — מתי מעדכנים מה, ומה לא דורש עדכון | `project-status-tracking.mdc` |
```

**L135**

```
| 5 | Clean Architecture invariants | גבולות שכבות, file-size cap (≤200 LOC), error handling, propose-and-proceed | `srs-architecture.mdc` |
```

**L138**

```
| 8 | Documentation language | עברית ל-UI/PM-flow, אנגלית לקוד ולקומיטים — בלי הזכרת `CODE_QUALITY.md` | `srs-architecture.mdc` |
```

**L139**

```
| 9 | Parallel-agents protocol | BE/FE lanes, branch naming convention, shared-contract scope | קיים |
```

**L140**

```
| 10 | How to pick the next task | BACKLOG → ⏳ → 🟡 → ✅ | קיים |
```

**L141**

```
| 11 | Tech stack & commands | monorepo, pnpm, expo, supabase, מצומצם | קיים |
```

**L142**

```
| 12 | Repo structure map | טבלה: איזה קובץ אחראי על מה | חדש — קריטי למניעת regression |
```

**L144**

```
### §12 — Repo structure map (תוכן מלא)
```

**L165**

```
## 8. מנגנון אימות
```

**L167**

```
### 8.1 שכבה 1 — verification grep (בסוף ה-PR)
```

**L174**

```
קריטריון מעבר: **0 שורות תוצאה**.
```

**L176**

```
### 8.2 שכבה 2 — CI script (קבוע)
```

**L178**

```
קובץ חדש: `app/scripts/check-ssot-links.mjs`
```

**L220**

```
ה-script יקרא מתוך `app/scripts/check-architecture.mjs` הקיים (או יוסף כשורה נפרדת ב-`pnpm lint:arch`). הקריאה הזו כבר רצה ב-CI דרך `pnpm lint`.
```

**L222**

```
## 9. תוכנית PR
```

**L224**

```
PR יחיד אטומי. שם מוצע:
```

**L227**

```
סדר הקומיטים בתוך ה-PR (אופציונלי, ייתכן commit יחיד):
```

**L229**

```
1. `docs(claude): rewrite CLAUDE.md as the single rules hub` — הקובץ החדש של 200 שורות.
```

**L230**

```
2. `docs(cursor): shrink .cursor/rules/* to pointer stubs` — 3 קבצים.
```

**L231**

```
3. `docs(agents): add AGENTS.md root pointer` — קובץ חדש.
```

**L234**

```
6. `docs(superpowers): mark historical plans as frozen` — 3 קבצים, header בלבד.
```

**L235**

```
7. `chore(scripts): add check-ssot-links.mjs to lint:arch` — הסקריפט החדש.
```

**L236**

```
8. `docs(td): close TD-4 + TD-43` — עדכון TECH_DEBT.
```

**L238**

```
או commit יחיד אם ה-PM מעדיף — לא עקרוני.
```

**L240**

```
## 10. קריטריוני הצלחה
```

**L242**

```
- [ ] `git grep` של 6 ה-patterns על קבצים פעילים מחזיר 0 שורות.
```

**L243**

```
- [ ] `pnpm lint:arch` כולל את הבדיקה החדשה ועובר ירוק.
```

**L244**

```
- [ ] קריאת `CLAUDE.md` לבדה מספיקה לסוכן חדש כדי לדעת:
```

**L245**

```
  - איפה קוראים ספק
```

**L246**

```
  - מתי מעדכנים BACKLOG / spec / TECH_DEBT
```

**L247**

```
  - מה הם גבולות הארכיטקטורה
```

**L248**

```
  - איך פותחים PR
```

**L249**

```
  - איפה כל סוג של תיעוד גר
```

**L250**

```
- [ ] `.cursor/rules/*` עדיין נטענים ע"י Cursor (alwaysApply: true) ומפנים מיד ל-CLAUDE.md.
```

**L251**

```
- [ ] `AGENTS.md` קיים ומפנה ל-CLAUDE.md.
```

**L252**

```
- [ ] PR template לא מזכיר את `PROJECT_STATUS.md`.
```

**L253**

```
- [ ] DECISIONS.md שומר על ההיסטוריה של D-1/D-3 (לא מוחק) אבל מוסיף הערת-קישור אחת.
```

**L254**

```
- [ ] התכניות ההיסטוריות תחת `docs/superpowers/` מסומנות כ-frozen אבל לא נמחקות.
```

**L256**

```
## 11. סיכונים
```

**L258**

```
| סיכון | מה הוא | הפחתה |
```

**L260**

```
| איבוד כלל בעת הקונסולידציה | בעת העברת תוכן מ-`.cursor/rules/*` ל-`CLAUDE.md` עלולים להחמיץ הוראה | מעבר checklist על כל סקציה ב-3 קבצי המקור; pointer stubs נשארים זמינים ב-PR review |
```

**L261**

```
| Cursor מפסיק לכפות את הכללים | אם ה-stub שגוי, Cursor לא יטען אותם | ה-stubs נשמרים עם `alwaysApply: true` ומפנים בגלוי לקובץ; פורמט תואם לדוגמת הקובץ הקיים |
```

**L262**

```
| Script שגוי שכושל ב-CI שלא לצורך | regex רחב מדי תופס שמות תקפים | רשימת ה-patterns מצומצמת ל-6 מחרוזות ספציפיות; טסט ידני לפני ההוספה ל-lint |
```

**L263**

```
| מישהו ירצה לחזור לקבצים הישנים | "אבל היה לי PROJECT_STATUS.md..." | התיעוד ההיסטורי נשמר תחת `docs/SSOT/archive/` ו-`docs/superpowers/`; שום מידע לא נמחק |
```

**L265**

```
## 12. שאלות פתוחות
```

**L267**

```
אין. כל ההחלטות סוכמו עם ה-PM בתהליך ה-brainstorming.
```

---

## `docs/superpowers/specs/2026-05-12-moderation-admin-actions-design.md`

**L262**

```
- Restore: "פעולה זו תסמן את 3 הדיווחים על המטרה כשגויים, מה שעלול לגרור סנקציה לרֶפּוֹרְטֵרים. להמשיך?"
```

**L263**

```
- Dismiss single: "סמן דיווח זה כשגוי. אין השפעה על דיווחים אחרים. להמשיך?"
```

**L264**

```
- Confirm: "אשר את ההסרה האוטומטית כהפרה ודאית. להמשיך?"
```

**L265**

```
- Ban: "פעולה זו לצמיתות ואינה ניתנת לביטול. להמשיך?"
```

**L278**

```
1. **Linked-post deletion** — when a system bubble references a post (`payload.target_type === 'post'`), `AutoRemovedBubble` includes a `🗑 הסר פוסט` button → existing `admin_remove_post` RPC.
```

**L279**

```
2. **Chat-message hard-delete** — admin viewing any chat sees a `🗑 מחק כאדמין` overflow item on user-kind message bubbles (not system bubbles). Confirmation → `DeleteMessageUseCase` → row hard-deleted.
```

**L306**

```
| `banned` | "החשבון נחסם לצמיתות" | "החשבון שלך נחסם בעקבות הפרת מדיניות הקהילה." | `mailto:karmacommunity2.0@gmail.com` ("יצירת קשר") |
```

**L307**

```
| `suspended_admin` | "החשבון הושעה" | "המוֹדֶרציָה השעתה את החשבון שלך עד לבירור." | `mailto:karmacommunity2.0@gmail.com` ("ערעור") |
```

**L308**

```
| `suspended_for_false_reports` | "החשבון מושעה זמנית" | "החשבון שלך מושעה עד {until_local} עקב 5 דיווחים שגויים ב-30 הימים האחרונים." | `mailto:karmacommunity2.0@gmail.com` ("ערעור מוקדם") |
```

**L360**

```
- Click `↩ שחזר` → confirmation modal → post returns to feed; bubble dims to `mod_action_taken`.
```

**L362**

```
- Open Settings as super admin → "אאודיט" item visible; search a user → list renders.
```

---

## `docs/superpowers/specs/2026-05-12-report-target-deeplink-design.md`

**L170**

```
┌─ דיווח התקבל / הוסר אוטומטית ──────────┐
```

**L171**

```
│ סיבה: Spam   (report_received only)    │
```

**L173**

```
│ ┌─ ‎@author_handle (פוסט) ─────────┐   │
```

**L174**

```
│ │ "תחילת תוכן הפוסט..."             │   │
```

**L175**

```
│ │ 📷 כולל תמונה                    │   │   ← only if has_image
```

**L176**

```
│ │ ‹ פתח                            │   │   ← chevron-back (RTL-correct)
```

**L179**

```
│ צילום מצב מרגע הדיווח                  │   ← evidence label
```

**L181**

```
│ הערת מדווח: "..."                       │   ← only if reporter note
```

**L183**

```
│ [פטור]   [אשר הפרה]   /   [↩ שחזר]    │
```

**L189**

```
┌─ דיווח התקבל / הוסר אוטומטית ──────────┐
```

**L190**

```
│ סיבה: Offensive                        │
```

**L192**

```
│ ┌─ ‎@handle (פרופיל) ──────────────┐    │
```

**L194**

```
│ │ "ביו..."                           │    │
```

**L195**

```
│ │ ‹ פתח                             │    │
```

**L198**

```
│ צילום מצב מרגע הדיווח                  │
```

**L200**

```
│ [פטור]   [אשר הפרה]                    │
```

**L204**

```
**Chat (mapped to user):** identical to user layout, plus a small label above the reason — *"דיווח על שיחה — מוצג הצד השני"* (same color/size as the evidence label).
```

**L241**

```
- Preview card Pressable: `accessibilityRole="button"`, `accessibilityLabel={`פתח ${kind === 'post' ? 'פוסט' : 'פרופיל'} מאת ${handle}`}`.
```

**L252**

```
| E5 | Image-only post (title+description empty). | `body_snippet=null`, `has_image=true` → only "📷 כולל תמונה" line. (Note: posts.title is `not null check (char_length(title) between 1 and 80)`, so title is always present — body_snippet should rarely be null in practice.) |
```

**L255**

```
| E8 | Reporter's `note` field. | Stays in body (passed via `inject_system_message`'s `p_body`). Rendered as separate line under the preview card with "הערת מדווח:" label. NOT duplicated into payload. |
```

**L276**

```
| Snapshot diverges from live target after edits (FR-POST-008) | "צילום מצב מרגע הדיווח" label — preview is moderation evidence, not live mirror. | (Permanent — by design.) |
```

**L322**

```
| i18n | `app/apps/mobile/src/i18n/partials/moderationHe.ts` | New strings: "פתח", "כולל תמונה", "הערת מדווח:", "צילום מצב מרגע הדיווח", "דיווח על שיחה — מוצג הצד השני". |
```

---

## `docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md`

**L34**

```
| `publisher` | 📤 נתתי | 📥 קיבלתי |
```

**L35**

```
| `respondent` | 📥 קיבלתי | 📤 נתתי |
```

**L52**

```
| "פוסטים סגורים" tab (own view) | ✅ shown | ✅ shown — **but** only posts they published; posts they're a respondent on are absent |
```

**L53**

```
| "פוסטים סגורים" tab (third-party view) | ✅ shown publicly, with respondent identity | ❌ no respondent-side posts shown at all |
```

**L60**

```
A closed-delivered post appears in the "פוסטים סגורים" tab of **both** the publisher and the respondent. The economic role label (📤 נתתי / 📥 קיבלתי) is derived per profile owner from `(post.type, identity-role-on-profile)`. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — unchanged. No new visibility option, no automatic visibility upgrade on close.
```

**L119**

```
`FR-PROFILE-001` and `FR-PROFILE-002` already render a "פוסטים סגורים" tab. The card list is fed by the new RPC. Each card shows a small **economic role** badge next to the title, computed per the mapping above:
```

**L121**

```
- 🎁 **נתתי** — when the profile owner is the giver.
```

**L122**

```
- 🎀 **קיבלתי** — when the profile owner is the receiver.
```

**L163**

```
> Closed Posts tab lists posts where the profile user is **either the publisher or the respondent**, status `closed_delivered`, ordered by `closed_at` desc. Each card shows an economic-role badge derived from `(post.type, identity-role)`: 📤 נתתי when the profile owner is the giver, 📥 קיבלתי when the profile owner is the receiver.
```

**L169**

```
> A user picked as the respondent of a `closed_delivered` post sees that post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the respondent's profile, subject to the post's original `visibility` setting (Public / Followers-only / Only-me). The "Remove my recipient mark" CTA remains exclusive to the respondent themselves.
```

**L172**

```
> When a third party opens the post via the respondent's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). Banner reflects the transaction: *"X מסר ל-Y בתאריך D"* for `Give` posts, *"X קיבל מ-Y בתאריך D"* for `Request` posts.
```

**L183**

```
> **D-19 (2026-05-13)** — Closed-delivered posts surface on both the publisher's and the respondent's profile, subject to the post's original `visibility`. The economic-role badge (📤 נתתי / 📥 קיבלתי) is derived from `(post.type, identity-role)`. Reverses the respondent-privacy carve-out previously stated in D-7 / FR-POST-017 AC1. Rationale: a public karma trail is more important than the implicit privacy of being a respondent on a public post; users who want privacy can publish posts as Followers-only or Only-me, and the closed visibility inherits accordingly.
```

---

## `docs/superpowers/specs/2026-05-13-mvp-email-verification-gate-design.md`

**L11**

```
1. **`pending_verification` is a write-once dead end.** `public.handle_new_user` (migration `0008_seed_all_cities.sql:1384`) sets `account_status = 'pending_verification'` for any auth user whose `email_confirmed_at` is null at INSERT time. There is no trigger on `auth.users UPDATE`, so when a user later confirms their email (Google OAuth often takes a beat; email/password users click the link minutes later), `public.users.account_status` stays at `pending_verification` forever. The `users_select_public` policy in `0001_init_users.sql:244` requires `account_status = 'active'`, so these users disappear from post owner joins — `mapPostRow.ts` falls back to "משתמש שנמחק".
```

**L36**

```
│  │   "בדוק את האימייל שלך"                          │                │
```

**L193**

```
בדוק את האימייל שלך               ← h1 (typography.h1)
```

**L194**

```
שלחנו לינק לאימות אל {email}     ← body, email bolded
```

**L196**

```
[ פתח אימייל ]                    ← primary button (colors.primary)
```

**L197**

```
[ שלח שוב (60) ]                  ← secondary button, countdown when locked
```

**L198**

```
[ שנה אימייל ]                    ← text link, returns to form (clears verifying state)
```

---

## `docs/superpowers/specs/2026-05-13-push-notifications-design.md`

**L17**

```
4. Implement Settings → התראות screen for the two-toggle preference UI (`FR-SETTINGS-005`).
```

**L417**

```
1. **התראות** — two `NotificationToggleRow`s (קריטיות / חברתיות) with captions explaining what each category includes.
```

**L418**

```
2. **סטטוס המכשיר** — read-only: permission status, token-registered status, "פתח הגדרות" button via `Linking.openSettings()` when denied.
```

**L424**

```
**Entry point:** the existing "התראות" row in `app/settings.tsx` (currently a no-op per `TD-107`) gets wired to `router.push('/settings/notifications')`.
```

**L513**

```
  - Settings → התראות screen.
```

---

## `PRD_V2_NOT_FOR_MVP/00_Index.md`

**L3**

```
# 📘 מסמך דרישות מוצר וזרימת משתמש (PRD) - Karma Community
```

**L5**

```
**גרסה:** 2.0
```

**L6**

```
**תאריך עדכון אחרון:** מאי 2026
```

**L7**

```
**בעלים:** מנהל מוצר
```

**L8**

```
**סטטוס:** SSOT ראשי
```

**L10**

```
מסמך זה מאגד באופן מאורגן ומקיף את **כלל** דרישות המוצר, הפיצ'רים, זרימות המשתמש (User Flows) ומיפוי המסכים של פלטפורמת **Karma Community**. המסמך מהווה את ה-**"אמת הארגונית היחידה" (Single Source of Truth)** ונכתב מנקודת מבטו של מנהל מוצר – ללא התייחסות טכנית, תוך דגש על חוויית משתמש, לוגיקה עסקית וזרימות פונקציונליות.
```

**L14**

```
## תוכן עניינים (אינדקס)
```

**L16**

```
1. [1. חזון, ייעוד ומטרות עסקיות](./01_Vision_Goals.md)
```

**L17**

```
2. [2. קהלי יעד, תפקידים והרשאות](./02_Personas_Roles.md)
```

**L18**

```
3. [3. פיצ'רים ותהליכי ליבה](./03_Core_Features.md)
```

**L19**

```
4. [4. זרימות משתמש (User Flows)](./04_User_Flows.md)
```

**L20**

```
5. [5. מיפוי מסכים ותצוגות מקיף](./05_Screen_UI_Mapping.md)
```

**L21**

```
6. [6. ניווט ומבנה האפליקציה](./06_Navigation_Structure.md)
```

**L22**

```
7. [7. כללים עסקיים מרכזיים](./07_Business_Rules.md)
```

**L24**

```
### 🌍 תת-ספר: עולמות תרומה (Donation Worlds)
```

**L26**

```
ה-DNA של הפלטפורמה הוא חלוקת כל סוגי הנתינה והבקשות ל**עולמות**. כל עולם מתועד במסמך עומק ייעודי ב-[`./donation_worlds/`](./donation_worlds/00_Index.md).
```

**L28**

```
* [📖 אינדקס עולמות התרומה](./donation_worlds/00_Index.md)
```

**L29**

```
* [💰 עולם הכסף](./donation_worlds/01_Money.md)
```

**L30**

```
* [📦 עולם החפצים](./donation_worlds/02_Items.md)
```

**L31**

```
* [🍎 עולם המזון](./donation_worlds/03_Food.md)
```

**L32**

```
* [⚕️ עולם הרפואה](./donation_worlds/04_Medical.md)
```

**L33**

```
* [🏠 עולם הדיור / האירוח](./donation_worlds/05_Housing.md)
```

**L34**

```
* [🚗 עולם הנסיעות שיתופיות](./donation_worlds/06_Rides.md)
```

**L35**

```
* [📚 עולם הידע](./donation_worlds/07_Knowledge.md)
```

**L36**

```
* [🕒 עולם הזמן והתנדבות](./donation_worlds/08_Time.md)
```

**L37**

```
* [🐾 עולם בעלי החיים](./donation_worlds/09_Animals.md)
```

**L38**

```
* [🌱 עולם הסביבה](./donation_worlds/10_Environment.md)
```

**L39**

```
* [🎨 עולם היצירה](./donation_worlds/11_Creative.md)
```

**L40**

```
* [💞 עולם השידוכים הרומנטיים](./donation_worlds/12_Matchmaking_Romantic.md)
```

**L41**

```
* [🎨 עולם עיצוב האפליקציה](./donation_worlds/13_App_Design.md)
```

**L44**

```
*מעבר לפרק הראשון: [1. חזון, ייעוד ומטרות עסקיות](./01_Vision_Goals.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/01_Vision_Goals.md`

**L3**

```
## 🎯 1. חזון, ייעוד ומטרות עסקיות
```

**L5**

```
### 1.1 חזון המוצר
```

**L6**

```
**Karma Community** היא פלטפורמה חברתית-קהילתית חדשנית שנועדה **לרכז, לעודד ולהעצים** את כל ממדי הנתינה והעשייה הקהילתית במקום אחד. הפלטפורמה שואפת להפוך כל מעשה טוב – קטן כגדול – לנגיש, מתועד, מדיד ומעורר השראה.
```

**L8**

```
### 1.2 ייעוד
```

**L9**

```
* לחבר בין **אנשים שרוצים לתת** לבין **אנשים שצריכים לקבל** – בצורה יעילה, מכבדת ובטוחה.
```

**L10**

```
* לספק **תשתית ניהולית מקיפה** לעמותות וארגונים ללא מטרות רווח.
```

**L11**

```
* לייצר **תרבות קהילתית חיובית** המעודדת מעורבות אזרחית מתמשכת.
```

**L13**

```
### 1.3 מטרות עסקיות מרכזיות
```

**L14**

```
| #   | מטרה                           | מדד הצלחה (KPI)                      |
```

**L16**

```
| 1   | הגדלת בסיס המשתמשים הפעילים    | MAU (משתמשים פעילים חודשיים)         |
```

**L17**

```
| 2   | העמקת מעורבות המשתמש           | זמן שהייה ממוצע, פעולות לביקור       |
```

**L18**

```
| 3   | גיוס עמותות וארגונים לפלטפורמה | כמות ארגונים פעילים                  |
```

**L19**

```
| 4   | הגדלת נפח התרומות וההתנדבויות  | כמות תרומות/התנדבויות חודשיות        |
```

**L20**

```
| 5   | שמירה על אמון ופרטיות          | שיעור משתמשים מאומתים, דיווחי ביטחון |
```

**L21**

```
| 6   | שביעות רצון משתמשים            | NPS, דירוג חנויות אפליקציות          |
```

**L23**

```
### 1.4 ערכי ליבה של המוצר
```

**L24**

```
* **שקיפות** – כל פעולה בקהילה ניתנת למעקב ולמדידה.
```

**L25**

```
* **אחדות** – כלל הקהילה פועלת תחת מטרות וערכים משותפים.
```

**L26**

```
* **אמינות** – הפלטפורמה מהווה מקור אמין ומהימן למידע ולפעילויות קהילתיות.
```

**L27**

```
* **פרטיות** – מנגנוני אנונימיות מובנים לבקשות רגישות.
```

**L28**

```
* **נגישות** – ממשק פשוט, אינטואיטיבי ורב-שפתי.
```

**L29**

```
* **הוגנות** – אין מטרות רווח; אין ניצול של מבקשי/נותני עזרה.
```

**L30**

```
* **הכלה** – הפלטפורמה פתוחה לכל אדם, ללא קשר לרקע חברתי-כלכלי.
```

**L33**

```
*הפרק הבא: [2. קהלי יעד, תפקידים והרשאות](./02_Personas_Roles.md)*
```

**L34**

```
*חזרה ל[אינדקס ראשי](./00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/02_Personas_Roles.md`

**L3**

```
## 👥 2. קהלי יעד, תפקידים והרשאות (Personas & Roles)
```

**L5**

```
### 2.1 היררכיית התפקידים
```

**L6**

```
המערכת בנויה על מודל הרשאות היררכי ורקורסיבי. כל תפקיד כולל את כל ההרשאות של התפקידים שמתחתיו, בתוספת הרשאות ייחודיות. תחת סוגי מנהלים מסוימים ניתן להגדיר מנהלים נוספים באותה רמה או רמה נמוכה יותר באופן משורשר (Nested Management).
```

**L9**

```
⚙️ מנהל מערכת (Super Admin)
```

**L10**

```
 └── ⚙️ מנהל מערכת משני (Admin) ← יכול לנהל מנהלים תחתיו (רקורסיבי)
```

**L11**

```
 └── 👑 מנהל ארגון (Org Admin)
```

**L12**

```
      ├── 👑 מנהל בארגון (Org Manager) ← יכול לנהל מנהלים תחתיו (רקורסיבי)
```

**L13**

```
      ├── 🎧 מנהל מוקדנים (Operators Manager)
```

**L14**

```
      │    └── 🎧 מוקדן (Operator)
```

**L15**

```
      ├── 👔 מנהל מתנדבים (Volunteer Manager) ← יכול לנהל מנהלי מתנדבים תחתיו (רקורסיבי)
```

**L16**

```
      │    └── 🏢 מתנדב בארגון (Org Volunteer)
```

**L17**

```
      └── 💼 עובד עמותה (Org Employee)
```

**L18**

```
 └── 🎗️ מתנדב עצמאי (Volunteer) ← חייב שיוך לארגון אחד לפחות
```

**L19**

```
 └── 👤 חבר קהילה (User) ← המשתמש הבסיסי
```

**L20**

```
 └── 👤 אורח (Guest) ← צפייה בלבד
```

**L23**

```
### 2.2 פירוט תפקידים מלא
```

**L25**

```
#### 👤 אורח (Guest)
```

**L26**

```
* **תיאור:** אדם שגולש באפליקציה ללא הרשמה או התחברות.
```

**L27**

```
* **יכולות:** צפייה בפיד הכללי הציבורי, צפייה בפרופילי עמותות ציבוריים, צפייה בסטטיסטיקות קהילתיות כלליות, צפייה בדף הנחיתה.
```

**L28**

```
* **הגבלות:** אינו יכול ליצור פוסטים, לתרום, להתנדב, לשלוח הודעות, לעקוב אחרי משתמשים, להשתתף באתגרים, לבקש עזרה, ליצור קשר עם משתמשים אחרים, או לבצע כל פעולה אקטיבית. בכל ניסיון לפעולה אקטיבית תוצג הודעה מזמינה להרשמה.
```

**L29**

```
* **מיקוד עיצובי:** כפתור "הצטרף לקהילה" בולט ומזמין בכל מסך.
```

**L31**

```
#### 👤 חבר קהילה (User)
```

**L32**

```
* **תיאור:** המשתמש הבסיסי הרשום של הפלטפורמה.
```

**L33**

```
* **מצבי אימות:**
```

**L34**

```
    * **משתמש רשום (Registered):** מילא פרטים ראשוניים.
```

**L35**

```
    * **משתמש מאומת (Verified):** מילא פרופיל מלא, העלה צילום ת"ז ועבר בדיקת אימות מוצלחת.
```

**L36**

```
* **הבדלי הרשאות:** **אין הבדל בהרשאות המערכת** בין משתמש רשום למשתמש מאומת. ההבדל היחיד הוא הצגת **"וי כחול" (Blue Checkmark)** בפרופיל של משתמש מאומת, המעיד על אמינותו.
```

**L37**

```
* **יכולות:** יצירת פוסטים (בקשות ותרומות), עקיבה אחרי משתמשים אחרים, השתתפות באתגרים, שליחת והודעות בצ'אט, שמירת מועדפים (סימניות), צפייה בפרופילים, דיווח על תכנים פוגעניים, עריכת פרופיל אישי, שיתוף פרופיל.
```

**L38**

```
* **מסלול אימות:** כל עוד הפרופיל לא מאומת – מוצגת התראה קבועה עם קריאה לפעולה להשלמת אימות (העלאת ת"ז ומילוי כלל הפרטים).
```

**L40**

```
#### 🎗️ מתנדב (Volunteer)
```

**L41**

```
* **תיאור:** משתמש שקיבל הכרה רשמית כמתנדב פעיל. **חובה: שיוך לארגון אחד לפחות.**
```

**L42**

```
* **יכולות נוספות:** קבלת הצעות שידוך מהמוקד.
```

**L43**

```
* **תהליך הפיכה למתנדב/מנהל:** בקשת הצטרפות לארגון (ניתן לשלוח למנהל הארגון או למנהל מתנדבים קיים) ← אישור הגורם המנהל ← שינוי סטטוס אוטומטי.
```

**L45**

```
#### 👔 מנהל מתנדבים (Volunteer Manager)
```

**L46**

```
* **תיאור:** מתנדב בכיר המנהל צוות של מתנדבים תחתיו ("עץ ארגוני").
```

**L47**

```
* **יכולות נוספות:** צפייה בדו"חות שעות של מתנדבי הצוות, שיבוץ מתנדבים למשימות, אישור/דחיית דיווחי שעות, ניהול לוח משמרות, שליחת הודעות מרוכזות לצוות.
```

**L48**

```
* **ניהול היררכי:** מנהל מתנדבים יכול למנות תחתיו מנהלי מתנדבים נוספים לניהול תת-צוותים בצורה רקורסיבית.
```

**L50**

```
#### 🏢 מתנדב בארגון (Org Volunteer)
```

**L51**

```
* **תיאור:** מתנדב המשויך רשמית לעמותה או פרויקט מוגדר.
```

**L52**

```
* **יכולות נוספות:** גישה למשימות פנים-ארגוניות, דיווח שעות לארגון הספציפי, השתתפות בצ'אטים ארגוניים סגורים.
```

**L53**

```
* **הרשאות מיוחדות:** בהתאם להחלטת מנהל הארגון, מתנדב יכול לקבל הרשאות לביצוע פעולות רשמיות, עריכת פרופיל העמותה וגישה מוגבלת ללוח הבקרה (זהה ליכולות של עובד עמותה).
```

**L55**

```
#### 💼 עובד עמותה (Org Employee)
```

**L56**

```
* **תיאור:** משתמש המועסק בשכר בעמותה. מבחינת הרשאות מערכת, אין הבדל מהותי בינו לבין מתנדב בארגון שקיבל הרשאות מורחבות; ההבדל הוא בסטטוס ההעסקה בלבד.
```

**L57**

```
* **יכולות נוספות:** ביצוע פעולות רשמיות בשם העמותה (פרסום עדכונים, אישור בקשות), עריכת פרופיל העמותה, גישה ללוח הבקרה הארגוני ברמת צפייה ועריכה מוגבלת.
```

**L59**

```
#### 🎧 מוקדן / מפעיל (Operator)
```

**L60**

```
* **תיאור:** משתמש בעל סיווג רגיש, אחראי על מערך ה"שידוכים".
```

**L61**

```
* **יכולות נוספות:** צפייה בתור פניות חסויות (רמות 1 ו-2), "לקיחת בעלות" על פנייה, חיפוש מתנדבים מתאימים, שליחת הצעות שידוך, ניהול תיק פנייה, רישום הערות פנימיות, צפייה ביומן פעולות (Audit Trail).
```

**L62**

```
* **מגבלות:** אין לו גישה לניהול ארגוני או כספי.
```

**L64**

```
#### 🎧 מנהל מוקדנים (Operators Manager)
```

**L65**

```
* **תיאור:** אחראי על ניהול צוות המוקדנים ובקרת איכות.
```

**L66**

```
* **יכולות נוספות:** הקצאת משמרות למוקדנים, ניטור ביצועי צוות, בקרת איכות על טיפול בפניות, העברת פניות בין מוקדנים, ניהול הרשאות מוקדנים.
```

**L68**

```
#### 👑 מנהל ארגון (Org Admin)
```

**L69**

```
* **תיאור:** הגורם המנהל של עמותה ספציפית בפלטפורמה.
```

**L70**

```
* **יכולות נוספות:** גישה מלאה ללוח בקרה ארגוני (CRM), ניהול כספים ותרומות, ניהול צוות עובדים ומתנדבים, ניהול משימות ארגוניות, אישור מתנדבים חדשים, עריכה מלאה של עמוד העמותה, ניהול אינטגרציות.
```

**L71**

```
* **ניהול היררכי:** מנהל הארגון יכול למנות תחתיו מנהלים בארגון (Org Managers) שיכולים לנהל מחלקות או צוותים, כולל מינוי מנהלים נוספים תחתיהם בצורה רקורסיבית.
```

**L73**

```
#### ⚙️ מנהל מערכת (Super Admin)
```

**L74**

```
* **תיאור:** סמכות-על בפלטפורמה.
```

**L75**

```
* **יכולות נוספות:** ניהול כלל המשתמשים והרשאותיהם, אישור/דחיית בקשות ארגונים חדשים, ניהול קטגוריות גלובליות, גישה לכל הדו"חות והסטטיסטיקות, ניהול תכני מערכת, ניהול צוות מוקדנים ומנהלי מוקדנים, בקרה על תוכן (Content Moderation), ניהול הגדרות מערכת.
```

**L76**

```
* **ניהול היררכי:** סופר אדמין יכול למנות מנהלי מערכת (Admins) תחתיו, שיכולים לנהל חלקים מהמערכת ולמנות מנהלים נוספים תחתיהם בצורה רקורסיבית.
```

**L78**

```
### 2.3 מטריצת הרשאות מרכזית
```

**L80**

```
| פעולה               | אורח | חבר | מתנדב | עובד עמותה | מוקדן | מנהל ארגון | Super Admin |
```

**L82**

```
| צפייה בפיד ציבורי   | ✅    | ✅   | ✅     | ✅          | ✅     | ✅          | ✅           |
```

**L83**

```
| יצירת פוסט          | ❌    | ✅   | ✅     | ✅          | ✅     | ✅          | ✅           |
```

**L84**

```
| בקשת עזרה           | ❌    | ✅   | ✅     | ✅          | ✅     | ✅          | ✅           |
```

**L85**

```
| עקיבה אחרי משתמשים  | ❌    | ✅   | ✅     | ✅          | ✅     | ✅          | ✅           |
```

**L86**

```
| שליחת הודעות צ'אט   | ❌    | ✅   | ✅     | ✅          | ✅     | ✅          | ✅           |
```

**L87**

```
| השתתפות באתגרים     | ❌    | ✅   | ✅     | ✅          | ✅     | ✅          | ✅           |
```

**L88**

```
| קבלת הצעות שידוך    | ❌    | ❌   | ✅     | ✅          | ❌     | ✅          | ✅           |
```

**L89**

```
| גישה לתור מוקדנים   | ❌    | ❌   | ❌     | ❌          | ✅     | ❌          | ✅           |
```

**L90**

```
| עריכת פרופיל עמותה  | ❌    | ❌   | ❌     | ✅          | ❌     | ✅          | ✅           |
```

**L91**

```
| ניהול כספים ארגוני  | ❌    | ❌   | ❌     | ❌          | ❌     | ✅          | ✅           |
```

**L92**

```
| ניהול הרשאות כלליות | ❌    | ❌   | ❌     | ❌          | ❌     | ❌          | ✅           |
```

**L95**

```
*הפרק הבא: [3. פיצ'רים ותהליכי ליבה](./03_Core_Features.md)*
```

**L96**

```
*חזרה ל[אינדקס ראשי](./00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/03_Core_Features.md`

**L3**

```
## 📱 3. פיצ'רים ותהליכי ליבה (Core Features)
```

**L5**

```
### 3.1. כניסה, אימות זהות וניהול פרופיל
```

**L7**

```
#### 3.1.1 אפשרויות התחברות
```

**L8**

```
* **כניסה מהירה (SSO):** Google, Apple, Facebook.
```

**L9**

```
* **כניסה עם מספר טלפון:** שליחת קוד OTP חד-פעמי.
```

**L10**

```
* **כניסה קלאסית:** דוא"ל וסיסמה (כולל "שכחתי סיסמה").
```

**L11**

```
* **כניסה כאורח:** צפייה בלבד בתכנים ציבוריים. בכל ניסיון לפעולה אקטיבית – הקפצת הודעה מזמינה להרשמה עם הסבר יתרונות.
```

**L13**

```
#### 3.1.2 תהליך Onboarding (הרשמה ראשונית)
```

**L14**

```
לאחר ההרשמה הראשונית, המשתמש מופנה לתהליך בניית פרופיל מודרך. **ניתן לדלג על התהליך בכל שלב באמצעות כפתור "דלג"**, ובמקרה כזה המשתמש יופנה ישירות לפיד עם התראה קבועה להשלמת הפרטים החסרים.
```

**L15**

```
1. **שלב 1 – פרטים בסיסיים:** שם מלא, תמונת פרופיל, עיר מגורים.
```

**L16**

```
2. **שלב 2 – תחומי עניין:** בחירה מרשימת קטגוריות (מזון, בגדים, חינוך, רפואה וכו') – משפיע על התאמת הפיד.
```

**L17**

```
3. **שלב 3 – אימות תעודת זהות:** העלאת צילום ת"ז. עד להשלמה – הפרופיל במצב "לא מאומת", מוצגת התראה קבועה, ואין "וי כחול".
```

**L18**

```
4. **שלב 4 – הסבר קצר:** מסך "ברוכים הבאים" עם סקירה מהירה של 3-4 יכולות מרכזיות.
```

**L20**

```
#### 3.1.3 פרופיל אישי
```

**L21**

```
* **כרטיס ביקור:** תמונה, שם, וי כחול (אם אומת), עיר, ביוגרפיה קצרה, **תצוגת תפקיד נוכחי (למשל: "מתנדב", "מנהל מתנדבים")**.
```

**L22**

```
* **פעולות מבוססות תפקיד:** אפשרות לשלוח בקשות ייעודיות למשתמש בהתאם לתפקידו (למשל: בקשת הצטרפות לצוות ממנהל מתנדבים, בקשת עזרה ממוקדן וכו').
```

**L23**

```
* **סטטיסטיקות אישיות:** כמות תרומות, שעות התנדבות, רצפים באתגרים.
```

**L24**

```
* **רשת קשרים:** עוקבים, נעקבים, "קשרי שייכות" לארגונים.
```

**L25**

```
* **היסטוריית פעילות:** לשוניות – פוסטים פתוחים, פוסטים סגורים, פוסטים מתויגים.
```

**L26**

```
* **פעולות:** עריכת פרופיל, שיתוף פרופיל, ניהול הגדרות פרטיות.
```

**L28**

```
#### 3.1.4 פרופיל עמותה (מנקודת מבט משתמש)
```

**L29**

```
* כפתור פעולה ראשי בולט: "התנדב" או "תרום" ישירות לעמותה.
```

**L30**

```
* אזור מידע: תיאור, מיקום, תחומי פעילות, מדדי עשייה.
```

**L31**

```
* קיר עדכונים – פוסטים שפורסמו בשם הארגון.
```

**L32**

```
* רשימת מתנדבים פעילים (גלויים בלבד).
```

**L34**

```
#### 3.1.5 עריכת פרופיל עמותה (מנהלים ועובדים)
```

**L35**

```
* **פיצ'ר זה זמין לעמותות במנוי בלבד (בתשלום חודשי).**
```

**L36**

```
* פאנל Drag & Drop להוספת כפתורים, טקסטים, באנרים.
```

**L37**

```
* העלאת לוגו וכיסוי (Cover).
```

**L38**

```
* כל שינוי משפיע על התצוגה הציבורית לכל המשתמשים.
```

**L40**

```
#### 3.1.6 חוויה מותאמת אישית (UI Customization)
```

**L41**

```
* משתמשים יכולים לשנות את נראות האפליקציה (צבעים, עיצובים) באמצעות שיחה עם עוזר ה-AI.
```

**L42**

```
* כל שינוי נשמר ברמת המשתמש בלבד.
```

**L43**

```
* כפתור "חזרה לגרסה המקורית" זמין תמיד.
```

**L44**

```
* קטגוריית תרומה ייחודית: "עיצוב האפליקציה" – משתמשים משתפים עיצובים, מעתיקים מאחרים, שומרים גרסאות.
```

**L48**

```
### 3.2. הפיד החברתי וניהול התוכן
```

**L50**

```
#### 3.2.1 הפיד הראשי (Main Feed)
```

**L51**

```
* **אלגוריתם תצוגה:** שילוב ציר זמן ורלוונטיות (מיקום גיאוגרפי, תחומי עניין, היסטוריית פעילות).
```

**L52**

```
* **סוגי תוכן בפיד:** בפיד יוצגו כל סוגי הפוסטים מכל הקטגוריות.
```

**L53**

```
* **נראות הפוסטים:** בפיד רואים את הפוסטים, ובכל פוסט יהיה ברור האם מדובר בפוסט נתינה (הצעה) או פוסט בקשה.
```

**L54**

```
* **טוגל חברים/כולם:** בפיד יש כפתור טוגל הקובע האם לראות את הפוסטים של כולם או רק של החברים שלי (משתמשים שאני עוקב אחריהם).
```

**L55**

```
* **סינון ומיון מתקדם:** בפיד יהיה כפתור שיפתח חלון של כל אפשרויות הסינון, המיון והחיפוש המתקדמים.
```

**L56**

```
* **סטטיסטיקות:** כפתור ייעודי למעבר מהיר למסך הסטטיסטיקות.
```

**L58**

```
#### 3.2.2 חיפוש ועוזר AI אישי
```

**L59**

```
* **שורת חיפוש חופשי:** חיפוש טקסטואלי/מילולי בכל סוגי התוכן.
```

**L60**

```
* **סינון קטגוריאלי:** עשרות מסננים מובנים (קטגוריה, תאריך, אזור, סטטוס).
```

**L61**

```
* **עוזר AI אינטראקטיבי:** צ'אט-בוט המסייע להתמצאות, ממליץ על התנדבויות רלוונטיות, עוזר למצוא תוכן ספציפי.
```

**L62**

```
* **חיפוש קולי:** אפשרות לחפש באמצעות דיבור.
```

**L64**

```
#### 3.2.3 הסתרת פוסטים ומסננים קבועים
```

**L65**

```
* **הסתרת פוסט עצמי:** הצעה לשנות רמת אנונימיות במקום הסתרה מוחלטת.
```

**L66**

```
* **הסתרת פוסט של אחרים:** בחירה – הסתרה חד-פעמית או מסנן קבוע. האלגוריתם מזהה האם לחסום לפי קטגוריה או לפי סטטוס.
```

**L67**

```
* **ניהול מסננים אישיים:** מסך ייעודי בהגדרות לצפייה ועריכת כל המסננים הקבועים.
```

**L69**

```
#### 3.2.4 התראות ו-Push Notifications
```

**L70**

```
* **סוגי התראות:** הצעות שידוך, אישורי מסירה, תזכורות אתגר, הודעות צ'אט חדשות, עוקבים חדשים, עדכוני סטטוס לפניות.
```

**L71**

```
* **ניהול התראות:** מסך מרכזי לצפייה בכל ההתראות, סימון כנקראו, מעבר ישיר לתוכן רלוונטי.
```

**L72**

```
* **הגדרות התראות:** אפשרות לכבות/להדליק/להגדיר כל סוג התראה בנפרד.
```

**L76**

```
### 3.3. אנונימיות ופרטיות מובנית (3 רמות)
```

**L79**

```
| רמה | שם             | מי רואה             | מה נחשף                                 | אופן יצירת קשר          |
```

**L81**

```
| 🛡️ 1 | למוקדנים בלבד  | צוות המוקדנים בלבד  | הכל (שם, פרטים מלאים)                   | רק דרך המוקדן           |
```

**L82**

```
| 👥 2 | עוקבים בלבד    | עוקבים (החברים שלי) | פוסט רגיל לחלוטין (פרטים מלאים לעוקבים) | ישירות דרך הפרופיל/צ'אט |
```

**L83**

```
| 🌍 3 | ציבורי לחלוטין | כולם (ברירת מחדל)   | פוסט רגיל לחלוטין (פרטים מלאים לכולם)   | ישירות דרך הפרופיל/צ'אט |
```

**L85**

```
**כללים נוספים:**
```

**L86**

```
* ברירת המחדל היא רמה 3 (ציבורי).
```

**L87**

```
* בפוסטים ברמה 1, לא ניתן לקחת בעלות ללא מעורבות מוקדן.
```

**L88**

```
* לאחר פרסום, ניתן להעלות רמת חשיפה (להפוך לפומבי יותר) אך לא להוריד.
```

**L92**

```
### 3.4. מערך "שידוכים" (Operator Matching)
```

**L94**

```
#### 3.4.1 מהות השירות
```

**L95**

```
מוקד אנושי המטפל בבקשות רגישות בדיסקרטיות מלאה. חיבור בין מבקשי עזרה רגישים לבין מתנדבים מתאימים.
```

**L97**

```
#### 3.4.2 תהליך עבודת המוקדן
```

**L98**

```
1. **קבלת פנייה:** פנייה מגיעה לתור מרמת אנונימיות 1.
```

**L99**

```
2. **לקיחת בעלות (Claim):** מוקדן לוחץ "קח בעלות" – הפנייה ננעלת אליו.
```

**L100**

```
3. **בחינת הפנייה:** המוקדן קורא את הפרטים, מוסיף הערות פנימיות.
```

**L101**

```
4. **חיפוש מתנדב:** חיפוש לפי אזור גיאוגרפי, תחום, זמינות.
```

**L102**

```
5. **יצירת קשר ושיח (Engagement):** המוקדן פונה למתנדב/תורם פוטנציאלי דרך הצ'אט. המטרה היא לא רק להציע, אלא לנהל שיח: להסביר את חשיבות הבקשה, לברר התאמה מדויקת, ולנסות לרתום את המתנדב לסיוע.
```

**L103**

```
6. **העשרת פרופיל ודיוק יכולות (Profile Enrichment):** על בסיס השיחה, המוקדן מעדכן פרטים בתיק המשתמש של המתנדב (העדפות עומק, יכולות מיוחדות, רגישויות). המשתמש מקבל התראה על הנתונים החדשים שנוספו לפרופיל שלו וניתן לו החופש לערוך או למחוק אותם בהגדרות הפרופיל (תחת תחומי עניין ויכולות). מידע זה משמש את המערכת והמוקד לשידוכים עתידיים מדויקים יותר, ואינו גלוי למשתמשים אחרים ללא אישור המשתמש.
```

**L104**

```
7. **הסכמה הדדית:** רק אם שני הצדדים מסכימים – נחשפות הזהויות המלאות (במידת הצורך) ונפתח צ'אט ישיר ביניהם.
```

**L105**

```
8. **סגירת תיק:** לאחר סיום הטיפול – סגירה עם סיכום ותיעוד מלא.
```

**L107**

```
#### 3.4.3 ניהול מנהל מוקדנים
```

**L108**

```
* הקצאת משמרות וזמני עבודה.
```

**L109**

```
* ניטור עומס ופיזור פניות.
```

**L110**

```
* בקרת איכות – ביקורת אקראית על תיקים סגורים.
```

**L111**

```
* העברת פניות בין מוקדנים.
```

**L112**

```
* דו"חות ביצועים (זמני תגובה, שביעות רצון).
```

**L115**

```
* כל פעולה מתועדת: מי, מתי, מה.
```

**L116**

```
* היסטוריית שינויים בסטטוס התיק.
```

**L117**

```
* רישום הערות פנימיות של מוקדנים.
```

**L118**

```
* לא ניתן למחוק רשומות – רק להוסיף.
```

**L122**

```
### 3.5. עולמות תרומה (Donation Worlds) – המרכז המאחד
```

**L124**

```
#### 3.5.1 פילוסופיית "עולם" – הדואליות בין נתינה לקבלה
```

**L125**

```
ה-DNA של הפלטפורמה הוא חלוקת **כל** סוגי התרומות והבקשות ל**עולמות**. כל עולם הוא יחידה תוכנית-עיצובית-לוגית עצמאית עם קטגוריות, מסך ייעודי, סוגי פוסטים, חוקים ייחודיים וזרימות עבודה משלו, אך **כולם** משתפים חוקיות אחידה:
```

**L127**

```
* **שני מצבים סימטריים בכל עולם – "לתת" ו"לקבל":**
```

**L128**

```
    * **מצב "לתת" (Give Mode):** המשתמש מציע משאב לקהילה (כסף, חפץ, מזון, ידע, זמן, מקום לינה, תרומת דם פוטנציאלית וכו').
```

**L129**

```
    * **מצב "לקבל" (Receive Mode):** המשתמש מבקש משאב, סיוע, או נמצא במצוקה הזקוקה לעזרה.
```

**L130**

```
    * **טוגל מצב גלובלי בעולם:** בכל מסך עולם קיים טוגל ראשי בולט המחליף בין שני המצבים, ומשנה את התצוגה, רכיבי הסינון, ואת תפקידי הפעולה ("פרסם הצעה" ↔ "פרסם בקשה").
```

**L131**

```
* **אחידות חוצת-עולמות:** כל עולם מייצר תחת המכסה פוסטים שעוברים בפיד הראשי (3.2), ניתנים לרמת אנונימיות (3.3), זכאים לתיווך מוקד שידוכים אם רגישים (3.4), נצברים בסטטיסטיקות (3.10), ניתנים לשמירה במועדפים (3.13).
```

**L132**

```
* **התמחות פנימית:** מעבר לאחידות, לכל עולם יש שדות חובה ייחודיים (לדוגמה: תאריך תפוגה במזון, אימות גוף רפואי ברפואה, אישור משפטי בתרומת אברים, חלון זמן באירוח דיור).
```

**L134**

```
#### 3.5.2 תשתית רוחבית משותפת לכל העולמות
```

**L136**

```
| יכולת | תיאור | חל על |
```

**L138**

```
| מנוע פוסטים אחיד | כל אובייקט בעולם הוא בסיסית "פוסט" עם metadata ייחודי | כל העולמות |
```

**L139**

```
| רמות אנונימיות (1/2/3) | בקשות רגישות (לדוגמה כסף-קבלה, רפואה, דיור) ברירת מחדל מציעה רמה 1 | כל העולמות |
```

**L140**

```
| גישור מוקדנים | פניות רמה 1 עוברות אוטומטית לתור המוקד | רגיש בלבד |
```

**L141**

```
| סינון גיאוגרפי | רדיוס/עיר/אזור | כל העולמות |
```

**L142**

```
| התאמה אלגוריתמית (Matching) | חיבור הצעה↔בקשה לפי קטגוריה, מיקום, זמינות | כל העולמות |
```

**L143**

```
| Trust & Safety | אימות זהות, דיווחים, חסימות, Audit Trail | כל העולמות |
```

**L144**

```
| חיבור הדדי בין עולמות | מסירת חפץ מזמינה תיווך נסיעה; מזון יכול להזמין שינוע; דיור יכול להזמין הסעה | רב-עולמי |
```

**L146**

```
#### 3.5.3 מפת העולמות
```

**L148**

```
הטבלה היא **המפתח הניווטי** של הפלטפורמה. לחיצה על שם עולם פותחת את המסמך הייעודי שלו עם פירוט מלא, כללי עומק, פוסט-פלואו, קישוריות למסכים וזרימות.
```

**L150**

```
| #     | עולם                              | מצב לתת (Give) – תקציר            | מצב לקבל (Receive) – תקציר                | מסמך עומק                                                                     |
```

**L152**

```
| 3.5.4 | 💰 כסף                            | תרומה לעמותות/קמפיינים/הוראות קבע | בקשות סיוע אישי, קמפיינים ארגוניים        | [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md)                |
```

**L153**

```
| 3.5.5 | 📦 חפצים                          | מסירת רהיטים, בגדים, ספרים וכו'   | בקשת חפץ ספציפי                           | [`donation_worlds/02_Items.md`](./donation_worlds/02_Items.md)                |
```

**L154**

```
| 3.5.6 | 🍎 מזון                           | מסירת מזון עם תאריך תפוגה         | בקשת מזון/חבילת מזון                      | [`donation_worlds/03_Food.md`](./donation_worlds/03_Food.md)                  |
```

**L155**

```
| 3.5.7 | ⚕️ רפואה                          | תרומת דם, הצהרת אברים, ציוד רפואי | בקשת תרומת דם דחופה, ציוד רפואי, מתנדבים  | [`donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md)            |
```

**L156**

```
| 3.5.8 | 🏠 דיור / אירוח                   | הצעת חלון אירוח/לינת שטח          | בקשת לינה (שביליסטים, חסרי בית, אורחים)   | [`donation_worlds/05_Housing.md`](./donation_worlds/05_Housing.md)            |
```

**L157**

```
| 3.5.9 | 🚗 נסיעות שיתופיות                | הצעת טרמפ / שינוע חפץ-מזון        | בקשת טרמפ / בקשת שינוע                    | [`donation_worlds/06_Rides.md`](./donation_worlds/06_Rides.md)                |
```

**L158**

```
| 3.5.10 | 📚 ידע                           | בניית קורס, שיעור פרטי, טקסט      | בקשת חונכות, בקשת הסבר                    | [`donation_worlds/07_Knowledge.md`](./donation_worlds/07_Knowledge.md)        |
```

**L159**

```
| 3.5.11 | 🕒 זמן והתנדבות                  | הצעת התנדבות לפי תחום ושעות       | בקשת חברה, ליווי, תמיכה רגשית             | [`donation_worlds/08_Time.md`](./donation_worlds/08_Time.md)                  |
```

**L160**

```
| 3.5.12 | 🐾 בעלי חיים                     | אימוץ, פנסיון לזמני, תרומת מזון   | חיפוש בית לחיה, בעל חיים אבוד             | [`donation_worlds/09_Animals.md`](./donation_worlds/09_Animals.md)            |
```

**L161**

```
| 3.5.13 | 🌱 סביבה (צמחים + מיחזור)        | מסירת צמחים, מתן פסולת ממוחזרת    | בקשת ייחורים, בקשת קומפוסט                | [`donation_worlds/10_Environment.md`](./donation_worlds/10_Environment.md)    |
```

**L162**

```
| 3.5.14 | 🎨 יצירה (מוזיקה/מתכונים/חידות) | שיתוף יצירה, כלי, מתכון, חידה     | בקשת ליווי בנגינה, בקשת מתכון מיוחד       | [`donation_worlds/11_Creative.md`](./donation_worlds/11_Creative.md)          |
```

**L163**

```
| 3.5.15 | 💞 שידוכים רומנטיים              | הצעת שדכן/שדכנית מתנדב/ת          | בקשת חיבור רומנטי                         | [`donation_worlds/12_Matchmaking_Romantic.md`](./donation_worlds/12_Matchmaking_Romantic.md) |
```

**L164**

```
| 3.5.16 | 🎨 עיצוב האפליקציה               | שיתוף ערכת עיצוב משתמש            | אימוץ עיצוב מקהילה                        | [`donation_worlds/13_App_Design.md`](./donation_worlds/13_App_Design.md)      |
```

**L166**

```
> ה**עולם המרכזי** ב-MVP הוא **כסף, חפצים, מזון, רפואה, דיור, נסיעות, ידע, זמן** – כפי שמודגש בכל מסמך עומק.
```

**L168**

```
#### 3.5.4 עולם הכסף (תקציר)
```

**L169**

```
* **מהות:** מקבילה דיגיטלית של [jgive.com](https://jgive.com) ומעבר לכך – המסך המרכזי לתרומות כספיות, גיוס המונים, הוראות קבע ויצירת קרנות פילנתרופיות אישיות.
```

**L170**

```
* **מצב לתת:** דפדוף אינטראקטיבי בכלל העמותות הרשומות במערכת עם מנועי סינון/מיון מתקדמים (תחום פעילות, אזור גיאוגרפי, גודל ארגון, אחוז שקיפות, יעילות הוצאות, דירוג קהילה), בחירת תרומה חד-פעמית או הוראת קבע, תרומה לקמפיין ספציפי, יצירת **קרן אישית/ציבורית** לתרומות עתידיות מתוזמנות, **שיתוף תיק השקעות אימפקט** (חשיפת תרומות העבר ככלי להשראה ולהובלת מחשבה).
```

**L171**

```
* **מצב לקבל:** משתמשים פרטיים יכולים לפתוח **בקשת סיוע אישית** המופנית לעמותות סיוע (בסגנון "פעמונים") עם מנגנוני אנונימיות; משתמשים בעלי שיוך ארגוני יכולים **לפתוח קמפיין מימון** ייעודי תחת מטריית הארגון עם יעד, תאריך יעד וסיפור.
```

**L172**

```
* **תפריט פנימי:** הוראות קבע פעילות, היסטוריה והקבלות, תיק השקעות אימפקט, קרן אישית/ציבורית, הגדרות אמצעי תשלום, ייצוא לדוחות שנתיים (טופס 46).
```

**L173**

```
* **פירוט מלא:** [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md) | זרימות [11, F1‑F5] ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.5 ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L175**

```
#### 3.5.5 עולם החפצים (תקציר)
```

**L176**

```
* **מהות:** מסירת ובקשת חפצים פיזיים בין משתמשים – מהמיטה הישנה ועד לסוודר ילדים. המנגנון הוא **בסיס ה"תן וקח" של הפלטפורמה**.
```

**L177**

```
* **מצב לתת:** פרסום חפץ עם תמונות חובה, מצב, קטגוריה, כתובת איסוף, מנגנון מסירה ("כל הקודם זוכה" / "דורש אישור מוסר"), הצעת שינוע אופציונלית.
```

**L178**

```
* **מצב לקבל:** פרסום בקשת חפץ ספציפי (למשל "מחפש מקרר לסטודנטית") עם רמת אנונימיות לבחירה, אופציונלית עם תיווך מוקדן לבקשות רגישות.
```

**L179**

```
* **חיבור הדוק לעולם הנסיעות (3.5.9):** לאחר אישור מסירה, המערכת מזהה גודל וכבדות החפץ ומציעה אוטומטית שינוע – נסיעה קיימת או פתיחת בקשת שינוע.
```

**L180**

```
* **פירוט מלא:** [`donation_worlds/02_Items.md`](./donation_worlds/02_Items.md) | זרימה 5 ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.4 ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L182**

```
#### 3.5.6 עולם המזון (תקציר)
```

**L183**

```
* **מהות:** מנגנון דומה במהותו לעולם החפצים, אך עם **אילוץ קריטי:** כל פוסט נתינה חייב לקבל **תאריך תפוגה** התואם לסוג המזון, ולא ניתן למסור מזון מקולקל. אסור למסור מזון לאחר תאריך התפוגה.
```

**L184**

```
* **מצב לתת:** פרסום מזון לחלוקה (בית קפה שנשארו לו מאפים, מארח שיש לו שאריות מארוחה, מסיבה עם עודפים) עם **תאריך תפוגה חובה**, סוג מזון (מבושל / ארוז / טרי / יבש), אלרגנים מסומנים, היגיינה (כשרות, הקפאה, וכו'), כתובת ושעת איסוף.
```

**L185**

```
* **מצב לקבל:** בקשת מזון אישית (משפחה במצוקה) או ארגונית (מטבח חברתי, לקט ישראל), עם רמת אנונימיות מותאמת.
```

**L186**

```
* **שעון תפוגה אוטומטי:** המערכת מסתירה אוטומטית פוסטי נתינת מזון שעבר תאריך התפוגה ומסמנת אותם כסגורים.
```

**L187**

```
* **פירוט מלא:** [`donation_worlds/03_Food.md`](./donation_worlds/03_Food.md) | זרימות F6‑F7 ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.X ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L189**

```
#### 3.5.7 עולם הרפואה (תקציר)
```

**L190**

```
* **מהות:** המסך המקושר ישירות **לגופי הרפואה הרשמיים** במדינה (מד"א, ההסתדרות הרפואית, בתי חולים מרכזיים, עמותות מתחום הבריאות). העולם הזה אינו "תן וקח" כללי אלא **שער מאומת** לפעולות רפואיות הצלת חיים.
```

**L191**

```
* **מצב לתת:**
```

**L192**

```
    * **תרומת דם:** תיאום פגישה/הזמנת תור בתחנת מד"א או יחידה ניידת על בסיס מיקום וזמינות, תזכורות, וודיאו וידוא הבריאות.
```

**L193**

```
    * **תרומת אברים לאחר המוות:** מילוי **טופס אדי** דיגיטלי וחתימה אלקטרונית, רישום במאגר הלאומי.
```

**L194**

```
    * **תרומת אברים בחיים:** הבעת רצון להתנדב לתרומה כגון כיליה, מח עצם, פלזמה – העברה לתהליכי בדיקה רפואיים מול גופים מאומתים.
```

**L195**

```
    * **ציוד רפואי שמיש:** מסירת ציוד יד-שניה (כיסא גלגלים, הליכון, מכשיר שמיעה) לעמותות מתאימות (יד שרה ודומותיה).
```

**L196**

```
* **מצב לקבל:**
```

**L197**

```
    * קריאות חירום לתרומת דם דחופה (לפי סוג דם ואזור, ב-Push בלבד למתאימים).
```

**L198**

```
    * בקשות לציוד רפואי שמיש.
```

**L199**

```
    * חיפוש מתנדבים לליווי פיזי לבדיקות / טיפולים.
```

**L200**

```
* **חוקי אמינות חמורים:** כל פעולה ברפואה דורשת אימות זהות מלא ("וי כחול"), ופעולות סופיות (אדי, תיאום תור) זורמות ל-API של גופי הרפואה הרשמיים בלבד. אין מסירה ישירה בין משתמשים פרטיים.
```

**L201**

```
* **פירוט מלא:** [`donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md) | זרימות F8‑F10 ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.X ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L203**

```
#### 3.5.8 עולם הדיור / האירוח (תקציר)
```

**L204**

```
* **מהות:** "תן וקח" של מקומות לינה ושטחי אירוח – החל מאירוח **שביליסטים** (חוצי מסלולים ארוכים כדוגמת שביל ישראל) דרך **חסרי בית** ועד **אירוח רגיל** (אורחים, מטיילים).
```

**L205**

```
* **מצב לתת – מודלים:**
```

**L206**

```
    * **חלון זמן קבוע:** "אני מציע חדר בבית שלי בלילות שלישי, בתיאום מראש".
```

**L207**

```
    * **שטח לינה ספונטני:** "השטח בגינה האחורית פתוח ללינה אוהל ללא תיאום מראש".
```

**L208**

```
    * **אירוח רציף:** "פנוי לאירוח שביליסטים בכל סוף שבוע".
```

**L209**

```
* **שדות חובה לפרסום נתינה:** סוג מקום (חדר/דירה/שטח/ספה), מספר אורחים, התאריכים/חלונות הזמן, כללי הבית (חיות, עישון, צמחוני וכו'), מתקנים זמינים (מקלחת, מטבח, מים), מיקום על מפה (גוסום או מדויק לפי בחירת המארח).
```

**L210**

```
* **מצב לקבל:** משתמש מבקש לינה (שביליסט המתכנן מסלול, אדם במצוקה זמנית, מטייל) ויכול לסנן לפי תאריך, מיקום, סוג מקום, ולשלוח בקשת אירוח לכל מארח רלוונטי.
```

**L211**

```
* **בקרי בטיחות:** אימות זהות חובה לשני הצדדים, **קוד התנהגות** דיגיטלי שיש לאשר לפני אירוח ראשון, מערכת ביקורות הדדית (פרופיל מארח/אורח), כפתור חירום בצ'אט הקשור לאירוח.
```

**L212**

```
* **פירוט מלא:** [`donation_worlds/05_Housing.md`](./donation_worlds/05_Housing.md) | זרימות F11‑F12 ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.X ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L214**

```
#### 3.5.9 עולם הנסיעות שיתופיות (תקציר)
```

**L215**

```
* **מהות:** עולם נתינה/קבלה של **תנועה ומקום ברכב** – הסעת אנשים, שינוע חפצים/מזון, שילוב.
```

**L216**

```
* **מצב לתת:** הצעת נסיעה (פרסום מהיר עם ברירות מחדל או הגדרות מתקדמות), עם מודל תגמול: חינמית או השתתפות סמלית בהוצאות (אסור רווח).
```

**L217**

```
* **מצב לקבל:** בקשת טרמפ או בקשת שינוע ספציפי (חפץ גדול, חבילת מזון לתאריך-תפוגה רגיש).
```

**L218**

```
* **שילוב חוצה-עולמות:** מנגנון שינוע אוטומטי של חפצים (מ-3.5.5), מזון (מ-3.5.6), ולעיתים תיווך לארוח (מ-3.5.8 – הסעה לנקודת אירוח).
```

**L219**

```
* **פירוט מלא:** [`donation_worlds/06_Rides.md`](./donation_worlds/06_Rides.md) | זרימות 6, 7 ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסכים 6.1‑6.6 ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L221**

```
#### 3.5.10 עולם הידע (תקציר)
```

**L222**

```
* **מהות:** דרך לתרום ידע מקצועי לקהילה – קורסים דיגיטליים, שיעורים פרטיים חינם, טקסטים, סרטונים.
```

**L223**

```
* **סוגי תרומה:**
```

**L224**

```
    * **קורסים דיגיטליים:** משתמשים בונים ומעלים קורסים חינמיים שלמים (שיעורים, מבחנים, חומרי עזר).
```

**L225**

```
    * **שיעורים פרטיים:** הצעת שיעורים פרטיים (חינם) – התאמה לפי נושא ואזור.
```

**L226**

```
    * **טקסטים וכתבות:** העלאת תכנים כתובים מקצועיים.
```

**L227**

```
    * **סרטונים וקישורים:** שיתוף תוכן חינוכי חיצוני.
```

**L228**

```
* **מצב לקבל:** בקשת חונכות, בקשת הסבר על נושא, בקשת קורס בתחום ספציפי.
```

**L229**

```
* **תהליך אישור:** כל תרומת ידע נבדקת ומאושרת ע"י מנהלת הארגון לפני פרסום, כדי לשמור על איכות ולמנוע הטעיות.
```

**L230**

```
* **פירוט מלא:** [`donation_worlds/07_Knowledge.md`](./donation_worlds/07_Knowledge.md) | זרימה 14 ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.3 ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L232**

```
#### 3.5.11 עולם הזמן (תקציר)
```

**L233**

```
* **מהות:** התנדבות וסיוע אנושי ישיר – המקום בו נמדדות שעות התנדבות וזמינות.
```

**L234**

```
* **קטגוריות פנימיות:** תמיכה רגשית, בריאות הנפש, גיל הזהב, סביבה, חינוך, טכנולוגיה, תעסוקה, ליווי לפגישות, חברה.
```

**L235**

```
* **מצב לתת:** הצעת זמינות לפי תחום, אזור גיאוגרפי, ותדירות (חד-פעמי / קבוע).
```

**L236**

```
* **מצב לקבל:** בקשת חברה (בודד), ליווי, תמיכה רגשית, סיוע מעשי (קניות, בנק).
```

**L237**

```
* **חיבור הדוק לשידוכים (3.4):** מצב לקבל ברגישות גבוהה זורם אוטומטית למוקד.
```

**L238**

```
* **פירוט מלא:** [`donation_worlds/08_Time.md`](./donation_worlds/08_Time.md) | זרימות מסביב להתנדבות ב-[`04_User_Flows.md`](./04_User_Flows.md) | מסך 5.6 ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md).
```

**L240**

```
#### 3.5.12 עולם בעלי חיים (תקציר)
```

**L241**

```
* **מהות:** "תן וקח" של אימוץ, פנסיון, אבדה ומציאה.
```

**L242**

```
* **פירוט מלא:** [`donation_worlds/09_Animals.md`](./donation_worlds/09_Animals.md).
```

**L244**

```
#### 3.5.13 עולם הסביבה (תקציר)
```

**L245**

```
* **מהות:** עולם משולב של **צמחים** (ייחורים, צמחי בית, גינון קהילתי) ו**מיחזור** (מסירת ציוד יד-שנייה לעמותות מיחזור, פסולת אלקטרונית, אריזות).
```

**L246**

```
* **פירוט מלא:** [`donation_worlds/10_Environment.md`](./donation_worlds/10_Environment.md).
```

**L248**

```
#### 3.5.14 עולם היצירה (תקציר)
```

**L249**

```
* **מהות:** עולם משולב של **מוזיקה** (כלי נגינה לתרומה, ליווי בנגינה, ג'אם), **מתכונים** (שיתוף מתכונים, מתכון מותאם תזונה), ו**חידות** (חידות הקהילה, אתגרי לוגיקה).
```

**L250**

```
* **פירוט מלא:** [`donation_worlds/11_Creative.md`](./donation_worlds/11_Creative.md).
```

**L252**

```
#### 3.5.15 עולם השידוכים הרומנטיים (תקציר)
```

**L253**

```
* **מהות:** התנדבות לעזרה לרווקים/ות למצוא בני זוג. **שונה במהותו מ"שידוכים-טוב" (Operator Matching, סעיף 3.4)** שעוסק בחיבור צרכים↔משאבים בכל העולמות.
```

**L254**

```
* **פירוט מלא:** [`donation_worlds/12_Matchmaking_Romantic.md`](./donation_worlds/12_Matchmaking_Romantic.md).
```

**L256**

```
#### 3.5.16 עולם עיצוב האפליקציה (תקציר)
```

**L257**

```
* **מהות:** משתמשים יכולים לתרום את העיצוב האישי שעיצבו לאפליקציה (ראה 3.1.6) לקהילה – אחרים יכולים לאמץ ולהתאים.
```

**L258**

```
* **פירוט מלא:** [`donation_worlds/13_App_Design.md`](./donation_worlds/13_App_Design.md).
```

**L262**

```
### 3.6. צ'אט ותקשורת (Chat & Messaging)
```

**L264**

```
#### 3.6.1 יכולות צ'אט
```

**L265**

```
* הודעות טקסט, תמונות, וידאו.
```

**L266**

```
* הודעות קוליות.
```

**L267**

```
* חיוויי קריאה (נקרא/לא נקרא) וחיוויי הקלדה.
```

**L268**

```
* תגובות (Reactions) ולייקים על הודעות.
```

**L269**

```
* שיתוף מיקום.
```

**L270**

```
* שיתוף פוסטים מהפיד.
```

**L272**

```
#### 3.6.2 סוגי שיחות
```

**L273**

```
* **שיחה פרטית:** בין שני משתמשים.
```

**L274**

```
* **צ'אט שידוך (משתמשים):** נפתח אוטומטית לאחר הסכמה הדדית בשידוך.
```

**L275**

```
* **צ'אט עם מוקדן:** נפתח כאשר מוקדן יוצר קשר עם מתנדב בניסיון לבצע שידוך.
```

**L276**

```
* **צ'אט תמיכה:** שיחה עם צוות התמיכה של הפלטפורמה.
```

**L277**

```
* **צ'אט קבוצה ארגונית:** קבוצה ייעודית לעובדים ומתנדבים של אותו ארגון.
```

**L278**

```
* **צ'אט קבוצתי פרויקטאלי:** נפתח סביב פרויקט התנדבותי קבוצתי בלבד.
```

**L279**

```
* **צ'אט אתגר:** נפתח אוטומטית עם ההצטרפות לאתגר שיתופי.
```

**L280**

```
* **צ'אט אירוח (חדש):** נפתח אוטומטית בין מארח לאורח לאחר אישור בקשת אירוח (ראה עולם הדיור 3.5.8).
```

**L281**

```
* **צ'אט קמפיין כספי (חדש):** קבוצה זמנית סביב קמפיין מימון פעיל בעולם הכסף (3.5.4).
```

**L283**

```
#### 3.6.3 הגבלות צ'אט
```

**L284**

```
* **אין יצירת קבוצות שרירותית** – קבוצות רק סביב פרויקט/אתגר/קמפיין/אירוח.
```

**L285**

```
* **צ'אט קבוצתי ננעל** להודעות חדשות לאחר סגירת הפרויקט/אירוע/קמפיין (ההיסטוריה נשארת קריאה).
```

**L286**

```
* **אורחים אינם יכולים** לשלוח הודעות.
```

**L290**

```
### 3.7. אתגרים (Challenges) והרגלים
```

**L292**

```
#### 3.7.1 אתגרים אישיים (Habit Tracker)
```

**L293**

```
* בניית הרגלים עם מעקב רצפים (Streaks).
```

**L294**

```
* תזכורות Push אוטומטיות לדיווח.
```

**L295**

```
* בעת שבירת רצף: דיווח סיבה + מצב רוח להפקת לקחים.
```

**L296**

```
* סטטיסטיקות אישיות: אורך רצף נוכחי, רצף שיא, אחוז עמידה.
```

**L298**

```
#### 3.7.2 אתגרים קהילתיים קבוצתיים
```

**L299**

```
* יעדים קהילתיים (למשל: "1,000 תרומות מזון החודש").
```

**L300**

```
* לוחות מובילים (Leaderboards) לעידוד.
```

**L301**

```
* פרסים וירטואליים והכרה ציבורית.
```

**L303**

```
#### 3.7.3 אתגרים אישיים-קהילתיים (שיתופיים)
```

**L304**

```
* דוגמה: "מועדון ה-5 בבוקר".
```

**L305**

```
* כל המצטרפים רואים דיווחים של שאר הקבוצה.
```

**L306**

```
* צ'אט קבוצתי אוטומטי לחיזוק הדדי.
```

**L307**

```
* דיווח יומי (Check-in) עם אנימציות עידוד.
```

**L309**

```
#### 3.7.4 יצירת אתגר חדש
```

**L310**

```
* כל משתמש מאומת יכול ליצור אתגר.
```

**L311**

```
* הגדרות: שם, תיאור, משך, יעד, קטגוריה, ציבורי/פרטי/אישי.
```

**L312**

```
* אתגר פרטי – רק מוזמנים יכולים להצטרף (קישור/קוד).
```

**L316**

```
### 3.8. סטטיסטיקות עומק (Drill-Down Analytics)
```

**L318**

```
#### 3.8.1 פילוסופיית התצוגה
```

**L319**

```
* **שקיפות ללא עומס:** הפיד מציג ווידג'טים קומפקטיים (למשל: גרף חפצים שנמסרו, סך תרומות כספיות החודש בעולם הכסף, קילוגרמים של מזון שניצלו).
```

**L320**

```
* **לחיצה = העמקה:** לחיצה על ווידג'ט פותחת מסך עומק מלא.
```

**L322**

```
#### 3.8.2 נתונים זמינים בעומק
```

**L323**

```
* פילוח לפי זמן (יום, שבוע, חודש, שנה).
```

**L324**

```
* פילוח לפי ערים ואזורים (כולל מפות חום).
```

**L325**

```
* פילוח לפי **עולם תרומה** (3.5) ולפי קטגוריה פנימית.
```

**L326**

```
* פילוח לפי ארגון/עמותה.
```

**L327**

```
* מגמות לאורך זמן.
```

**L328**

```
* השוואה בין תקופות.
```

**L329**

```
* סטטיסטיקות אישיות מול קהילתיות.
```

**L333**

```
### 3.9. מערכת ניהול עוטפת (ERP & CRM Back-Office)
```

**L335**

```
#### 3.9.1 ניהול פנים-ארגוני
```

**L336**

```
* **כספים ותרומות:** מעקב הכנסות והוצאות, דו"חות כספיים, אינטגרציה עם עולם הכסף (3.5.4) – כל תרומה זורמת אוטומטית למסך כספי הארגון.
```

**L337**

```
* **צוות עובדים ומתנדבים:** תיקים אישיים, סטטוס, שעות, ביצועים.
```

**L338**

```
* **משימות ארגוניות:** יצירת משימות ותתי-משימות, הקצאה, דיווח שעות, מעקב סטטוס.
```

**L339**

```
* **ניהול קבצים:** אחסון ושיתוף מסמכים ארגוניים.
```

**L341**

```
#### 3.9.2 טבלאות דינמיות
```

**L342**

```
* יצירת טבלאות מותאמות אישית ישירות מהממשק.
```

**L343**

```
* הגדרת עמודות, סוגי נתונים, סינון ומיון.
```

**L344**

```
* ייצוא נתונים.
```

**L346**

```
#### 3.9.3 אינטגרציות חיצוניות
```

**L347**

```
* קישוריות למערכות כגון Monday, Jira, Atlassian, Google Sheets, וגופי רפואה (לעולם הרפואה 3.5.7).
```

**L348**

```
* סנכרון דו-כיווני של משימות ונתונים.
```

**L349**

```
* מטרה: לאפשר לעמותות מעבר הדרגתי ללא זניחת כלים קיימים.
```

**L353**

```
### 3.10. התראות (Notifications System)
```

**L355**

```
#### 3.10.1 סוגי התראות
```

**L356**

```
* **פעולה נדרשת:** הצעת שידוך, בקשת אישור מסירה, בקשת הצטרפות לנסיעה, בקשת אישור אירוח דיור, אישור תרומה כספית בהוראת קבע.
```

**L357**

```
* **עדכונים:** עוקב חדש, לייק על פוסט, תגובה לפוסט, עדכון סטטוס.
```

**L358**

```
* **תזכורות:** תזכורת אתגר יומי, תזכורת השלמת פרופיל, תזכורת דיווח שעות, **תזכורת תאריך תפוגה למזון שנמסר** (24 שעות לפני).
```

**L359**

```
* **חירום:** **קריאת חירום לתרומת דם** (Push לבעלי סוג דם תואם בקרבת אירוע), בקשת אירוח דחופה.
```

**L360**

```
* **מערכתיות:** עדכוני מדיניות, תחזוקה מתוכננת.
```

**L362**

```
#### 3.10.2 ניהול התראות
```

**L363**

```
* מסך ריכוזי לכל ההתראות עם חלוקה לקטגוריות (לפי עולם תרומה, ועל-עולמיות).
```

**L364**

```
* סימון "נקרא" / "לא נקרא".
```

**L365**

```
* לחיצה על התראה → מעבר ישיר למסך הרלוונטי.
```

**L366**

```
* הגדרות אישיות: כיבוי/הדלקה לכל סוג בנפרד.
```

**L370**

```
### 3.11. מועדפים וסימניות (Bookmarks)
```

**L372**

```
* שמירת פוסטים מכל עולמות התרומה (3.5), נסיעות, אתגרים, חפצים, עמותות, קמפיינים כספיים.
```

**L373**

```
* מסך ייעודי לצפייה בכל הפריטים השמורים.
```

**L374**

```
* סינון לפי **עולם תרומה** ולפי קטגוריה.
```

**L375**

```
* הסרת פריטים.
```

**L379**

```
### 3.12. הגדרות אפליקציה (Settings)
```

**L381**

```
* **פרופיל:** עריכת פרטים אישיים, שינוי סיסמה, ניהול אימות.
```

**L382**

```
* **התראות:** הפעלה/כיבוי לפי סוג.
```

**L383**

```
* **פרטיות:** ברירות מחדל לאנונימיות, חסימת משתמשים, ניהול מסננים.
```

**L384**

```
* **שפה:** עברית / אנגלית.
```

**L385**

```
* **נגישות:** גודל טקסט, ניגודיות.
```

**L386**

```
* **אודות:** מידע על האפליקציה, תנאי שימוש, מדיניות פרטיות.
```

**L387**

```
* **התנתקות / מחיקת חשבון.**
```

**L390**

```
*הפרק הבא: [4. זרימות משתמש (User Flows)](./04_User_Flows.md)*
```

**L391**

```
*חזרה ל[אינדקס ראשי](./00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/04_User_Flows.md`

**L3**

```
## 🗺️ 4. זרימות משתמש (User Flows)
```

**L5**

```
### מבנה הפרק
```

**L6**

```
פרק זה מתעד את **זרימות הליבה** של הפלטפורמה. הזרימות מחולקות ל-2 קבוצות:
```

**L8**

```
* **זרימות 1‑20** (זרימות מרכזיות): פעולות בסיס בכל הפלטפורמה.
```

**L9**

```
* **זרימות F1‑F16** (זרימות עולמות): זרימות ייעודיות לכל עולם תרומה (ראה [`./donation_worlds/`](./donation_worlds/)).
```

**L11**

```
> **קישוריות:** כל זרימה מסומנת עם קישור למסך ב-[`05_Screen_UI_Mapping.md`](./05_Screen_UI_Mapping.md) ולעולם הרלוונטי ב-[`./donation_worlds/`](./donation_worlds/).
```

**L15**

```
### זרימה 1: הרשמה ובניית פרופיל (Onboarding)
```

**L16**

```
**תיאור:** משתמש חדש מוריד את האפליקציה ומבצע הרשמה מלאה. **ניתן לדלג על שלבי בניית הפרופיל בכל עת.**
```

**L17**

```
* **מסך 1 – דף נחיתה (Landing Page):** המשתמש נחשף לאפליקציה. מוצגים חזון, ערכים, יכולות מרכזיות. כפתור בולט: "הצטרף לקהילה" + "המשך כאורח".
```

**L18**

```
* **מסך 2 – התחברות/הרשמה (Auth Screen):** בחירת שיטת הרשמה (Google/Apple/Facebook/טלפון/דוא"ל). מעבר מהיר בין "יש לי חשבון" ל"משתמש חדש".
```

**L19**

```
* **מסך 3 – פרטים בסיסיים (Basic Info):** הזנת שם מלא, העלאת תמונת פרופיל, בחירת עיר מגורים. (כפתור "דלג" זמין).
```

**L20**

```
* **מסך 4 – תחומי עניין (Interests Selection):** בחירה מתוך רשימה ויזואלית. (כפתור "דלג" זמין).
```

**L21**

```
* **מסך 5 – אימות תעודת זהות (ID Verification):** העלאת צילום ת"ז. (כפתור "דלג" זמין).
```

**L22**

```
* **מסך 6 – ברוכים הבאים (Welcome Tour):** סקירה אינטראקטיבית של 3-4 יכולות מרכזיות (החלקות). כפתור "התחל" מעביר לפיד.
```

**L26**

```
### זרימה 2: גלישה כאורח וחסימת פעולות
```

**L27**

```
**תיאור:** אדם גולש ללא הרשמה וניסה לבצע פעולה אקטיבית.
```

**L28**

```
* **מסך 1 – דף נחיתה:** לוחץ "המשך כאורח".
```

**L29**

```
* **מסך 2 – פיד ראשי (מצב אורח):** צופה בפוסטים ציבוריים. כפתורי פעולה (תרומה, צ'אט, עקיבה) מופיעים אך עם אייקון מנעול.
```

**L30**

```
* **מסך 3 – פופ-אפ חסימה (Guest Block Modal):** בלחיצה על כל פעולה אקטיבית, מוקפץ חלון: "כדי לתרום/לעזור/ליצור קשר – יש להירשם לקהילה". כפתורים: "הירשם עכשיו" / "אחר כך".
```

**L34**

```
### זרימה 3: יצירת פוסט לבקשת עזרה אנונימית (שידוכים)
```

**L35**

```
**תיאור:** משתמש זקוק לעזרה רגישה ואינו רוצה להיחשף.
```

**L36**

```
* **מסך 1 – פיד ראשי:** לוחץ על כפתור "+" צף או "בקש עזרה".
```

**L37**

```
* **מסך 2 – יצירת פוסט (Create Post):** מזין טקסט, בוחר קטגוריה ותגיות.
```

**L38**

```
* **מסך 3 – בחירת רמת פרטיות (Privacy Selection):** בוחר "רמה 1 – מוקדנים בלבד" עם אייקון מנעול והסבר חסיות.
```

**L39**

```
* **מסך 4 – אישור שליחה (Success):** הודעה מרגיעה: "הבקשה הועברה בביטחה למוקד. מוקדן יטפל בה בסודיות מלאה." הפוסט לא מופיע בפיד.
```

**L43**

```
### זרימה 4: טיפול מוקדן בפנייה רגישה (שידוכים)
```

**L44**

```
**תיאור:** מוקדן מקבל פנייה, מוצא מתנדב ומבצע שידוך.
```

**L45**

```
* **מסך 1 – סביבת עבודת מוקדן (Operator Queue):** רואה תור פניות. לוחץ על פנייה ובוחר "קח בעלות".
```

**L46**

```
* **מסך 2 – תיק הפנייה (Case Detail):** פרטי המבקש, חיפוש מתנדב מתאים לפי אזור ותחום. לוחץ "הצע שידוך".
```

**L47**

```
* **מסך 3 – שיח שידוך ובירור התאמה (Match Engagement Chat):** המתנדב מקבל Push/הודעה מהמוקדן. נפתח חלון צ'אט ייעודי שבו המוקדן מציג את הצורך, מנהל שיח, מברר התאמה ומנסה לרתום את המתנדב. אין חשיפה של זהות המבקש בשלב זה.
```

**L48**

```
* **מסך 4 – עדכון והעשרת פרופיל (Profile Enrichment Update):** המוקדן מעדכן בתיק המשתמש של המתנדב פרטים חדשים שעלו בשיחה (למשל: "מעדיף סיוע לקשישים", "בעל רכב גדול לשינוע"). המשתמש מקבל התראה: "המוקדן הוסיף יכולות/תחומי עניין חדשים לפרופיל שלך בעקבות השיחה". למשתמש יש אפשרות לצפות בנתונים אלו ולערוך אותם בהגדרות.
```

**L49**

```
* **מסך 5 – צ'אט שידוך (Private Match Chat):** הסכמה הדדית (בלחיצה על כפתור אישור בתוך הצ'אט) ← חשיפת שמות ← מעבר לתיאום ישיר.
```

**L50**

```
* **מסך 6 – סגירת תיק (Case Closure):** המוקדן מסכם את הטיפול, מסמן סטטוס ורושם הערות. התיק נסגר ומתועד.
```

**L54**

```
### זרימה 5: מסירת חפץ עם שינוע
```

**L55**

```
**תיאור:** מסירת ספה גדולה עם תיאום שינוע אוטומטי.
```

**L56**

```
* **מסך 1 – מסירת חפץ (Item Publish):** העלאת תמונה, תיאור, בחירת "דורש אישור מוסר".
```

**L57**

```
* **מסך 2 – רשימת מעוניינים (Reservation Requests):** משתמשים מבקשים את החפץ. המוסר מאשר אחד.
```

**L58**

```
* **מסך 3 – הקפצת שינוע (Transport Prompt):** "מעולה! התיאום בוצע. ליצור בקשת שינוע?" כפתור "כן" / "אתאם בעצמי".
```

**L59**

```
* **מסך 4 – טופס שינוע מקוצר (Transport Form):** גודל חפץ, כתובת יעד. נשלח אוטומטית לפיד נסיעות עם כל המידע הרלוונטי למתנדב.
```

**L63**

```
### זרימה 6: פרסום נסיעה שיתופית
```

**L64**

```
**תיאור:** נהג מציע טרמפ עם השתתפות בהוצאות.
```

**L65**

```
* **מסך 1 – פיד נסיעות (Rides Feed):** לוחץ "הצע נסיעה".
```

**L66**

```
* **מסך 2 – הגדרת נסיעה (Publish Ride):** מוצא, יעד (מפה), שעה, מושבים פנויים.
```

**L67**

```
* **מסך 3 – אופציות שינוע ותשלום (Options Modal):** סימון "מוכן לשנע חפצים". בחירה: חינם / השתתפות בהוצאות + סכום.
```

**L68**

```
* **מסך 4 – לוח בקרת נסיעה (Ride Dashboard):** נסיעה מתוכננת, אישור/דחיית נוסעים וחפצים, מפה מסכמת.
```

**L72**

```
### זרימה 7: הצטרפות לנסיעה כנוסע
```

**L73**

```
**תיאור:** משתמש מחפש טרמפ ומצטרף לנסיעה קיימת.
```

**L74**

```
* **מסך 1 – פיד נסיעות:** סינון לפי מוצא, יעד ותאריך.
```

**L75**

```
* **מסך 2 – פרטי נסיעה (Ride Detail):** פרטי הנהג, מסלול, עלות, מושבים פנויים. כפתור "בקש להצטרף".
```

**L76**

```
* **מסך 3 – אישור בקשה (Request Confirmation):** "הבקשה נשלחה לנהג. תקבל התראה כשיאשר."
```

**L77**

```
* **מסך 4 – התראת אישור (Ride Approval Notification):** Push: "הנהג אישר את ההצטרפות!" מעבר ללוח בקרת הנסיעה.
```

**L81**

```
### זרימה 8: השתתפות באתגר קהילתי-שיתופי
```

**L82**

```
**תיאור:** הצטרפות לאתגר "מועדון 5 בבוקר".
```

**L83**

```
* **מסך 1 – לובי אתגרים (Challenges Lobby):** גלילה וצפייה. לחיצה על "מועדון 5 בבוקר".
```

**L84**

```
* **מסך 2 – פרטי אתגר (Challenge Details):** תיאור, 1,200 משתתפים, כפתור "הצטרף לאתגר".
```

**L85**

```
* **מסך 3 – צ'אט ודיווח יומי (Challenge Hub):** למחרת בבוקר – Push "קמת?". דיווח מהיר (Check-in) + צ'אט קבוצתי. אנימציית עידוד.
```

**L86**

```
* **מסך 4 – לוח הישגים (Leaderboard):** רצפים, דירוגים, השוואה לחברי הקבוצה.
```

**L90**

```
### זרימה 9: יצירת אתגר חדש
```

**L91**

```
**תיאור:** משתמש מאומת יוצר אתגר קהילתי חדש.
```

**L92**

```
* **מסך 1 – לובי אתגרים:** לוחץ "צור אתגר חדש".
```

**L93**

```
* **מסך 2 – טופס יצירת אתגר (Create Challenge):** שם, תיאור, משך, יעד, קטגוריה, ציבורי/פרטי.
```

**L94**

```
* **מסך 3 – תצוגה מקדימה (Preview):** כך ייראה האתגר למשתתפים. כפתור "פרסם".
```

**L95**

```
* **מסך 4 – אישור פרסום:** "האתגר פורסם!" עם אפשרות שיתוף.
```

**L99**

```
### זרימה 10: גילוי אנשים ועקיבה
```

**L100**

```
**תיאור:** משתמש מחפש חברים חדשים בקהילה.
```

**L101**

```
* **מסך 1 – גילוי אנשים (Discover People):** רשימת משתמשים מומלצים (לפי אזור, תחומי עניין, פעילות).
```

**L102**

```
* **מסך 2 – פרופיל משתמש (User Profile):** כרטיס ביקור, סטטיסטיקות, היסטוריית פעילות. כפתור "עקוב".
```

**L103**

```
* **מסך 3 – רשימת עוקבים/נעקבים (Followers):** צפייה ברשת הקשרים עם אפשרות מעבר לפרופילים.
```

**L107**

```
### זרימה 11: תרומה כספית ישירה לעמותה
```

**L108**

```
**תיאור:** משתמש נכנס לפרופיל עמותה ותורם.
```

**L109**

```
* **מסך 1 – פרופיל עמותה (NGO Profile):** צפייה במידע, מדדי עשייה. כפתור בולט "תרום".
```

**L110**

```
* **מסך 2 – טופס תרומה (Donation Form):** בחירת סכום (מוגדרים מראש + הזנה חופשית), שם התורם (אפשרות לאנונימי), הקדשה אישית.
```

**L111**

```
* **מסך 3 – אישור ותשלום (Payment Confirmation):** סיכום ואישור.
```

**L112**

```
* **מסך 4 – תודה ואישור (Thank You):** הודעת תודה, קבלה דיגיטלית, הצעה לשתף את התרומה בפיד.
```

**L116**

```
### זרימה 12: הצטרפות כמתנדב לארגון
```

**L117**

```
**תיאור:** משתמש רוצה להתנדב רשמית בעמותה.
```

**L118**

```
* **מסך 1 – פרופיל עמותה:** כפתור "התנדב".
```

**L119**

```
* **מסך 2 – טופס הצטרפות (Volunteer Application):** פרטים, זמינות, תחומי עניין, ניסיון קודם.
```

**L120**

```
* **מסך 3 – אישור שליחה:** "הבקשה נשלחה לאישור הארגון. נעדכן אותך."
```

**L121**

```
* **מסך 4 – אישור מנהל ארגון (Org Side):** מנהל הארגון רואה בלוח הבקרה בקשה חדשה ומאשר/דוחה.
```

**L122**

```
* **מסך 5 – התראת אישור (למתנדב):** "התקבלת כמתנדב בעמותת X!" שינוי סטטוס אוטומטי בפרופיל.
```

**L126**

```
### זרימה 13: Onboarding ארגון חדש
```

**L127**

```
**תיאור:** עמותה חדשה מבקשת להצטרף לפלטפורמה.
```

**L128**

```
* **מסך 1 – דף נחיתה / הגדרות:** קישור "הצטרף כארגון".
```

**L129**

```
* **מסך 2 – טופס הצטרפות ארגון (Org Onboarding):** שם הארגון, מספר עמותה, תיאור, תחומי פעילות, פרטי קשר, מסמכים נלווים.
```

**L130**

```
* **מסך 3 – המתנה לאישור:** "הבקשה הועברה לאישור הנהלת הפלטפורמה."
```

**L131**

```
* **מסך 4 – אישור/דחייה (Admin Side):** מנהל מערכת בוחן את הבקשה במסך AdminOrgApprovals ומאשר/דוחה.
```

**L132**

```
* **מסך 5 – אישור ופתיחת לוח בקרה:** "הארגון אושר!" → גישה ללוח בקרה ארגוני + עמוד עמותה ציבורי.
```

**L136**

```
### זרימה 14: תרומת ידע – העלאת קורס
```

**L137**

```
**תיאור:** משתמש מומחה מעלה קורס דיגיטלי חינמי.
```

**L138**

```
* **מסך 1 – קטגוריית ידע (Knowledge Screen):** לוחץ "תרום ידע".
```

**L139**

```
* **מסך 2 – בחירת סוג (Knowledge Type):** קורס / שיעור פרטי / טקסט-כתבה / סרטון.
```

**L140**

```
* **מסך 3 – טופס קורס (Course Builder):** כותרת, תיאור, שיעורים (רשימת פרקים), העלאת חומרים.
```

**L141**

```
* **מסך 4 – שליחה לאישור:** "הקורס נשלח לאישור הנהלת הארגון."
```

**L142**

```
* **מסך 5 – אישור/דחייה:** מנהל מעיין בתוכן ומאשר. הקורס מופיע בקטגוריית הידע.
```

**L146**

```
### זרימה 15: שיחת צ'אט חדשה
```

**L147**

```
**תיאור:** משתמש יוזם שיחה פרטית עם משתמש אחר.
```

**L148**

```
* **מסך 1 – פרופיל משתמש / רשימת צ'אטים:** לוחץ "שלח הודעה".
```

**L149**

```
* **מסך 2 – יצירת שיחה (New Chat):** בחירת/אימות נמען.
```

**L150**

```
* **מסך 3 – מרחב הצ'אט (Chat Detail):** כתיבת הודעה ראשונה ושליחה.
```

**L154**

```
### זרימה 16: דיווח על תוכן פוגעני
```

**L155**

```
**תיאור:** משתמש רואה פוסט בעייתי ומדווח.
```

**L156**

```
* **מסך 1 – פוסט בפיד:** לוחץ על תפריט נקודות (⋮) → "דווח".
```

**L157**

```
* **מסך 2 – פופ-אפ דיווח (Report Modal):** בחירת סיבה (ספאם, תוכן פוגעני, הטעיה, אחר) + שדה הערות.
```

**L158**

```
* **מסך 3 – אישור דיווח:** "הדיווח התקבל ויטופל בהקדם." הפוסט מוסתר מהמדווח.
```

**L159**

```
* **צד מנהל (Admin Review):** הדיווח מגיע למסך AdminReview לבחינה ופעולה.
```

**L163**

```
### זרימה 17: ניהול משימות ארגוניות (Admin)
```

**L164**

```
**תיאור:** מנהל ארגון יוצר ומנהל משימה.
```

**L165**

```
* **מסך 1 – לוח בקרה ארגוני (Org Dashboard):** כפתור "צור משימה חדשה".
```

**L166**

```
* **מסך 2 – יצירת משימה (Task Form):** כותרת, תיאור, תאריך יעד, שיוך לצוות/אדם, עדיפות, תתי-משימות.
```

**L167**

```
* **מסך 3 – רשימת משימות (Tasks List):** צפייה בכל המשימות, סינון לפי סטטוס/אדם, עדכון התקדמות.
```

**L168**

```
* **מסך 4 – דיווח שעות (Time Tracking):** מתנדב/עובד מדווח שעות על המשימה.
```

**L172**

```
### זרימה 18: שימוש בעוזר AI
```

**L173**

```
**תיאור:** משתמש משתמש בעוזר AI כדי למצוא התנדבות מתאימה.
```

**L174**

```
* **מסך 1 – חיפוש + AI (Search Screen):** לוחץ על אייקון העוזר.
```

**L175**

```
* **מסך 2 – שיחה עם AI:** "אני מחפש התנדבות באזור תל אביב בתחום החינוך". AI מציג תוצאות מותאמות.
```

**L176**

```
* **מסך 3 – לחיצה על תוצאה:** מעבר ישיר לפרופיל עמותה / פוסט רלוונטי.
```

**L180**

```
### זרימה 19: התאמת עיצוב אישי של האפליקציה
```

**L181**

```
**תיאור:** משתמש משנה את מראה האפליקציה שלו.
```

**L182**

```
* **מסך 1 – הגדרות / פרופיל:** לוחץ "התאם עיצוב".
```

**L183**

```
* **מסך 2 – חלון UI Customization:** סקלת צבעים, תצוגות, ספריית עיצובים של משתמשים אחרים.
```

**L184**

```
* **מסך 3 – תצוגה מקדימה:** כך תיראה האפליקציה. "אישור" / "חזרה לברירת מחדל".
```

**L188**

```
### זרימה 20: הסתרת תוכן וניהול מסננים
```

**L189**

```
**תיאור:** משתמש רוצה להסתיר סוג מסוים של פוסטים מהפיד שלו.
```

**L190**

```
* **מסך 1 – פוסט בפיד:** תפריט (⋮) → "הסתר".
```

**L191**

```
* **מסך 2 – פופ-אפ הסתרה (Hide Options Modal):** "הסתר פעם אחת" / "הסתר תמיד פוסטים מסוג זה". האלגוריתם מציע חסימה לפי קטגוריה או סטטוס.
```

**L192**

```
* **מסך 3 – ניהול מסננים (Settings > Filters):** צפייה בכל המסננים הקבועים, עריכה ומחיקה.
```

**L196**

```
## 🌍 זרימות עולמות התרומה (F-Series)
```

**L198**

```
> זרימות אלו ייעודיות לעולמות התרומה החדשים שתועדו ב-[`./donation_worlds/`](./donation_worlds/). הן משלימות את זרימות 1‑20.
```

**L202**

```
### זרימה F1: תרומה כספית חד-פעמית עם דפדוף ובחירה (עולם הכסף)
```

**L203**

```
**עולם:** [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md) | **מצב:** לתת | **פרסונה:** חבר קהילה
```

**L205**

```
* **מסך 1 – Money Screen (Hub):** המשתמש לוחץ על לשונית "תרומות" (Bottom Tab) או על "כסף" בתפריט עולמות. המסך פותח את **מצב לתת** (ברירת מחדל).
```

**L206**

```
* **מסך 2 – NGO Browse:** רשימה / כרטיסים / מפה של עמותות. בחירה במנוע סינון: תחום פעילות = "רפואה", אזור = "תל אביב והמרכז", מדד שקיפות = "גבוה".
```

**L207**

```
* **מסך 3 – NGO Profile:** המשתמש לוחץ על עמותה. רואה תיאור, מדדי עשייה, כפתור "תרום" בולט.
```

**L208**

```
* **מסך 4 – Donation Form Modal:** בחירת סכום (₪36), כינוי = "אנונימי", הקדשה = "לעילוי נשמת אבא".
```

**L209**

```
* **מסך 5 – Payment:** סליקה דרך ספק תשלום מאומת (PCI-DSS).
```

**L210**

```
* **מסך 6 – Thank You:** קבלה דיגיטלית, הצעת שיתוף בפיד, הצעה ל"הוראת קבע".
```

**L214**

```
### זרימה F2: הקמת הוראת קבע (עולם הכסף)
```

**L215**

```
**עולם:** [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md) | **מצב:** לתת
```

**L217**

```
* **מסך 1 – NGO Profile:** לחיצה על "הוראת קבע".
```

**L218**

```
* **מסך 2 – Recurring Setup Modal:** בחירת תדירות (חודשית), סכום (₪50), תאריך התחלה (5 לחודש), תאריך סיום ("ללא הגבלה").
```

**L219**

```
* **מסך 3 – Confirm:** סיכום + אישור.
```

**L220**

```
* **מסך 4 – Recurring Donations Manager:** ההוראה מופיעה ברשימת ההוראות הפעילות.
```

**L221**

```
* **התראות עתידיות:** 24h לפני כל חיוב, אישור לאחר חיוב.
```

**L225**

```
### זרימה F3: תרומה לקמפיין מימון ספציפי (עולם הכסף)
```

**L226**

```
**עולם:** [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md) | **מצב:** לתת
```

**L228**

```
* **מסך 1 – Money Screen:** טאב "קמפיינים פעילים".
```

**L229**

```
* **מסך 2 – Campaign Browse:** רשימת קמפיינים. בחירת "ציוד רפואי לבית חולים בעטרת".
```

**L230**

```
* **מסך 3 – Campaign Detail:** סיפור, יעד ₪200,000, נאסף ₪73,500, 187 תורמים. סרגל התקדמות.
```

**L231**

```
* **מסך 4 – Donate Modal:** סכום, אופציה לשתף.
```

**L232**

```
* **מסך 5 – אישור + עדכון התקדמות בזמן אמת.**
```

**L233**

```
* **התראות עתידיות:** עדכוני התקדמות, סגירת קמפיין.
```

**L237**

```
### זרימה F4: יצירת קרן אישית/ציבורית (Donor-Advised Fund)
```

**L238**

```
**עולם:** [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md) | **מצב:** לתת
```

**L240**

```
* **מסך 1 – Money Screen:** טאב "הקרן שלי".
```

**L241**

```
* **מסך 2 – Fund Setup Wizard:** שם הקרן ("הקרן של משפחת כהן"), פרטית/ציבורית, סכום הפקדה ראשוני (₪5,000), תקנון אוטומטי (אופציונלי).
```

**L242**

```
* **מסך 3 – הפקדה:** סליקה.
```

**L243**

```
* **מסך 4 – Fund Dashboard:** יתרה, פעולות עתידיות, עמותות מומלצות.
```

**L244**

```
* **קרן ציבורית בלבד:** הקרן מופיעה בפיד הקהילה. אחרים יכולים להצטרף ולהוסיף.
```

**L248**

```
### זרימה F5: פתיחת בקשת סיוע אישי (עולם הכסף, מצב לקבל)
```

**L249**

```
**עולם:** [`donation_worlds/01_Money.md`](./donation_worlds/01_Money.md) | **מצב:** לקבל | **פרסונה:** חבר קהילה במצוקה
```

**L251**

```
* **מסך 1 – Money Screen:** טוגל ל"לקבל".
```

**L252**

```
* **מסך 2 – Personal Aid Request Form:** סוג מצוקה (חוב), סכום משוער (₪3,500), תיאור, פרטי משפחה. **רמת אנונימיות = רמה 1 (מוקדנים בלבד)** – ברירת מחדל.
```

**L253**

```
* **מסך 3 – אישור תקנון + שליחה.**
```

**L254**

```
* **מסך 4 – Confirmation Screen:** "הבקשה הועברה למוקד הסיוע. מוקדן יטפל בדיסקרטיות מלאה."
```

**L255**

```
* **תהליך פנימי:** הבקשה זורמת לתור מוקדנים (3.4). מוקדן לוקח בעלות, מתאים לעמותת סיוע (לדוגמה: פעמונים), פותח שיח, מקבל הסכמה הדדית.
```

**L256**

```
* **מסך 5 (לאחר שעות-ימים) – Status Update:** "נמצא ארגון! פעמונים יצרו איתך קשר תוך 48 שעות."
```

**L260**

```
### זרימה F6: פרסום מזון מהיר עם תאריך תפוגה (עולם המזון)
```

**L261**

```
**עולם:** [`donation_worlds/03_Food.md`](./donation_worlds/03_Food.md) | **מצב:** לתת | **פרסונה:** חבר קהילה / בעל עסק
```

**L263**

```
* **מסך 1 – Food Screen / כפתור "+":** "פרסם מזון מהיר".
```

**L264**

```
* **מסך 2 – Food Publish Form:** סוג = "מבושל", כמות = "5 מנות", **תאריך תפוגה = +24h (אוטומטי לפי סוג)**, אלרגנים = "ללא רכיבי אלרגיה נפוצים", כשרות = "כשר".
```

**L265**

```
* **מסך 3 – אזהרת בטיחות (חובה לאשר):** "אסור לפרסם מזון מקולקל..."
```

**L266**

```
* **מסך 4 – פרסום ← פוסט מופיע במסך מזון + פיד.**
```

**L267**

```
* **התראה אוטומטית:** 6h לפני התפוגה – פוסט מקבל סטטוס "דחוף" + Push למבקשי מזון פעילים בקרבת מקום.
```

**L271**

```
### זרימה F7: בקשת מזון ארגונית עם שילוב נסיעה (עולם המזון + נסיעות)
```

**L272**

```
**עולם:** [`donation_worlds/03_Food.md`](./donation_worlds/03_Food.md) + [`donation_worlds/06_Rides.md`](./donation_worlds/06_Rides.md) | **מצב:** לקבל ארגוני
```

**L274**

```
* **מסך 1 – Food Screen (Receive Mode):** ארגון "פתחון לב" פותח בקשת איסוף 50 ארוחות מאירוע אתמול בערב, יעד עד 12:00 היום.
```

**L275**

```
* **מסך 2 – Auto-Linked Ride Request:** המערכת מציעה אוטומטית פתיחת בקשת שינוע דחוף.
```

**L276**

```
* **מסך 3 – Ride Offer Form:** מוצא = כתובת המוסר, יעד = פתחון לב, זמן = "עכשיו עד 12:00", סוג שינוע = "מזון רגיש".
```

**L277**

```
* **מסך 4 – Push לנהגים פעילים באזור:** "שינוע דחוף, 50 ארוחות, 30 ק"מ".
```

**L278**

```
* **מסך 5 – נהג מאשר → תיאום בצ'אט.**
```

**L282**

```
### זרימה F8: תיאום תור תרומת דם (עולם הרפואה)
```

**L283**

```
**עולם:** [`donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md) | **מצב:** לתת | **דרישה:** וי כחול
```

**L285**

```
* **מסך 1 – Medical Screen:** "תרומת דם".
```

**L286**

```
* **מסך 2 – Blood Donation Appointment Screen:** מפת תחנות מד"א + יחידות ניידות באזור.
```

**L287**

```
* **מסך 3 – בחירת תחנה + תאריך + שעה (סנכרון API מד"א).**
```

**L288**

```
* **מסך 4 – Health Declaration Form:** טופס בריאות לפני תרומה.
```

**L289**

```
* **מסך 5 – Confirmation + הוספה ליומן.**
```

**L290**

```
* **התראות:** 24h לפני, 1h לפני.
```

**L294**

```
### זרימה F9: מילוי טופס אדי (עולם הרפואה)
```

**L295**

```
**עולם:** [`donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md) | **מצב:** לתת | **דרישה:** וי כחול
```

**L297**

```
* **מסך 1 – Medical Screen:** "תרומת אברים – אדי".
```

**L298**

```
* **מסך 2 – Legal Explanation:** הסבר משפטי-רפואי על משמעות הרישום. אישור הבנה.
```

**L299**

```
* **מסך 3 – ADI Form:** בחירת אברים (כל / בחירה ספציפית), פרטים אישיים, חתימה דיגיטלית.
```

**L300**

```
* **מסך 4 – Submission לאדי המאגר הלאומי (API).**
```

**L301**

```
* **מסך 5 – Donor Card (Wallet):** כרטיס תורם דיגיטלי בארנק האפליקציה.
```

**L302**

```
* **התראה עתידית:** תזכורת לחידוש כל 3 שנים.
```

**L306**

```
### זרימה F10: קריאת חירום לתרומת דם (עולם הרפואה)
```

**L307**

```
**עולם:** [`donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md) | **מצב:** לקבל | **טריגר:** אירוע חירום
```

**L309**

```
* **טריגר:** מד"א מפרסם דרך ה-API של גופי רפואה: "דרושות תרומות דם O- בבית חולים שיבא, דחוף".
```

**L310**

```
* **מסך 1 – Push למשתמשים מתאימים:** רק לתורמי דם רשומים בעלי **סוג דם O-** + **בקרבת בית חולים שיבא (≤ 30 ק"מ)** + **לא תרמו ב-90 ימים האחרונים**.
```

**L311**

```
* **מסך 2 – Emergency Blood Call Screen:** פרטי הקריאה, כמה תורמים נדרשים, כמה כבר אישרו.
```

**L312**

```
* **מסך 3 – לחיצה "אני יכול!":** המערכת רושמת אישור, מתאמת תור מהיר, שולחת ניווט.
```

**L313**

```
* **התראה:** "שמרת חיים! מד"א מודה לך."
```

**L317**

```
### זרימה F11: הצעת חלון אירוח קבוע (עולם הדיור)
```

**L318**

```
**עולם:** [`donation_worlds/05_Housing.md`](./donation_worlds/05_Housing.md) | **מצב:** לתת | **דרישה:** וי כחול
```

**L320**

```
* **מסך 1 – Housing Screen:** "הצע אירוח".
```

**L321**

```
* **מסך 2 – Hosting Code of Conduct:** אישור קוד התנהגות (חובה לפעם הראשונה).
```

**L322**

```
* **מסך 3 – Hosting Offer Form:** סוג = "חדר במשפחה", קיבולת = 2, חלון זמן = "לילות שלישי קבוע", תקופה = "חצי שנה", כללי בית, מתקנים, מפה (גוסום אזור).
```

**L323**

```
* **מסך 4 – תמונות (חובה 2+).**
```

**L324**

```
* **מסך 5 – פרסום ← הופעה בעולם הדיור + פיד.**
```

**L328**

```
### זרימה F12: בקשת אירוח שביליסט (עולם הדיור)
```

**L329**

```
**עולם:** [`donation_worlds/05_Housing.md`](./donation_worlds/05_Housing.md) | **מצב:** לקבל | **תרחיש:** שביליסט
```

**L331**

```
* **מסך 1 – Housing Screen (Receive Mode):** פילטר "שביליסט".
```

**L332**

```
* **מסך 2 – Map View:** מפת מארחים פעילים במסלול שביל ישראל. בחירת מארח בסביבת קיבוץ קליה.
```

**L333**

```
* **מסך 3 – Stay Request Form:** תאריך = "16/06", מסלול = "שביל ישראל", ציוד = "אוהל אישי + שק שינה".
```

**L334**

```
* **מסך 4 – שליחת בקשה.**
```

**L335**

```
* **מסך 5 – המארח מקבל Push, אוקיי בצ'אט, מאשר.**
```

**L336**

```
* **מסך 6 – חשיפת מיקום מדויק לאורח לאחר אישור.**
```

**L337**

```
* **בסיום אירוח:** ביקורת הדדית.
```

**L341**

```
### זרימה F13: דיווח חיה אבודה / חיפוש בית (עולם בעלי החיים)
```

**L342**

```
**עולם:** [`donation_worlds/09_Animals.md`](./donation_worlds/09_Animals.md)
```

**L344**

```
* **מסך 1 – Animals Screen:** "מצאתי כלב".
```

**L345**

```
* **מסך 2 – טופס:** תמונות, סוג, מצב, מקום מציאה, קישור פרטי קשר.
```

**L346**

```
* **מסך 3 – פרסום בפיד + מסך אבדה ומציאה ייעודי.**
```

**L350**

```
### זרימה F14: מסירת ייחורים בקהילה (עולם הסביבה)
```

**L351**

```
**עולם:** [`donation_worlds/10_Environment.md`](./donation_worlds/10_Environment.md)
```

**L353**

```
* **מסך 1 – Environment Screen:** "תרומת צמחים".
```

**L354**

```
* **מסך 2 – טופס:** סוג = "ייחורי בזיליקום", כמות = 20, מצב = "בריא".
```

**L355**

```
* **מסך 3 – פרסום ← מבקשי ייחורים פעילים מקבלים Push.**
```

**L359**

```
### זרימה F15: העלאת מתכון (עולם היצירה)
```

**L360**

```
**עולם:** [`donation_worlds/11_Creative.md`](./donation_worlds/11_Creative.md)
```

**L362**

```
* **מסך 1 – Creative Screen → לשונית "מתכונים".**
```

**L363**

```
* **מסך 2 – Recipe Form:** שם, רכיבים, הוראות, תמונה, אלרגנים.
```

**L364**

```
* **מסך 3 – פרסום (אישור מנהלת ארגון).**
```

**L368**

```
### זרימה F16: רישום כשדכן רומנטי (עולם השידוכים הרומנטיים)
```

**L369**

```
**עולם:** [`donation_worlds/12_Matchmaking_Romantic.md`](./donation_worlds/12_Matchmaking_Romantic.md) | **דרישה:** וי כחול + 18+
```

**L371**

```
* **מסך 1 – Matchmaking Screen:** "אני רוצה להיות שדכן/ית".
```

**L372**

```
* **מסך 2 – Matchmaker Profile Setup:** ניסיון, סגנון עבודה, אזורי התמחות.
```

**L373**

```
* **מסך 3 – תקופת ניסיון (5 שידוכים תחת ליווי).**
```

**L374**

```
* **מסך 4 – אישור פרופיל פעיל.**
```

**L377**

```
*הפרק הבא: [5. מיפוי מסכים ותצוגות מקיף](./05_Screen_UI_Mapping.md)*
```

**L378**

```
*חזרה ל[אינדקס ראשי](./00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/05_Screen_UI_Mapping.md`

**L3**

```
## 📱 5. מיפוי מסכים ותצוגות מקיף (Screen & UI Mapping)
```

**L5**

```
### 5.1 תוכן עניינים: רשימת מסכים מלאה
```

**L7**

```
**1. כניסה, הרשמה ו-Onboarding**
```

**L8**

```
* 1.1 דף נחיתה (Landing Page)
```

**L9**

```
* 1.2 מסך התחברות/הרשמה (Auth Screen)
```

**L10**

```
* 1.3 מסך פרטים בסיסיים (Basic Info Screen)
```

**L11**

```
* 1.4 מסך בחירת תחומי עניין (Interests Selection Screen)
```

**L12**

```
* 1.5 מסך אימות תעודת זהות (ID Verification Screen)
```

**L13**

```
* 1.6 מסך ברוכים הבאים (Welcome Tour Screen)
```

**L14**

```
* 1.7 פופ-אפ חסימת אורח (Guest Block Modal)
```

**L16**

```
**2. פרופיל אישי וניהולו**
```

**L17**

```
* 2.1 מסך הפרופיל שלי (My Profile Screen)
```

**L18**

```
* 2.2 מסך עריכת פרופיל (Edit Profile Screen)
```

**L19**

```
* 2.3 מסך פרופיל משתמש אחר (User Profile Screen)
```

**L20**

```
* 2.4 מסך עוקבים/נעקבים (Followers Screen)
```

**L21**

```
* 2.5 מסך גילוי אנשים (Discover People Screen)
```

**L22**

```
* 2.6 חלון התאמה אישית של האפליקציה (UI Customization Modal)
```

**L24**

```
**3. הפיד הראשי וניווט**
```

**L25**

```
* 3.1 הפיד הראשי (Main Feed / Home Screen)
```

**L26**

```
* 3.2 מסך חיפוש ועוזר AI (Search & AI Screen)
```

**L27**

```
* 3.3 מסך סטטיסטיקות עומק (Drill-Down Analytics Screen)
```

**L28**

```
* 3.4 מסך סטטיסטיקות קהילתיות (Community Stats Screen)
```

**L29**

```
* 3.5 חלונית בקשות פתוחות ומסננים (Open Requests & Filters Modal)
```

**L30**

```
* 3.6 מסך פרטי פוסט (Post Detail Screen)
```

**L31**

```
* 3.7 מסך מועדפים/סימניות (Bookmarks Screen)
```

**L33**

```
**4. יצירת תוכן**
```

**L34**

```
* 4.1 מסך יצירת פוסט/בקשה (Create Post Composer Modal)
```

**L35**

```
* 4.2 חלונית בחירת רמת פרטיות (Privacy Selection Modal)
```

**L36**

```
* 4.3 מסך מסירת חפץ (Item Publish Screen)
```

**L37**

```
* 4.4 חלונית פרטי חפץ (Item Details Modal)
```

**L38**

```
* 4.5 חלונית הקפצת שינוע (Transport Prompt Modal)
```

**L39**

```
* 4.6 פופ-אפ דיווח על תוכן (Report Modal)
```

**L40**

```
* 4.7 פופ-אפ הסתרת פוסט (Hide Options Modal)
```

**L42**

```
**5. עולמות תרומה (Donation Worlds Screens)**
```

**L43**

```
> כל עולם תרומה הוא **שילוב מסכים** – Hub ראשי + תת-מסכים ל-Give/Receive + מסכי פעולה. ראה הפניות לפירוט עומק בתיקייה [`./donation_worlds/`](./donation_worlds/).
```

**L45**

```
* 5.1 מסך ראשי של עולמות התרומה (Donation Worlds Hub)
```

**L46**

```
* 5.2 מסך קטגוריה ספציפי (Category Screen)
```

**L47**

```
* **5.3 עולם הידע (Knowledge World)** – ראה גם [`./donation_worlds/07_Knowledge.md`](./donation_worlds/07_Knowledge.md)
```

**L54**

```
* **5.4 עולם החפצים (Items World)** – ראה גם [`./donation_worlds/02_Items.md`](./donation_worlds/02_Items.md)
```

**L55**

```
    * 5.4.1 Items Screen (Hub) – לשוניות לתת/לקבל
```

**L57**

```
    * 5.4.3 Items Listing – Receive Mode (בקשות)
```

**L58**

```
* **5.5 עולם הכסף (Money World)** – ראה גם [`./donation_worlds/01_Money.md`](./donation_worlds/01_Money.md)
```

**L59**

```
    * 5.5.1 Money Screen (Hub) – טוגל לתת/לקבל
```

**L60**

```
    * 5.5.2 NGO Browse / List (סינון מתקדם)
```

**L67**

```
    * 5.5.9 Personal Aid Request Form (Receive Mode – פרטי)
```

**L68**

```
    * 5.5.10 Campaign Creation Form (Receive Mode – ארגוני)
```

**L69**

```
* 5.6 עולם הזמן (Time World) – ראה גם [`./donation_worlds/08_Time.md`](./donation_worlds/08_Time.md)
```

**L70**

```
* 5.7 עולם השידוכים הרומנטיים (Matchmaking Romantic) – ראה גם [`./donation_worlds/12_Matchmaking_Romantic.md`](./donation_worlds/12_Matchmaking_Romantic.md)
```

**L71**

```
* **5.8 עולם המזון (Food World)** – ראה גם [`./donation_worlds/03_Food.md`](./donation_worlds/03_Food.md) **[חדש]**
```

**L72**

```
    * 5.8.1 Food Screen (Hub) – לתת/לקבל
```

**L73**

```
    * 5.8.2 Food Publish Form (עם **תאריך תפוגה חובה**)
```

**L75**

```
    * 5.8.4 Food Details Modal (עם אזהרות בטיחות)
```

**L76**

```
* **5.9 עולם הרפואה (Medical World)** – ראה גם [`./donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md) **[חדש]**
```

**L77**

```
    * 5.9.1 Medical Screen (Hub) – לתת/לקבל
```

**L79**

```
    * 5.9.3 ADI Form Screen (טופס תרומת אברים)
```

**L80**

```
    * 5.9.4 Living Donation Screen (5 מסלולים)
```

**L84**

```
* **5.10 עולם הדיור / האירוח (Housing World)** – ראה גם [`./donation_worlds/05_Housing.md`](./donation_worlds/05_Housing.md) **[חדש]**
```

**L85**

```
    * 5.10.1 Housing Screen (Hub) – לתת/לקבל
```

**L86**

```
    * 5.10.2 Housing Map View (מפת מארחים פעילים)
```

**L90**

```
    * 5.10.6 Hosting Dashboard (לוח בקרת מארח)
```

**L91**

```
    * 5.10.7 Hosting Code of Conduct (חובה לאשר)
```

**L92**

```
    * 5.10.8 Emergency Button (בצ'אט אירוח)
```

**L93**

```
* **5.11 עולמות נוספים (Other Worlds Screens)** – תקצירים
```

**L96**

```
    * 5.11.3 Creative Screen (3 לשוניות: מוזיקה, מתכונים, חידות)
```

**L99**

```
**6. נסיעות שיתופיות**
```

**L100**

```
* 6.1 פיד נסיעות (Rides / Trump Screen)
```

**L101**

```
* 6.2 מסך הגדרת נסיעה (Publish Ride Form)
```

**L102**

```
* 6.3 חלונית אופציות שינוע ותשלום (Options & Costs Modal)
```

**L103**

```
* 6.4 לוח בקרת נסיעה (Ride Dashboard)
```

**L104**

```
* 6.5 מסך פרטי נסיעה (Ride Detail Screen)
```

**L105**

```
* 6.6 טופס הצעת נסיעה (Ride Offer Form)
```

**L107**

```
**7. אתגרים ו-Gamification**
```

**L108**

```
* 7.1 לובי אתגרים (Challenges Lobby / Community Challenges Screen)
```

**L109**

```
* 7.2 מסך פרטי אתגר (Challenge Details Screen)
```

**L110**

```
* 7.3 מסך סטטיסטיקות אתגר (Challenge Statistics Screen)
```

**L111**

```
* 7.4 מסך האתגרים שלי (My Challenges Screen)
```

**L112**

```
* 7.5 מסך אתגרים שיצרתי (My Created Challenges Screen)
```

**L113**

```
* 7.6 מסך צ'אט ודיווח יומי (Challenge Hub & Check-in)
```

**L114**

```
* 7.7 לוח הישגים ודירוגים (Leaderboard Screen)
```

**L115**

```
* 7.8 טופס יצירת אתגר (Create Challenge Form)
```

**L117**

```
**8. צ'אט ותקשורת**
```

**L118**

```
* 8.1 רשימת שיחות (Chat List Screen)
```

**L119**

```
* 8.2 מרחב שיחה (Chat Detail Screen)
```

**L120**

```
* 8.3 יצירת שיחה חדשה (New Chat Screen)
```

**L122**

```
**9. התראות**
```

**L123**

```
* 9.1 מסך התראות (Notifications Screen)
```

**L125**

```
**10. הגדרות ומערכת**
```

**L126**

```
* 10.1 מסך הגדרות (Settings Screen)
```

**L127**

```
* 10.2 מסך אודות (About Karma Community Screen)
```

**L128**

```
* 10.3 מסך WebView (לתוכן חיצוני)
```

**L130**

```
**11. עמותות וארגונים**
```

**L131**

```
* 11.1 פרופיל עמותה ציבורי (NGO Profile Screen)
```

**L132**

```
* 11.2 עריכת פרופיל עמותה (NGO Profile Edit Screen)
```

**L133**

```
* 11.3 לוח בקרה ארגוני (Org Dashboard Screen)
```

**L134**

```
* 11.4 טופס Onboarding ארגון (Org Onboarding Screen)
```

**L135**

```
* 11.5 טופס תרומה (Donation Form Modal)
```

**L136**

```
* 11.6 טופס הצטרפות כמתנדב (Volunteer Application Form)
```

**L138**

```
**12. מערך שידוכים (מוקדנים)**
```

**L139**

```
* 12.1 סביבת עבודת מוקדן (Operator Workspace & Queue)
```

**L140**

```
* 12.2 מסך ניהול תיק פנייה (Case Detail Screen)
```

**L141**

```
* 12.3 שיח שידוך ובירור התאמה (Match Engagement Chat)
```

**L142**

```
* 12.4 עדכון והעשרת פרופיל (Profile Enrichment Update)
```

**L143**

```
* 12.5 צ'אט שידוך פרטי (Private Match Chat)
```

**L145**

```
**13. ניהול מערכת (Admin)**
```

**L146**

```
* 13.1 לוח בקרה ראשי (Admin Dashboard Screen)
```

**L147**

```
* 13.2 ניהול אנשים (Admin People Screen)
```

**L148**

```
* 13.3 ניהול כספים (Admin Money Screen)
```

**L149**

```
* 13.4 ניהול משימות (Admin Tasks Screen)
```

**L150**

```
* 13.5 ניהול קבצים (Admin Files Screen)
```

**L151**

```
* 13.6 ניהול טבלאות דינמיות (Admin Tables Screen)
```

**L152**

```
* 13.7 תצוגת שורות טבלה (Admin Table Rows Screen)
```

**L153**

```
* 13.8 ניהול מנהלים (Admin Admins Screen)
```

**L154**

```
* 13.9 ניהול CRM (Admin CRM Screen)
```

**L155**

```
* 13.10 ניהול זמנים (Admin Time Management Screen)
```

**L156**

```
* 13.11 בחינת תכנים מדווחים (Admin Review Screen)
```

**L157**

```
* 13.12 אישור ארגונים חדשים (Admin Org Approvals Screen)
```

**L161**

```
### 5.2 פירוט מסכים לעומק
```

**L163**

```
#### קבוצה 1: כניסה, הרשמה ו-Onboarding
```

**L165**

```
**1.1 דף נחיתה (Landing Page)**
```

**L166**

```
* **תיאור:** העמוד הראשון שמשתמש חדש רואה. מציג את החזון, הערכים, יכולות הפלטפורמה ושותפים.
```

**L167**

```
* **רכיבים:** Hero Section עם כותרת וקריאה לפעולה, סקירת פיצ'רים, סטטיסטיקות קהילתיות, סקשן "איך זה עובד", שותפים, FAQ, טופס יצירת קשר, כפתורי הורדה/הרשמה.
```

**L168**

```
* **פעולות:** "הצטרף לקהילה" → Auth, "המשך כאורח" → Feed.
```

**L170**

```
**1.2 מסך התחברות/הרשמה (Auth Screen)**
```

**L171**

```
* **תיאור:** מסך כניסה מינימליסטי ומזמין.
```

**L172**

```
* **רכיבים:** כפתורי SSO (Google, Apple, Facebook), כניסה בטלפון (OTP), כניסה בדוא"ל, מעבר בין "כניסה" ל"הרשמה", "שכחתי סיסמה", "המשך כאורח".
```

**L174**

```
**1.3-1.5 מסכי Onboarding (Basic Info → Interests → ID Verification)**
```

**L175**

```
* **תיאור:** רצף מסכים מודרך שמופיע רק בכניסה ראשונה.
```

**L176**

```
* **רכיבים:** טופס פרטים, גריד קטגוריות, אזור העלאת ת"ז, סרגל התקדמות, "דלג" (עם התראה).
```

**L178**

```
**1.6 מסך ברוכים הבאים (Welcome Tour)**
```

**L179**

```
* **תיאור:** 3-4 שקפי הסבר אינטראקטיביים.
```

**L180**

```
* **רכיבים:** איורים, כותרות, הסברים קצרים, נקודות ניווט, "התחל".
```

**L182**

```
**1.7 פופ-אפ חסימת אורח (Guest Block Modal)**
```

**L183**

```
* **תיאור:** מוקפץ בכל ניסיון של אורח לבצע פעולה אקטיבית.
```

**L184**

```
* **רכיבים:** הודעה מזמינה, כפתור "הירשם עכשיו", "אחר כך".
```

**L188**

```
#### קבוצה 2: פרופיל אישי
```

**L190**

```
**2.1 מסך הפרופיל שלי (My Profile)**
```

**L191**

```
* **רכיבים:** תמונה, שם, וי כחול, ביוגרפיה, סטטיסטיקות (תרומות, שעות, רצפים), לשוניות (פתוחים, סגורים, מתויגים), שיוך לארגונים, עוקבים/נעקבים, תפריט (עריכה, שיתוף, הגדרות).
```

**L193**

```
**2.2 מסך עריכת פרופיל (Edit Profile)**
```

**L194**

```
* **רכיבים:** שינוי תמונה, שינוי שם/ביו/עיר, ניהול תחומי עניין, ניהול אימות, שינוי סיסמה.
```

**L196**

```
**2.3 מסך פרופיל משתמש אחר (User Profile)**
```

**L197**

```
* **רכיבים:** כמו My Profile אך עם כפתורי "עקוב" ו"שלח הודעה" במקום "עריכה".
```

**L199**

```
**2.4 מסך עוקבים/נעקבים (Followers)**
```

**L200**

```
* **רכיבים:** Toggle בין עוקבים לנעקבים, רשימה עם תמונה ושם, כפתור עקיבה/ביטול.
```

**L202**

```
**2.5 מסך גילוי אנשים (Discover People)**
```

**L203**

```
* **רכיבים:** רשימת המלצות (לפי אזור, תחומים, פעילות), חיפוש, כפתור עקיבה מהיר.
```

**L205**

```
**2.6 חלון UI Customization**
```

**L206**

```
* **רכיבים:** סקלת צבעים, תצוגות מועדפות, ספריית עיצובים, תצוגה מקדימה, "חזרה לברירת מחדל".
```

**L210**

```
#### קבוצה 3: פיד וניווט
```

**L212**

```
**3.1 הפיד הראשי (Home Screen)**
```

**L213**

```
* **רכיבים:** טוגל חברים/כולם, כפתור אפשרויות סינון/מיון מתקדמות, כפתור סטטיסטיקות, פוסטים (כרטיסים ברורים של בקשה/נתינה), כפתור "+" צף ליצירת פוסט.
```

**L215**

```
**3.2 מסך חיפוש + AI (Search Screen)**
```

**L216**

```
* **רכיבים:** שורת חיפוש, מסננים קטגוריאליים, ממשק צ'אט AI, תוצאות חיפוש, היסטוריית חיפושים.
```

**L218**

```
**3.3 סטטיסטיקות עומק (Drill-Down Analytics)**
```

**L219**

```
* **רכיבים:** גרפים אינטראקטיביים, מפות חום, פילוח לפי זמן/אזור/קטגוריה, השוואות.
```

**L221**

```
**3.4 סטטיסטיקות קהילתיות (Community Stats)**
```

**L222**

```
* **רכיבים:** נתוני קהילה אגרגטיביים, מגמות, הישגים קהילתיים.
```

**L224**

```
**3.5 בקשות פתוחות ומסננים (Open Requests Modal)**
```

**L225**

```
* **רכיבים:** רשימת מיני-פוסטים לפעולה מהירה, רכיב מסננים חכם, חסימת תוכן קבועה.
```

**L227**

```
**3.6 פרטי פוסט (Post Detail)**
```

**L228**

```
* **רכיבים:** תוכן מלא, תגובות, לייקים, שיתוף, סימניה, דיווח, פרטי יוצר הפוסט.
```

**L230**

```
**3.7 מועדפים (Bookmarks)**
```

**L231**

```
* **רכיבים:** רשימת פריטים שמורים, סינון לפי סוג, הסרה.
```

**L235**

```
#### קבוצה 4: יצירת תוכן (כללי)
```

**L236**

```
*(כפי שמפורט בזרימות המשתמש – כל מסך עם הרכיבים שתוארו)*
```

**L240**

```
#### קבוצה 5: עולמות תרומה – פירוט עומק
```

**L242**

```
> כל מסך מקושר למסמך עומק בתיקייה [`./donation_worlds/`](./donation_worlds/).
```

**L244**

```
##### 5.1 מסך ראשי של עולמות התרומה (Donation Worlds Hub)
```

**L245**

```
* **תיאור:** המסך הראשי שמופיע בלשונית "תרומות" ב-Bottom Tab. מציג גריד או רשימה ויזואלית של כלל העולמות עם איקון, שם, וסטטיסטיקה קומפקטית (מספר פוסטים פעילים).
```

**L246**

```
* **רכיבים:** גריד 13 עולמות, חיפוש, סינון מהיר ("העולמות הכי פעילים"), כפתור "+" קבוע.
```

**L247**

```
* **פעולות:** לחיצה על עולם → מעבר ל-Hub של אותו עולם (5.3‑5.11).
```

**L251**

```
##### 5.5 עולם הכסף (Money World)
```

**L252**

```
**מסמך עומק:** [`./donation_worlds/01_Money.md`](./donation_worlds/01_Money.md)
```

**L255**

```
* **תיאור:** המסך המרכזי של עולם הכסף. **טוגל בולט לתת/לקבל** בראש המסך. תפריט פעולות: "עמותות", "קמפיינים", "הקרן שלי", "תיק האימפקט שלי", "ההיסטוריה שלי".
```

**L256**

```
* **רכיבים (Give Mode):** באנר העמותה הבולטת השבוע, רשימה אופקית של קמפיינים פעילים, גריד עמותות פופולריות, כפתור "סינון מתקדם".
```

**L257**

```
* **רכיבים (Receive Mode):**
```

**L258**

```
    * אם המשתמש פרטי: כפתור "פתיחת בקשת סיוע אישי" + הסבר על דיסקרטיות.
```

**L259**

```
    * אם המשתמש מנהל ארגון / עובד עמותה: כפתור "פתיחת קמפיין מימון" + לוח קמפיינים ארגוניים פעילים.
```

**L260**

```
* **קישוריות:** [זרימה F1](./04_User_Flows.md), [זרימה F5](./04_User_Flows.md).
```

**L263**

```
* **רכיבים:** מנוע סינון מתקדם (תחום פעילות, אזור, מדד שקיפות, גודל, גיל), מיון (לפי פופולריות, חדישות, יעילות), תצוגת מפה, כרטיס עמותה (לוגו, תיאור קצר, מדדים, "וי כחול"), כפתור השוואה (עד 4 עמותות).
```

**L266**

```
* **רכיבים:** מסננים (קטגוריה, ארגון מארח, התקדמות), כרטיס קמפיין עם סרגל התקדמות + יעד, מיון (סוף קרוב, רחוק מהיעד, חדש).
```

**L269**

```
* **רכיבים:** סיפור הקמפיין, תמונה ראשית, סרגל התקדמות, רשימת תורמים (גלוי / אנונימי), כפתור "תרום", עדכוני סטטוס, צ'אט קמפיין (כל התורמים).
```

**L272**

```
* **רכיבים:** רשימת הוראות פעילות, סטטוס (פעיל / מושעה), פעולות (עצירה, הגדלה, הקטנה, שינוי תאריך, העברה לעמותה אחרת), היסטוריית חיובים.
```

**L275**

```
* **רכיבים:** יתרת הקרן, היסטוריית הפקדות וחלוקות, רשימת עמותות מועמדות לחלוקה עתידית, תקנון אוטומטי (אם הוגדר), טוגל פרטי/ציבורי, אם ציבורי – רשימת מצטרפים.
```

**L278**

```
* **רכיבים:** מסך ויזואלי – גרף עוגה לפי עמותה, רצועת זמן של תרומות, מדדי השפעה ("איתי 47 משתמשים תרמו ל-X על בסיס המלצתי"), כפתור "שתף תיק".
```

**L281**

```
* **רכיבים:** רשימה כרונולוגית, חיתוך לפי שנה / עמותה / קטגוריה, ייצוא PDF / Excel, הוצאת קבלת סעיף 46 לכל תרומה רלוונטית.
```

**L284**

```
* **רכיבים:** טופס מורחב – סוג מצוקה (רשימה), סכום משוער, תיאור חופשי, פרטי משפחה, **בורר רמת אנונימיות (ברירת מחדל = רמה 1)**, אישור תקנון, אזהרת דיסקרטיות.
```

**L285**

```
* **קישוריות:** [זרימה F5](./04_User_Flows.md). זורם למוקד ([3.4 ב-PRD](./03_Core_Features.md)).
```

**L288**

```
* **רכיבים:** טופס רב-שלבי – פרטי קמפיין, תמונה, יעד, תאריכים, חלוקה לתת-מטרות, אישור Org Admin, פרסום.
```

**L292**

```
##### 5.8 עולם המזון (Food World) **[חדש]**
```

**L293**

```
**מסמך עומק:** [`./donation_worlds/03_Food.md`](./donation_worlds/03_Food.md)
```

**L296**

```
* **תיאור:** Hub של עולם המזון עם **טוגל לתת/לקבל**.
```

**L297**

```
* **רכיבים (Give Mode):** רשימה ממוינת לפי **תפוגה דחופה** (פוסטים בעלי 6h או פחות מודגשים באדום), חיפוש לפי אזור / סוג מזון / כשרות, כרטיס מזון עם תמונה + תאריך תפוגה + תגית כשרות + רכיבי אלרגיה.
```

**L298**

```
* **רכיבים (Receive Mode):** בקשות מזון פעילות, כפתור "פתח בקשת מזון אישית" / "פתח בקשת איסוף ארגונית" (לפי תפקיד).
```

**L301**

```
* **רכיבים:** תמונה (חובה), כותרת, סוג מזון (radio), כמות, **🚨 תאריך תפוגה (חובה!)** עם ברירת מחדל אוטומטית לפי סוג, רכיב 5.8.3 (אלרגנים), כשרות, הגבלות תזונה, תנאי שמירה, כתובת + שעת איסוף, מנגנון מסירה, מקור (בית / עסק).
```

**L302**

```
* **אזהרת בטיחות חובה לאשר לפני פרסום.**
```

**L305**

```
* **רכיבים:** רשימת checkboxes עם אייקונים – גלוטן, חלב, אגוזים, סויה, ביצים, דגים, סולפיטים, "אין רכיבי אלרגיה נפוצים" (חובה לסמן לפחות אחד).
```

**L308**

```
* **רכיבים:** כל פרטי המזון, **כרזה דחופה אם <6h לתפוגה**, כפתורי "אני מעוניין/ת" / "פתח צ'אט עם המוסר" / "בקש שינוע מהיר".
```

**L312**

```
##### 5.9 עולם הרפואה (Medical World) **[חדש]**
```

**L313**

```
**מסמך עומק:** [`./donation_worlds/04_Medical.md`](./donation_worlds/04_Medical.md)
```

**L316**

```
* **תיאור:** Hub עם 4 כניסות מסלוליות גדולות: 🩸 תרומת דם, 🫀 תרומת אברים (אדי), 🩻 תרומה בחיים, 🩼 ציוד רפואי.
```

**L317**

```
* **רכיבים (Give Mode):** קלפים לכל מסלול, כרטיס "תרומת הדם הבאה שלי" אם תוכנן.
```

**L318**

```
* **רכיבים (Receive Mode):** קריאות חירום פעילות (אם יש), בקשות ליווי / ציוד.
```

**L321**

```
* **רכיבים:** מפת תחנות מד"א + יחידות ניידות (קישור API), בורר תאריך + שעה, טופס בריאות מקדים, אישור.
```

**L324**

```
* **רכיבים:** מסך הסבר משפטי-רפואי (חובה לקרוא ולאשר), בחירת אברים (כל / ספציפי), חתימה דיגיטלית מאומתת, אישור הגשה למאגר אדי.
```

**L327**

```
* **רכיבים:** 5 לשוניות: כיליה / מח עצם / פלזמה / חלב אם / שיער. כל לשונית עם הסבר, טופס הצהרת רצון, קישור לגוף הרשמי.
```

**L330**

```
* **רכיבים:** קטלוג ציוד רפואי שמיש, סינון לפי סוג / מצב, **חובת תיוג "תקין רפואית" / "מצריך בדיקה"**.
```

**L333**

```
* **תיאור:** מסך מיוחד שנפתח רק עבור משתמשים מתאימים (סוג דם תואם + אזור).
```

**L334**

```
* **רכיבים:** פרטי הקריאה, כמות תורמים נדרשת, כמה אישרו, כפתור גדול "אני יכול/ה!" → ניווט אוטומטי לתחנה.
```

**L337**

```
* **רכיבים:** כרטיס דיגיטלי עם סטטוסי תרומות פעילות (אדי / מח עצם / חלב אם), QR לאימות בבית חולים.
```

**L341**

```
##### 5.10 עולם הדיור / האירוח (Housing World) **[חדש]**
```

**L342**

```
**מסמך עומק:** [`./donation_worlds/05_Housing.md`](./donation_worlds/05_Housing.md)
```

**L345**

```
* **תיאור:** Hub עם טוגל לתת/לקבל + פילטר תרחיש (שביליסט / חסר בית / רגיל).
```

**L346**

```
* **רכיבים (Give Mode):** "ההצעות שלי", כפתור "+ הצע אירוח", רשימת בקשות אירוח שהתקבלו.
```

**L347**

```
* **רכיבים (Receive Mode):** מנוע חיפוש (מקום / תאריכים / קיבולת), Map Toggle, רשימת מארחים פעילים.
```

**L350**

```
* **רכיבים:** מפה אינטראקטיבית עם סיכוכי גוסום של מארחים פעילים, סינון לפי סוג מקום / תאריך / קיבולת. מיקום מדויק נחשף רק לאחר אישור.
```

**L353**

```
* **רכיבים:** פרטי המארח, תמונות הבית, כללי הבית, מתקנים, ביקורות אורחים קודמים, דירוג ממוצע, תג "מארח ותיק" (אם 5+ אירוחים מאומתים).
```

**L356**

```
* **רכיבים:** סוג מקום, קיבולת, חלון/חלונות זמן (חוזר / ספונטני / רציף), כללי בית, מתקנים, מפה, תמונות (חובה 2+).
```

**L359**

```
* **רכיבים:** תרחיש (שביליסט / חסר בית / רגיל), תאריכי הגעה ויציאה, מספר משתתפים, הסבר חופשי, רמת אנונימיות (ברירת מחדל לפי תרחיש).
```

**L362**

```
* **רכיבים:** בקשות נכנסות, צ'אטים פעילים, היסטוריית אירוחים, סטטיסטיקה, התראות.
```

**L365**

```
* **תיאור:** מסך הצהרה שיש לאשר לפני אירוח/אורחות ראשון.
```

**L366**

```
* **רכיבים:** סעיפי קוד (כיבוד הדדי, בטיחות, אחריות), אישור דיגיטלי.
```

**L369**

```
* **תיאור:** **קריטי לבטיחות**. כפתור גלוי בכל צ'אט אירוח פעיל.
```

**L370**

```
* **רכיבים:** לחיצה ארוכה (3 שניות) שולחת התראה לתמיכה + מיקום בזמן אמת + שלוחה לאיש קשר חירום שהוגדר.
```

**L374**

```
#### קבוצה 6-7: נסיעות ואתגרים
```

**L375**

```
*(כפי שמפורט בזרימות המשתמש; פירוט עומק לעולם הנסיעות ב-[`./donation_worlds/06_Rides.md`](./donation_worlds/06_Rides.md))*
```

**L379**

```
#### קבוצה 8: צ'אט
```

**L381**

```
**8.1 רשימת שיחות (Chat List)**
```

**L382**

```
* **רכיבים:** רשימת שיחות ממוינות לפי פעילות אחרונה, תמונה + שם + הודעה אחרונה + זמן, חיווי הודעות שלא נקראו, חיפוש שיחות.
```

**L384**

```
**8.2 מרחב שיחה (Chat Detail)**
```

**L385**

```
* **רכיבים:** בועות הודעות, שדה הקלדה, כפתורי מדיה (תמונה, קול, מיקום), חיוויי קריאה והקלדה, תגובות על הודעות.
```

**L387**

```
**8.3 יצירת שיחה חדשה (New Chat)**
```

**L388**

```
* **רכיבים:** חיפוש משתמשים, רשימת אנשי קשר אחרונים, בחירת נמען.
```

**L392**

```
#### קבוצה 9-10: התראות והגדרות
```

**L394**

```
**9.1 מסך התראות (Notifications)**
```

**L395**

```
* **רכיבים:** רשימת התראות עם אייקונים, חלוקה לקטגוריות, סימון נקרא, לחיצה → מעבר למסך רלוונטי.
```

**L397**

```
**10.1 הגדרות (Settings)**
```

**L398**

```
* **רכיבים:** פרופיל, התראות, פרטיות, שפה, נגישות, אודות, התנתקות, מחיקת חשבון.
```

**L402**

```
#### קבוצה 11: עמותות וארגונים
```

**L404**

```
**11.1 פרופיל עמותה ציבורי (NGO Profile)**
```

**L405**

```
* **רכיבים:** כפתורי "התנדב" ו"תרום" בולטים, מידע, קיר עדכונים, מדדי עשייה, מתנדבים פעילים.
```

**L407**

```
**11.3 לוח בקרה ארגוני (Org Dashboard)**
```

**L408**

```
* **רכיבים:** סיכום כספי, סטטוס צוות, משימות פעילות, טבלאות דינמיות, אינטגרציות, דו"חות.
```

**L410**

```
**11.4 Onboarding ארגון (Org Onboarding)**
```

**L411**

```
* **רכיבים:** טופס רב-שלבי: פרטי ארגון, מסמכים, תחומים, אנשי קשר, אישור תנאי שימוש.
```

**L415**

```
#### קבוצה 12: שידוכים
```

**L417**

```
**12.1 סביבת עבודת מוקדן (Operator Workspace)**
```

**L418**

```
* **רכיבים:** תור פניות (Tickets), סינון לפי רמת דחיפות/חסיון, כפתור "קח בעלות", סטטוס פניות.
```

**L420**

```
**12.2 ניהול תיק (Case Detail)**
```

**L421**

```
* **רכיבים:** פרטי מבקש, חיפוש מתנדבים, הערות פנימיות, יומן פעולות, כפתור "צור קשר לשידוך", סגירת תיק.
```

**L423**

```
**12.3 שיח שידוך ובירור התאמה (Match Engagement Chat)**
```

**L424**

```
* **תיאור:** חלון צ'אט בין המוקדן למתנדב הפוטנציאלי.
```

**L425**

```
* **רכיבים:** היסטוריית השיח, פרטי הבקשה (כפי שמוצגים למתנדב), כפתורי פעולה למתנדב ("מעוניין", "לא הפעם").
```

**L427**

```
**12.4 עדכון והעשרת פרופיל (Profile Enrichment Update)**
```

**L428**

```
* **תיאור:** ממשק למוקדן להוספת תכונות, העדפות ומידע עומק על המשתמש שעלה בשיחה.
```

**L429**

```
* **רכיבים:** שדות טקסט חופשי, תגיות יכולות, עדכון תחומי עניין. המערכת שולחת התראה אוטומטית למשתמש על השינויים שבוצעו ומאפשרת לו לערוך אותם בהגדרות האישיות.
```

**L433**

```
#### קבוצה 13: ניהול מערכת (Admin)
```

**L435**

```
**13.1 Admin Dashboard:** סיכום כללי, גרפים, התראות מערכתיות.
```

**L436**

```
**13.2 Admin People:** ניהול משתמשים, חיפוש, שינוי תפקידים, חסימה.
```

**L437**

```
**13.3 Admin Money:** מעקב תרומות, הוצאות, דו"חות כספיים.
```

**L438**

```
**13.4 Admin Tasks:** משימות ארגוניות, שיוך, מעקב, דיווח שעות.
```

**L439**

```
**13.5 Admin Files:** אחסון ושיתוף מסמכים ארגוניים.
```

**L440**

```
**13.6 Admin Tables:** יצירת טבלאות דינמיות מותאמות.
```

**L441**

```
**13.7 Admin Table Rows:** צפייה ועריכת שורות בטבלה.
```

**L442**

```
**13.8 Admin Admins:** ניהול הרשאות מנהלים.
```

**L443**

```
**13.9 Admin CRM:** ניהול קשרי לקוחות/תורמים.
```

**L444**

```
**13.10 Admin Time:** ניהול דיווחי שעות ומשמרות.
```

**L445**

```
**13.11 Admin Review:** בחינת תכנים מדווחים (Content Moderation).
```

**L446**

```
**13.12 Admin Org Approvals:** אישור/דחיית ארגונים חדשים.
```

**L449**

```
*הפרק הבא: [6. ניווט ומבנה האפליקציה](./06_Navigation_Structure.md)*
```

**L450**

```
*חזרה ל[אינדקס ראשי](./00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/06_Navigation_Structure.md`

**L3**

```
## 📐 6. ניווט ומבנה האפליקציה
```

**L5**

```
### 6.1 ניווט תחתון (Bottom Tab Bar)
```

**L6**

```
| #   | לשונית   | מסך ברירת מחדל     | תיאור          |
```

**L8**

```
| 1   | 🏠 בית    | Home Screen (Feed) | הפיד הראשי     |
```

**L9**

```
| 2   | 💝 תרומות | Donations Screen   | קטגוריות תרומה |
```

**L10**

```
| 3   | 🔍 חיפוש  | Search Screen      | חיפוש + AI     |
```

**L11**

```
| 4   | 👤 פרופיל | Profile Screen     | הפרופיל שלי    |
```

**L13**

```
### 6.2 ניווט עליון (Top Bar)
```

**L14**

```
מסכים הנגישים מכל מקום דרך הסרגל העליון:
```

**L15**

```
* צ'אט (Chat List)
```

**L16**

```
* התראות (Notifications)
```

**L17**

```
* הגדרות (Settings)
```

**L18**

```
* אודות (About)
```

**L20**

```
### 6.3 ניווט Admin
```

**L21**

```
גישה למסכי ניהול דרך סרגל עליון (מותנה בהרשאות). כולל:
```

**L25**

```
*הפרק הבא: [7. כללים עסקיים מרכזיים](./07_Business_Rules.md)*
```

**L26**

```
*חזרה ל[אינדקס ראשי](./00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/07_Business_Rules.md`

**L3**

```
## 📋 7. כללים עסקיים מרכזיים
```

**L5**

```
> מסמך זה מאחד את הכללים העסקיים החוצים את כלל הפלטפורמה ואת הכללים הייחודיים לכל **עולם תרומה** (3.5). כללים מסומנים כאן מקושרים גם למסמכי העומק בתיקייה [`./donation_worlds/`](./donation_worlds/).
```

**L9**

```
### 7.1 כללי ליבה כלליים (חוצי-עולמות)
```

**L11**

```
1. **אימות זהות ו-וי כחול:** משתמש מאומת הוא משתמש שמילא את כל פרטי הפרופיל, העלה תעודת זהות ועבר בדיקת תקינות. אין הבדל בהרשאות הפעולה בין משתמש רשום למאומת, למעט הצגת ה"וי הכחול" לצרכי אמינות ומוניטין בקהילה.
```

**L12**

```
2. **מתנדב = שיוך לארגון:** אין מתנדבים "עצמאיים" ללא ארגון.
```

**L13**

```
3. **נסיעות ללא רווח:** השתתפות בהוצאות בלבד – מודל פילנתרופי. (ראה [R-Rides-1, R-Rides-2](./donation_worlds/06_Rides.md)).
```

**L14**

```
4. **צ'אט קבוצתי מוגבל:** רק סביב פרויקט/אתגר/קמפיין/אירוח, ננעל בסיום.
```

**L15**

```
5. **תרומת ידע מפוקחת:** אישור מראש מהנהלת הארגון. (ראה [R-Knowledge-1](./donation_worlds/07_Knowledge.md)).
```

**L16**

```
6. **Audit Trail מלא:** כל פעולה במערך השידוכים ובכל פעולה כספית מתועדת ולא ניתנת למחיקה.
```

**L17**

```
7. **רמת אנונימיות לא ניתנת להורדה:** אחרי פרסום, ניתן רק להפוך לפומבי יותר.
```

**L18**

```
8. **אורח = צפייה בלבד:** אף פעולה אקטיבית ללא הרשמה.
```

**L19**

```
9. **עיצוב אישי ברמת משתמש:** שינויי UI לא משפיעים על אחרים. עיצוב עמותה כן.
```

**L20**

```
10. **רב-שפתי:** כל טקסט מגיע מקבצי שפה גלובליים (עברית ואנגלית).
```

**L21**

```
11. **דואליות "לתת" / "לקבל":** כל עולם תרומה (3.5) מציג שני מצבים סימטריים בעלי טוגל בולט.
```

**L22**

```
12. **קישוריות חוצת-עולמות:** פעולות בעולם אחד יכולות להזמין פעולות בעולם אחר (לדוגמה: מסירת חפץ → תיווך נסיעה → שינוע).
```

**L23**

```
13. **מאומתות ובטיחות:** עולמות בעלי השלכות בריאותיות / בטיחותיות (רפואה, דיור, נסיעות עם פעוטים) מחייבים "וי כחול".
```

**L27**

```
### 7.2 כללים ייחודיים לעולמות התרומה
```

**L29**

```
> מסמך זה מאחד **כללים מרכזיים בלבד**. הפירוט המלא של כללי כל עולם נמצא במסמך העולם הייעודי.
```

**L31**

```
#### 7.2.1 עולם הכסף (3.5.4)
```

**L32**

```
*מקור מלא:* [`donation_worlds/01_Money.md#8`](./donation_worlds/01_Money.md)
```

**L34**

```
* **R-Money-1:** רק עמותה שעברה אימות סופר-אדמין יכולה לקבל תרומות.
```

**L35**

```
* **R-Money-2:** קבלה עפ"י סעיף 46 רק לעמותות הרשומות לכך באימות מול הרשם.
```

**L36**

```
* **R-Money-4:** **כל פעולה כספית ב-Audit Trail בלתי-ניתן למחיקה.**
```

**L37**

```
* **R-Money-5:** סכום מינימום: ₪5. סכום > ₪10,000 דורש KYC.
```

**L38**

```
* **R-Money-7:** קמפיין שלא הגיע ליעד – החזר אוטומטי או חלוקה לקופה הכללית (החלטת התורם בעת התרומה).
```

**L39**

```
* **R-Money-8:** **בקשת סיוע אישי לא תופיע בפיד הציבורי – לעולם.**
```

**L40**

```
* **R-Money-10:** שיתוף תיק אימפקט = Opt-In; ברירת מחדל פרטי.
```

**L42**

```
#### 7.2.2 עולם החפצים (3.5.5)
```

**L43**

```
*מקור מלא:* [`donation_worlds/02_Items.md#7`](./donation_worlds/02_Items.md)
```

**L45**

```
* **R-Items-1:** חובת תמונה אחת לפחות לכל פוסט נתינה.
```

**L46**

```
* **R-Items-2:** אסור פרסום פריטים מסוכנים (כלי נשק, חומרים מסוכנים, פריטים לא חוקיים).
```

**L47**

```
* **R-Items-4:** פריטי ילדים בטיחותיים יד שנייה (כיסא בטיחות, מציצה, מיטת תינוק > 5 שנים) דורשים אזהרה ויזואלית.
```

**L48**

```
* **R-Items-5:** משך פוסט פעיל ברירת מחדל: 30 ימים.
```

**L50**

```
#### 7.2.3 עולם המזון (3.5.6) – **קריטי לבטיחות**
```

**L51**

```
*מקור מלא:* [`donation_worlds/03_Food.md#8`](./donation_worlds/03_Food.md)
```

**L53**

```
* **R-Food-1:** **כל פוסט נתינה חייב לקבל תאריך תפוגה תקף.** המערכת לא מאפשרת פרסום ללא תאריך.
```

**L54**

```
* **R-Food-2:** **אסור לאפשר מסירת מזון לאחר תאריך התפוגה.** הפוסט נחסם אוטומטית.
```

**L55**

```
* **R-Food-3:** המוסר חייב לאשר אזהרת בטיחות לפני כל פרסום.
```

**L56**

```
* **R-Food-4:** סימון אלרגנים חובה.
```

**L57**

```
* **R-Food-7:** משתמש שדווח 3 פעמים על מזון מקולקל = השעיית הרשאת פרסום מזון לחודש.
```

**L58**

```
* **R-Food-8:** מזון לתינוקות וילדים < 3 דורש אזהרה ויזואלית מיוחדת.
```

**L60**

```
#### 7.2.4 עולם הרפואה (3.5.7) – **רגישות בריאותית קריטית**
```

**L61**

```
*מקור מלא:* [`donation_worlds/04_Medical.md#8`](./donation_worlds/04_Medical.md)
```

**L63**

```
* **R-Med-1:** רק משתמש "וי כחול" יכול לבצע פעולות רפואיות (תרומת דם, אדי, תרומה בחיים, ליווי).
```

**L64**

```
* **R-Med-2:** **כל פעולת תרומת אברים דורשת אישור משפטי-רפואי + חתימה דיגיטלית מאומתת.**
```

**L65**

```
* **R-Med-3:** קריאת חירום לתרומת דם נשלחת רק למשתמשים בעלי **סוג דם תואם + מיקום ≤ 30 ק"מ**.
```

**L66**

```
* **R-Med-6:** **אסור** תרומה ישירה בין משתמשים פרטיים ללא תיווך גוף רפואה (למעט ציוד שמיש).
```

**L67**

```
* **R-Med-7:** Audit Trail מורחב לכל פעולה רפואית – נשמר לעד.
```

**L69**

```
#### 7.2.5 עולם הדיור / האירוח (3.5.8)
```

**L70**

```
*מקור מלא:* [`donation_worlds/05_Housing.md#8`](./donation_worlds/05_Housing.md)
```

**L72**

```
* **R-Housing-1:** **שני הצדדים חייבים אימות "וי כחול"** לפני אישור אירוח.
```

**L73**

```
* **R-Housing-2:** קוד התנהגות דיגיטלי **חובה לאישור** לפני אירוח ראשון.
```

**L74**

```
* **R-Housing-3:** מיקום מדויק נחשף לאורח רק לאחר אישור.
```

**L75**

```
* **R-Housing-4:** **כפתור חירום** זמין בצ'אט אירוח – שולח התראה לתמיכה + איש קשר חירום.
```

**L76**

```
* **R-Housing-7:** אסור לגבות תשלום על אירוח. השתתפות סמלית בהוצאות מותרת.
```

**L77**

```
* **R-Housing-10:** אורח חסר בית עובר ליווי ארגון – אסור אירוח ישיר ללא תיווך.
```

**L79**

```
#### 7.2.6 עולם הנסיעות (3.5.9)
```

**L80**

```
*מקור מלא:* [`donation_worlds/06_Rides.md#9`](./donation_worlds/06_Rides.md)
```

**L82**

```
* **R-Rides-1:** **אסור לגבות מחיר רווח על נסיעה.** רק השתתפות בהוצאות סמלית.
```

**L83**

```
* **R-Rides-2:** סכום השתתפות מקסימום: ₪70 לראש בין-עירוני; ₪20 תוך-עירוני.
```

**L84**

```
* **R-Rides-3:** נהג חייב **רישיון נהיגה תקף** ופרופיל "וי כחול".
```

**L85**

```
* **R-Rides-7:** דיווח על נהיגה מסוכנת = השעיית נהג מיידית + בדיקה.
```

**L86**

```
* **R-Rides-8:** **כפתור חירום בנסיעה פעילה** – מיקום בזמן אמת לתמיכה + איש קשר.
```

**L87**

```
* **R-Rides-9:** קטינים < 18 דורשים הסכמת הורה דיגיטלית.
```

**L89**

```
#### 7.2.7 עולם הידע (3.5.10)
```

**L90**

```
*מקור מלא:* [`donation_worlds/07_Knowledge.md#8`](./donation_worlds/07_Knowledge.md)
```

**L92**

```
* **R-Knowledge-1:** כל תוכן ידע עובר אישור מנהלת ארגון לפני פרסום.
```

**L93**

```
* **R-Knowledge-2:** **חינם בלבד.** אסורה גביית תשלום על ידע.
```

**L94**

```
* **R-Knowledge-3:** קורסים בתחומים רגישים (רפואה, משפטים) דורשים אישור פרטני.
```

**L95**

```
* **R-Knowledge-5:** מורה לשיעור פרטי חייב "וי כחול" + 3 ביקורות חיוביות אחרי 5 שיעורים ראשונים.
```

**L97**

```
#### 7.2.8 עולם הזמן (3.5.11)
```

**L98**

```
*מקור מלא:* [`donation_worlds/08_Time.md#8`](./donation_worlds/08_Time.md)
```

**L100**

```
* **R-Time-1:** מתנדב חייב שיוך לארגון.
```

**L101**

```
* **R-Time-2:** דיווח שעות לא אוטומטי – המתנדב מדווח, ומתאם הארגון מאשר.
```

**L102**

```
* **R-Time-3:** סיוע רגשי / נפשי לקטגוריות רגישות חובה דרך מוקד מאומן.
```

**L103**

```
* **R-Time-5:** התנדבות עם קטינים דורשת אישור הורה דיגיטלי.
```

**L105**

```
#### 7.2.9 עולמות נוספים (3.5.12‑3.5.16)
```

**L107**

```
* **R-Animals-1:** אימוץ דורש תיווך עמותה מאומתת – **אסור אימוץ ישיר** בין משתמשים פרטיים.
```

**L108**

```
* **R-Env-1:** פסולת מסוכנת חייבת לעבור דרך גוף מורשה. אסור פינוי פיראטי.
```

**L109**

```
* **R-Match-1 (שידוכים רומנטיים):** חינם בלבד.
```

**L110**

```
* **R-Match-6:** קטינים < 18 אסורים במערכת השידוכים הרומנטיים.
```

**L114**

```
### 7.3 כללי טיפול בפניות רגישות (חוצה-עולמות)
```

**L116**

```
* כל בקשה ברמת אנונימיות 1 (מוקדנים בלבד) זורמת אוטומטית למוקד (3.4).
```

**L117**

```
* מוקד פועל לפי פרוטוקול דיסקרטיות – ראה [`03_Core_Features.md#3.4`](./03_Core_Features.md).
```

**L118**

```
* בקשות רגישות בעולם הרפואה (תרומה בחיים, ליווי לחולה אונקולוגי) ובעולם הדיור (חסרי בית) ובעולם הזמן (תמיכה רגשית, אובדנות) מחייבות מוקדן מאומן בנוסף.
```

**L122**

```
### 7.4 כללי גיוורנס פיננסי (Financial Governance)
```

**L124**

```
* כל הסכום הפיננסי במערכת (תרומות, קמפיינים, קרנות) חייב לעבור באמצעי תשלום מאומת PCI-DSS.
```

**L125**

```
* אין החזקת כספים פנימית מעבר לקרן הפילנתרופית של המשתמש (Donor-Advised Fund) – הקרן עצמה תחת רישום משפטי-חשבונאי.
```

**L126**

```
* קמפיין עם יעד לא מושג – החלטת ההחזר/הסבה היא של התורם בעת התרומה.
```

**L127**

```
* דוחות שקיפות שנתיים זמינים פומבית לכל עמותה רשומה.
```

**L131**

```
### 7.5 הכרזות אסורות
```

**L133**

```
* **תוכן המסית, מדיר, או פוגעני** מסולק מיידית.
```

**L134**

```
* **הצעת תרומה במחיר** (כל סכום שעובר את "השתתפות סמלית") = הפרת תקנון.
```

**L135**

```
* **שימוש בנתוני קהילה למטרות מסחריות** – אסור.
```

**L136**

```
* **שיתוף פרטי משתמש שאינם פומביים** ללא הסכמה – אסור והפרת חוק.
```

**L140**

```
*נכתב במטרה להנחות את הפיתוח, העיצוב והחשיבה העסקית של הפלטפורמה, תוך מיקוד במשתמש הקצה, צרכי הארגונים והמחויבות לקהילה חזקה, יעילה ופרטית.*
```

**L143**

```
*חזרה ל[אינדקס ראשי](./00_Index.md) | [פיצ'רים ותהליכי ליבה](./03_Core_Features.md) | [עולמות תרומה](./donation_worlds/00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/00_Index.md`

**L3**

```
# 🌍 עולמות תרומה (Donation Worlds) – אינדקס ראשי
```

**L5**

```
**גרסה:** 2.1
```

**L6**

```
**עדכון אחרון:** מאי 2026
```

**L7**

```
**הקשר:** מסמך זה הוא **תת-ספר** של ה-PRD. כל קובץ בתיקייה הוא מפרט עומק של עולם תרומה אחד.
```

**L11**

```
## א. מטרת התת-ספר
```

**L13**

```
ב-PRD הראשי (סעיף 3.5 ב-[`../03_Core_Features.md`](../03_Core_Features.md)) מוגדרים **עולמות התרומה** כ-DNA של הפלטפורמה. כל עולם הוא יחידה דו-מודאלית עצמאית (לתת/לקבל) עם לוגיקה, מסכים, זרימות וכללים ייחודיים לו, אך כולם משתפים תשתית רוחבית אחת (פיד, אנונימיות, שידוכים, סטטיסטיקות).
```

**L15**

```
מסמך-העל בסעיף 3.5 הוא **קצר בכוונה** – הוא הגלריה של העולמות. **כאן** מתפרסם המפרט המלא לכל עולם בנפרד.
```

**L19**

```
## ב. מודל אחיד למסמך עולם
```

**L21**

```
כל מסמך עולם בתיקייה זו עוקב אחרי **תבנית קבועה** כדי לשמור על אחידות וניתן ניווט:
```

**L23**

```
1. **מהות וערך עסקי** – למה העולם הזה קיים, איזה צורך הוא פותר, אילו פרסונות הוא משרת.
```

**L24**

```
2. **מודל הדואליות (Give / Receive)** – פירוט שני המצבים, מי המשתמש הטיפוסי, מה ייחודי בכל מצב.
```

**L25**

```
3. **קטגוריות פנימיות** – חלוקה משנית בתוך העולם (למשל בעולם החפצים: רהיטים, בגדים, ספרים).
```

**L26**

```
4. **שדות ופרטים בפוסט** – שדות חובה ושדות אופציונליים, כולל ייחודים (לדוגמה: תאריך תפוגה במזון).
```

**L27**

```
5. **תהליכי ליבה** – זרימות עיקריות (נתינה, בקשה, מיצוי, סגירה).
```

**L28**

```
6. **אינטגרציות חוצות-עולמות** – קישור לעולמות אחרים (לדוגמה: מסירת חפץ → תיווך נסיעה).
```

**L29**

```
7. **אינטגרציות חיצוניות** – API של גורמים חוצי-מערכת (לדוגמה: מד"א בעולם הרפואה, סליקה בעולם הכסף).
```

**L30**

```
8. **כללים עסקיים ייחודיים** – אילוצי בטיחות, פרטיות, חוקיות.
```

**L31**

```
9. **מסכים רלוונטיים** – הפניה ל-[`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md).
```

**L32**

```
10. **זרימות משתמש רלוונטיות** – הפניה ל-[`../04_User_Flows.md`](../04_User_Flows.md).
```

**L33**

```
11. **כללים עסקיים בקנה אחד** – הפניה ל-[`../07_Business_Rules.md`](../07_Business_Rules.md).
```

**L34**

```
12. **התראות שייחודיות לעולם** – אילו Push/בתוך-אפליקציה מופעלים בעולם זה.
```

**L35**

```
13. **מטריצת הרשאות (אם רלוונטית)** – הבדלי הרשאות בין סוגי משתמשים בעולם זה.
```

**L36**

```
14. **מדדי הצלחה (KPIs)** – מדדים ספציפיים לעולם.
```

**L37**

```
15. **מקרי קצה ושאלות פתוחות** – נושאים שצריך עוד החלטה.
```

**L41**

```
## ג. רשימת עולמות
```

**L43**

```
| #  | עולם                           | קובץ                                                       | סטטוס פירוט |
```

**L45**

```
| 1  | 💰 כסף (Money)                 | [`01_Money.md`](./01_Money.md)                             | מפורט מלא   |
```

**L46**

```
| 2  | 📦 חפצים (Items)               | [`02_Items.md`](./02_Items.md)                             | מפורט מלא   |
```

**L47**

```
| 3  | 🍎 מזון (Food)                 | [`03_Food.md`](./03_Food.md)                               | מפורט מלא   |
```

**L48**

```
| 4  | ⚕️ רפואה (Medical)             | [`04_Medical.md`](./04_Medical.md)                         | מפורט מלא   |
```

**L49**

```
| 5  | 🏠 דיור / אירוח (Housing)      | [`05_Housing.md`](./05_Housing.md)                         | מפורט מלא   |
```

**L50**

```
| 6  | 🚗 נסיעות שיתופיות (Rides)     | [`06_Rides.md`](./06_Rides.md)                             | מפורט מלא   |
```

**L51**

```
| 7  | 📚 ידע (Knowledge)             | [`07_Knowledge.md`](./07_Knowledge.md)                     | מפורט מלא   |
```

**L52**

```
| 8  | 🕒 זמן והתנדבות (Time)         | [`08_Time.md`](./08_Time.md)                               | מפורט מלא   |
```

**L53**

```
| 9  | 🐾 בעלי חיים (Animals)         | [`09_Animals.md`](./09_Animals.md)                         | תקציר       |
```

**L54**

```
| 10 | 🌱 סביבה (Environment)         | [`10_Environment.md`](./10_Environment.md)                 | תקציר       |
```

**L55**

```
| 11 | 🎨 יצירה (Creative)            | [`11_Creative.md`](./11_Creative.md)                       | תקציר       |
```

**L56**

```
| 12 | 💞 שידוכים רומנטיים            | [`12_Matchmaking_Romantic.md`](./12_Matchmaking_Romantic.md) | תקציר       |
```

**L57**

```
| 13 | 🎨 עיצוב האפליקציה             | [`13_App_Design.md`](./13_App_Design.md)                   | תקציר       |
```

**L59**

```
> **הבחנה חשובה:** "שידוכים רומנטיים" (#12) שונה לחלוטין מ-"שידוכים-טוב" / "Operator Matching" (סעיף 3.4 ב-PRD) שהוא מנגנון תיווך אנושי על-עולמי לבקשות רגישות. ראה [`12_Matchmaking_Romantic.md`](./12_Matchmaking_Romantic.md) להבחנה מפורטת.
```

**L63**

```
## ד. טבלת קישוריות מהירה
```

**L65**

```
| עולם       | מסכים מרכזיים (5_Screen_UI_Mapping)                  | זרימות עיקריות (4_User_Flows)                  |
```

**L67**

```
| כסף        | 5.5 Money Screen + Give/Receive sub-screens          | זרימה 11, F1‑F5                                |
```

**L68**

```
| חפצים      | 5.4 Items Screen, 4.3 Item Publish, 4.5 Transport    | זרימה 5                                        |
```

**L69**

```
| מזון       | 5.X Food Screen + Give/Receive sub-screens           | F6‑F7                                          |
```

**L70**

```
| רפואה      | 5.X Medical Screen + Give/Receive sub-screens        | F8‑F10                                         |
```

**L71**

```
| דיור       | 5.X Housing Screen + Give/Receive sub-screens        | F11‑F12                                        |
```

**L72**

```
| נסיעות     | 6.1‑6.6 Rides screens                                | זרימות 6, 7                                    |
```

**L73**

```
| ידע        | 5.3 Knowledge Screen                                 | זרימה 14                                       |
```

**L74**

```
| זמן        | 5.6 Time Screen                                      | זרימות 8, 12                                   |
```

**L75**

```
| בעלי חיים  | 5.X Animals Screen                                   | F13                                            |
```

**L76**

```
| סביבה      | 5.X Environment Screen                               | F14                                            |
```

**L77**

```
| יצירה      | 5.X Creative Screen                                  | F15                                            |
```

**L78**

```
| שדכן רומנטי | 5.7 Matchmaking Screen                              | F16                                            |
```

**L79**

```
| עיצוב אפ   | 2.6 UI Customization Modal                           | זרימה 19                                       |
```

**L81**

```
> **הערה:** מסכים המסומנים `5.X` הם חדשים שנוספו בעדכון זה ל-[`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md). זרימות `F#` הן זרימות חדשות שנוספו ל-[`../04_User_Flows.md`](../04_User_Flows.md).
```

**L85**

```
## ה. כללי תחזוקה
```

**L87**

```
* **שינוי בעולם דורש סנכרון:** כל שינוי במסמך עולם חייב להתעדכן גם ב-[`../03_Core_Features.md#3.5`](../03_Core_Features.md), בזרימות הרלוונטיות וב-[`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md).
```

**L88**

```
* **כללים עסקיים חדשים** מתועדים ב-[`../07_Business_Rules.md`](../07_Business_Rules.md) עם הפניה לעולם.
```

**L89**

```
* **שמירת הקישוריות הדו-כיוונית:** כל מסמך עולם מקשר לעולמות שותפים, וכל עולם שותף מקושר חזרה.
```

**L93**

```
*חזרה ל-[PRD ראשי](../00_Index.md) | [פיצ'רים ותהליכי ליבה](../03_Core_Features.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/01_Money.md`

**L3**

```
# 💰 עולם הכסף (Money World)
```

**L5**

```
**עולם תרומה #1** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.4`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם הכסף הוא **המסך הפיננסי המרכזי** של הפלטפורמה. הוא משלב את כל מה ש-[jgive.com](https://jgive.com) מציע למסירת תרומות לעמותות, אך **מרחיב משמעותית** מעבר לכך – לכלל מנגנונים פיננסיים-פילנתרופיים אישיים וארגוניים בקנה מידה רחב.
```

**L13**

```
**הצורך שהוא פותר:**
```

**L15**

```
* תורמים פוטנציאליים שמחפשים את העמותה הנכונה אינם מוצאים פלטפורמה אחת מאוחדת המציעה גילוי, השוואה, ניהול וגמישות.
```

**L16**

```
* משתמשים שזקוקים לסיוע כספי (פרטי או דרך ארגון) אינם רואים מקום ברור להגיש בקשה.
```

**L17**

```
* ארגונים שצריכים גיוס המונים סביב מטרה ספציפית מתפזרים בין פלטפורמות שונות.
```

**L18**

```
* תורמים סדרתיים (Philanthropists) חסרים תיק מרכזי לניהול תרומותיהם.
```

**L20**

```
**פרסונות עיקריות:**
```

**L22**

```
| פרסונה                       | תפקיד עיקרי בעולם הכסף                                                              |
```

**L24**

```
| 👤 חבר קהילה תורם            | מבצע תרומות חד-פעמיות, מקים הוראות קבע, יוצר קרן אישית.                             |
```

**L25**

```
| 👤 חבר קהילה במצוקה          | פותח בקשת סיוע אישית (אנונימית בברירת מחדל) לקבלת עזרה כספית מעמותות סיוע.          |
```

**L26**

```
| 👑 מנהל ארגון / 💼 עובד עמותה | פותח קמפיינים, מנהל יעדים, מקבל תרומות, מפרסם דו"חות שקיפות.                         |
```

**L27**

```
| ⚙️ מנהל מערכת                | מאשר עמותות חדשות, אוכף תקנות פיננסיות, מבקר שקיפות.                                 |
```

**L28**

```
| 🎧 מוקדן                     | מטפל בבקשות סיוע אישי ברגישות גבוהה (רמה 1) – מתווך לעמותות סיוע.                    |
```

**L32**

```
## 2. מודל הדואליות
```

**L34**

```
### 2.1 מצב לתת (Give Mode) – "אני רוצה לתרום"
```

**L36**

```
המסך הראשי במצב "לתת" הוא **גלריית עמותות אינטראקטיבית** המאפשרת:
```

**L38**

```
#### א. דפדוף וגילוי עמותות
```

**L39**

```
* תצוגת רשימה / כרטיסים / מפה.
```

**L40**

```
* לכל עמותה: לוגו, תיאור קצר, תחום פעילות ראשי, אזור גיאוגרפי, מספר תורמים פעילים, סך תרומות חודשיות, מדד שקיפות, "וי כחול".
```

**L41**

```
* לחיצה על כרטיס פותחת את [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md) **NGO Profile** עם כפתור "תרום" בולט.
```

**L43**

```
#### ב. סינון, מיון וחיפוש מתקדמים
```

**L44**

```
מנוע מסננים גמיש לחלוטין:
```

**L46**

```
* **תחום פעילות:** רווחה, חינוך, רפואה, סביבה, חיות, דת, תרבות, בריאות הנפש, גיל זהב, נוער, נשים בסיכון, וכו'.
```

**L47**

```
* **אזור גיאוגרפי:** עיר/אזור (מצפון לדרום, מהמרכז לפריפריה).
```

**L48**

```
* **גודל הארגון:** מאוד קטן (תקציב < 100K שקל) / קטן / בינוני / גדול / גדול מאוד.
```

**L49**

```
* **מדדי שקיפות:**
```

**L50**

```
    * אחוז תקציב להוצאות תפעוליות (overhead).
```

**L51**

```
    * אחוז תקציב למטרת הליבה.
```

**L52**

```
    * זמינות דו"חות שנתיים.
```

**L53**

```
    * דירוג קהילה (ביקורות תורמים).
```

**L54**

```
* **גיל הארגון:** ארגון חדש (< 3 שנים) / ותיק.
```

**L55**

```
* **שיוכים מיוחדים:** עמותה רשומה (ניתן להוציא לה קבלה לפי סעיף 46), עמותה מוכרת.
```

**L56**

```
* **חיפוש חופשי:** טקסט חופשי בשם / תיאור / מילות מפתח.
```

**L58**

```
#### ג. מסלולי תרומה (סוגי פעולה)
```

**L60**

```
##### ג.1 תרומה חד-פעמית
```

**L61**

```
* בחירת סכום (מוגדרים מראש: 18, 36, 100, 360, או הזנה חופשית).
```

**L62**

```
* בחירת **כינוי תורם** (אופציונלי): שם מלא / שם פרטי בלבד / אנונימי.
```

**L63**

```
* **הקדשה אישית:** טקסט חופשי ("לזכר X" / "לכבוד Y" / סתם).
```

**L64**

```
* **חלוקה בין מטרות:** במידה והעמותה הגדירה כמה תכניות פעילות, ניתן לחלק את התרומה ביניהן (למשל: 60% למזון, 40% לחינוך).
```

**L65**

```
* **הוצאת קבלה:** לפי סעיף 46 לפקודת מס הכנסה (אם העמותה רשומה לכך).
```

**L66**

```
* **שיתוף בפיד:** המשתמש יכול לבחור לשתף את התרומה (גלוי / אנונימי) ככלי השראה לקהילה.
```

**L68**

```
##### ג.2 הוראת קבע (Recurring Donation)
```

**L69**

```
* תדירות: חודשית / רבעונית / חצי-שנתית / שנתית.
```

**L70**

```
* סכום קבוע / משתנה (לפי אינדקס מסוים).
```

**L71**

```
* תאריך התחלה ותאריך סיום (או "ללא סיום").
```

**L72**

```
* **ניהול:** מסך ייעודי "ההוראות שלי" עם אפשרות לעצור, להגדיל, להקטין, לשנות תאריך, להעביר לעמותה אחרת.
```

**L73**

```
* **התראות:** התראה לפני כל חיוב (24 שעות), אישור לאחר חיוב.
```

**L75**

```
##### ג.3 תרומה לקמפיין מימון ספציפי
```

**L76**

```
* רשימת קמפיינים פעילים במערכת.
```

**L77**

```
* כל קמפיין: שם, תמונה, סיפור, ארגון מארח, יעד כספי, סכום שגויס עד כה, מספר תורמים, תאריך סיום.
```

**L78**

```
* תרומה מוגבלת לקמפיין הספציפי (לא חוזרת לקופה הכללית של הארגון).
```

**L79**

```
* **התראות:** עדכוני התקדמות לתורמים שכבר תרמו.
```

**L81**

```
##### ג.4 קרן אישית/ציבורית (Donor-Advised Fund)
```

**L82**

```
פיצ'ר מתקדם המאפשר למשתמש לבנות **קרן פילנתרופית פרטית**:
```

**L84**

```
* המשתמש מפקיד סכום (חד-פעמי / מצטבר) בקרן הוירטואלית שלו במערכת.
```

**L85**

```
* הסכום נשמר ב"כספת" שלו ויוצר רף **השקעה פילנתרופית עתידית**.
```

**L86**

```
* בכל עת, המשתמש יכול לחלק את הקרן לעמותות לפי בחירתו (תרומות עתידיות מתוזמנות).
```

**L87**

```
* **קרן פרטית:** רק המשתמש רואה את היתרה והפעולות.
```

**L88**

```
* **קרן ציבורית:** המשתמש משתף את הקרן עם הקהילה – אחרים רואים מה הוא תכנן לתרום, יכולים להצטרף ולהוסיף לקרן (נחשב מודל "קרן קהילתית").
```

**L89**

```
* **אופציונלית:** הגדרת תקנון אוטומטי – לדוגמה "כל סוף שנה לחלק 30% מהקרן ל-3 עמותות בעלות מדד שקיפות גבוה".
```

**L91**

```
##### ג.5 תיק השקעות אימפקט (Impact Portfolio)
```

**L92**

```
**תרומת ידע פיננסי** – המשתמש "תורם" את היכולת לראות את **התיק שלו**:
```

**L94**

```
* מסך ויזואלי המראה את כל העמותות שתרם להן, אחוז תרומותיו לכל אחת, המגמות, ההישגים.
```

**L95**

```
* המשתמש יכול **לפרסם את התיק לקהילה** – פיד התיק שלו זמין לאחרים כמקור השראה.
```

**L96**

```
* תורם בכיר יכול ליצור "תיק לדוגמה" – המלצה לאחרים לעקוב.
```

**L97**

```
* **השפעה (Impact):** אם 100 איש עוקבים אחר התיק שלך והם תרמו על בסיס המלצותיך, אתה רואה את ה-Impact המוכפל שלך.
```

**L98**

```
* קישור לסטטיסטיקות עומק (סעיף 3.8 ב-PRD).
```

**L100**

```
#### ד. פיצ'רים נוספים בתפריט הפנימי של מסך הכסף (מצב לתת)
```

**L102**

```
* **הוראות קבע פעילות** – ניהול ועצירה.
```

**L103**

```
* **היסטוריית תרומות** – ייצוא לדוחות שנתיים, סך תרומות, חיתוך לפי שנה / עמותה / קטגוריה.
```

**L104**

```
* **קבלות** – אחסון דיגיטלי של כל קבלות סעיף 46.
```

**L105**

```
* **מועדפים** – שמירת עמותות וקמפיינים שאהבת.
```

**L106**

```
* **התרעות עוקב** – "התראה כשעמותה X מפרסמת קמפיין חדש".
```

**L107**

```
* **השוואת עמותות** – בחירת עד 4 עמותות והצגת השוואה צד-לצד.
```

**L111**

```
### 2.2 מצב לקבל (Receive Mode) – "אני זקוק לסיוע" / "ארגון רוצה לגייס"
```

**L113**

```
המסך משתנה לחלוטין כאשר המשתמש מחליף לטוגל "לקבל". הוא **מותנה בזהות המשתמש**:
```

**L115**

```
#### א. משתמש פרטי במצב לקבל
```

**L117**

```
* **בקשת סיוע אישית** – טופס המוגש לעמותות סיוע ייעודיות בסגנון [פעמונים](https://www.paamonim.org), [לתת](https://www.latet.org.il), אגודה לקידום החינוך וכו'.
```

**L118**

```
* **שדות הטופס:**
```

**L119**

```
    * סוג מצוקה: חוב, אבטלה, מחלה, אסון משפחתי, חזרה מקבע, אחר.
```

**L120**

```
    * סכום נדרש (משוער) או ייעוד (תשלום שכר דירה, מצרכים וכו').
```

**L121**

```
    * תיאור חופשי של המצב.
```

**L122**

```
    * משפחה: סטטוס, מספר ילדים, גילאים.
```

**L123**

```
    * **רמת אנונימיות:** ברירת מחדל **רמה 1 (מוקדנים בלבד)** – הבקשה לא תופיע בפיד הפומבי.
```

**L124**

```
    * אישור תקנון.
```

**L125**

```
* **תהליך:** הבקשה זורמת אוטומטית למוקד ([3.4 ב-PRD](../03_Core_Features.md)). מוקדן בודק, מתאים לעמותת סיוע, מנהל את הקשר. רק לאחר הסכמת הצדדים נחשפת זהות.
```

**L126**

```
* **תצוגת סטטוס:** המשתמש רואה את התקדמות הבקשה (התקבלה / בטיפול / נמצא ארגון / אושרה / נסגרה) ללא חשיפת פרטים פרטיים אחרים.
```

**L128**

```
#### ב. משתמש ארגוני (Org Admin / Org Employee) במצב לקבל
```

**L130**

```
* **פתיחת קמפיין מימון** – יצירת קמפיין חדש תחת שם הארגון.
```

**L131**

```
* **שדות הקמפיין:**
```

**L132**

```
    * שם הקמפיין.
```

**L133**

```
    * סיפור / מטרה.
```

**L134**

```
    * תמונה / וידאו ראשי + גלריית תמונות.
```

**L135**

```
    * **יעד כספי** (חובה).
```

**L136**

```
    * **תאריך התחלה ותאריך סיום** (חובה).
```

**L137**

```
    * חלוקה לתת-מטרות (אופציונלית): "30% לציוד, 50% לשכר, 20% לתפעול".
```

**L138**

```
    * תיוג קטגוריות (לסינון בעולם הכסף).
```

**L139**

```
    * הצלחות מקדימות / עדכוני סטטוס לאורך הקמפיין.
```

**L140**

```
* **תהליך:**
```

**L141**

```
    * שלב טיוטה → שלב אישור (Org Admin) → פרסום לציבור.
```

**L142**

```
    * הקמפיין מופיע ב"קמפיינים פעילים" במסך הכסף.
```

**L143**

```
    * סנכרון עם ה-CRM של הארגון (סעיף 3.9 ב-PRD).
```

**L144**

```
* **כלי ניהול קמפיין:**
```

**L145**

```
    * דשבורד עם גרף התקדמות בזמן אמת.
```

**L146**

```
    * רשימת תורמים (גלוי / אנונימי).
```

**L147**

```
    * שליחת עדכוני סטטוס לתורמים (Push).
```

**L148**

```
    * סגירת קמפיין: סיכום + הודעת תודה אוטומטית.
```

**L152**

```
## 3. קטגוריות פנימיות (תוכנית פעילות בעולם הכסף)
```

**L154**

```
תחת עולם הכסף יוגדרו **תכניות פעילות** של עמותות / קמפיינים. כל פוסט / קמפיין / עמותה משויכים ל-1 או יותר מ:
```

**L156**

```
* רווחה ושיקום
```

**L157**

```
* חינוך והשכלה
```

**L158**

```
* רפואה ומחקר רפואי
```

**L159**

```
* סביבה ופיתוח בר-קיימא
```

**L160**

```
* בעלי חיים
```

**L161**

```
* תרבות ואמנות
```

**L162**

```
* גיל הזהב
```

**L163**

```
* נוער בסיכון
```

**L164**

```
* נשים בסיכון
```

**L165**

```
* בריאות הנפש
```

**L166**

```
* תורה ויהדות
```

**L167**

```
* אחר
```

**L171**

```
## 4. שדות פוסט / קמפיין
```

**L173**

```
| שדה                          | עמותה | קמפיין | בקשת סיוע אישי | הוראת קבע |
```

**L175**

```
| כותרת                        | חובה  | חובה   | חובה           | -         |
```

**L176**

```
| תיאור / סיפור                | חובה  | חובה   | חובה           | -         |
```

**L177**

```
| תמונה ראשית                  | חובה  | חובה   | אופציונלי      | -         |
```

**L178**

```
| יעד כספי                     | -     | חובה   | -              | סכום קבע  |
```

**L179**

```
| תאריך התחלה/סיום             | -     | חובה   | -              | חובה      |
```

**L180**

```
| תחום / קטגוריה               | חובה  | חובה   | חובה           | -         |
```

**L181**

```
| מיקום גיאוגרפי               | חובה  | אופציונלי | אופציונלי   | -         |
```

**L182**

```
| רמת אנונימיות                | -     | -      | חובה (ברירת מחדל 1) | -    |
```

**L183**

```
| מסמכי שקיפות                 | חובה  | אופציונלי | -           | -         |
```

**L184**

```
| חלוקה לתת-מטרות              | אופציונלי | אופציונלי | -        | -         |
```

**L188**

```
## 5. תהליכי ליבה (Core Flows)
```

**L190**

```
ראה זרימות מלאות ב-[`../04_User_Flows.md`](../04_User_Flows.md):
```

**L192**

```
* **F1:** תרומה חד-פעמית לעמותה.
```

**L193**

```
* **F2:** הקמת הוראת קבע.
```

**L194**

```
* **F3:** תרומה לקמפיין ייעודי.
```

**L195**

```
* **F4:** יצירת קרן אישית/ציבורית.
```

**L196**

```
* **F5:** פתיחת בקשת סיוע אישי.
```

**L197**

```
* **זרימה 11:** תרומה כספית ישירה לעמותה (ראה PRD).
```

**L198**

```
* **זרימה משלימה:** פתיחת קמפיין מימון ארגוני.
```

**L202**

```
## 6. אינטגרציות חוצות-עולמות
```

**L204**

```
* **עולם הזמן (3.5.11):** עמותה שמפרסמת קמפיין יכולה גם לבקש מתנדבים לזמן.
```

**L205**

```
* **עולם החפצים (3.5.5):** קמפיין רב-עולמי שיכול לקבל גם תרומות חפצים (למשל מצרכים).
```

**L206**

```
* **עולם הסטטיסטיקות (3.8):** כל תרומה זורמת אוטומטית לסטטיסטיקות אישיות וקהילתיות.
```

**L207**

```
* **CRM הארגוני (3.9):** כל תרומה מתעדכנת אוטומטית בכרטיס התורם בארגון המקבל.
```

**L208**

```
* **שידוכים (3.4):** בקשות סיוע אישי ברמת אנונימיות 1 זורמות למוקד.
```

**L212**

```
## 7. אינטגרציות חיצוניות
```

**L214**

```
* **ספקי סליקה:** אינטגרציה עם שערי תשלום ישראליים (Tranzila, Cardcom, PayPlus). ב-MVP – ספק יחיד; הרחבה עתידית.
```

**L215**

```
* **רישום עמותות:** אינטגרציה עם רשם העמותות לאימות מס' עמותה ותקפותה לסעיף 46.
```

**L216**

```
* **בנקים / כרטיסי אשראי:** הגנת PCI-DSS.
```

**L217**

```
* **שירותי דוא"ל / SMS:** שליחת קבלות אוטומטיות.
```

**L218**

```
* **רשם החברות / אגף השומה:** ייצוא דוחות תרומה שנתיים בפורמט מקובל.
```

**L222**

```
## 8. כללים עסקיים ייחודיים
```

**L224**

```
ראה גם [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L226**

```
* **R-Money-1:** רק עמותה שעברה אימות סופר-אדמין (Org Approvals) יכולה לקבל תרומות.
```

**L227**

```
* **R-Money-2:** קבלה עפ"י סעיף 46 ניתנת רק לעמותות הרשומות לכך ואחרי שהמערכת אימתה את הסטטוס מול הרשם.
```

**L228**

```
* **R-Money-3:** אסור לארגון פתיחת יותר מ-5 קמפיינים פעילים בו-זמנית (למניעת פיזור תורמים).
```

**L229**

```
* **R-Money-4:** **כל פעולה כספית מתועדת ב-Audit Trail** בלתי-ניתן למחיקה.
```

**L230**

```
* **R-Money-5:** סכום מינימום לתרומה: ₪5. סכום מקסימום (ללא וריפיקציה נוספת): ₪10,000 (סכום גבוה דורש זיהוי KYC).
```

**L231**

```
* **R-Money-6:** הוראת קבע ניתנת לעצירה בכל עת ע"י המשתמש – ללא תקופת התחייבות.
```

**L232**

```
* **R-Money-7:** קמפיינים שלא הגיעו ליעד עם תאריך הסיום: התורמים מקבלים החזר אוטומטי **או** האפשרות לתרום לקופה הכללית של הארגון (החלטת התורם בעת התרומה).
```

**L233**

```
* **R-Money-8:** בקשת סיוע אישי לא תופיע בפיד הציבורי – לעולם.
```

**L234**

```
* **R-Money-9:** הקרן האישית / הציבורית ניתנת לפירוק וזיכוי בכל עת ללא תקופת המתנה.
```

**L235**

```
* **R-Money-10:** שיתוף תיק השקעות אימפקט הוא Opt-In בלבד; ברירת המחדל = פרטי.
```

**L239**

```
## 9. מסכים רלוונטיים
```

**L241**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L243**

```
| מסך                                         | תפקיד                                                            |
```

**L245**

```
| 5.5 Money Screen (Hub)                      | המסך הראשי של עולם הכסף – טוגל לתת/לקבל                          |
```

**L246**

```
| 5.5.1 Money Screen – Give Mode              | גלריית עמותות, סינון/מיון, כפתורי תרומה                          |
```

**L247**

```
| 5.5.2 Money Screen – Receive Mode           | בקשות סיוע אישי / פתיחת קמפיין (תלוי בתפקיד המשתמש)              |
```

**L248**

```
| 5.5.3 NGO Browse / List                     | רשימת עמותות עם מסננים מתקדמים                                    |
```

**L249**

```
| 5.5.4 Campaign Browse / List                | רשימת קמפיינים פעילים                                            |
```

**L250**

```
| 5.5.5 Campaign Detail                       | מסך פרטי קמפיין + תורמים + עדכוני סטטוס                          |
```

**L251**

```
| 5.5.6 Recurring Donations Manager           | ניהול הוראות קבע                                                  |
```

**L252**

```
| 5.5.7 Donor-Advised Fund Screen             | קרן אישית / ציבורית                                              |
```

**L253**

```
| 5.5.8 Impact Portfolio Screen               | תיק השקעות אימפקט                                                |
```

**L254**

```
| 5.5.9 Donation History & Receipts           | היסטוריית תרומות + קבלות                                          |
```

**L255**

```
| 5.5.10 Personal Aid Request Form            | טופס בקשת סיוע אישי                                              |
```

**L256**

```
| 5.5.11 Campaign Creation Form (Org)         | יצירת קמפיין ארגוני                                              |
```

**L257**

```
| 11.5 Donation Form Modal                    | מודאל תרומה (קיים ב-PRD; מועצם)                                  |
```

**L261**

```
## 10. זרימות משתמש רלוונטיות
```

**L263**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md). זרימות המתחילות ב-`F` נוספו בעדכון זה.
```

**L267**

```
## 11. התראות ייחודיות לעולם הכסף
```

**L269**

```
| טריגר                                  | סוג התראה   | יעד               |
```

**L271**

```
| חיוב הוראת קבע (24h לפני)              | תזכורת      | תורם              |
```

**L272**

```
| ביצוע חיוב הוראת קבע                   | אישור       | תורם              |
```

**L273**

```
| כשל בחיוב הוראת קבע                    | פעולה נדרשת | תורם              |
```

**L274**

```
| קמפיין שעוקבת אחריו פורסם              | עדכון       | תורם עוקב         |
```

**L275**

```
| תורם חדש הצטרף לקמפיין שלך             | עדכון       | מנהל ארגון        |
```

**L276**

```
| קמפיין הגיע ליעד                       | מערכת       | מנהל ארגון + תורמים |
```

**L277**

```
| בקשת סיוע אישי – מוקדן לקח בעלות       | עדכון       | מבקש              |
```

**L278**

```
| בקשת סיוע אישי – נמצא ארגון            | פעולה נדרשת | מבקש              |
```

**L279**

```
| תיק אימפקט שמשתמש עוקב אחריו עודכן     | עדכון       | עוקב              |
```

**L283**

```
## 12. מטריצת הרשאות בעולם הכסף
```

**L285**

```
| פעולה                            | חבר רגיל | חבר מאומת | מתנדב | עובד עמותה | מנהל ארגון | מוקדן | סופר אדמין |
```

**L287**

```
| תרומה חד-פעמית                   | ✅        | ✅         | ✅     | ✅          | ✅          | ✅     | ✅          |
```

**L288**

```
| הקמת הוראת קבע                   | ✅        | ✅         | ✅     | ✅          | ✅          | ✅     | ✅          |
```

**L289**

```
| יצירת קרן אישית                  | ✅ (₪500+ נדרש מאומת) | ✅ | ✅  | ✅          | ✅          | ✅     | ✅          |
```

**L290**

```
| יצירת קרן ציבורית                | ❌        | ✅         | ✅     | ✅          | ✅          | ✅     | ✅          |
```

**L291**

```
| שיתוף תיק אימפקט                 | ❌        | ✅         | ✅     | ✅          | ✅          | ✅     | ✅          |
```

**L292**

```
| פתיחת בקשת סיוע אישי             | ✅        | ✅         | ✅     | ✅          | ✅          | ✅     | ✅          |
```

**L293**

```
| פתיחת קמפיין ארגוני              | ❌        | ❌         | ❌     | ✅          | ✅          | ❌     | ✅          |
```

**L294**

```
| ניהול תורמים בארגון              | ❌        | ❌         | ❌     | ✅          | ✅          | ❌     | ✅          |
```

**L295**

```
| אישור עמותה לתרומות              | ❌        | ❌         | ❌     | ❌          | ❌          | ❌     | ✅          |
```

**L296**

```
| גישה ל-Audit Trail פיננסי        | ❌        | ❌         | ❌     | ❌          | ✅ (לארגון שלו) | ❌ | ✅       |
```

**L300**

```
## 13. מדדי הצלחה (KPIs)
```

**L302**

```
* סך כל תרומות חודשיות (₪).
```

**L303**

```
* מספר עמותות פעילות מקבלות תרומות.
```

**L304**

```
* מספר קמפיינים פעילים בו-זמנית.
```

**L305**

```
* מספר הוראות קבע פעילות.
```

**L306**

```
* יחס המרה: צפייה בעמותה → תרומה.
```

**L307**

```
* יחס המרה: בקשת סיוע אישי → סיוע מומש.
```

**L308**

```
* מספר משתמשים בעלי קרן אישית.
```

**L309**

```
* מספר משתמשים שמשתפים תיק אימפקט.
```

**L310**

```
* זמן ממוצע מטיפול מוקדן בבקשת סיוע ועד התאמה.
```

**L314**

```
## 14. מקרי קצה ושאלות פתוחות
```

**L316**

```
* **החזר תרומה (Refund):** מתי מותר ועל ידי מי? (תרומה כספית בדרך כלל סופית, אך טעות בסכום מצדיקה החזר תוך 24h).
```

**L317**

```
* **קרן ציבורית – ניהול קונפליקטים:** אם יוצר הקרן רוצה להעביר לעמותה X אבל המשתמשים שהצטרפו רוצים Y – מה ההכרעה?
```

**L318**

```
* **קמפיין שלא הגיע ליעד:** ברירת המחדל החזר אוטומטי או מעבר לקופה הכללית? (יוחלט בשלב התרומה ע"י התורם).
```

**L319**

```
* **מיסוי על הקרן הציבורית:** האם הקרן הציבורית נחשבת לישות עצמאית במס? (יחקרו עם רואה חשבון).
```

**L320**

```
* **בקשת סיוע אישי שלא נתפסה:** אם 7 ימים לא נמצא ארגון – מה ההמשך? (התראה למבקש + הצעה להעלות ל-Level 2).
```

**L321**

```
* **אנונימיות תרומות הוראת קבע:** האם ניתן להחליף שם תורם באמצע הוראת קבע פעילה?
```

**L325**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md) | [פיצ'רים](../03_Core_Features.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/02_Items.md`

**L3**

```
# 📦 עולם החפצים (Items World)
```

**L5**

```
**עולם תרומה #2** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.5`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם החפצים הוא **בסיס ה"תן וקח" של הפלטפורמה** – המנגנון הצרכני-קלאסי שבו משתמש אחד מציע חפץ פיזי שאינו זקוק לו, ומשתמש אחר זקוק לחפץ דומה. עולם זה הוא הוותיק והאינטואיטיבי ביותר בקהילה ולכן צריך להיות הקל ביותר לשימוש.
```

**L13**

```
**הצורך שהוא פותר:**
```

**L14**

```
* המוסר רוצה לגרוע פריט מהבית מבלי לזרוק אותו, ובלי טרחה לשווק אותו (פייסבוק / יד 2).
```

**L15**

```
* המקבל זקוק לפריט אך אינו יכול / אינו רוצה לקנות אותו.
```

**L16**

```
* פריטים יקרי-ערך עם ערך רגשי-קהילתי (ספרי לימוד, ציוד תינוקות, ריהוט) זוכים למחזור חיים שני.
```

**L18**

```
**פרסונות עיקריות:**
```

**L19**

```
* 👤 חבר קהילה כמוסר.
```

**L20**

```
* 👤 חבר קהילה כמקבל.
```

**L21**

```
* 🏢 מתנדב בארגון – מסייע באיסוף ושינוע חפצים גדולים.
```

**L25**

```
## 2. מודל הדואליות
```

**L27**

```
### 2.1 מצב לתת (Give Mode) – פרסום חפץ למסירה
```

**L29**

```
#### א. שדות חובה
```

**L30**

```
* **תמונות** (חובה לפחות אחת, מומלץ עד 5).
```

**L31**

```
* **כותרת** (קצרה, ויזואלית).
```

**L32**

```
* **תיאור** (מצב, גיל הפריט, סיבת המסירה).
```

**L33**

```
* **קטגוריה:** רהיטים / בגדים / ספרים / משחקים / ציוד תינוקות / מטבח / ספורט / חשמל / כלי עבודה / רפואי (יד שנייה) / אחר.
```

**L34**

```
* **מצב החפץ:** חדש / כמו חדש / טוב / בינוני / לתיקון.
```

**L35**

```
* **כתובת איסוף** (ברירת מחדל: כתובת המוסר).
```

**L36**

```
* **מנגנון מסירה:**
```

**L37**

```
    * **"כל הקודם זוכה" (FCFS):** ללא שריון – הראשון שמתאם איסוף מקבל.
```

**L38**

```
    * **"דורש אישור מוסר":** המוסר רואה את כל המעוניינים ובוחר.
```

**L39**

```
* **מידות / משקל** (אופציונלי, חשוב לחפצים גדולים – משפיע על מנגנון השינוע).
```

**L41**

```
#### ב. תהליך פרסום
```

**L42**

```
1. לחיצה על "+" → "מסירת חפץ".
```

**L43**

```
2. מילוי שדות + העלאת תמונות.
```

**L44**

```
3. בחירת מנגנון מסירה.
```

**L45**

```
4. **שאלה: "האם החפץ דורש שינוע?"** (כן / לא / אסכם בעצמי).
```

**L46**

```
5. פרסום ← הפוסט מופיע בפיד הראשי + במסך החפצים.
```

**L48**

```
#### ג. ניהול המודעה
```

**L49**

```
* **לוח בקרת מודעה:** רשימת מעוניינים, צ'אטים פתוחים, סטטוס (פעיל / נשמר ל-X / נמסר / סגור).
```

**L50**

```
* פעולות: עריכה, חידוש (Bump), סגירה ידנית, מחיקה.
```

**L54**

```
### 2.2 מצב לקבל (Receive Mode) – בקשת חפץ ספציפי
```

**L56**

```
* **תיאור הצורך:** "מחפש מקרר 4 דלתות במצב טוב לסטודנט", "אני זקוק למחשב נייד פעיל לילד".
```

**L57**

```
* **קטגוריה ומפרט מינימלי.**
```

**L58**

```
* **רמת אנונימיות:** ברירת מחדל **רמה 2 (עוקבים בלבד)** עבור בקשות צרכניות, אופציה לרמה 1 לבקשות רגישות (משפחה במצוקה).
```

**L59**

```
* **תהליך:** הבקשה מופיעה בפיד הראשי. מוסרים פוטנציאליים יוזמים צ'אט. המבקש בוחר.
```

**L60**

```
* **שילוב מוקד:** בקשה ברמה 1 זורמת אוטומטית לתור מוקדנים – המוקדן מחפש מתאימים.
```

**L64**

```
## 3. קטגוריות פנימיות
```

**L66**

```
| קטגוריה        | דוגמאות                                                  | חוקים מיוחדים                              |
```

**L68**

```
| רהיטים         | ספה, מיטה, ארון, שולחן                                   | הצעת שינוע אוטומטית                        |
```

**L69**

```
| בגדים          | מבוגרים, ילדים, תינוקות                                  | -                                          |
```

**L70**

```
| ספרים          | לימוד, ספרות, קומיקס, ילדים                              | -                                          |
```

**L71**

```
| משחקים         | ילדים, חברה, וידאו                                       | -                                          |
```

**L72**

```
| ציוד תינוקות   | עגלה, סלקל, מיטה, מציצה                                  | סימון "בטיחותי" – כיסא בטיחות לא יד שנייה |
```

**L73**

```
| מטבח           | קומקום, סיר, צלחות, מערבל                                | היגיינה – ניקוי לפני מסירה                |
```

**L74**

```
| ספורט          | אופניים, ציוד כושר, כדורים                               | -                                          |
```

**L75**

```
| חשמל           | מקרר, מכונת כביסה, מיקרוגל, טוסטר                        | יש להצהיר על תקינות                        |
```

**L76**

```
| כלי עבודה      | מקדחה, פטיש, סולם                                        | -                                          |
```

**L77**

```
| רפואי יד שנייה | כיסא גלגלים, הליכון, מכשיר שמיעה                         | מומלץ העברה דרך עולם הרפואה (3.5.7)        |
```

**L78**

```
| אחר            | פריטים שלא נכנסים לקטגוריה                                | -                                          |
```

**L82**

```
## 4. תהליכי ליבה
```

**L84**

```
### 4.1 מסירת חפץ עם איסוף עצמי
```

**L85**

```
1. מוסר מפרסם חפץ עם FCFS / "דורש אישור".
```

**L86**

```
2. מעוניין יוצר קשר.
```

**L87**

```
3. אישור (במקרה הצורך).
```

**L88**

```
4. תיאום זמן ומקום איסוף.
```

**L89**

```
5. סגירה ידנית או אוטומטית (לאחר 7 ימים מאיסוף).
```

**L91**

```
### 4.2 מסירת חפץ עם שינוע (חיבור לעולם הנסיעות 3.5.9)
```

**L92**

```
לאחר אישור מסירה, המערכת מציעה אוטומטית:
```

**L94**

```
* **חפץ קטן/בינוני:** "מצאנו 3 נסיעות פעילות באזור, האם להציע שינוע?"
```

**L95**

```
* **חפץ כבד/מורכב:** "החפץ דורש מתנדב נהג + סבל. לפתוח קריאה?"
```

**L96**

```
* **המשתמש יכול לסרב** ולתאם שינוע באופן עצמאי.
```

**L98**

```
ראה [`06_Rides.md#5`](./06_Rides.md) למודל השינוע המלא.
```

**L100**

```
### 4.3 בקשת חפץ → מסירה
```

**L101**

```
1. מבקש מפרסם בקשה.
```

**L102**

```
2. מוסרים פוטנציאליים מגלים בפיד / חיפוש.
```

**L103**

```
3. צ'אט פרטי.
```

**L104**

```
4. אישור המבקש.
```

**L105**

```
5. תהליך מסירה זהה ל-4.1 / 4.2.
```

**L109**

```
## 5. אינטגרציות חוצות-עולמות
```

**L111**

```
* **עולם הנסיעות (3.5.9):** מנגנון שינוע אוטומטי לחפצים גדולים.
```

**L112**

```
* **עולם המזון (3.5.6):** קטגוריות "ציוד מטבח" יכולות להוביל למשתמש שגם זקוק למזון – המלצות חוצות.
```

**L113**

```
* **עולם הרפואה (3.5.7):** ציוד רפואי יד-שנייה (יד שרה ודומותיה) יכול להופיע בשתי הקטגוריות.
```

**L114**

```
* **עולם הסביבה (3.5.13):** פריטים לפסולת אלקטרונית / פסולת מסוכנת מקבלים תיוג מיוחד.
```

**L118**

```
## 6. אינטגרציות חיצוניות
```

**L120**

```
* **שירותי גוגל מפות:** הצגת מיקום איסוף.
```

**L121**

```
* **שירותי תמונות:** דחיסה ואופטימיזציה.
```

**L125**

```
## 7. כללים עסקיים ייחודיים
```

**L127**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L129**

```
* **R-Items-1:** חובת תמונה אחת לפחות לכל פוסט נתינה.
```

**L130**

```
* **R-Items-2:** אסור פרסום פריטים מסוכנים (כלי נשק, חומרים מסוכנים, פריטים לא חוקיים).
```

**L131**

```
* **R-Items-3:** ציוד רפואי דורש סימון "תקין רפואית" / "מצריך בדיקה".
```

**L132**

```
* **R-Items-4:** פריטי ילדים בטיחותיים (כיסא בטיחות, מציצה, מיטת תינוק עם יותר מ-5 שנים) דורשים אזהרה ויזואלית.
```

**L133**

```
* **R-Items-5:** משך פוסט פעיל ברירת מחדל: 30 ימים. לאחר מכן הצעה לחידוש או ארכיון.
```

**L134**

```
* **R-Items-6:** לאחר אישור מסירה ב-FCFS, המודעה מוסתרת אוטומטית מהפיד.
```

**L138**

```
## 8. מסכים רלוונטיים
```

**L140**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L142**

```
| מסך                                | תפקיד                                          |
```

**L144**

```
| 5.4 Items Screen                   | המסך הראשי של עולם החפצים – לתת/לקבל            |
```

**L145**

```
| 4.3 Item Publish Screen            | טופס פרסום חפץ                                 |
```

**L146**

```
| 4.4 Item Details Modal             | מודאל פרטי חפץ                                 |
```

**L147**

```
| 4.5 Transport Prompt Modal         | הקפצת שינוע                                    |
```

**L148**

```
| 5.4.X Items Listing (Give Mode)    | רשימת חפצים לתת                                |
```

**L149**

```
| 5.4.Y Items Listing (Receive Mode) | רשימת בקשות חפצים                              |
```

**L153**

```
## 9. זרימות משתמש רלוונטיות
```

**L155**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L157**

```
* **זרימה 5:** מסירת חפץ עם שינוע.
```

**L158**

```
* **זרימה משלימה (חדשה):** בקשת חפץ ספציפי + תיווך מוקדן.
```

**L162**

```
## 10. התראות ייחודיות לעולם החפצים
```

**L164**

```
| טריגר                              | סוג         | יעד          |
```

**L166**

```
| מעוניין חדש בחפץ שפרסמת            | פעולה נדרשת | מוסר         |
```

**L167**

```
| מוסר אישר אותך כמקבל               | אישור       | מקבל         |
```

**L168**

```
| תזכורת לסגור פוסט נתינה (7d)       | תזכורת      | מוסר         |
```

**L169**

```
| חפץ מתאים לבקשה שלך הופיע          | עדכון       | מבקש (Active) |
```

**L170**

```
| הצעת שינוע אוטומטית לאחר אישור     | פעולה נדרשת | מוסר + מקבל   |
```

**L174**

```
## 11. מטריצת הרשאות
```

**L176**

```
| פעולה                  | חבר | מתנדב | מנהל ארגון | סופר אדמין |
```

**L178**

```
| פרסום חפץ              | ✅   | ✅     | ✅          | ✅          |
```

**L179**

```
| בקשת חפץ               | ✅   | ✅     | ✅          | ✅          |
```

**L180**

```
| הסרת חפץ של אחר        | ❌   | ❌     | ❌          | ✅          |
```

**L181**

```
| תיוג ספאם              | ✅   | ✅     | ✅          | ✅          |
```

**L185**

```
## 12. מדדי הצלחה
```

**L187**

```
* מספר חפצים שנמסרו בחודש.
```

**L188**

```
* יחס המרה: פרסום → מסירה.
```

**L189**

```
* זמן ממוצע מפרסום עד מסירה.
```

**L190**

```
* קטגוריות פעילות ביותר.
```

**L191**

```
* שיעור פוסטים שדרשו שינוע.
```

**L195**

```
## 13. מקרי קצה
```

**L197**

```
* **מוסר נטש:** מה אם המוסר לא הגיב 5 ימים אחרי "כל הקודם"? → פוסט מסומן "לא פעיל" ועובר לחזית הבאה.
```

**L198**

```
* **חפץ עם פגם בלתי מוצהר:** המקבל יכול לדווח, האלגוריתם לוקח בחשבון בדירוג המוסר.
```

**L199**

```
* **קטגוריות חופפות:** חפץ שיכול להיכנס לכמה קטגוריות (לדוגמה ספר משחק) – ניתן לתייג ב-2 קטגוריות.
```

**L203**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/03_Food.md`

**L3**

```
# 🍎 עולם המזון (Food World)
```

**L5**

```
**עולם תרומה #3** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.6`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם המזון הוא **המקבילה הביולוגית של עולם החפצים** – שיתוף משאב פיזי המעבר מבית לבית – אלא שהמשאב הזה **רגיש בזמן** ו**רגיש לבטיחות**. הצריכה הבטוחה של מזון תלויה בהיגיינה, חום, אלרגנים ותאריך תפוגה. בשונה מחפץ דומם, **כל פוסט מזון נתינה חייב לקבל "שעון מתקתק"** – לאחר תאריך התפוגה אסור למסור.
```

**L13**

```
**הצורך שהוא פותר:**
```

**L14**

```
* בית קפה / מסעדה / חתונה עם עודפי מזון ראויים – לחלק לקהילה במקום לזרוק.
```

**L15**

```
* משפחה במצוקה תזונתית – זוקקת חבילת מזון.
```

**L16**

```
* שכן עם עודפי בישול שבת – שיתוף עם מי שזקוק.
```

**L17**

```
* מטבחים חברתיים, לקט ישראל, פתחון לב – מערך גיוס מזון מאורגן.
```

**L19**

```
**פרסונות עיקריות:**
```

**L20**

```
* 👤 חבר קהילה ("שכן" שיש לו עודפי מזון מבישול בית).
```

**L21**

```
* 🏪 בעל עסק – מסעדה, בית קפה, אולם אירועים.
```

**L22**

```
* 🏢 ארגון איסוף מזון (לקט ישראל, ארגוני סיוע).
```

**L23**

```
* 👤 חבר קהילה במצוקה תזונתית.
```

**L27**

```
## 2. מודל הדואליות
```

**L29**

```
### 2.1 מצב לתת (Give Mode) – פרסום מזון לחלוקה
```

**L31**

```
#### א. שדות חובה
```

**L33**

```
* **תמונה** (חובה לפחות אחת – להראות מצב המזון).
```

**L34**

```
* **כותרת** ("ארוחת ערב לחמישה", "מאפיות ממאפייה", "צ'ולנט מבית בקדימה").
```

**L35**

```
* **תיאור:** רשימת המנות / סוגי המזון.
```

**L36**

```
* **סוג מזון:**
```

**L37**

```
    * **מבושל / מוכן לאכילה** (חימום מומלץ, צריכה תוך 24h).
```

**L38**

```
    * **ארוז / סגור** (תאריך התפוגה כפי שמופיע על האריזה).
```

**L39**

```
    * **טרי שאינו מבושל** (פירות, ירקות, לחמים).
```

**L40**

```
    * **קפוא** (יציין שעת הוצאה מהמקפיא).
```

**L41**

```
    * **שתייה / מוצרים יבשים.**
```

**L42**

```
* **כמות:** מספר מנות / משקל / יחידות.
```

**L43**

```
* **🚨 תאריך תפוגה (חובה!):** תאריך + שעה. בברירת מחדל לפי סוג המזון:
```

**L44**

```
    * מבושל: 24h מהבישול.
```

**L45**

```
    * טרי לא מבושל: 3‑5 ימים.
```

**L46**

```
    * ארוז: לפי תאריך על האריזה.
```

**L47**

```
    * קפוא: לפי תאריך הקפאה ויעד צריכה.
```

**L48**

```
* **אלרגנים:** סימון רכיבי אלרגיה נפוצים (גלוטן, חלב, אגוזים, סויה, ביצים, דגים, בעלי חיים, סולפיטים).
```

**L49**

```
* **כשרות:** כשר / לא כשר / חלבי / בשרי / פרווה / מהדרין / אחר.
```

**L50**

```
* **הגבלות תזונה:** טבעוני, צמחוני, ללא גלוטן, פלאו, קטוגני, וכו'.
```

**L51**

```
* **תנאי שמירה / היגיינה:** "נשמר במקרר עד הזמן Y", "טופל בכפפות", "בושל בתוך 4h האחרונות".
```

**L52**

```
* **כתובת איסוף + שעת איסוף.**
```

**L53**

```
* **מנגנון מסירה:** "כל הקודם זוכה" / "דורש אישור מוסר" (זהה לחפצים).
```

**L54**

```
* **מסעדה/עסק (אופציונלי):** האם המזון מגיע מעסק רשום? אם כן, רישוי משרד הבריאות.
```

**L56**

```
#### ב. אזהרת בטיחות לפני פרסום
```

**L57**

```
לפני לחיצה על "פרסם", המשתמש רואה אזהרה:
```

**L58**

```
> "אסור לפרסם מזון מקולקל או מעבר לתאריך התפוגה. את/ה אחראי/ת על איכות המזון. במידה והמזון מגיע מעסק – יש לוודא רישוי משרד הבריאות."
```

**L59**

```
משתמש חייב לאשר לפני שהפוסט מתפרסם.
```

**L61**

```
#### ג. תהליך פרסום
```

**L62**

```
זהה ל[חפצים (4.1)](./02_Items.md) אך עם **שעון תפוגה**:
```

**L64**

```
* פוסט נתינה מקבל סטטוס פעיל **רק עד תאריך התפוגה**.
```

**L65**

```
* X שעות לפני התפוגה (ברירת מחדל 6h): הפוסט מקבל **סימון "דחוף!"** ובאלגוריתם הפיד הוא מועלה למעלה.
```

**L66**

```
* בתום זמן התפוגה: הפוסט נסגר אוטומטית, סטטוס "תפוגה – לא נמסר".
```

**L70**

```
### 2.2 מצב לקבל (Receive Mode) – בקשת מזון
```

**L72**

```
#### א. בקשה אישית
```

**L73**

```
* בקשה משפחה במצוקה תזונתית: סוג מצוקה, מספר נפשות, אזור.
```

**L74**

```
* רמת אנונימיות: ברירת מחדל **רמה 1 (מוקדנים)**, אופציה לרמה 2.
```

**L75**

```
* תהליך: זרם למוקד → התאמה לארגון מזון מתאים (פתחון לב, לקט ישראל וכו').
```

**L77**

```
#### ב. בקשה ארגונית
```

**L78**

```
* ארגון מזון מפרסם בקשת איסוף מזון לבית תמחוי / מועדון יום.
```

**L79**

```
* רמת אנונימיות 3 (פומבי).
```

**L80**

```
* קישור לעולם הזמן (3.5.11) – גם ארגון מזון מבקש מתנדבים.
```

**L84**

```
## 3. קטגוריות פנימיות
```

**L86**

```
| קטגוריה            | דוגמאות                            | חוקים מיוחדים                          |
```

**L88**

```
| מבושל מוכן         | ארוחה, מנה אישית, סלט              | 24h תפוגה, אזהרה הקפדנית               |
```

**L89**

```
| טרי לא מבושל       | פירות, ירקות, לחם טרי              | 3‑5 ימים תפוגה                         |
```

**L90**

```
| ארוז וסגור         | יוגורט, חלב, מוצרי מדף             | לפי תאריך על האריזה                    |
```

**L91**

```
| קפוא               | מאפים קפואים, ארוחות קפואות        | מועד הוצאה + יעד צריכה                 |
```

**L92**

```
| שתייה              | מים, מיצים, חלב                    | -                                      |
```

**L93**

```
| יבש                | אורז, פסטה, קמח, אבקת חלב          | תפוגה ארוכה                            |
```

**L94**

```
| מאפים              | חלות, עוגות, לחמניות               | 1‑2 ימים, רגיש להיגיינה                |
```

**L95**

```
| קייטרינג / חתונה   | משתתפי אירוע, מזון אישי באריזה     | בדיקת הקפדה, מוצא ברור                 |
```

**L96**

```
| תרומה ארגונית      | חבילת מזון בסיסית מארגון           | שדה ייעודי "ארגון מקור"                |
```

**L100**

```
## 4. שדות פוסט (השוואה לחפצים)
```

**L102**

```
המנגנון דומה ל[חפצים](./02_Items.md), אך עם הוספת/דגש על:
```

**L104**

```
| שדה                | חפצים | מזון      |
```

**L106**

```
| תאריך תפוגה        | -     | **חובה**  |
```

**L107**

```
| אלרגנים            | -     | **חובה (אופציה לסמן "אין")** |
```

**L108**

```
| כשרות              | -     | חובה (אופציה "לא רלוונטי") |
```

**L109**

```
| הגבלות תזונה       | -     | אופציונלי |
```

**L110**

```
| תנאי שמירה         | -     | מומלץ     |
```

**L111**

```
| מקור (עסק/בית)     | -     | חובה      |
```

**L115**

```
## 5. תהליכי ליבה
```

**L117**

```
### 5.1 פרסום מזון "אקספרס" (מצב נפוץ ביותר)
```

**L118**

```
1. בעל עסק/שכן רואה שיש לו עודפי מזון.
```

**L119**

```
2. לוחץ "+" → "מזון" → "פרסום מהיר".
```

**L120**

```
3. ברירות מחדל: כתובת = שלי, מנגנון = FCFS, סוג = מבושל, תפוגה = +24h.
```

**L121**

```
4. צילום + כותרת קצרה + אישור אזהרת בטיחות.
```

**L122**

```
5. פרסום ← חיפוש מזון פעיל באזור עולה כתוצאה.
```

**L124**

```
### 5.2 פרסום מזון מקייטרינג / אירוע
```

**L125**

```
* טופס מורחב יותר עם מקור, רישוי, אלרגנים מפורטים.
```

**L126**

```
* אופציה לפרסם **לכל קהילת אזור הסוג** (Push למשתמשים מבקשי מזון פעילים).
```

**L128**

```
### 5.3 בקשת מזון
```

**L129**

```
1. משתמש פרטי / ארגון מפרסם בקשה.
```

**L130**

```
2. נתינות פוטנציאליות מגיעות בצ'אט / Push.
```

**L131**

```
3. תיאום איסוף.
```

**L133**

```
### 5.4 שילוב עם נסיעות (3.5.9)
```

**L134**

```
* מזון רגיש בזמן יכול לבקש שינוע מהיר.
```

**L135**

```
* "נסיעה דחופה לאיסוף 50 ארוחות עד שעה Y".
```

**L136**

```
* מתנדב נהג עם רכב מקבל הצעה.
```

**L138**

```
### 5.5 שילוב עם זמן (3.5.11)
```

**L139**

```
* ארגון מזון מציע משימת התנדבות "חלוקת חבילות מזון מחר ב-15:00 בשכונת X".
```

**L143**

```
## 6. אינטגרציות חוצות-עולמות
```

**L145**

```
* **עולם החפצים (3.5.5):** כלי מטבח / מקרר / קופסאות אחסון – ניתן להציע במקביל.
```

**L146**

```
* **עולם הנסיעות (3.5.9):** מנגנון שינוע דחוף.
```

**L147**

```
* **עולם הזמן (3.5.11):** משימות התנדבות סביב חלוקת מזון.
```

**L148**

```
* **עולם הכסף (3.5.4):** עמותות מזון יכולות לפתוח קמפיין כספי במקביל.
```

**L149**

```
* **שידוכים (3.4):** בקשת מזון ברגישות גבוהה זורמת אוטומטית למוקד.
```

**L153**

```
## 7. אינטגרציות חיצוניות
```

**L155**

```
* **משרד הבריאות:** אימות רישוי לעסקי מזון (אופציונלי).
```

**L156**

```
* **לקט ישראל / פתחון לב / ארגוני מזון:** אינטגרציית API לקבלת בקשות איסוף.
```

**L157**

```
* **שירותי מפות.**
```

**L161**

```
## 8. כללים עסקיים ייחודיים
```

**L163**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L165**

```
* **R-Food-1:** **כל פוסט נתינה חייב לקבל תאריך תפוגה תקף לסוג המזון.** המערכת לא מאפשרת פרסום ללא תאריך.
```

**L166**

```
* **R-Food-2:** **אסור לאפשר מסירת מזון לאחר תאריך התפוגה.** המערכת חוסמת אוטומטית את הפוסט.
```

**L167**

```
* **R-Food-3:** המוסר חייב לאשר אזהרת בטיחות לפני כל פרסום.
```

**L168**

```
* **R-Food-4:** סימון אלרגנים חובה (אופציה "אין רכיבי אלרגיה נפוצים").
```

**L169**

```
* **R-Food-5:** עסק רשום חייב להציג רישוי משרד הבריאות (אופציונלי בקהילה אך מומלץ).
```

**L170**

```
* **R-Food-6:** דיווח על מזון מקולקל = השעיית פוסט מיידית + בדיקה של מנהל מערכת.
```

**L171**

```
* **R-Food-7:** משתמש שדווח 3 פעמים על מזון מקולקל = השעיית הרשאת פרסום מזון לחודש.
```

**L172**

```
* **R-Food-8:** מזון לתינוקות וילדים < 3 דורש אזהרה ויזואלית מיוחדת.
```

**L176**

```
## 9. מסכים רלוונטיים
```

**L178**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L180**

```
| מסך                                | תפקיד                              |
```

**L182**

```
| 5.X.1 Food Screen (Hub)            | מסך ראשי של עולם המזון              |
```

**L183**

```
| 5.X.2 Food Screen – Give Mode      | רשימת מזון לחלוקה (לפי תפוגה דחופה) |
```

**L184**

```
| 5.X.3 Food Screen – Receive Mode   | בקשות מזון פעילות                  |
```

**L185**

```
| 5.X.4 Food Publish Form            | טופס פרסום מזון                    |
```

**L186**

```
| 5.X.5 Food Details Modal           | פרטי פוסט מזון + אזהרות            |
```

**L187**

```
| 5.X.6 Food Allergens Selector      | רכיב בחירת אלרגנים                 |
```

**L191**

```
## 10. זרימות משתמש רלוונטיות
```

**L193**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L195**

```
* **F6:** פרסום מזון מהיר עם תפוגה.
```

**L196**

```
* **F7:** בקשת מזון ארגונית + שילוב נסיעה.
```

**L200**

```
## 11. התראות ייחודיות
```

**L202**

```
| טריגר                                  | סוג         | יעד          |
```

**L204**

```
| מזון בקרבתי פורסם (לפי תחום עניין)     | עדכון       | מקבל פוטנציאלי |
```

**L205**

```
| מזון מתחיל להתקרב לתפוגה (6h)          | דחיפות      | מוסר ומקבלים פוטנציאליים |
```

**L206**

```
| מזון פג תוקף ולא נמסר                  | מערכת       | מוסר          |
```

**L207**

```
| דיווח על מזון מקולקל                   | פעולה נדרשת | מנהל מערכת   |
```

**L211**

```
## 12. מטריצת הרשאות
```

**L213**

```
| פעולה                  | חבר | חבר מאומת | בעל עסק (סטטוס) | מנהל ארגון | סופר אדמין |
```

**L215**

```
| פרסום מזון מבית        | ✅   | ✅         | ✅               | ✅          | ✅          |
```

**L216**

```
| פרסום מזון מעסק רשום   | ❌   | ❌         | ✅               | ✅          | ✅          |
```

**L217**

```
| בקשת מזון אישית        | ✅   | ✅         | ✅               | ✅          | ✅          |
```

**L218**

```
| בקשת מזון ארגונית      | ❌   | ❌         | ❌               | ✅          | ✅          |
```

**L219**

```
| השעיית פוסט מקולקל     | ❌   | ❌         | ❌               | ❌          | ✅          |
```

**L223**

```
## 13. מדדי הצלחה
```

**L225**

```
* קילוגרמים של מזון שניצלו (ולא נזרקו).
```

**L226**

```
* מספר ארוחות שחולקו.
```

**L227**

```
* יחס פוסט פג-תוקף ללא מסירה.
```

**L228**

```
* זמן ממוצע מפרסום עד איסוף.
```

**L229**

```
* מספר משפחות שקיבלו סיוע מזון אישי.
```

**L233**

```
## 14. מקרי קצה
```

**L235**

```
* **מזון מבושל ללא ידיעת רכיבים מדויקת:** סימון "מבושל ביתי, מקור גמיש" + אזהרה.
```

**L236**

```
* **תפוגה דחופה (פחות משעה):** Push מיוחד למקבלים פוטנציאליים בקרבת מקום.
```

**L237**

```
* **פוסט שעבר תפוגה אך נמסר בפועל קודם:** האחריות על המוסר; פוסט נסגר.
```

**L238**

```
* **דיווח שקרי על מזון מקולקל:** המערכת בודקת היסטוריית המדווח – אם דפוס שקרי, סנקציה.
```

**L239**

```
* **תרומת חלב אם:** קטגוריה רגישה הדורשת אישור רפואי – מטופל בעולם הרפואה (3.5.7).
```

**L243**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/04_Medical.md`

**L3**

```
# ⚕️ עולם הרפואה (Medical World)
```

**L5**

```
**עולם תרומה #4** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.7`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם הרפואה הוא **שונה מהותית מכל שאר עולמות התרומה**. בניגוד לחפצים / מזון / כסף, **המשתמשים אינם תורמים ישירות זה לזה**. הם משמשים כ"שער מאומת" המחבר אזרחים פוטנציאליים לתרומה אל **גופי רפואה רשמיים** המבצעים את הפעולה הקלינית בפועל.
```

**L13**

```
**הצורך שהוא פותר:**
```

**L14**

```
* תרומות דם דורשות תיאום פיזי עם תחנות מד"א – אזרח רוצה לתרום ולא יודע איפה ומתי.
```

**L15**

```
* רישום לתרומת אברים לאחר המוות (אדי) הוא תהליך משפטי-רפואי הדורש חתימה רשמית.
```

**L16**

```
* תרומות בחיים (כיליה, מח עצם, פלזמה, חלב אם) דורשות מסלול רפואי מורכב.
```

**L17**

```
* גופי רפואה לעיתים זקוקים בדחיפות לתרומת דם מסוג ספציפי באזור ספציפי.
```

**L18**

```
* ציוד רפואי שמיש (כיסא גלגלים, הליכון) שעובר ידיים יכול להציל חיים.
```

**L20**

```
**פרסונות עיקריות:**
```

**L21**

```
* 👤 חבר קהילה כתורם פוטנציאלי (דם, אברים, ציוד).
```

**L22**

```
* 👤 חבר קהילה כמשתמש בציוד רפואי (חולה, נכה, קשיש).
```

**L23**

```
* ⚕️ גוף רפואה רשמי (מד"א, בית חולים, יד שרה, אגודות מתנדבים בתחום הרפואה).
```

**L24**

```
* ⚙️ מנהל מערכת – מאשר ומוודא קישוריות מאומתת לגופי רפואה.
```

**L28**

```
## 2. מודל הדואליות
```

**L30**

```
### 2.1 מצב לתת (Give Mode) – הצעת תרומה רפואית
```

**L32**

```
המסך הראשי במצב "לתת" מציג **4 מסלולים מרכזיים**:
```

**L34**

```
#### א. תרומת דם
```

**L35**

```
* **תיאום תור:** רשימת תחנות מד"א + יחידות ניידות + ימי תרומה בבתי חולים.
```

**L36**

```
* **סינון:** מיקום, שעות פעילות, סוג היחידה (קבועה / ניידת).
```

**L37**

```
* **מסך פגישה:** בחירת תאריך ושעה זמינים, אישור. הזמן מסונכרן עם מערכת מד"א.
```

**L38**

```
* **הצהרה רפואית:** טופס בריאות לפני התרומה (לפי דרישות מד"א).
```

**L39**

```
* **תזכורות:** 24h לפני, 1h לפני, יום אחרי "תודה".
```

**L40**

```
* **היסטוריה אישית:** כל התרומות שביצעת, סוג דם, תאריכים, האם זכאי לתעודת תורם דם.
```

**L42**

```
#### ב. תרומת אברים לאחר המוות (טופס אדי)
```

**L43**

```
* **מילוי טופס אדי דיגיטלי:** טופס רשמי עם חתימה אלקטרונית.
```

**L44**

```
* **אישור משפטי:** לפני מילוי – מסך הסבר משפטי-רפואי, בחירת רכיבים (כל האברים / בחירה ספציפית), אישור הבנה, חתימה דיגיטלית.
```

**L45**

```
* **רישום במאגר:** לאחר מילוי, הרישום עובר לאדי המאגר הלאומי, אישור חזרה למשתמש.
```

**L46**

```
* **כרטיס דיגיטלי:** המשתמש מקבל "כרטיס תורם" דיגיטלי לארנק האפליקציה.
```

**L47**

```
* **אופציה לבטל:** ניתן לבטל בכל עת דרך מסך פרופיל → רפואה.
```

**L48**

```
* **שיתוף משפחתי:** הצעה לשתף עם בני משפחה (דרישה משפטית – רק יידוע, לא חתימה).
```

**L50**

```
#### ג. תרומה בחיים
```

**L51**

```
חמש תת-קטגוריות, כל אחת עם מסלול שונה:
```

**L53**

```
* **תרומת כיליה:** הצהרת רצון, פנייה לבית חולים מתאם.
```

**L54**

```
* **מח עצם:** רישום כתורם פוטנציאלי במאגר עזר מציון.
```

**L55**

```
* **פלזמה:** תיאום עם מד"א.
```

**L56**

```
* **חלב אם:** רישום לבנק חלב לאומי.
```

**L57**

```
* **שיער (לפאות חולי סרטן):** רישום לעמותת זכרון מנחם / זיכרון בן.
```

**L59**

```
לכל מסלול:
```

**L60**

```
* טופס הצהרת רצון.
```

**L61**

```
* קישור לגוף הרשמי הרלוונטי.
```

**L62**

```
* תהליך בדיקות רפואיות מתוזמן (מנוהל ע"י הגוף הרלוונטי, לא ע"י Karma Community).
```

**L64**

```
#### ד. ציוד רפואי שמיש
```

**L65**

```
* פרסום פריט רפואי יד שנייה תקין (כיסא גלגלים, הליכון, מקל הליכה, כריות אורתופדיות, מכשירי שמיעה).
```

**L66**

```
* כל פוסט מתויג אוטומטית גם בעולם החפצים (3.5.5) להגדלת חשיפה.
```

**L67**

```
* **ייעוד:** העברה לעמותות מתאימות (יד שרה, ארגוני שיקום) באישור הסכמת המוסר.
```

**L68**

```
* **שדה חובה:** "האם הציוד נבדק תקין רפואית?" (כן / לא / לא ידוע).
```

**L72**

```
### 2.2 מצב לקבל (Receive Mode) – בקשות רפואיות
```

**L74**

```
#### א. בקשות של גופי רפואה
```

**L75**

```
* **תרומת דם דחופה:** מד"א מפרסם קריאה לסוג דם ספציפי באזור ספציפי. Push למשתמשים מתאימים בקרבת מקום.
```

**L76**

```
* **קריאה לציוד רפואי:** עמותה (יד שרה) זקוקה לפריט מסוים – פוסט מופיע בעולם הרפואה ובעולם החפצים.
```

**L78**

```
#### ב. בקשות אישיות
```

**L79**

```
* **חיפוש מתנדב לליווי לבדיקה / טיפול:** משתמש מבקש ליווי פיזי לבית חולים. רמת אנונימיות 2 בברירת מחדל.
```

**L80**

```
* **בקשת ציוד רפואי שמיש:** משתמש זקוק לכיסא גלגלים, הליכון וכו'.
```

**L81**

```
* **תרומת דם דחופה לחולה ספציפי:** משפחה מבקשת תרומת דם בבית חולים מסוים – פוסט עם הסבר וקישור לתחנת התרומה.
```

**L85**

```
## 3. קטגוריות פנימיות
```

**L87**

```
| קטגוריה              | תת-קטגוריות                          | חוקי מאומתות                               |
```

**L89**

```
| תרומת דם             | רגיל / דחוף                          | רק דרך גופי רפואה רשמיים                   |
```

**L90**

```
| תרומת אברים          | אדי / בחיים (כיליה, מח, פלזמה, חלב)  | אישור משפטי + חתימה דיגיטלית               |
```

**L91**

```
| ציוד רפואי שמיש      | ניוד / שמיעה / אורתופדיה / אחר       | סימון "תקין" + הצהרת מוסר                  |
```

**L92**

```
| ליווי רפואי          | בדיקה / טיפול / אשפוז / אבחון        | אימות "וי כחול" חובה לליווי                |
```

**L93**

```
| תרומה כספית רפואית   | מחקר / רכישת ציוד / תמיכה במשפחה     | זורם דרך עולם הכסף (3.5.4)                 |
```

**L97**

```
## 4. שדות פוסט / פעולה
```

**L99**

```
הרבה פעולות בעולם הרפואה הן **תיאום עם מערכת חיצונית**, לא פוסטים רגילים. השדות משתנים:
```

**L101**

```
| פעולה                | שדות מיוחדים                                            |
```

**L103**

```
| תיאום תור תרומת דם   | סוג דם (אופציונלי), מיקום, תאריך, שעה, הצהרת בריאות      |
```

**L104**

```
| מילוי טופס אדי       | זהות, חתימה, בחירת אברים, אישור הבנה                    |
```

**L105**

```
| תרומה בחיים          | סוג, גוף רפואה רלוונטי, צירוף מסמכים רפואיים אופציונלי   |
```

**L106**

```
| ציוד שמיש            | תמונות, מצב, היסטוריה רפואית של הציוד                   |
```

**L107**

```
| בקשת ליווי           | תאריך/שעה, מיקום בית חולים, רגישות (חולה? קשיש?)        |
```

**L111**

```
## 5. תהליכי ליבה
```

**L113**

```
ראה זרימות מלאות [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L115**

```
* **F8:** תרומת דם – תיאום תור.
```

**L116**

```
* **F9:** מילוי טופס אדי + רישום במאגר הלאומי.
```

**L117**

```
* **F10:** קריאת חירום לתרומת דם (Push למתאימים).
```

**L118**

```
* **F-extra:** בקשת ליווי לבדיקה רפואית.
```

**L122**

```
## 6. אינטגרציות חוצות-עולמות
```

**L124**

```
* **עולם החפצים (3.5.5):** ציוד רפואי שמיש מופיע בשני העולמות.
```

**L125**

```
* **עולם הזמן (3.5.11):** ליווי לבדיקות מקושר להתנדבויות.
```

**L126**

```
* **עולם הכסף (3.5.4):** קמפיינים למחקר / ציוד.
```

**L127**

```
* **עולם הנסיעות (3.5.9):** הסעה לתחנת תרומה / בית חולים.
```

**L128**

```
* **שידוכים (3.4):** בקשות רגישות (תרומה בחיים, ליווי לחולה אונקולוגי) ברמה 1.
```

**L132**

```
## 7. אינטגרציות חיצוניות (קריטיות!)
```

**L134**

```
* **מד"א (Magen David Adom):** API לתורי תרומת דם, היחידות הניידות, קריאות חירום.
```

**L135**

```
* **אדי (ADI – המאגר הלאומי לתרומות אברים):** API לרישום וביטול הרישום, אימות.
```

**L136**

```
* **עזר מציון:** מאגר תורמי מח עצם.
```

**L137**

```
* **בנק חלב לאומי.**
```

**L138**

```
* **יד שרה ועמותות שיקום:** קליטת ציוד שמיש.
```

**L139**

```
* **בתי חולים מרכזיים:** API לתורים ולמתנדבי ליווי.
```

**L141**

```
> **חוק מערכת:** כל פעולה רפואית סופית **חייבת** לעבור דרך גוף רפואה רשמי. אין "תרומה רפואית בין משתמשים" ישירה במערכת.
```

**L145**

```
## 8. כללים עסקיים ייחודיים
```

**L147**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L149**

```
* **R-Med-1:** רק משתמש "וי כחול" יכול לבצע פעולות רפואיות (תיאום תורים, אדי, תרומה בחיים, ליווי).
```

**L150**

```
* **R-Med-2:** **כל פעולת תרומת אברים דורשת אישור משפטי-רפואי + חתימה דיגיטלית מאומתת.** השלמת הטופס יוצרת רישום בלתי-הפיך עד שהמשתמש פעיל מבטל.
```

**L151**

```
* **R-Med-3:** קריאת חירום לתרומת דם נשלחת רק למשתמשים בעלי **סוג דם תואם + מיקום בקרבת תחנת התרומה (≤ 30 ק"מ)**.
```

**L152**

```
* **R-Med-4:** תרומת דם – המשתמש חייב להצהיר שהוא עומד בקריטריוני בריאות (אין הריון, אין מחלה זיהומית, וכו'). שקר מהווה הפרת תקנון.
```

**L153**

```
* **R-Med-5:** ציוד רפואי שמיש לא יכול להיות מוצע ללא הצהרת תקינות. ציוד מסוכן (מחטים, תרופות) אסור לפרסום.
```

**L154**

```
* **R-Med-6:** **אסור** לקיים תרומה בין משתמשים פרטיים ללא תיווך גוף רפואה (למעט ציוד שמיש).
```

**L155**

```
* **R-Med-7:** Audit Trail מורחב: כל פעולת אדי, תרומת דם, רישום למאגר – נשמר לעד.
```

**L156**

```
* **R-Med-8:** ביטול רישום אדי / מאגר תרומה דורש אימות "וי כחול" + שאלת אבטחה (לוודא לא בוט / טעות).
```

**L160**

```
## 9. מסכים רלוונטיים
```

**L162**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L164**

```
| מסך                                       | תפקיד                                          |
```

**L166**

```
| 5.X.1 Medical Screen (Hub)                | מסך ראשי – טוגל לתת/לקבל                       |
```

**L167**

```
| 5.X.2 Blood Donation Appointment Screen   | תיאום תור תרומת דם                             |
```

**L168**

```
| 5.X.3 ADI Form Screen                     | טופס אדי דיגיטלי                               |
```

**L169**

```
| 5.X.4 Living Donation Screen              | תרומה בחיים – 5 מסלולים                        |
```

**L170**

```
| 5.X.5 Medical Equipment Listing           | רשימת ציוד רפואי                               |
```

**L171**

```
| 5.X.6 Emergency Blood Call Screen         | קריאת חירום לתרומת דם                          |
```

**L172**

```
| 5.X.7 Donor Card (Wallet)                 | כרטיס תורם דיגיטלי                             |
```

**L176**

```
## 10. זרימות משתמש רלוונטיות
```

**L178**

```
* **F8:** תרומת דם.
```

**L179**

```
* **F9:** מילוי טופס אדי.
```

**L180**

```
* **F10:** קריאת חירום.
```

**L184**

```
## 11. התראות ייחודיות
```

**L186**

```
| טריגר                                          | סוג         | יעד                  |
```

**L188**

```
| תור תרומת דם (תזכורת 24h)                      | תזכורת      | תורם                 |
```

**L189**

```
| תזכורת לפני תרומה (1h)                         | תזכורת      | תורם                 |
```

**L190**

```
| הודעת תודה (24h אחרי)                          | עדכון       | תורם                 |
```

**L191**

```
| **קריאת חירום לתרומת דם** (סוג + אזור תואם)    | חירום       | תורמים פוטנציאליים  |
```

**L192**

```
| אישור רישום אדי                                | אישור       | תורם                 |
```

**L193**

```
| תאריך תפוגת רישום (3 שנים – חידוש)             | תזכורת      | תורם                 |
```

**L194**

```
| ציוד רפואי מתאים פורסם                         | עדכון       | מבקש פעיל            |
```

**L198**

```
## 12. מטריצת הרשאות
```

**L200**

```
| פעולה                              | חבר רגיל | חבר מאומת | מתנדב | מנהל ארגון | סופר אדמין |
```

**L202**

```
| תיאום תור תרומת דם                 | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L203**

```
| מילוי אדי                          | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L204**

```
| תרומה בחיים (פנייה ראשונית)        | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L205**

```
| הצעת ציוד רפואי שמיש               | ✅        | ✅         | ✅     | ✅          | ✅          |
```

**L206**

```
| בקשת ליווי לבדיקה                  | ✅        | ✅         | ✅     | ✅          | ✅          |
```

**L207**

```
| התנדבות לליווי רפואי               | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L208**

```
| פרסום קריאת חירום לתרומת דם        | ❌        | ❌         | ❌     | ✅ (ארגון רפואי בלבד) | ✅ |
```

**L212**

```
## 13. מדדי הצלחה
```

**L214**

```
* מספר תורי תרומת דם שתואמו דרך הפלטפורמה.
```

**L215**

```
* מספר תורמי דם פעילים חודשיים.
```

**L216**

```
* מספר רישומי אדי חדשים בחודש.
```

**L217**

```
* קריאות חירום שהובילו לתרומה בפועל.
```

**L218**

```
* פריטי ציוד רפואי שעברו לעמותות.
```

**L219**

```
* זמן ממוצע מקריאת חירום ועד הגעת תורם לתחנה.
```

**L223**

```
## 14. מקרי קצה
```

**L225**

```
* **משתמש שלא הופיע לתור תרומת דם:** התראה לחזור לתאם, סטטיסטיקה (אך ללא סנקציה).
```

**L226**

```
* **תורם דם עם סטטוס "לא כשיר זמני" (טסטו אחרי שיניים, נסיעה לחו"ל):** המערכת חוסמת זמנית את התיאום עד תום התקופה.
```

**L227**

```
* **טופס אדי – חזרה בה לאחר שנים:** ניתן לבטל בכל עת. הביטול יזרום למאגר הלאומי.
```

**L228**

```
* **קריאת חירום בלילה:** Push בלילה רק אם הוגדר Opt-In ב"דחיפות חירום".
```

**L229**

```
* **ציוד רפואי שלא תקין:** דיווח של מקבל לאחר קבלה → השעיית פוסט + בדיקה.
```

**L230**

```
* **תרומת חלב אם מאם חולת זיהום:** המערכת לא מאפשרת – גוף הרפואה הוא הבודק.
```

**L234**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/05_Housing.md`

**L3**

```
# 🏠 עולם הדיור / האירוח (Housing World)
```

**L5**

```
**עולם תרומה #5** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.8`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם הדיור הוא **גרסה קהילתית-פילנתרופית של Couchsurfing**, ממוקדת לשלוש פרסונות מקבל מובחנות:
```

**L13**

```
1. **שביליסטים** – אנשים שעושים מסע ארוך (שביל ישראל, שביל הסביב כנרת, שביל הר ועוד) ומחפשים מקום לינה / שירותים בסיסיים בצמתים שונים.
```

**L14**

```
2. **חסרי בית** – אנשים במצוקת דיור זמנית או ממושכת.
```

**L15**

```
3. **אורחים רגילים** – משתמשים שמטיילים, בדרך לטיפול רפואי, מבקרים משפחה, וכו'.
```

**L17**

```
**מצד הנותן (המארח):** משתמשים שיש להם דירה / חדר / שטח / ספה ומוכנים להעמיד אותו לשימוש קהילתי בזמני בחירתם.
```

**L19**

```
**הצורך שהוא פותר:**
```

**L20**

```
* שביליסטים מבזבזים זמן וכסף על מקומות לינה לאורך מסלולים קשים.
```

**L21**

```
* חסרי בית – פתרון אנושי-מכבד לחירום.
```

**L22**

```
* אנשים בעלי דירות גדולות / שטחים – רוצים לתרום שטח אך לא יודעים איך.
```

**L23**

```
* פלטפורמות מסחריות (Airbnb, Booking) הן לא ידידותיות לתרומה ללא תשלום.
```

**L25**

```
**פרסונות עיקריות:**
```

**L26**

```
* 👤 חבר קהילה כמארח (בעל דירה / חדר / שטח).
```

**L27**

```
* 👤 חבר קהילה כאורח – שביליסט.
```

**L28**

```
* 👤 חבר קהילה כאורח – חסר בית / במצוקה.
```

**L29**

```
* 👤 חבר קהילה כאורח – רגיל (מטייל, אורח עיר).
```

**L30**

```
* 🏢 ארגון סיוע לחסרי בית (לאלה, לתת) – מתאם בקשות אירוח חירום.
```

**L34**

```
## 2. מודל הדואליות
```

**L36**

```
### 2.1 מצב לתת (Give Mode) – הצעת אירוח
```

**L38**

```
#### א. שלושה מודלים של הצעה
```

**L40**

```
##### א.1 חלון זמן קבוע / חוזר (Recurring Slot)
```

**L41**

```
"אני מציע חדר בבית שלי בלילות שלישי, בתיאום מראש."
```

**L43**

```
* **שדות:** סוג מקום (חדר במשפחה / חדר במשרד / דירה שלמה / ספה / שטח חיצוני), קיבולת (כמה אנשים), ימים של השבוע, שעת כניסה / יציאה, האם חובה תיאום מראש.
```

**L44**

```
* **תוקף:** עד תאריך X או "ללא הגבלה".
```

**L45**

```
* **תנאי הבית:** כללי בית (מותר חיות, עישון, תזונה צמחונית, שעת שקט, מעלית, נגישות).
```

**L46**

```
* **מתקנים:** מקלחת, מטבח, מכונת כביסה, חניה, גישה למים, חימום, מזגן, אינטרנט.
```

**L47**

```
* **מיקום:** מפה (גוסום אזור או דיוק לפי בחירת המארח – ראה כללי פרטיות 8).
```

**L49**

```
##### א.2 שטח לינה ספונטני (Open Spot)
```

**L50**

```
"השטח בגינה האחורית פתוח ללינת אוהל ללא תיאום מראש."
```

**L52**

```
* **שדות:** סוג שטח (גינה / חצר / שטח פתוח), זמינות (כל השנה / עונה ספציפית), מתקנים (מים, שירותים, מטבח חיצוני, חשמל), כללי תפעול (נא לא להבעיר אש, לאסוף אשפה).
```

**L53**

```
* **מיקום על מפה:** מומלץ דיוק לקלות חניית האורח.
```

**L54**

```
* **קוד גישה / הוראות:** מה לעשות בהגעה (נעילה, מפתח מוסתר, שיחה לפני).
```

**L56**

```
##### א.3 אירוח רציף (Continuous Hosting)
```

**L57**

```
"פנוי לאירוח שביליסטים בכל סוף שבוע, בקשה דרך צ'אט."
```

**L59**

```
* **שדות:** טווח זמן רחב (חודשים / שנים), קיבולת, יחס פתיחות (בקשה לצ'אט / מענה אוטומטי).
```

**L60**

```
* **כיוון:** מארח שאוהב לאחסן ומסכים לבקשות תכופות.
```

**L62**

```
#### ב. דירוג מארח
```

**L63**

```
* כל מארח מקבל **פרופיל מארח** עם דירוג ממוצע, ביקורות אורחים קודמים, ותג "מארח ותיק" אחרי 5 אירוחים מאומתים.
```

**L65**

```
#### ג. ניהול בקשות אירוח
```

**L66**

```
* לוח בקרת מארח: בקשות חדשות, סטטוס, צ'אטים פעילים, היסטוריית אירוחים.
```

**L67**

```
* פעולות: אישור / דחייה / שאלה לפני אישור.
```

**L71**

```
### 2.2 מצב לקבל (Receive Mode) – בקשת אירוח
```

**L73**

```
#### א. בקשה לפי תרחיש
```

**L75**

```
##### א.1 שביליסט
```

**L76**

```
* **טופס:** מסלול (שביל / מסע), נקודת ההגעה, תאריך הצפוי, מספר משתתפים, סוג ציוד (אוהל / שק שינה).
```

**L77**

```
* **מסך מפה:** הצגת מארחים פעילים בקרבת הנקודה.
```

**L78**

```
* **שלח בקשה:** למארח ספציפי / לכמה במקביל / למודל "כל הקודם".
```

**L79**

```
* **תג מיוחד:** "שביליסט" משדרג את הבקשה למארחים שסימנו "אוהב שביליסטים".
```

**L81**

```
##### א.2 חסר בית / במצוקת דיור
```

**L82**

```
* **רגישות:** בקשה ברירת מחדל **רמה 1 (מוקדנים בלבד)**.
```

**L83**

```
* **טופס:** סוג מצוקה, משך משוער, אזור מועדף, צרכים מיוחדים.
```

**L84**

```
* **תהליך:** המוקדן מתאם עם ארגוני סיוע לחסרי בית (לאלה, אגודה לזכויות הפרט) או עם רשת מארחים בסבבים.
```

**L86**

```
##### א.3 אורח רגיל
```

**L87**

```
* **טופס:** תאריכי הגעה ויציאה, מטרת ביקור, מספר משתתפים, רמת תקציב (חינם / השתתפות בהוצאות).
```

**L88**

```
* **חיפוש:** סינון לפי אזור, קיבולת, תאריך, מתקנים.
```

**L90**

```
#### ב. תהליך
```

**L91**

```
1. בקשה נשלחת לכמה מארחים פעילים (או למארח ספציפי).
```

**L92**

```
2. המארח מקבל התראה.
```

**L93**

```
3. המארח עונה: אישור / דחייה / שאלה.
```

**L94**

```
4. בקשה מאושרת → צ'אט אירוח (3.6.2) נפתח.
```

**L95**

```
5. תיאום הגעה.
```

**L96**

```
6. בסיום – ביקורת הדדית.
```

**L100**

```
## 3. קטגוריות פנימיות
```

**L102**

```
| קטגוריה            | תיאור                                                 |
```

**L104**

```
| חדר במשפחה         | חדר פרטי בבית מאוכלס                                  |
```

**L105**

```
| דירה שלמה          | דירה נפרדת או יחידת דיור עצמאית                       |
```

**L106**

```
| ספה / סלון         | מקום שינה משני בסלון / חלל פתוח                       |
```

**L107**

```
| שטח חיצוני         | גינה / חצר / שטח לאוהל                                 |
```

**L108**

```
| בקתה / מבנה משני   | מבנה נפרד בחצר / שכונה                                |
```

**L109**

```
| חירום / זמני       | אירוח מהיר לחסר בית בליווי ארגון                      |
```

**L113**

```
## 4. שדות פוסט / הצעה
```

**L115**

```
| שדה                       | חלון קבוע | שטח ספונטני | רציף | בקשה |
```

**L117**

```
| סוג מקום                  | חובה      | חובה        | חובה | לא   |
```

**L118**

```
| קיבולת                    | חובה      | חובה        | חובה | חובה |
```

**L119**

```
| תאריכים / חלונות זמן      | חובה      | חובה        | חובה | חובה |
```

**L120**

```
| כללי בית                  | חובה      | אופציונלי   | חובה | -    |
```

**L121**

```
| מתקנים                    | חובה      | חובה        | חובה | -    |
```

**L122**

```
| מיקום (מפה)               | אופציונלי (גוסום מותר) | מומלץ דיוק | אופציונלי | חובה (אזור) |
```

**L123**

```
| קוד גישה / הוראות         | -         | חובה        | -    | -    |
```

**L124**

```
| תמונות                    | חובה (לפחות 2) | חובה (1+) | חובה | -    |
```

**L125**

```
| תג שביליסט/חסר בית/רגיל   | -         | -           | -    | חובה |
```

**L126**

```
| רגישות (אנונימיות)        | -         | -           | -    | חובה (ברירת מחדל לפי תרחיש) |
```

**L130**

```
## 5. תהליכי ליבה
```

**L132**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L134**

```
* **F11:** הצעת חלון אירוח קבוע.
```

**L135**

```
* **F12:** בקשת אירוח שביליסט (כולל מצב מסלול).
```

**L136**

```
* **F-extra:** בקשת אירוח חירום לחסר בית (זרימת מוקדן).
```

**L140**

```
## 6. אינטגרציות חוצות-עולמות
```

**L142**

```
* **עולם הנסיעות (3.5.9):** הצעת הסעה מנקודה Y לנקודת אירוח X.
```

**L143**

```
* **עולם המזון (3.5.6):** מארח יכול לציין "אספק ארוחת בוקר" (מזון משולב).
```

**L144**

```
* **עולם הזמן (3.5.11):** ארגון מתאם אירוח לחסרי בית מבקש מתנדבים לליווי.
```

**L145**

```
* **עולם הכסף (3.5.4):** קמפיין למימון רכישת ציוד למרכז אירוח.
```

**L146**

```
* **שידוכים (3.4):** בקשות חירום לחסרי בית ברמה 1.
```

**L150**

```
## 7. אינטגרציות חיצוניות
```

**L152**

```
* **שירותי מפות:** הצגת מיקום מדויק / גוסום.
```

**L153**

```
* **גופי סיוע לחסרי בית:** API לתאום אירוח חירום.
```

**L154**

```
* **שמירה על פרטיות מארח:** המיקום המדויק מוצג רק לאחר אישור הזמנה.
```

**L158**

```
## 8. כללים עסקיים ייחודיים
```

**L160**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L162**

```
* **R-Housing-1:** **שני הצדדים חייבים אימות "וי כחול"** לפני אישור אירוח.
```

**L163**

```
* **R-Housing-2:** קוד התנהגות דיגיטלי **חובה לאישור** לפני אירוח ראשון (מצד שני הצדדים).
```

**L164**

```
* **R-Housing-3:** מיקום מדויק נחשף לאורח רק לאחר אישור.
```

**L165**

```
* **R-Housing-4:** **כפתור חירום** זמין בצ'אט אירוח – שולח התראה לתמיכה ולאיש קשר חירום.
```

**L166**

```
* **R-Housing-5:** ביקורת הדדית חובה תוך 7 ימים מסיום אירוח.
```

**L167**

```
* **R-Housing-6:** דיווח על אירוע (הטרדה, פגיעה) → השעיית הצד הנדרש מיידית + בדיקת מנהל.
```

**L168**

```
* **R-Housing-7:** אסור לגבות תשלום על אירוח (מודל פילנתרופי). השתתפות סמלית בהוצאות (חשמל, מים) מותרת אך מוגבלת.
```

**L169**

```
* **R-Housing-8:** מארח שלא הגיב 24h לבקשה – הבקשה מועברת אוטומטית למארח אחר.
```

**L170**

```
* **R-Housing-9:** ביקורות שליליות חוזרות → השעיית פרופיל מארח.
```

**L171**

```
* **R-Housing-10:** אורח חסר בית עובר ליווי ארגון – אסור אירוח ישיר ללא תיווך.
```

**L175**

```
## 9. מסכים רלוונטיים
```

**L177**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L179**

```
| מסך                                | תפקיד                          |
```

**L181**

```
| 5.X.1 Housing Screen (Hub)         | מסך ראשי – לתת/לקבל            |
```

**L182**

```
| 5.X.2 Housing Map View             | מפת מארחים פעילים              |
```

**L183**

```
| 5.X.3 Host Profile                 | פרופיל מארח + ביקורות           |
```

**L184**

```
| 5.X.4 Hosting Offer Form           | טופס פרסום הצעת אירוח          |
```

**L185**

```
| 5.X.5 Stay Request Form            | טופס בקשת לינה                  |
```

**L186**

```
| 5.X.6 Hosting Dashboard            | לוח בקרת מארח                  |
```

**L187**

```
| 5.X.7 Hosting Code of Conduct      | מסך הסכמה לקוד התנהגות         |
```

**L188**

```
| 5.X.8 Emergency Button (in chat)   | כפתור חירום בצ'אט אירוח        |
```

**L192**

```
## 10. זרימות משתמש רלוונטיות
```

**L194**

```
* **F11:** הצעת חלון אירוח קבוע.
```

**L195**

```
* **F12:** בקשת אירוח שביליסט.
```

**L196**

```
* **F-extra:** בקשת אירוח חירום (חסר בית).
```

**L200**

```
## 11. התראות ייחודיות
```

**L202**

```
| טריגר                         | סוג         | יעד    |
```

**L204**

```
| בקשת אירוח חדשה               | פעולה נדרשת | מארח   |
```

**L205**

```
| המארח אישר/דחה                | אישור       | אורח   |
```

**L206**

```
| תזכורת הגעת אורח (24h לפני)   | תזכורת      | מארח   |
```

**L207**

```
| בקשת ביקורת לאחר אירוח (24h)  | תזכורת      | שני הצדדים |
```

**L208**

```
| בקשת אירוח חירום סמוך         | חירום       | מארחים פעילים באזור |
```

**L212**

```
## 12. מטריצת הרשאות
```

**L214**

```
| פעולה                              | חבר רגיל | חבר מאומת | מתנדב | מנהל ארגון | סופר אדמין |
```

**L216**

```
| פרסום הצעת אירוח                   | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L217**

```
| בקשת אירוח רגיל                    | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L218**

```
| בקשת אירוח חירום (לעצמך)           | ✅        | ✅         | ✅     | ✅          | ✅          |
```

**L219**

```
| תיאום אירוח חירום (ארגון)          | ❌        | ❌         | ❌     | ✅ (ארגון רלוונטי) | ✅ |
```

**L220**

```
| השעיית מארח/אורח                   | ❌        | ❌         | ❌     | ❌          | ✅          |
```

**L224**

```
## 13. מדדי הצלחה
```

**L226**

```
* מספר אירוחים מוצלחים בחודש.
```

**L227**

```
* יחס המרה: בקשה → אירוח.
```

**L228**

```
* דירוג ממוצע של מארחים.
```

**L229**

```
* מספר שביליסטים שניצלו אירוחים.
```

**L230**

```
* מספר בקשות חירום שטופלו.
```

**L231**

```
* זמן ממוצע מבקשה לאישור.
```

**L235**

```
## 14. מקרי קצה
```

**L237**

```
* **מארח שלא הגיע ביום:** האורח לא מצא את המארח. → דיווח, השעיית מארח, פיצוי לאורח (אם מוצדק).
```

**L238**

```
* **אורח שלא הגיע למרות אישור:** התראה, השפעה על דירוג.
```

**L239**

```
* **אורח שגרם נזק:** פרוטוקול דיווח, ביטוח (אופציונלי בעתיד).
```

**L240**

```
* **אורח חסר בית – אם הליווי הארגוני נופל:** המוקד נכנס ישירות.
```

**L241**

```
* **מארח שמנסה לגבות תשלום מוגזם:** דיווח, השעיה.
```

**L242**

```
* **שטח חיצוני בלי מים / שירותים:** חובת ציון מראש בפרסום.
```

**L246**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/06_Rides.md`

**L3**

```
# 🚗 עולם הנסיעות השיתופיות (Rides World)
```

**L5**

```
**עולם תרומה #6** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.9`](../03_Core_Features.md)
```

**L7**

```
> **שינוי במבנה PRD:** עולם זה היה בעבר סעיף נפרד 3.6 בקובץ הפיצ'רים. במהלך עדכון זה הוא **שולב כעולם תחת מטריית "עולמות התרומה"** (3.5), כדי לשמור על אחידות מבנית.
```

**L11**

```
## 1. מהות וערך עסקי
```

**L13**

```
עולם הנסיעות הוא **עולם רב-תכליתי** המאפשר תרומה / קבלה של:
```

**L15**

```
* **תנועה אישית:** טרמפים בין-עירוניים ועירוניים.
```

**L16**

```
* **שינוע משאבים:** חפצים (מ-3.5.5), מזון (מ-3.5.6), חבילות.
```

**L17**

```
* **שילוב:** נוסעים + משאבים באותה נסיעה.
```

**L19**

```
מודל הליבה הוא **קארפול פילנתרופי ללא רווח** – אסור לגבות תשלום שמטרתו רווח. ניתן לבקש השתתפות סמלית בהוצאות (דלק, בלאי).
```

**L21**

```
**הצורך שהוא פותר:**
```

**L22**

```
* תושבי פריפריה / סטודנטים / קשישים זקוקים לתחבורה ממקומות עם תחבורה ציבורית מוגבלת.
```

**L23**

```
* חפצים גדולים (רהיטים, מוצרי חשמל) במסירה דורשים שינוע פיזי שלא תמיד זמין.
```

**L24**

```
* מזון רגיש בזמן צריך הגעה מהירה לנקודות חלוקה.
```

**L25**

```
* נהגים עם רכב בדרכם הרגילה ממילא – יכולים לחלוק את המקום.
```

**L27**

```
**פרסונות עיקריות:**
```

**L28**

```
* 👤 חבר קהילה כנהג מציע נסיעה.
```

**L29**

```
* 👤 חבר קהילה כנוסע / מבקש שינוע.
```

**L30**

```
* 👤 חבר קהילה כנהג שינוע (חפצים / מזון).
```

**L31**

```
* 🏢 ארגון – מבקש שינוע ספציפי (חפצים, מתנדבים).
```

**L35**

```
## 2. מודל הדואליות
```

**L37**

```
### 2.1 מצב לתת (Give Mode) – הצעת נסיעה
```

**L39**

```
#### א. פרסום מהיר (Quick Publish)
```

**L40**

```
ב-90% מהמקרים נהג רוצה לפרסם נסיעה ב-30 שניות. מסך הפרסום מוגדר עם ברירות מחדל:
```

**L42**

```
| שדה              | ברירת מחדל              |
```

**L44**

```
| נקודת מוצא       | המיקום הנוכחי של המשתמש |
```

**L45**

```
| יעד              | חובה לציון              |
```

**L46**

```
| שעה ותאריך       | עכשיו (Now)             |
```

**L47**

```
| מקומות פנויים    | 3                       |
```

**L48**

```
| שינוע חפצים      | אין זמינות              |
```

**L49**

```
| מודל תגמול       | חינמי                   |
```

**L51**

```
לאחר הזנת היעד והתאריך, ניתן ללחוץ "פרסם" מיד **או** לעבור ל"הגדרות מתקדמות".
```

**L53**

```
#### ב. הגדרות מתקדמות
```

**L55**

```
* **מספר מקומות פנויים** (מותאם אישית).
```

**L56**

```
* **שינוע חפצים:** כן / לא + הגדרת מגבלות (גודל מקסימום, משקל, סוג).
```

**L57**

```
* **שינוע מזון:** כן / לא + תאריך תפוגה משמעותי? (אם הנסיעה תוך X שעות התואם תפוגה).
```

**L58**

```
* **מודל תגמול:**
```

**L59**

```
    * חינמי (התנדבות מלאה).
```

**L60**

```
    * השתתפות בהוצאות: סכום סמלי ₪X לראש (דלק, בלאי).
```

**L61**

```
* **דרישות לנוסעים:**
```

**L62**

```
    * מגדר ספציפי (לעיתים ביטחון אישי).
```

**L63**

```
    * עישון מותר/אסור.
```

**L64**

```
    * בעלי חיים מותרים/אסורים.
```

**L65**

```
    * הגבלת ילדים (כיסא בטיחות חובה אם < 4).
```

**L66**

```
    * דרישת אימות "וי כחול".
```

**L67**

```
* **מסלול פלוס:** עצירות ביניים אופציונליות.
```

**L68**

```
* **חיבור לחפץ ספציפי:** "אני נוסע מבני ברק לעפולה ומפרסם בקשה לכל חפץ באותו מסלול".
```

**L70**

```
#### ג. סוגי נסיעות
```

**L72**

```
| סוג                        | תיאור                                                               | קישור לעולמות      |
```

**L74**

```
| הסעת אנשים בלבד            | נסיעה בין שתי נקודות, נוסעים בלבד                                   | -                  |
```

**L75**

```
| שינוע חפצים בלבד           | מטען / חבילה / רהיט – ללא נוסעים                                    | חפצים (3.5.5)      |
```

**L76**

```
| שינוע מזון בלבד            | מזון רגיש בזמן – חלוקה לנקודה                                       | מזון (3.5.6)       |
```

**L77**

```
| משולב (אנשים + משאבים)     | נסיעה רגילה עם נוסעים + מקום למטען                                  | חפצים / מזון       |
```

**L78**

```
| הסעה לאירוח                | נסיעה לנקודת אירוח (שביליסט / חסר בית)                              | דיור (3.5.8)       |
```

**L79**

```
| הסעה לרפואה                | הסעה לבית חולים / מד"א (לתרומת דם / טיפול / ליווי)                  | רפואה (3.5.7)      |
```

**L81**

```
#### ד. ניהול נסיעה (Ride Dashboard)
```

**L82**

```
* צפייה בבקשות הצטרפות (נוסעים + חפצים + מזון).
```

**L83**

```
* אישור / דחייה.
```

**L84**

```
* מפה מסכמת של המסלול.
```

**L85**

```
* סטטוס בזמן אמת (מתחיל / בנסיעה / הגיע ליעד).
```

**L86**

```
* התראה לנהג: נוסעים נמצאים בקרבת נקודת איסוף.
```

**L90**

```
### 2.2 מצב לקבל (Receive Mode) – בקשת נסיעה / שינוע
```

**L92**

```
#### א. בקשת טרמפ
```

**L93**

```
* **מוצא + יעד.**
```

**L94**

```
* **טווח תאריכים / שעות.**
```

**L95**

```
* **מספר נוסעים.**
```

**L96**

```
* **מטען נוסף (תיק / מזוודה).**
```

**L97**

```
* **דרישות מיוחדות:** נשי בלבד, ללא עישון, וכו'.
```

**L98**

```
* **הצעות:** המערכת מחפשת נסיעות מתאימות באלגוריתם מסלול.
```

**L100**

```
#### ב. בקשת שינוע (חפצים)
```

**L101**

```
* פוסט אוטומטי משולב מעולם החפצים (3.5.5):
```

**L102**

```
    * "מקבל חפץ X באישור מהצד B – זקוק לשינוע מ-Y ל-Z עד תאריך W."
```

**L103**

```
* בחירה: התאמה אוטומטית לנסיעה קיימת / פרסום בקשה ייעודית למתנדב נהג.
```

**L105**

```
#### ג. בקשת שינוע (מזון)
```

**L106**

```
* פוסט מזון פג-תוקף קרוב יוצר אוטומטית בקשת שינוע דחופה.
```

**L107**

```
* "אוטם" Push לנהגים פעילים באזור.
```

**L109**

```
#### ד. בקשת הסעה רפואית
```

**L110**

```
* פוסט מקושר לפעולה רפואית (תיאום תור / ליווי) – בקשת הסעה אופציונלית.
```

**L114**

```
## 3. קטגוריות פנימיות
```

**L116**

```
| קטגוריה                  | תיאור                                                  |
```

**L118**

```
| בין-עירונית רגילה        | תל אביב → ירושלים, חיפה → אילת                          |
```

**L119**

```
| תוך-עירונית              | בתוך אותה עיר – לעיתים עזרה לקשיש לקלינית              |
```

**L120**

```
| מסעדן (מספר עצירות)      | מסלול עם 3‑5 נקודות איסוף                              |
```

**L121**

```
| חירום                    | שינוע מזון רגיש / רפואה / חסר בית                      |
```

**L122**

```
| ארגונית                  | ארגון מארגן הסעה קבוצתית (אירוע / מתנדבים)              |
```

**L123**

```
| יומיומית קבועה           | "אני נוסע יום-יום מ-X ל-Y בשעה Z" – חוזרת אוטומטית     |
```

**L127**

```
## 4. שדות פוסט נסיעה
```

**L129**

```
| שדה                       | פרסום מהיר | מתקדם       | בקשת טרמפ |
```

**L131**

```
| מוצא                      | אוטומטי    | חובה        | חובה      |
```

**L132**

```
| יעד                       | חובה       | חובה        | חובה      |
```

**L133**

```
| תאריך + שעה               | עכשיו      | חובה        | חובה (טווח) |
```

**L134**

```
| מקומות פנויים             | 3          | חובה        | -         |
```

**L135**

```
| שינוע חפצים               | לא         | אופציונלי   | -         |
```

**L136**

```
| שינוע מזון                | לא         | אופציונלי   | -         |
```

**L137**

```
| מודל תגמול                | חינמי      | חובה        | -         |
```

**L138**

```
| דרישות לנוסעים            | -          | אופציונלי   | -         |
```

**L139**

```
| עצירות ביניים             | -          | אופציונלי   | -         |
```

**L140**

```
| מספר נוסעים               | -          | -           | חובה      |
```

**L141**

```
| מטען                      | -          | -           | אופציונלי |
```

**L145**

```
## 5. מנגנון התאמה (Matching)
```

**L147**

```
זהו **לב העולם הזה**: כל פוסט נסיעה / בקשה עובר באלגוריתם התאמה:
```

**L149**

```
* **מסלול:** האלגוריתם מחשב את חפיפת המסלול (לפחות 70% חפיפה לטרמפ; 50% לחפץ; 90% למזון רגיש).
```

**L150**

```
* **זמן:** בקשה בטווח של ±30 דקות מהזמן המוצע.
```

**L151**

```
* **קיבולת:** מספר מקומות פנויים מספיק לבקשה.
```

**L152**

```
* **דרישות:** התאמה הדדית של דרישות (מגדר, חיות, וכו').
```

**L153**

```
* **דירוג:** עדיפות לנהגים/נוסעים בעלי דירוג גבוה.
```

**L154**

```
* **גיאוגרפיה:** רדיוס סביב נקודות מוצא ויעד (ברירת מחדל 5 ק"מ).
```

**L158**

```
## 6. תהליכי ליבה
```

**L160**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L162**

```
* **זרימה 6:** פרסום נסיעה שיתופית.
```

**L163**

```
* **זרימה 7:** הצטרפות לנסיעה כנוסע.
```

**L164**

```
* **זרימה 5 (חיבור):** מסירת חפץ עם שינוע.
```

**L165**

```
* **F-extra:** בקשת שינוע מזון דחוף.
```

**L169**

```
## 7. אינטגרציות חוצות-עולמות
```

**L171**

```
* **חפצים (3.5.5):** הצעת שינוע אוטומטית לחפצים גדולים.
```

**L172**

```
* **מזון (3.5.6):** שינוע דחוף למזון רגיש בזמן.
```

**L173**

```
* **דיור (3.5.8):** הסעה לנקודת אירוח.
```

**L174**

```
* **רפואה (3.5.7):** ליווי / הסעה לבית חולים / תחנת תרומה.
```

**L175**

```
* **זמן (3.5.11):** הסעה למשימת התנדבות.
```

**L176**

```
* **שידוכים (3.4):** מוקדן יכול לחפש נהג מתנדב לבקשה רגישה.
```

**L180**

```
## 8. אינטגרציות חיצוניות
```

**L182**

```
* **שירותי מפות + ניווט:** Google Maps / Waze לחישוב מסלולים.
```

**L183**

```
* **שירותי מזג אוויר:** התראה על תנאי דרך לפני הנסיעה.
```

**L184**

```
* **תחבורה ציבורית (אופציונלי):** מומלץ אם אין נסיעה רלוונטית.
```

**L188**

```
## 9. כללים עסקיים ייחודיים
```

**L190**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L192**

```
* **R-Rides-1:** **אסור לגבות מחיר רווח על נסיעה.** רק השתתפות בהוצאות סמלית (דלק, בלאי).
```

**L193**

```
* **R-Rides-2:** סכום השתתפות מקסימום: ₪70 לראש לנסיעה בין-עירונית; ₪20 לתוך-עירונית.
```

**L194**

```
* **R-Rides-3:** נהג חייב **רישיון נהיגה תקף** ופרופיל "וי כחול".
```

**L195**

```
* **R-Rides-4:** רכב חייב **ביטוח חובה תקף** – המערכת מבקשת ניתן הצהרה (לא אכיפה ב-MVP).
```

**L196**

```
* **R-Rides-5:** נוסע יכול לבטל עד 30 דקות לפני זמן נסיעה ללא קנס.
```

**L197**

```
* **R-Rides-6:** ביטול מאוחר חוזר → השפעה על דירוג.
```

**L198**

```
* **R-Rides-7:** דיווח על נהיגה מסוכנת = השעיית נהג מיידית + בדיקה.
```

**L199**

```
* **R-Rides-8:** **כפתור חירום בנסיעה:** במהלך נסיעה פעילה, נוסע יכול ללחוץ על כפתור חירום ששולח התראה לתמיכה + מיקום בזמן אמת.
```

**L200**

```
* **R-Rides-9:** לקטינים (< 18) דרושה הסכמת הורה (אישור דיגיטלי).
```

**L201**

```
* **R-Rides-10:** שינוע מזון פג-תוקף = איסוף בלבד; אסור להחזיק מזון רגיש מעבר לזמן הנדרש.
```

**L205**

```
## 10. מסכים רלוונטיים
```

**L207**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L209**

```
| מסך                                | תפקיד                                              |
```

**L211**

```
| 6.1 Rides Feed                     | פיד נסיעות                                         |
```

**L212**

```
| 6.2 Publish Ride Form              | טופס הצעת נסיעה (מהיר + מתקדם)                     |
```

**L213**

```
| 6.3 Options & Costs Modal          | מודאל אפשרויות שינוע ותשלום                        |
```

**L214**

```
| 6.4 Ride Dashboard                 | לוח בקרת נסיעה                                     |
```

**L215**

```
| 6.5 Ride Detail                    | פרטי נסיעה                                         |
```

**L216**

```
| 6.6 Ride Offer Form                | טופס בקשת נוסע / שינוע                             |
```

**L217**

```
| 6.X Active Ride Screen (חדש)       | מסך נסיעה פעילה עם כפתור חירום                     |
```

**L221**

```
## 11. זרימות משתמש רלוונטיות
```

**L223**

```
* **זרימה 6:** פרסום נסיעה.
```

**L224**

```
* **זרימה 7:** הצטרפות כנוסע.
```

**L225**

```
* **זרימה 5:** מסירת חפץ עם שינוע.
```

**L226**

```
* **F-Rides-Emergency:** הפעלת כפתור חירום בנסיעה.
```

**L230**

```
## 12. התראות ייחודיות
```

**L232**

```
| טריגר                                | סוג         | יעד          |
```

**L234**

```
| בקשת הצטרפות חדשה לנסיעה             | פעולה נדרשת | נהג          |
```

**L235**

```
| הנהג אישר את הצטרפותך                | אישור       | נוסע         |
```

**L236**

```
| תזכורת לפני נסיעה (1h)               | תזכורת      | נהג + נוסעים |
```

**L237**

```
| נוסע מתקרב לנקודת איסוף              | עדכון       | נהג          |
```

**L238**

```
| נוסע איחר (10 דקות אחרי שעת איסוף)    | פעולה נדרשת | נהג          |
```

**L239**

```
| נסיעה הסתיימה – בקשת ביקורת          | תזכורת      | שני הצדדים   |
```

**L240**

```
| כפתור חירום הופעל                    | חירום       | תמיכה + איש קשר |
```

**L244**

```
## 13. מטריצת הרשאות
```

**L246**

```
| פעולה                              | חבר רגיל | חבר מאומת | מתנדב | מנהל ארגון | סופר אדמין |
```

**L248**

```
| פרסום נסיעה (כנהג)                 | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L249**

```
| בקשת טרמפ                          | ✅        | ✅         | ✅     | ✅          | ✅          |
```

**L250**

```
| פרסום בקשת שינוע                   | ✅        | ✅         | ✅     | ✅          | ✅          |
```

**L251**

```
| שינוע מזון רגיש                    | ❌        | ✅         | ✅     | ✅          | ✅          |
```

**L252**

```
| השעיית נהג                         | ❌        | ❌         | ❌     | ❌          | ✅          |
```

**L256**

```
## 14. מדדי הצלחה
```

**L258**

```
* מספר נסיעות פעילות בחודש.
```

**L259**

```
* יחס המרה: בקשה → נסיעה.
```

**L260**

```
* קילומטרים מצטברים בקארפול.
```

**L261**

```
* מספר חפצים ששונעו במסגרת נסיעות.
```

**L262**

```
* קילוגרמים של מזון רגיש שניצלו דרך שינוע.
```

**L263**

```
* דירוג ממוצע נהגים.
```

**L264**

```
* מספר אירועי כפתור חירום (אינדיקטור הפוך – נמוך = טוב).
```

**L268**

```
## 15. מקרי קצה
```

**L270**

```
* **נהג לא הופיע:** התראה, השפעה על דירוג, פיצוי לנוסע.
```

**L271**

```
* **נסיעה ללא תיאום מראש:** "פרסום מהיר" מאפשר נסיעה ספונטנית; אם אין נוסע – הנסיעה פשוט מתבצעת ללא נוסעים.
```

**L272**

```
* **רכב מתקלקל בדרך:** התראה לנוסעים, סיוע מהמערכת בחיפוש פתרון חליפי.
```

**L273**

```
* **שינוע מזון שאיחר וזמן התפוגה עבר:** הנהג רשאי לזרוק או למסור לארגון מזון מקומי.
```

**L274**

```
* **נסיעה בין-לאומית:** אסורה במערכת (חוקי).
```

**L275**

```
* **שינוע פעוטים ללא הורה:** דורש הסכמת הורה דיגיטלית מראש.
```

**L279**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/07_Knowledge.md`

**L3**

```
# 📚 עולם הידע (Knowledge World)
```

**L5**

```
**עולם תרומה #7** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.10`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם הידע הוא **המסך החינוכי-פדגוגי** של הפלטפורמה – מקום שבו אנשים יכולים **לתרום מהמומחיות והניסיון שלהם** לקהילה ב-4 מסלולים: קורסים, שיעורים פרטיים, טקסטים וסרטונים.
```

**L13**

```
**הצורך שהוא פותר:**
```

**L14**

```
* יש בארץ הרבה מומחים עם ניסיון מקצועי / חיים שאין להם זמן או רצון להפוך למורים בתשלום, אך כן רוצים לתרום ידע.
```

**L15**

```
* תלמידים, סטודנטים, אנשים בפנייה לקריירה חדשה – זוקקים חונכות חינמית.
```

**L16**

```
* תכנים חינוכיים איכותיים פזורים בכל הרשת – ריכוז קהילתי שלהם תורם.
```

**L18**

```
**פרסונות:**
```

**L19**

```
* 👤 חבר קהילה כתורם ידע (מומחה, מורה, יועץ).
```

**L20**

```
* 👤 חבר קהילה כצורך ידע.
```

**L21**

```
* 🏢 ארגון חינוכי – מארגן קורסים בעולמו.
```

**L22**

```
* 🎧 מנהלת ארגון – אחראית על אישור איכות.
```

**L26**

```
## 2. מודל הדואליות
```

**L28**

```
### 2.1 מצב לתת (Give Mode) – תרומת ידע
```

**L30**

```
#### א. ארבעה סוגי תרומה
```

**L32**

```
##### א.1 קורס דיגיטלי (Course Builder)
```

**L33**

```
* **מבנה:** כותרת, תיאור, תחום, רמה (מתחילים / בינוני / מתקדם).
```

**L34**

```
* **שיעורים:** רשימת פרקים, לכל פרק וידאו / טקסט / קבצים מצורפים.
```

**L35**

```
* **מבחנים:** שאלון בכל פרק (אופציונלי).
```

**L36**

```
* **חומרי עזר:** PDF, מצגות, קישורים.
```

**L37**

```
* **תקופת קורס:** קורס פתוח לכל / קורס בקבוצה (פותח 30 משתתפים, נסגר).
```

**L38**

```
* **תעודה:** בסיום ניתן להוציא תעודה דיגיטלית (לא רשמית).
```

**L40**

```
##### א.2 שיעור פרטי (Private Lesson)
```

**L41**

```
* **התאמה לפי:** נושא, רמה, אזור גיאוגרפי, פנים מול פנים / וידאו / טלפוני.
```

**L42**

```
* **לוח שעות:** מתי אני זמין/ה (יומי / שבועי).
```

**L43**

```
* **קצב:** שיעור חד-פעמי / סדרת שיעורים.
```

**L44**

```
* **חינם:** כל השיעור חינם, אין אופציה לתשלום.
```

**L46**

```
##### א.3 טקסט / כתבה (Article)
```

**L47**

```
* **כותרת + תוכן.**
```

**L48**

```
* **תחום + תגיות.**
```

**L49**

```
* **קישור למקור** (אם רלוונטי – הסבר על מאמר חיצוני).
```

**L51**

```
##### א.4 סרטון / קישור חיצוני
```

**L52**

```
* **קישור ל-YouTube / Vimeo / אחר.**
```

**L53**

```
* **תיאור והקשר** – למה הסרטון רלוונטי.
```

**L54**

```
* **תחום + תגיות.**
```

**L56**

```
#### ב. תהליך אישור
```

**L57**

```
**כל תרומת ידע, ללא יוצא מן הכלל, חייבת לעבור אישור מנהלת הארגון** לפני פרסום:
```

**L58**

```
1. המשתמש שולח את התוכן.
```

**L59**

```
2. מנהלת ארגון רואה ב"תור אישור ידע".
```

**L60**

```
3. בודק: דיוק, איכות, הגינות, אין הטעיה.
```

**L61**

```
4. מאושר ← מתפרסם / נדחה ← הסבר לתורם.
```

**L65**

```
### 2.2 מצב לקבל (Receive Mode) – בקשת ידע
```

**L67**

```
#### א. בקשת חונכות
```

**L68**

```
* "אני בכניסה לשוק התעסוקה בתחום הסייבר, מחפש מנטור."
```

**L69**

```
* תיוג תחום + רמה + תדירות.
```

**L70**

```
* תהליך: תורמים פוטנציאליים מקבלים Push, צ'אט פרטי.
```

**L72**

```
#### ב. בקשת הסבר / קורס
```

**L73**

```
* "אני זקוק/ה לקורס בשפה X."
```

**L74**

```
* התראה למורים פוטנציאליים.
```

**L76**

```
#### ג. בקשת חומר עזר
```

**L77**

```
* "מחפש מצגת על נושא Y."
```

**L78**

```
* תורמים יכולים להעלות קבצים.
```

**L82**

```
## 3. קטגוריות פנימיות
```

**L84**

```
| קטגוריה               | דוגמאות                                              |
```

**L86**

```
| תכנות וטכנולוגיה      | פייתון, JavaScript, AI, סייבר                         |
```

**L87**

```
| שפות                  | אנגלית, ערבית, צרפתית, רוסית                          |
```

**L88**

```
| מתמטיקה ומדעים        | חשבון, סטטיסטיקה, פיזיקה                              |
```

**L89**

```
| אקדמיה ומקצוע         | משפטים, רפואה, ניהול, כלכלה                           |
```

**L90**

```
| אומנויות              | ציור, פיסול, צילום                                    |
```

**L91**

```
| בישול וקולינריה       | מתכונים, טכניקות (חיבור לעולם היצירה 3.5.14)          |
```

**L92**

```
| התפתחות אישית         | ניהול זמן, מדיטציה, NLP                               |
```

**L93**

```
| הורות וחינוך          | טיפים להורים, התמודדות עם בני נוער                    |
```

**L94**

```
| כישורי חיים           | בנקאות, ביטוח, זכויות                                 |
```

**L95**

```
| מסורת ויהדות          | תורה, תפילה, היסטוריה                                  |
```

**L96**

```
| בישול וקולינריה       | מתכונים, טכניקות                                      |
```

**L100**

```
## 4. שדות פוסט / תרומה
```

**L102**

```
| שדה              | קורס | שיעור פרטי | טקסט | סרטון |
```

**L104**

```
| כותרת            | חובה | חובה       | חובה | חובה  |
```

**L105**

```
| תיאור            | חובה | חובה       | חובה | חובה  |
```

**L106**

```
| תחום             | חובה | חובה       | חובה | חובה  |
```

**L107**

```
| רמה              | חובה | חובה       | -    | -     |
```

**L108**

```
| תוכן (פרקים)     | חובה | -          | -    | -     |
```

**L109**

```
| חומר עזר         | אופציונלי | -    | -    | -     |
```

**L110**

```
| לוח שעות         | -    | חובה       | -    | -     |
```

**L111**

```
| מיקום            | -    | חובה (אם פנים מול פנים) | - | - |
```

**L112**

```
| תוכן הטקסט       | -    | -          | חובה | -     |
```

**L113**

```
| קישור            | -    | -          | אופציונלי | חובה |
```

**L117**

```
## 5. תהליכי ליבה
```

**L119**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L121**

```
* **זרימה 14:** תרומת ידע – העלאת קורס.
```

**L122**

```
* **F-extra:** בקשת חונכות + שידוך מורה.
```

**L126**

```
## 6. אינטגרציות חוצות-עולמות
```

**L128**

```
* **עולם הזמן (3.5.11):** שיעור פרטי הוא גם תרומת זמן – שעות נספרות.
```

**L129**

```
* **עולם היצירה (3.5.14):** מתכונים, מוזיקה כתוכן ידע.
```

**L130**

```
* **שידוכים (3.4):** חונכות לאוכלוסיות רגישות (חיילים בודדים, שיקום) דרך מוקד.
```

**L134**

```
## 7. אינטגרציות חיצוניות
```

**L136**

```
* **YouTube / Vimeo:** הטמעה של קישורים חיצוניים.
```

**L137**

```
* **שירותי המרת PDF:** הצגת חומרי קורס.
```

**L138**

```
* **שירותי אנליטיקה לקורסים:** אחוז השלמה, ביצועים במבחנים.
```

**L142**

```
## 8. כללים עסקיים ייחודיים
```

**L144**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L146**

```
* **R-Knowledge-1:** **כל תוכן ידע עובר אישור מנהלת ארגון לפני פרסום.**
```

**L147**

```
* **R-Knowledge-2:** **חינם בלבד.** אסורה כל גביית תשלום על ידע.
```

**L148**

```
* **R-Knowledge-3:** קורסים בתחומים רגישים (רפואה, משפטים) דורשים אישור פרטני נוסף + הצהרת אחריות.
```

**L149**

```
* **R-Knowledge-4:** הפרת זכויות יוצרים = הסרה מיידית + השעיית התורם.
```

**L150**

```
* **R-Knowledge-5:** מורה לשיעור פרטי חייב "וי כחול" + ביקורת חיובית מ-3 תלמידים אחרי השיעורים הראשונים.
```

**L151**

```
* **R-Knowledge-6:** קורס מבוטל / שלא הושלם – התלמידים מקבלים הודעה + רשימת קורסים אלטרנטיביים.
```

**L155**

```
## 9. מסכים רלוונטיים
```

**L157**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L159**

```
| מסך                                | תפקיד                                          |
```

**L161**

```
| 5.3 Knowledge Screen (Hub)         | מסך ראשי – לתת/לקבל                            |
```

**L162**

```
| 5.3.X Course Builder               | טופס בניית קורס                                |
```

**L163**

```
| 5.3.X Course Detail                | מסך פרטי קורס + הרשמה                          |
```

**L164**

```
| 5.3.X Lesson Catalog               | קטלוג שיעורים פרטיים                            |
```

**L165**

```
| 5.3.X Article Reader               | קורא טקסטים                                    |
```

**L166**

```
| 5.3.X Knowledge Approval Queue     | תור אישורי ידע (מנהל ארגון)                    |
```

**L170**

```
## 10. זרימות משתמש רלוונטיות
```

**L172**

```
* **זרימה 14:** העלאת קורס.
```

**L173**

```
* **F-Knowledge-Tutor:** התאמה לשיעור פרטי.
```

**L177**

```
## 11. התראות ייחודיות
```

**L179**

```
| טריגר                              | סוג         | יעד            |
```

**L181**

```
| תוכן הוגש לאישור                   | פעולה נדרשת | מנהל ארגון      |
```

**L182**

```
| תוכן אושר                          | אישור       | תורם            |
```

**L183**

```
| תוכן נדחה                          | פעולה נדרשת | תורם            |
```

**L184**

```
| משתמש חדש נרשם לקורס שלך           | עדכון       | תורם            |
```

**L185**

```
| בקשת חונכות התקבלה                 | פעולה נדרשת | תורם פוטנציאלי |
```

**L186**

```
| תזכורת שיעור (24h לפני)            | תזכורת      | מורה + תלמיד    |
```

**L190**

```
## 12. מטריצת הרשאות
```

**L192**

```
| פעולה                              | חבר רגיל | חבר מאומת | מתנדב | עובד עמותה | מנהל ארגון | סופר אדמין |
```

**L194**

```
| העלאת קורס / שיעור                 | ❌        | ✅         | ✅     | ✅          | ✅          | ✅          |
```

**L195**

```
| העלאת טקסט / סרטון                 | ✅        | ✅         | ✅     | ✅          | ✅          | ✅          |
```

**L196**

```
| בקשת חונכות / קורס                 | ✅        | ✅         | ✅     | ✅          | ✅          | ✅          |
```

**L197**

```
| אישור תוכן ידע                     | ❌        | ❌         | ❌     | ❌          | ✅          | ✅          |
```

**L198**

```
| העלאת קורס בתחום רגיש (רפואה / משפט) | ❌      | ❌         | ❌     | אישור מקרה | אישור מקרה | ✅          |
```

**L202**

```
## 13. מדדי הצלחה
```

**L204**

```
* מספר קורסים פעילים.
```

**L205**

```
* מספר תלמידים שסיימו קורסים.
```

**L206**

```
* מספר שיעורים פרטיים שבוצעו.
```

**L207**

```
* דירוג ממוצע של מורים.
```

**L208**

```
* יחס מבקשי חונכות שמצאו מנטור.
```

**L212**

```
## 14. מקרי קצה
```

**L214**

```
* **תוכן בעל זכויות יוצרים:** המנהלת מזהה ודוחה. הסבר לתורם איך לתקן.
```

**L215**

```
* **תורם שמעלה תוכן ספאמי:** השעיית הרשאת העלאה.
```

**L216**

```
* **קורס לא הושלם – המורה נעלם:** התלמידים מקבלים הצעה לקורס דומה.
```

**L217**

```
* **שיעור פרטי בעייתי (תלונות):** השעיית מורה.
```

**L221**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/08_Time.md`

**L3**

```
# 🕒 עולם הזמן והתנדבות (Time World)
```

**L5**

```
**עולם תרומה #8** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.11`](../03_Core_Features.md)
```

**L9**

```
## 1. מהות וערך עסקי
```

**L11**

```
עולם הזמן הוא **המסך המקיף ביותר של התנדבות אנושית** – המקום שבו משאב היחיד שאי אפשר להחזיר (זמן) הופך לתרומה. שונה מעולם הידע (3.5.10) שמתמקד בהעברת תוכן, עולם הזמן עוסק ב**נוכחות אנושית**, **חברה**, **תמיכה רגשית** ו**סיוע מעשי**.
```

**L13**

```
**הצורך שהוא פותר:**
```

**L14**

```
* קשישים בודדים זוקקים חברה.
```

**L15**

```
* אנשים בעת משבר רגשי זוקקים אוזן קשבת.
```

**L16**

```
* גופים חברתיים זוקקים מתנדבים לפעולות שונות.
```

**L17**

```
* אנשים עם מוגבלות זוקקים סיוע מעשי בחיי היומיום.
```

**L18**

```
* אנשים בתהליכי שיקום זוקקים ליווי רחב.
```

**L20**

```
**פרסונות:**
```

**L21**

```
* 👤 חבר קהילה כמתנדב.
```

**L22**

```
* 👤 חבר קהילה כמבקש סיוע אנושי.
```

**L23**

```
* 🏢 ארגון – מארגן משימות התנדבות.
```

**L24**

```
* 👔 מנהל מתנדבים – מתאם בארגון.
```

**L25**

```
* 🎧 מוקדן – מטפל בבקשות רגישות.
```

**L29**

```
## 2. מודל הדואליות
```

**L31**

```
### 2.1 מצב לתת (Give Mode) – הצעת זמן
```

**L33**

```
#### א. סוגי הצעה
```

**L35**

```
##### א.1 משימת התנדבות נקודתית
```

**L36**

```
* **שדות:** תיאור משימה, מקום, תאריך + שעה, משך, ארגון מארח (אם רלוונטי), כישורים נדרשים.
```

**L37**

```
* **דוגמאות:** "סיוע באריזת חבילות מזון בלוד, יום רביעי 18:00‑20:00".
```

**L39**

```
##### א.2 זמינות פתוחה
```

**L40**

```
* **שדות:** תחום (תמיכה רגשית / חברה / סיוע מעשי / טכנולוגיה), אזור גיאוגרפי, שעות זמינות (יומי / שבועי), משך מתחייב (חד-פעמי / קבוע).
```

**L42**

```
##### א.3 התנדבות מאורגנת בארגון
```

**L43**

```
* רישום פורמלי לארגון (ראה זרימה 12 ב-PRD).
```

**L45**

```
#### ב. תפריט תורם:
```

**L46**

```
* היסטוריית שעות התנדבות.
```

**L47**

```
* תעודות הוקרה דיגיטליות.
```

**L48**

```
* רצפי התנדבות (Streaks).
```

**L49**

```
* דירוג מארגנים.
```

**L53**

```
### 2.2 מצב לקבל (Receive Mode) – בקשת סיוע אנושי
```

**L55**

```
#### א. בקשה אישית
```

**L56**

```
* **בקשת חברה:** "אני בודד, מחפש מי לדבר/לשתף שיחה".
```

**L57**

```
* **בקשת תמיכה רגשית:** ברגישות גבוהה (ברירת מחדל רמה 1).
```

**L58**

```
* **בקשת סיוע מעשי:** "מחפש מתנדב לקניות שבועיות לאם זקנה ללא רכב".
```

**L59**

```
* **בקשת ליווי לפגישות:** רפואיות, אדמיניסטרטיביות.
```

**L61**

```
#### ב. בקשה ארגונית
```

**L62**

```
* **משימה גדולה:** "ארגון X זקוק ל-30 מתנדבים לאירוע יומי".
```

**L63**

```
* תיאור מטרה, תפקידים, קישור לטופס הרשמה (3.5.11.b ב-PRD).
```

**L67**

```
## 3. קטגוריות פנימיות
```

**L69**

```
| קטגוריה              | דוגמאות                                                            |
```

**L71**

```
| תמיכה רגשית          | קו תמיכה, אוזן קשבת, מעגלי שיתוף                                   |
```

**L72**

```
| בריאות הנפש          | חברה לחולים נפשיים, ליווי לטיפולים                                  |
```

**L73**

```
| גיל הזהב             | ביקורי קשישים, סיוע מעשי, חברה                                     |
```

**L74**

```
| חינוך וחונכות        | חונכות חברתית-לימודית לילדים                                        |
```

**L75**

```
| טכנולוגיה            | סיוע למבוגרים בשימוש בסמארטפון / מחשב                              |
```

**L76**

```
| תעסוקה ושיקום        | ליווי לראיונות עבודה, חיפוש עבודה                                  |
```

**L77**

```
| סביבה                | ניקוי חופים, נטיעות, פעילות סביבתית                                |
```

**L78**

```
| קהילה ושכונה         | פעילות קהילתית מקומית                                              |
```

**L79**

```
| פעילות עם ילדים      | חוגים חינמיים, תמיכה לימודית                                       |
```

**L80**

```
| בעלי חיים            | פעילות במקלטי חיות, טיולי כלבים                                    |
```

**L81**

```
| חירום                | תגובה לאסון טבע, מצב חירום                                         |
```

**L82**

```
| ליווי רפואי          | קישור לעולם הרפואה (3.5.7)                                          |
```

**L86**

```
## 4. שדות פוסט / משימה
```

**L88**

```
| שדה              | משימה נקודתית | זמינות פתוחה | בקשת סיוע אישית |
```

**L90**

```
| כותרת            | חובה          | חובה         | חובה              |
```

**L91**

```
| תיאור            | חובה          | חובה         | חובה              |
```

**L92**

```
| תחום             | חובה          | חובה         | חובה              |
```

**L93**

```
| תאריך + שעה      | חובה          | -            | אופציונלי         |
```

**L94**

```
| מקום             | חובה          | אזור (חובה)  | אופציונלי         |
```

**L95**

```
| משך              | חובה          | -            | -                 |
```

**L96**

```
| כישורים נדרשים   | אופציונלי     | -            | -                 |
```

**L97**

```
| ארגון מארח       | אופציונלי     | -            | -                 |
```

**L98**

```
| רגישות           | -             | -            | חובה              |
```

**L102**

```
## 5. תהליכי ליבה
```

**L104**

```
ראה [`../04_User_Flows.md`](../04_User_Flows.md):
```

**L106**

```
* **זרימה 12:** הצטרפות כמתנדב לארגון.
```

**L107**

```
* **זרימה 17:** ניהול משימות ארגוניות.
```

**L108**

```
* **F-Time-Companionship:** בקשת חברה לקשיש + שידוך מתנדב.
```

**L109**

```
* **F-Time-Emotional:** בקשת תמיכה רגשית רגישה (זרם מוקדן).
```

**L113**

```
## 6. אינטגרציות חוצות-עולמות
```

**L115**

```
* **עולם הידע (3.5.10):** שיעור פרטי הוא תרומת זמן + ידע משולב.
```

**L116**

```
* **עולם הרפואה (3.5.7):** ליווי רפואי.
```

**L117**

```
* **עולם הדיור (3.5.8):** מתנדבי תיאום אירוח חירום.
```

**L118**

```
* **עולם המזון (3.5.6):** מתנדבי חלוקת מזון.
```

**L119**

```
* **שידוכים (3.4):** בקשות תמיכה רגשית רגישות (רמה 1).
```

**L123**

```
## 7. אינטגרציות חיצוניות
```

**L125**

```
* **גופי מיומנים:** ער"ן (עזרה ראשונה נפשית), קו לחיים, קישורי חירום נפשי.
```

**L126**

```
* **תעודות מתנדב:** המנפיק לטופס מתנדב לאומי / שירות אזרחי (אופציונלי).
```

**L130**

```
## 8. כללים עסקיים ייחודיים
```

**L132**

```
ראה [`../07_Business_Rules.md`](../07_Business_Rules.md):
```

**L134**

```
* **R-Time-1:** מתנדב חייב שיוך לארגון (כפי שמופיע ב-2.2 ב-PRD).
```

**L135**

```
* **R-Time-2:** דיווח שעות התנדבות אינו אוטומטי – המתנדב מדווח ועובד עמותה / מנהל מתנדבים מאשר.
```

**L136**

```
* **R-Time-3:** סיוע רגשי / נפשי לקטגוריות רגישות (אובדנות, התעללות) חובה דרך מוקד מאומן + ער"ן.
```

**L137**

```
* **R-Time-4:** משימה במקום פיזי דורשת אבטחה בסיסית: שני מתנדבים לפחות לסיוע פיזי לקשיש (Buddy System).
```

**L138**

```
* **R-Time-5:** התנדבות עם קטינים דורשת אישור הורה דיגיטלי.
```

**L139**

```
* **R-Time-6:** תעודת התנדבות מודפסת רק אחרי 5 שעות מאומתות בארגון.
```

**L143**

```
## 9. מסכים רלוונטיים
```

**L145**

```
ראה [`../05_Screen_UI_Mapping.md`](../05_Screen_UI_Mapping.md):
```

**L147**

```
| מסך                                | תפקיד                              |
```

**L149**

```
| 5.6 Time Screen (Hub)              | מסך ראשי – לתת/לקבל                |
```

**L150**

```
| 5.6.X Volunteer Tasks Catalog      | קטלוג משימות התנדבות               |
```

**L151**

```
| 5.6.X Volunteer Hours Tracker      | מעקב שעות אישי                     |
```

**L152**

```
| 5.6.X Companionship Request Form   | טופס בקשת חברה                     |
```

**L153**

```
| 5.6.X Emotional Support Form       | טופס בקשת תמיכה רגשית              |
```

**L154**

```
| 11.6 Volunteer Application Form    | טופס הצטרפות כמתנדב לארגון (קיים)  |
```

**L158**

```
## 10. זרימות משתמש רלוונטיות
```

**L160**

```
* **זרימה 12:** הצטרפות לארגון.
```

**L166**

```
## 11. התראות ייחודיות
```

**L168**

```
| טריגר                                  | סוג         | יעד          |
```

**L170**

```
| משימה חדשה תואמת תחום העניין שלך       | עדכון       | מתנדב        |
```

**L171**

```
| ארגון אישר אותך כמתנדב                 | אישור       | מתנדב        |
```

**L172**

```
| תזכורת משימה (24h)                     | תזכורת      | מתנדב        |
```

**L173**

```
| בקשת תמיכה רגשית – מוקדן לקח בעלות     | עדכון       | מבקש         |
```

**L174**

```
| תעודת מתנדב הופקה                      | אישור       | מתנדב        |
```

**L178**

```
## 12. מטריצת הרשאות
```

**L180**

```
| פעולה                              | חבר | מתנדב | מנהל מתנדבים | מנהל ארגון | מוקדן | סופר אדמין |
```

**L182**

```
| הצעת זמינות אישית                  | ✅   | ✅     | ✅            | ✅          | ✅     | ✅          |
```

**L183**

```
| בקשת חברה / סיוע אישי               | ✅   | ✅     | ✅            | ✅          | ✅     | ✅          |
```

**L184**

```
| פרסום משימת התנדבות (ארגונית)       | ❌   | ❌     | ✅            | ✅          | ❌     | ✅          |
```

**L185**

```
| אישור שעות מתנדבים                 | ❌   | ❌     | ✅            | ✅          | ❌     | ✅          |
```

**L186**

```
| תיאום בקשת תמיכה רגשית רגישה        | ❌   | ❌     | ❌            | ❌          | ✅     | ✅          |
```

**L190**

```
## 13. מדדי הצלחה
```

**L192**

```
* סך שעות התנדבות מוסכמות חודשיות.
```

**L193**

```
* מספר מתנדבים פעילים.
```

**L194**

```
* מספר אנשים בודדים שמצאו חברה.
```

**L195**

```
* יחס מבקש סיוע רגשי → קיבל מענה.
```

**L196**

```
* דירוג מתנדבים.
```

**L200**

```
## 14. מקרי קצה
```

**L202**

```
* **מתנדב נכשל בהגעה:** דיווח, השעיית מתנדב חוזר.
```

**L203**

```
* **בקשת תמיכה רגשית באמצע הלילה:** מוקד 24/7 / קישור לער"ן.
```

**L204**

```
* **משימה שלא נמצאו לה מספיק מתנדבים:** ארגון מקבל הודעה לפני המועד.
```

**L205**

```
* **התנדבות עם בעלי מוגבלות / קטינים:** הדרכה מקדימה חובה.
```

**L209**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/09_Animals.md`

**L3**

```
# 🐾 עולם בעלי החיים (Animals World)
```

**L5**

```
**עולם תרומה #9** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.12`](../03_Core_Features.md)
```

**L7**

```
> **סטטוס פירוט:** מסמך זה הוא **תקציר מבני**. פירוט עומק יתבצע בגרסה עתידית.
```

**L11**

```
## 1. מהות
```

**L13**

```
עולם בעלי החיים מאפשר תרומה / קבלה של כל מה שקשור לחיות מחמד וחיות במצוקה: אימוץ, פנסיון לזמני, חיפוש בית לחיה אבודה, תרומת מזון לחיות, פעילות מקלטים.
```

**L15**

```
**פרסונות:**
```

**L16**

```
* בעלי חיות מחמד הזקוקים לסיוע (פנסיון בזמן נסיעה, מזון בעת מצוקה).
```

**L17**

```
* אנשים שמחפשים בית לחיה (אימוץ).
```

**L18**

```
* מקלטי חיות / עמותות בעלי חיים.
```

**L19**

```
* מתנדבי חיות (טיולי כלבים, סיוע במקלטים).
```

**L23**

```
## 2. מודל הדואליות
```

**L25**

```
### לתת
```

**L26**

```
* **אימוץ:** הצעת חיה לאימוץ.
```

**L27**

```
* **פנסיון לזמני:** "אני שומר על כלב כשמשפחה בנסיעה".
```

**L28**

```
* **תרומת מזון לחיות:** מזון יבש / רטוב, מנה אחת או יותר.
```

**L29**

```
* **תרומת ציוד:** סלסילה, רצועה, קופסת קיטטי, כלוב.
```

**L30**

```
* **התנדבות במקלט:** קישור לעולם הזמן (3.5.11).
```

**L32**

```
### לקבל
```

**L33**

```
* **חיפוש בית:** "כלב נמצא ברחוב, מחפש בית קבע".
```

**L34**

```
* **פנסיון לזמני בעת אבטח:** "ארץ ל-7 ימים, צריך לשמור על החתול".
```

**L35**

```
* **בקשת מזון לחיה במצוקה.**
```

**L36**

```
* **חיה אבודה:** דיווח/חיפוש.
```

**L40**

```
## 3. קטגוריות פנימיות
```

**L42**

```
| קטגוריה            | תיאור                                                  |
```

**L44**

```
| כלבים              | אימוץ, פנסיון, חיפוש                                   |
```

**L45**

```
| חתולים             | אימוץ, פנסיון, חיפוש, סיוע לחתולי רחוב                  |
```

**L46**

```
| חיות אקזוטיות      | ציפורים, ארנבים, זוחלים                                |
```

**L47**

```
| משקיים / חיות משק | סיוע לחקלאים בקושי                                     |
```

**L48**

```
| חיות אבודות        | דיווח, איתור                                            |
```

**L52**

```
## 4. שדות חיוניים
```

**L54**

```
* תמונה (חובה)
```

**L55**

```
* סוג חיה
```

**L56**

```
* גיל / מצב בריאותי / חיסונים
```

**L57**

```
* אופי / היסטוריה
```

**L58**

```
* התאמה לילדים / חיות אחרות
```

**L59**

```
* אזור גיאוגרפי
```

**L60**

```
* (לאימוץ) תהליך – הצהרה, ביקור, חתימת חוזה אימוץ דרך עמותה
```

**L64**

```
## 5. כללים עסקיים ייחודיים
```

**L66**

```
* **R-Animals-1:** אימוץ דרך הפלטפורמה דורש תיווך עמותה מאומתת – אסור אימוץ ישיר בין משתמשים פרטיים (למניעת סחר).
```

**L67**

```
* **R-Animals-2:** דיווח על התעללות בחיות → התראה מיידית לתמיכה + קישור לאגודה לצער בעלי חיים.
```

**L68**

```
* **R-Animals-3:** פנסיון לזמני בין משתמשים פרטיים מותר אך מומלץ אימות זהות הדדי.
```

**L72**

```
## 6. אינטגרציות חוצות-עולמות
```

**L74**

```
* **חפצים (3.5.5):** ציוד לחיות.
```

**L75**

```
* **מזון (3.5.6):** מזון לחיות.
```

**L76**

```
* **זמן (3.5.11):** התנדבות במקלטים.
```

**L80**

```
## 7. אינטגרציות חיצוניות
```

**L82**

```
* **אגודה לצער בעלי חיים בישראל / Let The Animals Live / SOS חיות:** API לבקשות אימוץ.
```

**L86**

```
## 8. מסכים רלוונטיים
```

**L88**

```
| מסך                                | תפקיד                          |
```

**L90**

```
| 5.X Animals Screen (Hub)           | מסך ראשי – לתת/לקבל            |
```

**L91**

```
| 5.X Adoption Catalog               | קטלוג חיות לאימוץ              |
```

**L92**

```
| 5.X Lost & Found                   | אבדה ומציאה                    |
```

**L96**

```
## 9. זרימות משתמש רלוונטיות
```

**L98**

```
* **F13:** דיווח חיה אבודה / חיפוש בית.
```

**L99**

```
* **F-Animals-Adopt:** תהליך אימוץ.
```

**L103**

```
## 10. מקרי קצה ושאלות פתוחות
```

**L105**

```
* תיווך אימוץ – האם להשאיר רק עמותות או גם בני משפחה?
```

**L106**

```
* התעללות בחיות – פרוטוקול דיווח לרשויות?
```

**L110**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/10_Environment.md`

**L3**

```
# 🌱 עולם הסביבה (Environment World)
```

**L5**

```
**עולם תרומה #10** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.13`](../03_Core_Features.md)
```

**L7**

```
> **סטטוס פירוט:** תקציר מבני. פירוט עומק יתבצע בגרסה עתידית.
```

**L11**

```
## 1. מהות
```

**L13**

```
עולם הסביבה מאחד שני אגדים סביבתיים:
```

**L15**

```
* **צמחים:** ייחורים, צמחי בית, גינון קהילתי, חוות נסיינות.
```

**L16**

```
* **מיחזור:** מסירת ציוד יד-שנייה לעמותות מיחזור, פסולת אלקטרונית, אריזות, פסולת מסוכנת.
```

**L18**

```
**פרסונות:**
```

**L19**

```
* גננים חובבים ומקצועיים.
```

**L20**

```
* פעילי סביבה.
```

**L21**

```
* עמותות מיחזור (אקובוטל, נטופית, מאוצרים בית).
```

**L22**

```
* תושבים שזוקקים סיוע פינוי פסולת.
```

**L26**

```
## 2. מודל הדואליות
```

**L28**

```
### לתת
```

**L29**

```
* **צמחים:** ייחור / שתיל / זרעים לחלוקה. תיאום פיזי לאיסוף.
```

**L30**

```
* **חניה לגינה קהילתית.**
```

**L31**

```
* **פסולת ממוחזרת:** "אני אוסף בקבוקי פלסטיק לחלוקה לעמותות".
```

**L32**

```
* **פסולת אלקטרונית:** טלפון ישן, מחשב, סוללות (מסירה לעמותה רשמית).
```

**L33**

```
* **ציוד גינון יד שנייה.**
```

**L35**

```
### לקבל
```

**L36**

```
* **בקשת ייחורים:** "מחפש שתיל גזר".
```

**L37**

```
* **בקשת קומפוסט:** "צריך עזרה בהקמת מערכת קומפוסט בבית".
```

**L38**

```
* **חיפוש מיקום מיחזור:** איפה למסור פסולת מסוכנת באזור.
```

**L42**

```
## 3. קטגוריות פנימיות
```

**L44**

```
| קטגוריה               | דוגמאות                                              |
```

**L46**

```
| צמחי בית              | פיקוס, סוקולנט, קקטוס                                |
```

**L47**

```
| צמחי גינה             | ירקות, פירות, פרחי חוץ                               |
```

**L48**

```
| ייחורים וזרעים        | חלוקת זרעים מקומית                                    |
```

**L49**

```
| גינון קהילתי          | אימוץ ערוגה בגינה ציבורית                            |
```

**L50**

```
| פסולת אלקטרונית       | טלפון, מחשב, סוללות                                  |
```

**L51**

```
| מיחזור פלסטיק/קרטון   | בקבוקים, אריזות                                      |
```

**L52**

```
| פסולת מסוכנת          | תרופות פגי תוקף, שמן, צבעים (קישור לרשויות)           |
```

**L53**

```
| כלי גינון יד שנייה   | מעדר, קלטרת, מערכת השקייה                             |
```

**L57**

```
## 4. שדות חיוניים
```

**L59**

```
* קטגוריה
```

**L60**

```
* כמות
```

**L61**

```
* מצב הצמח / הציוד / הפסולת
```

**L62**

```
* תמונות
```

**L63**

```
* כתובת איסוף
```

**L64**

```
* הגבלות (לדוגמה: "סוללות יש לעטוף בנייר")
```

**L68**

```
## 5. כללים עסקיים ייחודיים
```

**L70**

```
* **R-Env-1:** פסולת מסוכנת חייבת לעבור דרך גוף מורשה. אסור פינוי פיראטי.
```

**L71**

```
* **R-Env-2:** בעת מסירת צמח – ציון מצב בריאותי (מחלות, מזיקים).
```

**L72**

```
* **R-Env-3:** פסולת אלקטרונית מסירה דרך עמותות מאומתות בלבד.
```

**L76**

```
## 6. אינטגרציות חיצוניות
```

**L78**

```
* רשות הטבע והגנים (לעקירת צמחים מוגנים).
```

**L79**

```
* מ.אי. (איסוף פסולת אלקטרונית).
```

**L80**

```
* רשויות מקומיות (פסולת מסוכנת).
```

**L84**

```
## 7. מסכים רלוונטיים
```

**L86**

```
| מסך                                | תפקיד                              |
```

**L88**

```
| 5.X Environment Screen (Hub)       | מסך ראשי – לתת/לקבל                |
```

**L89**

```
| 5.X Plant Catalog                  | קטלוג צמחים לחלוקה                 |
```

**L90**

```
| 5.X Recycling Map                  | מפת נקודות מיחזור                  |
```

**L94**

```
## 8. זרימות משתמש רלוונטיות
```

**L96**

```
* **F14:** מסירת ייחורים בקהילה.
```

**L100**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/11_Creative.md`

**L3**

```
# 🎨 עולם היצירה (Creative World)
```

**L5**

```
**עולם תרומה #11** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.14`](../03_Core_Features.md)
```

**L7**

```
> **סטטוס פירוט:** תקציר מבני. פירוט עומק יתבצע בגרסה עתידית.
```

**L11**

```
## 1. מהות
```

**L13**

```
עולם היצירה מאחד שלושה אגדים תרבותיים-יצירתיים:
```

**L15**

```
* **מוזיקה:** כלי נגינה לתרומה, ליווי בנגינה, ג'אם סשנים, שיעורי נגינה (קישור לידע 3.5.10).
```

**L16**

```
* **מתכונים:** שיתוף מתכונים, התאמה לתזונה מיוחדת (קוטף, צמחוני, ללא גלוטן), מתכוני סבתות.
```

**L17**

```
* **חידות:** חידות לוגיקה, חידות מתמטיות, אתגרי חשיבה, ספרי חידות לקהילה.
```

**L19**

```
**פרסונות:**
```

**L20**

```
* מוזיקאים חובבים ומקצועיים.
```

**L21**

```
* טבחים חובבים.
```

**L22**

```
* יוצרי חידות / חינוכאים.
```

**L23**

```
* צרכני תוכן יצירתי.
```

**L27**

```
## 2. מודל הדואליות
```

**L29**

```
### לתת
```

**L30**

```
* **מוזיקה:** מסירת כלי נגינה (קישור לחפצים 3.5.5), הצעת ליווי בנגינה לאירוע, ג'אם פתוח, שיעור פרטי.
```

**L31**

```
* **מתכונים:** העלאת מתכון עם תמונה, רכיבים, הוראות, אלרגנים, התאמת תזונה.
```

**L32**

```
* **חידות:** העלאת חידה (ויזואלית / טקסטואלית), רמות קושי, תשובות מנוטרות.
```

**L34**

```
### לקבל
```

**L35**

```
* **בקשת ליווי בנגינה:** "מחפש גיטריסט לחתונה קהילתית."
```

**L36**

```
* **בקשת מתכון מיוחד:** "אני סוכרתי, מחפש מתכון קינוח ללא סוכר."
```

**L37**

```
* **בקשת חידה לאירוע:** "מארגן יום הולדת לילד, מחפש חידות מתאימות לגיל 8."
```

**L41**

```
## 3. קטגוריות פנימיות
```

**L43**

```
### מוזיקה
```

**L44**

```
| תת-קטגוריה            | דוגמאות                            |
```

**L46**

```
| כלי נגינה לתרומה      | גיטרה, פסנתר, חליל, תופים           |
```

**L47**

```
| הצעת ליווי בנגינה     | חתונות, אירועי קהילה, חוגי גיל זהב   |
```

**L48**

```
| ג'אם פתוח              | קבוצת מנגנים שמתכנסת בקביעות       |
```

**L49**

```
| שיעור פרטי בנגינה     | מורה אישי                           |
```

**L51**

```
### מתכונים
```

**L52**

```
| תת-קטגוריה            | דוגמאות                            |
```

**L54**

```
| מתכוני סבתות          | מתכוני מסורת קהילתית               |
```

**L55**

```
| תזונה מיוחדת          | קטוגני, צמחוני, ללא גלוטן          |
```

**L56**

```
| אוכל לחגים            | ראש השנה, פסח, סוכות               |
```

**L57**

```
| בישול בכמויות גדולות   | מתכונים לאירועים                   |
```

**L59**

```
### חידות
```

**L60**

```
| תת-קטגוריה            | דוגמאות                            |
```

**L62**

```
| לוגיקה                | סודוקו, חידות שח, מבוכים           |
```

**L63**

```
| מתמטיקה               | חידות חשבון, גיאומטריה             |
```

**L64**

```
| מילים                 | תשבצים, מילים ניידות                |
```

**L65**

```
| חידות לילדים          | מתאימות גיל                        |
```

**L69**

```
## 4. שדות חיוניים
```

**L71**

```
* קטגוריה + תת-קטגוריה
```

**L72**

```
* תמונה / וידאו
```

**L73**

```
* הוראות / תוכן
```

**L74**

```
* רמת קושי (אם רלוונטי)
```

**L75**

```
* התאמות (תזונה / גיל / רמה)
```

**L79**

```
## 5. כללים עסקיים
```

**L81**

```
* **R-Creative-1:** מתכונים מקושרים לעולם המזון (3.5.6) אם ביצועם מוביל לחלוקת מזון בפועל.
```

**L82**

```
* **R-Creative-2:** חידות עוברות אישור מנהלת ארגון לפני פרסום (כמו ידע 3.5.10).
```

**L83**

```
* **R-Creative-3:** מסירת כלי נגינה היא תהליך חפצים (3.5.5) – עם תיוג כפול.
```

**L87**

```
## 6. אינטגרציות חוצות-עולמות
```

**L89**

```
* **חפצים (3.5.5):** כלי נגינה.
```

**L90**

```
* **מזון (3.5.6):** ביצוע מתכון לחלוקה.
```

**L91**

```
* **ידע (3.5.10):** שיעור נגינה / שיעור בישול.
```

**L92**

```
* **זמן (3.5.11):** ליווי מוזיקלי לאירועים.
```

**L96**

```
## 7. מסכים רלוונטיים
```

**L98**

```
| מסך                                | תפקיד                              |
```

**L100**

```
| 5.X Creative Screen (Hub)          | מסך ראשי – 3 לשוניות               |
```

**L101**

```
| 5.X Music Catalog                  | קטלוג מוזיקה                       |
```

**L102**

```
| 5.X Recipe Browser                 | דפדפן מתכונים                      |
```

**L103**

```
| 5.X Riddle Daily                   | חידה יומית                         |
```

**L107**

```
## 8. זרימות משתמש רלוונטיות
```

**L109**

```
* **F15:** העלאת מתכון.
```

**L110**

```
* **F-Creative-Riddle:** פתיחת חידה יומית.
```

**L114**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/12_Matchmaking_Romantic.md`

**L3**

```
# 💞 עולם השידוכים הרומנטיים (Matchmaking – Romantic)
```

**L5**

```
**עולם תרומה #12** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.15`](../03_Core_Features.md)
```

**L7**

```
> **סטטוס פירוט:** תקציר מבני. פירוט עומק יתבצע בגרסה עתידית.
```

**L11**

```
## 1. הבחנה חשובה: שני סוגי "שידוכים"
```

**L13**

```
הפלטפורמה כוללת **שתי מערכות נפרדות** שמכילות את המילה "שידוכים" – יש להבדיל ביניהן:
```

**L15**

```
| מערכת                        | מהות                                                    | סעיף PRD                  |
```

**L17**

```
| **שידוכים-טוב (Operator Matching)** | מנגנון תיווך אנושי בין צרכים↔משאבים בכל העולמות, מבוצע ע"י מוקדנים מאומנים | 3.4 ב-PRD                |
```

**L18**

```
| **שידוכים רומנטיים (Romantic Matchmaking)** | תרומת זמן וכישורים של שדכן/שדכנית מתנדב/ת לעזור לרווקים/ות למצוא בני זוג | 3.5.15 ב-PRD (עולם זה)   |
```

**L20**

```
**מסמך זה עוסק רק בשידוכים רומנטיים.**
```

**L24**

```
## 2. מהות
```

**L26**

```
עולם השידוכים הרומנטיים הוא **התנדבות לעזרה לרווקים/ות** במציאת זוגיות. שדכנים מתנדבים – מנוסים, רגישים, או עם רשת קשרים – מציעים את שירותם **בחינם** למחפשי זוגיות בקהילה.
```

**L28**

```
**הצורך שהוא פותר:**
```

**L29**

```
* שדכנים מנוסים יש להם חברים/קשרים אבל אין להם פלטפורמה ייעודית.
```

**L30**

```
* רווקים/ות שמתעייפים מאפליקציות הכרויות מסחריות (Tinder, JDate) רוצים גישה אישית-קהילתית.
```

**L31**

```
* קהילות דתיות / סגורות מבכרות שדכנות מסורתית.
```

**L33**

```
**פרסונות:**
```

**L34**

```
* 👤 שדכן/ית מתנדב/ת.
```

**L35**

```
* 👤 מחפש/ת זוגיות.
```

**L36**

```
* 🏢 ארגוני שידוכים מסורתיים (יהדות חרדית, דרום אסיה, אתיופיה).
```

**L40**

```
## 3. מודל הדואליות
```

**L42**

```
### לתת
```

**L43**

```
* **הצעת שירות שדכנות:** פרופיל שדכן עם ניסיון, סגנון עבודה, אזורי התמחות (חרדי / דתי / חילוני / קהילה ספציפית).
```

**L44**

```
* **שעות זמינות לפגישות.**
```

**L46**

```
### לקבל
```

**L47**

```
* **בקשת חיבור:** מחפש/ת זוגיות מפרסם פרופיל שידוכים: גיל, מקצוע, ערכים, רקע, חיפושיות, רמת אנונימיות גבוהה (ברירת מחדל רמה 1 או 2).
```

**L48**

```
* **שדכן רואה רשימת מבקשים** ומציע חיבורים.
```

**L52**

```
## 4. תהליך ייחודי
```

**L54**

```
1. **רישום שדכן:** המשתמש פותח פרופיל שדכן (אופציונלי – נדרש "וי כחול" + 3 ביקורות חיוביות אחרי 5 שידוכים ראשונים).
```

**L55**

```
2. **רישום מחפש זוג:** טופס מפורט עם רמת אנונימיות 1 (ברירת מחדל).
```

**L56**

```
3. **שדכן מציע:** "אני חושב שיש התאמה בין X ל-Y, האם אני יכול ליצור קשר ביניכם?"
```

**L57**

```
4. **שני הצדדים מסכימים בנפרד.**
```

**L58**

```
5. **חיבור ראשוני:** השדכן יוצר צ'אט משולש או צ'אט נפרד עם כל אחד.
```

**L59**

```
6. **המשך פרטי:** הצדדים נפגשים. השדכן מקבל סטטוס (התאמה / לא התאמה).
```

**L60**

```
7. **סגירת תיק.**
```

**L64**

```
## 5. כללים עסקיים ייחודיים
```

**L66**

```
* **R-Match-1:** **חינם בלבד.** אסור לקבל תשלום על שידוך.
```

**L67**

```
* **R-Match-2:** **רמת אנונימיות גבוהה לפי ברירת מחדל** למחפשי זוגיות.
```

**L68**

```
* **R-Match-3:** השדכן חייב "וי כחול" + תקופת ניסיון של 5 שידוכים תחת ליווי שדכן ותיק / מנהל מוקד.
```

**L69**

```
* **R-Match-4:** שני הצדדים חייבים אישור פרטני לפני חשיפת זהויות.
```

**L70**

```
* **R-Match-5:** דיווח על התנהגות לא הולמת מצד שדכן = השעיה.
```

**L71**

```
* **R-Match-6:** **קטינים אסורים** במערכת השידוכים הרומנטיים – מינימום 18.
```

**L72**

```
* **R-Match-7:** Audit Trail מלא על כל פעולה של שדכן.
```

**L76**

```
## 6. אינטגרציות חוצות-עולמות
```

**L78**

```
* **שידוכים-טוב (3.4):** למבקש זוג שגם זקוק לסיוע אחר – חיבור למוקדן.
```

**L79**

```
* **זמן (3.5.11):** שדכנות נחשבת לתרומת זמן וניתן לדווח שעות.
```

**L83**

```
## 7. מסכים רלוונטיים
```

**L85**

```
| מסך                                | תפקיד                                          |
```

**L87**

```
| 5.7 Matchmaking Screen (Hub)       | מסך ראשי – לתת/לקבל                            |
```

**L88**

```
| 5.7.X Matchmaker Profile           | פרופיל שדכן                                    |
```

**L89**

```
| 5.7.X Match Seeker Profile         | פרופיל מחפש זוג (עם רמת אנונימיות גבוהה)       |
```

**L90**

```
| 5.7.X Triple Chat (משולש)          | צ'אט שדכן + 2 צדדים                            |
```

**L94**

```
## 8. זרימות משתמש רלוונטיות
```

**L96**

```
* **F16:** רישום כשדכן.
```

**L97**

```
* **F-Match-Romantic-Connect:** הצעת חיבור והסכמה הדדית.
```

**L101**

```
## 9. מקרי קצה
```

**L103**

```
* **שדכן שמטרד מבקש זוג:** דיווח, השעיה, חסימה.
```

**L104**

```
* **חיבור ללא הסכמה:** אסור. כל חיבור דורש דבל-אופ-אין.
```

**L105**

```
* **בני זוג רווקים שכבר מצאו זוגיות:** עדכון סטטוס + הסרה.
```

**L109**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `PRD_V2_NOT_FOR_MVP/donation_worlds/13_App_Design.md`

**L3**

```
# 🎨 עולם עיצוב האפליקציה (App Design World)
```

**L5**

```
**עולם תרומה #13** | **חזרה לאינדקס:** [`00_Index.md`](./00_Index.md) | **PRD ראשי:** [`../03_Core_Features.md#3.5.16`](../03_Core_Features.md)
```

**L7**

```
> **סטטוס פירוט:** תקציר מבני. פירוט עומק יתבצע בגרסה עתידית.
```

**L11**

```
## 1. מהות וייחוד
```

**L13**

```
עולם עיצוב האפליקציה הוא **מטא-עולם** – העולם היחיד שבו נושא התרומה הוא **המראה של הפלטפורמה עצמה**. משתמשים בעלי כישרון עיצובי יוצרים סקלות צבעים, ערכות נושא, וגרסאות UI מותאמות (כפי שמתואר בסעיף 3.1.6 ב-PRD), ומשתפים את היצירה לקהילה.
```

**L17**

```
## 2. מודל הדואליות
```

**L19**

```
### לתת
```

**L20**

```
* **שיתוף ערכת עיצוב:** המשתמש שעיצב את האפליקציה שלו (ראה 3.1.6) שולח את הערכה לקהילה.
```

**L21**

```
* **השם:** הערכה מקבלת שם, תיאור, ואופציונלית קישור לתחום ("כהה לעבודת לילה", "צבעים חמים", "נגישות גבוהה").
```

**L22**

```
* **תצוגה מקדימה:** אחרים רואים תצוגת תמונה ויכולים לאמץ.
```

**L24**

```
### לקבל
```

**L25**

```
* **דפדוף בערכות:** משתמש שלא יודע לעצב יכול לבחור מערכות שמשתמשים אחרים שיתפו.
```

**L26**

```
* **מכרז ערכות:** הקהילה יכולה להציע "מערכת לחג" / "מערכת לאירוע מיוחד".
```

**L30**

```
## 3. שדות חיוניים
```

**L32**

```
* שם הערכה
```

**L33**

```
* תיאור / השראה
```

**L34**

```
* תצוגות מקדימות (מסך הבית, מסך פרופיל, מסך פיד)
```

**L35**

```
* תגיות (כהה / בהיר / חם / קר / נגישות / ילדים)
```

**L36**

```
* יוצר (חבר קהילה / עמותה)
```

**L40**

```
## 4. כללים
```

**L42**

```
* **R-Design-1:** ערכה דורשת מינימום 5 צבעים מוגדרים (רקע, טקסט ראשי, טקסט משני, הדגשה, אזהרה).
```

**L43**

```
* **R-Design-2:** ערכה חייבת לעבור בדיקת נגישות בסיסית (Contrast Ratio).
```

**L44**

```
* **R-Design-3:** עיצוב פוגעני / לא הולם → השעיה.
```

**L45**

```
* **R-Design-4:** ערכות שיתוף ארגון יוחלו על המסכים הציבוריים של הארגון בלבד (סעיף 3.1.5 ב-PRD).
```

**L49**

```
## 5. אינטגרציות
```

**L51**

```
* **חוויה מותאמת אישית (3.1.6):** ערכה שמשתמש מאמץ מוטמעת בפרופיל UI שלו.
```

**L52**

```
* **עוזר AI:** משתמש יכול לבקש מ-AI לעצב ערכה ולשתף ישירות.
```

**L56**

```
## 6. מסכים רלוונטיים
```

**L58**

```
| מסך                                | תפקיד                          |
```

**L60**

```
| 2.6 UI Customization Modal (קיים)  | חלון התאמה אישית (PRD)         |
```

**L61**

```
| 5.X App Design Catalog             | קטלוג ערכות מהקהילה            |
```

**L65**

```
## 7. זרימות משתמש רלוונטיות
```

**L67**

```
* **זרימה 19:** התאמת עיצוב אישי של האפליקציה (קיים ב-PRD).
```

**L68**

```
* **F-Design-Share:** שיתוף ערכת עיצוב לקהילה.
```

**L72**

```
*חזרה ל-[אינדקס עולמות](./00_Index.md) | [PRD ראשי](../00_Index.md)*
```

---

## `supabase/functions/dispatch-notification/i18n.json`

**L4**

```
  "notifications.chatBodyCoalesced": "{{count}} הודעות חדשות",
```

**L5**

```
  "notifications.supportTitle": "תמיכת קהילת קארמה",
```

**L6**

```
  "notifications.systemTitle": "הודעת מערכת",
```

**L8**

```
  "notifications.postExpiringTitle": "הפוסט שלך יפוג בעוד 7 ימים",
```

**L11**

```
  "notifications.markRecipientBody": "סימן אותך כמקבל של {{postTitle}}",
```

**L13**

```
  "notifications.unmarkRecipientBody": "הסיר את הסימון מ-{{postTitle}}",
```

**L14**

```
  "notifications.autoRemovedTitle": "הפוסט שלך הוסר",
```

**L15**

```
  "notifications.autoRemovedBody": "הסיבה: דווח על-ידי מספר משתמשים. למידע נוסף — לחץ.",
```

**L17**

```
  "notifications.followRequestBody": "מבקש לעקוב אחריך",
```

**L19**

```
  "notifications.followStartedBody": "התחיל לעקוב אחריך",
```

**L20**

```
  "notifications.followStartedCoalesced": "{{count}} עוקבים חדשים",
```

**L22**

```
  "notifications.followApprovedBody": "אישר את בקשת המעקב שלך"
```

---

## `supabase/migrations/0001_init_users.sql`

**L24**

```
  ('tel-aviv',     'תל אביב',          'Tel Aviv'),
```

**L25**

```
  ('jerusalem',    'ירושלים',           'Jerusalem'),
```

**L26**

```
  ('haifa',        'חיפה',              'Haifa'),
```

**L27**

```
  ('rishon',       'ראשון לציון',       'Rishon LeZion'),
```

**L28**

```
  ('petah-tikva',  'פתח תקווה',         'Petah Tikva'),
```

**L29**

```
  ('ashdod',       'אשדוד',             'Ashdod'),
```

**L30**

```
  ('netanya',      'נתניה',             'Netanya'),
```

**L31**

```
  ('beer-sheva',   'באר שבע',           'Beer Sheva'),
```

**L32**

```
  ('bnei-brak',    'בני ברק',           'Bnei Brak'),
```

**L33**

```
  ('holon',        'חולון',             'Holon'),
```

**L34**

```
  ('ramat-gan',    'רמת גן',            'Ramat Gan'),
```

**L35**

```
  ('ashkelon',     'אשקלון',            'Ashkelon'),
```

**L36**

```
  ('rehovot',      'רחובות',            'Rehovot'),
```

**L37**

```
  ('bat-yam',      'בת ים',             'Bat Yam'),
```

**L38**

```
  ('herzliya',     'הרצליה',            'Herzliya'),
```

**L39**

```
  ('kfar-saba',    'כפר סבא',           'Kfar Saba'),
```

**L40**

```
  ('hadera',       'חדרה',              'Hadera'),
```

**L41**

```
  ('modiin',       'מודיעין',           'Modi''in'),
```

**L42**

```
  ('nazareth',     'נצרת',              'Nazareth'),
```

**L43**

```
  ('raanana',      'רעננה',             'Ra''anana')
```

**L159**

```
    coalesce(picked_name, email_local, 'משתמש'),
```

**L161**

```
    'תל אביב',
```

**L218**

```
      coalesce(picked_name, email_local, 'משתמש'),
```

**L220**

```
      'תל אביב',
```

---

## `supabase/migrations/0008_seed_all_cities.sql`

**L12**

```
  ('3400', 'חברון', 'חברון'),
```

**L13**

```
  ('1347', 'קצר א-סר', 'קצר א-סר'),
```

**L14**

```
  ('1331', 'כמאנה', 'כמאנה'),
```

**L15**

```
  ('3777', 'סנסנה', 'סנסנה'),
```

**L16**

```
  ('963', 'אעצם (שבט)', 'A''SAM'),
```

**L17**

```
  ('1220', 'אבירים', 'ABBIRIM'),
```

**L18**

```
  ('958', 'אבו עבדון (שבט)', 'ABU ABDUN'),
```

**L19**

```
  ('1042', 'אבו עמאר (שבט)', 'ABU AMMAR'),
```

**L20**

```
  ('932', 'אבו עמרה (שבט)', 'ABU AMRE'),
```

**L21**

```
  ('472', 'אבו גוש', 'ABU GHOSH'),
```

**L22**

```
  ('967', 'אבו ג''ווייעד (שבט)', 'ABU JUWEI''ID'),
```

**L23**

```
  ('968', 'אבו קורינאת (שבט)', 'ABU QUREINAT'),
```

**L24**

```
  ('1342', 'אבו קרינאת (יישוב)', 'ABU QUREINAT'),
```

**L25**

```
  ('966', 'אבו רובייעה (שבט)', 'ABU RUBEI''A'),
```

**L26**

```
  ('961', 'אבו רוקייק (שבט)', 'ABU RUQAYYEQ'),
```

**L27**

```
  ('473', 'אבו סנאן', 'ABU SINAN'),
```

**L28**

```
  ('935', 'אבו סריחאן (שבט)', 'ABU SUREIHAN'),
```

**L29**

```
  ('1375', 'אבו תלול', 'ABU TULUL'),
```

**L30**

```
  ('1068', 'אדמית', 'ADAMIT'),
```

**L31**

```
  ('2035', 'עדנים', 'ADANIM'),
```

**L32**

```
  ('1123', 'אדרת', 'ADDERET'),
```

**L33**

```
  ('113', 'אדירים', 'ADDIRIM'),
```

**L34**

```
  ('3874', 'עדי עד', 'ADE AD'),
```

**L35**

```
  ('1199', 'עדי', 'ADI'),
```

**L36**

```
  ('3759', 'אדורה', 'ADORA'),
```

**L37**

```
  ('3987', 'אדוריים', 'ADORAYIM'),
```

**L38**

```
  ('959', 'אפיניש (שבט)', 'AFEINISH'),
```

**L39**

```
  ('313', 'אפק', 'AFEQ'),
```

**L40**

```
  ('4301', 'אפיק', 'AFIQ'),
```

**L41**

```
  ('176', 'אפיקים', 'AFIQIM'),
```

**L42**

```
  ('7700', 'עפולה', 'AFULA'),
```

**L43**

```
  ('794', 'עגור', 'AGUR'),
```

**L44**

```
  ('1157', 'אחווה', 'AHAWA'),
```

**L45**

```
  ('797', 'אחיעזר', 'AHI''EZER'),
```

**L46**

```
  ('785', 'אחיהוד', 'AHIHUD'),
```

**L47**

```
  ('804', 'אחיסמך', 'AHISAMAKH'),
```

**L48**

```
  ('850', 'אחיטוב', 'AHITUV'),
```

**L49**

```
  ('3875', 'אחיה', 'AHIYA'),
```

**L50**

```
  ('821', 'אחוזם', 'AHUZZAM'),
```

**L51**

```
  ('1330', 'אחוזת ברק', 'AHUZZAT BARAQ'),
```

**L52**

```
  ('7600', 'עכו', 'AKKO'),
```

**L53**

```
  ('1359', 'אל סייד', 'AL SAYYID'),
```

**L54**

```
  ('1316', 'אל-עריאן', 'AL-ARYAN'),
```

**L55**

```
  ('1339', 'אל-עזי', 'AL-AZY'),
```

**L56**

```
  ('3727', 'עלי זהב', 'ALE ZAHAV'),
```

**L57**

```
  ('3750', 'אלפי מנשה', 'ALFE MENASHE'),
```

**L58**

```
  ('3898', 'אלון', 'ALLON'),
```

**L59**

```
  ('1182', 'אלון הגליל', 'ALLON HAGALIL'),
```

**L60**

```
  ('3604', 'אלון שבות', 'ALLON SHEVUT'),
```

**L61**

```
  ('429', 'אלוני אבא', 'ALLONE ABBA'),
```

**L62**

```
  ('4017', 'אלוני הבשן', 'ALLONE HABASHAN'),
```

**L63**

```
  ('868', 'אלוני יצחק', 'ALLONE YIZHAQ'),
```

**L64**

```
  ('285', 'אלונים', 'ALLONIM'),
```

**L65**

```
  ('688', 'עלמה', 'ALMA'),
```

**L66**

```
  ('1125', 'אלמגור', 'ALMAGOR'),
```

**L67**

```
  ('3556', 'אלמוג', 'ALMOG'),
```

**L68**

```
  ('3715', 'עלמון', 'ALMON'),
```

**L69**

```
  ('1146', 'עלומים', 'ALUMIM'),
```

**L70**

```
  ('1145', 'אלומה', 'ALUMMA'),
```

**L71**

```
  ('330', 'אלומות', 'ALUMMOT'),
```

**L72**

```
  ('23', 'אמציה', 'AMAZYA'),
```

**L73**

```
  ('319', 'עמיר', 'AMIR'),
```

**L74**

```
  ('1064', 'אמירים', 'AMIRIM'),
```

**L75**

```
  ('385', 'עמיעד', 'AMMI''AD'),
```

**L76**

```
  ('318', 'עמיעוז', 'AMMI''OZ'),
```

**L77**

```
  ('3824', 'עמיחי', 'AMMIHAY'),
```

**L78**

```
  ('779', 'עמינדב', 'AMMINADAV'),
```

**L79**

```
  ('773', 'עמיקם', 'AMMIQAM'),
```

**L80**

```
  ('1253', 'אמנון', 'AMNUN'),
```

**L81**

```
  ('708', 'עמקה', 'AMQA'),
```

**L82**

```
  ('1212', 'עמוקה', 'AMUQQA'),
```

**L83**

```
  ('4012', 'אניעם', 'ANI''AM'),
```

**L84**

```
  ('637', 'ערערה', 'AR''ARA'),
```

**L85**

```
  ('1192', 'ערערה-בנגב', 'AR''ARA-BANEGEV'),
```

**L86**

```
  ('2560', 'ערד', 'ARAD'),
```

**L87**

```
  ('1246', 'עראמשה', 'ARAMSHA'),
```

**L88**

```
  ('701', 'ארבל', 'ARBEL'),
```

**L89**

```
  ('3598', 'ארגמן', 'ARGAMAN'),
```

**L90**

```
  ('3570', 'אריאל', 'ARI''EL'),
```

**L91**

```
  ('1335', 'ערב אל נעים', 'ARRAB AL NAIM'),
```

**L92**

```
  ('531', 'עראבה', 'ARRABE'),
```

**L93**

```
  ('1324', 'ארסוף', 'ARSUF'),
```

**L94**

```
  ('593', 'ערוגות', 'ARUGOT'),
```

**L95**

```
  ('3861', 'עשהאל', 'ASA''EL'),
```

**L96**

```
  ('960', 'אסד (שבט)', 'ASAD'),
```

**L97**

```
  ('3754', 'אספר', 'ASEFAR'),
```

**L98**

```
  ('591', 'עשרת', 'ASERET'),
```

**L99**

```
  ('1152', 'אשלים', 'ASHALIM'),
```

**L100**

```
  ('70', 'אשדוד', 'ASHDOD'),
```

**L101**

```
  ('199', 'אשדות יעקב (איחוד)', 'ASHDOT YA''AQOV(IHUD)'),
```

**L102**

```
  ('188', 'אשדות יעקב (מאוחד)', 'ASHDOT YA''AQOV(ME''UH'),
```

**L103**

```
  ('1256', 'אשרת', 'ASHERAT'),
```

**L104**

```
  ('7100', 'אשקלון', 'ASHQELON'),
```

**L105**

```
  ('969', 'עטאוונה (שבט)', 'ATAWNE'),
```

**L106**

```
  ('3658', 'עטרת', 'ATERET'),
```

**L107**

```
  ('53', 'עתלית', 'ATLIT'),
```

**L108**

```
  ('965', 'אטרש (שבט)', 'ATRASH'),
```

**L109**

```
  ('917', 'עצמון שגב', 'ATSMON-SEGEV'),
```

**L110**

```
  ('892', 'עבדון', 'AVDON'),
```

**L111**

```
  ('679', 'אביאל', 'AVI''EL'),
```

**L112**

```
  ('1070', 'אביעזר', 'AVI''EZER'),
```

**L113**

```
  ('3869', 'אביגיל', 'AVIGAYIL'),
```

**L114**

```
  ('819', 'אביגדור', 'AVIGEDOR'),
```

**L115**

```
  ('175', 'אביחיל', 'AVIHAYIL'),
```

**L116**

```
  ('2052', 'אביטל', 'AVITAL'),
```

**L117**

```
  ('1115', 'אביבים', 'AVIVIM'),
```

**L118**

```
  ('4011', 'אבני איתן', 'AVNE ETAN'),
```

**L119**

```
  ('3793', 'אבני חפץ', 'AVNE HEFEZ'),
```

**L120**

```
  ('1311', 'אבשלום', 'AVSHALOM'),
```

**L121**

```
  ('1275', 'אבטליון', 'AVTALYON'),
```

**L122**

```
  ('156', 'עיינות', 'AYANOT'),
```

**L123**

```
  ('77', 'איילת השחר', 'AYYELET HASHAHAR'),
```

**L124**

```
  ('711', 'עזריה', 'AZARYA'),
```

**L125**

```
  ('565', 'אזור', 'AZOR'),
```

**L126**

```
  ('837', 'עזריאל', 'AZRI''EL'),
```

**L127**

```
  ('817', 'עזריקם', 'AZRIQAM'),
```

**L128**

```
  ('2043', 'בחן', 'BAHAN'),
```

**L129**

```
  ('94', 'בלפוריה', 'BALFURIYYA'),
```

**L130**

```
  ('6000', 'באקה אל-גרביה', 'BAQA AL-GHARBIYYE'),
```

**L131**

```
  ('823', 'בר גיורא', 'BAR GIYYORA'),
```

**L132**

```
  ('3499', 'בר כוכבא', 'BAR KOKHVA'),
```

**L133**

```
  ('1191', 'בר יוחאי', 'BAR YOHAY'),
```

**L134**

```
  ('667', 'ברעם', 'BAR''AM'),
```

**L135**

```
  ('141', 'ברק', 'BARAQ'),
```

**L136**

```
  ('2038', 'ברקת', 'BAREQET'),
```

**L137**

```
  ('3654', 'ברקן', 'BARQAN'),
```

**L138**

```
  ('617', 'ברקאי', 'BARQAY'),
```

**L139**

```
  ('1326', 'בסמה', 'BASMA'),
```

**L140**

```
  ('944', 'בסמת טבעון', 'BASMAT TAB''UN'),
```

**L141**

```
  ('3794', 'בת עין', 'BAT AYIN'),
```

**L142**

```
  ('1323', 'בת הדר', 'BAT HADAR'),
```

**L143**

```
  ('1319', 'בת חפר', 'BAT HEFER'),
```

**L144**

```
  ('1361', 'בת חן', 'BAT HEN'),
```

**L145**

```
  ('33', 'בת שלמה', 'BAT SHELOMO'),
```

**L146**

```
  ('6200', 'בת ים', 'BAT YAM'),
```

**L147**

```
  ('389', 'בצרה', 'BAZRA'),
```

**L148**

```
  ('1278', 'באר מילכה', 'BE''ER MILKA'),
```

**L149**

```
  ('21', 'באר אורה', 'BE''ER ORA'),
```

**L150**

```
  ('9000', 'באר שבע', 'BE''ER SHEVA'),
```

**L151**

```
  ('155', 'באר טוביה', 'BE''ER TUVEYA'),
```

**L152**

```
  ('2530', 'באר יעקב', 'BE''ER YA''AQOV'),
```

**L153**

```
  ('399', 'בארי', 'BE''ERI'),
```

**L154**

```
  ('450', 'בארות יצחק', 'BE''EROT YIZHAQ'),
```

**L155**

```
  ('697', 'בארותיים', 'BE''EROTAYIM'),
```

**L156**

```
  ('1376', 'באר גנים', 'BEER GANNIM'),
```

**L157**

```
  ('480', 'בית ג''ן', 'BEIT JANN'),
```

**L158**

```
  ('712', 'בן עמי', 'BEN AMMI'),
```

**L159**

```
  ('2013', 'בן שמן (מושב)', 'BEN SHEMEN (MOSHAV)'),
```

**L160**

```
  ('1084', 'בן שמן (כפר נוער)', 'BEN SHEMEN(K.NO''AR)'),
```

**L161**

```
  ('760', 'בן זכאי', 'BEN ZAKKAY'),
```

**L162**

```
  ('685', 'בניה', 'BENAYA'),
```

**L163**

```
  ('448', 'בני עטרות', 'BENE ATAROT'),
```

**L164**

```
  ('1066', 'בני עיש', 'BENE AYISH'),
```

**L165**

```
  ('6100', 'בני ברק', 'BENE BERAQ'),
```

**L166**

```
  ('592', 'בני דרום', 'BENE DAROM'),
```

**L167**

```
  ('386', 'בני דרור', 'BENE DEROR'),
```

**L168**

```
  ('1363', 'בני נצרים', 'BENE NEZARIM'),
```

**L169**

```
  ('588', 'בני ראם', 'BENE RE''EM'),
```

**L170**

```
  ('4015', 'בני יהודה', 'BENE YEHUDA'),
```

**L171**

```
  ('418', 'בני ציון', 'BENE ZIYYON'),
```

**L172**

```
  ('3612', 'בקעות', 'BEQA''OT'),
```

**L173**

```
  ('864', 'בקוע', 'BEQOA'),
```

**L174**

```
  ('3710', 'ברכה', 'BERAKHA'),
```

**L175**

```
  ('746', 'ברכיה', 'BEREKHYA'),
```

**L176**

```
  ('428', 'ברור חיל', 'BEROR HAYIL'),
```

**L177**

```
  ('2060', 'ברוש', 'BEROSH'),
```

**L178**

```
  ('95', 'בית אלפא', 'BET ALFA'),
```

**L179**

```
  ('604', 'בית עריף', 'BET ARIF'),
```

**L180**

```
  ('3652', 'בית אריה', 'BET ARYE'),
```

**L181**

```
  ('1076', 'בית ברל', 'BET BERL'),
```

**L182**

```
  ('466', 'בית דגן', 'BET DAGAN'),
```

**L183**

```
  ('3574', 'בית אל', 'BET EL'),
```

**L184**

```
  ('562', 'בית אלעזרי', 'BET EL''AZARI'),
```

**L185**

```
  ('756', 'בית עזרא', 'BET EZRA'),
```

**L186**

```
  ('571', 'בית גמליאל', 'BET GAMLI''EL'),
```

**L187**

```
  ('619', 'בית גוברין', 'BET GUVRIN'),
```

**L188**

```
  ('3645', 'בית הערבה', 'BET HAARAVA'),
```

**L189**

```
  ('572', 'בית העמק', 'BET HAEMEQ'),
```

**L190**

```
  ('723', 'בית הגדי', 'BET HAGADDI'),
```

**L191**

```
  ('373', 'בית הלוי', 'BET HALEVI'),
```

**L192**

```
  ('159', 'בית חנן', 'BET HANAN'),
```

**L193**

```
  ('800', 'בית חנניה', 'BET HANANYA'),
```

**L194**

```
  ('242', 'בית השיטה', 'BET HASHITTA'),
```

**L195**

```
  ('1050', 'בית חשמונאי', 'BET HASHMONAY'),
```

**L196**

```
  ('877', 'בית חירות', 'BET HERUT'),
```

**L197**

```
  ('322', 'בית הלל', 'BET HILLEL'),
```

**L198**

```
  ('2033', 'בית חלקיה', 'BET HILQIYYA'),
```

**L199**

```
  ('3864', 'בית חוגלה', 'BET HOGLA'),
```

**L200**

```
  ('3575', 'בית חורון', 'BET HORON'),
```

**L201**

```
  ('430', 'בית לחם הגלילית', 'BET LEHEM HAGELILIT'),
```

**L202**

```
  ('751', 'בית מאיר', 'BET ME''IR'),
```

**L203**

```
  ('784', 'בית נחמיה', 'BET NEHEMYA'),
```

**L204**

```
  ('672', 'בית נקופה', 'BET NEQOFA'),
```

**L205**

```
  ('16', 'בית ניר', 'BET NIR'),
```

**L206**

```
  ('317', 'בית אורן', 'BET OREN'),
```

**L207**

```
  ('202', 'בית עובד', 'BET OVED'),
```

**L208**

```
  ('598', 'בית קמה', 'BET QAMA'),
```

**L209**

```
  ('365', 'בית קשת', 'BET QESHET'),
```

**L210**

```
  ('848', 'בית רבן', 'BET RABBAN'),
```

**L211**

```
  ('1162', 'בית רימון', 'BET RIMMON'),
```

**L212**

```
  ('9200', 'בית שאן', 'BET SHE''AN'),
```

**L213**

```
  ('248', 'בית שערים', 'BET SHE''ARIM'),
```

**L214**

```
  ('2610', 'בית שמש', 'BET SHEMESH'),
```

**L215**

```
  ('747', 'בית שקמה', 'BET SHIQMA'),
```

**L216**

```
  ('301', 'בית עוזיאל', 'BET UZZI''EL'),
```

**L217**

```
  ('200', 'בית ינאי', 'BET YANNAY'),
```

**L218**

```
  ('3745', 'בית יתיר', 'BET YATTIR'),
```

**L219**

```
  ('288', 'בית יהושע', 'BET YEHOSHUA'),
```

**L220**

```
  ('326', 'בית יצחק-שער חפר', 'BET YIZHAQ-SH. HEFER'),
```

**L221**

```
  ('265', 'בית יוסף', 'BET YOSEF'),
```

**L222**

```
  ('710', 'בית זית', 'BET ZAYIT'),
```

**L223**

```
  ('353', 'בית זיד', 'BET ZEID'),
```

**L224**

```
  ('143', 'בית זרע', 'BET ZERA'),
```

**L225**

```
  ('212', 'בית צבי', 'BET ZEVI'),
```

**L226**

```
  ('3780', 'ביתר עילית', 'BETAR ILLIT'),
```

**L227**

```
  ('589', 'בצת', 'BEZET'),
```

**L228**

```
  ('483', 'בענה', 'BI NE'),
```

**L229**

```
  ('9800', 'בנימינה-גבעת עדה', 'BINYAMINA'),
```

**L230**

```
  ('998', 'ביר אל-מכסור', 'BIR EL-MAKSUR'),
```

**L231**

```
  ('1348', 'ביר הדאג''', 'BIR HADAGE'),
```

**L232**

```
  ('368', 'ביריה', 'BIRIYYA'),
```

**L233**

```
  ('252', 'ביתן אהרן', 'BITAN AHARON'),
```

**L234**

```
  ('762', 'בטחה', 'BITHA'),
```

**L235**

```
  ('3897', 'בתרון', 'BITRON'),
```

**L236**

```
  ('234', 'ביצרון', 'BIZZARON'),
```

**L237**

```
  ('1368', 'בני דקלים', 'BNE DKALIM'),
```

**L238**

```
  ('3757', 'ברוש הבקעה', 'BROSH HABIK''A'),
```

**L239**

```
  ('3744', 'ברוכין', 'BRUKHIN'),
```

**L240**

```
  ('482', 'בועיינה-נוג''ידאת', 'BU''EINE-NUJEIDAT'),
```

**L241**

```
  ('4001', 'בוקעאתא', 'BUQ''ATA'),
```

**L242**

```
  ('698', 'בורגתה', 'BURGETA'),
```

**L243**

```
  ('559', 'בוסתן הגליל', 'BUSTAN HAGALIL'),
```

**L244**

```
  ('489', 'דבוריה', 'DABBURYE'),
```

**L245**

```
  ('302', 'דפנה', 'DAFNA'),
```

**L246**

```
  ('475', 'דחי', 'DAHI'),
```

**L247**

```
  ('494', 'דאלית אל-כרמל', 'DALIYAT AL-KARMEL'),
```

**L248**

```
  ('300', 'דליה', 'DALIYYA'),
```

**L249**

```
  ('431', 'דלתון', 'DALTON'),
```

**L250**

```
  ('303', 'דן', 'DAN'),
```

**L251**

```
  ('407', 'דברת', 'DAVERAT'),
```

**L252**

```
  ('62', 'דגניה א''', 'DEGANYA ALEF'),
```

**L253**

```
  ('79', 'דגניה ב''', 'DEGANYA BET'),
```

**L254**

```
  ('490', 'דייר אל-אסד', 'DEIR AL-ASAD'),
```

**L255**

```
  ('492', 'דייר חנא', 'DEIR HANNA'),
```

**L256**

```
  ('493', 'דייר ראפאת', 'DEIR RAFAT'),
```

**L257**

```
  ('1317', 'דמיידה', 'DEMEIDE'),
```

**L258**

```
  ('1241', 'דקל', 'DEQEL'),
```

**L259**

```
  ('1349', 'דריג''את', 'DERIG''AT'),
```

**L260**

```
  ('146', 'דבורה', 'DEVORA'),
```

**L261**

```
  ('2200', 'דימונה', 'DIMONA'),
```

**L262**

```
  ('2063', 'דישון', 'DISHON'),
```

**L263**

```
  ('3747', 'דולב', 'DOLEV'),
```

**L264**

```
  ('738', 'דור', 'DOR'),
```

**L265**

```
  ('336', 'דורות', 'DOROT'),
```

**L266**

```
  ('1067', 'דובב', 'DOVEV'),
```

**L267**

```
  ('849', 'דביר', 'DVIR'),
```

**L268**

```
  ('3650', 'אפרת', 'EFRAT'),
```

**L269**

```
  ('530', 'עיילבון', 'EILABUN'),
```

**L270**

```
  ('546', 'עין אל-אסד', 'EIN AL-ASAD'),
```

**L271**

```
  ('1320', 'עין חוד', 'EIN HOD'),
```

**L272**

```
  ('532', 'עין מאהל', 'EIN MAHEL'),
```

**L273**

```
  ('521', 'עין נקובא', 'EIN NAQQUBA'),
```

**L274**

```
  ('4502', 'עין קנייא', 'EIN QINIYYE'),
```

**L275**

```
  ('514', 'עין ראפה', 'EIN RAFA'),
```

**L276**

```
  ('1309', 'אלעד', 'EL''AD'),
```

**L277**

```
  ('3618', 'אלעזר', 'EL''AZAR'),
```

**L278**

```
  ('4003', 'אל-רום', 'EL-ROM'),
```

**L279**

```
  ('2600', 'אילת', 'ELAT'),
```

**L280**

```
  ('3765', 'עלי', 'ELI'),
```

**L281**

```
  ('4002', 'אלי-עד', 'ELI-AD'),
```

**L282**

```
  ('1365', 'אליאב', 'ELIAV'),
```

**L283**

```
  ('1248', 'אליפז', 'ELIFAZ'),
```

**L284**

```
  ('730', 'אליפלט', 'ELIFELET'),
```

**L285**

```
  ('841', 'אלישמע', 'ELISHAMA'),
```

**L286**

```
  ('294', 'אילון', 'ELON'),
```

**L287**

```
  ('3579', 'אלון מורה', 'ELON MORE'),
```

**L288**

```
  ('1126', 'אילות', 'ELOT'),
```

**L289**

```
  ('3560', 'אלקנה', 'ELQANA'),
```

**L290**

```
  ('603', 'אלקוש', 'ELQOSH'),
```

**L291**

```
  ('41', 'אליכין', 'ELYAKHIN'),
```

**L292**

```
  ('682', 'אליקים', 'ELYAQIM'),
```

**L293**

```
  ('204', 'אלישיב', 'ELYASHIV'),
```

**L294**

```
  ('772', 'אמונים', 'EMUNIM'),
```

**L295**

```
  ('687', 'עין איילה', 'EN AYYALA'),
```

**L296**

```
  ('436', 'עין דור', 'EN DOR'),
```

**L297**

```
  ('2042', 'עין גדי', 'EN GEDI'),
```

**L298**

```
  ('273', 'עין גב', 'EN GEV'),
```

**L299**

```
  ('1240', 'עין הבשור', 'EN HABESOR'),
```

**L300**

```
  ('367', 'עין העמק', 'EN HAEMEQ'),
```

**L301**

```
  ('167', 'עין החורש', 'EN HAHORESH'),
```

**L302**

```
  ('289', 'עין המפרץ', 'EN HAMIFRAZ'),
```

**L303**

```
  ('383', 'עין הנציב', 'EN HANAZIV'),
```

**L304**

```
  ('89', 'עין חרוד (איחוד)', 'EN HAROD (IHUD)'),
```

**L305**

```
  ('82', 'עין חרוד (מאוחד)', 'EN HAROD(ME''UHAD)'),
```

**L306**

```
  ('676', 'עין השלושה', 'EN HASHELOSHA'),
```

**L307**

```
  ('270', 'עין השופט', 'EN HASHOFET'),
```

**L308**

```
  ('1053', 'עין חצבה', 'EN HAZEVA'),
```

**L309**

```
  ('74', 'עין הוד', 'EN HOD'),
```

**L310**

```
  ('223', 'עין עירון', 'EN IRON'),
```

**L311**

```
  ('1056', 'עין כרם-ביס חקלאי', 'EN KAREM-B.S.HAQLA''I'),
```

**L312**

```
  ('426', 'עין כרמל', 'EN KARMEL'),
```

**L313**

```
  ('880', 'עין שריד', 'EN SARID'),
```

**L314**

```
  ('139', 'עין שמר', 'EN SHEMER'),
```

**L315**

```
  ('1251', 'עין תמר', 'EN TAMAR'),
```

**L316**

```
  ('157', 'עין ורד', 'EN WERED'),
```

**L317**

```
  ('813', 'עין יעקב', 'EN YA''AQOV'),
```

**L318**

```
  ('806', 'עין יהב', 'EN YAHAV'),
```

**L319**

```
  ('4503', 'עין זיוון', 'EN ZIWAN'),
```

**L320**

```
  ('622', 'עין צורים', 'EN ZURIM'),
```

**L321**

```
  ('871', 'עינת', 'ENAT'),
```

**L322**

```
  ('3712', 'ענב', 'ENAV'),
```

**L323**

```
  ('714', 'ארז', 'EREZ'),
```

**L324**

```
  ('71', 'אשבול', 'ESHBOL'),
```

**L325**

```
  ('2021', 'אשל הנשיא', 'ESHEL HANASI'),
```

**L326**

```
  ('1188', 'אשחר', 'ESHHAR'),
```

**L327**

```
  ('3722', 'אשכולות', 'ESHKOLOT'),
```

**L328**

```
  ('740', 'אשתאול', 'ESHTA''OL'),
```

**L329**

```
  ('37', 'איתן', 'ETAN'),
```

**L330**

```
  ('886', 'איתנים', 'ETANIM'),
```

**L331**

```
  ('1298', 'אתגר', 'ETGAR'),
```

**L332**

```
  ('3880', 'עיבל', 'EVAL'),
```

**L333**

```
  ('1081', 'אבן מנחם', 'EVEN MENAHEM'),
```

**L334**

```
  ('783', 'אבן ספיר', 'EVEN SAPPIR'),
```

**L335**

```
  ('400', 'אבן שמואל', 'EVEN SHEMU''EL'),
```

**L336**

```
  ('182', 'אבן יהודה', 'EVEN YEHUDA'),
```

**L337**

```
  ('369', 'גלעד (אבן יצחק)', 'EVEN YIZHAQ(GAL''ED)'),
```

**L338**

```
  ('376', 'עברון', 'EVRON'),
```

**L339**

```
  ('716', 'אייל', 'EYAL'),
```

**L340**

```
  ('1149', 'עזר', 'EZER'),
```

**L341**

```
  ('328', 'עזוז', 'EZUZ'),
```

**L342**

```
  ('535', 'פסוטה', 'FASSUTA'),
```

**L343**

```
  ('537', 'פוריידיס', 'FUREIDIS'),
```

**L344**

```
  ('842', 'געש', 'GA''ASH'),
```

**L345**

```
  ('463', 'געתון', 'GA''TON'),
```

**L346**

```
  ('145', 'גדיש', 'GADISH'),
```

**L347**

```
  ('35', 'גדות', 'GADOT'),
```

**L348**

```
  ('393', 'גלאון', 'GAL''ON'),
```

**L349**

```
  ('1072', 'גן הדרום', 'GAN HADAROM'),
```

**L350**

```
  ('225', 'גן השומרון', 'GAN HASHOMERON'),
```

**L351**

```
  ('239', 'גן חיים', 'GAN HAYYIM'),
```

**L352**

```
  ('1274', 'גן נר', 'GAN NER'),
```

**L353**

```
  ('144', 'גן שלמה', 'GAN SHELOMO'),
```

**L354**

```
  ('72', 'גן שמואל', 'GAN SHEMU''EL'),
```

**L355**

```
  ('311', 'גן שורק', 'GAN SOREQ'),
```

**L356**

```
  ('166', 'גן יבנה', 'GAN YAVNE'),
```

**L357**

```
  ('734', 'גן יאשיה', 'GAN YOSHIYYA'),
```

**L358**

```
  ('218', 'גני עם', 'GANNE AM'),
```

**L359**

```
  ('1103', 'גני הדר', 'GANNE HADAR'),
```

**L360**

```
  ('3823', 'גני מודיעין', 'GANNE MODIIN'),
```

**L361**

```
  ('1371', 'גני טל', 'GANNE TAL'),
```

**L362**

```
  ('229', 'גני תקווה', 'GANNE TIQWA'),
```

**L363**

```
  ('862', 'גני יוחנן', 'GANNE YOHANAN'),
```

**L364**

```
  ('3758', 'גנים', 'GANNIM'),
```

**L365**

```
  ('836', 'גנות', 'GANNOT'),
```

**L366**

```
  ('549', 'גנות הדר', 'GANNOT HADAR'),
```

**L367**

```
  ('128', 'גת רימון', 'GAT RIMMON'),
```

**L368**

```
  ('340', 'גת (קיבוץ)', 'GAT(QIBBUZ)'),
```

**L369**

```
  ('457', 'גזית', 'GAZIT'),
```

**L370**

```
  ('706', 'גיאה', 'GE''A'),
```

**L371**

```
  ('853', 'גאליה', 'GE''ALYA'),
```

**L372**

```
  ('872', 'גאולי תימן', 'GE''ULE TEMAN'),
```

**L373**

```
  ('379', 'גאולים', 'GE''ULIM'),
```

**L374**

```
  ('2550', 'גדרה', 'GEDERA'),
```

**L375**

```
  ('39', 'גפן', 'GEFEN'),
```

**L376**

```
  ('346', 'גליל ים', 'GELIL YAM'),
```

**L377**

```
  ('1129', 'גרופית', 'GEROFIT'),
```

**L378**

```
  ('305', 'גשר', 'GESHER'),
```

**L379**

```
  ('574', 'גשר הזיו', 'GESHER HAZIW'),
```

**L380**

```
  ('4022', 'גשור', 'GESHUR'),
```

**L381**

```
  ('86', 'גבע', 'GEVA'),
```

**L382**

```
  ('683', 'גבע כרמל', 'GEVA KARMEL'),
```

**L383**

```
  ('3763', 'גבע בנימין', 'GEVA BINYAMIN'),
```

**L384**

```
  ('1344', 'גבעות בר', 'GEVA''OT BAR'),
```

**L385**

```
  ('342', 'גברעם', 'GEVAR''AM'),
```

**L386**

```
  ('133', 'גבת', 'GEVAT'),
```

**L387**

```
  ('424', 'גבים', 'GEVIM'),
```

**L388**

```
  ('352', 'גבולות', 'GEVULOT'),
```

**L389**

```
  ('370', 'גזר', 'GEZER'),
```

**L390**

```
  ('4501', 'ע''ג''ר', 'GHAJAR'),
```

**L391**

```
  ('196', 'גיבתון', 'GIBBETON'),
```

**L392**

```
  ('442', 'גדעונה', 'GID''ONA'),
```

**L393**

```
  ('736', 'גילת', 'GILAT'),
```

**L394**

```
  ('3606', 'גלגל', 'GILGAL'),
```

**L395**

```
  ('1204', 'גילון', 'GILON'),
```

**L396**

```
  ('745', 'גמזו', 'GIMZO'),
```

**L397**

```
  ('863', 'גינתון', 'GINNATON'),
```

**L398**

```
  ('92', 'גיניגר', 'GINNEGAR'),
```

**L399**

```
  ('262', 'גינוסר', 'GINNOSAR'),
```

**L400**

```
  ('1206', 'גיתה', 'GITTA'),
```

**L401**

```
  ('3613', 'גיתית', 'GITTIT'),
```

**L402**

```
  ('1293', 'גבעת אבני', 'GIV''AT AVNI'),
```

**L403**

```
  ('147', 'גבעת ברנר', 'GIV''AT BRENNER'),
```

**L404**

```
  ('1288', 'גבעת אלה', 'GIV''AT ELA'),
```

**L405**

```
  ('870', 'גבעת השלושה', 'GIV''AT HASHELOSHA'),
```

**L406**

```
  ('2018', 'גבעת חיים (איחוד)', 'GIV''AT HAYYIM (IHUD)'),
```

**L407**

```
  ('173', 'גבעת חיים (מאוחד)', 'GIV''AT HAYYIM(ME''UHA'),
```

**L408**

```
  ('207', 'גבעת חן', 'GIV''AT HEN'),
```

**L409**

```
  ('802', 'גבעת כח', 'GIV''AT KOAH'),
```

**L410**

```
  ('360', 'גבעת נילי', 'GIV''AT NILI'),
```

**L411**

```
  ('703', 'גבעת עוז', 'GIV''AT OZ'),
```

**L412**

```
  ('1077', 'גבעת שפירא', 'GIV''AT SHAPPIRA'),
```

**L413**

```
  ('566', 'גבעת שמש', 'GIV''AT SHEMESH'),
```

**L414**

```
  ('681', 'גבעת שמואל', 'GIV''AT SHEMU''EL'),
```

**L415**

```
  ('787', 'גבעת יערים', 'GIV''AT YE''ARIM'),
```

**L416**

```
  ('919', 'גבעת ישעיהו', 'GIV''AT YESHA''YAHU'),
```

**L417**

```
  ('4021', 'גבעת יואב', 'GIV''AT YO''AV'),
```

**L418**

```
  ('3730', 'גבעת זאב', 'GIV''AT ZE''EV'),
```

**L419**

```
  ('6300', 'גבעתיים', 'GIV''ATAYIM'),
```

**L420**

```
  ('793', 'גבעתי', 'GIV''ATI'),
```

**L421**

```
  ('2014', 'גבעולים', 'GIV''OLIM'),
```

**L422**

```
  ('3644', 'גבעון החדשה', 'GIV''ON HAHADASHA'),
```

**L423**

```
  ('1362', 'גבעות עדן', 'GIV''OT EDEN'),
```

**L424**

```
  ('3862', 'גבעות הרואה', 'GIV''OT HARO''E'),
```

**L425**

```
  ('1043', 'גיזו', 'GIZO'),
```

**L426**

```
  ('3893', 'גודר', 'GODER'),
```

**L427**

```
  ('852', 'גונן', 'GONEN'),
```

**L428**

```
  ('755', 'גורן', 'GOREN'),
```

**L429**

```
  ('1219', 'גורנות הגליל', 'GORNOT HAGALIL'),
```

**L430**

```
  ('3783', 'גבעות', 'GVA''OT'),
```

**L431**

```
  ('675', 'הבונים', 'HABONIM'),
```

**L432**

```
  ('4026', 'חד-נס', 'HAD-NES'),
```

**L433**

```
  ('191', 'הדר עם', 'HADAR AM'),
```

**L434**

```
  ('6500', 'חדרה', 'HADERA'),
```

**L435**

```
  ('618', 'חדיד', 'HADID'),
```

**L436**

```
  ('363', 'חפץ חיים', 'HAFEZ HAYYIM'),
```

**L437**

```
  ('3764', 'חגי', 'HAGGAI'),
```

**L438**

```
  ('717', 'חגור', 'HAGOR'),
```

**L439**

```
  ('356', 'הגושרים', 'HAGOSHERIM'),
```

**L440**

```
  ('434', 'החותרים', 'HAHOTERIM'),
```

**L441**

```
  ('4000', 'חיפה', 'HAIFA'),
```

**L442**

```
  ('1272', 'חלוץ', 'HALUZ'),
```

**L443**

```
  ('377', 'המעפיל', 'HAMA''PIL'),
```

**L444**

```
  ('343', 'חמדיה', 'HAMADYA'),
```

**L445**

```
  ('993', 'חמאם', 'HAMAM'),
```

**L446**

```
  ('3609', 'חמרה', 'HAMRA'),
```

**L447**

```
  ('280', 'חניתה', 'HANITA'),
```

**L448**

```
  ('1257', 'חנתון', 'HANNATON'),
```

**L449**

```
  ('807', 'חניאל', 'HANNI''EL'),
```

**L450**

```
  ('423', 'העוגן', 'HAOGEN'),
```

**L451**

```
  ('702', 'האון', 'HAON'),
```

**L452**

```
  ('3769', 'הר אדר', 'HAR ADAR'),
```

**L453**

```
  ('1261', 'הר עמשא', 'HAR AMASA'),
```

**L454**

```
  ('3603', 'הר גילה', 'HAR GILLO'),
```

**L455**

```
  ('464', 'הראל', 'HAR''EL'),
```

**L456**

```
  ('1203', 'הררית', 'HARARIT'),
```

**L457**

```
  ('1209', 'חרשים', 'HARASHIM'),
```

**L458**

```
  ('1249', 'הרדוף', 'HARDUF'),
```

**L459**

```
  ('3870', 'חרשה', 'HARESHA'),
```

**L460**

```
  ('1247', 'חריש', 'HARISH'),
```

**L461**

```
  ('1024', 'חרוצים', 'HARUZIM'),
```

**L462**

```
  ('3770', 'חשמונאים', 'HASHMONA''IM'),
```

**L463**

```
  ('677', 'הסוללים', 'HASOLELIM'),
```

**L464**

```
  ('4005', 'חספין', 'HASPIN'),
```

**L465**

```
  ('235', 'חבצלת השרון', 'HAVAZZELET HASHARON'),
```

**L466**

```
  ('1169', 'הוואשלה (שבט)', 'HAWASHLA'),
```

**L467**

```
  ('684', 'היוגב', 'HAYOGEV'),
```

**L468**

```
  ('700', 'חצב', 'HAZAV'),
```

**L469**

```
  ('397', 'חצרים', 'HAZERIM'),
```

**L470**

```
  ('13', 'חצבה', 'HAZEVA'),
```

**L471**

```
  ('1047', 'חזון', 'HAZON'),
```

**L472**

```
  ('2034', 'חצור הגלילית', 'HAZOR HAGELILIT'),
```

**L473**

```
  ('406', 'חצור-אשדוד', 'HAZOR-ASHDOD'),
```

**L474**

```
  ('307', 'הזורעים', 'HAZORE''IM'),
```

**L475**

```
  ('250', 'הזורע', 'HAZOREA'),
```

**L476**

```
  ('90', 'חפצי-בה', 'HEFZI-BAH'),
```

**L477**

```
  ('820', 'חלץ', 'HELEZ'),
```

**L478**

```
  ('801', 'חמד', 'HEMED'),
```

**L479**

```
  ('422', 'חרב לאת', 'HEREV LE''ET'),
```

**L480**

```
  ('3717', 'חרמש', 'HERMESH'),
```

**L481**

```
  ('162', 'חירות', 'HERUT'),
```

**L482**

```
  ('6400', 'הרצליה', 'HERZELIYYA'),
```

**L483**

```
  ('1110', 'חבר', 'HEVER'),
```

**L484**

```
  ('219', 'חיבת ציון', 'HIBBAT ZIYYON'),
```

**L485**

```
  ('1208', 'הילה', 'HILLA'),
```

**L486**

```
  ('3643', 'חיננית', 'HINNANIT'),
```

**L487**

```
  ('9700', 'הוד השרון', 'HOD HASHARON'),
```

**L488**

```
  ('1322', 'הודיות', 'HODAYOT'),
```

**L489**

```
  ('726', 'הודיה', 'HODIYYA'),
```

**L490**

```
  ('115', 'חופית', 'HOFIT'),
```

**L491**

```
  ('205', 'חגלה', 'HOGLA'),
```

**L492**

```
  ('1239', 'חולית', 'HOLIT'),
```

**L493**

```
  ('6600', 'חולון', 'HOLON'),
```

**L494**

```
  ('3642', 'חומש', 'HOMESH'),
```

**L495**

```
  ('355', 'חורשים', 'HORESHIM'),
```

**L496**

```
  ('662', 'חוסן', 'HOSEN'),
```

**L497**

```
  ('1186', 'הושעיה', 'HOSHA''AYA'),
```

**L498**

```
  ('948', 'חוג''ייראת (ד''הרה)', 'HUJEIRAT (DAHRA)'),
```

**L499**

```
  ('253', 'חולתה', 'HULATA'),
```

**L500**

```
  ('160', 'חולדה', 'HULDA'),
```

**L501**

```
  ('374', 'חוקוק', 'HUQOQ'),
```

**L502**

```
  ('1303', 'חורה', 'HURA'),
```

**L503**

```
  ('496', 'חורפיש', 'HURFEISH'),
```

**L504**

```
  ('1332', 'חוסנייה', 'HUSSNIYYA'),
```

**L505**

```
  ('956', 'הוזייל (שבט)', 'HUZAYYEL'),
```

**L506**

```
  ('529', 'אעבלין', 'I''BILLIN'),
```

**L507**

```
  ('3891', 'איבי הנחל', 'IBBE HANAHAL'),
```

**L508**

```
  ('338', 'איבים', 'IBBIM'),
```

**L509**

```
  ('652', 'אבטין', 'IBTIN'),
```

**L510**

```
  ('1175', 'עידן', 'IDDAN'),
```

**L511**

```
  ('478', 'אכסאל', 'IKSAL'),
```

**L512**

```
  ('49', 'אילניה', 'ILANIYYA'),
```

**L513**

```
  ('511', 'עילוט', 'ILUT'),
```

**L514**

```
  ('3660', 'עמנואל', 'IMMANU''EL'),
```

**L515**

```
  ('1187', 'עיר אובות', 'IR OVOT'),
```

**L516**

```
  ('1336', 'אירוס', 'IRUS'),
```

**L517**

```
  ('534', 'עספיא', 'ISIFYA'),
```

**L518**

```
  ('3762', 'איתמר', 'ITAMAR'),
```

**L519**

```
  ('628', 'ג''ת', 'JAAT'),
```

**L520**

```
  ('627', 'ג''לג''וליה', 'JALJULYE'),
```

**L521**

```
  ('3000', 'ירושלים', 'JERUSALEM'),
```

**L522**

```
  ('487', 'ג''ש (גוש חלב)', 'JISH(GUSH HALAV)'),
```

**L523**

```
  ('541', 'ג''סר א-זרקא', 'JISR AZ-ZARQA'),
```

**L524**

```
  ('1292', 'ג''דיידה-מכר', 'JUDEIDE-MAKER'),
```

**L525**

```
  ('485', 'ג''ולס', 'JULIS'),
```

**L526**

```
  ('976', 'ג''נאביב (שבט)', 'JUNNABIB'),
```

**L527**

```
  ('978', 'כעביה-טבאש-חג''אג''רה', 'KA''ABIYYE-TABBASH-HA'),
```

**L528**

```
  ('576', 'כברי', 'KABRI'),
```

**L529**

```
  ('504', 'כאבול', 'KABUL'),
```

**L530**

```
  ('3729', 'כדים', 'KADDIM'),
```

**L531**

```
  ('1338', 'כדיתה', 'KADDITA'),
```

**L532**

```
  ('371', 'כדורי', 'KADOORIE'),
```

**L533**

```
  ('633', 'כפר ברא', 'KAFAR BARA'),
```

**L534**

```
  ('508', 'כפר כמא', 'KAFAR KAMA'),
```

**L535**

```
  ('509', 'כפר כנא', 'KAFAR KANNA'),
```

**L536**

```
  ('510', 'כפר מנדא', 'KAFAR MANDA'),
```

**L537**

```
  ('512', 'כפר מצר', 'KAFAR MISR'),
```

**L538**

```
  ('654', 'כפר קרע', 'KAFAR QARA'),
```

**L539**

```
  ('634', 'כפר קאסם', 'KAFAR QASEM'),
```

**L540**

```
  ('507', 'כפר יאסיף', 'KAFAR YASIF'),
```

**L541**

```
  ('1210', 'כחל', 'KAHAL'),
```

**L542**

```
  ('1229', 'כלנית', 'KALLANIT'),
```

**L543**

```
  ('1201', 'כמון', 'KAMMON'),
```

**L544**

```
  ('4028', 'כנף', 'KANAF'),
```

**L545**

```
  ('3902', 'כנפי שחר', 'KANFE SHAHAR'),
```

**L546**

```
  ('2006', 'כנות', 'KANNOT'),
```

**L547**

```
  ('505', 'כאוכב אבו אל-היג''א', 'KAOKAB ABU AL-HIJA'),
```

**L548**

```
  ('1285', 'כרכום', 'KARKOM'),
```

**L549**

```
  ('1374', 'כרמי קטיף', 'KARME QATIF'),
```

**L550**

```
  ('1264', 'כרמי יוסף', 'KARME YOSEF'),
```

**L551**

```
  ('3766', 'כרמי צור', 'KARME ZUR'),
```

**L552**

```
  ('3656', 'כרמל', 'KARMEL'),
```

**L553**

```
  ('1139', 'כרמיאל', 'KARMI''EL'),
```

**L554**

```
  ('768', 'כרמיה', 'KARMIYYA'),
```

**L555**

```
  ('3895', 'קדם ערבה', 'KEDEM ARAVA'),
```

**L556**

```
  ('3638', 'כפר אדומים', 'KEFAR ADUMMIM'),
```

**L557**

```
  ('690', 'כפר אחים', 'KEFAR AHIM'),
```

**L558**

```
  ('857', 'כפר אביב', 'KEFAR AVIV'),
```

**L559**

```
  ('875', 'כפר עבודה', 'KEFAR AVODA'),
```

**L560**

```
  ('845', 'כפר עזה', 'KEFAR AZZA'),
```

**L561**

```
  ('132', 'כפר ברוך', 'KEFAR BARUKH'),
```

**L562**

```
  ('220', 'כפר ביאליק', 'KEFAR BIALIK'),
```

**L563**

```
  ('177', 'כפר בילו', 'KEFAR BILU'),
```

**L564**

```
  ('2010', 'כפר בן נון', 'KEFAR BIN NUN'),
```

**L565**

```
  ('357', 'כפר בלום', 'KEFAR BLUM'),
```

**L566**

```
  ('707', 'כפר דניאל', 'KEFAR DANIYYEL'),
```

**L567**

```
  ('3488', 'כפר עציון', 'KEFAR EZYON'),
```

**L568**

```
  ('427', 'כפר גלים', 'KEFAR GALLIM'),
```

**L569**

```
  ('106', 'כפר גדעון', 'KEFAR GID''ON'),
```

**L570**

```
  ('76', 'כפר גלעדי', 'KEFAR GIL''ADI'),
```

**L571**

```
  ('310', 'כפר גליקסון', 'KEFAR GLIKSON'),
```

**L572**

```
  ('696', 'כפר חבד', 'KEFAR HABAD'),
```

**L573**

```
  ('192', 'כפר החורש', 'KEFAR HAHORESH'),
```

**L574**

```
  ('254', 'כפר המכבי', 'KEFAR HAMAKKABI'),
```

**L575**

```
  ('582', 'כפר הנגיד', 'KEFAR HANAGID'),
```

**L576**

```
  ('1297', 'כפר חנניה', 'KEFAR HANANYA'),
```

**L577**

```
  ('443', 'כפר הנשיא', 'KEFAR HANASI'),
```

**L578**

```
  ('890', 'כפר הנוער הדתי', 'KEFAR HANO''AR HADATI'),
```

**L579**

```
  ('3796', 'כפר האורנים', 'KEFAR HAORANIM'),
```

**L580**

```
  ('888', 'כפר הריף', 'KEFAR HARIF'),
```

**L581**

```
  ('217', 'כפר הראה', 'KEFAR HARO''E'),
```

**L582**

```
  ('4004', 'כפר חרוב', 'KEFAR HARUV'),
```

**L583**

```
  ('112', 'כפר חסידים א''', 'KEFAR HASIDIM ALEF'),
```

**L584**

```
  ('889', 'כפר חסידים ב''', 'KEFAR HASIDIM BET'),
```

**L585**

```
  ('193', 'כפר חיים', 'KEFAR HAYYIM'),
```

**L586**

```
  ('187', 'כפר הס', 'KEFAR HESS'),
```

**L587**

```
  ('255', 'כפר חיטים', 'KEFAR HITTIM'),
```

**L588**

```
  ('609', 'כפר חושן', 'KEFAR HOSHEN'),
```

**L589**

```
  ('388', 'כפר קיש', 'KEFAR KISH'),
```

**L590**

```
  ('98', 'כפר מלל', 'KEFAR MALAL'),
```

**L591**

```
  ('297', 'כפר מסריק', 'KEFAR MASARYK'),
```

**L592**

```
  ('1095', 'כפר מימון', 'KEFAR MAYMON'),
```

**L593**

```
  ('274', 'כפר מנחם', 'KEFAR MENAHEM'),
```

**L594**

```
  ('387', 'כפר מונש', 'KEFAR MONASH'),
```

**L595**

```
  ('764', 'כפר מרדכי', 'KEFAR MORDEKHAY'),
```

**L596**

```
  ('316', 'כפר נטר', 'KEFAR NETTER'),
```

**L597**

```
  ('189', 'כפר פינס', 'KEFAR PINES'),
```

**L598**

```
  ('579', 'כפר ראש הנקרה', 'KEFAR ROSH HANIQRA'),
```

**L599**

```
  ('1130', 'כפר רוזנואלד (זרעית)', 'KEFAR ROZENWALD(ZAR.'),
```

**L600**

```
  ('295', 'כפר רופין', 'KEFAR RUPPIN'),
```

**L601**

```
  ('1166', 'כפר רות', 'KEFAR RUT'),
```

**L602**

```
  ('6900', 'כפר סבא', 'KEFAR SAVA'),
```

**L603**

```
  ('605', 'כפר שמאי', 'KEFAR SHAMMAY'),
```

**L604**

```
  ('267', 'כפר שמריהו', 'KEFAR SHEMARYAHU'),
```

**L605**

```
  ('743', 'כפר שמואל', 'KEFAR SHEMU''EL'),
```

**L606**

```
  ('107', 'כפר סילבר', 'KEFAR SILVER'),
```

**L607**

```
  ('249', 'כפר סירקין', 'KEFAR SIRKIN'),
```

**L608**

```
  ('345', 'כפר סאלד', 'KEFAR SZOLD'),
```

**L609**

```
  ('3572', 'כפר תפוח', 'KEFAR TAPPUAH'),
```

**L610**

```
  ('47', 'כפר תבור', 'KEFAR TAVOR'),
```

**L611**

```
  ('673', 'כפר טרומן', 'KEFAR TRUMAN'),
```

**L612**

```
  ('364', 'כפר אוריה', 'KEFAR URIYYA'),
```

**L613**

```
  ('190', 'כפר ויתקין', 'KEFAR VITKIN'),
```

**L614**

```
  ('320', 'כפר ורבורג', 'KEFAR WARBURG'),
```

**L615**

```
  ('1263', 'כפר ורדים', 'KEFAR WERADIM'),
```

**L616**

```
  ('170', 'כפר יעבץ', 'KEFAR YA''BEZ'),
```

**L617**

```
  ('85', 'כפר יחזקאל', 'KEFAR YEHEZQEL'),
```

**L618**

```
  ('140', 'כפר יהושע', 'KEFAR YEHOSHUA'),
```

**L619**

```
  ('168', 'כפר יונה', 'KEFAR YONA'),
```

**L620**

```
  ('786', 'כפר זיתים', 'KEFAR ZETIM'),
```

**L621**

```
  ('1325', 'כפר זוהרים', 'KEFAR ZOHARIM'),
```

**L622**

```
  ('1183', 'כליל', 'KELIL'),
```

**L623**

```
  ('1291', 'כמהין', 'KEMEHIN'),
```

**L624**

```
  ('1198', 'כרמים', 'KERAMIM'),
```

**L625**

```
  ('88', 'כרם בן שמן', 'KEREM BEN SHEMEN'),
```

**L626**

```
  ('664', 'כרם בן זמרה', 'KEREM BEN ZIMRA'),
```

**L627**

```
  ('1094', 'כרם ביבנה (ישיבה)', 'KEREM BEYAVNE'),
```

**L628**

```
  ('580', 'כרם מהרל', 'KEREM MAHARAL'),
```

**L629**

```
  ('3889', 'כרם רעים', 'KEREM RE''IM'),
```

**L630**

```
  ('1085', 'כרם שלום', 'KEREM SHALOM'),
```

**L631**

```
  ('859', 'כסלון', 'KESALON'),
```

**L632**

```
  ('986', 'ח''ואלד (שבט)', 'KHAWALED'),
```

**L633**

```
  ('1321', 'ח''ואלד', 'KHAWALED'),
```

**L634**

```
  ('63', 'כנרת (מושבה)', 'KINNERET(MOSHAVA)'),
```

**L635**

```
  ('57', 'כנרת (קבוצה)', 'KINNERET(QEVUZA)'),
```

**L636**

```
  ('1153', 'כישור', 'KISHOR'),
```

**L637**

```
  ('1296', 'כסרא-סמיע', 'KISRA-SUMEI'),
```

**L638**

```
  ('840', 'כיסופים', 'KISSUFIM'),
```

**L639**

```
  ('1224', 'כוכב יאיר-צור יגאל', 'KOCHAV YAIR TSUR YI'),
```

**L640**

```
  ('1367', 'כחלה', 'KOCHLEA'),
```

**L641**

```
  ('3564', 'כוכב השחר', 'KOKHAV HASHAHAR'),
```

**L642**

```
  ('824', 'כוכב מיכאל', 'KOKHAV MIKHA''EL'),
```

**L643**

```
  ('3779', 'כוכב יעקב', 'KOKHAV YA''AQOV'),
```

**L644**

```
  ('1252', 'כורזים', 'KORAZIM'),
```

**L645**

```
  ('1059', 'כסיפה', 'KUSEIFE'),
```

**L646**

```
  ('2023', 'להב', 'LAHAV'),
```

**L647**

```
  ('380', 'להבות הבשן', 'LAHAVOT HABASHAN'),
```

**L648**

```
  ('715', 'להבות חביבה', 'LAHAVOT HAVIVA'),
```

**L649**

```
  ('24', 'לכיש', 'LAKHISH'),
```

**L650**

```
  ('1310', 'לפיד', 'LAPPID'),
```

**L651**

```
  ('1173', 'לפידות', 'LAPPIDOT'),
```

**L652**

```
  ('1060', 'לקיה', 'LAQYE'),
```

**L653**

```
  ('585', 'לביא', 'LAVI'),
```

**L654**

```
  ('1207', 'לבון', 'LAVON'),
```

**L655**

```
  ('1271', 'להבים', 'LEHAVIM'),
```

**L656**

```
  ('3901', 'לחי', 'LEHI'),
```

**L657**

```
  ('3892', 'לשם', 'LESHEM'),
```

**L658**

```
  ('1114', 'שריגים (לי-און)', 'LI-ON'),
```

**L659**

```
  ('674', 'לימן', 'LIMAN'),
```

**L660**

```
  ('1230', 'לבנים', 'LIVNIM'),
```

**L661**

```
  ('7000', 'לוד', 'LOD'),
```

**L662**

```
  ('595', 'לוחמי הגיטאות', 'LOHAME HAGETA''OT'),
```

**L663**

```
  ('1255', 'לוטן', 'LOTAN'),
```

**L664**

```
  ('1171', 'לוטם', 'LOTEM'),
```

**L665**

```
  ('52', 'לוזית', 'LUZIT'),
```

**L666**

```
  ('678', 'מעגן', 'MA''AGAN'),
```

**L667**

```
  ('694', 'מעגן מיכאל', 'MA''AGAN MIKHA''EL'),
```

**L668**

```
  ('3616', 'מעלה אדומים', 'MA''ALE ADUMMIM'),
```

**L669**

```
  ('3653', 'מעלה עמוס', 'MA''ALE AMOS'),
```

**L670**

```
  ('3608', 'מעלה אפרים', 'MA''ALE EFRAYIM'),
```

**L671**

```
  ('4008', 'מעלה גמלא', 'MA''ALE GAMLA'),
```

**L672**

```
  ('1127', 'מעלה גלבוע', 'MA''ALE GILBOA'),
```

**L673**

```
  ('286', 'מעלה החמישה', 'MA''ALE HAHAMISHA'),
```

**L674**

```
  ('1327', 'מעלה עירון', 'MA''ALE IRON'),
```

**L675**

```
  ('3752', 'מעלה לבונה', 'MA''ALE LEVONA'),
```

**L676**

```
  ('3651', 'מעלה מכמש', 'MA''ALE MIKHMAS'),
```

**L677**

```
  ('1063', 'מעלות-תרשיחא', 'MA''ALOT-TARSHIHA'),
```

**L678**

```
  ('344', 'מענית', 'MA''ANIT'),
```

**L679**

```
  ('230', 'מעש', 'MA''AS'),
```

**L680**

```
  ('197', 'מעברות', 'MA''BAROT'),
```

**L681**

```
  ('1082', 'מעגלים', 'MA''GALIM'),
```

**L682**

```
  ('3657', 'מעון', 'MA''ON'),
```

**L683**

```
  ('2055', 'מאור', 'MA''OR'),
```

**L684**

```
  ('3879', 'מעוז', 'MA''OZ'),
```

**L685**

```
  ('272', 'מעוז חיים', 'MA''OZ HAYYIM'),
```

**L686**

```
  ('416', 'מעין ברוך', 'MA''YAN BARUKH'),
```

**L687**

```
  ('290', 'מעין צבי', 'MA''YAN ZEVI'),
```

**L688**

```
  ('1080', 'מבועים', 'MABBU''IM'),
```

**L689**

```
  ('695', 'מגן', 'MAGEN'),
```

**L690**

```
  ('1155', 'מגן שאול', 'MAGEN SHA''UL'),
```

**L691**

```
  ('375', 'מגל', 'MAGGAL'),
```

**L692**

```
  ('722', 'מגשימים', 'MAGSHIMIM'),
```

**L693**

```
  ('308', 'מחניים', 'MAHANAYIM'),
```

**L694**

```
  ('1262', 'צוקים', 'MAHANE BILDAD'),
```

**L695**

```
  ('1411', 'מחנה הילה', 'MAHANE HILLA'),
```

**L696**

```
  ('1414', 'מחנה מרים', 'MAHANE MIRYAM'),
```

**L697**

```
  ('1418', 'מחנה טלי', 'MAHANE TALI'),
```

**L698**

```
  ('1412', 'מחנה תל נוף', 'MAHANE TEL NOF'),
```

**L699**

```
  ('1415', 'מחנה יפה', 'MAHANE YAFA'),
```

**L700**

```
  ('1196', 'מחנה יתיר', 'MAHANE YATTIR'),
```

**L701**

```
  ('1413', 'מחנה יהודית', 'MAHANE YEHUDIT'),
```

**L702**

```
  ('1416', 'מחנה יוכבד', 'MAHANE YOKHVED'),
```

**L703**

```
  ('776', 'מחסיה', 'MAHSEYA'),
```

**L704**

```
  ('516', 'מג''ד אל-כרום', 'MAJD AL-KURUM'),
```

**L705**

```
  ('4201', 'מג''דל שמס', 'MAJDAL SHAMS'),
```

**L706**

```
  ('1343', 'מכחול', 'MAKCHUL'),
```

**L707**

```
  ('596', 'מלכיה', 'MALKIYYA'),
```

**L708**

```
  ('1174', 'מנוף', 'MANOF'),
```

**L709**

```
  ('1205', 'מנות', 'MANOT'),
```

**L710**

```
  ('994', 'מנשית זבדה', 'MANSHIYYET ZABDA'),
```

**L711**

```
  ('843', 'מרגליות', 'MARGALIYYOT'),
```

**L712**

```
  ('4203', 'מסעדה', 'MAS''ADE'),
```

**L713**

```
  ('939', 'מסעודין אל-עזאזמה', 'MAS''UDIN AL-''AZAZME'),
```

**L714**

```
  ('421', 'משאבי שדה', 'MASH''ABBE SADE'),
```

**L715**

```
  ('791', 'משען', 'MASH''EN'),
```

**L716**

```
  ('3785', 'משכיות', 'MASKIYYOT'),
```

**L717**

```
  ('748', 'מסלול', 'MASLUL'),
```

**L718**

```
  ('1258', 'מסד', 'MASSAD'),
```

**L719**

```
  ('263', 'מסדה', 'MASSADA'),
```

**L720**

```
  ('3605', 'משואה', 'MASSU''A'),
```

**L721**

```
  ('620', 'משואות יצחק', 'MASSUOT YIZHAQ'),
```

**L722**

```
  ('822', 'מטע', 'MATTA'),
```

**L723**

```
  ('1315', 'מתן', 'MATTAN'),
```

**L724**

```
  ('1184', 'מתת', 'MATTAT'),
```

**L725**

```
  ('3648', 'מתתיהו', 'MATTITYAHU'),
```

**L726**

```
  ('573', 'מבקיעים', 'MAVQI''IM'),
```

**L727**

```
  ('28', 'מזכרת בתיה', 'MAZKERET BATYA'),
```

**L728**

```
  ('757', 'מצליח', 'MAZLIAH'),
```

**L729**

```
  ('606', 'מזור', 'MAZOR'),
```

**L730**

```
  ('517', 'מזרעה', 'MAZRA''A'),
```

**L731**

```
  ('325', 'מצובה', 'MAZZUVA'),
```

**L732**

```
  ('1128', 'מי עמי', 'ME AMMI'),
```

**L733**

```
  ('102', 'מאיר שפיה', 'ME''IR SHEFEYA'),
```

**L734**

```
  ('570', 'מעונה', 'ME''ONA'),
```

**L735**

```
  ('668', 'מפלסים', 'MEFALLESIM'),
```

**L736**

```
  ('689', 'מגדים', 'MEGADIM'),
```

**L737**

```
  ('586', 'מגידו', 'MEGIDDO'),
```

**L738**

```
  ('3599', 'מחולה', 'MEHOLA'),
```

**L739**

```
  ('649', 'מייסר', 'MEISER'),
```

**L740**

```
  ('3614', 'מכורה', 'MEKHORA'),
```

**L741**

```
  ('164', 'מלאה', 'MELE''A'),
```

**L742**

```
  ('2044', 'מלילות', 'MELILOT'),
```

**L743**

```
  ('48', 'מנחמיה', 'MENAHEMYA'),
```

**L744**

```
  ('347', 'מנרה', 'MENNARA'),
```

**L745**

```
  ('2030', 'מנוחה', 'MENUHA'),
```

**L746**

```
  ('1282', 'מירב', 'MERAV'),
```

**L747**

```
  ('1340', 'מרחב עם', 'MERHAV AM'),
```

**L748**

```
  ('97', 'מרחביה (מושב)', 'MERHAVYA(MOSHAV)'),
```

**L749**

```
  ('66', 'מרחביה (קיבוץ)', 'MERHAVYA(QIBBUZ)'),
```

**L750**

```
  ('1098', 'מרכז שפירא', 'MERKAZ SHAPPIRA'),
```

**L751**

```
  ('4101', 'מרום גולן', 'MEROM GOLAN'),
```

**L752**

```
  ('607', 'מירון', 'MERON'),
```

**L753**

```
  ('731', 'מישר', 'MESHAR'),
```

**L754**

```
  ('520', 'משהד', 'MESHHED'),
```

**L755**

```
  ('742', 'מסילת ציון', 'MESILLAT ZIYYON'),
```

**L756**

```
  ('298', 'מסילות', 'MESILLOT'),
```

**L757**

```
  ('1154', 'מיטל', 'METAL'),
```

**L758**

```
  ('1268', 'מיתר', 'METAR'),
```

**L759**

```
  ('2054', 'מיטב', 'METAV'),
```

**L760**

```
  ('3903', 'מצוקי ארץ', 'METSUKE ERETS'),
```

**L761**

```
  ('43', 'מטולה', 'METULA'),
```

**L762**

```
  ('1015', 'מבשרת ציון', 'MEVASSERET ZIYYON'),
```

**L763**

```
  ('771', 'מבוא ביתר', 'MEVO BETAR'),
```

**L764**

```
  ('3569', 'מבוא דותן', 'MEVO DOTAN'),
```

**L765**

```
  ('4204', 'מבוא חמה', 'MEVO HAMMA'),
```

**L766**

```
  ('3709', 'מבוא חורון', 'MEVO HORON'),
```

**L767**

```
  ('1141', 'מבוא מודיעים', 'MEVO MODI''IM'),
```

**L768**

```
  ('1318', 'מבואות ים', 'MEVO''OT YAM'),
```

**L769**

```
  ('3825', 'מבואות יריחו', 'MEVO''OT YERIHO'),
```

**L770**

```
  ('4019', 'מיצר', 'MEZAR'),
```

**L771**

```
  ('648', 'מצר', 'MEZER'),
```

**L772**

```
  ('518', 'מעיליא', 'MI''ELYA'),
```

**L773**

```
  ('2029', 'מדרך עוז', 'MIDRAKH OZ'),
```

**L774**

```
  ('1140', 'מדרשת בן גוריון', 'MIDRESHET BEN GURION'),
```

**L775**

```
  ('897', 'מדרשת רופין', 'MIDRESHET RUPPIN'),
```

**L776**

```
  ('65', 'מגדל', 'MIGDAL'),
```

**L777**

```
  ('874', 'מגדל העמק', 'MIGDAL HAEMEQ'),
```

**L778**

```
  ('3561', 'מגדל עוז', 'MIGDAL OZ'),
```

**L779**

```
  ('3751', 'מגדלים', 'MIGDALIM'),
```

**L780**

```
  ('3871', 'מגרון', 'MIGRON'),
```

**L781**

```
  ('1202', 'מכמנים', 'MIKHMANNIM'),
```

**L782**

```
  ('382', 'מכמורת', 'MIKHMORET'),
```

**L783**

```
  ('22', 'מקווה ישראל', 'MIQWE YISRA''EL'),
```

**L784**

```
  ('378', 'משגב עם', 'MISGAV AM'),
```

**L785**

```
  ('765', 'משגב דב', 'MISGAV DOV'),
```

**L786**

```
  ('670', 'משמר איילון', 'MISHMAR AYYALON'),
```

**L787**

```
  ('563', 'משמר דוד', 'MISHMAR DAWID'),
```

**L788**

```
  ('130', 'משמר העמק', 'MISHMAR HAEMEQ'),
```

**L789**

```
  ('395', 'משמר הנגב', 'MISHMAR HANEGEV'),
```

**L790**

```
  ('194', 'משמר השרון', 'MISHMAR HASHARON'),
```

**L791**

```
  ('729', 'משמר השבעה', 'MISHMAR HASHIV''A'),
```

**L792**

```
  ('732', 'משמר הירדן', 'MISHMAR HAYARDEN'),
```

**L793**

```
  ('3865', 'משמר יהודה', 'MISHMAR YEHUDA'),
```

**L794**

```
  ('213', 'משמרות', 'MISHMAROT'),
```

**L795**

```
  ('425', 'משמרת', 'MISHMERET'),
```

**L796**

```
  ('1370', 'מצפה אילן', 'MITSPE ILAN'),
```

**L797**

```
  ('3899', 'מצפה זיף', 'MITSPE ZIF'),
```

**L798**

```
  ('829', 'מבטחים', 'MIVTAHIM'),
```

**L799**

```
  ('58', 'מצפה', 'MIZPA'),
```

**L800**

```
  ('1222', 'מצפה אביב', 'MIZPE AVIV'),
```

**L801**

```
  ('1190', 'מצפה נטופה', 'MIZPE NETOFA'),
```

**L802**

```
  ('99', 'מצפה רמון', 'MIZPE RAMON'),
```

**L803**

```
  ('3610', 'מצפה שלם', 'MIZPE SHALEM'),
```

**L804**

```
  ('3576', 'מצפה יריחו', 'MIZPE YERIHO'),
```

**L805**

```
  ('104', 'מזרע', 'MIZRA'),
```

**L806**

```
  ('3797', 'מודיעין עילית', 'MODI''IN ILLIT'),
```

**L807**

```
  ('1200', 'מודיעין-מכבים-רעות', 'MODI''IN-MAKKABBIM-RE'),
```

**L808**

```
  ('269', 'מולדת', 'MOLEDET'),
```

**L809**

```
  ('1163', 'מורן', 'MORAN'),
```

**L810**

```
  ('1178', 'מורשת', 'MORESHET'),
```

**L811**

```
  ('208', 'מוצא עילית', 'MOZA ILLIT'),
```

**L812**

```
  ('481', 'מגאר', 'MUGHAR'),
```

**L813**

```
  ('635', 'מוקייבלה', 'MUQEIBLE'),
```

**L814**

```
  ('3787', 'נעלה', 'NA''ALE'),
```

**L815**

```
  ('158', 'נען', 'NA''AN'),
```

**L816**

```
  ('3620', 'נערן', 'NA''ARAN'),
```

**L817**

```
  ('524', 'נאעורה', 'NA''URA'),
```

**L818**

```
  ('3713', 'נעמה', 'NAAMA'),
```

**L819**

```
  ('1276', 'אשבל', 'NAHAL ESHBAL'),
```

**L820**

```
  ('3646', 'חמדת', 'NAHAL HEMDAT'),
```

**L821**

```
  ('844', 'נחל עוז', 'NAHAL OZ'),
```

**L822**

```
  ('1267', 'שיטים', 'NAHAL SHITTIM'),
```

**L823**

```
  ('2045', 'נחלה', 'NAHALA'),
```

**L824**

```
  ('80', 'נהלל', 'NAHALAL'),
```

**L825**

```
  ('3767', 'נחליאל', 'NAHALI''EL'),
```

**L826**

```
  ('809', 'נחם', 'NAHAM'),
```

**L827**

```
  ('9100', 'נהריה', 'NAHARIYYA'),
```

**L828**

```
  ('522', 'נחף', 'NAHEF'),
```

**L829**

```
  ('433', 'נחשולים', 'NAHSHOLIM'),
```

**L830**

```
  ('777', 'נחשון', 'NAHSHON'),
```

**L831**

```
  ('705', 'נחשונים', 'NAHSHONIM'),
```

**L832**

```
  ('1041', 'נצאצרה (שבט)', 'NASASRA'),
```

**L833**

```
  ('1254', 'נטף', 'NATAF'),
```

**L834**

```
  ('4014', 'נטור', 'NATUR'),
```

**L835**

```
  ('1366', 'נווה', 'NAVE'),
```

**L836**

```
  ('7300', 'נצרת', 'NAZARETH'),
```

**L837**

```
  ('4551', 'נאות גולן', 'NE''OT GOLAN'),
```

**L838**

```
  ('1124', 'נאות הכיכר', 'NE''OT HAKIKKAR'),
```

**L839**

```
  ('408', 'נאות מרדכי', 'NE''OT MORDEKHAY'),
```

**L840**

```
  ('186', 'נעורים', 'NE''URIM'),
```

**L841**

```
  ('315', 'נגבה', 'NEGBA'),
```

**L842**

```
  ('3724', 'נגוהות', 'NEGOHOT'),
```

**L843**

```
  ('449', 'נחלים', 'NEHALIM'),
```

**L844**

```
  ('309', 'נהורה', 'NEHORA'),
```

**L845**

```
  ('59', 'נחושה', 'NEHUSHA'),
```

**L846**

```
  ('523', 'ניין', 'NEIN'),
```

**L847**

```
  ('3890', 'נריה', 'NERIYA'),
```

**L848**

```
  ('1143', 'נס עמים', 'NES AMMIM'),
```

**L849**

```
  ('825', 'נס הרים', 'NES HARIM'),
```

**L850**

```
  ('7200', 'נס ציונה', 'NES ZIYYONA'),
```

**L851**

```
  ('2500', 'נשר', 'NESHER'),
```

**L852**

```
  ('1369', 'נטע', 'NETA'),
```

**L853**

```
  ('174', 'נטעים', 'NETA''IM'),
```

**L854**

```
  ('7400', 'נתניה', 'NETANYA'),
```

**L855**

```
  ('1242', 'נתיב העשרה', 'NETIV HAASARA'),
```

**L856**

```
  ('3555', 'נתיב הגדוד', 'NETIV HAGEDUD'),
```

**L857**

```
  ('693', 'נתיב הלה', 'NETIV HALAMED-HE'),
```

**L858**

```
  ('792', 'נתיב השיירה', 'NETIV HASHAYYARA'),
```

**L859**

```
  ('246', 'נתיבות', 'NETIVOT'),
```

**L860**

```
  ('1147', 'נטועה', 'NETU''A'),
```

**L861**

```
  ('396', 'נבטים', 'NEVATIM'),
```

**L862**

```
  ('3877', 'נווה גדיד', 'NEVE GADID'),
```

**L863**

```
  ('3573', 'נוה צוף', 'NEVE TSUF'),
```

**L864**

```
  ('4303', 'נווה אטיב', 'NEWE ATIV'),
```

**L865**

```
  ('926', 'נווה אבות', 'NEWE AVOT'),
```

**L866**

```
  ('3725', 'נווה דניאל', 'NEWE DANIYYEL'),
```

**L867**

```
  ('296', 'נווה איתן', 'NEWE ETAN'),
```

**L868**

```
  ('1279', 'נווה חריף', 'NEWE HARIF'),
```

**L869**

```
  ('405', 'נווה אילן', 'NEWE ILAN'),
```

**L870**

```
  ('1071', 'נווה מיכאל', 'NEWE MIKHA''EL'),
```

**L871**

```
  ('827', 'נווה מבטח', 'NEWE MIVTAH'),
```

**L872**

```
  ('1259', 'נווה שלום', 'NEWE SHALOM'),
```

**L873**

```
  ('590', 'נווה אור', 'NEWE UR'),
```

**L874**

```
  ('312', 'נווה ים', 'NEWE YAM'),
```

**L875**

```
  ('686', 'נווה ימין', 'NEWE YAMIN'),
```

**L876**

```
  ('858', 'נווה ירק', 'NEWE YARAQ'),
```

**L877**

```
  ('1314', 'נווה זיו', 'NEWE ZIV'),
```

**L878**

```
  ('1057', 'נווה זוהר', 'NEWE ZOHAR'),
```

**L879**

```
  ('1372', 'נצר חזני', 'NEZER HAZZANI'),
```

**L880**

```
  ('435', 'נצר סרני', 'NEZER SERENI'),
```

**L881**

```
  ('3887', 'נזר שומרון', 'NEZER SHOMRON'),
```

**L882**

```
  ('3655', 'נילי', 'NILI'),
```

**L883**

```
  ('4035', 'נמרוד', 'NIMROD'),
```

**L884**

```
  ('348', 'ניר עם', 'NIR AM'),
```

**L885**

```
  ('2048', 'ניר עקיבא', 'NIR AQIVA'),
```

**L886**

```
  ('553', 'ניר בנים', 'NIR BANIM'),
```

**L887**

```
  ('256', 'ניר דוד (תל עמל)', 'NIR DAWID (TEL AMAL)'),
```

**L888**

```
  ('808', 'ניר אליהו', 'NIR ELIYYAHU'),
```

**L889**

```
  ('769', 'ניר עציון', 'NIR EZYON'),
```

**L890**

```
  ('720', 'ניר גלים', 'NIR GALLIM'),
```

**L891**

```
  ('11', 'ניר חן', 'NIR HEN'),
```

**L892**

```
  ('2047', 'ניר משה', 'NIR MOSHE'),
```

**L893**

```
  ('69', 'ניר עוז', 'NIR OZ'),
```

**L894**

```
  ('165', 'ניר יפה', 'NIR YAFE'),
```

**L895**

```
  ('699', 'ניר ישראל', 'NIR YISRA''EL'),
```

**L896**

```
  ('402', 'ניר יצחק', 'NIR YIZHAQ'),
```

**L897**

```
  ('331', 'ניר צבי', 'NIR ZEVI'),
```

**L898**

```
  ('602', 'נירים', 'NIRIM'),
```

**L899**

```
  ('1236', 'נירית', 'NIRIT'),
```

**L900**

```
  ('351', 'ניצן', 'NIZZAN'),
```

**L901**

```
  ('1419', 'ניצן ב''', 'NIZZAN B'),
```

**L902**

```
  ('1195', 'ניצנה (קהילת חינוך)', 'NIZZANA (QEHILAT HIN'),
```

**L903**

```
  ('851', 'ניצני עוז', 'NIZZANE OZ'),
```

**L904**

```
  ('1280', 'ניצני סיני', 'NIZZANE SINAY'),
```

**L905**

```
  ('359', 'ניצנים', 'NIZZANIM'),
```

**L906**

```
  ('15', 'נועם', 'NO''AM'),
```

**L907**

```
  ('1333', 'נוף איילון', 'NOF AYYALON'),
```

**L908**

```
  ('1061', 'נוף הגליל', 'NOF HAGALIL'),
```

**L909**

```
  ('3876', 'נופי פרת', 'NOFE PRAT'),
```

**L910**

```
  ('257', 'נופך', 'NOFEKH'),
```

**L911**

```
  ('3790', 'נופים', 'NOFIM'),
```

**L912**

```
  ('1284', 'נופית', 'NOFIT'),
```

**L913**

```
  ('55', 'נוגה', 'NOGAH'),
```

**L914**

```
  ('3726', 'נוקדים', 'NOQEDIM'),
```

**L915**

```
  ('447', 'נורדיה', 'NORDIYYA'),
```

**L916**

```
  ('4304', 'נוב', 'NOV'),
```

**L917**

```
  ('833', 'נורית', 'NURIT'),
```

**L918**

```
  ('4010', 'אודם', 'ODEM'),
```

**L919**

```
  ('31', 'אופקים', 'OFAQIM'),
```

**L920**

```
  ('810', 'עופר', 'OFER'),
```

**L921**

```
  ('3617', 'עופרה', 'OFRA'),
```

**L922**

```
  ('1046', 'אוהד', 'OHAD'),
```

**L923**

```
  ('737', 'עולש', 'OLESH'),
```

**L924**

```
  ('1108', 'אומן', 'OMEN'),
```

**L925**

```
  ('666', 'עומר', 'OMER'),
```

**L926**

```
  ('680', 'אומץ', 'OMEZ'),
```

**L927**

```
  ('1020', 'אור עקיבא', 'OR AQIVA'),
```

**L928**

```
  ('1294', 'אור הגנוז', 'OR HAGANUZ'),
```

**L929**

```
  ('67', 'אור הנר', 'OR HANER'),
```

**L930**

```
  ('2400', 'אור יהודה', 'OR YEHUDA'),
```

**L931**

```
  ('780', 'אורה', 'ORA'),
```

**L932**

```
  ('882', 'אורנים', 'ORANIM'),
```

**L933**

```
  ('3760', 'אורנית', 'ORANIT'),
```

**L934**

```
  ('2012', 'אורות', 'OROT'),
```

**L935**

```
  ('4013', 'אורטל', 'ORTAL'),
```

**L936**

```
  ('3748', 'עתניאל', 'OTNI''EL'),
```

**L937**

```
  ('3786', 'אובנת', 'OVNAT'),
```

**L938**

```
  ('32', 'עוצם', 'OZEM'),
```

**L939**

```
  ('2059', 'פעמי תשז', 'PA''AME TASHAZ'),
```

**L940**

```
  ('597', 'פלמחים', 'PALMAHIM'),
```

**L941**

```
  ('1151', 'פארן', 'PARAN'),
```

**L942**

```
  ('3894', 'פרשים', 'PARASHIM'),
```

**L943**

```
  ('7800', 'פרדס חנה-כרכור', 'PARDES HANNA-KARKUR'),
```

**L944**

```
  ('171', 'פרדסיה', 'PARDESIYYA'),
```

**L945**

```
  ('599', 'פרוד', 'PAROD'),
```

**L946**

```
  ('749', 'פטיש', 'PATTISH'),
```

**L947**

```
  ('838', 'פדיה', 'PEDAYA'),
```

**L948**

```
  ('3768', 'פדואל', 'PEDU''EL'),
```

**L949**

```
  ('750', 'פדויים', 'PEDUYIM'),
```

**L950**

```
  ('1185', 'פלך', 'PELEKH'),
```

**L951**

```
  ('3723', 'פני חבר', 'PENE HEVER'),
```

**L952**

```
  ('536', 'פקיעין (בוקייעה)', 'PEQI''IN (BUQEI''A)'),
```

**L953**

```
  ('281', 'פקיעין חדשה', 'PEQI''IN HADASHA'),
```

**L954**

```
  ('2053', 'פרזון', 'PERAZON'),
```

**L955**

```
  ('1231', 'פרי גן', 'PERI GAN'),
```

**L956**

```
  ('3659', 'פסגות', 'PESAGOT'),
```

**L957**

```
  ('7900', 'פתח תקווה', 'PETAH TIQWA'),
```

**L958**

```
  ('839', 'פתחיה', 'PETAHYA'),
```

**L959**

```
  ('3615', 'פצאל', 'PEZA''EL'),
```

**L960**

```
  ('767', 'פורת', 'PORAT'),
```

**L961**

```
  ('1313', 'פוריה עילית', 'PORIYYA ILLIT'),
```

**L962**

```
  ('1104', 'פוריה - כפר עבודה', 'PORIYYA-KEFAR AVODA'),
```

**L963**

```
  ('1105', 'פוריה - נווה עובד', 'PORIYYA-NEWE OVED'),
```

**L964**

```
  ('4029', 'רמת הנשיא טראמפ', 'PRESIDENT TRUMP HEI'),
```

**L965**

```
  ('1234', 'קבועה (שבט)', 'QABBO''A'),
```

**L966**

```
  ('1211', 'קדרים', 'QADDARIM'),
```

**L967**

```
  ('195', 'קדימה-צורן', 'QADIMA-ZORAN'),
```

**L968**

```
  ('638', 'קלנסווה', 'QALANSAWE'),
```

**L969**

```
  ('3601', 'קליה', 'QALYA'),
```

**L970**

```
  ('3640', 'קרני שומרון', 'QARNE SHOMERON'),
```

**L971**

```
  ('972', 'קוואעין (שבט)', 'QAWA''IN'),
```

**L972**

```
  ('1243', 'קציר', 'QAZIR'),
```

**L973**

```
  ('4100', 'קצרין', 'QAZRIN'),
```

**L974**

```
  ('3781', 'קדר', 'QEDAR'),
```

**L975**

```
  ('392', 'קדמה', 'QEDMA'),
```

**L976**

```
  ('3557', 'קדומים', 'QEDUMIM'),
```

**L977**

```
  ('4024', 'קלע', 'QELA'),
```

**L978**

```
  ('414', 'קלחים', 'QELAHIM'),
```

**L979**

```
  ('1167', 'קיסריה', 'QESARIYYA'),
```

**L980**

```
  ('4006', 'קשת', 'QESHET'),
```

**L981**

```
  ('1052', 'קטורה', 'QETURA'),
```

**L982**

```
  ('334', 'קבוצת יבנה', 'QEVUZAT YAVNE'),
```

**L983**

```
  ('4025', 'קדמת צבי', 'QIDMAT ZEVI'),
```

**L984**

```
  ('615', 'קדרון', 'QIDRON'),
```

**L985**

```
  ('78', 'קרית ענבים', 'QIRYAT ANAVIM'),
```

**L986**

```
  ('3611', 'קרית ארבע', 'QIRYAT ARBA'),
```

**L987**

```
  ('6800', 'קרית אתא', 'QIRYAT ATTA'),
```

**L988**

```
  ('9500', 'קרית ביאליק', 'QIRYAT BIALIK'),
```

**L989**

```
  ('469', 'קרית עקרון', 'QIRYAT EQRON'),
```

**L990**

```
  ('2630', 'קרית גת', 'QIRYAT GAT'),
```

**L991**

```
  ('1034', 'קרית מלאכי', 'QIRYAT MAL''AKHI'),
```

**L992**

```
  ('8200', 'קרית מוצקין', 'QIRYAT MOTZKIN'),
```

**L993**

```
  ('3746', 'קרית נטפים', 'QIRYAT NETAFIM'),
```

**L994**

```
  ('2620', 'קרית אונו', 'QIRYAT ONO'),
```

**L995**

```
  ('412', 'קרית שלמה', 'QIRYAT SHELOMO'),
```

**L996**

```
  ('2800', 'קרית שמונה', 'QIRYAT SHEMONA'),
```

**L997**

```
  ('2300', 'קרית טבעון', 'QIRYAT TIV''ON'),
```

**L998**

```
  ('9600', 'קרית ים', 'QIRYAT YAM'),
```

**L999**

```
  ('1137', 'קרית יערים', 'QIRYAT YE''ARIM'),
```

**L1000**

```
  ('2039', 'קרית יערים(מוסד)', 'QIRYAT YE''ARIM(INSTI'),
```

**L1001**

```
  ('766', 'קוממיות', 'QOMEMIYYUT'),
```

**L1002**

```
  ('1179', 'קורנית', 'QORANIT'),
```

**L1003**

```
  ('964', 'קודייראת א-צאנע(שבט)', 'QUDEIRAT AS-SANI'),
```

**L1004**

```
  ('8700', 'רעננה', 'RA''ANANA'),
```

**L1005**

```
  ('1161', 'רהט', 'RAHAT'),
```

**L1006**

```
  ('1069', 'רם-און', 'RAM-ON'),
```

**L1007**

```
  ('135', 'רמת דוד', 'RAMAT DAWID'),
```

**L1008**

```
  ('8600', 'רמת גן', 'RAMAT GAN'),
```

**L1009**

```
  ('184', 'רמת הכובש', 'RAMAT HAKOVESH'),
```

**L1010**

```
  ('2650', 'רמת השרון', 'RAMAT HASHARON'),
```

**L1011**

```
  ('335', 'רמת השופט', 'RAMAT HASHOFET'),
```

**L1012**

```
  ('4701', 'רמת מגשימים', 'RAMAT MAGSHIMIM'),
```

**L1013**

```
  ('127', 'רמת רחל', 'RAMAT RAHEL'),
```

**L1014**

```
  ('460', 'רמת רזיאל', 'RAMAT RAZI''EL'),
```

**L1015**

```
  ('122', 'רמת ישי', 'RAMAT YISHAY'),
```

**L1016**

```
  ('178', 'רמת יוחנן', 'RAMAT YOHANAN'),
```

**L1017**

```
  ('339', 'רמת צבי', 'RAMAT ZEVI'),
```

**L1018**

```
  ('543', 'ראמה', 'RAME'),
```

**L1019**

```
  ('8500', 'רמלה', 'RAMLA'),
```

**L1020**

```
  ('4702', 'רמות', 'RAMOT'),
```

**L1021**

```
  ('206', 'רמות השבים', 'RAMOT HASHAVIM'),
```

**L1022**

```
  ('735', 'רמות מאיר', 'RAMOT ME''IR'),
```

**L1023**

```
  ('445', 'רמות מנשה', 'RAMOT MENASHE'),
```

**L1024**

```
  ('372', 'רמות נפתלי', 'RAMOT NAFTALI'),
```

**L1025**

```
  ('789', 'רנן', 'RANNEN'),
```

**L1026**

```
  ('1228', 'רקפת', 'RAQEFET'),
```

**L1027**

```
  ('1334', 'ראס אל-עין', 'RAS AL-EIN'),
```

**L1028**

```
  ('990', 'ראס עלי', 'RAS ALI'),
```

**L1029**

```
  ('1225', 'רביד', 'RAVID'),
```

**L1030**

```
  ('713', 'רעים', 'RE''IM'),
```

**L1031**

```
  ('444', 'רגבים', 'REGAVIM'),
```

**L1032**

```
  ('390', 'רגבה', 'REGBA'),
```

**L1033**

```
  ('3568', 'ריחן', 'REHAN'),
```

**L1034**

```
  ('3822', 'רחלים', 'REHELIM'),
```

**L1035**

```
  ('854', 'רחוב', 'REHOV'),
```

**L1036**

```
  ('8400', 'רחובות', 'REHOVOT'),
```

**L1037**

```
  ('540', 'ריחאניה', 'REIHANIYYE'),
```

**L1038**

```
  ('542', 'ריינה', 'REINE'),
```

**L1039**

```
  ('922', 'רכסים', 'REKHASIM'),
```

**L1040**

```
  ('437', 'רשפים', 'RESHAFIM'),
```

**L1041**

```
  ('1260', 'רתמים', 'RETAMIM'),
```

**L1042**

```
  ('564', 'רבדים', 'REVADIM'),
```

**L1043**

```
  ('3795', 'רבבה', 'REVAVA'),
```

**L1044**

```
  ('354', 'רביבים', 'REVIVIM'),
```

**L1045**

```
  ('2051', 'רווחה', 'REWAHA'),
```

**L1046**

```
  ('2016', 'רוויה', 'REWAYA'),
```

**L1047**

```
  ('3565', 'רימונים', 'RIMMONIM'),
```

**L1048**

```
  ('616', 'רינתיה', 'RINNATYA'),
```

**L1049**

```
  ('8300', 'ראשון לציון', 'RISHON LEZIYYON'),
```

**L1050**

```
  ('247', 'רשפון', 'RISHPON'),
```

**L1051**

```
  ('3619', 'רועי', 'RO''I'),
```

**L1052**

```
  ('2640', 'ראש העין', 'ROSH HAAYIN'),
```

**L1053**

```
  ('26', 'ראש פינה', 'ROSH PINNA'),
```

**L1054**

```
  ('3602', 'ראש צורים', 'ROSH ZURIM'),
```

**L1055**

```
  ('3782', 'רותם', 'ROTEM'),
```

**L1056**

```
  ('1341', 'רוח מדבר', 'RUAH MIDBAR'),
```

**L1057**

```
  ('362', 'רוחמה', 'RUHAMA'),
```

**L1058**

```
  ('997', 'רומת הייב', 'RUMAT HEIB'),
```

**L1059**

```
  ('539', 'רומאנה', 'RUMMANE'),
```

**L1060**

```
  ('419', 'סעד', 'SA''AD'),
```

**L1061**

```
  ('454', 'סער', 'SA''AR'),
```

**L1062**

```
  ('1360', 'סעוה', 'SA''WA'),
```

**L1063**

```
  ('3711', 'שא-נור', 'SA-NUR'),
```

**L1064**

```
  ('525', 'סאג''ור', 'SAJUR'),
```

**L1065**

```
  ('7500', 'סח''נין', 'SAKHNIN'),
```

**L1066**

```
  ('3567', 'סלעית', 'SAL''IT'),
```

**L1067**

```
  ('1245', 'סלמה', 'SALLAMA'),
```

**L1068**

```
  ('1156', 'סמר', 'SAMAR'),
```

**L1069**

```
  ('636', 'צנדלה', 'SANDALA'),
```

**L1070**

```
  ('1176', 'ספיר', 'SAPPIR'),
```

**L1071**

```
  ('126', 'שריד', 'SARID'),
```

**L1072**

```
  ('578', 'סאסא', 'SASA'),
```

**L1073**

```
  ('587', 'סביון', 'SAVYON'),
```

**L1074**

```
  ('942', 'סואעד (חמירה)', 'SAWA''ID (HUMAYRA)'),
```

**L1075**

```
  ('989', 'סואעד (כמאנה) (שבט)', 'SAWA''ID (KAMANE)'),
```

**L1076**

```
  ('1170', 'סייד (שבט)', 'SAYYID'),
```

**L1077**

```
  ('1223', 'שדי אברהם', 'SEDE AVRAHAM'),
```

**L1078**

```
  ('885', 'שדה בוקר', 'SEDE BOQER'),
```

**L1079**

```
  ('36', 'שדה דוד', 'SEDE DAWID'),
```

**L1080**

```
  ('861', 'שדה אליעזר', 'SEDE ELI''EZER'),
```

**L1081**

```
  ('304', 'שדה אליהו', 'SEDE ELIYYAHU'),
```

**L1082**

```
  ('2015', 'שדי חמד', 'SEDE HEMED'),
```

**L1083**

```
  ('721', 'שדה אילן', 'SEDE ILAN'),
```

**L1084**

```
  ('18', 'שדה משה', 'SEDE MOSHE'),
```

**L1085**

```
  ('259', 'שדה נחום', 'SEDE NAHUM'),
```

**L1086**

```
  ('329', 'שדה נחמיה', 'SEDE NEHEMYA'),
```

**L1087**

```
  ('1058', 'שדה ניצן', 'SEDE NIZZAN'),
```

**L1088**

```
  ('2057', 'שדי תרומות', 'SEDE TERUMOT'),
```

**L1089**

```
  ('739', 'שדה עוזיהו', 'SEDE UZZIYYAHU'),
```

**L1090**

```
  ('284', 'שדה ורבורג', 'SEDE WARBURG'),
```

**L1091**

```
  ('142', 'שדה יעקב', 'SEDE YA''AQOV'),
```

**L1092**

```
  ('2008', 'שדה יצחק', 'SEDE YIZHAQ'),
```

**L1093**

```
  ('293', 'שדה יואב', 'SEDE YO''AV'),
```

**L1094**

```
  ('2049', 'שדה צבי', 'SEDE ZEVI'),
```

**L1095**

```
  ('1031', 'שדרות', 'SEDEROT'),
```

**L1096**

```
  ('27', 'שדות מיכה', 'SEDOT MIKHA'),
```

**L1097**

```
  ('327', 'שדות ים', 'SEDOT YAM'),
```

**L1098**

```
  ('1286', 'שגב-שלום', 'SEGEV-SHALOM'),
```

**L1099**

```
  ('2046', 'סגולה', 'SEGULA'),
```

**L1100**

```
  ('1132', 'שניר', 'SENIR'),
```

**L1101**

```
  ('538', 'שעב', 'SHA''AB'),
```

**L1102**

```
  ('4009', 'שעל', 'SHA''AL'),
```

**L1103**

```
  ('856', 'שעלבים', 'SHA''ALVIM'),
```

**L1104**

```
  ('661', 'שער אפרים', 'SHA''AR EFRAYIM'),
```

**L1105**

```
  ('237', 'שער העמקים', 'SHA''AR HAAMAQIM'),
```

**L1106**

```
  ('264', 'שער הגולן', 'SHA''AR HAGOLAN'),
```

**L1107**

```
  ('921', 'שער מנשה', 'SHA''AR MENASHE'),
```

**L1108**

```
  ('3826', 'שער שומרון', 'SHA''AR SHOMRON'),
```

**L1109**

```
  ('306', 'שדמות דבורה', 'SHADMOT DEVORA'),
```

**L1110**

```
  ('3578', 'שדמות מחולה', 'SHADMOT MEHOLA'),
```

**L1111**

```
  ('692', 'שפיר', 'SHAFIR'),
```

**L1112**

```
  ('7', 'שחר', 'SHAHAR'),
```

**L1113**

```
  ('3868', 'שחרית', 'SHAHARIT'),
```

**L1114**

```
  ('1266', 'שחרות', 'SHAHARUT'),
```

**L1115**

```
  ('1373', 'שלווה במדבר', 'SHALVA BAMIDBAR'),
```

**L1116**

```
  ('873', 'שלווה', 'SHALWA'),
```

**L1117**

```
  ('432', 'שמרת', 'SHAMERAT'),
```

**L1118**

```
  ('366', 'שמיר', 'SHAMIR'),
```

**L1119**

```
  ('1287', 'שני', 'SHANI'),
```

**L1120**

```
  ('3649', 'שקד', 'SHAQED'),
```

**L1121**

```
  ('292', 'שרונה', 'SHARONA'),
```

**L1122**

```
  ('398', 'שרשרת', 'SHARSHERET'),
```

**L1123**

```
  ('1377', 'שבי דרום', 'SHAVE DAROM'),
```

**L1124**

```
  ('3571', 'שבי שומרון', 'SHAVE SHOMERON'),
```

**L1125**

```
  ('282', 'שבי ציון', 'SHAVE ZIYYON'),
```

**L1126**

```
  ('324', 'שאר ישוב', 'SHE''AR YASHUV'),
```

**L1127**

```
  ('555', 'שדמה', 'SHEDEMA'),
```

**L1128**

```
  ('8800', 'שפרעם', 'SHEFAR''AM'),
```

**L1129**

```
  ('232', 'שפיים', 'SHEFAYIM'),
```

**L1130**

```
  ('846', 'שפר', 'SHEFER'),
```

**L1131**

```
  ('658', 'שייח'' דנון', 'SHEIKH DANNUN'),
```

**L1132**

```
  ('1160', 'שכניה', 'SHEKHANYA'),
```

**L1133**

```
  ('812', 'שלומי', 'SHELOMI'),
```

**L1134**

```
  ('439', 'שלוחות', 'SHELUHOT'),
```

**L1135**

```
  ('1233', 'שקף', 'SHEQEF'),
```

**L1136**

```
  ('1045', 'שתולה', 'SHETULA'),
```

**L1137**

```
  ('763', 'שתולים', 'SHETULIM'),
```

**L1138**

```
  ('1378', 'שיזף', 'SHEZAF'),
```

**L1139**

```
  ('527', 'שזור', 'SHEZOR'),
```

**L1140**

```
  ('865', 'שיבולים', 'SHIBBOLIM'),
```

**L1141**

```
  ('913', 'שבלי - אום אל-גנם', 'SHIBLI'),
```

**L1142**

```
  ('1165', 'שילת', 'SHILAT'),
```

**L1143**

```
  ('3641', 'שילה', 'SHILO'),
```

**L1144**

```
  ('3784', 'שמעה', 'SHIM''A'),
```

**L1145**

```
  ('1337', 'שמשית', 'SHIMSHIT'),
```

**L1146**

```
  ('1197', 'נאות סמדר', 'SHIZZAFON'),
```

**L1147**

```
  ('1364', 'שלומית', 'SHLOMIT'),
```

**L1148**

```
  ('741', 'שואבה', 'SHO''EVA'),
```

**L1149**

```
  ('1304', 'שוהם', 'SHOHAM'),
```

**L1150**

```
  ('614', 'שומרה', 'SHOMERA'),
```

**L1151**

```
  ('1265', 'שומריה', 'SHOMERIYYA'),
```

**L1152**

```
  ('415', 'שוקדה', 'SHOQEDA'),
```

**L1153**

```
  ('1235', 'שורשים', 'SHORASHIM'),
```

**L1154**

```
  ('456', 'שורש', 'SHORESH'),
```

**L1155**

```
  ('224', 'שושנת העמקים', 'SHOSHANNAT HAAMAQIM'),
```

**L1156**

```
  ('1102', 'צוקי ים', 'SHOSHANNAT HAAMAQIM('),
```

**L1157**

```
  ('394', 'שובל', 'SHOVAL'),
```

**L1158**

```
  ('761', 'שובה', 'SHUVA'),
```

**L1159**

```
  ('3872', 'שבות רחל', 'SHVUT RAHEL'),
```

**L1160**

```
  ('610', 'סתריה', 'SITRIYYA'),
```

**L1161**

```
  ('1238', 'סופה', 'SUFA'),
```

**L1162**

```
  ('526', 'סולם', 'SULAM'),
```

**L1163**

```
  ('3756', 'סוסיה', 'SUSEYA'),
```

**L1164**

```
  ('752', 'תעוז', 'TA''OZ'),
```

**L1165**

```
  ('3873', 'טל מנשה', 'TAL MENASHE'),
```

**L1166**

```
  ('462', 'טל שחר', 'TAL SHAHAR'),
```

**L1167**

```
  ('1181', 'טל-אל', 'TAL-EL'),
```

**L1168**

```
  ('2050', 'תלמי בילו', 'TALME BILU'),
```

**L1169**

```
  ('2003', 'תלמי אלעזר', 'TALME EL''AZAR'),
```

**L1170**

```
  ('1051', 'תלמי אליהו', 'TALME ELIYYAHU'),
```

**L1171**

```
  ('744', 'תלמי יפה', 'TALME YAFE'),
```

**L1172**

```
  ('727', 'תלמי יחיאל', 'TALME YEHI''EL'),
```

**L1173**

```
  ('1237', 'תלמי יוסף', 'TALME YOSEF'),
```

**L1174**

```
  ('3788', 'טלמון', 'TALMON'),
```

**L1175**

```
  ('8900', 'טמרה', 'TAMRA'),
```

**L1176**

```
  ('547', 'טמרה (יזרעאל)', 'TAMRA (YIZRE''EL)'),
```

**L1177**

```
  ('970', 'תראבין א-צאנע (שבט)', 'TARABIN AS-SANI'),
```

**L1178**

```
  ('1346', 'תראבין א-צאנע(ישוב)', 'TARABIN AS-SANI'),
```

**L1179**

```
  ('778', 'תרום', 'TARUM'),
```

**L1180**

```
  ('2730', 'טייבה', 'TAYIBE'),
```

**L1181**

```
  ('497', 'טייבה (בעמק)', 'TAYIBE(BAEMEQ)'),
```

**L1182**

```
  ('2062', 'תאשור', 'TE''ASHUR'),
```

**L1183**

```
  ('1214', 'טפחות', 'TEFAHOT'),
```

**L1184**

```
  ('103', 'תל עדשים', 'TEL ADASHIM'),
```

**L1185**

```
  ('5000', 'תל אביב - יפו', 'TEL AVIV - YAFO'),
```

**L1186**

```
  ('154', 'תל מונד', 'TEL MOND'),
```

**L1187**

```
  ('719', 'תל קציר', 'TEL QAZIR'),
```

**L1188**

```
  ('1054', 'תל שבע', 'TEL SHEVA'),
```

**L1189**

```
  ('1283', 'תל תאומים', 'TEL TE''OMIM'),
```

**L1190**

```
  ('3815', 'תל ציון', 'TEL TSIYON'),
```

**L1191**

```
  ('287', 'תל יצחק', 'TEL YIZHAQ'),
```

**L1192**

```
  ('84', 'תל יוסף', 'TEL YOSEF'),
```

**L1193**

```
  ('1177', 'טללים', 'TELALIM'),
```

**L1194**

```
  ('814', 'תלמים', 'TELAMIM'),
```

**L1195**

```
  ('3719', 'תלם', 'TELEM'),
```

**L1196**

```
  ('3743', 'טנא', 'TENE'),
```

**L1197**

```
  ('2002', 'תנובות', 'TENUVOT'),
```

**L1198**

```
  ('3563', 'תקוע', 'TEQOA'),
```

**L1199**

```
  ('665', 'תקומה', 'TEQUMA'),
```

**L1200**

```
  ('6700', 'טבריה', 'TIBERIAS'),
```

**L1201**

```
  ('2061', 'תדהר', 'TIDHAR'),
```

**L1202**

```
  ('709', 'תפרח', 'TIFRAH'),
```

**L1203**

```
  ('163', 'תימורים', 'TIMMORIM'),
```

**L1204**

```
  ('1244', 'תמרת', 'TIMRAT'),
```

**L1205**

```
  ('2100', 'טירת כרמל', 'TIRAT KARMEL'),
```

**L1206**

```
  ('663', 'טירת יהודה', 'TIRAT YEHUDA'),
```

**L1207**

```
  ('268', 'טירת צבי', 'TIRAT ZEVI'),
```

**L1208**

```
  ('2720', 'טירה', 'TIRE'),
```

**L1209**

```
  ('10', 'תירוש', 'TIROSH'),
```

**L1210**

```
  ('3878', 'תמרה', 'TMARA'),
```

**L1211**

```
  ('3558', 'תומר', 'TOMER'),
```

**L1212**

```
  ('962', 'טובא-זנגריה', 'TUBA-ZANGARIYYE'),
```

**L1213**

```
  ('498', 'טורעאן', 'TUR''AN'),
```

**L1214**

```
  ('1083', 'תושיה', 'TUSHIYYA'),
```

**L1215**

```
  ('1172', 'תובל', 'TUVAL'),
```

**L1216**

```
  ('446', 'אודים', 'UDIM'),
```

**L1217**

```
  ('2710', 'אום אל-פחם', 'UMM AL-FAHM'),
```

**L1218**

```
  ('2024', 'אום אל-קוטוף', 'UMM AL-QUTUF'),
```

**L1219**

```
  ('1358', 'אום בטין', 'UMM BATIN'),
```

**L1220**

```
  ('957', 'עוקבי (בנו עוקבה)', 'UQBI (BANU UQBA)'),
```

**L1221**

```
  ('403', 'אורים', 'URIM'),
```

**L1222**

```
  ('278', 'אושה', 'USHA'),
```

**L1223**

```
  ('826', 'עוזה', 'UZA'),
```

**L1224**

```
  ('528', 'עוזייר', 'UZEIR'),
```

**L1225**

```
  ('1133', 'ורדון', 'WARDON'),
```

**L1226**

```
  ('3639', 'ורד יריחו', 'WERED YERIHO'),
```

**L1227**

```
  ('1138', 'יעד', 'YA''AD'),
```

**L1228**

```
  ('795', 'יערה', 'YA''ARA'),
```

**L1229**

```
  ('1117', 'יעל', 'YA''EL'),
```

**L1230**

```
  ('577', 'יד בנימין', 'YAD BINYAMIN'),
```

**L1231**

```
  ('758', 'יד חנה', 'YAD HANNA'),
```

**L1232**

```
  ('1134', 'יד השמונה', 'YAD HASHEMONA'),
```

**L1233**

```
  ('358', 'יד מרדכי', 'YAD MORDEKHAY'),
```

**L1234**

```
  ('775', 'יד נתן', 'YAD NATAN'),
```

**L1235**

```
  ('64', 'יד רמבם', 'YAD RAMBAM'),
```

**L1236**

```
  ('499', 'יפיע', 'YAFI'),
```

**L1237**

```
  ('3566', 'יפית', 'YAFIT'),
```

**L1238**

```
  ('798', 'יגל', 'YAGEL'),
```

**L1239**

```
  ('96', 'יגור', 'YAGUR'),
```

**L1240**

```
  ('1158', 'יהל', 'YAHEL'),
```

**L1241**

```
  ('811', 'יכיני', 'YAKHINI'),
```

**L1242**

```
  ('1295', 'יאנוח-ג''ת', 'YANUH-JAT'),
```

**L1243**

```
  ('753', 'ינוב', 'YANUV'),
```

**L1244**

```
  ('3647', 'יקיר', 'YAQIR'),
```

**L1245**

```
  ('417', 'יקום', 'YAQUM'),
```

**L1246**

```
  ('2026', 'ירדנה', 'YARDENA'),
```

**L1247**

```
  ('718', 'ירחיב', 'YARHIV'),
```

**L1248**

```
  ('183', 'ירקונה', 'YARQONA'),
```

**L1249**

```
  ('575', 'יסעור', 'YAS''UR'),
```

**L1250**

```
  ('828', 'ישרש', 'YASHRESH'),
```

**L1251**

```
  ('1227', 'יתד', 'YATED'),
```

**L1252**

```
  ('2660', 'יבנה', 'YAVNE'),
```

**L1253**

```
  ('46', 'יבנאל', 'YAVNE''EL'),
```

**L1254**

```
  ('759', 'יציץ', 'YAZIZ'),
```

**L1255**

```
  ('1044', 'יעף', 'YE''AF'),
```

**L1256**

```
  ('1144', 'ידידה', 'YEDIDA'),
```

**L1257**

```
  ('233', 'כפר ידידיה', 'YEDIDYA'),
```

**L1258**

```
  ('409', 'יחיעם', 'YEHI''AM'),
```

**L1259**

```
  ('9400', 'יהוד-מונוסון', 'YEHUD-MONOSON'),
```

**L1260**

```
  ('831', 'ירוחם', 'YEROHAM'),
```

**L1261**

```
  ('916', 'ישע', 'YESHA'),
```

**L1262**

```
  ('440', 'יסודות', 'YESODOT'),
```

**L1263**

```
  ('29', 'יסוד המעלה', 'YESUD HAMA''ALA'),
```

**L1264**

```
  ('1232', 'יבול', 'YEVUL'),
```

**L1265**

```
  ('134', 'יפעת', 'YIF''AT'),
```

**L1266**

```
  ('453', 'יפתח', 'YIFTAH'),
```

**L1267**

```
  ('2011', 'ינון', 'YINNON'),
```

**L1268**

```
  ('623', 'יראון', 'YIR''ON'),
```

**L1269**

```
  ('502', 'ירכא', 'YIRKA'),
```

**L1270**

```
  ('805', 'ישעי', 'YISH''I'),
```

**L1271**

```
  ('3607', 'ייטב', 'YITAV'),
```

**L1272**

```
  ('3749', 'יצהר', 'YIZHAR'),
```

**L1273**

```
  ('452', 'יזרעאל', 'YIZRE''EL'),
```

**L1274**

```
  ('1112', 'יודפת', 'YODEFAT'),
```

**L1275**

```
  ('3896', 'יונדב', 'YONADAV'),
```

**L1276**

```
  ('4007', 'יונתן', 'YONATAN'),
```

**L1277**

```
  ('240', 'יקנעם עילית', 'YOQNE''AM ILLIT'),
```

**L1278**

```
  ('241', 'יקנעם (מושבה)', 'YOQNE''AM(MOSHAVA)'),
```

**L1279**

```
  ('803', 'יושיביה', 'YOSHIVYA'),
```

**L1280**

```
  ('866', 'יטבתה', 'YOTVATA'),
```

**L1281**

```
  ('2009', 'יובל', 'YUVAL'),
```

**L1282**

```
  ('1226', 'יובלים', 'YUVALIM'),
```

**L1283**

```
  ('2742', 'זבארגה (שבט)', 'ZABARGA'),
```

**L1284**

```
  ('1079', 'צפרירים', 'ZAFRIRIM'),
```

**L1285**

```
  ('594', 'צפריה', 'ZAFRIYYA'),
```

**L1286**

```
  ('816', 'זנוח', 'ZANOAH'),
```

**L1287**

```
  ('975', 'זרזיר', 'ZARZIR'),
```

**L1288**

```
  ('815', 'זבדיאל', 'ZAVDI''EL'),
```

**L1289**

```
  ('413', 'צאלים', 'ZE''ELIM'),
```

**L1290**

```
  ('8000', 'צפת', 'ZEFAT'),
```

**L1291**

```
  ('799', 'זכריה', 'ZEKHARYA'),
```

**L1292**

```
  ('796', 'צלפון', 'ZELAFON'),
```

**L1293**

```
  ('1290', 'זמר', 'ZEMER'),
```

**L1294**

```
  ('818', 'זרחיה', 'ZERAHYA'),
```

**L1295**

```
  ('2064', 'זרועה', 'ZERU''A'),
```

**L1296**

```
  ('612', 'צרופה', 'ZERUFA'),
```

**L1297**

```
  ('788', 'זיתן', 'ZETAN'),
```

**L1298**

```
  ('9300', 'זכרון יעקב', 'ZIKHRON YA''AQOV'),
```

**L1299**

```
  ('1065', 'זמרת', 'ZIMRAT'),
```

**L1300**

```
  ('613', 'ציפורי', 'ZIPPORI'),
```

**L1301**

```
  ('584', 'זיקים', 'ZIQIM'),
```

**L1302**

```
  ('1213', 'צבעון', 'ZIV''ON'),
```

**L1303**

```
  ('1150', 'צופר', 'ZOFAR'),
```

**L1304**

```
  ('198', 'צופית', 'ZOFIT'),
```

**L1305**

```
  ('1111', 'צופיה', 'ZOFIYYA'),
```

**L1306**

```
  ('1136', 'צוחר', 'ZOHAR'),
```

**L1307**

```
  ('44', 'זוהר', 'ZOHAR'),
```

**L1308**

```
  ('567', 'צרעה', 'ZOR''A'),
```

**L1309**

```
  ('465', 'צובה', 'ZOVA'),
```

**L1310**

```
  ('3791', 'צופים', 'ZUFIN'),
```

**L1311**

```
  ('1113', 'צור הדסה', 'ZUR HADASSA'),
```

**L1312**

```
  ('276', 'צור משה', 'ZUR MOSHE'),
```

**L1313**

```
  ('1148', 'צור נתן', 'ZUR NATAN'),
```

**L1314**

```
  ('1345', 'צור יצחק', 'ZUR YIZHAQ'),
```

**L1315**

```
  ('774', 'צוריאל', 'ZURI''EL'),
```

**L1316**

```
  ('1221', 'צורית', 'ZURIT'),
```

**L1317**

```
  ('1180', 'צביה', 'ZVIYYA')
```

**L1323**

```
update public.users set city = '5000', city_name = 'תל אביב - יפו' where city = 'tel-aviv';
```

**L1324**

```
update public.users set city = '3000', city_name = 'ירושלים' where city = 'jerusalem';
```

**L1325**

```
update public.users set city = '4000', city_name = 'חיפה' where city = 'haifa';
```

**L1326**

```
update public.users set city = '8300', city_name = 'ראשון לציון' where city = 'rishon';
```

**L1327**

```
update public.users set city = '7900', city_name = 'פתח תקווה' where city = 'petah-tikva';
```

**L1328**

```
update public.users set city = '70', city_name = 'אשדוד' where city = 'ashdod';
```

**L1329**

```
update public.users set city = '7400', city_name = 'נתניה' where city = 'netanya';
```

**L1330**

```
update public.users set city = '9000', city_name = 'באר שבע' where city = 'beer-sheva';
```

**L1331**

```
update public.users set city = '6100', city_name = 'בני ברק' where city = 'bnei-brak';
```

**L1332**

```
update public.users set city = '6600', city_name = 'חולון' where city = 'holon';
```

**L1333**

```
update public.users set city = '8600', city_name = 'רמת גן' where city = 'ramat-gan';
```

**L1334**

```
update public.users set city = '7100', city_name = 'אשקלון' where city = 'ashkelon';
```

**L1335**

```
update public.users set city = '8400', city_name = 'רחובות' where city = 'rehovot';
```

**L1336**

```
update public.users set city = '6200', city_name = 'בת ים' where city = 'bat-yam';
```

**L1337**

```
update public.users set city = '6400', city_name = 'הרצליה' where city = 'herzliya';
```

**L1338**

```
update public.users set city = '6900', city_name = 'כפר סבא' where city = 'kfar-saba';
```

**L1339**

```
update public.users set city = '6500', city_name = 'חדרה' where city = 'hadera';
```

**L1340**

```
update public.users set city = '1200', city_name = 'מודיעין-מכבים-רעות' where city = 'modiin';
```

**L1341**

```
update public.users set city = '7300', city_name = 'נצרת' where city = 'nazareth';
```

**L1342**

```
update public.users set city = '8700', city_name = 'רעננה' where city = 'raanana';
```

**L1380**

```
    coalesce(picked_name, email_local, 'משתמש'),
```

**L1382**

```
    'תל אביב - יפו',
```

---

## `supabase/migrations/0012_users_chat_counterpart_select.sql`

**L6**

```
-- other and the FE renders them as "משתמש שנמחק", which is wrong.
```

---

## `supabase/migrations/0013_reports_emit_admin_message.sql`

**L67**

```
  v_body := 'דיווח חדש: ' || new.reason;
```

**L69**

```
    v_body := v_body || ' · יעד: ' || new.target_type;
```

---

## `supabase/migrations/0014_donation_categories_and_links.sql`

**L22**

```
  ('time',      'זמן',     'time-outline',         1, true),
```

**L23**

```
  ('money',     'כסף',     'cash-outline',         2, true),
```

**L24**

```
  ('food',      'אוכל',    'restaurant-outline',   3, true),
```

**L25**

```
  ('housing',   'דיור',    'home-outline',         4, true),
```

**L26**

```
  ('transport', 'תחבורה',  'car-outline',          5, true),
```

**L27**

```
  ('knowledge', 'ידע',     'school-outline',       6, true),
```

**L28**

```
  ('animals',   'חיות',    'paw-outline',          7, true),
```

**L29**

```
  ('medical',   'רפואה',   'medical-outline',      8, true)
```

---

## `supabase/migrations/0019_universal_search.sql`

**L8**

```
-- extra keyword-based discoverability (e.g. "תרומות,כסף,נתינה,jgive").
```

**L15**

```
  'Free-text comma-separated keywords for search discoverability (e.g. "תרומות,כסף,נתינה")';
```

---

## `supabase/migrations/0023_cities_geo_backfill.sql`

**L16**

```
update public.cities set lat = 32.0853, lon = 34.7818 where name_he = 'תל אביב -יפו';
```

**L17**

```
update public.cities set lat = 32.0853, lon = 34.7818 where name_he = 'תל אביב-יפו';
```

**L18**

```
update public.cities set lat = 31.7683, lon = 35.2137 where name_he = 'ירושלים';
```

**L19**

```
update public.cities set lat = 32.7940, lon = 34.9896 where name_he = 'חיפה';
```

**L20**

```
update public.cities set lat = 31.9647, lon = 34.8044 where name_he = 'ראשון לציון';
```

**L21**

```
update public.cities set lat = 32.0922, lon = 34.8878 where name_he = 'פתח תקווה';
```

**L22**

```
update public.cities set lat = 31.7918, lon = 34.6497 where name_he = 'אשדוד';
```

**L23**

```
update public.cities set lat = 32.3215, lon = 34.8532 where name_he = 'נתניה';
```

**L24**

```
update public.cities set lat = 31.2518, lon = 34.7913 where name_he = 'באר שבע';
```

**L25**

```
update public.cities set lat = 32.0808, lon = 34.8328 where name_he = 'בני ברק';
```

**L26**

```
update public.cities set lat = 32.0167, lon = 34.7795 where name_he = 'חולון';
```

**L27**

```
update public.cities set lat = 32.0823, lon = 34.8141 where name_he = 'רמת גן';
```

**L28**

```
update public.cities set lat = 31.6688, lon = 34.5742 where name_he = 'אשקלון';
```

**L29**

```
update public.cities set lat = 31.8928, lon = 34.8113 where name_he = 'רחובות';
```

**L30**

```
update public.cities set lat = 32.0167, lon = 34.7500 where name_he = 'בת ים';
```

**L31**

```
update public.cities set lat = 32.1664, lon = 34.8434 where name_he = 'הרצליה';
```

**L32**

```
update public.cities set lat = 32.1750, lon = 34.9067 where name_he = 'כפר סבא';
```

**L33**

```
update public.cities set lat = 32.4365, lon = 34.9196 where name_he = 'חדרה';
```

**L34**

```
update public.cities set lat = 31.8969, lon = 35.0103 where name_he = 'מודיעין-מכבים-רעות';
```

**L35**

```
update public.cities set lat = 32.7022, lon = 35.2978 where name_he = 'נצרת';
```

**L36**

```
update public.cities set lat = 32.1849, lon = 34.8714 where name_he = 'רעננה';
```

**L39**

```
update public.cities set lat = 31.9293, lon = 34.8669 where name_he = 'רמלה';
```

**L40**

```
update public.cities set lat = 31.9514, lon = 34.8951 where name_he = 'לוד';
```

**L41**

```
update public.cities set lat = 32.0712, lon = 34.8104 where name_he = 'גבעתיים';
```

**L42**

```
update public.cities set lat = 31.7780, lon = 35.2966 where name_he = 'מעלה אדומים';
```

**L43**

```
update public.cities set lat = 31.6100, lon = 34.7642 where name_he = 'קרית גת';
```

**L44**

```
update public.cities set lat = 29.5577, lon = 34.9519 where name_he = 'אילת';
```

**L45**

```
update public.cities set lat = 32.7959, lon = 35.5300 where name_he = 'טבריה';
```

**L46**

```
update public.cities set lat = 31.8782, lon = 34.7388 where name_he = 'יבנה';
```

**L47**

```
update public.cities set lat = 32.8011, lon = 35.1106 where name_he = 'קרית אתא';
```

**L48**

```
update public.cities set lat = 32.8467, lon = 35.0689 where name_he = 'קרית ים';
```

**L49**

```
update public.cities set lat = 32.8347, lon = 35.0856 where name_he = 'קרית ביאליק';
```

**L50**

```
update public.cities set lat = 32.8350, lon = 35.0833 where name_he = 'קרית מוצקין';
```

**L51**

```
update public.cities set lat = 32.0608, lon = 34.8542 where name_he = 'קרית אונו';
```

**L52**

```
update public.cities set lat = 33.0058, lon = 35.0989 where name_he = 'נהריה';
```

**L53**

```
update public.cities set lat = 32.6075, lon = 35.2900 where name_he = 'עפולה';
```

**L54**

```
update public.cities set lat = 31.0700, lon = 35.0333 where name_he = 'דימונה';
```

**L55**

```
update public.cities set lat = 32.2667, lon = 35.0167 where name_he = 'טייבה';
```

**L56**

```
update public.cities set lat = 31.5239, lon = 34.5959 where name_he = 'שדרות';
```

**L60**

```
update public.cities set lat = 31.2310, lon = 34.7800 where name_he = 'אבו עבדון (שבט)';
```

**L61**

```
update public.cities set lat = 31.7611, lon = 34.7531 where name_he = 'בן זכאי';
```

**L62**

```
update public.cities set lat = 31.2222, lon = 34.3000 where name_he = 'כרם שלום';
```

---

## `supabase/migrations/0024_cities_geo_fixups.sql`

**L5**

```
-- (Tel Aviv as "תל אביב - יפו" rather than "תל אביב-יפו" etc.). This
```

**L8**

```
update public.cities set lat = 32.0853, lon = 34.7818 where city_id = '5000'; -- תל אביב - יפו
```

**L9**

```
update public.cities set lat = 32.0114, lon = 34.7900 where city_id = '2400'; -- אור יהודה
```

**L10**

```
update public.cities set lat = 32.7170, lon = 35.1247 where city_id = '2300'; -- קרית טבעון
```

**L11**

```
update public.cities set lat = 31.6939, lon = 35.1208 where city_id = '3780'; -- ביתר עילית
```

**L12**

```
update public.cities set lat = 32.4717, lon = 34.9706 where city_id = '7800'; -- פרדס חנה-כרכור
```

**L13**

```
update public.cities set lat = 32.1500, lon = 34.8889 where city_id = '9700'; -- הוד השרון
```

---

## `supabase/migrations/0026_chat_anchor_lifecycle.sql`

**L61**

```
        v_body := 'הפוסט סומן כנמסר ✓ · תודה!';
```

**L63**

```
        v_body := 'הפוסט נמסר למשתמש אחר';
```

**L66**

```
      v_body := 'המפרסם סגר את הפוסט — הפריט לא נמסר';
```

---

## `supabase/migrations/0031_post_closure_emit_system_messages.sql`

**L85**

```
        v_body := 'הפוסט סומן כנמסר ✓ · תודה!';
```

**L87**

```
        v_body := 'הפוסט נמסר למשתמש אחר';
```

**L90**

```
      v_body := 'המפרסם סגר את הפוסט — הפריט לא נמסר';
```

---

## `supabase/migrations/0033_chat_inbox_personal_hide.sql`

**L204**

```
  v_body := 'דיווח חדש: ' || new.reason;
```

**L206**

```
    v_body := v_body || ' · יעד: ' || new.target_type;
```

---

## `supabase/migrations/0051_posts_item_condition_damaged.sql`

**L1**

```
-- 0051 | FR-POST-004 — extend Give item_condition with Damaged (שבור/תקול)
```

---

## `supabase/migrations/0068_verification_status_provider_aware_and_phone.sql`

**L84**

```
    coalesce(picked_name, email_local, 'משתמש'),
```

**L86**

```
    'תל אביב - יפו',
```

---

## `supabase/migrations/0069_privacy_mode_follow_approval_only.sql`

**L10**

```
--      publisher field falls back to "משתמש שנמחק" in
```

---

## `supabase/migrations/0081_street_number_allow_hebrew_suffix.sql`

**L15**

```
-- Israeli street numbering routinely uses Hebrew letter suffixes (e.g. `12א`,
```

**L16**

```
-- `15ב`). The app is Hebrew-first and forces RTL — rejecting `12א` is an
```

**L22**

```
-- The Hebrew range `[א-ת]` (U+05D0..U+05EA, 27 codepoints) covers the 22
```

**L50**

```
  check (street_number ~ '^[0-9]+[A-Za-zא-ת]?$');
```

**L62**

```
      and profile_street_number ~ '^[0-9]+[A-Za-zא-ת]?$'
```

---

## `supabase/seed.sql`

**L9**

```
  ('tel-aviv',     'תל אביב',          'Tel Aviv'),
```

**L10**

```
  ('jerusalem',    'ירושלים',           'Jerusalem'),
```

**L11**

```
  ('haifa',        'חיפה',              'Haifa'),
```

**L12**

```
  ('rishon',       'ראשון לציון',       'Rishon LeZion'),
```

**L13**

```
  ('petah-tikva',  'פתח תקווה',         'Petah Tikva'),
```

**L14**

```
  ('ashdod',       'אשדוד',             'Ashdod'),
```

**L15**

```
  ('netanya',      'נתניה',             'Netanya'),
```

**L16**

```
  ('beer-sheva',   'באר שבע',           'Beer Sheva'),
```

**L17**

```
  ('bnei-brak',    'בני ברק',           'Bnei Brak'),
```

**L18**

```
  ('holon',        'חולון',             'Holon'),
```

**L19**

```
  ('ramat-gan',    'רמת גן',            'Ramat Gan'),
```

**L20**

```
  ('ashkelon',     'אשקלון',            'Ashkelon'),
```

**L21**

```
  ('rehovot',      'רחובות',            'Rehovot'),
```

**L22**

```
  ('bat-yam',      'בת ים',             'Bat Yam'),
```

**L23**

```
  ('herzliya',     'הרצליה',            'Herzliya'),
```

**L24**

```
  ('kfar-saba',    'כפר סבא',           'Kfar Saba'),
```

**L25**

```
  ('hadera',       'חדרה',              'Hadera'),
```

**L26**

```
  ('modiin',       'מודיעין',           'Modi''in'),
```

**L27**

```
  ('nazareth',     'נצרת',              'Nazareth'),
```

**L28**

```
  ('raanana',      'רעננה',             'Ra''anana')
```

---

