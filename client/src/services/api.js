import { dispatchApiError } from '../lib/errorEvents.js'

const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')
).replace(/\/$/, '')

function createApiError(message, options = {}) {
  const error = new Error(
    message || 'Something went wrong. Please try again.',
  )

  error.code = options.code || null
  error.status = options.status || null
  error.isNetworkError = options.isNetworkError || false

  return error
}

async function parseResponse(response) {
  const contentType =
    response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request(endpoint, options = {}) {
  const { suppressError = false, ...fetchOptions } = options
  let response

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...fetchOptions,
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      },
    )
  } catch {
    const error = createApiError(
      'We could not connect to the server. Please check your connection and try again.',
      {
        code: 'NETWORK_ERROR',
        isNetworkError: true,
      },
    )

    if (!suppressError) {
      dispatchApiError(error)
    }

    throw error
  }

  const data = await parseResponse(response)

  if (!response.ok) {
    const error = createApiError(
      data?.error?.message ||
        data?.message ||
        (response.status === 404
          ? 'The requested resource could not be found.'
          : response.status === 429
            ? 'Too many requests. Please try again later.'
            : 'The request could not be completed. Please try again.'),
      {
        code:
          data?.error?.code ||
          `HTTP_${response.status}`,
        status: response.status,
      },
    )

    error.fields = data?.error?.fields || null

    if (!suppressError) {
      dispatchApiError(error)
    }

    throw error
  }

  return data
}

export default request
