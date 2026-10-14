import React from 'react';
import { SparklesIcon, ShieldIcon } from './Icons';

export function Footer({ setActivePage }) {
  return (
    <footer style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface)', padding: '3.5rem 0 2rem' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="nav-logo-icon" style={{ width: 28, height: 28 }}>
                <SparklesIcon size={16} />
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem' }}>
                INNOVATE<span style={{ color: 'var(--accent-indigo)' }}>VERSE</span>
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 300 }}>
              From campus problems to real-world impact. Bridging student innovators, faculty mentorship, and verified university challenges.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
              Platform Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: 0 }}>
              <li>
                <button onClick={() => { setActivePage('explorer'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', padding: 0 }}>
                  Explore Projects & Ideas
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('challenges'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', padding: 0 }}>
                  Campus Challenges Feed
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('submit-idea'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', padding: 0 }}>
                  Submit Project Proposal
                </button>
              </li>
              <li>
                <button onClick={() => { setActivePage('showcase'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.88rem', cursor: 'pointer', padding: 0 }}>
                  Campus Innovation Showcase
                </button>
              </li>
            </ul>
          </div>

          {/* Architecture / Integrity */}
          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
              System Integrity
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldIcon size={14} style={{ color: 'var(--color-success)' }} />
                <span>Server-Enforced Role RBAC</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <SparklesIcon size={14} style={{ color: 'var(--accent-violet)' }} />
                <span>Deterministic AI Fallback Engine</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>SQL</span>
                <span>Parameterized Relational SQLite</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          <div>
            © {new Date().getFullYear()} InnovateVerse Platform. Built for University Innovation Hub & Hackathon Showcase.
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span>Zero Fabricated Statistics</span>
            <span>•</span>
            <span>WCAG 2.1 AA Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
