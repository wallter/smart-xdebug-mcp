<?php

namespace App\Services;

/**
 * User Service
 *
 * Simulates user management for debugging purposes.
 * Use step_into to explore these methods.
 */
class UserService
{
    private array $users = [
        101 => [
            'id' => 101,
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'role' => 'customer',
            'tier' => 'gold',
            'created_at' => '2025-01-15',
        ],
        102 => [
            'id' => 102,
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'role' => 'customer',
            'tier' => 'silver',
            'created_at' => '2025-03-20',
        ],
    ];

    /**
     * Get user by ID.
     *
     * BREAKPOINT: Line 38 - User lookup
     */
    public function getUser(int $id): array
    {
        // Simulate database lookup
        $user = $this->users[$id] ?? null;

        if (!$user) {
            throw new \InvalidArgumentException("User {$id} not found");
        }

        // Enrich user data
        $user = $this->enrichUserData($user);

        return $user;
    }

    private function enrichUserData(array $user): array
    {
        // Add computed fields
        $user['display_name'] = $user['name'] . ' (' . $user['tier'] . ')';
        $user['days_active'] = $this->calculateDaysActive($user['created_at']);
        $user['permissions'] = $this->getPermissions($user['role']);

        return $user;
    }

    private function calculateDaysActive(string $createdAt): int
    {
        $created = new \DateTime($createdAt);
        $now = new \DateTime();
        return $created->diff($now)->days;
    }

    private function getPermissions(string $role): array
    {
        $permissions = [
            'customer' => ['read', 'order', 'review'],
            'admin' => ['read', 'write', 'delete', 'admin'],
        ];

        return $permissions[$role] ?? ['read'];
    }
}
