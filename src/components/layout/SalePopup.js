'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { catalogApi } from '@/lib/api'

const STORAGE_KEY = 'staffarc_popup_seen_at'

// Admin enters the destination as a store path — e.g. "plp?tag=SALE" or
// "/plp?category=earrings&subcategory=general". We keep whatever follows the domain
// "/" and normalize it into a valid href (full URLs like https://… pass through).
function normHref(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return value.startsWith('/') ? value : `/${value}`
}

const EXTERNAL = /^https?:\/\//i

export default function SalePopup() {
  const [config, setConfig] = useState(null)
  const [open, setOpen] = useState(false)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    catalogApi.popup()
      .then(data => { if (!cancelled) setConfig(data || null) })
      .catch(() => { if (!cancelled) setConfig(null) })
    return () => { cancelled = true }
  }, [])

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch (_) { /* storage unavailable — just skip persistence */ }
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    markSeen()
  }, [markSeen])

  const onCta = useCallback(() => {
    markSeen()
    setOpen(false)
  }, [markSeen])

  // Gate + scheduled delay. Shows at most once per repeat interval (24h default —
  // repeatAfterDays is hours * days), tracked in localStorage, then auto-dismisses.
  useEffect(() => {
    if (!config?.enabled || !String(config.title || '').trim()) return undefined
    let lastSeen = 0
    try { lastSeen = Number(window.localStorage.getItem(STORAGE_KEY)) || 0 } catch (_) { /* ignore */ }
    const repeatHours = (Number(config.repeatAfterDays) || 1) * 24
    if (Date.now() - lastSeen < repeatHours * 60 * 60 * 1000) return undefined

    const delaySeconds = Number(config.delaySeconds)
    const delay = Math.max(0, Number.isFinite(delaySeconds) ? delaySeconds : 5) * 1000
    const timer = window.setTimeout(() => {
      restoreRef.current = document.activeElement
      setOpen(true)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [config])

  // Scroll lock + focus management + keyboard support while open.
  useEffect(() => {
    if (!open) return undefined
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(dialogRef.current.querySelectorAll('a[href],button:not([disabled])'))
        if (!focusables.length) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
      restoreRef.current?.focus?.()
    }
  }, [open, close])

  const title = String(config?.title || '').trim()
  if (!config || !config.enabled || !title || !open) return null

  const accent = String(config.color || '').match(/^#[0-9a-fA-F]{6}$/) ? config.color : 'var(--color-primary)'
  const href = normHref(config.buttonUrl)
  const buttonText = String(config.buttonText || '').trim()
  const showCta = Boolean(href) && Boolean(buttonText)

  return (
    <div className="sale-popup-backdrop" onClick={close} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sale-popup-title"
        className="sale-popup-card"
        onClick={e => e.stopPropagation()}
      >
        <button ref={closeButtonRef} type="button" onClick={close} aria-label="Close sale popup" className="sale-popup-close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>

        {showCta && (
          <div className="sale-popup-banner" style={{ background: accent }}>
            <p className="sale-popup-tag">Exclusive Offer</p>
            <h2 id="sale-popup-title" className="sale-popup-title">{title}</h2>
          </div>
        )}
        {!showCta && <h2 id="sale-popup-title" className="sale-popup-title">{title}</h2>}

        {String(config.description || '').trim() && <p className="sale-popup-desc">{config.description}</p>}

        {showCta && (EXTERNAL.test(href) ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="sale-popup-cta" style={{ background: accent }} onClick={onCta}>{buttonText}</a>
        ) : (
          <Link href={href} className="sale-popup-cta" style={{ background: accent }} onClick={onCta}>{buttonText}</Link>
        ))}
      </div>
    </div>
  )
}