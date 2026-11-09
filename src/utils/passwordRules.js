// Mirrors validator.isStrongPassword's default rules (used by both the
// backend's validators.js and the Mongoose schema): 8+ chars, 1+ lowercase,
// 1+ uppercase, 1+ number, 1+ symbol. Shared between the signup form and
// the change-password section so both stay in sync with the backend.
export const passwordRules = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /[0-9]/.test(v) },
  { label: "One symbol (e.g. !@#$%)", test: (v) => /[^A-Za-z0-9]/.test(v) },
];
