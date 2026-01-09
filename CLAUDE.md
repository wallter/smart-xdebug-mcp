# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart XDebug MCP is an MCP (Model Context Protocol) server that bridges XDebug's DBGp protocol with Claude, enabling AI-powered PHP debugging. The philosophy is "Pull, Don't Push" - the AI requests specific data slices rather than receiving full state dumps.

## Commands

```bash
# Build
npm run build          # Compile TypeScript to dist/

# Development
npm run dev            # Watch mode compilation
npm run typecheck      # Type checking without emit

# Testing
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage (80% threshold)

# Run a single test file
npx vitest run tests/path-mapper.test.ts

# Test app (Docker required)
make test-app-setup    # First-time setup (installs Laravel, starts containers)
make test-app-up       # Start containers
make test-app-down     # Stop containers
```

## Architecture

```
src/
├── index.ts                 # MCP server entry point (stdio transport)
├── config.ts                # Zod-validated configuration (env vars)
├── errors.ts                # Error hierarchy (XDebugMcpError base class)
├── types/index.ts           # Core TypeScript types
├── tools/                   # MCP tool handlers
│   ├── index.ts             # Tool definitions + handleToolCall router
│   ├── start-session.ts     # start_debug_session
│   ├── set-breakpoint.ts    # set_breakpoint
│   ├── inspect-variable.ts  # inspect_variable (JSONPath filtering)
│   ├── control-execution.ts # control_execution (step/continue/stop)
│   ├── get-status.ts        # get_session_status
│   └── query-history.ts     # query_history (time-travel)
├── debug/
│   ├── session-manager.ts   # Central coordinator (singleton per server)
│   ├── dbgp-connection.ts   # DBGp protocol over TCP
│   ├── path-mapper.ts       # Host↔container path translation
│   └── session-recorder.ts  # SQLite history for time-travel
└── utils/
    └── logger.ts            # Structured JSON logging
```

### Key Flows

1. **Session Lifecycle**: `start_debug_session` → SessionManager creates DbgpConnection → listens on port → executes trigger command → XDebug connects → pauses at breakpoint

2. **Variable Inspection**: `inspect_variable` → SessionManager.inspectVariable → DbgpConnection.getProperty → parse DBGp XML → apply JSONPath filter → record to SessionRecorder

3. **Path Mapping**: Auto-detects from `.vscode/launch.json` pathMappings or `docker-compose.yml` volume mounts. Falls back to `cwd → /var/www/html`.

## Key Patterns

- **Error Handling**: All errors extend `XDebugMcpError` with `code`, `recoverable`, and `toJSON()`. Use specific error classes from `errors.ts`. Zod validation errors are automatically formatted with helpful messages.

- **DBGp Protocol**: XML-based protocol with `length\0xml\0` framing. Commands use transaction IDs for correlation. See `dbgp-connection.ts`.

- **Configuration**: Validated with Zod. Environment variables prefixed with `XDEBUG_MCP_`. Default watchdog timeout is 5 minutes.

- **ESM**: Project uses ES modules (`"type": "module"`). All imports require `.js` extension.

- **Tool Handlers**: Each tool in `src/tools/` uses Zod schemas for input validation. The router in `index.ts` dispatches to handlers and formats errors consistently.

## Test App

`test-app/` contains a Laravel application with XDebug for integration testing:
- `/debug/simple` - Basic variables
- `/debug/nested` - Complex objects (test JSONPath)
- `/debug/exception` - Exception breakpoints
- `/debug/loop` - Conditional breakpoints
- `/debug/user-service` - Step into/over/out testing

Trigger debugging with `?XDEBUG_SESSION=mcp` query parameter.
