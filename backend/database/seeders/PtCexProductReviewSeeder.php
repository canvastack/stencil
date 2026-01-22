<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class PtCexProductReviewSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('⭐ Seeding PT CEX Product Reviews...');

        $etchinx = TenantModel::where('slug', 'etchinx')->first();
        
        if (!$etchinx) {
            $this->command->error('❌ PT Custom Etching Xenial tenant not found!');
            return;
        }

        $products = Product::where('tenant_id', $etchinx->id)
            ->where('status', 'published')
            ->get();

        if ($products->isEmpty()) {
            $this->command->warn('⚠️  No published products found for PT CEX');
            return;
        }

        $customers = DB::table('customers')
            ->where('tenant_id', $etchinx->id)
            ->pluck('id')
            ->toArray();

        if (empty($customers)) {
            $this->command->warn('⚠️  No customers found for PT CEX tenant');
            return;
        }

        $this->command->info('🗑️  Clearing existing PT CEX product reviews...');
        $deletedCount = DB::table('customer_reviews')
            ->where('tenant_id', $etchinx->id)
            ->delete();
        $this->command->info("   Deleted {$deletedCount} existing reviews");

        $reviews = [];
        $totalReviews = 0;

        foreach ($products as $product) {
            $reviewCount = rand(3, 10);
            
            for ($i = 0; $i < $reviewCount; $i++) {
                $rating = $this->generateHighRating();
                $customerId = $customers[array_rand($customers)];
                $isVerified = rand(0, 100) > 15;
                $isApproved = rand(0, 100) > 3;
                $createdAt = now()->subDays(rand(7, 365));
                
                $reviews[] = [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $etchinx->id,
                    'customer_id' => $customerId,
                    'product_id' => $product->id,
                    'order_id' => null,
                    'rating' => $rating,
                    'title' => $this->generateTitle($rating),
                    'content' => $this->generateEtchingReview($rating, $product->name),
                    'images' => null,
                    'is_verified_purchase' => $isVerified,
                    'is_approved' => $isApproved,
                    'approved_at' => $isApproved ? $createdAt->addHours(rand(1, 48)) : null,
                    'approved_by' => null,
                    'helpful_count' => rand(2, 25),
                    'not_helpful_count' => rand(0, 2),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
                $totalReviews++;
            }
        }

        foreach (array_chunk($reviews, 100) as $chunk) {
            DB::table('customer_reviews')->insert($chunk);
        }

        $this->command->info("✅ Created {$totalReviews} reviews for {$products->count()} PT CEX products");
        $this->command->info("   Average: " . round($totalReviews / $products->count(), 1) . " reviews per product");
    }

    private function generateHighRating(): int
    {
        $rand = rand(1, 100);
        
        if ($rand <= 80) return 5;
        return 4;
    }

    private function generateTitle(int $rating): string
    {
        $titles = [
            5 => [
                'Kualitas Premium, Sangat Puas!',
                'Hasil Etching Sempurna!',
                'Profesional dan Berkualitas Tinggi',
                'Highly Recommended untuk Corporate Award',
                'Detail Sangat Presisi, Luar Biasa!',
                'Elegan dan Mewah, Worth Every Penny!',
                'Melampaui Ekspektasi!',
                'Perfect untuk Penghargaan Perusahaan',
                'Craftsmanship Luar Biasa',
                'Top Quality! Akan Order Lagi',
                'Sangat Memuaskan, 5 Bintang!',
                'Kualitas Juara, Packaging Rapi',
            ],
            4 => [
                'Bagus, Hasil Memuaskan',
                'Kualitas Baik, Pengerjaan Rapi',
                'Recommended, Sesuai Deskripsi',
                'Bagus untuk Harganya',
                'Puas dengan Hasilnya',
                'Good Quality, Fast Delivery',
                'Hasil Etching Rapi dan Detail',
                'Memuaskan, Akan Pesan Lagi',
            ],
        ];

        return $titles[$rating][array_rand($titles[$rating])];
    }

    private function generateEtchingReview(int $rating, string $productName): string
    {
        $reviews5Star = [
            'Plakat yang dipesan sangat memuaskan! Detail etching-nya sangat presisi dan rapi. Material yang digunakan terasa premium dan berkualitas tinggi. Finishing-nya juga sempurna, mengkilap dan tidak ada cacat sama sekali. Sangat cocok untuk acara corporate kami. Tim PT CEX sangat profesional dalam komunikasi dan delivery tepat waktu. Definitely will order again!',
            
            'Luar biasa! Hasil etching sangat detail dan clean. Setiap tulisan dan logo ter-etch dengan sempurna tanpa blur atau cacat sedikitpun. Packaging-nya juga sangat rapi dan aman, bubble wrap tebal plus box kayu. Produk tiba dalam kondisi sempurna. Harga memang premium tapi sebanding dengan kualitas yang didapat. Highly recommended untuk perusahaan yang mencari trophy/plakat berkelas!',
            
            'Sangat puas dengan kualitas produk ini! Bahan akrilik/metal yang digunakan sangat bagus, tidak mudah tergores. Proses etching-nya halus dan presisi tinggi. Design yang kami request di-execute dengan sempurna. Customer service sangat responsif dan helpful dalam proses desain. Lead time juga sesuai promise. Worth it banget untuk harga yang dibayar. Thanks PT CEX!',
            
            'Exceptional quality! Plakatnya benar-benar premium, dari material, etching detail, sampai finishing semuanya top notch. Saat diterima klien di acara penghargaan, semua tamu impressed dengan kualitasnya. PT CEX memang expert dalam bidang etching. Proses order juga mudah dan timeline jelas. Sudah order ketiga kalinya dan tidak pernah mengecewakan. Best vendor untuk corporate award!',
            
            'Produk premium dengan craftsmanship yang luar biasa! Detail etching sangat halus dan presisi. Logo perusahaan ter-etch dengan sangat jelas dan tajam. Material berkualitas tinggi, berat dan kokoh, bukan yang murahan. Packaging super rapi dan aman dengan foam protection. Delivery on time sesuai jadwal. Team PT CEX sangat profesional dan komunikatif. Puas banget! Definitely recommended!',
            
            'Perfect! Hasilnya melampaui ekspektasi kami. Etching-nya sangat detail dan rapi, tidak ada bagian yang blur atau tidak jelas. Bahan yang digunakan terasa solid dan berkualitas premium. Finishing glossy-nya membuat plakat terlihat sangat mewah dan elegant. Cocok sekali untuk penghargaan level eksekutif. Proses dari order sampai terima barang sangat smooth. Pelayanan PT CEX excellent! Will definitely order more.',
            
            'Sangat memuaskan! Quality control dari PT CEX sangat ketat, produk yang diterima benar-benar sempurna. Detail etching tajam dan presisi, tulisan kecil pun masih terbaca dengan jelas. Material premium, tidak ada cacat atau goresan. Packaging profesional dengan box branded. Customer service responsive dan helpful. Lead time sesuai commitment. Untuk corporate gift/award, PT CEX adalah pilihan terbaik!',
            
            'Highly recommended! Plakatnya sangat berkelas dan elegan. Teknik etching yang digunakan menghasilkan detail yang sangat halus dan presisi. Bahan berkualitas tinggi, finishing sempurna tanpa cacat. Ketika diserahkan di acara penghargaan, recipientnya sangat senang dan impressed. Tim PT CEX sangat profesional dari konsultasi desain sampai delivery. Price point memang di atas rata-rata tapi kualitasnya justified. Worth every penny!',
            
            'Excellent product! Kualitas etching sangat baik, semua detail logo dan text ter-render dengan sempurna. Material yang dipakai premium grade, bukan yang abal-abal. Packaging super aman dengan multiple layer protection. Produk sampai dalam kondisi perfect, tidak ada cacat atau damage sama sekali. Team PT CEX sangat responsif dan profesional. Turnaround time cepat. Sudah recommend ke beberapa kolega dan semuanya puas. Top!',
            
            'Outstanding quality! Detail etching sangat presisi dan clean, tidak ada bagian yang cacat atau kurang rapi. Material berkualitas tinggi dengan finishing yang mewah. Berat dan texture-nya terasa premium. Sangat cocok untuk penghargaan corporate level tinggi. Proses order mudah, team PT CEX sangat helpful dalam memberikan rekomendasi desain. Delivery tepat waktu dengan packaging yang sangat rapi dan aman. Very satisfied!',
            
            'Produk luar biasa bagus! Etching-nya sangat detail dan tajam. Setiap elemen desain ter-execute dengan sempurna. Material premium dengan finishing yang elegant. Tidak ada cacat produksi sama sekali. Packaging profesional dan aman. Customer service PT CEX sangat responsif dan komunikatif, selalu update progress pengerjaan. Lead time sesuai promise. Harga memang tidak murah tapi kualitas benar-benar top tier. Highly recommended untuk corporate award dan trophy!',
            
            'Perfect untuk acara penghargaan kami! Kualitas plakat sangat premium, material solid dan berkualitas tinggi. Detail etching sangat presisi, logo dan teks terbaca dengan sangat jelas. Finishing-nya glossy dan mewah. Tidak ada defect sama sekali. Packaging rapi dengan foam dan bubble wrap tebal. PT CEX sangat profesional dalam handling order, komunikasi clear dan transparan. Delivery on time. Akan definitely order lagi untuk event berikutnya!',
        ];

        $reviews4Star = [
            'Produk bagus dan kualitas memuaskan. Etching-nya rapi dan detail cukup presisi. Material berkualitas baik. Ada sedikit minor imperfection di bagian pojok tapi tidak terlalu mengganggu overall appearance. Packaging aman dan produk sampai dengan selamat. Customer service responsif. Lead time sesuai jadwal. Untuk harga yang dibayar, cukup worth it. Recommended!',
            
            'Overall bagus! Hasil etching rapi dan detail. Bahan terasa premium dan solid. Finishing bagus, mengkilap dan smooth. Hanya saja delivery agak mepet dari deadline yang diminta, sempat deg-degan. Tapi alhamdulillah sampai tepat waktu dan kualitas memuaskan. Customer service responsif. Akan consider order lagi untuk kebutuhan berikutnya.',
            
            'Kualitas baik, sesuai ekspektasi. Etching detail dan rapi. Material bagus dan kokoh. Packaging cukup aman. Proses komunikasi dengan team PT CEX lancar. Ada sedikit revision di desain awal tapi di-handle dengan baik. Lead time sesuai agreement. Harga agak di atas budget tapi kualitas sebanding. Recommended untuk corporate award.',
            
            'Bagus! Plakat-nya berkualitas, etching-nya presisi dan rapi. Material terasa premium. Finishing smooth tanpa cacat berarti. Packaging rapi dan aman. Yang sedikit kurang adalah komunikasi progress pengerjaan tidak terlalu proactive, harus follow up dulu baru dapat update. Tapi hasil akhir memuaskan. Good quality product!',
            
            'Memuaskan! Detail etching bagus dan tajam. Material berkualitas baik. Finishing rapi. Ada sedikit keterlambatan dari timeline awal sekitar 2 hari, tapi masih dalam batas toleransi. Customer service responsif saat ditanya. Packaging aman. Produk sampai dalam kondisi baik. Untuk harga segini, kualitas sudah cukup oke. Will order again.',
            
            'Good quality! Etching-nya rapi dan presisi. Bahan bagus dan solid. Finishing halus. Sedikit concern di packaging yang menurutku bisa lebih aman lagi, tapi alhamdulillah produk sampai tanpa damage. Komunikasi dengan team PT CEX lancar. Lead time sesuai promise. Harga fair untuk kualitas yang didapat. Recommended.',
            
            'Bagus secara keseluruhan. Hasil etching detail dan rapi. Material berkualitas. Finishing bagus. Proses order smooth dan team responsif. Yang perlu improvement mungkin di bagian proofing desain, agak lama dapat approval desain final. Tapi hasil akhir memuaskan. Packaging aman. Delivery tepat waktu. Good job PT CEX!',
            
            'Puas dengan produk yang diterima. Kualitas etching bagus, detail presisi. Material premium. Hanya saja ada very minor scratch di bagian belakang, tapi karena tidak kelihatan saat dipajang jadi tidak masalah. Packaging rapi. Customer service helpful. Lead time sesuai jadwal. Overall satisfied dan akan recommend ke teman.',
        ];

        if ($rating === 5) {
            return $reviews5Star[array_rand($reviews5Star)];
        } else {
            return $reviews4Star[array_rand($reviews4Star)];
        }
    }
}
