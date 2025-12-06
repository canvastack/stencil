<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Services\OrderStateMachine;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Presentation\Http\Requests\Order\StoreOrderRequest;
use App\Infrastructure\Presentation\Http\Requests\Order\UpdateOrderRequest;
use App\Infrastructure\Presentation\Http\Requests\Order\UpdateOrderStatusRequest;
use App\Infrastructure\Presentation\Http\Resources\Order\OrderResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Multitenancy\Models\Tenant as BaseTenant;

// Phase 4C: Hexagonal Architecture - CQRS Handlers
use App\Application\Order\Handlers\Commands\CreatePurchaseOrderHandler;
use App\Application\Order\Handlers\Commands\AssignVendorHandler;
use App\Application\Order\Handlers\Commands\NegotiateWithVendorHandler;
use App\Application\Order\Handlers\Commands\ShipOrderHandler;
use App\Application\Order\Handlers\Commands\CompleteOrderHandler;
use App\Application\Order\Handlers\Commands\CancelOrderHandler;
use App\Application\Order\Handlers\Queries\GetOrderQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrdersByStatusQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrdersByCustomerQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrderHistoryQueryHandler;

// Phase 4C: Command and Query DTOs
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Application\Order\Commands\ShipOrderCommand;
use App\Application\Order\Commands\CompleteOrderCommand;
use App\Application\Order\Commands\CancelOrderCommand;
use App\Application\Order\Queries\GetOrderQuery;
use App\Application\Order\Queries\GetOrdersByStatusQuery;
use App\Application\Order\Queries\GetOrdersByCustomerQuery;
use App\Application\Order\Queries\GetOrderHistoryQuery;

class OrderController extends Controller
{
    public function __construct(
        protected OrderStateMachine $stateMachine,
        protected CreatePurchaseOrderHandler $createOrderHandler,
        protected AssignVendorHandler $assignVendorHandler,
        protected NegotiateWithVendorHandler $negotiateHandler,
        protected ShipOrderHandler $shipOrderHandler,
        protected CompleteOrderHandler $completeOrderHandler,
        protected CancelOrderHandler $cancelOrderHandler,
        protected GetOrderQueryHandler $getOrderHandler,
        protected GetOrdersByStatusQueryHandler $getOrdersByStatusHandler,
        protected GetOrdersByCustomerQueryHandler $getOrdersByCustomerHandler,
        protected GetOrderHistoryQueryHandler $getOrderHistoryHandler,
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            // Simplified approach - direct Eloquent query for now
            $query = Order::where('tenant_id', $tenant->id);
            
            // Apply filters
            if ($request->has('status') && !empty($request->get('status'))) {
                $query->where('status', $request->get('status'));
            }
            
            if ($request->has('search') && !empty($request->get('search'))) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('customer_name', 'like', "%{$search}%")
                      ->orWhere('customer_email', 'like', "%{$search}%")
                      ->orWhere('id', 'like', "%{$search}%");
                });
            }
            
            // Sorting
            $sortBy = $request->get('sort', 'created_at');
            $sortOrder = $request->get('order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = min((int) $request->get('per_page', 15), 100);
            $orders = $query->paginate($perPage);

            return response()->json([
                'data' => OrderResource::collection($orders->items()),
                'meta' => [
                    'page' => $orders->currentPage(),
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                    'per_page' => $orders->perPage(),
                    'total' => $orders->total(),
                    'from' => $orders->firstItem(),
                    'to' => $orders->lastItem(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching orders: ' . $e->getMessage(), [
                'tenant' => $tenant->uuid ?? 'unknown',
                'request_params' => $request->all(),
                'stack_trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Gagal mengambil daftar pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Query Handler for hexagonal architecture
            $queryDto = GetOrderQuery::fromArray([
                'tenant_id' => $tenant->id,
                'order_id' => $id,
            ]);

            $order = $this->getOrderHandler->handle($queryDto);
            
            if (!$order) {
                return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
            }
            
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil detail pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $payload = $request->validated();
            $payload['tenant_id'] = $tenant->id;

            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = CreatePurchaseOrderCommand::fromArray($payload);
            $order = $this->createOrderHandler->handle($commandDto);
            
            return (new OrderResource($order))->response()->setStatusCode(201);
        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function update(UpdateOrderRequest $request, int $id): JsonResponse
    {
        try {
            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $order->update($request->validated());
            $order->load(['customer', 'vendor']);
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $order->delete();
            return response()->json(['message' => 'Pesanan berhasil dihapus'], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghapus pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function updateStatus(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $newStatus = OrderStatus::fromString($request->status);
            
            $validationErrors = $this->stateMachine->validateTransition($order, $newStatus, $request->metadata ?? []);
            if (!empty($validationErrors)) {
                return response()->json([
                    'message' => 'Validasi transisi status gagal',
                    'errors' => $validationErrors
                ], 422);
            }

            $this->stateMachine->transitionTo($order, $newStatus, $request->metadata ?? []);
            
            if ($request->filled('payment_status')) {
                $order->payment_status = $request->payment_status;
                $order->save();
            }

            $order->load(['customer', 'vendor']);
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal memperbarui status pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function process(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        return $this->updateStatus($request, $id);
    }

    public function ship(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'tracking_number' => 'required|string|max:255',
            ]);

            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = ShipOrderCommand::fromArray([
                'tenant_id' => $tenant->id,
                'order_id' => $id,
                'tracking_number' => $request->tracking_number,
                'shipping_carrier' => $request->get('shipping_carrier'),
                'shipped_date' => $request->get('shipped_date', now()->toDateString()),
            ]);

            $order = $this->shipOrderHandler->handle($commandDto);
            
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengirim pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = CompleteOrderCommand::fromArray([
                'tenant_id' => $tenant->id,
                'order_id' => $id,
                'delivered_at' => $request->get('delivered_at', now()->toIso8601String()),
                'completion_notes' => $request->get('completion_notes'),
            ]);

            $order = $this->completeOrderHandler->handle($commandDto);
            
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menyelesaikan pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate(['reason' => 'required|string|max:500']);
            
            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = CancelOrderCommand::fromArray([
                'tenant_id' => $tenant->id,
                'order_id' => $id,
                'cancellation_reason' => $request->reason,
                'cancelled_by' => auth()->id(),
            ]);

            $order = $this->cancelOrderHandler->handle($commandDto);
            
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membatalkan pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function refund(UpdateOrderStatusRequest $request, int $id): JsonResponse
    {
        return $this->updateStatus($request, $id);
    }

    // Phase 4C: New business workflow methods using CQRS Command Handlers
    public function assignVendor(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'vendor_id' => 'required|integer',
                'specialization_notes' => 'sometimes|string|max:1000',
            ]);

            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = AssignVendorCommand::fromArray([
                'tenant_id' => $tenant->id,
                'order_id' => $id,
                'vendor_id' => $request->vendor_id,
                'specialization_notes' => $request->get('specialization_notes'),
            ]);

            $order = $this->assignVendorHandler->handle($commandDto);
            
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menugaskan vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function negotiateVendor(Request $request, int $id): JsonResponse
    {
        try {
            $request->validate([
                'vendor_id' => 'required|integer',
                'quoted_price' => 'required|numeric|min:0',
                'quoted_currency' => 'sometimes|string|max:3',
                'lead_time_days' => 'required|integer|min:1|max:365',
                'negotiation_notes' => 'sometimes|string|max:1000',
            ]);

            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = NegotiateWithVendorCommand::fromArray([
                'tenant_id' => $tenant->id,
                'order_id' => $id,
                'vendor_id' => $request->vendor_id,
                'quoted_price' => $request->quoted_price,
                'quoted_currency' => $request->get('quoted_currency', 'IDR'),
                'lead_time_days' => $request->lead_time_days,
                'negotiation_notes' => $request->get('negotiation_notes'),
            ]);

            $order = $this->negotiateHandler->handle($commandDto);
            
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal melakukan negosiasi dengan vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function byStatus(Request $request, string $status): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Query Handler for hexagonal architecture
            $queryDto = GetOrdersByStatusQuery::fromArray([
                'tenant_id' => $tenant->id,
                'status' => $status,
                'per_page' => (int) $request->get('per_page', 20),
                'page' => (int) $request->get('page', 1),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
            ]);

            $orders = $this->getOrdersByStatusHandler->handle($queryDto);

            return OrderResource::collection($orders)
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil pesanan berdasarkan status',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function byCustomer(Request $request, int $customerId): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            
            // Use CQRS Query Handler for hexagonal architecture
            $queryDto = GetOrdersByCustomerQuery::fromArray([
                'tenant_id' => $tenant->id,
                'customer_id' => $customerId,
                'per_page' => (int) $request->get('per_page', 20),
                'page' => (int) $request->get('page', 1),
                'sort_by' => $request->get('sort_by', 'created_at'),
                'sort_order' => $request->get('sort_order', 'desc'),
            ]);

            $orders = $this->getOrdersByCustomerHandler->handle($queryDto);

            return OrderResource::collection($orders)
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil pesanan berdasarkan pelanggan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function recent(Request $request): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $limit = (int) $request->get('limit', 10);
            $limit = $limit > 0 ? min($limit, 100) : 10;

            // Use CQRS Query Handler for hexagonal architecture
            $queryDto = GetOrderHistoryQuery::fromArray([
                'tenant_id' => $tenant->id,
                'limit' => $limit,
            ]);

            $orders = $this->getOrderHistoryHandler->handle($queryDto);

            return OrderResource::collection($orders)
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil pesanan terbaru',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function export(Request $request): JsonResponse
    {
        try {
            $query = $this->tenantScopedOrders($request)->with(['customer', 'vendor']);

            $this->applyOrderFilters($request, $query);

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');

            $orders = $query->orderBy($sortBy, $sortOrder)->get();

            return OrderResource::collection($orders)
                ->additional([
                    'meta' => [
                        'total' => $orders->count(),
                    ],
                ])
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengekspor pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function quotations(Request $request, int $id): JsonResponse
    {
        try {
            $order = $this->tenantScopedOrders($request)
                ->with(['vendorNegotiations.vendor'])
                ->findOrFail($id);

            $quotations = $order->vendorNegotiations->map(function ($quotation) {
                return [
                    'id' => $quotation->id,
                    'uuid' => $quotation->uuid,
                    'tenantId' => $quotation->tenant_id,
                    'orderId' => $quotation->order_id,
                    'vendorId' => $quotation->vendor_id,
                    'status' => $quotation->status,
                    'initialOffer' => $quotation->initial_offer,
                    'latestOffer' => $quotation->latest_offer,
                    'currency' => $quotation->currency,
                    'terms' => $quotation->terms,
                    'history' => $quotation->history,
                    'round' => $quotation->round,
                    'expiresAt' => $quotation->expires_at?->toIso8601String(),
                    'closedAt' => $quotation->closed_at?->toIso8601String(),
                    'vendor' => $quotation->vendor ? [
                        'id' => $quotation->vendor->id,
                        'name' => $quotation->vendor->name,
                        'code' => $quotation->vendor->code,
                    ] : null,
                ];
            })->values();

            return response()->json([
                'message' => 'Daftar quotation berhasil diambil',
                'data' => $quotations,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data quotation',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function availableTransitions(Request $request, int $id): JsonResponse
    {
        try {
            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $transitions = $this->stateMachine->getAvailableTransitions($order);
            
            return response()->json([
                'message' => 'Transisi status yang tersedia berhasil diambil',
                'data' => [
                    'currentStatus' => $order->status,
                    'availableTransitions' => $transitions,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil transisi status',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    private function applyOrderFilters(Request $request, Builder $query): void
    {
        if ($request->filled('search')) {
            $query->where('order_number', 'ILIKE', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
    }

    private function tenantScopedOrders(Request $request): Builder
    {
        $tenant = $this->resolveTenant($request);

        return Order::forTenant($tenant);
    }

    private function resolveTenant(Request $request): BaseTenant
    {
        $candidate = $request->get('current_tenant')
            ?? $request->attributes->get('tenant')
            ?? (function_exists('tenant') ? tenant() : null);

        if (! $candidate && app()->bound('tenant.current')) {
            $candidate = app('tenant.current');
        }

        if (! $candidate && app()->bound('current_tenant')) {
            $candidate = app('current_tenant');
        }

        if (! $candidate) {
            $candidate = config('multitenancy.current_tenant');
        }

        if ($candidate instanceof BaseTenant) {
            return $candidate;
        }

        throw new \RuntimeException('Tenant context tidak ditemukan');
    }
}
