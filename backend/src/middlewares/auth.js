// backend/src/middlewares/auth.js
const admin = require('firebase-admin')

async function authenticate(req, res, next) {
  const h = req.headers.authorization
  if (!h) return res.status(401).send('Missing auth header')
  const token = h.split(' ')[1]
  try {
    req.user = await admin.auth().verifyIdToken(token)
    return next()
  } catch {
    return res.status(401).send('Unauthorized')
  }
}

// NEW: optionalAuth
async function optionalAuth(req, res, next) {
  const h = req.headers.authorization
  if (h) {
    try {
      req.user = await admin.auth().verifyIdToken(h.split(' ')[1])
    } catch { /* ignore */ }
  }
  next()
}

module.exports = { authenticate, optionalAuth }
