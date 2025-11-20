<?php

declare(strict_types=1);

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ProductCategoryFactory extends Factory
{
    protected $model = ProductCategory::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => Tenant::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
            'description' => $this->faker->sentence(),
            'parent_id' => null,
            'sort_order' => $this->faker->numberBetween(0, 100),
            'level' => 0,
            'path' => '/',
            'image' => null,
            'icon' => null,
            'color_scheme' => $this->faker->hexColor(),
            'is_active' => true,
            'is_featured' => false,
            'show_in_menu' => true,
            'allowed_materials' => ['stainless_steel', 'aluminum', 'brass'],
            'quality_levels' => ['standard', 'premium'],
            'customization_options' => [
                ['name' => 'Engraving', 'type' => 'text'],
                ['name' => 'Color', 'type' => 'select'],
            ],
            'seo_title' => $name,
            'seo_description' => $this->faker->sentence(),
            'seo_keywords' => [$this->faker->word(), $this->faker->word()],
            'base_markup_percentage' => 25.00,
            'requires_quote' => false,
        ];
    }

    public function withParent(ProductCategory $parent): self
    {
        return $this->state([
            'parent_id' => $parent->id,
            'level' => $parent->level + 1,
        ]);
    }

    public function featured(): self
    {
        return $this->state([
            'is_featured' => true,
        ]);
    }

    public function inactive(): self
    {
        return $this->state([
            'is_active' => false,
        ]);
    }
}
