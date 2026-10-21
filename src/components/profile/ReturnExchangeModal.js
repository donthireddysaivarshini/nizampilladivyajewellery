'use client'
import { useState } from 'react'
import { X, UploadCloud, Loader2, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { returnExchangeApi } from '@/lib/api'

const REASONS = [
  { value: 'damaged', label: 'Damaged product' },
  { value: 'wrong_item', label: 'Wrong item delivered' },
  { value: 'size_issue', label: 'Size / fit issue' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'quality_issue', label: 'Quality issue' },
  { value: 'other', label: 'Other' }
]

// order: the order object from orderApi.get() (needs .id)
// item: one entry from order.products (needs .orderItemId, .name, .size, .qty)
export default function ReturnExchangeModal({ order, item, onClose, onSubmitted }) {
  const [type, setType] = useState('return')
  const [reasonCategory, setReasonCategory] = useState('damaged')
  const [reasonNotes, setReasonNotes] = useState('')
  const [driveLink, setDriveLink] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, 5 - images.length)
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        const uploaded = await returnExchangeApi.uploadEvidence(file)
        setImages(current => [...current, uploaded.url])
      }
    } catch (error) {
      toast.error(error.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url) => setImages(current => current.filter(entry => entry !== url))

  const submit = async () => {
    if (!images.length && !driveLink.trim()) {
      toast.error('Attach at least one image or a Drive link with the unboxing video')
      return
    }
    setSubmitting(true)
    try {
      await returnExchangeApi.create(order.id, item.orderItemId, {
        type,
        reasonCategory,
        reasonNotes: reasonNotes.trim() || undefined,
        images: images.length ? images : undefined,
        driveLink: driveLink.trim() || undefined
      })
      toast.success(type === 'return' ? 'Return request submitted' : 'Exchange request submitted')
      onSubmitted?.()
    } catch (error) {
      toast.error(error.message || 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[1100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-[560px] w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-line">
          <div>
            <p className="text-[11px] uppercase tracking-[0.15em] text-ink-faint mb-1">Return or Exchange</p>
            <h3 className="font-display text-2xl font-bold">{item.name}</h3>
            <p className="text-[12px] text-ink-muted mt-0.5">Size: {item.size} · Qty: {item.qty}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center text-ink-muted hover:text-ink transition-colors" aria-label="Close">
            <X size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold mb-2">What would you like to do?</p>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: 'return', label: 'Return' }, { id: 'exchange', label: 'Exchange' }].map(opt => (
                <button key={opt.id} type="button" onClick={() => setType(opt.id)}
                  className={`rounded-xl border-2 py-3 text-[13px] font-semibold transition-all ${type === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-line text-ink-mid hover:border-ink/20'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            {type === 'exchange' && (
              <p className="mt-2 text-[12px] text-ink-muted">If approved, you&apos;ll get a one-time coupon worth this item&apos;s value (plus shipping) to use on a new order.</p>
            )}
          </div>

          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">Reason</span>
            <select value={reasonCategory} onChange={e => setReasonCategory(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[14px] outline-none focus:border-primary">
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">Additional details (optional)</span>
            <textarea value={reasonNotes} onChange={e => setReasonNotes(e.target.value)} rows={3} placeholder="Tell us more..."
              className="mt-1.5 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[14px] outline-none focus:border-primary" />
          </label>

          <div>
            <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">Evidence — image(s) or a Drive link with the unboxing video</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map(url => (
                <div key={url} className="relative h-16 w-16 rounded-lg overflow-hidden border border-line">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => removeImage(url)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center text-[10px]" aria-label="Remove image">×</button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="h-16 w-16 rounded-lg border border-dashed border-line flex items-center justify-center cursor-pointer hover:border-primary text-ink-faint">
                  {uploading ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={e => handleFiles(e.target.files)} />
                </label>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <LinkIcon size={14} className="text-ink-faint shrink-0" />
              <input value={driveLink} onChange={e => setDriveLink(e.target.value)} placeholder="Google Drive link (optional if images added)"
                className="flex-1 rounded-xl border border-line bg-white px-3 py-2.5 text-[13px] outline-none focus:border-primary" />
            </div>
          </div>

          <button type="button" disabled={submitting || uploading} onClick={submit}
            className="w-full rounded-xl bg-primary py-3.5 text-[14px] font-bold text-white hover:bg-primary-dark transition-colors disabled:opacity-60">
            {submitting ? 'Submitting...' : `Submit ${type === 'return' ? 'Return' : 'Exchange'} Request`}
          </button>
        </div>
      </div>
    </div>
  )
}