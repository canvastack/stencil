<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Domain\Order\Entities\Order;

class AssignVendorHandler
{
    public function __construct(
        private AssignVendorUseCase $useCase
    ) {}

    public function handle(AssignVendorCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}