import { Helmet } from "react-helmet";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArticleForm from "@/components/admin/ArticleForm";
import { Article } from "@shared/schema";

export default function EditArticlePage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/admin/articles/:id/edit");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get article data
  const { data: article, isLoading: queryLoading, error: queryError } = useQuery({
    queryKey: [`/api/admin/articles/${params?.id}`],
    queryFn: async () => {
      if (!params?.id) throw new Error("Article ID is required");
      
      const response = await fetch(`/api/admin/articles/${params.id}`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch article");
      }
      
      return response.json();
    },
    refetchOnWindowFocus: false,
    enabled: !!params?.id,
  });

  useEffect(() => {
    setIsLoading(queryLoading);
    if (queryError) setError(queryError as Error);
  }, [queryLoading, queryError]);

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
        <Helmet>
          <title>Error | Izuran Admin</title>
        </Helmet>
        
        <div className="max-w-4xl mx-auto px-4">
          <div className="glassmorphism rounded-xl p-8 border border-amber-500/20 shadow-2xl">
            <div className="bg-red-500/10 text-red-400 p-4 rounded-md mb-6">
              {error ? error.message : "Article not found"}
            </div>
            
            <Button 
              onClick={() => setLocation("/admin/articles")}
              className="bg-amber-500 text-black hover:bg-amber-600"
            >
              Back to Articles
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-16">
      <Helmet>
        <title>Edit Article | Izuran Admin</title>
      </Helmet>
      
      {/* Background gradient for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <Button 
            onClick={() => setLocation("/admin/articles")}
            className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors font-medium bg-transparent border-0 p-0"
          >
            ← Back to Articles
          </Button>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-300 mb-4 tracking-wide">
            Edit Article
          </h1>
          <p className="text-amber-200/80 text-lg">
            Modify the article "{article.title}"
          </p>
        </div>
        
        {/* Form Container */}
        <div className="glassmorphism rounded-xl p-8 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <ArticleForm article={article as Article} isEditing />
        </div>
      </div>
    </div>
  );
}