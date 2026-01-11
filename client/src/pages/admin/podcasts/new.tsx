import { useEffect } from "react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Helmet } from "react-helmet";
import { ArrowLeft, Mic } from "lucide-react";
import { motion } from "framer-motion";
import PodcastForm from "@/components/admin/PodcastForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ParticleField from "@/components/ui/particle-field";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NewPodcastPage() {
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
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <Helmet>
          <title>Create New Podcast | Izuran Admin</title>
        </Helmet>
        
        <div className="max-w-4xl mx-auto">
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
                  <Link href="/admin/podcasts">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Podcasts
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Website
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <Mic className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                  Create New Podcast
                </h1>
                <p className="text-amber-200/60 mt-2">
                  Add a new podcast episode to the Izuran platform
                </p>
              </div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-amber-300">Podcast Details</CardTitle>
                <CardDescription className="text-amber-200/60">
                  Enter information about the podcast episode. All fields marked with * are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PodcastForm />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}