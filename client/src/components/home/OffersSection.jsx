import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../common/Container'
import Section from '../common/Section'
import SectionHeading from '../common/SectionHeading'
import Button from '../common/Button'
import Reveal from '../common/Reveal'
import MediaSlideshow from '../menu/MediaSlideshow'
import OfferPrice from '../menu/OfferPrice'
import { getOffers } from '../../services/productService.js'

function OffersSection() {
  const [offers, setOffers] = useState([])
  useEffect(() => { let active = true; getOffers().then((response) => { if (active) setOffers((response.data.products || []).slice(0, 3)) }).catch(() => { if (active) setOffers([]) }); return () => { active = false } }, [])
  if (!offers.length) return null
  return <Section><Container><SectionHeading eyebrow="Sweet Deals" title="Special Offers" description="A little extra sweetness on selected treats, including special prices and quantity offers."/><div className="grid gap-8 md:grid-cols-3">{offers.map((product,index)=>{const variant=product.variants?.[0];return <Reveal key={product.id} delay={index*110}><article className="group overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_55px_rgba(61,41,35,0.14)]"><Link to={`/menu/${product.id}`} className="relative block aspect-[4/3] overflow-hidden"><MediaSlideshow media={product.media} alt={product.name} compact/><span className="absolute left-4 top-4 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-lg">🔥 {product.offerText || product.offerLabel}</span></Link><div className="p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">{product.category}</p><Link to={`/menu/${product.id}`}><h3 className="mt-2 font-serif text-2xl leading-tight transition-colors group-hover:text-[var(--color-primary)]">{product.name}</h3></Link><p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{product.description}</p><div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4"><span className="font-semibold text-[var(--color-primary)]">{variant ? <OfferPrice variant={variant} compact /> : 'View details'}</span><Link to={`/menu/${product.id}`}><Button variant="secondary">View Details</Button></Link></div></div></article></Reveal>})}</div><div className="mt-10 flex justify-center"><Link to="/menu"><Button>Explore All Treats</Button></Link></div></Container></Section>
}
export default OffersSection
