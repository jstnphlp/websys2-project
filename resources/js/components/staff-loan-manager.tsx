import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function StaffLoanManager() {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [actionModal, setActionModal] = useState({ open: false, type: null, loan: null });
    const [staffNotes, setStaffNotes] = useState('');
    const [returnCondition, setReturnCondition] = useState('good');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const response = await axios.get('/api/resource-loans');
            setLoans(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load loans", error);
            setLoading(false);
        }
    };

    const openActionModal = (type, loan) => {
        setActionModal({ open: true, type, loan });
        setStaffNotes('');
        setReturnCondition('good');
        setError(null);
    };

    const handleActionSubmit = async () => {
        const { type, loan } = actionModal;
        try {
            let payload = { staff_notes: staffNotes };
            
            if (type === 'return') {
                payload.return_condition = returnCondition;
            }
            
            await axios.post(`/api/resource-loans/${loan.id}/${type}`, payload);
            
            setActionModal({ open: false, type: null, loan: null });
            fetchLoans();
        } catch (error) {
            setError(error.response?.data?.message || `Failed to ${type} loan`);
        }
    };

    const getStatusColor = (status) => {
        const map = {
            'requested': 'secondary',
            'approved': 'default',
            'active': 'primary',
            'returned': 'outline',
            'overdue': 'destructive'
        };
        return map[status] || 'default';
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading loans...</div>;

    return (
        <div className="space-y-6">
            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Tool Lending Operations</CardTitle>
                    <CardDescription>Manage equipment reservations, handovers, and returns.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loans.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                            <p className="text-muted-foreground">No tool loan records found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Borrower</th>
                                        <th className="px-4 py-3 font-semibold">Tool</th>
                                        <th className="px-4 py-3 font-semibold">Dates</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map(loan => (
                                        <tr key={loan.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{loan.borrower?.name}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{loan.resource?.name}</div>
                                                <div className="text-xs text-muted-foreground">Qty: {loan.quantity}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="whitespace-nowrap">
                                                    {new Date(loan.borrow_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to {new Date(loan.borrow_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={getStatusColor(loan.status)} className="capitalize">
                                                    {loan.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                {loan.status === 'requested' && (
                                                    <Button size="sm" onClick={() => openActionModal('approve', loan)}>Approve</Button>
                                                )}
                                                {loan.status === 'approved' && (
                                                    <Button size="sm" variant="secondary" onClick={() => openActionModal('checkout', loan)}>Handover (Check Out)</Button>
                                                )}
                                                {(loan.status === 'active' || loan.status === 'overdue') && (
                                                    <Button size="sm" variant="outline" onClick={() => openActionModal('return', loan)}>Inspect & Return</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={actionModal.open} onOpenChange={(open) => setActionModal({ ...actionModal, open })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="capitalize">{actionModal.type} Loan</DialogTitle>
                        <DialogDescription>
                            Process {actionModal.type} for {actionModal.loan?.resource?.name} (Borrower: {actionModal.loan?.borrower?.name}).
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 py-4">
                        {actionModal.type === 'return' && (
                            <div className="space-y-2">
                                <Label>Inspection Condition</Label>
                                <Select value={returnCondition} onValueChange={setReturnCondition}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="excellent">Excellent</SelectItem>
                                        <SelectItem value="good">Good</SelectItem>
                                        <SelectItem value="fair">Fair (Wear and tear)</SelectItem>
                                        <SelectItem value="needs_repair">Damaged / Needs Repair</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <Label>Staff Notes (Optional)</Label>
                            <Input 
                                placeholder="E.g., verified ID, cleaned tool before return..." 
                                value={staffNotes}
                                onChange={(e) => setStaffNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setActionModal({ ...actionModal, open: false })}>Cancel</Button>
                        <Button onClick={handleActionSubmit} className="capitalize">Confirm {actionModal.type}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
