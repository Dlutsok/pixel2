import { Badge } from "@/components/ui/badge";

type TaskStatus = 
  | "todo" 
  | "in_progress" 
  | "client_review" 
  | "waiting_info" 
  | "done" 
  | "cancelled";

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: "К выполнению",
    className: "bg-slate-100 text-slate-800 hover:bg-slate-200"
  },
  in_progress: {
    label: "В работе",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-200"
  },
  client_review: {
    label: "Ожидает проверки",
    className: "bg-purple-100 text-purple-800 hover:bg-purple-200"
  },
  waiting_info: {
    label: "Ожидает информацию",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-200"
  },
  done: {
    label: "Выполнено",
    className: "bg-green-100 text-green-800 hover:bg-green-200"
  },
  cancelled: {
    label: "Отменено",
    className: "bg-red-100 text-red-800 hover:bg-red-200"
  }
};

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.todo;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
}