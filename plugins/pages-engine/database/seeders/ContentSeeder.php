<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = DB::table('tenants')
            ->where('name', 'PT. Custom Etching Xenial')
            ->first();

        if (!$tenant) {
            if ($this->command) {
                $this->command->warn('Tenant PT. Custom Etching Xenial not found. Skipping seeder.');
            }
            return;
        }

        $tenantId = $tenant->uuid;

        $adminUser = DB::table('users')
            ->where('tenant_id', $tenant->id)
            ->first();

        if (!$adminUser) {
            if ($this->command) {
                $this->command->warn('No admin user found for tenant. Skipping seeder.');
            }
            return;
        }

        $authorId = $adminUser->uuid;

        $blogTypeId = DB::table('canplug_pagen_content_types')
            ->where('slug', 'blog')
            ->value('uuid');

        $portfolioTypeId = DB::table('canplug_pagen_content_types')
            ->where('slug', 'portfolio')
            ->where('tenant_id', $tenantId)
            ->value('uuid');

        $contents = [];

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Panduan Lengkap Memilih Material untuk Etching',
            'panduan-lengkap-memilih-material-untuk-etching',
            'Memilih material yang tepat adalah kunci kesuksesan project etching Anda. Artikel ini membahas karakteristik berbagai material dan aplikasinya.',
            'Dalam dunia etching, pemilihan material yang tepat sangat mempengaruhi hasil akhir produk. Setiap material memiliki karakteristik unik yang memerlukan teknik dan pendekatan berbeda...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Teknik Chemical Etching untuk Logam Presisi Tinggi',
            'teknik-chemical-etching-untuk-logam-presisi-tinggi',
            'Chemical etching adalah metode yang ideal untuk menciptakan detail halus pada logam dengan presisi tinggi.',
            'Chemical etching menggunakan larutan kimia untuk mengikis permukaan logam secara terkontrol. Teknik ini sangat efektif untuk membuat pola kompleks dan detail halus...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Laser Etching vs Chemical Etching: Mana yang Lebih Baik?',
            'laser-etching-vs-chemical-etching',
            'Perbandingan komprehensif antara laser etching dan chemical etching untuk membantu Anda memilih metode yang tepat.',
            'Laser etching dan chemical etching adalah dua metode populer dalam industri etching. Keduanya memiliki kelebihan dan kekurangan masing-masing...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Cara Merawat Plakat Logam Agar Tetap Berkilau',
            'cara-merawat-plakat-logam-agar-tetap-berkilau',
            'Tips praktis untuk merawat dan membersihkan plakat logam etching agar tetap terlihat seperti baru.',
            'Plakat logam hasil etching adalah investasi berharga yang perlu dirawat dengan baik. Dengan perawatan yang tepat, plakat dapat bertahan bertahun-tahun...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            '10 Desain Plakat Penghargaan Paling Populer 2025',
            '10-desain-plakat-penghargaan-paling-populer-2025',
            'Tren desain plakat penghargaan terkini yang banyak diminati klien korporat.',
            'Industri penghargaan terus berkembang dengan tren desain yang mengikuti selera pasar. Berikut 10 desain plakat yang paling populer tahun ini...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Etching pada Kaca: Teknik dan Aplikasinya',
            'etching-pada-kaca-teknik-dan-aplikasinya',
            'Panduan lengkap tentang teknik etching pada kaca dan berbagai aplikasinya dalam industri.',
            'Etching pada kaca menciptakan efek frosted yang elegan dan permanen. Teknik ini banyak digunakan untuk dekorasi, branding, dan penghargaan...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Mengapa Stainless Steel Ideal untuk Trophy Outdoor?',
            'mengapa-stainless-steel-ideal-untuk-trophy-outdoor',
            'Keunggulan stainless steel sebagai material trophy untuk penggunaan outdoor dan lingkungan keras.',
            'Trophy outdoor memerlukan material yang tahan terhadap cuaca ekstrem. Stainless steel menawarkan kombinasi sempurna antara durabilitas dan estetika...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Proses Produksi Plakat dari Awal hingga Selesai',
            'proses-produksi-plakat-dari-awal-hingga-selesai',
            'Behind the scenes: Bagaimana plakat etching diproduksi dari konsep hingga produk jadi.',
            'Produksi plakat etching melibatkan beberapa tahap penting yang memastikan kualitas optimal. Mari kita jelajahi setiap tahapan prosesnya...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Sandblasting untuk Detail Kasar: Kapan Menggunakannya?',
            'sandblasting-untuk-detail-kasar-kapan-menggunakannya',
            'Panduan tentang teknik sandblasting dan situasi ideal untuk menggunakannya.',
            'Sandblasting adalah teknik abrasif yang menciptakan tekstur kasar pada permukaan material. Teknik ini ideal untuk aplikasi tertentu...',
            'published'
        );

        $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
            'Memahami Toleransi dalam Etching Presisi',
            'memahami-toleransi-dalam-etching-presisi',
            'Pentingnya memahami toleransi manufaktur dalam project etching presisi tinggi.',
            'Toleransi adalah aspek krusial dalam etching presisi. Memahami batas toleransi membantu menentukan kelayakan desain dan metode produksi...',
            'published'
        );

        for ($i = 11; $i <= 30; $i++) {
            $contents[] = $this->createBlogPost($tenantId, $blogTypeId, $authorId,
                "Tips Etching #{$i}: Praktik Terbaik untuk Hasil Optimal",
                "tips-etching-{$i}-praktik-terbaik-untuk-hasil-optimal",
                "Koleksi tips dan trik praktis untuk meningkatkan kualitas hasil etching Anda.",
                "Dalam artikel ini, kami berbagi pengalaman dan pengetahuan tentang praktik terbaik dalam industri etching...",
                'published'
            );
        }

        for ($i = 1; $i <= 20; $i++) {
            $contents[] = $this->createPortfolio($tenantId, $portfolioTypeId, $authorId,
                "Project Trophy Korporat #{$i}",
                "project-trophy-korporat-{$i}",
                "Trophy etching custom untuk acara korporat dengan desain eksklusif dan finishing premium.",
                "Project ini melibatkan pembuatan 50 unit trophy stainless steel dengan teknik laser etching presisi tinggi. Desain mencakup logo perusahaan dan detail ornamen kompleks...",
                'published'
            );
        }

        foreach ($contents as $content) {
            DB::table('canplug_pagen_contents')->insert($content);
        }

        if ($this->command) {
            $this->command->info('ContentSeeder: ' . count($contents) . ' contents seeded');
        }
    }

    private function createBlogPost($tenantId, $contentTypeId, $authorId, $title, $slug, $excerpt, $bodyPreview, $status)
    {
        return [
            'tenant_id' => $tenantId,
            'content_type_id' => $contentTypeId,
            'author_id' => $authorId,
            'title' => $title,
            'slug' => $slug,
            'excerpt' => $excerpt,
            'content' => json_encode([
                'blocks' => [
                    [
                        'type' => 'paragraph',
                        'data' => ['text' => $bodyPreview]
                    ],
                    [
                        'type' => 'paragraph',
                        'data' => ['text' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.']
                    ],
                    [
                        'type' => 'header',
                        'data' => ['text' => 'Kesimpulan', 'level' => 2]
                    ],
                    [
                        'type' => 'paragraph',
                        'data' => ['text' => 'Dengan memahami konsep ini, Anda dapat meningkatkan kualitas project etching dan memberikan hasil terbaik untuk klien.']
                    ]
                ]
            ]),
            'content_format' => 'wysiwyg',
            'status' => $status,
            'published_at' => $status === 'published' ? now()->subDays(rand(1, 30)) : null,
            'seo_title' => $title,
            'seo_description' => $excerpt,
            'view_count' => rand(50, 500),
            'comment_count' => 0,
            'is_featured' => rand(0, 10) > 7,
            'is_commentable' => true,
            'metadata' => json_encode([
                'reading_time' => rand(3, 10) . ' menit',
                'difficulty' => ['Beginner', 'Intermediate', 'Advanced'][rand(0, 2)]
            ]),
            'created_at' => now()->subDays(rand(1, 60)),
            'updated_at' => now()->subDays(rand(0, 30)),
        ];
    }

    private function createPortfolio($tenantId, $contentTypeId, $authorId, $title, $slug, $excerpt, $bodyPreview, $status)
    {
        return [
            'tenant_id' => $tenantId,
            'content_type_id' => $contentTypeId,
            'author_id' => $authorId,
            'title' => $title,
            'slug' => $slug,
            'excerpt' => $excerpt,
            'content' => json_encode([
                'blocks' => [
                    [
                        'type' => 'paragraph',
                        'data' => ['text' => $bodyPreview]
                    ],
                    [
                        'type' => 'header',
                        'data' => ['text' => 'Spesifikasi', 'level' => 2]
                    ],
                    [
                        'type' => 'list',
                        'data' => [
                            'style' => 'unordered',
                            'items' => [
                                'Material: Stainless Steel 304',
                                'Teknik: Laser Etching',
                                'Dimensi: 25cm x 15cm x 5cm',
                                'Finishing: Polished Chrome',
                                'Quantity: 50 units'
                            ]
                        ]
                    ],
                    [
                        'type' => 'header',
                        'data' => ['text' => 'Hasil', 'level' => 2]
                    ],
                    [
                        'type' => 'paragraph',
                        'data' => ['text' => 'Project diselesaikan tepat waktu dengan kualitas presisi tinggi. Klien sangat puas dengan hasil akhir dan detailing yang sempurna.']
                    ]
                ]
            ]),
            'content_format' => 'wysiwyg',
            'status' => $status,
            'published_at' => $status === 'published' ? now()->subDays(rand(1, 90)) : null,
            'seo_title' => $title,
            'seo_description' => $excerpt,
            'view_count' => rand(20, 200),
            'comment_count' => 0,
            'is_featured' => rand(0, 10) > 5,
            'is_commentable' => false,
            'metadata' => json_encode([
                'client_type' => 'Corporate',
                'project_duration' => rand(7, 30) . ' hari',
                'budget_range' => 'Rp ' . number_format(rand(10, 50) * 1000000, 0, ',', '.')
            ]),
            'created_at' => now()->subDays(rand(1, 120)),
            'updated_at' => now()->subDays(rand(0, 60)),
        ];
    }
}
