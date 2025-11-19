<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Domain\Inventory\Jobs\InventoryReconciliationJob;
use App\Domain\Product\Services\InventoryService;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryItem;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryLocation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReconciliation;
use App\Infrastructure\Persistence\Eloquent\Models\InventoryReservation;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Presentation\Http\Requests\Inventory\AdjustInventoryLocationStockRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\ReleaseInventoryReservationRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\ReserveInventoryStockRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\RunInventoryReconciliationRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\SetInventoryLocationStockRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\StoreInventoryLocationRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\TransferInventoryStockRequest;
use App\Infrastructure\Presentation\Http\Requests\Inventory\UpdateInventoryLocationRequest;
use App\Infrastructure\Presentation\Http\Resources\Inventory\InventoryItemResource;
use App\Infrastructure\Presentation\Http\Resources\Inventory\InventoryLocationResource;
use App\Infrastructure\Presentation\Http\Resources\Inventory\InventoryReservationResource;
use App\Infrastructure\Presentation\Http\Resources\Inventory\InventoryReconciliationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $inventoryService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->get('per_page', 20);
        $query = InventoryItem::query()->with(['locations.location', 'alerts' => function ($builder) {
            $builder->where('resolved', false);
        }]);
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('item_name', 'ILIKE', "%{$search}%")
                    ->orWhere('item_code', 'ILIKE', "%{$search}%");
            });
        }
        if ($request->filled('category')) {
            $query->where('category', $request->get('category'));
        }
        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }
        $items = $query->paginate($perPage);
        return InventoryItemResource::collection($items)->response();
    }

    public function show(InventoryItem $item): JsonResponse
    {
        $item->load(['locations.location', 'alerts' => function ($builder) {
            $builder->orderBy('created_at', 'desc');
        }]);
        return (new InventoryItemResource($item))->response();
    }

    public function storeLocation(StoreInventoryLocationRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $data = $request->validated();
        if (!isset($data['tenant_id'])) {
            $data['tenant_id'] = Auth::user()->tenant_id;
        }
        $location = $this->inventoryService->createLocation($data, $userId);
        return (new InventoryLocationResource($location->fresh()))->response()->setStatusCode(201);
    }

    public function updateLocation(InventoryLocation $location, UpdateInventoryLocationRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $payload = $request->validated();
        $updated = $this->inventoryService->updateLocation($location, $payload, $userId);
        return (new InventoryLocationResource($updated))->response();
    }

    public function locations(Request $request): JsonResponse
    {
        $query = InventoryLocation::query();
        if ($request->boolean('active_only', false)) {
            $query->where('is_active', true);
        }
        if ($request->filled('type')) {
            $query->where('location_type', $request->get('type'));
        }
        $locations = $query->orderBy('location_name')->get();
        return InventoryLocationResource::collection($locations)->response();
    }

    public function setLocationStock(Product $product, InventoryLocation $location, SetInventoryLocationStockRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $data = $request->validated();
        $record = $this->inventoryService->setLocationStock($product, $location, (float) $data['quantity'], $userId, $data['reason'] ?? 'manual_update');
        $record->load('location');
        return (new InventoryItemResource($record->item->load(['locations.location', 'alerts'])))->response();
    }

    public function adjustLocationStock(Product $product, InventoryLocation $location, AdjustInventoryLocationStockRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $data = $request->validated();
        $record = $this->inventoryService->adjustLocationStock($product, $location, (float) $data['difference'], $userId, $data['reason'] ?? 'adjustment');
        $record->load('location');
        return (new InventoryItemResource($record->item->load(['locations.location', 'alerts'])))->response();
    }

    public function transferStock(Product $product, TransferInventoryStockRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $data = $request->validated();
        $from = InventoryLocation::findOrFail($data['from_location_id']);
        $to = InventoryLocation::findOrFail($data['to_location_id']);
        $this->inventoryService->transferStock($product, $from, $to, (float) $data['quantity'], $userId, $data['reason'] ?? 'transfer');
        $item = $this->inventoryService->ensureInventoryItem($product, $userId)->load(['locations.location', 'alerts']);
        return (new InventoryItemResource($item))->response();
    }

    public function reserveStock(Product $product, ReserveInventoryStockRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $data = $request->validated();
        $location = null;
        if (!empty($data['location_id'])) {
            $location = InventoryLocation::findOrFail($data['location_id']);
        }
        $reservation = $this->inventoryService->reserveStock(
            $product,
            (float) $data['quantity'],
            $location,
            $data['reference_type'],
            $data['reference_id'],
            $userId,
            isset($data['expires_at']) ? now()->parse($data['expires_at']) : null
        );
        $reservation->load('location');
        return (new InventoryReservationResource($reservation))->response()->setStatusCode(201);
    }

    public function releaseReservation(InventoryReservation $reservation, ReleaseInventoryReservationRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $data = $request->validated();
        $updated = $this->inventoryService->releaseReservation($reservation, $userId, $data['reason'] ?? 'release');
        return (new InventoryReservationResource($updated->load('location')))->response();
    }

    public function reservations(Request $request): JsonResponse
    {
        $query = InventoryReservation::with('location');
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('reference_type')) {
            $query->where('reserved_for_type', $request->get('reference_type'));
        }
        $reservations = $query->orderBy('reserved_at', 'desc')->paginate($request->get('per_page', 20));
        return InventoryReservationResource::collection($reservations)->response();
    }

    public function reconciliations(Request $request): JsonResponse
    {
        $query = InventoryReconciliation::query();
        if ($request->filled('status')) {
            $query->where('status', $request->get('status'));
        }
        if ($request->filled('inventory_item_id')) {
            $query->where('inventory_item_id', $request->get('inventory_item_id'));
        }
        $records = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 20));
        return InventoryReconciliationResource::collection($records)->response();
    }

    public function runReconciliation(RunInventoryReconciliationRequest $request): JsonResponse
    {
        $userId = Auth::id();
        if (!$userId) {
            abort(401);
        }
        $source = $request->validated()['source'] ?? 'manual';
        $async = $request->boolean('async', false);
        $tenantId = Auth::user()->tenant_id;
        if ($async) {
            InventoryReconciliationJob::dispatch($tenantId, $userId, $source);
            return response()->json(['status' => 'queued']);
        }
        $this->inventoryService->runBalancingForTenant($tenantId, $userId, $source);
        return response()->json(['status' => 'completed']);
    }
}
