<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const COLUMNS = ['id', 'planting_id', 'recorded_by', 'harvested_at', 'quantity_kg', 'notes', 'created_at', 'updated_at'];

    public function up(): void
    {
        $pgsql = Schema::getConnection()->getDriverName() === 'pgsql';

        if (Schema::hasTable('harvests')) {
            // An earlier, since-removed garden workflows migration created a harvests table with the same columns.
            if (! Schema::hasColumns('harvests', self::COLUMNS)) {
                throw new RuntimeException('A harvests table already exists with different columns. Review it before migrating.');
            }
            if ($pgsql) {
                DB::statement('CREATE INDEX IF NOT EXISTS harvests_planting_id_harvested_at_index ON harvests (planting_id, harvested_at)');
                DB::statement('CREATE INDEX IF NOT EXISTS harvests_harvested_at_index ON harvests (harvested_at)');
                DB::statement('CREATE INDEX IF NOT EXISTS harvests_recorded_by_index ON harvests (recorded_by)');
            }
        } else {
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
        }

        if ($pgsql) {
            DB::statement('ALTER TABLE harvests ENABLE ROW LEVEL SECURITY');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('harvests');
    }
};
