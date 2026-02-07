<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates quote_messages table for communication between admins and vendors:
     * - Message content and metadata
     * - File attachments support (JSONB array)
     * - Read tracking with timestamp
     * - Tenant-scoped with proper foreign keys
     * - Performance indexes for quote_id and created_at
     * 
     * Requirements: 9.1, 9.2 (Communication Center)
     */
    public function up(): void
    {
        Schema::create('quote_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            
            // Foreign keys
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('quote_id');
            $table->unsignedBigInteger('sender_id');
            
            // Message content
            $table->text('message');
            
            // File attachments (array of objects with name, path, size, mime_type)
            $table->jsonb('attachments')->default('[]');
            
            // Read tracking
            $table->timestamp('read_at')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Foreign key constraints with cascade delete
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');
                
            $table->foreign('quote_id')
                ->references('id')
                ->on('order_vendor_negotiations')
                ->onDelete('cascade');
                
            $table->foreign('sender_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
            
            // Performance indexes
            $table->index(['quote_id', 'created_at'], 'idx_quote_messages_quote_created');
            $table->index(['tenant_id', 'quote_id'], 'idx_quote_messages_tenant_quote');
            $table->index(['sender_id'], 'idx_quote_messages_sender');
        });
    }

    /**
     * Reverse the migrations.
     * 
     * Drops the quote_messages table.
     */
    public function down(): void
    {
        Schema::dropIfExists('quote_messages');
    }
};
