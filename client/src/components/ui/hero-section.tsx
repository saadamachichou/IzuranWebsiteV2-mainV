import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedLogo from "@/components/ui/animated-logo";
import FloatingSymbols from "@/components/ui/floating-symbols";
import HiddenGallery from "@/components/home/HiddenGallery";

export default function HeroSection() {
  // For scroll indicator animation
  const { scrollY } = useScroll();
  const scrollOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scrollScale = useTransform(scrollY, [0, 200], [1, 0.8]);

  // Animation states
  const [logoAnimated, setLogoAnimated] = useState(false);
  const [textAnimated, setTextAnimated] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Animation timing only - no background particles with non-Tifinagh symbols
  useEffect(() => {
    // Only scroll to top if we're not coming from a loading screen
    // The loading screen already handles scrolling to the top
    const isFromLoadingScreen = sessionStorage.getItem('fromLoadingScreen');
    
    // Also check if we're currently in a loading state
    const isLoading = document.querySelector('.fixed.inset-0.z-50') !== null;
    
    if (!isFromLoadingScreen && !isLoading) {
      // Ensure we start at the top of the page
      window.scrollTo({
        top: 0,
        behavior: "instant"
      });
    } else if (isFromLoadingScreen) {
      // Clear the flag after using it
      sessionStorage.removeItem('fromLoadingScreen');
    }

    // Set textAnimated immediately on next frame for fastest LCP
    // Elements are already visible, so animation can start immediately
    requestAnimationFrame(() => {
      setTextAnimated(true);
    });

    // Start logo animation sequence
    const logoTimer = setTimeout(() => {
      setLogoAnimated(true);
    }, 300);

    return () => {
      clearTimeout(logoTimer);
    };
  }, []);

  // Handle scroll down button click
  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Background elements - only geometric patterns, no symbols */}
      <div className="absolute inset-0 z-0">

        {/* Sacred geometry background */}
        <motion.div
          className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{
            duration: 240,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{ transformOrigin: "center center" }}
        >
          <svg className="w-full h-full" viewBox="0 0 1000 1000">
            <g stroke="rgba(212, 175, 55, 0.3)" fill="none" strokeWidth="0.5">
              {/* Flower of Life pattern */}
              <circle cx="500" cy="500" r="300" />
              <circle cx="500" cy="200" r="300" />
              <circle cx="500" cy="800" r="300" />
              <circle cx="200" cy="500" r="300" />
              <circle cx="800" cy="500" r="300" />
              <circle cx="300" cy="300" r="300" />
              <circle cx="700" cy="300" r="300" />
              <circle cx="300" cy="700" r="300" />
              <circle cx="700" cy="700" r="300" />
              {/* Metatron's Cube inner shapes */}
              <polygon points="500,200 300,300 300,700 500,800 700,700 700,300" />
              <polygon points="500,350 350,450 350,650 500,750 650,650 650,450" />
              <line x1="200" y1="500" x2="800" y2="500" />
              <line x1="500" y1="200" x2="500" y2="800" />
              <line x1="300" y1="300" x2="700" y2="700" />
              <line x1="300" y1="700" x2="700" y2="300" />
            </g>
          </svg>
        </motion.div>

        {/* Glowing orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full bg-yellow-800/5 blur-[100px] animate-pulse-slow" />
        <div className="absolute top-1/3 right-1/3 w-[25vw] h-[25vw] rounded-full bg-amber-900/5 blur-[80px] animate-pulse-slower" />
        <div className="absolute bottom-1/3 left-1/4 w-[30vw] h-[30vw] rounded-full bg-amber-700/5 blur-[90px] animate-pulse-slow" />
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated Logo with Floating Symbols */}
          <motion.div
            initial={{ scale: 0.8, opacity: 1 }}
            animate={{
              scale: logoAnimated ? 1 : 0.8,
              opacity: 1,
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="mx-auto mb-8 relative flex justify-center items-center"
          >
            {/* Floating Symbols around Logo - Behind the logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: logoAnimated ? 1 : 0 }}
              transition={{ duration: 2, delay: 1 }}
              className="absolute inset-0 w-full h-full z-0"
              style={{ 
                width: '600px', 
                height: '600px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <FloatingSymbols density="heavy" area="hero" />
            </motion.div>
            
            {/* Logo - In front of the symbols - Made bigger */}
            <div className="relative z-20" style={{ transform: 'scale(1.5)' }}>
              <AnimatedLogo size="xl" />
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 1, y: 30 }}
            animate={{
              opacity: 1,
              y: textAnimated ? 0 : 30,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider mb-4 drop-shadow-lg"
            style={{ willChange: 'transform' }}
          >
            IZURAN
          </motion.h1>

          {/* Tagline - LCP element, visible immediately */}
          <p
            className="text-lg md:text-xl text-yellow-100 font-semibold tracking-widest mb-8 drop-shadow"
            style={{ opacity: 1, transform: 'translateY(0)' }}
          >
            ANCIENT RHYTHMS • FUTURE VISIONS
          </p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 1, y: 20 }}
            animate={{
              opacity: 1,
              y: textAnimated ? 0 : 20,
            }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="text-base md:text-lg text-yellow-50 max-w-4x1 mx-auto mb-10 drop-shadow"
            style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif', willChange: 'transform' }}
          >
            Discover the mystical sound of Izuran, where ancestral Amazigh
            rhythms merge with psychedelic electronic music to create an
            immersive journey through time and consciousness.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: textAnimated ? 1 : 0,
              y: textAnimated ? 0 : 20,
            }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="flex justify-center gap-4 mt-8 mx-auto"
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 border-amber-500/50 text-amber-100"
              onClick={() => {
                console.log('Explore the Void clicked!');
                setIsGalleryOpen(true);
              }}
            >
              EXPLORE THE VOID
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-700/50 text-amber-200 hover:bg-amber-950/30"
            >
              LATEST RELEASES
            </Button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-20 left-[48%] transform -translate-x-1/2 cursor-pointer"
          style={{
            opacity: scrollOpacity,
            scale: scrollScale,
          }}
          onClick={handleScrollDown}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 2,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center"
          >
            <p className="text-amber-300/70 text-sm mb-2 font-light tracking-widest">
              SCROLL DOWN
            </p>
            <div className="p-2 rounded-full border border-amber-500/20 bg-black/20 backdrop-blur-md">
              <ArrowDown className="h-5 w-5 text-amber-300/70" />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Hidden Gallery */}
      <HiddenGallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
    </div>
  );
}
