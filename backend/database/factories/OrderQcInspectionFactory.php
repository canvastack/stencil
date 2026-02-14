<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Models\OrderQcInspection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderQcInspection>
 */
class OrderQcInspectionFactory extends Factory
{
    protected $model = OrderQcInspection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $decision = $this->faker->randomElement(['approved', 'approved_with_notes', 'rejected', 'needs_rework']);
        $criticalItemsPassed = in_array($decision, ['approved', 'approved_with_notes']);
        
        return [
            'tenant_id' => 1,
            'order_id' => Order::factory(),
            'inspector_user_id' => User::factory(),
            'inspection_date' => $this->faker->dateTimeBetween('-1 month', 'now'),
            'inspection_duration_minutes' => $this->faker->numberBetween(15, 60),
            'checklist_results' => $this->generateChecklistResults($criticalItemsPassed),
            'overall_rating' => $this->faker->randomElement(['excellent', 'good', 'acceptable', 'poor']),
            'total_score' => $this->faker->randomFloat(2, 70, 100),
            'critical_items_passed' => $criticalItemsPassed,
            'decision' => $decision,
            'decision_notes' => $decision === 'approved' ? null : $this->faker->sentence(),
            'photos' => $this->generatePhotos(),
            'photo_count' => $this->faker->numberBetween(8, 15),
            'vendor_notified_at' => in_array($decision, ['rejected', 'needs_rework']) ? now() : null,
            'vendor_response' => null,
            'rework_deadline' => in_array($decision, ['rejected', 'needs_rework']) 
                ? $this->faker->dateTimeBetween('now', '+7 days') 
                : null,
            'is_reinspection' => false,
            'original_inspection_id' => null,
            'reinspection_count' => 0,
        ];
    }

    /**
     * Generate checklist results
     */
    private function generateChecklistResults(bool $criticalItemsPassed): array
    {
        $status = $criticalItemsPassed ? 'pass' : $this->faker->randomElement(['pass', 'fail', 'needs_rework']);
        
        return [
            'physical_specifications' => [
                'dimensions_accuracy' => [
                    'status' => $status,
                    'notes' => 'All dimensions within tolerance',
                    'photos' => ['photo1.jpg', 'photo2.jpg'],
                    'measurements' => [
                        'length' => '150mm',
                        'width' => '100mm',
                        'height' => '3mm',
                    ],
                ],
                'material_verification' => [
                    'status' => $status,
                    'notes' => 'Material verified',
                    'photos' => ['photo3.jpg'],
                ],
                'weight_check' => [
                    'status' => 'pass',
                    'notes' => 'Weight within range',
                    'weight_grams' => 250,
                ],
            ],
            'etching_quality' => [
                'etching_depth' => [
                    'status' => 'pass',
                    'notes' => 'Consistent depth',
                    'photos' => ['photo4.jpg', 'photo5.jpg'],
                ],
                'design_accuracy' => [
                    'status' => $status,
                    'notes' => 'Design matches artwork',
                    'photos' => ['photo6.jpg', 'photo7.jpg'],
                ],
                'line_quality' => [
                    'status' => 'pass',
                    'notes' => 'Sharp lines',
                    'photos' => ['photo8.jpg'],
                ],
            ],
            'finishing_quality' => [
                'surface_finish' => [
                    'status' => $status,
                    'notes' => 'Good surface finish',
                    'photos' => ['photo9.jpg', 'photo10.jpg'],
                ],
                'edge_quality' => [
                    'status' => 'pass',
                    'notes' => 'Smooth edges',
                    'photos' => ['photo11.jpg'],
                ],
                'color_consistency' => [
                    'status' => 'pass',
                    'notes' => 'Uniform color',
                    'photos' => ['photo12.jpg'],
                ],
            ],
        ];
    }

    /**
     * Generate photo URLs
     */
    private function generatePhotos(): array
    {
        $count = $this->faker->numberBetween(8, 15);
        $photos = [];
        
        for ($i = 1; $i <= $count; $i++) {
            $photos[] = "qc-photos/photo{$i}.jpg";
        }
        
        return $photos;
    }

    /**
     * State for approved inspection
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'approved',
            'critical_items_passed' => true,
            'total_score' => $this->faker->randomFloat(2, 90, 100),
            'overall_rating' => $this->faker->randomElement(['excellent', 'good']),
            'decision_notes' => null,
            'vendor_notified_at' => null,
            'rework_deadline' => null,
        ]);
    }

    /**
     * State for rejected inspection
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'decision' => 'rejected',
            'critical_items_passed' => false,
            'total_score' => $this->faker->randomFloat(2, 40, 70),
            'overall_rating' => 'poor',
            'decision_notes' => 'Multiple quality issues found',
            'vendor_notified_at' => now(),
            'rework_deadline' => $this->faker->dateTimeBetween('now', '+7 days'),
        ]);
    }

    /**
     * State for re-inspection
     */
    public function reinspection(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_reinspection' => true,
            'original_inspection_id' => OrderQcInspection::factory(),
        ]);
    }
}
