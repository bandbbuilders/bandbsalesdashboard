import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MessageCircle,
  X,
  Send,
  Users,
  User,
  Paperclip,
  Image as ImageIcon,
  FileText,
  PlusCircle,
  MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// @ts-ignore
import Select from 'react-select';

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
  group_id: string | null;
  content: string;
  message_type: string;
  attachments: { name: string; type: string; url: string }[] | null;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
}

interface ChatGroup {
  id: string;
  name: string;
  image_url: string | null;
  created_by: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'dm' | 'groups'>('company');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<any[]>([]); // Use any[] temporarily to fix build
  const [isUploading, setIsUploading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("ChatWidget: Found user", user.id);
        setCurrentUserId(user.id);
        fetchUsers(user.id);
        fetchGroups();
      } else {
        console.log("ChatWidget: No user found");
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCount();
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [currentUserId, activeTab, selectedUser?.id, selectedGroup?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const fetchUsers = async (excludeUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('user_id', excludeUserId);

    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchGroups = async () => {
    // Cast any to bypass outdated types for new tables
    // @ts-ignore
    const { data, error } = await (supabase
      .from('chat_groups' as any)
      .select('*') as any);

    if (!error && data) {
      setGroups(data as any[]);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) return;

    let query: any = supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (activeTab === 'company') {
      query = query.is('receiver_id', null).is('group_id', null);
    } else if (activeTab === 'dm' && selectedUser) {
      query = query.or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${currentUserId})`
      );
    } else if (activeTab === 'groups' && selectedGroup) {
      query = query.eq('group_id', selectedGroup.id);
    } else {
      setMessages([]);
      return;
    }

    // Mark messages as read if it's a DM
    if (activeTab === 'dm' && selectedUser) {
      markAsRead(selectedUser.user_id);
    }

    const { data, error } = await query.limit(100);
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    // Fetch sender profiles
    const senderIds = [...new Set(data?.map((m: any) => m.sender_id) || [])] as string[];
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
      const messagesWithSenders = data?.map(m => ({
        ...m,
        attachments: typeof m.attachments === 'string' ? JSON.parse(m.attachments as string) : m.attachments,
        sender: profileMap.get(m.sender_id)
      })) || [];

      setMessages(messagesWithSenders);
    } else {
      setMessages(data?.map(m => ({
        ...m,
        attachments: typeof m.attachments === 'string' ? JSON.parse(m.attachments as string) : m.attachments
      })) || []);
    }
  };

  const fetchUnreadCount = async () => {
    if (!currentUserId) return;
    try {
      // For DMs we can easily check is_read
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!currentUserId) return;
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_read: true } as any)
      .eq('receiver_id', currentUserId)
      .eq('sender_id', senderId)
      .eq('is_read', false);

    if (!error) {
      fetchUnreadCount();
    }
  };

  const subscribeToMessages = () => {
    const channelName = `chat-messages-${activeTab}-${selectedUser?.user_id || selectedGroup?.id || 'all'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          console.log("ChatWidget: Received new message via Realtime", newMsg);

          // Update unread count if chat is closed or not in the active view
          if (newMsg.sender_id !== currentUserId) {
            let isCurrentView = false;
            if (isOpen) {
              if (activeTab === 'company' && !newMsg.receiver_id && !newMsg.group_id) isCurrentView = true;
              else if (activeTab === 'dm' && selectedUser && newMsg.sender_id === selectedUser.user_id && newMsg.receiver_id === currentUserId) isCurrentView = true;
              else if (activeTab === 'groups' && selectedGroup && newMsg.group_id === selectedGroup.id) isCurrentView = true;
            }

            if (!isCurrentView) {
              setUnreadCount(prev => prev + 1);
              // Visual feedback for new message
              const badge = document.getElementById('chat-badge');
              if (badge) {
                badge.classList.add('animate-bounce');
                setTimeout(() => badge.classList.remove('animate-bounce'), 3000);
              }

              // Browser Notification / Toast
              const showNotification = async () => {
                const { data: sender } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('user_id', newMsg.sender_id)
                  .single();

                let title = sender?.full_name || "New Message";

                if (newMsg.group_id) {
                  // @ts-ignore
                  const { data: group } = await (supabase
                    .from('chat_groups' as any)
                    .select('name')
                    .eq('id', newMsg.group_id)
                    .single() as any);
                  if (group) title = `${sender?.full_name} in ${group.name}`;
                }

                toast(title, {
                  description: newMsg.content || "Sent an attachment",
                  duration: 5000,
                  action: {
                    label: "Open Chat",
                    onClick: () => {
                      setIsOpen(true);
                      if (newMsg.group_id) {
                        setActiveTab('groups');
                        // We might need to fetch the group if not in state
                      } else if (newMsg.receiver_id) {
                        setActiveTab('dm');
                      } else {
                        setActiveTab('company');
                      }
                    }
                  }
                });
              };
              showNotification();
            }
          }

          // Avoid duplicates from optimistic update
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;

            // Determine if message belongs to current view
            let isRelevant = false;
            if (activeTab === 'company' && !newMsg.receiver_id && !newMsg.group_id) {
              isRelevant = true;
            } else if (activeTab === 'dm' && selectedUser) {
              if ((newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedUser.user_id) ||
                (newMsg.sender_id === selectedUser.user_id && newMsg.receiver_id === currentUserId)) {
                isRelevant = true;
              }
            } else if (activeTab === 'groups' && selectedGroup) {
              if (newMsg.group_id === selectedGroup.id) {
                isRelevant = true;
              }
            }

            if (!isRelevant) return prev;

            // Add the message and potentially fetch sender info if missing
            const fetchSenderAndAdd = async () => {
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', newMsg.sender_id)
                .single();

              const msgWithSender = {
                ...newMsg,
                attachments: typeof newMsg.attachments === 'string' ? JSON.parse(newMsg.attachments as string) : newMsg.attachments,
                sender: senderProfile || undefined
              };
              setMessages(current => [...current, msgWithSender]);
            };

            // If it's ours, we can skip fetch or use current user info
            if (newMsg.sender_id === currentUserId) {
              const msgWithSender: ChatMessage = {
                ...newMsg,
                attachments: typeof newMsg.attachments === 'string' ? JSON.parse(newMsg.attachments as string) : newMsg.attachments
              };
              return [...prev, msgWithSender];
            } else {
              fetchSenderAndAdd();
              return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      // Send message with attachment immediately
      await sendMessage(null, [{
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: publicUrl
      }]);

    } catch (error: any) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e?: any, attachments: { name: string; type: string; url: string }[] = []) => {
    const content = newMessage.trim();
    if ((!content && attachments.length === 0) || !currentUserId) return;

    const messageData = {
      sender_id: currentUserId,
      receiver_id: activeTab === 'dm' && selectedUser ? selectedUser.user_id : null,
      group_id: activeTab === 'groups' && selectedGroup ? selectedGroup.id : null,
      content: content,
      message_type: attachments.length > 0 ? (attachments[0].type === 'image' ? 'image' : 'file') : 'text',
      attachments: attachments
    };

    // Optimistic Update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      sender_id: currentUserId,
      receiver_id: messageData.receiver_id,
      group_id: messageData.group_id,
      content: content,
      message_type: messageData.message_type,
      attachments: attachments,
      is_read: false,
      created_at: new Date().toISOString(),
      sender: users.find(u => u.user_id === currentUserId) || undefined
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");

    console.log("ChatWidget: Sending message", messageData);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      toast.error(`Failed to send message: ${error.message}${error.details ? ` (${error.details})` : ''}`);
      console.error("ChatWidget: Error sending message", error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      return;
    }

    console.log("ChatWidget: Message sent successfully", data);
    // Replace optimistic message with real one to get real ID
    setMessages(prev => prev.map(m => m.id === optimisticId ? ({ ...data, sender: optimisticMsg.sender } as ChatMessage) : m));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedGroupMembers.length === 0 || !currentUserId) {
      toast.error("Please enter a name and select members");
      return;
    }

    try {
      // 1. Create Group
      // @ts-ignore
      const { data: groupData, error: groupError } = await (supabase
        .from('chat_groups' as any)
        .insert({
          name: newGroupName,
          created_by: currentUserId
        })
        .select()
        .single() as any);

      if (groupError) throw groupError;

      // 2. Add Members (including creator)
      const membersToAdd = [
        { group_id: groupData.id, user_id: currentUserId },
        ...selectedGroupMembers.map(m => ({ group_id: groupData.id, user_id: m.value }))
      ];

      // @ts-ignore
      const { error: membersError } = await (supabase
        .from('chat_group_members' as any)
        .insert(membersToAdd) as any);

      if (membersError) throw membersError;

      toast.success("Group created successfully");
      setIsCreateGroupOpen(false);
      setNewGroupName("");
      setSelectedGroupMembers([]);
      fetchGroups();

    } catch (error: any) {
      toast.error("Failed to create group");
      console.error(error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
  };

  const userOptions = users.map(u => ({ value: u.user_id, label: u.full_name }));

  useEffect(() => {
    console.log("ChatWidget: Mounted");
  }, []);

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-card border rounded-xl shadow-2xl flex flex-col z-[9999] overflow-hidden text-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold">Team Chat</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Sidebar / Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => { setActiveTab('company'); setSelectedUser(null); setSelectedGroup(null); }}
              className={`flex-1 py-2 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${activeTab === 'company' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
            >
              <Users className="h-4 w-4" />
              General
            </button>
            <button
              onClick={() => { setActiveTab('dm'); setSelectedGroup(null); }}
              className={`flex-1 py-2 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${activeTab === 'dm' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
            >
              <User className="h-4 w-4" />
              DMs
            </button>
            <button
              onClick={() => { setActiveTab('groups'); setSelectedUser(null); }}
              className={`flex-1 py-2 text-xs font-medium flex flex-col items-center gap-1 transition-colors ${activeTab === 'groups' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
                }`}
            >
              <Users className="h-4 w-4" />
              Groups
            </button>
          </div>

          {/* List Views */}
          {(activeTab === 'dm' && !selectedUser) && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {(activeTab === 'groups' && !selectedGroup) && (
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 mb-2">
                      <PlusCircle className="h-4 w-4" /> Create New Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Group Chat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Group Name</Label>
                        <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. Sales Team" />
                      </div>
                      <div className="space-y-2">
                        <Label>Add Members</Label>
                        <Select
                          isMulti
                          options={userOptions}
                          value={selectedGroupMembers}
                          onChange={(val: any) => setSelectedGroupMembers(val)}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateGroup}>Create Group</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="text-xs rounded-lg"><Users className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{group.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Chat View */}
          {((activeTab === 'company') || (activeTab === 'dm' && selectedUser) || (activeTab === 'groups' && selectedGroup)) && (
            <>
              {/* Context Header */}
              {(selectedUser || selectedGroup) && (
                <div className="flex items-center gap-2 p-2 px-3 border-b bg-muted/20 text-xs">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-1" onClick={() => { setSelectedUser(null); setSelectedGroup(null); }}>
                    ←
                  </Button>
                  <span className="font-medium">
                    {selectedUser ? selectedUser.full_name : selectedGroup?.name}
                  </span>
                </div>
              )}

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.map(message => {
                    const isOwn = message.sender_id === currentUserId;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[85%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <Avatar className="h-6 w-6 hidden md:block">
                            <AvatarFallback className="text-[10px]">
                              {getInitials(message.sender?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {!isOwn && (
                              <p className="text-[10px] text-muted-foreground ml-1 mb-0.5">
                                {message.sender?.full_name}
                              </p>
                            )}
                            <div className={`rounded-xl px-3 py-2 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mb-2">
                                  {message.attachments.map((att, idx) => (
                                    att.type === 'image' ? (
                                      <img key={idx} src={att.url} alt="attachment" className="rounded-md max-h-40 object-cover" />
                                    ) : (
                                      <a key={idx} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-background/20 p-2 rounded text-xs underline">
                                        <FileText className="h-3 w-3" /> {att.name}
                                      </a>
                                    )
                                  ))}
                                </div>
                              )}
                              {message.content && <p className="text-xs whitespace-pre-wrap leading-relaxed">{message.content}</p>}
                            </div>
                            <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? 'text-right' : 'text-left'}`}>
                              {format(new Date(message.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t bg-background">
                {isUploading && <p className="text-[10px] text-muted-foreground mb-1 animate-pulse">Uploading...</p>}
                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Message..."
                    className="h-9 min-h-[36px] py-2 text-sm max-h-24"
                  />
                  <Button size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => sendMessage()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[9999] bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span id="chat-badge" className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      )}
    </>
  );
};

export default ChatWidget;
