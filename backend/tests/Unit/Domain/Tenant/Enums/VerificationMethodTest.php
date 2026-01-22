<?php

namespace Tests\Unit\Domain\Tenant\Enums;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Enums\VerificationMethod;
use InvalidArgumentException;

class VerificationMethodTest extends TestCase
{
    public function test_has_dns_txt_case(): void
    {
        $method = VerificationMethod::DNS_TXT;

        $this->assertEquals('dns_txt', $method->value);
    }

    public function test_has_dns_cname_case(): void
    {
        $method = VerificationMethod::DNS_CNAME;

        $this->assertEquals('dns_cname', $method->value);
    }

    public function test_has_file_upload_case(): void
    {
        $method = VerificationMethod::FILE_UPLOAD;

        $this->assertEquals('file_upload', $method->value);
    }

    public function test_dns_txt_label(): void
    {
        $this->assertEquals('DNS TXT Record', VerificationMethod::DNS_TXT->label());
    }

    public function test_dns_cname_label(): void
    {
        $this->assertEquals('DNS CNAME Record', VerificationMethod::DNS_CNAME->label());
    }

    public function test_file_upload_label(): void
    {
        $this->assertEquals('File Upload', VerificationMethod::FILE_UPLOAD->label());
    }

    public function test_all_methods_have_descriptions(): void
    {
        foreach (VerificationMethod::cases() as $method) {
            $description = $method->description();
            $this->assertNotEmpty($description);
        }
    }

    public function test_dns_txt_instructions_contain_token(): void
    {
        $token = 'test-token-123';
        $instructions = VerificationMethod::DNS_TXT->instructions($token);

        $this->assertStringContainsString($token, $instructions);
        $this->assertStringContainsString('TXT', $instructions);
        $this->assertStringContainsString('_canvastencil-verify', $instructions);
    }

    public function test_dns_cname_instructions_contain_token(): void
    {
        $token = 'test-token-123';
        $instructions = VerificationMethod::DNS_CNAME->instructions($token);

        $this->assertStringContainsString($token, $instructions);
        $this->assertStringContainsString('CNAME', $instructions);
    }

    public function test_file_upload_instructions_contain_token(): void
    {
        $token = 'test-token-123';
        $instructions = VerificationMethod::FILE_UPLOAD->instructions($token);

        $this->assertStringContainsString($token, $instructions);
        $this->assertStringContainsString('canvastencil-verify.txt', $instructions);
    }

    public function test_dns_methods_are_dns_methods(): void
    {
        $this->assertTrue(VerificationMethod::DNS_TXT->isDnsMethod());
        $this->assertTrue(VerificationMethod::DNS_CNAME->isDnsMethod());
        $this->assertFalse(VerificationMethod::FILE_UPLOAD->isDnsMethod());
    }

    public function test_only_file_upload_requires_file_access(): void
    {
        $this->assertFalse(VerificationMethod::DNS_TXT->requiresFileAccess());
        $this->assertFalse(VerificationMethod::DNS_CNAME->requiresFileAccess());
        $this->assertTrue(VerificationMethod::FILE_UPLOAD->requiresFileAccess());
    }

    public function test_available_methods_returns_all_methods(): void
    {
        $methods = VerificationMethod::availableMethods();

        $this->assertCount(3, $methods);
        $this->assertContains(VerificationMethod::DNS_TXT, $methods);
        $this->assertContains(VerificationMethod::DNS_CNAME, $methods);
        $this->assertContains(VerificationMethod::FILE_UPLOAD, $methods);
    }

    public function test_can_create_from_string_dns_txt(): void
    {
        $method = VerificationMethod::fromString('dns_txt');

        $this->assertEquals(VerificationMethod::DNS_TXT, $method);
    }

    public function test_can_create_from_string_dns_cname(): void
    {
        $method = VerificationMethod::fromString('dns_cname');

        $this->assertEquals(VerificationMethod::DNS_CNAME, $method);
    }

    public function test_can_create_from_string_file_upload(): void
    {
        $method = VerificationMethod::fromString('file_upload');

        $this->assertEquals(VerificationMethod::FILE_UPLOAD, $method);
    }

    public function test_from_string_is_case_insensitive(): void
    {
        $method1 = VerificationMethod::fromString('DNS_TXT');
        $method2 = VerificationMethod::fromString('Dns_Txt');
        $method3 = VerificationMethod::fromString('dns_txt');

        $this->assertEquals(VerificationMethod::DNS_TXT, $method1);
        $this->assertEquals(VerificationMethod::DNS_TXT, $method2);
        $this->assertEquals(VerificationMethod::DNS_TXT, $method3);
    }

    public function test_from_string_throws_exception_for_invalid_method(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid verification method: invalid');

        VerificationMethod::fromString('invalid');
    }
}
