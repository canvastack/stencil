<?php

namespace Tests\Unit\Domain\Shared\ValueObjects;

use App\Domain\Shared\ValueObjects\ContactInfo;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class ContactInfoTest extends TestCase
{
    /** @test */
    public function it_can_create_contact_info_with_basic_data()
    {
        $contactInfo = ContactInfo::fromBasic('test@example.com', '+6281234567890');
        
        $this->assertEquals('test@example.com', $contactInfo->getEmail());
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
        $this->assertNull($contactInfo->getWhatsapp());
        $this->assertNull($contactInfo->getAlternativeEmail());
    }

    /** @test */
    public function it_can_create_contact_info_with_full_data()
    {
        $contactInfo = new ContactInfo(
            'primary@example.com',
            '+6281234567890',
            '+6289876543210',
            'secondary@example.com',
            [
                ['type' => 'telegram', 'value' => '@username', 'label' => 'Telegram']
            ]
        );
        
        $this->assertEquals('primary@example.com', $contactInfo->getEmail());
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
        $this->assertEquals('+6289876543210', $contactInfo->getWhatsapp());
        $this->assertEquals('secondary@example.com', $contactInfo->getAlternativeEmail());
        $this->assertCount(1, $contactInfo->getAdditionalContacts());
    }

    /** @test */
    public function it_normalizes_indonesian_phone_numbers()
    {
        $contactInfo = ContactInfo::fromBasic('test@example.com', '081234567890');
        
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
    }

    /** @test */
    public function it_normalizes_email_to_lowercase()
    {
        $contactInfo = ContactInfo::fromBasic('TEST@EXAMPLE.COM');
        
        $this->assertEquals('test@example.com', $contactInfo->getEmail());
    }

    /** @test */
    public function it_can_get_best_phone_for_sms()
    {
        $contactInfo1 = new ContactInfo('test@example.com', '+6281234567890', '+6289876543210');
        $contactInfo2 = new ContactInfo('test@example.com', null, '+6289876543210');
        
        $this->assertEquals('+6281234567890', $contactInfo1->getBestPhoneForSms());
        $this->assertEquals('+6289876543210', $contactInfo2->getBestPhoneForSms());
    }

    /** @test */
    public function it_can_get_best_phone_for_whatsapp()
    {
        $contactInfo1 = new ContactInfo('test@example.com', '+6281234567890', '+6289876543210');
        $contactInfo2 = new ContactInfo('test@example.com', '+6281234567890', null);
        
        $this->assertEquals('+6289876543210', $contactInfo1->getBestPhoneForWhatsapp());
        $this->assertEquals('+6281234567890', $contactInfo2->getBestPhoneForWhatsapp());
    }

    /** @test */
    public function it_can_check_available_contact_methods()
    {
        $contactInfo = new ContactInfo(
            'test@example.com',
            '+6281234567890',
            '+6289876543210',
            'alt@example.com'
        );
        
        $methods = $contactInfo->getAvailableContactMethods();
        
        $this->assertContains('email', $methods);
        $this->assertContains('phone', $methods);
        $this->assertContains('sms', $methods);
        $this->assertContains('whatsapp', $methods);
        $this->assertContains('alternative_email', $methods);
    }

    /** @test */
    public function it_can_format_indonesian_phone_numbers()
    {
        $contactInfo = ContactInfo::fromBasic('test@example.com', '+6281234567890');
        
        $formatted = $contactInfo->getFormattedPhone();
        
        $this->assertEquals('+62 812-3456-7890', $formatted);
    }

    /** @test */
    public function it_can_update_email()
    {
        $original = ContactInfo::fromBasic('old@example.com', '+6281234567890');
        $updated = $original->withEmail('new@example.com');
        
        $this->assertEquals('old@example.com', $original->getEmail());
        $this->assertEquals('new@example.com', $updated->getEmail());
        $this->assertEquals('+6281234567890', $updated->getPhone());
    }

    /** @test */
    public function it_can_update_phone()
    {
        $original = ContactInfo::fromBasic('test@example.com', '+6281234567890');
        $updated = $original->withPhone('+6289876543210');
        
        $this->assertEquals('+6281234567890', $original->getPhone());
        $this->assertEquals('+6289876543210', $updated->getPhone());
    }

    /** @test */
    public function it_can_add_additional_contact()
    {
        $original = ContactInfo::fromBasic('test@example.com');
        $updated = $original->addAdditionalContact('telegram', '@username', 'Telegram Handle');
        
        $this->assertEmpty($original->getAdditionalContacts());
        $this->assertCount(1, $updated->getAdditionalContacts());
        
        $contact = $updated->getAdditionalContacts()[0];
        $this->assertEquals('telegram', $contact['type']);
        $this->assertEquals('@username', $contact['value']);
        $this->assertEquals('Telegram Handle', $contact['label']);
    }

    /** @test */
    public function it_can_check_equality()
    {
        $contact1 = ContactInfo::fromBasic('test@example.com', '+6281234567890');
        $contact2 = ContactInfo::fromBasic('test@example.com', '+6281234567890');
        $contact3 = ContactInfo::fromBasic('different@example.com', '+6281234567890');
        
        $this->assertTrue($contact1->equals($contact2));
        $this->assertFalse($contact1->equals($contact3));
    }

    /** @test */
    public function it_can_convert_to_array()
    {
        $contactInfo = new ContactInfo(
            'test@example.com',
            '+6281234567890',
            '+6289876543210',
            'alt@example.com'
        );
        
        $array = $contactInfo->toArray();
        
        $this->assertArrayHasKey('email', $array);
        $this->assertArrayHasKey('phone', $array);
        $this->assertArrayHasKey('whatsapp', $array);
        $this->assertArrayHasKey('alternative_email', $array);
        $this->assertArrayHasKey('formatted_phone', $array);
        $this->assertArrayHasKey('available_methods', $array);
        
        $this->assertEquals('test@example.com', $array['email']);
        $this->assertEquals('+6281234567890', $array['phone']);
    }

    /** @test */
    public function it_can_create_from_array()
    {
        $data = [
            'email' => 'test@example.com',
            'phone' => '+6281234567890',
            'whatsapp' => '+6289876543210',
            'alternative_email' => 'alt@example.com',
            'additional_contacts' => [
                ['type' => 'telegram', 'value' => '@username']
            ]
        ];
        
        $contactInfo = ContactInfo::fromArray($data);
        
        $this->assertEquals('test@example.com', $contactInfo->getEmail());
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
        $this->assertEquals('+6289876543210', $contactInfo->getWhatsapp());
        $this->assertEquals('alt@example.com', $contactInfo->getAlternativeEmail());
        $this->assertCount(1, $contactInfo->getAdditionalContacts());
    }

    /** @test */
    public function it_can_create_from_customer_data()
    {
        $data = [
            'email' => 'customer@example.com',
            'phone' => '081234567890',
            'whatsapp' => '089876543210'
        ];
        
        $contactInfo = ContactInfo::fromCustomerData($data);
        
        $this->assertEquals('customer@example.com', $contactInfo->getEmail());
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
        $this->assertEquals('+6289876543210', $contactInfo->getWhatsapp());
    }

    /** @test */
    public function it_converts_to_string_correctly()
    {
        $contactInfo = ContactInfo::fromBasic('test@example.com', '+6281234567890');
        
        $string = (string) $contactInfo;
        
        $this->assertStringContainsString('test@example.com', $string);
        $this->assertStringContainsString('+62 812-3456-7890', $string);
    }

    /** @test */
    public function it_throws_exception_for_empty_email()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email cannot be empty');
        
        new ContactInfo('');
    }

    /** @test */
    public function it_throws_exception_for_invalid_email()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');
        
        new ContactInfo('invalid-email');
    }

    /** @test */
    public function it_throws_exception_for_too_long_email()
    {
        // Create a valid but too long email (over 255 chars)
        $longEmail = str_repeat('a', 240) . '@test.example.com'; // 256 characters
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email cannot exceed 255 characters');
        
        new ContactInfo($longEmail);
    }

    /** @test */
    public function it_throws_exception_for_invalid_phone_number()
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Phone number must be between 10 and 15 digits');
        
        ContactInfo::fromBasic('test@example.com', '123'); // Too short
    }

    /** @test */
    public function it_handles_phone_number_with_spaces_and_dashes()
    {
        $contactInfo = ContactInfo::fromBasic('test@example.com', '0812-3456-7890');
        
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
    }

    /** @test */
    public function it_handles_phone_number_starting_with_62()
    {
        $contactInfo = ContactInfo::fromBasic('test@example.com', '6281234567890');
        
        $this->assertEquals('+6281234567890', $contactInfo->getPhone());
    }
}