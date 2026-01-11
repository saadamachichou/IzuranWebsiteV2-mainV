import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';

import ProductList from '@/components/shop/ProductList';
import { useCart } from '@/context/CartContext';
import { Product } from '@shared/schema';
import { useLanguage } from '@/context/LanguageContext';

export default function ShopPage() {
  const { addToCart, toggleCart } = useCart();
  const { t } = useLanguage();

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    // Open cart when item is added
    toggleCart();
  };

  return (
    <>
      <Helmet>
        <title>{t('Shop')} | Izuran Records</title>
        <meta name="description" content={t('Shop for vinyl records, digital downloads, merchandise and more from Izuran Records artists.')} />
      </Helmet>

      <div className="bg-black min-h-screen">
        <div className="mt-32 pb-8 bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Shop</span>
              </h1>
              <p className="text-lg max-w-3xl mx-auto text-gray-300" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                Discover exclusive vinyl records, digital downloads, merchandise, and more from our artists and collaborators.
              </p>
            </motion.div>
          </div>
        </div>

        <main className="py-8">
          {/* Products Section */}
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <ProductList onAddToCart={handleAddToCart} />
          </motion.section>
        </main>
      </div>
    </>
  );
}