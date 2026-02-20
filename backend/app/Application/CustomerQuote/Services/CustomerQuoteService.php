<?php

namespace App\Application\CustomerQuote\Services;

use App\Domain\CustomerQuote\Entities\CustomerQuote as CustomerQuoteEntity;
use App\Domain\CustomerQuote\Repositories\CustomerQuoteRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\ApprovalSettingsRepositoryInterface;
use App\Domain\CustomerQuote\Services\PricingCalculatorService;
use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Domain\CustomerQuote\Services\QuoteExpirationChecker;
use App\Domain\CustomerQuote\Services\NegotiationRoundValidator;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Application Service for Customer Quote Management
 * 
 * Handles customer quote lifecycle:
 * - Creation from vendor quotes
 * - Sending to customers
 * - Acceptance/rejection
 * - Negotiation rounds
 */
class CustomerQuoteService
{
    public function __construct(
        private CustomerQuoteRepositoryInterface $quoteRepository,
        private ApprovalSettingsRepositoryInterface $settingsRepository,
        private PricingCalculatorService $pricingCalculator,
        private TrustScoreCalculator $trustScoreCalculator,
        private QuoteExpirationChecker $expirationChecker,
        private NegotiationRoundValidator $negotiationValidator,
        private CustomerNotificationService $notificationService,
        private CustomerQuoteMonitoringService $monitoringService
    ) {}

    /**
     * Create customer quote from accepted vendor quote
     */
    public function createFromVendorQuote(
        int $tenantId,
        int $orderId,
        int $vendorQuoteId,
        array $additionalCosts,
        array $terms,
        int $createdBy
    ): CustomerQuote {
        return DB::transaction(function () use (
            $tenantId,
            $orderId,
            $vendorQuoteId,
            $additionalCosts,
            $terms,
            $createdBy
        ) {
            // Load vendor quote
            $vendorQuote = VendorQuote::findOrFail($vendorQuoteId);
            
            // Calculate pricing
            $pricing = $this->pricingCalculator->calculateCustomerPricing(
                vendorTotalCost: (int)($vendorQuote->amount * 100), // Convert to cents
                profitPercentage: $additionalCosts['profit_percentage'] ?? 20.00,
                additionalCosts: $additionalCosts,
                taxRate: ($terms['tax_rate'] ?? 11.00) / 100 // Convert percentage to decimal
            );

            // Convert PricingBreakdown to array
            $pricingArray = $pricing->toArray();

            // Generate quote number
            $quoteNumber = $this->generateQuoteNumber($tenantId);

            // Get approval settings for max negotiation rounds
            $settings = $this->settingsRepository->getByTenantId($tenantId);
            $maxNegotiationRounds = $settings?->max_negotiation_rounds ?? 3;

            // Create quote
            $quote = CustomerQuote::create([
                'tenant_id' => $tenantId,
                'order_id' => $orderId,
                'vendor_quote_id' => $vendorQuoteId,
                'quote_number' => $quoteNumber,
                'title' => $terms['title'] ?? 'Customer Quotation',
                'vendor_total_cost' => (int)($vendorQuote->amount * 100),
                'base_profit_amount' => $pricingArray['base_profit_amount'],
                'base_profit_percentage' => $pricingArray['base_profit_percentage'],
                'additional_costs' => $additionalCosts,
                'subtotal' => $pricingArray['subtotal'],
                'tax_rate' => $pricingArray['tax_rate'] * 100, // Convert back to percentage for storage
                'tax_amount' => $pricingArray['tax_amount'],
                'grand_total' => $pricingArray['grand_total'],
                'total_profit_amount' => $pricingArray['total_profit_amount'],
                'total_profit_percentage' => $pricingArray['total_profit_percentage'],
                'valid_until' => $terms['valid_until'] ?? Carbon::now()->addDays(7),
                'payment_terms' => $terms['payment_terms'] ?? 'DP 50% + Balance 50%',
                'delivery_timeline' => $terms['delivery_timeline'] ?? null,
                'terms_conditions' => $terms['terms_conditions'] ?? null,
                'max_negotiation_rounds' => $maxNegotiationRounds,
                'status' => 'draft',
                'created_by' => $createdBy,
                'history' => [],
                'metadata' => [
                    'created_from' => 'vendor_quote',
                    'vendor_quote_id' => $vendorQuoteId,
                ],
            ]);

            // Add history entry
            $quote->addHistoryEntry([
                'action' => 'quote_created',
                'actor_type' => 'admin',
                'actor_id' => $createdBy,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'vendor_quote_id' => $vendorQuoteId,
                    'grand_total' => $pricingArray['grand_total'],
                ],
            ]);

            // Log monitoring
            $this->monitoringService->logQuoteAction(
                'quote_created',
                $quote->id,
                $createdBy,
                null,
                [
                    'quote_number' => $quoteNumber,
                    'grand_total' => $pricingArray['grand_total'],
                    'vendor_quote_id' => $vendorQuoteId,
                ]
            );

            return $quote;
        });
    }

    /**
     * Send quote to customer via email
     */
    public function sendToCustomer(string $quoteUuid, int $sentBy): CustomerQuote
    {
        return DB::transaction(function () use ($quoteUuid, $sentBy) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            // Validate quote can be sent
            if ($quote->status !== 'draft') {
                throw new \DomainException('Only draft quotes can be sent');
            }

            if ($this->expirationChecker->isExpired($quote->valid_until)) {
                throw new \DomainException('Cannot send expired quote');
            }

            // Update quote status
            $quote->update([
                'status' => 'sent',
                'sent_at' => now(),
                'sent_by' => $sentBy,
            ]);

            // Add history entry
            $quote->addHistoryEntry([
                'action' => 'quote_sent',
                'actor_type' => 'admin',
                'actor_id' => $sentBy,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'sent_to' => $quote->order->customer->email ?? 'N/A',
                ],
            ]);

            // Log monitoring
            $this->monitoringService->logQuoteAction(
                'quote_sent',
                $quote->id,
                $sentBy,
                null,
                [
                    'quote_number' => $quote->quote_number,
                    'sent_to' => $quote->order->customer->email ?? 'N/A',
                ]
            );

            // Create notification for customer
            $this->notificationService->notifyQuoteSent($quote);

            // TODO: Dispatch email job
            // dispatch(new SendQuoteEmailJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Get quote by ID
     */
    public function getById(int $id): ?CustomerQuote
    {
        return CustomerQuote::find($id);
    }

    /**
     * Get quote by UUID
     */
    public function getByUuid(string $uuid): ?CustomerQuote
    {
        return CustomerQuote::where('uuid', $uuid)->first();
    }

    /**
     * Get all quotes for a specific customer
     */
    public function getCustomerQuotes(int $customerId): \Illuminate\Database\Eloquent\Collection
    {
        return CustomerQuote::whereHas('order', function ($query) use ($customerId) {
            $query->where('customer_id', $customerId);
        })
        ->with(['order', 'vendorQuote', 'documents'])
        ->orderBy('created_at', 'desc')
        ->get();
    }

    /**
     * Get quote by response token (for customer portal)
     */
    public function getByToken(string $token): ?CustomerQuote
    {
        $quote = CustomerQuote::where('response_token', $token)->first();

        if (!$quote) {
            return null;
        }

        // Check if quote is expired
        if ($this->expirationChecker->isExpired($quote->valid_until)) {
            return $quote; // Return but caller should check isExpired()
        }

        return $quote;
    }

    /**
     * Mark quote as viewed by customer
     */
    public function markAsViewed(string $quoteUuid): CustomerQuote
    {
        $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

        if (!$quote->viewed_at) {
            $quote->update([
                'viewed_at' => now(),
            ]);

            $quote->addHistoryEntry([
                'action' => 'quote_viewed',
                'actor_type' => 'customer',
                'actor_id' => $quote->order->customer_id,
                'timestamp' => now()->toIso8601String(),
            ]);
        }

        return $quote->fresh();
    }

    /**
     * Accept quote (customer acceptance)
     */
    public function acceptQuote(
        string $quoteUuid,
        int $customerId,
        bool $termsAccepted
    ): array {
        if (!$termsAccepted) {
            throw new \DomainException('Terms and conditions must be accepted');
        }

        return DB::transaction(function () use ($quoteUuid, $customerId) {
            $quote = CustomerQuote::with(['order.customer'])
                ->where('uuid', $quoteUuid)
                ->firstOrFail();

            // Validate quote can be accepted
            if (!$quote->canBeAccepted()) {
                throw new \DomainException('Quote cannot be accepted in current state');
            }

            // Record customer acceptance
            $quote->update([
                'customer_accepted_at' => now(),
                'accepted_by' => $customerId,
            ]);

            $quote->addHistoryEntry([
                'action' => 'customer_accepted',
                'actor_type' => 'customer',
                'actor_id' => $customerId,
                'timestamp' => now()->toIso8601String(),
            ]);

            // Determine approval path (auto vs manual)
            $approvalResult = app(ApprovalService::class)->processAcceptance($quote);

            // Log monitoring
            $this->monitoringService->logQuoteAcceptance(
                $quote->id,
                $approvalResult['method'],
                $approvalResult['reason'] ?? null,
                [
                    'customer_id' => $customerId,
                    'requires_manual_approval' => $approvalResult['requires_manual_approval'],
                ]
            );

            return [
                'quote' => $quote->fresh(),
                'approval_method' => $approvalResult['method'],
                'requires_manual_approval' => $approvalResult['requires_manual_approval'],
                'reason' => $approvalResult['reason'] ?? null,
            ];
        });
    }

    /**
     * Reject quote (customer rejection)
     */
    public function rejectQuote(
        string $quoteUuid,
        int $customerId,
        string $reason
    ): CustomerQuote {
        return DB::transaction(function () use ($quoteUuid, $customerId, $reason) {
            $quote = CustomerQuote::where('uuid', $quoteUuid)->firstOrFail();

            // Validate quote can be rejected
            if (!in_array($quote->status, ['sent', 'countered'])) {
                throw new \DomainException('Quote cannot be rejected in current state');
            }

            $quote->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                // Note: rejected_by is for admin users, not customers
                // Customer rejection is tracked via history
                'rejection_reason' => $reason,
            ]);

            $quote->addHistoryEntry([
                'action' => 'customer_rejected',
                'actor_type' => 'customer',
                'actor_id' => $customerId,
                'timestamp' => now()->toIso8601String(),
                'details' => [
                    'reason' => $reason,
                ],
            ]);

            // Log monitoring
            $this->monitoringService->logQuoteRejection(
                $quote->id,
                'customer',
                $reason,
                [
                    'customer_id' => $customerId,
                    'quote_number' => $quote->quote_number,
                ]
            );

            // TODO: Notify admin
            // dispatch(new NotifyAdminQuoteRejectedJob($quote));

            return $quote->fresh();
        });
    }

    /**
     * Generate unique quote number
     */
    private function generateQuoteNumber(int $tenantId): string
    {
        $year = date('Y');
        $month = date('m');
        
        // Get last quote number for this tenant/year/month
        $lastQuote = CustomerQuote::where('tenant_id', $tenantId)
            ->where('quote_number', 'like', "CQ-{$year}{$month}-%")
            ->orderBy('id', 'desc')
            ->first();

        if ($lastQuote) {
            // Extract sequence number and increment
            $parts = explode('-', $lastQuote->quote_number);
            $sequence = (int)end($parts) + 1;
        } else {
            $sequence = 1;
        }

        return sprintf('CQ-%s%s-%04d', $year, $month, $sequence);
    }
}
