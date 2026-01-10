# Reddit Post Templates

## r/PHP

### Title
I built an MCP server that lets Claude debug PHP code at runtime via XDebug

### Body
Hey r/PHP,

I've been working on a tool that connects Claude (or any MCP-compatible AI) directly to XDebug's debugger.

**The problem:** When asking AI to help debug, you end up describing runtime state manually - copying var_dumps, explaining what variables hold, etc.

**The solution:** Smart XDebug MCP gives Claude direct access to your debugger. It can set breakpoints, inspect variables at runtime, step through execution, and even query variable history.

Example interaction:
```
Me: "Why is $user->orders empty at line 45?"

Claude: *sets breakpoint, triggers request, inspects variables*

Claude: "The $user object has no orders because the auth
middleware isn't running - $user->id is null when the
query executes."
```

**Tech stack:**
- TypeScript MCP server
- Implements DBGp protocol (XDebug's wire protocol)
- SQLite for session history
- Auto-detects Docker path mappings

**Links:**
- GitHub: https://github.com/wallter/smart-xdebug-mcp
- npm: `npm install -g smart-xdebug-mcp`

Would love feedback from the community. What debugging scenarios would be most useful?

---

## r/laravel

### Title
Built an AI debugging tool for Laravel - Claude can now set breakpoints and inspect variables at runtime

### Body
Fellow Artisans,

I made something that's changed how I debug Laravel apps.

**Smart XDebug MCP** connects Claude directly to XDebug. Instead of describing bugs, I just tell Claude what's wrong and it investigates.

**Real example from yesterday:**

> "My OrderController@store is throwing a 500 but only for some users"

Claude set a breakpoint, triggered requests with different users, compared the state, and found the issue: a nullable relationship that wasn't being checked.

**How it works:**
1. Install: `npm install -g smart-xdebug-mcp`
2. Add to your MCP config
3. Make sure XDebug is configured
4. Ask Claude to debug

It handles Docker path mapping automatically (reads from docker-compose.yml), so it works with Laravel Sail out of the box.

**Features:**
- Natural language breakpoint setting
- Runtime variable inspection
- Step through execution
- Time-travel queries (see what a variable was 3 steps ago)
- Exception auto-detection

GitHub: https://github.com/wallter/smart-xdebug-mcp

This is open source (Apache 2.0). Would love to hear what debugging workflows would be most useful for Laravel specifically.

---

## r/webdev (Showoff Saturday)

### Title
[Showoff Saturday] Smart XDebug MCP - AI-powered PHP debugging

### Body
Built an MCP server that connects AI assistants (Claude, etc.) to XDebug.

**What it does:** Lets AI set breakpoints, inspect runtime variables, step through code, and debug PHP applications directly.

**Why:** Tired of copying var_dumps and describing runtime state to AI. Now I just describe the bug and Claude investigates it.

**Stack:** TypeScript, MCP protocol, DBGp protocol, SQLite

**Links:**
- GitHub: https://github.com/wallter/smart-xdebug-mcp
- npm: smart-xdebug-mcp

Open source, Apache 2.0. Feedback welcome!

---

## Posting Guidelines

### Timing
- r/webdev: Only post in "Showoff Saturday" thread
- r/PHP: Weekday mornings work well
- r/laravel: Anytime, very active community

### Etiquette
- Don't crosspost on the same day
- Respond to all comments
- Be humble about limitations
- Thank people for feedback
- Don't be defensive about criticism
