import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { 
  LayoutDashboard, 
  Mic, 
  Music, 
  Calendar, 
  ShoppingBag, 
  FileText,
  ChevronRight,
  Menu,
  X,
  Users,
  LogOut,
  Image,
  MessageSquare,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />
  },
  {
    title: "Artists",
    href: "/admin/artists",
    icon: <Music className="h-5 w-5" />
  },
  {
    title: "Events",
    href: "/admin/events",
    icon: <Calendar className="h-5 w-5" />
  },
  {
    title: "Podcasts",
    href: "/admin/podcasts",
    icon: <Mic className="h-5 w-5" />
  },
  {
    title: "Articles",
    href: "/admin/articles",
    icon: <FileText className="h-5 w-5" />
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: <ShoppingBag className="h-5 w-5" />
  },
  {
    title: "Gallery",
    href: "/admin/gallery",
    icon: <Image className="h-5 w-5" />
  },
  {
    title: "Releases",
    href: "/admin/releases",
    icon: <Music className="h-5 w-5" />
  },
  {
    title: "Contact Messages",
    href: "/admin/contact",
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    title: "Streams",
    href: "/admin/streams",
    icon: <Radio className="h-5 w-5" />
  }
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const { user, logout } = useAuth();

  // Automatically close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [location, isMobile]);

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-background/50 backdrop-blur-sm"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-black/90 border-r border-amber-500/20 backdrop-blur-xl transition-transform duration-300 ease-in-out",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-amber-500/20">
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Avatar className="h-10 w-10 border-2 border-amber-400">
                  {user.profilePictureUrl ? (
                    <AvatarImage src={user.profilePictureUrl} alt={user.username} />
                  ) : (
                    <AvatarFallback className="bg-amber-600 text-black">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm line-clamp-1 text-amber-200">{user.username}</span>
                  <span className="text-xs text-amber-400/70 capitalize">{user.role}</span>
                </div>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal text-amber-200/70 hover:text-amber-300 hover:bg-amber-500/10",
                      isActive ? "bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30" : "",
                    )}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto text-amber-400" />}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-amber-500/20 space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 font-normal text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={() => logout()}
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
            <p className="text-center text-sm text-amber-400/60">Izuran Admin v1.0</p>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}