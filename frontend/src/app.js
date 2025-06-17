import React, { useState, useEffect } from 'react';
import { auth, signInWithPopup, googleProvider, signOut } from './firebase';
import NavBar from './components/NavBar';
import ListView from './components/ListView';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(setUser);
    return unsub;
  }, []);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  return (
    <div className="flex flex-col h-full">
      <NavBar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-6">
        <ListView user={user} />
      </main>
    </div>
  );
}

export default App;
