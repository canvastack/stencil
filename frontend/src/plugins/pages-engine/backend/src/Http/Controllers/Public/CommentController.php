<?php

namespace Plugins\PagesEngine\Http\Controllers\Public;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Comment\SubmitCommentUseCase;
use Plugins\PagesEngine\Application\UseCases\Comment\ListCommentsUseCase;
use Plugins\PagesEngine\Http\Requests\SubmitCommentRequest;
use Plugins\PagesEngine\Http\Resources\CommentResource;
use Plugins\PagesEngine\Application\Commands\SubmitCommentCommand;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

class CommentController extends Controller
{
    public function __construct(
        private readonly SubmitCommentUseCase $submitUseCase,
        private readonly ListCommentsUseCase $listUseCase
    ) {
    }

    public function index(Request $request, string $contentUuid): JsonResponse
    {
        $filters = [
            'content_uuid' => $contentUuid,
            'status' => 'approved',
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 20), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => CommentResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    public function store(SubmitCommentRequest $request): JsonResponse
    {
        $tenantId = session('tenant_id') ?? config('app.default_tenant_id');
        
        $command = new SubmitCommentCommand(
            tenantId: new Uuid($tenantId),
            contentId: new Uuid($request->input('content_uuid')),
            parentId: $request->input('parent_uuid') ? new Uuid($request->input('parent_uuid')) : null,
            authorId: auth()->check() ? new Uuid(auth()->user()->uuid) : null,
            authorName: $request->input('author_name'),
            authorEmail: $request->input('author_email'),
            commentText: $request->input('body'),
            userIp: $request->ip(),
            userAgent: $request->userAgent()
        );
        
        $comment = $this->submitUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new CommentResource($comment),
            'message' => $comment->status === 'approved' 
                ? 'Comment posted successfully'
                : 'Comment submitted and awaiting moderation',
        ], 201);
    }

    public function reply(SubmitCommentRequest $request, string $parentUuid): JsonResponse
    {
        $tenantId = session('tenant_id') ?? config('app.default_tenant_id');
        
        $command = new SubmitCommentCommand(
            tenantId: new Uuid($tenantId),
            contentId: new Uuid($request->input('content_uuid')),
            parentId: new Uuid($parentUuid),
            authorId: auth()->check() ? new Uuid(auth()->user()->uuid) : null,
            authorName: $request->input('author_name'),
            authorEmail: $request->input('author_email'),
            commentText: $request->input('body'),
            userIp: $request->ip(),
            userAgent: $request->userAgent()
        );
        
        $comment = $this->submitUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new CommentResource($comment),
            'message' => $comment->status === 'approved' 
                ? 'Reply posted successfully'
                : 'Reply submitted and awaiting moderation',
        ], 201);
    }
}
