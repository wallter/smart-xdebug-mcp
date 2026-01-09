<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart XDebug MCP Test App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #333; }
        .endpoint {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .endpoint h3 { margin: 0 0 10px; color: #007bff; }
        .endpoint p { margin: 0; color: #666; }
        code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 14px;
        }
        .tip {
            background: #d4edda;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>Smart XDebug MCP Test Application</h1>

    <div class="tip">
        <strong>Usage:</strong> Add <code>?XDEBUG_SESSION=mcp</code> to any endpoint to trigger XDebug debugging.
    </div>

    <h2>Test Endpoints</h2>

    <div class="endpoint">
        <h3>GET /debug/simple</h3>
        <p>Basic variable inspection. Good for testing <code>set_breakpoint</code> and <code>inspect_variable</code>.</p>
    </div>

    <div class="endpoint">
        <h3>GET /debug/nested</h3>
        <p>Nested data structures. Test JSONPath filtering like <code>$.items[*].sku</code>.</p>
    </div>

    <div class="endpoint">
        <h3>GET /debug/exception</h3>
        <p>Throws exception. Test <code>stop_on_exception: true</code> in debug sessions.</p>
    </div>

    <div class="endpoint">
        <h3>GET /debug/loop</h3>
        <p>Loop with 100 iterations. Test conditional breakpoints like <code>$i === 50</code>.</p>
    </div>

    <div class="endpoint">
        <h3>GET /debug/database</h3>
        <p>Database queries. Test inspecting query results and database state.</p>
    </div>

    <div class="endpoint">
        <h3>GET /debug/user-service</h3>
        <p>Service layer calls. Test <code>step_into</code>, <code>step_over</code>, and <code>step_out</code>.</p>
    </div>

    <div class="endpoint">
        <h3>GET /debug/async-simulation</h3>
        <p>State mutations. Test <code>query_history</code> to see variable evolution.</p>
    </div>
</body>
</html>
