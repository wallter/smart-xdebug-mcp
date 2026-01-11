/**
 * get_session_status Tool Handler
 */

import type { DebugSessionManager } from '../debug/session-manager.js';
import { getConfig } from '../config.js';

export async function handleGetSessionStatus(
  sessionManager: DebugSessionManager
): Promise<unknown> {
  const session = sessionManager.getSession();

  const config = getConfig();
  const configInfo = {
    port: config.port,
    projectRoot: config.projectRoot ?? process.cwd(),
    pathMappings: config.pathMappings ?? 'auto-detect',
  };

  if (!session) {
    return {
      active: false,
      message: 'No debug session active.',
      hint: "Use 'set_breakpoint' to set breakpoints, then 'start_debug_session' to begin debugging.",
      config: configInfo,
    };
  }

  const breakpointCount = session.breakpoints.size;
  const breakpointList = Array.from(session.breakpoints.entries()).map(([key, bp]) => {
    // key is "localFile:line", bp.file is remote path
    const localFile = key.split(':')[0] ?? key;
    return {
      localFile,
      remotePath: bp.file,
      line: bp.line,
      condition: bp.condition,
    };
  });

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
    config: configInfo,
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
