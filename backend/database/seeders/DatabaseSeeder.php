<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Multi-Tenant Database Seeding...');
        
        // Seed Platform Data (Account A - Platform Owners & Demo Tenants)
        $this->command->info('📊 Seeding Platform Foundation...');
        $this->call(PlatformSeeder::class);
        
        // Seed Additional Tenants & Business Data
        $this->command->info('🏢 Seeding Multi-Tenant Business Data...');
        $this->call(MultiTenantBusinessSeeder::class);
        
        // Seed Navigation System (Header, Footer, Menus)
        $this->command->info('🧭 Seeding Navigation System...');
        $this->call(TenantHeaderConfigSeeder::class);
        $this->call(TenantMenuSeeder::class);
        $this->call(TenantFooterConfigSeeder::class);
        
        // Seed Product Categories (before other tenant data)
        $this->command->info('🏷️ Seeding Product Categories...');
        $this->call(ProductCategorySeeder::class);
        
        // Seed Tenant Business Data (Customers, Products, Orders, etc.)
        $this->command->info('📈 Seeding Tenant Business Operations...');
        $this->call(TenantDataSeeder::class);
        
        // Seed Product Variants (20-50+ per tenant for performance testing)
        $this->command->info('🎨 Seeding Product Variants...');
        $this->call(ProductVariantSeeder::class);
        
        // Seed Customer Reviews (database-driven, realistic distribution)
        $this->command->info('⭐ Seeding Customer Reviews...');
        $this->call(CustomerReviewSeeder::class);
        
        // Seed Phase 3 Core Business Logic Data
        $this->command->info('🚀 Seeding Phase 3 Core Business Logic...');
        $this->call(Phase3CoreBusinessSeeder::class);
        
        // Seed Product Form Builder System
        $this->command->info('📋 Seeding Product Form Builder System...');
        $this->call(ProductFormFieldLibrarySeeder::class);
        $this->call(ProductFormTemplateSeeder::class);
        $this->call(ProductFormConfigurationSeeder::class);
        
        // Seed Platform Pages Content
        $this->command->info('📄 Seeding Platform Pages Content...');
        $this->call(PlatformPagesSeeder::class);
        
        // Seed Platform Content (Home, About, Contact, FAQ, Features, Blog)
        $this->command->info('🌐 Seeding Platform Content Pages...');
        $this->call(PlatformContentSeeder::class);
        
        // Seed Tenant Content (Home, About, Contact, FAQ, Services, Blog per tenant)
        $this->command->info('📝 Seeding Tenant Content Pages...');  
        $this->call(TenantContentSeeder::class);
        
        // Seed Products Page Content (per tenant)
        $this->command->info('🛍️ Seeding Products Page Content...');
        $this->call(ProductsPageSeeder::class);
        
        // Seed Refund System Data
        $this->command->info('💰 Seeding Refund System Data...');
        $this->call(RefundNotificationTemplateSeeder::class);
        $this->call(RefundDataSeeder::class);
        
        // Seed Enhanced Vendor Data for PT Custom Etching Xenial
        $this->command->info('🏭 Seeding Enhanced Vendor Data...');
        $this->call(VendorSeeder::class);
        $this->call(VendorPerformanceSeeder::class);
        $this->call(VendorSourcingSeeder::class);
        $this->call(VendorPaymentSeeder::class);
        
        // Seed Plugin Installation Requests
        $this->command->info('🔌 Seeding Plugin Installation Requests...');
        $this->call(InstalledPluginSeeder::class);
        
        // Seed CMS Content Types (Blog, Portfolio, etc.)
        $this->command->info('📰 Seeding CMS Content Types...');
        $this->call(ContentTypeSeeder::class);
        
        // Seed CMS Categories
        $this->command->info('🏷️ Seeding CMS Categories...');
        $this->call(CategorySeeder::class);
        
        $this->command->info('✅ Multi-Tenant Database Seeding Completed!');
        $this->command->info('');
        $this->command->info('📊 Final Summary:');
        $this->command->info('- Platform Accounts: 2 accounts');
        $this->command->info('- Total Tenants: 6+ tenants (Demo + Additional)');
        $this->command->info('- Total Users: 50+ users across all tenants');
        $this->command->info('- Total Customers: 200+ customers');
        $this->command->info('- Total Products: 300+ products (Phase 3 enhanced)');
        $this->command->info('- Product Categories: 20+ categories with hierarchy');
        $this->command->info('- Product Variants: 600+ variants (2-5 per product, multi-tenant)');
        $this->command->info('- Product Form Configurations: 240+ configurations (40 per tenant)');
        $this->command->info('- Product Form Templates: 8 system templates (plakat, trophy, award, etc.)');
        $this->command->info('- Product Form Fields: 15 field types in library');
        $this->command->info('- Customer Reviews: Database-driven reviews (1-5 per product, realistic ratings)');
        $this->command->info('- Total Orders: 400+ orders (with realistic workflows)');
        $this->command->info('- Total Vendors: 50+ vendors (5 enhanced for PT CEX)');
        $this->command->info('- Vendor Performance: 720+ vendor orders with metrics');
        $this->command->info('- Vendor Sourcing: 10+ sourcing requests with quotes');
        $this->command->info('- Vendor Payments: 268+ payment records');
        $this->command->info('- Plugin Requests: 34+ plugin installation requests (pending, approved, active, rejected, suspended, expired)');
        $this->command->info('- Platform Roles: 3 roles');
        $this->command->info('- Tenant Roles: 4 roles per tenant');
        $this->command->info('- Platform Content Pages: 25+ pages (Home, About, Features, Blog)');
        $this->command->info('- Tenant Content Pages: 35+ pages per tenant (Home, About, Services, Blog)');
        $this->command->info('- Navigation Configs: 6+ header configs, 130+ menus, 6+ footer configs');
        $this->command->info('- Refund Requests: 25+ per tenant (various statuses & scenarios)');
        $this->command->info('- Insurance Fund: Initial fund + monthly contributions per tenant');
        $this->command->info('');
        $this->command->info('🔐 Default Login Credentials:');
        $this->command->info('Platform Super Admin: admin@canvastencil.com / SuperAdmin2024!');
        $this->command->info('Platform Manager: manager@canvastencil.com / Manager2024!');
        $this->command->info('Demo Tenant Admin: admin@etchinx.com / DemoAdmin2024!');
        $this->command->info('Demo Tenant Manager: manager@etchinx.com / DemoManager2024!');
        $this->command->info('Demo Tenant Sales: sales@etchinx.com / DemoSales2024!');
    }
}
