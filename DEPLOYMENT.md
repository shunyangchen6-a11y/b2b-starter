# FOUR SEASONS CLOTHING deployment

## Environment variables

Configure the backend with `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `COOKIE_SECRET`, `STORE_CORS`, `ADMIN_CORS`, and `AUTH_CORS`. Configure the storefront with `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_DEFAULT_REGION`, `MEDUSA_REVALIDATE_SECRET`, and `NEXT_PUBLIC_WHATSAPP_NUMBER`.

Never commit production connection strings, secrets, or WhatsApp numbers. Copy the supplied `.env.example` files into local ignored environment files.

## Product wholesale fields

Use Medusa product metadata for `style_number`, `fabric`, `pack_size` (`5` or `10`), `moq`, `stock_status` (`In Stock`, `Low Stock`, or `Sold Out`), and `video_url`. Standard Medusa Admin product editing already supports product status, variants (sizes/colors/SKUs), images, media upload, import/export, and inventory.

## Release

1. Create a PostgreSQL database and Redis instance.
2. Apply backend migrations with `medusa db:migrate`, including the `wholesale_inquiry` table.
3. Build the backend with `medusa build`; run it with `medusa start`.
4. Set the storefront public API URL, publishable key, base URL, and WhatsApp number.
5. Build with `next build` and serve with `next start`.
6. Verify `/health`, the storefront Selection List, `POST /store/inquiries`, and authenticated `GET /admin/inquiries`.

## Admin usage

Create/edit products in Medusa Admin under Products. Add product images and a video URL in metadata, create color/size variants, set inventory, and set a publishable sales channel. Wholesale inquiry records are available through the authenticated `/admin/inquiries` API while a dedicated Admin dashboard table is the next UI enhancement.
