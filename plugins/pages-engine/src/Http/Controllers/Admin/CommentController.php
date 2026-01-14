<?php

namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Comment\ListCommentsUseCase;
use Plugins\PagesEngine\Application\UseCases\Comment\ApproveCommentUseCase;
use Plugins\PagesEngine\Application\UseCases\Comment\RejectCommentUseCase;
use Plugins\PagesEngine\Application\UseCases\Comment\MarkCommentAsSpamUseCase;
use Plugins\PagesEngine\Application\UseCases\Comment\DeleteCommentUseCase;
use Plugins\PagesEngine\Http\Resources\CommentResource;
use Plugins\PagesEngine\Application\Commands\ApproveCommentCommand;
use Plugins\PagesEngine\Application\Commands\RejectCommentCommand;
use Plugins\PagesEngine\Application\Commands\MarkCommentAsSpamCommand;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

class CommentController extends Controller
{
    public function __construct(
        private readonly ListCommentsUseCase $listUseCase,
        private readonly ApproveCommentUseCase $approveUseCase,
        private readonly RejectCommentUseCase $rejectUseCase,
        private readonly MarkCommentAsSpamUseCase $spamUseCase,
        private readonly DeleteCommentUseCase $deleteUseCase
    ) {
        $this->middleware(['auth:sanctum', 'tenant.context']);
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('pages:comments:view');
        
        $filters = [
            'content_uuid' => $request->input('content'),
            'status' => $request->input('status'),
            'search' => $request->input('search'),
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

    public function approve(string $uuid): JsonResponse
    {
        $this->authorize('pages:comments:approve');
        
        $command = new ApproveCommentCommand(
            commentId: new Uuid($uuid),
            tenantId: new Uuid(auth()->user()->tenant->uuid)
        );
        
        $this->approveUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Comment approved successfully',
        ]);
    }

    public function reject(string $uuid): JsonResponse
    {
        $this->authorize('pages:comments:reject');
        
        $command = new RejectCommentCommand(
            commentId: new Uuid($uuid),
            tenantId: new Uuid(auth()->user()->tenant->uuid)
        );
        
        $this->rejectUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Comment rejected successfully',
        ]);
    }

    public function spam(string $uuid): JsonResponse
    {
        $this->authorize('pages:comments:spam');
        
        $command = new MarkCommentAsSpamCommand(
            commentId: new Uuid($uuid),
            tenantId: new Uuid(auth()->user()->tenant->uuid)
        );
        
        $this->spamUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Comment marked as spam successfully',
        ]);
    }

    public function destroy(string $uuid): JsonResponse
    {
        $this->authorize('pages:comments:delete');
        
        $this->deleteUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $this->authorize('pages:comments:approve');
        
        $request->validate(['uuids' => 'required|array|min:1', 'uuids.*' => 'uuid']);
        
        foreach ($request->input('uuids') as $uuid) {
            $this->approveUseCase->execute(new ApproveCommentCommand(
                commentId: new Uuid($uuid),
                tenantId: new Uuid(auth()->user()->tenant->uuid)
            ));
        }
        
        return response()->json([
            'success' => true,
            'message' => count($request->input('uuids')) . ' comments approved successfully',
        ]);
    }

    public function bulkDelete(Request $request): JsonResponse
    {
        $this->authorize('pages:comments:delete');
        
        $request->validate(['uuids' => 'required|array|min:1', 'uuids.*' => 'uuid']);
        
        foreach ($request->input('uuids') as $uuid) {
            $this->deleteUseCase->execute($uuid, auth()->user()->tenant->uuid);
        }
        
        return response()->json([
            'success' => true,
            'message' => count($request->input('uuids')) . ' comments deleted successfully',
        ]);
    }
}
