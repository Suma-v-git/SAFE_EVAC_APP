import React, { useState, useEffect } from 'react';
import { Phone, Mail, Trash2, Plus, User, Save, X } from 'lucide-react';

export const STATIC_CONTACTS = [
  { name: 'National Emergency', role: 'General', phone: '911', email: 'emergency@gov.org' },
  { name: 'Red Cross', role: 'Medical & Shelter', phone: '1-800-733-2767', email: 'support@redcross.org' },
  { name: 'FEMA Disaster', role: 'Federal Aid', phone: '1-800-621-3362', email: 'askia@fema.dhs.gov' },
  { name: 'Poison Control', role: 'Medical', phone: '1-800-222-1222', email: 'poison@control.org' },
  { name: 'Roadside Assist', role: 'Transport', phone: '*999', email: 'help@roadside.com' },
];

interface PersonalContact {
  id: string;
  name: string;
  relation: string;
  email: string;
}

export const Contacts: React.FC = () => {
  const [personalContacts, setPersonalContacts] = useState<PersonalContact[]>(() => {
    const saved = localStorage.getItem('safeevac_personal_contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relation: '', email: '' });

  useEffect(() => {
    localStorage.setItem('safeevac_personal_contacts', JSON.stringify(personalContacts));
  }, [personalContacts]);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact.name && newContact.email) {
      setPersonalContacts([
        ...personalContacts,
        { ...newContact, id: Date.now().toString() }
      ]);
      setNewContact({ name: '', relation: '', email: '' });
      setIsAdding(false);
    }
  };

  const handleDeleteContact = (id: string) => {
    setPersonalContacts(personalContacts.filter(c => c.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
          <div className="bg-red-500 p-2 rounded-2xl shadow-lg shadow-red-500/30 rotate-3">
            <Phone className="text-white -rotate-3" size={32} />
          </div>
          Emergency Hub
        </h1>
        <p className="mt-3 text-slate-500 dark:text-slate-400 font-medium">
          Global and personal lifelines. Ready for instant action.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Global Emergency Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Global Services</h2>
            <span className="text-[10px] font-black bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full uppercase tracking-widest">24/7 Priority</span>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {STATIC_CONTACTS.map((contact, idx) => (
                <div key={idx} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all flex items-center justify-between group">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-red-500 transition-colors">{contact.name}</h3>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">{contact.role}</p>
                  </div>
                  <a
                    href={`mailto:${contact.email}`}
                    className="h-12 w-12 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all active:scale-90 shadow-sm"
                    title={`Email ${contact.name}`}
                  >
                    <Mail size={20} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Personal Contacts Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-1000">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Personal Circle</h2>
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
            >
              <Plus size={14} /> Add New
            </button>
          </div>

          <div className="space-y-4">
            {personalContacts.map(contact => (
              <div key={contact.id} className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-none flex items-center justify-between group hover:border-blue-500 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <User size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{contact.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">{contact.relation || 'Contact'} • {contact.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 px-4 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                  >
                    <Mail size={14} /> Gmail
                  </a>
                  <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}

            {personalContacts.length === 0 && !isAdding && (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <User size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                <p className="text-slate-400 font-medium">No personal contacts configured yet.</p>
              </div>
            )}

            {isAdding && (
              <form onSubmit={handleAddContact} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-blue-500 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-xl text-slate-900 dark:text-white tracking-tight">New Contact</h4>
                  <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Maya"
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      value={newContact.name}
                      onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Relation</label>
                      <input
                        type="text"
                        placeholder="e.g. Sister"
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newContact.relation}
                        onChange={e => setNewContact({ ...newContact, relation: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input
                        type="email"
                        placeholder="maya@safe.com"
                        className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={newContact.email}
                        onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-4 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};