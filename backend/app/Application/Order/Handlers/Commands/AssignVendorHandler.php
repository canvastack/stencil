<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Domain\Order\Entities\PurchaseOrder;

class AssignVendorHandler
{
    public function __construct(
        private AssignVendorUseCase $useCase
    ) {}

    public function handle(AssignVendorCommand $command): PurchaseOrder
    {
        return $this->useCase->execute($command);
    }
}