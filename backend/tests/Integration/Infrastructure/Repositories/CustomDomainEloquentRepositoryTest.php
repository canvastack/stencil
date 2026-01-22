<?php

namespace Tests\Integration\Infrastructure\Repositories;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Repositories\CustomDomainEloquentRepository;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Domain\Tenant\Entities\CustomDomain;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use App\Domain\Tenant\Enums\VerificationMethod;
use App\Domain\Tenant\Enums\DnsProvider;
use App\Domain\Tenant\ValueObjects\DomainName;
use Carbon\Carbon;

class CustomDomainEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private CustomDomainEloquentRepository $repository;
    private TenantEloquentModel $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->user = User::factory()->create();
        $this->repository = new CustomDomainEloquentRepository(
            new CustomDomainEloquentModel()
        );
    }

    public function test_saves_new_custom_domain(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $createdBy = Uuid::fromString($this->user->uuid);
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName,
            createdBy: $createdBy,
            verificationMethod: VerificationMethod::DNS_TXT
        );

        $savedDomain = $this->repository->save($domain);

        $this->assertNotNull($savedDomain->getId());
        $this->assertEquals('acme-corp.com', $savedDomain->getDomainName()->getValue());
        $this->assertEquals(CustomDomainStatus::PENDING_VERIFICATION, $savedDomain->getStatus());
        $this->assertFalse($savedDomain->isVerified());
        $this->assertNotNull($savedDomain->getVerificationToken());
        $this->assertDatabaseHas('custom_domains', [
            'uuid' => $savedDomain->getId()->getValue(),
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'acme-corp.com',
            'status' => 'pending_verification',
            'is_verified' => false
        ]);
    }

    public function test_updates_existing_custom_domain(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domainName = new DomainName('update-test.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $savedDomain = $this->repository->save($domain);
        $domainId = $savedDomain->getId();

        $savedDomain->markAsVerified();
        $updatedDomain = $this->repository->save($savedDomain);

        $this->assertEquals($domainId->getValue(), $updatedDomain->getId()->getValue());
        $this->assertTrue($updatedDomain->isVerified());
        $this->assertEquals(CustomDomainStatus::VERIFIED, $updatedDomain->getStatus());
        $this->assertDatabaseHas('custom_domains', [
            'uuid' => $domainId->getValue(),
            'is_verified' => true,
            'status' => 'verified'
        ]);
    }

    public function test_finds_domain_by_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('find-by-id.com')
        );

        $savedDomain = $this->repository->save($domain);
        $foundDomain = $this->repository->findById($savedDomain->getId());

        $this->assertNotNull($foundDomain);
        $this->assertEquals($savedDomain->getId()->getValue(), $foundDomain->getId()->getValue());
        $this->assertEquals('find-by-id.com', $foundDomain->getDomainName()->getValue());
    }

    public function test_returns_null_when_domain_not_found(): void
    {
        $nonExistentId = Uuid::generate();
        $foundDomain = $this->repository->findById($nonExistentId);

        $this->assertNull($foundDomain);
    }

    public function test_finds_domain_by_domain_name(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domainName = new DomainName('findme.com');
        
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->repository->save($domain);

        $foundDomain = $this->repository->findByDomain($domainName);

        $this->assertNotNull($foundDomain);
        $this->assertEquals('findme.com', $foundDomain->getDomainName()->getValue());
    }

    public function test_finds_domains_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $domain1 = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('domain1.com')
        );
        
        $domain2 = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('domain2.com')
        );

        $this->repository->save($domain1);
        $this->repository->save($domain2);

        $domains = $this->repository->findByTenantId($tenantId);

        $this->assertCount(2, $domains);
        $this->assertContainsOnlyInstancesOf(CustomDomain::class, $domains);
    }

    public function test_finds_verified_domains_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $verifiedDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('verified.com')
        );
        
        $unverifiedDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('unverified.com')
        );

        $savedVerified = $this->repository->save($verifiedDomain);
        $this->repository->save($unverifiedDomain);
        
        $savedVerified->markAsVerified();
        $this->repository->save($savedVerified);

        $verifiedDomains = $this->repository->findVerifiedByTenantId($tenantId);

        $this->assertCount(1, $verifiedDomains);
        $this->assertTrue($verifiedDomains[0]->isVerified());
    }

    public function test_finds_active_domains_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $activeDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('active.com')
        );
        
        $pendingDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('pending.com')
        );

        $savedActive = $this->repository->save($activeDomain);
        $this->repository->save($pendingDomain);
        
        $savedActive->markAsVerified();
        $savedActive->activate();
        $this->repository->save($savedActive);

        $activeDomains = $this->repository->findActiveByTenantId($tenantId);

        $this->assertCount(1, $activeDomains);
        $this->assertEquals(CustomDomainStatus::ACTIVE, $activeDomains[0]->getStatus());
    }

    public function test_finds_domains_by_status(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $pendingDomain1 = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('pending1.com')
        );
        
        $pendingDomain2 = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('pending2.com')
        );

        $this->repository->save($pendingDomain1);
        $this->repository->save($pendingDomain2);

        $pendingDomains = $this->repository->findByStatus(CustomDomainStatus::PENDING_VERIFICATION);

        $this->assertGreaterThanOrEqual(2, count($pendingDomains));
        foreach ($pendingDomains as $domain) {
            $this->assertEquals(CustomDomainStatus::PENDING_VERIFICATION, $domain->getStatus());
        }
    }

    public function test_finds_pending_verification_domains(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $pendingDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('pending-verification.com')
        );

        $this->repository->save($pendingDomain);

        $pendingDomains = $this->repository->findPendingVerification();

        $this->assertGreaterThanOrEqual(1, count($pendingDomains));
        foreach ($pendingDomains as $domain) {
            $this->assertEquals(CustomDomainStatus::PENDING_VERIFICATION, $domain->getStatus());
        }
    }

    public function test_finds_expiring_ssl_certificates(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $expiringSoonDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('expiring-soon.com')
        );

        $savedDomain = $this->repository->save($expiringSoonDomain);
        
        $savedDomain->configureSsl(
            certificatePath: '/path/to/cert.pem',
            issuedAt: Carbon::now()->subMonths(2),
            expiresAt: Carbon::now()->addDays(15)
        );
        $this->repository->save($savedDomain);

        $expiringDomains = $this->repository->findExpiringSsl(30);

        $this->assertGreaterThanOrEqual(1, count($expiringDomains));
        $found = false;
        foreach ($expiringDomains as $domain) {
            if ($domain->getDomainName()->getValue() === 'expiring-soon.com') {
                $found = true;
                $this->assertTrue($domain->isSslExpiringSoon(30));
            }
        }
        $this->assertTrue($found);
    }

    public function test_deletes_domain(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('delete-me.com')
        );

        $savedDomain = $this->repository->save($domain);
        $domainId = $savedDomain->getId();

        $deleted = $this->repository->delete($domainId);

        $this->assertTrue($deleted);
        $this->assertDatabaseMissing('custom_domains', [
            'uuid' => $domainId->getValue()
        ]);
    }

    public function test_checks_if_domain_exists(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domainName = new DomainName('exists-check.com');
        
        $this->assertFalse($this->repository->exists($domainName));
        
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );
        
        $this->repository->save($domain);

        $this->assertTrue($this->repository->exists($domainName));
    }

    public function test_checks_if_domain_exists_for_tenant(): void
    {
        $tenant1 = TenantEloquentModel::factory()->create();
        $tenant2 = TenantEloquentModel::factory()->create();
        
        $tenant1Id = Uuid::fromString($tenant1->uuid);
        $tenant2Id = Uuid::fromString($tenant2->uuid);
        $domainName = new DomainName('tenant-specific.com');
        
        $this->assertFalse($this->repository->existsForTenant($tenant1Id, $domainName));
        
        $domain = CustomDomain::create(
            tenantId: $tenant1Id,
            domainName: $domainName
        );
        
        $this->repository->save($domain);

        $this->assertTrue($this->repository->existsForTenant($tenant1Id, $domainName));
        $this->assertFalse($this->repository->existsForTenant($tenant2Id, $domainName));
    }

    public function test_marks_domain_as_verified(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('verify-me.com')
        );

        $savedDomain = $this->repository->save($domain);

        $this->repository->markAsVerified($savedDomain->getId());

        $verifiedDomain = $this->repository->findById($savedDomain->getId());
        $this->assertTrue($verifiedDomain->isVerified());
        $this->assertEquals(CustomDomainStatus::VERIFIED, $verifiedDomain->getStatus());
        $this->assertNotNull($verifiedDomain->getVerifiedAt());
    }

    public function test_marks_domain_as_failed(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('fail-me.com')
        );

        $savedDomain = $this->repository->save($domain);

        $this->repository->markAsFailed($savedDomain->getId());

        $failedDomain = $this->repository->findById($savedDomain->getId());
        $this->assertEquals(CustomDomainStatus::FAILED, $failedDomain->getStatus());
    }

    public function test_activates_domain(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('activate-me.com')
        );

        $savedDomain = $this->repository->save($domain);
        
        $this->repository->markAsVerified($savedDomain->getId());
        $this->repository->activate($savedDomain->getId());

        $activeDomain = $this->repository->findById($savedDomain->getId());
        $this->assertEquals(CustomDomainStatus::ACTIVE, $activeDomain->getStatus());
    }

    public function test_suspends_domain(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('suspend-me.com')
        );

        $savedDomain = $this->repository->save($domain);
        
        $this->repository->markAsVerified($savedDomain->getId());
        $this->repository->activate($savedDomain->getId());
        $this->repository->suspend($savedDomain->getId());

        $suspendedDomain = $this->repository->findById($savedDomain->getId());
        $this->assertEquals(CustomDomainStatus::SUSPENDED, $suspendedDomain->getStatus());
    }

    public function test_updates_domain_status(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('update-status.com')
        );

        $savedDomain = $this->repository->save($domain);

        $this->repository->updateStatus($savedDomain->getId(), CustomDomainStatus::FAILED);

        $updatedDomain = $this->repository->findById($savedDomain->getId());
        $this->assertEquals(CustomDomainStatus::FAILED, $updatedDomain->getStatus());
    }

    public function test_counts_domains_by_tenant_id(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $this->assertEquals(0, $this->repository->countByTenantId($tenantId));
        
        $domain1 = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('count1.com')
        );
        
        $domain2 = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('count2.com')
        );

        $this->repository->save($domain1);
        $this->repository->save($domain2);

        $this->assertEquals(2, $this->repository->countByTenantId($tenantId));
    }

    public function test_counts_domains_by_status(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $initialCount = $this->repository->countByStatus(CustomDomainStatus::PENDING_VERIFICATION);
        
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('count-by-status.com')
        );

        $this->repository->save($domain);

        $newCount = $this->repository->countByStatus(CustomDomainStatus::PENDING_VERIFICATION);
        $this->assertEquals($initialCount + 1, $newCount);
    }

    public function test_finds_all_with_filters(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        
        $verifiedDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('filter-verified.com')
        );
        
        $pendingDomain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('filter-pending.com')
        );

        $savedVerified = $this->repository->save($verifiedDomain);
        $this->repository->save($pendingDomain);
        
        $savedVerified->markAsVerified();
        $this->repository->save($savedVerified);

        $allDomains = $this->repository->findAll(
            tenantId: $tenantId,
            status: null,
            isVerified: null
        );
        $this->assertCount(2, $allDomains);

        $verifiedDomains = $this->repository->findAll(
            tenantId: $tenantId,
            status: null,
            isVerified: true
        );
        $this->assertCount(1, $verifiedDomains);

        $pendingDomains = $this->repository->findAll(
            tenantId: $tenantId,
            status: CustomDomainStatus::PENDING_VERIFICATION,
            isVerified: null
        );
        $this->assertCount(1, $pendingDomains);
    }

    public function test_isolates_tenant_data(): void
    {
        $tenant1 = TenantEloquentModel::factory()->create();
        $tenant2 = TenantEloquentModel::factory()->create();
        
        $tenant1Id = Uuid::fromString($tenant1->uuid);
        $tenant2Id = Uuid::fromString($tenant2->uuid);
        
        $domain1 = CustomDomain::create(
            tenantId: $tenant1Id,
            domainName: new DomainName('tenant1-domain.com')
        );
        
        $domain2 = CustomDomain::create(
            tenantId: $tenant2Id,
            domainName: new DomainName('tenant2-domain.com')
        );

        $this->repository->save($domain1);
        $this->repository->save($domain2);

        $tenant1Domains = $this->repository->findByTenantId($tenant1Id);
        $tenant2Domains = $this->repository->findByTenantId($tenant2Id);

        $this->assertCount(1, $tenant1Domains);
        $this->assertCount(1, $tenant2Domains);
        $this->assertEquals('tenant1-domain.com', $tenant1Domains[0]->getDomainName()->getValue());
        $this->assertEquals('tenant2-domain.com', $tenant2Domains[0]->getDomainName()->getValue());
    }

    public function test_saves_domain_with_ssl_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('ssl-test.com')
        );

        $savedDomain = $this->repository->save($domain);
        
        $savedDomain->configureSsl(
            certificatePath: '/path/to/cert.pem',
            issuedAt: Carbon::now(),
            expiresAt: Carbon::now()->addMonths(3)
        );
        $updatedDomain = $this->repository->save($savedDomain);

        $foundDomain = $this->repository->findById($updatedDomain->getId());
        
        $this->assertTrue($foundDomain->isSslEnabled());
        $this->assertEquals('/path/to/cert.pem', $foundDomain->getSslCertificatePath());
        $this->assertNotNull($foundDomain->getSslCertificateIssuedAt());
        $this->assertNotNull($foundDomain->getSslCertificateExpiresAt());
    }

    public function test_saves_domain_with_dns_configuration(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('dns-test.com')
        );

        $savedDomain = $this->repository->save($domain);
        
        $savedDomain->updateDnsConfiguration(
            provider: DnsProvider::CLOUDFLARE,
            recordId: 'cf-record-123',
            zoneId: 'cf-zone-456'
        );
        $updatedDomain = $this->repository->save($savedDomain);

        $foundDomain = $this->repository->findById($updatedDomain->getId());
        
        $this->assertEquals(DnsProvider::CLOUDFLARE, $foundDomain->getDnsProvider());
        $this->assertEquals('cf-record-123', $foundDomain->getDnsRecordId());
        $this->assertEquals('cf-zone-456', $foundDomain->getDnsZoneId());
    }

    public function test_saves_domain_with_metadata(): void
    {
        $tenantId = Uuid::fromString($this->tenant->uuid);
        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: new DomainName('metadata-test.com')
        );

        $savedDomain = $this->repository->save($domain);
        
        $savedDomain->updateMetadata([
            'custom_field' => 'value1',
            'another_field' => 'value2'
        ]);
        $updatedDomain = $this->repository->save($savedDomain);

        $foundDomain = $this->repository->findById($updatedDomain->getId());
        
        $metadata = $foundDomain->getMetadata();
        $this->assertEquals('value1', $metadata['custom_field']);
        $this->assertEquals('value2', $metadata['another_field']);
    }
}
