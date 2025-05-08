import { useEffect } from "react";
import Layout from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatsCard from "@/components/dashboard/stats-card";
import ProjectCard from "@/components/dashboard/project-card";
import ActivityItem from "@/components/dashboard/activity-item";
import MessageItem from "@/components/dashboard/message-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TaskStatusBadge from "@/components/tasks/task-status-badge";
import TaskPriorityBadge from "@/components/tasks/task-priority-badge";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight, FolderClosed, CheckSquare, MessageSquare, BellIcon, Send } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log("Dashboard: Projects loaded successfully:", data);
    },
    onError: (err) => {
      console.error("Dashboard: Error loading projects:", err);
    },
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
  
  // Fetch activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });
  
  // Get active projects
  const activeProjects = projects?.filter(p => p.status === "in_progress" || p.status === "new") || [];
  
  // Get tasks in progress
  const tasksInProgress = tasks?.filter(t => t.status === "in_progress") || [];
  
  // Get unread messages
  const unreadMessages = messages?.filter(m => !m.isRead && m.receiverId === user?.id) || [];
  
  // Get recent tasks
  const recentTasks = tasks?.slice(0, 4) || [];
  
  // Get recent messages
  const recentMessages = messages?.slice(0, 3) || [];
  
  // Get recent activities
  const recentActivities = activities?.slice(0, 5) || [];

  return (
    <Layout>
      <div className="p-6 flex-1">
        {/* Stats Row */}
        <div className="bento-grid mb-8">
          <StatsCard 
            title="Активные проекты"
            value={activeProjects.length.toString()}
            subtitle={`из ${projects?.length || 0} всего`}
            icon="folder"
            color="primary"
            isLoading={isLoadingProjects}
          />
          
          <StatsCard 
            title="Задачи в работе"
            value={tasksInProgress.length.toString()}
            subtitle={`${tasksInProgress.filter(t => t.priority === "high").length} требуют вашего внимания`}
            icon="task"
            color="warning"
            isLoading={isLoadingTasks}
          />
          
          <StatsCard 
            title="Непрочитанные сообщения"
            value={unreadMessages.length.toString()}
            subtitle={unreadMessages.length > 0 ? `Последнее от ${unreadMessages[0].senderId}` : "Нет непрочитанных сообщений"}
            icon="chat"
            color="secondary"
            isLoading={isLoadingMessages}
          />
          
          <StatsCard 
            title="Доход месяца"
            value="36 200 ₽"
            subtitle="13 оплаченных счетов"
            icon="finance"
            color="success"
            isLoading={isLoadingProjects}
          />
        </div>
        
        {/* Active Projects */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="bento-heading text-2xl">Активные проекты</h2>
            <Link href="/projects">
              <Button variant="outline" className="text-primary text-sm rounded-lg flex items-center">
                <span>Все проекты</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div className="bento-card" key={i}>
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
          ) : activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.slice(0, 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="bento-card">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center">
                  <FolderClosed className="h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-600">У вас пока нет активных проектов</p>
                </div>
              </CardContent>
            </div>
          )}
        </div>
        
        {/* Recent Tasks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="bento-heading text-2xl">Последние задачи</h2>
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
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentTasks.length > 0 ? (
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
                    {recentTasks.map((task) => {
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
                                Подробнее
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
                  <FolderClosed className="h-12 w-12 text-neutral-300 mb-3" />
                  <p className="text-neutral-600">У вас пока нет задач</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Communications & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Communications */}
          <div className="bento-card">
            <div className="px-6 py-4 border-b border-border/40 flex justify-between items-center">
              <h3 className="bento-heading">Последние сообщения</h3>
              <Link href="/chat">
                <Button variant="outline" className="text-primary text-sm rounded-lg flex items-center gap-1">
                  <span>Открыть чат</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
              {isLoadingMessages ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
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
          
          {/* Activity */}
          <div className="bento-card">
            <div className="px-6 py-4 border-b border-border/40">
              <h3 className="bento-heading">Последние активности</h3>
            </div>
            
            <div className="px-6 py-4 max-h-80 overflow-y-auto">
              {isLoadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="ml-6 relative">
                      <Skeleton className="absolute -left-6 h-4 w-4 rounded-full" />
                      <div className="pl-4">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="relative">
                  {recentActivities.map((activity, index) => (
                    <ActivityItem 
                      key={activity.id} 
                      activity={activity} 
                      isLast={index === recentActivities.length - 1} 
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="flex flex-col items-center">
                    <BellIcon className="h-12 w-12 text-neutral-300 mb-3" />
                    <p className="text-neutral-600">Нет недавних активностей</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
