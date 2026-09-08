import cloudinary from '../config/cloudinary.js'
import pool from '../config/database.js'
import { sendEmail } from './emailService.js'
import { createProductReviewEmail } from '../emails/productReviewEmail.js'
import { getAvatarUrl } from '../config/cloudinary.js'

const MAX_PRODUCT_MEDIA = 5

function fail(code, message, extra = {}) {
  const error = new Error(message)
  error.code = code
  Object.assign(error, extra)
  throw error
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value) {
  return clean(value).toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function validateProductPayload(data, partial = false) {
  if (!data || typeof data !== 'object') fail('VALIDATION_ERROR', 'Product data is required.')
  const fields = {}
  if (!partial || data.name !== undefined) {
    const name = clean(data.name)
    if (name.length < 2 || name.length > 150) fields.name = 'Name must be 2–150 characters.'
  }
  if (!partial || data.category !== undefined) {
    const category = clean(data.category)
    if (category.length < 2 || category.length > 100) fields.category = 'Category must be 2–100 characters.'
  }
  if (!partial || data.description !== undefined) {
    const description = clean(data.description)
    if (!description || description.length > 3000) fields.description = 'Description is required and must be at most 3000 characters.'
  }
  if (data.isAvailable !== undefined && typeof data.isAvailable !== 'boolean') fields.isAvailable = 'Availability must be true or false.'
  if (data.offerEnabled !== undefined && typeof data.offerEnabled !== 'boolean') fields.offerEnabled = 'Offer status must be true or false.'
  if (data.offerType !== undefined && !['percentage', 'fixed', 'buy_get', 'custom'].includes(data.offerType)) fields.offerType = 'Offer type must be percentage, fixed, Buy X Get Y Free, or Custom Offer.'
  if (data.offerEnabled === true && data.offerType === 'custom' && (typeof data.offerText !== 'string' || data.offerText.trim().length < 1 || data.offerText.trim().length > 120)) fields.offerText = 'Custom offer must contain 1–120 characters.'
  if (data.offerValue !== undefined) {
    const value = Number(data.offerValue)
    if (!Number.isFinite(value) || value < 0) fields.offerValue = 'Discount must be a valid non-negative number.'
    if (data.offerType === 'percentage' && value > 100) fields.offerValue = 'Percentage discount cannot exceed 100%.'
  }
  if (data.offerEnabled === true) {
    const offerType = data.offerType || 'percentage'
    if (offerType === 'buy_get') {
      const buyQuantity = Number(data.offerBuyQuantity)
      const freeQuantity = Number(data.offerFreeQuantity)
      if (!Number.isInteger(buyQuantity) || buyQuantity < 1) fields.offerBuyQuantity = 'Buy quantity must be a positive whole number.'
      if (!Number.isInteger(freeQuantity) || freeQuantity < 1) fields.offerFreeQuantity = 'Free quantity must be a positive whole number.'
    } else if (offerType === 'custom') {
      if (typeof data.offerText !== 'string' || !data.offerText.trim() || data.offerText.trim().length > 120) {
        fields.offerText = 'Enter a custom offer between 1 and 120 characters.'
      }
    } else {
      const offerValue = Number(data.offerValue)
      if (!Number.isFinite(offerValue) || offerValue <= 0) fields.offerValue = 'Enter a discount greater than 0 when the offer is enabled.'
      if (offerType === 'percentage' && offerValue > 100) fields.offerValue = 'Percentage discount cannot exceed 100%.'
    }
  }
  if (Object.keys(fields).length) fail('VALIDATION_ERROR', 'Please check the product information.', { fields })
}

function validateVariant(variant) {
  const label = clean(variant?.label)
  const serves = variant?.serves === '' || variant?.serves === null || variant?.serves === undefined ? null : Number(variant.serves)
  const price = Number(variant?.price)
  const weight = variant?.weightGrams === null || variant?.weightGrams === '' || variant?.weightGrams === undefined
    ? null : Number(variant.weightGrams)
  if (!label || label.length > 80) fail('VALIDATION_ERROR', 'Variant label is required and must be at most 80 characters.')
  if (serves !== null && (!Number.isInteger(serves) || serves < 1)) fail('VALIDATION_ERROR', 'Variant servings must be a positive whole number.')
  if (!Number.isFinite(price) || price < 0) fail('VALIDATION_ERROR', 'Variant price must be a valid non-negative number.')
  if (weight !== null && (!Number.isInteger(weight) || weight < 1)) fail('VALIDATION_ERROR', 'Variant weight must be a positive whole number.')
  return { label, serves, price, weight }
}

function calculateOfferPrice(price, offerEnabled, offerType, offerValue) {
  const originalPrice = Number(price)
  if (!offerEnabled || !Number.isFinite(originalPrice) || offerType === 'buy_get') return originalPrice
  const value = Number(offerValue)
  if (!Number.isFinite(value) || value <= 0) return originalPrice
  const discounted = offerType === 'fixed'
    ? originalPrice - value
    : originalPrice - (originalPrice * value / 100)
  return Math.max(0, Math.round(discounted * 100) / 100)
}

function getOfferLabel(offerEnabled, offerType, offerValue, offerBuyQuantity, offerFreeQuantity, offerText = null) {
  if (!offerEnabled) return null
  if (offerType === 'buy_get') {
    const buy = Number(offerBuyQuantity)
    const free = Number(offerFreeQuantity)
    if (!Number.isInteger(buy) || buy < 1 || !Number.isInteger(free) || free < 1) return null
    return `BUY ${buy} GET ${free} FREE`
  }
  if (offerType === 'custom') return typeof offerText === 'string' && offerText.trim() ? offerText.trim() : null
  if (!Number.isFinite(Number(offerValue)) || Number(offerValue) <= 0) return null
  return offerType === 'fixed'
    ? `₹${Number(offerValue).toFixed(0)} OFF`
    : `${Number(offerValue).toFixed(Number(offerValue) % 1 ? 2 : 0)}% OFF`
}

function serializeVariant(row, offer = {}) {
  const offerEnabled = offer.offerEnabled === true
  const originalPrice = Number(row.price)
  const discountedPrice = calculateOfferPrice(originalPrice, offerEnabled, offer.offerType, offer.offerValue)
  return {
    id: row.id,
    label: row.label,
    weightGrams: row.weight_grams,
    weight: row.weight_grams ? `${row.weight_grams}g` : null,
    serves: row.serves,
    price: originalPrice,
    originalPrice,
    discountedPrice,
    hasDiscount: discountedPrice < originalPrice,
    offerType: offerEnabled ? (offer.offerType || null) : null,
    offerBuyQuantity: offerEnabled ? Number(offer.offerBuyQuantity || 0) : 0,
    offerFreeQuantity: offerEnabled ? Number(offer.offerFreeQuantity || 0) : 0,
    displayOrder: row.display_order,
  }
}

function serializeMedia(row) {
  return {
    id: row.id,
    mediaId: row.media_id,
    url: row.secure_url,
    resourceType: row.resource_type,
    format: row.format,
    altText: row.alt_text,
    displayOrder: row.display_order,
  }
}

async function getProductById(client, id) {
  const productResult = await client.query(
    `SELECT id, name, slug, category, description, is_available, offer_enabled, offer_type, offer_value, offer_buy_quantity, offer_free_quantity, offer_text, created_at, updated_at FROM products WHERE id = $1`,
    [id],
  )
  if (!productResult.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.')
  const product = productResult.rows[0]
  const [variants, media] = await Promise.all([
    client.query(`SELECT id, label, weight_grams, serves, price, display_order FROM product_variants WHERE product_id = $1 ORDER BY display_order`, [id]),
    client.query(`
      SELECT pm.id, pm.media_id, pm.display_order, m.secure_url, m.resource_type, m.format, m.alt_text
      FROM product_media pm INNER JOIN media m ON m.id = pm.media_id
      WHERE pm.product_id = $1 ORDER BY pm.display_order
    `, [id]),
  ])
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    isAvailable: product.is_available,
    offerEnabled: product.offer_enabled,
    offerType: product.offer_type,
    offerValue: Number(product.offer_value || 0),
    offerBuyQuantity: Number(product.offer_buy_quantity || 0),
    offerFreeQuantity: Number(product.offer_free_quantity || 0),
    offerText: product.offer_text,
    offerLabel: getOfferLabel(product.offer_enabled, product.offer_type, product.offer_value, product.offer_buy_quantity, product.offer_free_quantity, product.offer_text),
    variants: variants.rows.map((row) => serializeVariant(row, { offerEnabled: product.offer_enabled, offerType: product.offer_type, offerValue: product.offer_value, offerBuyQuantity: product.offer_buy_quantity, offerFreeQuantity: product.offer_free_quantity })),
    media: media.rows.map(serializeMedia),
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  }
}

export async function listProducts({ includeUnavailable = false, category = '', offersOnly = false } = {}) {
  const params = []
  const conditions = []
  if (!includeUnavailable) { params.push(true); conditions.push(`p.is_available = $${params.length}`) }
  if (offersOnly) conditions.push(`p.offer_enabled = TRUE AND (p.offer_value > 0 OR (p.offer_type = 'buy_get' AND p.offer_buy_quantity > 0 AND p.offer_free_quantity > 0) OR (p.offer_type = 'custom' AND NULLIF(trim(p.offer_text), '') IS NOT NULL))`)
  if (clean(category)) { params.push(clean(category)); conditions.push(`LOWER(p.category) = LOWER($${params.length})`) }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(`
    SELECT
      p.id, p.name, p.slug, p.category, p.description, p.is_available, p.offer_enabled, p.offer_type, p.offer_value, p.offer_buy_quantity, p.offer_free_quantity, p.offer_text, p.created_at, p.updated_at,
      COALESCE((SELECT AVG(r.rating) FROM product_reviews r WHERE r.product_id = p.id), 0)::numeric(3,2) AS average_rating,
      (SELECT COUNT(*)::integer FROM product_reviews r WHERE r.product_id = p.id) AS review_count,
      COALESCE((SELECT MIN(v.price) FROM product_variants v WHERE v.product_id = p.id), 0)::numeric(10,2) AS min_price
    FROM products p
    ${where}
    ORDER BY p.category, p.created_at, p.name
  `, params)
  const ids = result.rows.map((r) => r.id)
  if (!ids.length) return []
  const [variants, media] = await Promise.all([
    pool.query(`SELECT id, product_id, label, weight_grams, serves, price, display_order FROM product_variants WHERE product_id = ANY($1) ORDER BY display_order`, [ids]),
    pool.query(`
      SELECT pm.product_id, pm.media_id, pm.display_order, m.secure_url, m.resource_type, m.format, m.alt_text
      FROM product_media pm INNER JOIN media m ON m.id = pm.media_id
      WHERE pm.product_id = ANY($1) ORDER BY pm.product_id, pm.display_order
    `, [ids]),
  ])
  return result.rows.map((row) => ({
    id: row.id, name: row.name, slug: row.slug, category: row.category,
    description: row.description, isAvailable: row.is_available, offerEnabled: row.offer_enabled, offerType: row.offer_type, offerValue: Number(row.offer_value || 0), offerBuyQuantity: Number(row.offer_buy_quantity || 0), offerFreeQuantity: Number(row.offer_free_quantity || 0), offerText: row.offer_text, offerLabel: getOfferLabel(row.offer_enabled, row.offer_type, row.offer_value, row.offer_buy_quantity, row.offer_free_quantity, row.offer_text),
    averageRating: Number(row.average_rating), reviewCount: row.review_count,
    minPrice: Number(row.min_price),
    variants: variants.rows.filter((v) => v.product_id === row.id).map((v) => serializeVariant(v, { offerEnabled: row.offer_enabled, offerType: row.offer_type, offerValue: row.offer_value, offerBuyQuantity: row.offer_buy_quantity, offerFreeQuantity: row.offer_free_quantity })),
    media: media.rows.filter((m) => m.product_id === row.id).map((m) => serializeMedia({ ...m, id: m.media_id })),
  }))
}

export async function getProduct(id) {
  const product = await getProductById(pool, id)
  const reviews = await listProductReviews(id)
  return { ...product, averageRating: reviews.summary.average, reviewCount: reviews.summary.count, reviews: reviews.reviews }
}

export async function createProduct(data) {
  validateProductPayload(data)
  const name = clean(data.name), category = clean(data.category), description = clean(data.description)
  const slug = slugify(data.slug || name)
  if (!slug) fail('VALIDATION_ERROR', 'A valid product name or slug is required.')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(`
      INSERT INTO products (name, slug, category, description, is_available, offer_enabled, offer_type, offer_value, offer_buy_quantity, offer_free_quantity, offer_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [name, slug, category, description, data.isAvailable !== false, data.offerEnabled === true, data.offerType || 'percentage', data.offerType === 'buy_get' || data.offerType === 'custom' ? 0 : Number(data.offerValue || 0), data.offerBuyQuantity == null ? 1 : Number(data.offerBuyQuantity), data.offerFreeQuantity == null ? 1 : Number(data.offerFreeQuantity), data.offerEnabled === true ? getOfferLabel(true, data.offerType || 'percentage', Number(data.offerValue), Number(data.offerBuyQuantity), Number(data.offerFreeQuantity), data.offerText) : null])
    const product = await getProductById(client, result.rows[0].id)
    await client.query('COMMIT')
    return product
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function updateProduct(id, data) {
  validateProductPayload(data, true)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const current = await client.query(`SELECT * FROM products WHERE id = $1 FOR UPDATE`, [id])
    if (!current.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.')
    const row = current.rows[0]
    const name = data.name !== undefined ? clean(data.name) : row.name
    const category = data.category !== undefined ? clean(data.category) : row.category
    const description = data.description !== undefined ? clean(data.description) : row.description
    const slug = data.slug !== undefined ? slugify(data.slug) : row.slug
    const available = data.isAvailable !== undefined ? data.isAvailable : row.is_available
    const offerEnabled = data.offerEnabled !== undefined ? data.offerEnabled : row.offer_enabled
    const offerType = data.offerType !== undefined ? data.offerType : row.offer_type
    const offerValue = (offerType === 'buy_get' || offerType === 'custom') ? 0 : (data.offerValue !== undefined ? Number(data.offerValue) : Number(row.offer_value || 0))
    const offerBuyQuantity = offerType === 'buy_get' ? (data.offerBuyQuantity !== undefined ? Number(data.offerBuyQuantity) : Number(row.offer_buy_quantity || 1)) : Number(row.offer_buy_quantity || 1)
    const offerFreeQuantity = offerType === 'buy_get' ? (data.offerFreeQuantity !== undefined ? Number(data.offerFreeQuantity) : Number(row.offer_free_quantity || 1)) : Number(row.offer_free_quantity || 1)
    const offerText = offerEnabled ? (offerType === 'custom' ? clean(data.offerText !== undefined ? data.offerText : row.offer_text) : getOfferLabel(true, offerType, offerValue, offerBuyQuantity, offerFreeQuantity, data.offerText)) : null
    await client.query(`UPDATE products SET name=$2, slug=$3, category=$4, description=$5, is_available=$6, offer_enabled=$7, offer_type=$8, offer_value=$9, offer_buy_quantity=$10, offer_free_quantity=$11, offer_text=$12, updated_at=NOW() WHERE id=$1`, [id, name, slug, category, description, available, offerEnabled, offerType, offerValue, offerBuyQuantity, offerFreeQuantity, offerText])
    const product = await getProductById(client, id)
    await client.query('COMMIT')
    return product
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function saveProductAndVariants(id, data, variants) {
  validateProductPayload(data, true)
  if (!Array.isArray(variants) || variants.length < 1) {
    fail('VALIDATION_ERROR', 'At least one product variant is required.')
  }
  const normalized = variants.map(validateVariant)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const current = await client.query(`SELECT * FROM products WHERE id = $1 FOR UPDATE`, [id])
    if (!current.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.')
    const row = current.rows[0]
    const name = data.name !== undefined ? clean(data.name) : row.name
    const category = data.category !== undefined ? clean(data.category) : row.category
    const description = data.description !== undefined ? clean(data.description) : row.description
    const slug = data.slug !== undefined ? slugify(data.slug) : row.slug
    const available = data.isAvailable !== undefined ? data.isAvailable : row.is_available
    const offerEnabled = data.offerEnabled !== undefined ? data.offerEnabled : row.offer_enabled
    const offerType = data.offerType !== undefined ? data.offerType : row.offer_type
    const offerValue = (offerType === 'buy_get' || offerType === 'custom') ? 0 : (data.offerValue !== undefined ? Number(data.offerValue) : Number(row.offer_value || 0))
    const offerBuyQuantity = offerType === 'buy_get' ? (data.offerBuyQuantity !== undefined ? Number(data.offerBuyQuantity) : Number(row.offer_buy_quantity || 1)) : Number(row.offer_buy_quantity || 1)
    const offerFreeQuantity = offerType === 'buy_get' ? (data.offerFreeQuantity !== undefined ? Number(data.offerFreeQuantity) : Number(row.offer_free_quantity || 1)) : Number(row.offer_free_quantity || 1)
    const offerText = offerEnabled ? (offerType === 'custom' ? clean(data.offerText !== undefined ? data.offerText : row.offer_text) : getOfferLabel(true, offerType, offerValue, offerBuyQuantity, offerFreeQuantity, data.offerText)) : null

    await client.query(
      `UPDATE products SET name=$2, slug=$3, category=$4, description=$5, is_available=$6, offer_enabled=$7, offer_type=$8, offer_value=$9, offer_buy_quantity=$10, offer_free_quantity=$11, offer_text=$12, updated_at=NOW() WHERE id=$1`,
      [id, name, slug, category, description, available, offerEnabled, offerType, offerValue, offerBuyQuantity, offerFreeQuantity, offerText],
    )
    await client.query(`DELETE FROM product_variants WHERE product_id=$1`, [id])
    for (let i = 0; i < normalized.length; i++) {
      const v = normalized[i]
      await client.query(
        `INSERT INTO product_variants (product_id,label,weight_grams,serves,price,display_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, v.label, v.weight, v.serves, v.price, i],
      )
    }
    const product = await getProductById(client, id)
    await client.query('COMMIT')
    const reviews = await listProductReviews(id)
    return { ...product, averageRating: reviews.summary.average, reviewCount: reviews.summary.count, reviews: reviews.reviews }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function replaceVariants(productId, variants) {
  if (!Array.isArray(variants) || variants.length < 1) fail('VALIDATION_ERROR', 'At least one product variant is required.')
  const normalized = variants.map(validateVariant)
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`SELECT id FROM products WHERE id=$1 FOR UPDATE`, [productId]).then((r) => { if (!r.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.') })
    await client.query(`DELETE FROM product_variants WHERE product_id=$1`, [productId])
    for (let i = 0; i < normalized.length; i++) {
      const v = normalized[i]
      await client.query(`INSERT INTO product_variants (product_id,label,weight_grams,serves,price,display_order) VALUES ($1,$2,$3,$4,$5,$6)`, [productId, v.label, v.weight, v.serves, v.price, i])
    }
    const product = await getProductById(client, productId)
    await client.query('COMMIT')
    return product
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

async function destroyMedia(media) {
  const result = await cloudinary.uploader.destroy(media.cloudinary_public_id, { resource_type: media.resource_type, invalidate: true })
  if (result.result !== 'ok' && result.result !== 'not found') fail('CLOUDINARY_DELETE_ERROR', 'Cloudinary did not confirm media deletion.')
}

export async function attachProductMedia(productId, mediaId, displayOrder) {
  const order = Number(displayOrder)
  if (!Number.isInteger(order) || order < 1 || order > MAX_PRODUCT_MEDIA) fail('VALIDATION_ERROR', 'Product media position must be between 1 and 5.')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const product = await client.query(`SELECT id FROM products WHERE id=$1 FOR UPDATE`, [productId])
    if (!product.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.')
    const media = await client.query(`SELECT id, cloudinary_public_id, resource_type, secure_url, format, alt_text FROM media WHERE id=$1`, [mediaId])
    if (!media.rows[0]) fail('MEDIA_NOT_FOUND', 'Selected media was not found.')
    const count = await client.query(`SELECT COUNT(*)::integer AS count FROM product_media WHERE product_id=$1`, [productId])
    const existing = await client.query(`SELECT pm.id, pm.media_id, m.cloudinary_public_id, m.resource_type FROM product_media pm INNER JOIN media m ON m.id=pm.media_id WHERE pm.product_id=$1 AND pm.display_order=$2 FOR UPDATE`, [productId, order])
    if (!existing.rows[0] && count.rows[0].count >= MAX_PRODUCT_MEDIA) fail('PRODUCT_MEDIA_LIMIT', 'A product can have at most 5 media items.')
    if (existing.rows[0]) {
      await destroyMedia(existing.rows[0])
      await client.query(`DELETE FROM product_media WHERE id=$1`, [existing.rows[0].id])
      await client.query(`DELETE FROM media WHERE id=$1`, [existing.rows[0].media_id])
    }
    const result = await client.query(`INSERT INTO product_media (product_id, media_id, display_order) VALUES ($1,$2,$3) RETURNING id`, [productId, mediaId, order])
    await client.query('COMMIT')
    return { id: result.rows[0].id, mediaId: mediaId, displayOrder: order }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function removeProductMedia(productId, mediaId) {
  const client = await pool.connect()
  let media = null
  try {
    await client.query('BEGIN')
    const result = await client.query(`SELECT pm.id, pm.media_id, m.cloudinary_public_id, m.resource_type FROM product_media pm INNER JOIN media m ON m.id=pm.media_id WHERE pm.product_id=$1 AND pm.media_id=$2 FOR UPDATE`, [productId, mediaId])
    if (!result.rows[0]) fail('MEDIA_NOT_FOUND', 'Product media was not found.')
    media = result.rows[0]
    await destroyMedia(media)
    await client.query(`DELETE FROM product_media WHERE id=$1`, [media.id])
    await client.query(`DELETE FROM media WHERE id=$1`, [media.media_id])
    await client.query('COMMIT')
    return { mediaId }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function deleteProduct(id) {
  const client = await pool.connect()
  let mediaRows = []
  try {
    await client.query('BEGIN')
    const product = await client.query(`SELECT id FROM products WHERE id=$1 FOR UPDATE`, [id])
    if (!product.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.')
    const result = await client.query(`SELECT pm.media_id, m.cloudinary_public_id, m.resource_type FROM product_media pm INNER JOIN media m ON m.id=pm.media_id WHERE pm.product_id=$1`, [id])
    mediaRows = result.rows
    for (const media of mediaRows) await destroyMedia(media)
    await client.query(`DELETE FROM products WHERE id=$1`, [id])
    for (const media of mediaRows) await client.query(`DELETE FROM media WHERE id=$1`, [media.media_id])
    await client.query('COMMIT')
    return { id }
  } catch (error) { await client.query('ROLLBACK'); throw error } finally { client.release() }
}

export async function listProductReviews(productId) {
  const result = await pool.query(`
    SELECT
      r.id, r.user_id, r.reviewer_name, r.rating, r.review_text, r.source, r.display_mode,
      r.created_at, r.updated_at,
      u.avatar_id, u.user_type
    FROM product_reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.product_id=$1
    ORDER BY r.created_at DESC
  `, [productId])
  const reviews = result.rows.map((r) => ({
    id:r.id, userId:r.user_id, reviewerName:r.reviewer_name, rating:r.rating, reviewText:r.review_text,
    source:r.source, displayMode:r.display_mode, avatarId:r.avatar_id || null, userType:r.user_type || null,
    avatarUrl:r.avatar_id ? getAvatarUrl(r.avatar_id, 96) : null,
    createdAt:r.created_at, updatedAt:r.updated_at,
  }))
  const summary = { count: reviews.length, average: reviews.length ? Number((reviews.reduce((s,r)=>s+r.rating,0)/reviews.length).toFixed(2)) : null }
  return { reviews, summary }
}

export async function createCustomerReview(productId, user, rating, reviewText) {
  const ratingNumber = Number(rating)
  const text = clean(reviewText)
  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5 || !text || text.length > 2000) {
    fail('VALIDATION_ERROR', 'Rating must be 1–5 and review text must be 1–2000 characters.')
  }

  const productResult = await pool.query(`SELECT id, name FROM products WHERE id=$1`, [productId])
  if (!productResult.rows[0]) fail('PRODUCT_NOT_FOUND', 'Product not found.')

  let review
  try {
    const result = await pool.query(
      `INSERT INTO product_reviews (product_id,user_id,reviewer_name,rating,review_text,source,display_mode,created_by,updated_by)
       VALUES ($1,$2,$3,$4,$5,'customer','customer',$2,$2) RETURNING id`,
      [productId, user.id, user.name, ratingNumber, text],
    )
    review = await getProductReview(result.rows[0].id)
  } catch (error) {
    if (error.code === '23505') {
      fail('REVIEW_ALREADY_EXISTS', 'You have already reviewed this product. You can edit or delete your existing review.')
    }
    throw error
  }

  // Customer review emails are deliberately best-effort: a mail failure must never undo a saved review.
  if (user.email) {
    const email = createProductReviewEmail({
      customerName: user.name,
      productName: productResult.rows[0].name,
      rating: ratingNumber,
      reviewText: text,
    })
    sendEmail({ to: user.email, ...email }).catch((error) => {
      console.error(`[REVIEW_EMAIL_FAILED] ${error.message}`)
    })
  }

  return review
}

async function getProductReview(id) {
  const result = await pool.query(`
    SELECT r.id,r.user_id,r.reviewer_name,r.rating,r.review_text,r.source,r.display_mode,r.created_at,r.updated_at, u.avatar_id, u.user_type
    FROM product_reviews r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.id=$1
  `, [id])
  if (!result.rows[0]) fail('REVIEW_NOT_FOUND', 'Review not found.')
  const r = result.rows[0]
  return {
    id:r.id,userId:r.user_id,reviewerName:r.reviewer_name,rating:r.rating,reviewText:r.review_text,
    source:r.source,displayMode:r.display_mode,avatarId:r.avatar_id || null, userType:r.user_type || null,
    avatarUrl:r.avatar_id ? getAvatarUrl(r.avatar_id, 96) : null,
    createdAt:r.created_at,updatedAt:r.updated_at,
  }
}

export async function updateCustomerReview(reviewId, userId, rating, reviewText) {
  const ratingNumber = Number(rating), text = clean(reviewText)
  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5 || !text || text.length > 2000) fail('VALIDATION_ERROR', 'Rating must be 1–5 and review text must be 1–2000 characters.')
  const result = await pool.query(`UPDATE product_reviews SET rating=$3, review_text=$4, updated_at=NOW(), updated_by=$2 WHERE id=$1 AND user_id=$2 AND source='customer' RETURNING id`, [reviewId,userId,ratingNumber,text])
  if (!result.rows[0]) fail('REVIEW_NOT_FOUND', 'Your review was not found.')
  return getProductReview(reviewId)
}

export async function deleteCustomerReview(reviewId, userId) {
  const result = await pool.query(`DELETE FROM product_reviews WHERE id=$1 AND user_id=$2 AND source='customer' RETURNING id`, [reviewId,userId])
  if (!result.rows[0]) fail('REVIEW_NOT_FOUND', 'Your review was not found.')
  return { id: reviewId }
}

export async function createAdminReview(productId, adminId, { rating, reviewText, displayMode, reviewerName }) {
  const ratingNumber = Number(rating), text = clean(reviewText)
  if (!['anonymous','bakery_team'].includes(displayMode)) fail('VALIDATION_ERROR', 'Choose Anonymous or Bakery Team.')
  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5 || !text || text.length > 2000) fail('VALIDATION_ERROR', 'Rating must be 1–5 and review text must be 1–2000 characters.')
  const name = displayMode === 'bakery_team' ? "Raisal's Bakery" : clean(reviewerName)
  if (name.length < 2 || name.length > 100) fail('VALIDATION_ERROR', 'Reviewer name must be 2–100 characters.', { reviewerName: 'Enter the reviewer name for an anonymous review.' })
  const result = await pool.query(
    `INSERT INTO product_reviews (product_id,user_id,reviewer_name,rating,review_text,source,display_mode,created_by,updated_by)
     VALUES ($1,NULL,$2,$3,$4,'admin',$5,$6,$6) RETURNING id`,
    [productId,name,ratingNumber,text,displayMode,adminId],
  )
  return getProductReview(result.rows[0].id)
}

export async function updateAdminReview(reviewId, adminId, { rating, reviewText, displayMode, reviewerName }) {
  const ratingNumber = Number(rating), text = clean(reviewText)
  if (!['anonymous','bakery_team'].includes(displayMode)) fail('VALIDATION_ERROR', 'Choose Anonymous or Bakery Team.')
  if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5 || !text || text.length > 2000) fail('VALIDATION_ERROR', 'Rating must be 1–5 and review text must be 1–2000 characters.')
  const name = displayMode === 'bakery_team' ? "Raisal's Bakery" : clean(reviewerName)
  if (name.length < 2 || name.length > 100) fail('VALIDATION_ERROR', 'Reviewer name must be 2–100 characters.', { reviewerName: 'Enter the reviewer name for an anonymous review.' })
  const result = await pool.query(
    `UPDATE product_reviews SET reviewer_name=$2,rating=$3,review_text=$4,display_mode=$5,updated_at=NOW(),updated_by=$6 WHERE id=$1 AND source='admin' RETURNING id`,
    [reviewId,name,ratingNumber,text,displayMode,adminId],
  )
  if (!result.rows[0]) fail('REVIEW_NOT_FOUND', 'Review not found.')
  return getProductReview(reviewId)
}

export async function deleteAdminReview(reviewId) {
  const result = await pool.query(`DELETE FROM product_reviews WHERE id=$1 RETURNING id`, [reviewId])
  if (!result.rows[0]) fail('REVIEW_NOT_FOUND', 'Review not found.')
  return { id: reviewId }
}
