import Container from '../common/Container'
import Button from '../common/Button'
import Reveal from '../common/Reveal'
import PureVegBadge from '../common/PureVegBadge'

function Hero({ media }) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-background)]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[var(--color-accent)] opacity-[0.10] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[var(--color-secondary)] opacity-[0.09] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-[var(--color-primary)] opacity-[0.04] blur-3xl" />
      <Container>
        <div className="relative grid min-h-[calc(100vh-5rem)] items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <Reveal className="max-w-xl reveal-left"><div className="max-w-xl">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <p className="ornament-line text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-secondary)]">Raisal's The Whispering Whisk</p>
              <PureVegBadge compact />
            </div>
            <h1 className="font-serif text-5xl leading-[1.04] text-[var(--color-text)] sm:text-6xl lg:text-7xl">Made with Love,<br /><span className="italic text-[var(--color-primary)]">Baked for You</span></h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">Homemade treats crafted with care, using quality ingredients and a little piece of our heart in every bake.</p>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-veg-text)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0" aria-hidden="true">
                <path d="M4 14c0-6 4-10.5 15-11 .3 8-3.5 12-9 12-2 0-3.7-.4-5-1Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.5 19.5C7 15 10 12.5 13.5 11" strokeLinecap="round" />
              </svg>
              100% Pure Vegetarian Bakery
            </p>
            <div className="mt-8 flex flex-wrap gap-4"><Button>Explore Menu</Button><Button variant="secondary">Our Story</Button></div>
          </div></Reveal>
          <Reveal className="relative reveal-right" delay={140}><div className="relative"><div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-[2.5rem] border border-dashed border-[var(--color-hairline)] opacity-70 hidden sm:block" /><div className="hero-media-float bakery-media-frame aspect-[4/3] overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] transition-shadow duration-500 hover:shadow-[var(--shadow-hover)]">
            {media?.url ? (media.resourceType === 'video' ? <video className="h-full w-full object-contain" src={media.url} autoPlay muted loop playsInline /> : <img className="h-full w-full object-contain" src={media.url} alt={media.altText || "Raisal's The Whispering Whisk"} />) : <div className="placeholder-shimmer flex h-full items-center justify-center text-center text-[var(--color-text-muted)]"><div><p className="font-serif text-2xl italic">Product Media</p><p className="mt-2 text-sm">Images & videos will appear here</p></div></div>}
          </div><div className="float-badge absolute -bottom-4 -left-4 hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-accent)] px-5 py-3 shadow-[var(--shadow-soft)] sm:block"><p className="font-serif text-sm font-semibold text-[var(--color-accent-foreground)]">Freshly Baked</p><p className="text-xs text-[var(--color-accent-foreground)] opacity-70">With love, every day</p></div><div aria-hidden="true" className="absolute -right-3 -top-3 hidden h-16 w-16 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] sm:flex sm:items-center sm:justify-center"><span className="font-serif text-xs italic leading-tight text-[var(--color-primary)]">Est.<br />Fresh</span></div></div></Reveal>
        </div>
      </Container>
    </section>
  )
}
export default Hero
