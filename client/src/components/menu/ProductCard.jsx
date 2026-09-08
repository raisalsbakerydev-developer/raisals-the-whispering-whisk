import { Link } from 'react-router-dom'
import { useState } from 'react'
import Button from '../common/Button'
import MediaSlideshow from './MediaSlideshow'
import OfferBadge from './OfferBadge'
import OfferPrice from './OfferPrice'
import { useCart } from '../../context/CartContext'
import { useBakery } from '../../context/BakeryContext.jsx'

function ProductCard({ product }) {
  const { addItem } = useCart()
  const { isClosed } = useBakery()
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id)
  const selected = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0]
  return <article className="group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] bakery-card">
    <Link to={`/menu/${product.id}`} className="bakery-media-frame relative block aspect-[4/3] overflow-hidden border-b border-[var(--color-border)]"><div className="h-full w-full"><MediaSlideshow media={product.media} alt={product.name} compact /></div><div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" /><OfferBadge product={product} className="absolute left-4 top-4" /></Link>
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-secondary)]">{product.category}</p>{!product.isAvailable && <span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">Unavailable</span>}</div>
      <Link to={`/menu/${product.id}`}><h3 className="mt-2 font-serif text-2xl leading-tight tracking-tight transition-colors group-hover:text-[var(--color-primary)]">{product.name}</h3></Link>
      <div className="mt-3 flex items-center gap-2 text-sm"><span className="tracking-wider text-[var(--color-accent)]">{'★'.repeat(Math.round(product.averageRating || 0))}{'☆'.repeat(5 - Math.round(product.averageRating || 0))}</span><span className="text-[var(--color-text-muted)]">{product.reviewCount ? `${product.averageRating.toFixed(1)} · ${product.reviewCount}` : 'No reviews yet'}</span></div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{product.description}</p>
      <div className="atelier-rule mt-4" aria-hidden="true" />
      {product.variants.length > 0 && <div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] opacity-50">Choose size</p><div className="flex flex-wrap gap-2">{product.variants.map((v) => <button key={v.id} type="button" onClick={() => setSelectedVariantId(v.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-300 ${selected?.id === v.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-primary)] hover:-translate-y-0.5'}`}>{v.label}</button>)}</div></div>}
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-[var(--color-border)] pt-4"><div><p className="text-xs opacity-55">{selected?.serves ? `Serves ${selected.serves}` : selected?.weight || ''}</p><OfferPrice variant={selected} /></div><Button disabled={!product.isAvailable || !selected || isClosed} onClick={() => selected && addItem(product, selected)}>Add to Cart</Button></div>
    </div>
  </article>
}
export default ProductCard
