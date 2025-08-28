import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Calendar,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { useLedgerEntries } from "@/hooks/useLedgerEntries";
import { useSales } from "@/hooks/useSales";
import { useToast } from "@/hooks/use-toast";

const PaymentLedger = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { ledgerEntries, loading, refetch, updateLedgerEntry, deleteLedgerEntry } = useLedgerEntries();
  const { sales } = useSales();
  
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const sale = sales.find(s => s.id === saleId);
  const saleEntries = ledgerEntries.filter(entry => entry.sale_id === saleId);

  const formatCurrency = (amount: number) => {
    return `PKR ${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-success text-success-foreground";
      case "pending": return "bg-warning text-warning-foreground";
      case "overdue": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry || !editAmount) return;

    const newAmount = parseFloat(editAmount);
    const originalAmount = editingEntry.amount;
    
    if (newAmount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (newAmount < originalAmount) {
      // Redistribute remaining amount to other installment entries
      const difference = originalAmount - newAmount;
      const installmentEntries = saleEntries.filter(entry => 
        entry.entry_type === 'installment' && 
        entry.id !== editingEntry.id &&
        entry.status === 'pending'
      );

      if (installmentEntries.length > 0) {
        const amountPerEntry = difference / installmentEntries.length;
        
        // Update all other installment entries
        for (const entry of installmentEntries) {
          await updateLedgerEntry(entry.id, {
            amount: entry.amount + amountPerEntry
          });
        }
      }
    }

    // Update the current entry
    await updateLedgerEntry(editingEntry.id, {
      amount: newAmount
    });

    setEditingEntry(null);
    setEditAmount("");
    refetch();
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;

    const entryToDeleteObj = saleEntries.find(e => e.id === entryToDelete);
    if (!entryToDeleteObj) return;

    // Redistribute amount to remaining installment entries
    if (entryToDeleteObj.entry_type === 'installment') {
      const remainingInstallments = saleEntries.filter(entry => 
        entry.entry_type === 'installment' && 
        entry.id !== entryToDelete &&
        entry.status === 'pending'
      );

      if (remainingInstallments.length > 0) {
        const amountPerEntry = entryToDeleteObj.amount / remainingInstallments.length;
        
        for (const entry of remainingInstallments) {
          await updateLedgerEntry(entry.id, {
            amount: entry.amount + amountPerEntry
          });
        }
      }
    }

    await deleteLedgerEntry(entryToDelete);
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
    refetch();
  };

  const handleStatusChange = async (entryId: string, newStatus: 'paid' | 'overdue') => {
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0];
      updateData.paid_amount = saleEntries.find(e => e.id === entryId)?.amount || 0;
    } else {
      updateData.paid_date = null;
      updateData.paid_amount = 0;
    }

    await updateLedgerEntry(entryId, updateData);
    refetch();
    
    toast({
      title: "Success",
      description: `Payment marked as ${newStatus}`,
    });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!sale) {
    return <div>Sale not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Payment Ledger</h1>
          <p className="text-muted-foreground">
            {sale.customer.name} - Unit {sale.unit_number}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(sale.unit_total_price)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(
                saleEntries
                  .filter(entry => entry.status === 'paid')
                  .reduce((sum, entry) => sum + entry.paid_amount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(
                saleEntries
                  .filter(entry => entry.status === 'pending')
                  .reduce((sum, entry) => sum + entry.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(
                saleEntries
                  .filter(entry => entry.status === 'overdue')
                  .reduce((sum, entry) => sum + entry.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>
            Manage individual payments and installments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saleEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {entry.entry_type.charAt(0).toUpperCase() + entry.entry_type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(entry.due_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(entry.amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(entry.paid_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(entry.status)} variant="outline">
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {entry.paid_date ? format(new Date(entry.paid_date), "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setEditingEntry(entry);
                                setEditAmount(entry.amount.toString());
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Payment</DialogTitle>
                              <DialogDescription>
                                Modify the payment amount. If reduced, the difference will be redistributed to remaining installments.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Amount</label>
                                <Input
                                  type="number"
                                  value={editAmount}
                                  onChange={(e) => setEditAmount(e.target.value)}
                                  placeholder="Enter amount"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingEntry(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleEditEntry}>
                                Update
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setEntryToDelete(entry.id);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {entry.status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(entry.id, 'paid')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {entry.status !== 'overdue' && entry.status !== 'paid' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleStatusChange(entry.id, 'overdue')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Entry</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the payment entry and redistribute its amount to remaining installments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentLedger;