// frontend/src/components/ListDetail.js
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api'
import Filters from './Filters'
import NewItemModal from './NewItemModal'

const NOTE_COLORS = ['note-yellow','note-green','note-blue','note-pink']

export default function ListDetail({ list, user, onDelete }) {
  const [listState, setListState]       = useState(list)
  const [allItems, setAllItems]         = useState([])
  const [draftItems, setDraftItems]     = useState([])
  const [toRemove, setToRemove]         = useState(new Set())
  const [toAdd, setToAdd]               = useState([])
  const [toToggle, setToToggle]         = useState(new Map())

  const [filters, setFilters]           = useState({ subCategory: [], addedBy: [], done: undefined })
  const [displayItems, setDisplayItems] = useState([])

  const [showCollaborators, setShowCollaborators] = useState(false)
  const [inviteEmail, setInviteEmail]             = useState('')
  const [showNewItem, setShowNewItem]             = useState(false)
  const [editMode, setEditMode]                   = useState(false)

  const ownerUid = listState.owner?.uid ?? listState.ownerUid
  const invited  = (listState.collaborators || []).map(c => typeof c === 'string' ? { uid: c } : c)
  const collaborators = [{ uid: ownerUid, ...listState.owner }, ...invited]
  const collabUids    = collaborators.map(c => c.uid)

  const isOwner   = user?.uid === ownerUid
  const isCollab  = user && collabUids.includes(user.uid)
  const isAdmin   = user?.uid === process.env.REACT_APP_ADMIN_UID

  const canEdit   = isOwner || isCollab
  const canDelete = isOwner || (isAdmin && listState.isPublic)

  const color = NOTE_COLORS[listState._id.charCodeAt(0) % NOTE_COLORS.length]

  // Load items from server
  useEffect(() => {
    api.get(`/items/${listState._id}`)
      .then(r => setAllItems(r.data))
      .catch(console.error)
  }, [listState._id, user?.uid])

  // Build displayItems (ignores draft logic for brevity)
  useEffect(() => {
    let arr = allItems
    if (filters.subCategory.length) {
      arr = arr.filter(i => filters.subCategory.includes(i.subCategory))
    }
    if (filters.addedBy.length) {
      arr = arr.filter(i => filters.addedBy.includes(i.addedBy))
    }
    if (filters.done !== undefined) {
      arr = arr.filter(i => i.done === filters.done)
    }
    setDisplayItems(arr)
  }, [allItems, filters])

  // Invite collaborator
  const handleInvite = async e => {
    e.preventDefault()
    if (!inviteEmail.trim()) return alert('Enter collaborator email')
    try {
      const res = await api.post(
        `/lists/${listState._id}/collaborators`,
        { email: inviteEmail.trim() }
      )
      setListState(res.data)
      setInviteEmail('')
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  // Remove collaborator + refresh
  const handleRemoveCollaborator = async uid => {
    try {
      await api.delete(
        `/lists/${listState._id}/collaborators/${uid}`
      )
      // full reload to reflect changes
      window.location.reload()
    } catch (err) {
      console.error('Failed to remove collaborator', err)
      alert(err.response?.data || err.message)
    }
  }

  // Delete list with confirmation
  const handleDeleteList = async () => {
    if (!window.confirm('Are you sure you want to delete this list?')) return
    await api.delete(`/lists/${listState._id}`)
    onDelete(listState._id)
  }

  // Toggle public
  const handlePublicToggle = async e => {
    const res = await api.put(
      `/lists/${listState._id}`,
      { isPublic: e.target.checked }
    )
    setListState(s => ({ ...s, isPublic: res.data.isPublic }))
  }

  // Add item modal
  const handleNewItemCreated = item => {
    setAllItems(a => [item, ...a])
    setShowNewItem(false)
  }

  // Sub-categories from category
  const subCats = listState.categoryId?.subCategories || []

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative p-6 rounded-lg shadow-xl ${color}`}
      style={{ minHeight: '240px' }}
    >
      {/* Delete List */}
      {canDelete && !editMode && (
        <button
          onClick={handleDeleteList}
          className="absolute top-2 right-2 text-red-600 text-xl"
          title="Delete List"
        >
          ×
        </button>
      )}

      {/* Title & Category */}
      <h3 className="text-xl font-semibold mb-2">{listState.title}</h3>
      <div className="text-sm text-gray-600 mb-4">
        Category: <span className="font-medium">{listState.categoryId?.name}</span>
      </div>

      {/* Edit / Save / Cancel */}
      {canEdit && (
        <div className="mb-4 flex gap-2">
          {editMode ? (
            <button
              onClick={() => setEditMode(false)}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Exit Edit
            </button>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Edit List
            </button>
          )}
        </div>
      )}

      {/* Filters */}
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
            <input
              type="checkbox"
              checked={item.done}
              disabled={editMode || !(isOwner||collabUids.includes(user?.uid))}
              onChange={async () => {
                const res = await api.put(
                  `/items/${item._id}`,
                  { done: !item.done }
                )
                setAllItems(a =>
                  a.map(i => i._id === item._id ? res.data : i)
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

      {/* Add Item (edit mode) */}
      {canEdit && editMode && (
        <button
          onClick={() => setShowNewItem(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition mb-4"
        >
          + Add Item
        </button>
      )}

      {/* Collaborators */}
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
              {collaborators.length > 0 ? (
                <ul className="list-inside mb-2 space-y-1">
                  {collaborators.map(c => (
                    <li key={c.uid} className="flex items-center justify-between">
                      <span>
                        {c.displayName || c.email?.split('@')[0] || c.uid}
                      </span>
                      {isOwner && c.uid !== ownerUid && (
                        <button
                          onClick={() => handleRemoveCollaborator(c.uid)}
                          className="text-red-500 font-bold px-2 text-lg"
                          title="Remove collaborator"
                        >
                          −
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 mb-2">No collaborators</div>
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

      {/* Public Toggle */}
      {isOwner && (
        <label className="inline-flex items-center text-sm">
          <input
            type="checkbox"
            checked={listState.isPublic}
            onChange={handlePublicToggle}
            className="mr-2"
            disabled={editMode}
          />
          Public
        </label>
      )}

      {/* New Item Modal */}
      {showNewItem && (
        <NewItemModal
          listId={listState._id}
          subCategories={subCats}
          onCreated={handleNewItemCreated}
          onClose={() => setShowNewItem(false)}
        />
      )}
    </motion.div>
  )
}
