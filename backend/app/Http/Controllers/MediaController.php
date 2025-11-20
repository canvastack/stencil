<?php

namespace App\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\MediaFile;
use App\Infrastructure\Persistence\Eloquent\Models\MediaFolder;
use App\Domain\Media\Services\MediaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class MediaController extends Controller
{
    public function __construct(
        protected MediaService $mediaService
    ) {}

    public function uploadFile(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:52428800',
            'folder_id' => 'sometimes|exists:media_folders,id',
            'alt_text' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:1000',
        ]);

        try {
            $file = $request->file('file');
            $mediaFile = $this->mediaService->uploadFile($file, [
                'folder_id' => $request->input('folder_id'),
                'alt_text' => $request->input('alt_text'),
                'description' => $request->input('description'),
            ]);

            Log::info('File uploaded', [
                'media_file_id' => $mediaFile->id,
                'uploaded_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'File uploaded successfully',
                'data' => $mediaFile
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to upload file', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to upload file',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    public function listFiles(Request $request): JsonResponse
    {
        $files = MediaFile::with(['folder', 'uploadedBy'])
            ->when(
                $request->get('folder_id'),
                fn($q) => $q->where('folder_id', $request->get('folder_id'))
            )
            ->when(
                $request->get('status'),
                fn($q) => $q->where('status', $request->get('status'))
            )
            ->when(
                $request->get('mime_type'),
                fn($q) => $q->where('mime_type', $request->get('mime_type'))
            )
            ->when(
                $request->get('type') === 'images',
                fn($q) => $q->images()
            )
            ->when(
                $request->get('type') === 'documents',
                fn($q) => $q->documents()
            )
            ->latest()
            ->paginate($request->get('limit', 20));

        return response()->json([
            'data' => $files->items(),
            'pagination' => [
                'total' => $files->total(),
                'per_page' => $files->perPage(),
                'current_page' => $files->currentPage(),
                'last_page' => $files->lastPage(),
            ]
        ]);
    }

    public function getFile(MediaFile $mediaFile): JsonResponse
    {
        return response()->json([
            'data' => $mediaFile->load(['folder', 'uploadedBy', 'associations'])
        ]);
    }

    public function updateFile(Request $request, MediaFile $mediaFile): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'alt_text' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:1000',
        ]);

        try {
            $mediaFile = $this->mediaService->updateFileMetadata($mediaFile, $validated);

            return response()->json([
                'message' => 'File updated successfully',
                'data' => $mediaFile
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteFile(MediaFile $mediaFile): JsonResponse
    {
        try {
            $this->mediaService->deleteFile($mediaFile);

            Log::info('File deleted', [
                'media_file_id' => $mediaFile->id,
                'deleted_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete file', [
                'media_file_id' => $mediaFile->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to delete file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createFolder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'sometimes|string|max:1000',
            'parent_id' => 'sometimes|exists:media_folders,id',
            'is_public' => 'sometimes|boolean',
        ]);

        try {
            $folder = $this->mediaService->createFolder($validated);

            return response()->json([
                'message' => 'Folder created successfully',
                'data' => $folder
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function listFolders(Request $request): JsonResponse
    {
        $folders = MediaFolder::with(['parent', 'children', 'mediaFiles'])
            ->when(
                $request->get('parent_id'),
                fn($q) => $q->where('parent_id', $request->get('parent_id'))
            )
            ->when(
                !$request->has('parent_id'),
                fn($q) => $q->roots()
            )
            ->orderBy('sort_order')
            ->paginate($request->get('limit', 20));

        return response()->json([
            'data' => $folders->items(),
            'pagination' => [
                'total' => $folders->total(),
                'per_page' => $folders->perPage(),
                'current_page' => $folders->currentPage(),
                'last_page' => $folders->lastPage(),
            ]
        ]);
    }

    public function moveFile(Request $request, MediaFile $mediaFile): JsonResponse
    {
        $validated = $request->validate([
            'folder_id' => 'nullable|exists:media_folders,id',
        ]);

        try {
            $mediaFile = $this->mediaService->moveFile($mediaFile, $validated['folder_id'] ?? null);

            return response()->json([
                'message' => 'File moved successfully',
                'data' => $mediaFile
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to move file',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
