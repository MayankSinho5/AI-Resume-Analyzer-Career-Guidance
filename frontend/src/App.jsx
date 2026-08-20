import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token');

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        
        // Verify token validity with backend
        const verifyToken = async () => {
          const apiUrls = ['http://localhost:8000/api/auth/me', 'http://127.0.0.1:8000/api/auth/me'];
          let valid = false;
          for (const url of apiUrls) {
            try {
              const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const freshUser = await res.json();
                setUser(freshUser);
                localStorage.setItem('user_data', JSON.stringify(freshUser));
                valid = true;
                break;
              }
            } catch (err) {}
          }
          if (!valid) {
            // Token expired or invalid -> Clear session
            handleLogout();
          }
        };

        verifyToken();

      } catch (e) {
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
      }}>
        Loading CareerAI...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar user={user} onLogout={handleLogout} />
      <main style={{ flex: 1 }}>
        {user ? (
          <Dashboard user={user} />
        ) : (
          <AuthPage onAuthSuccess={handleAuthSuccess} />
        )}
      </main>
    </div>
  );
}
