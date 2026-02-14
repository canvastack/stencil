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
        Schema::create('vendor_purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            
            // References
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('quote_id');
            $table->unsignedBigInteger('vendor_id');
            
            // PO Information
            $table->string('po_number', 50)->unique();
            $table->date('issue_date');
            $table->date('validity_date');
            
            // Delivery Information
            $table->date('expected_delivery_date');
            $table->text('delivery_address')->nullable();
            $table->string('delivery_method', 50)->nullable();
            $table->text('special_instructions')->nullable();
            
            // Pricing (all amounts in cents)
            $table->bigInteger('subtotal');
            $table->bigInteger('discount')->default(0);
            $table->bigInteger('tax');
            $table->bigInteger('shipping')->default(0);
            $table->bigInteger('grand_total');
            
            // Payment Terms
            $table->string('payment_method', 50)->nullable();
            $table->json('payment_schedule')->nullable();
            
            // Status
            $table->string('status', 50)->default('draft');
            // Possible values: draft, sent, accepted, rejected, cancelled, completed
            
            // PDF
            $table->string('pdf_path', 255)->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            
            // Audit
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->unsignedBigInteger('accepted_by')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('quote_id')->references('id')->on('order_vendor_negotiations')->onDelete('cascade');
            $table->foreign('vendor_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('accepted_by')->references('id')->on('users')->onDelete('set null');
            
            // Indexes
            $table->index('tenant_id');
            $table->index('order_id');
            $table->index('quote_id');
            $table->index('vendor_id');
            $table->index('status');
            $table->index('issue_date');
            $table->index('expected_delivery_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendor_purchase_orders');
    }
};
