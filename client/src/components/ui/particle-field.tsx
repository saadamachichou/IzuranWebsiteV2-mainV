"use client";

import { useEffect, useRef, useState } from "react";

// Define the particle type
type Particle = {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  symbol?: string;
  isStar?: boolean;
  rotation: number;
  rotationSpeed: number;
  pulseSpeed: number;
  pulsePhase: number;
  glowIntensity: number;
  hasExtraGlow?: boolean; // Pre-computed to avoid Math.random() in render loop
};

// Mystical symbols
const symbols = [
  "ⴰ",
  "ⴱ",
  "ⴳ",
  "ⴷ",
  "ⴹ",
  "ⴻ",
  "ⴼ",
  "ⴽ",
  "ⵀ",
  "ⵃ",
  "ⵄ",
  "ⵅ",
  "ⵇ",
  "ⵉ",
  "ⵊ",
  "ⵍ",
  "ⵯ",
  "ⵥ",
  "ⵣ",
  "ⵢ",
  "ⵡ",
  "ⵟ",
  "ⵜ",
  "ⵛ",
  "ⵚ",
  "ⵙ",
  "ⵖ",
  "ⵕ",
  "ⵔ",
  "ⵓ",
  "ⵏ",
  "ⵎ",
  "ⴲ",
  "ⴴ",
  "ⴵ",
  "ⴶ",
  "ⴸ",
  "ⴺ",
  "ⴿ",
  "ⵁ",
  "ⵒ",
  "ⵝ",
  "ⵞ",
  "ⵠ",
];

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize particles with spiral distribution
    const initParticles = () => {
      // Reduce particle count for better performance
      const screenSize = Math.max(window.innerWidth, window.innerHeight);
      const particleCount = Math.min(
        Math.floor(screenSize / 6), // Reduced from /4
        200, // Reduced from 300
      );
      particlesRef.current = [];

      // Create spiral distribution
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) * 0.8;

      for (let i = 0; i < particleCount; i++) {
        // Determine particle type - heavily favor symbols over stars
        const particleType = Math.random();
        const useSymbol = particleType > 0.2; // 80% symbols, 20% stars
        const useStar = particleType > 0.4 && particleType <= 0.7;

        // Spiral distribution
        const angle = i * 0.1;
        const radius = (i / particleCount) * maxRadius;
        const spiralX = centerX + radius * Math.cos(angle * 2.5);
        const spiralY = centerY + radius * Math.sin(angle * 2.5);

        // Random offset from perfect spiral
        const randomOffset = maxRadius * 0.15;
        const x = spiralX + (Math.random() - 0.5) * randomOffset;
        const y = spiralY + (Math.random() - 0.5) * randomOffset;

        // Pre-compute hasExtraGlow to avoid Math.random() in render loop
        const hasExtraGlow = Math.random() > (useSymbol ? 0.6 : useStar ? 0.5 : 0.4);

        particlesRef.current.push({
          x,
          y,
          size: useSymbol ? 30 : useStar ? 4 : Math.random() * 6 + 2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.7 + 0.4, // Increased opacity range
          symbol: useSymbol
            ? symbols[Math.floor(Math.random() * symbols.length)]
            : undefined,
          isStar: useStar,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 1,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          pulsePhase: Math.random() * Math.PI * 2,
          glowIntensity: Math.random() * 0.8 + 0.7, // Increased glow intensity
          hasExtraGlow, // Pre-computed for performance
        });
      }
    };

    // Animation loop - optimized for performance
    let lastTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      // Throttle to target FPS for better performance
      const elapsed = currentTime - lastTime;
      if (elapsed < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime - (elapsed % frameInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update time for animations (cached per frame)
      const time = currentTime * 0.001;

      // Batch draw operations for better performance
      const particles = particlesRef.current;
      const length = particles.length;

      for (let i = 0; i < length; i++) {
        const particle = particles[i];
        
        // Move particle
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        // Wrap around edges
        if (particle.x < -50) particle.x = canvas.width + 50;
        else if (particle.x > canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = canvas.height + 50;
        else if (particle.y > canvas.height + 50) particle.y = -50;

        // Pre-calculate pulse values once per particle
        const pulseValue = Math.sin(time * particle.pulseSpeed + particle.pulsePhase);
        const pulseScale = 1 + pulseValue * 0.2;
        const currentSize = particle.size * pulseScale;
        const pulseOpacity = particle.opacity * (0.8 + Math.sin(time * particle.pulseSpeed * 2 + particle.pulsePhase) * 0.4);

        ctx.save();

        // Draw particle based on type
        if (particle.symbol) {
          ctx.font = `${currentSize}px Arial`;
          ctx.fillStyle = `rgba(255, 223, 133, ${pulseOpacity})`;
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);
          
          // Enhanced glow effect for symbols
          ctx.shadowColor = "rgba(255, 223, 133, 0.9)";
          ctx.shadowBlur = 15 * particle.glowIntensity;
          ctx.fillText(particle.symbol, 0, 0);
          
          // Additional bright glow (using pre-computed value)
          if (particle.hasExtraGlow) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
            ctx.shadowBlur = 20 * particle.glowIntensity;
            ctx.fillText(particle.symbol, 0, 0);
          }
          
          ctx.shadowBlur = 0;
          ctx.fillText(particle.symbol, 0, 0);
        } else if (particle.isStar) {
          // Draw a star
          const spikes = 5;
          const outerRadius = currentSize;
          const innerRadius = currentSize / 2;

          ctx.beginPath();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.rotation * Math.PI) / 180);

          for (let j = 0; j < spikes * 2; j++) {
            const radius = j % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * j) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (j === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }

          ctx.closePath();
          ctx.fillStyle = `rgba(255, 223, 133, ${pulseOpacity})`;

          // Enhanced glow effect for stars
          ctx.shadowColor = "rgba(255, 223, 133, 0.9)";
          ctx.shadowBlur = 12 * particle.glowIntensity;
          ctx.fill();
          
          // Additional bright glow (using pre-computed value)
          if (particle.hasExtraGlow) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.7)";
            ctx.shadowBlur = 18 * particle.glowIntensity;
            ctx.fill();
          }
          
          ctx.shadowBlur = 0;
        } else {
          // Draw a circle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, currentSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 223, 133, ${pulseOpacity})`;

          // Enhanced glow effect for circles
          ctx.shadowColor = "rgba(255, 223, 133, 0.8)";
          ctx.shadowBlur = 8 * particle.glowIntensity;
          ctx.fill();
          
          // Additional bright glow (using pre-computed value)
          if (particle.hasExtraGlow) {
            ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
            ctx.shadowBlur = 12 * particle.glowIntensity;
            ctx.fill();
          }
          
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    initParticles();
    
    // Start animation after a brief delay to allow initial render
    const startTimeout = setTimeout(() => {
      setIsLoaded(true);
      lastTime = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }, 100);

    return () => {
      clearTimeout(startTimeout);
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 z-0 transition-opacity duration-2000 ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
