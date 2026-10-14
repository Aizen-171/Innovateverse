import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, ShieldIcon, LightbulbIcon, AwardIcon } from './Icons';

export function DemoBanner() {
  const { user, demoUsers, switchDemoPersona } = useAuth();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return <LightbulbIcon size={14} />;
      case 'contributor': return <UsersIcon size={14} />;
      case 'mentor': return <AwardIcon size={14} />;
      case 'admin': return <ShieldIcon size={14} />;
      default: return null;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'student': return 'Student Founder';
      case 'contributor': return 'Contributor / Builder';
      case 'mentor': return 'Faculty Mentor';
      case 'admin': return 'Campus Admin';
      default: return role;
    }
  };

  return (
    <aside className="persona-banner" aria-label="Demo Persona Switcher">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)', fontWeight: 700 }}>
          ⚡ Hackathon Reviewer Mode:
        </span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
          Test full multi-role workflow instantly:
        </span>
      </div>

      <div className="persona-chips">
        {demoUsers.map((d) => {
          const isActive = user?.id === d.id;
          return (
            <button
              key={d.id}
              onClick={() => switchDemoPersona(d.id)}
              className={`persona-btn ${isActive ? 'active' : ''}`}
              title={`${d.full_name} (${d.department})`}
              aria-pressed={isActive}
            >
              {getRoleIcon(d.role)}
              <span>{d.full_name.split(' ')[0]}</span>
              <span style={{ opacity: 0.65, fontSize: '0.7rem' }}>• {getRoleBadge(d.role)}</span>
              {isActive && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-indigo)', marginLeft: 4 }} />
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
