export function formatRideAddress(
  cityName: string,
  street: string,
  streetNumber: string | null,
): string {
  const streetLine = streetNumber?.trim() ? `${street} ${streetNumber.trim()}` : street;
  return `${cityName}, ${streetLine}`;
}
