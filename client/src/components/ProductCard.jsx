/* eslint-disable react-refresh/only-export-components */
import { Link } from '../router';
import { useCart } from '../contexts/CartContext';

const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85';

export function getProductTypeClass(product) {
  const image = Array.isArray(product?.images) ? product.images[0] : (product?.image || '');
  const isAppleSource = typeof image === 'string' && (image.includes('apple.com') || image.includes('cdn-apple'));
  const cat = (product?.category?.name || product?.category || '').toLowerCase();
  const name = (product?.name || '').toLowerCase();

  const isIPhoneOrIPad =
    cat.includes('iphone') || name.includes('iphone') ||
    cat.includes('ipad') || name.includes('ipad');

  // iPhone, iPad mà nguồn ảnh từ Apple thì zoom to lên cho dễ nhìn
  if (isIPhoneOrIPad && isAppleSource) {
    return 'frame-apple-zoom';
  }

  // Lấy ảnh từ dummy hoặc các dòng sản phẩm khác thì giữ nguyên chuẩn mực ban đầu
  return 'frame-default';
}

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const image = product.images?.[0] || fallbackImage;
  const stock = product.stock_quantity ?? 0;
  const outOfStock = stock < 1;
  const lowStock = stock > 0 && stock <= 3;
  const typeClass = getProductTypeClass(product);

  const addToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (outOfStock) return;
    await addItem(product);
  };

  return (
    <article
      className={`product-card reveal ${outOfStock ? 'product-card-out' : ''}`}
      style={{ '--reveal-delay': `${index * 45}ms` }}
    >
      <Link className="product-card-link" to={`/product/${product.id}`}>
        <div className={`product-image-frame ${typeClass}`}>
          <img
            src={image}
            alt={product.name}
            className={outOfStock ? 'image-dimmed' : ''}
            loading={index > 3 ? 'lazy' : 'eager'}
          />
          {outOfStock && <span className="image-flag image-flag-danger">Sold out</span>}
          {!outOfStock && lowStock && (
            <span className="image-flag image-flag-warning">Only {stock} left</span>
          )}
        </div>
        <div className="product-card-copy">
          <div>
            <p className="eyebrow">{product.category?.name || 'Apple collection'}</p>
            <h3>{product.name}</h3>
          </div>
          <strong className="price">${Number(product.price).toFixed(2)}</strong>
        </div>
      </Link>

      <div className="product-card-footer">
        <span className={`stock-copy ${outOfStock ? 'stock-copy-danger' : lowStock ? 'stock-copy-warning' : ''}`}>
          {outOfStock ? 'Out of stock' : `${stock} in stock`}
        </span>
        <button
          className={`small-button ${outOfStock ? 'small-button-disabled' : 'small-button-action'}`}
          type="button"
          onClick={addToCart}
          disabled={outOfStock}
          aria-label={outOfStock ? 'Item sold out' : `Add ${product.name} to cart`}
        >
          {outOfStock ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
