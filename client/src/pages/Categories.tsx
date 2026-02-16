import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryAPI } from '@/services/api';
import type { Category } from '@/types';
import { ArrowUpRight } from 'lucide-react';

type CategoryView = Category & {
  isActive?: boolean;
  order?: number;
};

const getCategoryImage = (category: CategoryView) => {
  const raw = (category as unknown as { image?: unknown }).image;
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as { url?: unknown; secure_url?: unknown };
    if (typeof obj.url === 'string' && obj.url.trim()) return obj.url;
    if (typeof obj.secure_url === 'string' && obj.secure_url.trim()) return obj.secure_url;
  }
  return 'https://via.placeholder.com/600x400?text=Category';
};

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        setCategories(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f8ff] py-10">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-orange-50 p-6 md:p-10 mb-8">
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-rose-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="relative">
            <p className="inline-flex items-center rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs font-medium text-rose-700">
              Curated Collections
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
              Explore Saree Categories
            </h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Discover timeless weaves and modern drapes. Pick a category and jump directly into its collection.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-rose-100">
            <p className="text-gray-600">No categories found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/shop?category=${category._id}`}
                className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)] "
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-90" />

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="mb-2 inline-flex items-center rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    Shop now
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-lg leading-tight text-white">
                        {category.name}
                      </h2>
                      {category.description ? (
                        <p className="text-xs text-white/85 mt-1 line-clamp-2">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-rose-700 transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
