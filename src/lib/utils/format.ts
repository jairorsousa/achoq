/** Format a number as Brazilian phone: (XX) XXXXX-XXXX */
export function formatPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Strip all non-digits and add +55 */
export function toE164BR(formatted: string): string {
  const digits = formatted.replace(/\D/g, "");
  return `+55${digits}`;
}

/** Format Q$ amount */
export function formatCoins(amount: number): string {
  return amount.toLocaleString("pt-BR");
}

/** Format as compact: 1.2k, 15k, 1.2M */
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Time remaining until a date string (ISO) */
export function timeRemaining(closesAt: string): string {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 1) return `${days}d restantes`;
  if (days === 1) return `${days}d ${hours}h restantes`;
  if (hours > 0) return `${hours}h ${mins}m restantes`;
  return `${mins}m restantes`;
}

/** Return potential multiplier given total pot and one side */
export function calcMultiplier(myPot: number, totalPot: number): string {
  if (!myPot || !totalPot) return "?x";
  const multiplier = (totalPot * 0.95) / myPot;
  return `${multiplier.toFixed(2)}x`;
}
