<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Models\RefundApprovalWorkflow;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderPaymentTransactionEloquentModel;
use App\Domain\Payment\Enums\RefundStatus;
use App\Domain\Payment\Enums\RefundType;
use App\Domain\Payment\Enums\RefundReasonCategory;
use App\Domain\Payment\Enums\RefundMethod;
use App\Domain\Payment\Events\RefundRequested;
use App\Domain\Payment\Events\RefundApproved;
use App\Domain\Payment\Events\RefundRejected;
use App\Domain\Payment\Events\RefundCompleted;
use App\Domain\Payment\Events\RefundFailed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class RefundService
{
    public function __construct(
        protected RefundApprovalService $approvalService
    ) {}

    /**
     * Create a new refund request
     */
    public function createRefundRequest(array $data): PaymentRefund
    {
        return DB::transaction(function () use ($data) {
            $this->validateRefundRequest($data);

            $order = OrderEloquentModel::findOrFail($data['order_id']);
            $originalTransaction = OrderPaymentTransactionEloquentModel::findOrFail($data['original_transaction_id']);

            // Validate refund eligibility
            $this->validateRefundEligibility($order, $originalTransaction, $data['refund_amount']);

            // Create refund record
            $refund = PaymentRefund::create([
                'tenant_id' => app('current_tenant')->id,
                'order_id' => $data['order_id'],
                'original_transaction_id' => $data['original_transaction_id'],
                'customer_id' => $order->customer_id,
                'vendor_id' => $order->vendor_id,
                'refund_reference' => $this->generateRefundReference(),
                'type' => $this->determineRefundType($originalTransaction->amount, $data['refund_amount']),
                'status' => RefundStatus::PENDING->value,
                'refund_amount' => $data['refund_amount'],
                'original_amount' => $originalTransaction->amount,
                'currency' => $data['currency'] ?? $originalTransaction->currency,
                'refund_method' => $data['refund_method'] ?? RefundMethod::ORIGINAL_METHOD->value,
                'refund_details' => $data['refund_details'] ?? null,
                'reason_category' => $data['reason_category'],
                'reason' => $data['reason'],
                'internal_notes' => $data['internal_notes'] ?? null,
                'supporting_documents' => $data['supporting_documents'] ?? null,
                'initiated_by' => auth()->id(),
                'requested_at' => now(),
                'affects_vendor_payment' => $this->shouldAffectVendorPayment($data['reason_category'], $order),
                'is_disputed' => $data['is_disputed'] ?? false,
                'fee_amount' => $this->calculateRefundFee($data['refund_amount'], $data['refund_method']),
            ]);

            // Initialize approval workflow if required
            if ($this->requiresApproval($refund)) {
                $this->approvalService->initializeWorkflow($refund);
            } else {
                // Auto-approve for certain conditions
                $this->autoApproveRefund($refund);
            }

            // Fire event
            event(new RefundRequested($refund));

            Log::info('Refund request created', [
                'refund_id' => $refund->id,
                'order_id' => $refund->order_id,
                'amount' => $refund->refund_amount,
                'reason' => $refund->reason_category,
            ]);

            return $refund->fresh(['order', 'customer', 'originalTransaction']);
        });
    }

    /**
     * Process refund approval
     */
    public function approveRefund(PaymentRefund $refund, int $approvedBy, string $reason = null): bool
    {
        if (!$refund->canBeApproved()) {
            throw new \InvalidArgumentException('Refund cannot be approved in its current state');
        }

        return DB::transaction(function () use ($refund, $approvedBy, $reason) {
            $success = $refund->markAsApproved($approvedBy);

            if ($success) {
                // Complete any pending workflow steps
                $this->approvalService->completeCurrentStep($refund, 'approved', $approvedBy, $reason);

                // Fire event
                event(new RefundApproved($refund, $approvedBy));

                Log::info('Refund approved', [
                    'refund_id' => $refund->id,
                    'approved_by' => $approvedBy,
                    'reason' => $reason,
                ]);
            }

            return $success;
        });
    }

    /**
     * Reject refund request
     */
    public function rejectRefund(PaymentRefund $refund, int $rejectedBy, string $reason): bool
    {
        if (!$refund->canBeRejected()) {
            throw new \InvalidArgumentException('Refund cannot be rejected in its current state');
        }

        return DB::transaction(function () use ($refund, $rejectedBy, $reason) {
            $success = $refund->markAsRejected($rejectedBy, $reason);

            if ($success) {
                // Complete workflow as rejected
                $this->approvalService->completeCurrentStep($refund, 'rejected', $rejectedBy, $reason);

                // Fire event
                event(new RefundRejected($refund, $rejectedBy, $reason));

                Log::info('Refund rejected', [
                    'refund_id' => $refund->id,
                    'rejected_by' => $rejectedBy,
                    'reason' => $reason,
                ]);
            }

            return $success;
        });
    }

    /**
     * Process approved refund through payment gateway
     */
    public function processRefund(PaymentRefund $refund, int $processedBy): bool
    {
        if (!$refund->canBeProcessed()) {
            throw new \InvalidArgumentException('Refund cannot be processed in its current state');
        }

        return DB::transaction(function () use ($refund, $processedBy) {
            // Mark as processing
            $refund->markAsProcessing($processedBy);

            try {
                // Process through payment gateway
                $gatewayService = app(PaymentGatewayService::class);
                $gatewayResponse = $gatewayService->processRefund($refund);

                if ($gatewayResponse['success']) {
                    // Mark as completed
                    $refund->markAsCompleted($processedBy, $gatewayResponse['data']);

                    // Update order payment status if fully refunded
                    $this->updateOrderPaymentStatus($refund);

                    // Fire event
                    event(new RefundCompleted($refund, $gatewayResponse['data']));

                    Log::info('Refund completed successfully', [
                        'refund_id' => $refund->id,
                        'gateway_response' => $gatewayResponse['data'],
                    ]);

                    return true;
                } else {
                    // Mark as failed
                    $refund->markAsFailed(
                        $processedBy,
                        $gatewayResponse['error_code'],
                        $gatewayResponse['error_message']
                    );

                    // Fire event
                    event(new RefundFailed(
                        $refund,
                        $gatewayResponse['error_code'],
                        $gatewayResponse['error_message'],
                        $gatewayResponse['data'] ?? []
                    ));

                    Log::error('Refund processing failed', [
                        'refund_id' => $refund->id,
                        'error_code' => $gatewayResponse['error_code'],
                        'error_message' => $gatewayResponse['error_message'],
                    ]);

                    return false;
                }
            } catch (\Exception $e) {
                // Mark as failed with exception details
                $refund->markAsFailed($processedBy, 'PROCESSING_ERROR', $e->getMessage());

                // Fire event
                event(new RefundFailed($refund, 'PROCESSING_ERROR', $e->getMessage()));

                Log::error('Refund processing exception', [
                    'refund_id' => $refund->id,
                    'exception' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return false;
            }
        });
    }

    /**
     * Calculate total refunded amount for an order
     */
    public function getOrderRefundSummary(int $orderId): array
    {
        $order = OrderEloquentModel::findOrFail($orderId);
        
        $completedRefunds = PaymentRefund::where('order_id', $orderId)
            ->where('status', RefundStatus::COMPLETED->value)
            ->get();
            
        $pendingRefunds = PaymentRefund::where('order_id', $orderId)
            ->whereIn('status', [
                RefundStatus::PENDING->value,
                RefundStatus::PROCESSING->value,
                RefundStatus::APPROVED->value,
            ])
            ->get();

        $totalRefunded = $completedRefunds->sum('refund_amount');
        $totalPending = $pendingRefunds->sum('refund_amount');
        $totalRefundable = max(0, $order->total_amount - $totalRefunded - $totalPending);

        return [
            'order_total' => $order->total_amount,
            'total_refunded' => $totalRefunded,
            'total_pending' => $totalPending,
            'total_refundable' => $totalRefundable,
            'refund_percentage' => $order->total_amount > 0 ? ($totalRefunded / $order->total_amount) * 100 : 0,
            'is_fully_refunded' => $totalRefunded >= $order->total_amount,
            'completed_refunds_count' => $completedRefunds->count(),
            'pending_refunds_count' => $pendingRefunds->count(),
        ];
    }

    /**
     * Validate refund request data
     */
    protected function validateRefundRequest(array $data): void
    {
        if (empty($data['order_id']) || empty($data['original_transaction_id'])) {
            throw new ValidationException(['order' => 'Order and transaction are required']);
        }

        if (empty($data['refund_amount']) || $data['refund_amount'] <= 0) {
            throw new ValidationException(['refund_amount' => 'Refund amount must be greater than zero']);
        }

        if (empty($data['reason_category']) || empty($data['reason'])) {
            throw new ValidationException(['reason' => 'Refund reason is required']);
        }

        // Validate reason category
        try {
            RefundReasonCategory::fromString($data['reason_category']);
        } catch (\ValueError $e) {
            throw new ValidationException(['reason_category' => 'Invalid reason category']);
        }

        // Validate refund method if provided
        if (!empty($data['refund_method'])) {
            try {
                RefundMethod::fromString($data['refund_method']);
            } catch (\ValueError $e) {
                throw new ValidationException(['refund_method' => 'Invalid refund method']);
            }
        }
    }

    /**
     * Validate refund eligibility
     */
    protected function validateRefundEligibility(OrderEloquentModel $order, OrderPaymentTransactionEloquentModel $transaction, int $refundAmount): void
    {
        // Check if order can be refunded
        if (!$order->canBeRefunded()) {
            throw new ValidationException(['order' => 'This order is not eligible for refunds']);
        }

        // Check if transaction was successful
        if ($transaction->status !== 'completed') {
            throw new ValidationException(['transaction' => 'Can only refund completed transactions']);
        }

        // Check refund amount limits
        $refundSummary = $this->getOrderRefundSummary($order->id);
        
        if ($refundAmount > $refundSummary['total_refundable']) {
            throw new ValidationException([
                'refund_amount' => "Cannot refund more than {$refundSummary['total_refundable']} (available amount)"
            ]);
        }

        // Check minimum refund amount (e.g., IDR 10 = 1000 cents)
        $minimumRefund = 1000;
        if ($refundAmount < $minimumRefund) {
            throw new ValidationException([
                'refund_amount' => "Minimum refund amount is {$minimumRefund} cents"
            ]);
        }
    }

    /**
     * Generate unique refund reference
     */
    protected function generateRefundReference(): string
    {
        do {
            $reference = 'REF-' . strtoupper(\Illuminate\Support\Str::random(10));
        } while (PaymentRefund::where('refund_reference', $reference)->exists());

        return $reference;
    }

    /**
     * Determine if refund is full or partial
     */
    protected function determineRefundType(int $originalAmount, int $refundAmount): string
    {
        return $refundAmount >= $originalAmount ? RefundType::FULL->value : RefundType::PARTIAL->value;
    }

    /**
     * Check if refund should affect vendor payment
     */
    protected function shouldAffectVendorPayment(string $reasonCategory, OrderEloquentModel $order): bool
    {
        $reason = RefundReasonCategory::fromString($reasonCategory);
        
        // No vendor involvement if order doesn't have a vendor
        if (!$order->vendor_id) {
            return false;
        }

        return $reason->affectsVendorPayment();
    }

    /**
     * Calculate refund processing fee
     */
    protected function calculateRefundFee(int $refundAmount, string $refundMethod): int
    {
        $method = RefundMethod::fromString($refundMethod);
        
        return match ($method) {
            RefundMethod::ORIGINAL_METHOD => intval($refundAmount * 0.025), // 2.5% gateway fee
            RefundMethod::BANK_TRANSFER => 5000, // Fixed IDR 50 bank transfer fee
            RefundMethod::CASH => 0, // No fee for cash
            RefundMethod::STORE_CREDIT => 0, // No fee for store credit
            RefundMethod::MANUAL => 10000, // Fixed IDR 100 manual processing fee
        };
    }

    /**
     * Check if refund requires approval workflow
     */
    protected function requiresApproval(PaymentRefund $refund): bool
    {
        $reasonCategory = RefundReasonCategory::fromString($refund->reason_category);
        
        // Some categories don't require approval
        if (!$reasonCategory->requiresApproval()) {
            return false;
        }

        // High value refunds always require approval
        $highValueThreshold = 1000000; // IDR 10,000
        if ($refund->refund_amount >= $highValueThreshold) {
            return true;
        }

        // Disputed refunds require approval
        if ($refund->is_disputed) {
            return true;
        }

        // Default behavior based on tenant settings
        return true;
    }

    /**
     * Auto-approve refund for eligible cases
     */
    protected function autoApproveRefund(PaymentRefund $refund): void
    {
        $refund->markAsApproved(auth()->id());
        
        Log::info('Refund auto-approved', [
            'refund_id' => $refund->id,
            'reason_category' => $refund->reason_category,
            'amount' => $refund->refund_amount,
        ]);
    }

    /**
     * Update order payment status based on refund completion
     */
    protected function updateOrderPaymentStatus(PaymentRefund $refund): void
    {
        $order = $refund->order;
        $refundSummary = $this->getOrderRefundSummary($order->id);

        if ($refundSummary['is_fully_refunded']) {
            $order->update(['payment_status' => 'refunded']);
            Log::info('Order marked as fully refunded', ['order_id' => $order->id]);
        } elseif ($refundSummary['total_refunded'] > 0) {
            $order->update(['payment_status' => 'partially_refunded']);
            Log::info('Order marked as partially refunded', ['order_id' => $order->id]);
        }
    }

    /**
     * Get refund statistics for a tenant
     */
    public function getRefundStatistics(string $tenantId, \Carbon\Carbon $startDate = null, \Carbon\Carbon $endDate = null): array
    {
        $query = PaymentRefund::where('tenant_id', $tenantId);

        if ($startDate) {
            $query->where('requested_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->where('requested_at', '<=', $endDate);
        }

        $refunds = $query->get();

        return [
            'total_refunds' => $refunds->count(),
            'total_amount' => $refunds->sum('refund_amount'),
            'average_amount' => $refunds->avg('refund_amount'),
            'by_status' => $refunds->groupBy('status')->map->count()->toArray(),
            'by_reason' => $refunds->groupBy('reason_category')->map->count()->toArray(),
            'by_method' => $refunds->groupBy('refund_method')->map->count()->toArray(),
            'completion_rate' => $refunds->count() > 0 ? ($refunds->where('status', 'completed')->count() / $refunds->count()) * 100 : 0,
            'average_processing_time' => $this->calculateAverageProcessingTime($refunds->where('status', 'completed')),
        ];
    }

    /**
     * Calculate average processing time for completed refunds
     */
    protected function calculateAverageProcessingTime($completedRefunds): ?float
    {
        $processingTimes = $completedRefunds->filter(function ($refund) {
            return $refund->requested_at && $refund->completed_at;
        })->map(function ($refund) {
            return $refund->requested_at->diffInHours($refund->completed_at);
        });

        return $processingTimes->count() > 0 ? $processingTimes->avg() : null;
    }
}