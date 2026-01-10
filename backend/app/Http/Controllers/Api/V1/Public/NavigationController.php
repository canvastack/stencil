<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\TenantHeaderConfig;
use App\Models\TenantMenu;
use App\Models\TenantFooterConfig;
use Spatie\Multitenancy\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NavigationController extends Controller
{
    public function getHeader(string $tenantSlug): JsonResponse
    {
        try {
            $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
            
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found'
                ], 404);
            }

            $config = TenantHeaderConfig::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->first();
            
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
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve public header configuration', [
                'tenant_slug' => $tenantSlug,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve header configuration'
            ], 500);
        }
    }

    public function getFooter(string $tenantSlug): JsonResponse
    {
        try {
            $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
            
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found'
                ], 404);
            }

            $config = TenantFooterConfig::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->first();
            
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
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve public footer configuration', [
                'tenant_slug' => $tenantSlug,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve footer configuration'
            ], 500);
        }
    }

    public function getMenus(Request $request, string $tenantSlug): JsonResponse
    {
        try {
            $tenant = TenantEloquentModel::where('slug', $tenantSlug)->first();
            
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tenant not found'
                ], 404);
            }

            $query = TenantMenu::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->where('is_visible', true);

            $location = $request->query('location', 'all');
            if ($location !== 'all') {
                if ($location === 'header') {
                    $query->where('show_in_header', true);
                } elseif ($location === 'footer') {
                    $query->where('show_in_footer', true);
                } elseif ($location === 'mobile') {
                    $query->where('show_in_mobile', true);
                }
            }

            $query->orderBy('sort_order')->orderBy('label');

            $menus = $query->get();
            $hierarchical = TenantMenu::buildHierarchy($menus);
            
            $data = collect($hierarchical)->map(function ($item) {
                return $this->formatMenuResponse($item);
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve public menus', [
                'tenant_slug' => $tenantSlug,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve menus'
            ], 500);
        }
    }

    private function formatMenuResponse(array $item): array
    {
        $response = [
            'uuid' => $item['uuid'] ?? null,
            'label' => $item['label'] ?? '',
            'path' => $item['path'] ?? '',
            'icon' => $item['icon'] ?? null,
            'description' => $item['description'] ?? null,
            'target' => $item['target'] ?? '_self',
            'is_external' => $item['is_external'] ?? false,
            'requires_auth' => $item['requires_auth'] ?? false,
            'badge_text' => $item['badge_text'] ?? null,
            'badge_color' => $item['badge_color'] ?? null,
            'custom_class' => $item['custom_class'] ?? null,
        ];

        if (isset($item['children_items']) && count($item['children_items']) > 0) {
            $response['children'] = collect($item['children_items'])->map(function ($child) {
                return $this->formatMenuResponse($child);
            })->toArray();
        } else {
            $response['children'] = [];
        }

        return $response;
    }
}
