import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useMobile();

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />

      <main className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        isMobile ? "pl-0" : "pl-64"
      )}>
        {children}
      </main>
    </div>
  );
}