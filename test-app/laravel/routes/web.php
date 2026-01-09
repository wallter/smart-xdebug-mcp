<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DebugTestController;

Route::get('/', function () {
    return response()->json([
        'name' => 'Smart XDebug MCP Test Application',
        'version' => '1.0.0',
        'endpoints' => [
            'GET /debug/simple' => 'Basic variable inspection',
            'GET /debug/nested' => 'Nested data structures (test JSONPath)',
            'GET /debug/exception' => 'Throws exception (test exception breakpoints)',
            'GET /debug/loop' => 'Loop iteration (test conditional breakpoints)',
            'GET /debug/database' => 'Database queries (test complex state)',
            'GET /debug/user-service' => 'Service layer (test step into/over)',
            'GET /debug/async-simulation' => 'Async-like flow (test time-travel)',
        ],
        'usage' => 'Add ?XDEBUG_SESSION=mcp to trigger debugging',
    ]);
});

// Debug test routes
Route::prefix('debug')->group(function () {
    Route::get('/simple', [DebugTestController::class, 'simple']);
    Route::get('/nested', [DebugTestController::class, 'nested']);
    Route::get('/exception', [DebugTestController::class, 'exception']);
    Route::get('/loop', [DebugTestController::class, 'loop']);
    Route::get('/database', [DebugTestController::class, 'database']);
    Route::get('/user-service', [DebugTestController::class, 'userService']);
    Route::get('/async-simulation', [DebugTestController::class, 'asyncSimulation']);
});
