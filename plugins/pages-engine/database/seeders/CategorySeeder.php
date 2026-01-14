<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = DB::table('tenants')
            ->where('name', 'PT. Custom Etching Xenial')
            ->value('uuid');

        if (!$tenantId) {
            if ($this->command) {
                $this->command->warn('Tenant PT. Custom Etching Xenial not found. Skipping seeder.');
            }
            return;
        }

        $blogTypeId = DB::table('canplug_pagen_content_types')
            ->where('slug', 'blog')
            ->where('scope', 'platform')
            ->value('uuid');

        $portfolioTypeId = DB::table('canplug_pagen_content_types')
            ->where('slug', 'portfolio')
            ->where('tenant_id', $tenantId)
            ->value('uuid');

        if (!$blogTypeId || !$portfolioTypeId) {
            if ($this->command) {
                $this->command->warn('Content types not found. Run ContentTypeSeeder first.');
            }
            return;
        }

        $categories = [];

        $blogTechniques = $this->createCategory($tenantId, $blogTypeId, null, 'Teknik Etching', 'teknik-etching', 
            'Berbagai teknik dan metode etching pada berbagai material');
        $categories[] = $blogTechniques;

        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogTechniques['uuid'], 'Chemical Etching', 'chemical-etching',
            'Teknik etching menggunakan bahan kimia');
        
        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogTechniques['uuid'], 'Laser Etching', 'laser-etching',
            'Teknik etching menggunakan laser presisi tinggi');
        
        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogTechniques['uuid'], 'Sandblasting', 'sandblasting',
            'Teknik sandblasting untuk material keras');

        $blogMaterials = $this->createCategory($tenantId, $blogTypeId, null, 'Material', 'material',
            'Jenis-jenis material yang dapat di-etching');
        $categories[] = $blogMaterials;

        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogMaterials['uuid'], 'Logam', 'logam',
            'Etching pada berbagai jenis logam');
        
        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogMaterials['uuid'], 'Kaca & Kristal', 'kaca-kristal',
            'Etching pada kaca dan kristal');
        
        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogMaterials['uuid'], 'Akrilik', 'akrilik',
            'Etching pada akrilik dan plastik');

        $blogIndustry = $this->createCategory($tenantId, $blogTypeId, null, 'Industri', 'industri',
            'Aplikasi etching di berbagai industri');
        $categories[] = $blogIndustry;

        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogIndustry['uuid'], 'Penghargaan', 'penghargaan',
            'Plakat dan trophy penghargaan');
        
        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogIndustry['uuid'], 'Elektronik', 'elektronik',
            'PCB dan komponen elektronik');
        
        $categories[] = $this->createCategory($tenantId, $blogTypeId, $blogIndustry['uuid'], 'Otomotif', 'otomotif',
            'Etching untuk industri otomotif');

        $categories[] = $this->createCategory($tenantId, $blogTypeId, null, 'Tips & Trik', 'tips-trik',
            'Tips dan trik praktis dalam etching');

        $categories[] = $this->createCategory($tenantId, $blogTypeId, null, 'Maintenance', 'maintenance',
            'Perawatan dan pemeliharaan hasil etching');

        $portfolioProduct = $this->createCategory($tenantId, $portfolioTypeId, null, 'Produk Etching', 'produk-etching',
            'Portfolio berbagai produk etching yang telah dikerjakan');
        $categories[] = $portfolioProduct;

        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioProduct['uuid'], 'Plakat Logam', 'plakat-logam',
            'Plakat etching dari berbagai jenis logam');
        
        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioProduct['uuid'], 'Kristal & Kaca', 'kristal-kaca',
            'Etching pada kristal dan kaca untuk penghargaan');
        
        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioProduct['uuid'], 'Trophy Custom', 'trophy-custom',
            'Trophy custom dengan desain unik');

        $portfolioClient = $this->createCategory($tenantId, $portfolioTypeId, null, 'Klien Korporat', 'klien-korporat',
            'Project untuk klien korporat besar');
        $categories[] = $portfolioClient;

        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioClient['uuid'], 'Perbankan', 'perbankan',
            'Project dari industri perbankan');
        
        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioClient['uuid'], 'Telekomunikasi', 'telekomunikasi',
            'Project dari industri telekomunikasi');
        
        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioClient['uuid'], 'Pemerintahan', 'pemerintahan',
            'Project dari instansi pemerintahan');

        $portfolioEvent = $this->createCategory($tenantId, $portfolioTypeId, null, 'Event Khusus', 'event-khusus',
            'Project untuk event-event khusus');
        $categories[] = $portfolioEvent;

        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioEvent['uuid'], 'Olahraga', 'olahraga',
            'Trophy dan medali untuk event olahraga');
        
        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioEvent['uuid'], 'Pendidikan', 'pendidikan',
            'Penghargaan untuk institusi pendidikan');
        
        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, $portfolioEvent['uuid'], 'Lomba & Kompetisi', 'lomba-kompetisi',
            'Trophy untuk berbagai lomba dan kompetisi');

        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, null, 'Custom Design', 'custom-design',
            'Desain custom sesuai permintaan klien');

        $categories[] = $this->createCategory($tenantId, $portfolioTypeId, null, 'Batch Production', 'batch-production',
            'Produksi massal dalam jumlah besar');

        foreach ($categories as $category) {
            DB::table('canplug_pagen_categories')->insert($category);
        }

        if ($this->command) {
            $this->command->info('CategorySeeder: ' . count($categories) . ' categories seeded with hierarchical structure');
        }
    }

    private function createCategory($tenantId, $contentTypeId, $parentUuid, $name, $slug, $description)
    {
        $uuid = Str::uuid()->toString();
        
        return [
            'uuid' => $uuid,
            'tenant_id' => $tenantId,
            'content_type_id' => $contentTypeId,
            'parent_id' => $parentUuid,
            'name' => $name,
            'slug' => $slug,
            'description' => $description,
            'sort_order' => 0,
            'content_count' => 0,
            'is_active' => true,
            'metadata' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
