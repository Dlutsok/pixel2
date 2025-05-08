import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, MessageSquare, Paperclip, Send } from "lucide-react";

// Comment form schema
const commentFormSchema = z.object({
  content: z.string().min(1, {
    message: "Комментарий не может быть пустым",
  }),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

// Task update schema
const taskUpdateSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
});

type TaskUpdateValues = z.infer<typeof taskUpdateSchema>;

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const taskId = parseInt(params.id);
  const { user } = useAuth();
  
  // Fetch task details
  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ["/api/tasks", taskId],
    enabled: !!taskId && !!user,
  });
  
  // Fetch task comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/tasks", taskId, "comments"],
    enabled: !!taskId && !!user,
  });
  
  // Fetch project data
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["/api/projects", task?.projectId],
    enabled: !!task?.projectId,
  });
  
  // Comment form
  const commentForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Task update form
  const taskUpdateForm = useForm<TaskUpdateValues>({
    resolver: zodResolver(taskUpdateSchema),
    defaultValues: {
      status: task?.status,
      priority: task?.priority,
    },
  });
  
  // Update form values when task data loads
  useState(() => {
    if (task) {
      taskUpdateForm.reset({
        status: task.status,
        priority: task.priority,
      });
    }
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const commentData = {
        ...data,
        taskId,
        createdAt: new Date().toISOString(),
      };
      const res = await apiRequest("POST", `/api/tasks/${taskId}/comments`, commentData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      commentForm.reset();
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskUpdateValues) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });
  
  function onCommentSubmit(values: CommentFormValues) {
    addCommentMutation.mutate(values);
  }
  
  function onStatusChange(status: string) {
    updateTaskMutation.mutate({ status });
  }
  
  function onPriorityChange(priority: string) {
    updateTaskMutation.mutate({ priority });
  }
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Не указано";
    return format(new Date(date), 'd MMMM, yyyy', { locale: ru });
  };
  
  if (isLoadingTask) {
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
  
  if (!task) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-bold mb-2">Задача не найдена</h2>
              <p className="mb-4">Задача не существует или у вас нет доступа к ней.</p>
              <Link href="/tasks">
                <Button>Вернуться к списку задач</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Task Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm text-primary">
            <Link href="/tasks">
              <a className="flex items-center hover:underline">
                <ChevronLeft className="h-4 w-4" />
                <span>Назад к задачам</span>
              </a>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading mb-1">{task.title}</h1>
              <div className="flex items-center gap-3 text-sm">
                {project && (
                  <Link href={`/projects/${project.id}`}>
                    <a className="text-primary hover:underline">{project.name}</a>
                  </Link>
                )}
                <span className="text-neutral-500">
                  Создано: {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Task Details and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Описание задачи</CardTitle>
              </CardHeader>
              <CardContent>
                {task.description ? (
                  <div className="prose max-w-none">
                    <p>{task.description}</p>
                  </div>
                ) : (
                  <p className="text-neutral-500 italic">Описание задачи отсутствует</p>
                )}
                
                {task.attachments && task.attachments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2 text-sm">Прикрепленные файлы</h3>
                    <div className="space-y-2">
                      {task.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center p-2 bg-neutral-50 rounded-md">
                          <Paperclip className="h-4 w-4 mr-2 text-neutral-500" />
                          <span className="text-sm">{attachment}</span>
                          <Button variant="ghost" size="sm" className="ml-auto">
                            Скачать
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статус задачи</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Текущий статус</h3>
                  <Select 
                    defaultValue={task.status} 
                    onValueChange={onStatusChange}
                    disabled={updateTaskMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новая</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="review">На проверке</SelectItem>
                      <SelectItem value="completed">Завершена</SelectItem>
                      <SelectItem value="delayed">Отложена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Приоритет</h3>
                  <Select 
                    defaultValue={task.priority} 
                    onValueChange={onPriorityChange}
                    disabled={updateTaskMutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Срок выполнения</h3>
                  <p>{task.dueDate ? formatDate(task.dueDate) : "Не указан"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Исполнитель</h3>
                  <p>{task.assignedToId ? "Назначен" : "Не назначен"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>Комментарии</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingComments ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : comments && comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                        <span>ИП</span>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="bg-neutral-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Пользователь ID: {comment.userId}</span>
                          <span className="text-xs text-neutral-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p>{comment.content}</p>
                      </div>
                      
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-neutral-500 mb-1">Приложения:</div>
                          <div className="flex flex-wrap gap-2">
                            {comment.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center bg-neutral-100 px-2 py-1 rounded text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                <span>{attachment}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-neutral-500">Комментариев пока нет</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Form {...commentForm}>
              <form onSubmit={commentForm.handleSubmit(onCommentSubmit)} className="w-full">
                <FormField
                  control={commentForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex gap-2">
                        <FormControl>
                          <Textarea
                            placeholder="Напишите комментарий..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="submit"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          disabled={addCommentMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}
