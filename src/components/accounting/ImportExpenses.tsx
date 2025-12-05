import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Trash2, FileSpreadsheet, Download, X } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ImportBatch {
  id: string;
  file_name: string;
  entries_count: number;
  total_amount: number;
  imported_at: string;
}

interface ParsedEntry {
  date: string;
  description: string;
  amount: number;
  debit_account: string;
  credit_account: string;
}

export const ImportExpenses = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [importing, setImporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<ImportBatch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedEntry[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchImportBatches = async () => {
    const { data, error } = await supabase
      .from('import_batches')
      .select('*')
      .order('imported_at', { ascending: false });

    if (error) {
      console.error('Error fetching import batches:', error);
      return;
    }
    setImportBatches(data || []);
  };

  useEffect(() => {
    fetchImportBatches();
  }, []);

  const downloadSampleCSV = () => {
    const sampleData = `date,description,amount,debit_account,credit_account
2025-01-01,Office Rent,50000,Office Rent,Cash
2025-01-02,Electricity Bill,5000,Utility Bill,Cash
2025-01-03,Staff Lunch,2000,Entertainment Expense,Cash
2025-01-04,Microsoft Subscription,2016,Subscription,Cash/Bank`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): ParsedEntry[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const dateIdx = headers.findIndex(h => h === 'date');
    const descIdx = headers.findIndex(h => h === 'description');
    const amountIdx = headers.findIndex(h => h === 'amount');
    const debitIdx = headers.findIndex(h => h.includes('debit'));
    const creditIdx = headers.findIndex(h => h.includes('credit'));

    if (dateIdx === -1 || descIdx === -1 || amountIdx === -1 || debitIdx === -1 || creditIdx === -1) {
      throw new Error('Invalid CSV format. Required columns: date, description, amount, debit_account, credit_account');
    }

    const entries: ParsedEntry[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 5 && values[descIdx]) {
        entries.push({
          date: values[dateIdx],
          description: values[descIdx],
          amount: parseFloat(values[amountIdx]) || 0,
          debit_account: values[debitIdx],
          credit_account: values[creditIdx]
        });
      }
    }
    return entries;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const text = await file.text();
      const entries = parseCSV(text);
      
      if (entries.length === 0) {
        toast({
          title: "Error",
          description: "No valid entries found in file",
          variant: "destructive",
        });
        return;
      }

      setParsedData(entries);
      toast({
        title: "File Parsed",
        description: `Found ${entries.length} entries ready to import`,
      });
    } catch (error: any) {
      toast({
        title: "Parse Error",
        description: error.message || "Failed to parse file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "No Data",
        description: "Please upload a file first",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      // Create import batch record
      const totalAmount = parsedData.reduce((sum, entry) => sum + entry.amount, 0);
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          file_name: fileName,
          entries_count: parsedData.length,
          total_amount: totalAmount
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Insert all journal entries with batch_id
      let successCount = 0;
      for (const entry of parsedData) {
        const { error } = await supabase
          .from('journal_entries')
          .insert({
            date: entry.date,
            description: entry.description,
            amount: entry.amount,
            debit_account: entry.debit_account,
            credit_account: entry.credit_account,
            batch_id: batchData.id
          });

        if (!error) {
          successCount++;
        }
      }

      // Update batch count if some failed
      if (successCount !== parsedData.length) {
        await supabase
          .from('import_batches')
          .update({ entries_count: successCount })
          .eq('id', batchData.id);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} of ${parsedData.length} entries`,
      });

      setParsedData([]);
      setFileName("");
      setDialogOpen(false);
      fetchImportBatches();
      onImportComplete?.();
    } catch (error: any) {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import entries",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;

    setDeleting(true);
    try {
      // Due to CASCADE, deleting the batch will also delete all journal entries with this batch_id
      const { error } = await supabase
        .from('import_batches')
        .delete()
        .eq('id', batchToDelete.id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `Deleted ${batchToDelete.entries_count} entries from "${batchToDelete.file_name}"`,
      });

      setDeleteDialogOpen(false);
      setBatchToDelete(null);
      fetchImportBatches();
      onImportComplete?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete import batch",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Import Expenses</CardTitle>
              <CardDescription>Upload CSV file to bulk import journal entries</CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Expenses
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Import Expenses from CSV</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file with your expense data
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Format Instructions */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Required CSV Format:</h4>
                    <div className="text-sm font-mono bg-background p-3 rounded border overflow-x-auto">
                      <div className="text-primary font-semibold">date,description,amount,debit_account,credit_account</div>
                      <div className="text-muted-foreground">2025-01-01,Office Rent,50000,Office Rent,Cash</div>
                      <div className="text-muted-foreground">2025-01-02,Electricity Bill,5000,Utility Bill,Cash</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample CSV
                      </Button>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <strong>Common Account Names:</strong> Office Rent, Utility Bill, Entertainment Expense, 
                      Subscription, Misc Exp, Staff Salary, IT Equipment, Printing & Stationary
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload CSV file
                      </p>
                    </label>
                  </div>

                  {/* Preview */}
                  {parsedData.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">Preview: {fileName}</h4>
                        <Button variant="ghost" size="sm" onClick={() => { setParsedData([]); setFileName(""); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="border rounded-lg max-h-60 overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Debit</TableHead>
                              <TableHead>Credit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {parsedData.slice(0, 10).map((entry, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{entry.date}</TableCell>
                                <TableCell>{entry.description}</TableCell>
                                <TableCell className="text-right">{formatAmount(entry.amount)}</TableCell>
                                <TableCell>{entry.debit_account}</TableCell>
                                <TableCell>{entry.credit_account}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {parsedData.length > 10 && (
                          <p className="text-sm text-muted-foreground text-center py-2">
                            ... and {parsedData.length - 10} more entries
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Total: {parsedData.length} entries</span>
                        <span className="font-semibold">
                          Total Amount: {formatAmount(parsedData.reduce((sum, e) => sum + e.amount, 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Import Button */}
                  <Button 
                    onClick={handleImport} 
                    disabled={importing || parsedData.length === 0}
                    className="w-full"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {parsedData.length} Entries
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        {importBatches.length > 0 && (
          <CardContent>
            <h4 className="font-semibold mb-3">Imported Files</h4>
            <div className="space-y-2">
              {importBatches.map((batch) => (
                <div 
                  key={batch.id} 
                  className="flex justify-between items-center p-3 bg-muted rounded-lg"
                >
                  <div>
                    <p className="font-medium">{batch.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.entries_count} entries • {formatAmount(batch.total_amount)} • 
                      {format(new Date(batch.imported_at), ' dd MMM yyyy')}
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => {
                      setBatchToDelete(batch);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Imported File?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {batchToDelete?.entries_count} journal entries 
              imported from "{batchToDelete?.file_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBatch}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Entries'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
