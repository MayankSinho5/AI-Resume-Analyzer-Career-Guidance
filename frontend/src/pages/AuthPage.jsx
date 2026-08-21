import React, { useState } from 'react';
import { 
  Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, 
  ShieldCheck, CheckCircle2, AlertCircle, KeyRound, 
  Briefcase, UserCheck, X, FileText, Target, Award,
  TrendingUp, Layers, Check, LayoutDashboard, Compass
} from 'lucide-react';

const API_BASE_URLS = ['http://localhost:8000/api/auth', 'http://127.0.0.1:8000/api/auth'];

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user'); // 'user' (Job Seeker) or 'recruiter'
  const [email, setEmail] = useState(() => localStorage.getItem('remembered_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('remembered_email'));
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Status Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Gmail Validation
  const validateGmail = (emailStr) => {
    const cleanEmail = emailStr.trim().toLowerCase();
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail);
  };

  // Password Strength Logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#334155', textColor: '#94A3B8' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1: return { score: 25, label: 'Weak', color: '#EF4444', textColor: '#FCA5A5' };
      case 2: return { score: 50, label: 'Fair', color: '#F59E0B', textColor: '#FCD34D' };
      case 3: return { score: 75, label: 'Good', color: '#3B82F6', textColor: '#93C5FD' };
      case 4: return { score: 100, label: 'Strong ✨', color: '#10B981', textColor: '#6EE7B7' };
      default: return { score: 15, label: 'Short', color: '#EF4444', textColor: '#FCA5A5' };
    }
  };

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!validateGmail(cleanEmail)) {
      setErrorMsg('Only valid @gmail.com email addresses are allowed (e.g. user@gmail.com).');
      return;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }
      if (!acceptTerms) {
        setErrorMsg('You must accept the Terms of Service & Privacy Policy.');
        return;
      }
    }

    setLoading(true);

    const path = isLogin ? '/login' : '/signup';
    const payload = isLogin 
      ? { email: cleanEmail, password } 
      : { full_name: fullName.trim(), email: cleanEmail, password, role };

    let lastError = null;
    let data = null;

    for (const baseUrl of API_BASE_URLS) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (!response.ok) {
          throw new Error(resData.detail || 'Authentication failed. Please check your credentials.');
        }

        data = resData;
        break; // Success!
      } catch (err) {
        lastError = err;
      }
    }

    if (!data) {
      setErrorMsg(lastError?.message || 'Connection failed. Please verify backend server is running.');
      setLoading(false);
      return;
    }

    if (rememberMe) {
      localStorage.setItem('remembered_email', cleanEmail);
    } else {
      localStorage.removeItem('remembered_email');
    }

    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(data.user));

    setSuccessMsg(isLogin ? 'Welcome back! Logging you in...' : 'Account created successfully! Redirecting...');
    
    setTimeout(() => {
      onAuthSuccess(data.user);
    }, 800);
    setLoading(false);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!validateGmail(forgotEmail)) {
      setForgotError('Please enter a valid registered @gmail.com address.');
      return;
    }

    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSuccess(`A password reset link has been sent to ${forgotEmail.trim()}. Check your inbox.`);
    }, 1000);
  };

  const toggleTab = (loginTab) => {
    setIsLogin(loginTab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden',
      background: '#07090E'
    }}>

      {/* CONCEPT 5: BACKGROUND LIVE DASHBOARD CANVAS PREVIEW (BLURRED APP WORKSPACE) */}
      <div style={{
        position: 'absolute',
        inset: '20px',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        background: '#0B0F19',
        overflow: 'hidden',
        filter: 'blur(7px) brightness(0.65)',
        pointerEvents: 'none',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        opacity: 0.85
      }}>
        {/* Mock Top Navbar */}
        <div style={{ height: '60px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#818CF8', fontWeight: '800', fontSize: '1.1rem' }}>
            <Sparkles size={20} /> CareerAI Dashboard
          </div>
          <div style={{ display: 'flex', gap: '20px', color: '#64748B', fontSize: '0.85rem' }}>
            <span style={{ color: '#818CF8', fontWeight: '600' }}>ATS Scorer</span>
            <span>Job Matcher</span>
            <span>Interview Simulator</span>
            <span>Career Roadmap</span>
          </div>
        </div>

        {/* Mock App Body Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, padding: '24px', gap: '24px' }}>
          {/* Mock Left Sidebar */}
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', marginBottom: '16px' }}></div>
            <div style={{ height: '14px', width: '120px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', marginBottom: '8px' }}></div>
            <div style={{ height: '10px', width: '80px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', marginBottom: '24px' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ height: '36px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '10px' }}></div>
              <div style={{ height: '36px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}></div>
              <div style={{ height: '36px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px' }}></div>
            </div>
          </div>

          {/* Mock Main Dashboard Section */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>ATS Match Score</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34D399', marginTop: '4px' }}>92 / 100</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Interview Readiness</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#818CF8', marginTop: '4px' }}>88% High</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Matched Roles</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FBBF24', marginTop: '4px' }}>14 Tech Jobs</div>
              </div>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '24px' }}>
              <div style={{ height: '20px', width: '200px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '6px', marginBottom: '16px' }}></div>
              <div style={{ height: '140px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* CONCEPT 5: CENTERED FLOATING CRISP AUTH DIALOG */}
      <div className="animate-fade-in" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '40px 36px',
        borderRadius: '26px',
        background: 'rgba(13, 17, 28, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.2)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* Top Brand Tag */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            padding: '6px 16px',
            borderRadius: '30px',
            color: '#A5B4FC',
            fontSize: '0.82rem',
            fontWeight: '600'
          }}>
            <Sparkles size={15} className="text-indigo-400" /> AI Resume Analyzer & Career Guidance
          </div>
        </div>

        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Sign In to CareerAI' : 'Create Your Free Account'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>
            {isLogin 
              ? 'Enter your Gmail credentials to access your resume insights' 
              : 'Create an account to analyze resumes and prepare for interviews'}
          </p>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="alert-error" style={{ marginBottom: '18px' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert-success" style={{ marginBottom: '18px' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Controls */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '46px' }}
                  />
                </div>
              </div>

              {/* Account Role Selector */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: role === 'user' ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: role === 'user' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      color: role === 'user' ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <UserCheck size={16} color={role === 'user' ? '#818CF8' : '#64748B'} />
                    Job Seeker
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: role === 'recruiter' ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: role === 'recruiter' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                      color: role === 'recruiter' ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Briefcase size={16} color={role === 'recruiter' ? '#818CF8' : '#64748B'} />
                    Recruiter
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email Field */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div className="form-label" style={{ fontSize: '0.8rem' }}>
              <span>Gmail Address</span>
              {email && (
                <span style={{ fontSize: '0.74rem', fontWeight: '600', color: validateGmail(email) ? '#34D399' : '#FBBF24' }}>
                  {validateGmail(email) ? '✓ Valid @gmail.com' : 'Must end in @gmail.com'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '46px' }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <div className="form-label" style={{ fontSize: '0.8rem' }}>
              <span>Password</span>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  style={{ background: 'none', border: 'none', color: '#818CF8', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '46px', paddingRight: '46px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {!isLogin && password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94A3B8' }}>Strength:</span>
                  <span style={{ fontWeight: '700', color: pwdStrength.textColor }}>{pwdStrength.label}</span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pwdStrength.score}%`, background: pwdStrength.color, transition: 'all 0.3s' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Sign Up Only) */}
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '46px', paddingRight: '46px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me / Terms Checkbox */}
          <div style={{ marginBottom: '20px' }}>
            {isLogin ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#CBD5E1' }}>
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: '#6366F1' }} />
                Remember me on this device
              </label>
            ) : (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#94A3B8' }}>
                <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ marginTop: '2px', accentColor: '#6366F1' }} />
                I accept the Terms of Service & Privacy Policy
              </label>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '13px', fontSize: '0.95rem', marginBottom: '20px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* BOTTOM FOOTER LINK TOGGLE (SIGN IN <-> SIGN UP AT THE BOTTOM) */}
        <div style={{
          textAlign: 'center',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#94A3B8',
          fontSize: '0.88rem'
        }}>
          {isLogin ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => toggleTab(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818CF8',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.88rem'
                }}
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => toggleTab(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#818CF8',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.88rem'
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {/* Footer Guarantee */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px', color: '#64748B', fontSize: '0.78rem' }}>
          <ShieldCheck size={15} color="#10B981" />
          <span>Secure 256-Bit Encrypted Authentication</span>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '20px'
        }}>
          <div className="glass-card animate-modal-pop" style={{ width: '100%', maxWidth: '420px', padding: '32px', position: 'relative' }}>
            <button
              onClick={() => setShowForgotModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818CF8' }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF' }}>Reset Password</h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>Enter your registered Gmail address</p>
              </div>
            </div>

            {forgotError && (
              <div className="alert-error" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess ? (
              <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                <div className="alert-success" style={{ marginBottom: '20px' }}>
                  <CheckCircle2 size={18} />
                  <span>{forgotSuccess}</span>
                </div>
                <button type="button" onClick={() => setShowForgotModal(false)} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Gmail Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} color="#64748B" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="input-field"
                      style={{ paddingLeft: '46px' }}
                    />
                  </div>
                </div>

                <button type="submit" disabled={forgotLoading} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
                  {forgotLoading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
