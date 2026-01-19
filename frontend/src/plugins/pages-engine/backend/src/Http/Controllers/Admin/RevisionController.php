<?php

namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Revision\ListRevisionsUseCase;
use Plugins\PagesEngine\Application\UseCases\Revision\GetRevisionUseCase;
use Plugins\PagesEngine\Application\UseCases\Revision\RevertRevisionUseCase;
use Plugins\PagesEngine\Http\Resources\RevisionResource;
use Plugins\PagesEngine\Application\Commands\RevertContentRevisionCommand;

class RevisionController extends Controller
{
    public function __construct(
        private readonly ListRevisionsUseCase $listUseCase,
        private readonly GetRevisionUseCase $getUseCase,
        private readonly RevertRevisionUseCase $revertUseCase
    ) {
        $this->middleware(['auth:sanctum', 'tenant.context']);
    }

    public function index(Request $request, string $contentUuid): JsonResponse
    {
        $this->authorize('pages:revisions:view');
        
        $filters = [
            'content_uuid' => $contentUuid,
            'page' => $request->input('page', 1),
            'per_page' => min($request->input('per_page', 20), 100),
        ];
        
        $result = $this->listUseCase->execute($filters);
        
        return response()->json([
            'success' => true,
            'data' => RevisionResource::collection($result['data']),
            'meta' => $result['meta'],
        ]);
    }

    public function show(string $uuid): JsonResponse
    {
        $this->authorize('pages:revisions:view');
        
        $revision = $this->getUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        if (!$revision) {
            return response()->json([
                'success' => false,
                'error' => ['code' => 'REVISION_NOT_FOUND', 'message' => 'Revision not found'],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new RevisionResource($revision),
        ]);
    }

    public function revert(string $uuid): JsonResponse
    {
        $this->authorize('pages:revisions:restore');
        
        $command = new RevertContentRevisionCommand(
            revisionUuid: $uuid,
            tenantId: auth()->user()->tenant->uuid
        );
        
        $this->revertUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'message' => 'Content reverted to revision successfully',
        ]);
    }
}
