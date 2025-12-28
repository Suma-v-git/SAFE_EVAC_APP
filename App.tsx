import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Shelters } from './pages/Shelters';
import { Contacts } from './pages/Contacts';
import { Profile } from './pages/Profile';

function App() {
  // Simple auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('safeevac_auth') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('safeevac_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('safeevac_auth');
    localStorage.removeItem('safeevac_current_user_email');
    setIsAuthenticated(false);
  };

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout isAuthenticated={isAuthenticated} onLogout={handleLogout} />}>
          {/* Public Route */}
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Home /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/shelters" 
            element={
              isAuthenticated ? <Shelters /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/contacts" 
            element={
              isAuthenticated ? <Contacts /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/profile" 
            element={
              isAuthenticated ? <Profile /> : <Navigate to="/login" replace />
            } 
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;