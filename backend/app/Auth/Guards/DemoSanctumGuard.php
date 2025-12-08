<?php

namespace App\Auth\Guards;

use Laravel\Sanctum\Guard;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Http\Request;

class DemoSanctumGuard extends Guard
{
    protected function getTokenFromRequest(Request $request)
    {
        // First try to get token normally
        $token = parent::getTokenFromRequest($request);
        
        if ($token && str_starts_with($token, 'demo_token_')) {
            // This is a demo token - create a demo user
            if (app()->environment(['local', 'development', 'testing'])) {
                return $this->createDemoTokenUser($token);
            }
        }
        
        return $token;
    }
    
    protected function createDemoTokenUser(string $token)
    {
        // Get or create demo tenant
        $demoTenant = TenantEloquentModel::where('slug', 'demo-tenant')->first();
        if (!$demoTenant) {
            $demoTenant = TenantEloquentModel::create([
                'uuid' => '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                'name' => 'Demo Tenant',
                'slug' => 'demo-tenant',
                'domain' => 'demo.canvastencil.com',
                'status' => 'active',
                'subscription_status' => 'trial',
                'subscription_plan' => 'starter',
                'trial_ends_at' => now()->addDays(30),
                'settings' => json_encode([
                    'timezone' => 'Asia/Jakarta',
                    'currency' => 'IDR',
                    'language' => 'id'
                ])
            ]);
        }

        // Get or create demo user
        $demoUser = UserEloquentModel::where('email', 'demo@canvastencil.com')
            ->where('tenant_id', $demoTenant->id)
            ->first();

        if (!$demoUser) {
            $demoUser = UserEloquentModel::create([
                'uuid' => \Illuminate\Support\Str::uuid(),
                'name' => 'Demo User',
                'email' => 'demo@canvastencil.com',
                'email_verified_at' => now(),
                'password' => bcrypt('demo-password'),
                'tenant_id' => $demoTenant->id,
                'role' => 'admin',
                'status' => 'active'
            ]);
        }

        // Set the tenant relationship
        $demoUser->setRelation('tenant', $demoTenant);
        
        // Create a fake personal access token for this demo user
        $accessToken = new \Laravel\Sanctum\PersonalAccessToken();
        $accessToken->tokenable_id = $demoUser->id;
        $accessToken->tokenable_type = get_class($demoUser);
        $accessToken->name = 'demo-token';
        $accessToken->token = hash('sha256', $token);
        $accessToken->abilities = ['*'];
        $accessToken->tokenable = $demoUser;
        
        return $accessToken;
    }
}