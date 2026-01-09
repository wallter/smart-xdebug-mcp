/**
 * Session Recorder
 *
 * Implements the "Black Box" time-travel debugging per REQ-7 and REQ-8.
 * Records every variable inspected during a session for history queries.
 * Uses SQLite for persistent storage.
 *
 * @packageDocumentation
 * @module debug/session-recorder
 *
 * Copyright 2026 Tyler Wall
 * SPDX-License-Identifier: Apache-2.0
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import type { DebugLocation, SessionSummary, PauseReason } from '../types/index.js';
import { createLogger } from '../utils/logger.js';
import { getConfig } from '../config.js';

const logger = createLogger('recorder');

/** A recorded step in execution */
interface RecordedStep {
  sessionId: string;
  stepNumber: number;
  timestamp: string;
  file: string;
  line: number;
  function?: string;
  reason: string;
}

/** A recorded variable inspection */
interface RecordedVariable {
  sessionId: string;
  stepNumber: number;
  timestamp: string;
  file: string;
  line: number;
  variableName: string;
  variableValue: string; // JSON serialized
}

/** Variable history entry returned to client */
export interface HistoryEntry {
  step: number;
  value: unknown;
  location: DebugLocation;
  timestamp: string;
}

/**
 * Records debug session history for time-travel debugging
 */
export class SessionRecorder {
  private db: Database.Database | null = null;
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir ?? getConfig().dataDir ?? join(process.cwd(), '.xdebug-mcp');
  }

  /**
   * Initialize recording for a new session
   */
  async initSession(sessionId: string): Promise<void> {
    // Ensure data directory exists
    mkdirSync(this.dataDir, { recursive: true });

    const dbPath = join(this.dataDir, 'sessions.db');

    // Close existing connection if any
    this.close();

    this.db = new Database(dbPath);

    // Enable WAL mode for better concurrent access
    this.db.pragma('journal_mode = WAL');

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        total_steps INTEGER DEFAULT 0,
        breakpoints_hit INTEGER DEFAULT 0,
        exceptions_thrown INTEGER DEFAULT 0,
        summary_md TEXT
      );

      CREATE TABLE IF NOT EXISTS steps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        file TEXT NOT NULL,
        line INTEGER NOT NULL,
        function TEXT,
        reason TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        UNIQUE(session_id, step_number)
      );

      CREATE TABLE IF NOT EXISTS variables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        file TEXT NOT NULL,
        line INTEGER NOT NULL,
        variable_name TEXT NOT NULL,
        variable_value TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_steps_session
        ON steps(session_id, step_number);
      CREATE INDEX IF NOT EXISTS idx_variables_lookup
        ON variables(session_id, variable_name, step_number DESC);
    `);

    // Insert session record
    this.db
      .prepare('INSERT INTO sessions (id, started_at) VALUES (?, ?)')
      .run(sessionId, new Date().toISOString());

    logger.info('Session recorder initialized', { sessionId, dbPath });
  }

  /**
   * Record an execution step
   */
  async recordStep(
    sessionId: string,
    stepNumber: number,
    location: DebugLocation,
    reason: PauseReason
  ): Promise<void> {
    if (!this.db) return;

    const record: RecordedStep = {
      sessionId,
      stepNumber,
      timestamp: new Date().toISOString(),
      file: location.file,
      line: location.line,
      function: location.function,
      reason,
    };

    try {
      this.db
        .prepare(
          `INSERT OR REPLACE INTO steps
           (session_id, step_number, timestamp, file, line, function, reason)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          record.sessionId,
          record.stepNumber,
          record.timestamp,
          record.file,
          record.line,
          record.function ?? null,
          record.reason
        );

      // Update session statistics
      const updateField = reason === 'exception' ? 'exceptions_thrown' : 'breakpoints_hit';
      this.db
        .prepare(
          `UPDATE sessions
           SET total_steps = ?, ${updateField} = ${updateField} + 1
           WHERE id = ?`
        )
        .run(stepNumber, sessionId);
    } catch (error) {
      logger.warn('Failed to record step', { error, sessionId, stepNumber });
    }
  }

  /**
   * Record a variable inspection
   */
  async recordVariable(
    sessionId: string,
    stepNumber: number,
    location: DebugLocation,
    variableName: string,
    variableValue: unknown
  ): Promise<void> {
    if (!this.db) return;

    const record: RecordedVariable = {
      sessionId,
      stepNumber,
      timestamp: new Date().toISOString(),
      file: location.file,
      line: location.line,
      variableName,
      variableValue: this.safeStringify(variableValue),
    };

    try {
      this.db
        .prepare(
          `INSERT INTO variables
           (session_id, step_number, timestamp, file, line, variable_name, variable_value)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          record.sessionId,
          record.stepNumber,
          record.timestamp,
          record.file,
          record.line,
          record.variableName,
          record.variableValue
        );
    } catch (error) {
      logger.warn('Failed to record variable', { error, variableName });
    }
  }

  /**
   * Get variable history for time-travel debugging
   */
  async getVariableHistory(
    sessionId: string,
    variableName: string,
    fromStep: number,
    limit: number = 5
  ): Promise<HistoryEntry[]> {
    if (!this.db) return [];

    try {
      const rows = this.db
        .prepare(
          `SELECT variable_value, step_number, file, line, timestamp
           FROM variables
           WHERE session_id = ? AND variable_name = ? AND step_number <= ?
           ORDER BY step_number DESC
           LIMIT ?`
        )
        .all(sessionId, variableName, fromStep, limit) as Array<{
        variable_value: string;
        step_number: number;
        file: string;
        line: number;
        timestamp: string;
      }>;

      return rows.map((row) => ({
        step: row.step_number,
        value: this.safeParse(row.variable_value),
        location: { file: row.file, line: row.line },
        timestamp: row.timestamp,
      }));
    } catch (error) {
      logger.warn('Failed to get variable history', { error, variableName });
      return [];
    }
  }

  /**
   * Finalize a session and generate summary
   */
  async finalizeSession(sessionId: string): Promise<SessionSummary | null> {
    if (!this.db) return null;

    try {
      const session = this.db
        .prepare('SELECT * FROM sessions WHERE id = ?')
        .get(sessionId) as
        | {
            id: string;
            started_at: string;
            ended_at: string | null;
            total_steps: number;
            breakpoints_hit: number;
            exceptions_thrown: number;
          }
        | undefined;

      if (!session) return null;

      // Get execution path
      const steps = this.db
        .prepare(
          `SELECT file, line, function
           FROM steps
           WHERE session_id = ?
           ORDER BY step_number`
        )
        .all(sessionId) as Array<{
        file: string;
        line: number;
        function: string | null;
      }>;

      // Get unique variables
      const variables = this.db
        .prepare(
          `SELECT DISTINCT variable_name
           FROM variables
           WHERE session_id = ?`
        )
        .all(sessionId) as Array<{ variable_name: string }>;

      const endedAt = new Date();
      const startedAt = new Date(session.started_at);

      // Update end time
      this.db
        .prepare('UPDATE sessions SET ended_at = ? WHERE id = ?')
        .run(endedAt.toISOString(), sessionId);

      const summary: SessionSummary = {
        sessionId,
        startedAt,
        endedAt,
        totalSteps: session.total_steps,
        breakpointsHit: session.breakpoints_hit,
        exceptionsThrown: session.exceptions_thrown,
        executionPath: steps.map((s) => ({
          file: s.file,
          line: s.line,
          function: s.function ?? undefined,
        })),
        variablesInspected: variables.map((v) => v.variable_name),
        duration: endedAt.getTime() - startedAt.getTime(),
      };

      // Generate and store markdown summary
      const markdown = this.generateMarkdownSummary(summary);
      this.db
        .prepare('UPDATE sessions SET summary_md = ? WHERE id = ?')
        .run(markdown, sessionId);

      // Also write to file
      this.writeSummaryFile(sessionId, markdown);

      logger.info('Session finalized', {
        sessionId,
        totalSteps: summary.totalSteps,
        duration: summary.duration,
      });

      return summary;
    } catch (error) {
      logger.error('Failed to finalize session', { error, sessionId });
      return null;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // Ignore close errors
      }
      this.db = null;
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private generateMarkdownSummary(summary: SessionSummary): string {
    const durationStr = this.formatDuration(summary.duration);

    let md = `# Debug Session Summary\n\n`;
    md += `**Session ID:** \`${summary.sessionId}\`\n`;
    md += `**Started:** ${summary.startedAt.toISOString()}\n`;
    md += `**Duration:** ${durationStr}\n\n`;

    md += `## Statistics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Steps | ${summary.totalSteps} |\n`;
    md += `| Breakpoints Hit | ${summary.breakpointsHit} |\n`;
    md += `| Exceptions Thrown | ${summary.exceptionsThrown} |\n`;
    md += `| Variables Inspected | ${summary.variablesInspected.length} |\n\n`;

    if (summary.executionPath.length > 0) {
      md += `## Execution Path\n\n`;
      md += `\`\`\`\n`;

      const maxLines = 50;
      const pathToShow = summary.executionPath.slice(0, maxLines);

      for (const loc of pathToShow) {
        const fn = loc.function ? ` (${loc.function})` : '';
        md += `${loc.file}:${loc.line}${fn}\n`;
      }

      if (summary.executionPath.length > maxLines) {
        md += `... and ${summary.executionPath.length - maxLines} more steps\n`;
      }

      md += `\`\`\`\n\n`;
    }

    if (summary.variablesInspected.length > 0) {
      md += `## Variables Inspected\n\n`;
      for (const v of summary.variablesInspected) {
        md += `- \`${v}\`\n`;
      }
      md += '\n';
    }

    md += `---\n`;
    md += `*Generated by Smart XDebug MCP*\n`;

    return md;
  }

  private writeSummaryFile(sessionId: string, markdown: string): void {
    try {
      const filename = `session_${sessionId.slice(0, 8)}_summary.md`;
      const filepath = join(this.dataDir, filename);
      writeFileSync(filepath, markdown, 'utf-8');
      logger.info('Session summary written', { filepath });
    } catch (error) {
      logger.warn('Failed to write summary file', { error });
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    if (ms < 60_000) {
      return `${(ms / 1000).toFixed(1)}s`;
    }
    const minutes = Math.floor(ms / 60_000);
    const seconds = Math.floor((ms % 60_000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value, (_, v) => {
        // Handle circular references and special types
        if (typeof v === 'bigint') {
          return v.toString();
        }
        if (v instanceof Error) {
          return { name: v.name, message: v.message };
        }
        return v;
      });
    } catch {
      return JSON.stringify({ error: 'Failed to serialize value' });
    }
  }

  private safeParse(json: string): unknown {
    try {
      return JSON.parse(json);
    } catch {
      return json;
    }
  }
}
