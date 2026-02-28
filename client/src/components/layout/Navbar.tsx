import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShoppingCart from '@/components/shop/ShoppingCart';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import AnimatedLogo from '@/components/ui/animated-logo';
import { UserAvatar } from '@/components/auth/UserAvatar';
import UserMenu from '../auth/UserMenu';

interface NavLink {
  name: string;
  path: string;
}

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const hasTriedLocal = useRef(false);

  // Navigation links
  const navLinks: NavLink[] = [
    { name: t('Home'), path: '/' },
    { name: t('Artists'), path: '/artists' },
    { name: t('Events'), path: '/events' },
    { name: t('Shop'), path: '/shop' },
    { name: t('Podcast'), path: '/podcasts' },
    { name: t('Releases'), path: '/releases' },
    { name: t('Knowledge'), path: '/knowledge' },
    { name: t('Contact'), path: '/contact' },
  ];

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle theme toggling
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

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
        handleImgLoad({ currentTarget: { src: localImg } } as React.SyntheticEvent<HTMLImageElement, Event>);
        hasTriedLocal.current = true;
        return;
      }
    }
    handleImgLoad({ currentTarget: { src: '/default_profile.png' } } as React.SyntheticEvent<HTMLImageElement, Event>);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user || !user.username) return '?';
    
    const nameParts = user.username.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled
          ? 'py-2 bg-gradient-to-b from-black/95 via-black/80 to-yellow-900/10 backdrop-blur-lg border-b border-yellow-400/30 shadow-lg'
          : 'py-4 bg-gradient-to-b from-black/80 via-black/60 to-yellow-900/10 backdrop-blur-md'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-black/50 rounded-md">
          <div className="flex items-center space-x-2">
            <AnimatedLogo 
              size="lg" 
              className="w-16 h-20" 
              showText={false}
            />
            <span className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>IZURAN</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            // Special handling for Podcast with dropdown
            if (link.path === '/podcasts') {
              return (
                <div
                  key={link.path}
                  className="relative group"
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                >
                  <Link
                    href={link.path}
                    className={`px-3 py-2 text-sm rounded-md font-semibold transition-colors drop-shadow focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-black/50 ${
                      location === link.path || location === '/streams' || location === '/serious-izuran'
                        ? 'text-yellow-100 bg-yellow-800/30 shadow-yellow-200/30'
                        : 'text-yellow-50/90 hover:text-yellow-200 hover:bg-yellow-800/20'
                    }`}
                  >
                    {link.name}
                  </Link>
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-in-out transform group-hover:translate-y-0 translate-y-2 z-50">
                    <div className="bg-black/95 backdrop-blur-lg border border-yellow-400/30 rounded-md shadow-lg min-w-[180px] py-1">
                      <Link
                        href="/serious-izuran"
                        className="block px-4 py-2 text-sm text-yellow-50/90 hover:text-yellow-200 hover:bg-yellow-800/20 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-inset"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Izuran Series
                      </Link>
                      <Link
                        href="/streams"
                        className="block px-4 py-2 text-sm text-yellow-50/90 hover:text-yellow-200 hover:bg-yellow-800/20 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-inset"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Streams
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }
            // Regular links
            return (
              <Link 
                key={link.path} 
                href={link.path}
                className={`px-3 py-2 text-sm rounded-md font-semibold transition-colors drop-shadow focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-black/50 ${
                  location === link.path
                    ? 'text-yellow-100 bg-yellow-800/30 shadow-yellow-200/30'
                    : 'text-yellow-50/90 hover:text-yellow-200 hover:bg-yellow-800/20'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center space-x-2">
          {/* User actions */}
          {user ? (
            <UserMenu />
          ) : (
            <Link href="/auth">
              <Button variant="outline" className="text-amber-100 border-amber-400/50 hover:bg-amber-400/10 hover:text-amber-200">
                {t('navbar.login')}
              </Button>
            </Link>
          )}

          {/* Language and Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild aria-label={t('Select language')}>
              <Button variant="ghost" size="icon" aria-label={t('Select language')}>
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-black border-amber-500/30 text-amber-100 shadow-lg">
              <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-amber-600/20 focus:bg-amber-600/20 focus:text-amber-50">
                <span className={language === 'en' ? 'font-medium text-amber-400' : ''}>English</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('tmz')} className="hover:bg-amber-600/20 focus:bg-amber-600/20 focus:text-amber-50">
                <span className={language === 'tmz' ? 'font-medium text-amber-400' : ''}>ⵜⴰⵎⴰⵣⵉⵖⵜ (Tamazight)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Shopping Cart */}
          <ShoppingCart />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          <ShoppingCart />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? t('Close menu') : t('Open menu')}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-t border-amber-500/20 max-h-[calc(100vh-3.5rem)] overflow-y-auto"
          >
            <div className="container mx-auto px-4 py-3">
              {/* Nav links in a compact 2-column grid */}
              <nav className="grid grid-cols-2 gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`px-3 py-2 rounded-md text-sm transition-colors text-center ${
                      location === link.path
                        ? 'bg-amber-500/15 text-amber-300 font-medium'
                        : 'text-amber-100/80 hover:bg-amber-500/10 hover:text-amber-200'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                {/* Podcast sub-links inline */}
                <Link
                  href="/serious-izuran"
                  className={`px-3 py-2 rounded-md text-sm transition-colors text-center ${
                    location === '/serious-izuran'
                      ? 'bg-amber-500/15 text-amber-300 font-medium'
                      : 'text-amber-100/60 hover:bg-amber-500/10 hover:text-amber-200'
                  }`}
                >
                  Izuran Series
                </Link>
                <Link
                  href="/streams"
                  className={`px-3 py-2 rounded-md text-sm transition-colors text-center ${
                    location === '/streams'
                      ? 'bg-amber-500/15 text-amber-300 font-medium'
                      : 'text-amber-100/60 hover:bg-amber-500/10 hover:text-amber-200'
                  }`}
                >
                  Streams
                </Link>
              </nav>

              {/* Divider */}
              <div className="my-3 border-t border-amber-500/15" />

              {user ? (
                <>
                  {/* User info row with logout */}
                  <div className="flex items-center gap-3 px-2 py-2 bg-amber-500/5 rounded-lg">
                    <UserAvatar className="h-9 w-9 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-amber-100 truncate">{user.username}</p>
                      <p className="text-xs text-amber-200/50 truncate">{user.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2"
                      onClick={logout}
                    >
                      {t('Logout')}
                    </Button>
                  </div>

                  {/* User action links in a compact grid */}
                  <div className="grid grid-cols-3 gap-1.5 mt-2">
                    <Link href="/profile" className="flex items-center justify-center px-2 py-2 text-xs text-amber-200/80 hover:bg-amber-500/10 rounded-md transition-colors">
                      {t('Profile')}
                    </Link>
                    <Link href="/favorites" className="flex items-center justify-center px-2 py-2 text-xs text-amber-200/80 hover:bg-amber-500/10 rounded-md transition-colors">
                      {t('Favorites')}
                    </Link>
                    <Link href="/settings" className="flex items-center justify-center px-2 py-2 text-xs text-amber-200/80 hover:bg-amber-500/10 rounded-md transition-colors">
                      {t('Settings')}
                    </Link>
                    <Link href="/orders" className="flex items-center justify-center px-2 py-2 text-xs text-amber-200/80 hover:bg-amber-500/10 rounded-md transition-colors">
                      {t('Order History')}
                    </Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" className="flex items-center justify-center px-2 py-2 text-xs text-amber-300/90 hover:bg-amber-500/10 rounded-md transition-colors col-span-2">
                        {t('Admin Dashboard')}
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-black font-medium" size="sm">
                  <Link href="/auth" className="flex items-center justify-center gap-2">
                    {t('Login / Register')}
                  </Link>
                </Button>
              )}

              {/* Language switcher row */}
              <div className="flex items-center justify-center mt-2 pt-2 border-t border-amber-500/10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild aria-label={t('Select language')}>
                    <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs text-amber-200/60 hover:text-amber-200" aria-label={t('Select language')}>
                      <Globe className="h-3.5 w-3.5" />
                      {language === 'en' ? 'English' : 'ⵜⴰⵎⴰⵣⵉⵖⵜ'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-black border-amber-500/30 text-white">
                    <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-amber-600/20 focus:bg-amber-600/20 text-white">
                      <span className={language === 'en' ? 'font-medium text-amber-400' : ''}>English</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLanguage('tmz')} className="hover:bg-amber-600/20 focus:bg-amber-600/20 text-white">
                      <span className={language === 'tmz' ? 'font-medium text-amber-400' : ''}>ⵜⴰⵎⴰⵣⵉⵖⵜ (Tamazight)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
