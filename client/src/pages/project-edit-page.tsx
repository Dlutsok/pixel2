import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, X, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// Схема валидации формы проекта
const projectFormSchema = z.object({
  name: z.string().min(3, "Название должно содержать не менее 3 символов"),
  description: z.string().optional(),
  domain: z.string().optional(),
  status: z.enum(["new", "in_progress", "paused", "completed", "archived"]),
  progress: z.coerce.number().min(0).max(100).default(0),
  startDate: z.date(),
  endDate: z.date().optional().or(z.string().optional().transform((val) => val ? new Date(val) : undefined)),
  currentPhase: z.string().optional(),
  clientId: z.coerce.number(),
  managerId: z.coerce.number().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function ProjectEditPage() {
  const [location, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Получаем параметр tab из URL, если он есть
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const activeTab = searchParams.get('tab');
  
  // Получаем данные проекта
  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });
  
  // Получаем список существующих файлов
  const { data: existingFiles = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId && !!user,
  });

  // Получаем список клиентов (только для менеджеров и администраторов)
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/users/clients"],
    queryFn: async () => {
      if (user?.role !== "admin" && user?.role !== "manager") return [];
      const res = await fetch("/api/users/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: !!user && (user.role === "admin" || user.role === "manager"),
  });
  
  // Получаем список менеджеров (только для администраторов)
  const { data: managers = [] } = useQuery({
    queryKey: ["/api/users/managers"],
    queryFn: async () => {
      if (user?.role !== "admin") return [];
      const res = await fetch("/api/users/managers");
      if (!res.ok) throw new Error("Failed to fetch managers");
      return res.json();
    },
    enabled: !!user && user.role === "admin",
  });
  
  // Инициализация формы
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      domain: "",
      status: "new",
      progress: 0,
      startDate: new Date(),
      clientId: 0,
      managerId: undefined,
    },
  });
  
  // Обновление значений формы при загрузке проекта
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || "",
        domain: project.domain || "",
        status: project.status,
        progress: project.progress,
        startDate: new Date(project.startDate),
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        currentPhase: project.currentPhase || "",
        clientId: project.clientId,
        managerId: project.managerId || undefined,
      });
    }
  }, [project, form]);
  
  // Мутация для обновления проекта
  const updateProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      console.log("Updating project with ID:", projectId);
      console.log("Form data:", JSON.stringify(data, null, 2));
      try {
        const res = await apiRequest("PATCH", `/api/projects/${projectId}`, data);
        const result = await res.json();
        console.log("Update successful, response:", JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error("Error in updateProjectMutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Project update mutation succeeded:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Проект обновлен",
        description: "Изменения успешно сохранены.",
      });
    },
    onError: (error: Error) => {
      console.error("Project update mutation failed:", error);
      toast({
        title: "Ошибка при обновлении проекта",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Мутация для удаления файла
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const res = await apiRequest("DELETE", `/api/project-files/${fileId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
      toast({
        title: "Файл удален",
        description: "Файл был успешно удален из проекта.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка при удалении файла",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Обработка выбора файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  // Удаление файла из списка выбранных
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Открытие диалога выбора файлов
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Удаление существующего файла
  const handleDeleteFile = (fileId: number) => {
    if (confirm("Вы уверены, что хотите удалить этот файл? Это действие невозможно отменить.")) {
      deleteFileMutation.mutate(fileId);
    }
  };

  // Отправка формы
  async function onSubmit(values: ProjectFormValues) {
    try {
      // Обновляем проект
      await updateProjectMutation.mutateAsync(values);
      
      // Если есть выбранные файлы, загружаем их
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append('projectId', projectId.toString());
        
        // Добавляем все файлы в FormData
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        // Загружаем файлы
        const uploadRes = await fetch('/api/project-files/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error('Failed to upload files');
        } else {
          setSelectedFiles([]);
          queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "files"] });
        }
      }
      
      // Перенаправляем на страницу проекта
      navigate(`/projects/${projectId}`);
    } catch (error) {
      toast({
        title: "Ошибка при обновлении проекта",
        description: error instanceof Error ? error.message : "Произошла неизвестная ошибка",
        variant: "destructive",
      });
    }
  }
  
  // Проверка доступа
  if (user?.role === "client") {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Нет доступа</h2>
              <p className="mb-4">У вас нет прав для редактирования проектов.</p>
              <Button onClick={() => navigate("/projects")}>Вернуться к проектам</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="mb-6">
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-5 w-1/4" />
          </div>
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }
  
  if (!project) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Проект не найден</h2>
              <p className="mb-4">Проект не существует или у вас нет доступа к нему.</p>
              <Button onClick={() => navigate("/projects")}>Вернуться к списку проектов</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm text-primary">
            <Button variant="link" className="p-0" onClick={() => navigate(`/projects/${projectId}`)}>
              <ChevronLeft className="h-4 w-4" />
              <span>Назад к проекту</span>
            </Button>
          </div>
          <h1 className="text-2xl font-bold font-heading">Редактирование проекта</h1>
        </div>
        
        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Если в URL есть параметр tab=files, прокручиваем до секции файлов */}
            {activeTab === 'files' && (
              <div ref={(el) => {
                if (el) {
                  setTimeout(() => {
                    const filesSection = document.getElementById('files-section');
                    if (filesSection) {
                      filesSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }
              }}></div>
            )}
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название проекта*</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название проекта" {...field} />
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
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Введите описание проекта"
                          className="min-h-32"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Домен сайта</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">Новый</SelectItem>
                            <SelectItem value="in_progress">В работе</SelectItem>
                            <SelectItem value="paused">Приостановлен</SelectItem>
                            <SelectItem value="completed">Завершен</SelectItem>
                            <SelectItem value="archived">Архивирован</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Прогресс (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currentPhase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текущий этап</FormLabel>
                      <FormControl>
                        <Input placeholder="Например: Дизайн, Верстка, Тестирование" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Дата начала*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(field.value, "d MMMM yyyy", { locale: ru })
                                ) : (
                                  <span>Выберите дату</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Дата завершения</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className="pl-3 text-left font-normal"
                              >
                                {field.value ? (
                                  format(new Date(field.value), "d MMMM yyyy", { locale: ru })
                                ) : (
                                  <span>Выберите дату</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Участники проекта */}
            <Card>
              <CardHeader>
                <CardTitle>Участники проекта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Клиент*</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите клиента" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.firstName} {client.lastName}
                              {client.company && ` (${client.company})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {user?.role === "admin" && (
                  <FormField
                    control={form.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Менеджер</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите менеджера" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Не выбран</SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id.toString()}>
                                {manager.firstName} {manager.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Оставьте пустым, если менеджер еще не назначен
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
            
            {/* Файлы проекта */}
            <Card id="files-section">
              <CardHeader>
                <CardTitle>Файлы проекта</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Загрузка новых файлов */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Загрузить новые файлы</h3>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openFileSelector}
                    className="mb-3"
                  >
                    Выбрать файлы
                  </Button>
                  
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <h4 className="text-sm font-medium">Выбранные файлы:</h4>
                      <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between px-3 py-2 hover:bg-neutral-50"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-sm">{file.name}</span>
                              <span className="text-xs text-neutral-500">
                                {(file.size / 1024).toFixed(2)} KB
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Существующие файлы */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Существующие файлы</h3>
                  {isLoadingFiles ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : existingFiles.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
                      {existingFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-neutral-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-sm">{file.name}</p>
                            <p className="text-xs text-neutral-500">
                              {format(new Date(file.uploadedAt), 'd MMM, yyyy', { locale: ru })} • 
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/api/project-files/${file.id}/download`, '_blank')}
                            >
                              Скачать
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-md">
                      <p className="text-neutral-500">Файлов пока нет</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/projects/${projectId}`)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={updateProjectMutation.isPending}
              >
                {updateProjectMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Layout>
  );
}