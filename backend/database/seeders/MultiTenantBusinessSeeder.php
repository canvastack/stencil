<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;

class MultiTenantBusinessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🏢 Creating Additional Business Tenants...');
        
        $tenantTypes = [
            [
                'name' => 'TechStart Indonesia',
                'slug' => 'techstart-id',
                'business_type' => 'electronics_retail',
                'industry' => 'technology',
                'description' => 'Electronics retail and gadget store'
            ],
            [
                'name' => 'Fashion Boutique Cantik',
                'slug' => 'fashion-cantik',
                'business_type' => 'fashion_retail',
                'industry' => 'fashion',
                'description' => 'Premium fashion boutique and accessories'
            ],
            [
                'name' => 'Warung Kopi Nusantara',
                'slug' => 'kopi-nusantara',
                'business_type' => 'food_beverage',
                'industry' => 'hospitality',
                'description' => 'Traditional Indonesian coffee shop chain'
            ],
            [
                'name' => 'AutoService Pro',
                'slug' => 'autoservice-pro',
                'business_type' => 'automotive_service',
                'industry' => 'automotive',
                'description' => 'Professional automotive repair and maintenance'
            ],
            [
                'name' => 'HomeDecor Premium',
                'slug' => 'homedecor-premium',
                'business_type' => 'home_decor',
                'industry' => 'interior_design',
                'description' => 'Premium home decoration and furniture'
            ]
        ];

        $superAdmin = AccountEloquentModel::where('email', 'admin@canvastencil.com')->first();

        foreach ($tenantTypes as $tenantData) {
            $this->createBusinessTenant($tenantData, $superAdmin);
        }

        $this->command->info('✅ Additional business tenants created successfully');
    }

    private function createBusinessTenant(array $tenantData, $creator): void
    {
        // Create Tenant
        $tenant = TenantEloquentModel::firstOrCreate(
            ['slug' => $tenantData['slug']],
            [
                'name' => $tenantData['name'],
                'slug' => $tenantData['slug'],
                'domain' => null,
                'settings' => [
                    'business_type' => $tenantData['business_type'],
                    'industry' => $tenantData['industry'],
                    'description' => $tenantData['description'],
                    'setup_completed' => true
                ],
                'status' => 'active',
                'subscription_status' => 'active',
                'trial_ends_at' => now()->addDays(30),
                'subscription_ends_at' => now()->addYear(),
                'created_by' => $creator?->id,
            ]
        );

        // Create Tenant Roles if they don't exist
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
                    'customers:manage',
                    'products:manage',
                    'orders:manage',
                    'vendors:manage',
                    'analytics:view',
                    'settings:manage'
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
                    'products:manage',
                    'orders:manage',
                    'vendors:manage',
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
                    'orders:manage',
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
                    'products:view',
                    'orders:view',
                    'analytics:view'
                ]
            ]
        ];

        foreach ($tenantRoles as $roleData) {
            RoleEloquentModel::firstOrCreate(
                ['slug' => $roleData['slug'], 'tenant_id' => $tenant->id],
                array_merge($roleData, ['tenant_id' => $tenant->id])
            );
        }

        // Create Tenant Users
        $businessUsers = [
            [
                'name' => 'Admin ' . $tenantData['name'],
                'email' => 'admin@' . $tenantData['slug'] . '.com',
                'password' => Hash::make('Admin2024!'),
                'role' => 'admin',
                'department' => 'Management',
                'status' => 'active'
            ],
            [
                'name' => 'Manager ' . $tenantData['name'],
                'email' => 'manager@' . $tenantData['slug'] . '.com',
                'password' => Hash::make('Manager2024!'),
                'role' => 'manager',
                'department' => 'Operations',
                'status' => 'active'
            ],
            [
                'name' => 'Sales ' . $tenantData['name'],
                'email' => 'sales@' . $tenantData['slug'] . '.com',
                'password' => Hash::make('Sales2024!'),
                'role' => 'sales',
                'department' => 'Sales',
                'status' => 'active'
            ],
            [
                'name' => 'Supervisor ' . $tenantData['name'],
                'email' => 'supervisor@' . $tenantData['slug'] . '.com',
                'password' => Hash::make('Supervisor2024!'),
                'role' => 'manager',
                'department' => 'Operations',
                'status' => 'active'
            ],
            [
                'name' => 'Customer Service ' . $tenantData['name'],
                'email' => 'cs@' . $tenantData['slug'] . '.com',
                'password' => Hash::make('CS2024!'),
                'role' => 'sales',
                'department' => 'Customer Service',
                'status' => 'active'
            ],
            [
                'name' => 'Marketing ' . $tenantData['name'],
                'email' => 'marketing@' . $tenantData['slug'] . '.com',
                'password' => Hash::make('Marketing2024!'),
                'role' => 'viewer',
                'department' => 'Marketing',
                'status' => 'active'
            ]
        ];

        foreach ($businessUsers as $userData) {
            $role = $userData['role'];
            unset($userData['role']);
            
            $user = UserEloquentModel::firstOrCreate(
                ['email' => $userData['email'], 'tenant_id' => $tenant->id],
                array_merge($userData, [
                    'tenant_id' => $tenant->id,
                    'email_verified_at' => now(),
                    'location' => [
                        'address' => 'Jl. ' . ['Sudirman', 'Thamrin', 'Kuningan', 'Senayan'][rand(0, 3)] . ' No. ' . rand(1, 100),
                        'city' => ['Jakarta', 'Surabaya', 'Bandung', 'Medan'][rand(0, 3)],
                        'province' => ['DKI Jakarta', 'Jawa Timur', 'Jawa Barat', 'Sumatera Utara'][rand(0, 3)],
                        'postal_code' => (string) rand(10000, 99999)
                    ]
                ])
            );

            // Refresh to load database-generated UUID
            $user->refresh();

            // Assign Role
            $userRole = RoleEloquentModel::where('slug', $role)
                ->where('tenant_id', $tenant->id)
                ->first();
            if ($userRole && !$user->hasRole($userRole)) {
                $user->assignRole($userRole);
            }
        }

        $this->command->info("   ✓ Tenant: {$tenantData['name']} ({$tenantData['slug']})");
    }
}