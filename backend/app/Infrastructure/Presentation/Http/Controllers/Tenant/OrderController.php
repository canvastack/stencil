<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Services\OrderStateMachine;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
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

    public function payments(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $order = Order::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            // For now, return mock payment data structure that matches frontend expectations
            // In a real implementation, this would query a payments table
            $payments = [];
            
            // If order has payment information in metadata, extract it
            if ($order->metadata && isset($order->metadata['payments'])) {
                $payments = $order->metadata['payments'];
            } else {
                // Generate basic payment info based on order status
                if (in_array($order->status, ['paid', 'completed', 'shipped'])) {
                    $payments = [
                        [
                            'id' => 'payment-' . $order->id,
                            'order_id' => $order->uuid,
                            'amount' => $order->total_amount,
                            'currency' => $order->currency ?? 'IDR',
                            'status' => 'completed',
                            'payment_method' => 'bank_transfer',
                            'paid_at' => $order->updated_at->toIso8601String(),
                            'created_at' => $order->created_at->toIso8601String(),
                        ]
                    ];
                }
            }

            return response()->json($payments, 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data pembayaran',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function shipments(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $order = Order::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            // For now, return shipment data structure that matches frontend expectations
            $shipments = [];
            
            // If order has shipment information, extract it
            if ($order->metadata && isset($order->metadata['shipments'])) {
                $shipments = $order->metadata['shipments'];
            } else {
                // Generate basic shipment info based on order status and fields
                if (in_array($order->status, ['shipping', 'shipped', 'completed']) && $order->tracking_number) {
                    $shipments = [
                        [
                            'id' => 'shipment-' . $order->id,
                            'order_id' => $order->uuid,
                            'tracking_number' => $order->tracking_number,
                            'carrier' => $order->shipping_carrier ?? 'Unknown Carrier',
                            'status' => $order->status === 'completed' ? 'delivered' : 'in_transit',
                            'shipped_at' => $order->shipped_at?->toIso8601String() ?? $order->updated_at->toIso8601String(),
                            'estimated_delivery' => null,
                            'delivered_at' => $order->status === 'completed' ? $order->updated_at->toIso8601String() : null,
                            'created_at' => $order->created_at->toIso8601String(),
                        ]
                    ];
                }
            }

            return response()->json($shipments, 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil data pengiriman',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function history(Request $request, string $id): JsonResponse
    {
        try {
            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $order = Order::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            // For now, return history data structure that matches frontend expectations
            $history = [];
            
            // If order has history information in metadata, extract it
            if ($order->metadata && isset($order->metadata['history'])) {
                $history = $order->metadata['history'];
            } else {
                // Generate basic history based on order lifecycle
                $history = [
                    [
                        'id' => 'history-created-' . $order->id,
                        'order_id' => $order->uuid,
                        'action' => 'created',
                        'status' => 'new',
                        'description' => 'Pesanan dibuat',
                        'user_id' => null,
                        'user_name' => 'System',
                        'created_at' => $order->created_at->toIso8601String(),
                    ]
                ];

                // Add status change history if order has been updated
                if ($order->status !== 'new') {
                    $history[] = [
                        'id' => 'history-status-' . $order->id,
                        'order_id' => $order->uuid,
                        'action' => 'status_changed',
                        'status' => $order->status,
                        'description' => 'Status pesanan diubah ke ' . ucfirst($order->status),
                        'user_id' => null,
                        'user_name' => 'System',
                        'created_at' => $order->updated_at->toIso8601String(),
                    ];
                }

                // Add vendor assignment if exists
                if ($order->vendor_id) {
                    $history[] = [
                        'id' => 'history-vendor-' . $order->id,
                        'order_id' => $order->uuid,
                        'action' => 'vendor_assigned',
                        'status' => $order->status,
                        'description' => 'Vendor ditugaskan untuk pesanan ini',
                        'user_id' => null,
                        'user_name' => 'System',
                        'created_at' => $order->updated_at->toIso8601String(),
                    ];
                }
            }

            return response()->json($history, 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil riwayat pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Transition order state - handles state transitions with validation
     */
    public function transitionState(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'action' => 'required|string',
                'target_status' => 'sometimes|string',
                'notes' => 'sometimes|string|max:1000',
                'data' => 'sometimes|array',
            ]);

            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $order = Order::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            // Load tenant relationship before transition (needed for event dispatching)
            $order->load('tenant');

            $action = $request->input('action');
            $targetStatus = $request->input('target_status');
            $notes = $request->input('notes');
            $data = $request->input('data', []);

            // Handle different transition actions
            switch ($action) {
                case 'approve':
                    $targetStatus = 'pending';
                    break;
                case 'start_production':
                    $targetStatus = 'in_production';
                    break;
                case 'complete_production':
                    $targetStatus = 'ready_for_shipping';
                    break;
                case 'ship':
                    $targetStatus = 'shipping';
                    break;
                case 'complete':
                    $targetStatus = 'completed';
                    break;
                case 'cancel':
                    $targetStatus = 'cancelled';
                    break;
                default:
                    if (!$targetStatus) {
                        return response()->json([
                            'message' => 'Target status is required for unknown action'
                        ], 422);
                    }
            }

            // Validate transition using state machine
            if ($targetStatus) {
                $newStatus = OrderStatus::fromString($targetStatus);
                $validationErrors = $this->stateMachine->validateTransition($order, $newStatus, $data);
                
                if (!empty($validationErrors)) {
                    return response()->json([
                        'message' => 'Validasi transisi status gagal',
                        'errors' => $validationErrors
                    ], 422);
                }

                // Perform the transition
                $this->stateMachine->transitionTo($order, $newStatus, array_merge($data, [
                    'action' => $action,
                    'notes' => $notes,
                    'transitioned_by' => auth()->id(),
                    'transitioned_at' => now()->toIso8601String(),
                ]));
            }

            $order->load(['customer', 'vendor']);
            return (new OrderResource($order))->response()->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to transition order state', [
                'order_id' => $id,
                'action' => $request->input('action'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Gagal melakukan transisi status pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    /**
     * Advance order to specific business stage
     */
    public function advanceStage(Request $request, string $id): JsonResponse
    {
        try {
            $request->validate([
                'action' => 'required|string',
                'target_stage' => 'required|string',
                'notes' => 'sometimes|string|max:1000',
                'requirements' => 'sometimes|array',
                'metadata' => 'sometimes|array',
            ]);

            $tenant = $this->resolveTenant($request);
            $isUuid = preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id);
            
            $order = Order::where('tenant_id', $tenant->id)
                ->where($isUuid ? 'uuid' : 'id', $id)
                ->firstOrFail();

            $targetStage = $request->input('target_stage');
            $notes = $request->input('notes');
            $requirements = $request->input('requirements', []);
            $metadata = $request->input('metadata', []);

            // Map stage to status
            // Note: In most cases, stage name matches status name directly
            // This mapping handles special cases where frontend stage names differ from backend status
            $statusMapping = [
                'review_admin' => 'pending',
                'production' => 'in_production',
                'quality_check' => 'quality_control',
            ];

            // Use direct mapping if exists, otherwise use stage name as status
            $targetStatus = $statusMapping[$targetStage] ?? $targetStage;

            // Load tenant relationship before transition (needed for event dispatching)
            $order->load('tenant');
            
            // Validate vendor_negotiation → customer_quote transition
            if ($order->status === 'vendor_negotiation' && $targetStage === 'customer_quote') {
                $this->validateVendorNegotiationComplete($order);
            }
            
            // Validate transition
            $newStatus = OrderStatus::fromString($targetStatus);
            $validationErrors = $this->stateMachine->validateTransition($order, $newStatus, $requirements);
            
            if (!empty($validationErrors)) {
                return response()->json([
                    'message' => 'Validasi tahapan gagal',
                    'errors' => $validationErrors
                ], 422);
            }

            // Perform stage advancement
            $advancementData = array_merge($metadata, [
                'action' => 'advance_stage',
                'target_stage' => $targetStage,
                'notes' => $notes,
                'requirements' => $requirements,
                'advanced_by' => auth()->id(),
                'advanced_at' => now()->toIso8601String(),
                'previous_status' => $order->status,
            ]);

            $this->stateMachine->transitionTo($order, $newStatus, $advancementData);

            $order->load(['customer', 'vendor']);
            return (new OrderResource($order))->response()->setStatusCode(200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to advance order stage', [
                'order_id' => $id,
                'target_stage' => $request->input('target_stage'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Gagal memajukan tahapan pesanan',
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

    /**
     * Validate that vendor negotiation is complete before advancing to customer_quote stage
     * 
     * @param Order $order
     * @throws \Illuminate\Validation\ValidationException
     */
    private function validateVendorNegotiationComplete(Order $order): void
    {
        // Check for accepted quote
        $acceptedQuote = OrderVendorNegotiation::where('order_id', $order->id)
            ->where('status', 'accepted')
            ->latest()
            ->first();
        
        if (!$acceptedQuote) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'vendor_negotiation' => [
                    'No accepted vendor quote found. Please accept a quote before proceeding to customer quote stage.'
                ]
            ]);
        }
        
        // Verify order has required pricing data
        if (!$order->vendor_quoted_price) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'vendor_negotiation' => [
                    'Order is missing vendor quoted price. Please ensure quote data is properly synced.'
                ]
            ]);
        }
        
        if (!$order->quotation_amount) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'vendor_negotiation' => [
                    'Order is missing quotation amount. Please ensure quote data is properly synced.'
                ]
            ]);
        }
        
        // Verify vendor is assigned
        if (!$order->vendor_id) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'vendor_negotiation' => [
                    'Order is missing vendor assignment. Please ensure quote data is properly synced.'
                ]
            ]);
        }
    }
}
