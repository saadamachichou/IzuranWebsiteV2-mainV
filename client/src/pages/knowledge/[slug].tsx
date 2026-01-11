import { Helmet } from "react-helmet";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Calendar, User, Clock, Tag, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Article } from "@shared/schema";
import { useState } from "react";

export default function SingleArticlePage() {
  const [, params] = useRoute("/knowledge/:slug");
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const { data: article, isLoading, error } = useQuery<Article>({
    queryKey: [`/api/articles/${params?.slug}`],
    queryFn: async () => {
      if (!params?.slug) throw new Error("Article slug is required");
      
      const response = await fetch(`/api/articles/${params.slug}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch article");
      }
      
      return response.json();
    },
    refetchOnWindowFocus: false,
    enabled: !!params?.slug,
  });

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 flex justify-center items-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-amber-400 mb-4">Article Not Found</h1>
          <p className="text-gray-400 mb-8">The article you're looking for doesn't exist or has been removed.</p>
          <Link href="/knowledge">
            <a className="inline-block px-6 py-3 bg-amber-500 border border-amber-400 rounded-md text-black font-medium glow-button transition-all hover:bg-amber-400">
              Back to Knowledge
            </a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} | Izuran Knowledge</title>
        <meta name="description" content={article.content?.substring(0, 160) || article.title} />
        {article.imageUrl && <meta property="og:image" content={article.imageUrl} />}
      </Helmet>
      
      <div className="min-h-screen bg-black text-white pt-24 pb-16">
        {/* Enhanced background with subtle patterns */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/3 via-transparent to-purple-500/3 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.03),transparent_50%)] pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-6">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link href="/knowledge">
              <a className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors font-medium">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Knowledge
              </a>
            </Link>
          </motion.div>

          {/* Article Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full"
          >
            {/* Article Header */}
            <div className="relative mb-8">
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-semibold rounded-full shadow-lg">
                  <Tag className="h-3 w-3 mr-2" />
                  {article.category}
                </span>
                <div className="flex items-center text-amber-200/80 text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(article.publishDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center text-amber-200/70 text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>~{Math.ceil(article.content.split(' ').length / 200)} min read</span>
                </div>
              </div>
              
              <h1 className="text-amber-200 text-3xl font-medium" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {article.title}
              </h1>
              
               {/* Article subtitle/intro */}
               <div className="text-white text-lg leading-relaxed max-w-4xl mb-8">
                 <p className="font-medium" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                   Explore the depths of ancient wisdom and modern understanding through our curated knowledge base.
                 </p>
               </div>
              
              {/* Decorative line */}
              <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-transparent rounded-full"></div>
            </div>

            {/* Article Content - Full Width Layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="article-content w-full"
            >
              {/* Article Image */}
              {(article.imageUrl || imageError) && (
                <div className="mb-6 rounded-lg overflow-hidden border border-amber-500/20 shadow-lg relative max-w-5xl mx-auto">
                  {!imageError && article.imageUrl ? (
                    <>
                      <img 
                        src={article.imageUrl} 
                        alt={article.title} 
                        className="w-full h-auto object-contain transition-opacity duration-300"
                        style={{ opacity: imageLoading ? 0 : 1 }}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                      />
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-900/50 to-purple-900/50">
                          <Loader2 className="h-12 w-12 animate-spin text-amber-400" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-amber-900/40 to-purple-900/40">
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-amber-400/60 mx-auto mb-3" />
                        <p className="text-amber-200/60 text-base font-medium">{article.title}</p>
                        <p className="text-amber-200/40 text-sm mt-1">No image available</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Article Text Content */}
              <div className="max-w-5xl mx-auto">
                {article.content.split('\n').filter(p => p.trim()).map((paragraph, index) => {
                // Check if this is a heading (starts with #)
                if (paragraph.trim().startsWith('#')) {
                  const match = paragraph.match(/^#+/);
                  if (!match) return null;
                  const level = match[0].length;
                  const text = paragraph.replace(/^#+\s*/, '');
                  const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
                  
                  const headingClasses = {
                    1: 'text-2xl md:text-3xl font-cinzel font-bold text-amber-300 mb-4 mt-6 leading-tight tracking-wide',
                    2: 'text-xl md:text-2xl font-cinzel font-bold text-amber-300 mb-3 mt-5 leading-tight tracking-wide',
                    3: 'text-lg md:text-xl font-cinzel font-semibold text-amber-300 mb-3 mt-4 leading-tight',
                    4: 'text-base md:text-lg font-cinzel font-semibold text-amber-300 mb-2 mt-3 leading-tight',
                    5: 'text-sm md:text-base font-cinzel font-medium text-amber-300 mb-2 mt-2 leading-tight',
                    6: 'text-xs md:text-sm font-cinzel font-medium text-amber-300 mb-2 mt-2 leading-tight'
                  };
                  
                  return (
                    <HeadingTag key={index} className={headingClasses[level as keyof typeof headingClasses] || headingClasses[3]}>
                      {text}
                    </HeadingTag>
                  );
                }
                
                // Check if this is a blockquote (starts with >)
                if (paragraph.trim().startsWith('>')) {
                  const text = paragraph.replace(/^>\s*/, '');
                  return (
                    <blockquote key={index} className="border-l-4 border-gray-400 pl-6 italic text-gray-300 bg-gray-50/5 p-6 my-6 text-xl leading-relaxed">
                      <p className="mb-0" style={{ fontFamily: 'Georgia, serif' }}>{text}</p>
                    </blockquote>
                  );
                }
                
                 // Check if this is a list item (starts with - or *)
                 if (paragraph.trim().match(/^[-*]\s/)) {
                   const text = paragraph.replace(/^[-*]\s*/, '');
                   return (
                     <li key={index} className="list-item">
                       {text}
                     </li>
                   );
                 }
                
                 // Check if this is a numbered list item
                 if (paragraph.trim().match(/^\d+\.\s/)) {
                   const text = paragraph.replace(/^\d+\.\s*/, '');
                   return (
                     <li key={index} className="list-item">
                       {text}
                     </li>
                   );
                 }
                
                 // Regular paragraph with clean styling
                 const isFirstParagraph = index === 0;
                 return (
                   <p key={index} className={isFirstParagraph ? 'first-paragraph' : 'regular-paragraph'}>
                     {paragraph}
                   </p>
                 );
              })}
              </div>
            </motion.div>

            {/* Article Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-16 pt-8 border-t border-amber-500/20"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <Link href="/knowledge">
                  <a className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-black font-semibold rounded-xl hover:from-amber-500 hover:to-amber-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <ArrowLeft className="h-5 w-5 mr-3" />
                    Back to Knowledge
                  </a>
                </Link>
                
                <div className="flex items-center text-amber-200/80 text-sm bg-amber-500/10 px-4 py-2 rounded-lg">
                  <Tag className="h-4 w-4 mr-2" />
                  <span>Category: {article.category}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
} 