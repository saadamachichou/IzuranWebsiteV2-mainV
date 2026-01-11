import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  color?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  onClick?: () => void;
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-16 w-16",
  lg: "h-32 w-32",
  xl: "h-64 w-64",
};

export default function IzuranLogo({
  size = "xl",
  onClick,
  className,
  color,
}: LogoProps) {
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

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        scale: 1.6,
        transition: { duration: 0.3 },
      }}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center cursor-pointer overflow-visible",
        sizes[size],
        className,
      )}
    >
      {/* Glow effect background that scales with the hover */}
      <motion.div
        className="absolute inset-0 rounded-full -z-10 pointer-events-none"
        animate={{
          scale: isHovered ? 1.3 : 1.1,
          opacity: isHovered ? 0.7 : 0,
        }}
        transition={{ duration: 0.5 }}
      >
        <div
          className={cn(
            "absolute inset-0 w-full h-full rounded-full bg-gradient-to-br blur-xl",
            isHovered
              ? "from-purple-900/20 to-emerald-800/20"
              : "from-amber-700/10 to-yellow-600/10",
          )}
        />
      </motion.div>
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
      {/* Animated image that scales with the parent */}
      <motion.img
        src="/images/izuran_logo.svg"
        alt="Izuran Logo"
        className={cn(
          "w-full h-full object-contain transition-colors duration-500",
          isHovered ? "filter-to-green" : "filter-gold",
        )}
        animate={{
          filter: isHovered
            ? "brightness(1.2) drop-shadow(0 0 15px rgba(156, 39, 176, 0.6))"
            : "none",
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
