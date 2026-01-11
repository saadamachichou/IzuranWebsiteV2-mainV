import { useEffect } from "react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import ArtistForm from "@/components/admin/ArtistForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ParticleField from "@/components/ui/particle-field";

export default function NewArtistPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Check if the user is not an admin, redirect to home
    if (user && user.role !== 'admin') {
      setLocation('/');
    }
  }, [user, setLocation]);

  if (!user || user.role !== 'admin') {
    return null; // Don't render anything while checking authentication
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      <div className="relative z-10 p-8">
        <Helmet>
          <title>Add New Artist | Izuran Admin</title>
        </Helmet>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin/artists" className="text-amber-300 hover:text-amber-400 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">Add New Artist</h1>
          </div>
          <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-amber-300">Artist Details</CardTitle>
              <CardDescription className="text-amber-200/60">
                Fill in the form below to create a new artist profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ArtistForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}