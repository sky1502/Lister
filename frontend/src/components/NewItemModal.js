// frontend/src/components/NewItemModal.js
import React, { useState } from 'react'
import api from '../api'

export default function NewItemModal({
  listId,
  subCategories = [],
  onCreated,
  onClose
}) {
  const [text, setText]             = useState('')
  const [subCategory, setSubCategory] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!text.trim()) {
      alert('Item text is required')
      return
    }
    try {
      const payload = {
        listId,
        text: text.trim(),
        subCategory: subCategory.trim() || undefined
      }
      const res = await api.post('/items', payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  return (
    // 1) Clicking on this overlay will call onClose()
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      {/* 
        2) Stop clicks inside the form from bubbling up to the overlay
        so the modal stays open while you interact with it 
      */}
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow-md w-80 space-y-4"
      >
        <h2 className="text-lg font-semibold">New Item</h2>

        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          placeholder="Item text"
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium mb-1">Sub-category</label>
          <input
            list="subcats"
            className="w-full border rounded px-2 py-1"
            placeholder="Select or type new"
            value={subCategory}
            onChange={e => setSubCategory(e.target.value)}
          />
          <datalist id="subcats">
            {subCategories.map(sc => (
              <option key={sc} value={sc} />
            ))}
          </datalist>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 border rounded hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Add
          </button>
        </div>
      </form>
    </div>
  )
}
