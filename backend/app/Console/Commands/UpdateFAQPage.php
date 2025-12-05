<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UpdateFAQPage extends Command
{
    protected $signature = 'pages:update-faq {tenant_id=1}';
    protected $description = 'Update FAQ page with complete content structure';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
        $content = [
            "hero" => [
                "title" => "Frequently Asked Questions",
                "subtitle" => "Temukan jawaban untuk pertanyaan yang sering ditanyakan tentang layanan etching kami. Jika Anda tidak menemukan jawaban yang Anda cari, jangan ragu untuk menghubungi kami."
            ],
            "categoriesEnabled" => true,
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

        // Find existing FAQ page
        $faqPage = DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', 'faq')
            ->first();

        if ($faqPage) {
            // Update existing FAQ page
            DB::table('tenant_pages')
                ->where('id', $faqPage->id)
                ->update([
                    'content' => json_encode($content),
                    'updated_at' => Carbon::now()
                ]);
            
            $this->info("FAQ page updated successfully for tenant ID: {$tenantId}");
        } else {
            // Create new FAQ page if not exists
            DB::table('tenant_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'title' => 'FAQ',
                'slug' => 'faq',
                'description' => 'FAQ page',
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
            
            $this->info("FAQ page created successfully for tenant ID: {$tenantId}");
        }

        return Command::SUCCESS;
    }
}