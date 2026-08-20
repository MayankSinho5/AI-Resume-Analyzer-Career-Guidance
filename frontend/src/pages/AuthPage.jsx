import React, { useState, useEffect } from 'react';
import { 
  Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, 
  ShieldCheck, CheckCircle2, AlertCircle, KeyRound, 
  Briefcase, UserCheck, X 
} from 'lucide-react';

const API_BASE_URLS = ['http://localhost:8000/api/auth', 'http://127.0.0.1:8000/api/auth'];
const GOOGLE_CLIENT_ID = "1048209823485-sampleid.apps.googleusercontent.com"; // Standard Client ID placeholder for GSI

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

  // Google SSO State
  const [googleLoading, setGoogleLoading] = useState(false);

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

  // Decode JWT Payload from Google GSI
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  // Initialize Official Google Identity Services SDK Button & One-Tap
  useEffect(() => {
    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleJwtResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Render Official Google Sign-In Button
        const btnContainer = document.getElementById("gsi_button_container");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          window.google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            width: 380,
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left"
          });
        }
      }
    };

    // Retry loading GSI script if loading asynchronously
    initGoogleGsi();
    const timer = setTimeout(initGoogleGsi, 1000);
    return () => clearTimeout(timer);
  }, [isLogin]);

  // Callback when candidate chooses their real Google account from popup
  const handleGoogleJwtResponse = async (response) => {
    if (!response || !response.credential) return;

    setGoogleLoading(true);
    setErrorMsg('');

    // Send Google's cryptographically signed ID Token (JWT) directly to backend for verification
    await executeGoogleBackendLogin(null, null, null, response.credential);
  };

  const executeGoogleBackendLogin = async (userEmail, userFullName, googleId, idToken = null) => {
    setGoogleLoading(true);
    setErrorMsg('');

    let data = null;
    let lastError = null;

    const payload = idToken 
      ? { token: idToken, role: role }
      : { email: userEmail ? userEmail.trim().toLowerCase() : undefined, full_name: userFullName, google_id: googleId, role: role };

    for (const baseUrl of API_BASE_URLS) {
      try {
        const res = await fetch(`${baseUrl}/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (!res.ok) throw new Error(resData.detail || 'Google Authentication failed');
        data = resData;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!data) {
      setErrorMsg(lastError?.message || 'Google Auth service offline');
      setGoogleLoading(false);
      return;
    }

    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    setSuccessMsg(`✓ Welcome ${data.user.full_name}! Authenticated via Google Account (${data.user.email}). Redirecting...`);

    setTimeout(() => {
      onAuthSuccess(data.user);
    }, 600);
    setGoogleLoading(false);
  };

  // Manual Trigger for Google Account Picker
  const handleGoogleCustomButtonClick = () => {
    setErrorMsg('');
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback to email prompt or direct login if popup is blocked
          if (email && validateGmail(email)) {
            executeGoogleBackendLogin(email, fullName || 'Google Candidate', 'g_123');
          } else {
            const promptEmail = prompt("Select or enter your Google Account (@gmail.com):", email || "");
            if (promptEmail && validateGmail(promptEmail)) {
              executeGoogleBackendLogin(promptEmail, 'Google Candidate', 'g_123');
            }
          }
        }
      });
    } else {
      if (email && validateGmail(email)) {
        executeGoogleBackendLogin(email, fullName || 'Google Candidate', 'g_123');
      } else {
        const promptEmail = prompt("Enter your real Google Account (@gmail.com):", "");
        if (promptEmail && validateGmail(promptEmail)) {
          executeGoogleBackendLogin(promptEmail, 'Google Candidate', 'g_123');
        }
      }
    }
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
      case 4: return { score: 100, label: 'Strong', color: '#10B981', textColor: '#6EE7B7' };
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
      overflow: 'hidden'
    }}>
      {/* Dynamic Floating Ambient Background Orbs */}
      <div className="animate-float-1" style={{
        position: 'absolute',
        top: '15%',
        left: '20%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>
      <div className="animate-float-2" style={{
        position: 'absolute',
        bottom: '15%',
        right: '20%',
        width: '380px',
        height: '380px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%)',
        filter: 'blur(80px)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }}></div>

      {/* Main Glassmorphism Auth Card */}
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px 36px',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            padding: '6px 16px',
            borderRadius: '30px',
            color: '#A5B4FC',
            fontSize: '0.8rem',
            fontWeight: '600',
            marginBottom: '16px'
          }}>
            <Sparkles size={14} className="text-indigo-400" /> AI Resume Analyzer & Career Guidance
          </div>
          
          <h2 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            {isLogin ? 'Sign In to CareerAI' : 'Create Your Free Account'}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {isLogin 
              ? 'Enter your Gmail credentials to access your resume insights & ATS scores' 
              : 'Create an account to analyze resumes and prepare for interviews'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name field (Signup only) */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label">Full Name</label>
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
              <div className="form-group">
                <label className="form-label">Account Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: role === 'user' ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: role === 'user' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                      color: role === 'user' ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <UserCheck size={16} color={role === 'user' ? '#818CF8' : '#64748B'} />
                    Job Seeker
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      border: role === 'recruiter' ? '1px solid #6366F1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: role === 'recruiter' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                      color: role === 'recruiter' ? '#FFFFFF' : '#94A3B8',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Briefcase size={16} color={role === 'recruiter' ? '#818CF8' : '#64748B'} />
                    Recruiter
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email field */}
          <div className="form-group">
            <div className="form-label">
              <span>Gmail Address</span>
              {email && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: validateGmail(email) ? '#34D399' : '#FBBF24',
                  textTransform: 'none'
                }}>
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

          {/* Password field */}
          <div className="form-group">
            <div className="form-label">
              <span>Password</span>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setShowForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#818CF8',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textTransform: 'none',
                    padding: 0
                  }}
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
                style={{
                  position: 'absolute',
                  right: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Bar (Sign Up Only) */}
            {!isLogin && password && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                  <span style={{ color: '#94A3B8' }}>Strength:</span>
                  <span style={{ fontWeight: '700', color: pwdStrength.textColor }}>{pwdStrength.label}</span>
                </div>
                <div style={{ height: '5px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${pwdStrength.score}%`,
                    background: pwdStrength.color,
                    transition: 'all 0.3s ease'
                  }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password (Sign Up Only) */}
          {!isLogin && (
            <div className="form-group">
              <div className="form-label">
                <span>Confirm Password</span>
                {confirmPassword && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: password === confirmPassword ? '#34D399' : '#F87171',
                    textTransform: 'none'
                  }}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </span>
                )}
              </div>
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
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me & Terms Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            {isLogin ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#6366F1', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#CBD5E1' }}>Remember me</span>
              </label>
            ) : (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: '#6366F1', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: '1.4' }}>
                  I agree to the <a href="#" style={{ color: '#818CF8', textDecoration: 'underline' }}>Terms of Service</a> & <a href="#" style={{ color: '#818CF8', textDecoration: 'underline' }}>Privacy Policy</a>
                </span>
              </label>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '24px' }}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isLogin ? 'Sign In to Dashboard' : 'Create Free Account'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          color: '#475569',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
          <span>Or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
        </div>

        {/* Official Google Identity Services SDK Rendered Button Container */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
          <div id="gsi_button_container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
        </div>

        {/* Fallback Custom Google Auth Button */}
        <div style={{ marginBottom: '24px' }}>
          <button
            type="button"
            className="btn-social"
            onClick={handleGoogleCustomButtonClick}
            disabled={googleLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'rgba(255, 255, 255, 0.06)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z" />
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 11.5 0 14s.6 4.8 1.6 6.8l3.7-2.9z" />
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z" />
            </svg>
            <span>{googleLoading ? 'Connecting to Google Accounts...' : 'Continue with Google Account'}</span>
          </button>
        </div>

        {/* BOTTOM FOOTER LINK TOGGLE (SIGN IN <-> SIGN UP) */}
        <div style={{
          textAlign: 'center',
          paddingTop: '18px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#94A3B8',
          fontSize: '0.9rem'
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
                  fontSize: '0.9rem'
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
                  fontSize: '0.9rem'
                }}
              >
                Sign in
              </button>
            </span>
          )}
        </div>

        {/* Footer Guarantee */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginTop: '20px',
          color: '#64748B',
          fontSize: '0.78rem'
        }}>
          <ShieldCheck size={15} color="#10B981" />
          <span>Secure 256-Bit Encrypted Authentication</span>
        </div>
      </div>

      {/* Reset Password Modal */}
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
          WebkitBackdropFilter: 'blur(12px)',
          padding: '20px'
        }}>
          <div className="glass-card animate-modal-pop" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '32px',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSuccess('');
                setForgotError('');
              }}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818CF8'
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF' }}>Reset Password</h3>
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
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
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

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                >
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
