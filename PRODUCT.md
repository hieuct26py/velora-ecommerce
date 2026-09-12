# Velora Product Brief

## 1. Product Overview

Velora is a focused Apple electronics storefront for people comparing iPhone, iPad, Mac, Apple Watch, AirPods, and carefully selected accessories. It helps customers understand the right device quickly, compare practical details, and complete checkout without friction.

The product should feel like a specialist Apple retailer: calm, precise, image-led, and trustworthy. Product information, storage, finish, connectivity, stock, and price should be easy to scan. The first release is a customer storefront backed by the existing REST API. The architecture must leave room for account management, order history, and an admin operations surface without forcing those concerns into the shopping experience.

## 2. Product Goals

- Make Apple device discovery fast and legible.
- Help customers choose between device families, sizes, storage tiers, and accessories.
- Let a guest build a cart before creating an account.
- Preserve the guest cart in LocalStorage.
- Merge the local cart into the authenticated cart after login.
- Keep inventory and pricing decisions on the server.
- Make order creation a single, explicit action.
- Give customers a reliable view of their orders and statuses.
- Give admins a practical way to manage inventory, orders, users, and sales metrics later.

## 3. Audience

### Primary: Online shoppers

They may arrive from a search result or campaign, browse without an account, compare iPhone or iPad models, save products to a cart, then sign in only when they are ready to place an order. They value speed, honest stock information, crisp product imagery, useful specifications, and a checkout flow that does not surprise them.

### Secondary: Store administrators

Admins manage products, categories, users, order status, and high-level sales information. Their interface is an operational tool, not a marketing page: dense enough to scan, restrained enough to trust, and separated from the customer storefront.

## 4. Customer Experience

### 4.1 Entry and discovery

1. The customer lands on the storefront.
2. The frontend requests public Apple categories from `GET /api/v1/categories` and active products from `GET /api/v1/products`.
3. The customer can search by keyword, filter by category and price range, paginate results, and open a product detail page.
4. Product cards show the product name, primary image, price, family context, stock-aware purchase affordance, and a clear inactive or unavailable state when relevant.
5. Public product browsing never exposes inactive products. The frontend must treat the API as the source of truth.

### 4.2 Product evaluation

The product detail view uses `GET /api/v1/products/:productId` and should provide:

- A strong image gallery using the `images` array.
- Product name, price, category, description, and availability.
- Clear room for Apple-specific details in descriptions: screen size, chip, storage, finish, connectivity, and compatibility.
- A quantity control with stable dimensions.
- An add-to-cart action that is disabled when the item is unavailable.
- Useful feedback after a successful add, without interrupting browsing.

The frontend must not invent stock or price values. It can provide optimistic visual feedback, but the server response remains authoritative.

### 4.3 Guest cart

Guests can add products without signing in.

The guest cart is stored in LocalStorage as a small, versioned payload containing product IDs and quantities. It should not store access tokens, refresh tokens, or sensitive account data.

Recommended shape:

```json
{
  "version": 1,
  "items": [
    { "productId": "product-uuid", "quantity": 2 }
  ]
}
```

The frontend should validate and normalize this data on read. If a product is removed, inactive, or exceeds available stock, the cart must explain the correction instead of silently changing the customer\'s intent.

### 4.4 Sign-in and cart synchronization

When a guest chooses to sign in or register:

1. Submit credentials to `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.
2. Store the short-lived access token only in the frontend auth layer according to the application security strategy. The refresh token is an HttpOnly cookie and must be sent with `credentials: include`.
3. If LocalStorage contains items, call `POST /api/v1/cart/sync` with `localItems`.
4. Replace the local cart with the server-returned cart. The server response wins if local quantities are invalid or products are unavailable.
5. Fetch `GET /api/v1/cart` as the final authoritative cart state.
6. Clear the local guest cart only after sync succeeds.

If synchronization fails, keep the local cart intact and show an actionable recovery state. Never clear a guest cart before the server confirms the merge.

### 4.5 Authenticated cart

Authenticated cart operations use the user identity from the access token:

- Read: `GET /api/v1/cart`
- Add: `POST /api/v1/cart/items`
- Replace quantity: `PATCH /api/v1/cart/items/:itemId`
- Remove one item: `DELETE /api/v1/cart/items/:itemId`
- Clear all: `DELETE /api/v1/cart`

The cart view should show item image, name, current price, quantity, line total, active state, and cart total. Quantity changes must handle stock errors from the API and preserve the last confirmed state when a request fails.

### 4.6 Order creation

Velora currently creates an order from the entire authenticated cart through `POST /api/v1/orders`. The request has no body. The backend:

- Reads the user from the access token.
- Revalidates active products and stock.
- Calculates the total on the server.
- Stores purchase-time prices in order items.
- Decrements inventory inside a transaction.
- Creates the order with `PENDING` status.
- Clears the cart after the transaction succeeds.

The frontend must display a final review step before this request and must not calculate or submit a client-controlled total. The primary action should communicate that the whole current cart will become one order.

Possible outcomes:

- `201`: show confirmation and the new order reference.
- `400`: keep the customer in context, identify unavailable or insufficient-stock items, refresh the cart, and require review.
- `401` or `403`: refresh the session or return the customer to sign-in without losing local intent.
- `500`: show a retry path and do not imply that an order was created.

### 4.7 Orders and account history

Customers use:

- `GET /api/v1/orders/me` for order history.
- `GET /api/v1/orders/:orderId` for an order detail.
- `PATCH /api/v1/orders/:orderId` to cancel a `PENDING` order they own.

Order history should be chronological, easy to scan, and status-led. The UI should distinguish `PENDING`, `PAID`, and `CANCELLED` without relying on color alone. Cancellation must explain that stock is returned by the backend.

### 4.8 Admin operations

Admin-only functionality is a separate product surface and should not clutter the customer navigation. It can later include:

- Product and category management.
- User list, profile, and active-status controls.
- Paginated order management and status updates.
- `GET /api/v1/analytics/total-sales` for paid sales.
- `GET /api/v1/analytics/total-orders` for total orders.

Admin APIs require a bearer token and must be guarded in the UI as well as on the server. UI guards are for experience; server authorization remains definitive.

## 5. Information Architecture

### Customer navigation

- Shop Apple devices
- iPhone
- iPad
- Mac and accessories
- Search
- Cart
- Account
- Orders, visible after authentication

### Customer pages

- Storefront / product discovery
- Product detail
- Cart
- Sign in
- Register
- Order review
- Order confirmation
- Order history
- Order detail
- Account settings

### Admin navigation

- Overview
- Products
- Categories
- Orders
- Customers

## 6. State and API Principles

- Keep API requests in a small client layer rather than scattering fetch logic through presentational components.
- Normalize loading, empty, error, and unauthorized states for every data view.
- Use the response envelope consistently: most collections return `data`, and paginated resources also return `meta`.
- Convert Decimal-backed monetary values to display-safe numbers only at the presentation boundary.
- Debounce search input, but never debounce an explicit add-to-cart or checkout action.
- Abort stale product-list requests when filters change.
- Retry only safe reads by default. Never automatically repeat order creation without an idempotency strategy.
- Treat a `401`/`403` response as a session event, not as a generic product-list error.

## 7. Success Criteria

- A guest can browse and build a cart without an account.
- A guest cart survives reloads and is not lost during login failure.
- A successful login merges the guest cart exactly once and reflects server validation.
- A customer can understand the final cart before creating an order.
- Stock or inactive-product conflicts are recoverable and clear.
- An order confirmation is shown only after the server returns success.
- The storefront remains fast and readable on small screens and large screens.
- The visual system feels deliberate, editorial, and product-specific rather than like a generic dashboard or generated template.
