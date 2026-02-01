<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Infrastructure\ExchangeRate\Exceptions\DatabaseException;
use App\Infrastructure\ExchangeRate\Services\DatabaseTransactionService;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PDOException;
use Tests\TestCase;

/**
 * Test database error handling scenarios
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class DatabaseErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    private DatabaseTransactionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DatabaseTransactionService();
    }

    public function test_execute_with_retry_handles_connection_error(): void
    {
        $attempt = 0;
        
        $operation = function () use (&$attempt) {
            $attempt++;
            if ($attempt <= 2) {
                throw new QueryException(
                    'pgsql',
                    'SELECT 1',
                    [],
                    new \Exception('Connection lost')
                );
            }
            return 'success';
        };

        $result = $this->service->executeWithRetry($operation, 'test_operation');
        
        $this->assertEquals('success', $result);
        $this->assertEquals(3, $attempt);
    }

    public function test_execute_with_retry_throws_after_max_retries(): void
    {
        $operation = function () {
            throw new QueryException(
                'pgsql',
                'SELECT 1',
                [],
                new \Exception('Connection lost')
            );
        };

        $this->expectException(DatabaseException::class);
        $this->expectExceptionMessage('Database connection failed');
        
        $this->service->executeWithRetry($operation, 'test_operation', 2);
    }

    public function test_execute_with_retry_handles_deadlock(): void
    {
        $attempt = 0;
        
        $operation = function () use (&$attempt) {
            $attempt++;
            if ($attempt === 1) {
                throw new QueryException(
                    'pgsql',
                    'UPDATE test SET value = 1',
                    [],
                    new \Exception('deadlock detected')
                );
            }
            return 'success';
        };

        $result = $this->service->executeWithRetry($operation, 'test_operation');
        
        $this->assertEquals('success', $result);
        $this->assertEquals(2, $attempt);
    }

    public function test_execute_transaction_handles_rollback(): void
    {
        $this->expectException(DatabaseException::class);
        
        $transaction = function () {
            // This will cause a constraint violation
            DB::statement('INSERT INTO users (id, email) VALUES (1, NULL)');
        };

        $this->service->executeTransaction($transaction, 'test_transaction');
    }

    public function test_database_exception_types(): void
    {
        $connectionException = DatabaseException::connectionFailed('Connection timeout');
        $this->assertEquals(DatabaseException::ERROR_CONNECTION_FAILED, $connectionException->getErrorType());
        $this->assertTrue($connectionException->isRetryable());

        $transactionException = DatabaseException::transactionFailed('update_operation', 'Rollback failed');
        $this->assertEquals(DatabaseException::ERROR_TRANSACTION_FAILED, $transactionException->getErrorType());
        $this->assertFalse($transactionException->isRetryable());

        $constraintException = DatabaseException::constraintViolation('unique_email', 'Duplicate entry');
        $this->assertEquals(DatabaseException::ERROR_CONSTRAINT_VIOLATION, $constraintException->getErrorType());
        $this->assertFalse($constraintException->isRetryable());

        $deadlockException = DatabaseException::deadlock('update_rates');
        $this->assertEquals(DatabaseException::ERROR_DEADLOCK, $deadlockException->getErrorType());
        $this->assertTrue($deadlockException->isRetryable());

        $timeoutException = DatabaseException::timeout('long_query', 30);
        $this->assertEquals(DatabaseException::ERROR_TIMEOUT, $timeoutException->getErrorType());
        $this->assertTrue($timeoutException->isRetryable());
    }

    public function test_database_exception_context(): void
    {
        $exception = DatabaseException::timeout('test_operation', 30);
        
        $context = $exception->getContext();
        $this->assertIsArray($context);
        $this->assertEquals('test_operation', $context['operation']);
        $this->assertEquals(30, $context['timeout']);
    }

    public function test_convert_query_exception_connection_error(): void
    {
        $queryException = new QueryException(
            'pgsql',
            'SELECT 1',
            [],
            new \Exception('server has gone away')
        );

        $operation = function () use ($queryException) {
            throw $queryException;
        };

        $this->expectException(DatabaseException::class);
        $this->expectExceptionMessage('Database connection failed');
        
        $this->service->executeWithRetry($operation, 'test_operation', 0);
    }

    public function test_convert_query_exception_constraint_violation(): void
    {
        $queryException = new QueryException(
            'pgsql',
            'INSERT INTO test (email) VALUES (?)',
            ['duplicate@test.com'],
            new \Exception('duplicate key value violates unique constraint "users_email_unique"')
        );

        $operation = function () use ($queryException) {
            throw $queryException;
        };

        $this->expectException(DatabaseException::class);
        $this->expectExceptionMessage('Database constraint violation');
        
        $this->service->executeWithRetry($operation, 'test_operation', 0);
    }

    public function test_convert_pdo_exception(): void
    {
        $pdoException = new PDOException('Connection timeout');

        $operation = function () use ($pdoException) {
            throw $pdoException;
        };

        $this->expectException(DatabaseException::class);
        $this->expectExceptionMessage('Database connection failed');
        
        $this->service->executeWithRetry($operation, 'test_operation', 0);
    }

    public function test_non_retryable_error_fails_immediately(): void
    {
        $attempt = 0;
        
        $operation = function () use (&$attempt) {
            $attempt++;
            throw new QueryException(
                'pgsql',
                'INSERT INTO test (email) VALUES (?)',
                ['test@test.com'],
                new \Exception('duplicate key value violates unique constraint')
            );
        };

        $this->expectException(DatabaseException::class);
        
        $this->service->executeWithRetry($operation, 'test_operation');
        
        // Should only attempt once for non-retryable errors
        $this->assertEquals(1, $attempt);
    }

    public function test_unexpected_exception_handling(): void
    {
        $operation = function () {
            throw new \RuntimeException('Unexpected error');
        };

        $this->expectException(DatabaseException::class);
        $this->expectExceptionMessage('Unexpected error during test_operation');
        
        $this->service->executeWithRetry($operation, 'test_operation', 0);
    }
}