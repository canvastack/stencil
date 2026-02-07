<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Quote\ValueObjects\QuoteStatus;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use DateTimeImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Quote Repository Implementation
 * 
 * Implements quote data persistence using Eloquent ORM.
 * Part of the Infrastructure layer - framework specific.
 * 
 * Database Integration:
 * - Maps to order_vendor_negotiations table
 * - Handles UUID-based operations
 * - Maintains tenant isolation
 * - Converts between domain entities and Eloquent models
 * 
 * Business Rules:
 * - All operations are tenant-scoped
 * - Soft deletes for audit trail
 * - Status history tracking
 * - Expiration management
 */
class QuoteRepository implements QuoteRepositoryInterface
{
    /**
     * Find quote by UUID
     * 
     * @param string $uuid Quote UUID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote|null Quote entity or null if not found
     */
    public function findByUuid(string $uuid, int $tenantId): ?Quote
    {
        $model = OrderVendorNegotiation::where('uuid', $uuid)
            ->where('tenant_id', $tenantId)
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find quote by ID
     * 
     * @param int $id Quote ID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote|null Quote entity or null if not found
     */
    public function findById(int $id, int $tenantId): ?Quote
    {
        $model = OrderVendorNegotiation::where('id', $id)
            ->where('tenant_id', $tenantId)
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * List quotes with filtering and pagination
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Filtering criteria
     * @param string $sortBy Sort field
     * @param string $sortOrder Sort direction (asc|desc)
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: Quote[], total: int, page: int, per_page: int}
     */
    public function list(
        int $tenantId,
        array $filters = [],
        string $sortBy = 'created_at',
        string $sortOrder = 'desc',
        int $page = 1,
        int $perPage = 20
    ): array {
        $query = OrderVendorNegotiation::where('tenant_id', $tenantId);

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (isset($filters['order_id'])) {
            $query->where('order_id', $filters['order_id']);
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('quote_number', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhereHas('order', function ($oq) use ($filters) {
                      $oq->where('order_number', 'ILIKE', '%' . $filters['search'] . '%');
                  })
                  ->orWhereHas('vendor', function ($vq) use ($filters) {
                      $vq->where('name', 'ILIKE', '%' . $filters['search'] . '%');
                  });
            });
        }

        $total = $query->count();

        $models = $query->orderBy($sortBy, $sortOrder)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        $quotes = $models->map(fn($model) => $this->toDomainEntity($model))->toArray();

        return [
            'data' => $quotes,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage
        ];
    }

    /**
     * Find quotes by order ID
     * 
     * @param int $orderId Order ID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote[] Array of quote entities
     */
    public function findByOrderId(int $orderId, int $tenantId): array
    {
        $models = OrderVendorNegotiation::where('order_id', $orderId)
            ->where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find quotes by vendor ID
     * 
     * @param int $vendorId Vendor ID
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Additional filters
     * @return Quote[] Array of quote entities
     */
    public function findByVendorId(int $vendorId, int $tenantId, array $filters = []): array
    {
        $query = OrderVendorNegotiation::where('vendor_id', $vendorId)
            ->where('tenant_id', $tenantId);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $models = $query->orderBy('created_at', 'desc')->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find active quote for order and vendor
     * 
     * @param int $orderId Order ID
     * @param int $vendorId Vendor ID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote|null Active quote or null
     */
    public function findActiveQuoteForOrderAndVendor(
        int $orderId,
        int $vendorId,
        int $tenantId
    ): ?Quote {
        $model = OrderVendorNegotiation::where('order_id', $orderId)
            ->where('vendor_id', $vendorId)
            ->where('tenant_id', $tenantId)
            ->whereIn('status', ['draft', 'sent', 'pending_response', 'countered'])
            ->orderBy('created_at', 'desc')
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find expired quotes for a specific tenant
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $statuses Statuses to check for expiration
     * @param \DateTimeImmutable $now Current timestamp
     * @return Quote[] Array of expired quote entities
     */
    public function findExpiredQuotes(int $tenantId, array $statuses, \DateTimeImmutable $now): array
    {
        $models = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->whereIn('status', $statuses)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $now->format('Y-m-d H:i:s'))
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find all expired quotes across all tenants
     * 
     * @param array $statuses Statuses to check for expiration
     * @param \DateTimeImmutable $now Current timestamp
     * @return Quote[] Array of expired quote entities
     */
    public function findAllExpiredQuotes(array $statuses, \DateTimeImmutable $now): array
    {
        $models = OrderVendorNegotiation::whereIn('status', $statuses)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $now->format('Y-m-d H:i:s'))
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Save quote (create or update)
     * 
     * @param Quote $quote Quote entity to save
     * @return Quote Saved quote entity with ID
     */
    public function save(Quote $quote): Quote
    {
        try {
            DB::beginTransaction();

            $data = [
                'uuid' => $quote->getUuid(),
                'tenant_id' => $quote->getTenantId(),
                'order_id' => $quote->getOrderId(),
                'vendor_id' => $quote->getVendorId(),
                // product_id and quantity are stored in quote_details, not as separate columns
                'initial_offer' => $quote->getInitialOffer(),
                'latest_offer' => $quote->getLatestOffer(),
                'currency' => $quote->getCurrency(),
                'quote_details' => $quote->getQuoteDetails(),
                'history' => $quote->getHistory(),
                'round' => $quote->getRound(),
                'specifications' => $quote->getSpecifications(),
                'notes' => $quote->getNotes(),
                'status' => $quote->getStatus()->value,
                'status_history' => $quote->getStatusHistory(),
                'sent_at' => $quote->getSentAt()?->format('Y-m-d H:i:s'),
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'response_notes' => $quote->getResponseNotes(),
                'expires_at' => $quote->getExpiresAt()?->format('Y-m-d H:i:s'),
                'created_at' => $quote->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $quote->getUpdatedAt()->format('Y-m-d H:i:s'),
            ];

            if ($quote->getId() !== null) {
                // Update existing quote
                $model = OrderVendorNegotiation::where('id', $quote->getId())
                    ->where('tenant_id', $quote->getTenantId())
                    ->firstOrFail();
                
                $model->update($data);
            } else {
                // Create new quote
                $model = OrderVendorNegotiation::create($data);
                
                // Set ID on domain entity
                $quote->setId($model->id);
            }

            DB::commit();

            Log::info('Quote saved successfully', [
                'quote_id' => $model->id,
                'quote_uuid' => $model->uuid,
                'tenant_id' => $model->tenant_id,
                'status' => $model->status
            ]);

            return $this->toDomainEntity($model->fresh());

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to save quote', [
                'quote_uuid' => $quote->getUuid(),
                'tenant_id' => $quote->getTenantId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }

    /**
     * Delete quote (soft delete)
     * 
     * @param Quote $quote Quote entity to delete
     * @return bool True if deleted successfully
     */
    public function delete(Quote $quote): bool
    {
        try {
            $model = OrderVendorNegotiation::where('id', $quote->getId())
                ->where('tenant_id', $quote->getTenantId())
                ->firstOrFail();
            
            return $model->delete();

        } catch (\Exception $e) {
            Log::error('Failed to delete quote', [
                'quote_id' => $quote->getId(),
                'tenant_id' => $quote->getTenantId(),
                'error' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * Count quotes by status
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param QuoteStatus|null $status Status to count (null for all)
     * @return int Count of quotes
     */
    public function countByStatus(int $tenantId, ?QuoteStatus $status = null): int
    {
        $query = OrderVendorNegotiation::where('tenant_id', $tenantId);

        if ($status !== null) {
            $query->where('status', $status->value);
        }

        return $query->count();
    }

    /**
     * Get quote statistics
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Additional filters
     * @return array Statistics data
     */
    public function getStatistics(int $tenantId, array $filters = []): array
    {
        $query = OrderVendorNegotiation::where('tenant_id', $tenantId);

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $total = $query->count();
        $draft = (clone $query)->where('status', 'draft')->count();
        $sent = (clone $query)->where('status', 'sent')->count();
        $pending = (clone $query)->where('status', 'pending_response')->count();
        $accepted = (clone $query)->where('status', 'accepted')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();
        $countered = (clone $query)->where('status', 'countered')->count();
        $expired = (clone $query)->where('status', 'expired')->count();

        return [
            'total' => $total,
            'by_status' => [
                'draft' => $draft,
                'sent' => $sent,
                'pending_response' => $pending,
                'accepted' => $accepted,
                'rejected' => $rejected,
                'countered' => $countered,
                'expired' => $expired,
            ],
            'acceptance_rate' => $total > 0 ? round(($accepted / $total) * 100, 2) : 0,
            'rejection_rate' => $total > 0 ? round(($rejected / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Convert Eloquent model to domain entity
     * 
     * @param OrderVendorNegotiation $model Eloquent model
     * @return Quote Domain entity
     */
    private function toDomainEntity(OrderVendorNegotiation $model): Quote
    {
        return Quote::reconstitute(
            id: $model->id,
            uuid: $model->uuid,
            tenantId: $model->tenant_id,
            orderId: $model->order_id,
            vendorId: $model->vendor_id,
            productId: $model->product_id ?? 0,
            quantity: $model->quantity ?? 0,
            specifications: $model->specifications ?? [],
            notes: $model->notes,
            status: $model->status,
            initialOffer: $model->initial_offer,
            latestOffer: $model->latest_offer,
            currency: $model->currency ?? 'IDR',
            quoteDetails: $model->quote_details ?? [],
            history: $model->history ?? [],
            statusHistory: $model->status_history ?? [],
            round: $model->round ?? 1,
            sentAt: $model->sent_at ? new DateTimeImmutable($model->sent_at->format('Y-m-d H:i:s')) : null,
            respondedAt: $model->responded_at ? new DateTimeImmutable($model->responded_at->format('Y-m-d H:i:s')) : null,
            responseType: $model->response_type,
            responseNotes: $model->response_notes,
            expiresAt: $model->expires_at ? new DateTimeImmutable($model->expires_at->format('Y-m-d H:i:s')) : null,
            closedAt: $model->closed_at ? new DateTimeImmutable($model->closed_at->format('Y-m-d H:i:s')) : null,
            createdAt: new DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new DateTimeImmutable($model->updated_at->format('Y-m-d H:i:s')),
            deletedAt: $model->deleted_at ? new DateTimeImmutable($model->deleted_at->format('Y-m-d H:i:s')) : null
        );
    }
}
