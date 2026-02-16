import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { wishlistAPI } from '@/services/api';
import type { Product } from '@/types';

const getBackendOrigin = () => {
  const fallback = 'http://localhost:5000/api';
  const apiBase = (import.meta.env.VITE_API_URL || fallback).replace(/\/+$/, '');
  return apiBase.replace(/\/api$/i, '');
};

const getProductImageUrl = (product: Product) => {
  const firstImage = Array.isArray(product.images) ? (product.images as unknown[])[0] : null;

  if (typeof firstImage === 'string') {
    if (/^https?:\/\//i.test(firstImage)) return firstImage;
    if (firstImage.startsWith('/')) return `${getBackendOrigin()}${firstImage}`;
    return firstImage;
  }

  if (
    firstImage &&
    typeof firstImage === 'object' &&
    'url' in firstImage &&
    typeof (firstImage as { url?: unknown }).url === 'string'
  ) {
    const url = (firstImage as { url: string }).url;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${getBackendOrigin()}${url}`;
    return url;
  }

  return 'https://via.placeholder.com/300';
};

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatPrice = (amount: number) => inrFormatter.format(amount);

const resolveFabric = (product: Product) => {
  const candidateValues: unknown[] = [
    product.fabric,
    (product as unknown as { material?: unknown }).material,
    (product as unknown as { fabricType?: unknown }).fabricType,
  ];

  for (const value of candidateValues) {
    if (typeof value === 'string') {
      const cleaned = value.trim();
      if (
        cleaned &&
        cleaned.toLowerCase() !== 'undefined' &&
        cleaned.toLowerCase() !== 'null'
      ) {
        return cleaned;
      }
    }

    if (value && typeof value === 'object' && 'name' in value) {
      const name = String((value as { name?: unknown }).name || '').trim();
      if (name) return name;
    }
  }

  return '';
};

type WishlistProductCardProps = {
  product: Product;
  onRemove: (productId: string) => void;
  onAddToCart: (product: Product) => void;
};

const WishlistProductCard: React.FC<WishlistProductCardProps> = ({
  product,
  onRemove,
  onAddToCart,
}) => {
  const originalPrice = Number(product.originalPrice || 0);
  const currentPrice = Number(product.price || 0);
  const fallbackDiscount =
    originalPrice > currentPrice && currentPrice > 0
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;
  const discount = (product.discount ?? 0) > 0 ? (product.discount ?? 0) : fallbackDiscount;
  const fabric = resolveFabric(product);
  const stockCount = Number(product.stock);
  const isOutOfStock = Number.isFinite(stockCount) && stockCount <= 0;

  return (
    <Link to={`/product/${product._id}`} className="group block h-full">
      <div className="h-full flex flex-col bg-[#f8f8ff] border border-gray-200 rounded-sm overflow-hidden transition-shadow hover:shadow-sm">
        <div className="relative h-[170px] overflow-hidden">
          <img
            src={getProductImageUrl(product)}
            alt={product.name}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />

          {discount > 0 && (
            <span className="absolute left-2 top-2 bg-primary-burgundy text-white px-1.5 py-0.5 rounded text-[10px] font-semibold">
              {discount}% OFF
            </span>
          )}

          <button
            type="button"
            aria-label={`Remove ${product.name} from wishlist`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove(product._id);
            }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </button>
        </div>

        <div className="p-2.5 flex flex-1 flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">{product.name}</h3>
          <p className="text-[11px] text-gray-500 truncate">{fabric}</p>

          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-primary-burgundy">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <Button
            className="mt-auto w-full h-8 text-xs bg-primary-burgundy hover:bg-black text-white"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Link>
  );
};

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/wishlist' } });
      return;
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.getAll();
      setWishlist(response.data);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await wishlistAPI.remove(productId);
      setWishlist((prev) => prev.filter((item) => item._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[270px] bg-[#f8f8ff] border border-gray-200 rounded-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <Heart className="h-24 w-24 mx-auto text-gray-300 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-gray-500 mb-8">
            Save your favorite sarees to your wishlist and find them easily later.
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
        <h1 className="text-3xl font-bold mb-8">My Wishlist ({wishlist.length})</h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {wishlist.map((product) => (
            <WishlistProductCard
              key={product._id}
              product={product}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
