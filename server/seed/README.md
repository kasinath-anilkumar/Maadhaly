# Database Seeding

This folder contains scripts to seed your database with sample data.

## Quick Start

### 1. Seed Categories

```bash
cd server
node seed/categories.js
```

This will add 8 sample categories:
- Banarasi Silk
- Kanjeevaram
- Chanderi
- Bandhani
- Cotton Sarees
- Linen Sarees
- Designer Sarees
- Wedding Collection

### 2. Seed Products

```bash
cd server
node seed/products.js
```

This will add 8 sample products with images and assign them to appropriate categories.

## Customizing Seed Data

You can edit the `categories.js` and `products.js` files to add your own data before running the scripts.

## Adding Categories via API

You can also add categories directly via the API:

```bash
curl -X POST http://localhost:5000/api/categories \
  -H "Content-Type: multipart/form-data" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "name=Your Category Name" \
  -F "description=Category description" \
  -F "slug=your-category-slug" \
  -F "image=@/path/to/image.jpg"
```

## Adding Categories via Admin Dashboard

1. Start the admin panel: `cd admin && npm run dev`
2. Login with admin credentials
3. Navigate to "Categories" in the sidebar
4. Click "Add Category" button
5. Fill in the details and upload an image
6. Click "Create"
