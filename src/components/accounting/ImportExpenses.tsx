import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2 } from "lucide-react";

interface ExpenseData {
  date: string;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
}

export const ImportExpenses = ({ onImportComplete }: { onImportComplete?: () => void }) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const expenseData: ExpenseData[] = [
    // January 2025 expenses
    { date: "2025-01-15", description: "Tissue boxes", amount: 500, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Dairies for staff, ball point box", amount: 1700, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "A4 Paper rim", amount: 2000, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Clock Cell", amount: 100, debitAccount: "Misc Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Electricity Bill", amount: 7573, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Extension lead, headphones", amount: 6700, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Fuel going to F-8 (Ali)", amount: 500, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Gas Cylinder", amount: 1600, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Green tea Qehwa", amount: 660, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Harpic, brush, soap, tezab, foam", amount: 1000, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Lipton Tea", amount: 1750, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Lipton Tea, sugar", amount: 400, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Lunch + Dinner", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Lunch for guests", amount: 2300, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Lunch for staff", amount: 5000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Milk", amount: 10100, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Mobile Pkg given to Ali", amount: 100, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Motor Bill", amount: 2200, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Mouse, extension lead, mouse pad", amount: 1250, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Nayatel Bill", amount: 4000, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Office chair welding", amount: 500, debitAccount: "Repair & Maintenance Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Office Rent", amount: 262500, debitAccount: "Rent Expense", creditAccount: "Bank" },
    { date: "2025-01-15", description: "Remote Cell", amount: 100, debitAccount: "Misc Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Soap", amount: 290, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Super card office num", amount: 800, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Super card recharge (Zia)", amount: 1000, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Tissue Box, handwash", amount: 850, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Water Bill CDA 3 months", amount: 4550, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-01-15", description: "Water Bottle", amount: 800, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },

    // February 2025 expenses
    { date: "2025-02-15", description: "Tissue boxes", amount: 1000, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Water Bottles", amount: 640, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Cake, samosay (Zoha farewell)", amount: 3500, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Canva software purchase", amount: 500, debitAccount: "Software Subscription Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Danedar Tea", amount: 830, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Duster, wiper, cleaner, surf", amount: 2765, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Electricity bill", amount: 6770, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Gas Cylinder", amount: 800, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Herry & Huraira Salary", amount: 30000, debitAccount: "Salary Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Job Post in Linkedin", amount: 3165, debitAccount: "Recruitment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Lipton tea", amount: 1040, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Lumalabes content purchase $30", amount: 8340, debitAccount: "Software Subscription Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Lunch + Dinner (Ali)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Milk", amount: 9800, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Mobile pkg monthly (Naeem)", amount: 1200, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Monthly Pkg (Zia)", amount: 1200, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Motor Bill", amount: 2120, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Nayatel Bill", amount: 4000, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "New laptop for Sara & LCD for Muzamil", amount: 72000, debitAccount: "IT Equipment", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Odoo Consultant fee", amount: 15000, debitAccount: "Consulting Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Odoo Subscription fee 1 month", amount: 2500, debitAccount: "Software Subscription Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Office Rent", amount: 262500, debitAccount: "Rent Expense", creditAccount: "Bank" },
    { date: "2025-02-15", description: "Printer Tonner", amount: 2000, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Site visit fuel (Sara + Zain)", amount: 4000, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Site visit fuel (Sara + Zain, Zia, Naeem)", amount: 2000, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Soap", amount: 150, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Soap, surf", amount: 100, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Staff Lunch", amount: 5000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Sugar", amount: 330, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Tezab, harpic, soap", amount: 600, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Ufone Super card office num", amount: 1400, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Water Bottle", amount: 510, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-02-15", description: "Zong new sim + pkg", amount: 3120, debitAccount: "Communication Expense", creditAccount: "Cash" },

    // March 2025 expenses
    { date: "2025-03-15", description: "Water bottles", amount: 640, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Tissue Boxes", amount: 750, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Board marker, soft pines, double tape, adaptor", amount: 1700, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Canva + Capcut subscription", amount: 3500, debitAccount: "Software Subscription Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "DJI Mic mini", amount: 42000, debitAccount: "IT Equipment", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Electricity Bill", amount: 7415, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Equipment purchase (Camera, drone, tripod, battery)", amount: 490000, debitAccount: "IT Equipment", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Files & Letter head Printing", amount: 74000, debitAccount: "Printing & Stationery Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Fuel for visit F-10 & F-11", amount: 1000, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Gas Cylinder", amount: 680, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Headphone for Hamna", amount: 3000, debitAccount: "IT Equipment", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Laptop for Zia", amount: 67000, debitAccount: "IT Equipment", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Lunch + Dinner (Ali)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Microsoft 365 purchase", amount: 2000, debitAccount: "Software Subscription Expense", creditAccount: "Bank" },
    { date: "2025-03-15", description: "Milk", amount: 350, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Milk (guests)", amount: 300, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Motor Bill", amount: 2500, debitAccount: "Utility Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Mouse, USB for Zia system", amount: 2300, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Nayatel Bill", amount: 4000, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Odoo Subscription renewal", amount: 5684, debitAccount: "Software Subscription Expense", creditAccount: "Bank" },
    { date: "2025-03-15", description: "Office Rent", amount: 262500, debitAccount: "Rent Expense", creditAccount: "Bank" },
    { date: "2025-03-15", description: "Salary Zoha (Feb)", amount: 37000, debitAccount: "Salary Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Sara Commission (Tahira Sales)", amount: 150000, debitAccount: "Commission Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Site visit Fuel (Iftikhar client)", amount: 2100, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Site visit fuel (Staff shoot + indrive)", amount: 4000, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Site Visit Fuel (Zain + Sara)", amount: 3000, debitAccount: "Transportation Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Soap", amount: 340, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Staff Eidi (Zia, Sara, Muzamil, Hamna, Ali)", amount: 18000, debitAccount: "Salary Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Staff Salary (Feb)", amount: 300000, debitAccount: "Salary Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Staff Salary (March)", amount: 432000, debitAccount: "Salary Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Super Card recharge (Naeem)", amount: 1400, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Super Card recharge (Zia)", amount: 1200, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "Ufone super card recharge office num", amount: 1400, debitAccount: "Communication Expense", creditAccount: "Cash" },
    { date: "2025-03-15", description: "White board with stand", amount: 4020, debitAccount: "Office Supplies Expense", creditAccount: "Cash" },
  ];

  const handleImport = async () => {
    setImporting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const expense of expenseData) {
        const { error } = await supabase
          .from('journal_entries')
          .insert({
            date: expense.date,
            description: expense.description,
            debit_account: expense.debitAccount,
            credit_account: expense.creditAccount,
            amount: expense.amount
          });

        if (error) {
          console.error('Error importing entry:', expense.description, error);
          errorCount++;
        } else {
          successCount++;
        }
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} entries. ${errorCount > 0 ? `${errorCount} entries failed.` : ''}`,
      });

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: "Import Failed",
        description: "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Historical Expenses</CardTitle>
        <CardDescription>
          Import expense data from January-March 2025 ({expenseData.length} entries)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleImport} disabled={importing}>
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Expenses
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
