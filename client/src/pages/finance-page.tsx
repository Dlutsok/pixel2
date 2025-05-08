import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Download, Search, FileText, Receipt, FileCheck, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertFinanceDocumentSchema } from "@shared/schema";

// Схема для создания финансового документа
const financeDocumentFormSchema = insertFinanceDocumentSchema.extend({
  name: z.string().min(3, { message: "Название должно содержать не менее 3 символов" }),
  type: z.enum(["invoice", "receipt", "contract"], { 
    required_error: "Выберите тип документа" 
  }),
  status: z.enum(["pending", "paid", "overdue"], { 
    required_error: "Выберите статус документа" 
  }),
  projectId: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
  dueDate: z.string().optional(),
  path: z.string().default("/uploads/document-placeholder.pdf"),
});

type FinanceDocumentFormValues = z.infer<typeof financeDocumentFormSchema>;

export default function FinancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Fetch finance documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ["/api/finance-documents"],
    enabled: !!user,
  });
  
  // Fetch projects for document association
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });
  
  // Filter documents based on search query
  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  // Group documents by type
  const invoices = filteredDocuments?.filter(doc => doc.type === "invoice") || [];
  const receipts = filteredDocuments?.filter(doc => doc.type === "receipt") || [];
  const contracts = filteredDocuments?.filter(doc => doc.type === "contract") || [];
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Не указано";
    return format(new Date(date), 'd MMMM, yyyy', { locale: ru });
  };
  
  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning hover:bg-warning/20">Ожидает оплаты</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-success/10 text-success hover:bg-success/20">Оплачен</Badge>;
      case "overdue":
        return <Badge variant="outline" className="bg-danger/10 text-danger hover:bg-danger/20">Просрочен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Мутация для создания нового документа
  const createDocumentMutation = useMutation({
    mutationFn: async (data: FinanceDocumentFormValues) => {
      // Преобразовать строковую дату в объект Date перед отправкой
      const formattedData = {
        ...data,
        clientId: user?.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdAt: new Date()
      };
      
      const res = await apiRequest("POST", "/api/finance-documents", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Документ создан",
        description: "Финансовый документ был успешно добавлен"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/finance-documents"] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка при создании документа",
        description: error.message || "Произошла ошибка при добавлении документа",
        variant: "destructive"
      });
    }
  });

  // Форма для создания документа
  const form = useForm<FinanceDocumentFormValues>({
    resolver: zodResolver(financeDocumentFormSchema),
    defaultValues: {
      name: "",
      type: "invoice",
      status: "pending",
      projectId: undefined,
      amount: undefined,
      dueDate: "",
      path: "/uploads/document-placeholder.pdf"
    }
  });

  // Обработчик отправки формы
  function onSubmit(values: FinanceDocumentFormValues) {
    createDocumentMutation.mutate(values);
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-5 w-5 text-primary" />;
      case "receipt":
        return <Receipt className="h-5 w-5 text-success" />;
      case "contract":
        return <FileCheck className="h-5 w-5 text-info" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };
  
  const renderDocumentTable = (docs: typeof documents) => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }
    
    if (!docs || docs.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-neutral-500">Нет документов в этой категории</p>
        </div>
      );
    }
    
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Документ</TableHead>
            <TableHead>Проект</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((doc) => {
            const project = projects?.find(p => p.id === doc.projectId);
            
            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center">
                    {getDocumentIcon(doc.type)}
                    <span className="ml-2 font-medium">{doc.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{project?.name || "—"}</div>
                </TableCell>
                <TableCell>
                  <div>{formatDate(doc.createdAt)}</div>
                  {doc.dueDate && (
                    <div className={cn(
                      "text-xs",
                      doc.status === "overdue" ? "text-danger" : "text-neutral-500"
                    )}>
                      Срок: {formatDate(doc.dueDate)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div>{formatAmount(doc.amount)}</div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(doc.status)}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    <span>Скачать</span>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold font-heading mb-4 md:mb-0">Финансы</h1>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Поиск документов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="whitespace-nowrap gap-1">
                  <Plus className="h-4 w-4" />
                  Добавить документ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Добавить финансовый документ</DialogTitle>
                  <DialogDescription>
                    Заполните форму для создания нового финансового документа
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название</FormLabel>
                          <FormControl>
                            <Input placeholder="Название документа" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип документа</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите тип документа" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="invoice">Счет</SelectItem>
                              <SelectItem value="receipt">Чек</SelectItem>
                              <SelectItem value="contract">Договор</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Статус</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите статус" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Ожидает оплаты</SelectItem>
                              <SelectItem value="paid">Оплачен</SelectItem>
                              <SelectItem value="overdue">Просрочен</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="projectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Проект</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value) || undefined)} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите проект (опционально)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projects?.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Сумма</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Сумма в рублях" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Срок оплаты</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Дата, до которой должен быть оплачен документ
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Отмена
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createDocumentMutation.isPending}
                        className="gap-1"
                      >
                        {createDocumentMutation.isPending && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        Создать документ
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-primary/10 text-primary p-2 rounded-full">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-neutral-500 text-sm">Счета</h3>
              </div>
              <p className="text-3xl font-semibold mt-2">{invoices.length}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {invoices.filter(d => d.status === "pending").length} ожидают оплаты
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-success/10 text-success p-2 rounded-full">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-neutral-500 text-sm">Чеки</h3>
              </div>
              <p className="text-3xl font-semibold mt-2">{receipts.length}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Документы платежей и услуг
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="bg-info/10 text-info p-2 rounded-full">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="text-neutral-500 text-sm">Договоры</h3>
              </div>
              <p className="text-3xl font-semibold mt-2">{contracts.length}</p>
              <p className="text-xs text-neutral-500 mt-1">
                Юридические документы
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Финансовые документы</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Все документы</TabsTrigger>
                <TabsTrigger value="invoices">Счета</TabsTrigger>
                <TabsTrigger value="receipts">Чеки</TabsTrigger>
                <TabsTrigger value="contracts">Договоры</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {renderDocumentTable(filteredDocuments)}
              </TabsContent>
              
              <TabsContent value="invoices">
                {renderDocumentTable(invoices)}
              </TabsContent>
              
              <TabsContent value="receipts">
                {renderDocumentTable(receipts)}
              </TabsContent>
              
              <TabsContent value="contracts">
                {renderDocumentTable(contracts)}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
