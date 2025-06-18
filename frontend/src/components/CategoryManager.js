// frontend/src/components/CategoryManager.js
import React, { useState, useEffect } from 'react'
import api from '../api'

export default function CategoryManager({ categories, setCategories, user }) {
  const adminUid = process.env.REACT_APP_ADMIN_UID
  const isAdmin = user?.uid === adminUid

  // for new‐category input
  const [newName, setNewName] = useState('')

  // existing edit state (your rename logic)
  const [editNames, setEditNames] = useState({})

  useEffect(() => {
    // initialize editNames whenever categories change
    const names = {}
    categories.forEach(cat => {
      names[cat._id] = cat.name
    })
    setEditNames(names)
  }, [categories])

  // Create a new category
  const handleAdd = async () => {
    const nm = newName.trim()
    if (!nm) return alert('Enter a category name')
    try {
      const res = await api.post('/categories', { name: nm })
      setCategories([ ...categories, res.data ])
      setNewName('')
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  // (Your existing rename & delete handlers go here — unchanged)

  return (
    <div className="my-4 p-4 border rounded bg-gray-50">
      <h3 className="font-medium mb-2">Manage Categories</h3>

      {isAdmin && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 border px-2 py-1 rounded"
            placeholder="New category name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {categories.map(cat => {
          const isOwner = user.uid === cat.ownerUid
          const canRename = isOwner || isAdmin

          return (
            <li key={cat._id} className="flex items-center gap-2">
              <input
                type="text"
                disabled={!canRename}
                value={editNames[cat._id] || ''}
                onChange={e =>
                  setEditNames(prev => ({ ...prev, [cat._id]: e.target.value }))
                }
                className="flex-1 border px-2 py-1 rounded"
              />
              {canRename && (
                <button
                  onClick={() => {
                    const newVal = editNames[cat._id].trim()
                    if (!newVal) return alert('Name cannot be blank')
                    api.put(`/categories/${cat._id}`, { name: newVal })
                      .then(r => {
                        setCategories(categories.map(c =>
                          c._id === cat._id ? r.data : c
                        ))
                      })
                      .catch(err => alert(err.response?.data || err.message))
                  }}
                  className="px-2 py-1 bg-green-300 rounded hover:bg-green-500 text-xs"
                >
                  Rename
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    if (!window.confirm('Delete this category?')) return
                    api.delete(`/categories/${cat._id}`)
                      .then(() => {
                        setCategories(categories.filter(c => c._id !== cat._id))
                      })
                      .catch(err => alert(err.response?.data || err.message))
                  }}
                  className="px-2 py-1 bg-red-400 rounded hover:bg-red-600 text-xs"
                >
                  Delete
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
