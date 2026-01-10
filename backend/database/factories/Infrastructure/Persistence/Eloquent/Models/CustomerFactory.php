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
            'name' => $firstName . ' ' . $lastName,
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'status' => 'active',
            'customer_type' => $this->faker->randomElement(['individual', 'business']),
            'company_name' => $this->faker->optional(0.3)->company(),
            'company' => $this->faker->optional(0.3)->company(),
            'address' => $this->faker->address(),
            'city' => $this->faker->city(),
            'province' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'location' => [
                'lat' => (float) $this->faker->latitude(),
                'lng' => (float) $this->faker->longitude(),
            ],
            'tags' => $this->faker->optional()->randomElements(['vip', 'wholesale', 'retail', 'premium'], 2),
            'metadata' => $this->faker->optional()->passthrough(['source' => 'web', 'verified' => true]),
            'notes' => $this->faker->optional()->sentence(),
            'tax_id' => $this->faker->optional()->numerify('NPWP##########'),
            'business_license' => $this->faker->optional()->numerify('BL-####-####-####'),
            'total_orders' => 0,
            'total_spent' => 0,
            'last_order_at' => $this->faker->optional()->dateTimeBetween('-1 year', 'now'),
            'last_order_date' => $this->faker->optional()->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
