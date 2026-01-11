"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

// Specific core Tifinagh symbols as requested
const AMAZIGH_SYMBOLS = [
  "ⴰ", "ⴱ", "ⴳ", "ⴷ", "ⴹ", "ⴻ", "ⴼ", "ⴽ", "ⵀ", "ⵃ", 
  "ⵄ", "ⵅ", "ⵇ", "ⵉ", "ⵊ", "ⵍ", "ⵯ", "ⵥ", "ⵣ", "ⵢ", 
  "ⵡ", "ⵟ", "ⵜ", "ⵛ", "ⵚ", "ⵙ", "ⵖ", "ⵕ", "ⵔ", "ⵓ", 
  "ⵏ", "ⵎ", "ⴲ", "ⴴ", "ⴵ", "ⴶ", "ⴸ", "ⴺ", "ⴿ", "ⵁ"
];



interface FloatingSymbolsProps {
  density?: 'light' | 'medium' | 'heavy';
  area?: 'hero' | 'section' | 'full';
  className?: string;
}

export default function FloatingSymbols({ 
  density = 'medium', 
  area = 'hero',
  className = '' 
}: FloatingSymbolsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate particle count based on density and area - increased for richer experience
  const getParticleCount = () => {
    const baseCount = {
      light: 18,
      medium: 45,
      heavy: 70
    }[density];

    const areaMultiplier = {
      hero: 2.5,
      section: 1.2,
      full: 2.5
    }[area];

    return Math.floor(baseCount * areaMultiplier);
  };

  // Generate orbital paths around center
  const generateOrbitalPaths = (count: number) => {
    const paths = [];
    
    for (let i = 0; i < count; i++) {
      const layer = Math.floor(i / 6) + 1; // Group symbols in orbital layers
      const angleStep = (360 / Math.min(6, count - (layer - 1) * 6));
      const angle = (i % 6) * angleStep;
      
      // Different orbital radii for layering
      const baseRadius = 30 + (layer * 20);
      const radiusVariation = Math.random() * 15 - 7;
      const radius = baseRadius + radiusVariation;
      
      // Use only Tifinagh characters - no other symbols
      const symbol = AMAZIGH_SYMBOLS[Math.floor(Math.random() * AMAZIGH_SYMBOLS.length)];
      
      paths.push({
        id: i,
        symbol,
        radius,
        angle,
        speed: 0.01 + Math.random() * 0.02, // Extremely slow movement
        size: 1.2 + Math.random() * 0.4, // Smaller, more subtle characters
        opacity: 0.3 + Math.random() * 0.3, // More subtle opacity
        pulseSpeed: 0.05 + Math.random() * 0.1, // Extremely slow pulsing
        driftSpeed: 0.005 + Math.random() * 0.01, // Almost imperceptible drift
        verticalOffset: Math.random() * 25 - 12,
      });
    }
    
    return paths;
  };

  const particles = generateOrbitalPaths(getParticleCount());

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 1 }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            fontSize: `${particle.size * 1.2}rem`,
          }}
          initial={{
            x: '-50%',
            y: '-50%',
            opacity: 0,
            scale: 0,
          }}
          animate={{
            x: '-50%',
            y: '-50%',
            opacity: [particle.opacity * 0.6, particle.opacity, particle.opacity * 0.6],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            opacity: {
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: particle.id * 0.2,
            },
            scale: {
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <motion.div
            animate={{
              x: [
                Math.cos((particle.angle * Math.PI) / 180) * particle.radius,
                Math.cos((particle.angle * Math.PI) / 180) * particle.radius * 1.1,
                Math.cos((particle.angle * Math.PI) / 180) * particle.radius,
              ],
              y: [
                Math.sin((particle.angle * Math.PI) / 180) * particle.radius + particle.verticalOffset,
                Math.sin((particle.angle * Math.PI) / 180) * particle.radius * 1.1 + particle.verticalOffset,
                Math.sin((particle.angle * Math.PI) / 180) * particle.radius + particle.verticalOffset,
              ],
            }}
            transition={{
              duration: 8 + Math.random() * 6, // Gentle breathing movement
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="select-none font-bold text-amber-300"
            style={{
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              filter: "drop-shadow(0 0 4px rgba(255, 223, 133, 0.9))",
              textShadow: "0 0 6px rgba(255, 223, 133, 0.8)",
            }}
          >
            <motion.span
                          animate={{
              opacity: [particle.opacity * 0.8, particle.opacity, particle.opacity * 0.8],
            }}
              transition={{
                duration: 8 + Math.random() * 4, // Very slow, gentle breathing
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {particle.symbol}
            </motion.span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}