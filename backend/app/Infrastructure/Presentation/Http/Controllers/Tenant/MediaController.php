<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => 'required|file|max:10240',
            'folder' => 'nullable|string|max:100',
        ]);

        try {
            $tenantId = $this->getTenantId($request);
            $file = $request->file('file');
            $folder = $validated['folder'] ?? 'uploads';

            $extension = $file->getClientOriginalExtension();
            $filename = Str::uuid() . '.' . $extension;

            $path = $file->storeAs(
                "tenant-{$tenantId}/{$folder}",
                $filename,
                'public'
            );

            $url = Storage::disk('public')->url($path);

            Log::info('File uploaded successfully', [
                'tenant_id' => $tenantId,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'uploaded_by' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'File uploaded successfully',
                'data' => [
                    'url' => $url,
                    'path' => $path,
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Failed to upload file',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    public function delete(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => 'required|string',
        ]);

        try {
            $tenantId = $this->getTenantId($request);
            $path = $validated['path'];

            if (!str_contains($path, "tenant-{$tenantId}")) {
                return response()->json([
                    'message' => 'Unauthorized to delete this file'
                ], 403);
            }

            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);

                Log::info('File deleted successfully', [
                    'tenant_id' => $tenantId,
                    'path' => $path,
                    'deleted_by' => auth()->id(),
                ]);

                return response()->json([
                    'message' => 'File deleted successfully'
                ]);
            }

            return response()->json([
                'message' => 'File not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('File deletion failed', [
                'error' => $e->getMessage(),
                'path' => $validated['path'] ?? null,
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'message' => 'Failed to delete file',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    private function getTenantId(Request $request): int
    {
        $tenant = $request->attributes->get('tenant');
        
        if (!$tenant) {
            throw new \Exception('Tenant context not found');
        }

        return $tenant->id;
    }
}
