<?php

namespace Tests\Unit\Domain\Tenant\ValueObjects;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\ValueObjects\DomainVerificationToken;
use InvalidArgumentException;

class DomainVerificationTokenTest extends TestCase
{
    public function test_can_generate_verification_token(): void
    {
        $token = DomainVerificationToken::generate();

        $this->assertInstanceOf(DomainVerificationToken::class, $token);
        $this->assertNotEmpty($token->getValue());
        $this->assertEquals(64, strlen($token->getValue()));
    }

    public function test_generated_tokens_are_unique(): void
    {
        $token1 = DomainVerificationToken::generate();
        $token2 = DomainVerificationToken::generate();

        $this->assertNotEquals($token1->getValue(), $token2->getValue());
    }

    public function test_can_create_from_string(): void
    {
        $value = str_repeat('a', 64);
        $token = DomainVerificationToken::fromString($value);

        $this->assertEquals($value, $token->getValue());
    }

    public function test_throws_exception_when_empty(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Domain verification token cannot be empty');

        new DomainVerificationToken('');
    }

    public function test_throws_exception_when_whitespace_only(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Domain verification token cannot be empty');

        new DomainVerificationToken('   ');
    }

    public function test_throws_exception_when_too_short(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Domain verification token must be at least 32 characters');

        new DomainVerificationToken('short');
    }

    public function test_throws_exception_when_too_long(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Domain verification token cannot exceed 255 characters');

        new DomainVerificationToken(str_repeat('a', 256));
    }

    public function test_throws_exception_with_invalid_characters(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Domain verification token must contain only alphanumeric characters');

        new DomainVerificationToken(str_repeat('a', 32) . '!@#$');
    }

    public function test_accepts_alphanumeric_only(): void
    {
        $value = 'abc123XYZ' . str_repeat('0', 23);
        $token = new DomainVerificationToken($value);

        $this->assertEquals($value, $token->getValue());
    }

    public function test_can_compare_tokens_for_equality(): void
    {
        $value = str_repeat('a', 64);
        $token1 = new DomainVerificationToken($value);
        $token2 = new DomainVerificationToken($value);

        $this->assertTrue($token1->equals($token2));
    }

    public function test_different_tokens_are_not_equal(): void
    {
        $token1 = new DomainVerificationToken(str_repeat('a', 64));
        $token2 = new DomainVerificationToken(str_repeat('b', 64));

        $this->assertFalse($token1->equals($token2));
    }

    public function test_can_convert_to_string(): void
    {
        $value = str_repeat('a', 64);
        $token = new DomainVerificationToken($value);

        $this->assertEquals($value, (string) $token);
    }

    public function test_accepts_minimum_length(): void
    {
        $value = str_repeat('a', 32);
        $token = new DomainVerificationToken($value);

        $this->assertEquals($value, $token->getValue());
    }

    public function test_accepts_maximum_length(): void
    {
        $value = str_repeat('a', 255);
        $token = new DomainVerificationToken($value);

        $this->assertEquals($value, $token->getValue());
    }
}
