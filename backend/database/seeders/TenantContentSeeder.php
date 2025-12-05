<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantContentSeeder extends Seeder
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

        // Create content for each tenant
        foreach ($tenants as $tenant) {
            $this->createTenantContent($tenant);
        }

        $this->command->info('Tenant content pages seeded successfully!');
    }

    private function createTenantContent($tenant): void
    {
        $tenantId = $tenant->id;
        $tenantSlug = $tenant->slug;
        $tenantName = $tenant->name;
        
        $this->command->info("Creating content for tenant: {$tenantName} ({$tenantSlug})");

        // Only create new content - skip if tenant already has content
        $existingCount = DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->count();
            
        if ($existingCount >= 4) {
            $this->command->info("Tenant {$tenantName} already has {$existingCount} pages, skipping...");
            return;
        }

        // 1. Homepage Content
        $this->createHomepage($tenantId, $tenantSlug, $tenantName);
        
        // 2. About Page Content  
        $this->createAboutPage($tenantId, $tenantSlug, $tenantName);
        
        // 3. Contact Page Content
        $this->createContactPage($tenantId, $tenantSlug, $tenantName);
        
        // 4. FAQ Page Content
        $this->createFAQPage($tenantId, $tenantSlug, $tenantName);
        
        // 5. Additional Service Pages (10-15 more pages per tenant)
        $this->createServicePages($tenantId, $tenantSlug, $tenantName);
        
        // 6. Blog/News Pages (15-20 pages per tenant)
        $this->createBlogPages($tenantId, $tenantSlug, $tenantName);
    }

    private function createHomepage($tenantId, $tenantSlug, $tenantName): void
    {
        $content = [
            "hero" => [
                "title" => [
                    "static" => "Presisi Artistik, Kualitas Teruji",
                    "typing" => [
                        "Presisi Artistik, Kualitas Teruji",
                        "Partner Terpercaya, Solusi Bisnis Anda", 
                        "Hasil Memuaskan, Sesuai Ekspektasi Anda"
                    ]
                ],
                "subtitle" => "Layanan profesional, cepat, dan berkualitas tinggi untuk kebutuhan bisnis dan personal Anda.",
                "carousel" => [
                    "images" => [
                        "/images/hero/etching-1.jpg",
                        "/images/hero/etching-2.jpg", 
                        "/images/hero/etching-3.jpg"
                    ],
                    "autoPlayInterval" => 5000,
                    "showPauseButton" => true
                ],
                "buttons" => [
                    "primary" => [
                        "text" => "Lihat Layanan Kami",
                        "link" => "/products",
                        "icon" => "ArrowRight"
                    ],
                    "secondary" => [
                        "text" => "Hubungi Konsultan", 
                        "link" => "/contact",
                        "icon" => "Phone"
                    ]
                ]
            ],
            "socialProof" => [
                "enabled" => true,
                "title" => "Partner yang diandalkan oleh para mitra bisnis",
                "subtitle" => "Lebih dari 2000+ proyek telah diselesaikan dengan menjaga kepuasan mitra bisnis kami",
                "stats" => [
                    [
                        "icon" => "Users",
                        "value" => "2000+", 
                        "label" => "Proyek Selesai",
                        "color" => "text-blue-500"
                    ],
                    [
                        "icon" => "Target",
                        "value" => "500+",
                        "label" => "Klien Puas", 
                        "color" => "text-green-500"
                    ],
                    [
                        "icon" => "Award", 
                        "value" => "10+",
                        "label" => "Tahun Pengalaman",
                        "color" => "text-purple-500"
                    ],
                    [
                        "icon" => "CheckCircle2",
                        "value" => "15+", 
                        "label" => "Jangkauan Layanan di berbagai daerah",
                        "color" => "text-primary"
                    ]
                ]
            ],
            "process" => [
                "enabled" => true,
                "title" => "Proses kerja yang teliti dan efisien",
                "subtitle" => "Dari konsultasi, pengerjaan produk hingga pengiriman, mengutamakan kualitas dan kepuasan mitra bisnis",
                "steps" => [
                    [
                        "icon" => "MessageSquare",
                        "title" => "Konsultasi Desain",
                        "description" => "Diskusikan ide Anda dengan tim ahli kami"
                    ],
                    [
                        "icon" => "Zap",
                        "title" => "Produksi Presisi",
                        "description" => "Proses etching dilakukan secara teliti untuk kualitas terbaik"
                    ],
                    [
                        "icon" => "ClipboardCheck",
                        "title" => "Quality Control",
                        "description" => "Pemeriksaan kualitas produk sesuai dengan barang pesanan"
                    ],
                    [
                        "icon" => "Package",
                        "title" => "Pengiriman Aman",
                        "description" => "Pengemasan aman dan pengiriman tepat waktu"
                    ]
                ],
                "preview" => [
                    "enabled" => true,
                    "title" => "Preview: Dashboard Pelacakan Pesanan",
                    "features" => [
                        "Lacak status pesanan real-time",
                        "Lihat riwayat transaksi",
                        "Kelola desain dan spesifikasi"
                    ],
                    "button" => [
                        "text" => "Daftar untuk Update Peluncuran",
                        "link" => "/register"
                    ]
                ]
            ],
            "whyChooseUs" => [
                "enabled" => true,
                "title" => "Mengapa Memilih Layanan Etching Kami?",
                "subtitle" => "Komitmen kami untuk memberikan layanan terbaik dengan mengutamakan kepuasan mitra bisnis",
                "items" => [
                    [
                        "icon" => "Zap",
                        "title" => "Presisi",
                        "description" => "Presisi menjadi fondasi utama dalam setiap proses etching yang kami lakukan.",
                        "color" => "orange"
                    ],
                    [
                        "icon" => "Layers",
                        "title" => "Material Berkualitas",
                        "description" => "Pilihan material premium mulai dari stainless steel, kuningan, hingga akrilik berkualitas tinggi.",
                        "color" => "blue"
                    ],
                    [
                        "icon" => "Palette",
                        "title" => "Kustomisasi Produk",
                        "description" => "Tim desainer kami siap membantu mewujudkan ide kustom Anda, dari konsep hingga produk jadi.",
                        "color" => "purple"
                    ]
                ]
            ],
            "achievements" => [
                "enabled" => true,
                "title" => "Standar Kualitas dan Sertifikasi",
                "items" => [
                    [
                        "icon" => "Shield",
                        "title" => "Sertifikasi ISO 9001:2015",
                        "description" => "Komitmen kami pada manajemen kualitas standar internasional untuk setiap proyek yang kami tangani.",
                        "color" => "blue"
                    ],
                    [
                        "icon" => "Award",
                        "title" => "Pemenang Desain Award 2024",
                        "description" => "Pengakuan atas inovasi dan kualitas desain produk etching kami di tingkat nasional.",
                        "color" => "purple"
                    ]
                ]
            ],
            "services" => [
                "enabled" => true,
                "title" => "Layanan Unggulan Kami",
                "subtitle" => "Memberikan berbagai layanan etching berkualitas tinggi untuk kebutuhan personal dan industri",
                "items" => [
                    [
                        "icon" => "Package",
                        "title" => "Etching Product", 
                        "description" => "Layanan etching presisi tinggi untuk komponen industri dan manufaktur"
                    ],
                    [
                        "icon" => "Award",
                        "title" => "Plakat & Trophy",
                        "description" => "Desain dan produksi plakat penghargaan dengan detail menakjubkan"
                    ],
                    [
                        "icon" => "MessageSquare",
                        "title" => "Konsultasi Desain", 
                        "description" => "Bantuan profesional untuk mewujudkan desain impian Anda"
                    ],
                    [
                        "icon" => "Shield",
                        "title" => "Kualitas Produk",
                        "description" => "Memastikan aspek pengerjaannya memenuhi standar kepuasan mitra bisnis"
                    ],
                    [
                        "icon" => "Palette",
                        "title" => "Terpercaya & Diandalkan",
                        "description" => "Komitmen kami untuk memberikan kualitas produk yang sesuai untuk menjaga relasi bisnis yang berkelanjutan"
                    ],
                    [
                        "icon" => "Layers",
                        "title" => "Jangkauan Layanan",
                        "description" => "Menyediakan layanan pengiriman ke berbagai daerah"
                    ]
                ]
            ],
            "cta" => [
                [
                    "type" => "primary",
                    "title" => "Siap Mewujudkan Proyek Anda?",
                    "subtitle" => "Diskusikan kebutuhan Anda dengan tim kami dan dapatkan penawaran gratis hari ini",
                    "stats" => [
                        [
                            "value" => "1000+",
                            "label" => "Products"
                        ],
                        [
                            "value" => "15+",
                            "label" => "Tahun Pengalaman"
                        ],
                        [
                            "value" => "98%",
                            "label" => "Tingkat Kepuasan"
                        ]
                    ],
                    "buttons" => [
                        [
                            "text" => "Hubungi Kami",
                            "icon" => "MessageSquare",
                            "link" => "/contact",
                            "variant" => "default",
                            "className" => "bg-[#475569] hover:bg-[#334155]"
                        ],
                        [
                            "text" => "Lihat Produk Kami",
                            "icon" => "Target",
                            "link" => "/products",
                            "variant" => "outline",
                            "className" => "border-2 border-[#fbbf24] bg-transparent text-white hover:bg-white/10"
                        ]
                    ],
                    "background" => "bg-gradient-to-r from-[#f59e0b] to-[#f97316]"
                ],
                [
                    "type" => "secondary",
                    "title" => "Punya Pertanyaan atau Siap Memulai?",
                    "subtitle" => "Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda",
                    "buttons" => [
                        [
                            "text" => "Hubungi Tim Kami",
                            "link" => "/contact",
                            "variant" => "default",
                            "className" => "bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:bg-gradient-to-r hover:from-[#f59e0b]/90 hover:to-[#f97316]/90 text-white px-8 text-lg shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all"
                        ]
                    ],
                    "background" => "bg-gradient-to-r from-[#d97706] to-[#ea580c]"
                ]
            ],
            "testimonials" => [
                "enabled" => true,
                "title" => "Apa Kata Klien Kami",
                "subtitle" => "Testimoni dari klien yang puas dengan layanan kami",
                "items" => [
                    [
                        "name" => "Budi Santoso",
                        "role" => "Owner",
                        "company" => "CV. Maju Bersama",
                        "content" => "Hasil etching sangat memuaskan! Detail logo perusahaan kami tercetak sempurna di plakat kristal. Tim sangat profesional dan responsif.",
                        "rating" => 5,
                        "image" => "/images/testimonials/client-1.jpg"
                    ],
                    [
                        "name" => "Siti Nurhaliza",
                        "role" => "Manager HRD",
                        "company" => "PT. Sejahtera Abadi",
                        "content" => "Sudah beberapa kali order untuk kebutuhan corporate gift. Kualitas konsisten bagus, harga kompetitif, dan pengerjaan cepat. Highly recommended!",
                        "rating" => 5,
                        "image" => "/images/testimonials/client-2.jpg"
                    ],
                    [
                        "name" => "Ahmad Wijaya",
                        "role" => "Event Organizer",
                        "company" => "AW Events",
                        "content" => "Partner terpercaya untuk pembuatan trophy dan plakat event kami. Hasilnya selalu memuaskan dan tepat waktu. Terima kasih!",
                        "rating" => 5,
                        "image" => "/images/testimonials/client-3.jpg"
                    ]
                ]
            ],
            "seo" => [
                "title" => "Jasa Etching Profesional - {$tenantName}",
                "description" => "Layanan laser etching profesional untuk logam, kaca, kristal, dan berbagai material. Hasil presisi tinggi, pengerjaan cepat, harga kompetitif.",
                "keywords" => ["jasa etching", "laser etching", "etching logam", "plakat etching"],
                "ogImage" => "/images/og-image-home.jpg"
            ]
        ];

        // Check if homepage already exists for this tenant
        $existingHome = DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', 'home')
            ->first();
            
        if (!$existingHome) {
            DB::table('tenant_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'title' => 'Homepage',
                'slug' => 'home',
                'description' => 'Homepage content for ' . $tenantName,
                'content' => json_encode($content),
                'template' => 'default',
                'meta_data' => json_encode(['featured' => true, 'priority' => 1]),
                'status' => 'published',
                'page_type' => 'home',
                'is_homepage' => true,
                'sort_order' => 1,
                'language' => 'id',
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);
        }
    }

    private function createAboutPage($tenantId, $tenantSlug, $tenantName): void
    {
        // Check if about page already exists for this tenant
        $existingAbout = DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', 'about')
            ->first();
        $content = [
            "hero" => [
                "title" => "Tentang Kami",
                "subtitle" => "Pionir teknologi laser etching di Indonesia dengan pengalaman lebih dari 15 tahun",
                "image" => "/images/about/company-hero.jpg"
            ],
            "company" => [
                "enabled" => true,
                "title" => "Profil Perusahaan", 
                "description" => "Kami adalah perusahaan yang berfokus pada layanan laser etching profesional untuk berbagai kebutuhan industri dan personal. Dengan teknologi terkini dan tim yang berpengalaman, kami berkomitmen memberikan hasil terbaik untuk setiap proyek.",
                "founded" => "2008",
                "location" => "Jakarta, Indonesia", 
                "employees" => "50+",
                "clients" => "300+"
            ],
            "mission" => [
                "enabled" => true,
                "title" => "Visi & Misi Kami",
                "items" => [
                    [
                        "icon" => "Target",
                        "title" => "VISI",
                        "description" => "Menjadi perusahaan yang menghadirkan karya presisi tinggi dengan sentuhan seni dan teknologi, memberikan nilai estetika dan kualitas terbaik untuk kepuasan setiap pelanggan"
                    ],
                    [
                        "icon" => "Lightbulb",
                        "title" => "MISI",
                        "description" => "1. Membangun kepercayaan konsumen melalui hasil kerja presisi, detail, dan ketepatan waktu. \n2. Mengembangkan desain etching yang inovatif untuk memenuhi kebutuhan personalisasi dan industri kreatif. \n3. Menjalin kemitraan strategis dengan pelaku industri untuk memperluas jangkauan pasar dan meningkatkan daya saing."
                    ]
                ]
            ],
            "values" => [
                "enabled" => true,
                "title" => "Nilai-Nilai Kami",
                "items" => [
                    "Kami percaya bahwa setiap detail menentukan hasil akhir. Karena itu, presisi menjadi fondasi utama dalam setiap proses etching yang kami lakukan — dari desain hingga hasil jadi.",
                    "Kami membangun kepercayaan melalui kejujuran, transparansi, dan kerja sama erat antara tim internal, mitra, dan pelanggan kami.",
                    "Kami tidak hanya ingin memenuhi kebutuhan, tetapi juga memberikan pengalaman yang menyenangkan, hasil yang menginspirasi, dan layanan yang terpercaya."
                ]
            ],
            "team" => [
                "enabled" => true,
                "title" => "Tim Profesional",
                "subtitle" => "Didukung oleh tim ahli berpengalaman di bidangnya",
                "members" => [
                    [
                        "name" => "John Doe",
                        "role" => "CEO & Founder",
                        "image" => "/images/team/ceo.jpg",
                        "bio" => "Pengalaman 20+ tahun di industri laser etching"
                    ],
                    [
                        "name" => "Jane Smith",
                        "role" => "Technical Director",
                        "image" => "/images/team/technical-director.jpg",
                        "bio" => "Spesialis teknologi laser dengan sertifikasi internasional"
                    ],
                    [
                        "name" => "Ahmad Rahman",
                        "role" => "Production Manager",
                        "image" => "/images/team/production-manager.jpg",
                        "bio" => "Expert dalam quality control dan production management"
                    ]
                ]
            ],
            "timeline" => [
                "enabled" => true,
                "title" => "Perjalanan Kami",
                "events" => [
                    [
                        "year" => "2008",
                        "title" => "Pendirian Perusahaan",
                        "description" => "Memulai bisnis dengan 1 mesin laser etching"
                    ],
                    [
                        "year" => "2012",
                        "title" => "Ekspansi Fasilitas",
                        "description" => "Membuka fasilitas produksi baru dengan 5 mesin"
                    ],
                    [
                        "year" => "2018",
                        "title" => "Sertifikasi ISO",
                        "description" => "Mendapatkan sertifikasi ISO 9001:2015"
                    ],
                    [
                        "year" => "2023",
                        "title" => "Teknologi Terkini",
                        "description" => "Investasi mesin laser fiber generasi terbaru"
                    ]
                ]
            ],
            "certifications" => [
                "enabled" => true,
                "title" => "Sertifikasi & Penghargaan",
                "items" => [
                    [
                        "name" => "ISO 9001:2015",
                        "description" => "Quality Management System",
                        "image" => "/images/certifications/iso-9001.jpg"
                    ],
                    [
                        "name" => "Best Etching Service 2024",
                        "description" => "Indonesia Manufacturing Awards",
                        "image" => "/images/certifications/award-2024.jpg"
                    ]
                ]
            ],
            "cta" => [
                [
                    "type" => "primary",
                    "title" => "Siap Mewujudkan Proyek Etching Anda?",
                    "subtitle" => "Konsultasikan kebutuhan etching Anda sekarang juga dengan tim profesional kami",
                    "buttons" => [
                        [
                            "text" => "Mulai Konsultasi Gratis",
                            "link" => "/contact",
                            "variant" => "default"
                        ],
                        [
                            "text" => "Lihat Portfolio",
                            "link" => "/products",
                            "variant" => "outline"
                        ]
                    ],
                    "stats" => [
                        [
                            "value" => "1000+",
                            "label" => "Products"
                        ],
                        [
                            "value" => "15+",
                            "label" => "Tahun Pengalaman"
                        ]
                    ],
                    "background" => "bg-gradient-to-r from-navy to-purple-600"
                ]
            ],
            "seo" => [
                "title" => "Tentang Kami - Etching Profesional Indonesia",
                "description" => "Pionir laser etching di Indonesia sejak 2008. Tim profesional dengan pengalaman 15+ tahun, sertifikasi ISO 9001:2015, dan teknologi terkini.",
                "keywords" => ["tentang perusahaan etching", "profil perusahaan laser", "tim etching profesional"],
                "ogImage" => "/images/og-image-about.jpg"
            ]
        ];

        if ($existingAbout) {
            // Update existing About page with complete content structure
            DB::table('tenant_pages')
                ->where('id', $existingAbout->id)
                ->update([
                    'title' => 'Tentang Kami',
                    'description' => 'About page for ' . $tenantName,
                    'content' => json_encode($content),
                    'updated_at' => Carbon::now()
                ]);
        } else {
            // Create new About page
            DB::table('tenant_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'title' => 'Tentang Kami',
                'slug' => 'about',
                'description' => 'About page for ' . $tenantName,
                'content' => json_encode($content),
                'template' => 'default',
                'meta_data' => json_encode(['featured' => true, 'priority' => 2]),
                'status' => 'published',
                'page_type' => 'about',
                'is_homepage' => false,
                'sort_order' => 2,
                'language' => 'id',
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);
        }
    }

    private function createContactPage($tenantId, $tenantSlug, $tenantName): void
    {
        $content = [
            "hero" => [
                "title" => "Hubungi Kami",
                "subtitle" => "Tim kami siap membantu mewujudkan proyek etching Anda"
            ],
            "contactInfo" => [
                "enabled" => true,
                "items" => [
                    [
                        "icon" => "MapPin",
                        "title" => "Alamat",
                        "content" => "Jl. Industri Raya No. 123, Jakarta Selatan 12345, Indonesia"
                    ],
                    [
                        "icon" => "Phone", 
                        "title" => "Telepon",
                        "content" => "+62 21 1234 5678"
                    ],
                    [
                        "icon" => "Mail",
                        "title" => "Email", 
                        "content" => "info@{$tenantSlug}.com"
                    ]
                ]
            ],
            "form" => [
                "enabled" => true,
                "title" => "Kirim Pesan",
                "subtitle" => "Isi form di bawah ini dan kami akan segera menghubungi Anda",
                "fields" => [
                    [
                        "name" => "name",
                        "label" => "Nama Lengkap",
                        "type" => "text",
                        "required" => true
                    ],
                    [
                        "name" => "email", 
                        "label" => "Email",
                        "type" => "email",
                        "required" => true
                    ],
                    [
                        "name" => "message",
                        "label" => "Pesan", 
                        "type" => "textarea",
                        "required" => true
                    ]
                ]
            ],
            "seo" => [
                "title" => "Hubungi Kami - {$tenantName}",
                "description" => "Hubungi tim profesional kami untuk konsultasi dan informasi layanan laser etching. Response cepat dan layanan ramah.",
                "keywords" => ["kontak etching", "hubungi laser etching"],
                "ogImage" => "/images/og-image-contact.jpg"
            ]
        ];

        DB::table('tenant_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $tenantId,
            'title' => 'Hubungi Kami',
            'slug' => 'contact',
            'description' => 'Contact page for ' . $tenantName,
            'content' => json_encode($content),
            'template' => 'default',
            'meta_data' => json_encode(['featured' => true, 'priority' => 3]),
            'status' => 'published',
            'page_type' => 'contact',
            'is_homepage' => false,
            'sort_order' => 3,
            'language' => 'id',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }

    private function createFAQPage($tenantId, $tenantSlug, $tenantName): void
    {
        $content = [
            "hero" => [
                "title" => "Frequently Asked Questions",
                "subtitle" => "Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang layanan etching kami. Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi kami."
            ],
            "categories" => [
                [
                    "id" => "general",
                    "category" => "Umum",
                    "icon" => "HelpCircle",
                    "questions" => [
                        [
                            "q" => "Apa itu etching dan bagaimana prosesnya?",
                            "a" => "Etching adalah proses mengukir desain pada permukaan material seperti metal, kaca, atau kristal menggunakan teknologi laser atau chemical. Proses ini menghasilkan detail yang presisi dan tahan lama. Kami menggunakan teknologi terkini untuk memastikan hasil yang sempurna."
                        ],
                        [
                            "q" => "Berapa lama waktu produksi untuk pesanan saya?",
                            "a" => "Waktu produksi bervariasi tergantung jenis produk dan kompleksitas desain. Umumnya: Signage dan nameplate (7-14 hari), Award dan plakat (10-21 hari), Panel dekoratif besar (21-45 hari). Kami akan memberikan estimasi waktu yang akurat saat Anda melakukan pemesanan."
                        ],
                        [
                            "q" => "Apakah ada minimum order quantity (MOQ)?",
                            "a" => "MOQ bervariasi tergantung jenis produk. Untuk award dan plakat custom, MOQ mulai dari 1 pcs. Untuk signage industrial dan nameplate, MOQ mulai dari 10-50 pcs. Silakan hubungi kami untuk informasi MOQ spesifik produk yang Anda inginkan."
                        ],
                        [
                            "q" => "Apakah saya bisa melihat sample atau proof sebelum produksi?",
                            "a" => "Ya, tentu! Kami menyediakan digital proof/mockup gratis untuk persetujuan Anda sebelum proses produksi dimulai. Untuk physical sample, tersedia dengan biaya tambahan yang akan dikembalikan jika Anda melakukan order."
                        ]
                    ]
                ],
                [
                    "id" => "design",
                    "category" => "Desain & Customization",
                    "icon" => "Lightbulb",
                    "questions" => [
                        [
                            "q" => "Apakah saya bisa mengirimkan desain sendiri?",
                            "a" => "Sangat bisa! Anda dapat mengirimkan desain dalam format vector (AI, EPS, PDF) atau high-resolution image (PNG, JPG minimal 300 DPI). Tim desain kami juga siap membantu menyempurnakan atau membuat desain baru sesuai kebutuhan Anda."
                        ],
                        [
                            "q" => "Jenis font apa yang bisa digunakan untuk etching?",
                            "a" => "Hampir semua jenis font dapat digunakan, namun kami merekomendasikan font dengan ketebalan minimal 1pt untuk hasil optimal. Font dengan detail terlalu tipis atau kompleks mungkin tidak akan terlihat jelas pada material tertentu. Tim kami akan memberikan saran terbaik."
                        ],
                        [
                            "q" => "Apakah bisa menambahkan foto atau gambar kompleks?",
                            "a" => "Ya, kami dapat melakukan photo etching untuk reproduksi foto atau gambar kompleks pada metal dan kaca. Hasil terbaik untuk foto dengan kontras yang baik dan resolusi tinggi (minimal 300 DPI). Kami akan melakukan pre-processing untuk optimasi hasil."
                        ],
                        [
                            "q" => "Apakah ada batasan ukuran desain?",
                            "a" => "Batasan ukuran tergantung material dan metode etching. Untuk detail sangat kecil (dibawah 0.5mm), kami akan merekomendasikan penyesuaian desain. Untuk area besar, kami bisa melakukan sectioning atau panel. Konsultasikan desain Anda dengan tim kami."
                        ]
                    ]
                ],
                [
                    "id" => "material",
                    "category" => "Material & Kualitas",
                    "icon" => "Package",
                    "questions" => [
                        [
                            "q" => "Material apa saja yang tersedia untuk etching?",
                            "a" => "Kami melayani etching untuk berbagai material: Metal (Stainless Steel, Brass, Aluminum, Copper, Titanium), Kaca (Clear, Frosted, Mirror, Crystal), Award Material (Acrylic, Wood, Granite). Setiap material memiliki karakteristik dan keunggulan berbeda."
                        ],
                        [
                            "q" => "Apakah hasil etching tahan lama dan anti luntur?",
                            "a" => "Ya! Etching adalah proses permanen yang mengubah struktur permukaan material, bukan hanya coating atau print. Hasil etching sangat tahan terhadap weathering, UV, korosi, dan abrasi. Untuk aplikasi outdoor, kami juga menyediakan protective coating tambahan."
                        ],
                        [
                            "q" => "Bagaimana cara merawat produk etching?",
                            "a" => "Perawatan sangat mudah: Metal - lap dengan kain lembut, hindari abrasive cleaner. Kaca - cuci dengan sabun lembut dan air, dishwasher safe untuk produk tertentu. Award/Plakat - bersihkan dengan microfiber cloth. Kami akan memberikan care instruction spesifik untuk setiap produk."
                        ],
                        [
                            "q" => "Apakah produk Anda memiliki sertifikat kualitas?",
                            "a" => "Ya, untuk aplikasi industrial dan aerospace, produk kami memenuhi standar internasional dan dilengkapi dengan Certificate of Conformance (CoC). Material yang kami gunakan bersertifikat dan traceable. Kami juga melakukan quality control ketat di setiap tahap produksi."
                        ]
                    ]
                ],
                [
                    "id" => "ordering",
                    "category" => "Pemesanan & Pembayaran",
                    "icon" => "ShoppingCart",
                    "questions" => [
                        [
                            "q" => "Bagaimana cara melakukan pemesanan?",
                            "a" => "Proses pemesanan sangat mudah: 1) Hubungi kami via WhatsApp/Email/Form dengan detail kebutuhan, 2) Konsultasi desain dan material dengan tim kami, 3) Terima quotation dan digital proof, 4) Approve dan lakukan pembayaran, 5) Produksi dimulai, 6) Quality check dan pengiriman."
                        ],
                        [
                            "q" => "Apa saja metode pembayaran yang diterima?",
                            "a" => "Kami menerima: Transfer Bank (BCA, Mandiri, BNI), Virtual Account, E-wallet (OVO, GoPay, Dana), Credit Card (untuk pemesanan online). Untuk corporate order, tersedia termin pembayaran 30-60 hari setelah approval."
                        ],
                        [
                            "q" => "Apakah ada biaya tambahan selain harga produk?",
                            "a" => "Harga quotation sudah termasuk: desain/artwork, produksi, dan packaging. Biaya tambahan mungkin berlaku untuk: Physical sample, Revisi desain major (lebih dari 3x), Express production (rush order), Special packaging/gift box, Ongkos kirim (tergantung lokasi)."
                        ],
                        [
                            "q" => "Bagaimana dengan garansi dan return policy?",
                            "a" => "Kami memberikan garansi 100% untuk defect produksi. Jika ada kesalahan dari pihak kami (salah etching, material defect), kami akan remake gratis. Untuk cancel order setelah produksi dimulai, akan dikenakan charge 50%. Kami tidak menerima return untuk custom order kecuali ada defect."
                        ]
                    ]
                ],
                [
                    "id" => "shipping",
                    "category" => "Pengiriman",
                    "icon" => "Truck",
                    "questions" => [
                        [
                            "q" => "Apakah produk bisa dikirim ke seluruh Indonesia?",
                            "a" => "Ya! Kami melayani pengiriman ke seluruh Indonesia melalui ekspedisi terpercaya (JNE, J&T, SiCepat, Grab, GoSend untuk area Jabodetabek). Untuk produk fragile seperti kaca dan crystal, kami gunakan packaging khusus dengan asuransi."
                        ],
                        [
                            "q" => "Berapa lama estimasi pengiriman?",
                            "a" => "Estimasi pengiriman setelah produksi selesai: Jabodetabek (1-2 hari), Jawa (2-3 hari), Luar Jawa (3-7 hari). Untuk produk besar atau area remote, mungkin memerlukan waktu lebih lama. Kami akan memberikan tracking number untuk monitoring pengiriman."
                        ],
                        [
                            "q" => "Apakah ada opsi express delivery?",
                            "a" => "Ya, tersedia same day delivery untuk area Jabodetabek (tergantung ketersediaan) dan next day delivery untuk Jawa. Untuk pengiriman express, mohon informasikan saat melakukan order. Biaya tambahan akan berlaku."
                        ],
                        [
                            "q" => "Bagaimana jika produk rusak saat pengiriman?",
                            "a" => "Semua pengiriman produk fragile (kaca, crystal, award) diasuransikan penuh. Jika terjadi kerusakan, segera foto dan laporkan dalam 1x24 jam setelah penerimaan. Kami akan proses klaim asuransi dan kirim pengganti atau refund sesuai kebijakan."
                        ]
                    ]
                ]
            ],
            "cta" => [
                "title" => "Masih Ada Pertanyaan?",
                "subtitle" => "Tim customer service kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami melalui WhatsApp, email, atau form kontak untuk konsultasi gratis.",
                "buttons" => [
                    [
                        "text" => "Chat via WhatsApp",
                        "link" => "https://wa.me/6281234567890",
                        "variant" => "default"
                    ],
                    [
                        "text" => "Email Kami",
                        "link" => "/contact",
                        "variant" => "outline"
                    ]
                ]
            ],
            "seo" => [
                "title" => "FAQ - Pertanyaan Seputar Laser Etching | Etching ID",
                "description" => "Temukan jawaban untuk pertanyaan umum seputar layanan laser etching. Informasi lengkap tentang proses, harga, material, dan garansi.",
                "keywords" => ["faq etching", "pertanyaan laser etching", "info etching"],
                "ogImage" => "/images/og-image-faq.jpg"
            ]
        ];

        DB::table('tenant_pages')->insert([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $tenantId,
            'title' => 'FAQ',
            'slug' => 'faq',
            'description' => 'FAQ page for ' . $tenantName,
            'content' => json_encode($content),
            'template' => 'default',
            'meta_data' => json_encode(['featured' => true, 'priority' => 4]),
            'status' => 'published',
            'page_type' => 'faq',
            'is_homepage' => false,
            'sort_order' => 4,
            'language' => 'id',
            'published_at' => Carbon::now(),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }

    private function createServicePages($tenantId, $tenantSlug, $tenantName): void
    {
        $servicePages = [
            ['title' => 'Layanan Etching Metal', 'slug' => 'services/metal-etching'],
            ['title' => 'Layanan Etching Kaca', 'slug' => 'services/glass-etching'],
            ['title' => 'Plakat & Trophy Custom', 'slug' => 'services/trophy-plaque'],
            ['title' => 'Signage Industrial', 'slug' => 'services/industrial-signage'],
            ['title' => 'Nameplate Profesional', 'slug' => 'services/nameplate'],
            ['title' => 'Konsultasi Desain', 'slug' => 'services/design-consultation'],
            ['title' => 'Prototype Development', 'slug' => 'services/prototype'],
            ['title' => 'Mass Production', 'slug' => 'services/mass-production'],
            ['title' => 'Quality Control', 'slug' => 'services/quality-control'],
            ['title' => 'Custom Packaging', 'slug' => 'services/packaging'],
            ['title' => 'Express Service', 'slug' => 'services/express'],
            ['title' => 'After Sales Support', 'slug' => 'services/support'],
        ];

        foreach ($servicePages as $index => $page) {
            $content = [
                "hero" => [
                    "title" => $page['title'],
                    "subtitle" => "Layanan profesional dengan kualitas terjamin dan harga kompetitif",
                    "image" => "/images/services/service-" . ($index + 1) . ".jpg"
                ],
                "description" => "Deskripsi lengkap tentang " . strtolower($page['title']) . " yang kami tawarkan untuk memenuhi kebutuhan bisnis Anda.",
                "features" => [
                    "Kualitas Premium",
                    "Harga Kompetitif", 
                    "Pengerjaan Cepat",
                    "Garansi Kualitas"
                ],
                "pricing" => [
                    "enabled" => true,
                    "starting_price" => "Mulai dari Rp 50.000",
                    "consultation" => "Konsultasi GRATIS"
                ],
                "seo" => [
                    "title" => $page['title'] . " - " . $tenantName,
                    "description" => "Layanan " . strtolower($page['title']) . " profesional dengan kualitas terjamin. Konsultasi gratis dan harga kompetitif.",
                    "keywords" => [str_replace(' ', '-', strtolower($page['title'])), "layanan etching"]
                ]
            ];

            DB::table('tenant_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'title' => $page['title'],
                'slug' => $page['slug'],
                'description' => 'Service page: ' . $page['title'],
                'content' => json_encode($content),
                'template' => 'service',
                'meta_data' => json_encode(['category' => 'services', 'featured' => $index < 6]),
                'status' => 'published',
                'page_type' => 'services',
                'is_homepage' => false,
                'sort_order' => 10 + $index,
                'language' => 'id',
                'published_at' => Carbon::now(),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]);
        }
    }

    private function createBlogPages($tenantId, $tenantSlug, $tenantName): void
    {
        $blogPosts = [
            'Tips Memilih Material Etching yang Tepat',
            'Teknologi Laser Etching Terkini 2024', 
            'Perawatan Produk Etching Agar Awet',
            'Inspirasi Desain Plakat Modern',
            'Proses Quality Control di Industri Etching',
            'Tren Signage Industrial 2024',
            'Cara Menentukan Ukuran Etching yang Optimal',
            'Perbedaan Etching Laser vs Chemical',
            'Aplikasi Etching di Berbagai Industri',
            'Panduan Konsultasi Proyek Etching',
            'Inovasi Material Etching Ramah Lingkungan',
            'Case Study: Proyek Etching Skala Besar',
            'Tips Fotografi Produk Etching',
            'Mengenal Berbagai Finishing Etching',
            'Etching untuk Branding Perusahaan',
            'Maintenance Mesin Laser Etching',
            'Standar Kualitas Internasional Etching',
            'Custom Design: Dari Konsep ke Produksi',
            'Packaging & Shipping Produk Etching',
            'Future of Etching Technology'
        ];

        foreach ($blogPosts as $index => $title) {
            $slug = 'blog/' . \Illuminate\Support\Str::slug($title);
            
            $content = [
                "hero" => [
                    "title" => $title,
                    "subtitle" => "Artikel informatif seputar dunia laser etching dan teknologi terkini",
                    "image" => "/images/blog/blog-" . ($index + 1) . ".jpg",
                    "author" => "Tim " . $tenantName,
                    "published_date" => Carbon::now()->subDays(rand(1, 180))->toDateString(),
                    "reading_time" => rand(3, 8) . " menit"
                ],
                "content" => [
                    "intro" => "Pembahasan mendalam tentang " . strtolower($title) . " untuk membantu Anda memahami lebih baik tentang industri etching.",
                    "sections" => [
                        [
                            "heading" => "Pengenalan",
                            "content" => "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
                        ],
                        [
                            "heading" => "Pembahasan Utama", 
                            "content" => "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
                        ],
                        [
                            "heading" => "Kesimpulan",
                            "content" => "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
                        ]
                    ]
                ],
                "tags" => ["etching", "laser", "teknologi", "tips"],
                "related_posts" => array_slice($blogPosts, max(0, $index - 3), 3),
                "seo" => [
                    "title" => $title . " | Blog " . $tenantName,
                    "description" => "Artikel informatif tentang " . strtolower($title) . ". Tips, panduan, dan insight dari ahli etching profesional.",
                    "keywords" => ["blog etching", str_replace(' ', '-', strtolower($title)), "artikel laser"],
                    "ogImage" => "/images/blog/og-blog-" . ($index + 1) . ".jpg"
                ]
            ];

            DB::table('tenant_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'title' => $title,
                'slug' => $slug,
                'description' => 'Blog post: ' . $title,
                'content' => json_encode($content),
                'template' => 'blog',
                'meta_data' => json_encode([
                    'category' => 'blog',
                    'featured' => $index < 5,
                    'author' => 'Tim ' . $tenantName,
                    'reading_time' => rand(3, 8)
                ]),
                'status' => rand(0, 10) > 2 ? 'published' : 'draft', // 80% published, 20% draft
                'page_type' => 'services',
                'is_homepage' => false,
                'sort_order' => 100 + $index,
                'language' => 'id',
                'published_at' => rand(0, 10) > 2 ? Carbon::now()->subDays(rand(1, 180)) : null,
                'created_at' => Carbon::now()->subDays(rand(1, 200)),
                'updated_at' => Carbon::now()->subDays(rand(1, 30))
            ]);
        }
    }
}