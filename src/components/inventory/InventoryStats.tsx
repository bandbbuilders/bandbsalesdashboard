import { Card, CardContent } from "@/components/ui/card";
import { Building2, CheckCircle2, XCircle } from "lucide-react";
import { InventoryItem } from "./UnitCard";

interface InventoryStatsProps {
    items: InventoryItem[];
}

export const InventoryStats = ({ items }: InventoryStatsProps) => {
    const total = items.length;
    const available = items.filter(i => i.status === 'Available').length;
    const sold = items.filter(i => i.status === 'Sold').length;
    // Calculate reserved if needed, but the reference app mainly highlighted Available/Sold

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                        <Building2 className="h-8 w-8 text-blue-500 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Total Units</p>
                        <p className="text-3xl font-bold text-foreground">{total}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Available</p>
                        <p className="text-3xl font-bold text-foreground">{available}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                        <XCircle className="h-8 w-8 text-red-500 mb-2" />
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Sold</p>
                        <p className="text-3xl font-bold text-foreground">{sold}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
