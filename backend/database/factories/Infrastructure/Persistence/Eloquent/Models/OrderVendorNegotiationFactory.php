<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class OrderVendorNegotiationFactory extends Factory
{
    protected $model = OrderVendorNegotiation::class;

    public function definition(): array
    {
        $tenantFactory = Tenant::factory();

        return [
            'tenant_id' => $tenantFactory,
            'order_id' => Order::factory()->for($tenantFactory, 'tenant'),
            'vendor_id' => Vendor::factory()->for($tenantFactory, 'tenant'),
            'status' => 'open',
            'initial_offer' => 150000,
            'latest_offer' => 140000,
            'currency' => 'IDR',
            'terms' => [
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
}
