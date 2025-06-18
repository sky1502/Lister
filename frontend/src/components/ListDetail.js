// frontend/src/components/ListDetail.js
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api'
import Filters from './Filters'
import NewItemModal from './NewItemModal'

const NOTE_COLORS = ['note-yellow','note-green','note-blue','note-pink']

export default function ListDetail({ list, user, onDelete }) {
  const [state, setState]               = useState(list)
  const [allItems, setAllItems]         = useState([])
  const [displayItems, setDisplayItems] = useState([])
  const [filters, setFilters]           = useState({
    subCategory: [], addedBy: [], done: undefined
  })
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [showNewItem, setShowNewItem]   = useState(false)
  const [editMode, setEditMode]         = useState(false)

  // Owner + collaborators
  const ownerUid = state.owner?.uid ?? state.ownerUid
  const invited  = (state.collaborators || []).map(c =>
    typeof c === 'string' ? { uid: c } : c
  )
  const collaborators = [{ uid: ownerUid, ...state.owner }, ...invited]
  const collabUids    = collaborators.map(c => c.uid)

  const isOwner   = user?.uid === ownerUid
  const isCollab  = user && collabUids.includes(user.uid)
  const isAdmin   = user?.uid === process.env.REACT_APP_ADMIN_UID

  // only owner/collab can edit
  const canEdit   = isOwner || isCollab
  // owner always, admin only for delete
  const canDelete = (isOwner) || (isAdmin && state.isPublic)

  // Pastel background
  const color = NOTE_COLORS[state._id.charCodeAt(0) % NOTE_COLORS.length]

  // Fetch items
  useEffect(() => {
    api.get(`/items/${state._id}`)
      .then(r => {
        setAllItems(r.data)
        setDisplayItems(r.data)
      })
      .catch(console.error)
  }, [state._id, user?.uid])

  // Apply filters
  useEffect(() => {
    let filtered = allItems
    if (filters.subCategory.length) {
      filtered = filtered.filter(i =>
        filters.subCategory.includes(i.subCategory)
      )
    }
    if (filters.addedBy.length) {
      filtered = filtered.filter(i =>
        filters.addedBy.includes(i.addedBy)
      )
    }
    if (filters.done !== undefined) {
      filtered = filtered.filter(i => i.done === filters.done)
    }
    setDisplayItems(filtered)
  }, [filters, allItems])

  // Invite collaborator (owner only)
  const handleInvite = async e => {
    e.preventDefault()
    if (!inviteEmail.trim()) return alert('Enter collaborator email')
    try {
      const res = await api.post(
        `/lists/${state._id}/collaborators`,
        { email: inviteEmail.trim() }
      )
      setState(res.data)
      setInviteEmail('')
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  // Delete list
  const handleDeleteList = async () => {
    if (!window.confirm('Delete this list?')) return
    await api.delete(`/lists/${state._id}`)
    onDelete(state._id)
  }

  // Toggle public (owner only)
  const handlePublicToggle = async e => {
    const res = await api.put(
      `/lists/${state._id}`,
      { isPublic: e.target.checked }
    )
    setState(s => ({ ...s, isPublic: res.data.isPublic }))
  }

  // Remove one item (edit mode)
  const handleRemoveItem = async itemId => {
    if (!window.confirm('Remove this item?')) return
    await api.delete(`/items/${itemId}`)
    setAllItems(a => a.filter(i => i._id !== itemId))
  }

  // Open NewItem modal
  const handleOpenNewItem = () => setShowNewItem(true)

  const subCats = state.categoryId?.subCategories || []
  const collaboratorNames = invited.map(c =>
    c.displayName || c.email?.split('@')[0] || c.uid
  )

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, rotate: 0.5 }}
      whileTap={{ scale: 0.98, rotate: -0.5 }}
      className={`relative p-6 rounded-lg shadow-xl ${color}`}
      style={{ minHeight: '240px' }}
    >

      {/* Title & Category */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold">{state.title}</h3>
        <div className="flex items-center justify-between gap-2">
          {canEdit && (
            <button
              onClick={() => setEditMode(e => !e)}
              className={`text-sm px-3 py-1 rounded ${
                editMode ? 'bg-green-600 text-green-100' : 'bg-gray-200'
              }`}
            >
              {editMode ? 'Save List' : 'Edit List'}
            </button>
          )}
          {/* Delete List (owner always, admin only on public) */}
          {canDelete && (
            <button
              onClick={handleDeleteList}
              className="text-sm px-3 py-1 bg-red-500 text-green-100 rounded hover:underline text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        Category: <span className="font-medium">{state.categoryId?.name}</span>
      </div>

      {/* Filters (only outside edit mode) */}
      {canEdit && !editMode && (
        <Filters
          subCategories={subCats}
          collaborators={collaborators}
          filters={filters}
          onChange={setFilters}
        />
      )}

      {/* Items */}
      <ul className="space-y-2 overflow-auto max-h-40 mb-4">
        {displayItems.map(item => (
          <li key={item._id} className="flex items-center">
            {editMode && (
              <button
                onClick={() => handleRemoveItem(item._id)}
                className="mr-2 text-red-500 font-bold"
                title="Remove item"
              >
                −
              </button>
            )}
            <input
              type="checkbox"
              checked={item.done}
              disabled={!canEdit || editMode}
              onChange={async () => {
                const res = await api.put(
                  `/items/${item._id}`,
                  { done: !item.done }
                )
                setAllItems(a =>
                  a.map(i => (i._id === item._id ? res.data : i))
                )
              }}
              className="mr-2 h-5 w-5"
            />
            <span className={item.done ? 'line-through text-gray-500' : ''}>
              {item.text}
            </span>
            {item.subCategory && (
              <span className="ml-auto text-xs italic text-gray-700">
                {item.subCategory}
              </span>
            )}
          </li>
        ))}
      </ul>

      {/* Add Item (only in edit mode) */}
      {canEdit && editMode && (
        <button
          onClick={handleOpenNewItem}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition mb-4"
        >
          + Add Item
        </button>
      )}

      {/* Collaborators (owner/collab only) */}
      {(isOwner || isCollab) && (
        <div className="mb-4">
          <button
            onClick={() => setShowCollaborators(v => !v)}
            className="text-sm text-gray-700 hover:underline mb-2"
          >
            {showCollaborators ? 'Hide Collaborators' : 'Show Collaborators'}
          </button>
          {showCollaborators && (
            <div className="bg-white p-4 rounded-md shadow-inner">
              <h4 className="font-semibold mb-2">Collaborators</h4>
              {collaboratorNames.length > 0 ? (
                <ul className="list-disc list-inside mb-2">
                  {collaboratorNames.map(name => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 mb-2">
                  No collaborators
                </div>
              )}
              {isOwner && (
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Invite by email"
                    className="flex-1 border rounded px-2 py-1"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition"
                  >
                    Invite
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Public Toggle (owner only) */}
      {isOwner && (
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            checked={state.isPublic}
            onChange={handlePublicToggle}
            className="mr-2"
          />
          Public
        </label>
      )}

      {/* New Item Modal */}
      {showNewItem && (
        <NewItemModal
          listId={state._id}
          subCategories={subCats}
          onCreated={item => {
            setAllItems(a => [item, ...a])
            setShowNewItem(false)
          }}
          onClose={() => setShowNewItem(false)}
        />
      )}
    </motion.div>
  )
}
