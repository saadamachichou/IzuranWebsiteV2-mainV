import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import AnimatedLogo from "@/components/ui/animated-logo";
import HiddenGallery from "./HiddenGallery";

export default function Hero() {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  return (
    <>
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <motion.div
        className="absolute inset-0 z-0 opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1.5 }}
      >
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500 blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-amber-600 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1,
          }}
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Large animated logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              className="relative"
            >
              <AnimatedLogo
                size="lg"
                className="mx-auto mb-6"
                showText={false}
              />

              {/* Add a subtle shadow beneath the logo */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-amber-500/10 blur-xl rounded-full" />
            </motion.div>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-cinzel mb-6 glow-text">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-400 to-white">
              IZURAN
            </span>
          </h1>
          <motion.p
            className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-300 font-mystical"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            A record label and event promoter rooted in Amazigh culture and
            esoteric knowledge. Experience the fusion of ancient mysticism and
            futuristic sound.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link
              href="/podcasts"
              className="px-8 py-3 bg-amber-600/20 border border-amber-500 rounded-md text-white font-medium glow-button transition-all hover:bg-amber-600/30"
            >
              Listen to Podcast
            </Link>
            <Link
              href="/events"
              className="px-8 py-3 bg-transparent border border-amber-500 rounded-md text-white font-medium glow-button transition-all hover:bg-amber-600/20"
            >
              Upcoming Events
            </Link>
          </motion.div>

          {/* Explore the Void button */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/50 rounded-md text-purple-300 font-medium transition-all duration-300 hover:from-purple-600/30 hover:to-cyan-600/30 hover:border-purple-400/70 hover:text-purple-200 hover:scale-105 backdrop-blur-sm relative overflow-hidden group"
            >
              <span className="relative z-10">Explore the Void</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>

    {/* Hidden Gallery */}
    <HiddenGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
  </>
  );
}
