<?php

namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\ContentType\CreateContentTypeUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\UpdateContentTypeUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\DeleteContentTypeUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\GetContentTypeUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\ListContentTypesUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\ActivateContentTypeUseCase;
use Plugins\PagesEngine\Application\UseCases\ContentType\DeactivateContentTypeUseCase;
use Plugins\PagesEngine\Http\Requests\CreateContentTypeRequest;
use Plugins\PagesEngine\Http\Requests\UpdateContentTypeRequest;
use Plugins\PagesEngine\Http\Resources\ContentTypeResource;
use Plugins\PagesEngine\Application\Commands\CreateContentTypeCommand;
use Plugins\PagesEngine\Application\Commands\UpdateContentTypeCommand;
use Plugins\PagesEngine\Domain\ValueObjects\Uuid;

class ContentTypeController extends Controller
{
    public function __construct(
        private readonly CreateContentTypeUseCase $createUseCase,
        private readonly UpdateContentTypeUseCase $updateUseCase,
        private readonly DeleteContentTypeUseCase $deleteUseCase,
        private readonly GetContentTypeUseCase $getUseCase,
        private readonly ListContentTypesUseCase $listUseCase,
        private readonly ActivateContentTypeUseCase $activateUseCase,
        private readonly DeactivateContentTypeUseCase $deactivateUseCase
    ) {
        // Middleware applied at route level in routes/api.php
    }

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $allPerms = $user->getAllPermissions();
        $permNames = is_array($allPerms) 
            ? array_column($allPerms, 'name') 
            : $allPerms->pluck('name')->toArray();
        
        \Log::info('[CMS Controller] Before authorize check', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'tenant_id' => $user->tenant_id ?? 'NULL',
            'team_id' => getPermissionsTeamId(),
            'auth_guard' => auth()->getDefaultDriver(),
            'permissions_count' => count($allPerms),
            'permission_names' => $permNames,
            'can_view' => $user->can('pages:content-types:view'),
            'hasPermissionTo' => $user->hasPermissionTo('pages:content-types:view', 'api'),
        ]);
        
        $this->authorize('pages:content-types:view');
        
        $tenantId = $user->tenant->uuid;
        $scope = $request->input('scope');
        $isActive = $request->has('is_active') ? $request->boolean('is_active') : null;
        
        $result = $this->listUseCase->execute($tenantId, $scope, $isActive);
        
        return response()->json([
            'success' => true,
            'data' => ContentTypeResource::collection($result),
        ]);
    }

    public function show(string $uuid): JsonResponse
    {
        $this->authorize('pages:content-types:view');
        
        $contentType = $this->getUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        if (!$contentType) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CONTENT_TYPE_NOT_FOUND',
                    'message' => 'Content type not found',
                    'details' => ['uuid' => $uuid],
                ],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new ContentTypeResource($contentType),
        ]);
    }

    public function store(CreateContentTypeRequest $request): JsonResponse
    {
        $this->authorize('pages:content-types:create');
        
        $command = new CreateContentTypeCommand(
            tenantId: new Uuid(auth()->user()->tenant->uuid),
            name: $request->input('name'),
            slug: $request->input('slug'),
            defaultUrlPattern: $request->input('default_url_pattern'),
            scope: $request->input('scope', 'tenant'),
            description: $request->input('description'),
            icon: $request->input('icon'),
            isCommentable: $request->boolean('is_commentable', false),
            isCategorizable: $request->boolean('is_categorizable', true),
            isTaggable: $request->boolean('is_taggable', true),
            isRevisioned: $request->boolean('is_revisioned', true),
            metadata: $request->input('metadata', [])
        );
        
        $contentType = $this->createUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new ContentTypeResource($contentType),
            'message' => 'Content type created successfully',
        ], 201);
    }

    public function update(UpdateContentTypeRequest $request, string $uuid): JsonResponse
    {
        $this->authorize('pages:content-types:update');
        
        $command = new UpdateContentTypeCommand(
            contentTypeId: new Uuid($uuid),
            tenantId: new Uuid(auth()->user()->tenant->uuid),
            name: $request->input('name'),
            description: $request->input('description'),
            icon: $request->input('icon'),
            defaultUrlPattern: $request->input('default_url_pattern'),
            isCommentable: $request->has('is_commentable') ? $request->boolean('is_commentable') : null,
            isCategorizable: $request->has('is_categorizable') ? $request->boolean('is_categorizable') : null,
            isTaggable: $request->has('is_taggable') ? $request->boolean('is_taggable') : null,
            isRevisioned: $request->has('is_revisioned') ? $request->boolean('is_revisioned') : null,
            metadata: $request->input('metadata')
        );
        
        $contentType = $this->updateUseCase->execute($command);
        
        return response()->json([
            'success' => true,
            'data' => new ContentTypeResource($contentType),
            'message' => 'Content type updated successfully',
        ]);
    }

    public function destroy(string $uuid): JsonResponse
    {
        $this->authorize('pages:content-types:delete');
        
        try {
            $this->deleteUseCase->execute($uuid, auth()->user()->tenant->uuid);
            
            return response()->json([
                'success' => true,
                'message' => 'Content type deleted successfully',
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CONTENT_TYPE_IN_USE',
                    'message' => $e->getMessage(),
                ],
            ], 422);
        }
    }

    public function activate(string $uuid): JsonResponse
    {
        $this->authorize('pages:content-types:update');
        
        $this->activateUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        return response()->json([
            'success' => true,
            'message' => 'Content type activated successfully',
        ]);
    }

    public function deactivate(string $uuid): JsonResponse
    {
        $this->authorize('pages:content-types:update');
        
        $this->deactivateUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        return response()->json([
            'success' => true,
            'message' => 'Content type deactivated successfully',
        ]);
    }

    public function contentsCount(string $uuid): JsonResponse
    {
        $this->authorize('pages:content-types:view');
        
        $contentType = $this->getUseCase->execute($uuid, auth()->user()->tenant->uuid);
        
        if (!$contentType) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'CONTENT_TYPE_NOT_FOUND',
                    'message' => 'Content type not found',
                ],
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'uuid' => $contentType->uuid,
                'name' => $contentType->name,
                'contents_count' => $contentType->contents_count ?? 0,
            ],
        ]);
    }
}
