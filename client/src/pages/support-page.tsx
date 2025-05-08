import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { HelpCircle, Search, MessageSquare, Lightbulb, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Support ticket form schema
const supportTicketSchema = z.object({
  title: z.string().min(3, {
    message: "Заголовок должен содержать минимум 3 символа",
  }),
  description: z.string().min(10, {
    message: "Описание должно содержать минимум 10 символов",
  }),
  priority: z.string().default("medium"),
  projectId: z.number().optional(),
});

type SupportTicketValues = z.infer<typeof supportTicketSchema>;

export default function SupportPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");
  
  // Fetch support tickets
  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["/api/support-tickets"],
    enabled: !!user,
  });
  
  // Fetch projects for the select dropdown
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });
  
  // Create support ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: SupportTicketValues) => {
      const ticketData = {
        ...data,
        createdAt: new Date().toISOString(),
      };
      const res = await apiRequest("POST", "/api/support-tickets", ticketData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      form.reset();
    },
  });
  
  // Support ticket form
  const form = useForm<SupportTicketValues>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      projectId: undefined,
    },
  });
  
  function onSubmit(values: SupportTicketValues) {
    createTicketMutation.mutate(values);
  }
  
  // Filter tickets based on search query
  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Не указано";
    return format(new Date(date), 'd MMMM, yyyy', { locale: ru });
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="bg-warning/10 text-warning hover:bg-warning/20">Открыт</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-info/10 text-info hover:bg-info/20">В работе</Badge>;
      case "closed":
        return <Badge variant="outline" className="bg-success/10 text-success hover:bg-success/20">Закрыт</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge variant="outline" className="bg-success/10 text-success hover:bg-success/20">Низкий</Badge>;
      case "medium":
        return <Badge variant="outline" className="bg-warning/10 text-warning hover:bg-warning/20">Средний</Badge>;
      case "high":
        return <Badge variant="outline" className="bg-danger/10 text-danger hover:bg-danger/20">Высокий</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };
  
  // Knowledge base FAQ items
  const faqItems = [
    {
      question: "Как добавить новую секцию на сайт Tilda?",
      answer: "Для добавления новой секции нажмите кнопку «+» в верхней части редактора. Выберите нужный блок из коллекции блоков или создайте свой с нуля. Расположите блок в нужном месте страницы, перетащив его мышью или используя кнопки «↑» и «↓»."
    },
    {
      question: "Как изменить шрифт на сайте?",
      answer: "Для изменения шрифта на всем сайте перейдите в раздел «Настройки проекта» → «Стили проекта» → «Шрифты». Там вы можете выбрать основной шрифт для заголовков и текста. Для изменения шрифта в конкретном блоке, выделите текст и используйте панель форматирования или настройки блока."
    },
    {
      question: "Как настроить форму обратной связи?",
      answer: "Добавьте блок с формой на страницу. Перейдите в настройки блока и укажите, куда должны отправляться данные с формы (на email или в CRM). Настройте поля формы, добавив нужные типы полей (имя, телефон, email и т.д.). Не забудьте добавить уведомление о сборе персональных данных."
    },
    {
      question: "Как подключить свой домен к сайту?",
      answer: "Перейдите в раздел «Домен» в настройках проекта. Выберите опцию «Подключить свой домен». Следуйте инструкциям по настройке DNS-записей у вашего регистратора домена. Обычно нужно создать CNAME-запись, указывающую на домен Tilda. После внесения изменений подтвердите подключение домена в панели Tilda."
    },
    {
      question: "Как добавить скрипт аналитики на сайт?",
      answer: "Перейдите в настройки проекта, выберите раздел «JavaScript и метрики». В соответствующих полях вставьте код счетчика Яндекс.Метрики, Google Analytics или другой системы аналитики. При необходимости вы также можете добавить произвольный JavaScript-код в разделе «Дополнительный код»."
    },
    {
      question: "Как настроить адаптивность сайта для мобильных устройств?",
      answer: "Tilda по умолчанию создает адаптивные сайты. Проверить, как сайт выглядит на мобильных устройствах, можно с помощью кнопки переключения режимов в верхней части редактора. Для более тонкой настройки используйте опцию «Мобильные стили» в настройках каждого блока, где можно регулировать отступы, размеры шрифтов и другие параметры специально для мобильной версии."
    }
  ];

  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold font-heading mb-4 md:mb-0">Поддержка</h1>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Поиск в поддержке..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="tickets" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>Мои обращения</span>
            </TabsTrigger>
            <TabsTrigger value="new-ticket" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>Новое обращение</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span>База знаний</span>
            </TabsTrigger>
          </TabsList>
          
          {/* My Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Мои обращения в поддержку</CardTitle>
                <CardDescription>История ваших обращений в службу поддержки</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTickets ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : filteredTickets && filteredTickets.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => {
                      const project = projects?.find(p => p.id === ticket.projectId);
                      
                      return (
                        <Card key={ticket.id} className="border border-neutral-200">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                              <div>
                                <h3 className="font-medium text-lg mb-1">{ticket.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {getStatusBadge(ticket.status)}
                                  {getPriorityBadge(ticket.priority)}
                                  {project && (
                                    <Badge variant="outline" className="bg-primary/10 text-primary">
                                      {project.name}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-neutral-600 line-clamp-2">
                                  {ticket.description}
                                </p>
                              </div>
                              <div className="text-sm text-neutral-500 shrink-0">
                                <div>Создано: {formatDate(ticket.createdAt)}</div>
                                {ticket.updatedAt && (
                                  <div>Обновлено: {formatDate(ticket.updatedAt)}</div>
                                )}
                                {ticket.closedAt && (
                                  <div>Закрыто: {formatDate(ticket.closedAt)}</div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">У вас пока нет обращений</h3>
                    <p className="text-neutral-500 mb-4">
                      Создайте новое обращение, если у вас возникли вопросы или проблемы
                    </p>
                    <Button onClick={() => setActiveTab("new-ticket")}>
                      Создать обращение
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* New Ticket Tab */}
          <TabsContent value="new-ticket">
            <Card>
              <CardHeader>
                <CardTitle>Создать новое обращение</CardTitle>
                <CardDescription>
                  Опишите проблему или вопрос, и наши специалисты помогут вам в ближайшее время
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тема обращения</FormLabel>
                          <FormControl>
                            <Input placeholder="Укажите тему обращения" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание проблемы</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Опишите вашу проблему или вопрос подробно..."
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Чем подробнее вы опишете проблему, тем быстрее мы сможем помочь.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Проект (необязательно)</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                                value={field.value?.toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите проект" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Не выбрано</SelectItem>
                                  {projects?.map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Выберите проект, если обращение связано с конкретным проектом
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Приоритет</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите приоритет" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Низкий</SelectItem>
                                  <SelectItem value="medium">Средний</SelectItem>
                                  <SelectItem value="high">Высокий</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full md:w-auto"
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Отправка..." : "Отправить обращение"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Knowledge Base Tab */}
          <TabsContent value="knowledge">
            <Card>
              <CardHeader>
                <CardTitle>База знаний</CardTitle>
                <CardDescription>
                  Ответы на часто задаваемые вопросы по работе с платформой Tilda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-neutral-700">
                          {item.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
              <CardFooter className="flex flex-col text-center">
                <p className="text-neutral-500 mb-2">Не нашли ответ на свой вопрос?</p>
                <Button onClick={() => setActiveTab("new-ticket")}>
                  Создать обращение в поддержку
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
