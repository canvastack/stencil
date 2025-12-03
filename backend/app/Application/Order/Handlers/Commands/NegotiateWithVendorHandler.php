<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Domain\Order\Entities\Order;

class NegotiateWithVendorHandler
{
    public function __construct(
        private NegotiateWithVendorUseCase $useCase
    ) {}

    public function handle(NegotiateWithVendorCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}