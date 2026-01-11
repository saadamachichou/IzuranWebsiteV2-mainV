import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { User, Heart, LogOut, Settings, LayoutDashboard, Package } from "lucide-react";
import { useLocation } from "wouter";
import { UserAvatar } from "./UserAvatar";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
      });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild aria-label={t('User menu')}>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label={t('User menu')}>
          <UserAvatar className="h-10 w-10" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-black border-amber-500 text-amber-100 shadow-lg" align="end" forceMount>
        <DropdownMenuLabel className="font-normal text-amber-200">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-amber-100">{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-amber-700/40" />
        <DropdownMenuItem onClick={() => setLocation('/profile')} className="hover:bg-amber-800 focus:bg-amber-800 focus:text-amber-50">
          <User className="mr-2 h-4 w-4 text-amber-300" />
          <span>{t("Profile")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/favorites')} className="hover:bg-amber-800 focus:bg-amber-800 focus:text-amber-50">
          <Heart className="mr-2 h-4 w-4 text-amber-300" />
          <span>{t("Favorites")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/orders')} className="hover:bg-amber-800 focus:bg-amber-800 focus:text-amber-50">
          <Package className="mr-2 h-4 w-4 text-amber-300" />
          <span>{t("Order History")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocation('/settings')} className="hover:bg-amber-800 focus:bg-amber-800 focus:text-amber-50">
          <Settings className="mr-2 h-4 w-4 text-amber-300" />
          <span>{t("Settings")}</span>
        </DropdownMenuItem>
        {user.role === 'admin' && (
          <>
            <DropdownMenuSeparator className="bg-amber-700/40" />
            <DropdownMenuItem onClick={() => setLocation('/admin')} className="hover:bg-amber-800 focus:bg-amber-800 focus:text-amber-50">
              <LayoutDashboard className="mr-2 h-4 w-4 text-amber-300" />
              <span>{t("Admin Dashboard")}</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator className="bg-amber-700/40" />
        <DropdownMenuItem onClick={handleLogout} className="hover:bg-amber-800 focus:bg-amber-800 focus:text-amber-50">
          <LogOut className="mr-2 h-4 w-4 text-amber-300" />
          <span>{t("Logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}