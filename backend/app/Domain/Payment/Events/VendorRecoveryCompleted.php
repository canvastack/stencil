<?php

namespace App\Domain\Payment\Events;

use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VendorRecoveryCompleted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public VendorLiability $liability,
        public float $recoveredAmount,
        public User $recordedBy
    ) {}
}