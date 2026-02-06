import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AlertTriangle, DollarSign, CheckCircle } from "lucide-react";

interface Fine {
  id: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

interface PersonalFinesCardProps {
  userName: string | null;
}

export const PersonalFinesCard = ({ userName }: PersonalFinesCardProps) => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userName) return;

    const fetchFines = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('fines')
        .select('id, amount, reason, date, status')
        .eq('user_name', userName)
        .in('status', ['approved', 'paid'])
        .order('date', { ascending: false })
        .limit(10);

      setFines((data || []) as Fine[]);
      setIsLoading(false);
    };

    fetchFines();
  }, [userName]);

  const unpaidFines = fines.filter(f => f.status === 'approved');
  const paidFines = fines.filter(f => f.status === 'paid');
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = paidFines.reduce((sum, f) => sum + f.amount, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Your Fines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fines.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-500" />
            No Fines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Great job! You have no fines on record.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={totalUnpaid > 0 ? "border-orange-500/30 bg-orange-500/5" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-5 w-5 ${totalUnpaid > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            Your Fines
          </CardTitle>
          {totalUnpaid > 0 && (
            <Badge variant="destructive">Rs {totalUnpaid} Unpaid</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10 text-center">
            <p className="text-lg font-bold text-orange-600">Rs {totalUnpaid}</p>
            <p className="text-xs text-muted-foreground">Unpaid</p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10 text-center">
            <p className="text-lg font-bold text-green-600">Rs {totalPaid}</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
        </div>

        {/* Unpaid Fines List */}
        {unpaidFines.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase">Recent Unpaid</p>
            {unpaidFines.slice(0, 3).map(fine => (
              <div key={fine.id} className="flex items-center justify-between p-2 rounded-lg border bg-background">
                <div>
                  <p className="text-sm font-medium line-clamp-1">{fine.reason}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(fine.date), 'MMM dd, yyyy')}</p>
                </div>
                <span className="font-bold text-orange-600">Rs {fine.amount}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
