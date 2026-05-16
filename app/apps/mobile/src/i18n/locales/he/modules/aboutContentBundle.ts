import { aboutContentCopyA } from './aboutContentCopyA';
import { aboutContentCopyB } from './aboutContentCopyB';
import { aboutContentCopyC } from './aboutContentCopyC';
import { aboutContentNavFaq } from './aboutContentNavFaq';
import { aboutContentUxRefreshPartA } from './aboutContentUxRefreshPartA';
import { aboutContentUxRefreshPartB } from './aboutContentUxRefreshPartB';

/** Full About landing strings (Hebrew). */
export const aboutContentMerged = {
  ...aboutContentCopyA,
  ...aboutContentCopyB,
  ...aboutContentCopyC,
  ...aboutContentNavFaq,
  ...aboutContentUxRefreshPartA,
  ...aboutContentUxRefreshPartB,
} as const;
