<?php

namespace App\Domain\Payment\Events;

use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Models\PaymentRefund;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VendorLiabilityCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public VendorLiability $liability,
        public ?PaymentRefund $refund,
        public ?User $createdBy
    ) {}
}