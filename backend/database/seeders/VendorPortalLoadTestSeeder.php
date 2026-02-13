<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Carbon\Carbon;

class VendorPortalLoadTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates test data for vendor portal load testing:
     * - 5 test vendors with portal access
     * - 10,000+ quotes for performance testing
     * - Quote messages for message testing
     * 
     * @return void
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting Vendor Portal Load Test Seeder...');
        
        // Get tenant ID (adjust this to your tenant)
        $tenantId = DB::table('tenants')->first()->uuid ?? null;
        
        if (!$tenantId) {
            $this->command->error('❌ No tenant found. Please create a tenant first.');
            return;
        }
        
        $this->command->info("📍 Using tenant: {$tenantId}");
        
        // Set tenant context for multi-tenant operations
        DB::statement("SET app.current_tenant_id = '{$tenantId}'");
        
        // Step 1: Create test vendors
        $this->command->info('👥 Creating test vendors...');
        $vendorIds = $this->createTestVendors($tenantId);
        
        // Step 2: Create test users for vendors
        $this->command->info('🔐 Creating vendor user accounts...');
        $this->createVendorUsers($vendorIds, $tenantId);
        
        // Step 3: Create test orders
        $this->command->info('📦 Creating test orders...');
        $orderIds = $this->createTestOrders($tenantId, 2000); // 2000 orders
        
        // Step 4: Create test quotes (10,000+)
        $this->command->info('📋 Creating test quotes (this may take a while)...');
        $quoteIds = $this->createTestQuotes($tenantId, $vendorIds, $orderIds);
        
        // Step 5: Create test messages
        $this->command->info('💬 Creating test messages...');
        $this->createTestMessages($tenantId, $quoteIds);
        
        $this->command->info('✅ Vendor Portal Load Test Seeder completed!');
        $this->command->info("📊 Summary:");
        $this->command->info("   - Vendors: " . count($vendorIds));
        $this->command->info("   - Orders: " . count($orderIds));
        $this->command->info("   - Quotes: " . count($quoteIds));
        $this->command->info("   - Ready for load testing!");
    }

    /**
     * Create test vendors with portal access
     */
    private function createTestVendors(string $tenantId): array
    {
        $vendorIds = [];
        
        for ($i = 1; $i <= 5; $i++) {
            $vendorId = Str::uuid()->toString();
            
            DB::table('vendors')->insert([
                'id' => $vendorId,
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $tenantId,
                'company_name' => "Load Test Vendor {$i}",
                'email' => "vendor{$i}@test.com",
                'phone' => "+6212345678" . $i,
                'address' => "Test Address {$i}, Jakarta, Indonesia",
                'status' => 'active',
                'quality_tier' => 'standard',
                'portal_access_enabled' => true,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => Carbon::now()->subDays(30),
                'is_verified' => true,
                'verified_at' => Carbon::now()->subDays(30),
                'created_at' => Carbon::now()->subDays(60),
                'updated_at' => Carbon::now(),
            ]);
            
            $vendorIds[] = $vendorId;
            $this->command->info("   ✓ Created vendor: vendor{$i}@test.com");
        }
        
        return $vendorIds;
    }
    
    /**
     * Create user accounts for vendors
     */
    private function createVendorUsers(array $vendorIds, string $tenantId): void
    {
        foreach ($vendorIds as $index => $vendorId) {
            $userId = Str::uuid()->toString();
            $vendorNumber = $index + 1;
            
            DB::table('users')->insert([
                'id' => $userId,
                'vendor_id' => $vendorId,
                'account_type' => 'vendor',
                'email' => "vendor{$vendorNumber}@test.com",
                'password' => Hash::make('Vendor123!'),
                'name' => "Load Test Vendor {$vendorNumber}",
                'first_name' => "Vendor",
                'last_name' => "{$vendorNumber}",
                'status' => 'active',
                'is_email_verified' => true,
                'email_verified_at' => Carbon::now()->subDays(30),
                'created_at' => Carbon::now()->subDays(60),
                'updated_at' => Carbon::now(),
            ]);
            
            $this->command->info("   ✓ Created user: vendor{$vendorNumber}@test.com (password: Vendor123!)");
        }
    }
    
    /**
     * Create test orders
     */
    private function createTestOrders(string $tenantId, int $count): array
    {
        $orderIds = [];
        $batchSize = 100;
        $batches = ceil($count / $batchSize);
        
        // Get a customer ID (create one if doesn't exist)
        $customerId = DB::table('customers')->where('tenant_id', $tenantId)->first()->id ?? null;
        
        if (!$customerId) {
            $customerId = Str::uuid()->toString();
            DB::table('customers')->insert([
                'id' => $customerId,
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $tenantId,
                'name' => 'Load Test Customer',
                'email' => 'customer@test.com',
                'phone' => '+628123456789',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
        
        for ($batch = 0; $batch < $batches; $batch++) {
            $orders = [];
            $currentBatchSize = min($batchSize, $count - ($batch * $batchSize));
            
            for ($i = 0; $i < $currentBatchSize; $i++) {
                $orderId = Str::uuid()->toString();
                $orderNumber = 'ORD-LOAD-' . str_pad(($batch * $batchSize) + $i + 1, 6, '0', STR_PAD_LEFT);
                
                $orders[] = [
                    'id' => $orderId,
                    'uuid' => Str::uuid()->toString(),
                    'tenant_id' => $tenantId,
                    'customer_id' => $customerId,
                    'order_number' => $orderNumber,
                    'status' => 'pending',
                    'total_amount' => rand(100000, 5000000),
                    'currency' => 'IDR',
                    'items' => json_encode([
                        [
                            'product_name' => 'Load Test Product',
                            'quantity' => rand(1, 10),
                            'unit_price' => rand(50000, 500000),
                        ]
                    ]),
                    'created_at' => Carbon::now()->subDays(rand(1, 90)),
                    'updated_at' => Carbon::now(),
                ];
                
                $orderIds[] = $orderId;
            }
            
            DB::table('orders')->insert($orders);
            $this->command->info("   ✓ Created orders batch " . ($batch + 1) . "/{$batches}");
        }
        
        return $orderIds;
    }

    /**
     * Create test quotes (10,000+)
     */
    private function createTestQuotes(string $tenantId, array $vendorIds, array $orderIds): array
    {
        $quoteIds = [];
        $quotesPerVendor = 2000; // 2000 quotes per vendor = 10,000 total
        $batchSize = 100;
        
        $statuses = ['sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'];
        $statusWeights = [30, 25, 20, 10, 10, 5]; // Percentage distribution
        
        foreach ($vendorIds as $vendorIndex => $vendorId) {
            $vendorNumber = $vendorIndex + 1;
            $batches = ceil($quotesPerVendor / $batchSize);
            
            for ($batch = 0; $batch < $batches; $batch++) {
                $quotes = [];
                $currentBatchSize = min($batchSize, $quotesPerVendor - ($batch * $batchSize));
                
                for ($i = 0; $i < $currentBatchSize; $i++) {
                    $quoteId = Str::uuid()->toString();
                    $quoteNumber = "Q-V{$vendorNumber}-" . str_pad(($batch * $batchSize) + $i + 1, 6, '0', STR_PAD_LEFT);
                    
                    // Select random order
                    $orderId = $orderIds[array_rand($orderIds)];
                    
                    // Select status based on weights
                    $status = $this->weightedRandom($statuses, $statusWeights);
                    
                    // Generate timestamps based on status
                    $createdAt = Carbon::now()->subDays(rand(1, 90));
                    $sentAt = $status !== 'draft' ? $createdAt->copy()->addHours(rand(1, 24)) : null;
                    $expiresAt = $sentAt ? $sentAt->copy()->addDays(rand(7, 30)) : null;
                    $respondedAt = in_array($status, ['accepted', 'rejected', 'countered']) 
                        ? $sentAt->copy()->addDays(rand(1, 7)) 
                        : null;
                    
                    $quotes[] = [
                        'id' => $quoteId,
                        'uuid' => Str::uuid()->toString(),
                        'tenant_id' => $tenantId,
                        'order_id' => $orderId,
                        'vendor_id' => $vendorId,
                        'quote_number' => $quoteNumber,
                        'status' => $status,
                        'vendor_price' => rand(100000, 5000000),
                        'counter_offer_amount' => $status === 'countered' ? rand(100000, 5000000) : null,
                        'estimated_delivery_days' => $status === 'accepted' ? rand(7, 30) : null,
                        'rejection_reason' => $status === 'rejected' ? 'Load test rejection reason' : null,
                        'notes' => "Load test quote for vendor {$vendorNumber}",
                        'sent_at' => $sentAt,
                        'responded_at' => $respondedAt,
                        'expires_at' => $expiresAt,
                        'response_type' => $respondedAt ? ($status === 'accepted' ? 'accept' : ($status === 'rejected' ? 'reject' : 'counter')) : null,
                        'created_at' => $createdAt,
                        'updated_at' => Carbon::now(),
                    ];
                    
                    $quoteIds[] = $quoteId;
                }
                
                DB::table('order_vendor_negotiations')->insert($quotes);
                
                $progress = (($vendorIndex * $batches) + $batch + 1) / (count($vendorIds) * $batches) * 100;
                $this->command->info(sprintf("   ✓ Progress: %.1f%% (Vendor %d, Batch %d/%d)", 
                    $progress, $vendorNumber, $batch + 1, $batches));
            }
        }
        
        return $quoteIds;
    }
    
    /**
     * Create test messages
     */
    private function createTestMessages(string $tenantId, array $quoteIds): void
    {
        // Create messages for 10% of quotes (1000 messages)
        $quotesWithMessages = array_rand(array_flip($quoteIds), min(1000, count($quoteIds)));
        $batchSize = 100;
        $batches = ceil(count($quotesWithMessages) / $batchSize);
        
        // Get admin user ID
        $adminUserId = DB::table('users')
            ->where('account_type', 'tenant')
            ->orWhere('account_type', 'platform')
            ->first()->id ?? null;
        
        // Get vendor user IDs
        $vendorUserIds = DB::table('users')
            ->where('account_type', 'vendor')
            ->pluck('id')
            ->toArray();
        
        if (!$adminUserId || empty($vendorUserIds)) {
            $this->command->warn('   ⚠ Skipping messages: No admin or vendor users found');
            return;
        }
        
        for ($batch = 0; $batch < $batches; $batch++) {
            $messages = [];
            $currentBatch = array_slice($quotesWithMessages, $batch * $batchSize, $batchSize);
            
            foreach ($currentBatch as $quoteId) {
                // Create 1-3 messages per quote
                $messageCount = rand(1, 3);
                
                for ($i = 0; $i < $messageCount; $i++) {
                    $isFromVendor = $i % 2 === 0; // Alternate between vendor and admin
                    $senderId = $isFromVendor 
                        ? $vendorUserIds[array_rand($vendorUserIds)]
                        : $adminUserId;
                    
                    $messages[] = [
                        'id' => Str::uuid()->toString(),
                        'uuid' => Str::uuid()->toString(),
                        'tenant_id' => $tenantId,
                        'quote_id' => $quoteId,
                        'sender_id' => $senderId,
                        'message' => "Load test message " . ($i + 1) . " for quote",
                        'sender_type' => $isFromVendor ? 'vendor' : 'admin',
                        'is_read' => rand(0, 1) === 1,
                        'attachments' => json_encode([]),
                        'created_at' => Carbon::now()->subDays(rand(1, 30)),
                        'updated_at' => Carbon::now(),
                    ];
                }
            }
            
            DB::table('quote_messages')->insert($messages);
            $this->command->info("   ✓ Created messages batch " . ($batch + 1) . "/{$batches}");
        }
    }
    
    /**
     * Select random item based on weights
     */
    private function weightedRandom(array $items, array $weights): mixed
    {
        $totalWeight = array_sum($weights);
        $random = rand(1, $totalWeight);
        
        $currentWeight = 0;
        foreach ($items as $index => $item) {
            $currentWeight += $weights[$index];
            if ($random <= $currentWeight) {
                return $item;
            }
        }
        
        return $items[0];
    }
}
