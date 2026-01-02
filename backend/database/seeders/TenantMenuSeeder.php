<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantMenuSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = DB::table('tenants')->get();
        
        if ($tenants->isEmpty()) {
            $this->command->error('No tenants found. Please run TenantSeeder first.');
            return;
        }

        $this->command->info('Seeding menu items for ' . $tenants->count() . ' tenants...');

        $menuTemplates = [
            $this->getEtchingMenuTemplate(),
            $this->getEngravingMenuTemplate(),
            $this->getIndustrialMenuTemplate(),
            $this->getCustomMenuTemplate(),
        ];

        foreach ($tenants as $index => $tenant) {
            $exists = DB::table('tenant_menus')
                ->where('tenant_id', $tenant->id)
                ->exists();
                
            if ($exists) {
                $this->command->info("Tenant {$tenant->name} already has menus, skipping...");
                continue;
            }

            $templateIndex = $index % count($menuTemplates);
            $template = $menuTemplates[$templateIndex];
            
            $this->seedMenusForTenant($tenant, $template);
            
            $this->command->info("✓ Created menu items for tenant: {$tenant->name}");
        }

        $this->command->info('Menu items seeded successfully!');
    }

    private function seedMenusForTenant($tenant, $menuStructure): void
    {
        $parentIdMap = [];
        
        foreach ($menuStructure as $menuItem) {
            $parentId = null;
            
            if (isset($menuItem['parent_key']) && isset($parentIdMap[$menuItem['parent_key']])) {
                $parentId = $parentIdMap[$menuItem['parent_key']];
            }

            $id = DB::table('tenant_menus')->insertGetId([
                'tenant_id' => $tenant->id,
                'uuid' => DB::raw('gen_random_uuid()'),
                'parent_id' => $parentId,
                'label' => $menuItem['label'],
                'path' => $menuItem['path'] ?? null,
                'icon' => $menuItem['icon'] ?? null,
                'description' => $menuItem['description'] ?? null,
                'target' => $menuItem['target'] ?? '_self',
                'is_external' => $menuItem['is_external'] ?? false,
                'requires_auth' => $menuItem['requires_auth'] ?? false,
                'is_active' => $menuItem['is_active'] ?? true,
                'is_visible' => $menuItem['is_visible'] ?? true,
                'show_in_header' => $menuItem['show_in_header'] ?? true,
                'show_in_footer' => $menuItem['show_in_footer'] ?? false,
                'show_in_mobile' => $menuItem['show_in_mobile'] ?? true,
                'sort_order' => $menuItem['sort_order'],
                'custom_class' => $menuItem['custom_class'] ?? null,
                'badge_text' => $menuItem['badge_text'] ?? null,
                'badge_color' => $menuItem['badge_color'] ?? null,
                'allowed_roles' => isset($menuItem['allowed_roles']) ? json_encode($menuItem['allowed_roles']) : null,
                'notes' => $menuItem['notes'] ?? null,
                'click_count' => rand(0, 500),
                'created_at' => Carbon::now()->subDays(rand(0, 90)),
                'updated_at' => Carbon::now()->subDays(rand(0, 30)),
                'deleted_at' => null,
            ]);

            if (isset($menuItem['key'])) {
                $parentIdMap[$menuItem['key']] = $id;
            }
        }
    }

    private function getEtchingMenuTemplate(): array
    {
        return [
            ['key' => 'home', 'label' => 'Beranda', 'path' => '/', 'icon' => 'Home', 'sort_order' => 10, 'show_in_footer' => true],
            
            ['key' => 'services', 'label' => 'Layanan', 'path' => null, 'icon' => 'Briefcase', 'sort_order' => 20, 'description' => 'Layanan etching kami'],
            ['parent_key' => 'services', 'label' => 'Chemical Etching', 'path' => '/services/chemical-etching', 'icon' => 'Droplet', 'sort_order' => 21],
            ['parent_key' => 'services', 'label' => 'Laser Etching', 'path' => '/services/laser-etching', 'icon' => 'Zap', 'sort_order' => 22, 'badge_text' => 'Populer', 'badge_color' => 'blue'],
            ['parent_key' => 'services', 'label' => 'Photo Etching', 'path' => '/services/photo-etching', 'icon' => 'Camera', 'sort_order' => 23],
            ['parent_key' => 'services', 'label' => 'Industrial Marking', 'path' => '/services/industrial-marking', 'icon' => 'Tag', 'sort_order' => 24],
            
            ['key' => 'products', 'label' => 'Produk', 'path' => '/products', 'icon' => 'Package', 'sort_order' => 30, 'badge_text' => 'Baru', 'badge_color' => 'green'],
            
            ['key' => 'portfolio', 'label' => 'Portfolio', 'path' => null, 'icon' => 'Image', 'sort_order' => 40],
            ['parent_key' => 'portfolio', 'label' => 'Galeri Proyek', 'path' => '/portfolio/gallery', 'icon' => 'Images', 'sort_order' => 41],
            ['parent_key' => 'portfolio', 'label' => 'Studi Kasus', 'path' => '/portfolio/case-studies', 'icon' => 'FileText', 'sort_order' => 42],
            ['parent_key' => 'portfolio', 'label' => 'Testimoni', 'path' => '/portfolio/testimonials', 'icon' => 'MessageSquare', 'sort_order' => 43],
            
            ['key' => 'about', 'label' => 'Tentang Kami', 'path' => null, 'icon' => 'Info', 'sort_order' => 50],
            ['parent_key' => 'about', 'label' => 'Profil Perusahaan', 'path' => '/about/company', 'icon' => 'Building', 'sort_order' => 51, 'show_in_footer' => true],
            ['parent_key' => 'about', 'label' => 'Tim Kami', 'path' => '/about/team', 'icon' => 'Users', 'sort_order' => 52],
            ['parent_key' => 'about', 'label' => 'Sertifikasi', 'path' => '/about/certifications', 'icon' => 'Award', 'sort_order' => 53],
            ['parent_key' => 'about', 'label' => 'Karir', 'path' => '/about/careers', 'icon' => 'Briefcase', 'sort_order' => 54],
            
            ['label' => 'Kontak', 'path' => '/contact', 'icon' => 'Mail', 'sort_order' => 60, 'show_in_footer' => true],
            
            ['label' => 'Blog', 'path' => '/blog', 'icon' => 'BookOpen', 'sort_order' => 70, 'show_in_footer' => true],
            
            ['label' => 'Akun Saya', 'path' => '/account', 'icon' => 'User', 'sort_order' => 80, 'requires_auth' => true, 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'FAQ', 'path' => '/faq', 'icon' => 'HelpCircle', 'sort_order' => 90, 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'Mitra Kerja', 'path' => '/partners', 'icon' => 'Handshake', 'sort_order' => 100, 'show_in_header' => false, 'show_in_footer' => true],
        ];
    }

    private function getEngravingMenuTemplate(): array
    {
        return [
            ['key' => 'home', 'label' => 'Home', 'path' => '/', 'icon' => 'Home', 'sort_order' => 10, 'show_in_footer' => true],
            
            ['key' => 'services', 'label' => 'Services', 'path' => null, 'icon' => 'Settings', 'sort_order' => 20],
            ['parent_key' => 'services', 'label' => 'CNC Engraving', 'path' => '/services/cnc-engraving', 'icon' => 'Cpu', 'sort_order' => 21, 'badge_text' => 'Premium', 'badge_color' => 'purple'],
            ['parent_key' => 'services', 'label' => 'Hand Engraving', 'path' => '/services/hand-engraving', 'icon' => 'Pencil', 'sort_order' => 22],
            ['parent_key' => 'services', 'label' => 'Rotary Engraving', 'path' => '/services/rotary-engraving', 'icon' => 'Repeat', 'sort_order' => 23],
            ['parent_key' => 'services', 'label' => 'Diamond Drag', 'path' => '/services/diamond-drag', 'icon' => 'Diamond', 'sort_order' => 24],
            ['parent_key' => 'services', 'label' => 'Custom Solutions', 'path' => '/services/custom', 'icon' => 'Sparkles', 'sort_order' => 25, 'badge_text' => 'New', 'badge_color' => 'green'],
            
            ['key' => 'materials', 'label' => 'Materials', 'path' => null, 'icon' => 'Layers', 'sort_order' => 30],
            ['parent_key' => 'materials', 'label' => 'Metal Engraving', 'path' => '/materials/metal', 'icon' => 'Shield', 'sort_order' => 31],
            ['parent_key' => 'materials', 'label' => 'Glass Etching', 'path' => '/materials/glass', 'icon' => 'Wine', 'sort_order' => 32],
            ['parent_key' => 'materials', 'label' => 'Wood Engraving', 'path' => '/materials/wood', 'icon' => 'TreePine', 'sort_order' => 33],
            ['parent_key' => 'materials', 'label' => 'Acrylic & Plastic', 'path' => '/materials/acrylic', 'icon' => 'Box', 'sort_order' => 34],
            
            ['label' => 'Portfolio', 'path' => '/portfolio', 'icon' => 'Folder', 'sort_order' => 40, 'show_in_footer' => true],
            
            ['key' => 'shop', 'label' => 'Shop', 'path' => null, 'icon' => 'ShoppingBag', 'sort_order' => 50, 'badge_text' => 'Sale', 'badge_color' => 'red'],
            ['parent_key' => 'shop', 'label' => 'All Products', 'path' => '/shop/all', 'icon' => 'Package', 'sort_order' => 51],
            ['parent_key' => 'shop', 'label' => 'Custom Orders', 'path' => '/shop/custom', 'icon' => 'Wrench', 'sort_order' => 52],
            ['parent_key' => 'shop', 'label' => 'Gift Items', 'path' => '/shop/gifts', 'icon' => 'Gift', 'sort_order' => 53],
            
            ['label' => 'About Us', 'path' => '/about', 'icon' => 'Info', 'sort_order' => 60, 'show_in_footer' => true],
            
            ['label' => 'Contact', 'path' => '/contact', 'icon' => 'Phone', 'sort_order' => 70, 'show_in_footer' => true],
            
            ['label' => 'My Account', 'path' => '/account/dashboard', 'icon' => 'UserCircle', 'sort_order' => 80, 'requires_auth' => true, 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'Support Center', 'path' => '/support', 'icon' => 'LifeBuoy', 'sort_order' => 90, 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'Industry Blog', 'path' => 'https://blog.engraving.example', 'icon' => 'ExternalLink', 'sort_order' => 100, 'is_external' => true, 'target' => '_blank', 'show_in_header' => false, 'show_in_footer' => true],
        ];
    }

    private function getIndustrialMenuTemplate(): array
    {
        return [
            ['key' => 'home', 'label' => 'Beranda', 'path' => '/', 'icon' => 'Home', 'sort_order' => 10],
            
            ['key' => 'solutions', 'label' => 'Solusi Industri', 'path' => null, 'icon' => 'Factory', 'sort_order' => 20, 'badge_text' => 'Unggulan', 'badge_color' => 'orange'],
            ['parent_key' => 'solutions', 'label' => 'Automotive', 'path' => '/solutions/automotive', 'icon' => 'Car', 'sort_order' => 21],
            ['parent_key' => 'solutions', 'label' => 'Aerospace', 'path' => '/solutions/aerospace', 'icon' => 'Plane', 'sort_order' => 22],
            ['parent_key' => 'solutions', 'label' => 'Electronics', 'path' => '/solutions/electronics', 'icon' => 'Cpu', 'sort_order' => 23],
            ['parent_key' => 'solutions', 'label' => 'Medical Devices', 'path' => '/solutions/medical', 'icon' => 'Heart', 'sort_order' => 24],
            ['parent_key' => 'solutions', 'label' => 'Oil & Gas', 'path' => '/solutions/oil-gas', 'icon' => 'Fuel', 'sort_order' => 25],
            
            ['key' => 'tech', 'label' => 'Teknologi', 'path' => null, 'icon' => 'Zap', 'sort_order' => 30],
            ['parent_key' => 'tech', 'label' => 'Laser Systems', 'path' => '/technology/laser', 'icon' => 'ZapOff', 'sort_order' => 31, 'badge_text' => 'Terbaru', 'badge_color' => 'blue'],
            ['parent_key' => 'tech', 'label' => 'Chemical Process', 'path' => '/technology/chemical', 'icon' => 'TestTube', 'sort_order' => 32],
            ['parent_key' => 'tech', 'label' => 'Quality Control', 'path' => '/technology/quality', 'icon' => 'CheckCircle', 'sort_order' => 33],
            
            ['key' => 'resources', 'label' => 'Sumber Daya', 'path' => null, 'icon' => 'BookOpen', 'sort_order' => 40],
            ['parent_key' => 'resources', 'label' => 'Dokumentasi Teknis', 'path' => '/resources/documentation', 'icon' => 'FileText', 'sort_order' => 41, 'show_in_footer' => true],
            ['parent_key' => 'resources', 'label' => 'White Papers', 'path' => '/resources/whitepapers', 'icon' => 'FileDown', 'sort_order' => 42],
            ['parent_key' => 'resources', 'label' => 'Video Tutorial', 'path' => '/resources/videos', 'icon' => 'Video', 'sort_order' => 43],
            ['parent_key' => 'resources', 'label' => 'Webinar', 'path' => '/resources/webinars', 'icon' => 'Monitor', 'sort_order' => 44],
            
            ['label' => 'Proyek', 'path' => '/projects', 'icon' => 'FolderOpen', 'sort_order' => 50, 'show_in_footer' => true],
            
            ['label' => 'Permintaan Penawaran', 'path' => '/quote', 'icon' => 'FileSignature', 'sort_order' => 60, 'custom_class' => 'btn-primary'],
            
            ['label' => 'Perusahaan', 'path' => '/company', 'icon' => 'Building2', 'sort_order' => 70, 'show_in_footer' => true],
            
            ['label' => 'Hubungi Kami', 'path' => '/contact', 'icon' => 'Mail', 'sort_order' => 80, 'show_in_footer' => true],
            
            ['label' => 'Portal Klien', 'path' => '/client-portal', 'icon' => 'Lock', 'sort_order' => 90, 'requires_auth' => true, 'allowed_roles' => ['customer', 'admin'], 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'Distributor', 'path' => '/distributors', 'icon' => 'MapPin', 'sort_order' => 100, 'show_in_header' => false, 'show_in_footer' => true],
        ];
    }

    private function getCustomMenuTemplate(): array
    {
        return [
            ['key' => 'home', 'label' => 'Home', 'path' => '/', 'icon' => 'Home', 'sort_order' => 10, 'show_in_footer' => true],
            
            ['key' => 'services', 'label' => 'Our Services', 'path' => null, 'icon' => 'Grid', 'sort_order' => 20],
            ['parent_key' => 'services', 'label' => 'Custom Engraving', 'path' => '/services/custom-engraving', 'icon' => 'Edit', 'sort_order' => 21, 'badge_text' => 'Popular', 'badge_color' => 'green'],
            ['parent_key' => 'services', 'label' => 'Precision Etching', 'path' => '/services/precision-etching', 'icon' => 'Target', 'sort_order' => 22],
            ['parent_key' => 'services', 'label' => 'Design Services', 'path' => '/services/design', 'icon' => 'Palette', 'sort_order' => 23],
            ['parent_key' => 'services', 'label' => 'Prototyping', 'path' => '/services/prototyping', 'icon' => 'Boxes', 'sort_order' => 24, 'badge_text' => 'Fast', 'badge_color' => 'yellow'],
            
            ['key' => 'products', 'label' => 'Products', 'path' => null, 'icon' => 'ShoppingCart', 'sort_order' => 30],
            ['parent_key' => 'products', 'label' => 'Awards & Trophies', 'path' => '/products/awards', 'icon' => 'Trophy', 'sort_order' => 31],
            ['parent_key' => 'products', 'label' => 'Name Plates', 'path' => '/products/nameplates', 'icon' => 'CreditCard', 'sort_order' => 32],
            ['parent_key' => 'products', 'label' => 'Signage', 'path' => '/products/signage', 'icon' => 'AlertCircle', 'sort_order' => 33],
            ['parent_key' => 'products', 'label' => 'Industrial Labels', 'path' => '/products/labels', 'icon' => 'Tag', 'sort_order' => 34],
            ['parent_key' => 'products', 'label' => 'Custom Items', 'path' => '/products/custom', 'icon' => 'Sparkles', 'sort_order' => 35],
            
            ['key' => 'gallery', 'label' => 'Gallery', 'path' => null, 'icon' => 'Image', 'sort_order' => 40],
            ['parent_key' => 'gallery', 'label' => 'Recent Work', 'path' => '/gallery/recent', 'icon' => 'Clock', 'sort_order' => 41],
            ['parent_key' => 'gallery', 'label' => 'By Industry', 'path' => '/gallery/industry', 'icon' => 'Building', 'sort_order' => 42],
            ['parent_key' => 'gallery', 'label' => 'Client Reviews', 'path' => '/gallery/reviews', 'icon' => 'Star', 'sort_order' => 43],
            
            ['label' => 'Pricing', 'path' => '/pricing', 'icon' => 'DollarSign', 'sort_order' => 50, 'show_in_footer' => true],
            
            ['label' => 'About', 'path' => '/about', 'icon' => 'Users', 'sort_order' => 60, 'show_in_footer' => true],
            
            ['label' => 'Get Quote', 'path' => '/quote', 'icon' => 'Send', 'sort_order' => 70, 'custom_class' => 'btn-cta', 'badge_text' => 'Free', 'badge_color' => 'green'],
            
            ['label' => 'Contact Us', 'path' => '/contact', 'icon' => 'MessageCircle', 'sort_order' => 80, 'show_in_footer' => true],
            
            ['label' => 'My Orders', 'path' => '/orders', 'icon' => 'Package', 'sort_order' => 90, 'requires_auth' => true, 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'Help Center', 'path' => '/help', 'icon' => 'LifeBuoy', 'sort_order' => 100, 'show_in_header' => false, 'show_in_footer' => true],
            
            ['label' => 'Terms & Conditions', 'path' => '/terms', 'icon' => 'FileText', 'sort_order' => 110, 'show_in_header' => false, 'show_in_footer' => true],
        ];
    }
}
