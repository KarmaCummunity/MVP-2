import type { AuthErrorCode } from '@kc/application';

export function mapAuthErrorToHebrew(code: AuthErrorCode): string {
  switch (code) {
    case 'invalid_credentials':
      return 'דוא"ל או סיסמה שגויים.';
    case 'email_already_in_use':
      return 'הדוא"ל הזה כבר רשום. נסה להתחבר או לאפס סיסמה.';
    case 'weak_password':
      return 'הסיסמה חלשה מדי. צריך לפחות 8 תווים, אות וספרה.';
    case 'invalid_email':
      return 'הדוא"ל אינו תקין.';
    case 'email_not_verified':
      return 'יש לאשר את הדוא"ל לפני הכניסה. בדוק את תיבת הדואר.';
    case 'session_expired':
      return 'פג תוקף הסשן. יש להתחבר מחדש.';
    case 'rate_limited':
      return 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.';
    case 'cooldown_active':
      return 'החשבון בתקופת המתנה לאחר מחיקה.';
    case 'network':
      return 'שגיאת רשת. בדוק את החיבור לאינטרנט.';
    case 'unknown':
    default:
      return 'אירעה שגיאה. נסה שוב.';
  }
}
