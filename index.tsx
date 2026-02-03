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
  Info,
  Copy,
  ClipboardList,
  Save,
  Wallet,
  TrendingUp,
  LayoutGrid,
  List as ListIcon,
  Sun,
  Moon
} from 'lucide-react';

// --- Types ---
type NotificationType = 'success' | 'error' | 'warning';
type ViewMode = 'list' | 'add';
type Theme = 'light' | 'dark';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

// --- Components ---

const NotificationToast = ({ notifications, removeNotification }: { notifications: Notification[], removeNotification: (id: number) => void }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 sm:px-0">
    {notifications.map((notif) => (
      <div 
        key={notif.id}
        className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl shadow-black/5 backdrop-blur-xl border animate-in transition-all
          ${notif.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-500/20 dark:text-emerald-100 dark:shadow-emerald-900/10' : ''}
          ${notif.type === 'error' ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-500/20 dark:text-red-100 dark:shadow-red-900/10' : ''}
          ${notif.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-500/20 dark:text-amber-100 dark:shadow-amber-900/10' : ''}
        `}
      >
        <div className={`mt-0.5 shrink-0 ${
          notif.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 
          notif.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
        }`}>
          {notif.type === 'success' && <CheckCircle2 size={18} />}
          {notif.type === 'error' && <AlertCircle size={18} />}
          {notif.type === 'warning' && <AlertCircle size={18} />}
        </div>
        <p className="text-sm font-medium leading-tight pt-0.5">{notif.message}</p>
        <button onClick={() => removeNotification(notif.id)} className="ml-auto text-current opacity-40 hover:opacity-100 p-1 rounded-full transition-opacity">
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

const StatCard = ({ icon: Icon, label, value, colorClass, bgClass }: { icon: any, label: string, value: string, colorClass: string, bgClass?: string }) => (
  <div className="bg-white/50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-xl p-3 flex items-center gap-3 shadow-sm transition-colors">
    <div className={`p-2 rounded-lg ${bgClass ? bgClass : 'bg-slate-100 dark:bg-white/5'} ${colorClass}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{label}</p>
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{value}</p>
    </div>
  </div>
);

const PrizeBondApp = () => {
  // State
  const [bonds, setBonds] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<ViewMode>('list');
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark'; // Default fallback
  });

  // Apply Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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

        if (end - start > 5000) { 
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

    if (validNewBonds.size > 0) {
      setBonds(prev => [...Array.from(validNewBonds).reverse(), ...prev]);
      setInputValue('');
      
      let message = `Added ${validNewBonds.size} bonds.`;
      if (duplicates > 0) message += ` ${duplicates} skipped.`;
      
      showNotification('success', message);
      setActiveTab('list');
    } else {
      let errorMsg = 'No valid bonds added.';
      if (duplicates > 0) errorMsg += ` ${duplicates} duplicates.`;
      if (invalidFormatCount > 0) errorMsg += ` ${invalidFormatCount} invalid.`;
      
      showNotification(duplicates > 0 ? 'warning' : 'error', errorMsg);
    }
  };

  const handleDelete = (bondToDelete: string) => {
    setBonds(prev => prev.filter(b => b !== bondToDelete));
    showNotification('success', `Bond ${bondToDelete} deleted.`);
  };
  
  const handleClearAll = () => {
    if (bonds.length === 0) return;
    if (confirm(`Are you sure you want to delete ALL ${bonds.length} saved bonds?`)) {
      setBonds([]);
      showNotification('success', 'Database cleared.');
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

  const filteredBonds = useMemo(() => {
    if (!searchQuery) return bonds;
    return bonds.filter(b => b.includes(searchQuery));
  }, [bonds, searchQuery]);

  // Sub-components
  const AddBondsPanel = () => (
    <div className="flex flex-col gap-5 h-full">
      <div className="glass-card p-5 rounded-2xl flex flex-col gap-4 flex-1 lg:flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-200">
            <div className="bg-indigo-100 dark:bg-indigo-500/20 p-1.5 rounded-lg">
              <Plus size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-semibold text-sm tracking-wide">Input Console</span>
          </div>
          <button 
             onClick={() => setInputValue('')}
             className={`text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white ${!inputValue ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            Clear
          </button>
        </div>

        <div className="relative flex-1 group">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter numbers (e.g. 1234567, 8888888-8888890)"
            className="w-full h-full min-h-[200px] lg:min-h-[280px] bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300 p-4 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner"
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-slate-500 bg-white/80 dark:bg-slate-900/90 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 pointer-events-none">
            Comma separated
          </div>
        </div>

        <button
          onClick={handleProcessInput}
          disabled={!inputValue.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-slate-800 dark:disabled:to-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save size={18} />
          <span>Save to Database</span>
        </button>
      </div>

      <div className="glass-card p-4 rounded-xl border-dashed border-slate-300 dark:border-slate-700/50">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed space-y-1">
              <p><strong className="text-slate-700 dark:text-slate-300">Format:</strong> 7-digit numbers.</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Range:</strong> Use dash (e.g. 100-200).</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Limit:</strong> Max 5000 per range.</p>
            </div>
          </div>
      </div>
    </div>
  );

  const BondListPanel = () => (
    <div className="flex flex-col h-full glass-card rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20">
      {/* List Header */}
      <div className="flex-none p-4 sm:p-5 border-b border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-10 space-y-4">
        
        {/* Stats Row within List */}
        <div className="grid grid-cols-2 gap-3 mb-2">
           <StatCard 
             icon={Database} 
             label="Stored" 
             value={bonds.length.toLocaleString()} 
             bgClass="bg-emerald-100 dark:bg-white/5"
             colorClass="text-emerald-600 dark:text-emerald-400" 
           />
           <StatCard 
             icon={Wallet} 
             label="Est. Value" 
             value="--" 
             bgClass="bg-indigo-100 dark:bg-white/5"
             colorClass="text-indigo-600 dark:text-indigo-400" 
           />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-50 dark:bg-[#0B0F19]/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 pl-10 pr-9 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500/50 transition-all text-sm placeholder:text-slate-500 dark:placeholder:text-slate-600"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={handleCopyAll}
              disabled={filteredBonds.length === 0}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all disabled:opacity-30"
              title="Copy All"
            >
              <ClipboardList size={18} />
            </button>
            <button
              onClick={handleClearAll}
              disabled={bonds.length === 0}
              className="p-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-transparent hover:border-red-200 dark:hover:border-red-500/30 transition-all disabled:opacity-30"
              title="Clear All"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-3 space-y-2 bg-slate-50/50 dark:bg-slate-950/20">
        {filteredBonds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8 text-center opacity-80 dark:opacity-60">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-4 ring-1 ring-slate-200 dark:ring-slate-700/50">
              <Search size={28} className="opacity-50" />
            </div>
            <p className="text-sm">No results found</p>
          </div>
        ) : (
          filteredBonds.map((bond, index) => (
            <div 
              key={`${bond}-${index}`}
              className="group flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all duration-200 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/80 text-slate-500 flex items-center justify-center text-[10px] font-mono border border-slate-200 dark:border-white/5">
                  {index + 1}
                </div>
                <span className="font-mono text-lg tracking-widest font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                  {bond}
                </span>
              </div>
              
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(bond)}
                  className="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                  title="Copy"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => handleDelete(bond)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer Stat */}
      <div className="p-2 text-center border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/30">
        <p className="text-[10px] text-slate-500 font-mono">
          Showing {filteredBonds.length} of {bonds.length} records
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />
      
      {/* Header */}
      <header className="flex-none pt-4 pb-2 px-4 sm:px-6 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Database className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none transition-colors">Bond Manager</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5 transition-colors">Secure Storage</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Tab Toggle */}
            <div className="lg:hidden bg-white/50 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-white/10 flex shadow-sm">
              <button
                onClick={() => setActiveTab('list')}
                className={`p-2 rounded-lg transition-all ${activeTab === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setActiveTab('add')}
                className={`p-2 rounded-lg transition-all ${activeTab === 'add' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative w-full max-w-7xl mx-auto p-4 sm:p-6">
        
        {/* Desktop Layout (Split View) */}
        <div className="hidden lg:grid grid-cols-12 gap-8 h-full">
          <div className="col-span-4 h-full">
            <AddBondsPanel />
          </div>
          <div className="col-span-8 h-full">
            <BondListPanel />
          </div>
        </div>

        {/* Mobile Layout (Tab View) */}
        <div className="lg:hidden h-full relative">
          <div className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${activeTab === 'list' ? 'translate-x-0 opacity-100 z-10' : '-translate-x-4 opacity-0 z-0 pointer-events-none'}`}>
            <BondListPanel />
          </div>
          <div className={`absolute inset-0 transition-all duration-300 ease-in-out transform ${activeTab === 'add' ? 'translate-x-0 opacity-100 z-10' : 'translate-x-4 opacity-0 z-0 pointer-events-none'}`}>
             <AddBondsPanel />
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