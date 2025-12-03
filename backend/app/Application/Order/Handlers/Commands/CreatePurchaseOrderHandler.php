<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Domain\Order\Entities\Order;

class CreatePurchaseOrderHandler
{
    public function __construct(
        private CreatePurchaseOrderUseCase $useCase
    ) {}

    public function handle(CreatePurchaseOrderCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}