export default function QuantityControl({ quantity, max, onChange, disabled = false, allowInput = true }) {
  const handleInputChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      const nextVal = max !== undefined ? Math.min(max, val) : val;
      onChange(nextVal);
    }
  };

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
      {allowInput && !disabled ? (
        <input
          type="number"
          min="1"
          max={max !== undefined ? max : undefined}
          value={quantity}
          onChange={handleInputChange}
          className="quantity-input"
          style={{
            width: '44px',
            height: '100%',
            border: 0,
            textAlign: 'center',
            background: 'transparent',
            font: '.75rem var(--mono)',
            outline: 'none',
            color: 'inherit',
          }}
          aria-label="Quantity"
        />
      ) : (
        <span aria-live="polite">{quantity}</span>
      )}
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(max !== undefined ? Math.min(max, quantity + 1) : quantity + 1)}
        disabled={disabled || (max !== undefined && quantity >= max)}
      >
        +
      </button>
    </div>
  );
}
