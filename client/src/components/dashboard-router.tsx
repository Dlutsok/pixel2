import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import DashboardPage from "@/pages/dashboard-page";
import ClientDashboardPage from "@/pages/client-dashboard-page";

export default function DashboardRouter() {
  const { user } = useAuth();
  
  // Отображаем соответствующий дашборд на основе роли пользователя
  if (user?.role === "client") {
    return <ClientDashboardPage />;
  }
  
  // По умолчанию показываем стандартный дашборд для менеджеров и админов
  return <DashboardPage />;
}