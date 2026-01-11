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
  LucideMusic, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Edit, 
  Trash2, 
  Eye,
  Home,
  ArrowLeft,
  Calendar,
  MapPin,
  Globe,
  Instagram,
  Twitter,
  Music,
  GripVertical,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Artist } from "@shared/schema.ts";

// Sortable Artist Card Component
function SortableArtistCard({ artist, index, setDeleteArtist }: { artist: Artist; index: number; setDeleteArtist: (artist: Artist) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: artist.id });

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
                {artist.name}
              </CardTitle>
              <p className="text-amber-300/70 text-sm mt-1">
                Artist
              </p>
            </div>
            <div {...attributes} {...listeners} className="ml-2 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-amber-400/50" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Artist Image */}
                          {artist.image_Url && (
            <div className="relative aspect-square rounded-lg overflow-hidden bg-amber-500/10 border border-amber-500/20">
              <img
                                  src={artist.image_Url}
                alt={artist.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-artist.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}
          
          {/* Artist Description */}
          {artist.description && (
            <div className="space-y-2">
              <h4 className="text-amber-300 font-medium text-sm">About</h4>
              <p className="text-amber-200/70 text-sm line-clamp-3 leading-relaxed">
                {artist.description}
              </p>
            </div>
          )}
          
          {/* Artist Info */}
          <div className="flex items-center justify-between text-xs text-amber-300/60">
            <span>Artist</span>
            <Badge variant="outline" className="border-amber-500/30 text-amber-300">
              Artist
            </Badge>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <Link href={`/admin/artists/${artist.id}/edit`}>
                  <Edit className="w-3 h-3" />
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <Link href={`/artists/${artist.slug}`}>
                  <Eye className="w-3 h-3" />
                </Link>
              </Button>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteArtist(artist)}
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

export default function AdminArtistsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all_types");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [deleteArtist, setDeleteArtist] = useState<Artist | null>(null);
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [artistsPerPage] = useState(12); // Show 12 artists per page to reduce image loading

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFocus = () => {
    console.log('Window focused, refreshing artists...');
    fetchArtists();
  };

  const forceRefresh = () => {
    console.log('Force refresh triggered');
    // Clear any potential browser cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    // Force a complete refetch
    fetchArtists();
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
    fetchArtists();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, setLocation]);

  // Refresh data when user returns to the page (e.g., after editing)
  useEffect(() => {
    const handleFocus = () => {
      fetchArtists();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Debug: Log whenever artists state changes
  useEffect(() => {
    console.log('Artists state updated:', artists);
    console.log('Current artist names in state:', artists.map((a: any) => a.name));
  }, [artists]);

  const fetchArtists = async () => {
    try {
      console.log('Fetching artists from /api/admin/artists...');
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/artists?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Received artists data:', data);
        console.log('Response structure:', Object.keys(data));
        
        // Handle new response format with nested artists array
        const artistsArray = data.artists || data;
        console.log('Artists array:', artistsArray);
        console.log('Artist names received:', artistsArray.map((a: any) => a.name));
        setArtists(artistsArray);
      } else {
        console.error('Failed to fetch artists:', response.status, response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch artists",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching artists:', error);
      toast({
        title: "Error",
        description: "An error occurred while fetching artists",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter]);

  const handleReorderArtists = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setArtists((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update the database with the new order
        const artistIds = newItems.map(artist => artist.id);
        
        fetch('/api/admin/artists/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ artistIds }),
        })
        .then(response => {
          if (response.ok) {
            toast({
              title: "Success",
              description: "Artists reordered successfully",
            });
          } else {
            toast({
              title: "Error",
              description: "Failed to reorder artists",
              variant: "destructive",
            });
          }
        })
        .catch(error => {
          toast({
            title: "Error",
            description: "An error occurred while reordering artists",
            variant: "destructive",
          });
        });

        return newItems;
      });
    }
  };

  const handleDeleteArtist = async (artist: Artist) => {
    try {
      const response = await fetch(`/api/admin/artists/${artist.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Artist deleted successfully",
        });
        fetchArtists();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete artist",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting artist",
        variant: "destructive",
      });
    }
    setDeleteArtist(null);
  };

  const filteredArtists = artists.filter(artist => {
    const matchesSearch =         artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all_types";
    return matchesSearch && matchesType;
  });

  // Calculate pagination
  const indexOfLastArtist = currentPage * artistsPerPage;
  const indexOfFirstArtist = indexOfLastArtist - artistsPerPage;
  const currentArtists = filteredArtists.slice(indexOfFirstArtist, indexOfLastArtist);
  const totalPages = Math.ceil(filteredArtists.length / artistsPerPage);

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
                <Link href="/admin/artists/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Artist
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <LucideMusic className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                  Artists Management
                </h1>
                <p className="text-amber-200/60 mt-2">
                  Manage and organize your artists
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
                    <LucideMusic className="w-5 h-5 text-amber-400" />
                    Total Artists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-300">{artists.length}</div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border-green-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Music className="w-5 h-5 text-green-400" />
                    DJs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-300">
                    {artists.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border-blue-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Producers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-300">
                    0
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/60 border-purple-500/20 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                    <Twitter className="w-5 h-5 text-purple-400" />
                    Hybrid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-300">
                    0
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400/50 w-4 h-4" />
                <Input
                  placeholder="Search artists by name, bio, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/50"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48 bg-black/40 border-amber-500/20 text-amber-100 focus:border-amber-500/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-black border-amber-500/20">
                  <SelectItem value="all_types">All Artists</SelectItem>
                  <SelectItem value="dj">DJs</SelectItem>
                  <SelectItem value="producer">Producers</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceRefresh}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <RefreshCw className="w-4 h-4" />
                  Force Refresh
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                >
                  <RefreshCw className="w-4 h-4" />
                  Nuclear Refresh
                </Button>
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

          {/* Artists Grid/Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="text-amber-300">Loading artists...</span>
                </div>
              </div>
            ) : filteredArtists.length === 0 ? (
              <div className="text-center py-12 text-amber-300/70">
                <LucideMusic className="w-12 h-12 mx-auto mb-4 text-amber-400/50" />
                <p className="text-lg font-medium mb-2">No artists found</p>
                <p className="text-sm">Try adjusting your search or filter criteria.</p>
              </div>
            ) : viewMode === 'cards' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleReorderArtists}
              >
                <SortableContext
                  items={currentArtists.map(artist => artist.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {currentArtists.map((artist, index) => (
                      <SortableArtistCard key={artist.id} artist={artist} index={index} setDeleteArtist={setDeleteArtist} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-amber-200">Artists Table</CardTitle>
                  <CardDescription className="text-amber-300/70">
                    {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-amber-500/20">
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Name</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Type</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Location</th>
                          <th className="text-left py-3 px-4 text-amber-200 font-medium">Bio</th>
                          <th className="text-right py-3 px-4 text-amber-200 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentArtists.map((artist) => (
                          <tr key={artist.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium text-amber-100">{artist.name}</div>
                                <div className="text-sm text-amber-300/70 line-clamp-1">{artist.description}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                                Artist
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-amber-100">Not specified</td>
                            <td className="py-3 px-4 text-amber-100">
                              <div className="max-w-xs truncate">{artist.description || 'No description'}</div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                  <Link href={`/admin/artists/${artist.id}/edit`}>
                                    <Edit className="w-3 h-3" />
                                  </Link>
                                </Button>
                                <Button size="sm" variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                                  <Link href={`/artists/${artist.slug}`}>
                                    <Eye className="w-3 h-3" />
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setDeleteArtist(artist)}
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex items-center justify-center gap-2 mt-8"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page ? 'bg-amber-500 text-black' : 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10'}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  Next
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteArtist} onOpenChange={() => setDeleteArtist(null)}>
        <AlertDialogContent className="bg-black/95 border-amber-500/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-200">Delete Artist</AlertDialogTitle>
            <AlertDialogDescription className="text-amber-300/70">
              Are you sure you want to delete "{deleteArtist?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteArtist && handleDeleteArtist(deleteArtist)}
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