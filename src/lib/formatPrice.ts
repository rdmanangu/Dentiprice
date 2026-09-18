export function formatPrice(value: number | null | undefined): string {
  const numeric = Number(value ?? 0);
  return `₱${(isFinite(numeric) ? numeric : 0).toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default formatPrice;
