<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InstalledPlugin;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Carbon\Carbon;

class InstalledPluginSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🔌 Seeding Plugin Installation Requests...');

        $tenants = Tenant::where('status', 'active')->get();
        
        if ($tenants->isEmpty()) {
            $this->command->warn('No active tenants found. Skipping plugin seeding.');
            return;
        }

        $platformAdmin = AccountEloquentModel::where('email', 'admin@canvastencil.com')->first();

        $availablePlugins = [
            [
                'plugin_name' => 'advanced-analytics',
                'display_name' => 'Advanced Analytics Dashboard',
                'version' => '1.2.0',
                'manifest' => [
                    'name' => 'advanced-analytics',
                    'display_name' => 'Advanced Analytics Dashboard',
                    'version' => '1.2.0',
                    'description' => 'Comprehensive analytics and reporting dashboard with real-time insights',
                    'author' => 'CanvaStack Team',
                    'license' => 'Commercial',
                    'category' => 'Analytics',
                    'requires' => ['php' => '>=8.1', 'laravel' => '>=10.0'],
                    'permissions' => ['analytics:view', 'analytics:export', 'reports:generate'],
                    'features' => [
                        'Real-time analytics',
                        'Custom report builder',
                        'Data export (PDF, Excel)',
                        'Dashboard widgets'
                    ]
                ]
            ],
            [
                'plugin_name' => 'email-marketing',
                'display_name' => 'Email Marketing Suite',
                'version' => '2.0.1',
                'manifest' => [
                    'name' => 'email-marketing',
                    'display_name' => 'Email Marketing Suite',
                    'version' => '2.0.1',
                    'description' => 'Complete email marketing automation with campaign management',
                    'author' => 'Marketing Pro',
                    'license' => 'Commercial',
                    'category' => 'Marketing',
                    'requires' => ['php' => '>=8.1'],
                    'permissions' => ['email:send', 'campaigns:manage', 'templates:edit'],
                    'features' => [
                        'Campaign automation',
                        'Email templates',
                        'A/B testing',
                        'Subscriber management'
                    ]
                ]
            ],
            [
                'plugin_name' => 'inventory-management',
                'display_name' => 'Advanced Inventory Management',
                'version' => '1.5.3',
                'manifest' => [
                    'name' => 'inventory-management',
                    'display_name' => 'Advanced Inventory Management',
                    'version' => '1.5.3',
                    'description' => 'Real-time inventory tracking with multi-warehouse support',
                    'author' => 'Inventory Solutions',
                    'license' => 'Commercial',
                    'category' => 'Operations',
                    'requires' => ['php' => '>=8.1', 'postgresql' => '>=13.0'],
                    'permissions' => ['inventory:view', 'inventory:edit', 'warehouses:manage'],
                    'features' => [
                        'Multi-warehouse tracking',
                        'Low stock alerts',
                        'Batch management',
                        'Stock transfer'
                    ]
                ]
            ],
            // Disabled: Backend-only plugin (no frontend module)
            // [
            //     'plugin_name' => 'customer-loyalty',
            //     'display_name' => 'Customer Loyalty Program',
            //     'version' => '1.0.5',
            //     'manifest' => [
            //         'name' => 'customer-loyalty',
            //         'display_name' => 'Customer Loyalty Program',
            //         'version' => '1.0.5',
            //         'description' => 'Build customer loyalty with points, rewards, and membership tiers',
            //         'author' => 'Loyalty Plus',
            //         'license' => 'Commercial',
            //         'category' => 'Customer Engagement',
            //         'requires' => ['php' => '>=8.1'],
            //         'permissions' => ['loyalty:manage', 'rewards:create', 'points:adjust'],
            //         'features' => [
            //             'Points system',
            //             'Reward catalog',
            //             'Membership tiers',
            //             'Referral tracking'
            //         ]
            //     ]
            // ],
            [
                'plugin_name' => 'sms-notifications',
                'display_name' => 'SMS Notification Gateway',
                'version' => '1.1.2',
                'manifest' => [
                    'name' => 'sms-notifications',
                    'display_name' => 'SMS Notification Gateway',
                    'version' => '1.1.2',
                    'description' => 'Send SMS notifications for orders, shipping, and marketing',
                    'author' => 'SMS Gateway Inc',
                    'license' => 'Commercial',
                    'category' => 'Communication',
                    'requires' => ['php' => '>=8.1'],
                    'permissions' => ['sms:send', 'sms:templates', 'sms:logs'],
                    'features' => [
                        'Order notifications',
                        'Shipping updates',
                        'Marketing campaigns',
                        'Two-way SMS'
                    ]
                ]
            ],
            [
                'plugin_name' => 'payment-gateway-extended',
                'display_name' => 'Extended Payment Gateways',
                'version' => '2.3.0',
                'manifest' => [
                    'name' => 'payment-gateway-extended',
                    'display_name' => 'Extended Payment Gateways',
                    'version' => '2.3.0',
                    'description' => 'Support for multiple payment providers including cryptocurrency',
                    'author' => 'Payment Solutions',
                    'license' => 'Commercial',
                    'category' => 'Finance',
                    'requires' => ['php' => '>=8.1', 'ssl' => 'required'],
                    'permissions' => ['payments:process', 'gateways:configure', 'refunds:process'],
                    'features' => [
                        'Multiple gateway support',
                        'Crypto payments',
                        'Subscription billing',
                        'Fraud detection'
                    ]
                ]
            ],
            [
                'plugin_name' => 'social-media-integration',
                'display_name' => 'Social Media Integration',
                'version' => '1.4.1',
                'manifest' => [
                    'name' => 'social-media-integration',
                    'display_name' => 'Social Media Integration',
                    'version' => '1.4.1',
                    'description' => 'Integrate with Facebook, Instagram, Twitter for marketing and sales',
                    'author' => 'Social Connect',
                    'license' => 'Commercial',
                    'category' => 'Marketing',
                    'requires' => ['php' => '>=8.1'],
                    'permissions' => ['social:connect', 'social:post', 'social:analytics'],
                    'features' => [
                        'Multi-platform posting',
                        'Social commerce',
                        'Engagement tracking',
                        'Influencer management'
                    ]
                ]
            ]
        ];

        $statusDistribution = [
            'pending' => 8,
            'approved' => 6,
            'active' => 12,
            'rejected' => 4,
            'suspended' => 2,
            'expired' => 2
        ];

        $createdCount = 0;

        foreach ($statusDistribution as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $tenant = $tenants->random();
                $plugin = $availablePlugins[array_rand($availablePlugins)];
                
                $tenantUsers = UserEloquentModel::withoutGlobalScope('tenant')
                    ->where('tenant_id', $tenant->id)
                    ->get();

                if ($tenantUsers->isEmpty()) {
                    continue;
                }
                
                $tenantUser = $tenantUsers->random();

                $requestedAt = Carbon::now()->subDays(rand(1, 60));
                
                $data = [
                    'tenant_id' => $tenant->uuid,
                    'plugin_name' => $plugin['plugin_name'],
                    'plugin_version' => $plugin['version'],
                    'display_name' => $plugin['display_name'],
                    'status' => $status,
                    'manifest' => $plugin['manifest'],
                    'settings' => [],
                    'migrations_run' => [],
                    'requested_at' => $requestedAt,
                    'requested_by' => $tenantUser->uuid,
                ];

                if (in_array($status, ['approved', 'active', 'suspended', 'expired'])) {
                    $approvedAt = $requestedAt->copy()->addHours(rand(1, 48));
                    $data['approved_at'] = $approvedAt;
                    if ($platformAdmin) {
                        $data['approved_by'] = $platformAdmin->uuid;
                    }
                    $data['approval_notes'] = $this->getRandomApprovalNote();
                }

                if (in_array($status, ['active', 'suspended', 'expired'])) {
                    $installedAt = $data['approved_at']->copy()->addMinutes(rand(5, 30));
                    $data['installed_at'] = $installedAt;
                    if ($platformAdmin) {
                        $data['installed_by'] = $platformAdmin->uuid;
                    }
                    $data['migrations_run'] = ['initial_migration', 'setup_tables'];
                }

                if (in_array($status, ['active', 'expired'])) {
                    $data['expires_at'] = Carbon::now()->addYear();
                }

                if ($status === 'expired') {
                    $data['expires_at'] = Carbon::now()->subDays(rand(1, 30));
                    $data['expiry_notified_at'] = $data['expires_at']->copy()->subDays(7);
                }

                if ($status === 'rejected') {
                    $rejectedAt = $requestedAt->copy()->addHours(rand(1, 72));
                    $data['rejected_at'] = $rejectedAt;
                    if ($platformAdmin) {
                        $data['rejected_by'] = $platformAdmin->uuid;
                    }
                    $data['rejection_reason'] = $this->getRandomRejectionReason();
                }

                if ($status === 'suspended') {
                    $data['approval_notes'] = 'Suspended due to policy violation. Contact support for reactivation.';
                }

                $existing = InstalledPlugin::where('tenant_id', $tenant->uuid)
                    ->where('plugin_name', $plugin['plugin_name'])
                    ->first();

                if (!$existing) {
                    InstalledPlugin::create($data);
                    $createdCount++;
                }
            }
        }

        $this->command->info("✅ Created {$createdCount} plugin installation requests");
        $this->command->info("   - Pending: {$statusDistribution['pending']} requests");
        $this->command->info("   - Approved: {$statusDistribution['approved']} requests");
        $this->command->info("   - Active: {$statusDistribution['active']} installations");
        $this->command->info("   - Rejected: {$statusDistribution['rejected']} requests");
        $this->command->info("   - Suspended: {$statusDistribution['suspended']} installations");
        $this->command->info("   - Expired: {$statusDistribution['expired']} installations");
    }

    private function getRandomApprovalNote(): string
    {
        $notes = [
            'Approved after security review. All requirements met.',
            'Plugin compatible with tenant infrastructure. Approved.',
            'Request approved. License valid for 1 year.',
            'Verified plugin authenticity. Safe to install.',
            'Approved with standard license terms.',
            'Plugin reviewed and approved by platform team.',
            'All security checks passed. Installation authorized.',
        ];

        return $notes[array_rand($notes)];
    }

    private function getRandomRejectionReason(): string
    {
        $reasons = [
            'Plugin requires PHP 8.2+ which is not available in current infrastructure.',
            'Security vulnerability detected in plugin version. Please request updated version.',
            'Plugin conflicts with existing tenant modules.',
            'License verification failed. Please provide valid license key.',
            'Plugin not compatible with current subscription tier.',
            'Duplicate functionality already exists in tenant system.',
            'Plugin exceeds resource limits for current subscription plan.',
        ];

        return $reasons[array_rand($reasons)];
    }
}
