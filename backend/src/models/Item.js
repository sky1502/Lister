// backend/src/models/Item.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  listId:      { type: mongoose.Schema.Types.ObjectId, ref: 'List', required: true },
  text:        { type: String, required: true },
  subCategory: { type: String, required: true, default: 'Misc' }, 
  addedBy:     { type: String, required: true },
  // track which users have marked this item done
  doneBy:      { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Item', ItemSchema);
