<?php

namespace Tests\Unit\Domain\Tenant\ValueObjects;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\ValueObjects\UrlPath;
use InvalidArgumentException;

class UrlPathTest extends TestCase
{
    public function test_can_create_valid_url_path(): void
    {
        $path = new UrlPath('my-tenant');

        $this->assertEquals('my-tenant', $path->getValue());
    }

    public function test_trims_leading_and_trailing_slashes(): void
    {
        $path = new UrlPath('/my-tenant/');

        $this->assertEquals('my-tenant', $path->getValue());
    }

    public function test_accepts_lowercase_path(): void
    {
        $path = new UrlPath('mytenant');

        $this->assertEquals('mytenant', $path->getValue());
    }

    public function test_get_with_leading_slash(): void
    {
        $path = new UrlPath('my-tenant');

        $this->assertEquals('/my-tenant', $path->getWithLeadingSlash());
    }

    public function test_can_compare_paths_for_equality(): void
    {
        $path1 = new UrlPath('my-tenant');
        $path2 = new UrlPath('my-tenant');

        $this->assertTrue($path1->equals($path2));
    }

    public function test_different_paths_are_not_equal(): void
    {
        $path1 = new UrlPath('tenant-one');
        $path2 = new UrlPath('tenant-two');

        $this->assertFalse($path1->equals($path2));
    }

    public function test_can_convert_to_string(): void
    {
        $path = new UrlPath('my-tenant');

        $this->assertEquals('my-tenant', (string) $path);
    }

    public function test_throws_exception_when_empty(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path cannot be empty');

        new UrlPath('');
    }

    public function test_throws_exception_when_only_slashes(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path cannot be empty');

        new UrlPath('///');
    }

    public function test_throws_exception_when_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path cannot exceed 100 characters');

        new UrlPath(str_repeat('a', 101));
    }

    public function test_throws_exception_with_invalid_characters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path can only contain lowercase letters, numbers, hyphens, and underscores');

        new UrlPath('my tenant!');
    }

    public function test_throws_exception_with_uppercase_letters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path can only contain lowercase letters, numbers, hyphens, and underscores');

        new UrlPath('MY-TENANT');
    }

    public function test_throws_exception_when_starts_with_number(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path cannot start with a number');

        new UrlPath('123tenant');
    }

    public function test_allows_numbers_after_first_character(): void
    {
        $path = new UrlPath('tenant123');

        $this->assertEquals('tenant123', $path->getValue());
    }

    public function test_allows_hyphens(): void
    {
        $path = new UrlPath('my-tenant-path');

        $this->assertEquals('my-tenant-path', $path->getValue());
    }

    public function test_allows_underscores(): void
    {
        $path = new UrlPath('my_tenant_path');

        $this->assertEquals('my_tenant_path', $path->getValue());
    }

    public function test_throws_exception_for_reserved_path_api(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path is reserved and cannot be used');

        new UrlPath('api');
    }

    public function test_throws_exception_for_reserved_path_admin(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path is reserved and cannot be used');

        new UrlPath('admin');
    }

    public function test_throws_exception_for_reserved_path_dashboard(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path is reserved and cannot be used');

        new UrlPath('dashboard');
    }

    public function test_throws_exception_for_reserved_path_login(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path is reserved and cannot be used');

        new UrlPath('login');
    }

    public function test_throws_exception_for_reserved_path_logout(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path is reserved and cannot be used');

        new UrlPath('logout');
    }

    public function test_throws_exception_for_reserved_path_register(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('URL path is reserved and cannot be used');

        new UrlPath('register');
    }

    public function test_accepts_valid_tenant_path(): void
    {
        $validPaths = [
            'acmecorp',
            'tenant-one',
            'my_company',
            'store123',
            'test-tenant_01',
        ];

        foreach ($validPaths as $pathValue) {
            $path = new UrlPath($pathValue);
            $this->assertInstanceOf(UrlPath::class, $path);
        }
    }

    public function test_accepts_maximum_length(): void
    {
        $path = new UrlPath(str_repeat('a', 100));

        $this->assertEquals(100, strlen($path->getValue()));
    }
}
