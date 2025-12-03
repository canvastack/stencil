<?php

namespace App\Application\Order\Services;

use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;
use DateTime;

class VendorNegotiationService
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private VendorRepositoryInterface $vendorRepository
    ) {}

    public function startNegotiation(string $tenantId, string $orderId, string $vendorId): array
    {
        $order = $this->orderRepository->findById(new UuidValueObject($orderId));

        if (!$order) {
            throw new InvalidArgumentException("Order not found with ID: {$orderId}");
        }

        if (!$order->getTenantId()->equals(new UuidValueObject($tenantId))) {
            throw new InvalidArgumentException('Order belongs to different tenant');
        }

        $vendor = $this->vendorRepository->findById(new UuidValueObject($vendorId));

        if (!$vendor) {
            throw new InvalidArgumentException("Vendor not found with ID: {$vendorId}");
        }

        if ($vendor->getTenantId() && !$vendor->getTenantId()->equals(new UuidValueObject($tenantId))) {
            throw new InvalidArgumentException('Vendor belongs to different tenant');
        }

        return [
            'negotiation_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'order_id' => $orderId,
            'vendor_id' => $vendorId,
            'tenant_id' => $tenantId,
            'status' => 'active',
            'round' => 1,
            'started_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    public function requestQuote(string $negotiationId, string $vendorId, array $quoteDetails): array
    {
        if (empty($quoteDetails['price'])) {
            throw new InvalidArgumentException('Quote price is required');
        }

        if ($quoteDetails['price'] < 0) {
            throw new InvalidArgumentException('Quote price must be non-negative');
        }

        if (!isset($quoteDetails['lead_time_days']) || $quoteDetails['lead_time_days'] <= 0) {
            throw new InvalidArgumentException('Lead time must be greater than zero');
        }

        return [
            'quote_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'negotiation_id' => $negotiationId,
            'vendor_id' => $vendorId,
            'quoted_price' => $quoteDetails['price'],
            'lead_time_days' => $quoteDetails['lead_time_days'],
            'description' => $quoteDetails['description'] ?? null,
            'status' => 'submitted',
            'submitted_at' => now()->format('Y-m-d H:i:s'),
        ];
    }

    public function compareQuotes(array $quotes): array
    {
        if (empty($quotes)) {
            throw new InvalidArgumentException('At least one quote is required for comparison');
        }

        $prices = array_column($quotes, 'quoted_price');
        $minPrice = min($prices);
        $maxPrice = max($prices);
        $avgPrice = array_sum($prices) / count($prices);

        $comparison = [];
        foreach ($quotes as $quote) {
            $comparison[] = [
                'vendor_id' => $quote['vendor_id'],
                'price' => $quote['quoted_price'],
                'lead_time' => $quote['lead_time_days'],
                'price_diff_from_min' => $quote['quoted_price'] - $minPrice,
                'price_variance_percent' => (($quote['quoted_price'] - $avgPrice) / $avgPrice) * 100,
            ];
        }

        usort($comparison, fn($a, $b) => $a['price'] <=> $b['price']);

        return [
            'total_quotes' => count($quotes),
            'min_price' => $minPrice,
            'max_price' => $maxPrice,
            'average_price' => $avgPrice,
            'quotes' => $comparison,
        ];
    }

    public function setNegotiationDeadline(string $negotiationId, int $daysFromNow = 7): array
    {
        if ($daysFromNow <= 0) {
            throw new InvalidArgumentException('Deadline must be in the future');
        }

        $deadline = now()->addDays($daysFromNow);

        return [
            'negotiation_id' => $negotiationId,
            'deadline' => $deadline->format('Y-m-d H:i:s'),
            'days_remaining' => $daysFromNow,
            'is_urgent' => $daysFromNow <= 2,
        ];
    }

    public function escalateNegotiation(string $negotiationId, string $reason = ''): array
    {
        return [
            'negotiation_id' => $negotiationId,
            'escalation_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'reason' => $reason,
            'escalated_at' => now()->format('Y-m-d H:i:s'),
            'escalation_level' => 'management',
            'status' => 'escalated',
        ];
    }

    public function concludeNegotiation(
        string $negotiationId,
        string $selectedVendorId,
        float $agreedPrice,
        int $agreedLeadTime
    ): array {
        if ($agreedPrice < 0) {
            throw new InvalidArgumentException('Agreed price must be non-negative');
        }

        if ($agreedLeadTime <= 0) {
            throw new InvalidArgumentException('Agreed lead time must be greater than zero');
        }

        return [
            'negotiation_id' => $negotiationId,
            'selected_vendor_id' => $selectedVendorId,
            'agreed_price' => $agreedPrice,
            'agreed_lead_time_days' => $agreedLeadTime,
            'concluded_at' => now()->format('Y-m-d H:i:s'),
            'status' => 'concluded',
        ];
    }
}