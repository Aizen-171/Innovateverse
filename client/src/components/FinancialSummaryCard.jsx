import React, { useState, useEffect, useCallback } from 'react';
import { AwardIcon, PlusIcon, ShieldIcon } from './Icons';
import { financialApi } from '../services/api';

export function FinancialSummaryCard({ projectId, onOpenFundingModal, onOpenExpenseModal, refreshTrigger }) {
  const [financials, setFinancials] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFinancials = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await financialApi.getOverview(projectId);
      if (res.success && res.financials) {
        setFinancials(res.financials);
      }
    } catch (err) {
      console.warn('Error loading financial overview:', err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadFinancials();
  }, [loadFinancials, refreshTrigger]);

  if (loading || !financials) {
    return (
      <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading project financial ledger...
      </div>
    );
  }

  const {
    totalRequested = 0,
    totalApproved = 0,
    totalDisbursed = 0,
    totalVerifiedExpenses = 0,
    totalPendingExpenses = 0,
    remainingBalance = 0,
    burnRatePercent = 0,
    categoryBreakdown = []
  } = financials;

  return (
    <div className="card card-raised" style={{ padding: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            <ShieldIcon size={14} />
            <span>Audited Project Ledger</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', margin: '0.2rem 0 0' }}>
            Fund Utilization & Expenditure Overview
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onOpenExpenseModal && (
            <button onClick={onOpenExpenseModal} className="btn btn-secondary btn-sm">
              <PlusIcon size={14} />
              <span>Submit Bill</span>
            </button>
          )}

          {onOpenFundingModal && (
            <button onClick={onOpenFundingModal} className="btn btn-primary btn-sm">
              <PlusIcon size={14} />
              <span>Request Grant</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Financial Stat Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Approved Funding */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Approved Funding
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            ${totalApproved.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Requested: ${totalRequested.toLocaleString()}
          </div>
        </div>

        {/* Disbursed Funding */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Disbursed Grants
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-indigo)', marginTop: '0.25rem' }}>
            ${totalDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Active Campus Account
          </div>
        </div>

        {/* Verified Expenses */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Verified Expenditure
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
            ${totalVerifiedExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Pending Verification: ${totalPendingExpenses.toFixed(2)}
          </div>
        </div>

        {/* Remaining Balance */}
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', textTransform: 'uppercase', fontWeight: 700 }}>
            Available Balance
          </div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.25rem' }}>
            ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
            Approved - Verified Bills
          </div>
        </div>
      </div>

      {/* Burn Rate Progress Bar */}
      <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Budget Burn Rate</span>
          <span style={{ fontWeight: 700, color: burnRatePercent > 80 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
            {burnRatePercent}% of grant utilized
          </span>
        </div>
        <div style={{ width: '100%', height: 7, background: 'var(--bg-surface-raised)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${burnRatePercent}%`,
              height: '100%',
              background: burnRatePercent > 80
                ? 'var(--color-danger)'
                : 'linear-gradient(90deg, var(--color-success), var(--accent-blue))',
              transition: 'width var(--transition-smooth)'
            }}
          />
        </div>
      </div>

      {/* Verified Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
            Verified Expenditure by Category:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {categoryBreakdown.map((cat, idx) => (
              <div key={idx} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', gap: '0.4rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{cat.category}:</span>
                <strong style={{ color: 'var(--text-primary)' }}>${cat.total_amount?.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
