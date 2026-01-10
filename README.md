# Smart XDebug MCP Server

[![npm version](https://img.shields.io/npm/v/smart-xdebug-mcp.svg)](https://www.npmjs.com/package/smart-xdebug-mcp)
[![npm downloads](https://img.shields.io/npm/dm/smart-xdebug-mcp.svg)](https://www.npmjs.com/package/smart-xdebug-mcp)
[![CI](https://github.com/wallter/smart-xdebug-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/wallter/smart-xdebug-mcp/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Node.js 18+](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

**Let AI debug your PHP code.**

Smart XDebug MCP connects Claude to your PHP application's debugger, enabling AI-assisted debugging that actually understands your code at runtime.

<!--
TODO: Add demo GIF here
![Demo](docs/demo.gif)

To create the demo GIF:
1. Install terminalizer: npm install -g terminalizer
2. Record: terminalizer record demo
3. Edit demo.yml to customize
4. Generate: terminalizer render demo -o docs/demo.gif
-->

## The Problem

Debugging PHP applications traditionally requires:
- Manually setting breakpoints in an IDE
- Stepping through code line by line
- Remembering to check the right variables at the right time
- Context-switching between your AI assistant and your debugger

When you ask an AI to help debug, it can only see your code statically. It can't see what's actually happening when your code runs—what values variables hold, where execution flows, or why that exception was thrown.

## The Solution

Smart XDebug MCP gives Claude **direct access to your PHP debugger**. Instead of guessing what might be wrong, Claude can:

- **Set breakpoints** at suspicious locations
- **Run your code** and pause at those breakpoints
- **Inspect variables** to see actual runtime values
- **Step through execution** to understand the flow
- **Track variable changes** over time with built-in history

It's like pair programming with a debugger expert who never gets tired and can analyze complex state instantly.

## Why This Matters

### For Developers
- **Faster debugging** — Describe the bug, let AI investigate
- **Better insights** — AI can correlate patterns across variables you might miss
- **Learning tool** — Watch how an experienced debugger approaches problems

### For AI
- **Runtime context** — See actual values, not just code structure
- **Surgical precision** — Request only the data needed, preventing context overload
- **Time-travel** — Query what variables were at previous breakpoints

## How It Works

```
You: "My /api/orders endpoint returns empty for user 42, but they have orders in the database"

Claude: *Sets breakpoint in OrderController*
        *Triggers the API request*
        *Inspects $user, $query, $results at the breakpoint*

Claude: "Found it. The query filters by user_id but $user->id is null here
         because the auth middleware isn't running on this route."
```

No manual stepping. No guessing. Just answers.

## Quick Start

### 1. Install

```bash
npm install -g smart-xdebug-mcp
```

### 2. Configure Claude Code

Add to your MCP settings (`~/.config/claude/settings.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "xdebug": {
      "command": "npx",
      "args": ["smart-xdebug-mcp"]
    }
  }
}
```

### 3. Configure XDebug

Ensure your PHP environment has XDebug configured:

```ini
xdebug.mode = debug
xdebug.start_with_request = trigger
xdebug.client_host = host.docker.internal  ; For Docker
xdebug.client_port = 9003
```

### 4. Debug

Ask Claude to debug your PHP code:

```
"Set a breakpoint at app/Services/PaymentService.php line 127,
then run: curl 'http://localhost/api/checkout?XDEBUG_SESSION=mcp'"
```

## Features

| Feature | What It Does |
|---------|--------------|
| **Natural Language Debugging** | Tell Claude what to debug in plain English |
| **Smart Variable Inspection** | AI requests only relevant data, not full dumps |
| **Time-Travel Queries** | See what variables were at previous steps |
| **Automatic Path Mapping** | Works with Docker without manual configuration |
| **Exception Detection** | Auto-pause when errors occur |
| **Session History** | Review what happened in past debug sessions |

## Use Cases

- **"Why is this returning null?"** — Trace execution to find where values disappear
- **"This loop seems slow"** — Set conditional breakpoints to inspect specific iterations
- **"The API works locally but fails in Docker"** — Debug the containerized app directly
- **"I inherited this codebase"** — Let AI explore and explain runtime behavior

## Requirements

- **Node.js 18+**
- **PHP with XDebug 3.x** configured for remote debugging
- **Claude Code** or another MCP-compatible AI assistant

## Configuration

Environment variables for advanced configuration:

| Variable | Default | Description |
|----------|---------|-------------|
| `XDEBUG_MCP_PORT` | `9003` | XDebug listener port |
| `XDEBUG_MCP_TIMEOUT` | `30000` | Connection timeout (ms) |
| `XDEBUG_MCP_WATCHDOG_TIMEOUT` | `300000` | Auto-terminate idle sessions (5 min) |

Path mappings are auto-detected from `.vscode/launch.json` or `docker-compose.yml`.

## Architecture

Smart XDebug MCP acts as a bridge:

```
Claude ←→ MCP Protocol ←→ Smart XDebug MCP ←→ DBGp Protocol ←→ XDebug ←→ PHP
```

The server translates high-level debugging intent into DBGp commands, handles the complexity of the protocol, and returns clean, AI-friendly responses.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Copyright 2026 Tyler Wall

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

---

**Keywords:** PHP debugging, AI debugging, Claude MCP, XDebug integration, autonomous debugging, Model Context Protocol, PHP development tools, AI-assisted development, remote debugging, Docker PHP debugging
