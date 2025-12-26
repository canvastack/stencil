<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantModel;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

class CustomerReviewSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌟 Seeding customer reviews...');

        $etchinx = TenantModel::where('slug', 'etchinx')->first();
        
        if (!$etchinx) {
            $this->command->warn('Etchinx tenant not found, skipping reviews');
            return;
        }

        // Get published products
        $products = Product::where('tenant_id', $etchinx->id)
            ->where('status', 'published')
            ->get();

        if ($products->isEmpty()) {
            $this->command->warn('No published products found, skipping reviews');
            return;
        }

        // Get customers for this tenant
        $customers = DB::table('customers')
            ->where('tenant_id', $etchinx->id)
            ->pluck('id')
            ->toArray();

        if (empty($customers)) {
            $this->command->warn('No customers found for etchinx tenant, skipping reviews');
            return;
        }

        $reviews = [];
        $totalReviews = 0;

        // Generate reviews for 80% of products (randomly)
        foreach ($products->shuffle()->take((int)($products->count() * 0.8)) as $product) {
            // Each product gets 1-5 reviews
            $reviewCount = rand(1, 5);
            
            for ($i = 0; $i < $reviewCount; $i++) {
                $rating = $this->generateRealisticRating();
                $customerId = $customers[array_rand($customers)];
                $isVerified = rand(0, 100) > 20; // 80% verified
                $isApproved = rand(0, 100) > 5; // 95% approved
                $createdAt = now()->subDays(rand(1, 180));
                
                $reviews[] = [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $etchinx->id,
                    'customer_id' => $customerId,
                    'product_id' => $product->id,
                    'order_id' => null,
                    'rating' => $rating,
                    'title' => $this->generateTitle($rating),
                    'content' => $this->generateReview($rating),
                    'images' => null,
                    'is_verified_purchase' => $isVerified,
                    'is_approved' => $isApproved,
                    'approved_at' => $isApproved ? $createdAt->addHours(rand(1, 24)) : null,
                    'approved_by' => null,
                    'helpful_count' => rand(0, 15),
                    'not_helpful_count' => rand(0, 3),
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ];
                $totalReviews++;
            }
        }

        // Insert in chunks
        foreach (array_chunk($reviews, 100) as $chunk) {
            DB::table('customer_reviews')->insert($chunk);
        }

        $productsWithReviews = (int)($products->count() * 0.8);
        $this->command->info("✅ Created {$totalReviews} customer reviews for {$productsWithReviews} products");
    }

    private function generateRealisticRating(): int
    {
        // Weighted distribution: more 4-5 stars (realistic for quality products)
        $rand = rand(1, 100);
        
        if ($rand <= 40) return 5; // 40%
        if ($rand <= 75) return 4; // 35%
        if ($rand <= 90) return 3; // 15%
        if ($rand <= 97) return 2; // 7%
        return 1; // 3%
    }

    private function generateTitle(int $rating): string
    {
        $titles = [
            5 => [
                'Produk Luar Biasa!',
                'Sangat Memuaskan',
                'Kualitas Premium',
                'Highly Recommended!',
                'Sempurna!',
            ],
            4 => [
                'Produk Bagus',
                'Memuaskan',
                'Worth It',
                'Kualitas Baik',
                'Recommended',
            ],
            3 => [
                'Cukup Baik',
                'Lumayan',
                'Standar',
                'Oke lah',
                'Biasa Aja',
            ],
            2 => [
                'Kurang Memuaskan',
                'Agak Mengecewakan',
                'Perlu Perbaikan',
                'Not Worth It',
                'Kurang Bagus',
            ],
            1 => [
                'Sangat Mengecewakan',
                'Buruk Sekali',
                'Tidak Recommended',
                'Waste of Money',
                'Kualitas Buruk',
            ],
        ];

        return $titles[$rating][array_rand($titles[$rating])];
    }

    private function generateReview(int $rating): string
    {
        $reviews = [
            5 => [
                'Produk sangat bagus! Kualitas luar biasa dan pengerjaan sangat rapi.',
                'Sangat puas dengan hasil etching-nya. Detail sangat presisi!',
                'Recommended! Pelayanan cepat dan hasil memuaskan.',
                'Kualitas premium, sesuai ekspektasi. Akan order lagi.',
                'Luar biasa! Material berkualitas tinggi dan finishing sempurna.',
            ],
            4 => [
                'Produk bagus, cuma pengiriman agak lama.',
                'Kualitas baik, hanya ada sedikit cacat minor di bagian pinggir.',
                'Memuaskan, namun harga agak mahal untuk ukuran ini.',
                'Bagus, tapi packaging bisa ditingkatkan lagi.',
                'Hasil etching rapi, waktu pengerjaan sesuai jadwal.',
            ],
            3 => [
                'Lumayan, sesuai dengan harganya.',
                'Standar, tidak terlalu istimewa tapi juga tidak mengecewakan.',
                'Cukup baik, ada beberapa bagian yang kurang rapi.',
                'Oke lah untuk harga segini, tapi masih bisa lebih baik.',
                'Biasa saja, tidak ada yang spesial.',
            ],
            2 => [
                'Kurang memuaskan, kualitas tidak sesuai ekspektasi.',
                'Ada beberapa cacat yang cukup mengganggu.',
                'Pengerjaan kurang rapi, banyak bagian yang tidak presisi.',
                'Tidak worth it untuk harganya.',
                'Bahan terasa kurang berkualitas.',
            ],
            1 => [
                'Sangat mengecewakan! Kualitas jauh dari foto produk.',
                'Banyak cacat dan pengerjaan sangat tidak rapi.',
                'Tidak recommended. Buang-buang uang saja.',
                'Produk rusak saat diterima dan tidak ada kompensasi.',
                'Kualitas buruk sekali, tidak sesuai deskripsi.',
            ],
        ];

        return $reviews[$rating][array_rand($reviews[$rating])];
    }
}
