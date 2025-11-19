<?php

namespace App\Domain\Product\Services;

use App\Infrastructure\Persistence\Eloquent\Models\InventoryAlert;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryAdjustment;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryCount;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryItem;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryItemLocation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryLocation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryMovement;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReconciliation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReservation;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    private const VARIANCE_EPSILON = 0.0001;

    public function createLocation(array $data, int $userId): InventoryLocation
    {
        return DB::transaction(function () use ($data, $userId) {
            $payload = $data;
            $payload['created_by'] = $userId;
            $payload['updated_by'] = $userId;
            if (!isset($payload['tenant_id']) && Auth::check()) {
                $payload['tenant_id'] = Auth::user()->tenant_id;
            }
            return InventoryLocation::create($payload);
        });
    }

    public function updateLocation(InventoryLocation $location, array $data, int $userId): InventoryLocation
    {
        return DB::transaction(function () use ($location, $data, $userId) {
            $payload = $data;
            $payload['updated_by'] = $userId;
            $location->update($payload);
            return $location->refresh();
        });
    }

    public function ensureInventoryItem(Product $product, int $userId): InventoryItem
    {
        $item = InventoryItem::withTrashed()->where('product_id', $product->id)->first();
        if ($item) {
            if ($item->trashed()) {
                $item->restore();
            }
            return $item;
        }
        return InventoryItem::create([
            'tenant_id' => $product->tenant_id,
            'product_id' => $product->id,
            'item_code' => $product->sku,
            'item_name' => $product->name,
            'description' => $product->description,
            'category' => $product->categories[0] ?? null,
            'item_type' => 'material',
            'unit_of_measure' => $product->price_unit ?? 'unit',
            'current_stock' => $product->stock_quantity,
            'available_stock' => $product->stock_quantity,
            'reserved_stock' => 0,
            'on_order_stock' => 0,
            'minimum_stock_level' => $product->low_stock_threshold ?? 0,
            'reorder_point' => $product->low_stock_threshold ?? 0,
            'reorder_quantity' => 0,
            'standard_cost' => $product->vendor_price ?? 0,
            'average_cost' => $product->vendor_price ?? 0,
            'valuation_method' => 'FIFO',
            'is_active' => true,
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }

    public function setLocationStock(Product $product, InventoryLocation $location, float $quantity, int $userId, string $reason = 'manual_update'): InventoryItemLocation
    {
        if ($quantity < 0) {
            throw new \InvalidArgumentException('Quantity must be zero or positive');
        }
        return DB::transaction(function () use ($product, $location, $quantity, $userId, $reason) {
            $item = $this->ensureInventoryItem($product, $userId);
            $record = InventoryItemLocation::withTrashed()
                ->where('inventory_item_id', $item->id)
                ->where('inventory_location_id', $location->id)
                ->first();
            $previousOnHand = 0;
            if ($record) {
                if ($record->trashed()) {
                    $record->restore();
                }
                $previousOnHand = (float) $record->stock_on_hand;
            } else {
                $record = new InventoryItemLocation([
                    'tenant_id' => $location->tenant_id,
                    'inventory_item_id' => $item->id,
                    'inventory_location_id' => $location->id,
                ]);
            }
            $record->stock_on_hand = $quantity;
            $record->stock_available = max($quantity - (float) $record->stock_reserved - (float) $record->stock_damaged, 0);
            $record->stock_in_transit = $record->stock_in_transit ?? 0;
            $record->last_reconciled_at = Carbon::now();
            $record->save();
            $difference = $quantity - $previousOnHand;
            if (abs($difference) > 0.0001) {
                $movementType = $difference > 0 ? 'adjustment_increase' : 'adjustment_decrease';
                $this->recordAdjustment($item, $location, $previousOnHand, $quantity, $difference, 'manual', $userId, $reason, null);
                $this->recordMovement($item, $location, $difference, $movementType, $userId, $reason, [
                    'previous' => $previousOnHand,
                    'current' => $quantity,
                ]);
            }
            $this->updateAggregates($item, $product, $userId);
            $this->evaluateAlerts($item, $location, $userId);
            return $record->refresh();
        });
    }

    public function adjustLocationStock(Product $product, InventoryLocation $location, float $difference, int $userId, string $reason = 'adjustment'): InventoryItemLocation
    {
        if ($difference === 0.0) {
            throw new \InvalidArgumentException('Difference must not be zero');
        }
        return DB::transaction(function () use ($product, $location, $difference, $userId, $reason) {
            $item = $this->ensureInventoryItem($product, $userId);
            $record = InventoryItemLocation::firstOrCreate([
                'inventory_item_id' => $item->id,
                'inventory_location_id' => $location->id,
            ], [
                'tenant_id' => $location->tenant_id,
                'stock_on_hand' => 0,
                'stock_reserved' => 0,
                'stock_available' => 0,
                'stock_damaged' => 0,
                'stock_in_transit' => 0,
            ]);
            $previousOnHand = (float) $record->stock_on_hand;
            $newQuantity = $previousOnHand + $difference;
            if ($newQuantity < 0) {
                throw new \DomainException('Resulting stock cannot be negative');
            }
            $record->stock_on_hand = $newQuantity;
            $record->stock_available = max($newQuantity - (float) $record->stock_reserved - (float) $record->stock_damaged, 0);
            $record->last_reconciled_at = Carbon::now();
            $record->save();
            $movementType = $difference > 0 ? 'adjustment_increase' : 'adjustment_decrease';
            $this->recordAdjustment($item, $location, $previousOnHand, $newQuantity, $difference, 'cycle_count', $userId, $reason, null);
            $this->recordMovement($item, $location, $difference, $movementType, $userId, $reason);
            $this->updateAggregates($item, $product, $userId);
            $this->evaluateAlerts($item, $location, $userId);
            return $record->refresh();
        });
    }

    public function transferStock(Product $product, InventoryLocation $from, InventoryLocation $to, float $quantity, int $userId, string $reason = 'transfer'): void
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero');
        }
        if ($from->id === $to->id) {
            throw new \InvalidArgumentException('Source and destination locations must differ');
        }
        DB::transaction(function () use ($product, $from, $to, $quantity, $userId, $reason) {
            $item = $this->ensureInventoryItem($product, $userId);
            $fromRecord = InventoryItemLocation::firstOrCreate([
                'inventory_item_id' => $item->id,
                'inventory_location_id' => $from->id,
            ], [
                'tenant_id' => $from->tenant_id,
                'stock_on_hand' => 0,
                'stock_reserved' => 0,
                'stock_available' => 0,
                'stock_damaged' => 0,
                'stock_in_transit' => 0,
            ]);
            if ((float) $fromRecord->stock_on_hand < $quantity) {
                throw new \DomainException('Insufficient stock at source location');
            }
            $toRecord = InventoryItemLocation::firstOrCreate([
                'inventory_item_id' => $item->id,
                'inventory_location_id' => $to->id,
            ], [
                'tenant_id' => $to->tenant_id,
                'stock_on_hand' => 0,
                'stock_reserved' => 0,
                'stock_available' => 0,
                'stock_damaged' => 0,
                'stock_in_transit' => 0,
            ]);
            $fromRecord->stock_on_hand = (float) $fromRecord->stock_on_hand - $quantity;
            $fromRecord->stock_available = max((float) $fromRecord->stock_on_hand - (float) $fromRecord->stock_reserved - (float) $fromRecord->stock_damaged, 0);
            $fromRecord->save();
            $toRecord->stock_on_hand = (float) $toRecord->stock_on_hand + $quantity;
            $toRecord->stock_available = max((float) $toRecord->stock_on_hand - (float) $toRecord->stock_reserved - (float) $toRecord->stock_damaged, 0);
            $toRecord->save();
            $movement = new InventoryMovement([
                'tenant_id' => $item->tenant_id,
                'inventory_item_id' => $item->id,
                'from_location_id' => $from->id,
                'to_location_id' => $to->id,
                'quantity' => $quantity,
                'movement_type' => 'transfer',
                'reason' => $reason,
                'metadata' => null,
                'performed_by' => $userId,
                'performed_at' => Carbon::now(),
            ]);
            $movement->save();
            $this->updateAggregates($item, $product, $userId);
            $this->evaluateAlerts($item, $from, $userId);
            $this->evaluateAlerts($item, $to, $userId);
        });
    }

    public function reserveStock(Product $product, float $quantity, ?InventoryLocation $location, string $referenceType, string $referenceId, int $userId, ?\DateTimeInterface $expiresAt = null): InventoryReservation
    {
        if ($quantity <= 0) {
            throw new \InvalidArgumentException('Quantity must be greater than zero');
        }
        return DB::transaction(function () use ($product, $quantity, $location, $referenceType, $referenceId, $userId, $expiresAt) {
            $item = $this->ensureInventoryItem($product, $userId);
            if ($location) {
                $record = InventoryItemLocation::firstOrCreate([
                    'inventory_item_id' => $item->id,
                    'inventory_location_id' => $location->id,
                ], [
                    'tenant_id' => $location->tenant_id,
                    'stock_on_hand' => 0,
                    'stock_reserved' => 0,
                    'stock_available' => 0,
                    'stock_damaged' => 0,
                    'stock_in_transit' => 0,
                ]);
                if ((float) $record->stock_available < $quantity) {
                    throw new \DomainException('Insufficient available stock at location');
                }
                $record->stock_reserved = (float) $record->stock_reserved + $quantity;
                $record->stock_available = max((float) $record->stock_on_hand - (float) $record->stock_reserved - (float) $record->stock_damaged, 0);
                $record->save();
            } else {
                if ((float) $item->available_stock < $quantity) {
                    throw new \DomainException('Insufficient available stock');
                }
            }
            $reservation = InventoryReservation::create([
                'tenant_id' => $item->tenant_id,
                'inventory_item_id' => $item->id,
                'inventory_location_id' => $location?->id,
                'quantity' => $quantity,
                'status' => 'active',
                'reserved_for_type' => $referenceType,
                'reserved_for_id' => $referenceId,
                'reserved_at' => Carbon::now(),
                'expires_at' => $expiresAt ? Carbon::instance($expiresAt) : null,
                'reserved_by' => $userId,
                'metadata' => null,
            ]);
            $item->reserved_stock = (float) $item->reserved_stock + $quantity;
            $item->available_stock = max((float) $item->current_stock - (float) $item->reserved_stock, 0);
            $item->updated_by = $userId;
            $item->save();
            $product->stock_quantity = (int) round($item->current_stock);
            $product->save();
            return $reservation;
        });
    }

    public function releaseReservation(InventoryReservation $reservation, int $userId, string $reason = 'release'): InventoryReservation
    {
        if ($reservation->status !== 'active') {
            throw new \DomainException('Reservation is not active');
        }
        return DB::transaction(function () use ($reservation, $userId, $reason) {
            $reservation->status = 'released';
            $reservation->released_at = Carbon::now();
            $reservation->released_by = $userId;
            $reservation->save();
            $item = $reservation->item()->lockForUpdate()->first();
            if ($reservation->inventory_location_id) {
                $locationRecord = InventoryItemLocation::where('inventory_item_id', $item->id)
                    ->where('inventory_location_id', $reservation->inventory_location_id)
                    ->first();
                if ($locationRecord) {
                    $locationRecord->stock_reserved = max((float) $locationRecord->stock_reserved - (float) $reservation->quantity, 0);
                    $locationRecord->stock_available = max((float) $locationRecord->stock_on_hand - (float) $locationRecord->stock_reserved - (float) $locationRecord->stock_damaged, 0);
                    $locationRecord->save();
                }
            }
            $item->reserved_stock = max((float) $item->reserved_stock - (float) $reservation->quantity, 0);
            $item->available_stock = max((float) $item->current_stock - (float) $item->reserved_stock, 0);
            $item->updated_by = $userId;
            $item->save();
            $product = $item->product;
            if ($product) {
                $product->stock_quantity = (int) round($item->current_stock);
                $product->save();
                $this->recordMovement($item, $reservation->inventory_location_id ? $reservation->location : null, 0, 'reservation_release', $userId, $reason, [
                    'reservation_uuid' => $reservation->uuid,
                ]);
            }
            $this->evaluateAlerts($item, $reservation->inventory_location_id ? $reservation->location : null, $userId);
            return $reservation->refresh();
        });
    }

    public function runBalancingForTenant(int $tenantId, int $userId, string $source = 'scheduled'): void
    {
        InventoryItem::where('tenant_id', $tenantId)
            ->orderBy('id')
            ->chunkById(50, function ($items) use ($userId, $source) {
                foreach ($items as $item) {
                    $this->runBalancingForItem($item, $userId, $source);
                }
            });
    }

    public function runBalancingForItem(InventoryItem $item, int $userId, string $source = 'manual'): void
    {
        $item->loadMissing('product');
        $product = $item->product;
        if (!$product) {
            return;
        }

        $previous = [
            'current_stock' => (float) $item->current_stock,
            'reserved_stock' => (float) $item->reserved_stock,
            'available_stock' => (float) $item->available_stock,
        ];

        $snapshot = $this->collectItemSnapshot($item);

        $this->handleReconciliation($item, $snapshot, $previous, $userId, $source);

        $this->updateAggregates($item, $product, $userId, $snapshot);

        $this->evaluateAlerts($item->refresh(), null, $userId);
    }

    public function scheduleCycleCount(InventoryLocation $location, int $userId, ?Carbon $scheduledFor = null): InventoryCount
    {
        return InventoryCount::create([
            'tenant_id' => $location->tenant_id,
            'inventory_location_id' => $location->id,
            'count_type' => 'cycle',
            'status' => 'scheduled',
            'scheduled_for' => $scheduledFor ?? Carbon::now()->addDay(),
            'total_items' => $location->itemLocations()->count(),
            'items_counted' => 0,
            'variance_quantity' => 0,
            'variance_value' => 0,
            'created_by' => $userId,
            'metadata' => null,
        ]);
    }

    private function updateAggregates(InventoryItem $item, Product $product, int $userId, ?array $snapshot = null): void
    {
        $snapshot ??= $this->collectItemSnapshot($item);

        $item->current_stock = $snapshot['on_hand'];
        $item->reserved_stock = $snapshot['reserved'];
        $item->available_stock = max($snapshot['available'], 0);
        $item->updated_by = $userId;
        $item->save();

        $product->stock_quantity = (int) round($snapshot['on_hand']);
        if ($product->low_stock_threshold === null || $product->low_stock_threshold === 0) {
            $product->low_stock_threshold = (int) round($item->minimum_stock_level);
        }
        $product->save();
    }

    private function evaluateAlerts(InventoryItem $item, ?InventoryLocation $location, int $userId): void
    {
        $lowStock = $item->current_stock <= $item->minimum_stock_level;
        $outOfStock = $item->current_stock <= 0;
        $criticalAlerts = InventoryAlert::where('inventory_item_id', $item->id)
            ->where('resolved', false)
            ->get();
        foreach ($criticalAlerts as $alert) {
            if ($alert->alert_type === 'low_stock' && !$lowStock) {
                $alert->resolved = true;
                $alert->resolved_at = Carbon::now();
                $alert->resolved_by = $userId;
                $alert->save();
            }
            if ($alert->alert_type === 'out_of_stock' && !$outOfStock) {
                $alert->resolved = true;
                $alert->resolved_at = Carbon::now();
                $alert->resolved_by = $userId;
                $alert->save();
            }
        }
        if ($lowStock) {
            $this->createAlertIfMissing($item, $location, 'low_stock', $item->current_stock <= 0 ? 'critical' : 'warning', $userId, [
                'current_stock' => $item->current_stock,
                'threshold' => $item->minimum_stock_level,
            ]);
        }
        if ($outOfStock) {
            $this->createAlertIfMissing($item, $location, 'out_of_stock', 'critical', $userId, [
                'current_stock' => 0,
            ]);
        }
    }

    private function createAlertIfMissing(InventoryItem $item, ?InventoryLocation $location, string $type, string $severity, int $userId, ?array $metadata = null): void
    {
        $existing = InventoryAlert::where('inventory_item_id', $item->id)
            ->where('inventory_location_id', $location?->id)
            ->where('alert_type', $type)
            ->where('resolved', false)
            ->first();
        if ($existing) {
            return;
        }
        InventoryAlert::create([
            'tenant_id' => $item->tenant_id,
            'inventory_item_id' => $item->id,
            'inventory_location_id' => $location?->id,
            'alert_type' => $type,
            'severity' => $severity,
            'message' => $this->buildAlertMessage($item, $type),
            'triggered_quantity' => $item->current_stock,
            'threshold_quantity' => $item->minimum_stock_level,
            'resolved' => false,
            'metadata' => $metadata,
        ]);
    }

    private function buildAlertMessage(InventoryItem $item, string $type): string
    {
        return match ($type) {
            'out_of_stock' => "Item {$item->item_code} is out of stock",
            'low_stock' => "Item {$item->item_code} reached low stock threshold",
            default => "Inventory alert for {$item->item_code}",
        };
    }

    private function handleReconciliation(InventoryItem $item, array $snapshot, array $previousState, int $userId, string $source): void
    {
        $now = Carbon::now();
        $variance = round($snapshot['on_hand'] - $previousState['current_stock'], 4);
        $reservedVariance = round($snapshot['reserved'] - $previousState['reserved_stock'], 4);
        $availableVariance = round($snapshot['available'] - $previousState['available_stock'], 4);

        $open = InventoryReconciliation::where('inventory_item_id', $item->id)
            ->whereNull('inventory_location_id')
            ->where('status', 'open')
            ->first();

        if ($this->isVarianceNegligible($variance, $reservedVariance, $availableVariance)) {
            if ($open) {
                $metadata = $open->metadata ?? [];
                $metadata['resolution'] = [
                    'type' => 'auto',
                    'resolved_at' => $now->toISOString(),
                ];
                $metadata['last_snapshot'] = $this->formatSnapshot($snapshot);
                $open->status = 'resolved';
                $open->resolved_by = $userId;
                $open->resolved_at = $now;
                $open->variance_quantity = 0;
                $open->variance_value = 0;
                $open->metadata = $metadata;
                $open->save();
            }
            return;
        }

        $metadata = [
            'previous' => $previousState,
            'snapshot' => $this->formatSnapshot($snapshot),
            'variance' => [
                'on_hand' => $variance,
                'reserved' => $reservedVariance,
                'available' => $availableVariance,
            ],
        ];

        if ($open) {
            $existingMetadata = $open->metadata ?? [];
            $open->counted_quantity = $snapshot['on_hand'];
            $open->variance_quantity = $variance;
            $open->variance_value = $variance * (float) $item->average_cost;
            $open->metadata = array_merge($existingMetadata, $metadata);
            $open->save();
            return;
        }

        InventoryReconciliation::create([
            'tenant_id' => $item->tenant_id,
            'inventory_item_id' => $item->id,
            'inventory_location_id' => null,
            'expected_quantity' => $previousState['current_stock'],
            'counted_quantity' => $snapshot['on_hand'],
            'variance_quantity' => $variance,
            'variance_value' => $variance * (float) $item->average_cost,
            'status' => 'open',
            'source' => $source,
            'initiated_by' => $userId,
            'initiated_at' => $now,
            'metadata' => $metadata,
        ]);
    }

    private function collectItemSnapshot(InventoryItem $item): array
    {
        $now = Carbon::now();
        $locationRecords = InventoryItemLocation::where('inventory_item_id', $item->id)->get();
        $onHand = 0.0;
        $locationReserved = 0.0;
        $damaged = 0.0;
        $inTransit = 0.0;
        $locationSnapshots = [];

        foreach ($locationRecords as $record) {
            $stockOnHand = (float) $record->stock_on_hand;
            $stockReserved = (float) $record->stock_reserved;
            $stockDamaged = (float) $record->stock_damaged;
            $stockInTransit = (float) $record->stock_in_transit;

            $onHand += $stockOnHand;
            $locationReserved += $stockReserved;
            $damaged += $stockDamaged;
            $inTransit += $stockInTransit;

            $calculatedAvailable = max($stockOnHand - $stockReserved - $stockDamaged, 0.0);
            if (abs($calculatedAvailable - (float) $record->stock_available) > self::VARIANCE_EPSILON) {
                $record->stock_available = $calculatedAvailable;
                $record->last_reconciled_at = $now;
                $record->save();
            }

            $locationSnapshots[] = [
                'location_id' => $record->inventory_location_id,
                'stock_on_hand' => $stockOnHand,
                'stock_reserved' => $stockReserved,
                'stock_available' => (float) $record->stock_available,
                'stock_damaged' => $stockDamaged,
                'stock_in_transit' => $stockInTransit,
            ];
        }

        $globalReserved = (float) InventoryReservation::where('inventory_item_id', $item->id)
            ->whereNull('inventory_location_id')
            ->where('status', 'active')
            ->sum('quantity');

        $totalReserved = $locationReserved + $globalReserved;
        $available = max($onHand - $totalReserved - $damaged, 0.0);

        return [
            'on_hand' => $onHand,
            'reserved' => $totalReserved,
            'location_reserved' => $locationReserved,
            'global_reserved' => $globalReserved,
            'damaged' => $damaged,
            'in_transit' => $inTransit,
            'available' => $available,
            'locations' => $locationSnapshots,
        ];
    }

    private function formatSnapshot(array $snapshot): array
    {
        return [
            'on_hand' => $snapshot['on_hand'],
            'reserved' => $snapshot['reserved'],
            'available' => $snapshot['available'],
            'damaged' => $snapshot['damaged'],
            'in_transit' => $snapshot['in_transit'],
            'location_reserved' => $snapshot['location_reserved'],
            'global_reserved' => $snapshot['global_reserved'],
            'locations' => $snapshot['locations'],
        ];
    }

    private function isVarianceNegligible(float ...$values): bool
    {
        foreach ($values as $value) {
            if (abs($value) > self::VARIANCE_EPSILON) {
                return false;
            }
        }

        return true;
    }

    private function recordAdjustment(InventoryItem $item, InventoryLocation $location, float $before, float $after, float $difference, string $type, int $userId, string $reason, ?array $metadata = null): void
    {
        InventoryAdjustment::create([
            'tenant_id' => $item->tenant_id,
            'inventory_item_id' => $item->id,
            'inventory_location_id' => $location->id,
            'adjustment_type' => $type,
            'quantity_before' => $before,
            'quantity_after' => $after,
            'difference' => $difference,
            'reason' => $reason,
            'status' => 'approved',
            'created_by' => $userId,
            'approved_by' => $userId,
            'approved_at' => Carbon::now(),
            'metadata' => $metadata,
        ]);
    }

    private function recordMovement(InventoryItem $item, ?InventoryLocation $location, float $quantity, string $type, int $userId, string $reason, ?array $metadata = null): void
    {
        InventoryMovement::create([
            'tenant_id' => $item->tenant_id,
            'inventory_item_id' => $item->id,
            'from_location_id' => $quantity < 0 && $location ? $location->id : null,
            'to_location_id' => $quantity > 0 && $location ? $location->id : null,
            'quantity' => abs($quantity),
            'movement_type' => $type,
            'reason' => $reason,
            'metadata' => $metadata,
            'performed_by' => $userId,
            'performed_at' => Carbon::now(),
        ]);
    }
}
