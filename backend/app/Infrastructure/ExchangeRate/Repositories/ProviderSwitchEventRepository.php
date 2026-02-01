<?php

namespace App\Infrastructure\ExchangeRate\Repositories;

use App\Domain\ExchangeRate\Repositories\ProviderSwitchEventRepositoryInterface;
use App\Models\ProviderSwitchEvent;

class ProviderSwitchEventRepository implements ProviderSwitchEventRepositoryInterface
{
    public function logSwitch(
        int $tenantId,
        ?int $oldProviderId,
        int $newProviderId,
        string $oldProviderName,
        string $newProviderName,
        string $reason
    ): ProviderSwitchEvent {
        return ProviderSwitchEvent::create([
            'tenant_id' => $tenantId,
            'old_provider_id' => $oldProviderId,
            'new_provider_id' => $newProviderId,
            'reason' => $reason,
            'metadata' => [
                'old_provider_name' => $oldProviderName,
                'new_provider_name' => $newProviderName,
            ],
        ]);
    }
}
