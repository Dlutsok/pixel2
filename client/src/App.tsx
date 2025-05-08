import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "next-themes";

// Pages
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetailPage from "@/pages/project-detail-page";
import ProjectNewPage from "@/pages/project-new-page";
import ProjectEditPage from "@/pages/project-edit-page";
import TasksPage from "@/pages/tasks-page";
import TaskDetailPage from "@/pages/task-detail-page";
import ChatPage from "@/pages/chat-page";
import FinancePage from "@/pages/finance-page";
import SupportPage from "@/pages/support-page";
import ProfilePage from "@/pages/profile-page";
import UsersPage from "@/pages/users-page";

// Components
import DashboardRouter from "@/components/dashboard-router";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardRouter} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects/new" component={ProjectNewPage} />
      <ProtectedRoute path="/projects/:id/edit" component={ProjectEditPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailPage} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/tasks/:id" component={TaskDetailPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/finance" component={FinancePage} />
      <ProtectedRoute path="/support" component={SupportPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
