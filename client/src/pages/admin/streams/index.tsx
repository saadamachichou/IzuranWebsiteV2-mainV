import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Radio, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  ArrowLeft,
  Home,
  Power,
  PowerOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Stream } from "@shared/schema.ts";

export default function AdminStreamsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteStream, setDeleteStream] = useState<Stream | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
    fetchStreams();
  }, [user, setLocation]);

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/admin/streams');
      if (response.ok) {
        const data = await response.json();
        setStreams(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch streams",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching streams",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStream = async (stream: Stream) => {
    try {
      const response = await fetch(`/api/admin/streams/${stream.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Stream deleted successfully",
        });
        fetchStreams();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete stream",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting stream",
        variant: "destructive",
      });
    }
    setDeleteStream(null);
  };

  const handleToggleActive = async (stream: Stream) => {
    try {
      const response = await fetch(`/api/admin/streams/${stream.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...stream,
          isActive: !stream.isActive,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Stream ${!stream.isActive ? 'activated' : 'deactivated'} successfully`,
        });
        fetchStreams();
      } else {
        toast({
          title: "Error",
          description: "Failed to update stream status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating stream",
        variant: "destructive",
      });
    }
  };

  const filteredStreams = streams.filter(stream => {
    const matchesSearch = stream.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         stream.twitchChannelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (stream.description && stream.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black font-ami-r flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-200">Loading streams...</p>
        </div>
      </div>
    );
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
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight mb-2 flex items-center gap-3">
                  <Radio className="h-8 w-8 text-amber-400" />
                  Manage Streams
                </h1>
                <p className="text-amber-200/60">
                  Manage Twitch stream embeds for your website
                </p>
              </div>
              <Button asChild className="bg-amber-600 hover:bg-amber-500 text-black">
                <Link href="/admin/streams/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Stream
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-400/50" />
                <Input
                  placeholder="Search streams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Streams Grid */}
          {filteredStreams.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="text-center py-16"
            >
              <Radio className="h-16 w-16 text-amber-400/30 mx-auto mb-4" />
              <p className="text-amber-200/70 text-lg mb-2">
                {searchQuery ? "No streams found matching your search." : "No streams yet."}
              </p>
              <p className="text-amber-200/50 text-sm mb-6">
                {searchQuery ? "Try adjusting your search terms." : "Get started by adding your first stream."}
              </p>
              {!searchQuery && (
                <Button asChild className="bg-amber-600 hover:bg-amber-500 text-black">
                  <Link href="/admin/streams/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Stream
                  </Link>
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStreams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-colors h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-amber-200 text-lg line-clamp-2">
                            {stream.title}
                          </CardTitle>
                          {stream.twitchChannelName && (
                            <p className="text-amber-300/70 text-sm mt-1">
                              {stream.twitchChannelName}
                            </p>
                          )}
                          {stream.iframeCode && (
                            <p className="text-amber-300/70 text-sm mt-1 italic">
                              Iframe Embed
                            </p>
                          )}
                        </div>
                        <Badge 
                          variant={stream.isActive ? "default" : "secondary"}
                          className={stream.isActive 
                            ? "bg-green-600/20 text-green-400 border-green-500/30" 
                            : "bg-gray-600/20 text-gray-400 border-gray-500/30"
                          }
                        >
                          {stream.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {stream.description && (
                        <p className="text-amber-100/80 text-sm line-clamp-3">
                          {stream.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-amber-300/60 mt-2">
                        <span>Order: {stream.displayOrder}</span>
                        <Badge 
                          variant="outline"
                          className={stream.iframeCode 
                            ? "bg-blue-600/20 text-blue-400 border-blue-500/30" 
                            : "bg-purple-600/20 text-purple-400 border-purple-500/30"
                          }
                        >
                          {stream.iframeCode ? "Iframe" : "Channel"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 gap-2">
                        <div className="flex gap-2 flex-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            asChild 
                            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex-1"
                          >
                            <Link href={`/admin/streams/${stream.id}/edit`}>
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(stream)}
                            className={stream.isActive 
                              ? "border-red-500/30 text-red-300 hover:bg-red-500/10" 
                              : "border-green-500/30 text-green-300 hover:bg-green-500/10"
                            }
                            title={stream.isActive ? "Deactivate" : "Activate"}
                          >
                            {stream.isActive ? (
                              <PowerOff className="w-3 h-3" />
                            ) : (
                              <Power className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteStream(stream)}
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteStream} onOpenChange={() => setDeleteStream(null)}>
        <AlertDialogContent className="bg-black border-amber-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-200">Delete Stream</AlertDialogTitle>
            <AlertDialogDescription className="text-amber-200/70">
              Are you sure you want to delete "{deleteStream?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteStream && handleDeleteStream(deleteStream)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

