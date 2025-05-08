import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";
import { Search, Send, PaperclipIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Message form schema
const messageFormSchema = z.object({
  content: z.string().min(1, {
    message: "Сообщение не может быть пустым",
  }),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

export default function ChatPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  
  // Fetch contacts (managers, admins)
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["/api/users/contacts"],
    enabled: !!user,
  });
  
  // Fetch messages with selected contact
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages", { partnerId: selectedContact }],
    enabled: !!user && selectedContact !== null,
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageFormValues & { receiverId: number }) => {
      const messageData = {
        ...data,
        createdAt: new Date().toISOString(),
      };
      const res = await apiRequest("POST", "/api/messages", messageData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      form.reset();
    },
  });
  
  // Message form
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      content: "",
    },
  });
  
  function onSubmit(values: MessageFormValues) {
    if (!selectedContact) return;
    
    sendMessageMutation.mutate({
      ...values,
      receiverId: selectedContact,
    });
  }
  
  // Filter contacts by search query
  const filteredContacts = contacts?.filter((contact) => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });
  
  // Group messages by date
  const groupedMessages = messages?.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    
    groups[dateStr].push(message);
    return groups;
  }, {} as Record<string, typeof messages>) || {};
  
  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (isToday(date)) {
      return "Сегодня";
    } else if (isYesterday(date)) {
      return "Вчера";
    } else {
      return format(date, 'd MMMM, yyyy', { locale: ru });
    }
  };
  
  const formatMessageTime = (dateStr: string) => {
    return format(new Date(dateStr), 'HH:mm');
  };
  
  // Mock contacts data if none loaded yet
  const mockContacts = [
    { id: 1, firstName: 'Анна', lastName: 'Менеджер', role: 'manager', avatarInitials: 'АМ' },
    { id: 2, firstName: 'Дмитрий', lastName: 'Консультант', role: 'manager', avatarInitials: 'ДК' },
    { id: 3, firstName: 'Мария', lastName: 'Админ', role: 'admin', avatarInitials: 'МА' }
  ];
  
  const getContacts = () => {
    if (isLoadingContacts) return [];
    return filteredContacts || mockContacts;
  };

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-68px-61px)]">
        <div className="flex h-full">
          {/* Contacts sidebar */}
          <div className="w-full md:w-80 border-r border-neutral-200 bg-white flex flex-col">
            <div className="p-4 border-b border-neutral-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
                <Input
                  placeholder="Поиск контактов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {isLoadingContacts ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {getContacts().map((contact) => (
                    <Button
                      key={contact.id}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-3 py-4 h-auto",
                        selectedContact === contact.id && "bg-neutral-100"
                      )}
                      onClick={() => setSelectedContact(contact.id)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary text-white">
                          {contact.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                        <div className="text-xs text-neutral-500">
                          {contact.role === 'manager' ? 'Менеджер' : 'Администратор'}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Chat area */}
          <div className="hidden md:flex flex-col flex-1">
            {selectedContact ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-neutral-200 bg-white flex items-center">
                  {getContacts().find(c => c.id === selectedContact) && (
                    <>
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-primary text-white">
                          {getContacts().find(c => c.id === selectedContact)?.avatarInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {getContacts().find(c => c.id === selectedContact)?.firstName}{' '}
                          {getContacts().find(c => c.id === selectedContact)?.lastName}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {getContacts().find(c => c.id === selectedContact)?.role === 'manager' 
                            ? 'Менеджер' 
                            : 'Администратор'}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Chat messages */}
                <ScrollArea className="flex-1 p-4">
                  {isLoadingMessages ? (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Skeleton className="h-20 w-2/3 rounded-lg" />
                      </div>
                      <div className="flex justify-start">
                        <Skeleton className="h-20 w-2/3 rounded-lg" />
                      </div>
                      <div className="flex justify-end">
                        <Skeleton className="h-20 w-2/3 rounded-lg" />
                      </div>
                    </div>
                  ) : messages && messages.length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(groupedMessages).map(([dateStr, dateMessages]) => (
                        <div key={dateStr}>
                          <div className="text-center mb-4">
                            <span className="text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-600">
                              {formatMessageDate(dateStr)}
                            </span>
                          </div>
                          
                          <div className="space-y-4">
                            {dateMessages.map((message) => (
                              <div 
                                key={message.id}
                                className={cn(
                                  "flex",
                                  message.senderId === user?.id ? "justify-end" : "justify-start"
                                )}
                              >
                                <div 
                                  className={cn(
                                    "max-w-[70%] rounded-lg p-3",
                                    message.senderId === user?.id 
                                      ? "bg-primary text-white rounded-br-none"
                                      : "bg-neutral-100 text-neutral-800 rounded-bl-none"
                                  )}
                                >
                                  <p>{message.content}</p>
                                  <div 
                                    className={cn(
                                      "text-xs mt-1 text-right",
                                      message.senderId === user?.id 
                                        ? "text-primary-foreground/70"
                                        : "text-neutral-500"
                                    )}
                                  >
                                    {formatMessageTime(message.createdAt)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Нет сообщений</h3>
                        <p className="text-neutral-500">
                          Начните беседу, отправив первое сообщение
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
                
                {/* Message input */}
                <div className="p-4 border-t border-neutral-200 bg-white">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                      >
                        <PaperclipIcon className="h-5 w-5 text-neutral-500" />
                      </Button>
                      
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder="Напишите сообщение..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={sendMessageMutation.isPending}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </form>
                  </Form>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-xl font-medium mb-2">Выберите контакт</h3>
                  <p className="text-neutral-500">
                    Выберите контакт из списка слева, чтобы начать общение
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
