<?php

declare(strict_types=1);

namespace Tests\Feature\Quote;

use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Property Test: Quote Lists Include Status
 * 
 * **Property 9: Quote Lists Include Status**
 * **Validates: Requirements 3.6, 6.2, 8.2**
 * 
 * For any quote list response (admin or vendor), each quote should include 
 * the current status value, label, and color.
 * 
 * This property test verifies that:
 * 1. Quote transformation includes status information
 * 2. Status includes value, label, and color fields
 * 3. Status label is human-readable
 * 4. Status color follows semantic meaning
 * 5. Status history is included
 * 6. Status information is consistent
 */
class QuoteStatusInResponsesPropertyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Property: Quote transformation includes complete status information
     * 
     * @test
     */
    public function property_quote_transformation_includes_status_information(): void
    {
        $statuses = ['draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'];
        
        // Run 100 iterations with different statuses
        for ($i = 0; $i < 100; $i++) {
            $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
            $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
            $order = Order::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id
            ]);
            $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);
            
            $status = $statuses[array_rand($statuses)];
            
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => $status,
                'status_history' => [
                    [
                        'from' => null,
                        'to' => $status,
                        'changed_by' => 1,
                        'changed_at' => now()->toIso8601String(),
                        'reason' => 'Test status'
                    ]
                ]
            ]);
            
            // Load relationships
            $quote->load(['order.customer', 'vendor']);
            
            // Use the controller's transformation method via reflection
            $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
            $reflection = new \ReflectionClass($controller);
            $method = $reflection->getMethod('transformQuoteToFrontend');
            $method->setAccessible(true);
            
            $transformed = $method->invoke($controller, $quote);
            
            // Verify status information is present
            $this->assertArrayHasKey('status', $transformed);
            $this->assertArrayHasKey('status_label', $transformed);
            $this->assertArrayHasKey('status_color', $transformed);
            $this->assertArrayHasKey('status_history', $transformed);
            
            // Verify status value matches
            $this->assertEquals($status, $transformed['status']);
            
            // Verify status label is human-readable
            $this->assertIsString($transformed['status_label']);
            $this->assertNotEmpty($transformed['status_label']);
            $this->assertMatchesRegularExpression('/^[A-Z]/', $transformed['status_label']); // Starts with capital
            
            // Verify status color is valid
            $validColors = ['gray', 'blue', 'yellow', 'green', 'red', 'orange'];
            $this->assertContains($transformed['status_color'], $validColors);
            
            // Verify status history is array
            $this->assertIsArray($transformed['status_history']);
            $this->assertNotEmpty($transformed['status_history']);
        }
    }

    /**
     * Property: Status label matches status value semantically
     * 
     * @test
     */
    public function property_status_label_matches_status_value(): void
    {
        $expectedLabels = [
            'draft' => 'Draft',
            'sent' => 'Sent to Vendor',
            'pending_response' => 'Awaiting Response',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'countered' => 'Counter Offer',
            'expired' => 'Expired'
        ];
        
        for ($i = 0; $i < 100; $i++) {
            foreach ($expectedLabels as $status => $expectedLabel) {
                $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
                $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
                $order = Order::factory()->create([
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer->id
                ]);
                $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);
                
                $quote = OrderVendorNegotiation::factory()->create([
                    'tenant_id' => $tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'status' => $status
                ]);
                
                $quote->load(['order.customer', 'vendor']);
                
                $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
                $reflection = new \ReflectionClass($controller);
                $method = $reflection->getMethod('transformQuoteToFrontend');
                $method->setAccessible(true);
                
                $transformed = $method->invoke($controller, $quote);
                
                $this->assertEquals($expectedLabel, $transformed['status_label']);
            }
        }
    }

    /**
     * Property: Status color follows semantic meaning
     * 
     * @test
     */
    public function property_status_color_follows_semantic_meaning(): void
    {
        $expectedColors = [
            'draft' => 'gray',
            'sent' => 'blue',
            'pending_response' => 'yellow',
            'accepted' => 'green',
            'rejected' => 'red',
            'countered' => 'orange',
            'expired' => 'gray'
        ];
        
        for ($i = 0; $i < 100; $i++) {
            foreach ($expectedColors as $status => $expectedColor) {
                $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
                $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
                $order = Order::factory()->create([
                    'tenant_id' => $tenant->id,
                    'customer_id' => $customer->id
                ]);
                $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);
                
                $quote = OrderVendorNegotiation::factory()->create([
                    'tenant_id' => $tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'status' => $status
                ]);
                
                $quote->load(['order.customer', 'vendor']);
                
                $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
                $reflection = new \ReflectionClass($controller);
                $method = $reflection->getMethod('transformQuoteToFrontend');
                $method->setAccessible(true);
                
                $transformed = $method->invoke($controller, $quote);
                
                $this->assertEquals($expectedColor, $transformed['status_color']);
            }
        }
    }
}
