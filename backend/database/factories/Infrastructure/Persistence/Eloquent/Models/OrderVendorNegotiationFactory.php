<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class OrderVendorNegotiationFactory extends Factory
{
    protected $model = OrderVendorNegotiation::class;

    public function definition(): array
    {
        $tenantFactory = TenantEloquentModel::factory();

        return [
            'tenant_id' => $tenantFactory,
            'order_id' => Order::factory()->for($tenantFactory, 'tenant'),
            'vendor_id' => Vendor::factory()->for($tenantFactory, 'tenant'),
            'status' => 'draft', // Changed from 'open' to 'draft' to match new status enum
            'initial_offer' => 150000,
            'latest_offer' => 140000,
            'currency' => 'IDR',
            'quote_details' => [
                'delivery_days' => 10,
                'payment_terms' => '50-50',
            ],
            'history' => [
                [
                    'type' => 'customer_offer',
                    'amount' => 150000,
                    'timestamp' => Carbon::now()->toIso8601String(),
                ],
            ],
            'round' => 1,
            'expires_at' => Carbon::now()->addDays(5),
            'closed_at' => null,
        ];
    }

    public function accepted(): self
    {
        return $this->state(function () {
            return [
                'status' => 'accepted',
                'closed_at' => Carbon::now(),
            ];
        });
    }

    public function rejected(): self
    {
        return $this->state(function () {
            return [
                'status' => 'rejected',
                'closed_at' => Carbon::now(),
            ];
        });
    }

    public function sent(): self
    {
        return $this->state(function () {
            return [
                'status' => 'sent',
            ];
        });
    }

    public function countered(): self
    {
        return $this->state(function () {
            return [
                'status' => 'countered',
            ];
        });
    }

    public function pendingResponse(): self
    {
        return $this->state(function () {
            return [
                'status' => 'pending_response',
            ];
        });
    }

    public function expired(): self
    {
        return $this->state(function () {
            return [
                'status' => 'expired',
                'expires_at' => Carbon::now()->subDay(),
            ];
        });
    }
}
