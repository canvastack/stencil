<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\CancelOrderUseCase;
use App\Application\Order\Commands\CancelOrderCommand;
use App\Domain\Order\Entities\Order;

class CancelOrderHandler
{
    public function __construct(
        private CancelOrderUseCase $useCase
    ) {}

    public function handle(CancelOrderCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}