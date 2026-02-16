import { categoryAPI, productAPI } from '@/services/api';
import { Edit2, MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: any;
  isActive: boolean;
  images: string[];
  description?: string;
  originalPrice?: number;
  fabric?: string;
  color?: string;
  sku?: string;
  isFeatured?: boolean;
  reviews?: ReviewItem[];
}

interface ReviewItem {
  _id: string;
  title?: string;
  comment: string;
  rating: number;
  verifiedPurchase?: boolean;
  createdAt: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: '',
    fabric: '',
    color: '',
    sku: '',
    isFeatured: false,
  });
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);

  const imagePreviews = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images]
  );
  const offerPrice = Number(formData.price || 0);
  const originalPrice = Number(formData.originalPrice || 0);
  const computedDiscount =
    originalPrice > offerPrice && offerPrice > 0
      ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
      : 0;

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll();
      setProducts(response.data.products);
    } catch (error) {
      toast.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    setImages((prev) => [...prev, ...selectedFiles]);
    // Allow picking the same file again if user removed it from preview
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('data', JSON.stringify({
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        stock: Number(formData.stock),
        isFeatured: Boolean(formData.isFeatured),
        keepImages: editingProduct ? existingImages : undefined,
      }));
      
      images.forEach((image) => data.append('images', image));

      if (editingProduct) {
        await productAPI.update(editingProduct._id, data);
        toast.success('Product updated successfully');
      } else {
        await productAPI.create(data);
        toast.success('Product created successfully');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice || '',
      stock: product.stock,
      category: typeof product.category === 'string' ? product.category : product.category?._id,
      fabric: product.fabric || '',
      color: product.color || '',
      sku: product.sku || '',
      isFeatured: Boolean(product.isFeatured),
    });
    setExistingImages(product.images || []);
    setImages([]);
    setShowModal(true);
  };

  const handleManageReviews = async (product: Product) => {
    try {
      const response = await productAPI.getById(product._id);
      setReviewProduct(response.data);
      setShowReviewModal(true);
    } catch (error) {
      toast.error('Failed to load product reviews');
    }
  };

  const handleDeleteReview = async (productId: string, reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await productAPI.deleteReview(productId, reviewId);
      toast.success('Review deleted successfully');
      const response = await productAPI.getById(productId);
      setReviewProduct(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      stock: '',
      category: '',
      fabric: '',
      color: '',
      sku: '',
      isFeatured: false,
    });
    setImages([]);
    setExistingImages([]);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-rose-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-rose-700"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Product</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Price</th>
              <th className="text-left py-3 px-4">Stock</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id} className="border-t">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/50'}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <span className="font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {typeof product.category === 'string'
                    ? categories.find((c) => c._id === product.category)?.name || 'N/A'
                    : product.category?.name || 'N/A'}
                </td>
                <td className="py-3 px-4">₹{product.price?.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className={`${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleManageReviews(product)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Manage reviews"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Offer Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(formData.isFeatured)}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
                Mark as Featured Product
              </label>
              {computedDiscount > 0 && (
                <p className="text-sm text-green-700">
                  Calculated discount: {computedDiscount}% OFF
                </p>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fabric</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelection}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add one or more images as needed
                </p>
                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {existingImages.map((image, index) => (
                      <div key={`existing-${index}`} className="relative">
                        <img
                          src={image}
                          alt={`Existing ${index + 1}`}
                          className="w-16 h-16 rounded border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black text-white text-xs"
                          aria-label="Remove existing image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {imagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-16 h-16 rounded border object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black text-white text-xs"
                          aria-label="Remove new image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  {editingProduct ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && reviewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Reviews: {reviewProduct.name}
              </h2>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setReviewProduct(null);
                }}
                className="px-3 py-1 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(reviewProduct.reviews || []).length === 0 ? (
                <p className="text-gray-500">No reviews available for this product.</p>
              ) : (
                (reviewProduct.reviews || []).map((review) => (
                  <div key={review._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {review.user?.name || 'Customer'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleString()}
                        </div>
                        <div className="text-sm mt-1">
                          Rating: <span className="font-medium">{review.rating}/5</span>
                        </div>
                        {review.verifiedPurchase && (
                          <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Verified Customer
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteReview(reviewProduct._id, review._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-medium mt-3">{review.title || 'Review'}</p>
                    <p className="text-gray-700 mt-1">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
