<?php

namespace App\Http\Controllers;

use App\Models\Crop;
use App\Models\GardenPlot;
use App\Models\PlotAssignment;
use App\Models\User;
use App\Notifications\GardenNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $isMember = $request->user()->role->value === 'member';
        $query = PlotAssignment::with(['user:id,name,email', 'gardenPlot:id,plot_code,location,size'])->withSum('harvests', 'quantity_kg')->latest('start_date');
        if ($isMember) {
            $query->where('user_id', $request->user()->id);
            $query->with(['plantings.crop:id,name,type', 'plantings.harvests']);
        }
        if ($search = $request->string('search')->trim()->toString()) {
            $query->where(fn ($q) => $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))->orWhereHas('gardenPlot', fn ($p) => $p->where(fn ($plot) => $plot->where('plot_code', 'like', "%{$search}%")->orWhere('location', 'like', "%{$search}%"))));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return Inertia::render('assignments', [
            'assignments' => $query->paginate(10)->withQueryString(), 'filters' => $request->only('search', 'status'),
            'members' => $isMember ? [] : User::where('role', 'member')->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'availablePlots' => $isMember ? [] : GardenPlot::where('status', 'available')->whereNull('archived_at')->orderBy('plot_code')->get(['id', 'plot_code']),
            'crops' => $isMember ? Crop::orderBy('name')->get(['id', 'name', 'type']) : [],
            'activeAssignment' => $isMember
                ? $request->user()->plotAssignments()->with(['gardenPlot:id,plot_code,location,size', 'plantings.crop:id,name,type', 'plantings.harvests'])->where('status', 'active')->first()
                : null,
            'today' => now()->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->requireStaff($request);
        $data = $this->validated($request);
        DB::transaction(function () use ($request, $data) {
            $plot = GardenPlot::lockForUpdate()->findOrFail($data['garden_plot_id']);
            $member = User::lockForUpdate()->findOrFail($data['user_id']);
            if ($plot->archived_at || $plot->status->value !== 'available') {
                throw ValidationException::withMessages(['garden_plot_id' => 'Plot is unavailable.']);
            }
            if ($member->role->value !== 'member' || ! $member->is_active) {
                throw ValidationException::withMessages(['user_id' => 'Member no longer has active garden access.']);
            }
            if ($member->plotAssignments()->where('status', 'active')->exists()) {
                throw ValidationException::withMessages(['user_id' => 'Member already has an active assignment. Close it before creating another.']);
            }
            $assignment = PlotAssignment::create([...$data, 'status' => 'active', 'assigned_by' => $request->user()->id]);
            $plot->update(['status' => 'occupied']);
            $assignment->user->notify(new GardenNotification("You were assigned plot {$plot->plot_code}.", '/assignments'));
        });

        return back()->with('success', 'Assignment created.');
    }

    public function update(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        $this->requireStaff($request);
        DB::transaction(function () use ($request, $assignment) {
            $assignment = PlotAssignment::lockForUpdate()->findOrFail($assignment->id);
            if ($assignment->status->value !== 'active') {
                throw ValidationException::withMessages(['end_date' => 'This assignment is already closed. Refresh to see the latest status.']);
            }
            $assignment->update($request->validate(['start_date' => ['required', 'date'], 'end_date' => ['nullable', 'date', 'after_or_equal:start_date']]));
        });

        return back()->with('success', 'Assignment dates updated.');
    }

    public function close(Request $request, PlotAssignment $assignment): RedirectResponse
    {
        $this->requireStaff($request);
        DB::transaction(function () use ($request, $assignment) {
            $plot = GardenPlot::lockForUpdate()->findOrFail($assignment->garden_plot_id);
            $assignment = PlotAssignment::lockForUpdate()->findOrFail($assignment->id);
            if ($assignment->status->value !== 'active') {
                throw ValidationException::withMessages(['end_date' => 'This assignment is already closed. Refresh to see the latest status.']);
            }
            $data = $request->validate(['status' => ['required', Rule::in(['ended', 'cancelled'])], 'end_date' => ['required', 'date', 'after_or_equal:'.$assignment->start_date->toDateString()]]);
            $assignment->update($data);
            if ($plot->status->value === 'occupied') {
                $plot->update(['status' => 'available']);
            }
            $assignment->user->notify(new GardenNotification('Your plot assignment has ended.', '/assignments'));
        });

        return back()->with('success', 'Assignment closed and plot released.');
    }

    private function validated(Request $request): array
    {
        return $request->validate(['user_id' => ['required', Rule::exists('users', 'id')->where('role', 'member')->where('is_active', true)], 'garden_plot_id' => ['required', Rule::exists('garden_plots', 'id')->where(fn ($query) => $query->where('status', 'available')->whereNull('archived_at'))], 'start_date' => ['required', 'date'], 'end_date' => ['nullable', 'date', 'after_or_equal:start_date']]);
    }
}
