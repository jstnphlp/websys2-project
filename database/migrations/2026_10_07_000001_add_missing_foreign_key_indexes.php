<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS calendar_events_created_by_index ON calendar_events (created_by)');
        DB::statement('CREATE INDEX IF NOT EXISTS community_updates_created_by_index ON community_updates (created_by)');
        DB::statement('CREATE INDEX IF NOT EXISTS plantings_crop_id_index ON plantings (crop_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS plot_assignments_assigned_by_index ON plot_assignments (assigned_by)');
        DB::statement('CREATE INDEX IF NOT EXISTS plot_requests_reviewed_by_index ON plot_requests (reviewed_by)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS calendar_events_created_by_index');
        DB::statement('DROP INDEX IF EXISTS community_updates_created_by_index');
        DB::statement('DROP INDEX IF EXISTS plantings_crop_id_index');
        DB::statement('DROP INDEX IF EXISTS plot_assignments_assigned_by_index');
        DB::statement('DROP INDEX IF EXISTS plot_requests_reviewed_by_index');
    }
};
