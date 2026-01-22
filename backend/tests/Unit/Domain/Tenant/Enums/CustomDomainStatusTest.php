<?php

namespace Tests\Unit\Domain\Tenant\Enums;

use PHPUnit\Framework\TestCase;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use InvalidArgumentException;

class CustomDomainStatusTest extends TestCase
{
    public function test_has_pending_verification_case(): void
    {
        $status = CustomDomainStatus::PENDING_VERIFICATION;

        $this->assertEquals('pending_verification', $status->value);
    }

    public function test_has_verified_case(): void
    {
        $status = CustomDomainStatus::VERIFIED;

        $this->assertEquals('verified', $status->value);
    }

    public function test_has_active_case(): void
    {
        $status = CustomDomainStatus::ACTIVE;

        $this->assertEquals('active', $status->value);
    }

    public function test_has_failed_case(): void
    {
        $status = CustomDomainStatus::FAILED;

        $this->assertEquals('failed', $status->value);
    }

    public function test_has_suspended_case(): void
    {
        $status = CustomDomainStatus::SUSPENDED;

        $this->assertEquals('suspended', $status->value);
    }

    public function test_pending_verification_label(): void
    {
        $this->assertEquals('Pending Verification', CustomDomainStatus::PENDING_VERIFICATION->label());
    }

    public function test_verified_label(): void
    {
        $this->assertEquals('Verified', CustomDomainStatus::VERIFIED->label());
    }

    public function test_active_label(): void
    {
        $this->assertEquals('Active', CustomDomainStatus::ACTIVE->label());
    }

    public function test_failed_label(): void
    {
        $this->assertEquals('Failed', CustomDomainStatus::FAILED->label());
    }

    public function test_suspended_label(): void
    {
        $this->assertEquals('Suspended', CustomDomainStatus::SUSPENDED->label());
    }

    public function test_all_statuses_have_descriptions(): void
    {
        foreach (CustomDomainStatus::cases() as $status) {
            $description = $status->description();
            $this->assertNotEmpty($description);
        }
    }

    public function test_verified_and_active_are_verified(): void
    {
        $this->assertFalse(CustomDomainStatus::PENDING_VERIFICATION->isVerified());
        $this->assertTrue(CustomDomainStatus::VERIFIED->isVerified());
        $this->assertTrue(CustomDomainStatus::ACTIVE->isVerified());
        $this->assertFalse(CustomDomainStatus::FAILED->isVerified());
        $this->assertFalse(CustomDomainStatus::SUSPENDED->isVerified());
    }

    public function test_only_active_is_operational(): void
    {
        $this->assertFalse(CustomDomainStatus::PENDING_VERIFICATION->isOperational());
        $this->assertFalse(CustomDomainStatus::VERIFIED->isOperational());
        $this->assertTrue(CustomDomainStatus::ACTIVE->isOperational());
        $this->assertFalse(CustomDomainStatus::FAILED->isOperational());
        $this->assertFalse(CustomDomainStatus::SUSPENDED->isOperational());
    }

    public function test_only_verified_can_be_activated(): void
    {
        $this->assertFalse(CustomDomainStatus::PENDING_VERIFICATION->canBeActivated());
        $this->assertTrue(CustomDomainStatus::VERIFIED->canBeActivated());
        $this->assertFalse(CustomDomainStatus::ACTIVE->canBeActivated());
        $this->assertFalse(CustomDomainStatus::FAILED->canBeActivated());
        $this->assertFalse(CustomDomainStatus::SUSPENDED->canBeActivated());
    }

    public function test_pending_and_failed_can_be_verified(): void
    {
        $this->assertTrue(CustomDomainStatus::PENDING_VERIFICATION->canBeVerified());
        $this->assertFalse(CustomDomainStatus::VERIFIED->canBeVerified());
        $this->assertFalse(CustomDomainStatus::ACTIVE->canBeVerified());
        $this->assertTrue(CustomDomainStatus::FAILED->canBeVerified());
        $this->assertFalse(CustomDomainStatus::SUSPENDED->canBeVerified());
    }

    public function test_verified_and_active_can_be_suspended(): void
    {
        $this->assertFalse(CustomDomainStatus::PENDING_VERIFICATION->canBeSuspended());
        $this->assertTrue(CustomDomainStatus::VERIFIED->canBeSuspended());
        $this->assertTrue(CustomDomainStatus::ACTIVE->canBeSuspended());
        $this->assertFalse(CustomDomainStatus::FAILED->canBeSuspended());
        $this->assertFalse(CustomDomainStatus::SUSPENDED->canBeSuspended());
    }

    public function test_available_statuses_returns_all_statuses(): void
    {
        $statuses = CustomDomainStatus::availableStatuses();

        $this->assertCount(5, $statuses);
        $this->assertContains(CustomDomainStatus::PENDING_VERIFICATION, $statuses);
        $this->assertContains(CustomDomainStatus::VERIFIED, $statuses);
        $this->assertContains(CustomDomainStatus::ACTIVE, $statuses);
        $this->assertContains(CustomDomainStatus::FAILED, $statuses);
        $this->assertContains(CustomDomainStatus::SUSPENDED, $statuses);
    }

    public function test_can_create_from_string_pending_verification(): void
    {
        $status = CustomDomainStatus::fromString('pending_verification');

        $this->assertEquals(CustomDomainStatus::PENDING_VERIFICATION, $status);
    }

    public function test_can_create_from_string_verified(): void
    {
        $status = CustomDomainStatus::fromString('verified');

        $this->assertEquals(CustomDomainStatus::VERIFIED, $status);
    }

    public function test_can_create_from_string_active(): void
    {
        $status = CustomDomainStatus::fromString('active');

        $this->assertEquals(CustomDomainStatus::ACTIVE, $status);
    }

    public function test_can_create_from_string_failed(): void
    {
        $status = CustomDomainStatus::fromString('failed');

        $this->assertEquals(CustomDomainStatus::FAILED, $status);
    }

    public function test_can_create_from_string_suspended(): void
    {
        $status = CustomDomainStatus::fromString('suspended');

        $this->assertEquals(CustomDomainStatus::SUSPENDED, $status);
    }

    public function test_from_string_is_case_insensitive(): void
    {
        $status1 = CustomDomainStatus::fromString('ACTIVE');
        $status2 = CustomDomainStatus::fromString('Active');
        $status3 = CustomDomainStatus::fromString('active');

        $this->assertEquals(CustomDomainStatus::ACTIVE, $status1);
        $this->assertEquals(CustomDomainStatus::ACTIVE, $status2);
        $this->assertEquals(CustomDomainStatus::ACTIVE, $status3);
    }

    public function test_from_string_throws_exception_for_invalid_status(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid custom domain status: invalid');

        CustomDomainStatus::fromString('invalid');
    }
}
