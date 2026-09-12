import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const marker = '[Velora Apple demo seed]';
const sourceUrls = [
  'https://dummyjson.com/products/search?q=apple',
  'https://dummyjson.com/products/category/smartphones',
];

const categoryDefinitions = {
  iPhone: 'Apple iPhone models and Pro devices.',
  iPad: 'Apple iPad tablets for work, study, and creative use.',
  Mac: 'Apple Mac laptops and desktop computers.',
  AirPods: 'Apple wireless audio and headphones.',
  'Apple Watch': 'Apple Watch devices and wearable essentials.',
  Accessories: 'Chargers, MagSafe, HomePod, and Apple ecosystem accessories.',
};

function categoryFor(product) {
  const title = product.title.toLowerCase();
  if (title.includes('iphone')) return 'iPhone';
  if (title.includes('ipad')) return 'iPad';
  if (title.includes('macbook') || title.includes('imac')) return 'Mac';
  if (title.includes('airpod')) return 'AirPods';
  if (title.includes('watch')) return 'Apple Watch';
  return 'Accessories';
}

function isAppleProduct(product) {
  const title = product.title.toLowerCase();
  const brand = String(product.brand || '').toLowerCase();
  if (product.category === 'groceries') return false;
  return brand === 'apple'
    || title.includes('iphone')
    || title.includes('ipad')
    || title.includes('macbook')
    || title.includes('airpod')
    || title.includes('apple watch')
    || title.includes('homepod')
    || title.includes('magsafe')
    || title.includes('charger');
}

async function fetchProducts() {
  const responses = await Promise.all(sourceUrls.map(async (url) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`DummyJSON request failed: ${response.status} ${url}`);
    return response.json();
  }));

  const uniqueProducts = new Map();
  responses.flatMap((response) => response.products).filter(isAppleProduct).forEach((product) => {
    uniqueProducts.set(product.title.toLowerCase(), product);
  });
  return [...uniqueProducts.values()];
}

async function main() {
  const sourceProducts = await fetchProducts();
  const categories = new Map();

  for (const [name, description] of Object.entries(categoryDefinitions)) {
    const category = await prisma.category.upsert({
      where: { name },
      update: { description },
      create: { name, description },
    });
    categories.set(name, category.id);
  }

  await prisma.product.deleteMany({
    where: { description: { startsWith: marker } },
  });

  const seededProducts = sourceProducts.map((product, index) => ({
    categoryName: categoryFor(product),
    name: product.title,
    description: `${marker} ${product.description}`,
    price: Number(product.price),
    stock_quantity: 4 + ((index * 7) % 15),
    category_id: categories.get(categoryFor(product)),
    images: Array.isArray(product.images) && product.images.length ? product.images.slice(0, 4) : [product.thumbnail],
  }));

  for (const product of seededProducts) {
    const { categoryName, ...data } = product;
    await prisma.product.create({ data });
  }

  const summary = Object.fromEntries(Object.keys(categoryDefinitions).map((name) => [
    name,
    seededProducts.filter((product) => product.categoryName === name).length,
  ]));

  console.log(`Seeded ${seededProducts.length} Apple demo products from DummyJSON.`);
  console.log('Category distribution:', summary);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
