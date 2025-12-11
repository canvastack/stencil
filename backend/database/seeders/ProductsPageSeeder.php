<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProductsPageSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Get all tenants for multi-tenant distribution
        $tenants = DB::table('tenants')->get();
        
        if ($tenants->isEmpty()) {
            $this->command->error('No tenants found. Please run TenantSeeder first.');
            return;
        }

        // Create products page content for each tenant
        foreach ($tenants as $tenant) {
            $this->createProductsPage($tenant->id, $tenant->slug, $tenant->name);
        }

        $this->command->info('Products page content seeded successfully!');
    }

    private function createProductsPage($tenantId, $tenantSlug, $tenantName): void
    {
        $content = [
            "hero" => [
                "title" => [
                    "prefix" => "Semua",
                    "highlight" => "Produk",
                    "suffix" => ""
                ],
                "subtitle" => "Temukan produk etching berkualitas tinggi dengan presisi sempurna untuk kebutuhan bisnis dan personal Anda. Dari etching logam hingga plakat penghargaan, kami siap memenuhi setiap kebutuhan Anda."
            ],
            "informationSection" => [
                "title" => [
                    "prefix" => "Layanan",
                    "highlight" => "Etching",
                    "suffix" => "Terbaik"
                ],
                "subtitle" => "Tiga kategori utama produk etching dengan kualitas terbaik dan presisi tinggi untuk berbagai kebutuhan industri dan personal",
                "cards" => [
                    [
                        "title" => "Etching Logam Premium",
                        "description" => "Layanan etching presisi tinggi untuk stainless steel, kuningan, tembaga, dan aluminium. Cocok untuk komponen industri, nameplate, dan aplikasi dekorasi dengan detail sempurna.",
                        "features" => [
                            "Presisi hingga 0.1mm",
                            "Material grade premium",
                            "Tahan korosi & cuaca",
                            "Finishing berkualitas tinggi"
                        ],
                        "icon" => "⚙️",
                        "buttonText" => "Pelajari Detail"
                    ],
                    [
                        "title" => "Etching Kaca & Kristal",
                        "description" => "Kaca berkualitas tinggi dengan hasil etching yang halus dan elegan. Perfect untuk interior design, corporate gifts, dan hadiah spesial dengan sentuhan artistik.",
                        "features" => [
                            "Desain artistik custom",
                            "Food-grade safe",
                            "Transparan premium",
                            "Packaging eksklusif"
                        ],
                        "icon" => "🏆",
                        "buttonText" => "Lihat Galeri"
                    ],
                    [
                        "title" => "Plakat & Trophy Eksklusif",
                        "description" => "Plakat penghargaan dan trophy custom untuk perusahaan, event, dan apresiasi. Desain profesional dengan material premium dan personalisasi lengkap.",
                        "features" => [
                            "Desain eksklusif",
                            "Material premium grade",
                            "Personalisasi lengkap",
                            "Garansi kualitas"
                        ],
                        "icon" => "🎖️",
                        "buttonText" => "Order Custom"
                    ]
                ]
            ],
            "ctaSections" => [
                [
                    "id" => "products-cta-1",
                    "enabled" => true,
                    "title" => "Siap Mewujudkan Proyek Etching Anda?",
                    "subtitle" => "Hubungi kami sekarang dan dapatkan konsultasi gratis untuk proyek etching Anda. Tim ahli kami siap membantu mewujudkan ide kreatif Anda.",
                    "stats" => [
                        [
                            "value" => "2000+",
                            "label" => "Produk Selesai"
                        ],
                        [
                            "value" => "15+",
                            "label" => "Tahun Pengalaman"
                        ],
                        [
                            "value" => "98%",
                            "label" => "Tingkat Kepuasan"
                        ],
                        [
                            "value" => "500+",
                            "label" => "Klien Setia"
                        ]
                    ],
                    "buttons" => [
                        [
                            "text" => "Konsultasi Gratis",
                            "variant" => "primary",
                            "icon" => "Phone",
                            "link" => "/contact"
                        ],
                        [
                            "text" => "Lihat Portfolio",
                            "variant" => "outline",
                            "icon" => "Target",
                            "link" => "/portfolio"
                        ]
                    ]
                ],
                [
                    "id" => "products-cta-2", 
                    "enabled" => true,
                    "title" => "Butuh Bantuan Memilih Produk yang Tepat?",
                    "subtitle" => "Tim ahli kami siap membantu Anda menemukan solusi etching terbaik untuk kebutuhan spesifik Anda. Konsultasi gratis tersedia!",
                    "buttons" => [
                        [
                            "text" => "Chat dengan Expert",
                            "variant" => "primary",
                            "icon" => "MessageSquare",
                            "link" => "https://wa.me/6281234567890"
                        ]
                    ]
                ]
            ],
            "seo" => [
                "title" => "Produk Etching Premium - {$tenantName}",
                "description" => "Koleksi lengkap produk etching berkualitas tinggi: etching logam, kaca, kristal, dan plakat penghargaan. Presisi tinggi, harga kompetitif.",
                "keywords" => ["produk etching", "etching logam", "plakat etching", "trophy custom", "nameplate etching"],
                "ogImage" => "/images/og-image-products.jpg"
            ]
        ];

        // Remove existing products page if exists
        DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', 'products')
            ->delete();

        // Insert new products page
        DB::table('tenant_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $tenantId,
            'title' => 'Products Page',
            'slug' => 'products',
            'description' => 'Products page content for ' . $tenantName,
            'content' => json_encode($content),
            'template' => 'default',
            'meta_data' => json_encode(['featured' => true, 'priority' => 3]),
            'status' => 'published',
            'page_type' => 'services',
            'is_homepage' => false,
            'sort_order' => 3,
            'language' => 'id',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
        
        $this->command->info("✅ Products page created for tenant: {$tenantName}");
    }
}