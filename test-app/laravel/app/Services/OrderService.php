<?php

namespace App\Services;

/**
 * Order Service
 *
 * Simulates order management for debugging purposes.
 * Good for testing step_over when you don't care about order details.
 */
class OrderService
{
    /**
     * Get orders for a user.
     *
     * BREAKPOINT: Line 21 - Order retrieval
     */
    public function getOrdersForUser(int $userId): array
    {
        // Simulate fetching orders
        $orders = $this->fetchOrders($userId);

        // Process each order
        $processed = [];
        foreach ($orders as $order) {
            $processed[] = $this->processOrder($order);
        }

        return $processed;
    }

    private function fetchOrders(int $userId): array
    {
        // Simulate database results
        return [
            [
                'id' => 5001,
                'user_id' => $userId,
                'items' => [
                    ['sku' => 'A1', 'qty' => 2, 'price' => 10.00],
                    ['sku' => 'B2', 'qty' => 1, 'price' => 25.00],
                ],
                'status' => 'completed',
                'created_at' => '2025-12-01',
            ],
            [
                'id' => 5002,
                'user_id' => $userId,
                'items' => [
                    ['sku' => 'C3', 'qty' => 3, 'price' => 15.00],
                ],
                'status' => 'pending',
                'created_at' => '2026-01-05',
            ],
        ];
    }

    private function processOrder(array $order): array
    {
        $total = 0;
        foreach ($order['items'] as $item) {
            $total += $item['qty'] * $item['price'];
        }

        return [
            'id' => $order['id'],
            'status' => $order['status'],
            'item_count' => count($order['items']),
            'total' => $total,
            'created_at' => $order['created_at'],
        ];
    }
}
