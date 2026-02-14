<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class VendorSeeder extends Seeder
{
    /**
     * Seed vendor data for Custom Etching Xenial
     * 
     * This seeder replaces all mock vendor data and provides realistic vendor information
     * for the pilot tenant with proper performance metrics and business details.
     */
    public function run(): void
    {
        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();
        
        if (!$tenant) {
            $this->command->warn('Custom Etching Xenial tenant not found. Skipping vendor seeding.');
            return;
        }

        $vendors = [
            [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id, // Use integer ID, not UUID
                'name' => 'Premium Metal Works',
                'company_name' => 'PT Premium Metal Works Indonesia',
                'code' => 'PMW-001',
                'email' => 'contact@premiummetalworks.com',
                'phone' => '+62 21 5555 1001',
                'contact_person' => 'Budi Santoso',
                'category' => 'Manufacturer',
                'status' => 'active',
                'address' => 'Jl. Industri Raya No. 45, Cakung, Jakarta Timur, DKI Jakarta 13910',
                'location' => json_encode([
                    'latitude' => -6.1751,
                    'longitude' => 106.9250,
                    'city' => 'Jakarta Timur',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                ]),
                'payment_terms' => json_encode(['terms' => '30 days', 'method' => 'bank_transfer']),
                'tax_id' => '01.234.567.8-901.000',
                'bank_name' => 'Bank Central Asia',
                'bank_account' => '1234567890',
                'specializations' => json_encode(['Metal Etching', 'Laser Engraving', 'Custom Plaques']),
                'lead_time' => 10, // days
                'minimum_order' => 50000,
                'rating' => 4.8,
                'total_orders' => 156,
                'metadata' => json_encode([
                    'certifications' => ['ISO 9001:2015', 'ISO 14001:2015'],
                    'website' => 'https://premiummetalworks.com',
                    'business_license' => 'NIB-1234567890123',
                    'total_value' => 234500000,
                    'completion_rate' => 95.50,
                    'performance_score' => 92.5,
                    'average_lead_time_days' => 8,
                ]),
                'notes' => 'Reliable vendor with excellent quality control. Specializes in brass and stainless steel etching.',
                'created_at' => now()->subMonths(12),
                'updated_at' => now()->subDays(2),
            ],
            [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id, // Use integer ID, not UUID
                'name' => 'Crystal Glass Studio',
                'company_name' => 'CV Crystal Glass Studio',
                'code' => 'CGS-002',
                'email' => 'info@crystalglassstudio.co.id',
                'phone' => '+62 21 5555 1002',
                'contact_person' => 'Siti Rahayu',
                'category' => 'Manufacturer',
                'status' => 'active',
                'address' => 'Jl. Raya Bogor KM 28, Cimanggis, Depok, Jawa Barat 16953',
                'location' => json_encode([
                    'latitude' => -6.3751,
                    'longitude' => 106.8650,
                    'city' => 'Depok',
                    'province' => 'Jawa Barat',
                    'country' => 'Indonesia',
                ]),
                'payment_terms' => json_encode(['terms' => '45 days', 'method' => 'bank_transfer']),
                'tax_id' => '01.234.567.8-902.000',
                'bank_name' => 'Bank Mandiri',
                'bank_account' => '0987654321',
                'specializations' => json_encode(['Glass Etching', 'Crystal Engraving', 'Corporate Awards']),
                'lead_time' => 14, // days
                'minimum_order' => 75000,
                'rating' => 4.6,
                'total_orders' => 98,
                'metadata' => json_encode([
                    'certifications' => ['ISO 9001:2015'],
                    'website' => 'https://crystalglassstudio.co.id',
                    'business_license' => 'NIB-1234567890124',
                    'total_value' => 189300000,
                    'completion_rate' => 92.30,
                    'performance_score' => 89.0,
                    'average_lead_time_days' => 12,
                ]),
                'notes' => 'Specializes in high-end glass and crystal products. Premium quality with longer lead times.',
                'created_at' => now()->subMonths(10),
                'updated_at' => now()->subDays(5),
            ],
            [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id, // Use integer ID, not UUID
                'name' => 'Acrylic Pro Solutions',
                'company_name' => 'PT Acrylic Pro Solusi',
                'code' => 'APS-003',
                'email' => 'orders@acrylicpro.id',
                'phone' => '+62 21 5555 1003',
                'contact_person' => 'Ahmad Wijaya',
                'category' => 'Manufacturer',
                'status' => 'active',
                'address' => 'Jl. Gatot Subroto No. 123, Tanah Abang, Jakarta Pusat, DKI Jakarta 10270',
                'location' => json_encode([
                    'latitude' => -6.2088,
                    'longitude' => 106.8456,
                    'city' => 'Jakarta Pusat',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                ]),
                'payment_terms' => json_encode(['terms' => '30 days', 'method' => 'bank_transfer']),
                'tax_id' => '01.234.567.8-903.000',
                'bank_name' => 'Bank Rakyat Indonesia',
                'bank_account' => '5678901234',
                'specializations' => json_encode(['Acrylic Cutting', 'UV Printing', 'Signage']),
                'lead_time' => 7, // days
                'minimum_order' => 35000,
                'rating' => 4.2,
                'total_orders' => 203,
                'metadata' => json_encode([
                    'certifications' => ['PROPER Green'],
                    'website' => 'https://acrylicpro.id',
                    'business_license' => 'NIB-1234567890125',
                    'total_value' => 156800000,
                    'completion_rate' => 88.70,
                    'performance_score' => 85.5,
                    'average_lead_time_days' => 6,
                ]),
                'notes' => 'Fast turnaround for standard acrylic products. Competitive pricing.',
                'created_at' => now()->subMonths(15),
                'updated_at' => now()->subDays(1),
            ],
            [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id, // Use integer ID, not UUID
                'name' => 'Elite Engraving Co',
                'company_name' => 'PT Elite Engraving Corporation',
                'code' => 'EEC-004',
                'email' => 'hello@eliteengraving.com',
                'phone' => '+62 21 5555 1004',
                'contact_person' => 'Linda Kusuma',
                'category' => 'Service Provider',
                'status' => 'active',
                'address' => 'Jl. Mampang Prapatan No. 67, Pancoran, Jakarta Selatan, DKI Jakarta 12790',
                'location' => json_encode([
                    'latitude' => -6.2615,
                    'longitude' => 106.8416,
                    'city' => 'Jakarta Selatan',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                ]),
                'payment_terms' => json_encode(['terms' => '30 days', 'method' => 'bank_transfer']),
                'tax_id' => '01.234.567.8-904.000',
                'bank_name' => 'Bank Central Asia',
                'bank_account' => '2345678901',
                'specializations' => json_encode(['Laser Engraving', 'Precision Etching', 'Custom Design']),
                'lead_time' => 10, // days
                'minimum_order' => 45000,
                'rating' => 4.7,
                'total_orders' => 142,
                'metadata' => json_encode([
                    'certifications' => ['ISO 9001:2015'],
                    'website' => 'https://eliteengraving.com',
                    'business_license' => 'NIB-1234567890126',
                    'total_value' => 198400000,
                    'completion_rate' => 94.40,
                    'performance_score' => 91.0,
                    'average_lead_time_days' => 9,
                ]),
                'notes' => 'High precision work with excellent design consultation services.',
                'created_at' => now()->subMonths(8),
                'updated_at' => now()->subDays(3),
            ],
            [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id, // Use integer ID, not UUID
                'name' => 'Precision Craft Ltd',
                'company_name' => 'PT Precision Craft Limitasi',
                'code' => 'PCL-005',
                'email' => 'sales@precisioncraft.co.id',
                'phone' => '+62 21 5555 1005',
                'contact_person' => 'Hendra Gunawan',
                'category' => 'Manufacturer',
                'status' => 'active',
                'address' => 'Jl. Raya Bekasi KM 18, Cakung, Jakarta Timur, DKI Jakarta 13940',
                'location' => json_encode([
                    'latitude' => -6.1845,
                    'longitude' => 106.9456,
                    'city' => 'Jakarta Timur',
                    'province' => 'DKI Jakarta',
                    'country' => 'Indonesia',
                ]),
                'payment_terms' => json_encode(['terms' => '45 days', 'method' => 'bank_transfer']),
                'tax_id' => '01.234.567.8-905.000',
                'bank_name' => 'Bank Mandiri',
                'bank_account' => '3456789012',
                'specializations' => json_encode(['Metal Fabrication', 'Industrial Plaques', 'Safety Signs']),
                'lead_time' => 14, // days
                'minimum_order' => 60000,
                'rating' => 4.4,
                'total_orders' => 87,
                'metadata' => json_encode([
                    'certifications' => ['SNI 7396:2008'],
                    'website' => 'https://precisioncraft.co.id',
                    'business_license' => 'NIB-1234567890127',
                    'total_value' => 134600000,
                    'completion_rate' => 90.80,
                    'performance_score' => 87.5,
                    'average_lead_time_days' => 11,
                ]),
                'notes' => 'Specializes in industrial-grade products and bulk orders.',
                'created_at' => now()->subMonths(6),
                'updated_at' => now()->subDays(4),
            ],
        ];

        foreach ($vendors as $vendorData) {
            Vendor::create($vendorData);
        }

        $this->command->info('Created ' . count($vendors) . ' vendors for Custom Etching Xenial tenant');
    }
}
