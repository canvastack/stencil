<?php

namespace Tests\Unit\VendorProduction;

use App\Application\VendorProduction\Commands\CreateProductionUpdateCommand;
use App\Application\VendorProduction\UseCases\CreateProductionUpdateUseCase;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\User;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * CreateProductionUpdateUseCase Unit Tests
 * 
 * Tests business logic for creating production updates.
 */
class CreateProductionUpdateUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private CreateProductionUpdateUseCase $useCase;
    private $tenant; // Remove type hint to avoid factory mismatch
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create tenant (let database auto-assign ID)
        $this->tenant = Tenant::factory()->create();
        
        // Create user for foreign keys
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'test@example.com',
        ]);
        
        $this->useCase = app(CreateProductionUpdateUseCase::class);
    }

    /** @test */
    public function it_creates_production_update_successfully()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'started',
            progressPercentage: 10,
            notes: 'Production has started',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: true,
            createdBy: $this->user->id
        );

        // Act
        $update = $this->useCase->execute($command);

        // Assert
        $this->assertInstanceOf(VendorProductionUpdate::class, $update);
        $this->assertEquals('started', $update->status);
        $this->assertEquals(10, $update->progress_percentage);
        $this->assertTrue($update->is_milestone);
        $this->assertDatabaseHas('vendor_production_updates', [
            'purchase_order_id' => $po->id,
            'status' => 'started',
            'progress_percentage' => 10,
        ]);
    }

    /** @test */
    public function it_updates_purchase_order_latest_status()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
            'latest_production_status' => null,
            'latest_progress_percentage' => 0,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'in_progress',
            progressPercentage: 50,
            notes: 'Halfway done',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act
        $this->useCase->execute($command);

        // Assert
        $po->refresh();
        $this->assertEquals('in_progress', $po->latest_production_status);
        $this->assertEquals(50, $po->latest_progress_percentage);
        $this->assertNotNull($po->latest_update_at);
    }

    /** @test */
    public function it_sets_production_started_at_for_first_update()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
            'production_started_at' => null,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'started',
            progressPercentage: 0,
            notes: 'Starting production',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: true,
            createdBy: $this->user->id
        );

        // Act
        $this->useCase->execute($command);

        // Assert
        $po->refresh();
        $this->assertNotNull($po->production_started_at);
    }

    /** @test */
    public function it_sets_production_completed_at_when_status_is_completed()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
            'production_completed_at' => null,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'completed',
            progressPercentage: 100,
            notes: 'Production completed',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: true,
            createdBy: $this->user->id
        );

        // Act
        $this->useCase->execute($command);

        // Assert
        $po->refresh();
        $this->assertNotNull($po->production_completed_at);
    }

    /** @test */
    public function it_throws_exception_when_purchase_order_not_found()
    {
        // Arrange
        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: '00000000-0000-0000-0000-000000000000', // Valid UUID format that doesn't exist
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'started',
            progressPercentage: 10,
            notes: 'Test',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Purchase order not found');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_vendor_does_not_own_purchase_order()
    {
        // Arrange
        $otherUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $otherUser->id, // Different vendor
            tenantId: $this->tenant->id,
            status: 'started',
            progressPercentage: 10,
            notes: 'Test',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $otherUser->id
        );

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Unauthorized: You do not own this purchase order');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_purchase_order_not_accepted()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'draft',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'started',
            progressPercentage: 10,
            notes: 'Test',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Purchase order must be accepted before creating production updates');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_completed_status_without_100_percent()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'completed',
            progressPercentage: 90, // Not 100%
            notes: 'Test',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Completed status requires 100% progress');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_delayed_status_without_estimated_date()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'delayed',
            progressPercentage: 50,
            notes: 'Delayed',
            estimatedCompletionDate: null, // Missing
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Delayed status requires estimated completion date');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_progress_percentage_range()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'in_progress',
            progressPercentage: 150, // Invalid
            notes: 'Test',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Progress percentage must be between 0 and 100');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_stores_photos_metadata()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $photos = [
            [
                'id' => 'photo-1',
                'url' => '/storage/photo1.jpg',
                'thumbnail_url' => '/storage/thumb-photo1.jpg',
                'caption' => 'Progress photo 1',
                'uploaded_at' => now()->toISOString(),
            ],
            [
                'id' => 'photo-2',
                'url' => '/storage/photo2.jpg',
                'thumbnail_url' => '/storage/thumb-photo2.jpg',
                'caption' => 'Progress photo 2',
                'uploaded_at' => now()->toISOString(),
            ],
        ];

        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'in_progress',
            progressPercentage: 50,
            notes: 'Progress with photos',
            estimatedCompletionDate: null,
            photos: $photos,
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act
        $update = $this->useCase->execute($command);

        // Assert
        $this->assertNotNull($update->photos);
        $this->assertCount(2, $update->photos);
        $this->assertEquals('Progress photo 1', $update->photos[0]['caption']);
    }

    /** @test */
    public function it_handles_transaction_rollback_on_error()
    {
        // Arrange
        $po = VendorPurchaseOrder::factory()->create([
            'status' => 'accepted',
            'vendor_id' => $this->user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        // Create command with invalid data that will fail
        $command = new CreateProductionUpdateCommand(
            purchaseOrderUuid: $po->uuid,
            vendorId: $this->user->id,
            tenantId: $this->tenant->id,
            status: 'completed',
            progressPercentage: 50, // Invalid for completed
            notes: 'Test',
            estimatedCompletionDate: null,
            photos: [],
            isMilestone: false,
            createdBy: $this->user->id
        );

        // Act & Assert
        try {
            $this->useCase->execute($command);
            $this->fail('Expected exception was not thrown');
        } catch (\Exception $e) {
            // Verify no update was created
            $this->assertEquals(0, VendorProductionUpdate::where('purchase_order_id', $po->id)->count());
            
            // Verify PO was not updated
            $po->refresh();
            $this->assertNull($po->latest_production_status);
        }
    }
}
