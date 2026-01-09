/**
 * query_history Tool Handler
 *
 * Implements time-travel debugging per REQ-7 and REQ-8.
 */

import { z } from 'zod';
import type { DebugSessionManager } from '../debug/session-manager.js';

const QueryHistorySchema = z.object({
  variable_name: z.string().min(1, 'Variable name is required'),
  steps_ago: z.number().int().min(0).optional().default(1),
  limit: z.number().int().min(1).max(20).optional().default(5),
});

export async function handleQueryHistory(
  args: Record<string, unknown>,
  sessionManager: DebugSessionManager
): Promise<unknown> {
  const parsed = QueryHistorySchema.parse(args);

  const history = await sessionManager.getHistory(
    parsed.variable_name,
    parsed.steps_ago,
    parsed.limit
  );

  if (history.length === 0) {
    return {
      variable: parsed.variable_name,
      history: [],
      message: `No recorded history for '${parsed.variable_name}'. The variable may not have been inspected yet.`,
      hint: "Variables are recorded when you use 'inspect_variable'. Only previously inspected values are available in history.",
    };
  }

  return {
    variable: parsed.variable_name,
    steps_ago: parsed.steps_ago,
    history,
    message: `Found ${history.length} recorded value(s) for '${parsed.variable_name}'`,
  };
}
