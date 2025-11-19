<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->enum('direction', ['incoming', 'outgoing']);
            $table->string('type');
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('completed');
            $table->bigInteger('amount');
            $table->string('currency', 3)->default('IDR');
            $table->string('method')->nullable();
            $table->string('reference')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('uuid');
            $table->index(['tenant_id', 'direction']);
            $table->index(['tenant_id', 'type']);
            $table->index(['tenant_id', 'status']);
            $table->index(['order_id', 'direction']);
            $table->index(['vendor_id', 'direction']);
            $table->index(['customer_id', 'direction']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_payment_transactions');
    }
};
