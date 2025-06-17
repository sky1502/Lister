import React from 'react';

export default function NavBar({ user, onLogin, onLogout }) {
  return (
    <header className="w-full bg-white shadow-sm px-6 py-3 flex justify-between items-center">
      <div className="text-2xl font-semibold text-indigo-600">Lister</div>
      <div>
        {user ? (
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md transition"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={onLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md transition"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
);
}
