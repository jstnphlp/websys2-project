import { Head, usePage } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { ToolCatalog } from '@/components/tool-catalog';
import { StaffLoanManager } from '@/components/staff-loan-manager';
import { AdminToolAnalytics } from '@/components/admin-tool-analytics';
import type { SharedPageProps } from '@/types';

export default function ToolsIndex() {
    const { auth } = usePage<SharedPageProps>().props;
    const role = auth.user!.role;

    return (
        <>
            <Head title="Community Tool Shed" />
            <AppLayout
                title="Community Tool Shed"
                description="Borrow, manage, and analyze garden equipment."
            >
                <div className="space-y-12 pb-12">
                    {role === 'admin' && <AdminToolAnalytics />}
                    {role === 'staff' && (
                        <div className="space-y-12">
                            <StaffLoanManager />
                            <div>
                                <h2 className="text-xl font-bold mb-4">Available Equipment</h2>
                                <ToolCatalog />
                            </div>
                        </div>
                    )}
                    {role === 'member' && (
                        <div>
                            <h2 className="text-xl font-bold mb-4">Available Equipment</h2>
                            <ToolCatalog />
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
