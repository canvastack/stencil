<?php

namespace Database\Seeders\Testing;

use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Ramsey\Uuid\Uuid;

/**
 * Test seeder for vendor portal API layer testing.
 * 
 * This seeder creates comprehensive test data for API endpoint feature tests:
 * - Multiple tenants for tenant isolation testing
 * - Vendors with various statuses and portal configurations
 * - Vendor users with known credentials for authentication testing
 * - Quotes in various statuses for quote workflow testing
 * - Quote messages for message thread testing
 * - Audit logs for audit trail verification
 * 
 * Usage:
 *   php artisan db:seed --class=Database\\Seeders\\Testing\\VendorPortalApiTestSeeder
 */
class VendorPortalApiTestSeeder extends Seeder
{
    /**
     * Default test password for all vendor users
     */
    private const TEST_PASSWORD = 'Test@VendorP4ss2026!';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Vendor Portal API Test Seeder...');

        DB::beginTransaction();

        try {
            // Create test tenants
            $tenants = $this->createTestTenants();
            $this->command->info('✓ Created ' . count($tenants) . ' test tenants');

            // Create test vendors for each tenant
            $vendors = $this->createTestVendors($tenants);
            $this->command->info('✓ Created ' . count($vendors) . ' test vendors');

            // Create test users (vendor users, platform admins, tenant users)
            $users = $this->createTestUsers($tenants, $vendors);
            $this->command->info('✓ Created ' . count($users) . ' test users');

            // Create test orders for quotes
            $orders = $this->createTestOrders($tenants);
            $this->command->info('✓ Created ' . count($orders) . ' test orders');

            // Create test quotes (order_vendor_negotiations)
            $quotes = $this->createTestQuotes($tenants, $vendors, $orders);
            $this->command->info('✓ Created ' . count($quotes) . ' test quotes');

            // Create test quote messages
            $messages = $this->createTestQuoteMessages($tenants, $quotes, $users);
            $this->command->info('✓ Created ' . count($messages) . ' test quote messages');

            // Create test audit logs
            $auditLogs = $this->createTestAuditLogs($tenants, $users, $quotes);
            $this->command->info('✓ Created ' . count($auditLogs) . ' test audit logs');

            DB::commit();

            $this->command->info('');
            $this->command->info('✅ Vendor Portal API Test Seeder completed successfully!');
            $this->command->info('');
            $this->command->info('Summary:');
            $this->command->info('  - Tenants: ' . count($tenants));
            $this->command->info('  - Vendors: ' . count($vendors));
            $this->command->info('  - Users: ' . count($users));
            $this->command->info('  - Orders: ' . count($orders));
            $this->command->info('  - Quotes: ' . count($quotes));
            $this->command->info('  - Quote Messages: ' . count($messages));
            $this->command->info('  - Audit Logs: ' . count($auditLogs));
            $this->command->info('');
            $this->command->info('Test Credentials:');
            $this->command->info('  - Password (all users): ' . self::TEST_PASSWORD);
            $this->command->info('  - Vendor User: active-vendor@test.com');
            $this->command->info('  - Platform Admin: admin.test-tenant-alpha@platform.test');
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('❌ Seeder failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Create test tenants for tenant isolation testing.
     * 
     * @return array<TenantEloquentModel>
     */
    private function createTestTenants(): array
    {
        $tenants = [];

        // Tenant 1: Primary test tenant
        $tenants[] = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant Alpha',
            'slug' => 'test-tenant-alpha',
            'domain' => 'alpha.test.local',
            'status' => 'active',
        ]);

        // Tenant 2: Secondary test tenant for isolation tests
        $tenants[] = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant Beta',
            'slug' => 'test-tenant-beta',
            'domain' => 'beta.test.local',
            'status' => 'active',
        ]);

        return $tenants;
    }

    /**
     * Create test vendors with various configurations.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @return array<Vendor>
     */
    private function createTestVendors(array $tenants): array
    {
        $vendors = [];

        foreach ($tenants as $tenant) {
            // Active vendor with portal access enabled and onboarding completed
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'company_name' => "Active Vendor - {$tenant->name}",
                'code' => 'ACTIVE-' . strtoupper(substr($tenant->slug, 0, 3)),
                'email' => 'active-vendor@test.com',
                'phone' => '+1234567890',
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => now()->subDays(30),
                'portal_last_access_at' => now()->subHours(2),
                'rating' => 4.5,
                'total_orders' => 50,
            ]);

            // Inactive vendor (should not be able to access portal)
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'company_name' => "Inactive Vendor - {$tenant->name}",
                'code' => 'INACTIVE-' . strtoupper(substr($tenant->slug, 0, 3)),
                'email' => 'inactive-vendor@test.com',
                'status' => 'inactive',
                'portal_access_enabled' => false,
                'onboarding_status' => 'pending',
                'onboarding_completed_at' => null,
                'portal_last_access_at' => null,
            ]);

            // Vendor with portal access disabled
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'company_name' => "No Portal Access - {$tenant->name}",
                'code' => 'NOPORTAL-' . strtoupper(substr($tenant->slug, 0, 3)),
                'email' => 'no-portal@test.com',
                'status' => 'active',
                'portal_access_enabled' => false,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => now()->subDays(20),
                'portal_last_access_at' => null,
            ]);

            // Vendor with onboarding in progress
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'company_name' => "Onboarding In Progress - {$tenant->name}",
                'code' => 'ONBOARD-' . strtoupper(substr($tenant->slug, 0, 3)),
                'email' => 'onboarding@test.com',
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'in_progress',
                'onboarding_completed_at' => null,
                'portal_last_access_at' => now()->subDays(1),
            ]);

            // Premium vendor with high performance metrics
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'company_name' => "Premium Vendor - {$tenant->name}",
                'code' => 'PREMIUM-' . strtoupper(substr($tenant->slug, 0, 3)),
                'email' => 'premium-vendor@test.com',
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => now()->subDays(90),
                'portal_last_access_at' => now()->subMinutes(30),
                'rating' => 4.9,
                'total_orders' => 200,
            ]);
        }

        return $vendors;
    }

    /**
     * Create test users (vendor users, platform admins, tenant users).
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<Vendor> $vendors
     * @return array<UserEloquentModel>
     */
    private function createTestUsers(array $tenants, array $vendors): array
    {
        $users = [];

        // Create vendor users for each vendor
        foreach ($vendors as $vendor) {
            // Only create users for vendors with portal access enabled
            if ($vendor->portal_access_enabled) {
                $users[] = UserEloquentModel::create([
                    'tenant_id' => $vendor->tenant_id,
                    'vendor_id' => $vendor->uuid,
                    'name' => "User for {$vendor->company_name}",
                    'email' => $vendor->email,
                    'password' => Hash::make(self::TEST_PASSWORD),
                    'account_type' => 'vendor',
                    'status' => $vendor->status,
                    'failed_login_attempts' => 0,
                    'email_verified_at' => now(),
                ]);
            }
        }

        // Create platform admin users
        foreach ($tenants as $tenant) {
            $users[] = UserEloquentModel::create([
                'tenant_id' => $tenant->id,
                'vendor_id' => null,
                'name' => "Admin for {$tenant->name}",
                'email' => "admin.{$tenant->slug}@platform.test",
                'password' => Hash::make(self::TEST_PASSWORD),
                'account_type' => 'platform',
                'status' => 'active',
                'failed_login_attempts' => 0,
                'email_verified_at' => now(),
            ]);
        }

        // Create tenant users
        foreach ($tenants as $tenant) {
            $users[] = UserEloquentModel::create([
                'tenant_id' => $tenant->id,
                'vendor_id' => null,
                'name' => "Tenant User for {$tenant->name}",
                'email' => "user.{$tenant->slug}@tenant.test",
                'password' => Hash::make(self::TEST_PASSWORD),
                'account_type' => 'tenant',
                'status' => 'active',
                'failed_login_attempts' => 0,
                'email_verified_at' => now(),
            ]);
        }

        return $users;
    }

    /**
     * Create test orders for quotes.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @return array<Order>
     */
    private function createTestOrders(array $tenants): array
    {
        $orders = [];

        foreach ($tenants as $tenant) {
            // Create a test customer for this tenant
            $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
                'tenant_id' => $tenant->id,
            ]);

            // Create 10 orders per tenant
            for ($i = 1; $i <= 10; $i++) {
                $order = Order::factory()->make([
                    'order_number' => "ORD-{$tenant->slug}-" . str_pad($i, 4, '0', STR_PAD_LEFT),
                    'status' => 'pending',
                    'total_amount' => rand(100000, 1000000), // 100k - 1M cents
                    'items' => [
                        [
                            'product_id' => Uuid::uuid4()->toString(),
                            'product_name' => 'Custom Etching Product',
                            'quantity' => rand(1, 10),
                            'specifications' => [
                                'material' => 'stainless_steel',
                                'dimensions' => '10x15cm',
                            ],
                        ],
                    ],
                ]);
                
                // Force set tenant_id and customer_id after make
                $order->tenant_id = $tenant->id;
                $order->customer_id = $customer->id;
                $order->save();
                
                $orders[] = $order;
            }
        }

        return $orders;
    }

    /**
     * Create test quotes (order_vendor_negotiations).
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<Vendor> $vendors
     * @param array<Order> $orders
     * @return array<OrderVendorNegotiation>
     */
    private function createTestQuotes(array $tenants, array $vendors, array $orders): array
    {
        $quotes = [];
        $statuses = ['draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'];

        // Group vendors by tenant
        $vendorsByTenant = [];
        foreach ($vendors as $vendor) {
            if (!isset($vendorsByTenant[$vendor->tenant_id])) {
                $vendorsByTenant[$vendor->tenant_id] = [];
            }
            $vendorsByTenant[$vendor->tenant_id][] = $vendor;
        }

        // Group orders by tenant
        $ordersByTenant = [];
        foreach ($orders as $order) {
            if (!isset($ordersByTenant[$order->tenant_id])) {
                $ordersByTenant[$order->tenant_id] = [];
            }
            $ordersByTenant[$order->tenant_id][] = $order;
        }

        $this->command->info("Orders grouped by tenant: " . json_encode(array_map('count', $ordersByTenant)));

        // Create quotes for each tenant
        foreach ($tenants as $tenant) {
            $this->command->info("Looking for tenant ID: {$tenant->id} (type: " . gettype($tenant->id) . ")");
            $tenantVendors = $vendorsByTenant[$tenant->id] ?? [];
            $tenantOrders = $ordersByTenant[$tenant->id] ?? [];

            $this->command->info("Processing tenant {$tenant->name}: " . count($tenantVendors) . " vendors, " . count($tenantOrders) . " orders");

            if (empty($tenantVendors) || empty($tenantOrders)) {
                $this->command->warn("Skipping tenant {$tenant->name}: empty vendors or orders");
                continue;
            }

            // Create 5 quotes per vendor
            foreach ($tenantVendors as $vendor) {
                // Only create quotes for active vendors
                if ($vendor->status !== 'active') {
                    $this->command->info("Skipping vendor {$vendor->company_name}: status is {$vendor->status}");
                    continue;
                }

                $this->command->info("Creating quotes for vendor {$vendor->company_name}");

                for ($i = 0; $i < 5; $i++) {
                    // Use savepoint for each quote to allow continuing after errors
                    DB::beginTransaction();
                    try {
                        $order = $tenantOrders[array_rand($tenantOrders)];
                        $status = $statuses[array_rand($statuses)];
                        $vendorPrice = rand(50000, 500000);

                        // Generate unique quote number with tenant ID and timestamp
                        $quoteNumber = "QTE-T{$tenant->id}-{$vendor->code}-" . str_pad($i + 1, 4, '0', STR_PAD_LEFT) . "-" . now()->format('His');
                        
                        $quoteData = [
                            'tenant_id' => $tenant->id,
                            'order_id' => $order->id,
                            'vendor_id' => $vendor->id,
                            'quote_number' => $quoteNumber,
                            'status' => $status,
                            'initial_offer' => $vendorPrice,
                            'latest_offer' => $vendorPrice,
                            'currency' => 'IDR',
                            'notes' => "Test quote for {$vendor->company_name}",
                            'quote_details' => [
                                'delivery_days' => rand(7, 30),
                                'payment_terms' => '50-50',
                            ],
                            'history' => [
                                [
                                    'type' => 'vendor_offer',
                                    'amount' => $vendorPrice,
                                    'timestamp' => now()->toIso8601String(),
                                ],
                            ],
                            'round' => 1,
                        ];

                        // Add status-specific fields
                        if (in_array($status, ['sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'])) {
                            $quoteData['sent_at'] = now()->subDays(rand(1, 30));
                            $quoteData['expires_at'] = now()->addDays(rand(1, 7));
                        }

                        if (in_array($status, ['accepted', 'rejected', 'countered'])) {
                            $quoteData['responded_at'] = now()->subDays(rand(1, 5));
                            $quoteData['response_type'] = match($status) {
                                'accepted' => 'accept',
                                'rejected' => 'reject',
                                'countered' => 'counter',
                                default => null,
                            };
                        }

                        if ($status === 'accepted') {
                            // Store delivery days in quote_details
                            $quoteData['quote_details']['estimated_delivery_days'] = rand(7, 30);
                            $quoteData['closed_at'] = now()->subDays(rand(1, 3));
                        }

                        if ($status === 'rejected') {
                            // Store rejection reason in response_notes
                            $quoteData['response_notes'] = 'Unable to meet specifications';
                            $quoteData['closed_at'] = now()->subDays(rand(1, 3));
                        }

                        if ($status === 'countered') {
                            $counterAmount = rand(60000, 600000);
                            // Store counter offer in quote_details
                            $quoteData['quote_details']['counter_offer_amount'] = $counterAmount;
                            $quoteData['latest_offer'] = $counterAmount;
                            $quoteData['round'] = rand(1, 3);
                        }

                        if ($status === 'expired') {
                            $quoteData['expires_at'] = now()->subDays(rand(1, 5));
                            $quoteData['closed_at'] = now()->subDays(rand(1, 2));
                        }

                        $quotes[] = OrderVendorNegotiation::factory()->create($quoteData);
                        DB::commit();
                    } catch (\Exception $e) {
                        DB::rollBack();
                        // Log error but continue with other quotes
                        $this->command->warn("Failed to create quote for vendor {$vendor->company_name}: " . $e->getMessage());
                    }
                }
            }
        }

        return $quotes;
    }

    /**
     * Create test quote messages.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<OrderVendorNegotiation> $quotes
     * @param array<UserEloquentModel> $users
     * @return array<QuoteMessage>
     */
    private function createTestQuoteMessages(array $tenants, array $quotes, array $users): array
    {
        $messages = [];

        // Group users by tenant and type
        $vendorUsersByTenant = [];
        $adminUsersByTenant = [];
        foreach ($users as $user) {
            if ($user->account_type === 'vendor') {
                if (!isset($vendorUsersByTenant[$user->tenant_id])) {
                    $vendorUsersByTenant[$user->tenant_id] = [];
                }
                $vendorUsersByTenant[$user->tenant_id][] = $user;
            } elseif ($user->account_type === 'platform') {
                if (!isset($adminUsersByTenant[$user->tenant_id])) {
                    $adminUsersByTenant[$user->tenant_id] = [];
                }
                $adminUsersByTenant[$user->tenant_id][] = $user;
            }
        }

        // Create messages for each quote
        foreach ($quotes as $quote) {
            // Only create messages for sent/responded quotes
            if (!in_array($quote->status, ['sent', 'pending_response', 'accepted', 'rejected', 'countered'])) {
                continue;
            }

            $vendorUsers = $vendorUsersByTenant[$quote->tenant_id] ?? [];
            $adminUsers = $adminUsersByTenant[$quote->tenant_id] ?? [];

            if (empty($vendorUsers) || empty($adminUsers)) {
                continue;
            }

            $vendorUser = $vendorUsers[array_rand($vendorUsers)];
            $adminUser = $adminUsers[array_rand($adminUsers)];

            // Create 2-5 messages per quote
            $messageCount = rand(2, 5);
            for ($i = 0; $i < $messageCount; $i++) {
                $isFromVendor = $i % 2 === 0;
                $sender = $isFromVendor ? $vendorUser : $adminUser;
                $senderType = $isFromVendor ? 'vendor' : 'admin';

                $messages[] = QuoteMessage::factory()->create([
                    'tenant_id' => $quote->tenant_id,
                    'quote_id' => $quote->id,
                    'sender_id' => $sender->id,
                    'sender_type' => $senderType,
                    'message' => "Test message #{$i} from {$senderType} for quote {$quote->quote_number}",
                    'attachments' => [],
                    'is_read' => $i < $messageCount - 1, // Last message is unread
                    'read_at' => $i < $messageCount - 1 ? now()->subHours(rand(1, 24)) : null,
                    'created_at' => now()->subDays($messageCount - $i),
                ]);
            }
        }

        return $messages;
    }

    /**
     * Create test audit logs.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<UserEloquentModel> $users
     * @param array<OrderVendorNegotiation> $quotes
     * @return array<AuditLog>
     */
    private function createTestAuditLogs(array $tenants, array $users, array $quotes): array
    {
        $auditLogs = [];

        // Group users by tenant
        $usersByTenant = [];
        foreach ($users as $user) {
            if (!isset($usersByTenant[$user->tenant_id])) {
                $usersByTenant[$user->tenant_id] = [];
            }
            $usersByTenant[$user->tenant_id][] = $user;
        }

        // Create audit logs for each tenant
        foreach ($tenants as $tenant) {
            $tenantUsers = $usersByTenant[$tenant->id] ?? [];

            if (empty($tenantUsers)) {
                continue;
            }

            // Create login audit logs
            foreach ($tenantUsers as $user) {
                if ($user->account_type === 'vendor') {
                    $auditLogs[] = AuditLog::factory()->create([
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'user_type' => 'vendor',
                        'action_type' => 'login',
                        'resource_type' => 'auth',
                        'resource_id' => null,
                        'old_values' => null,
                        'new_values' => null,
                        'metadata' => [
                            'email' => $user->email,
                            'success' => true,
                        ],
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'Mozilla/5.0 (Test Browser)',
                        'created_at' => now()->subDays(rand(1, 30)),
                    ]);
                }
            }

            // Create quote action audit logs
            foreach ($quotes as $quote) {
                if ($quote->tenant_id !== $tenant->id) {
                    continue;
                }

                // Find vendor user for this quote
                $vendorUser = collect($tenantUsers)->first(function ($user) use ($quote) {
                    return $user->account_type === 'vendor' && $user->vendor_id === $quote->vendor->uuid;
                });

                if (!$vendorUser) {
                    continue;
                }

                // Create audit log for quote response
                if (in_array($quote->status, ['accepted', 'rejected', 'countered'])) {
                    $auditLogs[] = AuditLog::factory()->create([
                        'tenant_id' => $tenant->id,
                        'user_id' => $vendorUser->id,
                        'user_type' => 'vendor',
                        'action_type' => "quote_{$quote->status}",
                        'resource_type' => 'quote',
                        'resource_id' => $quote->uuid,
                        'old_values' => [
                            'status' => 'sent',
                        ],
                        'new_values' => [
                            'status' => $quote->status,
                            'responded_at' => $quote->responded_at?->toIso8601String(),
                        ],
                        'metadata' => [
                            'quote_number' => $quote->quote_number,
                            'vendor_name' => $quote->vendor->company_name,
                        ],
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'Mozilla/5.0 (Test Browser)',
                        'created_at' => $quote->responded_at ?? now(),
                    ]);
                }
            }
        }

        return $auditLogs;
    }
}
