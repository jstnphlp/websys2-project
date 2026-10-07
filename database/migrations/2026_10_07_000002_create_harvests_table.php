<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('harvests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('planting_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->nullable()->index()->constrained('users')->nullOnDelete();
            $table->date('harvested_at');
            $table->decimal('quantity_kg', 8, 2);
            $table->string('notes', 500)->nullable();
            $table->timestamps();

            $table->index(['planting_id', 'harvested_at']);
            $table->index('harvested_at');
        });

        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE harvests ENABLE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('harvests');
    }
};
