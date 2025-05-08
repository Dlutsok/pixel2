import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import ActivityItem from "@/components/dashboard/activity-item";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { File, Calendar, Users, ChevronLeft, Download } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id);
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId && !!user,
  });
  
  // Fetch project phases
  const { data: phases, isLoading: isLoadingPhases } = useQuery({
    queryKey: ["/api/projects", projectId, "phases"],
    enabled: !!projectId && !!user,
  });
  
  // Fetch project tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks", { projectId }],
    enabled: !!projectId && !!user,
  });
  
  // Fetch project files
  const { data: files, isLoading: isLoadingFiles } = useQuery({
    queryKey: ["/api/projects", projectId, "files"],
    enabled: !!projectId && !!user,
  });
  
  // Fetch project activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities", { projectId }],
    enabled: !!projectId && !!user,
  });
  
  // Fetch client data
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["/api/user", project?.clientId],
    enabled: !!project?.clientId,
  });
  
  // Fetch manager data
  const { data: manager, isLoading: isLoadingManager } = useQuery({
    queryKey: ["/api/user", project?.managerId],
    enabled: !!project?.managerId,
  });
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Не указано";
    return format(new Date(date), 'd MMMM, yyyy', { locale: ru });
  };
  
  if (isLoadingProject) {
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
              <Link href="/projects">
                <Button>Вернуться к списку проектов</Button>
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
        {/* Project Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm text-primary">
            <Link href="/projects">
              <a className="flex items-center hover:underline">
                <ChevronLeft className="h-4 w-4" />
                <span>Назад к проектам</span>
              </a>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading mb-1">{project.name}</h1>
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                {project.domain && (
                  <span>{project.domain}</span>
                )}
                <ProjectStatusBadge status={project.status} />
              </div>
            </div>
            
            {user?.role !== "client" && (
              <Button onClick={() => navigate(`/projects/${projectId}/edit`)}>
                Редактировать проект
              </Button>
            )}
          </div>
        </div>
        
        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Обзор проекта</CardTitle>
              </CardHeader>
              <CardContent>
                {project.description ? (
                  <p className="mb-4">{project.description}</p>
                ) : (
                  <p className="mb-4 text-neutral-500 italic">Описание проекта отсутствует</p>
                )}
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Общий прогресс</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Временные рамки</h3>
                      <div className="text-sm text-neutral-500">
                        <div>Начало: {formatDate(project.startDate)}</div>
                        <div>Дедлайн: {formatDate(project.endDate)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Команда проекта</h3>
                      <div className="text-sm text-neutral-500">
                        {isLoadingClient || isLoadingManager ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <>
                            <div>Клиент: {client ? `${client.firstName} ${client.lastName}` : "Не указан"}</div>
                            <div>Менеджер: {manager ? `${manager.firstName} ${manager.lastName}` : "Не назначен"}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-primary/10 text-primary p-2 rounded-lg mr-3">
                      <File className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Текущий этап</h3>
                      <p className="text-sm text-neutral-500">
                        {project.currentPhase || "Не указан"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Задачи</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : tasks && tasks.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Завершено:</span>
                      <span className="font-medium">
                        {tasks.filter(t => t.status === "completed").length} из {tasks.length}
                      </span>
                    </div>
                    
                    {tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="py-2 border-t border-neutral-200">
                        <Link href={`/tasks/${task.id}`}>
                          <a className="text-sm hover:text-primary">
                            {task.title}
                          </a>
                        </Link>
                      </div>
                    ))}
                    
                    {tasks.length > 5 && (
                      <div className="pt-2 text-center">
                        <Link href={`/tasks?projectId=${projectId}`}>
                          <Button variant="outline" size="sm">Все задачи</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-neutral-500 mb-2">Нет активных задач</p>
                    <Link href={`/tasks?projectId=${projectId}`}>
                      <Button variant="outline" size="sm">Добавить задачу</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Project Details Tabs */}
        <Tabs defaultValue="files">
          <TabsList className="mb-4">
            <TabsTrigger value="files">Файлы проекта</TabsTrigger>
            <TabsTrigger value="phases">Этапы проекта</TabsTrigger>
            <TabsTrigger value="activities">История активности</TabsTrigger>
          </TabsList>
          
          <TabsContent value="files">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Файлы проекта</CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/projects/${projectId}/edit?tab=files`)}
                >
                  Загрузить файл
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingFiles ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : files && files.length > 0 ? (
                  <div className="divide-y divide-neutral-200">
                    {files.map(file => (
                      <div key={file.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <File className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-neutral-500">
                              {formatDate(file.createdAt)} • {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">Скачать</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500 mb-2">Нет загруженных файлов</p>
                    <Button variant="outline">Загрузить первый файл</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="phases">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Этапы проекта</CardTitle>
                {user?.role !== "client" && (
                  <Button size="sm">Добавить этап</Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoadingPhases ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : phases && phases.length > 0 ? (
                  <div className="space-y-4">
                    {phases.map((phase, index) => (
                      <div key={phase.id} className="border border-neutral-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">
                              {index + 1}. {phase.name}
                            </h3>
                            {phase.description && (
                              <p className="text-sm text-neutral-500">{phase.description}</p>
                            )}
                          </div>
                          <ProjectStatusBadge status={phase.status} />
                        </div>
                        
                        <div className="text-xs text-neutral-500 flex gap-4">
                          {phase.startDate && (
                            <span>Начало: {formatDate(phase.startDate)}</span>
                          )}
                          {phase.endDate && (
                            <span>Конец: {formatDate(phase.endDate)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500">Этапы проекта не определены</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">История активности</CardTitle>
              </CardHeader>
              <CardContent>
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
                ) : activities && activities.length > 0 ? (
                  <div className="relative">
                    {activities.map((activity, index) => (
                      <ActivityItem 
                        key={activity.id} 
                        activity={activity} 
                        isLast={index === activities.length - 1} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-neutral-500">Нет истории активности</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
