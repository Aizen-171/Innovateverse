import React, { useState } from 'react';
import { CloseIcon, AwardIcon } from './Icons';
import { reviewApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export function ReviewModal({ isOpen, onClose, project, onReviewSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [feasibility, setFeasibility] = useState(4);
  const [impact, setImpact] = useState(5);
  const [technical, setTechnical] = useState(4);
  const [presentation, setPresentation] = useState(4);
  const [comments, setComments] = useState('');
  const [badge, setBadge] = useState('Faculty Approved Innovation');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !project) return null;

  const totalScore = Number(feasibility) + Number(impact) + Number(technical) + Number(presentation);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      showToast('Please provide written feedback for the student innovators.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reviewApi.add(project.id, {
        feasibility_score: feasibility,
        impact_score: impact,
        technical_score: technical,
        presentation_score: presentation,
        comments: comments.trim(),
        endorsement_badge: badge
      });

      if (res.success) {
        showToast('Faculty review and endorsement successfully published!', 'success');
        if (onReviewSuccess) onReviewSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AwardIcon size={18} style={{ color: 'var(--accent-violet)' }} />
            <h3 id="review-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              Faculty Mentorship Evaluation
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Evaluating: {project.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                Lead Student: {project.owner_name} • Reviewing as: {user ? `${user.full_name} (${user.department})` : 'Faculty Mentor'}
              </div>
            </div>

            {/* Rubric Matrix */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>1. Practical Feasibility & Implementation:</span>
                  <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>{feasibility} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={feasibility}
                  onChange={(e) => setFeasibility(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>2. Campus Need & Measurable Impact:</span>
                  <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>{impact} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>3. Technical Rigor & Architecture:</span>
                  <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>{technical} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={technical}
                  onChange={(e) => setTechnical(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>4. Prototype Presentation & Execution:</span>
                  <span style={{ color: 'var(--accent-indigo)', fontWeight: 700 }}>{presentation} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={presentation}
                  onChange={(e) => setPresentation(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-indigo)' }}
                />
              </div>
            </div>

            {/* Total Score Output */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Cumulative Rubric Score:
              </span>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-indigo)' }}>
                {totalScore} / 20
              </span>
            </div>

            {/* Badge Endorsement */}
            <div className="form-group">
              <label className="form-label" htmlFor="badge-select">
                Faculty Endorsement Badge
              </label>
              <select
                id="badge-select"
                className="form-select"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              >
                <option value="Faculty Approved Innovation">⭐ Faculty Approved Innovation</option>
                <option value="Top Campus Impact">🏆 Top Campus Impact</option>
                <option value="Lab Grant Eligible">🔬 Lab Grant Eligible</option>
                <option value="Departmental Honors">🎖️ Departmental Honors</option>
              </select>
            </div>

            {/* Comments */}
            <div className="form-group">
              <label className="form-label" htmlFor="review-comments">
                Mentor Guidance & Next Actions <span className="req">*</span>
              </label>
              <textarea
                id="review-comments"
                className="form-textarea"
                rows={3}
                placeholder="Detail technical strengths, remaining risk factors, and next milestones required for university lab grant support..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Publish Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
