import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ProjectStatusBadge from "@/components/projects/project-status-badge";
import { Project } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight } from "lucide-react";

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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-medium text-lg">{project.name}</h3>
              <p className="text-sm text-neutral-500">{project.domain || "Домен не указан"}</p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Прогресс</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
          
          <div className="text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-neutral-500">Текущий этап:</span>
              <span className="font-medium">{project.currentPhase || "Не указан"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Дедлайн:</span>
              <span className="font-medium">{formatDate(project.endDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-neutral-200 bg-neutral-50 p-3 flex justify-between">
          <div className="flex items-center text-sm">
            <span className="text-neutral-500">Менеджер:</span>
            {manager ? (
              <>
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs ml-2">
                  {manager.avatarInitials}
                </div>
                <span className="ml-1">{manager.firstName} {manager.lastName.charAt(0)}.</span>
              </>
            ) : (
              <span className="ml-2">Не назначен</span>
            )}
          </div>
          <Link href={`/projects/${project.id}`}>
            <a className="text-primary hover:text-primary-dark">
              <ArrowRight className="h-5 w-5" />
            </a>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
