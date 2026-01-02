<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantFooterConfigSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = DB::table('tenants')->get();
        
        if ($tenants->isEmpty()) {
            $this->command->error('No tenants found. Please run TenantSeeder first.');
            return;
        }

        $this->command->info('Seeding footer configurations for ' . $tenants->count() . ' tenants...');

        $footerTemplates = [
            $this->getDefaultFooterTemplate(),
            $this->getMinimalFooterTemplate(),
            $this->getModernFooterTemplate(),
            $this->getIndustrialFooterTemplate(),
            $this->getCustomFooterTemplate(),
            $this->getCompactFooterTemplate(),
        ];

        foreach ($tenants as $index => $tenant) {
            $exists = DB::table('tenant_footer_configs')
                ->where('tenant_id', $tenant->id)
                ->exists();
                
            if ($exists) {
                $this->command->info("Tenant {$tenant->name} already has footer config, skipping...");
                continue;
            }

            $templateIndex = $index % count($footerTemplates);
            $template = $footerTemplates[$templateIndex];
            
            DB::table('tenant_footer_configs')->insert([
                'tenant_id' => $tenant->id,
                'uuid' => DB::raw('gen_random_uuid()'),
                'footer_sections' => json_encode($template['footer_sections']),
                'contact_address' => $template['contact_address'],
                'contact_phone' => $template['contact_phone'],
                'contact_email' => $template['contact_email'],
                'contact_working_hours' => $template['contact_working_hours'],
                'social_links' => json_encode($template['social_links']),
                'show_newsletter' => $template['show_newsletter'],
                'newsletter_title' => $template['newsletter_title'],
                'newsletter_subtitle' => $template['newsletter_subtitle'],
                'newsletter_button_text' => $template['newsletter_button_text'],
                'newsletter_api_endpoint' => $template['newsletter_api_endpoint'],
                'about_text' => $template['about_text'],
                'copyright_text' => $template['copyright_text'] ?? '© ' . date('Y') . ' ' . $tenant->name . '. All rights reserved.',
                'bottom_text' => $template['bottom_text'],
                'show_social_links' => $template['show_social_links'],
                'show_contact_info' => $template['show_contact_info'],
                'show_sections' => $template['show_sections'],
                'footer_style' => $template['footer_style'],
                'background_color' => $template['background_color'],
                'text_color' => $template['text_color'],
                'legal_links' => json_encode($template['legal_links']),
                'is_active' => true,
                'notes' => 'Auto-generated footer configuration',
                'version' => 1,
                'last_modified_by' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
                'deleted_at' => null,
            ]);

            $this->command->info("✓ Created footer config for tenant: {$tenant->name}");
        }

        $this->command->info('Footer configurations seeded successfully!');
    }

    private function getDefaultFooterTemplate(): array
    {
        return [
            'footer_sections' => [
                [
                    'title' => 'Layanan',
                    'links' => [
                        ['label' => 'Chemical Etching', 'path' => '/services/chemical-etching'],
                        ['label' => 'Laser Etching', 'path' => '/services/laser-etching'],
                        ['label' => 'Photo Etching', 'path' => '/services/photo-etching'],
                        ['label' => 'Industrial Marking', 'path' => '/services/industrial-marking'],
                    ],
                    'sort_order' => 1
                ],
                [
                    'title' => 'Perusahaan',
                    'links' => [
                        ['label' => 'Tentang Kami', 'path' => '/about'],
                        ['label' => 'Portfolio', 'path' => '/portfolio'],
                        ['label' => 'Testimoni', 'path' => '/testimonials'],
                        ['label' => 'Karir', 'path' => '/careers'],
                    ],
                    'sort_order' => 2
                ],
                [
                    'title' => 'Bantuan',
                    'links' => [
                        ['label' => 'FAQ', 'path' => '/faq'],
                        ['label' => 'Kontak', 'path' => '/contact'],
                        ['label' => 'Permintaan Penawaran', 'path' => '/quote'],
                        ['label' => 'Support', 'path' => '/support'],
                    ],
                    'sort_order' => 3
                ],
            ],
            'contact_address' => 'Jl. Industri Raya No. 123, Kawasan Industri Jababeka, Cikarang, Bekasi 17530, Indonesia',
            'contact_phone' => '+62 21 8934 5678',
            'contact_email' => 'info@etchingpremium.co.id',
            'contact_working_hours' => 'Senin - Jumat: 08:00 - 17:00 WIB',
            'social_links' => [
                ['platform' => 'Facebook', 'url' => 'https://facebook.com/etchingpremium', 'icon' => 'Facebook'],
                ['platform' => 'Instagram', 'url' => 'https://instagram.com/etchingpremium', 'icon' => 'Instagram'],
                ['platform' => 'LinkedIn', 'url' => 'https://linkedin.com/company/etchingpremium', 'icon' => 'Linkedin'],
                ['platform' => 'YouTube', 'url' => 'https://youtube.com/@etchingpremium', 'icon' => 'Youtube'],
            ],
            'show_newsletter' => true,
            'newsletter_title' => 'Dapatkan Update Terbaru',
            'newsletter_subtitle' => 'Berlangganan newsletter kami untuk informasi produk dan promo terkini',
            'newsletter_button_text' => 'Berlangganan',
            'newsletter_api_endpoint' => '/api/newsletter/subscribe',
            'about_text' => 'Etching Premium adalah pemimpin industri dalam solusi etching profesional dengan pengalaman lebih dari 15 tahun melayani berbagai sektor industri di Indonesia.',
            'copyright_text' => '© 2025 Etching Premium. Seluruh hak cipta dilindungi.',
            'bottom_text' => 'ISO 9001:2015 Certified | Trusted by 500+ Companies',
            'show_social_links' => true,
            'show_contact_info' => true,
            'show_sections' => true,
            'footer_style' => 'default',
            'background_color' => '#1F2937',
            'text_color' => '#F9FAFB',
            'legal_links' => [
                ['label' => 'Kebijakan Privasi', 'path' => '/privacy'],
                ['label' => 'Syarat & Ketentuan', 'path' => '/terms'],
                ['label' => 'Kebijakan Cookie', 'path' => '/cookies'],
            ],
        ];
    }

    private function getMinimalFooterTemplate(): array
    {
        return [
            'footer_sections' => [
                [
                    'title' => 'Services',
                    'links' => [
                        ['label' => 'CNC Engraving', 'path' => '/services/cnc'],
                        ['label' => 'Hand Engraving', 'path' => '/services/hand'],
                        ['label' => 'Custom Solutions', 'path' => '/services/custom'],
                    ],
                    'sort_order' => 1
                ],
                [
                    'title' => 'Company',
                    'links' => [
                        ['label' => 'About', 'path' => '/about'],
                        ['label' => 'Contact', 'path' => '/contact'],
                        ['label' => 'Portfolio', 'path' => '/portfolio'],
                    ],
                    'sort_order' => 2
                ],
            ],
            'contact_address' => '456 Engraving Street, Industrial Park, Jakarta Selatan 12940, Indonesia',
            'contact_phone' => '+62 21 7654 3210',
            'contact_email' => 'hello@engraving.solutions',
            'contact_working_hours' => 'Mon - Sat: 09:00 - 18:00',
            'social_links' => [
                ['platform' => 'Instagram', 'url' => 'https://instagram.com/engraving.solutions', 'icon' => 'Instagram'],
                ['platform' => 'Facebook', 'url' => 'https://facebook.com/engravingsolutions', 'icon' => 'Facebook'],
                ['platform' => 'LinkedIn', 'url' => 'https://linkedin.com/company/engraving-solutions', 'icon' => 'Linkedin'],
            ],
            'show_newsletter' => true,
            'newsletter_title' => 'Stay Updated',
            'newsletter_subtitle' => 'Subscribe to get the latest news and offers',
            'newsletter_button_text' => 'Subscribe',
            'newsletter_api_endpoint' => '/api/v1/newsletter',
            'about_text' => 'Professional engraving and etching services with precision and quality guaranteed.',
            'copyright_text' => '© 2025 Engraving Solutions. All rights reserved.',
            'bottom_text' => 'Crafted with precision since 2010',
            'show_social_links' => true,
            'show_contact_info' => true,
            'show_sections' => true,
            'footer_style' => 'minimal',
            'background_color' => '#111827',
            'text_color' => '#E5E7EB',
            'legal_links' => [
                ['label' => 'Privacy Policy', 'path' => '/privacy'],
                ['label' => 'Terms of Service', 'path' => '/terms'],
            ],
        ];
    }

    private function getModernFooterTemplate(): array
    {
        return [
            'footer_sections' => [
                [
                    'title' => 'Products',
                    'links' => [
                        ['label' => 'Metal Engraving', 'path' => '/products/metal'],
                        ['label' => 'Glass Etching', 'path' => '/products/glass'],
                        ['label' => 'Wood Engraving', 'path' => '/products/wood'],
                        ['label' => 'Acrylic Items', 'path' => '/products/acrylic'],
                        ['label' => 'Custom Orders', 'path' => '/products/custom'],
                    ],
                    'sort_order' => 1
                ],
                [
                    'title' => 'Resources',
                    'links' => [
                        ['label' => 'Blog', 'path' => '/blog'],
                        ['label' => 'Case Studies', 'path' => '/case-studies'],
                        ['label' => 'Downloads', 'path' => '/downloads'],
                        ['label' => 'Support Center', 'path' => '/support'],
                    ],
                    'sort_order' => 2
                ],
                [
                    'title' => 'Quick Links',
                    'links' => [
                        ['label' => 'Get Quote', 'path' => '/quote'],
                        ['label' => 'Track Order', 'path' => '/track'],
                        ['label' => 'My Account', 'path' => '/account'],
                        ['label' => 'Contact Us', 'path' => '/contact'],
                    ],
                    'sort_order' => 3
                ],
            ],
            'contact_address' => 'Gedung Xenial Tower, Lt. 12, Jl. Sudirman Kav. 52-53, Jakarta Pusat 10250',
            'contact_phone' => '+62 21 5089 7654',
            'contact_email' => 'contact@xenialengraving.com',
            'contact_working_hours' => 'Monday - Friday: 08:30 - 17:30 | Saturday: 09:00 - 14:00',
            'social_links' => [
                ['platform' => 'Facebook', 'url' => 'https://facebook.com/xenialengraving', 'icon' => 'Facebook'],
                ['platform' => 'Instagram', 'url' => 'https://instagram.com/xenialengraving', 'icon' => 'Instagram'],
                ['platform' => 'Twitter', 'url' => 'https://x.com/xenialengraving', 'icon' => 'Twitter'],
                ['platform' => 'LinkedIn', 'url' => 'https://linkedin.com/company/xenialengraving', 'icon' => 'Linkedin'],
                ['platform' => 'WhatsApp', 'url' => 'https://wa.me/6281234567890', 'icon' => 'MessageCircle'],
            ],
            'show_newsletter' => true,
            'newsletter_title' => 'Join Our Newsletter',
            'newsletter_subtitle' => 'Get exclusive offers, industry insights, and project inspirations delivered to your inbox',
            'newsletter_button_text' => 'Subscribe Now',
            'newsletter_api_endpoint' => '/api/newsletter/subscribe',
            'about_text' => 'Xenial Precision Engraving combines cutting-edge technology with traditional craftsmanship to deliver exceptional engraving and etching solutions for businesses across Indonesia.',
            'copyright_text' => '© 2025 Xenial Precision Engraving. All Rights Reserved.',
            'bottom_text' => 'Certified Excellence | Member of Indonesian Engraving Association',
            'show_social_links' => true,
            'show_contact_info' => true,
            'show_sections' => true,
            'footer_style' => 'modern',
            'background_color' => '#0F172A',
            'text_color' => '#F1F5F9',
            'legal_links' => [
                ['label' => 'Privacy Policy', 'path' => '/privacy'],
                ['label' => 'Terms & Conditions', 'path' => '/terms'],
                ['label' => 'Cookie Policy', 'path' => '/cookies'],
                ['label' => 'Refund Policy', 'path' => '/refund'],
            ],
        ];
    }

    private function getIndustrialFooterTemplate(): array
    {
        return [
            'footer_sections' => [
                [
                    'title' => 'Solusi Industri',
                    'links' => [
                        ['label' => 'Automotive', 'path' => '/solutions/automotive'],
                        ['label' => 'Aerospace', 'path' => '/solutions/aerospace'],
                        ['label' => 'Electronics', 'path' => '/solutions/electronics'],
                        ['label' => 'Medical Devices', 'path' => '/solutions/medical'],
                        ['label' => 'Oil & Gas', 'path' => '/solutions/oil-gas'],
                    ],
                    'sort_order' => 1
                ],
                [
                    'title' => 'Teknologi',
                    'links' => [
                        ['label' => 'Laser Systems', 'path' => '/technology/laser'],
                        ['label' => 'Chemical Process', 'path' => '/technology/chemical'],
                        ['label' => 'Quality Control', 'path' => '/technology/quality'],
                    ],
                    'sort_order' => 2
                ],
                [
                    'title' => 'Dukungan',
                    'links' => [
                        ['label' => 'Dokumentasi Teknis', 'path' => '/docs'],
                        ['label' => 'Portal Klien', 'path' => '/client-portal'],
                        ['label' => 'Training', 'path' => '/training'],
                        ['label' => 'Hubungi Sales', 'path' => '/contact-sales'],
                    ],
                    'sort_order' => 3
                ],
            ],
            'contact_address' => 'Kawasan Industri MM2100, Blok A-8, Cibitung, Bekasi 17520, Indonesia',
            'contact_phone' => '+62 21 8998 7766 | +62 811 2233 4455',
            'contact_email' => 'sales@industrialetching.co.id',
            'contact_working_hours' => 'Senin - Sabtu: 07:00 - 19:00 WIB | 24/7 Emergency Support',
            'social_links' => [
                ['platform' => 'LinkedIn', 'url' => 'https://linkedin.com/company/industrial-etching-pro', 'icon' => 'Linkedin'],
                ['platform' => 'YouTube', 'url' => 'https://youtube.com/@industrialetchingpro', 'icon' => 'Youtube'],
                ['platform' => 'Twitter', 'url' => 'https://x.com/industrialetching', 'icon' => 'Twitter'],
            ],
            'show_newsletter' => true,
            'newsletter_title' => 'Industry Updates',
            'newsletter_subtitle' => 'Dapatkan update teknologi terbaru, case studies, dan webinar eksklusif',
            'newsletter_button_text' => 'Subscribe',
            'newsletter_api_endpoint' => '/api/v2/subscribe',
            'about_text' => 'Industrial Etching Pro adalah partner terpercaya untuk solusi marking dan etching industri dengan standar internasional ISO 9001:2015 dan IATF 16949.',
            'copyright_text' => '© 2025 Industrial Etching Pro. Semua hak dilindungi undang-undang.',
            'bottom_text' => 'ISO 9001:2015 | IATF 16949 | OHSAS 18001 Certified',
            'show_social_links' => true,
            'show_contact_info' => true,
            'show_sections' => true,
            'footer_style' => 'default',
            'background_color' => '#18181B',
            'text_color' => '#FAFAFA',
            'legal_links' => [
                ['label' => 'Kebijakan Privasi', 'path' => '/privacy'],
                ['label' => 'Syarat Layanan', 'path' => '/terms'],
                ['label' => 'NDA Agreement', 'path' => '/nda'],
            ],
        ];
    }

    private function getCustomFooterTemplate(): array
    {
        return [
            'footer_sections' => [
                [
                    'title' => 'Shop',
                    'links' => [
                        ['label' => 'Awards & Trophies', 'path' => '/shop/awards'],
                        ['label' => 'Name Plates', 'path' => '/shop/nameplates'],
                        ['label' => 'Signage', 'path' => '/shop/signage'],
                        ['label' => 'Gift Items', 'path' => '/shop/gifts'],
                    ],
                    'sort_order' => 1
                ],
                [
                    'title' => 'Information',
                    'links' => [
                        ['label' => 'About Us', 'path' => '/about'],
                        ['label' => 'Our Process', 'path' => '/process'],
                        ['label' => 'Pricing', 'path' => '/pricing'],
                        ['label' => 'Shipping Info', 'path' => '/shipping'],
                    ],
                    'sort_order' => 2
                ],
                [
                    'title' => 'Support',
                    'links' => [
                        ['label' => 'Help Center', 'path' => '/help'],
                        ['label' => 'Order Status', 'path' => '/orders'],
                        ['label' => 'Returns', 'path' => '/returns'],
                        ['label' => 'Contact Us', 'path' => '/contact'],
                    ],
                    'sort_order' => 3
                ],
            ],
            'contact_address' => '789 Creative Avenue, Kemang, Jakarta Selatan 12730, Indonesia',
            'contact_phone' => '+62 21 7198 5432',
            'contact_email' => 'hello@artisanengraving.studio',
            'contact_working_hours' => 'Tue - Sun: 10:00 - 20:00 (Closed on Mondays)',
            'social_links' => [
                ['platform' => 'Instagram', 'url' => 'https://instagram.com/artisanengraving', 'icon' => 'Instagram'],
                ['platform' => 'Pinterest', 'url' => 'https://pinterest.com/artisanengraving', 'icon' => 'Compass'],
                ['platform' => 'Facebook', 'url' => 'https://facebook.com/artisanengraving', 'icon' => 'Facebook'],
                ['platform' => 'TikTok', 'url' => 'https://tiktok.com/@artisanengraving', 'icon' => 'Music'],
            ],
            'show_newsletter' => true,
            'newsletter_title' => 'Creative Inspiration',
            'newsletter_subtitle' => 'Get design ideas, special offers, and behind-the-scenes content',
            'newsletter_button_text' => 'Join Now',
            'newsletter_api_endpoint' => '/api/newsletter',
            'about_text' => 'Artisan Engraving Studio specializes in creating personalized, handcrafted engraved items that tell your unique story.',
            'copyright_text' => '© 2025 Artisan Engraving Studio. Handcrafted with ❤️',
            'bottom_text' => 'Proudly serving Jakarta since 2015',
            'show_social_links' => true,
            'show_contact_info' => true,
            'show_sections' => true,
            'footer_style' => 'modern',
            'background_color' => '#292524',
            'text_color' => '#FEF3C7',
            'legal_links' => [
                ['label' => 'Privacy', 'path' => '/privacy'],
                ['label' => 'Terms', 'path' => '/terms'],
            ],
        ];
    }

    private function getCompactFooterTemplate(): array
    {
        return [
            'footer_sections' => [
                [
                    'title' => 'Services',
                    'links' => [
                        ['label' => 'Laser Marking', 'path' => '/services/laser'],
                        ['label' => 'Deep Engraving', 'path' => '/services/deep'],
                        ['label' => 'Surface Etching', 'path' => '/services/surface'],
                    ],
                    'sort_order' => 1
                ],
                [
                    'title' => 'Company',
                    'links' => [
                        ['label' => 'About', 'path' => '/about'],
                        ['label' => 'Portfolio', 'path' => '/portfolio'],
                        ['label' => 'Contact', 'path' => '/contact'],
                    ],
                    'sort_order' => 2
                ],
            ],
            'contact_address' => 'Ruko Grand Galaxy City, Blok RGC No. 45, Bekasi 17147',
            'contact_phone' => '+62 21 8276 5432',
            'contact_email' => 'info@marking.services',
            'contact_working_hours' => 'Mon - Fri: 08:00 - 17:00',
            'social_links' => [
                ['platform' => 'Facebook', 'url' => 'https://facebook.com/markingservices', 'icon' => 'Facebook'],
                ['platform' => 'Instagram', 'url' => 'https://instagram.com/markingservices', 'icon' => 'Instagram'],
            ],
            'show_newsletter' => false,
            'newsletter_title' => '',
            'newsletter_subtitle' => '',
            'newsletter_button_text' => '',
            'newsletter_api_endpoint' => null,
            'about_text' => 'Professional marking and engraving services for businesses and individuals.',
            'copyright_text' => '© 2025 Professional Marking Services',
            'bottom_text' => null,
            'show_social_links' => true,
            'show_contact_info' => true,
            'show_sections' => true,
            'footer_style' => 'minimal',
            'background_color' => '#374151',
            'text_color' => '#F3F4F6',
            'legal_links' => [
                ['label' => 'Privacy', 'path' => '/privacy'],
                ['label' => 'Terms', 'path' => '/terms'],
            ],
        ];
    }
}
