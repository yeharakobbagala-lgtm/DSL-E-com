import { describe, it, expect } from 'vitest';
import { changePasswordSchema } from './dto/auth.dto';

describe('changePasswordSchema', () => {
  const validData = {
    currentPassword: 'CurrentPassword123!',
    newPassword: 'NewPassword123!',
    confirmNewPassword: 'NewPassword123!',
  };

  it('validates correct change password payload', () => {
    const result = changePasswordSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects empty currentPassword', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      currentPassword: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('currentPassword'))).toBe(true);
    }
  });

  it('rejects new password shorter than 8 characters', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: 'Sh1!',
      confirmNewPassword: 'Sh1!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('at least 8 characters'))).toBe(true);
    }
  });

  it('rejects new password without uppercase letter', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: 'nouppercase123!',
      confirmNewPassword: 'nouppercase123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('uppercase'))).toBe(true);
    }
  });

  it('rejects new password without lowercase letter', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: 'NOLOWERCASE123!',
      confirmNewPassword: 'NOLOWERCASE123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('lowercase'))).toBe(true);
    }
  });

  it('rejects new password without number', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      newPassword: 'NoNumbersHere!',
      confirmNewPassword: 'NoNumbersHere!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('number'))).toBe(true);
    }
  });

  it('rejects password confirmation mismatch', () => {
    const result = changePasswordSchema.safeParse({
      ...validData,
      confirmNewPassword: 'DifferentPassword123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('do not match'))).toBe(true);
    }
  });

  it('rejects new password identical to current password', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'SamePassword123!',
      newPassword: 'SamePassword123!',
      confirmNewPassword: 'SamePassword123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('cannot be the same'))).toBe(true);
    }
  });
});
