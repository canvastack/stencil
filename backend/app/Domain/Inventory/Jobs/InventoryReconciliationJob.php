<?php

namespace App\Domain\Inventory\Jobs;

use App\Domain\Product\Services\InventoryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

class InventoryReconciliationJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $userId,
        public string $source = 'scheduled'
    ) {
    }

    public function handle(InventoryService $inventoryService): void
    {
        $inventoryService->runBalancingForTenant($this->tenantId, $this->userId, $this->source);
    }
}
