import { Badge } from "@/components/ui/badge";

type TaskPriority = "low" | "medium" | "high" | "urgent";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
}

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  low: {
    label: "Низкий",
    className: "bg-slate-100 text-slate-800 hover:bg-slate-200"
  },
  medium: {
    label: "Средний",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-200"
  },
  high: {
    label: "Высокий",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-200"
  },
  urgent: {
    label: "Срочный",
    className: "bg-red-100 text-red-800 hover:bg-red-200"
  }
};

export default function TaskPriorityBadge({ priority }: TaskPriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.medium;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}