import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { ArrowLeft, Loader2 } from "lucide-react";
import PodcastForm from "@/components/admin/PodcastForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function EditPodcastPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [podcast, setPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPodcast = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/podcasts/${params.id}`, { credentials: 'include' });
        if (!response.ok) throw new Error("Failed to fetch podcast data");
        const data = await response.json();
        // Map snake_case to camelCase if needed
        setPodcast({
          id: data.id,
          title: data.title,
          slug: data.slug,
          description: data.description,
          coverUrl: data.coverUrl || data.cover_url,
          audioUrl: data.audioUrl || data.audio_url,
          artistName: data.artistName || data.artist_name,
          duration: data.duration,
          genre: data.genre,
          createdAt: data.createdAt || data.created_at,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchPodcast();
  }, [params.id]);

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>;
  if (error || !podcast) return <div>Error: {error || "Podcast not found"}</div>;

  return (
    <div className="container mx-auto p-6">
      <Helmet><title>Edit Podcast | Izuran Admin</title></Helmet>
      <div className="flex flex-col gap-4 mb-6">
        <button onClick={() => setLocation("/admin/podcasts")} className="w-fit border-amber-500/30 text-amber-300 hover:bg-amber-500/10 flex items-center gap-2"><ArrowLeft className="mr-2 h-4 w-4" />Back</button>
        <h1 className="text-3xl font-bold tracking-tight text-amber-300">Edit Podcast</h1>
      </div>
      <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-amber-300">Podcast Details</CardTitle>
          <CardDescription className="text-amber-200/60">Update the podcast information below.</CardDescription>
        </CardHeader>
        <CardContent>
          <PodcastForm podcast={podcast} isEditing={true} />
        </CardContent>
      </Card>
    </div>
  );
}