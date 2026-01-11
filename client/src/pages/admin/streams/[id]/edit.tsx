import { useEffect, useState, lazy, Suspense } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import StreamForm from "@/components/admin/StreamForm";
import { Stream } from "@shared/schema.ts";

// Lazy load ParticleField to reduce initial bundle size
const ParticleField = lazy(() => import("@/components/ui/particle-field"));

export default function EditStreamPage() {
  const params = useParams();
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const streamId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    if (streamId) {
      fetchStream();
    }
  }, [streamId]);

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/admin/streams/${streamId}`);
      if (response.ok) {
        const data = await response.json();
        setStream(data);
      } else {
        console.error('Failed to fetch stream');
      }
    } catch (error) {
      console.error('Error fetching stream:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black font-ami-r flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-200">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="relative min-h-screen bg-black font-ami-r flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Stream not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <Suspense fallback={null}>
          <ParticleField />
        </Suspense>
      </div>
      
      <div className="relative z-10 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <StreamForm stream={stream} isEditing={true} />
        </motion.div>
      </div>
    </div>
  );
}

