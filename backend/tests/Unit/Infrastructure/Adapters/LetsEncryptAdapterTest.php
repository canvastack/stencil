<?php

namespace Tests\Unit\Infrastructure\Adapters;

use App\Infrastructure\Adapters\LetsEncryptAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class LetsEncryptAdapterTest extends TestCase
{
    use RefreshDatabase;

    private LetsEncryptAdapter $adapter;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('local');
        
        $this->adapter = new LetsEncryptAdapter();
    }

    public function test_it_can_verify_connection_successfully(): void
    {
        Http::fake([
            '*' => Http::response([
                'newAccount' => 'https://acme-v02.api.letsencrypt.org/acme/new-acct',
                'newOrder' => 'https://acme-v02.api.letsencrypt.org/acme/new-order',
            ], 200),
        ]);

        $result = $this->adapter->verifyConnection();

        $this->assertTrue($result);
    }

    public function test_it_returns_false_when_connection_verification_fails(): void
    {
        Http::fake([
            '*' => Http::response([], 500),
        ]);

        $result = $this->adapter->verifyConnection();

        $this->assertFalse($result);
    }

    public function test_it_can_provision_certificate_successfully(): void
    {
        $this->markTestSkipped(
            'This test requires full ACME protocol integration. ' .
            'Certificate provisioning is tested via SSLCertificateService with mocked provider. ' .
            'For integration testing, use a mock ACME server.'
        );
    }

    public function test_it_returns_error_when_certificate_provisioning_fails(): void
    {
        Http::fake([
            '*' => Http::response([], 500),
        ]);

        $result = $this->adapter->provisionCertificate(
            'test.example.com',
            'admin@example.com'
        );

        $this->assertFalse($result['success']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_it_can_renew_certificate_successfully(): void
    {
        $this->markTestSkipped(
            'This test requires full ACME protocol integration. ' .
            'Certificate renewal is tested via SSLCertificateService with mocked provider. ' .
            'For integration testing, use a mock ACME server.'
        );
    }

    public function test_it_can_revoke_certificate_successfully(): void
    {
        $domainName = 'test.example.com';
        $certificatePath = 'ssl/domains/' . $domainName;
        
        Storage::disk('local')->put($certificatePath . '/certificate.pem', 'fake certificate');

        $result = $this->adapter->revokeCertificate($domainName);

        $this->assertTrue($result);
        $this->assertFalse(Storage::disk('local')->exists($certificatePath . '/certificate.pem'));
    }

    public function test_it_returns_false_when_revoking_non_existent_certificate(): void
    {
        $result = $this->adapter->revokeCertificate('non-existent.example.com');

        $this->assertFalse($result);
    }

    public function test_it_can_get_certificate_info_successfully(): void
    {
        $this->markTestSkipped(
            'This test requires proper OpenSSL configuration which may vary by environment. ' .
            'Certificate info retrieval is tested in service layer with actual certificate files.'
        );
    }

    public function test_it_returns_null_when_certificate_info_not_found(): void
    {
        $result = $this->adapter->getCertificateInfo('non-existent.example.com');

        $this->assertNull($result);
    }

    public function test_it_creates_account_keypair_if_not_exists(): void
    {
        $this->markTestSkipped(
            'This test requires full ACME protocol integration. ' .
            'Account keypair creation is part of provisioning workflow tested in service layer.'
        );
    }

    public function test_it_uses_existing_account_keypair_if_exists(): void
    {
        Storage::disk('local')->put('ssl/account.key', 'existing private key');
        Storage::disk('local')->put('ssl/account.pub', 'existing public key');

        Http::fake([
            '*' => Http::response([
                'newAccount' => 'https://acme-v02.api.letsencrypt.org/acme/new-acct',
                'newOrder' => 'https://acme-v02.api.letsencrypt.org/acme/new-order',
                'newAuthz' => 'https://acme-v02.api.letsencrypt.org/acme/new-authz',
            ], 200),
        ]);

        $this->adapter->provisionCertificate(
            'test.example.com',
            'admin@example.com'
        );

        $this->assertEquals('existing private key', Storage::disk('local')->get('ssl/account.key'));
        $this->assertEquals('existing public key', Storage::disk('local')->get('ssl/account.pub'));
    }

    public function test_it_saves_certificate_files_correctly(): void
    {
        $this->markTestSkipped(
            'This test requires full ACME protocol integration. ' .
            'Certificate file storage is tested in service layer with mocked provider.'
        );
    }

    public function test_it_encrypts_private_key_when_configured(): void
    {
        $this->markTestSkipped(
            'This test requires full ACME protocol integration. ' .
            'Private key encryption is part of provisioning workflow tested in service layer.'
        );
    }
}
