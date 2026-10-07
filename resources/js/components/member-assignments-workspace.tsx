import { Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Carrot, CalendarDays, CircleCheck, Clock3, Eye, LoaderCircle, MapPin, Sprout, XCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CropTypeIcon, cropTypes, type CropType } from '@/components/crop-type-icon';
import { PlantingCalendar } from '@/components/planting-calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PlotMarker, WorkspaceStatusTabs, fieldClass, type Paginated } from '@/components/workspace-ui';
import { WorkspaceSearch } from '@/components/workspace-search';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type AssignmentStatus = 'active' | 'ended' | 'cancelled';
export type AssignmentCrop = { id: number; name: string; type: CropType };
type Harvest = { id: number; harvested_at: string; quantity_kg: string | number; notes: string | null };
type Planting = { id: number; planted_at: string; crop: AssignmentCrop; harvests?: Harvest[] };
export type MemberAssignment = {
    id: number;
    status: AssignmentStatus;
    start_date: string;
    end_date: string | null;
    garden_plot: { plot_code: string; location: string; size: number | string };
    plantings?: Planting[];
    harvests_sum_quantity_kg?: string | number | null;
};

const panelClass = 'overflow-hidden rounded-2xl border border-border bg-[#fbf8f2]';
const eyebrowClass = 'text-xs text-muted-foreground';
const statusOptions: Array<{ value: '' | AssignmentStatus; label: string }> = [
    { value: '', label: 'All assignments' },
    { value: 'active', label: 'Active' },
    { value: 'ended', label: 'Ended' },
    { value: 'cancelled', label: 'Cancelled' },
];

function dateLabel(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function AssignmentBadge({ status }: { status: AssignmentStatus }) {
    const Icon = status === 'active' ? CircleCheck : status === 'ended' ? Clock3 : XCircle;
    return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize', status === 'active' ? 'bg-primary/[0.09] text-primary' : 'bg-secondary text-muted-foreground')}><Icon className="size-3.5" aria-hidden="true" />{status}</span>;
}

function AssignmentFacts({ assignment }: { assignment: MemberAssignment }) {
    return (
        <dl className="grid gap-5 sm:grid-cols-3">
            <div><dt className={eyebrowClass}>Location</dt><dd className="mt-2 flex items-start gap-1.5 text-sm font-semibold"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{assignment.garden_plot.location}</dd></div>
            <div><dt className={eyebrowClass}>Plot size</dt><dd className="mt-2 text-sm font-semibold">{Number(assignment.garden_plot.size).toFixed(2)} m²</dd></div>
            <div><dt className={eyebrowClass}>Assignment period</dt><dd className="mt-2 text-sm font-semibold">{dateLabel(assignment.start_date)}<span className="mt-1 block text-xs font-normal text-muted-foreground">{assignment.end_date ? `Ends ${dateLabel(assignment.end_date)}` : 'No end date set'}</span></dd></div>
        </dl>
    );
}

function kgLabel(value: string | number | null | undefined) {
    return `${Number(value ?? 0).toLocaleString('en-PH', { maximumFractionDigits: 2 })} kg`;
}

function harvestTotal(planting: Planting) {
    return (planting.harvests ?? []).reduce((sum, harvest) => sum + Number(harvest.quantity_kg), 0);
}

function PlantingsTable({ plantings, onHarvest }: { plantings: Planting[]; onHarvest?: (planting: Planting) => void }) {
    if (plantings.length === 0) {
        return <div className="p-5"><p className="text-sm font-semibold">No plantings recorded</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Recorded crops and planting dates will appear here.</p></div>;
    }
    const sortedPlantings = [...plantings].sort((a, b) => b.planted_at.localeCompare(a.planted_at) || b.id - a.id);
    return (
        <Table>
            <caption className="sr-only">Recorded crops and planting dates</caption>
            <TableHeader className="bg-card/80"><TableRow className="hover:bg-transparent"><TableHead className="h-10 px-5 text-[10px] sm:px-6">Crop</TableHead><TableHead className="h-10 text-[10px]">Type</TableHead><TableHead className="h-10 text-[10px]">Planted</TableHead><TableHead className="h-10 text-[10px]">Harvested</TableHead>{onHarvest && <TableHead className="h-10 px-5 text-right text-[10px] sm:px-6">Harvest</TableHead>}</TableRow></TableHeader>
            <TableBody>{sortedPlantings.map((planting) => (
                <TableRow key={planting.id} className="border-border/60 hover:bg-primary/[0.032]">
                    <TableCell className="px-5 py-3 sm:px-6"><div className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-primary/[0.055] [&_svg]:size-4 [&_svg]:text-primary"><CropTypeIcon type={planting.crop.type} /></span><span className="font-semibold">{planting.crop.name}</span></div></TableCell>
                    <TableCell className="py-3 text-xs capitalize text-muted-foreground">{planting.crop.type}</TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-xs text-muted-foreground">{dateLabel(planting.planted_at)}</TableCell>
                    <TableCell className="whitespace-nowrap py-3 text-xs">{planting.harvests?.length ? <><span className="font-semibold tabular-nums">{kgLabel(harvestTotal(planting))}</span><span className="ml-1 text-muted-foreground">· {planting.harvests.length} {planting.harvests.length === 1 ? 'harvest' : 'harvests'}</span></> : <span className="text-muted-foreground">Not yet</span>}</TableCell>
                    {onHarvest && <TableCell className="px-5 py-3 text-right sm:px-6"><Button size="sm" variant="outline" className="rounded-[10px]" aria-label={`Record harvest for ${planting.crop.name}`} onClick={() => onHarvest(planting)}><Carrot aria-hidden="true" />Record</Button></TableCell>}
                </TableRow>
            ))}</TableBody>
        </Table>
    );
}

export function MemberAssignmentsWorkspace({ assignments, activeAssignment, crops, filters, today }: {
    assignments: Paginated<MemberAssignment>;
    activeAssignment: MemberAssignment | null;
    crops: AssignmentCrop[];
    filters: { search?: string; status?: string };
    today: string;
}) {
    const pageUrl = usePage().url;
    const lastPlantingDate = activeAssignment?.end_date && activeAssignment.end_date.slice(0, 10) < today
        ? activeAssignment.end_date.slice(0, 10)
        : today;
    const canPlant = Boolean(activeAssignment && activeAssignment.start_date.slice(0, 10) <= lastPlantingDate && crops.length);
    const [plantingOpen, setPlantingOpen] = useState(() => {
        const requestedId = new URLSearchParams(pageUrl.split('?')[1] ?? '').get('plant');
        return canPlant && String(activeAssignment?.id) === requestedId;
    });
    const [query, setQuery] = useState(filters.search ?? '');
    const [cropFilter, setCropFilter] = useState<CropType | 'all'>('all');
    const [selectedAssignment, setSelectedAssignment] = useState<MemberAssignment | null>(null);
    const plantingForm = useForm({ crop_id: '', planted_at: lastPlantingDate });
    const [harvestPlanting, setHarvestPlanting] = useState<Planting | null>(null);
    const harvestForm = useForm({ harvested_at: today, quantity_kg: '', notes: '' });
    const visibleCrops = crops.filter((crop) => cropFilter === 'all' || crop.type === cropFilter);
    const hasFilters = Boolean(filters.search || filters.status);

    function filterHistory(status = filters.status ?? '', search = query.trim()) {
        router.get('/assignments', { ...(status && { status }), ...(search && { search }) }, { preserveState: true, preserveScroll: true, replace: true });
    }

    function openPlanting() {
        plantingForm.setData({ crop_id: '', planted_at: lastPlantingDate });
        plantingForm.clearErrors();
        setCropFilter('all');
        setPlantingOpen(true);
    }

    function submitPlanting(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!activeAssignment || !canPlant || plantingForm.processing) return;
        plantingForm.clearErrors();
        if (!plantingForm.data.crop_id) {
            plantingForm.setError('crop_id', 'Choose the crop you planted.');
            return;
        }
        plantingForm.post(`/assignments/${activeAssignment.id}/plantings`, { preserveScroll: true, onSuccess: () => setPlantingOpen(false) });
    }

    function openHarvest(planting: Planting) {
        harvestForm.setData({ harvested_at: today, quantity_kg: '', notes: '' });
        harvestForm.clearErrors();
        setHarvestPlanting(planting);
    }

    function submitHarvest(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!harvestPlanting || harvestForm.processing) return;
        harvestForm.post(`/plantings/${harvestPlanting.id}/harvests`, { preserveScroll: true, onSuccess: () => setHarvestPlanting(null) });
    }

    return (
        <AppLayout
            title="My assignments"
            description="View your current plot, record plantings and harvests, and review past assignments."
            actions={(
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <WorkspaceSearch value={query} onChange={setQuery} label="Search assignments by plot or location" placeholder="Search assignments" onSubmit={() => filterHistory()} onClear={() => filterHistory(filters.status ?? '', '')} className="sm:w-[233px]" />
                    {activeAssignment ? <Button className="rounded-xl" disabled={!canPlant} onClick={openPlanting}><Sprout aria-hidden="true" />Add planting</Button> : <Button asChild className="rounded-xl"><Link href="/garden-plots"><Sprout aria-hidden="true" />Browse plots</Link></Button>}
                </div>
            )}
        >
            <div className="space-y-6 pb-9">
                <section aria-labelledby="current-assignment-title">
                    <h2 id="current-assignment-title" className="sr-only">Current assignment</h2>
                    {activeAssignment ? (
                        <div className={panelClass}>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card/80 px-5 py-4 sm:px-6">
                                <div className="flex items-center gap-3"><PlotMarker code={activeAssignment.garden_plot.plot_code} /><div><h3 className="text-lg font-[750] tracking-[-0.02em]">Plot {activeAssignment.garden_plot.plot_code}</h3><p className="mt-0.5 text-xs text-muted-foreground">Your current assignment</p></div></div>
                                <div className="flex items-center gap-3"><AssignmentBadge status={activeAssignment.status} /><Button asChild variant="outline" size="sm" className="rounded-[10px]"><Link href="/garden-calendar"><CalendarDays aria-hidden="true" />Calendar</Link></Button></div>
                            </div>
                            <div className="p-5 sm:p-6"><AssignmentFacts assignment={activeAssignment} /></div>
                            {!canPlant && <p className="border-t border-border px-5 py-4 text-sm text-muted-foreground">{activeAssignment.start_date.slice(0, 10) > today ? `You can record plantings from ${dateLabel(activeAssignment.start_date)}.` : 'Garden staff have not added any crops yet. Planting records will be available once crops are added.'}</p>}
                            <section aria-labelledby="planting-record-title" className="border-t border-border/70">
                                <h2 id="planting-record-title" className="sr-only">Planting record</h2>
                                <p className="px-5 py-3 text-xs text-muted-foreground sm:px-6">{activeAssignment.plantings?.length ?? 0} {(activeAssignment.plantings?.length ?? 0) === 1 ? 'planting' : 'plantings'} recorded</p>
                                <PlantingsTable plantings={activeAssignment.plantings ?? []} onHarvest={openHarvest} />
                            </section>
                        </div>
                    ) : (
                        <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-border bg-card/55 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div><h3 className="text-sm font-bold">No active plot assignment</h3><p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">Browse available plots to submit a request, or check a request you already sent.</p></div>
                            <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto"><Link href="/plot-requests">View my requests<ArrowRight aria-hidden="true" /></Link></Button>
                        </div>
                    )}
                </section>

                <section aria-labelledby="assignment-history-title">
                    <h2 id="assignment-history-title" className="sr-only">Assignment history</h2>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <WorkspaceStatusTabs value={filters.status ?? ''} options={statusOptions} onChange={(status) => filterHistory(status)} label="Filter assignments by status" />
                        <p className="text-xs tabular-nums text-muted-foreground">{assignments.total} {assignments.total === 1 ? 'assignment' : 'assignments'}</p>
                    </div>
                    {assignments.data.length ? (
                        <div className={panelClass}>
                            <Table>
                                <TableHeader className="bg-card/80"><TableRow className="hover:bg-transparent"><TableHead className="h-10 px-5 text-[10px] sm:px-6">Garden plot</TableHead><TableHead className="h-10 text-[10px]">Started</TableHead><TableHead className="h-10 text-[10px]">End date</TableHead><TableHead className="h-10 text-[10px]">Status</TableHead><TableHead className="h-10 px-5 text-right text-[10px] sm:px-6">Details</TableHead></TableRow></TableHeader>
                                <TableBody>{assignments.data.map((assignment) => (
                                    <TableRow key={assignment.id} className="border-border/60 hover:bg-primary/[0.032]">
                                        <TableCell className="min-w-48 px-5 sm:px-6"><div className="flex items-center gap-3"><PlotMarker code={assignment.garden_plot.plot_code} /><div><p className="font-semibold">Plot {assignment.garden_plot.plot_code}</p><p className="mt-0.5 text-xs text-muted-foreground">{assignment.garden_plot.location}</p></div></div></TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{dateLabel(assignment.start_date)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{assignment.end_date ? dateLabel(assignment.end_date) : 'Ongoing'}</TableCell>
                                        <TableCell className="whitespace-nowrap"><AssignmentBadge status={assignment.status} /></TableCell>
                                        <TableCell className="px-5 text-right sm:px-6"><Button size="sm" variant="outline" className="rounded-[10px]" aria-label={`View assignment #${assignment.id} for plot ${assignment.garden_plot.plot_code}`} onClick={() => setSelectedAssignment(assignment)}>View<Eye aria-hidden="true" /></Button></TableCell>
                                    </TableRow>
                                ))}</TableBody>
                            </Table>
                            <Pagination page={assignments} />
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-card/55 px-5 py-9 text-center">
                            <h3 className="text-sm font-bold">{hasFilters ? 'No matching assignments' : 'No assignment history yet'}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{hasFilters ? 'Try a different plot, location, or status.' : 'Your plot assignments will appear here once staff assign a plot.'}</p>
                            {hasFilters && <button type="button" onClick={() => { setQuery(''); filterHistory('', ''); }} className="mt-3 rounded-sm text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Clear filters</button>}
                        </div>
                    )}
                </section>
                <p className="text-sm text-muted-foreground">Questions about your assignment dates? <Link href="/help" className="rounded-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">Read assignment guidance</Link></p>
            </div>

            <Dialog open={Boolean(selectedAssignment)} onOpenChange={(open) => { if (!open) setSelectedAssignment(null); }}>
                {selectedAssignment && <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto rounded-2xl bg-card"><DialogHeader className="pr-6"><DialogTitle className="text-xl font-[750] tracking-[-0.025em]">Plot {selectedAssignment.garden_plot.plot_code}</DialogTitle><DialogDescription>Assignment #{selectedAssignment.id} · Plot details and recorded plantings.</DialogDescription></DialogHeader><div><AssignmentBadge status={selectedAssignment.status} /></div><div className="border-y border-border py-5"><AssignmentFacts assignment={selectedAssignment} /></div><section aria-labelledby="past-plantings-title"><h3 id="past-plantings-title" className="mb-3 text-sm font-bold">Planting record</h3><div className="overflow-hidden rounded-xl border border-border"><PlantingsTable plantings={selectedAssignment.plantings ?? []} /></div></section><DialogFooter><Button variant="outline" className="rounded-xl" onClick={() => setSelectedAssignment(null)}>Close</Button></DialogFooter></DialogContent>}
            </Dialog>

            <Dialog open={plantingOpen && Boolean(activeAssignment)} onOpenChange={(open) => { if (!plantingForm.processing) setPlantingOpen(open); }}>
                {activeAssignment && <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-2xl bg-card" showCloseButton={!plantingForm.processing}>
                    <DialogHeader className="pr-6"><DialogTitle className="text-xl font-[750] tracking-[-0.025em]">Add planting</DialogTitle><DialogDescription>Record a crop planted in plot {activeAssignment.garden_plot.plot_code}.</DialogDescription></DialogHeader>
                    <form onSubmit={submitPlanting} className="space-y-5">
                        <div role="group" aria-labelledby="planting-crop-label" aria-describedby={plantingForm.errors.crop_id ? 'planting-crop-error' : undefined}>
                            <h3 id="planting-crop-label" className="mb-2 text-sm font-semibold">Choose a crop</h3>
                            <div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Filter crops by type">{(['all', ...cropTypes] as const).map((type) => <button key={type} type="button" aria-pressed={cropFilter === type} onClick={() => setCropFilter(type)} className={cn('h-8 rounded-full px-2.5 text-xs font-medium capitalize text-muted-foreground transition-colors hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50', cropFilter === type && 'bg-primary/[0.09] font-semibold text-primary')}>{type === 'all' ? 'All crops' : type}</button>)}</div>
                            <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto p-1 sm:grid-cols-4">
                                {visibleCrops.map((crop) => <button key={crop.id} type="button" aria-pressed={plantingForm.data.crop_id === String(crop.id)} onClick={() => { plantingForm.setData('crop_id', String(crop.id)); plantingForm.clearErrors('crop_id'); }} className={cn('flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-border p-2 text-center transition-colors hover:border-primary/30 hover:bg-primary/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:text-primary', plantingForm.data.crop_id === String(crop.id) && 'border-primary bg-primary/[0.09] ring-1 ring-primary')}><CropTypeIcon type={crop.type} /><span className="text-xs font-semibold leading-4">{crop.name}</span></button>)}
                                {!visibleCrops.length && <p className="col-span-full py-4 text-sm text-muted-foreground">No crops available in this category.</p>}
                            </div>
                            {plantingForm.errors.crop_id && <p id="planting-crop-error" role="alert" className="mt-2 text-sm text-destructive">{plantingForm.errors.crop_id}</p>}
                        </div>
                        <section aria-labelledby="planting-date-label" aria-describedby={plantingForm.errors.planted_at ? 'planting-date-error' : 'planting-date-help'}>
                            <h3 id="planting-date-label" className="mb-2 text-sm font-semibold">Planting date</h3>
                            <PlantingCalendar value={plantingForm.data.planted_at} min={activeAssignment.start_date.slice(0, 10)} max={lastPlantingDate} onChange={(date) => { plantingForm.setData('planted_at', date); plantingForm.clearErrors('planted_at'); }} />
                            <p id="planting-date-help" className="mt-2 text-xs leading-5 text-muted-foreground">Selected: {dateLabel(plantingForm.data.planted_at)}. Choose a date from your assignment start through {lastPlantingDate === today ? 'today' : dateLabel(lastPlantingDate)}.</p>
                            {plantingForm.errors.planted_at && <p id="planting-date-error" role="alert" className="mt-2 text-sm text-destructive">{plantingForm.errors.planted_at}</p>}
                        </section>
                        <DialogFooter className="border-t border-border pt-4"><Button type="button" variant="outline" className="rounded-xl" disabled={plantingForm.processing} onClick={() => setPlantingOpen(false)}>Cancel</Button><Button type="submit" className="rounded-xl" disabled={plantingForm.processing}>{plantingForm.processing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sprout aria-hidden="true" />}{plantingForm.processing ? 'Saving…' : 'Add planting'}</Button></DialogFooter>
                    </form>
                </DialogContent>}
            </Dialog>
            <Dialog open={Boolean(harvestPlanting)} onOpenChange={(open) => { if (!open && !harvestForm.processing) setHarvestPlanting(null); }}>
                {harvestPlanting && <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-2xl bg-card" showCloseButton={!harvestForm.processing}>
                    <DialogHeader className="pr-6"><DialogTitle className="text-xl font-[750] tracking-[-0.025em]">Record harvest</DialogTitle><DialogDescription>{harvestPlanting.crop.name}, planted {dateLabel(harvestPlanting.planted_at)}.</DialogDescription></DialogHeader>
                    <form onSubmit={submitHarvest} className="space-y-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block space-y-1.5"><span className="text-sm font-semibold">Harvest date</span><input type="date" required className={fieldClass} min={harvestPlanting.planted_at.slice(0, 10)} max={today} value={harvestForm.data.harvested_at} aria-invalid={Boolean(harvestForm.errors.harvested_at)} onChange={(event) => harvestForm.setData('harvested_at', event.target.value)} />{harvestForm.errors.harvested_at && <span role="alert" className="block text-sm text-destructive">{harvestForm.errors.harvested_at}</span>}</label>
                            <label className="block space-y-1.5"><span className="text-sm font-semibold">Quantity (kg)</span><input type="number" required inputMode="decimal" min="0.01" max="9999.99" step="0.01" placeholder="0.00" className={cn(fieldClass, 'tabular-nums')} value={harvestForm.data.quantity_kg} aria-invalid={Boolean(harvestForm.errors.quantity_kg)} onChange={(event) => harvestForm.setData('quantity_kg', event.target.value)} />{harvestForm.errors.quantity_kg && <span role="alert" className="block text-sm text-destructive">{harvestForm.errors.quantity_kg}</span>}</label>
                        </div>
                        <label className="block space-y-1.5"><span className="text-sm font-semibold">Notes <span className="font-normal text-muted-foreground">(optional)</span></span><textarea rows={3} maxLength={500} className={cn(fieldClass, 'h-auto py-2')} placeholder="Quality, pests, or anything worth remembering" value={harvestForm.data.notes} onChange={(event) => harvestForm.setData('notes', event.target.value)} />{harvestForm.errors.notes && <span role="alert" className="block text-sm text-destructive">{harvestForm.errors.notes}</span>}</label>
                        {Boolean(harvestPlanting.harvests?.length) && <section aria-labelledby="previous-harvests-title"><h3 id="previous-harvests-title" className="mb-2 text-sm font-semibold">Previous harvests · {kgLabel(harvestTotal(harvestPlanting))}</h3><ul className="divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">{[...(harvestPlanting.harvests ?? [])].sort((a, b) => b.harvested_at.localeCompare(a.harvested_at) || b.id - a.id).map((harvest) => <li key={harvest.id} className="flex items-start justify-between gap-3 px-4 py-2.5"><div><p className="font-medium">{dateLabel(harvest.harvested_at)}</p>{harvest.notes && <p className="mt-0.5 text-xs text-muted-foreground">{harvest.notes}</p>}</div><span className="shrink-0 font-semibold tabular-nums">{kgLabel(harvest.quantity_kg)}</span></li>)}</ul></section>}
                        <DialogFooter className="border-t border-border pt-4"><Button type="button" variant="outline" className="rounded-xl" disabled={harvestForm.processing} onClick={() => setHarvestPlanting(null)}>Cancel</Button><Button type="submit" className="rounded-xl" disabled={harvestForm.processing}>{harvestForm.processing ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Carrot aria-hidden="true" />}{harvestForm.processing ? 'Saving…' : 'Record harvest'}</Button></DialogFooter>
                    </form>
                </DialogContent>}
            </Dialog>
        </AppLayout>
    );
}
