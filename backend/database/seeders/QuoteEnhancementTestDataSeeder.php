<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Models\ProductFormConfiguration;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Order\Enums\PaymentType;
use Ramsey\Uuid\Uuid;

class QuoteEnhancementTestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🎯 Seeding Quote Enhancement Test Data...');

        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();

        if (!$tenant) {
            $this->command->error('❌ PT Custom Etching Xenial tenant not found!');
            return;
        }

        $this->command->info("✅ Found tenant: {$tenant->name}");

        $customer = $this->getOrCreateCustomer($tenant->id);
        $this->command->info("✅ Customer: {$customer->name}");

        $vendor = $this->getOrCreateVendor($tenant->id);
        $this->command->info("✅ Vendor: {$vendor->name}");

        $product = $this->createProductWithForm($tenant->id);
        $this->command->info("✅ Product: {$product->name}");

        $order = $this->createOrderWithSpecifications($tenant->id, $customer->id, $product);
        $this->command->info("✅ Order: {$order->order_number}");

        $quote = $this->createQuoteWithFormSchema($tenant->id, $order->id, $vendor->id, $product);
        $this->command->info("✅ Quote: {$quote->uuid}");

        $this->command->info('🎉 Done!');
    }

    private function getOrCreateCustomer(int $tenantId): Customer
    {
        $customer = Customer::where('tenant_id', $tenantId)
            ->where('email', 'test.customer@example.com')
            ->first();

        if ($customer) {
            return $customer;
        }

        return Customer::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Test Customer',
            'first_name' => 'Test',
            'last_name' => 'Customer',
            'email' => 'test.customer@example.com',
            'phone' => '+62812345678',
            'customer_type' => 'business',
            'company_name' => 'PT Test Customer Indonesia',
            'address' => 'Jl. Test No. 123, Jakarta Selatan',
            'city' => 'Jakarta Selatan',
            'province' => 'DKI Jakarta',
            'postal_code' => '12345',
            'status' => 'active',
        ]);
    }

    private function getOrCreateVendor(int $tenantId): Vendor
    {
        $vendor = Vendor::where('tenant_id', $tenantId)
            ->where('email', 'test.vendor@example.com')
            ->first();

        if ($vendor) {
            return $vendor;
        }

        return Vendor::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'CV Test Vendor',
            'code' => 'VND-TEST-001',
            'email' => 'test.vendor@example.com',
            'phone' => '+62812345679',
            'contact_person' => 'Budi Vendor',
            'category' => 'Etching & Engraving',
            'company_name' => 'CV Test Vendor Indonesia',
            'address' => 'Jl. Vendor No. 456, Jakarta Utara, DKI Jakarta 12346, Indonesia',
            'status' => 'active',
            'rating' => 4.5,
        ]);
    }

    private function createProductWithForm(int $tenantId): Product
    {
        // Get existing product from PT CEX (created by PtCexProductSeeder)
        // Use "Plakat 30 Years Beyond Partnership" as test product
        $product = Product::where('tenant_id', $tenantId)
            ->where('sku', 'CEX-AWA-0009')
            ->first();

        if (!$product) {
            // Fallback: get any published product for this tenant
            $product = Product::where('tenant_id', $tenantId)
                ->where('status', 'published')
                ->first();
        }

        if (!$product) {
            throw new \Exception('No products found for tenant. Please run PtCexProductSeeder first.');
        }

        // Create or update form configuration for this product
        $this->createOrUpdateFormConfiguration($tenantId, $product->id, $product->uuid);
        
        return $product;
    }

    private function createOrUpdateFormConfiguration(int $tenantId, int $productId, string $productUuid): void
    {
        $formSchema = [
            'fields' => [
                ['name' => 'jenis_plakat', 'label' => 'Jenis Plakat', 'type' => 'select', 'options' => ['Plakat Logam', 'Plakat Akrilik'], 'required' => true],
                ['name' => 'jenis_logam', 'label' => 'Jenis Logam', 'type' => 'radio', 'options' => ['Stainless Steel 304', 'Kuningan'], 'required' => true],
                ['name' => 'ketebalan_plat', 'label' => 'Ketebalan Plat', 'type' => 'select', 'options' => ['1mm', '2mm', '3mm'], 'required' => true],
                ['name' => 'ukuran_plakat', 'label' => 'Ukuran Plakat', 'type' => 'text', 'required' => true],
                ['name' => 'text_engraving', 'label' => 'Text Engraving', 'type' => 'textarea', 'required' => false],
                ['name' => 'finishing', 'label' => 'Finishing', 'type' => 'select', 'options' => ['Polished', 'Brushed'], 'required' => false],
            ],
        ];

        ProductFormConfiguration::updateOrCreate(
            ['tenant_id' => $tenantId, 'product_id' => $productId],
            [
                'product_uuid' => $productUuid,
                'form_schema' => $formSchema,
                'is_active' => true,
            ]
        );
    }

    private function createOrderWithSpecifications(int $tenantId, int $customerId, Product $product): Order
    {
        $order = Order::where('tenant_id', $tenantId)
            ->where('order_number', 'ORD-TEST-QE-001')
            ->first();

        if ($order) {
            return $order;
        }

        $specifications = [
            'jenis_plakat' => 'Plakat Logam',
            'jenis_logam' => 'Stainless Steel 304',
            'ketebalan_plat' => '2mm',
            'ukuran_plakat' => '30x40cm',
            'text_engraving' => '30 Years Beyond Partnership',
            'finishing' => 'Polished',
        ];

        $quantity = 2;
        $unitPrice = 3114510;
        $subtotal = $unitPrice * $quantity;

        $items = [
            [
                'product_id' => $product->id,
                'product_uuid' => $product->uuid,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'specifications' => $specifications,
                'notes' => 'Test order',
            ],
        ];

        return Order::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'order_number' => 'ORD-TEST-QE-001',
            'customer_id' => $customerId,
            'status' => OrderStatus::PENDING->value,
            'payment_status' => PaymentStatus::UNPAID->value,
            'payment_type' => PaymentType::FULL100->value,
            'subtotal' => $subtotal,
            'tax' => 0,
            'shipping_cost' => 0,
            'total_amount' => $subtotal,
            'items' => $items,
            'shipping_address' => ['name' => 'PT Test Customer', 'address' => 'Jakarta'],
            'notes' => 'Test order with specifications',
        ]);
    }

    private function createQuoteWithFormSchema(int $tenantId, int $orderId, int $vendorId, Product $product): OrderVendorNegotiation
    {
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->where('vendor_id', $vendorId)
            ->first();

        if ($quote) {
            return $quote;
        }

        $formConfig = ProductFormConfiguration::where('tenant_id', $tenantId)
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->first();

        $formSchema = $formConfig ? $formConfig->form_schema : null;

        $quoteDetails = [
            'title' => 'Quote for Plakat Test',
            'description' => 'Test quote',
            'terms_and_conditions' => 'Payment: 50% upfront',
            'notes' => 'Test quote with specifications',
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $product->uuid,
                    'description' => $product->name,
                    'quantity' => 2,
                    'unit_price' => 3114510,
                    'vendor_cost' => 250000,
                    'total_price' => 6229020,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'jenis_logam' => 'Stainless Steel 304',
                        'ketebalan_plat' => '2mm',
                        'ukuran_plakat' => '30x40cm',
                        'text_engraving' => '30 Years Beyond Partnership',
                        'finishing' => 'Polished',
                    ],
                    'form_schema' => $formSchema,
                    'notes' => 'Special engraving',
                ],
            ],
        ];

        return OrderVendorNegotiation::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'order_id' => $orderId,
            'vendor_id' => $vendorId,
            'initial_offer' => 6229020,
            'latest_offer' => 6229020,
            'currency' => 'IDR',
            'quote_details' => $quoteDetails,
            'status' => 'open',
            'round' => 1,
            'expires_at' => now()->addDays(30),
            'history' => [],
        ]);
    }
}