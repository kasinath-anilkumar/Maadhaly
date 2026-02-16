import { orderAPI } from '@/services/api';
import { Download, Eye, Printer, Settings2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type OrderType = {
  _id: string;
  createdAt: string;
  orderStatus: string;
  totalPrice: number;
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  paymentInfo?: { status?: string };
  contactInfo?: { name?: string; email?: string; phone?: string };
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  orderItems?: Array<{
    product?: {
      _id?: string;
      sku?: string;
      name?: string;
    };
    name: string;
    image?: string;
    price: number;
    quantity: number;
    sku?: string;
    variantTitle?: string;
  }>;
};

type LabelConfig = {
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  brandName: string;
};

const LABEL_CONFIG_STORAGE_KEY = 'admin_label_config_v1';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');

const printHtmlDocument = (title: string, body: string) => {
  const win = window.open('', '_blank', 'width=1024,height=800');
  if (!win) {
    toast.error('Please allow popups to print documents');
    return;
  }

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: "Noto Sans", Arial, sans-serif; margin: 0; padding: 16px; background: #fff; color: #000; }
  .page { border: 1px solid #000; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .page-break { page-break-after: always; }
  .header { text-align: center; margin-bottom: 20px; }
  .header h1 { margin: 0 0 10px 0; font-size: 32px; font-weight: 700; }
  .header p { margin: 0; font-size: 18px; }
  .address-section { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 20px; }
  .address-box { width: 48%; border: 1px solid #000; padding: 12px; border-radius: 6px; background: #fff; }
  .address-box h3 { margin: 0 0 8px 0; font-size: 18px; border-bottom: 2px solid #000; padding-bottom: 4px; font-weight: 700; text-transform: uppercase; }
  .address-box p { margin: 4px 0; font-size: 16px; line-height: 1.4; }
  .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; text-align: left; }
  .items-table thead { background: #f2f2f2; }
  .items-table th, .items-table td { border-bottom: 1px solid #000; padding: 10px 12px; }
  .items-table th { font-weight: 700; text-transform: uppercase; font-size: 14px; }
  .col-item { width: 55%; }
  .col-sku { width: 20%; text-align: center; }
  .col-qty { width: 15%; text-align: center; }
  .shipping-info { margin-top: 15px; font-size: 16px; font-weight: 700; }
  .footer { text-align: center; margin-top: 30px; }
  .footer .thank-you { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
  .footer .store-details { font-size: 14px; }
</style>
</head>
<body>${body}</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};

const downloadHtmlFile = (filename: string, body: string, title: string) => {
  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title></head><body>${body}</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const renderPackingSlip = (order: OrderType, config: LabelConfig) => {
  const customer = order.contactInfo || {};
  const address = order.shippingAddress || {};
  const items = order.orderItems || [];
  const shippingType = Number(order.shippingPrice || 0) > 0 ? 'Express' : 'Standard';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const itemRows =
    items
    .map(
      (item) => {
        const resolvedSku = item.sku || item.product?.sku || '-';
        return `<tr>
        <td class="col-item">
          <strong>${escapeHtml(item.name)}</strong>
          ${item.variantTitle ? `<br><span style="font-size: 18px;">${escapeHtml(item.variantTitle)}</span>` : ''}
        </td>
        <td class="col-sku">${escapeHtml(resolvedSku)}</td>
        <td class="col-qty">${escapeHtml(item.quantity)}</td>
      </tr>`;
      }
    )
    .join('') || '<tr><td colspan="3">No items</td></tr>';

  return `
  <section class="page page-break">
    <div class="header">
      <h1>${escapeHtml(config.brandName)}</h1>
      <p>Order: #${escapeHtml(order._id.slice(-8).toUpperCase())} | Date: ${escapeHtml(orderDate)}</p>
    </div>

    <div class="address-section">
      <div class="address-box">
        <h3>Ship To</h3>
        <p><strong>${escapeHtml(customer.name || 'N/A')}</strong></p>
        <p>${escapeHtml(address.street || '')}</p>
        <p>${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.pincode || '')}</p>
        <p>${escapeHtml(address.country || 'India')}</p>
        <p>${escapeHtml(customer.phone || '')}</p>
      </div>
      <div class="address-box">
        <h3>Return To</h3>
        <p><strong>${escapeHtml(config.brandName)}</strong></p>
        <p>${escapeHtml(config.senderAddress)}</p>
        <p>India</p>
        <p>${escapeHtml(config.senderPhone)}</p>
        <p>${escapeHtml(config.senderEmail)}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="col-item">Item</th>
          <th class="col-sku">SKU</th>
          <th class="col-qty">Qty</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="shipping-info">
      <p><strong>Shipping:</strong> ${escapeHtml(shippingType)}</p>
    </div>

    <div class="footer">
      <p class="thank-you">Thank you for shopping with us!</p>
      <p class="store-details">
        <strong>${escapeHtml(config.brandName)}</strong><br>
        ${escapeHtml(config.senderAddress)}<br>
        ${escapeHtml(config.senderEmail)} | ${escapeHtml(window.location.hostname)}
      </p>
    </div>
  </section>`;
};

const renderLabel = (order: OrderType, config: LabelConfig) => renderPackingSlip(order, config);
const renderReceipt = (order: OrderType, brandName: string, config: LabelConfig) =>
  renderPackingSlip(order, { ...config, brandName });

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showLabelSettings, setShowLabelSettings] = useState(false);
  const [labelConfig, setLabelConfig] = useState<LabelConfig>({
    senderName: 'Maadhaly Fulfillment',
    senderAddress: 'Warehouse Address, City, State, PIN',
    senderPhone: '+91 00000 00000',
    senderEmail: 'support@maadhaly.com',
    brandName: 'Maadhaly',
  });

  useEffect(() => {
    try {
      const storedLabelConfig = localStorage.getItem(LABEL_CONFIG_STORAGE_KEY);
      if (storedLabelConfig) {
        const parsed = JSON.parse(storedLabelConfig);
        setLabelConfig((prev) => ({ ...prev, ...parsed }));
      }

    } catch {
      // Ignore malformed local settings and keep defaults.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LABEL_CONFIG_STORAGE_KEY, JSON.stringify(labelConfig));
  }, [labelConfig]);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await orderAPI.getAll(params);
      setOrders(response.data.orders || []);
      setSelectedOrderIds([]);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus, `Status updated to ${newStatus}`);
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update status');
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

  const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order._id)),
    [orders, selectedOrderIds]
  );

  const allVisibleSelected = orders.length > 0 && selectedOrderIds.length === orders.length;

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedOrderIds(allVisibleSelected ? [] : orders.map((order) => order._id));
  };

  const handlePrintLabel = (order: OrderType) => {
    const content = renderLabel(order, labelConfig);
    printHtmlDocument(`Label-${order._id.slice(-8)}`, content);
  };

  const handlePrintReceipt = (order: OrderType) => {
    const content = renderReceipt(order, labelConfig.brandName, labelConfig);
    printHtmlDocument(`Receipt-${order._id.slice(-8)}`, content);
  };

  const handleDownloadReceipt = (order: OrderType) => {
    const content = renderReceipt(order, labelConfig.brandName, labelConfig);
    const fileName = `receipt-${order._id.slice(-8).toUpperCase()}.html`;
    downloadHtmlFile(fileName, content, `Receipt ${order._id}`);
  };

  const handleBulkPrintLabels = () => {
    if (selectedOrders.length === 0) {
      toast.error('Select at least one order');
      return;
    }
    const content = selectedOrders.map((order) => renderLabel(order, labelConfig)).join('');
    printHtmlDocument('Shipping Labels', content);
  };

  const handleBulkPrintReceipts = () => {
    if (selectedOrders.length === 0) {
      toast.error('Select at least one order');
      return;
    }
    const content = selectedOrders
      .map((order) => renderReceipt(order, labelConfig.brandName, labelConfig))
      .join('');
    printHtmlDocument('Order Receipts', content);
  };

  const handleBulkDownloadReceipts = () => {
    if (selectedOrders.length === 0) {
      toast.error('Select at least one order');
      return;
    }
    const content = selectedOrders
      .map((order) => renderReceipt(order, labelConfig.brandName, labelConfig))
      .join('');
    const fileName = `receipts-${new Date().toISOString().slice(0, 10)}.html`;
    downloadHtmlFile(fileName, content, 'Bulk Receipts');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowLabelSettings((prev) => !prev)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Label Settings
          </button>
        </div>
      </div>

      {showLabelSettings && (
        <div className="bg-white rounded-xl shadow-sm p-4 grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Brand Name</label>
            <input
              value={labelConfig.brandName}
              onChange={(e) => setLabelConfig((prev) => ({ ...prev, brandName: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Sender Name</label>
            <input
              value={labelConfig.senderName}
              onChange={(e) => setLabelConfig((prev) => ({ ...prev, senderName: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Sender Address</label>
            <input
              value={labelConfig.senderAddress}
              onChange={(e) => setLabelConfig((prev) => ({ ...prev, senderAddress: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Sender Phone</label>
            <input
              value={labelConfig.senderPhone}
              onChange={(e) => setLabelConfig((prev) => ({ ...prev, senderPhone: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Sender Email</label>
            <input
              value={labelConfig.senderEmail}
              onChange={(e) => setLabelConfig((prev) => ({ ...prev, senderEmail: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">Selected: {selectedOrders.length}</span>
        <button
          onClick={handleBulkPrintLabels}
          className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Labels
        </button>
        <button
          onClick={handleBulkPrintReceipts}
          className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Receipts
        </button>
        <button
          onClick={handleBulkDownloadReceipts}
          className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Receipts
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
              </th>
              <th className="text-left py-3 px-4">Order ID</th>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Amount</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Payment</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-t">
                <td className="py-3 px-4">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order._id)}
                    onChange={() => toggleOrderSelection(order._id)}
                  />
                </td>
                <td className="py-3 px-4 font-medium">#{order._id.slice(-8).toUpperCase()}</td>
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium">{order.contactInfo?.name}</p>
                    <p className="text-sm text-gray-500">{order.contactInfo?.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="py-3 px-4 font-medium">{formatCurrency(order.totalPrice)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      order.paymentInfo?.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.paymentInfo?.status || 'pending'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePrintLabel(order)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Print delivery label"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadReceipt(order)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                      title="Download receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Order #{selectedOrder._id.slice(-8).toUpperCase()}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintLabel(selectedOrder)}
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" /> Print Label
                </button>
                <button
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" /> Print Receipt
                </button>
                <button
                  onClick={() => handleDownloadReceipt(selectedOrder)}
                  className="px-3 py-2 rounded-lg border hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <Download className="h-4 w-4" /> Download Receipt
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <p className="font-medium capitalize">{selectedOrder.paymentInfo?.status}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <p><span className="text-gray-500">Name:</span> {selectedOrder.contactInfo?.name}</p>
                <p><span className="text-gray-500">Email:</span> {selectedOrder.contactInfo?.email}</p>
                <p><span className="text-gray-500">Phone:</span> {selectedOrder.contactInfo?.phone}</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p>{selectedOrder.shippingAddress?.street}</p>
                <p>
                  {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.orderItems?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image || 'https://via.placeholder.com/50'}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.itemsPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span>{formatCurrency(selectedOrder.shippingPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax</span>
                    <span>{formatCurrency(selectedOrder.taxPrice)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-rose-600">{formatCurrency(selectedOrder.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedOrder._id, status)}
                      disabled={selectedOrder.orderStatus === status}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedOrder.orderStatus === status
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-rose-600 text-white hover:bg-rose-700'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;

