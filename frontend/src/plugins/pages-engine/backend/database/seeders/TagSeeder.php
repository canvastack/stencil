<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = DB::table('tenants')
            ->where('name', 'PT. Custom Etching Xenial')
            ->value('id');

        if (!$tenantId) {
            if ($this->command) {
                $this->command->warn('Tenant PT. Custom Etching Xenial not found. Skipping seeder.');
            }
            return;
        }

        $tags = [
            ['name' => 'Stainless Steel', 'slug' => 'stainless-steel', 'description' => 'Etching pada stainless steel'],
            ['name' => 'Brass', 'slug' => 'brass', 'description' => 'Etching pada kuningan'],
            ['name' => 'Aluminum', 'slug' => 'aluminum', 'description' => 'Etching pada aluminium'],
            ['name' => 'Copper', 'slug' => 'copper', 'description' => 'Etching pada tembaga'],
            ['name' => 'Crystal', 'slug' => 'crystal', 'description' => 'Etching pada kristal'],
            ['name' => 'Glass', 'slug' => 'glass', 'description' => 'Etching pada kaca'],
            ['name' => 'Acrylic', 'slug' => 'acrylic', 'description' => 'Etching pada akrilik'],
            ['name' => 'Trophy', 'slug' => 'trophy', 'description' => 'Trophy dan piala'],
            ['name' => 'Plaque', 'slug' => 'plaque', 'description' => 'Plakat penghargaan'],
            ['name' => 'Medal', 'slug' => 'medal', 'description' => 'Medali'],
            ['name' => 'Award', 'slug' => 'award', 'description' => 'Penghargaan'],
            ['name' => 'Corporate Gift', 'slug' => 'corporate-gift', 'description' => 'Souvenir korporat'],
            ['name' => 'Custom Design', 'slug' => 'custom-design', 'description' => 'Desain custom'],
            ['name' => 'Laser Engraving', 'slug' => 'laser-engraving', 'description' => 'Laser engraving'],
            ['name' => 'Chemical Etching', 'slug' => 'chemical-etching', 'description' => 'Chemical etching'],
            ['name' => 'Sandblasting', 'slug' => 'sandblasting', 'description' => 'Sandblasting'],
            ['name' => 'High Precision', 'slug' => 'high-precision', 'description' => 'Presisi tinggi'],
            ['name' => 'Bulk Order', 'slug' => 'bulk-order', 'description' => 'Pesanan massal'],
            ['name' => '3D Etching', 'slug' => '3d-etching', 'description' => 'Etching 3 dimensi'],
            ['name' => 'Color Filling', 'slug' => 'color-filling', 'description' => 'Pewarnaan'],
        ];

        foreach ($tags as $tag) {
            DB::table('canplug_pagen_tags')->insert([
                'tenant_id' => $tenantId,
                'name' => $tag['name'],
                'slug' => $tag['slug'],
                'description' => $tag['description'],
                'content_count' => 0,
                'metadata' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($this->command) {
            $this->command->info('TagSeeder: ' . count($tags) . ' tags seeded');
        }
    }
}
