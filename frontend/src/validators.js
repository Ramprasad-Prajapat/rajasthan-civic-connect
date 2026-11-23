/**
 * Shared validation utilities for RajCivic Connect.
 * Enforces strict 10-digit numeric mobile/phone rules across all forms.
 */

/**
 * Normalizes a mobile/phone number:
 * - Strips +91 prefix (or 91 country code when total digits is 12)
 * - Strips leading 0 (trunk code when total digits is 11)
 * - Strips non-digit characters
 * - CRITICAL: Does NOT slice or silently truncate invalid excess digits!
 *   If user pastes 11 digits (e.g. 98765432101), all 11 digits are retained so
 *   the UI displays "Mobile number cannot exceed 10 digits" instead of silently truncating.
 */
export function normalizeMobile(value) {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (!str) return '';

  // Extract all digits
  let digits = str.replace(/\D/g, '');

  // Strip +91 prefix or 91 country code if length is 12
  if (str.startsWith('+91')) {
    digits = digits.startsWith('91') ? digits.slice(2) : digits;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    // Strip leading trunk 0 (e.g. 09876543210 -> 9876543210)
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Backward compatibility alias for existing code.
 */
export const onlyDigits = normalizeMobile;

/**
 * Validates whether a mobile number is exactly 10 digits.
 * If not required, empty string is considered valid.
 */
export function isValidMobile(value, required = false) {
  const digits = normalizeMobile(value);
  if (!digits) {
    return !required;
  }
  return digits.length === 10 && /^\d{10}$/.test(digits);
}

/**
 * Returns an inline error message for a mobile input field.
 */
export function getMobileError(value, required = false, touched = false) {
  const raw = value !== null && value !== undefined ? String(value) : '';
  const digits = normalizeMobile(raw);

  if (!digits) {
    if (required && touched) {
      return 'Mobile number is required';
    }
    return '';
  }

  if (digits.length > 10) {
    return 'Mobile number cannot exceed 10 digits';
  }

  if (digits.length < 10) {
    return 'Enter a valid 10-digit mobile number';
  }

  return '';
}

/**
 * Shared keyboard event handler for 10-digit mobile inputs.
 * Blocks non-digit keys and prevents typing beyond 10 digits.
 */
export function handleMobileKeyDown(e) {
  // Allow navigation and editing control keys
  if (
    [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'Enter',
      'Home',
      'End'
    ].includes(e.key) ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  ) {
    return;
  }

  // Reject non-digit characters (letters, symbols, whitespace)
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
    return;
  }

  // Prevent typing 11th digit if already at 10 or more digits (unless text is selected for replacement)
  const target = e.target;
  const hasSelection = target && target.selectionStart !== target.selectionEnd;
  const currentDigits = (target.value || '').replace(/\D/g, '');
  if (!hasSelection && currentDigits.length >= 10) {
    e.preventDefault();
  }
}
