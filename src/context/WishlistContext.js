'use client'
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { authApi, userApi } from '@/lib/api'

const WishlistContext = createContext(null)
const STORAGE_KEY = 'sv2_wishlist'

function loadGuest() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { map: {}, order: [] }
    const parsed = JSON.parse(raw)
    return {
      map: parsed.map || {},
      order: Array.isArray(parsed.order) ? parsed.order : []
    }
  } catch (_) {
    return { map: {}, order: [] }
  }
}

function persistGuest(map, order) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ map, order }))
  } catch (_) {
  }
}

export function WishlistProvider({ children }) {
  const [map, setMap] = useState({})
  const [order, setOrder] = useState([])
  const [signedIn, setSignedIn] = useState(false)
  const [ready, setReady] = useState(false)
  const signedInRef = useRef(false)

  const loadServer = useCallback(async () => {
    try {
      const data = await userApi.wishlist()
      const nextMap = {}
      const nextOrder = []
      for (const item of data.items || []) {
        nextMap[item.id] = item
        nextOrder.push(item.id)
      }
      setMap(nextMap)
      setOrder(nextOrder)
      return true
    } catch (_) {
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const syncAuth = async () => {
      try {
        await authApi.me()
        if (cancelled) return
        const wasGuest = !signedInRef.current
        setSignedIn(true)
        signedInRef.current = true
        if (wasGuest) {
          const guest = loadGuest()
          if (guest.order.length) {
            try {
              await userApi.wishlistMerge(guest.order)
            } catch (_) {
            }
            persistGuest({ map: {}, order: [] })
          }
        }
        await loadServer()
      } catch (_) {
        if (cancelled) return
        signedInRef.current = false
        setSignedIn(false)
        const guest = loadGuest()
        setMap(guest.map)
        setOrder(guest.order)
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    syncAuth()
    window.addEventListener('staffarc-auth', syncAuth)
    window.addEventListener('storage', syncAuth)
    return () => {
      cancelled = true
      window.removeEventListener('staffarc-auth', syncAuth)
      window.removeEventListener('storage', syncAuth)
    }
  }, [loadServer])

  const commit = useCallback((nextMap, nextOrder, persist = true) => {
    setMap(nextMap)
    setOrder(nextOrder)
    if (persist) persistGuest(nextMap, nextOrder)
  }, [])

  const removeById = useCallback((id) => {
    setMap(current => {
      const { [id]: _removed, ...rest } = current
      return rest
    })
    setOrder(current => current.filter(pid => pid !== id))
  }, [])

  const toggle = useCallback((product) => {
    if (!product?.id) return
    const id = product.id
    const currently = map[id] !== undefined

    if (!currently) {
      commit({ ...map, [id]: product }, [id, ...order.filter(pid => pid !== id)])
    } else {
      removeById(id)
    }

    if (!signedIn) {
      toast.success(currently ? 'Removed from wishlist' : 'Added to wishlist')
      return
    }

    userApi.wishlistToggle(id)
      .then(data => {
        if (data?.wishlisted) {
          setMap(current => (current[id] ? current : { ...current, [id]: product }))
        } else {
          removeById(id)
        }
      })
      .catch(() => {
        if (currently) {
          commit({ ...map, [id]: product }, [id, ...order.filter(pid => pid !== id)])
        } else {
          removeById(id)
        }
        toast.error('Could not update wishlist')
      })
  }, [map, order, signedIn, commit, removeById])

  const remove = useCallback((id) => {
    removeById(id)
    if (!signedIn) {
      toast.success('Removed from wishlist')
      return
    }
    userApi.wishlistRemove(id).catch(() => {
      toast.error('Could not update wishlist')
    })
  }, [signedIn, removeById])

  const value = {
    map,
    order,
    count: order.length,
    ready,
    signedIn,
    isWishlisted: (id) => Boolean(id && map[id]),
    toggle,
    remove
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within WishlistProvider')
  return context
}