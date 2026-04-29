import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  Target, 
  Plus, 
  MessageSquare, 
  LogOut, 
  Zap,
  ArrowRight,
  Loader2,
  Calendar,
  Tag,
  AlertCircle,
  Users,
  Settings,
  Copy,
  Check
} from 'lucide-react';
import { auth, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { 
  saveTransaction, 
  subscribeToTransactions, 
  getUserProfile, 
  updateUserProfile,
  generateLinkingCode,
  findUserByLinkingCode,
  linkPartner
} from './services/firebaseService';
import { parseExpense, getCoachAdvice } from './services/geminiService';
import { cn, formatCurrency } from './lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Components ---

const LinkingScreen = ({ profile, onLink }: { profile: any, onLink: (id: string) => void }) => {
  const [partnerCode, setPartnerCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(profile.linkingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLink = async () => {
    if (!partnerCode.trim()) return;
    setIsLinking(true);
    setError(null);
    try {
      const partner = await findUserByLinkingCode(partnerCode);
      if (!partner) {
        setError('Código inválido. Verifica que sea el correcto.');
      } else if (partner.id === profile.uid) {
        setError('No puedes vincularte contigo mismo.');
      } else {
        const coupleId = await linkPartner(profile.uid, partner.id);
        onLink(coupleId);
      }
    } catch (err) {
      setError('Error al vincular. Intenta de nuevo.');
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 flex flex-col items-center justify-center text-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-sm border border-slate-200"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Vincula a tu pareja</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          Para compartir gastos y metas, ambos deben estar vinculados en la app.
        </p>

        <div className="space-y-8">
          {/* Your Code */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3">Tu Código de Invitación</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold text-slate-900 tracking-wider">
                {profile.linkingCode}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Dale este código a tu pareja para que lo ingrese.</p>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Ó</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Enter Code */}
          <div className="space-y-4">
            <input 
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              placeholder="Ingresa el código de tu pareja"
              className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-center font-mono font-bold tracking-widest uppercase transition-all"
            />
            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
            <button 
              onClick={handleLink}
              disabled={isLinking || !partnerCode}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isLinking ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Vincular Ahora'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AuthScreen = () => {
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('El inicio de sesión fue cancelado. Inténtalo de nuevo.');
      } else {
        setError('Hubo un problema al conectar con Google. Revisa tu conexión.');
      }
      console.error(err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-6 text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-10 bg-white rounded-[40px] shadow-sm border border-slate-200 max-w-sm w-full"
      >
        <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-600/20">
          <Wallet className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">El Guardián Financiero</h1>
        <p className="text-slate-500 mb-10 text-sm leading-relaxed">Tu mentor honesto para una salud financiera en pareja.</p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold leading-tight"
          >
            {error}
          </motion.div>
        )}

        <button 
          onClick={handleSignIn}
          disabled={isAuthenticating}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 active:scale-95 disabled:opacity-50"
        >
          {isAuthenticating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-5 h-5 bg-white p-0.5 rounded-full" />
              Entrar con Google
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
};

const Header = ({ user }: { user: User }) => (
  <header className="flex items-center justify-between p-6 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm">
        <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-full h-full object-cover" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400">¡Hola!</p>
        <p className="text-lg font-bold text-slate-900 leading-none">{user.displayName?.split(' ')[0]}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="hidden sm:block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Pareja Premium</span>
      <button 
        onClick={() => signOut(auth)}
        className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  </header>
);

const DashboardCard = ({ title, amount, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col gap-1">
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", bg, color)}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
    <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(amount)}</p>
  </div>
);

const AddExpenseModal = ({ isOpen, onClose, onAdd }: any) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsParsing(true);
    try {
      const data = await parseExpense(input);
      setParsedData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    onAdd(parsedData);
    setInput('');
    setParsedData(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-[40px] p-8 relative shadow-2xl overflow-hidden border border-slate-200"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <Zap className="w-6 h-6 fill-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registro Inteligente</h2>
        </div>

        {!parsedData ? (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-bold text-emerald-600 uppercase tracking-widest z-10">Gemini AI activo</div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="'Gastamos $300 en tacos'..."
                className="w-full h-36 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:bg-white resize-none text-base outline-none transition-all"
              />
            </div>
            <button
              onClick={handleParse}
              disabled={isParsing || !input.trim()}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-bold disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
              Analizar Gasto
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-sm italic text-emerald-800 leading-relaxed">
              "{parsedData.message}"
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-widest">Monto</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(parsedData.amount)}</p>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase text-slate-400 font-bold mb-1 tracking-widest">Categoría</p>
                <p className="text-xl font-bold text-slate-900">{parsedData.category}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Necesidad</p>
                <span className="text-xs font-bold text-emerald-600">{parsedData.needLevel}/5</span>
              </div>
              <div className="flex gap-1.5 h-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 rounded-full transition-colors duration-500",
                      i <= parsedData.needLevel ? "bg-emerald-500" : "bg-slate-100"
                    )} 
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => setParsedData(null)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const CoachView = ({ transactions, profile }: any) => {
  const [advice, setAdvice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAdvice = async () => {
    setIsLoading(true);
    try {
      const stats = {
        totalSpent: transactions.reduce((acc: number, t: any) => acc + t.amount, 0),
        budget: profile?.monthlyBudget || 10000,
        goal: profile?.savingsGoal || 5000,
      };
      const res = await getCoachAdvice(transactions.slice(0, 10), stats);
      setAdvice(res);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-900 min-h-[calc(100vh-160px)]">
      <div className="p-8 flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Gemini Coach</h2>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{isLoading ? 'Analizando...' : 'Activo'}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-[28px] border border-slate-700/50 backdrop-blur-sm">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[2px] mb-4">Consejo Honesto</p>
            {isLoading ? (
              <div className="flex items-center gap-3 text-slate-500 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p className="text-sm">Escaneando historial financiero...</p>
              </div>
            ) : (
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {advice || "¡Registra tu primer gasto para recibir un análisis!"}
              </div>
            )}
          </div>

          <div className="bg-slate-800/30 p-6 rounded-[28px] border border-slate-700/30">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-6">Estado Emocional Financiero</h4>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-slate-400 font-medium">Estabilidad de la Pareja</span>
              <span className="text-xs font-bold text-emerald-400">Óptima</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        <button 
          onClick={fetchAdvice}
          disabled={isLoading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/10 transition-all active:scale-95 disabled:opacity-50"
        >
          Preguntar al Coach
        </button>
      </div>
    </div>
  );
};

const SettingsView = ({ profile, user }: any) => {
  const [budget, setBudget] = useState(profile?.monthlyBudget || 15000);
  const [goal, setGoal] = useState(profile?.savingsGoal || 10000);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateUserProfile(user.uid, {
      monthlyBudget: Number(budget),
      savingsGoal: Number(goal)
    });
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
          <Settings className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configuración</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Presupuesto y Metas</h3>
          <div className="grid gap-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-200">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Presupuesto Mensual</label>
              <input 
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="text-2xl font-bold text-slate-900 w-full outline-none"
                placeholder="$15,000"
              />
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-200">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Meta de Ahorro</label>
              <input 
                type="number"
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="text-2xl font-bold text-slate-900 w-full outline-none"
                placeholder="$10,000"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest">Pareja Vinculada</h3>
          </div>
          <p className="text-sm text-blue-800 font-medium mb-1">Tu ID de Pareja:</p>
          <p className="text-xs font-mono text-blue-600 break-all">{profile.coupleId || 'No vinculado'}</p>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/10 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'budget' | 'coach' | 'settings'>('budget');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        if (!p) {
          const newProfile = { 
            uid: u.uid, 
            email: u.email, 
            displayName: u.displayName,
            monthlyBudget: 15000,
            savingsGoal: 5000,
            savingsGoalName: "Nuevo Depa",
            linkingCode: generateLinkingCode(),
            coupleId: null
          };
          await updateUserProfile(u.uid, newProfile);
          setProfile(newProfile);
        } else {
          // If profile exists but code is missing (old users)
          if (!p.linkingCode) {
            const code = generateLinkingCode();
            await updateUserProfile(u.uid, { linkingCode: code });
            setProfile({ ...p, linkingCode: code });
          } else {
            setProfile(p);
          }
        }
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && profile?.coupleId) {
      return subscribeToTransactions(profile.coupleId, (data) => {
        setTransactions(data);
      });
    }
  }, [user, profile?.coupleId]);

  const handleAddTransaction = async (data: any) => {
    if (profile?.coupleId) {
      await saveTransaction(data, profile.coupleId);
    }
  };

  const handleLink = async (coupleId: string) => {
    setProfile((prev: any) => ({ ...prev, coupleId }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  // If user is logged in but not linked yet
  if (profile && !profile.coupleId) {
    return <LinkingScreen profile={profile} onLink={handleLink} />;
  }

  const totalSpent = transactions.reduce((acc, t) => acc + t.amount, 0);
  const budget = profile?.monthlyBudget || 15000;
  const remaining = budget - totalSpent;
  const goal = profile?.savingsGoal || 10000;
  const progress = Math.min((totalSpent / budget) * 100, 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans text-slate-800">
      <Header user={user} />
      
      <AnimatePresence mode="wait">
        {activeTab === 'budget' && (
          <motion.div 
            key="budget"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6 space-y-8"
          >
            {/* Balance Overview */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
               <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-50 rounded-full blur-3xl transition-all group-hover:bg-emerald-100" />
               <div className="flex items-center gap-2 mb-6">
                 <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Wallet className="w-5 h-5" />
                 </div>
                 <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Saldo Restante</h3>
               </div>
               <h2 className="text-5xl font-bold text-slate-900 mb-2 tracking-tighter">{remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining))}</h2>
               <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                 <TrendingUp className="w-4 h-4" />
                 <span>+12% vs el mes pasado</span>
               </div>
            </div>

            {/* Savings Goal Card */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Meta: {profile?.savingsGoalName}</h3>
                 </div>
                 <span className="text-xs font-black text-indigo-600">{Math.round((totalSpent / budget) * 100)}%</span>
               </div>
               <p className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">{formatCurrency(totalSpent)} <span className="text-slate-300">/</span> {formatCurrency(budget)}</p>
               <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   className="h-full bg-indigo-600 transition-all duration-1000 rounded-full"
                 />
               </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h4 className="font-bold text-slate-900">Actividad Reciente</h4>
                <button className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">Ver todo</button>
              </div>
              <div className="p-2">
                {transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-slate-400 font-medium">No hay gastos este mes.</p>
                  </div>
                ) : (
                  transactions.slice(0, 5).map((t) => (
                    <div 
                      key={t.id}
                      className="p-4 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] uppercase",
                          t.category === 'Comida fuera' ? "bg-orange-50 text-orange-600" :
                          t.category === 'Despensa' ? "bg-blue-50 text-blue-600" :
                          t.category === 'Gastos Hormiga' ? "bg-purple-50 text-purple-600" :
                          "bg-slate-100 text-slate-500"
                        )}>
                          {t.category?.substring(0, 3)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{t.description || t.category}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(t.date || new Date(), "d 'de' MMMM", { locale: es })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">-{formatCurrency(t.amount)}</p>
                        {t.needLevel < 3 && (
                          <span className="text-[8px] font-black bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full uppercase">Fuga</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'coach' && (
          <motion.div
            key="coach"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <CoachView transactions={transactions} profile={profile} />
          </motion.div>
        )}
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <SettingsView profile={profile} user={user} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      {activeTab === 'budget' && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-32 right-6 w-16 h-16 bg-emerald-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-emerald-600/30 z-40 transition-all active:scale-90 hover:bg-emerald-700 hover:-translate-y-1"
        >
          <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/90 to-transparent">
        <div className="max-w-xs mx-auto bg-slate-900 rounded-[28px] shadow-2xl border border-slate-800 p-2 flex gap-1">
          <button 
            onClick={() => setActiveTab('budget')}
            className={cn(
              "flex-1 py-3.5 rounded-[22px] text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'budget' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Wallet className="w-5 h-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('coach')}
            className={cn(
              "flex-1 py-3.5 rounded-[22px] text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'coach' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <MessageSquare className="w-5 h-5" />
            Coach
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex-1 py-3.5 rounded-[22px] text-xs font-bold transition-all flex items-center justify-center gap-2",
              activeTab === 'settings' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Settings className="w-5 h-5" />
            Ajustes
          </button>
        </div>
      </nav>

      {/* Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddExpenseModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
            onAdd={handleAddTransaction}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
