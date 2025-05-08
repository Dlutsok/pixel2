import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskStatusBadgeProps {
  status: string;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "new":
        return {
          label: "Новая",
          className: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
        };
      case "in_progress":
        return {
          label: "В работе",
          className: "bg-warning/10 text-warning hover:bg-warning/20"
        };
      case "review":
        return {
          label: "На проверке",
          className: "bg-info/10 text-info hover:bg-info/20"
        };
      case "completed":
        return {
          label: "Завершена",
          className: "bg-success/10 text-success hover:bg-success/20"
        };
      case "delayed":
        return {
          label: "Отложена",
          className: "bg-neutral-400/10 text-neutral-600 hover:bg-neutral-400/20"
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
