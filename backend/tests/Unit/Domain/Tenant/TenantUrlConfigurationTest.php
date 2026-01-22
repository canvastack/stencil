<?php

namespace Tests\Unit\Domain\Tenant;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Entities\TenantUrlConfiguration;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;
use Carbon\Carbon;

class TenantUrlConfigurationTest extends TestCase
{
    public function test_can_create_subdomain_configuration(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain,
            isPrimary: true
        );

        $this->assertEquals(UrlPattern::SUBDOMAIN, $config->getUrlPattern());
        $this->assertEquals($subdomain, $config->getSubdomain());
        $this->assertTrue($config->isPrimary());
        $this->assertTrue($config->isEnabled());
        $this->assertNotNull($config->getId());
        $this->assertEquals($tenantId, $config->getTenantId());
    }

    public function test_can_create_path_based_configuration(): void
    {
        $tenantId = Uuid::generate();
        $urlPath = new UrlPath('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: $urlPath,
            isPrimary: false
        );

        $this->assertEquals(UrlPattern::PATH, $config->getUrlPattern());
        $this->assertEquals($urlPath, $config->getUrlPath());
        $this->assertFalse($config->isPrimary());
        $this->assertTrue($config->isEnabled());
    }

    public function test_can_create_custom_domain_configuration(): void
    {
        $tenantId = Uuid::generate();
        $customDomainId = Uuid::generate();

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::CUSTOM_DOMAIN,
            customDomainId: $customDomainId,
            isPrimary: false
        );

        $this->assertEquals(UrlPattern::CUSTOM_DOMAIN, $config->getUrlPattern());
        $this->assertEquals($customDomainId, $config->getCustomDomainId());
    }

    public function test_can_mark_as_primary(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain,
            isPrimary: false
        );

        $this->assertFalse($config->isPrimary());

        $config->markAsPrimary();

        $this->assertTrue($config->isPrimary());
        $this->assertNotNull($config->getUpdatedAt());
    }

    public function test_can_unmark_as_primary(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain,
            isPrimary: true
        );

        $this->assertTrue($config->isPrimary());

        $config->unmarkAsPrimary();

        $this->assertFalse($config->isPrimary());
    }

    public function test_can_enable_configuration(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $config->disable();
        $this->assertFalse($config->isEnabled());

        $config->enable();
        $this->assertTrue($config->isEnabled());
    }

    public function test_can_disable_configuration(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertTrue($config->isEnabled());

        $config->disable();

        $this->assertFalse($config->isEnabled());
        $this->assertNotNull($config->getUpdatedAt());
    }

    public function test_can_update_seo_metadata(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $metaTitle = 'ACME Corporation';
        $metaDescription = 'Leading provider of innovative solutions';
        $ogImageUrl = 'https://cdn.acmecorp.com/og-image.jpg';

        $config->updateSeoMetadata($metaTitle, $metaDescription, $ogImageUrl);

        $this->assertEquals($metaTitle, $config->getMetaTitle());
        $this->assertEquals($metaDescription, $config->getMetaDescription());
        $this->assertEquals($ogImageUrl, $config->getOgImageUrl());
    }

    public function test_can_enable_https_redirect(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertTrue($config->forceHttps());

        $config->disableHttpsRedirect();
        $this->assertFalse($config->forceHttps());

        $config->enableHttpsRedirect();
        $this->assertTrue($config->forceHttps());
    }

    public function test_can_enable_redirect_to_primary(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertFalse($config->shouldRedirectToPrimary());

        $config->enableRedirectToPrimary();

        $this->assertTrue($config->shouldRedirectToPrimary());
    }

    public function test_can_disable_redirect_to_primary(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $config->enableRedirectToPrimary();
        $this->assertTrue($config->shouldRedirectToPrimary());

        $config->disableRedirectToPrimary();
        $this->assertFalse($config->shouldRedirectToPrimary());
    }

    public function test_can_delete_configuration(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertFalse($config->isDeleted());
        $this->assertNull($config->getDeletedAt());

        $config->delete();

        $this->assertTrue($config->isDeleted());
        $this->assertNotNull($config->getDeletedAt());
    }

    public function test_can_restore_configuration(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $config->delete();
        $this->assertTrue($config->isDeleted());

        $config->restore();

        $this->assertFalse($config->isDeleted());
        $this->assertNull($config->getDeletedAt());
    }

    public function test_is_active_when_enabled_and_not_deleted(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertTrue($config->isActive());
    }

    public function test_is_not_active_when_disabled(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $config->disable();

        $this->assertFalse($config->isActive());
    }

    public function test_is_not_active_when_deleted(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $config->delete();

        $this->assertFalse($config->isActive());
    }

    public function test_get_access_url_for_subdomain(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $accessUrl = $config->getAccessUrl();

        $this->assertEquals('https://acmecorp.stencil.canvastack.com', $accessUrl);
    }

    public function test_get_access_url_for_path(): void
    {
        $tenantId = Uuid::generate();
        $urlPath = new UrlPath('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: $urlPath
        );

        $accessUrl = $config->getAccessUrl();

        $this->assertEquals('https://stencil.canvastack.com/acmecorp', $accessUrl);
    }

    public function test_get_access_url_for_custom_domain(): void
    {
        $tenantId = Uuid::generate();
        $customDomainId = Uuid::generate();

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::CUSTOM_DOMAIN,
            customDomainId: $customDomainId
        );

        $accessUrl = $config->getAccessUrl();

        $this->assertEquals('https://[custom-domain]', $accessUrl);
    }

    public function test_force_https_is_true_by_default(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertTrue($config->forceHttps());
    }

    public function test_redirect_to_primary_is_false_by_default(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = new SubdomainName('acmecorp');

        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: $subdomain
        );

        $this->assertFalse($config->shouldRedirectToPrimary());
    }
}
