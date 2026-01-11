import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Music, 
  Calendar, 
  ShoppingBag, 
  FileText, 
  Podcast,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Edit,
  Trash,
  Plus,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'user' | 'artist' | 'event' | 'product' | 'podcast' | 'article' | 'order' | 'system';
  action: 'created' | 'updated' | 'deleted' | 'published' | 'purchased' | 'viewed' | 'login' | 'error';
  title: string;
  description: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
    role: string;
  };
  timestamp: string;
  metadata?: {
    oldValue?: string;
    newValue?: string;
    location?: string;
    userAgent?: string;
  };
}

const getActivityIcon = (type: string, action: string) => {
  switch (type) {
    case 'user':
      return <User className="h-4 w-4" />;
    case 'artist':
      return <Music className="h-4 w-4" />;
    case 'event':
      return <Calendar className="h-4 w-4" />;
    case 'product':
      return <ShoppingBag className="h-4 w-4" />;
    case 'podcast':
      return <Podcast className="h-4 w-4" />;
    case 'article':
      return <FileText className="h-4 w-4" />;
    case 'order':
      return <ShoppingBag className="h-4 w-4" />;
    case 'system':
      return action === 'error' ? <AlertCircle className="h-4 w-4" /> : <Settings className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActivityColor = (type: string, action: string) => {
  if (action === 'error') return 'border-red-500/30 bg-red-500/10';
  if (action === 'deleted') return 'border-red-500/30 bg-red-500/10';
  if (action === 'created' || action === 'published') return 'border-emerald-500/30 bg-emerald-500/10';
  if (action === 'updated') return 'border-amber-500/30 bg-amber-500/10';
  return 'border-blue-500/30 bg-blue-500/10';
};

const getActionBadgeColor = (action: string) => {
  switch (action) {
    case 'created':
    case 'published':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'updated':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'deleted':
    case 'error':
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'purchased':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default:
      return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  }
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all_types");
  const [actionFilter, setActionFilter] = useState<string>("all_actions");
  const [timeFilter, setTimeFilter] = useState<string>("24h");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecentActivity();
    
    // Set up real-time updates
    const interval = setInterval(fetchRecentActivity, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, searchQuery, typeFilter, actionFilter, timeFilter]);

  const fetchRecentActivity = async () => {
    if (activities.length === 0) {
      setLoading(true);
    }
    try {
      // Generate comprehensive mock activity data for demonstration
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'user',
          action: 'created',
          title: 'New User Registration',
          description: 'Amir Benali registered with Google authentication',
          user: { id: 1, username: 'Admin', role: 'admin' },
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          metadata: { location: 'Morocco', userAgent: 'Chrome/120.0' }
        },
        {
          id: '2',
          type: 'artist',
          action: 'updated',
          title: 'Artist Profile Updated',
          description: 'Tarik Nightfall updated their biography and social links',
          user: { id: 2, username: 'Tarik Nightfall', role: 'artist' },
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          metadata: { oldValue: 'Old bio', newValue: 'Updated bio with new tour dates' }
        },
        {
          id: '3',
          type: 'event',
          action: 'created',
          title: 'New Event Scheduled',
          description: 'Atlas Mountain Gathering event created for August 2024',
          user: { id: 1, username: 'Admin', role: 'admin' },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          type: 'order',
          action: 'purchased',
          title: 'Product Purchase',
          description: 'Customer purchased Mystical Journeys Vinyl LP',
          user: { id: 3, username: 'Customer', role: 'user' },
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          metadata: { newValue: '$35.00' }
        },
        {
          id: '5',
          type: 'podcast',
          action: 'published',
          title: 'Podcast Episode Published',
          description: 'New episode "Desert Transmissions Vol. 2" is now live',
          user: { id: 4, username: 'Amina Ziani', role: 'artist' },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          type: 'article',
          action: 'updated',
          title: 'Article Content Revised',
          description: 'Updated "Sonic Patterns of Ancient Amazigh Rituals" with new research',
          user: { id: 1, username: 'Admin', role: 'admin' },
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '7',
          type: 'system',
          action: 'error',
          title: 'Payment Processing Error',
          description: 'PayPal API returned error for order #12345',
          user: { id: 0, username: 'System', role: 'system' },
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '8',
          type: 'user',
          action: 'login',
          title: 'Admin Login',
          description: 'Administrator logged in from new location',
          user: { id: 1, username: 'Admin', role: 'admin' },
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metadata: { location: 'Casablanca, Morocco' }
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterActivities = () => {
    let filtered = [...activities];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity =>
        activity.title.toLowerCase().includes(query) ||
        activity.description.toLowerCase().includes(query) ||
        activity.user.username.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter !== 'all_types') {
      filtered = filtered.filter(activity => activity.type === typeFilter);
    }

    // Filter by action
    if (actionFilter !== 'all_actions') {
      filtered = filtered.filter(activity => activity.action === actionFilter);
    }

    // Filter by time
    const now = new Date();
    if (timeFilter !== 'all_time') {
      const timeLimit = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      }[timeFilter] || 0;

      filtered = filtered.filter(activity =>
        now.getTime() - new Date(activity.timestamp).getTime() <= timeLimit
      );
    }

    setFilteredActivities(filtered);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-400 mx-auto mb-4"></div>
            <p className="text-amber-200/60 text-sm">Loading recent activity...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h3 className="text-2xl font-bold text-amber-300 mb-2">Recent Activity</h3>
          <p className="text-amber-200/60">Real-time updates and system notifications</p>
        </div>
        <Button 
          onClick={fetchRecentActivity}
          variant="outline" 
          className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-400/60" />
          <Input
            type="search"
            placeholder="Search activities..."
            className="pl-8 bg-black/40 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-amber-500/20 text-amber-200">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-amber-500/20">
            <SelectItem value="all_types">All Types</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="artist">Artists</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="product">Products</SelectItem>
            <SelectItem value="podcast">Podcasts</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>

        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-amber-500/20 text-amber-200">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-amber-500/20">
            <SelectItem value="all_actions">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="purchased">Purchased</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[140px] bg-black/40 border-amber-500/20 text-amber-200">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-amber-500/20">
            <SelectItem value="all_time">All Time</SelectItem>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-amber-300 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Timeline ({filteredActivities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`relative pl-8 pb-6 ${index !== filteredActivities.length - 1 ? 'border-l-2 border-amber-500/20' : ''}`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transform -translate-x-3 ${getActivityColor(activity.type, activity.action)}`}>
                      {getActivityIcon(activity.type, activity.action)}
                    </div>

                    <div 
                      className="bg-black/40 rounded-lg border border-amber-500/10 p-4 cursor-pointer hover:border-amber-500/20 transition-colors"
                      onClick={() => toggleExpanded(activity.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-amber-300">{activity.title}</h4>
                            <Badge className={getActionBadgeColor(activity.action)}>
                              {activity.action}
                            </Badge>
                          </div>
                          <p className="text-amber-200/70 text-sm mb-2">{activity.description}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-amber-200/50">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={activity.user.avatar} />
                                <AvatarFallback className="bg-amber-500/20 text-amber-300 text-xs">
                                  {activity.user.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>{activity.user.username}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {expandedItems.has(activity.id) && activity.metadata && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-amber-500/10"
                          >
                            <div className="space-y-2 text-xs text-amber-200/60">
                              {activity.metadata.location && (
                                <div>
                                  <span className="font-medium">Location:</span> {activity.metadata.location}
                                </div>
                              )}
                              {activity.metadata.userAgent && (
                                <div>
                                  <span className="font-medium">User Agent:</span> {activity.metadata.userAgent}
                                </div>
                              )}
                              {activity.metadata.oldValue && activity.metadata.newValue && (
                                <div>
                                  <span className="font-medium">Change:</span> 
                                  <span className="text-red-300"> {activity.metadata.oldValue}</span> → 
                                  <span className="text-emerald-300"> {activity.metadata.newValue}</span>
                                </div>
                              )}
                              {activity.metadata.newValue && !activity.metadata.oldValue && (
                                <div>
                                  <span className="font-medium">Value:</span> {activity.metadata.newValue}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">Timestamp:</span> {format(new Date(activity.timestamp), 'PPpp')}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredActivities.length === 0 && (
                <div className="text-center py-8 text-amber-200/60">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No activity found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}