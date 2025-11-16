<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\ProductEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\VendorEloquentModel;
use Carbon\Carbon;

class TenantDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = TenantEloquentModel::all();

        foreach ($tenants as $tenant) {
            $this->seedTenantUsers($tenant);
            $this->seedCustomers($tenant);
            $this->seedVendors($tenant);
            $this->seedProducts($tenant);
            $this->seedOrders($tenant);
        }

        $this->command->info('Tenant business data seeded successfully!');
    }

    private function seedTenantUsers($tenant): void
    {
        // Create tenant owner
        \App\Models\User::create([
            'id' => Str::uuid(),
            'tenant_id' => $tenant->id,
            'name' => 'Owner ' . $tenant->name,
            'email' => 'owner@' . $tenant->slug . '.local',
            'password' => Hash::make('password123'),
            'status' => 'active',
            'department' => 'Management',
            'location' => [
                'address' => 'Jl. Sudirman No. 1',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '12190'
            ]
        ]);

        // Create manager
        \App\Models\User::create([
            'id' => Str::uuid(),
            'tenant_id' => $tenant->id,
            'name' => 'Manager ' . $tenant->name,
            'email' => 'manager@' . $tenant->slug . '.local',
            'password' => Hash::make('password123'),
            'status' => 'active',
            'department' => 'Operations',
            'location' => [
                'address' => 'Jl. Thamrin No. 5',
                'city' => 'Jakarta',
                'province' => 'DKI Jakarta',
                'postal_code' => '10350'
            ]
        ]);

        // Create employees
        for ($i = 1; $i <= 3; $i++) {
            \App\Models\User::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'name' => "Employee {$i} - {$tenant->name}",
                'email' => "employee{$i}@" . $tenant->slug . '.local',
                'password' => Hash::make('password123'),
                'status' => rand(0, 10) > 1 ? 'active' : 'inactive',
                'department' => ['Sales', 'Support', 'Operations'][rand(0, 2)],
                'location' => [
                    'address' => 'Jl. Gatot Subroto No. ' . rand(10, 99),
                    'city' => ['Jakarta', 'Surabaya', 'Bandung'][rand(0, 2)],
                    'province' => ['DKI Jakarta', 'Jawa Timur', 'Jawa Barat'][rand(0, 2)],
                    'postal_code' => rand(10000, 99999)
                ]
            ]);
        }
    }

    private function seedCustomers($tenant): void
    {
        $customerData = [
            ['Budi', 'Santoso', 'budi.santoso@email.com', '+6281234567890', 'individual'],
            ['Siti', 'Rahayu', 'siti.rahayu@email.com', '+6281234567891', 'individual'],
            ['Ahmad', 'Wijaya', 'ahmad.wijaya@email.com', '+6281234567892', 'individual'],
            ['PT Maju Bersama', 'Direktur', 'info@majubersama.com', '+6281234567893', 'business'],
            ['CV Sukses Mandiri', 'Manager', 'contact@suksesmandiri.com', '+6281234567894', 'business'],
            ['Dewi', 'Lestari', 'dewi.lestari@email.com', '+6281234567895', 'individual'],
            ['Rudi', 'Hartanto', 'rudi.hartanto@email.com', '+6281234567896', 'individual'],
            ['PT Global Solusi', 'Purchasing', 'purchasing@globalsolusi.com', '+6281234567897', 'business'],
            ['Ani', 'Kusuma', 'ani.kusuma@email.com', '+6281234567898', 'individual'],
            ['Joko', 'Prabowo', 'joko.prabowo@email.com', '+6281234567899', 'individual']
        ];

        foreach ($customerData as $index => $data) {
            [$firstName, $lastName, $email, $phone, $type] = $data;
            
            CustomerEloquentModel::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'phone' => $phone,
                'address' => [
                    'street' => 'Jl. ' . ['Sudirman', 'Thamrin', 'Kuningan', 'Senayan', 'Menteng'][rand(0, 4)] . ' No. ' . rand(1, 100),
                    'city' => ['Jakarta', 'Surabaya', 'Bandung', 'Yogyakarta', 'Semarang'][rand(0, 4)],
                    'province' => ['DKI Jakarta', 'Jawa Timur', 'Jawa Barat', 'DI Yogyakarta', 'Jawa Tengah'][rand(0, 4)],
                    'postal_code' => rand(10000, 99999),
                    'country' => 'Indonesia'
                ],
                'status' => rand(0, 10) > 1 ? 'active' : 'suspended',
                'type' => $type,
                'company' => $type === 'business' ? $firstName : null,
                'tax_number' => $type === 'business' ? '01.' . rand(100, 999) . '.' . rand(100, 999) . '.1-011.000' : null,
                'notes' => rand(0, 5) > 3 ? 'Customer notes for ' . $firstName : null,
                'tags' => array_slice(['vip', 'regular', 'wholesale', 'retail', 'new'], 0, rand(1, 3)),
                'last_order_at' => rand(0, 10) > 3 ? Carbon::now()->subDays(rand(1, 90)) : null
            ]);
        }
    }

    private function seedVendors($tenant): void
    {
        $vendorData = [
            ['PT Supplier Utama', 'supplier.utama@email.com', '+6281111111111', 'Budi Supplier'],
            ['CV Distributor Jaya', 'distributor.jaya@email.com', '+6281111111112', 'Siti Distributor'],
            ['UD Grosir Murah', 'grosir.murah@email.com', '+6281111111113', 'Ahmad Grosir'],
            ['PT Manufaktur Berkah', 'manufaktur.berkah@email.com', '+6281111111114', 'Dewi Manufaktur'],
            ['CV Import Eksport', 'import.eksport@email.com', '+6281111111115', 'Rudi Import']
        ];

        foreach ($vendorData as $data) {
            [$name, $email, $phone, $contactPerson] = $data;
            
            VendorEloquentModel::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'address' => 'Jl. ' . ['Industri', 'Gudang', 'Pabrik', 'Logistik'][rand(0, 3)] . ' No. ' . rand(1, 100) . ', Jakarta',
                'status' => rand(0, 10) > 1 ? 'active' : 'inactive',
                'contact_person' => $contactPerson,
                'notes' => rand(0, 5) > 3 ? 'Vendor notes for ' . $name : null
            ]);
        }
    }

    private function seedProducts($tenant): void
    {
        $productCategories = [
            'electronics' => ['Laptop', 'Smartphone', 'Tablet', 'Headphone', 'Speaker'],
            'fashion' => ['T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Bag'],
            'food' => ['Coffee', 'Tea', 'Snack', 'Beverage', 'Cookies'],
            'automotive' => ['Engine Oil', 'Tire', 'Battery', 'Filter', 'Brake Pad'],
            'home' => ['Chair', 'Table', 'Lamp', 'Curtain', 'Carpet']
        ];

        $businessType = $tenant->data['business_type'] ?? 'general';
        $category = match($businessType) {
            'electronics_retail' => 'electronics',
            'fashion_retail' => 'fashion',
            'food_beverage' => 'food',
            'automotive_service' => 'automotive',
            default => array_keys($productCategories)[rand(0, 4)]
        };

        $products = $productCategories[$category];

        foreach ($products as $index => $productName) {
            $price = rand(50000, 5000000);
            $stock = rand(0, 100);
            
            ProductEloquentModel::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'name' => $productName . ' ' . ['Premium', 'Standard', 'Economy', 'Deluxe', 'Basic'][rand(0, 4)],
                'sku' => strtoupper(substr($category, 0, 3)) . '-' . str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'description' => 'High quality ' . $productName . ' with excellent features and durability.',
                'price' => $price,
                'currency' => 'IDR',
                'status' => rand(0, 10) > 2 ? 'published' : 'draft',
                'type' => ['physical', 'digital', 'service'][rand(0, 2)],
                'stock_quantity' => $stock,
                'low_stock_threshold' => rand(5, 20),
                'images' => [
                    '/images/products/' . strtolower($productName) . '_1.jpg',
                    '/images/products/' . strtolower($productName) . '_2.jpg'
                ],
                'categories' => [$category, 'featured'],
                'tags' => array_slice(['new', 'popular', 'discount', 'trending', 'bestseller'], 0, rand(1, 3)),
                'weight' => rand(100, 5000) / 100, // 1-50kg
                'dimensions' => [
                    'length' => rand(10, 100),
                    'width' => rand(10, 100), 
                    'height' => rand(5, 50)
                ],
                'track_stock' => true,
                'allow_backorder' => rand(0, 1) === 1,
                'published_at' => Carbon::now()->subDays(rand(1, 30))
            ]);
        }

        // Add some additional products
        for ($i = 0; $i < 15; $i++) {
            $price = rand(25000, 2500000);
            $stock = rand(0, 200);
            
            ProductEloquentModel::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'name' => 'Product ' . ($i + 6) . ' - ' . ['Pro', 'Max', 'Mini', 'Plus', 'Elite'][rand(0, 4)],
                'sku' => 'PRD-' . str_pad($i + 6, 3, '0', STR_PAD_LEFT),
                'description' => 'Quality product with great value for money and customer satisfaction.',
                'price' => $price,
                'currency' => 'IDR',
                'status' => rand(0, 10) > 3 ? 'published' : 'draft',
                'type' => ['physical', 'digital'][rand(0, 1)],
                'stock_quantity' => $stock,
                'low_stock_threshold' => rand(5, 15),
                'images' => ['/images/products/product_' . ($i + 6) . '.jpg'],
                'categories' => [$category],
                'tags' => array_slice(['sale', 'new', 'featured'], 0, rand(1, 2)),
                'weight' => rand(50, 3000) / 100,
                'dimensions' => [
                    'length' => rand(5, 80),
                    'width' => rand(5, 80),
                    'height' => rand(3, 30)
                ],
                'track_stock' => rand(0, 1) === 1,
                'allow_backorder' => rand(0, 1) === 1,
                'published_at' => rand(0, 1) ? Carbon::now()->subDays(rand(1, 60)) : null
            ]);
        }
    }

    private function seedOrders($tenant): void
    {
        $customers = CustomerEloquentModel::where('tenant_id', $tenant->id)->get();
        $products = ProductEloquentModel::where('tenant_id', $tenant->id)->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            return;
        }

        for ($i = 0; $i < 25; $i++) {
            $customer = $customers->random();
            $orderProducts = $products->random(rand(1, 4));
            $totalAmount = 0;
            $items = [];

            foreach ($orderProducts as $product) {
                $quantity = rand(1, 5);
                $price = $product->price;
                $subtotal = $price * $quantity;
                $totalAmount += $subtotal;

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit_price' => $price,
                    'subtotal' => $subtotal
                ];
            }

            $orderDate = Carbon::now()->subDays(rand(1, 90));
            $orderNumber = 'ORD-' . $orderDate->format('Ymd') . '-' . strtoupper(Str::random(6));

            OrderEloquentModel::create([
                'id' => Str::uuid(),
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'order_number' => $orderNumber,
                'status' => ['pending', 'processing', 'shipped', 'completed', 'cancelled'][rand(0, 4)],
                'total_amount' => $totalAmount,
                'currency' => 'IDR',
                'items' => $items,
                'shipping_address' => $customer->address,
                'billing_address' => $customer->address,
                'notes' => rand(0, 5) > 3 ? 'Order notes: ' . $orderNumber : null,
                'created_at' => $orderDate,
                'updated_at' => $orderDate->copy()->addHours(rand(1, 48))
            ]);

            // Update customer's last_order_at
            if (!$customer->last_order_at || $orderDate->gt($customer->last_order_at)) {
                $customer->update(['last_order_at' => $orderDate]);
            }
        }
    }
}