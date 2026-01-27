"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ParticleField from "@/components/ui/particle-field";

interface LoadingScreenProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
}

export default function LoadingScreen({ isLoading, onLoadingComplete }: LoadingScreenProps) {
  const [loading, setLoading] = useState(isLoading);
  const [opacity, setOpacity] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Update loading state when isLoading prop changes
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    // Completely disable scrollbar and prevent all scrolling during loading screen
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    // Hide scrollbar on both html and body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    // Prevent all scroll events
    const preventAllScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Add scroll prevention
    document.addEventListener('scroll', preventAllScroll, { passive: false });
    document.addEventListener('wheel', preventAllScroll, { passive: false });
    document.addEventListener('touchmove', preventAllScroll, { passive: false });
    document.addEventListener('keydown', (e) => {
      // Prevent arrow keys, Page Up/Down, Home/End
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });
    
    // Fade in the logo quickly for better perceived performance
    const fadeInTimeout = setTimeout(() => {
      setOpacity(1);
    }, 200);

    // Simulate loading progress with optimized pace for 1.5 seconds total
    const progressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        // Progress increment to reach 100% in exactly 1 second
        const increment = 10; // 10% every 100ms = 100% in 1 second (10 intervals * 100ms = 1000ms = 1s)
        const newProgress = Math.min(prevProgress + increment, 100);

        // When we reach 100%, clear the interval and set loading to false after brief delay
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            // Remove scroll prevention before completing
            document.documentElement.style.overflow = originalHtmlOverflow;
            document.body.style.overflow = originalBodyOverflow;
            document.removeEventListener('scroll', preventAllScroll);
            document.removeEventListener('wheel', preventAllScroll);
            document.removeEventListener('touchmove', preventAllScroll);
            
            // Ensure scroll position is at top when loading completes - multiple attempts for reliability
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            // Additional scroll to top after a brief delay to ensure it sticks
            setTimeout(() => {
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }, 50);
            
            setLoading(false);
            if (onLoadingComplete) {
              onLoadingComplete();
            }
          }, 500); // Brief delay after reaching 100% (Total: 1.5 seconds)
        }

        return newProgress;
      });
    }, 100); // 100ms interval: 10% every 100ms = 100% in exactly 1 second

    return () => {
      clearTimeout(fadeInTimeout);
      clearInterval(progressInterval);
      // Restore original overflow and remove scroll prevention
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.removeEventListener('scroll', preventAllScroll);
      document.removeEventListener('wheel', preventAllScroll);
      document.removeEventListener('touchmove', preventAllScroll);
    };
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Particles behind everything */}
            <div className="absolute inset-0 z-0 opacity-15">
              <ParticleField />
            </div>

            <motion.div
              className="relative z-20 flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: opacity,
                scale: 1,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  filter: [
                    "drop-shadow(0 0 25px rgba(255, 223, 133, 0.8)) brightness(1.2)",
                    "drop-shadow(0 0 40px rgba(255, 223, 133, 1)) brightness(1.4)",
                    "drop-shadow(0 0 25px rgba(255, 223, 133, 0.8)) brightness(1.2)",
                  ],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="w-64 h-64 md:w-80 md:h-80 relative"
              >
                <img
                  src="/images/izuran_logo.svg"
                  alt="Izuran Logo"
                  className="object-contain w-full h-full"
                  fetchPriority="high"
                  loading="eager"
                />
              </motion.div>

              {/* Text below logo */}
              <motion.div
                className="mt-4 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 1 }}
              >
                <p className="text-[#ffdf85] font-medium tracking-widest text-lg md:text-xl">
                  ANCIENT RHYTHMS - FUTURE VISION
                </p>
              </motion.div>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              className="absolute bottom-24 left-0 right-0 mx-auto w-64 md:w-80 flex flex-col items-center gap-3 z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: opacity }}
              transition={{ delay: 1, duration: 1 }}
            >
              <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-[#b16e29]/30 relative">
                {/* Glow effect behind the bar */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    boxShadow: "0 0 15px 2px rgba(255, 223, 133, 0.5)",
                    opacity: 0.6,
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />

                {/* Main progress bar */}
                <motion.div
                  className="h-full rounded-full relative"
                  style={{
                    background:
                      "linear-gradient(90deg, #b16e29, #ffdf85, #cf933a)",
                  }}
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                >
                  {/* Animated shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      repeat: Number.POSITIVE_INFINITY,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                </motion.div>
              </div>

              {/* Percentage text with mystical animation */}
              <motion.div
                className="text-[#ffdf85] text-sm font-medium tracking-wider"
                animate={{
                  textShadow: [
                    "0 0 4px rgba(255, 223, 133, 0.3)",
                    "0 0 8px rgba(255, 223, 133, 0.6)",
                    "0 0 4px rgba(255, 223, 133, 0.3)",
                  ],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                {Math.round(progress)}%
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute bottom-12 left-0 right-0 text-center text-[#ffdf85]/80 text-sm z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: opacity }}
              transition={{ delay: 1.5, duration: 1 }}
            >
              <motion.p
                animate={{
                  textShadow: [
                    "0 0 4px rgba(255, 223, 133, 0.3)",
                    "0 0 8px rgba(255, 223, 133, 0.6)",
                    "0 0 4px rgba(255, 223, 133, 0.3)",
                  ],
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "easeInOut",
                }}
                className="font-medium tracking-widest"
              >
                TRANSCENDING THE VOID
              </motion.p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
