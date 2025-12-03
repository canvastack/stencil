<?php

namespace App\Application\Order\Handlers\Commands;

use App\Application\Order\UseCases\UpdateProductionProgressUseCase;
use App\Application\Order\Commands\UpdateProductionProgressCommand;
use App\Domain\Order\Entities\Order;

class UpdateProductionProgressHandler
{
    public function __construct(
        private UpdateProductionProgressUseCase $useCase
    ) {}

    public function handle(UpdateProductionProgressCommand $command): Order
    {
        return $this->useCase->execute($command);
    }
}