export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  const isProduction =
    process.env.NODE_ENV === 'production'

  if (!isProduction) {
    console.error(error)
  } else {
    console.error(
      `[${error.code || 'INTERNAL_SERVER_ERROR'}] ${error.message}`,
    )
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message:
          'The request contains invalid JSON.',
      },
    })
  }

  if (error.code === 'ROUTE_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested API endpoint was not found.',
      },
    })
  }

  if (error.code === 'CORS_ORIGIN_NOT_ALLOWED') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CORS_ORIGIN_NOT_ALLOWED',
        message:
          'This request origin is not allowed.',
      },
    })
  }

  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'RESOURCE_ALREADY_EXISTS',
        message: 'The requested resource already exists.',
      },
    })
  }

  if (error.code === 'INVALID_CREDENTIALS') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      },
    })
  }

  if (error.code === 'EMAIL_EXISTS') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message:
          'An account with this email already exists.',
      },
    })
  }

  if (error.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message:
          'Please check the highlighted information.',
        fields: error.fields || {},
      },
    })
  }

  if (error.code === 'INVALID_BOOTSTRAP_SECRET') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_BOOTSTRAP_CREDENTIALS',
        message: 'Invalid bootstrap credentials.',
      },
    })
  }

  if (error.code === 'BOOTSTRAP_ALREADY_COMPLETED') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'BOOTSTRAP_ALREADY_COMPLETED',
        message:
          'Initial admin setup has already been completed.',
      },
    })
  }

  if (error.code === 'SELF_ADMIN_MODIFICATION') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'SELF_ADMIN_MODIFICATION',
        message: error.message,
      },
    })
  }

  if (error.code === 'NOT_AN_ADMIN') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'NOT_AN_ADMIN',
        message: error.message,
      },
    })
  }

  if (error.code === 'MEDIA_IN_USE') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'MEDIA_IN_USE',
        message: error.message,
      },
    })
  }

  if (error.code === 'INVALID_HOME_PLACEMENT') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_HOME_PLACEMENT',
        message: error.message,
      },
    })
  }

  if (error.code === 'MEDIA_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'MEDIA_NOT_FOUND',
        message: error.message,
      },
    })
  }

  if (error.code === 'HOME_MEDIA_SYNC_ERROR') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'HOME_MEDIA_SYNC_ERROR',
        message: error.message,
      },
    })
  }

  if (['PRODUCT_NOT_FOUND', 'REVIEW_NOT_FOUND', 'MEDIA_NOT_FOUND'].includes(error.code)) {
    return res.status(404).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (['PRODUCT_MEDIA_LIMIT', 'REVIEW_ALREADY_EXISTS'].includes(error.code)) {
    return res.status(409).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'CLOUDINARY_DELETE_ERROR') {
    return res.status(502).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'OPERATING_HOUR_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: { code: 'OPERATING_HOUR_NOT_FOUND', message: error.message },
    })
  }

  if (error.code === 'USER_NOT_FOUND') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      },
    })
  }

  if (error.code === 'INVALID_EMAIL') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.',
      },
    })
  }

  if (error.code === 'INVALID_NAME') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_NAME',
        message: error.message,
      },
    })
  }

  if (error.code === 'INVALID_AVATAR_ID') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_AVATAR_ID',
        message: error.message,
      },
    })
  }

  if (error.code === 'INVALID_RESET_TOKEN') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_RESET_TOKEN',
        message:
          'Invalid or expired password reset link.',
      },
    })
  }

  if (error.code === 'RESET_TOKEN_USED') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'RESET_TOKEN_USED',
        message:
          'This password reset link has already been used.',
      },
    })
  }

  if (error.code === 'RESET_TOKEN_EXPIRED') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'RESET_TOKEN_EXPIRED',
        message:
          'This password reset link has expired.',
      },
    })
  }

  if (error.code === 'PASSWORD_RESET_NOT_AVAILABLE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_NOT_AVAILABLE',
        message:
          'Password reset is not available for this account.',
      },
    })
  }

  if (error.code === 'INVALID_PASSWORD') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PASSWORD',
        message: error.message,
      },
    })
  }

  if (error.code === 'HOME_NOT_CONFIGURED') {
    return res.status(500).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'HOME_SECTION_NOT_FOUND') {
    return res.status(404).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'HOME_SECTION_REORDER_NOT_AVAILABLE') {
    return res.status(409).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'MEDIA_NOT_FOUND' || error.code === 'HOME_VALUE_NOT_FOUND' || error.code === 'HOME_KITCHEN_ITEM_NOT_FOUND') {
    return res.status(404).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'REVIEW_NOT_FOUND') {
    return res.status(404).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'REVIEW_OWNERSHIP_REQUIRED') {
    return res.status(403).json({ success: false, error: { code: error.code, message: error.message } })
  }

  if (error.code === 'CLOUDINARY_CONFIGURATION_ERROR') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'CLOUDINARY_CONFIGURATION_ERROR',
        message:
          'The media service is not configured correctly.',
      },
    })
  }

  if (error.code === 'INVALID_MEDIA_TYPE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MEDIA_TYPE',
        message: error.message,
      },
    })
  }

  if (error.code === 'INVALID_MEDIA_PUBLIC_ID') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MEDIA_PUBLIC_ID',
        message: error.message,
      },
    })
  }

  if (error.code === 'CLOUDINARY_DELETE_ERROR') {
    return res.status(502).json({
      success: false,
      error: {
        code: 'CLOUDINARY_DELETE_ERROR',
        message:
          'The media service could not delete the requested asset.',
      },
    })
  }

  if (error.code === 'PRODUCTION_CONFIGURATION_ERROR') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'PRODUCTION_CONFIGURATION_ERROR',
        message: 'The server is not configured correctly for production.',
      },
    })
  }

  if (error.code === 'EMAIL_CONFIGURATION_ERROR') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'EMAIL_CONFIGURATION_ERROR',
        message:
          'The email service is not configured correctly.',
      },
    })
  }

  if (error.code === 'INVALID_OAUTH_STATE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_OAUTH_STATE',
        message:
          'Google authentication could not be verified.',
      },
    })
  }

  if (error.code === 'GOOGLE_AUTH_CODE_MISSING') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'GOOGLE_AUTH_CODE_MISSING',
        message:
          'Google authorization could not be completed.',
      },
    })
  }

  if (error.code === 'INVALID_GOOGLE_ACCOUNT') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_GOOGLE_ACCOUNT',
        message:
          'The Google account could not be verified.',
      },
    })
  }

  if (error.code === 'AUTH_RATE_LIMITED') {
    return res.status(429).json(error.message
      ? {
          success: false,
          error: {
            code: 'AUTH_RATE_LIMITED',
            message: error.message,
          },
        }
      : {
          success: false,
          error: {
            code: 'AUTH_RATE_LIMITED',
            message:
              'Too many authentication attempts. Please try again later.',
          },
        })
  }

  if (error.code === 'PASSWORD_RESET_RATE_LIMITED') {
    return res.status(429).json({
      success: false,
      error: {
        code: 'PASSWORD_RESET_RATE_LIMITED',
        message:
          'Too many password reset requests. Please try again later.',
      },
    })
  }

  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message:
          'Too many requests. Please try again later.',
      },
    })
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction
        ? 'Something went wrong. Please try again later.'
        : error.message || 'Something went wrong.',
    },
  })
}
