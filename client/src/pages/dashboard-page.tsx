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

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch projects
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
  
  // Fetch activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities"],
    enabled: !!user,
  });
  
  // Get active projects
  const activeProjects = projects?.filter(p => p.status === "in_progress") || [];
  
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
        </div>
        
        {/* Active Projects */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold font-heading">Активные проекты</h2>
            <Link href="/projects">
              <Button variant="link" className="text-primary text-sm flex items-center">
                <span>Все проекты</span>
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Button>
            </Link>
          </div>
          
          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-2 w-full mb-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.slice(0, 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p>У вас пока нет активных проектов</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Recent Tasks */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold font-heading">Последние задачи</h2>
            <Link href="/tasks">
              <Button variant="link" className="text-primary text-sm flex items-center">
                <span>Все задачи</span>
                <span className="material-icons text-sm ml-1">arrow_forward</span>
              </Button>
            </Link>
          </div>
          
          <Card>
            {isLoadingTasks ? (
              <div className="p-4">
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
              <div className="p-6 text-center">
                <p>У вас пока нет задач</p>
              </div>
            )}
          </Card>
        </div>
        
        {/* Recent Communications & Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Communications */}
          <Card>
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
              <h3 className="font-medium">Последние сообщения</h3>
              <Link href="/chat">
                <Button variant="link" className="text-primary text-sm">Открыть чат</Button>
              </Link>
            </div>
            
            <div className="divide-y divide-neutral-200 max-h-80 overflow-y-auto">
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
                <div className="p-6 text-center">
                  <p>У вас пока нет сообщений</p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
              <div className="flex">
                <Input
                  placeholder="Написать сообщение..."
                  className="rounded-r-none focus-visible:ring-0"
                />
                <Button className="rounded-l-none">
                  <span className="material-icons">send</span>
                </Button>
              </div>
            </div>
          </Card>
          
          {/* Activity */}
          <Card>
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="font-medium">Последние активности</h3>
            </div>
            
            <div className="px-6 py-3 max-h-80 overflow-y-auto">
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
                <div className="text-center py-4">
                  <p>Нет недавних активностей</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
