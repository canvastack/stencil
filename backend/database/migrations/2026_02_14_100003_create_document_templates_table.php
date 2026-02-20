<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            
            // Template details
            $table->string('template_type', 50);
            // Values: quotation, proforma_invoice, tax_invoice, purchase_order, 
            //         delivery_note, receipt, completion_certificate
            $table->string('template_name', 100);
            $table->text('description')->nullable();
            
            // Template content
            $table->text('header_html')->nullable();
            $table->text('body_html');
            $table->text('footer_html')->nullable();
            $table->text('css_styles')->nullable();
            
            // Branding
            $table->string('logo_url', 500)->nullable();
            $table->string('company_name', 255)->nullable();
            $table->text('company_address')->nullable();
            $table->string('company_phone', 50)->nullable();
            $table->string('company_email', 255)->nullable();
            $table->string('company_website', 255)->nullable();
            $table->string('company_npwp', 50)->nullable();
            
            // Layout settings
            $table->string('page_size', 20)->default('A4');
            // Values: A4, Letter, Legal
            $table->string('orientation', 20)->default('portrait');
            // Values: portrait, landscape
            $table->integer('margin_top')->default(20);
            $table->integer('margin_right')->default(20);
            $table->integer('margin_bottom')->default(20);
            $table->integer('margin_left')->default(20);
            
            // Customization
            $table->string('primary_color', 7)->default('#000000');
            $table->string('secondary_color', 7)->default('#666666');
            $table->string('font_family', 100)->default('Arial, sans-serif');
            $table->integer('font_size')->default(12);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            
            // Language
            $table->string('language', 5)->default('id');
            // Values: id, en
            
            // Version
            $table->integer('version')->default(1);
            
            // Timestamps
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
            
            // Constraints
            $table->unique(['tenant_id', 'template_type', 'template_name']);
            
            // Indexes
            $table->index('tenant_id', 'idx_document_templates_tenant');
            $table->index('template_type', 'idx_document_templates_type');
            $table->index('is_active', 'idx_document_templates_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
