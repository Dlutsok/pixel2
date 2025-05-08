import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  status: string;
}

export default function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "in_progress":
        return {
          label: "В работе",
          className: "bg-success/10 text-success hover:bg-success/20"
        };
      case "paused":
        return {
          label: "Приостановлен",
          className: "bg-warning/10 text-warning hover:bg-warning/20"
        };
      case "completed":
        return {
          label: "Завершен",
          className: "bg-primary/10 text-primary hover:bg-primary/20"
        };
      case "archived":
        return {
          label: "Архивный",
          className: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
        };
      default:
        return {
          label: status,
          className: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
        };
    }
  };
  
  const { label, className } = getStatusConfig();
  
  return (
    <Badge className={cn("font-normal", className)} variant="outline">
      {label}
    </Badge>
  );
}
