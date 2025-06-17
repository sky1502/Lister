// backend/src/routes/lists.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const List = require('../models/List');
const Item = require('../models/Item');
const { authenticate, optionalAuth } = require('../middlewares/auth');

// Helper: enrich raw list docs with owner & collaborator email/displayName
async function enrichLists(docs) {
  // collect unique UIDs
  const uidSet = new Set();
  docs.forEach(l => {
    uidSet.add(l.ownerUid);
    (l.collaborators || []).forEach(c => {
      const uid = typeof c === 'string' ? c : c.uid;
      uidSet.add(uid);
    });
  });
  const uids = Array.from(uidSet);

  // batch‐fetch user records, but fail gracefully
  let users = [];
  if (uids.length) {
    try {
      const result = await admin.auth().getUsers(uids.map(uid => ({ uid })));
      users = result.users;
    } catch (err) {
      console.error('⚠️ enrichLists: getUsers failed, falling back to UIDs', err);
      users = [];
    }
  }

  // map uid → { email, displayName }
  const userMap = users.reduce((m, u) => {
    m[u.uid] = { email: u.email, displayName: u.displayName };
    return m;
  }, {});

  // rebuild each list
  return docs.map(l => ({
    ...l,
    owner: {
      uid:         l.ownerUid,
      email:       userMap[l.ownerUid]?.email || null,
      displayName: userMap[l.ownerUid]?.displayName || null
    },
    collaborators: (l.collaborators || []).map(c => {
      const cuid = typeof c === 'string' ? c : c.uid;
      return {
        uid:         cuid,
        email:       userMap[cuid]?.email || null,
        displayName: userMap[cuid]?.displayName || null
      };
    })
  }));
}

// PUBLIC GET /lists
// visible: public OR owned OR collaborated
router.get('/', optionalAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const filter = {
      $or: [
        { isPublic: true },
        ...(uid ? [{ ownerUid: uid }, { collaborators: uid }] : [])
      ]
    };
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    const docs = await List.find(filter)
      .populate('categoryId')
      .lean();

    let lists;
    try {
      lists = await enrichLists(docs);
    } catch (err) {
      console.error('⚠️ enrichLists threw, returning raw docs', err);
      lists = docs;
    }
    return res.json(lists);
  } catch (err) {
    console.error('GET /lists error:', err);
    return res.status(500).send(err.message);
  }
});

// All mutation routes require authentication
router.use(authenticate);

// POST /lists → create a new list
router.post('/', async (req, res) => {
  try {
    const { title, categoryId, isPublic } = req.body;
    const list = new List({
      title:        title.trim(),
      categoryId,
      isPublic:     !!isPublic,
      ownerUid:     req.user.uid,
      collaborators:[]
    });
    const saved = await list.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('POST /lists error:', err);
    return res.status(400).send(err.message);
  }
});

// PUT /lists/:id → update a list (owner only)
router.put('/:id', async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).send('List not found');
    if (list.ownerUid !== req.user.uid) return res.status(403).send('Forbidden');

    const { title, categoryId, isPublic } = req.body;
    if (title      !== undefined) list.title      = title.trim();
    if (categoryId !== undefined) list.categoryId = categoryId;
    if (isPublic   !== undefined) list.isPublic   = !!isPublic;

    const updated = await list.save();
    return res.json(updated);
  } catch (err) {
    console.error('PUT /lists/:id error:', err);
    return res.status(400).send(err.message);
  }
});

// DELETE /lists/:id → admin can delete any; owner only if no foreign items
router.delete('/:id', async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).send('List not found');

    const uid = req.user.uid;
    const isAdmin = uid === process.env.ADMIN_UID;
    const isOwner = list.ownerUid === uid;
    const foreignCount = await Item.countDocuments({
      listId:  list._id,
      addedBy: { $ne: list.ownerUid }
    });

    if (isAdmin || (isOwner && foreignCount === 0)) {
      await Item.deleteMany({ listId: list._id });
      await list.remove();
      return res.sendStatus(204);
    }

    if (isOwner) {
      return res
        .status(403)
        .send('Cannot delete your list while other users have added items.');
    }
    return res.status(403).send('Forbidden');
  } catch (err) {
    console.error('DELETE /lists/:id error:', err);
    return res.status(400).send(err.message);
  }
});

// POST /lists/:id/collaborators → invite by email or UID (owner/admin)
router.post('/:id/collaborators', async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).send('List not found');

    const uid = req.user.uid;
    const isAdmin = uid === process.env.ADMIN_UID;
    if (list.ownerUid !== uid && !isAdmin) {
      return res.status(403).send('Forbidden');
    }

    let collabUid = req.body.uid;
    if (req.body.email) {
      const userRecord = await admin.auth().getUserByEmail(req.body.email);
      collabUid = userRecord.uid;
    }
    if (!collabUid) {
      return res.status(400).send('Must provide email or uid');
    }

    if (!list.collaborators.includes(collabUid)) {
      list.collaborators.push(collabUid);
      await list.save();
    }
    return res.json(list);
  } catch (err) {
    console.error('POST /lists/:id/collaborators error:', err);
    return res.status(400).send(err.message);
  }
});

// DELETE /lists/:id/collaborators/:collabUid → remove collaborator (owner/admin)
router.delete('/:id/collaborators/:collabUid', async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) return res.status(404).send('List not found');

    const uid = req.user.uid;
    const isAdmin = uid === process.env.ADMIN_UID;
    if (list.ownerUid !== uid && !isAdmin) {
      return res.status(403).send('Forbidden');
    }

    list.collaborators = list.collaborators.filter(u => u !== req.params.collabUid);
    await list.save();
    return res.json(list);
  } catch (err) {
    console.error('DELETE /lists/:id/collaborators/:collabUid error:', err);
    return res.status(400).send(err.message);
  }
});

module.exports = router;
