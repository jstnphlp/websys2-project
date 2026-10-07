<?php

namespace Tests\Feature;

use App\Enums\GardenPlotStatus;
use App\Enums\UserRole;
use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\Planting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlantingEditTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->setDate(2026, 10, 7)->setTime(12, 0));
    }

    public function test_member_can_change_the_crop_and_date_of_their_planting(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);
        $basil = Crop::create(['name' => 'Basil', 'type' => 'herb']);

        $this->actingAs($member)->put("/plantings/{$planting->id}", ['crop_id' => $basil->id, 'planted_at' => '2026-09-10'])->assertRedirect()->assertSessionHas('success', 'Planting updated.');

        $this->assertDatabaseHas('plantings', ['id' => $planting->id, 'crop_id' => $basil->id]);
        $this->assertSame('2026-09-10', $planting->fresh()->planted_at->toDateString());
    }

    public function test_edited_dates_stay_within_the_assignment_and_before_the_first_harvest(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);
        $url = "/plantings/{$planting->id}";

        $this->actingAs($member)->put($url, ['crop_id' => $planting->crop_id, 'planted_at' => '2026-08-31'])->assertSessionHasErrors('planted_at');
        $this->actingAs($member)->put($url, ['crop_id' => $planting->crop_id, 'planted_at' => '2026-10-08'])->assertSessionHasErrors('planted_at');
        $this->actingAs($member)->put($url, ['crop_id' => 99999, 'planted_at' => '2026-09-10'])->assertSessionHasErrors('crop_id');

        $planting->harvests()->create(['harvested_at' => '2026-09-20', 'quantity_kg' => 1, 'recorded_by' => $member->id]);
        $this->actingAs($member)->put($url, ['crop_id' => $planting->crop_id, 'planted_at' => '2026-09-21'])->assertSessionHasErrors(['planted_at' => 'The planting date cannot be after its first harvest.']);
        $this->actingAs($member)->put($url, ['crop_id' => $planting->crop_id, 'planted_at' => '2026-09-20'])->assertSessionHasNoErrors();

        $this->assertSame('2026-09-20', $planting->fresh()->planted_at->toDateString());
    }

    public function test_member_can_remove_a_planting_and_its_harvests(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);
        $planting->harvests()->create(['harvested_at' => '2026-10-01', 'quantity_kg' => 2, 'recorded_by' => $member->id]);

        $this->actingAs($member)->delete("/plantings/{$planting->id}")->assertRedirect()->assertSessionHas('success', 'Planting removed.');

        $this->assertDatabaseMissing('plantings', ['id' => $planting->id]);
        $this->assertDatabaseCount('harvests', 0);
    }

    public function test_only_the_owner_can_edit_or_remove_and_only_on_an_active_assignment(): void
    {
        $member = User::factory()->create(['role' => UserRole::Member]);
        $planting = $this->planting($member);
        $update = ['crop_id' => $planting->crop_id, 'planted_at' => '2026-09-10'];

        foreach ([User::factory()->create(['role' => UserRole::Member]), User::factory()->create(['role' => UserRole::Staff]), User::factory()->create(['role' => UserRole::Admin])] as $user) {
            $this->actingAs($user)->put("/plantings/{$planting->id}", $update)->assertForbidden();
            $this->actingAs($user)->delete("/plantings/{$planting->id}")->assertForbidden();
        }

        $planting->assignment->update(['status' => 'ended', 'end_date' => '2026-10-06']);
        $this->actingAs($member)->put("/plantings/{$planting->id}", $update)->assertStatus(422);
        $this->actingAs($member)->delete("/plantings/{$planting->id}")->assertStatus(422);

        $this->assertSame('2026-09-01', $planting->fresh()->planted_at->toDateString());
    }

    private function planting(User $member): Planting
    {
        $plot = GardenPlot::create(['plot_code' => 'A-01', 'location' => 'North', 'size' => 12, 'status' => GardenPlotStatus::Occupied]);
        $assignment = $member->plotAssignments()->create(['garden_plot_id' => $plot->id, 'start_date' => '2026-09-01', 'status' => 'active']);
        $crop = Crop::create(['name' => 'Tomato', 'type' => 'vegetable']);

        return $assignment->plantings()->create(['crop_id' => $crop->id, 'planted_at' => '2026-09-01']);
    }
}
