// backend/src/models/Category.js
const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
  name:          { type: String, required: true, unique: true },
  ownerUid:      { type: String, required: true },
  isPublic:      { type: Boolean, default: true },
  subCategories: { type: [String], default: [] }   
}, { timestamps: true })

module.exports = mongoose.model('Category', CategorySchema)
