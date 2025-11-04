import { AccountingDashboard } from "@/components/accounting/AccountingDashboard";

const AccountingDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Financial Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">Track your financial health and performance metrics</p>
      </div>
      <AccountingDashboard />
    </div>
  );
};

export default AccountingDashboardPage;
