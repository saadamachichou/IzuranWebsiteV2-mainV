import { motion } from "framer-motion";
import { Article } from "@shared/schema";
import { Link } from "wouter";
import { ArrowRight, FileText, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <motion.div 
      className="article-card glassmorphism rounded-lg overflow-hidden transition-all glow-card border border-amber-500/20 hover:border-amber-500/40"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="relative w-full h-48 article-image-container overflow-hidden">
        {article.imageUrl ? (
          <OptimizedImage
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover object-center article-image"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading="lazy"
            fallback="/placeholder.svg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center article-image-fallback bg-gradient-to-br from-gray-800 to-gray-700">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-amber-400/60 mx-auto mb-2" />
              <p className="text-amber-200/60 text-sm font-medium">{article.title}</p>
            </div>
          </div>
        )}
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
      </div>
      
      <div className="article-card-body p-6">
        <span className="inline-block px-3 py-1 bg-amber-600 text-black text-xs font-semibold rounded-full mb-3 w-fit">
          {article.category}
        </span>
        <h3 className="text-xl font-bold font-space text-white mb-3 line-clamp-2">{article.title}</h3>
        <p className="article-card-text article-card-content mb-4">
          {article.content.length > 120 
            ? `${article.content.substring(0, 120)}...` 
            : article.content}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="text-sm text-amber-400/60">
            {format(new Date(article.publishDate), 'MMMM d, yyyy')}
          </span>
          <Link href={`/knowledge/${article.slug}`} className="text-amber-400 hover:text-amber-200 transition-all flex items-center text-sm font-medium">
            Read Article <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
