<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetVendorProfileQuery;
use App\Application\Vendor\UseCases\GetVendorProfileUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Tests\TestCase;

class GetVendorProfileUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private GetVendorProfileUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new GetVendorProfileUseCase();
    }

    /** @test */
    public function it_successfully_retrieves_vendor_profile(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@example.com',
            'phone' => '081234567890',
        ]);

        $query = new GetVendorProfileQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertIsArray($result);
        $this->assertEquals('Test Vendor Company', $result['company_name']);
        $this->assertEquals('vendor@example.com', $result['email']);
        $this->assertEquals('081234567890', $result['phone']);
        $this->assertArrayHasKey('performance_metrics', $result);
    }

    /** @test */
    public function it_includes_performance_metrics(): void
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
        $acceptedQuote = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'accepted',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'responded_at' => now(),
            'created_at' => now()->subHours(2),
            'updated_at' => now(),
        ]);

        $rejectedQuote = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'rejected',
            'initial_offer' => 110000,
            'latest_offer' => 110000,
            'currency' => 'IDR',
            'round' => 1,
            'responded_at' => now(),
            'created_at' => now()->subHours(1),
            'updated_at' => now(),
        ]);

        $pendingQuote = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 120000,
            'latest_offer' => 120000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetVendorProfileQuery(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $metrics = $result['performance_metrics'];
        $this->assertEquals(3, $metrics['total_quotes']);
        $this->assertEquals(1, $metrics['accepted_quotes']);
        $this->assertEquals(1, $metrics['rejected_quotes']);
        $this->assertEquals(1, $metrics['pending_quotes']);
        $this->assertEquals(33.33, $metrics['acceptance_rate']);
        $this->assertNotNull($metrics['avg_response_time_hours']);
    }

    /** @test */
    public function it_throws_exception_when_vendor_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        $query = new GetVendorProfileQuery(
            vendorId: 99999,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $tenant1 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $tenant2 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);

        $query = new GetVendorProfileQuery(
            vendorId: $vendor->id,
            tenantId: $tenant2->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($query);
    }
}
