<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\ProcessPaymentCommand;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Order\Events\PaymentReceived;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use InvalidArgumentException;

/**
 * Process Payment Use Case
 * 
 * Handles the business logic for processing order payments.
 * Validates payment amounts and updates order status.
 * 
 * Database Integration:
 * - Creates record in order_payment_transactions table
 * - Updates orders.total_paid_amount field
 * - Updates orders.payment_status based on amount paid
 */
class ProcessPaymentUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private EventDispatcher $eventDispatcher
    ) {}

    /**
     * Execute the use case
     */
    public function execute(ProcessPaymentCommand $command): array
    {
        // 1. Validate command
        $errors = $command->validate();
        if (!empty($errors)) {
            throw new InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // 2. Find and validate order
        $orderUuid = new UuidValueObject($command->orderUuid);
        $order = $this->orderRepository->findById($orderUuid);
        
        if (!$order) {
            throw new InvalidArgumentException('Order not found');
        }

        // 3. Validate order can receive payments
        if (!$order->canReceivePayment()) {
            throw new InvalidArgumentException(
                "Cannot process payment for order in status: {$order->getStatus()}"
            );
        }

        // 4. Create payment amount
        $paymentAmount = Money::fromCents($command->amount);

        // 5. Validate payment amount
        $this->validatePaymentAmount($order, $paymentAmount, $command);

        // 6. Process payment on order entity
        $order->recordPayment(
            $paymentAmount,
            $command->method,
            $command->reference,
            $command->type
        );

        // 7. Save order
        $savedOrder = $this->orderRepository->save($order);

        // 8. Create payment transaction record
        $transaction = $this->createPaymentTransaction($command, $order);

        // 9. Dispatch domain events
        $this->eventDispatcher->dispatch(new PaymentReceived(
            $savedOrder,
            $paymentAmount,
            $command->method,
            $command->reference,
            $transaction
        ));

        return [
            'order' => $savedOrder,
            'transaction' => $transaction,
            'payment_status' => $savedOrder->getPaymentStatus(),
            'remaining_amount' => $savedOrder->getRemainingAmount(),
        ];
    }

    /**
     * Validate payment amount against business rules
     */
    private function validatePaymentAmount(
        PurchaseOrder $order,
        Money $paymentAmount,
        ProcessPaymentCommand $command
    ): void {
        // Cannot pay more than order total
        $totalAmount = $order->getTotalAmount();
        $currentPaid = $order->getTotalPaidAmount();
        $remainingAmount = $totalAmount->subtract($currentPaid);

        if ($paymentAmount->isGreaterThan($remainingAmount)) {
            throw new InvalidArgumentException(
                "Payment amount ({$paymentAmount->format()}) exceeds remaining balance ({$remainingAmount->format()})"
            );
        }

        // Down payment validation
        if ($command->isDownPayment()) {
            $minimumDownPayment = $totalAmount->percentage(50); // 50% minimum
            
            if ($paymentAmount->isLessThan($minimumDownPayment)) {
                throw new InvalidArgumentException(
                    "Down payment must be at least 50% of order total ({$minimumDownPayment->format()})"
                );
            }
        }

        // Final payment validation
        if ($command->isFinalPayment()) {
            if (!$paymentAmount->equals($remainingAmount)) {
                throw new InvalidArgumentException(
                    "Final payment must equal remaining balance ({$remainingAmount->format()})"
                );
            }
        }

        // Refund validation
        if ($command->isRefund()) {
            if ($paymentAmount->isGreaterThan($currentPaid)) {
                throw new InvalidArgumentException(
                    "Refund amount cannot exceed total paid ({$currentPaid->format()})"
                );
            }
        }
    }

    /**
     * Create payment transaction record
     */
    private function createPaymentTransaction(
        ProcessPaymentCommand $command,
        PurchaseOrder $order
    ): OrderPaymentTransaction {
        $transactionData = $command->toTransactionArray(
            $order->getTenantId()->getValue(),
            $order->getCustomerId()->getValue()
        );

        $transactionData['order_id'] = $order->getId()->getValue();
        $transactionData['uuid'] = UuidValueObject::generate()->getValue();

        return OrderPaymentTransaction::create($transactionData);
    }

    /**
     * Determine new order status based on payment
     */
    private function determineNewOrderStatus(
        PurchaseOrder $order,
        ProcessPaymentCommand $command
    ): string {
        if ($command->isRefund()) {
            return 'refunded';
        }

        $totalAmount = $order->getTotalAmount();
        $newPaidAmount = $order->getTotalPaidAmount()->add(Money::fromCents($command->amount));

        if ($newPaidAmount->equals($totalAmount)) {
            return 'full_payment';
        }

        if ($newPaidAmount->isGreaterThan(Money::zero())) {
            return 'partial_payment';
        }

        return $order->getStatus(); // No change
    }
}