
import { InventoryItem } from "./UnitCard";
import { UnitCard } from "./UnitCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface FloorLayoutProps {
    floorName: string;
    imagePath: string;
    units: InventoryItem[];
}

export const FloorLayout = ({ floorName, imagePath, units }: FloorLayoutProps) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Sort units: numerically if possible, but they are strings like 'BT3A-GF-001'
    // A simple alphabetical sort on unit_number should be fine for now.
    const sortedUnits = [...units].sort((a, b) => a.unit_number.localeCompare(b.unit_number));

    const getStatusStyle = (status: string) => {
        if (status === 'Sold') {
            return "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900";
        }
        // Available, Reserved, etc. -> Green
        return "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900";
    };

    return (
        <Card className="mb-8 overflow-hidden border-4 border-yellow-500">
            <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="text-xl font-bold">{floorName}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {/* Layout Image */}
                <div className="mb-8 rounded-lg overflow-hidden border bg-background shadow-sm">
                    <div className="relative aspect-video w-full max-h-[500px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        {!imageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
                        <img
                            src={imagePath}
                            alt={`${floorName} Layout`}
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Units Grid */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Units</h3>
                    {sortedUnits.length === 0 ? (
                        <p className="text-muted-foreground italic">No units listed for this floor.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sortedUnits.map(unit => (
                                <UnitCard
                                    key={unit.id}
                                    unit={unit}
                                    className={getStatusStyle(unit.status)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
