import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export default function Knowledge() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Get unique categories
  const categories = articles
    ? ["All", ...Array.from(new Set(articles.map(article => article.category)))]
    : ["All", "Mysticism", "Culture", "Technique"];

  // Get featured article (most recent)
  const featuredArticle = articles?.[0];

  return (
    <>
      <Helmet>
        <title>Esoteric Knowledge - Izuran</title>
        <meta name="description" content="Explore articles on Amazigh mysticism, sonic patterns, esoteric knowledge, and field recording techniques in sacred spaces." />
      </Helmet>
      
      <div className="min-h-screen bg-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-3 font-inter font-semibold text-amber-400 tracking-wide uppercase text-sm">Our blog</p>
            <h1 className="mb-4 text-4xl font-bold lg:mb-6 lg:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>
              Resources and insights
            </h1>
            <p className="text-lg font-inter text-gray-300 lg:text-xl leading-relaxed max-w-3xl">
              The latest industry news, interviews, technologies, and resources.
            </p>
          </motion.div>

          {/* Featured Article - Desktop */}
          {featuredArticle && (
            <motion.div
              className="mt-6 hidden h-60 w-full items-end overflow-hidden rounded-lg bg-cover bg-bottom bg-no-repeat drop-shadow lg:mt-4 lg:flex lg:h-[700px]"
              style={{ backgroundImage: `url(${featuredArticle.imageUrl})` }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="w-full border-t border-white/10 bg-black/40 p-10 text-white backdrop-blur-2xl">
                <Link href={`/knowledge/${featuredArticle.slug}`}>
                  <h2 className="mb-3 text-2xl font-space font-bold hover:text-amber-300 transition-colors cursor-pointer leading-tight">
                    {featuredArticle.title}
                  </h2>
                </Link>
                <p className="line-clamp-2 font-inter text-gray-200 leading-relaxed text-base">
                  {featuredArticle.content.substring(0, 150)}...
                </p>
                <p className="mt-5 text-sm font-inter text-gray-300 uppercase tracking-wide">Written by</p>
                <Link href={`/knowledge/${featuredArticle.slug}`}>
                  <div className="mt-2 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity w-fit">
                    <Avatar className="ring-1 ring-white/20">
                      <AvatarImage src="https://api.dicebear.com/7.x/lorelei/svg?flip=false" />
                      <AvatarFallback>IZ</AvatarFallback>
                    </Avatar>
                    <span className="font-inter font-medium">Izuran Team</span>
                  </div>
                </Link>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Badge className="border-white px-3 py-1 text-sm text-white font-inter font-medium" variant="outline">
                    {featuredArticle.category}
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}

          {/* Featured Article - Mobile */}
          {featuredArticle && (
            <motion.div
              className="mt-16 mb-10 lg:hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href={`/knowledge/${featuredArticle.slug}`}>
                <img
                  src={featuredArticle.imageUrl}
                  alt={featuredArticle.title}
                  className="mb-5 h-[240px] w-full rounded-lg object-cover shadow"
                />
              </Link>
              <p className="mb-2 text-sm font-inter font-semibold text-amber-400 uppercase tracking-wide">
                {featuredArticle.category}
              </p>
              <Link href={`/knowledge/${featuredArticle.slug}`}>
                <p className="mb-2 text-xl font-space font-bold lg:text-2xl hover:text-amber-400 transition-colors cursor-pointer leading-snug">
                  {featuredArticle.title}
                </p>
              </Link>
              <p className="mb-5 line-clamp-2 text-ellipsis text-gray-300 font-inter leading-relaxed">
                {featuredArticle.content}
              </p>
              <div className="flex items-center">
                <Avatar className="mr-3 rounded-full bg-background shadow ring-1 ring-ring/30">
                  <AvatarImage src="https://api.dicebear.com/7.x/lorelei/svg?flip=false" />
                  <AvatarFallback>IZ</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-inter font-semibold text-gray-200">Izuran Team</p>
                  <p className="text-sm font-inter text-gray-400">
                    {format(new Date(featuredArticle.publishDate), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filter Tabs */}
          <Tabs defaultValue="All" className="mt-5">
            <TabsList className="relative h-auto w-full justify-start gap-3 overflow-x-auto bg-transparent border-b rounded-none p-0">
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="p-2 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-amber-400 focus-visible:ring-0 focus-visible:ring-offset-0 font-inter font-semibold text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Articles Grid */}
            {categories.map((category) => (
              <TabsContent key={category} value={category} className="mt-12 lg:mt-16">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="mb-5 h-[240px] w-full bg-muted rounded-lg" />
                        <div className="h-4 w-20 bg-muted rounded mb-2" />
                        <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                        <div className="h-16 w-full bg-muted rounded mb-5" />
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted" />
                          <div className="flex-1">
                            <div className="h-4 w-24 bg-muted rounded mb-1" />
                            <div className="h-3 w-20 bg-muted rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
                    {articles
                      ?.filter(article => category === "All" || article.category === category)
                      .slice(1) // Skip featured article
                      .map((article, index) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                          <Link href={`/knowledge/${article.slug}`}>
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="mb-5 h-[240px] w-full rounded-lg object-cover shadow hover:opacity-90 transition-opacity cursor-pointer"
                            />
                          </Link>
                          <p className="mb-2 text-sm font-inter font-semibold text-amber-400 uppercase tracking-wide">
                            {article.category}
                          </p>
                          <Link href={`/knowledge/${article.slug}`}>
                            <p className="mb-2 text-xl font-space font-bold lg:text-2xl hover:text-amber-400 transition-colors cursor-pointer leading-snug">
                              {article.title}
                            </p>
                          </Link>
                          <p className="mb-5 line-clamp-2 text-ellipsis text-gray-300 font-inter leading-relaxed">
                            {article.content}
                          </p>
                          <div className="flex items-center">
                            <Avatar className="mr-3 rounded-full bg-background shadow ring-1 ring-ring/30">
                              <AvatarImage src="https://api.dicebear.com/7.x/lorelei/svg?flip=false" />
                              <AvatarFallback>IZ</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-inter font-semibold text-gray-200">Izuran Team</p>
                              <p className="text-sm font-inter text-gray-400">
                                {format(new Date(article.publishDate), 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && articles?.filter(article => category === "All" || article.category === category).length === 1 && (
                  <div className="text-center py-12">
                    <p className="text-gray-400 font-inter">No more articles in this category.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
}
