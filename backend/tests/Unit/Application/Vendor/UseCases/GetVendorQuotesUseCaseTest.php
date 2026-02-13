<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetVendorQuotesQuery;
use App\Application\Vendor\UseCases\GetVendorQuotesUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class GetVendorQuotesUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private GetVendorQuotesUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new GetVendorQuotesUseCase();
    }

    /** @test */
    public function it_successfully_retrieves_vendor_quotes(): void
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

        // Create 3 quotes for this vendor
        for ($i = 0; $i < 3; $i++) {
            DB::table('order_vendor_negotiations')->insert([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'sent', // Valid status: draft, sent, pending_response, accepted, rejected, countered, expired
                'initial_offer' => 100000 + ($i * 10000),
                'latest_offer' => 100000 + ($i * 10000),
                'currency' => 'IDR',
                'round' => 1,
                'created_at' => now()->subDays($i),
                'updated_at' => now()->subDays($i),
            ]);
        }

        $query = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertCount(3, $result['data']);
        
        // Verify data structure
        $firstQuote = $result['data'][0];
        $this->assertArrayHasKey('uuid', $firstQuote);
        $this->assertArrayHasKey('order_id', $firstQuote);
        $this->assertArrayHasKey('vendor_id', $firstQuote);
        $this->assertArrayHasKey('status', $firstQuote);
        $this->assertArrayHasKey('initial_offer', $firstQuote);
        $this->assertArrayHasKey('latest_offer', $firstQuote);
        $this->assertArrayHasKey('currency', $firstQuote);
        
        // Verify pagination
        $this->assertEquals(3, $result['pagination']['total']);
        $this->assertEquals(1, $result['pagination']['current_page']);
        $this->assertEquals(15, $result['pagination']['per_page']);
    }

    /** @test */
    public function it_filters_quotes_by_status(): void
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

        // Create quotes with different statuses
        DB::table('order_vendor_negotiations')->insert([
            [
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'sent',
                'initial_offer' => 100000,
                'latest_offer' => 100000,
                'currency' => 'IDR',
                'round' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'accepted',
                'initial_offer' => 110000,
                'latest_offer' => 110000,
                'currency' => 'IDR',
                'round' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'rejected',
                'initial_offer' => 120000,
                'latest_offer' => 120000,
                'currency' => 'IDR',
                'round' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        $query = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            status: 'sent'
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertCount(1, $result['data']);
        $this->assertEquals('sent', $result['data'][0]['status']);
        $this->assertEquals(1, $result['pagination']['total']);
    }

    /** @test */
    public function it_supports_pagination(): void
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

        // Create 25 quotes
        for ($i = 0; $i < 25; $i++) {
            DB::table('order_vendor_negotiations')->insert([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'sent',
                'initial_offer' => 100000 + $i,
                'latest_offer' => 100000 + $i,
                'currency' => 'IDR',
                'round' => 1,
                'created_at' => now()->subMinutes($i),
                'updated_at' => now()->subMinutes($i),
            ]);
        }

        // Test page 1
        $query1 = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            page: 1,
            perPage: 10
        );

        $result1 = $this->useCase->execute($query1);

        $this->assertCount(10, $result1['data']);
        $this->assertEquals(25, $result1['pagination']['total']);
        $this->assertEquals(1, $result1['pagination']['current_page']);
        $this->assertEquals(3, $result1['pagination']['last_page']);
        $this->assertEquals(1, $result1['pagination']['from']);
        $this->assertEquals(10, $result1['pagination']['to']);

        // Test page 2
        $query2 = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            page: 2,
            perPage: 10
        );

        $result2 = $this->useCase->execute($query2);

        $this->assertCount(10, $result2['data']);
        $this->assertEquals(2, $result2['pagination']['current_page']);
        $this->assertEquals(11, $result2['pagination']['from']);
        $this->assertEquals(20, $result2['pagination']['to']);

        // Test page 3 (last page with 5 items)
        $query3 = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            page: 3,
            perPage: 10
        );

        $result3 = $this->useCase->execute($query3);

        $this->assertCount(5, $result3['data']);
        $this->assertEquals(3, $result3['pagination']['current_page']);
        $this->assertEquals(21, $result3['pagination']['from']);
        $this->assertEquals(25, $result3['pagination']['to']);
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
        $vendor2 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant2->id,
        ]);
        
        $customer1 = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);
        $customer2 = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant2->id,
        ]);
        
        $order1 = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant1->id,
            'customer_id' => $customer1->id,
        ]);
        $order2 = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant2->id,
            'customer_id' => $customer2->id,
        ]);

        // Create quotes for both tenants
        DB::table('order_vendor_negotiations')->insert([
            [
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
            ],
            [
                'tenant_id' => $tenant2->id,
                'order_id' => $order2->id,
                'vendor_id' => $vendor2->id,
                'status' => 'sent',
                'initial_offer' => 200000,
                'latest_offer' => 200000,
                'currency' => 'IDR',
                'round' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Query for tenant1's vendor
        $query = new GetVendorQuotesQuery(
            vendorId: $vendor1->id,
            tenantId: $tenant1->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert - should only see tenant1's quotes
        $this->assertCount(1, $result['data']);
        $this->assertEquals($vendor1->id, $result['data'][0]['vendor_id']);
        $this->assertEquals(100000, $result['data'][0]['initial_offer']);
    }

    /** @test */
    public function it_returns_empty_result_when_no_quotes_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $query = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertCount(0, $result['data']);
        $this->assertEquals(0, $result['pagination']['total']);
        $this->assertEquals(0, $result['pagination']['last_page']);
    }

    /** @test */
    public function it_orders_quotes_by_created_at_desc(): void
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

        // Create quotes with different timestamps
        $oldestQuote = DB::table('order_vendor_negotiations')->insertGetId([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now()->subDays(3),
            'updated_at' => now()->subDays(3),
        ]);

        $middleQuote = DB::table('order_vendor_negotiations')->insertGetId([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 110000,
            'latest_offer' => 110000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ]);

        $newestQuote = DB::table('order_vendor_negotiations')->insertGetId([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 120000,
            'latest_offer' => 120000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now()->subDays(1),
            'updated_at' => now()->subDays(1),
        ]);

        $query = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert - newest first
        $this->assertCount(3, $result['data']);
        $this->assertEquals($newestQuote, $result['data'][0]['id']);
        $this->assertEquals($middleQuote, $result['data'][1]['id']);
        $this->assertEquals($oldestQuote, $result['data'][2]['id']);
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

        // Create active quote
        DB::table('order_vendor_negotiations')->insert([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create soft-deleted quote
        DB::table('order_vendor_negotiations')->insert([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'expired',
            'initial_offer' => 110000,
            'latest_offer' => 110000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
            'deleted_at' => now(),
        ]);

        $query = new GetVendorQuotesQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert - should only see active quote
        $this->assertCount(1, $result['data']);
        $this->assertEquals(100000, $result['data'][0]['initial_offer']);
    }
}
