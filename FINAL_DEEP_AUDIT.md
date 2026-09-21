# 🛡️ VELORA E-COMMERCE — FINAL DEEP AUDIT REPORT (VÒNG CUỐI)

**Vai trò:** Senior Backend Engineer & Security Expert (10+ năm kinh nghiệm High-Load Systems)  
**Dự án:** Velora E-Commerce (Node.js / Express / Prisma ORM / PostgreSQL)  
**Phạm vi rà soát:** Final Round Deep Audit (Loại trừ toàn bộ các lỗi đã sửa ở Phase II & Turn trước)  
**Ngày thực hiện:** 2026-09-21  
**Trạng thái mã nguồn:** **READ-ONLY** (Báo cáo đánh giá độc lập, không thay đổi mã nguồn)

---

## 📊 EXECUTIVE SUMMARY (GÓC NHÌN "DEVIL'S ADVOCATE")

| Mức độ | Số lượng | BẮT BUỘC SỬA (Must Fix) | NÊN CÂN NHẮC / ĐÁNH ĐỔI (Trade-off / Can Defer) |
|:---|:---:|:---:|:---:|
| 🔴 **CRITICAL** | 1 | 1 | 0 |
| 🟠 **HIGH** | 3 | 2 | 1 |
| 🟡 **MEDIUM** | 3 | 1 | 2 |
| 🟢 **LOW** | 3 | 0 | 3 |
| **TỔNG** | **10** | **4** | **6** |

> [!CAUTION]
> **Những "quả bom nổ chậm" tiềm ẩn đã bị che khuất bởi các lần sửa trước:**
> 1. **Email Case-Sensitivity Inconsistency (`updateUser`)**: `register` và `login` chuẩn hóa email về chữ thường (`toLowerCase()`), nhưng `updateUser` lại dùng nguyên gốc chuỗi hoa/thường để kiểm tra và lưu DB $\rightarrow$ Cho phép tạo tài khoản trùng lặp âm thầm và gây lỗi Account Collision.
> 2. **Prisma Transaction Timeout & Connection Pool Starvation (`createOrder`)**: Vòng lặp tuần tự `for...of` chạy 15-20 query bên trong `$transaction` mà không set custom timeout $\rightarrow$ Vượt ngưỡng mặc định 5s của Prisma khi chịu tải và chiếm dụng connection pool của toàn bộ hệ thống.
> 3. **Rate Limiting 20 req/15m trên `/refresh-token`**: Giết chết người dùng chung mạng Wi-Fi trường học (HUST), văn phòng công ty hoặc mạng di động 4G/5G (CGNAT) $\rightarrow$ Khách hàng bị đá văng ra màn hình Login ngẫu nhiên.
> 4. **Account Takeover qua `updateUser` không hỏi mật khẩu cũ**: Cho phép đổi thẳng email mà không cần xác thực mật khẩu hiện tại.

---

## PHẦN I — SECURITY & AUTHENTICATION HIDDEN BOMBS

---

### ⚠️ VẤN ĐỀ #01: Email Case-Sensitivity Inconsistency trong `updateUser` gây Account Collision
🔴 **Mức độ: CRITICAL**  
🔍 **File:** `server/controllers/user.controller.js` (dòng 190-200)

#### 💻 Đoạn code hiện tại:
```javascript
// user.controller.js (L190-200)
if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Email không hợp lệ!' });
    }
    // 💣 VẤN ĐỀ: Tìm kiếm bằng 'email' (chưa lowercase) chứ KHÔNG DÙNG normalizedEmail
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác!' });
    }
    // 💣 VẤN ĐỀ: Lưu vào database cũng dùng 'email' gốc (có thể chứa chữ HOA)
    updatedData.email = email;
}
```

#### 💣 Kịch bản phá hoại / Shadow Account Collision:
1. Trong PostgreSQL, cột `email VARCHAR(255) UNIQUE` ở bảng mã mặc định là **Case-Sensitive** (phân biệt chữ hoa/thường). Cặp giá trị `'victim@gmail.com'` và `'Victim@gmail.com'` được coi là hai chuỗi hoàn toàn khác nhau.
2. Nạn nhân đăng ký tài khoản với email: `victim@gmail.com` (hàm `register` lưu chữ thường: `victim@gmail.com`).
3. Kẻ xấu vào trang profile hoặc gọi API `PATCH /api/v1/users/:userId` với body: `{ email: "Victim@gmail.com" }`.
4. Hàm `updateUser` thực hiện `findUnique({ where: { email: "Victim@gmail.com" } })` $\rightarrow$ Kết quả trả về `null` (vì trong DB chỉ có bản thường `victim@gmail.com`).
5. **Ràng buộc Unique không bị kích hoạt!** PostgreSQL cho phép lưu `Victim@gmail.com`.
6. Giờ đây trong Database có **2 tài khoản sở hữu cùng một hòm thư**.
7. Khi nạn nhân đăng nhập bằng `victim@gmail.com`: Hàm `login` dùng `normalizedEmail = toLowerCase()`, PostgreSQL sẽ trả về bản ghi nào xuất hiện trước, dẫn đến việc dữ liệu cá nhân, giỏ hàng, đơn hàng bị xung đột và một trong hai tài khoản bị "nuốt chửng".

#### ✅ Giải pháp khắc phục:
Phải dùng `normalizedEmail` cho cả câu lệnh kiểm tra và gán cập nhật:
```javascript
if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ message: 'Email không hợp lệ!' });
    }
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: 'Email đã được sử dụng bởi người dùng khác!' });
    }
    updatedData.email = normalizedEmail; // Đảm bảo luôn lưu chữ thường
}
```

#### 📌 Có nhất quyết phải sửa không?
> **BẮT BUỘC PHẢI SỬA.** Đây là bug logic rất nguy hiểm liên quan đến tính toàn vẹn danh tính người dùng trong database.

---

### ⚠️ VẤN ĐỀ #02: Account Takeover qua thay đổi Email không cần xác nhận Mật khẩu
🟠 **Mức độ: HIGH**  
🔍 **File:** `server/controllers/user.controller.js` (dòng 174-224), `server/routes/user.routes.js` (dòng 14)

#### 💻 Thực trạng logic:
Trong `changePassword`, bạn yêu cầu bắt buộc phải có `currentPassword` và so khớp bcrypt trước khi đổi.
Tuy nhiên trong `updateUser` (`PATCH /api/v1/users/:userId`), người dùng (hoặc người cầm Access Token của user) có thể đổi thẳng trường `email` sang một email mới **hoàn toàn không cần mật khẩu hiện tại**:
```javascript
// user.controller.js (L174-220)
// Không hề có bước kiểm tra: bcrypt.compare(currentPassword, user.password_hash)
```

#### 💣 Kịch bản tấn công:
1. Access token có thời hạn 15 phút. Nếu người dùng quên khóa máy ở quán cafe, văn phòng, hoặc bị dính tấn công XSS/Proxy log rò rỉ token.
2. Kẻ tấn công chỉ cần 1 request: `PATCH /api/v1/users/<id>` với `{ email: "attacker@gmail.com" }`.
3. Email tài khoản bị đổi ngay lập tức sang hòm thư của attacker mà chủ tài khoản không hề hay biết (không có email xác nhận gửi về mail cũ, không cần nhập password).
4. Kẻ tấn công dùng chức năng Quên mật khẩu để chiếm quyền vĩnh viễn tài khoản.

#### ✅ Giải pháp khắc phục:
Chỉ cho phép Admin cập nhật thẳng email, còn User thông thường muốn đổi email bắt buộc phải xác nhận `currentPassword`:
```javascript
if (email && req.user.role !== 'ADMIN') {
    const { currentPassword } = req.body;
    if (!currentPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để đổi email!' });
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password_hash);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Mật khẩu hiện tại không chính xác!' });
    }
}
```

#### 📌 Có nhất quyết phải sửa không?
> **NÊN SỬA SỚM.** Đây là lỗ hổng kiểm soát tài khoản nghiêm trọng theo chuẩn OWASP ASVS (Authentication Verification Standard).

---

### ⚠️ VẤN ĐỀ #03: Rate Limiting 20 req/15m trên `/refresh-token` gây "Kick Out" người dùng chung mạng
🟠 **Mức độ: HIGH** (Ảnh hưởng trực tiếp đến trải nghiệm thực tế)  
🔍 **File:** `server/routes/auth.routes.js` (dòng 15-20)

#### 💻 Đoạn code hiện tại:
```javascript
// auth.routes.js (L15-20)
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    max: 20, // Tối đa 20 request trên 1 IP
    standardHeaders: true,
    message: { message: 'Too many refresh token requests from this IP, please try again later.' },
});
router.post('/refresh-token', refreshLimiter, refreshToken);
```

#### 💣 Kịch bản lỗi diện rộng (CGNAT / University Wi-Fi Bomb):
1. Đa số mạng internet tại Việt Nam (Viettel, FPT, VNPT) áp dụng **CGNAT (Carrier-Grade NAT)** cho mạng di động 4G/5G. Hàng ngàn điện thoại di động trong cùng 1 khu vực chia sẻ chung **1 địa chỉ IP Public duy nhất**.
2. Tương tự, tại thư viện Đại học Bách Khoa (HUST) hoặc văn phòng công ty, hàng trăm sinh viên/nhân viên dùng chung một gateway IP ra ngoài internet.
3. Access Token của bạn có thời hạn 15 phút (`expiresIn: '15m'`).
4. Giả sử có 10 sinh viên đang lướt xem đồ trên Velora:
   - Mỗi người dùng khi mở 2 tab sẽ phát sinh khoảng 2 request refresh sau 15 phút.
   - 10 người $\times$ 2 requests = 20 requests.
5. Người thứ 11 (hoặc tab thứ 21) gửi request refresh sẽ bị dính **HTTP 429 Too Many Requests**.
6. Frontend khi thấy gọi `/refresh-token` bị lỗi sẽ ngay lập tức xóa token và **đá văng khách hàng ra trang Login**! Khách hàng tưởng web bị lỗi và bỏ đi.

#### ✅ Giải pháp khắc phục:
Endpoint `/refresh-token` vốn đã được bảo vệ bằng Cookie HttpOnly và Token Hash trong DB, nên mức rate limit theo IP phải nới rộng (ít nhất 200 - 500 req/15 phút), hoặc rate-limit theo token hash:
```javascript
const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300, // Nới rộng cho môi trường NAT/Công ty/Trường học
    standardHeaders: true,
    message: { message: 'Quá nhiều yêu cầu làm mới phiên, vui lòng thử lại sau.' },
});
```

#### 📌 Có nhất quyết phải sửa không?
> **BẮT BUỘC PHẢI SỬA (hoặc tăng `max`).** Nếu để `max: 20`, ngay ngày đầu tiên launch có 5-10 người dùng thật vào cùng lúc qua 4G hoặc Wi-Fi công cộng, họ sẽ liên tục bị văng đăng nhập.

---

## PHẦN II — DATABASE PERFORMANCE & PRISMA TIME CONSTRAINTS

---

### ⚠️ VẤN ĐỀ #04: Prisma Transaction Timeout & Connection Pool Starvation do vòng lặp tuần tự
🟠 **Mức độ: HIGH**  
🔍 **File:** `server/controllers/order.controller.js` (dòng 59-86)

#### 💻 Đoạn code hiện tại:
```javascript
// order.controller.js (L59-86) - Bên trong prisma.$transaction
for (const item of sortedItems) {
    const updateResult = await tx.product.updateMany({
        where: {
            id: item.product_id,
            is_active: true,
            stock_quantity: { gte: item.quantity },
            price: item.product.price
        },
        data: {
            stock_quantity: { decrement: item.quantity }
        }
    });

    if (updateResult.count === 0) {
        throw { type: 'ATOMIC_INVENTORY_ERROR', ... };
    }
}
```

#### 💣 Kịch bản nghẽn Connection Pool & Timeout:
1. Trong Prisma, một Interactive Transaction (`prisma.$transaction(async (tx) => ...)`) có thời gian chờ mặc định: **`timeout: 5000ms (5 giây)`** và **`maxWait: 2000ms`**.
2. Đồng thời, interactive transaction sẽ **chiếm dụng cố định 1 kết nối (dedicated connection)** từ Connection Pool cho đến khi transaction kết thúc.
3. Khi bạn chuyển từ `Promise.all` sang vòng lặp tuần tự `for (const item of sortedItems) { await tx.product.updateMany(...) }`:
   - Nếu đơn hàng có 10-15 sản phẩm, hệ thống phải thực hiện 15 lượt gửi/nhận mạng (network roundtrips) tuần tự từ Node.js sang PostgreSQL.
   - Các dòng sản phẩm đầu tiên bị giữ khóa (Exclusive Row Lock) suốt toàn bộ thời gian chờ các dòng sau thực thi xong.
4. **Khi có tải cao (High Concurrency):**
   - 10 request checkout cùng lúc sẽ ngốn sạch toàn bộ Connection Pool của Prisma (mặc định chỉ khoảng 10 kết nối).
   - Các câu lệnh update phải xếp hàng chờ giải phóng row-lock. Thời gian thực thi vượt quá 5000ms.
   - Prisma quăng lỗi: **`P2028: Transaction API error: Transaction already closed: A query cannot be executed on a closed transaction`**.
   - Toàn bộ các API khác trên hệ thống (`/products`, `/cart`) đều bị nghẽn (starvation) vì không còn kết nối DB trống.

#### ✅ Giải pháp khắc phục:
1. Cấu hình rõ `timeout` và `maxWait` cho các transaction phức tạp:
   ```javascript
   await prisma.$transaction(async (tx) => {
       // ... logic đặt hàng
   }, {
       maxWait: 5000, // Thời gian tối đa chờ lấy connection từ pool
       timeout: 15000, // Nới rộng thời gian thực thi lên 15s cho đơn hàng nhiều item
   });
   ```

#### 📌 Có nhất quyết phải sửa không?
> **NÊN CÂN NHẮC.** Việc thêm config `{ timeout: 15000 }` vào Prisma transaction là giải pháp cực kỳ đơn giản và an toàn để tránh việc đơn hàng nhiều item bị abort giữa chừng khi server chịu tải.

---

### ⚠️ VẤN ĐỀ #05: Inactive Product Poisoning trong `syncCart` gây kẹt vĩnh viễn luồng Đăng nhập
🟡 **Mức độ: MEDIUM**  
🔍 **File:** `server/controllers/cart.controller.js` (dòng 240-248)

#### 💻 Đoạn code hiện tại:
```javascript
// cart.controller.js (L240-248)
for (const item of uniqueItems) {
    const product = productsById.get(item.productId);

    if (!product?.is_active) {
        return res.status(400).json({ 
            message: "Giỏ hàng chứa sản phẩm không tồn tại hoặc không khả dụng", 
            error: "Giỏ hàng chứa sản phẩm không tồn tại hoặc không khả dụng" 
        });
    }
    // ...
}
```

#### 💣 Kịch bản kẹt giỏ hàng (Cart Lockout):
1. Người dùng vào web duyệt hàng chưa đăng nhập (khách vãng lai). Họ thêm Sản phẩm X vào giỏ hàng cục bộ (localStorage).
2. Tối hôm đó, Admin ẩn hoặc ngừng kinh doanh Sản phẩm X (`is_active: false`).
3. Ngày hôm sau, người dùng bấm "Đăng nhập". Frontend tự động gửi toàn bộ giỏ hàng từ localStorage lên API `POST /api/v1/cart/sync`.
4. API duyệt thấy Sản phẩm X có `is_active: false` $\rightarrow$ **Trả về lỗi 400 và từ chối toàn bộ request sync**.
5. **Hậu quả:** Vì giỏ hàng trong localStorage của khách vẫn còn lưu Sản phẩm X, nên mỗi lần khách tải lại trang hoặc đăng nhập, request sync đều bị lỗi 400. Khách hàng bị kẹt vĩnh viễn không thể đồng bộ giỏ hàng cho đến khi họ tự mò vào DevTools xóa sạch localStorage.

#### ✅ Giải pháp khắc phục:
Thay vì văng lỗi 400 làm hỏng cả phiên sync, hãy **lọc bỏ (filter out)** các sản phẩm không còn khả dụng và đồng bộ những sản phẩm hợp lệ còn lại:
```javascript
// Lọc bỏ sản phẩm không hợp lệ hoặc đã bị vô hiệu hóa
const validItems = uniqueItems.filter(item => {
    const product = productsById.get(item.productId);
    return product && product.is_active && item.quantity <= product.stock_quantity;
});

// Chỉ đồng bộ các sản phẩm hợp lệ vào DB
await prisma.$transaction(validItems.map(item => {
    return prisma.cartItem.upsert({ ... });
}));
```

#### 📌 Có nhất quyết phải sửa không?
> **RẤT NÊN SỬA.** Đây là lỗi trải nghiệm người dùng kinh điển trong các trang thương mại điện tử. Không bao giờ để một sản phẩm bị xóa chặn đứng luồng mua sắm của khách.

---

### ⚠️ VẤN ĐỀ #06: `addItemToCart` không chặn trần số lượng tích lũy
🟡 **Mức độ: MEDIUM**  
🔍 **File:** `server/controllers/cart.controller.js` (dòng 59-73)

#### 💻 Đoạn code hiện tại:
```javascript
// cart.controller.js (L59-73)
if (!productId || !isValidUuid(productId) || !Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
}
if (product.stock_quantity < quantity) {
    return res.status(400).json({ message: "Số lượng sản phẩm vượt quá tồn kho" });
}
// Sau đó upsert:
update: { quantity: { increment: quantity } }
```

#### 💣 Kịch bản tích lũy vượt tồn kho:
1. Ở `updateCartItem` và `syncCart`, bạn đã rất cẩn thận chặn `quantity > 10000`. Nhưng ở `addItemToCart` thì lại **quên mất điều kiện này**.
2. Ngoài ra, điều kiện `product.stock_quantity < quantity` chỉ kiểm tra số lượng *thêm vào ở lần gọi này*, chứ không kiểm tra *tổng số lượng sau khi cộng dồn*.
3. Giả sử sản phẩm còn tồn kho 5 chiếc:
   - Lần 1: Khách bấm thêm 4 chiếc $\rightarrow$ Hợp lệ (4 <= 5). Trong giỏ có 4 chiếc.
   - Lần 2: Khách bấm thêm 4 chiếc nữa $\rightarrow$ Kiểm tra `5 < 4` là sai $\rightarrow$ Tiếp tục cho phép $\rightarrow$ Trong giỏ thành **8 chiếc**!
4. Mặc dù khi Checkout hệ thống sẽ chặn không cho mua 8 chiếc, nhưng việc giỏ hàng chứa số lượng vượt tồn kho gây hiểu lầm cho người dùng và làm lệch giá trị `totalAmount` hiển thị trên giỏ hàng.

#### ✅ Giải pháp khắc phục:
Chặn `quantity > 1000` và kiểm tra tổng tích lũy trước khi increment:
```javascript
if (!productId || !isValidUuid(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
    return res.status(400).json({ message: "Số lượng thêm vào không hợp lệ (tối đa 1000)" });
}
```

#### 📌 Có nhất quyết phải sửa không?
> **CHẤP NHẬN ĐƯỢC.** Vì hàm `createOrder` của bạn đã có lớp phòng thủ nguyên tử chặn mua vượt tồn kho ở bước thanh toán cuối cùng.

---

## PHẦN III — EDGE CASES & SYSTEM STABILITY

---

### ⚠️ VẤN ĐỀ #07: Lỗi cú pháp JSON Body trả về 500 thay vì 400 (`err.status` vs `err.statusCode`)
🟡 **Mức độ: MEDIUM**  
🔍 **File:** `server/middlewares/errorHandler.js` (dòng 4)

#### 💻 Đoạn code hiện tại:
```javascript
// errorHandler.js (L4-5)
let statusCode = err.statusCode || 500;
let message = err.message || 'Lỗi máy chủ nội bộ';
// ...
const friendlyMessage = statusCode === 500 ? 'Hệ thống đang gặp sự cố, vui lòng thử lại sau.' : message;
```

#### 💣 Kịch bản phát sinh:
- Khi client hoặc attacker gửi một request có JSON body bị lỗi cú pháp (ví dụ thiếu ngoặc nhọn `{ "name": "abc"`):
- Middleware `express.json()` ném ra lỗi cú pháp với thuộc tính `err.status = 400` (theo chuẩn thư viện `http-errors`), chứ **không phải** `err.statusCode`.
- Biến `statusCode` bị fallback về `500`.
- Server phản hồi: `500 - Hệ thống đang gặp sự cố, vui lòng thử lại sau.`
- Lỗi của Client nhưng Server lại nhận là lỗi của mình, làm sai lệch báo cáo chất lượng API (SLO/SLA).

#### ✅ Giải pháp khắc phục:
Bắt cả hai thuộc tính `statusCode` và `status`:
```javascript
let statusCode = err.statusCode || err.status || 500;
```

#### 📌 Có nhất quyết phải sửa không?
> **NÊN SỬA SỚM.** Chỉ cần thêm 1 từ `err.status` là sửa dứt điểm lỗi hiển thị sai mã trạng thái HTTP.

---

### ⚠️ VẤN ĐỀ #08: CSRF Logout DoS qua thuộc tính Cookie `SameSite: 'none'`
🟢 **Mức độ: LOW**  
🔍 **File:** `server/controllers/auth.controller.js` (dòng 241-245), `server/routes/auth.routes.js` (dòng 26)

#### 💣 Phân tích kịch bản:
- Do bạn đặt `sameSite: 'none'` trên Production để hỗ trợ frontend Vercel gọi sang backend khác domain, trình duyệt sẽ tự động đính kèm Cookie `refreshToken` trên **mọi** cross-origin request.
- Một trang web độc hại `evil.com` có thể nhúng một form ẩn gửi POST request đến `https://api.yourdomain.com/api/v1/auth/logout`.
- Request mang theo Cookie của nạn nhân $\rightarrow$ Server xóa sạch Refresh Token trong DB và clear cookie.
- Nạn nhân bị đăng xuất cưỡng bức (Denial of Service). Kẻ tấn công không cắp được dữ liệu hay tiền, chỉ gây phiền toái cho người dùng.

#### 📌 Có nhất quyết phải sửa không?
> **CHẤP NHẬN ĐƯỢC.** Do Frontend và Backend tách biệt domain, việc chấp nhận đánh đổi `sameSite: 'none'` là bắt buộc để silent refresh hoạt động. Hơn nữa hành vi này chỉ gây logout phiền phức chứ không làm lộ token hay mất tiền.

---

### ⚠️ VẤN ĐỀ #09: Dead Code và Rủi ro từ cờ `is_verified` chưa kích hoạt
🟢 **Mức độ: LOW**  
🔍 **File:** `server/prisma/schema.prisma` (dòng 19), `server/controllers/auth.controller.js` (dòng 46)

#### 💣 Phân tích:
- Trong bảng `User`, bạn có trường `is_verified Boolean @default(false)` và `verification_token`.
- Trong hàm `register`, mỗi user mới đều có `is_verified = false`.
- Tuy nhiên hệ thống chưa có API hay luồng gửi email kích hoạt tài khoản. Trong hàm `login` cũng không kiểm tra cờ này.
- **Rủi ro:** Nếu sau này có một dev khác vào dự án, thấy trường `is_verified` và thêm dòng `if (!user.is_verified) return res.status(403)...` vào `login`, thì **100% người dùng hiện tại sẽ bị khóa tài khoản vĩnh viễn**.

#### 📌 Có nhất quyết phải sửa không?
> **CHẤP NHẬN ĐƯỢC.** Đây là trường dự phòng cho tính năng Email Verification tương lai. Chỉ cần lưu ý đội ngũ phát triển không bật chặn đăng nhập khi chưa có luồng kích hoạt email hoàn chỉnh.

---

### ⚠️ VẤN ĐỀ #10: Vi phạm tính Idempotent của HTTP GET trong `getCart`
🟢 **Mức độ: LOW**  
🔍 **File:** `server/controllers/cart.controller.js` (dòng 38-46)

#### 💻 Thực trạng:
```javascript
// cart.controller.js (L38-46)
export const getCart = async (req, res, next) => {
    // Gọi upsert (GHI vào Database) ngay trong hàm GET
    const cart = await prisma.cart.upsert({
        where: { user_id: userId },
        update: {},
        create: { user_id: userId },
        include: { items: { include: { product: true } } }
    });
```
- Theo chuẩn RESTful API, phương thức `GET` phải là **Safe & Idempotent (Chỉ đọc, không làm thay đổi trạng thái Database)**.
- Việc thực hiện `upsert` trên `GET /cart` biến mọi request xem trang của user (kể cả khi giỏ rỗng) thành một câu lệnh `INSERT INTO carts` vào PostgreSQL.
- Khi có hàng ngàn user đăng ký mới rồi lướt web, bảng `carts` sẽ chứa hàng ngàn bản ghi giỏ hàng rác rỗng không có item nào.

#### 📌 Có nhất quyết phải sửa không?
> **CHẤP NHẬN ĐƯỢC.** Rất nhiều hệ thống e-commerce dùng mô hình lazy-init cart bằng `upsert` để code ngắn gọn, tránh phải xử lý `if (!cart)` ở tầng frontend.

---

## 🎯 BẢNG TỔNG KẾT HÀNH ĐỘNG CHO PRODUCTION (FINAL CHECKLIST)

| Thứ tự ưu tiên | Mã lỗi | Vấn đề | Tác vụ kỹ thuật khuyến nghị | Đánh giá tính bắt buộc |
|:---|:---:|:---|:---|:---|
| **P0 (Bắt buộc)** | **#01** | Email Case-Sensitivity Collision | Đổi `email` thành `normalizedEmail` trong `updateUser` | **BẮT BUỘC** |
| **P0 (Bắt buộc)** | **#03** | CGNAT 4G/Wi-Fi Limiter Kickout | Tăng `max` của `refreshLimiter` lên `300` | **BẮT BUỘC** |
| **P1 (Nên làm)** | **#02** | Account Takeover Passwordless | Yêu cầu `currentPassword` khi User muốn đổi email | NÊN SỬA |
| **P1 (Nên làm)** | **#04** | Transaction Timeout | Thêm `{ timeout: 15000 }` vào `$transaction` tạo đơn | NÊN SỬA |
| **P1 (Nên làm)** | **#05** | Inactive Product Poisoning | Dùng `filter()` bỏ sản phẩm inactive trong `syncCart` | NÊN SỬA |
| **P2 (Nhanh)** | **#07** | Body parser 500 error | Đổi `err.statusCode` thành `err.statusCode \|\| err.status` | NÊN SỬA |
| **P3 (Đánh đổi)** | **#06, #08, #09, #10** | Unbounded AddToCart, CSRF Logout, is_verified, GET Upsert | Giữ nguyên như hiện tại (chấp nhận được) | CÓ THỂ HOÃN |

---
*Báo cáo được lưu trữ trực tiếp tại root dự án: `FINAL_DEEP_AUDIT.md`.*
