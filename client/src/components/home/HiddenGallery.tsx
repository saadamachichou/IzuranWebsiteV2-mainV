import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, ExternalLink, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryItem } from '@shared/schema';
import { processYouTubeUrl, isYouTubeUrl, isYouTubeIframe } from '@/utils/youtube';

// Gallery data will be fetched from API

interface HiddenGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HiddenGallery({ isOpen, onClose }: HiddenGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load gallery items when gallery opens
  useEffect(() => {
    if (isOpen) {
      loadGalleryItems();
    }
  }, [isOpen]);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadGalleryItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/gallery');
      if (response.ok) {
        const data = await response.json();
        setGalleryItems(data);
      } else {
        console.error('Failed to load gallery items');
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openLightbox = (item: GalleryItem) => {
    setSelectedItem(item);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedItem(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Psychedelic background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-600/20 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-600/15 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 p-3 bg-black/50 border border-purple-500/50 rounded-full text-purple-400 hover:text-purple-300 hover:bg-black/70 transition-all duration-300 backdrop-blur-sm"
          >
            <X size={24} />
          </button>

          {/* Gallery content */}
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Header */}
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-4xl md:text-6xl font-bold mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
                    The Void Gallery
                  </span>
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                  Explore the depths of consciousness through visual and auditory experiences
                </p>
              </motion.div>

              {/* Gallery grid */}
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-amber-200">Loading gallery items...</div>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  {galleryItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-purple-500/30 bg-gradient-to-br from-black/60 via-purple-900/20 to-cyan-900/20 backdrop-blur-sm cursor-pointer"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    onClick={() => openLightbox(item)}
                  >
                    {/* Item content */}
                    {item.type === 'image' ? (
                      <div className="relative w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                        <img
                          src={item.src}
                          alt={item.title || 'Gallery item'}
                          className="relative w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          onError={(e) => {
                            console.error('Image failed to load:', item.src);
                            e.currentTarget.src = '/placeholder.svg';
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onLoad={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        />
                      </div>
                    ) : item.type === 'youtube' ? (
                      <div className="relative w-full h-full">
                        {/* Use custom thumbnail if provided, otherwise use YouTube thumbnail */}
                        {item.thumbnail ? (
                          <>
                            <div className="relative w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                              <img
                                src={item.thumbnail}
                                alt={item.title || 'YouTube video thumbnail'}
                                className="relative w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  console.error('Custom thumbnail failed to load:', item.thumbnail);
                                  e.currentTarget.src = '/placeholder.svg';
                                  e.currentTarget.style.opacity = '0.5';
                                }}
                                onLoad={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                }}
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors z-10 pointer-events-none">
                              <div className="w-16 h-16 bg-red-600/80 rounded-full flex items-center justify-center group-hover:bg-red-500 transition-colors pointer-events-auto cursor-pointer">
                                <Youtube size={24} className="text-white" />
                              </div>
                            </div>
                          </>
                        ) : (() => {
                          const youtubeData = processYouTubeUrl(item.src);
                          return youtubeData ? (
                            <>
                              <div className="relative w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                                <img
                                  src={youtubeData.thumbnailUrl}
                                  alt={item.title || 'YouTube video thumbnail'}
                                  className="relative w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  onError={(e) => {
                                    console.error('YouTube thumbnail failed to load:', youtubeData.thumbnailUrl);
                                    e.currentTarget.src = '/placeholder.svg';
                                    e.currentTarget.style.opacity = '0.5';
                                  }}
                                  onLoad={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                  }}
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/30 transition-colors z-10 pointer-events-none">
                                <div className="w-16 h-16 bg-red-600/80 rounded-full flex items-center justify-center group-hover:bg-red-500 transition-colors pointer-events-auto cursor-pointer">
                                  <Youtube size={24} className="text-white" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <div className="text-center text-gray-400">
                                <Youtube className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-xs">Invalid YouTube URL</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="relative w-full h-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                        <img
                          src={item.thumbnail || '/placeholder.svg'}
                          alt={item.title || 'Video thumbnail'}
                          className="relative w-full h-full object-cover"
                          onError={(e) => {
                            console.error('Thumbnail failed to load:', item.thumbnail);
                            e.currentTarget.src = '/placeholder.svg';
                            e.currentTarget.style.opacity = '0.5';
                          }}
                          onLoad={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none">
                          <div className="w-16 h-16 bg-amber-600/80 rounded-full flex items-center justify-center group-hover:bg-amber-500 transition-colors pointer-events-auto cursor-pointer">
                            <Play size={24} className="text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Overlay - Title & Description on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                      <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                        <h3 className="text-white font-semibold text-sm mb-1">{item.title}</h3>
                        <p className="text-gray-300 text-xs">{item.description}</p>
                      </div>
                    </div>

                    {/* Glow effect - Border glow on hover */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none" />
                  </motion.div>
                ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Lightbox */}
          <AnimatePresence>
            {isLightboxOpen && selectedItem && (
              <motion.div
                className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeLightbox}
              >
                <div className="relative max-w-[95vw] max-h-full">
                  <button
                    onClick={closeLightbox}
                    className="absolute -top-12 right-0 p-2 bg-black/50 border border-purple-500/50 rounded-full text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <X size={20} />
                  </button>

                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-[95vw]"
                  >
                    {selectedItem.type === 'image' ? (
                      <img
                        src={selectedItem.src}
                        alt={selectedItem.title || 'Gallery item'}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    ) : selectedItem.type === 'youtube' ? (
                      <div className="relative w-full max-w-[95vw]">
                        <div className="w-full aspect-video rounded-lg overflow-hidden" style={{ height: '80vh' }}>
                          {(() => {
                            const youtubeData = processYouTubeUrl(selectedItem.src);
                            return youtubeData ? (
                              <iframe
                                src={youtubeData.embedUrl}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                allowFullScreen
                                title={selectedItem.title || 'YouTube video'}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                                <div className="text-center">
                                  <Youtube className="h-16 w-16 text-red-400 mx-auto mb-4" />
                                  <p className="text-red-400 mb-4 text-lg">Invalid YouTube URL</p>
                                  <p className="text-amber-300/70 text-sm">Please check the URL format</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full max-w-5xl">
                        <div className="w-full aspect-video rounded-lg bg-gray-800 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-amber-300 text-6xl mb-4">▶️</div>
                            <p className="text-amber-300 mb-4 text-lg">Click to watch on YouTube</p>
                            <p className="text-amber-300/70 text-sm mb-6">For the best performance and quality</p>
                            <Button
                              onClick={() => {
                                const youtubeUrl = selectedItem.src.replace('/embed/', '/watch?v=');
                                window.open(youtubeUrl, '_blank');
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg"
                            >
                              Watch on YouTube
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedItem.title && (
                      <div className="mt-4 text-center">
                        <h3 className="text-2xl font-bold text-white mb-2">{selectedItem.title}</h3>
                        {selectedItem.description && (
                          <p className="text-gray-300">{selectedItem.description}</p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 