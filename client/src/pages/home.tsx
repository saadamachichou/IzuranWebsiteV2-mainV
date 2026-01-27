import React, { lazy, Suspense } from "react";
import { Helmet } from "react-helmet";

import HeroSection from "@/components/ui/hero-section";
import FeaturedArtists from "@/components/home/FeaturedArtists";

// Lazy load below-the-fold components to improve initial load time
const PodcastList = lazy(() => import("@/components/podcast/PodcastList").then(m => ({ default: m.default })));
const EventList = lazy(() => import("@/components/events/EventList").then(m => ({ default: m.default })));
const ProductList = lazy(() => import("@/components/shop/ProductList").then(m => ({ default: m.default })));
const ArticleList = lazy(() => import("@/components/knowledge/ArticleList").then(m => ({ default: m.default })));
const Newsletter = lazy(() => import("@/components/home/Newsletter").then(m => ({ default: m.default })));

// Simple loading placeholder for lazy components
const SectionLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-500"></div>
  </div>
);

export default function Home() {
  // Ensure we always start at the top of the page when visiting the homepage
  React.useEffect(() => {
    // Clear any hash from the URL to prevent scrolling to sections
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Scroll to top immediately - simplified approach
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Single delayed check for async content (reduced from multiple timers)
    const timeout = setTimeout(() => {
      if (window.scrollY > 0) {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }, 100);
    
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Izuran - Record Label & Event Promoter</title>
        <meta name="description" content="A record label and event promoter rooted in Amazigh culture and esoteric knowledge. Experience the fusion of ancient mysticism and futuristic sound." />
      </Helmet>
      
      {/* Full-screen immersive hero section */}
      <HeroSection />
      
      {/* Main content */}
      <div className="bg-gradient-to-b from-black to-izuran-black">
        
        <main>
          <FeaturedArtists />
          
          <section className="py-16 relative">
            {/* Removed candle-like glowing amber animation */}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Latest Podcasts</span>
              </h2>
              
              <Suspense fallback={<SectionLoader />}>
                <PodcastList limit={2} />
              </Suspense>
            </div>
          </section>
          
          <section className="py-16 relative">
            <div className="absolute inset-0 z-0 opacity-20">
              <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-amber-600 blur-3xl animate-pulse-slow"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Upcoming Events</span>
              </h2>
              
              <Suspense fallback={<SectionLoader />}>
                <EventList limit={2} />
              </Suspense>
            </div>
          </section>

          <section className="py-16 relative">
            <div className="absolute inset-0 z-0 opacity-10">
              <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-gray-600 blur-3xl animate-pulse-slow"></div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Past Events</span>
              </h2>
              
              <Suspense fallback={<SectionLoader />}>
                <EventList limit={2} queryKey="/api/events/past" />
              </Suspense>
            </div>
          </section>
          
          <section className="py-16 relative">
            {/* Removed candle-like glowing amber animation from Shop */}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Shop</span>
              </h2>
              
              <Suspense fallback={<SectionLoader />}>
                <ProductList limit={3} />
              </Suspense>
            </div>
          </section>
          
          <section className="py-16 relative">
            {/* Removed candle-like glowing amber animation from Esoteric Knowledge */}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Esoteric Knowledge</span>
              </h2>
              
              <Suspense fallback={<SectionLoader />}>
                <ArticleList limit={3} />
              </Suspense>
            </div>
          </section>
          
          <Suspense fallback={<SectionLoader />}>
            <Newsletter />
          </Suspense>
        </main>
      </div>
    </>
  );
}
