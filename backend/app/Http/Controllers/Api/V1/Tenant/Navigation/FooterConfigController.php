<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Navigation;

use App\Http\Controllers\Controller;
use App\Models\TenantFooterConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;

class FooterConfigController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $config = TenantFooterConfig::active()->first();
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Footer configuration not found for this tenant',
                    'data' => null
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $config->uuid,
                    'footer_sections' => $config->footer_sections,
                    'contact_address' => $config->contact_address,
                    'contact_phone' => $config->contact_phone,
                    'contact_email' => $config->contact_email,
                    'contact_working_hours' => $config->contact_working_hours,
                    'social_links' => $config->social_links,
                    'show_newsletter' => $config->show_newsletter,
                    'newsletter_title' => $config->newsletter_title,
                    'newsletter_subtitle' => $config->newsletter_subtitle,
                    'newsletter_button_text' => $config->newsletter_button_text,
                    'newsletter_api_endpoint' => $config->newsletter_api_endpoint,
                    'about_text' => $config->about_text,
                    'copyright_text' => $config->copyright_text,
                    'bottom_text' => $config->bottom_text,
                    'show_social_links' => $config->show_social_links,
                    'show_contact_info' => $config->show_contact_info,
                    'show_sections' => $config->show_sections,
                    'footer_style' => $config->footer_style,
                    'background_color' => $config->background_color,
                    'text_color' => $config->text_color,
                    'legal_links' => $config->legal_links,
                    'is_active' => $config->is_active,
                    'notes' => $config->notes,
                    'version' => $config->version,
                    'created_at' => $config->created_at->toISOString(),
                    'updated_at' => $config->updated_at->toISOString(),
                ],
                'message' => 'Footer configuration retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve footer configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve footer configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'footer_sections' => 'nullable|array',
                'footer_sections.*.title' => 'required|string|max:255',
                'footer_sections.*.links' => 'required|array',
                'footer_sections.*.links.*.label' => 'required|string|max:255',
                'footer_sections.*.links.*.path' => 'required|string|max:500',
                'footer_sections.*.sort_order' => 'required|integer',
                'contact_address' => 'nullable|string',
                'contact_phone' => 'nullable|string|max:50',
                'contact_email' => 'nullable|email|max:255',
                'contact_working_hours' => 'nullable|string|max:255',
                'social_links' => 'nullable|array',
                'social_links.*.platform' => 'required|string|max:50',
                'social_links.*.url' => 'required|url|max:500',
                'social_links.*.icon' => 'required|string|max:50',
                'show_newsletter' => 'nullable|boolean',
                'newsletter_title' => 'nullable|string|max:255',
                'newsletter_subtitle' => 'nullable|string',
                'newsletter_button_text' => 'nullable|string|max:50',
                'newsletter_api_endpoint' => 'nullable|string|max:500',
                'about_text' => 'nullable|string',
                'copyright_text' => 'nullable|string|max:500',
                'bottom_text' => 'nullable|string|max:500',
                'show_social_links' => 'nullable|boolean',
                'show_contact_info' => 'nullable|boolean',
                'show_sections' => 'nullable|boolean',
                'footer_style' => 'nullable|string|in:default,minimal,modern,compact',
                'background_color' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/',
                'text_color' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/',
                'legal_links' => 'nullable|array',
                'legal_links.*.label' => 'required|string|max:255',
                'legal_links.*.path' => 'required|string|max:500',
                'is_active' => 'nullable|boolean',
                'notes' => 'nullable|string',
            ], [
                'footer_sections.*.title.required' => 'Judul section footer harus diisi',
                'footer_sections.*.links.required' => 'Links di section footer harus diisi',
                'footer_sections.*.links.*.label.required' => 'Label link harus diisi',
                'footer_sections.*.links.*.path.required' => 'Path link harus diisi',
                'contact_email.email' => 'Format email tidak valid',
                'social_links.*.url.url' => 'Format URL social media tidak valid',
                'footer_style.in' => 'Style footer harus salah satu dari: default, minimal, modern, compact',
                'background_color.regex' => 'Warna background harus format hex yang valid (contoh: #FFFFFF)',
                'text_color.regex' => 'Warna teks harus format hex yang valid',
            ]);

            $existingConfig = TenantFooterConfig::first();
            if ($existingConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Footer configuration already exists for this tenant. Please use update endpoint.',
                    'errors' => [
                        'tenant' => ['A footer configuration already exists']
                    ]
                ], 422);
            }

            $config = TenantFooterConfig::create($validated);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $config->uuid,
                    'footer_sections' => $config->footer_sections,
                    'social_links' => $config->social_links,
                    'is_active' => $config->is_active,
                    'created_at' => $config->created_at->toISOString(),
                ],
                'message' => 'Footer configuration created successfully'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to create footer configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create footer configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function update(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'footer_sections' => 'nullable|array',
                'footer_sections.*.title' => 'required_with:footer_sections|string|max:255',
                'footer_sections.*.links' => 'required_with:footer_sections|array',
                'footer_sections.*.links.*.label' => 'required|string|max:255',
                'footer_sections.*.links.*.path' => 'required|string|max:500',
                'footer_sections.*.sort_order' => 'required_with:footer_sections|integer',
                'contact_address' => 'nullable|string',
                'contact_phone' => 'nullable|string|max:50',
                'contact_email' => 'nullable|email|max:255',
                'contact_working_hours' => 'nullable|string|max:255',
                'social_links' => 'nullable|array',
                'social_links.*.platform' => 'required_with:social_links|string|max:50',
                'social_links.*.url' => 'required_with:social_links|url|max:500',
                'social_links.*.icon' => 'required_with:social_links|string|max:50',
                'show_newsletter' => 'nullable|boolean',
                'newsletter_title' => 'nullable|string|max:255',
                'newsletter_subtitle' => 'nullable|string',
                'newsletter_button_text' => 'nullable|string|max:50',
                'newsletter_api_endpoint' => 'nullable|string|max:500',
                'about_text' => 'nullable|string',
                'copyright_text' => 'nullable|string|max:500',
                'bottom_text' => 'nullable|string|max:500',
                'show_social_links' => 'nullable|boolean',
                'show_contact_info' => 'nullable|boolean',
                'show_sections' => 'nullable|boolean',
                'footer_style' => 'nullable|string|in:default,minimal,modern,compact',
                'background_color' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/',
                'text_color' => 'nullable|string|regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/',
                'legal_links' => 'nullable|array',
                'legal_links.*.label' => 'required_with:legal_links|string|max:255',
                'legal_links.*.path' => 'required_with:legal_links|string|max:500',
                'is_active' => 'nullable|boolean',
                'notes' => 'nullable|string',
            ], [
                'footer_sections.*.title.required_with' => 'Judul section footer harus diisi',
                'footer_sections.*.links.required_with' => 'Links di section footer harus diisi',
                'footer_sections.*.links.*.label.required' => 'Label link harus diisi',
                'footer_sections.*.links.*.path.required' => 'Path link harus diisi',
                'contact_email.email' => 'Format email tidak valid',
                'social_links.*.url.url' => 'Format URL social media tidak valid',
                'footer_style.in' => 'Style footer harus salah satu dari: default, minimal, modern, compact',
                'background_color.regex' => 'Warna background harus format hex yang valid (contoh: #FFFFFF)',
                'text_color.regex' => 'Warna teks harus format hex yang valid',
            ]);

            $config = TenantFooterConfig::first();
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Footer configuration not found for this tenant'
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
                        'footer_sections' => $config->footer_sections,
                        'social_links' => $config->social_links,
                        'is_active' => $config->is_active,
                        'version' => $config->version,
                        'updated_at' => $config->updated_at->toISOString(),
                    ],
                    'message' => 'Footer configuration updated successfully'
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
            \Log::error('Failed to update footer configuration', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update footer configuration',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
