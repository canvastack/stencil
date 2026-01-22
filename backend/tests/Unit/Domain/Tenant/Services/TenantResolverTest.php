<?php

namespace Tests\Unit\Domain\Tenant\Services;

use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use App\Domain\Tenant\Services\TenantResolver;
use App\Domain\Tenant\Entities\Tenant;
use App\Domain\Tenant\Entities\TenantUrlConfiguration;
use App\Domain\Tenant\Entities\CustomDomain;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Enums\SubscriptionStatus;
use App\Domain\Tenant\Enums\DomainStatus;
use App\Domain\Tenant\Exceptions\TenantNotFoundException;
use App\Domain\Tenant\Repositories\TenantRepositoryInterface;
use App\Domain\Tenant\Repositories\TenantUrlConfigRepositoryInterface;
use App\Domain\Tenant\Repositories\CustomDomainRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\ValueObjects\TenantName;
use App\Domain\Tenant\ValueObjects\TenantSlug;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;
use App\Domain\Tenant\ValueObjects\DomainName;
use Carbon\Carbon;

class TenantResolverTest extends TestCase
{
    private TenantResolver $resolver;
    private MockObject $tenantRepository;
    private MockObject $urlConfigRepository;
    private MockObject $customDomainRepository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantRepository = $this->createMock(TenantRepositoryInterface::class);
        $this->urlConfigRepository = $this->createMock(TenantUrlConfigRepositoryInterface::class);
        $this->customDomainRepository = $this->createMock(CustomDomainRepositoryInterface::class);

        $this->resolver = new TenantResolver(
            $this->tenantRepository,
            $this->urlConfigRepository,
            $this->customDomainRepository
        );
    }

    public function test_resolves_tenant_by_subdomain_successfully(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = 'acmecorp';

        $urlConfig = $this->createUrlConfigForSubdomain($tenantId, $subdomain);
        $tenant = $this->createActiveTenant($tenantId, 'Acme Corp', 'acmecorp');

        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findBySubdomain')
            ->with($subdomain)
            ->willReturn($urlConfig);

        $this->tenantRepository
            ->expects($this->once())
            ->method('findById')
            ->with($tenantId)
            ->willReturn($tenant);

        $result = $this->resolver->resolve(UrlPattern::SUBDOMAIN, $subdomain);

        $this->assertSame($tenant, $result);
    }

    public function test_throws_exception_when_subdomain_not_found(): void
    {
        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findBySubdomain')
            ->with('nonexistent')
            ->willReturn(null);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No tenant found for subdomain: nonexistent');

        $this->resolver->resolve(UrlPattern::SUBDOMAIN, 'nonexistent');
    }

    public function test_throws_exception_when_subdomain_config_inactive(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = 'acmecorp';

        $urlConfig = $this->createUrlConfigForSubdomain($tenantId, $subdomain, isEnabled: false);

        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findBySubdomain')
            ->with($subdomain)
            ->willReturn($urlConfig);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Tenant URL configuration is inactive for subdomain: acmecorp');

        $this->resolver->resolve(UrlPattern::SUBDOMAIN, $subdomain);
    }

    public function test_resolves_tenant_by_path_successfully(): void
    {
        $tenantId = Uuid::generate();
        $slug = 'acmecorp';

        $urlConfig = $this->createUrlConfigForPath($tenantId, $slug);
        $tenant = $this->createActiveTenant($tenantId, 'Acme Corp', $slug);

        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findByUrlPath')
            ->with($this->isInstanceOf(UrlPath::class))
            ->willReturn($urlConfig);

        $this->tenantRepository
            ->expects($this->once())
            ->method('findById')
            ->with($tenantId)
            ->willReturn($tenant);

        $result = $this->resolver->resolve(UrlPattern::PATH, $slug);

        $this->assertSame($tenant, $result);
    }

    public function test_throws_exception_when_path_not_found(): void
    {
        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findByUrlPath')
            ->with($this->isInstanceOf(UrlPath::class))
            ->willReturn(null);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No tenant found for path: nonexistent');

        $this->resolver->resolve(UrlPattern::PATH, 'nonexistent');
    }

    public function test_throws_exception_when_path_config_inactive(): void
    {
        $tenantId = Uuid::generate();
        $slug = 'acmecorp';

        $urlConfig = $this->createUrlConfigForPath($tenantId, $slug, isEnabled: false);

        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findByUrlPath')
            ->with($this->isInstanceOf(UrlPath::class))
            ->willReturn($urlConfig);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Tenant URL configuration is inactive for path: acmecorp');

        $this->resolver->resolve(UrlPattern::PATH, $slug);
    }

    public function test_resolves_tenant_by_custom_domain_successfully(): void
    {
        $tenantId = Uuid::generate();
        $customDomainId = Uuid::generate();
        $domain = 'acmecorp.com';

        $customDomain = $this->createVerifiedCustomDomain($customDomainId, $domain);
        $urlConfig = $this->createUrlConfigForCustomDomain($tenantId, $customDomainId);
        $tenant = $this->createActiveTenant($tenantId, 'Acme Corp', 'acmecorp');

        $this->customDomainRepository
            ->expects($this->once())
            ->method('findByDomain')
            ->with($domain)
            ->willReturn($customDomain);

        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findByCustomDomainId')
            ->with($this->isInstanceOf(Uuid::class))
            ->willReturn($urlConfig);

        $this->tenantRepository
            ->expects($this->once())
            ->method('findById')
            ->with($tenantId)
            ->willReturn($tenant);

        $result = $this->resolver->resolve(UrlPattern::CUSTOM_DOMAIN, $domain);

        $this->assertSame($tenant, $result);
    }

    public function test_throws_exception_when_custom_domain_not_found(): void
    {
        $this->customDomainRepository
            ->expects($this->once())
            ->method('findByDomain')
            ->with('nonexistent.com')
            ->willReturn(null);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No tenant found for custom domain: nonexistent.com');

        $this->resolver->resolve(UrlPattern::CUSTOM_DOMAIN, 'nonexistent.com');
    }

    public function test_throws_exception_when_custom_domain_not_verified(): void
    {
        $customDomainId = Uuid::generate();
        $domain = 'acmecorp.com';

        $customDomain = $this->createVerifiedCustomDomain($customDomainId, $domain, isVerified: false);

        $this->customDomainRepository
            ->expects($this->once())
            ->method('findByDomain')
            ->with($domain)
            ->willReturn($customDomain);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Custom domain not verified: acmecorp.com');

        $this->resolver->resolve(UrlPattern::CUSTOM_DOMAIN, $domain);
    }

    public function test_throws_exception_when_custom_domain_not_active(): void
    {
        $customDomainId = Uuid::generate();
        $domain = 'acmecorp.com';

        $customDomain = $this->createVerifiedCustomDomain($customDomainId, $domain, isActive: false);

        $this->customDomainRepository
            ->expects($this->once())
            ->method('findByDomain')
            ->with($domain)
            ->willReturn($customDomain);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Custom domain is not active: acmecorp.com');

        $this->resolver->resolve(UrlPattern::CUSTOM_DOMAIN, $domain);
    }

    public function test_throws_exception_when_custom_domain_url_config_not_found(): void
    {
        $customDomainId = Uuid::generate();
        $domain = 'acmecorp.com';

        $customDomain = $this->createVerifiedCustomDomain($customDomainId, $domain);

        $this->customDomainRepository
            ->expects($this->once())
            ->method('findByDomain')
            ->with($domain)
            ->willReturn($customDomain);

        $this->urlConfigRepository
            ->expects($this->once())
            ->method('findByCustomDomainId')
            ->with($this->isInstanceOf(Uuid::class))
            ->willReturn(null);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No URL configuration found for custom domain: acmecorp.com');

        $this->resolver->resolve(UrlPattern::CUSTOM_DOMAIN, $domain);
    }

    public function test_resolve_tenant_data_returns_correct_structure(): void
    {
        $tenantId = Uuid::generate();
        $subdomain = 'acmecorp';

        $urlConfig = $this->createUrlConfigForSubdomain($tenantId, $subdomain);
        $tenant = $this->createActiveTenant($tenantId, 'Acme Corp', 'acmecorp');

        $this->urlConfigRepository
            ->method('findBySubdomain')
            ->willReturn($urlConfig);

        $this->tenantRepository
            ->method('findById')
            ->willReturn($tenant);

        $result = $this->resolver->resolveTenantData(UrlPattern::SUBDOMAIN, $subdomain);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('id', $result);
        $this->assertArrayHasKey('uuid', $result);
        $this->assertArrayHasKey('slug', $result);
        $this->assertArrayHasKey('name', $result);
        $this->assertArrayHasKey('status', $result);
        $this->assertArrayHasKey('is_active', $result);
        $this->assertEquals($tenantId->getValue(), $result['id']);
        $this->assertEquals($tenantId->toString(), $result['uuid']);
        $this->assertEquals('acmecorp', $result['slug']);
        $this->assertEquals('Acme Corp', $result['name']);
        $this->assertTrue($result['is_active']);
    }

    public function test_validate_tenant_access_passes_for_active_tenant(): void
    {
        $tenant = $this->createActiveTenant(Uuid::generate(), 'Acme Corp', 'acmecorp');

        $this->resolver->validateTenantAccess($tenant);

        $this->assertTrue(true);
    }

    public function test_validate_tenant_access_throws_for_inactive_tenant(): void
    {
        $tenant = $this->createInactiveTenant(Uuid::generate(), 'Acme Corp', 'acmecorp');

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Tenant is not active: acmecorp');

        $this->resolver->validateTenantAccess($tenant);
    }

    private function createActiveTenant(Uuid $id, string $name, string $slug): Tenant
    {
        return new Tenant(
            id: $id,
            name: new TenantName($name),
            slug: new TenantSlug($slug),
            status: TenantStatus::ACTIVE,
            subscriptionStatus: SubscriptionStatus::ACTIVE,
            subscriptionEndsAt: Carbon::now()->addYear(),
            createdAt: Carbon::now()
        );
    }

    private function createInactiveTenant(Uuid $id, string $name, string $slug): Tenant
    {
        return new Tenant(
            id: $id,
            name: new TenantName($name),
            slug: new TenantSlug($slug),
            status: TenantStatus::SUSPENDED,
            subscriptionStatus: SubscriptionStatus::ACTIVE,
            createdAt: Carbon::now()
        );
    }

    private function createUrlConfigForSubdomain(Uuid $tenantId, string $subdomain, bool $isEnabled = true): TenantUrlConfiguration
    {
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::SUBDOMAIN,
            subdomain: new SubdomainName($subdomain),
            isPrimary: true
        );

        if (!$isEnabled) {
            $config->disable();
        }

        return $config;
    }

    private function createUrlConfigForPath(Uuid $tenantId, string $path, bool $isEnabled = true): TenantUrlConfiguration
    {
        $config = TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::PATH,
            urlPath: new UrlPath($path),
            isPrimary: false
        );

        if (!$isEnabled) {
            $config->disable();
        }

        return $config;
    }

    private function createUrlConfigForCustomDomain(Uuid $tenantId, Uuid $customDomainId): TenantUrlConfiguration
    {
        return TenantUrlConfiguration::create(
            tenantId: $tenantId,
            urlPattern: UrlPattern::CUSTOM_DOMAIN,
            customDomainId: $customDomainId,
            isPrimary: false
        );
    }

    private function createVerifiedCustomDomain(
        Uuid $id,
        string $domain,
        bool $isVerified = true,
        bool $isActive = true
    ): CustomDomain {
        $customDomain = CustomDomain::create(
            tenantId: Uuid::generate(),
            domainName: new DomainName($domain)
        );

        if ($isVerified) {
            $customDomain->markAsVerified();
        }

        if ($isActive) {
            $customDomain->activate();
        } else {
            $customDomain->suspend();
        }

        return $customDomain;
    }
}
