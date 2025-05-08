import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, User, Settings, LogOut } from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  if (!user) {
    return null;
  }
  
  const getPageTitle = () => {
    switch (true) {
      case location === "/":
        return "Дашборд";
      case location === "/projects":
        return "Проекты";
      case location.startsWith("/projects/"):
        return "Детали проекта";
      case location === "/tasks":
        return "Задачи";
      case location.startsWith("/tasks/"):
        return "Детали задачи";
      case location === "/chat":
        return "Чат";
      case location === "/finance":
        return "Финансы";
      case location === "/support":
        return "Поддержка";
      default:
        return "Личный кабинет";
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-white border-b border-neutral-200 py-3 px-6 flex justify-between items-center sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-medium font-heading">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative text-neutral-600 hover:text-neutral-800">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-xs text-white rounded-full flex items-center justify-center">
            2
          </span>
        </Button>
        
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <span className="text-sm font-medium">{user.avatarInitials}</span>
              </div>
              <span className="hidden md:block text-sm">{user.firstName} {user.lastName.charAt(0)}.</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-3 border-b border-neutral-200">
              <div className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</div>
              <div className="text-xs text-neutral-500">{user.email}</div>
            </div>
            
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" />
              <span>Мой профиль</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              <span>Настройки</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              <span>Выйти</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
