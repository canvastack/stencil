<?php

namespace Tests\Feature\ExchangeRate;

use App\Models\ExchangeRateSetting;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExchangeRateSettingFactoryTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function can_create_exchange_rate_setting_with_factory(): void
    {
        $tenant = TenantEloquentModel::factory()->create();
        
        $setting = ExchangeRateSetting::factory()->manual()->withRate(15000.0)->create([
            'tenant_id' => $tenant->id,
        ]);
        
        $this->assertNotNull($setting->id);
        $this->assertEquals($tenant->id, $setting->tenant_id);
        $this->assertEquals(15000.0, $setting->current_rate);
        $this->assertEquals('manual', $setting->mode);
    }
}
