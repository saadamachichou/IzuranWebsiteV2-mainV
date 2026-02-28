import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  LucideMusic, 
  UsersRound, 
  Calendar, 
  ShoppingBag, 
  Podcast, 
  FileText, 
  Settings,
  Home,
  LogOut,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  Plus,
  BarChart3,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import FloatingSymbols from "@/components/ui/floating-symbols";
import ParticleField from "@/components/ui/particle-field";
import PerformanceAnalytics from "@/components/admin/PerformanceAnalytics";
import RecentActivity from "@/components/admin/RecentActivity";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [counts, setCounts] = useState({
    artists: 0,
    events: 0,
    products: 0,
    podcasts: 0,
    articles: 0,
    users: 0
  });

  useEffect(() => {
    // Check if the user is not an admin, redirect to home
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
    
    // Fetch statistics data
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/admin/stats', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setCounts(data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };
    
    fetchCounts();
  }, [user, setLocation]);

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Checking authentication...</h1>
        <p>Please wait while we verify your credentials.</p>
      </div>
    </div>;
  }

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 px-4 py-5 sm:px-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <Button
              variant="outline"
              asChild
              className="mb-4 hidden border-amber-500/30 text-amber-300 hover:bg-amber-500/10 sm:mb-6 sm:inline-flex sm:w-auto"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Website
              </Link>
            </Button>
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-transparent bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-amber-200/60 sm:text-base">
              Welcome back, {user?.username}. Manage your content and track performance.
            </p>
          </motion.div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full justify-start gap-1 overflow-x-auto border border-amber-500/20 bg-black/40 p-1 sm:w-auto">
              <TabsTrigger 
                value="overview"
                className="px-3 py-1.5 text-xs text-amber-200/70 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 sm:text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="recent"
                className="px-3 py-1.5 text-xs text-amber-200/70 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 sm:text-sm"
              >
                Recent Activity
              </TabsTrigger>
              <TabsTrigger 
                value="performance"
                className="px-3 py-1.5 text-xs text-amber-200/70 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 sm:text-sm"
              >
                Performance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {/* Enhanced Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6"
              >
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <LucideMusic className="h-5 w-5 text-amber-400" />
                      Artists
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-amber-300 sm:text-3xl">{counts.artists}</div>
                      <div className="flex items-center text-xs text-emerald-400 sm:text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +12%
                      </div>
                    </div>
                    <Progress value={75} className="mb-3 h-2" />
                    <Link href="/admin/artists" className="text-xs text-amber-400 transition-colors hover:text-amber-300 sm:text-sm">
                      Manage Artists →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-amber-300 sm:text-3xl">{counts.events}</div>
                      <div className="flex items-center text-xs text-emerald-400 sm:text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +8%
                      </div>
                    </div>
                    <Progress value={60} className="mb-3 h-2" />
                    <Link href="/admin/events" className="text-xs text-amber-400 transition-colors hover:text-amber-300 sm:text-sm">
                      Manage Events →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-amber-400" />
                      Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-amber-300 sm:text-3xl">{counts.products}</div>
                      <div className="flex items-center text-xs text-emerald-400 sm:text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +15%
                      </div>
                    </div>
                    <Progress value={85} className="mb-3 h-2" />
                    <Link href="/admin/products" className="text-xs text-amber-400 transition-colors hover:text-amber-300 sm:text-sm">
                      Manage Products →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <Podcast className="w-5 h-5 text-amber-400" />
                      Podcasts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-amber-300 sm:text-3xl">{counts.podcasts}</div>
                      <div className="flex items-center text-xs text-emerald-400 sm:text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +22%
                      </div>
                    </div>
                    <Progress value={65} className="mb-3 h-2" />
                    <Link href="/admin/podcasts" className="text-xs text-amber-400 transition-colors hover:text-amber-300 sm:text-sm">
                      Manage Podcasts →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-400" />
                      Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-amber-300 sm:text-3xl">{counts.articles}</div>
                      <div className="flex items-center text-xs text-emerald-400 sm:text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +18%
                      </div>
                    </div>
                    <Progress value={70} className="mb-3 h-2" />
                    <Link href="/admin/articles" className="text-xs text-amber-400 transition-colors hover:text-amber-300 sm:text-sm">
                      Manage Articles →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <UsersRound className="w-5 h-5 text-amber-400" />
                      Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-bold text-amber-300 sm:text-3xl">{counts.users}</div>
                      <div className="flex items-center text-xs text-emerald-400 sm:text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +25%
                      </div>
                    </div>
                    <Progress value={90} className="mb-3 h-2" />
                    <Link href="/admin/users" className="text-xs text-amber-400 transition-colors hover:text-amber-300 sm:text-sm">
                      Manage Users →
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
              
              <Card className="mt-6 border-amber-500/20 bg-black/60 backdrop-blur-xl sm:mt-8">
                <CardHeader>
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
                  <Button className="h-auto w-full justify-start whitespace-normal bg-amber-600 py-2.5 text-left font-medium text-black hover:bg-amber-700 sm:justify-center sm:text-center" asChild>
                    <Link href="/admin/artists/new">
                      <LucideMusic className="mr-2 h-4 w-4" />
                      Add New Artist
                    </Link>
                  </Button>
                  <Button className="h-auto w-full justify-start whitespace-normal bg-amber-600 py-2.5 text-left font-medium text-black hover:bg-amber-700 sm:justify-center sm:text-center" asChild>
                    <Link href="/admin/events/new">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add New Event
                    </Link>
                  </Button>
                  <Button className="h-auto w-full justify-start whitespace-normal bg-amber-600 py-2.5 text-left font-medium text-black hover:bg-amber-700 sm:justify-center sm:text-center" asChild>
                    <Link href="/admin/podcasts/new">
                      <Podcast className="mr-2 h-4 w-4" />
                      Add New Podcast
                    </Link>
                  </Button>
                  <Button className="h-auto w-full justify-start whitespace-normal bg-amber-600 py-2.5 text-left font-medium text-black hover:bg-amber-700 sm:justify-center sm:text-center" asChild>
                    <Link href="/admin/articles/new">
                      <FileText className="mr-2 h-4 w-4" />
                      Add New Article
                    </Link>
                  </Button>
                  <Button className="h-auto w-full justify-start whitespace-normal bg-blue-600 py-2.5 text-left font-medium text-white hover:bg-blue-700 sm:justify-center sm:text-center" asChild>
                    <Link href="/admin/orders/cod">
                      <Truck className="mr-2 h-4 w-4" />
                      COD Orders
                    </Link>
                  </Button>
                  <Button className="h-auto w-full justify-start whitespace-normal bg-purple-600 py-2.5 text-left font-medium text-white hover:bg-purple-700 sm:justify-center sm:text-center" asChild>
                    <Link href="/admin/releases">
                      <LucideMusic className="mr-2 h-4 w-4" />
                      Manage Releases
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recent">
              <RecentActivity />
            </TabsContent>
            
            <TabsContent value="performance">
              <PerformanceAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}