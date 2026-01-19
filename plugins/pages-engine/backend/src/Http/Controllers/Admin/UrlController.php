<?php

namespace Plugins\PagesEngine\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Plugins\PagesEngine\Application\UseCases\Url\BuildContentUrlUseCase;
use Plugins\PagesEngine\Application\UseCases\Url\PreviewUrlUseCase;

class UrlController extends Controller
{
    public function __construct(
        private readonly BuildContentUrlUseCase $buildUseCase,
        private readonly PreviewUrlUseCase $previewUseCase
    ) {
        $this->middleware(['auth:sanctum', 'tenant.context']);
    }

    public function build(Request $request): JsonResponse
    {
        $this->authorize('pages:urls:manage');
        
        $request->validate([
            'content_uuid' => 'required|uuid',
        ]);
        
        $url = $this->buildUseCase->execute($request->input('content_uuid'));
        
        return response()->json([
            'success' => true,
            'data' => ['url' => $url],
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $this->authorize('pages:urls:manage');
        
        $request->validate([
            'url_pattern' => 'required|string',
            'content_data' => 'required|array',
        ]);
        
        $url = $this->previewUseCase->execute(
            $request->input('url_pattern'),
            $request->input('content_data')
        );
        
        return response()->json([
            'success' => true,
            'data' => ['preview_url' => $url],
        ]);
    }
}
