<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This table stores all generated documents (quotations, invoices, receipts, etc.) for orders.
     * Supports versioning, audit trails, and multi-recipient document management.
     */
    public function up(): void
    {
        Schema::create('order_documents', function (Blueprint $table) {
            // Primary keys
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            
            // Foreign keys
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            
            // Document details
            $table->string('document_type', 50);
            // Values: quotation, proforma_invoice, tax_invoice, purchase_order, 
            //         delivery_note, receipt, completion_certificate
            $table->string('document_number', 100);
            $table->date('document_date');
            
            // Related entities (optional references)
            $table->foreignId('customer_quote_id')->nullable()->constrained('customer_quotes')->nullOnDelete();
            $table->foreignId('vendor_quote_id')->nullable()->constrained('vendor_quotes')->nullOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('order_payment_transactions')->nullOnDelete();
            
            // Document content
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('file_url', 500);
            $table->bigInteger('file_size')->nullable();
            $table->string('file_type', 50)->default('application/pdf');
            
            // Version control
            $table->integer('version')->default(1);
            $table->foreignId('parent_document_id')->nullable()->constrained('order_documents')->nullOnDelete();
            $table->boolean('is_latest_version')->default(true);
            
            // Status
            $table->string('status', 50)->default('draft');
            // Values: draft, sent, acknowledged, paid, delivered, completed, cancelled
            
            // Timestamps for document lifecycle
            $table->timestamp('generated_at')->default(DB::raw('NOW()'));
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            // Actors
            $table->foreignId('generated_by')->constrained('users');
            $table->foreignId('sent_by')->nullable()->constrained('users');
            $table->foreignId('acknowledged_by')->nullable()->constrained('users');
            
            // Recipients
            $table->string('recipient_type', 20)->nullable();
            // Values: customer, vendor, internal
            $table->bigInteger('recipient_id')->nullable();
            $table->string('recipient_email', 255)->nullable();
            
            // Metadata and audit
            $table->json('metadata')->default('{}');
            // Stores: template_id, language, custom_fields, etc.
            $table->json('access_log')->default('[]');
            // Tracks who accessed/downloaded the document
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            // Unique constraint: document number must be unique per type per tenant
            $table->unique(['tenant_id', 'document_type', 'document_number'], 'idx_order_documents_unique_number');
            
            // Indexes for performance
            $table->index('tenant_id', 'idx_order_documents_tenant');
            $table->index('order_id', 'idx_order_documents_order');
            $table->index('document_type', 'idx_order_documents_type');
            $table->index('document_number', 'idx_order_documents_number');
            $table->index('status', 'idx_order_documents_status');
            $table->index('document_date', 'idx_order_documents_date');
            $table->index(['recipient_type', 'recipient_id'], 'idx_order_documents_recipient');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_documents');
    }
};
