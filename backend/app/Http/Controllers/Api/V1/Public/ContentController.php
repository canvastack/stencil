<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Domain\Content\Entities\PlatformPage;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ContentController extends Controller
{
    /**
     * Get platform page content for anonymous users
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function getPage(string $slug): JsonResponse
    {
        try {
            // Get published platform page by slug
            $page = PlatformPage::where('slug', $slug)
                ->where('status', 'published')
                ->first();

            if (!$page) {
                return response()->json([
                    'error' => 'Page not found',
                    'message' => "Platform page '{$slug}' not found or not published"
                ], 404);
            }

            // Format response to match the expected structure
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

            // For now, return mock data for tenant pages since we might not have tenant-specific content models yet
            // This can be extended when tenant-specific page content models are implemented
            $mockContent = [
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