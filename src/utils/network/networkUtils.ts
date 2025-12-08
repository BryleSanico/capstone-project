import { useNetworkStatus } from "../../stores/network-store";
import { logger } from "../system/logger";

// Constants
const DEFAULT_REQUEST_TIMEOUT = 8000; // 8 seconds per attempt
const DEFAULT_RETRY_ATTEMPTS = 3; // Total 3 attempts (1 initial + 2 retry)
const RETRY_DELAY = 2000; // 1 second delay between retries

// Custom Error for Timeouts
class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * A simple promise-based delay.
 * @param ms Time to wait in milliseconds.
 */
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a promise-like object (a "then-able") in a timeout.
 * Rejects with a TimeoutError if it doesn't settle in time.
 *
 * @param promise The promise-like object to wrap (like a Supabase query).
 * @param ms Milliseconds to wait before timing out.
 */
const withTimeout = <T>(
  promise: PromiseLike<T>, // Use PromiseLike<T> since supabase returns then-ables
  ms: number
): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new TimeoutError(`Request timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([Promise.resolve(promise), timeout]); // Wrap in Promise.resolve to be safe
};

/**
 * Wraps an async function with retry and timeout logic.
 *
 * @param asyncFn A function that returns a Promise-like object (e.g., () => supabase.rpc('...'))
 * @param options
 * @param options.attempts Max number of attempts.
 * @param options.delay Delay between attempts.
 * @param options.timeoutPerAttempt Timeout for *each* attempt.
 * @param options.errorMessage The message to show in the snackbar on final failure.
 */
export const withRetry = async <T>(
  asyncFn: () => PromiseLike<T>,
  options?: {
    attempts?: number;
    delay?: number;
    timeoutPerAttempt?: number;
    errorMessage?: string;
  }
): Promise<T> => {
  const attempts = options?.attempts ?? DEFAULT_RETRY_ATTEMPTS;
  const delayMs = options?.delay ?? RETRY_DELAY;
  const timeoutMs = options?.timeoutPerAttempt ?? DEFAULT_REQUEST_TIMEOUT;
  const errorMessage =
    options?.errorMessage ?? "Slow internet connection... Something went wrong";

  let lastError: Error | unknown = new Error("Request failed");

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      logger.info(`[withRetry] Attempt ${attempt}/${attempts}...`);
      // Wrap the function call (which returns a then-able) in a timeout
      const result = await withTimeout(asyncFn(), timeoutMs);
      return result; // Success
    } catch (error) {
      logger.warn(`[withRetry] Attempt ${attempt} failed:`, error);
      lastError = error;

      // If it's a timeout error on the first attempt, show snackbar early
      if (error instanceof TimeoutError && attempt === 1) {
        useNetworkStatus.getState().setMessage(errorMessage);
      }

      // Don't wait if it's the last attempt
      if (attempt < attempts) {
        await wait(delayMs);
      }
    }
  }

  // All attempts failed
  logger.error("[withRetry] All attempts failed.", lastError);
  // Show snackbar on final failure (if it wasn't shown already)
  if (!(lastError instanceof TimeoutError)) {
    useNetworkStatus.getState().setMessage(errorMessage);
  }

  // Re-throw the last error to be caught by the service/store
  throw lastError;
};
