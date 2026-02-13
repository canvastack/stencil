<?php

declare(strict_types=1);

namespace App\Application\Vendor\Commands;

/**
 * Command: Complete Onboarding
 * 
 * Represents the intent to mark vendor onboarding as completed.
 */
final class CompleteOnboardingCommand
{
    public function __construct(
        public readonly int $vendorId,
        public readonly int $tenantId
    ) {
    }
}
