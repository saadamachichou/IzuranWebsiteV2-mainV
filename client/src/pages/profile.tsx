import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Save, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ParticleField from "@/components/ui/particle-field";
import { UserAvatar } from "@/components/auth/UserAvatar";

// Custom FloatingSymbols for profile page with reduced brightness
const ProfileFloatingSymbols = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Specific core Tifinagh symbols
  const AMAZIGH_SYMBOLS = [
    "ⴰ", "ⴱ", "ⴳ", "ⴷ", "ⴹ", "ⴻ", "ⴼ", "ⴽ", "ⵀ", "ⵃ", 
    "ⵄ", "ⵅ", "ⵇ", "ⵉ", "ⵊ", "ⵍ", "ⵯ", "ⵥ", "ⵣ", "ⵢ", 
    "ⵡ", "ⵟ", "ⵜ", "ⵛ", "ⵚ", "ⵙ", "ⵖ", "ⵕ", "ⵔ", "ⵓ", 
    "ⵏ", "ⵎ", "ⴲ", "ⴴ", "ⴵ", "ⴶ", "ⴸ", "ⴺ", "ⴿ", "ⵁ"
  ];

  // Generate orbital paths around center
  const generateOrbitalPaths = (count: number) => {
    const paths = [];
    
    for (let i = 0; i < count; i++) {
      const layer = Math.floor(i / 6) + 1;
      const angleStep = (360 / Math.min(6, count - (layer - 1) * 6));
      const angle = (i % 6) * angleStep;
      
      const baseRadius = 30 + (layer * 20);
      const radiusVariation = Math.random() * 15 - 7;
      const radius = baseRadius + radiusVariation;
      
      const symbol = AMAZIGH_SYMBOLS[Math.floor(Math.random() * AMAZIGH_SYMBOLS.length)];
      
      paths.push({
        id: i,
        symbol,
        radius,
        angle,
        speed: 0.01 + Math.random() * 0.02,
        size: 1.2 + Math.random() * 0.4,
        opacity: 0.02 + Math.random() * 0.03, // Extremely subtle for profile page
        pulseSpeed: 0.05 + Math.random() * 0.1,
        driftSpeed: 0.005 + Math.random() * 0.01,
        verticalOffset: Math.random() * 25 - 12,
      });
    }
    
    return paths;
  };

  const particles = generateOrbitalPaths(20); // Reduced count for profile page

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
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
            opacity: [particle.opacity * 0.1, particle.opacity, particle.opacity * 0.1],
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
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="select-none font-bold text-amber-700/20"
            style={{
              textRendering: 'optimizeLegibility',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              filter: "drop-shadow(0 0 0.5px rgba(255, 223, 133, 0.05))",
              textShadow: "0 0 0.5px rgba(255, 223, 133, 0.02)",
            }}
          >
            <motion.span
              animate={{
                opacity: [particle.opacity * 0.15, particle.opacity, particle.opacity * 0.15],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
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
};

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  
  // If still loading, show loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-amber-50">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg">{t("profile.loading")}</span>
        </div>
      </main>
    );
  }
  
  const [, setLocation] = useLocation();
  
  // If no user is logged in, redirect to home
  if (!user && !isLoading) {
    setLocation("/");
    return null;
  }
  
  // User is loaded and authenticated
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.username.substring(0, 2).toUpperCase();
    
  const toggleEditing = () => setIsEditing(!isEditing);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    // Get form values
    const username = formData.get('username') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    
    // Here you would normally send the data to your API
    console.log('Saving profile changes:', { username, firstName, lastName, email });
    
    // For now, just exit edit mode
    setIsEditing(false);
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-amber-50 relative overflow-hidden">

      <div className="z-10 w-full max-w-5xl">
        <h1 className="text-4xl font-cinzel font-bold text-center text-amber-200 mb-8">
          {t("profile.title")}
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel: Profile Summary */}
          <Card className="lg:col-span-1 bg-black/50 backdrop-blur-sm border border-amber-500/20 shadow-lg shadow-amber-500/5 text-amber-50">
            <CardHeader className="flex flex-col items-center text-center">
              <UserAvatar className="w-24 h-24 border-4 border-amber-400 shadow-md" />
              <CardTitle className="text-xl mt-4 text-amber-100">{user?.username}</CardTitle>
              <CardDescription className="text-amber-200">
                {user?.email}
              </CardDescription>
              
              {user?.authProvider === 'google' && (
                <Badge className="mt-2 bg-amber-600 text-amber-50 hover:bg-amber-700">
                  Google
                </Badge>
              )}
              
              {user?.role === "admin" && (
                <Badge className="mt-2 border-amber-500 text-amber-200 bg-transparent hover:bg-amber-700/20">
                  {t("profile.adminBadge")}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <Button 
                onClick={toggleEditing} 
                variant="outline" 
                className="w-full mt-4 border-amber-500/30 text-amber-100 hover:bg-amber-700/30 hover:text-amber-50"
              >
                {isEditing ? (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    {t("profile.cancelEditing")}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4 text-amber-300" />
                    {t("profile.editProfile")}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* Profile Details */}
          <Card className="lg:col-span-2 bg-black/50 backdrop-blur-sm border border-amber-500/20 shadow-lg shadow-amber-500/5 text-amber-50">
            <CardHeader>
              <CardTitle className="text-amber-100">{t("profile.details")}</CardTitle>
              <CardDescription className="text-amber-200">
                {isEditing ? t("profile.editingDescription") : t("profile.viewDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-100">{t("profile.username")}
                  </h3>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="username"
                      defaultValue={user?.username}
                      className="w-full px-3 py-2 bg-amber-900/60 text-amber-50 border border-amber-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter your username"
                      autoComplete="username"
                    />
                  ) : (
                    <p className="text-amber-200">{user?.username}</p>
                  )}
                </div>
                
                <Separator className="bg-amber-500/30" />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-100">{t("profile.firstName")}
                  </h3>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="firstName"
                      defaultValue={user?.firstName || ""}
                      className="w-full px-3 py-2 bg-amber-900/60 text-amber-50 border border-amber-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <p className="text-amber-200">
                      {user?.firstName || t("profile.notProvided")}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-100">{t("profile.lastName")}
                  </h3>
                  {isEditing ? (
                    <input 
                      type="text"
                      name="lastName"
                      defaultValue={user?.lastName || ""}
                      className="w-full px-3 py-2 bg-amber-900/60 text-amber-50 border border-amber-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <p className="text-amber-200">
                      {user?.lastName || t("profile.notProvided")}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-100">{t("profile.email")}
                  </h3>
                  {isEditing ? (
                    <input 
                      type="email"
                      name="email"
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 bg-amber-900/60 text-amber-50 border border-amber-700 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <p className="text-amber-200">{user?.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-amber-100">{t("profile.memberSince")}
                  </h3>
                  <p className="text-amber-200">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                  </p>
                </div>
                
                {isEditing && (
                  <Button type="submit" className="w-full bg-amber-500 text-white hover:bg-amber-600">
                    <Save className="mr-2 h-4 w-4 text-amber-50" />
                    {t("profile.saveChanges")}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}