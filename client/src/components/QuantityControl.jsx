export default function QuantityControl({ quantity, max = 99, onChange, disabled = false }) {
  return (
    <div className="quantity-control" aria-label="Quantity">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        disabled={disabled || quantity <= 1}
      >
        -
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={disabled || quantity >= max}
      >
        +
      </button>
    </div>
  );
}
