<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VendorProductionUpdate>
 */
class VendorProductionUpdateFactory extends Factory
{
    protected $model = VendorProductionUpdate::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = VendorProductionUpdate::getValidStatuses();
        $status = $this->faker->randomElement($statuses);
        
        // Progress percentage based on status
        $progressPercentage = match($status) {
            VendorProductionUpdate::STATUS_STARTED => $this->faker->numberBetween(0, 20),
            VendorProductionUpdate::STATUS_IN_PROGRESS => $this->faker->numberBetween(20, 80),
            VendorProductionUpdate::STATUS_QUALITY_CHECK => $this->faker->numberBetween(80, 95),
            VendorProductionUpdate::STATUS_COMPLETED => 100,
            VendorProductionUpdate::STATUS_DELAYED => $this->faker->numberBetween(10, 70),
            default => 0,
        };

        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => Tenant::factory(),
            'purchase_order_id' => VendorPurchaseOrder::factory(),
            'vendor_id' => User::factory(),
            'status' => $status,
            'progress_percentage' => $progressPercentage,
            'notes' => $this->faker->optional(0.7)->paragraph(),
            'estimated_completion_date' => $this->faker->optional(0.8)->dateTimeBetween('now', '+30 days'),
            'actual_completion_date' => $status === VendorProductionUpdate::STATUS_COMPLETED 
                ? $this->faker->dateTimeBetween('-7 days', 'now')
                : null,
            'photos' => $this->faker->optional(0.6)->randomElements([
                [
                    'id' => $this->faker->uuid(),
                    'url' => '/storage/production-updates/photo1.jpg',
                    'thumbnail_url' => '/storage/production-updates/thumb-photo1.jpg',
                    'caption' => 'Material preparation',
                    'uploaded_at' => now()->toISOString(),
                ],
                [
                    'id' => $this->faker->uuid(),
                    'url' => '/storage/production-updates/photo2.jpg',
                    'thumbnail_url' => '/storage/production-updates/thumb-photo2.jpg',
                    'caption' => 'Work in progress',
                    'uploaded_at' => now()->toISOString(),
                ],
            ], $this->faker->numberBetween(1, 2)),
            'is_milestone' => $this->faker->boolean(20), // 20% chance of being milestone
            'created_by' => User::factory(),
        ];
    }

    /**
     * Indicate that the update is a milestone.
     */
    public function milestone(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_milestone' => true,
        ]);
    }

    /**
     * Indicate that the update is started status.
     */
    public function started(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VendorProductionUpdate::STATUS_STARTED,
            'progress_percentage' => $this->faker->numberBetween(0, 20),
        ]);
    }

    /**
     * Indicate that the update is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VendorProductionUpdate::STATUS_IN_PROGRESS,
            'progress_percentage' => $this->faker->numberBetween(20, 80),
        ]);
    }

    /**
     * Indicate that the update is in quality check.
     */
    public function qualityCheck(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VendorProductionUpdate::STATUS_QUALITY_CHECK,
            'progress_percentage' => $this->faker->numberBetween(80, 95),
        ]);
    }

    /**
     * Indicate that the update is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VendorProductionUpdate::STATUS_COMPLETED,
            'progress_percentage' => 100,
            'actual_completion_date' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    /**
     * Indicate that the update is delayed.
     */
    public function delayed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => VendorProductionUpdate::STATUS_DELAYED,
            'progress_percentage' => $this->faker->numberBetween(10, 70),
            'estimated_completion_date' => $this->faker->dateTimeBetween('+7 days', '+30 days'),
        ]);
    }

    /**
     * Indicate that the update has photos.
     */
    public function withPhotos(int $count = 2): static
    {
        $photos = [];
        for ($i = 0; $i < $count; $i++) {
            $photos[] = [
                'id' => $this->faker->uuid(),
                'url' => "/storage/production-updates/photo{$i}.jpg",
                'thumbnail_url' => "/storage/production-updates/thumb-photo{$i}.jpg",
                'caption' => $this->faker->sentence(),
                'uploaded_at' => now()->toISOString(),
            ];
        }

        return $this->state(fn (array $attributes) => [
            'photos' => $photos,
        ]);
    }
}

