<?php

namespace App\Infrastructure\ExchangeRate\Exceptions;

use Exception;

class DatabaseException extends Exception
{
    public const ERROR_CONNECTION_FAILED = 'CONNECTION_FAILED';
    public const ERROR_TRANSACTION_FAILED = 'TRANSACTION_FAILED';
    public const ERROR_CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION';
    public const ERROR_DEADLOCK = 'DEADLOCK';
    public const ERROR_TIMEOUT = 'TIMEOUT';

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

    public static function connectionFailed(string $details = ''): self
    {
        return new self(
            "Database connection failed" . ($details ? ": {$details}" : ""),
            503,
            null,
            self::ERROR_CONNECTION_FAILED,
            ['details' => $details]
        );
    }

    public static function transactionFailed(string $operation, string $details = ''): self
    {
        return new self(
            "Transaction failed during {$operation}" . ($details ? ": {$details}" : ""),
            500,
            null,
            self::ERROR_TRANSACTION_FAILED,
            ['operation' => $operation, 'details' => $details]
        );
    }

    public static function constraintViolation(string $constraint, string $details = ''): self
    {
        return new self(
            "Database constraint violation: {$constraint}" . ($details ? ". {$details}" : ""),
            409,
            null,
            self::ERROR_CONSTRAINT_VIOLATION,
            ['constraint' => $constraint, 'details' => $details]
        );
    }

    public static function deadlock(string $operation): self
    {
        return new self(
            "Database deadlock detected during {$operation}",
            409,
            null,
            self::ERROR_DEADLOCK,
            ['operation' => $operation]
        );
    }

    public static function timeout(string $operation, int $timeoutSeconds): self
    {
        return new self(
            "Database operation timeout after {$timeoutSeconds} seconds during {$operation}",
            408,
            null,
            self::ERROR_TIMEOUT,
            ['operation' => $operation, 'timeout' => $timeoutSeconds]
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
            self::ERROR_CONNECTION_FAILED,
            self::ERROR_DEADLOCK,
            self::ERROR_TIMEOUT
        ]);
    }
}