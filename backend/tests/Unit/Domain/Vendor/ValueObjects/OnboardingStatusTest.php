<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Vendor\ValueObjects;

use PHPUnit\Framework\TestCase;
use App\Domain\Vendor\ValueObjects\OnboardingStatus;
use InvalidArgumentException;

/**
 * OnboardingStatus Value Object Tests
 * 
 * Tests the OnboardingStatus value object for vendor onboarding states.
 * Covers: pending, in_progress, completed states with validation.
 * 
 * Requirements: 17.1, 17.7, 23.1
 */
class OnboardingStatusTest extends TestCase
{
    /** @test */
    public function it_creates_pending_status(): void
    {
        // Arrange & Act
        $status = OnboardingStatus::pending();
        
        // Assert
        $this->assertEquals('pending', $status->toString());
        $this->assertTrue($status->isPending());
        $this->assertFalse($status->isInProgress());
        $this->assertFalse($status->isCompleted());
    }

    /** @test */
    public function it_creates_in_progress_status(): void
    {
        // Arrange & Act
        $status = OnboardingStatus::inProgress();
        
        // Assert
        $this->assertEquals('in_progress', $status->toString());
        $this->assertFalse($status->isPending());
        $this->assertTrue($status->isInProgress());
        $this->assertFalse($status->isCompleted());
    }

    /** @test */
    public function it_creates_completed_status(): void
    {
        // Arrange & Act
        $status = OnboardingStatus::completed();
        
        // Assert
        $this->assertEquals('completed', $status->toString());
        $this->assertFalse($status->isPending());
        $this->assertFalse($status->isInProgress());
        $this->assertTrue($status->isCompleted());
    }

    /** @test */
    public function it_creates_from_valid_string(): void
    {
        // Arrange & Act
        $pending = OnboardingStatus::fromString('pending');
        $inProgress = OnboardingStatus::fromString('in_progress');
        $completed = OnboardingStatus::fromString('completed');
        
        // Assert
        $this->assertTrue($pending->isPending());
        $this->assertTrue($inProgress->isInProgress());
        $this->assertTrue($completed->isCompleted());
    }

    /** @test */
    public function it_throws_exception_for_invalid_status(): void
    {
        // Arrange
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid onboarding status: invalid');
        
        // Act
        OnboardingStatus::fromString('invalid');
    }

    /** @test */
    public function it_compares_equality_correctly(): void
    {
        // Arrange
        $pending1 = OnboardingStatus::pending();
        $pending2 = OnboardingStatus::pending();
        $completed = OnboardingStatus::completed();
        
        // Act & Assert
        $this->assertTrue($pending1->equals($pending2));
        $this->assertFalse($pending1->equals($completed));
    }

    /** @test */
    public function it_converts_to_string(): void
    {
        // Arrange
        $pending = OnboardingStatus::pending();
        $inProgress = OnboardingStatus::inProgress();
        $completed = OnboardingStatus::completed();
        
        // Act & Assert
        $this->assertEquals('pending', (string) $pending);
        $this->assertEquals('in_progress', (string) $inProgress);
        $this->assertEquals('completed', (string) $completed);
    }

    /** @test */
    public function it_throws_exception_for_case_sensitive_input(): void
    {
        // Arrange
        $this->expectException(InvalidArgumentException::class);
        
        // Act - OnboardingStatus is case-sensitive
        OnboardingStatus::fromString('PENDING');
    }
}
