import React, { useState } from 'react';
import { CloseIcon, AwardIcon, PlusIcon } from './Icons';
import { fundingApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function FundingModal({ isOpen, onClose, project, requestToReview = null, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isReviewMode = !!requestToReview;

  // Submit mode fields
  const [requestedAmount, setRequestedAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [budgetItems, setBudgetItems] = useState([
    { item: 'Hardware microcontrollers & sensors', cost: 200, category: 'Hardware & Components' },
    { item: 'Weather-sealed IP67 housings', cost: 150, category: 'Lab Materials & 3D Print' }
  ]);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCost, setNewItemCost] = useState('');

  // Review mode fields
  const [reviewStatus, setReviewStatus] = useState(requestToReview?.status || 'Approved');
  const [approvedAmount, setApprovedAmount] = useState(requestToReview?.requested_amount || 0);
  const [disbursedAmount, setDisbursedAmount] = useState(requestToReview?.requested_amount || 0);
  const [reviewerNotes, setReviewerNotes] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const totalCalculatedBudget = budgetItems.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

  const handleAddBudgetItem = () => {
    if (newItemDesc.trim() && Number(newItemCost) > 0) {
      setBudgetItems([...budgetItems, { item: newItemDesc.trim(), cost: Number(newItemCost), category: 'Hardware & Components' }]);
      setNewItemDesc('');
      setNewItemCost('');
    }
  };

  const handleRemoveBudgetItem = (idx) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== idx));
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const amt = Number(requestedAmount) || totalCalculatedBudget;

    if (!amt || amt <= 0 || !purpose.trim() || !expectedBenefit.trim()) {
      showToast('Please provide a valid requested amount, purpose, and expected benefit.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fundingApi.submit({
        project_id: project.id,
        requested_amount: amt,
        currency: 'USD',
        purpose: purpose.trim(),
        expected_benefit: expectedBenefit.trim(),
        itemized_budget: budgetItems
      });

      if (res.success) {
        showToast('Grant funding proposal submitted for administrative review!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit funding request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDecision = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fundingApi.review(requestToReview.id, {
        status: reviewStatus,
        approved_amount: Number(approvedAmount) || 0,
        disbursed_amount: Number(disbursedAmount) || 0,
        reviewer_notes: reviewerNotes.trim()
      });

      if (res.success) {
        showToast(`Funding request marked as '${reviewStatus}'!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to record funding decision', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="funding-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 660 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AwardIcon size={18} style={{ color: 'var(--color-success)' }} />
            <h3 id="funding-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              {isReviewMode ? 'Administrative Grant Decision' : 'Submit Project Funding Proposal'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {isReviewMode ? (
          <form onSubmit={handleReviewDecision}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {requestToReview.project_title || 'Campus Initiative'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Requested Amount: <strong>${requestToReview.requested_amount?.toLocaleString()}</strong> • Submitter: {requestToReview.student_name}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Purpose: </strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{requestToReview.purpose}</span>
              </div>

              {/* Itemized Budget Table */}
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Proposed Itemized Budget:
                </span>
                <div style={{ marginTop: '0.4rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {requestToReview.itemized_budget?.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.85rem', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                      <span>{b.item}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>${b.cost}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Controls */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="rev-status">Review Decision</label>
                  <select
                    id="rev-status"
                    className="form-select"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value)}
                  >
                    <option value="Approved">Approved (Grant Awarded)</option>
                    <option value="Released">Released (Disbursed to Project)</option>
                    <option value="Revision Requested">Revision Requested</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="app-amt">Approved Amount ($)</label>
                  <input
                    id="app-amt"
                    type="number"
                    className="form-input"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rev-notes">Reviewer Notes & Justification</label>
                <textarea
                  id="rev-notes"
                  className="form-textarea"
                  rows={3}
                  placeholder="Record grant committee justification or revision details..."
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Recording...' : 'Record Decision'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitRequest}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Submit an itemized grant request for <strong>{project?.title}</strong> to the Campus Incubation Committee.
              </p>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="fnd-amt">
                    Total Funding Requested ($) <span className="req">*</span>
                  </label>
                  <input
                    id="fnd-amt"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1800"
                    value={requestedAmount || (totalCalculatedBudget > 0 ? totalCalculatedBudget : '')}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="fnd-curr">Currency</label>
                  <select id="fnd-curr" className="form-select" disabled>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fnd-purp">
                  Purpose of Funding <span className="req">*</span>
                </label>
                <input
                  id="fnd-purp"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hardware sensor nodes and solar power modules for pilot fleet"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fnd-bene">
                  Expected Campus Impact & Deliverables <span className="req">*</span>
                </label>
                <textarea
                  id="fnd-bene"
                  className="form-textarea"
                  rows={2}
                  placeholder="Explain what milestone will be completed with this grant..."
                  value={expectedBenefit}
                  onChange={(e) => setExpectedBenefit(e.target.value)}
                  required
                />
              </div>

              {/* Itemized Budget Builder */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Itemized Proposed Budget</label>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
                    Calculated Total: ${totalCalculatedBudget}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {budgetItems.map((b, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-raised)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                      <span>{b.item}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>${b.cost}</strong>
                        <button type="button" onClick={() => handleRemoveBudgetItem(idx)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 0 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Line */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Item description (e.g. 5x Breakout boards)"
                    value={newItemDesc}
                    onChange={(e) => setNewItemDesc(e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Cost ($)"
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddBudgetItem} className="btn btn-secondary btn-sm">
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Funding Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
