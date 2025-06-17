// frontend/src/components/ListDetail.js
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../api'
import Filters from './Filters'
import NewItemModal from './NewItemModal'
import ListView from './ListView';

const NOTE_COLORS = ['note-yellow','note-green','note-blue','note-pink']

export default function ListDetail({ 
  list, 
  user, 
  onDelete,
  onStartAddItem,
}) {
  const [state, setState]               = useState(list)
  const [allItems, setAllItems]         = useState([])
  const [displayItems, setDisplayItems] = useState([])
  const [filters, setFilters]           = useState({
    subCategory: [], addedBy: [], done: undefined
  })
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [showNewItem, setShowNewItem]   = useState(false)

  // Owner + collaborators
  const ownerUid = state.owner?.uid ?? state.ownerUid
  const owner    = {
    uid:         ownerUid,
    email:       state.owner?.email,
    displayName: state.owner?.displayName
  }
  const invited    = (state.collaborators || []).map(c =>
    typeof c === 'string' ? { uid: c } : c
  )
  const collaborators = [owner, ...invited]
  const collabUids    = collaborators.map(c => c.uid)

  const isOwner   = user?.uid === ownerUid
  const isCollab  = user && collabUids.includes(user.uid)
  const isAdmin   = user?.uid === process.env.REACT_APP_ADMIN_UID
  const canEdit   = user && (isAdmin || isOwner || isCollab)
  const canDelete = user && (isAdmin || isOwner)

  // Pastel background
  const color = NOTE_COLORS[state._id.charCodeAt(0) % NOTE_COLORS.length]

  // Fetch items on mount & user change
  useEffect(() => {
    api.get(`/items/${state._id}`)
      .then(r => {
        setAllItems(r.data)
        setDisplayItems(r.data)
      })
      .catch(console.error)
  }, [state._id, user?.uid])

  // Client-side filtering
  useEffect(() => {
    let filtered = allItems
    if (filters.subCategory.length) {
      filtered = filtered.filter(i => filters.subCategory.includes(i.subCategory))
    }
    if (filters.addedBy.length) {
      filtered = filtered.filter(i => filters.addedBy.includes(i.addedBy))
    }
    if (filters.done !== undefined) {
      filtered = filtered.filter(i => i.done === filters.done)
    }
    setDisplayItems(filtered)
  }, [filters, allItems])

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

  const handleDeleteList = async () => {
    if (!window.confirm('Delete this list?')) return
    await api.delete(`/lists/${state._id}`)
    onDelete(state._id)
  }

  const handlePublicToggle = async e => {
    const isPublic = e.target.checked
    const res = await api.put(`/lists/${state._id}`, { isPublic })
    setState(prev => ({ ...prev, isPublic: res.data.isPublic }))
  }

  const subCats = Array.from(new Set(allItems.map(i => i.subCategory).filter(Boolean)))

  const collaboratorNames = invited.map(c =>
    c.displayName ||
    c.email?.split('@')[0].replace(/^\w/, w => w.toUpperCase()) ||
    c.uid
  )

  const handleOpenNewItem = () => {
    if (onStartAddItem) 
      onStartAddItem()
    setShowNewItem(true)
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, rotate: 0.5 }}
      whileTap={{ scale: 0.98, rotate: -0.5 }}
      className={`relative p-6 rounded-lg shadow-xl ${color}`}
      style={{ minHeight: '240px' }}
    >
      {/* Delete List button now in top-right */}
      {canDelete && (
        <button
          onClick={handleDeleteList}
          className="absolute top-2 right-2 text-red-600 hover:underline text-sm"
        >
          Delete
        </button>
      )}

      {/* Title & Category */}
      <h3 className="text-xl font-semibold mb-2">{state.title}</h3>
      <div className="text-sm text-gray-600 mb-4">
        Category: <span className="font-medium">{state.categoryId?.name}</span>
      </div>

      {/* Filters */}
      {canEdit && (
        <Filters
          subCategories={subCats}
          collaborators={collaborators}
          filters={filters}
          onChange={setFilters}
        />
      )}

      {/* Items List */}
      <ul className="space-y-2 overflow-auto max-h-40 mb-4">
        {displayItems.map(item => (
          <li key={item._id} className="flex items-center">
            <input
              type="checkbox"
              checked={item.done}
              disabled={!canEdit}
              onChange={async () => {
                const res = await api.put(
                  `/items/${item._id}`,
                  { done: !item.done }
                )
                setAllItems(prev => prev.map(i =>
                  i._id === item._id ? res.data : i
                ))
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

      {/* Add Item */}
      {canEdit && (
        <button
          onClick={handleOpenNewItem}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition mb-4"
        >
          + Add Item
        </button>
      )}

      {/* Collaborators Section */}
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
