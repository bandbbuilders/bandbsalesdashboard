import { ProfitAndLoss } from "@/components/accounting/ProfitAndLoss";

const PnLPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Profit & Loss Statement
        </h1>
        <p className="text-muted-foreground text-lg">Review your income and expenses</p>
      </div>
      <ProfitAndLoss />
    </div>
  );
};

export default PnLPage;
