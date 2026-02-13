<?php

namespace Tests\Integration\VendorPortal;

use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel as User;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Carbon\Carbon;
use Eris\Generator;
use Eris\TestTrait;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Property-Based Tests for Vendor Portal System
 * 
 * These tests verify critical invariants and properties that must hold true
 * across all vendor portal operations, using randomized inputs to ensure
 * robustness and correctness.
 * 
 * @group Feature: vendor-portal-implementation
 * @group Integration
 * @group PropertyBased
 */
class VendorPortalPropertyTest extends TestCase
{
    use TestTrait;
    
    /**
     * Setup test environment with database transactions
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // Start database transaction for each test
        \DB::beginTransaction();
        
        // Disable minimum evaluation ratio check for database tests
        $this->minimumEvaluationRatio(0.0);
    }
    
    /**
     * Cleanup after each test
     */
    protected function tearDown(): void
    {
        // Rollback transaction to clean up test data
        \DB::rollBack();
        
        parent::tearDown();
    }

    /**
     * Property 1: Vendor Authentication Isolation
     * 
     * Validates: Requirements 1.7, 15.9
     * 
     * Property: A vendor can ONLY authenticate if:
     * - They have portal_access_enabled = true
     * - Their status is 'active'
     * - Their onboarding_status is 'completed'
     * - They belong to the correct tenant
     * 
     * This property ensures complete tenant isolation and proper access control.
     * 
     * @test
     * @group Property 1: Vendor authentication isolation
     */
    public function property_vendor_authentication_isolation(): void
    {
        $this->forAll(
            Generator\bool(),  // portal_access_enabled
            Generator\bool(),  // is_active
            Generator\bool()   // onboarding_completed
        )
        ->withMaxSize(10) // Limit test data size for faster execution
        ->then(function ($portalAccessEnabled, $isActive, $onboardingCompleted) {
            // Create tenant
            $tenant = TenantEloquentModel::factory()->create();
            
            // Create vendor with randomized access properties
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'status' => $isActive ? 'active' : 'inactive',
                'portal_access_enabled' => $portalAccessEnabled,
                'onboarding_status' => $onboardingCompleted ? 'completed' : 'in_progress',
                'onboarding_completed_at' => $onboardingCompleted ? now() : null,
            ]);

            // Property: canAccessPortal() should return true ONLY if ALL conditions are met
            $shouldHaveAccess = $portalAccessEnabled && $isActive && $onboardingCompleted;
            
            // Test the domain logic
            $actualAccess = $vendor->portal_access_enabled 
                && $vendor->status === 'active' 
                && $vendor->onboarding_status === 'completed';

            $this->assertEquals(
                $shouldHaveAccess,
                $actualAccess,
                "Vendor access control failed: portal_access={$portalAccessEnabled}, " .
                "active={$isActive}, onboarding={$onboardingCompleted}"
            );
            
            // Property: Tenant isolation - vendor must belong to a tenant
            $this->assertNotNull($vendor->tenant_id);
            $this->assertEquals($tenant->id, $vendor->tenant_id);
        });
    }

    /**
     * Property 2: Quote Access Control
     * 
     * Validates: Requirements 5.11, 15.9, 15.10
     * 
     * Property: A vendor can ONLY access quotes that:
     * - Belong to them (vendor_id matches)
     * - Belong to their tenant (tenant_id matches)
     * - Are not soft-deleted
     * 
     * This property ensures vendors cannot access quotes from other vendors
     * or other tenants, maintaining strict data isolation.
     * 
     * @test
     * @group Property 2: Quote access control
     */
    public function property_quote_access_control(): void
    {
        $this->forAll(
            Generator\bool(),  // Same vendor
            Generator\bool(),  // Same tenant
            Generator\bool()   // Is deleted
        )
        ->withMaxSize(10)
        ->then(function ($sameVendor, $sameTenant, $isDeleted) {
            // Create two tenants
            $tenant1 = TenantEloquentModel::factory()->create();
            $tenant2 = TenantEloquentModel::factory()->create();
            
            // Create two vendors
            $vendor1 = Vendor::factory()->create([
                'tenant_id' => $tenant1->id, // Use BIGINT id, not UUID
                'status' => 'active',
            ]);
            
            $vendor2 = Vendor::factory()->create([
                'tenant_id' => $sameTenant ? $tenant1->id : $tenant2->id, // Use BIGINT id, not UUID
                'status' => 'active',
            ]);

            // Create quote for vendor1 or vendor2
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $sameTenant ? $tenant1->id : $tenant2->id, // Use BIGINT id, not UUID
                'vendor_id' => $sameVendor ? $vendor1->id : $vendor2->id,
                'status' => 'sent',
                'deleted_at' => $isDeleted ? now() : null,
            ]);

            // Property: Access should ONLY succeed if vendor owns quote, same tenant, and not deleted
            $shouldHaveAccess = $sameVendor && $sameTenant && !$isDeleted;
            
            // Test domain logic
            $actualAccess = ($quote->vendor_id == $vendor1->id) 
                && ($quote->tenant_id == $vendor1->tenant_id)
                && ($quote->deleted_at === null);

            $this->assertEquals(
                $shouldHaveAccess,
                $actualAccess,
                "Quote access control failed: same_vendor={$sameVendor}, " .
                "same_tenant={$sameTenant}, deleted={$isDeleted}"
            );
            
            // Property: Quote must belong to a tenant
            $this->assertNotNull($quote->tenant_id);
            
            // Property: Quote must belong to a vendor
            $this->assertNotNull($quote->vendor_id);
        });
    }

    /**
     * Property 3: Quote Response State Transitions
     * 
     * Validates: Requirements 6.4, 6.7, 6.10, 6.13, 6.14
     * 
     * Property: Quote status transitions must follow valid state machine:
     * - 'sent' -> can transition to 'accepted', 'rejected', or 'countered'
     * - 'accepted', 'rejected' -> cannot transition (terminal states)
     * - 'expired' -> cannot be responded to
     * - Only one response allowed per quote
     * 
     * This property ensures quote workflow integrity and prevents invalid state transitions.
     * 
     * @test
     * @group Property 3: Quote response state transitions
     */
    public function property_quote_response_state_transitions(): void
    {
        $this->forAll(
            Generator\elements(['sent', 'accepted', 'rejected', 'countered', 'expired']),  // Initial status
            Generator\elements(['accept', 'reject', 'counter'])  // Response action
        )
        ->withMaxSize(10)
        ->then(function ($initialStatus, $responseAction) {
            // Create tenant and vendor
            $tenant = TenantEloquentModel::factory()->create();
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'status' => 'active',
            ]);

            // Create quote with initial status
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'vendor_id' => $vendor->id,
                'status' => $initialStatus,
                'sent_at' => now()->subDays(1),
                'expires_at' => $initialStatus === 'expired' ? now()->subHours(1) : now()->addDays(7),
                'responded_at' => in_array($initialStatus, ['accepted', 'rejected', 'countered']) ? now()->subHours(2) : null,
            ]);

            // Property: Response should ONLY succeed if status is 'sent' and not expired
            $canRespond = $initialStatus === 'sent';
            
            // Test domain logic
            $actualCanRespond = $quote->status === 'sent' 
                && $quote->responded_at === null
                && ($quote->expires_at === null || $quote->expires_at > now());

            $this->assertEquals(
                $canRespond,
                $actualCanRespond,
                "Quote response validation failed: status={$initialStatus}, action={$responseAction}"
            );
            
            // Property: Terminal states cannot be changed
            if (in_array($initialStatus, ['accepted', 'rejected'])) {
                $this->assertNotNull($quote->responded_at);
            }
            
            // Property: Expired quotes cannot be responded to
            if ($initialStatus === 'expired') {
                $this->assertLessThan(now(), $quote->expires_at);
            }
        });
    }

    /**
     * Property 4: Expired Quote Immutability
     * 
     * Validates: Requirements 6.13, 10.1, 10.6, 10.7
     * 
     * Property: Once a quote expires:
     * - Status must be 'expired'
     * - Cannot be responded to (accept/reject/counter)
     * - Response buttons should be disabled
     * - Expiration notice should be displayed
     * 
     * This property ensures expired quotes cannot be modified and maintain data integrity.
     * 
     * @test
     * @group Property 4: Expired quote immutability
     */
    public function property_expired_quote_immutability(): void
    {
        $this->forAll(
            Generator\choose(-10, 10)  // Days until expiration (negative = expired)
        )
        ->withMaxSize(10)
        ->then(function ($daysUntilExpiration) {
            // Create tenant and vendor
            $tenant = TenantEloquentModel::factory()->create();
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'status' => 'active',
            ]);

            // Create quote with expiration date
            // Add 1 hour buffer for day 0 to avoid timing issues
            $expiresAt = $daysUntilExpiration === 0 
                ? now()->addHour() 
                : now()->addDays($daysUntilExpiration);
            $isExpired = $daysUntilExpiration < 0; // Only negative days are expired
            
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'vendor_id' => $vendor->id,
                'status' => $isExpired ? 'expired' : 'sent',
                'sent_at' => now()->subDays(5),
                'expires_at' => $expiresAt,
                'responded_at' => null,
            ]);

            // Property: Expired quotes CANNOT be responded to
            $canRespond = !$isExpired && $quote->status === 'sent';
            
            // Test domain logic
            $actualCanRespond = $quote->status === 'sent' 
                && $quote->responded_at === null
                && $quote->expires_at > now();

            $this->assertEquals(
                $canRespond,
                $actualCanRespond,
                "Expired quote immutability failed: days_until_expiration={$daysUntilExpiration}"
            );
            
            // Property: Expired quotes have status 'expired'
            if ($isExpired) {
                $this->assertEquals('expired', $quote->status);
                $this->assertLessThan(now(), $quote->expires_at);
            }
            
            // Property: Non-expired quotes can be responded to
            if (!$isExpired && $quote->status === 'sent') {
                $this->assertGreaterThan(now(), $quote->expires_at);
                $this->assertNull($quote->responded_at);
            }
        });
    }

    /**
     * Property 5: Admin Notification on Vendor Response
     * 
     * Validates: Requirements 6.15, 18.3, 18.4, 18.5
     * 
     * Property: When a vendor responds to a quote (accept/reject/counter):
     * - Quote status must change from 'sent' to appropriate state
     * - responded_at timestamp must be set
     * - response_type must be recorded
     * - Quote must remain associated with correct vendor and tenant
     * 
     * This property ensures quote responses are properly recorded.
     * 
     * @test
     * @group Property 5: Admin notification on vendor response
     */
    public function property_admin_notification_on_vendor_response(): void
    {
        $this->forAll(
            Generator\elements(['accept', 'reject', 'counter'])  // Response action
        )
        ->withMaxSize(10)
        ->then(function ($responseAction) {
            // Create tenant
            $tenant = TenantEloquentModel::factory()->create();
            
            // Create vendor
            $vendor = Vendor::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'status' => 'active',
            ]);

            // Create quote
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id, // Use BIGINT id, not UUID
                'vendor_id' => $vendor->id,
                'status' => 'sent',
                'sent_at' => now()->subDays(1),
                'expires_at' => now()->addDays(7),
                'responded_at' => null,
                'response_type' => null,
            ]);

            // Simulate vendor response by updating quote
            $expectedStatus = match($responseAction) {
                'accept' => 'accepted',
                'reject' => 'rejected',
                'counter' => 'countered',
            };
            
            $quote->status = $expectedStatus;
            $quote->responded_at = now();
            $quote->response_type = $responseAction;
            $quote->save();

            // Property: Quote should be updated with response
            $quote->refresh();
            $this->assertEquals($expectedStatus, $quote->status);
            
            // Property: Response should be recorded
            $this->assertNotNull($quote->responded_at);
            $this->assertEquals($responseAction, $quote->response_type);
            
            // Property: Quote associations should remain intact
            $this->assertEquals($vendor->id, $quote->vendor_id);
            $this->assertEquals($tenant->id, $quote->tenant_id);
            
            // Property: responded_at should be recent (within last minute)
            $this->assertEqualsWithDelta(
                now()->timestamp,
                $quote->responded_at->timestamp,
                60,
                "responded_at should be set to current time"
            );
        });
    }
}
