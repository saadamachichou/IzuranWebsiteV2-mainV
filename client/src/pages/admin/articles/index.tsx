import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Clock, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Link, useLocation } from "wouter";
import { Article } from "@shared/schema.ts";

export default function AdminArticlesPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all_categories");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { data: articles = [], isLoading, refetch } = useQuery<Article[]>({
    queryKey: ["/api/admin/articles"],
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all_categories" || article.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(articles.map(article => article.category)));

  const deleteArticle = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Article deleted successfully",
        });
        refetch();
      } else {
        throw new Error('Failed to delete article');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete article",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 z-0 opacity-20">
          <ParticleField />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-amber-300 text-lg">Loading articles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/dashboard')}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight mb-2">Articles Management</h1>
            <p className="text-amber-200/60 mb-6">Manage your knowledge base articles and content</p>
            <div className="flex justify-end">
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-black">
                <Link href="/admin/articles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Article
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 h-4 w-4" />
                      <Input
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-amber-500/5 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-amber-500/5 border-amber-500/20 text-amber-300">
                      <Filter className="mr-2 h-4 w-4 text-amber-400" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-amber-500/20">
                      <SelectItem value="all_categories" className="text-amber-300 hover:bg-amber-500/10">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-amber-300 hover:bg-amber-500/10">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`border-amber-500/30 text-amber-300 ${
                        viewMode === "grid" ? "bg-[#ff2600e6]" : ""
                      }`}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className={`border-amber-500/30 text-amber-300 ${
                        viewMode === "table" ? "bg-[#ff2600e6]" : ""
                      }`}
                    >
                      Table
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-amber-200/60">
              Showing {filteredArticles.length} of {articles.length} articles
            </p>
          </motion.div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                                      <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-colors h-full overflow-hidden group">
                      {/* Article Image */}
                      <div className="relative w-full h-48 bg-gradient-to-br from-amber-900/20 to-purple-900/20 overflow-hidden">
                      {article.imageUrl ? (
                        <img
                          src={article.imageUrl.startsWith('http') ? article.imageUrl : article.imageUrl.startsWith('/') ? article.imageUrl : `/uploads/article_images/${article.imageUrl}`}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            const nextSibling = target.nextElementSibling;
                            if (nextSibling) {
                              target.style.display = 'none';
                              nextSibling.classList.remove('hidden');
                            }
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/40 to-purple-900/40 hidden">
                        <div className="text-center">
                          <FileText className="w-12 h-12 text-amber-400/60 mx-auto mb-2" />
                          <p className="text-amber-200/60 text-sm font-medium px-4">{article.title}</p>
                        </div>
                      </div>
                      {!article.imageUrl && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-900/40 to-purple-900/40">
                          <div className="text-center">
                            <FileText className="w-12 h-12 text-amber-400/60 mx-auto mb-2" />
                            <p className="text-amber-200/60 text-sm font-medium px-4">{article.title}</p>
                          </div>
                        </div>
                      )}
                      {/* Overlay gradient for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {article.category}
                        </Badge>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                            <Link href={`/knowledge/${article.slug}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                            <Link href={`/admin/articles/${article.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteArticle(article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-amber-300 mb-2 line-clamp-2">
                        {article.title}
                      </h3>
                      
                      <p className="text-amber-200/70 text-sm mb-4 line-clamp-3">
                        {article.content.substring(0, 150)}...
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-amber-200/50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{Math.ceil(article.content.length / 1000)}k chars</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-amber-500/20">
                          <th className="text-left p-4 text-amber-300 font-medium">Article</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Category</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Created</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredArticles.map((article) => (
                          <tr key={article.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {article.imageUrl ? (
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-900/20 to-purple-900/20">
                                    <img
                                      src={article.imageUrl.startsWith('http') ? article.imageUrl : article.imageUrl.startsWith('/') ? article.imageUrl : `/uploads/article_images/${article.imageUrl}`}
                                      alt={article.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        const parent = target.parentElement;
                                        if (parent) {
                                          target.style.display = 'none';
                                          parent.classList.add('bg-gradient-to-br', 'from-amber-400', 'to-amber-600');
                                          parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg></div>';
                                        }
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-black" />
                                  </div>
                                )}
                                <div>
                                  <div className="text-amber-300 font-medium">{article.title}</div>
                                  <div className="text-amber-200/60 text-sm truncate max-w-48">
                                    {article.content.substring(0, 80)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                {article.category}
                              </Badge>
                            </td>
                            <td className="p-4 text-amber-200/70">
                              {new Date(article.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                                  <Link href={`/knowledge/${article.slug}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                                  <Link href={`/admin/articles/${article.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-400 hover:bg-red-500/10"
                                  onClick={() => deleteArticle(article.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredArticles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center py-12"
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardContent className="p-12">
                  <FileText className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-amber-300 mb-2">No articles found</h3>
                  <p className="text-amber-200/60 mb-6">
                    {searchTerm || categoryFilter !== "all_categories" 
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first article to get started"
                    }
                  </p>
                  <Button asChild className="bg-amber-600 hover:bg-amber-700 text-black">
                    <Link href="/admin/articles/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Article
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}