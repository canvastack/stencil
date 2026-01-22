<?php

namespace App\Domain\Tenant\Enums;

enum VerificationMethod: string
{
    case DNS_TXT = 'dns_txt';
    case DNS_CNAME = 'dns_cname';
    case FILE_UPLOAD = 'file_upload';

    public function label(): string
    {
        return match ($this) {
            self::DNS_TXT => 'DNS TXT Record',
            self::DNS_CNAME => 'DNS CNAME Record',
            self::FILE_UPLOAD => 'File Upload',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::DNS_TXT => 'Verify ownership by adding a TXT record to DNS',
            self::DNS_CNAME => 'Verify ownership by adding a CNAME record to DNS',
            self::FILE_UPLOAD => 'Verify ownership by uploading a file to the domain root',
        };
    }

    public function instructions(string $token): string
    {
        return match ($this) {
            self::DNS_TXT => "Add a TXT record with name '_canvastencil-verify' and value '{$token}' to your DNS configuration.",
            self::DNS_CNAME => "Add a CNAME record pointing to 'verify.canvastack.com' with the token '{$token}'.",
            self::FILE_UPLOAD => "Upload a file named 'canvastencil-verify.txt' containing '{$token}' to your domain root directory.",
        };
    }

    public function isDnsMethod(): bool
    {
        return in_array($this, [self::DNS_TXT, self::DNS_CNAME]);
    }

    public function requiresFileAccess(): bool
    {
        return $this === self::FILE_UPLOAD;
    }

    public static function availableMethods(): array
    {
        return [
            self::DNS_TXT,
            self::DNS_CNAME,
            self::FILE_UPLOAD,
        ];
    }

    public static function fromString(string $method): self
    {
        return match (strtolower($method)) {
            'dns_txt' => self::DNS_TXT,
            'dns_cname' => self::DNS_CNAME,
            'file_upload' => self::FILE_UPLOAD,
            default => throw new \InvalidArgumentException("Invalid verification method: {$method}"),
        };
    }
}
