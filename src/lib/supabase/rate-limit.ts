interface RateLimitAttempt {
  timestamp: number;
}

// In-memory rate limiting store (persists during server lifetime)
const memoryStore = new Map<string, RateLimitAttempt[]>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterMinutes?: number;
}

export function checkRateLimit(email: string): RateLimitStatus {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  const attempts = memoryStore.get(normalizedEmail) || [];

  // Filter out attempts older than the window
  const recentAttempts = attempts.filter(
    (attempt) => now - attempt.timestamp < WINDOW_MS
  );
  memoryStore.set(normalizedEmail, recentAttempts);

  if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
    const oldestRecent = recentAttempts[0];
    const expiryTime = oldestRecent.timestamp + WINDOW_MS;
    const retryAfterMinutes = Math.max(1, Math.ceil((expiryTime - now) / (60 * 1000)));

    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMinutes,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_FAILED_ATTEMPTS - recentAttempts.length,
  };
}

export function recordFailedAttempt(email: string): RateLimitStatus {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();
  const attempts = memoryStore.get(normalizedEmail) || [];
  
  const recentAttempts = attempts.filter(
    (attempt) => now - attempt.timestamp < WINDOW_MS
  );
  
  recentAttempts.push({ timestamp: now });
  memoryStore.set(normalizedEmail, recentAttempts);

  return checkRateLimit(normalizedEmail);
}

export function recordSuccessfulAttempt(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  memoryStore.delete(normalizedEmail);
}
