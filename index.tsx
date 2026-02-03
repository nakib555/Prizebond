import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Trash2, 
  Search, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Database,
  History,
  X,
  FileInput,
  Info,
  Copy,
  ClipboardList,
  Save
} from 'lucide-react';

// --- Types ---
type NotificationType = 'success' | 'error' | 'warning';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

// --- Components ---

const NotificationToast = ({ notifications, removeNotification }: { notifications: Notification[], removeNotification: (id: number) => void }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
    {notifications.map((notif) => (
      <div 
        key={notif.id}
        className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border text-sm font-medium animate-fade-in 
          ${notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' : ''}
          ${notif.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-100' : ''}
          ${notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-100' : ''}
        `}
      >
        {notif.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
        {notif.type === 'error' && <AlertCircle size={18} className="text-red-400" />}
        {notif.type === 'warning' && <AlertCircle size={18} className="text-amber-400" />}
        <span>{notif.message}</span>
        <button onClick={() => removeNotification(notif.id)} className="ml-2 hover:bg-white/10 p-1 rounded-full transition-colors">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

const PrizeBondApp = () => {
  // State
  const [bonds, setBonds] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('prize_bonds');
    if (saved) {
      try {
        setBonds(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load bonds", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('prize_bonds', JSON.stringify(bonds));
  }, [bonds]);

  // Notifications Helper
  const showNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Logic
  const handleProcessInput = () => {
    if (!inputValue.trim()) {
      showNotification('warning', 'Please enter bond numbers to add.');
      return;
    }

    const segments = inputValue.split(',').map(s => s.trim()).filter(Boolean);
    const validNewBonds = new Set<string>();
    const existingSet = new Set(bonds);
    
    let duplicates = 0;
    let invalidFormatCount = 0;
    let rangeErrors = 0;

    segments.forEach(segment => {
      // Check for Range (e.g., 1234567-1234570)
      const rangeMatch = segment.match(/^(\d{7})\s*-\s*(\d{7})$/);
      
      if (rangeMatch) {
        const startStr = rangeMatch[1];
        const endStr = rangeMatch[2];
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (start > end) {
          rangeErrors++;
          return;
        }

        if (end - start > 5000) { // Safety cap
          rangeErrors++;
          showNotification('warning', `Range ${segment} too large (max 5000). Skipped.`);
          return;
        }

        for (let i = start; i <= end; i++) {
          const bondStr = i.toString().padStart(7, '0');
          if (existingSet.has(bondStr) || validNewBonds.has(bondStr)) {
            duplicates++;
          } else {
            validNewBonds.add(bondStr);
          }
        }
      } 
      // Check for Single (e.g., 1234567)
      else if (/^\d{7}$/.test(segment)) {
        if (existingSet.has(segment) || validNewBonds.has(segment)) {
          duplicates++;
        } else {
          validNewBonds.add(segment);
        }
      } 
      else {
        invalidFormatCount++;
      }
    });

    // Update State
    if (validNewBonds.size > 0) {
      setBonds(prev => [...Array.from(validNewBonds).reverse(), ...prev]);
      setInputValue('');
      
      let message = `Successfully added ${validNewBonds.size} bonds.`;
      if (duplicates > 0) message += ` ${duplicates} duplicates skipped.`;
      
      showNotification('success', message);
    } else {
      let errorMsg = 'No valid bonds added.';
      if (duplicates > 0) errorMsg += ` ${duplicates} duplicates.`;
      if (invalidFormatCount > 0) errorMsg += ` ${invalidFormatCount} invalid formats.`;
      
      showNotification(duplicates > 0 ? 'warning' : 'error', errorMsg);
    }
  };

  const handleDelete = (bondToDelete: string) => {
    // No confirmation for single delete for speed, but could add undo later if needed
    setBonds(prev => prev.filter(b => b !== bondToDelete));
    showNotification('success', `Bond ${bondToDelete} deleted.`);
  };
  
  const handleClearAll = () => {
    if (bonds.length === 0) return;
    
    if (confirm(`⚠️ DANGER: This will permanently delete ALL ${bonds.length} saved bonds.\n\nAre you sure you want to clear your database?`)) {
      setBonds([]);
      showNotification('success', 'Database cleared successfully.');
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('success', `Copied ${text}`);
    } catch (err) {
      showNotification('error', 'Failed to copy');
    }
  };

  const handleCopyAll = async () => {
    if (filteredBonds.length === 0) {
      showNotification('warning', 'No bonds to copy.');
      return;
    }
    
    try {
      const text = filteredBonds.join(', ');
      await navigator.clipboard.writeText(text);
      showNotification('success', `Copied ${filteredBonds.length} bonds.`);
    } catch (err) {
      showNotification('error', 'Failed to copy');
    }
  };

  // Filtered List
  const filteredBonds = useMemo(() => {
    if (!searchQuery) return bonds;
    return bonds.filter(b => b.includes(searchQuery));
  }, [bonds, searchQuery]);

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col">
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />
      
      {/* Top Navbar / Header - Visible on Mobile & Desktop */}
      <header className="flex-none bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Database className="text-indigo-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Bond Manager</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Secure Data Storage</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Saved</span>
                <span className="text-lg font-bold text-indigo-400 leading-none">{bonds.length}</span>
             </div>
             
             {/* Mobile Total Display */}
             <div className="sm:hidden px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
               <span className="text-sm font-bold text-indigo-400">{bonds.length}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Grid Layout */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: Input (Takes 4/12 cols on Desktop, scrollable if needed) */}
          <div className="lg:col-span-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-20 lg:pb-0">
            
            {/* Input Card */}
            <div className="bg-slate-900/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col">
              <div className="flex items-center gap-2 mb-4 text-slate-200 font-medium">
                <Plus size={18} className="text-emerald-400" />
                <span>Add New Bonds</span>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter numbers..."
                    className="w-full h-40 bg-slate-950 border border-slate-800 text-white p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-mono tracking-wide text-sm resize-none custom-scrollbar placeholder:text-slate-600"
                  />
                  {inputValue && (
                    <button 
                      onClick={() => setInputValue('')}
                      className="absolute right-3 top-3 text-slate-500 hover:text-white bg-slate-800 rounded-md p-1 transition-all opacity-0 group-hover:opacity-100"
                      title="Clear input"
                    >
                      <X size={14} />
                    </button>
                  )}
                  <div className="absolute bottom-3 right-3 text-[10px] text-slate-600 pointer-events-none bg-slate-900/80 px-1 rounded">
                    Separate by comma
                  </div>
                </div>

                <button
                  onClick={handleProcessInput}
                  disabled={!inputValue.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  <span>Save to Database</span>
                </button>
              </div>
            </div>

            {/* Helper Card */}
            <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50">
               <div className="flex items-start gap-3">
                  <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-slate-200">How to use</p>
                    <ul className="space-y-1.5 text-slate-400 text-xs leading-relaxed">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        Single: <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">1234567</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        Range: <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">1234567-1234580</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        Max range limit: 5000 numbers
                      </li>
                    </ul>
                  </div>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: List (Takes 8/12 cols on Desktop, Full height flex container) */}
          <div className="lg:col-span-8 flex flex-col h-[500px] lg:h-full bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative">
            
            {/* List Header (Sticky) */}
            <div className="flex-none p-4 border-b border-slate-800 bg-slate-900/80 z-10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <History size={18} className="text-indigo-400" />
                  Saved Bonds
                  <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {filteredBonds.length} visible
                  </span>
                </h2>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAll}
                    disabled={filteredBonds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <ClipboardList size={14} />
                    <span className="hidden sm:inline">Copy List</span>
                    <span className="sm:hidden">Copy</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={bonds.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">Clear Database</span>
                    <span className="sm:hidden">Clear All</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved bonds..."
                  className="w-full bg-slate-950/50 border border-slate-700/50 text-white pl-10 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all text-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-4 space-y-2">
              {filteredBonds.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 ring-1 ring-slate-700/50">
                    <Search size={28} className="opacity-40" />
                  </div>
                  <h3 className="text-slate-300 font-medium mb-1">No bonds found</h3>
                  <p className="text-xs max-w-[200px]">Add bonds using the panel on the left or try a different search term.</p>
                </div>
              ) : (
                filteredBonds.map((bond, index) => (
                  <div 
                    key={`${bond}-${index}`}
                    className="group flex items-center justify-between p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/30 hover:border-slate-600 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-9 md:h-9 rounded-md bg-slate-900 text-slate-400 flex items-center justify-center text-xs font-mono border border-slate-800">
                        {index + 1}
                      </div>
                      <span className="font-mono text-lg md:text-xl tracking-wider font-medium text-slate-200 group-hover:text-white transition-colors">
                        {bond}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(bond)}
                        className="p-2 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors focus:opacity-100 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        title="Copy Number"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(bond)}
                        className="p-2 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete this bond"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PrizeBondApp />);
}
