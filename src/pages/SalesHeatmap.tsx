
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InventoryItem } from "@/components/inventory/UnitCard";
import { HeatmapGrid } from "@/components/analytics/HeatmapGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertCircle, BarChart3, CheckCircle2, CircleDollarSign } from "lucide-react";

const SalesHeatmap = () => {
    const [units, setUnits] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchInventory();

        const channel = supabase
            .channel('heatmap-inventory-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory' },
                () => {
                    fetchInventory();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchInventory = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory' as any)
                .select('*')
                .order('unit_number', { ascending: true });

            if (error) throw error;
            setUnits((data || []) as unknown as InventoryItem[]);
        } catch (error) {
            console.error('Error fetching inventory for heatmap:', error);
            toast.error('Failed to load heatmap data');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Summary Stats
    const stats = useMemo(() => {
        const total = units.length;
        const sold = units.filter(u => u.status === 'Sold').length;
        const reserved = units.filter(u => ['Reserved', 'Booked', 'Token'].includes(u.status)).length;
        const available = units.filter(u => u.status === 'Available').length;
        const soldPercentage = total > 0 ? Math.round((sold / total) * 100) : 0;

        return { total, sold, reserved, available, soldPercentage };
    }, [units]);

    // Group units by Floor
    const floorGroups = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};
        units.forEach(unit => {
            if (!groups[unit.floor]) {
                groups[unit.floor] = [];
            }
            groups[unit.floor].push(unit);
        });

        // Define explicit floor order if needed, otherwise alphanumeric sort
        const orderedFloors = Object.keys(groups).sort((a, b) => {
            // Custom sort logic for floors can go here (e.g., Basement first, then Ground, then 1st...)
            const order = ["Lower Ground", "Ground Floor", "First Floor", "Second Floor", "Third Floor", "Fourth Floor", "Fifth Floor"];
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        return orderedFloors.map(floor => ({
            name: floor,
            units: groups[floor]
        }));
    }, [units]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <Skeleton className="h-12 w-1/3" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6 animate-fade-in pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Sales Heatmap
                    </h1>
                    <p className="text-muted-foreground mt-1">Real-time availability visualization</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sold</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.sold}</div>
                        <p className="text-xs text-muted-foreground">{stats.soldPercentage}% of project sold</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Reserved</CardTitle>
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">{stats.reserved}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <CircleDollarSign className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{stats.available}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-6">
                {floorGroups.map(group => (
                    <HeatmapGrid
                        key={group.name}
                        floorName={group.name}
                        units={group.units}
                    />
                ))}
            </div>
        </div>
    );
};

export default SalesHeatmap;
