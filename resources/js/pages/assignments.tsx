import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { MemberAssignmentsWorkspace, type AssignmentCrop, type MemberAssignment } from '@/components/member-assignments-workspace';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Empty, Field, FormDialog, Pagination, PlotMarker, StatusBadge, Toolbar, WorkspacePanel, WorkspaceStatusTabs, fieldClass, type Paginated } from '@/components/workspace-ui';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedPageProps } from '@/types';

type Item = MemberAssignment & { user: { name: string } };
type Choice = { id: number; name?: string; plot_code?: string };
const statusOptions = [
    { value: '', label: 'All assignments' },
    { value: 'active', label: 'Active' },
    { value: 'ended', label: 'Ended' },
    { value: 'cancelled', label: 'Cancelled' },
];

function dateLabel(value: string) {
    return new Date(value.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Assignments({ assignments, members, availablePlots, crops, filters, activeAssignment, today }: {
    assignments: Paginated<Item>;
    members: Choice[];
    availablePlots: Choice[];
    crops: AssignmentCrop[];
    filters: { search?: string; status?: string };
    activeAssignment: MemberAssignment | null;
    today: string;
}) {
    const role = usePage<SharedPageProps>().props.auth.user!.role;
    const [mode, setMode] = useState<'new' | 'edit' | 'close' | null>(null);
    const [selected, setSelected] = useState<Item | null>(null);
    const form = useForm({ user_id: '', garden_plot_id: '', start_date: new Date().toISOString().slice(0, 10), end_date: '', status: 'ended' });

    function open(nextMode: 'new' | 'edit' | 'close', item?: Item) {
        setSelected(item ?? null);
        form.clearErrors();
        form.setData({
            user_id: '', garden_plot_id: '',
            start_date: item?.start_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
            end_date: nextMode === 'close' ? new Date().toISOString().slice(0, 10) : item?.end_date?.slice(0, 10) ?? '',
            status: 'ended',
        });
        setMode(nextMode);
    }

    function submit() {
        const options = { preserveScroll: true, onSuccess: () => setMode(null) };
        if (mode === 'new') form.post('/assignments', options);
        else if (mode === 'edit' && selected) form.put('/assignments/' + selected.id, options);
        else if (mode === 'close' && selected) form.post('/assignments/' + selected.id + '/close', options);
    }

    if (role === 'member') {
        return <><Head title="My assignments" /><MemberAssignmentsWorkspace assignments={assignments} activeAssignment={activeAssignment} crops={crops} filters={filters} today={today} /></>;
    }

    return <>
        <Head title="Assignments" />
        <AppLayout title="Assignments" description="Track active and historical garden plot assignments." actions={<Toolbar path="/assignments" search={filters.search} actionLabel="New assignment" onAction={() => open('new')} />}>
            <section aria-label="Assignment records" className="pb-9">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <WorkspaceStatusTabs value={filters.status ?? ''} options={statusOptions} onChange={(status) => router.get('/assignments', { ...filters, status }, { preserveState: true, preserveScroll: true, replace: true })} label="Filter assignments by status" />
                    <p className="text-xs tabular-nums text-muted-foreground">{assignments.total} {assignments.total === 1 ? 'assignment' : 'assignments'}</p>
                </div>
                {assignments.data.length === 0 ? <Empty message="No assignments match this view." /> : (
                    <WorkspacePanel className="bg-[#fbf8f2] shadow-none">
                        <Table className="[&_th]:h-10 [&_th]:text-[10px]">
                            <TableHeader className="bg-card/80"><TableRow className="hover:bg-transparent"><TableHead className="px-5 sm:px-6">Member</TableHead><TableHead>Garden plot</TableHead><TableHead>Started</TableHead><TableHead>End date</TableHead><TableHead>Status</TableHead><TableHead>Harvested</TableHead><TableHead className="px-5 text-right sm:px-6">Manage</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {assignments.data.map((item) => (
                                    <TableRow key={item.id} className="border-border/60 hover:bg-primary/[0.032]">
                                        <TableCell className="min-w-40 px-5 sm:px-6"><p className="font-semibold">{item.user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">Assignment #{item.id}</p></TableCell>
                                        <TableCell className="min-w-48"><div className="flex items-center gap-3"><PlotMarker code={item.garden_plot.plot_code} /><div><p className="font-semibold">Plot {item.garden_plot.plot_code}</p><p className="mt-0.5 text-xs text-muted-foreground">{item.garden_plot.location}</p></div></div></TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{dateLabel(item.start_date)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{item.end_date ? dateLabel(item.end_date) : 'Ongoing'}</TableCell>
                                        <TableCell className="whitespace-nowrap"><StatusBadge value={item.status} /></TableCell>
                                        <TableCell className="whitespace-nowrap text-xs tabular-nums">{Number(item.harvests_sum_quantity_kg ?? 0) > 0 ? <span className="font-semibold">{Number(item.harvests_sum_quantity_kg).toLocaleString('en-PH', { maximumFractionDigits: 2 })} kg</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                                        <TableCell className="px-5 text-right sm:px-6"><div className="flex justify-end gap-2">{item.status === 'active' ? <><Button size="sm" variant="outline" className="rounded-[10px]" onClick={() => open('edit', item)}>Edit dates</Button><Button size="sm" variant="outline" className="rounded-[10px]" onClick={() => open('close', item)}>Close</Button></> : <span className="text-xs text-muted-foreground">Closed</span>}</div></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Pagination page={assignments} />
                    </WorkspacePanel>
                )}
            </section>
        </AppLayout>
        <FormDialog
            open={mode !== null} onOpenChange={(value) => !value && setMode(null)}
            title={mode === 'new' ? 'Create assignment' : mode === 'edit' ? 'Edit assignment dates' : 'Close assignment'}
            description={mode === 'new' ? 'Assign an available plot directly to a member.' : mode === 'edit' ? 'Adjust the assignment period.' : 'End or cancel this assignment and release its plot.'}
            submitLabel={mode === 'new' ? 'Create assignment' : mode === 'edit' ? 'Save dates' : 'Close assignment'}
            processing={form.processing} onSubmit={submit}
        >
            {selected && <div className="flex items-center gap-3 rounded-xl bg-primary/[0.045] p-4"><PlotMarker code={selected.garden_plot.plot_code} /><div><p className="text-sm font-semibold">Plot {selected.garden_plot.plot_code}</p><p className="mt-0.5 text-xs text-muted-foreground">{selected.user.name} · {selected.garden_plot.location}</p></div></div>}
            {mode === 'new' && <>
                <Field label="Member" error={form.errors.user_id}><select className={fieldClass} value={form.data.user_id} onChange={(event) => form.setData('user_id', event.target.value)}><option value="">Select member</option>{members.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field label="Plot" error={form.errors.garden_plot_id}><select className={fieldClass} value={form.data.garden_plot_id} onChange={(event) => form.setData('garden_plot_id', event.target.value)}><option value="">Select plot</option>{availablePlots.map((item) => <option key={item.id} value={item.id}>{item.plot_code}</option>)}</select></Field>
            </>}
            <div className={mode !== 'close' ? 'grid gap-4 sm:grid-cols-2' : undefined}>
                {mode !== 'close' && <Field label="Start date" error={form.errors.start_date}><input type="date" className={fieldClass} value={form.data.start_date} onChange={(event) => form.setData('start_date', event.target.value)} /></Field>}
                <Field label="End date" error={form.errors.end_date}><input type="date" className={fieldClass} value={form.data.end_date} onChange={(event) => form.setData('end_date', event.target.value)} /></Field>
            </div>
            {mode === 'close' && <Field label="Outcome"><select className={fieldClass} value={form.data.status} onChange={(event) => form.setData('status', event.target.value)}><option value="ended">Ended</option><option value="cancelled">Cancelled</option></select></Field>}
        </FormDialog>
    </>;
}
