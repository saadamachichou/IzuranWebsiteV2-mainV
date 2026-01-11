import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Plus, Edit, Trash2, ArrowLeft, ExternalLink, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import ParticleField from "@/components/ui/particle-field";

interface Release {
  id: string;
  title: string;
  artist: string;
  type: 'album' | 'ep' | 'single' | 'compilation';
  releaseDate: string;
  genre: string;
  description: string;
  bandcampUrl: string;
  embedCode: string;
  coverArt: string;
  tracks: Track[];
}

interface Track {
  id: string;
  title: string;
  duration: string;
  bandcampUrl: string;
}

export default function AdminReleasesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [releases, setReleases] = useState<Release[]>([
    {
      id: "1",
      title: "EP - Son of Sands",
      artist: "Dahula",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "A mystical journey through desert soundscapes and ancient rhythms.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-son-of-sands",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=3453659420/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-son-of-sands">EP - Son of Sands de Dahula</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "2",
      title: "EP - Hiranyagarbha: Primordial Pulse",
      artist: "KalimbAwa & Appa",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "A primordial exploration of sound and rhythm from the cosmic egg.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-hiranyagarbha-primordial-pulse",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=965419212/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-hiranyagarbha-primordial-pulse">EP - Hiranyagarbha: Primordial Pulse de KalimbAwa &amp; Appa</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "3",
      title: "VA-Cradle of Aeons",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A mystical journey through ancient aeons and cosmic soundscapes.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-cradle-of-aeons",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=1221416351/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/va-cradle-of-aeons">VA-Cradle of Aeons de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "4",
      title: "VA-Catafalque",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A compilation of dark and mystical electronic music from the depths of consciousness.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-catafalque",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2366517237/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/va-catafalque">VA-Catafalque de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "5",
      title: "EP - Echoes of the Infinite",
      artist: "Chilllight",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic / Ambient",
      description: "A journey through infinite sonic landscapes and ethereal soundscapes.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-echoes-of-the-infinite",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=3779744460/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-echoes-of-the-infinite">EP - Echoes of the Infinite de Chilllight</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "6",
      title: "EP - Shuma Gore",
      artist: "Cranium Drill",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic / Industrial",
      description: "Dark industrial rhythms and mechanical soundscapes from the depths.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-shuma-gore",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2727385677/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-shuma-gore">EP - Shuma Gore de Cranium Drill</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "7",
      title: "VA-The Arkhetupon Dialectic",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A philosophical exploration through sound and rhythm.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-the-arkhetupon-dialectic",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=793235286/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/va-the-arkhetupon-dialectic">VA-The Arkhetupon Dialectic de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "8",
      title: "VA-Hymns of Kemet",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "Ancient Egyptian-inspired electronic hymns and sacred soundscapes.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-hymns-of-kemet",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2893629425/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/va-hymns-of-kemet">VA-Hymns of Kemet de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "9",
      title: "VA-CATHARSIS",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A transformative journey through cathartic electronic experiences.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-catharsis",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2900729510/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/va-catharsis">VA-CATHARSIS de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    type: 'album' as 'album' | 'ep' | 'single' | 'compilation',
    releaseDate: '',
    genre: '',
    description: '',
    bandcampUrl: '',
    embedCode: '',
    coverArt: '',
    tracks: [{ id: '1', title: '', duration: '', bandcampUrl: '' }]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRelease) {
      setReleases(prev => prev.map(r => r.id === editingRelease.id ? { ...formData, id: editingRelease.id } : r));
      toast({ title: "Release updated successfully" });
    } else {
      setReleases(prev => [...prev, { ...formData, id: Date.now().toString() }]);
      toast({ title: "Release added successfully" });
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingRelease(null);
    setFormData({
      title: '', artist: '', type: 'album', releaseDate: '', genre: '', description: '',
      bandcampUrl: '', embedCode: '', coverArt: '', tracks: [{ id: '1', title: '', duration: '', bandcampUrl: '' }]
    });
  };

  const openEditDialog = (release: Release) => {
    setEditingRelease(release);
    setFormData(release);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setReleases(prev => prev.filter(r => r.id !== id));
    toast({ title: "Release deleted successfully" });
  };

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <Button variant="outline" onClick={() => setLocation('/admin/dashboard')} className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl border border-amber-500/30">
                <Music className="w-10 h-10 text-amber-400" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent">
                  Releases Management
                </h1>
                <p className="text-amber-200/80 text-xl">Manage your Bandcamp discography</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-amber-500 to-amber-600">
                <Plus className="mr-2 h-4 w-4" />Add Release
              </Button>
            </div>
          </motion.div>

          {/* Releases Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {releases.map((release) => (
                <Card key={release.id} className="bg-gradient-to-br from-black/60 to-amber-500/5 border-amber-500/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-amber-100">{release.title}</CardTitle>
                      <span className="text-xs bg-amber-500/20 text-amber-200 px-2 py-1 rounded">
                        {release.type}
                      </span>
                    </div>
                    <p className="text-amber-300/80 text-sm">{release.artist}</p>
                    <p className="text-amber-400/60 text-xs">{release.releaseDate} • {release.genre}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <img src={release.coverArt} alt={release.title} className="w-full h-32 object-cover rounded" />
                    <p className="text-amber-200/80 text-sm line-clamp-2">{release.description}</p>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(release)}>
                        <Edit className="h-3 w-3 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(release.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />Delete
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(release.bandcampUrl, '_blank')}>
                        <ExternalLink className="h-3 w-3 mr-1" />View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-black/90 border border-amber-500/30 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-amber-200 mb-4">
              {editingRelease ? 'Edit Release' : 'Add Release'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-amber-200">Title</Label>
                  <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-amber-200">Artist</Label>
                  <Input value={formData.artist} onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))} required />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-amber-200">Type</Label>
                  <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))} className="w-full bg-black/50 border border-amber-500/30 text-amber-100 rounded px-3 py-2">
                    <option value="album">Album</option>
                    <option value="ep">EP</option>
                    <option value="single">Single</option>
                    <option value="compilation">Compilation</option>
                  </select>
                </div>
                <div>
                  <Label className="text-amber-200">Release Date</Label>
                  <Input value={formData.releaseDate} onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))} required />
                </div>
                <div>
                  <Label className="text-amber-200">Genre</Label>
                  <Input value={formData.genre} onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))} required />
                </div>
              </div>
              
              <div>
                <Label className="text-amber-200">Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} required />
              </div>
              
              <div>
                <Label className="text-amber-200">Bandcamp URL</Label>
                <Input value={formData.bandcampUrl} onChange={(e) => setFormData(prev => ({ ...prev, bandcampUrl: e.target.value }))} required />
              </div>
              
              <div>
                <Label className="text-amber-200">Embed Code</Label>
                <Textarea value={formData.embedCode} onChange={(e) => setFormData(prev => ({ ...prev, embedCode: e.target.value }))} required />
              </div>
              
              <div>
                <Label className="text-amber-200">Cover Art URL</Label>
                <Input value={formData.coverArt} onChange={(e) => setFormData(prev => ({ ...prev, coverArt: e.target.value }))} required />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRelease ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
