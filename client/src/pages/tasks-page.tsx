import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Search, Plus, Filter, SlidersHorizontal } from "lucide-react";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(3, {
    message: "Название задачи должно содержать минимум 3 символа",
  }),
  description: z.string().optional(),
  priority: z.string().default("medium"),
  projectId: z.number({
    required_error: "Выберите проект",
  }),
  dueDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TasksPage() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get projectId from URL if present
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const urlProjectId = urlParams.get("projectId");
  const initialProjectId = urlProjectId ? parseInt(urlProjectId) : undefined;
  
  // Fetch tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks", { projectId: initialProjectId }],
    enabled: !!user,
  });
  
  // Fetch projects for the select dropdown
  const { data: projects, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log("Tasks page: Projects loaded successfully:", data);
    },
    onError: (err) => {
      console.error("Tasks page: Error loading projects:", err);
    },
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const taskData = {
        ...data,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      const res = await apiRequest("POST", "/api/tasks", taskData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      setIsDialogOpen(false);
    },
  });
  
  // Task form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      projectId: initialProjectId || undefined,
      dueDate: "",
    },
  });
  
  function onSubmit(values: TaskFormValues) {
    createTaskMutation.mutate(values);
  }
  
  // Filter tasks based on search query, status, and priority
  const filteredTasks = tasks?.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(task.status);
    
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(task.priority);
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  const getStatusOptions = () => {
    const statuses = [
      { value: "new", label: "Новая" },
      { value: "in_progress", label: "В работе" },
      { value: "review", label: "На проверке" },
      { value: "completed", label: "Завершена" },
      { value: "delayed", label: "Отложена" },
    ];
    
    return statuses;
  };
  
  const getPriorityOptions = () => {
    const priorities = [
      { value: "low", label: "Низкий" },
      { value: "medium", label: "Средний" },
      { value: "high", label: "Высокий" },
    ];
    
    return priorities;
  };
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Не указано";
    return format(new Date(date), 'd MMMM, yyyy', { locale: ru });
  };

  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold font-heading mb-4 md:mb-0">Задачи</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <SlidersHorizontal size={16} />
                  <span className="hidden sm:inline">Статус</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {getStatusOptions().map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.value}
                    checked={statusFilter.includes(status.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilter([...statusFilter, status.value]);
                      } else {
                        setStatusFilter(statusFilter.filter((s) => s !== status.value));
                      }
                    }}
                  >
                    {status.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter size={16} />
                  <span className="hidden sm:inline">Приоритет</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {getPriorityOptions().map((priority) => (
                  <DropdownMenuCheckboxItem
                    key={priority.value}
                    checked={priorityFilter.includes(priority.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPriorityFilter([...priorityFilter, priority.value]);
                      } else {
                        setPriorityFilter(priorityFilter.filter((p) => p !== priority.value));
                      }
                    }}
                  >
                    {priority.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  <span>Новая задача</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>Создать новую задачу</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о задаче. После создания она появится в списке задач.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название задачи</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите название задачи" {...field} />
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
                              placeholder="Опишите задачу подробнее..." 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="projectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Проект</FormLabel>
                            <FormControl>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите проект" />
                                </SelectTrigger>
                                <SelectContent>
                                  {projects?.map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
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
                    
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Срок выполнения</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createTaskMutation.isPending}
                      >
                        {createTaskMutation.isPending ? "Создание..." : "Создать задачу"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Card>
          {isLoadingTasks ? (
            <CardContent className="p-6">
              <Skeleton className="h-10 w-full mb-4" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          ) : filteredTasks && filteredTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Задача</TableHead>
                    <TableHead>Проект</TableHead>
                    <TableHead>Срок</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Приоритет</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const project = projects?.find(p => p.id === task.projectId);
                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs text-neutral-500">
                            {task.commentCount > 0 ? `${task.commentCount} комментариев` : 'Без комментариев'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{project?.name || "Неизвестный проект"}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {task.dueDate 
                              ? formatDate(task.dueDate) 
                              : "Без срока"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TaskStatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <TaskPriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/tasks/${task.id}`}>
                            <Button variant="link" className="text-primary">Подробнее</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">Нет задач</h3>
              <p className="text-neutral-500 mb-6">
                {searchQuery || statusFilter.length > 0 || priorityFilter.length > 0
                  ? "Нет задач, соответствующих заданным критериям" 
                  : "У вас пока нет задач. Создайте первую задачу, чтобы начать работу."}
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Создать задачу
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  {/* Form content already defined above */}
                </DialogContent>
              </Dialog>
            </CardContent>
          )}
        </Card>
      </div>
    </Layout>
  );
}
