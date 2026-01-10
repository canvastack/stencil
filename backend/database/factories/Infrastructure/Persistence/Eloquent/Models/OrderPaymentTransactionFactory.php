<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class OrderPaymentTransactionFactory extends Factory
{
    protected $model = OrderPaymentTransaction::class;

    public function definition(): array
    {
        return [
            'tenant_id' => TenantEloquentModel::factory(),
            'order_id' => Order::factory(),
            'customer_id' => null,
            'vendor_id' => null,
            'direction' => 'incoming',
            'type' => 'down_payment',
            'status' => 'completed',
            'amount' => 50000,
            'currency' => 'IDR',
            'method' => 'bank_transfer',
            'reference' => $this->faker->uuid(),
            'due_at' => Carbon::now()->addDays(3),
            'paid_at' => Carbon::now(),
            'metadata' => [
                'notes' => 'Initial down payment',
            ],
        ];
    }

    public function vendorDisbursement(): self
    {
        return $this->state(function () {
            return [
                'direction' => 'outgoing',
                'type' => 'vendor_disbursement',
                'vendor_id' => Vendor::factory(),
                'customer_id' => null,
            ];
        });
    }
}
