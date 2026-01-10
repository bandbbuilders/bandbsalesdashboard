import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit, Phone, Mail, Building, DollarSign, Calendar, Plus, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConversationList } from "@/components/crm/ConversationList";
import { AddConversation } from "@/components/crm/AddConversation";
import { RemindersList } from "@/components/crm/RemindersList";
import { AddReminder } from "@/components/crm/AddReminder";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  budget: number;
  stage: string;
  source: string;
  notes: string;
  assigned_to: string;
  created_at: string;
}

interface LeadTag {
  id: string;
  tag: string;
}

const LeadDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddConversation, setShowAddConversation] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLead();
      fetchTags();
    }
  }, [id]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_tags')
        .select('id, tag')
        .eq('lead_id', id);

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setLead(data);
    } catch (error) {
      console.error('Error fetching lead:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lead details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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

  if (!lead) {
    return <div>Lead not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/crm/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Leads
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{lead.name}</h1>
            <p className="text-muted-foreground">{lead.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/crm/leads/${id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Lead
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge className={getStageColor(lead.stage)}>
                  {lead.stage.replace('_', ' ')}
                </Badge>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-xs">
                        {tag.tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              )}

              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              )}

              {lead.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.company}</span>
                </div>
              )}

              {lead.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">₹{lead.budget.toLocaleString()}</span>
                </div>
              )}

              {lead.source && (
                <div>
                  <span className="text-sm font-medium">Source: </span>
                  <span className="text-sm">{lead.source}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Created {new Date(lead.created_at).toLocaleDateString()}
                </span>
              </div>

              {lead.notes && (
                <div className="pt-4 border-t">
                  <span className="text-sm font-medium">Notes:</span>
                  <p className="text-sm text-muted-foreground mt-1">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Communications & Reminders */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="conversations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="conversations">Communications</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Communications</h3>
                <Button onClick={() => setShowAddConversation(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Communication
                </Button>
              </div>
              <ConversationList leadId={id!} />
              <AddConversation
                leadId={id!}
                open={showAddConversation}
                onOpenChange={setShowAddConversation}
              />
            </TabsContent>

            <TabsContent value="reminders" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Reminders</h3>
                <Button onClick={() => setShowAddReminder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Reminder
                </Button>
              </div>
              <RemindersList leadId={id!} />
              <AddReminder
                leadId={id!}
                open={showAddReminder}
                onOpenChange={setShowAddReminder}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LeadDetails;