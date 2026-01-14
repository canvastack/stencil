<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Public;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;

class CommentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected string $tenantId;
    protected $content;
    protected $contentType;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $this->contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'is_commentable' => true,
        ]);

        $this->content = \PagesEngine\Infrastructure\Persistence\ContentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentType->id,
            'status' => 'published',
        ]);
    }

    public function test_can_list_comments_for_content(): void
    {
        $response = $this->getJson("/api/cms/public/contents/{$this->content->uuid}/comments");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [],
                'meta' => ['current_page', 'total', 'per_page']
            ]);
    }

    public function test_guest_can_submit_comment(): void
    {
        $data = [
            'content_uuid' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'body' => 'This is a great article!',
        ];

        $response = $this->postJson('/api/cms/public/comments', $data);

        $response->assertStatus(201)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'body', 'status']]);
    }

    public function test_authenticated_user_can_submit_comment(): void
    {
        $user = User::factory()->create(['tenant_id' => $this->tenantId]);

        $data = [
            'content_uuid' => $this->content->uuid,
            'body' => 'Authenticated user comment',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/cms/public/comments', $data);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    public function test_can_reply_to_comment(): void
    {
        $parentComment = \PagesEngine\Infrastructure\Persistence\CommentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'content_id' => $this->content->id,
            'status' => 'approved',
        ]);

        $data = [
            'content_uuid' => $this->content->uuid,
            'author_name' => 'Jane Doe',
            'author_email' => 'jane@example.com',
            'body' => 'I agree with you!',
        ];

        $response = $this->postJson("/api/cms/public/comments/{$parentComment->uuid}/reply", $data);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);
    }

    public function test_comment_requires_valid_content(): void
    {
        $data = [
            'content_uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'body' => 'Test comment',
        ];

        $response = $this->postJson('/api/cms/public/comments', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content_uuid']);
    }

    public function test_guest_comment_requires_name_and_email(): void
    {
        $data = [
            'content_uuid' => $this->content->uuid,
            'body' => 'Test comment without credentials',
        ];

        $response = $this->postJson('/api/cms/public/comments', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['author_name', 'author_email']);
    }

    public function test_comment_body_is_required(): void
    {
        $data = [
            'content_uuid' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
        ];

        $response = $this->postJson('/api/cms/public/comments', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    }

    public function test_comment_body_minimum_length(): void
    {
        $data = [
            'content_uuid' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'body' => 'ab',
        ];

        $response = $this->postJson('/api/cms/public/comments', $data);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    }
}
