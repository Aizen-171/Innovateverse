import React, { useState } from 'react';
import { CloseIcon, ShieldIcon } from './Icons';
import { useAuth } from '../context/AuthContext';

export function AuthModal({ isOpen, onClose }) {
  const { login, register, demoUsers, switchDemoPersona } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Computer Science');
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(loginEmail, loginPassword);
    setLoading(false);
    if (success) onClose();
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
    const success = await register({
      full_name: name,
      email,
      department,
      year_of_study: Number(yearOfStudy),
      password,
      skills: skillsArray
    });
    setLoading(false);
    if (success) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldIcon size={18} style={{ color: 'var(--accent-indigo)' }} />
            <h3 id="auth-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              {tab === 'login' ? 'Sign In to InnovateVerse' : 'Create Student Account'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Quick Reviewer Demo Switcher */}
        <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            ⚡ Hackathon One-Click Demo Access:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {demoUsers.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={async () => {
                  await switchDemoPersona(d.id);
                  onClose();
                }}
                className="persona-btn"
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                <span>{d.full_name.split(' ')[0]}</span>
                <span style={{ opacity: 0.6 }}>({d.role})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
          <button
            type="button"
            onClick={() => setTab('login')}
            className="btn btn-ghost btn-sm"
            style={{
              flex: 1,
              borderRadius: 0,
              borderBottom: tab === 'login' ? '2px solid var(--accent-indigo)' : 'none',
              fontWeight: tab === 'login' ? 700 : 500,
              color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className="btn btn-ghost btn-sm"
            style={{
              flex: 1,
              borderRadius: 0,
              borderBottom: tab === 'register' ? '2px solid var(--accent-indigo)' : 'none',
              fontWeight: tab === 'register' ? 700 : 500,
              color: tab === 'register' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            Register
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Campus Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. maya@campus.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <span className="form-helper">
                  Default test password: <code>Password123!</code>
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name <span className="req">*</span></label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="Maya Lin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">University Email <span className="req">*</span></label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="student@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-dept">Department</label>
                  <select
                    id="reg-dept"
                    className="form-select"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical / Mechatronics">Mechanical / Mechatronics</option>
                    <option value="Design & Media">Design & Media</option>
                    <option value="Business & Incubation">Business & Incubation</option>
                    <option value="Environmental Science">Environmental Science</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-year">Year of Study</label>
                  <select
                    id="reg-year"
                    className="form-select"
                    value={yearOfStudy}
                    onChange={(e) => setYearOfStudy(Number(e.target.value))}
                  >
                    <option value={1}>1st Year</option>
                    <option value={2}>2nd Year</option>
                    <option value={3}>3rd Year</option>
                    <option value={4}>4th Year</option>
                    <option value={5}>Graduate / Masters</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-skills">Technical Skills (comma separated)</label>
                <input
                  id="reg-skills"
                  type="text"
                  className="form-input"
                  placeholder="React, Python, Figma, Embedded C..."
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-pw">Create Password <span className="req">*</span></label>
                <input
                  id="reg-pw"
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Creating...' : 'Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
