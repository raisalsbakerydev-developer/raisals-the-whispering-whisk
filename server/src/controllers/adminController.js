import { 
    bootstrapFirstAdmin,
    promoteToAdmin,
    authorizeAdmin,
    getAllUsers,
    getAdminControl,
    lockAdminControl,
    unlockAdminControl,
} from '../services/adminService.js'

export function adminTest(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Authorized admin access confirmed.',
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        user_type: req.user.user_type,
        is_authorized: req.user.is_authorized,
      },
    },
  })
}

export async function bootstrapAdmin(req, res, next) {
  try {
    const { userId, secret } = req.body

    const user = await bootstrapFirstAdmin(
      userId,
      secret,
    )

    return res.status(200).json({
      success: true,
      message: 'First admin created successfully.',
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function promoteAdmin(req, res, next) {
  try {
    const { userId } = req.body

    const user = await promoteToAdmin(
      userId,
      req.user.id,
    )

    return res.status(200).json({
      success: true,
      message: 'User promoted to admin. Authorization is still required.',
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function authorizeAdminUser(req, res, next) {
  try {
    const { userId } = req.body

    const user = await authorizeAdmin(
      userId,
      req.user.id,
    )

    return res.status(200).json({
      success: true,
      message: 'Admin has been authorized successfully.',
      data: {
        user,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getUsers(req, res, next) {
  try {
    const users = await getAllUsers()

    return res.status(200).json({
      success: true,
      data: {
        users,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getControl(req, res, next) {
  try {
    const control = await getAdminControl()

    return res.status(200).json({
      success: true,
      data: { control },
    })
  } catch (error) {
    next(error)
  }
}

export async function lockControl(req, res, next) {
  try {
    const control = await lockAdminControl(req.user.id)

    return res.status(200).json({
      success: true,
      message: 'Admin promotion and authorization are now locked.',
      data: { control },
    })
  } catch (error) {
    next(error)
  }
}

export async function unlockControl(req, res, next) {
  try {
    const control = await unlockAdminControl(req.user.id)

    return res.status(200).json({
      success: true,
      message: 'Admin promotion and authorization are now unlocked.',
      data: { control },
    })
  } catch (error) {
    next(error)
  }
}
