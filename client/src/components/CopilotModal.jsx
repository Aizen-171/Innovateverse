import React, { useState } from 'react';
import { SparklesIcon, CloseIcon, CheckCircleIcon, TargetIcon, RocketIcon } from './Icons';

export function CopilotModal({ isOpen, onClose, diagnostic, onAdoptMilestones }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'personas' | 'assumptions' | 'mvp' | 'tech' | 'milestones'

  if (!isOpen || !diagnostic) return null;

  const {
    readinessScore = 75,
    subScores = {},
    problemSummary,
    coreValueProp,
    targetUsers = [],
    criticalAssumptions = [],
    suggestedMvp = {},
    technicalApproach = [],
    immediateValidationExperiment,
    suggestedMilestones = [],
    riskAnalysis = []
  } = diagnostic;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 65) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="copilot-modal-title">
      <div
        className="modal-dialog"
        style={{ maxWidth: 820 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <SparklesIcon size={18} />
            </div>
            <div>
              <h3 id="copilot-modal-title" style={{ fontSize: '1.2rem', margin: 0, fontFamily: 'var(--font-display)' }}>
                AI Innovation Copilot Diagnostic
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Autonomous feasibility audit, assumption tests & milestone roadmap
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Close modal">
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Diagnostic Scorecard Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-surface-raised)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Main Readiness Gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                border: `4px solid ${getScoreColor(readinessScore)}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.3)',
                boxShadow: `0 0 20px ${getScoreColor(readinessScore)}33`
              }}
            >
              <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {readinessScore}
              </span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                / 100
              </span>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-blue)', fontWeight: 700 }}>
                Innovation Readiness
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {readinessScore >= 80 ? 'High Validation Potential' : readinessScore >= 65 ? 'Promising - Refine Assumptions' : 'Needs Structural Focus'}
              </div>
            </div>
          </div>

          {/* Sub-scores */}
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Problem Clarity</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: getScoreColor(subScores.problemClarity || 75) }}>
                {subScores.problemClarity || 75}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Feasibility</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: getScoreColor(subScores.feasibility || 75) }}>
                {subScores.feasibility || 75}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Campus Impact</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: getScoreColor(subScores.impact || 75) }}>
                {subScores.impact || 75}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Uniqueness</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: getScoreColor(subScores.uniqueness || 75) }}>
                {subScores.uniqueness || 75}%
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: '0 1rem', overflowX: 'auto' }}>
          {[
            { id: 'summary', label: 'Synthesis' },
            { id: 'personas', label: 'Target Personas' },
            { id: 'assumptions', label: 'Assumptions & Risks' },
            { id: 'mvp', label: 'Lean MVP Scope' },
            { id: 'tech', label: 'Architecture' },
            { id: 'milestones', label: 'Roadmap & Milestones' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn btn-ghost btn-sm"
              style={{
                borderRadius: 0,
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-indigo)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                padding: '0.75rem 1rem'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="modal-body" style={{ minHeight: 280 }}>
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-indigo)', marginBottom: '0.4rem' }}>
                  Problem Statement Synthesis
                </h4>
                <p style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {problemSummary}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-blue)', marginBottom: '0.4rem' }}>
                  Core Value Proposition
                </h4>
                <p style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {coreValueProp}
                </p>
              </div>

              {immediateValidationExperiment && (
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid var(--border-highlight)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <TargetIcon size={16} style={{ color: 'var(--accent-indigo)' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Immediate 3-Day Validation Experiment
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    {immediateValidationExperiment.methodology}
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                    <span><strong>Success Metric:</strong> {immediateValidationExperiment.successMetric}</span>
                    <span><strong>Time:</strong> {immediateValidationExperiment.timeToRun}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'personas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                Identified campus stakeholders and user segments with primary friction points:
              </p>
              {targetUsers.map((p, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {p.persona}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    <strong>Pain Point:</strong> {p.painPoint}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-blue)' }}>
                    📍 Campus Context: {p.campusContext}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'assumptions' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-warning)', marginBottom: '0.65rem' }}>
                  Critical Assumptions to Verify Before Coding
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {criticalAssumptions.map((a, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {a.assumption}
                        </span>
                        <span className="badge" style={{ background: a.riskLevel === 'High' ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)', color: a.riskLevel === 'High' ? '#fca5a5' : '#fde047' }}>
                          {a.riskLevel} Risk
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                        <strong>Validation Method:</strong> {a.testMethod}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {riskAnalysis.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.65rem' }}>
                    Campus Risk Mitigation
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {riskAnalysis.map((r, idx) => (
                      <div key={idx} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{r.risk}:</strong> {r.mitigation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mvp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-surface-raised)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>MVP Strategy: </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{suggestedMvp.rationale}</span>
              </div>

              <div className="grid-2">
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-success)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircleIcon size={16} />
                    <span>Included in Lean v1</span>
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {suggestedMvp.includedFeatures?.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--color-success)' }}>•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fca5a5', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CloseIcon size={16} />
                    <span>Pruned / Excluded for Now</span>
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {suggestedMvp.excludedForNow?.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <span style={{ color: '#fca5a5' }}>•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tech' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {technicalApproach.map((t, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {t.layer}
                    </span>
                    <span className="badge badge-skill">
                      Alternative: {t.alternative}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {t.recommendation}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {t.rationale}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'milestones' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Generated 4-Week Execution Plan:
                </span>
                {onAdoptMilestones && (
                  <button
                    onClick={() => {
                      onAdoptMilestones(suggestedMilestones);
                      onClose();
                    }}
                    className="btn btn-copilot btn-sm"
                  >
                    <RocketIcon size={14} />
                    <span>Adopt Milestones into Project</span>
                  </button>
                )}
              </div>

              {suggestedMilestones.map((m, idx) => (
                <div key={idx} style={{ background: 'var(--bg-surface-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.title}
                    </span>
                    <span className="badge badge-cat">
                      Day {m.targetDays} • {m.phase}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {m.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close Diagnostic
          </button>
          {onAdoptMilestones && (
            <button
              onClick={() => {
                onAdoptMilestones(suggestedMilestones);
                onClose();
              }}
              className="btn btn-copilot btn-sm"
            >
              <RocketIcon size={14} />
              <span>Apply Milestones to Project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
