<?php

namespace App\Http\Middleware;

use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HandleDemoTokens
{
    public function handle(Request $request, Closure $next)
    {
        // Only handle demo tokens in development/local environment
        if (!app()->environment(['local', 'development', 'testing'])) {
            \Log::info('HandleDemoTokens: Not in development environment');
            return $next($request);
        }

        $authHeader = $request->header('Authorization');
        \Log::info('HandleDemoTokens: Auth header', ['header' => $authHeader]);
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            \Log::info('HandleDemoTokens: No Bearer token found');
            return $next($request);
        }

        $token = substr($authHeader, 7); // Remove 'Bearer ' prefix
        \Log::info('HandleDemoTokens: Extracted token', ['token' => $token]);
        
        if (!str_starts_with($token, 'demo_token_')) {
            \Log::info('HandleDemoTokens: Not a demo token');
            return $next($request);
        }

        \Log::info('HandleDemoTokens: Processing demo token');
        
        // For debugging - temporarily output to see if middleware is running
        if ($request->path() === 'api/v1/tenant/refunds') {
            file_put_contents(__DIR__ . '/../../demo-debug.txt', 'Demo middleware triggered at ' . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
        }

        try {
            // Create a demo user for the demo token
            $demoUser = $this->createDemoUser();
            
            // Set the authenticated user for this request
            Auth::guard('sanctum')->setUser($demoUser);
            
            // Also set it for the tenant guard
            Auth::guard('tenant')->setUser($demoUser);
            
            \Log::info('HandleDemoTokens: Demo user authenticated', ['user' => $demoUser->toArray()]);
            
        } catch (\Exception $e) {
            \Log::error('HandleDemoTokens: Error creating demo user', ['error' => $e->getMessage()]);
        }
        
        return $next($request);
    }

    private function createDemoUser(): UserEloquentModel
    {
        // Get or create the demo tenant that was already created
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

        // Get or create the demo user
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
        
        return $demoUser;
    }
}