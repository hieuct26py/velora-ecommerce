import { Link } from '../router';
import { useCart } from '../contexts/CartContext';

const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85';

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const image = product.images?.[0] || fallbackImage;
  const outOfStock = product.stock_quantity < 1;

  const addToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    await addItem(product);
  };

  return (
    <article className="product-card reveal" style={{ '--reveal-delay': `${index * 55}ms` }}>
      <Link className="product-card-link" to={`/product/${product.id}`}>
        <div className="product-image-frame">
          <img src={image} alt={product.name} loading={index > 3 ? 'lazy' : 'eager'} />
          {outOfStock && <span className="image-flag">Out of stock</span>}
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
        <span className="stock-copy">{outOfStock ? 'Unavailable' : `${product.stock_quantity} in stock`}</span>
        <button className="small-button" type="button" onClick={addToCart} disabled={outOfStock}>
          Add to cart
        </button>
      </div>
    </article>
  );
}
