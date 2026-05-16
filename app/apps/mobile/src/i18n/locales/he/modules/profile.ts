// FR-PROFILE / FR-FOLLOW strings extracted from the main bundle to keep
// `index.ts` under the 200-LOC cap as the profile surface grows (TD-156).
export const profileHe = {
  myProfile: 'הפרופיל שלי',
  editProfile: 'ערוך פרופיל',
  shareProfile: 'שתף פרופיל',
  followers: 'עוקבים',
  following: 'נעקבים',
  activePosts: 'פוסטים פעילים',
  closedPosts: 'פוסטים שנמסרו',
  follow: 'עקוב',
  following_btn: 'מעקב פעיל ✓',
  requestSent: 'בקשה נשלחה ⏳',
  sendMessage: 'שלח הודעה',
  privateProfile: '🔒 הפרופיל פרטי. שלח בקשת עקיבה כדי לראות פוסטים.',

  // Follow button states + confirm dialogs (FR-FOLLOW-011)
  followCta: '+ עקוב',
  followingActive: 'עוקב ✓',
  followRequestCta: '+ שלח בקשה',
  unfollowConfirmTitle: 'להפסיק לעקוב?',
  unfollowConfirmCta: 'הפסק לעקוב',
  cancelRequestTitle: 'לבטל את בקשת המעקב?',
  cancelRequestBody: 'תוכלי לשלוח בקשה חדשה בכל עת.',
  cancelRequestCta: 'בטל בקשה',
  cooldownRetryDays: 'ניתן לשלוח שוב בעוד {{days}} ימים',
  followUnavailable: 'המשתמש לא זמין למעקב כרגע',

  // Header / framing
  privateProfileA11y: 'פרופיל פרטי',
  headerTitle: 'פרופיל',
  fallbackName: 'משתמש',
  userNotFound: 'משתמש לא נמצא',

  // Tabs
  tabOpen: 'פוסטים פתוחים',
  tabClosed: 'פוסטים סגורים',
  tabRemoved: 'הוסרו',

  // Stats row
  statsPostsLabel: 'פוסטים',

  // Empty states
  emptyOpenTitle: 'אין פוסטים פתוחים',
  emptyClosedTitle: 'אין פוסטים סגורים',
  emptyClosedTitleSelf: 'אין פוסטים סגורים עדיין',
  emptySelfOpenSubtitle: 'פרסם את הפוסט הראשון שלך!',
  emptySelfClosedSubtitle: 'פוסטים שסגרת או שקיבלת יופיעו כאן.',
  emptySelfClosedSubtitleLegacy: 'פוסטים שסגרת כ-נמסר יופיעו כאן.',
  emptyOtherOpenSubtitle: 'משתמש זה עוד לא פרסם פוסטים.',
  emptyOtherClosedSubtitle: 'משתמש זה עוד לא סגר ולא קיבל פוסט.',
  emptyOtherClosedSubtitleLegacy: 'משתמש זה עוד לא סיים מסירה.',
  followCooldownTitle: 'לא ניתן לשלוח כרגע',
  followCooldownDays: 'ניתן לשלוח שוב בעוד {{count}} ימים.',
  followErrorTitle: 'שגיאה',
  followErrorMessage: 'הפעולה נכשלה. נסו שוב.',
  addressLabel: 'כתובת',
  streetPlaceholder: 'רחוב',
  streetNumberPlaceholder: 'מס׳',
  avatarChangeA11y: 'החלפת תמונת פרופיל',
  avatarAddA11y: 'הוספת תמונת פרופיל',
  avatarDefaultName: 'משתמש',
  changePhotoHint: 'החלף תמונה',
  addPhotoHint: 'הוסף תמונה',
  photoSheetTitle: 'תמונת פרופיל',
  takePicture: '📷  צלם תמונה',
  takePictureA11y: 'צילום במצלמה',
  chooseFromGallery: '🖼️  בחר מהגלריה',
  chooseFromGalleryA11y: 'בחירה מהגלריה',
  removePhotoBtn: '🗑️  הסר תמונה',
  removePhotoA11y: 'הסרת התמונה הנוכחית',
  softGateTitle: 'נשלים פרטים בסיסיים',
  saveAndContinue: 'שמור והמשך',
} as const;
