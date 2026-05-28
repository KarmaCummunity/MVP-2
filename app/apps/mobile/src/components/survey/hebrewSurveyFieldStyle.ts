import { Platform, type TextStyle } from 'react-native';
import { webTextRtl } from '../../lib/webRtlStyle';

/**
 * Hebrew survey TextInput alignment — physical `right` on every platform so
 * placeholders and typed text hug the visual right edge.
 */
export const SURVEY_TEXT_ALIGN = 'right' as const;

/** RTL-safe TextInput style for Hebrew survey fields (native + RN-web). */
export function hebrewSurveyFieldTextStyle(): TextStyle {
  return {
    textAlign: SURVEY_TEXT_ALIGN,
    writingDirection: 'rtl',
    ...webTextRtl,
    ...(Platform.OS !== 'web' ? { textAlignVertical: 'top' as const } : {}),
  };
}
