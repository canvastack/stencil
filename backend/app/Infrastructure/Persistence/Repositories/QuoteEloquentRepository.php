<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class QuoteEloquentRepository implements QuoteRepositoryInterface
{
    public function findByUuid(string $uuid, int $tenantId): ?Quote
    {
        $model = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $uuid)
            ->with(['order.customer', 'vendor'])
            ->first();

        return $model ? $this->toDomainEntity($model) : null;
    }

    public function findById(int $id, int $tenantId): ?Quote
    {
        $model = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('id', $id)
            ->with(['order.customer', 'vendor'])
            ->first();

        return $model ? $this->toDomainEntity($model) : null;
    }

    public function list(
        int $tenantId,
        array $filters = [],
        string $sortBy = 'created_at',
        string $sortOrder = 'desc',
        int $page = 1,
        int $perPage = 20
    ): array {
        $query = OrderVendorNegotiation::query()
            ->where('tenant_id', $tenantId)
            ->with(['order.customer', 'vendor']);

        $this->applyFilters($query, $filters);
        $total = $query->count();
        $query->orderBy($sortBy, $sortOrder);
        $offset = ($page - 1) * $perPage;
        $models = $query->skip($offset)->take($perPage)->get();
        $quotes = $models->map(fn($model) => $this->toDomainEntity($model))->all();

        return [
            'data' => $quotes,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    public function findByOrderId(int $orderId, int $tenantId): array
    {
        $models = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->with(['order.customer', 'vendor'])
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function findByVendorId(int $vendorId, int $tenantId, array $filters = []): array
    {
        $query = OrderVendorNegotiation::query()
            ->where('tenant_id', $tenantId)
            ->where('vendor_id', $vendorId)
            ->with(['order.customer', 'vendor']);

        $this->applyFilters($query, $filters);
        $models = $query->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function findActiveQuoteForOrderAndVendor(
        int $orderId,
        int $vendorId,
        int $tenantId
    ): ?Quote {
        $model = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->where('vendor_id', $vendorId)
            ->whereIn('status', ['open', 'countered'])
            ->with(['order.customer', 'vendor'])
            ->first();

        return $model ? $this->toDomainEntity($model) : null;
    }

    public function findExpiredQuotes(int $tenantId, array $statuses, \DateTimeImmutable $now): array
    {
        $models = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->whereIn('status', $statuses)
            ->where('expires_at', '<', $now->format('Y-m-d H:i:s'))
            ->whereNotNull('expires_at')
            ->with(['order.customer', 'vendor'])
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function findAllExpiredQuotes(array $statuses, \DateTimeImmutable $now): array
    {
        $models = OrderVendorNegotiation::whereIn('status', $statuses)
            ->where('expires_at', '<', $now->format('Y-m-d H:i:s'))
            ->whereNotNull('expires_at')
            ->with(['order.customer', 'vendor'])
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->all();
    }

    public function save(Quote $quote): Quote
    {
        DB::transaction(function () use ($quote) {
            $data = [
                'uuid' => $quote->getUuid(),
                'tenant_id' => $quote->getTenantId(),
                'order_id' => $quote->getOrderId(),
                'vendor_id' => $quote->getVendorId(),
                'product_id' => $quote->getProductId(),
                'quantity' => $quote->getQuantity(),
                'specifications' => $quote->getSpecifications(),
                'notes' => $quote->getNotes(),
                'status' => $quote->getStatus()->value,
                'initial_offer' => $quote->getInitialOffer(),
                'latest_offer' => $quote->getLatestOffer(),
                'currency' => $quote->getCurrency(),
                'quote_details' => $quote->getQuoteDetails(),
                'history' => $quote->getHistory(),
                'status_history' => $quote->getStatusHistory(),
                'round' => $quote->getRound(),
                'sent_at' => $quote->getSentAt(),
                'responded_at' => $quote->getRespondedAt(),
                'response_type' => $quote->getResponseType(),
                'response_notes' => $quote->getResponseNotes(),
                'expires_at' => $quote->getExpiresAt(),
                'closed_at' => $quote->getClosedAt(),
                'updated_at' => $quote->getUpdatedAt(),
            ];

            if ($quote->getId() === null) {
                $data['created_at'] = $quote->getCreatedAt();
                $model = OrderVendorNegotiation::create($data);
                $quote->setId($model->id);
            } else {
                OrderVendorNegotiation::where('id', $quote->getId())
                    ->where('tenant_id', $quote->getTenantId())
                    ->update($data);
            }
        });

        return $quote;
    }

    public function delete(Quote $quote): bool
    {
        return true;
    }

    public function countByStatus(int $tenantId, ?QuoteStatus $status = null): int
    {
        $query = OrderVendorNegotiation::where('tenant_id', $tenantId);

        if ($status !== null) {
            $query->where('status', $status->value);
        }

        return $query->count();
    }

    public function getStatistics(int $tenantId, array $filters = []): array
    {
        return [];
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (isset($filters['order_id'])) {
            $query->where('order_id', $filters['order_id']);
        }

        if (isset($filters['search']) && trim($filters['search']) !== '') {
            $search = trim($filters['search']);
            
            $query->where(function (Builder $q) use ($search) {
                $q->where('uuid', 'LIKE', "%{$search}%")
                  ->orWhereHas('order', function (Builder $orderQuery) use ($search) {
                      $orderQuery->where('order_number', 'LIKE', "%{$search}%")
                                 ->orWhereHas('customer', function (Builder $customerQuery) use ($search) {
                                     $customerQuery->where('name', 'LIKE', "%{$search}%");
                                 });
                  })
                  ->orWhereHas('vendor', function (Builder $vendorQuery) use ($search) {
                      $vendorQuery->where('name', 'LIKE', "%{$search}%");
                  });
            });
        }
    }

    private function toDomainEntity(OrderVendorNegotiation $model): Quote
    {
        return Quote::reconstitute(
            id: $model->id,
            uuid: $model->uuid,
            tenantId: $model->tenant_id,
            orderId: $model->order_id,
            vendorId: $model->vendor_id,
            productId: $model->product_id, // ✅ ADDED
            quantity: $model->quantity ?? 1, // ✅ ADDED with default
            specifications: $model->specifications ?? [], // ✅ ADDED with default
            notes: $model->notes, // ✅ ADDED
            status: $model->status,
            initialOffer: $model->initial_offer,
            latestOffer: $model->latest_offer ?? $model->initial_offer,
            currency: $model->currency ?? 'IDR',
            quoteDetails: $model->quote_details,
            history: $model->history,
            statusHistory: $model->status_history,
            round: $model->round ?? 1,
            sentAt: $model->sent_at ? \DateTimeImmutable::createFromMutable($model->sent_at) : null,
            respondedAt: $model->responded_at ? \DateTimeImmutable::createFromMutable($model->responded_at) : null,
            responseType: $model->response_type,
            responseNotes: $model->response_notes,
            expiresAt: $model->expires_at ? \DateTimeImmutable::createFromMutable($model->expires_at) : null,
            closedAt: $model->closed_at ? \DateTimeImmutable::createFromMutable($model->closed_at) : null,
            createdAt: \DateTimeImmutable::createFromMutable($model->created_at),
            updatedAt: \DateTimeImmutable::createFromMutable($model->updated_at),
            deletedAt: $model->deleted_at ? \DateTimeImmutable::createFromMutable($model->deleted_at) : null
        );
    }
}
