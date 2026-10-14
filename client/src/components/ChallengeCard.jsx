import React from 'react';
import { TargetIcon, AwardIcon, ArrowRightIcon } from './Icons';

export function ChallengeCard({ challenge, onSelect, onSubmitProposal }) {
  const getDiffColor = (diff) => {
    switch (diff) {
      case 'Beginner': return 'var(--color-success)';
      case 'Intermediate': return 'var(--color-warning)';
      case 'Advanced': return 'var(--color-danger)';
      default: return 'var(--accent-indigo)';
    }
  };

  return (
    <article className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Category & Grant Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className="badge badge-cat">
          {challenge.category}
        </span>
        {challenge.grant_amount && (
          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <AwardIcon size={13} />
            {challenge.grant_amount}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        onClick={() => onSelect(challenge)}
        style={{
          fontSize: '1.25rem',
          marginBottom: '0.65rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          lineHeight: 1.3
        }}
      >
        {challenge.title}
      </h3>

      {/* Summary */}
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1, lineHeight: 1.6 }}>
        {challenge.summary}
      </p>

      {/* Sponsor & Department Metadata */}
      <div style={{ background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '0.35rem' }}>
          <span>Sponsor:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{challenge.sponsor}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          <span>Difficulty:</span>
          <span style={{ color: getDiffColor(challenge.difficulty), fontWeight: 600 }}>{challenge.difficulty}</span>
        </div>
      </div>

      {/* Card Actions */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
          {challenge.project_count || 0} proposals submitted
        </span>

        <button
          onClick={() => onSubmitProposal ? onSubmitProposal(challenge) : onSelect(challenge)}
          className="btn btn-primary btn-sm"
          style={{ padding: '0.45rem 0.85rem' }}
        >
          <span>Submit Proposal</span>
          <ArrowRightIcon size={14} />
        </button>
      </div>
    </article>
  );
}
