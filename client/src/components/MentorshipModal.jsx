import React, { useState, useEffect } from 'react';
import { CloseIcon, AwardIcon } from './Icons';
import { mentorshipApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function MentorshipModal({ isOpen, onClose, project, requestToRespond = null, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isRespondMode = !!requestToRespond;

  // Request fields
  const [mentors, setMentors] = useState([]);
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [assistanceNeeded, setAssistanceNeeded] = useState('');

  // Respond fields
  const [status, setStatus] = useState(requestToRespond?.status || 'Accepted');
  const [mentorNotes, setMentorNotes] = useState(requestToRespond?.mentor_notes || '');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !isRespondMode) {
      async function loadMentors() {
        try {
          const res = await mentorshipApi.getMentors();
          if (res.success && res.mentors.length > 0) {
            setMentors(res.mentors);
            setSelectedMentorId(res.mentors[0].id);
          }
        } catch (err) {
          console.warn('Could not load mentors:', err);
        }
      }
      loadMentors();
    }
  }, [isOpen, isRespondMode]);

  if (!isOpen) return null;

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMentorId || !assistanceNeeded.trim()) {
      showToast('Please select a faculty mentor and describe the assistance needed.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await mentorshipApi.request({
        project_id: project.id,
        mentor_id: selectedMentorId,
        assistance_needed: assistanceNeeded.trim()
      });

      if (res.success) {
        showToast('Mentorship request sent! The faculty mentor has been notified.', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to request mentorship', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await mentorshipApi.respond(requestToRespond.id, {
        status,
        mentor_notes: mentorNotes.trim()
      });

      if (res.success) {
        showToast(`Mentorship request marked as '${status}'!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update mentorship request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="mentorship-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AwardIcon size={18} style={{ color: 'var(--accent-violet)' }} />
            <h3 id="mentorship-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              {isRespondMode ? 'Faculty Mentorship Direction' : 'Request Faculty Mentorship'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {isRespondMode ? (
          <form onSubmit={handleRespondSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {requestToRespond.project_title}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Student Lead: {requestToRespond.student_name} ({requestToRespond.student_department})
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Assistance Requested:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0', background: 'var(--bg-surface-input)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  "{requestToRespond.assistance_needed}"
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="men-status">Mentorship Status</label>
                <select
                  id="men-status"
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Accepted">Accepted (Active Mentorship)</option>
                  <option value="In Progress">In Progress (Reviewing Milestones)</option>
                  <option value="Completed">Completed (Project Guided)</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="men-notes">Faculty Guidance Notes & Recommendations</label>
                <textarea
                  id="men-notes"
                  className="form-textarea"
                  rows={3}
                  placeholder="Record guidance, office hours advice, lab resources, or milestone checkpoints..."
                  value={mentorNotes}
                  onChange={(e) => setMentorNotes(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Saving...' : 'Update Mentorship'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRequestSubmit}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Connect with an experienced faculty mentor for guidance on <strong>{project?.title}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="mentor-select">
                  Select Faculty Mentor <span className="req">*</span>
                </label>
                <select
                  id="mentor-select"
                  className="form-select"
                  value={selectedMentorId}
                  onChange={(e) => setSelectedMentorId(e.target.value)}
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} — {m.department} ({m.skills?.slice(0, 3).join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="men-assist">
                  Specific Assistance & Guidance Needed <span className="req">*</span>
                </label>
                <textarea
                  id="men-assist"
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe your current architectural bottlenecks, experimental tests you need advice on, or lab equipment access..."
                  value={assistanceNeeded}
                  onChange={(e) => setAssistanceNeeded(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Sending...' : 'Send Mentorship Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
