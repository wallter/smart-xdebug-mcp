/**
 * get_session_status Tool Handler
 */

import type { DebugSessionManager } from '../debug/session-manager.js';

export async function handleGetSessionStatus(
  sessionManager: DebugSessionManager
): Promise<unknown> {
  const session = sessionManager.getSession();

  if (!session) {
    return {
      active: false,
      message: 'No debug session active.',
      hint: "Use 'set_breakpoint' to set breakpoints, then 'start_debug_session' to begin debugging.",
    };
  }

  const breakpointCount = session.breakpoints.size;
  const breakpointList = Array.from(session.breakpoints.values()).map((bp) => ({
    file: bp.file,
    line: bp.line,
    condition: bp.condition,
  }));

  return {
    active: true,
    session_id: session.id,
    status: session.status,
    started_at: session.startedAt.toISOString(),
    last_activity: session.lastActivityAt.toISOString(),
    location: session.location ? {
      file: session.location.file,
      line: session.location.line,
      function: session.location.function,
    } : undefined,
    code_snippet: session.codeSnippet,
    pause_reason: session.pauseReason,
    breakpoints: {
      count: breakpointCount,
      list: breakpointList,
    },
    available_actions: getAvailableActions(session.status),
  };
}

function getAvailableActions(status: string): string[] {
  switch (status) {
    case 'paused':
      return ['step_over', 'step_into', 'step_out', 'continue', 'stop', 'inspect_variable'];
    case 'running':
      return ['stop'];
    case 'listening':
    case 'connected':
      return ['stop'];
    case 'stopped':
    case 'error':
      return ['start_debug_session'];
    default:
      return [];
  }
}
