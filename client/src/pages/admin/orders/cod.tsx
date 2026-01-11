import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Eye, 
  Edit, 
  Calendar, 
  FileText, 
  Trash2,
  Users,
  Car,
  Bike,
  Star,
  AlertTriangle,
  TrendingUp,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from "@/context/AuthContext";
import { motion } from 'framer-motion';

interface CODOrder {
  id: number;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  notes?: string;
  total: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  deliveryScheduledAt?: string;
  deliveryCompletedAt?: string;
  cashCollectedAmount?: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  deliveryPersonnel?: {
    id: number;
    name: string;
    phone: string;
    vehicleInfo?: string;
    rating?: number;
    isAvailable?: boolean;
  };
  items: Array<{
    id: number;
    quantity: number;
    price: string;
    product: {
      id: number;
      name: string;
      category: string;
      imageUrl?: string;
    };
  }>;
}

interface DeliveryPersonnel {
  id: number;
  name: string;
  phone: string;
  email?: string;
  vehicleInfo?: string;
  isActive: boolean;
  rating?: number;
  totalDeliveries?: number;
  currentLocation?: string;
  isAvailable?: boolean;
}

export default function AdminCODOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<CODOrder | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeliveryPersonnel, setSelectedDeliveryPersonnel] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch COD orders
  const { data: orders, isLoading: ordersLoading } = useQuery<CODOrder[]>({
    queryKey: ['/api/admin/orders/cod'],
  });

  // Fetch delivery personnel
  const { data: deliveryPersonnel } = useQuery<DeliveryPersonnel[]>({
    queryKey: ['/api/admin/delivery-personnel'],
  });

  // Mutation to assign delivery personnel
  const assignDeliveryMutation = useMutation({
    mutationFn: async ({ orderId, deliveryPersonnelId, deliveryScheduledAt }: {
      orderId: number;
      deliveryPersonnelId: number;
      deliveryScheduledAt: string;
    }) => {
      const response = await apiRequest(
        'PUT',
        `/api/admin/orders/${orderId}/assign-delivery`,
        { deliveryPersonnelId, deliveryScheduledAt }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders/cod'] });
      toast({ title: 'Success', description: 'Delivery personnel assigned successfully' });
      setSelectedOrder(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to assign delivery personnel', variant: 'destructive' });
    }
  });

  // Mutation to update delivery status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, cashCollectedAmount }: {
      orderId: number;
      status: string;
      cashCollectedAmount?: string;
    }) => {
      const response = await apiRequest(
        'PUT',
        `/api/delivery/orders/${orderId}/status`,
        { status, cashCollectedAmount }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders/cod'] });
      toast({ title: 'Success', description: 'Order status updated successfully' });
      setSelectedOrder(null);
      setCashAmount('');
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update order status', variant: 'destructive' });
    }
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        icon: Clock
      },
      shipped: { 
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        icon: Package
      },
      out_for_delivery: { 
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        icon: Truck
      },
      delivered_paid: { 
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
        icon: CheckCircle
      },
      cancelled: { 
        color: 'bg-red-500/20 text-red-300 border-red-500/30',
        icon: AlertTriangle
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1`}>
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getVehicleIcon = (vehicleInfo: string) => {
    const vehicleType = vehicleInfo?.toLowerCase().split(' ')[0] || 'car';
    switch (vehicleType) {
      case 'car':
        return <Car className="h-4 w-4" />;
      case 'motorcycle':
        return <Truck className="h-4 w-4" />;
      case 'bike':
        return <Bike className="h-4 w-4" />;
      default:
        return <Truck className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders?.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  ) || [];

  const handleAssignDelivery = () => {
    if (!selectedOrder || !selectedDeliveryPersonnel || !deliveryDate) return;
    
    assignDeliveryMutation.mutate({
      orderId: selectedOrder.id,
      deliveryPersonnelId: parseInt(selectedDeliveryPersonnel),
      deliveryScheduledAt: deliveryDate
    });
  };

  const handleSmartAssignDelivery = () => {
    if (!selectedOrder || !deliveryPersonnel || deliveryPersonnel.length === 0) {
      toast({
        title: 'Error',
        description: 'No delivery personnel available.',
        variant: 'destructive'
      });
      return;
    }

    // Smart assignment logic: prioritize active personnel with higher ratings
    const availablePersonnel = deliveryPersonnel.filter(dp => dp.isActive);
    
    if (availablePersonnel.length === 0) {
      toast({
        title: 'Error',
        description: 'No active delivery personnel available.',
        variant: 'destructive'
      });
      return;
    }

    // Sort by rating (highest first) and then by total deliveries (most experienced)
    const sortedPersonnel = availablePersonnel.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.totalDeliveries || 0) - (a.totalDeliveries || 0);
    });

    const bestPersonnel = sortedPersonnel[0];

    assignDeliveryMutation.mutate({
      orderId: selectedOrder.id,
      deliveryPersonnelId: bestPersonnel.id,
      deliveryScheduledAt: deliveryDate || new Date().toISOString()
    });
  };

  const handleStatusUpdate = (status: string) => {
    if (!selectedOrder) return;
    
    updateStatusMutation.mutate({
      orderId: selectedOrder.id,
      status,
      cashCollectedAmount: status === 'delivered_paid' ? cashAmount : undefined
    });
  };

  const handleOrderSelect = (order: CODOrder) => {
    setSelectedOrder(order);
    setSelectedDeliveryPersonnel(order.deliveryPersonnel?.id.toString() || '');
    setCashAmount(order.cashCollectedAmount || '');
    setIsDialogOpen(true);
  };

  const handleDeleteOrder = useMutation({
    mutationFn: async (orderId: number) => {
      try {
        const response = await apiRequest(
          'DELETE',
          `/api/admin/orders/cod/${orderId}`
        );
        
        if (response.ok) {
          return { success: true };
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete order');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      } catch (error) {
        console.error('Delete order error:', error);
        throw new Error('Failed to delete order. Please try again.');
      }
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['/api/admin/orders/cod'] });
      toast({ 
        title: 'Success', 
        description: 'Order deleted successfully',
        variant: 'default'
      });
      setIsDialogOpen(false);
      setSelectedOrder(null);
      setStatusFilter('all');
      setRefreshKey(prevKey => prevKey + 1);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete order', 
        variant: 'destructive' 
      });
    }
  });

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-6"></div>
          <p className="text-amber-200 text-lg">Loading COD orders...</p>
        </motion.div>
      </div>
    );
  }

  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const inTransitOrders = filteredOrders.filter(o => ['shipped', 'out_for_delivery'].includes(o.status)).length;
  const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered_paid').length;
  const totalRevenue = filteredOrders
    .filter(o => o.status === 'delivered_paid')
    .reduce((sum, o) => sum + parseFloat(o.total), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent tracking-tight mb-2">
              COD Orders Management
            </h1>
            <p className="text-amber-200/80 text-xl">
              Track and manage cash on delivery orders with real-time status updates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-4 py-2">
              <User className="h-4 w-4 mr-2" />
              {user?.role || 'Admin'}
            </Badge>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border-yellow-500/30 backdrop-blur-xl hover:border-yellow-500/50 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-yellow-500/20 rounded-xl group-hover:bg-yellow-500/30 transition-colors">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-200/80">Pending Orders</p>
                    <p className="text-3xl font-bold text-yellow-300">{pendingOrders}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-yellow-400/60 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Awaiting assignment
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border-blue-500/30 backdrop-blur-xl hover:border-blue-500/50 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <Truck className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-200/80">In Transit</p>
                    <p className="text-3xl font-bold text-blue-300">{inTransitOrders}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-blue-400/60 flex items-center gap-1">
                <Package className="h-3 w-3" />
                Out for delivery
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30 backdrop-blur-xl hover:border-green-500/50 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-200/80">Delivered</p>
                    <p className="text-3xl font-bold text-green-300">{deliveredOrders}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-green-400/60 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Successfully completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/30 backdrop-blur-xl hover:border-amber-500/50 transition-all duration-300 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                    <DollarSign className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-200/80">Total Revenue</p>
                    <p className="text-3xl font-bold text-amber-300">${totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="text-xs text-amber-400/60 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Cash collected
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-amber-500/20">
              <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                Overview
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                Orders ({filteredOrders.length})
              </TabsTrigger>
              <TabsTrigger value="personnel" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
                Delivery Personnel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Actions */}
              <Card className="bg-black/40 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20">
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      onClick={() => setActiveTab('orders')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View All Orders
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
                      onClick={() => setActiveTab('personnel')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Manage Personnel
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-black/40 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20">
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {filteredOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Package className="h-4 w-4 text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium text-white">Order #{order.id}</p>
                            <p className="text-sm text-amber-200/60">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOrderSelect(order)}
                            className="text-amber-300 hover:text-amber-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              {/* Filters */}
              <Card className="bg-black/40 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20">
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div>
                      <Label htmlFor="status-filter" className="text-amber-200/80">Filter by Status</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[200px] border-amber-500/30 bg-black/30 text-white">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="border-amber-500/30 bg-black/80">
                          <SelectItem value="all">All Orders</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered_paid">Delivered & Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Table */}
              <Card className="bg-black/40 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20">
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    COD Orders ({filteredOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-amber-500/20 hover:bg-amber-500/5">
                        <TableHead className="text-amber-200/80 font-semibold">Order ID</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Customer</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Items</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Total</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Status</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Delivery Personnel</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Created</TableHead>
                        <TableHead className="text-amber-200/80 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-amber-500/20 hover:bg-amber-500/5 transition-colors">
                          <TableCell className="font-medium text-amber-300">#{order.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{order.customerName}</p>
                              <p className="text-sm text-amber-200/60 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {order.customerPhone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-amber-200/80">{order.items.length} items</TableCell>
                          <TableCell className="font-medium text-amber-300">${order.total}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            {order.deliveryPersonnel ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-amber-500/20 rounded">
                                  {getVehicleIcon(order.deliveryPersonnel.vehicleInfo || '')}
                                </div>
                                <div>
                                  <p className="font-medium text-white">{order.deliveryPersonnel.name}</p>
                                  <p className="text-sm text-amber-200/60">{order.deliveryPersonnel.phone}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-amber-400/60 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Not assigned
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-amber-200/80">{format(new Date(order.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOrderSelect(order)}
                                className="border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(order.status === 'pending' || order.status === 'cancelled') && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this order?')) {
                                      handleDeleteOrder.mutate(order.id);
                                    }
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No COD orders found</p>
                      <p className="text-gray-400">Try adjusting your filters</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personnel" className="space-y-6">
              {/* Delivery Personnel Management */}
              <Card className="bg-black/40 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-gradient-to-r from-amber-500/10 to-transparent border-b border-amber-500/20">
                  <CardTitle className="text-amber-300 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Delivery Personnel
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deliveryPersonnel?.map((personnel) => (
                      <Card key={personnel.id} className="bg-black/20 border-amber-500/20 hover:border-amber-500/40 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                              {getVehicleIcon(personnel.vehicleInfo || '')}
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{personnel.name}</h3>
                              <p className="text-sm text-amber-200/60">{personnel.phone}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-amber-200/60">Status:</span>
                              <Badge className={personnel.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                                {personnel.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-amber-200/60">Rating:</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-xs text-amber-200">{personnel.rating || 0}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-amber-200/60">Deliveries:</span>
                              <span className="text-xs text-amber-200">{personnel.totalDeliveries || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Order Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-black/80 backdrop-blur-xl border border-amber-500/20 text-amber-50 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-amber-500/20 pb-4 mb-4">
              <DialogTitle className="text-amber-200 text-xl">Order Details (ID: {selectedOrder?.id})</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="grid gap-6 py-4">
                {/* Customer Information */}
                <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/20">
                  <h3 className="text-lg font-semibold mb-4 text-amber-200 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-amber-300 text-sm">Customer Name</Label>
                      <Input defaultValue={selectedOrder.customerName} readOnly className="bg-black/30 border-amber-500/20 text-amber-100 mt-1" />
                    </div>
                    <div>
                      <Label className="text-amber-300 text-sm">Phone</Label>
                      <Input defaultValue={selectedOrder.customerPhone} readOnly className="bg-black/30 border-amber-500/20 text-amber-100 mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-amber-300 text-sm">Address</Label>
                      <Textarea defaultValue={selectedOrder.shippingAddress} readOnly rows={2} className="bg-black/30 border-amber-500/20 text-amber-100 mt-1" />
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
                  <h3 className="text-lg font-semibold mb-4 text-blue-200 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Order Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-blue-300 text-sm">Total Amount</Label>
                      <Input defaultValue={`$${parseFloat(selectedOrder.total).toFixed(2)}`} readOnly className="bg-black/30 border-blue-500/20 text-blue-100 mt-1" />
                    </div>
                    <div>
                      <Label className="text-blue-300 text-sm">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                    </div>
                    <div>
                      <Label className="text-blue-300 text-sm">Created At</Label>
                      <Input defaultValue={format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')} readOnly className="bg-black/30 border-blue-500/20 text-blue-100 mt-1" />
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/20">
                  <h3 className="text-lg font-semibold mb-4 text-green-200 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Items
                  </h3>
                  <Table className="border border-green-500/20">
                    <TableHeader>
                      <TableRow className="bg-green-500/10 hover:bg-green-500/15 border-green-500/20">
                        <TableHead className="text-green-300">Product</TableHead>
                        <TableHead className="text-green-300">Quantity</TableHead>
                        <TableHead className="text-green-300">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map(item => (
                        <TableRow key={item.id} className="hover:bg-green-500/5 border-green-500/10">
                          <TableCell className="font-medium text-green-100">{item.product.name}</TableCell>
                          <TableCell className="text-green-200">{item.quantity}</TableCell>
                          <TableCell className="text-green-100">${parseFloat(item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Delivery Management */}
                <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-lg font-semibold mb-4 text-purple-200 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Management
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-purple-300 text-sm">Current Status</Label>
                      <Select
                        value={selectedOrder.status}
                        onValueChange={(value) => handleStatusUpdate(value)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="bg-black/30 border-purple-500/20 text-purple-100 mt-1">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/70 border-purple-500/20 text-purple-50">
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered_paid">Delivered & Paid</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedOrder.status === 'delivered_paid' && (
                      <div>
                        <Label className="text-purple-300 text-sm">Cash Collected</Label>
                        <Input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          placeholder="Enter collected amount"
                          className="bg-black/30 border-purple-500/20 text-purple-100 mt-1"
                        />
                      </div>
                    )}
                  </div>

                  {selectedOrder.status !== 'delivered_paid' && selectedOrder.status !== 'cancelled' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-purple-300 text-sm">Assign Delivery Personnel</Label>
                          <Select
                            value={selectedDeliveryPersonnel}
                            onValueChange={setSelectedDeliveryPersonnel}
                            disabled={assignDeliveryMutation.isPending || !deliveryPersonnel}
                          >
                            <SelectTrigger className="bg-black/30 border-purple-500/20 text-purple-100 mt-1">
                              <SelectValue placeholder="Select Personnel" />
                            </SelectTrigger>
                            <SelectContent className="bg-black/70 border-purple-500/20 text-purple-50">
                              {deliveryPersonnel?.map(personnel => (
                                <SelectItem key={personnel.id} value={personnel.id.toString()}>
                                                                  <div className="flex items-center gap-2">
                                  {getVehicleIcon(personnel.vehicleInfo || '')}
                                  <span>{personnel.name}</span>
                                    <Badge className="ml-auto bg-amber-500/20 text-amber-300">
                                      {personnel.rating || 0}★
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-purple-300 text-sm">Delivery Date</Label>
                          <Input 
                            type="datetime-local" 
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            className="bg-black/30 border-purple-500/20 text-purple-100 mt-1"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAssignDelivery} 
                          disabled={!selectedDeliveryPersonnel || !deliveryDate || assignDeliveryMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Assign Selected Personnel
                        </Button>
                        <Button 
                          onClick={handleSmartAssignDelivery} 
                          disabled={assignDeliveryMutation.isPending || !deliveryPersonnel || deliveryPersonnel.length === 0}
                          className="bg-amber-600 hover:bg-amber-700 text-white flex-1"
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Smart Assign (Best Available)
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.deliveryPersonnel && (
                    <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      <h4 className="font-medium text-purple-200 mb-2">Assigned Personnel</h4>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          {getVehicleIcon(selectedOrder.deliveryPersonnel.vehicleInfo || '')}
                        </div>
                        <div>
                          <p className="font-medium text-white">{selectedOrder.deliveryPersonnel.name}</p>
                          <p className="text-sm text-purple-200/60">{selectedOrder.deliveryPersonnel.phone}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6 border-t border-amber-500/20 pt-4">
              {selectedOrder?.status === 'out_for_delivery' && (
                <Button 
                  onClick={() => handleStatusUpdate('delivered_paid')} 
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Delivered & Paid
                </Button>
              )}
              {selectedOrder?.status !== 'cancelled' && selectedOrder?.status !== 'delivered_paid' && (
                <Button 
                  onClick={() => handleStatusUpdate('cancelled')} 
                  disabled={updateStatusMutation.isPending}
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Cancel Order
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}