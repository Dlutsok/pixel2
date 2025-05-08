import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import { Project } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight, CalendarRange, LayersIcon, GlobeIcon } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Fetch the manager user data
  const { data: manager } = useQuery({
    queryKey: ["/api/user", project.managerId],
    enabled: !!project.managerId,
  });
  
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return "Не указано";
    return format(new Date(date), 'd MMMM, yyyy', { locale: ru });
  };

  return (
    <div className="bento-card bento-hover-effect">
      <CardContent className="p-0">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-lg bg-gradient-to-br from-primary to-purple-400 bg-clip-text text-transparent">{project.name}</h3>
              <div className="flex items-center text-sm text-neutral-500 mt-1">
                <GlobeIcon className="h-3.5 w-3.5 mr-1" />
                <span>{project.domain || "Домен не указан"}</span>
              </div>
            </div>
            <ProjectStatusBadge status={project.status} />
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
              <LayersIcon className="h-4 w-4 text-neutral-400 mr-2" />
              <span className="text-neutral-500 mr-2">Текущий этап:</span>
              <span className="font-medium">{project.currentPhase || "Не указан"}</span>
            </div>
            <div className="flex items-center">
              <CalendarRange className="h-4 w-4 text-neutral-400 mr-2" />
              <span className="text-neutral-500 mr-2">Дедлайн:</span>
              <span className="font-medium">{formatDate(project.endDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border/40 bg-neutral-50/50 p-4 flex justify-between items-center">
          <div className="flex items-center text-sm">
            <span className="text-neutral-500 mr-2">Менеджер:</span>
            {manager ? (
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-medium text-xs mr-2">
                  {manager.avatarInitials}
                </div>
                <span className="font-medium">{manager.firstName} {manager.lastName.charAt(0)}.</span>
              </div>
            ) : (
              <span className="text-neutral-400">Не назначен</span>
            )}
          </div>
          <Link href={`/projects/${project.id}`}>
            <div className="text-primary hover:text-primary-dark transition-colors p-1.5 hover:bg-primary/10 rounded-lg">
              <ArrowRight className="h-5 w-5" />
            </div>
          </Link>
        </div>
      </CardContent>
    </div>
  );
}
