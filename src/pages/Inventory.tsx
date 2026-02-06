import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { UnitCard, InventoryItem } from "@/components/inventory/UnitCard";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Inventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    useEffect(() => {
        fetchInventory();

        // Real-time subscription
        const channel = supabase
            .channel('inventory-changes')
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

            setItems((data || []) as unknown as InventoryItem[]);
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Failed to load inventory data');
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique floors for filter
    const floors = Array.from(new Set(items.map(item => item.floor))).sort();

    // Filter items
    const filteredItems = items.filter(item => {
        const floorMatch = selectedFloor === "all" || item.floor === selectedFloor;
        const statusMatch = selectedStatus === "all" || item.status === selectedStatus;
        return floorMatch && statusMatch;
    });

    const handleClearFilters = () => {
        setSelectedFloor("all");
        setSelectedStatus("all");
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <h1 className="text-3xl font-bold">Inventory</h1>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Inventory Management
                    </h1>
                    <p className="text-muted-foreground mt-1">Real-time overview of unit availability</p>
                </div>
            </div>

            <InventoryStats items={items} />

            <InventoryFilters
                floors={floors}
                selectedFloor={selectedFloor}
                selectedStatus={selectedStatus}
                onFloorChange={setSelectedFloor}
                onStatusChange={setSelectedStatus}
                onClearFilters={handleClearFilters}
            />

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                    No units found matching your filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <UnitCard key={item.id} unit={item} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Inventory;
