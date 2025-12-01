import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CustomAccount {
  id: string;
  name: string;
  type: string;
  debit_account: string;
  credit_account: string;
  created_at: string;
}

const accountTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];

const defaultAccounts = [
  "Cash", "Accounts Receivable", "Inventory", "Land", "Building", "Equipment",
  "Accounts Payable", "Notes Payable", "Capital", "Sales Revenue", "Cost of Goods Sold",
  "Salaries Expense", "Rent Expense", "Utilities Expense", "Marketing Expense",
  "Entertainment Expense", "Office Rent", "Staff Salary", "Subscription", "Utility Bill",
  "Misc Exp", "Repair & Maintenance", "IT Equipment", "Printing & Stationary", "Cash/Bank"
];

export const CreateAccount = () => {
  const [accounts, setAccounts] = useState<CustomAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    debit_account: "",
    credit_account: ""
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching custom accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.debit_account || !formData.credit_account) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_accounts')
        .insert({
          name: formData.name,
          type: formData.type,
          debit_account: formData.debit_account,
          credit_account: formData.credit_account
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom account created successfully"
      });

      setFormData({
        name: "",
        type: "",
        debit_account: "",
        credit_account: ""
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: "Failed to create custom account",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom account deleted successfully"
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Create Custom Accounts
          </h1>
          <p className="text-muted-foreground text-lg">Define custom accounts with linked debit/credit accounts</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Account</CardTitle>
            <CardDescription>Create a custom account with linked debit and credit accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Office Supplies"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Linked Debit Account</Label>
                <Select value={formData.debit_account} onValueChange={(value) => setFormData({ ...formData, debit_account: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select debit account" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultAccounts.map((account) => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Linked Credit Account</Label>
                <Select value={formData.credit_account} onValueChange={(value) => setFormData({ ...formData, credit_account: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select credit account" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultAccounts.map((account) => (
                      <SelectItem key={account} value={account}>
                        {account}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Accounts List */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Accounts</CardTitle>
            <CardDescription>Manage your custom accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No custom accounts yet. Create your first one!
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div key={account.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{account.name}</h3>
                        <p className="text-sm text-muted-foreground">{account.type}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Debit:</span>
                        <span className="font-medium">{account.debit_account}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Credit:</span>
                        <span className="font-medium">{account.credit_account}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
