<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Multi-tenant API routes for the CanvaStack Stencil platform.
| Routes are organized by account type:
| - Account A (Platform): Platform management, tenant oversight, analytics
| - Account B (Tenant): Business operations, customer/product management
|
*/

// Authentication & User Info
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'account_type' => $user instanceof AccountEloquentModel ? 'platform' : 'tenant',
        'tenant_id' => $user->tenant_id ?? null,
    ]);
});

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'version' => '1.0.0',
        'environment' => app()->environment()
    ]);
});

// Authentication Routes (Both Account A & B)
require __DIR__.'/auth.php';

// Platform Routes (Account A)
require __DIR__.'/platform.php';

// Tenant Routes (Account B)
Route::prefix('tenant')->group(function () {
    require __DIR__.'/tenant.php';
});

// Public API (No authentication required)
Route::prefix('public')->group(function () {
    // Tenant discovery by domain
    Route::get('/tenant/discover', function (Request $request) {
        $domain = $request->get('domain');
        
        if (!$domain) {
            return response()->json(['error' => 'Domain parameter required'], 400);
        }
        
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('domain', $domain)
            ->orWhere('slug', $domain)
            ->first();
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }
        
        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $tenant->domain,
            'status' => $tenant->status,
        ]);
    });
    
    // Platform statistics (public facing)
    Route::get('/stats', function () {
        $tenantCount = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('status', 'active')->count();
        
        return response()->json([
            'total_businesses' => $tenantCount,
            'platform_version' => '1.0.0',
            'uptime' => '99.9%'
        ]);
    });
});

// Test CMS Endpoints without auth (for testing)
Route::prefix('test')->group(function () {
    Route::get('/tenant/cms/pages', function () {
        // Get real data from database for the demo tenant
        $demoTenant = DB::table('tenants')->where('slug', 'demo-etching')->first();
        if (!$demoTenant) {
            $demoTenant = DB::table('tenants')->first(); // Fallback to first tenant
        }
        
        if ($demoTenant) {
            $pages = DB::table('pages')
                ->where('tenant_id', $demoTenant->id)
                ->where('status', 'published')
                ->orderBy('sort_order')
                ->get()
                ->map(function ($page) {
                    return [
                        'id' => $page->id,
                        'uuid' => $page->uuid,
                        'title' => $page->title,
                        'slug' => $page->slug,
                        'description' => $page->description,
                        'content' => json_decode($page->content, true),
                        'template' => $page->template,
                        'meta_data' => json_decode($page->meta_data, true),
                        'status' => $page->status,
                        'is_homepage' => (bool) $page->is_homepage,
                        'sort_order' => $page->sort_order,
                        'language' => $page->language,
                        'parent_id' => $page->parent_id,
                        'published_at' => $page->published_at,
                        'created_at' => $page->created_at,
                        'updated_at' => $page->updated_at,
                    ];
                })
                ->toArray();
                
            if (count($pages) > 0) {
                return response()->json([
                    'success' => true,
                    'data' => $pages,
                    'message' => 'Real CMS pages from database',
                    'meta' => [
                        'timestamp' => now()->toISOString(),
                        'tenant_context' => $demoTenant->name,
                        'request_id' => uniqid(),
                        'total' => count($pages),
                        'current_page' => 1,
                        'per_page' => 15,
                        'last_page' => 1
                    ]
                ]);
            }
        }
        
        // Fallback to sample data if no database data found
        $samplePages = [
            [
                'id' => 1,
                'uuid' => '550e8400-e29b-41d4-a716-446655440001',
                'title' => 'Home Page',
                'slug' => 'home',
                'description' => 'Welcome to our homepage',
                'content' => [
                    'hero' => [
                        'title' => [
                            'typing' => [
                                'Welcome to Our Platform',
                                'Build Amazing Things',
                                'Transform Your Business',
                                'Innovate with Confidence',
                                'Scale Your Success'
                            ]
                        ],
                        'subtitle' => 'Build amazing things with our tools',
                        'cta_text' => 'Get Started',
                        'cta_link' => '/dashboard'
                    ],
                    'features' => [
                        [
                            'title' => 'Easy to Use',
                            'description' => 'Intuitive interface designed for productivity'
                        ],
                        [
                            'title' => 'Powerful Features',
                            'description' => 'All the tools you need in one place'
                        ],
                        [
                            'title' => '24/7 Support',
                            'description' => 'We\'re here to help whenever you need us'
                        ]
                    ]
                ],
                'template' => 'homepage',
                'meta_data' => [
                    'seo_title' => 'Home - Our Platform',
                    'seo_description' => 'Welcome to our amazing platform',
                    'og_image' => '/images/og-home.jpg'
                ],
                'status' => 'published',
                'is_homepage' => true,
                'sort_order' => 1,
                'language' => 'en',
                'parent_id' => null,
                'published_at' => now()->toISOString(),
                'created_at' => now()->subDays(30)->toISOString(),
                'updated_at' => now()->subDays(1)->toISOString(),
            ],
            [
                'id' => 2,
                'uuid' => '550e8400-e29b-41d4-a716-446655440002',
                'title' => 'About Us',
                'slug' => 'about',
                'description' => 'Learn more about our company',
                'content' => [
                    'sections' => [
                        [
                            'type' => 'text',
                            'content' => '<p>We are a company dedicated to building amazing software solutions.</p>'
                        ]
                    ]
                ],
                'template' => 'page',
                'meta_data' => [
                    'seo_title' => 'About Us - Our Platform',
                    'seo_description' => 'Learn more about our company and mission'
                ],
                'status' => 'published',
                'is_homepage' => false,
                'sort_order' => 2,
                'language' => 'en',
                'parent_id' => null,
                'published_at' => now()->toISOString(),
                'created_at' => now()->subDays(25)->toISOString(),
                'updated_at' => now()->subDays(2)->toISOString(),
            ],
            [
                'id' => 3,
                'uuid' => '550e8400-e29b-41d4-a716-446655440003',
                'title' => 'Frequently Asked Questions',
                'slug' => 'faq',
                'description' => 'Find answers to common questions',
                'content' => [
                    'faqs' => [
                        [
                            'question' => 'How do I get started?',
                            'answer' => 'Getting started is easy! Simply sign up for an account and follow our onboarding guide.'
                        ],
                        [
                            'question' => 'What payment methods do you accept?',
                            'answer' => 'We accept all major credit cards, PayPal, and bank transfers.'
                        ],
                        [
                            'question' => 'Is there a free trial?',
                            'answer' => 'Yes! We offer a 14-day free trial with no credit card required.'
                        ],
                        [
                            'question' => 'How can I contact support?',
                            'answer' => 'You can reach our support team via email, live chat, or through our contact form.'
                        ]
                    ]
                ],
                'template' => 'faq',
                'meta_data' => [
                    'seo_title' => 'FAQ - Our Platform',
                    'seo_description' => 'Find answers to frequently asked questions about our platform'
                ],
                'status' => 'published',
                'is_homepage' => false,
                'sort_order' => 3,
                'language' => 'en',
                'parent_id' => null,
                'published_at' => now()->toISOString(),
                'created_at' => now()->subDays(20)->toISOString(),
                'updated_at' => now()->subDays(1)->toISOString(),
            ],
            [
                'id' => 4,
                'uuid' => '550e8400-e29b-41d4-a716-446655440004',
                'title' => 'Contact Us',
                'slug' => 'contact',
                'description' => 'Get in touch with our team',
                'content' => [
                    'contact_info' => [
                        'email' => 'contact@ourplatform.com',
                        'phone' => '+1 (555) 123-4567',
                        'address' => '123 Business Street, Suite 100, City, State 12345'
                    ],
                    'contact_form' => [
                        'fields' => [
                            ['name' => 'name', 'type' => 'text', 'label' => 'Full Name', 'required' => true],
                            ['name' => 'email', 'type' => 'email', 'label' => 'Email Address', 'required' => true],
                            ['name' => 'subject', 'type' => 'text', 'label' => 'Subject', 'required' => true],
                            ['name' => 'message', 'type' => 'textarea', 'label' => 'Message', 'required' => true]
                        ]
                    ],
                    'office_hours' => [
                        'monday_friday' => '9:00 AM - 6:00 PM',
                        'saturday' => '10:00 AM - 4:00 PM',
                        'sunday' => 'Closed'
                    ]
                ],
                'template' => 'contact',
                'meta_data' => [
                    'seo_title' => 'Contact Us - Our Platform',
                    'seo_description' => 'Get in touch with our team for support, sales, or partnerships'
                ],
                'status' => 'published',
                'is_homepage' => false,
                'sort_order' => 4,
                'language' => 'en',
                'parent_id' => null,
                'published_at' => now()->toISOString(),
                'created_at' => now()->subDays(18)->toISOString(),
                'updated_at' => now()->subDays(1)->toISOString(),
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $samplePages,
            'message' => 'Test endpoint working - CMS routes are configured correctly',
            'meta' => [
                'timestamp' => now()->toISOString(),
                'tenant_context' => 'test',
                'request_id' => uniqid(),
                'total' => count($samplePages),
                'current_page' => 1,
                'per_page' => 15,
                'last_page' => 1
            ]
        ]);
    });
    
    Route::get('/platform/content/pages', function () {
        // Sample platform pages data for testing
        $samplePages = [
            [
                'id' => 1,
                'uuid' => '550e8400-e29b-41d4-a716-446655440001',
                'title' => 'Home Page',
                'slug' => 'home',
                'description' => 'Welcome to our homepage',
                'content' => [
                    'hero' => [
                        'title' => [
                            'typing' => [
                                'Platform Management',
                                'Admin Dashboard',
                                'System Control',
                                'Multi-Tenant Hub',
                                'Central Command'
                            ]
                        ],
                        'subtitle' => 'Manage your entire platform from here',
                        'cta_text' => 'Get Started',
                        'cta_link' => '/platform/dashboard'
                    ]
                ],
                'template' => 'homepage',
                'meta_data' => [
                    'seo_title' => 'Platform Home',
                    'seo_description' => 'Platform management dashboard'
                ],
                'status' => 'published',
                'is_homepage' => true,
                'sort_order' => 1,
                'language' => 'en',
                'parent_id' => null,
                'published_at' => now()->toISOString(),
                'created_at' => now()->subDays(30)->toISOString(),
                'updated_at' => now()->subDays(1)->toISOString(),
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $samplePages,
            'message' => 'Test endpoint working - Platform CMS routes are configured correctly',
            'meta' => [
                'timestamp' => now()->toISOString(),
                'tenant_context' => 'platform',
                'request_id' => uniqid(),
                'total' => count($samplePages),
                'current_page' => 1,
                'per_page' => 15,
                'last_page' => 1
            ]
        ]);
    });
});

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

// Tenant Login
Route::post('/auth/tenant/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
        'tenant_slug' => 'required|string'
    ]);

    // Find tenant
    $tenant = DB::table('tenants')->where('slug', $request->tenant_slug)->first();
    if (!$tenant) {
        return response()->json([
            'success' => false,
            'message' => 'Tenant not found'
        ], 404);
    }

    // Find user in tenant
    $user = \App\Infrastructure\Persistence\Eloquent\UserEloquentModel::where('email', $request->email)
        ->where('tenant_id', $tenant->id)
        ->first();

    if (!$user || !\Hash::check($request->password, $user->password)) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
    }

    // Create token with proper abilities
    $abilities = match(strtolower(trim($user->role))) {
        'admin' => [
            'tenant:read', 'tenant:write', 'dashboard:view', 'profile:update',
            'cms:manage', 'cms:create', 'cms:update', 'cms:delete',
            'users:manage', 'customers:manage', 'products:manage',
            'orders:manage', 'vendors:manage', 'analytics:view', 'settings:manage'
        ],
        'manager' => [
            'tenant:read', 'dashboard:view', 'profile:update',
            'cms:update', 'cms:create', 'customers:manage',
            'products:manage', 'orders:manage', 'analytics:view'
        ],
        'editor' => [
            'tenant:read', 'dashboard:view', 'profile:update',
            'cms:update', 'cms:create', 'products:read', 'customers:read'
        ],
        default => ['tenant:read', 'dashboard:view', 'profile:update']
    };

    $token = $user->createToken('tenant_auth_token', $abilities);

    return response()->json([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'token' => $token->plainTextToken,
            'user' => [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'email' => $user->email,
                'name' => $user->name,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'roles' => [$user->role],
                'permissions' => $abilities
            ],
            'tenant' => [
                'id' => $tenant->id,
                'uuid' => $tenant->uuid,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'domain' => $tenant->domain
            ]
        ]
    ]);
});

// Platform Login
Route::post('/auth/platform/login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'password' => 'required|string'
    ]);

    $account = AccountEloquentModel::where('email', $request->email)->first();

    if (!$account || !\Hash::check($request->password, $account->password)) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid credentials'
        ], 401);
    }

    $abilities = [
        'platform:read', 'platform:write',
        'tenants:manage', 'analytics:view'
    ];

    $token = $account->createToken('platform_auth_token', $abilities);

    return response()->json([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'token' => $token->plainTextToken,
            'account' => [
                'id' => $account->id,
                'uuid' => $account->uuid,
                'email' => $account->email,
                'name' => $account->name,
                'role' => 'platform_admin',
                'permissions' => $abilities
            ]
        ]
    ]);
});

// Logout (works for both tenant and platform)
Route::middleware('auth:sanctum')->post('/auth/logout', function (Request $request) {
    $user = $request->user();
    
    // Delete current token
    $request->user()->currentAccessToken()->delete();
    
    return response()->json([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
});

// Get current authenticated user
Route::middleware('auth:sanctum')->get('/auth/me', function (Request $request) {
    $user = $request->user();
    
    // Check if this is a platform account or tenant user
    if ($user instanceof AccountEloquentModel) {
        return response()->json([
            'success' => true,
            'data' => [
                'account_type' => 'platform',
                'account' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => 'platform_admin'
                ]
            ]
        ]);
    } else {
        // Tenant user
        $tenant = DB::table('tenants')->where('id', $user->tenant_id)->first();
        
        return response()->json([
            'success' => true,
            'data' => [
                'account_type' => 'tenant',
                'user' => [
                    'id' => $user->id,
                    'uuid' => $user->uuid,
                    'email' => $user->email,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'roles' => [$user->role]
                ],
                'tenant' => [
                    'id' => $tenant->id,
                    'uuid' => $tenant->uuid,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'domain' => $tenant->domain
                ]
            ]
        ]);
    }
});
