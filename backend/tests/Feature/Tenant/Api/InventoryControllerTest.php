<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant\Api;

use App\Domain\Inventory\Jobs\InventoryReconciliationJob;
use App\Domain\Product\Services\InventoryService;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryItem;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryItemLocation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryLocation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReconciliation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReservation;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $user;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
        ]);

        $this->product = Product::factory()
            ->for($this->tenant, 'tenant')
            ->create([
                'stock_quantity' => 0,
                'vendor_price' => 25000,
                'low_stock_threshold' => 10,
            ]);

        Sanctum::actingAs($this->user);
    }

    public function test_can_create_location_and_set_stock(): void
    {
        $location = $this->createLocation('TEST-001', 'Main Test Warehouse');

        $stockResponse = $this->postJson("/api/v1/inventory/items/{$this->product->id}/locations/{$location->id}/stock", [
            'quantity' => 125,
            'reason' => 'initial_load',
        ]);

        $stockResponse->assertStatus(200);
        $stockResponse->assertJsonPath('data.currentStock', 125.0);

        $item = InventoryItem::where('product_id', $this->product->id)->firstOrFail();
        $this->assertEquals(125.0, (float) $item->current_stock);
        $this->assertEquals(125.0, (float) $item->available_stock);

        $itemLocation = InventoryItemLocation::where('inventory_location_id', $location->id)
            ->where('inventory_item_id', $item->id)
            ->firstOrFail();

        $this->assertEquals(125.0, (float) $itemLocation->stock_on_hand);
        $this->assertEquals(125.0, (float) $itemLocation->stock_available);
    }

    public function test_transfer_stock_between_locations_updates_balances(): void
    {
        $fromLocation = $this->createLocation('TEST-002', 'Source Warehouse');
        $toLocation = $this->createLocation('TEST-003', 'Destination Warehouse');

        $this->postJson("/api/v1/inventory/items/{$this->product->id}/locations/{$fromLocation->id}/stock", [
            'quantity' => 200,
            'reason' => 'seed',
        ])->assertStatus(200);

        $transferResponse = $this->postJson("/api/v1/inventory/items/{$this->product->id}/transfer", [
            'from_location_id' => $fromLocation->id,
            'to_location_id' => $toLocation->id,
            'quantity' => 75,
            'reason' => 'balancing_move',
        ]);

        $transferResponse->assertStatus(200);

        $item = InventoryItem::where('product_id', $this->product->id)->firstOrFail();
        $fromRecord = InventoryItemLocation::where('inventory_location_id', $fromLocation->id)
            ->where('inventory_item_id', $item->id)
            ->firstOrFail();
        $toRecord = InventoryItemLocation::where('inventory_location_id', $toLocation->id)
            ->where('inventory_item_id', $item->id)
            ->firstOrFail();

        $this->assertEquals(125.0, (float) $fromRecord->stock_on_hand);
        $this->assertEquals(125.0, (float) $fromRecord->stock_available);
        $this->assertEquals(75.0, (float) $toRecord->stock_on_hand);
        $this->assertEquals(75.0, (float) $toRecord->stock_available);
        $this->assertEquals(200.0, (float) $item->current_stock);
    }

    public function test_reserve_and_release_stock_updates_balances(): void
    {
        $location = $this->createLocation('TEST-004', 'Reservation Warehouse');

        $this->postJson("/api/v1/inventory/items/{$this->product->id}/locations/{$location->id}/stock", [
            'quantity' => 90,
            'reason' => 'reservation_seed',
        ])->assertStatus(200);

        $reserveResponse = $this->postJson("/api/v1/inventory/items/{$this->product->id}/reserve", [
            'quantity' => 40,
            'location_id' => $location->id,
            'reference_type' => 'order',
            'reference_id' => Str::uuid()->toString(),
        ]);

        $reserveResponse->assertStatus(201);

        $reservationId = $reserveResponse->json('data.id');
        $reservation = InventoryReservation::findOrFail($reservationId);

        $item = InventoryItem::where('product_id', $this->product->id)->firstOrFail();
        $itemLocation = InventoryItemLocation::where('inventory_location_id', $location->id)
            ->where('inventory_item_id', $item->id)
            ->firstOrFail();

        $this->assertEquals(40.0, (float) $item->reserved_stock);
        $this->assertEquals(50.0, (float) $item->available_stock);
        $this->assertEquals(40.0, (float) $itemLocation->stock_reserved);
        $this->assertEquals(50.0, (float) $itemLocation->stock_available);

        $releaseResponse = $this->postJson("/api/v1/inventory/reservations/{$reservation->id}/release", [
            'reason' => 'order_cancelled',
        ]);

        $releaseResponse->assertStatus(200);

        $reservation->refresh();
        $item->refresh();
        $itemLocation->refresh();

        $this->assertEquals('released', $reservation->status);
        $this->assertEquals(0.0, (float) $item->reserved_stock);
        $this->assertEquals(90.0, (float) $item->available_stock);
        $this->assertEquals(0.0, (float) $itemLocation->stock_reserved);
        $this->assertEquals(90.0, (float) $itemLocation->stock_available);
    }

    public function test_run_reconciliation_async_dispatches_job(): void
    {
        Queue::fake();

        $response = $this->postJson('/api/v1/inventory/reconciliations/run', [
            'source' => 'manual_check',
            'async' => true,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'queued']);

        Queue::assertPushed(InventoryReconciliationJob::class, function (InventoryReconciliationJob $job): bool {
            return $job->tenantId === $this->tenant->id && $job->userId === $this->user->id && $job->source === 'manual_check';
        });
    }

    public function test_reconciliation_job_balances_item_and_logs_variance(): void
    {
        $inventoryService = app(InventoryService::class);

        $location = $this->createLocation('TEST-005', 'Variance Warehouse');

        $this->postJson("/api/v1/inventory/items/{$this->product->id}/locations/{$location->id}/stock", [
            'quantity' => 180,
            'reason' => 'variance_seed',
        ])->assertStatus(200);

        $item = InventoryItem::where('product_id', $this->product->id)->firstOrFail();
        $item->current_stock = 150;
        $item->reserved_stock = 0;
        $item->available_stock = 150;
        $item->save();

        $inventoryService->runBalancingForTenant($this->tenant->id, $this->user->id, 'test');

        $item->refresh();
        $this->assertEquals(180.0, (float) $item->current_stock);

        $record = InventoryReconciliation::where('inventory_item_id', $item->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('open', $record->status);
        $this->assertEquals(30.0, (float) $record->variance_quantity);
        $this->assertEquals(30.0, (float) $record->metadata['variance']['on_hand']);

        $inventoryService->runBalancingForTenant($this->tenant->id, $this->user->id, 'test');

        $record->refresh();
        $this->assertSame('resolved', $record->status);
        $this->assertEquals('auto', $record->metadata['resolution']['type']);
    }

    public function test_reconciliation_job_accounts_for_global_reservations(): void
    {
        $inventoryService = app(InventoryService::class);

        $location = $this->createLocation('TEST-006', 'Reservation Sync Warehouse');

        $this->postJson("/api/v1/inventory/items/{$this->product->id}/locations/{$location->id}/stock", [
            'quantity' => 90,
            'reason' => 'reservation_seed',
        ])->assertStatus(200);

        $inventoryService->reserveStock(
            $this->product,
            30,
            null,
            'order',
            Str::uuid()->toString(),
            $this->user->id
        );

        $item = InventoryItem::where('product_id', $this->product->id)->firstOrFail();
        $item->reserved_stock = 0;
        $item->available_stock = $item->current_stock;
        $item->save();

        $inventoryService->runBalancingForItem($item, $this->user->id, 'test');

        $item->refresh();
        $this->assertEquals(30.0, (float) $item->reserved_stock);
        $this->assertEquals(60.0, (float) $item->available_stock);

        $record = InventoryReconciliation::where('inventory_item_id', $item->id)->first();
        $this->assertNotNull($record);
        $this->assertSame('open', $record->status);
        $this->assertEquals(0.0, (float) $record->variance_quantity);
        $this->assertEquals(30.0, (float) $record->metadata['variance']['reserved']);
        $this->assertEquals(-30.0, (float) $record->metadata['variance']['available']);

        $inventoryService->runBalancingForItem($item->fresh(), $this->user->id, 'test');

        $record->refresh();
        $this->assertSame('resolved', $record->status);
    }

    private function createLocation(string $code, string $name): InventoryLocation
    {
        $response = $this->postJson('/api/v1/inventory/locations', [
            'location_code' => $code,
            'location_name' => $name,
            'location_type' => 'warehouse',
        ]);

        $response->assertStatus(201);

        return InventoryLocation::findOrFail($response->json('data.id'));
    }
}
