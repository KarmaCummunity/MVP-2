/** Client-side gate matching `CompleteBasicInfoUseCase` optional street/number rules. */
const STREET_NUM_RE = /^\d+[A-Za-z]?$/;

export type ProfileAddressPairIssue =
  | 'incomplete_profile_address'
  | 'invalid_profile_street'
  | 'invalid_profile_street_number';

export function getProfileAddressPairIssue(
  streetRaw: string,
  numberRaw: string,
): ProfileAddressPairIssue | null {
  const st = streetRaw.trim();
  const num = numberRaw.trim();
  if (st.length === 0 && num.length === 0) return null;
  if (st.length > 0 !== num.length > 0) return 'incomplete_profile_address';
  if (st.length < 1 || st.length > 80) return 'invalid_profile_street';
  if (!STREET_NUM_RE.test(num)) return 'invalid_profile_street_number';
  return null;
}

export function isProfileAddressPairValid(street: string, number: string): boolean {
  return getProfileAddressPairIssue(street, number) === null;
}
