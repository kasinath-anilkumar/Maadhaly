import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { productAPI, categoryAPI } from '@/services/api';
import type { Product, Category } from '@/types';

const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || ''
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('-createdAt');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  const fabrics = ['Silk', 'Cotton', 'Linen', 'Chiffon', 'Georgette', 'Banarasi'];
  const occasions = ['Wedding', 'Party', 'Festive', 'Casual', 'Formal', 'Traditional'];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [selectedCategory, sortBy, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortBy,
      };
      
      if (selectedCategory) params.category = selectedCategory;
      if (priceRange[0] > 0) params.minPrice = priceRange[0];
      if (priceRange[1] < 50000) params.maxPrice = priceRange[1];
      if (selectedFabrics.length) params.fabric = selectedFabrics.join(',');
      if (selectedOccasions.length) params.occasion = selectedOccasions.join(',');
      if (searchQuery) params.search = searchQuery;

      const response = await productAPI.getAll(params);
      setProducts(response.data.products);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 50000]);
    setSelectedFabrics([]);
    setSelectedOccasions([]);
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#f8f8ff] py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">All Sarees</h1>
            <p className="text-gray-500 mt-1">
              Showing {products.length} of {pagination.total} products
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Search sarees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64"
            />
            <Button type="submit" variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 ">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'} border rounded-sm`}>
            <div className="bg-[#f8f8ff] rounded-sm shadow-sm p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="font-medium mb-3">Categories</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedCategory === category._id}
                        onCheckedChange={() => setSelectedCategory(
                          selectedCategory === category._id ? '' : category._id
                        )}
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-medium mb-3">Price Range</h4>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  max={50000}
                  step={1000}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Fabric */}
              <div>
                <h4 className="font-medium mb-3">Fabric</h4>
                <div className="space-y-2">
                  {fabrics.map((fabric) => (
                    <label key={fabric} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedFabrics.includes(fabric)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedFabrics([...selectedFabrics, fabric]);
                          } else {
                            setSelectedFabrics(selectedFabrics.filter((f) => f !== fabric));
                          }
                        }}
                      />
                      <span className="text-sm">{fabric}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div>
                <h4 className="font-medium mb-3">Occasion</h4>
                <div className="space-y-2">
                  {occasions.map((occasion) => (
                    <label key={occasion} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedOccasions.includes(occasion)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedOccasions([...selectedOccasions, occasion]);
                          } else {
                            setSelectedOccasions(selectedOccasions.filter((o) => o !== occasion));
                          }
                        }}
                      />
                      <span className="text-sm">{occasion}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 ">
            {/* Toolbar */}
            <div className="bg-[#f8f8ff] rounded-sm shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center gap-4 border">
              <Button
                variant="outline"
                className="lg:hidden "
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-createdAt">Newest First</SelectItem>
                  <SelectItem value="price">Price: Low to High</SelectItem>
                  <SelectItem value="-price">Price: High to Low</SelectItem>
                  <SelectItem value="-ratings.average">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-[#f8f8ff] rounded-sm h-96 animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No products found</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                  : 'grid-cols-1'
              }`}>
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {[...Array(pagination.pages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={pagination.page === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPagination({ ...pagination, page: i + 1 })}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard: React.FC<{ product: Product; viewMode: 'grid' | 'list' }> = ({
  product,
  viewMode,
}) => {
  if (viewMode === 'list') {
    return (
      <Link to={`/product/${product._id}`} className="group">
        <div className="bg-[#f8f8ff] rounded-sm overflow-hidden shadow-md hover:shadow-xl transition-shadow flex">
          <div className="w-48 h-48 flex-shrink-0 overflow-hidden">
            <img
              src={product.images[0] || 'https://via.placeholder.com/300'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-6 flex-1">
            <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
            <p className="text-gray-500 mb-2">{product.fabric}</p>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-rose-600">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-gray-400 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/product/${product._id}`} className="group">
      <div className="bg-[#f8f8ff] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={product.images[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.discount && product.discount > 0 && (
            <div className="absolute top-3 left-3 bg-rose-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {product.discount}% OFF
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 mb-2">{product.fabric}</p>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-rose-600">
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

export default Shop;
