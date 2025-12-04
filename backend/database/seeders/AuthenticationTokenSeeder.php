<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Laravel\Sanctum\PersonalAccessToken;

class AuthenticationTokenSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates development/demo authentication tokens for testing
     * and admin panel access. In production, tokens are created via login.
     */
    public function run(): void
    {
        $this->command->info('🔑 Creating authentication tokens for development...');
        
        // Create tokens for Platform Accounts
        $this->createPlatformTokens();
        
        // Create tokens for Tenant Users  
        $this->createTenantTokens();
        
        $this->command->info('✅ Authentication tokens created successfully!');
    }

    private function createPlatformTokens(): void
    {
        $platformAccounts = [
            'admin@canvastencil.com' => 'platform_super_admin',
            'manager@canvastencil.com' => 'platform_manager'
        ];

        foreach ($platformAccounts as $email => $tokenName) {
            $account = AccountEloquentModel::where('email', $email)->first();
            if ($account) {
                // Delete existing tokens for clean state
                $account->tokens()->delete();
                
                // Create new development token
                $token = $account->createToken($tokenName, [
                    'platform:read',
                    'platform:write',
                    'tenants:manage',
                    'analytics:view'
                ]);
                
                $this->command->info("✓ Token created for Platform Account: {$email}");
                $this->command->info("  Token: {$token->plainTextToken}");
            }
        }
    }

    private function createTenantTokens(): void
    {
        // Get all tenants and their users
        $tenants = \DB::table('tenants')->get();
        
        foreach ($tenants as $tenant) {
            $this->command->info("Creating tokens for tenant: {$tenant->name}");
            
            // Get users for this tenant
            $users = UserEloquentModel::where('tenant_id', $tenant->id)->get();
            
            foreach ($users as $user) {
                // Delete existing tokens
                $user->tokens()->delete();
                
                // Determine abilities based on role
                $abilities = $this->getTenantAbilities($user);
                
                // Create token
                $tokenName = "tenant_{$tenant->slug}_{$user->role}_token";
                $token = $user->createToken($tokenName, $abilities);
                
                $this->command->info("✓ Token created for Tenant User: {$user->email}");
                $this->command->info("  Token: {$token->plainTextToken}");
                $this->command->info("  Abilities: " . implode(', ', $abilities));
            }
        }
    }

    private function getTenantAbilities(UserEloquentModel $user): array
    {
        $baseAbilities = [
            'tenant:read',
            'dashboard:view', 
            'profile:update'
        ];

        $this->command->info("  User role: {$user->role}");

        switch (strtolower(trim($user->role))) {
            case 'admin':
                return array_merge($baseAbilities, [
                    'tenant:write',
                    'cms:manage',
                    'cms:create',
                    'cms:update', 
                    'cms:delete',
                    'users:manage',
                    'customers:manage',
                    'products:manage',
                    'orders:manage',
                    'vendors:manage',
                    'analytics:view',
                    'settings:manage'
                ]);
                
            case 'manager':
                return array_merge($baseAbilities, [
                    'cms:update',
                    'cms:create',
                    'customers:manage',
                    'products:manage', 
                    'orders:manage',
                    'vendors:view',
                    'analytics:view'
                ]);
                
            case 'sales':
                return array_merge($baseAbilities, [
                    'customers:manage',
                    'orders:manage',
                    'products:view'
                ]);
                
            default:
                return $baseAbilities;
        }
    }
}