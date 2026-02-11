import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { orderAPI } from '@/services/api';

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    try {
      await orderAPI.cancel(orderId, reason);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <Package className="h-24 w-24 mx-auto text-gray-300 mb-6" />
          <h1 className="text-3xl font-bold mb-4">No Orders Yet</h1>
          <p className="text-gray-500 mb-8">
            You haven't placed any orders yet. Start shopping to see your orders here.
          </p>
          <Link to="/shop">
            <Button className="bg-rose-600 hover:bg-rose-700">Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order._id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <Badge className={getStatusColor(order.orderStatus)}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {order.orderItems.length} item(s) • ₹{order.totalPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Order ID</span>
                            <span>{order._id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <Badge className={getStatusColor(order.orderStatus)}>
                              {order.orderStatus}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status</span>
                            <span className="capitalize">{order.paymentInfo?.status}</span>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Items</h4>
                            {order.orderItems.map((item: any, index: number) => (
                              <div key={index} className="flex gap-4 mb-4">
                                <img
                                  src={item.image || 'https://via.placeholder.com/60'}
                                  alt={item.name}
                                  className="w-16 h-20 object-cover rounded"
                                />
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                                  <p className="text-rose-600">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Order Summary</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{order.itemsPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>₹{order.shippingPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tax</span>
                                <span>₹{order.taxPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>Total</span>
                                <span className="text-rose-600">
                                  ₹{order.totalPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Shipping Address</h4>
                            <p className="text-gray-600 text-sm">
                              {order.shippingAddress?.street}
                              <br />
                              {order.shippingAddress?.city}, {order.shippingAddress?.state}
                              <br />
                              {order.shippingAddress?.pincode}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {['pending', 'processing'].includes(order.orderStatus) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => {
                          const reason = prompt('Please enter cancellation reason:');
                          if (reason) handleCancelOrder(order._id, reason);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
