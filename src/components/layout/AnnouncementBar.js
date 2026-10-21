'use client'
import { useEffect, useState } from 'react'
import { catalogApi } from '@/lib/api'

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([])
  const [current, setCurrent] = useState(0)
  const shouldSlide = announcements.length > 1

  useEffect(() => {
    catalogApi.home()
      .then(data => {
        const messages = data.announcementBar?.messages?.filter(Boolean)
        setAnnouncements(messages || [])
      })
      .catch(() => setAnnouncements([]))
  }, [])

  useEffect(() => {
    setCurrent(0)
    if (!shouldSlide) return undefined
    const timer = window.setInterval(() => {
      setCurrent(index => (index + 1) % announcements.length)
    }, 10000)
    return () => window.clearInterval(timer)
  }, [announcements.length, shouldSlide])

  if (!announcements.length) return null

// If there is only 1 message, repeat it with separators so it fills the scrolling track
const singleText = announcements.join('  •  ')
const tickerText = announcements.length === 1 
  ? `${singleText}  •  ${singleText}  •  ${singleText}` 
  : singleText

return (
  <div className="announcement-bar bg-primary text-white text-xs tracking-[0.15em] uppercase font-bold font-body overflow-hidden py-2" aria-label="Store announcements">
    <div className="marquee w-full overflow-hidden">
      <div className="marquee__track flex whitespace-nowrap">
        <span className="px-8">{tickerText}</span>
        <span className="px-8">{tickerText}</span>
        <span className="px-8">{tickerText}</span>
        <span className="px-8">{tickerText}</span>
      </div>
    </div>
  </div>
)
}
