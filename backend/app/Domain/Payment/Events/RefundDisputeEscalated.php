<?php

namespace App\Domain\Payment\Events;

use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RefundDisputeEscalated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public RefundDispute $dispute,
        public User $escalatedBy
    ) {}
}