import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import Footer from "./footer";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-neutral-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col min-h-screen">
        <Header />
        {children}
        <Footer />
      </main>
    </div>
  );
}
