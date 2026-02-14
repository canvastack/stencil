<?php

namespace Tests\Feature\VendorProduction;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\User;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Production Photo Management Tests
 * 
 * Tests photo upload, deletion, and management for production updates.
 */
class ProductionPhotoManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $vendor;
    private VendorPurchaseOrder $purchaseOrder;
    private VendorProductionUpdate $productionUpdate;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant first (let database auto-assign ID)
        $tenant = Tenant::factory()->create();

        // Create test vendor with account_type
        $this->vendor = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@test.com',
            'account_type' => 'vendor', // Required for vendor.auth middleware
        ]);

        // Create purchase order
        $this->purchaseOrder = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
        ]);

        // Create production update
        $this->productionUpdate = VendorProductionUpdate::factory()->create([
            'tenant_id' => $tenant->id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'in_progress',
            'progress_percentage' => 50,
            'photos' => [],
        ]);

        // Setup fake storage
        Storage::fake('local');
        
        // Bypass ALL middleware for testing
        $this->withoutMiddleware();
    }

    /** @test */
    public function vendor_can_add_photos_to_production_update()
    {
        $photo1 = UploadedFile::fake()->image('photo1.jpg', 800, 600);
        $photo2 = UploadedFile::fake()->image('photo2.jpg', 800, 600);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$photo1, $photo2],
                'photo_captions' => ['First photo', 'Second photo'],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Photos added successfully',
            ])
            ->assertJsonPath('data.photos_added', 2)
            ->assertJsonPath('data.total_photos', 2);

        // Verify photos stored in database
        $this->productionUpdate->refresh();
        $this->assertCount(2, $this->productionUpdate->photos);
        $this->assertEquals('First photo', $this->productionUpdate->photos[0]['caption']);
    }

    /** @test */
    public function vendor_can_delete_photo_from_production_update()
    {
        // Add photos first
        $photoId = 'test-photo-uuid';
        $this->productionUpdate->update([
            'photos' => [
                [
                    'id' => $photoId,
                    'url' => '/storage/production-updates/tenant-1/photo.jpg',
                    'thumbnail_url' => '/storage/production-updates/tenant-1/thumb-photo.jpg',
                    'caption' => 'Test photo',
                    'uploaded_at' => now()->toISOString(),
                ],
            ],
        ]);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->deleteJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos/{$photoId}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Photo deleted successfully',
            ])
            ->assertJsonPath('data.remaining_photos', 0);

        // Verify photo removed from database
        $this->productionUpdate->refresh();
        $this->assertCount(0, $this->productionUpdate->photos);
    }

    /** @test */
    public function cannot_add_more_than_10_photos()
    {
        // Add 9 photos first
        $existingPhotos = [];
        for ($i = 1; $i <= 9; $i++) {
            $existingPhotos[] = [
                'id' => "photo-{$i}",
                'url' => "/storage/photo{$i}.jpg",
                'thumbnail_url' => "/storage/thumb-photo{$i}.jpg",
                'caption' => "Photo {$i}",
                'uploaded_at' => now()->toISOString(),
            ];
        }
        $this->productionUpdate->update(['photos' => $existingPhotos]);

        // Try to add 2 more (would exceed limit)
        $photo1 = UploadedFile::fake()->image('photo10.jpg');
        $photo2 = UploadedFile::fake()->image('photo11.jpg');

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$photo1, $photo2],
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Maximum 10 photos allowed per update',
            ]);
    }

    /** @test */
    public function photo_upload_validates_file_type()
    {
        $invalidFile = UploadedFile::fake()->create('document.pdf', 1000);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$invalidFile],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photos.0']);
    }

    /** @test */
    public function photo_upload_validates_file_size()
    {
        // Create file larger than 5MB
        $largeFile = UploadedFile::fake()->image('large.jpg')->size(6000);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$largeFile],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['photos.0']);
    }

    /** @test */
    public function vendor_cannot_add_photos_to_other_vendors_update()
    {
        $otherVendor = User::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'email' => 'other-vendor@test.com',
        ]);

        $photo = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($otherVendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$photo],
            ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function vendor_cannot_delete_photos_from_other_vendors_update()
    {
        $otherVendor = User::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'email' => 'other-vendor@test.com',
        ]);

        $photoId = 'test-photo-uuid';
        $this->productionUpdate->update([
            'photos' => [
                [
                    'id' => $photoId,
                    'url' => '/storage/photo.jpg',
                    'thumbnail_url' => '/storage/thumb-photo.jpg',
                    'caption' => 'Test photo',
                    'uploaded_at' => now()->toISOString(),
                ],
            ],
        ]);

        $response = $this->actingAs($otherVendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->deleteJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos/{$photoId}");

        $response->assertStatus(404);
    }

    /** @test */
    public function deleting_non_existent_photo_returns_404()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->deleteJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos/non-existent-id");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Photo not found',
            ]);
    }

    /** @test */
    public function photos_are_tenant_isolated()
    {
        // Create tenant 2
        $tenant2 = Tenant::factory()->create();

        $tenant2Vendor = User::factory()->create([
            'tenant_id' => $tenant2->id,
            'email' => 'tenant2-vendor@test.com',
        ]);

        $photo = UploadedFile::fake()->image('photo.jpg');

        // Try to add photo with wrong tenant ID
        $response = $this->actingAs($tenant2Vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $tenant2->id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$photo],
            ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function photo_captions_are_optional()
    {
        $photo = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$photo],
                // No captions provided
            ]);

        $response->assertStatus(200);

        $this->productionUpdate->refresh();
        $this->assertNull($this->productionUpdate->photos[0]['caption']);
    }

    /** @test */
    public function can_add_photos_with_mixed_captions()
    {
        $photo1 = UploadedFile::fake()->image('photo1.jpg');
        $photo2 = UploadedFile::fake()->image('photo2.jpg');

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/production-updates/{$this->productionUpdate->uuid}/photos", [
                'photos' => [$photo1, $photo2],
                'photo_captions' => [
                    0 => 'First photo with caption',
                    // Second photo has no caption
                ],
            ]);

        $response->assertStatus(200);

        $this->productionUpdate->refresh();
        $this->assertEquals('First photo with caption', $this->productionUpdate->photos[0]['caption']);
        $this->assertNull($this->productionUpdate->photos[1]['caption']);
    }
}

