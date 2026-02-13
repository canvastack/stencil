<?php

namespace Tests\Unit\Http\Requests\Vendor;

use App\Http\Requests\Vendor\RejectQuoteRequest;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * RejectQuoteRequestTest
 * 
 * Tests validation rules for RejectQuoteRequest
 * 
 * Requirements: 6.6
 */
class RejectQuoteRequestTest extends TestCase
{
    /**
     * Test that rejection_reason is required
     */
    public function test_rejection_reason_is_required(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rejection_reason'));
    }

    /**
     * Test that rejection_reason must be a string
     */
    public function test_rejection_reason_must_be_string(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            ['rejection_reason' => 123],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rejection_reason'));
    }

    /**
     * Test that rejection_reason must be at least 10 characters
     */
    public function test_rejection_reason_must_be_at_least_10_characters(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            ['rejection_reason' => 'short'],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rejection_reason'));
    }

    /**
     * Test that rejection_reason cannot exceed 500 characters
     */
    public function test_rejection_reason_cannot_exceed_max_length(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            ['rejection_reason' => str_repeat('a', 501)],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('rejection_reason'));
    }

    /**
     * Test that valid rejection_reason passes validation
     */
    public function test_valid_rejection_reason_passes(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            ['rejection_reason' => 'This is a valid rejection reason with sufficient length'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that rejection_reason with exactly 10 characters passes
     */
    public function test_rejection_reason_with_min_length_passes(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            ['rejection_reason' => str_repeat('a', 10)],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that rejection_reason with exactly 500 characters passes
     */
    public function test_rejection_reason_with_max_length_passes(): void
    {
        $request = new RejectQuoteRequest();
        $validator = Validator::make(
            ['rejection_reason' => str_repeat('a', 500)],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that authorization returns true
     */
    public function test_authorization_returns_true(): void
    {
        $request = new RejectQuoteRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * Test custom error messages are defined
     */
    public function test_custom_error_messages_are_defined(): void
    {
        $request = new RejectQuoteRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('rejection_reason.required', $messages);
        $this->assertArrayHasKey('rejection_reason.string', $messages);
        $this->assertArrayHasKey('rejection_reason.min', $messages);
        $this->assertArrayHasKey('rejection_reason.max', $messages);
    }
}
