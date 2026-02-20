<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class CustomerRegistrationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a test tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test.local',
        ]);
    }

    /** @test */
    public function it_can_register_new_customer()
    {
        $response = $this->postJson('/api/v1/public/customers/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '081234567890',
            'password' => 'Password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'customer' => [
                    'uuid',
                    'name',
                    'email',
                    'phone',
                    'account_type',
                ],
            ]);

        $this->assertDatabaseHas('customers', [
            'email' => 'john@example.com',
            'account_type' => 'registered',
        ]);
    }

    /** @test */
    public function it_can_login_registered_customer()
    {
        // Create a registered customer
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'password_hash' => \Hash::make('Password123'),
            'account_type' => 'registered',
        ]);

        $response = $this->postJson('/api/v1/public/customers/login', [
            'email' => 'john@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'customer',
                'token',
            ]);
    }

    /** @test */
    public function it_can_upgrade_guest_to_registered()
    {
        // Create a guest customer
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'guest@example.com',
            'account_type' => 'guest',
        ]);

        $response = $this->postJson('/api/v1/public/customers/upgrade-guest', [
            'email' => 'guest@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Account upgraded successfully. Please check your email for verification.',
            ]);

        $customer->refresh();
        $this->assertEquals('registered', $customer->account_type);
        $this->assertNotNull($customer->password_hash);
    }

    /** @test */
    public function it_validates_registration_data()
    {
        $response = $this->postJson('/api/v1/public/customers/register', [
            'name' => 'Jo', // Too short
            'email' => 'invalid-email',
            'phone' => '123', // Too short
            'password' => 'weak', // Too weak
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'phone', 'password']);
    }

    /** @test */
    public function it_prevents_duplicate_email_registration()
    {
        Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson('/api/v1/public/customers/register', [
            'name' => 'John Doe',
            'email' => 'existing@example.com',
            'phone' => '081234567890',
            'password' => 'Password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }
}
