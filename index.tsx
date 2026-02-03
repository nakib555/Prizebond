import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Trash2, 
  Search, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Database,
  X,
  Copy,
  ClipboardList,
  Save,
  Wallet
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
  <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4 sm:px-0">
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

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  count 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  count: number; 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-white/10 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center mb-1">
            <Trash2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clear Database?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              You are about to delete <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{count}</span> saved bonds. 
              <br/>This action cannot be undone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-slate-50 dark:bg-slate-800/50"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              Yes, Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components extracted to prevent re-render focus loss ---

interface AddBondsPanelProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSave: () => void;
}

const AddBondsPanel = ({ inputValue, setInputValue, onSave }: AddBondsPanelProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
    // Maintain focus on input after submission
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  return (
    <div className="flex-none mb-6 animate-in relative z-30">
      <form 
          onSubmit={handleSubmit}
          className={`
            relative group flex items-start gap-2 p-2 rounded-2xl border transition-all duration-300
            ${isFocused 
              ? 'bg-white dark:bg-slate-900 border-indigo-500/30 ring-4 ring-indigo-500/10 shadow-xl shadow-indigo-500/10' 
              : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-white/10 hover:border-indigo-500/20 hover:bg-white dark:hover:bg-slate-900 shadow-sm'}
          `}
      >
          <div className="relative flex-1">
              <div className={`absolute left-3 top-3.5 transition-colors duration-300 ${isFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <Plus size={20} />
              </div>
              
              <div className="flex flex-col">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Enter bonds (e.g. 1234567 or 0000001-0000100)..."
                    className="w-full bg-transparent border-none p-0 pl-10 pr-8 py-3 text-base font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
                
                {/* Collapsible Help Text */}
                <div className={`
                  overflow-hidden transition-all duration-300 ease-in-out pl-10
                  ${isFocused ? 'max-h-20 opacity-100 pb-2 mt-1' : 'max-h-0 opacity-0'}
                `}>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                      Single: 1234567 (Exact 7 digits)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      Range: 0000001-0000100 (Exact 7 digits)
                    </span>
                  </div>
                </div>
              </div>

              {inputValue && (
                <button 
                  type="button"
                  onClick={() => { 
                    setInputValue(''); 
                    inputRef.current?.focus(); 
                  }}
                  className="absolute right-2 top-3 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
          </div>

          <button
              type="submit"
              disabled={!inputValue.trim()}
              className={`
                flex-none self-start h-[48px] rounded-xl font-medium shadow-lg transition-all duration-300 flex items-center justify-center
                ${inputValue.trim() 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 px-6 cursor-pointer active:scale-95' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 shadow-none px-4 cursor-not-allowed'}
              `}
          >
              <Save size={20} />
              {inputValue.trim() && <span className="ml-2 animate-in fade-in slide-in-from-left-2 hidden sm:inline">Save</span>}
          </button>
      </form>
    </div>
  );
};

interface BondListPanelProps {
  bonds: string[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleCopyAll: () => void;
  handleClearAll: () => void;
  handleCopy: (text: string) => void;
  handleDelete: (bond: string) => void;
}

const BondListPanel = ({ 
  bonds, 
  searchQuery, 
  setSearchQuery, 
  handleCopyAll, 
  handleClearAll, 
  handleCopy, 
  handleDelete 
}: BondListPanelProps) => {
  
  const filteredBonds = useMemo(() => {
    if (!searchQuery) return bonds;
    return bonds.filter(b => b.includes(searchQuery));
  }, [bonds, searchQuery]);

  return (
    <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-black/20 min-h-0 animate-in" style={{ animationDelay: '0.1s' }}>
      {/* List Header */}
      <div className="flex-none p-4 sm:p-5 border-b border-slate-200 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md z-10 space-y-4">
        
        {/* Stats Row */}
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

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stored bonds..."
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
};

const PrizeBondApp = () => {
  // State
  const [bonds, setBonds] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
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

    // Split by comma, space, or newline to be robust
    const segments = inputValue.split(/[,\s\n]+/).map(s => s.trim()).filter(Boolean);
    const validNewBonds = new Set<string>();
    const existingSet = new Set(bonds);
    
    let duplicates = 0;
    let rangeFormatErrors = 0; // x-y but wrong digits
    let rangeSizeErrors = 0; // > max
    let singleFormatErrors = 0; // not 7 digits

    const MAX_RANGE_SIZE = 50000;

    segments.forEach(segment => {
      // 1. Check for Range with STRICT 7 digits on both sides
      const rangeMatch = segment.match(/^(\d{7})\s*-\s*(\d{7})$/);
      
      if (rangeMatch) {
        const startStr = rangeMatch[1];
        const endStr = rangeMatch[2];
        let start = parseInt(startStr, 10);
        let end = parseInt(endStr, 10);

        // Allow inverted ranges (e.g. 0944699-0944683) by swapping them
        if (start > end) {
          [start, end] = [end, start];
        }

        if (end - start > MAX_RANGE_SIZE) { 
          rangeSizeErrors++;
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
      else if (segment.includes('-')) {
        // Range attempted but failed digit check (must be 7)
        rangeFormatErrors++;
      }
      else {
        // 2. Check for Single Bond with STRICT 7 digits
        if (/^\d{7}$/.test(segment)) {
          const bondStr = segment; // Already 7 digits
          if (existingSet.has(bondStr) || validNewBonds.has(bondStr)) {
            duplicates++;
          } else {
            validNewBonds.add(bondStr);
          }
        } 
        else {
          singleFormatErrors++;
        }
      }
    });

    if (validNewBonds.size > 0) {
      setBonds(prev => [...Array.from(validNewBonds).reverse(), ...prev]);
      setInputValue('');
      
      let message = `Added ${validNewBonds.size} bond${validNewBonds.size > 1 ? 's' : ''}.`;
      if (duplicates > 0) message += ` ${duplicates} duplicate${duplicates > 1 ? 's' : ''} skipped.`;
      
      showNotification('success', message);
    } else {
      const parts = [];
      const hasFormatErrors = rangeSizeErrors > 0 || rangeFormatErrors > 0 || singleFormatErrors > 0;
      
      if (duplicates > 0) {
          // If only duplicates found and no formatting errors, clear the input
          if (!hasFormatErrors) {
              setInputValue('');
              showNotification('warning', `Duplicate bond${duplicates > 1 ? 's' : ''} found.`);
              return;
          }
          parts.push(`${duplicates} duplicate${duplicates > 1 ? 's' : ''}`);
      }
      
      if (rangeSizeErrors > 0) parts.push(`${rangeSizeErrors} ranges too large (max ${MAX_RANGE_SIZE})`);
      if (rangeFormatErrors > 0) parts.push(`${rangeFormatErrors} ranges with invalid digits (must be 7)`);
      if (singleFormatErrors > 0) parts.push(`${singleFormatErrors} invalid number${singleFormatErrors > 1 ? 's' : ''} (must be 7 digits)`);
      
      if (parts.length > 0) {
        showNotification('warning', `Issue${parts.length > 1 ? 's' : ''}: ${parts.join(', ')}.`);
      } else {
        showNotification('error', 'No valid bonds found.');
      }
    }
  };

  const handleDelete = (bondToDelete: string) => {
    setBonds(prev => prev.filter(b => b !== bondToDelete));
    showNotification('success', `Bond ${bondToDelete} deleted.`);
  };
  
  const handleClearAllClick = () => {
    if (bonds.length === 0) return;
    setIsClearDialogOpen(true);
  };

  const confirmClearAll = () => {
    setBonds([]);
    showNotification('success', 'Database cleared successfully.');
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('success', `Copied ${text}`);
    } catch (err) {
      showNotification('error', 'Failed to copy');
    }
  };

  const filteredBondsForCopy = useMemo(() => {
    if (!searchQuery) return bonds;
    return bonds.filter(b => b.includes(searchQuery));
  }, [bonds, searchQuery]);

  const handleCopyAll = async () => {
    if (filteredBondsForCopy.length === 0) {
      showNotification('warning', 'No bonds to copy.');
      return;
    }
    
    try {
      const text = filteredBondsForCopy.join(', ');
      await navigator.clipboard.writeText(text);
      showNotification('success', `Copied ${filteredBondsForCopy.length} bonds.`);
    } catch (err) {
      showNotification('error', 'Failed to copy');
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col font-sans selection:bg-indigo-500/30 overflow-hidden">
      <NotificationToast notifications={notifications} removeNotification={removeNotification} />
      <ConfirmationModal 
        isOpen={isClearDialogOpen} 
        onClose={() => setIsClearDialogOpen(false)} 
        onConfirm={confirmClearAll} 
        count={bonds.length} 
      />
      
      {/* Header */}
      <header className="flex-none pt-4 pb-2 px-4 sm:px-6 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Database className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none transition-colors">Bond Manager</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5 transition-colors">Secure Storage</p>
            </div>
          </div>
          
          {/* Theme Toggle - REMOVED */}
        </div>
      </header>

      {/* Main Content - Unified Column Layout */}
      <main className="flex-1 flex flex-col overflow-hidden w-full max-w-5xl mx-auto p-4 sm:p-6">
        <AddBondsPanel 
          inputValue={inputValue} 
          setInputValue={setInputValue} 
          onSave={handleProcessInput} 
        />
        <BondListPanel 
          bonds={bonds}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleCopyAll={handleCopyAll}
          handleClearAll={handleClearAllClick}
          handleCopy={handleCopy}
          handleDelete={handleDelete}
        />
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PrizeBondApp />);
}