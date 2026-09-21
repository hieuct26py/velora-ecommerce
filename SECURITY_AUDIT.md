# 🔒 Velora Backend — Báo cáo Kiểm toán Bảo mật & Hiệu năng

> **Auditor**: Senior Backend Security Auditor
> **Scope**: Toàn bộ server-side codebase (Node.js / Express / Prisma / PostgreSQL)
> **Date**: 2026-09-13
> **Severity Scale**: 🔴 Cao · 🟡 Trung bình · 🟢 Thấp

---

## Trụ cột 1: Lỗ hổng Logic Kinh doanh (Business Logic Flaws)

---

### 🔴 [CAO] #1 — Race Condition khi tạo đơn hàng: Stock có thể âm

**File**: [`order.controller.js`](file:///d:/_HUST/Velora/server/controllers/order.controller.js)

**Phân tích nguyên nhân cốt lõi**:
Hàm `createOrder` kiểm tra tồn kho **BÊN NGOÀI** transaction, nhưng trừ stock **BÊN TRONG** transaction. Khoảng hở giữa hai bước này tạo ra một cửa sổ race condition cổ điển (TOCTOU — Time-of-Check-to-Time-of-Use).

```
Timeline khi 2 user cùng mua sản phẩm có stock = 1:

User A: đọc stock=1, kiểm tra 1>=1 ✓ ──────────────► bắt đầu transaction, decrement → stock=0
User B: đọc stock=1, kiểm tra 1>=1 ✓ ──► bắt đầu transaction, decrement → stock = -1 ❌
```

**Bằng chứng** — Stock check ở dòng 21-24 (ngoài `$transaction`), decrement ở dòng 44-47 (trong `$transaction`):

```javascript
// ❌ NGOÀI TRANSACTION — dữ liệu có thể stale ngay lập tức
const cart = await prisma.cart.findUnique({ ... include: { items: { include: { product: true } } } });
for (const item of cart.items) {
    if (item.quantity > item.product.stock_quantity) {  // <-- check tại thời điểm T₁
        return res.status(400).json({ ... });
    }
    totalAmount += Number(item.product.price) * item.quantity;
}

// ❌ TRONG TRANSACTION — nhưng không re-check stock, không dùng Serializable
const order = await prisma.$transaction(async (tx) => {
    // ...
    await tx.product.update({  // <-- decrement tại thời điểm T₂, stock có thể đã thay đổi
        where: { id: item.product_id },
        data: { stock_quantity: { decrement: item.quantity } }
    });
});
```

**So sánh**: Hàm `addItemToCart` trong [`cart.controller.js`](file:///d:/_HUST/Velora/server/controllers/cart.controller.js) đã dùng `Serializable` isolation level đúng cách (dòng 81), nhưng `createOrder` — nơi thực sự trừ stock — lại không.

**Giải pháp**:

```javascript
export const createOrder = async (req, res) => {
    try {
        const userId = req.user.sub;

        const order = await prisma.$transaction(async (tx) => {
            // 1. Đọc cart BÊN TRONG transaction
            const cart = await tx.cart.findUnique({
                where: { user_id: userId },
                include: { items: { include: { product: true } } },
            });

            if (!cart || cart.items.length === 0) {
                throw Object.assign(new Error('Giỏ hàng trống!'), { statusCode: 400 });
            }

            let totalAmount = 0;
            const orderItemsData = [];

            for (const item of cart.items) {
                // 2. Đọc lại product với FOR UPDATE lock (implicit trong Serializable)
                const product = await tx.product.findUnique({
                    where: { id: item.product_id },
                });

                if (!product || !product.is_active) {
                    throw Object.assign(
                        new Error(`Sản phẩm ${item.product?.name || item.product_id} không khả dụng!`),
                        { statusCode: 400 }
                    );
                }

                if (item.quantity > product.stock_quantity) {
                    throw Object.assign(
                        new Error(`Sản phẩm ${product.name} không đủ số lượng! (còn ${product.stock_quantity})`),
                        { statusCode: 400 }
                    );
                }

                totalAmount += Number(product.price) * item.quantity;

                orderItemsData.push({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    price_at_purchase: product.price,   // giá đọc BÊN TRONG transaction
                });

                // 3. Trừ stock ngay trong cùng transaction
                await tx.product.update({
                    where: { id: item.product_id },
                    data: { stock_quantity: { decrement: item.quantity } },
                });
            }

            // 4. Tạo đơn hàng
            const newOrder = await tx.order.create({
                data: { user_id: userId, total_amount: totalAmount, status: 'PENDING' },
            });

            await tx.orderItem.createMany({
                data: orderItemsData.map((d) => ({ ...d, order_id: newOrder.id })),
            });

            // 5. Xóa cart items
            await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });

            return newOrder;
        }, {
            isolationLevel: 'Serializable',  // ← QUAN TRỌNG: ngăn concurrent reads
            timeout: 10000,
        });

        return res.status(201).json({ message: 'Đơn hàng đã được tạo thành công!', order });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};
```

---

### 🔴 [CAO] #2 — Máy trạng thái đơn hàng bị gãy (Broken Order State Machine)

**File**: [`order.controller.js`](file:///d:/_HUST/Velora/server/controllers/order.controller.js) — `updateOrderStatus` (dòng 130-150)

**Phân tích nguyên nhân cốt lõi**:
Hàm `updateOrderStatus` chấp nhận BẤT KỲ chuyển trạng thái nào, miễn là status nằm trong danh sách `['PENDING', 'PAID', 'CANCELLED']`. Không có state machine validation.

**Hệ quả trực tiếp**:
- `CANCELLED → PAID`: Đơn hàng đã huỷ có thể "hồi sinh" thành đã thanh toán mà stock không bị trừ lại.
- `PAID → PENDING`: Đơn hàng đã thanh toán có thể quay về chờ xử lý, tạo nhầm lẫn kế toán.
- `CANCELLED → PENDING`: Cho phép tái kích hoạt đơn đã huỷ.

**Hệ quả nghiêm trọng hơn**: Khi admin dùng `updateOrderStatus` để đổi sang `CANCELLED`, stock **KHÔNG** được hoàn trả. Nhưng khi user dùng `deleteOrder` (cũng đổi sang `CANCELLED`), stock **CÓ** được hoàn trả. Hai luồng cùng kết quả nhưng side-effects khác nhau.

**Bằng chứng**:

```javascript
// updateOrderStatus — KHÔNG hoàn stock
const order = await prisma.order.update({ where: { id: orderId }, data: { status } });

// deleteOrder — CÓ hoàn stock
await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
for (const item of order.items) {
    await tx.product.update({
        where: { id: item.product_id },
        data: { stock_quantity: { increment: item.quantity } }
    });
}
```

**Giải pháp**:

```javascript
const VALID_TRANSITIONS = {
    PENDING:   ['PAID', 'CANCELLED'],
    PAID:      [],                      // Đơn đã thanh toán = final state
    CANCELLED: [],                      // Đơn đã huỷ = final state
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status: newStatus } = req.body;

        const validStatuses = ['PENDING', 'PAID', 'CANCELLED'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
        }

        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!existingOrder) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }

        // Kiểm tra luồng chuyển trạng thái hợp lệ
        const allowed = VALID_TRANSITIONS[existingOrder.status] || [];
        if (!allowed.includes(newStatus)) {
            return res.status(400).json({
                message: `Không thể chuyển từ ${existingOrder.status} sang ${newStatus}`,
            });
        }

        // Nếu chuyển sang CANCELLED → hoàn stock trong transaction
        if (newStatus === 'CANCELLED') {
            await prisma.$transaction(async (tx) => {
                await tx.order.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
                for (const item of existingOrder.items) {
                    await tx.product.update({
                        where: { id: item.product_id },
                        data: { stock_quantity: { increment: item.quantity } },
                    });
                }
            });
        } else {
            await prisma.order.update({ where: { id: orderId }, data: { status: newStatus } });
        }

        return res.status(200).json({ message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (error) {
        return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
};
```

---

### 🟡 [TRUNG BÌNH] #3 — TOCTOU trên giá sản phẩm (Price Time-of-Check-to-Time-of-Use)

**File**: [`order.controller.js`](file:///d:/_HUST/Velora/server/controllers/order.controller.js) — `createOrder`

**Phân tích**: `totalAmount` được tính từ `item.product.price` đọc BÊN NGOÀI transaction. Nếu admin thay đổi giá sản phẩm giữa lúc đọc cart và lúc transaction chạy, `total_amount` trên đơn hàng sẽ dựa trên giá cũ, trong khi `price_at_purchase` cũng dùng giá cũ (từ cùng snapshot). Dù hai giá trị này khớp nhau, chúng đều là giá stale — không phản ánh giá hiện tại.

**Giải pháp**: Đã được khắc phục trong giải pháp của Issue #1 (đọc product bên trong transaction với `Serializable` isolation).

---

## Trụ cột 2: Lỗ hổng Bảo mật Truy cập (Access Control & Security)

---

### 🔴 [CAO] #4 — CORS mở toang cho mọi origin với credentials

**File**: [`index.js`](file:///d:/_HUST/Velora/server/index.js) (dòng 20-23)

**Phân tích nguyên nhân cốt lõi**:

```javascript
app.use(cors({
  origin: true,       // ← phản chiếu BẤT KỲ origin nào trong response header
  credentials: true,  // ← cho phép gửi cookie cross-origin
}));
```

`origin: true` khiến Express trả header `Access-Control-Allow-Origin: <requesting-origin>` cho MỌI website. Kết hợp với `credentials: true`, điều này cho phép **bất kỳ trang web độc hại nào** gửi request có cookie đến API.

**Kịch bản tấn công cụ thể**:
1. Nạn nhân đăng nhập Velora → cookie `refreshToken` được set.
2. Nạn nhân truy cập `evil-site.com` có chứa script.
3. Script gọi `POST /api/v1/auth/refresh-token` với `credentials: 'include'` → server trả `accessToken` mới cho `evil-site.com`.
4. Kẻ tấn công dùng `accessToken` để truy cập toàn bộ API: xem đơn hàng, đổi mật khẩu, tạo đơn hàng.

Đây thực chất là lỗ hổng **CSRF** (Cross-Site Request Forgery) được kích hoạt bởi CORS permissive.

**Giải pháp**:

```javascript
const ALLOWED_ORIGINS = [
    'http://localhost:5173',             // Vite dev
    'https://velora.yourdomain.com',     // Production
];

app.use(cors({
    origin: (origin, callback) => {
        // Cho phép request không có origin (Postman, curl, server-to-server)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
```

---

### 🔴 [CAO] #5 — Refresh Token không lưu DB, không thể thu hồi (Revoke)

**File**: [`auth.controller.js`](file:///d:/_HUST/Velora/server/controllers/auth.controller.js) + [`token.js`](file:///d:/_HUST/Velora/server/utils/token.js)

**Phân tích nguyên nhân cốt lõi**:
Refresh token chỉ được ký và gửi qua cookie, **không được lưu trong database**. Hệ quả:

| Tình huống | Kỳ vọng | Thực tế |
|:---|:---|:---|
| User đổi mật khẩu | Session cũ phải bị vô hiệu | Refresh token cũ vẫn hợp lệ 7 ngày |
| Admin vô hiệu hóa tài khoản | User không thể dùng tiếp | Access token hiện tại vẫn hoạt động 15 phút. Refresh token mới sẽ bị từ chối (vì `is_active` check) nhưng access token cũ đã có sẵn vẫn dùng được |
| User logout trên thiết bị A | Token trên thiết bị B phải bị huỷ | Token trên thiết bị B vẫn hoạt động vì server chỉ xoá cookie, không invalidate token |

**Giải pháp tối thiểu** (Token family + DB storage):

```javascript
// 1. Thêm model vào schema.prisma
model RefreshToken {
    id         String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
    user_id    String   @db.Uuid
    token_hash String   @db.VarChar(255)
    expires_at DateTime @db.Timestamptz(6)
    revoked    Boolean  @default(false)
    created_at DateTime @default(now()) @db.Timestamptz(6)
    user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

    @@index([user_id])
    @@index([token_hash])
    @@map("refresh_tokens")
}

// 2. Khi login: hash và lưu refresh token
const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
await prisma.refreshToken.create({
    data: { user_id: user.id, token_hash: refreshTokenHash, expires_at: new Date(Date.now() + 7 * 86400000) },
});

// 3. Khi refresh: kiểm tra token trong DB
const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
const storedToken = await prisma.refreshToken.findFirst({
    where: { token_hash: tokenHash, revoked: false, expires_at: { gt: new Date() } },
});
if (!storedToken) return res.status(403).json({ message: 'Phiên đăng nhập không hợp lệ!' });

// 4. Khi logout / đổi mật khẩu: revoke tất cả token của user
await prisma.refreshToken.updateMany({ where: { user_id: userId }, data: { revoked: true } });
```

---

### 🟡 [TRUNG BÌNH] #6 — User Enumeration qua Login Response

**File**: [`auth.controller.js`](file:///d:/_HUST/Velora/server/controllers/auth.controller.js) — `login` (dòng 47-55)

**Bằng chứng**:

```javascript
const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
if (!user) {
    return res.status(401).json({ message: 'Email không tồn tại!' });  // ← Leaks: email NOT registered
}

const isPasswordValid = await bcrypt.compare(password, user.password_hash);
if (!isPasswordValid) {
    return res.status(401).json({ message: 'Sai mật khẩu!' });         // ← Leaks: email IS registered
}
```

Kẻ tấn công có thể quét danh sách email để xác định email nào đã đăng ký trên hệ thống bằng cách so sánh thông báo lỗi.

**Giải pháp**:

```javascript
const GENERIC_AUTH_ERROR = 'Email hoặc mật khẩu không đúng!';

const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
if (!user) {
    // Vẫn chạy bcrypt.compare với dummy hash để cân bằng thời gian response (timing attack prevention)
    await bcrypt.compare(password, '$2b$10$dummyHashToPreventTimingAttack000000000000000000');
    return res.status(401).json({ message: GENERIC_AUTH_ERROR });
}

const isPasswordValid = await bcrypt.compare(password, user.password_hash);
if (!isPasswordValid) {
    return res.status(401).json({ message: GENERIC_AUTH_ERROR });
}
```

---

### 🟡 [TRUNG BÌNH] #7 — Không có Rate Limiting — Brute Force mở cửa

**Files**: [`index.js`](file:///d:/_HUST/Velora/server/index.js), [`auth.routes.js`](file:///d:/_HUST/Velora/server/routes/auth.routes.js)

**Phân tích**: Không có bất kỳ rate limiting nào trên toàn hệ thống. Các endpoint nhạy cảm nhất:
- `POST /auth/login` — Brute force mật khẩu
- `POST /auth/register` — Spam đăng ký
- `POST /auth/refresh-token` — Abuse token refresh
- `POST /orders` — Spam tạo đơn hàng

**Giải pháp**:

```bash
npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit';

// Rate limiter chung
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    message: { message: 'Quá nhiều request, vui lòng thử lại sau.' },
});

// Rate limiter cho auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Quá nhiều lần thử đăng nhập, vui lòng thử lại sau 15 phút.' },
});

app.use(globalLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
```

---

### 🟡 [TRUNG BÌNH] #8 — Thiếu Security Headers (Helmet)

**File**: [`index.js`](file:///d:/_HUST/Velora/server/index.js)

**Phân tích**: Server không cài đặt các HTTP security headers cơ bản. Chỉ có `app.disable('x-powered-by')` — tốt, nhưng thiếu:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Giải pháp**:

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

---

### 🟢 [THẤP] #9 — Không validate input mật khẩu và email

**File**: [`auth.controller.js`](file:///d:/_HUST/Velora/server/controllers/auth.controller.js) — `register`

**Bằng chứng**: Chỉ kiểm tra `!email || !password` (truthy/falsy). Hệ quả:
- Mật khẩu `"1"` hoặc `"a"` được chấp nhận.
- Email `"not-an-email"` được chấp nhận (chỉ trim + lowercase, không validate format).
- `changePassword` cũng không validate độ mạnh mật khẩu mới.

**Giải pháp**:

```javascript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Email không hợp lệ!' });
}

if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ message: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự!` });
}
```

---

## Trụ cột 3: Tối ưu hóa Database (Prisma ORM)

---

### 🟡 [TRUNG BÌNH] #10 — 7 instance PrismaClient → 7 connection pools

**Bằng chứng**: Mỗi controller tạo `new PrismaClient()` riêng:

| File | Dòng |
|:---|:---|
| `auth.controller.js` | 7 |
| `cart.controller.js` | 3 |
| `order.controller.js` | 3 |
| `product.controller.js` | 3 |
| `category.controller.js` | 3 |
| `user.controller.js` | 2 |
| `analytics.controller.js` | 2 |

Mỗi `PrismaClient` mở một connection pool riêng (mặc định `num_cpus * 2 + 1` connections). Với 7 instances trên máy 8-core → **7 × 17 = 119 connections** (PostgreSQL mặc định chỉ cho phép 100).

**Giải pháp**: Tạo singleton:

```javascript
// server/utils/prisma.js (TẠO MỚI)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
```

```javascript
// Trong mỗi controller, thay thế:
// ❌ import { PrismaClient } from '@prisma/client';
// ❌ const prisma = new PrismaClient();

// ✅ 
import prisma from '../utils/prisma.js';
```

---

### 🟡 [TRUNG BÌNH] #11 — Thiếu Database Index trên `orders.status`

**File**: [`schema.prisma`](file:///d:/_HUST/Velora/server/prisma/schema.prisma) — model `Order` (dòng 93-105)

**Phân tích**: API `GET /api/v1/orders?status=PENDING` (Admin) chạy:

```javascript
const whereCondition = normalizedStatus ? { status: normalizedStatus } : {};
prisma.order.findMany({ where: whereCondition, ... });
prisma.order.count({ where: whereCondition });
```

Không có index trên cột `status` → Full table scan khi filter. Khi hệ thống có hàng nghìn đơn hàng, mỗi request admin sẽ quét toàn bộ bảng.

**Giải pháp** — Thêm vào model `Order` trong `schema.prisma`:

```prisma
model Order {
  // ... existing fields ...

  @@index([user_id], map: "idx_orders_user_id")
  @@index([status], map: "idx_orders_status")           // ← THÊM
  @@index([created_at], map: "idx_orders_created_at")   // ← THÊM (sort by created_at desc)
  @@map("orders")
}
```

---

### 🟢 [THẤP] #12 — N+1 Writes trong Transaction

**File**: [`order.controller.js`](file:///d:/_HUST/Velora/server/controllers/order.controller.js) — `createOrder` (dòng 39-48), `deleteOrder` (dòng 168-173)

**Bằng chứng**: Cả hai hàm đều dùng vòng `for` để update từng product riêng lẻ trong transaction:

```javascript
for (const item of cart.items) {
    await tx.product.update({                    // N lần UPDATE riêng lẻ
        where: { id: item.product_id },
        data: { stock_quantity: { decrement: item.quantity } }
    });
}
```

Nếu đơn hàng có 10 món → 10 câu UPDATE tuần tự. Prisma ORM không hỗ trợ batch update conditional, nên đây là hạn chế của ORM. Tuy nhiên, có thể dùng `$executeRaw` cho trường hợp hiệu năng quan trọng, hoặc chấp nhận trade-off vì N thường nhỏ (số items trong 1 đơn hàng).

**Giải pháp (nếu N lớn)**: Dùng raw SQL batch update:

```javascript
// Chỉ khi cần tối ưu với đơn hàng nhiều items
const updates = cart.items.map(
    (item) => tx.$executeRaw`UPDATE products SET stock_quantity = stock_quantity - ${item.quantity} WHERE id = ${item.product_id}::uuid AND stock_quantity >= ${item.quantity}`
);
await Promise.all(updates);
```

---

## Trụ cột 4: Thiếu sót Dữ liệu & Edge Cases

---

### 🔴 [CAO] #13 — Người dùng bị vô hiệu hóa vẫn thao tác được với Access Token còn hạn

**Files**: [`auth.middleware.js`](file:///d:/_HUST/Velora/server/middlewares/auth.middleware.js), tất cả controllers

**Phân tích nguyên nhân cốt lõi**:
Middleware `verifyToken` chỉ xác minh chữ ký JWT, **không kiểm tra database** xem user có còn active hay không:

```javascript
export const verifyToken = (req, res, next) => {
    // ...
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
        if (err) return res.status(403).json({ ... });
        req.user = decodedPayload;   // ← Tin tưởng hoàn toàn vào JWT, không check DB
        next();
    });
};
```

**Kịch bản**:
1. Admin vô hiệu hóa tài khoản xấu lúc 10:00.
2. User xấu có access token ký lúc 9:50, hết hạn 10:05.
3. Từ 10:00 → 10:05: User xấu vẫn tạo đơn hàng, sửa giỏ hàng, đổi mật khẩu bình thường.

**Giải pháp**: Thêm kiểm tra `is_active` vào middleware hoặc thêm 1 middleware riêng cho các route nhạy cảm:

```javascript
import prisma from '../utils/prisma.js';

export const verifyActiveUser = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.sub },
            select: { is_active: true, role: true },
        });

        if (!user || !user.is_active) {
            return res.status(403).json({ message: 'Tài khoản đã bị vô hiệu hóa!' });
        }

        // Cập nhật role từ DB (phòng trường hợp role thay đổi sau khi token được ký)
        req.user.role = user.role;
        next();
    } catch {
        return res.status(500).json({ message: 'Lỗi xác thực người dùng' });
    }
};
```

> [!WARNING]
> Trade-off: Middleware này thêm 1 query DB cho mỗi request. Có thể cache kết quả trong Redis (TTL 30-60s) nếu lo ngại hiệu năng. Hoặc chỉ áp dụng cho các endpoint nhạy cảm (tạo đơn, đổi mật khẩu, thao tác admin).

---

### 🟡 [TRUNG BÌNH] #14 — Error Message Leakage: Lộ chi tiết internal error

**Files**: Tất cả controllers

**Bằng chứng** — Pattern lặp lại ở mọi catch block:

```javascript
catch (error) {
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    //                                                      ^^^^^^^^^^^^^^^^^^^^^^^^
    //  Có thể chứa: tên bảng DB, cấu trúc schema, đường dẫn file, SQL query
}
```

**Ví dụ output thực tế khi Prisma ném lỗi**:
```json
{
    "message": "Lỗi máy chủ",
    "error": "Invalid `prisma.order.findUnique()` invocation: The table `public.orders` does not exist in the current database."
}
```

**Giải pháp**:

```javascript
catch (error) {
    console.error(`[${req.method} ${req.originalUrl}]`, error);   // Log đầy đủ ở server

    return res.status(500).json({
        message: 'Lỗi máy chủ',
        ...(process.env.NODE_ENV === 'development' && { error: error.message }),
        // ↑ Chỉ trả error detail trong môi trường dev
    });
}
```

---

## 📊 Tóm tắt & Ma trận Ưu tiên

| # | Mức độ | Vấn đề | Trụ cột | Nỗ lực vá |
|:--|:-------|:-------|:--------|:----------|
| 1 | 🔴 Cao | Race condition stock âm khi tạo đơn | Logic | ~30 phút |
| 2 | 🔴 Cao | State machine đơn hàng bị gãy, stock không hoàn trả | Logic | ~20 phút |
| 4 | 🔴 Cao | CORS `origin: true` + credentials → CSRF | Security | ~5 phút |
| 5 | 🔴 Cao | Refresh token không thể thu hồi | Security | ~1 giờ |
| 13| 🔴 Cao | User bị khóa vẫn dùng access token | Edge Case | ~20 phút |
| 3 | 🟡 TB | TOCTOU giá sản phẩm | Logic | Đã fix cùng #1 |
| 6 | 🟡 TB | User enumeration qua login | Security | ~10 phút |
| 7 | 🟡 TB | Không có rate limiting | Security | ~15 phút |
| 8 | 🟡 TB | Thiếu security headers | Security | ~5 phút |
| 10| 🟡 TB | 7 PrismaClient instances | Database | ~15 phút |
| 11| 🟡 TB | Thiếu index `orders.status` | Database | ~5 phút |
| 14| 🟡 TB | Lộ error message nội bộ | Edge Case | ~20 phút |
| 9 | 🟢 Thấp | Không validate email format & password strength | Security | ~10 phút |
| 12| 🟢 Thấp | N+1 writes trong transaction | Database | Chấp nhận |

> [!IMPORTANT]
> **Thứ tự vá đề xuất**: #4 (CORS, 5 phút) → #10 (PrismaClient singleton, 15 phút) → #1 (Race condition, 30 phút) → #2 (State machine, 20 phút) → #13 (Active user check, 20 phút) → #7 + #8 (Rate limit + Helmet, 20 phút) → #5 (Refresh token DB) → còn lại.
