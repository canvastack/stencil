<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        $tenantFactory = Tenant::factory();

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'tenant_id' => $tenantFactory,
            'name' => $this->faker->company(),
            'code' => Str::upper($this->faker->bothify('VND-###')),
            'email' => $this->faker->companyEmail(),
            'phone' => $this->faker->phoneNumber(),
            'contact_person' => $this->faker->name(),
            'category' => $this->faker->randomElement(['printing', 'packaging', 'logistics']),
            'status' => 'active',
            'location' => [
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
            ],
            'address' => $this->faker->address(),
            'payment_terms' => [
                'type' => 'net30',
                'details' => 'Payment due in 30 days',
            ],
            'tax_id' => Str::upper($this->faker->bothify('NPWP##########')),
            'bank_account' => $this->faker->bankAccountNumber(),
            'bank_name' => $this->faker->company(),
            'specializations' => [$this->faker->word(), $this->faker->word()],
            'lead_time' => $this->faker->numberBetween(5, 20),
            'minimum_order' => $this->faker->numberBetween(1, 50),
            'rating' => $this->faker->randomFloat(2, 3.5, 5.0),
            'total_orders' => $this->faker->numberBetween(0, 200),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
