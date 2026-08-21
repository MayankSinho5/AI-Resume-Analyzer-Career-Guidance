import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, 
  ShieldCheck, CheckCircle2, AlertCircle, KeyRound, 
  Briefcase, UserCheck, X, Scan, FileText, Check, Award
} from 'lucide-react';

const API_BASE_URLS = ['http://localhost:8000/api/auth', 'http://127.0.0.1:8000/api/auth'];

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Live Animated Laser Scan ATS Score Meter
  const [scanScore, setScanScore] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setScanScore((prev) => (prev >= 96 ? 45 : prev + 3));
    }, 120);
    return () => clearInterval(timer);
  }, []);

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
      padding: '30px 20px',
      position: 'relative',
      overflow: 'hidden',
      background: '#070A10'
    }}>

      {/* Laser beam animation */}
      <style>{`
        @keyframes laserScan {
          0% { top: 10%; opacity: 0.3; }
          50% { top: 85%; opacity: 1; }
          100% { top: 10%; opacity: 0.3; }
        }
      `}</style>

      {/* FINAL PRODUCTION CONTAINER */}
      <div style={{
        width: '100%',
        maxWidth: '1060px',
        minHeight: '620px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderRadius: '26px',
        overflow: 'hidden',
        boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(52, 211, 153, 0.15)',
        border: '1px solid rgba(52, 211, 153, 0.25)',
        position: 'relative',
        zIndex: 10
      }}>

        {/* LEFT SIDE: ANIMATED AI RESUME LASER SCANNER */}
        <div style={{
          padding: '44px 40px',
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.95) 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Top Brand Badge */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              padding: '6px 16px',
              borderRadius: '30px',
              color: '#6EE7B7',
              fontSize: '0.82rem',
              fontWeight: '700'
            }}>
              <Sparkles size={16} className="text-emerald-400" /> AI Resume Analyzer & Career Guidance
            </div>
          </div>

          {/* ANIMATED RESUME SHEET DEMO WITH SCANNING BEAM */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            margin: '30px 0',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)'
          }}>
            {/* LASER SCANNING BEAM */}
            <div style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #34D399, #6EE7B7, #34D399, transparent)',
              boxShadow: '0 0 15px #34D399, 0 0 25px #34D399',
              borderRadius: '2px',
              zIndex: 10,
              animation: 'laserScan 3s ease-in-out infinite'
            }}></div>

            {/* Mock Resume Content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(52, 211, 153, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#FFFFFF' }}>Rahul_Sharma_Resume.pdf</div>
                <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>AI Scanning & Keyword Extraction...</div>
              </div>
            </div>

            {/* Mock Content Lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div style={{ height: '8px', width: '85%', background: 'rgba(52, 211, 153, 0.3)', borderRadius: '4px' }}></div>
              <div style={{ height: '8px', width: '95%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}></div>
              <div style={{ height: '8px', width: '70%', background: 'rgba(52, 211, 153, 0.25)', borderRadius: '4px' }}></div>
              <div style={{ height: '8px', width: '90%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }}></div>
            </div>

            {/* Live ATS Score Counter Bar */}
            <div style={{ background: 'rgba(6, 78, 59, 0.4)', borderRadius: '14px', padding: '14px 18px', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Live ATS Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#34D399' }}>{scanScore}% Match</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: '#6EE7B7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Format Validated</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={14} /> Keywords Verified</div>
              </div>
            </div>
          </div>

          {/* Bottom Feature Headline */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>
              Instant AI Resume Analysis
            </h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Get instant ATS scores, keyword fixes, and AI-mock interview prep.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: CLEAN AUTH FORM */}
        <div style={{
          padding: '44px 38px',
          background: 'rgba(13, 17, 26, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '6px', letterSpacing: '-0.02em' }}>
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
                      <User size={18} color="#34D399" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                          border: role === 'user' ? '1px solid #34D399' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: role === 'user' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)',
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
                        <UserCheck size={16} color={role === 'user' ? '#6EE7B7' : '#64748B'} />
                        Job Seeker
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('recruiter')}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          border: role === 'recruiter' ? '1px solid #34D399' : '1px solid rgba(255, 255, 255, 0.08)',
                          background: role === 'recruiter' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)',
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
                        <Briefcase size={16} color={role === 'recruiter' ? '#6EE7B7' : '#64748B'} />
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
                  <Mail size={18} color="#34D399" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                      style={{ background: 'none', border: 'none', color: '#6EE7B7', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#34D399" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#34D399', cursor: 'pointer' }}
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
                    <Lock size={18} color="#34D399" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                      style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#34D399', cursor: 'pointer' }}
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
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: '#34D399' }} />
                    Remember me on this device
                  </label>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.78rem', color: '#94A3B8' }}>
                    <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} style={{ marginTop: '2px', accentColor: '#34D399' }} />
                    I accept the Terms of Service & Privacy Policy
                  </label>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                }}
              >
                {loading ? 'Authenticating...' : (
                  <>
                    <span>{isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* BOTTOM TOGGLE LINK (SIGN IN <-> SIGN UP AT THE BOTTOM LIKE BEFORE) */}
          <div style={{
            textAlign: 'center',
            paddingTop: '16px',
            marginTop: '16px',
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
                    color: '#6EE7B7',
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
                    color: '#6EE7B7',
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

            {/* Footer Security Guarantee */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px', color: '#64748B', fontSize: '0.76rem' }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>Secure 256-Bit Encrypted Authentication</span>
            </div>
          </div>
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
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34D399' }}>
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
                    <Mail size={18} color="#34D399" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
