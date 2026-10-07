import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ToolCatalog() {
    const [tools, setTools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [borrowModalOpen, setBorrowModalOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState(null);
    const [borrowData, setBorrowData] = useState({
        borrow_start: new Date().toISOString().split('T')[0],
        borrow_end: '',
        quantity: 1,
        notes: ''
    });
    const [borrowError, setBorrowError] = useState(null);

    useEffect(() => {
        fetchTools();
    }, []);

    const fetchTools = async () => {
        try {
            const response = await axios.get('/api/resources');
            setTools(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load tools", error);
            setLoading(false);
        }
    };

    const handleBorrowClick = (tool) => {
        setSelectedTool(tool);
        
        // Calculate max date based on max_borrow_days
        const start = new Date(borrowData.borrow_start);
        const maxEnd = new Date(start);
        maxEnd.setDate(maxEnd.getDate() + tool.max_borrow_days);
        
        setBorrowData({
            ...borrowData,
            borrow_end: maxEnd.toISOString().split('T')[0]
        });
        
        setBorrowError(null);
        setBorrowModalOpen(true);
    };

    const submitBorrowRequest = async () => {
        try {
            await axios.post('/api/resource-loans', {
                resource_id: selectedTool.id,
                quantity: borrowData.quantity,
                borrow_start: borrowData.borrow_start,
                borrow_end: borrowData.borrow_end,
                notes: borrowData.notes
            });
            
            setBorrowModalOpen(false);
            fetchTools(); // Refresh availability
            alert('Borrow request submitted successfully!');
        } catch (error) {
            if (error.response?.data?.errors) {
                setBorrowError(Object.values(error.response.data.errors).flat().join(' '));
            } else {
                setBorrowError(error.response?.data?.message || 'Failed to submit request');
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading tool catalog...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool) => (
                    <Card key={tool.id} className="overflow-hidden border-border/50 bg-card hover:border-primary/30 transition-colors shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <Badge variant={tool.available_quantity > 0 ? "default" : "secondary"}>
                                    {tool.available_quantity > 0 ? `${tool.available_quantity} / ${tool.total_quantity} Available` : 'Checked Out'}
                                </Badge>
                                <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                                    {tool.asset_tag}
                                </span>
                            </div>
                            <CardTitle className="text-lg">{tool.name}</CardTitle>
                            <CardDescription>{tool.category}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4 text-sm text-muted-foreground">
                            <p className="line-clamp-2 min-h-[40px]">{tool.description || 'No description available.'}</p>
                            
                            <div className="mt-4 pt-4 border-t border-border/50 flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground/80">Condition</span>
                                    <span className="capitalize">{tool.condition.replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground/80">Max Borrow</span>
                                    <span>{tool.max_borrow_days} Days</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                className="w-full" 
                                disabled={tool.available_quantity === 0}
                                onClick={() => handleBorrowClick(tool)}
                            >
                                {tool.available_quantity > 0 ? 'Borrow Tool' : 'Unavailable'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {tools.length === 0 && (
                <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
                    <h3 className="text-lg font-medium mb-1">No Tools Found</h3>
                    <p className="text-muted-foreground">The resource catalog is currently empty.</p>
                </div>
            )}

            <Dialog open={borrowModalOpen} onOpenChange={setBorrowModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Borrow {selectedTool?.name}</DialogTitle>
                        <DialogDescription>
                            Submit a reservation request for this equipment. 
                            Maximum borrow duration is {selectedTool?.max_borrow_days} days.
                        </DialogDescription>
                    </DialogHeader>

                    {borrowError && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/20">
                            {borrowError}
                        </div>
                    )}

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Pickup Date</Label>
                                <Input 
                                    type="date" 
                                    min={new Date().toISOString().split('T')[0]}
                                    value={borrowData.borrow_start} 
                                    onChange={(e) => setBorrowData({...borrowData, borrow_start: e.target.value})} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Return By Date</Label>
                                <Input 
                                    type="date" 
                                    min={borrowData.borrow_start}
                                    value={borrowData.borrow_end} 
                                    onChange={(e) => setBorrowData({...borrowData, borrow_end: e.target.value})} 
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Quantity Needed</Label>
                            <Input 
                                type="number" 
                                min="1" 
                                max={selectedTool?.available_quantity || 1}
                                value={borrowData.quantity} 
                                onChange={(e) => setBorrowData({...borrowData, quantity: parseInt(e.target.value)})} 
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum {selectedTool?.available_quantity} available.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Notes for Staff (Optional)</Label>
                            <Input 
                                placeholder="E.g., Need it to till plot B-04..." 
                                value={borrowData.notes}
                                onChange={(e) => setBorrowData({...borrowData, notes: e.target.value})}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBorrowModalOpen(false)}>Cancel</Button>
                        <Button onClick={submitBorrowRequest}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
