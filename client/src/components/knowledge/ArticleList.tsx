import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { Article } from "@shared/schema";
import ArticleCard from "./ArticleCard";
import { motion } from "framer-motion";

export default function ArticleList({ limit = 0 }: { limit?: number }) {
  const [category, setCategory] = useState<string>("all");
  
  const { data: articles, isLoading, error } = useQuery<Article[]>({
    queryKey: [`/api/articles${category !== "all" ? `?category=${category}` : ""}`],
  });

  // Get unique categories from articles or use defaults if loading
  const getCategories = () => {
    if (!articles) {
      return [
        { id: "all", name: "All Articles" },
        { id: "Mysticism", name: "Mysticism" },
        { id: "Culture", name: "Culture" },
        { id: "Technique", name: "Technique" }
      ];
    }
    
    const uniqueCategories = Array.from(new Set(articles.map(article => article.category)));
    return [
      { id: "all", name: "All Articles" },
      ...uniqueCategories.map(cat => ({ id: cat, name: cat }))
    ];
  };

  const categories = getCategories();

  if (isLoading) {
    return (
      <>
        <div className="flex gap-6 mb-8 overflow-x-auto pb-4 scrollbar-thin">
          {categories.map((cat) => (
            <button 
              key={cat.id}
              className={`px-4 py-2 rounded whitespace-nowrap transition-all ${
                category === cat.id 
                  ? "bg-izuran-purple text-white" 
                  : "bg-transparent border border-izuran-blue text-white hover:bg-izuran-purple hover:bg-opacity-30"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(limit > 0 ? limit : 3)].map((_, i) => (
            <div key={i} className="glassmorphism rounded-lg overflow-hidden animate-pulse border border-amber-500/20">
              <div className="w-full h-48 bg-amber-500/20" />
              <div className="p-6">
                <div className="h-5 w-20 bg-amber-600/50 rounded-full mb-3" />
                <div className="h-6 bg-amber-500/30 rounded w-3/4 mb-2" />
                <div className="h-16 bg-amber-500/10 rounded w-full mb-4" />
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-amber-500/20 rounded w-1/4" />
                  <div className="h-4 bg-amber-600/30 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (error || !articles) {
    return (
      <div className="glassmorphism rounded-lg p-8 text-center border border-amber-500/20">
        <p className="text-amber-400 mb-4">Unable to load articles at this time.</p>
        <p className="text-gray-400">Please check back later.</p>
      </div>
    );
  }

  // Filter articles by category if not "all"
  const filteredArticles = category === "all" 
    ? articles 
    : articles.filter(article => article.category === category);

  // Limit number of articles if limit is provided
  const displayedArticles = limit > 0 ? filteredArticles.slice(0, limit) : filteredArticles;

  return (
    <>
      <motion.div 
        className="flex gap-6 mb-8 overflow-x-auto pb-4 scrollbar-thin"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        {categories.map((cat) => (
          <button 
            key={cat.id}
            className={`px-4 py-2 rounded whitespace-nowrap transition-all ${
              category === cat.id 
                ? "bg-amber-500 text-black" 
                : "bg-transparent border border-amber-500 text-amber-400 hover:bg-amber-500/20"
            }`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </motion.div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayedArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      
      {limit > 0 && articles.length > limit && (
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/knowledge">
            <a className="inline-block px-6 py-2 border border-amber-500 text-amber-400 rounded hover:bg-amber-500 hover:text-black transition-all glow-button">
              View All Articles
            </a>
          </Link>
        </motion.div>
      )}
    </>
  );
}
