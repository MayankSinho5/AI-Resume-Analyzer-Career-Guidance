import React from 'react';
import { FileText, LogOut, User, Sparkles } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  return (
    <nav style={{
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '16px 24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={22} color="#FFFFFF" />
          </div>
          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', background: 'linear-gradient(90deg, #FFFFFF, #93C5FD)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CareerAI
            </span>
            <span style={{ fontSize: '0.75rem', display: 'block', color: '#9CA3AF', marginTop: '-2px' }}>
              Resume Analyzer & Guidance
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <User size={16} color="#A5B4FC" />
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#E0E7FF' }}>
                {user.full_name}
              </span>
            </div>

            <button 
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>
            Welcome! Please sign in to continue.
          </div>
        )}
      </div>
    </nav>
  );
}
