<?php

namespace Tests\Unit\Http\Requests\Vendor;

use App\Http\Requests\Vendor\SendMessageRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

/**
 * SendMessageRequestTest
 * 
 * Tests validation rules for SendMessageRequest
 * 
 * Requirements: 13.7, 13.8
 */
class SendMessageRequestTest extends TestCase
{
    /**
     * Test that message is required
     */
    public function test_message_is_required(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            [],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('message'));
    }

    /**
     * Test that message must be a string
     */
    public function test_message_must_be_string(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            ['message' => 123],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('message'));
    }

    /**
     * Test that message cannot exceed 5000 characters
     */
    public function test_message_cannot_exceed_max_length(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            ['message' => str_repeat('a', 5001)],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('message'));
    }

    /**
     * Test that valid message passes validation
     */
    public function test_valid_message_passes(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            ['message' => 'This is a valid message'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that message with exactly 5000 characters passes
     */
    public function test_message_with_max_length_passes(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            ['message' => str_repeat('a', 5000)],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that attachments is optional
     */
    public function test_attachments_is_optional(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            ['message' => 'Valid message'],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('attachments'));
    }

    /**
     * Test that attachments must be an array
     */
    public function test_attachments_must_be_array(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => 'not-an-array'
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('attachments'));
    }

    /**
     * Test that attachments cannot exceed 5 files
     */
    public function test_attachments_cannot_exceed_max_count(): void
    {
        $request = new SendMessageRequest();
        
        // Create 6 fake files
        $files = [];
        for ($i = 0; $i < 6; $i++) {
            $files[] = UploadedFile::fake()->create('document' . $i . '.pdf', 100);
        }
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => $files
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('attachments'));
    }

    /**
     * Test that exactly 5 attachments passes validation
     */
    public function test_exactly_five_attachments_passes(): void
    {
        $request = new SendMessageRequest();
        
        // Create 5 fake files
        $files = [];
        for ($i = 0; $i < 5; $i++) {
            $files[] = UploadedFile::fake()->create('document' . $i . '.pdf', 100);
        }
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => $files
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that attachment must be a file
     */
    public function test_attachment_must_be_file(): void
    {
        $request = new SendMessageRequest();
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => ['not-a-file']
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('attachments.0'));
    }

    /**
     * Test that attachment cannot exceed 10MB
     */
    public function test_attachment_cannot_exceed_max_size(): void
    {
        $request = new SendMessageRequest();
        
        // Create a file larger than 10MB (10241KB)
        $file = UploadedFile::fake()->create('large-document.pdf', 10241);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('attachments.0'));
    }

    /**
     * Test that attachment with exactly 10MB passes
     */
    public function test_attachment_with_max_size_passes(): void
    {
        $request = new SendMessageRequest();
        
        // Create a file exactly 10MB (10240KB)
        $file = UploadedFile::fake()->create('document.pdf', 10240);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid PDF attachment passes
     */
    public function test_valid_pdf_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->create('document.pdf', 100);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid JPG attachment passes
     */
    public function test_valid_jpg_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->image('photo.jpg');
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid PNG attachment passes
     */
    public function test_valid_png_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->image('photo.png');
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid DOC attachment passes
     */
    public function test_valid_doc_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->create('document.doc', 100);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid DOCX attachment passes
     */
    public function test_valid_docx_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->create('document.docx', 100);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid XLS attachment passes
     */
    public function test_valid_xls_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->create('spreadsheet.xls', 100);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that valid XLSX attachment passes
     */
    public function test_valid_xlsx_attachment_passes(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->create('spreadsheet.xlsx', 100);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertTrue($validator->passes());
    }

    /**
     * Test that invalid file type is rejected
     */
    public function test_invalid_file_type_is_rejected(): void
    {
        $request = new SendMessageRequest();
        $file = UploadedFile::fake()->create('script.exe', 100);
        
        $validator = Validator::make(
            [
                'message' => 'Valid message',
                'attachments' => [$file]
            ],
            $request->rules()
        );

        $this->assertFalse($validator->passes());
        $this->assertTrue($validator->errors()->has('attachments.0'));
    }

    /**
     * Test that authorization returns true
     */
    public function test_authorization_returns_true(): void
    {
        $request = new SendMessageRequest();
        $this->assertTrue($request->authorize());
    }

    /**
     * Test custom error messages are defined
     */
    public function test_custom_error_messages_are_defined(): void
    {
        $request = new SendMessageRequest();
        $messages = $request->messages();

        $this->assertArrayHasKey('message.required', $messages);
        $this->assertArrayHasKey('message.max', $messages);
        $this->assertArrayHasKey('attachments.max', $messages);
        $this->assertArrayHasKey('attachments.*.file', $messages);
        $this->assertArrayHasKey('attachments.*.max', $messages);
        $this->assertArrayHasKey('attachments.*.mimes', $messages);
    }
}
