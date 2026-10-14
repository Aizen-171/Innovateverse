import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SparklesIcon, PlusIcon, RocketIcon, CompassIcon, AwardIcon, TargetIcon } from './Icons';

export function Navbar({ activePage, setActivePage, openAuthModal, openProfileModal }) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isReviewer = user && (user.role === 'mentor' || user.role === 'admin');

  const navItems = [
    { id: 'landing', label: 'Overview', icon: <RocketIcon size={16} /> },
    { id: 'explorer', label: 'Explore Ideas', icon: <CompassIcon size={16} /> },
    { id: 'challenges', label: 'Campus Challenges', icon: <TargetIcon size={16} /> },
    { id: 'workspace', label: 'Project Workspace', icon: <SparklesIcon size={16} /> },
    ...(isReviewer ? [{ id: 'reviews', label: 'Reviews & Incubation', icon: <AwardIcon size={16} /> }] : []),
    { id: 'showcase', label: 'Showcase', icon: <AwardIcon size={16} /> }
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="navbar" role="banner">
      <div className="container nav-container">
        {/* Brand */}
        <button
          onClick={() => handleNavClick('landing')}
          className="nav-brand"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="InnovateVerse Home"
        >
          <div className="nav-logo-icon">
            <SparklesIcon size={18} />
          </div>
          <span style={{ color: 'var(--text-primary)' }}>
            INNOVATE<span style={{ color: 'var(--accent-indigo)' }}>VERSE</span>
          </span>
        </button>

        {/* Desktop Nav Items */}
        <nav className="desktop-nav" aria-label="Main Navigation">
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => handleNavClick('submit-idea')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusIcon size={16} />
            <span>Submit Idea</span>
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={() => openProfileModal && openProfileModal()}
                title="Edit Student Skill Profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.65rem',
                  background: 'var(--bg-surface-raised)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  color: 'inherit'
                }}
              >
                <img
                  src={user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt={user.full_name}
                  style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.full_name.split(' ')[0]}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-indigo)' }}>✎</span>
              </button>
              <button
                onClick={logout}
                className="btn btn-ghost btn-sm"
                title="Log Out"
                style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button onClick={openAuthModal} className="btn btn-secondary btn-sm">
              Sign In
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-toggle btn btn-ghost btn-sm"
            style={{ display: 'none' }}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Drawer (visible on small screens) */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'var(--nav-height)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface-raised)',
            borderBottom: '1px solid var(--border-medium)',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`nav-link ${activePage === item.id ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.5rem 0' }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
