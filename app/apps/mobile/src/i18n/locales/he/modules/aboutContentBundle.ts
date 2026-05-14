import { aboutContentCopyA } from './aboutContentCopyA';
import { aboutContentCopyB } from './aboutContentCopyB';
import { aboutContentCopyC } from './aboutContentCopyC';
import { aboutContentNavFaq } from './aboutContentNavFaq';

/** Full About landing strings (Hebrew). */
export const aboutContentMerged = {
  ...aboutContentCopyA,
  ...aboutContentCopyB,
  ...aboutContentCopyC,
  ...aboutContentNavFaq,
} as const;
