import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('aboutContent.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Hero Section */}
        <View style={styles.heroGradient}>
          <Ionicons name="leaf" size={60} color={colors.surface} style={styles.heroIcon} />
          <Text style={styles.heroTitle}>{t('settings.version')}</Text>
          <Text style={styles.heroTagline}>{t('aboutContent.tagline')}</Text>
        </View>

        {/* Content Sections */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{t('aboutContent.visionTitle')}</Text>
            </View>
            <Text style={styles.cardText}>{t('aboutContent.visionText')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sync-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{t('aboutContent.howItWorksTitle')}</Text>
            </View>
            <Text style={styles.cardText}>{t('aboutContent.howItWorksText')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail-outline" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>{t('aboutContent.contactTitle')}</Text>
            </View>
            <Text style={styles.cardText}>{t('aboutContent.contactText')}</Text>
            
            <TouchableOpacity 
              style={styles.contactBtn}
              onPress={() => router.push('/settings/report-issue')}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={colors.textInverse} />
              <Text style={styles.contactBtnText}>יצירת קשר עם התמיכה</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerVersion}>גרסה 0.1.0</Text>
          <Text style={styles.footerRights}>© 2026 כל הזכויות שמורות לקארמה קהילה</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { paddingBottom: spacing['4xl'] },
  heroGradient: {
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    marginBottom: spacing.xl,
  },
  heroIcon: {
    marginBottom: spacing.base,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.surface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heroTagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  cardsContainer: {
    paddingHorizontal: spacing.base,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  cardText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    lineHeight: 24,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  contactBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing.lg,
  },
  footerVersion: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  footerRights: {
    ...typography.caption,
    color: colors.textDisabled,
  },
});
