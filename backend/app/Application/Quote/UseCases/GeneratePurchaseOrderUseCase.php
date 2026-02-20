<?php

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\GeneratePurchaseOrderCommand;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Models\VendorPurchaseOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Generate Purchase Order Use Case
 * 
 * Handles the business logic for generating purchase orders from accepted vendor quotes.
 * Creates a formal PO document with all necessary details for vendor production.
 */
class GeneratePurchaseOrderUseCase
{
    /**
     * Execute the use case
     * 
     * @param GeneratePurchaseOrderCommand $command
     * @return array PO data with UUID and number
     * @throws InvalidArgumentException
     */
    public function execute(GeneratePurchaseOrderCommand $command): array
    {
        // 1. Validate command
        $errors = $command->validate();
        if (!empty($errors)) {
            throw new InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        return DB::transaction(function () use ($command) {
            // 2. Find and validate quote
            $quote = OrderVendorNegotiation::where('uuid', $command->quoteUuid)
                ->where('tenant_id', (int) $command->tenantId)
                ->with(['order', 'vendor'])
                ->firstOrFail();

            // 3. Validate quote is accepted
            if ($quote->status !== 'accepted') {
                throw new InvalidArgumentException('Can only generate PO for accepted quotes');
            }

            // 4. Check if PO already exists
            $existingPo = VendorPurchaseOrder::where('quote_id', $quote->id)->first();
            if ($existingPo) {
                throw new InvalidArgumentException('Purchase order already exists for this quote');
            }

            // 5. Validate order exists
            if (!$quote->order) {
                throw new InvalidArgumentException('Order not found for quote');
            }

            // 6. Generate PO number
            $poNumber = $this->generatePoNumber((int) $command->tenantId);

            // 7. Calculate dates
            $issueDate = now();
            $validityDate = now()->addDays(30); // PO valid for 30 days
            $estimatedDays = $quote->quote_details['estimated_delivery_days'] ?? 18;
            $expectedDeliveryDate = $quote->responded_at->addDays($estimatedDays);

            // 8. Calculate pricing
            $subtotal = $quote->latest_offer;
            $discount = 0;
            $taxRate = config('purchase-order.tax_rate', 0.11); // 11% PPN
            $tax = (int) ($subtotal * $taxRate);
            $shipping = 0; // To be determined
            $grandTotal = $subtotal + $tax + $shipping;

            // 9. Prepare delivery address
            $deliveryAddress = $command->deliveryAddress ?? $this->getDefaultDeliveryAddress($quote->order);

            // 10. Get vendor user ID (vendor_purchase_orders.vendor_id references users table)
            // The quote->vendor_id references vendors table, so we need to get a user from that vendor
            $vendorUser = $quote->vendor->users()->first();
            if (!$vendorUser) {
                throw new InvalidArgumentException('No user account found for vendor');
            }

            // 11. Create purchase order record
            $po = VendorPurchaseOrder::create([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'tenant_id' => (int) $command->tenantId,
                'order_id' => $quote->order_id,
                'quote_id' => $quote->id,
                'vendor_id' => $vendorUser->id, // Use vendor user ID, not vendor ID
                'po_number' => $poNumber,
                'issue_date' => $issueDate,
                'validity_date' => $validityDate,
                'expected_delivery_date' => $expectedDeliveryDate,
                'delivery_address' => $deliveryAddress,
                'delivery_method' => 'courier', // Default
                'special_instructions' => $command->specialInstructions,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'shipping' => $shipping,
                'grand_total' => $grandTotal,
                'payment_method' => $command->paymentMethod,
                'payment_schedule' => $command->getPaymentSchedule(), // Laravel will auto-encode to JSON
                'status' => 'draft',
                'created_by' => (int) $command->userId,
            ]);

            // 12. Log PO generation
            Log::info('[PO Generation] Purchase order created', [
                'po_uuid' => $po->uuid,
                'po_number' => $po->po_number,
                'quote_uuid' => $quote->uuid,
                'order_uuid' => $quote->order->uuid,
                'vendor_id' => $quote->vendor_id,
                'vendor_user_id' => $vendorUser->id,
                'grand_total' => $grandTotal,
                'user_id' => $command->userId,
            ]);

            // 13. Return PO data
            return [
                'po_uuid' => $po->uuid,
                'po_number' => $po->po_number,
                'status' => $po->status,
                'issue_date' => $po->issue_date->toISOString(),
                'expected_delivery_date' => $po->expected_delivery_date->toISOString(),
                'grand_total' => $po->grand_total,
                'vendor_name' => $quote->vendor->name ?? 'Unknown',
                'order_number' => $quote->order->order_number,
            ];
        });
    }

    /**
     * Generate unique PO number
     * Format: PO-YYYYMM-XXXXX
     */
    private function generatePoNumber(int $tenantId): string
    {
        $prefix = 'PO';
        $yearMonth = date('Ym');
        
        // Get the last PO number for this month
        $lastPo = VendorPurchaseOrder::where('tenant_id', $tenantId)
            ->where('po_number', 'like', "{$prefix}-{$yearMonth}-%")
            ->orderBy('po_number', 'desc')
            ->first();

        if ($lastPo) {
            // Extract sequence number and increment
            $lastNumber = (int) substr($lastPo->po_number, -5);
            $sequence = $lastNumber + 1;
        } else {
            // Start from 1
            $sequence = 1;
        }

        // Format: PO-202602-00001
        $poNumber = sprintf('%s-%s-%05d', $prefix, $yearMonth, $sequence);

        // Double-check uniqueness
        $exists = VendorPurchaseOrder::where('tenant_id', $tenantId)
            ->where('po_number', $poNumber)
            ->exists();

        if ($exists) {
            // Fallback to UUID-based if collision occurs
            $uuidSuffix = strtoupper(substr(str_replace('-', '', \Illuminate\Support\Str::uuid()), -5));
            $poNumber = sprintf('%s-%s-%s', $prefix, $yearMonth, $uuidSuffix);
        }

        return $poNumber;
    }

    /**
     * Get default delivery address from order
     */
    private function getDefaultDeliveryAddress(Order $order): string
    {
        // Try to get delivery address from order
        if ($order->delivery_address) {
            return is_string($order->delivery_address) 
                ? $order->delivery_address 
                : json_encode($order->delivery_address);
        }

        // Fallback to PT CEX warehouse address
        return json_encode([
            'company' => 'PT Custom Etching Xenial',
            'street' => 'Jl. Industri No. 123',
            'city' => 'Jakarta',
            'state' => 'DKI Jakarta',
            'postal_code' => '12345',
            'country' => 'Indonesia',
        ]);
    }
}
