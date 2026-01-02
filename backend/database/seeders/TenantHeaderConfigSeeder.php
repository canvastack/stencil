<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantHeaderConfigSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all tenants for multi-tenant distribution
        $tenants = DB::table('tenants')->get();
        
        if ($tenants->isEmpty()) {
            $this->command->error('No tenants found. Please run TenantSeeder first.');
            return;
        }

        $this->command->info('Seeding header configurations for ' . $tenants->count() . ' tenants...');

        // Realistic header configuration templates
        $headerTemplates = [
            [
                'brand_name' => 'Etching Premium',
                'brand_initials' => 'EP',
                'brand_tagline' => 'Solusi Etching Profesional untuk Industri',
                'header_style' => 'default',
                'show_cart' => true,
                'show_search' => true,
                'show_login' => true,
                'sticky_header' => true,
                'transparent_on_scroll' => false,
                'styling_options' => [
                    'backgroundColor' => '#ffffff',
                    'textColor' => '#1F2937',
                    'activeColor' => '#FF6B35',
                    'hoverColor' => '#E55A2B'
                ],
                'login_button_text' => 'Masuk',
                'cart_button_text' => 'Keranjang',
                'search_placeholder' => 'Cari produk atau layanan...',
            ],
            [
                'brand_name' => 'Custom Etching Solutions',
                'brand_initials' => 'CES',
                'brand_tagline' => 'Presisi dan Kualitas Terbaik',
                'header_style' => 'minimal',
                'show_cart' => true,
                'show_search' => true,
                'show_login' => true,
                'sticky_header' => true,
                'transparent_on_scroll' => true,
                'styling_options' => [
                    'backgroundColor' => '#F9FAFB',
                    'textColor' => '#111827',
                    'activeColor' => '#3B82F6',
                    'hoverColor' => '#2563EB'
                ],
                'login_button_text' => 'Login',
                'cart_button_text' => 'Cart',
                'search_placeholder' => 'Search products...',
            ],
            [
                'brand_name' => 'Xenial Precision Engraving',
                'brand_initials' => 'XPE',
                'brand_tagline' => 'Teknik Gravir Terdepan',
                'header_style' => 'centered',
                'show_cart' => true,
                'show_search' => false,
                'show_login' => true,
                'sticky_header' => false,
                'transparent_on_scroll' => false,
                'styling_options' => [
                    'backgroundColor' => '#1F2937',
                    'textColor' => '#F9FAFB',
                    'activeColor' => '#FBBF24',
                    'hoverColor' => '#F59E0B'
                ],
                'login_button_text' => 'Sign In',
                'cart_button_text' => 'Shopping Bag',
                'search_placeholder' => 'Find items...',
            ],
            [
                'brand_name' => 'Professional Marking Services',
                'brand_initials' => 'PMS',
                'brand_tagline' => 'Marking & Engraving Excellence',
                'header_style' => 'default',
                'show_cart' => false,
                'show_search' => true,
                'show_login' => true,
                'sticky_header' => true,
                'transparent_on_scroll' => false,
                'styling_options' => [
                    'backgroundColor' => '#FFFFFF',
                    'textColor' => '#374151',
                    'activeColor' => '#10B981',
                    'hoverColor' => '#059669'
                ],
                'login_button_text' => 'Portal',
                'cart_button_text' => 'Basket',
                'search_placeholder' => 'Cari layanan kami...',
            ],
            [
                'brand_name' => 'Industrial Etching Pro',
                'brand_initials' => 'IEP',
                'brand_tagline' => 'Solusi Industri Terpercaya',
                'header_style' => 'default',
                'show_cart' => true,
                'show_search' => true,
                'show_login' => true,
                'sticky_header' => true,
                'transparent_on_scroll' => true,
                'styling_options' => [
                    'backgroundColor' => '#F3F4F6',
                    'textColor' => '#1F2937',
                    'activeColor' => '#EF4444',
                    'hoverColor' => '#DC2626'
                ],
                'login_button_text' => 'Masuk Akun',
                'cart_button_text' => 'Troli',
                'search_placeholder' => 'Pencarian cepat...',
            ],
            [
                'brand_name' => 'Artisan Engraving Studio',
                'brand_initials' => 'AES',
                'brand_tagline' => 'Kreativitas Bertemu Presisi',
                'header_style' => 'minimal',
                'show_cart' => true,
                'show_search' => true,
                'show_login' => true,
                'sticky_header' => false,
                'transparent_on_scroll' => false,
                'styling_options' => [
                    'backgroundColor' => '#FEFCE8',
                    'textColor' => '#713F12',
                    'activeColor' => '#A16207',
                    'hoverColor' => '#854D0E'
                ],
                'login_button_text' => 'Log In',
                'cart_button_text' => 'My Cart',
                'search_placeholder' => 'Explore services...',
            ],
        ];

        // Create header config for each tenant
        foreach ($tenants as $index => $tenant) {
            // Skip if already has header config
            $exists = DB::table('tenant_header_configs')
                ->where('tenant_id', $tenant->id)
                ->exists();
                
            if ($exists) {
                $this->command->info("Tenant {$tenant->name} already has header config, skipping...");
                continue;
            }

            // Use template or create custom
            $templateIndex = $index % count($headerTemplates);
            $template = $headerTemplates[$templateIndex];
            
            // Customize based on tenant name
            if ($tenant->slug !== 'default-tenant') {
                $template['brand_name'] = $tenant->name;
                $template['brand_initials'] = $this->generateInitials($tenant->name);
            }

            DB::table('tenant_header_configs')->insert([
                'tenant_id' => $tenant->id,
                'uuid' => DB::raw('gen_random_uuid()'),
                'brand_name' => $template['brand_name'],
                'brand_initials' => $template['brand_initials'],
                'brand_tagline' => $template['brand_tagline'],
                'logo_url' => null,
                'logo_dark_url' => null,
                'logo_width' => 120,
                'logo_height' => 40,
                'logo_alt_text' => $template['brand_name'] . ' Logo',
                'use_logo' => false, // Use initials for demo
                'header_style' => $template['header_style'],
                'show_cart' => $template['show_cart'],
                'show_search' => $template['show_search'],
                'show_login' => $template['show_login'],
                'sticky_header' => $template['sticky_header'],
                'transparent_on_scroll' => $template['transparent_on_scroll'],
                'styling_options' => json_encode($template['styling_options']),
                'login_button_text' => $template['login_button_text'],
                'cart_button_text' => $template['cart_button_text'],
                'search_placeholder' => $template['search_placeholder'],
                'is_active' => true,
                'notes' => 'Auto-generated header configuration',
                'version' => 1,
                'last_modified_by' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'deleted_at' => null,
            ]);

            $this->command->info("✓ Created header config for tenant: {$tenant->name}");
        }

        $this->command->info('Header configurations seeded successfully!');
    }

    /**
     * Generate initials from name
     */
    private function generateInitials(string $name): string
    {
        $words = explode(' ', $name);
        $initials = '';
        
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper(substr($word, 0, 1));
            }
            if (strlen($initials) >= 3) break; // Max 3 letters
        }
        
        return $initials ?: substr(strtoupper($name), 0, 2);
    }
}
