<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UpdateContactPage extends Command
{
    protected $signature = 'pages:update-contact {tenant_id=1}';
    protected $description = 'Update Contact page with complete content structure';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
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
                        "content" => "info@etching-id.com"
                    ],
                    [
                        "icon" => "Clock",
                        "title" => "Jam Operasional",
                        "content" => "Senin - Jumat: 08:00 - 17:00 WIB\nSabtu: 08:00 - 12:00 WIB"
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
                        "required" => true,
                        "placeholder" => "Masukkan nama lengkap"
                    ],
                    [
                        "name" => "email",
                        "label" => "Email",
                        "type" => "email",
                        "required" => true,
                        "placeholder" => "nama@email.com"
                    ],
                    [
                        "name" => "phone",
                        "label" => "Nomor Telepon",
                        "type" => "tel",
                        "required" => true,
                        "placeholder" => "+62 812 3456 7890"
                    ],
                    [
                        "name" => "subject",
                        "label" => "Subjek",
                        "type" => "select",
                        "required" => true,
                        "options" => [
                            "Pertanyaan Umum",
                            "Request Quotation",
                            "Konsultasi Proyek",
                            "Komplain",
                            "Lainnya"
                        ]
                    ],
                    [
                        "name" => "message",
                        "label" => "Pesan",
                        "type" => "textarea",
                        "required" => true,
                        "placeholder" => "Jelaskan kebutuhan atau pertanyaan Anda..."
                    ]
                ],
                "submitButton" => "Kirim Pesan",
                "successMessage" => "Terima kasih! Pesan Anda telah terkirim. Kami akan menghubungi Anda segera."
            ],
            "map" => [
                "enabled" => true,
                "title" => "Lokasi Kami",
                "embedUrl" => "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.0!2d106.8!3d-6.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMTInMDAuMCJTIDEwNsKwNDgnMDAuMCJF!5e0!3m2!1sen!2sid!4v1234567890"
            ],
            "quickContact" => [
                "enabled" => true,
                "title" => "Atau Hubungi Langsung",
                "items" => [
                    [
                        "icon" => "MessageCircle",
                        "title" => "WhatsApp",
                        "description" => "Chat langsung dengan tim kami",
                        "link" => "https://wa.me/6281234567890",
                        "buttonText" => "Chat WhatsApp"
                    ],
                    [
                        "icon" => "Phone",
                        "title" => "Telepon",
                        "description" => "Hubungi customer service kami",
                        "link" => "tel:+622112345678",
                        "buttonText" => "Telepon Sekarang"
                    ]
                ]
            ],
            "achievements" => [
                "enabled" => true,
                "title" => "Pencapaian Kami",
                "subtitle" => "Kepercayaan yang telah diberikan selama bertahun-tahun",
                "items" => [
                    [
                        "icon" => "Users",
                        "value" => "2000+",
                        "label" => "Proyek Selesai",
                        "color" => "text-blue-500"
                    ],
                    [
                        "icon" => "Award",
                        "value" => "10+",
                        "label" => "Tahun Pengalaman",
                        "color" => "text-green-500"
                    ],
                    [
                        "icon" => "Target",
                        "value" => "500+",
                        "label" => "Klien Puas",
                        "color" => "text-purple-500"
                    ],
                    [
                        "icon" => "CheckCircle2",
                        "value" => "99%",
                        "label" => "Tingkat Presisi",
                        "color" => "text-primary"
                    ]
                ]
            ],
            "whyChooseUs" => [
                "enabled" => true,
                "title" => "Mengapa Memilih Kami?",
                "items" => [
                    [
                        "title" => "Kualitas Terjamin",
                        "description" => "Semua produk telah melalui quality control ketat dan memiliki sertifikasi resmi dari lembaga terpercaya."
                    ],
                    [
                        "title" => "Tim Ahli Berpengalaman",
                        "description" => "Didukung oleh tim ahli dengan pengalaman puluhan tahun di industri etching dan laser cutting."
                    ],
                    [
                        "title" => "Layanan Prima",
                        "description" => "Konsultasi gratis, dukungan teknis 24/7, dan garansi kepuasan untuk semua pelanggan."
                    ]
                ]
            ],
            "cta" => [
                "enabled" => true,
                "items" => [
                    [
                    "type" => "primary",
                    "title" => "Siap Mewujudkan Proyek Anda?",
                    "subtitle" => "Diskusikan kebutuhan Anda dengan tim kami dan dapatkan penawaran gratis hari ini.",
                    "buttons" => [
                        [
                            "text" => "Hubungi Kami",
                            "link" => "/contact",
                            "variant" => "default"
                        ],
                        [
                            "text" => "Lihat Produk Kami",
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
                        ],
                        [
                            "value" => "98%",
                            "label" => "Tingkat Kepuasan"
                        ]
                    ]
                ],
                [
                    "type" => "secondary",
                    "title" => "Punya Pertanyaan atau Siap Memulai?",
                    "subtitle" => "Tim ahli kami siap membantu Anda menemukan solusi terbaik untuk kebutuhan etching Anda",
                    "buttons" => [
                        [
                            "text" => "Hubungi Tim Kami",
                            "link" => "/contact",
                            "variant" => "default"
                        ]
                    ]
                ]
                ]
            ],
            "seo" => [
                "title" => "Hubungi Kami - Etching Profesional Indonesia",
                "description" => "Hubungi tim profesional kami untuk konsultasi dan informasi layanan laser etching. Response cepat dan layanan ramah. Telepon, email, WhatsApp tersedia.",
                "keywords" => ["kontak etching", "hubungi laser etching", "konsultasi etching"],
                "ogImage" => "/images/og-image-contact.jpg"
            ]
        ];

        // Check if contact page exists
        $existingPage = DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', 'contact')
            ->first();

        if ($existingPage) {
            // Update existing page
            $updated = DB::table('tenant_pages')
                ->where('tenant_id', $tenantId)
                ->where('slug', 'contact')
                ->update([
                    'content' => json_encode($content),
                    'updated_at' => Carbon::now()
                ]);
            
            if ($updated) {
                $this->info("Contact page updated successfully for tenant {$tenantId}");
            } else {
                $this->error("Failed to update contact page for tenant {$tenantId}");
            }
        } else {
            // Create new page
            DB::table('tenant_pages')->insert([
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'title' => 'Hubungi Kami',
                'slug' => 'contact',
                'description' => 'Contact page with comprehensive sections',
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
            
            $this->info("Contact page created successfully for tenant {$tenantId}");
        }

        return 0;
    }
}