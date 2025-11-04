import { ImportExpenses } from "@/components/accounting/ImportExpenses";
import { GeneralJournal } from "@/components/accounting/GeneralJournal";
import { useState } from "react";

const Journal = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          General Journal
        </h1>
        <p className="text-muted-foreground text-lg">Record all financial transactions</p>
      </div>
      <ImportExpenses onImportComplete={handleImportComplete} />
      <GeneralJournal key={refreshKey} />
    </div>
  );
};

export default Journal;
