import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, 
  Trash2, 
  Search, 
  UserPlus, 
  Filter, 
  Users, 
  Shield, 
  Music,
  Grid3X3,
  List,
  MoreVertical,
  Eye,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Activity,
  ArrowLeft
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface User {
  id: number;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'artist';
  authProvider: 'local' | 'google';
  profilePicture?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export default function UsersManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all_roles");
  const [statusFilter, setStatusFilter] = useState<string>("all_statuses");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fetching users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole as any } : user
        ));
        toast({
          title: "Role updated",
          description: "User role has been updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update user role",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating user role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast({
          title: "User deleted",
          description: "User has been deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while deleting user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all_roles' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all_statuses' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'artist': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'artist': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 z-0 opacity-20">
          <ParticleField />
        </div>
        <div className="relative z-10 p-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400"></div>
          </div>
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
            <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 mb-6">
              <a href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </a>
            </Button>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
              Users Management
            </h2>
            <p className="text-amber-200/60 mt-2">Manage user accounts, roles, and permissions</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 flex justify-end"
          >
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-black font-medium"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Tabs defaultValue="all-users" className="space-y-6">
              <TabsList className="bg-black/40 border border-amber-500/20">
                <TabsTrigger 
                  value="all-users"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
                >
                  <Users className="w-4 h-4 mr-2" />
                  All Users
                </TabsTrigger>
                <TabsTrigger 
                  value="admins"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admins
                </TabsTrigger>
                <TabsTrigger 
                  value="artists"
                  className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 text-amber-200/70"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Artists
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all-users" className="space-y-6">
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-amber-300 flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          All Users ({filteredUsers.length})
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant={viewMode === 'cards' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('cards')}
                          className={viewMode === 'cards' ? 'bg-amber-600 text-black' : 'border-amber-500/30 text-amber-300'}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={viewMode === 'table' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode('table')}
                          className={viewMode === 'table' ? 'bg-amber-600 text-black' : 'border-amber-500/30 text-amber-300'}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-amber-400/60" />
                        <Input
                          type="search"
                          placeholder="Search users by name or email..."
                          className="pl-8 bg-black/40 border-amber-500/20 text-amber-200 placeholder:text-amber-200/50"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px] bg-black/40 border-amber-500/20 text-amber-200">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-amber-500/20">
                          <SelectItem value="all_roles">All Roles</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="artist">Artist</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] bg-black/40 border-amber-500/20 text-amber-200">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 border-amber-500/20">
                          <SelectItem value="all_statuses">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <AnimatePresence mode="wait">
                      {viewMode === 'cards' ? (
                        <motion.div
                          key="cards"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                          {filteredUsers.map((user, index) => (
                            <motion.div
                              key={user.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <Card className="bg-black/40 border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-12 w-12">
                                        <AvatarImage 
                                          src={user.profilePicture} 
                                          alt={user.username}
                                        />
                                        <AvatarFallback className="bg-amber-500/20 text-amber-300">
                                          {user.username.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <CardTitle className="text-amber-300 group-hover:text-amber-200 transition-colors text-lg">
                                          {user.username}
                                        </CardTitle>
                                        <p className="text-amber-200/60 text-sm">{user.email}</p>
                                      </div>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-amber-300 hover:bg-amber-500/10">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-black/90 border-amber-500/20">
                                        <DropdownMenuItem 
                                          className="text-amber-200 hover:bg-amber-500/10"
                                          onClick={() => {
                                            setSelectedUser(user);
                                            setIsEditDialogOpen(true);
                                          }}
                                        >
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          className="text-red-400 hover:bg-red-500/10"
                                          onClick={() => handleDeleteUser(user.id)}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Badge className={getRoleColor(user.role)}>
                                        {user.role}
                                      </Badge>
                                      <Badge 
                                        variant={user.isActive ? "default" : "secondary"}
                                        className={user.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-500/20 text-gray-300"}
                                      >
                                        {user.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm text-amber-200/60">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                                      </div>
                                      {user.lastLogin && (
                                        <div className="flex items-center gap-2">
                                          <Activity className="w-4 h-4" />
                                          <span>Last seen {format(new Date(user.lastLogin), "MMM d")}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="pt-2">
                                      <Select
                                        value={user.role}
                                        onValueChange={(value) => handleRoleChange(user.id, value)}
                                      >
                                        <SelectTrigger className="w-full bg-black/40 border-amber-500/20 text-amber-200">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-black/90 border-amber-500/20">
                                          <SelectItem value="user">User</SelectItem>
                                          <SelectItem value="artist">Artist</SelectItem>
                                          <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="table"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-md border border-amber-500/20"
                        >
                          <Table>
                            <TableHeader>
                              <TableRow className="border-amber-500/20">
                                <TableHead className="text-amber-300">User</TableHead>
                                <TableHead className="text-amber-300">Role</TableHead>
                                <TableHead className="text-amber-300">Status</TableHead>
                                <TableHead className="text-amber-300">Joined</TableHead>
                                <TableHead className="text-amber-300 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="border-amber-500/20">
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profilePicture} alt={user.username} />
                                        <AvatarFallback className="bg-amber-500/20 text-amber-300 text-xs">
                                          {user.username.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="text-amber-300 font-medium">{user.username}</div>
                                        <div className="text-amber-200/60 text-sm">{user.email}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getRoleColor(user.role)}>
                                      {user.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={user.isActive ? "default" : "secondary"}
                                      className={user.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-gray-500/20 text-gray-300"}
                                    >
                                      {user.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-amber-200/60">
                                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-amber-300 hover:bg-amber-500/10"
                                        onClick={() => {
                                          setSelectedUser(user);
                                          setIsEditDialogOpen(true);
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-400 hover:bg-red-500/10"
                                        onClick={() => handleDeleteUser(user.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="admins">
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-amber-300 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Admin Users ({users.filter(u => u.role === 'admin').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.filter(u => u.role === 'admin').map((user) => (
                        <Card key={user.id} className="bg-black/40 border-red-500/20">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.profilePicture} />
                                <AvatarFallback className="bg-red-500/20 text-red-300">
                                  {user.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-red-300">{user.username}</CardTitle>
                                <p className="text-red-200/60 text-sm">{user.email}</p>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="artists">
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-amber-300 flex items-center gap-2">
                      <Music className="w-5 h-5" />
                      Artist Users ({users.filter(u => u.role === 'artist').length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {users.filter(u => u.role === 'artist').map((user) => (
                        <Card key={user.id} className="bg-black/40 border-purple-500/20">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.profilePicture} />
                                <AvatarFallback className="bg-purple-500/20 text-purple-300">
                                  {user.username.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-purple-300">{user.username}</CardTitle>
                                <p className="text-purple-200/60 text-sm">{user.email}</p>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}