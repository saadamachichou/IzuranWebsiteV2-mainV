import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Globe, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ShoppingCart from '@/components/shop/ShoppingCart';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { UserAvatar } from '@/components/auth/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NavLink {
  name: string;
  path: string;
}

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Navigation links
  const navLinks: NavLink[] = [
    { name: t('Home'), path: '/' },
    { name: t('Artists'), path: '/artists' },
    { name: t('Events'), path: '/events' },
    { name: t('Shop'), path: '/shop' },
    { name: t('Podcast'), path: '/podcasts' },
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



  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-2 bg-background/80 backdrop-blur-lg border-b border-border/40 shadow-sm'
          : 'py-4 bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/izuran_logo.png"
            alt="Izuran"
            className="h-10 mr-2"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link 
              key={link.path} 
              href={link.path}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                location === link.path
                  ? 'text-primary font-medium'
                  : 'text-foreground/80 hover:text-primary hover:bg-muted/50'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Actions (Desktop) */}
        <div className="hidden md:flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t('Switch to light mode') : t('Switch to dark mode')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild aria-label={t('Select language')}>
              <Button variant="ghost" size="icon" aria-label={t('Select language')}>
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>
                <span className={language === 'en' ? 'font-medium' : ''}>English</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('tmz')}>
                <span className={language === 'tmz' ? 'font-medium' : ''}>ⵜⴰⵎⴰⵣⵉⵖⵜ (Tamazight)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>
                <span className={language === 'fr' ? 'font-medium' : ''}>Français</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Shopping Cart */}
          <ShoppingCart />

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild aria-label={t('User menu')}>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('User menu')}>
                  <UserAvatar className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="w-full cursor-pointer">
                    {t('Profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/favorites" className="w-full cursor-pointer">
                    {t('Favorites')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="w-full cursor-pointer">
                    {t('Settings')}
                  </Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full cursor-pointer">
                        {t('Admin Dashboard')}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  {t('Logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/auth" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {t('Login')}
              </Link>
            </Button>
          )}
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
            className="md:hidden bg-background border-t border-border"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col space-y-1">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path} 
                    href={link.path}
                    className={`px-4 py-3 rounded-md transition-colors ${
                      location === link.path
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  {/* Theme Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="flex items-center gap-2"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        {t('Light Mode')}
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        {t('Dark Mode')}
                      </>
                    )}
                  </Button>

                  {/* Language Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild aria-label={t('Select language')}>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2" aria-label={t('Select language')}>
                        <Globe className="h-4 w-4" />
                        {language === 'en' ? 'English' : language === 'tmz' ? 'Tamazight' : 'Français'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLanguage('en')}>
                        <span className={language === 'en' ? 'font-medium' : ''}>English</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage('tmz')}>
                        <span className={language === 'tmz' ? 'font-medium' : ''}>ⵜⴰⵎⴰⵣⵉⵖⵜ (Tamazight)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLanguage('fr')}>
                        <span className={language === 'fr' ? 'font-medium' : ''}>Français</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4">
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center p-2 bg-muted rounded-lg">
                        <UserAvatar className="h-10 w-10 mr-3" />
                        <div>
                          <p className="font-medium">{user.username}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href="/profile">{t('Profile')}</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/favorites">{t('Favorites')}</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/settings">{t('Settings')}</Link>
                        </Button>
                        {user.role === 'admin' && (
                          <Button asChild variant="outline" size="sm">
                            <Link href="/admin">{t('Admin')}</Link>
                          </Button>
                        )}
                      </div>
                      <Button onClick={logout} variant="destructive" size="sm" className="w-full">
                        {t('Logout')}
                      </Button>
                    </div>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/auth" className="flex items-center justify-center">
                        <User className="h-4 w-4 mr-2" />
                        {t('Login / Register')}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}