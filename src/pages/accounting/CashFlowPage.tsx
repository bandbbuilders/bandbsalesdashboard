import { CashFlow } from "@/components/accounting/CashFlow";

const CashFlowPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Cash Flow Statement
        </h1>
        <p className="text-muted-foreground text-lg">Track cash inflows and outflows</p>
      </div>
      <CashFlow />
    </div>
  );
};

export default CashFlowPage;
