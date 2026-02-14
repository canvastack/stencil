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
            'name' => 'OMODA',
            'category' => 'Lapel Pin',
            'description' => 'Pin premium dengan desain eksklusif untuk OMODA. Material Stainless Steel 304 anti karat dengan proses laser etching presisi dan enamel fill untuk hasil yang elegan dan tahan lama. Cocok untuk employee badge, member pin, atau corporate gift.',
            'price' => 32000,
            'type' => 'physical',
            'business_type' => 'metal_etching',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['2.5x2 cm', '3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['Omoda - 01.jpg', 'Omoda - 02.jpg', 'Omoda - 03.jpg', 'Omoda - 04.jpg', 'Omoda - 05.jpg'],
        ],
        '02 - KOBELCO Contest 2019' => [
            'name' => 'KOBELCO Contest 2019',
            'category' => 'Lapel Pin',
            'description' => 'Pin prestisius untuk KOBELCO Contest 2019 dengan material Kuningan Emas (Brass Gold). Desain unik dengan detail deep etching yang rumit, menggambarkan excellence dan prestasi dalam industri. Tersedia dalam berbagai kategori pemenang.',
            'price' => 58000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Kuningan Emas (Brass Gold)',
            'size' => '5x4 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Butterfly Clutch',
            'images' => ['KOBELCO Contest 2019 - 01.jpg', 'KOBELCO Contest 2019 - 02.jpg', 'KOBELCO Contest 2019 - 03.jpg', 'KOBELCO Contest 2019 - 04.jpg', 'KOBELCO Contest 2019 - 05.jpg', 'KOBELCO Contest 2019 - 06.jpg'],
        ],
        '03 - OHLALA Platinum' => [
            'name' => 'OH LA LA',
            'category' => 'Lapel Pin',
            'description' => 'Pin eksklusif untuk partnership OHLALA dengan finishing mewah. Material Stainless Steel 304 anti karat dengan teknik laser etching advanced untuk detail sempurna. Ideal untuk member pin, partnership recognition, dan milestone bisnis penting.',
            'price' => 35000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['OHLALA Platinum - 01.jpg', 'OHLALA Platinum - 02.jpg'],
        ],
        '04 - STAR LEADER' => [
            'name' => 'STAR LEADER',
            'category' => 'Lapel Pin',
            'description' => 'Pin bergengsi untuk Star Leader dengan desain bintang yang simbolis. Material Kuningan Emas (Brass Gold) berkualitas tinggi dengan deep etching presisi tinggi. Cocok untuk penghargaan leadership excellence dan top performer recognition.',
            'price' => 48000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Kuningan Emas (Brass Gold)',
            'size' => '4x3 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Butterfly Clutch',
            'images' => ['STAR LEADER - 01.jpg', 'STAR LEADER - 02.jpg'],
        ],
        '05 - INTEL PARTNER Alliance' => [
            'name' => 'Intel Partner Alliance',
            'category' => 'Lapel Pin',
            'description' => 'Pin corporate untuk Intel Partner Alliance dengan desain modern dan profesional. Material Stainless Steel 304 anti karat dengan logo dan branding detail. Menggambarkan kemitraan strategis teknologi tingkat dunia.',
            'price' => 42000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '5x4 cm',
            'thickness' => '0.7 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['INTEL PARTNER Alliance - 01.jpg', 'INTEL PARTNER Alliance - 02.jpg'],
        ],
        '06 - RG' => [
            'name' => 'R&G Premium',
            'category' => 'Premium Pin',
            'description' => 'Pin corporate R&G dengan desain elegan dan timeless. Material Brass Gold + Crystal berkualitas dengan precision etching dan epoxy dome untuk 3D effect. Tersedia dalam berbagai size dan finishing options.',
            'price' => 78000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Brass Gold + Crystal',
            'size' => '5x4 cm',
            'thickness' => '1.0 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Magnetic',
            'images' => ['RG - 01.jpg', 'RG - 02.jpg', 'RG - 03.jpg', 'RG - 04.jpg', 'RG - 05.jpg', 'RG - 06.jpg'],
        ],
        '07 - Sleep Cat' => [
            'name' => 'Sleep Cat',
            'category' => 'Lapel Pin',
            'description' => 'Pin kreatif dengan desain Sleep Cat yang unik dan memorable. Material Stainless Steel 304 anti karat dengan teknik laser etching artistic untuk hasil yang eye-catching. Perfect untuk brand yang ingin tampil berbeda.',
            'price' => 25000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '3x2.5 cm',
            'thickness' => '0.5 mm',
            'available_sizes' => ['2.5x2 cm', '3x2.5 cm', '4x3 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Safety Pin',
            'images' => ['Sleep Cat - 01.jpg', 'Sleep Cat - 02.jpg'],
        ],
        '08 - KPRI' => [
            'name' => 'KPRI',
            'category' => 'Lapel Pin',
            'description' => 'Pin apresiasi untuk KPRI dengan desain formal dan berkelas. Material Stainless Steel 304 anti karat dengan laser etching detail institusi. Cocok untuk member badge, employee pin, dan recognition program.',
            'price' => 30000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Safety Pin',
            'images' => ['KPRI - 01.jpg', 'KPRI - 02.jpg', 'KPRI - 03.jpg'],
        ],
        '09 - 30 Beyond Partnership' => [
            'name' => '30 Beyond Partnership',
            'category' => 'Lapel Pin',
            'description' => 'Pin spesial untuk merayakan 30 tahun partnership yang luar biasa. Desain eksklusif dengan simbol longevity dan kemitraan berkelanjutan. Material Kuningan Emas (Brass Gold) premium dengan deep etching craftsmanship detail.',
            'price' => 62000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Kuningan Emas (Brass Gold)',
            'size' => '5x4 cm',
            'thickness' => '0.9 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Butterfly Clutch',
            'images' => ['30 Beyond Partnership - 01.jpg', '30 Beyond Partnership - 02.jpg'],
        ],
        '10 - PUSDIPATIN' => [
            'name' => 'Pusat Dipatrol Indo',
            'category' => 'Lapel Pin',
            'description' => 'Pin penghargaan untuk PUSDIPATIN (Pusat Dipatrol Industri) dengan desain resmi dan formal. Material Kuningan Emas (Brass Gold) berkualitas dengan logo dan seal institusi yang detail.',
            'price' => 45000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Kuningan Emas (Brass Gold)',
            'size' => '4x3 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['PUSDIPATIN - 01.jpg', 'PUSDIPATIN - 02.jpg'],
        ],
        '11 - UNET SISTELINDO' => [
            'name' => 'U|NET - Sistelindo',
            'category' => 'Lapel Pin',
            'description' => 'Pin achievement UNET SISTELINDO dengan desain modern dan futuristik. Material Stainless Steel 304 anti karat premium dengan finishing metallic yang mencerminkan excellence dalam teknologi dan sistem informasi.',
            'price' => 33000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['UNET SISTELINDO - 01.jpg', 'UNET SISTELINDO - 02.jpg'],
        ],
        '12 - MOI' => [
            'name' => 'MOI',
            'category' => 'Lapel Pin',
            'description' => 'Pin corporate MOI dengan desain minimalis dan elegan. Material Stainless Steel 304 anti karat berkualitas tinggi dengan laser etching presisi untuk branding yang clean dan professional.',
            'price' => 28000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '3x2.5 cm',
            'thickness' => '0.5 mm',
            'available_sizes' => ['2.5x2 cm', '3x2.5 cm', '4x3 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['MOI - 01.jpg', 'MOI - 02.jpg'],
        ],
        '13 - UNDSS' => [
            'name' => 'UNDSS Indo',
            'category' => 'Lapel Pin',
            'description' => 'Pin untuk UNDSS Indo (United Nations Department of Safety and Security Indonesia) dengan desain formal dan authoritative. Material Stainless Steel 304 anti karat premium dengan seal dan emblem yang detailed.',
            'price' => 38000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '5x4 cm',
            'thickness' => '0.7 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Safety Pin',
            'images' => ['UNDSS - 01.jpg', 'UNDSS - 02.jpg'],
        ],
        '14 - 911 SECSYS' => [
            'name' => '911 Security System',
            'category' => 'Lapel Pin',
            'description' => 'Pin security award 911 Security System dengan desain yang merepresentasikan protection dan reliability. Material Stainless Steel 304 anti karat solid dengan laser etching detail untuk professional security recognition.',
            'price' => 32000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['911 SECSYS - 01.jpg', '911 SECSYS - 02.jpg'],
        ],
        '15 - BIOVIT' => [
            'name' => 'Biovit Premium',
            'category' => 'Premium Pin',
            'description' => 'Pin prestisius Biovit untuk healthcare excellence dengan desain yang mencerminkan care dan innovation. Material Brass Gold + Resin berkualitas tinggi dengan epoxy dome finishing yang elegan.',
            'price' => 72000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Brass Gold + Resin',
            'size' => '5x4 cm',
            'thickness' => '1.0 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Magnetic',
            'images' => ['BIOVIT - 01.jpg', 'BIOVIT - 02.jpg', 'BIOVIT - 03.jpg', 'BIOVIT - 04.jpg'],
        ],
        '16 - MOI' => [
            'name' => 'Mall of Indonesia',
            'category' => 'Lapel Pin',
            'description' => 'Pin Mall of Indonesia dengan desain resmi dan formal untuk pengakuan industri. Material Kuningan Emas (Brass Gold) premium dengan logo yang detail dan presisi.',
            'price' => 55000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Kuningan Emas (Brass Gold)',
            'size' => '5x4 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['MOI - 01.jpg', 'MOI - 02.jpg'],
        ],
        '17 - AFT Juanda' => [
            'name' => 'AFT Juanda',
            'category' => 'Lapel Pin',
            'description' => 'Pin special untuk AFT Juanda Airport dengan desain aviation-themed. Material Stainless Steel 304 anti karat premium dengan laser etching detail yang menggambarkan excellence dalam layanan bandara.',
            'price' => 36000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['AFT Juanda.jpg'],
        ],
        '18 - Balletina' => [
            'name' => 'Balletina',
            'category' => 'Lapel Pin',
            'description' => 'Pin artistic Balletina untuk dance excellence dengan desain graceful dan elegant. Material Kuningan Emas (Brass Gold) berkualitas dengan detailing yang mencerminkan keindahan seni tari.',
            'price' => 50000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Kuningan Emas (Brass Gold)',
            'size' => '4x3 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Butterfly Clutch',
            'images' => ['Balletina - 01.jpg', 'Balletina - 02.jpg', 'Balletina - 03.jpg', 'Balletina - 04.jpg', 'Balletina - 05.jpg', 'Balletina - 06.jpg', 'Balletina - 07.jpg'],
        ],
        '18 - K' => [
            'name' => 'K - Corp',
            'category' => 'Lapel Pin',
            'description' => 'Pin minimalist dengan branding "K - Corp" yang clean dan modern. Material Stainless Steel 304 anti karat berkualitas dengan desain simple yet sophisticated. Cocok untuk corporate branding yang strong dan memorable.',
            'price' => 26000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '3x2.5 cm',
            'thickness' => '0.5 mm',
            'available_sizes' => ['2.5x2 cm', '3x2.5 cm', '4x3 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['K - 01.jpg', 'K - 02.jpg'],
        ],
        '19 - LADOPIND' => [
            'name' => 'Lembaga Anti Doping',
            'category' => 'Lapel Pin',
            'description' => 'Pin defense award Lembaga Anti Doping dengan desain formal dan authoritative. Material Stainless Steel 304 anti karat premium dengan emblem dan detail yang presisi.',
            'price' => 40000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '5x4 cm',
            'thickness' => '0.7 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Safety Pin',
            'images' => ['LADOPIND - 01.jpg', 'LADOPIND - 02.jpg'],
        ],
        '20 - 90 Hari Emas' => [
            'name' => '90 Hari Emas Premium',
            'category' => 'Premium Pin',
            'description' => 'Pin spesial untuk program 90 Hari Emas dengan desain yang mencerminkan golden achievement period. Material Brass Gold + Resin berkualitas dengan gold accent, epoxy dome dan etching detail.',
            'price' => 68000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Brass Gold + Resin',
            'size' => '5x4 cm',
            'thickness' => '1.0 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Deluxe Magnetic',
            'images' => ['90 Hari Emas - 01.jpg', '90 Hari Emas - 02.jpg', '90 Hari Emas - 03.jpg', '90 Hari Emas - 04.jpg', '90 Hari Emas - 05.jpg'],
        ],
        '21 - The IOIC' => [
            'name' => 'Internal Audio Institute',
            'category' => 'Lapel Pin',
            'description' => 'Pin eksklusif Internal Audio Institute dengan desain international-standard. Material Stainless Steel 304 anti karat premium dengan precision etching detail untuk global recognition.',
            'price' => 40000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '5x4 cm',
            'thickness' => '0.7 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['The IOIC - 01.jpg', 'The IOIC - 02.jpg', 'The IOIC - 03.jpg'],
        ],
        '22 - HESS' => [
            'name' => 'HESS',
            'category' => 'Lapel Pin',
            'description' => 'Pin corporate HESS dengan desain professional dan clean. Material Stainless Steel 304 anti karat berkualitas tinggi dengan branding detail untuk partnership recognition.',
            'price' => 35000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['HESS - 01.jpg', 'HESS - 02.jpg'],
        ],
        '23 - CHD' => [
            'name' => 'CHD',
            'category' => 'Lapel Pin',
            'description' => 'Pin achievement CHD dengan desain modern dan elegant. Material Stainless Steel 304 anti karat premium dengan finishing berkualitas untuk penghargaan korporat dan institusi.',
            'price' => 33000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Butterfly Clutch',
            'images' => ['CHD - 01.jpg', 'CHD - 02.jpg', 'CHD - 03.jpg', 'CHD - 04.jpg'],
        ],
        '24 - Tree' => [
            'name' => 'Tree',
            'category' => 'Lapel Pin',
            'description' => 'Pin environmental award dengan desain tree/pohon yang simbolis. Material Stainless Steel 304 anti karat dengan laser etching artistic untuk penghargaan sustainability dan green initiatives.',
            'price' => 32000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '4x3 cm',
            'thickness' => '0.6 mm',
            'available_sizes' => ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Safety Pin',
            'images' => ['Tree - 01.jpg', 'Tree - 02.jpg', 'Tree - 03.jpg', 'Tree - 04.jpg'],
        ],
        '25 - FITTIES' => [
            'name' => 'Fitties',
            'category' => 'Metal Plate',
            'description' => 'Plat metal Fitties dengan desain sporty dan energetic untuk fitness & wellness industry. Material Stainless Steel 304 anti karat premium dengan laser etching presisi tinggi. Cocok untuk gym membership badge, fitness achievement award, dan wellness program recognition.',
            'price' => 35000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '5x4 cm',
            'thickness' => '0.7 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', '6x5 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Magnetic',
            'images' => ['Fitties - 01.jpg', 'Fitties - 02.jpg', 'Fitties - 03.jpg'],
        ],
        '26 - CORONA EXTRA' => [
            'name' => 'Corona Extra',
            'category' => 'Metal Plate',
            'description' => 'Plat metal Corona Extra dengan branding iconic beer brand. Material Stainless Steel 304 anti karat berkualitas tinggi dengan logo detail dan finishing premium. Perfect untuk bar signage, promotional merchandise, dan collector items.',
            'price' => 42000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '6x5 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['5x4 cm', '6x5 cm', '8x6 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Screw Mount',
            'images' => ['Corona Extra - 01.jpg', 'Corona Extra - 02.jpg'],
        ],
        '27 - BINTANG' => [
            'name' => 'Bintang',
            'category' => 'Metal Plate',
            'description' => 'Plat metal Bintang Beer dengan desain klasik Indonesia\'s favorite beer brand. Material Stainless Steel 304 anti karat premium dengan laser etching detail logo yang presisi. Ideal untuk bar decoration, promotional display, dan brand merchandise.',
            'price' => 40000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '6x5 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['5x4 cm', '6x5 cm', '8x6 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Screw Mount',
            'images' => ['Bintang - 01.jpg', 'Bintang - 02.jpg'],
        ],
        '28 - STOP' => [
            'name' => 'STOP Sign',
            'category' => 'Metal Plate',
            'description' => 'Plat metal STOP sign dengan desain safety & warning signage. Material Stainless Steel 304 anti karat solid dengan laser etching bold dan clear visibility. Essential untuk industrial safety, traffic control, dan workplace hazard warning.',
            'price' => 38000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '8x8 cm',
            'thickness' => '1.0 mm',
            'available_sizes' => ['6x6 cm', '8x8 cm', '10x10 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Screw Mount',
            'images' => ['Stop - 01.jpg', 'Stop - 02.jpg'],
        ],
        '29 - GUINNESS' => [
            'name' => 'Guinness',
            'category' => 'Metal Plate',
            'description' => 'Plat metal Guinness dengan branding legendary Irish stout beer. Material Stainless Steel 304 anti karat premium dengan iconic harp logo dan signature typography. Perfect untuk pub decoration, bar signage, dan premium merchandise collection.',
            'price' => 45000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '6x5 cm',
            'thickness' => '0.8 mm',
            'available_sizes' => ['5x4 cm', '6x5 cm', '8x6 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Screw Mount',
            'images' => ['Guinness - 01.jpg', 'Guinness - 02.jpg'],
        ],
        '30 - KIDZANIA' => [
            'name' => 'Kidzania',
            'category' => 'Metal Plate',
            'description' => 'Plat metal Kidzania dengan desain fun dan colorful untuk children\'s edutainment center. Material Stainless Steel 304 anti karat berkualitas dengan logo playful dan child-friendly design. Ideal untuk facility signage, role-play props, dan educational merchandise.',
            'price' => 36000,
            'type' => 'physical',
            'customizable' => true,
            'material' => 'Stainless Steel 304 (Anti Karat)',
            'size' => '5x4 cm',
            'thickness' => '0.7 mm',
            'available_sizes' => ['4x3 cm', '5x4 cm', '6x5 cm', 'custom'],
            'min_order' => 30,
            'backing_type' => 'Magnetic',
            'images' => ['Kidzania - 01.jpg', 'Kidzania - 02.jpg'],
        ],
    ];

    public function run(): void
    {
        $this->command->info('🎨 Starting PT CEX Product Seeder with Real Images...');

        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();

        if (!$tenant) {
            $this->command->error('❌ Custom Etching Xenial tenant not found!');
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

        // STRATEGY: Make these 30 products the NEWEST products
        // Product #1 (OMODA) = 30 days ago
        // Product #30 (KIDZANIA) = now (most recent)
        // This ensures they appear first when sorted by created_at DESC
        
        $totalProducts = count($this->productData);
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

            $price = $data['price'] ?? 0;
            $stock = rand(50, 200); // Higher stock for small pins
            
            $tenantPrefix = 'CEX';
            $sku = $tenantPrefix . '-' . strtoupper(substr($category->slug, 0, 3)) . '-' . str_pad($productIndex, 4, '0', STR_PAD_LEFT);

            // Determine business_type based on category
            $businessType = $this->determineBusinessType($data['category'], $data['name']);

            // Calculate created_at timestamp
            // Product #1 (OMODA) = 30 days ago
            // Product #30 (KIDZANIA) = now
            // Linear distribution: each product is ~1 day newer than previous
            $daysAgo = $totalProducts - $productIndex; // 29, 28, 27... 1, 0
            $createdAt = Carbon::now()->subDays($daysAgo)->subHours(rand(0, 23))->subMinutes(rand(0, 59));
            $updatedAt = $createdAt->copy()->addDays(rand(0, $daysAgo))->addHours(rand(0, 23));

            Product::create([
                'tenant_id' => $tenant->id,
                'category_id' => $category->id,
                'name' => $data['name'],
                'slug' => Str::slug($data['name']) . '-' . $productIndex,
                'sku' => $sku,
                'description' => $data['description'],
                'price' => $price * 100, // Convert to cents
                'currency' => 'IDR',
                'status' => 'published',
                'type' => $data['type'],
                'stock_quantity' => $stock,
                'low_stock_threshold' => 10,
                'images' => $images,
                'categories' => [$category->slug, 'featured'],
                'tags' => ['lapel-pin', 'corporate-badge', 'metal-etching', 'customizable'],
                'dimensions' => [
                    'length' => floatval(explode('x', $data['size'] ?? '4x3')[0]),
                    'width' => floatval(explode('x', str_replace(' cm', '', $data['size'] ?? '4x3'))[1] ?? 3),
                    'height' => floatval(str_replace(' mm', '', $data['thickness'] ?? '0.6')),
                    'weight' => 0.05 // 5 grams average for small pins
                ],
                'material' => $data['material'] ?? 'Stainless Steel 304 (Anti Karat)',
                'size' => $data['size'] ?? '4x3 cm',
                'available_sizes' => $data['available_sizes'] ?? ['3x2.5 cm', '4x3 cm', '5x4 cm', 'custom'],
                'customizable' => $data['customizable'] ?? true,
                'production_type' => 'vendor',
                'min_order_quantity' => $data['min_order'] ?? 30,
                'metadata' => [
                    'business_type' => $data['business_type'] ?? $businessType,
                    'thickness' => $data['thickness'] ?? '0.6 mm',
                    'backing_type' => $data['backing_type'] ?? 'Butterfly Clutch',
                ],
                'track_inventory' => true,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);

            $this->command->info("   ✓ Created: {$data['name']} (SKU: {$sku}) - Created: {$createdAt->format('Y-m-d H:i')} with " . count($images) . " images");
            $productIndex++;
        }

        $this->command->info("✅ Successfully seeded {$productIndex} products for PT CEX!");
        $this->command->info("📊 Total images mapped: {$this->getTotalImages()}");
        $this->command->info("📅 Products created with timestamps from {$totalProducts} days ago to now");
        $this->command->info("🎯 These products will appear FIRST when sorted by created_at DESC");
    }

    private function findBestCategory($categories, $categoryName): ?ProductCategory
    {
        $categoryMap = [
            'Award Plakat' => ['plakat', 'award', 'penghargaan'],
            'Trophy & Medal' => ['trophy', 'medali', 'medal', 'trofi'],
            'Custom Etching' => ['custom', 'etching', 'etsa'],
            'Metal Plate' => ['plate', 'plat', 'metal', 'signage'],
            'Lapel Pin' => ['pin', 'badge', 'lapel'],
            'Premium Pin' => ['premium', 'exclusive'],
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

    /**
     * Determine business_type based on category name and product name
     */
    private function determineBusinessType(string $category, string $productName): string
    {
        $categoryLower = strtolower($category);
        $productLower = strtolower($productName);
        
        // Lapel Pin / Badge -> metal_etching
        if (str_contains($categoryLower, 'pin') || str_contains($categoryLower, 'badge') || str_contains($productLower, 'pin')) {
            return 'metal_etching';
        }
        
        // Premium Pin with special materials
        if (str_contains($categoryLower, 'premium')) {
            return 'metal_etching';
        }
        
        // Default to metal_etching for CEX tenant (mostly metal pins & badges)
        return 'metal_etching';
    }
}
