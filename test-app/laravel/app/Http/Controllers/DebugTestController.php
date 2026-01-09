<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use App\Services\UserService;
use App\Services\OrderService;
use App\Services\PaymentService;

/**
 * Debug Test Controller
 *
 * Provides endpoints designed to test all aspects of the Smart XDebug MCP tool.
 * Each endpoint exercises different debugging scenarios.
 */
class DebugTestController extends Controller
{
    /**
     * Simple endpoint for testing basic variable inspection.
     *
     * Good for testing:
     * - set_breakpoint at line 33
     * - inspect_variable for $message, $number, $array
     * - step_over to see variable changes
     */
    public function simple(): JsonResponse
    {
        // BREAKPOINT: Line 33 - Start here
        $message = "Hello from XDebug!";
        $number = 42;
        $array = ['foo' => 'bar', 'baz' => 123];

        // BREAKPOINT: Line 38 - After variable assignment
        $processed = $this->processSimpleData($message, $number);

        return response()->json([
            'message' => $message,
            'number' => $number,
            'data' => $array,
            'processed' => $processed,
        ]);
    }

    private function processSimpleData(string $message, int $number): string
    {
        // Good for step_into testing
        $result = strtoupper($message) . ' - ' . ($number * 2);
        return $result;
    }

    /**
     * Endpoint with deeply nested data for testing JSONPath filtering.
     *
     * Good for testing:
     * - inspect_variable with filter "$.customer.address.city"
     * - inspect_variable with filter "$.items[*].sku"
     * - depth parameter to control recursion
     */
    public function nested(): JsonResponse
    {
        // BREAKPOINT: Line 62 - Complex object creation
        $order = $this->createSampleOrder();

        // BREAKPOINT: Line 65 - After order creation
        $calculated = $this->calculateOrderTotal($order);
        $validated = $this->validateOrder($order);

        return response()->json([
            'order' => $order,
            'calculated_total' => $calculated,
            'validation' => $validated,
        ]);
    }

    private function createSampleOrder(): array
    {
        return [
            'id' => 12345,
            'status' => 'pending',
            'customer' => [
                'id' => 101,
                'name' => 'John Doe',
                'email' => 'john@example.com',
                'tier' => 'gold',
                'address' => [
                    'street' => '123 Main St',
                    'city' => 'Springfield',
                    'state' => 'IL',
                    'zip' => '62701',
                    'country' => 'USA',
                ],
                'preferences' => [
                    'newsletter' => true,
                    'notifications' => ['email', 'sms'],
                ],
            ],
            'items' => [
                [
                    'sku' => 'PROD-001',
                    'name' => 'Widget Pro',
                    'price' => 9.99,
                    'qty' => 2,
                    'category' => 'electronics',
                    'metadata' => ['color' => 'blue', 'size' => 'M'],
                ],
                [
                    'sku' => 'PROD-002',
                    'name' => 'Gadget Plus',
                    'price' => 19.99,
                    'qty' => 1,
                    'category' => 'electronics',
                    'metadata' => ['warranty' => '2 years'],
                ],
                [
                    'sku' => 'PROD-003',
                    'name' => 'Gizmo Ultra',
                    'price' => 29.99,
                    'qty' => 3,
                    'category' => 'accessories',
                    'metadata' => ['material' => 'aluminum'],
                ],
            ],
            'shipping' => [
                'method' => 'express',
                'cost' => 15.00,
                'estimated_days' => 2,
            ],
            'payment' => [
                'method' => 'credit_card',
                'last_four' => '4242',
            ],
            'created_at' => '2026-01-09T10:30:00Z',
        ];
    }

    private function calculateOrderTotal(array $order): array
    {
        $subtotal = 0;
        // BREAKPOINT: Line 127 - Inside calculation loop
        foreach ($order['items'] as $item) {
            $lineTotal = $item['price'] * $item['qty'];
            $subtotal += $lineTotal;
        }

        $shipping = $order['shipping']['cost'];
        $tax = $subtotal * 0.08;
        $total = $subtotal + $shipping + $tax;

        return [
            'subtotal' => round($subtotal, 2),
            'shipping' => $shipping,
            'tax' => round($tax, 2),
            'total' => round($total, 2),
        ];
    }

    private function validateOrder(array $order): array
    {
        $errors = [];
        $warnings = [];

        if (empty($order['items'])) {
            $errors[] = 'Order must have at least one item';
        }

        if ($order['customer']['tier'] === 'gold' && count($order['items']) < 2) {
            $warnings[] = 'Gold customers usually order more items';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * Endpoint that throws an exception for testing exception breakpoints.
     *
     * Good for testing:
     * - stop_on_exception: true in start_debug_session
     * - Exception stack trace inspection
     */
    public function exception(): JsonResponse
    {
        try {
            // BREAKPOINT: Line 173 - Before exception chain
            $data = $this->fetchExternalData();
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'type' => get_class($e),
            ], 500);
        }
    }

    private function fetchExternalData(): array
    {
        // Simulate a chain of calls leading to an exception
        return $this->connectToService();
    }

    private function connectToService(): array
    {
        // BREAKPOINT: Line 189 - Just before exception
        $config = ['host' => 'api.example.com', 'timeout' => 30];

        // This simulates an exception that would be caught by stop_on_exception
        throw new \RuntimeException(
            "Connection to {$config['host']} failed: timeout after {$config['timeout']}s"
        );
    }

    /**
     * Endpoint with a loop for testing conditional breakpoints.
     *
     * Good for testing:
     * - set_breakpoint with condition "$i === 50"
     * - Avoiding stepping through thousands of iterations
     * - query_history to see variable evolution
     */
    public function loop(): JsonResponse
    {
        $results = [];
        $stats = ['even' => 0, 'odd' => 0, 'prime' => 0];

        // BREAKPOINT: Line 212 with condition "$i === 50" or "$i % 25 === 0"
        for ($i = 0; $i < 100; $i++) {
            $value = $this->processLoopItem($i);
            $results[] = $value;

            // Track statistics
            if ($i % 2 === 0) {
                $stats['even']++;
            } else {
                $stats['odd']++;
            }

            if ($this->isPrime($i)) {
                $stats['prime']++;
            }
        }

        return response()->json([
            'count' => count($results),
            'sum' => array_sum($results),
            'stats' => $stats,
            'sample' => array_slice($results, 45, 10), // Items 45-54
        ]);
    }

    private function processLoopItem(int $i): int
    {
        // BREAKPOINT: Line 238 - Inside loop function
        // Good place for conditional breakpoint: $i === 50
        $squared = $i * $i;
        return $squared;
    }

    private function isPrime(int $n): bool
    {
        if ($n < 2) return false;
        if ($n === 2) return true;
        if ($n % 2 === 0) return false;
        for ($i = 3; $i <= sqrt($n); $i += 2) {
            if ($n % $i === 0) return false;
        }
        return true;
    }

    /**
     * Database endpoint for testing with real queries.
     *
     * Good for testing:
     * - Inspecting $results collection
     * - Watching query builder state
     * - Time-travel to see query results change
     */
    public function database(): JsonResponse
    {
        // Create test table if not exists
        // BREAKPOINT: Line 265 - Database schema setup
        DB::statement('CREATE TABLE IF NOT EXISTS debug_test (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            value INT,
            category VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )');

        // Insert test data
        $categories = ['alpha', 'beta', 'gamma'];
        // BREAKPOINT: Line 276 - Before insert loop
        for ($i = 0; $i < 5; $i++) {
            DB::table('debug_test')->insert([
                'name' => 'Test Item ' . rand(1, 1000),
                'value' => rand(1, 100),
                'category' => $categories[array_rand($categories)],
            ]);
        }

        // Complex query with multiple conditions
        // BREAKPOINT: Line 286 - Before complex query
        $results = DB::table('debug_test')
            ->select('category', DB::raw('COUNT(*) as count'), DB::raw('AVG(value) as avg_value'))
            ->where('value', '>', 10)
            ->groupBy('category')
            ->having('count', '>', 0)
            ->orderBy('avg_value', 'desc')
            ->get();

        $latest = DB::table('debug_test')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'aggregates' => $results,
            'latest' => $latest,
            'total_records' => DB::table('debug_test')->count(),
        ]);
    }

    /**
     * Service layer endpoint for testing step into/over/out.
     *
     * Good for testing:
     * - step_into to dive into service methods
     * - step_over to skip service internals
     * - step_out to return from deep call stacks
     */
    public function userService(): JsonResponse
    {
        // BREAKPOINT: Line 314 - Service orchestration start
        $userService = new UserService();
        $orderService = new OrderService();
        $paymentService = new PaymentService();

        // Step into this to see UserService internals
        $user = $userService->getUser(101);

        // Step over this if you don't care about order details
        $orders = $orderService->getOrdersForUser($user['id']);

        // Step into to debug payment processing
        $paymentStatus = $paymentService->checkPaymentStatus($user['id']);

        return response()->json([
            'user' => $user,
            'orders' => $orders,
            'payment_status' => $paymentStatus,
        ]);
    }

    /**
     * Async simulation endpoint for testing time-travel debugging.
     *
     * Good for testing:
     * - query_history to see how $state evolved
     * - Multiple breakpoints to track state changes
     * - Understanding async-like state mutations
     */
    public function asyncSimulation(): JsonResponse
    {
        $state = [
            'step' => 0,
            'data' => null,
            'errors' => [],
            'completed' => false,
        ];

        // BREAKPOINT: Line 349 - Initial state
        // Simulate async-like operations
        $state = $this->asyncStep1($state);
        // BREAKPOINT: Line 352 - After step 1

        $state = $this->asyncStep2($state);
        // BREAKPOINT: Line 355 - After step 2

        $state = $this->asyncStep3($state);
        // BREAKPOINT: Line 358 - After step 3

        // Use query_history to see all states of $state

        return response()->json([
            'final_state' => $state,
            'message' => 'Use query_history("$state") to see evolution',
        ]);
    }

    private function asyncStep1(array $state): array
    {
        usleep(10000); // Simulate async delay
        $state['step'] = 1;
        $state['data'] = ['fetched' => true, 'records' => 100];
        return $state;
    }

    private function asyncStep2(array $state): array
    {
        usleep(10000);
        $state['step'] = 2;
        $state['data']['processed'] = true;
        $state['data']['valid_records'] = 95;
        return $state;
    }

    private function asyncStep3(array $state): array
    {
        usleep(10000);
        $state['step'] = 3;
        $state['completed'] = true;
        $state['data']['saved'] = true;
        return $state;
    }
}
