export function formatPrice(value: number | null | undefined): string {
  const numeric = Number(value ?? 0);
  return `₱${numeric.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  })}`;
}

export default formatPrice;
