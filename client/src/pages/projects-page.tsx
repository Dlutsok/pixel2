import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Search, Plus, Filter } from "lucide-react";
import ProjectCard from "@/components/dashboard/project-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  // Fetch projects
  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["/api/projects"],
    enabled: !!user,
    onSuccess: (data) => {
      console.log("Projects loaded successfully:", data);
    },
    onError: (err) => {
      console.error("Error loading projects:", err);
    },
  });
  
  // Filter projects based on search query and status
  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (project.domain && project.domain.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(project.status);
    
    return matchesSearch && matchesStatus;
  });
  
  // Group projects by status for tabs
  const activeProjects = filteredProjects?.filter(p => p.status === "in_progress" || p.status === "new") || [];
  const pausedProjects = filteredProjects?.filter(p => p.status === "paused") || [];
  const completedProjects = filteredProjects?.filter(p => p.status === "completed") || [];
  const archivedProjects = filteredProjects?.filter(p => p.status === "archived") || [];
  
  const renderProjectsGrid = (projectsList: typeof projects) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-2 w-full mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (!projectsList || projectsList.length === 0) {
      return (
        <div className="text-center p-8 bg-white border border-neutral-200 rounded-lg mt-6">
          <p className="text-neutral-500">Нет проектов в этой категории</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {projectsList.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    );
  };
  
  const getStatusesOptions = () => {
    const statuses = [
      { value: "new", label: "Новый" },
      { value: "in_progress", label: "В работе" },
      { value: "paused", label: "Приостановлен" },
      { value: "completed", label: "Завершен" },
      { value: "archived", label: "Архивный" },
    ];
    
    return statuses;
  };

  return (
    <Layout>
      <div className="p-6 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold font-heading mb-4 md:mb-0">Проекты</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
              <Input
                placeholder="Поиск проектов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter size={16} />
                  <span>Фильтр</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {getStatusesOptions().map((status) => (
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
            
            <Link href="/projects/new">
              <Button className="gap-2">
                <Plus size={16} />
                <span>Новый проект</span>
              </Button>
            </Link>
          </div>
        </div>
        
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Активные ({activeProjects.length})</TabsTrigger>
            <TabsTrigger value="paused">Приостановленные ({pausedProjects.length})</TabsTrigger>
            <TabsTrigger value="completed">Завершенные ({completedProjects.length})</TabsTrigger>
            <TabsTrigger value="archived">Архив ({archivedProjects.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {renderProjectsGrid(activeProjects)}
          </TabsContent>
          
          <TabsContent value="paused">
            {renderProjectsGrid(pausedProjects)}
          </TabsContent>
          
          <TabsContent value="completed">
            {renderProjectsGrid(completedProjects)}
          </TabsContent>
          
          <TabsContent value="archived">
            {renderProjectsGrid(archivedProjects)}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
