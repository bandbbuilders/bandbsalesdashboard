import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Plus,
  Upload,
  FileText,
  MoreHorizontal
} from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useLedgerEntries } from "@/hooks/useLedgerEntries";
import { useSales } from "@/hooks/useSales";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { numberToWords } from "@/lib/numberToWords";
import ceoSignature from "@/assets/ceo-signature-new.png";
import bbBuildersLogo from "@/assets/bb-builders-logo.png";

const PaymentLedger = () => {
  const { saleId } = useParams<{ saleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { ledgerEntries, loading, refetch, updateLedgerEntry, deleteLedgerEntry } = useLedgerEntries();
  const { sales } = useSales();

  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPaidDate, setEditPaidDate] = useState("");
  const [editType, setEditType] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [newPaymentDueDate, setNewPaymentDueDate] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("installment");
  const [generateReceivingOpen, setGenerateReceivingOpen] = useState(false);
  const [selectedEntryForReceipt, setSelectedEntryForReceipt] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentType, setPaymentType] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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

    // Update data with new values
    const updateData: any = {
      amount: newAmount,
      entry_type: editType
    };

    if (editDueDate) {
      updateData.due_date = editDueDate;
    }

    // Only mark as paid if paid_date is set AND wasn't already paid
    if (editPaidDate && editingEntry.status !== 'paid') {
      updateData.paid_date = editPaidDate;
      updateData.paid_amount = newAmount;
      updateData.status = 'paid';

      // Check for overpayment
      if (newAmount > originalAmount) {
        const overpayment = newAmount - originalAmount;

        // Find all remaining pending installments
        const remainingInstallments = saleEntries.filter(entry =>
          entry.entry_type === 'installment' &&
          entry.status === 'pending' &&
          entry.id !== editingEntry.id
        ).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        if (remainingInstallments.length > 0) {
          const reductionPerInstallment = overpayment / remainingInstallments.length;

          // Update all remaining installments
          for (const installment of remainingInstallments) {
            const newInstallmentAmount = Math.max(0, installment.amount - reductionPerInstallment);
            await updateLedgerEntry(installment.id, {
              amount: newInstallmentAmount
            });
          }

          toast({
            title: "Overpayment Applied",
            description: `PKR ${overpayment.toLocaleString()} distributed across ${remainingInstallments.length} remaining installments`,
          });
        }
      }
    } else if (newAmount !== originalAmount) {
      const difference = originalAmount - newAmount;

      // Find the next installment entry after this one
      const currentEntryIndex = saleEntries
        .filter(entry => entry.entry_type === 'installment' && entry.status === 'pending')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .findIndex(entry => entry.id === editingEntry.id);

      const nextInstallments = saleEntries
        .filter(entry => entry.entry_type === 'installment' && entry.status === 'pending')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        .slice(currentEntryIndex + 1);

      if (nextInstallments.length > 0) {
        const nextInstallment = nextInstallments[0];

        // If decreasing amount, add difference to next installment
        // If increasing amount, subtract difference from next installment
        const newNextAmount = nextInstallment.amount + difference;

        if (newNextAmount <= 0) {
          toast({
            title: "Error",
            description: "Cannot adjust - would make next installment negative",
            variant: "destructive",
          });
          return;
        }

        // Update the next installment
        await updateLedgerEntry(nextInstallment.id, {
          amount: newNextAmount
        });
      } else if (newAmount > originalAmount) {
        toast({
          title: "Error",
          description: "Cannot increase amount - no next installment to deduct from",
          variant: "destructive",
        });
        return;
      }
    }

    // Update the current entry
    await updateLedgerEntry(editingEntry.id, updateData);

    setEditingEntry(null);
    setIsEditDialogOpen(false);
    setEditAmount("");
    setEditDueDate("");
    setEditPaidDate("");
    setEditType("");
    refetch();
  };

  const handleAddAdjustedPayment = async () => {
    if (!newPaymentAmount || !newPaymentDueDate || !saleId) return;

    const paymentAmount = parseFloat(newPaymentAmount);

    if (paymentAmount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create new payment entry
      const { data: newEntry, error: insertError } = await supabase
        .from('ledger_entries')
        .insert({
          sale_id: saleId,
          amount: paymentAmount,
          due_date: newPaymentDueDate,
          entry_type: newPaymentType,
          status: 'pending',
          paid_amount: 0,
          description: `Adjusted ${newPaymentType}`
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Adjust remaining pending installments
      const remainingInstallments = saleEntries
        .filter(entry => entry.entry_type === 'installment' && entry.status === 'pending')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

      if (remainingInstallments.length > 0) {
        const reductionPerInstallment = paymentAmount / remainingInstallments.length;

        for (const installment of remainingInstallments) {
          const newAmount = Math.max(0, installment.amount - reductionPerInstallment);
          await updateLedgerEntry(installment.id, { amount: newAmount });
        }
      }

      toast({
        title: "Success",
        description: `Added adjusted payment of PKR ${paymentAmount.toLocaleString()}`,
      });

      setAddPaymentOpen(false);
      setNewPaymentAmount("");
      setNewPaymentDueDate("");
      setNewPaymentType("installment");
      refetch();
    } catch (error) {
      console.error('Error adding adjusted payment:', error);
      toast({
        title: "Error",
        description: "Failed to add adjusted payment",
        variant: "destructive",
      });
    }
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

  const handleStatusChange = async (entryId: string, newStatus: 'paid' | 'overdue' | 'pending') => {
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

  const handleGenerateReceipt = async () => {
    if (!selectedEntryForReceipt || !sale) return;

    // Default payment type if none selected
    const finalPaymentType = paymentType || 'cash';

    try {
      const doc = new jsPDF();
      const primaryColor = [180, 2, 2]; // #B40202

      // Add B&B BUILDERS header with red color
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('B&B BUILDERS', 105, 20, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT RECEIPT', 105, 30, { align: 'center' });

      // Add a decorative line
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.8);
      doc.line(20, 35, 190, 35);

      // Receipt details
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      const receiptDate = format(new Date(), 'dd MMMM yyyy');
      doc.text(`Receipt Date: ${receiptDate}`, 20, 45);
      doc.text(`Receipt No: RCP-${selectedEntryForReceipt.id.substring(0, 8).toUpperCase()}`, 20, 52);

      // Calculate installment number
      const sortedEntries = saleEntries
        .filter(e => e.entry_type === 'installment')
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      const installmentNo = sortedEntries.findIndex(e => e.id === selectedEntryForReceipt.id) + 1;

      if (selectedEntryForReceipt.entry_type === 'installment') {
        doc.text(`Installment No: ${installmentNo} of ${sortedEntries.length}`, 20, 59);
      }

      // Customer & Property Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Customer Details:', 20, 70);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Name: ${sale.customer.name}`, 20, 78);
      doc.text(`Unit Number: ${sale.unit_number}`, 20, 85);
      doc.text(`Shop/Flat No: ${sale.unit_number}`, 20, 92);

      // Payment Details Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Payment Details:', 20, 105);

      const amountInWords = numberToWords(Math.floor(selectedEntryForReceipt.paid_amount));

      autoTable(doc, {
        startY: 110,
        head: [['Description', 'Details']],
        body: [
          ['Payment Mode', finalPaymentType === 'bank' ? 'Bank Transfer' : 'Cash Payment'],
          ['Payment Type', selectedEntryForReceipt.entry_type.charAt(0).toUpperCase() + selectedEntryForReceipt.entry_type.slice(1)],
          ['Amount Received', formatCurrency(selectedEntryForReceipt.paid_amount)],
          ['Amount in Words', `${amountInWords} Rupees Only`],
          ['Due Date', format(new Date(selectedEntryForReceipt.due_date), 'dd MMMM yyyy')],
          ['Payment Date', selectedEntryForReceipt.paid_date ? format(new Date(selectedEntryForReceipt.paid_date), 'dd MMMM yyyy') : 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor as [number, number, number] },
        margin: { left: 20, right: 20 },
      });

      // Signature and stamp section
      const finalY = (doc as any).lastAutoTable.finalY + 20;

      // LEFT: CEO signature with date
      const signatureImg = new Image();
      signatureImg.src = ceoSignature;
      await new Promise((resolve) => {
        signatureImg.onload = resolve;
      });
      doc.addImage(signatureImg, 'PNG', 20, finalY, 50, 20);

      // Add a line between signature and name
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(20, finalY + 22, 70, finalY + 22);

      // Signature text on LEFT
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Abdullah Shah', 20, finalY + 28);
      doc.setFont('helvetica', 'bold');
      doc.text('CEO', 20, finalY + 33);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${receiptDate}`, 20, finalY + 38);

      // RIGHT: Company logo (double size and rotated 30 degrees)
      const logoImgRight = new Image();
      logoImgRight.src = bbBuildersLogo;
      await new Promise((resolve) => {
        logoImgRight.onload = resolve;
      });

      // Save state, translate, rotate, draw logo, restore
      doc.saveGraphicsState();
      const logoX = 155;
      const logoY = finalY + 15;
      const logoSize = 70; // Double the original size (35 * 2)

      // Translate to logo center, rotate, then draw
      const centerX = logoX + logoSize / 2;
      const centerY = logoY + logoSize / 2;
      const angle = -30 * Math.PI / 180; // 30 degrees in radians, negative for clockwise

      // Apply rotation transformation
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // jsPDF uses internal matrix transformation
      (doc as any).internal.write('q'); // Save graphics state
      (doc as any).internal.write(`${cos.toFixed(4)} ${sin.toFixed(4)} ${(-sin).toFixed(4)} ${cos.toFixed(4)} ${centerX.toFixed(2)} ${centerY.toFixed(2)} cm`);
      doc.addImage(logoImgRight, 'PNG', -logoSize / 2, -logoSize / 2, logoSize, logoSize);
      (doc as any).internal.write('Q'); // Restore graphics state

      // Footer section
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.3);
      doc.line(20, finalY + 55, 190, finalY + 55);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('Thank you for choosing B&B Builders!', 105, finalY + 63, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const endingNote = 'We appreciate your trust in us for your property investment. For any queries, please feel free to contact us.';
      const splitNote = doc.splitTextToSize(endingNote, 170);
      doc.text(splitNote, 105, finalY + 70, { align: 'center' });

      // Footer with company tagline
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('B&B Builders - Building Your Dreams with Excellence', 105, finalY + 85, { align: 'center' });

      // Save the PDF
      doc.save(`Receipt_${sale.customer.name}_${selectedEntryForReceipt.id.substring(0, 8)}.pdf`);

      toast({
        title: "Success",
        description: "Receipt generated successfully!",
      });

      setGenerateReceivingOpen(false);
      setSelectedEntryForReceipt(null);
      setProofFile(null);
      setPaymentType('');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast({
        title: "Error",
        description: "Failed to generate receipt",
        variant: "destructive",
      });
    }
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
                sale.unit_total_price - saleEntries
                  .filter(entry => entry.status === 'paid')
                  .reduce((sum, entry) => sum + entry.paid_amount, 0)
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Schedule</CardTitle>
            <CardDescription>
              Manage individual payments and installments
            </CardDescription>
          </div>
          <Dialog open={addPaymentOpen} onOpenChange={setAddPaymentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Adjusted Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Adjusted Payment</DialogTitle>
                <DialogDescription>
                  Add a new payment entry. The amount will be deducted from remaining pending installments.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select value={newPaymentType} onValueChange={setNewPaymentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="downpayment">Downpayment</SelectItem>
                      <SelectItem value="installment">Installment</SelectItem>
                      <SelectItem value="possession">Possession</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (PKR)</label>
                  <Input
                    type="number"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newPaymentDueDate}
                    onChange={(e) => setNewPaymentDueDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddPaymentOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAdjustedPayment}>
                  Add Payment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {/* Desktop View: Table */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-10 w-10 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingEntry(entry);
                              setEditAmount(entry.amount.toString());
                              setEditDueDate(entry.due_date);
                              setEditType(entry.entry_type);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>

                          {entry.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(entry.id, 'paid')}>
                              <CheckCircle className="mr-2 h-4 w-4 text-success" /> Mark as Paid
                            </DropdownMenuItem>
                          )}

                          {entry.status !== 'overdue' && entry.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(entry.id, 'overdue')}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Mark as Overdue
                            </DropdownMenuItem>
                          )}

                          {entry.status === 'paid' && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEntryForReceipt(entry);
                                setGenerateReceivingOpen(true);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4 text-primary" /> Generate Receiving
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setEntryToDelete(entry.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {saleEntries.map((entry) => (
              <Card key={entry.id} className="p-4 border shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Badge variant="outline" className="mb-1 text-[10px] uppercase font-bold tracking-tight">
                      {entry.entry_type}
                    </Badge>
                    <h3 className="text-lg font-bold text-foreground">
                      {formatCurrency(entry.amount)}
                    </h3>
                  </div>
                  <Badge className={cn("text-[10px] uppercase", getStatusColor(entry.status))}>
                    {entry.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Due Date</p>
                    <p className="font-medium">{format(new Date(entry.due_date), "dd MMM yyyy")}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Paid Amount</p>
                    <p className="font-medium">{formatCurrency(entry.paid_amount)}</p>
                  </div>
                  {entry.paid_date && (
                    <div className="space-y-1 col-span-2 pt-2 border-t border-dashed">
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Paid Date</p>
                      <p className="font-medium">{format(new Date(entry.paid_date), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="w-full h-11 text-sm font-bold gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20">
                      <MoreHorizontal className="h-4 w-4" />
                      Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[calc(100vw-3rem)] max-w-[280px] p-2">
                    <DropdownMenuLabel className="pb-2 px-2 text-xs text-muted-foreground">ENTRY ACTIONS</DropdownMenuLabel>
                    <DropdownMenuItem
                      className="h-11 rounded-md"
                      onClick={() => {
                        setEditingEntry(entry);
                        setEditAmount(entry.amount.toString());
                        setEditDueDate(entry.due_date);
                        setEditType(entry.entry_type);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="mr-3 h-4 w-4" /> Edit Details
                    </DropdownMenuItem>

                    {entry.status !== 'paid' && (
                      <DropdownMenuItem className="h-11 rounded-md" onClick={() => handleStatusChange(entry.id, 'paid')}>
                        <CheckCircle className="mr-3 h-4 w-4 text-success" /> Mark as Paid
                      </DropdownMenuItem>
                    )}

                    {entry.status !== 'overdue' && entry.status !== 'paid' && (
                      <DropdownMenuItem className="h-11 rounded-md" onClick={() => handleStatusChange(entry.id, 'overdue')}>
                        <XCircle className="mr-3 h-4 w-4 text-destructive" /> Mark as Overdue
                      </DropdownMenuItem>
                    )}

                    {entry.status === 'paid' && (
                      <DropdownMenuItem
                        className="h-11 rounded-md"
                        onClick={() => {
                          setSelectedEntryForReceipt(entry);
                          setGenerateReceivingOpen(true);
                        }}
                      >
                        <FileText className="mr-3 h-4 w-4 text-primary" /> Generate Receiving
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="h-11 rounded-md text-destructive focus:text-destructive"
                      onClick={() => {
                        setEntryToDelete(entry.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="mr-3 h-4 w-4" /> Delete Entry
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))}
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

      {/* Edit Payment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
            <DialogDescription>
              Modify the payment details. If amount is reduced, the difference will be redistributed to remaining installments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="downpayment">Downpayment</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                  <SelectItem value="possession">Possession</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Amount (PKR)</label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Paid Date (optional)</label>
              <Input
                type="date"
                value={editPaidDate}
                onChange={(e) => setEditPaidDate(e.target.value)}
                placeholder="Select paid date"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Set paid date only to mark payment as paid. Leave empty to keep current status.
              </p>
            </div>
            {editingEntry?.status === 'paid' && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                <span className="text-sm font-medium">Mark as Unpaid</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditPaidDate("");
                    handleStatusChange(editingEntry.id, 'pending');
                    setIsEditDialogOpen(false);
                    setEditingEntry(null);
                  }}
                >
                  Mark Unpaid
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEntry}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Receiving Dialog */}
      <Dialog open={generateReceivingOpen} onOpenChange={setGenerateReceivingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Receipt</DialogTitle>
            <DialogDescription>
              Select payment type and upload proof to generate a receipt
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Payment Type</label>
              <Select value={paymentType} onValueChange={(value: 'bank' | 'cash') => setPaymentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash Payment</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <label htmlFor="proof-upload" className="cursor-pointer">
                <div className="text-sm font-medium mb-1">Upload Payment Proof</div>
                <div className="text-xs text-muted-foreground">
                  {proofFile ? proofFile.name : "Click to upload image or document"}
                </div>
                <Input
                  id="proof-upload"
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setProofFile(file);
                  }}
                />
              </label>
            </div>
            {selectedEntryForReceipt && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">{formatCurrency(selectedEntryForReceipt.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-semibold capitalize">{selectedEntryForReceipt.entry_type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit:</span>
                  <span className="font-semibold">{sale?.unit_number}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" className="sm:flex-1" onClick={() => {
              setGenerateReceivingOpen(false);
              setSelectedEntryForReceipt(null);
              setProofFile(null);
              setPaymentType('cash');
            }}>
              Cancel
            </Button>
            <Button className="sm:flex-1" onClick={handleGenerateReceipt}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default PaymentLedger;