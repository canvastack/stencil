<?php

namespace Tests\Unit\Domain\Tenant;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Entities\CustomDomain;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use App\Domain\Tenant\Enums\VerificationMethod;
use App\Domain\Tenant\Enums\DnsProvider;
use App\Domain\Tenant\ValueObjects\DomainName;
use App\Domain\Tenant\ValueObjects\DomainVerificationToken;
use Carbon\Carbon;

class CustomDomainTest extends TestCase
{
    public function test_can_create_custom_domain(): void
    {
        $tenantId = Uuid::generate();
        $createdBy = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName,
            createdBy: $createdBy,
            verificationMethod: VerificationMethod::DNS_TXT
        );

        $this->assertEquals($tenantId, $domain->getTenantId());
        $this->assertEquals($domainName, $domain->getDomainName());
        $this->assertEquals($createdBy, $domain->getCreatedBy());
        $this->assertEquals(VerificationMethod::DNS_TXT, $domain->getVerificationMethod());
        $this->assertEquals(CustomDomainStatus::PENDING_VERIFICATION, $domain->getStatus());
        $this->assertFalse($domain->isVerified());
        $this->assertNotNull($domain->getVerificationToken());
        $this->assertNotNull($domain->getId());
    }

    public function test_creates_with_dns_txt_verification_by_default(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertEquals(VerificationMethod::DNS_TXT, $domain->getVerificationMethod());
    }

    public function test_can_mark_as_verified_from_pending_status(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertEquals(CustomDomainStatus::PENDING_VERIFICATION, $domain->getStatus());
        $this->assertFalse($domain->isVerified());

        $domain->markAsVerified();

        $this->assertEquals(CustomDomainStatus::VERIFIED, $domain->getStatus());
        $this->assertTrue($domain->isVerified());
        $this->assertNotNull($domain->getVerifiedAt());
    }

    public function test_can_mark_as_verified_from_failed_status(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsFailed();
        $this->assertEquals(CustomDomainStatus::FAILED, $domain->getStatus());

        $domain->markAsVerified();

        $this->assertEquals(CustomDomainStatus::VERIFIED, $domain->getStatus());
        $this->assertTrue($domain->isVerified());
    }

    public function test_can_activate_verified_domain(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsVerified();
        $this->assertEquals(CustomDomainStatus::VERIFIED, $domain->getStatus());

        $domain->activate();

        $this->assertEquals(CustomDomainStatus::ACTIVE, $domain->getStatus());
        $this->assertTrue($domain->isOperational());
    }

    public function test_can_suspend_active_domain(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsVerified();
        $domain->activate();
        $this->assertEquals(CustomDomainStatus::ACTIVE, $domain->getStatus());

        $domain->suspend();

        $this->assertEquals(CustomDomainStatus::SUSPENDED, $domain->getStatus());
        $this->assertFalse($domain->isOperational());
    }

    public function test_can_suspend_verified_domain(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsVerified();
        $this->assertEquals(CustomDomainStatus::VERIFIED, $domain->getStatus());

        $domain->suspend();

        $this->assertEquals(CustomDomainStatus::SUSPENDED, $domain->getStatus());
    }

    public function test_can_mark_as_failed(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsFailed();

        $this->assertEquals(CustomDomainStatus::FAILED, $domain->getStatus());
        $this->assertFalse($domain->isVerified());
    }

    public function test_can_regenerate_verification_token(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $originalToken = $domain->getVerificationToken();
        $this->assertNotNull($originalToken);

        $domain->regenerateVerificationToken();

        $newToken = $domain->getVerificationToken();
        $this->assertNotNull($newToken);
        $this->assertNotEquals($originalToken->getValue(), $newToken->getValue());
    }

    public function test_can_update_verification_method(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName,
            verificationMethod: VerificationMethod::DNS_TXT
        );

        $this->assertEquals(VerificationMethod::DNS_TXT, $domain->getVerificationMethod());

        $domain->updateVerificationMethod(VerificationMethod::FILE_UPLOAD);

        $this->assertEquals(VerificationMethod::FILE_UPLOAD, $domain->getVerificationMethod());
    }

    public function test_can_configure_ssl(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertFalse($domain->isSslEnabled());

        $certificatePath = '/etc/ssl/certs/acme-corp.com.crt';
        $issuedAt = Carbon::now();
        $expiresAt = Carbon::now()->addYear();

        $domain->configureSsl($certificatePath, $issuedAt, $expiresAt);

        $this->assertTrue($domain->isSslEnabled());
        $this->assertEquals($certificatePath, $domain->getSslCertificatePath());
        $this->assertEquals($issuedAt, $domain->getSslCertificateIssuedAt());
        $this->assertEquals($expiresAt, $domain->getSslCertificateExpiresAt());
    }

    public function test_can_disable_ssl(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->configureSsl(
            '/etc/ssl/certs/acme-corp.com.crt',
            Carbon::now(),
            Carbon::now()->addYear()
        );
        $this->assertTrue($domain->isSslEnabled());

        $domain->disableSsl();

        $this->assertFalse($domain->isSslEnabled());
    }

    public function test_can_update_dns_configuration(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertNull($domain->getDnsProvider());

        $domain->updateDnsConfiguration(
            DnsProvider::CLOUDFLARE,
            'record-123',
            'zone-456'
        );

        $this->assertEquals(DnsProvider::CLOUDFLARE, $domain->getDnsProvider());
        $this->assertEquals('record-123', $domain->getDnsRecordId());
        $this->assertEquals('zone-456', $domain->getDnsZoneId());
    }

    public function test_can_update_metadata(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertEmpty($domain->getMetadata());

        $metadata = ['cloudflare_proxy' => true, 'cdn_enabled' => false];
        $domain->updateMetadata($metadata);

        $this->assertEquals($metadata, $domain->getMetadata());

        $additionalMetadata = ['cache_ttl' => 3600];
        $domain->updateMetadata($additionalMetadata);

        $this->assertEquals(array_merge($metadata, $additionalMetadata), $domain->getMetadata());
    }

    public function test_can_delete_domain(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertFalse($domain->isDeleted());

        $domain->delete();

        $this->assertTrue($domain->isDeleted());
        $this->assertNotNull($domain->getDeletedAt());
    }

    public function test_can_restore_deleted_domain(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->delete();
        $this->assertTrue($domain->isDeleted());

        $domain->restore();

        $this->assertFalse($domain->isDeleted());
        $this->assertNull($domain->getDeletedAt());
    }

    public function test_is_operational_when_active_and_not_deleted(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsVerified();
        $domain->activate();

        $this->assertTrue($domain->isOperational());
    }

    public function test_is_not_operational_when_suspended(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsVerified();
        $domain->activate();
        $domain->suspend();

        $this->assertFalse($domain->isOperational());
    }

    public function test_is_not_operational_when_deleted(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->markAsVerified();
        $domain->activate();
        $domain->delete();

        $this->assertFalse($domain->isOperational());
    }

    public function test_ssl_is_expiring_soon(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $domain->configureSsl(
            '/etc/ssl/certs/acme-corp.com.crt',
            Carbon::now()->subMonths(11),
            Carbon::now()->addDays(20)
        );

        $this->assertTrue($domain->isSslExpiringSoon(30));
        $this->assertFalse($domain->isSslExpiringSoon(15));
    }

    public function test_ssl_not_expiring_when_ssl_disabled(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertFalse($domain->isSslExpiringSoon(30));
    }

    public function test_should_auto_renew_ssl_by_default(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertTrue($domain->shouldAutoRenewSsl());
    }

    public function test_should_redirect_to_https_by_default(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertTrue($domain->shouldRedirectToHttps());
    }

    public function test_www_redirect_defaults_to_add_www(): void
    {
        $tenantId = Uuid::generate();
        $domainName = new DomainName('acme-corp.com');

        $domain = CustomDomain::create(
            tenantId: $tenantId,
            domainName: $domainName
        );

        $this->assertEquals('add_www', $domain->getWwwRedirect());
    }
}
