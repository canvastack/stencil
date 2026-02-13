<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\SendQuoteRemindersCommand;
use App\Application\Vendor\UseCases\SendQuoteRemindersUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SendQuoteRemindersUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private SendQuoteRemindersUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new SendQuoteRemindersUseCase();
    }

    /** @test */
    public function it_sends_reminders_for_quotes_expiring_soon(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create(['tenant_id' => $tenant->id]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create(['tenant_id' => $tenant->id]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        $quote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->addDays(2), // Expires in 2 days
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(5),
        ]);

        $command = new SendQuoteRemindersCommand(daysBeforeExpiry: 3);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(1, $result['reminders_sent']);
        $this->assertCount(1, $result['quotes']);
        
        // Verify history updated
        $updatedQuote = \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')
            ->where('id', $quote)
            ->first();
        $history = json_decode($updatedQuote->history, true);
        $this->assertNotEmpty($history);
        $this->assertEquals('reminder_sent', $history[0]['action']);
        $this->assertArrayHasKey('timestamp', $history[0]);
    }

    /** @test */
    public function it_does_not_send_reminders_for_already_responded_quotes(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create(['tenant_id' => $tenant->id]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create(['tenant_id' => $tenant->id]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insert([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'accepted',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->addDays(2),
            'closed_at' => now()->subDays(1), // Already closed
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(1),
        ]);

        $command = new SendQuoteRemindersCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(0, $result['reminders_sent']);
    }

    /** @test */
    public function it_does_not_send_duplicate_reminders_within_24_hours(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create(['tenant_id' => $tenant->id]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create(['tenant_id' => $tenant->id]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        $history = json_encode([
            [
                'action' => 'reminder_sent',
                'timestamp' => now()->subHours(12)->toDateTimeString(), // Sent 12 hours ago
                'days_until_expiry' => 2,
            ],
        ]);

        \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insert([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'pending_response',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'expires_at' => now()->addDays(2),
            'history' => $history,
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subHours(12),
        ]);

        $command = new SendQuoteRemindersCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(0, $result['reminders_sent']); // No duplicate reminder
    }

    /** @test */
    public function it_supports_tenant_specific_reminders(): void
    {
        // Arrange
        $tenant1 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $tenant2 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor1 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create(['tenant_id' => $tenant1->id]);
        $vendor2 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create(['tenant_id' => $tenant2->id]);
        
        $customer1 = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create(['tenant_id' => $tenant1->id]);
        $customer2 = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create(['tenant_id' => $tenant2->id]);
        
        $order1 = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant1->id,
            'customer_id' => $customer1->id,
        ]);
        $order2 = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant2->id,
            'customer_id' => $customer2->id,
        ]);

        \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insert([
            [
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $tenant1->id,
                'order_id' => $order1->id,
                'vendor_id' => $vendor1->id,
                'status' => 'sent',
                'initial_offer' => 100000,
                'latest_offer' => 100000,
                'currency' => 'IDR',
                'round' => 1,
                'expires_at' => now()->addDays(2),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
            [
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $tenant2->id,
                'order_id' => $order2->id,
                'vendor_id' => $vendor2->id,
                'status' => 'sent',
                'initial_offer' => 100000,
                'latest_offer' => 100000,
                'currency' => 'IDR',
                'round' => 1,
                'expires_at' => now()->addDays(2),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5),
            ],
        ]);

        $command = new SendQuoteRemindersCommand(tenantId: $tenant1->id);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(1, $result['reminders_sent']); // Only tenant1
    }

    /** @test */
    public function it_returns_empty_result_when_no_reminders_needed(): void
    {
        // Arrange
        $command = new SendQuoteRemindersCommand();

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals(0, $result['reminders_sent']);
        $this->assertEmpty($result['quotes']);
        $this->assertNotNull($result['executed_at']);
    }
}
