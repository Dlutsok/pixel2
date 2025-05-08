import { useQuery } from "@tanstack/react-query";
import { Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  // Fetch sender data
  const { data: sender, isLoading: isLoadingSender } = useQuery({
    queryKey: ["/api/user", message.senderId],
    enabled: !!message.senderId,
  });
  
  // Fetch project data if associated with a project
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ["/api/projects", message.projectId],
    enabled: !!message.projectId,
  });
  
  const formatTimeAgo = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true,
      locale: ru
    });
  };
  
  if (isLoadingSender) {
    return (
      <div className="p-4 flex">
        <Skeleton className="h-10 w-10 rounded-full mr-3" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    );
  }
  
  if (!sender) {
    return null;
  }
  
  return (
    <div className="p-4 flex">
      <div className="flex-shrink-0 mr-3">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
          <span>{sender.avatarInitials}</span>
        </div>
      </div>
      <div>
        <div className="flex items-center mb-1">
          <h4 className="font-medium text-sm">{sender.firstName} {sender.lastName.charAt(0)}.</h4>
          <span className="text-xs text-neutral-500 ml-2">{formatTimeAgo(message.createdAt)}</span>
        </div>
        <p className="text-sm">{message.content}</p>
        {project && (
          <div className="text-xs text-primary mt-1">{project.name}</div>
        )}
      </div>
    </div>
  );
}
