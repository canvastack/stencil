<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;

class PtCexProductSeeder extends Seeder
{
    private array $productData = [
        '01 - OMODA' => [
            'name' => 'Plakat Akrilik OMODA Premium',
            'category' => 'Award Plakat',
            'description' => 'Plakat akrilik premium dengan desain eksklusif untuk OMODA. Material akrilik berkualitas tinggi dengan proses etching presisi untuk hasil yang elegan dan tahan lama. Cocok untuk penghargaan partnership, dealer terbaik, atau achievement awards.',
            'price_range' => [500000, 1500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic',
            'images' => ['Omoda - 01.jpg', 'Omoda - 02.jpg', 'Omoda - 03.jpg', 'Omoda - 04.jpg', 'Omoda - 05.jpg'],
        ],
        '02 - KOBELCO Contest 2019' => [
            'name' => 'Trophy KOBELCO Contest Achievement',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy prestisius untuk KOBELCO Contest 2019 dengan kombinasi material logam dan akrilik. Desain unik dengan detail etching yang rumit, menggambarkan excellence dan prestasi dalam industri. Tersedia dalam berbagai kategori pemenang.',
            'price_range' => [1200000, 3500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Metal + Acrylic',
            'images' => ['KOBELCO Contest 2019 - 01.jpg', 'KOBELCO Contest 2019 - 02.jpg', 'KOBELCO Contest 2019 - 03.jpg', 'KOBELCO Contest 2019 - 04.jpg', 'KOBELCO Contest 2019 - 05.jpg', 'KOBELCO Contest 2019 - 06.jpg'],
        ],
        '03 - OHLALA Platinum' => [
            'name' => 'Plakat Platinum OHLALA Partnership',
            'category' => 'Award Plakat',
            'description' => 'Plakat platinum eksklusif untuk partnership OHLALA dengan finishing mewah. Material premium dengan teknik etching advanced untuk detail sempurna. Ideal untuk penghargaan mitra strategis dan milestone bisnis penting.',
            'price_range' => [1800000, 4000000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Platinum Coated Metal',
            'images' => ['OHLALA Platinum - 01.jpg', 'OHLALA Platinum - 02.jpg'],
        ],
        '04 - STAR LEADER' => [
            'name' => 'Trophy Star Leader Achievement',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy bergengsi untuk Star Leader dengan desain bintang yang simbolis. Material berkualitas tinggi dengan etching presisi tinggi. Cocok untuk penghargaan leadership excellence dan top performer.',
            'price_range' => [1500000, 3000000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Crystal + Metal',
            'images' => ['STAR LEADER - 01.jpg', 'STAR LEADER - 02.jpg'],
        ],
        '05 - INTEL PARTNER Alliance' => [
            'name' => 'Plakat Intel Partner Alliance Recognition',
            'category' => 'Award Plakat',
            'description' => 'Plakat corporate untuk Intel Partner Alliance dengan desain modern dan profesional. Material premium dengan logo dan branding detail. Menggambarkan kemitraan strategis teknologi tingkat dunia.',
            'price_range' => [2000000, 4500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Glass + Metal',
            'images' => ['INTEL PARTNER Alliance - 01.jpg', 'INTEL PARTNER Alliance - 02.jpg'],
        ],
        '06 - RG' => [
            'name' => 'Plakat RG Corporate Award',
            'category' => 'Award Plakat',
            'description' => 'Plakat corporate RG dengan desain elegan dan timeless. Material berkualitas dengan etching detail untuk branding yang kuat. Tersedia dalam berbagai size dan finishing options.',
            'price_range' => [800000, 2500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic + Wood',
            'images' => ['RG - 01.jpg', 'RG - 02.jpg', 'RG - 03.jpg', 'RG - 04.jpg', 'RG - 05.jpg', 'RG - 06.jpg'],
        ],
        '07 - Sleep Cat' => [
            'name' => 'Plakat Akrilik Sleep Cat Creative',
            'category' => 'Custom Etching',
            'description' => 'Plakat kreatif dengan desain Sleep Cat yang unik dan memorable. Material akrilik dengan teknik etching artistic untuk hasil yang eye-catching. Perfect untuk brand yang ingin tampil berbeda.',
            'price_range' => [600000, 1800000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic',
            'images' => ['Sleep Cat - 01.jpg', 'Sleep Cat - 02.jpg'],
        ],
        '08 - KPRI' => [
            'name' => 'Plakat Appreciation KPRI',
            'category' => 'Award Plakat',
            'description' => 'Plakat apresiasi untuk KPRI dengan desain formal dan berkelas. Material pilihan dengan etching detail institusi. Cocok untuk penghargaan keanggotaan, kontribusi, dan pencapaian organisasi.',
            'price_range' => [700000, 2000000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Wood + Brass',
            'images' => ['KPRI - 01.jpg', 'KPRI - 02.jpg', 'KPRI - 03.jpg'],
        ],
        '09 - 30 Beyond Partnership' => [
            'name' => 'Plakat 30 Years Beyond Partnership',
            'category' => 'Award Plakat',
            'description' => 'Plakat spesial untuk merayakan 30 tahun partnership yang luar biasa. Desain eksklusif dengan simbol longevity dan kemitraan berkelanjutan. Material premium dengan craftsmanship detail.',
            'price_range' => [1500000, 3500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Crystal + Gold Plating',
            'images' => ['30 Beyond Partnership - 01.jpg', '30 Beyond Partnership - 02.jpg'],
        ],
        '10 - PUSDIPATIN' => [
            'name' => 'Plakat Penghargaan PUSDIPATIN',
            'category' => 'Award Plakat',
            'description' => 'Plakat penghargaan untuk PUSDIPATIN (Pusat Pendidikan dan Pelatihan Industri) dengan desain resmi dan formal. Material berkualitas dengan logo dan seal institusi yang detail.',
            'price_range' => [900000, 2200000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Glass + Metal Frame',
            'images' => ['PUSDIPATIN - 01.jpg', 'PUSDIPATIN - 02.jpg'],
        ],
        '11 - UNET SISTELINDO' => [
            'name' => 'Trophy UNET SISTELINDO Achievement',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy achievement UNET SISTELINDO dengan desain modern dan futuristik. Material premium dengan finishing metallic yang mencerminkan excellence dalam teknologi dan sistem informasi.',
            'price_range' => [1200000, 2800000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Metal + Acrylic',
            'images' => ['UNET SISTELINDO - 01.jpg', 'UNET SISTELINDO - 02.jpg'],
        ],
        '12 - IOW' => [
            'name' => 'Plakat IOW Corporate Recognition',
            'category' => 'Award Plakat',
            'description' => 'Plakat corporate IOW dengan desain minimalis dan elegan. Material berkualitas tinggi dengan etching presisi untuk branding yang clean dan professional.',
            'price_range' => [800000, 2000000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic',
            'images' => ['IOW - 01.jpg', 'IOW - 02.jpg'],
        ],
        '13 - UNDSS' => [
            'name' => 'Plakat UNDSS Security Excellence',
            'category' => 'Award Plakat',
            'description' => 'Plakat untuk UNDSS (United Nations Department of Safety and Security) dengan desain formal dan authoritative. Material premium dengan seal dan emblem yang detailed.',
            'price_range' => [1500000, 3500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Glass + Metal',
            'images' => ['UNDSS - 01.jpg', 'UNDSS - 02.jpg'],
        ],
        '14 - 911 SECSYS' => [
            'name' => 'Plakat 911 SECSYS Security Award',
            'category' => 'Award Plakat',
            'description' => 'Plakat security award 911 SECSYS dengan desain yang merepresentasikan protection dan reliability. Material solid dengan etching detail untuk professional security recognition.',
            'price_range' => [900000, 2200000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Metal + Wood',
            'images' => ['911 SECSYS - 01.jpg', '911 SECSYS - 02.jpg'],
        ],
        '15 - BIOVIT' => [
            'name' => 'Trophy BIOVIT Healthcare Excellence',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy prestisius BIOVIT untuk healthcare excellence dengan desain yang mencerminkan care dan innovation. Material berkualitas tinggi dengan finishing yang elegan.',
            'price_range' => [1100000, 2600000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Crystal + Metal Base',
            'images' => ['BIOVIT - 01.jpg', 'BIOVIT - 02.jpg', 'BIOVIT - 03.jpg', 'BIOVIT - 04.jpg'],
        ],
        '16 - MOI' => [
            'name' => 'Plakat MOI Industry Recognition',
            'category' => 'Award Plakat',
            'description' => 'Plakat MOI (Ministry of Industry) dengan desain resmi dan formal untuk pengakuan industri. Material premium dengan logo kementerian yang detail dan presisi.',
            'price_range' => [1300000, 3000000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Wood + Brass Plating',
            'images' => ['MOI - 01.jpg', 'MOI - 02.jpg'],
        ],
        '17 - AFT Juanda' => [
            'name' => 'Plakat AFT Juanda Airport Achievement',
            'category' => 'Award Plakat',
            'description' => 'Plakat special untuk AFT Juanda Airport dengan desain aviation-themed. Material premium dengan etching detail yang menggambarkan excellence dalam layanan bandara.',
            'price_range' => [1000000, 2500000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic + Metal',
            'images' => ['AFT Juanda.jpg'],
        ],
        '18 - Balletina' => [
            'name' => 'Trophy Balletina Dance Excellence',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy artistic Balletina untuk dance excellence dengan desain graceful dan elegant. Material berkualitas dengan detailing yang mencerminkan keindahan seni tari.',
            'price_range' => [800000, 2200000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Crystal + Metal',
            'images' => ['Balletina - 01.jpg', 'Balletina - 02.jpg', 'Balletina - 03.jpg', 'Balletina - 04.jpg', 'Balletina - 05.jpg', 'Balletina - 06.jpg', 'Balletina - 07.jpg'],
        ],
        '18 - K' => [
            'name' => 'Plakat K Corporate Minimalist',
            'category' => 'Award Plakat',
            'description' => 'Plakat minimalist dengan branding "K" yang clean dan modern. Material berkualitas dengan desain simple yet sophisticated. Cocok untuk corporate branding yang strong dan memorable.',
            'price_range' => [600000, 1800000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic',
            'images' => ['K - 01.jpg', 'K - 02.jpg'],
        ],
        '19 - LADOPIND' => [
            'name' => 'Plakat LADOPIND Defense Award',
            'category' => 'Award Plakat',
            'description' => 'Plakat defense award LADOPIND dengan desain formal dan authoritative. Material premium dengan emblem dan detail militer yang presisi.',
            'price_range' => [1400000, 3200000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Metal + Wood Base',
            'images' => ['LADOPIND - 01.jpg', 'LADOPIND - 02.jpg'],
        ],
        '20 - 90 Hari Emas' => [
            'name' => 'Plakat 90 Hari Emas Achievement',
            'category' => 'Award Plakat',
            'description' => 'Plakat spesial untuk program 90 Hari Emas dengan desain yang mencerminkan golden achievement period. Material berkualitas dengan gold accent dan etching detail.',
            'price_range' => [900000, 2300000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Acrylic + Gold Plating',
            'images' => ['90 Hari Emas - 01.jpg', '90 Hari Emas - 02.jpg', '90 Hari Emas - 03.jpg', '90 Hari Emas - 04.jpg', '90 Hari Emas - 05.jpg'],
        ],
        '21 - The IOIC' => [
            'name' => 'Trophy The IOIC Excellence Award',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy eksklusif The IOIC (International Organization) dengan desain international-standard. Material premium dengan craftsmanship detail untuk global recognition.',
            'price_range' => [1600000, 3800000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Crystal + Gold Metal',
            'images' => ['The IOIC - 01.jpg', 'The IOIC - 02.jpg', 'The IOIC - 03.jpg'],
        ],
        '22 - HESS' => [
            'name' => 'Plakat HESS Corporate Partnership',
            'category' => 'Award Plakat',
            'description' => 'Plakat corporate HESS dengan desain professional dan clean. Material berkualitas tinggi dengan branding detail untuk partnership recognition.',
            'price_range' => [1000000, 2400000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Glass + Metal',
            'images' => ['HESS - 01.jpg', 'HESS - 02.jpg'],
        ],
        '23 - CHD' => [
            'name' => 'Trophy CHD Achievement Award',
            'category' => 'Trophy & Medal',
            'description' => 'Trophy achievement CHD dengan desain modern dan elegant. Material premium dengan finishing berkualitas untuk penghargaan korporat dan institusi.',
            'price_range' => [1100000, 2700000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Metal + Acrylic',
            'images' => ['CHD - 01.jpg', 'CHD - 02.jpg', 'CHD - 03.jpg', 'CHD - 04.jpg'],
        ],
        '24 - Tree' => [
            'name' => 'Plakat Tree Environmental Award',
            'category' => 'Custom Etching',
            'description' => 'Plakat environmental award dengan desain tree/pohon yang simbolis. Material eco-friendly dengan etching artistic untuk penghargaan sustainability dan green initiatives.',
            'price_range' => [750000, 2100000],
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Recycled Acrylic + Wood',
            'images' => ['Tree - 01.jpg', 'Tree - 02.jpg', 'Tree - 03.jpg', 'Tree - 04.jpg'],
        ],
    ];

    public function run(): void
    {
        $this->command->info('🎨 Starting PT CEX Product Seeder with Real Images...');

        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();

        if (!$tenant) {
            $this->command->error('❌ PT Custom Etching Xenial tenant not found!');
            return;
        }

        $this->command->info("✅ Found tenant: {$tenant->name}");

        $this->command->info('🗑️  Clearing existing PT CEX products...');
        $deletedCount = Product::where('tenant_id', $tenant->id)->delete();
        $this->command->info("   Deleted {$deletedCount} existing products");

        $categories = ProductCategory::where('tenant_id', $tenant->id)->get();

        if ($categories->isEmpty()) {
            $this->command->error('❌ No categories found for PT CEX. Run CategorySeeder first!');
            return;
        }

        $this->command->info("📦 Creating products from {$this->getTotalFolders()} product folders...");

        $productIndex = 1;
        foreach ($this->productData as $folder => $data) {
            $category = $this->findBestCategory($categories, $data['category']);

            if (!$category) {
                $this->command->warn("   ⚠️  Category '{$data['category']}' not found for {$data['name']}, using first available");
                $category = $categories->first();
            }

            $images = array_map(
                fn($img) => '/images/products/' . $folder . '/' . $img,
                $data['images']
            );

            $price = rand($data['price_range'][0], $data['price_range'][1]);
            $stock = rand(5, 50);
            
            $tenantPrefix = 'CEX';
            $sku = $tenantPrefix . '-' . strtoupper(substr($category->slug, 0, 3)) . '-' . str_pad($productIndex, 4, '0', STR_PAD_LEFT);

            Product::create([
                'tenant_id' => $tenant->id,
                'name' => $data['name'],
                'slug' => Str::slug($data['name']) . '-' . $productIndex,
                'sku' => $sku,
                'description' => $data['description'],
                'category_id' => $category->id,
                'price' => $price,
                'currency' => 'IDR',
                'status' => 'published',
                'type' => $data['type'],
                'stock_quantity' => $stock,
                'low_stock_threshold' => 5,
                'images' => $images,
                'categories' => [$category->slug, 'featured'],
                'tags' => ['custom-etching', 'corporate-award', 'premium', 'customizable'],
                'dimensions' => [
                    'length' => rand(20, 50),
                    'width' => rand(15, 40),
                    'height' => rand(2, 8),
                    'weight' => rand(500, 3000) / 100
                ],
                'customizable' => $data['customizable'] ?? false,
                'material' => $data['material'] ?? null,
                'track_inventory' => true,
                'created_at' => Carbon::now()->subDays(rand(30, 365)),
                'updated_at' => Carbon::now()->subDays(rand(0, 30))
            ]);

            $this->command->info("   ✓ Created: {$data['name']} (SKU: {$sku}) with " . count($images) . " images");
            $productIndex++;
        }

        $this->command->info("✅ Successfully seeded {$productIndex} products for PT CEX!");
        $this->command->info("📊 Total images mapped: {$this->getTotalImages()}");
    }

    private function findBestCategory($categories, $categoryName): ?ProductCategory
    {
        $categoryMap = [
            'Award Plakat' => ['plakat', 'award', 'penghargaan'],
            'Trophy & Medal' => ['trophy', 'medali', 'medal', 'trofi'],
            'Custom Etching' => ['custom', 'etching', 'etsa'],
        ];

        $keywords = $categoryMap[$categoryName] ?? [strtolower($categoryName)];

        foreach ($categories as $category) {
            foreach ($keywords as $keyword) {
                if (str_contains(strtolower($category->name), $keyword) || 
                    str_contains(strtolower($category->slug), $keyword)) {
                    return $category;
                }
            }
        }

        return null;
    }

    private function getTotalFolders(): int
    {
        return count($this->productData);
    }

    private function getTotalImages(): int
    {
        $total = 0;
        foreach ($this->productData as $data) {
            $total += count($data['images']);
        }
        return $total;
    }
}
