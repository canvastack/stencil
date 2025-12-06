<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domain\Content\Entities\PlatformPage;
use Illuminate\Support\Facades\File;

class PlatformPagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding Platform Pages with comprehensive schemas...');
        
        // Create platform pages with complete schemas based on mock data
        $pages = [
            'home' => $this->getHomePageContent(),
            'about' => $this->getAboutPageContent(),
            'contact' => $this->getContactPageContent(),
            'faq' => $this->getFaqPageContent()
        ];

        foreach ($pages as $slug => $pageData) {
            PlatformPage::updateOrCreate(
                ['slug' => $slug],
                [
                    'title' => $pageData['title'],
                    'description' => $pageData['description'],
                    'content' => $pageData['content'],
                    'status' => 'published',
                    'published_at' => now(),
                    'page_type' => $slug,
                    'is_homepage' => $slug === 'home',
                    'template' => 'default',
                    'language' => 'id',
                    'sort_order' => $this->getSortOrder($slug),
                    'meta_data' => [
                        'last_updated_by' => 'system',
                        'schema_version' => '2.0',
                        'imported_from' => 'seeder'
                    ]
                ]
            );
            
            $this->command->info("✅ Created {$slug} page with comprehensive schema");
        }
        
        $this->command->info('🎉 Platform Pages seeding completed successfully!');
    }

    /**
     * Get Home page content with complete schema
     */
    private function getHomePageContent(): array
    {
        return [
            'title' => 'CanvaStencil - Platform CMS Multi-Tenant Terdepan',
            'description' => 'Platform CMS yang memungkinkan bisnis dari berbagai industri untuk mengelola konten website mereka dengan mudah dan profesional',
            'content' => [
                'hero' => [
                    'title' => [
                        'static' => 'Platform CMS untuk Semua Bisnis',
                        'typing' => [
                            'Platform CMS untuk Semua Bisnis',
                            'Solusi Website Profesional untuk UMKM',
                            'Kelola Website Bisnis Anda dengan Mudah'
                        ]
                    ],
                    'subtitle' => 'Platform CMS multi-tenant yang memungkinkan bisnis dari berbagai industri mengelola website mereka dengan interface yang mudah digunakan.',
                    'carousel' => [
                        'images' => [
                            '/images/hero/platform-1.jpg',
                            '/images/hero/platform-2.jpg',
                            '/images/hero/platform-3.jpg'
                        ],
                        'autoPlayInterval' => 5000,
                        'showPauseButton' => true
                    ],
                    'buttons' => [
                        'primary' => [
                            'text' => 'Mulai Gratis',
                            'link' => '/register',
                            'icon' => 'ArrowRight'
                        ],
                        'secondary' => [
                            'text' => 'Lihat Demo',
                            'link' => '/demo',
                            'icon' => 'Play'
                        ]
                    ]
                ],
                'socialProof' => [
                    'enabled' => true,
                    'title' => 'Dipercaya oleh berbagai jenis bisnis',
                    'subtitle' => 'Lebih dari 1500+ bisnis telah menggunakan platform kami untuk mengelola website mereka dengan sukses',
                    'stats' => [
                        [
                            'icon' => 'Users',
                            'value' => '1500+',
                            'label' => 'Bisnis Aktif',
                            'color' => 'text-blue-500'
                        ],
                        [
                            'icon' => 'Target',
                            'value' => '25+',
                            'label' => 'Jenis Industri',
                            'color' => 'text-green-500'
                        ],
                        [
                            'icon' => 'Award',
                            'value' => '5+',
                            'label' => 'Tahun Beroperasi',
                            'color' => 'text-purple-500'
                        ],
                        [
                            'icon' => 'CheckCircle2',
                            'value' => '99.9%',
                            'label' => 'Uptime Platform',
                            'color' => 'text-primary'
                        ]
                    ]
                ],
                'process' => [
                    'enabled' => true,
                    'title' => 'Cara kerja platform kami',
                    'subtitle' => 'Mulai dari pendaftaran hingga website bisnis Anda online dan siap menerima pelanggan',
                    'steps' => [
                        [
                            'icon' => 'MessageSquare',
                            'title' => 'Daftar & Setup',
                            'description' => 'Buat akun dan pilih template yang sesuai dengan bisnis Anda'
                        ],
                        [
                            'icon' => 'Zap',
                            'title' => 'Kustomisasi Konten',
                            'description' => 'Edit konten website dengan drag-and-drop yang mudah digunakan'
                        ],
                        [
                            'icon' => 'ClipboardCheck',
                            'title' => 'Preview & Review',
                            'description' => 'Lihat preview website Anda sebelum dipublikasikan'
                        ],
                        [
                            'icon' => 'Package',
                            'title' => 'Publish Online',
                            'description' => 'Website langsung online dan siap menerima pelanggan'
                        ]
                    ],
                    'preview' => [
                        'enabled' => true,
                        'title' => 'Preview: Dashboard Admin Bisnis',
                        'features' => [
                            'Kelola konten website dengan mudah',
                            'Analytics pengunjung real-time',
                            'Manajemen produk dan layanan'
                        ],
                        'button' => [
                            'text' => 'Coba Demo Gratis',
                            'link' => '/demo'
                        ]
                    ]
                ],
                'whyChooseUs' => [
                    'enabled' => true,
                    'title' => 'Mengapa Memilih Platform CanvaStencil?',
                    'subtitle' => 'Platform CMS yang dirancang khusus untuk membantu bisnis UMKM dan perusahaan mengelola website dengan mudah',
                    'items' => [
                        [
                            'icon' => 'Zap',
                            'title' => 'Mudah Digunakan',
                            'description' => 'Interface drag-and-drop yang intuitif, tidak perlu keahlian teknis untuk mengelola website.',
                            'color' => 'orange'
                        ],
                        [
                            'icon' => 'Layers',
                            'title' => 'Multi-Tenant',
                            'description' => 'Platform mendukung berbagai jenis bisnis dengan template dan fitur yang dapat disesuaikan.',
                            'color' => 'blue'
                        ],
                        [
                            'icon' => 'Palette',
                            'title' => 'Kustomisasi Fleksibel',
                            'description' => 'Sesuaikan tampilan dan fungsi website sepenuhnya sesuai kebutuhan bisnis Anda.',
                            'color' => 'purple'
                        ]
                    ]
                ],
                'achievements' => [
                    'enabled' => true,
                    'title' => 'Keunggulan Platform Kami',
                    'items' => [
                        [
                            'icon' => 'Shield',
                            'title' => 'Keamanan Tingkat Enterprise',
                            'description' => 'Data bisnis Anda aman dengan enkripsi SSL dan backup otomatis setiap hari.',
                            'color' => 'blue'
                        ],
                        [
                            'icon' => 'Award',
                            'title' => 'Performance Optimal',
                            'description' => 'Website loading cepat dengan CDN global dan optimasi otomatis untuk SEO.',
                            'color' => 'purple'
                        ]
                    ]
                ],
                'services' => [
                    'enabled' => true,
                    'title' => 'Fitur Platform Lengkap',
                    'subtitle' => 'Semua yang Anda butuhkan untuk mengelola website bisnis dalam satu platform terintegrasi',
                    'items' => [
                        [
                            'icon' => 'Package',
                            'title' => 'Website Builder',
                            'description' => 'Drag-and-drop builder untuk membuat website profesional tanpa coding'
                        ],
                        [
                            'icon' => 'Award',
                            'title' => 'E-Commerce Ready',
                            'description' => 'Kelola produk, inventory, dan pesanan dengan sistem e-commerce terintegrasi'
                        ],
                        [
                            'icon' => 'MessageSquare',
                            'title' => 'Customer Support',
                            'description' => 'Tim support 24/7 siap membantu bisnis Anda berkembang'
                        ],
                        [
                            'icon' => 'Shield',
                            'title' => 'Analytics & SEO',
                            'description' => 'Dashboard analytics lengkap dan optimasi SEO otomatis'
                        ],
                        [
                            'icon' => 'Palette',
                            'title' => 'Template Beragam',
                            'description' => 'Pilihan template untuk berbagai jenis bisnis dan industri'
                        ],
                        [
                            'icon' => 'Layers',
                            'title' => 'Multi-Platform',
                            'description' => 'Website otomatis responsif untuk desktop, tablet, dan mobile'
                        ]
                    ]
                ],
                'cta' => [
                    [
                        'type' => 'primary',
                        'enabled' => true,
                        'title' => 'Siap Memulai Website Bisnis Anda?',
                        'subtitle' => 'Bergabunglah dengan ribuan bisnis yang telah mempercayakan website mereka pada platform kami',
                        'stats' => [
                            [
                                'value' => '1500+',
                                'label' => 'Bisnis Aktif'
                            ],
                            [
                                'value' => '5+',
                                'label' => 'Tahun Beroperasi'
                            ],
                            [
                                'value' => '99.9%',
                                'label' => 'Uptime Platform'
                            ]
                        ],
                        'buttons' => [
                            [
                                'text' => 'Mulai Gratis Sekarang',
                                'icon' => 'ArrowRight',
                                'link' => '/register',
                                'variant' => 'default',
                                'className' => 'bg-[#475569] hover:bg-[#334155]'
                            ],
                            [
                                'text' => 'Lihat Demo Platform',
                                'icon' => 'Play',
                                'link' => '/demo',
                                'variant' => 'outline',
                                'className' => 'border-2 border-[#fbbf24] bg-transparent text-white hover:bg-white/10'
                            ]
                        ],
                        'background' => 'bg-gradient-to-r from-[#f59e0b] to-[#f97316]'
                    ],
                    [
                        'type' => 'secondary',
                        'enabled' => true,
                        'title' => 'Butuh Bantuan Memilih Paket yang Tepat?',
                        'subtitle' => 'Tim support kami siap membantu Anda memilih solusi yang paling sesuai dengan kebutuhan bisnis',
                        'buttons' => [
                            [
                                'text' => 'Konsultasi Gratis',
                                'link' => '/contact',
                                'variant' => 'default',
                                'className' => 'bg-gradient-to-r from-[#f59e0b] to-[#f97316] hover:bg-gradient-to-r hover:from-[#f59e0b]/90 hover:to-[#f97316]/90 text-white px-8 text-lg shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all'
                            ]
                        ],
                        'background' => 'bg-gradient-to-r from-[#d97706] to-[#ea580c]'
                    ]
                ],
                'testimonials' => [
                    'enabled' => true,
                    'title' => 'Apa Kata Pengguna Platform Kami',
                    'subtitle' => 'Testimoni dari berbagai bisnis yang telah menggunakan platform CanvaStencil',
                    'items' => [
                        [
                            'name' => 'Sarah Melati',
                            'role' => 'Owner',
                            'company' => 'Toko Bunga Melati',
                            'content' => 'Platform ini sangat membantu! Dalam 2 hari website toko bunga kami sudah online dan langsung ada pesanan. Interface-nya sangat mudah digunakan.',
                            'rating' => 5,
                            'image' => '/images/testimonials/client-1.jpg'
                        ],
                        [
                            'name' => 'Rizky Pratama',
                            'role' => 'Founder',
                            'company' => 'Bengkel Motor Rizky',
                            'content' => 'Sebagai bengkel kecil, kami butuh website yang simple. Platform ini perfect! Pelanggan bisa booking service online dan kami bisa kelola dengan mudah.',
                            'rating' => 5,
                            'image' => '/images/testimonials/client-2.jpg'
                        ],
                        [
                            'name' => 'Ibu Sari',
                            'role' => 'Chef',
                            'company' => 'Katering Sari Rasa',
                            'content' => 'Dari yang awalnya hanya jualan offline, sekarang orderan online meningkat 300%! Template untuk bisnis katering sangat lengkap dan menarik.',
                            'rating' => 5,
                            'image' => '/images/testimonials/client-3.jpg'
                        ]
                    ]
                ],
                'seo' => [
                    'title' => 'CanvaStencil - Platform CMS Multi-Tenant untuk Semua Bisnis',
                    'description' => 'Platform CMS yang memungkinkan bisnis dari berbagai industri mengelola website dengan mudah. Drag-and-drop builder, e-commerce ready, template beragam. Mulai gratis!',
                    'keywords' => [
                        'platform CMS',
                        'website builder',
                        'multi-tenant CMS',
                        'website bisnis',
                        'e-commerce platform',
                        'drag and drop builder',
                        'template website',
                        'UMKM website'
                    ],
                    'ogImage' => '/images/og-image-platform.jpg'
                ]
            ]
        ];
    }

    /**
     * Get About page content with complete schema
     */
    private function getAboutPageContent(): array
    {
        return [
            'title' => 'Tentang CanvaStencil - Platform CMS Multi-Tenant',
            'description' => 'Platform CMS inovatif yang memungkinkan berbagai jenis bisnis mengelola website dengan mudah, dilengkapi fitur lengkap dan dukungan 24/7',
            'content' => [
                'hero' => [
                    'title' => 'Tentang CanvaStencil',
                    'subtitle' => 'Platform CMS multi-tenant yang memberdayakan bisnis dari berbagai industri untuk memiliki website profesional',
                    'image' => '/images/about/platform-hero.jpg'
                ],
                'company' => [
                    'enabled' => true,
                    'title' => 'Profil Platform',
                    'description' => 'CanvaStencil adalah platform CMS multi-tenant yang dirancang khusus untuk membantu bisnis dari berbagai industri memiliki website profesional tanpa perlu keahlian teknis. Dengan teknologi modern dan interface yang intuitif, kami memungkinkan setiap bisnis untuk online dengan mudah.',
                    'founded' => '2020',
                    'location' => 'Jakarta, Indonesia',
                    'employees' => '25+',
                    'clients' => '1500+'
                ],
                'mission' => [
                    'enabled' => true,
                    'title' => 'Visi & Misi Kami',
                    'items' => [
                        [
                            'icon' => 'Target',
                            'title' => 'VISI',
                            'description' => 'Menjadi platform CMS multi-tenant terdepan di Indonesia yang memungkinkan setiap bisnis, dari UMKM hingga perusahaan besar, memiliki kehadiran digital yang profesional dan mudah dikelola.'
                        ],
                        [
                            'icon' => 'Lightbulb',
                            'title' => 'MISI',
                            'description' => '1. Menyediakan platform CMS yang mudah digunakan untuk semua jenis bisnis tanpa memerlukan keahlian teknis. 
2. Mengembangkan fitur-fitur inovatif yang mendukung pertumbuhan bisnis digital. 
3. Memberikan dukungan penuh kepada setiap pengguna untuk kesuksesan bisnis online mereka.'
                        ]
                    ]
                ],
                'values' => [
                    'enabled' => true,
                    'title' => 'Nilai-Nilai Kami',
                    'items' => [
                        'Kemudahan Penggunaan: Kami percaya teknologi harus mudah digunakan. Platform kami dirancang intuitif sehingga siapa saja bisa mengelola website bisnis mereka.',
                        'Kemitraan: Kami tidak hanya menyediakan platform, tetapi menjadi partner dalam kesuksesan bisnis digital setiap pengguna kami.',
                        'Inovasi Berkelanjutan: Kami terus mengembangkan fitur baru dan meningkatkan platform berdasarkan kebutuhan dan feedback pengguna.'
                    ]
                ],
                'team' => [
                    'enabled' => true,
                    'title' => 'Tim Profesional',
                    'subtitle' => 'Didukung oleh tim developer dan product manager berpengalaman',
                    'members' => [
                        [
                            'name' => 'Andi Setiawan',
                            'role' => 'CEO & Founder',
                            'image' => '/images/team/ceo.jpg',
                            'bio' => 'Pengalaman 15+ tahun di industri teknologi dan platform digital'
                        ],
                        [
                            'name' => 'Sarah Dewi',
                            'role' => 'CTO',
                            'image' => '/images/team/cto.jpg',
                            'bio' => 'Full-stack developer dengan spesialisasi platform multi-tenant'
                        ],
                        [
                            'name' => 'Rizki Maulana',
                            'role' => 'Product Manager',
                            'image' => '/images/team/product-manager.jpg',
                            'bio' => 'Expert dalam user experience dan product development'
                        ]
                    ]
                ],
                'timeline' => [
                    'enabled' => true,
                    'title' => 'Perjalanan Platform',
                    'events' => [
                        [
                            'year' => '2020',
                            'title' => 'Platform Launch',
                            'description' => 'Peluncuran beta platform CMS untuk 50 pengguna awal'
                        ],
                        [
                            'year' => '2021',
                            'title' => 'Multi-Tenant Ready',
                            'description' => 'Implementasi arsitektur multi-tenant dan e-commerce features'
                        ],
                        [
                            'year' => '2022',
                            'title' => 'Mobile Responsive',
                            'description' => 'Semua template menjadi responsive dan mobile-first design'
                        ],
                        [
                            'year' => '2024',
                            'title' => 'AI Integration',
                            'description' => 'Integrasi AI untuk content suggestions dan SEO automation'
                        ]
                    ]
                ],
                'certifications' => [
                    'enabled' => true,
                    'title' => 'Keamanan & Penghargaan',
                    'items' => [
                        [
                            'name' => 'SSL Certificate',
                            'description' => 'Keamanan Data Tingkat Enterprise',
                            'image' => '/images/certifications/ssl-cert.jpg'
                        ],
                        [
                            'name' => 'Best CMS Platform 2024',
                            'description' => 'Indonesia Digital Awards',
                            'image' => '/images/certifications/digital-award-2024.jpg'
                        ]
                    ]
                ],
                'cta' => [
                    [
                        'type' => 'primary',
                        'enabled' => true,
                        'title' => 'Siap Memulai Website Bisnis Anda?',
                        'subtitle' => 'Bergabunglah dengan ribuan bisnis yang telah mempercayakan website mereka kepada kami',
                        'buttons' => [
                            [
                                'text' => 'Mulai Gratis Sekarang',
                                'link' => '/register',
                                'variant' => 'default'
                            ],
                            [
                                'text' => 'Lihat Demo',
                                'link' => '/demo',
                                'variant' => 'outline'
                            ]
                        ],
                        'stats' => [
                            [
                                'value' => '1500+',
                                'label' => 'Bisnis Aktif'
                            ],
                            [
                                'value' => '5+',
                                'label' => 'Tahun Beroperasi'
                            ]
                        ],
                        'background' => 'bg-gradient-to-r from-navy to-purple-600'
                    ]
                ],
                'seo' => [
                    'title' => 'Tentang CanvaStencil - Platform CMS Multi-Tenant Indonesia',
                    'description' => 'Platform CMS multi-tenant terdepan di Indonesia sejak 2020. Tim developer berpengalaman, keamanan enterprise, dan fitur lengkap untuk semua bisnis.',
                    'keywords' => ['tentang canvastencil', 'platform cms indonesia', 'multi-tenant cms', 'website builder indonesia'],
                    'ogImage' => '/images/og-image-about-platform.jpg'
                ]
            ]
        ];
    }

    /**
     * Get Contact page content with complete schema
     */
    private function getContactPageContent(): array
    {
        return [
            'title' => 'Hubungi Kami - Tim Support CanvaStencil',
            'description' => 'Hubungi tim support kami untuk konsultasi platform, bantuan teknis, atau pertanyaan seputar penggunaan CanvaStencil. Support 24/7.',
            'content' => [
                'hero' => [
                    'title' => 'Hubungi Tim CanvaStencil',
                    'subtitle' => 'Tim support kami siap membantu kesuksesan bisnis digital Anda'
                ],
                'contactInfo' => [
                    'enabled' => true,
                    'items' => [
                        [
                            'icon' => 'MapPin',
                            'title' => 'Alamat Kantor',
                            'content' => 'Jl. Teknologi Raya No. 88, Jakarta Selatan 12560, Indonesia'
                        ],
                        [
                            'icon' => 'Phone',
                            'title' => 'Customer Support',
                            'content' => '+62 21 8888 9999'
                        ],
                        [
                            'icon' => 'Mail',
                            'title' => 'Email Support',
                            'content' => 'support@canvastencil.com'
                        ],
                        [
                            'icon' => 'Clock',
                            'title' => 'Jam Support',
                            'content' => "24/7 Live Chat Support\nPhone: Senin - Jumat 08:00 - 18:00 WIB"
                        ]
                    ]
                ],
                'form' => [
                    'enabled' => true,
                    'title' => 'Butuh Bantuan?',
                    'subtitle' => 'Isi form di bawah ini dan tim support kami akan membantu Anda',
                    'fields' => [
                        [
                            'name' => 'name',
                            'label' => 'Nama Lengkap',
                            'type' => 'text',
                            'required' => true,
                            'placeholder' => 'Masukkan nama lengkap'
                        ],
                        [
                            'name' => 'email',
                            'label' => 'Email',
                            'type' => 'email',
                            'required' => true,
                            'placeholder' => 'nama@email.com'
                        ],
                        [
                            'name' => 'phone',
                            'label' => 'Nomor Telepon',
                            'type' => 'tel',
                            'required' => true,
                            'placeholder' => '+62 812 3456 7890'
                        ],
                        [
                            'name' => 'subject',
                            'label' => 'Kategori',
                            'type' => 'select',
                            'required' => true,
                            'options' => [
                                'Pertanyaan Platform',
                                'Bantuan Teknis',
                                'Request Demo',
                                'Billing & Pricing',
                                'Lainnya'
                            ]
                        ],
                        [
                            'name' => 'message',
                            'label' => 'Pesan',
                            'type' => 'textarea',
                            'required' => true,
                            'placeholder' => 'Jelaskan pertanyaan atau masalah yang Anda hadapi...'
                        ]
                    ],
                    'submitButton' => 'Kirim Pesan',
                    'successMessage' => 'Terima kasih! Tim support kami akan menghubungi Anda dalam 1x24 jam.'
                ],
                'map' => [
                    'enabled' => true,
                    'title' => 'Lokasi Kami',
                    'embedUrl' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMDAuMCJTIDEwNsKwNDgnMDAuMCJF!5e0!3m2!1sen!2sid!4v1234567890'
                ],
                'quickContact' => [
                    'enabled' => true,
                    'title' => 'Atau Hubungi Langsung',
                    'items' => [
                        [
                            'icon' => 'MessageCircle',
                            'title' => 'WhatsApp Support',
                            'description' => 'Chat langsung dengan tim support',
                            'link' => 'https://wa.me/6281888899999',
                            'buttonText' => 'Chat Support'
                        ],
                        [
                            'icon' => 'Phone',
                            'title' => 'Phone Support',
                            'description' => 'Hubungi customer service kami',
                            'link' => 'tel:+622188889999',
                            'buttonText' => 'Call Support'
                        ]
                    ]
                ],
                'achievements' => [
                    'enabled' => true,
                    'title' => 'Statistik Platform',
                    'subtitle' => 'Pencapaian yang telah diraih bersama pengguna kami',
                    'items' => [
                        [
                            'icon' => 'Users',
                            'value' => '1500+',
                            'label' => 'Bisnis Aktif',
                            'color' => 'text-blue-500'
                        ],
                        [
                            'icon' => 'Award',
                            'value' => '5+',
                            'label' => 'Tahun Beroperasi',
                            'color' => 'text-green-500'
                        ],
                        [
                            'icon' => 'Target',
                            'value' => '25+',
                            'label' => 'Jenis Industri',
                            'color' => 'text-purple-500'
                        ],
                        [
                            'icon' => 'CheckCircle2',
                            'value' => '99.9%',
                            'label' => 'Platform Uptime',
                            'color' => 'text-primary'
                        ]
                    ]
                ],
                'whyChooseUs' => [
                    'enabled' => true,
                    'title' => 'Mengapa Memilih CanvaStencil?',
                    'items' => [
                        [
                            'title' => 'Support 24/7',
                            'description' => 'Tim support yang selalu siap membantu Anda kapan saja melalui live chat, email, dan telepon.'
                        ],
                        [
                            'title' => 'Platform Stabil',
                            'description' => 'Infrastruktur cloud yang handal dengan uptime 99.9% dan kecepatan loading optimal.'
                        ],
                        [
                            'title' => 'Mudah Digunakan',
                            'description' => 'Interface intuitif yang mudah dipelajari, cocok untuk pemula maupun yang berpengalaman.'
                        ]
                    ]
                ],
                'cta' => [
                    [
                        'type' => 'primary',
                        'enabled' => true,
                        'title' => 'Siap Memulai Website Bisnis Anda?',
                        'subtitle' => 'Hubungi tim support kami untuk konsultasi gratis dan demo platform.',
                        'buttons' => [
                            [
                                'text' => 'Mulai Gratis',
                                'link' => '/register',
                                'variant' => 'default'
                            ],
                            [
                                'text' => 'Request Demo',
                                'link' => '/demo',
                                'variant' => 'outline'
                            ]
                        ],
                        'stats' => [
                            [
                                'value' => '1500+',
                                'label' => 'Bisnis Aktif'
                            ],
                            [
                                'value' => '5+',
                                'label' => 'Tahun Beroperasi'
                            ],
                            [
                                'value' => '99.9%',
                                'label' => 'Platform Uptime'
                            ]
                        ]
                    ],
                    [
                        'type' => 'secondary',
                        'enabled' => true,
                        'title' => 'Butuh Bantuan Lebih Lanjut?',
                        'subtitle' => 'Tim support kami siap membantu Anda 24/7 melalui berbagai channel komunikasi',
                        'buttons' => [
                            [
                                'text' => 'Live Chat Support',
                                'link' => '/support',
                                'variant' => 'default'
                            ]
                        ]
                    ]
                ],
                'seo' => [
                    'title' => 'Hubungi CanvaStencil - Support & Customer Service 24/7',
                    'description' => 'Hubungi tim support CanvaStencil untuk bantuan platform, konsultasi gratis, atau demo. Support 24/7 via chat, email, dan telepon.',
                    'keywords' => ['kontak canvastencil', 'support cms platform', 'bantuan website builder', 'customer service'],
                    'ogImage' => '/images/og-image-contact-platform.jpg'
                ]
            ]
        ];
    }

    /**
     * Get FAQ page content with complete schema
     */
    private function getFaqPageContent(): array
    {
        return [
            'title' => 'FAQ - Pertanyaan Seputar Platform CanvaStencil',
            'description' => 'Temukan jawaban untuk pertanyaan umum seputar platform CMS CanvaStencil. Informasi lengkap tentang fitur, pricing, setup, dan support.',
            'content' => [
                'hero' => [
                    'title' => 'Frequently Asked Questions',
                    'subtitle' => 'Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang platform CanvaStencil. Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi tim support kami.'
                ],
                'categories' => [
                    [
                        'id' => 'general',
                        'enabled' => true,
                        'category' => 'Platform & Fitur',
                        'icon' => 'HelpCircle',
                        'questions' => [
                            [
                                'q' => 'Apa itu CanvaStencil dan apa keunggulannya?',
                                'a' => 'CanvaStencil adalah platform CMS multi-tenant yang memungkinkan bisnis dari berbagai industri mengelola website mereka dengan mudah. Platform ini dilengkapi drag-and-drop builder, template responsive, sistem e-commerce, dan fitur SEO otomatis. Tidak perlu keahlian coding untuk membuat website profesional.'
                            ],
                            [
                                'q' => 'Berapa lama waktu setup website setelah mendaftar?',
                                'a' => 'Website Anda bisa online dalam hitungan menit! Setelah mendaftar, Anda langsung mendapat akses ke dashboard admin dan bisa memilih template. Proses kustomisasi konten rata-rata membutuhkan 1-2 jam untuk website sederhana, dan 1-2 hari untuk website e-commerce yang kompleks.'
                            ],
                            [
                                'q' => 'Apakah ada batasan jumlah produk atau halaman?',
                                'a' => 'Tidak ada batasan jumlah halaman pada semua paket. Untuk produk e-commerce: Paket Basic (100 produk), Paket Professional (1000 produk), Paket Enterprise (unlimited produk). Semua paket mendukung unlimited bandwidth dan storage yang reasonable.'
                            ],
                            [
                                'q' => 'Bisakah saya migrasi website yang sudah ada?',
                                'a' => 'Ya! Tim support kami akan membantu proses migrasi konten dari platform lain seperti WordPress, Shopify, atau website statis. Layanan migrasi gratis untuk paket Professional dan Enterprise, atau tersedia dengan biaya tambahan untuk paket Basic.'
                            ]
                        ]
                    ],
                    [
                        'id' => 'pricing',
                        'enabled' => true,
                        'category' => 'Pricing & Billing',
                        'icon' => 'CreditCard',
                        'questions' => [
                            [
                                'q' => 'Berapa biaya berlangganan platform CanvaStencil?',
                                'a' => 'Kami menawarkan 3 paket: Basic (Rp 99.000/bulan) untuk website sederhana, Professional (Rp 299.000/bulan) untuk bisnis berkembang dengan fitur e-commerce, dan Enterprise (Rp 599.000/bulan) untuk bisnis besar dengan kebutuhan khusus. Ada trial gratis 14 hari untuk semua paket.'
                            ],
                            [
                                'q' => 'Apakah ada biaya setup atau biaya tersembunyi?',
                                'a' => 'Tidak ada biaya setup! Harga yang tertera sudah mencakup semua fitur, hosting, SSL certificate, dan customer support 24/7. Biaya tambahan hanya berlaku untuk premium templates (opsional) atau jasa migrasi untuk paket Basic.'
                            ],
                            [
                                'q' => 'Bisakah upgrade atau downgrade paket kapan saja?',
                                'a' => 'Ya! Anda bisa upgrade atau downgrade paket kapan saja melalui dashboard billing. Untuk upgrade, fitur baru langsung aktif. Untuk downgrade, akan berlaku di periode billing berikutnya. Tidak ada penalty atau biaya tambahan untuk perubahan paket.'
                            ],
                            [
                                'q' => 'Metode pembayaran apa saja yang diterima?',
                                'a' => 'Kami menerima berbagai metode pembayaran: Transfer Bank, Virtual Account (BCA, Mandiri, BNI, BRI), E-wallet (OVO, GoPay, Dana, LinkAja), dan Credit Card (Visa, MasterCard). Pembayaran bisa bulanan atau tahunan (diskon 20% untuk annual plan).'
                            ]
                        ]
                    ],
                    [
                        'id' => 'technical',
                        'enabled' => true,
                        'category' => 'Teknis & Keamanan',
                        'icon' => 'Shield',
                        'questions' => [
                            [
                                'q' => 'Seberapa aman data bisnis saya di platform ini?',
                                'a' => 'Keamanan data adalah prioritas utama kami. Semua data dienkripsi dengan SSL 256-bit, server berlokasi di data center tier-3 dengan sertifikasi ISO 27001, backup harian otomatis, dan monitoring 24/7. Kami juga compliant dengan regulasi perlindungan data personal.'
                            ],
                            [
                                'q' => 'Apakah website saya akan loading cepat?',
                                'a' => 'Ya! Platform kami menggunakan CDN global, server SSD high-performance, dan optimasi otomatis untuk gambar dan code. Rata-rata loading time website di bawah 3 detik. Semua template sudah dioptimasi untuk performance dan SEO.'
                            ],
                            [
                                'q' => 'Bagaimana dengan backup dan recovery data?',
                                'a' => 'Sistem backup otomatis setiap hari dengan multiple retention (harian 30 hari, mingguan 12 minggu, bulanan 12 bulan). Point-in-time recovery tersedia untuk paket Professional ke atas. Anda juga bisa melakukan manual backup kapan saja melalui dashboard.'
                            ],
                            [
                                'q' => 'Apakah platform mendukung custom domain?',
                                'a' => 'Ya! Semua paket mendukung custom domain. Paket Basic mendapat 1 domain, Professional 3 domain, Enterprise unlimited. SSL certificate gratis untuk semua domain. Kami juga menyediakan panduan lengkap untuk setting DNS dan domain pointing.'
                            ]
                        ]
                    ],
                    [
                        'id' => 'support',
                        'enabled' => true,
                        'category' => 'Support & Training',
                        'icon' => 'MessageCircle',
                        'questions' => [
                            [
                                'q' => 'Bagaimana cara mendapat bantuan jika kesulitan?',
                                'a' => 'Tim support kami tersedia 24/7 melalui live chat, WhatsApp, email, dan ticketing system. Kami juga menyediakan knowledge base lengkap, video tutorial, dan webinar mingguan untuk training. Response time rata-rata under 2 jam.'
                            ],
                            [
                                'q' => 'Apakah ada training untuk menggunakan platform?',
                                'a' => 'Ya! Kami menyediakan onboarding session gratis untuk semua pengguna baru, webinar mingguan, video tutorial step-by-step, dan knowledge base yang comprehensive. Untuk Enterprise customers, tersedia dedicated training dan account manager.'
                            ],
                            [
                                'q' => 'Bisakah tim CanvaStencil membantu setup website saya?',
                                'a' => 'Tentu! Untuk paket Professional dan Enterprise, kami menyediakan assisted setup gratis termasuk content migration, template customization, dan basic SEO setup. Untuk paket Basic, layanan setup tersedia dengan biaya tambahan yang terjangkau.'
                            ],
                            [
                                'q' => 'Bagaimana jika saya ingin cancel subscription?',
                                'a' => 'Anda bisa cancel subscription kapan saja tanpa penalty melalui dashboard billing atau hubungi support. Tidak ada kontrak binding, dan Anda tetap bisa akses website hingga periode billing berakhir. Data Anda akan disimpan 30 hari setelah cancel untuk kemungkinan reactivation.'
                            ]
                        ]
                    ],

                ],
                'cta' => [
                    'enabled' => true,
                    'title' => 'Masih Ada Pertanyaan?',
                    'subtitle' => 'Tim support CanvaStencil siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami melalui live chat, WhatsApp, atau email untuk konsultasi gratis.',
                    'buttons' => [
                        [
                            'text' => 'Live Chat Support',
                            'link' => '/support',
                            'variant' => 'default'
                        ],
                        [
                            'text' => 'Hubungi Support',
                            'link' => '/contact',
                            'variant' => 'outline'
                        ]
                    ]
                ],
                'seo' => [
                    'title' => 'FAQ - Pertanyaan Seputar Platform CanvaStencil CMS',
                    'description' => 'Temukan jawaban untuk pertanyaan umum seputar platform CMS CanvaStencil. Informasi lengkap tentang fitur, pricing, setup, dan support.',
                    'keywords' => ['faq canvastencil', 'pertanyaan cms platform', 'info website builder', 'bantuan platform'],
                    'ogImage' => '/images/og-image-faq-platform.jpg'
                ]
            ]
        ];
    }

    /**
     * Get sort order for page based on slug
     */
    private function getSortOrder(string $slug): int
    {
        $orders = [
            'home' => 1,
            'about' => 2,
            'contact' => 3,
            'faq' => 4
        ];
        
        return $orders[$slug] ?? 999;
    }
}