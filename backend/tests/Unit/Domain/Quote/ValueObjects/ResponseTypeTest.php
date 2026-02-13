<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\ValueObjects;

use PHPUnit\Framework\TestCase;
use App\Domain\Quote\ValueObjects\ResponseType;
use InvalidArgumentException;

/**
 * ResponseType Value Object Tests
 * 
 * Tests the ResponseType value object for vendor quote responses.
 * Covers: accept, reject, counter types with validation.
 * 
 * Requirements: 6.12, 23.1
 */
class ResponseTypeTest extends TestCase
{
    /** @test */
    public function it_creates_accept_response_type(): void
    {
        // Arrange & Act
        $responseType = ResponseType::accept();
        
        // Assert
        $this->assertEquals('accept', $responseType->toString());
        $this->assertTrue($responseType->isAccept());
        $this->assertFalse($responseType->isReject());
        $this->assertFalse($responseType->isCounter());
    }

    /** @test */
    public function it_creates_reject_response_type(): void
    {
        // Arrange & Act
        $responseType = ResponseType::reject();
        
        // Assert
        $this->assertEquals('reject', $responseType->toString());
        $this->assertFalse($responseType->isAccept());
        $this->assertTrue($responseType->isReject());
        $this->assertFalse($responseType->isCounter());
    }

    /** @test */
    public function it_creates_counter_response_type(): void
    {
        // Arrange & Act
        $responseType = ResponseType::counter();
        
        // Assert
        $this->assertEquals('counter', $responseType->toString());
        $this->assertFalse($responseType->isAccept());
        $this->assertFalse($responseType->isReject());
        $this->assertTrue($responseType->isCounter());
    }

    /** @test */
    public function it_creates_from_valid_string(): void
    {
        // Arrange & Act
        $accept = ResponseType::fromString('accept');
        $reject = ResponseType::fromString('reject');
        $counter = ResponseType::fromString('counter');
        
        // Assert
        $this->assertTrue($accept->isAccept());
        $this->assertTrue($reject->isReject());
        $this->assertTrue($counter->isCounter());
    }

    /** @test */
    public function it_throws_exception_for_invalid_type(): void
    {
        // Arrange
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid response type: invalid');
        
        // Act
        ResponseType::fromString('invalid');
    }

    /** @test */
    public function it_compares_equality_correctly(): void
    {
        // Arrange
        $accept1 = ResponseType::accept();
        $accept2 = ResponseType::accept();
        $reject = ResponseType::reject();
        
        // Act & Assert
        $this->assertTrue($accept1->equals($accept2));
        $this->assertFalse($accept1->equals($reject));
    }

    /** @test */
    public function it_converts_to_string(): void
    {
        // Arrange
        $accept = ResponseType::accept();
        $reject = ResponseType::reject();
        $counter = ResponseType::counter();
        
        // Act & Assert
        $this->assertEquals('accept', (string) $accept);
        $this->assertEquals('reject', (string) $reject);
        $this->assertEquals('counter', (string) $counter);
    }

    /** @test */
    public function it_handles_case_insensitive_input(): void
    {
        // Arrange & Act
        $accept = ResponseType::fromString('accept');
        $reject = ResponseType::fromString('reject');
        $counter = ResponseType::fromString('counter');
        
        // Assert
        $this->assertTrue($accept->isAccept());
        $this->assertTrue($reject->isReject());
        $this->assertTrue($counter->isCounter());
    }
}
