<?php

namespace App\Services;

use App\Models\Planting;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class CropCycleForecastService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function forPlantings(Collection $plantings, CarbonImmutable $from, CarbonImmutable $to): Collection
    {
        $today = CarbonImmutable::today(config('garden.timezone'));

        return $plantings
            ->filter(fn (Planting $planting) => $planting->crop->maturity_days_min !== null
                && $planting->crop->maturity_days_max !== null)
            ->map(function (Planting $planting) use ($today): array {
                $crop = $planting->crop;
                $earliest = CarbonImmutable::parse($planting->planted_at->toDateString(), config('garden.timezone'))
                    ->addDays($crop->maturity_days_min);
                $latest = CarbonImmutable::parse($planting->planted_at->toDateString(), config('garden.timezone'))
                    ->addDays($crop->maturity_days_max);
                $end = $crop->harvest_window_days === null
                    ? $latest
                    : $latest->addDays($crop->harvest_window_days);
                $harvestedKg = round((float) $planting->harvests->sum('quantity_kg'), 2);
                $status = $harvestedKg > 0
                    ? 'harvested'
                    : ($today->lt($earliest) ? 'upcoming' : ($today->lte($end) ? 'in_window' : 'window_passed'));

                return [
                    'id' => 'planting:'.$planting->id,
                    'planting_id' => $planting->id,
                    'crop' => [
                        'id' => $crop->id,
                        'name' => $crop->name,
                        'type' => $crop->type,
                    ],
                    'planted_at' => $planting->planted_at->toDateString(),
                    'harvest_start_earliest' => $earliest->toDateString(),
                    'harvest_start_latest' => $latest->toDateString(),
                    'harvest_window_end' => $crop->harvest_window_days === null ? null : $end->toDateString(),
                    'status' => $status,
                    'harvested_kg' => $harvestedKg,
                    'basis_days' => ['min' => $crop->maturity_days_min, 'max' => $crop->maturity_days_max],
                    'basis_note' => $crop->maturity_source,
                    'plot' => [
                        'code' => $planting->assignment->gardenPlot->plot_code,
                        'location' => $planting->assignment->gardenPlot->location,
                    ],
                ];
            })
            ->filter(function (array $forecast) use ($from, $to): bool {
                $intervalStart = CarbonImmutable::parse($forecast['harvest_start_earliest'], config('garden.timezone'));
                $intervalEnd = CarbonImmutable::parse($forecast['harvest_window_end'] ?? $forecast['harvest_start_latest'], config('garden.timezone'));

                return $intervalStart->lte($to) && $intervalEnd->gte($from);
            })
            ->sortBy('harvest_start_earliest')
            ->values();
    }
}
