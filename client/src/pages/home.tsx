import React from "react";
import { Helmet } from "react-helmet";

import HeroSection from "@/components/ui/hero-section";
import FeaturedArtists from "@/components/home/FeaturedArtists";
import PodcastList from "@/components/podcast/PodcastList";
import EventList from "@/components/events/EventList";
import ProductList from "@/components/shop/ProductList";
import ArticleList from "@/components/knowledge/ArticleList";
import Newsletter from "@/components/home/Newsletter";
import FloatingSymbols from "@/components/ui/floating-symbols";

export default function Home() {
  // Ensure we always start at the top of the page when visiting the homepage
  React.useEffect(() => {
    // Clear any hash from the URL to prevent scrolling to sections
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    
    // Force scroll to top immediately and aggressively
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Scroll to top immediately
    scrollToTop();
    
    // Also scroll to top after a short delay to handle any async content loading
    const timeout1 = setTimeout(scrollToTop, 100);
    const timeout2 = setTimeout(scrollToTop, 500);
    const timeout3 = setTimeout(scrollToTop, 1000);
    
    // Ensure scroll position stays at top for the first few seconds
    const ensureTopPosition = () => {
      if (window.scrollY > 0 || document.documentElement.scrollTop > 0 || document.body.scrollTop > 0) {
        scrollToTop();
      }
    };
    
    // Check scroll position multiple times to ensure it stays at top
    const interval = setInterval(ensureTopPosition, 100);
    
    // Stop checking after 3 seconds
    const timeout4 = setTimeout(() => {
      clearInterval(interval);
    }, 3000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearInterval(interval);
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
              
              <PodcastList limit={2} />
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
              
              <EventList limit={2} />
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
              
              <EventList limit={2} queryKey="/api/events/past" />
            </div>
          </section>
          
          <section className="py-16 relative">
            {/* Removed candle-like glowing amber animation from Shop */}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Shop</span>
              </h2>
              
              <ProductList limit={3} />
            </div>
          </section>
          
          <section className="py-16 relative">
            {/* Removed candle-like glowing amber animation from Esoteric Knowledge */}
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl font-bold mb-12 text-center">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Esoteric Knowledge</span>
              </h2>
              
              <ArticleList limit={3} />
            </div>
          </section>
          
          <Newsletter />
        </main>
      </div>
    </>
  );
}
