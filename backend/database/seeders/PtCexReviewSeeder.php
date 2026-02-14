<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerReview;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;

class PtCexReviewSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('⭐ Starting PT CEX Product Reviews Seeder...');

        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();

        if (!$tenant) {
            $this->command->error('❌ Custom Etching Xenial tenant not found!');
            return;
        }

        // Get all PT CEX products
        $products = Product::where('tenant_id', $tenant->id)
            ->where('status', 'published')
            ->get();

        if ($products->isEmpty()) {
            $this->command->error('❌ No products found for PT CEX!');
            return;
        }

        // Get or create customers for reviews
        $customers = Customer::where('tenant_id', $tenant->id)->take(10)->get();

        if ($customers->isEmpty()) {
            $this->command->warn('⚠️  No customers found, creating sample customers...');
            $customers = $this->createSampleCustomers($tenant);
        }

        $reviewCount = 0;

        foreach ($products as $product) {
            // Random 2-5 reviews per product
            $numReviews = rand(2, 5);

            for ($i = 0; $i < $numReviews; $i++) {
                $customer = $customers->random();
                $rating = $this->getWeightedRating(); // Mostly 4-5 stars

                CustomerReview::create([
                    'uuid' => Str::uuid()->toString(),
                    'tenant_id' => $tenant->id,
                    'product_id' => $product->id,
                    'customer_id' => $customer->id,
                    'rating' => $rating,
                    'title' => $this->getReviewTitle($rating),
                    'content' => $this->getReviewComment($rating, $product->name),
                    'is_verified_purchase' => rand(0, 100) > 20, // 80% verified
                    'is_approved' => true,
                    'helpful_count' => rand(0, 15),
                    'created_at' => Carbon::now()->subDays(rand(1, 180)),
                    'updated_at' => Carbon::now()->subDays(rand(0, 30)),
                ]);

                $reviewCount++;
            }
        }

        $this->command->info("✅ Successfully created {$reviewCount} reviews for " . $products->count() . " products!");
    }

    private function createSampleCustomers($tenant)
    {
        $customers = collect();
        $names = [
            'Budi Santoso', 'Siti Nurhaliza', 'Ahmad Wijaya', 'Dewi Lestari',
            'Rudi Hartono', 'Maya Sari', 'Eko Prasetyo', 'Rina Kusuma',
            'Agus Setiawan', 'Linda Wijayanti'
        ];

        foreach ($names as $name) {
            $customer = Customer::create([
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'name' => $name,
                'email' => strtolower(str_replace(' ', '.', $name)) . '@example.com',
                'phone' => '08' . rand(1000000000, 9999999999),
                'status' => 'active',
                'created_at' => Carbon::now()->subDays(rand(30, 365)),
            ]);
            $customers->push($customer);
        }

        return $customers;
    }

    private function getWeightedRating(): int
    {
        $rand = rand(1, 100);
        
        if ($rand <= 50) return 5; // 50% chance of 5 stars
        if ($rand <= 80) return 4; // 30% chance of 4 stars
        if ($rand <= 95) return 3; // 15% chance of 3 stars
        if ($rand <= 98) return 2; // 3% chance of 2 stars
        return 1; // 2% chance of 1 star
    }

    private function getReviewTitle(int $rating): string
    {
        $titles = [
            5 => [
                'Kualitas Luar Biasa!',
                'Sangat Puas dengan Hasilnya',
                'Produk Premium, Hasil Memuaskan',
                'Rekomendasi Banget!',
                'Etching Detail dan Rapi',
            ],
            4 => [
                'Bagus, Sesuai Ekspektasi',
                'Kualitas Baik',
                'Puas dengan Produknya',
                'Hasil Memuaskan',
                'Worth It!',
            ],
            3 => [
                'Cukup Baik',
                'Standar Kualitas',
                'Lumayan',
                'Sesuai Harga',
                'Oke Lah',
            ],
            2 => [
                'Kurang Memuaskan',
                'Ada yang Perlu Diperbaiki',
                'Biasa Saja',
                'Agak Mengecewakan',
            ],
            1 => [
                'Tidak Sesuai Harapan',
                'Kecewa',
                'Perlu Banyak Perbaikan',
            ],
        ];

        return $titles[$rating][array_rand($titles[$rating])];
    }

    private function getReviewComment(int $rating, string $productName): string
    {
        $comments = [
            5 => [
                "Sangat puas dengan kualitas etching pada {$productName}. Detail sangat rapi dan presisi. Packaging juga aman. Recommended untuk corporate gift!",
                "Hasil etching sangat detail dan tajam. Material premium dan finishing sempurna. Delivery tepat waktu. Pasti order lagi!",
                "Kualitas laser etching nya luar biasa! Setiap detail terlihat jelas. Cocok banget untuk penghargaan karyawan. Terima kasih!",
                "Produk berkualitas tinggi dengan harga yang reasonable. Proses pemesanan mudah dan customer service responsif. Highly recommended!",
                "Etching nya sangat presisi dan rapi. Material yang digunakan premium. Packaging rapih dan aman. Sangat puas!",
            ],
            4 => [
                "Produk bagus, kualitas etching rapi. Delivery agak lama tapi hasilnya memuaskan. Overall good!",
                "Kualitas baik sesuai ekspektasi. Harga kompetitif. Mungkin bisa lebih cepat untuk delivery nya.",
                "Hasil etching detail dan bagus. Material solid. Cuma packaging bisa lebih baik lagi. Tapi overall puas!",
                "Produk sesuai deskripsi. Kualitas etching bagus dan rapi. Proses order mudah. Recommended!",
            ],
            3 => [
                "Produk standar, sesuai harga. Kualitas cukup baik tapi tidak istimewa. Delivery tepat waktu.",
                "Lumayan bagus, tapi ada beberapa detail yang kurang rapi. Overall masih oke lah untuk harga segini.",
                "Kualitas standar, tidak mengecewakan tapi juga tidak wow. Sesuai ekspektasi untuk harga nya.",
            ],
            2 => [
                "Kualitas kurang memuaskan. Ada beberapa bagian etching yang kurang rapi. Perlu improvement.",
                "Agak mengecewakan. Hasil tidak sedetail yang diharapkan. Mungkin perlu quality control lebih ketat.",
            ],
            1 => [
                "Sangat mengecewakan. Kualitas jauh dari ekspektasi. Tidak sesuai dengan sample yang ditunjukkan.",
            ],
        ];

        return $comments[$rating][array_rand($comments[$rating])];
    }
}
