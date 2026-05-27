import React, { useCallback, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, LayoutAnimation, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, typography, spacing, radius, useTheme } from '@kc/ui';
import { aboutRtlText, aboutRtlRow } from './aboutWebRtlStyle';

/**
 * About — "More on the Logo" dropdown (v1.0 §2.2–§2.3).
 * Renders the logo brand story as flowing narrative — not as bullets or
 * formulas. The "I ♥ the world" line is pulled out as a visual centerpiece
 * because that is the actual reading-discovery moment of the logo.
 * The Hebrew-keyboard line is woven into the text as a small discovery,
 * not framed as an equation.
 */

const LOGO_TODAY = require('../../../assets/logo-evolution/logo-5.png');

const JOURNEY_STAGES = [
  require('../../../assets/logo-evolution/logo-0.jpeg'),
  require('../../../assets/logo-evolution/logo-1.jpeg'),
  require('../../../assets/logo-evolution/logo-2.jpeg'),
  require('../../../assets/logo-evolution/logo-3.jpeg'),
  require('../../../assets/logo-evolution/logo-4.png'),
  require('../../../assets/logo-evolution/logo-5.png'),
];

export function AboutLogoEvolutionSection() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    if (Platform.OS !== 'web') LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }, []);

  return (
    <View>
      <View style={styles.headerRow}>
        <Image
          source={LOGO_TODAY}
          style={styles.headerLogo}
          accessibilityLabel="הלוגו של קהילת קארמה"
          resizeMode="contain"
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>עוד על הלוגו</Text>
          <Text style={styles.lead}>
            לב שלם, עולם אחד, ומראה שמחברת בין שניהם.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.expandHead, pressed && styles.expandHeadPressed]}
      >
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.secondary} />
        <Text style={styles.expandTitle}>
          {open ? 'פחות' : 'הסיפור מאחורי הלוגו'}
        </Text>
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <Text style={styles.paragraph}>
            הסתכלו רגע בלוגו. בצד שמאל יש את הצורה היסודית שלנו — <Text style={styles.bold}>K</Text> של Karma, ו-<Text style={styles.bold}>C</Text> של Community. בלעדי הצד השני, זו צורה לא גמורה: חצי לב, חצי עיגול.
          </Text>

          <Text style={styles.paragraph}>
            ואז יש את הצד הימני — והוא לא צד חדש. <Text style={styles.bold}>הוא מראה.</Text> כל מה שיש בשמאל, חוזר בימין כתמונת ראי. ברגע שהמראה נכנסת, חצי הלב של ה-K הופך ל<Text style={styles.bold}>לב שלם</Text>, וה-C נסגרת לעיגול — <Text style={styles.bold}>כדור הארץ, עם היבשות במרכז.</Text>
          </Text>

          <Text style={styles.paragraph}>
            קארמה היא הלב — נתינה. קהילה היא הגלובוס — אחדות. אחד לא חי בלי השני.
          </Text>

          <View style={styles.pullQuote}>
            <View style={styles.pullQuoteRule} />
            <Text style={styles.pullQuoteText}>I ♥ the world</Text>
            <View style={styles.pullQuoteRule} />
            <Text style={styles.pullQuoteCap}>
              בעיניים אנגליות, הלוגו נקרא בנגיעה אחת.
            </Text>
          </View>

          <Text style={styles.paragraph}>
            ובעברית? יש פה הפתעה קטנה. נסו להקליד את האותיות K ו-C כשהמקלדת בעברית — תקבלו בדיוק את המילה <Text style={styles.bold}>לב</Text>. את זה לא תכננו. זה פשוט קרה לבד.
          </Text>

          <View style={styles.divider} />

          <View>
            <Text style={styles.journeyKicker}>מסע קטן</Text>
            <Text style={styles.paragraph}>
              התחלנו ברישום על נייר — לב, מסך, רעיון של חיבור. שש גרסאות של חידוד אחר כך, הגענו ללוגו של היום.
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.journeyStrip}
            >
              {JOURNEY_STAGES.map((src, i) => (
                <View key={i} style={styles.journeyItem}>
                  <Image
                    source={src}
                    style={styles.journeyImage}
                    accessibilityLabel={`גרסה ${i + 1} מתוך 6`}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  headerRow: {
    flexDirection: aboutRtlRow,
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerLogo: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerText: { flex: 1, gap: spacing.xs },
  title: { ...typography.h4, color: colors.textPrimary, ...aboutRtlText },
  lead: {
    ...typography.body,
    color: colors.textSecondary,
    ...aboutRtlText,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  expandHead: {
    flexDirection: aboutRtlRow,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandHeadPressed: { opacity: 0.85 },
  expandTitle: {
    flex: 1,
    ...typography.body,
    ...aboutRtlText,
    fontWeight: '700',
    color: colors.textPrimary,
  },

  body: { marginTop: spacing.lg, gap: spacing.md },

  paragraph: {
    ...typography.body,
    color: colors.textPrimary,
    ...aboutRtlText,
    lineHeight: 28,
  },
  bold: { fontWeight: '800', color: colors.textPrimary },

  pullQuote: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  pullQuoteRule: {
    height: 1,
    width: 56,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  pullQuoteText: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  pullQuoteCap: {
    ...typography.caption,
    color: colors.textSecondary,
    ...aboutRtlText,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  journeyKicker: {
    ...typography.label,
    color: colors.secondary,
    ...aboutRtlText,
    fontWeight: '800',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  journeyStrip: {
    flexDirection: aboutRtlRow,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  journeyItem: {
    alignItems: 'center',
  },
  journeyImage: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
}));
