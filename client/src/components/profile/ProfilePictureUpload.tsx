import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/LanguageContext";
import { Camera, Loader2 } from "lucide-react";

export default function ProfilePictureUpload() {
  const { user, updateProfilePicture } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [profileImgSrc, setProfileImgSrc] = useState(user?.profilePictureUrl || '/default_profile.png');
  const hasTriedLocal = useRef(false);

  useEffect(() => {
    if (user?.authProvider === 'google' && user?.profilePictureUrl) {
      setProfileImgSrc(user.profilePictureUrl);
      hasTriedLocal.current = false;
    } else {
      setProfileImgSrc('/default_profile.png');
    }
  }, [user]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: t("profile.errorTitle"),
        description: t("profile.errorInvalidImage"),
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: t("profile.errorTitle"),
        description: t("profile.errorImageTooLarge"),
      });
      return;
    }

    try {
      setIsLoading(true);
      const imageUrl = await updateProfilePicture(file);
      
      toast({
        title: t("profile.successTitle"),
        description: t("profile.profilePictureUpdated"),
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        variant: "destructive",
        title: t("profile.errorTitle"),
        description: t("profile.errorUploadFailed"),
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Save image to localStorage and upload to server
  const handleImgLoad = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    try {
      // Fetch image as blob
      const response = await fetch(img.src);
      const blob = await response.blob();
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        localStorage.setItem('googleProfileImage', base64data);
        // Optionally, upload to server
        uploadGoogleProfileImageToServer(blob);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      // Ignore
    }
  };

  // Upload to server
  const uploadGoogleProfileImageToServer = async (blob: Blob) => {
    if (!user) return;
    const formData = new FormData();
    formData.append('profilePicture', blob, 'google-profile.jpg');
    await fetch('/api/auth/profile-picture', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
  };

  // Handle error: try localStorage, then fallback
  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasTriedLocal.current) {
      const localImg = localStorage.getItem('googleProfileImage');
      if (localImg) {
        setProfileImgSrc(localImg);
        hasTriedLocal.current = true;
        return;
      }
    }
    setProfileImgSrc('/default_profile.png');
  };

  // Get user initials for avatar fallback
  const getInitials = () => {
    if (!user) return "U";
    
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (user.username) {
      return user.username[0].toUpperCase();
    }
    
    return "U";
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24 border-2 border-primary">
          <AvatarImage 
            src={profileImgSrc}
            alt={user?.username || "User"}
            onLoad={handleImgLoad}
            onError={handleImgError}
          />
          <AvatarFallback className="text-lg bg-primary/20">{getInitials()}</AvatarFallback>
        </Avatar>
        {user?.authProvider !== 'google' && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-0 right-0 rounded-full bg-background"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </Button>
        )}
      </div>
      {user?.authProvider !== 'google' && (
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}
      {user?.authProvider === 'google' && (
        <div className="text-amber-400 text-sm mt-2">Google users cannot change their profile picture here. It is synced from your Google account.</div>
      )}
    </div>
  );
}