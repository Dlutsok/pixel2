import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Layout from "@/components/layout/layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertProjectSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Project form schema
const projectFormSchema = insertProjectSchema.extend({
  name: z.string().min(3, {
    message: "Название проекта должно содержать минимум 3 символа",
  }),
  description: z.string().min(10, {
    message: "Описание проекта должно содержать минимум 10 символов",
  }),
  domain: z.string().optional(),
  status: z.enum(["new", "in_progress", "paused", "completed", "archived"]).default("new"),
  budget: z.coerce.number().min(0).optional(),
  startDate: z.date().or(z.string().min(1, "Дата начала обязательна").transform((val) => new Date(val))),
  endDate: z.date().optional().or(z.string().optional().transform((val) => val ? new Date(val) : undefined)),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function ProjectNewPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  // Получаем список клиентов (только для менеджеров и администраторов)
  const { data: clients = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ["/api/users/clients"],
    queryFn: async () => {
      if (user?.role !== "admin" && user?.role !== "manager") return [];
      
      console.log("Fetching clients, user role:", user?.role);
      try {
        const res = await apiRequest("GET", "/api/users/clients");
        const data = await res.json();
        console.log("Clients data received:", data);
        return data;
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast({
          title: "Ошибка загрузки клиентов",
          description: error instanceof Error ? error.message : "Не удалось загрузить список клиентов",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: user?.role === "admin" || user?.role === "manager"
  });

  // Получаем список менеджеров (только для администраторов)
  const { data: managers = [], isLoading: isManagersLoading } = useQuery({
    queryKey: ["/api/users/managers"],
    queryFn: async () => {
      if (user?.role !== "admin") return [];
      
      console.log("Fetching managers, user role:", user?.role);
      try {
        const res = await apiRequest("GET", "/api/users/managers");
        const data = await res.json();
        console.log("Managers data received:", data);
        return data;
      } catch (error) {
        console.error("Error fetching managers:", error);
        toast({
          title: "Ошибка загрузки менеджеров",
          description: error instanceof Error ? error.message : "Не удалось загрузить список менеджеров",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: user?.role === "admin"
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Zod уже преобразовал даты в объекты Date благодаря трансформации в схеме
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Проект создан",
        description: "Ваш проект был успешно создан",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate(`/projects/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Ошибка при создании проекта",
        description: error.message || "Что-то пошло не так",
        variant: "destructive",
      });
    },
  });
  
  // Project form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      domain: "",
      status: "new",
      clientId: user?.id,
      managerId: null,
      progress: 0,
      budget: undefined,
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
    },
  });
  
  async function onSubmit(values: ProjectFormValues) {
    try {
      // Создаем проект
      const project = await createProjectMutation.mutateAsync(values);
      
      // Перенаправляем на страницу проекта
      navigate(`/projects/${project.id}`);
    } catch (error) {
      toast({
        title: "Ошибка при создании проекта",
        description: error instanceof Error ? error.message : "Что-то пошло не так",
        variant: "destructive",
      });
    }
  }
  
  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold font-heading">Создание нового проекта</h1>
          <p className="text-neutral-500">Заполните информацию о новом проекте</p>
        </div>
        
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Информация о проекте</CardTitle>
            <CardDescription>
              Введите основные данные о вашем проекте. Вы сможете дополнить информацию позже.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название проекта</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название проекта" {...field} />
                      </FormControl>
                      <FormDescription>
                        Должно быть понятным и отражать суть проекта
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание проекта</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Опишите ваш проект подробнее..." 
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Опишите цели, задачи и особенности проекта
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Домен (если есть)</FormLabel>
                        <FormControl>
                          <Input placeholder="example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Бюджет (₽)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Укажите бюджет" 
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата начала</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Предполагаемая дата завершения</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Поле выбора клиента (только для админов и менеджеров) */}
                {(user?.role === "admin" || user?.role === "manager") && (
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Клиент</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                          disabled={isClientsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isClientsLoading ? "Загрузка клиентов..." : "Выберите клиента"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients && clients.length > 0 ? (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.firstName} {client.lastName} ({client.email})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-clients" disabled>
                                {isClientsLoading ? "Загрузка..." : "Нет доступных клиентов"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Выберите клиента для данного проекта
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Поле выбора менеджера (только для админов) */}
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
                          disabled={isManagersLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isManagersLoading ? "Загрузка менеджеров..." : "Выберите менеджера"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers && managers.length > 0 ? (
                              managers.map((manager) => (
                                <SelectItem key={manager.id} value={manager.id.toString()}>
                                  {manager.firstName} {manager.lastName} ({manager.email})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-managers" disabled>
                                {isManagersLoading ? "Загрузка..." : "Нет доступных менеджеров"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Выберите менеджера, ответственного за проект
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}


                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createProjectMutation.isPending}
                  >
                    {createProjectMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание проекта...
                      </>
                    ) : (
                      "Создать проект"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}