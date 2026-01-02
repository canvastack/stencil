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
        Schema::create('tenant_menus', function (Blueprint $table) {
            // Primary Key
            $table->id();
            
            // Multi-Tenant Isolation (MANDATORY)
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            // Public UUID
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Menu Hierarchy (Self-referencing foreign key)
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->foreign('parent_id')
                ->references('id')
                ->on('tenant_menus')
                ->onDelete('cascade');
            
            // Menu Item Details
            $table->string('label', 255);
            $table->string('path', 500)->nullable();
            $table->string('icon', 100)->nullable();
            $table->text('description')->nullable();
            
            // Link Behavior
            $table->string('target', 20)->default('_self');
            $table->boolean('is_external')->default(false);
            $table->boolean('requires_auth')->default(false);
            
            // Display Options
            $table->boolean('is_active')->default(true);
            $table->boolean('is_visible')->default(true);
            $table->boolean('show_in_header')->default(true);
            $table->boolean('show_in_footer')->default(false);
            $table->boolean('show_in_mobile')->default(true);
            
            // Ordering
            $table->integer('sort_order')->default(0);
            
            // Styling (Optional per-item styling)
            $table->string('custom_class', 255)->nullable();
            $table->string('badge_text', 50)->nullable();
            $table->string('badge_color', 20)->nullable();
            
            // Access Control (Optional role-based visibility)
            $table->jsonb('allowed_roles')->nullable();
            
            // Metadata
            $table->text('notes')->nullable();
            $table->integer('click_count')->default(0);
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes untuk performance
            $table->index('tenant_id');
            $table->index('uuid');
            $table->index('parent_id');
            $table->index(['tenant_id', 'sort_order', 'is_active']);
            $table->index(['tenant_id', 'is_active', 'is_visible', 'show_in_header']);
        });

        // Add check constraint: parent_id cannot be self
        DB::unprepared('
            ALTER TABLE tenant_menus
            ADD CONSTRAINT check_parent_not_self CHECK (parent_id != id);
        ');

        // Trigger for auto-updating updated_at
        DB::unprepared('
            CREATE TRIGGER update_tenant_menus_updated_at
            BEFORE UPDATE ON tenant_menus
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS update_tenant_menus_updated_at ON tenant_menus;');
        DB::unprepared('ALTER TABLE tenant_menus DROP CONSTRAINT IF EXISTS check_parent_not_self;');
        Schema::dropIfExists('tenant_menus');
    }
};
