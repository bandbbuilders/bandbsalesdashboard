import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  budget: number;
  stage: string;
  source: string;
  created_at: string;
  assigned_to: string;
}

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    if (!searchTerm) {
      setFilteredLeads(leads);
      return;
    }

    const filtered = leads.filter(lead =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLeads(filtered);
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-orange-100 text-orange-800',
      'proposal': 'bg-purple-100 text-purple-800',
      'negotiation': 'bg-indigo-100 text-indigo-800',
      'closed_won': 'bg-green-100 text-green-800',
      'closed_lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground">Manage your sales leads and prospects</p>
        </div>
        <Button onClick={() => navigate('/crm/leads/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search leads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{lead.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{lead.company}</p>
                </div>
                <Badge className={getStageColor(lead.stage)}>
                  {lead.stage.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {lead.email || 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {lead.phone || 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Budget:</span> {lead.budget ? `₹${lead.budget.toLocaleString()}` : 'N/A'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Source:</span> {lead.source || 'N/A'}
                </p>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/crm/leads/${lead.id}`)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/crm/leads/${lead.id}/edit`)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No leads found</p>
        </div>
      )}
    </div>
  );
};

export default LeadsList;