/**
 * Custom error types for Smart XDebug MCP
 *
 * @packageDocumentation
 * @module errors
 *
 * Copyright 2026 Tyler Wall
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base error class for all XDebug MCP errors
 */
export class XDebugMcpError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;

  constructor(message: string, code: string, recoverable = false) {
    super(message);
    this.name = 'XDebugMcpError';
    this.code = code;
    this.recoverable = recoverable;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
    };
  }
}

/**
 * Session-related errors
 */
export class SessionError extends XDebugMcpError {
  constructor(message: string, code: string, recoverable = false) {
    super(message, code, recoverable);
    this.name = 'SessionError';
  }
}

/**
 * No active debug session
 */
export class NoActiveSessionError extends SessionError {
  constructor() {
    super(
      'No debug session active. Call start_debug_session first.',
      'NO_ACTIVE_SESSION',
      true
    );
  }
}

/**
 * Session already exists
 */
export class SessionAlreadyActiveError extends SessionError {
  constructor() {
    super(
      'A debug session is already active. Stop it first with control_execution({action: "stop"}).',
      'SESSION_ALREADY_ACTIVE',
      true
    );
  }
}

/**
 * Session is not paused (cannot inspect variables)
 */
export class SessionNotPausedError extends SessionError {
  constructor() {
    super(
      'Debugger must be paused to inspect variables. Set breakpoints and wait for execution to pause.',
      'SESSION_NOT_PAUSED',
      true
    );
  }
}

/**
 * Session has stopped
 */
export class SessionStoppedError extends SessionError {
  constructor() {
    super(
      'Debug session has stopped. Start a new session with start_debug_session.',
      'SESSION_STOPPED',
      true
    );
  }
}

/**
 * Connection-related errors
 */
export class ConnectionError extends XDebugMcpError {
  constructor(message: string, code: string, recoverable = false) {
    super(message, code, recoverable);
    this.name = 'ConnectionError';
  }
}

/**
 * Connection timeout
 */
export class ConnectionTimeoutError extends ConnectionError {
  constructor(timeout: number) {
    super(
      `Timeout waiting for XDebug connection after ${timeout / 1000}s. ` +
      'Ensure XDebug is configured with the correct host/port and the trigger command initiates a debug session.',
      'CONNECTION_TIMEOUT',
      true
    );
  }
}

/**
 * No available ports
 */
export class NoAvailablePortError extends ConnectionError {
  constructor(startPort: number, endPort: number) {
    super(
      `No available ports in range ${startPort}-${endPort}. ` +
      'Close other debug sessions or configure a different port range.',
      'NO_AVAILABLE_PORT',
      true
    );
  }
}

/**
 * Not connected to XDebug
 */
export class NotConnectedError extends ConnectionError {
  constructor() {
    super(
      'Not connected to XDebug. The debug session may have ended or the connection was lost.',
      'NOT_CONNECTED',
      true
    );
  }
}

/**
 * DBGp protocol errors
 */
export class DbgpError extends XDebugMcpError {
  public readonly dbgpCode: string;

  constructor(message: string, dbgpCode: string) {
    super(message, 'DBGP_ERROR', false);
    this.name = 'DbgpError';
    this.dbgpCode = dbgpCode;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      dbgpCode: this.dbgpCode,
    };
  }
}

/**
 * Variable not found
 */
export class VariableNotFoundError extends XDebugMcpError {
  public readonly variableName: string;

  constructor(variableName: string) {
    super(
      `Variable '${variableName}' not found in current scope. ` +
      "Check the variable name. Use '$this' for object context, '$_REQUEST' for request data.",
      'VARIABLE_NOT_FOUND',
      true
    );
    this.name = 'VariableNotFoundError';
    this.variableName = variableName;
  }
}

/**
 * Invalid JSONPath filter
 */
export class InvalidFilterError extends XDebugMcpError {
  public readonly filter: string;
  public readonly availableKeys: string[];

  constructor(filter: string, availableKeys: string[]) {
    const hint = availableKeys.length > 0
      ? ` Try: ${availableKeys.slice(0, 5).map(k => `'$.${k}'`).join(', ')}`
      : '';
    super(
      `Invalid JSONPath filter: '${filter}'.${hint}`,
      'INVALID_FILTER',
      true
    );
    this.name = 'InvalidFilterError';
    this.filter = filter;
    this.availableKeys = availableKeys;
  }
}

/**
 * Validation error for tool inputs
 */
export class ValidationError extends XDebugMcpError {
  public readonly field: string;
  public readonly issues: string[];

  constructor(message: string, field: string, issues: string[]) {
    super(message, 'VALIDATION_ERROR', true);
    this.name = 'ValidationError';
    this.field = field;
    this.issues = issues;
  }
}

/**
 * Convert any error to a user-friendly format
 */
export function formatError(error: unknown): {
  error: string;
  code?: string;
  recoverable?: boolean;
  hint?: string;
  issues?: string[];
} {
  if (error instanceof XDebugMcpError) {
    return {
      error: error.message,
      code: error.code,
      recoverable: error.recoverable,
    };
  }

  // Handle Zod validation errors
  if (isZodError(error)) {
    const issues = error.errors.map((e) => {
      const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
      return `${path}${e.message}`;
    });
    return {
      error: `Invalid input: ${issues.join('; ')}`,
      code: 'VALIDATION_ERROR',
      recoverable: true,
      issues,
      hint: 'Check the tool parameters and try again.',
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'UNKNOWN_ERROR',
      recoverable: false,
    };
  }

  return {
    error: String(error),
    code: 'UNKNOWN_ERROR',
    recoverable: false,
  };
}

/**
 * Type guard for Zod errors (duck typing to avoid importing Zod here)
 */
function isZodError(error: unknown): error is { errors: Array<{ path: (string | number)[]; message: string }> } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'errors' in error &&
    Array.isArray((error as { errors: unknown }).errors)
  );
}
