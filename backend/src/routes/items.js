// backend/src/routes/items.js
const express       = require('express')
const router        = express.Router()
const admin         = require('firebase-admin')
const Item          = require('../models/Item')
const List          = require('../models/List')
const Category      = require('../models/Category')       // ← make sure this is imported
const { authenticate, optionalAuth } = require('../middlewares/auth')

/**
 * GET /items/:listId
 * Returns all items for a given list, marking each
 * with `{ done: Boolean }` based on whether the
 * current user’s UID is in its `doneBy` array.
 */
router.get('/:listId', optionalAuth, async (req, res) => {
  try {
    const uid = req.user?.uid
    const items = await Item.find({ listId: req.params.listId }).lean()
    const result = items.map(i => ({
      ...i,
      done: Array.isArray(i.doneBy) && uid
        ? i.doneBy.includes(uid)
        : false
    }))
    return res.json(result)
  } catch (err) {
    console.error('GET /items/:listId error:', err)
    return res.status(500).send(err.message)
  }
})

/**
 * POST /items
 * Creates a new item, and if it has a subCategory,
 * upserts that subCategory into the parent Category’s
 * `subCategories` array (case-insensitive).
 *
 * Body: { listId, text, subCategory? }
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { listId, text, subCategory } = req.body
    if (!text?.trim()) {
      return res.status(400).send('Item text is required')
    }

    // 1) Create the Item
    const item = new Item({
      listId,
      text: text.trim(),
      subCategory: subCategory?.trim() || undefined,
      addedBy: req.user.uid
    })
    const saved = await item.save()

    // 2) If a subCategory was provided, add it to the Category
    if (saved.subCategory) {
      const parentList = await List.findById(listId).lean()
      if (parentList?.categoryId) {
        const cat = await Category.findById(parentList.categoryId)
        if (cat) {
          const exists = cat.subCategories.some(
            sc => sc.toLowerCase() === saved.subCategory.toLowerCase()
          )
          if (!exists) {
            cat.subCategories.push(saved.subCategory)
            await cat.save()
          }
        }
      }
    }

    return res.status(201).json(saved)
  } catch (err) {
    console.error('POST /items error:', err)
    return res.status(400).send(err.message)
  }
})

/**
 * PUT /items/:id
 * Toggle done state (only the owner of the done mark may toggle their own),
 * and return the updated item.
 *
 * Body: { done: Boolean }
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) {
      return res.status(404).send('Item not found')
    }

    const uid = req.user.uid
    const { done } = req.body

    // Remove any existing entry
    item.doneBy = (item.doneBy || []).filter(u => u !== uid)
    // If setting done=true, add it back
    if (done) {
      item.doneBy.push(uid)
    }

    const updated = await item.save()
    // Compute `done` for this user
    const response = {
      ...updated.toObject(),
      done: updated.doneBy.includes(uid)
    }
    return res.json(response)
  } catch (err) {
    console.error('PUT /items/:id error:', err)
    return res.status(400).send(err.message)
  }
})

/**
 * DELETE /items/:id
 * Only the user who added the item (or admin) can delete it.
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
    if (!item) {
      return res.status(404).send('Item not found')
    }

    const uid = req.user.uid
    const isAdmin = uid === process.env.ADMIN_UID
    if (item.addedBy !== uid && !isAdmin) {
      return res.status(403).send("Cannot delete another user's item")
    }

    await item.remove()
    return res.sendStatus(204)
  } catch (err) {
    console.error('DELETE /items/:id error:', err)
    return res.status(400).send(err.message)
  }
})

module.exports = router
