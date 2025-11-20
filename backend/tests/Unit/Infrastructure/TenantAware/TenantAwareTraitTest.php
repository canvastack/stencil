<?php

namespace Tests\Unit\Infrastructure\TenantAware;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class TenantAwareTraitTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test tenant
        $this->tenant = TenantEloquentModel::factory()->create();
        
        // Create test customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id
        ]);
        
        // Set current tenant context
        app()->instance('current_tenant', $this->tenant);
    }

    /** @test */
    public function customer_model_implements_tenant_aware_interface(): void
    {
        $this->assertInstanceOf(TenantAwareModel::class, $this->customer);
    }

    /** @test */
    public function it_returns_correct_tenant_id(): void
    {
        $this->assertEquals($this->tenant->id, $this->customer->getTenantId());
    }

    /** @test */
    public function it_has_tenant_relationship(): void
    {
        $relationship = $this->customer->tenant();
        
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Relations\BelongsTo::class, $relationship);
        $this->assertEquals($this->tenant->id, $this->customer->tenant->id);
    }

    /** @test */
    public function it_scopes_to_current_tenant(): void
    {
        // Create customer for different tenant
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        
        // Query should only return current tenant's customer
        $scoped = Customer::tenantScoped()->get();
        
        $this->assertCount(1, $scoped);
        $this->assertEquals($this->customer->id, $scoped->first()->id);
    }

    /** @test */
    public function it_scopes_to_specific_tenant(): void
    {
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        
        // Query specific tenant
        $scoped = Customer::forTenant($otherTenant)->get();
        
        $this->assertCount(1, $scoped);
        $this->assertEquals($otherCustomer->id, $scoped->first()->id);
    }

    /** @test */
    public function it_checks_belongs_to_current_tenant(): void
    {
        $this->assertTrue($this->customer->belongsToCurrentTenant());
        
        // Create customer for different tenant  
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        
        $this->assertFalse($otherCustomer->belongsToCurrentTenant());
    }

    /** @test */
    public function it_checks_belongs_to_specific_tenant(): void
    {
        $this->assertTrue($this->customer->belongsToTenant($this->tenant));
        $this->assertTrue($this->customer->belongsToTenant($this->tenant->id));
        
        $otherTenant = TenantEloquentModel::factory()->create();
        $this->assertFalse($this->customer->belongsToTenant($otherTenant));
    }

    /** @test */
    public function it_auto_assigns_tenant_id_on_creation(): void
    {
        $newCustomer = Customer::create([
            'name' => 'Test Customer',
            'email' => 'test@example.com'
        ]);
        
        $this->assertEquals($this->tenant->id, $newCustomer->tenant_id);
    }

    /** @test */
    public function global_scope_filters_by_tenant_automatically(): void
    {
        // Create customers for different tenants
        $otherTenant = TenantEloquentModel::factory()->create();
        Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        
        // Default query should only return current tenant's data
        $customers = Customer::all();
        
        $this->assertCount(1, $customers);
        $this->assertEquals($this->customer->id, $customers->first()->id);
    }

    /** @test */
    public function can_query_across_tenants_with_scope_removal(): void
    {
        $otherTenant = TenantEloquentModel::factory()->create();
        Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        
        // Query without tenant scope
        $allCustomers = Customer::withoutGlobalScope('tenant')->get();
        
        $this->assertCount(2, $allCustomers);
    }

    /** @test */
    public function uuid_field_is_auto_generated(): void
    {
        $this->assertNotNull($this->customer->uuid);
        $this->assertIsString($this->customer->uuid);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $this->customer->uuid);
    }
}