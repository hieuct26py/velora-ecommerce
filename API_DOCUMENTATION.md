# Velora Backend API Contract Docs

Backend hiện chạy bằng Express tại `http://localhost:5000`.

- Các API được mount dưới prefix `/api`.
- Request có body dùng JSON cần gửi `Content-Type: application/json`.
- API Auth là public. Các API User yêu cầu Access Token; một số API chỉ dành cho `ADMIN` hoặc chính chủ tài khoản.
- API cần cookie phải bật credentials ở phía Frontend.

# 1. Health Check

# GET /api/health

Dùng để kiểm tra backend đang hoạt động.

Request không cần tham số, header hoặc body.

Response:

```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

HTTP status: `200 OK`

# 2. Authentication

# POST /api/auth/register

Dùng để tạo tài khoản mới. Tài khoản đăng ký từ API này luôn có role `CUSTOMER`.

Request body cần các trường sau:

```json
{
  "email": "customer@example.com",
  "password": "StrongPassword123!"
}
```

- `email`: string, bắt buộc. Backend trim và chuyển thành chữ thường trước khi lưu.
- `password`: string, bắt buộc. Backend hash bằng `bcrypt` trước khi lưu, không lưu mật khẩu gốc.

Backend lưu user với các trường:

- `id`
- `email`
- `password_hash`
- `role`: `CUSTOMER`
- `is_active`: `true` mặc định
- `is_verified`: `false` mặc định
- `verification_token`: token xác minh được tạo khi đăng ký
- `created_at`
- `updated_at`

Response thành công:

```json
{
  "message": "Đăng ký thành công!",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "role": "CUSTOMER",
    "created_at": "2026-09-03T08:30:00.000Z"
  }
}
```

HTTP status: `201 Created`

Các trường hợp lỗi:

- `400`: thiếu `email` hoặc `password`.

```json
{
  "message": "Email và mật khẩu là bắt buộc!"
}
```

- `400`: email đã tồn tại.

```json
{
  "message": "Email đã được sử dụng!"
}
```

- `500`: lỗi server hoặc database.

```json
{
  "message": "Lỗi máy chủ",
  "error": "<error message>"
}
```

# POST /api/auth/login

Dùng để đăng nhập bằng email và password.

Request body:

```json
{
  "email": "customer@example.com",
  "password": "StrongPassword123!"
}
```

- `email`: string. Backend trim và chuyển thành chữ thường để tìm user.
- `password`: string. Backend so sánh với `password_hash` bằng `bcrypt`.

Khi đăng nhập thành công, backend:

- trả `accessToken` trong JSON response;
- đặt `refreshToken` vào HttpOnly cookie;
- cookie có tên `refreshToken`, thời hạn 7 ngày, `SameSite=Strict`;
- cookie có `Secure=true` khi `NODE_ENV=production`.

Response:

```json
{
  "message": "Đăng nhập thành công",
  "accessToken": "<jwt access token>",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "customer@example.com",
  "role": "CUSTOMER"
}
```

Access token có thời hạn `15m` và payload gồm:

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "role": "CUSTOMER"
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `401`: email không tồn tại.

```json
{
  "message": "Email không tồn tại!"
}
```

- `401`: password không đúng.

```json
{
  "message": "Sai mật khẩu!"
}
```

- `500`: lỗi server hoặc database.

```json
{
  "message": "Lỗi máy chủ",
  "error": "<error message>"
}
```

# PATCH /api/auth/change-password

Dùng để đổi mật khẩu của user đang đăng nhập.

Request cần header:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

API lấy user từ `sub` trong Access Token, vì vậy không cần truyền `userId`.

Request body:

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

- `currentPassword`: string, bắt buộc. Mật khẩu hiện tại của user.
- `newPassword`: string, bắt buộc. Mật khẩu mới sẽ được hash bằng `bcrypt` trước khi lưu.

Response thành công:

```json
{
  "message": "Đổi mật khẩu thành công!"
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `400`: thiếu `currentPassword` hoặc `newPassword`.

```json
{
  "message": "Mật khẩu hiện tại và mật khẩu mới là bắt buộc!"
}
```

- `401`: mật khẩu hiện tại không đúng.

```json
{
  "message": "Mật khẩu hiện tại không đúng!"
}
```

- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ/hết hạn hoặc tài khoản đã bị vô hiệu hóa.
- `404`: user trong Access Token không còn tồn tại.
- `500`: lỗi server hoặc database.

# POST /api/auth/refresh-token

Dùng refresh token trong cookie để cấp access token mới.

Request:

- Không có query parameter.
- Không có path parameter.
- Không gửi refresh token trong body hoặc `Authorization` header.
- Browser phải tự gửi cookie `refreshToken`.

Frontend cần bật credentials:

```js
fetch('http://localhost:5000/api/auth/refresh-token', {
  method: 'POST',
  credentials: 'include',
});
```

Response:

```json
{
  "accessToken": "<new jwt access token>"
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `401`: request không có cookie `refreshToken`.

```json
{
  "message": "Không tìm thấy phiên đăng nhập trong Cookie!"
}
```

- `403`: refresh token hết hạn hoặc không hợp lệ.

```json
{
  "message": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ!"
}
```

# POST /api/auth/logout

Dùng để đăng xuất và xóa refresh token cookie. API yêu cầu user đã đăng nhập.

Request cần Access Token và credentials:

```http
Authorization: Bearer <access_token>
```

```js
fetch('http://localhost:5000/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
  headers: { Authorization: 'Bearer <access_token>' },
});
```

Response:

```json
{
  "message": "Đăng xuất thành công!"
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.

# 3. User Management

# GET /api/users

Chỉ dành cho `ADMIN`. Dùng để lấy danh sách người dùng, có phân trang và lọc theo trạng thái hoạt động.

Request cần header:

```http
Authorization: Bearer <access_token>
```

Query parameters:

- `page`: số trang, mặc định `1`.
- `limit`: số user mỗi trang, mặc định `10`.
- `status`: tùy chọn, nhận `active` hoặc `inactive`.

Ví dụ:

```http
GET /api/users?page=1&limit=10&status=active
```

Response thành công:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "customer@example.com",
      "role": "CUSTOMER",
      "is_active": true,
      "created_at": "2026-09-03T08:30:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ/hết hạn hoặc user không có role `ADMIN`.
- `500`: lỗi server hoặc database.

# GET /api/users/:userId

Dùng để lấy thông tin một user. User chỉ được xem chính mình; `ADMIN` được xem mọi user.

Request cần header:

```http
Authorization: Bearer <access_token>
```

Path parameter:

- `userId`: UUID của user cần xem.

Ví dụ:

```http
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

Response thành công:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "role": "CUSTOMER",
    "is_active": true,
    "created_at": "2026-09-03T08:30:00.000Z"
  }
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `401`: thiếu Access Token.
- `403`: user hiện tại không phải chính chủ hoặc `ADMIN`; hoặc tài khoản đích đã bị vô hiệu hóa và user hiện tại không phải `ADMIN`.
- `404`: user không tồn tại.
- `500`: lỗi server hoặc database.

# PATCH /api/users/:userId

Dùng để cập nhật email của user. User chỉ được cập nhật chính mình; `ADMIN` có thể cập nhật mọi user và có thể đổi role.

Request cần header:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Path parameter:

- `userId`: UUID của user cần cập nhật.

Request body:

```json
{
  "email": "new-email@example.com",
  "role": "CUSTOMER"
}
```

- `email`: tùy chọn, email mới.
- `role`: tùy chọn. Chỉ được cập nhật khi Access Token thuộc user có role `ADMIN`; user thường gửi trường này sẽ không được cập nhật role.
- Cần gửi ít nhất một trường hợp lệ.

Response thành công:

```json
{
  "message": "Cập nhật người dùng thành công!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "new-email@example.com",
    "role": "CUSTOMER",
    "is_active": true
  }
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `400`: email đã được dùng bởi user khác hoặc không có dữ liệu hợp lệ để cập nhật.
- `401`: thiếu Access Token.
- `403`: không có quyền cập nhật user hoặc tài khoản đích đã bị vô hiệu hóa.
- `404`: user không tồn tại.
- `500`: lỗi server hoặc database.

# PATCH /api/users/:userId/status

Chỉ dành cho `ADMIN`. Dùng để bật/tắt trạng thái hoạt động của một user.

Request cần header:

```http
Authorization: Bearer <admin_access_token>
```

Path parameter:

- `userId`: UUID của user cần thay đổi trạng thái.

Request body không cần gửi.

Response khi kích hoạt:

```json
{
  "message": "Kích hoạt tài khoản thành công!",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "role": "CUSTOMER",
    "is_active": true
  }
}
```

Khi vô hiệu hóa, response có cùng cấu trúc nhưng `message` là `Vô hiệu hóa tài khoản thành công!` và `is_active` là `false`.

HTTP status: `200 OK`

Các trường hợp lỗi:

- `400`: không thể thay đổi trạng thái của chính tài khoản đang đăng nhập.
- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ/hết hạn hoặc user không có role `ADMIN`.
- `404`: user không tồn tại.
- `500`: lỗi server hoặc database.

# 4. Authentication Middleware

Các middleware này đang được dùng trên nhóm API User.

# verifyToken

API private cần nhận header:

```http
Authorization: Bearer <access_token>
```

- Không có token: trả `401`.
- Token không hợp lệ hoặc hết hạn: trả `403`.
- Token hợp lệ: middleware gắn payload vào `req.user`.

# verifyAdmin

Chỉ cho phép user có `req.user.role = ADMIN`.

- Không có user hoặc role khác `ADMIN`: trả `403`.
- Nếu hợp lệ: chuyển request sang middleware/controller tiếp theo.

# 5. Category Management

# GET /api/categories

Dùng để lấy danh sách tất cả danh mục. API public, không cần đăng nhập. Danh mục được sắp xếp theo `name` tăng dần.

Request không cần query parameter, path parameter hoặc body.

Response thành công:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Electronics",
      "description": "Electronic products",
      "image_url": "https://example.com/electronics.jpg",
      "created_at": "2026-09-07T08:30:00.000Z",
      "updated_at": "2026-09-07T08:30:00.000Z"
    }
  ]
}
```

HTTP status: `200 OK`

- `500`: lỗi server hoặc database.

# GET /api/categories/:categoryId

Dùng để lấy thông tin một danh mục. API public.

Path parameter: `categoryId` là UUID của danh mục.

Response thành công: `200 OK`, trả `{ "data": <category> }`.

Các trường hợp lỗi:

- `404`: danh mục không tồn tại.
- `500`: lỗi server hoặc database.

# POST /api/categories

Chỉ dành cho `ADMIN`. Dùng để tạo danh mục.

Request cần header:

```http
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

Request body:

```json
{
  "name": "Electronics",
  "description": "Electronic products",
  "image_url": "https://example.com/electronics.jpg"
}
```

- `name`: string, bắt buộc và duy nhất.
- `description`, `image_url`: tùy chọn.

Response thành công: `201 Created`, trả `{ "data": <category> }`.

Các trường hợp lỗi:

- `400`: thiếu tên hoặc danh mục đã tồn tại.
- `401`: thiếu Access Token.
- `403`: token không hợp lệ/hết hạn hoặc không phải `ADMIN`.
- `500`: lỗi server hoặc database.

# PATCH /api/categories/:categoryId

Chỉ dành cho `ADMIN`. Dùng để cập nhật danh mục.

Path parameter: `categoryId` là UUID của danh mục.

Request body có thể gồm `name`, `description`, `image_url`. Response thành công: `200 OK`, trả `{ "data": <updated category> }`.

Các trường hợp lỗi:

- `400`: tên danh mục đã được sử dụng.
- `401`: thiếu Access Token.
- `403`: không có quyền `ADMIN`.
- `404`: danh mục không tồn tại.
- `500`: lỗi server hoặc database.

# DELETE /api/categories/:categoryId

Chỉ dành cho `ADMIN`. Dùng để xóa danh mục không có sản phẩm liên quan.

Response thành công:

```json
{
  "message": "Xóa danh mục thành công!"
}
```

HTTP status: `200 OK`

Các trường hợp lỗi:

- `400`: danh mục đang có sản phẩm liên quan.
- `401`: thiếu Access Token.
- `403`: không có quyền `ADMIN`.
- `404`: danh mục không tồn tại.
- `500`: lỗi server hoặc database.

# 6. Product Management

# GET /api/products

Dùng để lấy danh sách sản phẩm. API public; user thường chỉ thấy sản phẩm active. `ADMIN` có thể lọc theo trạng thái.

Query parameters:

- `page`, `limit`: phân trang, mặc định lần lượt `1` và `10`.
- `keyword`: tìm theo tên sản phẩm.
- `minPrice`, `maxPrice`: khoảng giá.
- `category`: UUID của category.
- `status`: với `ADMIN`, nhận `ACTIVE`, `INACTIVE` hoặc `ALL`; user public luôn chỉ nhận sản phẩm active.

Response có dạng `{ "data": [<product with category>], "meta": { "total", "page", "limit", "totalPages" } }`.

HTTP status: `200 OK`; `500` nếu lỗi server hoặc database.

# GET /api/products/:productId

Dùng để lấy chi tiết sản phẩm. API public; sản phẩm inactive chỉ hiển thị cho `ADMIN` có token hợp lệ.

Path parameter: `productId` là UUID của sản phẩm.

Response thành công: `200 OK`, trả `{ "data": <product with category> }`, gồm `images`, `category_id` và category rút gọn.

Các trường hợp lỗi:

- `404`: sản phẩm không tồn tại hoặc đang inactive với user thường.
- `500`: lỗi server hoặc database.

# POST /api/products

Chỉ dành cho `ADMIN`. Dùng để tạo sản phẩm.

Request body:

```json
{
  "name": "Keyboard",
  "description": "Mechanical keyboard",
  "price": 99.99,
  "stock_quantity": 20,
  "category_id": "550e8400-e29b-41d4-a716-446655440000",
  "images": ["https://example.com/keyboard.jpg"]
}
```

- `name`, `price`: bắt buộc.
- `description`, `stock_quantity`, `category_id`, `images`: tùy chọn; `stock_quantity` mặc định `0`, `images` mặc định `[]`.
- Cần gửi `Authorization: Bearer <admin_access_token>` và `Content-Type: application/json`.

Response thành công: `201 Created`, trả `{ "data": <product> }`.

Các trường hợp lỗi: `400` nếu thiếu tên/giá; `401` nếu thiếu token; `403` nếu không phải `ADMIN`; `500` nếu lỗi server/database.

# PATCH /api/products/:productId

Chỉ dành cho `ADMIN`. Dùng để cập nhật sản phẩm.

Path parameter: `productId` là UUID sản phẩm.

Request body có thể gồm `name`, `description`, `price`, `stock_quantity`, `category_id`, `images`, `is_active`.

Response thành công: `200 OK`, trả `{ "data": <updated product> }`.

Các trường hợp lỗi: `401` nếu thiếu token; `403` nếu không phải `ADMIN`; `404` nếu sản phẩm không tồn tại; `500` nếu lỗi server/database.

# DELETE /api/products/:productId

Chỉ dành cho `ADMIN`. Đây là soft delete: backend cập nhật `is_active = false`, không xóa record.

Response thành công: `200 OK`, trả `{ "data": <deactivated product> }`.

Các trường hợp lỗi: `401` nếu thiếu token; `403` nếu không phải `ADMIN`; `404` nếu sản phẩm không tồn tại; `500` nếu lỗi server/database.

# 7. Cart Management

Tất cả API Cart đều yêu cầu:

```http
Authorization: Bearer <access_token>
```

Giỏ hàng được xác định theo user ID trong trường `sub` của JWT.

# GET /api/cart

Dùng để lấy giỏ hàng của user đang đăng nhập. Nếu user chưa có giỏ hàng, backend sẽ tạo giỏ hàng rỗng.

Request không cần query parameter hoặc body.

Response thành công:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "650e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "id": "750e8400-e29b-41d4-a716-446655440000",
        "productId": "850e8400-e29b-41d4-a716-446655440000",
        "name": "Keyboard",
        "price": 99.99,
        "quantity": 2,
        "image": "https://example.com/keyboard.jpg",
        "is_active": true,
        "itemTotal": 199.98
      }
    ],
    "totalAmount": 199.98
  }
}
```

HTTP status: `200 OK`

- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.
- `500`: lỗi server hoặc database.

# POST /api/cart/items

Dùng để thêm sản phẩm vào giỏ hàng. Nếu sản phẩm đã có trong giỏ, số lượng mới sẽ được cộng vào số lượng hiện tại.

Request body:

```json
{
  "productId": "850e8400-e29b-41d4-a716-446655440000",
  "quantity": 2
}
```

- `productId`: UUID sản phẩm, bắt buộc.
- `quantity`: số nguyên lớn hơn `0`, bắt buộc.
- Sản phẩm phải tồn tại, đang active và `quantity` không được vượt `stock_quantity`.
- Khi sản phẩm đã có trong giỏ, tổng số lượng hiện tại cộng số lượng mới cũng không được vượt `stock_quantity`.

Response thành công: `200 OK`, gồm message `Sản phẩm đã được thêm vào giỏ hàng` và dữ liệu giỏ hàng hiện tại trong `data`.

Các trường hợp lỗi:

- `400`: dữ liệu không hợp lệ, quantity vượt tồn kho hoặc tổng số lượng trong giỏ vượt tồn kho.
- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.
- `404`: sản phẩm không tồn tại hoặc không khả dụng.
- `500`: lỗi server hoặc database.

# PATCH /api/cart/items/:itemId

Dùng để thay thế số lượng của một item trong giỏ hàng.

Path parameter: `itemId` là UUID của CartItem.

Request body:

```json
{
  "quantity": 3
}
```

`quantity` phải là số nguyên lớn hơn `0`, không vượt tồn kho và sản phẩm phải còn active.

Response thành công: `200 OK`, gồm message `Cập nhật số lượng thành công` và giỏ hàng mới trong `data`.

Các trường hợp lỗi:

- `400`: quantity không hợp lệ, vượt tồn kho hoặc sản phẩm không còn khả dụng.
- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.
- `404`: giỏ hàng hoặc CartItem không tồn tại.
- `500`: lỗi server hoặc database.

# DELETE /api/cart/items/:itemId

Dùng để xóa một sản phẩm khỏi giỏ hàng của user đang đăng nhập.

Path parameter: `itemId` là UUID của CartItem.

Response thành công: `200 OK`, gồm message `Xóa sản phẩm khỏi giỏ hàng thành công` và giỏ hàng mới trong `data`.

Các trường hợp lỗi:

- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.
- `404`: giỏ hàng hoặc sản phẩm không tồn tại trong giỏ.
- `500`: lỗi server hoặc database.

# POST /api/cart/sync

Dùng để đồng bộ các item từ giỏ hàng local của Frontend vào giỏ hàng database sau khi user đăng nhập.

Request body:

```json
{
  "localItems": [
    {
      "productId": "850e8400-e29b-41d4-a716-446655440000",
      "quantity": 2
    }
  ]
}
```

- `localItems`: array không rỗng.
- Mỗi item phải có `productId` hợp lệ và `quantity` là số nguyên lớn hơn `0`.
- Sản phẩm phải tồn tại, active và số lượng không vượt tồn kho.

Response thành công: `200 OK`, gồm message `Đồng bộ giỏ hàng thành công` và giỏ hàng mới trong `data`.

Các trường hợp lỗi:

- `400`: dữ liệu localItems không hợp lệ, sản phẩm không khả dụng hoặc số lượng vượt tồn kho.
- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.
- `500`: lỗi server hoặc database.

# DELETE /api/cart

Dùng để xóa toàn bộ sản phẩm khỏi giỏ hàng của user đang đăng nhập.

Response thành công:

```json
{
  "message": "Xóa tất cả sản phẩm khỏi giỏ hàng thành công",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "650e8400-e29b-41d4-a716-446655440000",
    "items": [],
    "totalAmount": 0
  }
}
```

Các trường hợp lỗi:

- `401`: thiếu Access Token.
- `403`: Access Token không hợp lệ hoặc đã hết hạn.
- `404`: giỏ hàng không tồn tại.
- `500`: lỗi server hoặc database.

# 8. API Chưa Triển Khai

Prisma đã có các model `Product`, `Cart`, `CartItem`, `Order` và `OrderItem`; nhóm API Cart đã được triển khai ở phần trên. Nhóm Orders hiện chưa có route/controller và chưa được mount trong `server/index.js`.

Vì vậy các API sau chưa được hỗ trợ:

- `/api/orders`
- Các API Series Registry, Revenue Right Token, Multisig, Revenue Share Vault và Marketplace trong tài liệu contract khác.

Không gọi các endpoint trên từ Frontend cho đến khi backend bổ sung route, controller và contract request/response tương ứng.
