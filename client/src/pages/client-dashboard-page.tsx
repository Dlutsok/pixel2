import { useEffect } from "react";
import Layout from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight, FolderClosed, CheckSquare, MessageSquare, BellIcon, Send, Sparkles, CreditCard, CalendarRange, BarChart, Rocket } from "lucide-react";

import MessageItem from "@/components/dashboard/message-item";

export default function ClientDashboardPage() {
  const { user } = useAuth();
  
  // Fetch client projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });
  
  // Fetch tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks"],
    enabled: !!user,
  });
  
  // Fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });
  
  // Get active projects
  const clientProjects = projects?.filter(p => p.clientId === user?.id) || [];
  
  // Get client tasks
  const clientTasks = tasks?.filter(t => 
    clientProjects.some(p => p.id === t.projectId)
  ) || [];
  
  // Get tasks requiring attention
  const tasksRequiringAttention = clientTasks.filter(t => 
    t.status === "client_review" || t.status === "waiting_info"
  ) || [];
  
  // Get unread messages
  const unreadMessages = messages?.filter(m => !m.isRead && m.receiverId === user?.id) || [];
  
  // Get recent messages
  const recentMessages = messages?.filter(m => m.receiverId === user?.id).slice(0, 3) || [];
  
  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-bold">Добро пожаловать, {user?.firstName}!</h1>
          <p className="text-neutral-500">Здесь вы можете управлять вашими проектами и взаимодействовать с командой.</p>
        </div>
        
        {/* Project Summary */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="bento-heading text-2xl">Ваши проекты</h2>
            <Link href="/projects">
              <Button variant="outline" className="text-primary text-sm rounded-lg flex items-center">
                <span>Все проекты</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {isLoadingProjects ? (
            <div className="bento-grid">
              {[1, 2].map((i) => (
                <div className="bento-card bento-card-large" key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-full mb-4" />
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          ) : clientProjects.length > 0 ? (
            <div className="bento-grid">
              {clientProjects.slice(0, 2).map((project) => (
                <div className="bento-card bento-card-large bento-hover-effect" key={project.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg bg-gradient-to-br from-primary to-purple-400 bg-clip-text text-transparent">{project.name}</h3>
                        <div className="flex items-center text-sm text-neutral-500 mt-1">
                          <span>{project.domain || "Домен не указан"}</span>
                        </div>
                      </div>
                      <Badge 
                        className={
                          project.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-200" :
                          project.status === "in_progress" ? "bg-blue-100 text-blue-800 hover:bg-blue-200" :
                          "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        }
                      >
                        {project.status === "completed" ? "Завершен" : 
                         project.status === "in_progress" ? "В работе" : 
                         "Ожидает"}
                      </Badge>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Прогресс проекта</span>
                        <span className="font-semibold text-primary">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-3 rounded-lg bg-neutral-100" />
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center">
                        <CalendarRange className="h-4 w-4 text-neutral-400 mr-2" />
                        <span className="text-neutral-500 mr-2">Дедлайн:</span>
                        <span className="font-medium">
                          {project.endDate 
                            ? format(new Date(project.endDate), 'd MMMM, yyyy', { locale: ru })
                            : "Не указан"}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <Link href={`/projects/${project.id}`}>
                          <Button variant="ghost" className="text-primary hover:bg-primary/10 text-sm">
                            Подробнее
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          ) : (
            <div className="bento-card">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <FolderClosed className="h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-600">У вас пока нет проектов</p>
                </div>
              </CardContent>
            </div>
          )}
        </div>
        
        {/* Special Offers */}
        <div className="mb-8">
          <h2 className="bento-heading text-2xl mb-6">Специальные предложения</h2>
          
          <div className="bento-grid">
            <div className="bento-card bento-hover-effect bg-gradient-to-br from-primary/10 to-purple-300/10 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg bg-gradient-to-br from-primary to-purple-400 bg-clip-text text-transparent">
                      Оптимизация скорости
                    </h3>
                    <p className="text-neutral-600 mt-1">
                      Ускорьте загрузку вашего сайта и повысьте конверсию
                    </p>
                  </div>
                  <div className="bg-primary/10 text-primary p-2 rounded-full">
                    <Rocket className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    Предложение включает диагностику и оптимизацию по 20+ параметрам
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-primary border-primary/30">
                      Скидка 20%
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                      Подробнее
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
            
            <div className="bento-card bento-hover-effect bg-gradient-to-br from-amber-500/10 to-amber-200/10 border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg bg-gradient-to-br from-amber-500 to-orange-400 bg-clip-text text-transparent">
                      Аналитика продаж
                    </h3>
                    <p className="text-neutral-600 mt-1">
                      Подключите бизнес-аналитику к вашему сайту
                    </p>
                  </div>
                  <div className="bg-amber-500/10 text-amber-500 p-2 rounded-full">
                    <BarChart className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-neutral-600">
                    Отслеживайте конверсии, анализируйте поведение пользователей
                  </p>
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                      Новая услуга
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-amber-500 hover:bg-amber-500/10">
                      Подробнее
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
        
        {/* Tasks Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="bento-heading text-2xl">Задачи, требующие вашего внимания</h2>
            <Link href="/tasks">
              <Button variant="outline" className="text-primary text-sm rounded-lg flex items-center">
                <span>Все задачи</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="bento-card">
            {isLoadingTasks ? (
              <div className="p-6">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-16 w-full mb-2" />
                <Skeleton className="h-16 w-full mb-2" />
              </div>
            ) : tasksRequiringAttention.length > 0 ? (
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
                    {tasksRequiringAttention.map((task) => {
                      const project = clientProjects.find(p => p.id === task.projectId);
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
                                ? format(new Date(task.dueDate), 'd MMMM, yyyy', { locale: ru }) 
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
                              <Button variant="ghost" className="text-primary hover:bg-primary/10 rounded-lg">
                                Ответить
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <CheckSquare className="h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-600">У вас нет задач, требующих внимания</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Financial Info & Communication */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Financial Info */}
          <div className="bento-card bento-hover-effect">
            <CardHeader className="pb-2">
              <CardTitle className="bento-heading">Финансовая информация</CardTitle>
              <CardDescription>Ваши платежи и счета</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-4 flex flex-col items-center">
                      <p className="text-sm font-medium text-neutral-500">Текущий баланс</p>
                      <p className="text-2xl font-bold text-primary mt-1">0 ₽</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex flex-col items-center">
                      <p className="text-sm font-medium text-neutral-500">Бонусов</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">1 500 ₽</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="border border-border/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">Последние операции</p>
                    <Link href="/finance">
                      <Button variant="link" className="p-0 h-auto text-primary text-sm">
                        Все финансы
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-3 py-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Оплата хостинга</p>
                          <p className="text-neutral-500 text-xs">15.04.2025</p>
                        </div>
                      </div>
                      <p className="font-medium">12 000 ₽</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Начислены бонусы</p>
                          <p className="text-neutral-500 text-xs">10.04.2025</p>
                        </div>
                      </div>
                      <p className="font-medium text-green-600">+1 500 ₽</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* Communication Section */}
          <div className="bento-card">
            <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center">
              <h3 className="bento-heading">Сообщения от менеджера</h3>
              <Link href="/chat">
                <Button variant="outline" className="text-primary text-sm rounded-lg flex items-center gap-1">
                  <span>Открыть чат</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="divide-y divide-border/40 max-h-[320px] overflow-y-auto">
              {isLoadingMessages ? (
                <div className="p-4 space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMessages.length > 0 ? (
                <>
                  {recentMessages.map((message) => (
                    <MessageItem key={message.id} message={message} />
                  ))}
                </>
              ) : (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <MessageSquare className="h-12 w-12 text-neutral-300 mb-3" />
                    <p className="text-neutral-600">У вас пока нет сообщений</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-4 bg-background border-t border-border/40">
              <div className="flex">
                <Input
                  placeholder="Написать сообщение..."
                  className="rounded-r-none focus-visible:ring-0"
                />
                <Button className="rounded-l-none bg-primary text-white hover:bg-primary/90">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}