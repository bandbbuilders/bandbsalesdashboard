import { BalanceSheet } from "@/components/accounting/BalanceSheet";

const BalanceSheetPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Balance Sheet
        </h1>
        <p className="text-muted-foreground text-lg">View your assets, liabilities, and equity</p>
      </div>
      <BalanceSheet />
    </div>
  );
};

export default BalanceSheetPage;
