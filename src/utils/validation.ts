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
  return value != null && value.trim() !== '';
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
