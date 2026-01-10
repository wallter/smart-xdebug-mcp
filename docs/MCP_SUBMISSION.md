# MCP Directory Submission Templates

## mcpservers.org Submission

**URL:** https://mcpservers.org/submit

### Server Name
Smart XDebug MCP

### Description (keep under 200 chars)
Connect Claude to XDebug for AI-powered PHP debugging. Set breakpoints, inspect runtime variables, step through code, and query variable history.

### GitHub URL
https://github.com/wallter/smart-xdebug-mcp

### npm Package
smart-xdebug-mcp

### Category
Development / Developer Tools

### Type
local (connects to locally running XDebug)

---

## mcp.so Submission

**URL:** https://mcp.so (click Submit button)

### Name
Smart XDebug MCP

### Description
MCP server that bridges Claude to PHP's XDebug debugger. Enables AI-assisted runtime debugging with breakpoints, variable inspection, step-through execution, and time-travel debugging via session history.

### Features
- Set breakpoints via natural language
- Inspect variables with JSONPath filtering
- Step through execution (step_into, step_over, step_out)
- Query variable history across debug steps
- Auto-detect Docker path mappings
- Exception detection and auto-pause

### GitHub
https://github.com/wallter/smart-xdebug-mcp

### Installation
```bash
npm install -g smart-xdebug-mcp
```

### Configuration
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

---

## Submission Checklist

Before submitting:
- [ ] npm package is published and accessible
- [ ] GitHub repo is public
- [ ] README has clear installation instructions
- [ ] CI is passing (green badge)
- [ ] At least one release/tag exists

After submitting:
- [ ] Monitor for approval
- [ ] Respond to any questions from maintainers
- [ ] Update if changes are requested
