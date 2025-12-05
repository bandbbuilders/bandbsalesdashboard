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
    // April 2025
    { date: "2025-04-01", description: "2 Water Bottle", amount: 960, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-02", description: "4 Tissue Box", amount: 1000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-03", description: "3 Chairs purchase + carriage", amount: 30000, debitAccount: "Repair & Maintenance", creditAccount: "Cash" },
    { date: "2025-04-04", description: "3 Chairs tyre change", amount: 3000, debitAccount: "Repair & Maintenance", creditAccount: "Cash" },
    { date: "2025-04-05", description: "3 Coffee Packet", amount: 210, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-06", description: "Canva Subscription Renewal", amount: 1820, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-04-07", description: "Documents courier to KHI + Lahore", amount: 740, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-08", description: "Electricity Bill", amount: 7576, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-04-09", description: "Fuel (Federal Board & Ibcc & kuri road)", amount: 1500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-10", description: "Fuel Site Visit (Add Shoot)", amount: 2000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-11", description: "Gas Cylinder", amount: 830, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-04-12", description: "HDMI Cable (Muzamil System)", amount: 1400, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-13", description: "Indrive charges (Add shoot in F-9 Park)", amount: 650, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-14", description: "Lemon Max, Sugar, tea", amount: 390, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-15", description: "Lipton tea", amount: 1320, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-16", description: "Lunch + Dinner (Ali)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-17", description: "Microsoft 365 sub renewal", amount: 2016, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-04-18", description: "Milk", amount: 8700, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-19", description: "Monthly Pkg (Zia)", amount: 1400, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-20", description: "Motor Bill", amount: 2430, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-04-21", description: "Nayatell bill", amount: 4000, debitAccount: "Utility Bill", creditAccount: "Cash/Bank" },
    { date: "2025-04-22", description: "Odo Subscription", amount: 2548, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-04-23", description: "Office Rent", amount: 262500, debitAccount: "Office Rent", creditAccount: "Cash/Bank" },
    { date: "2025-04-24", description: "Pizza, Cake for birthday (Ali, Muzammil)", amount: 5500, debitAccount: "Entertainment Expense", creditAccount: "Cash/Bank" },
    { date: "2025-04-25", description: "Ring Light", amount: 5500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-26", description: "Site visit Fuel (Musharaf Hasnain)", amount: 2000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-27", description: "Site Visit Fuel (Shoot)", amount: 2000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-28", description: "Site visit fuel (Talha Irfan)", amount: 2000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-04-29", description: "Staff lunch", amount: 5000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-04-30", description: "Sugar, Surf, Office supplies", amount: 2090, debitAccount: "Misc Exp", creditAccount: "Cash" },

    // May 2025
    { date: "2025-05-01", description: "2 Cold drink guests, lemon max", amount: 500, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-02", description: "2 Tissue Box", amount: 500, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-03", description: "2 Water Bottle", amount: 320, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-04", description: "541-C Bill Paid", amount: 343, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-05-05", description: "Camera Lens", amount: 48000, debitAccount: "IT Equipment", creditAccount: "Cash/Bank" },
    { date: "2025-05-06", description: "Canva subscription renew", amount: 4200, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-05-07", description: "Chicken roll, samosa, stick (guest)", amount: 1756, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-08", description: "Coffee jar, milk, ice", amount: 2650, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-09", description: "Divider 1-12", amount: 180, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-10", description: "Electricity Bill", amount: 18926, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-05-11", description: "Exhaust fan Install", amount: 5000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-12", description: "Fuel Bike (Golra Morh)", amount: 500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-13", description: "Gas Cylinder", amount: 680, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-05-14", description: "Handwash, soap", amount: 520, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-15", description: "Indrive zia (19,23,24,26,27,28,29,30 may)", amount: 6000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-16", description: "Lipton Tea and supplies", amount: 2980, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-17", description: "Lunch + Dinner (Ali)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-18", description: "Microsoft subscription renew", amount: 2016, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-05-19", description: "Microwave oven", amount: 16400, debitAccount: "Office Exp (Microwave)", creditAccount: "Cash/Bank" },
    { date: "2025-05-20", description: "Milk (various)", amount: 9200, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-05-21", description: "Mobile Pkg (Zia)", amount: 1400, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-22", description: "Motor Bill", amount: 3460, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-05-23", description: "Nayatel Bill", amount: 4000, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-05-24", description: "Odoo Subscription", amount: 2548, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-05-25", description: "Office Rent", amount: 262500, debitAccount: "Office Rent", creditAccount: "Cash/Bank" },
    { date: "2025-05-26", description: "Paper Rim, box file, Divider", amount: 1780, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-27", description: "Post Paid sim bill paid (Zong 2 months)", amount: 1000, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-05-28", description: "Site visit fuel (Abeer malik)", amount: 3000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-29", description: "Site visit fuel (Shoot)", amount: 3000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-05-30", description: "Staff Salary M/O April & May", amount: 1155000, debitAccount: "Staff Salary", creditAccount: "Cash" },
    { date: "2025-05-31", description: "Water bill CDA 3 months & supplies", amount: 6550, debitAccount: "Utility Bill", creditAccount: "Cash" },

    // June 2025
    { date: "2025-06-01", description: "541-C Electricity Bill Paid", amount: 1235, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-06-02", description: "BBQ Sandwich, Chicken Pie", amount: 860, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-03", description: "Brochure printing for sample", amount: 10000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-04", description: "Canva + Capcut subscription", amount: 4200, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-06-05", description: "Colour Photocopy Cnic + cheque", amount: 130, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-06", description: "Electricity Bill", amount: 4416, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-06-07", description: "Foam, Soap, Lighter", amount: 100, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-08", description: "Freepik Subscription", amount: 1818, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-06-09", description: "Fuel Bike (Blue area to Ibex F-11)", amount: 1000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-10", description: "Fuel for card handover to Abdul wahab", amount: 2000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-11", description: "Gas Cylinder", amount: 1200, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-06-12", description: "Lipton tea and supplies", amount: 1380, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-13", description: "Lunch + Dinner Ali (June)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-14", description: "Microsoft Subscription renewal", amount: 2016, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-06-15", description: "Milk 16 days", amount: 5385, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-16", description: "Mobile pkg (Zia)", amount: 1400, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-17", description: "Motor Bill", amount: 2250, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-06-18", description: "Nayatell Bill", amount: 4000, debitAccount: "Utility Bill", creditAccount: "Cash/Bank" },
    { date: "2025-06-19", description: "Odoo Subscription", amount: 2548, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-06-20", description: "Office Number pkg (Sara)", amount: 1400, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-21", description: "Office Rent M/O June", amount: 288750, debitAccount: "Office Rent", creditAccount: "Cash/Bank" },
    { date: "2025-06-22", description: "Pizza slice, sandwich for clients", amount: 450, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-23", description: "Site Visit Fuel (For shoot)", amount: 3000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-24", description: "Staff Lunch", amount: 5000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-25", description: "Tiktok podcast boosting", amount: 600, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-26", description: "Tonner Refill+ blade", amount: 1900, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-06-27", description: "Water Bill CDA 3 months", amount: 4450, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-06-28", description: "Water supplies", amount: 2360, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-06-29", description: "Zain bhai mobile pkg", amount: 1300, debitAccount: "Misc Exp", creditAccount: "Cash" },

    // July 2025
    { date: "2025-07-01", description: "13 stamp paper for bank", amount: 8000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-02", description: "2 Water Bottle", amount: 320, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-03", description: "7up for customer", amount: 360, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-04", description: "A4 Paper Rim", amount: 1950, debitAccount: "Printing & Stationary", creditAccount: "Cash" },
    { date: "2025-07-05", description: "Bike Fuel F-10 to G-8 & G-8 to Office", amount: 1000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-06", description: "Bike Fuel office to F-11 & F-11 to Office", amount: 500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-07", description: "Bike rider for document received from Architect", amount: 350, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-08", description: "Brochure Print (20pcs)", amount: 53000, debitAccount: "Printing & Stationary", creditAccount: "Cash" },
    { date: "2025-07-09", description: "Brush, soap, surf, power clean toilet, phenyl", amount: 3000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-10", description: "Bykea charges given to Ali", amount: 300, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-11", description: "Canva Subscription renewal", amount: 1820, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-07-12", description: "Electricity Bill", amount: 31463, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-07-13", description: "Fuel Add shot in gulberg + lunch", amount: 4000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-14", description: "Fuel for bike (car view G-8 & G-11)", amount: 1000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-15", description: "Fuel site visit for shoot", amount: 3000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-16", description: "Gas Cylinder", amount: 660, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-07-17", description: "Hailoy AI Subscription", amount: 1000, debitAccount: "Subscription", creditAccount: "Cash" },
    { date: "2025-07-18", description: "Indrive charges for shoot in Isb", amount: 1000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-19", description: "Tea and supplies", amount: 2930, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-20", description: "Lunch + dinner (Ali M/O July)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-21", description: "Microsoft sub renewal", amount: 2016, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-07-22", description: "Milk 30 days", amount: 9000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-23", description: "Mobile Recharge (Sara, Zain, Zia)", amount: 4500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-24", description: "Motor Bill", amount: 3650, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-07-25", description: "Nayatell Bill", amount: 4000, debitAccount: "Utility Bill", creditAccount: "Cash/Bank" },
    { date: "2025-07-26", description: "Odoo Subscription", amount: 2548, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-07-27", description: "Office Rent", amount: 288750, debitAccount: "Office Rent", creditAccount: "Cash/Bank" },
    { date: "2025-07-28", description: "Site visit fuel (Nadeem Mughal)", amount: 3000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-07-29", description: "Staff lunch", amount: 5000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-30", description: "Staff Salary Paid M/O June 2025", amount: 500000, debitAccount: "Staff Salary", creditAccount: "Cash" },
    { date: "2025-07-31", description: "Water & supplies", amount: 2130, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-07-15", description: "Wati credit for template msg", amount: 4200, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-07-16", description: "Wati Subscription", amount: 13720, debitAccount: "Subscription", creditAccount: "Cash/Bank" },

    // August 2025
    { date: "2025-08-01", description: "1 Light plug for UPS", amount: 150, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-02", description: "2 chicken pc, white chanay for guests", amount: 1500, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-03", description: "2 Tissue box", amount: 1000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-04", description: "2 water bottle", amount: 640, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-05", description: "3 Packet milk, 2 tea for guests", amount: 440, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-06", description: "7up for customer", amount: 450, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-07", description: "Ballpoint box, whitener", amount: 420, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-08", description: "Bike fuel (G-9 markaz for optical)", amount: 1000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-09", description: "Biscuits (For Guests)", amount: 80, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-10", description: "Canva Subscription Renewal", amount: 1820, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-08-11", description: "Computer Repairing (Muzamil)", amount: 500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-12", description: "Electricity Bill", amount: 43801, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-08-13", description: "Gas Cylinder", amount: 1300, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-08-14", description: "Green tea, Lipton tea and supplies", amount: 3060, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-15", description: "Indrive charges (Huraira, hamna f-10)", amount: 500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-16", description: "Lunch + Dinner (Ali)", amount: 8000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-17", description: "Microsoft subscription renew", amount: 2016, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-08-18", description: "Milk 26 days and supplies", amount: 9610, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-19", description: "Mobile for sara, laptop huraira, ram muzamil", amount: 159390, debitAccount: "Office Equipments", creditAccount: "Cash/Bank" },
    { date: "2025-08-20", description: "Mobile Recharge (Sara, Zain, Zia)", amount: 4500, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-21", description: "Motor Bill", amount: 3670, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-08-22", description: "Nayatell Bill", amount: 4000, debitAccount: "Utility Bill", creditAccount: "Cash/Bank" },
    { date: "2025-08-23", description: "Odoo Subscription renewal", amount: 2548, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-08-24", description: "Office Rent", amount: 288750, debitAccount: "Office Rent", creditAccount: "Cash/Bank" },
    { date: "2025-08-25", description: "Postpaid sim bill paid", amount: 500, debitAccount: "Utility Bill", creditAccount: "Cash" },
    { date: "2025-08-26", description: "Printer Tonner", amount: 1600, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-27", description: "Runway AI Subscription", amount: 9800, debitAccount: "Subscription", creditAccount: "Cash/Bank" },
    { date: "2025-08-28", description: "Site visit fuel (For dealer meeting & Shoot)", amount: 4000, debitAccount: "Misc Exp", creditAccount: "Cash" },
    { date: "2025-08-29", description: "Staff lunch", amount: 5000, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
    { date: "2025-08-30", description: "Staff Salary M/O July 2025", amount: 510000, debitAccount: "Staff Salary", creditAccount: "Cash" },
    { date: "2025-08-31", description: "Water & supplies", amount: 1610, debitAccount: "Entertainment Expense", creditAccount: "Cash" },
  ];

  const handleImport = async () => {
    console.log('Import started, processing', expenseData.length, 'entries');
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
          console.log('Imported:', expense.description);
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
          Import expense data from April-August 2025 ({expenseData.length} entries)
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
