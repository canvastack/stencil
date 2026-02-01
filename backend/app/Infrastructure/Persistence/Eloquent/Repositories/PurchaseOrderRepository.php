<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Order as OrderModel;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Purchase Order Repository Implementation
 * 
 * Infrastructure layer implementation of OrderRepositoryInterface.
 * Handles persistence of PurchaseOrder entities using Eloquent ORM.
 * 
 * Database Integration:
 * - Maps to orders table
 * - Handles UUID/integer ID conversion
 * - Maintains tenant isolation
 * - Stores items as JSON in orders.items field
 */
class PurchaseOrderRepository implements OrderRepositoryInterface
{
    /**
     * Save order (create or update)
     */
    public function save(PurchaseOrder $order): PurchaseOrder
    {
        $data = $this->fromDomain($order);
        
        // Use updateOrCreate to handle both create and update
        $eloquentOrder = OrderModel::updateOrCreate(
            ['uuid' => $data['uuid']],
            $data
        );

        return $this->toDomain($eloquentOrder);
    }

    /**
     * Find order by UUID
     */
    public function findById(UuidValueObject $id): ?PurchaseOrder
    {
        $eloquentOrder = OrderModel::where('uuid', $id->getValue())->first();
        
        return $eloquentOrder ? $this->toDomain($eloquentOrder) : null;
    }

    /**
     * Find orders by customer within tenant
     */
    public function findByCustomer(UuidValueObject $tenantId, UuidValueObject $customerId): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('customer_id', $customerId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Find orders by status within tenant
     */
    public function findByStatus(UuidValueObject $tenantId, OrderStatus $status): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Find order by order number within tenant
     */
    public function findByOrderNumber(UuidValueObject $tenantId, string $orderNumber): ?PurchaseOrder
    {
        $eloquentOrder = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('order_number', $orderNumber)
            ->first();
        
        return $eloquentOrder ? $this->toDomain($eloquentOrder) : null;
    }

    /**
     * Find orders by vendor within tenant
     */
    public function findByVendor(UuidValueObject $tenantId, UuidValueObject $vendorId): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('vendor_id', $vendorId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Check if order number exists within tenant
     */
    public function existsByOrderNumber(UuidValueObject $tenantId, string $orderNumber): bool
    {
        // Convert tenant UUID to integer ID for database query
        $tenantIntegerId = $this->resolveTenantId($tenantId);
        
        return OrderModel::where('tenant_id', $tenantIntegerId)
            ->where('order_number', $orderNumber)
            ->exists();
    }

    /**
     * Convert tenant UUID to integer ID for database queries
     */
    private function resolveTenantId(UuidValueObject $tenantId): int
    {
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('uuid', $tenantId->getValue())->first();
        
        if (!$tenant) {
            throw new \InvalidArgumentException("Tenant not found: {$tenantId->getValue()}");
        }
        
        return $tenant->id;
    }

    /**
     * Convert integer tenant ID back to UUID
     */
    private function resolveTenantUuid(int $tenantId): string
    {
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($tenantId);
        
        if (!$tenant) {
            throw new \InvalidArgumentException("Tenant not found with ID: {$tenantId}");
        }
        
        return $tenant->uuid;
    }

    /**
     * Convert customer UUID to integer ID for database queries
     */
    private function resolveCustomerId(UuidValueObject $customerId): int
    {
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::where('uuid', $customerId->getValue())->first();
        
        if (!$customer) {
            throw new \InvalidArgumentException("Customer not found: {$customerId->getValue()}");
        }
        
        return $customer->id;
    }

    /**
     * Convert integer customer ID back to UUID
     */
    private function resolveCustomerUuid(int $customerId): string
    {
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::find($customerId);
        
        if (!$customer) {
            throw new \InvalidArgumentException("Customer not found with ID: {$customerId}");
        }
        
        return $customer->uuid;
    }

    /**
     * Convert vendor UUID to integer ID for database queries
     */
    private function resolveVendorId(UuidValueObject $vendorId): int
    {
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::where('uuid', $vendorId->getValue())->first();
        
        if (!$vendor) {
            throw new \InvalidArgumentException("Vendor not found: {$vendorId->getValue()}");
        }
        
        return $vendor->id;
    }

    /**
     * Convert integer vendor ID back to UUID
     */
    private function resolveVendorUuid(int $vendorId): string
    {
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::find($vendorId);
        
        if (!$vendor) {
            throw new \InvalidArgumentException("Vendor not found with ID: {$vendorId}");
        }
        
        return $vendor->uuid;
    }

    /**
     * Get paginated orders with filters
     */
    public function findWithFilters(
        UuidValueObject $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 15,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc'
    ): array {
        $query = OrderModel::where('tenant_id', $tenantId->getValue());

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (isset($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (isset($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('order_number', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('customer_notes', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $eloquentOrders = $query->orderBy($sortBy, $sortDirection)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Count orders with filters
     */
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int
    {
        $query = OrderModel::where('tenant_id', $tenantId->getValue());

        // Apply same filters as findWithFilters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (isset($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (isset($filters['vendor_id'])) {
            $query->where('vendor_id', $filters['vendor_id']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('order_number', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('customer_notes', 'ILIKE', '%' . $filters['search'] . '%');
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

    /**
     * Delete order (soft delete)
     */
    public function delete(UuidValueObject $id): bool
    {
        return OrderModel::where('uuid', $id->getValue())->delete() > 0;
    }

    /**
     * Get order statistics for tenant
     */
    public function getStatistics(UuidValueObject $tenantId): array
    {
        $total = OrderModel::where('tenant_id', $tenantId->getValue())->count();
        $pending = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'pending')
            ->count();
        $completed = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'completed')
            ->count();
        $totalValue = OrderModel::where('tenant_id', $tenantId->getValue())
            ->sum('total_amount');

        return [
            'total' => $total,
            'pending' => $pending,
            'completed' => $completed,
            'total_value' => $totalValue,
            'completion_rate' => $total > 0 ? round(($completed / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Find overdue orders for tenant
     */
    public function findOverdue(UuidValueObject $tenantId): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('required_delivery_date', '<', now())
            ->whereNotIn('status', ['completed', 'cancelled', 'refunded'])
            ->orderBy('required_delivery_date')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Search orders by term
     */
    public function search(UuidValueObject $tenantId, string $searchTerm): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where(function ($query) use ($searchTerm) {
                $query->where('order_number', 'ILIKE', '%' . $searchTerm . '%')
                      ->orWhere('customer_notes', 'ILIKE', '%' . $searchTerm . '%');
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Get recent orders for tenant
     */
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Find orders requiring attention (overdue, pending actions)
     */
    public function findRequiringAttention(UuidValueObject $tenantId): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where(function ($query) {
                $query->where('required_delivery_date', '<', now())
                      ->orWhere('status', 'pending_review')
                      ->orWhere('status', 'vendor_negotiation');
            })
            ->whereNotIn('status', ['completed', 'cancelled', 'refunded'])
            ->orderBy('required_delivery_date')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Get orders by date range
     */
    public function findByDateRange(
        UuidValueObject $tenantId,
        \DateTimeInterface $from,
        \DateTimeInterface $to
    ): array {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->whereBetween('created_at', [$from, $to])
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Get orders by payment status
     */
    public function findByPaymentStatus(UuidValueObject $tenantId, string $paymentStatus): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('payment_status', $paymentStatus)
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Find orders with pending vendor negotiations
     */
    public function findWithPendingNegotiations(UuidValueObject $tenantId): array
    {
        $eloquentOrders = OrderModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'vendor_negotiation')
            ->orderBy('created_at', 'desc')
            ->get();

        return $eloquentOrders->map(fn($order) => $this->toDomain($order))->toArray();
    }

    /**
     * Get order totals by status for dashboard
     */
    public function getStatusTotals(UuidValueObject $tenantId): array
    {
        $totals = OrderModel::where('tenant_id', $tenantId->getValue())
            ->selectRaw('status, COUNT(*) as count, SUM(total_amount) as total_value')
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->toArray();

        return $totals;
    }

    /**
     * Get revenue statistics for period
     */
    public function getRevenueStatistics(
        UuidValueObject $tenantId,
        \DateTimeInterface $from,
        \DateTimeInterface $to
    ): array {
        $stats = OrderModel::where('tenant_id', $tenantId->getValue())
            ->whereBetween('created_at', [$from, $to])
            ->selectRaw('
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                SUM(total_paid_amount) as total_paid,
                AVG(total_amount) as average_order_value
            ')
            ->first();

        return [
            'total_orders' => $stats->total_orders ?? 0,
            'total_revenue' => $stats->total_revenue ?? 0,
            'total_paid' => $stats->total_paid ?? 0,
            'average_order_value' => $stats->average_order_value ?? 0,
            'outstanding_amount' => ($stats->total_revenue ?? 0) - ($stats->total_paid ?? 0),
        ];
    }

    /**
     * Convert domain entity to Eloquent data array
     */
    private function fromDomain(PurchaseOrder $order): array
    {
        // Convert UUIDs to integer IDs for database storage
        $tenantIntegerId = $this->resolveTenantId($order->getTenantId());
        $customerIntegerId = $this->resolveCustomerId($order->getCustomerId());
        $vendorIntegerId = $order->getVendorId() ? $this->resolveVendorId($order->getVendorId()) : null;
        
        // Extract exchange rate data from metadata
        $metadata = $order->getMetadata();
        $exchangeRate = $metadata['exchange_rate'] ?? null;
        $originalAmountUsd = $metadata['original_amount_usd'] ?? null;
        $convertedAmountIdr = $metadata['converted_amount_idr'] ?? null;
        
        $data = [
            'uuid' => $order->getId()->getValue(),
            'tenant_id' => $tenantIntegerId,
            'customer_id' => $customerIntegerId,
            'vendor_id' => $vendorIntegerId,
            'order_number' => $order->getOrderNumber(),
            'status' => $order->getStatus()->value,
            'payment_status' => $order->getPaymentStatus()->value,
            'total_amount' => $order->getTotalAmount()->getAmountInCents(),
            'down_payment_amount' => $order->getDownPaymentAmount()->getAmountInCents(),
            'total_paid_amount' => $order->getTotalPaidAmount()->getAmountInCents(),
            'exchange_rate' => $exchangeRate,
            'original_amount_usd' => $originalAmountUsd,
            'converted_amount_idr' => $convertedAmountIdr,
            'items' => json_encode($order->getItems()),
            'shipping_address' => json_encode([
                'street' => $order->getShippingAddress()->getStreet(),
                'city' => $order->getShippingAddress()->getCity(),
                'state' => $order->getShippingAddress()->getState(),
                'postal_code' => $order->getShippingAddress()->getPostalCode(),
                'country' => $order->getShippingAddress()->getCountry(),
            ]),
            'billing_address' => json_encode([
                'street' => $order->getBillingAddress()->getStreet(),
                'city' => $order->getBillingAddress()->getCity(),
                'state' => $order->getBillingAddress()->getState(),
                'postal_code' => $order->getBillingAddress()->getPostalCode(),
                'country' => $order->getBillingAddress()->getCountry(),
            ]),
            'estimated_delivery' => $order->getRequiredDeliveryDate(),
            'customer_notes' => $order->getCustomerNotes(),
            'specifications' => json_encode($order->getSpecifications()),
            'timeline' => json_encode([
                'created_at' => $order->getTimeline()->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $order->getTimeline()->getUpdatedAt()->format('Y-m-d H:i:s'),
                'milestones' => $order->getTimeline()->getMilestones(),
            ]),
            'metadata' => json_encode($order->getMetadata()),
            'created_at' => $order->getCreatedAt(),
            'updated_at' => $order->getUpdatedAt(),
        ];

        // Set completed_at timestamp when order is completed
        if ($order->getStatus()->value === 'completed') {
            $data['completed_at'] = now();
        }

        return $data;
    }

    /**
     * Convert Eloquent model to domain entity
     */
    private function toDomain(OrderModel $eloquentOrder): PurchaseOrder
    {
        // Handle JSON casts - fields are auto-decoded to arrays by Eloquent
        $deliveryAddress = is_array($eloquentOrder->shipping_address) 
            ? $eloquentOrder->shipping_address 
            : json_decode($eloquentOrder->shipping_address, true);
        
        $billingAddress = is_array($eloquentOrder->billing_address) 
            ? $eloquentOrder->billing_address 
            : json_decode($eloquentOrder->billing_address, true);
        
        // Timeline is not cast, so it needs json_decode
        $timeline = json_decode($eloquentOrder->timeline, true);

        // Convert integer IDs back to UUIDs
        $tenantUuid = $this->resolveTenantUuid($eloquentOrder->tenant_id);
        $customerUuid = $this->resolveCustomerUuid($eloquentOrder->customer_id);
        $vendorUuid = $eloquentOrder->vendor_id ? $this->resolveVendorUuid($eloquentOrder->vendor_id) : null;

        // Handle items - auto-decoded by JSON cast
        $items = is_array($eloquentOrder->items) 
            ? $eloquentOrder->items 
            : (json_decode($eloquentOrder->items, true) ?? []);

        // Handle metadata - auto-decoded by JSON cast
        $metadata = is_array($eloquentOrder->metadata) 
            ? $eloquentOrder->metadata 
            : (json_decode($eloquentOrder->metadata, true) ?? []);

        return PurchaseOrder::reconstitute(
            id: new UuidValueObject($eloquentOrder->uuid),
            tenantId: new UuidValueObject($tenantUuid),
            customerId: new UuidValueObject($customerUuid),
            vendorId: $vendorUuid ? new UuidValueObject($vendorUuid) : null,
            orderNumber: $eloquentOrder->order_number,
            status: OrderStatus::from($eloquentOrder->status),
            paymentStatus: PaymentStatus::from($eloquentOrder->payment_status),
            totalAmount: Money::fromCents($eloquentOrder->total_amount),
            downPaymentAmount: Money::fromCents($eloquentOrder->down_payment_amount),
            totalPaidAmount: Money::fromCents($eloquentOrder->total_paid_amount),
            items: $items,
            shippingAddress: $this->createAddressFromData($deliveryAddress),
            billingAddress: $this->createAddressFromData($billingAddress),
            requiredDeliveryDate: new DateTimeImmutable($eloquentOrder->estimated_delivery ?? $eloquentOrder->created_at),
            customerNotes: $eloquentOrder->customer_notes,
            specifications: json_decode($eloquentOrder->specifications ?? '{}', true) ?? [],
            timeline: $timeline ? Timeline::reconstitute(
                createdAt: new DateTimeImmutable($timeline['created_at'] ?? $eloquentOrder->created_at),
                updatedAt: new DateTimeImmutable($timeline['updated_at'] ?? $eloquentOrder->updated_at),
                milestones: $timeline['milestones'] ?? []
            ) : Timeline::forOrderProduction(new DateTimeImmutable($eloquentOrder->created_at), 30),
            metadata: $metadata,
            createdAt: new DateTimeImmutable($eloquentOrder->created_at),
            updatedAt: new DateTimeImmutable($eloquentOrder->updated_at)
        );
    }

    /**
     * Create Address from array data with proper validation and defaults
     */
    private function createAddressFromData(?array $addressData): Address
    {
        // If no address data, create default address
        if (!$addressData) {
            return new Address(
                street: 'Jl. Default Street No. 1',
                city: 'Jakarta',
                state: 'DKI Jakarta',
                postalCode: '10110',
                country: 'ID'
            );
        }

        // Ensure all required fields have valid values
        $street = !empty(trim($addressData['street'] ?? '')) ? trim($addressData['street']) : 'Jl. Default Street No. 1';
        $city = !empty(trim($addressData['city'] ?? '')) ? trim($addressData['city']) : 'Jakarta';
        $state = !empty(trim($addressData['state'] ?? '')) ? trim($addressData['state']) : 'DKI Jakarta';
        $postalCode = !empty(trim($addressData['postal_code'] ?? '')) ? trim($addressData['postal_code']) : '10110';
        $country = !empty(trim($addressData['country'] ?? '')) ? strtoupper(trim($addressData['country'])) : 'ID';

        return new Address(
            street: $street,
            city: $city,
            state: $state,
            postalCode: $postalCode,
            country: $country
        );
    }
}