import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Container from '../components/common/Container'
import Section from '../components/common/Section'
import SectionHeading from '../components/common/SectionHeading'
import Button from '../components/common/Button'
import ReviewAvatar from '../components/common/ReviewAvatar.jsx'
import ReviewSlideshow from '../components/common/ReviewSlideshow.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  createBakeryReview,
  deleteBakeryReview,
  getBakeryReviews,
  getMyBakeryReview,
  updateBakeryReview,
} from '../services/bakeryReviewService.js'

function Stars({ value = 0, interactive = false, onChange }) {
  return (
    <div className="flex items-center gap-1" role={interactive ? 'radiogroup' : undefined} aria-label={interactive ? 'Choose a rating' : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? star === value : undefined}
          aria-label={interactive ? `${star} star${star > 1 ? 's' : ''}` : undefined}
          className={`text-2xl leading-none transition-transform ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} ${star <= value ? 'text-[var(--color-accent)]' : 'text-[var(--color-border)]'}`}
        >
          {star <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}

function ReviewForm({ existingReview, onSaved, onDeleted, onCancel }) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    setRating(existingReview?.rating || 0)
    setReviewText(existingReview?.reviewText || '')
  }, [existingReview])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!rating) {
      setError('Please choose a star rating.')
      return
    }
    if (!reviewText.trim()) {
      setError('Please write a review before submitting.')
      return
    }

    setSaving(true)
    try {
      const response = existingReview
        ? await updateBakeryReview(existingReview.id, { rating, reviewText })
        : await createBakeryReview({ rating, reviewText })
      onSaved(response?.data?.review)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existingReview) return
    setSaving(true)
    setError('')
    try {
      await deleteBakeryReview(existingReview.id)
      setDeleteOpen(false)
      onDeleted()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)] sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">
            {existingReview ? 'Your team review' : 'Share your experience'}
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {existingReview ? 'Update your review' : 'How did our team do?'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Tell us about your overall experience with the Raisal&apos;s Bakery team.
          </p>
        </div>
        {existingReview && (
          <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs font-semibold opacity-60">
            You&apos;ve already reviewed us
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-7">
        <label className="text-sm font-semibold">Your rating</label>
        <div className="mt-3">
          <Stars value={rating} interactive onChange={setRating} />
        </div>

        <label htmlFor="bakery-review-text" className="mt-7 block text-sm font-semibold">
          Your review
        </label>
        <textarea
          id="bakery-review-text"
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Share what you loved about your experience with our team..."
          className="mt-3 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 text-sm outline-none transition focus:border-[var(--color-primary)]"
        />
        <p className="mt-2 text-right text-xs opacity-50">{reviewText.length}/2000</p>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : existingReview ? 'Update Review' : 'Submit Review'}
          </Button>
          {existingReview && (
            <>
              {onCancel && <Button type="button" variant="secondary" disabled={saving} onClick={onCancel}>Cancel</Button>}
              <Button type="button" variant="ghost" disabled={saving} onClick={() => setDeleteOpen(true)}>
                Delete Review
              </Button>
            </>
          )}
        </div>
      </form>

      {deleteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-2xl">
            <h3 className="font-serif text-2xl">Delete your review?</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
              This will permanently remove your review from our team reviews.
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={saving}>Keep Review</Button>
              <Button type="button" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Reviews() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [reviews, setReviews] = useState([])
  const [myReview, setMyReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadReviews() {
    setLoading(true)
    setError('')
    try {
      const publicResponse = await getBakeryReviews()
      setReviews(publicResponse?.data?.reviews || [])

      if (isAuthenticated) {
        const mineResponse = await getMyBakeryReview()
        setMyReview(mineResponse?.data?.review || null)
      } else {
        setMyReview(null)
      }
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) loadReviews()
  }, [authLoading, isAuthenticated])

  const summary = useMemo(() => {
    if (!reviews.length) return { average: null, count: 0 }
    return {
      average: Number((reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1)),
      count: reviews.length,
    }
  }, [reviews])

  const otherReviews = useMemo(() => reviews.filter((review) => review.id !== myReview?.id), [reviews, myReview])

  function handleSaved(review) {
    setMyReview(review)
    setEditing(false)
    setReviews((current) => {
      const withoutMine = current.filter((item) => item.id !== review.id)
      return review.isPublished ? [review, ...withoutMine] : withoutMine
    })
  }

  function handleDeleted() {
    if (myReview) setReviews((current) => current.filter((item) => item.id !== myReview.id))
    setMyReview(null)
    setEditing(false)
  }

  async function handleDeleteFromCard() {
    if (!myReview) return
    setDeleting(true)
    setError('')
    try {
      await deleteBakeryReview(myReview.id)
      handleDeleted()
      setDeleteOpen(false)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main>
      <Section className="pb-10">
        <Container>
          <SectionHeading
            eyebrow="Meet the People Behind the Bake"
            title="Review Our Team"
            description="Your experience with our whole bakery team matters to us. Share what you think and help us keep getting better."
          />

          {loading ? (
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center text-sm opacity-60">
              Loading team reviews...
            </div>
          ) : error ? (
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-300 bg-red-50 p-8 text-center text-sm text-red-700">
              {error}
              <div className="mt-5"><Button onClick={loadReviews}>Try Again</Button></div>
            </div>
          ) : (
            <>
              <div className="mx-auto mb-10 max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center shadow-[var(--shadow-soft)] sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">Our customers say</p>
                {summary.average ? (
                  <>
                    <div className="mt-4 flex justify-center"><Stars value={Math.round(summary.average)} /></div>
                    <p className="mt-3 font-serif text-3xl">{summary.average} / 5</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">Based on {summary.count} team {summary.count === 1 ? 'review' : 'reviews'}</p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-[var(--color-text-muted)]">Be the first to review our team.</p>
                )}
              </div>

              {!authLoading && isAuthenticated && myReview && !editing ? (
                <div className="mx-auto mb-14 max-w-3xl">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-secondary)]">Your Review</p>
                    <h2 className="mt-2 font-serif text-3xl">Your review</h2>
                  </div>
                  <article className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-soft)] sm:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <ReviewAvatar src={myReview.avatarUrl} name={myReview.reviewerName} userType={myReview.userType} />
                        <div className="min-w-0">
                          <p className="font-semibold">{myReview.reviewerName}</p>
                          <Stars value={myReview.rating} />
                        </div>
                      </div>
                      <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">Your review</span>
                    </div>
                    <p className="mt-5 text-base leading-7 text-[var(--color-text)]">“{myReview.reviewText}”</p>
                    <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-[var(--color-border)] pt-5">
                      <Button variant="secondary" onClick={() => setEditing(true)}>Edit Review</Button>
                      <Button variant="ghost" onClick={() => setDeleteOpen(true)}>Delete Review</Button>
                    </div>
                  </article>
                </div>
              ) : !authLoading && isAuthenticated ? (
                <div className="mx-auto mb-14 max-w-3xl">
                  <ReviewForm existingReview={myReview} onSaved={handleSaved} onDeleted={handleDeleted} onCancel={() => setEditing(false)} />
                </div>
              ) : !authLoading ? (
                <div className="mx-auto mb-14 max-w-3xl rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
                  <h2 className="font-serif text-3xl">Want to review our team?</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
                    Please log in to share your experience. You&apos;ll be able to edit or delete your own review anytime.
                  </p>
                  <div className="mt-6"><Link to="/login"><Button>Login to Review</Button></Link></div>
                </div>
              ) : null}

              {otherReviews.length ? (
                <div className="mx-auto max-w-5xl">
                  <ReviewSlideshow reviews={otherReviews} perSlide={4} label="What Our Customers Say About Us" />
                </div>
              ) : (
                <div className="mx-auto max-w-3xl rounded-3xl border border-dashed border-[var(--color-border)] p-8 text-center">
                  <p className="font-serif text-2xl">{myReview ? 'Be the first other customer to share your experience.' : 'Be the first to share your experience with our team.'}</p>
                </div>
              )}

              {deleteOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
                  <div className="w-full max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-2xl">
                    <h3 className="font-serif text-2xl">Delete your review?</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">This will permanently remove your review from our team reviews.</p>
                    <div className="mt-7 flex justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>Keep Review</Button>
                      <Button type="button" onClick={handleDeleteFromCard} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </main>
  )
}

export default Reviews
