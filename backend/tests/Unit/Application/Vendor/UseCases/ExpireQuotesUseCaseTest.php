<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\ExpireQuotesCommand;
use App\Application\Vendor\UseCases\ExpireQuotesUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpireQuotesUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private ExpireQuotesUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new ExpireQuotesUseCase();
    }

    /** @test */
    public function it_expires_quotes_past_expiration_date(): void
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

        // Create expired quote
        $expiredQuote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->subDays(1), // Expired yesterday
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(7),
        ]);

        $command = new ExpireQuotesCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(1, $result['expired_count']);
        $this->assertCount(1, $result['quotes']);
        $this->assertEquals($expiredQuote, $result['quotes'][0]['id']);
        
        // Verify database
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $expiredQuote,
            'status' => 'expired',
        ]);
        
        // Verify closed_at is set
        $quote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')
            ->where('id', $expiredQuote)
            ->first();
        $this->assertNotNull($quote->closed_at);
    }

    /** @test */
    public function it_only_expires_sent_and_pending_response_quotes(): void
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

        // Create quotes with different statuses, all expired
        $sentQuote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->subDays(1),
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(7),
        ]);

        $acceptedQuote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'accepted', // Should not be expired
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->subDays(1),
            'responded_at' => now()->subDays(2),
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(2),
        ]);

        $command = new ExpireQuotesCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(1, $result['expired_count']); // Only sent quote
        
        // Verify sent quote is expired
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $sentQuote,
            'status' => 'expired',
        ]);
        
        // Verify accepted quote is NOT expired
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $acceptedQuote,
            'status' => 'accepted', // Unchanged
        ]);
    }

    /** @test */
    public function it_does_not_expire_quotes_not_yet_expired(): void
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

        // Create quote expiring in future
        $futureQuote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->addDays(7), // Expires in future
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $command = new ExpireQuotesCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(0, $result['expired_count']);
        $this->assertEmpty($result['quotes']);
        
        // Verify quote status unchanged
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $futureQuote,
            'status' => 'sent', // Unchanged
        ]);
    }

    /** @test */
    public function it_supports_tenant_specific_expiration(): void
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

        // Create expired quotes for both tenants
        $quote1 = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant1->id,
            'order_id' => $order1->id,
            'vendor_id' => $vendor1->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->subDays(1),
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(7),
        ]);

        $quote2 = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant2->id,
            'order_id' => $order2->id,
            'vendor_id' => $vendor2->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->subDays(1),
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(7),
        ]);

        // Expire only tenant1 quotes
        $command = new ExpireQuotesCommand(tenantId: $tenant1->id);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(1, $result['expired_count']);
        
        // Verify tenant1 quote is expired
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $quote1,
            'status' => 'expired',
        ]);
        
        // Verify tenant2 quote is NOT expired
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $quote2,
            'status' => 'sent', // Unchanged
        ]);
    }

    /** @test */
    public function it_supports_batch_limiting(): void
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

        // Create 5 expired quotes
        for ($i = 0; $i < 5; $i++) {
            \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insert([
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'sent',
                'initial_offer' => 100000,
                'latest_offer' => 100000,
                'currency' => 'IDR',
                'round' => 1,
                'expires_at' => now()->subDays(1),
                'created_at' => now()->subDays(7),
                'updated_at' => now()->subDays(7),
            ]);
        }

        // Limit to 3 quotes per run
        $command = new ExpireQuotesCommand(limit: 3);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(3, $result['expired_count']); // Only 3 expired
        $this->assertCount(3, $result['quotes']);
    }

    /** @test */
    public function it_returns_empty_result_when_no_quotes_to_expire(): void
    {
        // Arrange
        $command = new ExpireQuotesCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(0, $result['expired_count']);
        $this->assertEmpty($result['quotes']);
        $this->assertNotNull($result['executed_at']);
    }
}
