<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\ShippingAddress;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShippingAddressFactory extends Factory
{
    protected $model = ShippingAddress::class;

    public function definition(): array
    {
        return [
            'uuid' => fake()->uuid(),
            'tenant_id' => null,
            'addressable_type' => 'App\Infrastructure\Persistence\Eloquent\Models\Customer',
            'addressable_id' => null,
            'type' => fake()->randomElement(['billing', 'shipping', 'both']),
            'recipient_name' => fake()->name(),
            'company_name' => fake()->optional(0.3)->company(),
            'phone' => fake()->phoneNumber(),
            'address_line_1' => fake()->streetAddress(),
            'address_line_2' => fake()->optional(0.4)->secondaryAddress(),
            'city' => fake()->city(),
            'state_province' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country_code' => 'IDN',
            'latitude' => fake()->latitude(-6.5, -5.5),
            'longitude' => fake()->longitude(106.5, 107.5),
            'delivery_instructions' => fake()->optional(0.5)->text(100),
            'is_default' => false,
        ];
    }
}
