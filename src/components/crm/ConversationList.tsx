import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageSquare, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  lead_id: string;
  user_id: string;
  type: string;
  subject: string;
  content: string;
  created_at: string;
}

interface ConversationListProps {
  leadId: string;
}

export const ConversationList = ({ leadId }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, [leadId]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-green-100 text-green-800';
      case 'email':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No communications recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <Card key={conversation.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(conversation.type)}>
                  {getTypeIcon(conversation.type)}
                  <span className="ml-1 capitalize">{conversation.type}</span>
                </Badge>
                {conversation.subject && (
                  <CardTitle className="text-base">{conversation.subject}</CardTitle>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(conversation.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{conversation.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};