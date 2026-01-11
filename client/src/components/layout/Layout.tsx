import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

export default function Layout({ 
  children, 
  includeHeader = true, 
  includeFooter = true 
}: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {includeHeader && <Navbar />}
      <motion.main 
        className={`flex-grow bg-black ${includeHeader ? 'pt-20' : ''}`} // Add padding-top to account for the fixed header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.main>
      {includeFooter && <Footer />}
    </div>
  );
}