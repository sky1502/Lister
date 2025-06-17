import React, { useState } from 'react'
import api from '../api'

export default function NewListModal({
  categories = [],
  onCreated,
  onClose
}) {
  const [title, setTitle]           = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isPublic, setIsPublic]     = useState(true)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!title.trim()) {
      alert('List title is required')
      return
    }
    try {
      const payload = {
        title: title.trim(),
        categoryId: categoryId || undefined,
        isPublic
      }
      const res = await api.post('/lists', payload)
      onCreated(res.data)
      onClose()
    } catch (err) {
      console.error('Error creating list:', err)
      alert(err.response?.data || err.message)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onClick={onClose}                // 1) clicking the overlay closes
    >
      <form
        onClick={e => e.stopPropagation()}  // 2) clicking inside the form does NOT close
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow-md w-80 space-y-4"
      >
        <h2 className="text-lg font-semibold">New List</h2>

        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          placeholder="List title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <select
          className="w-full border rounded px-2 py-1"
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
        >
          <option value="">— Select category —</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="mr-2"
          />
          Public
        </label>

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
            Create
          </button>
        </div>
      </form>
    </div>
  )
}
