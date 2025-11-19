<?php

namespace App\Domain\Order\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;

class VendorNegotiationService
{
    public function startNegotiation(Order $order, array $payload = []): OrderVendorNegotiation
    {
        $vendorId = $payload['vendor_id'] ?? $order->vendor_id;

        if (!$vendorId) {
            throw new \DomainException('Vendor harus dipilih sebelum memulai negosiasi');
        }

        $existing = $order->vendorNegotiations()
            ->whereIn('status', ['open', 'countered'])
            ->latest('id')
            ->first();

        if ($existing) {
            $this->syncOrderNegotiationMetadata($order, $existing);
            return $existing;
        }

        $initialOffer = Arr::get($payload, 'initial_offer', $order->total_amount);
        $latestOffer = Arr::get($payload, 'latest_offer', $initialOffer);
        $currency = Arr::get($payload, 'currency', $order->currency ?? 'IDR');
        $terms = Arr::get($payload, 'terms');
        $expiresAt = Arr::get($payload, 'expires_at');
        $notes = Arr::get($payload, 'notes');

        $history = [
            $this->buildHistoryEntry(
                Arr::get($payload, 'initiator', 'system'),
                'initiated',
                $initialOffer,
                $notes
            ),
        ];

        $negotiation = OrderVendorNegotiation::create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'vendor_id' => $vendorId,
            'status' => 'open',
            'initial_offer' => $initialOffer,
            'latest_offer' => $latestOffer,
            'currency' => $currency,
            'terms' => $terms,
            'history' => $history,
            'round' => 1,
            'expires_at' => $expiresAt ? Carbon::parse($expiresAt) : null,
        ]);

        $this->syncOrderNegotiationMetadata($order, $negotiation);

        Log::info('Vendor negotiation started', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'negotiation_id' => $negotiation->id,
            'tenant_id' => $order->tenant_id,
            'vendor_id' => $vendorId,
            'initial_offer' => $initialOffer,
            'currency' => $currency,
        ]);

        return $negotiation;
    }

    public function recordCounterOffer(OrderVendorNegotiation $negotiation, array $payload = []): OrderVendorNegotiation
    {
        $amount = Arr::get($payload, 'amount', $negotiation->latest_offer);
        $actor = Arr::get($payload, 'actor', 'vendor');
        $notes = Arr::get($payload, 'notes');

        $history = $negotiation->history ?? [];
        $history[] = $this->buildHistoryEntry($actor, 'counter_offer', $amount, $notes);

        $negotiation->history = $history;
        $negotiation->latest_offer = $amount;
        $negotiation->round = ($negotiation->round ?? 1) + 1;
        $negotiation->status = 'countered';
        $negotiation->save();

        $this->syncOrderNegotiationMetadata($negotiation->order, $negotiation);

        Log::info('Vendor negotiation counter offer recorded', [
            'negotiation_id' => $negotiation->id,
            'order_id' => $negotiation->order_id,
            'tenant_id' => $negotiation->tenant_id,
            'actor' => $actor,
            'amount' => $amount,
        ]);

        return $negotiation;
    }

    public function concludeNegotiation(OrderVendorNegotiation $negotiation, string $status, array $payload = []): OrderVendorNegotiation
    {
        if (!in_array($status, ['accepted', 'rejected', 'cancelled', 'expired'], true)) {
            throw new \InvalidArgumentException('Status negosiasi tidak valid');
        }

        $amount = Arr::get($payload, 'amount');
        $notes = Arr::get($payload, 'notes');
        $actor = Arr::get($payload, 'actor', 'system');

        $history = $negotiation->history ?? [];
        $history[] = $this->buildHistoryEntry($actor, $status, $amount, $notes);

        if ($amount !== null) {
            $negotiation->latest_offer = $amount;
        }

        $negotiation->history = $history;
        $negotiation->status = $status;
        $negotiation->closed_at = Carbon::now();
        $negotiation->save();

        $this->syncOrderNegotiationMetadata($negotiation->order, $negotiation);

        Log::info('Vendor negotiation concluded', [
            'negotiation_id' => $negotiation->id,
            'order_id' => $negotiation->order_id,
            'tenant_id' => $negotiation->tenant_id,
            'status' => $status,
            'amount' => $amount,
        ]);

        return $negotiation;
    }

    protected function buildHistoryEntry(string $actor, string $event, ?int $amount, ?string $notes = null): array
    {
        return [
            'actor' => $actor,
            'event' => $event,
            'amount' => $amount,
            'notes' => $notes,
            'timestamp' => Carbon::now()->toIso8601String(),
        ];
    }

    protected function syncOrderNegotiationMetadata(Order $order, OrderVendorNegotiation $negotiation): void
    {
        $metadata = $order->metadata ?? [];

        $metadata['negotiation'] = [
            'negotiation_id' => $negotiation->id,
            'vendor_id' => $negotiation->vendor_id,
            'status' => $negotiation->status,
            'initial_offer' => $negotiation->initial_offer,
            'latest_offer' => $negotiation->latest_offer,
            'round' => $negotiation->round,
            'expires_at' => $negotiation->expires_at?->toIso8601String(),
            'closed_at' => $negotiation->closed_at?->toIso8601String(),
        ];

        $order->metadata = $metadata;
    }
}
