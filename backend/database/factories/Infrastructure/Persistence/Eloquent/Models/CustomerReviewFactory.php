<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerReview;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;
use Ramsey\Uuid\Uuid;

class CustomerReviewFactory extends Factory
{
    protected $model = CustomerReview::class;

    public function definition(): array
    {
        $tenantFactory = TenantEloquentModel::factory();

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'tenant_id' => $tenantFactory,
            'customer_id' => Customer::factory()->for($tenantFactory, 'tenant'),
            'product_id' => Product::factory()->for($tenantFactory, 'tenant'),
            'order_id' => Order::factory()->for($tenantFactory, 'tenant'),
            'rating' => $this->faker->numberBetween(1, 5),
            'title' => $this->faker->optional()->sentence(3),
            'content' => $this->faker->paragraph(),
            'images' => null,
            'is_verified_purchase' => $this->faker->boolean(70),
            'is_approved' => true,
            'approved_at' => now(),
            'approved_by' => null,
            'helpful_count' => 0,
            'not_helpful_count' => 0,
        ];
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => true,
            'approved_at' => now(),
        ]);
    }

    public function unapproved(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_approved' => false,
            'approved_at' => null,
            'approved_by' => null,
        ]);
    }

    public function withRating(int $rating): static
    {
        return $this->state(fn (array $attributes) => [
            'rating' => $rating,
        ]);
    }
}
