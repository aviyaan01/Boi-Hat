/**
 * Normalizes Bangladesh phone numbers to E.164 format (+8801XXXXXXXXX)
 * Supports inputs like:
 * - 01712345678
 * - +8801712345678
 * - 8801712345678
 * - 01712-345678
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('01')) {
    return `+88${digits}`;
  } else if (digits.length === 13 && digits.startsWith('8801')) {
    return `+${digits}`;
  } else if (digits.length === 10 && digits.startsWith('1')) {
    return `+880${digits}`;
  }

  // If already full international length
  if (rawPhone.startsWith('+') && digits.length >= 11) {
    return `+${digits}`;
  }

  return `+88${digits}`;
}

export function isValidBdPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // BD mobile pattern: +8801[3-9]XXXXXXXX (11 digits after +88)
  const regex = /^\+8801[3-9]\d{8}$/;
  return regex.test(normalized);
}
