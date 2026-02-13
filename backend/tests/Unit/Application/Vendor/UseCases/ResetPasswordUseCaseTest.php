<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\ResetPasswordCommand;
use App\Application\Vendor\UseCases\ResetPasswordUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use Tests\TestCase;

class ResetPasswordUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private ResetPasswordUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new ResetPasswordUseCase($this->auditLogRepository);
    }

    /** @test */
    public function it_successfully_resets_password_with_valid_token(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'password' => Hash::make('OldP@ssw0rd!'),
        ]);

        $token = 'valid-reset-token';
        $hashedToken = hash('sha256', $token);

        // Create password reset token
        DB::table('password_reset_tokens')->insert([
            'email' => 'vendor@example.com',
            'token' => $hashedToken,
            'expires_at' => now()->addMinutes(30), // Expires in 30 minutes
            'created_at' => now()->subMinutes(30), // Created 30 minutes ago
        ]);

        // Create some tokens to be revoked
        $user->createToken('token-1', ['vendor:access']);
        $user->createToken('token-2', ['vendor:access']);
        
        $this->assertDatabaseCount('personal_access_tokens', 2);

        $command = new ResetPasswordCommand(
            'vendor@example.com',
            $token,
            'NewP@ssw0rd!',
            'NewP@ssw0rd!',
            (string) $tenant->id
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertTrue($result);
        
        // Verify password was updated
        $user->refresh();
        $this->assertTrue(Hash::check('NewP@ssw0rd!', $user->password));
        
        // Verify reset token was deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'vendor@example.com',
        ]);
        
        // Verify all tokens were revoked
        $this->assertDatabaseCount('personal_access_tokens', 0);
        
        // Verify audit log
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_completed', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_throws_exception_when_passwords_do_not_match(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'valid-token',
            'NewP@ssw0rd!',
            'DifferentP@ssw0rd!', // Different password
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password confirmation does not match');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_password_strength_minimum_length(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $password = 'Short1!'; // Only 7 characters
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'valid-token',
            $password,
            $password,
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password must be at least 8 characters long');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_password_requires_uppercase(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $password = 'newp@ssw0rd!'; // No uppercase
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'valid-token',
            $password,
            $password,
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password must contain at least one uppercase letter');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_password_requires_lowercase(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $password = 'NEWP@SSW0RD!'; // No lowercase
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'valid-token',
            $password,
            $password,
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password must contain at least one lowercase letter');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_password_requires_number(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $password = 'NewP@ssword!'; // No number
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'valid-token',
            $password,
            $password,
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password must contain at least one number');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_password_requires_special_character(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $password = 'NewPassw0rd'; // No special character
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'valid-token',
            $password,
            $password,
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password must contain at least one special character');
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_user_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $command = new ResetPasswordCommand(
            'nonexistent@example.com',
            'valid-token',
            'NewP@ssw0rd!',
            'NewP@ssw0rd!',
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid password reset token');
        
        $this->useCase->execute($command);
        
        // Verify audit log was created
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_failed', $this->auditLogRepository->auditLogs[0]['action_type']);
        $this->assertEquals('user_not_found', $this->auditLogRepository->auditLogs[0]['metadata']['reason']);
    }

    /** @test */
    public function it_throws_exception_when_token_invalid(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'password' => Hash::make('OldP@ssw0rd!'),
        ]);

        // No password reset token created - token will be invalid
        $command = new ResetPasswordCommand(
            'vendor@example.com',
            'invalid-token',
            'NewP@ssw0rd!',
            'NewP@ssw0rd!',
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid password reset token');
        
        $this->useCase->execute($command);
        
        // Verify audit log was created
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_failed', $this->auditLogRepository->auditLogs[0]['action_type']);
        $this->assertEquals('invalid_token', $this->auditLogRepository->auditLogs[0]['metadata']['reason']);
    }

    /** @test */
    public function it_throws_exception_when_token_expired(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'password' => Hash::make('OldP@ssw0rd!'),
        ]);

        $token = 'expired-token';
        $hashedToken = hash('sha256', $token);

        // Create expired password reset token (90 minutes ago)
        DB::table('password_reset_tokens')->insert([
            'email' => 'vendor@example.com',
            'token' => $hashedToken,
            'expires_at' => now()->subMinutes(30), // Expired 30 minutes ago
            'created_at' => now()->subMinutes(90), // Created 90 minutes ago
        ]);

        $command = new ResetPasswordCommand(
            'vendor@example.com',
            $token,
            'NewP@ssw0rd!',
            'NewP@ssw0rd!',
            (string) $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Password reset token has expired');
        
        $this->useCase->execute($command);
        
        // Verify expired token was deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'vendor@example.com',
        ]);
        
        // Verify audit log was created
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_failed', $this->auditLogRepository->auditLogs[0]['action_type']);
        $this->assertEquals('token_expired', $this->auditLogRepository->auditLogs[0]['metadata']['reason']);
    }

    /** @test */
    public function it_revokes_all_existing_tokens_on_password_reset(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'password' => Hash::make('OldP@ssw0rd!'),
        ]);

        $token = 'valid-reset-token';
        $hashedToken = hash('sha256', $token);

        // Create password reset token
        DB::table('password_reset_tokens')->insert([
            'email' => 'vendor@example.com',
            'token' => $hashedToken,
            'expires_at' => now()->addMinutes(30), // Expires in 30 minutes
            'created_at' => now()->subMinutes(30), // Created 30 minutes ago
        ]);

        // Create multiple tokens to be revoked
        $user->createToken('token-1', ['vendor:access']);
        $user->createToken('token-2', ['vendor:access']);
        $user->createToken('token-3', ['vendor:access']);
        
        $this->assertDatabaseCount('personal_access_tokens', 3);

        $command = new ResetPasswordCommand(
            'vendor@example.com',
            $token,
            'NewP@ssw0rd!',
            'NewP@ssw0rd!',
            (string) $tenant->id
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertTrue($result);
        
        // Verify password was updated
        $user->refresh();
        $this->assertTrue(Hash::check('NewP@ssw0rd!', $user->password));
        
        // Verify reset token was deleted
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'vendor@example.com',
        ]);
        
        // Verify all tokens were revoked
        $this->assertDatabaseCount('personal_access_tokens', 0);
        
        // Verify audit log
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_completed', $this->auditLogRepository->auditLogs[0]['action_type']);
        $this->assertArrayHasKey('tokens_revoked', $this->auditLogRepository->auditLogs[0]['metadata']);
    }
}
