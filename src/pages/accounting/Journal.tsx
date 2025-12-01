import { ImportExpenses } from "@/components/accounting/ImportExpenses";
import { GeneralJournal } from "@/components/accounting/GeneralJournal";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Journal = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            General Journal
          </h1>
          <p className="text-muted-foreground text-lg">Record all financial transactions</p>
        </div>
        <Button onClick={() => navigate('/accounting/create-account')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Account
        </Button>
      </div>
      <ImportExpenses onImportComplete={handleImportComplete} />
      <GeneralJournal key={refreshKey} />
    </div>
  );
};

export default Journal;
