import { 
  registerUser,
  loginUser,
  logoutUser,
  loginWithGoogle, 
  updateCurrentUser as updateCurrentUserService,
  createPasswordResetToken,
  resetUserPassword,
  getAvatarCatalog,
} from '../services/authService.js'
import crypto from 'crypto'
import googleClient from '../config/googleOAuth.js'
import { getAvatarUrl } from '../config/cloudinary.js'
import {
  sendEmail,
} from '../services/emailService.js'
import {
  createPasswordResetEmail,
} from '../emails/passwordResetEmail.js'

function serializeUser(user) {
  const avatarId = user.avatar_id ?? user.avatarId ?? null

  return {
    ...user,
    avatarId,
    avatarUrl: avatarId ? getAvatarUrl(avatarId, 128) : null,
    deliveryAddress:
      user.delivery_address ?? user.deliveryAddress ?? null,
    deliveryPincode:
      user.delivery_pincode ?? user.deliveryPincode ?? null,
  }
}

export function getAvatars(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      avatars: getAvatarCatalog().map(({ id }) => ({
        id,
        url: getAvatarUrl(id, 240),
      })),
    },
  })
}

export async function register(req, res, next) {
  try {
    const { user, session } = await registerUser(req.body)

    res.cookie('session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    })

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        user: serializeUser(user),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function login(req, res, next) {
  try {
    const { user, session } = await loginUser(req.body)

    res.cookie('session', session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    })

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: serializeUser(user),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getCurrentUser(req, res) {
  const {
    id,
    name,
    email,
    auth_provider,
    user_type,
    is_authorized,
    email_verified,
    delivery_address,
    delivery_pincode,
    avatar_id,
  } = req.user

  return res.status(200).json({
    success: true,
    data: {
      user: {
        id,
        name,
        email,
        auth_provider,
        user_type,
        is_authorized,
        email_verified,
        deliveryAddress: delivery_address,
        deliveryPincode: delivery_pincode,
        avatarId: avatar_id,
        avatarUrl: avatar_id ? getAvatarUrl(avatar_id, 128) : null,
      },
    },
  })
}

export async function logout(req, res, next) {
  try {
    const sessionToken = req.cookies.session

    if (sessionToken) {
      await logoutUser(sessionToken)
    }

    res.clearCookie('session', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return res.status(200).json({
      success: true,
      message: 'Logout successful.',
    })
  } catch (error) {
    next(error)
  }
}

export function googleLogin(req, res) {
  const state = crypto.randomBytes(32).toString('hex')

  const authorizationUrl = googleClient.generateAuthUrl({
    access_type: 'online',
    scope: [
      'openid',
      'email',
      'profile',
    ],
    state,
    prompt: 'select_account',
  })

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  })

  return res.redirect(authorizationUrl)
}

export async function googleCallback(req, res, next) {
  try {
    const { code, state } = req.query

    const savedState = req.cookies.oauth_state

    if (
      !state ||
      !savedState ||
      state !== savedState
    ) {
      const error = new Error('Invalid OAuth state.')
      error.code = 'INVALID_OAUTH_STATE'
      throw error
    }

    res.clearCookie('oauth_state', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    if (!code) {
      const error = new Error('Google authorization code is missing.')
      error.code = 'GOOGLE_AUTH_CODE_MISSING'
      throw error
    }

    const { tokens } = await googleClient.getToken(code)

    googleClient.setCredentials(tokens)

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    const googleId = payload.sub
    const email = payload.email
    const name = payload.name || 'Google User'

    if (!googleId || !email || payload.email_verified !== true) {
      const error = new Error('Google account could not be verified.')
      error.code = 'INVALID_GOOGLE_ACCOUNT'
      throw error
    }

    const result = await loginWithGoogle({
      googleId,
      email,
      name,
    })

    res.cookie('session', result.session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    })

    return res.redirect(process.env.CLIENT_URL)
  } catch (error) {
    next(error)
  }
}

export async function updateCurrentUser(req, res, next) {
  try {
    const { name, deliveryAddress, deliveryPincode, avatarId } = req.body

    const user = await updateCurrentUserService(
      req.user.id,
      { name, deliveryAddress, deliveryPincode, avatarId },
    )

    return res.status(200).json({
      success: true,
      message: 'Name updated successfully.',
      data: {
        user: serializeUser(user),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body

    const result = await createPasswordResetToken(email)

    /*
      Always return the same response whether the
      account exists or not.
    */

    if (
      result.found &&
      result.resetAllowed
    ) {
      const resetUrl =
        `${process.env.CLIENT_URL}/reset-password?token=${result.resetToken}`

      const emailContent =
        createPasswordResetEmail(resetUrl)

      await sendEmail({
        to: result.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      })
    }

    return res.status(200).json({
      success: true,
      message:
        'If an account exists for that email, a password reset link has been sent.',
    })
  } catch (error) {
    next(error)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const {
      token,
      newPassword,
    } = req.body

    await resetUserPassword(
      token,
      newPassword,
    )

    return res.status(200).json({
      success: true,
      message:
        'Password reset successfully. Please log in with your new password.',
    })
  } catch (error) {
    next(error)
  }
}