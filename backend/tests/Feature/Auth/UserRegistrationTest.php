<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use App\Application\Auth\Services\RegistrationService;
use Illuminate\Support\Facades\Mail;
use App\Mail\Auth\EmailVerificationMail;
use App\Mail\Auth\WelcomeUserMail;

class UserRegistrationTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected RegistrationService $registrationService;
    protected TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->registrationService = app(RegistrationService::class);
        
        // Create test tenant
        $this->tenant = TenantEloquentModel::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.com',
            'status' => 'active',
            'subscription_status' => 'trial',
        ]);
        
        // Create default role for tenant
        RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'User',
            'slug' => 'user',
            'description' => 'Default user role',
        ]);
        
        // Create platform roles
        RoleEloquentModel::create([
            'tenant_id' => null,
            'name' => 'Platform Owner',
            'slug' => 'platform-owner',
            'description' => 'Platform owner role',
        ]);
        
        Mail::fake();
    }

    public function test_can_register_tenant_user(): void
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'phone' => $this->faker->phoneNumber,
            'department' => 'Engineering',
        ];

        $user = $this->registrationService->registerTenantUser($userData, $this->tenant->id);

        $this->assertInstanceOf(UserEloquentModel::class, $user);
        $this->assertEquals($userData['name'], $user->name);
        $this->assertEquals($userData['email'], $user->email);
        $this->assertEquals($this->tenant->id, $user->tenant_id);
        $this->assertEquals('active', $user->status);
        
        // Check password is hashed
        $this->assertNotEquals($userData['password'], $user->password);
        $this->assertTrue(password_verify($userData['password'], $user->password));
        
        // Check user has default role
        $this->assertTrue($user->roles()->where('slug', 'user')->exists());
        
        // Check emails were sent
        Mail::assertQueued(EmailVerificationMail::class);
        Mail::assertQueued(WelcomeUserMail::class);
    }

    public function test_can_register_platform_account(): void
    {
        $accountData = [
            'name' => $this->faker->name,
            'email' => $this->faker->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $account = $this->registrationService->registerPlatformAccount($accountData);

        $this->assertInstanceOf(AccountEloquentModel::class, $account);
        $this->assertEquals($accountData['name'], $account->name);
        $this->assertEquals($accountData['email'], $account->email);
        $this->assertEquals('platform_owner', $account->account_type);
        $this->assertEquals('active', $account->status);
        
        // Check password is hashed
        $this->assertNotEquals($accountData['password'], $account->password);
        
        // Check account has platform role
        $this->assertTrue($account->roles()->where('slug', 'platform-owner')->exists());
        
        // Check emails were sent
        Mail::assertQueued(EmailVerificationMail::class);
        Mail::assertQueued(WelcomeUserMail::class);
    }

    public function test_can_register_tenant_with_admin(): void
    {
        $tenantData = [
            'name' => 'New Test Tenant',
            'slug' => 'new-test-tenant',
            'domain' => 'new-test-tenant.com',
            'database_name' => 'new_test_tenant_db',
            'subscription_tier' => 'basic',
        ];

        $adminData = [
            'name' => $this->faker->name,
            'email' => $this->faker->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $result = $this->registrationService->registerTenantWithAdmin($tenantData, $adminData);

        $this->assertArrayHasKey('tenant', $result);
        $this->assertArrayHasKey('admin_user', $result);
        
        $tenant = $result['tenant'];
        $adminUser = $result['admin_user'];
        
        // Check tenant
        $this->assertInstanceOf(TenantEloquentModel::class, $tenant);
        $this->assertEquals($tenantData['name'], $tenant->name);
        $this->assertEquals($tenantData['slug'], $tenant->slug);
        $this->assertEquals($tenantData['domain'], $tenant->domain);
        
        // Check admin user
        $this->assertInstanceOf(UserEloquentModel::class, $adminUser);
        $this->assertEquals($adminData['name'], $adminUser->name);
        $this->assertEquals($adminData['email'], $adminUser->email);
        $this->assertEquals($tenant->id, $adminUser->tenant_id);
        
        // Check emails were sent
        Mail::assertQueued(EmailVerificationMail::class);
        Mail::assertQueued(WelcomeUserMail::class);
    }

    public function test_cannot_register_duplicate_tenant_user_email(): void
    {
        $email = $this->faker->email;
        
        // Create first user
        UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'First User',
            'email' => $email,
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);

        $userData = [
            'name' => 'Second User',
            'email' => $email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->registrationService->registerTenantUser($userData, $this->tenant->id);
    }

    public function test_cannot_register_duplicate_platform_account_email(): void
    {
        $email = $this->faker->email;
        
        // Create first account
        AccountEloquentModel::create([
            'name' => 'First Account',
            'email' => $email,
            'password' => bcrypt('password'),
            'account_type' => 'platform_owner',
            'status' => 'active',
        ]);

        $accountData = [
            'name' => 'Second Account',
            'email' => $email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->registrationService->registerPlatformAccount($accountData);
    }

    public function test_can_check_email_availability(): void
    {
        $email = $this->faker->email;
        
        // Email should be available initially
        $this->assertTrue($this->registrationService->isEmailAvailable($email, $this->tenant->id));
        $this->assertTrue($this->registrationService->isEmailAvailable($email));
        
        // Create tenant user
        UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => $email,
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        
        // Email should not be available for same tenant
        $this->assertFalse($this->registrationService->isEmailAvailable($email, $this->tenant->id));
        
        // But should still be available for platform
        $this->assertTrue($this->registrationService->isEmailAvailable($email));
    }

    public function test_tenant_user_limit_enforcement(): void
    {
        // Set tenant to trial (5 user limit)
        $this->tenant->update(['subscription_status' => 'trial']);
        
        // Create 5 users (at limit)
        for ($i = 0; $i < 5; $i++) {
            UserEloquentModel::create([
                'tenant_id' => $this->tenant->id,
                'name' => "User $i",
                'email' => "user$i@test.com",
                'password' => bcrypt('password'),
                'status' => 'active',
            ]);
        }
        
        // Try to create 6th user (should fail)
        $userData = [
            'name' => 'Sixth User',
            'email' => 'sixth@test.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];
        
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->registrationService->registerTenantUser($userData, $this->tenant->id);
    }

    public function test_get_registration_stats(): void
    {
        // Create some users
        for ($i = 0; $i < 3; $i++) {
            UserEloquentModel::create([
                'tenant_id' => $this->tenant->id,
                'name' => "User $i",
                'email' => "user$i@test.com",
                'password' => bcrypt('password'),
                'status' => 'active',
            ]);
        }
        
        $stats = $this->registrationService->getRegistrationStats($this->tenant->id);
        
        $this->assertArrayHasKey('current_users', $stats);
        $this->assertArrayHasKey('user_limit', $stats);
        $this->assertArrayHasKey('can_create_users', $stats);
        $this->assertArrayHasKey('subscription_status', $stats);
        
        $this->assertEquals(3, $stats['current_users']);
        $this->assertEquals(5, $stats['user_limit']); // trial tier limit
        $this->assertTrue($stats['can_create_users']);
        $this->assertEquals('trial', $stats['subscription_status']);
    }

    public function test_validation_rules(): void
    {
        // Test tenant user validation
        $invalidData = [
            'name' => '', // required
            'email' => 'invalid-email', // invalid format
            'password' => '123', // too short
            'password_confirmation' => '456', // doesn't match
        ];
        
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->registrationService->validateTenantUserData($invalidData);
    }

    /** API Endpoint Tests */

    public function test_tenant_user_registration_api(): void
    {
        $userData = [
            'name' => $this->faker->name,
            'email' => $this->faker->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'phone' => $this->faker->phoneNumber,
            'department' => 'Engineering',
        ];

        $response = $this->postJson("/api/v1/auth/tenant/{$this->tenant->id}/register", $userData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'User registered successfully. Please check your email to verify your account.',
                ])
                ->assertJsonStructure([
                    'data' => [
                        'user_id',
                        'name',
                        'email',
                        'tenant_id',
                        'status',
                        'email_verified',
                    ]
                ]);

        // Check user was created in database
        $this->assertDatabaseHas('users', [
            'email' => $userData['email'],
            'tenant_id' => $this->tenant->id,
        ]);

        Mail::assertQueued(EmailVerificationMail::class);
        Mail::assertQueued(WelcomeUserMail::class);
    }

    public function test_platform_account_registration_api(): void
    {
        $accountData = [
            'name' => $this->faker->name,
            'email' => $this->faker->email,
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->postJson('/api/v1/auth/platform/register', $accountData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Platform account registered successfully. Please check your email to verify your account.',
                ])
                ->assertJsonStructure([
                    'data' => [
                        'account_id',
                        'name',
                        'email',
                        'account_type',
                        'status',
                        'email_verified',
                    ]
                ]);

        // Check account was created in database
        $this->assertDatabaseHas('accounts', [
            'email' => $accountData['email'],
        ]);

        Mail::assertQueued(EmailVerificationMail::class);
        Mail::assertQueued(WelcomeUserMail::class);
    }

    public function test_tenant_with_admin_registration_api(): void
    {
        $requestData = [
            'tenant' => [
                'name' => 'API Test Tenant',
                'slug' => 'api-test-tenant',
                'domain' => 'api-test-tenant.com',
                'subscription_status' => 'basic',
            ],
            'admin' => [
                'name' => $this->faker->name,
                'email' => $this->faker->email,
                'password' => 'Password123!',
                'password_confirmation' => 'Password123!',
            ]
        ];

        $response = $this->postJson('/api/v1/auth/register-tenant', $requestData);

        $response->assertStatus(201)
                ->assertJson([
                    'success' => true,
                    'message' => 'Tenant and admin user created successfully. Please check your email to verify the admin account.',
                ])
                ->assertJsonStructure([
                    'data' => [
                        'tenant' => [
                            'id', 'name', 'slug', 'domain', 'status', 'subscription_status'
                        ],
                        'admin_user' => [
                            'id', 'name', 'email', 'status', 'email_verified'
                        ]
                    ]
                ]);

        // Check tenant and user were created
        $this->assertDatabaseHas('tenants', [
            'slug' => 'api-test-tenant',
            'domain' => 'api-test-tenant.com',
        ]);
        
        $this->assertDatabaseHas('users', [
            'email' => $requestData['admin']['email'],
        ]);

        Mail::assertQueued(EmailVerificationMail::class);
        Mail::assertQueued(WelcomeUserMail::class);
    }

    public function test_check_email_availability_api(): void
    {
        $email = $this->faker->email;
        
        // Check availability for tenant
        $response = $this->postJson("/api/v1/auth/tenant/{$this->tenant->id}/check-email", [
            'email' => $email,
            'tenant_id' => $this->tenant->id,
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'available' => true,
                ]);
        
        // Check availability for platform
        $response = $this->postJson('/api/v1/auth/platform/check-email', [
            'email' => $email,
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'available' => true,
                ]);
    }

    public function test_get_registration_stats_api(): void
    {
        // Create some users
        for ($i = 0; $i < 2; $i++) {
            UserEloquentModel::create([
                'tenant_id' => $this->tenant->id,
                'name' => "User $i",
                'email' => "user$i@test.com",
                'password' => bcrypt('password'),
                'status' => 'active',
            ]);
        }
        
        $response = $this->getJson("/api/v1/auth/tenant/{$this->tenant->id}/registration-stats");
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                ])
                ->assertJsonStructure([
                    'data' => [
                        'current_users',
                        'user_limit', 
                        'can_create_users',
                        'subscription_status',
                    ]
                ]);
    }

    public function test_api_validation_errors(): void
    {
        // Test missing required fields
        $response = $this->postJson("/api/v1/auth/tenant/{$this->tenant->id}/register", [
            'email' => 'invalid-email',
            // missing name, password
        ]);
        
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['name', 'email', 'password']);
        
        // Test invalid email format
        $response = $this->postJson('/api/v1/auth/platform/register', [
            'name' => 'Test User',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ]);
        
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email', 'password']);
    }
}