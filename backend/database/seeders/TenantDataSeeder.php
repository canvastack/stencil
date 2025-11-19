<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Domain\Product\Services\InventoryService;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\ProductEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\VendorEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryItem;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryLocation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReservation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryAdjustment;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryCount;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReconciliation;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Carbon\Carbon;

class TenantDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = TenantEloquentModel::all();
        
        $this->command->info("📊 Seeding business data for {$tenants->count()} tenants...");

        foreach ($tenants as $tenant) {
            $this->command->info("   Processing: {$tenant->name}");
            $this->seedAdditionalTenantUsers($tenant);
            $this->seedCustomers($tenant);
            $this->seedVendors($tenant);
            $this->seedProducts($tenant);
            $this->seedOrders($tenant);
            $this->seedInventory($tenant);
        }

        $this->command->info('✅ Tenant business data seeded successfully!');
        
        // Summary
        $totalCustomers = CustomerEloquentModel::count();
        $totalProducts = ProductEloquentModel::count();
        $totalOrders = OrderEloquentModel::count();
        $totalVendors = VendorEloquentModel::count();
        $totalInventoryItems = InventoryItem::count();
        $totalInventoryLocations = InventoryLocation::count();
        $totalInventoryReservations = InventoryReservation::count();
        $totalInventoryAdjustments = InventoryAdjustment::count();
        $totalInventoryCounts = InventoryCount::count();
        $totalInventoryReconciliations = InventoryReconciliation::count();
        
        $this->command->info("📈 Data Summary:");
        $this->command->info("   - Customers: {$totalCustomers}");
        $this->command->info("   - Products: {$totalProducts}");
        $this->command->info("   - Orders: {$totalOrders}");
        $this->command->info("   - Vendors: {$totalVendors}");
        $this->command->info("   - Inventory Items: {$totalInventoryItems}");
        $this->command->info("   - Inventory Locations: {$totalInventoryLocations}");
        $this->command->info("   - Inventory Reservations: {$totalInventoryReservations}");
        $this->command->info("   - Inventory Adjustments: {$totalInventoryAdjustments}");
        $this->command->info("   - Inventory Counts: {$totalInventoryCounts}");
        $this->command->info("   - Inventory Reconciliations: {$totalInventoryReconciliations}");
    }

    private function seedAdditionalTenantUsers($tenant): void
    {
        // Skip if tenant already has users (from MultiTenantBusinessSeeder)
        $existingUsers = \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::where('tenant_id', $tenant->id)->count();
        if ($existingUsers >= 5) {
            return; // Already has enough users
        }

        // Create additional employees (10-15 per tenant for performance testing)
        $departments = ['Sales', 'Support', 'Operations', 'Marketing', 'Finance', 'HR', 'IT', 'Quality Control'];
        $positions = ['Staff', 'Senior Staff', 'Team Lead', 'Coordinator', 'Specialist', 'Executive'];
        
        for ($i = 1; $i <= 12; $i++) {
            $department = $departments[array_rand($departments)];
            $position = $positions[array_rand($positions)];
            
            \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::create([
                'tenant_id' => $tenant->id,
                'name' => "{$position} {$i} - {$tenant->name}",
                'email' => "employee{$i}@" . $tenant->slug . '.local',
                'password' => Hash::make('Employee2024!'),
                'status' => rand(0, 10) > 1 ? 'active' : 'inactive',
                'department' => $department,
                'phone' => '+628' . rand(1000000000, 9999999999),
                'email_verified_at' => now()->subDays(rand(1, 30)),
                'location' => [
                    'address' => 'Jl. ' . ['Gatot Subroto', 'Sudirman', 'Thamrin', 'Kuningan', 'Senayan'][rand(0, 4)] . ' No. ' . rand(10, 99),
                    'city' => ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'][rand(0, 4)],
                    'province' => ['DKI Jakarta', 'Jawa Timur', 'Jawa Barat', 'Sumatera Utara', 'Jawa Tengah'][rand(0, 4)],
                    'postal_code' => (string) rand(10000, 99999)
                ],
                'last_login_at' => rand(0, 5) > 1 ? now()->subDays(rand(0, 7)) : null,
            ]);
        }
    }

    private function seedCustomers($tenant): void
    {
        // Base customer data (10 core customers)
        $baseCustomerData = [
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

        // Generate additional customers (total 35-45 per tenant)
        $firstNames = ['Andi', 'Bagus', 'Citra', 'Dedi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indra', 'Juni', 'Kartika', 'Lia', 'Mira', 'Nico', 'Oia', 'Putra', 'Qori', 'Rina', 'Sari', 'Tono', 'Umi', 'Vita', 'Wati', 'Xena', 'Yuda', 'Zaki'];
        $lastNames = ['Wijaya', 'Susanto', 'Permana', 'Lestari', 'Pratama', 'Sari', 'Utama', 'Indah', 'Kusuma', 'Purnama', 'Salsabila', 'Maharani', 'Handoko', 'Setiawan'];
        $companies = ['PT Sentosa', 'CV Makmur', 'UD Jaya', 'PT Bahagia', 'CV Sejahtera', 'PT Mandiri', 'UD Sukses', 'PT Berkah', 'CV Gemilang', 'PT Mitra'];
        
        $customerCount = rand(35, 45);
        
        // Create base customers
        foreach ($baseCustomerData as $data) {
            [$firstName, $lastName, $email, $phone, $type] = $data;
            $this->createCustomer($tenant, $firstName, $lastName, $email, $phone, $type);
        }
        
        // Create additional random customers
        for ($i = 11; $i <= $customerCount; $i++) {
            $type = rand(0, 10) > 7 ? 'business' : 'individual'; // 30% business, 70% individual
            
            if ($type === 'business') {
                $companyName = $companies[array_rand($companies)] . ' ' . ['Nusantara', 'Indonesia', 'Sejahtera', 'Makmur'][rand(0, 3)];
                $firstName = $companyName;
                $lastName = ['Manager', 'Direktur', 'Owner', 'CEO'][rand(0, 3)];
                $email = strtolower(str_replace([' ', '.'], ['', ''], $companyName)) . '@company' . $i . '.com';
            } else {
                $firstName = $firstNames[array_rand($firstNames)];
                $lastName = $lastNames[array_rand($lastNames)];
                $email = strtolower($firstName . '.' . $lastName . $i) . '@email.com';
            }
            
            $phone = '+628' . rand(1000000000, 9999999999);
            $this->createCustomer($tenant, $firstName, $lastName, $email, $phone, $type);
        }
    }
    
    private function createCustomer($tenant, $firstName, $lastName, $email, $phone, $type): void
    {
        $cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar', 'Yogyakarta', 'Malang', 'Denpasar'];
        $provinces = ['DKI Jakarta', 'Jawa Timur', 'Jawa Barat', 'Sumatera Utara', 'Jawa Tengah', 'Sumatera Selatan', 'Sulawesi Selatan', 'DI Yogyakarta', 'Jawa Timur', 'Bali'];
        $streets = ['Sudirman', 'Thamrin', 'Kuningan', 'Senayan', 'Menteng', 'Kemang', 'Pondok Indah', 'Kelapa Gading', 'PIK', 'BSD'];
        
        $addressText = 'Jl. ' . $streets[rand(0, count($streets) - 1)] . ' No. ' . rand(1, 100) . ', ' 
                      . $cities[rand(0, count($cities) - 1)] . ', ' 
                      . $provinces[rand(0, count($provinces) - 1)] . ' ' . rand(10000, 99999);
        
        $metadata = [];
        if ($type === 'business') {
            $metadata['tax_number'] = '01.' . rand(100, 999) . '.' . rand(100, 999) . '.1-011.000';
            $metadata['business_type'] = ['corporation', 'partnership', 'sole_proprietorship'][rand(0, 2)];
        }
        
        if (rand(0, 5) > 3) {
            $metadata['notes'] = 'Customer since ' . rand(2020, 2024) . '. ' . ['Reliable client', 'VIP customer', 'Bulk purchaser', 'Regular buyer'][rand(0, 3)];
        }

        CustomerEloquentModel::create([
            'tenant_id' => $tenant->id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'address' => $addressText,
            'status' => rand(0, 20) > 1 ? 'active' : 'suspended', // 95% active
            'type' => $type,
            'company_name' => $type === 'business' ? $firstName : null,
            'metadata' => !empty($metadata) ? $metadata : null,
            'tags' => array_slice(['vip', 'regular', 'wholesale', 'retail', 'new', 'premium', 'loyal'], 0, rand(1, 4)),
            'last_order_at' => rand(0, 10) > 2 ? Carbon::now()->subDays(rand(1, 180)) : null,
            'created_at' => Carbon::now()->subDays(rand(1, 365)),
            'updated_at' => Carbon::now()->subDays(rand(0, 30))
        ]);
    }

    private function seedVendors($tenant): void
    {
        // Base vendor data
        $baseVendorData = [
            ['PT Supplier Utama', 'supplier.utama@email.com', '+6281111111111', 'Budi Supplier'],
            ['CV Distributor Jaya', 'distributor.jaya@email.com', '+6281111111112', 'Siti Distributor'],
            ['UD Grosir Murah', 'grosir.murah@email.com', '+6281111111113', 'Ahmad Grosir'],
            ['PT Manufaktur Berkah', 'manufaktur.berkah@email.com', '+6281111111114', 'Dewi Manufaktur'],
            ['CV Import Eksport', 'import.eksport@email.com', '+6281111111115', 'Rudi Import']
        ];

        // Generate additional vendors (total 20-25 per tenant)
        $companyPrefixes = ['PT', 'CV', 'UD', 'TBK'];
        $businessNames = ['Supplier', 'Distributor', 'Manufaktur', 'Trading', 'Ekspor', 'Impor', 'Grosir', 'Retail', 'Industri', 'Logistik'];
        $descriptors = ['Utama', 'Jaya', 'Makmur', 'Sejahtera', 'Bersama', 'Mandiri', 'Prima', 'Global', 'Nusantara', 'Indonesia'];
        $contactNames = ['Bambang', 'Sari', 'Agus', 'Nina', 'Hendra', 'Lisa', 'Dedi', 'Maya', 'Rudi', 'Eka'];
        $cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar'];
        
        $vendorCount = rand(20, 25);
        
        // Create base vendors
        foreach ($baseVendorData as $data) {
            [$name, $email, $phone, $contactPerson] = $data;
            $this->createVendor($tenant, $name, $email, $phone, $contactPerson);
        }
        
        // Create additional vendors
        for ($i = 6; $i <= $vendorCount; $i++) {
            $prefix = $companyPrefixes[array_rand($companyPrefixes)];
            $businessName = $businessNames[array_rand($businessNames)];
            $descriptor = $descriptors[array_rand($descriptors)];
            $contactName = $contactNames[array_rand($contactNames)];
            
            $name = "{$prefix} {$businessName} {$descriptor}";
            $email = strtolower(str_replace([' ', '.'], ['', ''], $name)) . "{$i}@vendor.com";
            $phone = '+628' . rand(1000000000, 9999999999);
            $contactPerson = $contactName . ' ' . ['Manager', 'Director', 'Sales', 'Owner'][rand(0, 3)];
            
            $this->createVendor($tenant, $name, $email, $phone, $contactPerson);
        }
    }
    
    private function createVendor($tenant, $name, $email, $phone, $contactPerson): void
    {
        $streets = ['Industri', 'Gudang', 'Pabrik', 'Logistik', 'Raya', 'Perdagangan', 'Bisnis'];
        $cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Palembang', 'Makassar'];
        
        $address = 'Jl. ' . $streets[rand(0, count($streets) - 1)] . ' No. ' . rand(1, 100) . ', ' . $cities[rand(0, count($cities) - 1)];
        
        // Create contact person array
        $contacts = [
            [
                'name' => $contactPerson,
                'position' => ['Manager', 'Director', 'Sales', 'Owner'][rand(0, 3)],
                'phone' => $phone,
                'email' => $email
            ]
        ];
        
        $metadata = [];
        if (rand(0, 5) > 2) {
            $metadata['notes'] = 'Partnership since ' . rand(2018, 2024) . '. ' . ['Reliable supplier', 'Good quality products', 'Competitive pricing', 'Fast delivery'][rand(0, 3)];
        }
        
        VendorEloquentModel::create([
            'tenant_id' => $tenant->id,
            'name' => $name,
            'company_name' => $name,
            'email' => $email,
            'phone' => $phone,
            'address' => $address,
            'status' => rand(0, 15) > 1 ? 'active' : 'inactive', // 93% active
            'tax_id' => '01.' . rand(100, 999) . '.' . rand(100, 999) . '.1-011.000',
            'contacts' => $contacts,
            'payment_terms' => [
                'method' => ['cash', 'transfer', 'credit'][rand(0, 2)],
                'terms' => ['NET 30', 'NET 60', 'COD', 'Prepaid'][rand(0, 3)],
                'discount' => rand(0, 10) > 7 ? rand(2, 10) : 0
            ],
            'metadata' => !empty($metadata) ? $metadata : null,
            'created_at' => Carbon::now()->subDays(rand(30, 730)),
            'updated_at' => Carbon::now()->subDays(rand(0, 30))
        ]);
    }

    private function seedProducts($tenant): void
    {
        $productCategories = [
            'electronics' => ['Laptop', 'Smartphone', 'Tablet', 'Headphone', 'Speaker', 'Camera', 'Monitor', 'Keyboard', 'Mouse', 'Webcam'],
            'fashion' => ['T-Shirt', 'Jeans', 'Dress', 'Shoes', 'Bag', 'Jacket', 'Sweater', 'Hat', 'Belt', 'Watch'],
            'food' => ['Coffee', 'Tea', 'Snack', 'Beverage', 'Cookies', 'Cake', 'Bread', 'Juice', 'Water', 'Energy Drink'],
            'automotive' => ['Engine Oil', 'Tire', 'Battery', 'Filter', 'Brake Pad', 'Spark Plug', 'Coolant', 'Wiper', 'Light Bulb', 'Fuse'],
            'home' => ['Chair', 'Table', 'Lamp', 'Curtain', 'Carpet', 'Sofa', 'Bed', 'Mirror', 'Vase', 'Clock'],
            'etching' => ['Aluminum Plate', 'Steel Sheet', 'Glass Panel', 'Acrylic Board', 'Copper Foil', 'Etching Acid', 'Resist Film', 'Template', 'Engraving Tool', 'Finishing Spray']
        ];

        $businessType = $tenant->settings['business_type'] ?? 'general';
        $category = match($businessType) {
            'electronics_retail' => 'electronics',
            'fashion_retail' => 'fashion',
            'food_beverage' => 'food',
            'automotive_service' => 'automotive',
            'home_decor' => 'home',
            'etching' => 'etching',
            default => array_keys($productCategories)[rand(0, count($productCategories) - 1)]
        };

        $baseProducts = $productCategories[$category];
        $qualifiers = ['Premium', 'Standard', 'Economy', 'Deluxe', 'Basic', 'Pro', 'Max', 'Mini', 'Plus', 'Elite', 'Special', 'Limited'];
        $productCount = rand(40, 50);
        
        // Create base category products
        foreach ($baseProducts as $index => $productName) {
            $this->createProduct($tenant, $productName, $category, $index + 1, $qualifiers);
        }
        
        // Create additional products to reach target count
        $additionalCount = $productCount - count($baseProducts);
        for ($i = 0; $i < $additionalCount; $i++) {
            $baseProduct = $baseProducts[array_rand($baseProducts)];
            $variant = ['Variant', 'Model', 'Type', 'Series', 'Edition'][rand(0, 4)] . ' ' . chr(65 + rand(0, 25));
            $productName = $baseProduct . ' ' . $variant;
            $this->createProduct($tenant, $productName, $category, count($baseProducts) + $i + 1, $qualifiers);
        }
    }
    
    private function createProduct($tenant, $productName, $category, $index, $qualifiers): void
    {
        $qualifier = $qualifiers[array_rand($qualifiers)];
        $price = rand(25000, 15000000); // Wider price range
        $stock = rand(0, 500); // Higher stock variety
        $isDigital = rand(0, 10) > 7; // 30% chance for digital/service
        
        ProductEloquentModel::create([
            'tenant_id' => $tenant->id,
            'name' => $productName . ' ' . $qualifier,
            'sku' => strtoupper(substr($category, 0, 3)) . '-' . str_pad($index, 4, '0', STR_PAD_LEFT),
            'slug' => Str::slug($productName . ' ' . $qualifier) . '-' . $index,
            'description' => $this->generateProductDescription($productName, $qualifier),
            'price' => $price,
            'currency' => 'IDR',
            'status' => rand(0, 10) > 2 ? 'published' : 'draft', // 80% published
            'type' => $isDigital ? ['digital', 'service'][rand(0, 1)] : 'physical',
            'stock_quantity' => $isDigital ? 0 : $stock,
            'low_stock_threshold' => $isDigital ? 0 : rand(5, 25),
            'images' => [
                '/images/products/' . Str::slug($productName) . '_1.jpg',
                '/images/products/' . Str::slug($productName) . '_2.jpg',
                '/images/products/' . Str::slug($productName) . '_3.jpg'
            ],
            'categories' => [$category, rand(0, 5) > 3 ? 'featured' : 'regular'],
            'tags' => array_slice(['new', 'popular', 'discount', 'trending', 'bestseller', 'premium', 'sale', 'limited'], 0, rand(2, 5)),
            'dimensions' => $isDigital ? null : [
                'length' => rand(5, 200),
                'width' => rand(5, 200),
                'height' => rand(2, 100),
                'weight' => rand(100, 10000) / 100 // 1-100kg
            ],
            'track_inventory' => !$isDigital,
            'created_at' => Carbon::now()->subDays(rand(7, 365)),
            'updated_at' => Carbon::now()->subDays(rand(0, 30))
        ]);
    }
    
    private function generateProductDescription($productName, $qualifier): string
    {
        $descriptions = [
            "High quality {$productName} {$qualifier} with excellent features and durability. Perfect for both personal and professional use.",
            "Premium {$productName} {$qualifier} designed with latest technology and superior materials for outstanding performance.",
            "Professional grade {$productName} {$qualifier} built to meet the highest standards of quality and reliability.",
            "Advanced {$productName} {$qualifier} featuring innovative design and exceptional functionality for maximum satisfaction.",
            "Top-tier {$productName} {$qualifier} crafted with precision and attention to detail for superior user experience."
        ];
        
        return $descriptions[array_rand($descriptions)];
    }

    private function seedOrders($tenant): void
    {
        $customers = CustomerEloquentModel::where('tenant_id', $tenant->id)->get();
        $products = ProductEloquentModel::where('tenant_id', $tenant->id)->where('status', 'published')->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            $this->command->warn("   Skipping orders for {$tenant->name} - insufficient customers or products");
            return;
        }

        $orderCount = rand(50, 80); // Higher order volume for performance testing
        $orderStatuses = [
            'pending' => 15,      // 15%
            'processing' => 20,   // 20%
            'shipped' => 25,      // 25%  
            'delivered' => 35,    // 35% (changed from completed)
            'cancelled' => 5      // 5%
        ];
        
        for ($i = 0; $i < $orderCount; $i++) {
            $customer = $customers->random();
            $orderProducts = $products->random(rand(1, 6)); // 1-6 items per order
            $totalAmount = 0;
            $items = [];
            $discountAmount = 0;

            foreach ($orderProducts as $product) {
                $quantity = rand(1, 8); // Higher quantities
                $basePrice = (int) $product->price;
                
                // Apply random discount to some items
                $hasDiscount = rand(0, 10) > 7; // 30% chance
                $discountPercent = $hasDiscount ? rand(5, 25) : 0;
                $price = (int) ($basePrice * (1 - $discountPercent / 100));
                $subtotal = $price * $quantity;
                $totalAmount += $subtotal;
                
                if ($hasDiscount) {
                    $discountAmount += ($basePrice - $price) * $quantity;
                }

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $quantity,
                    'unit_price' => $basePrice,
                    'discount_percent' => $discountPercent,
                    'final_price' => $price,
                    'subtotal' => $subtotal
                ];
            }
            
            // Apply shipping cost
            $shippingCost = $this->calculateShippingCost($totalAmount);

            $orderDate = Carbon::now()->subDays(rand(1, 365)); // Orders up to 1 year ago
            $orderNumber = $this->generateOrderNumber($tenant->slug, $orderDate, $i + 1);
            
            // Determine status based on weighted distribution
            $status = $this->getRandomOrderStatus($orderStatuses);
            
            // More realistic status progression based on order date
            if ($orderDate->diffInDays(now()) < 2) {
                $status = ['pending', 'processing'][rand(0, 1)];
            } elseif ($orderDate->diffInDays(now()) > 90 && $status === 'pending') {
                $status = ['delivered', 'cancelled'][rand(0, 1)];
            }

            // Convert address string to shipping address array
            $shippingAddress = [
                'name' => $customer->first_name . ' ' . $customer->last_name,
                'company' => $customer->company_name,
                'address' => $customer->address,
                'phone' => $customer->phone,
                'email' => $customer->email
            ];
            
            OrderEloquentModel::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'order_number' => $orderNumber,
                'status' => $status,
                'total_amount' => $totalAmount,
                'shipping_cost' => $shippingCost,
                'currency' => 'IDR',
                'items' => $items,
                'shipping_address' => $shippingAddress,
                'payment_method' => ['cash', 'transfer', 'credit_card', 'e_wallet'][rand(0, 3)],
                'payment_status' => $this->getPaymentStatus($status),
                'notes' => rand(0, 5) > 2 ? $this->generateOrderNotes($customer, $status) : null,
                'created_at' => $orderDate,
                'updated_at' => $this->getOrderUpdateDate($orderDate, $status)
            ]);

            // Update customer's last_order_at
            if (!$customer->last_order_at || $orderDate->gt($customer->last_order_at)) {
                $customer->update(['last_order_at' => $orderDate]);
            }
        }
    }

    private function seedInventory($tenant): void
    {
        $userId = UserEloquentModel::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->orderBy('id')
            ->value('id');

        if (!$userId) {
            return;
        }

        $inventoryService = app(InventoryService::class);

        $locationDefinitions = [
            ['code' => 'WH-A', 'name' => 'Warehouse A', 'type' => 'warehouse'],
            ['code' => 'WH-B', 'name' => 'Warehouse B', 'type' => 'warehouse'],
            ['code' => 'PROD', 'name' => 'Production Floor', 'type' => 'production'],
            ['code' => 'QC', 'name' => 'Quality Control', 'type' => 'quality_control'],
            ['code' => 'SHIP', 'name' => 'Shipping Dock', 'type' => 'shipping'],
        ];

        $locations = [];
        foreach ($locationDefinitions as $definition) {
            $location = InventoryLocation::where('tenant_id', $tenant->id)
                ->where('location_code', $definition['code'])
                ->first();

            if (!$location) {
                $location = $inventoryService->createLocation([
                    'tenant_id' => $tenant->id,
                    'location_code' => $definition['code'],
                    'location_name' => $definition['name'],
                    'location_type' => $definition['type'],
                    'is_active' => true,
                    'is_primary' => $definition['code'] === 'WH-A',
                ], $userId);
            }

            $locations[] = $location;
        }

        $locationTypes = ['warehouse', 'production', 'quality_control', 'shipping', 'returns', 'showroom', 'staging', 'micro_fulfillment'];
        $streets = ['Gatot Subroto', 'Sudirman', 'Thamrin', 'Kuningan', 'Senayan', 'Merdeka', 'Diponegoro', 'Ahmad Yani'];
        $cities = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Yogyakarta', 'Denpasar'];
        $provinces = ['DKI Jakarta', 'Jawa Timur', 'Jawa Barat', 'Sumatera Utara', 'Jawa Tengah', 'Sulawesi Selatan', 'DI Yogyakarta', 'Bali'];

        for ($i = 1; $i <= 20; $i++) {
            $code = 'LOC-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT);
            $exists = InventoryLocation::where('tenant_id', $tenant->id)
                ->where('location_code', $code)
                ->exists();
            if ($exists) {
                continue;
            }

            $temperatureControlled = rand(0, 10) > 7;
            $humidityControlled = rand(0, 10) > 5;
            $totalCapacity = rand(120, 900);
            $usedCapacity = round($totalCapacity * (rand(10, 60) / 100), 2);

            $location = $inventoryService->createLocation([
                'tenant_id' => $tenant->id,
                'location_code' => $code,
                'location_name' => 'Location ' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
                'location_type' => $locationTypes[array_rand($locationTypes)],
                'description' => 'Automated seeded location ' . $i,
                'location_level' => rand(1, 4),
                'address_line_1' => 'Jl. ' . $streets[array_rand($streets)] . ' No. ' . rand(10, 299),
                'city' => $cities[array_rand($cities)],
                'state_province' => $provinces[array_rand($provinces)],
                'postal_code' => (string) rand(10000, 99999),
                'country' => 'Indonesia',
                'total_capacity' => $totalCapacity,
                'used_capacity' => $usedCapacity,
                'capacity_unit' => rand(0, 1) ? 'pallet' : 'cubic_meter',
                'temperature_controlled' => $temperatureControlled,
                'temperature_min' => $temperatureControlled ? rand(2, 12) : null,
                'temperature_max' => $temperatureControlled ? rand(13, 22) : null,
                'humidity_controlled' => $humidityControlled,
                'humidity_max' => $humidityControlled ? rand(55, 85) : null,
                'security_level' => rand(0, 10) > 2 ? 'standard' : 'high',
                'is_active' => rand(0, 20) > 1,
                'is_primary' => false,
                'operational_hours' => [
                    'monday' => ['open' => '08:00', 'close' => '17:00'],
                    'tuesday' => ['open' => '08:00', 'close' => '17:00'],
                    'wednesday' => ['open' => '08:00', 'close' => '17:00'],
                    'thursday' => ['open' => '08:00', 'close' => '17:00'],
                    'friday' => ['open' => '08:00', 'close' => '17:00'],
                ],
                'contact_information' => [
                    'name' => 'Supervisor ' . $i,
                    'phone' => '+628' . rand(1000000000, 9999999999),
                    'email' => 'location' . $i . '@' . $tenant->slug . '.local',
                ],
            ], $userId);

            $locations[] = $location;
        }

        if (empty($locations)) {
            return;
        }

        $products = ProductEloquentModel::where('tenant_id', $tenant->id)
            ->where('track_inventory', true)
            ->inRandomOrder()
            ->take(45)
            ->get();

        if ($products->isEmpty()) {
            return;
        }

        foreach ($products as $index => $product) {
            $item = $inventoryService->ensureInventoryItem($product, $userId);
            $item->minimum_stock_level = rand(15, 40);
            $item->reorder_point = rand(8, (int) $item->minimum_stock_level);
            $item->reorder_quantity = rand(5, 20);
            $cost = $product->vendor_price ?? rand(15000, 350000);
            $item->standard_cost = $cost;
            $item->average_cost = $cost;
            $item->save();

            $totalStock = rand(60, 200);
            $remaining = $totalStock;
            $locationCount = count($locations);
            foreach ($locations as $idx => $location) {
                $remainingLocations = $locationCount - $idx - 1;
                if ($remainingLocations <= 0) {
                    $quantity = $remaining;
                } else {
                    $minAlloc = 5;
                    $maxAlloc = max($minAlloc, $remaining - ($remainingLocations * $minAlloc));
                    $quantity = rand($minAlloc, $maxAlloc);
                    $remaining -= $quantity;
                }
                $inventoryService->setLocationStock($product, $location, (float) $quantity, $userId, 'initial_seed');
            }

            if ($remaining > 0) {
                $inventoryService->adjustLocationStock($product, $locations[0], (float) $remaining, $userId, 'balancing_seed');
            }

            if ($index % 3 === 0) {
                $difference = rand(-4, 6);
                if ($difference !== 0) {
                    $inventoryService->adjustLocationStock($product, $locations[array_rand($locations)], (float) $difference, $userId, 'cycle_adjustment_seed');
                }
            }

            if ($index % 4 === 0) {
                $reservationQty = rand(1, 6);
                $inventoryService->reserveStock(
                    $product,
                    (float) $reservationQty,
                    $locations[array_rand($locations)],
                    'order',
                    Str::uuid()->toString(),
                    $userId,
                    Carbon::now()->addDays(rand(3, 12))
                );
            }

            if ($index % 6 === 0) {
                $inventoryService->reserveStock(
                    $product,
                    (float) rand(1, 4),
                    null,
                    'project',
                    Str::uuid()->toString(),
                    $userId,
                    null
                );
            }

            if ($index % 5 === 0) {
                $item->minimum_stock_level = max($item->minimum_stock_level, $item->current_stock + rand(5, 15));
                $item->save();
            }
        }

        foreach ($locations as $location) {
            $cycles = rand(3, 5);
            for ($i = 0; $i < $cycles; $i++) {
                $inventoryService->scheduleCycleCount($location, $userId, Carbon::now()->addDays(rand(5, 25)));
            }
        }

        $inventoryService->runBalancingForTenant($tenant->id, $userId, 'seed');

        $discrepancyItems = InventoryItem::where('tenant_id', $tenant->id)
            ->inRandomOrder()
            ->take(20)
            ->get();

        foreach ($discrepancyItems as $idx => $discrepancyItem) {
            $variance = rand(-7, 9);
            if ($variance === 0) {
                $variance = 4;
            }
            $location = $locations[array_rand($locations)];
            $status = $idx % 3 === 0 ? 'resolved' : 'open';
            InventoryReconciliation::create([
                'tenant_id' => $tenant->id,
                'inventory_item_id' => $discrepancyItem->id,
                'inventory_location_id' => $location->id,
                'expected_quantity' => (float) $discrepancyItem->current_stock,
                'counted_quantity' => (float) $discrepancyItem->current_stock + $variance,
                'variance_quantity' => (float) $variance,
                'variance_value' => (float) ($variance * max($discrepancyItem->average_cost, 1)),
                'status' => $status,
                'source' => 'seed',
                'initiated_by' => $userId,
                'initiated_at' => Carbon::now()->subDays(rand(1, 7)),
                'resolved_by' => $status === 'resolved' ? $userId : null,
                'resolved_at' => $status === 'resolved' ? Carbon::now()->subDays(rand(1, 3)) : null,
                'metadata' => ['notes' => 'Seeded variance for testing'],
            ]);
        }
    }
    
    private function calculateShippingCost($totalAmount): int
    {
        if ($totalAmount > 500000) return 0; // Free shipping over 500k
        if ($totalAmount > 200000) return 15000; // Reduced shipping
        return rand(25000, 50000); // Standard shipping
    }
    
    private function generateOrderNumber($tenantSlug, $orderDate, $sequence): string
    {
        $prefix = strtoupper(substr($tenantSlug, 0, 3));
        return $prefix . '-' . $orderDate->format('ymd') . '-' . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }
    
    private function getRandomOrderStatus($statusWeights): string
    {
        $rand = rand(1, 100);
        $cumulative = 0;
        
        foreach ($statusWeights as $status => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $status;
            }
        }
        
        return 'delivered';
    }
    
    private function getPaymentStatus($orderStatus): string
    {
        return match($orderStatus) {
            'pending' => 'pending',
            'cancelled' => 'failed',
            default => 'paid'
        };
    }
    
    private function generateOrderNotes($customer, $status): string
    {
        $notes = [
            'Customer requested express delivery',
            'Special packaging required for fragile items',
            'Corporate bulk order with NET 30 terms',
            'Gift wrapping requested',
            'Delivery to office address during business hours',
            'Customer is a VIP client - priority handling',
            'Follow up required for customer satisfaction'
        ];
        
        $statusNotes = match($status) {
            'cancelled' => ['Customer requested cancellation', 'Payment failed - order cancelled', 'Out of stock - order cancelled'],
            'delivered' => ['Order delivered successfully', 'Customer satisfied with delivery', 'Repeat customer - excellent service'],
            default => $notes
        };
        
        return $statusNotes[array_rand($statusNotes)];
    }
    
    private function getOrderUpdateDate($orderDate, $status): Carbon
    {
        $baseUpdate = $orderDate->copy();
        
        return match($status) {
            'pending' => $baseUpdate->addHours(rand(1, 24)),
            'processing' => $baseUpdate->addDays(rand(1, 3)),
            'shipped' => $baseUpdate->addDays(rand(2, 7)),
            'delivered' => $baseUpdate->addDays(rand(3, 14)),
            'cancelled' => $baseUpdate->addHours(rand(2, 72)),
        };
    }
}