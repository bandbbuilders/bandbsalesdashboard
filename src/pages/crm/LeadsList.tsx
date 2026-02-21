import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Eye, Edit, Columns } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { StageManager } from "@/components/crm/StageManager";
import { KanbanBoard } from "@/components/crm/KanbanBoard";

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

interface LeadTag {
  id: string;
  lead_id: string;
  tag: string;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  order_position: number;
}

// Tag color palette (15 colors)
const TAG_COLORS = [
  'bg-red-100 text-red-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-indigo-100 text-indigo-800',
  'bg-orange-100 text-orange-800',
  'bg-teal-100 text-teal-800',
  'bg-cyan-100 text-cyan-800',
  'bg-lime-100 text-lime-800',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
];

const getTagColor = (tag: string) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

const LeadsList = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [leadTags, setLeadTags] = useState<LeadTag[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showStageManager, setShowStageManager] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
    fetchStages();
    fetchLeadTags();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, filterLeads]);

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

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_stages')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setStages(data || []);
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchLeadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .select('*');

      if (error) throw error;
      setLeadTags(data || []);
    } catch (error) {
      console.error('Error fetching lead tags:', error);
    }
  };

  const getLeadTags = (leadId: string) => {
    return leadTags.filter(tag => tag.lead_id === leadId);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leads</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage your sales leads</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => navigate('/crm/leads/new')} size="sm" className="flex-1 sm:flex-none h-9 md:h-10">
            <Plus className="h-4 w-4 mr-1 md:mr-2" />
            New Lead
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowStageManager(true)} className="flex-1 sm:flex-none h-9 md:h-10">
            Stages
          </Button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 md:h-10"
          />
        </div>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'kanban')} className="w-full sm:w-auto">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-1 md:gap-2">
              <Columns className="h-3 w-3 md:h-4 md:w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          stages={stages}
          onLeadUpdate={fetchLeads}
          onStageUpdate={fetchStages}
        />
      ) : (
        <>
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
                      <span className="font-medium">Budget:</span> {lead.budget ? `PKR ${lead.budget.toLocaleString()}` : 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Source:</span> {lead.source || 'N/A'}
                    </p>

                    {/* Lead Tags */}
                    {getLeadTags(lead.id).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {getLeadTags(lead.id).map((tag) => (
                          <Badge key={tag.id} className={`text-xs ${getTagColor(tag.tag)}`}>
                            {tag.tag}
                          </Badge>
                        ))}
                      </div>
                    )}
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
        </>
      )}

      {/* Stage Manager Dialog */}
      <StageManager
        open={showStageManager}
        onOpenChange={setShowStageManager}
        stages={stages}
        onStagesUpdate={fetchStages}
      />
    </div>
  );
};

export default LeadsList;