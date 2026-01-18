import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Users } from "lucide-react";

interface Sale {
  agent_id: string;
  agent: {
    id: string;
    name: string;
    email: string;
  };
  unit_total_price: number;
}

interface AgentSalesSummaryProps {
  sales: Sale[];
}

interface AgentStats {
  id: string;
  name: string;
  email: string;
  salesCount: number;
  totalValue: number;
}

export const AgentSalesSummary = ({ sales }: AgentSalesSummaryProps) => {
  // Aggregate sales by agent
  const agentStats = sales.reduce((acc: Record<string, AgentStats>, sale) => {
    if (!sale.agent?.id) return acc;
    
    const agentId = sale.agent.id;
    if (!acc[agentId]) {
      acc[agentId] = {
        id: agentId,
        name: sale.agent.name || "Unknown",
        email: sale.agent.email || "",
        salesCount: 0,
        totalValue: 0,
      };
    }
    acc[agentId].salesCount += 1;
    acc[agentId].totalValue += sale.unit_total_price || 0;
    return acc;
  }, {});

  const agentList = Object.values(agentStats).sort((a, b) => b.totalValue - a.totalValue);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `Rs ${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `Rs ${(amount / 100000).toFixed(2)} Lac`;
    }
    return `Rs ${amount.toLocaleString()}`;
  };

  if (agentList.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Sales by Agent
        </CardTitle>
        <Badge variant="outline">{agentList.length} Agents</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agentList.map((agent, index) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {agent.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <span className="absolute -top-1 -right-1 text-xs">🏆</span>
                  )}
                </div>
                <div>
                  <p className="font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {agent.salesCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Sales</p>
                </div>
                <div className="border-l pl-4">
                  <p className="text-sm font-semibold text-green-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {formatCurrency(agent.totalValue)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
