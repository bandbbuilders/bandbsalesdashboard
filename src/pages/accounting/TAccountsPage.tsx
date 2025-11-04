import { TAccounts } from "@/components/accounting/TAccounts";

const TAccountsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          T-Accounts
        </h1>
        <p className="text-muted-foreground text-lg">View account balances and transactions</p>
      </div>
      <TAccounts />
    </div>
  );
};

export default TAccountsPage;
