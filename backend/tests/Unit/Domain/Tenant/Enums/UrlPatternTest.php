<?php

namespace Tests\Unit\Domain\Tenant\Enums;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Enums\UrlPattern;
use InvalidArgumentException;

class UrlPatternTest extends TestCase
{
    public function test_has_subdomain_case(): void
    {
        $pattern = UrlPattern::SUBDOMAIN;

        $this->assertEquals('subdomain', $pattern->value);
    }

    public function test_has_path_case(): void
    {
        $pattern = UrlPattern::PATH;

        $this->assertEquals('path', $pattern->value);
    }

    public function test_has_custom_domain_case(): void
    {
        $pattern = UrlPattern::CUSTOM_DOMAIN;

        $this->assertEquals('custom_domain', $pattern->value);
    }

    public function test_subdomain_label(): void
    {
        $this->assertEquals('Subdomain', UrlPattern::SUBDOMAIN->label());
    }

    public function test_path_label(): void
    {
        $this->assertEquals('Path-based', UrlPattern::PATH->label());
    }

    public function test_custom_domain_label(): void
    {
        $this->assertEquals('Custom Domain', UrlPattern::CUSTOM_DOMAIN->label());
    }

    public function test_subdomain_description(): void
    {
        $description = UrlPattern::SUBDOMAIN->description();

        $this->assertStringContainsString('subdomain', $description);
        $this->assertStringContainsString('tenant.stencil.canvastack.com', $description);
    }

    public function test_path_description(): void
    {
        $description = UrlPattern::PATH->description();

        $this->assertStringContainsString('path', $description);
        $this->assertStringContainsString('stencil.canvastack.com/tenant', $description);
    }

    public function test_custom_domain_description(): void
    {
        $description = UrlPattern::CUSTOM_DOMAIN->description();

        $this->assertStringContainsString('custom domain', $description);
    }

    public function test_subdomain_example(): void
    {
        $example = UrlPattern::SUBDOMAIN->example('acmecorp');

        $this->assertEquals('acmecorp.stencil.canvastack.com', $example);
    }

    public function test_path_example(): void
    {
        $example = UrlPattern::PATH->example('acmecorp');

        $this->assertEquals('stencil.canvastack.com/acmecorp', $example);
    }

    public function test_custom_domain_example(): void
    {
        $example = UrlPattern::CUSTOM_DOMAIN->example('acmecorp');

        $this->assertEquals('acmecorp.com', $example);
    }

    public function test_only_custom_domain_requires_custom_domain(): void
    {
        $this->assertFalse(UrlPattern::SUBDOMAIN->requiresCustomDomain());
        $this->assertFalse(UrlPattern::PATH->requiresCustomDomain());
        $this->assertTrue(UrlPattern::CUSTOM_DOMAIN->requiresCustomDomain());
    }

    public function test_available_patterns_returns_all_patterns(): void
    {
        $patterns = UrlPattern::availablePatterns();

        $this->assertCount(3, $patterns);
        $this->assertContains(UrlPattern::SUBDOMAIN, $patterns);
        $this->assertContains(UrlPattern::PATH, $patterns);
        $this->assertContains(UrlPattern::CUSTOM_DOMAIN, $patterns);
    }

    public function test_can_create_from_string_subdomain(): void
    {
        $pattern = UrlPattern::fromString('subdomain');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
    }

    public function test_can_create_from_string_path(): void
    {
        $pattern = UrlPattern::fromString('path');

        $this->assertEquals(UrlPattern::PATH, $pattern);
    }

    public function test_can_create_from_string_custom_domain(): void
    {
        $pattern = UrlPattern::fromString('custom_domain');

        $this->assertEquals(UrlPattern::CUSTOM_DOMAIN, $pattern);
    }

    public function test_from_string_is_case_insensitive(): void
    {
        $pattern1 = UrlPattern::fromString('SUBDOMAIN');
        $pattern2 = UrlPattern::fromString('SubDomain');
        $pattern3 = UrlPattern::fromString('subdomain');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern1);
        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern2);
        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern3);
    }

    public function test_from_string_throws_exception_for_invalid_pattern(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid URL pattern: invalid');

        UrlPattern::fromString('invalid');
    }
}
