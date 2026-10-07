import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, CircleCheck, ClipboardList, Clock3, Map, MapPin, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StaffLoanManager } from '@/components/staff-loan-manager';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

export type OperationsDashboardProps = {
    metrics: Record<string, number>;
    requests: Array<{
        id: number;
        created_at: string;
        user: { name: string };
        garden_plot: { plot_code: string; location: string } | null;
    }>;
};

const gardenMetrics = [
    { key: 'plots', label: 'Garden plots', icon: Map },
    { key: 'available', label: 'Available plots', icon: Sprout },
    { key: 'pending', label: 'Pending requests', icon: ClipboardList },
    { key: 'assignments', label: 'Active assignments', icon: Sprout },
] as const;

function dateLabel(value: string) {
    return new Date(value).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function OperationsDashboard({ metrics, requests }: OperationsDashboardProps) {
    const { auth } = usePage<SharedPageProps>().props;
    const firstName = auth.user?.name.trim().split(/\s+/)[0] || 'there';

    return (
        <>
            <Head title="Staff dashboard" />
            <AppLayout
                title={`Welcome, ${firstName}.`}
                description="Review requests and coordinate garden operations."
                actions={(
                    <Button asChild className="w-full rounded-xl sm:w-auto">
                        <Link href="/plot-requests"><ClipboardList aria-hidden="true" />Review requests</Link>
                    </Button>
                )}
            >
                <div className="space-y-8 pb-9">
                    <section aria-labelledby="garden-overview-title">
                        <h2 id="garden-overview-title" className="sr-only">Garden overview</h2>
                        <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_1px_3px_rgba(64,79,29,0.05)] sm:grid-cols-2 xl:grid-cols-4">
                            {gardenMetrics.map(({ key, label, icon: Icon }) => (
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

                    <section aria-labelledby="pending-requests-title">
                        <h2 id="pending-requests-title" className="sr-only">Pending requests</h2>
                        {requests.length > 0 && <p className="mb-[18px] flex items-center justify-end gap-1.5 text-xs font-semibold text-muted-foreground"><Clock3 className="size-3.5" aria-hidden="true" />Oldest first</p>}
                        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(64,79,29,0.05)]">
                            {requests.length ? (
                                <>
                                    <Table aria-labelledby="pending-requests-title">
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead scope="col">Member</TableHead>
                                                <TableHead scope="col">Garden plot</TableHead>
                                                <TableHead scope="col">Submitted</TableHead>
                                                <TableHead className="text-right" scope="col">Review</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {requests.map((request) => (
                                                <TableRow key={request.id}>
                                                    <TableCell className="min-w-40">
                                                        <p className="font-bold">{request.user.name}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">Request #{request.id}</p>
                                                    </TableCell>
                                                    <TableCell className="min-w-40">
                                                        <p className="font-bold">{request.garden_plot ? `Plot ${request.garden_plot.plot_code}` : 'Plot not selected'}</p>
                                                        {request.garden_plot && <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{request.garden_plot.location}</p>}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-muted-foreground">{dateLabel(request.created_at)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button asChild variant="outline" size="sm" className="rounded-xl">
                                                            <Link href="/plot-requests" aria-label={`Review plot request #${request.id} from ${request.user.name}`}>Review<ArrowRight aria-hidden="true" /></Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    <div className="flex flex-col gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                        <p className="text-sm text-muted-foreground">Showing {requests.length} of {metrics.pending} pending requests.</p>
                                        <Button asChild variant="outline" size="sm" className="w-full rounded-xl sm:w-auto">
                                            <Link href="/plot-requests">View all requests<ArrowRight aria-hidden="true" /></Link>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-start gap-3 p-5 sm:p-6">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/[0.08] text-primary"><CircleCheck className="size-5" aria-hidden="true" /></span>
                                    <div>
                                        <p className="text-sm font-semibold">No pending requests</p>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">New plot requests will appear here when members submit them.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="pt-6" aria-labelledby="loans-title">
                        <h2 id="loans-title" className="sr-only">Tool loans</h2>
                        <StaffLoanManager />
                    </section>
                </div>
            </AppLayout>
        </>
    );
}
