<?php

namespace App\Infrastructure\ExchangeRate\Services;

use App\Infrastructure\ExchangeRate\Exceptions\DatabaseException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PDOException;
use Exception;

class DatabaseTransactionService
{
    private const MAX_RETRIES = 3;
    private const RETRY_DELAY_MS = 100;

    /**
     * Execute a database operation with retry logic and error handling
     *
     * @param callable $operation The database operation to execute
     * @param string $operationName Name of the operation for logging
     * @param int $maxRetries Maximum number of retries
     * @return mixed The result of the operation
     * @throws DatabaseException
     */
    public function executeWithRetry(
        callable $operation,
        string $operationName,
        int $maxRetries = self::MAX_RETRIES
    ): mixed {
        $attempt = 0;
        $lastException = null;

        while ($attempt <= $maxRetries) {
            try {
                return $operation();
            } catch (QueryException $e) {
                $lastException = $e;
                $attempt++;

                // Check if this is a retryable error
                if (!$this->isRetryableError($e) || $attempt > $maxRetries) {
                    throw $this->convertQueryException($e, $operationName);
                }

                // Log retry attempt
                Log::warning("Database operation retry", [
                    'operation' => $operationName,
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                    'error_code' => $e->getCode()
                ]);

                // Wait before retry with exponential backoff
                usleep(self::RETRY_DELAY_MS * 1000 * pow(2, $attempt - 1));
            } catch (PDOException $e) {
                $lastException = $e;
                $attempt++;

                if (!$this->isRetryablePDOError($e) || $attempt > $maxRetries) {
                    throw $this->convertPDOException($e, $operationName);
                }

                Log::warning("Database PDO retry", [
                    'operation' => $operationName,
                    'attempt' => $attempt,
                    'error' => $e->getMessage(),
                    'error_code' => $e->getCode()
                ]);

                usleep(self::RETRY_DELAY_MS * 1000 * pow(2, $attempt - 1));
            } catch (Exception $e) {
                // Allow domain exceptions to pass through without wrapping
                if ($this->isDomainException($e)) {
                    throw $e;
                }
                
                // Non-database exceptions should not be retried
                throw new DatabaseException(
                    "Unexpected error during {$operationName}: " . $e->getMessage(),
                    500,
                    $e
                );
            }
        }

        // If we get here, all retries failed
        throw new DatabaseException(
            "Operation {$operationName} failed after {$maxRetries} retries",
            500,
            $lastException
        );
    }

    /**
     * Execute a database transaction with retry logic
     *
     * @param callable $transaction The transaction to execute
     * @param string $operationName Name of the operation for logging
     * @return mixed The result of the transaction
     * @throws DatabaseException
     */
    public function executeTransaction(callable $transaction, string $operationName): mixed
    {
        return $this->executeWithRetry(
            function () use ($transaction, $operationName) {
                try {
                    return DB::transaction($transaction);
                } catch (Exception $e) {
                    Log::error("Transaction failed", [
                        'operation' => $operationName,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    throw $e;
                }
            },
            $operationName
        );
    }

    /**
     * Check if a QueryException is retryable
     *
     * @param QueryException $e
     * @return bool
     */
    private function isRetryableError(QueryException $e): bool
    {
        $errorCode = $e->getCode();
        $errorMessage = strtolower($e->getMessage());

        // Constraint violations are not retryable
        if (str_contains($errorMessage, 'constraint') || 
            str_contains($errorMessage, 'duplicate') ||
            str_contains($errorMessage, 'foreign key') ||
            in_array($errorCode, ['23000', '23505', '23503'])) {
            return false;
        }

        // Connection errors
        if (str_contains($errorMessage, 'connection') || 
            str_contains($errorMessage, 'server has gone away') ||
            str_contains($errorMessage, 'lost connection')) {
            return true;
        }

        // Deadlock errors
        if (str_contains($errorMessage, 'deadlock') || $errorCode === '40001') {
            return true;
        }

        // Lock timeout errors
        if (str_contains($errorMessage, 'lock wait timeout') || $errorCode === '1205') {
            return true;
        }

        // PostgreSQL specific retryable errors
        if (in_array($errorCode, ['08000', '08003', '08006', '40001', '40P01'])) {
            return true;
        }

        return false;
    }

    /**
     * Check if a PDOException is retryable
     *
     * @param PDOException $e
     * @return bool
     */
    private function isRetryablePDOError(PDOException $e): bool
    {
        $errorCode = $e->getCode();
        $errorMessage = strtolower($e->getMessage());

        // Connection errors
        if (str_contains($errorMessage, 'connection') || 
            str_contains($errorMessage, 'server has gone away')) {
            return true;
        }

        // Timeout errors
        if (str_contains($errorMessage, 'timeout')) {
            return true;
        }

        return false;
    }

    /**
     * Convert QueryException to DatabaseException
     *
     * @param QueryException $e
     * @param string $operationName
     * @return DatabaseException
     */
    private function convertQueryException(QueryException $e, string $operationName): DatabaseException
    {
        $errorCode = $e->getCode();
        $errorMessage = strtolower($e->getMessage());

        // Constraint violations (check first, before connection errors)
        if (str_contains($errorMessage, 'constraint') || 
            str_contains($errorMessage, 'duplicate') ||
            str_contains($errorMessage, 'foreign key') ||
            in_array($errorCode, ['23000', '23505', '23503'])) {
            
            $constraint = $this->extractConstraintName($errorMessage);
            return DatabaseException::constraintViolation($constraint, $e->getMessage());
        }

        // Deadlock errors
        if (str_contains($errorMessage, 'deadlock') || $errorCode === '40001') {
            return DatabaseException::deadlock($operationName);
        }

        // Timeout errors
        if (str_contains($errorMessage, 'timeout')) {
            return DatabaseException::timeout($operationName, 30);
        }

        // Connection errors (check after constraint violations)
        if (str_contains($errorMessage, 'connection') || 
            str_contains($errorMessage, 'server has gone away')) {
            return DatabaseException::connectionFailed($e->getMessage());
        }

        // Generic transaction failure
        return DatabaseException::transactionFailed($operationName, $e->getMessage());
    }

    /**
     * Convert PDOException to DatabaseException
     *
     * @param PDOException $e
     * @param string $operationName
     * @return DatabaseException
     */
    private function convertPDOException(PDOException $e, string $operationName): DatabaseException
    {
        $errorMessage = strtolower($e->getMessage());

        if (str_contains($errorMessage, 'connection') || 
            str_contains($errorMessage, 'server has gone away')) {
            return DatabaseException::connectionFailed($e->getMessage());
        }

        if (str_contains($errorMessage, 'timeout')) {
            return DatabaseException::timeout($operationName, 30);
        }

        return DatabaseException::transactionFailed($operationName, $e->getMessage());
    }

    /**
     * Extract constraint name from error message
     *
     * @param string $errorMessage
     * @return string
     */
    private function extractConstraintName(string $errorMessage): string
    {
        // Try to extract constraint name from common patterns
        if (preg_match('/constraint\s+"([^"]+)"/', $errorMessage, $matches)) {
            return $matches[1];
        }

        if (preg_match('/key\s+"([^"]+)"/', $errorMessage, $matches)) {
            return $matches[1];
        }

        if (preg_match('/duplicate\s+entry.*for\s+key\s+\'([^\']+)\'/', $errorMessage, $matches)) {
            return $matches[1];
        }

        return 'unknown_constraint';
    }

    /**
     * Check if an exception is a domain exception that should pass through
     *
     * @param Exception $e
     * @return bool
     */
    private function isDomainException(Exception $e): bool
    {
        // Allow domain exceptions to pass through
        $domainExceptionNamespaces = [
            'App\\Domain\\ExchangeRate\\Exceptions\\',
            'DomainException',
            'InvalidArgumentException'
        ];

        $exceptionClass = get_class($e);
        
        foreach ($domainExceptionNamespaces as $namespace) {
            if (str_starts_with($exceptionClass, $namespace) || $e instanceof \DomainException || $e instanceof \InvalidArgumentException) {
                return true;
            }
        }

        return false;
    }
}