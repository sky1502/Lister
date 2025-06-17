// frontend/src/components/CategoryManager.js
import React, { useState, useEffect } from 'react'
import api from '../api'

export default function CategoryManager({ categories, setCategories, user }) {
  const adminUid = process.env.REACT_APP_ADMIN_UID
  const isAdmin = user?.uid === adminUid

  // track the edited name for each category
  const [editNames, setEditNames] = useState({})

  // initialize editNames whenever categories list changes
  useEffect(() => {
    const names = {}
    categories.forEach(cat => {
      names[cat._id] = cat.name
    })
    setEditNames(names)
  }, [categories])

  const handleNameChange = (id, value) => {
    setEditNames(prev => ({ ...prev, [id]: value }))
  }

  const renameCategory = async id => {
    const newName = editNames[id].trim()
    if (!newName) return alert('Name cannot be empty')
    try {
      const res = await api.put(`/categories/${id}`, { name: newName })
      setCategories(prev =>
        prev.map(c => (c._id === id ? res.data : c))
      )
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  const deleteCategory = async id => {
    if (!window.confirm('Delete this category?')) return
    try {
      await api.delete(`/categories/${id}`)
      setCategories(prev => prev.filter(c => c._id !== id))
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  return (
    <div className="my-4 p-4 border rounded">
      <h3 className="font-medium mb-2">Manage Categories</h3>
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
                onChange={e => handleNameChange(cat._id, e.target.value)}
                className={`flex-1 border px-2 py-1 ${
                  !canRename ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              {canRename && (
                <button
                  onClick={() => renameCategory(cat._id)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Save
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => deleteCategory(cat._id)}
                  className="text-red-600 hover:underline text-sm"
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
