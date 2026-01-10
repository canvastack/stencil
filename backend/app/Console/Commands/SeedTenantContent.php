<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Domain\Content\Services\TenantContentService;
use Illuminate\Support\Facades\DB;

class SeedTenantContent extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:seed-content {tenant_slug?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed initial content pages for tenant (home, about, contact, faq)';

    public function __construct(
        private TenantContentService $tenantContentService
    ) {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tenantSlug = $this->argument('tenant_slug');
        
        if ($tenantSlug) {
            $this->seedTenant($tenantSlug);
        } else {
            $this->info('Seeding content for all tenants...');
            $tenants = TenantEloquentModel::all();
            foreach ($tenants as $tenant) {
                $this->seedTenant($tenant->slug);
            }
        }
        
        $this->info('✅ Tenant content seeding completed!');
    }

    private function seedTenant(string $tenantSlug)
    {
        $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
        
        if (!$tenant) {
            $this->error("❌ Tenant '{$tenantSlug}' not found");
            return;
        }

        $this->info("🌱 Seeding content for tenant: {$tenantSlug}");

        // Switch to tenant schema (replace hyphens with underscores for valid schema name)
        $tenantSchemaName = str_replace('-', '_', $tenant->uuid);
        $tenantSchema = "tenant_{$tenantSchemaName}";
        
        try {
            DB::statement("SET search_path TO {$tenantSchema}, public");
            
            $pages = $this->getInitialPagesData($tenantSlug);
            
            foreach ($pages as $pageData) {
                // Check if page already exists
                $existingPage = $this->tenantContentService->getPageBySlug($pageData['slug']);
                
                if ($existingPage) {
                    $this->line("  ⏭️  Page '{$pageData['slug']}' already exists, skipping...");
                    continue;
                }
                
                // Create the page
                $page = $this->tenantContentService->createPage($pageData);
                $this->line("  ✅ Created page: {$pageData['slug']}");
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Failed to seed content for tenant {$tenantSlug}: " . $e->getMessage());
        } finally {
            DB::statement("SET search_path TO public");
        }
    }

    private function getInitialPagesData(string $tenantSlug): array
    {
        return [
            [
                'title' => 'Home - ' . ucfirst($tenantSlug),
                'slug' => 'home',
                'description' => 'Homepage untuk ' . ucfirst($tenantSlug),
                'status' => 'published',
                'page_type' => 'home',
                'is_homepage' => true,
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
                        ]
                    ],
                    'socialProof' => [
                        'enabled' => true,
                        'title' => 'Partner yang diandalkan oleh para mitra bisnis',
                        'subtitle' => 'Lebih dari 2000+ proyek telah diselesaikan dengan menjaga kepuasan mitra bisnis kami',
                        'stats' => [
                            ['icon' => 'Users', 'value' => '2000+', 'label' => 'Proyek Selesai', 'color' => 'text-blue-500'],
                            ['icon' => 'Target', 'value' => '500+', 'label' => 'Klien Puas', 'color' => 'text-green-500'],
                            ['icon' => 'Award', 'value' => '10+', 'label' => 'Tahun Pengalaman', 'color' => 'text-purple-500']
                        ]
                    ]
                ]
            ],
            [
                'title' => 'About - ' . ucfirst($tenantSlug),
                'slug' => 'about',
                'description' => 'Tentang perusahaan ' . ucfirst($tenantSlug),
                'status' => 'published',
                'page_type' => 'about',
                'content' => [
                    'hero' => [
                        'title' => ['prefix' => 'Tentang', 'highlight' => strtoupper($tenantSlug)],
                        'subtitle' => "Pelajari lebih lanjut tentang {$tenantSlug} dan layanan kami."
                    ],
                    'company' => [
                        'history' => 'Berpengalaman lebih dari 15 tahun dalam industri etching',
                        'vision' => 'Menjadi penyedia layanan etching terdepan',
                        'mission' => 'Memberikan solusi etching terbaik dengan teknologi modern'
                    ]
                ]
            ],
            [
                'title' => 'Contact - ' . ucfirst($tenantSlug),
                'slug' => 'contact',
                'description' => 'Hubungi ' . ucfirst($tenantSlug),
                'status' => 'published',
                'page_type' => 'contact',
                'content' => [
                    'hero' => [
                        'title' => ['prefix' => 'Hubungi', 'highlight' => 'Kami'],
                        'subtitle' => 'Dapatkan konsultasi gratis untuk kebutuhan etching Anda'
                    ],
                    'contactInfo' => [
                        'email' => 'info@' . strtolower($tenantSlug) . '.com',
                        'phone' => '+62 812-3456-7890',
                        'whatsapp' => '+62 812-3456-7890',
                        'address' => 'Jalan Industri No. 123, Jakarta',
                        'operatingHours' => 'Senin - Jumat: 08:00 - 17:00 WIB'
                    ]
                ]
            ],
            [
                'title' => 'FAQ - ' . ucfirst($tenantSlug),
                'slug' => 'faq',
                'description' => 'Frequently Asked Questions untuk ' . ucfirst($tenantSlug),
                'status' => 'published',
                'page_type' => 'faq',
                'content' => [
                    'hero' => [
                        'title' => 'FAQ - Pertanyaan Umum',
                        'subtitle' => 'Temukan jawaban untuk pertanyaan yang sering diajukan'
                    ],
                    'categories' => [
                        [
                            'id' => 'general',
                            'category' => 'Umum',
                            'icon' => 'HelpCircle',
                            'questions' => [
                                ['q' => 'Apa itu etching?', 'a' => 'Etching adalah proses mengukir permukaan material menggunakan teknik kimia atau laser untuk menciptakan desain yang presisi dan tahan lama.'],
                                ['q' => 'Berapa lama waktu pengerjaan?', 'a' => 'Waktu pengerjaan bervariasi tergantung kompleksitas desain dan jumlah order. Umumnya 3-7 hari kerja untuk order standar.'],
                                ['q' => 'Bahan apa saja yang bisa di-etching?', 'a' => 'Kami melayani etching untuk stainless steel, kuningan, tembaga, aluminium, kaca, dan berbagai material lainnya.']
                            ]
                        ]
                    ]
                ]
            ]
        ];
    }
}
