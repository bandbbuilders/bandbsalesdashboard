
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { InventoryItem } from "@/components/inventory/UnitCard";

interface HeatmapGridProps {
    floorName: string;
    units: InventoryItem[];
}

export const HeatmapGrid = ({ floorName, units }: HeatmapGridProps) => {
    // Sort units numerically/alphabetically
    const sortedUnits = [...units].sort((a, b) => a.unit_number.localeCompare(b.unit_number));

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'sold':
                return "bg-red-500 hover:bg-red-600 text-white border-red-600";
            case 'reserved':
            case 'booked':
                return "bg-amber-400 hover:bg-amber-500 text-black border-amber-500"; // Yellow/Amber for warning/reserved
            case 'available':
            default:
                return "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600";
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <Card className="mb-6 shadow-sm border-muted">
            <CardHeader className="py-3 px-4 bg-muted/30">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{floorName}</CardTitle>
                    <div className="flex gap-2 text-xs">
                        <span className="text-emerald-600 font-medium">{units.filter(u => u.status === 'Available').length} Avail</span>
                        <span className="text-red-600 font-medium">{units.filter(u => u.status === 'Sold').length} Sold</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                {units.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No units configured for this floor.</p>
                ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {sortedUnits.map((unit) => (
                            <TooltipProvider key={unit.id}>
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className={`
                        h-12 w-full rounded-md flex items-center justify-center 
                        text-xs font-bold cursor-pointer transition-all duration-200 
                        shadow-sm border
                        ${getStatusColor(unit.status)}
                      `}
                                        >
                                            {unit.unit_number.split('-').pop()} {/* Show only the last part e.g. 001 from BT3A-GF-001 */}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="p-3 max-w-[200px]">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm">{unit.unit_number}</p>
                                            <Badge variant="outline" className="text-xs w-full justify-center capitalize">
                                                {unit.status}
                                            </Badge>
                                            <div className="text-xs pt-1 border-t mt-1">
                                                <p className="flex justify-between"><span>Floor:</span> <span className="font-mono">{unit.floor}</span></p>
                                                <p className="flex justify-between"><span>Price:</span> <span className="font-mono">{formatPrice(unit.price)}</span></p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
