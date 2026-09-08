import { useEffect, useState } from 'react'

function MediaSlideshow({ media = [], alt = '' }) {
  const [index, setIndex] = useState(0)
  useEffect(() => { setIndex(0) }, [media])
  useEffect(() => {
    if (media.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % media.length), 4500)
    return () => clearInterval(timer)
  }, [media.length])
  if (!media.length) return <div className="flex h-full items-center justify-center bg-[var(--color-surface)] text-center text-sm opacity-45"><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="mx-auto h-8 w-8"><path d="M4 11.5c0-3 2.5-5.5 5.5-5.5.6-1.5 2-2.5 3.5-2.5 2 0 3.6 1.5 3.9 3.4A4 4 0 0 1 20 11a4 4 0 0 1-.5 8H6a4 4 0 0 1-2-7.5Z" strokeLinejoin="round" /></svg><p className="mt-2 font-serif italic">Freshly baked, beautifully yours.</p></div></div>
  const current = media[index]
  return <div className="group relative h-full w-full overflow-hidden bg-[var(--color-surface)]">
    {current.resourceType === 'video' ? <video src={current.url} className="h-full w-full object-contain" muted loop autoPlay playsInline /> : <img src={current.url} alt={current.altText || alt} className="h-full w-full object-contain" />}
    {media.length > 1 && <>
      <button type="button" aria-label="Previous media" onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)} className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">‹</button>
      <button type="button" aria-label="Next media" onClick={() => setIndex((i) => (i + 1) % media.length)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">›</button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/30 px-2 py-1 backdrop-blur">{media.map((_, i) => <button key={i} type="button" aria-label={`Show media ${i + 1}`} onClick={() => setIndex(i)} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`} />)}</div>
    </>}
  </div>
}
export default MediaSlideshow
