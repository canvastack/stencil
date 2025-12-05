<?php

namespace App\Console\Commands;

use App\Domain\Content\Entities\TenantPage;
use Illuminate\Console\Command;

class CreateTenantContentCommand extends Command
{
    protected $signature = 'content:create-tenant-pages {tenant_id}';
    protected $description = 'Create default content pages for a tenant';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
        $this->info("Creating content for tenant ID: {$tenantId}");
        
        try {
            // Create sample content
            $home = TenantPage::create([
                'title' => 'Home',
                'slug' => 'home',
                'description' => 'Business homepage with company overview',
                'content' => [
                    'hero' => [
                        'title' => 'Welcome to Our Business',
                        'subtitle' => 'Professional services and quality products',
                        'cta_text' => 'Get Started'
                    ]
                ],
                'status' => 'published',
                'page_type' => 'home',
                'is_homepage' => true,
                'sort_order' => 1,
                'published_at' => now()
            ]);

            $this->info("✅ Created homepage: {$home->title}");

            $about = TenantPage::create([
                'title' => 'About Us',
                'slug' => 'about',
                'description' => 'About our company',
                'content' => [
                    'intro' => [
                        'title' => 'About Our Company',
                        'description' => 'We provide excellent services.'
                    ]
                ],
                'status' => 'published',
                'page_type' => 'about',
                'sort_order' => 2,
                'published_at' => now()
            ]);

            $this->info("✅ Created about page: {$about->title}");

            $this->info("🎉 Content creation completed successfully!");
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to create content: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}