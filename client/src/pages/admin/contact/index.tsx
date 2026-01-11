import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Eye, 
  Trash2, 
  Reply, 
  Search,
  Filter,
  MoreVertical,
  ArrowUpDown,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  ArrowLeft,
  Plus,
  RefreshCw
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
  repliedAt?: string;
}

export default function ContactMessagesPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    // Check if user is admin
    if (user && user.role !== 'admin') {
      setLocation('/');
      return;
    }

    // Fetch contact messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/contact-messages', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        } else {
          // For demo purposes, create sample data
          setMessages([
            {
              id: 1,
              name: "John Doe",
              email: "john@example.com",
              phone: "+1234567890",
              subject: "General Inquiry",
              message: "Hello, I'm interested in your music and would like to know more about your upcoming events.",
              status: "unread",
              createdAt: "2024-01-15T10:30:00Z"
            },
            {
              id: 2,
              name: "Jane Smith",
              email: "jane@example.com",
              subject: "Event Information",
              message: "Could you please provide more details about the upcoming festival? I'm very interested in attending.",
              status: "read",
              createdAt: "2024-01-14T15:45:00Z"
            },
            {
              id: 3,
              name: "Mike Johnson",
              email: "mike@example.com",
              phone: "+1987654321",
              subject: "Partnership Opportunity",
              message: "I represent a local venue and would like to discuss potential collaboration opportunities.",
              status: "replied",
              createdAt: "2024-01-13T09:20:00Z",
              repliedAt: "2024-01-13T14:30:00Z"
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to fetch contact messages",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user, setLocation, toast]);

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setIsViewDialogOpen(true);
    
    // Mark as read if unread
    if (message.status === 'unread') {
      markAsRead(message.id);
    }
  };

  const markAsRead = async (messageId: number) => {
    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read' as const } : msg
        ));
        toast({
          title: "Success",
          description: "Message marked as read",
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const response = await fetch(`/api/admin/contact-messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast({
          title: "Success",
          description: "Message deleted successfully",
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Unread</Badge>;
      case 'read':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Read</Badge>;
      case 'replied':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Replied</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedMessages = [...filteredMessages].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "status") {
      const statusOrder = { unread: 0, read: 1, replied: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return 0;
  });

  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'unread').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <Link href="/admin/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Website
                  </Link>
                </Button>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <MessageSquare className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                  Contact Messages
                </h1>
                <p className="text-amber-200/60 mt-2">
                  Manage and respond to customer inquiries and messages.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-400" />
                  Total Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-300">{stats.total}</div>
                <p className="text-xs text-amber-300/60 mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-red-500/20 backdrop-blur-xl hover:border-red-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-400" />
                  Unread
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-300">{stats.unread}</div>
                <p className="text-xs text-red-300/60 mt-1">Requires attention</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-blue-500/20 backdrop-blur-xl hover:border-blue-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  Read
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-300">{stats.read}</div>
                <p className="text-xs text-blue-300/60 mt-1">Viewed</p>
              </CardContent>
            </Card>

            <Card className="bg-black/60 border-green-500/20 backdrop-blur-xl hover:border-green-500/40 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-200/80 flex items-center gap-2">
                  <Reply className="w-5 h-5 text-green-400" />
                  Replied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-300">{stats.replied}</div>
                <p className="text-xs text-green-300/60 mt-1">Responded</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400/50 w-4 h-4" />
              <Input
                placeholder="Search messages by name, email, or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/50"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 bg-black/40 border-amber-500/20 text-amber-100 focus:border-amber-500/50">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-black border-amber-500/20">
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 bg-black/40 border-amber-500/20 text-amber-100 focus:border-amber-500/50">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-black border-amber-500/20">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Messages Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-amber-200">Contact Messages</CardTitle>
                    <CardDescription className="text-amber-300/70">
                      {sortedMessages.length} message{sortedMessages.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-500/30 text-amber-300">
                      {stats.unread} unread
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                      <span className="text-amber-300">Loading messages...</span>
                    </div>
                  </div>
                ) : sortedMessages.length === 0 ? (
                  <div className="text-center py-12 text-amber-300/70">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-amber-400/50" />
                    <p className="text-lg font-medium mb-2">No messages found</p>
                    <p className="text-sm">Try adjusting your search or filter criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-amber-500/20 hover:bg-amber-500/5">
                          <TableHead className="text-amber-200 font-medium">Sender</TableHead>
                          <TableHead className="text-amber-200 font-medium">Subject</TableHead>
                          <TableHead className="text-amber-200 font-medium">Status</TableHead>
                          <TableHead className="text-amber-200 font-medium">Date</TableHead>
                          <TableHead className="text-amber-200 font-medium text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {sortedMessages.map((message, index) => (
                            <motion.tr
                              key={message.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              className="border-amber-500/10 hover:bg-amber-500/5 transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center border border-amber-500/30">
                                      <User className="w-5 h-5 text-amber-400" />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="font-medium text-amber-100">{message.name}</div>
                                    <div className="text-sm text-amber-300/70 flex items-center">
                                      <Mail className="w-3 h-3 mr-1" />
                                      {message.email}
                                    </div>
                                    {message.phone && (
                                      <div className="text-sm text-amber-300/70 flex items-center">
                                        <Phone className="w-3 h-3 mr-1" />
                                        {message.phone}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-amber-100">{message.subject}</div>
                                <div className="text-sm text-amber-300/70 truncate max-w-xs">
                                  {message.message.substring(0, 60)}...
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(message.status)}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-amber-300/70">
                                  {formatDate(message.createdAt)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-amber-300 hover:bg-amber-500/10">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-black border-amber-500/20">
                                    <DropdownMenuItem 
                                      onClick={() => handleViewMessage(message)}
                                      className="text-amber-200 hover:bg-amber-500/10"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    {message.status === 'unread' && (
                                      <DropdownMenuItem 
                                        onClick={() => markAsRead(message.id)}
                                        className="text-blue-300 hover:bg-blue-500/10"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Mark as Read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteMessage(message.id)}
                                      className="text-red-300 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-black/95 border-amber-500/20 text-amber-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-200 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message Details
            </DialogTitle>
            <DialogDescription className="text-amber-300/70">
              {selectedMessage && formatDate(selectedMessage.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-amber-300">From</label>
                  <p className="text-amber-100">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-300">Email</label>
                  <p className="text-amber-100">{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <label className="text-sm font-medium text-amber-300">Phone</label>
                    <p className="text-amber-100">{selectedMessage.phone}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-amber-300">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-amber-300">Subject</label>
                <p className="text-amber-100 font-medium">{selectedMessage.subject}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-amber-300">Message</label>
                <div className="mt-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  <p className="text-amber-100 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              
              {selectedMessage.repliedAt && (
                <div>
                  <label className="text-sm font-medium text-amber-300">Replied At</label>
                  <p className="text-amber-100">{formatDate(selectedMessage.repliedAt)}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-amber-500/20">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Handle reply functionality
                    toast({
                      title: "Reply Feature",
                      description: "Reply functionality will be implemented here.",
                    });
                  }}
                  className="bg-amber-500 text-white hover:bg-amber-600"
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 