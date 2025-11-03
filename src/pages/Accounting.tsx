import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BookOpen, FileText, TrendingUp, DollarSign, Activity } from "lucide-react";
import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";
import { GeneralJournal } from "@/components/accounting/GeneralJournal";
import { TAccounts } from "@/components/accounting/TAccounts";
import { ProfitAndLoss } from "@/components/accounting/ProfitAndLoss";
import { BalanceSheet } from "@/components/accounting/BalanceSheet";
import { CashFlow } from "@/components/accounting/CashFlow";
import { ImportExpenses } from "@/components/accounting/ImportExpenses";

const Accounting = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="space-y-6 p-4 md:p-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Financial Management
          </h1>
          <p className="text-muted-foreground text-lg">Track your financial health and performance metrics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="journal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4 mr-2" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="taccounts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4 mr-2" />
              T-Accounts
            </TabsTrigger>
            <TabsTrigger value="pnl" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              P&L
            </TabsTrigger>
            <TabsTrigger value="balance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="h-4 w-4 mr-2" />
              Cash Flow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <AccountingDashboard />
          </TabsContent>

        <TabsContent value="journal" className="space-y-4">
          <ImportExpenses onImportComplete={handleImportComplete} />
          <GeneralJournal key={refreshKey} />
        </TabsContent>

        <TabsContent value="taccounts" className="space-y-4">
          <TAccounts />
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <ProfitAndLoss />
        </TabsContent>

        <TabsContent value="balance" className="space-y-4">
          <BalanceSheet />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <CashFlow />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default Accounting;
