/**
 * MCP Tool definitions and handlers
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { DebugSessionManager } from '../debug/session-manager.js';
import { handleStartDebugSession } from './start-session.js';
import { handleSetBreakpoint } from './set-breakpoint.js';
import { handleInspectVariable } from './inspect-variable.js';
import { handleControlExecution } from './control-execution.js';
import { handleGetSessionStatus } from './get-status.js';
import { handleQueryHistory } from './query-history.js';

export const tools: Tool[] = [
  {
    name: 'start_debug_session',
    description: `Starts a new PHP debugging session. You MUST set breakpoints via 'set_breakpoint' BEFORE calling this unless using stop_on_entry or stop_on_exception.

The system will:
1. Start listening for XDebug connections
2. Execute your trigger command (curl, php artisan, etc.)
3. Pause when a breakpoint is hit or exception thrown

Returns session status and location when paused.`,
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: "The command to trigger PHP execution (e.g., 'curl http://localhost/api/users' or 'php artisan test --filter=UserTest')",
        },
        stop_on_entry: {
          type: 'boolean',
          description: 'If true, pauses at the very first line of execution. Use for scripts with unknown flow.',
          default: false,
        },
        stop_on_exception: {
          type: 'boolean',
          description: 'If true, pauses automatically when an Error or Exception is thrown. Recommended for debugging crashes.',
          default: false,
        },
        working_directory: {
          type: 'string',
          description: 'Working directory for the trigger command. Defaults to project root.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'set_breakpoint',
    description: `Sets a breakpoint at a specific file and line. Use BEFORE starting a debug session.

Path translation is automatic - use local paths relative to project root.
Conditional breakpoints are HIGHLY RECOMMENDED for loops to avoid stepping through thousands of iterations.`,
    inputSchema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Local file path relative to project root (e.g., "app/Http/Controllers/UserController.php")',
        },
        line: {
          type: 'integer',
          description: 'Line number to break at',
        },
        condition: {
          type: 'string',
          description: "Optional PHP expression. Break only if true (e.g., '$user->id === 5' or '$i > 100')",
        },
      },
      required: ['file', 'line'],
    },
  },
  {
    name: 'inspect_variable',
    description: `Surgically inspects a variable's value. Returns JSON.

CONTEXT COST WARNING: Reading full objects is expensive. ALWAYS use filters.
- BAD:  inspect_variable("$order") → Returns 5000 lines
- GOOD: inspect_variable("$order", "$.items[*].sku") → Returns 5 lines

Without a filter, returns only structure summary (keys/types, no values).`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "PHP variable name (e.g., '$this', '$request', '$_SERVER')",
        },
        filter: {
          type: 'string',
          description: "JSONPath query to filter results (e.g., '$.user.email', '$.items[0].price'). Omit for structure-only view.",
        },
        depth: {
          type: 'integer',
          description: 'Recursion depth for nested objects. Default 1, max 3.',
          default: 1,
          minimum: 1,
          maximum: 3,
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'control_execution',
    description: `Controls debugger execution flow.

Actions:
- step_over: Execute current line, pause at next line (skip function internals)
- step_into: Step into function call on current line
- step_out: Run until current function returns
- continue: Run until next breakpoint or exception
- stop: Terminate debug session`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['step_over', 'step_into', 'step_out', 'continue', 'stop'],
          description: 'The execution control action to perform',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'get_session_status',
    description: 'Returns current debug session status, location, and available actions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'query_history',
    description: `Query the session recorder to see past variable values (time-travel debugging).

Use this to check what a variable was N steps ago without stepping the debugger back.
Example: "What was $status 3 steps ago?"`,
    inputSchema: {
      type: 'object',
      properties: {
        variable_name: {
          type: 'string',
          description: 'Variable name to query history for',
        },
        steps_ago: {
          type: 'integer',
          description: 'How many steps back to look. 0 = current, 1 = previous step, etc.',
          default: 1,
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of history entries to return',
          default: 5,
        },
      },
      required: ['variable_name'],
    },
  },
];

export async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  sessionManager: DebugSessionManager
): Promise<unknown> {
  switch (name) {
    case 'start_debug_session':
      return handleStartDebugSession(args, sessionManager);
    case 'set_breakpoint':
      return handleSetBreakpoint(args, sessionManager);
    case 'inspect_variable':
      return handleInspectVariable(args, sessionManager);
    case 'control_execution':
      return handleControlExecution(args, sessionManager);
    case 'get_session_status':
      return handleGetSessionStatus(sessionManager);
    case 'query_history':
      return handleQueryHistory(args, sessionManager);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
