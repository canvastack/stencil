<?php

declare(strict_types=1);

namespace Tests\Feature\Quote;

use App\Application\Quote\Commands\SendQuoteToVendorCommand;
use App\Application\Quote\UseCases\SendQuoteToVendorUseCase;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Notification;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Property Test: Sending Quote Creates Notifications
 * 
 * **Property 16: Sending Quote Creates Notifications**
 * **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
 * 
 * For any quote sent to a vendor, an email notification should be sent to the vendor
 * with quote details and action link.
 * 
 * Note: Vendors are external entities without user accounts in the system.
 * Email notifications are sent to vendor email addresses.
 * In-app notifications are not created for vendors since they don't have system accounts.
 * 
 * This property test verifies that:
 * 1. Email notification is queued/sent to vendor
 * 2. Email contains quote details (quote_uuid, quote_number, etc.)
 * 3. Email contains action link for vendor
 * 4. Notification is tenant-scoped
 * 5. Email is sent to correct vendor email address
 */
class SendQuoteNotificationPropertyTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Property: Sending quote queues email notification to vendor
     * 
     * @test
     */
    public function property_sending_quote_queues_email_notification_to_vendor(): void
    {
        Mail::fake();
        
        // Run 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Create fresh tenant and related entities
            $tenant = Tenant::factory()->create();
            $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
            $order = Order::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id
            ]);
            
            // Create vendor (external entity, no user account)
            $vendorEmail = "vendor{$i}@external.com";
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'email' => $vendorEmail
            ]);
            
            // Create quote in draft status
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft'
            ]);
            
            // Execute use case to send quote
            $quoteRepository = app(QuoteRepositoryInterface::class);
            $notificationService = app(NotificationService::class);
            $useCase = new SendQuoteToVendorUseCase($quoteRepository, $notificationService);
            
            $command = new SendQuoteToVendorCommand(
                quoteUuid: $quote->uuid,
                tenantId: $tenant->id
            );
            
            $useCase->execute($command);
            
            // Verify email was queued/sent to vendor
            Mail::assertQueued(\App\Mail\VendorQuoteReceivedMail::class, function ($mail) use ($vendorEmail) {
                return $mail->hasTo($vendorEmail);
            });
            
            // Clean up for next iteration
            Mail::fake(); // Reset mail fake
            DB::table('order_vendor_negotiations')->where('id', $quote->id)->delete();
            DB::table('vendors')->where('id', $vendor->id)->delete();
            DB::table('orders')->where('id', $order->id)->delete();
            DB::table('customers')->where('id', $customer->id)->delete();
            DB::table('tenants')->where('id', $tenant->id)->delete();
        }
    }

    /**
     * Property: Email notification contains quote details and action link
     * 
     * @test
     */
    public function property_email_notification_contains_quote_details_and_action_link(): void
    {
        Mail::fake();
        
        // Run 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Create fresh tenant and related entities
            $tenant = Tenant::factory()->create();
            $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
            $order = Order::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id
            ]);
            
            // Create vendor
            $vendorEmail = "vendor{$i}@external.com";
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'email' => $vendorEmail
            ]);
            
            // Create quote in draft status
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft'
            ]);
            
            // Execute use case to send quote
            $quoteRepository = app(QuoteRepositoryInterface::class);
            $notificationService = app(NotificationService::class);
            $useCase = new SendQuoteToVendorUseCase($quoteRepository, $notificationService);
            
            $command = new SendQuoteToVendorCommand(
                quoteUuid: $quote->uuid,
                tenantId: $tenant->id
            );
            
            $useCase->execute($command);
            
            // Verify email was queued with correct data
            Mail::assertQueued(\App\Mail\VendorQuoteReceivedMail::class, function ($mail) use ($vendorEmail, $quote) {
                // Verify recipient
                if (!$mail->hasTo($vendorEmail)) {
                    return false;
                }
                
                // Verify mail contains quote data
                $this->assertNotNull($mail->quote, "Mail should contain quote object");
                $this->assertNotNull($mail->vendor, "Mail should contain vendor object");
                $this->assertNotNull($mail->viewUrl, "Mail should contain view URL");
                
                // Verify view URL contains quote UUID (for action link)
                $this->assertStringContainsString($quote->uuid, $mail->viewUrl, "View URL should contain quote UUID");
                
                return true;
            });
            
            // Clean up for next iteration
            Mail::fake();
            DB::table('order_vendor_negotiations')->where('id', $quote->id)->delete();
            DB::table('vendors')->where('id', $vendor->id)->delete();
            DB::table('orders')->where('id', $order->id)->delete();
            DB::table('customers')->where('id', $customer->id)->delete();
            DB::table('tenants')->where('id', $tenant->id)->delete();
        }
    }

    /**
     * Property: Email notifications are tenant-isolated
     * 
     * @test
     */
    public function property_email_notifications_are_tenant_isolated(): void
    {
        Mail::fake();
        
        // Run 50 iterations with multiple tenants
        for ($i = 0; $i < 50; $i++) {
            // Create two separate tenants
            $tenant1 = Tenant::factory()->create();
            $tenant2 = Tenant::factory()->create();
            
            // Create entities for tenant1
            $customer1 = Customer::factory()->create(['tenant_id' => $tenant1->id]);
            $order1 = Order::factory()->create([
                'tenant_id' => $tenant1->id,
                'customer_id' => $customer1->id
            ]);
            $vendor1Email = "vendor1_{$i}@external.com";
            $vendor1 = Vendor::factory()->create([
                'tenant_id' => $tenant1->id,
                'email' => $vendor1Email
            ]);
            $quote1 = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant1->id,
                'order_id' => $order1->id,
                'vendor_id' => $vendor1->id,
                'status' => 'draft'
            ]);
            
            // Create entities for tenant2
            $customer2 = Customer::factory()->create(['tenant_id' => $tenant2->id]);
            $order2 = Order::factory()->create([
                'tenant_id' => $tenant2->id,
                'customer_id' => $customer2->id
            ]);
            $vendor2Email = "vendor2_{$i}@external.com";
            $vendor2 = Vendor::factory()->create([
                'tenant_id' => $tenant2->id,
                'email' => $vendor2Email
            ]);
            
            // Send quote for tenant1 only
            $quoteRepository = app(QuoteRepositoryInterface::class);
            $notificationService = app(NotificationService::class);
            $useCase = new SendQuoteToVendorUseCase($quoteRepository, $notificationService);
            
            $command = new SendQuoteToVendorCommand(
                quoteUuid: $quote1->uuid,
                tenantId: $tenant1->id
            );
            
            $useCase->execute($command);
            
            // Verify email was sent to vendor1 only
            Mail::assertQueued(\App\Mail\VendorQuoteReceivedMail::class, function ($mail) use ($vendor1Email) {
                return $mail->hasTo($vendor1Email);
            });
            
            // Verify NO email was sent to vendor2
            Mail::assertNotQueued(\App\Mail\VendorQuoteReceivedMail::class, function ($mail) use ($vendor2Email) {
                return $mail->hasTo($vendor2Email);
            });
            
            // Verify quote status was updated for tenant1 quote
            $updatedQuote1 = OrderVendorNegotiation::find($quote1->id);
            $this->assertEquals('sent', $updatedQuote1->status, "Tenant1 quote should be marked as sent");
            
            // Clean up
            Mail::fake();
            DB::table('order_vendor_negotiations')->where('id', $quote1->id)->delete();
            DB::table('vendors')->whereIn('id', [$vendor1->id, $vendor2->id])->delete();
            DB::table('orders')->whereIn('id', [$order1->id, $order2->id])->delete();
            DB::table('customers')->whereIn('id', [$customer1->id, $customer2->id])->delete();
            DB::table('tenants')->whereIn('id', [$tenant1->id, $tenant2->id])->delete();
        }
    }

    /**
     * Property: Quote status is updated when email is sent
     * 
     * @test
     */
    public function property_quote_status_is_updated_when_email_is_sent(): void
    {
        Mail::fake();
        
        // Run 100 iterations
        for ($i = 0; $i < 100; $i++) {
            // Create fresh tenant and related entities
            $tenant = Tenant::factory()->create();
            $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
            $order = Order::factory()->create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id
            ]);
            
            // Create vendor
            $vendorEmail = "vendor{$i}@external.com";
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'email' => $vendorEmail
            ]);
            
            // Create quote in draft status
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft'
            ]);
            
            // Verify initial status
            $this->assertEquals('draft', $quote->status, "Quote should start in draft status");
            $this->assertNull($quote->sent_at, "Quote should not have sent_at timestamp initially");
            
            // Execute use case to send quote
            $quoteRepository = app(QuoteRepositoryInterface::class);
            $notificationService = app(NotificationService::class);
            $useCase = new SendQuoteToVendorUseCase($quoteRepository, $notificationService);
            
            $command = new SendQuoteToVendorCommand(
                quoteUuid: $quote->uuid,
                tenantId: $tenant->id
            );
            
            $useCase->execute($command);
            
            // Verify email was queued
            Mail::assertQueued(\App\Mail\VendorQuoteReceivedMail::class);
            
            // Verify quote status was updated
            $updatedQuote = OrderVendorNegotiation::find($quote->id);
            $this->assertEquals('sent', $updatedQuote->status, "Quote status should be updated to 'sent'");
            $this->assertNotNull($updatedQuote->sent_at, "Quote should have sent_at timestamp");
            
            // Verify status history was updated
            $this->assertIsArray($updatedQuote->status_history, "Status history should be array");
            $this->assertNotEmpty($updatedQuote->status_history, "Status history should not be empty");
            
            // Find the 'sent' status change in history
            $sentStatusChange = collect($updatedQuote->status_history)->firstWhere('to', 'sent');
            $this->assertNotNull($sentStatusChange, "Status history should contain 'sent' status change");
            $this->assertEquals('draft', $sentStatusChange['from'], "Status should transition from 'draft'");
            $this->assertEquals('sent', $sentStatusChange['to'], "Status should transition to 'sent'");
            
            // Clean up for next iteration
            Mail::fake();
            DB::table('order_vendor_negotiations')->where('id', $quote->id)->delete();
            DB::table('vendors')->where('id', $vendor->id)->delete();
            DB::table('orders')->where('id', $order->id)->delete();
            DB::table('customers')->where('id', $customer->id)->delete();
            DB::table('tenants')->where('id', $tenant->id)->delete();
        }
    }
}
