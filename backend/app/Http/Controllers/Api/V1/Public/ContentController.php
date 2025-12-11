<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Domain\Content\Entities\PlatformPage;
use App\Domain\Content\Services\TenantContentService;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ContentController extends Controller
{
    public function __construct(
        private TenantContentService $tenantContentService
    ) {}

    /**
     * Get platform page content for anonymous users
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function getPage(string $slug): JsonResponse
    {
        try {
            // Try to get published platform page by slug from database first
            $page = PlatformPage::where('slug', $slug)
                ->where('status', 'published')
                ->first();

            if ($page) {
                // Format database response to match the expected structure
                $response = [
                    'id' => 'page-' . $slug . '-1',
                    'pageSlug' => $slug,
                    'content' => $page->content,
                    'status' => $page->status,
                    'publishedAt' => $page->published_at?->toISOString(),
                    'version' => 1,
                    'previousVersion' => null,
                    'createdAt' => $page->created_at->toISOString(),
                    'updatedAt' => $page->updated_at->toISOString(),
                    'updatedBy' => null
                ];

                return response()->json($response);
            }

            // Fallback to mock content for common platform pages
            $mockPlatformContent = [
                'about' => [
                    'title' => 'About CanvaStencil',
                    'subtitle' => 'Professional Multi-Tenant CMS Platform',
                    'content' => 'CanvaStencil provides enterprise-grade CMS solutions for modern businesses.',
                    'hero' => [
                        'title' => ['prefix' => 'Tentang', 'highlight' => 'CanvaStencil'],
                        'subtitle' => 'Platform CMS Multi-Tenant Profesional untuk Bisnis Modern',
                        'description' => 'Solusi enterprise terdepan untuk manajemen konten yang scalable.'
                    ]
                ],
                'faq' => [
                    'title' => 'Frequently Asked Questions',
                    'subtitle' => 'Find answers to common questions',
                    'hero' => [
                        'title' => ['prefix' => 'Pertanyaan', 'highlight' => 'Umum'],
                        'subtitle' => 'Temukan jawaban untuk pertanyaan yang sering diajukan',
                    ],
                    'faqs' => [
                        ['question' => 'What is CanvaStencil?', 'answer' => 'A multi-tenant CMS platform for modern businesses.'],
                        ['question' => 'How to get started?', 'answer' => 'Contact our team for consultation and setup.']
                    ]
                ],
                'contact' => [
                    'title' => 'Contact Us',
                    'subtitle' => 'Get in Touch',
                    'hero' => [
                        'title' => ['prefix' => 'Hubungi', 'highlight' => 'Kami'],
                        'subtitle' => 'Dapatkan konsultasi gratis tentang solusi CMS yang tepat',
                    ],
                    'contactInfo' => [
                        'email' => 'info@canvastencil.com',
                        'phone' => '+62 21-1234-5678', 
                        'address' => 'Jakarta, Indonesia'
                    ]
                ]
            ];

            // Get mock content for the requested page
            $content = $mockPlatformContent[$slug] ?? null;

            if (!$content) {
                return response()->json([
                    'error' => 'Page not found',
                    'message' => "Platform page '{$slug}' not found"
                ], 404);
            }

            // Format mock response to match the expected structure
            $response = [
                'id' => 'page-' . $slug . '-1',
                'pageSlug' => $slug,
                'content' => $content,
                'status' => 'published',
                'publishedAt' => now()->toISOString(),
                'version' => 1,
                'previousVersion' => null,
                'createdAt' => now()->toISOString(),
                'updatedAt' => now()->toISOString(),
                'updatedBy' => null
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Internal server error',
                'message' => 'Failed to retrieve platform page content'
            ], 500);
        }
    }

    /**
     * Get tenant-specific page content for anonymous users
     * 
     * @param string $tenantSlug
     * @param string $page
     * @return JsonResponse
     */
    public function getTenantPage(string $tenantSlug, string $page): JsonResponse
    {
        try {
            // Find tenant by slug
            $tenant = Tenant::where('slug', $tenantSlug)->first();
            
            if (!$tenant) {
                return response()->json([
                    'error' => 'Tenant not found',
                    'message' => "Tenant '{$tenantSlug}' not found"
                ], 404);
            }

            // Query tenant pages directly from public schema with tenant_id filter
            try {
                $tenantPage = DB::table('tenant_pages')
                    ->where('tenant_id', $tenant->id)
                    ->where('slug', $page)
                    ->where('status', 'published')
                    ->first();
                
                if ($tenantPage) {
                    // Return real tenant data from database
                    return response()->json([
                        'id' => $tenantPage->uuid,
                        'tenantSlug' => $tenantSlug,
                        'pageSlug' => $page,
                        'content' => json_decode($tenantPage->content, true),
                        'status' => $tenantPage->status,
                        'publishedAt' => $tenantPage->published_at,
                        'version' => 1,
                        'previousVersion' => null,
                        'createdAt' => $tenantPage->created_at,
                        'updatedAt' => $tenantPage->updated_at,
                        'updatedBy' => null
                    ]);
                }
            } catch (\Exception $e) {
                // Log the error but continue to fallback
                \Log::warning("Failed to access tenant pages for {$tenantSlug}: " . $e->getMessage());
            }

            // Fallback to mock data if no real content found
            $mockContent = [
                'home' => [
                    'hero' => [
                        'title' => ['prefix' => 'Selamat Datang di', 'highlight' => strtoupper($tenantSlug)],
                        'subtitle' => 'Layanan etching profesional berkualitas tinggi untuk semua kebutuhan Anda.',
                        'typingTexts' => [
                            'Presisi Artistik, Kualitas Teruji',
                            'Partner Terpercaya, Solusi Bisnis Anda', 
                            'Hasil Memuaskan, Sesuai Ekspektasi Anda'
                        ]
                    ],
                    'socialProof' => [
                        'title' => 'Partner yang diandalkan oleh para mitra bisnis',
                        'subtitle' => 'Lebih dari 2000+ proyek telah diselesaikan dengan menjaga kepuasan mitra bisnis kami',
                        'stats' => [
                            ['icon' => 'Users', 'value' => '2000+', 'label' => 'Proyek Selesai'],
                            ['icon' => 'Target', 'value' => '500+', 'label' => 'Klien Puas'],
                            ['icon' => 'Award', 'value' => '10+', 'label' => 'Tahun Pengalaman']
                        ]
                    ]
                ],
                'products' => [
                    'hero' => [
                        'title' => ['prefix' => 'Semua', 'highlight' => 'Produk'],
                        'subtitle' => 'Temukan produk etching berkualitas tinggi dengan presisi sempurna untuk kebutuhan Anda.',
                        'typingTexts' => [
                            'Etching Logam Berkualitas Tinggi',
                            'Etching Kaca Elegan dan Tahan Lama', 
                            'Plakat Penghargaan Custom',
                            'Solusi Etching Profesional'
                        ]
                    ],
                    'informationSection' => [
                        'title' => ['prefix' => 'Layanan', 'highlight' => 'Etching', 'suffix' => 'Kami'],
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
                                'description' => 'Kaca berkualitas tinggi dengan hasil etching yang halus dan elegan untuk interior dan hadiah.',
                                'features' => ['Desain artistik', 'Food-grade safe', 'Transparan premium'],
                                'icon' => '🏆',
                                'buttonText' => 'Pelajari Lebih Lanjut'
                            ],
                            [
                                'title' => 'Plakat Penghargaan',
                                'description' => 'Plakat custom untuk penghargaan perusahaan, acara, dan apresiasi dengan desain profesional.',
                                'features' => ['Desain eksklusif', 'Material premium', 'Personalisasi lengkap'],
                                'icon' => '🎖️',
                                'buttonText' => 'Pelajari Lebih Lanjut'
                            ]
                        ]
                    ],
                    'ctaSections' => [
                        [
                            'id' => 'cta-1',
                            'title' => 'Siap Mewujudkan Proyek Anda?',
                            'subtitle' => 'Hubungi kami sekarang dan dapatkan konsultasi gratis untuk proyek etching Anda',
                            'stats' => [
                                ['value' => '1000+', 'label' => 'Produk'],
                                ['value' => '15+', 'label' => 'Tahun Pengalaman'],
                                ['value' => '98%', 'label' => 'Tingkat Kepuasan']
                            ],
                            'buttons' => [
                                ['text' => 'Hubungi Kami', 'variant' => 'primary', 'icon' => 'Phone'],
                                ['text' => 'Lihat Produk Kami', 'variant' => 'outline', 'icon' => 'Target']
                            ]
                        ]
                    ]
                ],
                'about' => [
                    'hero' => [
                        'title' => ['prefix' => 'Tentang', 'highlight' => strtoupper($tenantSlug)],
                        'subtitle' => "Pelajari lebih lanjut tentang $tenantSlug dan layanan kami.",
                        'content' => 'Informasi lengkap tentang perusahaan dan visi misi kami.'
                    ],
                    'company' => [
                        'history' => 'Didirikan pada tahun 2008, kami telah melayani ribuan pelanggan dengan dedikasi tinggi.',
                        'vision' => 'Menjadi penyedia layanan etching terdepan dengan standar kualitas internasional.',
                        'mission' => 'Memberikan solusi etching terbaik dengan teknologi modern dan pelayanan profesional.'
                    ]
                ],
                'faq' => [
                    'hero' => [
                        'title' => ['prefix' => 'Pertanyaan', 'highlight' => 'Umum'],
                        'subtitle' => 'Temukan jawaban untuk pertanyaan yang sering diajukan',
                    ],
                    'faqs' => [
                        ['question' => 'Apa itu etching?', 'answer' => 'Etching adalah proses mengukir permukaan material menggunakan teknik kimia atau laser untuk menciptakan desain yang presisi dan tahan lama.'],
                        ['question' => 'Berapa lama waktu pengerjaan?', 'answer' => 'Waktu pengerjaan bervariasi tergantung kompleksitas desain dan jumlah order. Umumnya 3-7 hari kerja untuk order standar.'],
                        ['question' => 'Bahan apa saja yang bisa di-etching?', 'answer' => 'Kami melayani etching untuk stainless steel, kuningan, tembaga, aluminium, kaca, dan berbagai material lainnya.'],
                        ['question' => 'Apakah ada minimum order?', 'answer' => 'Kami menerima order satuan hingga volume besar. Tidak ada minimum order untuk pelanggan individu.']
                    ]
                ],
                'contact' => [
                    'hero' => [
                        'title' => ['prefix' => 'Hubungi', 'highlight' => 'Kami'],
                        'subtitle' => 'Dapatkan konsultasi gratis untuk kebutuhan etching Anda',
                    ],
                    'contactInfo' => [
                        'email' => 'info@' . strtolower($tenantSlug) . '.com',
                        'phone' => '+62 812-3456-7890',
                        'whatsapp' => '+62 812-3456-7890',
                        'address' => 'Jalan Industri No. 123, Jakarta',
                        'operatingHours' => 'Senin - Jumat: 08:00 - 17:00 WIB'
                    ],
                    'forms' => [
                        'consultation' => [
                            'title' => 'Konsultasi Gratis',
                            'description' => 'Hubungi kami untuk mendiskusikan kebutuhan project Anda'
                        ]
                    ]
                ]
            ];

            // Get content for the requested page
            $content = $mockContent[$page] ?? null;

            if (!$content) {
                return response()->json([
                    'error' => 'Page not found',
                    'message' => "Page '{$page}' not found for tenant '{$tenantSlug}'"
                ], 404);
            }

            // Format response to match the expected structure
            $response = [
                'id' => "page-{$tenantSlug}-{$page}-1",
                'tenantSlug' => $tenantSlug,
                'pageSlug' => $page,
                'content' => $content,
                'status' => 'published',
                'publishedAt' => now()->toISOString(),
                'version' => 1,
                'previousVersion' => null,
                'createdAt' => now()->toISOString(),
                'updatedAt' => now()->toISOString(),
                'updatedBy' => null
            ];

            return response()->json($response);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Internal server error',
                'message' => 'Failed to retrieve tenant page content'
            ], 500);
        }
    }
}