/**
 * Claim Passport Authentication & Demo Accounts Modal
 * Provides login, signup, password hashing, persistent sessions, and 1-click demo personas.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  Mail,
  Building,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { User as UserType, UserRole } from '../types';
import { loginApi, signupApi, logoutApi } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType | null;
  onAuthSuccess: (user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Content Creator');
  const [department, setDepartment] = useState('Growth & Creative Studio');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoAccounts = [
    {
      role: 'Content Creator' as UserRole,
      name: 'Alex Rivera',
      email: 'alex.rivera@inkloom.example',
      department: 'Growth & Creative Studio',
      badge: 'Creator Persona',
      color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
      description: 'Drafts promotional copy, runs Intent Lock checks. Cannot approve content.',
    },
    {
      role: 'Reviewer' as UserRole,
      name: 'Jordan Taylor',
      email: 'jordan.taylor@inkloom.example',
      department: 'Brand Compliance & Legal',
      badge: 'Reviewer Persona',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
      description: 'Inspects claims, examines evidence, requests revisions or signs off.',
    },
    {
      role: 'Fact Owner' as UserRole,
      name: 'Dr. David Vance',
      email: 'david.vance@inkloom.example',
      department: 'R&D Product Safety & Quality Lab',
      badge: 'Fact Owner Persona',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
      description: 'Maintains Living Fact Registry specs, responds to expiry refresh notices.',
    },
    {
      role: 'Brand Manager' as UserRole,
      name: 'Elena Ramos',
      email: 'elena.ramos@inkloom.example',
      department: 'Executive Governance & Standards',
      badge: 'Admin Persona',
      color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
      description: 'Admin rights: full governance authority, approves guideline clarifications.',
    },
  ];

  const handleDemoLogin = async (acc: typeof demoAccounts[0]) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await loginApi(acc.email, 'Password123!');
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await loginApi(email.trim(), password.trim());
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please provide your name, email, and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await signupApi({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        department: department.trim(),
      });
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Account & Role Authentication</h3>
              <p className="text-xs text-slate-300">SQLite persistent database with scrypt password hashing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Demo Accounts Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                Demo Persona Accounts (Instant Sign-In)
              </span>
              <span className="text-[11px] text-slate-400">Password: Password123!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDemoLogin(acc)}
                  className={`text-left p-3 rounded-xl border transition ${acc.color} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{acc.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                        {acc.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{acc.description}</p>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold">
                    <span className="truncate text-slate-500">{acc.email}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-1 text-indigo-600" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">Or use standard credentials</span>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                tab === 'signup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.rivera@inkloom.example"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-2"
              >
                {isLoading ? <span>Authenticating...</span> : <span>Sign In to Claim Passport</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jordan Taylor"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.taylor@inkloom.example"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Governance Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Content Creator">Content Creator</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Fact Owner">Fact Owner</option>
                    <option value="Brand Manager">Brand Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Brand Compliance"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center space-x-2"
              >
                {isLoading ? <span>Creating Account...</span> : <span>Create Account</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
