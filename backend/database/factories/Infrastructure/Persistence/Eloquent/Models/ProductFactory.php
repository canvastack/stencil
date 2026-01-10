<?php

declare(strict_types=1);

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'tenant_id' => TenantEloquentModel::factory(),
            'name' => Str::title($name),
            'sku' => Str::upper($this->faker->unique()->bothify('SKU-####')),
            'description' => $this->faker->sentence(),
            'price' => $this->faker->numberBetween(10000, 500000),
            'currency' => 'IDR',
            'status' => 'published',
            'type' => 'physical',
            'stock_quantity' => $this->faker->numberBetween(10, 200),
            'low_stock_threshold' => 10,
            'track_inventory' => true,
            'categories' => [$this->faker->randomElement(['core', 'premium', 'standard'])],
            'tags' => [$this->faker->randomElement(['featured', 'popular', 'new'])],
            'vendor_price' => $this->faker->numberBetween(5000, 300000),
            'markup_percentage' => 25,
            'images' => [
                '/images/products/' . Str::slug($name) . '_1.jpg',
            ],
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
            'metadata' => ['origin' => $this->faker->country()],
            'dimensions' => [
                'length' => $this->faker->numberBetween(10, 100),
                'width' => $this->faker->numberBetween(10, 100),
                'height' => $this->faker->numberBetween(5, 50),
                'weight' => $this->faker->randomFloat(2, 0.5, 25),
            ],
        ];
    }
}
