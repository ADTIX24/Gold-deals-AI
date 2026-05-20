import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCcw, Send, LayoutDashboard, 
  LineChart, Cpu, Settings, Globe, LogIn, ChevronRight, 
  Activity, Zap, Instagram, Youtube, Twitter, MessageCircle, 
  Ghost, User, Layout, Users, Wallet, LogOut, Info, ArrowUpRight,
  PieChart, Shield, Newspaper
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from './lib/utils';
import { 
  onSnapshot, doc, collection, 
  updateDoc, query, orderBy, limit,
  setDoc, getDoc,
  increment,
  runTransaction,
  addDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  onAuthStateChanged, signInWithPopup, 
  GoogleAuthProvider, signOut
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { generateAISignal, AISignal } from './services/aiTradingService';
import { Plus, Trash2, Cpu as AiIcon, BrainCircuit, Sparkles, Target, Zap as FastIcon, AlertCircle, Clock } from 'lucide-react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


// --- TradingView Widget ---
const TradingViewWidget = () => {
  const container = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "lineWidth": 2,
        "lineType": 0,
        "chartType": "area",
        "fontColor": "rgb(106, 109, 120)",
        "gridLineColor": "rgba(242, 242, 242, 0.06)",
        "volumeUpColor": "rgba(34, 171, 148, 0.5)",
        "volumeDownColor": "rgba(247, 82, 95, 0.5)",
        "backgroundColor": "#0F0F0F",
        "widgetFontColor": "#DBDBDB",
        "upColor": "#22ab94",
        "downColor": "#f7525f",
        "borderUpColor": "#22ab94",
        "borderDownColor": "#f7525f",
        "wickUpColor": "#22ab94",
        "wickDownColor": "#f7525f",
        "colorTheme": "dark",
        "isTransparent": true,
        "locale": "en",
        "chartOnly": false,
        "scalePosition": "right",
        "scaleMode": "Normal",
        "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
        "valuesTracking": "1",
        "changeMode": "price-and-percent",
        "symbols": [["OANDA:XAUUSD|1D"]],
        "dateRanges": ["1d|1"],
        "fontSize": "10",
        "headerFontSize": "medium",
        "autosize": true,
        "width": "100%",
        "height": "100%",
        "noTimeScale": false,
        "hideDateRanges": false,
        "hideMarketStatus": false,
        "hideSymbolLogo": false
      });
      container.current.appendChild(script);
    }
  }, []);

  return (
    <div className="relative w-full h-[350px] md:h-[500px] bg-slate-950/50 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      <div className="tradingview-widget-container w-full h-full" ref={container}>
        <div className="tradingview-widget-container__widget h-full"></div>
      </div>
    </div>
  );
};

// --- Signal Card Component ---
const SignalCard = ({ signal, userProfile, isLocked, onUnlock }: any) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const isSwing = signal.category === 'swing';
  const timestamp = signal.createdAt?.toDate ? signal.createdAt.toDate() : new Date();

  return (
    <motion.div 
      whileHover={isLocked ? {} : { y: -5 }}
      onClick={() => isLocked && onUnlock(signal.id)}
      className={cn(
        "rounded-2xl p-4 md:p-6 border relative overflow-hidden bg-white/5 backdrop-blur-md transition-all duration-500",
        isSwing ? "border-amber-500/20" : "border-cyan-500/20",
        isLocked ? "cursor-pointer hover:bg-white/10" : ""
      )}
    >
      <div className={cn(
        "absolute top-0 right-0 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg flex items-center space-x-2 rtl:space-x-reverse",
        isSwing ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"
      )}>
        <span>{t(signal.category || 'scalping')}</span>
        <span className="opacity-50 text-[8px] border-l border-white/20 pl-2 rtl:border-l-0 rtl:border-r rtl:pl-0 rtl:pr-2">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="flex items-center space-x-3 mb-4 rtl:space-x-reverse">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-slate-900",
          isSwing ? "bg-amber-400 shadow-lg shadow-amber-400/20" : "bg-cyan-400 shadow-lg shadow-cyan-400/20"
        )}>
          {isSwing ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-widest">{signal.pair} {isSwing ? 'SELL' : 'BUY'}</div>
          <div className="text-[9px] text-slate-400 uppercase font-mono">{isSwing ? 'H4' : 'M5'} Timeframe</div>
        </div>
      </div>

      <div className={cn("grid grid-cols-2 gap-4 relative", isLocked ? "filter blur-md select-none pointer-events-none" : "")}>
        <div>
          <div className="text-[9px] text-slate-500 uppercase font-bold">Entry</div>
          <div className="text-base md:text-xl font-mono font-bold text-white">{(signal.entry || 0).toLocaleString()}</div>
        </div>
        <div className="text-right rtl:text-left">
          <div className="text-[9px] text-slate-500 uppercase font-bold">SL</div>
          <div className="text-base md:text-xl font-mono font-bold text-red-400">{(signal.sl || 0).toLocaleString()}</div>
        </div>
        <div className="col-span-2 pt-3 border-t border-white/5">
          <div className="text-[9px] text-slate-500 uppercase font-bold">Take Profit</div>
          <div className={cn(
            "text-base md:text-xl font-mono font-bold",
            isSwing ? "text-amber-400" : "text-green-400"
          )}>
            {(signal.tp || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {signal.notes && !isLocked && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 tracking-widest">{isRtl ? 'ملاحظات' : 'Notes'}</div>
          <p className="text-[10px] text-slate-300 leading-relaxed italic">"{signal.notes}"</p>
        </div>
      )}

      {isLocked && (
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="p-3 bg-amber-400 text-slate-950 rounded-full shadow-2xl animate-bounce">
             <Shield size={20} fill="currentColor" />
          </div>
          <div className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] bg-slate-950/80 px-3 py-1 rounded-full backdrop-blur-md border border-amber-400/30">
            {isRtl ? 'اضغط لفتح الصفقة (1 رصيد)' : 'Tap to unlock (1 Credit)'}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard = () => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [clients, setClients] = useState<any[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>({
    logoUrl: '',
    telegramUrl: '',
    instagramUrl: '',
    snapchatUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
    supportUrl: 'https://t.me/golddealsai',
    supportMessage: '',
    supportUrl2: '',
    showSupport2: false
  });

  useEffect(() => {
    // Sort by createdAt desc to show newest registrations first
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribeClients = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    const unsubscribeConfig = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) setSiteConfig(doc.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/general'));

    return () => {
      unsubscribeClients();
      unsubscribeConfig();
    };
  }, []);

  const addCredit = async (id: string, amount: number) => {
    if (!amount || amount <= 0) return;
    try {
      await updateDoc(doc(db, 'users', id), {
        credits: increment(amount)
      });
      alert(isRtl ? `تم إضافة ${amount} رصيد بنجاح!` : `Successfully added ${amount} credits!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${id}`);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), { [key]: value }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/general');
    }
  };

  const [newSignal, setNewSignal] = useState({
    pair: 'XAU/USD',
    type: 'buy',
    category: 'scalping',
    entry: '',
    tp: '',
    sl: '',
    timeframe: 'M5',
    notes: ''
  });

  const [signals, setSignals] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'signals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSignals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'signals'));
    return () => unsubscribe();
  }, []);

  const createSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'signals'), {
        ...newSignal,
        entry: parseFloat(newSignal.entry),
        tp: parseFloat(newSignal.tp),
        sl: parseFloat(newSignal.sl),
        status: 'active',
        createdAt: serverTimestamp()
      });
      setNewSignal({ ...newSignal, entry: '', tp: '', sl: '', notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'signals');
    }
  };

  const deleteSignal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'signals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `signals/${id}`);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">{isRtl ? 'لوحة تحكم المسؤول' : 'Admin Control Panel'}</h2>
          <p className="text-slate-500 text-sm">{isRtl ? 'إدارة العملاء والإعدادات العامة والإشارات' : 'Manage clients, signals and general settings'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Create Signal Form */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5 p-6 space-y-6">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Plus size={18} className="text-green-400" />
              <span>{isRtl ? 'إضافة إشارة تداول جديدة' : 'Add New Signal'}</span>
            </h3>
            <form onSubmit={createSignal} className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Pair</label>
                <input value={newSignal.pair} onChange={e => setNewSignal({...newSignal, pair: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Type</label>
                <select value={newSignal.type} onChange={e => setNewSignal({...newSignal, type: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <option value="buy">BUY</option>
                  <option value="sell">SELL</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Category</label>
                <select value={newSignal.category} onChange={e => setNewSignal({...newSignal, category: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm">
                  <option value="scalping">Scalping</option>
                  <option value="swing">Swing</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Entry</label>
                <input type="number" step="0.01" value={newSignal.entry} onChange={e => setNewSignal({...newSignal, entry: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="2300.00" required />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">TP</label>
                <input type="number" step="0.01" value={newSignal.tp} onChange={e => setNewSignal({...newSignal, tp: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="2310.00" required />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">SL</label>
                <input type="number" step="0.01" value={newSignal.sl} onChange={e => setNewSignal({...newSignal, sl: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="2290.00" required />
              </div>
              <div className="col-span-2 md:col-span-3">
                <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                <input 
                  value={newSignal.notes} 
                  onChange={e => setNewSignal({...newSignal, notes: e.target.value})} 
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm" 
                  placeholder={isRtl ? 'أضف ملاحظات إضافية هنا...' : 'Add extra notes here...'} 
                />
              </div>
              <button type="submit" className="self-end bg-green-500 text-slate-950 font-bold py-2 rounded-lg hover:bg-green-400 transition-colors">
                {isRtl ? 'نشر' : 'Post'}
              </button>
            </form>
          </div>

          {/* Active Signals List */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <Activity size={18} className="text-red-400" />
                <span>{isRtl ? 'الإشارات المنشورة' : 'Current Active Signals'}</span>
              </h3>
            </div>
            <div className="divide-y divide-white/5 overflow-hidden">
              {signals.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">No signals posted yet.</div>}
              {signals.map(signal => (
                <div key={signal.id} className="px-6 py-4 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className={cn("w-2 h-10 rounded-full", signal.type === 'buy' ? "bg-green-500" : "bg-red-500")} />
                    <div>
                      <div className="text-sm font-bold text-white uppercase">{signal.pair} <span className={signal.type === 'buy' ? "text-green-400" : "text-red-400"}>{signal.type}</span></div>
                      <div className="text-[10px] text-slate-500 font-mono">Entry: {signal.entry} | TP: {signal.tp} | SL: {signal.sl}</div>
                      {signal.notes && <div className="text-[9px] text-amber-400/70 italic mt-0.5">{isRtl ? 'ملاحظة: ' : 'Note: '}{signal.notes}</div>}
                    </div>
                  </div>
                  <button onClick={() => deleteSignal(signal.id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <Users size={18} className="text-amber-400" />
                <span>{isRtl ? 'قائمة العملاء' : 'Client Directory'}</span>
              </h3>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold uppercase">{clients.length} Total</span>
            </div>
            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
              {clients.map(client => (
                <UserListRow 
                  key={client.id} 
                  client={client} 
                  isRtl={isRtl} 
                  onAddCredit={addCredit} 
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/5 space-y-6">
            <h3 className="font-bold text-white flex items-center space-x-2">
              <Settings size={18} className="text-cyan-400" />
              <span>{isRtl ? 'إعدادات الموقع' : 'Site Settings'}</span>
            </h3>

            <div className="space-y-6">
               {/* Market Status & Analysis Section */}
               <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'حالة السوق والتحليل' : 'Market Status & Analysis'}</label>
                
                <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
                  <span className="text-xs text-white uppercase font-bold tracking-wider">{isRtl ? 'حالة السوق' : 'Market Status'}</span>
                  <div className="flex bg-slate-900 p-1 rounded-lg">
                    <button 
                      onClick={() => updateSetting('marketStatus', 'active')}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                        siteConfig.marketStatus === 'active' ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" : "text-slate-500 hover:text-white"
                      )}
                    >
                      {isRtl ? 'نشط' : 'Active'}
                    </button>
                    <button 
                      onClick={() => updateSetting('marketStatus', 'closed')}
                      className={cn(
                        "px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all",
                        siteConfig.marketStatus === 'closed' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-slate-500 hover:text-white"
                      )}
                    >
                      {isRtl ? 'مغلق' : 'Closed'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'تحليل السوق' : 'Market Analysis'}</label>
                  <textarea 
                    value={siteConfig.marketAnalysis || ''}
                    onChange={(e) => setSiteConfig({...siteConfig, marketAnalysis: e.target.value})}
                    onBlur={(e) => updateSetting('marketAnalysis', e.target.value)}
                    className="w-full h-32 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs md:text-sm focus:border-amber-400 outline-none transition-all placeholder:text-slate-700 font-serif italic"
                    placeholder={isRtl ? 'اكتب تحليلك الفني للسوق هنا...' : 'Write your technical market analysis here...'}
                  />
                  <p className="text-[9px] text-slate-500 italic px-1">{isRtl ? '* سيظهر هذا التحليل للمستخدمين عند النقر على زر "تحليل السوق"' : '* This analysis will appear to users when they click "Market Analysis"'}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'أهم أخبار الأسبوع' : 'Weekly News'}</label>
                  <textarea 
                    value={siteConfig.weeklyNews || ''}
                    onChange={(e) => setSiteConfig({...siteConfig, weeklyNews: e.target.value})}
                    onBlur={(e) => updateSetting('weeklyNews', e.target.value)}
                    className="w-full h-32 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs md:text-sm focus:border-amber-400 outline-none transition-all placeholder:text-slate-700"
                    placeholder={isRtl ? 'أدخل أهم أخبار الأسبوع هنا...' : 'Enter the most important weekly news here...'}
                  />
                  <p className="text-[9px] text-slate-500 italic px-1">{isRtl ? '* ستظهر هذه الأخبار في الصفحة الرئيسية مكان Pivot Point و RSI' : '* This news will appear on the home page instead of Pivot Point and RSI'}</p>
                </div>
              </div>

              {/* Logo Section */}
              <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'شعار الموقع' : 'Site Logo'}</label>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-16 h-16 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    {siteConfig.logoUrl ? (
                      <img src={siteConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <FastIcon size={24} className="text-slate-700" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input 
                      type="file" 
                      id="logo-input"
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => updateSetting('logoUrl', ev.target?.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <label 
                      htmlFor="logo-input" 
                      className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all active:scale-95 uppercase tracking-widest"
                    >
                      {isRtl ? 'رفع شعار' : 'Upload Logo'}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'إعدادات التواصل مع الدعم' : 'Support Contact Settings'}</label>
                  <div className="space-y-4">
                    <SettingInput 
                      label={isRtl ? 'رابط الدعم الأساسي' : 'Primary Support Link'} 
                      value={siteConfig.supportUrl} 
                      onChange={(v) => updateSetting('supportUrl', v)} 
                    />

                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'رسالة الدعم' : 'Support Message'}</label>
                      <textarea 
                        value={siteConfig.supportMessage || ''}
                        onChange={(e) => setSiteConfig({...siteConfig, supportMessage: e.target.value})}
                        onBlur={(e) => updateSetting('supportMessage', e.target.value)}
                        className="w-full h-24 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs md:text-sm focus:border-amber-400 outline-none transition-all placeholder:text-slate-700"
                        placeholder={isRtl ? 'مثال: لشراء المزيد من الرصيد والوصول إلى الإشارات الحية...' : 'Example: To purchase more credits and access live signals...'}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                      <span className="text-[11px] text-white font-bold">{isRtl ? 'إظهار زر دعم إضافي' : 'Show Secondary Support Button'}</span>
                      <button 
                        onClick={() => updateSetting('showSupport2', !siteConfig.showSupport2)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-all relative",
                          siteConfig.showSupport2 ? "bg-amber-400" : "bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                          siteConfig.showSupport2 ? (isRtl ? "left-1" : "right-1") : (isRtl ? "right-1" : "left-1")
                        )} />
                      </button>
                    </div>

                    {siteConfig.showSupport2 && (
                      <SettingInput 
                        label={isRtl ? 'رابط الدعم الإضافي' : 'Secondary Support Link'} 
                        value={siteConfig.supportUrl2} 
                        onChange={(v) => updateSetting('supportUrl2', v)} 
                      />
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'روابط وسائل التواصل الاجتماعي' : 'Social Media Links'}</label>
                  <div className="space-y-2">
                    <SettingInput label="Telegram" value={siteConfig.telegramUrl} onChange={(v) => updateSetting('telegramUrl', v)} />
                    <SettingInput label="Instagram" value={siteConfig.instagramUrl} onChange={(v) => updateSetting('instagramUrl', v)} />
                    <SettingInput label="Snapchat" value={siteConfig.snapchatUrl} onChange={(v) => updateSetting('snapchatUrl', v)} />
                    <SettingInput label="TikTok" value={siteConfig.tiktokUrl} onChange={(v) => updateSetting('tiktokUrl', v)} />
                    <SettingInput label="YouTube" value={siteConfig.youtubeUrl} onChange={(v) => updateSetting('youtubeUrl', v)} />
                  </div>
                </div>
                
                <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/5 space-y-4">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block">{isRtl ? 'حقوق النشر في التذييل' : 'Footer Copyright'}</label>
                  <div className="space-y-3">
                    <textarea 
                      value={siteConfig.footerCopyright || ''}
                      onChange={(e) => setSiteConfig({...siteConfig, footerCopyright: e.target.value})}
                      onBlur={(e) => updateSetting('footerCopyright', e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-xs md:text-sm focus:border-amber-400 outline-none transition-all placeholder:text-slate-700 font-mono" 
                      placeholder={isRtl ? 'مثال: .GOLD DEALS AI. ALL RIGHTS RESERVED 2026 ©' : 'Example: .GOLD DEALS AI. ALL RIGHTS RESERVED 2026 ©'}
                    />
                    <div className="p-3 bg-slate-950 rounded-lg border border-white/5">
                      <div className="text-[8px] text-slate-600 uppercase font-black mb-2">{isRtl ? 'معاينة التذييل' : 'Footer Preview'}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-black tracking-[0.2em] uppercase text-center whitespace-pre-wrap">
                        {siteConfig.footerCopyright || `.GOLD DEALS AI. ALL RIGHTS RESERVED ${new Date().getFullYear()} ©`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4 text-center">
                <button 
                  onClick={() => alert(isRtl ? 'تم الحفظ بنجاح!' : 'Settings Saved!')}
                  className="w-full py-3 bg-green-500 text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] rounded-xl shadow-lg hover:shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <h4 className="text-[10px] text-white font-black uppercase tracking-[0.2em]">{isRtl ? 'روابط التذييل' : 'Footer Links'}</h4>
                {(siteConfig.footerLinks || []).map((link: any, index: number) => (
                  <div key={index} className="space-y-3 bg-slate-900/30 p-4 rounded-xl border border-white/5 group relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        placeholder="Label (EN)" 
                        defaultValue={link.labelEn}
                        onBlur={(e) => {
                          const newLinks = [...(siteConfig.footerLinks || [])];
                          newLinks[index].labelEn = e.target.value;
                          updateSetting('footerLinks', newLinks);
                        }}
                        className="bg-transparent text-xs border-b border-white/5 focus:border-amber-400 outline-none pb-1"
                      />
                      <input 
                        placeholder="Label (AR)" 
                        defaultValue={link.labelAr}
                        onBlur={(e) => {
                          const newLinks = [...(siteConfig.footerLinks || [])];
                          newLinks[index].labelAr = e.target.value;
                          updateSetting('footerLinks', newLinks);
                        }}
                        className="bg-transparent text-xs border-b border-white/5 focus:border-amber-400 outline-none pb-1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isRtl ? 'رابط خارجي (اختياري)' : 'External URL (Optional)'}</label>
                       <input 
                        placeholder="https://..." 
                        defaultValue={link.url}
                        onBlur={(e) => {
                          const newLinks = [...(siteConfig.footerLinks || [])];
                          newLinks[index].url = e.target.value;
                          updateSetting('footerLinks', newLinks);
                        }}
                        className="w-full bg-slate-950/50 text-xs border border-white/5 rounded-lg px-3 py-1.5 focus:border-amber-400 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Page Content (EN)</label>
                         <textarea 
                           placeholder="Write page content here..." 
                           defaultValue={link.contentEn}
                           onBlur={(e) => {
                             const newLinks = [...(siteConfig.footerLinks || [])];
                             newLinks[index].contentEn = e.target.value;
                             updateSetting('footerLinks', newLinks);
                           }}
                           className="w-full h-24 bg-slate-950/50 text-[10px] border border-white/5 rounded-lg px-3 py-2 focus:border-amber-400 outline-none resize-none font-mono"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">محتوى الصفحة (AR)</label>
                         <textarea 
                           placeholder="اكتب محتوى الصفحة هنا..." 
                           defaultValue={link.contentAr}
                           onBlur={(e) => {
                             const newLinks = [...(siteConfig.footerLinks || [])];
                             newLinks[index].contentAr = e.target.value;
                             updateSetting('footerLinks', newLinks);
                           }}
                           className="w-full h-24 bg-slate-950/50 text-[10px] border border-white/5 rounded-lg px-3 py-2 focus:border-amber-400 outline-none resize-none font-mono"
                         />
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        const newLinks = (siteConfig.footerLinks || []).filter((_: any, i: number) => i !== index);
                        updateSetting('footerLinks', newLinks);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newLinks = [...(siteConfig.footerLinks || []), { labelEn: 'New Page', labelAr: 'صفحة جديدة', url: '#' }];
                    updateSetting('footerLinks', newLinks);
                  }}
                  className="w-full py-2 border-2 border-dashed border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-400/30 hover:text-amber-400 transition-all"
                >
                  {isRtl ? 'إضافة رابط جديد' : 'Add New Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserListRow = ({ client, isRtl, onAddCredit }: any) => {
  const [amount, setAmount] = useState<string>('10');
  
  return (
    <div key={client.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between hover:bg-white/5 transition-colors group gap-4">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-white/10 group-hover:border-amber-400/50 transition-colors text-xs shrink-0">
          {client.name?.charAt(0) || "U"}
        </div>
        <div>
          <p className="text-sm font-bold text-white">{client.name}</p>
          <p className="text-xs text-slate-500">{client.email}</p>
          <p className="text-[8px] text-slate-600 font-mono mt-0.5">
            Joined: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Unknown'}
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-x-6 gap-y-3">
        <div className="text-right">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{isRtl ? 'الرصيد الحالي' : 'Balance'}</p>
          <p className="text-sm font-mono font-bold text-amber-400">{client.credits || 0}</p>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="relative">
            <input 
              type="number" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-20 bg-slate-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-amber-400 outline-none transition-all pr-8 rtl:pr-2 rtl:pl-8" 
              placeholder="0"
            />
            <Zap size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rtl:right-auto rtl:left-2.5" />
          </div>
          
          <button 
            onClick={() => onAddCredit(client.id, parseInt(amount))}
            className="flex items-center space-x-1.5 rtl:space-x-reverse bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap"
          >
            <Plus size={14} />
            <span>{isRtl ? 'إضافة' : 'Add'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingInput = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div>
    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">{label}</label>
    <input 
      type="text" 
      defaultValue={value}
      onBlur={(e) => onChange(e.target.value)}
      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-amber-400 outline-none transition-all placeholder:text-slate-700" 
      placeholder="https://..." 
    />
  </div>
);

// --- User Wallet Component ---
const UserWallet = ({ profile, siteSettings, setCurrentView }: { profile: any, siteSettings: any, setCurrentView: (v: any) => void }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  if (!profile) return null;

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-3xl font-bold text-amber-400 border-2 border-amber-400/20 shadow-2xl">
          {profile.name?.charAt(0)}
        </div>
        <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
        <p className="text-slate-500">{profile.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-3xl border-white/5 space-y-4 flex flex-col items-center text-center">
          <div className="p-4 bg-amber-400/10 rounded-2xl text-amber-400">
            <Wallet size={32} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">{isRtl ? 'الرصيد الحالي' : 'Current Balance'}</p>
            <p className="text-4xl font-mono font-bold text-amber-400">{profile.credits || 0}</p>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border-white/5 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">{isRtl ? 'شحن الرصيد' : 'Buy Credits'}</h3>
            <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">
              {siteSettings.supportMessage || (isRtl ? 'لشراء المزيد من الرصيد والوصول إلى الإشارات الحية، يرجى التواصل مع الدعم الفني على تيليجرام.' : 'To purchase more credits and access live signals, please contact technical support on Telegram.')}
            </p>
          </div>
          <div className="space-y-3">
            <a 
              href={siteSettings.supportUrl || "https://t.me/golddealsai"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-amber-400 rounded-2xl text-slate-950 font-bold text-center shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <MessageCircle size={20} />
              <span>{isRtl ? 'تواصل مع الدعم' : 'Contact Support'}</span>
            </a>

            {siteSettings.showSupport2 && siteSettings.supportUrl2 && (
              <a 
                href={siteSettings.supportUrl2}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-center hover:bg-white/20 transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle size={20} />
                <span>{isRtl ? 'دعم فني إضافي' : 'Secondary Support'}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border-white/5">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">{isRtl ? 'معلومات الحساب' : 'Account Details'}</h4>
        <div className="space-y-3">
          {profile.isAdmin && (
            <button 
              onClick={() => setCurrentView('admin')}
              className="w-full mb-4 py-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-400 font-bold flex items-center justify-center space-x-3 hover:bg-amber-400/20 transition-all"
            >
              <Shield size={20} />
              <span>{isRtl ? 'لوحة تحكم المسؤول' : 'Admin Control Panel'}</span>
            </button>
          )}
          <div className="flex justify-between text-sm py-2 border-b border-white/5">
            <span className="text-slate-500">{isRtl ? 'تاريخ التسجيل' : 'Member Since'}</span>
            <span className="text-white font-mono">{new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm py-2">
            <span className="text-slate-500">{isRtl ? 'الحالة' : 'Status'}</span>
            <span className={cn("font-bold px-2 py-0.5 rounded text-[10px] uppercase", profile.isAdmin ? "bg-amber-400 text-slate-950" : "bg-cyan-500/20 text-cyan-400")}>
              {profile.isAdmin ? (isRtl ? 'مسؤول' : 'Admin') : (isRtl ? 'عميل نشط' : 'Active Client')}
            </span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => signOut(auth)}
        className="w-full py-4 rounded-2xl border border-red-500/20 text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center justify-center space-x-2"
      >
        <LogOut size={20} />
        <span>{isRtl ? 'تسجيل الخروج' : 'Logout Account'}</span>
      </button>
    </div>
  );
};

// --- Market Analysis Section Component ---
const MarketAnalysisSection = ({ siteSettings, isRtl }: { siteSettings: any, isRtl: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full py-4 px-6 rounded-xl border flex items-center justify-between transition-all group",
          isOpen 
            ? "bg-amber-400 border-amber-400 text-slate-950 shadow-lg shadow-amber-400/20" 
            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-amber-400/30 hover:text-amber-400"
        )}
      >
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <BrainCircuit size={20} className={cn(isOpen ? "text-slate-950" : "text-amber-400")} />
          <span className="text-sm font-bold uppercase tracking-wider">{isRtl ? 'تحليل السوق' : 'Market Analysis'}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight size={18} className={cn("rotate-90", isOpen ? "text-slate-950" : "text-slate-600")} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 rounded-2xl bg-slate-900/50 border border-amber-400/20 relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BrainCircuit size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
                  <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {isRtl ? 'نظرة المحلل الفنية' : 'Technical Analyst Insight'}
                  </h4>
                </div>
                <div className="text-sm md:text-base text-slate-300 leading-[1.8] italic font-serif whitespace-pre-wrap">
                  {siteSettings.marketAnalysis || (isRtl ? 'بانتظار تحليل السوق الجديد من قبل المسؤول...' : 'Waiting for new market analysis from the admin...')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- AI Analyst Component ---
const AIAnalyst = ({ userProfile, isRtl }: any) => {
  const [loading, setLoading] = useState(false);
  const [signal, setSignal] = useState<AISignal | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0); // Seconds since last generate
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  useEffect(() => {
    setHistory([]); // Reset history when user changes
    if (!userProfile?.uid) return;
    
    const historyRef = collection(db, 'users', userProfile.uid, 'ai_history');
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(docs);
    }, (error) => {
      // Only handle error if we are still on this page
      if (userProfile?.uid) {
        handleFirestoreError(error, OperationType.GET, `users/${userProfile.uid}/ai_history`);
      }
    });
    
    return () => unsubscribe();
  }, [userProfile?.uid]);

  useEffect(() => {
    let interval: any;
    if (isCooldownActive) {
      interval = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev >= 900) { // 15 minutes = 900 seconds
            setIsCooldownActive(false);
            return 900;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCooldownActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch('https://api.gold-api.com/price/XAU');
      const data = await response.json();
      return data.price || 2350.50; // Fallback
    } catch {
      return 2350.50; // Generic realistic gold price
    }
  };

  const handleGenerate = async () => {
    if (!userProfile) return;
    
    // Check credits for everyone now as requested
    if (userProfile.credits < 1) {
      setError(isRtl ? 'رصيد غير كافٍ. يرجى الشحن أولاً.' : 'Insufficient credits. Please top up first.');
      return;
    }

    if (isCooldownActive && cooldownTime < 900) return;

    setLoading(true);
    setError(null);
    try {
      const currentPrice = await fetchGoldPrice();
      const newSignal = await generateAISignal(isRtl, currentPrice);
      
      // Save to history
      const historyRef = collection(db, 'users', userProfile.uid, 'ai_history');
      await addDoc(historyRef, {
        ...newSignal,
        userId: userProfile.uid,
        timestamp: serverTimestamp()
      });

      // Deduct 1 credit for EVERYONE (including admin) as requested
      await updateDoc(doc(db, 'users', userProfile.uid), {
        credits: increment(-1)
      });
      
      setSignal(newSignal);
      setCooldownTime(0);
      setIsCooldownActive(true);
    } catch (err) {
      console.error(err);
      setError(isRtl ? 'حدث خطأ أثناء التحليل. حاول مرة أخرى.' : 'Error during analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="text-center space-y-4">
        <div className="inline-flex p-4 bg-amber-400/10 rounded-3xl text-amber-400 mb-2 border border-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
          <BrainCircuit size={48} className={loading ? "animate-pulse" : ""} />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          {isRtl ? 'المحلل الذكي المؤسسي (ذهب فقط)' : 'Institutional AI Analyst (Gold Only)'}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto text-sm leading-relaxed">
          {isRtl 
            ? 'احصل على صفقات ذهب ذكية مبنية على أقوى استراتيجيات ICT. يتطلب التحليل الواحد 1 رصيد.' 
            : 'Get smart Gold trades based on powerful ICT strategies. Each analysis costs 1 credit.'}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="relative group">
          <button 
            onClick={handleGenerate}
            disabled={loading || (isCooldownActive && cooldownTime < 900)}
            className="relative group overflow-hidden px-10 py-5 bg-amber-400 rounded-2xl text-slate-950 font-black text-xl shadow-[0_0_40px_rgba(251,191,36,0.2)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center space-x-3"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <div className="relative flex items-center space-x-3 rtl:space-x-reverse">
              {loading ? <RefreshCcw size={26} className="animate-spin" /> : <Sparkles size={26} />}
              <span>{loading ? (isRtl ? 'جاري التحليل...' : 'Analyzing...') : (isRtl ? 'اعطني صفقة' : 'Give Me Trade')}</span>
            </div>
          </button>
        </div>

        {isCooldownActive && (
          <div className="flex flex-col items-center space-y-2">
            <div className="text-red-500 text-xs font-bold animate-pulse text-center max-w-sm">
              {isRtl 
                ? 'تنبيه: يفضل الضغط مرة أخرى بعد 15 دقيقة للحصول على صفقة صحيحة على السعر الجديد.' 
                : 'Warning: It is recommended to click again after 15 minutes to get an accurate trade on the new price.'}
            </div>
          </div>
        )}
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mx-auto max-w-md justify-center"
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {isCooldownActive && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-8 bg-slate-900/80 backdrop-blur-2xl border-2 border-amber-400/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-w-sm mx-auto relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(cooldownTime / 900) * 100}%` }}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
              />
            </div>
            
            <div className="bg-amber-400/5 p-3 rounded-2xl mb-4 border border-amber-400/10">
              <Clock size={24} className="text-amber-400 animate-pulse" />
            </div>

            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-2">
              {isRtl ? 'توقيت التحليل المباشر' : 'Live Analysis Timer'}
            </p>
            
            <div className="text-6xl font-mono font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
              {formatTime(cooldownTime)}
            </div>

            <div className="mt-4 px-4 py-1.5 bg-amber-400/10 rounded-full border border-amber-400/20">
               <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                 {isRtl ? 'بانتظار السعر الجديد' : 'Waiting for New Price'}
               </span>
            </div>
          </motion.div>
        )}

        {signal && (
          <motion.div 
            key="signal-result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Signal Details */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 space-y-6 relative overflow-hidden group shadow-2xl">
              <div className={cn(
                "absolute top-0 right-0 px-8 py-3 text-sm font-black uppercase rounded-bl-3xl",
                signal.type === 'buy' ? "bg-green-500 text-slate-950 shadow-[0_0_30px_rgba(34,197,94,0.4)]" : "bg-red-500 text-white shadow-[0_0_30_rgba(239,68,68,0.4)]"
              )}>
                {signal.type} {signal.category}
              </div>

              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 flex items-center justify-center text-amber-400 border border-amber-400/20 shadow-inner">
                  <Target size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">{signal.pair}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.4em] font-bold">ICT Institutional Analysis</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 py-8 border-y border-white/5">
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isRtl ? 'الدخول' : 'Entry'}</p>
                  <p className="text-2xl font-mono font-black text-white">{signal.entry}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold uppercase text-center tracking-widest">{isRtl ? 'الهدف' : 'TP'}</p>
                  <p className="text-2xl font-mono font-black text-green-400 text-center">{signal.tp}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isRtl ? 'الخسارة' : 'SL'}</p>
                  <p className="text-2xl font-mono font-black text-red-500">{signal.sl}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 mb-1">
                  <AiIcon size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{isRtl ? 'الاستراتيجية المؤسسية' : 'Institutional Strategy'}</span>
                </div>
                <p className="text-base text-slate-300 font-medium leading-relaxed italic border-l-4 border-amber-400/40 pl-6 py-2 rtl:border-l-0 rtl:border-r-4 rtl:pl-0 rtl:pr-6">
                  {signal.strategyUsed}
                </p>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/5 p-8 space-y-6 shadow-2xl relative">
              <h3 className="text-xl font-bold text-white flex items-center space-x-3">
                <FastIcon size={24} className="text-amber-400" />
                <span>{isRtl ? 'تحليل المحلل الذكي' : 'AI Analytical Logic'}</span>
              </h3>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10 custom-scrollbar">
                <p className="text-sm md:text-base text-slate-400 leading-[1.8] whitespace-pre-wrap font-medium">
                  {signal.analysis}
                </p>
              </div>
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                  <span>AI Logic Accuracy</span>
                  <span className="text-amber-400">Institutional Grade</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-3 overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "98%" }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-xl font-black text-white flex items-center space-x-3">
             <Clock size={22} className="text-amber-400" />
             <span>{isRtl ? 'سجل التحليلات السابقة' : 'Previous Analysis History'}</span>
          </h3>
        </div>

        {history.length === 0 ? (
          <div className="p-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">
              {isRtl ? 'لا يوجد تاريخ صفقات بعد' : 'No trade history yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((record, i) => (
              <motion.div 
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSignal(record)}
                className="group p-5 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] uppercase shadow-lg",
                    record.type === 'buy' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  )}>
                    {record.type}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm tracking-tight">{record.pair}</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                      {record.timestamp?.toDate ? record.timestamp.toDate().toLocaleString() : 'Just now'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-black text-white">{record.entry}</p>
                  <div className="flex items-center space-x-2 text-[8px] font-bold uppercase tracking-tighter mt-1">
                    <span className="text-green-400">TP: {record.tp}</span>
                    <span className="text-red-400">SL: {record.sl}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {!signal && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <FeatureBadge icon={<Target size={18} />} label="No Repaint" />
          <FeatureBadge icon={<FastIcon size={18} />} label="0.2s Execution" />
          <FeatureBadge icon={<Shield size={18} />} label="Risk Verified" />
        </div>
      )}
    </div>
  );
};

const FeatureBadge = ({ icon, label }: { icon: any, label: string }) => (
  <div className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400">
    <span className="text-amber-400">{icon}</span>
    <span>{label}</span>
  </div>
);

// --- App Component ---
export default function App() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin' | 'wallet' | 'ai-analyst' | 'page-viewer'>('dashboard');
  const [activePageContent, setActivePageContent] = useState<{title: string, content: string}>({title: '', content: ''});
  const [userProfile, setUserProfile] = useState<any>(null);
  const [siteSettings, setSiteSettings] = useState<any>({});
  const [liveSignals, setLiveSignals] = useState<any[]>([]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous profile listener if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const isAdminEmail = user.email === 'veira1x1@gmail.com';

        try {
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (isAdminEmail && !data.isAdmin) {
              await updateDoc(userDocRef, { isAdmin: true });
            }
          } else {
            const newProfile = {
              name: user.displayName || 'User',
              email: user.email,
              credits: 0,
              isAdmin: isAdminEmail,
              createdAt: new Date().toISOString(),
              unlockedSignals: []
            };
            await setDoc(userDocRef, newProfile);
          }

          // Start fresh listener for profile
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile({ uid: user.uid, ...docSnap.data() });
            }
          }, (err) => {
            // Only report error if we are still supposed to be signed in
            if (auth.currentUser) {
              handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
            }
          });

        } catch (error) {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        }
      } else {
        setUserProfile(null);
        setCurrentView('dashboard');
      }
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'settings', 'general'), (doc) => {
      if (doc.exists()) setSiteSettings(doc.data());
    }, (err) => handleFirestoreError(err, OperationType.GET, 'settings/general'));

    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const q = query(
      collection(db, 'signals'), 
      orderBy('createdAt', 'desc')
    );
    
    // We'll filter clientside for precise 24h or use a composite index if available.
    // For simplicity and immediate effect without pre-defined indexes for range, 
    // we'll filter the results in the snapshot.
    const unsubscribeSignals = onSnapshot(q, (snapshot) => {
      const allSignals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const recentSignals = allSignals.filter((s: any) => {
        if (!s.createdAt) return true;
        return s.createdAt.toDate() > yesterday;
      });
      setLiveSignals(recentSignals);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'signals'));

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeConfig();
      unsubscribeSignals();
    };
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    // Add custom parameters to help with iframe issues
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error && error.code === 'auth/cancelled-popup-request') {
        console.warn("Login popup was closed before completion.");
      } else if (error && error.code === 'auth/internal-error') {
        const msg = isRtl 
          ? 'خطأ داخلي في تسجيل الدخول. يرجى تجربة فتح المتصفح في علامة تبويب جديدة أو التأكد من السماح بملفات تعريف الارتباط للطرف الثالث.' 
          : 'Internal Login Error. Please try opening the app in a new tab or ensure third-party cookies are enabled.';
        alert(msg);
        console.error("Internal Auth Error Details:", error);
      } else {
        console.error("Login Error:", error);
        alert(isRtl ? `خطأ في تسجيل الدخول: ${error.message}` : `Login Error: ${error.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  const unlockSignal = async (signalId: string) => {
    if (!userProfile) {
      handleLogin();
      return;
    }
    if (userProfile.credits < 1) {
      alert(isRtl ? 'رصيد غير كافٍ!' : 'Insufficient credits!');
      setCurrentView('wallet');
      return;
    }

    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        credits: increment(-1),
        unlockedSignals: Array.from(new Set([...(userProfile.unlockedSignals || []), signalId]))
      });
      alert(isRtl ? 'تم فتح الصفقة بنجاح!' : 'Signal unlocked successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${userProfile.uid}`);
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ar' : 'en');
  };

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRtl]);

  return (
    <div className={cn("flex flex-col min-h-screen selection:bg-cyan-500/30 selection:text-white bg-[#050505] text-slate-200", isRtl ? "font-sans-arabic" : "font-sans")}>
      
      {/* Header */}
      <nav className="h-16 md:h-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4 md:space-x-12 rtl:space-x-reverse">
          <div 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-4 md:gap-6 group cursor-pointer shrink-0"
          >
            {siteSettings.logoUrl ? (
              <img src={siteSettings.logoUrl} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain shrink-0" />
            ) : (
              <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.4)] group-hover:scale-110 transition-transform shrink-0">
                <FastIcon size={20} className="text-slate-950" fill="currentColor" />
              </div>
            )}
            <div className="hidden sm:block shrink-0">
              <h1 className="text-sm md:text-xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-sm">Gold deals AI</h1>
              <p className="text-[7px] md:text-[8px] text-amber-400/90 tracking-[0.25em] font-black uppercase leading-none mt-1.5 opacity-80">CORE ANALYTICS</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2 md:space-x-4">
            <NavItem 
              icon={<LayoutDashboard size={18} />} 
              label={isRtl ? 'الرئيسية' : 'Home'} 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')}
            />
            <NavItem 
              icon={<BrainCircuit size={18} />} 
              label={isRtl ? 'المحلل الذكي' : 'AI Analyst'} 
              active={currentView === 'ai-analyst'} 
              onClick={() => setCurrentView('ai-analyst')}
            />
            <NavItem 
              icon={<Wallet size={18} />} 
              label={isRtl ? 'المحفظة' : 'Wallet'} 
              active={currentView === 'wallet'} 
              onClick={() => setCurrentView('wallet')}
            />
            {userProfile?.isAdmin && (
              <NavItem 
                icon={<Shield size={18} className="text-amber-400" />} 
                label="" 
                active={currentView === 'admin'}
                onClick={() => setCurrentView('admin')}
              />
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-6">
          <button onClick={toggleLanguage} className="p-2 md:p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <Globe size={18} />
          </button>

          {userProfile ? (
            <div className="flex items-center space-x-2 md:space-x-4">
              <div 
                onClick={() => setCurrentView('wallet')}
                className="flex items-center space-x-2 md:space-x-4 bg-white/5 border border-white/10 rounded-xl p-1 pr-3 md:pr-4 cursor-pointer hover:bg-white/10 transition-colors group"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-colors">
                  <User size={18} />
                </div>
                <div className="text-right hidden xs:block">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">{isRtl ? 'مرحباً' : 'Welcome'}</p>
                  <p className="text-xs font-bold text-white truncate max-w-[80px]">{userProfile.name}</p>
                </div>
                <div className="flex items-center bg-amber-400/10 border border-amber-400/20 px-2 py-1.5 md:py-2 rounded-lg ml-2 rtl:mr-2 rtl:ml-0">
                   <Wallet size={14} className="text-amber-400 mr-2 rtl:ml-2 rtl:mr-0" />
                   <span className="text-xs font-mono font-bold text-amber-400 leading-none">{userProfile.credits}</span>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-400 rounded-xl text-slate-950 font-bold text-xs md:text-sm shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {isLoggingIn ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : <LogIn size={16} />}
              <span className="hidden xs:inline">{isRtl ? 'دخول' : 'Login'}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 overflow-x-hidden pb-24 md:pb-0">
        {currentView === 'dashboard' && (
          <main className="max-w-[1600px] mx-auto p-4 md:p-8 flex flex-col xl:flex-row gap-8">
            <div className="flex-1 space-y-6">
              <TradingViewWidget />
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <StatBox 
                    label={isRtl ? 'حالة السوق' : 'Market Status'} 
                    value={siteSettings.marketStatus === 'closed' ? (isRtl ? 'مغلق' : 'CLOSED') : (isRtl ? 'نشط' : 'ACTIVE')} 
                    color={siteSettings.marketStatus === 'closed' ? "text-red-500" : "text-cyan-400"} 
                  />
                  
                  <div className="md:col-span-2 bg-slate-900/50 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                      <Newspaper size={12} className="text-amber-400" />
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">{isRtl ? 'أهم الأخبار لهذا الأسبوع' : 'Weekly News'}</span>
                    </div>
                    <div className="text-[11px] md:text-xs text-slate-300 font-medium line-clamp-2 italic">
                      {siteSettings.weeklyNews || (isRtl ? 'لا توجد أخبار هامة حالياً...' : 'No important news at the moment...')}
                    </div>
                  </div>
                </div>

                {userProfile && (
                  <div className="pt-2">
                    <MarketAnalysisSection siteSettings={siteSettings} isRtl={isRtl} />
                  </div>
                )}
              </div>
            </div>

            <aside className="w-full xl:w-96 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
                  <Activity size={20} className="text-red-500" />
                  <span>{isRtl ? 'إشارات حية' : 'Live Signals'}</span>
                </h2>
                <div className="text-[10px] text-slate-500 font-mono animate-pulse uppercase tracking-[0.2em]">{isRtl ? 'تحديث مباشر' : 'Live Updating'}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4 text-left rtl:text-right">
                {liveSignals.length === 0 ? (
                  <div className="bg-white/5 p-8 rounded-xl text-center text-slate-500 text-xs italic border border-white/5">
                    {isRtl ? 'بانتظار إشارات المسؤول...' : 'Waiting for admin signals...'}
                  </div>
                ) : (
                  liveSignals.map(signal => (
                    <SignalCard 
                      key={signal.id}
                      signal={signal}
                      userProfile={userProfile}
                      isLocked={!userProfile?.isAdmin && !(userProfile?.unlockedSignals || []).includes(signal.id)}
                      onUnlock={unlockSignal}
                    />
                  ))
                )}
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-400 italic">Sentiment</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-1 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                  <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                </div>
              </div>
            </aside>
          </main>
        )}
        
        {currentView === 'admin' && <AdminDashboard />}
        
        {currentView === 'ai-analyst' && <AIAnalyst key={userProfile?.uid} userProfile={userProfile} isRtl={isRtl} />}
        {currentView === 'wallet' && <UserWallet profile={userProfile} siteSettings={siteSettings} setCurrentView={setCurrentView} />}
        {currentView === 'profile' && <UserWallet profile={userProfile} siteSettings={siteSettings} setCurrentView={setCurrentView} />}
        {currentView === 'page-viewer' && (
          <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <button 
              onClick={() => setCurrentView('dashboard')}
              className="px-6 py-2 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all flex items-center space-x-2 rtl:space-x-reverse"
            >
              <Info size={14} className="text-amber-400" />
              <span>{isRtl ? 'العودة' : 'Back'}</span>
            </button>
            <div className="bg-white/5 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 md:p-12">
              <h2 className="text-3xl font-black text-white mb-8 border-b border-white/5 pb-6">{activePageContent.title}</h2>
              <div className="text-slate-300 leading-[1.8] space-y-4 whitespace-pre-wrap text-sm md:text-base">
                {activePageContent.content}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-950/90 backdrop-blur-2xl border-t border-white/10 z-50 flex items-center justify-around px-2 pb-safe">
        <MobileNavItem 
          icon={<Wallet size={20} />} 
          label={isRtl ? 'المحفظة' : 'Wallet'} 
          active={currentView === 'wallet'} 
          onClick={() => userProfile ? setCurrentView('wallet') : handleLogin()} 
        />

        <MobileNavItem 
          icon={<BrainCircuit size={20} />} 
          label={isRtl ? 'المحلل' : 'AI Analysis'} 
          active={currentView === 'ai-analyst'} 
          onClick={() => setCurrentView('ai-analyst')} 
        />
        
        <div className="relative -top-3">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.2)] transition-all border-4 border-[#050505] active:scale-95",
              currentView === 'dashboard' ? "bg-amber-400 text-slate-950 scale-110" : "bg-white/5 text-slate-400 backdrop-blur-xl"
            )}
          >
            <LayoutDashboard size={28} />
          </button>
          <div className={cn(
            "text-[9px] font-black text-center mt-1.5 uppercase tracking-widest transition-colors",
            currentView === 'dashboard' ? "text-amber-400" : "text-slate-500"
          )}>
            {isRtl ? 'الرئيسية' : 'Home'}
          </div>
        </div>

        <MobileNavItem 
          icon={userProfile?.isAdmin ? <Shield size={20} className="text-amber-400" /> : <Shield size={20} />} 
          label={userProfile?.isAdmin ? "" : (isRtl ? 'الرصيد' : 'Credits')} 
          active={currentView === 'admin'} 
          onClick={() => userProfile?.isAdmin ? setCurrentView('admin') : setCurrentView('wallet')} 
        />

        <MobileNavItem 
          icon={<User size={20} />} 
          label={isRtl ? 'حسابي' : 'Account'} 
          active={currentView === 'profile'} 
          onClick={() => userProfile ? setCurrentView('profile') : handleLogin()} 
        />
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 flex flex-col items-center justify-center gap-10">
          
          {/* Top: Logo */}
          <div className="flex flex-col items-center text-center gap-6">
             <div className="flex items-center gap-8 md:gap-10 mb-2">
                {siteSettings.logoUrl ? (
                  <img src={siteSettings.logoUrl} alt="Logo" className="w-12 h-12 object-contain shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(251,191,36,0.3)] shrink-0">
                    <FastIcon size={24} />
                  </div>
                )}
                <div className="text-2xl font-black text-white uppercase tracking-tighter shrink-0">Gold deals AI</div>
             </div>
             <div className="text-[11px] text-slate-500 uppercase tracking-[0.4em] font-black opacity-60">Institutional Core Analytics</div>
          </div>

          {/* Middle: Links */}
          {(siteSettings.footerLinks || []).length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 max-w-2xl">
               {siteSettings.footerLinks.map((link: any, i: number) => (
                 <button 
                   key={i} 
                   onClick={() => {
                     const content = isRtl ? link.contentAr : link.contentEn;
                     if (content) {
                       setActivePageContent({
                         title: isRtl ? link.labelAr : link.labelEn,
                         content: content
                       });
                       setCurrentView('page-viewer');
                       window.scrollTo({ top: 0, behavior: 'smooth' });
                     } else if (link.url && link.url !== '#') {
                       window.open(link.url, '_blank');
                     }
                   }}
                   className="text-[11px] font-black text-slate-400 hover:text-amber-400 uppercase tracking-[0.2em] transition-all hover:scale-110 active:scale-95"
                 >
                   {isRtl ? link.labelAr : link.labelEn}
                 </button>
               ))}
            </div>
          )}

          {/* Middle: Social */}
          <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
            <SocialIcon icon={<Send size={20} />} href={siteSettings.telegramUrl} color="hover:text-[#229ED9]" />
            <SocialIcon icon={<Instagram size={20} />} href={siteSettings.instagramUrl} color="hover:text-pink-400" />
            <SocialIcon icon={<Twitter size={20} />} href={siteSettings.twitterUrl} color="hover:text-slate-400" />
            <SocialIcon icon={<Youtube size={20} />} href={siteSettings.youtubeUrl} color="hover:text-red-500" />
            <SocialIcon icon={<Ghost size={20} />} href={siteSettings.snapchatUrl} color="hover:text-yellow-300" />
          </div>

          {/* Bottom: Copyright */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] text-slate-400 font-mono font-black tracking-[0.2em] uppercase text-center max-w-[600px] whitespace-pre-wrap leading-relaxed">
               {siteSettings.footerCopyright || `.GOLD DEALS AI. ALL RIGHTS RESERVED ${new Date().getFullYear()} ©`}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const MobileNavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label?: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center justify-center space-y-1 transition-all",
      active ? "text-amber-400" : "text-slate-500"
    )}
  >
    <div className={cn("p-1.5 rounded-lg", active ? "bg-amber-400/10" : "")}>
      {icon}
    </div>
    {label && <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>}
  </button>
);

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label?: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center px-4 py-2 rounded-xl transition-all",
      label ? "space-x-2" : "justify-center",
      active ? "text-amber-400 bg-amber-400/5 shadow-sm" : "text-slate-400 hover:text-white"
    )}
  >
    <span className={cn(active ? "scale-110" : "")}>{icon}</span>
    {label && <span className="text-xs font-bold tracking-wide">{label}</span>}
  </button>
);

const SocialIcon = ({ icon, href, color }: { icon: React.ReactNode, href?: string, color: string }) => (
  <a 
    href={href || "#"} 
    target="_blank" 
    rel="noopener noreferrer"
    className={cn("p-2.5 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:scale-110 text-slate-400", color)}
  >
    {icon}
  </a>
);

const StatBox = ({ label, value, color }: { label: string, value: string, color: string }) => (
  <div className="bg-white/5 border border-white/5 p-4 md:p-6 rounded-2xl flex flex-col justify-center">
    <div className="text-[9px] md:text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 opacity-60">{label}</div>
    <div className={cn("text-base md:text-xl font-mono font-bold tracking-tight", color)}>{value}</div>
  </div>
);
