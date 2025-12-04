<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Multi-tenant API routes for the CanvaStack Stencil platform.
| Routes are organized by account type:
| - Account A (Platform): Platform management, tenant oversight, analytics
| - Account B (Tenant): Business operations, customer/product management
|
*/

// Authentication & User Info
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'account_type' => $user instanceof \App\Infrastructure\Persistence\Eloquent\AccountEloquentModel ? 'platform' : 'tenant',
        'tenant_id' => $user->tenant_id ?? null,
    ]);
});

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'version' => '1.0.0',
        'environment' => app()->environment()
    ]);
});

// Authentication Routes (Both Account A & B)
require __DIR__.'/auth.php';

// Platform Routes (Account A)
require __DIR__.'/platform.php';

// Tenant Routes (Account B)
Route::prefix('tenant')->group(function () {
    require __DIR__.'/tenant.php';
});

// Public API (No authentication required)
Route::prefix('public')->group(function () {
    // Tenant discovery by domain
    Route::get('/tenant/discover', function (Request $request) {
        $domain = $request->get('domain');
        
        if (!$domain) {
            return response()->json(['error' => 'Domain parameter required'], 400);
        }
        
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('domain', $domain)
            ->orWhere('slug', $domain)
            ->first();
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }
        
        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $tenant->domain,
            'status' => $tenant->status,
        ]);
    });
    
    // Platform content for anonymous users (using mock data structure temporarily)
    Route::prefix('content')->group(function () {
        Route::get('/pages/{slug}', function ($slug) {
            $mockDataStructures = [
                'home' => [
                    'id' => 'page-home-1',
                    'pageSlug' => 'home',
                    'content' => [
                        'hero' => [
                            'title' => [
                                'static' => 'Presisi Artistik, Kualitas Teruji',
                                'typing' => [
                                    'Presisi Artistik, Kualitas Teruji',
                                    'Partner Terpercaya, Solusi Bisnis Anda',
                                    'Hasil Memuaskan, Sesuai Ekspektasi Anda'
                                ]
                            ],
                            'subtitle' => 'Layanan profesional, cepat, dan berkualitas tinggi untuk kebutuhan bisnis dan personal Anda.',
                            'carousel' => [
                                'images' => [
                                    '/images/hero/etching-1.jpg',
                                    '/images/hero/etching-2.jpg',
                                    '/images/hero/etching-3.jpg'
                                ],
                                'autoPlayInterval' => 5000,
                                'showPauseButton' => true
                            ],
                            'buttons' => [
                                'primary' => [
                                    'text' => 'Lihat Layanan Kami',
                                    'link' => '/products',
                                    'icon' => 'ArrowRight'
                                ],
                                'secondary' => [
                                    'text' => 'Hubungi Konsultan',
                                    'link' => '/contact',
                                    'icon' => 'Phone'
                                ]
                            ]
                        ],
                        'socialProof' => [
                            'enabled' => true,
                            'title' => 'Partner yang diandalkan oleh para mitra bisnis',
                            'subtitle' => 'Lebih dari 2000+ proyek telah diselesaikan dengan menjaga kepuasan mitra bisnis kami',
                            'stats' => [
                                [
                                    'icon' => 'Users',
                                    'value' => '2000+',
                                    'label' => 'Proyek Selesai',
                                    'color' => 'text-blue-500'
                                ],
                                [
                                    'icon' => 'Target',
                                    'value' => '500+',
                                    'label' => 'Klien Puas',
                                    'color' => 'text-green-500'
                                ],
                                [
                                    'icon' => 'Award',
                                    'value' => '10+',
                                    'label' => 'Tahun Pengalaman',
                                    'color' => 'text-purple-500'
                                ],
                                [
                                    'icon' => 'CheckCircle2',
                                    'value' => '15+',
                                    'label' => 'Jangkauan Layanan di berbagai daerah',
                                    'color' => 'text-primary'
                                ]
                            ]
                        ],
                        'process' => [
                            'enabled' => true,
                            'title' => 'Proses kerja yang teliti dan efisien',
                            'subtitle' => 'Dari konsultasi, pengerjaan produk hingga pengiriman, mengutamakan kualitas dan kepuasan mitra bisnis',
                            'steps' => [
                                [
                                    'icon' => 'MessageSquare',
                                    'title' => 'Konsultasi Desain',
                                    'description' => 'Diskusikan ide Anda dengan tim ahli kami'
                                ],
                                [
                                    'icon' => 'Zap',
                                    'title' => 'Produksi Presisi',
                                    'description' => 'Proses etching dilakukan secara teliti untuk kualitas terbaik'
                                ],
                                [
                                    'icon' => 'ClipboardCheck',
                                    'title' => 'Quality Control',
                                    'description' => 'Pemeriksaan kualitas produk sesuai dengan barang pesanan'
                                ],
                                [
                                    'icon' => 'Package',
                                    'title' => 'Pengiriman Aman',
                                    'description' => 'Pengemasan aman dan pengiriman tepat waktu'
                                ]
                            ],
                            'preview' => [
                                'enabled' => true,
                                'title' => 'Preview: Dashboard Pelacakan Pesanan',
                                'features' => [
                                    'Lacak status pesanan real-time',
                                    'Lihat riwayat transaksi',
                                    'Kelola desain dan spesifikasi'
                                ],
                                'button' => [
                                    'text' => 'Daftar untuk Update Peluncuran',
                                    'link' => '/register'
                                ]
                            ]
                        ],
                        'whyChooseUs' => [
                            'enabled' => true,
                            'title' => 'Mengapa Memilih Layanan Etching Kami?',
                            'subtitle' => 'Komitmen kami untuk memberikan layanan terbaik dengan mengutamakan kepuasan mitra bisnis',
                            'items' => [
                                [
                                    'icon' => 'Zap',
                                    'title' => 'Presisi',
                                    'description' => 'Presisi menjadi fondasi utama dalam setiap proses etching yang kami lakukan.',
                                    'color' => 'orange'
                                ],
                                [
                                    'icon' => 'Layers',
                                    'title' => 'Material Berkualitas',
                                    'description' => 'Pilihan material premium mulai dari stainless steel, kuningan, hingga akrilik berkualitas tinggi.',
                                    'color' => 'blue'
                                ],
                                [
                                    'icon' => 'Palette',
                                    'title' => 'Kustomisasi Produk',
                                    'description' => 'Tim desainer kami siap membantu mewujudkan ide kustom Anda, dari konsep hingga produk jadi.',
                                    'color' => 'purple'
                                ]
                            ]
                        ],
                        'achievements' => [
                            'enabled' => true,
                            'title' => 'Standar Kualitas dan Sertifikasi',
                            'items' => [
                                [
                                    'icon' => 'Shield',
                                    'title' => 'Sertifikasi ISO 9001:2015',
                                    'description' => 'Komitmen kami pada manajemen kualitas standar internasional untuk setiap proyek yang kami tangani.',
                                    'color' => 'blue'
                                ],
                                [
                                    'icon' => 'Award',
                                    'title' => 'Pemenang Desain Award 2024',
                                    'description' => 'Pengakuan atas inovasi dan kualitas desain produk etching kami di tingkat nasional.',
                                    'color' => 'purple'
                                ]
                            ]
                        ],
                        'services' => [
                            'enabled' => true,
                            'title' => 'Layanan Unggulan Kami',
                            'subtitle' => 'Memberikan berbagai layanan etching berkualitas tinggi untuk kebutuhan personal dan industri',
                            'items' => [
                                [
                                    'icon' => 'Package',
                                    'title' => 'Etching Product',
                                    'description' => 'Layanan etching presisi tinggi untuk komponen industri dan manufaktur'
                                ],
                                [
                                    'icon' => 'Award',
                                    'title' => 'Plakat & Trophy',
                                    'description' => 'Desain dan produksi plakat penghargaan dengan detail menakjubkan'
                                ],
                                [
                                    'icon' => 'MessageSquare',
                                    'title' => 'Konsultasi Desain',
                                    'description' => 'Bantuan profesional untuk mewujudkan desain impian Anda'
                                ],
                                [
                                    'icon' => 'Shield',
                                    'title' => 'Kualitas Produk',
                                    'description' => 'Memastikan aspek pengerjaannya memenuhi standar kepuasan mitra bisnis'
                                ],
                                [
                                    'icon' => 'Palette',
                                    'title' => 'Terpercaya & Diandalkan',
                                    'description' => 'Komitmen kami untuk memberikan kualitas produk yang sesuai untuk menjaga relasi bisnis yang berkelanjutan'
                                ],
                                [
                                    'icon' => 'Layers',
                                    'title' => 'Jangkauan Layanan',
                                    'description' => 'Menyediakan layanan pengiriman ke berbagai daerah'
                                ]
                            ]
                        ],
                        'cta' => [
                            [
                                'type' => 'primary',
                                'title' => 'Siap Mewujudkan Proyek Anda?',
                                'subtitle' => 'Diskusikan kebutuhan Anda dengan tim kami dan dapatkan penawaran gratis hari ini',
                                'stats' => [
                                    [
                                        'value' => '1000+',
                                        'label' => 'Products'
                                    ],
                                    [
                                        'value' => '15+',
                                        'label' => 'Tahun Pengalaman'
                                    ],
                                    [
                                        'value' => '98%',
                                        'label' => 'Tingkat Kepuasan'
                                    ]
                                ],
                                'buttons' => [
                                    [
                                        'text' => 'Hubungi Kami',
                                        'icon' => 'MessageSquare',
                                        'link' => '/contact',
                                        'variant' => 'default',
                                        'className' => 'bg-[#475569] hover:bg-[#334155]'
                                    ],
                                    [
                                        'text' => 'Lihat Produk Kami',
                                        'icon' => 'Target',
                                        'link' => '/products',
                                        'variant' => 'outline',
                                        'className' => 'border-2 border-[#fbbf24] bg-transparent text-white hover:bg-white/10'
                                    ]
                                ],
                                'background' => 'bg-gradient-to-r from-[#f59e0b] to-[#f97316]'
                            ],
                            [
                                'type' => 'secondary',
                                'title' => 'Punya Pertanyaan atau Siap Memulai?',
                                'subtitle' => 'Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda',
                                'buttons' => [
                                    [
                                        'text' => 'Hubungi Tim Kami',
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
                            'title' => 'Apa Kata Klien Kami',
                            'subtitle' => 'Testimoni dari klien yang puas dengan layanan kami',
                            'items' => [
                                [
                                    'name' => 'Budi Santoso',
                                    'role' => 'Owner',
                                    'company' => 'CV. Maju Bersama',
                                    'content' => 'Hasil etching sangat memuaskan! Detail logo perusahaan kami tercetak sempurna di plakat kristal. Tim sangat profesional dan responsif.',
                                    'rating' => 5,
                                    'image' => '/images/testimonials/client-1.jpg'
                                ],
                                [
                                    'name' => 'Siti Nurhaliza',
                                    'role' => 'Manager HRD',
                                    'company' => 'PT. Sejahtera Abadi',
                                    'content' => 'Sudah beberapa kali order untuk kebutuhan corporate gift. Kualitas konsisten bagus, harga kompetitif, dan pengerjaan cepat. Highly recommended!',
                                    'rating' => 5,
                                    'image' => '/images/testimonials/client-2.jpg'
                                ],
                                [
                                    'name' => 'Ahmad Wijaya',
                                    'role' => 'Event Organizer',
                                    'company' => 'AW Events',
                                    'content' => 'Partner terpercaya untuk pembuatan trophy dan plakat event kami. Hasilnya selalu memuaskan dan tepat waktu. Terima kasih!',
                                    'rating' => 5,
                                    'image' => '/images/testimonials/client-3.jpg'
                                ]
                            ]
                        ],
                        'seo' => [
                            'title' => 'Jasa Etching Profesional - Logam, Kaca, Kristal | Etching ID',
                            'description' => 'Layanan laser etching profesional untuk logam, kaca, kristal, dan berbagai material. Hasil presisi tinggi, pengerjaan cepat, harga kompetitif. Konsultasi gratis!',
                            'keywords' => [
                                'jasa etching',
                                'laser etching',
                                'etching logam',
                                'etching kaca',
                                'etching kristal',
                                'plakat etching',
                                'trophy custom',
                                'corporate gift'
                            ],
                            'ogImage' => '/images/og-image-home.jpg'
                        ]
                    ],
                    'status' => 'published',
                    'publishedAt' => '2025-01-04T00:00:00Z',
                    'version' => 1,
                    'previousVersion' => null,
                    'createdAt' => '2025-01-04T00:00:00Z',
                    'updatedAt' => now()->toISOString(),
                    'updatedBy' => null
                ],
                'about' => [
                    'id' => 'page-about-1',
                    'pageSlug' => 'about',
                    'content' => [
                        'hero' => [
                            'title' => 'Tentang Kami',
                            'subtitle' => 'Pionir teknologi laser etching di Indonesia dengan pengalaman lebih dari 15 tahun',
                            'image' => '/images/about/company-hero.jpg'
                        ],
                        'company' => [
                            'enabled' => true,
                            'title' => 'Profil Perusahaan',
                            'description' => 'Kami adalah perusahaan yang berfokus pada layanan laser etching profesional untuk berbagai kebutuhan industri dan personal. Dengan teknologi terkini dan tim yang berpengalaman, kami berkomitmen memberikan hasil terbaik untuk setiap proyek.',
                            'founded' => '2008',
                            'location' => 'Jakarta, Indonesia',
                            'employees' => '50+',
                            'clients' => '300+'
                        ],
                        'mission' => [
                            'enabled' => true,
                            'title' => 'Visi & Misi Kami',
                            'items' => [
                                [
                                    'icon' => 'Target',
                                    'title' => 'VISI',
                                    'description' => 'Menjadi perusahaan yang menghadirkan karya presisi tinggi dengan sentuhan seni dan teknologi, memberikan nilai estetika dan kualitas terbaik untuk kepuasan setiap pelanggan'
                                ],
                                [
                                    'icon' => 'Lightbulb',
                                    'title' => 'MISI',
                                    'description' => '1. Membangun kepercayaan konsumen melalui hasil kerja presisi, detail, dan ketepatan waktu. \n2. Mengembangkan desain etching yang inovatif untuk memenuhi kebutuhan personalisasi dan industri kreatif. \n3. Menjalin kemitraan strategis dengan pelaku industri untuk memperluas jangkauan pasar dan meningkatkan daya saing.'
                                ]
                            ]
                        ],
                        'values' => [
                            'enabled' => true,
                            'title' => 'Nilai-Nilai Kami',
                            'items' => [
                                'Kami percaya bahwa setiap detail menentukan hasil akhir. Karena itu, presisi menjadi fondasi utama dalam setiap proses etching yang kami lakukan — dari desain hingga hasil jadi.',
                                'Kami membangun kepercayaan melalui kejujuran, transparansi, dan kerja sama erat antara tim internal, mitra, dan pelanggan kami.',
                                'Kami tidak hanya ingin memenuhi kebutuhan, tetapi juga memberikan pengalaman yang menyenangkan, hasil yang menginspirasi, dan layanan yang terpercaya.'
                            ]
                        ],
                        'team' => [
                            'enabled' => true,
                            'title' => 'Tim Profesional',
                            'subtitle' => 'Didukung oleh tim ahli berpengalaman di bidangnya',
                            'members' => [
                                [
                                    'name' => 'John Doe',
                                    'role' => 'CEO & Founder',
                                    'image' => '/images/team/ceo.jpg',
                                    'bio' => 'Pengalaman 20+ tahun di industri laser etching'
                                ],
                                [
                                    'name' => 'Jane Smith',
                                    'role' => 'Technical Director',
                                    'image' => '/images/team/technical-director.jpg',
                                    'bio' => 'Spesialis teknologi laser dengan sertifikasi internasional'
                                ],
                                [
                                    'name' => 'Ahmad Rahman',
                                    'role' => 'Production Manager',
                                    'image' => '/images/team/production-manager.jpg',
                                    'bio' => 'Expert dalam quality control dan production management'
                                ]
                            ]
                        ],
                        'timeline' => [
                            'enabled' => true,
                            'title' => 'Perjalanan Kami',
                            'events' => [
                                [
                                    'year' => '2008',
                                    'title' => 'Pendirian Perusahaan',
                                    'description' => 'Memulai bisnis dengan 1 mesin laser etching'
                                ],
                                [
                                    'year' => '2012',
                                    'title' => 'Ekspansi Fasilitas',
                                    'description' => 'Membuka fasilitas produksi baru dengan 5 mesin'
                                ],
                                [
                                    'year' => '2018',
                                    'title' => 'Sertifikasi ISO',
                                    'description' => 'Mendapatkan sertifikasi ISO 9001:2015'
                                ],
                                [
                                    'year' => '2023',
                                    'title' => 'Teknologi Terkini',
                                    'description' => 'Investasi mesin laser fiber generasi terbaru'
                                ]
                            ]
                        ],
                        'certifications' => [
                            'enabled' => true,
                            'title' => 'Sertifikasi & Penghargaan',
                            'items' => [
                                [
                                    'name' => 'ISO 9001:2015',
                                    'description' => 'Quality Management System',
                                    'image' => '/images/certifications/iso-9001.jpg'
                                ],
                                [
                                    'name' => 'Best Etching Service 2024',
                                    'description' => 'Indonesia Manufacturing Awards',
                                    'image' => '/images/certifications/award-2024.jpg'
                                ]
                            ]
                        ],
                        'cta' => [
                            [
                                'type' => 'primary',
                                'title' => 'Siap Mewujudkan Proyek Etching Anda?',
                                'subtitle' => 'Konsultasikan kebutuhan etching Anda sekarang juga dengan tim profesional kami',
                                'buttons' => [
                                    [
                                        'text' => 'Mulai Konsultasi Gratis',
                                        'link' => '/contact',
                                        'variant' => 'default'
                                    ],
                                    [
                                        'text' => 'Lihat Portfolio',
                                        'link' => '/products',
                                        'variant' => 'outline'
                                    ]
                                ],
                                'stats' => [
                                    [
                                        'value' => '1000+',
                                        'label' => 'Products'
                                    ],
                                    [
                                        'value' => '15+',
                                        'label' => 'Tahun Pengalaman'
                                    ]
                                ],
                                'background' => 'bg-gradient-to-r from-navy to-purple-600'
                            ]
                        ],
                        'seo' => [
                            'title' => 'Tentang Kami - Etching Profesional Indonesia',
                            'description' => 'Pionir laser etching di Indonesia sejak 2008. Tim profesional dengan pengalaman 15+ tahun, sertifikasi ISO 9001:2015, dan teknologi terkini.',
                            'keywords' => ['tentang perusahaan etching', 'profil perusahaan laser', 'tim etching profesional'],
                            'ogImage' => '/images/og-image-about.jpg'
                        ]
                    ],
                    'status' => 'published',
                    'publishedAt' => '2025-01-04T00:00:00Z',
                    'version' => 1,
                    'previousVersion' => null,
                    'createdAt' => '2025-01-04T00:00:00Z',
                    'updatedAt' => now()->toISOString(),
                    'updatedBy' => null
                ],
                'contact' => [
                    'id' => 'page-contact-1',
                    'pageSlug' => 'contact',
                    'content' => [
                        'hero' => [
                            'title' => 'Hubungi Kami',
                            'subtitle' => 'Tim kami siap membantu mewujudkan proyek etching Anda'
                        ],
                        'contactInfo' => [
                            'enabled' => true,
                            'items' => [
                                [
                                    'icon' => 'MapPin',
                                    'title' => 'Alamat',
                                    'content' => 'Jl. Industri Raya No. 123, Jakarta Selatan 12345, Indonesia'
                                ],
                                [
                                    'icon' => 'Phone',
                                    'title' => 'Telepon',
                                    'content' => '+62 21 1234 5678'
                                ],
                                [
                                    'icon' => 'Mail',
                                    'title' => 'Email',
                                    'content' => 'info@etching-id.com'
                                ],
                                [
                                    'icon' => 'Clock',
                                    'title' => 'Jam Operasional',
                                    'content' => 'Senin - Jumat: 08:00 - 17:00 WIB\nSabtu: 08:00 - 12:00 WIB'
                                ]
                            ]
                        ],
                        'form' => [
                            'enabled' => true,
                            'title' => 'Kirim Pesan',
                            'subtitle' => 'Isi form di bawah ini dan kami akan segera menghubungi Anda',
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
                                    'label' => 'Subjek',
                                    'type' => 'select',
                                    'required' => true,
                                    'options' => [
                                        'Pertanyaan Umum',
                                        'Request Quotation',
                                        'Konsultasi Proyek',
                                        'Komplain',
                                        'Lainnya'
                                    ]
                                ],
                                [
                                    'name' => 'message',
                                    'label' => 'Pesan',
                                    'type' => 'textarea',
                                    'required' => true,
                                    'placeholder' => 'Jelaskan kebutuhan atau pertanyaan Anda...'
                                ]
                            ],
                            'submitButton' => 'Kirim Pesan',
                            'successMessage' => 'Terima kasih! Pesan Anda telah terkirim. Kami akan menghubungi Anda segera.'
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
                                    'title' => 'WhatsApp',
                                    'description' => 'Chat langsung dengan tim kami',
                                    'link' => 'https://wa.me/6281234567890',
                                    'buttonText' => 'Chat WhatsApp'
                                ],
                                [
                                    'icon' => 'Phone',
                                    'title' => 'Telepon',
                                    'description' => 'Hubungi customer service kami',
                                    'link' => 'tel:+622112345678',
                                    'buttonText' => 'Telepon Sekarang'
                                ]
                            ]
                        ],
                        'achievements' => [
                            'enabled' => true,
                            'title' => 'Pencapaian Kami',
                            'subtitle' => 'Kepercayaan yang telah diberikan selama bertahun-tahun',
                            'items' => [
                                [
                                    'icon' => 'Users',
                                    'value' => '2000+',
                                    'label' => 'Proyek Selesai',
                                    'color' => 'text-blue-500'
                                ],
                                [
                                    'icon' => 'Award',
                                    'value' => '10+',
                                    'label' => 'Tahun Pengalaman',
                                    'color' => 'text-green-500'
                                ],
                                [
                                    'icon' => 'Target',
                                    'value' => '500+',
                                    'label' => 'Klien Puas',
                                    'color' => 'text-purple-500'
                                ],
                                [
                                    'icon' => 'CheckCircle2',
                                    'value' => '99%',
                                    'label' => 'Tingkat Presisi',
                                    'color' => 'text-primary'
                                ]
                            ]
                        ],
                        'whyChooseUs' => [
                            'enabled' => true,
                            'title' => 'Mengapa Memilih Kami?',
                            'items' => [
                                [
                                    'title' => 'Kualitas Terjamin',
                                    'description' => 'Semua produk telah melalui quality control ketat dan memiliki sertifikasi resmi dari lembaga terpercaya.'
                                ],
                                [
                                    'title' => 'Tim Ahli Berpengalaman',
                                    'description' => 'Didukung oleh tim ahli akuakultur dengan pengalaman puluhan tahun di industri perikanan.'
                                ],
                                [
                                    'title' => 'Layanan Prima',
                                    'description' => 'Konsultasi gratis, dukungan teknis 24/7, dan garansi kepuasan untuk semua pelanggan.'
                                ]
                            ]
                        ],
                        'cta' => [
                            [
                                'type' => 'primary',
                                'title' => 'Siap Mewujudkan Proyek Anda?',
                                'subtitle' => 'Diskusikan kebutuhan Anda dengan tim kami dan dapatkan penawaran gratis hari ini.',
                                'buttons' => [
                                    [
                                        'text' => 'Hubungi Kami',
                                        'link' => '/contact',
                                        'variant' => 'default'
                                    ],
                                    [
                                        'text' => 'Lihat Produk Kami',
                                        'link' => '/products',
                                        'variant' => 'outline'
                                    ]
                                ],
                                'stats' => [
                                    [
                                        'value' => '1000+',
                                        'label' => 'Products'
                                    ],
                                    [
                                        'value' => '15+',
                                        'label' => 'Tahun Pengalaman'
                                    ],
                                    [
                                        'value' => '98%',
                                        'label' => 'Tingkat Kepuasan'
                                    ]
                                ]
                            ],
                            [
                                'type' => 'secondary',
                                'title' => 'Punya Pertanyaan atau Siap Memulai?',
                                'subtitle' => 'Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda',
                                'buttons' => [
                                    [
                                        'text' => 'Hubungi Tim Kami',
                                        'link' => '/contact',
                                        'variant' => 'default'
                                    ]
                                ]
                            ]
                        ],
                        'seo' => [
                            'title' => 'Hubungi Kami - Etching Profesional Indonesia',
                            'description' => 'Hubungi tim profesional kami untuk konsultasi dan informasi layanan laser etching. Response cepat dan layanan ramah. Telepon, email, WhatsApp tersedia.',
                            'keywords' => ['kontak etching', 'hubungi laser etching', 'konsultasi etching'],
                            'ogImage' => '/images/og-image-contact.jpg'
                        ]
                    ],
                    'status' => 'published',
                    'publishedAt' => '2025-01-04T00:00:00Z',
                    'version' => 1,
                    'previousVersion' => null,
                    'createdAt' => '2025-01-04T00:00:00Z',
                    'updatedAt' => now()->toISOString(),
                    'updatedBy' => null
                ],
                'faq' => [
                    'id' => 'page-faq-1',
                    'pageSlug' => 'faq',
                    'content' => [
                        'hero' => [
                            'title' => 'Frequently Asked Questions',
                            'subtitle' => 'Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang layanan etching kami. Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi kami.'
                        ],
                        'categories' => [
                            [
                                'id' => 'general',
                                'category' => 'Umum',
                                'icon' => 'HelpCircle',
                                'questions' => [
                                    [
                                        'q' => 'Apa itu etching dan bagaimana prosesnya?',
                                        'a' => 'Etching adalah proses mengukir desain pada permukaan material seperti metal, kaca, atau kristal menggunakan teknologi laser atau chemical. Proses ini menghasilkan detail yang presisi dan tahan lama. Kami menggunakan teknologi terkini untuk memastikan hasil yang sempurna.'
                                    ],
                                    [
                                        'q' => 'Berapa lama waktu produksi untuk pesanan saya?',
                                        'a' => 'Waktu produksi bervariasi tergantung jenis produk dan kompleksitas desain. Umumnya: Signage dan nameplate (7-14 hari), Award dan plakat (10-21 hari), Panel dekoratif besar (21-45 hari). Kami akan memberikan estimasi waktu yang akurat saat Anda melakukan pemesanan.'
                                    ],
                                    [
                                        'q' => 'Apakah ada minimum order quantity (MOQ)?',
                                        'a' => 'MOQ bervariasi tergantung jenis produk. Untuk award dan plakat custom, MOQ mulai dari 1 pcs. Untuk signage industrial dan nameplate, MOQ mulai dari 10-50 pcs. Silakan hubungi kami untuk informasi MOQ spesifik produk yang Anda inginkan.'
                                    ],
                                    [
                                        'q' => 'Apakah saya bisa melihat sample atau proof sebelum produksi?',
                                        'a' => 'Ya, tentu! Kami menyediakan digital proof/mockup gratis untuk persetujuan Anda sebelum proses produksi dimulai. Untuk physical sample, tersedia dengan biaya tambahan yang akan dikembalikan jika Anda melakukan order.'
                                    ]
                                ]
                            ],
                            [
                                'id' => 'design',
                                'category' => 'Desain & Customization',
                                'icon' => 'Lightbulb',
                                'questions' => [
                                    [
                                        'q' => 'Apakah saya bisa mengirimkan desain sendiri?',
                                        'a' => 'Sangat bisa! Anda dapat mengirimkan desain dalam format vector (AI, EPS, PDF) atau high-resolution image (PNG, JPG minimal 300 DPI). Tim desain kami juga siap membantu menyempurnakan atau membuat desain baru sesuai kebutuhan Anda.'
                                    ],
                                    [
                                        'q' => 'Jenis font apa yang bisa digunakan untuk etching?',
                                        'a' => 'Hampir semua jenis font dapat digunakan, namun kami merekomendasikan font dengan ketebalan minimal 1pt untuk hasil optimal. Font dengan detail terlalu tipis atau kompleks mungkin tidak akan terlihat jelas pada material tertentu. Tim kami akan memberikan saran terbaik.'
                                    ],
                                    [
                                        'q' => 'Apakah bisa menambahkan foto atau gambar kompleks?',
                                        'a' => 'Ya, kami dapat melakukan photo etching untuk reproduksi foto atau gambar kompleks pada metal dan kaca. Hasil terbaik untuk foto dengan kontras yang baik dan resolusi tinggi (minimal 300 DPI). Kami akan melakukan pre-processing untuk optimasi hasil.'
                                    ],
                                    [
                                        'q' => 'Apakah ada batasan ukuran desain?',
                                        'a' => 'Batasan ukuran tergantung material dan metode etching. Untuk detail sangat kecil (dibawah 0.5mm), kami akan merekomendasikan penyesuaian desain. Untuk area besar, kami bisa melakukan sectioning atau panel. Konsultasikan desain Anda dengan tim kami.'
                                    ]
                                ]
                            ],
                            [
                                'id' => 'material',
                                'category' => 'Material & Kualitas',
                                'icon' => 'Package',
                                'questions' => [
                                    [
                                        'q' => 'Material apa saja yang tersedia untuk etching?',
                                        'a' => 'Kami melayani etching untuk berbagai material: Metal (Stainless Steel, Brass, Aluminum, Copper, Titanium), Kaca (Clear, Frosted, Mirror, Crystal), Award Material (Acrylic, Wood, Granite). Setiap material memiliki karakteristik dan keunggulan berbeda.'
                                    ],
                                    [
                                        'q' => 'Apakah hasil etching tahan lama dan anti luntur?',
                                        'a' => 'Ya! Etching adalah proses permanen yang mengubah struktur permukaan material, bukan hanya coating atau print. Hasil etching sangat tahan terhadap weathering, UV, korosi, dan abrasi. Untuk aplikasi outdoor, kami juga menyediakan protective coating tambahan.'
                                    ],
                                    [
                                        'q' => 'Bagaimana cara merawat produk etching?',
                                        'a' => 'Perawatan sangat mudah: Metal - lap dengan kain lembut, hindari abrasive cleaner. Kaca - cuci dengan sabun lembut dan air, dishwasher safe untuk produk tertentu. Award/Plakat - bersihkan dengan microfiber cloth. Kami akan memberikan care instruction spesifik untuk setiap produk.'
                                    ],
                                    [
                                        'q' => 'Apakah produk Anda memiliki sertifikat kualitas?',
                                        'a' => 'Ya, untuk aplikasi industrial dan aerospace, produk kami memenuhi standar internasional dan dilengkapi dengan Certificate of Conformance (CoC). Material yang kami gunakan bersertifikat dan traceable. Kami juga melakukan quality control ketat di setiap tahap produksi.'
                                    ]
                                ]
                            ],
                            [
                                'id' => 'ordering',
                                'category' => 'Pemesanan & Pembayaran',
                                'icon' => 'ShoppingCart',
                                'questions' => [
                                    [
                                        'q' => 'Bagaimana cara melakukan pemesanan?',
                                        'a' => 'Proses pemesanan sangat mudah: 1) Hubungi kami via WhatsApp/Email/Form dengan detail kebutuhan, 2) Konsultasi desain dan material dengan tim kami, 3) Terima quotation dan digital proof, 4) Approve dan lakukan pembayaran, 5) Produksi dimulai, 6) Quality check dan pengiriman.'
                                    ],
                                    [
                                        'q' => 'Apa saja metode pembayaran yang diterima?',
                                        'a' => 'Kami menerima: Transfer Bank (BCA, Mandiri, BNI), Virtual Account, E-wallet (OVO, GoPay, Dana), Credit Card (untuk pemesanan online). Untuk corporate order, tersedia termin pembayaran 30-60 hari setelah approval.'
                                    ],
                                    [
                                        'q' => 'Apakah ada biaya tambahan selain harga produk?',
                                        'a' => 'Harga quotation sudah termasuk: desain/artwork, produksi, dan packaging. Biaya tambahan mungkin berlaku untuk: Physical sample, Revisi desain major (lebih dari 3x), Express production (rush order), Special packaging/gift box, Ongkos kirim (tergantung lokasi).'
                                    ],
                                    [
                                        'q' => 'Bagaimana dengan garansi dan return policy?',
                                        'a' => 'Kami memberikan garansi 100% untuk defect produksi. Jika ada kesalahan dari pihak kami (salah etching, material defect), kami akan remake gratis. Untuk cancel order setelah produksi dimulai, akan dikenakan charge 50%. Kami tidak menerima return untuk custom order kecuali ada defect.'
                                    ]
                                ]
                            ],
                            [
                                'id' => 'shipping',
                                'category' => 'Pengiriman',
                                'icon' => 'Truck',
                                'questions' => [
                                    [
                                        'q' => 'Apakah produk bisa dikirim ke seluruh Indonesia?',
                                        'a' => 'Ya! Kami melayani pengiriman ke seluruh Indonesia melalui ekspedisi terpercaya (JNE, J&T, SiCepat, Grab, GoSend untuk area Jabodetabek). Untuk produk fragile seperti kaca dan crystal, kami gunakan packaging khusus dengan asuransi.'
                                    ],
                                    [
                                        'q' => 'Berapa lama estimasi pengiriman?',
                                        'a' => 'Estimasi pengiriman setelah produksi selesai: Jabodetabek (1-2 hari), Jawa (2-3 hari), Luar Jawa (3-7 hari). Untuk produk besar atau area remote, mungkin memerlukan waktu lebih lama. Kami akan memberikan tracking number untuk monitoring pengiriman.'
                                    ],
                                    [
                                        'q' => 'Apakah ada opsi express delivery?',
                                        'a' => 'Ya, tersedia same day delivery untuk area Jabodetabek (tergantung ketersediaan) dan next day delivery untuk Jawa. Untuk pengiriman express, mohon informasikan saat melakukan order. Biaya tambahan akan berlaku.'
                                    ],
                                    [
                                        'q' => 'Bagaimana jika produk rusak saat pengiriman?',
                                        'a' => 'Semua pengiriman produk fragile (kaca, crystal, award) diasuransikan penuh. Jika terjadi kerusakan, segera foto dan laporkan dalam 1x24 jam setelah penerimaan. Kami akan proses klaim asuransi dan kirim pengganti atau refund sesuai kebijakan.'
                                    ]
                                ]
                            ]
                        ],
                        'cta' => [
                            'title' => 'Masih Ada Pertanyaan?',
                            'subtitle' => 'Tim customer service kami siap membantu Anda 24/7. Jangan ragu untuk menghubungi kami melalui WhatsApp, email, atau form kontak untuk konsultasi gratis.',
                            'buttons' => [
                                [
                                    'text' => 'Chat via WhatsApp',
                                    'link' => 'https://wa.me/6281234567890',
                                    'variant' => 'default'
                                ],
                                [
                                    'text' => 'Email Kami',
                                    'link' => '/contact',
                                    'variant' => 'outline'
                                ]
                            ]
                        ],
                        'seo' => [
                            'title' => 'FAQ - Pertanyaan Seputar Laser Etching | Etching ID',
                            'description' => 'Temukan jawaban untuk pertanyaan umum seputar layanan laser etching. Informasi lengkap tentang proses, harga, material, dan garansi.',
                            'keywords' => ['faq etching', 'pertanyaan laser etching', 'info etching'],
                            'ogImage' => '/images/og-image-faq.jpg'
                        ]
                    ],
                    'status' => 'published',
                    'publishedAt' => '2025-01-04T00:00:00Z',
                    'version' => 1,
                    'previousVersion' => null,
                    'createdAt' => '2025-01-04T00:00:00Z',
                    'updatedAt' => now()->toISOString(),
                    'updatedBy' => null
                ],
                'products' => [
                    'id' => 'page-products-1',
                    'pageSlug' => 'products',
                    'content' => [
                        'hero' => [
                            'title' => [
                                'prefix' => 'Semua',
                                'highlight' => 'Produk'
                            ],
                            'subtitle' => 'Temukan produk etching berkualitas tinggi dengan presisi sempurna.',
                            'typingTexts' => [
                                'Presisi Artistik, Kualitas Teruji',
                                'Partner Terpercaya, Solusi Bisnis Anda'
                            ]
                        ]
                    ],
                    'status' => 'published',
                    'publishedAt' => '2025-01-04T00:00:00Z',
                    'version' => 1,
                    'createdAt' => '2025-01-04T00:00:00Z',
                    'updatedAt' => now()->toISOString()
                ]
            ];
            
            $pageData = $mockDataStructures[$slug] ?? null;
            
            if (!$pageData) {
                return response()->json(['error' => 'Content not found'], 404);
            }
            
            return response()->json($pageData);
        });

        // Products page content
        Route::get('/pages/products', function () {
            return response()->json([
                'id' => 'page-products-1',
                'pageSlug' => 'products',
                'content' => [
                    'hero' => [
                        'title' => [
                            'prefix' => 'Semua',
                            'highlight' => 'Produk',
                            'suffix' => ''
                        ],
                        'subtitle' => 'Temukan produk etching berkualitas tinggi dengan presisi sempurna untuk kebutuhan Anda.',
                        'typingTexts' => [
                            'Presisi Artistik, Kualitas Teruji',
                            'Partner Terpercaya, Solusi Bisnis Anda',
                            'Hasil Memuaskan, Sesuai Ekspektasi Anda'
                        ]
                    ],
                    'informationSection' => [
                        'title' => [
                            'prefix' => 'Layanan',
                            'highlight' => 'Etching',
                            'suffix' => 'Kami'
                        ],
                        'subtitle' => 'Tiga kategori utama produk etching dengan kualitas terbaik dan presisi tinggi',
                        'cards' => [
                            [
                                'title' => 'Etching Logam',
                                'description' => 'Stainless steel, kuningan, tembaga, aluminium untuk berbagai aplikasi industri dan dekorasi.',
                                'features' => ['Presisi tinggi', 'Tahan lama', 'Kustomisasi penuh'],
                                'icon' => '⚙️',
                                'buttonText' => 'Pelajari Lebih Lanjut'
                            ],
                            [
                                'title' => 'Etching Kaca',
                                'description' => 'Kaca tempered, crystal, dan akrilik untuk award, dekorasi, dan aplikasi arsitektural.',
                                'features' => ['Crystal clear', 'Elegan', 'Berbagai ukuran'],
                                'icon' => '💎',
                                'buttonText' => 'Lihat Galeri'
                            ],
                            [
                                'title' => 'Nameplate & Signage',
                                'description' => 'Nameplate profesional dan signage kustom untuk keperluan bisnis dan industrial.',
                                'features' => ['Weather resistant', 'Profesional', 'Custom design'],
                                'icon' => '🏷️',
                                'buttonText' => 'Order Sekarang'
                            ]
                        ]
                    ]
                ],
                'status' => 'published',
                'publishedAt' => '2025-01-04T00:00:00Z',
                'version' => 1,
                'createdAt' => '2025-01-04T00:00:00Z',
                'updatedAt' => now()->toISOString()
            ]);
        });
        
        Route::get('/pages', function () {
            return response()->json([
                ['slug' => 'home', 'title' => 'Home', 'status' => 'published'],
                ['slug' => 'about', 'title' => 'About', 'status' => 'published'],
                ['slug' => 'contact', 'title' => 'Contact', 'status' => 'published'],
                ['slug' => 'products', 'title' => 'Products', 'status' => 'published'],
                ['slug' => 'faq', 'title' => 'FAQ', 'status' => 'published']
            ]);
        });
    });
        
    // Reviews endpoints for public access (anonymous users can view reviews)
    Route::prefix('reviews')->group(function () {
        Route::get('/', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    [
                        'id' => 'rev-1',
                        'productId' => 'prod-1',
                        'customerName' => 'Ahmad Susanto',
                        'customerEmail' => 'ahmad@example.com',
                        'rating' => 5,
                        'title' => 'Kualitas Luar Biasa!',
                        'content' => 'Hasil etching sangat memuaskan! Detail logo perusahaan kami tercetak sempurna di plakat kristal. Tim sangat profesional dan responsif.',
                        'status' => 'approved',
                        'isVerified' => true,
                        'helpfulCount' => 12,
                        'createdAt' => '2024-12-01T10:00:00Z',
                        'updatedAt' => '2024-12-01T10:00:00Z'
                    ],
                    [
                        'id' => 'rev-2',
                        'productId' => 'prod-2',
                        'customerName' => 'Sari Dewi',
                        'customerEmail' => 'sari@example.com',
                        'rating' => 5,
                        'title' => 'Partner Terpercaya',
                        'content' => 'Sudah beberapa kali order untuk kebutuhan corporate gift. Kualitas konsisten bagus, harga kompetitif, dan pengerjaan cepat. Highly recommended!',
                        'status' => 'approved',
                        'isVerified' => true,
                        'helpfulCount' => 8,
                        'createdAt' => '2024-11-28T14:30:00Z',
                        'updatedAt' => '2024-11-28T14:30:00Z'
                    ],
                    [
                        'id' => 'rev-3',
                        'productId' => 'prod-3',
                        'customerName' => 'Budi Hartono',
                        'customerEmail' => 'budi@example.com',
                        'rating' => 4,
                        'title' => 'Selalu Memuaskan',
                        'content' => 'Partner terpercaya untuk pembuatan trophy dan plakat event kami. Hasilnya selalu memuaskan dan tepat waktu. Terima kasih!',
                        'status' => 'approved',
                        'isVerified' => false,
                        'helpfulCount' => 15,
                        'createdAt' => '2024-11-25T09:15:00Z',
                        'updatedAt' => '2024-11-25T09:15:00Z'
                    ]
                ],
                'pagination' => [
                    'total' => 3,
                    'current_page' => 1,
                    'per_page' => 10,
                    'total_pages' => 1
                ]
            ]);
        });

        Route::get('/{id}', function ($id) {
            $mockReviews = [
                'rev-1' => [
                    'id' => 'rev-1',
                    'productId' => 'prod-1',
                    'customerName' => 'Ahmad Susanto',
                    'customerEmail' => 'ahmad@example.com',
                    'rating' => 5,
                    'title' => 'Kualitas Luar Biasa!',
                    'content' => 'Hasil etching sangat memuaskan! Detail logo perusahaan kami tercetak sempurna di plakat kristal. Tim sangat profesional dan responsif.',
                    'status' => 'approved',
                    'isVerified' => true,
                    'helpfulCount' => 12,
                    'createdAt' => '2024-12-01T10:00:00Z',
                    'updatedAt' => '2024-12-01T10:00:00Z'
                ]
            ];

            $review = $mockReviews[$id] ?? null;
            
            if (!$review) {
                return response()->json(['error' => 'Review not found'], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $review
            ]);
        });
    });
    
    // Platform statistics (public facing)
    Route::get('/stats', function () {
        $tenantCount = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('status', 'active')->count();
        
        return response()->json([
            'total_businesses' => $tenantCount,
            'platform_version' => '1.0.0',
            'uptime' => '99.9%'
        ]);
    });
});
