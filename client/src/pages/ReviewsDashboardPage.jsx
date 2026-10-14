import React, { useState, useEffect, useCallback } from 'react';
import { AwardIcon, ShieldIcon, CheckCircleIcon, SparklesIcon, CloseIcon } from '../components/Icons';
import { projectReviewApi, fundingApi, expenseApi, mentorshipApi } from '../services/api';
import { FundingModal } from '../components/FundingModal';
import { ExpenseModal } from '../components/ExpenseModal';
import { MentorshipModal } from '../components/MentorshipModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ReviewsDashboardPage({ setActivePage }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('projects'); // 'projects' | 'funding' | 'expenses' | 'mentorship'
  const [loading, setLoading] = useState(true);

  // Queues
  const [projectQueue, setProjectQueue] = useState([]);
  const [fundingQueue, setFundingQueue] = useState([]);
  const [expenseQueue, setExpenseQueue] = useState([]);
  const [mentorshipQueue, setMentorshipQueue] = useState([]);

  // Active Modals
  const [selectedFunding, setSelectedFunding] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedMentorship, setSelectedMentorship] = useState(null);

  // Project Decision Modal state
  const [decisionModalProject, setDecisionModalProject] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState('Approved');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);

  const loadAllQueues = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, fndRes, expRes, menRes] = await Promise.allSettled([
        projectReviewApi.getQueue(),
        fundingApi.getQueue(),
        expenseApi.getQueue(),
        mentorshipApi.getMy()
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.success) {
        setProjectQueue(projRes.value.projects);
      }
      if (fndRes.status === 'fulfilled' && fndRes.value?.success) {
        setFundingQueue(fndRes.value.fundingQueue);
      }
      if (expRes.status === 'fulfilled' && expRes.value?.success) {
        setExpenseQueue(expRes.value.expenseQueue);
      }
      if (menRes.status === 'fulfilled' && menRes.value?.success) {
        setMentorshipQueue(menRes.value.requests);
      }
    } catch (err) {
      console.warn('Error loading review queues:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllQueues();
  }, [loadAllQueues]);

  const handleOpenDecisionModal = (project) => {
    setDecisionModalProject(project);
    setDecisionStatus(project.review_status === 'Submitted' ? 'Approved' : project.review_status);
    setDecisionNotes(project.reviewer_decision_notes || '');
  };

  const handleRecordProjectDecision = async (e) => {
    e.preventDefault();
    if (!decisionNotes.trim()) {
      showToast('Please provide review notes explaining the selection decision.', 'error');
      return;
    }

    setDecisionLoading(true);
    try {
      const res = await projectReviewApi.updateStatus(decisionModalProject.id, decisionStatus, decisionNotes.trim());
      if (res.success) {
        showToast(`Project selection decision recorded: ${decisionStatus}!`, 'success');
        setDecisionModalProject(null);
        loadAllQueues();
      }
    } catch (err) {
      showToast(err.message || 'Failed to record decision', 'error');
    } finally {
      setDecisionLoading(false);
    }
  };

  const isAuthorized = user && (user.role === 'mentor' || user.role === 'admin');

  if (!isAuthorized) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <ShieldIcon size={36} style={{ color: 'var(--color-warning)', marginBottom: '1rem' }} />
        <h2>Authorized Reviewer Access Only</h2>
        <p style={{ maxWidth: 500, margin: '0 auto 1.5rem' }}>
          This command center is reserved for faculty mentors and grant administrators. Use the top persona switcher to switch to <strong>Dr. Sarah Rao</strong> or <strong>Marcus Vance</strong> to test this module.
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-violet)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
            <AwardIcon size={14} />
            <span>Human Review & Oversight Command Center</span>
          </div>
          <h1 style={{ margin: 0 }}>Reviewer & Incubation Dashboard</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-mentor" style={{ fontSize: '0.82rem', padding: '0.4rem 0.75rem' }}>
            Active Reviewer: {user.full_name} ({user.role})
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '2rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem'
        }}
      >
        {[
          { id: 'projects', label: `Project Selection (${projectQueue.length})` },
          { id: 'funding', label: `Grant Approvals (${fundingQueue.length})` },
          { id: 'expenses', label: `Expense Bills (${expenseQueue.length})` },
          { id: 'mentorship', label: `Mentorship Requests (${mentorshipQueue.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary btn-sm' : 'btn-ghost btn-sm'}`}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PROJECT SELECTION QUEUE */}
      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Evaluate submitted student proposals. AI evaluations are displayed as supporting information; final project selection rests with human reviewers.
            </p>
          </div>

          {projectQueue.map((p) => {
            const hasAi = !!p.ai_readiness_score;
            return (
              <div
                key={p.id}
                className="card card-interactive"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  padding: '1.5rem',
                  background: 'var(--bg-surface)'
                }}
              >
                <div style={{ flex: 1, minWidth: 320 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-cat">{p.category}</span>
                    <span
                      className="badge"
                      style={{
                        background: p.review_status === 'Approved' ? 'rgba(16, 185, 129, 0.15)' : p.review_status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: p.review_status === 'Approved' ? '#34d399' : p.review_status === 'Rejected' ? '#fca5a5' : '#fbbf24'
                      }}
                    >
                      Status: {p.review_status}
                    </span>
                    {hasAi && (
                      <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc' }}>
                        <SparklesIcon size={12} />
                        AI Readiness: {p.ai_readiness_score}/100
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    {p.tagline}
                  </p>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    Founder: <strong>{p.owner_name}</strong> ({p.owner_department}) • Submitted: {p.created_at?.split('T')[0] || 'Recent'}
                  </div>

                  {p.reviewer_decision_notes && (
                    <div style={{ marginTop: '0.75rem', background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', fontSize: '0.8rem' }}>
                      <strong style={{ color: 'var(--accent-indigo)' }}>Recorded Reviewer Decision:</strong> {p.reviewer_decision_notes}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenDecisionModal(p)}
                    className="btn btn-primary btn-sm"
                  >
                    <span>Record Selection Decision</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GRANT FUNDING QUEUE */}
      {activeTab === 'funding' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Review project funding proposals, audit itemized budgets, and record approved or disbursed amounts.
          </p>

          {fundingQueue.map((fnd) => (
            <div
              key={fnd.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.25rem',
                padding: '1.5rem',
                background: 'var(--bg-surface)'
              }}
            >
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-cat">{fnd.project_category}</span>
                  <span
                    className="badge"
                    style={{
                      background: fnd.status === 'Approved' || fnd.status === 'Released' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: fnd.status === 'Approved' || fnd.status === 'Released' ? '#34d399' : '#fbbf24'
                    }}
                  >
                    {fnd.status}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                  {fnd.project_title} — Grant Request
                </h3>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  Requested: ${fnd.requested_amount?.toLocaleString()} {fnd.approved_amount > 0 && `(Approved: $${fnd.approved_amount?.toLocaleString()})`}
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong>Purpose:</strong> {fnd.purpose}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Submitter: {fnd.student_name} ({fnd.student_department}) • {fnd.itemized_budget?.length || 0} Itemized Budget Lines
                </div>
              </div>

              <button
                onClick={() => setSelectedFunding(fnd)}
                className="btn btn-primary btn-sm"
              >
                <span>Review & Decide</span>
              </button>
            </div>
          ))}

          {fundingQueue.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
              No pending funding proposals.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXPENSE BILLS VERIFICATION QUEUE */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Audit student expense records, check attached bills/receipts, and verify eligible grant utilization.
          </p>

          {expenseQueue.map((exp) => (
            <div
              key={exp.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.25rem',
                padding: '1.5rem',
                background: 'var(--bg-surface)'
              }}
            >
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-cat">{exp.category}</span>
                  <span
                    className="badge"
                    style={{
                      background: exp.status === 'Verified' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: exp.status === 'Verified' ? '#34d399' : '#fbbf24'
                    }}
                  >
                    {exp.status}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 500, marginBottom: '0.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{exp.title}</h3>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                    ${exp.amount?.toFixed(2)}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Vendor: <strong>{exp.vendor}</strong> • Date: {exp.expense_date} • Project: <strong>{exp.project_title}</strong>
                </div>

                {exp.receipt_filename && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', marginBottom: '0.4rem' }}>
                    📎 {exp.receipt_filename}
                  </div>
                )}

                <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                  Submitted by: {exp.submitter_name} ({exp.submitter_department})
                </div>
              </div>

              <button
                onClick={() => setSelectedExpense(exp)}
                className="btn btn-secondary btn-sm"
              >
                <span>Verify Bill</span>
              </button>
            </div>
          ))}

          {expenseQueue.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
              No expenses in queue.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MENTORSHIP REQUESTS QUEUE */}
      {activeTab === 'mentorship' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Mentorship applications addressed to you from student project leaders.
          </p>

          {mentorshipQueue.map((men) => (
            <div
              key={men.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.25rem',
                padding: '1.5rem',
                background: 'var(--bg-surface)'
              }}
            >
              <div style={{ flex: 1, minWidth: 320 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span className="badge badge-prototype">{men.project_category}</span>
                  <span className="badge badge-mentor">Status: {men.status}</span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                  {men.project_title}
                </h3>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-surface-raised)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', margin: '0.5rem 0' }}>
                  "{men.assistance_needed}"
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Student Lead: {men.student_name} ({men.student_department})
                </div>
              </div>

              <button
                onClick={() => setSelectedMentorship(men)}
                className="btn btn-primary btn-sm"
              >
                <span>Respond & Guide</span>
              </button>
            </div>
          ))}

          {mentorshipQueue.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-tertiary)' }}>
              No pending mentorship requests.
            </div>
          )}
        </div>
      )}

      {/* Project Decision Modal */}
      {decisionModalProject && (
        <div className="modal-backdrop" onClick={() => setDecisionModalProject(null)} role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
                Record Project Selection Decision
              </h3>
              <button onClick={() => setDecisionModalProject(null)} className="btn btn-ghost btn-sm">
                <CloseIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordProjectDecision}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{decisionModalProject.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Lead: {decisionModalProject.owner_name}</div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dec-status">Selection Decision</label>
                  <select
                    id="dec-status"
                    className="form-select"
                    value={decisionStatus}
                    onChange={(e) => setDecisionStatus(e.target.value)}
                  >
                    <option value="Approved">Approved (Selected for Campus Incubation)</option>
                    <option value="Under Review">Under Review (Committee In Progress)</option>
                    <option value="Revision Requested">Revision Requested (Needs Resubmission)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dec-notes">Decision Notes & Feedback <span className="req">*</span></label>
                  <textarea
                    id="dec-notes"
                    className="form-textarea"
                    rows={3}
                    placeholder="Provide detailed feedback on feasibility, campus impact, or revision conditions..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setDecisionModalProject(null)} className="btn btn-secondary btn-sm" disabled={decisionLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={decisionLoading}>
                  {decisionLoading ? 'Recording...' : 'Publish Official Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Funding Review Modal */}
      {selectedFunding && (
        <FundingModal
          isOpen={!!selectedFunding}
          onClose={() => setSelectedFunding(null)}
          requestToReview={selectedFunding}
          onSuccess={loadAllQueues}
        />
      )}

      {/* Expense Verify Modal */}
      {selectedExpense && (
        <ExpenseModal
          isOpen={!!selectedExpense}
          onClose={() => setSelectedExpense(null)}
          expenseToVerify={selectedExpense}
          onSuccess={loadAllQueues}
        />
      )}

      {/* Mentorship Respond Modal */}
      {selectedMentorship && (
        <MentorshipModal
          isOpen={!!selectedMentorship}
          onClose={() => setSelectedMentorship(null)}
          requestToRespond={selectedMentorship}
          onSuccess={loadAllQueues}
        />
      )}
    </div>
  );
}
