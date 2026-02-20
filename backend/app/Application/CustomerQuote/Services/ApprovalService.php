<?php

namespace App\Application\CustomerQuote\Services;

use App\Domain\CustomerQuote\Repositories\ApprovalSettingsRepositoryInterface;
use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Domain\CustomerQuote\ValueObjects\ApprovalDecision;
use App\Domain\CustomerQuote\ValueObjects\ApprovalSettings as ApprovalSettingsVO;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Application Service for Quote Approval Management
 * 
 * Handles hybrid approval logic:
 * - Auto-approval for low-risk quotes
 * - Manual approval for high-risk quotes
 * - Trust score calculation
 * - Approval settings management
 */
class ApprovalService
{
    public function __construct(
        private ApprovalSettingsRepositoryInterface $settingsRepository,
        private TrustScoreCalculator $trustScoreCalculator,
        private CustomerNotificationService $notificationService,
        private PaymentTrackingService $paymentTrackingService
    ) {}

    /**
     * Process customer quote acceptance with hybrid approval logic
     */
    public function processAcceptance(CustomerQuote $quote): array
    {
        return DB::transaction(function () use ($quote) {
            // Get approval settings
            $settings = $this->settingsRepository->getByTenantId($quote->tenant_id);

            if (!$settings || !$settings->isAutoApprovalEnabled()) {
                // Auto-approval disabled, go to manual
                return $this->requireManualApproval($quote, 'Auto-approval is disabled');
            }

            // Check if should auto-approve
            $decision = $this->shouldAutoApprove($quote, $settings);

            if ($decision->shouldAutoApprove()) {
                return $this->autoApprove($quote, $settings);
            }

            return $this->requireManualApproval($quote, $decision->getReason());
        });
    }

    /**
     * Determine if quote should be auto-approved
     */
    public function shouldAutoApprove(CustomerQuote $quote, ApprovalSettingsVO $settings): ApprovalDecision
    {
        $reasons = [];

        // Check 1: Order value threshold
        if ($quote->grand_total > $settings->getAutoApprovalThreshold()) {
            $reasons[] = sprintf(
                'Order value (Rp %s) exceeds threshold (Rp %s)',
                number_format($quote->grand_total / 100, 0, ',', '.'),
                number_format($settings->getAutoApprovalThreshold() / 100, 0, ',', '.')
            );
        }

        // Check 2: Customer trust level
        $customer = $quote->order->customer;
        
        if ($settings->requiresEmailVerification() && !$customer->email_verified_at) {
            $reasons[] = 'Customer email not verified';
        }

        $successfulOrders = $customer->orders()
            ->where('status', 'completed')
            ->count();

        if ($successfulOrders < $settings->getMinSuccessfulOrders()) {
            $reasons[] = sprintf(
                'Customer has %d successful orders (minimum: %d)',
                $successfulOrders,
                $settings->getMinSuccessfulOrders()
            );
        }

        // Calculate payment success rate
        $totalOrders = $customer->orders()->count();
        $paidOrders = $customer->orders()
            ->whereIn('status', ['paid', 'processing', 'completed'])
            ->count();
        
        $paymentSuccessRate = $totalOrders > 0 ? ($paidOrders / $totalOrders) * 100 : 0;

        if ($paymentSuccessRate < $settings->getMinPaymentSuccessRate()) {
            $reasons[] = sprintf(
                'Payment success rate %.1f%% below minimum %.1f%%',
                $paymentSuccessRate,
                $settings->getMinPaymentSuccessRate()
            );
        }

        // Check 3: Product type rules
        $order = $quote->order;
        $hasCustomProducts = $this->orderHasCustomProducts($order);

        if ($hasCustomProducts && $settings->requiresApprovalForCustomProducts()) {
            $reasons[] = 'Order contains custom products requiring approval';
        }

        // If any reasons exist, require manual approval
        if (!empty($reasons)) {
            return ApprovalDecision::manualApproval(implode('; ', $reasons));
        }

        return ApprovalDecision::autoApprove();
    }

    /**
     * Calculate customer trust score
     */
    public function calculateTrustScore(int $customerId): float
    {
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::find($customerId);
        
        if (!$customer) {
            return 0.0;
        }

        $successfulOrders = $customer->orders()
            ->where('status', 'completed')
            ->count();

        $totalOrders = $customer->orders()->count();
        $paidOrders = $customer->orders()
            ->whereIn('status', ['paid', 'processing', 'completed'])
            ->count();
        
        $paymentSuccessRate = $totalOrders > 0 ? ($paidOrders / $totalOrders) * 100 : 0;

        return $this->trustScoreCalculator->calculate(
            (bool) $customer->email_verified_at,
            $successfulOrders,
            $paymentSuccessRate
        );
    }

    /**
     * Get pending approvals for tenant
     */
    public function getPendingApprovals(int $tenantId): \Illuminate\Database\Eloquent\Collection
    {
        return CustomerQuote::where('tenant_id', $tenantId)
            ->where('status', 'pending_approval')
            ->with(['order.customer', 'vendorQuote'])
            ->orderBy('customer_accepted_at', 'asc')
            ->get();
    }

    /**
     * Manually approve quote
     */
    public function approveQuote(
        string $quoteUuid,
        int $approvedBy,
        ?string $notes = null,
        ?Carbon $paymentDueDate = null
    ): CustomerQuote {
        return DB::transaction(function () use ($quoteUuid, $approvedBy, $notes, $paymentDueDate) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            if ($quote->status !== 'pending_approval') {
                throw new \DomainException('Only pending quotes can be approved');
            }

            // Update quote
            $quote->update([
                'status' => 'accepted',
                'approved_at' => now(),
                'approved_by' => $approvedBy,
                'approval_notes' => $notes,
                'approval_method' => 'manual',
            ]);

            // Calculate payment amounts (DP 50% + Balance 50%)
            $dpAmount = (int)($quote->grand_total * 0.5);
            $balanceAmount = $quote->grand_total - $dpAmount;
            $dueDate = $paymentDueDate ?? now()->addDays(3);

            // Update order status and payment schedule
            $quote->order->update([
                'status' => 'awaiting_payment',
                'payment_status' => 'unpaid',
                'down_payment_amount' => $dpAmount,
                'down_payment_due_at' => $dueDate,
                'payment_schedule' => [
                    [
                        'type' => 'dp_50',
                        'amount' => $dpAmount,
                        'percentage' => 50,
                        'due_date' => $dueDate->toDateString(),
                        'description' => 'Down Payment 50%',
                        'status' => 'pending',
                    ],
                    [
                        'type' => 'balance_50',
                        'amount' => $balanceAmount,
                        'percentage' => 50,
                        'due_date' => null, // Set after DP paid
                        'description' => 'Balance Payment 50%',
                        'status' => 'pending',
                    ],
                ],
            ]);

            // Initialize payment tracking
            $paymentTransactions = $this->paymentTrackingService->initializePaymentTracking($quote);

            // Add history
            $history = $quote->history ?? [];
            $history[] = [
                'action' => 'manually_approved',
                'actor_type' => 'admin',
                'actor_id' => $approvedBy,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'notes' => $notes,
                    'payment_due_date' => $dueDate->toIso8601String(),
                    'payment_initiated' => true,
                    'dp_amount' => $dpAmount,
                    'dp_transaction_uuid' => $paymentTransactions['dp_transaction']->uuid,
                    'balance_transaction_uuid' => $paymentTransactions['balance_transaction']->uuid,
                ],
            ];
            $quote->update(['history' => $history]);

            // Create notification for customer with payment instructions
            $this->notificationService->notifyQuoteAccepted($quote);

            // TODO: Send payment instructions email to customer
            // dispatch(new SendPaymentInstructionsJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Manually reject quote
     */
    public function rejectQuote(
        string $quoteUuid,
        int $rejectedBy,
        string $reason
    ): CustomerQuote {
        if (strlen($reason) < 20) {
            throw new \InvalidArgumentException('Rejection reason must be at least 20 characters');
        }

        return DB::transaction(function () use ($quoteUuid, $rejectedBy, $reason) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            if ($quote->status !== 'pending_approval') {
                throw new \DomainException('Only pending quotes can be rejected');
            }

            $quote->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejected_by' => $rejectedBy,
                'rejection_reason' => $reason,
                'approval_method' => 'manual',
            ]);

            // Revert order status
            $quote->order->update([
                'status' => 'customer_quote',
            ]);

            // Add history
            $history = $quote->history ?? [];
            $history[] = [
                'action' => 'manually_rejected',
                'actor_type' => 'admin',
                'actor_id' => $rejectedBy,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'reason' => $reason,
                ],
            ];
            $quote->update(['history' => $history]);

            // TODO: Notify customer
            // dispatch(new NotifyCustomerQuoteRejectedJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Get approval settings for tenant
     */
    public function getSettings(int $tenantId): ?ApprovalSettingsVO
    {
        return $this->settingsRepository->getByTenantId($tenantId);
    }

    /**
     * Update approval settings
     */
    public function updateSettings(int $tenantId, array $data): \App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings
    {
        return DB::transaction(function () use ($tenantId, $data) {
            $settings = \App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings::where('tenant_id', $tenantId)->first();

            if (!$settings) {
                $data['tenant_id'] = $tenantId;
                $settings = \App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings::create($data);
            } else {
                $settings->update($data);
                $settings = $settings->fresh();
            }

            // Clear cache after updating settings
            \Illuminate\Support\Facades\Cache::forget('approval_settings:' . $tenantId);

            return $settings;
        });
    }

    /**
     * Auto-approve quote
     */
    private function autoApprove(CustomerQuote $quote, ApprovalSettingsVO $settings): array
    {
        $quote->update([
            'status' => 'accepted',
            'approved_at' => now(),
            'approval_method' => 'auto',
        ]);

        // Calculate payment amounts (DP 50% + Balance 50%)
        $dpAmount = (int)($quote->grand_total * 0.5);
        $balanceAmount = $quote->grand_total - $dpAmount;

        // Update order status and payment schedule
        $quote->order->update([
            'status' => 'awaiting_payment',
            'payment_status' => 'unpaid',
            'down_payment_amount' => $dpAmount,
            'down_payment_due_at' => now()->addDays(3),
            'payment_schedule' => [
                [
                    'type' => 'dp_50',
                    'amount' => $dpAmount,
                    'percentage' => 50,
                    'due_date' => now()->addDays(3)->toDateString(),
                    'description' => 'Down Payment 50%',
                    'status' => 'pending',
                ],
                [
                    'type' => 'balance_50',
                    'amount' => $balanceAmount,
                    'percentage' => 50,
                    'due_date' => null, // Set after DP paid
                    'description' => 'Balance Payment 50%',
                    'status' => 'pending',
                ],
            ],
        ]);

        // Initialize payment tracking
        $paymentTransactions = $this->paymentTrackingService->initializePaymentTracking($quote);

        // Add history
        $history = $quote->history ?? [];
        $history[] = [
            'action' => 'auto_approved',
            'actor_type' => 'system',
            'actor_id' => null,
            'timestamp' => now()->toIso8601String(),
            'details' => [
                'trust_score' => $this->calculateTrustScore($quote->order->customer_id),
                'payment_initiated' => true,
                'dp_amount' => $dpAmount,
                'dp_due_date' => now()->addDays(3)->toDateString(),
                'dp_transaction_uuid' => $paymentTransactions['dp_transaction']->uuid,
                'balance_transaction_uuid' => $paymentTransactions['balance_transaction']->uuid,
            ],
        ];
        $quote->update(['history' => $history]);

        // Create notification for customer with payment instructions
        $this->notificationService->notifyQuoteAccepted($quote);

        // Notify admin if enabled
        if ($settings->shouldNotifyAdminOnAutoApprove()) {
            // TODO: dispatch(new NotifyAdminAutoApprovalJob($quote));
        }

        // TODO: Send payment instructions email to customer
        // dispatch(new SendPaymentInstructionsJob($quote));

        return [
            'method' => 'auto',
            'requires_manual_approval' => false,
            'payment_initiated' => true,
            'dp_amount' => $dpAmount,
            'dp_due_date' => now()->addDays(3)->toDateString(),
            'dp_transaction_uuid' => $paymentTransactions['dp_transaction']->uuid,
            'balance_transaction_uuid' => $paymentTransactions['balance_transaction']->uuid,
        ];
    }

    /**
     * Require manual approval
     */
    private function requireManualApproval(CustomerQuote $quote, string $reason): array
    {
        $quote->update([
            'status' => 'pending_approval',
            'approval_method' => 'manual',
            'approval_reason' => $reason, // Store the reason
        ]);

        // Add history
        $history = $quote->history ?? [];
        $history[] = [
            'action' => 'pending_manual_approval',
            'actor_type' => 'system',
            'actor_id' => null,
            'timestamp' => now()->toIso8601String(),
            'details' => [
                'reason' => $reason,
            ],
        ];
        $quote->update(['history' => $history]);

        // Create notification for customer
        $this->notificationService->notifyQuotePendingApproval($quote);

        // TODO: Notify admin
        // dispatch(new NotifyAdminPendingApprovalJob($quote, $reason));

        return [
            'method' => 'manual',
            'requires_manual_approval' => true,
            'reason' => $reason,
        ];
    }

    /**
     * Check if order has custom products
     */
    private function orderHasCustomProducts(Order $order): bool
    {
        // Check order items for custom products
        $items = $order->items ?? [];
        
        foreach ($items as $item) {
            if (isset($item['is_custom']) && $item['is_custom']) {
                return true;
            }
        }

        return false;
    }
}
