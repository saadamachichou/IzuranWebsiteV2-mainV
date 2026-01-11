import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/BrandIcons";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimatePresence, motion } from "framer-motion";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export default function GoogleLoginButton({ 
  onSuccess,
  className = "w-full",
  variant = "outline"
}: GoogleLoginButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'starting' | 'firebase' | 'backend' | 'completed' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    try {
      // Reset states
      setIsLoading(true);
      setStatus('starting');
      setErrorDetails(null);
      
      // Step 1: Firebase authentication
      setStatus('firebase');
      await loginWithGoogle();
      
      // Step 2: Backend authentication (handled inside loginWithGoogle)
      setStatus('backend');
      
      // Step 3: Completed
      setStatus('completed');
      onSuccess?.();
      
      toast({
        variant: "default",
        title: t("auth.successTitle"),
        description: t("auth.googleLoginSuccess"),
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      setStatus('error');
      setErrorDetails(error.message || t("auth.googleLoginError"));
      
      toast({
        variant: "destructive",
        title: t("auth.errorTitle"),
        description: error.message || t("auth.googleLoginError"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <Button
        type="button"
        variant={variant}
        className={`${className} flex items-center justify-center gap-2 bg-black/60 border-amber-500/20 text-amber-200 hover:bg-amber-500/10 hover:border-amber-500/40 transition-colors`}
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        ) : (
          <GoogleIcon className="h-5 w-5 text-amber-500" />
        )}
        <span className="ml-1">{t("auth.continueWithGoogle")}</span>
      </Button>
      
      <AnimatePresence>
        {status === 'error' && errorDetails && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert variant="destructive" className="bg-red-950/50 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t("auth.errorTitle")}</AlertTitle>
              <AlertDescription className="text-sm opacity-90">
                {errorDetails}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Alert className="bg-primary-900/20 border-primary/30">
              <Info className="h-4 w-4" />
              <AlertTitle>
                {status === 'starting' ? t("auth.googleLoginStarting") :
                 status === 'firebase' ? t("auth.googleFirebaseAuth") :
                 status === 'backend' ? t("auth.googleBackendAuth") :
                 t("auth.authenticating")}
              </AlertTitle>
              <AlertDescription className="text-sm opacity-90">
                {status === 'starting' ? t("auth.googleLoginStartingDesc") :
                 status === 'firebase' ? t("auth.googleFirebaseAuthDesc") :
                 status === 'backend' ? t("auth.googleBackendAuthDesc") :
                 t("auth.authenticatingDesc")}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}