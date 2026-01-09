<?php

namespace App\Services;

/**
 * Payment Service
 *
 * Simulates payment processing for debugging purposes.
 * Good for testing step_into when debugging payment issues.
 */
class PaymentService
{
    /**
     * Check payment status for a user.
     *
     * BREAKPOINT: Line 21 - Payment status check
     */
    public function checkPaymentStatus(int $userId): array
    {
        // Simulate payment gateway call
        $paymentData = $this->fetchPaymentData($userId);

        // Validate payment
        $validation = $this->validatePayment($paymentData);

        // Calculate balance
        $balance = $this->calculateBalance($paymentData);

        return [
            'user_id' => $userId,
            'status' => $validation['valid'] ? 'good_standing' : 'action_required',
            'balance' => $balance,
            'last_payment' => $paymentData['last_payment'],
            'validation' => $validation,
        ];
    }

    private function fetchPaymentData(int $userId): array
    {
        // Simulate payment gateway response
        return [
            'user_id' => $userId,
            'payment_method' => 'credit_card',
            'last_four' => '4242',
            'last_payment' => [
                'amount' => 129.94,
                'date' => '2026-01-08',
                'status' => 'completed',
            ],
            'pending_charges' => [
                ['amount' => 45.00, 'description' => 'Subscription renewal'],
            ],
            'credits' => 10.00,
        ];
    }

    private function validatePayment(array $paymentData): array
    {
        $errors = [];

        if (empty($paymentData['payment_method'])) {
            $errors[] = 'No payment method on file';
        }

        if ($paymentData['last_payment']['status'] !== 'completed') {
            $errors[] = 'Last payment did not complete';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    private function calculateBalance(array $paymentData): array
    {
        $pending = array_sum(array_column($paymentData['pending_charges'], 'amount'));
        $credits = $paymentData['credits'];
        $due = $pending - $credits;

        return [
            'pending_charges' => $pending,
            'credits' => $credits,
            'amount_due' => max(0, $due),
        ];
    }
}
