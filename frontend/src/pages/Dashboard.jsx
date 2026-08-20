import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, FileCheck, Award, Compass, Sparkles, CheckCircle2, 
  TrendingUp, Cpu, Target, BookOpen, MessageSquareCode, History,
  AlertCircle, ArrowRight, RefreshCw, BarChart2, ShieldCheck, Zap,
  Briefcase, Code2, Clock, Play, FileText, Check, Star, AlertTriangle,
  User, ExternalLink, LayoutDashboard, ChevronRight
} from 'lucide-react';

const API_BASE_URLS = ['http://localhost:8000/api', 'http://127.0.0.1:8000/api'];

// Circular SVG Progress Ring Component for ATS Score
function ATSGaugeChart({ score = 0, size = 130, strokeWidth = 10 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = '#EF4444';
  if (score >= 80) strokeColor = '#10B981';
  else if (score >= 60) strokeColor = '#3B82F6';
  else if (score >= 40) strokeColor = '#F59E0B';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.4s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: size > 120 ? '2rem' : '1.4rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
          {score}%
        </div>
        <div style={{ fontSize: '0.68rem', color: strokeColor, fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Low'}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analyzer' | 'job_match' | 'roadmap' | 'interviews' | 'history'

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Resume Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [uploading, setUploading] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [uploadError, setUploadError] = useState('');

  // Job Matcher State
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  // Career Guidance Roadmap State
  const [roadmapRole, setRoadmapRole] = useState('Full Stack Software Engineer');
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapData, setRoadmapData] = useState(null);

  // AI Interview State
  const [interviewRole, setInterviewRole] = useState('Full Stack Engineer');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  // Helper API fetcher with host fallback
  const apiFetch = async (endpoint, options = {}) => {
    let lastErr = null;
    const token = localStorage.getItem('auth_token');
    const headers = {
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    for (const baseUrl of API_BASE_URLS) {
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'API request failed');
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error('Failed to connect to backend server');
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await apiFetch('/resumes/history');
      setHistory(data || []);
      if (data && data.length > 0 && !currentAnalysis) {
        setCurrentAnalysis(data[0].analysis);
        setResumeText(data[0].analysis?.raw_text || '');
      }
    } catch (err) {
      console.log('History fetch notice:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a PDF or DOCX file to analyze.');
      return;
    }
    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('target_role', targetRole);

    try {
      const data = await apiFetch('/resumes/upload', {
        method: 'POST',
        body: formData
      });
      setCurrentAnalysis(data.analysis);
      setResumeText(data.analysis?.raw_text || '');
      fetchHistory();
      setActiveTab('analyzer');
    } catch (err) {
      setUploadError(err.message || 'Failed to upload and analyze resume.');
    } finally {
      setUploading(false);
    }
  };

  const handleMatchJob = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) return;
    setMatching(true);

    const textToMatch = resumeText || (currentAnalysis?.raw_text) || "Software Engineer with Python, React, SQL and Docker experience.";

    try {
      const data = await apiFetch('/jobs/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: textToMatch,
          job_description: jobDescription
        })
      });
      setMatchResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setMatching(false);
    }
  };

  const handleGetRoadmap = async (roleToFetch = roadmapRole) => {
    setLoadingRoadmap(true);
    try {
      const data = await apiFetch('/guidance/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_role: roleToFetch })
      });
      setRoadmapData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoadmap(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setLoadingQuestions(true);
    setEvalResult(null);
    try {
      const data = await apiFetch('/interviews/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: interviewRole })
      });
      setQuestions(data.questions || []);
      if (data.questions && data.questions.length > 0) {
        setSelectedQuestion(data.questions[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleEvaluateAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim() || !selectedQuestion) return;
    setEvaluating(true);
    try {
      const data = await apiFetch('/interviews/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: selectedQuestion,
          user_answer: userAnswer
        })
      });
      setEvalResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyzer', label: 'ATS Resume Scorer', icon: Award },
    { id: 'job_match', label: 'Job Matcher', icon: Target },
    { id: 'roadmap', label: 'Career Roadmap', icon: Compass },
    { id: 'interviews', label: 'AI Mock Interview', icon: MessageSquareCode },
    { id: 'history', label: 'My History', icon: History, count: history.length }
  ];

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '32px 20px' }} className="animate-fade-in">
      
      {/* --- MAIN FLEX LAYOUT (LEFT VERTICAL SIDEBAR + RIGHT CONTENT) --- */}
      <div style={{
        display: 'flex',
        gap: '28px',
        alignItems: 'flex-start',
        flexDirection: 'row'
      }}>

        {/* ========================================================================= */}
        {/* --- LEFT VERTICAL SIDEBAR --- */}
        {/* ========================================================================= */}
        <aside className="glass-card" style={{
          width: '270px',
          flexShrink: 0,
          padding: '24px 16px',
          position: 'sticky',
          top: '90px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px'
        }}>
          {/* User Profile Info Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            paddingBottom: '20px',
            marginBottom: '20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: '800',
              color: '#FFFFFF',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
              flexShrink: 0
            }}>
              {getInitials(user?.full_name)}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name || 'Candidate'}
              </div>
              <span className="badge-glow-purple" style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginTop: '2px' }}>
                Job Seeker
              </span>
            </div>
          </div>

          {/* Navigation Title */}
          <div style={{
            color: '#64748B',
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0 12px 10px 12px'
          }}>
            Navigation Menu
          </div>

          {/* Vertical Navigation Buttons Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'roadmap' && !roadmapData) handleGetRoadmap();
                    if (tab.id === 'interviews' && questions.length === 0) handleGenerateQuestions();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: isActive 
                      ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.22) 0%, rgba(168, 85, 247, 0.18) 100%)' 
                      : 'transparent',
                    border: '1px solid transparent',
                    borderLeft: isActive ? '3px solid #818CF8' : '3px solid transparent',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                    fontWeight: isActive ? '700' : '500',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'left'
                  }}
                  className="nav-tab-pill"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={19} color={isActive ? '#818CF8' : '#94A3B8'} />
                    <span>{tab.label}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span style={{
                        background: isActive ? '#6366F1' : 'rgba(255,255,255,0.08)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        padding: '2px 7px',
                        borderRadius: '10px'
                      }}>
                        {tab.count}
                      </span>
                    )}
                    <ChevronRight size={14} color={isActive ? '#818CF8' : 'rgba(255,255,255,0.2)'} />
                  </div>
                </button>
              );
            })}
          </div>


        </aside>

        {/* ========================================================================= */}
        {/* --- RIGHT MAIN CONTENT AREA --- */}
        {/* ========================================================================= */}
        <main style={{ flex: 1, minWidth: 0 }}>
          
          {/* Header Banner */}
          <div className="glass-card" style={{
            padding: '28px 32px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(168, 85, 247, 0.16) 50%, rgba(6, 182, 212, 0.1) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A5B4FC', fontWeight: '600', fontSize: '0.82rem', marginBottom: '4px' }}>
                <Sparkles size={15} /> CareerAI Executive Hub
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'analyzer' && 'ATS Resume Scorer & Analyzer'}
                {activeTab === 'job_match' && 'AI Job Description Matcher'}
                {activeTab === 'roadmap' && 'AI Career Guidance Roadmap'}
                {activeTab === 'interviews' && 'AI Technical Mock Interview'}
                {activeTab === 'history' && 'Resume Analysis History'}
              </h1>
              <p style={{ color: '#D1D5DB', fontSize: '0.9rem', maxWidth: '550px', lineHeight: '1.5' }}>
                Analyze your resume, test ATS compatibility scores, match job descriptions, and level up with Gemini AI.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => setActiveTab('analyzer')} 
                className="btn-primary" 
                style={{ padding: '12px 20px', fontSize: '0.88rem' }}
              >
                <UploadCloud size={18} />
                <span>Upload Resume</span>
              </button>

              <button 
                onClick={() => { setActiveTab('roadmap'); handleGetRoadmap(); }} 
                className="btn-social" 
                style={{ padding: '12px 18px', fontSize: '0.88rem', background: 'rgba(255,255,255,0.08)' }}
              >
                <Compass size={18} color="#38BDF8" />
                <span>View Roadmap</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* --- TAB 1: OVERVIEW --- */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="animate-fade-in">
              {/* Quick Metrics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                marginBottom: '28px'
              }}>
                <div className="glass-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      Resumes Analyzed
                    </span>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileCheck size={19} color="#818CF8" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFFFFF', marginBottom: '4px' }}>
                    {history.length}
                  </div>
                  <span className="badge-glow-purple" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px' }}>
                    Saved in SQLite DB
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      Latest ATS Score
                    </span>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={19} color="#34D399" />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: currentAnalysis ? '#34D399' : '#94A3B8', marginBottom: '4px' }}>
                    {currentAnalysis ? `${currentAnalysis.ats_score}%` : 'N/A'}
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
                    {currentAnalysis ? currentAnalysis.target_role : 'Upload a resume to calculate'}
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      Target Role
                    </span>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Briefcase size={19} color="#C084FC" />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {targetRole}
                  </div>
                  <span className="badge-glow-blue" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px' }}>
                    AI Guidance Active
                  </span>
                </div>

                <div className="glass-card" style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase' }}>
                      AI Engine
                    </span>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Zap size={19} color="#22D3EE" />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#22D3EE', marginBottom: '4px' }}>
                    Gemini LLM API
                  </div>
                  <span className="badge-glow-green" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '8px' }}>
                    ✓ API Key Connected
                  </span>
                </div>
              </div>

              {/* Upload Box & Recent Analysis Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Upload Zone */}
                <div className="glass-card" style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UploadCloud size={20} color="#818CF8" /> Instant Resume Parser
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '20px' }}>
                    Upload your PDF or DOCX resume for immediate AI scoring & skill extraction.
                  </p>

                  <form onSubmit={handleUploadResume}>
                    <div className="form-group">
                      <label className="form-label">
                        <span>Target Job Role</span>
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        placeholder="e.g. Full Stack Developer, Data Scientist"
                        required
                      />
                    </div>

                    <div style={{
                      border: '2px dashed rgba(99, 102, 241, 0.4)',
                      borderRadius: '14px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      background: 'rgba(99, 102, 241, 0.05)',
                      marginBottom: '20px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt"
                        id="resume-upload-input"
                        style={{ display: 'none' }}
                        onChange={(e) => setSelectedFile(e.target.files[0])}
                      />
                      <label htmlFor="resume-upload-input" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                        <UploadCloud size={32} color="#818CF8" style={{ marginBottom: '8px' }} />
                        <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '0.9rem', marginBottom: '2px' }}>
                          {selectedFile ? selectedFile.name : 'Click to Browse PDF or DOCX file'}
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Supports PDF, DOCX, or TXT</span>
                      </label>
                    </div>

                    {uploadError && (
                      <div className="alert-error">
                        <AlertCircle size={16} />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploading}
                      className="btn-primary"
                      style={{ width: '100%', padding: '13px', justifyContent: 'center' }}
                    >
                      {uploading ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Parsing with Gemini AI...</span>
                        </>
                      ) : (
                        <>
                          <Award size={18} />
                          <span>Calculate ATS Score</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Latest ATS Analysis Card */}
                <div className="glass-card" style={{ padding: '28px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={20} color="#34D399" /> Latest ATS Analysis
                  </h3>

                  {currentAnalysis ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <ATSGaugeChart score={currentAnalysis.ats_score} size={100} strokeWidth={8} />
                        <div>
                          <div style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '1.05rem', marginBottom: '4px' }}>
                            {currentAnalysis.target_role}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontSize: '0.82rem', fontWeight: '600' }}>
                            <CheckCircle2 size={15} /> {currentAnalysis.formatting_status || 'ATS Parsing Complete'}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Extracted Technical Skills
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(currentAnalysis.found_skills || []).map((s, idx) => (
                            <span key={idx} className="badge-glow-green" style={{ padding: '3px 8px', borderRadius: '16px', fontSize: '0.76rem', fontWeight: '600' }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Recommended Skill Additions
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {(currentAnalysis.missing_skills || []).map((s, idx) => (
                            <span key={idx} className="badge-glow-amber" style={{ padding: '3px 8px', borderRadius: '16px', fontSize: '0.76rem', fontWeight: '600' }}>
                              + {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => setActiveTab('analyzer')}
                        className="btn-social"
                        style={{ width: '100%', padding: '11px', justifyContent: 'center' }}
                      >
                        <span>View Full ATS Score Report</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                      <FileText size={40} color="#475569" style={{ marginBottom: '12px' }} />
                      <p style={{ fontSize: '0.88rem', maxWidth: '280px', margin: '0 auto' }}>
                        No resume uploaded yet. Upload your resume to calculate your ATS Score!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* --- TAB 2: ATS RESUME SCORER --- */}
          {/* ========================================================================= */}
          {activeTab === 'analyzer' && (
            <div className="animate-fade-in">
              {currentAnalysis ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
                  {/* Gauge Card */}
                  <div className="glass-card" style={{ padding: '28px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '20px' }}>
                      ATS Compatibility Score
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                      <ATSGaugeChart score={currentAnalysis.ats_score} size={150} strokeWidth={11} />
                    </div>

                    <h4 style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '1.15rem', marginBottom: '4px' }}>
                      {currentAnalysis.ats_score >= 80 ? '🎯 Outstanding ATS Alignment!' : currentAnalysis.ats_score >= 60 ? '⚡ Good ATS Score' : '⚠️ Needs Optimization'}
                    </h4>
                    <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '20px' }}>
                      Target Role: <strong style={{ color: '#FFFFFF' }}>{currentAnalysis.target_role}</strong>
                    </p>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', fontSize: '0.88rem', marginBottom: '10px' }}>
                        <span>ATS Layout & Structure</span>
                        <span style={{ color: '#34D399', fontWeight: '700' }}>Passed ✓</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', fontSize: '0.88rem', marginBottom: '10px' }}>
                        <span>Keyword Density Score</span>
                        <span style={{ color: '#818CF8', fontWeight: '700' }}>{currentAnalysis.ats_score}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#E2E8F0', fontSize: '0.88rem' }}>
                        <span>Parsing Reliability</span>
                        <span style={{ color: '#22D3EE', fontWeight: '700' }}>Gemini LLM Active</span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Recommendations */}
                  <div className="glass-card" style={{ padding: '28px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={19} color="#34D399" /> Candidate Strengths
                    </h3>
                    <div style={{ marginBottom: '24px' }}>
                      {(currentAnalysis.strengths || []).map((str, idx) => (
                        <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '11px 14px', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.88rem', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <CheckCircle2 size={17} color="#34D399" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={19} color="#818CF8" /> Recommendations
                    </h3>
                    <div>
                      {(currentAnalysis.recommendations || []).map((rec, idx) => (
                        <div key={idx} style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '11px 14px', borderRadius: '10px', color: '#E2E8F0', fontSize: '0.88rem', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <TrendingUp size={17} color="#818CF8" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '44px', textAlign: 'center' }}>
                  <UploadCloud size={48} color="#818CF8" style={{ marginBottom: '14px' }} />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                    No Resume Uploaded Yet
                  </h3>
                  <p style={{ color: '#94A3B8', fontSize: '0.88rem', maxWidth: '400px', margin: '0 auto 20px' }}>
                    Upload your resume in the Overview tab to generate an instant ATS compatibility score breakdown.
                  </p>
                  <button onClick={() => setActiveTab('overview')} className="btn-primary">
                    Upload Resume Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* --- TAB 3: JOB MATCHER --- */}
          {/* ========================================================================= */}
          {activeTab === 'job_match' && (
            <div className="animate-fade-in">
              <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Target size={21} color="#F472B6" /> AI Job Description Matcher
                </h3>
                <p style={{ color: '#94A3B8', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Paste a target job posting description to compare keyword overlap & fit percentage against your resume.
                </p>

                <form onSubmit={handleMatchJob}>
                  <div className="form-group">
                    <label className="form-label">
                      <span>Target Job Description</span>
                    </label>
                    <textarea
                      className="input-field"
                      rows={6}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here (e.g. We are hiring a Senior Full Stack Engineer proficient in React, Node.js, FastAPI, PostgreSQL, Docker, AWS...)"
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" disabled={matching} className="btn-primary" style={{ padding: '12px 24px' }}>
                    {matching ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Matching with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Target size={18} />
                        <span>Calculate Keyword Match %</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {matchResult && (
                <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: '600', textTransform: 'uppercase' }}>
                        Match Fitness Score
                      </div>
                      <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#F472B6' }}>
                        {matchResult.match_percentage}% Match
                      </div>
                    </div>

                    <div style={{ flex: 1, maxWidth: '400px' }}>
                      <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${matchResult.match_percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #F472B6 0%, #A855F7 100%)',
                          borderRadius: '5px'
                        }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    <div>
                      <h4 style={{ color: '#34D399', fontWeight: '700', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} /> Matching Keywords Found
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(matchResult.matching_keywords || []).map((kw, idx) => (
                          <span key={idx} className="badge-glow-green" style={{ padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem' }}>
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ color: '#FCD34D', fontWeight: '700', fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={16} /> Missing Job Keywords
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(matchResult.missing_keywords || []).map((kw, idx) => (
                          <span key={idx} className="badge-glow-amber" style={{ padding: '4px 10px', borderRadius: '16px', fontSize: '0.8rem' }}>
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* --- TAB 4: CAREER ROADMAP --- */}
          {/* ========================================================================= */}
          {activeTab === 'roadmap' && (
            <div className="animate-fade-in">
              <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Compass size={21} color="#38BDF8" /> AI Career Path Roadmap
                    </h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>
                      Custom skill milestones, estimated duration, and recommended masterclasses.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      value={roadmapRole}
                      onChange={(e) => setRoadmapRole(e.target.value)}
                      placeholder="Target Role"
                      style={{ width: '220px', padding: '9px 14px', fontSize: '0.85rem' }}
                    />
                    <button
                      onClick={() => handleGetRoadmap(roadmapRole)}
                      disabled={loadingRoadmap}
                      className="btn-primary"
                      style={{ padding: '9px 18px', fontSize: '0.85rem' }}
                    >
                      {loadingRoadmap ? <RefreshCw size={16} className="animate-spin" /> : 'Generate'}
                    </button>
                  </div>
                </div>

                {loadingRoadmap ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                    <RefreshCw size={32} className="animate-spin" style={{ marginBottom: '12px', color: '#38BDF8' }} />
                    <div>Building tailored career roadmap with Gemini AI...</div>
                  </div>
                ) : roadmapData ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                      {(roadmapData.milestones || []).map((m) => (
                        <div key={m.step} className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #38BDF8' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span className="badge-glow-blue" style={{ fontSize: '0.75rem', fontWeight: '800', padding: '2px 8px', borderRadius: '6px' }}>
                              MILESTONE {m.step}
                            </span>
                            <span style={{ color: '#94A3B8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={14} /> {m.duration}
                            </span>
                          </div>

                          <h4 style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '1rem', marginBottom: '10px' }}>
                            {m.title}
                          </h4>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(m.skills || []).map((sk, idx) => (
                              <span key={idx} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#E2E8F0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={18} color="#C084FC" /> Recommended Masterclasses
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {(roadmapData.recommended_courses || []).map((c, idx) => (
                        <div key={idx} style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '14px 18px', borderRadius: '12px', color: '#E0E7FF', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <BookOpen size={17} color="#C084FC" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* --- TAB 5: AI MOCK INTERVIEW --- */}
          {/* ========================================================================= */}
          {activeTab === 'interviews' && (
            <div className="animate-fade-in">
              <div className="glass-card" style={{ padding: '28px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessageSquareCode size={21} color="#A855F7" /> AI Technical Mock Interview
                    </h3>
                    <p style={{ color: '#94A3B8', fontSize: '0.88rem' }}>
                      Practice real interview questions and receive strict AI scoring with step-by-step suggestions.
                    </p>
                  </div>

                  <button onClick={handleGenerateQuestions} disabled={loadingQuestions} className="btn-social" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
                    {loadingQuestions ? <RefreshCw size={16} className="animate-spin" /> : 'Generate New Questions'}
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>Select Interview Question</span>
                  </label>
                  <select
                    className="input-field"
                    value={selectedQuestion}
                    onChange={(e) => setSelectedQuestion(e.target.value)}
                    style={{ padding: '12px', fontSize: '0.92rem' }}
                  >
                    {questions.map((q, idx) => (
                      <option key={idx} value={q} style={{ background: '#0F172A', color: '#FFFFFF' }}>
                        Q{idx + 1}: {q}
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleEvaluateAnswer}>
                  <div className="form-group">
                    <label className="form-label">
                      <span>Your Detailed Explanation</span>
                      <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{userAnswer.split(' ').filter(Boolean).length} WORDS</span>
                    </label>
                    <textarea
                      className="input-field"
                      rows={6}
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Provide a detailed, step-by-step explanation..."
                      required
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" disabled={evaluating} className="btn-primary" style={{ padding: '12px 24px' }}>
                    {evaluating ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>Evaluating with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>Grade Answer with Gemini AI</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {evalResult && (
                <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    <ATSGaugeChart score={evalResult.score} size={100} strokeWidth={8} />
                    <div>
                      <h4 style={{ color: '#FFFFFF', fontWeight: '700', fontSize: '1.15rem', marginBottom: '4px' }}>
                        Interview Score: {evalResult.score}/100
                      </h4>
                      <p style={{ color: '#D1D5DB', fontSize: '0.88rem', maxWidth: '600px', lineHeight: '1.5' }}>
                        {evalResult.feedback}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
                    <div>
                      <h5 style={{ color: '#34D399', fontWeight: '700', fontSize: '0.92rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} /> Key Strengths
                      </h5>
                      {(evalResult.strengths || []).map((s, idx) => (
                        <div key={idx} style={{ color: '#E2E8F0', fontSize: '0.85rem', marginBottom: '4px' }}>
                          • {s}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h5 style={{ color: '#818CF8', fontWeight: '700', fontSize: '0.92rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={15} /> Suggestions
                      </h5>
                      {(evalResult.suggestions || []).map((s, idx) => (
                        <div key={idx} style={{ color: '#E2E8F0', fontSize: '0.85rem', marginBottom: '4px' }}>
                          • {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* --- TAB 6: MY HISTORY --- */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="animate-fade-in">
              <div className="glass-card" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#FFFFFF', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={20} color="#818CF8" /> Resume Analysis History
                </h3>

                {loadingHistory ? (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    <RefreshCw size={26} className="animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#E2E8F0', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94A3B8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '12px' }}>Filename</th>
                          <th style={{ padding: '12px' }}>Target Role</th>
                          <th style={{ padding: '12px' }}>ATS Score</th>
                          <th style={{ padding: '12px' }}>Date Uploaded</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '12px', fontWeight: '600', color: '#FFFFFF' }}>📄 {item.filename}</td>
                            <td style={{ padding: '12px', color: '#A5B4FC' }}>{item.target_role}</td>
                            <td style={{ padding: '12px' }}>
                              <span className={item.ats_score >= 70 ? "badge-glow-green" : "badge-glow-amber"} style={{ padding: '3px 10px', borderRadius: '12px', fontWeight: '700', fontSize: '0.82rem' }}>
                                {item.ats_score}%
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: '#94A3B8', fontSize: '0.82rem' }}>
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setCurrentAnalysis(item.analysis);
                                  setActiveTab('analyzer');
                                }}
                                className="btn-social"
                                style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                              >
                                View Report
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    No analysis history stored in SQLite DB yet.
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
