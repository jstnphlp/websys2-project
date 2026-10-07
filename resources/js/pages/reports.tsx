import { Head, useForm } from '@inertiajs/react';
import { Carrot, CalendarDays, ClipboardList, Download, Map, Sprout, UsersRound, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, fieldClass } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type ReportFilters = { from: string; to: string };
type BreakdownRow = { status: string; total: number };
type HarvestRow = { crop: string; harvests: number; total_kg: number };

const reportMetrics = [
    { key: 'totalPlots', label: 'Total plots', icon: Map },
    { key: 'occupiedPlots', label: 'Occupied plots', icon: Sprout },
    { key: 'pendingRequests', label: 'Pending requests', icon: ClipboardList },
    { key: 'activeAssignments', label: 'Active assignments', icon: Sprout },
    { key: 'activeMembers', label: 'Active members', icon: UsersRound },
] as const;

export default function Reports({ filters, metrics, requestBreakdown, assignmentBreakdown, harvestBreakdown }: {
    filters: ReportFilters;
    metrics: Record<string, number>;
    requestBreakdown: BreakdownRow[];
    assignmentBreakdown: BreakdownRow[];
    harvestBreakdown: HarvestRow[];
}) {
    const form = useForm({ ...filters });

    const exportQuery = new URLSearchParams(filters).toString();

    return (
        <>
            <Head title="Reports" />
            <AppLayout
                title="Reports"
                description="Review current garden totals and activity within a date range."
                actions={(
                    <Button asChild className="w-full rounded-xl sm:w-auto">
                        <a href={`/reports/export?${exportQuery}`}><Download aria-hidden="true" />Export CSV</a>
                    </Button>
                )}
            >
                <div className="space-y-8 pb-9">
                    <section aria-labelledby="reporting-period-title">
                        <h2 id="reporting-period-title" className="sr-only">Reporting period</h2>
                        <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(64,79,29,0.05)] sm:p-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-start gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><CalendarDays className="size-5" aria-hidden="true" /></span>
                                <div>
                                    <h3 className="text-sm font-bold">Date range</h3>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">Filters the activity breakdowns and CSV export.</p>
                                </div>
                            </div>
                            <form onSubmit={event => { event.preventDefault(); form.get('/reports', { preserveState: true, preserveScroll: true }); }} className="grid w-full min-w-0 items-end gap-3 sm:grid-cols-3 xl:w-auto xl:shrink-0">
                                <label className="block min-w-0 space-y-1.5">
                                    <span className="text-xs font-semibold text-muted-foreground">From date</span>
                                    <input type="date" className={cn(fieldClass, 'min-w-0 rounded-xl')} value={form.data.from} onChange={event => form.setData('from', event.target.value)} />
                                    {form.errors.from && <span role="alert" className="block text-xs text-destructive">{form.errors.from}</span>}
                                </label>
                                <label className="block min-w-0 space-y-1.5">
                                    <span className="text-xs font-semibold text-muted-foreground">To date</span>
                                    <input type="date" className={cn(fieldClass, 'min-w-0 rounded-xl')} value={form.data.to} onChange={event => form.setData('to', event.target.value)} />
                                    {form.errors.to && <span role="alert" className="block text-xs text-destructive">{form.errors.to}</span>}
                                </label>
                                <Button disabled={form.processing}>{form.processing ? 'Applying…' : 'Apply dates'}</Button>
                            </form>
                        </div>
                    </section>

                    <section aria-labelledby="garden-snapshot-title">
                        <h2 id="garden-snapshot-title" className="sr-only">Garden snapshot</h2>
                        <p className="mb-[18px] text-sm leading-5 text-muted-foreground">Current counts across the garden, independent of the reporting period.</p>
                        <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_1px_3px_rgba(64,79,29,0.05)] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {reportMetrics.map(({ key, label, icon: Icon }) => (
                                <div key={key} className="bg-card p-5 sm:p-6">
                                    <dt className="flex items-center gap-3 text-sm font-semibold">
                                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                                        {label}
                                    </dt>
                                    <dd className="mt-4 text-3xl font-[750] tracking-[-0.025em] tabular-nums">{metrics[key]}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <div className="grid items-start gap-8 lg:grid-cols-2">
                        <Breakdown id="request-breakdown-title" title="Requests in period" rows={requestBreakdown} icon={ClipboardList} emptyLabel="No plot requests in this period" />
                        <Breakdown id="assignment-breakdown-title" title="Assignments in period" rows={assignmentBreakdown} icon={Sprout} emptyLabel="No assignments in this period" />
                    </div>

                    <HarvestBreakdown rows={harvestBreakdown} />
                </div>
            </AppLayout>
        </>
    );
}

function Breakdown({ id, title, rows, icon: Icon, emptyLabel }: {
    id: string;
    title: string;
    rows: BreakdownRow[];
    icon: LucideIcon;
    emptyLabel: string;
}) {
    const total = rows.reduce((sum, row) => sum + row.total, 0);

    return (
        <section aria-labelledby={id}>
            <h2 id={id} className="sr-only">{title}</h2>
            <p className="mb-[18px] text-sm leading-5 text-muted-foreground">Created within the selected date range, grouped by current status.</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]">
                {rows.length ? (
                    <>
                        <Table aria-labelledby={id}>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-5 sm:px-6" scope="col">Status</TableHead>
                                    <TableHead className="px-5 text-right sm:px-6" scope="col">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.status}>
                                        <TableCell className="px-5 sm:px-6"><StatusBadge value={row.status} /></TableCell>
                                        <TableCell className="px-5 text-right font-bold tabular-nums sm:px-6">{row.total}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-between gap-3 border-t border-border bg-primary/[0.035] px-5 py-4 text-sm font-semibold sm:px-6">
                            <span>Total in period</span>
                            <span className="tabular-nums">{total}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-start gap-3 p-5 sm:p-6">
                        <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-semibold">{emptyLabel}</p>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">Choose another date range to review activity.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function HarvestBreakdown({ rows }: { rows: HarvestRow[] }) {
    const totalKg = rows.reduce((sum, row) => sum + row.total_kg, 0);
    const kg = (value: number) => `${value.toLocaleString('en-PH', { maximumFractionDigits: 2 })} kg`;

    return (
        <section aria-labelledby="harvest-breakdown-title">
            <h2 id="harvest-breakdown-title" className="sr-only">Harvests in period</h2>
            <p className="mb-[18px] text-sm leading-5 text-muted-foreground">Harvests members recorded within the selected date range, grouped by crop.</p>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]">
                {rows.length ? (
                    <>
                        <Table aria-labelledby="harvest-breakdown-title">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-5 sm:px-6" scope="col">Crop</TableHead>
                                    <TableHead className="text-right" scope="col">Harvests</TableHead>
                                    <TableHead className="px-5 text-right sm:px-6" scope="col">Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row) => (
                                    <TableRow key={row.crop}>
                                        <TableCell className="px-5 font-semibold sm:px-6">{row.crop}</TableCell>
                                        <TableCell className="text-right tabular-nums">{row.harvests}</TableCell>
                                        <TableCell className="px-5 text-right font-bold tabular-nums sm:px-6">{kg(row.total_kg)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <div className="flex items-center justify-between gap-3 border-t border-border bg-primary/[0.035] px-5 py-4 text-sm font-semibold sm:px-6">
                            <span>Total harvested in period</span>
                            <span className="tabular-nums">{kg(totalKg)}</span>
                        </div>
                    </>
                ) : (
                    <div className="flex items-start gap-3 p-5 sm:p-6">
                        <Carrot className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-semibold">No harvests recorded in this period</p>
                            <p className="mt-1 text-sm leading-5 text-muted-foreground">Members record harvests from their assignment page.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
