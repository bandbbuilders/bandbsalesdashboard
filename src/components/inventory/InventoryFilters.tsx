import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InventoryFiltersProps {
    floors: string[];
    selectedFloor: string;
    selectedStatus: string;
    onFloorChange: (floor: string) => void;
    onStatusChange: (status: string) => void;
    onClearFilters: () => void;
}

export const InventoryFilters = ({
    floors,
    selectedFloor,
    selectedStatus,
    onFloorChange,
    onStatusChange,
    onClearFilters
}: InventoryFiltersProps) => {
    return (
        <div className="flex flex-wrap gap-3 items-center bg-card p-4 rounded-lg border mb-6">
            <div className="flex-1 min-w-[200px]">
                <Select value={selectedFloor} onValueChange={onFloorChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Floor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Floors</SelectItem>
                        {floors.map(floor => (
                            <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Sold">Sold</SelectItem>
                        <SelectItem value="Reserved">Reserved</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(selectedFloor !== 'all' || selectedStatus !== 'all') && (
                <Button variant="ghost" onClick={onClearFilters} size="icon">
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
};
