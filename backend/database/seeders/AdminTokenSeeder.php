<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;

class AdminTokenSeeder extends Seeder
{
    /**
     * Create admin tokens for specific known admin users
     */
    public function run(): void
    {
        $this->command->info('🔑 Creating admin tokens for demo/testing...');
        
        // Specific admin users we know exist with proper roles
        $adminUsers = [
            [
                'email' => 'admin@demo-etching.com',
                'name' => 'Demo Admin',
                'abilities' => [
                    'tenant:read', 'tenant:write', 'dashboard:view', 'profile:update',
                    'cms:manage', 'cms:create', 'cms:update', 'cms:delete',
                    'users:manage', 'customers:manage', 'products:manage', 
                    'orders:manage', 'vendors:manage', 'analytics:view', 'settings:manage'
                ]
            ]
        ];
        
        foreach ($adminUsers as $adminData) {
            $user = UserEloquentModel::where('email', $adminData['email'])->first();
            
            if ($user) {
                // Delete existing tokens
                $user->tokens()->delete();
                
                // Create admin token
                $token = $user->createToken('admin_demo_token', $adminData['abilities']);
                
                $this->command->info("✅ Admin token created for: {$adminData['email']}");
                $this->command->info("   Token: {$token->plainTextToken}");
                $this->command->info("   Abilities: " . implode(', ', $adminData['abilities']));
                
                // Store token for frontend use (development only)
                $this->command->info("   💡 Use this token in frontend localStorage for testing:");
                $this->command->info("   localStorage.setItem('auth_token', '{$token->plainTextToken}')");
            } else {
                $this->command->error("❌ User not found: {$adminData['email']}");
            }
        }
        
        $this->command->info('');
        $this->command->info('🔧 To use the token in admin panel:');
        $this->command->info('1. Open browser developer tools');
        $this->command->info('2. Go to Console tab');
        $this->command->info('3. Execute: localStorage.setItem("auth_token", "PASTE_TOKEN_HERE")');
        $this->command->info('4. Refresh the admin panel page');
    }
}