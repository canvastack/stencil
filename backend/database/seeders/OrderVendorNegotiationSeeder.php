<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OrderVendorNegotiationSeeder extends Seeder
{
    /**
     * Seed order vendor negotiations (quotes) for vendor portal testing
     * 
     * This seeder creates realistic quote data for PT CEX tenant:
     * - Links to existing orders
     * - Links to test vendor (ID: 133)
     * - Various quote statuses for testing
     * - Realistic pricing and terms
     */
    public function run(): void
    {
        $this->command->info('🔄 Seeding Order Vendor Negotiations (Quotes)...');

        // Get vendor with ID 133
        $vendor = DB::table('vendors')->where('id', 133)->first();
        
        if (!$vendor) {
            $this->command->warn('Vendor with ID 133 not found. Skipping OrderVendorNegotiationSeeder.');
            return;
        }

        $vendorId = $vendor->id;
        $tenantId = $vendor->tenant_id; // Use vendor's tenant_id
        
        $this->command->info("Using Vendor ID: {$vendorId}, Tenant ID: {$tenantId}");
        
        // Get some orders from the same tenant
        $orders = DB::table('orders')
            ->where('tenant_id', $tenantId)
            ->where('status', '!=', 'cancelled')
            ->limit(15)
            ->get();

        if ($orders->isEmpty()) {
            $this->command->warn("No orders found for tenant {$tenantId}. Please run order seeders first.");
            return;
        }

        $this->command->info("Found {$orders->count()} orders for tenant {$tenantId}");

        $quoteStatuses = [
            'draft' => 2,
            'sent' => 3,
            'pending_response' => 4,
            'accepted' => 3,
            'rejected' => 2,
            'countered' => 1,
        ];

        $quoteIndex = 0;
        $totalQuotes = 0;

        foreach ($quoteStatuses as $status => $count) {
            for ($i = 0; $i < $count && $quoteIndex < $orders->count(); $i++, $quoteIndex++) {
                $order = $orders[$quoteIndex];
                
                // Generate realistic pricing
                $basePrice = rand(500000, 5000000); // 500k - 5M IDR
                $initialOffer = $basePrice;
                $latestOffer = $initialOffer;
                
                // For countered status, vendor offers lower price
                if ($status === 'countered') {
                    $latestOffer = (int)($initialOffer * 0.85); // 15% discount
                }

                // Calculate expiration date
                $createdAt = Carbon::now()->subDays(rand(1, 30));
                $expiresAt = null;
                $closedAt = null;
                $sentAt = null;
                $respondedAt = null;
                $responseType = null;
                $responseNotes = null;

                // Set timestamps based on status
                switch ($status) {
                    case 'draft':
                        $expiresAt = $createdAt->copy()->addDays(30);
                        break;
                    
                    case 'sent':
                    case 'pending_response':
                        $sentAt = $createdAt->copy()->addHours(2);
                        $expiresAt = $sentAt->copy()->addDays(7);
                        break;
                    
                    case 'accepted':
                        $sentAt = $createdAt->copy()->addHours(2);
                        $respondedAt = $sentAt->copy()->addDays(rand(1, 3));
                        $expiresAt = $sentAt->copy()->addDays(7);
                        $closedAt = $respondedAt;
                        $responseType = 'accept';
                        $responseNotes = 'Quote accepted. Estimated delivery: ' . rand(7, 21) . ' days';
                        break;
                    
                    case 'rejected':
                        $sentAt = $createdAt->copy()->addHours(2);
                        $respondedAt = $sentAt->copy()->addDays(rand(1, 3));
                        $expiresAt = $sentAt->copy()->addDays(7);
                        $closedAt = $respondedAt;
                        $responseType = 'reject';
                        $responseNotes = 'Cannot fulfill order due to capacity constraints';
                        break;
                    
                    case 'countered':
                        $sentAt = $createdAt->copy()->addHours(2);
                        $respondedAt = $sentAt->copy()->addDays(rand(1, 2));
                        $expiresAt = $sentAt->copy()->addDays(7);
                        $responseType = 'counter';
                        $responseNotes = 'Counter offer with 15% discount for bulk order';
                        break;
                }

                // Build quote details
                $quoteDetails = [
                    'product_specifications' => [
                        'material' => ['Stainless Steel', 'Brass', 'Aluminum'][rand(0, 2)],
                        'finish' => ['Polished', 'Matte', 'Brushed'][rand(0, 2)],
                        'dimensions' => rand(10, 30) . 'x' . rand(10, 30) . 'cm',
                    ],
                    'delivery_terms' => [
                        'estimated_days' => rand(7, 21),
                        'shipping_method' => ['Standard', 'Express', 'Same Day'][rand(0, 2)],
                    ],
                    'payment_terms' => [
                        'method' => ['Bank Transfer', 'Credit Card', 'Cash'][rand(0, 2)],
                        'terms' => '50% down payment, 50% on delivery',
                    ],
                ];

                // Add acceptance details for accepted quotes
                if ($status === 'accepted') {
                    $quoteDetails['estimated_delivery_days'] = rand(7, 21);
                    $quoteDetails['acceptance_notes'] = 'Order confirmed and scheduled for production';
                }

                // Add rejection details for rejected quotes
                if ($status === 'rejected') {
                    $quoteDetails['rejection_reason'] = 'Production capacity fully booked for next 2 months';
                }

                // Add counter offer details
                if ($status === 'countered') {
                    $quoteDetails['counter_offer_amount'] = $latestOffer;
                    $quoteDetails['counter_offer_notes'] = 'We can offer better pricing for orders above 100 units';
                }

                // Build history
                $history = [
                    [
                        'action' => 'quote_created',
                        'timestamp' => $createdAt->format('c'),
                        'user_id' => null,
                        'details' => 'Quote created by system',
                    ],
                ];

                if ($sentAt) {
                    $history[] = [
                        'action' => 'quote_sent',
                        'timestamp' => $sentAt->format('c'),
                        'user_id' => null,
                        'details' => 'Quote sent to vendor',
                    ];
                }

                if ($respondedAt) {
                    $history[] = [
                        'action' => 'vendor_response',
                        'timestamp' => $respondedAt->format('c'),
                        'user_id' => null,
                        'response_type' => $responseType,
                        'details' => $responseNotes,
                    ];
                }

                // Build status history
                $statusHistory = [
                    [
                        'from' => null,
                        'to' => 'draft',
                        'changed_by' => null,
                        'changed_at' => $createdAt->format('c'),
                        'reason' => 'Initial status',
                    ],
                ];

                if ($status !== 'draft') {
                    $statusHistory[] = [
                        'from' => 'draft',
                        'to' => $status === 'pending_response' ? 'sent' : $status,
                        'changed_by' => null,
                        'changed_at' => $sentAt ? $sentAt->format('c') : $createdAt->format('c'),
                        'reason' => 'Status updated',
                    ];
                }

                // Get product from order (if available)
                $productId = DB::table('products')
                    ->where('tenant_id', $tenantId)
                    ->inRandomOrder()
                    ->value('id');

                $quantity = rand(1, 10);
                
                $specifications = [
                    'material' => ['Stainless Steel', 'Brass', 'Aluminum'][rand(0, 2)],
                    'finish' => ['Polished', 'Matte', 'Brushed'][rand(0, 2)],
                    'dimensions' => rand(10, 30) . 'x' . rand(10, 30) . 'cm',
                    'engraving_text' => 'Custom text for ' . $order->order_number,
                ];

                $notes = 'Quote for order ' . $order->order_number . '. ' . 
                         'Delivery time: ' . rand(7, 21) . ' days. ' .
                         'Payment terms: 50% down payment, 50% on delivery.';

                // Insert quote
                DB::table('order_vendor_negotiations')->insert([
                    'uuid' => DB::raw('gen_random_uuid()'),
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'vendor_id' => $vendorId,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'specifications' => json_encode($specifications),
                    'notes' => $notes,
                    'status' => $status,
                    'initial_offer' => $initialOffer,
                    'latest_offer' => $latestOffer,
                    'currency' => 'IDR',
                    'quote_details' => json_encode($quoteDetails),
                    'history' => json_encode($history),
                    'status_history' => json_encode($statusHistory),
                    'round' => $status === 'countered' ? 2 : 1,
                    'sent_at' => $sentAt,
                    'responded_at' => $respondedAt,
                    'response_type' => $responseType,
                    'response_notes' => $responseNotes,
                    'expires_at' => $expiresAt,
                    'closed_at' => $closedAt,
                    'created_at' => $createdAt,
                    'updated_at' => $respondedAt ?? $sentAt ?? $createdAt,
                ]);

                $totalQuotes++;
            }
        }

        $this->command->info("✅ Created {$totalQuotes} vendor quotes for testing");
        $this->command->info('   - Vendor ID: ' . $vendorId . ' (Tenant: ' . $tenantId . ')');
        $this->command->info('   - Status distribution:');
        foreach ($quoteStatuses as $status => $count) {
            $this->command->info("     • {$status}: {$count} quotes");
        }
    }
}
