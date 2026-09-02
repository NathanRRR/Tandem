// Anti-bruteforce en mémoire process (même pattern que les apps sœurs movies/journal/candidatures
// sur ce VPS) : 5 échecs en 5 min -> verrou 12h. Suffisant pour un déploiement mono-instance ;
// se réinitialise au redémarrage du conteneur.
const MAX_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_DURATION_MS = 12 * 60 * 60 * 1000;

interface ThrottleEntry {
  failedAttempts: number[];
  lockedUntil: number | null;
}

const attemptsByKey = new Map<string, ThrottleEntry>();

export function isLoginLocked(key: string): boolean {
  const entry = attemptsByKey.get(key);
  if (!entry?.lockedUntil) return false;

  if (Date.now() >= entry.lockedUntil) {
    attemptsByKey.delete(key);
    return false;
  }
  return true;
}

export function recordFailedLogin(key: string): void {
  const now = Date.now();
  const entry = attemptsByKey.get(key) ?? { failedAttempts: [], lockedUntil: null };

  entry.failedAttempts = entry.failedAttempts.filter((t) => now - t < FAILED_ATTEMPT_WINDOW_MS);
  entry.failedAttempts.push(now);

  if (entry.failedAttempts.length >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  attemptsByKey.set(key, entry);
}

export function clearLoginAttempts(key: string): void {
  attemptsByKey.delete(key);
}
