import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  activity: Activity;
  isLast: boolean;
}

export default function ActivityItem({ activity, isLast }: ActivityItemProps) {
  // Fetch user data for the activity
  const { data: user } = useQuery({
    queryKey: ["/api/user", activity.userId],
    enabled: !!activity.userId,
  });
  
  // Fetch project data if associated with a project
  const { data: project } = useQuery({
    queryKey: ["/api/projects", activity.projectId],
    enabled: !!activity.projectId,
  });
  
  const getActivityColor = () => {
    switch (activity.actionType) {
      case "project_created":
      case "project_updated":
        return "bg-primary";
      case "task_created":
        return "bg-warning";
      case "task_updated":
      case "task_completed":
        return "bg-success";
      case "message_sent":
      case "comment_added":
        return "bg-accent";
      case "file_uploaded":
        return "bg-info";
      default:
        return "bg-neutral-500";
    }
  };
  
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: ru
    });
  };
  
  const getUserName = () => {
    if (!user) return "Пользователь";
    
    if (activity.userId === 0) {
      return "Система";
    }
    
    return `${user.firstName} ${user.lastName.charAt(0)}.`;
  };
  
  return (
    <div className="ml-6 pb-4 relative">
      <div className={cn(
        "absolute -left-6 mt-1 w-4 h-4 rounded-full border-2 border-white z-10",
        getActivityColor()
      )}></div>
      
      {!isLast && (
        <div className="absolute -left-4 top-4 bottom-0 border-l-2 border-neutral-200 z-0"></div>
      )}
      
      <div className="pl-4">
        <div className="text-sm">
          <span className="font-medium">{getUserName()}</span> {activity.description}
        </div>
        
        {project && (
          <p className="text-sm text-neutral-500">{project.name}</p>
        )}
        
        <p className="text-xs text-neutral-400 mt-1">
          {formatTimeAgo(activity.createdAt)}
        </p>
      </div>
    </div>
  );
}
