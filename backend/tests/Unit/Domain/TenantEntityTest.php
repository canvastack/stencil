<?php

namespace Tests\Unit\Domain;

use Tests\TestCase;
use App\Domain\Tenant\Entities\Tenant;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\ValueObjects\TenantName;
use App\Domain\Tenant\ValueObjects\TenantSlug;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Enums\SubscriptionStatus;
use DateTime;

class TenantEntityTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_data(): void
    {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $name = new TenantName('Test Company');
        $slug = new TenantSlug('test-company');

        $tenant = new Tenant($id, $name, $slug);

        $this->assertEquals($id, $tenant->getId());
        $this->assertEquals($name, $tenant->getName());
        $this->assertEquals($slug, $tenant->getSlug());
        $this->assertEquals(TenantStatus::TRIAL, $tenant->getStatus());
        $this->assertEquals(SubscriptionStatus::ACTIVE, $tenant->getSubscriptionStatus());
    }

    /** @test */
    public function it_can_be_activated(): void
    {
        $tenant = $this->createTenant();
        
        $tenant->activate();
        
        $this->assertEquals(TenantStatus::ACTIVE, $tenant->getStatus());
        $this->assertTrue($tenant->isActive());
    }

    /** @test */
    public function it_can_be_suspended(): void
    {
        $tenant = $this->createTenant();
        $tenant->activate();
        
        $tenant->suspend();
        
        $this->assertEquals(TenantStatus::SUSPENDED, $tenant->getStatus());
        $this->assertTrue($tenant->isSuspended());
        $this->assertFalse($tenant->isActive());
    }

    /** @test */
    public function it_can_start_trial(): void
    {
        $tenant = $this->createTenant();
        $trialEndsAt = new DateTime('+14 days');
        
        $tenant->startTrial($trialEndsAt);
        
        $this->assertEquals(TenantStatus::TRIAL, $tenant->getStatus());
        $this->assertEquals(SubscriptionStatus::ACTIVE, $tenant->getSubscriptionStatus());
        $this->assertEquals($trialEndsAt, $tenant->getTrialEndsAt());
        $this->assertTrue($tenant->isOnTrial());
    }

    /** @test */
    public function it_can_end_trial(): void
    {
        $tenant = $this->createTenant();
        $tenant->startTrial(new DateTime('+14 days'));
        
        $tenant->endTrial();
        
        $this->assertEquals(TenantStatus::ACTIVE, $tenant->getStatus());
        $this->assertEquals(SubscriptionStatus::ACTIVE, $tenant->getSubscriptionStatus());
        $this->assertFalse($tenant->isOnTrial());
    }

    /** @test */
    public function it_can_update_subscription(): void
    {
        $tenant = $this->createTenant();
        $subscriptionEndsAt = new DateTime('+1 year');
        
        $tenant->updateSubscription(SubscriptionStatus::ACTIVE, $subscriptionEndsAt);
        
        $this->assertEquals(SubscriptionStatus::ACTIVE, $tenant->getSubscriptionStatus());
        $this->assertEquals($subscriptionEndsAt, $tenant->getSubscriptionEndsAt());
    }

    /** @test */
    public function it_can_expire_subscription(): void
    {
        $tenant = $this->createTenant();
        
        $tenant->expireSubscription();
        
        $this->assertEquals(SubscriptionStatus::EXPIRED, $tenant->getSubscriptionStatus());
        $this->assertFalse($tenant->hasActiveSubscription());
    }

    /** @test */
    public function it_can_set_custom_domain(): void
    {
        $tenant = $this->createTenant();
        $domain = 'example.com';
        
        $tenant->setCustomDomain($domain);
        
        $this->assertEquals($domain, $tenant->getCustomDomain());
        $this->assertTrue($tenant->hasCustomDomain());
    }

    /** @test */
    public function it_can_remove_custom_domain(): void
    {
        $tenant = $this->createTenant();
        $tenant->setCustomDomain('example.com');
        
        $tenant->removeCustomDomain();
        
        $this->assertNull($tenant->getCustomDomain());
        $this->assertFalse($tenant->hasCustomDomain());
    }

    /** @test */
    public function it_generates_correct_public_url_with_custom_domain(): void
    {
        $tenant = $this->createTenant();
        $tenant->setCustomDomain('example.com');
        
        $url = $tenant->getPublicUrl();
        
        $this->assertEquals('https://example.com/', $url);
    }

    /** @test */
    public function it_generates_correct_public_url_with_slug(): void
    {
        $tenant = $this->createTenant();
        
        $url = $tenant->getPublicUrl();
        
        $this->assertEquals('https://canvastencil.com/test-company/', $url);
    }

    /** @test */
    public function it_generates_correct_admin_url(): void
    {
        $tenant = $this->createTenant();
        
        $url = $tenant->getAdminUrl();
        
        $this->assertEquals('https://canvastencil.com/test-company/admin/', $url);
    }

    /** @test */
    public function it_can_check_if_subscription_is_active(): void
    {
        $tenant = $this->createTenant();
        
        // Active subscription
        $tenant->updateSubscription(SubscriptionStatus::ACTIVE, new DateTime('+1 year'));
        $this->assertTrue($tenant->hasActiveSubscription());
        
        // Expired subscription
        $tenant->expireSubscription();
        $this->assertFalse($tenant->hasActiveSubscription());
    }

    /** @test */
    public function it_validates_trial_status_correctly(): void
    {
        $tenant = $this->createTenant();
        
        // Start trial
        $tenant->startTrial(new DateTime('+14 days'));
        $this->assertTrue($tenant->isOnTrial());
        
        // End trial
        $tenant->endTrial();
        $this->assertFalse($tenant->isOnTrial());
        
        // Expired trial
        $tenant->startTrial(new DateTime('-1 day')); // Past date
        $this->assertFalse($tenant->isOnTrial()); // Should be false for expired trial
    }

    /** @test */
    public function it_can_convert_to_array(): void
    {
        $tenant = $this->createTenant();
        $tenant->setCustomDomain('example.com');
        
        $array = $tenant->toArray();
        
        $this->assertIsArray($array);
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('name', $array);
        $this->assertArrayHasKey('slug', $array);
        $this->assertArrayHasKey('status', $array);
        $this->assertArrayHasKey('subscription_status', $array);
        $this->assertArrayHasKey('custom_domain', $array);
        $this->assertEquals('Test Company', $array['name']);
        $this->assertEquals('test-company', $array['slug']);
        $this->assertEquals('example.com', $array['custom_domain']);
    }

    private function createTenant(): Tenant
    {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $name = new TenantName('Test Company');
        $slug = new TenantSlug('test-company');

        return new Tenant($id, $name, $slug);
    }
}