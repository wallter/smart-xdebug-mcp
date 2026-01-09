#!/usr/bin/env node
/**
 * Smart XDebug MCP Server
 *
 * Bridges XDebug's DBGp protocol with Claude via MCP,
 * enabling AI-powered PHP debugging.
 *
 * @packageDocumentation
 *
 * Copyright 2026 Tyler Wall
 * SPDX-License-Identifier: Apache-2.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig } from './config.js';
import { DebugSessionManager } from './debug/session-manager.js';
import { tools, handleToolCall } from './tools/index.js';
import { formatError } from './errors.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('main');

/** Package version */
const VERSION = '0.1.0';

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Load configuration from environment
  loadConfig();

  logger.info('Starting Smart XDebug MCP server', { version: VERSION });

  const server = new Server(
    {
      name: 'smart-xdebug-mcp',
      version: VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Create session manager (singleton for the server lifetime)
  const sessionManager = new DebugSessionManager();

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info('Tool called', { tool: name });

    try {
      const result = await handleToolCall(name, args ?? {}, sessionManager);

      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string'
              ? result
              : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const formattedError = formatError(error);
      logger.error('Tool error', {
        tool: name,
        error: formattedError.error,
        code: formattedError.code,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(formattedError, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Setup graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down');
    await sessionManager.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Server started, waiting for connections');
}

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
