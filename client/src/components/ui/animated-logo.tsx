import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

export default function AnimatedLogo({
  size = "md",
  className = "",
  showText = false,
  onClick,
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; delay: number; direction: number }[]
  >([]);

  // Create mystical particles for large logos
  useEffect(() => {
    if (size === "lg" || size === "xl") {
      const particleCount = size === "xl" ? 12 : 8;
      const newParticles = Array.from({ length: particleCount }).map(
        (_, i) => ({
          id: i,
          x: Math.random() * 80 - 40, // Random x offset between -40 and 40
          y: Math.random() * 30 + 20, // Random y starting position
          delay: Math.random() * 5, // Random delay
          direction: Math.random() > 0.5 ? 1 : -1, // Random direction
        }),
      );
      setParticles(newParticles);
    }
  }, [size]);

  const sizes = {
    sm: "h-8 w-auto",
    md: "h-16 w-auto",
    lg: "h-32 w-auto",
    xl: "h-64 w-auto",
  };

  const pulseAnimation = {
    initial: { opacity: 0.8, filter: "brightness(0.8)" },
    animate: {
      opacity: [0.8, 1, 0.8],
      filter: [
        "brightness(0.8) drop-shadow(0 0 8px rgba(245, 215, 110, 0.3))",
        "brightness(1.2) drop-shadow(0 0 15px rgba(245, 215, 110, 0.7))",
        "brightness(0.8) drop-shadow(0 0 8px rgba(245, 215, 110, 0.3))",
      ],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const hoverAnimation = {
    scale: 1.30,
    filter: "brightness(1.2) drop-shadow(0 0 15px rgba(156, 39, 176, 0.7))",
    transition: { duration: 0.3 },
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <motion.div
        initial="initial"
        animate="animate"
        whileHover={hoverAnimation}
        variants={pulseAnimation}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={onClick}
        className={cn("relative cursor-pointer", sizes[size])}
      >
        {/* Use the SVG logo image */}
        <img
          src="/images/izuran_logo.svg"
          alt="Izuran Logo"
          fetchpriority="high"
          loading="eager"
          className={cn(
            "h-full w-auto object-contain transition-colors duration-500",
            isHovered ? "filter-to-green" : "filter-gold",
          )}
          style={{
            transition: "filter 0.5s ease-in-out",
          }}
        />

        {/* SVG Background glow - only visible on hover */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div
            className={cn(
              "absolute w-full h-full rounded-full bg-gradient-to-br transition-all duration-500",
              isHovered
                ? "from-purple-900/20 to-emerald-800/20 scale-[1.3] blur-xl opacity-70"
                : "from-amber-700/10 to-yellow-600/10 scale-110 blur-lg opacity-0",
            )}
          />
        </div>

        {/* Mystical floating particles for large logos */}
        {(size === "lg" || size === "xl") &&
          particles.map((particle) => (
            <div
              key={particle.id}
              className="mystical-particle"
              style={
                {
                  bottom: `${particle.y}%`,
                  left: `${50 + particle.direction * 5}%`,
                  animationDelay: `${particle.delay}s`,
                  ["--particle-x" as string]: `${particle.x}px`,
                  opacity: isHovered ? 0.8 : 0.4, // More visible when hovered
                  width: size === "xl" ? "6px" : "4px",
                  height: size === "xl" ? "6px" : "4px",
                  background: isHovered
                    ? `hsl(${280 + particle.id * 10}, 70%, 60%)` // Purple hue when hovered
                    : `hsl(${45 + particle.id * 5}, 90%, 65%)`, // Gold hue normally
                  filter: `blur(${size === "xl" ? 2 : 1}px)`,
                  boxShadow: isHovered
                    ? "0 0 6px rgba(156, 39, 176, 0.8)"
                    : "0 0 4px rgba(245, 215, 110, 0.6)",
                  transition:
                    "background 0.5s ease, opacity 0.5s ease, box-shadow 0.5s ease",
                } as React.CSSProperties
              }
            />
          ))}
      </motion.div>

      {showText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 text-2xl font-bold font-display tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-300"
        >
          IZURAN
        </motion.div>
      )}
    </div>
  );
}
