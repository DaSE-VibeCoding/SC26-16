import { User } from "./types";

export function sharedInterests(a: User, b: User) { return b.interests.filter((x) => a.interests.includes(x)); }
export function matchScore(a: User, b: User) {
  const shared = sharedInterests(a, b).length;
  const basis = Math.min(a.interests.length, b.interests.length);
  if (!basis) return 40;
  return Math.min(98, 40 + Math.round((shared / basis) * 60));
}
export function isOnline(userId: string) {
  let sum = 0;
  for (const ch of userId) sum += ch.charCodeAt(0);
  return sum % 3 !== 0;
}
