import React, { useState } from 'react';
import { CloseIcon, ShieldIcon } from './Icons';
import { expenseApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function ExpenseModal({ isOpen, onClose, project, expenseToVerify = null, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const isVerifyMode = !!expenseToVerify;

  // Submit fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Hardware & Components');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');
  const [receiptFilename, setReceiptFilename] = useState('');

  // Verify fields
  const [verifyStatus, setVerifyStatus] = useState(expenseToVerify?.status || 'Verified');
  const [reviewerComments, setReviewerComments] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    const amt = Number(amount);

    if (!title.trim() || !amt || amt <= 0 || !vendor.trim() || !description.trim()) {
      showToast('Please fill out all required fields marked with *', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await expenseApi.submit({
        project_id: project.id,
        title: title.trim(),
        amount: amt,
        category,
        expense_date: expenseDate,
        vendor: vendor.trim(),
        description: description.trim(),
        receipt_filename: receiptFilename.trim() || `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_receipt.pdf`
      });

      if (res.success) {
        showToast('Expense bill submitted for verification!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyExpense = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await expenseApi.verify(expenseToVerify.id, {
        status: verifyStatus,
        reviewer_comments: reviewerComments.trim()
      });

      if (res.success) {
        showToast(`Expense marked as '${verifyStatus}'!`, 'success');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to verify expense', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div className="modal-dialog" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldIcon size={18} style={{ color: 'var(--accent-blue)' }} />
            <h3 id="expense-modal-title" style={{ fontSize: '1.15rem', margin: 0 }}>
              {isVerifyMode ? 'Verify Expense & Bill Receipt' : 'Submit Project Expense Record'}
            </h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {isVerifyMode ? (
          <form onSubmit={handleVerifyExpense}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {expenseToVerify.title}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-success)' }}>
                    ${expenseToVerify.amount?.toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  Vendor: {expenseToVerify.vendor} • Category: {expenseToVerify.category} • Date: {expenseToVerify.expense_date}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Description: </strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>{expenseToVerify.description}</p>
              </div>

              {expenseToVerify.receipt_filename && (
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                  <span>📎 Attached Bill / Receipt:</span>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{expenseToVerify.receipt_filename}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="ver-status">Verification Status Decision</label>
                <select
                  id="ver-status"
                  className="form-select"
                  value={verifyStatus}
                  onChange={(e) => setVerifyStatus(e.target.value)}
                >
                  <option value="Verified">Verified (Eligible Grant Expenditure)</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Revision Requested">Revision Requested (Missing Details)</option>
                  <option value="Rejected">Rejected (Ineligible)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ver-notes">Reviewer Audit Comments</label>
                <textarea
                  id="ver-notes"
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Receipt verified against line item 1 of approved budget."
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Recording...' : 'Record Verification'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmitExpense}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="exp-title">
                  Expense Title / Item <span className="req">*</span>
                </label>
                <input
                  id="exp-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. DigiKey Order #88219 - 6x ESP32 Modules"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="exp-amt">
                    Total Amount ($) <span className="req">*</span>
                  </label>
                  <input
                    id="exp-amt"
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="210.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="exp-cat">Category</label>
                  <select
                    id="exp-cat"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Hardware & Components">Hardware & Components</option>
                    <option value="Cloud & Hosting">Cloud & Hosting</option>
                    <option value="Lab Materials & 3D Print">Lab Materials & 3D Print</option>
                    <option value="Field Testing & Travel">Field Testing & Travel</option>
                    <option value="Software & Tooling">Software & Tooling</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="exp-vend">Vendor / Supplier <span className="req">*</span></label>
                  <input
                    id="exp-vend"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Digi-Key, SparkFun, AWS, Polycase"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="exp-date">Date of Purchase</label>
                  <input
                    id="exp-date"
                    type="date"
                    className="form-input"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="exp-desc">Description of Utilization <span className="req">*</span></label>
                <textarea
                  id="exp-desc"
                  className="form-textarea"
                  rows={2}
                  placeholder="Explain how this expense directly serves project milestones..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="exp-file">Receipt / Invoice Filename</label>
                <input
                  id="exp-file"
                  type="text"
                  className="form-input"
                  placeholder="e.g. digikey_invoice_88219.pdf"
                  value={receiptFilename}
                  onChange={(e) => setReceiptFilename(e.target.value)}
                />
                <span className="form-helper">Uploaded bills are audited by authorized financial reviewers.</span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Expense'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
