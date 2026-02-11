import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { categoryAPI, productAPI } from '@/services/api';
import type { Category, Product } from '@/types';
import { ArrowRight, Headphones, Shield, ShoppingBag, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Marquee from "react-fast-marquee";

import banner1 from "../assests/banner1.png";
import banner2 from "../assests/banner2.jpeg";
import banner3 from "../assests/banner3.png";

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
      description: 'Free delivery on orders above ₹999',
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: '100% secure payment with Razorpay',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Dedicated support team',
    },
    {
      icon: ShoppingBag,
      title: 'Easy Returns',
      description: '7-day easy return policy',
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
      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
        i === current ? "opacity-100" : "opacity-0"
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
      <section className=" py-8 bg-[#f8f8ff] px-5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section> <hr />

      {/* Features Section */}
      <section className="py-16 bg-[#f8f8ff] px-5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-gray-600">Explore our wide range of traditional sarees</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category._id}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl aspect-square">
                  <img
                    src={category.image || 'https://via.placeholder.com/300'}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <span className="text-white font-semibold">{category.name}</span>
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
              <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked sarees just for you</p>
            </div>
            <Link to="/shop">
              <Button variant="outline">
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
  return (
    <Link to={`/product/${product._id}`} className="group">
      <div className="bg-[#f8f8ff] rounded-sm overflow-hidden shadow-sm hover:shadow-sm transition-shadow">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={product.images[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
          {product.discount && product.discount > 0 && (
            <div className="absolute top-3 left-3 bg-primary-burgundy text-white px-3 py-1 rounded-full text-sm font-medium">
              {product.discount}% OFF
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
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
      </div>
    </Link>
  );
};

export default Home;
