# Dev.to Launch Article Draft

**Tags:** php, laravel, debugging, ai

---

# I Built an AI That Can Actually Debug My PHP Code at Runtime

You know that feeling when you're debugging a PHP issue and you think "I wish I could just *show* Claude what's happening"?

I built a tool that does exactly that.

## The Problem

When you ask an AI assistant to help debug your PHP code, it can only see the static code. It can't see:
- What values your variables actually hold
- Where execution is flowing
- Why that exception was thrown
- What state your objects are in

You end up copying and pasting var_dumps, describing what you're seeing, and trying to paint a picture of runtime behavior with words.

## The Solution: Smart XDebug MCP

I created [Smart XDebug MCP](https://github.com/wallter/smart-xdebug-mcp) - an MCP server that connects Claude directly to XDebug.

Now when I'm debugging, I can say:

> "Set a breakpoint at OrderController.php line 45 and tell me why $user->orders is empty"

Claude will:
1. Set the breakpoint
2. Trigger the request
3. Pause at that line
4. Inspect the actual runtime values
5. Tell me exactly what's wrong

No var_dumps. No guessing. Just answers.

## How It Works

```
Claude <-> MCP Protocol <-> Smart XDebug MCP <-> DBGp Protocol <-> XDebug <-> PHP
```

The MCP server:
- Listens for XDebug connections on port 9003
- Translates Claude's requests into DBGp protocol commands
- Returns clean, AI-friendly responses
- Records session history for "time-travel" queries

## Quick Start

```bash
npm install -g smart-xdebug-mcp
```

Add to your Claude Code MCP settings:

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

## Real Example

Here's a real debugging session:

**Me:** "My /api/orders endpoint returns empty for user 42, but they have orders in the database"

**Claude:** *Sets breakpoint in OrderController::index*

**Claude:** *Runs: curl 'http://localhost/api/orders?user_id=42&XDEBUG_SESSION=1'*

**Claude:** *Inspects $user, $query, $results*

**Claude:** "Found it. The `$user->id` is null at line 23 because the auth middleware isn't running on this route. The query filters by `user_id` but there's no authenticated user. Add the `auth` middleware to this route."

That's a bug that would have taken me 15 minutes of stepping through code. Claude found it in seconds.

## Why This Matters

### For Developers
- **Faster debugging** — describe the bug, let AI investigate
- **Better insights** — AI can see patterns across variables you might miss
- **Learning tool** — watch how an experienced debugger approaches problems

### For AI
- **Runtime context** — actual values, not just code structure
- **Surgical precision** — request only what's needed, avoiding context overload
- **Time-travel** — query what variables were at previous breakpoints

## Features

- **Natural language debugging** — describe what you want to debug
- **Smart variable inspection** — AI requests only relevant data
- **Time-travel queries** — see variable history
- **Docker support** — automatic path mapping
- **Exception detection** — auto-pause on errors

## What's Next

I'm working on:
- Conditional breakpoints
- Watch expressions
- Integration with PHPUnit for test debugging

## Try It Out

The project is open source under Apache 2.0:

**GitHub:** https://github.com/wallter/smart-xdebug-mcp
**npm:** https://www.npmjs.com/package/smart-xdebug-mcp

I'd love to hear your feedback! What debugging scenarios would you like to see supported?

---

*Built by [Tyler Wall](https://github.com/wallter) with help from Claude*
