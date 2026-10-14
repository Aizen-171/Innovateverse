import React from 'react';
import { HeartIcon, UsersIcon, CheckCircleIcon, ArrowRightIcon } from './Icons';

export function ProjectCard({ project, onSelect, onUpvote, userHasUpvoted = false }) {
  const getStageClass = (stage) => {
    switch (stage) {
      case 'Ideation': return 'badge-ideation';
      case 'Prototype': return 'badge-prototype';
      case 'In Progress': return 'badge-in-progress';
      case 'Showcase Ready': return 'badge-showcase-ready';
      default: return 'badge-cat';
    }
  };

  const openRolesCount = Array.isArray(project.open_roles) ? project.open_roles.length : 0;
  const skills = Array.isArray(project.skills_needed) ? project.skills_needed.slice(0, 3) : [];

  return (
    <article className="card card-interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Header: Category & Stage */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        <span className="badge badge-cat">
          {project.category}
        </span>
        <span className={`badge ${getStageClass(project.stage)}`}>
          {project.stage}
        </span>
      </div>

      {/* Title & Tagline */}
      <h3
        onClick={() => onSelect(project)}
        style={{
          fontSize: '1.2rem',
          marginBottom: '0.5rem',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          transition: 'color var(--transition-fast)'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-indigo)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
      >
        {project.title}
      </h3>

      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', flex: 1, lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {project.tagline || project.problem_statement}
      </p>

      {/* Recruiting Indicator & Skills Chips */}
      <div style={{ marginBottom: '1.25rem' }}>
        {openRolesCount > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-success)', fontWeight: 600 }}>
              Recruiting: {project.open_roles.join(', ')}
            </span>
          </div>
        ) : null}

        {skills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {skills.map((skill, idx) => (
              <span key={idx} className="badge badge-skill">
                {skill}
              </span>
            ))}
            {project.skills_needed?.length > 3 && (
              <span className="badge badge-skill" style={{ opacity: 0.7 }}>
                +{project.skills_needed.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Owner Info & Actions */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        {/* Owner Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img
            src={project.owner_avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
            alt={project.owner_name}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.owner_name}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {project.owner_department}
            </span>
          </div>
        </div>

        {/* Upvotes & Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onUpvote && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpvote(project.id);
              }}
              className="btn btn-ghost btn-sm"
              style={{
                padding: '0.3rem 0.55rem',
                color: userHasUpvoted ? 'var(--color-danger)' : 'var(--text-tertiary)',
                gap: '0.3rem'
              }}
              title="Upvote project"
              aria-label="Upvote project"
            >
              <HeartIcon size={15} filled={userHasUpvoted} />
              <span style={{ fontSize: '0.78rem' }}>{project.upvotes_count || 0}</span>
            </button>
          )}

          <button
            onClick={() => onSelect(project)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
          >
            <span>View</span>
            <ArrowRightIcon size={13} />
          </button>
        </div>
      </div>
    </article>
  );
}
