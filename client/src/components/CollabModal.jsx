import React, { useState } from 'react';
import { CloseIcon, UsersIcon } from './Icons';
import { collabApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function CollabModal({ isOpen, onClose, project, onApplicationSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState('');
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !project) return null;

  const openRoles = Array.isArray(project.open_roles) && project.open_roles.length > 0
    ? project.open_roles
    : ['General Contributor / Developer'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole && openRoles.length > 0) {
      setSelectedRole(openRoles[0]);
    }
    const roleToApply = selectedRole || openRoles[0];

    if (!pitch.trim()) {
      showToast('Please provide a short pitch describing your relevant skills.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await collabApi.apply(project.id, {
        role_applied: roleToApply,
        pitch_message: pitch.trim()
      });

      if (res.success) {
        showToast('Collaboration request submitted! The project lead has been notified.', 'success');
        if (onApplicationSuccess) onApplicationSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit application', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="collab-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UsersIcon size={18} style={{ color: 'var(--accent-indigo)' }} />
            <h3 id="collab-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              Join Project: {project.title}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Connect with <strong>{project.owner_name}</strong> to contribute your skills to this campus initiative.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="role-select">
                Select Open Role <span className="req">*</span>
              </label>
              <select
                id="role-select"
                className="form-select"
                value={selectedRole || openRoles[0]}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {openRoles.map((role, idx) => (
                  <option key={idx} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="pitch-input">
                Your Collaboration Pitch & Skills <span className="req">*</span>
              </label>
              <textarea
                id="pitch-input"
                className="form-textarea"
                rows={4}
                placeholder="Describe your background, tools you use (e.g. ESP32, React, CAD), and what you'd like to build together..."
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                required
              />
              <span className="form-helper">
                Applying as: {user ? `${user.full_name} (${user.department})` : 'Anonymous Student'}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
