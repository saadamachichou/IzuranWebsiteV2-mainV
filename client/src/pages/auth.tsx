import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import FloatingSymbols from "@/components/ui/floating-symbols";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-black to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const features = [
    t("auth.feature1"),
    t("auth.feature2"),
    t("auth.feature3")
  ];

  return (
    <>
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-gray-950" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Auth forms */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-16 xl:px-20">
          <div className="w-full max-w-md mx-auto">
            {/* Logo for mobile/tablet */}
            <div className="lg:hidden text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center items-center"
              >
                <img 
                  src="/izuran_logo.png" 
                  alt="Izuran Logo" 
                  className="h-16 w-auto filter brightness-110 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-black/60 backdrop-blur-xl border-amber-500/20 shadow-2xl">
                <CardHeader className="text-center space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <CardTitle className="text-2xl font-bold text-amber-300 mb-2">
                      {t("auth.welcome")}
                    </CardTitle>
                    <CardDescription className="text-amber-200/70">
                      {t("auth.welcomeDescription")}
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    <Tabs defaultValue="login" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 border border-amber-500/20">
                        <TabsTrigger 
                          value="login" 
                          className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
                        >
                          {t("auth.login")}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="register"
                          className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
                        >
                          {t("auth.register")}
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="login">
                        <LoginForm onSuccess={() => setLocation("/")} />
                      </TabsContent>
                      <TabsContent value="register">
                        <RegisterForm onSuccess={() => setLocation("/")} />
                      </TabsContent>
                    </Tabs>
                  </motion.div>
                </CardContent>
                
                <CardFooter className="flex justify-center text-sm text-amber-200/50">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    {t("auth.termsNotice")}
                  </motion.div>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
        
        {/* Right Column - Brand Hero Section with Logo */}
        <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center items-center px-12">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-lg relative z-10 text-center"
          >
            {/* Animated Logo with Floating Symbols */}
            <div className="mb-8 relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="mx-auto mb-8 relative flex justify-center items-center"
              >
                {/* Floating Symbols around Logo */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2, delay: 1 }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ 
                    width: '500px', 
                    height: '500px',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <FloatingSymbols density="heavy" area="hero" />
                </motion.div>
                
                {/* Logo with seamless background blending */}
                <div className="relative z-10">
                  <motion.img 
                    src="/izuran_logo.png" 
                    alt="Izuran Logo" 
                    className="h-40 w-auto filter brightness-110 drop-shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all duration-700"
                    style={{
                      mixBlendMode: 'screen',
                      filter: 'brightness(1.2) contrast(1.1) drop-shadow(0 0 30px rgba(251,191,36,0.6))'
                    }}
                    animate={{
                      filter: [
                        'brightness(1.2) contrast(1.1) drop-shadow(0 0 30px rgba(251,191,36,0.6))',
                        'brightness(1.3) contrast(1.2) drop-shadow(0 0 40px rgba(251,191,36,0.8))',
                        'brightness(1.2) contrast(1.1) drop-shadow(0 0 30px rgba(251,191,36,0.6))'
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
              </motion.div>
              
              <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent mb-4 tracking-wider">
                IZURAN
              </h1>
              <p className="text-xl text-amber-200/80 font-light tracking-wide uppercase">
                ANCIENT RHYTHMS • FUTURE VISIONS
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mb-8"
            >
              <p className="text-lg text-amber-200/70 leading-relaxed font-mystical">
                {t("auth.heroDescription")}
              </p>
            </motion.div>
            
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
                  className="flex items-start justify-center"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mr-4 mt-1">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-amber-200/80 leading-relaxed text-left">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}