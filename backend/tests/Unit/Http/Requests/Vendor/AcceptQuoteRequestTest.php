<?php

namespace Tests\Unit\Http\Requests\Vendor;

use App\Http\Requests\Vendor\AcceptQuoteRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * AcceptQuoteRequestTest
 * 
 * Tests validation rules for AcceptQuoteRequest
 * 
 * Requirements: 6.3
 */
class AcceptQuoteRequestTest extends TestCase
{
    /**
     * Test that estimated_delivery_days is required
     */
    public function test_estimated_delivery_days_is_required(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('estimated_delivery_days'));
    }

    /**
     * Test that estimated_delivery_days must be an integer
     */
    public function test_estimated_delivery_days_must_be_integer(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            ['estimated_delivery_days' => 'not-an-integer'],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('estimated_delivery_days'));
    }

    /**
     * Test that estimated_delivery_days must be at least 1
     */
    public function test_estimated_delivery_days_must_be_at_least_one(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            ['estimated_delivery_days' => 0],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('estimated_delivery_days'));
    }

    /**
     * Test that negative estimated_delivery_days is invalid
     */
    public function test_negative_estimated_delivery_days_is_invalid(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            ['estimated_delivery_days' => -5],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('estimated_delivery_days'));
    }

    /**
     * Test that valid estimated_delivery_days passes validation
     */
    public function test_valid_estimated_delivery_days_passes(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            ['estimated_delivery_days' => 7],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that notes is optional
     */
    public function test_notes_is_optional(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            ['estimated_delivery_days' => 7],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('notes'));
    }

    /**
     * Test that notes must be a string
     */
    public function test_notes_must_be_string(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            [
                'estimated_delivery_days' => 7,
                'notes' => 123
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('notes'));
    }

    /**
     * Test that notes cannot exceed 1000 characters
     */
    public function test_notes_cannot_exceed_max_length(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            [
                'estimated_delivery_days' => 7,
                'notes' => str_repeat('a', 1001)
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('notes'));
    }

    /**
     * Test that valid notes passes validation
     */
    public function test_valid_notes_passes(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            [
                'estimated_delivery_days' => 7,
                'notes' => 'This is a valid note'
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that notes with exactly 1000 characters passes
     */
    public function test_notes_with_max_length_passes(): void
    {
        $request = new AcceptQuoteRequest();
        $validator = Validator::make(
            [
                'estimated_delivery_days' => 7,
                'notes' => str_repeat('a', 1000)
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that authorization returns true
     */
    public function test_authorization_returns_true(): void
    {
        $request = new AcceptQuoteRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * Test custom error messages are defined
     */
    public function test_custom_error_messages_are_defined(): void
    {
        $request = new AcceptQuoteRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('estimated_delivery_days.required', $messages);
        $this->assertArrayHasKey('estimated_delivery_days.integer', $messages);
        $this->assertArrayHasKey('estimated_delivery_days.min', $messages);
        $this->assertArrayHasKey('notes.max', $messages);
    }
}
