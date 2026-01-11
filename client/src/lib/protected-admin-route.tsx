import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";

export function ProtectedAdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If no user or user is not admin, redirect to login
  if (!user || user.role !== 'admin') {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // User is authenticated and is an admin
  return (
    <Route path={path}>
      <AdminLayout>
        <Component />
      </AdminLayout>
    </Route>
  );
}