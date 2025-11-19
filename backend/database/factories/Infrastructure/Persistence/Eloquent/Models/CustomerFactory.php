<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    public function definition(): array
    {
        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();

        return [
            'tenant_id' => Tenant::factory(),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => $firstName . ' ' . $lastName,
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'status' => 'active',
            'customer_type' => 'individual',
            'company_name' => null,
            'company' => null,
            'address' => $this->faker->address(),
            'city' => $this->faker->city(),
            'province' => $this->faker->state(),
            'postal_code' => $this->faker->postcode(),
            'location' => [
                'lat' => (float) $this->faker->latitude(),
                'lng' => (float) $this->faker->longitude(),
            ],
            'tags' => null,
            'metadata' => null,
            'notes' => $this->faker->optional()->sentence(),
            'tax_id' => null,
            'business_license' => null,
            'total_orders' => 0,
            'total_spent' => 0,
            'last_order_at' => null,
            'last_order_date' => null,
        ];
    }
}
