const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  categoryId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  ownerUid:      { type: String, required: true },
  isPublic:      { type: Boolean, default: true },
  collaborators: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('List', ListSchema);
