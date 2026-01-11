import { Helmet } from "react-helmet";
import ArticleForm from "@/components/admin/ArticleForm";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function NewArticlePage() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-16">
      <Helmet>
        <title>Create New Article | Izuran Admin</title>
      </Helmet>
      
      {/* Background gradient for visual depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/admin/articles" className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-colors font-medium">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Link>
        </div>
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-amber-300 mb-4 tracking-wide">
            Create New Article
          </h1>
          <p className="text-amber-200/80 text-lg">
            Add a new article to the Izuran platform
          </p>
        </div>
        
        {/* Form Container */}
        <div className="glassmorphism rounded-xl p-8 border border-amber-500/20 shadow-2xl backdrop-blur-xl">
          <ArticleForm />
        </div>
      </div>
    </div>
  );
}