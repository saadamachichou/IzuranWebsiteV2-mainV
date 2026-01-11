import { Helmet } from "react-helmet";
import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Radio, Music } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Lazy load ParticleField to reduce initial bundle size
const ParticleField = lazy(() => import("@/components/ui/particle-field"));

export default function Podcasts() {
  return (
    <>
      <Helmet>
        <title>Podcasts - Izuran</title>
        <meta name="description" content="Explore Izuran's podcast content including Izuran Series and live streams." />
      </Helmet>
      
      <div className="relative min-h-screen bg-black">
        {/* Particle field background animation */}
        <div className="absolute inset-0 z-0 opacity-20">
          <Suspense fallback={null}>
            <ParticleField />
          </Suspense>
        </div>

        <div className="relative z-10 pt-40 pb-20 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent tracking-wider drop-shadow-lg mb-6" style={{letterSpacing: '0.08em'}}>
                  Our Podcasts
                </h1>
                <p className="text-xl max-w-3xl mx-auto text-yellow-200/80 leading-relaxed" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  Explore our collection of podcasts and live streaming content
                </p>
              </motion.div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              {/* Izuran Series Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-black/80 via-amber-950/30 to-black/80 border-amber-500/40 backdrop-blur-xl hover:border-amber-400/60 transition-all duration-500 cursor-pointer h-full shadow-2xl hover:shadow-amber-500/20">
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Animated border glow */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-500/0 via-amber-400/20 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  
                  <Link href="/serious-izuran" className="block h-full flex flex-col">
                    <CardHeader className="relative z-10 p-8 flex-1 flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-amber-600/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative p-4 bg-gradient-to-br from-amber-500/20 via-amber-400/15 to-amber-600/20 rounded-xl border border-amber-400/30 group-hover:border-amber-400/50 group-hover:scale-110 transition-all duration-300">
                            <Music className="h-8 w-8 text-amber-300 group-hover:text-amber-200 transition-colors" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 group-hover:from-amber-100 group-hover:via-yellow-100 group-hover:to-amber-200 transition-all duration-300 mb-2">
                            Izuran Series
                          </CardTitle>
                          <div className="h-1 w-20 bg-gradient-to-r from-amber-400 to-transparent rounded-full mt-2 group-hover:w-32 transition-all duration-300" />
                        </div>
                      </div>
                      <CardDescription 
                        className="text-amber-200/80 text-base leading-relaxed mt-4 relative z-10 flex-1"
                        style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                      >
                        Dive into our collection of exclusive podcasts featuring interviews, music showcases, and deep discussions about Amazigh culture and electronic music. Listen to embedded SoundCloud content from our artists.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-8 pt-0 flex-shrink-0">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border border-amber-500/20 group-hover:border-amber-400/40 group-hover:from-amber-500/20 transition-all duration-300">
                        <span className="text-amber-300 group-hover:text-amber-200 font-semibold transition-colors">
                          Explore Podcasts
                        </span>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-400 group-hover:text-amber-300 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>

              {/* Streams Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card className="relative overflow-hidden bg-gradient-to-br from-black/80 via-purple-950/30 to-black/80 border-purple-500/40 backdrop-blur-xl hover:border-purple-400/60 transition-all duration-500 cursor-pointer h-full shadow-2xl hover:shadow-purple-500/20">
                  {/* Decorative gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Animated border glow */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/0 via-purple-400/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                  
                  <Link href="/streams" className="block h-full flex flex-col">
                    <CardHeader className="relative z-10 p-8 flex-1 flex flex-col">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-purple-600/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <div className="relative p-4 bg-gradient-to-br from-purple-500/20 via-purple-400/15 to-purple-600/20 rounded-xl border border-purple-400/30 group-hover:border-purple-400/50 group-hover:scale-110 transition-all duration-300">
                            <Radio className="h-8 w-8 text-purple-300 group-hover:text-purple-200 transition-colors" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-purple-300 group-hover:from-purple-100 group-hover:via-pink-100 group-hover:to-purple-200 transition-all duration-300 mb-2">
                            Streams
                          </CardTitle>
                          <div className="h-1 w-20 bg-gradient-to-r from-purple-400 to-transparent rounded-full mt-2 group-hover:w-32 transition-all duration-300" />
                        </div>
                      </div>
                      <CardDescription 
                        className="text-purple-200/80 text-base leading-relaxed mt-4 relative z-10 flex-1"
                        style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                      >
                        Watch our artists live on Twitch. Experience real-time performances, DJ sets, and interactive sessions with the Izuran community.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 p-8 pt-0 flex-shrink-0">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border border-purple-500/20 group-hover:border-purple-400/40 group-hover:from-purple-500/20 transition-all duration-300">
                        <span className="text-purple-300 group-hover:text-purple-200 font-semibold transition-colors">
                          Watch Live Streams
                        </span>
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
