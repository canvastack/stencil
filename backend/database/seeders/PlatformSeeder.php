<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;

class PlatformSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Platform Roles
        $this->createPlatformRoles();
        
        // Create Platform Super Admin Account
        $this->createPlatformAccounts();
        
        // Create Demo Tenant with Users
        $this->createDemoTenant();
    }

    private function createPlatformRoles(): void
    {
        $platformRoles = [
            [
                'name' => 'Super Administrator',
                'slug' => 'super-admin',
                'guard_name' => 'api',
                'description' => 'Full platform access with all permissions',
                'is_system' => true,
                'abilities' => [
                    'platform:read',
                    'platform:write', 
                    'tenants:manage',
                    'tenants:create',
                    'tenants:update',
                    'tenants:delete',
                    'tenants:suspend',
                    'tenants:activate',
                    'analytics:view',
                    'subscriptions:manage',
                    'domains:manage',
                    'users:impersonate',
                    'system:configure'
                ]
            ],
            [
                'name' => 'Platform Manager',
                'slug' => 'platform-manager',
                'guard_name' => 'api',
                'description' => 'Platform management with limited system access',
                'is_system' => true,
                'abilities' => [
                    'platform:read',
                    'tenants:manage',
                    'tenants:create',
                    'tenants:update',
                    'tenants:suspend',
                    'tenants:activate',
                    'analytics:view',
                    'subscriptions:manage'
                ]
            ],
            [
                'name' => 'Support Agent',
                'slug' => 'support-agent',
                'guard_name' => 'api',
                'description' => 'Customer support with read-only access',
                'is_system' => true,
                'abilities' => [
                    'platform:read',
                    'tenants:view',
                    'analytics:view'
                ]
            ]
        ];

        foreach ($platformRoles as $roleData) {
            $role = RoleEloquentModel::firstOrCreate(
                ['slug' => $roleData['slug'], 'tenant_id' => null],
                $roleData
            );

            // Create permissions and sync to role
            if (isset($roleData['abilities']) && is_array($roleData['abilities'])) {
                $permissions = [];
                foreach ($roleData['abilities'] as $permissionName) {
                    $permission = \Spatie\Permission\Models\Permission::firstOrCreate(
                        [
                            'name' => $permissionName,
                            'guard_name' => 'api',
                        ]
                    );
                    $permissions[] = $permission;
                }
                
                // Sync permissions to role
                $role->syncPermissions($permissions);
            }
        }

        $this->command->info('✅ Platform roles created successfully');
    }

    private function createPlatformAccounts(): void
    {
        // Super Admin Account
        $superAdmin = AccountEloquentModel::firstOrCreate(
            ['email' => 'admin@canvastencil.com'],
            [
                'name' => 'Super Administrator',
                'email' => 'admin@canvastencil.com',
                'password' => Hash::make('SuperAdmin2024!'),
                'account_type' => 'platform_owner',
                'status' => 'active',
                'email_verified_at' => now(),
                'settings' => [
                    'timezone' => 'Asia/Jakarta',
                    'language' => 'en',
                    'theme' => 'light'
                ]
            ]
        );

        // Refresh to load database-generated UUID
        $superAdmin->refresh();

        // Assign Super Admin Role
        $superAdminRole = RoleEloquentModel::where('slug', 'super-admin')
            ->whereNull('tenant_id')
            ->first();
        if ($superAdminRole && !$superAdmin->hasRole($superAdminRole)) {
            $superAdmin->assignRole($superAdminRole);
        }

        // Platform Manager Account
        $manager = AccountEloquentModel::firstOrCreate(
            ['email' => 'manager@canvastencil.com'],
            [
                'name' => 'Platform Manager',
                'email' => 'manager@canvastencil.com',
                'password' => Hash::make('Manager2024!'),
                'account_type' => 'platform_owner',
                'status' => 'active',
                'email_verified_at' => now(),
                'settings' => [
                    'timezone' => 'Asia/Jakarta',
                    'language' => 'en',
                    'theme' => 'light'
                ]
            ]
        );

        // Refresh to load database-generated UUID
        $manager->refresh();

        // Assign Platform Manager Role
        $managerRole = RoleEloquentModel::where('slug', 'platform-manager')
            ->whereNull('tenant_id')
            ->first();
        if ($managerRole && !$manager->hasRole($managerRole)) {
            $manager->assignRole($managerRole);
        }

        $this->command->info('✅ Platform accounts created successfully');
        $this->command->info('   Super Admin: admin@canvastencil.com / SuperAdmin2024!');
        $this->command->info('   Platform Manager: manager@canvastencil.com / Manager2024!');
    }

    private function createDemoTenant(): void
    {
        // Create Demo Tenant
        $demoTenant = TenantEloquentModel::firstOrCreate(
            ['slug' => 'etchinx'],
            [
                'name' => 'PT. Custom Etching Xenial',
                'slug' => 'etchinx',
                'domain' => null,
                'settings' => [
                    'business_type' => 'etching',
                    'industry' => 'manufacturing',
                    'setup_completed' => true
                ],
                'status' => 'active',
                'subscription_status' => 'active',
                'trial_ends_at' => now()->addDays(30),
                'subscription_ends_at' => now()->addYear(),
                'created_by' => AccountEloquentModel::where('email', 'admin@canvastencil.com')->first()?->id,
            ]
        );

        // Create Tenant Roles
        $tenantRoles = [
            [
                'name' => 'Admin',
                'slug' => 'admin',
                'guard_name' => 'api',
                'description' => 'Full tenant access with all business permissions',
                'is_system' => true,
                'abilities' => [
                    'tenant:manage',
                    'users:manage',
                    'users.view', 'users.create', 'users.edit', 'users.delete',
                    'customers:manage',
                    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
                    'products:manage',
                    'products.view', 'products.create', 'products.edit', 'products.delete',
                    'orders:manage',
                    'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
                    'vendors:manage',
                    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
                    'analytics:view',
                    'settings:manage',
                    // Pages Engine (CMS) Permissions
                    'pages:content-types:view', 'pages:content-types:create', 'pages:content-types:update', 'pages:content-types:delete',
                    'pages:contents:view', 'pages:contents:create', 'pages:contents:update', 'pages:contents:delete', 'pages:contents:publish', 'pages:contents:schedule',
                    'pages:categories:view', 'pages:categories:create', 'pages:categories:update', 'pages:categories:delete', 'pages:categories:reorder',
                    'pages:comments:view', 'pages:comments:approve', 'pages:comments:reject', 'pages:comments:spam', 'pages:comments:delete',
                    'pages:urls:manage',
                    'pages:revisions:view', 'pages:revisions:restore'
                ]
            ],
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'guard_name' => 'api',
                'description' => 'Business operations management',
                'is_system' => true,
                'abilities' => [
                    'customers:manage',
                    'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
                    'products:manage',
                    'products.view', 'products.create', 'products.edit', 'products.delete',
                    'orders:manage',
                    'orders.view', 'orders.create', 'orders.edit', 'orders.delete',
                    'vendors:manage',
                    'vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete',
                    'analytics:view'
                ]
            ],
            [
                'name' => 'Sales',
                'slug' => 'sales',
                'guard_name' => 'api',
                'description' => 'Customer and order management',
                'is_system' => true,
                'abilities' => [
                    'customers:manage',
                    'customers.view', 'customers.create', 'customers.edit',
                    'orders:manage',
                    'orders.view', 'orders.create', 'orders.edit',
                    'products.view',
                    'analytics:view'
                ]
            ],
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'guard_name' => 'api',
                'description' => 'Read-only access to business data',
                'is_system' => true,
                'abilities' => [
                    'customers:view',
                    'customers.view',
                    'products:view',
                    'products.view',
                    'orders:view',
                    'orders.view',
                    'vendors.view',
                    'analytics:view'
                ]
            ]
        ];

        foreach ($tenantRoles as $roleData) {
            $role = RoleEloquentModel::firstOrCreate(
                ['slug' => $roleData['slug'], 'tenant_id' => $demoTenant->id],
                array_merge($roleData, ['tenant_id' => $demoTenant->id])
            );

            // Create permissions and sync to role
            if (isset($roleData['abilities']) && is_array($roleData['abilities'])) {
                $permissions = [];
                foreach ($roleData['abilities'] as $permissionName) {
                    $permission = \Spatie\Permission\Models\Permission::firstOrCreate(
                        [
                            'name' => $permissionName,
                            'guard_name' => 'api',
                        ]
                    );
                    $permissions[] = $permission;
                }
                
                // Sync permissions to role
                $role->syncPermissions($permissions);
            }
        }

        // Create Demo Tenant Users
        $tenantUsers = [
            [
                'name' => 'John Admin',
                'email' => 'admin@etchinx.com',
                'password' => Hash::make('DemoAdmin2024!'),
                'role' => 'admin',
                'department' => 'Management',
                'status' => 'active'
            ],
            [
                'name' => 'Jane Manager',
                'email' => 'manager@etchinx.com', 
                'password' => Hash::make('DemoManager2024!'),
                'role' => 'manager',
                'department' => 'Operations',
                'status' => 'active'
            ],
            [
                'name' => 'Bob Sales',
                'email' => 'sales@etchinx.com',
                'password' => Hash::make('DemoSales2024!'),
                'role' => 'sales',
                'department' => 'Sales',
                'status' => 'active'
            ]
        ];

        foreach ($tenantUsers as $userData) {
            $role = $userData['role'];
            unset($userData['role']);
            
            $user = UserEloquentModel::firstOrCreate(
                ['email' => $userData['email'], 'tenant_id' => $demoTenant->id],
                array_merge($userData, [
                    'tenant_id' => $demoTenant->id,
                    'email_verified_at' => now(),
                    'location' => [
                        'address' => 'Demo Address',
                        'city' => 'Jakarta',
                        'province' => 'DKI Jakarta',
                        'postal_code' => '12345'
                    ]
                ])
            );

            // Refresh to load database-generated UUID
            $user->refresh();

            // Assign Role
            $userRole = RoleEloquentModel::where('slug', $role)
                ->where('tenant_id', $demoTenant->id)
                ->first();
            if ($userRole && !$user->hasRole($userRole)) {
                $user->assignRole($userRole);
            }
        }

        $this->command->info('✅ Demo tenant created successfully');
        $this->command->info('   Tenant: PT. Custom Etching Xenial (etchinx)');
        $this->command->info('   Admin User: admin@etchinx.com / DemoAdmin2024!');
        $this->command->info('   Manager User: manager@etchinx.com / DemoManager2024!');
        $this->command->info('   Sales User: sales@etchinx.com / DemoSales2024!');
    }
}