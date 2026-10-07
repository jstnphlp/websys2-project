<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\Planting;
use App\Models\PlotAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HarvestTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->setDate(2026, 10, 7)->setTime(12, 0));
    }

    public function test_member_records_harvests_on_their_planting_and_sees_totals(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);

        $this->actingAs($member)->post("/plantings/{$planting->id}/harvests", ['harvested_at' => '2026-10-05', 'quantity_kg' => '2.5', 'notes' => 'First pick'])->assertRedirect()->assertSessionHas('success');
        $this->actingAs($member)->post("/plantings/{$planting->id}/harvests", ['harvested_at' => '2026-10-07', 'quantity_kg' => '1.25'])->assertRedirect();

        $this->assertDatabaseHas('harvests', ['planting_id' => $planting->id, 'recorded_by' => $member->id, 'notes' => 'First pick']);
        $this->actingAs($member)->get('/assignments')->assertOk()->assertInertia(fn ($page) => $page
            ->has('activeAssignment.plantings.0.harvests', 2)
            ->where('assignments.data.0.harvests_sum_quantity_kg', fn ($sum) => (float) $sum === 3.75));
    }

    public function test_harvest_input_is_validated(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);
        $url = "/plantings/{$planting->id}/harvests";

        $this->actingAs($member)->post($url, [])->assertSessionHasErrors(['harvested_at', 'quantity_kg']);
        $this->actingAs($member)->post($url, ['harvested_at' => '2026-08-31', 'quantity_kg' => 1])->assertSessionHasErrors('harvested_at');
        $this->actingAs($member)->post($url, ['harvested_at' => '2026-10-08', 'quantity_kg' => 1])->assertSessionHasErrors('harvested_at');
        $this->actingAs($member)->post($url, ['harvested_at' => '2026-10-07', 'quantity_kg' => 0])->assertSessionHasErrors('quantity_kg');
        $this->actingAs($member)->post($url, ['harvested_at' => '2026-10-07', 'quantity_kg' => '1.255'])->assertSessionHasErrors('quantity_kg');
        $this->actingAs($member)->post($url, ['harvested_at' => '2026-10-07', 'quantity_kg' => 10000])->assertSessionHasErrors('quantity_kg');
        $this->actingAs($member)->post($url, ['harvested_at' => '2026-10-07', 'quantity_kg' => 1, 'notes' => str_repeat('a', 501)])->assertSessionHasErrors('notes');

        $this->assertDatabaseCount('harvests', 0);
    }

    public function test_only_the_plot_member_can_record_and_only_on_an_active_assignment(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);
        $harvest = ['harvested_at' => '2026-10-07', 'quantity_kg' => 1];

        $other = User::factory()->create(['role' => UserRole::Member]);
        $this->actingAs($other)->post("/plantings/{$planting->id}/harvests", $harvest)->assertForbidden();
        foreach ([UserRole::Staff, UserRole::Admin] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->post("/plantings/{$planting->id}/harvests", $harvest)->assertForbidden();
        }
        $this->post('/logout');
        $this->post("/plantings/{$planting->id}/harvests", $harvest)->assertRedirect('/login');

        $planting->assignment->update(['status' => 'ended', 'end_date' => '2026-10-06']);
        $this->actingAs($member)->post("/plantings/{$planting->id}/harvests", $harvest)->assertStatus(422);

        $this->assertDatabaseCount('harvests', 0);
    }

    public function test_staff_assignments_and_admin_reports_include_harvest_totals(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member, 'name' => '=Formula Member']);
        $planting = $this->planting($member);
        $planting->harvests()->createMany([
            ['harvested_at' => '2026-10-01', 'quantity_kg' => 2, 'recorded_by' => $member->id],
            ['harvested_at' => '2026-10-06', 'quantity_kg' => 1.5, 'recorded_by' => $member->id],
            ['harvested_at' => '2026-06-01', 'quantity_kg' => 9, 'recorded_by' => $member->id],
        ]);
        $staff = User::factory()->create(['role' => UserRole::Staff]);
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($staff)->get('/assignments')->assertOk()->assertInertia(fn ($page) => $page
            ->where('assignments.data.0.harvests_sum_quantity_kg', fn ($sum) => (float) $sum === 12.5));

        $this->actingAs($admin)->get('/reports?from=2026-09-01&to=2026-10-07')->assertOk()->assertInertia(fn ($page) => $page
            ->has('harvestBreakdown', 1)
            ->where('harvestBreakdown.0.crop', 'Tomato')
            ->where('harvestBreakdown.0.harvests', 2)
            ->where('harvestBreakdown.0.total_kg', fn ($kg) => (float) $kg === 3.5));

        $csv = $this->actingAs($admin)->get('/reports/export?from=2026-09-01&to=2026-10-07')->streamedContent();
        $this->assertStringContainsString('"Harvest ID",Member,Plot,Crop,Harvested,"Quantity (kg)"', $csv);
        $this->assertStringContainsString('"\'=Formula Member",A-01,Tomato,2026-10-06,1.50', $csv);
        $this->assertStringNotContainsString('2026-06-01', $csv);
    }

    public function test_forecast_marks_harvested_plantings(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);

        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2026-09-01&to=2026-12-31')->assertOk()
            ->assertJsonPath('data.0.status', 'in_window')->assertJsonPath('data.0.harvested_kg', 0);

        $planting->harvests()->create(['harvested_at' => '2026-10-07', 'quantity_kg' => 2.25, 'recorded_by' => $member->id]);
        $this->actingAs($member)->getJson('/api/garden-calendar/forecasts?from=2026-09-01&to=2026-12-31')->assertOk()
            ->assertJsonPath('data.0.status', 'harvested')->assertJsonPath('data.0.harvested_kg', 2.25);
    }

    private function planting(User $member): Planting
    {
        $plot = GardenPlot::create(['plot_code' => 'A-01', 'location' => 'North', 'size' => 12, 'status' => GardenPlotStatus::Occupied]);
        $assignment = PlotAssignment::create(['user_id' => $member->id, 'garden_plot_id' => $plot->id, 'start_date' => '2026-09-01', 'status' => 'active']);
        $crop = Crop::create(['name' => 'Tomato', 'type' => 'vegetable', 'maturity_days_min' => 30, 'maturity_days_max' => 40, 'harvest_window_days' => 21]);

        return $assignment->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-01']);
    }
}
