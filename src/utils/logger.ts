/**
 * Structured logging for Smart XDebug MCP
 *
 * Outputs JSONL format for easy parsing and aggregation.
 * All logs go to stderr to avoid interfering with MCP stdio transport.
 *
 * @packageDocumentation
 * @module utils/logger
 *
 * Copyright 2026 Tyler Wall
 * SPDX-License-Identifier: Apache-2.0
 */

import { getConfig } from '../config.js';

/** Log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Numeric priority for log levels (higher = more severe) */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structure of a log entry
 */
interface LogEntry {
  /** ISO 8601 timestamp */
  ts: string;
  /** Log level */
  level: LogLevel;
  /** Component/module name */
  component: string;
  /** Operation being performed */
  op: string;
  /** Optional message */
  msg?: string;
  /** Operation duration in milliseconds */
  duration_ms?: number;
  /** Error information */
  err?: {
    class: string;
    msg: string;
    code?: string;
    stack?: string;
  };
  /** Additional context */
  [key: string]: unknown;
}

/**
 * Minimum log level to output (can be set via LOG_LEVEL env var)
 */
function getMinLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  if (level && level in LOG_LEVEL_PRIORITY) {
    return level as LogLevel;
  }
  return getConfig().debug ? 'debug' : 'info';
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  const minLevel = getMinLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

/**
 * Format an error for logging
 */
function formatErrorForLog(error: unknown): LogEntry['err'] {
  if (error instanceof Error) {
    return {
      class: error.constructor.name,
      msg: error.message,
      code: (error as Error & { code?: string }).code,
      stack: getConfig().debug ? error.stack : undefined,
    };
  }
  return {
    class: 'UnknownError',
    msg: String(error),
  };
}

/**
 * Structured logger instance
 */
class Logger {
  constructor(private readonly component: string) {}

  /**
   * Write a log entry to stderr
   */
  private log(
    level: LogLevel,
    op: string,
    data?: Record<string, unknown>
  ): void {
    if (!shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      component: this.component,
      op,
    };

    // Merge additional data, handling special fields
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'error' && value) {
          entry.err = formatErrorForLog(value);
        } else if (key === 'duration' && typeof value === 'number') {
          entry.duration_ms = value;
        } else if (value !== undefined) {
          entry[key] = value;
        }
      }
    }

    // Write to stderr as JSONL
    console.error(JSON.stringify(entry));
  }

  /**
   * Log debug information (only when DEBUG=true)
   */
  debug(op: string, data?: Record<string, unknown>): void {
    this.log('debug', op, data);
  }

  /**
   * Log informational message
   */
  info(op: string, data?: Record<string, unknown>): void {
    this.log('info', op, data);
  }

  /**
   * Log warning
   */
  warn(op: string, data?: Record<string, unknown>): void {
    this.log('warn', op, data);
  }

  /**
   * Log error
   */
  error(op: string, data?: Record<string, unknown>): void {
    this.log('error', op, data);
  }

  /**
   * Create a child logger with additional context
   */
  child(subComponent: string): Logger {
    return new Logger(`${this.component}:${subComponent}`);
  }

  /**
   * Time an async operation
   */
  async time<T>(
    op: string,
    fn: () => Promise<T>,
    data?: Record<string, unknown>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.info(op, { ...data, duration: Date.now() - start });
      return result;
    } catch (error) {
      this.error(op, { ...data, duration: Date.now() - start, error });
      throw error;
    }
  }
}

/**
 * Create a logger for a component
 *
 * @param component - Component name (e.g., 'session-manager', 'dbgp')
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('my-component');
 * logger.info('Starting operation', { sessionId: '123' });
 * logger.error('Operation failed', { error: new Error('oops') });
 * ```
 */
export function createLogger(component: string): Logger {
  return new Logger(component);
}

// Export the Logger class for typing
export { Logger };
