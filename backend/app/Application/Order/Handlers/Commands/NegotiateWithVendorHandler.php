<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Domain\Order\Entities\PurchaseOrder;

class NegotiateWithVendorHandler
{
    public function __construct(
        private NegotiateWithVendorUseCase $useCase
    ) {}

    public function handle(NegotiateWithVendorCommand $command): PurchaseOrder
    {
        return $this->useCase->execute($command);
    }
}