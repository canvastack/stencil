<?php

namespace Tests\Unit\Domain\Order\Notifications;

use App\Domain\Order\Notifications\QuoteAcceptedByVendorNotification;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteAcceptedByVendorNotificationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_generates_correct_mail_message()
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
            'initial_offer' => 15000000,
            'latest_offer' => 14500000,
            'status' => 'accepted',
        ]);
        $admin = User::factory()->create(['name' => 'Admin User']);
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        
        // Assert
        $this->assertEquals('Vendor Accepted Quote - QT-2026-001', $mailMessage->subject);
        $this->assertEquals('emails.admin.quote-accepted-by-vendor', $mailMessage->view);
        $this->assertArrayHasKey('admin', $mailMessage->viewData);
        $this->assertArrayHasKey('order', $mailMessage->viewData);
        $this->assertArrayHasKey('quote', $mailMessage->viewData);
        $this->assertArrayHasKey('vendorName', $mailMessage->viewData);
        $this->assertArrayHasKey('quoteNumber', $mailMessage->viewData);
        $this->assertArrayHasKey('orderNumber', $mailMessage->viewData);
        $this->assertArrayHasKey('agreedPrice', $mailMessage->viewData);
        $this->assertArrayHasKey('estimatedDeliveryDays', $mailMessage->viewData);
        $this->assertEquals('Test Vendor', $mailMessage->viewData['vendorName']);
        $this->assertEquals('QT-2026-001', $mailMessage->viewData['quoteNumber']);
        $this->assertEquals('ORD-2026-001', $mailMessage->viewData['orderNumber']);
        $this->assertEquals(14500000, $mailMessage->viewData['agreedPrice']);
        $this->assertEquals(18, $mailMessage->viewData['estimatedDeliveryDays']);
    }

    /** @test */
    public function it_generates_correct_database_notification()
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
        $admin = User::factory()->create();
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $databaseData = $notification->toDatabase($admin);
        
        // Assert
        $this->assertArrayHasKey('order_id', $databaseData);
        $this->assertArrayHasKey('order_number', $databaseData);
        $this->assertArrayHasKey('quote_id', $databaseData);
        $this->assertArrayHasKey('quote_number', $databaseData);
        $this->assertArrayHasKey('vendor_name', $databaseData);
        $this->assertArrayHasKey('agreed_price', $databaseData);
        $this->assertArrayHasKey('estimated_delivery_days', $databaseData);
        $this->assertArrayHasKey('message', $databaseData);
        $this->assertEquals($order->id, $databaseData['order_id']);
        $this->assertEquals('ORD-2026-001', $databaseData['order_number']);
        $this->assertEquals($quote->id, $databaseData['quote_id']);
        $this->assertEquals('QT-2026-001', $databaseData['quote_number']);
        $this->assertEquals('Test Vendor', $databaseData['vendor_name']);
        $this->assertEquals(14500000, $databaseData['agreed_price']);
        $this->assertEquals(18, $databaseData['estimated_delivery_days']);
        $this->assertStringContainsString('Test Vendor', $databaseData['message']);
        $this->assertStringContainsString('QT-2026-001', $databaseData['message']);
    }

    /** @test */
    public function it_generates_correct_database_message()
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
        ]);
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $databaseData = $notification->toDatabase(User::factory()->create());
        
        // Assert
        $this->assertStringContainsString('QT-2026-001', $databaseData['message']);
        $this->assertStringContainsString('Test Vendor', $databaseData['message']);
        $this->assertStringContainsString('ORD-2026-001', $databaseData['message']);
        $this->assertStringContainsString('18 days', $databaseData['message']);
    }

    /** @test */
    public function it_uses_initial_offer_when_latest_offer_is_null()
    {
        // Arrange
        $vendor = Vendor::factory()->create(['name' => 'Test Vendor']);
        $order = Order::factory()->create();
        $quote = OrderVendorNegotiation::factory()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'initial_offer' => 15000000,
            'latest_offer' => null,
        ]);
        $admin = User::factory()->create();
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        
        // Assert
        $this->assertEquals(15000000, $mailMessage->viewData['agreedPrice']);
    }

    /** @test */
    public function it_handles_missing_vendor_gracefully()
    {
        // Arrange
        $vendor = Vendor::factory()->create(); // Create a vendor but don't associate
        $order = Order::factory()->create();
        $quote = OrderVendorNegotiation::factory()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
        ]);
        
        // Manually set vendor to null to simulate missing vendor
        $quote->setRelation('vendor', null);
        
        $admin = User::factory()->create();
        
        // Act
        $notification = new QuoteAcceptedByVendorNotification($order, $quote, 18);
        $mailMessage = $notification->toMail($admin);
        
        // Assert
        $this->assertEquals('Vendor', $mailMessage->viewData['vendorName']);
    }

    /** @test */
    public function it_includes_correct_urls()
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
        
        // Assert
        $this->assertEquals('https://example.com/orders/123', $mailMessage->viewData['orderUrl']);
        $this->assertEquals('https://example.com/admin/quotes/' . $quote->uuid, $mailMessage->viewData['quoteUrl']);
    }
}
