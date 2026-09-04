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

Dùng để đăng xuất và xóa refresh token cookie.

Request không cần body, query parameter hoặc path parameter. Nên bật credentials để browser xóa đúng cookie:

```js
fetch('http://localhost:5000/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

Response:

```json
{
  "message": "Đăng xuất thành công!"
}
```

HTTP status: `200 OK`

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

# 5. API Chưa Triển Khai

Prisma đã có các model `Product`, `Cart`, `CartItem`, `Order` và `OrderItem`, nhưng hiện chưa có route/controller tương ứng và chưa được mount trong `server/index.js`.

Vì vậy các API sau chưa được hỗ trợ:

- `/api/products`
- `/api/cart`
- `/api/orders`
- Các API Series Registry, Revenue Right Token, Multisig, Revenue Share Vault và Marketplace trong tài liệu contract khác.

Không gọi các endpoint trên từ Frontend cho đến khi backend bổ sung route, controller và contract request/response tương ứng.
