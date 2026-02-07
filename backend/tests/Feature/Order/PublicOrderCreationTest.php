<?php

namespace Tests\Feature\Order;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Mail;
use App\Infrastructure\Persistence\Eloquent\Models\{
    Product,
    Customer,
    Order,
    Tenant
};
use App\Models\ProductFormConfiguration;
use App\Domain\Order\Notifications\OrderCreatedNotification;

class PublicOrderCreationTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $product;
    protected $formConfiguration;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
        ]);

        // Create product
        $this->product = Product::factory()->create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'status' => 'published',
            'price' => 100000,
        ]);

        // Create form configuration
        $this->formConfiguration = ProductFormConfiguration::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->uuid,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'form_schema' => [
                'title' => 'Order Form',
                'fields' => [
                    [
                        'id' => 'field_1',
                        'name' => 'quantity',
                        'label' => 'Quantity',
                        'type' => 'number',
                        'required' => true,
                    ],
                ],
            ],
            'is_active' => true,
            'version' => 1,
        ]);
    }

    /** @test */
    public function it_creates_order_with_new_status_from_public_form()
    {
        $response = $this->postJson("/api/v1/public/products/{$this->product->uuid}/form-submission", [
            'quantity' => 10,
            'customer_name' => 'John Doe',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '081234567890',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'data' => [
                'order_uuid',
                'order_number',
                'submission_uuid',
                'customer_uuid',
                'submitted_at',
            ],
        ]);

        // Verify order was created with 'new' status
        $order = Order::where('uuid', $response->json('data.order_uuid'))->first();
        $this->assertNotNull($order);
        $this->assertEquals('new', $order->status);
        $this->assertNotEquals('draft', $order->status);
    }

    /** @test */
    public function it_sends_email_notification_to_customer()
    {
        Notification::fake();

        $response = $this->postJson("/api/v1/public/products/{$this->product->uuid}/form-submission", [
            'quantity' => 10,
            'customer_name' => 'John Doe',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '081234567890',
        ]);

        $response->assertStatus(201);

        // Get the created customer
        $customer = Customer::where('email', 'john@example.com')->first();
        $this->assertNotNull($customer);

        // Assert notification was sent
        Notification::assertSentTo(
            $customer,
            OrderCreatedNotification::class,
            function ($notification, $channels) use ($customer) {
                // Verify notification channels
                $this->assertContains('mail', $channels);
                $this->assertContains('database', $channels);
                
                return true;
            }
        );
    }

    /** @test */
    public function it_creates_customer_if_not_exists()
    {
        $response = $this->postJson("/api/v1/public/products/{$this->product->uuid}/form-submission", [
            'quantity' => 5,
            'customer_name' => 'Jane Smith',
            'name' => 'Jane Smith',
            'email' => 'jane@example.com',
            'phone' => '081234567891',
        ]);

        $response->assertStatus(201);

        // Verify customer was created
        $customer = Customer::where('email', 'jane@example.com')->first();
        $this->assertNotNull($customer);
        $this->assertEquals('Jane Smith', $customer->name);
        $this->assertEquals('+6281234567891', $customer->phone);
    }

    /** @test */
    public function it_stores_order_items_as_json()
    {
        $response = $this->postJson("/api/v1/public/products/{$this->product->uuid}/form-submission", [
            'quantity' => 10,
            'customer_name' => 'Test User',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '081234567890',
            'custom_field' => 'custom_value',
        ]);

        $response->assertStatus(201);

        $order = Order::where('uuid', $response->json('data.order_uuid'))->first();
        
        // Verify items is JSON array
        $this->assertIsArray($order->items);
        $this->assertCount(1, $order->items);
        
        // Verify item structure
        $item = $order->items[0];
        $this->assertEquals($this->product->id, $item['product_id']);
        $this->assertEquals($this->product->uuid, $item['product_uuid']);
        $this->assertEquals($this->product->name, $item['product_name']);
        $this->assertEquals(10, $item['quantity']);
        
        // Verify customization data
        $this->assertArrayHasKey('customization', $item);
        $this->assertEquals('custom_value', $item['customization']['custom_field']);
    }

    /** @test */
    public function it_handles_email_failure_gracefully()
    {
        // Force notification to fail
        Notification::fake();
        Notification::shouldReceive('send')->andThrow(new \Exception('Email service unavailable'));

        $response = $this->postJson("/api/v1/public/products/{$this->product->uuid}/form-submission", [
            'quantity' => 10,
            'customer_name' => 'Test User',
            'name' => 'Test User',
            'email' => 'test@example.com',
            'phone' => '081234567890',
        ]);

        // Order should still be created even if email fails
        $response->assertStatus(201);
        
        $order = Order::where('uuid', $response->json('data.order_uuid'))->first();
        $this->assertNotNull($order);
        $this->assertEquals('new', $order->status);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $response = $this->postJson("/api/v1/public/products/{$this->product->uuid}/form-submission", [
            // Missing required quantity field
            'customer_name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['quantity']);
    }

    /** @test */
    public function it_returns_404_for_unpublished_product()
    {
        $unpublishedProduct = Product::factory()->create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'status' => 'draft',
        ]);

        $response = $this->postJson("/api/v1/public/products/{$unpublishedProduct->uuid}/form-submission", [
            'quantity' => 10,
            'customer_name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(404);
    }
}
