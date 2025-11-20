<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Application\Auth\Services\EmailVerificationService;
use Illuminate\Support\Facades\Mail;
use App\Mail\Auth\EmailVerificationMail;

class SimpleEmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_simple_mail_sending(): void
    {
        Mail::fake();
        
        // Create test tenant
        $tenant = TenantEloquentModel::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.com',
            'database_name' => 'test_tenant_db',
            'status' => 'active',
        ]);
        
        // Create test tenant user
        $user = UserEloquentModel::create([
            'tenant_id' => $tenant->id,
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        
        // Test direct mail sending
        $mail = new EmailVerificationMail($user, 'test-token', $tenant->id);
        Mail::to($user->email)->queue($mail);
        
        // Assert mail was queued
        Mail::assertQueued(EmailVerificationMail::class, function ($mail) use ($user) {
            return $mail->user->email === $user->email;
        });
    }

    public function test_service_sends_email(): void
    {
        Mail::fake();
        
        // Create test tenant
        $tenant = TenantEloquentModel::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.com',  
            'database_name' => 'test_tenant_db',
            'status' => 'active',
        ]);
        
        // Create test tenant user
        $user = UserEloquentModel::create([
            'tenant_id' => $tenant->id,
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        
        $service = app(EmailVerificationService::class);
        
        $result = $service->sendVerification($user);
        
        $this->assertTrue($result);
        
        Mail::assertQueued(EmailVerificationMail::class, function ($mail) use ($user) {
            return $mail->user->email === $user->email;
        });
    }
}