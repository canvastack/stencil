<?php

namespace App\Application\Order\Services;

use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;
use Illuminate\Database\ConnectionInterface;

class PaymentApplicationService
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private ConnectionInterface $database
    ) {}

    public function verifyPayment(string $tenantId, string $orderId, float $amountPaid): array
    {
        return $this->database->transaction(function () use ($tenantId, $orderId, $amountPaid) {
            $order = $this->orderRepository->findById(new UuidValueObject($orderId));

            if (!$order) {
                throw new InvalidArgumentException("Order not found with ID: {$orderId}");
            }

            if (!$order->getTenantId()->equals(new UuidValueObject($tenantId))) {
                throw new InvalidArgumentException('Order belongs to different tenant');
            }

            $totalAmount = $order->getTotal()->getAmount();
            
            if ($amountPaid < 0) {
                throw new InvalidArgumentException('Payment amount must be non-negative');
            }

            if ($amountPaid > $totalAmount) {
                throw new InvalidArgumentException('Payment amount exceeds order total');
            }

            return [
                'order_id' => $orderId,
                'total_amount' => $totalAmount,
                'paid_amount' => $amountPaid,
                'pending_amount' => $totalAmount - $amountPaid,
                'payment_status' => $amountPaid == $totalAmount ? 'full_payment' : 'partial_payment',
                'currency' => $order->getTotal()->getCurrency(),
            ];
        });
    }

    public function calculateDownPayment(string $tenantId, string $orderId, float $percentage = 30.0): array
    {
        $order = $this->orderRepository->findById(new UuidValueObject($orderId));

        if (!$order) {
            throw new InvalidArgumentException("Order not found with ID: {$orderId}");
        }

        if (!$order->getTenantId()->equals(new UuidValueObject($tenantId))) {
            throw new InvalidArgumentException('Order belongs to different tenant');
        }

        if ($percentage < 0 || $percentage > 100) {
            throw new InvalidArgumentException('Percentage must be between 0 and 100');
        }

        $totalAmount = $order->getTotal()->getAmount();
        $downPaymentAmount = ($totalAmount * $percentage) / 100;
        $remainingAmount = $totalAmount - $downPaymentAmount;

        return [
            'total_amount' => $totalAmount,
            'down_payment_percentage' => $percentage,
            'down_payment_amount' => $downPaymentAmount,
            'remaining_amount' => $remainingAmount,
            'currency' => $order->getTotal()->getCurrency(),
        ];
    }

    public function generateInvoiceNumber(string $tenantId, string $orderId): string
    {
        $order = $this->orderRepository->findById(new UuidValueObject($orderId));

        if (!$order) {
            throw new InvalidArgumentException("Order not found with ID: {$orderId}");
        }

        if (!$order->getTenantId()->equals(new UuidValueObject($tenantId))) {
            throw new InvalidArgumentException('Order belongs to different tenant');
        }

        $orderNumber = $order->getOrderNumber()->getValue();
        $timestamp = date('YmdHis');
        return 'INV-' . $orderNumber . '-' . $timestamp;
    }

    public function recordPaymentTransaction(
        string $tenantId,
        string $orderId,
        float $amount,
        string $paymentMethod,
        ?string $transactionReference = null
    ): array {
        if ($amount <= 0) {
            throw new InvalidArgumentException('Payment amount must be greater than zero');
        }

        return [
            'tenant_id' => $tenantId,
            'order_id' => $orderId,
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'transaction_reference' => $transactionReference,
            'recorded_at' => now()->format('Y-m-d H:i:s'),
            'status' => 'recorded',
        ];
    }
}