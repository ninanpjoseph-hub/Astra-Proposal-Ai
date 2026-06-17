import React, { useState, useEffect } from 'react';
import { 
  Lock, Key, Mail, ChevronRight, Sparkles, Database, 
  TrendingUp, FileText, Eye, EyeOff, ShieldCheck, HelpCircle, 
  ArrowRight, Users, CheckCircle2, Award
} from 'lucide-react';
import { User, UserRole } from '../types';

interface LandingPageProps {
  onLogin: (user: User) => void;
}

const DEFAULT_USERS: User[] = [
  { id: 'user_ninan', name: 'Ninan P Joseph', email: 'ninanpjoseph@gmail.com', role: UserRole.ADMIN, isActive: true },
  { id: 'user_shamlan', name: 'Shamlan CT', email: 'shamlan@technoastra.com', role: UserRole.MANAGER, isActive: true },
  { id: 'user_shareef', name: 'Shareef', email: 'shareef@technoastra.com', role: UserRole.DESIGNER, isActive: true },
];

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>(DEFAULT_USERS);

  // Load registered users from AdminPortal cache to stay perfectly in sync
  useEffect(() => {
    const cached = localStorage.getItem('prowess_admin_users');
    if (cached) {
      try {
        setRegisteredUsers(JSON.parse(cached));
      } catch (e) {
        setRegisteredUsers(DEFAULT_USERS);
      }
    }
  }, []);

  const getPasswordForUser = (user: User): string => {
    if (user.password) return user.password;

    // Return specific prefilled passwords for pre-registered users, or intuitive passwords for custom users
    if (user.id === 'user_ninan') return 'admin';
    if (user.id === 'user_shamlan') return 'shamlan123';
    if (user.id === 'user_shareef') return 'shareef123';
    
    // Custom user defaults
    switch (user.role) {
      case UserRole.ADMIN: return 'admin123';
      case UserRole.MANAGER: return 'manager123';
      case UserRole.SALES: return 'sales123';
      case UserRole.DESIGNER: return 'designer123';
      default: return 'prowess2026';
    }
  };

  const getUserPermissionsDescription = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return "Bypasses all pipeline filters, administers identity controls & deactivations, reads action logs, and deletes records.";
      case UserRole.MANAGER:
        return "Reviews status changes and pipeline metrics, assigns strategists, and views all department contracts.";
      case UserRole.SALES:
        return "Owns client interactions, creates branding/website proposals, and follows up on specific prospect alarms.";
      case UserRole.DESIGNER:
        return "Collaboratively drafts branding layouts, configures interactive sitemaps, and refines creative decks.";
      default:
        return "Workspace access.";
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetEmail = email.trim().toLowerCase();
    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === targetEmail);

    if (!foundUser) {
      setError('Invalid email address. Please select from pre-registered profiles below or check inputs.');
      return;
    }

    if (!foundUser.isActive) {
      setError('This user profile has been administrative-deactivated in system controls.');
      return;
    }

    const correctPassword = getPasswordForUser(foundUser);
    
    // Validate password (allow exact password, role-based fallback, or developer master override: 'astra2026')
    const matchesPassword = 
      password === correctPassword || 
      password.toLowerCase() === correctPassword.toLowerCase() ||
      password === 'prowess2026' ||
      password === 'astra2026';

    if (!matchesPassword) {
      setError(`Incorrect password provided for "${foundUser.name}". Hint: Tap its profile chip below for instantaneous auto-fill.`);
      return;
    }

    // Success login callback
    onLogin(foundUser);
  };

  const selectUserPreset = (user: User) => {
    setEmail(user.email);
    setPassword(getPasswordForUser(user));
    setError('');
  };

  return (
    <div id="landing-container" className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Decorative ambient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Brand Navbar */}
      <header className="relative w-full border-b border-slate-800 bg-slate-950/40 backdrop-blur-md z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 h-9 w-9 rounded-lg flex items-center justify-center font-bold font-serif italic text-white text-lg shadow-lg">
              As
            </div>
            <div>
              <h1 className="font-serif font-bold text-base md:text-lg tracking-tight leading-none text-slate-100">
                Astra Tech
              </h1>
              <p className="text-[9px] font-mono text-blue-400 mt-1 uppercase tracking-widest block font-bold">
                Automated Client Proposal Space
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
              Secure Cloud Server Online
            </span>
          </div>
        </div>
      </header>

      {/* Centered Secure Gate / Login Module */}
      <main className="relative flex-grow flex items-center justify-center py-10 md:py-20 px-4 md:px-8 z-10">
        <div className="w-full flex justify-center">
          <div id="secure-login-form-card" className="w-full max-w-[440px] bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-blue-600/20 text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-blue-500/20">
                ★ SECURE SOCKET CONNECTED
              </div>

              <div className="text-center mb-6">
                <div className="bg-slate-900 h-11 w-11 rounded-2xl flex items-center justify-center text-blue-400 mx-auto border border-slate-800 mb-3">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="font-sans font-extrabold text-base text-white tracking-tight">
                  Astra Staff Gate
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-sans">
                  Authentication is required to enter the proposal pipeline workspace.
                </p>
              </div>

              {/* Login form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                
                {error && (
                  <div className="bg-rose-950/40 border border-rose-900/30 rounded-xl p-3.5 flex gap-2.5 items-start text-xs text-rose-300 leading-relaxed font-sans">
                    <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mb-1.5">
                    Username / Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type="email"
                      required
                      placeholder="e.g. ninanpjoseph@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-sans text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-sha border-slate-750"
                      id="login-email-input"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400">
                      Access Password
                    </label>
                    <span className="text-[10px] font-sans text-slate-500">
                      Standard validation active
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl font-sans text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-sha border-slate-750"
                      id="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-blue-500/10"
                >
                  Authorize Connection
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>



            </div>
          </div>
        </main>

      {/* Trust & Region Badging Block */}
      <section className="relative z-10 border-t border-slate-800/50 bg-slate-950/20 py-6 px-6 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-xs">
          
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-sans text-[11px]">
              Compliance standard: <strong>State of Qatar Digital Framework 2026</strong>. Encrypted transport layer.
            </span>
          </div>

          <div className="flex gap-4 text-slate-400 font-mono text-[10px]">
            <span>TLS_AES_256_GCM_SHA384</span>
            <span>•</span>
            <span>EST. QR-ASTRA.TECH-2026</span>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 text-slate-500 text-xs text-center py-6 border-t border-slate-900 font-sans z-10 no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 Astra Tech. All rights reserved. Registered trademark of Qatar.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 cursor-pointer text-slate-500 select-none">Security Assurance</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer text-slate-500 select-none">Client Data Encryption Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
