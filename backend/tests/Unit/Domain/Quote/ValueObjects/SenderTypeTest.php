<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Quote\ValueObjects;

use PHPUnit\Framework\TestCase;
use App\Domain\Quote\ValueObjects\SenderType;
use InvalidArgumentException;

/**
 * SenderType Value Object Tests
 * 
 * Tests the SenderType value object for message sender types.
 * Covers: admin, vendor types with validation.
 * 
 * Requirements: 13.3, 13.4, 13.5, 23.1
 */
class SenderTypeTest extends TestCase
{
    /** @test */
    public function it_creates_admin_sender_type(): void
    {
        // Arrange & Act
        $senderType = SenderType::admin();
        
        // Assert
        $this->assertEquals('admin', $senderType->toString());
        $this->assertTrue($senderType->isAdmin());
        $this->assertFalse($senderType->isVendor());
    }

    /** @test */
    public function it_creates_vendor_sender_type(): void
    {
        // Arrange & Act
        $senderType = SenderType::vendor();
        
        // Assert
        $this->assertEquals('vendor', $senderType->toString());
        $this->assertFalse($senderType->isAdmin());
        $this->assertTrue($senderType->isVendor());
    }

    /** @test */
    public function it_creates_from_valid_string(): void
    {
        // Arrange & Act
        $admin = SenderType::fromString('admin');
        $vendor = SenderType::fromString('vendor');
        
        // Assert
        $this->assertTrue($admin->isAdmin());
        $this->assertTrue($vendor->isVendor());
    }

    /** @test */
    public function it_throws_exception_for_invalid_type(): void
    {
        // Arrange
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid sender type: customer');
        
        // Act
        SenderType::fromString('customer');
    }

    /** @test */
    public function it_compares_equality_correctly(): void
    {
        // Arrange
        $admin1 = SenderType::admin();
        $admin2 = SenderType::admin();
        $vendor = SenderType::vendor();
        
        // Act & Assert
        $this->assertTrue($admin1->equals($admin2));
        $this->assertFalse($admin1->equals($vendor));
    }

    /** @test */
    public function it_converts_to_string(): void
    {
        // Arrange
        $admin = SenderType::admin();
        $vendor = SenderType::vendor();
        
        // Act & Assert
        $this->assertEquals('admin', (string) $admin);
        $this->assertEquals('vendor', (string) $vendor);
    }
}
