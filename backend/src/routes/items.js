// backend/src/routes/items.js
const express = require('express');
const router  = express.Router();
const Item    = require('../models/Item');
const List    = require('../models/List');
const { authenticate, optionalAuth } = require('../middlewares/auth');

// PUBLIC GET: list items in a list, computing `done` per-current-user
router.get('/:listId', optionalAuth, async (req, res) => {
  try {
    const docs = await Item.find({ listId: req.params.listId }).lean();
    const uid  = req.user?.uid;
    const items = docs.map(doc => {
      const doneBy = Array.isArray(doc.doneBy) ? doc.doneBy : [];
      return { ...doc, done: uid ? doneBy.includes(uid) : false };
    });
    return res.json(items);
  } catch (err) {
    console.error('GET /items error:', err);
    return res.status(500).send(err.message);
  }
});

// All below require authentication
router.use(authenticate);

// helper: can this user add/edit items in that list?
async function canEditList(uid, listId) {
  const list = await List.findById(listId);
  if (!list) return false;
  return (
    uid === process.env.ADMIN_UID ||
    uid === list.ownerUid ||
    list.collaborators.includes(uid)
  );
}

// POST /items → create new item (doneBy = [])
router.post('/', async (req, res) => {
  try {
    const { listId, text, subCategory } = req.body;
    const uid = req.user.uid;
    if (!(await canEditList(uid, listId))) {
      return res.status(403).send('Forbidden');
    }
    const newItem = new Item({ listId, text, subCategory, addedBy: uid, doneBy: [] });
    const saved = await newItem.save();
    return res.status(201).json({ ...saved.toObject(), done: false });
  } catch (err) {
    console.error('POST /items error:', err);
    return res.status(400).send(err.message);
  }
});

// PUT /items/:id → toggle `done` for current user, or update text/subCategory if owner
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Item not found');

    const uid = req.user.uid;
    if (!(await canEditList(uid, item.listId))) {
      return res.status(403).send('Forbidden');
    }

    const { done, text, subCategory } = req.body;

    // only the user who added can change text/subCategory
    if ((text !== undefined || subCategory !== undefined) && item.addedBy !== uid) {
      return res.status(403).send('Cannot edit text or subCategory');
    }
    if (text !== undefined)        item.text        = text;
    if (subCategory !== undefined) item.subCategory = subCategory;

    // handle done toggle for this user
    if (done !== undefined) {
      const idx = item.doneBy.indexOf(uid);
      if (done && idx === -1)      item.doneBy.push(uid);
      if (!done && idx !== -1)     item.doneBy.splice(idx, 1);
    }

    await item.save();

    const obj = item.toObject();
    obj.done = obj.doneBy.includes(uid);
    return res.json(obj);
  } catch (err) {
    console.error('PUT /items/:id error:', err);
    return res.status(400).send(err.message);
  }
});

// DELETE /items/:id → only the adder or admin
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).send('Item not found');

    const uid = req.user.uid;
    if (!(await canEditList(uid, item.listId))) {
      return res.status(403).send('Forbidden');
    }
    if (item.addedBy !== uid && uid !== process.env.ADMIN_UID) {
      return res.status(403).send("Cannot delete another user's item");
    }

    await item.remove();
    return res.sendStatus(204);
  } catch (err) {
    console.error('DELETE /items/:id error:', err);
    return res.status(400).send(err.message);
  }
});

module.exports = router;
