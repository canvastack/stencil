<?php

namespace App\Infrastructure\ExchangeRate\Exceptions;

use Exception;

class ApiException extends Exception
{
    public const ERROR_NETWORK_TIMEOUT = 'NETWORK_TIMEOUT';
    public const ERROR_INVALID_JSON = 'INVALID_JSON';
    public const ERROR_RATE_LIMIT = 'RATE_LIMIT';
    public const ERROR_AUTHENTICATION = 'AUTHENTICATION';
    public const ERROR_INVALID_RESPONSE = 'INVALID_RESPONSE';
    public const ERROR_CONNECTION_FAILED = 'CONNECTION_FAILED';

    private ?string $errorType = null;
    private ?array $context = null;

    public function __construct(
        string $message = "",
        int $code = 0,
        ?\Throwable $previous = null,
        ?string $errorType = null,
        ?array $context = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->errorType = $errorType;
        $this->context = $context;
    }

    public static function networkTimeout(string $provider, int $timeout): self
    {
        return new self(
            "Network timeout after {$timeout} seconds for provider: {$provider}",
            408,
            null,
            self::ERROR_NETWORK_TIMEOUT,
            ['provider' => $provider, 'timeout' => $timeout]
        );
    }

    public static function invalidJson(string $provider, string $response): self
    {
        return new self(
            "Invalid JSON response from provider: {$provider}",
            422,
            null,
            self::ERROR_INVALID_JSON,
            ['provider' => $provider, 'response' => substr($response, 0, 200)]
        );
    }

    public static function rateLimit(string $provider, ?int $retryAfter = null): self
    {
        $message = "Rate limit exceeded for provider: {$provider}";
        if ($retryAfter) {
            $message .= ". Retry after {$retryAfter} seconds";
        }

        return new self(
            $message,
            429,
            null,
            self::ERROR_RATE_LIMIT,
            ['provider' => $provider, 'retry_after' => $retryAfter]
        );
    }

    public static function authentication(string $provider, string $details = ''): self
    {
        $message = "Authentication failed for provider: {$provider}";
        if ($details) {
            $message .= ". {$details}";
        }

        return new self(
            $message,
            401,
            null,
            self::ERROR_AUTHENTICATION,
            ['provider' => $provider, 'details' => $details]
        );
    }

    public static function invalidResponse(string $provider, string $reason): self
    {
        return new self(
            "Invalid response from provider {$provider}: {$reason}",
            422,
            null,
            self::ERROR_INVALID_RESPONSE,
            ['provider' => $provider, 'reason' => $reason]
        );
    }

    public static function connectionFailed(string $provider, string $reason): self
    {
        return new self(
            "Connection failed to provider {$provider}: {$reason}",
            503,
            null,
            self::ERROR_CONNECTION_FAILED,
            ['provider' => $provider, 'reason' => $reason]
        );
    }

    public function getErrorType(): ?string
    {
        return $this->errorType;
    }

    public function getContext(): ?array
    {
        return $this->context;
    }

    public function isRetryable(): bool
    {
        return in_array($this->errorType, [
            self::ERROR_NETWORK_TIMEOUT,
            self::ERROR_CONNECTION_FAILED,
            self::ERROR_RATE_LIMIT
        ]);
    }
}
