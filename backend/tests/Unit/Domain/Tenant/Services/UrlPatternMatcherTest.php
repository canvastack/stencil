<?php

namespace Tests\Unit\Domain\Tenant\Services;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Services\UrlPatternMatcher;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\Exceptions\InvalidUrlPatternException;

class UrlPatternMatcherTest extends TestCase
{
    private UrlPatternMatcher $matcher;

    protected function setUp(): void
    {
        parent::setUp();
        $this->matcher = new UrlPatternMatcher(
            baseDomain: 'stencil.canvastack.com',
            excludedSubdomains: ['www', 'api', 'admin', 'platform', 'mail'],
            pathPrefix: 't'
        );
    }

    public function test_detects_subdomain_pattern(): void
    {
        $pattern = $this->matcher->detect('acmecorp.stencil.canvastack.com', '/');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
    }

    public function test_detects_path_pattern(): void
    {
        $pattern = $this->matcher->detect('stencil.canvastack.com', 't/acmecorp');

        $this->assertEquals(UrlPattern::PATH, $pattern);
    }

    public function test_detects_custom_domain_pattern(): void
    {
        $pattern = $this->matcher->detect('acmecorp.com', '/');

        $this->assertEquals(UrlPattern::CUSTOM_DOMAIN, $pattern);
    }

    public function test_extracts_subdomain_identifier(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::SUBDOMAIN,
            'acmecorp.stencil.canvastack.com',
            '/'
        );

        $this->assertEquals('acmecorp', $identifier);
    }

    public function test_extracts_path_identifier(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            't/acmecorp'
        );

        $this->assertEquals('acmecorp', $identifier);
    }

    public function test_extracts_custom_domain_identifier(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::CUSTOM_DOMAIN,
            'acmecorp.com',
            '/'
        );

        $this->assertEquals('acmecorp.com', $identifier);
    }

    public function test_rejects_excluded_subdomain_www(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('www.stencil.canvastack.com', '/');
    }

    public function test_rejects_excluded_subdomain_api(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('api.stencil.canvastack.com', '/');
    }

    public function test_rejects_excluded_subdomain_admin(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('admin.stencil.canvastack.com', '/');
    }

    public function test_rejects_excluded_subdomain_platform(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('platform.stencil.canvastack.com', '/');
    }

    public function test_rejects_excluded_subdomain_mail(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('mail.stencil.canvastack.com', '/');
    }

    public function test_rejects_base_domain_without_subdomain(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('stencil.canvastack.com', '/');
    }

    public function test_accepts_valid_subdomain_with_hyphen(): void
    {
        $pattern = $this->matcher->detect('acme-corp.stencil.canvastack.com', '/');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
    }

    public function test_extracts_subdomain_with_hyphen(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::SUBDOMAIN,
            'acme-corp.stencil.canvastack.com',
            '/'
        );

        $this->assertEquals('acme-corp', $identifier);
    }

    public function test_accepts_path_with_hyphen(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            't/acme-corp'
        );

        $this->assertEquals('acme-corp', $identifier);
    }

    public function test_accepts_path_with_numbers(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            't/acme123'
        );

        $this->assertEquals('acme123', $identifier);
    }

    public function test_can_change_base_domain(): void
    {
        $this->matcher->setBaseDomain('example.com');

        $pattern = $this->matcher->detect('tenant.example.com', '/');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
    }

    public function test_can_change_path_prefix(): void
    {
        $this->matcher->setPathPrefix('tenant');

        $pattern = $this->matcher->detect('stencil.canvastack.com', 'tenant/acmecorp');

        $this->assertEquals(UrlPattern::PATH, $pattern);
    }

    public function test_can_add_excluded_subdomains(): void
    {
        $this->matcher->setExcludedSubdomains(['www', 'api', 'admin', 'platform', 'mail', 'test']);

        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('test.stencil.canvastack.com', '/');
    }

    public function test_getters_return_correct_values(): void
    {
        $this->assertEquals('stencil.canvastack.com', $this->matcher->getBaseDomain());
        $this->assertEquals(['www', 'api', 'admin', 'platform', 'mail'], $this->matcher->getExcludedSubdomains());
        $this->assertEquals('t', $this->matcher->getPathPrefix());
    }

    public function test_fluent_interface_for_base_domain(): void
    {
        $result = $this->matcher->setBaseDomain('newdomain.com');

        $this->assertInstanceOf(UrlPatternMatcher::class, $result);
        $this->assertEquals('newdomain.com', $this->matcher->getBaseDomain());
    }

    public function test_fluent_interface_for_excluded_subdomains(): void
    {
        $result = $this->matcher->setExcludedSubdomains(['www', 'api']);

        $this->assertInstanceOf(UrlPatternMatcher::class, $result);
        $this->assertEquals(['www', 'api'], $this->matcher->getExcludedSubdomains());
    }

    public function test_fluent_interface_for_path_prefix(): void
    {
        $result = $this->matcher->setPathPrefix('tenant');

        $this->assertInstanceOf(UrlPatternMatcher::class, $result);
        $this->assertEquals('tenant', $this->matcher->getPathPrefix());
    }

    public function test_detects_path_pattern_with_trailing_path(): void
    {
        $pattern = $this->matcher->detect('stencil.canvastack.com', 't/acmecorp/dashboard');

        $this->assertEquals(UrlPattern::PATH, $pattern);
    }

    public function test_extracts_path_identifier_with_trailing_path(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            't/acmecorp/dashboard/settings'
        );

        $this->assertEquals('acmecorp', $identifier);
    }

    public function test_throws_exception_for_invalid_path_without_prefix(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->matcher->detect('stencil.canvastack.com', 'acmecorp');
    }

    public function test_custom_domain_with_subdomain(): void
    {
        $pattern = $this->matcher->detect('www.acmecorp.com', '/');

        $this->assertEquals(UrlPattern::CUSTOM_DOMAIN, $pattern);
    }

    public function test_custom_domain_extracts_full_host(): void
    {
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::CUSTOM_DOMAIN,
            'www.acmecorp.com',
            '/'
        );

        $this->assertEquals('www.acmecorp.com', $identifier);
    }

    public function test_detects_pattern_priority_subdomain_over_path(): void
    {
        $pattern = $this->matcher->detect('acmecorp.stencil.canvastack.com', 't/othertenant');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
    }

    public function test_single_letter_subdomain(): void
    {
        $pattern = $this->matcher->detect('a.stencil.canvastack.com', '/');
        
        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
        
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::SUBDOMAIN,
            'a.stencil.canvastack.com',
            '/'
        );
        
        $this->assertEquals('a', $identifier);
    }

    public function test_single_letter_path(): void
    {
        $pattern = $this->matcher->detect('stencil.canvastack.com', 't/a');
        
        $this->assertEquals(UrlPattern::PATH, $pattern);
        
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            't/a'
        );
        
        $this->assertEquals('a', $identifier);
    }

    public function test_complex_custom_domain(): void
    {
        $pattern = $this->matcher->detect('shop.acmecorp.co.uk', '/');

        $this->assertEquals(UrlPattern::CUSTOM_DOMAIN, $pattern);
        
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::CUSTOM_DOMAIN,
            'shop.acmecorp.co.uk',
            '/'
        );
        
        $this->assertEquals('shop.acmecorp.co.uk', $identifier);
    }

    public function test_path_pattern_requires_slash_after_prefix(): void
    {
        $this->expectException(InvalidUrlPatternException::class);
        $this->expectExceptionMessage('Unable to detect URL pattern');

        $this->matcher->detect('stencil.canvastack.com', 't-acmecorp');
    }

    public function test_extract_path_throws_exception_for_invalid_format(): void
    {
        $this->expectException(InvalidUrlPatternException::class);
        $this->expectExceptionMessage('Invalid path-based tenant URL');

        $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            't/'
        );
    }

    public function test_long_subdomain_name(): void
    {
        $longSubdomain = str_repeat('a', 63);
        $pattern = $this->matcher->detect("{$longSubdomain}.stencil.canvastack.com", '/');

        $this->assertEquals(UrlPattern::SUBDOMAIN, $pattern);
        
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::SUBDOMAIN,
            "{$longSubdomain}.stencil.canvastack.com",
            '/'
        );
        
        $this->assertEquals($longSubdomain, $identifier);
    }

    public function test_long_path_slug(): void
    {
        $longSlug = str_repeat('a', 63);
        $pattern = $this->matcher->detect('stencil.canvastack.com', "t/{$longSlug}");

        $this->assertEquals(UrlPattern::PATH, $pattern);
        
        $identifier = $this->matcher->extractIdentifier(
            UrlPattern::PATH,
            'stencil.canvastack.com',
            "t/{$longSlug}"
        );
        
        $this->assertEquals($longSlug, $identifier);
    }
}
