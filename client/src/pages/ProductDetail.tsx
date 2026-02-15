import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { productAPI, wishlistAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';
import payment_1 from '../assests/payment_1.png';
import payment_2 from '../assests/Payment_2.png';
import payment_3 from '../assests/Payment_3.png';
import payment_4 from '../assests/Payment_4.png';




const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const productImages = product?.images?.length
    ? product.images
    : ['https://via.placeholder.com/600'];

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getById(id!);
      setProduct(response.data);
      setSelectedImage(0);

      // Fetch related products from same category
      if (response.data.category) {
        const relatedRes = await productAPI.getByCategory(
          typeof response.data.category === 'string'
            ? response.data.category
            : response.data.category._id
        );
        setRelatedProducts(
          relatedRes.data.products.filter((p: Product) => p._id !== id).slice(0, 4)
        );
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      toast.success('Added to cart!');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      navigate('/checkout');
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      if (isInWishlist) {
        await wishlistAPI.remove(product!._id);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product!._id);
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] py-4">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl h-96 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              <div className="h-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8f8ff] py-16 text-center">
        <p className="text-gray-500 text-lg">Product not found</p>
        <Button className="mt-4" onClick={() => navigate('/shop')}>
          Back to Shop
        </Button>
      </div>
    );
  }
  const originalPrice = Number(product.originalPrice || 0);
  const offerPrice = Number(product.price || 0);
  const fallbackDiscount =
    originalPrice > offerPrice && offerPrice > 0
      ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
      : 0;
  const displayDiscount = (product.discount ?? 0) > 0 ? (product.discount ?? 0) : fallbackDiscount;
  const hasOffer = originalPrice > offerPrice && displayDiscount > 0;
  return (
    <div className="min-h-screen bg-[#f8f8ff] py-4">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-6">
          <span className="cursor-pointer hover:text-rose-600" onClick={() => navigate('/')}>Home</span>
          {' / '}
          <span className="cursor-pointer hover:text-rose-600" onClick={() => navigate('/shop')}>Shop</span>
          {' / '}
          <span className="text-gray-900">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 items-start">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="hidden sm:flex flex-col gap-2 shrink-0">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-rose-600' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </button>
                ))}
              </div>
              <div className="bg-[#f8f8ff] rounded-sm overflow-hidden w-full flex items-center justify-center max-h-[550px] md:max-h-[650px] lg:max-h-[700px] cursor-pointer">
                <img
                  src={productImages[selectedImage] || productImages[0]}
                  alt={product.name}
                  className="max-h-full w-auto object-contain"
                />
              </div>

            </div>
            {productImages.length > 1 && (
              <div className="sm:hidden flex gap-2 overflow-x-auto">
                {productImages.map((image, index) => (
                  <button
                    key={`mobile-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 ${selectedImage === index ? 'border-rose-600' : 'border-transparent'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            {productImages.length > 1 && (
              <div className="hidden sm:block text-xs text-gray-500">
                {selectedImage + 1} / {productImages.length}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < Math.floor(product.ratings.average)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                        }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-500">
                    ({product.ratings.count} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-[#800020]">
                ₹{product.price.toLocaleString()}
              </span>
              {hasOffer && (
                <>
                  <span className="text-3xl text-[#800020] opacity-60 line-through">
                    ₹{originalPrice.toLocaleString()}
                  </span>
                  <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-sm font-medium">
                    {displayDiscount}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600">{product.description}</p>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-y">
              <div>
                <span className="text-gray-500">Fabric:</span>
                <span className="ml-2 font-medium">{product.fabric}</span>
              </div>
              <div>
                <span className="text-gray-500">Color:</span>
                <span className="ml-2 font-medium">{product.color}</span>
              </div>
              <div>
                <span className="text-gray-500">SKU:</span>
                <span className="ml-2 font-medium">{product.sku}</span>
              </div>
              <div>
                <span className="text-gray-500">Stock:</span>
                <span className={`ml-2 font-medium ${product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-2 hover:bg-gray-100"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 flex-col md:flex-row ">
              <Button
                size="lg"
                className=" bg-primary-burgundy hover:bg-black text-white"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="mr-2" />
                Add to Cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="sm:py-5 lg:flex-1"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={toggleWishlist}
                className="absolute right-5 top-36 lg:relative lg:right-auto lg:top-auto"
              >
                <Heart
                  className={`h-5 w-5 ${isInWishlist ? 'fill-rose-600 text-rose-600' : ''
                    }`}
                />
              </Button>

            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-5 w-5 text-rose-600" />
                Free Shipping
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-rose-600" />
                Secure Payment
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RotateCcw className="h-5 w-5 text-rose-600" />
                Easy Returns
              </div>
            </div>
            {/* Secure Payment Section */}
            <div className="border rounded-xl p-4 bg-gray-50">

              {/* Title */}
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-800">Secure Payments</span>
              </div>

              {/* Payment Icons */}
              <div className="flex items-center justify-around flex-wrap">
                <img src={payment_1} alt="UPI" className="w-14 h-12 object-contain" />
                <img src={payment_2} alt="Visa" className="w-14 h-12 object-contain" />
                <img src={payment_3} alt="Mastercard" className="w-14 h-12 object-contain" />
                <img src={payment_4} alt="RuPay" className="w-14 h-12 object-contain" />
              </div>

              {/* Safety note */}
              <p className="text-xs text-gray-500 mt-3">
                100% secure payments.
              </p>

            </div>

          </div>





        </div>
        {/* Products Tab */}
        <div className="mb-16 container sm:px-0 md:px-4">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="bg-white p-6 rounded-xl">
              <p className="text-gray-600">{product.description}</p>
            </TabsContent>
            <TabsContent value="details" className="bg-white p-6 rounded-xl">
              <div className="grid md:grid-cols1 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Product Information</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 text-gray-500">Fabric</td>
                        <td className="py-2">{product.fabric}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-gray-500">Color</td>
                        <td className="py-2">{product.color}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-gray-500">Work</td>
                        <td className="py-2">{product.work || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 text-gray-500">Occasion</td>
                        <td className="py-2">{product.occasion?.join(', ') || 'All'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="bg-white p-6 rounded-xl">
              {product.reviews?.length === 0 ? (
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {product.reviews?.map((review, index) => (
                    <div key={index} className="border-b pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={product.images[0] || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold truncate">{product.name}</h3>
                    <p className="text-rose-600 font-bold mt-1">
                      ₹{product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;


