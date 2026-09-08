import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'
import { getFreeQuantity, getOfferTotal, getPayableQuantity, isBuyGetOffer } from '../components/menu/offerPricing.js'
import { WHATSAPP_NUMBER } from '../config/siteConfig.js'

const CartContext = createContext(null)
const STORAGE_PREFIX = 'raisals-bakery-cart'

function getStorageKey(user) {
  return user?.id
    ? `${STORAGE_PREFIX}:user:${user.id}`
    : `${STORAGE_PREFIX}:guest`
}

function readCart(storageKey) {
  try {
    const stored = localStorage.getItem(storageKey)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const storageKey = getStorageKey(user)
  const [items, setItems] = useState([])
  const [hydratedKey, setHydratedKey] = useState(null)

  // Keep a separate cart for every authenticated customer.
  // Guest browsing uses its own isolated cart and is never mixed with
  // any customer's cart.
  useEffect(() => {
    if (authLoading) return

    setHydratedKey(null)
    setItems(readCart(storageKey))
    setHydratedKey(storageKey)
  }, [authLoading, storageKey])

  // Never save the previous customer's cart into the newly selected
  // customer's storage key while the cart is switching owners.
  useEffect(() => {
    if (authLoading || hydratedKey !== storageKey) return

    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [authLoading, hydratedKey, storageKey, items])

  function addItem(product, variant, quantity = 1) {
    setItems((current) => {
      const key = `${product.id}:${variant.id}`
      const found = current.find((item) => item.key === key)
      const offerEnabled = product.offerEnabled === true
      const price = Number(offerEnabled ? (variant.discountedPrice ?? variant.price) : variant.price)
      const originalPrice = Number(variant.originalPrice ?? variant.price)
      const offerLabel = offerEnabled ? (product.offerLabel || null) : null
      const offerText = offerEnabled ? (product.offerText || null) : null
      const offerType = offerEnabled ? (product.offerType || null) : null
      const buyQuantity = offerEnabled ? Number(product.offerBuyQuantity || 0) : 0
      const freeQuantity = offerEnabled ? Number(product.offerFreeQuantity || 0) : 0

      if (found) {
        return current.map((item) =>
          item.key === key
            ? {
                ...item,
                quantity: item.quantity + quantity,
                price,
                originalPrice,
                offerLabel,
                offerText,
                offerType,
                buyQuantity,
                freeQuantity,
              }
            : item,
        )
      }

      return [
        ...current,
        {
          key,
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantLabel: variant.label,
          weight: variant.weight,
          serves: variant.serves,
          price,
          originalPrice,
          offerLabel,
          offerText,
          offerType,
          buyQuantity,
          freeQuantity,
          quantity,
        },
      ]
    })
  }

  function updateQuantity(key, quantity) {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.key !== key)
        : current.map((item) =>
            item.key === key ? { ...item, quantity } : item,
          ),
    )
  }

  function removeItem(key) {
    setItems((current) => current.filter((item) => item.key !== key))
  }

  function clearCart() {
    setItems([])
  }

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0)
    const total = items.reduce((sum, item) => sum + getOfferTotal(item), 0)

    function whatsappMessage(sourceItems = items, delivery = {}) {
      const messageTotal = sourceItems.reduce((sum, item) => sum + getOfferTotal(item), 0)

      const lines = [
        "Hello! I'd like to order from Raisal's The Whispering Whisk:",
        '',
      ]

      sourceItems.forEach((item, index) => {
        const freeUnits = getFreeQuantity(item.quantity, item.buyQuantity, item.freeQuantity)
        const payableUnits = getPayableQuantity(item.quantity, item.buyQuantity, item.freeQuantity)
        if (isBuyGetOffer(item)) {
          lines.push(`${index + 1}. ${item.productName} — ${item.variantLabel}${item.weight ? ` (${item.weight})` : ''} × ${item.quantity} — ₹${getOfferTotal(item).toFixed(0)} (${item.offerLabel}; ${freeUnits} free, ${payableUnits} payable)`)
        } else if (item.offerType === 'custom') {
          lines.push(`${index + 1}. ${item.productName} — ${item.variantLabel}${item.weight ? ` (${item.weight})` : ''} × ${item.quantity} — ₹${getOfferTotal(item).toFixed(0)}${item.offerLabel ? ` (${item.offerLabel})` : ''}`)
        } else {
          lines.push(`${index + 1}. ${item.productName} — ${item.variantLabel}${item.weight ? ` (${item.weight})` : ''} × ${item.quantity} — ₹${getOfferTotal(item).toFixed(0)}${item.offerLabel ? ` (${item.offerLabel}, was ₹${(item.originalPrice * item.quantity).toFixed(0)})` : ''}`)
        }
      })

      lines.push('', `Total: ₹${messageTotal.toFixed(0)}`, '', '*Delivery Address:*')

      if (delivery.address && delivery.pincode) {
        lines.push(delivery.address, `Pincode: ${delivery.pincode}`)
      } else {
        lines.push('(Please provide your complete delivery address with pincode (below) before sending)')
      }

      lines.push('', 'Please note: Sending this message is an order request, not a confirmed order.', 'Our team will confirm availability and delivery details with you on WhatsApp. Thank you!')

      return lines.join('\n')
    }

    function orderSingle(product, variant) {
      const offerEnabled = product.offerEnabled === true
      const item = {
        productName: product.name,
        variantLabel: variant.label,
        weight: variant.weight,
        serves: variant.serves,
        price: Number(offerEnabled ? (variant.discountedPrice ?? variant.price) : variant.price),
        originalPrice: Number(variant.originalPrice ?? variant.price),
        offerLabel: offerEnabled ? (product.offerLabel || null) : null,
        offerType: offerEnabled ? (product.offerType || null) : null,
        buyQuantity: offerEnabled ? Number(product.offerBuyQuantity || 0) : 0,
        freeQuantity: offerEnabled ? Number(product.offerFreeQuantity || 0) : 0,
        quantity: 1,
      }

      const message = whatsappMessage([item])
      window.open(
        `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
        '_blank',
        'noopener,noreferrer',
      )
    }

    return {
      items,
      count,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      whatsappMessage,
      orderSingle,
    }
  }, [items])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
