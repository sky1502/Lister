// frontend/src/components/ListDetail.js
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../api'
import Filters from './Filters'
import NewItemModal from './NewItemModal'

const NOTE_COLORS = ['note-yellow','note-green','note-blue','note-pink']

export default function ListDetail({ list, user, onDelete }) {
  // Live list & items state
  const [listState, setListState] = useState(list)
  const [allItems, setAllItems]   = useState([])

  // Draft snapshots & staged removals
  const draftListRef    = useRef(null)
  const draftItemsRef   = useRef(null)
  const [itemsToRemove, setItemsToRemove] = useState(new Set())

  // Filters & what to display
  const [filters, setFilters]           = useState({ subCategory: [], addedBy: [], done: undefined })
  const [displayItems, setDisplayItems] = useState([])

  // UI toggles
  const [showCollaborators, setShowCollaborators] = useState(false)
  const [inviteEmail, setInviteEmail]             = useState('')
  const [showNewItem, setShowNewItem]             = useState(false)

  // Edit mode & saving
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]     = useState(false)

  // Delete-list confirmation modal
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Permissions setup
  const ownerUid = listState.owner?.uid ?? listState.ownerUid
  const invited  = (listState.collaborators || []).map(c =>
    typeof c === 'string' ? { uid: c } : c
  )
  const collaborators = [{ uid: ownerUid, ...listState.owner }, ...invited]
  const collabUids    = collaborators.map(c => c.uid)

  const isOwner  = user?.uid === ownerUid
  const isCollab = user && collabUids.includes(user.uid)
  const isAdmin  = user?.uid === process.env.REACT_APP_ADMIN_UID

  const canEdit   = isOwner || isCollab
  const canDelete = isOwner || (isAdmin && listState.isPublic)

  const color = NOTE_COLORS[listState._id.charCodeAt(0) % NOTE_COLORS.length]

  // Load items from server & snapshot
  useEffect(() => {
    api.get(`/items/${listState._id}`)
      .then(r => {
        setAllItems(r.data)
        draftItemsRef.current = r.data.slice()
      })
      .catch(console.error)
  }, [listState._id, user?.uid])

  // Recompute displayItems on changes, excluding staged removals
  useEffect(() => {
    let arr = allItems.filter(i => !itemsToRemove.has(i._id))
    if (filters.subCategory.length)
      arr = arr.filter(i => filters.subCategory.includes(i.subCategory))
    if (filters.addedBy.length)
      arr = arr.filter(i => filters.addedBy.includes(i.addedBy))
    if (filters.done !== undefined)
      arr = arr.filter(i => i.done === filters.done)
    setDisplayItems(arr)
  }, [allItems, filters, itemsToRemove])

  // Invite collaborator
  const handleInvite = async e => {
    e.preventDefault()
    if (!inviteEmail.trim()) return alert('Enter collaborator email')
    try {
      await api.post(
        `/lists/${listState._id}/collaborators`,
        { email: inviteEmail.trim() }
      )
      window.location.reload()
    } catch (err) {
      alert(err.response?.data || err.message)
    }
  }

  // Remove collaborator
  const handleRemoveCollaborator = async uid => {
    try {
      await api.delete(
        `/lists/${listState._id}/collaborators/${uid}`
      )
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert(err.response?.data || err.message)
    }
  }

  // Enter edit mode: snapshot everything
  const enterEditMode = () => {
    draftListRef.current  = { ...listState }
    draftItemsRef.current = allItems.slice()
    setItemsToRemove(new Set())
    setEditMode(true)
  }

  // Cancel edit: restore snapshots
  const cancelEdit = () => {
    setListState(draftListRef.current)
    setAllItems(draftItemsRef.current)
    setItemsToRemove(new Set())
    setEditMode(false)
    setSaving(false)
  }

  // Save edits: delete staged items then persist public-toggle and refresh
  const saveEdit = async () => {
    setSaving(true)
    try {
      if (itemsToRemove.size > 0) {
        await Promise.all(
          Array.from(itemsToRemove).map(id =>
            api.delete(`/items/${id}`)
          )
        )
      }
      if (listState.isPublic !== draftListRef.current.isPublic) {
        const res = await api.put(
          `/lists/${listState._id}`,
          { isPublic: listState.isPublic }
        )
        setListState(s => ({ ...s, isPublic: res.data.isPublic }))
      }
      setItemsToRemove(new Set())
      setEditMode(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  // Stage item removal / undo
  const handleRemoveItem = id => {
    setItemsToRemove(s => new Set(s).add(id))
  }
  const handleUndoRemove = id => {
    setItemsToRemove(s => {
      const next = new Set(s)
      next.delete(id)
      return next
    })
  }

  // Delete-list modal controls
  const openConfirm = () => { setDeleteError(''); setShowConfirm(true) }
  const cancelDelete = () => { setShowConfirm(false); setDeleting(false) }
  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/lists/${listState._id}`)
      setShowConfirm(false)
      onDelete(listState._id)
    } catch (e) {
      console.error(e)
      setDeleteError('Failed to delete.')
      setDeleting(false)
    }
  }

  // Toggle public locally in editMode
  const handlePublicToggle = e => {
    setListState(s => ({ ...s, isPublic: e.target.checked }))
  }

  // New item creation
  const handleNewItemCreated = item => {
    setAllItems(a => [item, ...a])
    setShowNewItem(false)
  }

  const subCats = listState.categoryId?.subCategories || []

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-lg shadow-xl ${color} p-4 sm:p-6 md:p-8`}
      style={{ minHeight: '200px' }}
    >
      {/* Delete List Button */}
      {canDelete && !editMode && (
        <button
          onClick={openConfirm}
          className="absolute top-2 right-2 text-red-600 text-lg sm:text-xl md:text-2xl p-1 sm:p-2"
          title="Delete List"
        >
          ×
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cancelDelete}
        >
          <div
            className="bg-white rounded-lg p-4 sm:p-6 md:p-8 w-64 sm:w-72 md:w-96"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-4">
              Delete list?
            </h2>
            {deleteError && (
              <p className="text-xs sm:text-sm text-red-500 mb-2">
                {deleteError}
              </p>
            )}
            <div className="flex justify-end space-x-2 sm:space-x-3">
              <button
                onClick={cancelDelete}
                className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 text-xs sm:text-sm"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-2 py-1 sm:px-3 sm:py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title + Edit Controls row */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold">
            {listState.title}
          </h3>
          <div className="text-xs sm:text-sm text-gray-600">
            Category: <span className="font-medium">{listState.categoryId?.name}</span>
          </div>
        </div>
        {canEdit && (
          editMode ? (
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-green-600 text-white rounded hover:bg-green-700 text-xs sm:text-sm"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-3 py-1 sm:px-4 sm:py-2 bg-gray-300 rounded hover:bg-gray-400 text-xs sm:text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={enterEditMode}
              className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 text-xs sm:text-sm"
            >
              Edit
            </button>
          )
        )}
      </div>

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
      <ul className="space-y-1 sm:space-y-2 overflow-auto mb-4 max-h-32 sm:max-h-40 md:max-h-48">
        {displayItems.map(item => {
          const canRemoveItem = isOwner || item.addedBy === user?.uid
          const isRemoved     = itemsToRemove.has(item._id)
          return (
            <li key={item._id} className="flex items-center">
              <input
                type="checkbox"
                checked={item.done}
                disabled={editMode || !(isOwner || collabUids.includes(user?.uid))}
                onChange={async () => {
                  const res = await api.put(`/items/${item._id}`, { done: !item.done })
                  setAllItems(a => a.map(i => i._id === item._id ? res.data : i))
                }}
                className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
              />
              <span className={item.done ? 'line-through text-gray-500' : ''}>
                {item.text}
              </span>
              {item.subCategory && (
                <span className="ml-auto text-xs sm:text-sm italic text-gray-700">
                  {item.subCategory}
                </span>
              )}
              {/* Remove / Undo in edit mode */}
              {editMode && canRemoveItem && (
                isRemoved ? (
                  <button
                    onClick={() => handleUndoRemove(item._id)}
                    className="ml-2 text-yellow-600 text-xs sm:text-sm"
                  >
                    Undo
                  </button>
                ) : (
                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    className="ml-2 text-red-600 text-xs sm:text-sm"
                  >
                    −
                  </button>
                )
              )}
            </li>
          )
        })}
      </ul>

      {/* Add Item */}
      {canEdit && editMode && (
        <button
          onClick={() => setShowNewItem(true)}
          className="w-full py-1 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm rounded-md transition mb-4"
        >
          + Add Item
        </button>
      )}

      {/* Collaborators */}
      {(isOwner || isCollab) && (
        <div className="mb-4">
          <button
            onClick={() => setShowCollaborators(v => !v)}
            disabled={editMode}
            className="text-xs sm:text-sm text-gray-700 hover:underline mb-2"
          >
            {showCollaborators ? 'Hide Collaborators' : 'Show Collaborators'}
          </button>
          {showCollaborators && (
            <div className="bg-white p-3 sm:p-4 rounded-md shadow-inner">
              <h4 className="font-semibold mb-2 text-sm sm:text-base">Collaborators</h4>
              {collaborators.length > 0 ? (
                <ul className="list-inside mb-2 space-y-1">
                  {collaborators.map(c => (
                    <li key={c.uid} className="flex items-center justify-between text-xs sm:text-sm">
                      <span>{c.displayName || c.email?.split('@')[0] || c.uid}</span>
                      {isOwner && c.uid !== ownerUid && (
                        <button
                          onClick={() => handleRemoveCollaborator(c.uid)}
                          disabled={editMode}
                          className="text-red-500 font-bold px-2"
                          title="Remove collaborator"
                        >
                          −
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs sm:text-sm text-gray-500">No collaborators</div>
              )}
              {isOwner && (
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Invite by email"
                    disabled={editMode}
                    className="flex-1 border rounded px-2 py-1 text-xs sm:text-sm"
                    required
                  />
                  <button
                    type="submit"
                    disabled={editMode}
                    className="bg-indigo-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded hover:bg-indigo-700 text-xs sm:text-sm"
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
        <label className="inline-flex items-center text-xs sm:text-sm mb-4">
          <input
            type="checkbox"
            checked={listState.isPublic}
            onChange={handlePublicToggle}
            disabled={!editMode}
            className="mr-2"
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
