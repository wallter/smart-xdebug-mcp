# Contributing to Smart XDebug MCP

Thank you for your interest in contributing to Smart XDebug MCP!

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build better tools.

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for the test application)
- Basic understanding of PHP debugging and XDebug

### Development Setup

```bash
# Clone the repository
git clone https://github.com/wallter/smart-xdebug-mcp.git
cd smart-xdebug-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Test Application

A Laravel application with XDebug is included for integration testing:

```bash
cd test-app
./setup.sh           # First-time setup (installs Laravel, starts Docker)
docker compose up -d # Start containers (subsequent runs)
```

Test endpoints at `http://localhost:8080/debug/*`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD is encouraged)
3. Implement your changes
4. Ensure all tests pass: `npm test`
5. Ensure type checking passes: `npm run typecheck`
6. Submit a pull request

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Watch mode compilation |
| `npm test` | Run tests |
| `npm run test:watch` | Watch mode tests |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | Type checking |
| `npm run lint` | Run ESLint |

## Architecture Overview

```
src/
├── index.ts              # MCP server entry point (stdio transport)
├── config.ts             # Zod-validated configuration
├── errors.ts             # Custom error hierarchy
├── types/index.ts        # TypeScript type definitions
├── tools/                # MCP tool handlers
│   ├── index.ts          # Tool definitions & router
│   ├── start-session.ts  # start_debug_session
│   ├── set-breakpoint.ts # set_breakpoint
│   ├── inspect-variable.ts # inspect_variable (JSONPath)
│   ├── control-execution.ts # step/continue/stop
│   ├── get-status.ts     # get_session_status
│   └── query-history.ts  # time-travel debugging
├── debug/                # Core debugging logic
│   ├── session-manager.ts   # Central coordinator
│   ├── dbgp-connection.ts   # DBGp protocol over TCP
│   ├── session-recorder.ts  # SQLite history
│   └── path-mapper.ts       # Host↔container paths
└── utils/
    └── logger.ts         # Structured JSON logging
```

### Key Concepts

- **Session Manager**: Orchestrates debug sessions, coordinates all components
- **DBGp Connection**: Implements XDebug's DBGp protocol (XML over TCP)
- **Path Mapper**: Auto-detects mappings from `.vscode/launch.json` or `docker-compose.yml`
- **Session Recorder**: SQLite-based history for "time-travel" debugging

### Data Flow

1. User calls `set_breakpoint` → stored in SessionManager
2. User calls `start_debug_session` → DbgpConnection listens, executes trigger command
3. XDebug connects → breakpoints registered via DBGp
4. Execution hits breakpoint → `break` event → SessionRecorder logs step
5. User calls `inspect_variable` → DbgpConnection.getProperty → JSONPath filter applied

## Code Style

- TypeScript with strict mode enabled (`noUncheckedIndexedAccess`, etc.)
- ES modules with `.js` extensions in imports
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Prefer explicit types over `any` or `unknown` where possible
- Use custom error classes from `errors.ts`

## Testing

- All new features should have tests
- Use Vitest for testing
- Mock external dependencies (DBGp connections, file system)
- Integration tests can use the Laravel test application
- Aim for 80%+ code coverage

### Running a Single Test

```bash
npx vitest run tests/path-mapper.test.ts
```

## Commit Messages

Use conventional commits:

| Prefix | Description |
|--------|-------------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation changes |
| `test:` | Test additions/changes |
| `refactor:` | Code refactoring |
| `chore:` | Build/config changes |

Example: `feat: add support for conditional breakpoints in loops`

## Pull Requests

1. Reference any related issues
2. Provide a clear description of changes
3. Update documentation if needed
4. Add tests for new functionality
5. Ensure `npm run build && npm test && npm run typecheck` passes

## Reporting Issues

When reporting issues, please include:

- Node.js version (`node --version`)
- Operating system
- XDebug version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (set `DEBUG=true` for verbose output)

## Feature Requests

Feature requests are welcome! Please:

- Check existing issues first
- Describe the use case clearly
- Explain why existing functionality doesn't meet the need

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
