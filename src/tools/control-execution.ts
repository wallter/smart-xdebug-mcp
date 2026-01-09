/**
 * control_execution Tool Handler
 */

import { z } from 'zod';
import type { DebugSessionManager } from '../debug/session-manager.js';
import type { ExecutionAction } from '../types/index.js';

const ControlExecutionSchema = z.object({
  action: z.enum(['step_over', 'step_into', 'step_out', 'continue', 'stop']),
});

const ACTION_DESCRIPTIONS: Record<ExecutionAction, string> = {
  step_over: 'Executed current line, paused at next line',
  step_into: 'Stepped into function call',
  step_out: 'Executed until function returned',
  continue: 'Continued execution',
  stop: 'Debug session terminated',
};

export async function handleControlExecution(
  args: Record<string, unknown>,
  sessionManager: DebugSessionManager
): Promise<unknown> {
  const parsed = ControlExecutionSchema.parse(args);
  const action = parsed.action as ExecutionAction;

  const session = await sessionManager.executeAction(action);

  if (action === 'stop') {
    return {
      status: 'stopped',
      message: 'Debug session terminated.',
      hint: "Use 'start_debug_session' to begin a new session.",
    };
  }

  return {
    status: session.status,
    action: action,
    message: ACTION_DESCRIPTIONS[action],
    location: session.location ? {
      file: session.location.file,
      line: session.location.line,
      function: session.location.function,
    } : undefined,
    code_snippet: session.codeSnippet,
    pause_reason: session.pauseReason,
    hint: session.status === 'paused'
      ? "Use 'inspect_variable' to examine state at this location."
      : session.status === 'stopped'
        ? 'Execution completed or session ended.'
        : 'Running...',
  };
}
