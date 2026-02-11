export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: Address[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  image: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  category: Category | string;
  subcategory?: string;
  fabric: string;
  color: string;
  occasion: string[];
  work: string;
  stock: number;
  sku: string;
  ratings: {
    average: number;
    count: number;
  };
  reviews?: Review[];
  isActive: boolean;
  isFeatured: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  user: string;
  orderItems: OrderItem[];
  shippingAddress: Address;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  paymentInfo: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    paidAt?: Date;
  };
  itemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  createdAt: Date;
}

export interface Review {
  user: User;
  rating: number;
  comment: string;
  createdAt: Date;
}
