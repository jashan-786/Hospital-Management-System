import { useState } from 'react';
import { HeartPulse, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const TEST_ACCOUNTS = [
  { role: 'Admin', email: 'admin@medicare.test' },
  { role: 'Doctor', email: 'doctor@medicare.test' },
  { role: 'Receptionist', email: 'reception@medicare.test' },
  { role: 'Patient', email: 'patient@medicare.test' },
];

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    }
  }

  function fillAccount(accEmail: string) {
    setEmail(accEmail);
    setPassword('Test@1234');
    setError(null);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-900 to-slate-900" />
        <div className="absolute top-20 -right-20 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute bottom-10 -left-10 w-96 h-96 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-xl shadow-brand-900/40">
              <HeartPulse className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MediCore</h1>
              <p className="text-sm text-brand-200">Hospital Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Integrated Care.<br />Simplified Management.
          </h2>
          <p className="text-brand-200 text-lg leading-relaxed max-w-md mb-12">
            Manage patients, appointments, medical records, pharmacy, and billing — all in one unified platform.
          </p>

          <div className="space-y-4">
            {[
              'Role-based access for Admin, Doctor, Receptionist & Patient',
              'Complete electronic medical records with prescriptions',
              'Pharmacy inventory with expiry and reorder alerts',
              'Itemized billing with real-time financial reports',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/20">
                  <ShieldCheck className="w-4 h-4 text-brand-300" />
                </div>
                <span className="text-sm text-brand-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
              <HeartPulse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">MediCore</h1>
              <p className="text-xs text-slate-500">Hospital Management</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h2>
            <p className="text-sm text-slate-500 mb-6">Sign in to your account to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@medicare.test"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Quick-fill test accounts */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Demo Accounts (click to fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TEST_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => fillAccount(acc.email)}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 rounded-lg transition-colors text-left"
                  >
                    <div className="font-semibold">{acc.role}</div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-slate-400 text-center">
                Password for all accounts: <span className="font-mono font-semibold">Test@1234</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
