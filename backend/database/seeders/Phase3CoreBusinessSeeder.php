<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\VendorEloquentModel;
use Carbon\Carbon;

class Phase3CoreBusinessSeeder extends Seeder
{
    private array $materials = [
        'Acrylic' => ['Clear', 'Black', 'White', 'Colored', 'Frosted'],
        'Metal' => ['Stainless Steel', 'Aluminum', 'Brass', 'Copper', 'Bronze'],
        'Wood' => ['Mahogany', 'Oak', 'Teak', 'Pine', 'Walnut'],
        'Glass' => ['Clear Glass', 'Tempered Glass', 'Frosted Glass', 'Colored Glass'],
        'Composite' => ['MDF', 'Plywood', 'Chipboard', 'Fiberboard'],
    ];

    private array $qualityLevels = [
        'Standard' => ['price_multiplier' => 1.0, 'description' => 'Good quality for general use'],
        'Premium' => ['price_multiplier' => 1.5, 'description' => 'High quality with superior finish'],
        'Professional' => ['price_multiplier' => 2.0, 'description' => 'Professional grade materials'],
        'Luxury' => ['price_multiplier' => 3.0, 'description' => 'Luxury grade with exceptional finish'],
    ];

    public function run(): void
    {
        $this->command->info('🚀 Phase 3: Core Business Logic Seeding Started...');
        
        $tenants = TenantEloquentModel::all();
        
        foreach ($tenants as $tenant) {
            $this->command->info("   📊 Processing Tenant: {$tenant->name}");
            
            $categories = $this->seedProductCategories($tenant);
            $this->command->info("      ✅ Created " . count($categories) . " product categories with hierarchy");
            
            $this->seedProducts($tenant, $categories);
            $this->command->info("      ✅ Created 50+ products with detailed specifications");
            
            $this->seedRealisticOrders($tenant);
            $this->command->info("      ✅ Created realistic order workflow data");
        }
        
        $this->command->info('✅ Phase 3 Core Business Seeding Completed!');
        $this->printSummary();
    }

    private function seedProductCategories($tenant): array
    {
        // SAFEGUARD: Skip if tenant already has categories (prevent duplicates)
        $existingCount = ProductCategory::where('tenant_id', $tenant->id)->count();
        if ($existingCount > 0) {
            $this->command->info("      ℹ️  Categories already exist for {$tenant->name}, skipping...");
            return ProductCategory::where('tenant_id', $tenant->id)->get()->all();
        }
        
        $categoriesData = [
            [
                'name' => 'Custom Engraving & Etching',
                'description' => 'Professional laser engraving and etching services for various materials',
                'children' => [
                    ['name' => 'Metal Engraving', 'description' => 'Precision engraving on stainless steel, brass, aluminum'],
                    ['name' => 'Glass Etching', 'description' => 'Detailed glass etching for awards and decorative pieces'],
                    ['name' => 'Acrylic Engraving', 'description' => 'High-quality acrylic engraving for signage and displays'],
                    ['name' => 'Wood Engraving', 'description' => 'Natural wood engraving for plaques and gifts'],
                ]
            ],
            [
                'name' => 'Awards & Trophies',
                'description' => 'Custom awards, trophies, and recognition items',
                'children' => [
                    ['name' => 'Corporate Awards', 'description' => 'Professional awards for corporate recognition'],
                    ['name' => 'Sports Trophies', 'description' => 'Championship trophies and medals'],
                    ['name' => 'Appreciation Plaques', 'description' => 'Custom plaques for employee recognition'],
                ]
            ],
            [
                'name' => 'Signage & Display',
                'description' => 'Commercial signage and display solutions',
                'children' => [
                    ['name' => 'Office Signage', 'description' => 'Professional office door plates and directional signs'],
                    ['name' => 'Retail Displays', 'description' => 'Eye-catching retail display stands and holders'],
                    ['name' => 'Exhibition Stands', 'description' => 'Trade show and exhibition display systems'],
                ]
            ],
            [
                'name' => 'Personalized Gifts',
                'description' => 'Custom personalized gift items',
                'children' => [
                    ['name' => 'Wedding Gifts', 'description' => 'Personalized wedding souvenirs and gifts'],
                    ['name' => 'Corporate Gifts', 'description' => 'Custom corporate gift items'],
                    ['name' => 'Special Occasions', 'description' => 'Birthday, anniversary, and special event gifts'],
                ]
            ],
        ];

        $createdCategories = [];
        $sortOrder = 0;

        foreach ($categoriesData as $categoryData) {
            $sortOrder++;
            $slug = Str::slug($categoryData['name']);
            
            $parent = ProductCategory::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'slug' => $slug,
                ],
                [
                    'uuid' => Str::uuid()->toString(),
                    'name' => $categoryData['name'],
                    'description' => $categoryData['description'],
                    'parent_id' => null,
                    'level' => 0,
                    'sort_order' => $sortOrder,
                    'path' => $slug,
                    'is_active' => true,
                    'is_featured' => rand(0, 10) > 7,
                    'show_in_menu' => true,
                    'allowed_materials' => array_keys($this->materials),
                    'quality_levels' => array_keys($this->qualityLevels),
                    'base_markup_percentage' => rand(25, 50),
                    'requires_quote' => rand(0, 10) > 7,
                    'seo_title' => $categoryData['name'] . ' - Professional Services',
                    'seo_description' => $categoryData['description'],
                    'seo_keywords' => $this->generateKeywords($categoryData['name']),
                ]
            );

            $createdCategories[] = $parent;

            if (isset($categoryData['children'])) {
                foreach ($categoryData['children'] as $childData) {
                    $sortOrder++;
                    $childSlug = Str::slug($childData['name']);
                    
                    $child = ProductCategory::updateOrCreate(
                        [
                            'tenant_id' => $tenant->id,
                            'slug' => $childSlug,
                        ],
                        [
                            'uuid' => Str::uuid()->toString(),
                            'name' => $childData['name'],
                            'description' => $childData['description'],
                            'parent_id' => $parent->id,
                            'level' => 1,
                            'sort_order' => $sortOrder,
                            'path' => $parent->path . '/' . $childSlug,
                            'is_active' => true,
                            'is_featured' => rand(0, 10) > 6,
                            'show_in_menu' => true,
                            'allowed_materials' => $this->selectRandomMaterials(),
                            'quality_levels' => array_keys($this->qualityLevels),
                            'base_markup_percentage' => rand(30, 60),
                            'requires_quote' => rand(0, 10) > 5,
                            'seo_title' => $childData['name'] . ' - ' . $tenant->name,
                            'seo_description' => $childData['description'],
                            'seo_keywords' => $this->generateKeywords($childData['name']),
                        ]
                    );

                    $createdCategories[] = $child;
                }
            }
        }

        return $createdCategories;
    }

    private function seedProducts($tenant, $categories): void
    {
        // Skip if tenant already has phase 3 products
        $existingProducts = Product::where('tenant_id', $tenant->id)
            ->whereJsonContains('metadata->phase', 'phase_3')
            ->count();
        if ($existingProducts >= 50) {
            return; // Already has phase 3 products
        }

        $productTemplates = [
            'Custom Engraved %s %s',
            'Premium %s %s',
            'Professional %s %s',
            'Deluxe %s %s',
            'Executive %s %s',
            'Handcrafted %s %s',
            'Designer %s %s',
            'Elegant %s %s',
        ];

        $items = [
            'Plaque', 'Trophy', 'Award', 'Sign', 'Display', 'Frame', 'Box', 'Holder',
            'Stand', 'Plate', 'Tag', 'Label', 'Panel', 'Board', 'Case', 'Medal',
            'Certificate Holder', 'Name Badge', 'Door Sign', 'Wall Mount',
        ];

        $subcategories = [
            'Corporate Recognition', 'Employee Awards', 'Sales Achievement', 
            'Customer Appreciation', 'Event Commemoration', 'Anniversary Gifts',
            'Retirement Plaques', 'Sports Tournament', 'Academic Excellence',
            'Safety Awards', 'Quality Achievement', 'Innovation Recognition'
        ];

        $productTypes = ['metal', 'glass', 'award'];
        $backgroundColors = ['#FFFFFF', '#F5F5F5', '#E8E8E8', '#1A1A1A', '#2C3E50', '#34495E'];

        $productsCreated = 0;
        $targetProducts = 50;

        while ($productsCreated < $targetProducts) {
            $category = $categories[array_rand($categories)];
            $template = $productTemplates[array_rand($productTemplates)];
            $materialType = array_rand($this->materials);
            $material = $this->materials[$materialType][array_rand($this->materials[$materialType])];
            $item = $items[array_rand($items)];

            $name = sprintf($template, $material, $item);
            $basePrice = rand(75000, 500000);
            $vendorPrice = (int) ($basePrice * 0.6);
            $productType = $productTypes[array_rand($productTypes)];
            $businessType = $this->determineBusinessType($material, $item);
            
            // Generate comprehensive form order configuration
            $bahanSlug = strtolower(str_replace(' ', '-', $material));
            $bahanOptions = $this->generateBahanOptions($materialType);
            $kualitasOptions = ['Standard', 'Premium', 'Professional', 'Luxury'];
            $ketebalanOptions = $this->generateKetebalanOptions($materialType);
            $ukuranOptions = ['10x15', '15x20', '20x30', '25x35', '30x40', 'custom'];
            
            $product = Product::create([
                'tenant_id' => $tenant->id,
                'uuid' => Str::uuid()->toString(),
                'category_id' => $category->id,
                'name' => $name,
                'sku' => 'SKU-' . strtoupper(Str::random(8)),
                'slug' => Str::slug($name) . '-' . Str::random(4),
                'description' => $this->generateProductDescription($name, $material),
                'long_description' => $this->generateLongDescription($name, $material, $item),
                
                'price' => $basePrice,
                'currency' => 'IDR',
                'price_unit' => 'piece',
                'vendor_price' => $vendorPrice,
                'markup_percentage' => round((($basePrice - $vendorPrice) / $vendorPrice) * 100),
                
                'status' => ['draft', 'published', 'published', 'published'][rand(0, 3)],
                'type' => ['physical', 'physical', 'service'][rand(0, 2)],
                'business_type' => $businessType,
                'production_type' => ['internal', 'vendor'][rand(0, 1)],
                
                'stock_quantity' => rand(10, 100),
                'low_stock_threshold' => 10,
                'track_inventory' => true,
                
                'min_order_quantity' => rand(1, 5),
                'max_order_quantity' => rand(100, 1000),
                'lead_time' => rand(3, 14) . ' working days',
                
                'images' => $this->generateProductImages(),
                'tags' => $this->generateProductTags($material, $item),
                'categories' => [$category->name],
                
                'features' => $this->generateFeatures($material, $item),
                'specifications' => $this->generateSpecifications($material, $item),
                'metadata' => [
                    'created_by' => 'seeder', 
                    'phase' => 'phase_3',
                    'last_updated' => Carbon::now()->toDateTimeString(),
                    'version' => '2.0',
                ],
                'dimensions' => $this->generateDimensions(),
                
                // Basic material and size
                'material' => $material,
                'size' => $this->generateDefaultSize(),
                'available_sizes' => $this->generateAvailableSizes(),
                'available_materials' => $this->materials[$materialType],
                'quality_levels' => array_keys($this->qualityLevels),
                
                // Form Order Configuration Fields (NEW - Complete Data)
                'subcategory' => $subcategories[array_rand($subcategories)],
                'product_type' => $productType,
                'bahan' => $bahanSlug,
                'bahan_options' => $bahanOptions,
                'kualitas' => $kualitasOptions[array_rand($kualitasOptions)],
                'kualitas_options' => $kualitasOptions,
                'ketebalan' => $ketebalanOptions[array_rand($ketebalanOptions)],
                'ketebalan_options' => $ketebalanOptions,
                'ukuran' => $ukuranOptions[array_rand($ukuranOptions)],
                'ukuran_options' => $ukuranOptions,
                'warna_background' => $backgroundColors[array_rand($backgroundColors)],
                'design_file_url' => 'https://via.placeholder.com/1920x1080?text=Design+Template',
                'custom_texts' => $this->generateCustomTexts(),
                'notes_wysiwyg' => $this->generateProductNotes($name, $material),
                
                // Customization
                'customizable' => true,
                'custom_options' => $this->generateCustomOptions(),
                'requires_quote' => rand(0, 10) > 6,
                
                // SEO and visibility
                'featured' => rand(0, 10) > 7,
                'view_count' => rand(50, 1500),
                'average_rating' => rand(40, 50) / 10,
                'review_count' => rand(5, 100),
                
                'seo_title' => $name . ' | ' . $tenant->name . ' - Custom ' . $item,
                'seo_description' => substr($this->generateProductDescription($name, $material), 0, 155) . '...',
                'seo_keywords' => $this->generateKeywords($name),
                
                'published_at' => rand(0, 10) > 2 ? Carbon::now()->subDays(rand(1, 90)) : null,
                'created_at' => Carbon::now()->subDays(rand(1, 180)),
            ]);

            $productsCreated++;
        }
    }

    private function seedRealisticOrders($tenant): void
    {
        // Skip if tenant already has phase 3 orders
        $existingOrders = OrderEloquentModel::where('tenant_id', $tenant->id)
            ->where('order_number', 'like', 'ORD-%')
            ->count();
        if ($existingOrders >= 40) {
            return; // Already has phase 3 orders
        }

        $customers = CustomerEloquentModel::where('tenant_id', $tenant->id)->get();
        $vendors = VendorEloquentModel::where('tenant_id', $tenant->id)->get();
        $products = Product::where('tenant_id', $tenant->id)->get();

        if ($customers->isEmpty() || $products->isEmpty()) {
            return;
        }

        $orderStatuses = [
            'new' => 2,
            'sourcing_vendor' => 3,
            'vendor_negotiation' => 4,
            'customer_quotation' => 3,
            'waiting_payment' => 5,
            'payment_received' => 4,
            'in_production' => 6,
            'quality_check' => 2,
            'ready_to_ship' => 2,
            'shipped' => 3,
            'delivered' => 5,
            'completed' => 10,
            'cancelled' => 2,
        ];

        // Use tenant ID prefix to ensure unique order numbers across tenants
        $tenantPrefix = 'T' . str_pad($tenant->id, 3, '0', STR_PAD_LEFT);
        $orderNumber = 1;

        foreach ($orderStatuses as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $customer = $customers->random();
                $vendor = $vendors->isNotEmpty() ? $vendors->random() : null;
                
                $itemCount = rand(1, 4);
                $items = [];
                $subtotal = 0;

                for ($j = 0; $j < $itemCount; $j++) {
                    $product = $products->random();
                    $quantity = rand(1, 10);
                    $unitPrice = $product->price;
                    $itemTotal = $quantity * $unitPrice;
                    $subtotal += $itemTotal;

                    $items[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total' => $itemTotal,
                        'specifications' => $product->specifications,
                        'custom_options' => $product->customizable ? ['custom_text' => 'Sample Text ' . $j] : null,
                    ];
                }

                $tax = (int) ($subtotal * 0.11);
                $shippingCost = rand(20000, 100000);
                $discount = rand(0, 10) > 7 ? rand(10000, 50000) : 0;
                $totalAmount = $subtotal + $tax + $shippingCost - $discount;

                $paymentStatus = $this->getPaymentStatusFromOrderStatus($status);
                $downPaymentAmount = (int) round($totalAmount * 0.3);
                $totalPaidAmount = match ($paymentStatus) {
                    'paid' => $totalAmount,
                    'partially_paid' => $downPaymentAmount,
                    default => 0,
                };
                $totalDisbursedAmount = $paymentStatus === 'paid' ? (int) round($totalAmount * 0.6) : 0;
                $downPaymentPaidAt = in_array($paymentStatus, ['partially_paid', 'paid'], true)
                    ? Carbon::now()->subDays(rand(1, 30))
                    : null;
                $downPaymentDueAt = Carbon::now()->subDays(rand(5, 20));
                $paymentDate = $paymentStatus === 'paid' ? Carbon::now()->subDays(rand(0, 15)) : null;

                $paymentSchedule = [
                    [
                        'type' => 'down_payment',
                        'amount' => $downPaymentAmount,
                        'due_at' => $downPaymentDueAt->toIso8601String(),
                    ],
                    [
                        'type' => 'final_payment',
                        'amount' => max(0, $totalAmount - $downPaymentAmount),
                        'due_at' => Carbon::now()->addDays(rand(10, 40))->toIso8601String(),
                    ],
                ];

                $createdAt = Carbon::now()->subDays(rand(1, 90));
                
                OrderEloquentModel::create([
                    'tenant_id' => $tenant->id,
                    'order_number' => 'ORD-' . $tenantPrefix . '-' . str_pad($orderNumber++, 6, '0', STR_PAD_LEFT),
                    'customer_id' => $customer->id,
                    'vendor_id' => $vendor?->id,
                    'items' => $items,
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'shipping_cost' => $shippingCost,
                    'discount' => $discount,
                    'total_amount' => $totalAmount,
                    'down_payment_amount' => $downPaymentAmount,
                    'total_paid_amount' => $totalPaidAmount,
                    'total_disbursed_amount' => $totalDisbursedAmount,
                    'status' => $status,
                    'production_type' => $vendor ? 'vendor' : 'internal',
                    'payment_status' => $paymentStatus,
                    'payment_method' => $totalPaidAmount > 0 ? ['bank_transfer', 'cash', 'credit_card', 'e-wallet'][rand(0, 3)] : null,
                    'shipping_address' => [
                        'address' => $customer->address ?? 'Default Address',
                        'name' => $customer->name ?? 'Customer',
                        'phone' => $customer->phone ?? '',
                        'email' => $customer->email ?? '',
                    ],
                    'customer_notes' => rand(0, 10) > 6 ? 'Please handle with care' : null,
                    'internal_notes' => rand(0, 10) > 6 ? 'Priority order' : null,
                    'estimated_delivery' => $createdAt->copy()->addDays(rand(7, 30)),
                    'payment_date' => $paymentDate,
                    'down_payment_due_at' => $downPaymentDueAt,
                    'down_payment_paid_at' => $downPaymentPaidAt,
                    'payment_schedule' => $paymentSchedule,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }

    private function getPaymentStatusFromOrderStatus(string $orderStatus): string
    {
        return match($orderStatus) {
            'new', 'sourcing_vendor', 'vendor_negotiation', 'customer_quotation', 'waiting_payment' => 'unpaid',
            'payment_received', 'in_production', 'quality_check', 'ready_to_ship' => 'partially_paid',
            'shipped', 'delivered', 'completed' => 'paid',
            'cancelled' => 'cancelled',
            'refunded' => 'refunded',
            default => 'unpaid',
        };
    }

    private function generateProductDescription(string $name, string $material): string
    {
        return "High-quality {$name} made from premium {$material}. Perfect for corporate awards, recognition programs, and special occasions. Custom engraving available with professional finishing.";
    }

    private function generateLongDescription(string $name, string $material, string $item): string
    {
        return <<<EOT
**{$name}** - Professional Grade {$item}

Crafted from premium {$material}, this product represents excellence in quality and design. Ideal for:

- Corporate recognition programs
- Employee appreciation awards
- Special event commemorations
- Executive gifts and presentations

**Key Features:**
- Premium {$material} construction
- Professional laser engraving
- Customizable design options
- Quick turnaround time
- Quality guaranteed

**Production Details:**
Our experienced team uses state-of-the-art laser engraving technology to ensure precision and quality. Each piece is carefully inspected before delivery.

**Customization Options:**
We offer various customization options including text engraving, logo placement, and finish selection. Contact us for detailed quotation.
EOT;
    }

    private function generateProductImages(): array
    {
        return [
            'https://via.placeholder.com/800x600?text=Product+Image+1',
            'https://via.placeholder.com/800x600?text=Product+Image+2',
            'https://via.placeholder.com/800x600?text=Product+Image+3',
        ];
    }

    private function generateProductTags(string $material, string $item): array
    {
        $tags = ['custom', 'professional', strtolower($material), strtolower($item)];
        $additionalTags = ['premium', 'corporate', 'personalized', 'engraved', 'gift'];
        return array_merge($tags, array_slice($additionalTags, 0, rand(2, 4)));
    }

    private function generateFeatures(string $material, string $item): array
    {
        return [
            "Premium {$material} material",
            "Professional laser engraving",
            "Customizable design",
            "High-quality finish",
            "Durable construction",
            "Fast production time",
        ];
    }

    private function generateSpecifications(string $material, string $item): array
    {
        $finishes = ['Glossy', 'Matte', 'Satin', 'Polished', 'Brushed', 'Mirror Finish'];
        $thicknessOptions = ['2mm', '3mm', '5mm', '8mm', '10mm', '12mm'];
        
        return [
            'Material' => $material,
            'Product Type' => $item,
            'Finish' => $finishes[array_rand($finishes)],
            'Thickness' => $thicknessOptions[array_rand($thicknessOptions)],
            'Warranty' => rand(1, 3) . ' Year' . (rand(1, 3) > 1 ? 's' : ''),
            'Production Method' => 'Made to Order',
            'Manufacturing Time' => rand(3, 14) . ' working days',
            'Available Thickness Options' => $thicknessOptions,
            'Color Options' => [
                'Natural' => ['Natural finish', 'No coating', 'Original color'],
                'Black' => ['Matte black', 'Glossy black', 'Jet black', '#000000'],
                'Silver' => ['Brushed silver', 'Polished silver', 'Chrome silver', '#C0C0C0'],
                'Gold' => ['Champagne gold', 'Rose gold', 'Classic gold', '#FFD700'],
                'Bronze' => ['Antique bronze', 'Polished bronze', 'Vintage bronze', '#CD7F32'],
                'White' => ['Pure white', 'Off-white', 'Pearl white', '#FFFFFF'],
            ],
            'Surface Finishes' => ['Glossy', 'Matte', 'Brushed', 'Polished', 'Textured'],
            'Engraving Methods' => ['Laser Engraving', 'Chemical Etching', 'Sandblasting', 'CNC Milling'],
            'Engraving Depth' => rand(1, 5) / 10 . 'mm',
            'Text Customization' => 'Available with up to 5 lines of text',
            'Logo Support' => 'Yes, vector formats preferred (AI, EPS, SVG)',
            'Minimum Order' => rand(1, 10) . ' piece' . (rand(1, 10) > 1 ? 's' : ''),
            'Bulk Discount' => 'Available for orders above 50 pieces',
            'Certification' => ['ISO 9001:2015', 'CE Certified', 'Quality Assured'][rand(0, 2)],
            'Origin' => 'Indonesia',
            'Eco-Friendly' => rand(0, 1) ? 'Yes' : 'No',
            'Recyclable' => rand(0, 1) ? 'Yes' : 'No',
            'Package Contents' => [
                'Main product with protective film',
                'Installation guide and instructions',
                'Warranty card and certificate',
                'Cleaning cloth (microfiber)',
                'Mounting accessories (if applicable)',
            ],
            'Care Instructions' => [
                'Cleaning' => [
                    'Use soft microfiber cloth',
                    'Avoid abrasive materials and harsh chemicals',
                    'Mild soap solution recommended',
                    'Wipe dry after cleaning',
                ],
                'Storage' => [
                    'Keep in dry place away from moisture',
                    'Avoid direct sunlight exposure',
                    'Store in protective case or packaging',
                    'Temperature: 15-30°C recommended',
                ],
                'Maintenance' => [
                    'Regular cleaning recommended (weekly)',
                    'Professional polishing available',
                    'Inspect for damage periodically',
                    'Contact customer service for repairs',
                ],
            ],
            'Safety Information' => [
                'Handle with care to avoid scratches',
                'Wear gloves when handling sharp edges',
                'Keep away from children under 3 years',
                'Not for food contact use',
            ],
        ];
    }

    private function generateDimensions(): array
    {
        return [
            'width' => rand(10, 50),
            'height' => rand(10, 50),
            'depth' => rand(1, 10),
            'unit' => 'cm',
            'weight' => rand(100, 2000),
            'weight_unit' => 'grams',
        ];
    }

    private function generateCustomOptions(): array
    {
        return [
            [
                'name' => 'Engraving Text',
                'type' => 'text',
                'required' => true,
                'max_length' => 100,
            ],
            [
                'name' => 'Size',
                'type' => 'select',
                'options' => ['Small (15x20cm)', 'Medium (20x30cm)', 'Large (30x40cm)'],
                'required' => true,
            ],
            [
                'name' => 'Finish Type',
                'type' => 'select',
                'options' => ['Glossy', 'Matte', 'Brushed'],
                'required' => false,
            ],
        ];
    }

    private function generateKeywords(string $name): array
    {
        $words = explode(' ', strtolower($name));
        $keywords = array_merge($words, ['custom', 'professional', 'quality', 'engraving']);
        return array_unique(array_slice($keywords, 0, 10));
    }

    private function selectRandomMaterials(): array
    {
        $allMaterials = array_keys($this->materials);
        $count = rand(2, count($allMaterials));
        shuffle($allMaterials);
        return array_slice($allMaterials, 0, $count);
    }

    private function printSummary(): void
    {
        $categoryCount = ProductCategory::count();
        $productCount = Product::count();
        $orderCount = OrderEloquentModel::count();

        $this->command->info('');
        $this->command->info('📊 Phase 3 Seeding Summary:');
        $this->command->info("   - Product Categories: {$categoryCount} (with hierarchy)");
        $this->command->info("   - Products: {$productCount} (with detailed specs)");
        $this->command->info("   - Orders: {$orderCount} (realistic workflow states)");
        $this->command->info('');
    }

    private function determineBusinessType(string $material, string $item): string
    {
        $metalKeywords = ['metal', 'steel', 'aluminum', 'brass', 'copper', 'bronze'];
        $glassKeywords = ['glass'];
        $awardKeywords = ['trophy', 'award', 'plaque'];
        $signageKeywords = ['sign', 'display', 'holder', 'stand'];
        
        $combinedText = strtolower($material . ' ' . $item);
        
        foreach ($metalKeywords as $keyword) {
            if (str_contains($combinedText, $keyword)) {
                return 'metal_etching';
            }
        }
        
        foreach ($glassKeywords as $keyword) {
            if (str_contains($combinedText, $keyword)) {
                return 'glass_etching';
            }
        }
        
        foreach ($awardKeywords as $keyword) {
            if (str_contains($combinedText, $keyword)) {
                return 'award_plaque';
            }
        }
        
        foreach ($signageKeywords as $keyword) {
            if (str_contains($combinedText, $keyword)) {
                return 'signage';
            }
        }
        
        return 'general';
    }

    private function generateDefaultSize(): string
    {
        $sizes = ['10x15', '15x20', '20x30', '25x35', '30x40'];
        return $sizes[array_rand($sizes)];
    }

    private function generateAvailableSizes(): array
    {
        return [
            '10x15' => '10cm x 15cm',
            '15x20' => '15cm x 20cm (Rekomendasi)',
            '20x30' => '20cm x 30cm',
            '25x35' => '25cm x 35cm',
            '30x40' => '30cm x 40cm',
            'custom' => 'Custom Size',
        ];
    }

    private function generateBahanOptions(string $materialType): array
    {
        $options = $this->materials[$materialType] ?? [];
        
        // Add additional material variations
        $additionalOptions = [
            'Premium Grade',
            'Economy Grade',
            'Commercial Grade',
            'Industrial Grade',
        ];
        
        return array_merge($options, $additionalOptions);
    }

    private function generateKetebalanOptions(string $materialType): array
    {
        $baseOptions = ['1mm', '2mm', '3mm', '5mm', '8mm', '10mm'];
        
        // Different material types have different thickness ranges
        if ($materialType === 'Metal') {
            return ['1mm', '1.5mm', '2mm', '3mm', '5mm', '8mm'];
        } elseif ($materialType === 'Acrylic' || $materialType === 'Glass') {
            return ['3mm', '5mm', '8mm', '10mm', '12mm', '15mm'];
        } elseif ($materialType === 'Wood') {
            return ['5mm', '8mm', '10mm', '12mm', '15mm', '18mm', '20mm'];
        }
        
        return $baseOptions;
    }

    private function generateCustomTexts(): array
    {
        $placements = ['Top Center', 'Bottom Center', 'Center', 'Top Left', 'Top Right'];
        $positions = ['header', 'body', 'footer', 'left', 'right'];
        $colors = ['#000000', '#FFFFFF', '#FFD700', '#C0C0C0', '#1A1A1A'];
        
        $texts = [];
        $textCount = rand(1, 3);
        
        for ($i = 0; $i < $textCount; $i++) {
            $texts[] = [
                'text' => 'Sample Text Line ' . ($i + 1),
                'placement' => $placements[array_rand($placements)],
                'position' => $positions[array_rand($positions)],
                'color' => $colors[array_rand($colors)],
            ];
        }
        
        return $texts;
    }

    private function generateProductNotes(string $name, string $material): string
    {
        return <<<EOT
<h3>Catatan Produksi</h3>
<p>Produk <strong>{$name}</strong> dibuat dari material <strong>{$material}</strong> berkualitas tinggi dengan proses produksi yang teliti.</p>

<h4>Perhatian Khusus:</h4>
<ul>
<li>Waktu produksi dapat bervariasi tergantung kompleksitas desain</li>
<li>Untuk order dalam jumlah besar (>50 pcs), silakan hubungi tim sales untuk harga khusus</li>
<li>Desain custom memerlukan approval sebelum produksi dimulai</li>
<li>Perubahan desain setelah approval akan dikenakan biaya tambahan</li>
</ul>

<h4>Kualitas Terjamin:</h4>
<p>Setiap produk melalui quality control ketat sebelum dikirim. Garansi 1 tahun untuk cacat produksi.</p>

<h4>Pengiriman:</h4>
<p>Produk dikemas dengan aman menggunakan bubble wrap dan box khusus untuk menghindari kerusakan saat pengiriman.</p>
EOT;
    }
}
