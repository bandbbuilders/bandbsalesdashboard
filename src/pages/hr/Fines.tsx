import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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


  const userStats = useMemo(() => {
    const stats: Record<string, { name: string; totalCount: number; totalAmount: number; unpaidAmount: number }> = {};

    fines.forEach(fine => {
      if (!stats[fine.user_name]) {
        stats[fine.user_name] = { name: fine.user_name, totalCount: 0, totalAmount: 0, unpaidAmount: 0 };
      }
      stats[fine.user_name].totalCount++;
      stats[fine.user_name].totalAmount += fine.amount;
      if (fine.status === 'approved' || fine.status === 'pending') {
        stats[fine.user_name].unpaidAmount += fine.amount;
      }
    });

    return Object.values(stats).sort((a, b) => b.unpaidAmount - a.unpaidAmount);
  }, [fines]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fines Approval & Summary</h1>
          <p className="text-muted-foreground">Manage and track employee fines.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approvals
            {pendingFines.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {pendingFines.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="summary">User Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : pendingFines.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">No fines pending approval.</div>
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
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Fines Summary by User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No fines data available.</p>
                ) : (
                  userStats.map(stat => (
                    <div key={stat.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-bold text-lg">{stat.name}</p>
                        <p className="text-sm text-muted-foreground">{stat.totalCount} total fines</p>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          <span className="text-sm text-muted-foreground mr-2">Total Amount:</span>
                          <span className="font-medium">Rs {stat.totalAmount}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground mr-2">Unpaid:</span>
                          <Badge variant={stat.unpaidAmount > 0 ? "destructive" : "secondary"}>
                            Rs {stat.unpaidAmount}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HrFines;
