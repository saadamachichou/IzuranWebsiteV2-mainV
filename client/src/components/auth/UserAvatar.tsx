import { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { User } from '@shared/schema';

interface UserAvatarProps {
  className?: string;
}

export function UserAvatar({ className }: UserAvatarProps) {
  const { user } = useAuth();
  const [profileImgSrc, setProfileImgSrc] = useState('/default_profile.png');
  const hasTriedLocal = useRef(false);

  useEffect(() => {
    const localImg = localStorage.getItem('googleProfileImage');
    if (user?.profilePictureUrl) {
      setProfileImgSrc(user.profilePictureUrl);
    } else if (localImg && localImg.startsWith('data:image/')) {
      setProfileImgSrc(localImg);
    } else {
      setProfileImgSrc('/default_profile.png');
    }
    hasTriedLocal.current = false;
  }, [user]);

  const getInitials = () => {
    if (!user) return 'U';
    const { firstName, lastName, username } = user;
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return 'U';
  };

  const handleImgLoad = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (user?.authProvider === 'google' && img.src.startsWith('http')) {
      // Check if we've already uploaded for this user in this session
      const uploadKey = `profileUploaded_${user.id}`;
      const hasUploadedThisSession = localStorage.getItem(uploadKey);
      
      if (!hasUploadedThisSession) {
        localStorage.setItem(uploadKey, 'true');
        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            localStorage.setItem('googleProfileImage', base64data);
            uploadGoogleProfileImageToServer(blob);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          // Ignore CORS or network errors
        }
      }
    }
  };

  const uploadGoogleProfileImageToServer = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('profilePicture', blob, 'google-profile.jpg');
    try {
      await fetch('/api/auth/profile-picture', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
    } catch (error) {
        // silent fail
    }
  };

  const handleImgError = () => {
    if (!hasTriedLocal.current) {
      hasTriedLocal.current = true;
      const localImg = localStorage.getItem('googleProfileImage');
      if (localImg) {
        setProfileImgSrc(localImg);
        return;
      }
    }
    setProfileImgSrc('/default_profile.png');
  };

  if (!user) {
    return (
      <Avatar className={className}>
        <AvatarImage src="/default_profile.png" alt="User" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage
        src={profileImgSrc}
        alt={user.username}
        onLoad={handleImgLoad}
        onError={handleImgError}
      />
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  );
} 