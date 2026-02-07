<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Ramsey\Uuid\Uuid;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();
        $tenantFactory = TenantEloquentModel::factory();

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'tenant_id' => $tenantFactory,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => $firstName . ' ' . $lastName, // ✅ EXISTS (added in phase3)
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'status' => 'active',
            'customer_type' => $this->faker->randomElement(['individual', 'business']), // ✅ CORRECT (renamed from type in phase3)
            'company_name' => $this->faker->optional(0.3)->company(),
            'company' => $this->faker->optional(0.3)->company(), // ✅ EXISTS (added in phase3)
            'address' => $this->faker->address(),
            'city' => $this->faker->city(), // ✅ EXISTS (added in phase3)
            'province' => $this->faker->state(), // ✅ EXISTS (added in phase3)
            'postal_code' => $this->faker->postcode(), // ✅ EXISTS (added in phase3)
            'location' => [ // ✅ EXISTS (added in phase3)
                'lat' => (float) $this->faker->latitude(),
                'lng' => (float) $this->faker->longitude(),
            ],
            'tags' => $this->faker->optional()->randomElements(['vip', 'wholesale', 'retail', 'premium'], 2),
            'metadata' => $this->faker->optional()->passthrough(['source' => 'web', 'verified' => true]),
            'notes' => $this->faker->optional()->sentence(), // ✅ EXISTS (added in phase3)
            'tax_id' => $this->faker->optional()->numerify('NPWP##########'), // ✅ EXISTS (added in phase3)
            'business_license' => $this->faker->optional()->numerify('BL-####-####-####'), // ✅ EXISTS (added in phase3)
            'total_orders' => 0, // ✅ EXISTS (added in phase3)
            'total_spent' => 0, // ✅ EXISTS (added in phase3)
            'last_order_at' => $this->faker->optional()->dateTimeBetween('-1 year', 'now'),
            'last_order_date' => $this->faker->optional()->dateTimeBetween('-1 year', 'now'), // ✅ EXISTS (added in phase3)
        ];
    }
}
