import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Ruler, CheckCircle2, XCircle, Clock } from "lucide-react";

export interface InventoryItem {
    id: string;
    unit_number: string;
    floor: string;
    status: 'Available' | 'Sold' | 'Reserved';
    size: string;
    type: string;
    price?: number;
}

interface UnitCardProps {
    unit: InventoryItem;
}

export const UnitCard = ({ unit }: UnitCardProps) => {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available':
                return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
            case 'Sold':
                return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
            case 'Reserved':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Available':
                return <CheckCircle2 className="w-3 h-3 mr-1" />;
            case 'Sold':
                return <XCircle className="w-3 h-3 mr-1" />;
            case 'Reserved':
                return <Clock className="w-3 h-3 mr-1" />;
            default:
                return null;
        }
    };

    const formatPrice = (price?: number) => {
        if (!price) return 'N/A';
        if (price >= 10000000) {
            return `Rs ${(price / 10000000).toFixed(2)} Cr`;
        } else if (price >= 100000) {
            return `Rs ${(price / 100000).toFixed(2)} Lac`;
        }
        return `Rs ${price.toLocaleString()}`;
    };

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <Badge className={`px-2 py-0.5 text-xs font-medium border ${getStatusColor(unit.status)} hover:bg-transparent`}>
                        {getStatusIcon(unit.status)}
                        {unit.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">{unit.type}</span>
                </div>

                <h3 className="text-lg font-bold mb-1 text-primary">{unit.unit_number}</h3>
                <p className="text-sm text-muted-foreground mb-4">{unit.floor}</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center text-muted-foreground bg-muted/50 p-2 rounded">
                        <Ruler className="w-4 h-4 mr-2 text-primary/70" />
                        <span>{unit.size}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground bg-muted/50 p-2 rounded">
                        <Building2 className="w-4 h-4 mr-2 text-primary/70" />
                        <span className="truncate">{formatPrice(unit.price)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
