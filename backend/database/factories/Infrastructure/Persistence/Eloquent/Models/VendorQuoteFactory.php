<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

class VendorQuoteFactory extends Factory
{
    protected $model = VendorQuote::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'sourcing_request_id' => VendorSourcing::factory(),
            'vendor_id' => Vendor::factory(),
            'amount' => $this->faker->randomFloat(2, 100000, 10000000),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['pending', 'accepted', 'rejected', 'expired']),
            'valid_until' => $this->faker->dateTimeBetween('now', '+30 days'),
            'terms' => [
                'payment_terms' => $this->faker->randomElement(['DP 50%', 'Full Payment', 'Net 30']),
                'delivery_time' => $this->faker->numberBetween(7, 30) . ' days',
                'warranty' => $this->faker->randomElement(['1 year', '6 months', 'No warranty']),
            ],
        ];
    }
}
