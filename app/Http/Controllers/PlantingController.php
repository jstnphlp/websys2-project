<?php

namespace App\Http\Controllers;

use App\Models\Planting;
use App\Models\PlotAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PlantingController extends Controller
{
    public function store(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        abort_unless($request->user()->role->value === 'member' && $assignment->user_id === $request->user()->id, 403);
        DB::transaction(function () use ($request, $assignment) {
            $assignment = PlotAssignment::lockForUpdate()->findOrFail($assignment->id);
            abort_unless($assignment->status->value === 'active', 422, 'This assignment is no longer active.');
            $lastPlantingDate = $this->lastPlantingDate($assignment);

            $data = $request->validate([
                'crop_id' => ['required', 'integer', Rule::exists('crops', 'id')],
                'planted_at' => ['required', 'date', 'after_or_equal:'.$assignment->start_date->toDateString(), 'before_or_equal:'.$lastPlantingDate],
            ]);
            $assignment->plantings()->create($data);
        });

        return back()->with('success', 'Planting added.');
    }

    public function update(Request $request, Planting $planting): RedirectResponse
    {
        $this->authorizeOwner($request, $planting);
        DB::transaction(function () use ($request, $planting) {
            $assignment = $this->lockActiveAssignment($planting);
            // A planting cannot move after its first recorded harvest.
            $firstHarvest = $planting->harvests()->min('harvested_at');
            $latest = $this->lastPlantingDate($assignment);
            if ($firstHarvest && substr($firstHarvest, 0, 10) < $latest) {
                $latest = substr($firstHarvest, 0, 10);
            }
            $data = $request->validate([
                'crop_id' => ['required', 'integer', Rule::exists('crops', 'id')],
                'planted_at' => ['required', 'date', 'after_or_equal:'.$assignment->start_date->toDateString(), 'before_or_equal:'.$latest],
            ], ['planted_at.before_or_equal' => $firstHarvest ? 'The planting date cannot be after its first harvest.' : 'The planting date cannot be in the future.']);
            $planting->update($data);
        });

        return back()->with('success', 'Planting updated.');
    }

    public function destroy(Request $request, Planting $planting): RedirectResponse
    {
        $this->authorizeOwner($request, $planting);
        DB::transaction(function () use ($planting) {
            $this->lockActiveAssignment($planting);
            $planting->delete();
        });

        return back()->with('success', 'Planting removed.');
    }

    private function authorizeOwner(Request $request, Planting $planting): void
    {
        abort_unless($request->user()->role->value === 'member' && $planting->assignment->user_id === $request->user()->id, 403);
    }

    private function lockActiveAssignment(Planting $planting): PlotAssignment
    {
        $assignment = PlotAssignment::lockForUpdate()->findOrFail($planting->plot_assignment_id);
        abort_unless($assignment->status->value === 'active', 422, 'This assignment is no longer active.');

        return $assignment;
    }

    private function lastPlantingDate(PlotAssignment $assignment): string
    {
        return $assignment->end_date && $assignment->end_date->isBefore(today())
            ? $assignment->end_date->toDateString()
            : today()->toDateString();
    }
}
