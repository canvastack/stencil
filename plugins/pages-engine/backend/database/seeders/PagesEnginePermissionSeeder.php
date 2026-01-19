<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PagesEnginePermissionSeeder extends Seeder
{
    public function run(): void
    {
        if ($this->command) {
            $this->command->info('===================================');
            $this->command->info('Pages Engine Permission Seeder Started');
            $this->command->info('===================================');
        }

        $this->createPlatformPermissions();
        $this->createTenantPermissions();

        if ($this->command) {
            $this->command->info('===================================');
            $this->command->info('Pages Engine Permission Seeder Completed');
            $this->command->info('===================================');
        }
    }

    private function createPlatformPermissions(): void
    {
        $platformPermissions = [
            [
                'name' => 'platform.content-types.view',
                'description' => 'View platform-level content types',
                'guard_name' => 'api',
            ],
            [
                'name' => 'platform.content-types.create',
                'description' => 'Create platform-level content types',
                'guard_name' => 'api',
            ],
        ];

        foreach ($platformPermissions as $permData) {
            $permission = Permission::firstOrCreate(
                [
                    'name' => $permData['name'],
                    'guard_name' => $permData['guard_name'],
                ],
                [
                    'description' => $permData['description'],
                ]
            );

            if ($this->command) {
                $this->command->info("✓ Platform permission: {$permission->name}");
            }
        }
    }

    private function createTenantPermissions(): void
    {
        $tenantPermissions = [
            ['name' => 'pages:content-types:view', 'description' => 'View content types'],
            ['name' => 'pages:content-types:create', 'description' => 'Create content types'],
            ['name' => 'pages:content-types:update', 'description' => 'Update content types'],
            ['name' => 'pages:content-types:delete', 'description' => 'Delete content types'],

            ['name' => 'pages:contents:view', 'description' => 'View contents'],
            ['name' => 'pages:contents:create', 'description' => 'Create contents'],
            ['name' => 'pages:contents:update', 'description' => 'Update contents'],
            ['name' => 'pages:contents:delete', 'description' => 'Delete contents'],
            ['name' => 'pages:contents:publish', 'description' => 'Publish contents'],
            ['name' => 'pages:contents:schedule', 'description' => 'Schedule content publishing'],

            ['name' => 'pages:categories:view', 'description' => 'View categories'],
            ['name' => 'pages:categories:create', 'description' => 'Create categories'],
            ['name' => 'pages:categories:update', 'description' => 'Update categories'],
            ['name' => 'pages:categories:delete', 'description' => 'Delete categories'],
            ['name' => 'pages:categories:reorder', 'description' => 'Reorder categories'],

            ['name' => 'pages:comments:view', 'description' => 'View comments'],
            ['name' => 'pages:comments:approve', 'description' => 'Approve comments'],
            ['name' => 'pages:comments:reject', 'description' => 'Reject comments'],
            ['name' => 'pages:comments:spam', 'description' => 'Mark comments as spam'],
            ['name' => 'pages:comments:delete', 'description' => 'Delete comments'],

            ['name' => 'pages:urls:manage', 'description' => 'Manage content URLs'],

            ['name' => 'pages:revisions:view', 'description' => 'View content revisions'],
            ['name' => 'pages:revisions:restore', 'description' => 'Restore content revisions'],
        ];

        foreach ($tenantPermissions as $permData) {
            $permission = Permission::firstOrCreate(
                [
                    'name' => $permData['name'],
                    'guard_name' => 'api',
                ],
                [
                    'description' => $permData['description'],
                ]
            );

            if ($this->command) {
                $this->command->info("✓ Tenant permission: {$permission->name}");
            }
        }

        $this->assignPermissionsToDefaultRoles();
    }

    private function assignPermissionsToDefaultRoles(): void
    {
        $adminRoleNames = ['tenant_owner', 'manager', 'admin', 'Administrator'];
        
        foreach ($adminRoleNames as $roleName) {
            $roles = Role::where('name', $roleName)
                ->where('guard_name', 'api')
                ->get();

            if ($roles->isEmpty()) {
                continue;
            }

            $tenantPermissions = Permission::where('guard_name', 'api')
                ->where('name', 'like', 'pages:%')
                ->pluck('name')
                ->toArray();

            foreach ($roles as $role) {
                $role->syncPermissions($tenantPermissions);
                
                if ($this->command) {
                    $tenant_id = $role->tenant_id ?? 'global';
                    $this->command->info("✓ Assigned CMS permissions to role: {$roleName} (tenant: {$tenant_id})");
                }
            }
        }
    }
}
