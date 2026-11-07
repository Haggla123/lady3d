import jwt from 'jsonwebtoken'
import { User } from './models.js'

const cookieName = 'lady3d_session'
export function issueSession(res, user) {
  const token = jwt.sign(
    { sub: user.id, role: user.role, branch: user.assignedBranch, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '8h', issuer: 'lady3d-api', audience: 'lady3d-web' }
  )
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60 * 1000
  })
}

export function clearSession(res) {
  res.clearCookie(cookieName, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies[cookieName]
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    const claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'lady3d-api', audience: 'lady3d-web' })
    const user = await User.findById(claims.sub).select('-passwordHash')
    if (!user || user.active === false) return res.status(401).json({ error: 'Session is no longer valid' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Session is invalid or expired' })
  }
}

export async function optionalAuth(req, _res, next) {
  try {
    const token = req.cookies[cookieName]
    if (token) {
      const claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'lady3d-api', audience: 'lady3d-web' })
      req.user = await User.findById(claims.sub).select('-passwordHash') || undefined
      if (req.user?.active === false) req.user = undefined
    }
  } catch {
    /* Anonymous session allowed */
  }
  next()
}

export const requireStaff = (req, res, next) => {
  if (!req.user || req.user.role === 'customer') return res.status(403).json({ error: 'Staff access required' })
  if (req.user.role !== 'Owner' && !['all', 'cug', 'sunyani'].includes(req.user.assignedBranch)) {
    return res.status(403).json({ error: 'A branch assignment is required for this staff account' })
  }
  next()
}

export const requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' })
  next()
}
