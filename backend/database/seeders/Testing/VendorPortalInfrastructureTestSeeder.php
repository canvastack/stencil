<?php

namespace Database\Seeders\Testing;

use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;

/**
 * Test seeder for vendor portal infrastructure layer testing.
 * 
 * This seeder creates comprehensive test data for repository integration tests:
 * - Multiple tenants for tenant isolation testing
 * - Vendors with various statuses and configurations
 * - Vendor users with different account types
 * - Quote messages for message repository testing
 * - Audit logs for audit log repository testing
 * 
 * Usage:
 *   php artisan db:seed --class=Database\\Seeders\\Testing\\VendorPortalInfrastructureTestSeeder
 */
class VendorPortalInfrastructureTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Vendor Portal Infrastructure Test Seeder...');

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

            // Create test quote messages
            $messages = $this->createTestQuoteMessages($tenants, $vendors, $users);
            $this->command->info('✓ Created ' . count($messages) . ' test quote messages');

            // Create test audit logs
            $auditLogs = $this->createTestAuditLogs($tenants, $users);
            $this->command->info('✓ Created ' . count($auditLogs) . ' test audit logs');

            DB::commit();

            $this->command->info('');
            $this->command->info('✅ Vendor Portal Infrastructure Test Seeder completed successfully!');
            $this->command->info('');
            $this->command->info('Summary:');
            $this->command->info('  - Tenants: ' . count($tenants));
            $this->command->info('  - Vendors: ' . count($vendors));
            $this->command->info('  - Users: ' . count($users));
            $this->command->info('  - Quote Messages: ' . count($messages));
            $this->command->info('  - Audit Logs: ' . count($auditLogs));
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
        ]);

        // Tenant 2: Secondary test tenant for isolation tests
        $tenants[] = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant Beta',
            'slug' => 'test-tenant-beta',
            'domain' => 'beta.test.local',
        ]);

        // Tenant 3: Third test tenant for multi-tenant scenarios
        $tenants[] = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant Gamma',
            'slug' => 'test-tenant-gamma',
            'domain' => 'gamma.test.local',
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
                'name' => "Active Vendor - {$tenant->name}",
                'code' => 'ACTIVE-' . strtoupper(substr($tenant->slug, 0, 3)),
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => now()->subDays(30),
                'portal_last_access_at' => now()->subHours(2),
            ]);

            // Inactive vendor (should not be able to access portal)
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "Inactive Vendor - {$tenant->name}",
                'code' => 'INACTIVE-' . strtoupper(substr($tenant->slug, 0, 3)),
                'status' => 'inactive',
                'portal_access_enabled' => false,
                'onboarding_status' => 'pending',
                'onboarding_completed_at' => null,
                'portal_last_access_at' => null,
            ]);

            // Vendor with portal access disabled
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "No Portal Access - {$tenant->name}",
                'code' => 'NOPORTAL-' . strtoupper(substr($tenant->slug, 0, 3)),
                'status' => 'active',
                'portal_access_enabled' => false,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => now()->subDays(20),
                'portal_last_access_at' => null,
            ]);

            // Vendor with onboarding in progress
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "Onboarding In Progress - {$tenant->name}",
                'code' => 'ONBOARD-' . strtoupper(substr($tenant->slug, 0, 3)),
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'in_progress',
                'onboarding_completed_at' => null,
                'portal_last_access_at' => now()->subDays(1),
            ]);

            // Premium vendor with high performance metrics
            $vendors[] = Vendor::factory()->create([
                'tenant_id' => $tenant->id,
                'name' => "Premium Vendor - {$tenant->name}",
                'code' => 'PREMIUM-' . strtoupper(substr($tenant->slug, 0, 3)),
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => now()->subDays(90),
                'portal_last_access_at' => now()->subMinutes(30),
                'rating' => 4.8,
                'total_orders' => 150,
            ]);
        }

        return $vendors;
    }

    /**
     * Create test users with different account types.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<Vendor> $vendors
     * @return array<UserEloquentModel>
     */
    private function createTestUsers(array $tenants, array $vendors): array
    {
        $users = [];

        // Create vendor users for active vendors
        foreach ($vendors as $vendor) {
            if ($vendor->status === 'active' && $vendor->portal_access_enabled) {
                $users[] = UserEloquentModel::factory()->create([
                    'tenant_id' => $vendor->tenant_id,
                    'vendor_id' => $vendor->uuid,
                    'account_type' => 'vendor',
                    'name' => "Vendor User - {$vendor->name}",
                    'email' => strtolower(str_replace(' ', '.', $vendor->code)) . '@vendor.test',
                    'status' => 'active',
                    'last_login_at' => now()->subHours(rand(1, 48)),
                ]);
            }
        }

        // Create platform admin users
        foreach ($tenants as $tenant) {
            $users[] = UserEloquentModel::factory()->create([
                'tenant_id' => $tenant->id,
                'vendor_id' => null,
                'account_type' => 'platform',
                'name' => "Platform Admin - {$tenant->name}",
                'email' => "admin.{$tenant->slug}@platform.test",
                'status' => 'active',
            ]);
        }

        // Create tenant users
        foreach ($tenants as $tenant) {
            $users[] = UserEloquentModel::factory()->create([
                'tenant_id' => $tenant->id,
                'vendor_id' => null,
                'account_type' => 'tenant',
                'name' => "Tenant User - {$tenant->name}",
                'email' => "user.{$tenant->slug}@tenant.test",
                'status' => 'active',
            ]);
        }

        return $users;
    }

    /**
     * Create test quote messages for message repository testing.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<Vendor> $vendors
     * @param array<UserEloquentModel> $users
     * @return array<QuoteMessage>
     */
    private function createTestQuoteMessages(array $tenants, array $vendors, array $users): array
    {
        $messages = [];

        // Note: This assumes quotes exist in the database
        // In a real test scenario, you would create quotes first
        // For now, we'll create messages with placeholder quote IDs
        // The actual tests will create their own quotes and messages

        foreach ($tenants as $tenant) {
            $tenantVendors = array_filter($vendors, fn($v) => $v->tenant_id === $tenant->id);
            $tenantUsers = array_filter($users, fn($u) => $u->tenant_id === $tenant->id);

            if (empty($tenantVendors) || empty($tenantUsers)) {
                continue;
            }

            // Create sample messages (these will be used as templates in tests)
            // Actual tests will create their own quotes and messages
            $this->command->info("  Note: Quote messages will be created by individual tests");
        }

        return $messages;
    }

    /**
     * Create test audit logs for audit log repository testing.
     * 
     * @param array<TenantEloquentModel> $tenants
     * @param array<UserEloquentModel> $users
     * @return array<AuditLog>
     */
    private function createTestAuditLogs(array $tenants, array $users): array
    {
        $auditLogs = [];

        foreach ($tenants as $tenant) {
            $tenantUsers = array_filter($users, fn($u) => $u->tenant_id === $tenant->id);

            foreach ($tenantUsers as $user) {
                // Login action
                $auditLogs[] = AuditLog::factory()->create([
                    'tenant_id' => $tenant->id, // Use integer ID, not UUID
                    'user_id' => $user->id, // Use integer ID, not UUID
                    'user_type' => $user->account_type,
                    'action_type' => 'login',
                    'resource_type' => 'authentication',
                    'resource_id' => $user->uuid, // Resource ID can be UUID string
                    'old_values' => null,
                    'new_values' => json_encode([
                        'login_at' => now()->subDays(rand(1, 30))->toIso8601String(),
                        'ip_address' => '192.168.1.' . rand(1, 255),
                    ]),
                    'metadata' => json_encode([
                        'user_agent' => 'Mozilla/5.0 (Test Browser)',
                        'session_id' => Uuid::uuid4()->toString(),
                    ]),
                    'ip_address' => '192.168.1.' . rand(1, 255),
                    'user_agent' => 'Mozilla/5.0 (Test Browser)',
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);

                // Profile update action (for vendor users)
                if ($user->account_type === 'vendor') {
                    $auditLogs[] = AuditLog::factory()->create([
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'user_type' => 'vendor',
                        'action_type' => 'profile_updated',
                        'resource_type' => 'vendor',
                        'resource_id' => $user->vendor_id, // This is already a UUID string
                        'old_values' => json_encode([
                            'phone' => '+62 21 1234 5678',
                            'contact_person' => 'Old Contact',
                        ]),
                        'new_values' => json_encode([
                            'phone' => '+62 21 8765 4321',
                            'contact_person' => 'New Contact',
                        ]),
                        'metadata' => json_encode([
                            'fields_changed' => ['phone', 'contact_person'],
                        ]),
                        'ip_address' => '192.168.1.' . rand(1, 255),
                        'user_agent' => 'Mozilla/5.0 (Test Browser)',
                        'created_at' => now()->subDays(rand(1, 20)),
                    ]);

                    // Quote response action
                    $auditLogs[] = AuditLog::factory()->create([
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'user_type' => 'vendor',
                        'action_type' => 'quote_accepted',
                        'resource_type' => 'quote',
                        'resource_id' => Uuid::uuid4()->toString(),
                        'old_values' => json_encode([
                            'status' => 'sent',
                        ]),
                        'new_values' => json_encode([
                            'status' => 'accepted',
                            'estimated_delivery_days' => 7,
                        ]),
                        'metadata' => json_encode([
                            'response_type' => 'accept',
                            'notes' => 'Accepted with standard delivery time',
                        ]),
                        'ip_address' => '192.168.1.' . rand(1, 255),
                        'user_agent' => 'Mozilla/5.0 (Test Browser)',
                        'created_at' => now()->subDays(rand(1, 15)),
                    ]);
                }

                // Logout action
                $auditLogs[] = AuditLog::factory()->create([
                    'tenant_id' => $tenant->id,
                    'user_id' => $user->id,
                    'user_type' => $user->account_type,
                    'action_type' => 'logout',
                    'resource_type' => 'authentication',
                    'resource_id' => $user->uuid,
                    'old_values' => null,
                    'new_values' => json_encode([
                        'logout_at' => now()->subDays(rand(1, 30))->toIso8601String(),
                    ]),
                    'metadata' => json_encode([
                        'session_duration_minutes' => rand(10, 120),
                    ]),
                    'ip_address' => '192.168.1.' . rand(1, 255),
                    'user_agent' => 'Mozilla/5.0 (Test Browser)',
                    'created_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }

        return $auditLogs;
    }
}
