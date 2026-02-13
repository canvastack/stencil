<?php

namespace Tests\Unit\Mail\Vendor;

use Tests\TestCase;
use App\Mail\Vendor\WelcomeEmail;
use Illuminate\Support\Facades\View;

/**
 * Test WelcomeEmail Mailable
 * 
 * Requirements: 7.8, 17.2, 17.3
 */
class WelcomeEmailTest extends TestCase
{
    /** @test */
    public function it_has_correct_subject(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $email = 'vendor@example.com';
        $temporaryPassword = 'TempPass123!';
        $loginUrl = 'https://portal.example.com/vendor/login';

        // Act
        $mailable = new WelcomeEmail($vendorName, $email, $temporaryPassword, $loginUrl);
        $envelope = $mailable->envelope();

        // Assert
        $this->assertStringContainsString('Welcome to', $envelope->subject);
        $this->assertStringContainsString('Vendor Portal', $envelope->subject);
    }

    /** @test */
    public function it_uses_correct_view(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $email = 'vendor@example.com';
        $temporaryPassword = 'TempPass123!';
        $loginUrl = 'https://portal.example.com/vendor/login';

        // Act
        $mailable = new WelcomeEmail($vendorName, $email, $temporaryPassword, $loginUrl);
        $content = $mailable->content();

        // Assert
        $this->assertEquals('emails.vendor.welcome', $content->view);
    }

    /** @test */
    public function it_passes_correct_data_to_view(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $email = 'vendor@example.com';
        $temporaryPassword = 'TempPass123!';
        $loginUrl = 'https://portal.example.com/vendor/login';

        // Act
        $mailable = new WelcomeEmail($vendorName, $email, $temporaryPassword, $loginUrl);
        $content = $mailable->content();

        // Assert
        $this->assertArrayHasKey('vendorName', $content->with);
        $this->assertArrayHasKey('email', $content->with);
        $this->assertArrayHasKey('temporaryPassword', $content->with);
        $this->assertArrayHasKey('loginUrl', $content->with);
        
        $this->assertEquals($vendorName, $content->with['vendorName']);
        $this->assertEquals($email, $content->with['email']);
        $this->assertEquals($temporaryPassword, $content->with['temporaryPassword']);
        $this->assertEquals($loginUrl, $content->with['loginUrl']);
    }

    /** @test */
    public function it_renders_template_with_all_required_elements(): void
    {
        // Arrange
        $vendorName = 'Test Vendor Company';
        $email = 'vendor@example.com';
        $temporaryPassword = 'TempPass123!';
        $loginUrl = 'https://portal.example.com/vendor/login';

        // Act
        $mailable = new WelcomeEmail($vendorName, $email, $temporaryPassword, $loginUrl);
        $rendered = $mailable->render();

        // Assert - Check for PT CEX branding
        $this->assertStringContainsString('Vendor Portal', $rendered);
        
        // Assert - Check for login credentials
        $this->assertStringContainsString($email, $rendered);
        $this->assertStringContainsString($temporaryPassword, $rendered);
        
        // Assert - Check for portal link button
        $this->assertStringContainsString($loginUrl, $rendered);
        $this->assertStringContainsString('Access Vendor Portal', $rendered);
        
        // Assert - Check for getting started instructions
        $this->assertStringContainsString('Getting Started Guide', $rendered);
        $this->assertStringContainsString('First Login', $rendered);
        $this->assertStringContainsString('Dashboard Overview', $rendered);
        $this->assertStringContainsString('Managing Quote Requests', $rendered);
        $this->assertStringContainsString('Communication', $rendered);
        $this->assertStringContainsString('Profile Management', $rendered);
        
        // Assert - Check for security notice
        $this->assertStringContainsString('Security Notice', $rendered);
        $this->assertStringContainsString('temporary password', $rendered);
        $this->assertStringContainsString('7 days', $rendered);
        
        // Assert - Check for support information
        $this->assertStringContainsString('Need Help', $rendered);
    }

    /** @test */
    public function it_includes_vendor_name_in_greeting(): void
    {
        // Arrange
        $vendorName = 'Acme Corporation';
        $email = 'vendor@acme.com';
        $temporaryPassword = 'TempPass123!';
        $loginUrl = 'https://portal.example.com/vendor/login';

        // Act
        $mailable = new WelcomeEmail($vendorName, $email, $temporaryPassword, $loginUrl);
        $rendered = $mailable->render();

        // Assert
        $this->assertStringContainsString($vendorName, $rendered);
        $this->assertStringContainsString('Dear', $rendered);
    }

    /** @test */
    public function it_has_no_attachments(): void
    {
        // Arrange
        $vendorName = 'Test Vendor';
        $email = 'vendor@example.com';
        $temporaryPassword = 'TempPass123!';
        $loginUrl = 'https://portal.example.com/vendor/login';

        // Act
        $mailable = new WelcomeEmail($vendorName, $email, $temporaryPassword, $loginUrl);
        $attachments = $mailable->attachments();

        // Assert
        $this->assertIsArray($attachments);
        $this->assertEmpty($attachments);
    }
}
