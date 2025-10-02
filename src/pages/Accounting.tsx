import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, FileText, TrendingUp, DollarSign } from "lucide-react";
import { GeneralJournal } from "@/components/accounting/GeneralJournal";
import { TAccounts } from "@/components/accounting/TAccounts";
import { ProfitAndLoss } from "@/components/accounting/ProfitAndLoss";
import { BalanceSheet } from "@/components/accounting/BalanceSheet";
import { CashFlow } from "@/components/accounting/CashFlow";

const Accounting = () => {
  const [activeTab, setActiveTab] = useState("journal");

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounting</h1>
          <p className="text-muted-foreground">Manage your financial records and reports</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="journal">
            <BookOpen className="h-4 w-4 mr-2" />
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="taccounts">
            <FileText className="h-4 w-4 mr-2" />
            T-Accounts
          </TabsTrigger>
          <TabsTrigger value="pnl">
            <TrendingUp className="h-4 w-4 mr-2" />
            P&L Statement
          </TabsTrigger>
          <TabsTrigger value="balance">
            <DollarSign className="h-4 w-4 mr-2" />
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="cashflow">
            <DollarSign className="h-4 w-4 mr-2" />
            Cash Flow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-4">
          <GeneralJournal />
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
  );
};

export default Accounting;
