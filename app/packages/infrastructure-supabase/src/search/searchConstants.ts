import type { DonationCategorySlug } from '@kc/domain';
export const CATEGORY_HE_TO_SLUG: Record<string, DonationCategorySlug> = {
  'זמן': 'time', 'כסף': 'money', 'אוכל': 'food', 'דיור': 'housing',
  'תחבורה': 'transport', 'ידע': 'knowledge', 'חיות': 'animals', 'רפואה': 'medical',
};
export const SLUG_TO_LABEL_HE: Record<string, string> = {
  time: 'זמן', money: 'כסף', food: 'אוכל', housing: 'דיור',
  transport: 'תחבורה', knowledge: 'ידע', animals: 'חיות', medical: 'רפואה',
};
