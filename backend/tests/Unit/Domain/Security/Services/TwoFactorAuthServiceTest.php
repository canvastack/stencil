<?php

namespace Tests\Unit\Domain\Security\Services;

use Tests\TestCase;
use App\Domain\Security\Services\TwoFactorAuthService;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Mockery;

class TwoFactorAuthServiceTest extends TestCase
{
    use RefreshDatabase;

    private TwoFactorAuthService $twoFactorAuthService;
    private Google2FA $mockGoogle2FA;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockGoogle2FA = Mockery::mock(Google2FA::class);
        $this->twoFactorAuthService = new TwoFactorAuthService($this->mockGoogle2FA);
    }

    public function test_it_generates_secret_key()
    {
        // Arrange
        $this->mockGoogle2FA->shouldReceive('generateSecretKey')
            ->once()
            ->andReturn('JBSWY3DPEHPK3PXP');

        // Act
        $secretKey = $this->twoFactorAuthService->generateSecretKey();

        // Assert
        $this->assertIsString($secretKey);
        $this->assertEquals('JBSWY3DPEHPK3PXP', $secretKey);
    }

    public function test_it_generates_qr_code_url()
    {
        // Arrange
        $user = User::factory()->create([
            'email' => 'test@example.com'
        ]);
        $secretKey = 'JBSWY3DPEHPK3PXP';
        $companyName = 'CanvaStencil';

        $expectedUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/CanvaStencil:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=CanvaStencil';

        $this->mockGoogle2FA->shouldReceive('getQRCodeUrl')
            ->once()
            ->with($companyName, $user->email, $secretKey)
            ->andReturn('otpauth://totp/CanvaStencil:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=CanvaStencil');

        // Act
        $qrCodeUrl = $this->twoFactorAuthService->generateQRCodeUrl($user, $secretKey, $companyName);

        // Assert
        $this->assertIsString($qrCodeUrl);
        $this->assertEquals($expectedUrl, $qrCodeUrl);
    }

    public function test_it_enables_two_factor_auth_for_user()
    {
        // Arrange
        $user = User::factory()->create();
        $secretKey = 'JBSWY3DPEHPK3PXP';
        $verificationCode = '123456';

        $this->mockGoogle2FA->shouldReceive('verifyKey')
            ->once()
            ->with($secretKey, $verificationCode)
            ->andReturn(true);

        // Act
        $result = $this->twoFactorAuthService->enableTwoFactorAuth($user, $secretKey, $verificationCode);

        // Assert
        $this->assertTrue($result);
        $user->refresh();
        $this->assertNotNull($user->two_factor_secret);
        $this->assertTrue($user->two_factor_enabled);
    }

    public function test_it_fails_to_enable_two_factor_auth_with_invalid_code()
    {
        // Arrange
        $user = User::factory()->create();
        $secretKey = 'JBSWY3DPEHPK3PXP';
        $invalidCode = '000000';

        $this->mockGoogle2FA->shouldReceive('verifyKey')
            ->once()
            ->with($secretKey, $invalidCode)
            ->andReturn(false);

        // Act
        $result = $this->twoFactorAuthService->enableTwoFactorAuth($user, $secretKey, $invalidCode);

        // Assert
        $this->assertFalse($result);
        $user->refresh();
        $this->assertNull($user->two_factor_secret);
        $this->assertFalse($user->two_factor_enabled);
    }

    public function test_it_disables_two_factor_auth_for_user()
    {
        // Arrange
        $user = User::factory()->create([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_enabled' => true
        ]);

        // Act
        $result = $this->twoFactorAuthService->disableTwoFactorAuth($user);

        // Assert
        $this->assertTrue($result);
        $user->refresh();
        $this->assertNull($user->two_factor_secret);
        $this->assertFalse($user->two_factor_enabled);
    }

    public function test_it_verifies_valid_two_factor_code()
    {
        // Arrange
        $user = User::factory()->create([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_enabled' => true
        ]);
        $validCode = '123456';

        $this->mockGoogle2FA->shouldReceive('verifyKey')
            ->once()
            ->with($user->two_factor_secret, $validCode)
            ->andReturn(true);

        // Act
        $result = $this->twoFactorAuthService->verifyTwoFactorCode($user, $validCode);

        // Assert
        $this->assertTrue($result->isSuccess());
    }

    public function test_it_rejects_invalid_two_factor_code()
    {
        // Arrange
        $user = User::factory()->create([
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP',
            'two_factor_enabled' => true
        ]);
        $invalidCode = '000000';

        $this->mockGoogle2FA->shouldReceive('verifyKey')
            ->once()
            ->with($user->two_factor_secret, $invalidCode)
            ->andReturn(false);

        // Act
        $result = $this->twoFactorAuthService->verifyTwoFactorCode($user, $invalidCode);

        // Assert
        $this->assertFalse($result->isSuccess());
    }

    public function test_it_rejects_code_for_user_without_two_factor_enabled()
    {
        // Arrange
        $user = User::factory()->create([
            'two_factor_enabled' => false
        ]);
        $code = '123456';

        // Act
        $result = $this->twoFactorAuthService->verifyTwoFactorCode($user, $code);

        // Assert
        $this->assertFalse($result->isSuccess());
    }

    public function test_it_generates_recovery_codes()
    {
        // Arrange
        $user = User::factory()->create();

        // Act
        $recoveryCodes = $this->twoFactorAuthService->generateRecoveryCodes($user);

        // Assert
        $this->assertIsArray($recoveryCodes);
        $this->assertCount(8, $recoveryCodes);
        
        foreach ($recoveryCodes as $code) {
            $this->assertIsString($code);
            $this->assertEquals(10, strlen($code));
        }

        // Check that codes are saved to user
        $user->refresh();
        $this->assertNotNull($user->two_factor_recovery_codes);
        $this->assertCount(8, json_decode($user->two_factor_recovery_codes, true));
    }

    public function test_it_verifies_valid_recovery_code()
    {
        // Arrange
        $recoveryCodes = ['ABC123DEF0', 'XYZ789GHI1'];
        $user = User::factory()->create([
            'two_factor_recovery_codes' => json_encode($recoveryCodes),
            'two_factor_enabled' => true
        ]);
        $validRecoveryCode = 'ABC123DEF0';

        // Act
        $result = $this->twoFactorAuthService->verifyRecoveryCode($user, $validRecoveryCode);

        // Assert
        $this->assertTrue($result);
        
        // Check that used recovery code is removed
        $user->refresh();
        $remainingCodes = json_decode($user->two_factor_recovery_codes, true);
        $this->assertNotContains($validRecoveryCode, $remainingCodes);
        $this->assertCount(1, $remainingCodes);
    }

    public function test_it_rejects_invalid_recovery_code()
    {
        // Arrange
        $recoveryCodes = ['ABC123DEF0', 'XYZ789GHI1'];
        $user = User::factory()->create([
            'two_factor_recovery_codes' => json_encode($recoveryCodes),
            'two_factor_enabled' => true
        ]);
        $invalidRecoveryCode = 'INVALID123';

        // Act
        $result = $this->twoFactorAuthService->verifyRecoveryCode($user, $invalidRecoveryCode);

        // Assert
        $this->assertFalse($result);
        
        // Check that recovery codes remain unchanged
        $user->refresh();
        $remainingCodes = json_decode($user->two_factor_recovery_codes, true);
        $this->assertCount(2, $remainingCodes);
    }

    public function test_it_checks_if_user_has_two_factor_enabled()
    {
        // Arrange
        $userWithTwoFactor = User::factory()->create([
            'two_factor_enabled' => true,
            'two_factor_secret' => 'JBSWY3DPEHPK3PXP'
        ]);
        
        $userWithoutTwoFactor = User::factory()->create([
            'two_factor_enabled' => false
        ]);

        // Act & Assert
        $this->assertTrue($this->twoFactorAuthService->hasTwoFactorEnabled($userWithTwoFactor));
        $this->assertFalse($this->twoFactorAuthService->hasTwoFactorEnabled($userWithoutTwoFactor));
    }

    public function test_it_gets_backup_codes_count()
    {
        // Arrange
        $recoveryCodes = ['ABC123DEF0', 'XYZ789GHI1', 'MNO456PQR2'];
        $user = User::factory()->create([
            'two_factor_recovery_codes' => json_encode($recoveryCodes)
        ]);

        // Act
        $count = $this->twoFactorAuthService->getBackupCodesCount($user);

        // Assert
        $this->assertEquals(3, $count);
    }

    public function test_it_returns_zero_backup_codes_count_for_user_without_codes()
    {
        // Arrange
        $user = User::factory()->create([
            'two_factor_recovery_codes' => null
        ]);

        // Act
        $count = $this->twoFactorAuthService->getBackupCodesCount($user);

        // Assert
        $this->assertEquals(0, $count);
    }

    public function test_it_regenerates_recovery_codes()
    {
        // Arrange
        $oldRecoveryCodes = ['OLD123CODE', 'OLD456CODE'];
        $user = User::factory()->create([
            'two_factor_recovery_codes' => json_encode($oldRecoveryCodes),
            'two_factor_enabled' => true
        ]);

        // Act
        $newRecoveryCodes = $this->twoFactorAuthService->regenerateRecoveryCodes($user);

        // Assert
        $this->assertIsArray($newRecoveryCodes);
        $this->assertCount(8, $newRecoveryCodes);
        
        // Ensure new codes are different from old ones
        foreach ($newRecoveryCodes as $newCode) {
            $this->assertNotContains($newCode, $oldRecoveryCodes);
        }

        // Check that new codes are saved
        $user->refresh();
        $savedCodes = json_decode($user->two_factor_recovery_codes, true);
        $this->assertEquals($newRecoveryCodes, $savedCodes);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}