// frontend/src/components/ListView.js
import React, { useState, useEffect } from 'react'
import api from '../api'
import NewListModal from './NewListModal'
import ListDetail from './ListDetail'
import CategoryManager from './CategoryManager'

export default function ListView({ user }) {
  const [lists, setLists] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showPublic, setShowPublic] = useState(true)
  const [showNewList, setShowNewList] = useState(false)
  const [showCatManager, setShowCatManager] = useState(false)

  const isAdmin = user?.uid === process.env.REACT_APP_ADMIN_UID

  // Load categories once
  useEffect(() => {
    api.get('/categories')
      .then(res => setCategories(res.data))
      .catch(console.error)
  }, [])

  // Load lists whenever filter or user changes
  useEffect(() => {
    const params = {}
    if (categoryFilter) params.categoryId = categoryFilter
    api.get('/lists', { params })
      .then(res => setLists(res.data))
      .catch(console.error)
  }, [categoryFilter, user])

  // Load persisted "showPublic" preference from DB
  useEffect(() => {
    if (user) {
      api.get('/preferences')
        .then(res => setShowPublic(res.data.showPublic))
        .catch(() => setShowPublic(true))
    } else {
      setShowPublic(true)
    }
  }, [user])

  // Persist "showPublic" toggle to DB
  const handleShowPublicChange = e => {
    const val = e.target.checked
    setShowPublic(val)
    if (user) {
      api.put('/preferences', { showPublic: val })
        .catch(console.error)
    }
  }

  // Ensure NewListModal is closed when adding an item
  const handleStartAddItem = () => {
    setShowNewList(false)
  }

  // Determine which lists to show
  const visible = lists.filter(l => {
    const ownerUid = l.owner?.uid ?? l.ownerUid
    const collabs = (l.collaborators || []).map(c => c.uid || c)
    const isOwner = user?.uid === ownerUid
    const isCollab = user && collabs.includes(user.uid)
    if (isOwner || isCollab) return true
    return l.isPublic && showPublic
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {user && (
          <button
            onClick={() => setShowNewList(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            + New List
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setShowCatManager(v => !v)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition"
          >
            {showCatManager ? 'Hide Categories' : 'Manage Categories'}
          </button>
        )}

        {user && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showPublic}
              onChange={handleShowPublicChange}
              className="h-4 w-4"
            />
            Show Public
          </label>
        )}

        <label className="flex items-center gap-2 text-sm">
          Category:
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="ml-1 border px-2 py-1 rounded-md text-sm"
          >
            <option value="">All</option>
            {categories.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isAdmin && showCatManager && (
        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          user={user}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {visible.map(list => (
          <ListDetail
            key={list._id}
            list={list}
            user={user}
            onDelete={id => setLists(prev => prev.filter(l => l._id !== id))}
            onStartAddItem={handleStartAddItem}
          />
        ))}
      </div>

      {showNewList && (
        <NewListModal
          categories={categories}
          onCreated={list => setLists(prev => [list, ...prev])}
          onClose={() => setShowNewList(false)}
        />
      )}
    </>
  )
}
