<?php

namespace Tests\Unit\Domain\Tenant\Enums;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Enums\DnsProvider;
use InvalidArgumentException;

class DnsProviderTest extends TestCase
{
    public function test_has_cloudflare_case(): void
    {
        $provider = DnsProvider::CLOUDFLARE;

        $this->assertEquals('cloudflare', $provider->value);
    }

    public function test_has_route53_case(): void
    {
        $provider = DnsProvider::ROUTE53;

        $this->assertEquals('route53', $provider->value);
    }

    public function test_has_manual_case(): void
    {
        $provider = DnsProvider::MANUAL;

        $this->assertEquals('manual', $provider->value);
    }

    public function test_cloudflare_label(): void
    {
        $this->assertEquals('Cloudflare', DnsProvider::CLOUDFLARE->label());
    }

    public function test_route53_label(): void
    {
        $this->assertEquals('AWS Route 53', DnsProvider::ROUTE53->label());
    }

    public function test_manual_label(): void
    {
        $this->assertEquals('Manual Configuration', DnsProvider::MANUAL->label());
    }

    public function test_all_providers_have_descriptions(): void
    {
        foreach (DnsProvider::cases() as $provider) {
            $description = $provider->description();
            $this->assertNotEmpty($description);
        }
    }

    public function test_cloudflare_supports_api_integration(): void
    {
        $this->assertTrue(DnsProvider::CLOUDFLARE->supportsApiIntegration());
    }

    public function test_route53_supports_api_integration(): void
    {
        $this->assertTrue(DnsProvider::ROUTE53->supportsApiIntegration());
    }

    public function test_manual_does_not_support_api_integration(): void
    {
        $this->assertFalse(DnsProvider::MANUAL->supportsApiIntegration());
    }

    public function test_only_manual_requires_manual_setup(): void
    {
        $this->assertFalse(DnsProvider::CLOUDFLARE->requiresManualSetup());
        $this->assertFalse(DnsProvider::ROUTE53->requiresManualSetup());
        $this->assertTrue(DnsProvider::MANUAL->requiresManualSetup());
    }

    public function test_available_providers_returns_all_providers(): void
    {
        $providers = DnsProvider::availableProviders();

        $this->assertCount(3, $providers);
        $this->assertContains(DnsProvider::CLOUDFLARE, $providers);
        $this->assertContains(DnsProvider::ROUTE53, $providers);
        $this->assertContains(DnsProvider::MANUAL, $providers);
    }

    public function test_can_create_from_string_cloudflare(): void
    {
        $provider = DnsProvider::fromString('cloudflare');

        $this->assertEquals(DnsProvider::CLOUDFLARE, $provider);
    }

    public function test_can_create_from_string_route53(): void
    {
        $provider = DnsProvider::fromString('route53');

        $this->assertEquals(DnsProvider::ROUTE53, $provider);
    }

    public function test_can_create_from_string_manual(): void
    {
        $provider = DnsProvider::fromString('manual');

        $this->assertEquals(DnsProvider::MANUAL, $provider);
    }

    public function test_from_string_is_case_insensitive(): void
    {
        $provider1 = DnsProvider::fromString('CLOUDFLARE');
        $provider2 = DnsProvider::fromString('Cloudflare');
        $provider3 = DnsProvider::fromString('cloudflare');

        $this->assertEquals(DnsProvider::CLOUDFLARE, $provider1);
        $this->assertEquals(DnsProvider::CLOUDFLARE, $provider2);
        $this->assertEquals(DnsProvider::CLOUDFLARE, $provider3);
    }

    public function test_from_string_throws_exception_for_invalid_provider(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid DNS provider: invalid');

        DnsProvider::fromString('invalid');
    }
}
