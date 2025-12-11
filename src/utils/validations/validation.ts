/**
 * A set of pure, reusable functions for validating user input in forms.
 */

/**
 * Validates if a string is a reasonably-formatted email address.
 * @param value The email string to validate.
 */
export function isEmail(value: string): boolean {
  // A simple regex for client-side email validation.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Checks if a value is not null, undefined, or an empty string.
 * @param value The value to check.
 */
export function isRequired(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim() !== "";
}

/**
 * Checks if a string meets a minimum length requirement.
 * @param value The string to check.
 * @param length The minimum required length.
 */
export function minLength(value: string, length: number): boolean {
  return value.length >= length;
}

/**
 * Validates that two password strings match.
 * @param password The first password.
 * @param confirm The second (confirmation) password.
 */
export function passwordsMatch(password: string, confirm: string): boolean {
  return password === confirm;
}

/**
 * Validates an image asset's file type.
 * @param fileType The asset's MIME type (e.g., 'image/jpeg').
 * @param allowedTypes An array of allowed MIME types.
 * @returns True if the type is allowed, false otherwise.
 */
export function validateFileType(
  fileType: string | undefined | null,
  allowedTypes: string[]
): boolean {
  if (!fileType) return false;
  return allowedTypes.includes(fileType.toLowerCase());
}

/**
 * Validates an image asset's file size.
 * @param fileSize The asset's size in bytes.
 * @param maxSizeMB The maximum allowed size in megabytes.
 * @returns True if the size is within the limit, false otherwise.
 */
export function validateFileSize(
  fileSize: number | undefined | null,
  maxSizeMB: number
): boolean {
  if (!fileSize) return false; // If size is unknown, fail validation
  return fileSize / 1024 / 1024 <= maxSizeMB;
}

/**
 * Checks if the image asset contains base64 data.
 * @param base64 The base64 string from the asset.
 * @returns True if the base64 string is present and non-empty.
 */
export const hasBase64Data = (base64: string | undefined): boolean => {
  return base64 !== undefined && base64 !== null && base64.length > 0;
};
