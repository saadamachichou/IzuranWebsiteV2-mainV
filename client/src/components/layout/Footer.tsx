import React from 'react';
import { Link } from 'wouter';
import { useLanguage } from '@/context/LanguageContext';
import { Facebook, Instagram, Twitter, Youtube, Mail } from 'lucide-react';
import { SoundCloudIcon, BandcampIcon } from '@/components/icons/BrandIcons';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AnimatedLogo from '@/components/ui/animated-logo';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-black/90 backdrop-blur-xl border-t border-amber-500/20 mt-8">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <AnimatedLogo 
                  size="md" 
                  className="w-10 h-12" 
                  showText={false}
                />
                <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>IZURAN</span>
              </div>
            </Link>
            <p className="text-base text-amber-200/80 leading-relaxed" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              {t('Izuran Records is a record label and event promoter that celebrates Amazigh culture, psychedelic electronic music, and esoteric knowledge.')}
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" aria-label="Facebook" className="text-gray-400 hover:text-blue-500 hover:bg-amber-500/10 transition-all">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Instagram" className="text-gray-400 hover:text-pink-500 hover:bg-amber-500/10 transition-all" asChild>
                <a href="https://www.instagram.com/izuran.records/" target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" aria-label="Twitter" className="text-gray-400 hover:text-cyan-400 hover:bg-amber-500/10 transition-all">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="YouTube" className="text-gray-400 hover:text-red-500 hover:bg-amber-500/10 transition-all">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-medium mb-4 text-amber-300">{t('Quick Links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/artists" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Artists')}
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Events')}
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Shop')}
                </Link>
              </li>
              <li>
                <Link href="/podcasts" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Podcast')}
                </Link>
              </li>
              <li>
                <Link href="/knowledge" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Knowledge')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="font-medium mb-4 text-amber-300">{t('Legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Terms of Service')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Cookie Policy')}
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Shipping Policy')}
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  {t('Refund Policy')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact & Music Platforms */}
          <div>
            <h3 className="font-medium mb-4 text-amber-300">{t('Contact')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-amber-400" />
                <a 
                  href="mailto:info@izuran.com" 
                  className="text-base text-amber-200/80 hover:text-amber-400 transition-colors"
                  style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                >
                  info@izuran.com
                </a>
              </li>
            </ul>
            
            <h3 className="font-medium mt-6 mb-4 text-amber-300">{t('Music Platforms')}</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <SoundCloudIcon className="h-4 w-4 mr-2 text-orange-500" />
                <a 
                  href="https://soundcloud.com/izuran-records" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base text-amber-200/80 hover:text-orange-500 transition-colors"
                  style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                >
                  SoundCloud
                </a>
              </li>
              <li className="flex items-center">
                <BandcampIcon className="h-4 w-4 mr-2 text-cyan-500" />
                <a 
                  href="https://izuranrecords.bandcamp.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-base text-amber-200/80 hover:text-cyan-500 transition-colors"
                  style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                >
                  Bandcamp
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8 bg-amber-500/20" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-base text-amber-200/80" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              &copy; 2025 Izuran Records. {t('All rights reserved.')}
            </p>
            <p className="text-sm text-amber-200/80 mt-1" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              Developed by{' '}
              <a 
                href="https://astroqodelabs.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                ASTROQODELABS
              </a>
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link href="/contact" className="text-base text-amber-200/80 hover:text-amber-400 transition-colors" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              {t('Contact Us')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}