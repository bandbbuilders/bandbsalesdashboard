import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MessageCircle, 
  X, 
  Send, 
  Users, 
  User,
  Paperclip,
  Image,
  FileText,
  Link2
} from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  message_type: string;
  attachments: unknown;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'dm'>('company');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchUsers(user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [currentUserId, activeTab, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchUsers = async (excludeUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', excludeUserId);

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) return;

    let query = supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (activeTab === 'company') {
      query = query.is('receiver_id', null);
    } else if (selectedUser) {
      query = query.or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${currentUserId})`
      );
    }

    const { data, error } = await query.limit(100);
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch sender profiles
    const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const messagesWithSenders = data?.map(m => ({
        ...m,
        sender: profileMap.get(m.sender_id)
      })) || [];
      
      setMessages(messagesWithSenders);
    } else {
      setMessages(data || []);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Check if message is relevant to current view
          if (activeTab === 'company' && !newMsg.receiver_id) {
            fetchMessages();
          } else if (activeTab === 'dm' && selectedUser) {
            if (
              (newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedUser.user_id) ||
              (newMsg.sender_id === selectedUser.user_id && newMsg.receiver_id === currentUserId)
            ) {
              fetchMessages();
            }
          }
          
          // Update unread count if message is for current user
          if (newMsg.receiver_id === currentUserId && !isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const messageData = {
      sender_id: currentUserId,
      receiver_id: activeTab === 'dm' && selectedUser ? selectedUser.user_id : null,
      content: newMessage.trim(),
      message_type: 'text',
      attachments: []
    };

    const { error } = await supabase
      .from('chat_messages')
      .insert(messageData);

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
      return;
    }

    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 left-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-105 z-50"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 w-96 h-[500px] bg-card border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold">Chat</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('company'); setSelectedUser(null); }}
              className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'company' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="h-4 w-4" />
              Company
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex-1 py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'dm' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4" />
              Direct Messages
            </button>
          </div>

          {/* User List for DM */}
          {activeTab === 'dm' && !selectedUser && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </button>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No users available</p>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Messages */}
          {(activeTab === 'company' || selectedUser) && (
            <>
              {activeTab === 'dm' && selectedUser && (
                <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                    ←
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{selectedUser.full_name}</span>
                </div>
              )}
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(message => {
                    const isOwn = message.sender_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex gap-2 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="text-xs">
                              {getInitials(message.sender?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {!isOwn && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {message.sender?.full_name}
                              </p>
                            )}
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isOwn 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(message.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </p>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button variant="ghost" size="icon" onClick={handleFileUpload} title="Attach file">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
