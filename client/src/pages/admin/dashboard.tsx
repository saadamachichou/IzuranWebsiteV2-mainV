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
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 mb-6">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Website
              </Link>
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight mb-2">
              Admin Dashboard
            </h1>
            <p className="text-amber-200/60">
              Welcome back, {user?.username}. Manage your content and track performance.
            </p>
          </motion.div>
          
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="bg-black/40 border border-amber-500/20">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="recent"
                className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
              >
                Recent Activity
              </TabsTrigger>
              <TabsTrigger 
                value="performance"
                className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
              >
                Performance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              {/* Enhanced Stats Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <LucideMusic className="w-5 h-5 text-amber-400" />
                      Artists
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-amber-300">{counts.artists}</div>
                      <div className="flex items-center text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +12%
                      </div>
                    </div>
                    <Progress value={75} className="mb-3 h-2" />
                    <Link href="/admin/artists" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Manage Artists →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-400" />
                      Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-amber-300">{counts.events}</div>
                      <div className="flex items-center text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +8%
                      </div>
                    </div>
                    <Progress value={60} className="mb-3 h-2" />
                    <Link href="/admin/events" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Manage Events →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-amber-400" />
                      Products
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-amber-300">{counts.products}</div>
                      <div className="flex items-center text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +15%
                      </div>
                    </div>
                    <Progress value={85} className="mb-3 h-2" />
                    <Link href="/admin/products" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Manage Products →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <Podcast className="w-5 h-5 text-amber-400" />
                      Podcasts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-amber-300">{counts.podcasts}</div>
                      <div className="flex items-center text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +22%
                      </div>
                    </div>
                    <Progress value={65} className="mb-3 h-2" />
                    <Link href="/admin/podcasts" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Manage Podcasts →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-400" />
                      Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-amber-300">{counts.articles}</div>
                      <div className="flex items-center text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +18%
                      </div>
                    </div>
                    <Progress value={70} className="mb-3 h-2" />
                    <Link href="/admin/articles" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Manage Articles →
                    </Link>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                      <UsersRound className="w-5 h-5 text-amber-400" />
                      Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-3xl font-bold text-amber-300">{counts.users}</div>
                      <div className="flex items-center text-emerald-400 text-sm">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +25%
                      </div>
                    </div>
                    <Progress value={90} className="mb-3 h-2" />
                    <Link href="/admin/users" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      Manage Users →
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
              
              <Card className="mt-8 bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black font-medium" asChild>
                    <Link href="/admin/artists/new">
                      <LucideMusic className="mr-2 h-4 w-4" />
                      Add New Artist
                    </Link>
                  </Button>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black font-medium" asChild>
                    <Link href="/admin/events/new">
                      <Calendar className="mr-2 h-4 w-4" />
                      Add New Event
                    </Link>
                  </Button>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black font-medium" asChild>
                    <Link href="/admin/podcasts/new">
                      <Podcast className="mr-2 h-4 w-4" />
                      Add New Podcast
                    </Link>
                  </Button>
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black font-medium" asChild>
                    <Link href="/admin/articles/new">
                      <FileText className="mr-2 h-4 w-4" />
                      Add New Article
                    </Link>
                  </Button>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" asChild>
                    <Link href="/admin/orders/cod">
                      <Truck className="mr-2 h-4 w-4" />
                      COD Orders
                    </Link>
                  </Button>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium" asChild>
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