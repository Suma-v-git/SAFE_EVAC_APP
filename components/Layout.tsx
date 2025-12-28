import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldAlert, Home, Map, Phone, LogOut, User, Moon, Sun } from 'lucide-react';
import { SOSButton } from './SOSButton';
import { ChatBot } from './ChatBot';

interface LayoutProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!isAuthenticated) return <Outlet />;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col transition-colors duration-300">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
              <ShieldAlert className="h-8 w-8 text-blue-600 mr-2" />
              <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">SafeEvac</span>
            </div>

            <div className="hidden md:flex space-x-8 items-center">
              <NavLink to="/" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                <Home size={18} className="mr-1" /> Home
              </NavLink>
              <NavLink to="/shelters" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                <Map size={18} className="mr-1" /> Shelters
              </NavLink>
              <NavLink to="/contacts" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                <Phone size={18} className="mr-1" /> Emergency
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-blue-600 bg-blue-50 dark:bg-slate-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                <User size={18} className="mr-1" /> Profile
              </NavLink>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Dark Mode"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={18} className="mr-1" /> Logout
              </button>
            </div>

            {/* Mobile Theme Toggle (visible only on mobile) */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors mr-2"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t dark:border-slate-700 z-30 flex justify-around py-3 transition-colors duration-300">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Home size={24} />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        <NavLink to="/shelters" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Map size={24} />
          <span className="text-xs mt-1">Shelters</span>
        </NavLink>
        <NavLink to="/contacts" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <Phone size={24} />
          <span className="text-xs mt-1">Contacts</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
          <User size={24} />
          <span className="text-xs mt-1">Profile</span>
        </NavLink>
        <button
          onClick={onLogout}
          className="flex flex-col items-center text-red-500 dark:text-red-400"
        >
          <LogOut size={24} />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Utilities */}
      <SOSButton />
      <ChatBot />
    </div>
  );
};