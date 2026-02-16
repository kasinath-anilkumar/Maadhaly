import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { categoryAPI, productAPI, wishlistAPI } from '@/services/api';
import type { Category, Product } from '@/types';
import { ArrowRight, Headphones, Heart, Shield, ShoppingBag, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Marquee from "react-fast-marquee";
import { toast } from 'sonner';

import banner1 from "../assests/banner1.png";
import banner2 from "../assests/banner2.jpeg";
import banner3 from "../assests/banner3.png";

const getBackendOrigin = () => {
  const fallback = 'http://localhost:5000/api';
  const apiBase = (import.meta.env.VITE_API_URL || fallback).replace(/\/+$/, '');
  return apiBase.replace(/\/api$/i, '');
};

const extractCategoryImageCandidates = (category: Category) => {
  const origin = getBackendOrigin();
  const rawImage = (category as unknown as { image?: unknown }).image;

  let baseValue = '';
  if (typeof rawImage === 'string') {
    baseValue = rawImage;
  } else if (rawImage && typeof rawImage === 'object') {
    baseValue = String(
      (rawImage as { url?: unknown; secure_url?: unknown }).url ||
      (rawImage as { secure_url?: unknown }).secure_url ||
      ''
    );
  }

  const normalized = baseValue.trim().replace(/\\/g, '/');
  const candidates: string[] = [];

  if (normalized) {
    if (/^https?:\/\//i.test(normalized)) {
      candidates.push(normalized);
      try {
        const url = new URL(normalized);
        const path = url.pathname;
        if (path) {
          candidates.push(`${origin}${path.startsWith('/') ? path : `/${path}`}`);
          const fileName = path.split('/').pop() || '';
          if (fileName) candidates.push(`${origin}/uploads/categories/${fileName}`);
        }
      } catch {
        // ignore malformed absolute URLs and use other candidates
      }
    } else {
      const withSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
      candidates.push(`${origin}${withSlash}`);
      if (normalized.startsWith('uploads/')) candidates.push(`${origin}/${normalized}`);
      const fileName = normalized.split('/').pop() || '';
      if (fileName) candidates.push(`${origin}/uploads/categories/${fileName}`);
    }
  }

  candidates.push('https://via.placeholder.com/300');
  return [...new Set(candidates)];
};

const CategoryImage: React.FC<{ category: Category }> = ({ category }) => {
  const sources = extractCategoryImageCandidates(category);
  const [index, setIndex] = useState(0);

  return (
    <img
      src={sources[index] || 'https://via.placeholder.com/300'}
      alt={category.name}
      onError={() => {
        setIndex((current) => (current < sources.length - 1 ? current + 1 : current));
      }}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
    />
  );
};

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [featuredRes, newArrivalsRes, categoriesRes] = await Promise.all([
        productAPI.getFeatured().catch(() => ({ data: [] })),
        productAPI.getAll({ limit: 4, sort: '-createdAt' }),
        categoryAPI.getAll(),
      ]);
      setFeaturedProducts(featuredRes.data);
      setNewArrivals(newArrivalsRes.data.products || newArrivalsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Free delivery on All Orders.',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated support team',
    },
    {
      icon: ShoppingBag,
      title: 'Handpicked Quality',
      description: 'Only the best sarees for you',
    },
  ];


  // Carsoule

  const slides = [
    { img: banner1 },
    { img: banner2 },
    { img: banner3 },
  ];


  const [current, setCurrent] = useState(0);
  const duration = 5000;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, duration);

    return () => clearInterval(timer);
  }, []);


  return (
    <div className="min-h-screen pt-0">
      <section className="relative w-full h-[80dvh] overflow-hidden ">

        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === current ? "opacity-100" : "opacity-0"
              }`}
          >
            <img
              src={s.img}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Indicators with loader */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              className="w-8 h-[3px] bg-white/40 cursor-pointer overflow-hidden"
            >
              {i === current && (
                <div
                  className="h-full bg-[#7a1f3d] loader-bar"
                  style={{ animationDuration: `${duration}ms` }}
                />
              )}
            </div>
          ))}
        </div>

      </section>

      <hr />

      <section className="py-2 bg-[#f8f8ff]">
        <Marquee speed={60} pauseOnHover gradient={false}>
          <div className="mx-10">
            Flat <span className="font-bold">10% OFF</span> Use Coupon Code
            <span className="font-bold text-primary-burgundy"> MAADHALY10</span>
          </div>

          <div className="mx-10">
            Flat <span className="font-bold">10% OFF</span> Use Coupon Code
            <span className="font-bold text-primary-burgundy"> MAADHALY10</span>
          </div>
          <div className="mx-10">
            Flat <span className="font-bold">10% OFF</span> Use Coupon Code
            <span className="font-bold text-primary-burgundy"> MAADHALY10</span>
          </div>
          <div className="mx-10">
            Flat <span className="font-bold">10% OFF</span> Use Coupon Code
            <span className="font-bold text-primary-burgundy"> MAADHALY10</span>
          </div>
        </Marquee>


      </section> <hr />



      {/* New Arrivals Section */}
      <section className="py-8 bg-[#f8f8ff] px-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between mb-5">
            <div>
              <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
              <p className="text-gray-600">Discover our latest collection</p>
            </div>

            <Link to="/shop">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 py-5">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <hr />


      {/* Features Section */}
      <section className=" py-5 bg-[#f8f8ff] px-3">
        <div className="container mx-auto px-1">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-7 w-7 text-primary-burgundy" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> <hr />

      {/* Categories Section */}
      <section className="py-16 bg-[#f8f8ff] px-5">
  <div className="container mx-auto px-4">

    {/* Heading */}
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
      <p className="text-gray-600">
        Explore our wide range of traditional sarees
      </p>
    </div>

    {/* Grid */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {categories.map((category) => (
        <Link
          key={category._id}
          to={`/shop?category=${category._id}`}
          className="group"
        >
          <div className="relative overflow-hidden rounded-xl aspect-[4/5] shadow-sm hover:shadow-md transition-all duration-300">

            {/* Image */}
            <CategoryImage category={category} />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {/* Category name */}
            <div className="absolute bottom-3 left-3 right-3">
              <span className="text-white font-semibold text-sm md:text-base">
                {category.name}
              </span>
            </div>

          </div>
        </Link>
      ))}
    </div>

  </div>
</section> <hr />


      {/* Featured Products Section */}
      <section className="py-16 bg-[#f8f8ff] px-5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className=" sm:text-xl lg:text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-600 sm:text-lg lg:text-xl">Handpicked sarees just for you</p>
            </div>
            <Link to="/shop">
              <Button variant="outline" className='sm:w-5 sm:h-8 lg:w-full lg:h-full'>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No featured products available</p>
              </div>
            )}
          </div>
        </div>
      </section> <hr />



      {/* CTA Section */}
      <section className="py-20 bg-[#800020] px-5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Get 20% Off on Your First Order
          </h2>
          <p className="text-rose-100 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and receive exclusive offers, new arrivals,
            and styling tips directly in your inbox.
          </p>
          <div className="flex gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900"
            />
            <Button size="lg" variant="secondary">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};


// Product Card Component
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart');
  };

  const handleWishlistClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login', { state: { from: '/wishlist' } });
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistAPI.remove(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
        return;
      }

      await wishlistAPI.add(product._id);
      setIsWishlisted(true);
      toast.success('Added to wishlist');
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const discount = product.discount ?? 0;

  return (
    <div className="relative bg-[#f8f8ff] rounded-sm overflow-hidden border border-gray-200 hover:shadow-sm transition-shadow">
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:bg-white"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-primary-burgundy text-primary-burgundy' : 'text-primary-burgundy'}`} />
      </button>
      <Link to={`/product/${product._id}`} className="group block">
        
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={product.images[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {product.name}
            </h3>
            {discount > 0 && (
              <span className="bg-primary-burgundy text-white px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                {discount}% OFF
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mb-2">{product.fabric}</p>

          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary-burgundy">
              ₹{product.price.toLocaleString()}
            </span>

            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <Button
          className="w-full bg-primary-burgundy hover:bg-black text-white"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
};


export default Home;
