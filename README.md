# Saree Store - MERN Stack E-commerce Application

A complete e-commerce solution for a saree store built with the MERN stack (MongoDB, Express.js, React, Node.js) with Razorpay payment integration.

## Features

### Customer Features
- Browse products by categories
- Advanced filtering and search
- Product details with reviews
- Shopping cart functionality
- Secure checkout with Razorpay
- Order tracking
- User profile management
- Wishlist functionality

### Admin Features
- Dashboard with analytics
- Product management (CRUD)
- **Category management (CRUD)**
- Order management with status updates
- User management
- Sales reports
- Low stock alerts

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Razorpay SDK

### Frontend (Client)
- React 18
- TypeScript
- React Router DOM
- Tailwind CSS
- shadcn/ui components
- Axios

### Frontend (Admin)
- React 18
- TypeScript
- React Router DOM
- Tailwind CSS
- Recharts for analytics

## Project Structure

```
saree-store/
├── server/                 # Backend API
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   ├── uploads/           # Uploaded files
│   ├── server.js          # Main server file
│   └── package.json
│
├── client/                # Customer frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript types
│   └── package.json
│
└── admin/                 # Admin dashboard
    ├── src/
    │   ├── components/    # Admin components
    │   ├── pages/         # Admin pages
    │   ├── context/       # Auth context
    │   └── services/      # API services
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Razorpay account

### 1. Clone and Setup Backend

```bash
cd server
npm install
```

Create a `.env` file in the server directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saree-store
JWT_SECRET=your-super-secret-jwt-key
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Start the server:
```bash
npm run dev
```

### 2. Setup Client Frontend

```bash
cd client
npm install
```

Create a `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the client:
```bash
npm run dev
```

### 3. Setup Admin Dashboard

```bash
cd admin
npm install
```

Create a `.env` file in the admin directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the admin panel:
```bash
npm run dev
```

## Default Admin Account

To create an admin account, you need to manually update a user in the database:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

## Adding Categories

### Method 1: Using Seed Script (Quick)

```bash
cd server
node seed/categories.js
```

This adds 8 pre-defined categories. Edit `server/seed/categories.js` to customize.

### Method 2: Using Admin Dashboard

1. Start the admin panel: `cd admin && npm run dev`
2. Login with admin credentials
3. Click "Categories" in the sidebar
4. Click "Add Category" button
5. Fill in:
   - **Name**: Category name (e.g., "Banarasi Silk")
   - **Slug**: URL-friendly name (e.g., "banarasi-silk")
   - **Description**: Brief description
   - **Order**: Display order (0 = first)
   - **Image**: Category image (600x400 recommended)
6. Click "Create"

### Method 3: Using API

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Banarasi Silk" \
  -F "slug=banarasi-silk" \
  -F "description=Handwoven silk sarees" \
  -F "order=1" \
  -F "image=@/path/to/image.jpg"
```

### Method 4: Direct MongoDB

```javascript
db.categories.insertOne({
  name: "Banarasi Silk",
  slug: "banarasi-silk",
  description: "Handwoven silk sarees from Varanasi",
  order: 1,
  isActive: true,
  createdAt: new Date()
})
```

## Razorpay Configuration

1. Sign up at [Razorpay](https://razorpay.com)
2. Get your API keys from the dashboard
3. Add them to your server `.env` file
4. For webhooks, set up the webhook URL in Razorpay dashboard:
   - URL: `https://your-domain.com/api/payment/webhook`
   - Secret: Use the same value as `RAZORPAY_WEBHOOK_SECRET`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Orders
- `GET /api/orders` - Get all orders (Admin)
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order
- `PUT /api/orders/:id/status` - Update order status (Admin)

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment
- `POST /api/payment/webhook` - Razorpay webhook

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard stats (Admin)
- `GET /api/dashboard/sales-chart` - Get sales data (Admin)
- `GET /api/dashboard/top-products` - Get top products (Admin)

## Environment Variables

### Server
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret key for JWT tokens |
| RAZORPAY_KEY_ID | Razorpay API key ID |
| RAZORPAY_KEY_SECRET | Razorpay API key secret |
| RAZORPAY_WEBHOOK_SECRET | Razorpay webhook secret |

### Client/Admin
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL |

## License

MIT License
