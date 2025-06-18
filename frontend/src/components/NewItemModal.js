// frontend/src/components/NewItemModal.js
import React, { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function NewItemModal({
  listId,
  subCategories = [],
  onCreated,
  onClose
}) {
  const [text, setText]               = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [filtered, setFiltered]       = useState([])
  const [showSug, setShowSug]         = useState(false)
  const wrapperRef = useRef(null)

  // Sort subCategories alphabetically
  const sorted = [...subCategories].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )

  // Update suggestions as user types
  useEffect(() => {
    const q = subCategory.trim().toLowerCase()
    setFiltered(
      q
        ? sorted.filter(sc => sc.toLowerCase().includes(q))
        : sorted
    )
  }, [subCategory, sorted])

  // Close suggestions on mousedown outside
  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSug(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = val => {
    setSubCategory(val)
    setShowSug(false)
  }

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
        // if custom or blank, backend handles it
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
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50"
      onClick={onClose}
    >
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

        <div className="relative" ref={wrapperRef}>
          <label className="block text-sm font-medium mb-1">
            Sub-category (optional)
          </label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            placeholder="Type or select"
            value={subCategory}
            onChange={e => {
              setSubCategory(e.target.value)
              setShowSug(true)
            }}
            onFocus={() => setShowSug(true)}
          />
          {showSug && (
            <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-auto mt-1 rounded">
              {filtered.length > 0 ? (
                filtered.map(sc => (
                  <li
                    key={sc}
                    onClick={() => handleSelect(sc)}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    {sc}
                  </li>
                ))
              ) : (
                <li className="px-2 py-1 text-gray-500">No matches</li>
              )}
            </ul>
          )}
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
