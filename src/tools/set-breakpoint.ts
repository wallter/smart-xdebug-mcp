/**
 * set_breakpoint Tool Handler
 */

import { z } from 'zod';
import type { DebugSessionManager } from '../debug/session-manager.js';

const SetBreakpointSchema = z.object({
  file: z.string().min(1, 'File path is required'),
  line: z.number().int().positive('Line must be a positive integer'),
  condition: z.string().optional(),
});

export async function handleSetBreakpoint(
  args: Record<string, unknown>,
  sessionManager: DebugSessionManager
): Promise<unknown> {
  const parsed = SetBreakpointSchema.parse(args);

  const breakpoint = await sessionManager.setBreakpoint({
    file: parsed.file,
    line: parsed.line,
    condition: parsed.condition,
  });

  return {
    success: true,
    breakpoint: {
      file: breakpoint.file,
      line: breakpoint.line,
      condition: breakpoint.condition,
    },
    message: breakpoint.condition
      ? `Conditional breakpoint set at ${breakpoint.file}:${breakpoint.line} (when: ${breakpoint.condition})`
      : `Breakpoint set at ${breakpoint.file}:${breakpoint.line}`,
    hint: "Call 'start_debug_session' to begin debugging. The breakpoint will trigger when execution reaches this line.",
  };
}
