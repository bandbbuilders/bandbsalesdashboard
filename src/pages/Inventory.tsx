import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InventoryStats } from "@/components/inventory/InventoryStats";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventoryItem } from "@/components/inventory/UnitCard";
import { FloorLayout } from "@/components/inventory/FloorLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { sortInventoryItems } from "@/utils/inventory-sort";

const Inventory = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFloor, setSelectedFloor] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    useEffect(() => {
        fetchInventory();

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

    // Derived floors
    const floors = useMemo(() => Array.from(new Set(items.map(item => item.floor))).sort(), [items]);

    // Derived filtered items
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const floorMatch = selectedFloor === "all" || item.floor === selectedFloor;
            const statusMatch = selectedStatus === "all" || item.status === selectedStatus;
            return floorMatch && statusMatch;
        });
    }, [items, selectedFloor, selectedStatus]);

    const handleClearFilters = () => {
        setSelectedFloor("all");
        setSelectedStatus("all");
    };

    // Specific Floor Definition
    const FLOOR_CONFIG = [
        { name: "Lower Ground", image: "/images/layouts/lower_ground.jpeg" },
        { name: "Ground Floor", image: "/images/layouts/ground_floor.jpeg" },
        { name: "First Floor", image: "/images/layouts/apartment_floor.png" },
        { name: "Second Floor", image: "/images/layouts/apartment_floor.png" },
        { name: "Third Floor", image: "/images/layouts/apartment_floor.png" },
        { name: "Fourth Floor", image: "/images/layouts/apartment_floor.png" },
        { name: "Fifth Floor", image: "/images/layouts/apartment_floor.png" },
    ];

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
                <div className="space-y-8">
                    {/* Render predefined floors in strict order */}
                    {FLOOR_CONFIG
                        .filter(f => selectedFloor === "all" || f.name === selectedFloor)
                        .map(floorConfig => {
                            const floorUnits = filteredItems.filter(item => item.floor === floorConfig.name);
                            if (floorUnits.length === 0 && selectedFloor === "all") return null;
                            if (floorUnits.length === 0 && selectedFloor !== floorConfig.name) return null;

                            // Sort units within the floor using helper
                            const sortedUnits = sortInventoryItems(floorUnits);

                            return (
                                <FloorLayout
                                    key={floorConfig.name}
                                    floorName={floorConfig.name}
                                    imagePath={floorConfig.image}
                                    units={sortedUnits}
                                />
                            );
                        })
                    }

                    {/* Render any remaining floors (if any exist not in config) */}
                    {Array.from(new Set(filteredItems.map(i => i.floor)))
                        .filter(f => !FLOOR_CONFIG.some(config => config.name === f))
                        .map(floorName => {
                            const floorUnits = filteredItems.filter(item => item.floor === floorName);
                            const sortedUnits = sortInventoryItems(floorUnits);
                            return (
                                <FloorLayout
                                    key={floorName}
                                    floorName={floorName}
                                    imagePath="/images/placeholder.svg"
                                    units={sortedUnits}
                                />
                            );
                        })
                    }
                </div>
            )}
        </div>
    );
};

export default Inventory;
