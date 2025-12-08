/**
 * Centralized logging utility that respects environment settings.
 * Follows SRP and provides a clean abstraction for all logging needs.
 *
 * ALL LOGS ARE SUPPRESSED IN PRODUCTION for security and performance.
 */

type LogLevel = "info" | "warn" | "error";

class Logger {
  private isDevMode: boolean;

  constructor() {
    this.isDevMode = __DEV__;
  }

  /**
   * Logs informational messages (only in development)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.isDevMode) {
      console.info(message, ...args);
    }
  }

  /**
   * Logs warning messages (only in development)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.isDevMode) {
      console.warn(message, ...args);
    }
  }

  /**
   * Logs error messages (only in development)
   * Note: In production, errors should be sent to a crash reporting service
   * (e.g., Sentry, Firebase Crashlytics) instead of console logging.
   */
  error(message: string, ...args: unknown[]): void {
    if (this.isDevMode) {
      console.error(message, ...args);
    }
  }

  /**
   * Generic log method with level specification (only in development)
   */
  log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!this.isDevMode) return;

    switch (level) {
      case "info":
        this.info(message, ...args);
        break;
      case "warn":
        this.warn(message, ...args);
        break;
      case "error":
        this.error(message, ...args);
        break;
    }
  }
}

export const logger = new Logger();
