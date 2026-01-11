import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Podcast, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  ArrowLeft,
  Clock,
  Play,
  Download,
  Share,
  Heart,
  Home,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Podcast as PodcastType } from "@shared/schema.ts";

// Sortable Podcast Card Component
function SortablePodcastCard({ 
  podcast, 
  index, 
  onDelete 
}: { 
  podcast: PodcastType; 
  index: number; 
  onDelete: (podcast: PodcastType) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: podcast.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'rotate-2 scale-105' : ''} transition-all duration-200`}
    >
      <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-colors h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-amber-200 text-lg line-clamp-2">
                {podcast.title}
              </CardTitle>
              <p className="text-amber-300/70 text-sm mt-1">
                by {podcast.artistName}
              </p>
            </div>
            <div {...attributes} {...listeners} className="ml-2 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-amber-400/50" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {podcast.coverUrl && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-amber-500/10">
              <img
                src={podcast.coverUrl}
                alt={podcast.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <p className="text-amber-100/80 text-sm line-clamp-3">
              {podcast.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-amber-300/60">
              <span>{podcast.duration}</span>
              <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                {podcast.genre}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <Link href={`/admin/podcasts/${podcast.id}/edit`}>
                  <Edit className="w-3 h-3" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <Link href={`/podcasts/${podcast.slug}`}>
                  <Eye className="w-3 h-3" />
                </Link>
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(podcast)}
              className="border-red-500/30 text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPodcastsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [podcasts, setPodcasts] = useState<PodcastType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all_statuses");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [deletePodcast, setDeletePodcast] = useState<PodcastType | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
    fetchPodcasts();
  }, [user, setLocation]);

  const fetchPodcasts = async () => {
    try {
      const response = await fetch('/api/admin/podcasts');
      if (response.ok) {
        const data = await response.json();
        setPodcasts(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch podcasts",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching podcasts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReorderPodcasts = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPodcasts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update the database with the new order
        const podcastIds = newItems.map(podcast => podcast.id);
        
        fetch('/api/admin/podcasts/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ podcastIds }),
        })
        .then(response => {
          if (response.ok) {
            toast({
              title: "Success",
              description: "Podcasts reordered successfully",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to reorder podcasts",
              variant: "destructive",
            });
          }
        })
        .catch(error => {
          toast({
            title: "Error",
            description: "An error occurred while reordering podcasts",
            variant: "destructive",
          });
        });

        return newItems;
      });
    }
  };

  const handleDeletePodcast = async (podcast: PodcastType) => {
    try {
      const response = await fetch(`/api/admin/podcasts/${podcast.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Podcast deleted successfully",
        });
        fetchPodcasts();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete podcast",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting podcast",
        variant: "destructive",
      });
    }
    setDeletePodcast(null);
  };

  const getPodcastStatus = (podcast: PodcastType) => {
    // You can implement status logic based on your requirements
    return "active";
  };

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         podcast.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         podcast.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all_statuses" || getPodcastStatus(podcast) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <Link href="/admin/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Website
                  </Link>
                </Button>
              </div>
              <Button asChild className="bg-amber-500 text-black hover:bg-amber-400">
                <Link href="/admin/podcasts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Podcast
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <Podcast className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                  Podcasts Management
                </h1>
                <p className="text-amber-200/60 mt-2">
                  Manage and organize your podcast episodes
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Podcast className="w-5 h-5 text-amber-400" />
                    Total Podcasts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-300">{podcasts.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border-green-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Play className="w-5 h-5 text-green-400" />
                    Active
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-300">
                    {podcasts.filter(p => getPodcastStatus(p) === 'active').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border-blue-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-400" />
                    Recent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-300">
                    {podcasts.filter(p => {
                      const createdAt = new Date(p.createdAt);
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return createdAt > oneWeekAgo;
                    }).length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border-purple-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-400" />
                    Featured
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-300">
                    {podcasts.filter(p => (p.displayOrder ?? 0) < 5).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400/50 w-4 h-4" />
                <Input
                  placeholder="Search podcasts by title, artist, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/50"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-black/40 border-amber-500/20 text-amber-100 focus:border-amber-500/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-black border-amber-500/20">
                  <SelectItem value="all_statuses">All Podcasts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={viewMode === 'cards' ? 'bg-amber-500 text-black' : 'border-amber-500/30 text-amber-300'}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-amber-500 text-black' : 'border-amber-500/30 text-amber-300'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Podcasts Grid/Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="text-amber-300">Loading podcasts...</span>
                </div>
              </div>
            ) : filteredPodcasts.length === 0 ? (
              <div className="text-center py-12 text-amber-300/70">
                <Podcast className="w-12 h-12 mx-auto mb-4 text-amber-400/50" />
                <p className="text-lg font-medium mb-2">No podcasts found</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : viewMode === 'cards' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleReorderPodcasts}
              >
                <SortableContext
                  items={filteredPodcasts.map(podcast => podcast.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPodcasts.map((podcast, index) => (
                      <SortablePodcastCard 
                        key={podcast.id} 
                        podcast={podcast} 
                        index={index} 
                        onDelete={setDeletePodcast}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-amber-200">Podcasts Table</CardTitle>
                  <CardDescription className="text-amber-300/70">
                    {filteredPodcasts.length} podcast{filteredPodcasts.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-amber-500/20">
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Title</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Artist</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Duration</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Genre</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Status</th>
                          <th className="text-right py-3 px-4 text-amber-200 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPodcasts.map((podcast) => (
                          <tr key={podcast.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-amber-100">{podcast.title}</div>
                                <div className="text-sm text-amber-300/70 line-clamp-1">{podcast.description}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-amber-100">{podcast.artistName}</td>
                            <td className="py-3 px-4 text-amber-100">{podcast.duration}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                                {podcast.genre}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                                {getPodcastStatus(podcast)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                  <Link href={`/admin/podcasts/${podcast.id}/edit`}>
                                    <Edit className="w-3 h-3" />
                                  </Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                  <Link href={`/podcasts/${podcast.slug}`}>
                                    <Eye className="w-3 h-3" />
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeletePodcast(podcast)}
                                  className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePodcast} onOpenChange={() => setDeletePodcast(null)}>
        <AlertDialogContent className="bg-black/95 border-amber-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-200">Delete Podcast</AlertDialogTitle>
            <AlertDialogDescription className="text-amber-300/70">
              Are you sure you want to delete "{deletePodcast?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePodcast && handleDeletePodcast(deletePodcast)}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}