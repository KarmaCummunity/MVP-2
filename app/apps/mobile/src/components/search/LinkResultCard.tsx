// FR-FEED-017 — donation link result card for universal search.
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@kc/ui';
import type { DonationLinkSearchResult } from '@kc/domain';
import { openExternalUrl } from '../../utils/openExternalUrl';
import { styles } from './searchResultCard.styles';

export function LinkResultCard({ link }: { link: DonationLinkSearchResult }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => openExternalUrl(link.url)}
      accessibilityRole="link"
      accessibilityLabel={`${link.displayName} — ${link.categoryLabelHe}`}
    >
      <View style={styles.linkIconWrap}>
        <Ionicons name="link-outline" size={24} color={colors.secondary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{link.displayName}</Text>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{link.categoryLabelHe}</Text>
        </View>
        {link.description ? <Text style={styles.cardSubtitle} numberOfLines={2}>{link.description}</Text> : null}
        <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colors.textDisabled} />
    </Pressable>
  );
}
