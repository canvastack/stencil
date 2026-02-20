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
        Schema::create('document_sequences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            
            // Document type for sequence tracking
            $table->string('document_type', 50);
            // Values: customer_quote, quotation, proforma_invoice, tax_invoice, 
            //         purchase_order, delivery_note, receipt
            
            // Year for sequence reset
            $table->integer('year');
            
            // Last sequence number used
            $table->integer('last_sequence')->default(0);
            
            // Timestamps
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
            
            // Unique constraint to ensure one sequence per tenant/type/year
            $table->unique(['tenant_id', 'document_type', 'year'], 'unique_tenant_document_year');
            
            // Indexes
            $table->index('tenant_id', 'idx_document_sequences_tenant');
            $table->index('document_type', 'idx_document_sequences_type');
            $table->index('year', 'idx_document_sequences_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_sequences');
    }
};
