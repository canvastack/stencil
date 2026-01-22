<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Carbon\Carbon;

class TenantUrlConfigurationSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = TenantEloquentModel::take(10)->get();

        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Skipping URL configuration seeding.');
            return;
        }

        $this->command->info('Seeding URL configurations for ' . $tenants->count() . ' tenants...');

        $configs = [];

        foreach ($tenants as $tenant) {
            $subdomain = $this->generateSubdomain($tenant->slug);
            $urlPath = $tenant->slug;

            $configs[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id,
                'url_pattern' => 'subdomain',
                'is_primary' => true,
                'is_enabled' => true,
                'subdomain' => $subdomain,
                'url_path' => null,
                'custom_domain_id' => null,
                'force_https' => true,
                'redirect_to_primary' => false,
                'meta_title' => $tenant->name . ' - E-Commerce Platform',
                'meta_description' => 'Shop the best products from ' . $tenant->name . '. Secure online shopping with fast delivery.',
                'og_image_url' => 'https://cdn.canvastack.com/logos/' . $tenant->slug . '.jpg',
                'created_at' => Carbon::now()->subDays(rand(30, 180)),
                'updated_at' => Carbon::now()->subDays(rand(1, 10)),
                'deleted_at' => null,
            ];

            if (rand(0, 100) > 30) {
                $configs[] = [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $tenant->id,
                    'url_pattern' => 'path',
                    'is_primary' => false,
                    'is_enabled' => true,
                    'subdomain' => null,
                    'url_path' => $urlPath,
                    'custom_domain_id' => null,
                    'force_https' => true,
                    'redirect_to_primary' => true,
                    'meta_title' => null,
                    'meta_description' => null,
                    'og_image_url' => null,
                    'created_at' => Carbon::now()->subDays(rand(30, 180)),
                    'updated_at' => Carbon::now()->subDays(rand(1, 10)),
                    'deleted_at' => null,
                ];
            }
        }

        DB::table('tenant_url_configurations')->insert($configs);

        $this->command->info('Successfully seeded ' . count($configs) . ' URL configurations.');
    }

    private function generateSubdomain(string $slug): string
    {
        return strtolower(str_replace(['_', ' '], '-', $slug));
    }
}
