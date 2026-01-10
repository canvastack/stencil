<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    public function definition(): array
    {
        $tenantFactory = TenantEloquentModel::factory();

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'tenant_id' => $tenantFactory,
            'name' => $this->faker->company(),
            'code' => Str::upper($this->faker->bothify('VND-###??')),
            'company_name' => $this->faker->company(),
            'email' => $this->faker->companyEmail(),
            'phone' => $this->faker->phoneNumber(),
            'contact_person' => $this->faker->name(),
            'address' => $this->faker->address(),
            'status' => 'active',
            'category' => $this->faker->randomElement(['manufacturer', 'supplier', 'distributor', 'contractor']),
            'tax_id' => Str::upper($this->faker->bothify('NPWP##########')),
            'bank_account' => $this->faker->bankAccountNumber(),
            'bank_name' => $this->faker->randomElement(['BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga']),
            'payment_terms' => [
                'type' => 'net30',
                'details' => 'Payment due in 30 days',
            ],
            'contacts' => [
                'person' => $this->faker->name(),
                'position' => $this->faker->jobTitle(),
                'phone' => $this->faker->phoneNumber(),
            ],
            'specializations' => [
                $this->faker->randomElement(['metal_etching', 'glass_etching', 'acrylic_cutting', 'laser_engraving']),
                $this->faker->randomElement(['cnc_machining', 'precision_cutting', '3d_printing', 'finishing']),
            ],
            'location' => [
                'latitude' => $this->faker->latitude(-10, 5),
                'longitude' => $this->faker->longitude(95, 141),
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
            ],
            'lead_time' => $this->faker->numberBetween(3, 30),
            'minimum_order' => $this->faker->numberBetween(100000, 5000000),
            'rating' => $this->faker->randomFloat(2, 3.5, 5.0),
            'total_orders' => $this->faker->numberBetween(0, 200),
            'average_lead_time_days' => $this->faker->numberBetween(3, 30),
            'performance_score' => $this->faker->randomFloat(2, 70, 100),
            'completion_rate' => $this->faker->randomFloat(2, 85, 100),
            'metadata' => [
                'preferred' => $this->faker->boolean(30),
                'verified' => $this->faker->boolean(70),
            ],
            'notes' => $this->faker->optional()->sentence(),
        ];
    }
}
