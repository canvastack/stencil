<?php

namespace Tests\Unit\Http\Requests\Vendor;

use App\Http\Requests\Vendor\UpdateProfileRequest;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * UpdateProfileRequestTest
 * 
 * Tests validation rules for UpdateProfileRequest
 * 
 * Requirements: 8.3, 8.4, 8.5
 */
class UpdateProfileRequestTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that all fields are optional
     */
    public function test_all_fields_are_optional(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        // Should pass with empty data since all fields are optional
        $this->assertTrue($validator->passes());
    }

    /**
     * Test that email must be valid format
     */
    public function test_email_must_be_valid_format(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['email' => 'invalid-email'],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('email'));
    }

    /**
     * Test that email cannot exceed 255 characters
     */
    public function test_email_cannot_exceed_max_length(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['email' => str_repeat('a', 246) . '@example.com'], // 256 chars total
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('email'));
    }

    /**
     * Test that valid email passes validation
     */
    public function test_valid_email_passes(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['email' => 'vendor@example.com'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that phone must be a string
     */
    public function test_phone_must_be_string(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['phone' => 123456789],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('phone'));
    }

    /**
     * Test that phone cannot exceed 50 characters
     */
    public function test_phone_cannot_exceed_max_length(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['phone' => str_repeat('1', 51)],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('phone'));
    }

    /**
     * Test that valid phone passes validation
     */
    public function test_valid_phone_passes(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['phone' => '+1-234-567-8900'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that contact_person must be a string
     */
    public function test_contact_person_must_be_string(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['contact_person' => 123],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('contact_person'));
    }

    /**
     * Test that contact_person cannot exceed 255 characters
     */
    public function test_contact_person_cannot_exceed_max_length(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['contact_person' => str_repeat('a', 256)],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('contact_person'));
    }

    /**
     * Test that valid contact_person passes validation
     */
    public function test_valid_contact_person_passes(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['contact_person' => 'John Doe'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that address must be a string
     */
    public function test_address_must_be_string(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['address' => 123],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('address'));
    }

    /**
     * Test that address cannot exceed 500 characters
     */
    public function test_address_cannot_exceed_max_length(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['address' => str_repeat('a', 501)],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('address'));
    }

    /**
     * Test that valid address passes validation
     */
    public function test_valid_address_passes(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['address' => '123 Main Street, City, Country'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that location must be an array
     */
    public function test_location_must_be_array(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['location' => 'not-an-array'],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location'));
    }

    /**
     * Test that location requires latitude when provided
     */
    public function test_location_requires_latitude(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['location' => ['longitude' => 100.5]],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.latitude'));
    }

    /**
     * Test that location requires longitude when provided
     */
    public function test_location_requires_longitude(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['location' => ['latitude' => 40.7]],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.longitude'));
    }

    /**
     * Test that latitude must be numeric
     */
    public function test_latitude_must_be_numeric(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['location' => ['latitude' => 'not-numeric', 'longitude' => 100.5]],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.latitude'));
    }

    /**
     * Test that latitude must be between -90 and 90
     */
    public function test_latitude_must_be_within_range(): void
    {
        $request = new UpdateProfileRequest();
        
        // Test latitude > 90
        $validator = Validator::make(
            ['location' => ['latitude' => 91, 'longitude' => 100.5]],
            $request->rules()
        );
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.latitude'));

        // Test latitude < -90
        $validator = Validator::make(
            ['location' => ['latitude' => -91, 'longitude' => 100.5]],
            $request->rules()
        );
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.latitude'));
    }

    /**
     * Test that longitude must be numeric
     */
    public function test_longitude_must_be_numeric(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['location' => ['latitude' => 40.7, 'longitude' => 'not-numeric']],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.longitude'));
    }

    /**
     * Test that longitude must be between -180 and 180
     */
    public function test_longitude_must_be_within_range(): void
    {
        $request = new UpdateProfileRequest();
        
        // Test longitude > 180
        $validator = Validator::make(
            ['location' => ['latitude' => 40.7, 'longitude' => 181]],
            $request->rules()
        );
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.longitude'));

        // Test longitude < -180
        $validator = Validator::make(
            ['location' => ['latitude' => 40.7, 'longitude' => -181]],
            $request->rules()
        );
        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('location.longitude'));
    }

    /**
     * Test that valid location passes validation
     */
    public function test_valid_location_passes(): void
    {
        $request = new UpdateProfileRequest();
        $validator = Validator::make(
            ['location' => ['latitude' => 40.7128, 'longitude' => -74.0060]],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that authorization returns true
     */
    public function test_authorization_returns_true(): void
    {
        $request = new UpdateProfileRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * Test custom error messages are defined
     */
    public function test_custom_error_messages_are_defined(): void
    {
        $request = new UpdateProfileRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('email.email', $messages);
        $this->assertArrayHasKey('email.max', $messages);
        $this->assertArrayHasKey('email.unique', $messages);
        $this->assertArrayHasKey('phone.max', $messages);
        $this->assertArrayHasKey('contact_person.max', $messages);
        $this->assertArrayHasKey('address.max', $messages);
        $this->assertArrayHasKey('location.array', $messages);
        $this->assertArrayHasKey('location.latitude.required_with', $messages);
        $this->assertArrayHasKey('location.latitude.numeric', $messages);
        $this->assertArrayHasKey('location.latitude.between', $messages);
        $this->assertArrayHasKey('location.longitude.required_with', $messages);
        $this->assertArrayHasKey('location.longitude.numeric', $messages);
        $this->assertArrayHasKey('location.longitude.between', $messages);
    }
}
