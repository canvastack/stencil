<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Spatie Permission Configuration for Multi-Tenancy
    |--------------------------------------------------------------------------
    |
    | Configuration for role-based access control with tenant isolation.
    |
    */
    
    /*
    |--------------------------------------------------------------------------
    | Teams Feature
    |--------------------------------------------------------------------------
    |
    | CRITICAL: This must be enabled for multi-tenant permissions.
    |
    */
    'teams' => true,
    
    /*
    |--------------------------------------------------------------------------
    | Team Foreign Key
    |--------------------------------------------------------------------------
    |
    | The foreign key that links permissions and roles to tenants.
    | MUST be 'tenant_id' for our architecture.
    |
    */
    'team_foreign_key' => 'tenant_id',
    
    /*
    |--------------------------------------------------------------------------
    | Guard Configuration
    |--------------------------------------------------------------------------
    |
    | Default guard for API-based authentication.
    |
    */
    'guard_name' => 'api',
    
    /*
    |--------------------------------------------------------------------------
    | Model Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the models used by the permission system.
    |
    */
    'models' => [
        'permission' => Spatie\Permission\Models\Permission::class,
        'role' => Spatie\Permission\Models\Role::class,
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Morph Key Configuration
    |--------------------------------------------------------------------------
    |
    | CRITICAL: Must use UUID string for polymorphic relationships.
    |
    */
    'model_morph_key' => 'model_uuid',
    
    /*
    |--------------------------------------------------------------------------
    | Account A Permissions (Platform Owners)
    |--------------------------------------------------------------------------
    |
    | Platform management permissions for Account A users.
    |
    */
    'account_a_permissions' => [
        // Platform Management
        'platform.manage_tenants',
        'platform.view_all_tenants',
        'platform.create_tenant',
        'platform.update_tenant',
        'platform.delete_tenant',
        'platform.suspend_tenant',
        'platform.activate_tenant',
        
        // Analytics & Reporting
        'platform.view_analytics',
        'platform.view_usage_stats',
        'platform.view_revenue_reports',
        'platform.export_data',
        
        // Subscription Management
        'platform.manage_subscriptions',
        'platform.view_billing',
        'platform.process_payments',
        'platform.manage_plans',
        
        // Domain Management
        'platform.manage_domains',
        'platform.verify_domains',
        'platform.provision_ssl',
        
        // System Administration
        'platform.manage_settings',
        'platform.view_logs',
        'platform.manage_backups',
        
        // Limited Tenant Oversight (read-only)
        'tenant.view_basic_info',
        'tenant.view_subscription_status',
        'tenant.view_usage_metrics',
        
        // Forbidden - Cannot access internal tenant business data
        // 'tenant.manage_users' => false,
        // 'tenant.manage_products' => false,
        // 'tenant.view_orders' => false,
        // 'tenant.view_customers' => false,
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Account B Permissions (Tenant Business Users)
    |--------------------------------------------------------------------------
    |
    | Business management permissions for Account B users.
    |
    */
    'account_b_permissions' => [
        // User Management (within tenant)
        'tenant.manage_users',
        'tenant.create_user',
        'tenant.update_user',
        'tenant.delete_user',
        'tenant.assign_roles',
        
        // Role & Permission Management
        'tenant.manage_roles',
        'tenant.create_role',
        'tenant.update_role',
        'tenant.delete_role',
        'tenant.assign_permissions',
        
        // Product Management
        'tenant.manage_products',
        'tenant.create_product',
        'tenant.update_product',
        'tenant.delete_product',
        'tenant.manage_inventory',
        'tenant.view_product_analytics',
        
        // Order Management
        'tenant.manage_orders',
        'tenant.view_orders',
        'tenant.create_order',
        'tenant.update_order',
        'tenant.cancel_order',
        'tenant.process_order',
        'tenant.refund_order',
        
        // Customer Management
        'tenant.manage_customers',
        'tenant.view_customers',
        'tenant.create_customer',
        'tenant.update_customer',
        'tenant.delete_customer',
        'tenant.export_customers',
        
        // Vendor Management
        'tenant.manage_vendors',
        'tenant.view_vendors',
        'tenant.create_vendor',
        'tenant.update_vendor',
        'tenant.delete_vendor',
        
        // Content Management
        'tenant.manage_content',
        'tenant.create_content',
        'tenant.update_content',
        'tenant.delete_content',
        'tenant.publish_content',
        
        // Settings & Configuration
        'tenant.manage_settings',
        'tenant.update_profile',
        'tenant.manage_integrations',
        'tenant.configure_payments',
        
        // Analytics & Reports
        'tenant.view_analytics',
        'tenant.view_sales_reports',
        'tenant.view_customer_reports',
        'tenant.export_reports',
        
        // Limited Platform Interaction
        'platform.view_subscription',
        'platform.update_subscription',
        'platform.manage_own_domain',
        'platform.view_own_billing',
        'platform.contact_support',
        
        // Forbidden - Cannot access platform management
        // 'platform.manage_tenants' => false,
        // 'platform.view_all_analytics' => false,
        // 'platform.manage_other_tenants' => false,
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Role Hierarchy
    |--------------------------------------------------------------------------
    |
    | Define role hierarchies for both account types.
    |
    */
    'role_hierarchy' => [
        'account_a' => [
            'super_admin' => [
                'permissions' => 'all_platform',
                'description' => 'Full platform administration access'
            ],
            'platform_admin' => [
                'permissions' => 'platform_management',
                'description' => 'Platform management and tenant oversight'
            ],
            'support_admin' => [
                'permissions' => 'limited_platform',
                'description' => 'Customer support and basic tenant assistance'
            ],
        ],
        
        'account_b' => [
            'tenant_owner' => [
                'permissions' => 'all_tenant',
                'description' => 'Full business management access'
            ],
            'manager' => [
                'permissions' => 'business_management',
                'description' => 'Business operations and user management'
            ],
            'employee' => [
                'permissions' => 'basic_operations',
                'description' => 'Basic business operations and data entry'
            ],
            'viewer' => [
                'permissions' => 'read_only',
                'description' => 'Read-only access to business data'
            ],
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Permission Categories
    |--------------------------------------------------------------------------
    |
    | Organize permissions into logical categories.
    |
    */
    'permission_categories' => [
        'platform_management' => [
            'platform.manage_tenants',
            'platform.view_analytics',
            'platform.manage_subscriptions',
            'platform.manage_domains',
        ],
        
        'tenant_management' => [
            'tenant.manage_users',
            'tenant.manage_roles',
            'tenant.manage_settings',
        ],
        
        'business_operations' => [
            'tenant.manage_products',
            'tenant.manage_orders',
            'tenant.manage_customers',
            'tenant.manage_vendors',
        ],
        
        'content_management' => [
            'tenant.manage_content',
            'tenant.create_content',
            'tenant.publish_content',
        ],
        
        'analytics_reporting' => [
            'tenant.view_analytics',
            'tenant.view_sales_reports',
            'tenant.export_reports',
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Security Rules
    |--------------------------------------------------------------------------
    |
    | Critical security rules that must never be violated.
    |
    */
    'security_rules' => [
        'tenant_isolation' => [
            'enforce_tenant_scoping' => true,
            'prevent_cross_tenant_access' => true,
            'audit_permission_changes' => true,
        ],
        
        'role_restrictions' => [
            'no_global_roles' => true, // All roles must be tenant-scoped
            'min_tenant_roles' => 1, // Each tenant must have at least one role
            'max_roles_per_user' => 5,
        ],
        
        'permission_validation' => [
            'validate_tenant_context' => true,
            'check_permission_hierarchy' => true,
            'log_permission_denials' => true,
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Permission caching settings for performance optimization.
    |
    */
    'cache' => [
        'enabled' => true,
        'expiration_time' => DateInterval::createFromDateString('24 hours'),
        'key' => 'spatie.permission.cache',
        'model_key' => 'name',
        'store' => 'default',
    ],
];