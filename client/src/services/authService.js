import api from './api.js'

const POST_LOGIN_REDIRECT_KEY =
  'raisals_post_login_redirect'

function isSafeInternalPath(path) {
  return (
    typeof path === 'string' &&
    path.startsWith('/') &&
    !path.startsWith('//')
  )
}

export function setPostLoginRedirect(path) {
  if (
    !isSafeInternalPath(path) ||
    path === '/login' ||
    path === '/register'
  ) {
    return
  }

  sessionStorage.setItem(
    POST_LOGIN_REDIRECT_KEY,
    path,
  )
}

export function consumePostLoginRedirect(
  fallback = '/',
) {
  const storedPath = sessionStorage.getItem(
    POST_LOGIN_REDIRECT_KEY,
  )

  sessionStorage.removeItem(
    POST_LOGIN_REDIRECT_KEY,
  )

  return isSafeInternalPath(storedPath)
    ? storedPath
    : fallback
}

export async function register(userData) {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function login(credentials) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export function loginWithGoogle(
  redirectPath = '/',
) {
  setPostLoginRedirect(redirectPath)

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api')

  const googleAuthUrl =
    import.meta.env.VITE_GOOGLE_AUTH_URL ||
    `${apiUrl.replace(/\/api\/?$/, '')}/api/auth/google`

  window.location.href = googleAuthUrl
}

export async function getCurrentUser() {
  // A missing session on initial page load is a normal anonymous state,
  // not an application error. Suppress the global error toast for this
  // background session check while still throwing to AuthContext.
  return api('/auth/me', {
    suppressError: true,
  })
}

export async function logout() {
  return api('/auth/logout', {
    method: 'POST',
  })
}

export async function getAvatarCatalog() {
  return api('/auth/avatars', {
    suppressError: true,
  })
}

export async function updateCurrentUser(data) {
  return api('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function forgotPassword(email) {
  return api('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
    }),
  })
}

export async function resetPassword({
  token,
  newPassword,
}) {
  return api('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token,
      newPassword,
    }),
  })
}