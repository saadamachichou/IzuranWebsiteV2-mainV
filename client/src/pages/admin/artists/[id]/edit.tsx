import { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Helmet } from "react-helmet";
import { ArrowLeft, Loader2 } from "lucide-react";
import ArtistForm from "@/components/admin/ArtistForm";
import { useToast } from "@/hooks/use-toast";
import { Artist } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EditArtistPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if the user is not an admin, redirect to home
    if (user && user.role !== 'admin') {
      setLocation('/');
      return;
    }

    // Fetch artist data
    const fetchArtist = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/artists/${params.id}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch artist data");
        }
        
        const data = await response.json();
        console.log('Fetched artist data:', data);
        setArtist(data);
      } catch (error) {
        console.error('Error fetching artist:', error);
        setError(error instanceof Error ? error.message : "An unexpected error occurred");
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load artist data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchArtist();
    }
  }, [params.id, user, setLocation, toast]);

  if (!user || user.role !== 'admin') {
    return null; // Don't render anything while checking authentication
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-amber-200/60">Loading artist data...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/artists" className="text-amber-400 hover:text-amber-300 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">Artist Not Found</h1>
          </div>
          
          <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
            <CardContent className="py-8">
              <div className="text-center">
                <p className="text-amber-200/60 mb-4">
                  {error || "The requested artist could not be found."}
                </p>
                <Link href="/admin/artists" className="text-amber-400 hover:text-amber-300 hover:underline">
                  Return to Artists
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      <Helmet>
        <title>Edit Artist: {artist.name} | Izuran Admin</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/artists" className="text-amber-400 hover:text-amber-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
            Edit Artist: {artist.name}
          </h1>
        </div>
        
        <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-amber-300">Artist Details</CardTitle>
            <CardDescription className="text-amber-200/60">
              Update the artist information below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArtistForm artist={artist} isEditing={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}