# Show HN Post Draft

## Title
```
Show HN: Smart XDebug MCP – Let Claude debug your PHP code at runtime
```

## URL
```
https://github.com/wallter/smart-xdebug-mcp
```

## First Comment (Post immediately after submitting)

I built this because I was frustrated with the disconnect between AI assistants and actual debugging.

When debugging PHP, I'd find myself describing runtime state to Claude: "okay, so at this point $user is this object, and the query returns these results..." It felt backwards - I was doing the debugging work and just asking Claude to interpret it.

Smart XDebug MCP flips this. Claude connects directly to XDebug via the DBGp protocol. It can set breakpoints, inspect variables at runtime, and step through execution. When I describe a bug, Claude investigates it directly.

Technical details:
- MCP server in TypeScript
- Implements DBGp protocol (XDebug's wire protocol)
- SQLite-based session recording for "time-travel" queries
- Auto-detects Docker path mappings from docker-compose.yml

The hardest part was the DBGp protocol - it's XML over TCP with a length-prefixed framing format from 2004. Parsing it reliably took some work.

Happy to answer questions about the implementation or MCP protocol in general.

---

## Timing Notes
- Post Tuesday or Wednesday morning (US time)
- Avoid weekends and holidays
- Be available to respond to comments for 2-3 hours after posting

## Do NOT
- Ask anyone to upvote
- Share the direct HN link for upvotes
- Have friends post "booster" comments
- Use marketing language
