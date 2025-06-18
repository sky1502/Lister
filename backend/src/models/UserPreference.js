// backend/src/models/UserPreference.js
const mongoose = require('mongoose')

const UserPreferenceSchema = new mongoose.Schema({
  uid:        { type: String, required: true, unique: true },
  showPublic: { type: Boolean, default: true }
})

module.exports = mongoose.model('UserPreference', UserPreferenceSchema)
