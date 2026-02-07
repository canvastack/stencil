<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Order\Enums\PaymentType;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

/**
 * Quote Workflow Test Data Seeder
 * 
 * Creates comprehensive test data for quote workflow fixes including:
 * - Quotes with various statuses (draft, sent, pending_response, accepted, rejected, countered, expired)
 * - Notifications for quote events
 * - Messages for quote communication
 * - Multi-tenant test data
 * 
 * Requirements: All (Task 15.1)
 */
class QuoteWorkflowTestDataSeeder extends Seeder
{
    private array $quoteStatuses = [
        'draft' => 15,
        'sent' => 20,
        'pending_response' => 18,
        'accepted' => 12,
        'rejected' => 10,
        'countered' => 15,
        'expired' => 10,
    ];

    public function run(): void
    {
        $this->command->info('🎯 Seeding Quote Workflow Test Data...');

        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();

        if (!$tenant) {
            $this->command->error('❌ PT Custom Etching Xenial tenant not found!');
            return;
        }

        $this->command->info("✅ Found tenant: {$tenant->name}");

        // Get or create test users
        $adminUser = $this->getOrCreateAdminUser($tenant->id);
        $vendorUser = $this->getOrCreateVendorUser($tenant->id);
        $customerUser = $this->getOrCreateCustomerUser($tenant->id);

        // Get existing data
        $customers = Customer::where('tenant_id', $tenant->id)->limit(10)->get();
        $vendors = Vendor::where('tenant_id', $tenant->id)->limit(5)->get();
        $products = Product::where('tenant_id', $tenant->id)->where('status', 'published')->limit(10)->get();

        if ($customers->isEmpty() || $vendors->isEmpty() || $products->isEmpty()) {
            $this->command->error('❌ Missing required data. Please run customer, vendor, and product seeders first.');
            return;
        }

        $this->command->info("✅ Found {$customers->count()} customers, {$vendors->count()} vendors, {$products->count()} products");

        $totalQuotes = array_sum($this->quoteStatuses);
        $this->command->info("Creating {$totalQuotes} quotes with various statuses...");

        $bar = $this->command->getOutput()->createProgressBar($totalQuotes);
        $bar->start();

        $createdQuotes = [];

        foreach ($this->quoteStatuses as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $customer = $customers->random();
                $vendor = $vendors->random();
                $product = $products->random();

                // Create order for this quote
                $order = $this->createOrder($tenant->id, $customer->id, $product);

                // Create quote with specific status
                $quote = $this->createQuote($tenant->id, $order->id, $vendor->id, $product, $status, $adminUser->id);

                // Create notifications for this quote
                $this->createNotifications($tenant->id, $quote, $adminUser->id, $vendorUser->id, $status);

                // Create messages for quotes that have been sent
                if (in_array($status, ['sent', 'pending_response', 'accepted', 'rejected', 'countered'])) {
                    $this->createMessages($tenant->id, $quote->id, $adminUser->id, $vendorUser->id, $status);
                }

                $createdQuotes[] = $quote;
                $bar->advance();
            }
        }

        $bar->finish();
        $this->command->newLine(2);

        $this->command->info("✅ Successfully created {$totalQuotes} quotes");
        $this->command->info("Status distribution:");
        foreach ($this->quoteStatuses as $status => $count) {
            $this->command->info("  - {$status}: {$count} quotes");
        }

        $notificationCount = DB::table('notifications')->where('tenant_id', $tenant->id)->count();
        $messageCount = DB::table('quote_messages')->where('tenant_id', $tenant->id)->count();

        $this->command->info("✅ Created {$notificationCount} notifications");
        $this->command->info("✅ Created {$messageCount} messages");
        $this->command->info('🎉 Done!');
    }

    private function getOrCreateAdminUser(int $tenantId): User
    {
        $user = User::where('tenant_id', $tenantId)
            ->where('email', 'admin@etchinx.test')
            ->first();

        if ($user) {
            return $user;
        }

        return User::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Admin User',
            'email' => 'admin@etchinx.test',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
    }

    private function getOrCreateVendorUser(int $tenantId): User
    {
        $user = User::where('tenant_id', $tenantId)
            ->where('email', 'vendor@etchinx.test')
            ->first();

        if ($user) {
            return $user;
        }

        return User::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Vendor User',
            'email' => 'vendor@etchinx.test',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
    }

    private function getOrCreateCustomerUser(int $tenantId): User
    {
        $user = User::where('tenant_id', $tenantId)
            ->where('email', 'customer@etchinx.test')
            ->first();

        if ($user) {
            return $user;
        }

        return User::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Customer User',
            'email' => 'customer@etchinx.test',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
    }

    private function createOrder(int $tenantId, int $customerId, Product $product): Order
    {
        $quantity = rand(1, 10);
        $unitPrice = $product->price ?? rand(100000, 1000000);
        $subtotal = $unitPrice * $quantity;

        $specifications = [
            'material' => ['Stainless Steel 304', 'Brass', 'Aluminum'][array_rand(['Stainless Steel 304', 'Brass', 'Aluminum'])],
            'dimensions' => rand(10, 50) . 'x' . rand(10, 50) . 'cm',
            'finish' => ['Polished', 'Brushed', 'Matte'][array_rand(['Polished', 'Brushed', 'Matte'])],
            'engraving_text' => 'Custom text ' . rand(1, 100),
        ];

        $items = [
            [
                'product_id' => $product->id,
                'product_uuid' => $product->uuid,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'subtotal' => $subtotal,
                'specifications' => $specifications,
            ],
        ];

        return Order::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'order_number' => 'ORD-QWF-' . time() . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'customer_id' => $customerId,
            'status' => OrderStatus::PENDING->value,
            'payment_status' => PaymentStatus::UNPAID->value,
            'payment_type' => PaymentType::FULL100->value,
            'subtotal' => $subtotal,
            'tax' => 0,
            'shipping_cost' => 0,
            'total_amount' => $subtotal,
            'items' => $items,
            'shipping_address' => ['name' => 'Test Address', 'address' => 'Jakarta'],
            'notes' => 'Test order for quote workflow',
            'created_at' => now()->subDays(rand(1, 60)),
            'updated_at' => now()->subDays(rand(0, 30)),
        ]);
    }

    private function createQuote(
        int $tenantId,
        int $orderId,
        int $vendorId,
        Product $product,
        string $status,
        int $userId
    ): OrderVendorNegotiation {
        $initialOffer = rand(100000, 5000000);
        $latestOffer = $initialOffer;

        // Adjust latest offer for countered quotes
        if ($status === 'countered') {
            $latestOffer = (int) ($initialOffer * (rand(85, 95) / 100));
        }

        // Build status history
        $statusHistory = [
            [
                'from' => null,
                'to' => 'draft',
                'changed_by' => $userId,
                'changed_at' => now()->subDays(rand(30, 60))->toIso8601String(),
                'reason' => 'Quote created',
            ],
        ];

        $sentAt = null;
        $respondedAt = null;
        $responseType = null;
        $responseNotes = null;
        $expiresAt = null;

        // Add status transitions based on current status
        if (in_array($status, ['sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'])) {
            $sentAt = now()->subDays(rand(15, 30));
            $statusHistory[] = [
                'from' => 'draft',
                'to' => 'sent',
                'changed_by' => $userId,
                'changed_at' => $sentAt->toIso8601String(),
                'reason' => 'Quote sent to vendor',
            ];
        }

        if (in_array($status, ['accepted', 'rejected', 'countered'])) {
            $respondedAt = now()->subDays(rand(1, 15));
            $responseType = match($status) {
                'accepted' => 'accept',
                'rejected' => 'reject',
                'countered' => 'counter',
                default => null,
            };
            $responseNotes = $this->getResponseNotes($status);

            $statusHistory[] = [
                'from' => 'sent',
                'to' => $status,
                'changed_by' => $userId,
                'changed_at' => $respondedAt->toIso8601String(),
                'reason' => $responseNotes,
            ];
        }

        if ($status === 'expired') {
            $expiresAt = now()->subDays(rand(1, 10));
            $statusHistory[] = [
                'from' => 'sent',
                'to' => 'expired',
                'changed_by' => null,
                'changed_at' => $expiresAt->toIso8601String(),
                'reason' => 'Quote expired automatically',
            ];
        } elseif (in_array($status, ['draft', 'sent', 'pending_response', 'countered'])) {
            $expiresAt = now()->addDays(rand(7, 30));
        }

        $quoteDetails = [
            'title' => 'Quote for ' . $product->name,
            'description' => 'Custom quote request',
            'terms_and_conditions' => 'Payment: 50% upfront, 50% on delivery',
            'notes' => 'Please provide best pricing',
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $product->uuid,
                    'description' => $product->name,
                    'quantity' => rand(1, 10),
                    'unit_price' => $initialOffer,
                    'total_price' => $initialOffer * rand(1, 10),
                ],
            ],
        ];

        return OrderVendorNegotiation::create([
            'tenant_id' => $tenantId,
            'uuid' => Uuid::uuid4()->toString(),
            'order_id' => $orderId,
            'vendor_id' => $vendorId,
            'product_id' => $product->id,
            'quantity' => rand(1, 10),
            'specifications' => [
                'material' => 'Stainless Steel',
                'finish' => 'Polished',
            ],
            'initial_offer' => $initialOffer,
            'latest_offer' => $latestOffer,
            'currency' => 'IDR',
            'quote_details' => $quoteDetails,
            'status' => $status,
            'status_history' => $statusHistory,
            'round' => $status === 'countered' ? rand(1, 3) : 1,
            'sent_at' => $sentAt,
            'responded_at' => $respondedAt,
            'response_type' => $responseType,
            'response_notes' => $responseNotes,
            'expires_at' => $expiresAt,
            'created_at' => now()->subDays(rand(30, 60)),
            'updated_at' => now()->subDays(rand(0, 15)),
        ]);
    }

    private function getResponseNotes(string $status): string
    {
        return match($status) {
            'accepted' => 'We can fulfill this order with the specified requirements.',
            'rejected' => 'Unfortunately, we cannot meet the delivery timeline for this order.',
            'countered' => 'We can offer a better price if the quantity is increased.',
            default => '',
        };
    }

    private function createNotifications(
        int $tenantId,
        OrderVendorNegotiation $quote,
        int $adminUserId,
        int $vendorUserId,
        string $status
    ): void {
        $notifications = [];

        // Notification when quote is sent to vendor
        if (in_array($status, ['sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'])) {
            $notifications[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'user_id' => $vendorUserId,
                'type' => 'quote_received',
                'title' => 'New Quote Request',
                'message' => "You have received a new quote request #{$quote->uuid}",
                'data' => json_encode([
                    'quote_uuid' => $quote->uuid,
                    'order_id' => $quote->order_id,
                    'action_url' => "/vendor/quotes/{$quote->uuid}",
                ]),
                'read_at' => rand(0, 1) ? now()->subDays(rand(1, 10)) : null,
                'created_at' => $quote->sent_at ?? now()->subDays(rand(15, 30)),
                'updated_at' => now(),
            ];
        }

        // Notification when vendor responds
        if (in_array($status, ['accepted', 'rejected', 'countered'])) {
            $notifications[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'user_id' => $adminUserId,
                'type' => 'quote_response',
                'title' => 'Vendor Responded to Quote',
                'message' => "Vendor has {$status} quote #{$quote->uuid}",
                'data' => json_encode([
                    'quote_uuid' => $quote->uuid,
                    'response_type' => $status,
                    'action_url' => "/admin/quotes/{$quote->uuid}",
                ]),
                'read_at' => rand(0, 1) ? now()->subDays(rand(1, 5)) : null,
                'created_at' => $quote->responded_at ?? now()->subDays(rand(1, 15)),
                'updated_at' => now(),
            ];
        }

        // Notification when quote expires
        if ($status === 'expired') {
            $notifications[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'user_id' => $adminUserId,
                'type' => 'quote_expired',
                'title' => 'Quote Expired',
                'message' => "Quote #{$quote->uuid} has expired without vendor response",
                'data' => json_encode([
                    'quote_uuid' => $quote->uuid,
                    'action_url' => "/admin/quotes/{$quote->uuid}",
                ]),
                'read_at' => null,
                'created_at' => $quote->expires_at ?? now()->subDays(rand(1, 10)),
                'updated_at' => now(),
            ];
        }

        foreach ($notifications as $notification) {
            DB::table('notifications')->insert($notification);
        }
    }

    private function createMessages(
        int $tenantId,
        int $quoteId,
        int $adminUserId,
        int $vendorUserId,
        string $status
    ): void {
        $messages = [];
        $messageCount = rand(2, 5);

        for ($i = 0; $i < $messageCount; $i++) {
            $isAdminSender = $i % 2 === 0;
            $senderId = $isAdminSender ? $adminUserId : $vendorUserId;

            $messageContent = $this->getMessageContent($i, $isAdminSender, $status);

            $messages[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenantId,
                'quote_id' => $quoteId,
                'sender_id' => $senderId,
                'message' => $messageContent,
                'attachments' => $i === 0 && rand(0, 1) ? json_encode([
                    [
                        'filename' => 'specifications.pdf',
                        'size' => rand(100000, 5000000),
                        'mime_type' => 'application/pdf',
                        'url' => '/storage/attachments/specifications.pdf',
                    ],
                ]) : json_encode([]),
                'read_at' => rand(0, 1) ? now()->subDays(rand(1, 10)) : null,
                'created_at' => now()->subDays(rand(20 - $i * 3, 25 - $i * 3)),
                'updated_at' => now(),
            ];
        }

        foreach ($messages as $message) {
            DB::table('quote_messages')->insert($message);
        }
    }

    private function getMessageContent(int $index, bool $isAdmin, string $status): string
    {
        if ($isAdmin) {
            return match($index) {
                0 => 'Please review the attached specifications and provide your best quote.',
                2 => 'Can you confirm the delivery timeline?',
                4 => 'Thank you for your response. We will review and get back to you.',
                default => 'Following up on the quote request.',
            };
        } else {
            return match($index) {
                1 => 'Thank you for the quote request. We are reviewing the specifications.',
                3 => 'We can deliver within 14 business days.',
                default => 'We have updated our quote based on your requirements.',
            };
        }
    }
}
