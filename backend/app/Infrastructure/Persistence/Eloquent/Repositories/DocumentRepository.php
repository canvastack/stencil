<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\CustomerQuote\Repositories\DocumentRepositoryInterface;
use App\Domain\CustomerQuote\Entities\OrderDocument as OrderDocumentEntity;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;

/**
 * Eloquent implementation of DocumentRepositoryInterface
 */
class DocumentRepository implements DocumentRepositoryInterface
{
    public function __construct(
        private OrderDocument $model
    ) {}

    public function findById(int $id): ?OrderDocumentEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findByUuid(string $uuid): ?OrderDocumentEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findByOrderId(int $orderId): array
    {
        return $this->model->where('order_id', $orderId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function findByOrderAndType(int $orderId, string $type): ?OrderDocumentEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findLatestVersion(int $orderId, string $type): ?OrderDocumentEntity
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function findByCustomerQuoteId(int $customerQuoteId): array
    {
        return $this->model->where('customer_quote_id', $customerQuoteId)
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

    public function findByType(int $tenantId, string $type): array
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('document_type', $type)
            ->orderBy('created_at', 'desc')
            ->get()
            ->toArray();
    }

    public function save(OrderDocumentEntity $document): void
    {
        // For now, Application layer saves directly via Eloquent
    }

    public function delete(int $id): void
    {
        $this->model->where('id', $id)->delete();
    }

    public function getNextSequence(int $tenantId, string $documentType, int $year): int
    {
        $lastDoc = $this->model->where('tenant_id', $tenantId)
            ->where('document_type', $documentType)
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();

        return $lastDoc ? ((int) substr($lastDoc->document_number, -4)) + 1 : 1;
    }

    public function countByType(int $tenantId, string $type): int
    {
        return $this->model->where('tenant_id', $tenantId)
            ->where('document_type', $type)
            ->count();
    }

    public function findWithFilters(int $tenantId, array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $query = $this->model->where('tenant_id', $tenantId);

        if (isset($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['order_id'])) {
            $query->where('order_id', $filters['order_id']);
        }

        return $query->orderBy('created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->toArray();
    }
}
