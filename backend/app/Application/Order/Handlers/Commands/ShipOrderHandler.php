<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\ShipOrderUseCase;
use App\Application\Order\Commands\ShipOrderCommand;
use App\Domain\Order\Entities\Order;

class ShipOrderHandler
{
    public function __construct(
        private ShipOrderUseCase $useCase
    ) {}

    public function handle(ShipOrderCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}