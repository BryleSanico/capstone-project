import {
  isEmail,
  isRequired,
  minLength,
  passwordsMatch,
  validateFileType,
  validateFileSize,
  hasBase64Data,
} from '../../../src/utils/validations/validation';

describe('utils/validations/validation', () => {
  describe('isEmail', () => {
    it('should return true for a valid email', () => {
      expect(isEmail('test@example.com')).toBe(true);
    });
    it('should return false for invalid emails', () => {
      expect(isEmail('test.com')).toBe(false);
      expect(isEmail('test@example')).toBe(false);
      expect(isEmail('@example.com')).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('should return true for a string with content', () => {
      expect(isRequired(' text ')).toBe(true);
    });
    it('should return false for empty or whitespace-only strings', () => {
      expect(isRequired(' ')).toBe(false);
      expect(isRequired('')).toBe(false);
    });
    it('should return false for null or undefined', () => {
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return true for strings meeting or exceeding length', () => {
      expect(minLength('123456', 6)).toBe(true);
      expect(minLength('1234567', 6)).toBe(true);
    });
    it('should return false for strings shorter than length', () => {
      expect(minLength('12345', 6)).toBe(false);
    });
  });

  describe('passwordsMatch', () => {
    it('should return true for matching passwords', () => {
      expect(passwordsMatch('password123', 'password123')).toBe(true);
    });
    it('should return false for non-matching (case-sensitive) passwords', () => {
      expect(passwordsMatch('password123', 'Password123')).toBe(false);
    });
  });

  describe('validateFileType', () => {
    const allowed = ['image/jpeg', 'image/png'];
    it('should return true for an allowed type', () => {
      expect(validateFileType('image/jpeg', allowed)).toBe(true);
    });
    it('should return false for a disallowed type', () => {
      expect(validateFileType('image/gif', allowed)).toBe(false);
    });
    it('should return false for null or undefined type', () => {
      expect(validateFileType(null, allowed)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    const maxSizeMB = 2;
    const twoMB = 2 * 1024 * 1024;
    it('should return true for a file under the max size', () => {
      expect(validateFileSize(1.9 * 1024 * 1024, maxSizeMB)).toBe(true);
      expect(validateFileSize(twoMB, maxSizeMB)).toBe(true);
    });
    it('should return false for a file over the max size', () => {
      expect(validateFileSize(2.1 * 1024 * 1024, maxSizeMB)).toBe(false);
    });
  });

  describe('hasBase64Data', () => {
    it('should return true for a valid base64 string', () => {
      expect(hasBase64Data('iVBOR...')).toBe(true);
    });
    it('should return false for an empty string, null, or undefined', () => {
      expect(hasBase64Data('')).toBe(false);
      expect(hasBase64Data(null)).toBe(false);
      expect(hasBase64Data(undefined)).toBe(false);
    });
  });
});