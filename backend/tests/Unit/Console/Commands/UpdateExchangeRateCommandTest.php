<?php

namespace Tests\Unit\Console\Commands;

use App\Application\ExchangeRate\Services\ExchangeRateService;
use App\Console\Commands\UpdateExchangeRateCommand;
use App\Domain\ExchangeRate\Entities\ExchangeRate;
use App\Models\ExchangeRateSetting;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Tests\TestCase;
use Exception;

class UpdateExchangeRateCommandTest extends TestCase
{
    use RefreshDatabase;

    private $exchangeRateServiceMock;
    private $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test tenant using factory
        $this->tenant = Tenant::factory()->create();

        $this->exchangeRateServiceMock = $this->createMock(ExchangeRateService::class);
        $this->app->instance(ExchangeRateService::class, $this->exchangeRateServiceMock);
    }

    public function test_command_succeeds_when_no_tenants_have_auto_update_enabled(): void
    {
        $this->artisan('exchange-rate:update')
            ->expectsOutput('Starting exchange rate update...')
            ->expectsOutput('Updating exchange rates for all tenants with auto-update enabled')
            ->expectsOutput('No tenants found with auto-update enabled in auto mode')
            ->assertExitCode(0);
    }

    public function test_command_updates_rate_for_tenant_with_auto_update_enabled(): void
    {
        // Create a tenant with auto-update enabled
        $setting = ExchangeRateSetting::create([
            'tenant_id' => $this->tenant->id,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'current_rate' => 15000.0000,
        ]);

        // Mock the exchange rate service
        $exchangeRate = new ExchangeRate(
            15500.0000,
            now(),
            'api',
            'exchangerate-api.com'
        );

        $this->exchangeRateServiceMock
            ->expects($this->once())
            ->method('updateRate')
            ->with($this->tenant->id)
            ->willReturn($exchangeRate);

        $this->artisan('exchange-rate:update')
            ->expectsOutput('Starting exchange rate update...')
            ->expectsOutput("Processing tenant ID: {$this->tenant->id}")
            ->assertExitCode(0);

        // Verify the setting was updated
        $setting->refresh();
        $this->assertEquals(15500.0000, $setting->current_rate);
    }

    public function test_command_handles_errors_gracefully(): void
    {
        // Create a tenant with auto-update enabled
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenant->id,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'current_rate' => 15000.0000,
        ]);

        // Mock the exchange rate service to throw an exception
        $this->exchangeRateServiceMock
            ->expects($this->once())
            ->method('updateRate')
            ->with($this->tenant->id)
            ->willThrowException(new Exception('API connection failed'));

        Log::shouldReceive('error')
            ->once()
            ->with('Exchange rate update failed', \Mockery::type('array'));

        $this->artisan('exchange-rate:update')
            ->expectsOutput('Starting exchange rate update...')
            ->expectsOutput("Processing tenant ID: {$this->tenant->id}")
            ->assertExitCode(1);
    }

    public function test_command_filters_by_tenant_id_when_provided(): void
    {
        // Create two tenants with auto-update enabled
        $tenant2 = Tenant::factory()->create();
        
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenant->id,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'current_rate' => 15000.0000,
        ]);

        ExchangeRateSetting::create([
            'tenant_id' => $tenant2->id,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'current_rate' => 15000.0000,
        ]);

        // Mock the exchange rate service - should only be called once for tenant 1
        $exchangeRate = new ExchangeRate(
            15500.0000,
            now(),
            'api',
            'exchangerate-api.com'
        );

        $this->exchangeRateServiceMock
            ->expects($this->once())
            ->method('updateRate')
            ->with($this->tenant->id)
            ->willReturn($exchangeRate);

        $this->artisan('exchange-rate:update', ['--tenant' => $this->tenant->id])
            ->expectsOutput("Updating exchange rate for tenant ID: {$this->tenant->id}")
            ->expectsOutput("Processing tenant ID: {$this->tenant->id}")
            ->assertExitCode(0);
    }

    public function test_command_skips_manual_mode_tenants(): void
    {
        // Create a tenant with manual mode
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenant->id,
            'mode' => 'manual',
            'auto_update_enabled' => true,
            'manual_rate' => 15000.0000,
        ]);

        // Service should not be called
        $this->exchangeRateServiceMock
            ->expects($this->never())
            ->method('updateRate');

        $this->artisan('exchange-rate:update')
            ->expectsOutput('No tenants found with auto-update enabled in auto mode')
            ->assertExitCode(0);
    }

    public function test_command_skips_tenants_with_auto_update_disabled(): void
    {
        // Create a tenant with auto-update disabled
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenant->id,
            'mode' => 'auto',
            'auto_update_enabled' => false,
            'current_rate' => 15000.0000,
        ]);

        // Service should not be called
        $this->exchangeRateServiceMock
            ->expects($this->never())
            ->method('updateRate');

        $this->artisan('exchange-rate:update')
            ->expectsOutput('No tenants found with auto-update enabled in auto mode')
            ->assertExitCode(0);
    }
}
