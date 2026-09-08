function OfferBadge({ product, className = '' }) {
  if (!product?.offerEnabled || !product?.offerLabel) return null

  return (
    <span className={`stamp-badge inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)]/60 bg-[var(--color-accent)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-accent-foreground)] shadow-[var(--shadow-stamp)] ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5" aria-hidden="true"><path d="M12 2l2.2 6.8H21l-5.6 4.1 2.1 6.9L12 15.8 6.5 19.8l2.1-6.9L3 8.8h6.8Z" /></svg>
      {product.offerLabel}
    </span>
  )
}

export default OfferBadge
