<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Navigation;

use App\Http\Controllers\Controller;
use App\Models\TenantHeaderConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HeaderConfigController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $config = TenantHeaderConfig::active()->first();
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Header configuration not found for this tenant',
                    'data' => null
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $config->uuid,
                    'brand_name' => $config->brand_name,
                    'brand_initials' => $config->brand_initials,
                    'brand_tagline' => $config->brand_tagline,
                    'logo_url' => $config->logo_url,
                    'logo_dark_url' => $config->logo_dark_url,
                    'logo_width' => $config->logo_width,
                    'logo_height' => $config->logo_height,
                    'logo_alt_text' => $config->logo_alt_text,
                    'use_logo' => $config->use_logo,
                    'header_style' => $config->header_style,
                    'show_cart' => $config->show_cart,
                    'show_search' => $config->show_search,
                    'show_login' => $config->show_login,
                    'sticky_header' => $config->sticky_header,
                    'transparent_on_scroll' => $config->transparent_on_scroll,
                    'styling_options' => $config->styling_options,
                    'login_button_text' => $config->login_button_text,
                    'cart_button_text' => $config->cart_button_text,
                    'search_placeholder' => $config->search_placeholder,
                    'is_active' => $config->is_active,
                    'notes' => $config->notes,
                    'version' => $config->version,
                    'created_at' => $config->created_at->toISOString(),
                    'updated_at' => $config->updated_at->toISOString(),
                ],
                'message' => 'Header configuration retrieved successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve header configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve header configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'brand_name' => 'required|string|max:255',
                'brand_initials' => 'nullable|string|max:10',
                'brand_tagline' => 'nullable|string',
                'logo_url' => 'nullable|string|max:500',
                'logo_dark_url' => 'nullable|string|max:500',
                'logo_width' => 'nullable|integer|min:20|max:500',
                'logo_height' => 'nullable|integer|min:20|max:200',
                'logo_alt_text' => 'nullable|string|max:255',
                'use_logo' => 'nullable|boolean',
                'header_style' => 'nullable|string|in:default,minimal,centered',
                'show_cart' => 'nullable|boolean',
                'show_search' => 'nullable|boolean',
                'show_login' => 'nullable|boolean',
                'sticky_header' => 'nullable|boolean',
                'transparent_on_scroll' => 'nullable|boolean',
                'styling_options' => 'nullable|array',
                'styling_options.backgroundColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'styling_options.textColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'styling_options.activeColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'styling_options.hoverColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'login_button_text' => 'nullable|string|max:50',
                'cart_button_text' => 'nullable|string|max:50',
                'search_placeholder' => 'nullable|string|max:100',
                'is_active' => 'nullable|boolean',
                'notes' => 'nullable|string',
            ], [
                'brand_name.required' => 'Nama brand harus diisi',
                'brand_name.max' => 'Nama brand maksimal 255 karakter',
                'brand_initials.max' => 'Inisial brand maksimal 10 karakter',
                'logo_width.min' => 'Lebar logo minimal 20 piksel',
                'logo_width.max' => 'Lebar logo maksimal 500 piksel',
                'logo_height.min' => 'Tinggi logo minimal 20 piksel',
                'logo_height.max' => 'Tinggi logo maksimal 200 piksel',
                'header_style.in' => 'Style header harus salah satu dari: default, minimal, centered',
                'styling_options.backgroundColor.regex' => 'Warna background harus format hex yang valid (contoh: #FFFFFF)',
                'styling_options.textColor.regex' => 'Warna teks harus format hex yang valid',
                'styling_options.activeColor.regex' => 'Warna aktif harus format hex yang valid',
                'styling_options.hoverColor.regex' => 'Warna hover harus format hex yang valid',
            ]);

            $existingConfig = TenantHeaderConfig::first();
            if ($existingConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Header configuration already exists for this tenant. Please use update endpoint.',
                    'errors' => [
                        'tenant' => ['A header configuration already exists']
                    ]
                ], 422);
            }

            $config = TenantHeaderConfig::create($validated);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $config->uuid,
                    'brand_name' => $config->brand_name,
                    'brand_initials' => $config->brand_initials,
                    'brand_tagline' => $config->brand_tagline,
                    'is_active' => $config->is_active,
                    'created_at' => $config->created_at->toISOString(),
                ],
                'message' => 'Header configuration created successfully'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to create header configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create header configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function update(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'brand_name' => 'nullable|string|max:255',
                'brand_initials' => 'nullable|string|max:10',
                'brand_tagline' => 'nullable|string',
                'logo_url' => 'nullable|string|max:500',
                'logo_dark_url' => 'nullable|string|max:500',
                'logo_width' => 'nullable|integer|min:20|max:500',
                'logo_height' => 'nullable|integer|min:20|max:200',
                'logo_alt_text' => 'nullable|string|max:255',
                'use_logo' => 'nullable|boolean',
                'header_style' => 'nullable|string|in:default,minimal,centered',
                'show_cart' => 'nullable|boolean',
                'show_search' => 'nullable|boolean',
                'show_login' => 'nullable|boolean',
                'sticky_header' => 'nullable|boolean',
                'transparent_on_scroll' => 'nullable|boolean',
                'styling_options' => 'nullable|array',
                'styling_options.backgroundColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'styling_options.textColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'styling_options.activeColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'styling_options.hoverColor' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
                'login_button_text' => 'nullable|string|max:50',
                'cart_button_text' => 'nullable|string|max:50',
                'search_placeholder' => 'nullable|string|max:100',
                'is_active' => 'nullable|boolean',
                'notes' => 'nullable|string',
            ], [
                'brand_name.max' => 'Nama brand maksimal 255 karakter',
                'brand_initials.max' => 'Inisial brand maksimal 10 karakter',
                'logo_width.min' => 'Lebar logo minimal 20 piksel',
                'logo_width.max' => 'Lebar logo maksimal 500 piksel',
                'logo_height.min' => 'Tinggi logo minimal 20 piksel',
                'logo_height.max' => 'Tinggi logo maksimal 200 piksel',
                'header_style.in' => 'Style header harus salah satu dari: default, minimal, centered',
                'styling_options.backgroundColor.regex' => 'Warna background harus format hex yang valid (contoh: #FFFFFF)',
                'styling_options.textColor.regex' => 'Warna teks harus format hex yang valid',
                'styling_options.activeColor.regex' => 'Warna aktif harus format hex yang valid',
                'styling_options.hoverColor.regex' => 'Warna hover harus format hex yang valid',
            ]);

            $config = TenantHeaderConfig::first();
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Header configuration not found for this tenant'
                ], 404);
            }

            DB::beginTransaction();
            try {
                $config->version = $config->version + 1;
                $config->fill($validated);
                $config->save();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'uuid' => $config->uuid,
                        'brand_name' => $config->brand_name,
                        'brand_initials' => $config->brand_initials,
                        'brand_tagline' => $config->brand_tagline,
                        'is_active' => $config->is_active,
                        'version' => $config->version,
                        'updated_at' => $config->updated_at->toISOString(),
                    ],
                    'message' => 'Header configuration updated successfully'
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update header configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update header configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
