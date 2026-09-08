import { useEffect, useRef, useState } from 'react'
import Button from '../common/Button'
import {
  getAdminHomeMedia,
  getUploadSignature,
  registerMedia,
  assignHomeMedia,
  deleteHomeMedia,
  deleteRegisteredMedia,
} from '../../services/homeService.js'

const SLOTS = [
  { key: 'hero', label: 'Hero', description: 'Main Home hero media.' },
  { key: 'kitchen_1', label: 'Kitchen — Freshly Prepared', description: 'First kitchen media placeholder.' },
  { key: 'kitchen_2', label: 'Kitchen — Made from Scratch', description: 'Second kitchen media placeholder.' },
  { key: 'kitchen_3', label: 'Kitchen — Behind the Bake', description: 'Third kitchen media placeholder.' },
  { key: 'kitchen_4', label: 'Kitchen — Made with Love', description: 'Fourth kitchen media placeholder.' },
  { key: 'story', label: 'Story', description: 'Bakery / team story media.' },
]

function MediaPreview({ media }) {
  if (!media?.url) return <div className="placeholder-shimmer flex aspect-video items-center justify-center text-sm opacity-60">No media assigned</div>
  if (media.resourceType === 'video') return <video className="aspect-video w-full object-contain" src={media.url} controls muted playsInline preload="metadata" />
  return <img className="aspect-video w-full object-contain" src={media.url} alt={media.altText || 'Home media'} />
}

async function uploadToCloudinary(file) {
  const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
  const signatureResult = await getUploadSignature(resourceType)
  const data = signatureResult?.data
  if (!signatureResult?.success || !data) throw new Error('Could not prepare the media upload.')

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', data.apiKey)
  form.append('timestamp', data.timestamp)
  form.append('signature', data.signature)
  form.append('folder', data.folder)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${data.cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: form,
  })
  const result = await response.json()
  if (!response.ok || !result.public_id) throw new Error(result?.error?.message || 'Cloudinary upload failed.')

  const registered = await registerMedia({
    publicId: result.public_id,
    secureUrl: result.secure_url,
    resourceType: result.resource_type,
    folder: data.folder,
    originalFilename: result.original_filename,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
  })
  return registered.data.media
}

function HomeMediaManager() {
  const [media, setMedia] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const inputs = useRef({})

  async function load() {
    setLoading(true)
    try {
      const result = await getAdminHomeMedia()
      setMedia(result?.data?.home?.media || {})
      setError('')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleFile(placement, file) {
    if (!file) return
    setBusy(placement)
    setError('')
    setMessage('')
    let newMedia = null
    try {
      newMedia = await uploadToCloudinary(file)
      await assignHomeMedia(placement, newMedia.id)
      setMedia((current) => ({ ...current, [placement]: newMedia }))
      setMessage(`${SLOTS.find((slot) => slot.key === placement)?.label} media updated.`)
    } catch (nextError) {
      if (newMedia?.id) {
        try { await deleteRegisteredMedia(newMedia.id) } catch { /* Best-effort cleanup after a failed assignment. */ }
      }
      setError(nextError.message)
    } finally {
      setBusy(null)
      if (inputs.current[placement]) inputs.current[placement].value = ''
    }
  }

  async function handleDelete(placement) {
    if (!window.confirm('Delete this Home media? It will also be removed from Cloudinary.')) return
    setBusy(placement)
    setError('')
    setMessage('')
    try {
      await deleteHomeMedia(placement)
      setMedia((current) => ({ ...current, [placement]: null }))
      setMessage(`${SLOTS.find((slot) => slot.key === placement)?.label} media deleted.`)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setBusy(null)
    }
  }

  if (loading) return <section className="mt-12 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8">Loading Home media...</section>

  return <section className="mt-12">
    <div className="mb-5"><h2 className="text-3xl">Home Media</h2><p className="mt-2 text-sm opacity-70">Manage only the predefined media placeholders on the Home page. The page layout and copy remain fixed.</p></div>
    {error && <div role="alert" className="mb-5 rounded-[var(--radius-button)] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {message && <div className="mb-5 rounded-[var(--radius-button)] border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
    <div className="grid gap-6 lg:grid-cols-2">
      {SLOTS.map((slot) => {
        const asset = media[slot.key]
        const isBusy = busy === slot.key
        return <article key={slot.key} className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
          <MediaPreview media={asset} />
          <div className="p-5"><h3 className="text-xl">{slot.label}</h3><p className="mt-1 text-sm opacity-65">{slot.description}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <input ref={(node) => { inputs.current[slot.key] = node }} type="file" accept="image/*,video/*" className="hidden" onChange={(event) => handleFile(slot.key, event.target.files?.[0])} />
              <Button disabled={isBusy} onClick={() => inputs.current[slot.key]?.click()}>{isBusy ? 'Updating...' : asset ? 'Replace Media' : 'Upload Media'}</Button>
              {asset && <Button variant="secondary" disabled={isBusy} onClick={() => handleDelete(slot.key)}>Delete</Button>}
            </div>
            {asset && <p className="mt-3 break-all text-xs opacity-50">{asset.publicId}</p>}
          </div>
        </article>
      })}
    </div>
  </section>
}
export default HomeMediaManager
