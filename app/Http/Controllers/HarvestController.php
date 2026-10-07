<?php

namespace App\Http\Controllers;

use App\Models\Planting;
use App\Models\PlotAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HarvestController extends Controller
{
    public function store(Request $request, Planting $planting): RedirectResponse
    {
        abort_unless($request->user()->role->value === 'member' && $planting->assignment->user_id === $request->user()->id, 403);
        DB::transaction(function () use ($request, $planting) {
            $assignment = PlotAssignment::lockForUpdate()->findOrFail($planting->plot_assignment_id);
            abort_unless($assignment->status->value === 'active', 422, 'This assignment is no longer active.');

            $data = $request->validate([
                'harvested_at' => ['required', 'date', 'after_or_equal:'.$planting->planted_at->toDateString(), 'before_or_equal:'.today()->toDateString()],
                'quantity_kg' => ['required', 'numeric', 'decimal:0,2', 'min:0.01', 'max:9999.99'],
                'notes' => ['nullable', 'string', 'max:500'],
            ], [
                'harvested_at.after_or_equal' => 'The harvest date cannot be before the planting date.',
                'harvested_at.before_or_equal' => 'The harvest date cannot be in the future.',
            ]);
            $planting->harvests()->create([...$data, 'recorded_by' => $request->user()->id]);
        });

        return back()->with('success', 'Harvest recorded.');
    }
}
