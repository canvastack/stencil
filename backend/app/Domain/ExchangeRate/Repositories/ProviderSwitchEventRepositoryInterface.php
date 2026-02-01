<?php

namespace App\Domain\ExchangeRate\Repositories;

use App\Models\ProviderSwitchEvent;

interface ProviderSwitchEventRepositoryInterface
{
    public function logSwitch(
        int $tenantId,
        ?int $oldProviderId,
        int $newProviderId,
        string $oldProviderName,
        string $newProviderName,
        string $reason
    ): ProviderSwitchEvent;
}
