import { useEffect, useMemo, useState } from 'react'
import ReviewAvatar from './ReviewAvatar.jsx'

function Stars({ value = 0 }) {
  return (
    <div className="flex items-center gap-1 text-xl leading-none text-[var(--color-accent)]" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true">{index < value ? '★' : '☆'}</span>
      ))}
    </div>
  )
}

function ReviewCard({ review, compact = false }) {
  return (
    <article className={`h-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)] ${compact ? 'p-5' : 'p-6'}`}>
      <Stars value={review.rating} />
      <p className="mt-5 text-sm leading-7 text-[var(--color-text)]">“{review.reviewText}”</p>
      <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-border)] pt-5">
        <ReviewAvatar src={review.avatarUrl} name={review.reviewerName} userType={review.userType} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{review.reviewerName}</p>
          <p className="mt-1 text-xs uppercase tracking-wider opacity-50">{compact ? 'Customer review' : 'Overall bakery experience'}</p>
        </div>
      </div>
    </article>
  )
}

function ReviewSlideshow({ reviews = [], perSlide = 1, label = 'See what other customers say', compact = false }) {
  const safePerSlide = Math.max(1, perSlide)
  const slides = useMemo(() => {
    const result = []
    for (let index = 0; index < reviews.length; index += safePerSlide) {
      result.push(reviews.slice(index, index + safePerSlide))
    }
    return result
  }, [reviews, safePerSlide])
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    setActiveSlide(0)
  }, [reviews.length, safePerSlide])

  useEffect(() => {
    if (slides.length <= 1) return undefined
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [slides.length])

  if (!reviews.length) return null

  const currentReviews = slides[activeSlide] || slides[0]

  function previousSlide() {
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length)
  }

  function nextSlide() {
    setActiveSlide((current) => (current + 1) % slides.length)
  }

  return (
    <div>
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">Customer Love</p>
        <h3 className="mt-2 font-serif text-3xl">{label}</h3>
      </div>

      <div key={activeSlide} className={`grid gap-5 ${safePerSlide > 1 ? 'sm:grid-cols-2 lg:grid-cols-4' : ''}`}>
        {currentReviews.map((review) => (
          <ReviewCard key={review.id} review={review} compact={compact} />
        ))}
      </div>

      {slides.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button type="button" onClick={previousSlide} aria-label="Previous review slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-lg transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">←</button>
          <div className="flex items-center gap-2" aria-label="Review slides">
            {slides.map((_, index) => (
              <button key={index} type="button" onClick={() => setActiveSlide(index)} aria-label={`Show review slide ${index + 1}`} className={`h-2.5 rounded-full transition-all ${index === activeSlide ? 'w-8 bg-[var(--color-primary)]' : 'w-2.5 bg-[var(--color-border)]'}`} />
            ))}
          </div>
          <button type="button" onClick={nextSlide} aria-label="Next review slide" className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-lg transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">→</button>
        </div>
      )}
    </div>
  )
}

export default ReviewSlideshow
