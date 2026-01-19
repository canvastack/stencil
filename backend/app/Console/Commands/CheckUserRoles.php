<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Support\Facades\DB;

class CheckUserRoles extends Command
{
    protected $signature = 'check:user-roles';
    protected $description = 'Check user roles and permissions in database';

    public function handle()
    {
        $this->info('=== CHECKING USER ROLES ===');
        $this->newLine();

        $users = UserEloquentModel::with(['roles' => function($query) {
            $query->select('roles.id', 'roles.name', 'roles.slug', 'roles.tenant_id');
        }])->get();

        $this->info('Total Users: ' . $users->count());
        $this->newLine();

        foreach ($users as $user) {
            $this->line("User: {$user->email} (UUID: {$user->uuid}, tenant_id: {$user->tenant_id})");
            $rolesCount = $user->roles->count();
            
            if ($rolesCount > 0) {
                $this->info("  ✓ Roles ({$rolesCount}): " . $user->roles->pluck('name')->join(', '));
                foreach ($user->roles as $role) {
                    $this->line("    - {$role->name} (id: {$role->id}, tenant_id: {$role->tenant_id})");
                }
            } else {
                $this->error("  ✗ NO ROLES ASSIGNED");
            }
            $this->newLine();
        }

        $this->newLine();
        $this->info('=== CHECKING ROLES ===');
        $this->newLine();

        $roles = RoleEloquentModel::where('guard_name', 'api')
            ->with(['permissions' => function($query) {
                $query->select('permissions.id', 'permissions.name');
            }])
            ->get();

        $this->info('Total Roles: ' . $roles->count());
        $this->newLine();

        foreach ($roles as $role) {
            $this->line("Role: {$role->name} (id: {$role->id}, tenant_id: " . ($role->tenant_id ?? 'null') . ", guard: {$role->guard_name})");
            $permsCount = $role->permissions->count();
            $this->info("  Permissions: {$permsCount}");
            if ($permsCount > 0) {
                $perms = $role->permissions->pluck('name')->take(5)->join(', ');
                $this->line("    First 5: {$perms}" . ($permsCount > 5 ? '...' : ''));
            }
            $this->newLine();
        }

        $this->newLine();
        $this->info('=== RAW model_has_roles TABLE ===');
        $this->newLine();

        $roleAssignments = DB::table('model_has_roles')->get();
        $this->info('Total assignments: ' . $roleAssignments->count());
        $this->newLine();

        if ($roleAssignments->count() > 0) {
            foreach ($roleAssignments as $assignment) {
                $this->line("role_id: {$assignment->role_id}, model_uuid: {$assignment->model_uuid}, model_type: {$assignment->model_type}, tenant_id: {$assignment->tenant_id}");
            }
        } else {
            $this->error('NO ROLE ASSIGNMENTS FOUND!');
        }

        return Command::SUCCESS;
    }
}
