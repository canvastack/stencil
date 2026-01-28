<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Domain\Order\Enums\OrderStatus;
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
                    $q->where('order_number', 'like', "%{$search}%")
                      ->orWhereHas('customer', function ($customerQuery) use ($search) {
                          $customerQuery->where('name', 'like', "%{$search}%")
                                        ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }
            
            // Date range filtering
            if ($request->has('date_from') && !empty($request->get('date_from'))) {
                $query->whereDate('created_at', '>=', $request->get('date_from'));
            }
            
            if ($request->has('date_to') && !empty($request->get('date_to'))) {
                $query->whereDate('created_at', '<=', $request->get('date_to'));
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

    public function show(Request $request, Order $order): JsonResponse
    {
        try {
            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
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
            
            // Resolve customer ID (accept both integer ID and UUID)
            if (isset($payload['customer_id'])) {
                $customerId = $payload['customer_id'];
                $isUuid = is_string($customerId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customerId);
                
                $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::where('tenant_id', $tenant->id)
                    ->where($isUuid ? 'uuid' : 'id', $customerId)
                    ->firstOrFail();
                $payload['customer_id'] = $customer->id;
            }
            
            // Set tenant ID
            $payload['tenant_id'] = $tenant->id;
            
            // Generate order number if not provided
            if (!isset($payload['order_number'])) {
                $payload['order_number'] = 'ORD-' . date('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(3)));
            }
            
            // Set default status if not provided
            if (!isset($payload['status'])) {
                $payload['status'] = 'new';
            }
            
            // Set default currency
            if (!isset($payload['currency'])) {
                $payload['currency'] = 'IDR';
            }
            
            // Create order using Eloquent (simplified approach)
            $order = Order::create($payload);
            $order->load(['customer', 'vendor', 'tenant']);
            
            return (new OrderResource($order))->response()->setStatusCode(201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Customer tidak ditemukan',
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Failed to create order', [
                'tenant_id' => $tenant->id ?? 'unknown',
                'payload' => $payload ?? [],
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Gagal membuat pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        try {
            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
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

    public function destroy(Request $request, Order $order): JsonResponse
    {
        try {
            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
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

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        try {
            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
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

    public function process(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        return $this->updateStatus($request, $order);
    }

    public function approve(Request $request, Order $order): JsonResponse
    {
        try {
            $this->ensureOrderBelongsToTenant($request, $order);
            
            if ($order->status !== OrderStatus::DRAFT->value) {
                return response()->json([
                    'message' => 'Hanya pesanan dengan status Draft yang dapat disetujui',
                    'current_status' => $order->status,
                ], 422);
            }
            
            $newStatus = OrderStatus::PENDING;
            
            $this->stateMachine->transitionTo($order, $newStatus, [
                'approved_by' => auth()->id(),
                'approved_at' => now()->toIso8601String(),
            ]);
            
            $order->load(['customer', 'vendor']);
            
            return response()->json([
                'message' => 'Pesanan berhasil disetujui',
                'data' => new OrderResource($order),
            ], 200);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to approve order', [
                'order_id' => $order->id,
                'order_uuid' => $order->uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Gagal menyetujui pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function ship(Request $request, Order $order): JsonResponse
    {
        try {
            $request->validate([
                'tracking_number' => 'required|string|max:255',
            ]);

            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
            // Simplified approach: update directly
            $order->update([
                'status' => 'shipping',
                'tracking_number' => $request->tracking_number,
                'shipping_carrier' => $request->get('shipping_carrier'),
                'shipped_at' => $request->get('shipped_date') ? now()->parse($request->get('shipped_date')) : now(),
            ]);
            
            $order->load(['customer', 'vendor', 'tenant']);
            
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

    public function complete(Request $request, Order $order): JsonResponse
    {
        try {
            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = CompleteOrderCommand::fromArray([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
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

    public function cancel(Request $request, Order $order): JsonResponse
    {
        try {
            $request->validate(['reason' => 'required|string|max:500']);
            
            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
            // Simplified approach: update directly
            $metadata = $order->metadata ?? [];
            $metadata['cancellation_reason'] = $request->reason;
            $metadata['cancelled_by'] = auth()->id();
            $metadata['cancelled_at'] = now()->toIso8601String();
            
            $order->update([
                'status' => 'cancelled',
                'metadata' => $metadata,
            ]);
            
            $order->load(['customer', 'vendor', 'tenant']);
            
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

    public function refund(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        return $this->updateStatus($request, $order);
    }

    // Phase 4C: New business workflow methods using CQRS Command Handlers
    public function assignVendor(Request $request, Order $order): JsonResponse
    {
        try {
            $request->validate([
                'vendor_id' => 'required|integer',
                'specialization_notes' => 'sometimes|string|max:1000',
            ]);

            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = AssignVendorCommand::fromArray([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
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

    public function negotiateVendor(Request $request, Order $order): JsonResponse
    {
        try {
            $request->validate([
                'vendor_id' => 'required|integer',
                'quoted_price' => 'required|numeric|min:0',
                'quoted_currency' => 'sometimes|string|max:3',
                'lead_time_days' => 'required|integer|min:1|max:365',
                'negotiation_notes' => 'sometimes|string|max:1000',
            ]);

            // Ensure order belongs to the current tenant
            $this->ensureOrderBelongsToTenant($request, $order);
            
            // Use CQRS Command Handler for hexagonal architecture
            $commandDto = NegotiateWithVendorCommand::fromArray([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
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
            
            // Simplified approach: direct Eloquent query
            $orders = Order::where('tenant_id', $tenant->id)
                ->where('status', $status)
                ->with(['customer', 'vendor', 'tenant'])
                ->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_order', 'desc'))
                ->get();

            return response()->json([
                'message' => 'Daftar pesanan berhasil diambil',
                'data' => OrderResource::collection($orders),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil pesanan berdasarkan status',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function byCustomer(Request $request, string $customer): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $customer);
            
            // Resolve customer (accept UUID or integer)
            $customerModel = \App\Infrastructure\Persistence\Eloquent\Models\Customer::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $customer)
                ->firstOrFail();
            
            // Get orders for this customer
            $orders = Order::where('tenant_id', $tenant->id)
                ->where('customer_id', $customerModel->id)
                ->with(['customer', 'vendor', 'tenant'])
                ->orderBy($request->get('sort_by', 'created_at'), $request->get('sort_order', 'desc'))
                ->get();

            return response()->json([
                'message' => 'Daftar pesanan customer berhasil diambil',
                'data' => OrderResource::collection($orders),
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pelanggan tidak ditemukan'], 404);
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

    public function availableTransitions(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $order = Order::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();
                
            $transitions = $this->stateMachine->getAvailableTransitions($order);
            
            return response()->json([
                'message' => 'Transisi status yang tersedia berhasil diambil',
                'data' => [
                    'currentStatus' => $order->status,
                    'availableTransitions' => $transitions,
                ]
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
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

    private function ensureOrderBelongsToTenant(Request $request, Order $order): void
    {
        $tenant = $this->resolveTenant($request);
        
        if ($order->tenant_id != $tenant->id) {
            abort(404, 'Pesanan tidak ditemukan');
        }
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
