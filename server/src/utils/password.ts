import crypto from "crypto";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SPECIAL = "!@#$%^&*";
const ALL_CHARS = LOWERCASE + UPPERCASE + NUMBERS + SPECIAL;

function secureRandom(max: number): number {
  const bytes = crypto.randomBytes(4);
  const value = bytes.readUInt32BE(0);
  return value % max;
}

export function generatePassword(length = 12): string {
  const password: string[] = [];

  // Ensure at least one of each category
  password.push(LOWERCASE[secureRandom(LOWERCASE.length)]);
  password.push(UPPERCASE[secureRandom(UPPERCASE.length)]);
  password.push(NUMBERS[secureRandom(NUMBERS.length)]);
  password.push(SPECIAL[secureRandom(SPECIAL.length)]);

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password.push(ALL_CHARS[secureRandom(ALL_CHARS.length)]);
  }

  // Shuffle the password
  for (let i = password.length - 1; i > 0; i--) {
    const j = secureRandom(i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
}

export function generateEmail(fullName: string): string {
  const normalized = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, ".");

  return `${normalized}@company.com`;
}
