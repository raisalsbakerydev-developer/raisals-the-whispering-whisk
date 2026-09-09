import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../common/Container'
import Button from '../common/Button'
import Reveal from '../common/Reveal'
import MediaSlideshow from './MediaSlideshow'
import OfferPrice from './OfferPrice'
import { getOffers } from '../../services/productService.js'

function MenuOffersSection() {
  const [offers, setOffers] = useState([])
  const [activeGroup, setActiveGroup] = useState(0)

  useEffect(() => {
    let active = true
    getOffers()
      .then((response) => {
        if (active) {
          setOffers(response.data.products || [])
          setActiveGroup(0)
        }
      })
      .catch(() => {
        if (active) setOffers([])
      })
    return () => { active = false }
  }, [])

  const groups = useMemo(() => {
    const result = []
    for (let index = 0; index < offers.length; index += 3) {
      result.push(offers.slice(index, index + 3))
    }
    return result
  }, [offers])

  useEffect(() => {
    if (groups.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setActiveGroup((current) => (current + 1) % groups.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [groups.length])

  useEffect(() => {
    if (activeGroup >= groups.length && groups.length > 0) {
      setActiveGroup(0)
    }
  }, [activeGroup, groups.length])

  if (!offers.length) return null

  const visibleOffers = groups[activeGroup] || []

  function previousGroup() {
    setActiveGroup((current) => (current - 1 + groups.length) % groups.length)
  }

  function nextGroup() {
    setActiveGroup((current) => (current + 1) % groups.length)
  }

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/70 py-10 sm:py-12">
      <Container>
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Sweet Deals</p>
            <h2 className="mt-2 text-3xl sm:text-4xl">Special Offers</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">A little extra sweetness on selected treats. Special prices and quantity offers are shown here.</p>
          </div>
          <a href="#menu-products" className="text-sm font-semibold text-[var(--color-primary)] hover:underline">Browse all treats ↓</a>
        </div>

        <div className="relative">
          <div className="grid gap-8 md:grid-cols-3">
          {visibleOffers.map((product, index) => {
            const variant = product.variants?.[0]
            return (
              <Reveal key={product.id} delay={index * 110}>
                <article className="group overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_55px_rgba(61,41,35,0.14)]">
                  <Link to={`/menu/${product.id}`} className="relative block aspect-[4/3] overflow-hidden">
                    <MediaSlideshow media={product.media} alt={product.name} compact />
                    <span className="absolute left-4 top-4 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white shadow-lg">🔥 {product.offerText || product.offerLabel}</span>
                  </Link>
                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-secondary)]">{product.category}</p>
                    <Link to={`/menu/${product.id}`}><h3 className="mt-2 font-serif text-2xl leading-tight transition-colors group-hover:text-[var(--color-primary)]">{product.name}</h3></Link>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-text-muted)]">{product.description}</p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                      <span className="font-semibold text-[var(--color-primary)]">{variant ? <OfferPrice variant={variant} compact /> : 'View details'}</span>
                      <Link to={`/menu/${product.id}`}><Button variant="secondary">View Details</Button></Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            )
          })}
          </div>

          {groups.length > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button type="button" onClick={previousGroup} aria-label="Previous special offers" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-lg transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">←</button>
              <div className="flex items-center gap-2" aria-label="Special offer slides">
                {groups.map((_, index) => (
                  <button key={index} type="button" onClick={() => setActiveGroup(index)} aria-label={`Show special offers ${index + 1}`} className={`h-2.5 rounded-full transition-all ${index === activeGroup ? 'w-8 bg-[var(--color-primary)]' : 'w-2.5 bg-[var(--color-border)]'}`} />
                ))}
              </div>
              <button type="button" onClick={nextGroup} aria-label="Next special offers" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-lg transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">→</button>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

export default MenuOffersSection
