<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ContentTypeSeeder extends Seeder
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

        $platformTypes = [
            [
                'tenant_id' => null,
                'name' => 'Blog',
                'slug' => 'blog',
                'description' => 'Traditional blog posts dengan dukungan komentar dan kategori',
                'icon' => 'file-text',
                'default_url_pattern' => '/blog/{slug}',
                'is_commentable' => true,
                'is_categorizable' => true,
                'is_taggable' => true,
                'is_revisioned' => true,
                'scope' => 'platform',
                'is_active' => true,
            ],
            [
                'tenant_id' => null,
                'name' => 'News',
                'slug' => 'news',
                'description' => 'Berita dan update terkini perusahaan',
                'icon' => 'newspaper',
                'default_url_pattern' => '/news/{slug}',
                'is_commentable' => false,
                'is_categorizable' => true,
                'is_taggable' => true,
                'is_revisioned' => true,
                'scope' => 'platform',
                'is_active' => true,
            ],
            [
                'tenant_id' => null,
                'name' => 'Event',
                'slug' => 'event',
                'description' => 'Event, workshop, dan acara perusahaan',
                'icon' => 'calendar',
                'default_url_pattern' => '/events/{slug}',
                'is_commentable' => false,
                'is_categorizable' => true,
                'is_taggable' => true,
                'is_revisioned' => false,
                'scope' => 'platform',
                'is_active' => true,
            ],
            [
                'tenant_id' => null,
                'name' => 'Documentation',
                'slug' => 'docs',
                'description' => 'Dokumentasi teknis dan panduan pengguna',
                'icon' => 'book-open',
                'default_url_pattern' => '/docs/{slug}',
                'is_commentable' => false,
                'is_categorizable' => true,
                'is_taggable' => false,
                'is_revisioned' => true,
                'scope' => 'platform',
                'is_active' => true,
            ],
        ];

        $tenantTypes = [
            [
                'tenant_id' => $tenantId,
                'name' => 'Project Portfolio',
                'slug' => 'portfolio',
                'description' => 'Showcase project etching yang telah diselesaikan',
                'icon' => 'briefcase',
                'default_url_pattern' => '/portfolio/{slug}',
                'is_commentable' => false,
                'is_categorizable' => true,
                'is_taggable' => true,
                'is_revisioned' => false,
                'scope' => 'tenant',
                'is_active' => true,
            ],
            [
                'tenant_id' => $tenantId,
                'name' => 'Tutorial',
                'slug' => 'tutorial',
                'description' => 'Panduan dan tutorial teknik etching',
                'icon' => 'graduation-cap',
                'default_url_pattern' => '/tutorials/{slug}',
                'is_commentable' => true,
                'is_categorizable' => true,
                'is_taggable' => true,
                'is_revisioned' => true,
                'scope' => 'tenant',
                'is_active' => true,
            ],
        ];

        foreach ($platformTypes as $type) {
            DB::table('canplug_pagen_content_types')->insert(array_merge($type, [
                'metadata' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        foreach ($tenantTypes as $type) {
            DB::table('canplug_pagen_content_types')->insert(array_merge($type, [
                'metadata' => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        if ($this->command) {
            $this->command->info('ContentTypeSeeder: 6 content types seeded (4 platform + 2 tenant)');
        }
    }
}
