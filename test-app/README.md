# Smart XDebug MCP Test Application

A Laravel application configured with XDebug for testing the Smart XDebug MCP server.

## Quick Start

```bash
# From this directory
./setup.sh
```

This will:
1. Install Composer dependencies (via Docker)
2. Start the Docker containers (PHP + MySQL)
3. Run database migrations
4. Make the app available at http://localhost:8080

## Test Endpoints

Each endpoint is designed to test specific MCP tool functionality:

| Endpoint | Purpose | MCP Tools to Test |
|----------|---------|-------------------|
| `/debug/simple` | Basic variables | `set_breakpoint`, `inspect_variable` |
| `/debug/nested` | Nested objects | `inspect_variable` with JSONPath filter |
| `/debug/exception` | Exception handling | `start_debug_session` with `stop_on_exception` |
| `/debug/loop` | Loop iteration | `set_breakpoint` with condition |
| `/debug/database` | DB queries | `inspect_variable` on query results |
| `/debug/user-service` | Service calls | `step_into`, `step_over`, `step_out` |
| `/debug/async-simulation` | State changes | `query_history` for time-travel |

## Triggering XDebug

Add the `XDEBUG_SESSION` query parameter to any URL:

```bash
curl 'http://localhost:8080/debug/simple?XDEBUG_SESSION=mcp'
```

## Example Debugging Sessions

### 1. Basic Variable Inspection

```
# In Claude Code with MCP enabled:

1. Set a breakpoint:
   set_breakpoint(file: "app/Http/Controllers/DebugTestController.php", line: 33)

2. Start debug session:
   start_debug_session(command: "curl 'http://localhost:8080/debug/simple?XDEBUG_SESSION=mcp'")

3. Inspect variables:
   inspect_variable(name: "$message")
   inspect_variable(name: "$array")
```

### 2. JSONPath Filtering (Nested Data)

```
1. Set breakpoint at line 65 of DebugTestController.php
2. Start session with /debug/nested
3. Inspect with filter:
   inspect_variable(name: "$order", filter: "$.customer.address.city")
   inspect_variable(name: "$order", filter: "$.items[*].sku")
```

### 3. Conditional Breakpoint (Loop)

```
1. Set conditional breakpoint:
   set_breakpoint(
     file: "app/Http/Controllers/DebugTestController.php",
     line: 238,
     condition: "$i === 50"
   )

2. Start session with /debug/loop
3. Inspect $squared when $i is 50
```

### 4. Exception Debugging

```
1. Start with exception stopping:
   start_debug_session(
     command: "curl 'http://localhost:8080/debug/exception?XDEBUG_SESSION=mcp'",
     stop_on_exception: true
   )

2. Debugger will pause at the exception
3. Inspect $config to see state before exception
```

### 5. Time-Travel Debugging

```
1. Set breakpoints at lines 349, 352, 355, 358 of DebugTestController.php
2. Start session with /debug/async-simulation
3. At each breakpoint, inspect $state
4. After a few steps, use:
   query_history(variable_name: "$state", steps_ago: 2)
```

## Docker Commands

```bash
# Start containers
docker compose up -d

# Stop containers
docker compose down

# View logs
docker compose logs -f app

# Shell into container
docker exec -it xdebug-test-app bash

# Check XDebug status
docker exec xdebug-test-app php -m | grep xdebug
docker exec xdebug-test-app php -i | grep xdebug
```

## XDebug Configuration

The container has XDebug configured with:

```ini
xdebug.mode = debug
xdebug.start_with_request = trigger
xdebug.client_host = host.docker.internal
xdebug.client_port = 9003
xdebug.idekey = mcp
```

## Path Mapping

The MCP server auto-detects path mappings from `.vscode/launch.json`:

- **Container path**: `/var/www/html`
- **Local path**: `./laravel`

## Troubleshooting

### "Connection refused" errors

Ensure the MCP server is listening on port 9003:
```bash
lsof -i :9003
```

### XDebug not triggering

1. Check XDebug is enabled: `docker exec xdebug-test-app php -m | grep xdebug`
2. Ensure `?XDEBUG_SESSION=mcp` is in the URL
3. Check XDebug logs: `docker exec xdebug-test-app cat /var/log/xdebug.log`

### MySQL connection issues

Wait for MySQL to be ready:
```bash
docker exec xdebug-test-db mysqladmin ping -h localhost
```
