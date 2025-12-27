<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Review\Entities\Review;
use App\Domain\Review\Repositories\ReviewRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerReview;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use DateTime;

class ReviewEloquentRepository implements ReviewRepositoryInterface
{
    public function __construct(
        private CustomerReview $model
    ) {}

    private function getTenantIdByUuid(string $uuid): ?int
    {
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::where('uuid', $uuid)->first();
        return $tenant?->id;
    }

    private function getProductIdByUuid(string $uuid): ?int
    {
        $product = Product::where('uuid', $uuid)->first();
        return $product?->id;
    }

    private function getCustomerIdByUuid(string $uuid): ?int
    {
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::where('uuid', $uuid)->first();
        return $customer?->id;
    }

    private function getOrderIdByUuid(string $uuid): ?int
    {
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::where('uuid', $uuid)->first();
        return $order?->id;
    }

    public function findById(UuidValueObject $id): ?Review
    {
        $model = $this->model->find($id->getValue());
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByProductId(UuidValueObject $productId): array
    {
        $productIntId = $this->getProductIdByUuid($productId->getValue());
        
        if (!$productIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('product_id', $productIntId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByProductUuid(string $productUuid): array
    {
        $product = Product::where('uuid', $productUuid)->first();
        
        if (!$product) {
            return [];
        }

        $models = $this->model
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByTenantAndProductUuid(UuidValueObject $tenantId, string $productUuid): array
    {
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::where('uuid', $tenantId->getValue())->first();
        
        if (!$tenant) {
            return [];
        }
        
        $product = Product::where('uuid', $productUuid)
            ->where('tenant_id', $tenant->id)
            ->first();
        
        if (!$product) {
            return [];
        }

        $models = $this->model
            ->where('tenant_id', $tenant->id)
            ->where('product_id', $product->id)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByCustomerId(UuidValueObject $customerId): array
    {
        $customerIntId = $this->getCustomerIdByUuid($customerId->getValue());
        
        if (!$customerIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('customer_id', $customerIntId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByOrderId(UuidValueObject $orderId): array
    {
        $orderIntId = $this->getOrderIdByUuid($orderId->getValue());
        
        if (!$orderIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('order_id', $orderIntId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByTenantId(UuidValueObject $tenantId): array
    {
        $tenantIntId = $this->getTenantIdByUuid($tenantId->getValue());
        
        if (!$tenantIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('tenant_id', $tenantIntId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findApproved(UuidValueObject $tenantId): array
    {
        $tenantIntId = $this->getTenantIdByUuid($tenantId->getValue());
        
        if (!$tenantIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('tenant_id', $tenantIntId)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findPending(UuidValueObject $tenantId): array
    {
        $tenantIntId = $this->getTenantIdByUuid($tenantId->getValue());
        
        if (!$tenantIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('tenant_id', $tenantIntId)
            ->where('is_approved', false)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findVerifiedPurchases(UuidValueObject $productId): array
    {
        $productIntId = $this->getProductIdByUuid($productId->getValue());
        
        if (!$productIntId) {
            return [];
        }
        
        $models = $this->model
            ->where('product_id', $productIntId)
            ->where('is_verified_purchase', true)
            ->where('is_approved', true)
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function save(Review $review): Review
    {
        $tenantIntId = $this->getTenantIdByUuid($review->getTenantId()->getValue());
        $productIntId = $this->getProductIdByUuid($review->getProductId()->getValue());
        $orderIntId = $review->getOrderId() ? $this->getOrderIdByUuid($review->getOrderId()->getValue()) : null;
        $customerIntId = $review->getCustomerId() ? $this->getCustomerIdByUuid($review->getCustomerId()->getValue()) : null;
        $approvedByIntId = $review->getApprovedBy() ? $this->getCustomerIdByUuid($review->getApprovedBy()->getValue()) : null;
        
        $data = [
            'uuid' => $review->getId()->getValue(),
            'tenant_id' => $tenantIntId,
            'product_id' => $productIntId,
            'order_id' => $orderIntId,
            'customer_id' => $customerIntId,
            'rating' => (int)$review->getRating(),
            'title' => $review->getTitle(),
            'content' => $review->getContent(),
            'images' => $review->getImages(),
            'is_verified_purchase' => $review->isVerifiedPurchase(),
            'is_approved' => $review->isApproved(),
            'approved_at' => $review->getApprovedAt()?->format('Y-m-d H:i:s'),
            'approved_by' => $approvedByIntId,
            'helpful_count' => $review->getHelpfulCount(),
            'not_helpful_count' => $review->getNotHelpfulCount(),
        ];

        $model = $this->model->updateOrCreate(
            ['uuid' => $review->getId()->getValue()],
            $data
        );

        return $this->toDomain($model);
    }

    public function delete(UuidValueObject $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->delete() > 0;
    }

    public function countByProductId(UuidValueObject $productId): int
    {
        $productIntId = $this->getProductIdByUuid($productId->getValue());
        
        if (!$productIntId) {
            return 0;
        }
        
        return $this->model
            ->where('product_id', $productIntId)
            ->where('is_approved', true)
            ->count();
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        $tenantIntId = $this->getTenantIdByUuid($tenantId->getValue());
        
        if (!$tenantIntId) {
            return 0;
        }
        
        return $this->model
            ->where('tenant_id', $tenantIntId)
            ->count();
    }

    public function getAverageRating(UuidValueObject $productId): float
    {
        $productIntId = $this->getProductIdByUuid($productId->getValue());
        
        if (!$productIntId) {
            return 0.0;
        }
        
        $avg = $this->model
            ->where('product_id', $productIntId)
            ->where('is_approved', true)
            ->avg('rating');

        return $avg ? round($avg, 1) : 0.0;
    }

    public function getRatingDistribution(UuidValueObject $productId): array
    {
        $productIntId = $this->getProductIdByUuid($productId->getValue());
        
        if (!$productIntId) {
            return [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        }
        
        $distribution = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
        
        $ratings = $this->model
            ->where('product_id', $productIntId)
            ->where('is_approved', true)
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        foreach ($ratings as $rating => $count) {
            $distribution[$rating] = $count;
        }

        return $distribution;
    }

    private function toDomain(CustomerReview $model): Review
    {
        $model->loadMissing(['tenant', 'product', 'customer', 'order', 'approvedBy']);
        
        return new Review(
            id: new UuidValueObject($model->uuid),
            tenantId: new UuidValueObject($model->tenant->uuid),
            productId: new UuidValueObject($model->product->uuid),
            orderId: $model->order?->uuid ? new UuidValueObject($model->order->uuid) : null,
            customerId: $model->customer?->uuid ? new UuidValueObject($model->customer->uuid) : null,
            reviewerName: $model->customer?->name ?? 'Anonymous',
            reviewerEmail: $model->customer?->email ?? 'no-reply@example.com',
            rating: (float)$model->rating,
            content: $model->content,
            title: $model->title,
            isVerifiedPurchase: $model->is_verified_purchase,
            isApproved: $model->is_approved,
            approvedAt: $model->approved_at ? new DateTime($model->approved_at) : null,
            approvedBy: $model->approvedBy?->uuid ? new UuidValueObject($model->approvedBy->uuid) : null,
            helpfulCount: $model->helpful_count,
            notHelpfulCount: $model->not_helpful_count,
            images: $model->images,
            createdAt: new DateTime($model->created_at),
            updatedAt: new DateTime($model->updated_at)
        );
    }
}
