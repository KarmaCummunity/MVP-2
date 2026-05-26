export function generateRideTitle(input: {
  originCityName: string;
  destCityName: string;
  departsAt: Date;
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const d = input.departsAt;
  const when = `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return `${input.originCityName} → ${input.destCityName} · ${when}`;
}
