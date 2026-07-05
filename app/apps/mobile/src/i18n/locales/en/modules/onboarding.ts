// Onboarding screens — FR-AUTH-010..012, FR-AUTH-018. Consumed by
// `(onboarding)/about-intro`, `basic-info`, `photo`, `tour`, plus the shared
// `OnboardingStepHeader` and the basic-info / photo flow hooks.
// Extracted from the root `index.ts` during the PR5a i18n sweep to keep the
// composition file under the 200-LOC architecture cap.
export const onboardingEn = {
  aboutIntroTitle: 'Welcome to Karma',
  aboutIntroBody:
    'Connecting those who want to give with those who need to receive. Simple, friendly, and completely free.',
  aboutIntroCta: 'Get started',
  pillarFree: 'Completely free',
  pillarNoAds: 'No ads',
  pillarNonProfit: 'Non-profit',
  stepBasic: 'Basic details',
  basicInfoSubtitle:
    ' Confirm your name and fill in your address — so we can match posts to you. You can also complete this later.',
  displayName: 'Full name',
  city: 'City of residence',
  contactPhoneLabel: 'Contact phone (optional)',
  contactPhonePlaceholder: 'For example: 050-1234567',
  stepPhoto: 'Profile photo',
  uploadPhoto: 'Upload photo',
  skip: 'Skip',
  continue: 'Continue',
  stepWelcome: 'Welcome to the community!',
  welcomeDesc: 'Here you can give and receive items completely free — no money, no trade.',
  howItWorks: 'How does it work?',
  step1Title: 'Post what you have to give',
  step1Desc: 'A photo plus a few words — and that is it.',
  step2Title: 'Ask for what you need',
  step2Desc: 'Post a request and someone in the community will respond.',
  step3Title: 'Coordinate handoff',
  step3Desc: 'Chat directly with the giver/receiver.',
  letsGo: "Let's get started!",
  stepProgress: 'Step {{step}} of 4',
  noActiveSession: 'No active session. Please sign in again.',
  fillNameAndCity: 'Please enter a name and city',
  saveFailed: 'Save failed',
  uploadFailed: 'Photo upload failed',
  uploadFailedBody: 'You can skip and add a photo later.',
  removeFailed: 'Removing the photo failed',
  softGateTitle: "Let's complete your basic details",
  fullNamePlaceholder: 'For example: Rina Cohen',
  unknownError: 'Unknown error',
  saveAndContinue: 'Save and continue',
  // PR5a — UI sweep additions for (onboarding)/* screens.
  aboutIntroFinePrint:
    'Want to read more about the vision, how it works, and how to reach us? After signing up you will find all the details under "Settings" ← "About".',
  continueA11y: 'Continue',
  photoReplaceA11y: 'Replace profile photo',
  photoAddA11y: 'Add profile photo',
  photoReplaceCta: 'Replace photo',
  photoChooseCta: 'Choose photo',
  photoSubtitle: 'A familiar face helps build trust in the community.',
  photoContinueWithCta: 'Continue with photo',
  photoContinueWithoutCta: 'Continue without photo',
  photoHint: 'You can replace the photo later in your profile.',
  tourGiveAndAskTitle: 'Give and ask',
  tourGiveAndAskBody:
    'Post items you want to give or ask for things you need — you can always search too, all within the community.',
  tourChatTitle: 'Coordinate in chat',
  tourChatBody:
    'Start a conversation quickly straight from the post, coordinate pickup easily, and strengthen the community!',
  tourMarkDeliveredTitle: 'Mark as delivered',
  tourMarkDeliveredBody:
    'Once the item has changed hands — mark the post as closed. That way we all see the community in motion.',
  tourLetsStartCta: "Let's begin",
  tourNextCta: 'Next',
} as const;
