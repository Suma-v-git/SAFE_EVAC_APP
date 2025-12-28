import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Phone, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../src/config/api';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    emergencyEmail1: '',
    emergencyEmail2: ''
  });

  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      const email = localStorage.getItem('safeevac_current_user_email');

      // Load contacts count
      const storedContacts = localStorage.getItem('safeevac_personal_contacts');
      const contacts = storedContacts ? JSON.parse(storedContacts) : [];
      setContactCount(contacts.length);

      if (!email) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      if (email) {
        try {
          const response = await fetch(API_ENDPOINTS.profile(email));
          if (response.ok) {
            const user = await response.json();
            setFormData({
              name: user.name || '',
              email: user.email || '',
              password: user.password || '',
              emergencyEmail1: user.emergencyEmail1 || '',
              emergencyEmail2: user.emergencyEmail2 || ''
            });
          }
        } catch (error) {
          console.error("Failed to fetch profile");
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(API_ENDPOINTS.profile(formData.email), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          password: formData.password,
          emergencyEmail1: formData.emergencyEmail1,
          emergencyEmail2: formData.emergencyEmail2
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Profile updated successfully.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Error updating profile.');
      }
    } catch (err) {
      setMessage('Failed to save profile. Is the server running?');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/30">
            <User className="text-white" size={32} />
          </div>
          My Profile
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
          Manage your account security and emergency settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Personal Info (8/12) */}
        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Shield size={20} className="text-blue-600" /> Account Details
              </h2>
              {isGuest && (
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full uppercase tracking-wider">
                  Guest Mode
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {message && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in zoom-in-95">
                  <CheckCircle size={20} /> {message}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 rounded-2xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-4">SOS Alert Emails</h3>
                <div className="space-y-4">
                  <input
                    type="email"
                    value={formData.emergencyEmail1}
                    onChange={(e) => setFormData({ ...formData, emergencyEmail1: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Primary emergency contact (email)"
                  />
                  <input
                    type="email"
                    value={formData.emergencyEmail2}
                    onChange={(e) => setFormData({ ...formData, emergencyEmail2: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Secondary emergency contact (email)"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-3 italic">
                  * Alerts with your live GPS location will be sent to these addresses when you press the SOS button.
                </p>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
                >
                  <Save size={18} /> Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Quick Links (4/12) */}
        <div className="lg:col-span-4 space-y-6 animate-in fade-in slide-in-from-right-4 duration-1000">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl shadow-red-500/20">
            <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md">
              <Phone size={24} />
            </div>
            <h3 className="text-xl font-bold mb-2">Emergency Contacts</h3>
            <p className="text-red-50 text-sm mb-6 leading-relaxed">
              You have <span className="font-black text-white">{contactCount}</span> personal contacts ready for rapid response.
            </p>
            <button
              onClick={() => navigate('/contacts')}
              className="w-full bg-white text-red-600 py-3 rounded-2xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              Manage Hub <ArrowRight size={18} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};