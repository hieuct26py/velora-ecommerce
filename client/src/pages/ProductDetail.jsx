import { useEffect, useState } from 'react';
import { catalogApi } from '../api';
import { useCart } from '../contexts/CartContext';
import { Link, useRoute } from '../router';
import QuantityControl from '../components/QuantityControl';

const fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85';

export default function ProductDetail() {
  const { path } = useRoute();
  const productId = path.split('/')[2];
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    catalogApi.product(productId)
      .then(({ data }) => setProduct(data.data))
      .catch(() => setError('This product is no longer available.'));
  }, [productId]);

  if (error) {
    return (
      <main className="page-width page-section">
        <div className="empty-panel">
          <h1>{error}</h1>
          <Link className="button button-dark" to="/">Back to shop</Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page-width page-section">
        <div className="state-block">
          <span className="loader-line" />
          <span>Loading product details...</span>
        </div>
      </main>
    );
  }

  const images = product.images?.length ? product.images : [fallbackImage];
  const stock = product.stock_quantity ?? 0;
  const outOfStock = stock < 1;
  const lowStock = stock > 0 && stock <= 3;

  const addToCart = async () => {
    if (outOfStock) return;
    try {
      await addItem(product, quantity);
      setAdded(true);
    } catch {
      setAdded(false);
    }
  };

  return (
    <main className="page-width page-section product-detail">
      <Link className="back-link" to="/">← Back to collection</Link>

      <div className="product-detail-grid">
        <section className="detail-gallery">
          <div className="detail-main-image">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className={outOfStock ? 'image-dimmed' : ''}
            />
          </div>
          {images.length > 1 && (
            <div className="thumbnail-row">
              {images.map((image, index) => (
                <button
                  className={selectedImage === index ? 'selected' : ''}
                  key={image}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img src={image} alt={`${product.name} thumbnail ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="detail-copy">
          <p className="eyebrow">{product.category?.name || 'Apple collection'}</p>
          <h1>{product.name}</h1>
          <strong className="detail-price">${Number(product.price).toFixed(2)}</strong>

          <p className="detail-description">
            {product.description ||
              'Designed for a clear, capable everyday setup. Review the product details for screen, chip, storage, finish, and compatibility information.'}
          </p>

          <div className="availability-wrapper">
            {outOfStock && (
              <span className="stock-badge stock-badge-zero">
                Currently out of stock
              </span>
            )}
            {lowStock && (
              <span className="stock-badge stock-badge-low">
                Only {stock} available — order soon
              </span>
            )}
            {!outOfStock && !lowStock && (
              <span className="stock-badge stock-badge-ok">
                In stock ({stock} available)
              </span>
            )}
          </div>

          <div className="purchase-row">
            <QuantityControl
              quantity={quantity}
              max={Math.max(1, stock)}
              onChange={setQuantity}
              disabled={outOfStock}
            />
            <button
              className={`button ${outOfStock ? 'button-disabled' : 'button-signal'}`}
              type="button"
              disabled={outOfStock}
              onClick={addToCart}
            >
              {outOfStock ? 'Sold out' : added ? 'Added to cart ✓' : 'Add to cart'}
            </button>
          </div>

          {added && (
            <div className="cart-feedback-row">
              <Link className="button button-quiet" to="/cart">
                View your cart →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
