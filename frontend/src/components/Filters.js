// frontend/src/components/Filters.js
import React, { useState, useRef, useEffect } from 'react'

export default function Filters({
  subCategories = [],
  collaborators  = [],
  filters = { subCategory: [], addedBy: [], done: undefined },
  onChange
}) {
  const [open, setOpen] = useState({ sub: false, user: false, status: false })
  const refs = {
    sub: useRef(null),
    user: useRef(null),
    status: useRef(null)
  }

  // close dropdown on outside click
  useEffect(() => {
    const handleOutside = e => {
      Object.entries(refs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(e.target)) {
          setOpen(o => ({ ...o, [key]: false }))
        }
      })
    }
    window.addEventListener('click', handleOutside)
    return () => window.removeEventListener('click', handleOutside)
  }, [])

  const toggle = key => setOpen(o => ({ ...o, [key]: !o[key] }))

  // Instead of deleting, reset to empty array
  const clearField = field => {
    onChange({ ...filters, [field]: [] })
  }

  const toggleItem = (field, value) => {
    const arr = filters[field] || []
    const next = arr.includes(value)
      ? arr.filter(v => v !== value)
      : [...arr, value]
    onChange({ ...filters, [field]: next })
  }

  const setStatus = val => {
    onChange({ ...filters, done: val === 'all' ? undefined : val === 'done' })
    setOpen(o => ({ ...o, status: false }))
  }

  return (
    <div className="flex gap-4">
      {/* Subcategories */}
      <div className="relative" ref={refs.sub}>
        <button
          onClick={() => toggle('sub')}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Subcategories ({filters.subCategory.length || 'All'})
        </button>
        {open.sub && (
          <div className="absolute mt-1 w-48 bg-white border rounded shadow p-2 max-h-48 overflow-auto z-10">
            <button
              onClick={() => clearField('subCategory')}
              className="text-xs text-blue-500 mb-2"
            >
              All Subcategories
            </button>
            {subCategories.map(sc => (
              <label key={sc} className="flex items-center text-sm mb-1">
                <input
                  type="checkbox"
                  checked={filters.subCategory.includes(sc)}
                  onChange={() => toggleItem('subCategory', sc)}
                  className="mr-2"
                />
                {sc}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Users */}
      <div className="relative" ref={refs.user}>
        <button
          onClick={() => toggle('user')}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Users ({filters.addedBy.length || 'All'})
        </button>
        {open.user && (
          <div className="absolute mt-1 w-48 bg-white border rounded shadow p-2 max-h-48 overflow-auto z-10">
            <button
              onClick={() => clearField('addedBy')}
              className="text-xs text-blue-500 mb-2"
            >
              All Users
            </button>
            {collaborators.map(u => (
              <label key={u.uid} className="flex items-center text-sm mb-1">
                <input
                  type="checkbox"
                  checked={filters.addedBy.includes(u.uid)}
                  onChange={() => toggleItem('addedBy', u.uid)}
                  className="mr-2"
                />
                {u.displayName || u.uid}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="relative" ref={refs.status}>
        <button
          onClick={() => toggle('status')}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Status: {filters.done === undefined
            ? 'All'
            : filters.done
              ? 'Done'
              : 'Not Done'}
        </button>
        {open.status && (
          <div className="absolute mt-1 w-32 bg-white border rounded shadow p-2 z-10">
            <button
              onClick={() => setStatus('all')}
              className="block text-sm w-full text-left px-1 mb-1"
            >
              All
            </button>
            <button
              onClick={() => setStatus('done')}
              className="block text-sm w-full text-left px-1 mb-1"
            >
              Done
            </button>
            <button
              onClick={() => setStatus('notdone')}
              className="block text-sm w-full text-left px-1"
            >
              Not Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
