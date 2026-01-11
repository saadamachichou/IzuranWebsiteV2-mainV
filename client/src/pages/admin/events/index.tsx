import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Event } from "@shared/schema.ts";

export default function AdminEventsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all_statuses");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
    fetchEvents();
  }, [user, setLocation]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/admin/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch events",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    try {
      const response = await fetch(`/api/admin/events/${event.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        fetchEvents();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting event",
        variant: "destructive",
      });
    }
    setDeleteEvent(null);
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (eventDate < now) {
      return { status: 'past', label: 'Past', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    } else if (eventDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return { status: 'upcoming', label: 'Upcoming', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    } else {
      return { status: 'scheduled', label: 'Scheduled', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all_statuses") return matchesSearch;
    
    const eventStatus = getEventStatus(event);
    return matchesSearch && eventStatus.status === statusFilter;
  });

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
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <Link href="/admin/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
              Events Management
            </h1>
            <p className="text-amber-200/60 mt-2">
              Manage your music events and performances
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-8 flex justify-end"
          >
            <Button className="bg-amber-600 hover:bg-amber-700 text-black font-medium" asChild>
              <Link href="/admin/events/new">
                <Plus className="mr-2 h-4 w-4" />
                Add New Event
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
          >
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-black/40 border-amber-500/20 text-amber-100">
                  <Filter className="mr-2 h-4 w-4 text-amber-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-amber-500/20">
                  <SelectItem value="all_statuses">All Statuses</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className={viewMode === 'cards' ? 'bg-amber-600 text-black' : 'border-amber-500/30 text-amber-300'}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-amber-600 text-black' : 'border-amber-500/30 text-amber-300'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-amber-300">Loading events...</div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => {
                    const eventStatus = getEventStatus(event);
                    return (
                      <motion.div
                        key={event.id}
                        className="glassmorphism rounded-lg p-6 border border-amber-500/20 hover:border-amber-500/40 glow-card transition-all duration-300 group bg-black/60 backdrop-blur-xl shadow-lg"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                      >
                        <div className="flex flex-col gap-4 h-full">
                          <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
                            {event.imageUrl ? (
                              <img 
                                src={event.imageUrl.startsWith('/') ? event.imageUrl : `/uploads/event_images/${event.imageUrl}`} 
                                alt={event.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                                <Calendar className="w-12 h-12 text-black" />
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mb-2">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-amber-100 mb-1">{event.name}</h3>
                              <div className="flex flex-wrap items-center gap-3 text-amber-200/80 text-sm">
                                <Badge variant="secondary" className={`px-2 py-1 ${eventStatus.color}`}>{eventStatus.label}</Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-amber-200/80 mb-2 line-clamp-3">{event.description || "No description available"}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-amber-300/80 mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            {event.ticketPrice && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400">${event.ticketPrice}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                              <Link href={`/admin/events/${event.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-400 hover:bg-red-500/10"
                              onClick={() => setDeleteEvent(event)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-amber-500/20">
                            <th className="text-left p-4 text-amber-300 font-medium">Event</th>
                            <th className="text-left p-4 text-amber-300 font-medium">Date</th>
                            <th className="text-left p-4 text-amber-300 font-medium">Location</th>
                            <th className="text-left p-4 text-amber-300 font-medium">Status</th>
                            <th className="text-left p-4 text-amber-300 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEvents.map((event) => {
                            const eventStatus = getEventStatus(event);
                            return (
                              <tr key={event.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                                      <Calendar className="w-5 h-5 text-black" />
                                    </div>
                                    <div>
                                      <div className="text-amber-300 font-medium">{event.name}</div>
                                      <div className="text-amber-200/60 text-sm truncate max-w-48">
                                        {event.description || "No description available"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-amber-200/70">
                                  {new Date(event.date).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-amber-200/70">
                                  {event.location || "TBA"}
                                </td>
                                <td className="p-4">
                                  <Badge variant="secondary" className={eventStatus.color}>
                                    {eventStatus.label}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                                      <Link href={`/admin/events/${event.id}/edit`}>
                                        <Edit className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="text-red-400 hover:bg-red-500/10"
                                      onClick={() => setDeleteEvent(event)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {filteredEvents.length === 0 && (
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                  <CardContent className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-amber-400/50 mb-4" />
                    <h3 className="text-lg font-medium text-amber-300 mb-2">No events found</h3>
                    <p className="text-amber-200/60 mb-4">
                      {searchQuery || statusFilter !== "all_statuses" 
                        ? "Try adjusting your search or filters" 
                        : "Get started by adding your first event"
                      }
                    </p>
                    <Button className="bg-amber-600 hover:bg-amber-700 text-black font-medium" asChild>
                      <Link href="/admin/events/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Event
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteEvent} onOpenChange={() => setDeleteEvent(null)}>
        <AlertDialogContent className="bg-black/90 border-amber-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-300">Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-amber-200/70">
              Are you sure you want to delete "{deleteEvent?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteEvent && handleDeleteEvent(deleteEvent)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}