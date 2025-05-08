import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskPriorityBadgeProps {
  priority: string;
}

export default function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const getPriorityConfig = () => {
    switch (priority) {
      case "low":
        return {
          label: "Низкий",
          className: "bg-success/10 text-success hover:bg-success/20"
        };
      case "medium":
        return {
          label: "Средний",
          className: "bg-warning/10 text-warning hover:bg-warning/20"
        };
      case "high":
        return {
          label: "Высокий",
          className: "bg-danger/10 text-danger hover:bg-danger/20"
        };
      default:
        return {
          label: priority,
          className: "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
        };
    }
  };
  
  const { label, className } = getPriorityConfig();
  
  return (
    <Badge className={cn("font-normal", className)} variant="outline">
      {label}
    </Badge>
  );
}
