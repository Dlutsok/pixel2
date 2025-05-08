import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FolderClosed, 
  CheckSquare, 
  MessageSquare, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  if (!user) {
    return null;
  }
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const navItems = [
    { href: "/", label: "Дашборд", icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: "/projects", label: "Проекты", icon: <FolderClosed className="h-5 w-5" /> },
    { href: "/tasks", label: "Задачи", icon: <CheckSquare className="h-5 w-5" />, badge: "3" },
    { href: "/chat", label: "Чат", icon: <MessageSquare className="h-5 w-5" /> },
    { href: "/finance", label: "Финансы", icon: <CreditCard className="h-5 w-5" /> },
    { href: "/support", label: "Поддержка", icon: <HelpCircle className="h-5 w-5" /> },
  ];
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className={cn(
      "w-full md:w-64 bg-white border-r border-neutral-200 md:min-h-screen",
      "fixed md:relative inset-0 z-50 md:translate-x-0 transition-transform duration-200",
      isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-xl text-primary font-heading">Web Studio</span>
        </div>
        
        <button 
          className="md:hidden text-neutral-500 hover:text-neutral-700" 
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
        
        <button
          className="absolute md:hidden -right-12 top-4 p-2 bg-white border border-neutral-200 rounded-md"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-6 w-6 text-neutral-700" />
        </button>
      </div>
      
      <div className="px-4 py-2 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
            <span className="text-lg font-medium">{user.avatarInitials}</span>
          </div>
          <div>
            <div className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</div>
            <div className="text-xs text-neutral-500">{user.email}</div>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                location === item.href 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-neutral-700 hover:bg-neutral-100"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-primary text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto p-4 border-t border-neutral-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Выйти</span>
        </Button>
      </div>
    </aside>
  );
}
