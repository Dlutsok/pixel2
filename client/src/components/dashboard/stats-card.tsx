import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "secondary":
        return "bg-secondary/10 text-secondary";
      case "accent":
        return "bg-accent/10 text-accent";
      case "success":
        return "bg-success/10 text-success";
      case "warning":
        return "bg-warning/10 text-warning";
      case "info":
        return "bg-info/10 text-info";
      default:
        return "bg-primary/10 text-primary";
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-neutral-500 text-sm">{title}</h3>
          <div className={cn("p-2 rounded-full", getColorClasses())}>
            <span className="material-icons">{icon}</span>
          </div>
        </div>
        <p className="text-3xl font-semibold mt-2">{value}</p>
        <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
