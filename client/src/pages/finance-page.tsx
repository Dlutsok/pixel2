import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Download, Search, FileText, Receipt, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FinancePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
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
