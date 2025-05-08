import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FolderOpen, CheckSquare, MessageSquare, CreditCard, HelpCircle, AlertTriangle } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  color: "primary" | "secondary" | "accent" | "success" | "warning" | "info";
  isLoading?: boolean;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = "primary",
  isLoading = false 
}: StatsCardProps) {
  const getIcon = () => {
    switch(icon) {
      case 'folder':
        return <FolderOpen className="h-6 w-6" />;
      case 'task':
        return <CheckSquare className="h-6 w-6" />;
      case 'chat':
        return <MessageSquare className="h-6 w-6" />;
      case 'finance':
        return <CreditCard className="h-6 w-6" />;
      case 'support':
        return <HelpCircle className="h-6 w-6" />;
      default:
        return <AlertTriangle className="h-6 w-6" />;
    }
  };
  
  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "secondary":
        return "bg-secondary/10 text-secondary";
      case "accent":
        return "bg-accent/10 text-accent";
      case "success":
        return "bg-green-100 text-green-600";
      case "warning":
        return "bg-amber-100 text-amber-600";
      case "info":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-primary/10 text-primary";
    }
  };
  
  if (isLoading) {
    return (
      <div className="bento-card bento-hover-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
          <Skeleton className="h-10 w-20 mb-1" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </div>
    );
  }

  return (
    <div className="bento-card bento-hover-effect">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-neutral-500 text-sm font-medium">{title}</h3>
          <div className={cn("p-3 rounded-xl shadow-sm", getColorClasses())}>
            {getIcon()}
          </div>
        </div>
        <p className="text-3xl font-bold mt-2 bg-gradient-to-br from-primary via-primary to-purple-400 bg-clip-text text-transparent">{value}</p>
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      </CardContent>
    </div>
  );
}
