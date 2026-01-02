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
        Schema::create('tenant_footer_configs', function (Blueprint $table) {
            // Primary Key
            $table->id();
            
            // Multi-Tenant Isolation (MANDATORY)
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            // Public UUID
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Footer Sections (JSONB for flexibility)
            $table->jsonb('footer_sections')->default('[]');
            
            // Contact Information
            $table->text('contact_address')->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->string('contact_working_hours', 255)->nullable();
            
            // Social Media Links (JSONB)
            $table->jsonb('social_links')->default('[]');
            
            // Newsletter Settings
            $table->boolean('show_newsletter')->default(true);
            $table->string('newsletter_title', 255)->default('Get Latest Updates');
            $table->text('newsletter_subtitle')->default('Subscribe to our newsletter');
            $table->string('newsletter_button_text', 50)->default('Subscribe');
            $table->string('newsletter_api_endpoint', 500)->nullable();
            
            // Footer Text Content
            $table->text('about_text')->nullable();
            $table->string('copyright_text', 255)->nullable();
            $table->text('bottom_text')->nullable();
            
            // Display Options
            $table->boolean('show_social_links')->default(true);
            $table->boolean('show_contact_info')->default(true);
            $table->boolean('show_sections')->default(true);
            
            // Styling
            $table->string('footer_style', 50)->default('default');
            $table->string('background_color', 20)->default('#000000');
            $table->string('text_color', 20)->default('#ffffff');
            
            // Legal Links (Common across tenants but customizable)
            $table->jsonb('legal_links')->default(json_encode([
                ['label' => 'Privacy Policy', 'path' => '/privacy'],
                ['label' => 'Terms of Service', 'path' => '/terms'],
                ['label' => 'Cookie Policy', 'path' => '/cookies']
            ]));
            
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
            $table->unique(['tenant_id', 'deleted_at'], 'unique_footer_per_tenant');
        });

        // Trigger for auto-updating updated_at
        DB::unprepared('
            CREATE TRIGGER update_tenant_footer_configs_updated_at
            BEFORE UPDATE ON tenant_footer_configs
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS update_tenant_footer_configs_updated_at ON tenant_footer_configs;');
        Schema::dropIfExists('tenant_footer_configs');
    }
};
