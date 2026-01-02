<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenant_header_configs', function (Blueprint $table) {
            // Primary Key
            $table->id();
            
            // Multi-Tenant Isolation (MANDATORY)
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            // Public UUID
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Brand Information
            $table->string('brand_name', 255)->default('');
            $table->string('brand_initials', 10)->nullable();
            $table->text('brand_tagline')->nullable();
            
            // Logo Configuration
            $table->string('logo_url', 500)->nullable();
            $table->string('logo_dark_url', 500)->nullable();
            $table->integer('logo_width')->default(120);
            $table->integer('logo_height')->default(40);
            $table->string('logo_alt_text', 255)->default('');
            $table->boolean('use_logo')->default(true);
            
            // Header Display Settings
            $table->string('header_style', 50)->default('default');
            $table->boolean('show_cart')->default(true);
            $table->boolean('show_search')->default(true);
            $table->boolean('show_login')->default(true);
            $table->boolean('sticky_header')->default(true);
            $table->boolean('transparent_on_scroll')->default(false);
            
            // Colors & Styling (JSONB for flexibility)
            $table->jsonb('styling_options')->default(json_encode([
                'backgroundColor' => '#ffffff',
                'textColor' => '#000000',
                'activeColor' => '#f59e0b',
                'hoverColor' => '#f97316'
            ]));
            
            // Button Texts (Customizable per tenant)
            $table->string('login_button_text', 50)->default('Login');
            $table->string('cart_button_text', 50)->default('Cart');
            $table->string('search_placeholder', 100)->default('Search...');
            
            // Metadata
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            
            // Version Control
            $table->integer('version')->default(1);
            $table->uuid('last_modified_by')->nullable();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes untuk performance
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index(['tenant_id', 'is_active']);
            
            // Unique constraint: 1 active config per tenant
            // Note: PostgreSQL allows multiple rows with same tenant_id if deleted_at is NOT NULL
            // because NULL != NULL, so this supports soft deletes properly
            $table->unique(['tenant_id', 'deleted_at'], 'unique_header_per_tenant');
        });

        // Trigger for auto-updating updated_at
        DB::unprepared('
            CREATE TRIGGER update_tenant_header_configs_updated_at
            BEFORE UPDATE ON tenant_header_configs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS update_tenant_header_configs_updated_at ON tenant_header_configs;');
        Schema::dropIfExists('tenant_header_configs');
    }
};
