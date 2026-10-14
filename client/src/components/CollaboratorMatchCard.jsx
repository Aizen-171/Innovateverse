import React from 'react';
import { UsersIcon, CheckCircleIcon, ArrowRightIcon } from './Icons';

export function CollaboratorMatchCard({ recommendation, onInvite }) {
  const { student, compatibilityScore, matchReasons = [], matchingSkills = [], applicationStatus } = recommendation;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 65) return 'var(--accent-indigo)';
    return 'var(--text-secondary)';
  };

  return (
    <div
      className="card card-interactive"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
        background: 'var(--bg-surface)'
      }}
    >
      <div>
        {/* Candidate Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src={student.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
              alt={student.full_name}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {student.full_name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {student.department} • Year {student.year_of_study || 1}
              </div>
            </div>
          </div>

          {/* Compatibility Score */}
          <div
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0,0,0,0.3)',
              border: `1px solid ${getScoreColor(compatibilityScore)}`,
              color: getScoreColor(compatibilityScore),
              fontWeight: 800,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <span>{compatibilityScore}% Match</span>
          </div>
        </div>

        {/* Bio */}
        {student.bio && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {student.bio}
          </p>
        )}

        {/* Transparent Match Reasons */}
        <div style={{ background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', marginBottom: '0.85rem', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            Why They Match:
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {matchReasons.slice(0, 3).map((r, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                <span style={{ color: 'var(--accent-indigo)' }}>•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Skills Chips */}
        {student.skills?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '1rem' }}>
            {student.skills.slice(0, 4).map((s, idx) => (
              <span key={idx} className="badge badge-skill">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
          ⏱ {student.availability || 'Available'}
        </span>

        {applicationStatus === 'accepted' ? (
          <span className="badge badge-showcase-ready" style={{ fontSize: '0.75rem' }}>
            ✓ Team Member
          </span>
        ) : applicationStatus === 'pending' ? (
          <span className="badge badge-in-progress" style={{ fontSize: '0.75rem' }}>
            Application Pending
          </span>
        ) : (
          <button
            onClick={() => onInvite && onInvite(student)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
          >
            <span>Invite to Team</span>
            <ArrowRightIcon size={12} />
          </button>
        )}
      </div>
    </div>
  );
}
