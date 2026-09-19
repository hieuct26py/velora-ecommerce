import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../utils/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Danh mục chuẩn theo đúng yêu cầu
const TARGET_CATEGORIES = [
  { name: 'iPhone', description: 'Điện thoại thông minh Apple iPhone chính hãng VN/A.' },
  { name: 'iPad', description: 'Máy tính bảng Apple iPad Pro, iPad Air, iPad Gen và iPad mini.' },
  { name: 'Mac', description: 'Máy tính Mac: MacBook Air, MacBook Pro, Mac mini và Mac Studio.' },
  { name: 'Watch', description: 'Đồng hồ thông minh Apple Watch Ultra 2, Series 9 và SE.' },
  { name: 'Âm thanh', description: 'Tai nghe AirPods Pro 2, AirPods 4, AirPods Max và loa HomePod.' },
  { name: 'Phụ kiện', description: 'Phụ kiện Apple chính hãng: Củ sạc, cáp MagSafe, Apple Pencil, bàn phím, ốp lưng.' },
];

async function scanDummyJsonAppleApis() {
  console.log('================================================================');
  console.log('[PHẦN 1] QUÉT CÁC NGUỒN DỮ LIỆU DUMMYJSON THEO YÊU CẦU:');
  console.log('================================================================');

  const sources = [
    { label: 'Tìm kiếm "apple"', url: 'https://dummyjson.com/products/search?q=apple' },
    { label: 'Category "smartphones"', url: 'https://dummyjson.com/products/category/smartphones' },
    { label: 'Category "laptops"', url: 'https://dummyjson.com/products/category/laptops' },
    { label: 'Category "tablets"', url: 'https://dummyjson.com/products/category/tablets' },
  ];

  const appleMap = new Map();

  for (const src of sources) {
    try {
      console.log(`- Đang quét: ${src.label} (${src.url})...`);
      const res = await fetch(src.url);
      if (!res.ok) continue;
      const data = await res.json();
      const products = data.products || [];

      for (const p of products) {
        const brand = String(p.brand || '').toLowerCase();
        const title = String(p.title || '').toLowerCase();
        const cat = String(p.category || '').toLowerCase();

        if (cat === 'groceries' || brand === 'gadgetmaster') continue;

        if (brand === 'apple' || title.includes('apple') || title.includes('iphone') || title.includes('ipad') || title.includes('macbook')) {
          appleMap.set(p.id, {
            id: p.id,
            title: p.title,
            brand: p.brand || 'Apple',
            category: p.category,
            price: p.price,
          });
        }
      }
    } catch (err) {
      console.warn(`  [!] Không thể quét ${src.url}:`, err.message);
    }
  }

  console.log(`\n=> Kết quả quét: Tìm thấy ${appleMap.size} sản phẩm Apple từ các API DummyJSON:`);
  appleMap.forEach((item) => {
    console.log(`   • [ID ${item.id}] ${item.title.padEnd(38)} | Phân loại: ${item.category.padEnd(18)} | Giá: $${item.price}`);
  });
  console.log('----------------------------------------------------------------\n');
}

async function seed100AppleProducts() {
  console.log('================================================================');
  console.log('[PHẦN 2] SEED CHÍNH XÁC 100 SẢN PHẨM APPLE TỪ NĂM 2021 ĐẾN NAY:');
  console.log('================================================================');

  try {
    // 1. Quét nguồn DummyJSON
    await scanDummyJsonAppleApis();

    // 2. Chuẩn hóa 6 danh mục chuẩn trong Database: iPhone, iPad, Mac, Watch, Âm thanh, Phụ kiện
    console.log('[SEED] 1. Khởi tạo & Đồng bộ 6 Danh mục trong PostgreSQL:');

    // Chuyển đổi tên cũ nếu có (Apple Watch -> Watch, AirPods -> Âm thanh, Accessories -> Phụ kiện)
    const existingCats = await prisma.category.findMany();
    const renameMap = {
      'Apple Watch': 'Watch',
      'AirPods': 'Âm thanh',
      'Accessories': 'Phụ kiện',
    };

    for (const [oldName, newName] of Object.entries(renameMap)) {
      const oldRec = existingCats.find((c) => c.name === oldName);
      const newRec = existingCats.find((c) => c.name === newName);
      if (oldRec && !newRec) {
        await prisma.category.update({
          where: { id: oldRec.id },
          data: { name: newName },
        });
        console.log(`  ↻ Đã đổi tên danh mục "${oldName}" thành "${newName}"`);
      }
    }

    const categoryMap = new Map();
    for (const cat of TARGET_CATEGORIES) {
      const record = await prisma.category.upsert({
        where: { name: cat.name },
        update: { description: cat.description },
        create: {
          name: cat.name,
          description: cat.description,
        },
      });
      categoryMap.set(cat.name, record.id);
      console.log(`  ✓ Danh mục: "${record.name}" (ID: ${record.id})`);
    }

    // 3. Đọc dữ liệu từ file apple_products_100.json
    const jsonPath = path.join(__dirname, 'apple_products_100.json');
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Không tìm thấy file dataset tại ${jsonPath}. Hãy chạy node prisma/generate_dataset.js trước.`);
    }

    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    const productsData = JSON.parse(fileContent);

    console.log(`\n[SEED] 2. Nạp mảng JSON gồm ${productsData.length} sản phẩm Apple chuẩn sale...`);

    if (productsData.length !== 100) {
      console.warn(`[CẢNH BÁO] Số lượng sản phẩm là ${productsData.length}, kỳ vọng chính xác 100 sản phẩm.`);
    }

    // 4. Tiến hành upsert từng sản phẩm với phân phối tồn kho logic:
    // - ~10% hết hàng (stock = 0)
    // - ~25% sắp hết hàng / khan hiếm (stock = 1..4)
    // - ~65% sẵn hàng dồi dào (stock = 15..85)
    console.log('\n[SEED] 3. Tiến hành lưu trữ vào Database với phân bổ tồn kho thực tế:');

    let insertedCount = 0;
    let updatedCount = 0;
    let outOfStockCount = 0;
    let lowStockCount = 0;
    let inStockCount = 0;

    const categoryStats = {};

    for (let index = 0; index < productsData.length; index++) {
      const p = productsData[index];
      const categoryId = categoryMap.get(p.category);

      if (!categoryId) {
        console.warn(`  [BỎ QUA] Không tìm thấy category "${p.category}" cho sản phẩm: ${p.name}`);
        continue;
      }

      // Logic tồn kho:
      // Sản phẩm thứ 0, 10, 25, 40, 55, 70, 85, 95 hết hàng (stock = 0)
      // Các sản phẩm có chỉ số chia hết cho 4 hoặc 7: còn ít hàng (stock 1-4)
      // Còn lại: sẵn hàng dồi dào (stock 15-85)
      let stockQuantity;
      if (index % 12 === 3) {
        stockQuantity = 0;
        outOfStockCount++;
      } else if (index % 4 === 1) {
        stockQuantity = Math.floor(Math.random() * 4) + 1; // 1 to 4
        lowStockCount++;
      } else {
        stockQuantity = Math.floor(Math.random() * 70) + 15; // 15 to 84
        inStockCount++;
      }

      const productPayload = {
        name: p.name,
        description: p.description,
        price: Number(p.price),
        category_id: categoryId,
        stock_quantity: stockQuantity,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [],
        is_active: true,
      };

      const existing = await prisma.product.findFirst({
        where: { name: p.name },
      });

      const stockTag = stockQuantity === 0
        ? '[HẾT HÀNG] '
        : stockQuantity <= 4
        ? `[CÒN ${stockQuantity} CÁI]`
        : `[TỒN ${String(stockQuantity).padStart(2)}]`;

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: productPayload,
        });
        updatedCount++;
        console.log(`  ↻ [${p.category.padEnd(8)}] ${p.name.padEnd(52)} | $${String(p.price).padEnd(7)} | ${stockTag}`);
      } else {
        await prisma.product.create({
          data: productPayload,
        });
        insertedCount++;
        console.log(`  + [${p.category.padEnd(8)}] ${p.name.padEnd(52)} | $${String(p.price).padEnd(7)} | ${stockTag}`);
      }

      categoryStats[p.category] = (categoryStats[p.category] || 0) + 1;
    }

    console.log('\n================================================================');
    console.log('TỔNG KẾT QUÁ TRÌNH SEEDING DỮ LIỆU:');
    console.log('================================================================');
    console.log(`• Tổng số sản phẩm đã xử lý: ${insertedCount + updatedCount} / ${productsData.length}`);
    console.log(`  - Thêm mới           : ${insertedCount}`);
    console.log(`  - Cập nhật          : ${updatedCount}`);
    console.log(`• Thống kê tồn kho thực tế:`);
    console.log(`  - Hết hàng (0 cái)  : ${outOfStockCount} sản phẩm`);
    console.log(`  - Còn ít (1-4 cái)  : ${lowStockCount} sản phẩm (Kích hoạt badge Low-stock)`);
    console.log(`  - Dồi dào (15-84)   : ${inStockCount} sản phẩm`);
    console.log(`• Phân bố theo 6 Danh mục:`);
    for (const [catName, count] of Object.entries(categoryStats)) {
      console.log(`  - ${catName.padEnd(10)}: ${count} sản phẩm`);
    }
    console.log('================================================================\n');

  } catch (err) {
    console.error('[SEED LỖI]:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log('[SEED] Đã ngắt kết nối an toàn với cơ sở dữ liệu.');
  }
}

seed100AppleProducts();
