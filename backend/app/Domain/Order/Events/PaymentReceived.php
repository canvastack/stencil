<?php

namespace App\Domain\Order\Events;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\Events\DomainEvent;
use DateTimeImmutable;

/**
 * Payment Received Domain Event
 * 
 * Fired when a payment is recorded for an order.
 * Triggers financial workflows and status updates.
 * 
 * Database Integration:
 * - Creates record in order_payment_transactions table
 * - Updates order payment status and amounts
 * - Triggers accounting and notification workflows
 */
class PaymentReceived implements DomainEvent
{
    private DateTimeImmutable $occurredAt;

    public function __construct(
        private PurchaseOrder|\App\Infrastructure\Persistence\Eloquent\Models\Order $order,
        private Money $amount,
        private string $method,
        private string $reference,
        private ?object $transaction = null
    ) {
        $this->occurredAt = new DateTimeImmutable();
    }

    public function getOrder(): PurchaseOrder|\App\Infrastructure\Persistence\Eloquent\Models\Order
    {
        return $this->order;
    }

    public function getAmount(): Money
    {
        return $this->amount;
    }

    public function getMethod(): string
    {
        return $this->method;
    }

    public function getReference(): string
    {
        return $this->reference;
    }

    public function getTransaction(): ?object
    {
        return $this->transaction;
    }

    public function getOccurredAt(): DateTimeImmutable
    {
        return $this->occurredAt;
    }

    public function getEventName(): string
    {
        return 'order.payment_received';
    }

    public function getAggregateId(): string
    {
        if ($this->order instanceof PurchaseOrder) {
            return $this->order->getId()->getValue();
        }
        // For Eloquent Order model
        return $this->order->uuid;
    }

    /**
     * Get event payload for serialization
     */
    public function getPayload(): array
    {
        if ($this->order instanceof PurchaseOrder) {
            return [
                'order_id' => $this->order->getId()->getValue(),
                'tenant_id' => $this->order->getTenantId()->getValue(),
                'customer_id' => $this->order->getCustomerId()->getValue(),
                'order_number' => $this->order->getOrderNumber(),
                'payment_amount' => $this->amount->getAmountInCents(),
                'currency' => $this->amount->getCurrency(),
                'payment_method' => $this->method,
                'payment_reference' => $this->reference,
                'total_paid_amount' => $this->order->getTotalPaidAmount()->getAmountInCents(),
                'remaining_amount' => $this->order->getRemainingAmount()->getAmountInCents(),
                'payment_status' => $this->order->getPaymentStatus()->value,
                'order_status' => $this->order->getStatus()->value,
                'is_full_payment' => $this->isFullPayment(),
                'is_down_payment' => $this->isDownPayment(),
                'received_at' => $this->occurredAt->format('Y-m-d H:i:s'),
            ];
        }
        
        // For Eloquent Order model
        return [
            'order_id' => $this->order->uuid,
            'tenant_id' => $this->order->tenant_id,
            'customer_id' => $this->order->customer_id,
            'order_number' => $this->order->order_number,
            'payment_amount' => $this->amount->getAmountInCents(),
            'currency' => $this->amount->getCurrency(),
            'payment_method' => $this->method,
            'payment_reference' => $this->reference,
            'total_paid_amount' => $this->order->total_paid_amount ?? 0,
            'remaining_amount' => max(0, ($this->order->total_amount ?? 0) - ($this->order->total_paid_amount ?? 0)),
            'payment_status' => $this->order->payment_status ?? 'pending',
            'order_status' => $this->order->status ?? 'pending',
            'is_full_payment' => ($this->order->total_paid_amount ?? 0) >= ($this->order->total_amount ?? 0),
            'is_down_payment' => false, // Simplified for Eloquent model
            'received_at' => $this->occurredAt->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get notification recipients
     */
    public function getNotificationRecipients(): array
    {
        if ($this->order instanceof PurchaseOrder) {
            return [
                'customer' => $this->order->getCustomerId()->getValue(),
                'admin' => 'all',
                'finance_team' => 'all',
                'sales_team' => 'all',
            ];
        }
        
        // For Eloquent Order model
        return [
            'customer' => $this->order->customer_id,
            'admin' => 'all',
            'finance_team' => 'all',
            'sales_team' => 'all',
        ];
    }

    /**
     * Check if this is a full payment
     */
    public function isFullPayment(): bool
    {
        if ($this->order instanceof PurchaseOrder) {
            return $this->order->getPaymentStatus()->isComplete();
        }
        
        // For Eloquent Order model
        return ($this->order->total_paid_amount ?? 0) >= ($this->order->total_amount ?? 0);
    }

    /**
     * Check if this is a down payment
     */
    public function isDownPayment(): bool
    {
        if ($this->order instanceof PurchaseOrder) {
            $downPaymentAmount = $this->order->getDownPaymentAmount();
            return $this->amount->equals($downPaymentAmount) || 
                   ($this->amount->isGreaterThan($downPaymentAmount->percentage(90)) && 
                    $this->amount->isLessThan($downPaymentAmount->percentage(110)));
        }
        
        // For Eloquent Order model - simplified logic
        $downPaymentAmount = $this->order->down_payment_amount ?? 0;
        $paymentAmount = $this->amount->getAmountInCents();
        return abs($paymentAmount - $downPaymentAmount) <= ($downPaymentAmount * 0.1);
    }

    /**
     * Get financial impact
     */
    public function getFinancialImpact(): array
    {
        return [
            'cash_flow_impact' => $this->amount->getAmountInCents(),
            'payment_completion_percentage' => $this->getPaymentCompletionPercentage(),
            'remaining_receivable' => $this->order->getRemainingAmount()->getAmountInCents(),
            'payment_velocity' => $this->calculatePaymentVelocity(),
        ];
    }

    /**
     * Get business impact
     */
    public function getBusinessImpact(): array
    {
        return [
            'customer_commitment' => $this->isDownPayment() ? 'high' : 'medium',
            'production_readiness' => $this->isFullPayment() ? 'ready' : 'pending',
            'cash_flow_status' => $this->isFullPayment() ? 'complete' : 'partial',
            'next_action_required' => $this->getNextActionRequired(),
        ];
    }

    /**
     * Get payment completion percentage
     */
    private function getPaymentCompletionPercentage(): float
    {
        $totalAmount = $this->order->getTotalAmount();
        $paidAmount = $this->order->getTotalPaidAmount();
        
        if ($totalAmount->isZero()) {
            return 0.0;
        }
        
        return ($paidAmount->getAmountInCents() / $totalAmount->getAmountInCents()) * 100;
    }

    /**
     * Calculate payment velocity (days from order creation)
     */
    private function calculatePaymentVelocity(): int
    {
        $orderCreated = $this->order->getCreatedAt();
        $paymentReceived = $this->occurredAt;
        
        return $orderCreated->diff($paymentReceived)->days;
    }

    /**
     * Get next action required
     */
    private function getNextActionRequired(): string
    {
        if ($this->isFullPayment()) {
            return 'start_production';
        }
        
        if ($this->isDownPayment()) {
            return 'await_final_payment';
        }
        
        return 'await_additional_payment';
    }
}