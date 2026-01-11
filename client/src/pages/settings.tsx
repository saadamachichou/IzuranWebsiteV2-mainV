import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, AlertTriangle, Globe, KeyRound, Moon, Settings2, Sun } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import PasswordChangeForm from "@/components/profile/PasswordChangeForm";
import ParticleField from '@/components/ui/particle-field';
import FloatingSymbols from '@/components/ui/floating-symbols';

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  // If still loading, show loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg">{t("settings.loading")}</span>
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // Error handling is done in the logout function
    }
  };
  
  const handleDeleteAccount = () => {
    // This would normally call an API to delete the account
    toast({
      title: t("settings.accountDeletionDisabled"),
      description: t("settings.accountDeletionDisabledDescription"),
      variant: "destructive"
    });
    setIsDeletingAccount(false);
  };
  
  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-amber-50">
      <main className="relative z-10 min-h-screen w-full py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <Settings2 className="h-8 w-8 text-amber-400 mr-4" />
            <h1 className="text-3xl md:text-4xl font-bold text-center text-amber-300">
              {t("settings.title")}
            </h1>
          </div>
          
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-amber-900/20 border border-amber-500/20">
              <TabsTrigger value="account" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-amber-100">
                <KeyRound className="h-4 w-4 mr-2" />
                {t("settings.account")}
              </TabsTrigger>
              <TabsTrigger value="appearance" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white text-amber-100">
                <Sun className="h-4 w-4 mr-2" />
                {t("settings.appearance")}
              </TabsTrigger>
            </TabsList>
            
            {/* Account Settings */}
            <TabsContent value="account">
              <div className="grid gap-8">
                <PasswordChangeForm />
                
                <Card className="bg-black/40 backdrop-blur-md border-amber-500/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-amber-200">{t("settings.notifications")}</CardTitle>
                    <CardDescription className="text-amber-300">
                      {t("settings.notificationsDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert className="border-amber-500/20 bg-amber-900/10 text-amber-100">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <AlertTitle className="text-amber-200">{t("settings.comingSoon")}</AlertTitle>
                      <AlertDescription className="text-amber-300">
                        {t("settings.notificationsComingSoon")}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/40 backdrop-blur-md border-amber-500/20 border-destructive/20 shadow-lg">
                  <CardHeader className="text-destructive">
                    <CardTitle className="text-red-500">{t("settings.dangerZone")}</CardTitle>
                    <CardDescription className="text-amber-300">
                      {t("settings.dangerZoneDescription")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-amber-200">{t("settings.logout")}</h3>
                      <p className="text-sm text-amber-300">
                        {t("settings.logoutDescription")}
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleLogout}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      {t("settings.logoutButton")}
                    </Button>
                    
                    <div className="space-y-2 pt-4">
                      <h3 className="text-sm font-medium text-amber-200">{t("settings.deleteAccount")}</h3>
                      <p className="text-sm text-amber-300">
                        {t("settings.deleteAccountDescription")}
                      </p>
                    </div>
                    
                    {isDeletingAccount ? (
                      <div className="space-y-4 border border-red-500/20 p-4 rounded-md bg-red-900/10">
                        <Alert variant="destructive" className="border-red-500/20 bg-red-900/20 text-red-100">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                          <AlertTitle className="text-red-200">{t("settings.deleteWarningTitle")}</AlertTitle>
                          <AlertDescription className="text-red-300">
                            {t("settings.deleteWarningDescription")}
                          </AlertDescription>
                        </Alert>
                        
                        <div className="flex gap-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsDeletingAccount(false)}
                            className="flex-1 border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                          >
                            {t("settings.cancel")}
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={handleDeleteAccount}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            {t("settings.confirmDelete")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full border-red-500 text-red-500 hover:bg-red-900/10"
                        onClick={() => setIsDeletingAccount(true)}
                      >
                        {t("settings.deleteAccountButton")}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Appearance Settings */}
            <TabsContent value="appearance">
              <Card className="bg-black/40 backdrop-blur-md border-amber-500/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-amber-200">{t("settings.language")}</CardTitle>
                  <CardDescription className="text-amber-300">
                    {t("settings.languageDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant={language === "en" ? "default" : "outline"}
                      className={`flex justify-start space-x-2 h-auto py-3 ${
                        language === "en"
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                      }`}
                      onClick={() => setLanguage("en")}
                    >
                      <Globe className="h-5 w-5 text-amber-400" />
                      <div className="text-left">
                        <div className="font-medium">English</div>
                        <div className="text-xs text-amber-300">English</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={language === "tmz" ? "default" : "outline"}
                      className={`flex justify-start space-x-2 h-auto py-3 ${
                        language === "tmz"
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                      }`}
                      onClick={() => setLanguage("tmz")}
                    >
                      <Globe className="h-5 w-5 text-amber-400" />
                      <div className="text-left">
                        <div className="font-medium">Tamaziɣt</div>
                        <div className="text-xs text-amber-300">Amazigh</div>
                      </div>
                    </Button>
                    
                    <Button 
                      variant={language === "fr" ? "default" : "outline"}
                      className={`flex justify-start space-x-2 h-auto py-3 ${
                        language === "fr"
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                      }`}
                      onClick={() => setLanguage("fr")}
                    >
                      <Globe className="h-5 w-5 text-amber-400" />
                      <div className="text-left">
                        <div className="font-medium">Français</div>
                        <div className="text-xs text-amber-300">French</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-8 bg-black/40 backdrop-blur-md border-amber-500/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-amber-200">{t("settings.theme")}</CardTitle>
                  <CardDescription className="text-amber-300">
                    {t("settings.themeDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline"
                      className="flex justify-start space-x-2 h-auto py-3 border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                    >
                      <Moon className="h-5 w-5 text-amber-400" />
                      <div className="text-left">
                        <div className="font-medium">{t("settings.darkMode")}</div>
                        <div className="text-xs text-amber-300">
                          {t("settings.darkModeDescription")}
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}