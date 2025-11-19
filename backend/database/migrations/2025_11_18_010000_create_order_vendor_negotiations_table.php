<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_vendor_negotiations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique()->default(DB::raw('gen_random_uuid()'));
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->enum('status', ['open', 'countered', 'accepted', 'rejected', 'cancelled', 'expired'])->default('open');
            $table->bigInteger('initial_offer')->nullable();
            $table->bigInteger('latest_offer')->nullable();
            $table->string('currency', 3)->default('IDR');
            $table->json('terms')->nullable();
            $table->json('history')->nullable();
            $table->unsignedInteger('round')->default(1);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('uuid');
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'vendor_id']);
            $table->index(['tenant_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_vendor_negotiations');
    }
};
