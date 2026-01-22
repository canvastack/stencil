<?php

namespace Tests\Unit\Application\TenantConfiguration;

use App\Application\TenantConfiguration\Services\SSLCertificateService;
use App\Domain\TenantConfiguration\Services\SSLProviderInterface;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SSLCertificateServiceTest extends TestCase
{
    use RefreshDatabase;

    private SSLCertificateService $service;
    private $sslProviderMock;
    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sslProviderMock = $this->createMock(SSLProviderInterface::class);
        $this->service = new SSLCertificateService($this->sslProviderMock);
        
        $this->tenant = TenantEloquentModel::factory()->create();
    }

    public function test_provision_certificate_success_for_verified_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => false,
        ]);

        $providerResult = [
            'success' => true,
            'certificate_path' => 'ssl/domains/test.example.com',
            'private_key_path' => 'ssl/domains/test.example.com/private.key',
            'fullchain_path' => 'ssl/domains/test.example.com/fullchain.pem',
            'issued_at' => now(),
            'expires_at' => now()->addDays(90),
        ];

        $this->sslProviderMock
            ->expects($this->once())
            ->method('provisionCertificate')
            ->with('test.example.com', config('ssl.letsencrypt.email'))
            ->willReturn($providerResult);

        $result = $this->service->provisionCertificate($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertEquals('test.example.com', $result['domain']['domain_name']);
        $this->assertTrue($result['domain']['ssl_enabled']);
        $this->assertArrayHasKey('certificate', $result);

        $domain->refresh();
        $this->assertTrue($domain->ssl_enabled);
        $this->assertTrue($domain->auto_renew_ssl);
        $this->assertNotNull($domain->ssl_certificate_path);
        $this->assertNotNull($domain->ssl_certificate_issued_at);
        $this->assertNotNull($domain->ssl_certificate_expires_at);
    }

    public function test_provision_certificate_fails_for_unverified_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'unverified.example.com',
            'is_verified' => false,
            'status' => 'pending_verification',
            'ssl_enabled' => false,
        ]);

        $this->sslProviderMock
            ->expects($this->never())
            ->method('provisionCertificate');

        $result = $this->service->provisionCertificate($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('verified', $result['error']);

        $domain->refresh();
        $this->assertFalse($domain->ssl_enabled);
    }

    public function test_provision_certificate_handles_provider_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => false,
        ]);

        $providerResult = [
            'success' => false,
            'error' => 'ACME server connection failed',
        ];

        $this->sslProviderMock
            ->expects($this->once())
            ->method('provisionCertificate')
            ->willReturn($providerResult);

        $result = $this->service->provisionCertificate($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('ACME', $result['error']);

        $domain->refresh();
        $this->assertFalse($domain->ssl_enabled);
    }

    public function test_provision_certificate_fails_for_nonexistent_domain(): void
    {
        $fakeUuid = '550e8400-e29b-41d4-a716-446655440000';

        $this->sslProviderMock
            ->expects($this->never())
            ->method('provisionCertificate');

        $result = $this->service->provisionCertificate($fakeUuid);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_renew_certificate_success_for_ssl_enabled_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => true,
            'ssl_certificate_path' => 'ssl/domains/test.example.com',
            'ssl_certificate_issued_at' => now()->subDays(60),
            'ssl_certificate_expires_at' => now()->addDays(30),
            'auto_renew_ssl' => true,
        ]);

        $oldExpiry = $domain->ssl_certificate_expires_at;

        $providerResult = [
            'success' => true,
            'certificate_path' => 'ssl/domains/test.example.com',
            'issued_at' => now(),
            'expires_at' => now()->addDays(90),
        ];

        $this->sslProviderMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->with('test.example.com', config('ssl.letsencrypt.email'))
            ->willReturn($providerResult);

        $result = $this->service->renewCertificate($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertEquals('test.example.com', $result['domain']['domain_name']);

        $domain->refresh();
        $this->assertNotEquals($oldExpiry, $domain->ssl_certificate_expires_at);
    }

    public function test_renew_certificate_fails_when_ssl_not_enabled(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => false,
        ]);

        $this->sslProviderMock
            ->expects($this->never())
            ->method('renewCertificate');

        $result = $this->service->renewCertificate($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not enabled', $result['error']);
    }

    public function test_renew_certificate_handles_provider_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => true,
            'ssl_certificate_expires_at' => now()->addDays(30),
        ]);

        $providerResult = [
            'success' => false,
            'error' => 'Certificate renewal failed - rate limit exceeded',
        ];

        $this->sslProviderMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->willReturn($providerResult);

        $result = $this->service->renewCertificate($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('rate limit', $result['error']);
    }

    public function test_revoke_certificate_success(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => true,
            'ssl_certificate_path' => 'ssl/domains/test.example.com',
            'auto_renew_ssl' => true,
        ]);

        $this->sslProviderMock
            ->expects($this->once())
            ->method('revokeCertificate')
            ->with('test.example.com')
            ->willReturn(true);

        $result = $this->service->revokeCertificate($domain->uuid);

        $this->assertTrue($result['success']);
        $this->assertArrayHasKey('message', $result);

        $domain->refresh();
        $this->assertFalse($domain->ssl_enabled);
        $this->assertFalse($domain->auto_renew_ssl);
        $this->assertNull($domain->ssl_certificate_path);
        $this->assertNull($domain->ssl_certificate_issued_at);
        $this->assertNull($domain->ssl_certificate_expires_at);
    }

    public function test_revoke_certificate_fails_when_ssl_not_enabled(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'is_verified' => true,
            'status' => 'active',
            'ssl_enabled' => false,
        ]);

        $this->sslProviderMock
            ->expects($this->never())
            ->method('revokeCertificate');

        $result = $this->service->revokeCertificate($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('not enabled', $result['error']);
    }

    public function test_revoke_certificate_handles_provider_failure(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => true,
        ]);

        $this->sslProviderMock
            ->expects($this->once())
            ->method('revokeCertificate')
            ->willReturn(false);

        $result = $this->service->revokeCertificate($domain->uuid);

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);

        $domain->refresh();
        $this->assertTrue($domain->ssl_enabled);
    }

    public function test_get_certificate_info_returns_info_for_ssl_enabled_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => true,
            'ssl_certificate_expires_at' => now()->addDays(45),
            'auto_renew_ssl' => true,
        ]);

        $providerInfo = [
            'domain' => 'test.example.com',
            'issuer' => 'Let\'s Encrypt Authority X3',
            'valid_from' => now()->subDays(45),
            'valid_to' => now()->addDays(45),
            'days_until_expiry' => 45,
        ];

        $this->sslProviderMock
            ->expects($this->once())
            ->method('getCertificateInfo')
            ->with('test.example.com')
            ->willReturn($providerInfo);

        $result = $this->service->getCertificateInfo($domain->uuid);

        $this->assertNotNull($result);
        $this->assertEquals('test.example.com', $result['domain']);
        $this->assertArrayHasKey('auto_renew_enabled', $result);
        $this->assertTrue($result['auto_renew_enabled']);
        $this->assertArrayHasKey('needs_renewal', $result);
        $this->assertFalse($result['needs_renewal']);
    }

    public function test_get_certificate_info_returns_null_for_non_ssl_domain(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => false,
        ]);

        $this->sslProviderMock
            ->expects($this->never())
            ->method('getCertificateInfo');

        $result = $this->service->getCertificateInfo($domain->uuid);

        $this->assertNull($result);
    }

    public function test_get_certificate_info_indicates_renewal_needed(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => true,
            'ssl_certificate_expires_at' => now()->addDays(15),
            'auto_renew_ssl' => true,
        ]);

        $providerInfo = [
            'domain' => 'test.example.com',
            'days_until_expiry' => 15,
        ];

        $this->sslProviderMock
            ->expects($this->once())
            ->method('getCertificateInfo')
            ->willReturn($providerInfo);

        $result = $this->service->getCertificateInfo($domain->uuid);

        $this->assertNotNull($result);
        $this->assertTrue($result['needs_renewal']);
    }

    public function test_get_expiring_certificates_returns_domains_expiring_soon(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'expiring-soon.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => now()->addDays(15),
            'auto_renew_ssl' => true,
        ]);

        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'still-valid.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => now()->addDays(60),
            'auto_renew_ssl' => true,
        ]);

        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'no-ssl.com',
            'ssl_enabled' => false,
            'status' => 'active',
        ]);

        $result = $this->service->getExpiringCertificates(30);

        $this->assertCount(1, $result);
        $this->assertEquals('expiring-soon.com', $result[0]['domain_name']);
        $this->assertArrayHasKey('days_until_expiry', $result[0]);
        $this->assertLessThanOrEqual(30, $result[0]['days_until_expiry']);
    }

    public function test_get_expiring_certificates_includes_expired_certificates(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'expired.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => now()->subDays(5),
            'auto_renew_ssl' => true,
        ]);

        $result = $this->service->getExpiringCertificates(30);

        $this->assertCount(1, $result);
        $this->assertEquals('expired.com', $result[0]['domain_name']);
        $this->assertTrue($result[0]['is_expired']);
    }

    public function test_get_expiring_certificates_includes_null_expiry(): void
    {
        CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'no-expiry.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => null,
            'auto_renew_ssl' => true,
        ]);

        $result = $this->service->getExpiringCertificates(30);

        $this->assertCount(1, $result);
        $this->assertEquals('no-expiry.com', $result[0]['domain_name']);
        $this->assertNull($result[0]['days_until_expiry']);
    }

    public function test_renew_expiring_certificates_renews_auto_renewal_enabled_domains(): void
    {
        $domain1 = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'auto-renew.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => now()->addDays(15),
            'auto_renew_ssl' => true,
        ]);

        $domain2 = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'manual-only.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => now()->addDays(15),
            'auto_renew_ssl' => false,
        ]);

        $this->sslProviderMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->with('auto-renew.com', config('ssl.letsencrypt.email'))
            ->willReturn([
                'success' => true,
                'certificate_path' => 'ssl/domains/auto-renew.com',
                'issued_at' => now(),
                'expires_at' => now()->addDays(90),
            ]);

        $result = $this->service->renewExpiringCertificates(30);

        $this->assertEquals(2, $result['total']);
        $this->assertEquals(1, $result['renewed']);
        $this->assertEquals(0, $result['failed']);
        $this->assertEquals(1, $result['skipped']);
        $this->assertCount(2, $result['details']);
    }

    public function test_renew_expiring_certificates_handles_failures(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'failing.com',
            'ssl_enabled' => true,
            'status' => 'active',
            'ssl_certificate_expires_at' => now()->addDays(15),
            'auto_renew_ssl' => true,
        ]);

        $this->sslProviderMock
            ->expects($this->once())
            ->method('renewCertificate')
            ->willReturn([
                'success' => false,
                'error' => 'Network timeout',
            ]);

        $result = $this->service->renewExpiringCertificates(30);

        $this->assertEquals(1, $result['total']);
        $this->assertEquals(0, $result['renewed']);
        $this->assertEquals(1, $result['failed']);
        $this->assertEquals(0, $result['skipped']);
        $this->assertEquals('failed', $result['details'][0]['status']);
    }

    public function test_enable_auto_renewal_success(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => true,
            'auto_renew_ssl' => false,
        ]);

        $result = $this->service->enableAutoRenewal($domain->uuid);

        $this->assertTrue($result);

        $domain->refresh();
        $this->assertTrue($domain->auto_renew_ssl);
    }

    public function test_enable_auto_renewal_fails_when_ssl_not_enabled(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => false,
            'auto_renew_ssl' => false,
        ]);

        $result = $this->service->enableAutoRenewal($domain->uuid);

        $this->assertFalse($result);

        $domain->refresh();
        $this->assertFalse($domain->auto_renew_ssl);
    }

    public function test_disable_auto_renewal_success(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => true,
            'auto_renew_ssl' => true,
        ]);

        $result = $this->service->disableAutoRenewal($domain->uuid);

        $this->assertTrue($result);

        $domain->refresh();
        $this->assertFalse($domain->auto_renew_ssl);
    }

    public function test_disable_auto_renewal_works_without_ssl(): void
    {
        $domain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'test.example.com',
            'ssl_enabled' => false,
            'auto_renew_ssl' => true,
        ]);

        $result = $this->service->disableAutoRenewal($domain->uuid);

        $this->assertTrue($result);

        $domain->refresh();
        $this->assertFalse($domain->auto_renew_ssl);
    }
}
