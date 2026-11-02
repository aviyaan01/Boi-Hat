import { normalizePhone, isValidBdPhone } from './phone.utils';

describe('Phone Number Normalization & Validation', () => {
  it('should normalize local 11-digit numbers to E.164 (+8801XXXXXXXXX)', () => {
    expect(normalizePhone('01712345678')).toBe('+8801712345678');
    expect(normalizePhone('01987654321')).toBe('+8801987654321');
  });

  it('should handle numbers with dashes, spaces, and country code', () => {
    expect(normalizePhone('01712-345678')).toBe('+8801712345678');
    expect(normalizePhone('+8801712345678')).toBe('+8801712345678');
    expect(normalizePhone('8801712345678')).toBe('+8801712345678');
  });

  it('should accurately validate Bangladeshi mobile numbers', () => {
    expect(isValidBdPhone('01712345678')).toBe(true);
    expect(isValidBdPhone('01312345678')).toBe(true);
    expect(isValidBdPhone('01812345678')).toBe(true);
    expect(isValidBdPhone('01912345678')).toBe(true);
    expect(isValidBdPhone('01412345678')).toBe(true);
    expect(isValidBdPhone('01512345678')).toBe(true);
    expect(isValidBdPhone('01612345678')).toBe(true);

    // Invalid numbers
    expect(isValidBdPhone('01212345678')).toBe(false); // 012 doesn't exist
    expect(isValidBdPhone('0171234567')).toBe(false); // too short
    expect(isValidBdPhone('017123456789')).toBe(false); // too long
    expect(isValidBdPhone('')).toBe(false);
  });
});
