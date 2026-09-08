import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/common/Container'
import Reveal from '../components/common/Reveal'
import ProductCard from '../components/menu/ProductCard'
import Button from '../components/common/Button'
import { getProducts } from '../services/productService.js'
import { useCart } from '../context/CartContext.jsx'
import { useError } from '../context/ErrorContext.jsx'
import MenuOffersSection from '../components/menu/MenuOffersSection'

function Menu() {
  const { showError } = useError()
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('all')
  const [availability, setAvailability] = useState('available')
  const [loading, setLoading] = useState(true)
  const [, setError] = useState('')
  const { count } = useCart()

  async function load() {
    setLoading(true); setError('')
    try { const response = await getProducts('', 'all'); setProducts(response.data.products || []) }
    catch (e) { if (!e?.code) showError(e) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const categories = useMemo(() => ['all', ...new Set(products.map((p) => p.category))], [products])
  const filtered = products.filter((p) => (category === 'all' || p.category === category) && (availability === 'all' || (availability === 'available' ? p.isAvailable : !p.isAvailable)))

  return <main>
    <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-background)]">
      <Container><Reveal><div className="relative py-16 sm:py-20 lg:py-24"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">Raisal's The Whispering Whisk · Pure Veg</p><h1 className="mt-4 text-5xl leading-[0.95] sm:text-6xl lg:text-7xl">Made to make<br /><span className="text-[var(--color-primary)]">you crave another bite.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">Explore our handcrafted cheesecakes and tiramisu, made fresh with care and served exactly the way you like them.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/cart"><Button variant="accent">View Cart {count > 0 ? `· ${count}` : ''}</Button></Link><span className="inline-flex items-center rounded-full border border-[var(--color-veg-border)] bg-[var(--color-veg-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-veg-text)]">● 100% Vegetarian · Eggless</span></div></div></div></Reveal></Container>
    </section>

    <MenuOffersSection />

    <section className="sticky top-20 z-30 border-b border-[var(--color-border)] bg-[var(--color-background)]/90 py-4 shadow-[0_6px_24px_rgba(61,41,35,0.04)] backdrop-blur-xl">
      <Container><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${category === item ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-soft)]' : 'border border-[var(--color-border)] hover:border-[var(--color-primary)]'}`}>{item === 'all' ? 'All' : item}</button>)}</div><div className="flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1"><button onClick={() => setAvailability('available')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${availability === 'available' ? 'bg-[var(--color-accent)]' : 'opacity-60'}`}>Available</button><button onClick={() => setAvailability('all')} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${availability === 'all' ? 'bg-[var(--color-accent)]' : 'opacity-60'}`}>All</button></div></div></Container>
    </section>

    <section id="menu-products" className="py-14 sm:py-18"><Container>{loading ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[2rem] bg-[var(--color-surface)]" />)}</div> : filtered.length ? <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((product, i) => <Reveal key={product.id} delay={(i % 3) * 70}><ProductCard product={product} /></Reveal>)}</div> : <div className="py-20 text-center"><p className="font-serif text-3xl">Nothing here yet.</p><p className="mt-2 text-sm opacity-60">Try another category.</p></div>}</Container></section>
  </main>
}
export default Menu
