import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import StreamForm from "@/components/admin/StreamForm";

// Lazy load ParticleField to reduce initial bundle size
const ParticleField = lazy(() => import("@/components/ui/particle-field"));

export default function NewStreamPage() {
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
          <StreamForm isEditing={false} />
        </motion.div>
      </div>
    </div>
  );
}

