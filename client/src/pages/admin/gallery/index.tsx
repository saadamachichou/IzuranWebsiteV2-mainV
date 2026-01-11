import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Eye, Edit, Trash2, Image as ImageIcon, Play, ArrowLeft, Upload, ExternalLink, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { useLocation } from "wouter";
import { GalleryItem } from "@shared/schema";
import { processYouTubeUrl, canEmbedYouTubeUrl, isYouTubeUrl, isYouTubeIframe, normalizeYouTubeUrl } from "@/utils/youtube";

export default function AdminGalleryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all_types");
  
  console.log('Initial search term:', searchTerm);
  console.log('Initial type filter:', typeFilter);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'image' as 'image' | 'video' | 'youtube',
    src: '',
    thumbnail: '',
    title: '',
    description: ''
  });

  // Type guard function to ensure type safety
  const isValidGalleryType = (type: string): type is 'image' | 'video' | 'youtube' => {
    return type === 'image' || type === 'video' || type === 'youtube';
  };

  const { data: galleryItems = [], isLoading, refetch, error } = useQuery<GalleryItem[]>({
    queryKey: ["/api/gallery"],
  });

  // Debug logging
  console.log('Gallery data:', galleryItems);
  console.log('Gallery loading:', isLoading);
  console.log('Gallery error:', error);

  // Test direct fetch
  useEffect(() => {
    const testFetch = async () => {
      try {
        const response = await fetch('/api/gallery');
        const data = await response.json();
        console.log('Direct fetch result:', data);
      } catch (err) {
        console.error('Direct fetch error:', err);
      }
    };
    testFetch();
  }, []);

  // Filter products based on type
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all_types" || (isValidGalleryType(item.type) && item.type === typeFilter);
    
    console.log(`Item "${item.title}": search=${matchesSearch}, type=${matchesType}, typeFilter=${typeFilter}, itemType=${item.type}`);
    
    return matchesSearch && matchesType;
  });

  console.log('Filtered items:', filteredItems);
  console.log('Search term:', searchTerm);
  console.log('Type filter:', typeFilter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate YouTube URL for video type
    if (formData.type === 'video' && formData.src.includes('youtube.com') && !formData.src.includes('youtube.com/embed')) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please use a valid YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)",
        variant: "destructive",
      });
      return;
    }

    // Validate and normalize YouTube URL for youtube type
    if (formData.type === 'youtube') {
      if (!canEmbedYouTubeUrl(formData.src)) {
        toast({
          title: "Invalid YouTube URL or iframe code",
          description: "Please enter a valid YouTube video URL or iframe embed code that can be embedded",
          variant: "destructive",
        });
        return;
      }
      
      // Normalize the URL to a standard watch URL for storage
      const normalizedUrl = normalizeYouTubeUrl(formData.src);
      if (normalizedUrl) {
        formData.src = normalizedUrl;
      }
    }
    
    try {
      const url = editingItem 
        ? `/api/admin/gallery/${editingItem.id}`
        : '/api/admin/gallery';
      
      const method = editingItem ? 'PUT' : 'POST';
      
      // Ensure type safety before sending
      const submitData = {
        ...formData,
        type: isValidGalleryType(formData.type) ? formData.type : 'image'
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: editingItem 
            ? "Gallery item updated successfully" 
            : "Gallery item created successfully",
        });
        setIsDialogOpen(false);
        resetForm();
        refetch();
      } else {
        throw new Error('Failed to save gallery item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save gallery item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/gallery/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Gallery item deleted successfully",
        });
        refetch();
      } else {
        throw new Error('Failed to delete gallery item');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gallery item",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: GalleryItem) => {
    setEditingItem(item);
    const itemType = isValidGalleryType(item.type) ? item.type : 'image';
    setFormData({
      type: itemType,
      src: item.src,
      thumbnail: item.thumbnail || '',
      title: item.title,
      description: item.description
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      type: 'image',
      src: '',
      thumbnail: '',
      title: '',
      description: ''
    });
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'gallery');

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
        return data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file).then(url => {
        setFormData(prev => ({ ...prev, src: url }));
      }).catch(() => {
        // Error already handled in handleFileUpload
      });
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, src: e.target.value }));
  };

  const openPreview = (item: GalleryItem) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewItem(null);
    setIsPreviewOpen(false);
  };

  const convertYouTubeUrl = (url: string): string => {
    // Handle different YouTube URL formats
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    
    // If it's not a valid YouTube video URL, return empty string to show error
    if (url.includes('youtube.com') && !match) {
      return '';
    }
    
    return url;
  };

  const getVideoEmbedUrl = (url: string): string => {
    // If it's already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Convert regular YouTube URLs to embed format
    return convertYouTubeUrl(url);
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 z-0 opacity-20">
          <ParticleField />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-amber-300 text-lg">Loading gallery items...</div>
        </div>
      </div>
    );
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
            className="mb-12"
          >
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/dashboard')}
              className="border-amber-500/40 text-amber-200 hover:bg-amber-500/15 hover:border-amber-400 mb-8 transition-all duration-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl border border-amber-500/30">
                  <ImageIcon className="w-10 h-10 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent tracking-tight mb-3 leading-tight">
                    Gallery Management
                  </h1>
                  <p className="text-amber-200/80 text-xl font-medium" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                    Curate and manage The Void Gallery collection
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-amber-500/25 transition-all duration-300"
                >
                  <Plus className="mr-3 h-5 w-5" />
                  Add Gallery Item
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-10"
          >
            <Card className="bg-gradient-to-br from-black/80 to-amber-500/5 border-amber-500/30 backdrop-blur-xl shadow-xl">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="flex-1 w-full">
                    <Label className="text-amber-200 font-semibold mb-3 block">Search Gallery</Label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-400 h-5 w-5" />
                      <Input
                        placeholder="Search by title, description, or type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 py-3 bg-black/40 border-amber-500/30 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400/20 text-base font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="space-y-2">
                      <Label className="text-amber-200 font-semibold">Filter by Type</Label>
                      <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-48 bg-black/40 border-amber-500/30 text-amber-100 focus:ring-amber-400/20">
                          <Filter className="mr-2 h-4 w-4 text-amber-400" />
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-amber-500/30">
                          <SelectItem value="all_types" className="text-amber-100 hover:bg-amber-500/20 font-medium">All Types</SelectItem>
                          <SelectItem value="image" className="text-amber-100 hover:bg-amber-500/20 font-medium">Images</SelectItem>
                          <SelectItem value="video" className="text-amber-100 hover:bg-amber-500/20 font-medium">Videos</SelectItem>
                          <SelectItem value="youtube" className="text-amber-100 hover:bg-amber-500/20 font-medium">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="border-amber-500/40 text-amber-200 hover:bg-amber-500/15 hover:border-amber-400 transition-all duration-300"
                        onClick={() => refetch()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Refresh
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button
                          variant={viewMode === "grid" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("grid")}
                          className={`font-semibold transition-all duration-300 ${
                            viewMode === "grid" 
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg" 
                              : "border-amber-500/40 text-amber-200 hover:bg-amber-500/15"
                          }`}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Grid
                        </Button>
                        <Button
                          variant={viewMode === "table" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode("table")}
                          className={`font-semibold transition-all duration-300 ${
                            viewMode === "table" 
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg" 
                              : "border-amber-500/40 text-amber-200 hover:bg-amber-500/15"
                          }`}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Table
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-amber-300/70">
              Showing {filteredItems.length} of {galleryItems.length} gallery items
            </p>
            {/* Debug info */}
            <div className="text-xs text-amber-400/60 mt-2">
              <p>Raw data count: {galleryItems?.length || 0}</p>
              <p>Filtered count: {filteredItems?.length || 0}</p>
              <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
              <p>Error: {error ? 'Yes' : 'No'}</p>
            </div>
          </motion.div>

          {/* Gallery Items Grid */}
          {filteredItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center py-12"
            >
              <ImageIcon className="h-12 w-12 text-amber-500/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-amber-200 mb-2">No gallery items yet</h3>
              <p className="text-amber-400/70">Get started by adding your first gallery item.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filteredItems.map((item) => (
                <Card key={item.id} className="group bg-gradient-to-br from-black/60 to-amber-500/5 border-amber-500/30 hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 overflow-hidden h-full flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <div className="flex justify-between items-start mb-3">
                      <CardTitle className="text-amber-100 text-lg font-bold line-clamp-2 leading-tight flex-1 pr-2" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                        {item.title}
                      </CardTitle>
                      <Badge 
                        variant={item.type === 'image' ? 'default' : item.type === 'youtube' ? 'secondary' : 'secondary'} 
                        className={`px-2 py-1 font-semibold text-xs flex-shrink-0 ${
                          item.type === 'image' 
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-200 border-amber-400/40' 
                            : item.type === 'youtube'
                            ? 'bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-200 border-red-400/40'
                            : 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-200 border-blue-400/40'
                        }`}
                      >
                        {item.type === 'image' ? <ImageIcon className="h-3 w-3 mr-1" /> : item.type === 'youtube' ? <Youtube className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
                        {item.type === 'youtube' ? 'YouTube' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {/* Enhanced Preview */}
                    <div className="relative aspect-square overflow-hidden rounded-xl bg-black/40 border border-amber-500/20 group-hover:border-amber-400/50 transition-all duration-300 flex-shrink-0">
                      {item.type === 'image' ? (
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : item.type === 'youtube' ? (
                        <div className="relative w-full h-full">
                          {(() => {
                            const youtubeData = processYouTubeUrl(item.src);
                            return youtubeData ? (
                              <>
                                <img
                                  src={youtubeData.thumbnailUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    e.currentTarget.src = '/placeholder.svg';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                                  <div className="w-16 h-16 bg-gradient-to-r from-red-600/90 to-red-700/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                                    <Youtube className="h-8 w-8 text-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                <div className="text-center text-gray-400">
                                  <Youtube className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-xs">Invalid YouTube URL</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="relative w-full h-full">
                          <img
                            src={item.thumbnail || '/placeholder.svg'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center group-hover:bg-black/30 transition-colors duration-300">
                            <div className="w-16 h-16 bg-gradient-to-r from-amber-500/90 to-amber-600/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl">
                              <Play className="h-8 w-8 text-white ml-1" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Enhanced Description */}
                    <div className="space-y-3 flex-1">
                      <p className="text-amber-200/80 text-sm leading-relaxed line-clamp-3 font-medium min-h-[3.5rem]" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                        {item.description}
                      </p>
                      
                      {/* Type indicator */}
                      <div className="flex items-center gap-2 text-xs text-amber-400/60">
                        <div className={`w-2 h-2 rounded-full ${
                          item.type === 'image' ? 'bg-amber-400' : item.type === 'youtube' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                        <span className="font-medium">
                          {item.type === 'image' ? 'Image Asset' : item.type === 'youtube' ? 'YouTube Video' : 'Video Content'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 flex-shrink-0">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPreview(item)}
                          className="flex-1 border-blue-500/40 text-blue-200 hover:bg-blue-500/15 hover:border-blue-400 hover:text-blue-100 transition-all duration-300 font-medium text-xs"
                        >
                          {item.type === 'image' ? (
                            <>
                              <Eye className="h-3 w-3 mr-1.5" />
                              Preview
                            </>
                          ) : item.type === 'youtube' ? (
                            <>
                              <Youtube className="h-3 w-3 mr-1.5" />
                              Watch
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1.5" />
                              Play
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(item)}
                          className="flex-1 border-amber-500/40 text-amber-200 hover:bg-amber-500/15 hover:border-amber-400 hover:text-amber-100 transition-all duration-300 font-medium text-xs"
                        >
                          <Edit className="h-3 w-3 mr-1.5" />
                          Edit
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.src, '_blank')}
                          className="flex-1 border-green-500/40 text-green-200 hover:bg-green-500/15 hover:border-green-400 hover:text-green-100 transition-all duration-300 font-medium text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          Open in New Tab
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-500/40 text-red-300 hover:bg-red-500/15 hover:border-red-400 hover:text-red-200 transition-all duration-300 font-medium text-xs"
                            >
                              <Trash2 className="h-3 w-3 mr-1.5" />
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-black/95 border-amber-500/30 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-amber-100 text-xl font-bold">Remove Gallery Item</AlertDialogTitle>
                              <AlertDialogDescription className="text-amber-200/80 text-base leading-relaxed">
                                Are you sure you want to remove "{item.title}" from the gallery? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-amber-500/40 text-amber-200 hover:bg-amber-500/15 hover:border-amber-400 transition-all duration-300">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(item.id)}
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300"
                              >
                                Remove Item
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-black/90 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-200">
              {editingItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type" className="text-amber-200">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'image' | 'video' | 'youtube') => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="bg-black/50 border-amber-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-amber-500/30">
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="youtube">YouTube Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title" className="text-amber-200">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-black/50 border-amber-500/30 text-amber-100"
                placeholder="Enter title..."
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-amber-200">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-black/50 border-amber-500/30 text-amber-100"
                placeholder="Enter description..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="src" className="text-amber-200">
                {formData.type === 'image' ? 'Image URL' : formData.type === 'youtube' ? 'YouTube URL' : 'Video URL'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="src"
                  value={formData.src}
                  onChange={handleUrlChange}
                  className="flex-1 bg-black/50 border-amber-500/30 text-amber-100"
                  placeholder={
                    formData.type === 'image' 
                      ? 'Enter image URL...' 
                      : formData.type === 'youtube'
                      ? 'Enter YouTube URL or iframe code (e.g., https://youtube.com/watch?v=... or <iframe src="...">)'
                      : 'Enter YouTube URL or embed URL...'
                  }
                  required
                />
                {formData.type === 'image' && (
                  <div className="relative">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10 whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Image Preview */}
              {formData.type === 'image' && formData.src && (
                <div className="mt-2">
                  <Label className="text-amber-200 text-sm">Preview:</Label>
                  <div className="mt-1 relative w-32 h-32 overflow-hidden rounded-lg border border-amber-500/30">
                    <img
                      src={formData.src}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* Video Tips and Preview */}
              {formData.type === 'video' && (
                <div className="mt-2">
                  <p className="text-amber-300/70 text-xs">
                    💡 <strong>Tip:</strong> For YouTube videos, use a specific video URL like:
                    <br />• https://www.youtube.com/watch?v=VIDEO_ID
                    <br />• https://youtu.be/VIDEO_ID
                    <br />• https://www.youtube.com/embed/VIDEO_ID
                    <br /><strong>Note:</strong> YouTube homepage URLs cannot be embedded.
                  </p>
                  {formData.src && (
                    <div className="mt-2">
                      <Label className="text-amber-200 text-sm">Preview:</Label>
                      <div className="mt-1 relative w-full max-w-md aspect-video overflow-hidden rounded-lg border border-amber-500/30">
                        <iframe
                          src={`${formData.src}?rel=0&modestbranding=1&showinfo=0&controls=1&autoplay=0&mute=0&enablejsapi=1&origin=${window.location.origin}`}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                          allowFullScreen
                          loading="eager"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* YouTube Tips and Preview */}
              {formData.type === 'youtube' && (
                <div className="mt-2">
                  <p className="text-amber-300/70 text-xs">
                    💡 <strong>Tip:</strong> Paste any YouTube video URL or iframe embed code. We'll automatically convert it to an embed:
                    <br />• https://www.youtube.com/watch?v=VIDEO_ID
                    <br />• https://youtu.be/VIDEO_ID
                    <br />• https://www.youtube.com/shorts/VIDEO_ID
                    <br />• &lt;iframe src="https://www.youtube.com/embed/VIDEO_ID"&gt;&lt;/iframe&gt;
                    <br /><strong>Note:</strong> Channel URLs and playlists cannot be embedded.
                  </p>
                  {formData.src && (
                    <div className="mt-2">
                      <Label className="text-amber-200 text-sm">Preview:</Label>
                      {(() => {
                        const youtubeData = processYouTubeUrl(formData.src);
                        if (youtubeData) {
                          return (
                            <div className="mt-1 relative w-full max-w-md aspect-video overflow-hidden rounded-lg border border-amber-500/30">
                              <iframe
                                src={youtubeData.embedUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                loading="lazy"
                              />
                            </div>
                          );
                        } else if (isYouTubeUrl(formData.src) || isYouTubeIframe(formData.src)) {
                          return (
                            <div className="mt-1 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <p className="text-red-400 text-xs">
                                ⚠️ Invalid YouTube URL or iframe code. Please check the format.
                              </p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="mt-1 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-amber-400 text-xs">
                                ℹ️ Enter a valid YouTube URL or iframe code to see preview.
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {(formData.type === 'video' || formData.type === 'youtube') && (
              <div>
                <Label htmlFor="thumbnail" className="text-amber-200">
                  {formData.type === 'youtube' ? 'YouTube Thumbnail (Optional)' : 'Video Thumbnail'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
                    className="flex-1 bg-black/50 border-amber-500/30 text-amber-100"
                    placeholder="Enter thumbnail URL or upload image..."
                  />
                  <div className="relative">
                    <input
                      type="file"
                      id="thumbnail-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file).then(url => {
                            setFormData(prev => ({ ...prev, thumbnail: url }));
                          });
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10 whitespace-nowrap"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                    {formData.type === 'youtube' && formData.src && (() => {
                      const youtubeData = processYouTubeUrl(formData.src);
                      return youtubeData ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFormData(prev => ({ ...prev, thumbnail: youtubeData.thumbnailUrl }))}
                          className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10 whitespace-nowrap"
                        >
                          <Youtube className="h-4 w-4 mr-2" />
                          Auto Thumbnail
                        </Button>
                      ) : null;
                    })()}
                  </div>
                </div>
                {formData.thumbnail && (
                  <div className="mt-2">
                    <Label className="text-amber-200 text-sm">Thumbnail Preview:</Label>
                    <div className="mt-1 relative w-32 h-32 overflow-hidden rounded-lg border border-amber-500/30">
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-6xl bg-black/95 border-amber-500/20">
          <DialogHeader>
            <DialogTitle className="text-amber-200">
              {previewItem?.title}
            </DialogTitle>
            <DialogDescription className="text-amber-300/70">
              {previewItem?.type === 'image' ? 'Image preview' : previewItem?.type === 'youtube' ? 'YouTube video preview' : 'Video preview'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {previewItem?.type === 'image' ? (
              <div className="flex justify-center">
                <img
                  src={previewItem.src}
                  alt={previewItem.title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            ) : previewItem?.type === 'youtube' ? (
              <div className="flex justify-center">
                <div className="w-full max-w-5xl aspect-video">
                  {previewItem?.src ? (
                    (() => {
                      const youtubeData = processYouTubeUrl(previewItem.src);
                      return youtubeData ? (
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                          <iframe
                            src={youtubeData.embedUrl}
                            className="w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                            title={previewItem.title}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                          <div className="text-center">
                            <Youtube className="h-16 w-16 text-red-400 mx-auto mb-4" />
                            <p className="text-red-400 mb-4 text-lg">Invalid YouTube URL</p>
                            <p className="text-amber-300/70 text-sm">Please check the URL format</p>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                      <p className="text-amber-300">No YouTube URL available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-full max-w-5xl aspect-video">
                  {previewItem?.src ? (
                    <div>
                      <div className="mb-2 text-xs text-amber-300/70">
                        Debug: {previewItem.src}
                      </div>
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 w-full h-full rounded-lg bg-gray-800 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-amber-300 text-6xl mb-4">▶️</div>
                            <p className="text-amber-300 mb-4 text-lg">Click to watch on YouTube</p>
                            <p className="text-amber-300/70 text-sm mb-6">For the best performance and quality</p>
                            <Button
                              onClick={() => {
                                if (previewItem?.src) {
                                  const youtubeUrl = previewItem.src.replace('/embed/', '/watch?v=');
                                  window.open(youtubeUrl, '_blank');
                                }
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
                            >
                              Watch on YouTube
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-4">⚠️</div>
                        <p className="text-amber-300 mb-2">Video not available</p>
                        <p className="text-amber-300/70 text-sm">No video URL provided</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {previewItem?.description && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-amber-300">{previewItem.description}</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-amber-300/70 text-sm">
                Type: {previewItem?.type === 'image' ? 'Image' : 'Video'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (previewItem) {
                      openEditDialog(previewItem);
                      closePreview();
                    }
                  }}
                  className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (previewItem?.src) {
                      window.open(previewItem.src, '_blank');
                    }
                  }}
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 