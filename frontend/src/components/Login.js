import React from 'react';
import { auth, googleProvider, signInWithPopup } from '../firebase';

export default function Login() {
  async function handleLogin() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      alert('Login failed');
    }
  }

  return (
    <div className="text-center mt-20">
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-2 rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
}
