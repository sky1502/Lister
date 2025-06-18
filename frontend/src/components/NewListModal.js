// frontend/src/components/NewListModal.js
import React, { useState, useRef, useEffect } from 'react'
import api from '../api'

export default function NewListModal({
  categories = [],
  onCreated,
  onClose
}) {
  const [title, setTitle]               = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [isPublic, setIsPublic]         = useState(true)
  const [filteredCats, setFilteredCats] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef(null)

  // Sort categories alphabetically
  const sortedCats = [...categories].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  // Filter as user types
  useEffect(() => {
    const q = categoryName.trim().toLowerCase()
    setFilteredCats(
      q
        ? sortedCats.filter(cat => cat.name.toLowerCase().includes(q))
        : sortedCats
    )
  }, [categoryName, sortedCats])

  // Close suggestions on any mousedown outside the wrapper
  useEffect(() => {
    const handleClickOutside = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelectCat = name => {
    setCategoryName(name)
    setShowSuggestions(false)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const t = title.trim()
    if (!t) {
      alert('List title is required')
      return
    }
    const catName = categoryName.trim() || undefined
    try {
      const payload = { title: t, categoryName: catName, isPublic }
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
      onClick={onClose}
    >
      <form
        onClick={e => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow-md w-80 space-y-4"
      >
        <h2 className="text-lg font-semibold">New List</h2>

        <input
          type="text"
          className="w-full border rounded px-2 py-1"
          placeholder="List Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="relative" ref={wrapperRef}>
          <label className="block text-sm font-medium mb-1">
            Category (optional)
          </label>
          <input
            type="text"
            className="w-full border rounded px-2 py-1"
            placeholder="Type to Search or Add New"
            value={categoryName}
            onChange={e => {
              setCategoryName(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && (
            <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-auto mt-1 rounded">
              {filteredCats.length > 0 ? (
                filteredCats.map(cat => (
                  <li
                    key={cat._id}
                    onClick={() => handleSelectCat(cat.name)}
                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  >
                    {cat.name}
                  </li>
                ))
              ) : (
                <li className="px-2 py-1 text-gray-500">No matches</li>
              )}
            </ul>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Leave blank for “Other”
          </p>
        </div>

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
