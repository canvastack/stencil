<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant\Navigation;

use App\Http\Controllers\Controller;
use App\Models\TenantMenu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MenuController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = TenantMenu::query();

            $location = $request->query('location', 'all');
            if ($location !== 'all') {
                $query->forLocation($location);
            }

            $status = $request->query('status', 'active');
            if ($status === 'active') {
                $query->active();
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }

            $includeChildren = $request->query('include_children', 'true') === 'true';

            $parentUuid = $request->query('parent_uuid');
            if (!$includeChildren) {
                if ($parentUuid === 'null' || $parentUuid === null) {
                    $query->topLevel();
                } elseif ($parentUuid) {
                    $parent = TenantMenu::where('uuid', $parentUuid)->first();
                    if ($parent) {
                        $query->where('parent_id', $parent->id);
                    }
                }
            }

            $sort = $request->query('sort', 'order');
            if ($sort === 'order') {
                $query->ordered();
            } elseif ($sort === 'name') {
                $query->orderBy('label');
            } elseif ($sort === 'created_at') {
                $query->orderBy('created_at', 'desc');
            }


            if ($includeChildren) {
                $menus = $query->get();
                \Log::info('MenuController: Fetched menus for hierarchy', [
                    'count' => $menus->count(),
                    'menus' => $menus->pluck('label', 'id')->toArray()
                ]);
                
                $hierarchical = TenantMenu::buildHierarchy($menus);
                \Log::info('MenuController: Built hierarchy', [
                    'hierarchy_count' => count($hierarchical)
                ]);
                
                $data = collect($hierarchical)->map(function ($item) {
                    return $this->formatMenuResponse($item, true);
                });
            } else {
                $menus = $query->get();
                $data = $menus->map(function ($menu) {
                    return $this->formatMenuResponse($menu->toArray(), false);
                });
            }

            $total = TenantMenu::count();
            $activeCount = TenantMenu::active()->count();
            
            \Log::info('MenuController: Returning response', [
                'data_count' => count($data),
                'total' => $total,
                'active' => $activeCount
            ]);

            return response()->json([
                'success' => true,
                'data' => $data,
                'meta' => [
                    'total' => $total,
                    'active_count' => $activeCount,
                    'inactive_count' => $total - $activeCount,
                ],
                'message' => 'Menus retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve menus', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve menus',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function show(string $uuid): JsonResponse
    {
        try {
            $menu = TenantMenu::where('uuid', $uuid)->first();
            
            if (!$menu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu not found'
                ], 404);
            }

            $parent = $menu->parent;
            $children = $menu->children;

            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $menu->uuid,
                    'parent_uuid' => $parent ? $parent->uuid : null,
                    'label' => $menu->label,
                    'path' => $menu->path,
                    'icon' => $menu->icon,
                    'description' => $menu->description,
                    'target' => $menu->target,
                    'is_external' => $menu->is_external,
                    'requires_auth' => $menu->requires_auth,
                    'is_active' => $menu->is_active,
                    'is_visible' => $menu->is_visible,
                    'show_in_header' => $menu->show_in_header,
                    'show_in_footer' => $menu->show_in_footer,
                    'show_in_mobile' => $menu->show_in_mobile,
                    'sort_order' => $menu->sort_order,
                    'custom_class' => $menu->custom_class,
                    'badge_text' => $menu->badge_text,
                    'badge_color' => $menu->badge_color,
                    'allowed_roles' => $menu->allowed_roles,
                    'click_count' => $menu->click_count,
                    'created_at' => $menu->created_at->toISOString(),
                    'updated_at' => $menu->updated_at->toISOString(),
                    'parent' => $parent ? [
                        'uuid' => $parent->uuid,
                        'label' => $parent->label,
                        'path' => $parent->path,
                    ] : null,
                    'children' => $children->map(fn($child) => [
                        'uuid' => $child->uuid,
                        'label' => $child->label,
                        'path' => $child->path,
                        'sort_order' => $child->sort_order,
                        'is_active' => $child->is_active,
                    ]),
                ],
                'message' => 'Menu retrieved successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to retrieve menu', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'parent_uuid' => 'nullable|string',
                'label' => 'required|string|max:255',
                'path' => 'nullable|string|max:500',
                'icon' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'target' => 'nullable|string|in:_self,_blank,_parent,_top',
                'is_external' => 'nullable|boolean',
                'requires_auth' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
                'is_visible' => 'nullable|boolean',
                'show_in_header' => 'nullable|boolean',
                'show_in_footer' => 'nullable|boolean',
                'show_in_mobile' => 'nullable|boolean',
                'sort_order' => 'nullable|integer|min:0',
                'custom_class' => 'nullable|string|max:255',
                'badge_text' => 'nullable|string|max:50',
                'badge_color' => 'nullable|string|max:20',
                'allowed_roles' => 'nullable|array',
                'notes' => 'nullable|string',
            ], [
                'label.required' => 'Label menu harus diisi',
                'label.max' => 'Label menu maksimal 255 karakter',
                'path.max' => 'Path maksimal 500 karakter',
                'target.in' => 'Target harus salah satu dari: _self, _blank, _parent, _top',
                'sort_order.min' => 'Urutan harus bilangan positif',
            ]);

            $parentId = null;
            if (!empty($validated['parent_uuid'])) {
                $parent = TenantMenu::where('uuid', $validated['parent_uuid'])->first();
                if (!$parent) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Parent menu not found',
                        'errors' => [
                            'parent_uuid' => ['Parent menu tidak ditemukan atau bukan milik tenant Anda']
                        ]
                    ], 422);
                }
                $parentId = $parent->id;
            }

            $menuData = $validated;
            unset($menuData['parent_uuid']);
            $menuData['parent_id'] = $parentId;

            if (!isset($menuData['sort_order'])) {
                $maxOrder = TenantMenu::where('parent_id', $parentId)->max('sort_order') ?? 0;
                $menuData['sort_order'] = $maxOrder + 10;
            }

            $menu = TenantMenu::create($menuData);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $menu->uuid,
                    'label' => $menu->label,
                    'path' => $menu->path,
                    'sort_order' => $menu->sort_order,
                    'is_active' => $menu->is_active,
                    'created_at' => $menu->created_at->toISOString(),
                ],
                'message' => 'Menu created successfully'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to create menu', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function update(Request $request, string $uuid): JsonResponse
    {
        try {
            $validated = $request->validate([
                'parent_uuid' => 'nullable|string',
                'label' => 'nullable|string|max:255',
                'path' => 'nullable|string|max:500',
                'icon' => 'nullable|string|max:100',
                'description' => 'nullable|string',
                'target' => 'nullable|string|in:_self,_blank,_parent,_top',
                'is_external' => 'nullable|boolean',
                'requires_auth' => 'nullable|boolean',
                'is_active' => 'nullable|boolean',
                'is_visible' => 'nullable|boolean',
                'show_in_header' => 'nullable|boolean',
                'show_in_footer' => 'nullable|boolean',
                'show_in_mobile' => 'nullable|boolean',
                'sort_order' => 'nullable|integer|min:0',
                'custom_class' => 'nullable|string|max:255',
                'badge_text' => 'nullable|string|max:50',
                'badge_color' => 'nullable|string|max:20',
                'allowed_roles' => 'nullable|array',
                'notes' => 'nullable|string',
            ], [
                'label.max' => 'Label menu maksimal 255 karakter',
                'path.max' => 'Path maksimal 500 karakter',
                'target.in' => 'Target harus salah satu dari: _self, _blank, _parent, _top',
                'sort_order.min' => 'Urutan harus bilangan positif',
            ]);

            $menu = TenantMenu::where('uuid', $uuid)->first();
            
            if (!$menu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu not found'
                ], 404);
            }

            DB::beginTransaction();
            try {
                if (isset($validated['parent_uuid'])) {
                    if ($validated['parent_uuid'] === null || $validated['parent_uuid'] === '') {
                        $menu->parent_id = null;
                    } else {
                        $parent = TenantMenu::where('uuid', $validated['parent_uuid'])->first();
                        if (!$parent) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Parent menu not found',
                                'errors' => [
                                    'parent_uuid' => ['Parent menu tidak ditemukan']
                                ]
                            ], 422);
                        }
                        
                        if ($parent->id === $menu->id) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Menu cannot be its own parent',
                                'errors' => [
                                    'parent_uuid' => ['Menu tidak bisa menjadi parent dari dirinya sendiri']
                                ]
                            ], 422);
                        }
                        
                        $menu->parent_id = $parent->id;
                    }
                    unset($validated['parent_uuid']);
                }

                $menu->fill($validated);
                $menu->save();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'uuid' => $menu->uuid,
                        'label' => $menu->label,
                        'path' => $menu->path,
                        'sort_order' => $menu->sort_order,
                        'is_active' => $menu->is_active,
                        'updated_at' => $menu->updated_at->toISOString(),
                    ],
                    'message' => 'Menu updated successfully'
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
            \Log::error('Failed to update menu', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function destroy(string $uuid): JsonResponse
    {
        try {
            $menu = TenantMenu::where('uuid', $uuid)->first();
            
            if (!$menu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu not found'
                ], 404);
            }

            $childrenCount = $menu->children()->count();
            if ($childrenCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete menu with children',
                    'errors' => [
                        'children' => ["Menu ini memiliki {$childrenCount} sub-menu. Hapus sub-menu terlebih dahulu."]
                    ]
                ], 422);
            }

            $menu->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Menu deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to delete menu', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function reorder(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'items' => 'required|array|min:1',
                'items.*.uuid' => 'required|string',
                'items.*.sort_order' => 'required|integer|min:0',
            ], [
                'items.required' => 'Data items harus diisi',
                'items.array' => 'Data items harus berupa array',
                'items.*.uuid.required' => 'UUID menu harus diisi',
                'items.*.sort_order.required' => 'Sort order harus diisi',
                'items.*.sort_order.min' => 'Sort order harus bilangan positif',
            ]);

            DB::beginTransaction();
            try {
                $updated = 0;
                foreach ($validated['items'] as $item) {
                    $menu = TenantMenu::where('uuid', $item['uuid'])->first();
                    if ($menu) {
                        $menu->sort_order = $item['sort_order'];
                        $menu->save();
                        $updated++;
                    }
                }

                DB::commit();

                return response()->json([
                    'success' => true,
                    'data' => [
                        'updated_count' => $updated,
                    ],
                    'message' => "Successfully reordered {$updated} menu items"
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
            \Log::error('Failed to reorder menus', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder menus',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function restore(string $uuid): JsonResponse
    {
        try {
            $menu = TenantMenu::withTrashed()->where('uuid', $uuid)->first();
            
            if (!$menu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu not found'
                ], 404);
            }

            if (!$menu->trashed()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Menu is not deleted',
                    'errors' => [
                        'menu' => ['Menu ini tidak dalam status terhapus']
                    ]
                ], 422);
            }

            $menu->restore();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'uuid' => $menu->uuid,
                    'label' => $menu->label,
                    'is_active' => $menu->is_active,
                ],
                'message' => 'Menu restored successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to restore menu', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to restore menu',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    private function formatMenuResponse(array $item, bool $includeChildren = false): array
    {
        $parentUuid = null;
        if (isset($item['parent_id']) && $item['parent_id'] !== null) {
            $parent = TenantMenu::where('id', $item['parent_id'])->first();
            $parentUuid = $parent ? $parent->uuid : null;
        }

        $response = [
            'uuid' => $item['uuid'] ?? null,
            'parent_uuid' => $parentUuid,
            'label' => $item['label'] ?? '',
            'path' => $item['path'] ?? '',
            'icon' => $item['icon'] ?? null,
            'description' => $item['description'] ?? null,
            'target' => $item['target'] ?? '_self',
            'is_external' => $item['is_external'] ?? false,
            'requires_auth' => $item['requires_auth'] ?? false,
            'is_active' => $item['is_active'] ?? true,
            'is_visible' => $item['is_visible'] ?? true,
            'show_in_header' => $item['show_in_header'] ?? true,
            'show_in_footer' => $item['show_in_footer'] ?? false,
            'show_in_mobile' => $item['show_in_mobile'] ?? true,
            'sort_order' => $item['sort_order'] ?? 0,
            'custom_class' => $item['custom_class'] ?? null,
            'badge_text' => $item['badge_text'] ?? null,
            'badge_color' => $item['badge_color'] ?? null,
            'allowed_roles' => $item['allowed_roles'] ?? [],
            'click_count' => $item['click_count'] ?? 0,
        ];

        if ($includeChildren && isset($item['children_items'])) {
            $response['children'] = collect($item['children_items'])->map(function ($child) {
                return $this->formatMenuResponse($child, true);
            })->toArray();
        }

        return $response;
    }
}
