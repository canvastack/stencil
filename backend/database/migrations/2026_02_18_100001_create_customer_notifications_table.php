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
        Schema::create('customer_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('customer_id');
            
            // Notification details
            $table->string('type'); // quote_sent, quote_accepted, counter_offer_received, etc.
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable(); // Additional data (quote_id, order_id, etc.)
            
            // Related entities
            $table->unsignedBigInteger('customer_quote_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();
            
            // Status
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            
            // Priority
            $table->string('priority')->default('normal'); // low, normal, high, urgent
            
            // Action link
            $table->string('action_url')->nullable();
            $table->string('action_text')->nullable();
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->foreign('customer_quote_id')->references('id')->on('customer_quotes')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            
            // Indexes
            $table->index('tenant_id');
            $table->index('customer_id');
            $table->index('type');
            $table->index('is_read');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_notifications');
    }
};
