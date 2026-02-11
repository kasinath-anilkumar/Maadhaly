import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { orderAPI } from '@/services/api';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getById(orderId!);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 text-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600">
            Thank you for your purchase. Your order has been confirmed.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order Details</h2>
              <span className="text-gray-500">#{order?._id?.slice(-8).toUpperCase()}</span>
            </div>

            <div className="space-y-4">
              {order?.orderItems?.map((item: any, index: number) => (
                <div key={index} className="flex gap-4">
                  <img
                    src={item.image || 'https://via.placeholder.com/80'}
                    alt={item.name}
                    className="w-20 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-gray-500 text-sm">Qty: {item.quantity}</p>
                    <p className="text-rose-600 font-medium">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order?.itemsPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>₹{order?.shippingPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>₹{order?.taxPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-rose-600">₹{order?.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Tracking */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Status</h2>
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">Confirmed</p>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-2" />
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Processing</p>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-2" />
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Truck className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Shipped</p>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-2" />
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Home className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <p className="text-gray-600">
              {order?.shippingAddress?.street}
              <br />
              {order?.shippingAddress?.city}, {order?.shippingAddress?.state}
              <br />
              {order?.shippingAddress?.pincode}
              <br />
              {order?.shippingAddress?.country}
            </p>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Link to="/shop">
            <Button variant="outline">Continue Shopping</Button>
          </Link>
          <Link to="/orders">
            <Button className="bg-rose-600 hover:bg-rose-700">View My Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
