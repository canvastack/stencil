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

class OrderController extends Controller
{
    protected OrderStateMachine $stateMachine;

    public function __construct(OrderStateMachine $stateMachine)
    {
        $this->stateMachine = $stateMachine;
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $query = $this->tenantScopedOrders($request)->with(['customer', 'vendor']);

            $this->applyOrderFilters($request, $query);

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            $orders = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            return OrderResource::collection($orders)
                ->response()
                ->setStatusCode(200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil daftar pesanan',
                'error' => config('app.debug') ? $e->getMessage() : 'Terjadi kesalahan tidak terduga'
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $order = $this->tenantScopedOrders($request)
                ->with(['customer', 'vendor'])
                ->findOrFail($id);
            return (new OrderResource($order))->response()->setStatusCode(200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pesanan tidak ditemukan'], 404);
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

            $order = Order::create($payload);
            $order->load(['customer', 'vendor']);
            
            event(new OrderCreated($order));
            
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

            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $metadata = ['tracking_number' => $request->tracking_number];
            
            $validationErrors = $this->stateMachine->validateTransition($order, OrderStatus::SHIPPED, $metadata);
            if (!empty($validationErrors)) {
                return response()->json([
                    'message' => 'Validasi pengiriman gagal',
                    'errors' => $validationErrors
                ], 422);
            }

            $this->stateMachine->transitionTo($order, OrderStatus::SHIPPED, $metadata);
            
            $order->load(['customer', 'vendor']);
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
            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $metadata = ['delivered_at' => now()->toIso8601String()];
            
            $this->stateMachine->transitionTo($order, OrderStatus::COMPLETED, $metadata);
            
            $order->load(['customer', 'vendor']);
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
            
            $order = $this->tenantScopedOrders($request)->findOrFail($id);
            $metadata = ['cancellation_reason' => $request->reason];
            
            $validationErrors = $this->stateMachine->validateTransition($order, OrderStatus::CANCELLED, $metadata);
            if (!empty($validationErrors)) {
                return response()->json([
                    'message' => 'Validasi pembatalan gagal',
                    'errors' => $validationErrors
                ], 422);
            }

            $this->stateMachine->transitionTo($order, OrderStatus::CANCELLED, $metadata);
            
            $order->load(['customer', 'vendor']);
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

    public function byStatus(Request $request, string $status): JsonResponse
    {
        try {
            $query = $this->tenantScopedOrders($request)
                ->with(['customer', 'vendor'])
                ->where('status', $status);

            $this->applyOrderFilters($request, $query);

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            $orders = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

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
            $query = $this->tenantScopedOrders($request)
                ->with(['customer', 'vendor'])
                ->where('customer_id', $customerId);

            $this->applyOrderFilters($request, $query);

            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $perPage = $request->get('per_page', 20);

            $orders = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

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
            $limit = (int) $request->get('limit', 10);
            $limit = $limit > 0 ? min($limit, 100) : 10;

            $query = $this->tenantScopedOrders($request)->with(['customer', 'vendor']);

            $this->applyOrderFilters($request, $query);

            $orders = $query->orderByDesc('created_at')->limit($limit)->get();

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
