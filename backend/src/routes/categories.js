// backend/src/routes/categories.js
const express = require('express')
const router = express.Router()
const Category = require('../models/Category')
const { authenticate } = require('../middlewares/auth')

// PUBLIC GET: list all public categories
router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ isPublic: true }).lean()
    return res.json(cats)
  } catch (err) {
    console.error('GET /categories error:', err)
    return res.status(500).send(err.message)
  }
})

// All mutation routes require a logged-in user
router.use(authenticate)

// POST /categories → create a new category (always public)
router.post('/', async (req, res) => {
  try {
    const name = req.body.name?.trim()
    if (!name) return res.status(400).send('Category name is required')

    // case-insensitive upsert
    let cat = await Category.findOne({
      name: { $regex: `^${name}$`, $options: 'i' }
    })
    if (!cat) {
      cat = new Category({
        name,
        ownerUid: req.user.uid,
        isPublic: true
      })
      await cat.save()
    }
    return res.json(cat)
  } catch (err) {
    console.error('POST /categories error:', err)
    return res.status(400).send(err.message)
  }
})

// PUT /categories/:id → update a category's name (owner only)
router.put('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id)
    if (!cat) return res.status(404).send('Category not found')
    if (cat.ownerUid !== req.user.uid && req.user.uid !== process.env.ADMIN_UID) {
      return res.status(403).send('Forbidden')
    }
    const name = req.body.name?.trim()
    if (name) cat.name = name
    // categories remain public
    const updated = await cat.save()
    return res.json(updated)
  } catch (err) {
    console.error('PUT /categories/:id error:', err)
    return res.status(400).send(err.message)
  }
})

// DELETE /categories/:id → only admin can delete
router.delete('/:id', async (req, res) => {
  try {
    const uid = req.user.uid
    if (uid !== process.env.ADMIN_UID) {
      return res.status(403).send('Only the root user may delete categories')
    }
    const cat = await Category.findById(req.params.id)
    if (!cat) return res.status(404).send('Category not found')
    await cat.remove()
    return res.sendStatus(204)
  } catch (err) {
    console.error('DELETE /categories/:id error:', err)
    return res.status(400).send(err.message)
  }
})

module.exports = router
