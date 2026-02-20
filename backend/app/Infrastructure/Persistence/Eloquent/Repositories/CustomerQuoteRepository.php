<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\CustomerQuote\Repositories\CustomerQuoteRepositoryInterface;
use App\Domain\CustomerQuote\Entities\CustomerQuote as CustomerQuoteEntity;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;

/**
 * Eloquent implementation of CustomerQuoteRepositoryInterface
 * 
 * Note: For pragmatic reasons, this implementation returns arrays of data
 * rather than pure domain entities. The Application layer works directly
 * with Eloquent models for now.
 */
class CustomerQuoteRepository implements CustomerQuoteRepositoryInterface
{
    public function __construct(
        private CustomerQuote $model
    ) {}

    public function findById(int $id): ?CustomerQuoteEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findByUuid(string $uuid): ?CustomerQuoteEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findByToken(string $token): ?CustomerQuoteEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findByOrderId(int $orderId): array
    {
        return $this->model->where('order_id', $orderId)
            ->with([
                'order:id,uuid,order_number,customer_id,status',
                'order.customer:id,name,email,phone',
                'vendorQuote:id,uuid,quote_number,status',
                'createdBy:id,name,email',
                'documents:id,customer_quote_id,document_type,document_number,file_url,status',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function findByVendorQuoteId(int $vendorQuoteId): array
    {
        return $this->model->where('vendor_quote_id', $vendorQuoteId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function findByStatus(int $tenantId, string $status): array
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('status', $status)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function findPendingApprovals(int $tenantId): array
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('status', 'pending_approval')
            ->with([
                'order.customer',
                'order.items',
                'vendorQuote',
                'createdBy:id,name,email',
            ])
            ->orderBy('responded_at', 'asc')
            ->get()
            ->toArray();
    }

    public function findExpired(int $tenantId): array
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('valid_until', '<', now())
            ->whereNotIn('status', ['accepted', 'rejected', 'expired'])
            ->get()
            ->toArray();
    }

    public function findExpiringSoon(int $tenantId, int $hoursThreshold = 24): array
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('valid_until', '>', now())
            ->where('valid_until', '<=', now()->addHours($hoursThreshold))
            ->whereIn('status', ['sent', 'countered'])
            ->get()
            ->toArray();
    }

    public function save(CustomerQuoteEntity $quote): void
    {
        // For now, Application layer saves directly via Eloquent
    }

    public function delete(int $id): void
    {
        $this->model->where('id', $id)->delete();
    }

    public function getNextSequence(int $tenantId, string $type, int $year): int
    {
        $lastQuote = $this->model->where('tenant_id', $tenantId)
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        return $lastQuote ? ((int) substr($lastQuote->quote_number, -4)) + 1 : 1;
    }

    public function countByStatus(int $tenantId, string $status): int
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('status', $status)
            ->count();
    }

    public function findWithFilters(int $tenantId, array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $query = $this->model->where('tenant_id', $tenantId);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['customer_id'])) {
            $query->whereHas('order', function ($q) use ($filters) {
                $q->where('customer_id', $filters['customer_id']);
            });
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // Eager load relationships to prevent N+1 queries
        $query->with([
            'order:id,uuid,order_number,customer_id,status',
            'order.customer:id,name,email,phone',
            'createdBy:id,name,email',
            'approvedBy:id,name,email',
            'documents:id,customer_quote_id,document_type,document_number,file_url,status',
        ]);

        return $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->toArray();
    }

    public function countWithFilters(int $tenantId, array $filters = []): int
    {
        $query = $this->model->where('tenant_id', $tenantId);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['customer_id'])) {
            $query->whereHas('order', function ($q) use ($filters) {
                $q->where('customer_id', $filters['customer_id']);
            });
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        return $query->count();
    }
}

