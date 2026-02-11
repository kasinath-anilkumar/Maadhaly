import { dashboardAPI } from '@/services/api';
import { IndianRupee, Package, ShoppingBag, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats?.overview?.totalRevenue || 0,
      icon: IndianRupee,
      color: 'bg-green-500',
      prefix: '₹',
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Total Orders',
      value: stats?.overview?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'bg-blue-500',
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Total Products',
      value: stats?.overview?.totalProducts || 0,
      icon: Package,
      color: 'bg-purple-500',
      format: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Total Customers',
      value: stats?.overview?.totalUsers || 0,
      icon: Users,
      color: 'bg-orange-500',
      format: (v: number) => v.toLocaleString(),
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold mt-1">
                  {card.prefix}{card.format(card.value)}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Order ID</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Amount</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map((order: any) => (
                  <tr key={order._id} className="border-b">
                    <td className="py-3 text-sm">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="py-3 text-sm">{order.user?.name || 'N/A'}</td>
                    <td className="py-3 text-sm">₹{order.totalPrice?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.orderStatus === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Low Stock Alert</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Product</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">SKU</th>
                  <th className="text-left py-2 text-sm font-medium text-gray-500">Stock</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowStockProducts?.map((product: any) => (
                  <tr key={product._id} className="border-b">
                    <td className="py-3 text-sm">{product.name}</td>
                    <td className="py-3 text-sm">{product.sku}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock === 0 ? 'bg-red-100 text-red-800' :
                        product.stock < 5 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.stock} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Status Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mt-8">
        <h2 className="text-lg font-bold mb-4">Order Status Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stats?.ordersByStatus && Object.entries(stats.ordersByStatus).map(([status, count]: [string, any]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm text-gray-500 capitalize">{status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
