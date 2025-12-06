<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_negotiations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            
            // Negotiation details
            $table->text('requirements'); // Production requirements from order
            $table->bigInteger('quoted_price')->nullable(); // Vendor quoted price
            $table->integer('estimated_days')->nullable(); // Delivery timeline
            $table->text('vendor_response')->nullable(); // Vendor's response/notes
            
            // Status tracking
            $table->enum('status', [
                'pending', 'responded', 'accepted', 'rejected', 'cancelled'
            ])->default('pending');
            
            // Timeline
            $table->timestamp('sent_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // Metadata
            $table->json('specifications')->nullable(); // Technical specifications
            $table->json('attachments')->nullable(); // Quote documents, etc.
            $table->text('rejection_reason')->nullable();
            
            // Audit
            $table->foreignId('negotiated_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('uuid');
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'vendor_id']);
            $table->index(['tenant_id', 'status']);
            $table->index('sent_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_negotiations');
    }
};