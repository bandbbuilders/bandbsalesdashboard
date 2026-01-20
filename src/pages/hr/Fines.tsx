import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

interface Fine {
  id: string;
  user_name: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
  approved_by?: string | null;
  approved_at?: string | null;
}

const HrFines = () => {
  const { toast } = useToast();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFines = async () => {
    setLoading(true);
    // Fetch ALL fines (including pending ones from attendance and tasks)
    const { data, error } = await supabase
      .from("fines")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching fines:", error);
      toast({ title: "Error", description: "Failed to load fines", variant: "destructive" });
      setLoading(false);
      return;
    }

    console.log("HR Fines fetched:", data?.length, data);
    setFines((data || []) as Fine[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchFines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingFines = useMemo(
    () => fines.filter((f) => f.status === "pending"),
    [fines]
  );

  const handleApprove = async (fine: Fine) => {
    const { data: { session } } = await supabase.auth.getSession();
    const approverName = session?.user?.email || "HR Admin";

    const { error } = await supabase
      .from("fines")
      .update({
        status: "approved",
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq("id", fine.id);

    if (error) {
      toast({ title: "Error", description: "Failed to approve fine", variant: "destructive" });
      return;
    }

    toast({ title: "Fine Approved", description: `Rs ${fine.amount} fine approved for ${fine.user_name}.` });
    fetchFines();
  };

  const handleReject = async (fine: Fine) => {
    const { error } = await supabase.from("fines").update({ status: "rejected" }).eq("id", fine.id);

    if (error) {
      toast({ title: "Error", description: "Failed to reject fine", variant: "destructive" });
      return;
    }

    toast({ title: "Fine Rejected", description: `Fine rejected for ${fine.user_name}.` });
    fetchFines();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fines Approval</h1>
          <p className="text-muted-foreground">Approve task fines and late fines before they appear in Accounting & user dashboards.</p>
        </div>
        <Badge variant={pendingFines.length > 0 ? "destructive" : "secondary"}>
          {pendingFines.length} pending
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Pending Approval
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : pendingFines.length === 0 ? (
            <div className="text-muted-foreground">No fines pending approval.</div>
          ) : (
            <div className="space-y-3">
              {pendingFines.map((fine) => (
                <div key={fine.id} className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{fine.user_name}</p>
                      <Badge variant="outline">Rs {fine.amount}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{fine.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(fine.date), "MMM dd, yyyy")}</p>
                  </div>

                  <div className="flex gap-2 md:justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleReject(fine)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button size="sm" onClick={() => handleApprove(fine)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HrFines;
