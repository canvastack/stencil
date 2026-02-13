<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetQuoteDetailQuery;
use App\Application\Vendor\UseCases\GetQuoteDetailUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Tests\TestCase;

class GetQuoteDetailUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private GetQuoteDetailUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new GetQuoteDetailUseCase();
    }

    /** @test */
    public function it_successfully_retrieves_quote_detail(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'phone' => '081234567890',
        ]);
        $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Custom Etching Plate',
            'sku' => 'CEP-001',
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-2024-001',
            'status' => 'vendor_negotiation',
            'total_amount' => 500000,
        ]);

        $quoteUuid = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => $uuid = \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'product_id' => $product->id,
            'status' => 'sent',
            'initial_offer' => 450000,
            'latest_offer' => 450000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteDetailQuery(
            quoteUuid: $uuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals($uuid, $result['uuid']);
        $this->assertEquals($vendor->id, $result['vendor_id']);
        $this->assertEquals('sent', $result['status']);
        $this->assertEquals(450000, $result['initial_offer']);
        $this->assertEquals(450000, $result['latest_offer']);
        $this->assertEquals('IDR', $result['currency']);
        
        // Verify order data
        $this->assertArrayHasKey('order', $result);
        $this->assertEquals('ORD-2024-001', $result['order']['order_number']);
        $this->assertEquals('vendor_negotiation', $result['order']['status']);
        $this->assertEquals(500000, $result['order']['total_amount']);
        
        // Verify customer data
        $this->assertArrayHasKey('customer', $result);
        $this->assertEquals('Test Customer', $result['customer']['name']);
        $this->assertEquals('customer@example.com', $result['customer']['email']);
        $this->assertEquals('081234567890', $result['customer']['phone']);
        
        // Verify product data
        $this->assertArrayHasKey('product', $result);
        $this->assertNotNull($result['product']);
        $this->assertEquals('Custom Etching Plate', $result['product']['name']);
        $this->assertEquals('CEP-001', $result['product']['sku']);
    }

    /** @test */
    public function it_throws_exception_when_quote_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $query = new GetQuoteDetailQuery(
            quoteUuid: \Illuminate\Support\Str::uuid()->toString(),
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_enforces_vendor_ownership(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor1 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor2 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        // Create quote for vendor1
        $uuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $uuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor1->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Try to access with vendor2
        $query = new GetQuoteDetailQuery(
            quoteUuid: $uuid,
            vendorId: $vendor2->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $tenant1 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $tenant2 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor1 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);
        $customer1 = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);
        $order1 = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant1->id,
            'customer_id' => $customer1->id,
        ]);

        // Create quote for tenant1
        $uuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $uuid,
            'tenant_id' => $tenant1->id,
            'order_id' => $order1->id,
            'vendor_id' => $vendor1->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Try to access from tenant2
        $query = new GetQuoteDetailQuery(
            quoteUuid: $uuid,
            vendorId: $vendor1->id,
            tenantId: $tenant2->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_excludes_soft_deleted_quotes(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        // Create soft-deleted quote
        $uuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $uuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'expired',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => now(),
        ]);

        $query = new GetQuoteDetailQuery(
            quoteUuid: $uuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_handles_quote_without_product(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        $uuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $uuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'product_id' => null, // No product
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteDetailQuery(
            quoteUuid: $uuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertArrayHasKey('product', $result);
        $this->assertNull($result['product']);
    }

    /** @test */
    public function it_includes_quote_details_and_history(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        $quoteDetails = json_encode([
            'title' => 'Custom Etching Quote',
            'description' => 'High-quality etching service',
            'items' => [
                ['name' => 'Etching Plate', 'quantity' => 10, 'price' => 45000],
            ],
        ]);

        $history = json_encode([
            ['action' => 'created', 'timestamp' => now()->toISOString()],
            ['action' => 'sent', 'timestamp' => now()->addMinutes(5)->toISOString()],
        ]);

        $uuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $uuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 450000,
            'latest_offer' => 450000,
            'currency' => 'IDR',
            'quote_details' => $quoteDetails,
            'history' => $history,
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteDetailQuery(
            quoteUuid: $uuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertArrayHasKey('quote_details', $result);
        $this->assertIsArray($result['quote_details']);
        $this->assertEquals('Custom Etching Quote', $result['quote_details']['title']);
        
        $this->assertArrayHasKey('history', $result);
        $this->assertIsArray($result['history']);
        $this->assertCount(2, $result['history']);
        $this->assertEquals('created', $result['history'][0]['action']);
        $this->assertEquals('sent', $result['history'][1]['action']);
    }
}
