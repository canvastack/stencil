<?php

namespace Tests\Unit\Console\Commands;

use App\Application\TenantConfiguration\Services\SSLCertificateService;
use App\Console\Commands\RenewSSLCertificatesCommand;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class RenewSSLCertificatesCommandTest extends TestCase
{
    use RefreshDatabase;

    private $sslServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sslServiceMock = $this->createMock(SSLCertificateService::class);
        $this->app->instance(SSLCertificateService::class, $this->sslServiceMock);
    }

    public function test_command_succeeds_when_no_certificates_need_renewal(): void
    {
        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(30)
            ->willReturn([]);

        $this->artisan('ssl:renew')
            ->expectsOutput('🔒 SSL Certificate Renewal Process Started')
            ->expectsOutput('✅ No certificates need renewal at this time')
            ->assertExitCode(0);
    }

    public function test_command_renews_expiring_certificates(): void
    {
        $expiringDomains = [
            [
                'uuid' => 'test-uuid-1',
                'domain_name' => 'expiring1.com',
                'ssl_certificate_expires_at' => now()->addDays(15),
                'days_until_expiry' => 15,
                'auto_renew_ssl' => true,
                'is_expired' => false,
            ],
            [
                'uuid' => 'test-uuid-2',
                'domain_name' => 'expiring2.com',
                'ssl_certificate_expires_at' => now()->addDays(10),
                'days_until_expiry' => 10,
                'auto_renew_ssl' => true,
                'is_expired' => false,
            ],
        ];

        $renewalResults = [
            'total' => 2,
            'renewed' => 2,
            'failed' => 0,
            'skipped' => 0,
            'details' => [
                [
                    'domain' => 'expiring1.com',
                    'status' => 'renewed',
                    'new_expiry' => now()->addDays(90),
                ],
                [
                    'domain' => 'expiring2.com',
                    'status' => 'renewed',
                    'new_expiry' => now()->addDays(90),
                ],
            ],
        ];

        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(30)
            ->willReturn($expiringDomains);

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewExpiringCertificates')
            ->with(30)
            ->willReturn($renewalResults);

        $this->artisan('ssl:renew')
            ->expectsOutput('🔒 SSL Certificate Renewal Process Started')
            ->assertExitCode(0);
    }

    public function test_command_handles_renewal_failures(): void
    {
        $expiringDomains = [
            [
                'uuid' => 'test-uuid-1',
                'domain_name' => 'failing.com',
                'ssl_certificate_expires_at' => now()->addDays(15),
                'days_until_expiry' => 15,
                'auto_renew_ssl' => true,
                'is_expired' => false,
            ],
        ];

        $renewalResults = [
            'total' => 1,
            'renewed' => 0,
            'failed' => 1,
            'skipped' => 0,
            'details' => [
                [
                    'domain' => 'failing.com',
                    'status' => 'failed',
                    'error' => 'Network timeout',
                ],
            ],
        ];

        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(30)
            ->willReturn($expiringDomains);

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewExpiringCertificates')
            ->with(30)
            ->willReturn($renewalResults);

        $this->artisan('ssl:renew')
            ->assertExitCode(1);
    }

    public function test_command_respects_custom_days_threshold(): void
    {
        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(15)
            ->willReturn([]);

        $this->artisan('ssl:renew', ['--days' => 15])
            ->assertExitCode(0);
    }

    public function test_command_handles_specific_domain_renewal_success(): void
    {
        $renewalResult = [
            'success' => true,
            'domain' => [
                'domain_name' => 'specific.com',
                'ssl_certificate_expires_at' => now()->addDays(90),
            ],
        ];

        $this->sslServiceMock
            ->expects($this->never())
            ->method('getExpiringCertificates');

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->with('test-uuid-123')
            ->willReturn($renewalResult);

        $this->artisan('ssl:renew', ['--domain' => 'test-uuid-123'])
            ->expectsOutput('✅ Certificate renewed successfully')
            ->assertExitCode(0);
    }

    public function test_command_handles_specific_domain_renewal_failure(): void
    {
        $renewalResult = [
            'success' => false,
            'error' => 'Domain not found',
        ];

        $this->sslServiceMock
            ->expects($this->never())
            ->method('getExpiringCertificates');

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->with('test-uuid-123')
            ->willReturn($renewalResult);

        $this->artisan('ssl:renew', ['--domain' => 'test-uuid-123'])
            ->assertExitCode(1);
    }

    public function test_command_handles_exception_during_specific_domain_renewal(): void
    {
        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->with('test-uuid-123')
            ->willThrowException(new \RuntimeException('Database connection failed'));

        Log::shouldReceive('error')
            ->once()
            ->with('[RenewSSLCertificatesCommand] Domain renewal failed', \Mockery::type('array'));

        $this->artisan('ssl:renew', ['--domain' => 'test-uuid-123'])
            ->assertExitCode(1);
    }

    public function test_command_displays_table_with_expiring_certificates(): void
    {
        $expiringDomains = [
            [
                'uuid' => 'test-uuid-1',
                'domain_name' => 'expiring.com',
                'ssl_certificate_expires_at' => now()->addDays(15),
                'days_until_expiry' => 15,
                'auto_renew_ssl' => true,
                'is_expired' => false,
            ],
        ];

        $renewalResults = [
            'total' => 1,
            'renewed' => 1,
            'failed' => 0,
            'skipped' => 0,
            'details' => [
                [
                    'domain' => 'expiring.com',
                    'status' => 'renewed',
                ],
            ],
        ];

        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(30)
            ->willReturn($expiringDomains);

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewExpiringCertificates')
            ->with(30)
            ->willReturn($renewalResults);

        $this->artisan('ssl:renew')
            ->expectsTable(
                ['Domain', 'Expires At', 'Days Left', 'Auto-Renew', 'Status'],
                [
                    [
                        'expiring.com',
                        now()->addDays(15)->format('Y-m-d H:i:s'),
                        15,
                        '✓',
                        '🟡 Expiring Soon',
                    ],
                ]
            )
            ->assertExitCode(0);
    }

    public function test_command_shows_expired_certificate_status(): void
    {
        $expiringDomains = [
            [
                'uuid' => 'test-uuid-1',
                'domain_name' => 'expired.com',
                'ssl_certificate_expires_at' => now()->subDays(5),
                'days_until_expiry' => -5,
                'auto_renew_ssl' => false,
                'is_expired' => true,
            ],
        ];

        $renewalResults = [
            'total' => 1,
            'renewed' => 0,
            'failed' => 0,
            'skipped' => 1,
            'details' => [
                [
                    'domain' => 'expired.com',
                    'status' => 'skipped',
                    'reason' => 'Auto-renewal disabled',
                ],
            ],
        ];

        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(30)
            ->willReturn($expiringDomains);

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewExpiringCertificates')
            ->with(30)
            ->willReturn($renewalResults);

        $this->artisan('ssl:renew')
            ->expectsTable(
                ['Domain', 'Expires At', 'Days Left', 'Auto-Renew', 'Status'],
                [
                    [
                        'expired.com',
                        now()->subDays(5)->format('Y-m-d H:i:s'),
                        -5,
                        '✗',
                        '🔴 Expired',
                    ],
                ]
            )
            ->assertExitCode(0);
    }

    public function test_command_handles_mixed_renewal_results(): void
    {
        $expiringDomains = [
            [
                'uuid' => 'test-uuid-1',
                'domain_name' => 'renewed.com',
                'ssl_certificate_expires_at' => now()->addDays(15),
                'days_until_expiry' => 15,
                'auto_renew_ssl' => true,
                'is_expired' => false,
            ],
            [
                'uuid' => 'test-uuid-2',
                'domain_name' => 'failed.com',
                'ssl_certificate_expires_at' => now()->addDays(10),
                'days_until_expiry' => 10,
                'auto_renew_ssl' => true,
                'is_expired' => false,
            ],
            [
                'uuid' => 'test-uuid-3',
                'domain_name' => 'skipped.com',
                'ssl_certificate_expires_at' => now()->addDays(20),
                'days_until_expiry' => 20,
                'auto_renew_ssl' => false,
                'is_expired' => false,
            ],
        ];

        $renewalResults = [
            'total' => 3,
            'renewed' => 1,
            'failed' => 1,
            'skipped' => 1,
            'details' => [
                [
                    'domain' => 'renewed.com',
                    'status' => 'renewed',
                    'new_expiry' => now()->addDays(90),
                ],
                [
                    'domain' => 'failed.com',
                    'status' => 'failed',
                    'error' => 'Rate limit exceeded',
                ],
                [
                    'domain' => 'skipped.com',
                    'status' => 'skipped',
                    'reason' => 'Auto-renewal disabled',
                ],
            ],
        ];

        $this->sslServiceMock
            ->expects($this->once())
            ->method('getExpiringCertificates')
            ->with(30)
            ->willReturn($expiringDomains);

        $this->sslServiceMock
            ->expects($this->once())
            ->method('renewExpiringCertificates')
            ->with(30)
            ->willReturn($renewalResults);

        $this->artisan('ssl:renew')
            ->assertExitCode(1);
    }
}
