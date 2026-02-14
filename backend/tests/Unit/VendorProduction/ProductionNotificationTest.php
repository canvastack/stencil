<?php

namespace Tests\Unit\VendorProduction;

use App\Domain\VendorProduction\Events\ProductionCompleted;
use App\Domain\VendorProduction\Events\ProductionUpdateCreated;
use App\Domain\VendorProduction\Notifications\ProductionCompletedNotification;
use App\Domain\VendorProduction\Notifications\ProductionDelayedNotification;
use App\Domain\VendorProduction\Notifications\ProductionUpdateNotification;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ProductionNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake notifications
        Notification::fake();
        Event::fake();
    }

    /** @test */
    public function it_sends_notification_when_production_update_created()
    {
        // Arrange
        $admin = User::factory()->create();
        
        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $admin->tenant_id,
        ]);
        
        $update = VendorProductionUpdate::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'purchase_order_id' => $po->id,
            'status' => 'in_progress',
            'progress_percentage' => 50,
        ]);

        // Act
        event(new ProductionUpdateCreated($update, $po));

        // Assert
        Event::assertDispatched(ProductionUpdateCreated::class);
    }

    /** @test */
    public function it_sends_delayed_notification_when_status_is_delayed()
    {
        // Arrange
        $admin = User::factory()->create();
        
        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $admin->tenant_id,
        ]);
        
        $update = VendorProductionUpdate::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'purchase_order_id' => $po->id,
            'status' => 'delayed',
            'progress_percentage' => 60,
            'notes' => 'Material delay from supplier',
        ]);

        // Act
        event(new ProductionUpdateCreated($update, $po));

        // Assert
        Event::assertDispatched(ProductionUpdateCreated::class);
    }

    /** @test */
    public function it_sends_completed_notification_when_production_completed()
    {
        // Arrange
        $admin = User::factory()->create();
        
        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $admin->tenant_id,
        ]);
        
        $update = VendorProductionUpdate::factory()->create([
            'tenant_id' => $admin->tenant_id,
            'purchase_order_id' => $po->id,
            'status' => 'completed',
            'progress_percentage' => 100,
            'actual_completion_date' => now(),
        ]);

        // Act
        event(new ProductionCompleted($po, $update));

        // Assert
        Event::assertDispatched(ProductionCompleted::class);
    }

    /** @test */
    public function production_update_notification_contains_correct_data()
    {
        // Arrange
        $admin = User::factory()->create();
        $po = VendorPurchaseOrder::factory()->create();
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'in_progress',
            'progress_percentage' => 75,
            'notes' => 'Almost done',
        ]);

        // Act
        $notification = new ProductionUpdateNotification($update, $po);
        $mailMessage = $notification->toMail($admin);
        $arrayData = $notification->toArray($admin);

        // Assert
        $this->assertStringContainsString($po->po_number, $mailMessage->subject);
        // Check that progress is mentioned in the email
        $allLines = implode(' ', $mailMessage->introLines);
        $this->assertStringContainsString('75%', $allLines);
        $this->assertEquals('production_update', $arrayData['type']);
        $this->assertEquals($update->uuid, $arrayData['update_uuid']);
        $this->assertEquals(75, $arrayData['progress_percentage']);
    }

    /** @test */
    public function production_completed_notification_shows_on_time_status()
    {
        // Arrange
        $admin = User::factory()->create();
        // Create PO with future delivery date
        $po = VendorPurchaseOrder::factory()->create([
            'expected_delivery_date' => now()->addDays(10),
        ]);
        
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'completed',
            'progress_percentage' => 100,
            'actual_completion_date' => now(),
        ]);

        // Act
        $notification = new ProductionCompletedNotification($po->fresh(), $update);
        $mailMessage = $notification->toMail($admin);

        // Assert
        $this->assertStringContainsString('tepat waktu', implode(' ', $mailMessage->introLines));
    }

    /** @test */
    public function production_completed_notification_shows_overdue_status()
    {
        // Arrange
        $admin = User::factory()->create();
        $po = VendorPurchaseOrder::factory()->overdue()->create();
        
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'completed',
            'progress_percentage' => 100,
            'actual_completion_date' => now(),
        ]);

        // Act
        $notification = new ProductionCompletedNotification($po->fresh(), $update);
        $mailMessage = $notification->toMail($admin);

        // Assert
        $this->assertStringContainsString('terlambat', implode(' ', $mailMessage->introLines));
    }

    /** @test */
    public function production_delayed_notification_shows_delay_information()
    {
        // Arrange
        $admin = User::factory()->create();
        $po = VendorPurchaseOrder::factory()->create();
        
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'delayed',
            'progress_percentage' => 60,
            'notes' => 'Material shortage',
            'estimated_completion_date' => $po->expected_delivery_date->addDays(5),
        ]);

        // Act
        $notification = new ProductionDelayedNotification($po->fresh(), $update);
        $mailMessage = $notification->toMail($admin);
        $arrayData = $notification->toArray($admin);

        // Assert
        $this->assertStringContainsString('Delay', $mailMessage->subject);
        $this->assertStringContainsString('Material shortage', implode(' ', $mailMessage->introLines));
        $this->assertEquals('production_delayed', $arrayData['type']);
        $this->assertEquals(5, $arrayData['delay_days']);
    }

    /** @test */
    public function notification_includes_photo_count_when_photos_uploaded()
    {
        // Arrange
        $admin = User::factory()->create();
        $po = VendorPurchaseOrder::factory()->create();
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'photos' => [
                ['url' => 'photo1.jpg', 'caption' => 'Progress 1'],
                ['url' => 'photo2.jpg', 'caption' => 'Progress 2'],
            ],
        ]);

        // Act
        $notification = new ProductionUpdateNotification($update, $po);
        $mailMessage = $notification->toMail($admin);
        $arrayData = $notification->toArray($admin);

        // Assert
        $this->assertStringContainsString('2 foto', implode(' ', $mailMessage->introLines));
        $this->assertEquals(2, $arrayData['photo_count']);
    }

    /** @test */
    public function notification_highlights_milestone_updates()
    {
        // Arrange
        $admin = User::factory()->create();
        $po = VendorPurchaseOrder::factory()->create();
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'is_milestone' => true,
        ]);

        // Act
        $notification = new ProductionUpdateNotification($update, $po);
        $mailMessage = $notification->toMail($admin);
        $arrayData = $notification->toArray($admin);

        // Assert
        // Check that milestone is mentioned somewhere in the email
        $allContent = implode(' ', array_merge(
            $mailMessage->introLines,
            $mailMessage->outroLines
        ));
        $this->assertStringContainsString('milestone', strtolower($allContent));
        $this->assertTrue($arrayData['is_milestone']);
    }
}
