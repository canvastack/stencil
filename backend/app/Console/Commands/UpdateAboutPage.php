<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UpdateAboutPage extends Command
{
    protected $signature = 'pages:update-about {tenant_id=1}';
    protected $description = 'Update About page with complete content structure';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');
        
        $content = [
            "hero" => [
                "title" => "Tentang Kami",
                "subtitle" => "Layanan untuk solusi etching profesional dan berkualitas tinggi untuk memenuhi kebutuhan bisnis dan personal dalam berbagai sektor industri di Indonesia",
                "image" => "/images/about/company-hero.jpg"
            ],
            "company" => [
                "enabled" => true,
                "title" => "Profil Perusahaan", 
                "description" => "Kami adalah perusahaan yang berfokus pada layanan etching profesional untuk berbagai kebutuhan industri dan personal. Dengan tim yang berpengalaman, kami berkomitmen memberikan hasil terbaik untuk setiap proyek.",
                "founded" => "2018",
                "location" => "Jakarta, Indonesia", 
                "employees" => "20+",
                "clients" => "30+"
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
                        "year" => "2018",
                        "title" => "Memulai Usaha",
                        "description" => "Memulai bisnis dengan 1 mesin etching"
                    ],
                    [
                        "year" => "2022",
                        "title" => "Ekspansi Bisnis",
                        "description" => "Membuka fasilitas produksi baru dengan 5 mesin"
                    ],
                    [
                        "year" => "2025",
                        "title" => "Pendirian Perusahaan",
                        "description" => "Pendirian PT. Custom Etching Xenial"
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

        // Update existing About page
        $updated = DB::table('tenant_pages')
            ->where('tenant_id', $tenantId)
            ->where('slug', 'about')
            ->update([
                'title' => 'Tentang Kami',
                'content' => json_encode($content),
                'updated_at' => Carbon::now()
            ]);

        if ($updated) {
            $this->info("About page updated successfully for tenant {$tenantId}!");
            
            // Display content sections
            $this->line("Content sections:");
            foreach (array_keys($content) as $section) {
                $this->line("- {$section}");
            }
        } else {
            $this->error("About page not found for tenant {$tenantId}!");
        }
    }
}