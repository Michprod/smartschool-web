/** Convertit une valeur API (souvent string décimale) en number ou null. */
export function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}
