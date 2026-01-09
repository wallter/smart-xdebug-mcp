/**
 * start_debug_session Tool Handler
 */

import { z } from 'zod';
import type { DebugSessionManager } from '../debug/session-manager.js';

const StartSessionSchema = z.object({
  command: z.string().min(1, 'Command is required'),
  stop_on_entry: z.boolean().optional().default(false),
  stop_on_exception: z.boolean().optional().default(false),
  working_directory: z.string().optional(),
});

export async function handleStartDebugSession(
  args: Record<string, unknown>,
  sessionManager: DebugSessionManager
): Promise<unknown> {
  const parsed = StartSessionSchema.parse(args);

  const session = await sessionManager.startSession({
    command: parsed.command,
    stopOnEntry: parsed.stop_on_entry,
    stopOnException: parsed.stop_on_exception,
    workingDirectory: parsed.working_directory,
  });

  return {
    status: session.status,
    session_id: session.id,
    message: session.status === 'paused'
      ? `Debugger paused at ${session.location?.file}:${session.location?.line}`
      : `Debug session started. Status: ${session.status}`,
    location: session.location ? {
      file: session.location.file,
      line: session.location.line,
      function: session.location.function,
    } : undefined,
    code_snippet: session.codeSnippet,
    pause_reason: session.pauseReason,
    hint: session.status === 'paused'
      ? "Use 'inspect_variable' to examine state, or 'control_execution' to step/continue."
      : "Waiting for breakpoint hit or exception...",
  };
}
