import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useAuth } from '../context/AuthContext'
import { useError } from '../context/ErrorContext.jsx'

import {
  getAllUsers,
  promoteUser,
  authorizeAdmin,
  getAdminControl,
  lockAdminControl,
  unlockAdminControl,
} from '../services/adminService'
import {
  getAdminBakeryStatus,
  updateBakeryClosure,
  createOperatingHour,
  updateOperatingHour,
  deleteOperatingHour,
} from '../services/bakeryService.js'
import {
  getAdminHomeMedia,
  assignHomeMedia,
  deleteHomeMedia,
  uploadAndRegisterMedia,
  deleteRegisteredMedia,
} from '../services/homeService'

function AdminDashboard() {
  const { user } = useAuth()
  const { showError } = useError()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [adminControl, setAdminControl] = useState(null)
  const [controlLoading, setControlLoading] = useState(true)
  const [controlConfirmOpen, setControlConfirmOpen] = useState(false)
  const [homeMedia, setHomeMedia] = useState({})
  const [homeLoading, setHomeLoading] = useState(true)
  const [, setHomeError] = useState('')
  const fileInputs = useRef({})
  const [bakeryStatus, setBakeryStatus] = useState({ closure: { isClosed: false, note: null }, hours: [] })
  const [bakeryLoading, setBakeryLoading] = useState(true)
  const [bakeryError, setBakeryError] = useState('')
  const [closureNote, setClosureNote] = useState('')
  const [hourForm, setHourForm] = useState({ dayOfWeek: '', openTime: '09:00', closeTime: '18:00' })
  const [editingHourId, setEditingHourId] = useState(null)

  async function loadUsers() {
    try {
      setError('')

      const response = await getAllUsers()

      setUsers(response.data.users)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadAdminControl() {
    try {
      const response = await getAdminControl()
      setAdminControl(response.data.control)
    } catch (error) {
      setError(error.message)
    } finally {
      setControlLoading(false)
    }
  }

  useEffect(() => {
    loadAdminControl()
  }, [])

  const isOwner =
    user?.email?.trim().toLowerCase() ===
    'raisalsbakery.dev@gmail.com'

  async function loadHomeMedia() {
    try {
      setHomeError('')
      const response = await getAdminHomeMedia()
      setHomeMedia(response.data.home.media || {})
    } catch (error) {
      if (!error?.code) showError(error)
    } finally {
      setHomeLoading(false)
    }
  }

  useEffect(() => {
    loadHomeMedia()
  }, [])

  async function loadBakeryStatus() {
    try {
      setBakeryError('')
      const response = await getAdminBakeryStatus()
      const next = response.data
      setBakeryStatus(next)
      setClosureNote(next.closure?.note || '')
    } catch (error) {
      setBakeryError(error.message)
    } finally {
      setBakeryLoading(false)
    }
  }

  useEffect(() => {
    loadBakeryStatus()
  }, [])

  async function handleClosureToggle() {
    const nextClosed = !bakeryStatus.closure?.isClosed
    try {
      setActionLoading('bakery-closure')
      setBakeryError('')
      const response = await updateBakeryClosure(nextClosed, nextClosed ? closureNote : '')
      setBakeryStatus((current) => ({ ...current, closure: response.data.closure }))
      setClosureNote(response.data.closure.note || '')
    } catch (error) {
      setBakeryError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleClosureNoteSave() {
    if (!bakeryStatus.closure?.isClosed) return
    try {
      setActionLoading('bakery-note')
      setBakeryError('')
      const response = await updateBakeryClosure(true, closureNote)
      setBakeryStatus((current) => ({ ...current, closure: response.data.closure }))
      setClosureNote(response.data.closure.note || '')
    } catch (error) {
      setBakeryError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  function resetHourForm() {
    setHourForm({ dayOfWeek: '', openTime: '09:00', closeTime: '18:00' })
    setEditingHourId(null)
  }

  async function handleHourSubmit(event) {
    event.preventDefault()
    try {
      setActionLoading('bakery-hour')
      setBakeryError('')
      if (editingHourId) {
        await updateOperatingHour(editingHourId, hourForm)
      } else {
        await createOperatingHour(hourForm)
      }
      await loadBakeryStatus()
      resetHourForm()
    } catch (error) {
      setBakeryError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  function startHourEdit(hour) {
    setEditingHourId(hour.id)
    setHourForm({ dayOfWeek: String(hour.dayOfWeek), openTime: hour.openTime, closeTime: hour.closeTime })
  }

  async function handleHourDelete(id) {
    try {
      setActionLoading(`bakery-hour-delete:${id}`)
      setBakeryError('')
      await deleteOperatingHour(id)
      await loadBakeryStatus()
      if (editingHourId === id) resetHourForm()
    } catch (error) {
      setBakeryError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleHomeFile(placement, file) {
    if (!file) return
    setActionLoading(`home:${placement}`)
    setHomeError('')
    try {
      const media = await uploadAndRegisterMedia(file)
      try {
        const response = await assignHomeMedia(placement, media.id)
        setHomeMedia((current) => ({ ...current, [placement]: response.data.media }))
      } catch (error) {
        await deleteRegisteredMedia(media.id).catch(() => {})
        throw error
      }
      await loadHomeMedia()
    } catch (error) {
      if (!error?.code) showError(error)
    } finally {
      setActionLoading(null)
      if (fileInputs.current[placement]) fileInputs.current[placement].value = ''
    }
  }

  async function handleHomeDelete(placement) {
    setActionLoading(`home-delete:${placement}`)
    setHomeError('')
    try {
      await deleteHomeMedia(placement)
      setHomeMedia((current) => ({ ...current, [placement]: null }))
    } catch (error) {
      if (!error?.code) showError(error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handlePromote(userId) {
    try {
      setActionLoading(userId)
      setError('')

      await promoteUser(userId)

      await loadUsers()
    } catch (error) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleAuthorize(userId) {
    try {
      setActionLoading(userId)
      setError('')

      await authorizeAdmin(userId)

      await loadUsers()
    } catch (error) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  function openAdminControlConfirmation() {
    if (!isOwner || controlLoading || !adminControl) return
    setControlConfirmOpen(true)
  }

  function closeAdminControlConfirmation() {
    if (actionLoading === 'admin-control') return
    setControlConfirmOpen(false)
  }

  async function handleAdminControlToggle() {
    const currentlyLocked = adminControl?.isLocked === true
    const action = currentlyLocked ? unlockAdminControl : lockAdminControl

    if (!isOwner || controlLoading || !adminControl) return

    try {
      setActionLoading('admin-control')
      setError('')
      const response = await action()
      setAdminControl(response.data.control)
      setControlConfirmOpen(false)
      await loadUsers()
    } catch (error) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Administration
            </p>

            <h1 className="text-4xl sm:text-5xl">
              Admin Dashboard
            </h1>

            <p className="mt-4 text-sm leading-6 opacity-70">
              Welcome back, {user.name}. Manage Raisal's The Whispering Whisk
              from here.
            </p>
          </div>

          {/* Admin Information */}
          <div className="mb-10 grid gap-6 sm:grid-cols-2">

            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50">
                Administrator
              </p>

              <h2 className="mt-3 text-2xl">
                {user.name}
              </h2>

              <p className="mt-2 break-all text-sm opacity-70">
                {user.email}
              </p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50">
                Authorization
              </p>

              <h2 className="mt-3 text-2xl">
                Authorized
              </h2>

              <p className="mt-2 text-sm opacity-70">
                You have full administrative access.
              </p>
            </div>

          </div>

          {/* Owner-controlled admin safety lock */}
          <section className="mb-10 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-50">
                  Admin Safety Lock
                </p>
                <h2 className="mt-2 text-2xl">
                  {adminControl?.isLocked ? 'Promotion & authorization locked' : 'Promotion & authorization unlocked'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 opacity-70">
                  {adminControl?.isLocked
                    ? 'No administrator can promote or authorize another admin until the owner unlocks this control.'
                    : 'Authorized administrators can promote and authorize users. Only the owner can lock this control again.'}
                </p>
              </div>

              {isOwner ? (
                <Button
                  disabled={controlLoading || actionLoading === 'admin-control'}
                  onClick={openAdminControlConfirmation}
                >
                  {actionLoading === 'admin-control'
                    ? 'Updating...'
                    : adminControl?.isLocked
                      ? 'Unlock Admin Control'
                      : 'Lock Admin Control'}
                </Button>
              ) : (
                <span className="text-sm font-medium opacity-60">Owner control only</span>
              )}
            </div>
          </section>

          {/* Admin control confirmation modal */}
          {controlConfirmOpen && adminControl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  closeAdminControlConfirmation()
                }
              }}
            >
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px]" />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-control-confirm-title"
                aria-describedby="admin-control-confirm-description"
                className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
              >
                <div className="p-7 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] text-xl">
                      {adminControl.isLocked ? '🔓' : '🔒'}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-50">
                        Admin Safety Lock
                      </p>

                      <h2
                        id="admin-control-confirm-title"
                        className="mt-2 text-2xl sm:text-3xl"
                      >
                        {adminControl.isLocked
                          ? 'Unlock admin control?'
                          : 'Lock admin control?'}
                      </h2>
                    </div>
                  </div>

                  <p
                    id="admin-control-confirm-description"
                    className="mt-6 text-sm leading-6 opacity-70"
                  >
                    {adminControl.isLocked
                      ? 'Unlocking will allow other authorized administrators to promote users and authorize administrators.'
                      : 'Locking will immediately prevent administrators from promoting users or authorizing administrators. Only the owner account can unlock this control.'}
                  </p>

                  <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50">
                      Current state
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {adminControl.isLocked
                        ? 'Promotion & authorization are locked'
                        : 'Promotion & authorization are unlocked'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[var(--color-border)] bg-[var(--color-background)]/60 p-5 sm:flex-row sm:justify-end">
                  <Button
                    variant="secondary"
                    disabled={actionLoading === 'admin-control'}
                    onClick={closeAdminControlConfirmation}
                  >
                    Cancel
                  </Button>

                  <Button
                    disabled={actionLoading === 'admin-control'}
                    onClick={handleAdminControlToggle}
                  >
                    {actionLoading === 'admin-control'
                      ? 'Updating...'
                      : adminControl.isLocked
                        ? 'Yes, Unlock Control'
                        : 'Yes, Lock Control'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Bakery Team Reviews */}
          <section className="mb-14">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Customer Feedback</p>
              <h2 className="mt-2 text-3xl">Bakery Team Reviews</h2>
              <p className="mt-2 text-sm opacity-70">Manage reviews about the overall bakery team separately from individual product reviews.</p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-2xl text-sm leading-6 opacity-70">Customers can submit one team review each. You can also enter genuine reviews collected through Google Forms and remove reviews when necessary.</p>
                <Link to="/admin/reviews"><Button>Open Team Reviews</Button></Link>
              </div>
            </div>
          </section>

          {/* About Us Studio */}
          <section className="mb-14 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Content</p>
                <h2 className="mt-2 text-3xl">About Us Studio</h2>
                <p className="mt-2 text-sm opacity-70">Manage founders, co-founders, team photos, story sections and other About Us content.</p>
              </div>
              <Link to="/admin/about"><Button>Open About Us Studio</Button></Link>
            </div>
          </section>

          {/* Menu Management */}
          <section className="mb-14 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Menu</p>
                <h2 className="mt-2 text-3xl">Menu Studio</h2>
                <p className="mt-2 text-sm opacity-70">Manage products, variants, media, availability and product reviews.</p>
              </div>
              <Link to="/admin/menu"><Button>Open Menu Studio</Button></Link>
            </div>
          </section>

          {/* Home Media */}
          <section className="mb-14">
            <div className="mb-6">
              <h2 className="text-3xl">Home Media</h2>
              <p className="mt-2 text-sm opacity-70">Upload media into the fixed Home page placeholders. The page design and copy remain unchanged.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {[
                ['hero', 'Hero', 'Image or video'],
                ['kitchen_1', 'Kitchen — Freshly Prepared', 'Image or video'],
                ['kitchen_2', 'Kitchen — Made from Scratch', 'Image or video'],
                ['kitchen_3', 'Kitchen — Behind the Bake', 'Image or video'],
                ['kitchen_4', 'Kitchen — Made with Love', 'Image or video'],
                ['story', 'Our Story', 'Image or video'],
              ].map(([placement, label, hint]) => {
                const media = homeMedia[placement]
                const busy = actionLoading === `home:${placement}` || actionLoading === `home-delete:${placement}`
                return <div key={placement} className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
                  <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="font-semibold">{label}</h3><p className="mt-1 text-xs opacity-60">{hint}</p></div><span className="rounded-full border border-[var(--color-border)] px-2 py-1 text-[10px] uppercase tracking-wider opacity-60">{placement}</span></div>
                  <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-[var(--color-background)]">{media?.url ? (media.resourceType === 'video' ? <video className="h-full w-full object-contain" src={media.url} muted loop autoPlay playsInline controls /> : <img className="h-full w-full object-contain" src={media.url} alt={media.altText || label} />) : <div className="flex h-full items-center justify-center text-center text-sm opacity-50">No media assigned</div>}</div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <input ref={(node) => { fileInputs.current[placement] = node }} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => handleHomeFile(placement, event.target.files?.[0])} />
                    <Button disabled={busy} onClick={() => fileInputs.current[placement]?.click()}>{busy ? 'Working...' : media ? 'Replace Media' : 'Upload Media'}</Button>
                    {media && <Button variant="secondary" disabled={busy} onClick={() => handleHomeDelete(placement)}>Delete</Button>}
                  </div>
                </div>
              })}
            </div>
            {homeLoading && <p className="mt-4 text-sm opacity-60">Loading Home media...</p>}
          </section>

          {/* Bakery Operations */}
          <section className="mb-14 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-soft)]">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Operations</p>
              <h2 className="mt-2 text-3xl">Bakery Operations</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 opacity-70">Set optional weekly working hours for customers and manually pause online ordering whenever the bakery is closed.</p>
            </div>

            {bakeryError && <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{bakeryError}</div>}

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Ordering control</p>
                    <h3 className="mt-2 font-serif text-2xl">{bakeryStatus.closure?.isClosed ? 'Currently Closed' : 'Normal Ordering'}</h3>
                    <p className="mt-2 text-sm leading-6 opacity-70">No open status is stored or displayed. This control is only used when you want to stop online ordering.</p>
                  </div>
                  <Button disabled={bakeryLoading || actionLoading === 'bakery-closure'} onClick={handleClosureToggle}>
                    {actionLoading === 'bakery-closure' ? 'Updating...' : bakeryStatus.closure?.isClosed ? 'Reopen Ordering' : 'Mark Closed'}
                  </Button>
                </div>

                {bakeryStatus.closure?.isClosed && (
                  <div className="mt-5 border-t border-[var(--color-border)] pt-5">
                    <label className="text-xs font-semibold uppercase tracking-wider opacity-50" htmlFor="closure-note">Closure note (optional)</label>
                    <textarea id="closure-note" value={closureNote} onChange={(event) => setClosureNote(event.target.value.slice(0, 300))} maxLength={300} rows={4} placeholder="We are closed today due to..." className="mt-2 w-full resize-y rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-primary)]" />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs opacity-50">Leave blank to use the default closure message.</p>
                      <Button variant="secondary" disabled={actionLoading === 'bakery-note'} onClick={handleClosureNoteSave}>{actionLoading === 'bakery-note' ? 'Saving...' : 'Save Note'}</Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Customer information</p>
                    <h3 className="mt-2 font-serif text-2xl">Weekly Operating Hours</h3>
                  </div>
                  {bakeryStatus.hours.length === 0 && <span className="rounded-full border border-[var(--color-border)] px-3 py-1 text-[10px] uppercase tracking-wider opacity-60">Not configured</span>}
                </div>

                {bakeryStatus.hours.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {bakeryStatus.hours.map((hour) => (
                      <div key={hour.id} className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div><p className="font-semibold">{hour.dayName}</p><p className="text-sm opacity-65">{hour.openTime} – {hour.closeTime}</p></div>
                        <div className="flex gap-2"><Button variant="secondary" className="px-4 py-2 text-xs" disabled={actionLoading?.startsWith('bakery-hour')} onClick={() => startHourEdit(hour)}>Edit</Button><Button variant="secondary" className="px-4 py-2 text-xs" disabled={actionLoading === `bakery-hour-delete:${hour.id}`} onClick={() => handleHourDelete(hour.id)}>Delete</Button></div>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleHourSubmit} className="mt-5 border-t border-[var(--color-border)] pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wider opacity-50">{editingHourId ? 'Edit day' : 'Add a day'}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <select required value={hourForm.dayOfWeek} onChange={(event) => setHourForm((current) => ({ ...current, dayOfWeek: event.target.value }))} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-primary)]">
                      <option value="">Select day</option>
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((day, index) => <option key={day} value={index + 1}>{day}</option>)}
                    </select>
                    <input required type="time" value={hourForm.openTime} onChange={(event) => setHourForm((current) => ({ ...current, openTime: event.target.value }))} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-primary)]" aria-label="Opening time" />
                    <input required type="time" value={hourForm.closeTime} onChange={(event) => setHourForm((current) => ({ ...current, closeTime: event.target.value }))} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 outline-none focus:border-[var(--color-primary)]" aria-label="Closing time" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3"><Button type="submit" disabled={actionLoading === 'bakery-hour'}>{actionLoading === 'bakery-hour' ? 'Saving...' : editingHourId ? 'Save Changes' : 'Add Day'}</Button>{editingHourId && <Button type="button" variant="secondary" disabled={actionLoading === 'bakery-hour'} onClick={resetHourForm}>Cancel</Button>}</div>
                </form>
              </div>
            </div>
          </section>

          {/* Users */}
          <section className="pt-2">

            <div className="mb-6">
              <h2 className="text-3xl">
                User Management
              </h2>

              <p className="mt-2 text-sm opacity-70">
                View and manage registered users.
              </p>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">

              {loading ? (
                <div className="p-8 text-center text-sm opacity-60">
                  Loading users...
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-sm opacity-60">
                  No users found.
                </div>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[900px] text-left">

                    <thead className="border-b border-[var(--color-border)]">
                      <tr>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">
                          User
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">
                          Provider
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">
                          Role
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">
                          Authorization
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">
                          Email
                        </th>

                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider opacity-60">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((item) => {
                        const isCurrentUser =
                          item.id === user.id

                        const isAdmin =
                          item.user_type === 'admin'

                        const isAuthorized =
                          item.is_authorized === true

                        const adminActionsLocked =
                          adminControl?.isLocked === true

                        const isLoading =
                          actionLoading === item.id

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-[var(--color-border)] last:border-b-0"
                          >

                            {/* User */}
                            <td className="px-5 py-5">
                              <p className="font-semibold">
                                {item.name}
                              </p>

                              <p className="mt-1 break-all text-sm opacity-60">
                                {item.email}
                              </p>
                            </td>

                            {/* Provider */}
                            <td className="px-5 py-5">
                              <span className="capitalize">
                                {item.auth_provider}
                              </span>
                            </td>

                            {/* Role */}
                            <td className="px-5 py-5">
                              <span className="capitalize">
                                {item.user_type}
                              </span>
                            </td>

                            {/* Authorization */}
                            <td className="px-5 py-5">
                              {isAdmin ? (
                                <span
                                  className={
                                    isAuthorized
                                      ? 'font-semibold'
                                      : 'opacity-60'
                                  }
                                >
                                  {isAuthorized
                                    ? 'Authorized'
                                    : 'Pending'}
                                </span>
                              ) : (
                                <span className="opacity-60">
                                  Not applicable
                                </span>
                              )}
                            </td>

                            {/* Email */}
                            <td className="px-5 py-5">
                              <span
                                className={
                                  item.email_verified
                                    ? 'font-semibold'
                                    : 'opacity-60'
                                }
                              >
                                {item.email_verified
                                  ? 'Verified'
                                  : 'Not verified'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-5">

                              {isCurrentUser ? (
                                <span className="text-sm opacity-50">
                                  Current account
                                </span>
                              ) : isAdmin && !isAuthorized ? (
                                <Button
                                  variant="secondary"
                                  disabled={isLoading}
                                  onClick={() =>
                                    handleAuthorize(item.id)
                                  }
                                >
                                  {isLoading
                                    ? 'Authorizing...'
                                    : adminActionsLocked
                                      ? 'Locked'
                                      : 'Authorize'}
                                </Button>
                              ) : !isAdmin ? (
                                <Button
                                  disabled={isLoading || adminActionsLocked}
                                  onClick={() =>
                                    handlePromote(item.id)
                                  }
                                >
                                  {isLoading
                                    ? 'Promoting...'
                                    : adminActionsLocked
                                      ? 'Locked'
                                      : 'Promote'}
                                </Button>
                              ) : (
                                <span className="text-sm opacity-50">
                                  No action
                                </span>
                              )}

                            </td>

                          </tr>
                        )
                      })}
                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </section>

        </div>
      </Container>
    </main>
  )
}

export default AdminDashboard