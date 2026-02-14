<?php

namespace Tests\Feature\Notifications;

use App\Domain\Order\Notifications\QuoteAcceptedByVendorNotification;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteAcceptedByVendorNotificationRenderingTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_renders_html_email_template_successfully()
    {
        // Arrange
        $vendor = Vendor::factory()->create(['name' => 'Test Vendor']);
        $order = Order::factory()->create([
            'order_number' => 'ORD-2026-001',
            'total_amount' => 15000000,
        ]);
        $quote = OrderVendorNegotiation::factory()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'quote_number' => 'QT-2026-001',
            'latest_offer' => 14500000,
            'status' => 'accepted',
        ]);
        $admin = User::factory()->create(['name' => 'Admin User']);
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        
        // Render the view
        $html = view($mailMessage->view, $mailMessage->viewData)->render();
        
        // Assert - Check key content is present
        $this->assertStringContainsString('Quote Accepted!', $html);
        $this->assertStringContainsString('Test Vendor', $html);
        $this->assertStringContainsString('QT-2026-001', $html);
        $this->assertStringContainsString('ORD-2026-001', $html);
        $this->assertStringContainsString('Admin User', $html);
        $this->assertStringContainsString('14.500.000', $html); // Formatted price
        $this->assertStringContainsString('18 days', $html);
        $this->assertStringContainsString('Order Status Updated', $html);
        $this->assertStringContainsString('Customer Quote', $html);
        $this->assertStringContainsString('Next Steps', $html);
        $this->assertStringContainsString('View Order Details', $html);
        $this->assertStringContainsString('View Quote Details', $html);
    }

    /** @test */
    public function it_renders_text_email_template_successfully()
    {
        // Arrange
        $vendor = Vendor::factory()->create(['name' => 'Test Vendor']);
        $order = Order::factory()->create([
            'order_number' => 'ORD-2026-001',
        ]);
        $quote = OrderVendorNegotiation::factory()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'quote_number' => 'QT-2026-001',
            'latest_offer' => 14500000,
        ]);
        $admin = User::factory()->create(['name' => 'Admin User']);
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        
        // Render the text view
        $text = view('emails.admin.quote-accepted-by-vendor-text', $mailMessage->viewData)->render();
        
        // Assert - Check key content is present
        $this->assertStringContainsString('QUOTE ACCEPTED BY VENDOR', $text);
        $this->assertStringContainsString('Test Vendor', $text);
        $this->assertStringContainsString('QT-2026-001', $text);
        $this->assertStringContainsString('ORD-2026-001', $text);
        $this->assertStringContainsString('Admin User', $text);
        $this->assertStringContainsString('14.500.000', $text);
        $this->assertStringContainsString('18 days', $text);
        $this->assertStringContainsString('NEXT STEPS', $text);
    }

    /** @test */
    public function it_includes_correct_urls_in_rendered_email()
    {
        // Arrange
        config(['app.frontend_url' => 'https://example.com']);
        $vendor = Vendor::factory()->create();
        $order = Order::factory()->create(['id' => 123]);
        $quote = OrderVendorNegotiation::factory()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
        ]);
        $admin = User::factory()->create();
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        $html = view($mailMessage->view, $mailMessage->viewData)->render();
        
        // Assert
        $this->assertStringContainsString('https://example.com/orders/123', $html);
        $this->assertStringContainsString('https://example.com/admin/quotes/' . $quote->uuid, $html);
    }

    /** @test */
    public function it_calculates_expected_delivery_date_correctly()
    {
        // Arrange
        $vendor = Vendor::factory()->create();
        $order = Order::factory()->create();
        $quote = OrderVendorNegotiation::factory()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
        ]);
        $admin = User::factory()->create();
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        $html = view($mailMessage->view, $mailMessage->viewData)->render();
        
        // Calculate expected date
        $expectedDate = \Carbon\Carbon::now()->addDays(18)->format('F j, Y');
        
        // Assert
        $this->assertStringContainsString($expectedDate, $html);
    }
}
