<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Mail\QcInspectionRejectedNotification;
use App\Models\OrderQcInspection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class QcInspectionController extends Controller
{
    /**
     * Get all QC inspections for an order
     */
    public function index(Request $request, string $orderUuid): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        
        $order = Order::where('uuid', $orderUuid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();
        
        $inspections = OrderQcInspection::where('order_id', $order->id)
            ->where('tenant_id', $tenantId)
            ->with(['inspector'])
            ->orderBy('inspection_date', 'desc')
            ->get();
        
        return response()->json([
            'data' => $inspections->map(fn($inspection) => $this->transformInspection($inspection)),
        ]);
    }

    /**
     * Get a specific QC inspection
     */
    public function show(Request $request, string $inspectionUuid): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        
        $inspection = OrderQcInspection::where('uuid', $inspectionUuid)
            ->where('tenant_id', $tenantId)
            ->with(['order', 'inspector', 'originalInspection'])
            ->firstOrFail();
        
        return response()->json([
            'data' => $this->transformInspection($inspection),
        ]);
    }

    /**
     * Create a new QC inspection
     */
    public function store(Request $request, string $orderUuid): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        
        $order = Order::where('uuid', $orderUuid)
            ->where('tenant_id', $tenantId)
            ->with('vendor')
            ->firstOrFail();
        
        $validator = Validator::make($request->all(), [
            'inspection_date' => 'required|date',
            'inspection_duration_minutes' => 'nullable|integer|min:1',
            'checklist_results' => 'present|array',
            'overall_rating' => ['nullable', Rule::in(['excellent', 'good', 'acceptable', 'poor'])],
            'total_score' => 'nullable|numeric|min:0|max:100',
            'critical_items_passed' => 'required|boolean',
            'decision' => ['required', Rule::in(['approved', 'approved_with_notes', 'rejected', 'needs_rework'])],
            'decision_notes' => 'nullable|string',
            'photos' => 'nullable|array',
            'rework_deadline' => 'nullable|date|after:now',
            'is_reinspection' => 'nullable|boolean',
            'original_inspection_uuid' => 'nullable|string|exists:order_qc_inspections,uuid',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }
        
        $data = $validator->validated();
        
        // Handle original inspection for re-inspections
        $originalInspectionId = null;
        if (!empty($data['original_inspection_uuid'])) {
            $originalInspection = OrderQcInspection::where('uuid', $data['original_inspection_uuid'])
                ->where('tenant_id', $tenantId)
                ->first();
            if ($originalInspection) {
                $originalInspectionId = $originalInspection->id;
            }
        }
        
        DB::beginTransaction();
        
        try {
            // Create inspection
            $inspection = OrderQcInspection::create([
                'tenant_id' => $tenantId,
                'order_id' => $order->id,
                'inspector_user_id' => $request->user()->id,
                'inspection_date' => $data['inspection_date'],
                'inspection_duration_minutes' => $data['inspection_duration_minutes'] ?? null,
                'checklist_results' => $data['checklist_results'],
                'overall_rating' => $data['overall_rating'] ?? null,
                'total_score' => $data['total_score'] ?? null,
                'critical_items_passed' => $data['critical_items_passed'],
                'decision' => $data['decision'],
                'decision_notes' => $data['decision_notes'] ?? null,
                'photos' => $data['photos'] ?? [],
                'photo_count' => count($data['photos'] ?? []),
                'rework_deadline' => $data['rework_deadline'] ?? null,
                'is_reinspection' => $data['is_reinspection'] ?? false,
                'original_inspection_id' => $originalInspectionId,
            ]);
            
            // Update reinspection count if this is a re-inspection
            if ($originalInspectionId) {
                $originalInspection = OrderQcInspection::find($originalInspectionId);
                $originalInspection->increment('reinspection_count');
            }
            
            // Update order status based on decision
            $this->updateOrderStatus($order, $inspection);
            
            // Send vendor notification if rejected
            if ($inspection->isRejected()) {
                $this->notifyVendor($inspection, $order);
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'QC inspection created successfully',
                'data' => $this->transformInspection($inspection->load(['inspector'])),
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to create QC inspection',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a QC inspection
     */
    public function update(Request $request, string $inspectionUuid): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        
        $inspection = OrderQcInspection::where('uuid', $inspectionUuid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();
        
        $validator = Validator::make($request->all(), [
            'inspection_duration_minutes' => 'nullable|integer|min:1',
            'checklist_results' => 'nullable|array',
            'overall_rating' => ['nullable', Rule::in(['excellent', 'good', 'acceptable', 'poor'])],
            'total_score' => 'nullable|numeric|min:0|max:100',
            'critical_items_passed' => 'nullable|boolean',
            'decision' => ['nullable', Rule::in(['approved', 'approved_with_notes', 'rejected', 'needs_rework'])],
            'decision_notes' => 'nullable|string',
            'photos' => 'nullable|array',
            'vendor_response' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }
        
        $data = $validator->validated();
        
        DB::beginTransaction();
        
        try {
            // Update inspection
            $inspection->update(array_filter($data, fn($value) => $value !== null));
            
            // Update photo count if photos were updated
            if (isset($data['photos'])) {
                $inspection->photo_count = count($data['photos']);
                $inspection->save();
            }
            
            // Update order status if decision changed
            if (isset($data['decision'])) {
                $this->updateOrderStatus($inspection->order, $inspection);
                
                // Send vendor notification if newly rejected
                if ($inspection->isRejected() && !$inspection->vendor_notified_at) {
                    $this->notifyVendor($inspection, $inspection->order);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'message' => 'QC inspection updated successfully',
                'data' => $this->transformInspection($inspection->load(['inspector'])),
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'message' => 'Failed to update QC inspection',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a QC inspection
     */
    public function destroy(Request $request, string $inspectionUuid): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        
        $inspection = OrderQcInspection::where('uuid', $inspectionUuid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();
        
        $inspection->delete();
        
        return response()->json([
            'message' => 'QC inspection deleted successfully',
        ]);
    }

    /**
     * Update order status based on inspection decision
     */
    private function updateOrderStatus(Order $order, OrderQcInspection $inspection): void
    {
        // Reload order to ensure we have the latest data
        $order->refresh();
        
        if ($inspection->isApproved()) {
            // Move to shipping if approved
            $order->update(['status' => 'shipping']);
            
            // TODO: Create order timeline event
            // TODO: Dispatch OrderStatusChanged event
            
        } elseif ($inspection->isRejected()) {
            // Move back to production if rejected
            $order->update(['status' => 'in_production']);
            
            // TODO: Create order timeline event
            // TODO: Dispatch OrderStatusChanged event
        }
    }

    /**
     * Send notification to vendor about rejection
     */
    private function notifyVendor(OrderQcInspection $inspection, Order $order): void
    {
        // Reload vendor relationship to ensure we have the latest data
        $order->load('vendor');
        
        if ($order->vendor && $order->vendor->email) {
            Mail::to($order->vendor->email)
                ->send(new QcInspectionRejectedNotification($inspection, $order));
            
            $inspection->vendor_notified_at = now();
            $inspection->save();
        }
    }

    /**
     * Transform inspection for API response
     */
    private function transformInspection(OrderQcInspection $inspection): array
    {
        return [
            'id' => $inspection->uuid,
            'order_id' => $inspection->order->uuid ?? null,
            'order_number' => $inspection->order->order_number ?? null,
            'inspector' => [
                'id' => $inspection->inspector->uuid ?? null,
                'name' => $inspection->inspector->name ?? null,
            ],
            'inspection_date' => $inspection->inspection_date->toISOString(),
            'inspection_duration_minutes' => $inspection->inspection_duration_minutes,
            'checklist_results' => $inspection->checklist_results,
            'overall_rating' => $inspection->overall_rating,
            'overall_rating_label' => $inspection->overall_rating_label,
            'total_score' => $inspection->total_score,
            'critical_items_passed' => $inspection->critical_items_passed,
            'decision' => $inspection->decision,
            'decision_label' => $inspection->decision_label,
            'decision_notes' => $inspection->decision_notes,
            'photos' => $inspection->photos,
            'photo_count' => $inspection->photo_count,
            'vendor_notified_at' => $inspection->vendor_notified_at?->toISOString(),
            'vendor_response' => $inspection->vendor_response,
            'rework_deadline' => $inspection->rework_deadline?->toISOString(),
            'is_reinspection' => $inspection->is_reinspection,
            'original_inspection_id' => $inspection->originalInspection->uuid ?? null,
            'reinspection_count' => $inspection->reinspection_count,
            'created_at' => $inspection->created_at->toISOString(),
            'updated_at' => $inspection->updated_at->toISOString(),
        ];
    }
}
