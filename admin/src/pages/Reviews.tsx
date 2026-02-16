import { productAPI, reviewAPI } from '@/services/api';
import { Search, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ReviewRow {
  reviewId: string;
  productId: string;
  productName: string;
  rating: number;
  title?: string;
  comment: string;
  verifiedPurchase?: boolean;
  createdAt: string;
  user?: {
    _id?: string;
    name?: string;
    email?: string;
  };
}

const flattenReviewsFromProducts = (products: any[]): ReviewRow[] => {
  const rows: ReviewRow[] = [];
  for (const product of products || []) {
    for (const review of product?.reviews || []) {
      rows.push({
        reviewId: String(review?._id || ''),
        productId: String(product?._id || ''),
        productName: String(product?.name || 'Product'),
        rating: Number(review?.rating || 0),
        title: review?.title || '',
        comment: String(review?.comment || ''),
        verifiedPurchase: Boolean(review?.verifiedPurchase),
        createdAt: String(review?.createdAt || new Date().toISOString()),
        user: review?.user
          ? {
              _id: review.user?._id,
              name: review.user?.name,
              email: review.user?.email,
            }
          : undefined,
      });
    }
  }
  return rows;
};

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [page, verifiedFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.getAll({
        page,
        limit: 20,
        search: search.trim() || undefined,
        verified: verifiedFilter === 'all' ? undefined : verifiedFilter,
      });
      setReviews(response.data.reviews || []);
      setPages(Math.max(1, Number(response.data?.pagination?.pages || 1)));
    } catch (error: any) {
      // Fallback for servers where /products/reviews/admin is not deployed yet.
      if (error?.response?.status === 404) {
        try {
          const productsResponse = await productAPI.getAll({
            page: 1,
            limit: 200,
            isActive: 'all',
          });
          let rows = flattenReviewsFromProducts(productsResponse.data?.products || []);

          if (verifiedFilter === 'true' || verifiedFilter === 'false') {
            const expected = verifiedFilter === 'true';
            rows = rows.filter((review) => Boolean(review.verifiedPurchase) === expected);
          }

          const needle = search.trim().toLowerCase();
          if (needle) {
            rows = rows.filter((review) => {
              const hay = [
                review.productName,
                review.title,
                review.comment,
                review.user?.name,
                review.user?.email,
              ]
                .map((value) => String(value || '').toLowerCase())
                .join(' ');
              return hay.includes(needle);
            });
          }

          rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const total = rows.length;
          const limitNumber = 20;
          const start = (page - 1) * limitNumber;
          const end = start + limitNumber;
          setReviews(rows.slice(start, end));
          setPages(Math.max(1, Math.ceil(total / limitNumber)));
          toast.warning('Using fallback reviews loader (backend reviews endpoint not deployed).');
          return;
        } catch (fallbackError: any) {
          toast.error(fallbackError?.response?.data?.message || 'Failed to load reviews');
          console.error('Fallback load reviews failed:', fallbackError);
          return;
        }
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to load reviews';
      toast.error(message);
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleDelete = async (productId: string, reviewId: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await reviewAPI.delete(productId, reviewId);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error: any) {
      // Fallback for servers where dedicated delete endpoint is not deployed yet.
      if (error?.response?.status === 404) {
        try {
          const productResponse = await productAPI.getById(productId);
          const product = productResponse.data;
          const currentReviews = Array.isArray(product?.reviews) ? product.reviews : [];
          const updatedReviews = currentReviews.filter(
            (review: any) => String(review?._id || '') !== String(reviewId)
          );

          const ratingsCount = updatedReviews.length;
          const ratingsAverage =
            ratingsCount > 0
              ? updatedReviews.reduce(
                  (sum: number, review: any) => sum + Number(review?.rating || 0),
                  0
                ) / ratingsCount
              : 0;

          const formData = new FormData();
          formData.append(
            'data',
            JSON.stringify({
              reviews: updatedReviews,
              ratings: {
                count: ratingsCount,
                average: ratingsAverage,
              },
            })
          );

          await productAPI.update(productId, formData);
          toast.success('Review deleted successfully');
          fetchReviews();
          return;
        } catch (fallbackError: any) {
          toast.error(
            fallbackError?.response?.data?.message || 'Failed to delete review'
          );
          console.error('Fallback delete review failed:', fallbackError);
          return;
        }
      }

      toast.error(error.response?.data?.message || 'Failed to delete review');
      console.error('Delete review failed:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, customer, or review text..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>

          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="all">All Reviews</option>
            <option value="true">Verified Customer</option>
            <option value="false">Non-Verified</option>
          </select>

          <button
            type="submit"
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700"
          >
            Apply
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-gray-500">No reviews found.</div>
        ) : (
          <div className="divide-y">
            {reviews.map((review) => (
              <div key={review.reviewId} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-900">{review.productName}</div>
                    <div className="text-sm text-gray-600">
                      {review.user?.name || 'Customer'}
                      {review.user?.email ? ` (${review.user.email})` : ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm">
                      Rating: <span className="font-medium">{review.rating}/5</span>
                    </div>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified Customer
                      </span>
                    )}
                    <div className="font-medium text-gray-800">{review.title || 'Review'}</div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(review.productId, review.reviewId)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map((pageNo) => (
            <button
              key={pageNo}
              onClick={() => setPage(pageNo)}
              className={`px-3 py-1.5 rounded-lg border ${
                pageNo === page ? 'bg-rose-600 text-white border-rose-600' : 'bg-white'
              }`}
            >
              {pageNo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
