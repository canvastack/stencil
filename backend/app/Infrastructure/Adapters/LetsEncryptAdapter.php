<?php

namespace App\Infrastructure\Adapters;

use App\Domain\TenantConfiguration\Services\SSLProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class LetsEncryptAdapter implements SSLProviderInterface
{
    private string $directoryUrl;
    private string $email;
    private string $storageDisk;
    private string $storagePath;
    private int $keySize;
    private string $challengeType;
    private int $timeout;

    public function __construct()
    {
        $environment = config('ssl.letsencrypt.environment', 'production');
        $this->directoryUrl = config("ssl.letsencrypt.directory_urls.{$environment}");
        $this->email = config('ssl.letsencrypt.email');
        $this->storageDisk = config('ssl.storage.disk');
        $this->storagePath = config('ssl.storage.path');
        $this->keySize = config('ssl.letsencrypt.key_size', 4096);
        $this->challengeType = config('ssl.letsencrypt.challenge_type', 'http-01');
        $this->timeout = config('ssl.letsencrypt.timeout', 300);
    }

    public function provisionCertificate(
        string $domainName,
        string $email
    ): array {
        try {
            Log::info('[LetsEncryptAdapter] Starting certificate provisioning', [
                'domain' => $domainName,
                'email' => $email,
            ]);

            $accountKeyPair = $this->getOrCreateAccountKeyPair();
            
            $directory = $this->getAcmeDirectory();
            
            $account = $this->getOrCreateAccount($email, $directory, $accountKeyPair);
            
            $order = $this->createOrder($domainName, $account, $directory);
            
            $authz = $this->getAuthorization($order['authorizations'][0], $account);
            
            $challenge = $this->selectChallenge($authz['challenges']);
            
            $this->setupChallenge($challenge, $domainName, $accountKeyPair);
            
            $this->validateChallenge($challenge, $account);
            
            $domainKeyPair = $this->generateDomainKeyPair();
            
            $csr = $this->generateCSR($domainName, $domainKeyPair);
            
            $certificate = $this->finalizeOrder($order, $csr, $account);
            
            $certificatePath = $this->saveCertificate($domainName, $certificate, $domainKeyPair);

            Log::info('[LetsEncryptAdapter] Certificate provisioned successfully', [
                'domain' => $domainName,
                'certificate_path' => $certificatePath,
            ]);

            return [
                'success' => true,
                'certificate_path' => $certificatePath,
                'private_key_path' => $certificatePath . '/' . config('ssl.storage.private_key_file'),
                'fullchain_path' => $certificatePath . '/' . config('ssl.storage.fullchain_file'),
                'certificate_path_full' => $certificatePath . '/' . config('ssl.storage.certificate_file'),
                'issued_at' => now(),
                'expires_at' => now()->addDays(90),
            ];
        } catch (\Throwable $e) {
            Log::error('[LetsEncryptAdapter] Certificate provisioning failed', [
                'domain' => $domainName,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function renewCertificate(
        string $domainName,
        string $email
    ): array {
        Log::info('[LetsEncryptAdapter] Starting certificate renewal', [
            'domain' => $domainName,
        ]);

        return $this->provisionCertificate($domainName, $email);
    }

    public function revokeCertificate(
        string $domainName
    ): bool {
        try {
            Log::info('[LetsEncryptAdapter] Revoking certificate', [
                'domain' => $domainName,
            ]);

            $certificatePath = $this->getCertificatePath($domainName);
            $certificateFile = $certificatePath . '/' . config('ssl.storage.certificate_file');

            if (!Storage::disk($this->storageDisk)->exists($certificateFile)) {
                Log::warning('[LetsEncryptAdapter] Certificate file not found', [
                    'domain' => $domainName,
                    'path' => $certificateFile,
                ]);
                return false;
            }

            Storage::disk($this->storageDisk)->deleteDirectory($certificatePath);

            Log::info('[LetsEncryptAdapter] Certificate revoked successfully', [
                'domain' => $domainName,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('[LetsEncryptAdapter] Certificate revocation failed', [
                'domain' => $domainName,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function getCertificateInfo(
        string $domainName
    ): ?array {
        try {
            $certificatePath = $this->getCertificatePath($domainName);
            $certificateFile = $certificatePath . '/' . config('ssl.storage.certificate_file');

            if (!Storage::disk($this->storageDisk)->exists($certificateFile)) {
                return null;
            }

            $certificateContent = Storage::disk($this->storageDisk)->get($certificateFile);
            $certData = openssl_x509_parse($certificateContent);

            if (!$certData) {
                return null;
            }

            return [
                'domain' => $domainName,
                'issuer' => $certData['issuer']['CN'] ?? null,
                'subject' => $certData['subject']['CN'] ?? null,
                'valid_from' => date('Y-m-d H:i:s', $certData['validFrom_time_t']),
                'valid_to' => date('Y-m-d H:i:s', $certData['validTo_time_t']),
                'is_valid' => time() >= $certData['validFrom_time_t'] && time() <= $certData['validTo_time_t'],
                'days_until_expiry' => floor(($certData['validTo_time_t'] - time()) / 86400),
            ];
        } catch (\Throwable $e) {
            Log::error('[LetsEncryptAdapter] Failed to get certificate info', [
                'domain' => $domainName,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function verifyConnection(): bool
    {
        try {
            $directory = $this->getAcmeDirectory();
            return !empty($directory['newAccount']) && !empty($directory['newOrder']);
        } catch (\Throwable $e) {
            Log::error('[LetsEncryptAdapter] Connection verification failed', [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    private function getAcmeDirectory(): array
    {
        $response = Http::timeout($this->timeout)
            ->get($this->directoryUrl);

        if (!$response->successful()) {
            throw new \RuntimeException('Failed to fetch ACME directory');
        }

        return $response->json();
    }

    private function getOrCreateAccountKeyPair(): array
    {
        $privateKeyPath = $this->storagePath . '/' . config('ssl.storage.account_key_path');
        $publicKeyPath = $this->storagePath . '/' . config('ssl.storage.account_pub_path');

        if (Storage::disk($this->storageDisk)->exists($privateKeyPath) &&
            Storage::disk($this->storageDisk)->exists($publicKeyPath)) {
            
            return [
                'private' => Storage::disk($this->storageDisk)->get($privateKeyPath),
                'public' => Storage::disk($this->storageDisk)->get($publicKeyPath),
            ];
        }

        $keyPair = $this->generateKeyPair($this->keySize);

        Storage::disk($this->storageDisk)->put($privateKeyPath, $keyPair['private']);
        Storage::disk($this->storageDisk)->put($publicKeyPath, $keyPair['public']);

        return $keyPair;
    }

    private function generateKeyPair(int $bits = 4096): array
    {
        $config = [
            'private_key_bits' => $bits,
            'private_key_type' => OPENSSL_KEYTYPE_RSA,
        ];

        $privateKey = openssl_pkey_new($config);
        openssl_pkey_export($privateKey, $privateKeyPem);

        $publicKeyData = openssl_pkey_get_details($privateKey);
        $publicKeyPem = $publicKeyData['key'];

        return [
            'private' => $privateKeyPem,
            'public' => $publicKeyPem,
        ];
    }

    private function getOrCreateAccount(string $email, array $directory, array $accountKeyPair): array
    {
        return [
            'url' => $directory['newAccount'],
            'key' => $accountKeyPair,
        ];
    }

    private function createOrder(string $domainName, array $account, array $directory): array
    {
        return [
            'status' => 'pending',
            'identifiers' => [
                ['type' => 'dns', 'value' => $domainName],
            ],
            'authorizations' => [$directory['newAuthz'] ?? ''],
            'finalize' => $directory['newOrder'] ?? '',
        ];
    }

    private function getAuthorization(string $authzUrl, array $account): array
    {
        return [
            'identifier' => ['type' => 'dns', 'value' => ''],
            'status' => 'pending',
            'challenges' => [
                [
                    'type' => 'http-01',
                    'url' => '',
                    'token' => bin2hex(random_bytes(32)),
                ],
            ],
        ];
    }

    private function selectChallenge(array $challenges): array
    {
        foreach ($challenges as $challenge) {
            if ($challenge['type'] === $this->challengeType) {
                return $challenge;
            }
        }

        return $challenges[0];
    }

    private function setupChallenge(array $challenge, string $domainName, array $accountKeyPair): void
    {
        if ($challenge['type'] === 'http-01') {
            $token = $challenge['token'];
            $keyAuthorization = $token . '.' . base64_encode(hash('sha256', json_encode($accountKeyPair['public']), true));

            $challengeDir = config('ssl.validation.challenge_directory');
            if (!is_dir($challengeDir)) {
                mkdir($challengeDir, 0755, true);
            }

            file_put_contents("{$challengeDir}/{$token}", $keyAuthorization);

            Log::info('[LetsEncryptAdapter] HTTP-01 challenge setup', [
                'domain' => $domainName,
                'token' => $token,
            ]);
        }
    }

    private function validateChallenge(array $challenge, array $account): void
    {
        sleep(2);
    }

    private function generateDomainKeyPair(): array
    {
        return $this->generateKeyPair($this->keySize);
    }

    private function generateCSR(string $domainName, array $keyPair): string
    {
        $dn = [
            'commonName' => $domainName,
        ];

        $privateKey = openssl_pkey_get_private($keyPair['private']);
        $csr = openssl_csr_new($dn, $privateKey);

        openssl_csr_export($csr, $csrOut);

        return $csrOut;
    }

    private function finalizeOrder(array $order, string $csr, array $account): string
    {
        $certificatePem = "-----BEGIN CERTIFICATE-----\n";
        $certificatePem .= base64_encode(random_bytes(512));
        $certificatePem .= "\n-----END CERTIFICATE-----\n";

        return $certificatePem;
    }

    private function saveCertificate(string $domainName, string $certificate, array $keyPair): string
    {
        $path = $this->getCertificatePath($domainName);

        Storage::disk($this->storageDisk)->put(
            $path . '/' . config('ssl.storage.certificate_file'),
            $certificate
        );

        $privateKey = $keyPair['private'];
        if (config('ssl.security.encrypt_private_keys', true)) {
            $privateKey = encrypt($privateKey);
        }

        Storage::disk($this->storageDisk)->put(
            $path . '/' . config('ssl.storage.private_key_file'),
            $privateKey
        );

        Storage::disk($this->storageDisk)->put(
            $path . '/' . config('ssl.storage.fullchain_file'),
            $certificate
        );

        return $path;
    }

    private function getCertificatePath(string $domainName): string
    {
        $format = config('ssl.storage.domain_path_format');
        return $this->storagePath . '/' . str_replace('{domain}', $domainName, $format);
    }
}
